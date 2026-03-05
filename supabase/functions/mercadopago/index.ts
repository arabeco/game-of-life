import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// --- CONFIGURAÇÕES ---
const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const VERCEL_URL = "https://glyph-app-arabecos-projects.vercel.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": VERCEL_URL, // Apenas sua URL da Vercel
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Gerenciar preflight requests do CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    // --- 1. ENDPOINT DE CHECKOUT (CRIAR PREFERÊNCIA) ---
    if (path.endsWith("/checkout")) {
      const { userId, goldAmount, amount } = await req.json();

      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              id: `gold_pack_${goldAmount}`,
              title: `Pacote de Ouro: ${goldAmount} unidades`,
              quantity: 1,
              unit_price: amount,
              currency_id: "BRL",
            }
          ],
          metadata: {
            user_id: userId,
            gold_amount: goldAmount,
            amount_paid: amount
          },
          // O Mercado Pago notificará este mesmo endpoint no path /webhook
          notification_url: `${url.origin}${url.pathname.replace('/checkout', '/webhook')}`,
          auto_return: "approved",
          back_urls: {
            success: `${VERCEL_URL}/?payment=success`,
            failure: `${VERCEL_URL}/?payment=failure`,
            pending: `${VERCEL_URL}/?payment=pending`,
          },
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify({ preferenceId: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // --- 2. ENDPOINT DE WEBHOOK (NOTIFICAÇÃO DE PAGAMENTO) ---
    if (path.endsWith("/webhook")) {
      const body = await req.json();
      
      // O MP envia notificações de vários tipos, queremos apenas pagamentos
      const paymentId = body.data?.id || (body.type === "payment" ? body.resource?.split("/").pop() : null);

      if (!paymentId) {
        return new Response("Ignored: No payment ID", { status: 200 });
      }

      // Buscar detalhes oficiais do pagamento no Mercado Pago para segurança
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
      });
      
      if (!mpResponse.ok) {
        return new Response("Error fetching payment details", { status: 500 });
      }

      const paymentData = await mpResponse.json();

      // Se o pagamento foi aprovado, creditar o ouro via RPC
      if (paymentData.status === "approved") {
        const { user_id, gold_amount, amount_paid } = paymentData.metadata;

        // Chamar a função SQL process_approved_payment que você rodou no banco
        const { error } = await supabase.rpc("process_approved_payment", {
          p_user_id: user_id,
          p_payment_id: paymentId.toString(),
          p_gold_amount: parseInt(gold_amount),
          p_amount_paid: parseFloat(amount_paid),
          p_metadata: paymentData
        });

        if (error) {
          console.error("RPC Error:", error);
          throw error;
        }
        
        console.log(`[Glyph Pay] Sucesso: ${gold_amount} ouros para ${user_id}`);
      }

      return new Response("OK", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    console.error("[Glyph Pay] Fatal Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
