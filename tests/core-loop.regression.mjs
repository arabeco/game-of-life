import assert from 'node:assert/strict';
import {
    buildActionPoolByDate,
    buildCyclePaceMetrics,
    buildDailyArenaFocus,
    buildSitrepStockOptions,
    buildTaskPoolEntries,
    filterCycleTasksByScope,
    getInitialDailyCommitmentTaskIds,
    mergeTasksIntoCommitment,
    reconcileTaskInCommitment,
} from '../utils/coreLoopUtils.js';
import {
    calculateArenaProgress,
    calculateCampaignProgress,
    getCampaignArenaStates,
} from '../utils/progressUtilsEngine.js';
import {
    getArenaDomainFlags,
    isTaskInPool,
    looksLikeClanQuestArena,
} from '../utils/taskDomain.js';
import {
    buildToggledTaskSnapshot,
    removeEntitiesById,
    removeTaskIds,
    restoreTaskSnapshot,
} from '../utils/taskMutationUtils.js';
import { buildCycleWeeklyAtlas } from '../utils/reportAtlasUtils.js';
const tests = [
    {
        name: 'weekly atlas divide o ciclo em semanas sequenciais do periodo real',
        run() {
            const atlas = buildCycleWeeklyAtlas(
                [
                    { id: 'task-1', actionId: 'action-1', date: '2026-03-01', startTime: 480, duration: 60, completed: true },
                    { id: 'task-2', actionId: 'action-1', date: '2026-03-08', startTime: 480, duration: 30, completed: false },
                ],
                [
                    { id: 'action-1', arenaId: 'arena-1', name: 'Deep Work', icon: 'A', duration: 60, repetitions: 1, actionType: 'Compromisso' },
                ],
                [
                    { id: 'arena-1', assetId: 'asset-1', name: 'Projeto', description: '', icon: 'P', actionIds: [] },
                ],
                '2026-03-01',
                '2026-03-08',
            );

            assert.equal(atlas.length, 2);
            assert.equal(atlas[0].days.length, 7);
            assert.equal(atlas[1].days.length, 1);
            assert.equal(atlas[0].startDate, '2026-03-01');
            assert.equal(atlas[1].endDate, '2026-03-08');
            assert.equal(atlas[0].days[0].scheduledItems.length, 1);
            assert.equal(atlas[1].days[0].scheduledItems[0].startTime, 480);
        },
    },
    {
        name: 'weekly atlas agrega buckets por arena e define arena dominante',
        run() {
            const atlas = buildCycleWeeklyAtlas(
                [
                    { id: 'task-1', actionId: 'action-focus', date: '2026-03-01', startTime: 480, duration: 60, completed: true },
                    { id: 'task-2', actionId: 'action-focus', date: '2026-03-01', startTime: 600, duration: 60, completed: false },
                    { id: 'task-3', actionId: 'action-side', date: '2026-03-02', startTime: 540, duration: 30, completed: true },
                ],
                [
                    { id: 'action-focus', arenaId: 'arena-focus', name: 'Escrever', icon: 'A', duration: 60, repetitions: 1, actionType: 'Compromisso' },
                    { id: 'action-side', arenaId: 'arena-side', name: 'Alongar', icon: 'B', duration: 30, repetitions: 1, actionType: 'Compromisso' },
                ],
                [
                    { id: 'arena-focus', assetId: 'asset-1', name: 'Projeto Principal', description: '', icon: 'P', actionIds: [] },
                    { id: 'arena-side', assetId: 'asset-1', name: 'Saude', description: '', icon: 'S', actionIds: [] },
                ],
                '2026-03-01',
                '2026-03-03',
            );

            assert.equal(atlas[0].dominantArenaName, 'Projeto Principal');
            assert.equal(atlas[0].plannedCount, 3);
            assert.equal(atlas[0].completedCount, 2);
            assert.equal(atlas[0].days[0].arenaBuckets[0].arenaName, 'Projeto Principal');
            assert.equal(atlas[0].days[0].arenaBuckets[0].completed, 1);
            assert.equal(atlas[0].days[0].scheduledItems.length, 2);
            assert.equal(atlas[0].days[1].unscheduledItems.length, 0);
        },
    },
    {
        name: 'rollback util remove apenas ids afetados',
        run() {
            const tasks = [
                { id: 'task-1', actionId: 'action-1' },
                { id: 'task-2', actionId: 'action-2' },
                { id: 'task-3', actionId: 'action-3' },
            ];

            assert.deepEqual(removeEntitiesById(tasks, ['task-2']).map(task => task.id), ['task-1', 'task-3']);
            assert.deepEqual(removeTaskIds(['task-1', 'task-2', 'task-3'], ['task-1', 'task-3']), ['task-2']);
        },
    },
    {
        name: 'restore snapshot nao ressuscita tarefa ja removida',
        run() {
            const snapshot = { id: 'task-1', actionId: 'action-1', date: '2026-03-08', startTime: 480, duration: 30, completed: false };
            const current = [
                { id: 'task-1', actionId: 'action-1', date: '2026-03-08', startTime: 720, duration: 30, completed: true },
                { id: 'task-2', actionId: 'action-2', date: '2026-03-08', startTime: 540, duration: 30, completed: false },
            ];

            const restored = restoreTaskSnapshot(current, snapshot);
            assert.equal(restored[0].completed, false);
            assert.equal(restored[0].startTime, 480);

            const missing = restoreTaskSnapshot([current[1]], snapshot);
            assert.deepEqual(missing, [current[1]]);
        },
    },
    {
        name: 'toggle snapshot completa tarefa da bay area no horario atual',
        run() {
            const updated = buildToggledTaskSnapshot(
                { id: 'task-1', actionId: 'action-1', date: '2026-03-08', startTime: -1, duration: 30, completed: false },
                45,
                600
            );

            assert.equal(updated.completed, true);
            assert.equal(updated.startTime, 555);
        },
    },
    {
        name: 'toggle snapshot preserva horario ao desmarcar ou completar tarefa ja agendada',
        run() {
            const scheduled = buildToggledTaskSnapshot(
                { id: 'task-1', actionId: 'action-1', date: '2026-03-08', startTime: 540, duration: 30, completed: false },
                45,
                600
            );
            assert.equal(scheduled.completed, true);
            assert.equal(scheduled.startTime, 540);

            const reopened = buildToggledTaskSnapshot(
                { ...scheduled, completed: true },
                45,
                660
            );
            assert.equal(reopened.completed, false);
            assert.equal(reopened.startTime, 540);
        },
    },
    {
        name: 'pool diario usa a mesma regra para planner e sitrep',
        run() {
            const actions = [
                { id: 'action-focus', arenaId: 'arena-1', name: 'Deep work', icon: 'A', duration: 60, repetitions: 3, actionType: 'Compromisso' },
            ];
            const taskPool = buildTaskPoolEntries(actions, new Set(['arena-1']), () => false);
            const tasks = [
                { id: 'task-bay', actionId: 'action-focus', date: '2026-03-08', startTime: -1, duration: 60, completed: false },
                { id: 'task-clocked', actionId: 'action-focus', date: '2026-03-08', startTime: 540, duration: 60, completed: false },
                { id: 'task-done', actionId: 'action-focus', date: '2026-03-08', startTime: 660, duration: 60, completed: true },
            ];

            const plannerPool = buildActionPoolByDate(actions, taskPool, tasks, '2026-03-08');
            assert.equal(plannerPool['action-focus'].count, 1);
            assert.equal(isTaskInPool(tasks[0]), true);

            const sitrepPool = buildActionPoolByDate(actions, taskPool, tasks, '2026-03-08', ['task-bay']);
            assert.equal(sitrepPool['action-focus'].count, 0);
        },
    },
    {
        name: 'classificacao de arena centraliza quest shared office e fallback legado',
        run() {
            const clanQuestArena = { id: 'arena-quest', assetId: 'asset', name: 'Quests - Cla', description: '', icon: 'Q', actionIds: [] };
            const sharedOfficeArena = { id: 'arena-office', assetId: 'asset', name: 'Clan Office Alpha', description: '[SHARED]', icon: 'O', actionIds: [] };
            const legacyArena = { id: 'arena-legacy', assetId: 'asset', name: '1', description: '', icon: 'L', actionIds: [] };

            const clanFlags = getArenaDomainFlags(clanQuestArena);
            assert.equal(clanFlags.isQuest, true);
            assert.equal(clanFlags.isClanQuest, true);

            const officeFlags = getArenaDomainFlags(sharedOfficeArena);
            assert.equal(officeFlags.isOffice, true);
            assert.equal(officeFlags.isShared, true);

            assert.equal(looksLikeClanQuestArena(legacyArena), true);
        },
    },
    {
        name: 'quick action agendada hoje entra no compromisso diario sem duplicar',
        run() {
            const previous = ['task-existing'];
            const tasks = [
                { id: 'task-today', actionId: 'action-focus', date: '2026-03-08' },
                { id: 'task-today', actionId: 'action-focus', date: '2026-03-08' },
                { id: 'task-other-day', actionId: 'action-focus', date: '2026-03-09' },
                { id: 'task-quest', actionId: 'action-quest', date: '2026-03-08' },
            ];

            const result = mergeTasksIntoCommitment(previous, tasks, '2026-03-08', actionId => actionId === 'action-quest');

            assert.deepEqual(result, ['task-existing', 'task-today']);
        },
    },
    {
        name: 'remarcar ou trocar para quest reconcilia o compromisso diario',
        run() {
            const base = ['task-1', 'task-2'];

            const movedOut = reconcileTaskInCommitment(base, 'task-1', { actionId: 'action-focus', date: '2026-03-09' }, '2026-03-08', () => false);
            assert.deepEqual(movedOut, ['task-2']);

            const movedBack = reconcileTaskInCommitment(movedOut, 'task-1', { actionId: 'action-focus', date: '2026-03-08' }, '2026-03-08', () => false);
            assert.deepEqual(movedBack, ['task-2', 'task-1']);

            const changedToQuest = reconcileTaskInCommitment(movedBack, 'task-1', { actionId: 'quest-action', date: '2026-03-08' }, '2026-03-08', actionId => actionId === 'quest-action');
            assert.deepEqual(changedToQuest, ['task-2']);
        },
    },
    {
        name: 'sitrep inicial puxa automaticamente tarefas ja planejadas do dia',
        run() {
            const taskIds = getInitialDailyCommitmentTaskIds([
                { id: 'task-planner', actionId: 'action-focus', date: '2026-03-08', startTime: 540, duration: 60, completed: false },
                { id: 'task-done', actionId: 'action-review', date: '2026-03-08', startTime: 720, duration: 30, completed: true },
                { id: 'task-pool', actionId: 'action-pool', date: '2026-03-08', startTime: -1, duration: 30, completed: false },
                { id: 'task-quest', actionId: 'action-quest', date: '2026-03-08', startTime: 600, duration: 30, completed: false },
                { id: 'task-tomorrow', actionId: 'action-focus', date: '2026-03-09', startTime: 540, duration: 60, completed: false },
            ], '2026-03-08', actionId => actionId === 'action-quest');

            assert.deepEqual(taskIds, ['task-planner', 'task-done']);
        },
    },
    {
        name: 'devolver tarefa para o pool faz o estoque do SITREP reaparecer',
        run() {
            const actions = [
                { id: 'action-focus', arenaId: 'arena-1', name: 'Deep work', icon: 'A', duration: 60, repetitions: 2, actionType: 'Compromisso' },
            ];
            const taskPool = [{ actionId: 'action-focus' }];
            const dailyCommitment = {
                date: '2026-03-08',
                taskIds: ['task-committed'],
                stage: 'planning',
                score: null,
            };
            const tasksBeforeReturn = [
                { id: 'task-committed', actionId: 'action-focus', date: '2026-03-08', startTime: -1, duration: 60, completed: false },
            ];
            const tasksAfterReturn = [
                { id: 'task-committed', actionId: 'action-focus', date: '2026-03-08', startTime: -1, duration: 60, completed: false },
            ];

            const before = buildSitrepStockOptions(actions, taskPool, tasksBeforeReturn, dailyCommitment);
            assert.equal(before[0]?.count ?? 0, 1);

            const after = buildSitrepStockOptions(actions, taskPool, tasksAfterReturn, { ...dailyCommitment, taskIds: [] });
            assert.equal(after[0]?.count ?? 0, 2);
        },
    },
    {
        name: 'arena foco do dia usa apenas tarefas travadas e conta concluidas',
        run() {
            const actions = [
                { id: 'action-1', arenaId: 'arena-focus', name: 'Escrever', icon: 'A', duration: 30, repetitions: 1, actionType: 'Compromisso' },
                { id: 'action-2', arenaId: 'arena-focus', name: 'Revisar', icon: 'B', duration: 30, repetitions: 1, actionType: 'Compromisso' },
                { id: 'action-3', arenaId: 'arena-side', name: 'Alongar', icon: 'C', duration: 15, repetitions: 1, actionType: 'Compromisso' },
            ];
            const arenas = [
                { id: 'arena-focus', assetId: 'asset-1', name: 'Projeto Principal', description: '', icon: 'P', actionIds: [] },
                { id: 'arena-side', assetId: 'asset-1', name: 'Saude', description: '', icon: 'S', actionIds: [] },
            ];
            const focus = buildDailyArenaFocus([
                { task: { id: 'task-1', actionId: 'action-1', date: '2026-03-08', startTime: -1, duration: 30, completed: true }, isCompleted: true },
                { task: { id: 'task-2', actionId: 'action-2', date: '2026-03-08', startTime: -1, duration: 30, completed: false }, isCompleted: false },
                { task: { id: 'task-3', actionId: 'action-3', date: '2026-03-08', startTime: -1, duration: 15, completed: true }, isCompleted: true },
            ], actions, arenas);

            assert.deepEqual(focus, {
                arenaId: 'arena-focus',
                name: 'Projeto Principal',
                total: 2,
                completed: 1,
            });
        },
    },
    {
        name: 'escopo do ciclo ignora tarefas fora das arenas do ciclo mesmo na mesma data',
        run() {
            const actions = [
                { id: 'action-in', arenaId: 'arena-in', name: 'Dentro', icon: 'A', duration: 30, repetitions: 1, actionType: 'Compromisso' },
                { id: 'action-out', arenaId: 'arena-out', name: 'Fora', icon: 'B', duration: 30, repetitions: 1, actionType: 'Compromisso' },
            ];
            const tasks = [
                { id: 'task-in', actionId: 'action-in', date: '2026-03-08', startTime: 600, duration: 30, completed: true },
                { id: 'task-out', actionId: 'action-out', date: '2026-03-08', startTime: 660, duration: 30, completed: true },
                { id: 'task-late', actionId: 'action-in', date: '2026-03-12', startTime: 660, duration: 30, completed: true },
            ];

            const scoped = filterCycleTasksByScope(tasks, actions, { arenaIds: ['arena-in'] }, '2026-03-08', '2026-03-10');

            assert.deepEqual(scoped.map(task => task.id), ['task-in']);
        },
    },
    {
        name: 'metricas de ritmo do ciclo mostram dias zerados e compasso',
        run() {
            const cycleTasks = [
                { id: 'task-1', actionId: 'action-1', date: '2026-03-01', startTime: 480, duration: 60, completed: true },
                { id: 'task-2', actionId: 'action-2', date: '2026-03-02', startTime: 480, duration: 60, completed: false },
                { id: 'task-3', actionId: 'action-3', date: '2026-03-03', startTime: 480, duration: 60, completed: true },
                { id: 'task-4', actionId: 'action-4', date: '2026-03-04', startTime: 480, duration: 60, completed: false },
            ];

            const metrics = buildCyclePaceMetrics(cycleTasks, '2026-03-01', '2026-03-04', '2026-03-08');

            assert.equal(metrics.executionRatePct, 50);
            assert.equal(metrics.timeElapsedPct, 50);
            assert.equal(metrics.paceDeltaPct, 0);
            assert.equal(metrics.daysWithoutCompletion, 2);
            assert.equal(metrics.consistencyDays, 2);
        },
    },
    {
        name: 'campanha sequencial estilo codex destrava a proxima arena ao limpar a anterior',
        run() {
            const campaign = {
                id: 'campaign-1',
                userId: 'user-1',
                title: 'Codex',
                createdAt: '2026-03-01',
                status: 'active',
                type: 'sequential',
                arenaIds: ['arena-1', 'arena-2', 'arena-3'],
                arenaConfig: {
                    'arena-1': { isLocked: false, prerequisiteArenaIds: [] },
                    'arena-2': { isLocked: true, prerequisiteArenaIds: ['arena-1'] },
                    'arena-3': { isLocked: true, prerequisiteArenaIds: ['arena-2'] },
                },
            };
            const arenasById = {
                'arena-1': { id: 'arena-1', assetId: 'asset', name: 'Base', description: '', icon: 'A', actionIds: [] },
                'arena-2': { id: 'arena-2', assetId: 'asset', name: 'Avanco', description: '', icon: 'B', actionIds: [] },
                'arena-3': { id: 'arena-3', assetId: 'asset', name: 'Mestre', description: '', icon: 'C', actionIds: [] },
            };
            const actionsByArena = {
                'arena-1': [{ id: 'action-1', arenaId: 'arena-1', name: 'Primeiro passo', icon: 'A', duration: 30, repetitions: 1, actionType: 'Compromisso' }],
                'arena-2': [{ id: 'action-2', arenaId: 'arena-2', name: 'Segundo passo', icon: 'B', duration: 30, repetitions: 1, actionType: 'Compromisso' }],
                'arena-3': [{ id: 'action-3', arenaId: 'arena-3', name: 'Terceiro passo', icon: 'C', duration: 30, repetitions: 1, actionType: 'Compromisso' }],
            };

            const lockedStates = getCampaignArenaStates({
                campaign,
                arenasById,
                actionsByArena,
                tasks: [],
            });
            assert.equal(lockedStates['arena-1'].isLocked, false);
            assert.equal(lockedStates['arena-2'].isLocked, true);
            assert.equal(lockedStates['arena-3'].isLocked, true);

            const unlockedStates = getCampaignArenaStates({
                campaign,
                arenasById,
                actionsByArena,
                tasks: [
                    { id: 'task-1', actionId: 'action-1', date: '2026-03-08', startTime: 600, duration: 30, completed: true },
                ],
            });
            assert.equal(unlockedStates['arena-2'].isLocked, false);
            assert.equal(unlockedStates['arena-3'].isLocked, true);
        },
    },
    {
        name: 'arena compartilhada usa progresso global e campanha calcula media correta',
        run() {
            const arena = { id: 'arena-shared', assetId: 'asset', name: 'Clan Office Alpha', description: '[SHARED]', icon: 'S', actionIds: [] };
            const actions = [
                { id: 'action-shared-1', arenaId: 'arena-shared', name: 'Daily sync', icon: 'A', duration: 15, repetitions: 2, actionType: 'Compromisso' },
                { id: 'action-shared-2', arenaId: 'arena-shared', name: 'Mentoria', icon: 'B', duration: 15, repetitions: 1, actionType: 'Compromisso' },
            ];

            const progress = calculateArenaProgress({
                arena,
                actions,
                tasks: [],
                getSharedActionPoolProgress: (_arenaId, actionId) => actionId === 'action-shared-1' ? 2 : 1,
            });

            assert.equal(progress.isSharedPool, true);
            assert.equal(progress.progressPercent, 100);
            assert.equal(progress.isCleared, true);

            const campaign = {
                id: 'campaign-shared',
                userId: 'user-1',
                title: 'Office',
                createdAt: '2026-03-01',
                status: 'active',
                type: 'parallel',
                arenaIds: ['arena-shared', 'arena-solo'],
                arenaConfig: {
                    'arena-shared': { isLocked: false },
                    'arena-solo': { isLocked: false },
                },
            };
            const percent = calculateCampaignProgress({
                campaign,
                arenasById: {
                    'arena-shared': arena,
                    'arena-solo': { id: 'arena-solo', assetId: 'asset', name: 'Solo', description: '', icon: 'P', actionIds: [] },
                },
                actionsByArena: {
                    'arena-shared': actions,
                    'arena-solo': [{ id: 'action-solo', arenaId: 'arena-solo', name: 'Escrever', icon: 'C', duration: 30, repetitions: 2, actionType: 'Compromisso' }],
                },
                tasks: [{ id: 'task-solo', actionId: 'action-solo', date: '2026-03-08', startTime: 480, duration: 30, completed: true }],
                getSharedActionPoolProgress: (_arenaId, actionId) => actionId === 'action-shared-1' ? 2 : 1,
            });

            assert.equal(percent, 75);
        },
    },
];

let failed = 0;

for (const { name, run } of tests) {
    try {
        run();
        console.log(`ok - ${name}`);
    } catch (error) {
        failed += 1;
        console.error(`not ok - ${name}`);
        console.error(error);
    }
}

if (failed > 0) {
    console.error(`\n${failed} teste(s) falharam.`);
    process.exit(1);
}

console.log(`\n${tests.length} cenarios do core loop validados.`);




