type ExpBoostLikeProfile = {
  expBoostMultiplier?: number | null;
  expBoostExpiresAt?: string | null;
  expBoostProductId?: string | null;
};

export const getExpBoostExpiryDate = (profile?: ExpBoostLikeProfile | null): Date | null => {
  const raw = profile?.expBoostExpiresAt;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const hasActiveExpBoost = (profile?: ExpBoostLikeProfile | null, now: number = Date.now()): boolean => {
  if (!profile) return false;
  const multiplier = Number(profile.expBoostMultiplier || 1);
  if (multiplier <= 1) return false;

  const expiryDate = getExpBoostExpiryDate(profile);
  if (!expiryDate) return false;
  return expiryDate.getTime() > now;
};

export const getExpBoostMultiplier = (profile?: ExpBoostLikeProfile | null, now: number = Date.now()): number => {
  return hasActiveExpBoost(profile, now) ? Math.max(1, Number(profile?.expBoostMultiplier || 1)) : 1;
};

export const getExpBoostHoursRemaining = (profile?: ExpBoostLikeProfile | null, now: number = Date.now()): number | null => {
  const expiryDate = getExpBoostExpiryDate(profile);
  if (!expiryDate) return null;
  return Math.max(0, Math.ceil((expiryDate.getTime() - now) / (60 * 60 * 1000)));
};

export const getExpBoostLabel = (profile?: ExpBoostLikeProfile | null, now: number = Date.now()): string | null => {
  if (!hasActiveExpBoost(profile, now)) return null;
  const multiplier = getExpBoostMultiplier(profile, now);
  const percent = Math.max(0, Math.round((multiplier - 1) * 100));
  return `+${percent}% XP`;
};

export const getNextExpBoostExpiryAt = (durationHours: number, currentExpiresAt?: string | null, now: number = Date.now()): string => {
  const currentExpiry = currentExpiresAt ? new Date(currentExpiresAt).getTime() : NaN;
  const baseTime = Number.isFinite(currentExpiry) && currentExpiry > now ? currentExpiry : now;
  return new Date(baseTime + durationHours * 60 * 60 * 1000).toISOString();
};
