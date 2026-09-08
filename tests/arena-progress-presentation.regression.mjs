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
// DUAS FORMAS DO MESMO NUMERO, e o teste prende as duas.
//
// `label` e o que aparece no card: so o contador. A palavra "ações" ocupava mais
// espaco que o dado e se repetia em toda arena da tela.
//
// `accessibleLabel` e o que o leitor de tela diz, e continua a frase inteira —
// encolher o visivel nao pode encolher o que e falado em voz alta. Sao dois
// campos justamente para que um nao arraste o outro sem querer.
assert.deepEqual(describe([action]), { label: '5/7', accessibleLabel: '5/7 ações', remaining: 2 });
assert.deepEqual(describe([{ ...action, duration: 120 }]), { label: '5/7', accessibleLabel: '5/7 ações', remaining: 2 },
    'minutos declarados nao viram a unidade do contador');
assert.equal(describe([{ ...action, actionType: 'Livre' }]), null, 'livre nao ganha denominador');
assert.deepEqual(describe([action, { ...action, id: 'livre', actionType: 'Livre' }]),
    { label: '5/7', accessibleLabel: '5/7 ações', remaining: 2 }, 'livre nao altera a meta mensuravel');
// No percentual o visivel perde so a palavra "concluído"; o numero ja se explica.
assert.equal(describe([action, { ...action, id: 'marco', actionType: 'Marco', repetitions: 1 }]).label,
    '63%', 'tipos mistos preservam percentual');
assert.equal(describe([action, { ...action, id: 'marco', actionType: 'Marco', repetitions: 1 }]).accessibleLabel,
    '63% concluído', 'e a voz continua dizendo do que aquilo se trata');
assert.equal(describe([{ ...action, actionType: 'Marco' }]).label, '5/7');
assert.equal(describe([{ ...action, actionType: 'Marco' }]).accessibleLabel, '5/7 marcos',
    'marco continua sendo marco para quem ouve');
assert.equal(describe([action], tasks, { forceSharedPool: true, getSharedActionPoolProgress: () => 3 }).label,
    '43%', 'progresso compartilhado nao se apresenta como contagem pessoal');
const excess = Array.from({ length: 8 }, (_, i) => ({ ...tasks[0], id: String(i) }));
assert.deepEqual(describe([action], excess), { label: '8/7', accessibleLabel: '8/7 ações', remaining: 0 },
    'excedente nao some e restante nao fica negativo');
assert.equal(describeArenaProgress([action], calculateArenaProgress({ arena, actions: [action], tasks }), 90).label,
    '90%', 'percentual externo nao recebe contador incompatível');
const old = { ...tasks[0], id: 'old', date: '2026-08-01', completedAt: '2026-08-01T15:00:00Z' };
assert.equal(getArenaPresentationTasks([old, ...tasks], null, '2026-09-01T00:00:00Z', '2026-09-05').length, 5);
const cycle = { startDate: '2026-09-01', endDate: '2026-09-10' };
assert.equal(getArenaPresentationTasks([old, ...tasks, { ...tasks[0], date: '2026-09-06' }],
    cycle, null, '2026-09-05').length, 5, 'toast e card ignoram outro ciclo e datas futuras');
console.log('Arena progress presentation: 11 cenarios validados (unidades, livre, mistos, compartilhado, excedente e escopo).');
