import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ALLOWED_ORIGINS = (
  Deno.env.get("ALLOWED_ORIGINS") ||
  "https://glyph-app-arabecos-projects.vercel.app,http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || ALLOWED_ORIGINS[0] || "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

const normalizeErrorMessage = (error: unknown) => {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const listBucketFilesRecursively = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string,
): Promise<string[]> => {
  const collected: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabaseAdmin.storage.from(bucket).list(prefix, {
      limit: 100,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`Storage list failed for ${prefix}: ${error.message}`);
    }

    const entries = data || [];
    for (const entry of entries) {
      const childPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) {
        collected.push(childPath);
      } else {
        const nested = await listBucketFilesRecursively(supabaseAdmin, bucket, childPath);
        collected.push(...nested);
      }
    }

    if (entries.length < 100) {
      break;
    }

    offset += entries.length;
  }

  return collected;
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const isAllowedOrigin = !origin || ALLOWED_ORIGINS.includes(origin);
  const corsHeaders = buildCorsHeaders(origin && isAllowedOrigin ? origin : null);

  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin) return new Response("Forbidden origin", { status: 403, headers: corsHeaders });
    return new Response("ok", { headers: corsHeaders });
  }

  if (!isAllowedOrigin) {
    return new Response("Forbidden origin", { status: 403, headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Function misconfigured: missing Supabase secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing authorization header." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !authData?.user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const userId = authData.user.id;
  const storagePrefixes = [`slots/${userId}`];
  let deletionRequestId: number | null = null;
  let removedFiles: string[] = [];

  try {
    const { data: deletionRequest, error: requestError } = await supabaseAdmin
      .from("account_deletion_requests")
      .insert({
        user_id: userId,
        status: "started",
        metadata: {
          deleted_via: "edge_function",
          storage_prefixes: storagePrefixes,
        },
      })
      .select("id")
      .single();

    if (requestError) {
      throw new Error(`Failed to log deletion request: ${requestError.message}`);
    }

    deletionRequestId = Number(deletionRequest.id);

    for (const prefix of storagePrefixes) {
      const files = await listBucketFilesRecursively(supabaseAdmin, "user-images", prefix);
      if (files.length === 0) continue;

      const { error: removeError } = await supabaseAdmin.storage.from("user-images").remove(files);
      if (removeError) {
        throw new Error(`Failed to remove storage objects: ${removeError.message}`);
      }

      removedFiles = removedFiles.concat(files);
    }

    const { data: cleanupData, error: cleanupError } = await supabaseAdmin.rpc("delete_account_data_for_user", {
      p_user_id: userId,
    });

    if (cleanupError) {
      throw new Error(`Failed to delete account data: ${cleanupError.message}`);
    }

    if (cleanupData?.success === false) {
      throw new Error(cleanupData.error || "Failed to delete account data.");
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      throw new Error(`Failed to delete auth user: ${deleteUserError.message}`);
    }

    if (deletionRequestId !== null) {
      await supabaseAdmin
        .from("account_deletion_requests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          metadata: {
            deleted_via: "edge_function",
            storage_prefixes: storagePrefixes,
            storage_removed_count: removedFiles.length,
            auth_deleted: true,
          },
        })
        .eq("id", deletionRequestId);
    }

    return new Response(
      JSON.stringify({ success: true, storageRemovedCount: removedFiles.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = normalizeErrorMessage(error);

    if (deletionRequestId !== null) {
      await supabaseAdmin
        .from("account_deletion_requests")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          metadata: {
            deleted_via: "edge_function",
            storage_prefixes: storagePrefixes,
            storage_removed_count: removedFiles.length,
            error: message,
          },
        })
        .eq("id", deletionRequestId);
    }

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
