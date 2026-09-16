import type { DailyFeedSnapshot } from '../types';

// Only the app's gradient syntax; never load a remote image from feed content.
export function safeDailyActionBackground(value: unknown): string | undefined {
    if (typeof value !== 'string' || value.length > 500) return undefined;
    if (!/^(?:var\(--(?:asset|quest)-grad-|linear-gradient\()/i.test(value)) return undefined;
    if (!/^[a-z0-9#%,.()\s-]+$/i.test(value) || /url|expression/i.test(value)) return undefined;
    return value;
}

/** Old posts have no snapshot; malformed remote content must not break the feed. */
export function readDailyFeedSnapshot(value: unknown): DailyFeedSnapshot | null {
    if (!value || typeof value !== 'object') return null;
    const s = value as DailyFeedSnapshot;
    if (s.version !== 1 || typeof s.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.date)
        || typeof s.dateLabel !== 'string' || !Array.isArray(s.actions)) return null;
    if (![s.completed, s.total, s.minutes, s.xp, s.bayCount].every(n => Number.isFinite(n) && n >= 0)) return null;
    if (s.completed > s.total || s.actions.length > 2000) return null;
    if (s.reading !== undefined && typeof s.reading !== 'string') return null;
    if (s.comparisonLabel !== undefined && typeof s.comparisonLabel !== 'string') return null;
    if (!s.actions.every(a => a && typeof a.id === 'string' && typeof a.name === 'string'
        && typeof a.icon === 'string' && typeof a.completed === 'boolean')) return null;
    return s;
}
