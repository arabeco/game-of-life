import { ItemRarity } from '../types';
import { ACTIVE_GOLD_ITEM_PRICE_BY_ID, GOLD_BOOST_PRODUCTS, GOLD_PACK_CATALOG } from './goldCatalog';
import { PRODUCT_FEATURES } from './featureFlags';
import { CATALOG_ASSET_ROOT, CATALOG_AVATAR_ROOT, CATALOG_GLYPH_ROOT, CATALOG_INTERFACE_ROOT } from './catalogAssets';

export type ItemCategory = 'skin' | 'hair' | 'border' | 'banner' | 'glyph' | 'aura' | 'ui_skin' | 'artifact' | 'orb' | 'plate' | 'chest' | 'insignia' | 'insignias';
export type ItemSeasonSlot = 'skin' | 'border' | 'banner' | 'glyph' | 'orb' | 'plate' | 'insignia' | 'ui_skin';

export interface SeasonCollectionDef {
    id: string;
    name: string;
    retired?: boolean;
    premiumLegacy?: boolean;
    storeMode?: 'seasonal_high';
    slots: Record<ItemSeasonSlot, string | null>;
}

export interface ItemDef {
    id: string;
    name: string;
    category: ItemCategory;
    /** 1 a 5 e a escada normal. 6 e Mitico: so temporada, so o bau Mitico. */
    tier: 1 | 2 | 3 | 4 | 5 | 6;
    rarity: ItemRarity;
    icon?: string; // Emoji
    imageUrl?: string; // JPG/PNG URL
    description?: string;
    costGold?: number; // If purchasable in gold store
    isGoldExclusive?: boolean;
    isSeasonExclusive?: boolean;
    isRankExclusive?: boolean; // Items unlocked ONLY via Nobility Rank - blocked from chests and store
    isPremiumOnly?: boolean; // Items given ONLY via Premium Pack - blocked from chests
    isChestExclusive?: boolean; // Items unlocked ONLY via chests - blocked from store/forge
    isLegacyRetired?: boolean; // Legacy collectible: existing owners keep it, but it no longer enters acquisition flows
    isGmExclusive?: boolean; // Hidden from public acquisition flows; reserved for GM/admin use
    isQuestExclusive?: boolean; // Items granted ONLY via quests/season missions
    isReportExclusive?: boolean; // Items granted ONLY via cycle reports
    seasonKey?: string; // Seasonal collection bucket, ex: aurora_1_2026
    seasonSlot?: ItemSeasonSlot; // Slot inside the seasonal collection
}

const BASE_URL = CATALOG_AVATAR_ROOT;
const GLYPHS_BASE_URL = CATALOG_GLYPH_ROOT;
const INTERFACE_BASE_URL = CATALOG_INTERFACE_ROOT;
const ROOT_IMAGES_URL = CATALOG_ASSET_ROOT;

type CatalogItemInput = Omit<ItemDef, 'category'>;
type AssetBackedItemInput = Omit<ItemDef, 'category' | 'imageUrl'> & { asset?: string };

const catalogItem = <TCategory extends ItemCategory>(category: TCategory, item: CatalogItemInput): ItemDef => ({
    category,
    ...item,
});

const assetItem = <TCategory extends ItemCategory>(
    category: TCategory,
    baseUrl: string,
    { asset, ...item }: AssetBackedItemInput,
): ItemDef => catalogItem(category, {
    ...item,
    imageUrl: asset ? `${baseUrl}/${asset}` : undefined,
});

export const avatarAsset = (filename: string): string => `${BASE_URL}/${filename}`;
export const avatarPngAsset = (basename: string): string => avatarAsset(`${basename}.png`);
export const glyphAsset = (filename: string): string => `${GLYPHS_BASE_URL}/${filename}`;
export const interfaceAsset = (filename: string): string => `${INTERFACE_BASE_URL}/${filename}`;
export const rootImageAsset = (filename: string): string => `${ROOT_IMAGES_URL}/${filename}`;

const avatarItem = <TCategory extends Extract<ItemCategory, 'skin' | 'artifact'>>(category: TCategory, item: AssetBackedItemInput): ItemDef =>
    assetItem(category, BASE_URL, item);

const glyphCatalogItem = <TCategory extends Extract<ItemCategory, 'glyph' | 'aura' | 'orb' | 'plate'>>(category: TCategory, item: AssetBackedItemInput): ItemDef =>
    assetItem(category, GLYPHS_BASE_URL, item);

const interfaceCatalogItem = <TCategory extends Extract<ItemCategory, 'border' | 'banner'>>(category: TCategory, item: AssetBackedItemInput): ItemDef =>
    assetItem(category, INTERFACE_BASE_URL, item);

const themeCatalogItem = (item: AssetBackedItemInput): ItemDef =>
    assetItem('ui_skin', ROOT_IMAGES_URL, item);

// Para criar item novo:
// 1. use o builder da categoria (`avatarItem`, `glyphCatalogItem`, `interfaceCatalogItem`, `themeCatalogItem` ou `catalogItem`)
// 2. se houver PNG/JPG, passe `asset: 'NOME_DO_ARQUIVO.png'`
// 3. se a categoria exige PNG e `asset` ficar vazio, o item entra automaticamente como pendencia de arte
// 4. `ui_skin` pode continuar so com emoji, sem asset
//
// Templates rapidos:
//
// avatarItem('skin', {
//     id: 'item_skin_x_001',
//     name: 'Meu Visual',
//     tier: 3,
//     rarity: 'rare',
//     icon: '🧥',
//     asset: 'SKIN_X_MEU_VISUAL.png',
// });
//
// glyphCatalogItem('aura', {
//     id: 'item_aura_x_001',
//     name: 'Minha Aura',
//     tier: 2,
//     rarity: 'uncommon',
//     icon: '✨',
//     asset: 'AURA_X_MINHA_AURA.png',
// });
//
// interfaceCatalogItem('border', {
//     id: 'item_border_x_001',
//     name: 'Minha Borda',
//     tier: 1,
//     rarity: 'common',
//     icon: '🛡️',
//     asset: 'borders/minha_borda.png',
// });
//
// catalogItem('border', {
//     id: 'item_border_x_sem_png',
//     name: 'Minha Borda sem Arte',
//     tier: 1,
//     rarity: 'common',
//     icon: '🛡️',
// });
//
// themeCatalogItem({
//     id: 'SOLAR',
//     name: 'Tema: Solar',
//     tier: 4,
//     rarity: 'epic',
//     icon: '☀️',
//     asset: 'solar.jpg',
// });

export const ITEMS_DB: ItemDef[] = [
    // --- SKINS ---
    // T1 (Comum)
    { id: 'item_skin_1_001', name: 'Náufrago', category: 'skin', tier: 1, rarity: 'common', icon: '🧥', imageUrl: avatarPngAsset('SKIN_T1_NAUFRAGO'), description: "Trajes desgastados pelo tempo e pelo mar. Ideal para quem está começando sua jornada do zero.", isRankExclusive: true },
    { id: 'item_skin_1_002', name: 'Casual', category: 'skin', tier: 1, rarity: 'common', icon: '👕', imageUrl: avatarPngAsset('SKIN_T1_CASUAL'), description: "Roupas confortáveis para o dia a dia. Nada de especial, mas cumpre o papel.", isRankExclusive: true },
    { id: 'item_skin_1_003', name: 'Gym Rat', category: 'skin', tier: 1, rarity: 'common', icon: '🏋️', imageUrl: avatarPngAsset('SKIN_T1_GYM_RAT'), description: "Focado no treino e na disciplina física. O suor é o seu melhor acessório.", costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_1_003 },
    { id: 'item_skin_1_004', name: 'Street', category: 'skin', tier: 1, rarity: 'common', icon: '🧢', imageUrl: avatarPngAsset('SKIN_T1_STREET'), description: "Estilo urbano para quem domina as ruas e o asfalto.", isRankExclusive: true },
    { id: 'item_skin_1_005', name: 'Caçador', category: 'skin', tier: 1, rarity: 'common', icon: '\uD83C\uDFF9', imageUrl: avatarPngAsset('SKIN_T1_CACADOR'), description: 'Traje leve de exploração para quem atravessa terreno aberto com discrição.', isRankExclusive: true },
    { id: 'item_skin_1_006', name: 'Casual 2', category: 'skin', tier: 1, rarity: 'common', icon: '\uD83E\uDDE5', imageUrl: avatarPngAsset('SKIN_T1_CASUAL_2'), description: 'Variação casual mais limpa e moderna para o dia a dia do soberano.', isRankExclusive: true },
    // T2 (Incomum)
    { id: 'item_skin_2_001', name: 'Executivo', category: 'skin', tier: 2, rarity: 'uncommon', icon: '💼', imageUrl: avatarPngAsset('SKIN_T2_EXECUTIVO'), isRankExclusive: true },
    { id: 'item_skin_2_002', name: 'Tático', category: 'skin', tier: 2, rarity: 'uncommon', icon: '🎖️', imageUrl: avatarPngAsset('SKIN_T2_TATICO'), isRankExclusive: true },
    { id: 'item_skin_2_003', name: 'Acadêmico', category: 'skin', tier: 2, rarity: 'uncommon', icon: '🎓', imageUrl: avatarPngAsset('SKIN_T2_ACADEMICO'), costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_2_003 },
    { id: 'item_skin_2_004', name: 'Militar', category: 'skin', tier: 2, rarity: 'uncommon', icon: '\uD83E\uDE96', imageUrl: avatarPngAsset('SKIN_T2_MILITAR'), description: 'Uniforme tático de campo para presença firme e disciplinada.', isRankExclusive: true },
    // T3 (Raro)
    { id: 'item_skin_3_001', name: 'Nômade', category: 'skin', tier: 3, rarity: 'rare', icon: '🧭', imageUrl: avatarPngAsset('SKIN_T3_NOMADE'), costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_3_001 },
    { id: 'item_skin_3_002', name: 'Alquimista', category: 'skin', tier: 3, rarity: 'rare', icon: '⚗️', imageUrl: avatarPngAsset('SKIN_T3_ALQUIMISTA'), costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_3_002 },
    { id: 'item_skin_3_003', name: 'Híbrido', category: 'skin', tier: 3, rarity: 'rare', icon: '🧬', imageUrl: avatarPngAsset('SKIN_T3_HIBRIDO'), costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_3_003 },
    // T4 (Épico)
    { id: 'item_skin_4_001', name: 'Armadura Placa', category: 'skin', tier: 4, rarity: 'epic', icon: '🛡️', imageUrl: avatarPngAsset('SKIN_T4_ARMADURA_PLACA'), costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_4_001 },
    { id: 'item_skin_4_002', name: 'Mago Círculo', category: 'skin', tier: 4, rarity: 'epic', icon: '🧙', imageUrl: avatarPngAsset('SKIN_T4_MAGO_CIRCULO'), isRankExclusive: true },
    // T5 (Lendário)
    catalogItem('skin', { id: 'item_skin_5_001', name: 'Entidade de Luz', tier: 5, rarity: 'legendary', icon: '✨', isRankExclusive: true }),
    avatarItem('skin', { id: 'item_skin_5_002', name: 'Vestido Real', tier: 5, rarity: 'legendary', icon: '\uD83D\uDC57', asset: 'SKIN_T5_VESTIDO_REAL.png', isChestExclusive: true, description: 'Traje lendário reservado aos baús mais raros do inventário.' }),

    // Season
    { id: 'item_skin_season_001', name: 'O Criador', category: 'skin', tier: 4, rarity: 'epic', icon: '🛠️', isGmExclusive: true, imageUrl: avatarPngAsset('SKIN_SEASON_CRIADOR') },
    { id: 'item_skin_aurora_1_2026', name: 'Guardião Aurora', category: 'skin', tier: 6, rarity: 'mythic', icon: '\uD83C\uDF0C', imageUrl: avatarPngAsset('SKIN_QUEST_GUARDIAO_AURORA'), isQuestExclusive: true, isSeasonExclusive: true, seasonKey: 'aurora_1_2026', seasonSlot: 'skin' },

    // --- ARTIFACTS (Ferramentas, Armas, Relíquias, Companions) ---
    // T1
    { id: 'item_artifact_1_001', name: 'Adaga Aprendiz', category: 'artifact', tier: 1, rarity: 'common', icon: '🗡️', imageUrl: avatarPngAsset('artefato_t1_adagaaprendiz') },
    { id: 'item_artifact_1_002', name: 'Cachorro Beagle', category: 'artifact', tier: 1, rarity: 'common', icon: '🐶', imageUrl: avatarPngAsset('artefato_t1_cachorrobeagle') },
    { id: 'item_artifact_1_003', name: 'Gato Laranja', category: 'artifact', tier: 1, rarity: 'common', icon: '🐱', imageUrl: avatarPngAsset('artefato_t1_gatolaranja') },
    { id: 'item_artifact_1_004', name: 'Halteres', category: 'artifact', tier: 1, rarity: 'common', icon: '🏋️', imageUrl: avatarPngAsset('artefato_t1_halterespar') },
    { id: 'item_artifact_1_005', name: 'Trio Café', category: 'artifact', tier: 1, rarity: 'common', icon: '☕', imageUrl: avatarPngAsset('artefato_t1_triocafe'), isRankExclusive: true },
    { id: 'item_garden_stone_1', name: 'Pedra Serena', category: 'artifact', tier: 1, rarity: 'common', icon: '\u{1FAA8}', imageUrl: avatarPngAsset('JARDIM_PEDRA_SERENA'), description: 'Pedra basica para iniciar o Jardim Zen.' },
    { id: 'item_garden_plant_1', name: 'Musgo Vivo', category: 'artifact', tier: 1, rarity: 'common', icon: '\u{1FAB4}', imageUrl: avatarPngAsset('JARDIM_MUSGO_VIVO'), description: 'Planta basica para iniciar o Jardim Zen.' },
    { id: 'item_garden_tool_1', name: 'Garfo de Areia', category: 'artifact', tier: 1, rarity: 'common', icon: '\u{1F9F9}', imageUrl: avatarPngAsset('JARDIM_GARFO_3_DENTES'), description: 'Ferramenta decorativa para compor o Jardim Zen.' },
    // T2
    { id: 'item_artifact_2_001', name: 'Cachorro Husky', category: 'artifact', tier: 2, rarity: 'uncommon', icon: '🐺', imageUrl: avatarPngAsset('artefato_t2_cachorrohusky') },
    { id: 'item_artifact_2_002', name: 'Gato Siamês', category: 'artifact', tier: 2, rarity: 'uncommon', icon: '🐈', imageUrl: avatarPngAsset('artefato_t2_gatosiames') },
    { id: 'item_artifact_2_003', name: 'Setup', category: 'artifact', tier: 2, rarity: 'uncommon', icon: '💻', imageUrl: avatarPngAsset('artefato_t2_setup'), isRankExclusive: true },
    { id: 'item_garden_stone_2', name: 'Pedra Lunar', category: 'artifact', tier: 2, rarity: 'uncommon', icon: '\u{1FAA8}', imageUrl: avatarPngAsset('JARDIM_PEDRA_LUNAR'), description: 'Pedra clara para composicoes de areia.' },
    { id: 'item_garden_lantern_1', name: 'Lanterna de Pedra', category: 'artifact', tier: 2, rarity: 'uncommon', icon: '\u{1F3EE}', imageUrl: avatarPngAsset('JARDIM_LANTERNA_PEDRA'), description: 'Lanterna ornamental para dar profundidade ao Jardim Zen.' },
    { id: 'item_garden_plant_2', name: 'Bambu Jovem', category: 'artifact', tier: 2, rarity: 'uncommon', icon: '\u{1F38D}', imageUrl: avatarPngAsset('JARDIM_BAMBU_JOVEM'), description: 'Vegetacao vertical para o Jardim Zen.' },
    { id: 'item_garden_stone_3', name: 'Pedra Obsidiana', category: 'artifact', tier: 3, rarity: 'rare', icon: '\u{1FAA8}', imageUrl: avatarPngAsset('JARDIM_PEDRA_OBSIDIANA'), description: 'Pedra escura e mais rara para contraste no Jardim Zen.' },
    { id: 'item_garden_bridge_1', name: 'Ponte de Madeira', category: 'artifact', tier: 2, rarity: 'uncommon', icon: '\u{1F309}', imageUrl: avatarPngAsset('JARDIM_PONTE_MADEIRA'), description: 'Ponte pequena para criar caminho e composicao no Jardim Zen.' },
    { id: 'item_garden_statue_1', name: 'Estatua de Meditacao', category: 'artifact', tier: 3, rarity: 'rare', icon: '\u{1F5FF}', imageUrl: avatarPngAsset('JARDIM_ESTATUA_MEDITACAO'), description: 'Ponto de contemplacao raro para o Jardim Zen.' },
    // T3
    { id: 'item_artifact_3_001', name: 'Cachorro Jack', category: 'artifact', tier: 3, rarity: 'rare', icon: '🐕', imageUrl: avatarPngAsset('artefato_t3_cachorrojack') },
    { id: 'item_artifact_3_002', name: 'Caixa Mágica', category: 'artifact', tier: 3, rarity: 'rare', icon: '🎁', imageUrl: avatarPngAsset('ARTEFATO_T3_caixamagica') },
    { id: 'item_artifact_3_003', name: 'Cetro Esmeralda', category: 'artifact', tier: 3, rarity: 'rare', icon: '💚', imageUrl: avatarAsset('ARTEFATO_T3_cetroesmeralda.png') },
    { id: 'item_artifact_3_004', name: 'Coroa Prata', category: 'artifact', tier: 3, rarity: 'rare', icon: '👑', imageUrl: avatarPngAsset('ARTEFATO_T3_coroaprata') },
    { id: 'item_artifact_3_005', name: 'Divine Scepter', category: 'artifact', tier: 3, rarity: 'rare', icon: '🔱', imageUrl: avatarPngAsset('artefato_t3_DivineScepter') },
    { id: 'item_artifact_3_006', name: 'Espada Runas', category: 'artifact', tier: 3, rarity: 'rare', icon: '⚔️', imageUrl: avatarAsset('ARTEFATO_T3_espadarunas.png') },
    // T4
    { id: 'item_artifact_4_001', name: 'Coroa de Espinhos', category: 'artifact', tier: 4, rarity: 'epic', icon: '🌿', imageUrl: avatarPngAsset('ARTEFATO_T4_COROA_ESPINHOS') },
    { id: 'item_artifact_4_002', name: 'Dragão Bebê', category: 'artifact', tier: 4, rarity: 'epic', icon: '🐉', imageUrl: avatarPngAsset('ARTEFATO_T4_DRAGAO_BEBE'), isRankExclusive: true },
    { id: 'item_artifact_4_003', name: 'Grimório Arcano', category: 'artifact', tier: 4, rarity: 'epic', icon: '📕', imageUrl: avatarPngAsset('ARTEFATO_T4_GRIMORIO_ARCANO') },
    { id: 'item_artifact_4_004', name: 'Manta', category: 'artifact', tier: 4, rarity: 'epic', icon: '🧣', imageUrl: avatarPngAsset('artefato_t4_manta') },
    // T5
    { id: 'item_artifact_5_001', name: 'Fênix Cósmico', category: 'artifact', tier: 5, rarity: 'legendary', icon: '🔥', imageUrl: avatarPngAsset('ARTEFATO_T5_FENIX_COSMICO') },
    { id: 'item_artifact_5_002', name: 'Tesseract', category: 'artifact', tier: 5, rarity: 'legendary', icon: '🔷', imageUrl: avatarPngAsset('ARTEFATO_T5_tessaract') },

    // --- CABELOS ---
    // TIER 1 - Common
    { id: 'cachos', name: 'Cachos', category: 'hair', tier: 1, rarity: 'common', icon: '〰️', isRankExclusive: true },
    { id: 'medio_reto', name: 'Médio Reto', category: 'hair', tier: 1, rarity: 'common', icon: '💇', isRankExclusive: true },

    // TIER 2 - Uncommon
    { id: 'textured_crop', name: 'Texturizado', category: 'hair', tier: 2, rarity: 'uncommon', icon: '✂️', isRankExclusive: true },

    // TIER 3 - Rare
    { id: 'dreads', name: 'Dreads', category: 'hair', tier: 3, rarity: 'rare', icon: '🧶', isRankExclusive: true },
    { id: 'mullet_topete', name: 'Mullet Top', category: 'hair', tier: 3, rarity: 'rare', icon: '💈', isRankExclusive: true },

    // TIER 4 - Epic
    { id: 'anime_spikes', name: 'Anime Spiky', category: 'hair', tier: 4, rarity: 'epic', icon: '⚡', isRankExclusive: true },
    { id: 'princesa', name: 'Princesa', category: 'hair', tier: 4, rarity: 'epic', icon: '👑' },

    // TIER 5 - Legendary
    { id: 'fluxo_espiritual', name: 'Fluxo Espiritual', category: 'hair', tier: 5, rarity: 'legendary', icon: '✨', isRankExclusive: true },

    // --- BORDAS ---
    // T1
    { id: 'item_border_1_001', name: 'Pupilo (Beta)', category: 'border', tier: 1, rarity: 'common', icon: '🔰' },
    { id: 'item_border_1_002', name: 'Disciplinado', category: 'border', tier: 1, rarity: 'common', icon: '📘', imageUrl: `${INTERFACE_BASE_URL}/borda_disciplinado.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_1_002 },
    { id: 'item_border_1_003', name: 'Vanguardista', category: 'border', tier: 1, rarity: 'common', icon: '🚀' },
    { id: 'item_border_1_004', name: 'Rústico', category: 'border', tier: 1, rarity: 'common', icon: '🪵' },
    // Novos T1
    { id: 'item_border_t1_aprendiz', name: 'Aprendiz', category: 'border', tier: 1, rarity: 'common', icon: '🎓', imageUrl: `${INTERFACE_BASE_URL}/borda_t1_aprendiz.png`, isRankExclusive: true },

    // T2
    { id: 'item_border_2_001', name: 'Popular', category: 'border', tier: 2, rarity: 'uncommon', icon: '🌟', imageUrl: `${INTERFACE_BASE_URL}/borda_popular.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_2_001 },
    { id: 'item_border_2_002', name: 'Protetor', category: 'border', tier: 2, rarity: 'uncommon', icon: '🛡️' },
    // Novos T2
    { id: 'item_border_t2_veterano', name: 'Veterano', category: 'border', tier: 2, rarity: 'uncommon', icon: '🎖️', imageUrl: `${INTERFACE_BASE_URL}/borda_t2_veterano.png`, isRankExclusive: true },

    // T3
    { id: 'item_border_3_001', name: 'Imparável', category: 'border', tier: 3, rarity: 'rare', icon: '🚀', imageUrl: `${INTERFACE_BASE_URL}/borda_imparavel.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_3_001 },
    { id: 'item_border_3_002', name: 'Arquétipo', category: 'border', tier: 3, rarity: 'rare', icon: '🧩' },
    // Novos T3
    { id: 'item_border_t3_mistico', name: 'Místico', category: 'border', tier: 3, rarity: 'rare', icon: '🔮', imageUrl: `${INTERFACE_BASE_URL}/borda_t3_mistico.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_t3_mistico },
    { id: 'item_border_t3_transcendente', name: 'Transcendente', category: 'border', tier: 3, rarity: 'rare', icon: '✨', imageUrl: `${INTERFACE_BASE_URL}/borda_t3_transcendente.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_t3_transcendente },
    { id: 'item_border_vanguarda_01', name: 'Borda Vanguarda', category: 'border', tier: 3, rarity: 'rare', icon: '🛡️', imageUrl: `${INTERFACE_BASE_URL}/borda_vanguarda.png`, isRankExclusive: true },

    // T4
    { id: 'item_border_4_001', name: 'Lenda Viva', category: 'border', tier: 4, rarity: 'epic', icon: '🏛️', imageUrl: `${INTERFACE_BASE_URL}/borda_lendaviva.png`, isRankExclusive: true },
    { id: 'item_border_4_002', name: 'Soberano', category: 'border', tier: 4, rarity: 'epic', icon: '👑' },
    // Novos T4
    { id: 'item_border_t4_celestial', name: 'Celestial', category: 'border', tier: 4, rarity: 'epic', icon: '🌙', imageUrl: `${INTERFACE_BASE_URL}/borda_t4_celestial.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_t4_celestial },
    { id: 'item_border_t4_guardia', name: 'Guardiã', category: 'border', tier: 4, rarity: 'epic', icon: '🛡️', imageUrl: `${INTERFACE_BASE_URL}/borda_t4_guardia.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_t4_guardia },
    { id: 'item_border_t4_oraculo', name: 'Oráculo', category: 'border', tier: 4, rarity: 'epic', icon: '👁️', imageUrl: `${INTERFACE_BASE_URL}/borda_t4_oraculo.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_t4_oraculo },

    // T5
    { id: 'item_border_5_001', name: 'GM - Grande Mestre', category: 'border', tier: 5, rarity: 'legendary', icon: '🏛️', imageUrl: `${INTERFACE_BASE_URL}/borda_gm.png`, isGmExclusive: true },
    // Novos T5
    { id: 'item_border_t5_genesis', name: 'Gênesis', category: 'border', tier: 5, rarity: 'legendary', icon: '🌌', imageUrl: `${INTERFACE_BASE_URL}/borda_t5_genesis.png` },
    catalogItem('border', { id: 'item_border_aurora_1_2026', name: 'Aurora I', tier: 6, rarity: 'mythic', icon: '🌠', isSeasonExclusive: true, seasonKey: 'aurora_1_2026', seasonSlot: 'border' }),

    // --- BANNERS ---
    // T1
    { id: 'item_banner_disciplinado', name: 'Disciplinado', category: 'banner', tier: 1, rarity: 'common', icon: '📘', imageUrl: `${INTERFACE_BASE_URL}/banner_disciplinado.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_disciplinado },
    { id: 'item_banner_t1_aprendiz', name: 'Aprendiz', category: 'banner', tier: 1, rarity: 'common', icon: '🎓', imageUrl: `${INTERFACE_BASE_URL}/banner_t1_aprendiz.png`, isRankExclusive: true },

    // T2
    { id: 'item_banner_popular', name: 'Popular', category: 'banner', tier: 2, rarity: 'uncommon', icon: '🌟', imageUrl: `${INTERFACE_BASE_URL}/banner_popular.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_popular },
    { id: 'item_banner_t2_veterano', name: 'Veterano', category: 'banner', tier: 2, rarity: 'uncommon', icon: '🎖️', imageUrl: `${INTERFACE_BASE_URL}/banner_t2_veterano.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t2_veterano },

    // T3
    { id: 'item_banner_imparavel', name: 'Imparável', category: 'banner', tier: 3, rarity: 'rare', icon: '🚀', imageUrl: `${INTERFACE_BASE_URL}/banner_imparavel.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_imparavel },
    { id: 'item_banner_t3_mistico', name: 'Místico', category: 'banner', tier: 3, rarity: 'rare', icon: '🔮', imageUrl: `${INTERFACE_BASE_URL}/banner_t3_mistico.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t3_mistico },
    { id: 'item_banner_vanguarda_01', name: 'Banner Vanguarda', category: 'banner', tier: 3, rarity: 'rare', icon: '🚀', imageUrl: `${INTERFACE_BASE_URL}/banner_vanguarda.png`, isRankExclusive: true },

    // T4
    { id: 'item_banner_lendaviva', name: 'Lenda Viva', category: 'banner', tier: 4, rarity: 'epic', icon: '🏛️', imageUrl: `${INTERFACE_BASE_URL}/banner_lendaviva.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_lendaviva },
    { id: 'item_banner_t4_celestial', name: 'Celestial', category: 'banner', tier: 4, rarity: 'epic', icon: '🌙', imageUrl: `${INTERFACE_BASE_URL}/banner_t4_celestial.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t4_celestial },
    { id: 'item_banner_t4_guardia', name: 'Guardiã', category: 'banner', tier: 4, rarity: 'epic', icon: '🛡️', imageUrl: `${INTERFACE_BASE_URL}/banner_t4_guardia.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t4_guardia },
    { id: 'item_banner_t4_oraculo', name: 'Oráculo', category: 'banner', tier: 4, rarity: 'epic', icon: '👁️', imageUrl: `${INTERFACE_BASE_URL}/banner_t4_oraculo.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t4_oraculo },
    { id: 'item_banner_t4_transcendente', name: 'Transcendente', category: 'banner', tier: 4, rarity: 'epic', icon: '✨', imageUrl: `${INTERFACE_BASE_URL}/banner_t4_transcendente.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t4_transcendente },

    // T5
    { id: 'item_banner_gm', name: 'Grão Mestre', category: 'banner', tier: 5, rarity: 'legendary', icon: '🏛️', imageUrl: `${INTERFACE_BASE_URL}/banner_gm.png`, isGmExclusive: true },
    { id: 'item_banner_t5_genesis', name: 'Gênesis', category: 'banner', tier: 5, rarity: 'legendary', icon: '🌌', imageUrl: `${INTERFACE_BASE_URL}/banner_t5_genesis.png` },
    catalogItem('banner', { id: 'item_banner_aurora_1_2026', name: 'Aurora I', tier: 6, rarity: 'mythic', icon: '🌠', isSeasonExclusive: true, seasonKey: 'aurora_1_2026', seasonSlot: 'banner' }),

    // --- GLIFOS ---
    // T1
    { id: 'item_glyph_1_001', name: 'Tábua Aprendiz', category: 'glyph', tier: 1, rarity: 'common', icon: '🪵', imageUrl: `${GLYPHS_BASE_URL}/MOLDE_T1_TABUA_APRENDIZ.png`, isRankExclusive: true },
    { id: 'item_glyph_1_002', name: 'Manuscrito', category: 'glyph', tier: 1, rarity: 'common', icon: '📜', imageUrl: `${GLYPHS_BASE_URL}/MOLDE_T1_MANUSCRITO_HOD.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_glyph_1_002 },
    { id: 'item_glyph_1_003', name: 'Lajota', category: 'glyph', tier: 1, rarity: 'common', icon: '🧱', imageUrl: `${GLYPHS_BASE_URL}/MOLDE_T1_LAJOTA_CALCARIO.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_glyph_1_003 },
    // T2
    { id: 'item_glyph_2_002', name: 'Granito Rúnico', category: 'glyph', tier: 2, rarity: 'uncommon', icon: '🪨', imageUrl: `${GLYPHS_BASE_URL}/MOLDE_T2_GRANITO_RUNICO.png`, isRankExclusive: true },
    // T3
    { id: 'item_glyph_3_002', name: 'Mecanismo Bronze', category: 'glyph', tier: 3, rarity: 'rare', icon: '⚙️', imageUrl: `${GLYPHS_BASE_URL}/MOLDE_T3_MECANISMO_BRONZE.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_glyph_3_002 },
    { id: 'item_glyph_3_003', name: 'Mecanismo Rúnico', category: 'glyph', tier: 3, rarity: 'rare', icon: '⚙️', imageUrl: `${GLYPHS_BASE_URL}/MOLDE_T3_MECANISMO_RUNICO.png`, isRankExclusive: true },
    // T5
    { id: 'item_glyph_4_001', name: 'Crisol Geomântico', category: 'glyph', tier: 4, rarity: 'epic', icon: '🔶', imageUrl: `${GLYPHS_BASE_URL}/MOLDE_T4_CRISOL_GEOMANTICO.png`, isRankExclusive: true },
    { id: 'item_glyph_4_002', name: 'Cristal Branco', category: 'glyph', tier: 4, rarity: 'epic', icon: '💎', imageUrl: `${GLYPHS_BASE_URL}/MOLDE_T4_CRISTAL_BRANCO.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_glyph_4_002 },
    { id: 'item_glyph_5_001', name: 'A FORJA - Losango 3D', category: 'glyph', tier: 5, rarity: 'legendary', icon: '🔷', imageUrl: `${GLYPHS_BASE_URL}/MOLDE_T5_A_FORJA.png`, isRankExclusive: true },
    { id: 'item_glyph_5_002', name: 'Artefato Sombrio', category: 'glyph', tier: 5, rarity: 'legendary', icon: '🖤', imageUrl: `${GLYPHS_BASE_URL}/MOLDE_T5_ARTEFATO_SOMBRIO.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_glyph_5_002 },

    // --- AURAS ---
    // T1
    catalogItem('aura', { id: 'item_aura_1_001', name: 'Bruma', tier: 1, rarity: 'common', icon: '🌫️' }),
    catalogItem('aura', { id: 'item_aura_1_002', name: 'Safira', tier: 1, rarity: 'common', icon: '🔵' }),
    catalogItem('aura', { id: 'item_aura_1_003', name: 'Rubi', tier: 1, rarity: 'common', icon: '🔴' }),
    // T2
    catalogItem('aura', { id: 'item_aura_2_001', name: 'Esmeralda', tier: 2, rarity: 'uncommon', icon: '🟢' }),
    catalogItem('aura', { id: 'item_aura_2_002', name: 'Prata', tier: 2, rarity: 'uncommon', icon: '⚪' }),
    // T3
    catalogItem('aura', { id: 'item_aura_3_001', name: 'Ouro', tier: 3, rarity: 'rare', icon: '🟡' }),
    // T5
    catalogItem('aura', { id: 'item_aura_5_001', name: 'Pedra da Lua', tier: 5, rarity: 'legendary', icon: '🌙' }),
    catalogItem('aura', { id: 'item_aura_5_002', name: 'Multiverso', tier: 5, rarity: 'legendary', icon: '🌌' }),

    // --- ORBES ---
    // T1
    { id: 'item_orb_1_002', name: 'Orbe de Cobre', category: 'orb', tier: 1, rarity: 'common', icon: '🟠', imageUrl: `${GLYPHS_BASE_URL}/ORBE_T1_COBRE.png` },
    // T2
    { id: 'item_orb_2_002', name: 'Orbe Sombrio', category: 'orb', tier: 2, rarity: 'uncommon', icon: '⚫', imageUrl: `${GLYPHS_BASE_URL}/ORBE_T2_SOMBRIO.png`, isRankExclusive: true },
    { id: 'item_orb_2_003', name: 'Orbe Tempestade', category: 'orb', tier: 2, rarity: 'uncommon', icon: '🌩️', imageUrl: `${GLYPHS_BASE_URL}/ORBE_T2_TEMPESTADE.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_orb_2_003 },
    // T3
    { id: 'item_orb_3_001', name: 'Orbe de Ouro', category: 'orb', tier: 3, rarity: 'rare', icon: '🟡', imageUrl: `${GLYPHS_BASE_URL}/ORBE_T3_OURO.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_orb_3_001 },
    { id: 'item_orb_4_001', name: 'Orbe de Diamante', category: 'orb', tier: 4, rarity: 'epic', icon: '💎', imageUrl: `${GLYPHS_BASE_URL}/ORBE_T4_DIAMANTE.png`, isRankExclusive: true },
    // T5
    { id: 'item_orb_5_001', name: 'Orbe Gênese', category: 'orb', tier: 5, rarity: 'legendary', icon: '♾️', imageUrl: `${GLYPHS_BASE_URL}/ORBE_T5_GENESE.png`, isRankExclusive: true },
    { id: 'item_orb_5_002', name: 'Orbe Soberano', category: 'orb', tier: 5, rarity: 'legendary', icon: '👑', imageUrl: `${GLYPHS_BASE_URL}/ORBE_T5_SOBERANO.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_orb_5_002 },

    // --- PLACAS ---
    { id: 'item_plate_1_001', name: 'Placa Madeira', category: 'plate', tier: 1, rarity: 'common', icon: '🪵', imageUrl: `${GLYPHS_BASE_URL}/PLACA_MADEIRA.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_1_001 },
    { id: 'item_plate_2_001', name: 'Placa Pedra', category: 'plate', tier: 2, rarity: 'uncommon', icon: '🪨', imageUrl: `${GLYPHS_BASE_URL}/PLACA_PEDRA.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_2_001 },
    { id: 'item_plate_3_001', name: 'Placa Prata', category: 'plate', tier: 3, rarity: 'rare', icon: '⚪', imageUrl: `${GLYPHS_BASE_URL}/PLACA_PRATA.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_3_001 },
    { id: 'item_plate_4_001', name: 'Placa Roxa', category: 'plate', tier: 4, rarity: 'epic', icon: '🟣', imageUrl: `${GLYPHS_BASE_URL}/PLACA_ROXA.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_4_001 },
    { id: 'item_plate_5_001', name: 'Placa Ouro', category: 'plate', tier: 5, rarity: 'legendary', icon: '🟡', imageUrl: `${GLYPHS_BASE_URL}/PLACA_OURO.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_5_001 },
    { id: 'item_plate_5_002', name: 'Placa Gelo', category: 'plate', tier: 5, rarity: 'legendary', icon: '❄️', imageUrl: `${GLYPHS_BASE_URL}/PLACA_GELO.png`, costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_5_002 },

    // --- UI SKINS (Temas) ---
    // T1
    themeCatalogItem({ id: 'BASIC', name: 'Tema: Básico Profissional', tier: 1, rarity: 'common', icon: '\u25FB\uFE0F', asset: 'basic.png' }),
    // T3
    themeCatalogItem({ id: 'GOLD', name: 'Tema: Ouro Soberano', tier: 3, rarity: 'rare', icon: '\u269C\uFE0F', asset: 'gold.png', costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.GOLD }),
    themeCatalogItem({ id: 'FROST', name: 'Tema: Gelo Eterno', tier: 3, rarity: 'rare', icon: '\u2744\uFE0F', asset: 'frost.png', costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.FROST }),
    // T4
    themeCatalogItem({ id: 'EMBER', name: 'Tema: Chama Viva', tier: 4, rarity: 'epic', icon: '\uD83D\uDD25', asset: 'ember.png', costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.EMBER }),
    themeCatalogItem({ id: 'CYBER', name: 'Tema: Cyberpunk', tier: 4, rarity: 'epic', icon: '\uD83E\uDDBE', asset: 'cyber.jpg', costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.CYBER }),
    themeCatalogItem({ id: 'AURORA', name: 'Tema: Aurora Boreal', tier: 4, rarity: 'epic', icon: '\uD83C\uDF0C', asset: 'aurora.png', costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.AURORA }),
    // T5
    themeCatalogItem({ id: 'VOID', name: 'Tema: Vazio Primordial', tier: 5, rarity: 'legendary', icon: '\uD83D\uDD2E', asset: 'void.png', costGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.VOID }),
    themeCatalogItem({ id: 'GENESIS', name: 'Tema: Genesis', tier: 5, rarity: 'legendary', icon: '\u2726', asset: 'genesis.png' }),

    // --- EXCLUSIVOS (Store) ---
    // Itens legacy preservados para inventarios antigos, fora do catalogo ativo de ouro.
    catalogItem('skin', { id: 'item_skin_exclusive_001', name: 'Empreendedor', tier: 4, rarity: 'epic', icon: '💼' }),
    catalogItem('aura', { id: 'item_aura_exclusive_001', name: 'Fênix Dourada', tier: 5, rarity: 'legendary', icon: '🔥', isGoldExclusive: true }),
    catalogItem('border', { id: 'item_border_exclusive_001', name: 'Fundador', tier: 4, rarity: 'epic', icon: '🛡️' }),

    // --- INSÍGNIAS ---
    // NOBREZA (Ouro)
    { id: 'insignia_rank_1_vagante', name: 'Ouro: Vagante', category: 'insignia', tier: 1, rarity: 'common', icon: '⚪', description: "Patente de Ouro: Reconhecimento inicial para aqueles que começam sua jornada.", isRankExclusive: true },
    { id: 'insignia_rank_2_escudeiro', name: 'Ouro: Escudeiro', category: 'insignia', tier: 1, rarity: 'common', icon: '🛡️', description: "Patente de Ouro: Concedida aos que demonstraram compromisso inicial com a ordem.", isRankExclusive: true },
    { id: 'insignia_rank_3_cavaleiro', name: 'Ouro: Cavaleiro', category: 'insignia', tier: 2, rarity: 'uncommon', icon: '⚔️', description: "Patente de Ouro: Dada aos guerreiros que provaram sua constância em batalha.", isRankExclusive: true },
    { id: 'insignia_rank_4_lorde', name: 'Ouro: Lorde', category: 'insignia', tier: 3, rarity: 'rare', icon: '🏰', description: "Patente de Ouro: Um título de nobreza para quem lidera pelo exemplo.", isRankExclusive: true },
    { id: 'insignia_rank_5_barao', name: 'Ouro: Barão', category: 'insignia', tier: 4, rarity: 'epic', icon: '👑', description: "Patente de Ouro: Elite da nobreza, reservada aos mestres da disciplina.", isRankExclusive: true },
    { id: 'insignia_rank_6_conde', name: 'Ouro: Conde', category: 'insignia', tier: 4, rarity: 'epic', icon: '📜', description: "Patente de Ouro: Reconhecimento por serviços notáveis prestados ao reino.", isRankExclusive: true },
    { id: 'insignia_rank_7_duque', name: 'Ouro: Duque', category: 'insignia', tier: 5, rarity: 'legendary', icon: '💎', description: "Patente de Ouro: Um alto título de nobreza, concedido apenas aos mais dignos.", isRankExclusive: true },
    { id: 'insignia_rank_8_principe', name: 'Ouro: Príncipe', category: 'insignia', tier: 5, rarity: 'legendary', icon: '🌟', description: "Patente de Ouro: Sangue real. Seu nome é conhecido em todas as terras.", isRankExclusive: true },
    { id: 'insignia_rank_9_rei', name: 'Ouro: Rei', category: 'insignia', tier: 5, rarity: 'legendary', icon: '👑', description: "Patente de Ouro: A autoridade máxima. Sua palavra é lei.", isRankExclusive: true },
    { id: 'insignia_rank_10_soberano', name: 'Ouro: Soberano', category: 'insignia', tier: 5, rarity: 'legendary', icon: '🔱', description: "Patente de Ouro: O ápice da maestria. Poucos alcançam este patamar de soberania.", isRankExclusive: true },

    // RELATORIOS (Bronze)

    // QUESTS (Prata)
    { id: 'insignia_quest_master', name: 'Prata: Mestre de Quests', category: 'insignia', tier: 3, rarity: 'rare', icon: '🏆', description: "Missão de Prata: Concedida ao completar missões desafiadoras da temporada.", isQuestExclusive: true },

    // NOVAS INSÍGNIAS (Recompensas Automáticas)
    { id: 'insignia_report_comum', name: 'Bronze: Relatório de Ciclo', category: 'insignia', tier: 1, rarity: 'common', icon: '📜', description: "Relatório de Bronze: Concedida por concluir um ciclo e selar o relatório final.", isReportExclusive: true },
    { id: 'insignia_quest_incomum', name: 'Prata: Missão Incomum', category: 'insignia', tier: 2, rarity: 'uncommon', icon: '🎖️', description: "Missão de Prata: Concedida ao concluir uma missão da temporada.", isQuestExclusive: true },
    { id: 'insignia_levelup_rara', name: 'Ouro: Patente Rara', category: 'insignia', tier: 3, rarity: 'rare', icon: '⭐', description: "Patente de Ouro: Concedida ao atingir um novo nível de excelência.", isRankExclusive: true },
    { id: 'insignia_season_aurora_1', name: 'Aurora I', category: 'insignia', tier: 6, rarity: 'mythic', icon: '🌌', description: "Marca roxa da primeira Temporada oficial da Primeira Era.", isSeasonExclusive: true, seasonKey: 'aurora_1_2026', seasonSlot: 'insignia' },
];

const LEGACY_ITEM_ID_ALIASES: Record<string, string> = {
    insignia_sitrep_s: 'insignia_report_comum',
    insignia_sitrep_a: 'insignia_report_comum',
    insignia_sitrep_b: 'insignia_report_comum',
    insignia_sitrep_c: 'insignia_report_comum',
    default: 'BASIC',
    basic: 'BASIC',
};

export const resolveItemDef = (itemId: string): ItemDef | undefined => {
    const stripRasterExt = (value: string) => value.toLowerCase().replace(/(\.(png|jpg|jpeg))+$/, '');
    const aliasedId = LEGACY_ITEM_ID_ALIASES[itemId] || itemId;
    const direct = ITEMS_DB.find(d => d.id === aliasedId);
    if (direct) return direct;
    const normalized = stripRasterExt(aliasedId);
    return ITEMS_DB.find(d => {
        const url = d.imageUrl?.toLowerCase();
        if (!url) return false;
        return stripRasterExt(url).endsWith(`/${normalized}`);
    });
};

const resolveItemInput = (itemOrId?: ItemDef | string): ItemDef | undefined => {
    if (!itemOrId) return undefined;
    return typeof itemOrId === 'string' ? resolveItemDef(itemOrId) : itemOrId;
};

export const isLegacyRetiredItem = (itemOrId?: ItemDef | string): boolean => Boolean(resolveItemInput(itemOrId)?.isLegacyRetired);
export const isGmExclusiveItem = (itemOrId?: ItemDef | string): boolean => Boolean(resolveItemInput(itemOrId)?.isGmExclusive);
export const isSeasonCatalogItem = (itemOrId?: ItemDef | string): boolean => {
    const item = resolveItemInput(itemOrId);
    return Boolean(item?.isSeasonExclusive && !item?.isLegacyRetired);
};
export const isRankRewardItem = (itemOrId?: ItemDef | string): boolean => Boolean(resolveItemInput(itemOrId)?.isRankExclusive);
export const isChestOnlyItem = (itemOrId?: ItemDef | string): boolean => Boolean(resolveItemInput(itemOrId)?.isChestExclusive);
export const isQuestRewardItem = (itemOrId?: ItemDef | string): boolean => Boolean(resolveItemInput(itemOrId)?.isQuestExclusive);
export const isReportRewardItem = (itemOrId?: ItemDef | string): boolean => Boolean(resolveItemInput(itemOrId)?.isReportExclusive);
export const isGoldStorePurchasableItem = (itemOrId?: ItemDef | string): boolean => {
    const item = resolveItemInput(itemOrId);
    return Boolean(
        item
        && typeof item.costGold === 'number'
        && !item.isLegacyRetired
        && !item.isGmExclusive
        && !item.isRankExclusive
        && !item.isSeasonExclusive
        && !item.isPremiumOnly
        && !item.isChestExclusive
        && !item.isQuestExclusive
        && !item.isReportExclusive
    );
};
export const isForgeEligibleItem = (itemOrId?: ItemDef | string): boolean => {
    const item = resolveItemInput(itemOrId);
    if (!item) return false;
    return (
        item.category !== 'hair'
        && !item.isGoldExclusive
        && !item.isSeasonExclusive
        && !item.isRankExclusive
        && !item.isChestExclusive
        && !item.isQuestExclusive
        && !item.isReportExclusive
        && !item.isLegacyRetired
        && !item.isGmExclusive
    );
};
export const isChestEligibleItem = (itemOrId?: ItemDef | string): boolean => {
    const item = resolveItemInput(itemOrId);
    if (!item) return false;
    return (
        item.category !== 'hair'
        && !item.isGoldExclusive
        && !item.isSeasonExclusive
        && !item.isRankExclusive
        && !item.isPremiumOnly
        && !item.isQuestExclusive
        && !item.isReportExclusive
        && !item.isLegacyRetired
        && !item.isGmExclusive
    );
};

export const SEASON_COLLECTION_SLOTS: ItemSeasonSlot[] = ['skin', 'border', 'banner', 'glyph', 'orb', 'plate', 'insignia', 'ui_skin'];
export const SEASON_COLLECTIONS: Record<string, SeasonCollectionDef> = {
    aurora_1_2026: {
        id: 'aurora_1_2026',
        name: 'Aurora I',
        storeMode: 'seasonal_high',
        slots: {
            skin: 'item_skin_aurora_1_2026',
            border: 'item_border_aurora_1_2026',
            banner: 'item_banner_aurora_1_2026',
            glyph: null,
            orb: null,
            plate: null,
            insignia: 'insignia_season_aurora_1',
            ui_skin: null,
        },
    },
    genesis_legacy: {
        id: 'genesis_legacy',
        name: 'Genesis Legacy',
        retired: true,
        premiumLegacy: true,
        slots: {
            skin: null,
            border: 'item_border_genesis_01',
            banner: 'item_banner_origin_01',
            glyph: null,
            orb: null,
            plate: null,
            insignia: null,
            ui_skin: null,
        },
    },
};

export const getSeasonCollectionItems = (seasonKey: string): ItemDef[] => getCatalogItems(item => item.seasonKey === seasonKey);
export const getActiveSeasonCollectionItems = (seasonKey: string): ItemDef[] =>
    getCatalogItems(item => item.seasonKey === seasonKey && !item.isLegacyRetired);
export const getRetiredSeasonCollectionItems = (seasonKey: string): ItemDef[] =>
    getCatalogItems(item => item.seasonKey === seasonKey && !!item.isLegacyRetired);

export const GOLD_PACKS = GOLD_PACK_CATALOG.map((pack) => ({
    id: pack.id,
    name: pack.name,
    price: pack.priceBrl,
    gold: pack.goldBase,
    bonus: pack.bonusGold,
    total: pack.totalGold,
    icon: pack.icon,
}));

export const CODEXES = [
    { id: 'd290f1ee-6c54-4b01-90e6-d701748f0851', name: "Máquina Biológica", cost: 200, icon: '🧬' },
    { id: "codex_financas", name: "Campanha: Finanças Pessoais", cost: 150, icon: '💼' },
    { id: "codex_produtividade", name: "Campanha: Produtividade Extrema", cost: 150, icon: '⚡' },
    { id: "codex_saude", name: "Campanha: Saúde & Fitness", cost: 150, icon: '🏋️' },
    { id: "codex_mindset", name: "Campanha: Mindset de Sucesso", cost: 150, icon: '🧠' }
];

export const XP_BOOSTS = GOLD_BOOST_PRODUCTS.map((boost) => ({
    id: boost.id,
    name: boost.name,
    cost: boost.priceGold,
    durationHours: boost.durationHours,
    icon: boost.icon,
}));

// === Premium Genesis Pack ===
const GENESIS_BORDER: ItemDef = interfaceCatalogItem('border', {
    id: 'item_border_genesis_01', name: 'Borda Gênesis',
    tier: 4, rarity: 'epic', icon: '✨',
    description: 'Recompensa de Temporada e Quest de alto valor.',
    isSeasonExclusive: true,
    isLegacyRetired: true,
    seasonKey: 'genesis_legacy',
    seasonSlot: 'border',
    asset: 'borda_t5_genesis.png',
});
const GENESIS_BANNER: ItemDef = interfaceCatalogItem('banner', {
    id: 'item_banner_origin_01', name: 'Banner Origem',
    tier: 4, rarity: 'epic', icon: '🧿',
    description: 'Recompensa de Temporada e Quest de alto valor.',
    isSeasonExclusive: true,
    isLegacyRetired: true,
    seasonKey: 'genesis_legacy',
    seasonSlot: 'banner',
    asset: 'banner_origem.png',
});
export const PREMIUM_PACK_GENESIS = [GENESIS_BORDER, GENESIS_BANNER];

// Add Genesis items to main DB
ITEMS_DB.push(GENESIS_BORDER, GENESIS_BANNER);

const PNG_REQUIRED_CATEGORIES = new Set<ItemCategory>([
    'skin',
    'artifact',
    'border',
    'banner',
    'glyph',
    'orb',
    'plate',
]);

const PNG_OPTIONAL_CATEGORIES = new Set<ItemCategory>([
    'aura',
    'hair',
    'ui_skin',
    'chest',
    'insignia',
    'insignias',
]);

const hasRasterAsset = (item: ItemDef): boolean => typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0;

export const ITEM_IDS_PENDING_ART = ITEMS_DB
    .filter(item => PNG_REQUIRED_CATEGORIES.has(item.category) && !hasRasterAsset(item))
    .map(item => item.id);

const PENDING_ART_ID_SET = new Set<string>(ITEM_IDS_PENDING_ART);

export const isItemPendingArt = (itemOrId?: ItemDef | string): boolean => {
    if (!itemOrId) return false;
    const item = typeof itemOrId === 'string' ? resolveItemDef(itemOrId) : itemOrId;
    if (!item) return false;
    if (PNG_OPTIONAL_CATEGORIES.has(item.category)) return false;
    if (!PNG_REQUIRED_CATEGORIES.has(item.category)) return false;
    return PENDING_ART_ID_SET.has(item.id);
};

export const isItemCatalogVisible = (itemOrId?: ItemDef | string): boolean => {
    const itemId = typeof itemOrId === 'string' ? itemOrId : itemOrId?.id;
    if (!PRODUCT_FEATURES.personalGarden && itemId?.startsWith('item_garden_')) return false;
    return !isItemPendingArt(itemOrId);
};

export const getCatalogItems = (predicate?: (item: ItemDef) => boolean): ItemDef[] => {
    return ITEMS_DB.filter(item => isItemCatalogVisible(item) && (!predicate || predicate(item)));
};

export const getCatalogItemsByCategory = (category: ItemCategory): ItemDef[] => {
    return getCatalogItems(item => item.category === category);
};

export const getPendingArtItems = (): ItemDef[] => {
    return ITEMS_DB.filter(item => isItemPendingArt(item));
};
