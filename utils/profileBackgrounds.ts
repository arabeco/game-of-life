export interface ProfileBackgroundOption {
    id: string;
    name: string;
    value: string;
    isPremiumOnly?: boolean;
}

const STORAGE_BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images';
const PROFILE_BACKGROUND_TOKEN_PREFIX = 'profile-bg:';

const svgToDataUri = (svg: string): string =>
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        svg.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim(),
    )}`;

const GOLD_TEXTURE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="none">
  <defs>
    <linearGradient id="goldBase" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#090603"/>
      <stop offset="22%" stop-color="#241505"/>
      <stop offset="48%" stop-color="#6f4711"/>
      <stop offset="66%" stop-color="#3d2408"/>
      <stop offset="100%" stop-color="#080503"/>
    </linearGradient>
    <radialGradient id="goldGlow" cx="50%" cy="-8%" r="68%">
      <stop offset="0%" stop-color="#f6dda0" stop-opacity="0.95"/>
      <stop offset="18%" stop-color="#d7ab49" stop-opacity="0.72"/>
      <stop offset="42%" stop-color="#8e5c17" stop-opacity="0.28"/>
      <stop offset="78%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldBeam" x1="50%" y1="0" x2="50%" y2="1">
      <stop offset="0%" stop-color="#f7e8bb" stop-opacity="0.35"/>
      <stop offset="12%" stop-color="#e7bf63" stop-opacity="0.24"/>
      <stop offset="40%" stop-color="#c18426" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="17" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.22"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" in2="noise" mode="screen"/>
    </filter>
  </defs>
  <rect width="1600" height="900" fill="#050302"/>
  <rect width="1600" height="900" fill="url(#goldBase)"/>
  <rect width="1600" height="900" fill="url(#goldGlow)"/>
  <rect x="480" y="0" width="640" height="900" fill="url(#goldBeam)" opacity="0.9"/>
  <ellipse cx="800" cy="102" rx="355" ry="86" fill="#ffefb8" opacity="0.16"/>
  <rect width="1600" height="900" fill="#e0b453" opacity="0.22" filter="url(#grain)"/>
  <rect width="1600" height="900" fill="none" stroke="#f4db9d" stroke-opacity="0.08" stroke-width="10"/>
</svg>
`);

const SILVER_TEXTURE = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="none">
  <defs>
    <linearGradient id="steelBase" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#05070a"/>
      <stop offset="18%" stop-color="#1d232a"/>
      <stop offset="50%" stop-color="#8d98a3"/>
      <stop offset="78%" stop-color="#2b3138"/>
      <stop offset="100%" stop-color="#040608"/>
    </linearGradient>
    <linearGradient id="steelSheen" x1="50%" y1="0" x2="50%" y2="1">
      <stop offset="0%" stop-color="#eef4fa" stop-opacity="0.2"/>
      <stop offset="18%" stop-color="#f8fbff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <pattern id="brush" width="1600" height="8" patternUnits="userSpaceOnUse">
      <rect width="1600" height="8" fill="transparent"/>
      <path d="M0 1H1600 M0 4H1600 M0 7H1600" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
      <path d="M0 2H1600 M0 6H1600" stroke="#000000" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
    <filter id="grain" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" seed="11" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="table" tableValues="0 0.18"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" in2="noise" mode="overlay"/>
    </filter>
  </defs>
  <rect width="1600" height="900" fill="#050608"/>
  <rect width="1600" height="900" fill="url(#steelBase)"/>
  <rect x="420" y="0" width="760" height="900" fill="url(#steelSheen)" opacity="0.95"/>
  <rect width="1600" height="900" fill="url(#brush)" opacity="0.58"/>
  <rect width="1600" height="900" fill="#dfe8f0" opacity="0.16" filter="url(#grain)"/>
  <rect width="1600" height="900" fill="none" stroke="#d9e2ea" stroke-opacity="0.08" stroke-width="10"/>
</svg>
`);

interface ProfileBackgroundAssetDefinition {
    basename: string;
    fallbackValue: string;
}

const toProfileBackgroundToken = (id: string): string => `${PROFILE_BACKGROUND_TOKEN_PREFIX}${id}`;

const PROFILE_BACKGROUND_ASSETS: Record<string, ProfileBackgroundAssetDefinition> = {
    [toProfileBackgroundToken('black')]: {
        basename: 'blackback',
        fallbackValue: 'linear-gradient(180deg, #101010 0%, #000000 100%)',
    },
    [toProfileBackgroundToken('blue')]: {
        basename: 'blueback',
        fallbackValue: 'linear-gradient(135deg, #061326 0%, #0f4c81 50%, #57a8ff 100%)',
    },
    [toProfileBackgroundToken('darkblue')]: {
        basename: 'darkblueback',
        fallbackValue: 'linear-gradient(180deg, #050914 0%, #0c1830 55%, #142848 100%)',
    },
    [toProfileBackgroundToken('silver')]: {
        basename: 'silverback',
        fallbackValue: SILVER_TEXTURE,
    },
    [toProfileBackgroundToken('gold')]: {
        basename: 'goldback',
        fallbackValue: GOLD_TEXTURE,
    },
    [toProfileBackgroundToken('pink')]: {
        basename: 'pinkback',
        fallbackValue: 'linear-gradient(135deg, #280816 0%, #7e2148 48%, #f29ac2 100%)',
    },
    [toProfileBackgroundToken('purple')]: {
        basename: 'purpleback',
        fallbackValue: 'linear-gradient(135deg, #13051f 0%, #4e1778 50%, #b56cff 100%)',
    },
    [toProfileBackgroundToken('violet')]: {
        basename: 'violetback',
        fallbackValue: 'linear-gradient(135deg, #17061f 0%, #5d2383 46%, #d18cff 100%)',
    },
    [toProfileBackgroundToken('emerald')]: {
        basename: 'emeraldback',
        fallbackValue: 'linear-gradient(135deg, #071b17 0%, #0f5132 42%, #78d6a3 100%)',
    },
    [toProfileBackgroundToken('ruby')]: {
        basename: 'rubiback',
        fallbackValue: 'linear-gradient(135deg, #140207 0%, #4d0b1d 48%, #c63d5d 100%)',
    },
    [toProfileBackgroundToken('white')]: {
        basename: 'whiteback',
        fallbackValue: 'linear-gradient(180deg, #f4f4f4 0%, #dedede 100%)',
    },
    [toProfileBackgroundToken('autumn')]: {
        basename: 'autunback',
        fallbackValue: 'linear-gradient(135deg, #2b1206 0%, #784019 45%, #d7a45d 100%)',
    },
    [toProfileBackgroundToken('anime')]: {
        basename: 'animeback',
        fallbackValue: 'linear-gradient(135deg, #1d1025 0%, #4f2a73 48%, #ff8ab5 100%)',
    },
};

const buildProfileBackgroundSources = (basename: string): string[] => {
    return [
        `${STORAGE_BASE_URL}/background/${basename}.jpg`,
        `${STORAGE_BASE_URL}/background/${basename}.png`,
        `${STORAGE_BASE_URL}/background/${basename}.jpeg`,
    ];
};

export const PROFILE_BACKGROUND_OPTIONS: ProfileBackgroundOption[] = [
    { id: 'gold', name: 'Gold', value: toProfileBackgroundToken('gold') },
    { id: 'silver', name: 'Silver', value: toProfileBackgroundToken('silver') },
    { id: 'black', name: 'Black', value: toProfileBackgroundToken('black'), isPremiumOnly: true },
    { id: 'blue', name: 'Blue', value: toProfileBackgroundToken('blue'), isPremiumOnly: true },
    { id: 'darkblue', name: 'Dark Blue', value: toProfileBackgroundToken('darkblue'), isPremiumOnly: true },
    { id: 'violet', name: 'Violet', value: toProfileBackgroundToken('violet'), isPremiumOnly: true },
    { id: 'pink', name: 'Pink', value: toProfileBackgroundToken('pink'), isPremiumOnly: true },
    { id: 'purple', name: 'Purple', value: toProfileBackgroundToken('purple'), isPremiumOnly: true },
    { id: 'ruby', name: 'Rubi', value: toProfileBackgroundToken('ruby'), isPremiumOnly: true },
    { id: 'white', name: 'White', value: toProfileBackgroundToken('white'), isPremiumOnly: true },
    { id: 'autumn', name: 'Autumn', value: toProfileBackgroundToken('autumn'), isPremiumOnly: true },
    { id: 'anime', name: 'Anime', value: toProfileBackgroundToken('anime'), isPremiumOnly: true },
];

const LEGACY_BACKGROUND_ALIASES: Record<string, string> = {
    'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)': toProfileBackgroundToken('silver'),
    'radial-gradient(circle, #bf953f 0%, #fcf6ba 50%, #b38728 100%)': toProfileBackgroundToken('gold'),
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)': toProfileBackgroundToken('emerald'),
    SILVER_TEXTURE: toProfileBackgroundToken('silver'),
    GOLD_TEXTURE: toProfileBackgroundToken('gold'),
};

export const resolveProfileBackgroundValue = (value: string): string => {
    return LEGACY_BACKGROUND_ALIASES[value] || value;
};

export const getProfileBackgroundSources = (value: string): string[] => {
    const resolvedValue = resolveProfileBackgroundValue(value);
    const assetDefinition = PROFILE_BACKGROUND_ASSETS[resolvedValue];

    if (assetDefinition) {
        return buildProfileBackgroundSources(assetDefinition.basename);
    }

    if (!resolvedValue || isCssProfileBackground(resolvedValue)) {
        return [];
    }

    return [resolvedValue];
};

export const getProfileBackgroundFallbackValue = (value: string): string | undefined => {
    const resolvedValue = resolveProfileBackgroundValue(value);
    return PROFILE_BACKGROUND_ASSETS[resolvedValue]?.fallbackValue;
};

export const isCssProfileBackground = (value: string): boolean => {
    const normalized = resolveProfileBackgroundValue(value).trim().toLowerCase();
    return (
        normalized.includes('gradient(') ||
        normalized.startsWith('var(') ||
        normalized.startsWith('url(') ||
        normalized.startsWith('image-set(')
    );
};
