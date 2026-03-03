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

export const RANK_REWARDS: Record<string, { category: UnlockCategory; itemId: string; name: string }[]> = {
    'vagante': [
        { category: 'ui_skins', itemId: 'FROST', name: 'Tema Gelo Eterno' },
        { category: 'insignias', itemId: 'insignia_rank_1_vagante', name: 'Insígnia: Vagante' }
    ],
    'escudeiro': [
        { category: 'ui_skins', itemId: 'CYBER', name: 'Tema Cyberpunk' },
        { category: 'borders', itemId: 'item_border_t1_aprendiz', name: 'Borda Aprendiz' },
        { category: 'banners', itemId: 'item_banner_t1_aprendiz', name: 'Banner Aprendiz' },
        { category: 'insignias', itemId: 'insignia_rank_2_escudeiro', name: 'Insígnia: Escudeiro' }
    ],
    'cavaleiro': [
        { category: 'ui_skins', itemId: 'AURORA', name: 'Tema Aurora' },
        { category: 'borders', itemId: 'item_border_1_002', name: 'Borda Disciplinado' },
        { category: 'banners', itemId: 'item_banner_1_001', name: 'Banner Bronze' },
        { category: 'insignias', itemId: 'insignia_rank_3_cavaleiro', name: 'Insígnia: Cavaleiro' }
    ],
    'lorde': [
        { category: 'ui_skins', itemId: 'EMBER', name: 'Tema Brasas' },
        { category: 'insignias', itemId: 'insignia_rank_4_lorde', name: 'Insígnia: Lorde' }
    ],
    'barao': [
        { category: 'ui_skins', itemId: 'GOLD', name: 'Tema Dourado' },
        { category: 'insignias', itemId: 'insignia_rank_5_barao', name: 'Insígnia: Barão' }
    ],
    'conde': [
        { category: 'insignias', itemId: 'insignia_rank_6_conde', name: 'Insígnia: Conde' }
    ],
    'duque': [
        { category: 'insignias', itemId: 'insignia_rank_7_duque', name: 'Insígnia: Duque' }
    ],
    'principe': [
        { category: 'insignias', itemId: 'insignia_rank_8_principe', name: 'Insígnia: Príncipe' }
    ],
    'rei': [
        { category: 'insignias', itemId: 'insignia_rank_9_rei', name: 'Insígnia: Rei' }
    ],
    'soberano': [
        { category: 'insignias', itemId: 'insignia_rank_10_soberano', name: 'Insígnia: Soberano' }
    ],
};
