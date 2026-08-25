import assert from 'node:assert/strict';
import {
  buildCycleComparison,
  isFavourable,
  MIN_CYCLES_FOR_COMPARISON,
} from '../utils/cycleComparison.ts';

// O relatorio descrevia um ciclo isolado. Esta comparacao da a regua: "isso e bom
// PARA MIM". Os riscos reais sao tres, e cada um tem teste abaixo:
//  1. o proprio ciclo entrar na propria referencia;
//  2. dias sem entrega (menor e melhor) ser lido ao contrario;
//  3. um ciclo extremo deslocar a referencia — por isso mediana, nao media.

const cycle = (id, { exec, dias, seq, lacunas, score, planned = 100 }) => ({
  id,
  cycleId: `c-${id}`,
  startDate: '2026-01-01',
  endDate: '2026-01-30',
  performanceScore: score,
  metrics: {
    actionsCompleted: Math.round((exec / 100) * planned),
    totalPlannedActions: planned,
    arenasInvolved: 3,
    goalsMet: 2,
    totalHours: 40,
    executionRatePct: exec,
    consistencyDays: dias,
    maxStreak: seq,
    daysWithoutCompletion: lacunas,
  },
});

// --- amostra insuficiente nao inventa comparacao ---------------------------
const atual = cycle('atual', { exec: 70, dias: 20, seq: 6, lacunas: 4, score: 80 });

const semHistorico = buildCycleComparison(atual, []);
assert.equal(semHistorico.metrics.length, 0);
assert.equal(semHistorico.headline, null);
assert.equal(semHistorico.sampleSize, 0);

const umCiclo = buildCycleComparison(atual, [cycle('a', { exec: 50, dias: 10, seq: 3, lacunas: 9, score: 60 })]);
assert.equal(umCiclo.metrics.length, 0, `abaixo de ${MIN_CYCLES_FOR_COMPARISON} ciclos nao se compara`);

// --- o proprio ciclo nunca entra na propria referencia ---------------------
const historico = [
  cycle('a', { exec: 50, dias: 10, seq: 3, lacunas: 9, score: 60 }),
  cycle('b', { exec: 54, dias: 12, seq: 4, lacunas: 8, score: 64 }),
  cycle('c', { exec: 46, dias: 11, seq: 3, lacunas: 10, score: 58 }),
];

const comSigoMesmo = buildCycleComparison(atual, [...historico, atual]);
assert.equal(comSigoMesmo.sampleSize, 3, 'o ciclo atual deve ser removido da amostra');

const execucao = comSigoMesmo.metrics.find((metric) => metric.id === 'execucao');
assert.equal(execucao.baseline, 50, 'mediana de 50/54/46 e 50');
assert.equal(execucao.current, 70);
assert.equal(execucao.delta, 20);
assert.equal(execucao.direction, 'acima');

// --- metrica invertida: menos dias sem entrega e melhor -------------------
const lacunas = comSigoMesmo.metrics.find((metric) => metric.id === 'lacunas');
assert.equal(lacunas.lowerIsBetter, true);
assert.equal(lacunas.baseline, 9);
assert.equal(lacunas.current, 4);
assert.equal(lacunas.direction, 'abaixo');
assert.equal(isFavourable(lacunas), true, 'cair os dias sem entrega joga a favor');

// e o contrario tambem
const cicloComMaisLacunas = buildCycleComparison(
  cycle('ruim', { exec: 70, dias: 20, seq: 6, lacunas: 15, score: 80 }),
  historico,
);
const maisLacunas = cicloComMaisLacunas.metrics.find((metric) => metric.id === 'lacunas');
assert.equal(maisLacunas.direction, 'acima');
assert.equal(isFavourable(maisLacunas), false, 'subir os dias sem entrega nao e vitoria');

// --- mediana aguenta um ciclo extremo -------------------------------------
const comOutlier = buildCycleComparison(atual, [
  ...historico,
  cycle('heroico', { exec: 100, dias: 30, seq: 30, lacunas: 0, score: 100 }),
]);
const execComOutlier = comOutlier.metrics.find((metric) => metric.id === 'execucao');
assert.equal(execComOutlier.baseline, 52, 'mediana de 50/54/46/100 e 52; a media seria 62,5');

// --- tolerancia: diferenca pequena e estavel, nao vitoria -----------------
const quaseIgual = buildCycleComparison(
  cycle('igual', { exec: 52, dias: 11, seq: 3, lacunas: 9, score: 61 }),
  historico,
);
const execIgual = quaseIgual.metrics.find((metric) => metric.id === 'execucao');
assert.equal(execIgual.direction, 'estavel', '2 pontos de execucao nao e mudanca');
assert.match(quaseIgual.headline, /no seu padrao/);

// --- leitura de ciclo abaixo aponta causa, nao culpa ----------------------
const abaixo = buildCycleComparison(
  cycle('fraco', { exec: 20, dias: 4, seq: 1, lacunas: 20, score: 30 }),
  historico,
);
assert.match(abaixo.headline, /abaixo/);
assert.match(abaixo.headline, /carga planejada/, 'ciclo ruim aponta hipotese, nao falha do jogador');
assert.doesNotMatch(abaixo.headline, /falh|fracass|preguic|desperdic/i);

// --- relatorio antigo sem executionRatePct ainda compara ------------------
const antigo = { ...cycle('antigo', { exec: 50, dias: 10, seq: 3, lacunas: 9, score: 60 }) };
delete antigo.metrics.executionRatePct;
const outroAntigo = { ...cycle('antigo2', { exec: 60, dias: 12, seq: 4, lacunas: 8, score: 64 }) };
delete outroAntigo.metrics.executionRatePct;

const reconstruido = buildCycleComparison(atual, [antigo, outroAntigo]);
const execReconstruida = reconstruido.metrics.find((metric) => metric.id === 'execucao');
assert.ok(execReconstruida, 'executionRatePct ausente deve ser reconstruido de feitas/planejadas');
assert.equal(execReconstruida.baseline, 55);

console.log('Cycle comparison regression: mediana propria, metrica invertida correta, e sem culpa no texto.');
