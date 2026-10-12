import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { createDeletionEmailHandler } from "./handler.ts";

const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const url = Deno.env.get("SUPABASE_URL") || "";
serve(createDeletionEmailHandler({
  serviceKey,
  apiKey: Deno.env.get("RESEND_API_KEY") || "",
  from: Deno.env.get("RESEND_FROM_EMAIL") || "Glyph <no-reply@glyph.life>",
  admin: url && serviceKey ? createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  }) : null,
}));
