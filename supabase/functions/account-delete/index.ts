import { processAccountDeletion } from "../_shared/accountDeletion.ts";
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

  let payload: { blockReentry?: boolean; reason?: string; source?: string } = {};
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


  try {
    const { data: claim, error } = await supabaseAdmin.rpc('begin_account_deletion', {
      p_user_id: authData.user.id,
      p_metadata: {
        identity_verified: true,
        deleted_via: payload.source === 'website' ? 'website' : 'app',
        user_email: authData.user.email || null,
        user_provider: authData.user.app_metadata?.provider || null,
        block_reentry: payload.blockReentry === true,
        reason: typeof payload.reason === 'string' ? payload.reason.slice(0, 1000) : null,
      },
    });
    if (error) throw error;
    if (claim.busy) return new Response(JSON.stringify({success:false, requestId:claim.request.id, error:'Seu pedido já está em processamento. Aguarde um momento.'}), {status:409,headers:{...corsHeaders,'Content-Type':'application/json'}});
    const result = await processAccountDeletion(supabaseAdmin, claim.request);
    return new Response(JSON.stringify(result), {status:result.success ? 200 : 503,headers:{...corsHeaders,'Content-Type':'application/json'}});
  } catch (error) {
    console.error('Account deletion failed:', normalizeErrorMessage(error));
    return new Response(JSON.stringify({success:false,error:'Não foi possível confirmar a exclusão. Tente novamente.'}), {status:500,headers:{...corsHeaders,'Content-Type':'application/json'}});
  }
});
