import { ChestType, ItemRarity } from '../types';

export type VisualRarity = ItemRarity | 'quest';

type RarityVisual = {
    key: VisualRarity;
    label: string;
    hex: string;
    rgb: string;
};

export const RARITY_VISUALS: Record<VisualRarity, RarityVisual> = {
    common: { key: 'common', label: 'Comum', hex: '#9CA3AF', rgb: '156,163,175' },
    uncommon: { key: 'uncommon', label: 'Incomum', hex: '#22C55E', rgb: '34,197,94' },
    rare: { key: 'rare', label: 'Raro', hex: '#3B82F6', rgb: '59,130,246' },
    epic: { key: 'epic', label: 'Epico', hex: '#A855F7', rgb: '168,85,247' },
    legendary: { key: 'legendary', label: 'Lendario', hex: '#F59E0B', rgb: '245,158,11' },
    mythic: { key: 'mythic', label: 'Mitico', hex: '#7B61FF', rgb: '123,97,255' },
    quest: { key: 'quest', label: 'Temporada', hex: '#14B8A6', rgb: '20,184,166' },
};

export const withAlpha = (rgb: string, alpha: number): string =>     `rgba(${rgb}, ${alpha})`;

export const normalizeVisualRarity = (value?: string | null): VisualRarity | undefined => {
    if (!value) return undefined;
    const lower = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (lower === 'common' || lower === 'comum') return 'common';
    if (lower === 'uncommon' || lower === 'incomum') return 'uncommon';
    if (lower === 'rare' || lower === 'raro' || lower === 'radiante') return 'rare';
    if (lower === 'epic' || lower === 'epico') return 'epic';
    if (lower === 'legendary' || lower === 'lendario') return 'legendary';
    if (lower === 'mythic' || lower === 'mitico') return 'mythic';
    if (lower === 'quest' || lower.includes('clan') || lower.includes('season')) return 'quest';
    return undefined;
};

export const getRarityVisual = (value?: string | null): RarityVisual => {
    const normalized = normalizeVisualRarity(value) || 'common';
    return RARITY_VISUALS[normalized];
};

export const getTierVisual = (tier?: number): RarityVisual => {
    switch (tier) {
        case 2:
            return RARITY_VISUALS.uncommon;
        case 3:
            return RARITY_VISUALS.rare;
        case 4:
            return RARITY_VISUALS.epic;
        case 5:
            return RARITY_VISUALS.legendary;
        case 6:
            return RARITY_VISUALS.mythic;
        default:
            return RARITY_VISUALS.common;
    }
};

export const getChestVisual = (type: ChestType | string): RarityVisual => {
    const lower = String(type).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (lower.includes('skin') && lower.includes('comum')) return RARITY_VISUALS.common;
    if (lower.includes('incomum')) return RARITY_VISUALS.uncommon;
    if (lower.includes('raro') || lower.includes('radiante') || lower.includes('ciclo')) return RARITY_VISUALS.rare;
    if (lower.includes('epico')) return RARITY_VISUALS.epic;
    if (lower.includes('season')) return RARITY_VISUALS.quest;
    if (lower.includes('lendario') || lower.includes('legendary')) return RARITY_VISUALS.legendary;
    return RARITY_VISUALS.common;
};

export const QUEST_VISUAL = RARITY_VISUALS.quest;
