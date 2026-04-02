import React, { useId } from 'react';

export type EraRibbonSkin = {
    id: string;
    name: string;
    accessTier: 'base' | 'platinum';
    baseTop: string;
    baseBottom: string;
    glow: string;
    edge: string;
    sigil: string;
    metal: string;
    pattern: 'runes' | 'chevrons' | 'sigils' | 'strata';
};

export const ERA_RIBBON_SKINS: EraRibbonSkin[] = [
    {
        id: 'foundry-free',
        name: 'Foundry',
        accessTier: 'base',
        baseTop: '#161616',
        baseBottom: '#050505',
        glow: '#7dd3fc',
        edge: '#8b8b8b',
        sigil: '#d4d4d4',
        metal: '#5f5f5f',
        pattern: 'chevrons',
    },
    {
        id: 'royal-gold',
        name: 'Royal Gold',
        accessTier: 'platinum',
        baseTop: '#3a2a10',
        baseBottom: '#090603',
        glow: '#facc15',
        edge: '#f6e3a1',
        sigil: '#ffe08a',
        metal: '#a16207',
        pattern: 'sigils',
    },
    {
        id: 'obsidian-rune',
        name: 'Obsidian Rune',
        accessTier: 'platinum',
        baseTop: '#151127',
        baseBottom: '#05030d',
        glow: '#c084fc',
        edge: '#c4b5fd',
        sigil: '#e9d5ff',
        metal: '#4c1d95',
        pattern: 'runes',
    },
    {
        id: 'verdigris-relic',
        name: 'Verdigris Relic',
        accessTier: 'platinum',
        baseTop: '#0f2925',
        baseBottom: '#030807',
        glow: '#5eead4',
        edge: '#99f6e4',
        sigil: '#ccfbf1',
        metal: '#0f766e',
        pattern: 'strata',
    },
];

const SKINS_BY_ID = ERA_RIBBON_SKINS.reduce<Record<string, EraRibbonSkin>>((accumulator, skin) => {
    accumulator[skin.id] = skin;
    return accumulator;
}, {});

export const getEraRibbonSkin = (skinId?: string) => {
    if (!skinId) return ERA_RIBBON_SKINS[0];
    return SKINS_BY_ID[skinId] || ERA_RIBBON_SKINS[0];
};

const PatternLayer: React.FC<{ patternId: string; skin: EraRibbonSkin }> = ({ patternId, skin }) => {
    switch (skin.pattern) {
        case 'runes':
            return (
                <pattern id={patternId} width="40" height="56" patternUnits="userSpaceOnUse">
                    <path d="M8 18h8M24 18h8M12 10l4 8-4 8M28 10l-4 8 4 8" stroke={skin.sigil} strokeWidth="1.3" strokeLinecap="round" opacity="0.22" />
                    <circle cx="20" cy="28" r="2" fill={skin.glow} opacity="0.28" />
                </pattern>
            );
        case 'sigils':
            return (
                <pattern id={patternId} width="40" height="64" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="18" r="5" fill="none" stroke={skin.sigil} strokeWidth="1.4" opacity="0.24" />
                    <path d="M20 28l3.5 6h-7z" fill={skin.glow} opacity="0.18" />
                    <path d="M14 44h12M20 38v12" stroke={skin.sigil} strokeWidth="1.2" opacity="0.2" strokeLinecap="round" />
                </pattern>
            );
        case 'strata':
            return (
                <pattern id={patternId} width="40" height="48" patternUnits="userSpaceOnUse">
                    <path d="M0 10c8 6 16 6 24 0s16-6 16 0" stroke={skin.sigil} strokeWidth="1.2" opacity="0.16" fill="none" />
                    <path d="M0 26c8 6 16 6 24 0s16-6 16 0" stroke={skin.glow} strokeWidth="1.1" opacity="0.18" fill="none" />
                    <path d="M0 40c8 6 16 6 24 0s16-6 16 0" stroke={skin.sigil} strokeWidth="1" opacity="0.12" fill="none" />
                </pattern>
            );
        default:
            return (
                <pattern id={patternId} width="40" height="44" patternUnits="userSpaceOnUse">
                    <path d="M8 10l12 10 12-10" stroke={skin.sigil} strokeWidth="1.1" opacity="0.18" fill="none" strokeLinecap="round" />
                    <path d="M8 24l12 10 12-10" stroke={skin.glow} strokeWidth="1.1" opacity="0.18" fill="none" strokeLinecap="round" />
                </pattern>
            );
    }
};

export const EraRibbon: React.FC<{
    label: string;
    skinId?: string;
    className?: string;
    locked?: boolean;
}> = ({ label, skinId, className = '', locked = false }) => {
    const reactId = useId().replace(/:/g, '');
    const skin = getEraRibbonSkin(skinId);
    const gradientId = `${reactId}-gradient`;
    const glowId = `${reactId}-glow`;
    const patternId = `${reactId}-pattern`;

    return (
        <div className={`relative h-full w-8 overflow-hidden rounded-sm ${className}`.trim()}>
            <svg viewBox="0 0 40 320" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={skin.baseTop} />
                        <stop offset="42%" stopColor={skin.metal} />
                        <stop offset="100%" stopColor={skin.baseBottom} />
                    </linearGradient>
                    <linearGradient id={glowId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={skin.edge} stopOpacity="0.15" />
                        <stop offset="50%" stopColor={skin.glow} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={skin.edge} stopOpacity="0.15" />
                    </linearGradient>
                    <PatternLayer patternId={patternId} skin={skin} />
                </defs>

                <rect x="0" y="0" width="40" height="320" rx="6" fill={`url(#${gradientId})`} />
                <rect x="1.2" y="1.2" width="37.6" height="317.6" rx="5" fill={`url(#${patternId})`} opacity="0.85" />
                <rect x="2" y="2" width="36" height="316" rx="4" fill="none" stroke={skin.edge} strokeOpacity="0.35" strokeWidth="1.4" />
                <rect x="18.8" y="18" width="2.4" height="284" rx="999" fill={`url(#${glowId})`} opacity="0.72" />
                <path d="M7 16h26l-3 12H10z" fill={skin.metal} opacity="0.9" />
                <path d="M7 304h26l-3-12H10z" fill={skin.metal} opacity="0.9" />
                {[48, 102, 156, 210, 264].map((y) => (
                    <g key={y}>
                        <circle cx="20" cy={y} r="5.5" fill={skin.baseBottom} stroke={skin.edge} strokeOpacity="0.55" strokeWidth="1.2" />
                        <path d={`M20 ${y - 3.5}l2.6 3.5-2.6 3.5-2.6-3.5z`} fill={skin.glow} opacity="0.72" />
                    </g>
                ))}
            </svg>

            <div className="pointer-events-none absolute inset-[2px] rounded-sm bg-[linear-gradient(180deg,rgba(255,255,255,0.16),transparent_22%,transparent_78%,rgba(255,255,255,0.08))]" />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_12px_rgba(0,0,0,0.5)]" />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-[3px]">
                <span
                    className="max-h-full overflow-hidden text-[8px] font-black uppercase tracking-[0.28em] text-white/90 drop-shadow-[0_0_8px_rgba(0,0,0,0.65)]"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                >
                    {label}
                </span>
            </div>

            {locked && (
                <div className="pointer-events-none absolute inset-x-[3px] top-2 rounded-full border border-white/15 bg-black/45 px-1 py-0.5 text-center text-[7px] font-black uppercase tracking-[0.18em] text-amber-200/80 backdrop-blur-sm">
                    Pro
                </div>
            )}
        </div>
    );
};
