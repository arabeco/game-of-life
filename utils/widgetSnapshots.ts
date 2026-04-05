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
import { getCycleTimingSummary, getScoreGrade } from './dateUtils';
import { buildDailyArenaFocus, buildSitrepStockOptions, filterCycleTasksByScope } from './coreLoopUtils.js';
import { getOperationalDateString, taskMatchesOperationalDate } from './operationalDay.js';
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
  cycleDayLabel: string | null;
  cycleElapsedDays: number | null;
  cycleTotalDays: number | null;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  completedAllCount: number;
  totalAllCount: number;
  committedCount: number;
  focusArena: ReturnType<typeof buildDailyArenaFocus>;
  checklistCompleted: number;
  checklistTotal: number;
  availableGroups: Array<{ count: number; action: Action; ids: string[] }>;
  availableUnitCount: number;
  freeModeCompletedCount: number;
  freeModeTotalCount: number;
  potentialExpFromActions: number;
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

const normalizeArenaName = (name?: string | null) =>
  (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const buildActionArenaNameMap = (actions: Action[], arenas: Arena[]) => {
  const arenaById = new Map(arenas.map((arena) => [arena.id, arena.name]));
  return new Map(actions.map((action) => [action.id, arenaById.get(action.arenaId) || '']));
};

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
  const actionArenaNameById = buildActionArenaNameMap(actions, arenas);
  const isQuestActionId = (actionId: string) => normalizeArenaName(actionArenaNameById.get(actionId)).includes('quests');

  const cycleTasks = filterCycleTasksByScope(tasks, actions, cycle, cycle.startDate, cycle.endDate);
  const completedTasks = cycleTasks.filter((task) => task.completed);
  const questTasks = cycleTasks.filter((task) => isQuestActionId(task.actionId));
  const completedQuests = questTasks.filter((task) => task.completed);
  const taskProgressPercent = cycleTasks.length > 0 ? (completedTasks.length / cycleTasks.length) * 100 : 100;

  const milestonesCompleted = completedTasks.filter((task) => {
    const action = actions.find((candidate) => candidate.id === task.actionId);
    return action?.actionType === 'Marco';
  }).length;

  const milestoneBonus = milestonesCompleted * 10;
  const questBonus = completedQuests.length * 5;
  const consistencyDays = new Set(completedTasks.map((task) => task.date)).size;
  const consistencyBonus = consistencyDays >= 4 ? 5 : 0;
  const totalFidelityBonus = cycleTasks.length > 0 && completedTasks.length === cycleTasks.length ? 5 : 0;
  const currentScore = Math.round(taskProgressPercent + milestoneBonus + questBonus + consistencyBonus + totalFidelityBonus);
  const scoreInfo = getScoreGrade(currentScore);

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
    completedTaskCount: completedTasks.length,
    totalTaskCount: cycleTasks.length,
    completedQuestCount: completedQuests.length,
    milestonesCompleted,
    questBonus,
    milestoneBonus,
    consistencyBonus,
    totalFidelityBonus,
    consistencyDays,
    currentScore,
    grade: scoreInfo.grade,
    gradeColorClass: scoreInfo.color,
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
  const commitmentDate = dailyCommitment?.date || operationalDate;
  const stage = dailyCommitment?.stage || 'planning';
  const checklistCompleted = checklistItems.filter((item) => item.completed).length;
  const checklistTotal = checklistItems.length;

  if (!activeCycle || !dailyCommitment) {
    const todaysTasks = tasks.filter(
      (task) => taskMatchesOperationalDate(task, commitmentDate) && (hasScheduledTime(task) || Boolean(task.completed))
    );
    const completedTasks = todaysTasks.filter((task) => task.completed);
    const potentialExpFromActions = completedTasks.reduce((sum, task) => {
      const action = actions.find((candidate) => candidate.id === task.actionId);
      const duration = Number.isFinite(task.duration) ? task.duration : action?.duration || 0;
      return sum + duration;
    }, 0);

    return {
      hasCycle: false,
      date: commitmentDate,
      stage,
      cycleName: null,
      cycleDayLabel: null,
      cycleElapsedDays: null,
      cycleTotalDays: null,
      progressPercent: 0,
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
      freeModeCompletedCount: completedTasks.length,
      freeModeTotalCount: todaysTasks.length,
      potentialExpFromActions,
      commitmentStats: null,
    };
  }

  const commitmentStats = buildCommitmentStatsSnapshot(tasks, dailyCommitment, actions);
  const focusArena = buildDailyArenaFocus(commitmentStats.scoredTasksWithStatus, actions, arenas);
  const availableGroups = buildSitrepStockOptions(actions, taskPool, tasks, dailyCommitment) as Array<{
    count: number;
    action: Action;
    ids: string[];
  }>;
  const availableUnitCount = availableGroups.reduce((sum, group) => sum + group.count, 0);
  const cycleTiming = getCycleTimingSummary(activeCycle.startDate, activeCycle.endDate, dailyCommitment.date);

  return {
    hasCycle: true,
    date: dailyCommitment.date,
    stage: dailyCommitment.stage,
    cycleName: activeCycle.name,
    cycleDayLabel: cycleTiming.statusLabel,
    cycleElapsedDays: cycleTiming.elapsedDays,
    cycleTotalDays: cycleTiming.totalDays,
    progressPercent: commitmentStats.totalCount > 0 ? (commitmentStats.completedCount / commitmentStats.totalCount) * 100 : 100,
    completedCount: commitmentStats.completedCount,
    totalCount: commitmentStats.totalCount,
    completedAllCount: commitmentStats.completedAllCount,
    totalAllCount: commitmentStats.totalAllCount,
    committedCount: commitmentStats.committedTasks.length,
    focusArena,
    checklistCompleted,
    checklistTotal,
    availableGroups,
    availableUnitCount,
    freeModeCompletedCount: 0,
    freeModeTotalCount: 0,
    potentialExpFromActions: 0,
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
