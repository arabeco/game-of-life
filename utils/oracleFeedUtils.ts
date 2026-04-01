import { OracleMessage, OraclePreferences } from '../types';
import { getOperationalDateString as getOperationalDateStringValue } from './operationalDay.js';

const MIN_ORACLE_AUTO_TARGET = 1;
const MAX_ORACLE_DAILY_TARGET = 5;
const DAY_MINUTES = 24 * 60;
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

export const resolveOracleAutoDailyTarget = (preferences: Pick<OraclePreferences, 'enabledCategories'> | null | undefined): number => {
  const enabledCount = preferences?.enabledCategories?.length ?? 0;
  return clamp(enabledCount || MAX_ORACLE_DAILY_TARGET, MIN_ORACLE_AUTO_TARGET, MAX_ORACLE_DAILY_TARGET);
};

export const getOracleAutoGapMs = (preferences: Pick<OraclePreferences, 'enabledCategories' | 'quietHoursStart' | 'quietHoursEnd'> | null | undefined): number => {
  const target = resolveOracleAutoDailyTarget(preferences);
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
  autoGapMs: number;
  nextAutoInMs: number;
  latestFeedAt: string | null;
};

export const getOracleFeedQuotaStatus = (
  messages: OracleMessage[],
  preferences: Pick<OraclePreferences, 'enabledCategories' | 'quietHoursStart' | 'quietHoursEnd'> | null | undefined,
  now: Date = new Date(),
): OracleFeedQuotaStatus => {
  const autoDailyTarget = resolveOracleAutoDailyTarget(preferences);
  const manualDailyTarget = ORACLE_MANUAL_DAILY_TARGET;
  const todayMessages = getOracleFeedMessagesForOperationalDay(messages, now);
  const autoMessagesToday = todayMessages.filter((message) => !isManualOracleFeedMessage(message));
  const manualMessagesToday = todayMessages.filter(isManualOracleFeedMessage);
  const autoSentToday = autoMessagesToday.length;
  const manualSentToday = manualMessagesToday.length;
  const autoRemainingToday = Math.max(0, autoDailyTarget - autoSentToday);
  const manualRemainingToday = Math.max(0, manualDailyTarget - manualSentToday);
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
    combinedSentToday: todayMessages.length,
    autoGapMs,
    nextAutoInMs,
    latestFeedAt: latestFeedMessage?.createdAt ?? null,
  };
};
