import type { OracleCategory, OracleMessage, OraclePreferences } from '../types';
import { getOperationalDateString as getOperationalDateStringValue } from './operationalDay.js';

const MAX_ORACLE_DAILY_TARGET = 5;
const MAX_ORACLE_AUTOMATIC_DAILY_TARGET = 1;
const DAY_MINUTES = 24 * 60;
// The settings screen offers 0, 2 and 3 — level 1 exists in the type but has no
// option, so defaulting to it left new accounts on a setting they could not see.
export const DEFAULT_ORACLE_PRESENCE_LEVEL = 2;
export const ORACLE_MANUAL_DAILY_TARGET = 5;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const parseClockMinutes = (value: string | null | undefined, fallback: string): number => {
  const [hoursRaw, minutesRaw] = String(value || fallback).split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return parseClockMinutes(fallback, fallback);
  }

  return clamp(hours, 0, 23) * 60 + clamp(minutes, 0, 59);
};

const getQuietWindowMinutes = (preferences: Pick<OraclePreferences, 'quietHoursStart' | 'quietHoursEnd'> | null | undefined): number => {
  const start = parseClockMinutes(preferences?.quietHoursStart, '22:00');
  const end = parseClockMinutes(preferences?.quietHoursEnd, '07:00');

  if (start === end) {
    return 0;
  }

  if (start < end) {
    return end - start;
  }

  return (DAY_MINUTES - start) + end;
};

export const resolveOracleAutoDailyTarget = (
  preferences: Pick<OraclePreferences, 'enabledCategories' | 'presenceLevel'> | null | undefined,
): number => {
  const enabledCount = preferences?.enabledCategories?.length ?? 0;
  const presenceLevel = preferences?.presenceLevel ?? DEFAULT_ORACLE_PRESENCE_LEVEL;
  if (presenceLevel <= 0 || enabledCount === 0) return 0;
  // Deliberate since 1.0.56 and pinned by oracle-presence.regression: every level
  // above silent delivers exactly one automatic card a day. The levels choose whether
  // the Oracle speaks at all, not how often.
  return MAX_ORACLE_AUTOMATIC_DAILY_TARGET;
};

export const getOracleAutoGapMs = (
  preferences: Pick<OraclePreferences, 'enabledCategories' | 'presenceLevel' | 'quietHoursStart' | 'quietHoursEnd'> | null | undefined,
): number => {
  const target = resolveOracleAutoDailyTarget(preferences);
  if (target <= 0) return DAY_MINUTES * 60 * 1000;
  const activeWindowMinutes = Math.max(4 * 60, DAY_MINUTES - getQuietWindowMinutes(preferences));
  const gapMinutes = Math.max(60, Math.round(activeWindowMinutes / target));
  return gapMinutes * 60 * 1000;
};

export const getLatestOracleFeedMessage = (messages: OracleMessage[]): OracleMessage | null => {
  let latest: OracleMessage | null = null;

  for (const message of messages) {
    if (message.deliveryType !== 'feed') continue;
    if (!latest || new Date(message.createdAt).getTime() > new Date(latest.createdAt).getTime()) {
      latest = message;
    }
  }

  return latest;
};

export const getOracleFeedMessagesForOperationalDay = (messages: OracleMessage[], now: Date = new Date()): OracleMessage[] => {
  const operationalDay = getOperationalDateStringValue(now);
  return messages.filter((message) => (
    message.deliveryType === 'feed' &&
    getOperationalDateStringValue(new Date(message.createdAt)) === operationalDay
  ));
};

export const isManualOracleFeedMessage = (message: OracleMessage): boolean => (
  message.deliveryType === 'feed' && message.contextSnapshot?.triggerType === 'manual'
);

export type OracleFeedQuotaStatus = {
  autoDailyTarget: number;
  autoSentToday: number;
  autoRemainingToday: number;
  manualDailyTarget: number;
  manualSentToday: number;
  manualRemainingToday: number;
  combinedSentToday: number;
  dailyLimit: number;
  usedCategoriesToday: OracleCategory[];
  remainingCategories: OracleCategory[];
  autoGapMs: number;
  nextAutoInMs: number;
  latestFeedAt: string | null;
};

export const getOracleFeedQuotaStatus = (
  messages: OracleMessage[],
  preferences: Pick<OraclePreferences, 'enabledCategories' | 'presenceLevel' | 'quietHoursStart' | 'quietHoursEnd'> | null | undefined,
  now: Date = new Date(),
): OracleFeedQuotaStatus => {
  const autoDailyTarget = resolveOracleAutoDailyTarget(preferences);
  const todayMessages = getOracleFeedMessagesForOperationalDay(messages, now);
  const autoMessagesToday = todayMessages.filter((message) => !isManualOracleFeedMessage(message));
  const manualMessagesToday = todayMessages.filter(isManualOracleFeedMessage);
  const enabledCategories = (preferences?.enabledCategories || []).slice(0, MAX_ORACLE_DAILY_TARGET);
  const dailyLimit = Math.min(MAX_ORACLE_DAILY_TARGET, enabledCategories.length);
  const manualDailyTarget = dailyLimit;
  const usedCategoriesToday = Array.from(new Set(
    todayMessages
      .map((message) => message.category)
      .filter((category): category is OracleCategory => enabledCategories.includes(category)),
  ));
  const remainingCategories = enabledCategories.filter((category) => !usedCategoriesToday.includes(category));
  const combinedSentToday = usedCategoriesToday.length;
  const autoSentToday = autoMessagesToday.length;
  const manualSentToday = manualMessagesToday.length;
  const combinedRemainingToday = Math.max(0, dailyLimit - combinedSentToday);
  const autoRemainingToday = Math.max(0, Math.min(
    combinedRemainingToday,
    autoDailyTarget - autoMessagesToday.length,
  ));
  const manualRemainingToday = combinedRemainingToday;
  const autoGapMs = getOracleAutoGapMs(preferences);
  const latestAutoTodayMessage = getLatestOracleFeedMessage(autoMessagesToday);
  const latestFeedMessage = getLatestOracleFeedMessage(messages);
  const nowMs = now.getTime();

  const nextAutoInMs = latestAutoTodayMessage
    ? Math.max(0, autoGapMs - (nowMs - new Date(latestAutoTodayMessage.createdAt).getTime()))
    : 0;

  return {
    autoDailyTarget,
    autoSentToday,
    autoRemainingToday,
    manualDailyTarget,
    manualSentToday,
    manualRemainingToday,
    combinedSentToday,
    dailyLimit,
    usedCategoriesToday,
    remainingCategories,
    autoGapMs,
    nextAutoInMs,
    latestFeedAt: latestFeedMessage?.createdAt ?? null,
  };
};
