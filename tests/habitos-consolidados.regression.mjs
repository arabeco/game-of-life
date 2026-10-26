import assert from 'node:assert/strict';
import { habitosConsolidados } from '../utils/habitosConsolidados.ts';

/**
 * HABITOS CONSOLIDADOS (25/10/2026, pedido do Afonso).
 *
 * Entra no relatorio do ciclo a acao feita pelo menos 6 dias por semana, com
 * 90% ou mais do que foi agendado. Treino de 5 dias e trabalho de dia util nao
 * entram, e nao e falha: 5 dias e o normal deles. Ciclo de menos de 7 dias nao
 * tem base para dizer que algo virou habito.
 */
const dias = (inicio, n) => Array.from({ length: n }, (_, i) => {
  const d = new Date(`${inicio}T12:00:00`);
  d.setDate(d.getDate() + i);
  return d.toISOString().slice(0, 10);
});
const D14 = dias('2026-10-05', 14);
const tarefa = (actionId, date, completed = true) => ({ id: `${actionId}-${date}`, actionId, date, completed });
const actions = [
  { id: 'pent', name: 'Pentágono', icon: '⬟' },
  { id: 'med', name: 'Meditação Zen', icon: '🧘' },
  { id: 'treino', name: 'ABCDE', icon: '🏋️' },
  { id: 'falha', name: 'Leitura', icon: '📖' },
];
const tasks = [
  ...D14.map((d) => tarefa('pent', d)), // 14 de 14
  ...D14.map((d, i) => tarefa('med', d, i !== 3)), // 13 de 14 agendadas: 93%, 6,5 por semana
  ...D14.filter((_, i) => i % 7 < 5).map((d) => tarefa('treino', d)), // 5 por semana
  ...D14.map((d, i) => tarefa('falha', d, i % 2 === 0)), // 7 de 14: 50%
];

const r = habitosConsolidados({ tasks, actions, inicio: '2026-10-05', fim: '2026-10-18' });
assert.deepEqual(r.map((h) => h.nome), ['Pentágono', 'Meditação Zen'], 'so entra quem faz 6+ dias por semana com 90%+');
assert.equal(r[0].dias, 14);
assert.equal(r[0].icone, '⬟');
assert.equal(r[1].dias, 13);
console.log('ok - 6+ dias por semana e 90%+ entram; treino de 5 dias e a acao falhada ficam de fora');

assert.deepEqual(habitosConsolidados({ tasks, actions, inicio: '2026-10-05', fim: '2026-10-10' }), [], 'ciclo de menos de 7 dias nao diz habito');
console.log('ok - ciclo curto nao tem base');

const fora = [...tasks, tarefa('pent', '2026-10-30')];
assert.equal(habitosConsolidados({ tasks: fora, actions, inicio: '2026-10-05', fim: '2026-10-18' })[0].dias, 14, 'tarefa fora do ciclo nao conta');
console.log('Habitos consolidados: regra do relatorio conferida.');
