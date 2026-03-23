export interface AssetOverviewLayoutEntry {
  x: number;
  y: number;
}

export type AssetOverviewLayoutConfig = Record<string, AssetOverviewLayoutEntry>;

export const ASSET_OVERVIEW_LAYOUT_STORAGE_KEY = 'glyph:assets-overview-layout-v3';
export const ASSET_OVERVIEW_LAYOUT_UPDATED_EVENT = 'glyph:assets-overview-layout-updated';

export const DEFAULT_ASSET_OVERVIEW_LAYOUT: AssetOverviewLayoutConfig = {
  consciencia: { x: 50, y: 10.5 },
  'espaco-mental': { x: 16.66, y: 18.5 },
  espiritualidade: { x: 83.33, y: 18.5 },
  proposito: { x: 16.66, y: 39.25 },
  projetos: { x: 83.33, y: 39.25 },
  conexoes: { x: 50, y: 49.75 },
  trabalho: { x: 16.66, y: 62.75 },
  financas: { x: 83.33, y: 62.75 },
  hobbies: { x: 50, y: 72.75 },
  fisico: { x: 50, y: 91 },
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
