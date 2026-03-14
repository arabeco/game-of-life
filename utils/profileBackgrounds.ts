export interface ProfileBackgroundOption {
    id: string;
    name: string;
    value: string;
    isPremiumOnly?: boolean;
}

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

export const PROFILE_BACKGROUND_OPTIONS: ProfileBackgroundOption[] = [
    { id: 'random', name: 'Aleatoria', value: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800&h=450' },
    { id: 'slate', name: 'Sobrio', value: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' },
    { id: 'ocean', name: 'Oceano Profundo', value: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
    { id: 'nebula', name: 'Nebulosa Premium', value: 'linear-gradient(45deg, #7028e4 0%, #e5b2ca 100%)' },
    { id: 'silver', name: 'Prata Escovada', value: SILVER_TEXTURE },
    { id: 'cyber', name: 'Cyber Neon', value: 'linear-gradient(135deg, #FF0080 0%, #00E0FF 100%)' },
    { id: 'noir', name: 'Noir Elegante', value: 'radial-gradient(circle at 50% -10%, #333 0%, #000 80%)' },
    { id: 'sunset', name: 'Amanhecer', value: 'linear-gradient(to right, #ff5f6d, #ffc371)', isPremiumOnly: true },
    { id: 'midnight', name: 'Noite Profunda', value: 'linear-gradient(180deg, #2c3e50 0%, #000000 100%)', isPremiumOnly: true },
    { id: 'emerald', name: 'Floresta Esmeralda', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', isPremiumOnly: true },
    { id: 'gold_dust', name: 'Ouro Forjado', value: GOLD_TEXTURE, isPremiumOnly: true },
    { id: 'royal', name: 'Veludo Real', value: 'linear-gradient(45deg, #800080 0%, #ff00ff 100%)', isPremiumOnly: true },
];

const LEGACY_BACKGROUND_ALIASES: Record<string, string> = {
    'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)': SILVER_TEXTURE,
    'radial-gradient(circle, #bf953f 0%, #fcf6ba 50%, #b38728 100%)': GOLD_TEXTURE,
};

export const resolveProfileBackgroundValue = (value: string): string => {
    return LEGACY_BACKGROUND_ALIASES[value] || value;
};

export const isCssProfileBackground = (value: string): boolean => {
    const normalized = value.trim().toLowerCase();
    return (
        normalized.includes('gradient(') ||
        normalized.startsWith('var(') ||
        normalized.startsWith('url(') ||
        normalized.startsWith('image-set(')
    );
};
