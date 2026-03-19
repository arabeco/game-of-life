export interface LegacyLayoutConfig {
  plaqueOffsetX: number;
  plaqueOffsetY: number;
  plaqueZoom: number;
  plaqueWidth: number;
  cyclesOffsetY: number;
  cyclesZoom: number;
  playerOffsetY: number;
  playerZoom: number;
}

export const LEGACY_LAYOUT_STORAGE_KEY = 'glyph:legacy-layout-lab-v2';
export const LEGACY_LAYOUT_UPDATED_EVENT = 'glyph:legacy-layout-updated';
export const LEGACY_PREVIEW_PLAQUE_BASE_WIDTH = 96;
export const LEGACY_SCENE_PLAQUE_BASE_WIDTH = 96;
export const LEGACY_PREVIEW_PLAQUE_SCALE = 1.65;
export const LEGACY_SCENE_PLAQUE_SCALE = 1;

export const DEFAULT_LEGACY_LAYOUT: LegacyLayoutConfig = {
  plaqueOffsetX: 0,
  plaqueOffsetY: 15,
  plaqueZoom: 0.97,
  plaqueWidth: 0.81,
  cyclesOffsetY: -168,
  cyclesZoom: 1.56,
  playerOffsetY: -38,
  playerZoom: 1.14,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sanitizeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, min, max);
};

export const sanitizeLegacyLayoutConfig = (value: Partial<LegacyLayoutConfig> | null | undefined): LegacyLayoutConfig => ({
  plaqueOffsetX: sanitizeNumber(value?.plaqueOffsetX, DEFAULT_LEGACY_LAYOUT.plaqueOffsetX, -220, 220),
  plaqueOffsetY: sanitizeNumber(value?.plaqueOffsetY, DEFAULT_LEGACY_LAYOUT.plaqueOffsetY, -120, 120),
  plaqueZoom: sanitizeNumber(value?.plaqueZoom, DEFAULT_LEGACY_LAYOUT.plaqueZoom, 0.55, 1.6),
  plaqueWidth: sanitizeNumber(value?.plaqueWidth, DEFAULT_LEGACY_LAYOUT.plaqueWidth, 0.72, 1.28),
  cyclesOffsetY: sanitizeNumber(value?.cyclesOffsetY, DEFAULT_LEGACY_LAYOUT.cyclesOffsetY, -240, 140),
  cyclesZoom: sanitizeNumber(value?.cyclesZoom, DEFAULT_LEGACY_LAYOUT.cyclesZoom, 0.55, 1.8),
  playerOffsetY: sanitizeNumber(value?.playerOffsetY, DEFAULT_LEGACY_LAYOUT.playerOffsetY, -140, 140),
  playerZoom: sanitizeNumber(value?.playerZoom, DEFAULT_LEGACY_LAYOUT.playerZoom, 0.55, 1.35),
});

export const getStoredLegacyLayoutConfig = (): LegacyLayoutConfig => {
  if (typeof window === 'undefined') {
    return DEFAULT_LEGACY_LAYOUT;
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LEGACY_LAYOUT;
    return sanitizeLegacyLayoutConfig(JSON.parse(raw) as Partial<LegacyLayoutConfig>);
  } catch {
    return DEFAULT_LEGACY_LAYOUT;
  }
};

export const setStoredLegacyLayoutConfig = (config: Partial<LegacyLayoutConfig>) => {
  if (typeof window === 'undefined') return DEFAULT_LEGACY_LAYOUT;
  const sanitized = sanitizeLegacyLayoutConfig(config);
  window.localStorage.setItem(LEGACY_LAYOUT_STORAGE_KEY, JSON.stringify(sanitized, null, 2));
  window.dispatchEvent(new CustomEvent(LEGACY_LAYOUT_UPDATED_EVENT, { detail: sanitized }));
  return sanitized;
};

export const resetStoredLegacyLayoutConfig = () => setStoredLegacyLayoutConfig(DEFAULT_LEGACY_LAYOUT);

export const getLegacyPlaqueWidthPx = (
  context: 'preview' | 'scene',
  config: LegacyLayoutConfig,
) => {
  const base = context === 'preview' ? LEGACY_PREVIEW_PLAQUE_BASE_WIDTH : LEGACY_SCENE_PLAQUE_BASE_WIDTH;
  return base * config.plaqueWidth;
};

export const getLegacyPlaqueScale = (
  context: 'preview' | 'scene',
  config: LegacyLayoutConfig,
) => {
  const base = context === 'preview' ? LEGACY_PREVIEW_PLAQUE_SCALE : LEGACY_SCENE_PLAQUE_SCALE;
  return base * config.plaqueZoom;
};
