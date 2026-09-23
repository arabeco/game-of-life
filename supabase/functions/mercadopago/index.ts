import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// --- CONFIGURAÇÕES ---
const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_URL = Deno.env.get("SITE_URL") || "https://glyph-app-arabecos-projects.vercel.app";
const FUNCTION_BASE_URL = `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/mercadopago`;
const MERCADO_PAGO_WEBHOOK_URL = Deno.env.get("MERCADO_PAGO_WEBHOOK_URL") || `${FUNCTION_BASE_URL}/webhook`;
const APP_RETURN_URL = SITE_URL.replace(/\/+$/, "");
const DEFAULT_ALLOWED_ORIGINS = [
  SITE_URL,
  "https://glyph.life",
  "https://app.glyph.life",
  "https://www.glyph.life",
  "https://glyph-app-arabecos-projects.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
];
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || DEFAULT_ALLOWED_ORIGINS.join(","))
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * O PRECO E O PREMIO MORAM AQUI, E NAO NO PEDIDO.
 *
 * Ate 22/09/2026 esta funcao lia `amount` e `goldAmount` do CORPO da
 * requisicao. Quanto se paga e quanto se recebe eram dois campos livres,
 * escolhidos por quem chamava. Com `verify_jwt = false`, o cliente mandando a
 * anon key (que e publica, esta no bundle) e o `userId` tambem vindo do corpo,
 * dava para pagar um centavo, receber o que quisesse e creditar a conta de
 * QUALQUER pessoa — sem app, sem login, sem nem abrir o site.
 *
 * E o pior caso nao era ouro: com `purchaseKind: "membership"` a mesma chamada
 * comprava Platinum por um centavo, entrando pelo caminho legitimo
 * (`process_approved_membership_payment`, service_role). O guard de 14/09, que
 * proibe o cliente de escrever `is_premium`, nao tinha como ver isso.
 *
 * Agora o pedido manda so o ID do produto. Preco, ouro e plano saem desta
 * tabela. Ela e COPIA da de `constants/goldCatalog.ts` porque edge function nao
 * importa do app — e o teste `pagamento-web` trava as duas juntas, para um
 * preco mudar la e nao ficar velho aqui.
 */
type Produto =
  | { kind: "gold"; priceBrl: number; gold: number; label: string }
  | { kind: "membership"; priceBrl: number; tier: "premium" | "platinum"; equivalentGold: number; label: string };

const CATALOGO: Record<string, Produto> = {
  pack_gold_1: { kind: "gold", priceBrl: 5, gold: 50, label: "50 ouro" },
  pack_gold_2: { kind: "gold", priceBrl: 10, gold: 110, label: "110 ouro" },
  pack_gold_3: { kind: "gold", priceBrl: 20, gold: 230, label: "230 ouro" },
  pack_gold_4: { kind: "gold", priceBrl: 50, gold: 600, label: "600 ouro" },
  pack_gold_5: { kind: "gold", priceBrl: 100, gold: 1300, label: "1300 ouro" },
  premium_30d: { kind: "membership", priceBrl: 17.9, tier: "premium", equivalentGold: 200, label: "Premium 30d" },
  platinum_30d: { kind: "membership", priceBrl: 44.9, tier: "platinum", equivalentGold: 500, label: "Platinum 30d" },
};

/**
 * QUEM PAGA E QUEM O TOKEN DIZ, E NAO QUEM O CORPO AFIRMA.
 *
 * A anon key e recusada de proposito: ela identifica o PROJETO, nao a pessoa, e
 * era exatamente o que o app mandava antes. Sem sessao de verdade nao ha compra.
 */
const usuarioDoToken = async (req: Request): Promise<string | null> => {
  const header = req.headers.get("authorization") || "";
  const token = header.slice(0, 7).toLowerCase() === "bearer " ? header.slice(7).trim() : "";
  if (!token || token === Deno.env.get("SUPABASE_ANON_KEY")) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return data.user.id;
  } catch {
    return null;
  }
};

/** Centavos batem; float nao. 17.9 e 44.9 existem no catalogo. */
const mesmoValor = (a: unknown, b: number) => Math.round(Number(a || 0) * 100) === Math.round(b * 100);

/**
 * A assinatura do Mercado Pago, quando ha segredo configurado.
 *
 * O manifesto e o formato que eles publicam: id, request-id e ts, na ordem, com
 * HMAC-SHA256. Sem `MERCADO_PAGO_WEBHOOK_SECRET` isto devolve true e o controle
 * que sobra e a re-consulta na API — que ja e forte, porque o status vem da
 * fonte. Configurar o segredo fecha tambem a porta de alguem gastar a nossa cota
 * mandando notificacao falsa.
 */
const assinaturaConfere = async (req: Request, dataId: string): Promise<boolean> => {
  const segredo = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET") || "";
  if (!segredo) {
    console.warn("[Glyph Pay] MERCADO_PAGO_WEBHOOK_SECRET ausente: seguindo so com a conferencia na API.");
    return true;
  }
  const assinatura = req.headers.get("x-signature") || "";
  const requestId = req.headers.get("x-request-id") || "";
  const partes = Object.fromEntries(
    assinatura.split(",").map((parte) => parte.split("=").map((valor) => valor.trim())).filter((par) => par.length === 2),
  ) as Record<string, string>;
  if (!partes.ts || !partes.v1) return false;
  const manifesto = `id:${dataId};request-id:${requestId};ts:${partes.ts};`;
  const chave = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(manifesto)));
  const esperado = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (esperado.length !== partes.v1.length) return false;
  let diferenca = 0;
  for (let i = 0; i < esperado.length; i += 1) diferenca |= esperado.charCodeAt(i) ^ partes.v1.charCodeAt(i);
  return diferenca === 0;
};

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

const maskEmail = (value: string) => {
  const email = String(value || "").trim().toLowerCase();
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "";
  if (localPart.length <= 2) return `${localPart[0] || "*"}***@${domain}`;
  return `${localPart.slice(0, 2)}***@${domain}`;
};

const buildSafePaymentMetadata = (paymentData: any) => {
  const payer = paymentData?.payer || {};
  const identification = payer?.identification || {};
  const rawDocument = String(identification?.number || "");
  const sanitizedDocument = sanitizeCpf(rawDocument);
  const lastName = String(payer?.last_name || "").trim();

  return {
    mercado_pago: {
      id: paymentData?.id ?? null,
      status: paymentData?.status ?? null,
      status_detail: paymentData?.status_detail ?? null,
      payment_method_id: paymentData?.payment_method_id ?? null,
      payment_type_id: paymentData?.payment_type_id ?? null,
      transaction_amount: paymentData?.transaction_amount ?? null,
      currency_id: paymentData?.currency_id ?? null,
      date_created: paymentData?.date_created ?? null,
      date_approved: paymentData?.date_approved ?? null,
      date_last_updated: paymentData?.date_last_updated ?? null,
    },
    glyph_purchase: {
      user_id: paymentData?.metadata?.user_id ?? null,
      purchase_kind: paymentData?.metadata?.purchase_kind ?? "gold",
      product_id: paymentData?.metadata?.product_id ?? null,
      product_label: paymentData?.metadata?.product_label ?? null,
      membership_tier: paymentData?.metadata?.membership_tier ?? null,
      equivalent_gold: paymentData?.metadata?.equivalent_gold ?? null,
      gold_amount: paymentData?.metadata?.gold_amount ?? null,
      amount_paid: paymentData?.metadata?.amount_paid ?? null,
    },
    payer: {
      first_name: String(payer?.first_name || "").trim() || null,
      last_name_initial: lastName ? `${lastName[0]}.` : null,
      email_masked: maskEmail(payer?.email || ""),
      identification_type: identification?.type || null,
      cpf_last4: sanitizedDocument ? sanitizedDocument.slice(-4) : null,
    },
  };
};

const normalizeOrigin = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
};

const NORMALIZED_ALLOWED_ORIGINS = ALLOWED_ORIGINS.map((origin) => normalizeOrigin(origin));
const ALLOWED_HOST_SUFFIXES = [
  "glyph.life",
  "vercel.app",
  "localhost",
  "127.0.0.1",
];

const isAllowedOriginValue = (origin: string | null) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  if (NORMALIZED_ALLOWED_ORIGINS.includes(normalized)) return true;

  try {
    const hostname = new URL(normalized).hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
};

const buildCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": normalizeOrigin(origin || ALLOWED_ORIGINS[0] || ""),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const isAllowedOrigin = isAllowedOriginValue(origin);
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
    // O ENDPOINT /checkout FOI REMOVIDO EM 22/09/2026.
    //
    // Nada no app o chamava — o unico caminho de compra e /process_payment —,
    // e ele criava preferencia do Mercado Pago com preco e metadata escolhidos
    // pelo corpo da requisicao. Endpoint de pagamento sem chamador e superficie
    // de ataque sem contrapartida.

    // --- 2. ENDPOINT DE PROCESSAMENTO (CRIAR PAGAMENTO REAL) ---
    if (url.pathname.endsWith("/process_payment")) {
      const corpo = await req.json();
      const formData = corpo?.formData;

      // Quem paga sai do TOKEN. `userId` no corpo e ignorado de proposito.
      const userId = await usuarioDoToken(req);
      if (!userId) {
        return new Response(JSON.stringify({ error: "Sessao necessaria para pagar." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      // Preco e premio saem do CATALOGO. O corpo escolhe o produto, nao o valor.
      const productId = String(corpo?.productId || "").trim();
      const produto = CATALOGO[productId];
      if (!produto) {
        return new Response(JSON.stringify({ error: "Produto invalido." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const amount = produto.priceBrl;
      const normalizedPurchaseKind = produto.kind;
      const normalizedMembershipTier = produto.kind === "membership" ? produto.tier : null;
      const goldAmount = produto.kind === "gold" ? produto.gold : 0;
      const equivalentGold = produto.kind === "gold" ? produto.gold : produto.equivalentGold;
      const productLabel = produto.label;
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
            purchase_kind: normalizedPurchaseKind,
            product_id: productId,
            product_label: productLabel,
            membership_tier: normalizedMembershipTier,
            equivalent_gold: equivalentGold,
            gold_amount: goldAmount,
            amount_paid: amount
          },
          notification_url: MERCADO_PAGO_WEBHOOK_URL,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("[Glyph Pay] Erro MP Detalhado:", JSON.stringify({
          message: data?.message || null,
          error: data?.error || null,
          cause: data?.cause || null,
          status: data?.status || null,
        }));
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

      // A NOTIFICACAO NAO E PROVA DE NADA. Ela so diz qual pagamento olhar.
      if (!(await assinaturaConfere(req, String(paymentId)))) {
        console.warn(`[Glyph Pay] Assinatura invalida para ${paymentId}. Ignorado.`);
        return new Response("Invalid signature", { status: 200 });
      }

      // Buscar detalhes oficiais do pagamento no Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { "Authorization": `Bearer ${MP_ACCESS_TOKEN}` },
      });
      
      // SEM A RESPOSTA DA API, NAO HA O QUE PROCESSAR.
      //
      // Aqui havia um fallback que seguia em frente quando a busca falhava,
      // desde que o CORPO da notificacao dissesse "payment.updated" — ou seja,
      // confiava na parte que qualquer um escreve. Devolver 200 sem creditar faz
      // o Mercado Pago reenviar; e assim que se trata falha de rede.
      if (!mpResponse.ok) {
        console.error(`[Glyph Pay] Falha ao buscar ${paymentId} na API. Status ${mpResponse.status}.`);
        return new Response("Error fetching details", { status: 200 });
      }

      const paymentData = await mpResponse.json();

      // Se o pagamento foi aprovado, creditar o ouro via RPC
      if (paymentData.status === "approved") {
        const { user_id } = paymentData.metadata || {};

        // O QUE FOI COBRADO TEM DE SER O PRECO DO PRODUTO.
        //
        // O metadata hoje e escrito por esta funcao, entao ja e confiavel. Esta
        // conferencia e a segunda tranca: se algum dia alguem conseguir plantar
        // metadata, ainda precisaria ter PAGO o valor de tabela para receber.
        const produto = CATALOGO[String(paymentData?.metadata?.product_id || "")];
        if (!produto) {
          console.error(`[Glyph Pay] Pagamento ${paymentId} sem produto de catalogo. Nada creditado.`);
          return new Response("Unknown product", { status: 200 });
        }
        if (!mesmoValor(paymentData?.transaction_amount, produto.priceBrl)) {
          console.error(`[Glyph Pay] Pagamento ${paymentId}: cobrado ${paymentData?.transaction_amount}, tabela ${produto.priceBrl}. Nada creditado.`);
          return new Response("Amount mismatch", { status: 200 });
        }
        if (!user_id) {
          console.error(`[Glyph Pay] Pagamento ${paymentId} sem user_id. Nada creditado.`);
          return new Response("Missing user", { status: 200 });
        }
        const safeMetadata = buildSafePaymentMetadata(paymentData);
        // O QUE SE CREDITA SAI DO CATALOGO, e nao do metadata.
        //
        // Depois de conferir o produto e o valor cobrado, ler a quantidade do
        // metadata seria voltar a confiar no texto quando ja se tem a fonte.
        const rpcName = produto.kind === "membership"
          ? "process_approved_membership_payment"
          : "process_approved_payment";
        const rpcPayload = produto.kind === "membership"
          ? {
              p_user_id: user_id,
              p_payment_id: paymentId.toString(),
              p_membership_tier: produto.tier,
              p_amount_paid: Number(paymentData.transaction_amount),
              p_metadata: safeMetadata,
            }
          : {
              p_user_id: user_id,
              p_payment_id: paymentId.toString(),
              p_gold_amount: produto.gold,
              p_amount_paid: Number(paymentData.transaction_amount),
              p_metadata: safeMetadata,
            };

        const { error } = await supabase.rpc(rpcName, rpcPayload as Record<string, unknown>);

        if (error) {
          console.error("RPC Error:", error);
          throw error;
        }
        
        console.log(`[Glyph Pay] Sucesso: ${produto.label} para ${user_id}`);
      }

      return new Response("OK", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    // `error` e `unknown` porque qualquer coisa pode ser lancada, e nem tudo
    // tem `.message`. Ler o campo direto rendia `{"error": undefined}`, que
    // vira `{}` no JSON: o unico lugar que explicaria a falha de um pagamento
    // devolvia uma chave vazia.
    const motivo = error instanceof Error ? error.message : String(error);
    console.error("[Glyph Pay] Fatal Error:", motivo);
    return new Response(JSON.stringify({ error: motivo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
