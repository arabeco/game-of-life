type PremiumLikeProfile = {
  isPremium?: boolean | null;
  role?: string | null;
  premiumExpiresAt?: string | null;
};

const PREMIUM_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;

export const isStaffRole = (role?: string | null): boolean => {
  const normalized = (role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'gm' || normalized === 'admin_gm';
};

export const getPremiumExpiryDate = (profile?: PremiumLikeProfile | null): Date | null => {
  const raw = profile?.premiumExpiresAt;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isPremiumActive = (profile?: PremiumLikeProfile | null, now: number = Date.now()): boolean => {
  if (!profile) return false;
  if (isStaffRole(profile.role)) return true;
  if (!profile.isPremium) return false;

  const expiryDate = getPremiumExpiryDate(profile);
  if (!expiryDate) return true;
  return expiryDate.getTime() > now;
};

export const hasPremiumAccess = (profile?: PremiumLikeProfile | null): boolean => {
  return isPremiumActive(profile);
};

export const getPremiumDaysRemaining = (profile?: PremiumLikeProfile | null, now: number = Date.now()): number | null => {
  const expiryDate = getPremiumExpiryDate(profile);
  if (!expiryDate) return null;
  return Math.max(0, Math.ceil((expiryDate.getTime() - now) / (24 * 60 * 60 * 1000)));
};

export const isPremiumInLastDay = (profile?: PremiumLikeProfile | null, now: number = Date.now()): boolean => {
  if (!isPremiumActive(profile, now)) return false;
  const daysRemaining = getPremiumDaysRemaining(profile, now);
  return daysRemaining === 1;
};

export const getDiscountedPremiumPrice = (basePrice: number, discountPercent: number = 0.1): number => {
  return Math.max(0, Math.round(basePrice * (1 - discountPercent)));
};

export const LEGACY_PROJECTION_PREMIUM_DISCOUNT = 0.5;

export const getLegacyProjectionScenePrice = (
  profile?: PremiumLikeProfile | null,
  basePrice: number = 50,
): number => {
  if (!hasPremiumAccess(profile)) return basePrice;
  return getDiscountedPremiumPrice(basePrice, LEGACY_PROJECTION_PREMIUM_DISCOUNT);
};

export const getNextPremiumExpiryAt = (currentExpiresAt?: string | null, now: number = Date.now()): string => {
  const currentExpiry = currentExpiresAt ? new Date(currentExpiresAt).getTime() : NaN;
  const baseTime = Number.isFinite(currentExpiry) && currentExpiry > now ? currentExpiry : now;
  return new Date(baseTime + PREMIUM_CYCLE_MS).toISOString();
};
