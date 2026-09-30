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
assert.match(livre.text, /4 a[cç][oõ]es conclu[ií]das/);
assert.doesNotMatch(livre.text, /m[eé]di[ao]|padr[aã]o hist[oó]rico/i, 'o nivel livre nao compara');

// --- premium: compara com o proprio dia medio no ciclo ---------------------
const premium = buildTodayDailyReading(base, 'premium');
assert.equal(premium.depth, 'premium');
assert.ok(premium.comparison, 'premium precisa de regua');
assert.match(premium.comparison, /Hoje 4/);
assert.match(premium.comparison, /2,0/, 'a media do ciclo entra na regua');
assert.match(premium.text, /acima do seu dia m[eé]dio/);
// Premium olha o dia, nunca o historico de ciclos.
assert.doesNotMatch(premium.comparison, /mediana/);

// --- platinum: compara o ciclo com o historico de ciclos fechados -----------
const platinum = buildTodayDailyReading(base, 'platinum');
assert.equal(platinum.depth, 'platinum');
assert.match(platinum.comparison, /mediana em 5 ciclos/);
assert.match(platinum.comparison, /70%/);
assert.match(platinum.text, /acima do seu padr[aã]o hist[oó]rico/);

// Platinum sem historico de ciclo CAI PRA REGUA DO DIA — nao pra nada.
//
// Antes ele retornava cedo com um aviso sobre a falta de dados, o que fazia
// platinum valer menos que premium: com um ciclo fechado so, premium mostrava a
// regua do dia medio e platinum, que paga mais, ficava sem regua nenhuma.
const platinumSemHistorico = buildTodayDailyReading(
  { ...base, pastCyclesCount: 1, pastCyclesExecutionMedianPct: 50 },
  'platinum',
);
assert.equal(platinumSemHistorico.text, premium.text, 'platinum nunca entrega menos que premium');
assert.equal(platinumSemHistorico.comparison, premium.comparison);
assert.doesNotMatch(platinumSemHistorico.text, /suficientes?|ainda n[aã]o h[aá]/i, 'o app nao fala do app');

// --- o texto informa, nao cobra -------------------------------------------
const diaFraco = buildTodayDailyReading(
  { ...base, completedCount: 1, cycleActiveDayAverage: 5 },
  'premium',
);
assert.match(diaFraco.text, /abaixo do seu dia m[eé]dio/);
assert.match(diaFraco.text, /cabe no ciclo/, 'dia abaixo da media nao pode soar como falha');
assert.doesNotMatch(diaFraco.text, /falh|fracass|perdeu|desperdic/i);

const cicloFraco = buildTodayDailyReading(
  { ...base, currentCycleExecutionPct: 30, pastCyclesExecutionMedianPct: 60 },
  'platinum',
);
assert.match(cicloFraco.text, /abaixo do seu padr[aã]o hist[oó]rico/);
assert.match(cicloFraco.text, /carga planejada/, 'ciclo abaixo aponta causa, nao culpa');
assert.doesNotMatch(cicloFraco.text, /falh|fracass|preguic/i);

// --- bordas ----------------------------------------------------------------
const semPlano = buildTodayDailyReading(
  { ...base, completedCount: 0, plannedCount: 0 },
  'premium',
);
assert.match(semPlano.text, /Nenhuma a[cç][aã]o registrada/);

const semDiaAnterior = buildTodayDailyReading(
  { ...base, cycleActiveDayAverage: null },
  'premium',
);
assert.equal(semDiaAnterior.comparison, null);
assert.equal(semDiaAnterior.text, livre.text, 'sem dia anterior no ciclo, a frase nao ganha cauda');

// Platinum cai para a regua do dia quando o historico de ciclos nao serve, mas
// ainda ha media no ciclo atual.
const platinumSemCiclos = buildTodayDailyReading(
  { ...base, pastCyclesCount: 0, pastCyclesExecutionMedianPct: null },
  'platinum',
);
assert.equal(platinumSemCiclos.depth, 'platinum');
// Cai para a regua do dia, que aqui existe: compara com o dia medio do ciclo.
assert.match(platinumSemCiclos.text, /dia m[eé]dio/);
assert.ok(platinumSemCiclos.comparison, 'ha media no ciclo atual, entao ha regua');

// --- a frase nao mede plano -----------------------------------------------
//
// Nenhum nivel pode escrever "7 de 9". O denominador de um dia e o que a pessoa
// marcou, e quem nao marca nada colheria um elogio vazio enquanto quem marca
// muito colheria a propria nota numa frase que so deveria descrever o dia.
for (const depth of ['livre', 'premium', 'platinum']) {
  for (const caso of [
    base,
    { ...base, completedCount: 1, distinctArenaCount: 1 },
    { ...base, completedCount: 6, plannedCount: 6 },
    { ...base, completedCount: 5, distinctArenaCount: 4 },
    { ...base, completedCount: 0 },
  ]) {
    const { text } = buildTodayDailyReading(caso, depth);
    assert.doesNotMatch(text, /\d+\s+de\s+\d+/, `"${text}" mede plano em ${depth}`);
    assert.doesNotMatch(text, /\barea\b|\bareas\b/i, `"${text}" diz "area"; o app chama de arena`);
  }
}

console.log('Daily reading regression: a assinatura muda a regua, nenhum nivel cobra do jogador, e nenhuma frase mede plano.');
