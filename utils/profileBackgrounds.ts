export interface ProfileBackgroundOption {
    id: string;
    name: string;
    value: string;
    accessTier?: 'base' | 'premium' | 'platinum';
}

export const PROFILE_BACKGROUND_BUCKET_NAME = 'user-images';
export const PROFILE_BACKGROUND_BUCKET_FOLDER = 'background';
export const PROFILE_BACKGROUND_STORAGE_BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images';
const PROFILE_BACKGROUND_TOKEN_PREFIX = 'profile-bg:';

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
        fallbackValue: 'linear-gradient(135deg, #12161c 0%, #586674 48%, #c7d1dc 100%)',
    },
    [toProfileBackgroundToken('gold')]: {
        basename: 'goldback',
        fallbackValue: 'linear-gradient(135deg, #140b03 0%, #6f4711 48%, #f0d48b 100%)',
    },
    [toProfileBackgroundToken('pink')]: {
        basename: 'pinkback',
        fallbackValue: 'linear-gradient(135deg, #280816 0%, #7e2148 48%, #f29ac2 100%)',
    },
    [toProfileBackgroundToken('aurora')]: {
        basename: 'aurora',
        fallbackValue: 'linear-gradient(135deg, #0a1026 0%, #2c4d8a 45%, #a0d9ff 100%)',
    },
    [toProfileBackgroundToken('cyber')]: {
        basename: 'cyber',
        fallbackValue: 'linear-gradient(135deg, #0b0f1e 0%, #0f6b7b 42%, #7fffd4 100%)',
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
    [toProfileBackgroundToken('ember')]: {
        basename: 'ember',
        fallbackValue: 'linear-gradient(135deg, #1e120b 0%, #8d3d11 42%, #ffb26c 100%)',
    },
    [toProfileBackgroundToken('frost')]: {
        basename: 'frost',
        fallbackValue: 'linear-gradient(135deg, #0d1720 0%, #3f6f94 45%, #c9f1ff 100%)',
    },
    [toProfileBackgroundToken('genesis')]: {
        basename: 'genesis',
        fallbackValue: 'linear-gradient(135deg, #120615 0%, #4f1a64 42%, #f0d7ff 100%)',
    },
    [toProfileBackgroundToken('garden-aurora')]: {
        basename: 'gardenaurora',
        fallbackValue: 'linear-gradient(135deg, #112118 0%, #2c6f73 44%, #b5f5e4 100%)',
    },
    [toProfileBackgroundToken('garden-ember')]: {
        basename: 'gardenember',
        fallbackValue: 'linear-gradient(135deg, #23140c 0%, #92501d 44%, #ffcc80 100%)',
    },
    [toProfileBackgroundToken('garden-frost')]: {
        basename: 'gardenfrost',
        fallbackValue: 'linear-gradient(135deg, #0e1821 0%, #4d7391 44%, #d6f1ff 100%)',
    },
    [toProfileBackgroundToken('land-16')]: {
        basename: '16',
        fallbackValue: 'linear-gradient(135deg, #182233 0%, #456b8b 48%, #b9d5eb 100%)',
    },
    [toProfileBackgroundToken('land-19')]: {
        basename: '19',
        fallbackValue: 'linear-gradient(135deg, #1b2235 0%, #5b6f95 48%, #ccd6ee 100%)',
    },
    [toProfileBackgroundToken('land-22')]: {
        basename: '22',
        fallbackValue: 'linear-gradient(135deg, #18222b 0%, #51687c 48%, #d7dfe8 100%)',
    },
    [toProfileBackgroundToken('land-01')]: {
        basename: 'land01',
        fallbackValue: 'linear-gradient(135deg, #162114 0%, #466a44 48%, #d1e6b8 100%)',
    },
    [toProfileBackgroundToken('office-01')]: {
        basename: 'office1',
        fallbackValue: 'linear-gradient(135deg, #19191a 0%, #4e4438 48%, #cbb99a 100%)',
    },
};

export const buildProfileBackgroundPublicUrl = (fileName: string): string => {
    return `${PROFILE_BACKGROUND_STORAGE_BASE_URL}/${PROFILE_BACKGROUND_BUCKET_FOLDER}/${fileName}`;
};

const buildProfileBackgroundSources = (basename: string): string[] => {
    return [
        buildProfileBackgroundPublicUrl(`${basename}.jpg`),
        buildProfileBackgroundPublicUrl(`${basename}.png`),
        buildProfileBackgroundPublicUrl(`${basename}.jpeg`),
    ];
};

const buildProfileBackgroundAliases = (): Record<string, string> => {
    const aliases: Record<string, string> = {};

    Object.entries(PROFILE_BACKGROUND_ASSETS).forEach(([token, definition]) => {
        buildProfileBackgroundSources(definition.basename).forEach((source) => {
            aliases[source] = token;
        });
    });

    return aliases;
};

export const PROFILE_BACKGROUND_OPTIONS: ProfileBackgroundOption[] = [
    { id: 'gold', name: 'Ouro', value: toProfileBackgroundToken('gold'), accessTier: 'base' },
    { id: 'silver', name: 'Prata', value: toProfileBackgroundToken('silver'), accessTier: 'base' },
    { id: 'black', name: 'Sombra', value: toProfileBackgroundToken('black'), accessTier: 'base' },
    { id: 'blue', name: 'Azul', value: toProfileBackgroundToken('blue'), accessTier: 'premium' },
    { id: 'darkblue', name: 'Abismo', value: toProfileBackgroundToken('darkblue'), accessTier: 'premium' },
    { id: 'pink', name: 'Rosa', value: toProfileBackgroundToken('pink'), accessTier: 'premium' },
    { id: 'aurora', name: 'Aurora', value: toProfileBackgroundToken('aurora'), accessTier: 'premium' },
    { id: 'cyber', name: 'Cyber', value: toProfileBackgroundToken('cyber'), accessTier: 'premium' },
    { id: 'land-16', name: 'Horizonte 16', value: toProfileBackgroundToken('land-16'), accessTier: 'premium' },
    { id: 'land-19', name: 'Horizonte 19', value: toProfileBackgroundToken('land-19'), accessTier: 'premium' },
    { id: 'land-22', name: 'Horizonte 22', value: toProfileBackgroundToken('land-22'), accessTier: 'premium' },
    { id: 'purple', name: 'Roxo', value: toProfileBackgroundToken('purple'), accessTier: 'platinum' },
    { id: 'ruby', name: 'Rubi', value: toProfileBackgroundToken('ruby'), accessTier: 'platinum' },
    { id: 'autumn', name: 'Outono', value: toProfileBackgroundToken('autumn'), accessTier: 'platinum' },
    { id: 'anime', name: 'Anime', value: toProfileBackgroundToken('anime'), accessTier: 'platinum' },
    { id: 'ember', name: 'Ember', value: toProfileBackgroundToken('ember'), accessTier: 'platinum' },
    { id: 'frost', name: 'Frost', value: toProfileBackgroundToken('frost'), accessTier: 'platinum' },
    { id: 'genesis', name: 'Genesis', value: toProfileBackgroundToken('genesis'), accessTier: 'platinum' },
    { id: 'garden-aurora', name: 'Jardim Aurora', value: toProfileBackgroundToken('garden-aurora'), accessTier: 'platinum' },
    { id: 'garden-ember', name: 'Jardim Ember', value: toProfileBackgroundToken('garden-ember'), accessTier: 'platinum' },
    { id: 'garden-frost', name: 'Jardim Frost', value: toProfileBackgroundToken('garden-frost'), accessTier: 'platinum' },
    { id: 'land-01', name: 'Horizonte 01', value: toProfileBackgroundToken('land-01'), accessTier: 'platinum' },
    { id: 'office-01', name: 'Office 01', value: toProfileBackgroundToken('office-01'), accessTier: 'platinum' },
];

const LEGACY_BACKGROUND_ALIASES: Record<string, string> = {
    'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)': toProfileBackgroundToken('silver'),
    'radial-gradient(circle, #bf953f 0%, #fcf6ba 50%, #b38728 100%)': toProfileBackgroundToken('gold'),
    'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)': toProfileBackgroundToken('emerald'),
    ...buildProfileBackgroundAliases(),
};

export const resolveProfileBackgroundValue = (value: string | null | undefined): string => {
    const safeValue = typeof value === 'string' ? value : '';
    return LEGACY_BACKGROUND_ALIASES[safeValue] || safeValue;
};

export const getProfileBackgroundSources = (value: string | null | undefined): string[] => {
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

export const getProfileBackgroundFallbackValue = (value: string | null | undefined): string | undefined => {
    const resolvedValue = resolveProfileBackgroundValue(value);
    return PROFILE_BACKGROUND_ASSETS[resolvedValue]?.fallbackValue;
};

export const getProfileBackgroundPrimarySource = (value: string | null | undefined): string => {
    const resolvedValue = resolveProfileBackgroundValue(value);
    const [primarySource] = getProfileBackgroundSources(resolvedValue);
    return primarySource || resolvedValue;
};

export const getProfileBackgroundBasename = (value: string | null | undefined): string | null => {
    const resolvedValue = resolveProfileBackgroundValue(value);
    const assetDefinition = PROFILE_BACKGROUND_ASSETS[resolvedValue];

    if (assetDefinition) {
        return assetDefinition.basename.toLowerCase();
    }

    try {
        const url = new URL(resolvedValue);
        const fileName = url.pathname.split('/').pop();
        if (!fileName) return null;
        return fileName.replace(/\.[^.]+$/, '').toLowerCase();
    } catch {
        return null;
    }
};

export const isCssProfileBackground = (value: string | null | undefined): boolean => {
    const normalized = resolveProfileBackgroundValue(value).trim().toLowerCase();
    return (
        normalized.includes('gradient(') ||
        normalized.startsWith('var(') ||
        normalized.startsWith('url(') ||
        normalized.startsWith('image-set(')
    );
};
