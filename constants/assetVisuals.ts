import { LIFE_AREAS } from './lifeAreas';

export const DEFAULT_ASSET_ART_BY_ID = {
  proposito: '/assets/life-areas/purpose.webp',
  relacoes: '/assets/life-areas/relationships.webp',
  trabalho: '/assets/life-areas/work-study.webp',
  lazer: '/assets/life-areas/leisure.webp',
  saude: '/assets/life-areas/health.webp',
} as const;

/**
 * Os icones de arena e acao, por area da vida.
 *
 * Eram 12 por area e a mesma dezena reaparecia em toda arena criada. O criterio
 * agora e o que gente de verdade faz e registra: passear com o cachorro, tomar
 * cafe com alguem, ir ao mercado, dentista. Antes havia simbolo abstrato demais
 * (📜, 🪶) e faltava o cotidiano, que e o que aparece na maioria das arenas.
 *
 * ~17 por categoria, seis categorias. Nao e o conjunto completo de emojis de
 * proposito: milhares so ficam navegaveis com busca por palavra-chave, o que
 * exigiria carregar um banco de nomes junto.
 */
const AREA_ICONS = {
  proposito: ['✨', '🧭', '🕯️', '🙏', '🧘', '📖', '📿', '🌅', '🌙', '🌌', '🍃', '⛰️', '⭐', '🤍', '☯️', '📓', '🕊️'],
  relacoes: ['🤝', '🫂', '❤️', '👨‍👩‍👧', '📞', '💬', '☕', '🍻', '🎉', '🎁', '🐕', '🐈', '👶', '🏡', '🎂', '🚗', '✉️'],
  trabalho: ['💼', '💻', '📊', '📈', '🗓️', '✉️', '📝', '📚', '🎓', '🧠', '🛠️', '🏢', '🧾', '📁', '✍️', '🔬', '🎤'],
  lazer: ['🎨', '🎮', '🎬', '🎵', '🎸', '📷', '✈️', '🏖️', '🌳', '🍳', '📖', '🎲', '🎧', '🕺', '🎣', '🛹', '🧩'],
  saude: ['🏃', '💪', '🏋️', '🚴', '🏊', '🧘', '🥗', '💧', '😴', '🩺', '💊', '🦷', '👟', '🚶', '🫀', '🥤', '🧴'],
} as const;

/** O que nao e area da vida: casa, contas, mercado, carro, bicho, conserto. */
const OUTROS_ICONS = ['🏠', '🧹', '🧺', '🛒', '🚗', '🔑', '🧾', '📦', '🔧', '💡', '🪴', '🗑️', '⛽', '🏦', '📮', '✅', '📌'] as const;

export const ASSET_VISUALS = {
  ...Object.fromEntries(LIFE_AREAS.map((area) => [area.id, {
    label: area.name,
    color: area.color,
    tabIcon: area.icon,
    icons: AREA_ICONS[area.id],
  }])),
  geral: {
    label: 'Outros',
    color: '#4b5563',
    tabIcon: '📦',
    icons: OUTROS_ICONS,
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

/**
 * O seletor tinha 30 icones no total e a mesma dezena reaparecia em toda arena
 * criada. O acervo agora vem de constants/iconLibrary; os sugeridos e as areas
 * da vida continuam na frente porque sao o atalho de quem nao quer procurar.
 */
/**
 * Seis abas: as cinco areas da vida e Outros. A aba "Sugeridos" saiu — ela
 * repetia icones que ja estavam nas areas e empurrava a escolha real para a
 * segunda tela.
 */
export const ICON_PICKER_CATEGORIES: IconPickerCategory[] = [
  ...Object.entries(ASSET_VISUALS).map(([id, config]) => ({
    id: id as AssetVisualId,
    label: config.label,
    color: config.color,
    tabIcon: config.tabIcon,
    icons: config.icons,
  })),
];
