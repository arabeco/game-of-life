import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { chamarHaiku, instrucoes, lerPadroes, TONS, type Tom } from "../_shared/oraculo-ia-nucleo.ts";

/**
 * ENSAIO TEMPORARIO DO ORACULO COM IA (02/11/2026). Roda perguntas com os
 * dados reais do Afonso, pelo mesmo miolo da funcao oraculo-ia, sem gastar
 * cota e sem gravar nada. Protegido por um token aleatorio nos secrets.
 * APAGAR depois do teste.
 */
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const TOKEN = Deno.env.get("ORACULO_ENSAIO_TOKEN") || "";
const AFONSO = "e76e2b7f-a771-4738-a10a-30a993ecafeb";
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const json = { "Content-Type": "application/json" };
  if (!TOKEN || TOKEN.length < 32 || req.headers.get("x-ensaio") !== TOKEN) {
    return new Response(JSON.stringify({ erro: "NAO" }), { status: 403, headers: json });
  }
  const corpo = await req.json().catch(() => ({}));
  const perguntas: string[] = Array.isArray(corpo.perguntas) ? corpo.perguntas.slice(0, 12).map(String) : [];
  const tom: Tom = TONS.includes(corpo.tom) ? corpo.tom : "coach";
  const padroes = await lerPadroes(supabaseAdmin, AFONSO);
  // modo "conversa": cada pergunta leva as trocas anteriores, como na funcao de verdade.
  const emConversa = corpo.modo === "conversa";
  const historico: Array<{ role: string; content: string }> = [];
  const respostas = [];
  for (const pergunta of perguntas) {
    const inicio = Date.now();
    const texto = await chamarHaiku(OPENROUTER_API_KEY, instrucoes(tom, "mister x"), padroes, emConversa ? historico.slice(-6) : [], pergunta);
    respostas.push({ pergunta, texto, segundos: (Date.now() - inicio) / 1000 });
    if (emConversa && texto) historico.push({ role: "user", content: pergunta }, { role: "assistant", content: texto });
  }
  return new Response(JSON.stringify({ padroes, respostas }), { headers: json });
});
