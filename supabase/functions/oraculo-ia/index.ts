import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { TONS, chamarHaiku, instrucoes, lerConversa, lerMemoria, lerPadroes, type Tom } from "../_shared/oraculo-ia-nucleo.ts";
import { separarMemoria } from "../_shared/oraculo-ia-memoria.ts";
import { guardarPadroes, padroesGuardados } from "../_shared/oraculo-ia-cache.ts";

/**
 * O ORACULO COM IA, V1: O CHAT (02/11/2026, com o Afonso).
 *
 * A pessoa pergunta; esta funcao confere a cota do dia (mensagens: gratis 3,
 * Premium 15, Platinum 45), monta os padroes dela a partir
 * do banco, junta as ultimas
 * trocas da conversa e chama o Claude Haiku 5.5 pelo OpenRouter, fixado no
 * provedor Anthropic. A IA decide o que dizer; o app so entrega os dados.
 * Na mesma chamada ela reescreve a memoria do que a pessoa contou de si.
 *
 * So conta o que foi entregue: se a IA falhar, a pergunta e devolvida.
 * A chave do OpenRouter fica nos secrets do Supabase, nunca no app.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const LIMITE_DA_PERGUNTA = 400;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ALLOWED_HOST_SUFFIXES = ["glyph.life", "vercel.app", "localhost", "127.0.0.1"];
const corsHeaders = (origin: string | null) => {
  let permitido = "https://app.glyph.life";
  if (origin) {
    try {
      const url = new URL(origin);
      const host = url.hostname.toLowerCase();
      if (url.protocol === "capacitor:" || url.protocol === "ionic:" || ALLOWED_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`))) {
        permitido = origin;
      }
    } catch { /* origem estranha: fica a padrao */ }
  }
  return {
    "Access-Control-Allow-Origin": permitido,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
};

const resposta = (corpo: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(corpo), { status, headers });

serve(async (req) => {
  const headers = corsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return resposta({ erro: "METODO" }, 405, headers);
  if (!OPENROUTER_API_KEY) return resposta({ erro: "SEM_CHAVE" }, 503, headers);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const { data: auth } = token ? await supabaseAdmin.auth.getUser(token) : { data: { user: null } };
  const userId = auth?.user?.id;
  if (!userId) return resposta({ erro: "LOGIN" }, 401, headers);

  let corpo: { pergunta?: unknown; tom?: unknown } = {};
  try { corpo = await req.json(); } catch { /* corpo vazio */ }
  const pergunta = typeof corpo.pergunta === "string" ? corpo.pergunta.trim().slice(0, LIMITE_DA_PERGUNTA) : "";
  if (!pergunta) return resposta({ erro: "PERGUNTA_VAZIA" }, 400, headers);

  const { data: reserva, error: erroDaReserva } = await supabaseAdmin.rpc("oraculo_ia_reservar", { p_user_id: userId });
  if (erroDaReserva || !reserva) {
    console.error("oraculo-ia: reserva", erroDaReserva?.message);
    return resposta({ erro: "COTA_INDISPONIVEL" }, 503, headers);
  }
  if (!reserva.ok) return resposta({ erro: "LIMITE", usadas: reserva.usadas, limite: reserva.limite, mensagens: 0 }, 429, headers);
  const mensagensRestantes = Number(reserva.mensagens ?? 0);

  try {
    const { data: perfil } = await supabaseAdmin
      .from("user_profiles")
      .select("nickname,role,is_premium,premium_expires_at")
      .eq("id", userId)
      .maybeSingle();
    // O tom e do Premium: sem plano ativo, neutro.
    const staff = ["admin", "gm", "admin_gm"].includes(String(perfil?.role || "").toLowerCase());
    const pago = staff || (Boolean(perfil?.is_premium) && (!perfil?.premium_expires_at || Date.parse(perfil.premium_expires_at) > Date.now()));
    const pedido = TONS.includes(corpo.tom as Tom) ? (corpo.tom as Tom) : "neutro";
    const tom: Tom = pago ? pedido : "neutro";

    const [padroes, conversa, memoriaAtual] = await Promise.all([
      padroesGuardados(userId) ?? lerPadroes(supabaseAdmin, userId).then((lidos) => { guardarPadroes(userId, lidos); return lidos; }),
      lerConversa(supabaseAdmin, userId),
      lerMemoria(supabaseAdmin, userId),
    ]);
    const bruto = await chamarHaiku(OPENROUTER_API_KEY, instrucoes(tom, String(perfil?.nickname || "")), padroes, conversa, pergunta, memoriaAtual, mensagensRestantes === 0);
    const { resposta: texto, memoria } = separarMemoria(bruto || "", memoriaAtual);
    if (!texto) {
      await supabaseAdmin.rpc("oraculo_ia_devolver", { p_user_id: userId });
      return resposta({ erro: "IA_FALHOU" }, 502, headers);
    }

    await supabaseAdmin.from("oraculo_ia_mensagens").insert({ user_id: userId, pergunta, resposta: texto });
    if (memoria !== memoriaAtual) {
      await supabaseAdmin.from("oraculo_ia_memoria").upsert({ user_id: userId, texto: memoria, atualizada_em: new Date().toISOString() });
    }
    return resposta({ resposta: texto, usadas: reserva.usadas, limite: reserva.limite, mensagens: mensagensRestantes }, 200, headers);
  } catch (erro) {
    console.error("oraculo-ia: erro", String(erro));
    await supabaseAdmin.rpc("oraculo_ia_devolver", { p_user_id: userId });
    return resposta({ erro: "INTERNO" }, 500, headers);
  }
});
