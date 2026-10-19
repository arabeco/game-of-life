import assert from 'node:assert/strict';
import { build } from 'esbuild';

/**
 * MISSAO E CAMPANHA CONTAM SO PARA O BEM (19/10/2026, decisao do Afonso).
 *
 * "Andarilho: 20 caminhadas. Fiz 3, nao fiz 17, acabou o ciclo. Nao quero
 * perder % de conclusao; quero as 3 acoes e o tempo que andei contados."
 *
 * Missao de temporada, missao de cla e campanha entram no ciclo como
 * PROMETIDO = FEITO: so o que foi feito dentro do ciclo, nos dois lados da
 * conta. O que faltou nao pesa; o que foi feito conta como acao, dia e horas.
 * Somar "x de x" nunca baixa a porcentagem.
 */
const codigo = `
export { buildCycleCommitment } from './utils/cycleCommitment.ts';
export { buildFairScoreFromTasks } from './utils/fairScoreUtils.js';
export { medirCicloPrometido } from './supabase/functions/_shared/oracle-cycle-reading.ts';
`;
const saida = await build({ stdin: { contents: codigo, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const api = await import('data:text/javascript;base64,' + Buffer.from(saida.outputFiles[0].text).toString('base64'));

const ciclo = { startDate: '2026-10-01', endDate: '2026-10-07' };
const arenas = [
  { id: 'propria', name: 'Corpo', assetId: 'saude' },
  { id: 'temporada', name: 'Quests - Season', assetId: 'saude' },
  { id: 'camp', name: 'Leitura', assetId: 'mente', originCodexId: 'livro' },
];
const propria = { id: 'p', arenaId: 'propria', actionType: 'Ação Recorrente', repetitions: 20, duration: 30 };
const andarilho = { id: 'q', arenaId: 'temporada', actionType: 'Ação Recorrente', repetitions: 20, duration: 15, sourceQuestId: 'andarilho' };
const leitura = { id: 'c', arenaId: 'camp', actionType: 'Ação Recorrente', repetitions: 40, duration: 20, originCodexId: 'livro' };
const feitas = (acao, n, dia0 = 1) => Array.from({ length: n }, (_, i) => ({ id: `${acao.id}-${i}`, actionId: acao.id, date: `2026-10-0${((dia0 + i - 1) % 7) + 1}`, completed: true, duration: acao.duration }));
const conta = (actions, tasks) => api.buildCycleCommitment({ actions, arenas, tasks, ...ciclo });

// 1. O exemplo do Afonso: 10 de 20 nas proprias + 3 caminhadas do Andarilho.
let r = conta([propria, andarilho], [...feitas(propria, 10), ...feitas(andarilho, 3, 2)]);
assert.equal(r.plannedCount, 23, 'as 17 caminhadas que faltaram nao podem pesar; as 3 feitas entram');
assert.equal(r.completedCount, 13, 'as 3 caminhadas feitas nao contaram');
assert.ok(r.progressPercent > 50, 'a missao baixou a porcentagem');

// 2. Ja estava em 100%: continua 100%.
r = conta([propria, andarilho], [...feitas(propria, 20), ...feitas(andarilho, 3)]);
assert.equal(r.progressPercent, 100, 'a missao tirou a pessoa de 100%');

// 3. Missao sem nada feito no ciclo: nao aparece na conta.
r = conta([propria, andarilho], feitas(propria, 10));
assert.equal(r.plannedCount, 20);
assert.equal(r.completedCount, 10);

// 4. So campanha no ciclo: deixa de dar 0%.
r = conta([leitura], feitas(leitura, 5));
assert.equal(r.plannedCount, 5, 'campanha so com o que foi feito no ciclo');
assert.equal(r.progressPercent, 100, 'quem fez so campanha ficava com 0% de conclusao');

// 5. Campanha atravessando ciclos: so conta o que caiu DENTRO deste ciclo.
r = conta([leitura], [...feitas(leitura, 5), { id: 'fora', actionId: 'c', date: '2026-09-20', completed: true, duration: 20 }]);
assert.equal(r.completedCount, 5, 'acao de campanha de outro ciclo contou neste');

// 6. A nota: dias e horas da missao entram; a meta das arenas proprias nao muda.
const semMissao = conta([propria, andarilho], feitas(propria, 10));
const comMissao = conta([propria, andarilho], [...feitas(propria, 10, 1), ...feitas(andarilho, 3, 5)]);
const nota = (c) => api.buildFairScoreFromTasks({
  plannedEntries: c.entries, tasks: c.cycleTasks.map((t) => ({ ...t, actionType: 'Ação Recorrente' })),
  actions: [propria, andarilho], arenas, previousReports: [], durationDays: 7,
});
const antes = nota(semMissao), depois = nota(comMissao);
assert.ok(depois.fairScore >= antes.fairScore, 'fazer a missao baixou a nota');
assert.ok(depois.fairness.honoredLoadUnits > antes.fairness.honoredLoadUnits, 'o tempo da missao nao entrou nas horas');
assert.equal(depois.fairness.plannedMetas, antes.fairness.plannedMetas, 'a arena de missao virou meta selavel e inflou a nota');
assert.equal(depois.fairness.sealedMetas, antes.fairness.sealedMetas);

// 7. O Oraculo le o ciclo igual a tela.
const banco = (actions, tasks) => api.medirCicloPrometido({
  acoes: actions.map((a) => ({ id: a.id, arena_id: a.arenaId, repetitions: a.repetitions, action_type: a.actionType, source_quest_id: a.sourceQuestId ?? null, origin_codex_id: a.originCodexId ?? null })),
  arenas: arenas.map((a) => ({ id: a.id, name: a.name, is_archived: a.isArchived })),
  tarefas: tasks.map((t) => ({ id: t.id, action_id: t.actionId, date: t.date, completed: t.completed })),
  inicio: ciclo.startDate, fim: ciclo.endDate,
});
for (const [acoes, tarefas] of [
  [[propria, andarilho], [...feitas(propria, 10), ...feitas(andarilho, 3)]],
  [[leitura], feitas(leitura, 5)],
  [[propria, andarilho, leitura], [...feitas(propria, 4), ...feitas(leitura, 2)]],
]) {
  const tela = conta(acoes, tarefas);
  assert.deepEqual(banco(acoes, tarefas), { feitas: tela.completedCount, prometidas: tela.plannedCount }, 'o Oraculo le o ciclo diferente da tela');
}

console.log('Ciclo: missao e campanha contam so o que foi feito — nunca baixam a conclusao.');
