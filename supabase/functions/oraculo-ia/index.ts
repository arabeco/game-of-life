import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { montarPadroes, type AcaoCrua, type ArenaCrua, type CicloCru, type TarefaCrua } from "../_shared/oraculo-ia-padroes.ts";

/**
 * O ORACULO COM IA, V1: O CHAT (02/11/2026, com o Afonso).
 *
 * A pessoa pergunta; esta funcao confere a cota do dia (gratis 1, Premium 5,
 * Platinum 15), monta os padroes dela a partir do banco, junta as ultimas
 * trocas da conversa e chama o Claude Haiku 5.5 pelo OpenRouter, fixado no
 * provedor Anthropic. A IA decide o que dizer; o app so entrega os dados.
 *
 * So conta o que foi entregue: se a IA falhar, a pergunta e devolvida.
 * A chave do OpenRouter fica nos secrets do Supabase, nunca no app.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const MODELO = "anthropic/claude-haiku-5.5";
const LIMITE_DA_PERGUNTA = 400;
const TONS = ["neutro", "coach", "reflexivo", "calmo"] as const;
type Tom = typeof TONS[number];

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

const TOM_EM_PALAVRAS: Record<Tom, string> = {
  neutro: "neutro: equilibrado e direto. Constata e aponta o que aquilo significa.",
  coach: "coach: aponta o próximo movimento concreto. Manda fazer uma coisa pequena.",
  reflexivo: "reflexivo: devolve uma pergunta que faça a pessoa pensar sobre ela, não sobre o app.",
  calmo: "calmo: tira peso. Diz o que não precisa ser feito.",
};

const instrucoes = (tom: Tom, apelido: string) => `Você é o Oráculo do Glyph, um app de organização pessoal com linguagem de reino: a pessoa tem Arenas (frentes da vida), ações, ciclos e patentes. Você conversa com ${apelido || "a pessoa"}.

O app te entrega os PADRÕES dela, já calculados. Responda a pergunta olhando os dados: diga o que você vê e o que recomenda, com o motivo. Pode discordar da premissa da pergunta se os dados mostrarem outra coisa. Se a pergunta não tiver a ver com a organização da vida dela, responda curto e traga de volta para o que os dados mostram.

REGRAS
- No máximo 4 frases. Português do Brasil, tratando por "você". Seco e direto, sem soar traduzido.
- Só use números que estão nos dados. Não calcule números novos.
- Sem emoji, sem exclamação, sem elogio genérico ("parabéns", "você consegue"), sem citar EXP, ouro, baús ou prêmios.
- Nomeie a arena ou a ação de que está falando.
- Se a pessoa já disse algo antes na conversa (uma decisão, uma preferência), leve em conta.

TOM: ${TOM_EM_PALAVRAS[tom]}`;

/** O dia do Glyph em Brasilia (vira as 4h): o mesmo do banco. */
const diaDoGlyph = () => new Date(Date.now() - (3 + 4) * 3600 * 1000).toISOString().slice(0, 10);
const somarDias = (data: string, dias: number) => {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

const lerPadroes = async (userId: string) => {
  const hoje = diaDoGlyph();
  const { data: ciclos } = await supabaseAdmin
    .from("cycles")
    .select("name,start_date,end_date,report_data")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })
    .limit(5);
  const listaDeCiclos = (ciclos || []) as CicloCru[];
  // A janela cobre os 3 ultimos ciclos fechados e o aberto, ou 84 dias.
  const maisAntigo = listaDeCiclos.map((c) => c.start_date).filter(Boolean).sort()[0];
  const desde = maisAntigo && maisAntigo < somarDias(hoje, -83) ? maisAntigo : somarDias(hoje, -83);
  const ate = somarDias(hoje, 60);

  const [{ data: acoes }, { data: arenas }, { data: tarefas }] = await Promise.all([
    supabaseAdmin.from("actions").select("id,arena_id,name,action_type").eq("user_id", userId),
    supabaseAdmin.from("arenas").select("id,name").eq("user_id", userId),
    supabaseAdmin
      .from("scheduled_tasks")
      .select("action_id,date,start_time,completed")
      .eq("user_id", userId)
      .gte("date", desde)
      .lte("date", ate)
      .limit(5000),
  ]);

  return montarPadroes({
    hoje,
    ciclos: listaDeCiclos,
    acoes: (acoes || []) as AcaoCrua[],
    arenas: (arenas || []) as ArenaCrua[],
    tarefas: (tarefas || []) as TarefaCrua[],
  });
};

const lerConversa = async (userId: string) => {
  const { data } = await supabaseAdmin
    .from("oraculo_ia_mensagens")
    .select("pergunta,resposta")
    .eq("user_id", userId)
    .gte("criada_em", new Date(Date.now() - 7 * 86400000).toISOString())
    .order("criada_em", { ascending: false })
    .limit(3);
  return (data || []).reverse().flatMap((troca) => [
    { role: "user", content: troca.pergunta as string },
    { role: "assistant", content: troca.resposta as string },
  ]);
};

const chamarHaiku = async (sistema: string, padroes: string, conversa: unknown[], pergunta: string) => {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), 20000);
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controle.signal,
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://glyph.life",
        "X-Title": "Glyph",
      },
      body: JSON.stringify({
        model: MODELO,
        messages: [
          { role: "system", content: sistema },
          ...conversa,
          { role: "user", content: `PADRÕES\n${padroes}\n\nPERGUNTA\n${pergunta}` },
        ],
        max_tokens: 350,
        temperature: 0.6,
        reasoning: { enabled: false },
        provider: { order: ["Anthropic"], allow_fallbacks: false },
      }),
    });
    const corpo = await res.json().catch(() => null);
    const texto = corpo?.choices?.[0]?.message?.content;
    if (!res.ok || typeof texto !== "string" || !texto.trim()) {
      console.error("oraculo-ia: resposta ruim", res.status, JSON.stringify(corpo?.error || corpo)?.slice(0, 300));
      return null;
    }
    return texto.trim();
  } catch (erro) {
    console.error("oraculo-ia: falha na chamada", String(erro));
    return null;
  } finally {
    clearTimeout(relogio);
  }
};

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
  if (!reserva.ok) return resposta({ erro: "LIMITE", usadas: reserva.usadas, limite: reserva.limite }, 429, headers);

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

    const [padroes, conversa] = await Promise.all([lerPadroes(userId), lerConversa(userId)]);
    const texto = await chamarHaiku(instrucoes(tom, String(perfil?.nickname || "")), padroes, conversa, pergunta);
    if (!texto) {
      await supabaseAdmin.rpc("oraculo_ia_devolver", { p_user_id: userId });
      return resposta({ erro: "IA_FALHOU" }, 502, headers);
    }

    await supabaseAdmin.from("oraculo_ia_mensagens").insert({ user_id: userId, pergunta, resposta: texto });
    return resposta({ resposta: texto, usadas: reserva.usadas, limite: reserva.limite }, 200, headers);
  } catch (erro) {
    console.error("oraculo-ia: erro", String(erro));
    await supabaseAdmin.rpc("oraculo_ia_devolver", { p_user_id: userId });
    return resposta({ erro: "INTERNO" }, 500, headers);
  }
});
