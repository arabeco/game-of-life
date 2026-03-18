import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY secret.");
    }

    const payload = await req.json();
    console.log("Resend Webhook Payload:", payload);

    const notification = payload.record || payload.new || payload;
    const metadata = notification?.metadata ?? {};
    const type = notification?.type ?? "system";
    const content = notification?.content ?? "";
    const shouldSendEmail = metadata.sendEmail === true || metadata.welcome === true;
    const email = typeof metadata.email === "string" ? metadata.email.trim() : "";
    const subject =
      typeof metadata.emailSubject === "string" && metadata.emailSubject.trim()
        ? metadata.emailSubject.trim()
        : `Novo sinal no Oraculo: ${type}`;

    if (!shouldSendEmail) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "notification_not_marked_for_email" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!email) {
      console.warn("No recipient email found in notification metadata.");
      return new Response(
        JSON.stringify({ skipped: true, reason: "missing_recipient_email" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Oraculo <no-reply@glyph.life>",
        to: email,
        subject,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #6366f1;">Ola!</h2>
            <p>Voce recebeu uma nova notificacao do sistema <strong>Glyph</strong>:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              ${content}
            </div>
            <p style="font-size: 12px; color: #666;">Acesse o app para responder ou ver mais detalhes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 10px; color: #999;">Glyph - Oraculo de Maestria</p>
          </div>
        `,
      }),
    });

    const resData = await res.json();

    if (!res.ok) {
      throw new Error(resData?.message || resData?.error || "Resend API request failed.");
    }

    return new Response(JSON.stringify(resData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown resend error.";
    console.error("Resend Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
