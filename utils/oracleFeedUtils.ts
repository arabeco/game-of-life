import { OracleMessage, OraclePreferences } from '../types';
import { getOperationalDateString as getOperationalDateStringValue } from './operationalDay.js';

const MIN_ORACLE_DAILY_TARGET = 3;
const MAX_ORACLE_DAILY_TARGET = 5;
const DAY_MINUTES = 24 * 60;

export const ORACLE_MANUAL_COOLDOWN_MS = 5 * 60 * 1000;

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

export const resolveOracleDailyTarget = (preferences: Pick<OraclePreferences, 'enabledCategories'> | null | undefined): number => {
  const enabledCount = preferences?.enabledCategories?.length ?? 0;
  return clamp(enabledCount || MIN_ORACLE_DAILY_TARGET, MIN_ORACLE_DAILY_TARGET, MAX_ORACLE_DAILY_TARGET);
};

export const getOracleAutoGapMs = (preferences: Pick<OraclePreferences, 'enabledCategories' | 'quietHoursStart' | 'quietHoursEnd'> | null | undefined): number => {
  const target = resolveOracleDailyTarget(preferences);
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

export type OracleFeedQuotaStatus = {
  dailyTarget: number;
  sentToday: number;
  remainingToday: number;
  autoGapMs: number;
  nextAutoInMs: number;
  manualCooldownRemainingMs: number;
  latestFeedAt: string | null;
};

export const getOracleFeedQuotaStatus = (
  messages: OracleMessage[],
  preferences: Pick<OraclePreferences, 'enabledCategories' | 'quietHoursStart' | 'quietHoursEnd'> | null | undefined,
  now: Date = new Date(),
): OracleFeedQuotaStatus => {
  const dailyTarget = resolveOracleDailyTarget(preferences);
  const todayMessages = getOracleFeedMessagesForOperationalDay(messages, now);
  const sentToday = todayMessages.length;
  const remainingToday = Math.max(0, dailyTarget - sentToday);
  const autoGapMs = getOracleAutoGapMs(preferences);
  const latestTodayMessage = getLatestOracleFeedMessage(todayMessages);
  const latestFeedMessage = getLatestOracleFeedMessage(messages);
  const nowMs = now.getTime();

  const nextAutoInMs = latestTodayMessage
    ? Math.max(0, autoGapMs - (nowMs - new Date(latestTodayMessage.createdAt).getTime()))
    : 0;

  const manualCooldownRemainingMs = latestFeedMessage
    ? Math.max(0, ORACLE_MANUAL_COOLDOWN_MS - (nowMs - new Date(latestFeedMessage.createdAt).getTime()))
    : 0;

  return {
    dailyTarget,
    sentToday,
    remainingToday,
    autoGapMs,
    nextAutoInMs,
    manualCooldownRemainingMs,
    latestFeedAt: latestFeedMessage?.createdAt ?? null,
  };
};
