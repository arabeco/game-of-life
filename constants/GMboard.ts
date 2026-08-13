import { LevelUnlocks, SovereignConfig, ItemRarity, UnlockCategory, Asset, Skin, Mood, ChestType } from '../types';
import { ITEMS_DB, getCatalogItemsByCategory, getCatalogItems, isItemCatalogVisible, isRankRewardItem } from './items';
import { ACTIVE_SEASON_ID, GM_SEASONS, GM_SEASON_MISSIONS, GM_SEASON_QUESTS, SEASONS } from './seasonContent';
import { LIFE_AREAS } from './lifeAreas';
import { CATALOG_AVATAR_ROOT } from './catalogAssets';

// ==========================================
// CONFIGURAÇÃO DO JOGO (GM BOARD)
// ==========================================

export const MAX_CLAN_MEMBERS = 10;

// --- COSMÉTICOS (SOVEREIGN ASSETS) ---
// Atualizado com o link do Supabase fornecido
const AVATAR_BASE_URL = CATALOG_AVATAR_ROOT;

export const SKIN_TONES = ['#FBE5D5', '#F3C7AC', '#E2A984', '#C68642', '#8D5524', '#613817'] as const;

export const HAIR_COLORS = [
    { id: '1', label: 'Tipo 1', hex: '#2C1608' },
    { id: '2', label: 'Tipo 2', hex: '#000000' },
    { id: '3', label: 'Tipo 3', hex: '#E6BE8A' },
    { id: '4', label: 'Tipo 4', hex: '#8D4004' },
    { id: '5', label: 'Tipo 5', hex: '#FFFFFF' },
    { id: '6', label: 'Tipo 6', hex: '#FFC0CB' },
];

export const BODY_STYLES = [
  { id: 'body_masc_1', name: 'Masculino 1', url: `${AVATAR_BASE_URL}/body_masc_1.png` },
  { id: 'body_masc_2', name: 'Masculino 2', url: `${AVATAR_BASE_URL}/body_masc_2.png` },
  { id: 'body_masc_3', name: 'Masculino 3', url: `${AVATAR_BASE_URL}/body_masc_3.png` },
  { id: 'body_fem_1', name: 'Feminino 1', url: `${AVATAR_BASE_URL}/body_fem_1.png` },
  { id: 'body_fem_2', name: 'Feminino 2', url: `${AVATAR_BASE_URL}/body_fem_2.png` },
  { id: 'body_fem_3', name: 'Feminino 3', url: `${AVATAR_BASE_URL}/body_fem_3.png` },
];

export const FACE_FEATURES_URL = ``;

export const SOVEREIGN_ASSETS = {
  bodyStyles: BODY_STYLES,
  skinTones: SKIN_TONES,
  hairColors: HAIR_COLORS,
  hairStyles: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    ...ITEMS_DB.filter(i => i.category === 'hair').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  outfits: [
    { id: 'none', name: 'Nenhuma', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('skin').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  artifacts: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('artifact').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  glyphs: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('glyph').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  plates: [
    { id: 'none', name: 'Nenhuma', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('plate').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  auras: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('aura').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
  orbs: [
    { id: 'none', name: 'Nenhum', url: '', rarity: 'common' as ItemRarity },
    ...getCatalogItemsByCategory('orb').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
  ],
};

export const DEFAULT_SOVEREIGN_CONFIG: SovereignConfig = {
    body: 'body_masc_1', skinTone: '#FBE5D5', hairStyle: 'none', hairColor: '#2C1608',
    outfit: 'none', artifact: 'none',
    glyph: 'none', aura: 'none', orb: 'none',
    sovereignPlate: 'none', artifactPlate: 'none', glyphPlate: 'none'
};

export const getItemCategory = (itemId: string): UnlockCategory | null => {
  if (SOVEREIGN_ASSETS.bodyStyles.some(i => i.id === itemId)) return 'bodyStyles';
  if (SOVEREIGN_ASSETS.hairStyles.some(i => i.id === itemId)) return 'hairStyles';
  if (SOVEREIGN_ASSETS.outfits.some(i => i.id === itemId)) return 'outfits';
  if (SOVEREIGN_ASSETS.artifacts.some(i => i.id === itemId)) return 'artifacts';
  if (SOVEREIGN_ASSETS.glyphs.some(i => i.id === itemId)) return 'glyphs';
  if (SOVEREIGN_ASSETS.plates.some(i => i.id === itemId)) return 'plates';
  if (SOVEREIGN_ASSETS.auras.some(i => i.id === itemId)) return 'auras';
  if (SOVEREIGN_ASSETS.orbs.some(i => i.id === itemId)) return 'orbs';
  return null;
};

const buildUnlockMap = (items: { id: string }[]) => items.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {} as Record<string, number>);

export const buildDefaultLevelUnlocks = (): LevelUnlocks => ({
  bodyStyles: buildUnlockMap(SOVEREIGN_ASSETS.bodyStyles),
  hairStyles: buildUnlockMap(SOVEREIGN_ASSETS.hairStyles),
  outfits: buildUnlockMap(SOVEREIGN_ASSETS.outfits),
  artifacts: buildUnlockMap(SOVEREIGN_ASSETS.artifacts),
  glyphs: buildUnlockMap(SOVEREIGN_ASSETS.glyphs),
  codexes: {},
  skins: {},
  borders: {},
  banners: {},
  auras: buildUnlockMap(SOVEREIGN_ASSETS.auras),
  orbs: buildUnlockMap(SOVEREIGN_ASSETS.orbs),
  plates: buildUnlockMap(SOVEREIGN_ASSETS.plates),
  ornament: {},
  insignias: {},
  ui_skins: {},
});

// --- GM CONFIG & MASTERY ---

export const GM_CONFIG = {
  seasons: GM_SEASONS,
  seasonMissions: GM_SEASON_MISSIONS,
  seasonQuests: GM_SEASON_QUESTS,
  chestDrops: {
    itemDropChanceByChest: { Comum: 0.005, Raro: 0.01, Épico: 0.02, Lendário: 0.03 } as Partial<Record<ChestType, number>>,
    skinDropChanceByChest: { Comum: 0.005, Raro: 0.02, Épico: 0.05, Lendário: 0.1 } as Partial<Record<ChestType, number>>,
    itemPool: { categories: ['bodyStyles', 'outfits', 'artifacts', 'glyphs', 'auras', 'orbs'] as UnlockCategory[], excludeIds: ['none'] },
  },
  cosmetics: {
    skins: [
      ...getCatalogItemsByCategory('ui_skin').map(i => {
          let color = '#ffffff';
          if (i.id === 'BASIC') color = '#ffffff';
          if (i.id === 'GOLD') color = '#FFD700';
          if (i.id === 'FROST') color = '#00FFFF';
          if (i.id === 'EMBER') color = '#FF4500';
          if (i.id === 'CYBER') color = '#00FF00';
          if (i.id === 'AURORA') color = '#9400D3';
          if (i.id === 'VOID') color = '#4B0082';
          return { id: i.id, name: i.name, color, rarity: i.rarity };
      }),
    ] as Skin[],
    borders: [
      ...getCatalogItemsByCategory('border').map(i => ({ id: i.id, name: i.name, color: '#ffffff', imageUrl: i.imageUrl || '', rarity: i.rarity })),
    ] as Skin[],
    banners: [
      ...getCatalogItemsByCategory('banner').map(i => ({ id: i.id, name: i.name, url: i.imageUrl || '', rarity: i.rarity })),
    ],
  },
  unlocks: {
    itemUnlockBasis: 'nobility' as 'level' | 'nobility',
  },
  goldenInvites: { 
    codePrefix: 'ouro', 
    seedCount: 5, 
    seedCodes: [], 
    multiUseCodes: [] 
  },
};

export const SKINS_DATA: Skin[] = GM_CONFIG.cosmetics.skins;
export const BORDERS_DATA: Skin[] = GM_CONFIG.cosmetics.borders;
export const BANNERS_DATA = GM_CONFIG.cosmetics.banners;

export const SKIN_UNLOCKS_BY_RANK: Record<string, string[]> = { vagante: ['FROST'], escudeiro: ['CYBER'], cavaleiro: ['EMBER'], lorde: ['AURORA'] };
export const BORDER_UNLOCKS_BY_RANK: Record<string, string[]> = { 
    escudeiro: getCatalogItems(item => item.category === 'border' && item.tier === 1 && isRankRewardItem(item)).map(i => i.id),
    cavaleiro: getCatalogItems(item => item.category === 'border' && item.tier === 2 && isRankRewardItem(item)).map(i => i.id),
    lorde: getCatalogItems(item => item.category === 'border' && item.tier === 3 && isRankRewardItem(item)).map(i => i.id),
    barao: getCatalogItems(item => item.category === 'border' && item.tier === 4 && isRankRewardItem(item)).map(i => i.id),
    soberano: getCatalogItems(item => item.category === 'border' && item.tier === 5 && isRankRewardItem(item)).map(i => i.id)
};
export const BANNER_UNLOCKS_BY_RANK: Record<string, string[]> = { 
    escudeiro: getCatalogItems(item => item.category === 'banner' && item.tier === 1 && isRankRewardItem(item)).map(i => i.id),
    cavaleiro: getCatalogItems(item => item.category === 'banner' && item.tier === 2 && isRankRewardItem(item)).map(i => i.id),
    lorde: getCatalogItems(item => item.category === 'banner' && item.tier === 3 && isRankRewardItem(item)).map(i => i.id),
    barao: getCatalogItems(item => item.category === 'banner' && item.tier === 4 && isRankRewardItem(item)).map(i => i.id),
    soberano: getCatalogItems(item => item.category === 'banner' && item.tier === 5 && isRankRewardItem(item)).map(i => i.id)
};
export const SKIN_SEASON_UNLOCKS: Record<string, string[]> = { GOLD: ['sm_3'] };
export const SKIN_CHEST_POOL = ['VOID'].filter(id => isItemCatalogVisible(id));

export const SANCTUARY_BACKGROUND_OPTIONS = [
  { id: 'garden', name: 'Jardim', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/land1.jpg' },
  { id: 'territory-1', name: 'Territorio I', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/land01.jpg' },
  { id: 'territory-2', name: 'Territorio II', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/land02.jpg' },
  { id: 'territory-3', name: 'Territorio III', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/land03.jpg' },
  { id: 'territory-4', name: 'Territorio IV', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/land04.jpg' },
  { id: 'territory-5', name: 'Territorio V', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/land05.jpg' },
  { id: 'garden-aurora', name: 'Jardim Aurora', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/gardenaurora.jpg' },
  { id: 'garden-cyber', name: 'Jardim Cyber', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/gardencyber.jpg' },
  { id: 'garden-ember', name: 'Jardim Ember', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/gardenember.jpg' },
  { id: 'garden-frost', name: 'Jardim Frost', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/gardenfrost.jpg' },
  { id: 'office-1', name: 'Escritorio I', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office1.jpg' },
];
export const DEFAULT_SANCTUARY_BACKGROUND = SANCTUARY_BACKGROUND_OPTIONS[0].value;

export const MOODS_DATA: Mood[] = [
    { label: "Vergonha", min: 0, max: 5, color: "linear-gradient(90deg, #6b1e1e, #8b2b2b)", trackStart: "#6b1e1e", trackEnd: "#8b2b2b" },
    { label: "Culpa", min: 5, max: 10, color: "linear-gradient(90deg, #8b3b1e, #a24a22)", trackStart: "#8b3b1e", trackEnd: "#a24a22" },
    { label: "Apatia", min: 10, max: 15, color: "linear-gradient(90deg, #b35a1e, #c46a22)", trackStart: "#b35a1e", trackEnd: "#c46a22" },
    { label: "Tristeza", min: 15, max: 20, color: "linear-gradient(90deg, #d47a1e, #e28b2a)", trackStart: "#d47a1e", trackEnd: "#e28b2a" },
    { label: "Medo", min: 20, max: 25, color: "linear-gradient(90deg, #e2a43a, #f0b84a)", trackStart: "#e2a43a", trackEnd: "#f0b84a" },
    { label: "Desejo", min: 25, max: 30, color: "linear-gradient(90deg, #e6c14a, #f0d35a)", trackStart: "#e6c14a", trackEnd: "#f0d35a" },
    { label: "Raiva", min: 30, max: 35, color: "linear-gradient(90deg, #d48a2a, #e49c3a)", trackStart: "#d48a2a", trackEnd: "#e49c3a" },
    { label: "Orgulho", min: 35, max: 45, color: "linear-gradient(90deg, #c6b83a, #d8cf4a)", trackStart: "#c6b83a", trackEnd: "#d8cf4a" },
    { label: "Coragem", min: 45, max: 55, color: "linear-gradient(90deg, #8fcf3a, #a6e34a)", trackStart: "#8fcf3a", trackEnd: "#a6e34a" },
    { label: "Neutralidade", min: 55, max: 60, color: "linear-gradient(90deg, #4fbf6a, #62d07a)", trackStart: "#4fbf6a", trackEnd: "#62d07a" },
    { label: "Disposição", min: 60, max: 65, color: "linear-gradient(90deg, #3dbf8a, #50d09c)", trackStart: "#3dbf8a", trackEnd: "#50d09c" },
    { label: "Aceitação", min: 65, max: 70, color: "linear-gradient(90deg, #2bb3b3, #3ac6c6)", trackStart: "#2bb3b3", trackEnd: "#3ac6c6" },
    { label: "Razão", min: 70, max: 75, color: "linear-gradient(90deg, #2a7bd4, #3a93e6)", trackStart: "#2a7bd4", trackEnd: "#3a93e6" },
    { label: "Amor", min: 75, max: 85, color: "linear-gradient(90deg, #3c5bff, #5a79ff)", trackStart: "#3c5bff", trackEnd: "#5a79ff" },
    { label: "Alegria", min: 85, max: 90, color: "linear-gradient(90deg, #6a3dff, #8a5bff)", trackStart: "#6a3dff", trackEnd: "#8a5bff" },
    { label: "Paz", min: 90, max: 95, color: "linear-gradient(90deg, #7a2fd1, #943de0)", trackStart: "#7a2fd1", trackEnd: "#943de0" },
    { label: "Iluminação", min: 95, max: 101, color: "linear-gradient(90deg, #b227b5, #d06ad8)", trackStart: "#b227b5", trackEnd: "#d06ad8" },
];

export const MASTERY_LEVEL_DESCRIPTIONS: Record<string, string[]> = Object.fromEntries([
  ...LIFE_AREAS.map((area) => [area.id, Array.from(area.levelDescriptions)]),
  ['geral', []],
]) as Record<string, string[]>;

export const ASSETS_DATA: Asset[] = [
  ...LIFE_AREAS.map<Asset>((area) => ({
    id: area.id,
    name: area.name,
    level: 0,
    levelDescriptions: MASTERY_LEVEL_DESCRIPTIONS[area.id].reduce(
      (acc, description, index) => ({ ...acc, [index + 1]: description }),
      {} as Record<number, string>,
    ),
    arenas: [],
    slots: [{
      id: area.widget.id,
      label: area.widget.label,
      type: 1 as const,
      inputType: 'wheelpick' as const,
      options: [...area.widget.options],
      value: 'Não definido',
    }],
  })),
  {
    id: 'geral',
    name: 'GERAL',
    level: 0,
    levelDescriptions: {},
    arenas: [
      { id: 'arena_outros', assetId: 'geral', name: 'Outros', description: 'Arena para ações gerais não categorizadas.', icon: '🗂️', actionIds: [] },
    ],
    slots: [],
  },
];
