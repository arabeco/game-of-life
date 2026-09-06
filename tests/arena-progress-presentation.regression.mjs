import assert from 'node:assert/strict';
import { describeArenaProgress, getArenaPresentationTasks } from '../utils/arenaProgressPresentation.ts';
import { calculateArenaProgress } from '../utils/progressUtilsEngine.js';

const arena = { id: 'arena', name: 'Treino' };
const action = { id: 'a', arenaId: arena.id, actionType: 'Ação Recorrente', repetitions: 7, duration: 30 };
const tasks = Array.from({ length: 5 }, (_, i) => ({
    id: String(i), actionId: 'a', date: '2026-09-05', completed: true,
    completedAt: '2026-09-05T15:00:00Z',
}));
const describe = (actions, items = tasks, options = {}) => describeArenaProgress(actions,
    calculateArenaProgress({ arena, actions, tasks: items, ...options }));
assert.deepEqual(describe([action]), { label: '5/7 ações', remaining: 2 });
assert.deepEqual(describe([{ ...action, duration: 120 }]), { label: '5/7 ações', remaining: 2 },
    'minutos declarados nao viram a unidade do contador');
assert.equal(describe([{ ...action, actionType: 'Livre' }]), null, 'livre nao ganha denominador');
assert.deepEqual(describe([action, { ...action, id: 'livre', actionType: 'Livre' }]),
    { label: '5/7 ações', remaining: 2 }, 'livre nao altera a meta mensuravel');
assert.equal(describe([action, { ...action, id: 'marco', actionType: 'Marco', repetitions: 1 }]).label,
    '63% concluído', 'tipos mistos preservam percentual');
assert.equal(describe([{ ...action, actionType: 'Marco' }]).label, '5/7 marcos');
assert.equal(describe([action], tasks, { forceSharedPool: true, getSharedActionPoolProgress: () => 3 }).label,
    '43% concluído', 'progresso compartilhado nao se apresenta como contagem pessoal');
const excess = Array.from({ length: 8 }, (_, i) => ({ ...tasks[0], id: String(i) }));
assert.deepEqual(describe([action], excess), { label: '8/7 ações', remaining: 0 },
    'excedente nao some e restante nao fica negativo');
assert.equal(describeArenaProgress([action], calculateArenaProgress({ arena, actions: [action], tasks }), 90).label,
    '90% concluído', 'percentual externo nao recebe contador incompatível');
const old = { ...tasks[0], id: 'old', date: '2026-08-01', completedAt: '2026-08-01T15:00:00Z' };
assert.equal(getArenaPresentationTasks([old, ...tasks], null, '2026-09-01T00:00:00Z', '2026-09-05').length, 5);
const cycle = { startDate: '2026-09-01', endDate: '2026-09-10' };
assert.equal(getArenaPresentationTasks([old, ...tasks, { ...tasks[0], date: '2026-09-06' }],
    cycle, null, '2026-09-05').length, 5, 'toast e card ignoram outro ciclo e datas futuras');
console.log('Arena progress presentation: 11 cenarios validados (unidades, livre, mistos, compartilhado, excedente e escopo).');
