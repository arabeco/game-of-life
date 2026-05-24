import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GardenPlacedItem, GardenRakePressure, GardenRakeStyle, GardenSandColor, GardenState, GardenStroke, GardenStrokePoint, UserProfile } from '../types';
import { useGame } from '../contexts/GameContext';
import { ItemDef, resolveItemDef } from '../constants/items';
import { Portal } from './Portal';
import { Trash2Icon, XIcon } from './Icons';
import { ConfirmationModal } from './ConfirmationModal';

type SandDef = {
    id: GardenSandColor;
    label: string;
    description: string;
    color: string;
    groove: string;
    speck: string;
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
    { id: 'classic', label: 'Dourada', description: 'quente', color: '#c9aa72', groove: 'rgba(78, 52, 25, 0.42)', speck: 'rgba(240, 218, 169, 0.58)' },
    { id: 'white', label: 'Branca', description: 'limpa', color: '#dfd5bf', groove: 'rgba(86, 76, 61, 0.34)', speck: 'rgba(248, 243, 229, 0.72)' },
    { id: 'basalt', label: 'Basalto', description: 'seca', color: '#988b75', groove: 'rgba(42, 34, 25, 0.44)', speck: 'rgba(211, 197, 168, 0.5)' },
];

const RAKE_STYLES: Array<{ id: GardenRakeStyle; label: string; shortLabel: string; description: string; lines: number; gap: number; width: number; alpha: number }> = [
    { id: 'fine', label: 'Fino', shortLabel: 'F', description: '3 perto', lines: 3, gap: 5, width: 0.62, alpha: 0.34 },
    { id: 'three', label: 'Classico', shortLabel: 'C', description: '3 medio', lines: 3, gap: 8, width: 0.78, alpha: 0.44 },
    { id: 'wide', label: 'Largo', shortLabel: 'L', description: '5 medio', lines: 5, gap: 8, width: 0.84, alpha: 0.46 },
    { id: 'open', label: 'Aberto', shortLabel: 'A', description: '4 aberto', lines: 4, gap: 13, width: 0.72, alpha: 0.38 },
    { id: 'deep', label: 'Fundo', shortLabel: 'D', description: '5 forte', lines: 5, gap: 11, width: 1.05, alpha: 0.56 },
];

const RAKE_PRESSURES: Array<{ id: GardenRakePressure; label: string; shortLabel: string; width: number; alpha: number }> = [
    { id: 'light', label: 'Fraco', shortLabel: 'F', width: 0.72, alpha: 0.62 },
    { id: 'medium', label: 'Medio', shortLabel: 'M', width: 1, alpha: 1 },
    { id: 'strong', label: 'Forte', shortLabel: 'G', width: 1.65, alpha: 1.25 },
];

const GARDEN_ITEMS: GardenItemDef[] = [
    { itemId: 'item_garden_stone_1', label: 'Pedra Serena', kind: 'stone', className: 'from-stone-300 via-stone-500 to-stone-800' },
    { itemId: 'item_garden_stone_2', label: 'Pedra Lunar', kind: 'stone', className: 'from-zinc-100 via-zinc-300 to-zinc-600' },
    { itemId: 'item_garden_stone_3', label: 'Pedra Obsidiana', kind: 'stone', className: 'from-neutral-500 via-neutral-800 to-black' },
    { itemId: 'item_garden_plant_1', label: 'Musgo Vivo', kind: 'plant', className: 'from-emerald-300 via-emerald-600 to-lime-900' },
    { itemId: 'item_garden_plant_2', label: 'Bambu Jovem', kind: 'plant', className: 'from-lime-200 via-green-500 to-emerald-900' },
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
    const gradient = ctx.createRadialGradient(width * 0.32, height * 0.22, 0, width * 0.48, height * 0.42, Math.max(width, height) * 0.9);
    gradient.addColorStop(0, sand.speck);
    gradient.addColorStop(0.28, sand.color);
    gradient.addColorStop(0.76, sand.color);
    gradient.addColorStop(1, 'rgba(89, 61, 33, 0.34)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    const grainCount = Math.min(5200, Math.max(1200, Math.floor((width * height) / 260)));
    for (let i = 0; i < grainCount; i += 1) {
        const x = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1) * width;
        const y = Math.abs((Math.sin(i * 78.233) * 23421.631) % 1) * height;
        const a = Math.abs((Math.sin(i * 39.425) * 11317.923) % 1);
        ctx.globalAlpha = 0.045 + a * 0.16;
        ctx.fillStyle = i % 4 === 0
            ? 'rgba(255,249,225,0.72)'
            : i % 4 === 1
                ? 'rgba(132,94,48,0.38)'
                : 'rgba(56,39,22,0.25)';
        const size = a > 0.93 ? 1.45 : a > 0.72 ? 1 : 0.65;
        ctx.fillRect(x, y, size, size);
    }

    ctx.globalAlpha = 0.075;
    ctx.strokeStyle = sand.groove;
    ctx.lineWidth = 1;
    for (let y = -24; y < height + 28; y += 18) {
        ctx.beginPath();
        ctx.moveTo(-16, y);
        ctx.bezierCurveTo(width * 0.28, y + 7, width * 0.62, y - 8, width + 16, y + 4);
        ctx.stroke();
    }

    ctx.globalAlpha = 0.12;
    const shade = ctx.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, 'rgba(255,255,255,0.16)');
    shade.addColorStop(0.48, 'rgba(255,255,255,0)');
    shade.addColorStop(1, 'rgba(43,27,11,0.14)');
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

    if (stroke.tool === 'eraser') {
        const scale = Math.max(1, Math.min(2.5, Math.max(width, height) / 760));
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = sand.color;
        ctx.lineWidth = 30 * scale * pressure;
        ctx.beginPath();
        ctx.moveTo(from.x * width, from.y * height);
        ctx.lineTo(to.x * width, to.y * height);
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
    const scale = Math.max(1, Math.min(2.5, Math.max(width, height) / 760));

    const startOffset = -((style.lines - 1) * style.gap) / 2;

    ctx.save();
    ctx.globalAlpha = Math.max(0.16, Math.min(0.94, style.alpha * pressureStyle.alpha * pressure));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = sand.groove;
    ctx.lineWidth = style.width * pressureStyle.width * scale * pressure;
    for (let index = 0; index < style.lines; index += 1) {
        const offset = (startOffset + index * style.gap) * scale;
        ctx.save();
        ctx.shadowColor = 'rgba(255,255,255,0.12)';
        ctx.shadowBlur = style.id === 'deep' ? 0.8 * scale : 0;
        ctx.beginPath();
        ctx.moveTo(from.x * width + nx * offset, from.y * height + ny * offset);
        ctx.lineTo(to.x * width + nx * offset, to.y * height + ny * offset);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
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
    const size = def.kind === 'plant' ? 54 : 62;
    return (
        <button
            type="button"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full transition-transform ${selected ? 'scale-110 ring-2 ring-amber-200/80' : 'hover:scale-105'}`}
            style={{
                left: `${item.x * 100}%`,
                top: `${item.y * 100}%`,
                width: `${size * (item.scale || 1)}px`,
                height: `${size * (item.scale || 1)}px`,
            }}
            title={def.label}
        >
            {def.imageUrl ? (
                <img
                    src={def.imageUrl}
                    alt={def.label}
                    className="h-full w-full object-contain drop-shadow-[0_16px_16px_rgba(0,0,0,0.38)]"
                    draggable={false}
                />
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
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [activeTray, setActiveTray] = useState<'tools' | 'items'>('tools');
    const [isTrayOpen, setIsTrayOpen] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const redrawGardenCanvas = (state: GardenState = gardenStateRef.current || gardenState) => {
        const canvas = canvasRef.current;
        const board = boardRef.current;
        if (!canvas || !board) return false;

        const canvasRect = canvas.getBoundingClientRect();
        const boardRect = board.getBoundingClientRect();
        const rect = canvasRect.width > 0 && canvasRect.height > 0 ? canvasRect : boardRect;
        if (rect.width <= 0 || rect.height <= 0) return false;

        const dpr = window.devicePixelRatio || 1;
        const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
        const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
        if (canvas.width !== nextWidth) canvas.width = nextWidth;
        if (canvas.height !== nextHeight) canvas.height = nextHeight;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        drawGarden(canvas, state);
        return true;
    };

    const scheduleGardenRedraw = (state: GardenState = gardenStateRef.current || gardenState) => {
        window.requestAnimationFrame(() => redrawGardenCanvas(state));
        window.setTimeout(() => redrawGardenCanvas(state), 60);
        window.setTimeout(() => redrawGardenCanvas(state), 180);
    };

    useEffect(() => {
        drawingStrokeRef.current = null;
        gardenStateRef.current = initialState;
        setGardenState(initialState);
        setHasUnsavedChanges(false);
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
    }, [gardenState]);

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

    const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isOwnGarden) return;
        event.preventDefault();
        setIsTrayOpen(false);
        redrawGardenCanvas();
        const point = getPoint(event);
        if (!point) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const stroke: GardenStroke = {
            id: `stroke-${Date.now()}`,
            tool,
            rakeStyle,
            pressureStyle: rakePressure,
            points: [point],
        };
        drawingStrokeRef.current = stroke;
    };

    const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const current = drawingStrokeRef.current;
        if (!current) return;
        event.preventDefault();
        const point = getPoint(event);
        if (!point) return;
        const previous = current.points[current.points.length - 1];
        if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 0.0018) return;
        current.points.push(point);
        if (previous) drawLiveSegment(previous, point, current);
    };

    const stopDrawing = () => {
        finalizeDrawingState();
    };

    const addItem = (itemId: string) => {
        const count = (gardenState.items || []).filter((item) => item.itemId === itemId).length;
        commitState((prev) => ({
            ...prev,
            items: [
                ...(prev.items || []),
                { id: `${itemId}-${Date.now()}`, itemId, x: clamp01(0.44 + count * 0.04), y: clamp01(0.48 + count * 0.04), scale: 1 },
            ],
        }));
    };

    const startDrag = (event: React.PointerEvent<HTMLButtonElement>, itemId: string) => {
        if (!isOwnGarden) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { id: itemId, pointerId: event.pointerId };
        setSelectedItemId(itemId);
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
    const placedItems = gardenState.items || [];
    const selectedItem = selectedItemId ? placedItems.find((item) => item.id === selectedItemId) : null;

    const adjustSelectedItemScale = (delta: number) => {
        if (!selectedItemId) return;
        commitState((prev) => ({
            ...prev,
            items: (prev.items || []).map((item) => item.id === selectedItemId
                ? { ...item, scale: Math.max(0.55, Math.min(1.85, Number(item.scale || 1) + delta)) }
                : item
            ),
        }));
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[22000] overflow-hidden bg-[#080807]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(30,22,13,0.92),rgba(10,9,7,1)_62%),radial-gradient(circle_at_50%_0%,rgba(255,232,176,0.18),transparent_34%),radial-gradient(circle_at_82%_88%,rgba(69,99,58,0.18),transparent_36%)]" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-100/10 to-transparent" />

                <div
                    ref={boardRef}
                    className="absolute inset-x-3 bottom-[5.8rem] top-[5.1rem] touch-none overflow-hidden rounded-[30px] border-[10px] border-[#9d7141] shadow-[inset_0_0_0_1px_rgba(255,244,202,0.2),inset_0_14px_24px_rgba(255,236,179,0.1),inset_0_-18px_34px_rgba(50,29,10,0.28),0_26px_70px_rgba(0,0,0,0.52)] md:bottom-6 md:left-6 md:right-[21rem] md:top-[5.5rem]"
                    onPointerMove={handleBoardPointerMove}
                    onPointerUp={stopDrag}
                    onPointerCancel={stopDrag}
                    style={{
                        backgroundColor: activeSand.color,
                        borderColor: '#9d7141',
                    }}
                >
                    <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent_18%,transparent_82%,rgba(61,36,14,0.14)),radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_72%_82%,rgba(34,22,11,0.1),transparent_28%)]" />
                            <canvas
                                ref={canvasRef}
                                className={`absolute inset-0 z-10 h-full w-full touch-none ${isOwnGarden ? (tool === 'eraser' ? 'cursor-crosshair' : 'cursor-cell') : ''}`}
                                onPointerDown={handleCanvasPointerDown}
                                onPointerMove={handleCanvasPointerMove}
                                onPointerUp={stopDrawing}
                                onPointerCancel={stopDrawing}
                            />
                            {placedItems.map((item) => {
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
                    <div className="pointer-events-none absolute inset-0 z-30 rounded-[20px] shadow-[inset_0_0_78px_rgba(68,45,21,0.2),inset_0_0_0_1px_rgba(255,255,255,0.09)]" />
                </div>

                <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-3 px-4 pb-3 pt-[calc(0.9rem+var(--safe-area-top))]">
                    <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/38 px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.34)] backdrop-blur-xl">
                        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-100/58">Sandbox</div>
                        <h2 className="text-[16px] font-black uppercase tracking-[0.12em] text-white">Meu Jardim</h2>
                    </div>
                    <div className="pointer-events-auto flex items-center gap-2">
                        {isOwnGarden && (
                            <button
                                type="button"
                                onClick={saveGarden}
                                disabled={!hasUnsavedChanges}
                                className="rounded-full border border-amber-200/34 bg-black/46 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-amber-50 shadow-[0_16px_36px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-colors hover:bg-amber-200/14 disabled:cursor-default disabled:border-white/8 disabled:text-white/35"
                            >
                                {hasUnsavedChanges ? 'Salvar' : 'Salvo'}
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="rounded-full border border-white/12 bg-black/42 p-3 text-white/76 shadow-[0_16px_36px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-colors hover:text-white">
                            <XIcon className="h-5 w-5" />
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
                                    {tool === 'eraser' ? 'Apagar areia' : `${activeRake.label} - ${activePressure.label}`}
                                </span>
                            </span>
                            <span className="rounded-full border border-amber-200/28 bg-amber-100/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-amber-50">Abrir</span>
                        </button>
                    ) : (
                        <div className="pointer-events-auto w-[min(25rem,calc(100vw-1.5rem))] overflow-hidden rounded-[26px] border border-white/10 bg-black/54 shadow-[0_18px_48px_rgba(0,0,0,0.46)] backdrop-blur-2xl md:w-full">
                            <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-white/8 p-2">
                                <div className="grid grid-cols-2 gap-1">
                                    <button type="button" onClick={() => setActiveTray('tools')} className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${activeTray === 'tools' ? 'bg-amber-200/16 text-amber-50 ring-1 ring-amber-200/28' : 'text-white/48'}`}>Ferramentas</button>
                                    <button type="button" onClick={() => setActiveTray('items')} className={`rounded-2xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${activeTray === 'items' ? 'bg-amber-200/16 text-amber-50 ring-1 ring-amber-200/28' : 'text-white/48'}`}>Itens</button>
                                </div>
                                <button type="button" onClick={() => setIsTrayOpen(false)} className="h-9 rounded-2xl border border-white/8 bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white/62">Fechar</button>
                            </div>

                            {activeTray === 'tools' ? (
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
                                        <div className="mb-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/38">Pontas</div>
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
                                    {selectedItem && (
                                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-2 py-2">
                                            <button type="button" onClick={() => adjustSelectedItemScale(-0.12)} className="h-8 w-8 rounded-xl bg-black/30 text-sm font-black text-white/72">-</button>
                                            <div className="text-center text-[9px] font-black uppercase tracking-[0.14em] text-white/42">Tamanho</div>
                                            <button type="button" onClick={() => adjustSelectedItemScale(0.12)} className="h-8 w-8 rounded-xl bg-black/30 text-sm font-black text-white/72">+</button>
                                        </div>
                                    )}
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
