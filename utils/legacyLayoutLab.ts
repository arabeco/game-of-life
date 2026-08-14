export interface LegacyLayoutConfig {
  backdropZoom: number;
  plaqueOffsetX: number;
  plaqueOffsetY: number;
  plaqueZoom: number;
  plaqueWidth: number;
  cyclesOffsetX: number;
  cyclesOffsetY: number;
  cyclesZoom: number;
  playerOffsetX: number;
  playerOffsetY: number;
  playerZoom: number;
}

export interface LegacyPreviewLayoutConfig {
  backdropZoom: number;
  plaqueOffsetY: number;
  plaqueZoom: number;
}

export const LEGACY_LAYOUT_STORAGE_KEY = 'glyph:legacy-layout-lab-v8';
export const LEGACY_PREVIEW_LAYOUT_STORAGE_KEY = 'glyph:legacy-preview-layout-lab-v4';
export const LEGACY_LAYOUT_UPDATED_EVENT = 'glyph:legacy-layout-updated';
export const LEGACY_PREVIEW_LAYOUT_UPDATED_EVENT = 'glyph:legacy-preview-layout-updated';
export const LEGACY_PREVIEW_PLAQUE_BASE_WIDTH = 312;
export const LEGACY_SCENE_PLAQUE_BASE_WIDTH = 312;
export const LEGACY_PREVIEW_PLAQUE_SCALE = 1;
export const LEGACY_SCENE_PLAQUE_SCALE = 1;

export const DEFAULT_LEGACY_LAYOUT: LegacyLayoutConfig = {
  backdropZoom: 1.05,
  plaqueOffsetX: -4,
  plaqueOffsetY: -5,
  plaqueZoom: 1,
  plaqueWidth: 0.98,
  cyclesOffsetX: 0,
  cyclesOffsetY: -218,
  cyclesZoom: 1.71,
  playerOffsetX: 1,
  playerOffsetY: -12,
  playerZoom: 1.14,
};

export const DEFAULT_LEGACY_PREVIEW_LAYOUT: LegacyPreviewLayoutConfig = {
  backdropZoom: 1.1,
  plaqueOffsetY: 120,
  plaqueZoom: 0.98,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const sanitizeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, min, max);
};

export const sanitizeLegacyLayoutConfig = (value: Partial<LegacyLayoutConfig> | null | undefined): LegacyLayoutConfig => ({
  backdropZoom: sanitizeNumber(value?.backdropZoom, DEFAULT_LEGACY_LAYOUT.backdropZoom, 1, 1.22),
  plaqueOffsetX: sanitizeNumber(value?.plaqueOffsetX, DEFAULT_LEGACY_LAYOUT.plaqueOffsetX, -220, 220),
  plaqueOffsetY: sanitizeNumber(value?.plaqueOffsetY, DEFAULT_LEGACY_LAYOUT.plaqueOffsetY, -120, 120),
  plaqueZoom: sanitizeNumber(value?.plaqueZoom, DEFAULT_LEGACY_LAYOUT.plaqueZoom, 0.55, 1.6),
  plaqueWidth: sanitizeNumber(value?.plaqueWidth, DEFAULT_LEGACY_LAYOUT.plaqueWidth, 0.72, 1.28),
  cyclesOffsetX: sanitizeNumber(value?.cyclesOffsetX, DEFAULT_LEGACY_LAYOUT.cyclesOffsetX, -220, 220),
  cyclesOffsetY: sanitizeNumber(value?.cyclesOffsetY, DEFAULT_LEGACY_LAYOUT.cyclesOffsetY, -360, 140),
  cyclesZoom: sanitizeNumber(value?.cyclesZoom, DEFAULT_LEGACY_LAYOUT.cyclesZoom, 0.55, 1.8),
  playerOffsetX: sanitizeNumber(value?.playerOffsetX, DEFAULT_LEGACY_LAYOUT.playerOffsetX, -220, 220),
  playerOffsetY: sanitizeNumber(value?.playerOffsetY, DEFAULT_LEGACY_LAYOUT.playerOffsetY, -140, 140),
  playerZoom: sanitizeNumber(value?.playerZoom, DEFAULT_LEGACY_LAYOUT.playerZoom, 0.55, 1.35),
});

export const sanitizeLegacyPreviewLayoutConfig = (
  value: Partial<LegacyPreviewLayoutConfig> | null | undefined,
): LegacyPreviewLayoutConfig => ({
  backdropZoom: sanitizeNumber(value?.backdropZoom, DEFAULT_LEGACY_PREVIEW_LAYOUT.backdropZoom, 1, 1.22),
  plaqueOffsetY: sanitizeNumber(value?.plaqueOffsetY, DEFAULT_LEGACY_PREVIEW_LAYOUT.plaqueOffsetY, -120, 120),
  plaqueZoom: sanitizeNumber(value?.plaqueZoom, DEFAULT_LEGACY_PREVIEW_LAYOUT.plaqueZoom, 0.75, 1.45),
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

export const getStoredLegacyPreviewLayoutConfig = (): LegacyPreviewLayoutConfig => {
  if (typeof window === 'undefined') {
    return DEFAULT_LEGACY_PREVIEW_LAYOUT;
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_PREVIEW_LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LEGACY_PREVIEW_LAYOUT;
    return sanitizeLegacyPreviewLayoutConfig(JSON.parse(raw) as Partial<LegacyPreviewLayoutConfig>);
  } catch {
    return DEFAULT_LEGACY_PREVIEW_LAYOUT;
  }
};

export const setStoredLegacyLayoutConfig = (config: Partial<LegacyLayoutConfig>) => {
  if (typeof window === 'undefined') return DEFAULT_LEGACY_LAYOUT;
  const sanitized = sanitizeLegacyLayoutConfig(config);
  window.localStorage.setItem(LEGACY_LAYOUT_STORAGE_KEY, JSON.stringify(sanitized, null, 2));
  window.dispatchEvent(new CustomEvent(LEGACY_LAYOUT_UPDATED_EVENT, { detail: sanitized }));
  return sanitized;
};

export const setStoredLegacyPreviewLayoutConfig = (config: Partial<LegacyPreviewLayoutConfig>) => {
  if (typeof window === 'undefined') return DEFAULT_LEGACY_PREVIEW_LAYOUT;
  const sanitized = sanitizeLegacyPreviewLayoutConfig(config);
  window.localStorage.setItem(LEGACY_PREVIEW_LAYOUT_STORAGE_KEY, JSON.stringify(sanitized, null, 2));
  window.dispatchEvent(new CustomEvent(LEGACY_PREVIEW_LAYOUT_UPDATED_EVENT, { detail: sanitized }));
  return sanitized;
};

export const resetStoredLegacyLayoutConfig = () => setStoredLegacyLayoutConfig(DEFAULT_LEGACY_LAYOUT);
export const resetStoredLegacyPreviewLayoutConfig = () => setStoredLegacyPreviewLayoutConfig(DEFAULT_LEGACY_PREVIEW_LAYOUT);

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

export const getLegacyPreviewPlaqueScale = (
  config: LegacyPreviewLayoutConfig,
) => LEGACY_PREVIEW_PLAQUE_SCALE * config.plaqueZoom;
