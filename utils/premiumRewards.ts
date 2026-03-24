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

    const parts: string[] = ['Premium renovado por 30 dias.'];

    if (payload.chestType) {
        parts.push(`Baú ${payload.chestType} entregue.`);
    }

    if (itemNames.length > 3) {
        parts.push(`${itemNames.length} itens sazonais foram integrados ao Arsenal.`);
    } else if (itemNames.length > 0) {
        parts.push(`Itens recebidos: ${joinNames(itemNames)}.`);
    }

    return parts.join(' ').trim();
};
