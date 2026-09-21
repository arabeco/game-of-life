import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const fonte = readFileSync(
  new URL('../components/ReportResultCarousel.tsx', import.meta.url),
  'utf8',
);

/* ==========================================================================
 * OS CINCO QUADROS MOSTRAVAM QUATRO NUMEROS.
 *
 * Contagem de 21/09/2026, nos rodapes da apresentacao de fim de ciclo:
 *
 *   66/66  aparecia em Execucao, Atlas e Veredito
 *   7/7    em Presenca (Execucao) e Dias ativos (Atlas) — a mesma medida
 *   55h    em Execucao e Atlas
 *   100%   em Execucao e na Conclusao do Veredito
 *
 * De treze vagas, seis eram repeticao. Parecia muita informacao e era o mesmo
 * ciclo dito quatro vezes com rotulos diferentes.
 *
 * Enquanto isso o relatorio CALCULAVA e GRAVAVA fatos que nenhuma tela lia:
 * melhor dia do ciclo, quantas entregas nele, maior sequencia de dias seguidos.
 * E a unica tela que dizia algo que a pessoa nao viveu — a comparacao com os
 * ciclos anteriores — estava inteira atras do Platinum.
 *
 * A regra que saiu disso, e que este teste guarda: CADA QUADRO RESPONDE UMA
 * PERGUNTA DIFERENTE, e um numero aparece uma vez so.
 * ========================================================================== */

const quadro = (abridor, fechador) => {
  const inicio = fonte.indexOf(abridor);
  assert.ok(inicio >= 0, `Nao achei o quadro que comeca em ${abridor}`);
  const fim = fonte.indexOf(fechador, inicio);
  assert.ok(fim > inicio, `Nao achei o fim do quadro que comeca em ${abridor}`);
  return fonte.slice(inicio, fim);
};

// ---------------------------------------------------------------------------
// 1. O ATLAS ERA TRES QUARTOS REPETICAO.
//
// "Dias ativos" era a Presenca da Execucao, "Feitas" eram as Acoes, "Carga" era
// a Carga. Ele fala de FORMA — onde o ciclo emendou —, entao mede a forma.
// ---------------------------------------------------------------------------

const atlas = quadro('const renderAtlasSlide', 'const renderTerritorySlide');

for (const repetido of [
  ['actionsCompleted', 'as acoes ja sao o rodape da Execucao'],
  ['totalHours', 'a carga ja e o rodape da Execucao'],
  ['consistencyDays', 'a presenca ja e o rodape da Execucao'],
  ['zeroDays', 'os dias sem entrega ja sao a NOTA da Presenca, na Execucao'],
]) {
  assert.ok(
    !atlas.includes(repetido[0]),
    `Atlas voltou a repetir ${repetido[0]}: ${repetido[1]}.`,
  );
}
assert.match(atlas, /Maior sequência/, 'A forma do ciclo se mede pela maior emenda.');
assert.match(atlas, /maiorSequencia/, 'A maior sequencia vem do maxStreak gravado no fecho.');

// ---------------------------------------------------------------------------
// 2. O VEREDITO NAO REPETE O RODAPE DA EXECUCAO.
//
// "Acoes 66/66" no climax nao acrescenta nada: quem chegou ali passou por esse
// numero quatro quadros antes.
// ---------------------------------------------------------------------------

// O ramo de SINAL INSUFICIENTE fica de fora desta regra de proposito: ali nao
// ha letra nem conclusao a justificar — o cartaz mostra um travessao —, entao os
// numeros crus sao tudo o que existe para dizer. A regra vale para o Veredito
// que julga, que comeca na conta da conclusao.
const veredito = quadro('const conclusaoPct = metrics.executionRatePct', 'const renderRewardSlide');

assert.ok(
  !/rotulo: 'Ações', valor: `\$\{metrics\.actionsCompleted\}/.test(veredito),
  'O Veredito voltou a repetir as acoes da Execucao.',
);
assert.match(
  veredito,
  /legenda=\{\[\s*\{ rotulo: 'Conclusão', valor: `\$\{conclusaoPct\}%` \},\s*\]\}/,
  'O rodape do Veredito e a conclusao sozinha: e o que a letra tem a dizer de si.',
);

// As cinco barras do indice de 100 pontos nao voltam: o indice nao decide mais
// a letra, e decompor na tela um numero sem poder e mostrar duas reguas.
for (const barra of ['honorPts', 'metaPts', 'cadencePts', 'realismPts', 'ascensionPts']) {
  assert.ok(!veredito.includes(barra), `A decomposicao do indice voltou ao Veredito (${barra}).`);
}

// ---------------------------------------------------------------------------
// 3. OS FATOS ENTERRADOS CHEGAM NA TELA.
//
// Calculados no fecho, gravados no relatorio, lidos por ninguem.
// ---------------------------------------------------------------------------

assert.match(fonte, /metrics\.bestDay/, 'O melhor dia do ciclo era calculado e jogado fora.');
assert.match(fonte, /metrics\.bestDayCount/, 'Quantas entregas no melhor dia: idem.');
assert.match(fonte, /metrics\.maxStreak/, 'A maior sequencia: idem.');

const execucao = quadro('const renderExecutionSlide', 'const renderAtlasSlide');
assert.match(execucao, /Melhor dia/, 'A quarta vaga da Execucao e do melhor dia.');
assert.ok(
  !/rotulo: 'Ritmo'/.test(execucao),
  'O Ritmo era um delta que da zero quase sempre, e um "0" sozinho le como resultado nulo.',
);

// ---------------------------------------------------------------------------
// 4. A COMPARACAO E DO PLATINUM, INTEIRA.
//
// Uma linha dela chegou a sair para o gratuito, no rodape do Veredito, e voltou
// em 21/09: comparar o ciclo com o proprio historico e o que o Platinum vende, e
// dar metade de graca esvazia a metade que sobra. Melhorar a comparacao e
// engorda-la dentro do quadro, e nao espalhar pedaco dela pela apresentacao.
// ---------------------------------------------------------------------------

assert.match(
  fonte,
  /\(isPlatinum \? buildCycleComparison\(report, reports \|\| \[\]\) : null\)/,
  'A comparacao tem de ser calculada so para quem paga por ela.',
);
assert.ok(
  !veredito.includes('comparison'),
  'Pedaco da comparacao voltou a vazar para o Veredito do plano gratuito.',
);

// ---------------------------------------------------------------------------
// 5. ZERO NAO E CONQUISTA.
// ---------------------------------------------------------------------------

const conquistas = quadro('const renderAchievementsSlide', 'const isPlatinum');
assert.match(
  conquistas,
  /if \(\(metrics\.questsCompleted \|\| 0\) > 0\) \{/,
  'Desafios voltou a ocupar vaga fixa com zero dentro, num quadro chamado Conquistas.',
);

console.log('[relatorio-sem-repeticao] ok');
