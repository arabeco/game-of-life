import { LIFE_AREAS } from './lifeAreas';

export const DEFAULT_ASSET_ART_BY_ID = {
  proposito: '/assets/life-areas/purpose.webp',
  relacoes: '/assets/life-areas/relationships.webp',
  trabalho: '/assets/life-areas/work-study.webp',
  lazer: '/assets/life-areas/leisure.webp',
  saude: '/assets/life-areas/health.webp',
} as const;

/** A arte de fundo daquela area — uma por ativo, ligada desde sempre. */
export const getAssetArt = (assetId: string): string | undefined =>
  DEFAULT_ASSET_ART_BY_ID[assetId as keyof typeof DEFAULT_ASSET_ART_BY_ID];

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
  proposito: ['✨', '🧭', '🕯️', '🙏', '🧘', '📖', '📿', '🌅', '🌙', '🌌', '🍃', '⛰️', '⭐', '🤍', '☯️', '📓', '🕊️', '🔭', '🗺️', '🛤️', '🏔️', '🌠', '☀️', '🪷', '🧎', '⛪', '🕌', '🛕', '🕍', '✝️', '☪️', '✡️', '🕉️', '☸️', '🛐', '📝', '💭', '💡', '🎯', '🧩', '📜', '🔥', '🪶', '🌱', '🌍', '🧠', '🫶'],
  relacoes: ['🤝', '🫂', '❤️', '👨\u200d👩\u200d👧', '📞', '💬', '☕', '🍻', '🎉', '🎁', '🐕', '🐈', '👶', '🏡', '🎂', '🚗', '✉️', '⚽', '🎵', '🏘️', '👪', '👥', '🧑\u200d🤝\u200d🧑', '👫', '👬', '👭', '💑', '💍', '💒', '🍼', '🧸', '🐾', '🐶', '🐱', '🍽️', '🥂', '🫖', '🧉', '🧺', '🎈', '🎊', '🥳', '🗣️', '👂', '🤲', '🤗', '💌', '🫶', '🌹', '🚶'],
  trabalho: ['💼', '💻', '📊', '📈', '🗓️', '✉️', '📝', '📚', '🎓', '🧠', '🛠️', '🏢', '🧾', '📁', '✍️', '🔬', '🎤', '🖥️', '⌨️', '🖱️', '🖨️', '📱', '📐', '📏', '✏️', '🖊️', '🖌️', '🧮', '📋', '📌', '📎', '🗂️', '🗃️', '🗄️', '📰', '📑', '📕', '📗', '📘', '📙', '🧑\u200d🏫', '🧑\u200d💻', '🧑\u200d🔬', '🧑\u200d🔧', '🧑\u200d🍳', '🩺', '⚖️', '💰', '💳', '🏦', '📦', '🏗️', '⚙️', '🔍', '🧪', '🧬', '🌐', '🎥', '🎙️'],
  lazer: ['🎨', '🎮', '🎬', '🎵', '🎸', '📷', '✈️', '🏖️', '🌳', '🍳', '📖', '🎲', '🎧', '🕺', '🎣', '🛹', '🧩', '⚽', '🏀', '🏐', '🏈', '⚾', '🎾', '🏸', '🏓', '🎱', '🎳', '🥏', '⛳', '♟️', '🀄', '🃏', '🎯', '🎰', '🎡', '🎢', '🎪', '🎭', '🎤', '🎙️', '🎼', '🎶', '🎹', '🥁', '🪘', '🎷', '🎺', '🎻', '🪈', '🪕', '🪗', '📻', '💿', '📺', '🍿', '🎞️', '🎟️', '🖼️', '🧶', '🧵', '🪡', '🏕️', '🏔️', '🛶', '⛵', '🚲', '🏄', '🏂', '⛷️', '🧗', '🛼', '🐚', '🪁', '🧑\u200d🎨'],
  saude: ['🏃', '💪', '🏋️', '🚴', '🏊', '🧘', '🥗', '💧', '😴', '🩺', '💊', '🦷', '👟', '🚶', '🫀', '🥤', '🧴', '⚽', '🏀', '🏐', '🎾', '🏸', '🏓', '🥊', '🥋', '🤸', '🤾', '🤽', '🏄', '🧗', '⛹️', '🏌️', '🛼', '🛹', '🏂', '⛷️', '🦵', '🦶', '🦴', '🫁', '🧠', '🧑\u200d⚕️', '🏥', '🩹', '🩻', '🩼', '🩸', '💉', '🌡️', '🧼', '🛁', '🪥', '🛌', '🥦', '🥕', '🥑', '🍎', '🍌', '🍓', '🥚', '🐟', '🥜', '🥛', '🍵', '🧘\u200d♀️', '🚭'],
} as const;

/** O que nao e area da vida: casa, contas, mercado, carro, bicho, conserto. */
const OUTROS_ICONS = ['🚿', '🧽', '🧻', '🪣', '🛏️', '🛋️', '🪑', '🚪', '🪟', '🔋', '🔌', '💡', '🧯', '📬', '📨', '📅', '⏰', '🚕', '🚌', '🚇', '🚆', '🛵', '🏍️', '🛫', '🧳', '🛂', '🪪', '📄', '💵', '🪙', '🧰', '🪛', '🔨', '🪚', '🧱', '🌻', '🌾', '💐', '🏠', '🧹', '🧺', '🛒', '🚗', '🔑', '🧾', '📦', '🔧', '💡', '🪴', '🗑️', '⛽', '🏦', '📮', '✅', '📌'] as const;

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
 * criada. O acervo fica em AREA_ICONS; as areas
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
    icons: [...new Set(config.icons)],
  })),
];

/** Additional backgrounds retain the original and use each area's palette. */
export const ASSET_BACKGROUND_VARIANTS: Record<string, { id: string; name: string; value: string; accessTier: 'base' }[]> = {
    proposito: [
        { id: 'purpose-dawn', name: 'Horizonte azul', value: '/assets/life-areas/purpose-dawn.webp', accessTier: 'base' },
        { id: 'purpose-library', name: 'Refúgio de reflexão', value: '/assets/life-areas/purpose-library.webp', accessTier: 'base' },
    ],
    relacoes: [
        { id: 'relationships-table', name: 'À mesa juntos', value: '/assets/life-areas/relationships-table.webp', accessTier: 'base' },
        { id: 'relationships-path', name: 'Caminho compartilhado', value: '/assets/life-areas/relationships-path.webp', accessTier: 'base' },
    ],
    trabalho: [
        { id: 'work-workshop', name: 'Oficina criativa', value: '/assets/life-areas/work-workshop.webp', accessTier: 'base' },
        { id: 'work-library', name: 'Tempo de estudo', value: '/assets/life-areas/work-library.webp', accessTier: 'base' },
    ],
    lazer: [
        { id: 'leisure-music', name: 'Sala de música', value: '/assets/life-areas/leisure-music.webp', accessTier: 'base' },
        { id: 'leisure-coast', name: 'Pausa à beira-mar', value: '/assets/life-areas/leisure-coast.webp', accessTier: 'base' },
    ],
    saude: [
        { id: 'health-court', name: 'Pista de movimento', value: '/assets/life-areas/health-court.webp', accessTier: 'base' },
        { id: 'health-kitchen', name: 'Cozinha vital', value: '/assets/life-areas/health-kitchen.webp', accessTier: 'base' },
    ],
};
