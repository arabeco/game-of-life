import assert from 'node:assert/strict';
import { getArenaCapacitySummary } from '../utils/arenaCapacity.ts';
import { buildCycleCommitment } from '../utils/cycleCommitment.ts';
import { tarefasQueParam, copiaDaArena, diasAteConcluir } from '../utils/arenaFinalizada.ts';

/**
 * ARENA FINALIZADA (26/10/2026, decidido com o Afonso).
 *
 * A arena pode ter uma meta final opcional. Ao concluir: ela para de contar no
 * limite, as acoes param (as tarefas pendentes de hoje em diante saem do
 * planner, o historico fica) e, no ciclo, o que faltava nao conta contra:
 * o que foi feito vale como feito, mesmo depois de guardada nas Finalizadas.
 * "Concluir e criar copia" faz uma arena igual, com a meta em branco.
 */
const arenas = [
  { id: 'proj', name: 'Projeto', assetId: 'trabalho', isArchived: false, completedAt: '2026-10-20T15:00:00Z', finalGoal: 'Lançar', icon: '🚀', actionIds: [] },
  { id: 'casa', name: 'Casa', assetId: 'lazer', isArchived: false, actionIds: [] },
];
const actions = [
  { id: 'a-proj', arenaId: 'proj', name: 'Programar', repetitions: 10, actionType: 'Rotina', duration: 60, icon: '💻' },
  { id: 'a-casa', arenaId: 'casa', name: 'Arrumar', repetitions: 4, actionType: 'Rotina', duration: 30, icon: '🧹' },
];
const t = (id, actionId, date, completed) => ({ id, actionId, date, completed });
const tasks = [
  t('p1', 'a-proj', '2026-10-15', true), t('p2', 'a-proj', '2026-10-17', true), t('p3', 'a-proj', '2026-10-19', true),
  t('p4', 'a-proj', '2026-10-22', false), t('p5', 'a-proj', '2026-10-26', false),
  t('c1', 'a-casa', '2026-10-16', true), t('c2', 'a-casa', '2026-10-18', true),
];

// limite
const cap = getArenaCapacitySummary([{ id: 'trabalho', arenas }], null);
assert.equal(cap.total, 1, 'arena finalizada nao ocupa vaga, mesmo antes de ir para as Finalizadas');
console.log('ok - finalizada libera a vaga na hora');

// ciclo: a finalizada vale o que foi feito; o que faltou nao pesa
for (const isArchived of [false, true]) {
  const c = buildCycleCommitment({ actions, arenas: arenas.map((a) => (a.id === 'proj' ? { ...a, isArchived } : a)), tasks, startDate: '2026-10-12', endDate: '2026-10-31' });
  const proj = c.entries.find((e) => e.action.id === 'a-proj');
  assert.ok(proj, `a finalizada ${isArchived ? 'guardada' : 'na grade'} sumiu do ciclo`);
  assert.equal(proj.planned, 3, 'prometido da finalizada = o que foi feito');
  assert.equal(proj.completed, 3);
  assert.equal(proj.extra, true, 'finalizada nao vira meta a selar');
  assert.equal(c.plannedCount, 3 + 4, 'Casa continua com o prometido dela');
  assert.equal(c.completedCount, 3 + 2);
}
console.log('ok - no ciclo a finalizada conta so o feito, na grade ou guardada');

// as acoes param: pendentes de hoje em diante saem; feitas e passadas ficam
assert.deepEqual(tarefasQueParam({ tasks, actionIds: ['a-proj'], hoje: '2026-10-22' }), ['p4', 'p5']);
assert.deepEqual(tarefasQueParam({ tasks, actionIds: ['a-proj'], hoje: '2026-10-23' }), ['p5'], 'pendente de ontem fica como historico');
console.log('ok - so as pendentes de hoje em diante param');

// copia
const { arena: nova, acoes } = copiaDaArena(arenas[0], actions);
assert.equal(nova.name, 'Projeto');
assert.equal(nova.icon, '🚀');
assert.equal(nova.finalGoal, '', 'a copia nasce com a meta em branco');
assert.equal(nova.completedAt, null);
assert.equal(nova.isArchived, false);
assert.equal('id' in nova, false);
assert.equal(acoes.length, 1);
assert.equal(acoes[0].name, 'Programar');
assert.equal(acoes[0].repetitions, 10);
assert.equal('id' in acoes[0] || 'arenaId' in acoes[0], false, 'a copia da acao nao leva id nem arena antigos');
// quanto tempo levou: da criacao ate a conclusao, em dias (no minimo 1)
assert.equal(diasAteConcluir({ createdAt: '2026-09-08T10:00:00Z', completedAt: '2026-10-20T15:00:00Z' }), 43);
assert.equal(diasAteConcluir({ createdAt: '2026-10-20T08:00:00Z', completedAt: '2026-10-20T20:00:00Z' }), 1, 'concluida no mesmo dia conta 1');
assert.equal(diasAteConcluir({ completedAt: '2026-10-20T20:00:00Z' }), null, 'sem data de criacao nao inventa');
console.log('ok - tempo ate concluir em dias');
console.log('Arena finalizada: limite, ciclo, acoes que param, copia e tempo conferidos.');
