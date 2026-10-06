import { buildCycleCommitment } from './cycleCommitment';
import {
  Action,
  Arena,
  ChecklistItem,
  Cycle,
  DailyCommitment,
  DailyCommitmentStage,
  OracleMessage,
  OraclePreferences,
  ScheduledTask,
} from '../types';
import { getCycleTimingSummary } from './dateUtils';
import { falaDaNota, notaDoCiclo } from './cycleGrade.js';
import { buildActionPoolByDate, buildCyclePaceMetrics, buildDailyArenaFocus, filterCycleTasksByScope } from './coreLoopUtils.js';
import { buildFairScoreFromTasks } from './fairScoreUtils.js';
import { formatLocalDateString, getOperationalDateString, taskMatchesOperationalDate } from './operationalDay.js';
import { hasScheduledTime } from './taskDomain.js';
import type { RestScreenActionSessionDetail } from './restScreenActionSession';

type CommitmentTaskStatus = {
  task: ScheduledTask;
  isCompleted: boolean;
};

type TaskPoolItemLike = {
  actionId: string;
  unlimited?: boolean;
};

export interface CommitmentStatsSnapshot {
  committedTasks: ScheduledTask[];
  tasksWithStatus: CommitmentTaskStatus[];
  scoredTasksWithStatus: CommitmentTaskStatus[];
  completedAllCount: number;
  totalAllCount: number;
  completedCount: number;
  totalCount: number;
}

export interface CycleWidgetSnapshot {
  cycleId: string;
  name: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  timeProgressPercent: number;
  taskProgressPercent: number;
  completedTaskCount: number;
  totalTaskCount: number;
  completedQuestCount: number;
  milestonesCompleted: number;
  questBonus: number;
  milestoneBonus: number;
  consistencyBonus: number;
  totalFidelityBonus: number;
  consistencyDays: number;
  currentScore: number;
  grade: string;
  gradeColorClass: string;
  timingLabel: string;
}

export interface DailyWidgetSnapshot {
  hasCycle: boolean;
  date: string;
  stage: DailyCommitmentStage;
  cycleName: string | null;
  cycleStartDate: string | null;
  cycleEndDate: string | null;
  cycleDayLabel: string | null;
  cycleElapsedDays: number | null;
  cycleTotalDays: number | null;
  timeProgressPercent: number;
  progressPercent: number;
  activeArenaCount: number;
  completedCount: number;
  totalCount: number;
  completedAllCount: number;
  totalAllCount: number;
  committedCount: number;
  focusArena: ReturnType<typeof buildDailyArenaFocus>;
  checklistCompleted: number;
  checklistTotal: number;
  availableGroups: Array<{ count: number; isUnlimited: boolean; action: Action; ids: string[] }>;
  availableUnitCount: number;
  scheduledTodayCount: number;
  bayActionCount: number;
  freeModeCompletedCount: number;
  freeModeTotalCount: number;
  potentialExpFromActions: number;
  earnedExp: number;
  touchedArenaCount: number;
  openActionCount: number;
  todayActions: Array<{
    taskId: string;
    actionId: string;
    name: string;
    icon: string;
    arenaName: string;
    startTime: number;
    completed: boolean;
  }>;
  quickActions: Array<{
    actionId: string;
    name: string;
    icon: string;
    arenaName: string;
    count: number;
    scheduledToday?: boolean;
  }>;
  commitmentStats: CommitmentStatsSnapshot | null;
}

export interface OracleWidgetSnapshot {
  activeMode: OraclePreferences['activeMode'] | null;
  pushEnabled: boolean;
  notificationsEnabled: boolean;
  unreadCount: number;
  latestFeedId: string | null;
  latestFeedCreatedAt: string | null;
  latestFeedPreview: string | null;
  latestUnreadPreview: string | null;
}

export interface ActionSessionWidgetSnapshot {
  actionId: string;
  actionName: string;
  actionIcon: string;
  actionType: RestScreenActionSessionDetail['actionType'];
  taskId?: string;
  startedAt: string;
  endsAt: string;
  durationMinutes: number;
  totalSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  overtimeSeconds: number;
  progressPercent: number;
  isExpired: boolean;
  isCompleted: boolean;
}

const trimPreview = (content?: string | null, maxLength = 140) => {
  if (!content) return null;
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
};

export const buildCommitmentStatsSnapshot = (
  tasks: ScheduledTask[],
  dailyCommitment: DailyCommitment,
  actions: Action[]
): CommitmentStatsSnapshot => {
  const actionTypeById = new Map(actions.map((action) => [action.id, action.actionType]));
  const committedTasks = tasks.filter(
    (task) => dailyCommitment.taskIds.includes(task.id) && taskMatchesOperationalDate(task, dailyCommitment.date)
  );

  const tasksWithStatus = committedTasks.map((task) => ({
    task,
    isCompleted: Boolean(task.completed),
  }));

  const scoredTasksWithStatus = tasksWithStatus.filter(({ task }) => actionTypeById.get(task.actionId) !== 'Livre');
  const completedAllCount = tasksWithStatus.filter(({ isCompleted }) => isCompleted).length;
  const completedCount = scoredTasksWithStatus.filter(({ isCompleted }) => isCompleted).length;

  return {
    committedTasks,
    tasksWithStatus,
    scoredTasksWithStatus,
    completedAllCount,
    totalAllCount: committedTasks.length,
    completedCount,
    totalCount: scoredTasksWithStatus.length,
  };
};

export const buildCycleWidgetSnapshot = ({
  cycle,
  tasks,
  actions,
  arenas,
  todayDate,
}: {
  cycle: Cycle | null | undefined;
  tasks: ScheduledTask[];
  actions: Action[];
  arenas: Arena[];
  todayDate?: string;
}): CycleWidgetSnapshot | null => {
  if (!cycle) return null;

  const timing = getCycleTimingSummary(cycle.startDate, cycle.endDate, todayDate);
  const commitment = buildCycleCommitment({ actions, arenas, tasks,
    startDate: cycle.startDate, endDate: cycle.endDate });
  const completedQuests = commitment.questTasks.filter(task => task.completed);
  const completedTasks = commitment.scoredTasks.filter(task => task.completed);
  const totalTaskCount = commitment.plannedCount;
  const safeCompletedTaskCount = commitment.completedCount;
  const taskProgressPercent = commitment.progressPercent;

  const milestonesCompleted = completedTasks.filter((task) => {
    const action = actions.find((candidate) => candidate.id === task.actionId);
    return action?.actionType === 'Marco';
  }).length;

  const milestoneBonus = milestonesCompleted * 10;
  const questBonus = completedQuests.length * 5;
  const consistencyDays = new Set([...completedTasks, ...completedQuests].map((task) => task.date)).size;
  const consistencyBonus = consistencyDays >= 4 ? 5 : 0;
  const totalFidelityBonus = totalTaskCount > 0 && safeCompletedTaskCount === totalTaskCount ? 5 : 0;
  const currentScore = Math.round(taskProgressPercent + milestoneBonus + questBonus + consistencyBonus + totalFidelityBonus);
  // A nota de previsão do widget usa a mesma régua do fechamento. Antes ela
  // somava bônus e convertia 95 pontos em S; ao fechar, o relatório aplicava
  // corretamente o teto de porte do ciclo e uma semana aparecia como A.
  // Realized season work contributes hours, never unfinished obligations.
  const completedScoredCycleTasks = [...completedTasks, ...completedQuests];
  const completionRateForGrade = commitment.progressPercent;
  const honoredHoursForGrade = completedScoredCycleTasks.reduce((sum, task) => {
    const action = actions.find((candidate) => candidate.id === task.actionId);
    const duration = Number.isFinite(task.duration) ? task.duration : action?.duration || 0;
    return sum + duration / 60;
  }, 0);
  /*
   * AS FRESCURAS DO SSS NA PREVIA TAMBEM.
   *
   * A previa mandava so conclusao, dias e horas. Sem as metas, os dias zerados
   * e as areas, o `ehImpecavel` do notaDoCiclo voltava falso, e a pedra da lua
   * nunca aparecia durante o ciclo — nem num ciclo a caminho dela. A placa do
   * ciclo em andamento (este widget, o card dos Ativos, o MiniCycleHUD e a
   * trilha dos Relatorios, que passam todos por aqui) parava no SS.
   *
   * As tres saem das MESMAS funcoes que o fechamento usa, para a previa nao
   * virar uma segunda regua: metas de `buildFairScoreFromTasks` com o plano
   * prometido, dias zerados de `buildCyclePaceMetrics` com a missao contando
   * como presenca, e areas pela mesma regra do fecho — as do ciclo, sem 'geral'.
   *
   * O dia final e HOJE, como no fechamento, mas nunca alem do fim do ciclo:
   * um ciclo vencido e ainda nao fechado nao pode ganhar dias vazios depois do
   * prazo so por estar esperando.
   */
  const hoje = todayDate || formatLocalDateString(new Date());
  const ultimoDiaContado = hoje < cycle.endDate ? hoje : cycle.endDate;
  const metasDoCiclo = buildFairScoreFromTasks({
    plannedEntries: commitment.entries,
    tasks: commitment.cycleTasks.map((task) => {
      const action = actions.find((candidate) => candidate.id === task.actionId);
      return { ...task, actionType: action?.actionType, arenaId: action?.arenaId };
    }),
    actions,
    arenas,
    durationDays: timing.totalDays,
  }).fairness;
  const { daysWithoutCompletion } = buildCyclePaceMetrics(
    commitment.scoredTasks,
    cycle.startDate,
    ultimoDiaContado,
    cycle.endDate,
    commitment.questTasks,
    commitment,
  );
  const arenasDoCiclo = cycle.arenaIds?.length
    ? arenas.filter((arena) => cycle.arenaIds?.includes(arena.id))
    : arenas;
  const areaDaArena = new Map(arenasDoCiclo.map((arena) => [arena.id, arena.assetId]));
  const areasAtivas = new Set(
    completedScoredCycleTasks
      .map((task) => actions.find((candidate) => candidate.id === task.actionId)?.arenaId)
      .map((arenaId) => (arenaId ? areaDaArena.get(arenaId) : undefined))
      .filter((assetId): assetId is string => Boolean(assetId) && assetId !== 'geral'),
  ).size;

  const notaDoWidget = notaDoCiclo({
    conclusaoPct: completionRateForGrade,
    acoesPlanejadas: commitment.plannedCount,
    acoesConcluidas: commitment.completedCount,
    dias: timing.totalDays,
    horas: honoredHoursForGrade,
    metasSeladas: metasDoCiclo.sealedMetas,
    metasPlanejadas: metasDoCiclo.plannedMetas,
    diasZerados: daysWithoutCompletion,
    areasAtivas,
  }).nota;

  return {
    cycleId: cycle.id,
    name: cycle.name,
    startDate: cycle.startDate,
    endDate: cycle.endDate,
    totalDays: timing.totalDays,
    elapsedDays: timing.elapsedDays,
    remainingDays: Math.max(0, timing.totalDays - timing.elapsedDays),
    timeProgressPercent: timing.timeProgress,
    taskProgressPercent,
    completedTaskCount: safeCompletedTaskCount,
    totalTaskCount,
    completedQuestCount: completedQuests.length,
    milestonesCompleted,
    questBonus,
    milestoneBonus,
    consistencyBonus,
    totalFidelityBonus,
    consistencyDays,
    currentScore,
    grade: notaDoWidget,
    gradeColorClass: falaDaNota(notaDoWidget).color,
    timingLabel: timing.statusLabel,
  };
};

export const buildDailyWidgetSnapshot = ({
  activeCycle,
  dailyCommitment,
  tasks,
  actions,
  arenas,
  checklistItems,
  taskPool = [],
  nowDate,
}: {
  activeCycle: Cycle | null | undefined;
  dailyCommitment: DailyCommitment | null | undefined;
  tasks: ScheduledTask[];
  actions: Action[];
  arenas: Arena[];
  checklistItems: ChecklistItem[];
  taskPool?: TaskPoolItemLike[];
  nowDate?: Date;
}): DailyWidgetSnapshot => {
  const operationalDate = nowDate ? getOperationalDateString(nowDate) : getOperationalDateString();
  const commitmentDate = operationalDate;
  const stage = dailyCommitment?.stage || 'planning';
  const checklistCompleted = checklistItems.filter((item) => item.completed).length;
  const checklistTotal = checklistItems.length;

  if (!activeCycle) {
    const todaysTasks = tasks.filter(
      (task) => taskMatchesOperationalDate(task, commitmentDate) && (hasScheduledTime(task) || Boolean(task.completed))
    );
    const freeActionIds = new Set(actions.filter((action) => action.actionType === 'Livre').map((action) => action.id));
    const completedTasks = todaysTasks.filter((task) => task.completed);
    const scoredCompletedTasks = completedTasks.filter((task) => !freeActionIds.has(task.actionId));
    const potentialExpFromActions = scoredCompletedTasks.reduce((sum, task) => {
      const action = actions.find((candidate) => candidate.id === task.actionId);
      const duration = Number.isFinite(task.duration) ? task.duration : action?.duration || 0;
      return sum + duration;
    }, 0);
    const touchedArenaCount = new Set(
      completedTasks
        .map((task) => actions.find((action) => action.id === task.actionId)?.arenaId)
        .filter((arenaId): arenaId is string => Boolean(arenaId))
    ).size;

    return {
      hasCycle: false,
      date: commitmentDate,
      stage,
      cycleName: null,
      cycleStartDate: null,
      cycleEndDate: null,
      cycleDayLabel: null,
      cycleElapsedDays: null,
      cycleTotalDays: null,
      timeProgressPercent: 0,
      progressPercent: 0,
      activeArenaCount: 0,
      completedCount: 0,
      totalCount: 0,
      completedAllCount: 0,
      totalAllCount: 0,
      committedCount: 0,
      focusArena: null,
      checklistCompleted,
      checklistTotal,
      availableGroups: [],
      availableUnitCount: 0,
      scheduledTodayCount: todaysTasks.filter((task) => !task.completed && hasScheduledTime(task)).length,
      bayActionCount: 0,
      freeModeCompletedCount: completedTasks.length,
      freeModeTotalCount: todaysTasks.length,
      potentialExpFromActions,
      earnedExp: potentialExpFromActions,
      touchedArenaCount,
      openActionCount: Math.max(0, todaysTasks.length - completedTasks.length),
      todayActions: todaysTasks
        .sort((left, right) => left.startTime - right.startTime)
        .slice(0, 4)
        .map((task) => {
          const action = actions.find((candidate) => candidate.id === task.actionId);
          const arena = action ? arenas.find((candidate) => candidate.id === action.arenaId) : null;
          return {
            taskId: task.id,
            actionId: task.actionId,
            name: action?.name || 'Ação',
            icon: action?.icon || '•',
            arenaName: arena?.name || 'Sem arena',
            startTime: task.startTime,
            completed: Boolean(task.completed),
          };
        }),
      quickActions: [],
      commitmentStats: null,
    };
  }

  const cycleTasks = filterCycleTasksByScope(
    tasks,
    actions,
    activeCycle,
    activeCycle.startDate,
    activeCycle.endDate,
  );
  const todaysTasks = cycleTasks.filter((task) => taskMatchesOperationalDate(task, operationalDate));
  const executionCommitment: DailyCommitment = {
    stage: dailyCommitment?.stage || 'battle',
    score: dailyCommitment?.score ?? null,
    expDeposited: dailyCommitment?.expDeposited ?? null,
    sitrepBonus: dailyCommitment?.sitrepBonus ?? null,
    relationshipBonusXp: dailyCommitment?.relationshipBonusXp ?? null,
    operationalScratch: dailyCommitment?.operationalScratch ?? null,
    date: operationalDate,
    taskIds: todaysTasks.map((task) => task.id),
  };
  const commitmentStats = buildCommitmentStatsSnapshot(tasks, executionCommitment, actions);
  const focusArena = buildDailyArenaFocus(commitmentStats.scoredTasksWithStatus, actions, arenas);
  // O widget precisa saber que Livre e ilimitada. A versao resumida do painel
  // devolvia apenas `count: 99`, o que acabava vazando como "x99" no Android.
  const actionById = new Map(actions.map((action) => [action.id, action]));
  const availableGroups = Object.entries(
    buildActionPoolByDate(actions, taskPool, tasks, executionCommitment.date, executionCommitment.taskIds),
  )
    .filter(([, payload]) => payload.isUnlimited || payload.count > 0)
    .map(([actionId, payload]) => ({
      count: payload.count,
      isUnlimited: payload.isUnlimited,
      action: actionById.get(actionId),
      ids: [actionId],
    }))
    .filter((group): group is { count: number; isUnlimited: boolean; action: Action; ids: string[] } => Boolean(group.action));
  const availableUnitCount = availableGroups.reduce((sum, group) => sum + (group.isUnlimited ? 1 : group.count), 0);
  const cycleTiming = getCycleTimingSummary(activeCycle.startDate, activeCycle.endDate, operationalDate);
  const cycleArenaIds = new Set(activeCycle.arenaIds || []);
  const scopedArenas = cycleArenaIds.size > 0 ? arenas.filter((arena) => cycleArenaIds.has(arena.id)) : arenas;
  const activeArenaCount = scopedArenas.filter((arena) => !arena.isArchived).length;
  const completedTasks = commitmentStats.tasksWithStatus.filter(({ isCompleted }) => isCompleted).map(({ task }) => task);
  const earnedExp = completedTasks.reduce((sum, task) => {
    const action = actions.find((candidate) => candidate.id === task.actionId);
    if (action?.actionType === 'Livre') return sum;
    const duration = Number.isFinite(task.duration) ? Number(task.duration) : Number(action?.duration || 0);
    return sum + Math.max(0, Math.round(duration));
  }, 0);
  const touchedArenaCount = new Set(
    completedTasks
      .map((task) => actions.find((action) => action.id === task.actionId)?.arenaId)
      .filter((arenaId): arenaId is string => Boolean(arenaId))
  ).size;
  const actionArenaById = new Map(actions.map((action) => [action.id, arenas.find((arena) => arena.id === action.arenaId)?.name || 'Sem arena']));

  return {
    hasCycle: true,
    date: operationalDate,
    stage: dailyCommitment?.stage || 'battle',
    cycleName: activeCycle.name,
    cycleStartDate: activeCycle.startDate,
    cycleEndDate: activeCycle.endDate,
    cycleDayLabel: cycleTiming.statusLabel,
    cycleElapsedDays: cycleTiming.elapsedDays,
    cycleTotalDays: cycleTiming.totalDays,
    timeProgressPercent: cycleTiming.timeProgress,
    progressPercent: commitmentStats.totalAllCount > 0 ? (commitmentStats.completedAllCount / commitmentStats.totalAllCount) * 100 : 0,
    activeArenaCount,
    completedCount: commitmentStats.completedAllCount,
    totalCount: commitmentStats.totalAllCount,
    completedAllCount: commitmentStats.completedAllCount,
    totalAllCount: commitmentStats.totalAllCount,
    committedCount: commitmentStats.committedTasks.length,
    focusArena,
    checklistCompleted,
    checklistTotal,
    availableGroups,
    availableUnitCount,
    scheduledTodayCount: todaysTasks.filter((task) => !task.completed && hasScheduledTime(task)).length,
    bayActionCount: availableGroups.length,
    freeModeCompletedCount: 0,
    freeModeTotalCount: 0,
    potentialExpFromActions: 0,
    earnedExp,
    touchedArenaCount,
    openActionCount: Math.max(0, commitmentStats.totalAllCount - commitmentStats.completedAllCount),
    todayActions: todaysTasks
      .sort((left, right) => left.startTime - right.startTime)
      .slice(0, 4)
      .map((task) => {
        const action = actions.find((candidate) => candidate.id === task.actionId);
        return {
          taskId: task.id,
          actionId: task.actionId,
          name: action?.name || 'Ação',
          icon: action?.icon || '•',
          arenaName: actionArenaById.get(task.actionId) || 'Sem arena',
          startTime: task.startTime,
          completed: Boolean(task.completed),
        };
      }),
    // A baia inteira, nao as quatro primeiras. O widget desenhava linhas fixas e
    // por isso o corte aqui nunca doeu; com lista rolavel, cortar em 4 esconderia
    // a maior parte de quem tem uma baia cheia. O teto de 30 existe so para o
    // snapshot nao virar payload gigante em conta fora do comum.
    quickActions: availableGroups
      .slice(0, 30)
      .map((group) => ({
        actionId: group.action.id,
        name: group.action.name,
        icon: group.action.icon || '•',
        arenaName: actionArenaById.get(group.action.id) || 'Sem arena',
        count: group.count,
        isUnlimited: group.isUnlimited,
        // Ja tem horario marcado hoje. Vira um ponto no canto da linha em vez de
        // uma lista separada: agendada NAO esta na baia, entao separar duplicaria
        // ou sumiria com ela — quem agenda e quem so conclui usam a mesma lista.
        scheduledToday: todaysTasks.some((task) => task.actionId === group.action.id),
      })),
    commitmentStats,
  };
};

export const buildOracleWidgetSnapshot = ({
  oraclePreferences,
  oracleMessages,
}: {
  oraclePreferences: OraclePreferences | null | undefined;
  oracleMessages: OracleMessage[];
}): OracleWidgetSnapshot => {
  const feedMessages = oracleMessages
    .filter((message) => message.deliveryType === 'feed')
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const unreadFeedMessages = feedMessages.filter((message) => !message.read);
  const latestFeed = feedMessages[0] || null;
  const latestUnread = unreadFeedMessages[0] || null;

  return {
    activeMode: oraclePreferences?.activeMode || null,
    pushEnabled: Boolean(oraclePreferences?.pushEnabled),
    notificationsEnabled: Boolean(oraclePreferences?.notificationsEnabled),
    unreadCount: unreadFeedMessages.length,
    latestFeedId: latestFeed?.id || null,
    latestFeedCreatedAt: latestFeed?.createdAt || null,
    latestFeedPreview: trimPreview(latestFeed?.content),
    latestUnreadPreview: trimPreview(latestUnread?.content),
  };
};

export const buildActionSessionWidgetSnapshot = ({
  actionSession,
  task,
  nowMs = Date.now(),
}: {
  actionSession: RestScreenActionSessionDetail | null | undefined;
  task?: ScheduledTask | null;
  nowMs?: number;
}): ActionSessionWidgetSnapshot | null => {
  if (!actionSession) return null;

  const startedAtMs = Date.parse(actionSession.startedAt);
  const safeStartedAtMs = Number.isFinite(startedAtMs) ? startedAtMs : nowMs;
  const totalSeconds = Math.max(1, Math.round(actionSession.durationMinutes * 60));
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - safeStartedAtMs) / 1000));
  const remainingSeconds = totalSeconds - elapsedSeconds;
  const overtimeSeconds = remainingSeconds < 0 ? Math.abs(remainingSeconds) : 0;
  const progressPercent = Math.min(100, Math.max(0, (Math.min(totalSeconds, elapsedSeconds) / totalSeconds) * 100));

  return {
    actionId: actionSession.actionId,
    actionName: actionSession.actionName,
    actionIcon: actionSession.actionIcon,
    actionType: actionSession.actionType,
    taskId: actionSession.taskId,
    startedAt: actionSession.startedAt,
    endsAt: new Date(safeStartedAtMs + totalSeconds * 1000).toISOString(),
    durationMinutes: actionSession.durationMinutes,
    totalSeconds,
    elapsedSeconds,
    remainingSeconds,
    overtimeSeconds,
    progressPercent,
    isExpired: remainingSeconds <= 0,
    isCompleted: Boolean(task?.completed),
  };
};

export const buildOracleAwareDailyWidgetSnapshot = ({
  activeCycle,
  dailyCommitment,
  tasks,
  actions,
  arenas,
  checklistItems,
  taskPool = [],
  oraclePreferences,
  oracleMessages,
  nowDate,
}: {
  activeCycle: Cycle | null | undefined;
  dailyCommitment: DailyCommitment | null | undefined;
  tasks: ScheduledTask[];
  actions: Action[];
  arenas: Arena[];
  checklistItems: ChecklistItem[];
  taskPool?: TaskPoolItemLike[];
  oraclePreferences: OraclePreferences | null | undefined;
  oracleMessages: OracleMessage[];
  nowDate?: Date;
}) => ({
  cycle: buildCycleWidgetSnapshot({
    cycle: activeCycle,
    tasks,
    actions,
    arenas,
    todayDate: nowDate ? getOperationalDateString(nowDate) : undefined,
  }),
  daily: buildDailyWidgetSnapshot({
    activeCycle,
    dailyCommitment,
    tasks,
    actions,
    arenas,
    checklistItems,
    taskPool,
    nowDate,
  }),
  oracle: buildOracleWidgetSnapshot({
    oraclePreferences,
    oracleMessages,
  }),
});
