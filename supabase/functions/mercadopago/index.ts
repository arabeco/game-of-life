import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// --- CONFIGURAÇÕES ---
const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://glyph-app-arabecos-projects.vercel.app";
const VERCEL_URL = `${SITE_URL}?_vercel_share=60aVDYM4ZOqZSA65zTG1QyOiBfnTIl6s`;
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || `${SITE_URL},http://localhost:3000,http://localhost:5173`).split(",").map(o => o.trim()).filter(Boolean);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeFullName = (value: string) => String(value || "").replace(/\s+/g, " ").trim();
const sanitizeCpf = (value: string) => String(value || "").replace(/\D/g, "").slice(0, 11);

const isValidEmail = (value: string) => EMAIL_REGEX.test(String(value || "").trim());
const isValidFullName = (value: string) => {
  const normalized = normalizeFullName(value);
  const parts = normalized.split(" ").filter(Boolean);
  return normalized.length >= 5 && parts.length >= 2 && parts.every((part) => part.length >= 2);
};

const isValidCpf = (value: string) => {
  const digits = sanitizeCpf(value);
  if (!/^\d{11}$/.test(digits)) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(digits[10]);
};

const splitFullName = (value: string) => {
  const normalized = normalizeFullName(value);
  const parts = normalized.split(" ").filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
};

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || ALLOWED_ORIGINS[0] || "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

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
          notification_url: `https://klmsdcncmhtgnlcejzdi.supabase.co/functions/v1/mercadopago/webhook`,
          auto_return: "approved",
          back_urls: {
            success: `${VERCEL_URL}&payment=success`,
            failure: `${VERCEL_URL}&payment=failure`,
            pending: `${VERCEL_URL}&payment=pending`,
          },
        }),
      });

      const data = await response.json();
      return new Response(JSON.stringify({ preferenceId: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // --- 2. ENDPOINT DE PROCESSAMENTO (CRIAR PAGAMENTO REAL) ---
    if (url.pathname.endsWith("/process_payment")) {
      const { formData, userId, goldAmount, amount } = await req.json();
      const payerEmail = String(formData?.payer?.email || "").trim();
      const payerFullName = normalizeFullName(formData?.payer?.fullName || "");
      const payerCpf = sanitizeCpf(formData?.payer?.cpf || "");

      if (!isValidEmail(payerEmail)) {
        return new Response(JSON.stringify({ error: "E-mail do pagador invalido." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      if (!isValidFullName(payerFullName)) {
        return new Response(JSON.stringify({ error: "Nome completo do pagador invalido." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      if (!isValidCpf(payerCpf)) {
        return new Response(JSON.stringify({ error: "CPF do pagador invalido." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const { firstName, lastName } = splitFullName(payerFullName);

      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({
          transaction_amount: amount,
          payment_method_id: "pix",
          payer: {
            email: payerEmail,
            first_name: firstName,
            last_name: lastName,
            identification: {
              type: "CPF",
              number: payerCpf
            }
          },
          metadata: {
            user_id: userId,
            gold_amount: goldAmount,
            amount_paid: amount
          },
          notification_url: "https://klmsdcncmhtgnlcejzdi.supabase.co/functions/v1/mercadopago/webhook",
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("[Glyph Pay] Erro MP Detalhado:", JSON.stringify(data));
        return new Response(JSON.stringify({ 
          error: data.message || "Erro MP", 
          status: "error",
          id: null 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Retornamos 200 para evitar o 403 do Supabase
        });
      }

      return new Response(JSON.stringify({
        id: data.id,
        status: data.status,
        status_detail: data.status_detail,
        point_of_interaction: data.point_of_interaction
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // --- 3. ENDPOINT DE WEBHOOK (NOTIFICAÇÃO DE PAGAMENTO) ---
    if (path.endsWith("/webhook")) {
      const body = await req.json();
      const paymentId = body.data?.id || (body.type === "payment" ? body.resource?.split("/").pop() : null);

      if (!paymentId) {
        return new Response("Ignored: No payment ID", { status: 200 });
      }

      // Buscar detalhes oficiais do pagamento no Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
      });
      
      if (!mpResponse.ok) {
        // Se der erro na busca (comum em sandbox), vamos logar e tentar prosseguir se o body tiver info
        console.error(`[Glyph Pay] Erro ao buscar detalhes do pagamento ${paymentId}. Status: ${mpResponse.status}`);
        
        // Tentar buscar do banco se já existe (fallback)
        if (body.action === "payment.updated" || body.status === "approved") {
           // Se a notificação já diz que aprovou, tentamos processar com o que temos
        } else {
           return new Response("Error fetching details", { status: 200 }); // Retorna 200 pro MP não reenviar
        }
      }

      const paymentData = await mpResponse.json();

      // Se o pagamento foi aprovado, creditar o ouro via RPC
      if (paymentData.status === "approved") {
        const { user_id, gold_amount, amount_paid } = paymentData.metadata;

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
