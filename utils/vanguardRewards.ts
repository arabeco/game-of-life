import { resolveItemDef } from '../constants/items';
import type { VanguardWelcomePayload } from '../types';

const joinNames = (names: string[]): string => {
    if (names.length <= 1) return names[0] || '';
    if (names.length === 2) return `${names[0]} e ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
};

export const buildVanguardRewardsToast = (payload?: VanguardWelcomePayload | null): string => {
    if (!payload) return 'Pacote da Vanguarda integrado ao Arsenal.';

    const itemNames = Array.from(
        new Set(
            (payload.itemIds || [])
                .map((itemId) => {
                    const itemDef = resolveItemDef(itemId);
                    if (!itemDef || itemDef.category === 'hair') return null;
                    return itemDef.name;
                })
                .filter((name): name is string => Boolean(name)),
        ),
    );

    const parts: string[] = [];

    if ((payload.gold || 0) > 0) {
        parts.push(`+${payload.gold} ouro confirmados.`);
    }

    if (payload.chestType) {
        parts.push(`Bau ${payload.chestType} entregue.`);
    }

    if (itemNames.length > 3) {
        parts.push(`${itemNames.length} itens foram adicionados ao Arsenal.`);
    } else if (itemNames.length > 0) {
        parts.push(`Itens adicionados: ${joinNames(itemNames)}.`);
    }

    return parts.join(' ').trim() || 'Pacote da Vanguarda integrado ao Arsenal.';
};
