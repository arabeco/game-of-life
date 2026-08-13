export interface AssetOverviewLayoutEntry {
  x: number;
  y: number;
}

export type AssetOverviewLayoutConfig = Record<string, AssetOverviewLayoutEntry>;

export const ASSET_OVERVIEW_LAYOUT_STORAGE_KEY = 'glyph:assets-overview-layout-v5';
export const ASSET_OVERVIEW_LAYOUT_UPDATED_EVENT = 'glyph:assets-overview-layout-updated';

export const DEFAULT_ASSET_OVERVIEW_LAYOUT: AssetOverviewLayoutConfig = {
  proposito: { x: 50, y: 10 },
  relacoes: { x: 50, y: 30 },
  trabalho: { x: 50, y: 50 },
  lazer: { x: 50, y: 70 },
  saude: { x: 50, y: 90 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sanitizeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, min, max);
};

export const sanitizeAssetOverviewLayoutConfig = (
  value: Partial<AssetOverviewLayoutConfig> | null | undefined,
): AssetOverviewLayoutConfig => {
  const next = { ...DEFAULT_ASSET_OVERVIEW_LAYOUT };

  Object.entries(DEFAULT_ASSET_OVERVIEW_LAYOUT).forEach(([id, defaults]) => {
    const candidate = value?.[id];
    next[id] = {
      x: sanitizeNumber(candidate?.x, defaults.x, 4, 96),
      y: sanitizeNumber(candidate?.y, defaults.y, 2, 98),
    };
  });

  return next;
};

export const getStoredAssetOverviewLayoutConfig = (): AssetOverviewLayoutConfig => {
  if (typeof window === 'undefined') return DEFAULT_ASSET_OVERVIEW_LAYOUT;

  try {
    const raw = window.localStorage.getItem(ASSET_OVERVIEW_LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_ASSET_OVERVIEW_LAYOUT;
    return sanitizeAssetOverviewLayoutConfig(JSON.parse(raw) as Partial<AssetOverviewLayoutConfig>);
  } catch {
    return DEFAULT_ASSET_OVERVIEW_LAYOUT;
  }
};

export const setStoredAssetOverviewLayoutConfig = (
  config: Partial<AssetOverviewLayoutConfig>,
) => {
  if (typeof window === 'undefined') return DEFAULT_ASSET_OVERVIEW_LAYOUT;
  const sanitized = sanitizeAssetOverviewLayoutConfig(config);
  window.localStorage.setItem(ASSET_OVERVIEW_LAYOUT_STORAGE_KEY, JSON.stringify(sanitized, null, 2));
  window.dispatchEvent(new CustomEvent(ASSET_OVERVIEW_LAYOUT_UPDATED_EVENT, { detail: sanitized }));
  return sanitized;
};

export const resetStoredAssetOverviewLayoutConfig = () =>
  setStoredAssetOverviewLayoutConfig(DEFAULT_ASSET_OVERVIEW_LAYOUT);

export const serializeAssetOverviewLayout = (config: AssetOverviewLayoutConfig) =>
  JSON.stringify(
    Object.entries(config).map(([id, position]) => ({
      id,
      x: Number(position.x.toFixed(2)),
      y: Number(position.y.toFixed(2)),
    })),
    null,
    2,
  );
