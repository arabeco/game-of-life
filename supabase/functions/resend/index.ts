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

    // Payload structure from Supabase Webhook on 'notifications' table
    // NEW contains the row data
    const notification = payload.record || payload.new || payload;
    
    // We expect the trigger to have identified the recipient email and passed it, 
    // or we fetch it here. Since the trigger draft didn't pass it in JSON, 
    // let's assume we might need to fetch it if not provided.
    // However, to keep it simple and robust, we expect the webhook to be configured 
    // such that it only triggers for notifications that need email.

    // If the trigger was configured via Supabase Dashboard UI, it might just send the record.
    // Let's use a generic subject/body for now based on 'type'.

    const type = notification.type;
    const content = notification.content;
    const userId = notification.user_id;

    // Ideally we fetch the email here using service_role if not in payload
    // For now, let's assume the developer will set up the SQL to include the email 
    // in metadata or we modify the trigger.
    
    const email = notification.metadata?.email || "contato@glyph.life"; // Fallback/Placeholder
    
    if (email === "contato@glyph.life") {
       console.warn("No recipient email found in metadata. using fallback.");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Oráculo <no-reply@glyph.life>",
        to: email,
        subject: `Novo sinal no Oráculo: ${type}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #6366f1;">Olá!</h2>
            <p>Você recebeu uma nova notificação do sistema <strong>Glyph</strong>:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              ${content}
            </div>
            <p style="font-size: 12px; color: #666;">Acesse o app para responder ou ver mais detalhes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 10px; color: #999;">Glyph - Oráculo de Maestria</p>
          </div>
        `,
      }),
    });

    const resData = await res.json();
    return new Response(JSON.stringify(resData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Resend Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
