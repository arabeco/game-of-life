import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildOracleCommandDraft } from "../_shared/oracle-vnext-shared.ts";

const ALLOWED_ORIGINS = (
  Deno.env.get("ALLOWED_ORIGINS") ||
  "https://app.glyph.life,https://www.glyph.life,https://glyph.life,http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const buildCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0] || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
};

serve(async (request) => {
  const headers = buildCorsHeaders(request.headers.get("origin"));

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text : "";
    const today = typeof body?.today === "string"
      ? body.today
      : new Date().toISOString().slice(0, 10);

    if (!text.trim()) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers,
      });
    }

    return new Response(JSON.stringify({
      draft: buildOracleCommandDraft(text, today),
    }), { headers });
  } catch (error) {
    console.error("oracle-command error", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers,
    });
  }
});
