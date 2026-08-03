import { Action, Asset, Cycle, DailyCommitment, DailyProofStreak, OracleArenaSignal, OracleCategory, OracleContext, OracleMode, ScheduledTask } from '../types';
import { filterCycleTasksByScope } from './coreLoopUtils.js';
import { getOperationalDateString, getTaskOperationalDateString, shiftLocalDateString, taskMatchesOperationalDate } from './operationalDay.js';

type OracleOperationalContextInput = {
  now?: Date;
  assets: Asset[];
  actions: Action[];
  tasks: ScheduledTask[];
  activeCycle: Cycle | null;
  cycleProgress?: number | null;
  activeMode: OracleMode;
  customModeInstructions?: string | null;
  enabledCategories?: OracleCategory[];
  username: string;
  level: number;
  clanName?: string | null;
  seasonName?: string | null;
  pendingChests?: number;
  dailyCommitment?: DailyCommitment | null;
  dailyProofStreak?: DailyProofStreak | null;
};

const getTimeOfDay = (date: Date): OracleContext['timeOfDay'] => {
  const hour = date.getHours();
  if (hour >= 0 && hour < 6) return 'madrugada';
  if (hour >= 6 && hour < 12) return 'manha';
  if (hour >= 12 && hour < 18) return 'tarde';
  return 'noite';
};

const sortTasksByUrgency = (tasks: ScheduledTask[]) => {
  return [...tasks].sort((left, right) => {
    const leftDate = getTaskOperationalDateString(left);
    const rightDate = getTaskOperationalDateString(right);

    if (leftDate !== rightDate) {
      return leftDate.localeCompare(rightDate);
    }

    const leftStart = Number.isFinite(left.startTime) ? left.startTime : Number.MAX_SAFE_INTEGER;
    const rightStart = Number.isFinite(right.startTime) ? right.startTime : Number.MAX_SAFE_INTEGER;
    if (leftStart !== rightStart) {
      return leftStart - rightStart;
    }

    return left.id.localeCompare(right.id);
  });
};

const parseLocalDate = (dateString: string): Date | null => {
  const [year, month, day] = String(dateString || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const diffLocalDays = (fromDateString: string, toDateString: string): number | null => {
  const from = parseLocalDate(fromDateString);
  const to = parseLocalDate(toDateString);
  if (!from || !to) return null;
  return Math.round((to.getTime() - from.getTime()) / 86400000);
};

const getActionCycleWeight = (action: Action): number => {
  if (action.actionType === 'Marco') return 1;
  if (action.actionType === 'Livre') return 1;
  return Math.max(1, Math.floor(Number(action.repetitions || 1)));
};

const resolveCyclePace = (
  completionPercent: number | null,
  expectedPercent: number | null,
): OracleContext['cyclePace'] => {
  if (completionPercent === null || expectedPercent === null) return null;
  const delta = completionPercent - expectedPercent;
  if (delta >= 10) return 'adiantado';
  if (delta >= -10) return 'no_ritmo';
  if (delta >= -25) return 'atrasado';
  return 'critico';
};

const resolveArenaPace = (
  completionPercent: number | null,
  expectedPercent: number | null,
): OracleArenaSignal['pace'] => {
  if (completionPercent === null || expectedPercent === null) return 'sem_medida';
  const delta = completionPercent - expectedPercent;
  if (delta >= 10) return 'adiantado';
  if (delta >= -10) return 'no_ritmo';
  if (delta >= -25) return 'atrasado';
  return 'critico';
};

const buildArenaSignalReason = (signal: Omit<OracleArenaSignal, 'reason'>): string => {
  if (signal.suggestedAdjustment === 'criar_meta_minima') {
    return 'A arena tem acoes livres ou sem contador, entao precisa de meta minima se voce quiser medir avanco.';
  }
  if (signal.suggestedAdjustment === 'pausar_arena') {
    return 'A arena ficou varios dias sem prova real dentro do ciclo.';
  }
  if (signal.suggestedAdjustment === 'reduzir_meta') {
    return 'O avanco da arena ficou abaixo do tempo ja gasto no ciclo.';
  }
  if (signal.suggestedAdjustment === 'proteger_uma_acao') {
    return 'A arena tem acao pendente hoje e pode voltar ao fio com um passo pequeno.';
  }
  return 'A arena esta acompanhando o ritmo ou nao pede ajuste agora.';
};

const compareArenaSignals = (left: OracleArenaSignal, right: OracleArenaSignal): number => {
  const adjustmentScore: Record<OracleArenaSignal['suggestedAdjustment'], number> = {
    reduzir_meta: 5,
    pausar_arena: 4,
    proteger_uma_acao: 3,
    criar_meta_minima: 2,
    manter_ritmo: 1,
  };
  const paceScore: Record<OracleArenaSignal['pace'], number> = {
    critico: 5,
    atrasado: 4,
    sem_medida: 3,
    no_ritmo: 2,
    adiantado: 1,
  };

  const leftScore =
    adjustmentScore[left.suggestedAdjustment] * 1000 +
    paceScore[left.pace] * 100 +
    left.pendingActionsToday * 10 +
    left.pendingActions +
    Math.max(0, -(left.progressDelta ?? 0));
  const rightScore =
    adjustmentScore[right.suggestedAdjustment] * 1000 +
    paceScore[right.pace] * 100 +
    right.pendingActionsToday * 10 +
    right.pendingActions +
    Math.max(0, -(right.progressDelta ?? 0));

  return rightScore - leftScore;
};

const buildNextMove = ({
  hasCycle,
  needsFirstArena,
  needsFirstAction,
  needsFirstTask,
  needsSitrepClosure,
  priorityArenaName,
  priorityActionName,
  pendingActionsToday,
}: {
  hasCycle: boolean;
  needsFirstArena: boolean;
  needsFirstAction: boolean;
  needsFirstTask: boolean;
  needsSitrepClosure: boolean;
  priorityArenaName: string | null;
  priorityActionName: string | null;
  pendingActionsToday: number;
}): string | null => {
  if (!hasCycle) {
    return 'Abrir um novo ciclo e escolher as arenas desta rodada.';
  }

  if (needsFirstArena) {
    return 'Criar a primeira arena do ciclo.';
  }

  if (needsFirstAction) {
    return priorityArenaName
      ? `Criar a primeira acao em ${priorityArenaName}.`
      : 'Criar a primeira acao do ciclo.';
  }

  if (needsFirstTask) {
    return priorityActionName
      ? `Agendar a primeira execucao de ${priorityActionName}.`
      : 'Agendar a primeira tarefa do ciclo.';
  }

  if (needsSitrepClosure) {
    return 'Fechar o SITREP de hoje antes de encerrar o dia.';
  }

  if (priorityActionName) {
    return priorityArenaName
      ? `Executar ${priorityActionName} em ${priorityArenaName}.`
      : `Executar ${priorityActionName}.`;
  }

  if (pendingActionsToday > 0) {
    return 'Executar a proxima tarefa planejada do dia.';
  }

  return 'Proteger a cadencia do ciclo com a proxima acao relevante.';
};

export const buildOracleOperationalContext = ({
  now = new Date(),
  assets,
  actions,
  tasks,
  activeCycle,
  cycleProgress = null,
  activeMode,
  customModeInstructions = null,
  enabledCategories = [],
  username,
  level,
  clanName = null,
  seasonName = null,
  pendingChests = 0,
  dailyCommitment = null,
  dailyProofStreak = null,
}: OracleOperationalContextInput): OracleContext => {
  const operationalDate = getOperationalDateString(now);
  const activeArenas = assets.flatMap((asset) => asset.arenas).filter((arena) => !arena.isArchived);
  const actionById = new Map(actions.map((action) => [action.id, action]));
  const arenaById = new Map(activeArenas.map((arena) => [arena.id, arena]));
  const inferredArenaIds = new Set<string>();
  actions.forEach((action) => {
    if (action.arenaId) inferredArenaIds.add(action.arenaId);
  });

  const todayTasks = tasks.filter((task) => taskMatchesOperationalDate(task, operationalDate));
  const pendingTodayTasks = todayTasks.filter((task) => !task.completed);
  const overdueTasks = tasks.filter((task) => !task.completed && getTaskOperationalDateString(task) < operationalDate);

  const effectiveCycleEnd = activeCycle
    ? (activeCycle.endDate < operationalDate ? activeCycle.endDate : operationalDate)
    : operationalDate;
  const cycleTasks = activeCycle
    ? filterCycleTasksByScope(tasks, actions, activeCycle, activeCycle.startDate, effectiveCycleEnd)
    : [];
  const completedCycleTasks = cycleTasks.filter((task) => task.completed);
  const completedActionsInCycle = completedCycleTasks.length;

  const cycleArenaIds = new Set(activeCycle?.arenaIds || []);
  const cycleActions = activeCycle
    ? actions.filter((action) => cycleArenaIds.size === 0 || cycleArenaIds.has(action.arenaId))
    : [];
  const cycleTotalActions = cycleActions.reduce((sum, action) => sum + getActionCycleWeight(action), 0);
  const cycleCompletedActions = Math.min(cycleTotalActions || completedCycleTasks.length, completedCycleTasks.length);
  const cyclePendingActions = Math.max(0, cycleTotalActions - cycleCompletedActions);

  const cycleTotalDays = activeCycle
    ? Math.max(1, (diffLocalDays(activeCycle.startDate, activeCycle.endDate) ?? 0) + 1)
    : null;
  const cycleDayNumber = activeCycle
    ? Math.min(
        cycleTotalDays || 1,
        Math.max(1, (diffLocalDays(activeCycle.startDate, operationalDate) ?? 0) + 1),
      )
    : null;
  const cycleDaysRemaining = activeCycle && cycleDayNumber && cycleTotalDays
    ? Math.max(0, cycleTotalDays - cycleDayNumber)
    : null;

  const expectedCycleProgress = activeCycle && cycleDayNumber && cycleTotalDays
    ? Math.round((cycleDayNumber / cycleTotalDays) * 100)
    : null;
  const effectiveCycleProgress = typeof cycleProgress === 'number' ? cycleProgress : null;
  const cycleCompletionDelta = expectedCycleProgress !== null && effectiveCycleProgress !== null
    ? effectiveCycleProgress - expectedCycleProgress
    : null;
  const cyclePace = resolveCyclePace(effectiveCycleProgress, expectedCycleProgress);

  let cycleRisk: OracleContext['cycleRisk'] = 'baixo';
  if (!activeCycle || cyclePace === 'critico' || pendingTodayTasks.length >= 5 || overdueTasks.length >= 3) {
    cycleRisk = 'alto';
  } else if (
    overdueTasks.length > 0 ||
    cyclePace === 'atrasado' ||
    (expectedCycleProgress !== null && effectiveCycleProgress !== null && effectiveCycleProgress < expectedCycleProgress - 15)
  ) {
    cycleRisk = 'medio';
  }

  const priorityTask = sortTasksByUrgency(overdueTasks)[0] || sortTasksByUrgency(pendingTodayTasks)[0] || null;
  const priorityAction = priorityTask ? actionById.get(priorityTask.actionId) || null : null;
  const priorityArena = priorityAction ? arenaById.get(priorityAction.arenaId) || null : null;
  const relevantArenas = activeCycle
    ? activeArenas.filter((arena) => cycleArenaIds.size === 0 || cycleArenaIds.has(arena.id))
    : activeArenas;
  const expectedArenaProgress = expectedCycleProgress;
  const arenaSignals = relevantArenas
    .map((arena): OracleArenaSignal | null => {
      const arenaActions = actions.filter((action) => action.arenaId === arena.id);
      if (arenaActions.length === 0) {
        const baseSignal: Omit<OracleArenaSignal, 'reason'> = {
          arenaId: arena.id,
          arenaName: arena.name,
          actionCount: 0,
          measurableActionCount: 0,
          progressPercent: null,
          expectedProgressPercent: expectedArenaProgress,
          progressDelta: null,
          pace: 'sem_medida',
          completedActions: 0,
          plannedActions: 0,
          pendingActions: 0,
          pendingActionsToday: 0,
          hasMeasurableProgress: false,
          lastProofDate: null,
          daysSinceProof: null,
          suggestedAdjustment: 'criar_meta_minima',
        };
        return { ...baseSignal, reason: buildArenaSignalReason(baseSignal) };
      }

      const arenaActionIds = new Set(arenaActions.map((action) => action.id));
      const measurableActions = arenaActions.filter((action) => action.actionType !== 'Livre');
      const plannedActions = measurableActions.reduce((sum, action) => sum + getActionCycleWeight(action), 0);
      const arenaCycleTasks = cycleTasks.filter((task) => arenaActionIds.has(task.actionId));
      const completedTasks = arenaCycleTasks.filter((task) => task.completed);
      const completedActions = plannedActions > 0
        ? Math.min(plannedActions, completedTasks.filter((task) => actionById.get(task.actionId)?.actionType !== 'Livre').length)
        : completedTasks.length;
      const progressPercent = plannedActions > 0 ? Math.round((completedActions / plannedActions) * 100) : null;
      const progressDelta = progressPercent !== null && expectedArenaProgress !== null
        ? progressPercent - expectedArenaProgress
        : null;
      const pace = resolveArenaPace(progressPercent, expectedArenaProgress);
      const pendingActions = plannedActions > 0 ? Math.max(0, plannedActions - completedActions) : 0;
      const pendingActionsTodayForArena = pendingTodayTasks.filter((task) => arenaActionIds.has(task.actionId)).length;
      const completedDates = completedTasks
        .map((task) => getTaskOperationalDateString(task))
        .sort();
      const lastProofDate = completedDates.length > 0 ? completedDates[completedDates.length - 1] : null;
      const daysSinceProof = lastProofDate ? diffLocalDays(lastProofDate, operationalDate) : null;
      const suggestedAdjustment: OracleArenaSignal['suggestedAdjustment'] =
        plannedActions === 0
          ? 'criar_meta_minima'
          : (daysSinceProof !== null && daysSinceProof >= 7 && completedActions === 0)
            ? 'pausar_arena'
            : (pace === 'critico' || pace === 'atrasado')
              ? 'reduzir_meta'
              : pendingActionsTodayForArena > 0
                ? 'proteger_uma_acao'
                : 'manter_ritmo';

      const baseSignal: Omit<OracleArenaSignal, 'reason'> = {
        arenaId: arena.id,
        arenaName: arena.name,
        actionCount: arenaActions.length,
        measurableActionCount: measurableActions.length,
        progressPercent,
        expectedProgressPercent: expectedArenaProgress,
        progressDelta,
        pace,
        completedActions,
        plannedActions,
        pendingActions,
        pendingActionsToday: pendingActionsTodayForArena,
        hasMeasurableProgress: plannedActions > 0,
        lastProofDate,
        daysSinceProof,
        suggestedAdjustment,
      };
      return { ...baseSignal, reason: buildArenaSignalReason(baseSignal) };
    })
    .filter((signal): signal is OracleArenaSignal => Boolean(signal))
    .sort(compareArenaSignals)
    .slice(0, 6);
  const focusArenaSignal = arenaSignals[0] || null;
  const stalledArenaCount = arenaSignals.filter((signal) => (
    signal.suggestedAdjustment === 'pausar_arena' ||
    signal.pace === 'critico' ||
    (signal.daysSinceProof ?? 0) >= 7
  )).length;
  const overloadedArenaCount = arenaSignals.filter((signal) => signal.suggestedAdjustment === 'reduzir_meta').length;

  const recentThreshold = shiftLocalDateString(operationalDate, -6);
  const staleArenas = activeArenas
    .filter((arena) => {
      if (!arena.actionIds.length) return false;
      const recentCompletedTask = tasks.some((task) => {
        if (!task.completed) return false;
        const action = actionById.get(task.actionId);
        if (!action || action.arenaId !== arena.id) return false;
        const taskOperationalDate = getTaskOperationalDateString(task);
        return taskOperationalDate >= recentThreshold && taskOperationalDate <= operationalDate;
      });
      return !recentCompletedTask;
    })
    .map((arena) => arena.name);

  const hasArenaEvidence = activeArenas.length > 0 || cycleArenaIds.size > 0 || inferredArenaIds.size > 0;
  const needsFirstArena = !hasArenaEvidence;
  const needsFirstAction = !needsFirstArena && actions.length === 0;
  const needsFirstTask = !needsFirstArena && !needsFirstAction && tasks.length === 0;
  const needsSitrepClosure = dailyCommitment?.date === operationalDate && dailyCommitment?.stage === 'battle';

  const nextMove = buildNextMove({
    hasCycle: !!activeCycle,
    needsFirstArena,
    needsFirstAction,
    needsFirstTask,
    needsSitrepClosure,
    priorityArenaName: priorityArena?.name || null,
    priorityActionName: priorityAction?.name || null,
    pendingActionsToday: pendingTodayTasks.length,
  });

  return {
    currentTime: now.toISOString(),
    timeOfDay: getTimeOfDay(now),
    hasCycle: !!activeCycle,
    cycleName: activeCycle?.name || null,
    cycleStartDate: activeCycle?.startDate || null,
    cycleEndDate: activeCycle?.endDate || null,
    cycleDayNumber,
    cycleTotalDays,
    cycleDaysRemaining,
    cycleCompletionPercent: effectiveCycleProgress,
    expectedCycleCompletionPercent: expectedCycleProgress,
    cycleCompletionDelta,
    cyclePace,
    cycleTotalActions,
    cycleCompletedActions,
    cyclePendingActions,
    hasArenas: hasArenaEvidence,
    totalArenas: Math.max(activeArenas.length, cycleArenaIds.size, inferredArenaIds.size),
    arenaNames: activeArenas.map((arena) => arena.name),
    arenaSignals,
    focusArenaSignal,
    stalledArenaCount,
    overloadedArenaCount,
    staleArenas,
    completedActionsInCycle,
    pendingActionsToday: pendingTodayTasks.length,
    overdueActions: overdueTasks.length,
    dailyProofStreakCurrent: Math.max(0, Math.round(dailyProofStreak?.current || 0)),
    dailyProofStreakBest: Math.max(0, Math.round(dailyProofStreak?.best || 0)),
    dailyProofTotalClosedDays: Math.max(0, Math.round(dailyProofStreak?.totalClosedDays || 0)),
    dailyProofLastClosedDate: dailyProofStreak?.lastProofDate || dailyProofStreak?.lastClosedDate || null,
    dailyProofLastProofActionId: dailyProofStreak?.lastProofActionId || null,
    dailyProofLastProofArenaId: dailyProofStreak?.lastProofArenaId || null,
    dailyProofLastProofCycleId: dailyProofStreak?.lastProofCycleId || null,
    dailyProofLastScore: typeof dailyProofStreak?.lastScore === 'number' ? dailyProofStreak.lastScore : null,
    dailyProofLastExpDeposited: typeof dailyProofStreak?.lastExpDeposited === 'number' ? dailyProofStreak.lastExpDeposited : null,
    dailyProofLastCompletedTasksCount: typeof dailyProofStreak?.lastCompletedTasksCount === 'number' ? dailyProofStreak.lastCompletedTasksCount : null,
    dailyProofLastTotalTasksCount: typeof dailyProofStreak?.lastTotalTasksCount === 'number' ? dailyProofStreak.lastTotalTasksCount : null,
    activeMode,
    customModeInstructions,
    enabledCategories,
    username,
    level,
    sephirotLevels: assets.reduce((acc, asset) => ({ ...acc, [asset.name]: asset.level }), {}),
    clanName,
    seasonName,
    pendingChests,
    priorityArenaName: priorityArena?.name || null,
    priorityActionName: priorityAction?.name || null,
    nextMove,
    cycleRisk,
    needsFirstArena,
    needsFirstAction,
    needsFirstTask,
    needsSitrepClosure,
  };
};
