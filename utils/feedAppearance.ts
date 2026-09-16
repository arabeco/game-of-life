import type { CSSProperties } from 'react';
import type { FeedEvent } from '../types';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { SEASONS } from '../constants/seasonContent';

// Visual fallbacks for seasons whose optional color pair is not configured yet.
const seasonPalette: Record<string, { primaria: string; secundaria: string }> = {
    genesis: { primaria: '#7663a4', secundaria: '#a48a53' },
    aurora: { primaria: '#418d87', secundaria: '#946598' },
    zenite: { primaria: '#ad873e', secundaria: '#aa6043' },
    eclipse: { primaria: '#665394', secundaria: '#9b526e' },
    egide: { primaria: '#4a7187', secundaria: '#648577' },
};

export function getFeedAppearance(event: FeedEvent): CSSProperties {
    let primary = '#87744e';
    let secondary = '#514535';
    let silver = false;
    if (event.type === 'ARENA_COMPLETED' || event.type === 'MILESTONE_COMPLETED') {
        primary = ASSET_ACCENT_COLORS[event.content.assetId || ''] || '#687380';
        secondary = primary;
    } else if (event.type === 'QUEST_COMPLETED') {
        const season = event.content.seasonId ? SEASONS[event.content.seasonId] : undefined;
        const colors = season?.cores || (season ? seasonPalette[season.theme] : undefined);
        primary = colors?.primaria || '#9564ce';
        secondary = colors?.secundaria || '#be608f';
    } else if (event.type === 'CYCLE_COMPLETED' || event.type === 'REPORT_COMPLETED' || event.type === 'CLAN_RANK_UP') {
        primary = '#9baabc';
        secondary = '#606e82';
        silver = true;
    }
    return {
        '--feat-hue': primary,
        '--feat-hue-secondary': secondary,
        '--feat-accent': silver ? '#e0e5ee' : '#e9c981',
        '--feat-rgb': silver ? '210, 220, 235' : '233, 201, 129',
    } as CSSProperties;
}
