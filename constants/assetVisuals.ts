export const ASSET_VISUALS = {
  consciencia: {
    label: 'Consciência',
    color: '#31456f',
    tabIcon: '🧠',
    icons: ['🧠', '🪞', '🔍', '📓', '📖', '🧩', '🗝️', '🧭', '🪶', '🫧', '🧘', '✨'],
  },
  'espaco-mental': {
    label: 'Espaço Mental',
    color: '#24445b',
    tabIcon: '🌬️',
    icons: ['🌬️', '☁️', '🌙', '🎧', '🛏️', '🫖', '📚', '🫧', '🧺', '🌫️', '🕯️', '🔕'],
  },
  espiritualidade: {
    label: 'Espiritualidade',
    color: '#4f2f65',
    tabIcon: '🕯️',
    icons: ['🕯️', '🙏', '🧘', '✨', '🌌', '🔮', '📿', '☀️', '🌙', '⛩️', '🛐', '🪷'],
  },
  proposito: {
    label: 'Propósito',
    color: '#683142',
    tabIcon: '🎯',
    icons: ['🎯', '🧭', '🏹', '👑', '🚀', '📜', '🏔️', '🔥', '🪶', '🗺️', '⚔️', '🌟'],
  },
  projetos: {
    label: 'Projetos',
    color: '#1d4d52',
    tabIcon: '🛠️',
    icons: ['🛠️', '📐', '📦', '🏗️', '🧱', '🗂️', '🧪', '🎬', '💡', '📌', '🪚', '⚙️'],
  },
  conexoes: {
    label: 'Conexões',
    color: '#315338',
    tabIcon: '🤝',
    icons: ['🤝', '🫂', '💬', '📞', '✉️', '👥', '❤️', '☕', '🎉', '🧑‍🤝‍🧑', '📣', '🌉'],
  },
  trabalho: {
    label: 'Trabalho',
    color: '#5a5028',
    tabIcon: '💼',
    icons: ['💼', '💻', '📊', '🧾', '🖥️', '📈', '🗓️', '🧠', '🛠️', '📚', '🏢', '🧑‍💼'],
  },
  financas: {
    label: 'Finanças',
    color: '#6a4720',
    tabIcon: '💰',
    icons: ['💰', '💳', '🏦', '📈', '🧾', '💎', '🪙', '💹', '📊', '🏛️', '🧮', '💸'],
  },
  hobbies: {
    label: 'Hobbies',
    color: '#5d2a57',
    tabIcon: '🎨',
    icons: ['🎨', '🎸', '🎮', '📷', '🎲', '🎬', '🎤', '🧶', '🏄', '📚', '🛹', '🎻'],
  },
  fisico: {
    label: 'Físico',
    color: '#6f2f2f',
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
