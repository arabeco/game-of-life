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
    /** Colour/luminosity grade applied to the photo so each skin reads as its own hour of the day. */
    filter: string;
    /** Crop anchor. Framing the same hall differently is what makes the skins feel like separate places. */
    focus: string;
    /** Extra background-size scale on top of `cover`. */
    zoom: number;
}

export const LEGACY_BACKDROP_SKINS: LegacyBackdropSkin[] = [
    {
        id: 'onyx',
        name: 'Onix Imperial',
        shortLabel: '1',
        dot: '#16181f',
        previewFill: 'linear-gradient(135deg, #0d1016 0%, #1c2230 45%, #0a0c11 100%)',
        imageUrl: '/legacy-skins/archive-hall.webp',
        overlay: 'linear-gradient(180deg, rgba(24,30,42,0.30), rgba(8,10,16,0.56))',
        edgeGlow: 'rgba(212,175,55,0.16)',
        filter: 'contrast(1.12) brightness(0.94) saturate(0.86)',
        focus: 'center top',
        zoom: 1,
    },
    {
        id: 'ivory',
        name: 'Marfim Aureo',
        shortLabel: '2',
        dot: '#e8e1d4',
        previewFill: 'linear-gradient(135deg, #ece7dc 0%, #d5cec2 46%, #f3efe7 100%)',
        imageUrl: '/legacy-skins/archive-hall.webp',
        overlay: 'linear-gradient(180deg, rgba(243,229,193,0.44), rgba(150,120,70,0.34))',
        edgeGlow: 'rgba(232, 212, 170, 0.18)',
        filter: 'brightness(1.32) contrast(0.92) saturate(0.9)',
        focus: 'center 26%',
        zoom: 1.1,
    },
    {
        id: 'emerald',
        name: 'Esmeralda Regia',
        shortLabel: '3',
        dot: '#0f4f45',
        previewFill: 'linear-gradient(135deg, #0d3e37 0%, #16594f 46%, #0d2a27 100%)',
        imageUrl: '/legacy-skins/archive-hall.webp',
        overlay: 'linear-gradient(180deg, rgba(18,120,96,0.52), rgba(4,44,36,0.60))',
        edgeGlow: 'rgba(78, 200, 158, 0.16)',
        filter: 'brightness(0.9) contrast(1.08) saturate(1.15)',
        focus: 'center 48%',
        zoom: 1.18,
    },
    {
        id: 'violet',
        name: 'Violeta Regia',
        shortLabel: '4',
        dot: '#4d2f65',
        previewFill: 'linear-gradient(135deg, #351c4a 0%, #583773 46%, #24152f 100%)',
        imageUrl: '/legacy-skins/archive-hall.webp',
        overlay: 'linear-gradient(180deg, rgba(104,58,158,0.52), rgba(30,12,52,0.60))',
        edgeGlow: 'rgba(157, 112, 226, 0.18)',
        filter: 'brightness(0.86) contrast(1.1) saturate(1.2)',
        focus: 'center 36%',
        zoom: 1.06,
    },
    {
        id: 'azure',
        name: 'Azul Arcano',
        shortLabel: '5',
        dot: '#12355d',
        previewFill: 'linear-gradient(135deg, #0a2749 0%, #184778 44%, #0a182d 100%)',
        imageUrl: '/legacy-skins/archive-hall.webp',
        overlay: 'linear-gradient(180deg, rgba(28,96,176,0.52), rgba(6,24,52,0.60))',
        edgeGlow: 'rgba(82, 163, 255, 0.18)',
        filter: 'brightness(0.8) contrast(1.16) saturate(1.1)',
        focus: 'center 58%',
        zoom: 1.24,
    },
];

export const DEFAULT_LEGACY_BACKDROP_SKIN_ID: LegacyBackdropSkinId = 'onyx';

export const getLegacyBackdropSkin = (id?: string) => {
    return LEGACY_BACKDROP_SKINS.find((skin) => skin.id === id) || LEGACY_BACKDROP_SKINS[0];
};
