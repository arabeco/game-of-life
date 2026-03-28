import { Asset, UserProfile } from '../types';
import { hasPremiumAccess } from './premiumAccess';

export const STANDARD_ARENA_LIMIT = 15;
export const PREMIUM_ARENA_LIMIT = 25;

export type ArenaCapacitySummary = {
    active: number;
    total: number;
    limit: number;
    remaining: number;
    isPremium: boolean;
    isAtLimit: boolean;
};

export const getArenaLimitForProfile = (profile?: UserProfile | null): number =>
    hasPremiumAccess(profile) ? PREMIUM_ARENA_LIMIT : STANDARD_ARENA_LIMIT;

export const getArenaCapacitySummary = (assets: Asset[], profile?: UserProfile | null): ArenaCapacitySummary => {
    const total = assets.reduce((sum, asset) => sum + asset.arenas.length, 0);
    const active = assets.reduce((sum, asset) => sum + asset.arenas.filter((arena) => !arena.isArchived).length, 0);
    const limit = getArenaLimitForProfile(profile);
    const remaining = Math.max(0, limit - active);
    const isPremium = hasPremiumAccess(profile);

    return {
        active,
        total,
        limit,
        remaining,
        isPremium,
        isAtLimit: active >= limit,
    };
};

export const buildArenaLimitMessage = (
    summary: ArenaCapacitySummary,
    options?: { requestedActiveArenas?: number },
): string => {
    const requestedActiveArenas = Math.max(1, options?.requestedActiveArenas || 1);
    const missingSlots = Math.max(0, summary.active + requestedActiveArenas - summary.limit);

    if (requestedActiveArenas > 1 && missingSlots > 0) {
        if (summary.isPremium) {
            return `Essa operacao precisa de ${requestedActiveArenas} arenas ativas, mas seu limite premium de ${summary.limit} ja ficou curto. Arquive ${missingSlots} arena(s) antes de continuar.`;
        }
        return `Essa operacao precisa de ${requestedActiveArenas} arenas ativas, mas o plano atual permite ate ${summary.limit}. Arquive ${missingSlots} arena(s) ou ative Premium para chegar a ${PREMIUM_ARENA_LIMIT}.`;
    }

    if (summary.isPremium) {
        return `Voce atingiu o limite de ${summary.limit} arenas ativas. Arquive uma arena para abrir espaco no Planner.`;
    }

    return `Voce atingiu o limite de ${summary.limit} arenas ativas. Arquive uma arena para abrir espaco no Planner ou ative Premium para liberar ate ${PREMIUM_ARENA_LIMIT}.`;
};
