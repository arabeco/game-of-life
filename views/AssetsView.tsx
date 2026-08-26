import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useEffect } from 'react';
import { AssetArenaBoard } from '../components/AssetArenaBoard';
import { AssetArtButton } from '../components/AssetArtButton';
import { InputModal } from '../components/inputs/InputModal';
import { Sephirot } from '../components/Sephirot';
import { EditIcon, XIcon } from '../components/Icons';
import { ASSET_ACCENT_COLORS, DEFAULT_ASSET_ART_BY_ID } from '../constants/assetVisuals';
import { LIFE_AREAS } from '../constants/lifeAreas';
import { useAssetsOverviewLayoutConfig } from '../hooks/useAssetsOverviewLayoutConfig';
import { calculateArenaProgress } from '../utils/progressUtils';
import { filterTasksAfterFreeProgressReset } from '../utils/freeProgressScope';
import { formatDate, getCycleTimingSummary } from '../utils/dateUtils';
import { getProfileBackgroundPrimarySource, isCssProfileBackground } from '../utils/profileBackgrounds';
import type { Action, Asset, Slot, SlotValue } from '../types';

const hexToRgb = (hex: string): [number, number, number] | null => {
    const normalized = String(hex || '').trim();
    if (!normalized) return null;

    if (normalized.startsWith('rgb')) {
        const values = normalized
            .replace(/rgba?\(|\)/g, '')
            .split(',')
            .map((value) => Number.parseFloat(value.trim()));
        if (values.length >= 3 && values.every((value) => Number.isFinite(value))) {
            return [values[0], values[1], values[2]];
        }
        return null;
    }

    const hexOnly = normalized.replace('#', '');
    if (hexOnly.length !== 6) return null;
    const value = Number.parseInt(hexOnly, 16);
    if (Number.isNaN(value)) return null;
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const mixRgb = (
    rgbA: [number, number, number] | null,
    rgbB: [number, number, number],
    amount: number
): [number, number, number] | null => {
    if (!rgbA) return null;
    const t = Math.max(0, Math.min(1, amount));
    return [
        Math.round(rgbA[0] * (1 - t) + rgbB[0] * t),
        Math.round(rgbA[1] * (1 - t) + rgbB[1] * t),
        Math.round(rgbA[2] * (1 - t) + rgbB[2] * t),
    ];
};

const rgbaString = (rgb: [number, number, number] | null, alpha: number): string =>
    rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})` : `rgba(212, 175, 55, ${alpha})`;

const rgbString = (rgb: [number, number, number] | null): string =>
    rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : 'rgb(212, 175, 55)';

const lightenToward = (rgb: [number, number, number] | null, target: [number, number, number], amount: number) =>
    mixRgb(rgb, target, amount) || target;

const escapeCssUrl = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const buildAssetArtLayer = (value?: string): string | null => {
    const normalized = (value || '').trim();
    if (!normalized) return null;

    const primarySource = getProfileBackgroundPrimarySource(normalized).trim();
    if (!primarySource) return null;

    return isCssProfileBackground(primarySource)
        ? primarySource
        : `url("${escapeCssUrl(primarySource)}")`;
};

const getDefaultAssetArt = (assetId: string): string | undefined =>
    DEFAULT_ASSET_ART_BY_ID[assetId as keyof typeof DEFAULT_ASSET_ART_BY_ID];

const relativeLuminance = (rgb: [number, number, number] | null) => {
    if (!rgb) return 0;
    const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
};

const hasRasterSephirotBackground = (value: string | null | undefined): boolean => {
    const normalized = (value || '').trim();
    if (!normalized || normalized === 'none') return false;
    return /url\((['"]?).+\.(png|jpe?g)(?:[?#][^'")]*)?\1\)/i.test(normalized);
};

const isSlotValueEmpty = (value: SlotValue | undefined): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized.length === 0 || normalized === 'nao definido' || normalized === 'não definido';
    }
    if (typeof value === 'number') return false;
    return !value.imageUrl?.trim();
};

const buildCycleActionTotal = (cycleActions: Action[], scheduledTaskCount: number): number => {
    const plannedFromActions = cycleActions.reduce((sum, action) => {
        if (action.actionType === 'Marco') return sum;
        if (action.actionType === 'Livre') return sum + 1;
        const repetitions = Number.isFinite(action.repetitions) ? Math.max(1, Math.floor(action.repetitions)) : 1;
        return sum + repetitions;
    }, 0);

    return Math.max(plannedFromActions, scheduledTaskCount);
};

export const AssetsView: React.FC = () => {
    const { assets, userProfile, updateUserProfile, showToast, activeCycle, freeProgressResetAt, dailyCommitment, getArenas, actions, tasks } = useGame();
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [isEditingAssetDetail, setIsEditingAssetDetail] = useState(false);
    const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
    const [draftAssetArtUrl, setDraftAssetArtUrl] = useState<string | undefined>(undefined);
    const [draftAssetWidgetValue, setDraftAssetWidgetValue] = useState<SlotValue | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const cycleSummaryRef = useRef<HTMLButtonElement | null>(null);
    const lastSelectedAssetIdRef = useRef<string | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [cycleSummaryHeight, setCycleSummaryHeight] = useState(48);
    const [hasSephirotRasterArt, setHasSephirotRasterArt] = useState(false);
    const overviewLayout = useAssetsOverviewLayoutConfig();

    const selectedAsset = assets.find(a => a.id === selectedAssetId) || null;
    const assetWidgetValues = userProfile.assetWidgetValues || {};
    const assetArtById = userProfile.assetArtById || {};
    const currentSelectedAssetArtUrl = selectedAsset ? assetArtById[selectedAsset.id] : undefined;
    const currentSelectedAssetWidgetValue = selectedAsset ? assetWidgetValues[selectedAsset.id] : undefined;
    const selectedAssetArtUrl = selectedAsset
        ? (draftAssetArtUrl !== undefined ? draftAssetArtUrl : currentSelectedAssetArtUrl)
        : undefined;
    const selectedAssetArtLayer = buildAssetArtLayer(
        selectedAssetArtUrl || (selectedAsset ? getDefaultAssetArt(selectedAsset.id) : undefined)
    );
    const selectedAssetPrimarySlot = useMemo(() => {
        if (!selectedAsset?.slots?.[0]) return null;
        const slot = selectedAsset.slots[0];
        const storedValue = draftAssetWidgetValue !== undefined
            ? draftAssetWidgetValue
            : assetWidgetValues[selectedAsset.id];
        return {
            ...slot,
            value: storedValue !== undefined ? storedValue : slot.value,
        };
    }, [selectedAsset, assetWidgetValues, draftAssetWidgetValue]);
    const selectedAssetAccent = selectedAsset
        ? ASSET_ACCENT_COLORS[selectedAsset.id as keyof typeof ASSET_ACCENT_COLORS] || '#4b5563'
        : '#4b5563';
    const selectedAssetLevel = selectedAsset ? Math.max(1, Number(selectedAsset.level || 1)) : 1;
    const selectedAssetMasteryPhrase = selectedAsset?.levelDescriptions?.[selectedAssetLevel] || '';
    const canShowSelectedAssetWidget = Boolean(selectedAssetPrimarySlot);
    const selectedAssetAccentRgb = hexToRgb(selectedAssetAccent);
    const cycleAccentRgb = hexToRgb(userProfile.skinColor || '#d4af37');
    const cycleLabelColor = lightenToward(cycleAccentRgb, [168, 182, 201], 0.52);
    const cycleTitleColor = lightenToward(cycleAccentRgb, [247, 243, 233], 0.8);
    const cycleMetaColor = lightenToward(cycleAccentRgb, [199, 209, 223], 0.58);

    const baseAspect = 9 / 16;
    const assetsShellStyle: React.CSSProperties = {
        height: '100%',
        minHeight: '100%',
    };
    const containerAspect = containerSize.width > 0 && containerSize.height > 0
        ? containerSize.width / containerSize.height
        : baseAspect;
    const stretchY = 1;
    const cycleSummaryTop = '10px';
    const cycleSummaryTopPx = 10;
    const assetsGridTopPx = cycleSummaryTopPx + cycleSummaryHeight + 18;
    const assetsGridBottomPx = 72;
    const overviewCoords = useMemo(
        () => Object.entries(overviewLayout).map(([id, position]) => ({ id, ...position })),
        [overviewLayout],
    );

    const allArenas = useMemo(() => getArenas(), [getArenas, assets]);
    const cycleScopedTasks = useMemo(() => {
        if (!activeCycle) return filterTasksAfterFreeProgressReset(tasks, freeProgressResetAt);
        return tasks.filter((task) => typeof task?.date === 'string' && task.date >= activeCycle.startDate && task.date <= activeCycle.endDate);
    }, [tasks, activeCycle?.startDate, activeCycle?.endDate, freeProgressResetAt]);

    const assetStats = useMemo(() => {
        return new Map(
            assets.map((asset) => {
                const arenasForAsset = allArenas.filter((arena) => arena.assetId === asset.id);
                const actionsForAsset = actions.filter((action) => arenasForAsset.some((arena) => arena.id === action.arenaId));
                const activeCount = arenasForAsset.filter((arena) => !arena.isArchived).length;
                const archivedCount = arenasForAsset.filter((arena) => arena.isArchived).length;
                let totalCompleted = 0;
                let totalPlanned = 0;

                for (const arena of arenasForAsset) {
                    const arenaActions = actions.filter((action) => action.arenaId === arena.id);
                    const actionIds = new Set(arenaActions.map((action) => action.id));
                    const arenaTasks = cycleScopedTasks.filter((task) => actionIds.has(task.actionId));
                    const arenaProgress = calculateArenaProgress({
                        arena,
                        actions: arenaActions,
                        tasks: arenaTasks,
                    });
                    totalCompleted += arenaProgress.totalCompleted;
                    totalPlanned += arenaProgress.totalPlanned;
                }

                const hasMeasurableProgress = totalPlanned > 0;
                const progressPercent = hasMeasurableProgress ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
                return [asset.id, { activeCount, archivedCount, totalActions: actionsForAsset.length, totalCompleted, totalPlanned, progressPercent, hasMeasurableProgress }];
            })
        );
    }, [allArenas, assets, actions, cycleScopedTasks]);

    const cycleSummary = useMemo(() => {
        if (!activeCycle) return null;

        const cycleTiming = getCycleTimingSummary(activeCycle.startDate, activeCycle.endDate, dailyCommitment?.date);
        const cycleArenaIds = new Set(activeCycle.arenaIds || []);
        const scopedArenas = cycleArenaIds.size > 0 ? allArenas.filter((arena) => cycleArenaIds.has(arena.id)) : allArenas;
        const activeArenaCount = scopedArenas.filter((arena) => !arena.isArchived).length;
        const archivedArenaCount = scopedArenas.filter((arena) => arena.isArchived).length;
        const scopedArenaIds = new Set(scopedArenas.map((arena) => arena.id));
        const scopedActions = actions.filter((action) => scopedArenaIds.has(action.arenaId) && action.actionType !== 'Marco');
        const scopedActionIds = new Set(scopedActions.map((action) => action.id));
        const scopedTasks = cycleScopedTasks.filter((task) => scopedActionIds.has(task.actionId));
        const totalCompleted = scopedTasks.filter((task) => task.completed).length;
        const totalPlanned = buildCycleActionTotal(scopedActions, scopedTasks.length);
        const safeCompleted = Math.min(totalCompleted, totalPlanned);
        const computedProgress = totalPlanned > 0 ? Math.round((safeCompleted / totalPlanned) * 100) : 0;

        return {
            name: activeCycle.name,
            progress: computedProgress,
            timeProgress: Math.max(0, Math.min(100, Math.round(cycleTiming.timeProgress || 0))),
            elapsedDays: cycleTiming.elapsedDays,
            totalDays: cycleTiming.totalDays,
            statusLabel: cycleTiming.statusLabel,
            inclusiveLabel: cycleTiming.inclusiveLabel,
            activeArenaCount,
            archivedArenaCount,
            totalCompleted: safeCompleted,
            totalPlanned,
            startDate: activeCycle.startDate,
            endDate: activeCycle.endDate,
        };
    }, [activeCycle, allArenas, dailyCommitment?.date, actions, cycleScopedTasks]);

    useLayoutEffect(() => {
        const summaryCard = cycleSummaryRef.current;
        const fallbackHeight = activeCycle ? 48 : 34;

        if (!summaryCard) {
            setCycleSummaryHeight(fallbackHeight);
            return;
        }

        const updateSummaryHeight = () => {
            const nextHeight = Math.ceil(summaryCard.getBoundingClientRect().height);
            setCycleSummaryHeight(nextHeight > 0 ? nextHeight : fallbackHeight);
        };

        updateSummaryHeight();

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => updateSummaryHeight());
            observer.observe(summaryCard);
            return () => observer.disconnect();
        }

        const rafId = requestAnimationFrame(updateSummaryHeight);
        return () => cancelAnimationFrame(rafId);
    }, [
        activeCycle,
        cycleSummary?.name,
        cycleSummary?.progress,
        cycleSummary?.timeProgress,
        cycleSummary?.elapsedDays,
        cycleSummary?.totalDays,
        cycleSummary?.activeArenaCount,
    ]);

    useLayoutEffect(() => {
        const target = containerRef.current ?? document.documentElement;
        const styles = getComputedStyle(target);
        const sephirotBackground = styles.getPropertyValue('--sephirot-bg-image').trim();
        setHasSephirotRasterArt(hasRasterSephirotBackground(sephirotBackground));
    }, [userProfile.skin]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        };

        updateSize();

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => updateSize());
            observer.observe(container);
            return () => observer.disconnect();
        }

        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [selectedAssetId]);

    useEffect(() => {
        if (!selectedAsset) {
            lastSelectedAssetIdRef.current = null;
            setIsEditingAssetDetail(false);
            setEditingSlot(null);
            setDraftAssetArtUrl(undefined);
            setDraftAssetWidgetValue(undefined);
            return;
        }

        const fallbackWidgetValue = currentSelectedAssetWidgetValue !== undefined
            ? currentSelectedAssetWidgetValue
            : selectedAsset.slots?.[0]?.value;
        const didChangeSelectedAsset = lastSelectedAssetIdRef.current !== selectedAsset.id;
        lastSelectedAssetIdRef.current = selectedAsset.id;

        if (didChangeSelectedAsset) {
            setIsEditingAssetDetail(false);
            setEditingSlot(null);
            setDraftAssetArtUrl(currentSelectedAssetArtUrl);
            setDraftAssetWidgetValue(fallbackWidgetValue);
            return;
        }

        if (!isEditingAssetDetail && !editingSlot) {
            setDraftAssetArtUrl(currentSelectedAssetArtUrl);
            setDraftAssetWidgetValue(fallbackWidgetValue);
        }
    }, [selectedAsset, currentSelectedAssetArtUrl, currentSelectedAssetWidgetValue, isEditingAssetDetail, editingSlot]);

    const handleOpenAsset = (asset: Asset) => {
        setSelectedAssetId(asset.id);
        setEditingSlot(null);
    };

    const handleBack = () => {
        setSelectedAssetId(null);
        setIsEditingAssetDetail(false);
        setEditingSlot(null);
    };

    const handleOpenReports = () => {
        window.dispatchEvent(new CustomEvent('tutorialNavigate', {
            detail: {
                view: 'assets',
                showReports: true,
            },
        }));
    };

    const handleEnterAssetDetailEdit = () => {
        if (!selectedAsset) return;
        setIsEditingAssetDetail(true);
        setEditingSlot(null);
        setDraftAssetArtUrl(currentSelectedAssetArtUrl);
        setDraftAssetWidgetValue(
            currentSelectedAssetWidgetValue !== undefined
                ? currentSelectedAssetWidgetValue
                : selectedAsset.slots?.[0]?.value
        );
    };

    const handleCancelAssetDetailEdit = () => {
        if (!selectedAsset) return;
        setIsEditingAssetDetail(false);
        setEditingSlot(null);
        setDraftAssetArtUrl(currentSelectedAssetArtUrl);
        setDraftAssetWidgetValue(
            currentSelectedAssetWidgetValue !== undefined
                ? currentSelectedAssetWidgetValue
                : selectedAsset.slots?.[0]?.value
        );
    };

    const handleConfirmAssetDetailEdit = () => {
        if (!selectedAsset) return;

        const profilePatch: Partial<typeof userProfile> = {};

        if ((draftAssetArtUrl || '') !== (currentSelectedAssetArtUrl || '')) {
            const nextAssetArtById = { ...(userProfile.assetArtById || {}) };
            if (draftAssetArtUrl) {
                nextAssetArtById[selectedAsset.id] = draftAssetArtUrl;
            } else {
                delete nextAssetArtById[selectedAsset.id];
            }
            profilePatch.assetArtById = nextAssetArtById;
        }

        const fallbackSlotValue = selectedAsset.slots?.[0]?.value;
        const persistedWidgetValue = currentSelectedAssetWidgetValue !== undefined
            ? currentSelectedAssetWidgetValue
            : fallbackSlotValue;
        if (JSON.stringify(draftAssetWidgetValue ?? null) !== JSON.stringify(persistedWidgetValue ?? null)) {
            const nextAssetWidgetValues = { ...(userProfile.assetWidgetValues || {}) };
            if (draftAssetWidgetValue === undefined || draftAssetWidgetValue === null) {
                delete nextAssetWidgetValues[selectedAsset.id];
            } else {
                nextAssetWidgetValues[selectedAsset.id] = draftAssetWidgetValue;
            }
            profilePatch.assetWidgetValues = nextAssetWidgetValues;
        }

        if (Object.keys(profilePatch).length > 0) {
            updateUserProfile(profilePatch);
        }

        setIsEditingAssetDetail(false);
        setEditingSlot(null);
    };

    const persistAssetArt = (nextUrl?: string, options?: { applyToAll?: boolean }) => {
        if (!selectedAsset) return;

        const applyToAll = !!options?.applyToAll;
        const normalizedNext = (nextUrl || '').trim();
        const nextAssetArtById = { ...(userProfile.assetArtById || {}) };
        const targetAssets = (applyToAll ? assets.filter((asset) => asset.id !== 'geral') : [selectedAsset])
            .filter((asset): asset is Asset => Boolean(asset));

        const hasChanges = targetAssets.some((asset) => {
            const currentValue = (nextAssetArtById[asset.id] || '').trim();
            return currentValue !== normalizedNext;
        });

        if (!hasChanges) return;

        targetAssets.forEach((asset) => {
            if (normalizedNext) {
                nextAssetArtById[asset.id] = normalizedNext;
            } else {
                delete nextAssetArtById[asset.id];
            }
        });

        updateUserProfile({ assetArtById: nextAssetArtById });

        if (applyToAll) {
            showToast('Fundo aplicado a todos os ativos.', 'success');
        }
    };

    const handleSaveAssetArtDraft = (nextUrl: string, options?: { applyToAll?: boolean }) => {
        setDraftAssetArtUrl(nextUrl);
        persistAssetArt(nextUrl, options);
    };

    const handleRemoveAssetArt = () => {
        setDraftAssetArtUrl(undefined);
        persistAssetArt(undefined);
    };

    const handleSaveAssetWidgetDraft = (nextValue: SlotValue) => {
        setDraftAssetWidgetValue(nextValue);
        setEditingSlot(null);
    };

    const selectedAssetCanvasStyle: React.CSSProperties = {
        backgroundImage: `${selectedAssetArtLayer ? `linear-gradient(180deg, rgba(5,5,7,0.08) 0%, rgba(5,5,7,0.54) 44%, rgba(5,5,7,0.78) 100%), ${selectedAssetArtLayer}, ` : ''}radial-gradient(circle at 16% 0%, rgba(255,246,204,0.24), transparent 29%),
            radial-gradient(circle at 92% 88%, ${rgbaString(selectedAssetAccentRgb, 0.16)}, transparent 24%),
            linear-gradient(180deg, rgba(9,11,16,0.72) 0%, rgba(5,6,9,0.86) 100%)`,
        backgroundSize: selectedAssetArtLayer ? 'cover, cover, auto, auto' : undefined,
        backgroundPosition: selectedAssetArtLayer ? 'center, center, center, center' : undefined,
        backgroundRepeat: selectedAssetArtLayer ? 'no-repeat, no-repeat, no-repeat, no-repeat' : undefined,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -28px 72px rgba(0,0,0,0.14)',
    };
    const selectedAssetWidgetShellStyle: React.CSSProperties = {
        backgroundImage: `linear-gradient(150deg, rgba(255,245,220,0.12) 0%, rgba(255,255,255,0.04) 24%, rgba(209,169,80,0.12) 44%, rgba(0,0,0,0.16) 74%, ${rgbaString(selectedAssetAccentRgb, 0.12)} 100%)`,
    };

    if (selectedAsset) {
        return (
            <div
                className="assets-detail-root flex h-full overflow-y-auto px-4 py-4"
                style={{
                    '--ui-card-text': 'rgba(248, 250, 252, 0.94)',
                    '--ui-card-text-soft': 'rgba(203, 213, 225, 0.86)',
                    '--ui-text-accent': 'rgba(244, 248, 252, 0.96)',
                    '--ui-text-accent-soft': 'rgba(214, 223, 233, 0.84)',
                } as React.CSSProperties}
            >
                <div className="my-auto w-full max-w-[520px] mx-auto">
                    <div
                        className="relative flex flex-col overflow-hidden rounded-[24px] border px-3 pb-3 pt-3 shadow-2xl shadow-black/50"
                        style={{
                            ...selectedAssetCanvasStyle,
                            borderColor: rgbaString(selectedAssetAccentRgb, 0.58),
                        }}
                    >
                        <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3">
                            {isEditingAssetDetail ? (
                                <AssetArtButton
                                    assetId={selectedAsset.id}
                                    assetName={selectedAsset.name}
                                    currentUrl={selectedAssetArtUrl}
                                    compact
                                    iconOnly
                                    onSave={handleSaveAssetArtDraft}
                                    onRemove={handleRemoveAssetArt}
                                />
                            ) : (
                                <div className="h-8 w-8" />
                            )}

                            <div className="flex items-center gap-2">
                                {isEditingAssetDetail ? (
                                    <button
                                        type="button"
                                        onClick={handleCancelAssetDetailEdit}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-black/32 text-white/80 transition-colors hover:bg-white/10"
                                        title="Cancelar edição"
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleEnterAssetDetailEdit}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-black/32 text-white/80 transition-colors hover:bg-white/10"
                                        title={`Editar ${selectedAsset.name}`}
                                    >
                                        <EditIcon className="h-4 w-4" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={isEditingAssetDetail ? handleConfirmAssetDetailEdit : handleBack}
                                    className="justify-self-end px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] rounded-lg luxe-skin-button"
                                >
                                    OK
                                </button>
                            </div>
                        </div>

                        <div
                            className="overflow-hidden"
                        >
                            <div className="grid min-w-0 grid-cols-[56px_minmax(0,1fr)_56px] items-center gap-2 px-2 pb-4 pt-1 text-center">
                                <Sephirot
                                    asset={selectedAsset}
                                    onClick={() => {}}
                                    useSkinArtworkOnly={hasSephirotRasterArt}
                                    showLabel={false}
                                    size="56px"
                                    interactive={false}
                                />
                                <div className="flex min-h-[52px] min-w-0 items-center justify-center rounded-[12px] border border-white/24 bg-[rgba(18,21,27,0.58)] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_18px_rgba(0,0,0,0.28)] backdrop-blur-[3px]">
                                    <p
                                        className="line-clamp-2 text-[21px] font-black uppercase leading-[1.08] tracking-[0.055em] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.86)]"
                                    >
                                        {selectedAsset.name}
                                    </p>
                                </div>
                                <div className="h-14 w-full" />
                            </div>

                            <div className="mx-1 mb-2 border-y border-white/14 bg-[rgba(5,7,10,0.62)] px-3 py-3">
                                <div className="min-w-0 text-center">
                                        <p
                                            className="text-[14px] font-semibold leading-[1.35] text-white/95"
                                            style={{ WebkitFontSmoothing: 'antialiased', textRendering: 'optimizeLegibility' }}
                                        >
                                            {selectedAssetMasteryPhrase || 'Essa area ainda nao tem uma frase de maestria definida.'}
                                        </p>
                                </div>
                            </div>

                            <div className="overflow-y-auto pr-1 -mr-1 custom-scrollbar px-1 pb-1">
                                <div className="space-y-2">
                                {canShowSelectedAssetWidget && selectedAssetPrimarySlot ? (
                                    <div className="border-t border-white/12 px-3 py-3">
                                        <div className="text-center">
                                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/88">
                                                {selectedAssetPrimarySlot.label}
                                            </p>
                                        </div>

                                        <div className="mt-3 text-center space-y-0.5 flex flex-col">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!isEditingAssetDetail) return;
                                                    setEditingSlot(selectedAssetPrimarySlot);
                                                }}
                                                className={`relative w-full min-h-[2.75rem] rounded-lg border border-[color:var(--skin-accent-color)] bg-black/26 p-2 text-white transition-colors flex items-center justify-center ${isEditingAssetDetail ? 'hover:bg-black/38' : 'cursor-default'}`}
                                                style={selectedAssetWidgetShellStyle}
                                            >
                                                {isSlotValueEmpty(selectedAssetPrimarySlot.value) ? (
                                                    <span className="line-clamp-3 px-1 text-center text-sm font-semibold text-white/45">
                                                        Sem valor
                                                    </span>
                                                ) : (
                                                    <p className="line-clamp-3 px-1 text-center text-base font-semibold text-white">
                                                        {String(selectedAssetPrimarySlot.value)}
                                                    </p>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                                <AssetArenaBoard asset={selectedAsset} showArchived={false} />
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
                {editingSlot && (
                    <InputModal
                        slot={editingSlot}
                        onClose={() => setEditingSlot(null)}
                        onSave={handleSaveAssetWidgetDraft}
                    />
                )}
            </div>
        );
    }

    return (
        <div
            className="assets-view-root relative h-full min-h-0 overflow-hidden"
            style={{ overscrollBehavior: 'none', touchAction: 'manipulation' }}
        >
            <div
                className="assets-view-shell relative flex h-full min-h-0 items-stretch justify-start overflow-hidden rounded-[30px]"
                style={assetsShellStyle}
            >
                <div ref={containerRef} className="relative h-full min-h-0 w-full overflow-hidden">
                    <div className="assets-sephirot-backdrop absolute inset-0 z-0" />

                    <div className="relative z-10 h-full w-full">
                        <div className="absolute inset-x-0 z-20 flex justify-center px-3" style={{ top: cycleSummaryTop }}>
                            <button
                                ref={cycleSummaryRef}
                                type="button"
                                onClick={handleOpenReports}
                                className={`group w-full overflow-hidden border border-white/10 px-3 text-left backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-[1px] ${activeCycle ? 'max-w-[300px] rounded-[14px] pb-1.5 pt-0.5' : 'max-w-[214px] rounded-[12px] py-1.5'}`}
                                style={{
                                    borderColor: rgbaString(cycleAccentRgb, 0.32),
                                    backgroundImage: `radial-gradient(circle at 18% 10%, ${rgbaString(cycleAccentRgb, 0.24)} 0%, transparent 34%), linear-gradient(180deg, rgba(31,38,48,0.94) 0%, rgba(13,17,22,0.98) 100%)`,
                                    boxShadow: `0 16px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${rgbaString(cycleAccentRgb, 0.12)}`,
                                    minHeight: activeCycle ? '58px' : '34px',
                                }}
                            >
                                {cycleSummary ? (
                                    <div className="space-y-0.5">
                                        <div className="relative min-h-[11px]">
                                            <h3 className="mx-auto max-w-[176px] truncate text-center text-[10px] font-black uppercase tracking-[0.09em]" style={{ color: rgbString(cycleTitleColor) }}>
                                                {cycleSummary.name}
                                            </h3>
                                            <span className="absolute left-0 top-1/2 max-w-[86px] -translate-y-1/2 truncate text-left text-[8px] font-black tracking-[0.02em]" style={{ color: rgbaString(cycleMetaColor, 0.86) }}>
                                                {`${formatDate(cycleSummary.startDate)}-${formatDate(cycleSummary.endDate)}`}
                                            </span>
                                        </div>
                                        <div className="space-y-[1px]">
                                            <div>
                                                <div className="flex items-center justify-between gap-2 text-[7px] font-black uppercase tracking-[0.08em]">
                                                    <span style={{ color: rgbaString(cycleMetaColor, 0.84) }}>Progresso</span>
                                                    <span className="shrink-0" style={{ color: rgbString(cycleTitleColor) }}>{`${cycleSummary.totalCompleted}/${cycleSummary.totalPlanned} (${cycleSummary.progress}%)`}</span>
                                                </div>
                                                <div className="mt-0.5 h-[3px] w-full overflow-hidden rounded-full bg-black/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${cycleSummary.progress}%`,
                                                            background: 'linear-gradient(90deg, #b47a18 0%, #ffd462 48%, #fff1b8 100%)',
                                                            boxShadow: '0 0 12px rgba(255,212,98,0.46), 0 0 2px rgba(255,255,255,0.72)',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between gap-2 text-[7px] font-black uppercase tracking-[0.08em]">
                                                    <span style={{ color: rgbaString(cycleMetaColor, 0.84) }}>Tempo</span>
                                                    <span className="shrink-0" style={{ color: rgbaString(cycleMetaColor, 0.96) }}>{`${cycleSummary.elapsedDays}/${cycleSummary.totalDays} (${cycleSummary.timeProgress}%)`}</span>
                                                </div>
                                                <div className="mt-0.5 h-[3px] w-full overflow-hidden rounded-full bg-black/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${cycleSummary.timeProgress}%`,
                                                            background: 'linear-gradient(90deg, rgba(168,178,196,0.95) 0%, rgba(236,242,255,0.98) 54%, rgba(255,255,255,1) 100%)',
                                                            boxShadow: '0 0 12px rgba(226,237,255,0.34), 0 0 2px rgba(255,255,255,0.68)',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative min-h-[24px]">
                                        <div className="mx-auto min-w-0 max-w-[150px] text-center">
                                            <h3 className="truncate text-[10px] font-black uppercase tracking-[0.09em]" style={{ color: rgbString(cycleTitleColor) }}>
                                                Sem ciclo ativo
                                            </h3>
                                            <p className="text-[7px] font-semibold uppercase tracking-[0.08em]" style={{ color: rgbaString(cycleMetaColor, 0.82) }}>
                                                Historico
                                            </p>
                                        </div>
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-[0.08em]" style={{ color: rgbaString(cycleMetaColor, 0.86) }}>
                                            Abrir
                                        </span>
                                    </div>
                                )}
                            </button>
                        </div>

                        <div id="assets-grid" className="absolute inset-x-0" style={{ top: assetsGridTopPx, bottom: assetsGridBottomPx }}>
                            <div className="asset-overview-grid grid h-full grid-rows-5">
                            {LIFE_AREAS.map(area => {
                                const asset = assets.find(a => a.id === area.id);
                                if (!asset) return null;
                                const assetArtLayer = buildAssetArtLayer(assetArtById[asset.id] || getDefaultAssetArt(asset.id));
                                const accent = ASSET_ACCENT_COLORS[asset.id as keyof typeof ASSET_ACCENT_COLORS] || 'var(--skin-accent-color)';
                                const accentRgb = hexToRgb(accent);
                                const stats = assetStats.get(asset.id) || { activeCount: 0, archivedCount: 0, totalActions: 0, totalCompleted: 0, totalPlanned: 0, progressPercent: 0, hasMeasurableProgress: false };
                                const activeArenas = asset.arenas.filter(arena => !arena.isArchived);
                                const visibleArenas = activeArenas.slice(0, 8);
                                const hiddenArenaCount = Math.max(0, activeArenas.length - visibleArenas.length);

                                return (
                                    <button
                                        key={asset.id}
                                        data-testid="asset-overview-card"
                                        type="button"
                                        onClick={() => handleOpenAsset(asset)}
                                        className="asset-overview-card group relative place-self-center text-left transition-transform duration-200 hover:-translate-y-px"
                                    >
                                        <div
                                            className="absolute inset-0 overflow-hidden rounded-[11px] border"
                                            style={{
                                                borderColor: rgbaString(accentRgb, 0.54),
                                                backgroundImage: `${assetArtLayer ? `linear-gradient(90deg, rgba(6,7,10,0.48), rgba(6,7,10,0.74)), ${assetArtLayer}, ` : ''}linear-gradient(105deg, ${rgbaString(accentRgb, 0.5)} 0%, ${rgbaString(accentRgb, 0.2)} 46%, rgba(8,10,14,0.9) 100%)`,
                                                backgroundSize: assetArtLayer ? 'cover, cover, auto' : undefined,
                                                backgroundPosition: 'center',
                                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), inset 5px 0 0 ${rgbaString(accentRgb, 0.82)}, 0 7px 16px rgba(0,0,0,0.42), 0 0 12px ${rgbaString(accentRgb, 0.12)}`,
                                            }}
                                        />

                                        <div
                                            className="absolute left-[3%] top-0 z-20 flex -translate-y-[24%] items-center justify-center"
                                            style={{ width: 'clamp(44px, 17cqw, 56px)', height: 'clamp(44px, 48cqh, 56px)' }}
                                        >
                                            <Sephirot
                                                asset={asset}
                                                onClick={() => handleOpenAsset(asset)}
                                                useSkinArtworkOnly={hasSephirotRasterArt}
                                                showLabel={false}
                                                size="clamp(44px, 48cqh, 56px)"
                                                interactive={false}
                                            />
                                        </div>

                                        <div className="absolute inset-0 z-10 flex min-w-0 flex-col px-[4%] pb-[8%] pt-[2%]">
                                            <div className="mx-auto flex min-h-[clamp(24px,27cqh,30px)] w-[62%] items-center justify-center rounded-[8px] border border-white/22 bg-[rgba(18,21,27,0.58)] px-[4%] py-[1.5%] shadow-[inset_0_1px_0_rgba(255,255,255,0.11),0_7px_16px_rgba(0,0,0,0.26)] backdrop-blur-[3px]">
                                                <h2 className="asset-overview-title line-clamp-2 text-center font-black uppercase leading-[1.06] tracking-[0.04em] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.86)]">
                                                    {area.id === 'proposito' ? area.shortName : area.name}
                                                </h2>
                                            </div>

                                            <div className="asset-overview-stats mx-auto mt-auto grid min-w-0 items-end justify-center">
                                                <div className="asset-overview-stat flex aspect-square flex-col items-center justify-center rounded-[6px] border border-white/24 bg-black/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_7px_16px_rgba(0,0,0,0.34)] backdrop-blur-[2px]">
                                                    <span className="text-[8px] font-black uppercase leading-none tracking-[0.06em] text-white/66">Arenas</span>
                                                    <span className="mt-2 text-[25px] font-black leading-none text-white">{stats.activeCount}</span>
                                                </div>

                                                <div className="asset-overview-emojis mx-auto flex min-w-0 flex-wrap content-center justify-center gap-x-1 gap-y-0.5 overflow-hidden text-[15px] [text-shadow:0_2px_7px_rgba(0,0,0,0.95)]">
                                                    {visibleArenas.length > 0
                                                        ? <>
                                                            {visibleArenas.map(arena => <span key={arena.id} className="w-4 text-center">{arena.icon || '◦'}</span>)}
                                                            {hiddenArenaCount > 0 && <span className="w-4 text-center text-[8px] font-black text-white/68">+{hiddenArenaCount}</span>}
                                                        </>
                                                        : <span className="text-[8px] font-black uppercase tracking-[0.08em] text-white/38">Vazia</span>}
                                                </div>

                                                <div className="asset-overview-stat flex aspect-square flex-col items-center justify-center rounded-[6px] border border-white/24 bg-black/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_7px_16px_rgba(0,0,0,0.34)] backdrop-blur-[2px]">
                                                    <span className="text-[8px] font-black uppercase leading-none tracking-[0.06em] text-white/66">Acoes</span>
                                                    <span className="mt-2 text-[25px] font-black leading-none text-white">{stats.totalActions}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute inset-x-3 bottom-1.5 z-20 h-2 overflow-hidden rounded-full border border-[#e3e8ef]/80 bg-black/78 shadow-[inset_0_1px_2px_rgba(0,0,0,0.9),0_0_8px_rgba(224,232,242,0.48),0_1px_0_rgba(255,255,255,0.28)]">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: stats.hasMeasurableProgress ? `${stats.progressPercent}%` : '0%',
                                                    background: `linear-gradient(90deg, ${rgbaString(accentRgb, 0.94)} 0%, ${rgbString(lightenToward(accentRgb, [255, 255, 255], 0.42))} 100%)`,
                                                    boxShadow: `0 0 12px ${rgbaString(accentRgb, 0.88)}, inset 0 1px 0 rgba(255,255,255,0.38)`,
                                                }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
