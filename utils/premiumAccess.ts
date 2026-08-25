export type SubscriptionTier = 'premium' | 'platinum';

type PremiumLikeProfile = {
  isPremium?: boolean | null;
  role?: string | null;
  premiumExpiresAt?: string | null;
  subscriptionTier?: SubscriptionTier | string | null;
  legacyProjectionSceneCredits?: number | null;
};

const PREMIUM_CYCLE_MS = 30 * 24 * 60 * 60 * 1000;

export const isStaffRole = (role?: string | null): boolean => {
  const normalized = (role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'gm' || normalized === 'admin_gm';
};

export const normalizeSubscriptionTier = (tier?: string | null): SubscriptionTier | null => {
  if (!tier) return null;
  const normalized = tier.toLowerCase();
  if (normalized === 'platinum') return 'platinum';
  if (normalized === 'premium') return 'premium';
  return null;
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

export const getActiveSubscriptionTier = (
  profile?: PremiumLikeProfile | null,
  now: number = Date.now(),
): SubscriptionTier | null => {
  if (!profile) return null;
  if (isStaffRole(profile.role)) return 'platinum';
  if (!isPremiumActive(profile, now)) return null;
  return normalizeSubscriptionTier(profile.subscriptionTier) || 'premium';
};

export const hasPremiumAccess = (profile?: PremiumLikeProfile | null, now: number = Date.now()): boolean => {
  return getActiveSubscriptionTier(profile, now) !== null;
};

export const hasPlatinumAccess = (profile?: PremiumLikeProfile | null, now: number = Date.now()): boolean => {
  return getActiveSubscriptionTier(profile, now) === 'platinum';
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

export const getLegacyProjectionSceneCredits = (profile?: PremiumLikeProfile | null): number => {
  return Math.max(0, Number(profile?.legacyProjectionSceneCredits || 0));
};

export const hasLegacyProjectionSceneCredit = (profile?: PremiumLikeProfile | null): boolean => {
  return getLegacyProjectionSceneCredits(profile) > 0;
};

export const getLegacyProjectionScenePrice = (
  profile?: PremiumLikeProfile | null,
  basePrice: number = 50,
): number => {
  if (hasLegacyProjectionSceneCredit(profile)) return 0;
  if (!hasPremiumAccess(profile)) return basePrice;
  return getDiscountedPremiumPrice(basePrice, LEGACY_PROJECTION_PREMIUM_DISCOUNT);
};

export const getNextPremiumExpiryAt = (currentExpiresAt?: string | null, now: number = Date.now()): string => {
  const currentExpiry = currentExpiresAt ? new Date(currentExpiresAt).getTime() : NaN;
  const baseTime = Number.isFinite(currentExpiry) && currentExpiry > now ? currentExpiry : now;
  return new Date(baseTime + PREMIUM_CYCLE_MS).toISOString();
};

/**
 * Bonus de XP no fechamento de ciclo, por tier.
 *
 * Antes era um `0.1` solto em dois pontos do GameContext, atras de
 * `hasPremiumAccess` — que responde true para platinum tambem. Resultado: os
 * dois tiers pagos recebiam exatamente o mesmo bonus, e o Platinum nao tinha
 * nenhuma vantagem de progressao sobre o Premium.
 *
 * O numero mora aqui para que codigo e vitrine nao possam divergir.
 */
export const CYCLE_XP_BONUS_BY_TIER: Record<SubscriptionTier, number> = {
  premium: 0.05,
  platinum: 0.10,
};

/** Fracao a somar sobre o XP base do ciclo. Zero para quem nao assina. */
export const getCycleXpBonusRate = (
  profile?: PremiumLikeProfile | null,
  now: number = Date.now(),
): number => {
  const tier = getActiveSubscriptionTier(profile, now);
  return tier ? CYCLE_XP_BONUS_BY_TIER[tier] : 0;
};

/** O mesmo valor em porcentagem inteira, para textos de vitrine. */
export const getCycleXpBonusPercentLabel = (tier: SubscriptionTier): string =>
  `${Math.round(CYCLE_XP_BONUS_BY_TIER[tier] * 100)}%`;

/**
 * Desconto em ouro nas campanhas.
 *
 * O Platinum custa 2,5x o Premium e, fora XP e arenas, so entregava cosmetico e
 * consumivel de uso unico — coisa que se compra uma vez. Desconto e o unico
 * beneficio que se paga de novo a cada compra, entao e ele que sustenta o tier.
 *
 * ATENCAO: quem cobra e o servidor (buy_codex_catalog_item le price_gold do
 * catalogo). Este calculo existe para EXIBIR o preco; a mesma regra tem de valer
 * la, senao a tela promete um valor e a carteira paga outro.
 */
export const CAMPAIGN_DISCOUNT_BY_TIER: Record<SubscriptionTier, number> = {
  premium: 0,
  platinum: 0.20,
};

export const getCampaignDiscountRate = (
  profile?: PremiumLikeProfile | null,
  now: number = Date.now(),
): number => {
  const tier = getActiveSubscriptionTier(profile, now);
  return tier ? CAMPAIGN_DISCOUNT_BY_TIER[tier] : 0;
};

/** Preco final da campanha para este perfil. Arredonda para cima: ouro e inteiro. */
export const getCampaignPriceForProfile = (
  basePrice: number,
  profile?: PremiumLikeProfile | null,
  now: number = Date.now(),
): number => {
  const base = Math.max(0, Math.round(basePrice || 0));
  if (base <= 0) return 0;
  const rate = getCampaignDiscountRate(profile, now);
  if (rate <= 0) return base;
  return Math.max(1, Math.ceil(base * (1 - rate)));
};
