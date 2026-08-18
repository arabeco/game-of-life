import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ALLOWED_ORIGINS = (
  Deno.env.get("ALLOWED_ORIGINS") ||
  "https://app.glyph.life,https://www.glyph.life,https://glyph.life,https://glyph-app-arabecos-projects.vercel.app,http://localhost:3000,http://localhost:5173"
)

  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalDevOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

const isVercelPreviewOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
};

const isGlyphOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  return /^https:\/\/([a-z0-9-]+\.)?glyph\.life$/i.test(origin);
};

const isAllowedRequestOrigin = (origin: string | null): boolean => {
  return (
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    isLocalDevOrigin(origin) ||
    isVercelPreviewOrigin(origin) ||
    isGlyphOrigin(origin)
  );
};

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

const isAuthUserAlreadyMissing = (message: string): boolean => {
  const normalized = message.toLowerCase();
  return normalized.includes("user not found") || normalized.includes("not found");
};

serve(async (req) => {
  const origin = req.headers.get("origin");
  const isAllowedOrigin = isAllowedRequestOrigin(origin);
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

  let payload: { blockReentry?: boolean; reason?: string } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing authorization header." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing bearer token." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await supabaseUser.auth.getUser(accessToken);
  if (authError || !authData?.user) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized request." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const userId = authData.user.id;
  const userEmail = String(authData.user.email || "").trim();
  const userProvider = String(authData.user.app_metadata?.provider || authData.user.user_metadata?.provider || "").trim();
  const blockReentry = payload.blockReentry === true;
  const deletionReason = typeof payload.reason === "string" && payload.reason.trim() ? payload.reason.trim() : null;
  let deletionRequestId: number | null = null;
  let removedFiles: string[] = [];
  let deletionEmailStatus = userEmail ? "pending" : "skipped_missing_email";

  try {
    const { data: deletionRequest, error: requestError } = await supabaseAdmin
      .from("account_deletion_requests")
      .insert({
        user_id: userId,
        status: "started",
        metadata: {
          deleted_via: "edge_function",
          storage_cleanup: "all-owned-objects",
          block_reentry: blockReentry,
          reason: deletionReason,
        },
      })
      .select("id")
      .single();

    if (requestError) {
      throw new Error(`Failed to log deletion request: ${requestError.message}`);
    }

    deletionRequestId = Number(deletionRequest.id);

    if (!blockReentry) {
      const { data: releaseData, error: releaseError } = await supabaseAdmin.rpc("release_golden_invite_claim_for_user", {
        p_user_id: userId,
      });

      if (releaseError) {
        throw new Error(`Failed to release provisional golden invite: ${releaseError.message}`);
      }

      if (releaseData?.success === false) {
        throw new Error(releaseData.error || "Failed to release provisional golden invite.");
      }
    }

    if (blockReentry && userEmail) {
      const { data: blockData, error: blockError } = await supabaseAdmin.rpc("register_deleted_account_block", {
        p_email: userEmail,
        p_user_id: userId,
        p_provider: userProvider || null,
        p_reason: deletionReason || "user_requested_account_deletion",
        p_metadata: {
          source: "account-delete-edge-function",
          request_id: deletionRequestId,
        },
      });

      if (blockError) {
        throw new Error(`Failed to register deleted account block: ${blockError.message}`);
      }

      if (blockData?.success === false) {
        throw new Error(blockData.error || "Failed to register deleted account block.");
      }
    }

    const { data: storageObjects, error: storageListError } = await supabaseAdmin.rpc(
      "list_account_storage_objects",
      { p_user_id: userId },
    );
    if (storageListError) {
      throw new Error(`Failed to list account storage objects: ${storageListError.message}`);
    }

    const filesByBucket = new Map<string, string[]>();
    for (const entry of storageObjects || []) {
      const bucket = String(entry.bucket_id || "").trim();
      const objectName = String(entry.object_name || "").trim();
      if (!bucket || !objectName) continue;
      filesByBucket.set(bucket, [...(filesByBucket.get(bucket) || []), objectName]);
    }

    for (const [bucket, files] of filesByBucket.entries()) {
      for (let index = 0; index < files.length; index += 100) {
        const batch = files.slice(index, index + 100);
        const { error: removeError } = await supabaseAdmin.storage.from(bucket).remove(batch);
        if (removeError) {
          throw new Error(`Failed to remove storage objects from ${bucket}: ${removeError.message}`);
        }
        removedFiles = removedFiles.concat(batch.map((name) => `${bucket}/${name}`));
      }
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
    if (deleteUserError && !isAuthUserAlreadyMissing(deleteUserError.message || "")) {
      throw new Error(`Failed to delete auth user: ${deleteUserError.message}`);
    }

    if (userEmail) {
      try {
        const { data: emailData, error: emailError } = await supabaseAdmin.functions.invoke("resend", {
          body: {
            type: "account_deleted",
            content: "Sua conta e os dados associados foram excluidos permanentemente. Se voltar ao Glyph no futuro, uma nova conta comecara vazia.",
            metadata: {
              sendEmail: true,
              accountDeleted: true,
              email: userEmail,
              dispatchKey: `account-deleted:${deletionRequestId}`,
            },
          },
        });

        deletionEmailStatus = emailError || emailData?.error || emailData?.skipped ? "failed" : "sent";
      } catch (emailError) {
        console.warn("Account deletion email failed without blocking deletion:", normalizeErrorMessage(emailError));
        deletionEmailStatus = "failed";
      }
    }

    if (deletionRequestId !== null) {
      await supabaseAdmin
        .from("account_deletion_requests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          metadata: {
            deleted_via: "edge_function",
            storage_cleanup: "all-owned-objects",
            storage_removed_count: removedFiles.length,
            auth_deleted: true,
            clan_outcome: cleanupData?.clan_outcome ?? null,
            deletion_email_status: deletionEmailStatus,
            block_reentry: blockReentry,
            reason: deletionReason,
          },
        })
        .eq("id", deletionRequestId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        storageRemovedCount: removedFiles.length,
        clanOutcome: cleanupData?.clan_outcome ?? null,
        deletionEmailStatus,
      }),
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
            storage_removed_count: removedFiles.length,
            block_reentry: blockReentry,
            reason: deletionReason,
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
