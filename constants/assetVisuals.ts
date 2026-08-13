import { LIFE_AREAS } from './lifeAreas';

export const DEFAULT_ASSET_ART_BY_ID = {
  proposito: '/assets/life-areas/purpose.webp',
  relacoes: '/assets/life-areas/relationships.webp',
  trabalho: '/assets/life-areas/work-study.webp',
  lazer: '/assets/life-areas/leisure.webp',
  saude: '/assets/life-areas/health.webp',
} as const;

const AREA_ICONS = {
  proposito: ['✨', '🧭', '🕯️', '🙏', '🧘', '🌌', '📿', '☀️', '🌙', '🪶', '📜', '⭐'],
  relacoes: ['🤝', '🫂', '💬', '📞', '✉️', '👥', '❤️', '☕', '🎉', '🏡', '📣', '🌉'],
  trabalho: ['💼', '💻', '📊', '🧾', '🖥️', '📈', '🗓️', '🧠', '🛠️', '📚', '🏢', '✍️'],
  lazer: ['🎨', '🎸', '🎮', '📷', '🎲', '🎬', '🎤', '🧶', '🏄', '📖', '🛹', '🎻'],
  saude: ['💪', '🏃', '🏋️', '🚴', '🥗', '🏊', '🥊', '🧘', '⚽', '🫀', '👟', '🥤'],
} as const;

export const ASSET_VISUALS = {
  ...Object.fromEntries(LIFE_AREAS.map((area) => [area.id, {
    label: area.name,
    color: area.color,
    tabIcon: area.icon,
    icons: AREA_ICONS[area.id],
  }])),
  geral: {
    label: 'Geral',
    color: '#4b5563',
    tabIcon: '✨',
    icons: ['✨', '✅', '📌', '📝', '📅', '🧩', '📦', '📍', '🔔', '🗂️', '🔒', '⭐'],
  },
} as const;

export type AssetVisualId = keyof typeof ASSET_VISUALS;

export type IconPickerCategory = {
  id: AssetVisualId | 'sugeridos';
  label: string;
  color: string;
  tabIcon: string;
  icons: readonly string[];
};

export const ASSET_ACCENT_COLORS: Record<AssetVisualId, string> = Object.fromEntries(
  Object.entries(ASSET_VISUALS).map(([id, config]) => [id, config.color]),
) as Record<AssetVisualId, string>;

export const ICON_PICKER_CATEGORIES: IconPickerCategory[] = [
  {
    id: 'sugeridos',
    label: 'Sugeridos',
    color: '#6b7280',
    tabIcon: '✨',
    icons: ['🏆', '📚', '🔥', '💼', '🧠', '🎯', '💰', '🤝', '🏃', '🎨', '🧘', '📝', '📌', '✅', '⭐', '👑', '⚔️', '🛠️'],
  },
  ...Object.entries(ASSET_VISUALS).map(([id, config]) => ({
    id: id as AssetVisualId,
    label: config.label,
    color: config.color,
    tabIcon: config.tabIcon,
    icons: config.icons,
  })),
];
