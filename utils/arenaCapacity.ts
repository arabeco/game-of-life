import type { Asset, Campaign, UserCodex, UserProfile } from '../types';
import { getActiveSubscriptionTier, hasPremiumAccess } from './premiumAccess.ts';

// OS PLANOS DE 28/10/2026 (com o Afonso): gratis 8, Premium 20, Platinum 40.
// 7 apertava demais quem esta comecando; 8 ainda deixa experimentar as cinco
// areas e sobra, e o Premium passa a ter o que oferecer a quem usa de verdade.
// Quem ja tinha mais nao perde nenhuma: o limite so barra criar acima dele.
export const STANDARD_ARENA_LIMIT = 8;
export const PREMIUM_ARENA_LIMIT = 20;
export const PLATINUM_ARENA_LIMIT = 40;

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

/**
 * Conta so arena ativa: arquivar libera a vaga. Arena de missao (temporada ou
 * cla) fica fora: a missao vem do jogo e nao ocupa o lugar das arenas da
 * pessoa. Arena finalizada (completedAt) tambem nao ocupa vaga. `questArenaIds`
 * sao as arenas que guardam acao de missao (sourceQuestId).
 *
 * Campanha (27/10/2026): a da loja ou dada por mentor ocupa UMA vaga, quantas
 * fases (arenas) tiver — `gruposQueContamUma`, de gruposQueContamUmaVaga. A
 * que a pessoa monta para si, ou ganha de amigo, conta uma vaga por arena.
 */
export const getArenaCapacitySummary = (assets: Asset[], profile?: UserProfile | null, questArenaIds?: Set<string>, gruposQueContamUma?: string[][]): ArenaCapacitySummary => {
    const ocupando = new Set(assets.flatMap(asset => asset.arenas.filter(arena => !arena.isArchived && !arena.completedAt && !questArenaIds?.has(arena.id)).map(arena => arena.id)));
    let total = ocupando.size;
    for (const grupo of gruposQueContamUma || []) {
        const ativas = grupo.filter(id => ocupando.has(id)).length;
        if (ativas > 1) total -= ativas - 1;
    }
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

/** As campanhas ativas que ocupam uma vaga so: vindas da loja ou de mentor. */
export const gruposQueContamUmaVaga = (
    campaigns: Pick<Campaign, 'status' | 'sourceCodexId' | 'arenaIds'>[],
    userCodexes: Pick<UserCodex, 'id' | 'catalog_id' | 'source_type' | 'mentor_relationship_link_id'>[],
): string[][] => {
    const daLojaOuMentor = new Set(userCodexes
        .filter(codex => Boolean(codex.catalog_id) || codex.source_type === 'catalog' || Boolean(codex.mentor_relationship_link_id))
        .map(codex => codex.id));
    return campaigns
        .filter(campaign => campaign.status === 'active' && campaign.sourceCodexId && daLojaOuMentor.has(campaign.sourceCodexId) && (campaign.arenaIds?.length || 0) > 0)
        .map(campaign => [...campaign.arenaIds]);
};

export const buildArenaLimitMessage = (
    summary: ArenaCapacitySummary,
    options?: { requestedArenaCount?: number },
): string => {
    const requestedArenaCount = Math.max(1, options?.requestedArenaCount || 1);
    const missingSlots = Math.max(0, summary.total + requestedArenaCount - summary.limit);

    if (requestedArenaCount > 1 && missingSlots > 0) {
        if (summary.isPlatinum) {
            return `Essa operação precisa de ${requestedArenaCount} arenas, mas seu limite platinum de ${summary.limit} já ficou curto. Arquive ou exclua ${missingSlots} arena(s) antes de continuar.`;
        }
        if (summary.isPremium) {
            return `Essa operação precisa de ${requestedArenaCount} arenas, mas seu limite premium de ${summary.limit} já ficou curto. Arquive ou exclua ${missingSlots} arena(s) antes de continuar ou suba para o Platinum.`;
        }
        return `Essa operação precisa de ${requestedArenaCount} arenas, mas o plano atual permite até ${summary.limit}. Arquive ou exclua ${missingSlots} arena(s), ative Premium para ${PREMIUM_ARENA_LIMIT} ou Platinum para ${PLATINUM_ARENA_LIMIT}.`;
    }

    if (summary.isPlatinum) {
        return `Você atingiu o limite de ${summary.limit} arenas. Arquive ou exclua uma arena para continuar.`;
    }

    if (summary.isPremium) {
        return `Você atingiu o limite de ${summary.limit} arenas. Arquive ou exclua uma arena para continuar ou suba para o Platinum com ${PLATINUM_ARENA_LIMIT}.`;
    }

    return `Você atingiu o limite de ${summary.limit} arenas. Arquive ou exclua uma arena, ative Premium para ${PREMIUM_ARENA_LIMIT} ou Platinum para ${PLATINUM_ARENA_LIMIT}.`;
};
