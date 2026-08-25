import assert from 'node:assert/strict';
import { buildTodayDailyReading } from '../utils/dailyInsights.ts';

// O painel diario nao falava sobre o dia corrente: buildHistoricalDailyInsight so
// cobre datas fechadas. buildTodayDailyReading cobre hoje, e a assinatura muda a
// REGUA, nao o elogio. Estes testes prendem essa separacao.

const base = {
  completedCount: 4,
  plannedCount: 6,
  distinctArenaCount: 2,
  topArenaName: 'Estudo',
  cycleActiveDayAverage: 2,
  currentCycleExecutionPct: 70,
  pastCyclesExecutionMedianPct: 50,
  pastCyclesCount: 5,
};

// --- livre: descreve, nunca compara ---------------------------------------
const livre = buildTodayDailyReading(base, 'livre');
assert.equal(livre.depth, 'livre');
assert.equal(livre.comparison, null, 'o nivel livre nao pode expor regua');
assert.match(livre.text, /4 de 6/);
assert.doesNotMatch(livre.text, /medi[ao]|padrao historico/i, 'o nivel livre nao compara');

// --- premium: compara com o proprio dia medio no ciclo ---------------------
const premium = buildTodayDailyReading(base, 'premium');
assert.equal(premium.depth, 'premium');
assert.ok(premium.comparison, 'premium precisa de regua');
assert.match(premium.comparison, /Hoje 4/);
assert.match(premium.comparison, /2,0/, 'a media do ciclo entra na regua');
assert.match(premium.text, /acima do seu dia medio/);
// Premium olha o dia, nunca o historico de ciclos.
assert.doesNotMatch(premium.comparison, /mediana/);

// --- platinum: compara o ciclo com o historico de ciclos fechados -----------
const platinum = buildTodayDailyReading(base, 'platinum');
assert.equal(platinum.depth, 'platinum');
assert.match(platinum.comparison, /mediana em 5 ciclos/);
assert.match(platinum.comparison, /70%/);
assert.match(platinum.text, /acima do seu padrao historico/);

// Platinum sem historico suficiente nao inventa comparacao nem quebra.
const platinumSemHistorico = buildTodayDailyReading(
  { ...base, pastCyclesCount: 1, pastCyclesExecutionMedianPct: 50 },
  'platinum',
);
assert.equal(platinumSemHistorico.comparison, null);
assert.match(platinumSemHistorico.text, /ciclos fechados suficientes/);

// --- o texto informa, nao cobra -------------------------------------------
const diaFraco = buildTodayDailyReading(
  { ...base, completedCount: 1, cycleActiveDayAverage: 5 },
  'premium',
);
assert.match(diaFraco.text, /abaixo do seu dia medio/);
assert.match(diaFraco.text, /cabe no ciclo/, 'dia abaixo da media nao pode soar como falha');
assert.doesNotMatch(diaFraco.text, /falh|fracass|perdeu|desperdic/i);

const cicloFraco = buildTodayDailyReading(
  { ...base, currentCycleExecutionPct: 30, pastCyclesExecutionMedianPct: 60 },
  'platinum',
);
assert.match(cicloFraco.text, /abaixo do seu padrao historico/);
assert.match(cicloFraco.text, /carga planejada/, 'ciclo abaixo aponta causa, nao culpa');
assert.doesNotMatch(cicloFraco.text, /falh|fracass|preguic/i);

// --- bordas ----------------------------------------------------------------
const semPlano = buildTodayDailyReading(
  { ...base, completedCount: 0, plannedCount: 0 },
  'premium',
);
assert.match(semPlano.text, /Nenhuma acao registrada/);

const semDiaAnterior = buildTodayDailyReading(
  { ...base, cycleActiveDayAverage: null },
  'premium',
);
assert.equal(semDiaAnterior.comparison, null);
assert.match(semDiaAnterior.text, /dias ativos anteriores/);

// Platinum cai para a regua do dia quando o historico de ciclos nao serve, mas
// ainda ha media no ciclo atual.
const platinumSemCiclos = buildTodayDailyReading(
  { ...base, pastCyclesCount: 0, pastCyclesExecutionMedianPct: null },
  'platinum',
);
assert.equal(platinumSemCiclos.depth, 'platinum');
assert.match(platinumSemCiclos.text, /ciclos fechados suficientes/);

console.log('Daily reading regression: a assinatura muda a regua, e nenhum nivel cobra do jogador.');
