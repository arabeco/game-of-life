import { resolveItemDef } from '../constants/items';
import type { RewardModalPayload } from '../types';

const joinNames = (names: string[]): string => {
    if (names.length <= 1) return names[0] || '';
    if (names.length === 2) return `${names[0]} e ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
};

export const buildPremiumRewardsToast = (payload?: RewardModalPayload | null): string => {
    if (!payload) return 'Renovação premium concluída.';

    const itemNames = Array.from(
        new Set(
            (payload.itemIds || [])
                .map((itemId) => resolveItemDef(itemId)?.name || null)
                .filter((name): name is string => Boolean(name)),
        ),
    );

    const isPlatinum = payload.membershipTier === 'platinum' || (payload.title || '').toLowerCase().includes('platinum');
    const parts: string[] = [isPlatinum ? 'Platinum renovado por 30 dias.' : 'Premium renovado por 30 dias.'];

    if (payload.chestType) {
        parts.push(`Baú ${payload.chestType === 'Season' ? 'Temporada' : payload.chestType} entregue.`);
    }

    if (itemNames.length > 2) {
        parts.push(`Itens recebidos: ${joinNames(itemNames.slice(0, 2))} e +${itemNames.length - 2} ${itemNames.length - 2 === 1 ? 'item' : 'itens'}.`);
    } else if (itemNames.length > 0) {
        parts.push(`Itens recebidos: ${joinNames(itemNames)}.`);
    }

    if ((payload.campaignQuizFreeCreditsGranted || 0) > 0) {
        parts.push(`${payload.campaignQuizFreeCreditsGranted} ficha grátis de quiz liberada.`);
    }

    if ((payload.campaignQuizMediumCreditsGranted || 0) > 0) {
        parts.push(`${payload.campaignQuizMediumCreditsGranted} ficha média de quiz liberada.`);
    }

    if ((payload.legacyProjectionSceneCreditsGranted || 0) > 0) {
        parts.push(`${payload.legacyProjectionSceneCreditsGranted} cena de legado grátis liberada.`);
    }

    return parts.join(' ').trim();
};

