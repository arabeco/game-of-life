import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ARENA_PACT_REWARDS,
  buildArenaStats,
  buildPactCandidates,
  buildPactCandidatesForArena,
  buildPactsForArena,
  CONSTANCIA_DAYS,
  DIAS_PARA_RETOMADA,
  isArenaEligible,
  measurePactProgress,
  MIN_ACTIONS_FOR_CONCLUSAO,
} from '../utils/arenaPacts.ts';

// O pacto propoe missao sobre arena que o jogador JA TEM. O risco nao e o calculo,
// e o Oraculo propor besteira: arena arquivada, travada, vazia ou ja fechada. Uma
// proposta assim queima a confianca de quem le, entao e o que este teste mais prende.

const HOJE = '2026-08-23';

const arena = (id, extra = {}) => ({
  id,
  assetId: 'a1',
  name: `Arena ${id}`,
  description: '',
  icon: '\u{1F3DF}️',
  actionIds: [`${id}-a`, `${id}-b`, `${id}-c`, `${id}-d`],
  ...extra,
});

const action = (id, arenaId, reps = 1) => ({
  id,
  arenaId,
  name: id,
  description: '',
  icon: '',
  duration: 30,
  repetitions: reps,
  isMilestone: false,
});

const task = (actionId, date, completed = true) => ({
  id: `t-${actionId}-${date}`,
  actionId,
  date,
  startTime: 540,
  duration: 30,
  completed,
});

const actionsFor = (...arenas) => arenas.flatMap((a) => (a.actionIds || []).map((id) => action(id, a.id)));

// --- elegibilidade: o Oraculo nao pode propor besteira --------------------
const casosInvalidos = [
  ['arquivada', arena('x', { isArchived: true })],
  ['ja concluida', arena('x', { isCleared: true })],
  ['escondida', arena('x', { isHidden: true })],
  ['sem acoes', arena('x', { actionIds: [] })],
];

for (const [rotulo, a] of casosInvalidos) {
  const stats = buildArenaStats(a, actionsFor(a), [], HOJE);
  assert.equal(isArenaEligible(stats), false, `arena ${rotulo} nao pode receber pacto`);
  assert.deepEqual(
    buildPactCandidatesForArena(a, actionsFor(a), [], HOJE),
    [],
    `arena ${rotulo} nao pode gerar proposta`,
  );
}

// Arena travada por campanha nao tem campo proprio: `is_locked` nao e coluna e o
// estado sai do arenaConfig, recalculado pelos pre-requisitos. Chega por fora.
const travada = arena('travada');
const statsTravada = buildArenaStats(travada, actionsFor(travada), [], HOJE, { lockedArenaIds: new Set(['travada']) });
assert.equal(statsTravada.isLocked, true);
assert.equal(isArenaEligible(statsTravada), false, 'arena travada por campanha nao recebe pacto');
assert.deepEqual(
  buildPactCandidatesForArena(travada, actionsFor(travada), [], HOJE, { lockedArenaIds: new Set(['travada']) }),
  [],
  'arena travada nao gera proposta',
);
assert.ok(
  isArenaEligible(buildArenaStats(travada, actionsFor(travada), [], HOJE)),
  'sem o conjunto de travadas a mesma arena volta a ser elegivel',
);

const viva = arena('viva');
assert.equal(isArenaEligible(buildArenaStats(viva, actionsFor(viva), [], HOJE)), true);

// e a lista geral tambem tem de filtrar
const candidatosComLixo = buildPactCandidates(
  [arena('arq', { isArchived: true }), arena('cle', { isCleared: true }), viva],
  actionsFor(viva),
  [],
  HOJE,
);
assert.ok(candidatosComLixo.length > 0);
assert.ok(
  candidatosComLixo.every((pact) => pact.arenaId === 'viva'),
  'so a arena viva pode aparecer nas propostas',
);

// --- retomada so aparece quando ha o que retomar --------------------------
const paradaHaMuito = arena('parada');
const tarefasAntigas = [task('parada-a', '2026-08-01')];
const statsParada = buildArenaStats(paradaHaMuito, actionsFor(paradaHaMuito), tarefasAntigas, HOJE);
assert.equal(statsParada.daysSinceLastDelivery, 22);

const pactosParada = buildPactCandidatesForArena(paradaHaMuito, actionsFor(paradaHaMuito), tarefasAntigas, HOJE);
assert.ok(pactosParada.some((pact) => pact.kind === 'retomada'), `parada ha ${DIAS_PARA_RETOMADA}+ dias oferece retomada`);

const ativaOntem = arena('ativa');
const tarefasRecentes = [task('ativa-a', '2026-08-22')];
const pactosAtiva = buildPactCandidatesForArena(ativaOntem, actionsFor(ativaOntem), tarefasRecentes, HOJE);
assert.ok(
  !pactosAtiva.some((pact) => pact.kind === 'retomada'),
  'arena que entregou ontem nao precisa ser retomada',
);

// --- conclusao exige arena de tamanho real (anti-fachada) -----------------
const pequena = arena('peq', { actionIds: ['peq-a', 'peq-b'] });
const pactosPequena = buildPactCandidatesForArena(pequena, actionsFor(pequena), [], HOJE);
assert.ok(
  !pactosPequena.some((pact) => pact.kind === 'conclusao'),
  `arena com menos de ${MIN_ACTIONS_FOR_CONCLUSAO} acoes nao vale pacto de conclusao`,
);

const grande = arena('gra');
const pactosGrande = buildPactCandidatesForArena(grande, actionsFor(grande), [], HOJE);
assert.ok(pactosGrande.some((pact) => pact.kind === 'conclusao'));

// --- ate 3 propostas, dificuldades e arenas distintas --------------------
const muitas = [arena('m1'), arena('m2'), arena('m3'), arena('m4'), arena('m5')];
const tarefasVariadas = [
  task('m1-a', '2026-08-01'), // parada
  task('m2-a', '2026-08-22'), // ativa
  task('m3-a', '2026-08-10'),
];
const tres = buildPactCandidates(muitas, actionsFor(...muitas), tarefasVariadas, HOJE);
assert.ok(tres.length <= 3, 'no maximo tres propostas');
assert.equal(new Set(tres.map((pact) => pact.arenaId)).size, tres.length, 'uma arena por proposta');
assert.equal(new Set(tres.map((pact) => pact.difficulty)).size, tres.length, 'dificuldades diferentes');

// --- recompensa escala com a faixa ---------------------------------------
assert.ok(ARENA_PACT_REWARDS.alta.gold > ARENA_PACT_REWARDS.media.gold);
assert.ok(ARENA_PACT_REWARDS.media.gold > ARENA_PACT_REWARDS.leve.gold);
assert.ok(ARENA_PACT_REWARDS.alta.chest, 'a faixa alta entrega bau');
assert.ok(!ARENA_PACT_REWARDS.leve.chest, 'a faixa leve nao entrega bau');
for (const pact of tres) {
  assert.deepEqual(pact.reward, ARENA_PACT_REWARDS[pact.difficulty], 'premio vem da faixa, nao do tamanho da arena');
}

// --- medicao: constancia conta DIAS, nao acoes ---------------------------
const alvo = arena('alvo');
const pactoConstancia = {
  id: 'p1',
  kind: 'constancia',
  difficulty: 'media',
  arenaId: 'alvo',
  arenaName: 'Arena alvo',
  arenaIcon: '',
  title: '',
  description: '',
  goal: CONSTANCIA_DAYS.media,
  reward: ARENA_PACT_REWARDS.media,
  startedOn: '2026-08-20',
};

// cinco acoes num unico dia continuam sendo um dia
const cincoNoMesmoDia = ['alvo-a', 'alvo-b', 'alvo-c', 'alvo-d', 'alvo-a']
  .map((id, index) => ({ ...task(id, '2026-08-21'), id: `dup-${index}` }));
const umDia = measurePactProgress(pactoConstancia, alvo, actionsFor(alvo), cincoNoMesmoDia);
assert.equal(umDia.current, 1, 'cinco acoes num dia valem um dia');
assert.equal(umDia.completed, false);

const tresDias = measurePactProgress(pactoConstancia, alvo, actionsFor(alvo), [
  task('alvo-a', '2026-08-21'),
  task('alvo-b', '2026-08-22'),
  task('alvo-c', '2026-08-23'),
]);
assert.equal(tresDias.current, 3);

// --- o passado nao conta: aceitar nao pode ja vir cumprido ---------------
const antesDoAceite = measurePactProgress(pactoConstancia, alvo, actionsFor(alvo), [
  task('alvo-a', '2026-08-10'),
  task('alvo-b', '2026-08-11'),
  task('alvo-c', '2026-08-12'),
  task('alvo-d', '2026-08-13'),
  task('alvo-a', '2026-08-14'),
]);
assert.equal(antesDoAceite.current, 0, 'entregas anteriores ao aceite nao contam');
assert.equal(antesDoAceite.completed, false);

// --- tarefa nao concluida nao conta --------------------------------------
const soPlanejada = measurePactProgress(pactoConstancia, alvo, actionsFor(alvo), [
  task('alvo-a', '2026-08-21', false),
]);
assert.equal(soPlanejada.current, 0);

// --- tarefa de outra arena nao conta -------------------------------------
const outra = measurePactProgress(pactoConstancia, alvo, actionsFor(alvo), [
  task('m1-a', '2026-08-21'),
]);
assert.equal(outra.current, 0, 'acao de outra arena nao alimenta o pacto');

// --- retomada fecha com uma unica entrega --------------------------------
const pactoRetomada = { ...pactoConstancia, kind: 'retomada', goal: 1 };
const retomou = measurePactProgress(pactoRetomada, alvo, actionsFor(alvo), [task('alvo-a', '2026-08-22')]);
assert.equal(retomou.completed, true);
assert.equal(retomou.percent, 100);

// arena sumida nao quebra a medicao
const semArena = measurePactProgress(pactoConstancia, null, actionsFor(alvo), []);
assert.equal(semArena.current, 0);
assert.equal(semArena.completed, false);

// --- o pacto precisa CHEGAR ao banco ------------------------------------
// updateUserProfile filtra o patch por uma allowlist. Os cinco campos do pacto
// ficaram de fora na primeira versao: aceitar mudava a tela e sumia no reload,
// sem erro nenhum. Silencioso assim volta facil, entao fica preso aqui.
const contextSource = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const allowStart = contextSource.indexOf('const allowedKeys: (keyof UserProfile)[] = [');
const allowEnd = contextSource.indexOf('];', allowStart);
assert.ok(allowStart >= 0 && allowEnd > allowStart, 'a allowlist de escrita do perfil deve ser identificavel');
const allowList = contextSource.slice(allowStart, allowEnd);

for (const field of [
  'arenaPactArenaId',
  'arenaPactKind',
  'arenaPactDifficulty',
  'arenaPactGoal',
  'arenaPactStartedOn',
]) {
  assert.ok(
    allowList.includes(`'${field}'`),
    `${field} precisa estar na allowlist de updateUserProfile, senao o pacto nao persiste`,
  );
}

// --- progresso e do CICLO, abandono e de sempre -------------------------
// ArenaCard recorta as tarefas por activeCycle, entao arena fechada no ciclo
// passado aparece aberta no novo. Se o pacto olhasse o historico inteiro,
// recusaria arena que a tela mostra vazia. Ja "parada ha 86 dias" precisa do
// historico: cortar por ciclo zeraria a conta a cada virada e a retomada nunca
// dispararia.
const doCiclo = arena('ciclo', { actionIds: ['ciclo-a'] });
const acaoUnica = [action('ciclo-a', 'ciclo', 1)];
const entregaAntiga = [task('ciclo-a', '2026-05-30')];

// olhando so o ciclo (sem tarefas), a arena esta aberta
const statsCiclo = buildArenaStats(doCiclo, acaoUnica, [], HOJE, { allTimeTasks: entregaAntiga });
assert.equal(statsCiclo.isCleared, false, 'entrega de ciclo anterior nao fecha a arena no ciclo novo');
assert.equal(isArenaEligible(statsCiclo), true, 'arena zerada pelo ciclo volta a ser elegivel');

// e o abandono continua contando desde a ultima entrega real
assert.equal(statsCiclo.daysSinceLastDelivery, 85, 'o abandono atravessa ciclos');
assert.ok(
  buildPactsForArena(statsCiclo, HOJE).some((pact) => pact.kind === 'retomada'),
  'arena parada desde outro ciclo ainda oferece retomada',
);

// sem allTimeTasks o historico e o proprio recorte: sem entrega, sem abandono
const semHistorico = buildArenaStats(doCiclo, acaoUnica, [], HOJE);
assert.equal(semHistorico.daysSinceLastDelivery, null);

console.log('Arena pacts regression: nao propoe arena invalida, conta dias e ignora o passado.');
