// ENSAIO DO CARD DA MANHA COM IA (17/11/2026, com o Afonso).
//
// O codigo escolhe o tipo do dia e calcula o FATO; a IA so escreve o card.
// Aqui os fatos saem a mao dos dados reais do Afonso (o bloco do ensaio da
// maestria, 03/11), como a rotina vai calcular. Mede tokens e custo de cada
// chamada e confere o tamanho que cabe na notificacao.
//
//   node --env-file=.env.local tools/ensaio-card-manha.mjs [variacoes]
import { readFileSync, writeFileSync } from 'node:fs';
// O prompt e a conferencia sao os do modulo de verdade (supabase/functions/_shared/card-manha-ia.ts).
const { promptDoCard, validarCard } = await import('../supabase/functions/_shared/card-manha-ia.ts');
// O card de ontem vai junto, como na rotina: o modelo nao pode repetir o jeito de dizer.
const ONTEM = [{ data: '2026-11-02', tipo: 'conquista', assunto: 'x', texto: 'Vale pensar onde ela cabe melhor no seu dia.' }];

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error('Falta OPENROUTER_API_KEY no .env.local'); process.exit(1); }
const MODELO = 'anthropic/claude-haiku-5.5';
const VARIACOES = Number(process.argv[2] || 4);

const ensaio = readFileSync(new URL('../docs/oraculo-ia/ensaio-maestria-coach.md', import.meta.url), 'utf8');
const BLOCO = ensaio.split('```')[1].trim();
const linhas = BLOCO.split('\n');
const pega = (...prefixos) => linhas.filter((l) => prefixos.some((p) => l.startsWith(p))).join('\n');
const COMUM = ['perfil marcado pela pessoa:'];

const TIPOS = {
  // A conta e sempre feito contra PROMETIDO (o ritmo declarado da acao), o que
  // inclui o que nunca foi arrastado para o planner. 14 de 16 nao e falha: so
  // entra abaixo de 80% e com pelo menos 3 de diferenca.
  esquecida: {
    pede: 'A AÇÃO ESQUECIDA: a ação prometida que menos acontece, e que quase nunca vai para o planner.',
    fato: 'Correr 4km (Saúde): prometida 1 vez por semana, feita 1 de 4 nos últimos 28 dias; quase nunca é arrastada para o planner. As outras ações de Saúde passam de 87%.',
    contexto: pega(...COMUM),
  },
  ancora: {
    pede: 'ÂNCORA: sugira prender a ação que está falhando logo depois do hábito que nunca falha, com o horário.',
    fato: 'Ação falhando: Progredir (Propósito, 5 por semana; feita 15 de 20 nos últimos 28 dias; sem horário fixo). Hábito que nunca falha: Café da Manhã (todo dia, 28 de 28, costuma ser às 07:30).',
    contexto: pega(...COMUM),
  },
  previsao: {
    pede: 'PREVISÃO DO CICLO: onde o ciclo fecha no ritmo atual e o que muda o final. O ritmo caiu, então isso é urgente.',
    fato: '[cenário de teste] Ciclo de 28 dias, hoje é o dia 12. Feitas 118 de 140 previstas até hoje (84%). Semana passada 92%, esta semana 76%. No ritmo desta semana o ciclo fecha perto de 80%; para fechar em 90% faltam 6 ações a mais por semana. O que mais caiu: Progredir e Meditação Zen.',
    contexto: pega(...COMUM),
  },
  degrau: {
    pede: 'PRÓXIMO DEGRAU: o que falta para subir na área, como um passo pequeno.',
    fato: 'Saúde está no 7 (Domínio); o 8 (Solidez) pede força, condicionamento e mobilidade em alto nível. Força e cardio as ações já cobrem (ABCDE 4 por semana, corrida 1 por semana). Falta: mobilidade 2 ou 3 vezes por semana e sono de 7 horas ou mais; nenhuma ação cobre isso.',
    contexto: pega(...COMUM, '- Saúde 7'),
  },
  conquista: {
    pede: 'CONQUISTA QUE NINGUÉM VIU: reconheça um feito dos números, sem exagero; pode terminar com um desafio leve.',
    fato: 'Pentágono: 28 de 28 dias nos últimos 28 dias. Gratidão, Reza, Plano: 28 de 28. Ciclo de outubro fechou com nota SS e sequência de 28 dias.',
    contexto: pega(...COMUM),
  },
  // "dia-fraco" saiu deste ensaio: com os dados do Afonso a diferenca e 94% contra
  // 100%, pequena demais para virar card, e a conta por dia da semana so enxerga
  // o que foi agendado. So volta se a diferenca passar de 15 pontos.
};

// Os tons sao os mesmos do chat (Config > Preferencias), lidos do proprio nucleo.
const { TOM_EM_PALAVRAS } = await import('../supabase/functions/_shared/oraculo-ia-nucleo.ts');
// Calmo nunca sugere subir degrau: esse tipo nem e sorteado para quem escolheu calmo.
const TIPOS_FORA_DO_TOM = { calmo: ['degrau'] };
const TONS_DO_ENSAIO = (process.argv[3] || 'neutro,coach,reflexivo,calmo').split(',');

const instrucoes = (tipo, tom) => `Você é o Oráculo do Glyph e escreve o card da manhã que chega como notificação no celular.

TIPO DO CARD HOJE: ${tipo.pede}
FATO (calculado pelo app, é verdade): ${tipo.fato}
CONTEXTO: ${tipo.contexto || '(nenhum)'}

Responda só com JSON: {"titulo": "...", "texto": "..."}
- titulo: no máximo 5 palavras, sem verbo no imperativo, sem ponto final, sem emoji. Bons exemplos: "Progredir depois do café", "ABCDE segura o dia", "Saúde a uma peça do 8".
- texto: no máximo 20 palavras, em 1 ou 2 frases curtas. Conte as palavras antes de responder; passou de 20, corte.
- Só o FATO. Não invente horário, ferramenta, truque (alarme, lembrete, celular) nem atividade que não esteja nele. O CONTEXTO só serve para ligar com o que a pessoa marcou, e só se couber em poucas palavras.
- Cite pelo menos um nome de ação ou um número do FATO.
- Nomes de arena e ação exatamente como escritos; não interprete o que significam e não julgue o hábito.
- Não diga quando nem onde encaixar: nada de horário sugerido, "antes de", "depois de", "logo cedo". Quem conhece o próprio dia é a pessoa; convide a pensar em realocar ("vale pensar onde ela cabe melhor", "talvez valha rever o lugar dela no dia"). Horário só aparece se está no FATO, como dado.
- Sugestão na primeira pessoa ou como convite ("eu pensaria em", "que tal rever"), nunca no imperativo. Quem faz a ação é a pessoa, nunca "eu faço" ou "que tal eu".
- Sem saudação, sem "bom dia", sem o nome da pessoa.

TOM (a pessoa escolheu; manda no conteúdo, não só nas palavras): ${TOM_EM_PALAVRAS[tom]}
No card, o tom cabe em 20 palavras: só o essencial dele.`;

const IMPERATIVO = /(?<!\p{L})(faça|tente|mova|comece|coloque|deixe|troque|reserve|proteja|encaixe|garanta|foque|mantenha|evite|bora|blinde|marque)(?!\p{L})/iu;

async function chamar(prompt) {
  const inicio = Date.now();
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELO, messages: [{ role: 'user', content: prompt }], max_tokens: 160, temperature: 0.9,
      reasoning: { enabled: false }, provider: { order: ['Anthropic'], allow_fallbacks: false }, usage: { include: true },
    }),
  });
  const corpo = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(corpo.error || corpo)}`);
  return { texto: corpo.choices?.[0]?.message?.content?.trim() || '', u: corpo.usage || {}, s: (Date.now() - inicio) / 1000 };
}

const saida = ['# Ensaio do card da manhã com IA (17/11/2026)', '',
  `Haiku 5.5, tons ${TONS_DO_ENSAIO.join(', ')}, ${VARIACOES} variações por tipo e tom, dados reais do Afonso (03/11). "previsao" usa um cenário de teste porque o bloco não traz o progresso do ciclo atual.`, ''];
const totais = { entrada: 0, saida: 0, custo: 0, n: 0 };

for (const [nome, tipo] of Object.entries(TIPOS)) {
  saida.push(`## ${nome}`, '', `> fato: ${tipo.fato}`, '');
  for (const tom of TONS_DO_ENSAIO) {
  if (TIPOS_FORA_DO_TOM[tom]?.includes(nome)) { saida.push(`**${tom}:** não sai (tipo fora do tom)`, ''); continue; }
  saida.push(`**${tom}**`, '');
  for (let i = 0; i < VARIACOES; i++) {
    try {
      const r = await chamar(promptDoCard({ tipo: nome, pede: tipo.pede, fato: tipo.fato, assunto: nome, relevancia: 0 }, tom, ONTEM));
      let card; try { card = JSON.parse(r.texto.replace(/^```(json)?|```$/g, '').trim()); } catch { card = { titulo: '(JSON inválido)', texto: r.texto }; }
      const avisos = [];
      if ((card.titulo || '').length > 40) avisos.push(`título ${card.titulo.length}`);
      if ((card.texto || '').length > 170) avisos.push(`texto ${card.texto.length}`);
      if (/alarme|lembrete|celular/i.test(card.texto || '')) avisos.push('inventou truque');
      if (/(antes d|depois d|logo cedo|às \d|\d{1,2}h\b)/i.test(card.texto || '') && !/às \d/.test(tipo.fato)) avisos.push('sugeriu horário');
      if (IMPERATIVO.test(`${card.titulo} ${card.texto}`)) avisos.push('imperativo');
      const conferido = validarCard(r.texto);
      if (!conferido.ok) avisos.push(`a rotina recusaria (${conferido.motivo})`);
      if (/(ela|ele)/i.test(card.texto || '')) avisos.push('pronome');
      totais.entrada += r.u.prompt_tokens || 0; totais.saida += r.u.completion_tokens || 0; totais.custo += Number(r.u.cost || 0); totais.n++;
      saida.push(`${i + 1}. **${card.titulo}** — ${card.texto}`,
        `   <sub>${r.u.prompt_tokens} entrada · ${r.u.completion_tokens} saída · US$ ${Number(r.u.cost || 0).toFixed(5)} · ${r.s.toFixed(1)}s${avisos.length ? ' · ⚠ ' + avisos.join(', ') : ''}</sub>`);
      console.log(nome, tom, i + 1, card.titulo, '|', card.texto, avisos.join(','));
    } catch (e) { saida.push(`${i + 1}. erro: ${e.message}`); console.log(nome, 'erro', e.message); }
  }
  saida.push('');
  }
}

// A mesma chamada com o bloco inteiro de dados, para comparar o custo.
const inteiro = { ...TIPOS.degrau, contexto: BLOCO };
const r = await chamar(promptDoCard({ tipo: 'degrau', pede: inteiro.pede, fato: inteiro.contexto, assunto: 'degrau', relevancia: 0 }, 'coach', ONTEM));
const media = totais.custo / Math.max(1, totais.n);
saida.push('## Custo', '',
  `- Média por card (fatia de dados): ${Math.round(totais.entrada / totais.n)} tokens de entrada, ${Math.round(totais.saida / totais.n)} de saída, US$ ${media.toFixed(5)}.`,
  `- Mesmo card com o bloco inteiro de dados: ${r.u.prompt_tokens} de entrada, ${r.u.completion_tokens} de saída, US$ ${Number(r.u.cost || 0).toFixed(5)}.`,
  `- 30 cards por mês por assinante (fatia): US$ ${(media * 30).toFixed(4)}.`, '');
writeFileSync(new URL('../docs/oraculo-ia/ensaio-card-manha.md', import.meta.url), saida.join('\n'));
console.log('\nmedia US$', media.toFixed(5), '| bloco inteiro', r.u.prompt_tokens, 'tokens, US$', r.u.cost);
