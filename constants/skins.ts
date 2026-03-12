export type Gender = 'male' | 'female';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface SkinItem {
    id: string; // The style ID (e.g., 'cachos', 'medio_reto')
    name: string; // Display name
    tier: string; // 't1', 't2', etc. (Used for filename construction)
    rarity: Rarity;
    filename?: string; // Optional manual filename override
    filenameId?: string; // Optional override for the ID part in filename (e.g. 'GRUNGE_LONG')
    availableColors?: string[]; // List of available color suffixes (e.g. ['cast', 'preto'])
}

export interface BodyDefinition {
    id: string; // 'male_1', 'female_2'
    gender: Gender;
    toneId: string; // '1', '2', '3'
    filename: string;
}

export const AVATAR_BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars';

export const BODY_DB: BodyDefinition[] = [
    { id: 'body_masc_1', gender: 'male', toneId: '1', filename: 'body_masc_1.png' },
    { id: 'body_masc_2', gender: 'male', toneId: '2', filename: 'body_masc_2.png' },
    { id: 'body_masc_3', gender: 'male', toneId: '3', filename: 'body_masc_3.png' },
    { id: 'body_fem_1', gender: 'female', toneId: '1', filename: 'body_fem_1.png' },
    { id: 'body_fem_2', gender: 'female', toneId: '2', filename: 'body_fem_2.png' },
    { id: 'body_fem_3', gender: 'female', toneId: '3', filename: 'body_fem_3.png' },
];

export const HAIR_DB: SkinItem[] = [
    // TIER 1 - Common
    { id: 'cachos', name: 'Cachos', tier: 'T1', rarity: 'common', availableColors: ['cast', 'preto'] },
    { id: 'medio_reto', name: 'Médio Reto', tier: 'T1', rarity: 'common', availableColors: ['bran', 'cast', 'pre'] },
    
    // TIER 2 - Uncommon
    { id: 'grunge_longo', name: 'Grunge Longo', tier: 'T2', rarity: 'uncommon', filenameId: 'GRUNGE_LONG', availableColors: ['bran', 'pre', 'ver'] },
    { id: 'textured_crop', name: 'Texturizado', tier: 'T2', rarity: 'uncommon', availableColors: ['bran', 'pre', 'ver'] },
    
    // TIER 3 - Rare
    { id: 'dreads', name: 'Dreads', tier: 'T3', rarity: 'rare', availableColors: ['bran', 'cast', 'pre'] },
    { id: 'mullet_topete', name: 'Mullet Top', tier: 'T3', rarity: 'rare', availableColors: ['ama', 'bra', 'cast', 'verm'] },
    
    // TIER 4 - Epic
    { id: 'anime_spikes', name: 'Anime Spiky', tier: 'T4', rarity: 'epic', availableColors: ['ama', 'bran', 'cast', 'pre'] },
    { id: 'princesa', name: 'Princesa', tier: 'T4', rarity: 'epic', availableColors: ['bran', 'cast', 'preto'] },
    
    // TIER 5 - Legendary
    { id: 'fluxo_espiritual', name: 'Fluxo Espiritual', tier: 'T5', rarity: 'legendary', availableColors: ['ama', 'bran', 'rosa', 'verm'] },
];

// Color mapping for filename suffix
// Maps internal IDs to display info. 
// Note: Suffixes are handled dynamically in getHairUrl because they vary by hairstyle.
export const HAIR_COLORS: { id: string, label: string, hex: string }[] = [
    { id: '1', label: 'Tipo 1', hex: '#4A3B2A' },
    { id: '2', label: 'Tipo 2', hex: '#000000' },
    { id: '3', label: 'Tipo 3', hex: '#E6BE8A' },
    { id: '4', label: 'Tipo 4', hex: '#8D4004' },
    { id: '5', label: 'Tipo 5', hex: '#FFFFFF' },
    { id: '6', label: 'Tipo 6', hex: '#FFC0CB' },
];

export const getBodyUrl = (gender: Gender, toneId: string): string => {
    // Fallback or find
    const body = BODY_DB.find(b => b.gender === gender && b.toneId === toneId);
    if (!body) return `${AVATAR_BASE_URL}/body_masc_1.png`; // Default
    return `${AVATAR_BASE_URL}/${body.filename}`;
};

export const getHairUrl = (styleId: string, colorId: string): string => {
    const hair = HAIR_DB.find(h => h.id === styleId);
    if (!hair) return '';
    
    // Determine the ID part for the filename (use override or uppercase ID)
    const fileId = hair.filenameId || hair.id.toUpperCase();

    // If hair defines available colors, use index-based selection
    if (hair.availableColors && hair.availableColors.length > 0) {
        // colorId '1' -> index 0
        const index = parseInt(colorId) - 1;
        // Safety check
        const safeIndex = (index >= 0 && index < hair.availableColors.length) ? index : 0;
        const suffix = hair.availableColors[safeIndex];
        return `${AVATAR_BASE_URL}/hair/CABELO_${hair.tier}_${fileId}_${suffix}.png`;
    }

    // Fallback should not happen with current DB, but kept for safety
    return `${AVATAR_BASE_URL}/hair/CABELO_${hair.tier}_${fileId}_cast.png`;
};
