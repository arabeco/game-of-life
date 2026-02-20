import { ItemRarity } from '../types';

export type ItemCategory = 'skin' | 'hair' | 'border' | 'glyph' | 'aura' | 'ui_skin' | 'artifact';

export interface ItemDef {
    id: string;
    name: string;
    category: ItemCategory;
    tier: 1 | 2 | 3 | 4 | 5;
    rarity: ItemRarity;
    icon?: string; // Emoji
    imageUrl?: string; // JPG/PNG URL
    description?: string;
    costGold?: number; // If purchasable in gold store
    isGoldExclusive?: boolean;
    isSeasonExclusive?: boolean;
}

const BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars';

export const ITEMS_DB: ItemDef[] = [
    // --- SKINS ---
    // T1 (Comum)
    { id: 'item_skin_1_001', name: 'Náufrago', category: 'skin', tier: 1, rarity: 'common', icon: '🏝️', imageUrl: `${BASE_URL}/SKIN_T1_NAUFRAGO.png.png`, description: "Trajes desgastados pelo tempo e pelo mar. Ideal para quem está começando sua jornada do zero." },
    { id: 'item_skin_1_002', name: 'Casual', category: 'skin', tier: 1, rarity: 'common', icon: '👕', imageUrl: `${BASE_URL}/SKIN_T1_CASUAL.png.png`, description: "Roupas confortáveis para o dia a dia. Nada de especial, mas cumpre o papel." },
    { id: 'item_skin_1_003', name: 'Gym Rat', category: 'skin', tier: 1, rarity: 'common', icon: '💪', imageUrl: `${BASE_URL}/SKIN_T1_GYM_RAT.png.png`, description: "Focado no treino e na disciplina física. O suor é o seu melhor acessório." },
    { id: 'item_skin_1_004', name: 'Street', category: 'skin', tier: 1, rarity: 'common', icon: '🛹', imageUrl: `${BASE_URL}/SKIN_T1_STREET.png.png`, description: "Estilo urbano para quem domina as ruas e o asfalto." },
    // T2 (Incomum)
    { id: 'item_skin_2_001', name: 'Executivo', category: 'skin', tier: 2, rarity: 'uncommon', icon: '💼', imageUrl: `${BASE_URL}/SKIN_T2_EXECUTIVO.png.png` },
    { id: 'item_skin_2_002', name: 'Tático', category: 'skin', tier: 2, rarity: 'uncommon', icon: '🕶️', imageUrl: `${BASE_URL}/SKIN_T2_TATICO.png.png` },
    { id: 'item_skin_2_003', name: 'Acadêmico', category: 'skin', tier: 2, rarity: 'uncommon', icon: '🎓', imageUrl: `${BASE_URL}/SKIN_T2_ACADEMICO.png.png` },
    // T3 (Raro)
    { id: 'item_skin_3_001', name: 'Nômade', category: 'skin', tier: 3, rarity: 'rare', icon: '🐪', imageUrl: `${BASE_URL}/SKIN_T3_NOMADE.png.png` },
    { id: 'item_skin_3_002', name: 'Alquimista', category: 'skin', tier: 3, rarity: 'rare', icon: '⚗️', imageUrl: `${BASE_URL}/SKIN_T3_ALQUIMISTA.png.png` },
    { id: 'item_skin_3_003', name: 'Híbrido', category: 'skin', tier: 3, rarity: 'rare', icon: '🤖', imageUrl: `${BASE_URL}/SKIN_T3_HIBRIDO.png.png` },
    // T4 (Épico)
    { id: 'item_skin_4_001', name: 'Armadura Placa', category: 'skin', tier: 4, rarity: 'epic', icon: '🛡️', imageUrl: `${BASE_URL}/SKIN_T4_ARMADURA_PLACA.png.png` },
    { id: 'item_skin_4_002', name: 'Mago Círculo', category: 'skin', tier: 4, rarity: 'epic', icon: '🧙‍♂️', imageUrl: `${BASE_URL}/SKIN_T4_MAGO_CIRCULO.png.png` },
    // T5 (Lendário)
    { id: 'item_skin_5_001', name: 'Entidade de Luz', category: 'skin', tier: 5, rarity: 'legendary', icon: '✨' },
    
    // Season
    { id: 'item_skin_season_001', name: 'O Criador', category: 'skin', tier: 4, rarity: 'epic', icon: '🎨', isSeasonExclusive: true, imageUrl: `${BASE_URL}/SKIN_SEASON_CRIADOR.png.png` },

    // --- ARTIFACTS (Ferramentas, Armas, Relíquias, Companions) ---
    // T1
    { id: 'item_artifact_1_001', name: 'Adaga Aprendiz', category: 'artifact', tier: 1, rarity: 'common', icon: '🗡️', imageUrl: `${BASE_URL}/artefato_t1_adagaaprendiz.png.png` },
    { id: 'item_artifact_1_002', name: 'Cachorro Beagle', category: 'artifact', tier: 1, rarity: 'common', icon: '🐕', imageUrl: `${BASE_URL}/artefato_t1_cachorrobeagle.png.png` },
    { id: 'item_artifact_1_003', name: 'Gato Laranja', category: 'artifact', tier: 1, rarity: 'common', icon: '🐈', imageUrl: `${BASE_URL}/artefato_t1_gatolaranja.png.png` },
    { id: 'item_artifact_1_004', name: 'Halteres', category: 'artifact', tier: 1, rarity: 'common', icon: '🏋️', imageUrl: `${BASE_URL}/artefato_t1_halterespar.png.png` },
    { id: 'item_artifact_1_005', name: 'Trio Café', category: 'artifact', tier: 1, rarity: 'common', icon: '☕', imageUrl: `${BASE_URL}/artefato_t1_triocafe.png.png` },
    // T2
    { id: 'item_artifact_2_001', name: 'Cachorro Husky', category: 'artifact', tier: 2, rarity: 'uncommon', icon: '🐺', imageUrl: `${BASE_URL}/artefato_t2_cachorrohusky.png.png` },
    { id: 'item_artifact_2_002', name: 'Gato Siamês', category: 'artifact', tier: 2, rarity: 'uncommon', icon: '🐱', imageUrl: `${BASE_URL}/artefato_t2_gatosiames.png.png` },
    { id: 'item_artifact_2_003', name: 'Setup', category: 'artifact', tier: 2, rarity: 'uncommon', icon: '💻', imageUrl: `${BASE_URL}/artefato_t2_setup.png.png` },
    // T3
    { id: 'item_artifact_3_001', name: 'Cachorro Jack', category: 'artifact', tier: 3, rarity: 'rare', icon: '🐶', imageUrl: `${BASE_URL}/artefato_t3_cachorrojack.png.png` },
    { id: 'item_artifact_3_002', name: 'Caixa Mágica', category: 'artifact', tier: 3, rarity: 'rare', icon: '📦', imageUrl: `${BASE_URL}/ARTEFATO_T3_caixamagica.png.png` },
    { id: 'item_artifact_3_003', name: 'Cetro Esmeralda', category: 'artifact', tier: 3, rarity: 'rare', icon: '🪄', imageUrl: `${BASE_URL}/ARTEFATO_T3_cetroesmeralda.png` },
    { id: 'item_artifact_3_004', name: 'Coroa Prata', category: 'artifact', tier: 3, rarity: 'rare', icon: '👑', imageUrl: `${BASE_URL}/ARTEFATO_T3_coroaprata.png.png` },
    { id: 'item_artifact_3_005', name: 'Divine Scepter', category: 'artifact', tier: 3, rarity: 'rare', icon: '⚜️', imageUrl: `${BASE_URL}/artefato_t3_DivineScepter.png.png` },
    { id: 'item_artifact_3_006', name: 'Espada Runas', category: 'artifact', tier: 3, rarity: 'rare', icon: '⚔️', imageUrl: `${BASE_URL}/ARTEFATO_T3_espadarunas.png` },
    // T4
    { id: 'item_artifact_4_001', name: 'Coroa de Espinhos', category: 'artifact', tier: 4, rarity: 'epic', icon: '🌵', imageUrl: `${BASE_URL}/ARTEFATO_T4_COROA_ESPINHOS.png.png` },
    { id: 'item_artifact_4_002', name: 'Dragão Bebê', category: 'artifact', tier: 4, rarity: 'epic', icon: '🐉', imageUrl: `${BASE_URL}/ARTEFATO_T4_DRAGAO_BEBE.png.png` },
    { id: 'item_artifact_4_003', name: 'Grimório Arcano', category: 'artifact', tier: 4, rarity: 'epic', icon: '📖', imageUrl: `${BASE_URL}/ARTEFATO_T4_GRIMORIO_ARCANO.png.png` },
    // T5
    { id: 'item_artifact_5_001', name: 'Fênix Cósmico', category: 'artifact', tier: 5, rarity: 'legendary', icon: '🐦', imageUrl: `${BASE_URL}/ARTEFATO_T5_FENIX_COSMICO.png.png` },
    { id: 'item_artifact_5_002', name: 'Tesseract', category: 'artifact', tier: 5, rarity: 'legendary', icon: '🧊', imageUrl: `${BASE_URL}/ARTEFATO_T5_tessaract.png.png` },

    // --- CABELOS ---
    // T1
    { id: 'item_hair_1_001', name: 'Recruta', category: 'hair', tier: 1, rarity: 'common', icon: '💇' },
    { id: 'item_hair_1_002', name: 'Cachos', category: 'hair', tier: 1, rarity: 'common', icon: '➰' },
    { id: 'item_hair_1_003', name: 'Mullet', category: 'hair', tier: 1, rarity: 'common', icon: '🎸' },
    { id: 'item_hair_1_004', name: 'Rabo de Cavalo', category: 'hair', tier: 1, rarity: 'common', icon: '👱‍♀️' },
    // T2
    { id: 'item_hair_2_001', name: 'Dreads', category: 'hair', tier: 2, rarity: 'uncommon', icon: '🧶' },
    { id: 'item_hair_2_002', name: 'Coque', category: 'hair', tier: 2, rarity: 'uncommon', icon: '🥯' },
    { id: 'item_hair_2_003', name: 'Curto Fem', category: 'hair', tier: 2, rarity: 'uncommon', icon: '👩' },
    // T3
    { id: 'item_hair_3_001', name: 'Princesa', category: 'hair', tier: 3, rarity: 'rare', icon: '👸' },
    { id: 'item_hair_3_002', name: 'Goku', category: 'hair', tier: 3, rarity: 'rare', icon: '🔥' },
    // T4
    { id: 'item_hair_4_001', name: 'Fluxo Espiritual Anime', category: 'hair', tier: 4, rarity: 'epic', icon: '🌬️' },

    // --- BORDAS ---
    // T1
    { id: 'item_border_1_001', name: 'Pupilo (Beta)', category: 'border', tier: 1, rarity: 'common', icon: '🔰' },
    { id: 'item_border_1_002', name: 'Disciplinado', category: 'border', tier: 1, rarity: 'common', icon: '📏' },
    { id: 'item_border_1_003', name: 'Vanguardista', category: 'border', tier: 1, rarity: 'common', icon: '🚩' },
    { id: 'item_border_1_004', name: 'Rústico', category: 'border', tier: 1, rarity: 'common', icon: '🪵' },
    // T2
    { id: 'item_border_2_001', name: 'Popular', category: 'border', tier: 2, rarity: 'uncommon', icon: '🌟' },
    { id: 'item_border_2_002', name: 'Protetor', category: 'border', tier: 2, rarity: 'uncommon', icon: '🛡️' },
    // T3
    { id: 'item_border_3_001', name: 'Imparável', category: 'border', tier: 3, rarity: 'rare', icon: '🚀' },
    { id: 'item_border_3_002', name: 'Arquétipo', category: 'border', tier: 3, rarity: 'rare', icon: '🎭' },
    // T4
    { id: 'item_border_4_001', name: 'Lenda Viva', category: 'border', tier: 4, rarity: 'epic', icon: '🦁' },
    { id: 'item_border_4_002', name: 'Soberano', category: 'border', tier: 4, rarity: 'epic', icon: '👑' },
    // T5
    { id: 'item_border_5_001', name: 'GM - Grande Mestre', category: 'border', tier: 5, rarity: 'legendary', icon: '🐲' },

    // --- GLIFOS ---
    // T1
    { id: 'item_glyph_1_001', name: 'Tábua Aprendiz', category: 'glyph', tier: 1, rarity: 'common', icon: '🪵' },
    { id: 'item_glyph_1_002', name: 'Manuscrito', category: 'glyph', tier: 1, rarity: 'common', icon: '📜' },
    { id: 'item_glyph_1_003', name: 'Lajota', category: 'glyph', tier: 1, rarity: 'common', icon: '🧱' },
    // T2
    { id: 'item_glyph_2_001', name: 'Totem Obelisco', category: 'glyph', tier: 2, rarity: 'uncommon', icon: '🗿' },
    { id: 'item_glyph_2_002', name: 'Granito Rúnico', category: 'glyph', tier: 2, rarity: 'uncommon', icon: '🪨' },
    // T3
    { id: 'item_glyph_3_001', name: 'Monólito Aço', category: 'glyph', tier: 3, rarity: 'rare', icon: '🔩' },
    // T5
    { id: 'item_glyph_5_001', name: 'A FORJA - Losango 3D', category: 'glyph', tier: 5, rarity: 'legendary', icon: '💠' },

    // --- AURAS ---
    // T1
    { id: 'item_aura_1_001', name: 'Bruma', category: 'aura', tier: 1, rarity: 'common', icon: '🌫️' },
    { id: 'item_aura_1_002', name: 'Safira', category: 'aura', tier: 1, rarity: 'common', icon: '🔹' },
    { id: 'item_aura_1_003', name: 'Rubi', category: 'aura', tier: 1, rarity: 'common', icon: '🔻' },
    // T2
    { id: 'item_aura_2_001', name: 'Esmeralda', category: 'aura', tier: 2, rarity: 'uncommon', icon: '❇️' },
    { id: 'item_aura_2_002', name: 'Prata', category: 'aura', tier: 2, rarity: 'uncommon', icon: '⚪' },
    // T3
    { id: 'item_aura_3_001', name: 'Ouro', category: 'aura', tier: 3, rarity: 'rare', icon: '🟡' },
    // T5
    { id: 'item_aura_5_001', name: 'Pedra da Lua', category: 'aura', tier: 5, rarity: 'legendary', icon: '🌙' },
    { id: 'item_aura_5_002', name: 'Multiverso', category: 'aura', tier: 5, rarity: 'legendary', icon: '🌌' },

    // --- UI SKINS (Temas) ---
    // T3
    { id: 'GOLD', name: 'Tema: Ouro Soberano', category: 'ui_skin', tier: 3, rarity: 'rare', icon: '⚜️' },
    { id: 'FROST', name: 'Tema: Gelo Eterno', category: 'ui_skin', tier: 3, rarity: 'rare', icon: '❄️' },
    // T4
    { id: 'EMBER', name: 'Tema: Chama Viva', category: 'ui_skin', tier: 4, rarity: 'epic', icon: '🔥' },
    { id: 'CYBER', name: 'Tema: Cyberpunk', category: 'ui_skin', tier: 4, rarity: 'epic', icon: '🦾' },
    { id: 'AURORA', name: 'Tema: Aurora Boreal', category: 'ui_skin', tier: 4, rarity: 'epic', icon: '🌌' },
    // T5
    { id: 'VOID', name: 'Tema: Vazio Primordial', category: 'ui_skin', tier: 5, rarity: 'legendary', icon: '🔮' },

    // --- EXCLUSIVOS (Store) ---
    { id: 'item_skin_exclusive_001', name: 'Empreendedor', category: 'skin', tier: 4, rarity: 'epic', icon: '💼', costGold: 500, isGoldExclusive: true },
    { id: 'item_aura_exclusive_001', name: 'Fênix Dourada', category: 'aura', tier: 5, rarity: 'legendary', icon: '🐦', costGold: 800, isGoldExclusive: true },
    { id: 'item_border_exclusive_001', name: 'Fundador', category: 'border', tier: 4, rarity: 'epic', icon: '🏛️', costGold: 400, isGoldExclusive: true },
];

export const GOLD_PACKS = [
    { id: 'pack_gold_1', name: "Pepita", price: 5.00, gold: 50, bonus: 0, total: 50, icon: '🪙' },
    { id: 'pack_gold_2', name: "Barra Pequena", price: 10.00, gold: 100, bonus: 10, total: 110, icon: '🧈' },
    { id: 'pack_gold_3', name: "Barra Grande", price: 20.00, gold: 200, bonus: 30, total: 230, icon: '🧱' },
    { id: 'pack_gold_4', name: "Cofre", price: 50.00, gold: 500, bonus: 100, total: 600, icon: '🏦' },
    { id: 'pack_gold_5', name: "Tesouro", price: 100.00, gold: 1000, bonus: 300, total: 1300, icon: '💎' }
];

export const CODEXES = [
    { id: "codex_financas", name: "Codex: Finanças Pessoais", cost: 150, icon: '💰' },
    { id: "codex_produtividade", name: "Codex: Produtividade Extrema", cost: 150, icon: '⚡' },
    { id: "codex_saude", name: "Codex: Saúde & Fitness", cost: 150, icon: '🏋️' },
    { id: "codex_mindset", name: "Codex: Mindset de Sucesso", cost: 150, icon: '🧠' }
];

export const XP_BOOSTS = [
    { id: "boost_xp_24h", name: "Boost XP 2x (24h)", cost: 50, durationHours: 24, icon: '🚀' },
    { id: "boost_xp_7d", name: "Boost XP 2x (7 dias)", cost: 200, durationHours: 168, icon: '📅' }
];
