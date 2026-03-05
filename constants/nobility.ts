import { NobilityRank, UnlockCategory } from '../types';

export const NOBILITY_RANKS: NobilityRank[] = [
    { id: 'vagante', name: 'Vagante', levelRequired: 1, expTotalRequired: 0 },
    { id: 'escudeiro', name: 'Escudeiro', levelRequired: 10, expTotalRequired: 10000 },
    { id: 'cavaleiro', name: 'Cavaleiro', levelRequired: 20, expTotalRequired: 35000 },
    { id: 'lorde', name: 'Lorde', levelRequired: 30, expTotalRequired: 85000 },
    { id: 'barao', name: 'Barão', levelRequired: 40, expTotalRequired: 185000 },
    { id: 'conde', name: 'Conde', levelRequired: 50, expTotalRequired: 350000 },
    { id: 'duque', name: 'Duque', levelRequired: 60, expTotalRequired: 512500 },
    { id: 'principe', name: 'Príncipe', levelRequired: 70, expTotalRequired: 675000 },
    { id: 'rei', name: 'Rei', levelRequired: 80, expTotalRequired: 837500 },
    { id: 'soberano', name: 'Soberano', levelRequired: 90, expTotalRequired: 1000000 },
];

// Escalada do Soberano 5.0 — All items here are isRankExclusive and blocked from Chests/Store
export const RANK_REWARDS: Record<string, { category: UnlockCategory; itemId: string; name: string }[]> = {
    'vagante': [
        { category: 'ui_skins', itemId: 'FROST', name: 'Tema: Gelo Eterno' },
        { category: 'glyphs', itemId: 'item_glyph_1_001', name: 'Tábua Aprendiz' },
        { category: 'skins', itemId: 'item_skin_1_001', name: 'Náufrago' },
        { category: 'skins', itemId: 'item_skin_1_002', name: 'Casual' },
        { category: 'hairStyles', itemId: 'cachos', name: 'Cachos' },
        { category: 'hairStyles', itemId: 'medio_reto', name: 'Médio Reto' },
        { category: 'insignias', itemId: 'insignia_rank_1_vagante', name: 'Insígnia: Vagante' },
    ],
    'escudeiro': [
        { category: 'ui_skins', itemId: 'CYBER', name: 'Tema: Cyberpunk' },
        { category: 'skins', itemId: 'item_skin_1_004', name: 'Street' },
        { category: 'hairStyles', itemId: 'textured_crop', name: 'Texturizado' },
        { category: 'hairStyles', itemId: 'grunge_longo', name: 'Grunge Longo' },
        { category: 'borders', itemId: 'item_border_t1_aprendiz', name: 'Borda: Aprendiz' },
        { category: 'insignias', itemId: 'insignia_rank_2_escudeiro', name: 'Insígnia: Escudeiro' },
    ],
    'cavaleiro': [
        { category: 'ui_skins', itemId: 'AURORA', name: 'Tema: Aurora Boreal' },
        { category: 'artifacts', itemId: 'item_artifact_1_005', name: 'Trio Café' },
        { category: 'hairStyles', itemId: 'mullet_topete', name: 'Mullet Top' },
        { category: 'banners', itemId: 'item_banner_t1_aprendiz', name: 'Banner: Aprendiz' },
        { category: 'insignias', itemId: 'insignia_rank_3_cavaleiro', name: 'Insígnia: Cavaleiro' },
    ],
    'lorde': [
        { category: 'ui_skins', itemId: 'EMBER', name: 'Tema: Chama Viva' },
        { category: 'glyphs', itemId: 'item_glyph_2_002', name: 'Granito Rúnico' },
        { category: 'skins', itemId: 'item_skin_2_002', name: 'Tático' },
        { category: 'insignias', itemId: 'insignia_rank_4_lorde', name: 'Insígnia: Lorde' },
    ],
    'barao': [
        { category: 'ui_skins', itemId: 'GOLD', name: 'Tema: Ouro Soberano' },
        { category: 'orbs', itemId: 'item_orb_2_002', name: 'Orbe Sombrio' },
        { category: 'hairStyles', itemId: 'dreads', name: 'Dreads' },
        { category: 'insignias', itemId: 'insignia_rank_5_barao', name: 'Insígnia: Barão' },
    ],
    'conde': [
        { category: 'ui_skins', itemId: 'VOID', name: 'Tema: Vazio Primordial' },
        { category: 'skins', itemId: 'item_skin_2_001', name: 'Executivo' },
        { category: 'borders', itemId: 'item_border_t2_veterano', name: 'Borda: Veterano' },
        { category: 'insignias', itemId: 'insignia_rank_6_conde', name: 'Insígnia: Conde' },
    ],
    'duque': [
        { category: 'glyphs', itemId: 'item_glyph_3_003', name: 'Mecanismo Rúnico' },
        { category: 'artifacts', itemId: 'item_artifact_2_003', name: 'Setup' },
        { category: 'insignias', itemId: 'insignia_rank_7_duque', name: 'Insígnia: Duque' },
    ],
    'principe': [
        { category: 'skins', itemId: 'item_skin_4_002', name: 'Mago Círculo' },
        { category: 'orbs', itemId: 'item_orb_4_001', name: 'Orbe de Diamante' },
        { category: 'hairStyles', itemId: 'anime_spikes', name: 'Anime Spiky' },
        { category: 'insignias', itemId: 'insignia_rank_8_principe', name: 'Insígnia: Príncipe' },
    ],
    'rei': [
        { category: 'glyphs', itemId: 'item_glyph_4_001', name: 'Crisol Geomântico' },
        { category: 'borders', itemId: 'item_border_4_001', name: 'Borda: Lenda Viva' },
        { category: 'artifacts', itemId: 'item_artifact_4_002', name: 'Dragão Bebê' },
        { category: 'insignias', itemId: 'insignia_rank_9_rei', name: 'Insígnia: Rei' },
    ],
    'soberano': [
        { category: 'glyphs', itemId: 'item_glyph_5_001', name: 'A FORJA' },
        { category: 'skins', itemId: 'item_skin_5_001', name: 'Entidade de Luz' },
        { category: 'orbs', itemId: 'item_orb_5_001', name: 'Orbe Gênese' },
        { category: 'hairStyles', itemId: 'fluxo_espiritual', name: 'Fluxo Espiritual' },
        { category: 'insignias', itemId: 'insignia_rank_10_soberano', name: 'Insígnia: Soberano' },
    ],
};
