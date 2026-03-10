export type LegacyBackdropSkinId = 'onyx' | 'ivory' | 'emerald' | 'violet' | 'azure';

export interface LegacyBackdropSkin {
    id: LegacyBackdropSkinId;
    name: string;
    shortLabel: string;
    dot: string;
    previewFill: string;
    imageUrl: string;
    overlay: string;
    edgeGlow: string;
}

export const LEGACY_BACKDROP_SKINS: LegacyBackdropSkin[] = [
    {
        id: 'onyx',
        name: 'Onix Imperial',
        shortLabel: '1',
        dot: '#16181f',
        previewFill: 'linear-gradient(135deg, #0d1016 0%, #1c2230 45%, #0a0c11 100%)',
        imageUrl: '/legacy-skins/1.jpg',
        overlay: 'linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.58))',
        edgeGlow: 'rgba(212,175,55,0.16)',
    },
    {
        id: 'ivory',
        name: 'Marfim Aureo',
        shortLabel: '2',
        dot: '#e8e1d4',
        previewFill: 'linear-gradient(135deg, #ece7dc 0%, #d5cec2 46%, #f3efe7 100%)',
        imageUrl: '/legacy-skins/2.jpg',
        overlay: 'linear-gradient(180deg, rgba(14,10,5,0.08), rgba(20,16,10,0.28))',
        edgeGlow: 'rgba(232, 212, 170, 0.18)',
    },
    {
        id: 'emerald',
        name: 'Esmeralda Regia',
        shortLabel: '3',
        dot: '#0f4f45',
        previewFill: 'linear-gradient(135deg, #0d3e37 0%, #16594f 46%, #0d2a27 100%)',
        imageUrl: '/legacy-skins/3.jpg',
        overlay: 'linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0.48))',
        edgeGlow: 'rgba(78, 200, 158, 0.16)',
    },
    {
        id: 'violet',
        name: 'Violeta Regia',
        shortLabel: '4',
        dot: '#4d2f65',
        previewFill: 'linear-gradient(135deg, #351c4a 0%, #583773 46%, #24152f 100%)',
        imageUrl: '/legacy-skins/4.jpg',
        overlay: 'linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0.52))',
        edgeGlow: 'rgba(157, 112, 226, 0.18)',
    },
    {
        id: 'azure',
        name: 'Azul Arcano',
        shortLabel: '5',
        dot: '#12355d',
        previewFill: 'linear-gradient(135deg, #0a2749 0%, #184778 44%, #0a182d 100%)',
        imageUrl: '/legacy-skins/5.jpg',
        overlay: 'linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0.48))',
        edgeGlow: 'rgba(82, 163, 255, 0.18)',
    },
];

export const DEFAULT_LEGACY_BACKDROP_SKIN_ID: LegacyBackdropSkinId = 'onyx';

export const getLegacyBackdropSkin = (id?: string) => {
    return LEGACY_BACKDROP_SKINS.find((skin) => skin.id === id) || LEGACY_BACKDROP_SKINS[0];
};
