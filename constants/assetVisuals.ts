export const ASSET_VISUALS = {
  consciencia: {
    label: 'Consciência',
    color: '#6a4c8f',
    tabIcon: '🧠',
    icons: ['🧠', '🪞', '🔍', '📓', '📖', '🧩', '🗝️', '🧭', '🪶', '🫧', '🧘', '✨'],
  },
  'espaco-mental': {
    label: 'Espaço Mental',
    color: '#97c3e8',
    tabIcon: '🌬️',
    icons: ['🌬️', '☁️', '🌙', '🎧', '🛏️', '🫖', '📚', '🫧', '🧺', '🌫️', '🕯️', '🔕'],
  },
  espiritualidade: {
    label: 'Espiritualidade',
    color: '#79a8df',
    tabIcon: '🕯️',
    icons: ['🕯️', '🙏', '🧘', '✨', '🌌', '🔮', '📿', '☀️', '🌙', '⛩️', '🛐', '🪷'],
  },
  proposito: {
    label: 'Propósito',
    color: '#5566be',
    tabIcon: '🎯',
    icons: ['🎯', '🧭', '🏹', '👑', '🚀', '📜', '🏔️', '🔥', '🪶', '🗺️', '⚔️', '🌟'],
  },
  projetos: {
    label: 'Projetos',
    color: '#63a8ca',
    tabIcon: '🛠️',
    icons: ['🛠️', '📐', '📦', '🏗️', '🧱', '🗂️', '🧪', '🎬', '💡', '📌', '🪚', '⚙️'],
  },
  conexoes: {
    label: 'Conexões',
    color: '#3d6c3f',
    tabIcon: '🤝',
    icons: ['🤝', '🫂', '💬', '📞', '✉️', '👥', '❤️', '☕', '🎉', '🧑‍🤝‍🧑', '📣', '🌉'],
  },
  trabalho: {
    label: 'Trabalho',
    color: '#c7a13a',
    tabIcon: '💼',
    icons: ['💼', '💻', '📊', '🧾', '🖥️', '📈', '🗓️', '🧠', '🛠️', '📚', '🏢', '🧑‍💼'],
  },
  financas: {
    label: 'Finanças',
    color: '#d0ad42',
    tabIcon: '💰',
    icons: ['💰', '💳', '🏦', '📈', '🧾', '💎', '🪙', '💹', '📊', '🏛️', '🧮', '💸'],
  },
  hobbies: {
    label: 'Hobbies',
    color: '#d88944',
    tabIcon: '🎨',
    icons: ['🎨', '🎸', '🎮', '📷', '🎲', '🎬', '🎤', '🧶', '🏄', '📚', '🛹', '🎻'],
  },
  fisico: {
    label: 'Físico',
    color: '#a63a4d',
    tabIcon: '💪',
    icons: ['💪', '🏃‍♂️', '🏋️‍♂️', '🚴‍♂️', '🥗', '🏊‍♂️', '🥊', '🧘‍♂️', '⚽', '🫀', '👟', '🥤'],
  },
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
    icons: [
      '🏆', '📚', '🔥', '💼', '🧠', '🎯', '💰', '🤝', '🏃‍♂️', '🎨', '🧘', '📝',
      '📌', '✅', '⭐', '👑', '⚔️', '🛠️',
    ],
  },
  ...Object.entries(ASSET_VISUALS).map(([id, config]) => ({
    id: id as AssetVisualId,
    label: config.label,
    color: config.color,
    tabIcon: config.tabIcon,
    icons: config.icons,
  })),
];
