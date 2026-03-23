import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { AssetDossier } from '../components/AssetDossier';
import { AssetArenaBoard } from '../components/AssetArenaBoard';
import { Sephirot } from '../components/Sephirot';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { useAssetsOverviewLayoutConfig } from '../hooks/useAssetsOverviewLayoutConfig';
import { calculateArenaProgress } from '../utils/progressUtils';
import type { Asset } from '../types';

type AssetSubview = 'widgets' | 'arenas';

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

const SegmentedButton: React.FC<{
    active: boolean;
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
}> = ({ active, icon, title, onClick }) => (
    <button
        type="button"
        title={title}
        onClick={onClick}
        className={`rounded-full px-2.5 py-1.5 text-[10px] font-black transition-all ${
            active
                ? 'bg-[var(--skin-accent-color)] text-black shadow-[0_6px_16px_rgba(0,0,0,0.22)]'
                : 'bg-white/5 text-white/55 hover:bg-white/10'
        }`}
    >
        <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center">
            {icon}
        </span>
    </button>
);

export const AssetsView: React.FC = () => {
    const { assets, userProfile, appMode, activeCycle, dailyCommitment, cycleProgress, getArenas, actions, tasks } = useGame();
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
    const [assetSubview, setAssetSubview] = useState<AssetSubview>('widgets');
    const [isWidgetEditing, setIsWidgetEditing] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const cycleSummaryRef = useRef<HTMLButtonElement | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [cycleSummaryHeight, setCycleSummaryHeight] = useState(56);
    const [hasSephirotRasterArt, setHasSephirotRasterArt] = useState(false);
    const overviewLayout = useAssetsOverviewLayoutConfig();

    const isBasicMode = appMode === 'BASIC';
    const basicSephirotLevelColor = '#3b2412';
    const selectedAsset = assets.find(a => a.id === selectedAssetId) || null;
    const selectedAssetAccent = selectedAsset
        ? ASSET_ACCENT_COLORS[selectedAsset.id as keyof typeof ASSET_ACCENT_COLORS] || '#4b5563'
        : '#4b5563';
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
    const cycleSummaryTop = '14px';
    const cycleSummaryTopPx = 14;
    const assetsGridTopPx = cycleSummaryTopPx + cycleSummaryHeight + 8;
    const assetsGridBottomPx = 70;
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

        const startDate = new Date(`${activeCycle.startDate}T00:00:00`);
        const endDate = new Date(`${activeCycle.endDate}T00:00:00`);
        const todayBase = dailyCommitment?.date ? new Date(`${dailyCommitment.date}T00:00:00`) : new Date();
        const today = new Date(todayBase.getFullYear(), todayBase.getMonth(), todayBase.getDate());
        const totalDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
        const elapsedDays = Math.max(1, Math.min(totalDays, Math.floor((today.getTime() - startDate.getTime()) / 86400000) + 1));
        const cycleArenaIds = new Set(activeCycle.arenaIds || []);
        const scopedArenas = cycleArenaIds.size > 0 ? allArenas.filter((arena) => cycleArenaIds.has(arena.id)) : allArenas;
        const activeArenaCount = scopedArenas.filter((arena) => !arena.isArchived).length;
        const archivedArenaCount = scopedArenas.filter((arena) => arena.isArchived).length;
        let totalCompleted = 0;
        let totalPlanned = 0;

        for (const arena of scopedArenas) {
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

        const computedProgress = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : Math.max(0, Math.min(100, Math.round(cycleProgress || 0)));

        return {
            name: activeCycle.name,
            progress: computedProgress,
            elapsedDays,
            totalDays,
            activeArenaCount,
            archivedArenaCount,
            totalCompleted,
            totalPlanned,
        };
    }, [activeCycle, allArenas, cycleProgress, dailyCommitment?.date, actions, cycleScopedTasks]);

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

    useLayoutEffect(() => {
        const summaryCard = cycleSummaryRef.current;
        if (!summaryCard) {
            setCycleSummaryHeight(56);
            return;
        }

        const updateSummaryHeight = () => {
            setCycleSummaryHeight(Math.ceil(summaryCard.getBoundingClientRect().height));
        };

        updateSummaryHeight();

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => updateSummaryHeight());
            observer.observe(summaryCard);
            return () => observer.disconnect();
        }

        window.addEventListener('resize', updateSummaryHeight);
        return () => window.removeEventListener('resize', updateSummaryHeight);
    }, [selectedAssetId, cycleSummary?.name, cycleSummary?.progress, cycleSummary?.totalCompleted, cycleSummary?.totalPlanned, cycleSummary?.activeArenaCount]);

    const handleOpenAsset = (asset: Asset) => {
        setSelectedAssetId(asset.id);
        setAssetSubview('widgets');
        setIsWidgetEditing(false);
    };

    const handleBack = () => {
        setSelectedAssetId(null);
        setAssetSubview('widgets');
        setIsWidgetEditing(false);
    };

    const handleOpenReports = () => {
        window.dispatchEvent(new CustomEvent('tutorialNavigate', {
            detail: {
                view: 'assets',
                showReports: true,
            },
        }));
    };

    const handleSubviewChange = (view: AssetSubview) => {
        setAssetSubview(view);
        if (view !== 'widgets') {
            setIsWidgetEditing(false);
        }
    };

    const showAssetAura = isBasicMode || assetSubview === 'arenas';
    const selectedAssetShellStyle: React.CSSProperties = {
        backgroundImage: `radial-gradient(circle at 16% 0%, rgba(255,246,204,0.42), transparent 29%),
            radial-gradient(circle at 24% 22%, rgba(226,192,98,0.24), transparent 25%),
            radial-gradient(circle at 92% 88%, ${rgbaString(selectedAssetAccentRgb, 0.2)}, transparent 24%),
            linear-gradient(135deg, rgba(224,186,84,0.42) 0%, rgba(255,250,230,0.08) 18%, rgba(8,8,8,0.94) 46%, rgba(2,2,2,0.98) 66%, ${rgbaString(selectedAssetAccentRgb, 0.12)} 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.42)',
    };

    if (selectedAsset) {
        return (
            <div className="assets-detail-root h-full overflow-y-auto px-4 pb-4">
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
                            {!isBasicMode && assetSubview === 'widgets' ? (
                                <button
                                    type="button"
                                    onClick={() => setIsWidgetEditing((value) => !value)}
                                    className={`justify-self-start rounded-full border border-white/20 p-1.5 transition-colors ${isWidgetEditing ? 'bg-[var(--skin-accent-color)]/20 border-[var(--skin-accent-color)]/40' : 'bg-transparent'}`}
                                    title="Editar widgets"
                                >
                                    <svg className={`h-4 w-4 ${isWidgetEditing ? 'text-white' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                                    </svg>
                                </button>
                            ) : (
                                <div className="h-8 w-8 justify-self-start" />
                            )}

                            {!isBasicMode ? (
                                <div className="mt-0.5 flex items-center justify-self-center gap-1 rounded-full border border-white/10 bg-black/20 p-1">
                                    <SegmentedButton
                                        active={assetSubview === 'widgets'}
                                        icon={'\u25EB'}
                                        title="Widgets"
                                        onClick={() => handleSubviewChange('widgets')}
                                    />
                                    <SegmentedButton
                                        active={assetSubview === 'arenas'}
                                        icon={'\u25A6'}
                                        title="Arenas"
                                        onClick={() => handleSubviewChange('arenas')}
                                    />
                                </div>
                            ) : (
                                <div className="justify-self-center" />
                            )}

                            <button
                                type="button"
                                onClick={handleBack}
                                className="justify-self-end px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] rounded-lg luxe-skin-button"
                            >
                                OK
                            </button>
                        </div>

                        <div className="min-w-0 pb-3 pt-2 text-center">
                            <p className="luxe-title-ornate truncate px-6 text-lg font-black uppercase tracking-[0.18em] text-[color:var(--skin-accent-color)] luxe-title-shadow">
                                {selectedAsset.name}
                            </p>
                        </div>

                        <div className="overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                        {isBasicMode || assetSubview === 'arenas' ? (
                            <div className="space-y-2">
                                <div className="pt-0 text-center">
                                    <p className="text-xs font-medium tracking-[0.08em] text-white/62">Nivel {selectedAsset.level}</p>
                                </div>
                                <AssetArenaBoard asset={selectedAsset} />
                                </div>
                            ) : (
                                <AssetDossier
                                    asset={selectedAsset}
                                    onBack={handleBack}
                                    embedded
                                    showArenas={false}
                                    showHeader={false}
                                    showLevelPanel
                                    showEditButton={false}
                                    isEditingOverride={isWidgetEditing}
                                    onToggleEditing={() => setIsWidgetEditing((value) => !value)}
                                />
                            )}
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="assets-view-root relative h-full overflow-hidden">
            <div
                className="assets-view-shell relative flex items-center justify-center overflow-hidden rounded-[30px]"
                style={assetsShellStyle}
            >
                <div ref={containerRef} className="relative h-full w-full">
                    {!isBasicMode && (
                        <div className="assets-sephirot-backdrop absolute inset-0 z-0" />
                    )}

                    <div className="relative z-10 h-full w-full">
                        <div className="absolute inset-x-0 z-20 flex justify-center px-3" style={{ top: cycleSummaryTop }}>
                            <button
                                ref={cycleSummaryRef}
                                type="button"
                                onClick={handleOpenReports}
                                className="group w-full max-w-[258px] overflow-hidden rounded-[16px] border border-white/10 px-3 py-1.5 text-left backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-[1px]"
                                style={{
                                    borderColor: rgbaString(cycleAccentRgb, 0.32),
                                    backgroundImage: `radial-gradient(circle at 18% 10%, ${rgbaString(cycleAccentRgb, 0.24)} 0%, transparent 34%), linear-gradient(180deg, rgba(31,38,48,0.94) 0%, rgba(13,17,22,0.98) 100%)`,
                                    boxShadow: `0 16px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${rgbaString(cycleAccentRgb, 0.12)}`,
                                }}
                            >
                                <div className="min-w-0 space-y-0.5">
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <h3 className="truncate text-[11px] font-black uppercase tracking-[0.09em]" style={{ color: rgbString(cycleTitleColor) }}>
                                            {cycleSummary ? cycleSummary.name : 'Sem ciclo ativo'}
                                        </h3>
                                        <p className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: rgbaString(cycleMetaColor, 0.88) }}>
                                            {cycleSummary
                                                ? `Dia ${cycleSummary.elapsedDays}/${cycleSummary.totalDays}`
                                                : 'Toque para abrir o histórico'}
                                        </p>
                                        {cycleSummary ? (
                                            <div className="flex items-center justify-between gap-2 text-[8px] font-black uppercase tracking-[0.08em]">
                                                <span className="truncate" style={{ color: rgbaString(cycleMetaColor, 0.92) }}>
                                                    {cycleSummary.activeArenaCount} arenas ativas
                                                </span>
                                                <div className="shrink-0 text-right">
                                                    <span style={{ color: rgbaString(cycleMetaColor, 0.9) }}>
                                                        Ações {cycleSummary.totalCompleted}/{cycleSummary.totalPlanned}
                                                    </span>
                                                    <span className="ml-2" style={{ color: rgbString(cycleTitleColor) }}>
                                                        {cycleSummary.progress}%
                                                    </span>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="mt-1.5">
                                    <div className="h-[5px] w-full overflow-hidden rounded-full bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${cycleSummary ? cycleSummary.progress : 0}%`,
                                                background: 'linear-gradient(90deg, #7a5813 0%, #d4af37 46%, #f6e2a3 100%)',
                                                boxShadow: '0 0 12px rgba(212,175,55,0.28)',
                                            }}
                                        />
                                    </div>
                                </div>
                            </button>
                        </div>

                        <div id="assets-grid" className="absolute inset-x-0" style={{ top: assetsGridTopPx, bottom: assetsGridBottomPx }}>
                            {overviewCoords.map(coord => {
                                const asset = assets.find(a => a.id === coord.id);
                                if (!asset) return null;

                                const yNorm = coord.y / 100;
                                const yStretched = Math.min(1, Math.max(0, (yNorm - 0.5) * stretchY + 0.5));
                                const accent = ASSET_ACCENT_COLORS[asset.id as keyof typeof ASSET_ACCENT_COLORS] || 'var(--skin-accent-color)';
                                const accentRgb = hexToRgb(accent);
                                const accentLuminance = relativeLuminance(accentRgb);
                                const titleColor = lightenToward(accentRgb, [246, 240, 226], accentLuminance > 0.6 ? 0.88 : 0.78);
                                const statValueColor = lightenToward(accentRgb, [250, 246, 235], accentLuminance > 0.6 ? 0.92 : 0.84);
                                const statLabelColor = lightenToward(accentRgb, [187, 194, 206], accentLuminance > 0.6 ? 0.68 : 0.54);
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
                                                backgroundImage: `radial-gradient(circle at 50% -16%, ${rgbaString(accentRgb, 0.19)}, transparent 34%), radial-gradient(circle at 50% 108%, ${rgbaString(accentRgb, 0.11)} 0%, transparent 54%), linear-gradient(180deg, ${rgbaString(accentRgb, 0.06)} 0%, rgba(32,36,45,0.96) 18%, rgba(10,12,16,0.985) 100%)`,
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
                                                    className="max-w-full rounded-[10px] border border-white/10 px-2 py-[0.18rem] shadow-[0_8px_18px_rgba(0,0,0,0.22)] backdrop-blur-md"
                                                    style={{
                                                        backgroundColor: rgbaString(accentRgb, 0.096),
                                                        boxShadow: `0 8px 18px rgba(0,0,0,0.22), inset 0 1px 0 ${rgbaString(accentRgb, 0.064)}`,
                                                    }}
                                                >
                                                    <p
                                                        className="max-w-[104px] truncate px-0.5 text-[8.15px] font-black uppercase leading-[0.88] tracking-[0.008em]"
                                                        style={{ color: rgbString(titleColor) }}
                                                    >
                                                        {asset.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div
                                                className="-mt-0.5 w-full rounded-[12px] border border-white/10 px-2 py-[0.42rem] text-[9px] font-semibold uppercase tracking-[0.06em]"
                                                style={{
                                                    backgroundImage: `linear-gradient(180deg, ${rgbaString(accentRgb, 0.072)} 0%, rgba(8,10,14,0.18) 100%)`,
                                                    boxShadow: `inset 0 1px 0 ${rgbaString(accentRgb, 0.064)}`,
                                                }}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                        <span style={{ color: rgbaString(statLabelColor, 0.88) }}>
                                                            <span className="font-black" style={{ color: rgbString(statValueColor) }}>{stats.activeCount}</span> arenas
                                                        </span>
                                                        <span style={{ color: rgbaString(statLabelColor, 0.88) }}>
                                                            <span className="font-black" style={{ color: rgbString(statValueColor) }}>{stats.totalActions}</span> ações
                                                        </span>
                                                    </div>
                                                <div className="mt-1">
                                                    <div className="h-[3px] w-full overflow-hidden rounded-full bg-black/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
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
