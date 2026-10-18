import type { Arena } from '../types';
import { normalizeLifeAreaId } from '../constants/lifeAreas.ts';
import { getArenaDomainFlags } from './taskDomain.js';

/** Approved palette: shared by arena cards, action tiles and modal previews. */
export const ARENA_TONES: Record<string, readonly string[]> = {
    trabalho: ['#FFF176', '#FDD835', '#F4C430', '#B8A02A', '#C98312'],
    proposito: ['#93C5FD', '#3B82F6', '#6155E8', '#8553E0', '#A153CE'],
    relacoes: ['#34D399', '#22C55E', '#84A059', '#556B2F', '#287451'],
    lazer: ['#FFC38A', '#FFB45A', '#FFA21C', '#FF8C00', '#EF7900'],
    saude: ['#FB7185', '#EF4444', '#DC2626', '#B91C1C', '#7F1D1D'],
};

export const validToneSequence = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

// Old offline/public snapshots without the field still render stably by ID.
// Authenticated rows get their permanent sequence from the database migration.
export function getArenaTone(arena: Pick<Arena, 'id' | 'assetId' | 'colorToneSequence'>): string {
    const palette = ARENA_TONES[normalizeLifeAreaId(arena.assetId)];
    if (!palette) return '#5d6874';
    const sequence = validToneSequence(arena.colorToneSequence)
        ? arena.colorToneSequence
        : [...arena.id].reduce((hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0, 0);
    return palette[sequence % palette.length];
}

export function nextArenaToneSequence(arenas: readonly Arena[], assetId: string, reserved = 0): number {
    const key = normalizeLifeAreaId(assetId);
    return arenas.reduce((next, arena) => normalizeLifeAreaId(arena.assetId) === key && validToneSequence(arena.colorToneSequence)
        ? Math.max(next, arena.colorToneSequence + 1) : next, validToneSequence(reserved) ? reserved : 0);
}

function blend(tone: string, amount: number): string {
    const base = [17, 21, 27];
    return '#' + base.map((value, i) => Math.round(value + (parseInt(tone.slice(1 + i * 2, 3 + i * 2), 16) - value) * amount).toString(16).padStart(2, '0')).join('');
}

export function getArenaActionGradient(arena: Arena): string {
    const flags = getArenaDomainFlags(arena);
    if (flags.isSeasonQuest) return 'var(--quest-grad-season)';
    if (flags.isClanQuest) return 'var(--quest-grad-clan)';
    if (flags.isSideQuest) return 'var(--quest-grad-sidequest)';
    const color = getArenaTone(arena);
    const orange = normalizeLifeAreaId(arena.assetId) === 'lazer';
    return `linear-gradient(135deg, ${blend(color, .20)} 0%, ${blend(color, orange ? .60 : .35)} 48%, ${blend(color, orange ? .95 : .72)} 100%)`;
}

/** Campaign material uses every distinct arena tone, in campaign order. */
export function getCampaignGradient(arenas: readonly Arena[]): string {
    const tones = [...new Set(arenas.map(getArenaTone))];
    if (!tones.length) return 'linear-gradient(135deg, #25282e, #101216)';
    const stops = tones.length === 1
        ? [blend(tones[0], .18), blend(tones[0], .48)]
        : tones.map(tone => blend(tone, .38));
    return `linear-gradient(135deg, ${stops.map((color, i) => `${color} ${Math.round(i * 100 / (stops.length - 1))}%`).join(', ')})`;
}
