import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const OPENROUTER_MODEL = Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.0-flash-001";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://app.glyph.life";
const ALLOWED_ORIGINS = (
  Deno.env.get("ALLOWED_ORIGINS") ||
  "https://app.glyph.life,https://www.glyph.life,https://glyph.life,https://glyph-app-arabecos-projects.vercel.app,http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
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

  if (!OPENROUTER_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({ error: "Function misconfigured: missing secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: authData, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !authData?.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized request." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const systemPrompt = String(body?.systemPrompt || "").trim();
    const userPrompt = String(body?.userPrompt || "").trim();
    const model = String(body?.model || OPENROUTER_MODEL).trim() || OPENROUTER_MODEL;
    const referer = origin || SITE_URL;

    if (!systemPrompt || !userPrompt) {
      return new Response(
        JSON.stringify({ error: "systemPrompt and userPrompt are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": "GLYPH",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    const upstreamData = await upstream.json();

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: "OpenRouter request failed.", details: upstreamData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const text = upstreamData?.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid OpenRouter response format.", details: upstreamData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Unexpected error in oracle function.", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
