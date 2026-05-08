import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useEffect } from 'react';
import { AssetArenaBoard } from '../components/AssetArenaBoard';
import { AssetArtButton } from '../components/AssetArtButton';
import { InputModal } from '../components/inputs/InputModal';
import { Sephirot } from '../components/Sephirot';
import { EditIcon, XIcon } from '../components/Icons';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { useAssetsOverviewLayoutConfig } from '../hooks/useAssetsOverviewLayoutConfig';
import { calculateArenaProgress } from '../utils/progressUtils';
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
    const { assets, userProfile, updateUserProfile, showToast, appMode, activeCycle, dailyCommitment, getArenas, actions, tasks } = useGame();
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

    const isBasicMode = appMode === 'BASIC';
    const basicSephirotLevelColor = '#d9bd82';
    const selectedAsset = assets.find(a => a.id === selectedAssetId) || null;
    const assetWidgetValues = userProfile.assetWidgetValues || {};
    const assetArtById = userProfile.assetArtById || {};
    const currentSelectedAssetArtUrl = selectedAsset ? assetArtById[selectedAsset.id] : undefined;
    const currentSelectedAssetWidgetValue = selectedAsset ? assetWidgetValues[selectedAsset.id] : undefined;
    const selectedAssetArtUrl = selectedAsset
        ? (draftAssetArtUrl !== undefined ? draftAssetArtUrl : currentSelectedAssetArtUrl)
        : undefined;
    const selectedAssetArtLayer = buildAssetArtLayer(selectedAssetArtUrl);
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
    const canShowSelectedAssetWidget = Boolean(!isBasicMode && selectedAssetPrimarySlot);
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
    const assetsGridTopPx = cycleSummaryTopPx + cycleSummaryHeight + 8;
    const assetsGridBottomPx = 64;
    const overviewCoords = useMemo(
        () => Object.entries(overviewLayout).map(([id, position]) => ({ id, ...position })),
        [overviewLayout],
    );

    const allArenas = useMemo(() => getArenas(), [getArenas, assets]);
    const cycleScopedTasks = useMemo(() => {
        if (!activeCycle) return tasks;
        return tasks.filter((task) => typeof task?.date === 'string' && task.date >= activeCycle.startDate && task.date <= activeCycle.endDate);
    }, [tasks, activeCycle?.startDate, activeCycle?.endDate]);

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

                const progressPercent = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 100;
                return [asset.id, { activeCount, archivedCount, totalActions: actionsForAsset.length, totalCompleted, totalPlanned, progressPercent }];
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
    }, [userProfile.skin, appMode]);

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

    const showAssetAura = true;
    const selectedAssetShellStyle: React.CSSProperties = {
        backgroundImage: `radial-gradient(circle at 16% 0%, rgba(255,246,204,0.26), transparent 29%),
            radial-gradient(circle at 24% 22%, rgba(226,192,98,0.16), transparent 25%),
            radial-gradient(circle at 92% 88%, ${rgbaString(selectedAssetAccentRgb, 0.14)}, transparent 24%),
            linear-gradient(135deg, rgba(224,186,84,0.24) 0%, rgba(255,250,230,0.06) 18%, rgba(8,8,8,0.94) 46%, rgba(2,2,2,0.98) 66%, ${rgbaString(selectedAssetAccentRgb, 0.08)} 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.42)',
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
                className="assets-detail-root h-full overflow-y-auto px-4 pb-4"
                style={{
                    '--ui-card-text': 'rgba(248, 250, 252, 0.94)',
                    '--ui-card-text-soft': 'rgba(203, 213, 225, 0.86)',
                    '--ui-text-accent': 'rgba(244, 248, 252, 0.96)',
                    '--ui-text-accent-soft': 'rgba(214, 223, 233, 0.84)',
                } as React.CSSProperties}
            >
                <div className="mx-auto max-w-[520px]">
                    <div
                        className="dossier-bg relative flex flex-col overflow-hidden rounded-[28px] border border-[color:var(--skin-accent-color)] px-4 pb-4 pt-4 shadow-2xl shadow-black/50"
                        style={selectedAssetShellStyle}
                    >
                        {showAssetAura && (
                            <div
                                className="modal-aura-overlay"
                                style={{ '--modal-aura-color': 'rgba(229, 191, 88, 0.16)' } as React.CSSProperties}
                            />
                        )}
                        <div
                            className="modal-sheen-overlay"
                            style={{
                                '--modal-sheen-color': 'rgba(255, 222, 120, 0.82)',
                                zIndex: 24,
                            } as React.CSSProperties}
                        />
                        <div className="relative z-10">
                        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
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

                            <div className="flex items-center justify-center">
                                <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/58">
                                    Painel do ativo
                                </div>
                            </div>

                            <div className="flex items-center justify-self-end gap-2">
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
                            className="mt-3 overflow-hidden rounded-[24px] border border-white/10"
                            style={selectedAssetCanvasStyle}
                        >
                            <div className="min-w-0 pb-3 pt-4 text-center">
                                <p
                                    className="luxe-title-ornate truncate px-6 text-lg font-black uppercase tracking-[0.18em] luxe-title-shadow"
                                    style={{ color: 'var(--ui-card-text)' }}
                                >
                                    {selectedAsset.name}
                                </p>
                            </div>

                            <div className="mx-3 mb-3 rounded-[20px] border border-white/10 bg-black/24 px-3 py-3 backdrop-blur-[2px]">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-base font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
                                        style={{
                                            borderColor: rgbaString(selectedAssetAccentRgb, 0.34),
                                            background: `linear-gradient(135deg, ${rgbaString(selectedAssetAccentRgb, 0.32)} 0%, rgba(10,12,16,0.92) 100%)`,
                                        }}
                                    >
                                        {selectedAssetLevel}
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/42">
                                            Maestria atual
                                        </p>
                                        <p className="mt-1 text-[12px] font-semibold leading-snug text-white/86">
                                            {selectedAssetMasteryPhrase || 'Essa area ainda nao tem uma frase de maestria definida.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-y-auto pr-1 -mr-1 custom-scrollbar px-1 pb-1">
                                <div className="space-y-2">
                                {canShowSelectedAssetWidget && selectedAssetPrimarySlot ? (
                                    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 backdrop-blur-[2px]">
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
                    {!isBasicMode && (
                        <div className="assets-sephirot-backdrop absolute inset-0 z-0" />
                    )}

                    <div className="relative z-10 h-full w-full">
                        <div className="absolute inset-x-0 z-20 flex justify-center px-3" style={{ top: cycleSummaryTop }}>
                            <button
                                ref={cycleSummaryRef}
                                type="button"
                                onClick={handleOpenReports}
                                className={`group w-full overflow-hidden border border-white/10 px-3 text-left backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-[1px] ${activeCycle ? 'max-w-[300px] rounded-[14px] py-1' : 'max-w-[214px] rounded-[12px] py-1.5'}`}
                                style={{
                                    borderColor: rgbaString(cycleAccentRgb, 0.32),
                                    backgroundImage: `radial-gradient(circle at 18% 10%, ${rgbaString(cycleAccentRgb, 0.24)} 0%, transparent 34%), linear-gradient(180deg, rgba(31,38,48,0.94) 0%, rgba(13,17,22,0.98) 100%)`,
                                    boxShadow: `0 16px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${rgbaString(cycleAccentRgb, 0.12)}`,
                                    minHeight: activeCycle ? '58px' : '34px',
                                }}
                            >
                                {cycleSummary ? (
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="truncate text-[10px] font-black uppercase tracking-[0.09em]" style={{ color: rgbString(cycleTitleColor) }}>
                                                {cycleSummary.name}
                                            </h3>
                                            <span className="shrink-0 text-[8px] font-black tracking-[0.02em]" style={{ color: rgbaString(cycleMetaColor, 0.86) }}>
                                                {`${formatDate(cycleSummary.startDate)}-${formatDate(cycleSummary.endDate)} (${cycleSummary.totalDays} dias)`}
                                            </span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div>
                                                <div className="flex items-center justify-between gap-2 text-[7px] font-black uppercase tracking-[0.08em]">
                                                    <span style={{ color: rgbaString(cycleMetaColor, 0.84) }}>Progresso</span>
                                                    <span className="shrink-0" style={{ color: rgbString(cycleTitleColor) }}>{`${cycleSummary.totalCompleted}/${cycleSummary.totalPlanned} (${cycleSummary.progress}%)`}</span>
                                                </div>
                                                <div className="mt-0.5 h-[2px] w-full overflow-hidden rounded-full bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${cycleSummary.progress}%`,
                                                            background: 'linear-gradient(90deg, #7a5813 0%, #d4af37 46%, #f6e2a3 100%)',
                                                            boxShadow: '0 0 10px rgba(212,175,55,0.24)',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between gap-2 text-[7px] font-black uppercase tracking-[0.08em]">
                                                    <span style={{ color: rgbaString(cycleMetaColor, 0.84) }}>Tempo</span>
                                                    <span className="shrink-0" style={{ color: rgbaString(cycleMetaColor, 0.96) }}>{`${cycleSummary.elapsedDays}/${cycleSummary.totalDays} (${cycleSummary.timeProgress}%)`}</span>
                                                </div>
                                                <div className="mt-0.5 h-[2px] w-full overflow-hidden rounded-full bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${cycleSummary.timeProgress}%`,
                                                            background: 'linear-gradient(90deg, rgba(118,128,145,0.7) 0%, rgba(209,216,226,0.92) 54%, rgba(255,255,255,0.98) 100%)',
                                                            boxShadow: '0 0 10px rgba(210,220,235,0.16)',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-[10px] font-black uppercase tracking-[0.09em]" style={{ color: rgbString(cycleTitleColor) }}>
                                                Sem ciclo ativo
                                            </h3>
                                            <p className="text-[7px] font-semibold uppercase tracking-[0.08em]" style={{ color: rgbaString(cycleMetaColor, 0.82) }}>
                                                Historico
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.08em]" style={{ color: rgbaString(cycleMetaColor, 0.86) }}>
                                            Abrir
                                        </span>
                                    </div>
                                )}
                            </button>
                        </div>

                        <div id="assets-grid" className="absolute inset-x-0" style={{ top: assetsGridTopPx, bottom: assetsGridBottomPx }}>
                            {overviewCoords.map(coord => {
                                const asset = assets.find(a => a.id === coord.id);
                                if (!asset) return null;
                                const assetArtLayer = buildAssetArtLayer(assetArtById[asset.id]);

                                const yNorm = coord.y / 100;
                                const yStretched = Math.min(1, Math.max(0, (yNorm - 0.5) * stretchY + 0.5));
                                const accent = ASSET_ACCENT_COLORS[asset.id as keyof typeof ASSET_ACCENT_COLORS] || 'var(--skin-accent-color)';
                                const accentRgb = hexToRgb(accent);
                                const stats = assetStats.get(asset.id) || { activeCount: 0, archivedCount: 0, totalActions: 0, totalCompleted: 0, totalPlanned: 0, progressPercent: 100 };

                                return (
                                    <div
                                        key={asset.id}
                                        className="absolute flex items-center justify-center"
                                        style={{
                                            left: `${coord.x}%`,
                                            top: `${yStretched * 100}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleOpenAsset(asset)}
                                            className="group relative flex min-h-[70px] w-[124px] flex-col items-center overflow-visible rounded-[22px] border px-2 pb-0.5 pt-[18px] text-center transition-all duration-300 hover:-translate-y-[2px]"
                                            style={{
                                                borderColor: rgbaString(accentRgb, 0.42),
                                                backgroundImage: `${assetArtLayer ? `linear-gradient(180deg, rgba(6,7,10,0.04) 0%, rgba(6,7,10,0.4) 42%, rgba(6,7,10,0.62) 100%), ${assetArtLayer}, ` : ''}radial-gradient(circle at 50% -16%, ${rgbaString(accentRgb, 0.17)}, transparent 34%), radial-gradient(circle at 50% 108%, ${rgbaString(accentRgb, 0.09)} 0%, transparent 54%), linear-gradient(180deg, ${rgbaString(accentRgb, 0.04)} 0%, rgba(32,36,45,0.72) 18%, rgba(10,12,16,0.82) 100%)`,
                                                backgroundSize: assetArtLayer ? 'cover, auto, auto, auto' : undefined,
                                                backgroundPosition: assetArtLayer ? 'center, center, center, center' : undefined,
                                                boxShadow: `0 18px 34px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 0 999px ${rgbaString(accentRgb, 0.022)}, 0 0 0 1px ${rgbaString(accentRgb, 0.12)}`,
                                            }}
                                        >
                                            <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[42%]">
                                                <Sephirot
                                                    asset={asset}
                                                    onClick={() => handleOpenAsset(asset)}
                                                    levelColor={isBasicMode ? basicSephirotLevelColor : undefined}
                                                    useSkinArtworkOnly={hasSephirotRasterArt}
                                                    showLabel={false}
                                                    size="50px"
                                                    interactive={false}
                                                />
                                            </div>
                                            <div className="-mt-0.5 relative z-10 flex w-full justify-center">
                                                <div
                                                    className="w-fit max-w-[104px] rounded-[10px] border border-white/5 px-1.5 py-[0.1rem] shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
                                                    style={{
                                                        backgroundColor: 'rgba(8, 10, 14, 0.34)',
                                                        boxShadow: `0 6px 14px rgba(0,0,0,0.12), inset 0 1px 0 ${rgbaString(accentRgb, 0.02)}`,
                                                        backdropFilter: 'none',
                                                        WebkitBackdropFilter: 'none',
                                                        transform: 'translateZ(0)',
                                                        backfaceVisibility: 'hidden',
                                                        WebkitFontSmoothing: 'antialiased',
                                                        isolation: 'isolate',
                                                    }}
                                                >
                                                    <p
                                                        className="w-full truncate px-0.5 text-center text-[8px] font-black uppercase leading-none tracking-[0.02em]"
                                                        style={{
                                                            color: 'rgba(248, 250, 253, 0.96)',
                                                            textShadow: '0 1px 2px rgba(0,0,0,0.92), 0 0 12px rgba(0,0,0,0.34)',
                                                            transform: 'translateZ(0)',
                                                            backfaceVisibility: 'hidden',
                                                            WebkitFontSmoothing: 'antialiased',
                                                            textRendering: 'geometricPrecision',
                                                        }}
                                                    >
                                                        {asset.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div
                                                className="-mt-0.5 mx-auto rounded-[12px] border border-white/5 px-1.5 py-[0.28rem] text-[9px] font-semibold uppercase tracking-[0.06em]"
                                                style={{
                                                    width: 'fit-content',
                                                    minWidth: '88px',
                                                    maxWidth: '100px',
                                                    backgroundColor: 'rgba(8,10,14,0.32)',
                                                    backgroundImage: 'none',
                                                    boxShadow: `inset 0 1px 0 ${rgbaString(accentRgb, 0.02)}`,
                                                    backdropFilter: 'none',
                                                    WebkitBackdropFilter: 'none',
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                        <span style={{ color: 'rgba(236, 240, 247, 0.82)', textShadow: '0 1px 8px rgba(0,0,0,0.52)' }}>
                                                            <span className="font-black" style={{ color: 'rgba(248, 250, 253, 0.96)' }}>{stats.activeCount}</span> arenas
                                                        </span>
                                                        <span style={{ color: 'rgba(236, 240, 247, 0.82)', textShadow: '0 1px 8px rgba(0,0,0,0.52)' }}>
                                                            <span className="font-black" style={{ color: 'rgba(248, 250, 253, 0.96)' }}>{stats.totalActions}</span> ações
                                                        </span>
                                                    </div>
                                                <div className="mt-0.5">
                                                    <div className="h-[3px] w-full overflow-hidden rounded-full bg-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${stats.progressPercent}%`,
                                                                background: 'linear-gradient(90deg, #7a5813 0%, #d4af37 46%, #f6e2a3 100%)',
                                                                boxShadow: '0 0 10px rgba(212,175,55,0.24)',
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
