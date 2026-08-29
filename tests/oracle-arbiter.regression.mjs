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
import { COACH_LINE_STATES, COACH_LINES, buildPlannerCoachSpeech, countCoachLines } from '../utils/oracleCoach.ts';
import { ORACLE_PRESENCE } from '../constants/oraclePresencePolicy.ts';
import { resolveArenaTrend } from '../utils/oracleOperationalContext.ts';
import {
  isOracleSubjectOnCooldown,
  recallOracleSpeech,
  rememberOracleSpeech,
  ORACLE_SPEECH_MEMORY_SIZE,
} from '../utils/oracleSpeechMemory.ts';
import { buildPlannerCoachSpeechDetailed, decideOracleSpeech } from '../utils/oracleCoach.ts';
import { formatOracleDecisionLog } from '../utils/oracleDecisionLog.ts';

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

// As guardas de texto comparam SEM acento.
//
// Elas sao doesNotMatch: quando o banco ganhou acentos, /corte uma acao/ deixou
// de casar com "corte uma ação" e a guarda passou a aprovar tudo em silencio —
// exatamente como uma assercao que pina redacao morre sozinha. Normalizar antes
// de comparar faz a guarda sobreviver a mudanca de grafia nos dois sentidos.
const semAcento = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '');

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


// --- a retomada vence a queixa sobre a mesma arena ---------------------------
// O caso que o `trend` existe para resolver: a arena esta em 22% quando deveria
// estar em 60% — `critico`, e o ranking antigo a coroaria como a pior de todas —
// mas ela voltou a andar hoje depois de oito dias parada.
//
// Os dois fatos sao verdade. So um merece a fala. Dizer "reduza a meta" no dia
// em que a pessoa fez a coisa certa e o pior erro que o Oraculo pode cometer, e
// era o comportamento garantido antes disto.

const criticaMasRetomando = {
  ...contextoBase,
  arenas: [arena({
    arenaName: 'Projeto',
    pace: 'critico',
    adjustment: 'reduzir_meta',
    progressDelta: -38,
    trend: 'retomando',
    trendPauseDays: 8,
  })],
};

const candidatosRetomada = detectOracleCandidates(criticaMasRetomando)
  .filter((candidato) => candidato.arenaId);
assert.equal(candidatosRetomada.length, 1, 'a retomada substitui a queixa, nao concorre com ela');
assert.equal(candidatosRetomada[0].type, 'arena_retomada');

assert.ok(
  ORACLE_CANDIDATE_WEIGHTS.arena_retomada.novelty >
  ORACLE_CANDIDATE_WEIGHTS.arena_atrasada.novelty,
  'a mudanca e mais nova que o estado: a tela ja mostra 22%, nao mostra que voltou',
);

const falaRetomada = buildPlannerCoachSpeech(criticaMasRetomando, () => 0, 'neutro');
assert.ok(falaRetomada.includes('Projeto'), 'a frase nomeia a arena que voltou');
assert.ok(/8 dias/.test(falaRetomada), 'e diz quantos dias ela ficou parada');
assert.ok(!/\{\w+\}/.test(falaRetomada), 'nenhum marcador pode sobrar');

// Sem o numero de dias a frase ainda tem de sair: fillCoachLine invalida linha
// com variavel faltando, entao cada voz precisa de uma linha sem {dias}. Sem
// isso, uma retomada sem numero viraria silencio.
const retomouSemNumero = {
  ...contextoBase,
  arenas: [arena({ arenaName: 'Projeto', trend: 'retomando', trendPauseDays: null })],
};
const falaSemNumero = buildPlannerCoachSpeech(retomouSemNumero, () => 0, 'neutro');
assert.ok(
  typeof falaSemNumero === 'string' && falaSemNumero.includes('Projeto'),
  'retomada sem o numero de dias ainda fala',
);
assert.ok(!/\{\w+\}/.test(falaSemNumero), 'nenhum marcador pode sobrar');

// Vale para as quatro vozes, senao um tom Premium cai no silencio.
for (const tom of ['neutro', 'coach', 'reflexivo', 'calmo']) {
  const linha = buildPlannerCoachSpeech(retomouSemNumero, () => 0, tom);
  assert.ok(linha && !/\{\w+\}/.test(linha), `${tom} precisa de uma linha de retomada sem {dias}`);
}

// A arena que apenas melhorou nao vira fala: melhorar dentro do ritmo e o
// esperado. So a volta depois de uma pausa real e novidade.
const soMelhorando = {
  ...contextoBase,
  arenas: [arena({ pace: 'no_ritmo', adjustment: 'manter_ritmo', trend: 'melhorando' })],
};
assert.deepEqual(
  detectOracleCandidates(soMelhorando).filter((c) => c.arenaId), [],
  'melhorar dentro do ritmo nao merece interromper ninguem',
);


// --- a aritmetica do trend ---------------------------------------------------
// `trend` sai de janelas derivadas das proprias tasks — hoje, ontem, D-3, D-7 —
// sem tabela nova e sem snapshot gravado: as tasks ja tem data operacional,
// entao o passado e o mesmo calculo com outra data de corte.
//
// E a parte com aritmetica de verdade, entao e a que precisa de teste proprio:
// um erro de um dia aqui vira "voltou depois de oito dias" numa arena que nunca
// parou.

const HOJE = '2026-08-28';

// Oito dias parada e voltou hoje. O caso que o estado existe para nomear.
assert.deepEqual(
  resolveArenaTrend(['2026-08-19', '2026-08-28'], HOJE),
  { trend: 'retomando', pauseDays: 9 },
  'pausa longa seguida de volta hoje e retomada, com o tamanho da pausa junto',
);

// Fim de semana nao e abandono. Sem esse corte, toda segunda-feira o app
// anunciaria uma retomada heroica.
assert.notEqual(
  resolveArenaTrend(['2026-08-26', '2026-08-28'], HOJE).trend,
  'retomando',
  'dois dias de pausa e fim de semana, nao volta por cima de abandono',
);

// Voltou ontem tambem conta: quem abre o app no dia seguinte ainda merece ouvir.
assert.equal(
  resolveArenaTrend(['2026-08-15', '2026-08-27'], HOJE).trend,
  'retomando',
  'a retomada continua valendo no dia seguinte',
);

// Mas nao vale a semana toda depois: isso ja virou o novo normal.
assert.notEqual(
  resolveArenaTrend(['2026-08-10', '2026-08-22'], HOJE).trend,
  'retomando',
  'retomada de uma semana atras nao e mais novidade',
);

// Arena sem nenhuma conclusao nao tem direcao. Quem fala de arena parada e o
// `pace`, nao o `trend` — trend descreve mudanca, e nao houve nenhuma.
assert.deepEqual(
  resolveArenaTrend([], HOJE),
  { trend: 'estavel', pauseDays: null },
  'sem historico nao ha direcao a declarar',
);

// Acelerou: nada na janela anterior, movimento na recente.
assert.equal(
  resolveArenaTrend(['2026-08-27', '2026-08-28'], HOJE).trend,
  'melhorando',
  'comecar a andar depois de uma janela vazia e melhora',
);

// Desacelerou: muito antes, pouco agora.
assert.equal(
  resolveArenaTrend(
    ['2026-08-22', '2026-08-22', '2026-08-23', '2026-08-23', '2026-08-24', '2026-08-25', '2026-08-28'],
    HOJE,
  ).trend,
  'piorando',
  'quatro dias fortes seguidos de tres fracos e queda',
);

// Ritmo parelho nao e noticia.
//
// As janelas tem tamanhos diferentes de proposito — 3 dias recentes contra os 4
// anteriores — entao "parelho" e mesma TAXA, nao mesma contagem: 4 acoes em 4
// dias contra 3 em 3. A primeira versao deste teste usava 3 e 3 e falhou com
// razao, porque aquilo e aceleracao de 0,75 para 1,0 por dia.
assert.equal(
  resolveArenaTrend(
    ['2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28'],
    HOJE,
  ).trend,
  'estavel',
  'mesma taxa nas duas janelas nao e mudanca',
);

// pauseDays so existe na retomada: os outros tres sao comparacao de volume, e
// numero solto numa frase que nao fala de pausa seria mentira.
for (const datas of [[], ['2026-08-27', '2026-08-28'], ['2026-08-26', '2026-08-28']]) {
  const saida = resolveArenaTrend(datas, HOJE);
  if (saida.trend !== 'retomando') {
    assert.equal(saida.pauseDays, null, 'so a retomada carrega o numero de dias');
  }
}


// --- estrutura inflada nao e execucao baixa ---------------------------------
// A distincao que o app nao fazia: `reduzir_meta` disparava em `pace atrasado`,
// que acontece tanto para quem pos 2 acoes por dia e nao fez quanto para quem
// pos 40 e e impossivel. So o segundo e evidencia de estrutura errada.

const estruturaImpossivel = {
  ...contextoBase,
  cycleDayNumber: 12,
  plannedDailyDemand: 40,
  bestDailyCompletions: 7,
  daysWithCompletions: 9,
};
const inflada = detectOracleCandidates(estruturaImpossivel).filter((c) => c.type === 'meta_inflada');
assert.equal(inflada.length, 1, '40 por dia contra um melhor dia de 7 e estrutura impossivel');

const falaInflada = buildPlannerCoachSpeech(estruturaImpossivel, () => 0, 'neutro');
assert.ok(/40/.test(falaInflada), 'a frase diz o numero que o plano pede');
assert.ok(/7/.test(falaInflada), 'e o melhor dia que a pessoa ja teve');
assert.ok(!/\{\w+\}/.test(falaInflada), 'nenhum marcador pode sobrar');

// Ela vence ate quem sumiu: costuma ser a CAUSA de ter sumido, e e o unico caso
// em que o problema nao e a pessoa.
assert.equal(
  rankOracleCandidates({ ...estruturaImpossivel, daysSinceLastPlannerOpen: 6 }, ORACLE_PRESENCE.PRESENTE)[0].type,
  'meta_inflada',
  'a causa fala antes do sintoma',
);

// --- e os quatro portoes seguram o falso positivo ---------------------------
// Falso positivo aqui manda alguem capaz baixar o proprio padrao, o que e pior
// do que ficar calado.

const semInflada = (mudancas, motivo) => assert.deepEqual(
  detectOracleCandidates({ ...estruturaImpossivel, ...mudancas }).filter((c) => c.type === 'meta_inflada'),
  [], motivo,
);

semInflada({ cycleDayNumber: 3 }, 'tres dias de ciclo nao dao base para julgar estrutura');
semInflada({ daysWithCompletions: 1 }, 'quem nem tentou nao tem estrutura impossivel, tem estrutura nao testada');
semInflada({ plannedDailyDemand: 6, bestDailyCompletions: 1 }, 'abaixo do piso absoluto nenhuma estrutura e impossivel, so mal executada');
semInflada({ plannedDailyDemand: 12, bestDailyCompletions: 7 }, 'demanda dentro do dobro do melhor dia ainda e alcancavel');

// O caso que define a diferenca: meta plausivel, execucao baixa. Nao ha
// evidencia nenhuma de que o numero esteja errado — a pessoa so nao fez.
const metaPlausivelSemExecucao = {
  ...contextoBase,
  cycleDayNumber: 12,
  plannedDailyDemand: 2,
  bestDailyCompletions: 0,
  daysWithCompletions: 3,
  arenas: [arena({ pace: 'critico', adjustment: 'reduzir_meta', progressDelta: -45 })],
};
assert.deepEqual(
  detectOracleCandidates(metaPlausivelSemExecucao).filter((c) => c.type === 'meta_inflada'),
  [], 'duas acoes por dia nunca e o culpado',
);

// E a fala que sobra para esse caso nao pode mandar cortar meta: seria o app se
// rendendo por alguem que so precisa fazer uma acao.
for (const tom of ['neutro', 'coach', 'reflexivo', 'calmo']) {
  const linha = buildPlannerCoachSpeech(metaPlausivelSemExecucao, () => 0, tom);
  assert.ok(linha, `${tom} precisa ter o que dizer sobre arena atrasada`);
  assert.doesNotMatch(
    semAcento(linha),
    /reduz|reveja a meta|diminua a repeticao|meta e que estava grande|corte uma acao/i,
    `${tom}: estar atras nao autoriza mandar cortar a meta`,
  );
}


// --- a sequencia que vai morrer hoje ----------------------------------------
// O streak e lazy: so e reavaliado quando a pessoa conclui alguma coisa. Nada
// rodava quando ela NAO fazia nada — exatamente quando ele morre. O dado sempre
// esteve la; ninguem perguntava.
//
// E nenhuma das 200 linhas do app mencionava o numero. O que mais segura a
// pessoa era a unica coisa que o Oraculo nao comentava.

const sequenciaEmRisco = {
  ...contextoBase,
  daysSinceLastProof: 1,
  dailyProofStreakCurrent: 23,
  hourOfDay: 22,
};
const risco = detectOracleCandidates(sequenciaEmRisco).filter((c) => c.type === 'streak_em_risco');
assert.equal(risco.length, 1, '23 dias, nada hoje, 22h: a sequencia esta em risco');

const falaRisco = buildPlannerCoachSpeech(sequenciaEmRisco, () => 0, 'calmo');
assert.ok(/23/.test(falaRisco), 'a fala diz o numero — e o numero que reconhece o percurso');
assert.ok(!/\{\w+\}/.test(falaRisco), 'nenhum marcador pode sobrar');

// Todas as vozes falam o numero: o gate garante que ele existe sempre que dispara.
for (const tom of ['neutro', 'coach', 'reflexivo', 'calmo']) {
  const linha = buildPlannerCoachSpeech(sequenciaEmRisco, () => 0, tom);
  assert.ok(/23/.test(linha), `${tom} precisa dizer o numero da sequencia`);
}

// Vence tudo, inclusive a estrutura inflada: e a unica coisa que morre sozinha
// se ninguem falar. A conta que nao fecha continua nao fechando amanha de manha.
assert.equal(
  rankOracleCandidates({
    ...sequenciaEmRisco,
    daysSinceLastPlannerOpen: 6,
    cycleDayNumber: 12,
    plannedDailyDemand: 40,
    bestDailyCompletions: 7,
    daysWithCompletions: 9,
  }, ORACLE_PRESENCE.PRESENTE)[0].type,
  'streak_em_risco',
  'o que expira hoje fala antes do que expira nunca',
);

// --- e os portoes ------------------------------------------------------------

const semRisco = (mudancas, motivo) => assert.deepEqual(
  detectOracleCandidates({ ...sequenciaEmRisco, ...mudancas }).filter((c) => c.type === 'streak_em_risco'),
  [], motivo,
);

semRisco({ hourOfDay: 10 }, 'de manha ainda ha dia inteiro pela frente');
semRisco({ dailyProofStreakCurrent: 2 }, 'perder um streak de 2 nao doi, e avisar ensina a ignorar o aviso');
semRisco({ daysSinceLastProof: 0 }, 'ja entregou hoje: nao ha risco nenhum');

// A madrugada ainda e o mesmo dia operacional — que vira as 4h — entao 1h da
// manha continua sendo hora de risco, e nao "amanha de manha cedo".
assert.equal(
  detectOracleCandidates({ ...sequenciaEmRisco, hourOfDay: 1 })
    .filter((c) => c.type === 'streak_em_risco').length,
  1,
  'a madrugada pertence ao dia que ainda nao fechou',
);

// O Silencioso continua calado. Quem quiser ser avisado usa o interruptor de
// alertas, que e outra coisa: presenca decide o que ele COMENTA.
assert.deepEqual(
  rankOracleCandidates(sequenciaEmRisco, ORACLE_PRESENCE.SILENCIOSO), [],
  'nem a sequencia morrendo fura o pacto do Silencioso',
);


// --- memoria: ele para de repetir --------------------------------------------
// Cada fala nascia so do estado de AGORA. Ele nunca soube que tinha dito a mesma
// coisa ontem. Quem esta em `prioridade` fica em `prioridade` por semanas, e com
// duas variacoes por estado a pessoa via as duas tres vezes numa semana — ponto
// em que ela para de ler.

const ONTEM = '2026-08-27';
const ANTEONTEM = '2026-08-26';

// Cooldown zero ainda impede falar duas vezes do mesmo no MESMO dia.
assert.equal(
  isOracleSubjectOnCooldown([{ type: 'ja_entregou', date: HOJE, line: 'x' }], 'ja_entregou', undefined, HOJE, 0),
  true,
  'nenhum assunto sai duas vezes no mesmo dia, nem os de cooldown zero',
);
assert.equal(
  isOracleSubjectOnCooldown([{ type: 'ja_entregou', date: ONTEM, line: 'x' }], 'ja_entregou', undefined, HOJE, 0),
  false,
  'elogiar o que ela fez hoje e sobre hoje: ontem nao bloqueia',
);

// Cooldown de dois dias segura a queixa mais repetivel do banco.
const disseOntem = [{ type: 'arena_atrasada', arenaId: 'a1', date: ONTEM, line: 'x' }];
assert.equal(
  isOracleSubjectOnCooldown(disseOntem, 'arena_atrasada', 'a1', HOJE, 2), true,
  'queixa de arena nao sai em dias seguidos',
);
// E o cooldown e por ARENA: reclamar de Projeto nao cala Saude.
assert.equal(
  isOracleSubjectOnCooldown(disseOntem, 'arena_atrasada', 'a2', HOJE, 2), false,
  'o assunto e a arena, nao o tipo: outra arena e outro assunto',
);

// Dias seguidos contam a partir de ONTEM — hoje ainda nao foi decidido, e e a
// decisao de hoje que vai consultar esse numero.
assert.equal(
  recallOracleSpeech([
    { type: 'prioridade', date: ONTEM, line: 'a' },
    { type: 'prioridade', date: ANTEONTEM, line: 'b' },
  ], 'prioridade', undefined, HOJE).consecutiveDays,
  2,
  'dois dias seguidos no mesmo assunto sao dois, e nao incluem hoje',
);

// A memoria e curta de proposito: e memoria, nao arquivo. O historico e o chat.
let acumulada = [];
for (let i = 0; i < ORACLE_SPEECH_MEMORY_SIZE + 4; i += 1) {
  acumulada = rememberOracleSpeech(acumulada, { type: 'prioridade', date: HOJE, line: `l${i}` });
}
assert.equal(acumulada.length, ORACLE_SPEECH_MEMORY_SIZE, 'a memoria nao cresce sem limite');

// --- o assunto de molho passa a vez, nao vira silencio ----------------------
// E por isso que o arbitro devolve LISTA e nao vencedor.

// A arena precisa estar PARADA e nao so atrasada para vencer `prioridade`: a
// primeira fixture usava `atrasado` e falhou com razao, porque apontar a proxima
// acao concreta ja ganha de anunciar um atraso — inclusive com boost maximo.
const paradaEPrioridade = {
  ...contextoBase,
  priorityActionName: 'Correr 5km',
  arenas: [arena({ arenaId: 'a1', pace: 'critico', adjustment: 'pausar_arena', daysSinceProof: 9 })],
};

const semMemoria = buildPlannerCoachSpeechDetailed(paradaEPrioridade, () => 0, 'neutro', ORACLE_PRESENCE.PRESENTE, [], HOJE);
assert.equal(semMemoria.entry.type, 'arena_parada', 'sem memoria vence o mais relevante');

const comMemoria = buildPlannerCoachSpeechDetailed(
  paradaEPrioridade, () => 0, 'neutro', ORACLE_PRESENCE.PRESENTE,
  [{ type: 'arena_parada', arenaId: 'a1', date: ONTEM, line: 'x' }], HOJE,
);
assert.ok(comMemoria, 'assunto de molho nao pode virar silencio');
assert.equal(comMemoria.entry.type, 'prioridade', 'ele passa a vez para o proximo colocado');

// --- a mesma frase nao sai duas vezes seguidas -------------------------------
// O cooldown cuida do assunto; isto cuida da redacao. Sao coisas diferentes: um
// assunto pode voltar legitimamente e ainda assim nao merece a frase identica.

const soPrioridade = { ...contextoBase, priorityActionName: 'Correr 5km' };
const primeiraVez = buildPlannerCoachSpeechDetailed(soPrioridade, () => 0, 'neutro', ORACLE_PRESENCE.PRESENTE, [], HOJE);
const segundaVez = buildPlannerCoachSpeechDetailed(
  soPrioridade, () => 0, 'neutro', ORACLE_PRESENCE.PRESENTE,
  [{ type: 'prioridade', date: '2026-08-01', line: primeiraVez.line }], HOJE,
);
assert.notEqual(
  segundaVez.line, primeiraVez.line,
  'mesmo com o mesmo sorteio, a frase anterior nao se repete',
);

// Mas quando so sobra uma frase valida, repetir e melhor que calar — o cooldown
// ja e quem impede insistir no assunto.
const unicaValida = buildPlannerCoachSpeechDetailed(
  { ...contextoBase, arenas: [arena({ arenaName: 'Projeto', trend: 'retomando', trendPauseDays: null })] },
  () => 0, 'neutro', ORACLE_PRESENCE.PRESENTE,
  [{ type: 'arena_retomada', arenaId: 'a1', date: '2026-08-01', line: 'Projeto voltou a andar. Continua atras do planejado, e agora esta em movimento.' }],
  HOJE,
);
assert.ok(unicaValida && unicaValida.line, 'com uma unica frase valida, ele fala mesmo assim');

// --- sem data, comporta-se como antes de existir memoria --------------------
// Navegador com storage bloqueado, aba anonima, cota estourada: sem memoria o
// Oraculo volta a ser o que era, que e pior mas nao e quebrado.
assert.ok(
  buildPlannerCoachSpeechDetailed(paradaEPrioridade, () => 0, 'neutro', ORACLE_PRESENCE.PRESENTE,
    [{ type: 'arena_parada', arenaId: 'a1', date: ONTEM, line: 'x' }], ''),
  'sem data a memoria e ignorada em vez de calar o Oraculo',
);

// --- todo tipo declara cooldown ---------------------------------------------
for (const tipo of ORACLE_CANDIDATE_TYPES) {
  const peso = ORACLE_CANDIDATE_WEIGHTS[tipo];
  assert.ok(
    Number.isInteger(peso.cooldownDays) && peso.cooldownDays >= 0 && peso.cooldownDays <= 7,
    `${tipo} precisa dizer quantos dias fica de molho`,
  );
}


// --- marcos de sequencia -----------------------------------------------------
// Sem eles o numero nao significa nada: se o dia 30 chega com a mesma frase do
// dia 12, o acumulado nunca vira acumulado.

const marco = (streak) => ({ ...contextoBase, daysSinceLastProof: 0, dailyProofStreakCurrent: streak });

for (const numero of [7, 14, 30, 60, 100]) {
  const encontrados = detectOracleCandidates(marco(numero)).filter((c) => c.type === 'streak_marco');
  assert.equal(encontrados.length, 1, `${numero} dias e marco`);
  const linha = buildPlannerCoachSpeech(marco(numero), () => 0, 'neutro');
  assert.ok(new RegExp(String(numero)).test(linha), `a fala do marco ${numero} diz o numero`);
}

// Dia comum nao e marco.
for (const numero of [6, 12, 31]) {
  assert.deepEqual(
    detectOracleCandidates(marco(numero)).filter((c) => c.type === 'streak_marco'),
    [], `${numero} dias nao e marco`,
  );
}

// Marco anunciado no dia seguinte e resenha, nao celebracao.
assert.deepEqual(
  detectOracleCandidates({ ...marco(30), daysSinceLastProof: 1 }).filter((c) => c.type === 'streak_marco'),
  [], 'sem entrega hoje o marco nao foi alcancado hoje',
);

// O boost cresce com o marco: 100 dias e 7 dias sao coisas diferentes com o
// mesmo nome, e so o primeiro ganha de uma arena parada.
const nota = (n) => detectOracleCandidates(marco(n)).find((c) => c.type === 'streak_marco').score;
assert.ok(nota(100) > nota(30) && nota(30) > nota(7), 'marco maior pesa mais');

const arenaParadaComMarco = {
  ...marco(100),
  arenas: [arena({ adjustment: 'pausar_arena', daysSinceProof: 9 })],
};
assert.equal(
  rankOracleCandidates(arenaParadaComMarco, ORACLE_PRESENCE.PRESENTE)[0].type,
  'streak_marco',
  'cem dias ganham de uma arena parada',
);
assert.equal(
  rankOracleCandidates({ ...arenaParadaComMarco, dailyProofStreakCurrent: 7 }, ORACLE_PRESENCE.PRESENTE)[0].type,
  'arena_parada',
  'sete dias, nao',
);

// A unica entrada do banco que so oferece: nada de pedir acao no momento em que
// a pessoa nao deve nada a ninguem.
for (const tom of ['neutro', 'coach', 'reflexivo', 'calmo']) {
  const linha = buildPlannerCoachSpeech(marco(30), () => 0, tom);
  assert.doesNotMatch(
    semAcento(linha), /escolhe uma|feche uma|abra |uma acao hoje|corte /i,
    `${tom}: marco nao pede nada`,
  );
}

// --- a segunda noite seguida no limite --------------------------------------
// `diasSeguidos` vem da memoria e nao do detector, e na primeira vez vale null —
// entao fillCoachLine invalida sozinho as linhas que o usam. A variacao "segunda
// noite" nao existe ate existir, sem nenhum `if` a mais.

const noiteEmRisco = { ...contextoBase, daysSinceLastProof: 1, dailyProofStreakCurrent: 23, hourOfDay: 22 };

const primeiraNoite = buildPlannerCoachSpeechDetailed(noiteEmRisco, () => 0, 'neutro', ORACLE_PRESENCE.PRESENTE, [], HOJE);
assert.ok(!/\{diasSeguidos\}|undefined|null/.test(primeiraNoite.line), 'primeira noite nao usa a variavel que nao existe');
assert.equal(primeiraNoite.consecutiveDays, 0, 'primeira noite nao tem dias seguidos');

const segundaNoite = buildPlannerCoachSpeechDetailed(
  noiteEmRisco, () => 0, 'neutro', ORACLE_PRESENCE.PRESENTE,
  [{ type: 'streak_em_risco', date: ONTEM, line: 'x' }], HOJE,
);
assert.equal(segundaNoite.consecutiveDays, 1, 'ontem tambem foi noite de risco');
assert.ok(!/\{\w+\}/.test(segundaNoite.line), 'nenhum marcador pode sobrar');

// --- a volta e o acontecimento ----------------------------------------------
// As linhas antigas anunciavam a ausencia para quem acabara de encerra-la:
// "voce nao abre o Planner ha 5 dias", dito a alguem com o Planner na mao.

const voltou = { ...contextoBase, daysSinceLastPlannerOpen: 5 };
for (const tom of ['neutro', 'coach', 'reflexivo', 'calmo']) {
  const linha = buildPlannerCoachSpeech(voltou, () => 0, tom);
  assert.match(linha, /volt|de volta/i, `${tom}: quem esta lendo isto voltou, e e disso que se fala`);
  assert.doesNotMatch(semAcento(linha), /nao abre|sem passar por aqui|sem aparecer/i, `${tom}: nao anunciar a ausencia para quem a encerrou`);
  assert.match(linha, /5/, `${tom}: o intervalo continua sendo dito`);
}


// --- repertorio proporcional a frequencia -----------------------------------
// Encher todos os estados por igual seria desperdicio: `estrutura_enxuta` quase
// nunca dispara, e `prioridade` pode falar dia sim dia nao por semanas.
//
// O cooldown ja e a medida de frequencia — foi para isso que ele foi escrito —
// entao ele decide quantas variacoes o estado precisa ter. E precisa mesmo:
// com duas linhas e a memoria impedindo repetir a anterior, a escolha vira
// ALTERNANCIA, e alternancia e detectavel em quatro exposicoes.
//
// streak_marco e a excecao declarada: cooldown zero, mas so acontece cinco vezes
// na vida de alguem. Frequencia baixa por outro motivo que nao o cooldown.

const MINIMO_POR_TOM = { 0: 4, 1: 4, 2: 3, 3: 2 };
const EXCECOES_DE_FREQUENCIA = new Set(['streak_marco']);

for (const estado of COACH_LINE_STATES) {
  const cooldown = ORACLE_CANDIDATE_WEIGHTS[estado].cooldownDays;
  const minimo = EXCECOES_DE_FREQUENCIA.has(estado) ? 2 : (MINIMO_POR_TOM[cooldown] ?? 2);
  for (const [tom, linhas] of Object.entries(COACH_LINES[estado])) {
    assert.ok(
      linhas.length >= minimo,
      `${estado}.${tom} tem ${linhas.length} linhas e precisa de ${minimo}: quem fala mais precisa variar mais`,
    );
  }
}

// Nenhuma linha repetida dentro do mesmo estado e tom — duas iguais reduzem a
// variacao real sem que a contagem denuncie.
for (const estado of COACH_LINE_STATES) {
  for (const [tom, linhas] of Object.entries(COACH_LINES[estado])) {
    assert.equal(
      new Set(linhas).size, linhas.length,
      `${estado}.${tom} tem linha repetida`,
    );
  }
}

// As quatro vozes precisam ser vozes diferentes. Se dois tons dizem a mesma
// frase, um deles nao existe — e tres dos quatro sao pagos.
for (const estado of COACH_LINE_STATES) {
  const vistas = new Map();
  for (const [tom, linhas] of Object.entries(COACH_LINES[estado])) {
    for (const linha of linhas) {
      assert.ok(!vistas.has(linha), `${estado}: ${tom} e ${vistas.get(linha)} dizem a mesma frase`);
      vistas.set(linha, tom);
    }
  }
}

assert.ok(countCoachLines() >= 176, 'o banco de aberturas nao pode encolher sem alguem notar');


// --- o texto que a pessoa le e escrito em portugues -------------------------
// O banco inteiro nasceu sem acento. Em um app em portugues isso nao e detalhe:
// e a diferenca entre um texto escrito e um texto digitado com pressa, e a
// pessoa nota na primeira frase.

const TODAS_AS_LINHAS = COACH_LINE_STATES.flatMap(
  (estado) => Object.values(COACH_LINES[estado]).flat(),
);

for (const linha of TODAS_AS_LINHAS) {
  // Palavras que so existem acentuadas em portugues. Se alguma aparecer sem
  // acento, o texto voltou a ser digitado e nao escrito.
  assert.doesNotMatch(
    linha,
    /(nao|voce|acao|acoes|sequencia|amanha|numero|proxima|proximo|periodo|tambem|ate|so|ja|ha|atras|dificil|facil|historico|maximo|minimo|pe)/,
    `sem acento: ${linha}`,
  );

  // Comeca com maiuscula e termina com pontuacao. Uma frase solta no meio do
  // banco quebra o ritmo de leitura de todas as outras.
  assert.match(linha, /^[A-ZÀ-Ý0-9{"]/, `sem maiuscula inicial: ${linha}`);
  assert.match(linha, /[.?!]$/, `sem pontuacao final: ${linha}`);

  // Marcador acentuado nunca preenche: fillCoachLine procura {acoes}, e {ações}
  // passaria batido deixando a chave crua na tela. Foi o que a primeira passada
  // de acentuacao fez, e so aparece quando a frase ja esta na frente da pessoa.
  assert.doesNotMatch(linha, /\{[^}]*[À-ÿ][^}]*\}/, `marcador acentuado: ${linha}`);
}


// --- o rastro da decisao -----------------------------------------------------
// O proximo ganho do Oraculo nao vem do candidato numero quinze. Vem de
// descobrir quando ele deveria ter ficado quieto — e isso so aparece observando
// gente usando. Sem rastro, o relato possivel e "ficou estranho" e a resposta
// possivel e um chute.

const cenarioRico = {
  ...contextoBase,
  daysSinceLastPlannerOpen: 6,
  priorityActionName: 'Correr 5km',
  cycleDayNumber: 12,
  plannedDailyDemand: 40,
  bestDailyCompletions: 7,
  daysWithCompletions: 9,
  arenas: [arena({ arenaId: 'a1', pace: 'critico', adjustment: 'pausar_arena', daysSinceProof: 9 })],
};

const decisao = decideOracleSpeech(cenarioRico, () => 0, 'neutro', ORACLE_PRESENCE.PRESENTE, [], HOJE);
assert.ok(decisao.chosen, 'o cenario rico produz fala');
assert.ok(decisao.rows.length >= 4, 'o rastro precisa listar os concorrentes, nao so o vencedor');
assert.equal(decisao.rows.filter((r) => r.outcome === 'venceu').length, 1, 'um vencedor, sempre');
assert.equal(decisao.rows[0].type, decisao.chosen.entry.type, 'quem venceu aparece no topo do rastro');

// Quem perdeu tambem aparece. Um candidato barrado pela presenca e um barrado
// por cooldown produzem o mesmo silencio na tela e pedem consertos opostos: um
// e limiar, o outro e frequencia.
const porCooldown = decideOracleSpeech(
  cenarioRico, () => 0, 'neutro', ORACLE_PRESENCE.PRESENTE,
  [{ type: 'meta_inflada', date: HOJE, line: 'x' }], HOJE,
);
assert.ok(
  porCooldown.rows.some((r) => r.type === 'meta_inflada' && r.outcome === 'de_molho'),
  'o rastro diz que foi o cooldown, e nao o limiar',
);

// E o silencio tambem e explicavel: "por que ele nao falou nada?" e uma pergunta
// tao comum quanto "por que ele falou isso?".
const noEquilibrado = decideOracleSpeech(
  { ...contextoBase, completedActionNameToday: 'Correr 5km' },
  () => 0, 'neutro', ORACLE_PRESENCE.EQUILIBRADO, [], HOJE,
);
assert.equal(noEquilibrado.chosen, null, 'elogio de rotina nao passa no Equilibrado');
assert.ok(
  noEquilibrado.rows.some((r) => r.outcome === 'cortado_por_presenca'),
  'o silencio precisa dizer que foi a presenca que cortou',
);

// O texto tem de ser legivel por gente: o teste acontece no celular, onde nao ha
// console, e diagnostico que ninguem le nao diagnostica nada.
const texto = formatOracleDecisionLog([{
  at: '2026-08-28T21:30:00.000Z', presence: 3, threshold: 5, tone: 'neutro',
  chosen: decisao.chosen.entry.type, line: decisao.chosen.line, rows: decisao.rows,
}]);
assert.match(texto, /presenca 3/, 'o texto diz a presenca');
assert.match(texto, /=>/, 'o texto diz no que deu');
assert.match(texto, new RegExp(decisao.chosen.entry.type), 'o texto nomeia o vencedor');
assert.match(formatOracleDecisionLog([]), /Sem decisoes/, 'log vazio nao quebra o texto');

console.log('Oracle arbiter: candidatos competem, o pior de cada tipo fala primeiro, e o silencio e uma resposta valida.');
