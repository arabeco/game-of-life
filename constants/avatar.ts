export * from './GMboard';

export interface SovereignAsset {
    id: string;
    name: string;
    url: string;
}

export const SOVEREIGN_ASSETS: {
    bodies: SovereignAsset[];
    heads: SovereignAsset[];
    outfits: SovereignAsset[];
    artifacts: SovereignAsset[];
    glyphs: SovereignAsset[];
    orbs: SovereignAsset[];
    auras: SovereignAsset[];
    plates: SovereignAsset[];
} = {
    bodies: [
        { id: 'body_standard', name: 'Padrão', url: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/SKIN_T1_NAUFRAGO.png' },
    ],
    heads: [
        { id: 'head_standard', name: 'Padrão', url: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/HEAD_STANDARD.png' }
    ],
    outfits: [
        { id: 'outfit_standard', name: 'Padrão', url: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/avatars/OUTFIT_STANDARD.png' }
    ],
    artifacts: [
        { id: 'artifact_none', name: 'Nenhum', url: '' }
    ],
    glyphs: [
        { id: 'glyph_none', name: 'Nenhum', url: '' }
    ],
    orbs: [
        { id: 'orb_none', name: 'Nenhum', url: '' }
    ],
    auras: [
        { id: 'aura_none', name: 'Nenhuma', url: '' }
    ],
    plates: [
        { id: 'plate_none', name: 'Nenhuma', url: '' }
    ],
};
