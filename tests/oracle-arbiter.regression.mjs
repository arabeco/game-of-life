import assert from 'node:assert/strict';
import {
  ORACLE_CANDIDATE_WEIGHTS,
  ORACLE_CANDIDATE_TYPES,
  SEVERITY_BOOST_CAP,
  detectOracleCandidates,
  rankOracleCandidates,
  scoreOracleCandidate,
  getOracleRelevanceThreshold,
} from '../utils/oracleCandidates.ts';
import { COACH_LINE_STATES, buildPlannerCoachSpeech } from '../utils/oracleCoach.ts';
import { ORACLE_PRESENCE } from '../constants/oraclePresencePolicy.ts';

/**
 * O arbitro do Oraculo.
 *
 * Antes disto a fala saia de uma cascata de dez `if`: o primeiro que casasse
 * vencia e calava os outros nove. Uma pessoa pode estar ao mesmo tempo tres dias
 * ausente, com o ciclo atrasado, uma arena critica, outra retomada e no streak
 * 29 — e a cascata decidia "ausente ganhou, fim". A vida nao tem prioridade fixa.
 *
 * Pior: as arenas eram ranqueadas por GRAVIDADE e so a primeira sobrevivia.
 * Calculava seis, jogava cinco fora, e a arena que ia bem tinha a menor nota
 * possivel — era estruturalmente impossivel ela ganhar a voz.
 *
 * Agora cada detector produz candidatos independentes, ninguem cala ninguem, e
 * o arbitro escolhe por relevancia. Este teste e a especificacao desse
 * comportamento: e ele que permite mexer nos pesos sem quebrar o resto.
 */

const contextoBase = {
  arenasCount: 3,
  actionsCount: 9,
  cycleLengthDays: 5,
  cycleProgress: 50,
  daysSinceLastPlannerOpen: 0,
  daysSinceLastProof: 0,
  hasActiveCycle: true,
  cyclePace: 'no_ritmo',
  priorityActionName: null,
  completedActionNameToday: null,
  arenas: [],
};

const arena = (overrides = {}) => ({
  arenaId: 'a1',
  arenaName: 'Saude',
  pace: 'no_ritmo',
  adjustment: 'manter_ritmo',
  progressDelta: 0,
  daysSinceProof: 0,
  pendingActionsToday: 0,
  ...overrides,
});

// --- a tabela de pesos e o contrato ------------------------------------------
// Trocar dez `if` legiveis por quatro numeros vezes N tipos so vale a pena se os
// numeros morarem todos no mesmo lugar e cada um disser por que e o que e. Peso
// espalhado pelo codigo seria uma regra ruim E opaca, que e pior do que a
// cascata que ela substitui.

for (const tipo of ORACLE_CANDIDATE_TYPES) {
  const peso = ORACLE_CANDIDATE_WEIGHTS[tipo];
  assert.ok(peso, `${tipo} precisa estar na tabela de pesos`);
  for (const eixo of ['importance', 'urgency', 'novelty', 'actionability']) {
    assert.ok(
      Number.isInteger(peso[eixo]) && peso[eixo] >= 0 && peso[eixo] <= 5,
      `${tipo}.${eixo} deve ser inteiro de 0 a 5`,
    );
  }
  assert.ok(
    typeof peso.why === 'string' && peso.why.length >= 20,
    `${tipo} precisa dizer POR QUE tem esses numeros`,
  );
}

// Candidato sem banco de frases e silencio disfarcado de decisao: o arbitro
// elegeria um vencedor que nao sabe falar.
for (const tipo of ORACLE_CANDIDATE_TYPES) {
  assert.ok(
    COACH_LINE_STATES.includes(tipo),
    `${tipo} nao tem linhas em COACH_LINES — venceria e ficaria mudo`,
  );
}

// --- todas as arenas competem, nao so a pior ---------------------------------
// Este e o defeito central que o arbitro existe para consertar.

const tresArenasProblematicas = {
  ...contextoBase,
  arenas: [
    arena({ arenaId: 'a1', arenaName: 'Saude', pace: 'critico', adjustment: 'reduzir_meta', progressDelta: -40 }),
    arena({ arenaId: 'a2', arenaName: 'Projeto', pace: 'atrasado', adjustment: 'reduzir_meta', progressDelta: -20 }),
    arena({ arenaId: 'a3', arenaName: 'Estudos', pace: 'atrasado', adjustment: 'reduzir_meta', progressDelta: -15 }),
  ],
};

const candidatosDeArena = detectOracleCandidates(tresArenasProblematicas)
  .filter((candidato) => candidato.arenaId);

assert.equal(
  candidatosDeArena.length, 3,
  'as tres arenas com problema precisam virar tres candidatos, nao um',
);
assert.deepEqual(
  candidatosDeArena.map((candidato) => candidato.arenaId).sort(),
  ['a1', 'a2', 'a3'],
  'nenhuma arena pode ser descartada antes da decisao',
);

// A pior ainda vence entre as iguais — o boost de gravidade ordena dentro do tipo.
const [primeira] = rankOracleCandidates(tresArenasProblematicas, ORACLE_PRESENCE.PRESENTE)
  .filter((candidato) => candidato.arenaId);
assert.equal(primeira.arenaId, 'a1', 'entre arenas do mesmo tipo, a pior fala primeiro');

// --- arena que vai bem nao gera problema, e nao monopoliza -------------------

const umaBoaUmaRuim = {
  ...contextoBase,
  arenas: [
    arena({ arenaId: 'ok', arenaName: 'Saude', pace: 'adiantado', adjustment: 'manter_ritmo', progressDelta: 25 }),
    arena({ arenaId: 'ruim', arenaName: 'Projeto', pace: 'critico', adjustment: 'reduzir_meta', progressDelta: -40 }),
  ],
};
const idsComProblema = detectOracleCandidates(umaBoaUmaRuim)
  .filter((candidato) => candidato.arenaId)
  .map((candidato) => candidato.arenaId);
assert.ok(!idsComProblema.includes('ok'), 'arena adiantada nao vira candidato de problema');
assert.ok(idsComProblema.includes('ruim'), 'arena critica vira');

// --- o que muda em relacao a cascata ----------------------------------------
// Na cascata, `arena_atrasada` vinha ANTES de `prioridade`, entao quem tinha uma
// arena so um pouco atrasada nunca ouvia qual era a proxima acao concreta.
// Apontar o proximo movimento e mais acionavel do que anunciar um atraso que a
// pessoa ja ve na tela.

const atrasoLeveComPrioridade = {
  ...contextoBase,
  priorityActionName: 'Correr 5km',
  arenas: [arena({ pace: 'atrasado', adjustment: 'reduzir_meta', progressDelta: -12 })],
};
const vencedor = rankOracleCandidates(atrasoLeveComPrioridade, ORACLE_PRESENCE.PRESENTE)[0];
assert.equal(
  vencedor.type, 'prioridade',
  'com atraso leve, a acao concreta ganha da reclamacao sobre a arena',
);

// Mas quem sumiu continua sendo ouvido antes de tudo: urgencia real vence.
const sumiuEtemArena = {
  ...contextoBase,
  daysSinceLastPlannerOpen: 5,
  priorityActionName: 'Correr 5km',
  arenas: [arena({ pace: 'critico', adjustment: 'reduzir_meta', progressDelta: -40 })],
};
assert.equal(
  rankOracleCandidates(sumiuEtemArena, ORACLE_PRESENCE.PRESENTE)[0].type, 'ausente',
  'quem sumiu ha dias ouve sobre isso antes de ouvir sobre meta de arena',
);

// --- lista ranqueada, nao vencedor ------------------------------------------
// O arbitro devolve todos os sobreviventes em ordem. Se devolvesse so o primeiro,
// um candidato barrado mais adiante (cooldown, frase invalida) viraria silencio
// indevido em vez de passar a vez para o proximo.

const varios = rankOracleCandidates(sumiuEtemArena, ORACLE_PRESENCE.PRESENTE);
assert.ok(varios.length > 1, 'o arbitro devolve a lista inteira, nao so quem ganhou');
for (let i = 1; i < varios.length; i += 1) {
  assert.ok(
    varios[i - 1].score >= varios[i].score,
    'a lista precisa vir ordenada por relevancia decrescente',
  );
}

// --- a presenca e o corte ----------------------------------------------------

assert.equal(
  getOracleRelevanceThreshold(ORACLE_PRESENCE.SILENCIOSO), Infinity,
  'no Silencioso nenhum candidato passa: e o pacto, nao um limiar alto',
);
assert.ok(
  getOracleRelevanceThreshold(ORACLE_PRESENCE.EQUILIBRADO) >
  getOracleRelevanceThreshold(ORACLE_PRESENCE.PRESENTE),
  'o Equilibrado exige mais relevancia que o Presente para falar',
);

assert.deepEqual(
  rankOracleCandidates(sumiuEtemArena, ORACLE_PRESENCE.SILENCIOSO), [],
  'Silencioso nao recebe candidato nenhum',
);

// Elogio de rotina passa no Presente e nao passa no Equilibrado: e exatamente a
// diferenca entre "acompanha o seu dia de perto" e "celebra o que e grande".
const soElogio = { ...contextoBase, completedActionNameToday: 'Correr 5km' };
assert.ok(
  rankOracleCandidates(soElogio, ORACLE_PRESENCE.PRESENTE).some((c) => c.type === 'ja_entregou'),
  'o Presente comenta o que voce entregou hoje',
);
assert.deepEqual(
  rankOracleCandidates(soElogio, ORACLE_PRESENCE.EQUILIBRADO), [],
  'o Equilibrado nao gasta a fala do dia elogiando rotina',
);

// --- o direito de nao falar --------------------------------------------------
// O arbitro nao pergunta "quem ganhou?", pergunta "alguem merece falar?".

const diaSemNada = {
  ...contextoBase,
  arenas: [arena({ pace: 'no_ritmo', adjustment: 'manter_ritmo' })],
};
assert.deepEqual(
  detectOracleCandidates(diaSemNada), [],
  'dia sem acontecimento nao produz candidato',
);
assert.equal(
  buildPlannerCoachSpeech(diaSemNada, () => 0, 'neutro'), null,
  'sem candidato o Oraculo fica quieto, em vez de procurar o que dizer',
);

// --- o boost de gravidade nao pode pular de nivel ----------------------------
// Ele ordena arenas DENTRO do mesmo tipo. Se pudesse crescer sem limite, uma
// arena muito atrasada passaria na frente de "alguem sumiu ha uma semana", e a
// tabela de pesos deixaria de significar alguma coisa.

const pior = arena({ pace: 'critico', adjustment: 'reduzir_meta', progressDelta: -100, daysSinceProof: 90 });
const candidatoExtremo = detectOracleCandidates({ ...contextoBase, arenas: [pior] })[0];
assert.ok(
  candidatoExtremo.boost <= SEVERITY_BOOST_CAP,
  `o boost de gravidade precisa respeitar o teto de ${SEVERITY_BOOST_CAP}`,
);

// --- a fala continua saindo --------------------------------------------------
// O arbitro trocou a decisao, nao o banco: quem vence tem de conseguir falar.

const falaDeAusente = buildPlannerCoachSpeech(sumiuEtemArena, () => 0, 'coach');
assert.ok(
  typeof falaDeAusente === 'string' && falaDeAusente.length > 0,
  'o vencedor precisa render uma frase de verdade',
);
assert.ok(!/\{\w+\}/.test(falaDeAusente), 'nenhum marcador pode sobrar na frase');

// A frase do vencedor tem de ser do estado que venceu — o nome da arena que
// perdeu nao pode vazar para a fala de quem ganhou.
const falaDePrioridade = buildPlannerCoachSpeech(atrasoLeveComPrioridade, () => 0, 'coach');
assert.ok(
  falaDePrioridade.includes('Correr 5km'),
  'venceu `prioridade`, entao a acao concreta precisa aparecer na frase',
);

console.log('Oracle arbiter: candidatos competem, o pior de cada tipo fala primeiro, e o silencio e uma resposta valida.');
