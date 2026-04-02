import { Asset, UserProfile } from '../types';
import { getActiveSubscriptionTier, hasPremiumAccess } from './premiumAccess';

export const STANDARD_ARENA_LIMIT = 7;
export const PREMIUM_ARENA_LIMIT = 15;
export const PLATINUM_ARENA_LIMIT = 30;

export type ArenaCapacitySummary = {
    active: number;
    total: number;
    limit: number;
    remaining: number;
    isPremium: boolean;
    isPlatinum: boolean;
    isAtLimit: boolean;
};

export const getArenaLimitForProfile = (profile?: UserProfile | null): number => {
    const tier = getActiveSubscriptionTier(profile);
    if (tier === 'platinum') return PLATINUM_ARENA_LIMIT;
    if (tier === 'premium') return PREMIUM_ARENA_LIMIT;
    return STANDARD_ARENA_LIMIT;
};

export const getArenaCapacitySummary = (assets: Asset[], profile?: UserProfile | null): ArenaCapacitySummary => {
    const total = assets.reduce((sum, asset) => sum + asset.arenas.length, 0);
    const active = assets.reduce((sum, asset) => sum + asset.arenas.filter((arena) => !arena.isArchived).length, 0);
    const limit = getArenaLimitForProfile(profile);
    const remaining = Math.max(0, limit - total);
    const isPremium = hasPremiumAccess(profile);
    const isPlatinum = getActiveSubscriptionTier(profile) === 'platinum';

    return {
        active,
        total,
        limit,
        remaining,
        isPremium,
        isPlatinum,
        isAtLimit: total >= limit,
    };
};

export const buildArenaLimitMessage = (
    summary: ArenaCapacitySummary,
    options?: { requestedArenaCount?: number },
): string => {
    const requestedArenaCount = Math.max(1, options?.requestedArenaCount || 1);
    const missingSlots = Math.max(0, summary.total + requestedArenaCount - summary.limit);

    if (requestedArenaCount > 1 && missingSlots > 0) {
        if (summary.isPlatinum) {
            return `Essa operacao precisa de ${requestedArenaCount} arenas, mas seu limite platinum de ${summary.limit} ja ficou curto. Exclua ${missingSlots} arena(s) antes de continuar.`;
        }
        if (summary.isPremium) {
            return `Essa operacao precisa de ${requestedArenaCount} arenas, mas seu limite premium de ${summary.limit} ja ficou curto. Exclua ${missingSlots} arena(s) antes de continuar ou suba para o Platinum.`;
        }
        return `Essa operacao precisa de ${requestedArenaCount} arenas, mas o plano atual permite ate ${summary.limit}. Exclua ${missingSlots} arena(s), ative Premium para ${PREMIUM_ARENA_LIMIT} ou Platinum para ${PLATINUM_ARENA_LIMIT}.`;
    }

    if (summary.isPlatinum) {
        return `Voce atingiu o limite de ${summary.limit} arenas. Exclua uma arena para continuar.`;
    }

    if (summary.isPremium) {
        return `Voce atingiu o limite de ${summary.limit} arenas. Exclua uma arena para continuar ou suba para o Platinum com ${PLATINUM_ARENA_LIMIT}.`;
    }

    return `Voce atingiu o limite de ${summary.limit} arenas. Exclua uma arena, ative Premium para ${PREMIUM_ARENA_LIMIT} ou Platinum para ${PLATINUM_ARENA_LIMIT}.`;
};
