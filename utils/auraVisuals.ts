type AuraVisual = {
    core: string;
    bloom: string;
    haze: string;
    ring: string;
    spark: string;
    shadow: string;
};

const DEFAULT_AURA_VISUAL: AuraVisual = {
    core: 'rgba(241, 245, 249, 0.34)',
    bloom: 'rgba(148, 163, 184, 0.28)',
    haze: 'rgba(255, 255, 255, 0.18)',
    ring: 'rgba(226, 232, 240, 0.22)',
    spark: 'rgba(255, 255, 255, 0.16)',
    shadow: 'rgba(226, 232, 240, 0.22)',
};

const AURA_KEY_ALIASES: Record<string, string> = {
    item_aura_1_001: 'bruma',
    item_aura_1_002: 'safira',
    item_aura_1_003: 'rubi',
    item_aura_2_001: 'esmeralda',
    item_aura_2_002: 'prata',
    item_aura_3_001: 'ouro',
    item_aura_5_001: 'pedra da lua',
    item_aura_5_002: 'multiverso',
    item_aura_exclusive_001: 'fenix dourada',
};

const AURA_VISUALS: Record<string, AuraVisual> = {
    bruma: {
        core: 'rgba(226, 232, 240, 0.34)',
        bloom: 'rgba(148, 163, 184, 0.28)',
        haze: 'rgba(255, 255, 255, 0.16)',
        ring: 'rgba(226, 232, 240, 0.18)',
        spark: 'rgba(255, 255, 255, 0.12)',
        shadow: 'rgba(226, 232, 240, 0.24)',
    },
    safira: {
        core: 'rgba(56, 189, 248, 0.38)',
        bloom: 'rgba(37, 99, 235, 0.28)',
        haze: 'rgba(125, 211, 252, 0.2)',
        ring: 'rgba(96, 165, 250, 0.24)',
        spark: 'rgba(191, 219, 254, 0.2)',
        shadow: 'rgba(59, 130, 246, 0.28)',
    },
    rubi: {
        core: 'rgba(248, 113, 113, 0.38)',
        bloom: 'rgba(220, 38, 38, 0.28)',
        haze: 'rgba(252, 165, 165, 0.18)',
        ring: 'rgba(248, 113, 113, 0.24)',
        spark: 'rgba(254, 202, 202, 0.18)',
        shadow: 'rgba(239, 68, 68, 0.28)',
    },
    esmeralda: {
        core: 'rgba(74, 222, 128, 0.36)',
        bloom: 'rgba(22, 163, 74, 0.28)',
        haze: 'rgba(134, 239, 172, 0.18)',
        ring: 'rgba(74, 222, 128, 0.22)',
        spark: 'rgba(220, 252, 231, 0.16)',
        shadow: 'rgba(34, 197, 94, 0.28)',
    },
    prata: {
        core: 'rgba(226, 232, 240, 0.36)',
        bloom: 'rgba(148, 163, 184, 0.26)',
        haze: 'rgba(255, 255, 255, 0.22)',
        ring: 'rgba(203, 213, 225, 0.2)',
        spark: 'rgba(255, 255, 255, 0.18)',
        shadow: 'rgba(226, 232, 240, 0.24)',
    },
    ouro: {
        core: 'rgba(250, 204, 21, 0.4)',
        bloom: 'rgba(202, 138, 4, 0.3)',
        haze: 'rgba(254, 240, 138, 0.18)',
        ring: 'rgba(250, 204, 21, 0.24)',
        spark: 'rgba(254, 249, 195, 0.18)',
        shadow: 'rgba(234, 179, 8, 0.3)',
    },
    'pedra da lua': {
        core: 'rgba(196, 181, 253, 0.4)',
        bloom: 'rgba(109, 40, 217, 0.28)',
        haze: 'rgba(233, 213, 255, 0.2)',
        ring: 'rgba(192, 132, 252, 0.24)',
        spark: 'rgba(243, 232, 255, 0.2)',
        shadow: 'rgba(168, 85, 247, 0.3)',
    },
    multiverso: {
        core: 'rgba(129, 140, 248, 0.38)',
        bloom: 'rgba(217, 70, 239, 0.24)',
        haze: 'rgba(56, 189, 248, 0.18)',
        ring: 'rgba(168, 85, 247, 0.2)',
        spark: 'rgba(191, 219, 254, 0.16)',
        shadow: 'rgba(147, 51, 234, 0.32)',
    },
    'fenix dourada': {
        core: 'rgba(251, 191, 36, 0.4)',
        bloom: 'rgba(249, 115, 22, 0.28)',
        haze: 'rgba(254, 240, 138, 0.18)',
        ring: 'rgba(251, 191, 36, 0.26)',
        spark: 'rgba(255, 247, 237, 0.18)',
        shadow: 'rgba(249, 115, 22, 0.28)',
    },
};

const normalizeAuraKey = (value?: string | null): string => {
    if (!value) return '';
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
};

export const getAuraVisual = (value?: string | null): AuraVisual => {
    const normalized = normalizeAuraKey(value);
    const key = AURA_KEY_ALIASES[normalized] || normalized;
    return AURA_VISUALS[key] || DEFAULT_AURA_VISUAL;
};

export const getAuraBackground = (value?: string | null): string => {
    const aura = getAuraVisual(value);
    return [
        `radial-gradient(circle at 50% 52%, ${aura.core} 0%, ${aura.bloom} 24%, rgba(255,255,255,0.06) 38%, transparent 68%)`,
        `radial-gradient(circle at 28% 30%, ${aura.spark} 0%, transparent 26%)`,
        `radial-gradient(circle at 72% 28%, ${aura.haze} 0%, transparent 30%)`,
        `radial-gradient(circle at 50% 78%, ${aura.ring} 0%, transparent 34%)`,
    ].join(', ');
};

export const drawAuraCanvasEffect = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    value?: string | null,
): void => {
    if (!value || value === 'none') return;

    const aura = getAuraVisual(value);
    const centerX = width / 2;
    const centerY = height * 0.55;
    const radius = Math.min(width, height) * 0.42;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const outerGlow = ctx.createRadialGradient(centerX, centerY, radius * 0.1, centerX, centerY, radius);
    outerGlow.addColorStop(0, aura.core);
    outerGlow.addColorStop(0.42, aura.bloom);
    outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outerGlow;
    ctx.fillRect(0, 0, width, height);

    const sideGlow = ctx.createRadialGradient(centerX * 0.82, centerY * 1.02, radius * 0.06, centerX * 0.82, centerY * 1.02, radius * 0.72);
    sideGlow.addColorStop(0, aura.haze);
    sideGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sideGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.filter = `blur(${Math.max(10, Math.round(radius * 0.08))}px)`;
    ctx.strokeStyle = aura.ring;
    ctx.lineWidth = Math.max(8, radius * 0.1);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.56, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = aura.spark;
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.24, radius * 0.12, 0, Math.PI * 2);
    ctx.arc(centerX + radius * 0.26, centerY - radius * 0.28, radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};
