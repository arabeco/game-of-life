import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleCycleCoachBrief } from '../utils/oracleCoach.ts';

const baseContext = {
  hasArenas: true,
  totalArenas: 2,
  hasCycle: true,
  cycleName: 'Ciclo curto',
  cycleDayNumber: 3,
  cycleTotalDays: 7,
  cycleDaysRemaining: 4,
  cycleCompletionPercent: 40,
  expectedCycleCompletionPercent: 43,
  cyclePace: 'no_ritmo',
  cycleTotalActions: 10,
  cycleCompletedActions: 4,
  cyclePendingActions: 6,
  priorityActionName: 'treinar',
  focusArenaSignal: {
    arenaId: 'arena-health',
    arenaName: 'Saude',
  },
};

const firstArena = buildOracleCycleCoachBrief({
  ...baseContext,
  hasArenas: false,
  totalArenas: 0,
  hasCycle: false,
});
assert.equal(firstArena.id, 'coach:first-arena');
assert.equal(firstArena.quickActions[0]?.kind, 'open_arenas');

const noCycle = buildOracleCycleCoachBrief({
  ...baseContext,
  hasCycle: false,
});
assert.equal(noCycle.id, 'coach:start-cycle');
assert.deepEqual(noCycle.quickActions.map((action) => action.kind), ['open_cycle', 'open_arenas']);

const behind = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletionPercent: 20,
  expectedCycleCompletionPercent: 60,
  cyclePace: 'critico',
});
assert.match(behind.content, /20%/);
assert.match(behind.content, /Saude/);
assert.equal(behind.quickActions[0]?.kind, 'open_arena');
assert.equal(behind.quickActions[0]?.arenaId, 'arena-health');
assert.equal(behind.quickActions[1]?.kind, 'open_planner');

const lastDay = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleDaysRemaining: 0,
  cyclePace: 'atrasado',
  cyclePendingActions: 3,
});
assert.match(lastDay.content, /[uú]ltimo dia/);
assert.deepEqual(lastDay.quickActions.map((action) => action.kind), ['open_planner', 'open_cycle']);

const completed = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletionPercent: 100,
  cycleCompletedActions: 10,
  cyclePendingActions: 0,
});
// O texto antigo MANDAVA fechar ("Feche este ciclo"). Ciclo vencido fecha
// sozinho hoje, entao este caso e de quem terminou tudo ANTES do prazo — e ai
// fechar e escolha, nao instrucao. A frase passa a dizer os dias que sobram e a
// oferecer as duas portas.
assert.doesNotMatch(completed.content, /Feche este ciclo/i, 'nao manda fechar o que fecha sozinho');
assert.match(completed.content, /ainda faltam 4 dias/, 'diz quanto tempo sobra');
assert.match(completed.content, /ou deixar rodando/, 'a segunda porta existe');
assert.equal(completed.quickActions[0]?.kind, 'open_cycle');

const onPace = buildOracleCycleCoachBrief(baseContext);
assert.match(onPace.content, /Que tal treinar hoje/);
assert.equal(onPace.quickActions[0]?.kind, 'open_planner');

const coachSource = readFileSync(new URL('../utils/oracleCoach.ts', import.meta.url), 'utf8');
assert.doesNotMatch(coachSource, /supabase|fetch\(|invoke\(|hasPremiumAccess/i);

const chatSource = readFileSync(new URL('../components/OracleChat.tsx', import.meta.url), 'utf8');
assert.match(chatSource, /buildOracleCycleCoachBrief\(operationalContext\)/);
assert.match(chatSource, /case 'open_arena'/);
assert.match(chatSource, /showArenaId: arenaId/);

console.log('Oracle cycle coach regression: local diagnosis and safe navigation are covered.');

// ===================================================================
// AS LEITURAS NOVAS
//
// Elas so podem existir porque a cascata virou fila: antes o primeiro `if` que
// casasse vencia, e "atrasado"/"adiantado" pegavam quase todo mundo — qualquer
// caso colocado depois deles nunca seria considerado.
// ===================================================================

const sinal = (id, nome, feitas, pendentes) => ({
  arenaId: id, arenaName: nome,
  completedActions: feitas, pendingActions: pendentes,
  plannedActions: feitas + pendentes,
});

// --- a conta nao fecha: capacidade contra exigencia ------------------------
const contaNaoFecha = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePendingActions: 34,
  cycleDaysRemaining: 6,
  bestDailyCompletions: 3,
});
assert.match(contaNaoFecha.content, /Faltam 34 ações e 6 dias/, 'diz o que falta e o tempo');
assert.match(contaNaoFecha.content, /seu melhor dia até agora foram 3/, 'compara com a capacidade real');
assert.match(contaNaoFecha.content, /não tira EXP já conquistada/, 'a saida e editar o plano, nao correr atras');

// Ela NAO aparece quando a conta fecha: 6 em 4 dias com melhor dia de 3 cabe.
const contaFecha = buildOracleCycleCoachBrief({ ...baseContext, bestDailyCompletions: 3 });
assert.doesNotMatch(contaFecha.content, /Isso pede/, 'nao alarma quando a conta fecha');

// --- arena que nunca comecou ----------------------------------------------
const natimorta = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePace: 'no_ritmo',
  arenaSignals: [sinal('a', 'Academia', 8, 2), sinal('b', 'Leitura', 0, 5), sinal('c', 'Estudo', 3, 1)],
});
assert.match(natimorta.content, /Leitura ainda não recebeu nenhum registro/, 'nomeia a que nunca andou');
assert.match(natimorta.content, /Você desenhou este ciclo/, 'o sujeito e o ciclo, nao a pessoa');

// Todas paradas nao e "arena natimorta", e ciclo que nao comecou — outro caso.
const nenhumaComecou = buildOracleCycleCoachBrief({
  ...baseContext,
  cycleCompletedActions: 0,
  arenaSignals: [sinal('a', 'Academia', 0, 4), sinal('b', 'Leitura', 0, 5)],
});
assert.doesNotMatch(nenhumaComecou.content, /não receberam nenhum registro/, 'ciclo inteiro parado nao vira acusacao de arena');

// --- concentracao: revela, nao julga --------------------------------------
const concentrado = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePace: 'no_ritmo',
  arenaSignals: [sinal('a', 'Academia', 7, 1), sinal('b', 'Leitura', 2, 1), sinal('c', 'Estudo', 1, 1)],
});
assert.match(concentrado.content, /de cada 10 registros foram em Academia/, 'revela a concentracao');
assert.doesNotMatch(concentrado.content, /equilibr|deveria|tente/i, 'nao julga: a frase termina no fato');

// --- a projecao de dias no adiantado --------------------------------------
const adiantado = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePace: 'adiantado',
  cycleDayNumber: 4,
  cycleCompletedActions: 8,
  cyclePendingActions: 2,
  cycleDaysRemaining: 6,
});
assert.match(adiantado.content, /fecha \d+ dias? antes do prazo/, 'a projecao diz quantos dias sobram');

// --- a ordem: a mais especifica ganha da mais generica ---------------------
const atrasadoEComConta = buildOracleCycleCoachBrief({
  ...baseContext,
  cyclePace: 'atrasado',
  cyclePendingActions: 34,
  cycleDaysRemaining: 6,
  bestDailyCompletions: 3,
});
assert.match(atrasadoEComConta.content, /Isso pede/, 'a conta que nao fecha ganha do "esta atrasado" generico');

console.log('Ler meu dia: conta que nao fecha, arena natimorta, concentracao e projecao, na ordem certa.');
