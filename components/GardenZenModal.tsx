import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GardenPlacedItem, GardenRakeStyle, GardenSandColor, GardenState, GardenStroke, UserProfile } from '../types';
import { useGame } from '../contexts/GameContext';
import { ItemDef, resolveItemDef } from '../constants/items';
import { Portal } from './Portal';
import { Trash2Icon, XIcon } from './Icons';

type SandDef = {
    id: GardenSandColor;
    label: string;
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
    { id: 'classic', label: 'Normal', color: '#cdb78d', groove: 'rgba(89, 64, 36, 0.32)', speck: 'rgba(255, 248, 220, 0.38)' },
    { id: 'white', label: 'Branca', color: '#e8e2d4', groove: 'rgba(108, 101, 92, 0.26)', speck: 'rgba(255, 255, 255, 0.52)' },
    { id: 'basalt', label: 'Basalto', color: '#9d9485', groove: 'rgba(42, 37, 34, 0.34)', speck: 'rgba(238, 229, 207, 0.32)' },
];

const RAKE_STYLES: Array<{ id: GardenRakeStyle; label: string; lines: number; gap: number; width: number; alpha: number }> = [
    { id: 'three', label: '3 linhas', lines: 3, gap: 7, width: 1.35, alpha: 0.66 },
    { id: 'wide', label: 'Grosso', lines: 5, gap: 8.5, width: 2.1, alpha: 0.58 },
    { id: 'soft', label: 'Leve', lines: 3, gap: 10, width: 0.9, alpha: 0.34 },
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
    from: { x: number; y: number },
    to: { x: number; y: number },
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

    if (stroke.tool === 'eraser') {
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = sand.color;
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(from.x * width, from.y * height);
        ctx.lineTo(to.x * width, to.y * height);
        ctx.stroke();
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = sand.speck;
        ctx.lineWidth = 18;
        ctx.stroke();
        ctx.restore();
        return;
    }

    const style = RAKE_STYLES.find((entry) => entry.id === stroke.rakeStyle) || RAKE_STYLES[0];
    const startOffset = -((style.lines - 1) * style.gap) / 2;

    ctx.save();
    ctx.globalAlpha = style.alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = sand.groove;
    ctx.lineWidth = style.width;
    for (let index = 0; index < style.lines; index += 1) {
        const offset = startOffset + index * style.gap;
        ctx.beginPath();
        ctx.moveTo(from.x * width + nx * offset, from.y * height + ny * offset);
        ctx.lineTo(to.x * width + nx * offset, to.y * height + ny * offset);
        ctx.stroke();
    }
    ctx.restore();
};

const drawGarden = (canvas: HTMLCanvasElement, state: GardenState) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const sand = getSandDef(state.sandColor);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = sand.color;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 360; i += 1) {
        const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        const y = (Math.sin(i * 78.233) * 23421.631) % 1;
        ctx.fillStyle = i % 2 === 0 ? sand.speck : 'rgba(0,0,0,0.08)';
        ctx.fillRect(Math.abs(x) * width, Math.abs(y) * height, 1, 1);
    }
    ctx.restore();

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
}> = ({ item, def, selected, onPointerDown }) => {
    const size = def.kind === 'plant' ? 54 : 62;
    return (
        <button
            type="button"
            onPointerDown={onPointerDown}
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
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
        const canvas = canvasRef.current;
        const board = boardRef.current;
        if (!canvas || !board) return;

        const resize = () => {
            const rect = board.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.floor(rect.width * dpr));
            canvas.height = Math.max(1, Math.floor(rect.height * dpr));
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            drawGarden(canvas, gardenState);
        };

        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(board);
        return () => observer.disconnect();
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

    const saveGarden = () => {
        if (!isOwnGarden || !gardenStateRef.current) return;
        updateUserProfile({ gardenState: { ...gardenStateRef.current, updatedAt: new Date().toISOString() } });
        setHasUnsavedChanges(false);
        showToast('Jardim salvo.', 'success');
    };

    const getPoint = (event: React.PointerEvent): { x: number; y: number } | null => {
        const board = boardRef.current;
        if (!board) return null;
        const rect = board.getBoundingClientRect();
        return {
            x: clamp01((event.clientX - rect.left) / rect.width),
            y: clamp01((event.clientY - rect.top) / rect.height),
        };
    };

    const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isOwnGarden) return;
        const point = getPoint(event);
        if (!point) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const stroke: GardenStroke = {
            id: `stroke-${Date.now()}`,
            tool,
            rakeStyle,
            points: [point],
        };
        drawingStrokeRef.current = stroke;
        commitState((prev) => ({ ...prev, strokes: [...(prev.strokes || []), stroke] }));
    };

    const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const current = drawingStrokeRef.current;
        if (!current) return;
        const point = getPoint(event);
        if (!point) return;
        current.points.push(point);
        commitState((prev) => ({
            ...prev,
            strokes: (prev.strokes || []).map((stroke) => stroke.id === current.id ? { ...current, points: [...current.points] } : stroke),
        }));
    };

    const stopDrawing = () => {
        drawingStrokeRef.current = null;
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
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = { id: itemId, pointerId: event.pointerId };
        setSelectedItemId(itemId);
    };

    const handleBoardPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) return;
        const point = getPoint(event);
        if (!point) return;
        const id = dragRef.current.id;
        commitState((prev) => ({
            ...prev,
            items: (prev.items || []).map((item) => item.id === id ? { ...item, x: point.x, y: point.y } : item),
        }));
    };

    const stopDrag = () => {
        dragRef.current = null;
    };

    const clearDrawing = () => {
        commitState((prev) => ({ ...prev, strokes: [] }));
    };

    const removeSelectedItem = () => {
        if (!selectedItemId) return;
        commitState((prev) => ({ ...prev, items: (prev.items || []).filter((item) => item.id !== selectedItemId) }));
        setSelectedItemId(null);
    };

    const activeSand = getSandDef(gardenState.sandColor);
    const placedItems = gardenState.items || [];

    return (
        <Portal>
            <div className="fixed inset-0 z-[22000] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md">
                <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#10100d] shadow-[0_28px_80px_rgba(0,0,0,0.7)]">
                    <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-200/60">Sandbox</div>
                            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">Meu Jardim</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {isOwnGarden && (
                                <span className={`hidden text-[10px] font-black uppercase tracking-[0.16em] sm:inline ${hasUnsavedChanges ? 'text-amber-200/80' : 'text-emerald-200/70'}`}>
                                    {hasUnsavedChanges ? 'Alterado' : 'Salvo'}
                                </span>
                            )}
                            {isOwnGarden && (
                                <button
                                    type="button"
                                    onClick={saveGarden}
                                    disabled={!hasUnsavedChanges}
                                    className="rounded-full border border-amber-200/30 bg-amber-200/12 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-50 transition-colors hover:bg-amber-200/18 disabled:cursor-default disabled:border-white/8 disabled:bg-white/5 disabled:text-white/35"
                                >
                                    Salvar
                                </button>
                            )}
                            <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition-colors hover:text-white">
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3 p-3 md:grid-cols-[184px_minmax(0,1fr)_168px] md:grid-rows-1">
                        <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
                            <div className="min-w-[178px] rounded-2xl border border-white/10 bg-black/24 p-2">
                                <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Areia</div>
                                <div className="grid grid-cols-3 gap-1.5 md:grid-cols-1">
                                    {SAND_COLORS.map((sand) => (
                                        <button
                                            key={sand.id}
                                            type="button"
                                            onClick={() => commitState((prev) => ({ ...prev, sandColor: sand.id }))}
                                            className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-left text-[10px] font-black uppercase tracking-[0.12em] transition-colors ${activeSand.id === sand.id ? 'border-amber-200/70 bg-white/12 text-white' : 'border-white/8 bg-white/5 text-white/55'}`}
                                        >
                                            <span className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: sand.color }} />
                                            {sand.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="min-w-[178px] rounded-2xl border border-white/10 bg-black/24 p-2">
                                <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Ferramenta</div>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button type="button" onClick={() => setTool('rake')} className={`rounded-xl border px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] ${tool === 'rake' ? 'border-amber-200/70 bg-white/12 text-white' : 'border-white/8 bg-white/5 text-white/55'}`}>Garfo</button>
                                    <button type="button" onClick={() => setTool('eraser')} className={`rounded-xl border px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] ${tool === 'eraser' ? 'border-amber-200/70 bg-white/12 text-white' : 'border-white/8 bg-white/5 text-white/55'}`}>Apagar</button>
                                </div>
                                <div className="mt-2 grid grid-cols-3 gap-1.5 md:grid-cols-1">
                                    {RAKE_STYLES.map((style) => (
                                        <button key={style.id} type="button" onClick={() => setRakeStyle(style.id)} className={`rounded-xl border px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] ${rakeStyle === style.id ? 'border-amber-200/70 bg-white/12 text-white' : 'border-white/8 bg-white/5 text-white/55'}`}>
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div
                            ref={boardRef}
                            className="relative min-h-[360px] overflow-hidden rounded-[24px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_20px_50px_rgba(0,0,0,0.42)]"
                            onPointerMove={handleBoardPointerMove}
                            onPointerUp={stopDrag}
                            onPointerCancel={stopDrag}
                            style={{ backgroundColor: activeSand.color }}
                        >
                            <canvas
                                ref={canvasRef}
                                className={`absolute inset-0 z-10 h-full w-full ${isOwnGarden ? (tool === 'eraser' ? 'cursor-crosshair' : 'cursor-cell') : ''}`}
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
                                    />
                                );
                            })}
                            <div className="pointer-events-none absolute inset-0 z-30 rounded-[24px] shadow-[inset_0_0_70px_rgba(74,48,24,0.18)]" />
                        </div>

                        <div className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
                            <div className="min-w-[160px] rounded-2xl border border-white/10 bg-black/24 p-2">
                                <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Artefatos</div>
                                <div className="grid max-h-[48vh] grid-cols-5 gap-1.5 overflow-y-auto pr-1 custom-scrollbar md:grid-cols-1">
                                    {ownedArtifactItems.length === 0 ? (
                                        <div className="col-span-full rounded-xl border border-white/8 bg-white/5 px-2 py-4 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">
                                            Nenhum artefato
                                        </div>
                                    ) : ownedArtifactItems.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => addItem(item.id)}
                                            className="group flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-xl border border-white/8 bg-white/5 px-1.5 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-white/70 transition-colors hover:bg-white/10"
                                            title={item.name}
                                        >
                                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/22">
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
                            </div>
                            <div className="min-w-[160px] rounded-2xl border border-white/10 bg-black/24 p-2">
                                <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/45">Acoes</div>
                                <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
                                    <button type="button" onClick={clearDrawing} className="rounded-xl border border-white/8 bg-white/5 px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 transition-colors hover:bg-white/10">
                                        Alisar
                                    </button>
                                    <button type="button" onClick={removeSelectedItem} disabled={!selectedItemId} className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/8 bg-white/5 px-2 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 transition-colors hover:bg-white/10 disabled:opacity-35">
                                        <Trash2Icon className="h-3.5 w-3.5" />
                                        Item
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
