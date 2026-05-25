import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GardenPlacedItem, GardenRakePressure, GardenRakeSpacing, GardenRakeStyle, GardenSandColor, GardenState, GardenStroke, GardenStrokePoint, UserProfile } from '../types';
import { useGame } from '../contexts/GameContext';
import { ItemDef, resolveItemDef } from '../constants/items';
import { Portal } from './Portal';
import { ChevronLeftIcon, ChevronRightIcon, Trash2Icon, XIcon } from './Icons';
import { ConfirmationModal } from './ConfirmationModal';

type SandDef = {
    id: GardenSandColor;
    label: string;
    description: string;
    color: string;
    groove: string;
    speck: string;
    trough: string;
    ridge: string;
    buried: string;
};

type GardenItemDef = {
    itemId: string;
    label: string;
    kind: 'stone' | 'plant';
    className: string;
    imageUrl?: string;
    icon?: string;
};

const SAND_COLORS: SandDef[] = [
    { id: 'classic', label: 'Dourada', description: 'quente', color: '#c6a15f', groove: 'rgba(74, 48, 22, 0.52)', speck: 'rgba(236, 208, 146, 0.68)', trough: 'rgba(91, 58, 24, 0.44)', ridge: 'rgba(248, 226, 170, 0.62)', buried: 'rgba(48, 28, 10, 0.42)' },
    { id: 'white', label: 'Branca', description: 'limpa', color: '#ddd2b8', groove: 'rgba(78, 67, 51, 0.46)', speck: 'rgba(250, 244, 225, 0.78)', trough: 'rgba(94, 82, 62, 0.38)', ridge: 'rgba(255, 251, 235, 0.68)', buried: 'rgba(52, 42, 29, 0.34)' },
    { id: 'basalt', label: 'Basalto', description: 'seca', color: '#8f816b', groove: 'rgba(36, 28, 20, 0.56)', speck: 'rgba(201, 185, 154, 0.56)', trough: 'rgba(37, 28, 18, 0.46)', ridge: 'rgba(188, 169, 134, 0.58)', buried: 'rgba(18, 14, 10, 0.4)' },
];

const RAKE_STYLES: Array<{ id: GardenRakeStyle; label: string; shortLabel: string; description: string; lines: number; gap: number; width: number; alpha: number }> = [
    { id: 'fine', label: 'Fino', shortLabel: 'F', description: '3 finas', lines: 3, gap: 5.2, width: 0.54, alpha: 0.3 },
    { id: 'three', label: 'Classico', shortLabel: 'C', description: '4 calmas', lines: 4, gap: 8.4, width: 0.84, alpha: 0.43 },
    { id: 'wide', label: 'Campo', shortLabel: 'M', description: '6 largas', lines: 6, gap: 9.4, width: 1.28, alpha: 0.5 },
    { id: 'open', label: 'Zen', shortLabel: 'Z', description: '5 abertas', lines: 5, gap: 12.4, width: 0.76, alpha: 0.38 },
    { id: 'deep', label: 'Profundo', shortLabel: 'P', description: '5 fundas', lines: 5, gap: 12.2, width: 2.25, alpha: 0.78 },
];

const RAKE_PRESSURES: Array<{ id: GardenRakePressure; label: string; shortLabel: string; width: number; alpha: number }> = [
    { id: 'light', label: 'Fraco', shortLabel: 'F', width: 0.56, alpha: 0.54 },
    { id: 'medium', label: 'Medio', shortLabel: 'M', width: 1, alpha: 0.96 },
    { id: 'strong', label: 'Forte', shortLabel: 'G', width: 1.78, alpha: 1.34 },
];

const RAKE_SPACINGS: Array<{ id: GardenRakeSpacing; label: string; shortLabel: string; multiplier: number }> = [
    { id: 'tight', label: 'Junto', shortLabel: 'J', multiplier: 0.78 },
    { id: 'normal', label: 'Medio', shortLabel: 'M', multiplier: 1 },
    { id: 'wide', label: 'Aberto', shortLabel: 'A', multiplier: 1.45 },
    { id: 'huge', label: 'Grande', shortLabel: 'G', multiplier: 2.05 },
];

const GARDEN_ITEM_BASE_SIZE: Record<string, number> = {
    item_garden_stone_1: 76,
    item_garden_stone_2: 84,
    item_garden_stone_3: 90,
    item_garden_plant_1: 82,
    item_garden_plant_2: 96,
    item_garden_tool_1: 92,
    item_garden_lantern_1: 92,
    item_garden_bridge_1: 112,
    item_garden_statue_1: 98,
};

const getGardenItemBaseSize = (itemId: string, kind: GardenItemDef['kind']) =>
    GARDEN_ITEM_BASE_SIZE[itemId] || (kind === 'plant' ? 82 : 78);

const GARDEN_LOAD_STYLE = `
@keyframes gardenLoad {
    from { transform: scaleX(0.08); opacity: 0.68; }
    to { transform: scaleX(1); opacity: 1; }
}
`;

const GARDEN_ITEMS: GardenItemDef[] = [
    { itemId: 'item_garden_stone_1', label: 'Pedra Serena', kind: 'stone', className: 'from-stone-300 via-stone-500 to-stone-800' },
    { itemId: 'item_garden_stone_2', label: 'Pedra Lunar', kind: 'stone', className: 'from-zinc-100 via-zinc-300 to-zinc-600' },
    { itemId: 'item_garden_stone_3', label: 'Pedra Obsidiana', kind: 'stone', className: 'from-neutral-500 via-neutral-800 to-black' },
    { itemId: 'item_garden_plant_1', label: 'Musgo Vivo', kind: 'plant', className: 'from-emerald-300 via-emerald-600 to-lime-900' },
    { itemId: 'item_garden_plant_2', label: 'Bambu Jovem', kind: 'plant', className: 'from-lime-200 via-green-500 to-emerald-900' },
    { itemId: 'item_garden_tool_1', label: 'Garfo de Areia', kind: 'stone', className: 'from-amber-200 via-yellow-700 to-stone-900' },
    { itemId: 'item_garden_lantern_1', label: 'Lanterna de Pedra', kind: 'stone', className: 'from-zinc-200 via-stone-500 to-neutral-900' },
    { itemId: 'item_garden_bridge_1', label: 'Ponte de Madeira', kind: 'stone', className: 'from-amber-300 via-orange-800 to-stone-950' },
    { itemId: 'item_garden_statue_1', label: 'Estatua de Meditacao', kind: 'stone', className: 'from-stone-200 via-stone-500 to-stone-900' },
];

const getSandDef = (id?: GardenSandColor) => SAND_COLORS.find((sand) => sand.id === id) || SAND_COLORS[0];
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const getCanvasCssSize = (canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    return {
        width: Math.max(1, rect.width || canvas.clientWidth || canvas.width),
        height: Math.max(1, rect.height || canvas.clientHeight || canvas.height),
        dpr: Math.max(1, canvas.width / Math.max(1, rect.width || canvas.clientWidth || canvas.width)),
    };
};

const prepareCanvasContext = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, clear = false) => {
    const { width, height, dpr } = getCanvasCssSize(canvas);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height };
};

const fillSandBase = (ctx: CanvasRenderingContext2D, sand: SandDef, width: number, height: number) => {
    const gradient = ctx.createRadialGradient(width * 0.38, height * 0.25, 0, width * 0.5, height * 0.52, Math.max(width, height) * 0.94);
    gradient.addColorStop(0, sand.color);
    gradient.addColorStop(0.38, sand.color);
    gradient.addColorStop(0.74, 'rgba(165, 126, 70, 0.74)');
    gradient.addColorStop(1, 'rgba(62, 39, 18, 0.42)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    const lightSweep = ctx.createLinearGradient(0, 0, width, height);
    lightSweep.addColorStop(0, 'rgba(255,249,226,0.18)');
    lightSweep.addColorStop(0.2, 'rgba(255,255,255,0.04)');
    lightSweep.addColorStop(0.5, 'rgba(255,244,207,0.1)');
    lightSweep.addColorStop(1, 'rgba(77,50,24,0.12)');
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = lightSweep;
    ctx.fillRect(0, 0, width, height);

    const grainCount = Math.min(950, Math.max(260, Math.floor((width * height) / 1600)));
    for (let i = 0; i < grainCount; i += 1) {
        const x = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * width;
        const y = Math.abs((Math.sin(i * 78.233) * 23421.631) % 1) * height;
        const a = Math.abs((Math.sin(i * 39.425) * 11317.923) % 1);
        ctx.globalAlpha = 0.035 + a * 0.065;
        ctx.fillStyle = i % 4 === 0
            ? 'rgba(255,246,214,0.58)'
            : i % 4 === 1
                ? sand.trough
                : 'rgba(49,33,17,0.18)';
        const size = a > 0.975 ? 1.05 : a > 0.82 ? 0.7 : 0.38;
        ctx.beginPath();
        ctx.ellipse(x, y, size * 1.25, size * 0.78, a * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    const pebbleCount = Math.min(240, Math.max(55, Math.floor((width * height) / 6200)));
    for (let i = 0; i < pebbleCount; i += 1) {
        const x = Math.abs((Math.sin(i * 91.173) * 19283.293) % 1) * width;
        const y = Math.abs((Math.sin(i * 47.871) * 56124.772) % 1) * height;
        const a = Math.abs((Math.sin(i * 11.713) * 17321.31) % 1);
        ctx.globalAlpha = 0.035 + a * 0.055;
        ctx.fillStyle = a > 0.55 ? 'rgba(69,56,42,0.42)' : 'rgba(255,247,219,0.38)';
        ctx.beginPath();
        ctx.ellipse(x, y, 0.8 + a * 1.35, 0.45 + a * 0.75, a * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = sand.groove;
    ctx.lineWidth = 0.72;
    for (let y = -24; y < height + 28; y += 19) {
        ctx.beginPath();
        ctx.moveTo(-16, y);
        ctx.bezierCurveTo(width * 0.28, y + 4, width * 0.62, y - 5, width + 16, y + 2);
        ctx.stroke();
    }

    ctx.globalAlpha = 0.18;
    const centerAir = ctx.createRadialGradient(width * 0.5, height * 0.42, 0, width * 0.5, height * 0.42, Math.max(width, height) * 0.72);
    centerAir.addColorStop(0, 'rgba(255,255,255,0.2)');
    centerAir.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    centerAir.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = centerAir;
    ctx.fillRect(0, 0, width, height);

    ctx.globalAlpha = 0.13;
    const shade = ctx.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, 'rgba(255,255,255,0.14)');
    shade.addColorStop(0.48, 'rgba(255,255,255,0)');
    shade.addColorStop(1, 'rgba(43,27,11,0.2)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
};

const getGardenFallback = (itemId: string): GardenItemDef | undefined => GARDEN_ITEMS.find((item) => item.itemId === itemId);
const getGardenItemDef = (itemId: string): GardenItemDef | undefined => {
    const catalogDef = resolveItemDef(itemId);
    const fallback = getGardenFallback(itemId);
    if (!catalogDef && !fallback) return undefined;

    return {
        itemId,
        label: catalogDef?.name || fallback?.label || itemId,
        kind: fallback?.kind || 'stone',
        className: fallback?.className || 'from-stone-300 via-stone-500 to-stone-800',
        imageUrl: catalogDef?.imageUrl,
        icon: catalogDef?.icon,
    };
};

const drawSoftPath = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    lineWidth: number,
    strokeStyle: string,
    alpha: number,
    offsetX = 0,
    offsetY = 0,
) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(fromX + offsetX, fromY + offsetY);
    ctx.lineTo(toX + offsetX, toY + offsetY);
    ctx.stroke();
    ctx.restore();
};

const drawGrooveGrain = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    nx: number,
    ny: number,
    scale: number,
    sand: SandDef,
    seed: number,
    intensity: number,
) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.hypot(dx, dy);
    if (distance < 8) return;

    const grains = Math.min(12, Math.max(2, Math.floor(distance / 26)));
    ctx.save();
    for (let index = 0; index < grains; index += 1) {
        const t = (index + 0.5) / grains;
        const jitterSeed = Math.sin((seed + 1) * 19.17 + index * 8.33) * 43758.5453;
        const jitter = (Math.abs(jitterSeed % 1) - 0.5) * 4.6 * scale;
        const side = index % 2 === 0 ? 1 : -1;
        const x = fromX + dx * t + nx * (jitter + side * 1.9 * scale);
        const y = fromY + dy * t + ny * (jitter + side * 1.9 * scale);
        ctx.globalAlpha = (0.08 + Math.abs(jitterSeed % 1) * 0.12) * intensity;
        ctx.fillStyle = index % 3 === 0 ? sand.speck : 'rgba(58,38,18,0.28)';
        const radius = (0.55 + Math.abs(Math.sin(seed + index)) * 0.75) * scale;
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 1.7, radius, Math.atan2(dy, dx), 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
};

const drawSegment = (
    ctx: CanvasRenderingContext2D,
    from: GardenStrokePoint,
    to: GardenStrokePoint,
    stroke: GardenStroke,
    sand: SandDef,
    width: number,
    height: number,
) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const pressure = Math.max(0.35, Math.min(1.45, ((from.pressure ?? 0.62) + (to.pressure ?? 0.62)) / 2 + 0.25));
    const fromX = from.x * width;
    const fromY = from.y * height;
    const toX = to.x * width;
    const toY = to.y * height;

    if (stroke.tool === 'eraser') {
        const scale = Math.max(1, Math.min(2.5, Math.max(width, height) / 760));
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = sand.color;
        ctx.lineWidth = 30 * scale * pressure;
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.globalAlpha = 0.34;
        ctx.strokeStyle = sand.speck;
        ctx.lineWidth = 22 * scale * pressure;
        ctx.stroke();
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 12 * scale * pressure;
        ctx.stroke();
        ctx.restore();
        return;
    }

    const style = RAKE_STYLES.find((entry) => entry.id === stroke.rakeStyle) || RAKE_STYLES[0];
    const pressureStyle = RAKE_PRESSURES.find((entry) => entry.id === stroke.pressureStyle) || RAKE_PRESSURES[1];
    const spacingStyle = RAKE_SPACINGS.find((entry) => entry.id === stroke.spacingStyle) || RAKE_SPACINGS[1];
    const scale = Math.max(1, Math.min(2.5, Math.max(width, height) / 760));
    const isDeepRake = style.id === 'deep';
    const isStrongPressure = pressureStyle.id === 'strong';

    const effectiveGap = style.gap * spacingStyle.multiplier;
    const startOffset = -((style.lines - 1) * effectiveGap) / 2;
    const grooveWidth = style.width * pressureStyle.width * scale * pressure;
    const baseAlpha = Math.max(0.16, Math.min(0.94, style.alpha * pressureStyle.alpha * pressure));

    for (let index = 0; index < style.lines; index += 1) {
        const offset = (startOffset + index * effectiveGap) * scale;
        const sx = nx * offset;
        const sy = ny * offset;
        const troughWidth = Math.max(0.95, grooveWidth);
        const trenchAlpha = isDeepRake ? 1.38 : isStrongPressure ? 1.16 : 1;

        drawSoftPath(
            ctx,
            fromX + sx,
            fromY + sy,
            toX + sx,
            toY + sy,
            troughWidth * (isDeepRake ? 2.35 : 3.1),
            sand.ridge,
            baseAlpha * (isDeepRake ? 0.16 : 0.2),
        );
        drawSoftPath(
            ctx,
            fromX + sx,
            fromY + sy,
            toX + sx,
            toY + sy,
            troughWidth * (isDeepRake ? 1.55 : 1.95),
            sand.trough,
            baseAlpha * 0.42 * trenchAlpha,
        );
        drawSoftPath(
            ctx,
            fromX + sx,
            fromY + sy,
            toX + sx,
            toY + sy,
            troughWidth * (isDeepRake ? 1.22 : 1),
            sand.groove,
            baseAlpha * 1.08 * trenchAlpha,
        );
        if (isDeepRake || isStrongPressure) {
            drawSoftPath(ctx, fromX + sx, fromY + sy, toX + sx, toY + sy, troughWidth * 0.48, sand.buried, baseAlpha * (isDeepRake ? 0.52 : 0.46));
        }
    }
};

const drawGarden = (canvas: HTMLCanvasElement, state: GardenState) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = prepareCanvasContext(canvas, ctx, true);
    const sand = getSandDef(state.sandColor);
    fillSandBase(ctx, sand, width, height);

    (state.strokes || []).forEach((stroke) => {
        stroke.points.forEach((point, index) => {
            const previous = stroke.points[index - 1];
            if (!previous) return;
            drawSegment(ctx, previous, point, stroke, sand, width, height);
        });
    });
};

const PlaceholderItem: React.FC<{
    item: GardenPlacedItem;
    def: GardenItemDef;
    selected: boolean;
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
}> = ({ item, def, selected, onPointerDown, onPointerMove, onPointerUp }) => {
    const size = getGardenItemBaseSize(item.itemId, def.kind);
    const scale = item.scale || 1;
    const rotation = item.rotation || 0;
    return (
        <button
            type="button"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`absolute z-20 touch-none rounded-full transition-[filter] ${selected ? 'ring-2 ring-amber-200/80 brightness-110' : 'hover:brightness-110'}`}
            style={{
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                width: `${size * scale}px`,
                height: `${size * scale}px`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            }}
            title={def.label}
        >
            {def.imageUrl ? (
                <span className="relative block h-full w-full">
                    <span className="absolute bottom-[4%] left-1/2 h-[18%] w-[72%] -translate-x-1/2 rounded-full bg-black/28 blur-[7px]" />
                    <img
                        src={def.imageUrl}
                        alt={def.label}
                        className="relative h-full w-full object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.42)]"
                        draggable={false}
                    />
                </span>
            ) : def.icon ? (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-black/20 text-3xl shadow-[0_16px_24px_rgba(0,0,0,0.28)]">
                    {def.icon}
                </span>
            ) : def.kind === 'plant' ? (
                <span className="relative block h-full w-full">
                    <span className={`absolute left-1/2 top-[12%] h-[72%] w-[20%] -translate-x-1/2 rounded-full bg-gradient-to-b ${def.className} shadow-[0_10px_18px_rgba(0,0,0,0.28)]`} />
                    <span className={`absolute left-[18%] top-[18%] h-[44%] w-[38%] rotate-[-26deg] rounded-full bg-gradient-to-br ${def.className} shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]`} />
                    <span className={`absolute right-[18%] top-[24%] h-[46%] w-[38%] rotate-[24deg] rounded-full bg-gradient-to-br ${def.className} shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]`} />
                    <span className="absolute bottom-[4%] left-1/2 h-[18%] w-[58%] -translate-x-1/2 rounded-full bg-black/22 blur-[3px]" />
                </span>
            ) : (
                <span className={`block h-full w-full rounded-[46%_54%_52%_48%] bg-gradient-to-br ${def.className} shadow-[inset_9px_10px_14px_rgba(255,255,255,0.16),inset_-12px_-12px_18px_rgba(0,0,0,0.32),0_16px_26px_rgba(0,0,0,0.34)]`} />
            )}
        </button>
    );
};

export const GardenZenModal: React.FC<{ onClose: () => void; profile?: UserProfile }> = ({ onClose, profile }) => {
    const { userProfile, updateUserProfile, showToast, inventory } = useGame();
    const ownerProfile = profile || userProfile;
    const isOwnGarden = ownerProfile.id === userProfile.id;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const boardRef = useRef<HTMLDivElement | null>(null);
    const drawingStrokeRef = useRef<GardenStroke | null>(null);
    const targetPointRef = useRef<GardenStrokePoint | null>(null);
    const smoothPointRef = useRef<GardenStrokePoint | null>(null);
    const lastSmoothPointRef = useRef<GardenStrokePoint | null>(null);
    const liveAnimationFrameRef = useRef<number | null>(null);
    const dragRef = useRef<{ id: string; pointerId: number } | null>(null);
    const gardenStateRef = useRef<GardenState | null>(null);

    const initialState = useMemo<GardenState>(() => ({
        sandColor: ownerProfile.gardenState?.sandColor || 'classic',
        strokes: ownerProfile.gardenState?.strokes || [],
        items: ownerProfile.gardenState?.items || [],
    }), [ownerProfile.gardenState]);

    const [gardenState, setGardenState] = useState<GardenState>(initialState);
    const [tool, setTool] = useState<'rake' | 'eraser'>('rake');
    const [rakeStyle, setRakeStyle] = useState<GardenRakeStyle>('three');
    const [rakePressure, setRakePressure] = useState<GardenRakePressure>('medium');
    const [rakeSpacing, setRakeSpacing] = useState<GardenRakeSpacing>('normal');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [activeTray, setActiveTray] = useState<'tools' | 'items'>('tools');
    const [isTrayOpen, setIsTrayOpen] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [redoStrokes, setRedoStrokes] = useState<GardenStroke[]>([]);
    const [isGardenCanvasReady, setIsGardenCanvasReady] = useState(false);
    const canvasRectRef = useRef<DOMRect | null>(null);

    const redrawGardenCanvas = (state: GardenState = gardenStateRef.current || gardenState) => {
        const canvas = canvasRef.current;
        const board = boardRef.current;
        if (!canvas || !board) return false;

        const canvasRect = canvas.getBoundingClientRect();
        const boardRect = board.getBoundingClientRect();
        const rect = canvasRect.width > 0 && canvasRect.height > 0 ? canvasRect : boardRect;
        if (rect.width <= 0 || rect.height <= 0) return false;

        const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
        const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
        const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== nextWidth) canvas.width = nextWidth;
        if (canvas.height !== nextHeight) canvas.height = nextHeight;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        drawGarden(canvas, state);
        setIsGardenCanvasReady(true);
        return true;
    };

    const scheduleGardenRedraw = (state: GardenState = gardenStateRef.current || gardenState) => {
        window.requestAnimationFrame(() => redrawGardenCanvas(state));
    };

    useEffect(() => {
        drawingStrokeRef.current = null;
        targetPointRef.current = null;
        smoothPointRef.current = null;
        lastSmoothPointRef.current = null;
        if (liveAnimationFrameRef.current) {
            window.cancelAnimationFrame(liveAnimationFrameRef.current);
            liveAnimationFrameRef.current = null;
        }
        gardenStateRef.current = initialState;
        setGardenState(initialState);
        setHasUnsavedChanges(false);
        setRedoStrokes([]);
        setIsGardenCanvasReady(false);
        scheduleGardenRedraw(initialState);
    }, [initialState]);

    const ownedArtifactItems = useMemo<ItemDef[]>(() => {
        const deduped = new Map<string, ItemDef>();
        for (const item of inventory) {
            const def = resolveItemDef(item.id);
            if (!def || def.category !== 'artifact') continue;
            if (!deduped.has(def.id)) deduped.set(def.id, def);
        }
        return Array.from(deduped.values()).sort((left, right) => {
            const leftGarden = left.id.startsWith('item_garden_') ? 0 : 1;
            const rightGarden = right.id.startsWith('item_garden_') ? 0 : 1;
            return leftGarden - rightGarden || left.tier - right.tier || left.name.localeCompare(right.name);
        });
    }, [inventory]);

    useEffect(() => {
        const board = boardRef.current;
        if (!board) return;
        let frameId = 0;

        const resize = () => redrawGardenCanvas(gardenStateRef.current || gardenState);

        resize();
        frameId = window.requestAnimationFrame(resize);
        const observer = new ResizeObserver(resize);
        observer.observe(board);
        return () => {
            window.cancelAnimationFrame(frameId);
            observer.disconnect();
        };
    }, []);

    const commitState = (updater: (prev: GardenState) => GardenState) => {
        setGardenState((prev) => {
            const next = updater(prev);
            gardenStateRef.current = next;
            if (isOwnGarden) setHasUnsavedChanges(true);
            return next;
        });
    };

    useEffect(() => {
        gardenStateRef.current = gardenState;
    }, [gardenState]);

    const finalizeDrawingState = (): GardenState => {
        const base = gardenStateRef.current || gardenState;
        const current = drawingStrokeRef.current;
        if (!current || current.points.length <= 1) return base;

        const completedStroke = { ...current, points: [...current.points] };
        const next = { ...base, strokes: [...(base.strokes || []), completedStroke] };
        drawingStrokeRef.current = null;
        gardenStateRef.current = next;
        setGardenState(next);
        if (isOwnGarden) setHasUnsavedChanges(true);
        return next;
    };

    const saveGarden = () => {
        if (!isOwnGarden) return;
        const finalizedState = finalizeDrawingState();
        updateUserProfile({ gardenState: { ...finalizedState, updatedAt: new Date().toISOString() } });
        setHasUnsavedChanges(false);
        showToast('Jardim salvo.', 'success');
        onClose();
    };

    const getPoint = (event: React.PointerEvent): GardenStrokePoint | null => {
        const surface = canvasRef.current || boardRef.current;
        if (!surface) return null;
        const rect = surface.getBoundingClientRect();
        return {
            x: clamp01((event.clientX - rect.left) / rect.width),
            y: clamp01((event.clientY - rect.top) / rect.height),
            pressure: event.pressure && event.pressure > 0 ? Math.max(0.2, Math.min(1, event.pressure)) : 0.62,
        };
    };

    const drawLiveSegment = (from: GardenStrokePoint, to: GardenStrokePoint, stroke: GardenStroke) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = prepareCanvasContext(canvas, ctx);
        drawSegment(ctx, from, to, stroke, getSandDef(gardenStateRef.current?.sandColor || gardenState.sandColor), width, height);
    };

    const stopLiveRakeAnimation = () => {
        if (liveAnimationFrameRef.current) {
            window.cancelAnimationFrame(liveAnimationFrameRef.current);
            liveAnimationFrameRef.current = null;
        }
    };

    const animateLiveRake = () => {
        const current = drawingStrokeRef.current;
        const target = targetPointRef.current;
        const smooth = smoothPointRef.current;
        const lastSmooth = lastSmoothPointRef.current;
        const canvas = canvasRef.current;
        if (!current || !target || !smooth || !lastSmooth || !canvas) {
            liveAnimationFrameRef.current = null;
            return;
        }

        const chase = current.tool === 'eraser' ? 0.34 : 0.085;
        smooth.x += (target.x - smooth.x) * chase;
        smooth.y += (target.y - smooth.y) * chase;
        smooth.pressure = (smooth.pressure ?? 0.62) + ((target.pressure ?? 0.62) - (smooth.pressure ?? 0.62)) * 0.18;

        const rect = canvasRectRef.current || canvas.getBoundingClientRect();
        const pixelDistance = Math.hypot(
            (smooth.x - lastSmooth.x) * Math.max(1, rect.width),
            (smooth.y - lastSmooth.y) * Math.max(1, rect.height),
        );

        if (pixelDistance > (current.tool === 'eraser' ? 4.4 : 5.2)) {
            const nextPoint = { x: smooth.x, y: smooth.y, pressure: smooth.pressure };
            current.points.push(nextPoint);
            drawLiveSegment(lastSmooth, nextPoint, current);
            lastSmoothPointRef.current = nextPoint;
        }

        liveAnimationFrameRef.current = window.requestAnimationFrame(animateLiveRake);
    };

    useEffect(() => () => stopLiveRakeAnimation(), []);

    const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isOwnGarden) return;
        event.preventDefault();
        if (selectedItemId) {
            setSelectedItemId(null);
            return;
        }
        setIsTrayOpen(false);
        redrawGardenCanvas();
        const point = getPoint(event);
        if (!point) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        canvasRectRef.current = event.currentTarget.getBoundingClientRect();
        const stroke: GardenStroke = {
            id: `stroke-${Date.now()}`,
            tool,
            rakeStyle,
            pressureStyle: rakePressure,
            spacingStyle: rakeSpacing,
            points: [point],
        };
        drawingStrokeRef.current = stroke;
        targetPointRef.current = { ...point };
        smoothPointRef.current = { ...point };
        lastSmoothPointRef.current = { ...point };
        stopLiveRakeAnimation();
        liveAnimationFrameRef.current = window.requestAnimationFrame(animateLiveRake);
    };

    const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const current = drawingStrokeRef.current;
        if (!current) return;
        event.preventDefault();
        const point = getPoint(event);
        if (!point) return;
        targetPointRef.current = point;
    };

    const stopDrawing = () => {
        stopLiveRakeAnimation();
        targetPointRef.current = null;
        smoothPointRef.current = null;
        lastSmoothPointRef.current = null;
        canvasRectRef.current = null;
        finalizeDrawingState();
        setRedoStrokes([]);
    };

    const undoStroke = () => {
        const base = gardenStateRef.current || gardenState;
        const strokes = base.strokes || [];
        const removed = strokes[strokes.length - 1];
        if (!removed) return;
        const next = { ...base, strokes: strokes.slice(0, -1) };
        gardenStateRef.current = next;
        setGardenState(next);
        setRedoStrokes((prev) => [removed, ...prev]);
        if (isOwnGarden) setHasUnsavedChanges(true);
        scheduleGardenRedraw(next);
    };

    const redoStroke = () => {
        const [restored, ...remaining] = redoStrokes;
        if (!restored) return;
        const base = gardenStateRef.current || gardenState;
        const next = { ...base, strokes: [...(base.strokes || []), restored] };
        gardenStateRef.current = next;
        setGardenState(next);
        setRedoStrokes(remaining);
        if (isOwnGarden) setHasUnsavedChanges(true);
        scheduleGardenRedraw(next);
    };

    const addItem = (itemId: string) => {
        const count = (gardenState.items || []).filter((item) => item.itemId === itemId).length;
        const id = `${itemId}-${Date.now()}`;
        commitState((prev) => ({
            ...prev,
            items: [
                ...(prev.items || []),
                { id, itemId, x: clamp01(0.44 + count * 0.04), y: clamp01(0.48 + count * 0.04), scale: 1.18, rotation: 0 },
            ],
        }));
        setSelectedItemId(id);
        setIsTrayOpen(true);
    };

    const startDrag = (event: React.PointerEvent<HTMLButtonElement>, itemId: string) => {
        if (!isOwnGarden) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { id: itemId, pointerId: event.pointerId };
        setSelectedItemId(itemId);
        setIsTrayOpen(true);
    };

    const moveDraggedItem = (event: React.PointerEvent<HTMLElement>) => {
        if (!dragRef.current) return;
        if (dragRef.current.pointerId !== event.pointerId) return;
        event.preventDefault();
        const point = getPoint(event);
        if (!point) return;
        const id = dragRef.current.id;
        commitState((prev) => ({
            ...prev,
            items: (prev.items || []).map((item) => item.id === id ? { ...item, x: point.x, y: point.y } : item),
        }));
    };

    const handleBoardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        moveDraggedItem(event);
    };

    const stopDrag = () => {
        dragRef.current = null;
    };

    const clearDrawing = () => {
        commitState((prev) => ({ ...prev, strokes: [] }));
        setRedoStrokes([]);
        setShowClearConfirm(false);
    };

    const removeSelectedItem = () => {
        if (!selectedItemId) return;
        commitState((prev) => ({ ...prev, items: (prev.items || []).filter((item) => item.id !== selectedItemId) }));
        setSelectedItemId(null);
    };

    const activeSand = getSandDef(gardenState.sandColor);
    const activeRake = RAKE_STYLES.find((style) => style.id === rakeStyle) || RAKE_STYLES[0];
    const activePressure = RAKE_PRESSURES.find((pressure) => pressure.id === rakePressure) || RAKE_PRESSURES[1];
    const activeSpacing = RAKE_SPACINGS.find((spacing) => spacing.id === rakeSpacing) || RAKE_SPACINGS[1];
    const placedItems = gardenState.items || [];
    const selectedItem = selectedItemId ? placedItems.find((item) => item.id === selectedItemId) : null;

    const adjustSelectedItemScale = (delta: number) => {
        if (!selectedItemId) return;
        commitState((prev) => ({
            ...prev,
            items: (prev.items || []).map((item) => item.id === selectedItemId
                ? { ...item, scale: Math.max(0.5, Math.min(2.65, Number(item.scale || 1) + delta)) }
                : item
            ),
        }));
    };

    const adjustSelectedItemRotation = (delta: number) => {
        if (!selectedItemId) return;
        commitState((prev) => ({
            ...prev,
            items: (prev.items || []).map((item) => item.id === selectedItemId
                ? { ...item, rotation: (((Number(item.rotation || 0) + delta) % 360) + 360) % 360 }
                : item
            ),
        }));
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[22000] overflow-hidden bg-[#080807]">
                <style>{GARDEN_LOAD_STYLE}</style>
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(30,22,13,0.92),rgba(10,9,7,1)_62%),radial-gradient(circle_at_50%_0%,rgba(255,232,176,0.18),transparent_34%),radial-gradient(circle_at_82%_88%,rgba(69,99,58,0.18),transparent_36%)]" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-100/10 to-transparent" />

                <div
                    ref={boardRef}
                    className="absolute inset-x-3 bottom-[5.8rem] top-[5.1rem] touch-none overflow-hidden rounded-[30px] border-[10px] border-[#9d7141] shadow-[inset_0_0_0_1px_rgba(255,244,202,0.22),inset_0_18px_28px_rgba(255,236,179,0.12),inset_0_-24px_38px_rgba(50,29,10,0.34),0_26px_70px_rgba(0,0,0,0.52)] md:bottom-6 md:left-6 md:right-[21rem] md:top-[5.5rem]"
                    onPointerMove={handleBoardPointerMove}
                    onPointerUp={stopDrag}
                    onPointerCancel={stopDrag}
                    style={{
                        backgroundColor: activeSand.color,
                        borderColor: '#9d7141',
                    }}
                >
                    <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,255,255,0.16),transparent_18%,transparent_82%,rgba(61,36,14,0.16)),radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_72%_82%,rgba(34,22,11,0.12),transparent_28%)]" />
                    <div className="pointer-events-none absolute inset-0 z-[2] opacity-[0.16] mix-blend-multiply [background-image:radial-gradient(circle_at_1px_1px,rgba(54,35,16,0.28)_0.55px,transparent_0),radial-gradient(circle_at_9px_7px,rgba(255,246,211,0.22)_0.5px,transparent_0)] [background-size:14px_14px,23px_23px]" />
                    <div className="pointer-events-none absolute inset-0 z-[3] opacity-[0.2] [background-image:radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.18),transparent_48%),linear-gradient(105deg,transparent_0,transparent_46%,rgba(255,255,255,0.13)_49%,transparent_52%,transparent_100%)] [background-size:100%_100%,190px_190px]" />
                            <canvas
                                ref={canvasRef}
                                className={`absolute inset-0 z-10 h-full w-full touch-none ${isOwnGarden ? (tool === 'eraser' ? 'cursor-crosshair' : 'cursor-cell') : ''}`}
                                onPointerDown={handleCanvasPointerDown}
                                onPointerMove={handleCanvasPointerMove}
                                onPointerUp={stopDrawing}
                                onPointerCancel={stopDrawing}
                            />
                            {isGardenCanvasReady && placedItems.map((item) => {
                                const def = getGardenItemDef(item.itemId);
                                if (!def) return null;
                                return (
                                    <PlaceholderItem
                                        key={item.id}
                                        item={item}
                                        def={def}
                                        selected={selectedItemId === item.id}
                                        onPointerDown={(event) => startDrag(event, item.id)}
                                        onPointerMove={moveDraggedItem}
                                        onPointerUp={stopDrag}
                                    />
                                );
                            })}
                    {!isGardenCanvasReady && (
                        <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-black/18 backdrop-blur-[1px]">
                            <div className="w-[min(15rem,70vw)] rounded-2xl border border-white/10 bg-black/48 px-4 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.4)]">
                                <div className="text-center text-[10px] font-black uppercase tracking-[0.18em] text-amber-50/82">Carregando jardim</div>
                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full w-full origin-left animate-[gardenLoad_0.72s_ease-out_forwards] rounded-full bg-gradient-to-r from-amber-200/50 via-amber-100 to-amber-300/70" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 z-30 rounded-[20px] shadow-[inset_0_0_78px_rgba(68,45,21,0.22),inset_0_0_0_1px_rgba(255,255,255,0.1)]" />
                </div>

                <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-2 px-3 pb-3 pt-[calc(0.75rem+var(--safe-area-top))]">
                    <div className="pointer-events-auto min-w-0 rounded-2xl border border-white/10 bg-black/38 px-3.5 py-2.5 shadow-[0_16px_42px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                        <h2 className="truncate text-[15px] font-black uppercase tracking-[0.08em] text-white sm:text-[16px]">Meu Jardim</h2>
                    </div>
                    <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
                        {isOwnGarden && (
                            <div className="flex items-center rounded-full border border-white/10 bg-black/38 p-0.5 shadow-[0_16px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                                <button
                                    type="button"
                                    onClick={undoStroke}
                                    disabled={(gardenState.strokes || []).length === 0}
                                    className="grid h-9 w-9 place-items-center rounded-full text-amber-50/78 transition-colors hover:bg-white/10 disabled:cursor-default disabled:text-white/24"
                                    aria-label="Desfazer ultimo risco"
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={redoStroke}
                                    disabled={redoStrokes.length === 0}
                                    className="grid h-9 w-9 place-items-center rounded-full text-amber-50/78 transition-colors hover:bg-white/10 disabled:cursor-default disabled:text-white/24"
                                    aria-label="Refazer risco"
                                >
                                    <ChevronRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                        {isOwnGarden && (
                            <button
                                type="button"
                                onClick={saveGarden}
                                disabled={!hasUnsavedChanges}
                                className="rounded-full border border-amber-200/34 bg-black/46 px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.14em] text-amber-50 shadow-[0_16px_36px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-colors hover:bg-amber-200/14 disabled:cursor-default disabled:border-white/8 disabled:text-white/35"
                            >
                                {hasUnsavedChanges ? 'Salvar' : 'Salvo'}
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="rounded-full border border-white/12 bg-black/42 p-2.5 text-white/76 shadow-[0_16px_36px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-colors hover:text-white">
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <aside className="pointer-events-none fixed bottom-[calc(1rem+var(--safe-area-bottom))] left-0 right-0 z-50 flex justify-center px-3 md:bottom-auto md:left-auto md:right-4 md:top-[calc(5.9rem+var(--safe-area-top))] md:block md:w-[19rem] md:px-0">
                    {!isTrayOpen ? (
                        <button
                            type="button"
                            onClick={() => setIsTrayOpen(true)}
                            className="pointer-events-auto grid min-h-[4.1rem] w-[min(24rem,calc(100vw-1.5rem))] grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[26px] border border-amber-100/22 bg-black/52 px-3.5 py-3 text-left shadow-[0_18px_48px_rgba(0,0,0,0.44)] backdrop-blur-2xl md:w-full"
                        >
                            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/12 bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                                <span className="h-6 w-6 rounded-full border border-white/24" style={{ backgroundColor: activeSand.color }} />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[9px] font-black uppercase tracking-[0.22em] text-amber-100/54">Bandeja</span>
                                <span className="block truncate text-[12px] font-black uppercase tracking-[0.12em] text-white">
                                    {selectedItem ? 'Item selecionado' : tool === 'eraser' ? 'Apagar areia' : `${activeRake.label} - ${activeSpacing.label}`}
                                </span>
                            </span>
                            <span className="rounded-full border border-amber-200/28 bg-amber-100/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-amber-50">Abrir</span>
                        </button>
                    ) : (
                        <div className="pointer-events-auto w-[min(25rem,calc(100vw-1.5rem))] overflow-hidden rounded-[26px] border border-white/10 bg-black/54 shadow-[0_18px_48px_rgba(0,0,0,0.46)] backdrop-blur-2xl md:w-full">
                            <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-white/8 p-2">
                                {selectedItem ? (
                                    <div className="rounded-2xl bg-amber-200/16 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-50 ring-1 ring-amber-200/28">Editar item</div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-1">
                                        <button type="button" onClick={() => setActiveTray('tools')} className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${activeTray === 'tools' ? 'bg-amber-200/16 text-amber-50 ring-1 ring-amber-200/28' : 'text-white/48'}`}>Ferramentas</button>
                                        <button type="button" onClick={() => setActiveTray('items')} className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${activeTray === 'items' ? 'bg-amber-200/16 text-amber-50 ring-1 ring-amber-200/28' : 'text-white/48'}`}>Itens</button>
                                    </div>
                                )}
                                <button type="button" onClick={() => setIsTrayOpen(false)} className="h-9 rounded-2xl border border-white/8 bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white/62">Fechar</button>
                            </div>

                            {selectedItem ? (
                                <div className="grid gap-2 p-2">
                                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-amber-200/18 bg-amber-100/[0.07] px-2 py-2">
                                        <button type="button" onClick={() => adjustSelectedItemScale(-0.14)} className="h-9 w-9 rounded-xl bg-black/30 text-base font-black text-white/72">-</button>
                                        <div className="text-center">
                                            <div className="text-[8px] font-black uppercase tracking-[0.18em] text-amber-100/50">Tamanho</div>
                                            <div className="text-[11px] font-black uppercase tracking-[0.1em] text-white/76">{Math.round(Number(selectedItem.scale || 1) * 100)}%</div>
                                        </div>
                                        <button type="button" onClick={() => adjustSelectedItemScale(0.14)} className="h-9 w-9 rounded-xl bg-black/30 text-base font-black text-white/72">+</button>
                                    </div>
                                    <div className="mt-1 grid grid-cols-[1fr_1fr_auto] gap-1">
                                        <button type="button" onClick={() => adjustSelectedItemRotation(-15)} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">Girar -</button>
                                        <button type="button" onClick={() => adjustSelectedItemRotation(15)} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">Girar +</button>
                                        <button type="button" onClick={removeSelectedItem} className="inline-flex items-center justify-center rounded-2xl border border-red-300/18 bg-red-500/8 px-3 py-2.5 text-white/70">
                                            <Trash2Icon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ) : activeTray === 'tools' ? (
                                <div className="grid max-h-[46vh] gap-2 overflow-y-auto p-2 custom-scrollbar md:max-h-[68vh]">
                                    <div className="grid grid-cols-2 gap-1">
                                        <button type="button" onClick={() => setTool('rake')} className={`rounded-2xl border px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] ${tool === 'rake' ? 'border-amber-200/70 bg-white/14 text-white' : 'border-white/8 bg-white/5 text-white/56'}`}>Desenhar</button>
                                        <button type="button" onClick={() => setTool('eraser')} className={`rounded-2xl border px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] ${tool === 'eraser' ? 'border-amber-200/70 bg-white/14 text-white' : 'border-white/8 bg-white/5 text-white/56'}`}>Apagar</button>
                                    </div>
                                    <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-2">
                                        <div className="mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/38">Areia</div>
                                        <div className="grid grid-cols-3 gap-1">
                                            {SAND_COLORS.map((sand) => (
                                                <button
                                                    key={sand.id}
                                                    type="button"
                                                    onClick={() => commitState((prev) => ({ ...prev, sandColor: sand.id }))}
                                                    className={`flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-2xl border px-1.5 py-2 text-center transition-colors ${activeSand.id === sand.id ? 'border-amber-200/70 bg-white/14 text-white' : 'border-white/8 bg-black/18 text-white/56'}`}
                                                >
                                                    <span className="h-5 w-10 rounded-full border border-white/24 shadow-[inset_0_1px_5px_rgba(255,255,255,0.24)]" style={{ backgroundColor: sand.color }} />
                                                    <span className="text-[8px] font-black uppercase tracking-[0.1em]">{sand.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-2">
                                        <div className="mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/38">Garfo</div>
                                        <div className="grid grid-cols-5 gap-1">
                                            {RAKE_STYLES.map((style) => (
                                                <button key={style.id} type="button" onClick={() => { setTool('rake'); setRakeStyle(style.id); }} className={`rounded-2xl border px-2 py-2.5 text-center ${rakeStyle === style.id && tool === 'rake' ? 'border-amber-200/70 bg-white/14 text-white' : 'border-white/8 bg-black/18 text-white/56'}`}>
                                                    <span className="block text-[12px] font-black uppercase tracking-[0.12em]">{style.shortLabel}</span>
                                                    <span className="block truncate text-[7px] font-black uppercase tracking-[0.08em] text-white/36">{style.description}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-2">
                                        <div className="mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/38">Distancia</div>
                                        <div className="grid grid-cols-4 gap-1">
                                            {RAKE_SPACINGS.map((spacing) => (
                                                <button key={spacing.id} type="button" onClick={() => { setTool('rake'); setRakeSpacing(spacing.id); }} className={`rounded-2xl border px-2 py-2.5 text-center ${rakeSpacing === spacing.id && tool === 'rake' ? 'border-amber-200/70 bg-white/14 text-white' : 'border-white/8 bg-black/18 text-white/56'}`}>
                                                    <span className="block text-[12px] font-black uppercase tracking-[0.12em]">{spacing.shortLabel}</span>
                                                    <span className="block text-[7px] font-black uppercase tracking-[0.1em] text-white/36">{spacing.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="rounded-3xl border border-white/8 bg-white/[0.04] p-2">
                                        <div className="mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/38">Pressao</div>
                                        <div className="grid grid-cols-3 gap-1">
                                            {RAKE_PRESSURES.map((pressure) => (
                                                <button key={pressure.id} type="button" onClick={() => { setTool('rake'); setRakePressure(pressure.id); }} className={`rounded-2xl border px-2 py-2.5 text-center ${rakePressure === pressure.id && tool === 'rake' ? 'border-amber-200/70 bg-white/14 text-white' : 'border-white/8 bg-black/18 text-white/56'}`}>
                                                    <span className="block text-[12px] font-black uppercase tracking-[0.12em]">{pressure.shortLabel}</span>
                                                    <span className="block text-[7px] font-black uppercase tracking-[0.1em] text-white/36">{pressure.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                        <button type="button" onClick={() => setShowClearConfirm(true)} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 transition-colors hover:bg-white/10">Limpar</button>
                                        <button type="button" onClick={removeSelectedItem} disabled={!selectedItemId} className="inline-flex items-center justify-center gap-1 rounded-2xl border border-white/8 bg-white/5 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 transition-colors hover:bg-white/10 disabled:opacity-35">
                                            <Trash2Icon className="h-3.5 w-3.5" />
                                            Item
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid max-h-[36vh] grid-cols-5 gap-1.5 overflow-y-auto p-2 custom-scrollbar md:max-h-[68vh] md:grid-cols-3">
                                    {ownedArtifactItems.length === 0 ? (
                                        <div className="col-span-full rounded-2xl border border-white/8 bg-white/5 px-2 py-5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">Nenhum artefato</div>
                                    ) : ownedArtifactItems.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => addItem(item.id)}
                                            className={`group flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-2xl border px-1.5 py-2 text-[8px] font-black uppercase tracking-[0.08em] text-white/70 transition-colors hover:bg-white/10 ${item.id.startsWith('item_garden_') ? 'border-amber-200/22 bg-amber-100/8' : 'border-white/8 bg-white/5'}`}
                                            title={item.name}
                                        >
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/24">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt="" className="h-full w-full object-contain" draggable={false} />
                                                ) : (
                                                    <span className="text-lg">{item.icon || '?'}</span>
                                                )}
                                            </span>
                                            <span className="w-full truncate">{item.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </aside>
                {showClearConfirm && (
                    <ConfirmationModal
                        title="Limpar areia?"
                        message="Isso apaga todos os rastros desenhados no jardim. Pedras, plantas e artefatos continuam no lugar."
                        confirmLabel="LIMPAR"
                        cancelLabel="VOLTAR"
                        variant="danger"
                        onConfirm={clearDrawing}
                        onCancel={() => setShowClearConfirm(false)}
                    />
                )}
            </div>
        </Portal>
    );
};
