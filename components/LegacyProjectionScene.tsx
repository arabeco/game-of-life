import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ReportIdentitySnapshot } from '../types';
import { useCallback } from 'react';
import { formatDate, getScoreGrade } from '../utils/dateUtils';
import { EraRibbon, getEraRibbonSkin } from './EraRibbon';
import { LegacyGrandPlaque } from './LegacyGrandPlaque';
import { LegacyCycleCard } from './LegacyCycleCard';
import { MiniCyclePlannerSnapshot } from './MiniCyclePlannerSnapshot';
import { UserAvatar } from './UserAvatar';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { getLegacyBackdropSkin, type LegacyBackdropSkinId } from '../constants/legacyBackdropSkins';
import { useLegacyLayoutConfig } from '../hooks/useLegacyLayoutConfig';
import {
    getLegacyPlaqueScale,
    getLegacyPlaqueWidthPx,
    setStoredLegacyLayoutConfig,
    type LegacyLayoutConfig,
} from '../utils/legacyLayoutLab';
import './legacy-ui.css';

interface LegacyProjectionSceneProps {
    id?: string;
    eras: LegacyEraSummary[];
    sovereignName: string;
    projectionActive?: boolean;
    interactive?: boolean;
    showLayoutEditor?: boolean;
    autoAdvance?: boolean;
    enteringProjection?: boolean;
    fallbackIdentity?: ReportIdentitySnapshot;
    backdropSkinId?: LegacyBackdropSkinId;
    onSequenceComplete?: () => void;
    onActivatePlaque?: () => void;
    onOpenCycle?: (cycleId: string) => void;
    onOpenEra?: (era: LegacyEraSummary) => void;
}

const buildFallbackIdentity = (sovereignName: string, fallbackIdentity?: ReportIdentitySnapshot): ReportIdentitySnapshot => ({
    avatarUrl: fallbackIdentity?.avatarUrl,
    nickname: fallbackIdentity?.nickname || sovereignName,
    title: fallbackIdentity?.title,
    level: fallbackIdentity?.level || 1,
    nobilityRankId: fallbackIdentity?.nobilityRankId,
    nobilityRankName: fallbackIdentity?.nobilityRankName,
    clanName: fallbackIdentity?.clanName || null,
    clanIcon: fallbackIdentity?.clanIcon || null,
    clanRankName: fallbackIdentity?.clanRankName || null,
    capturedAt: fallbackIdentity?.capturedAt || new Date().toISOString(),
});

const resolveLegacyIdentity = (
    sovereignName: string,
    fallbackIdentity?: ReportIdentitySnapshot,
    snapshot?: ReportIdentitySnapshot,
): ReportIdentitySnapshot => {
    const fallback = buildFallbackIdentity(sovereignName, fallbackIdentity);
    if (!snapshot) return fallback;

    return {
        ...fallback,
        ...snapshot,
        avatarUrl: snapshot.avatarUrl?.trim() || fallback.avatarUrl,
        nickname: snapshot.nickname?.trim() || fallback.nickname,
        title: snapshot.title?.trim() || fallback.title,
        nobilityRankId: snapshot.nobilityRankId || fallback.nobilityRankId,
        nobilityRankName: snapshot.nobilityRankName?.trim() || fallback.nobilityRankName,
        clanName: snapshot.clanName !== undefined ? snapshot.clanName : fallback.clanName,
        clanIcon: snapshot.clanIcon !== undefined ? snapshot.clanIcon : fallback.clanIcon,
        clanRankName: snapshot.clanRankName !== undefined ? snapshot.clanRankName : fallback.clanRankName,
        capturedAt: snapshot.capturedAt || fallback.capturedAt,
    };
};

const identityKey = (identity: ReportIdentitySnapshot) => [
    identity.nickname || '',
    identity.title || '',
    identity.level || 0,
    identity.nobilityRankId || '',
    identity.nobilityRankName || '',
    identity.clanName || '',
    identity.clanRankName || '',
].join('|');

const getChronologyValue = (value?: string | null) => {
    const parsed = value ? new Date(value).getTime() : Number.NaN;
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const buildLegacyCycleMetrics = (cycle: LegacyEraSummary['cycles'][number]) => {
    const days = (cycle.weeklyAtlas || []).flatMap((week) => week.days || []);
    const totalPlanned = days.reduce((sum, day) => sum + (day.plannedCount || 0), 0);
    const totalCompleted = days.reduce((sum, day) => sum + (day.completedCount || 0), 0);
    const totalMinutes = days.reduce((sum, day) => sum + (day.completedMinutes || 0), 0);
    const activeDays = days.filter((day) => (day.completedCount || 0) > 0).length;
    const progress = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 100;
    const hours = totalMinutes / 60;
    const actionsPerDay = activeDays > 0 ? (totalCompleted / activeDays) : 0;
    const avgHoursPerDay = activeDays > 0 ? (hours / activeDays) : 0;
    const activeDates = days
        .filter((day) => (day.completedCount || 0) > 0)
        .map((day) => day.date)
        .sort();
    let maxStreak = activeDates.length > 0 ? 1 : 0;
    let currentStreak = activeDates.length > 0 ? 1 : 0;
    for (let index = 1; index < activeDates.length; index += 1) {
        const previous = new Date(activeDates[index - 1]).getTime();
        const current = new Date(activeDates[index]).getTime();
        if ((current - previous) <= (24 * 60 * 60 * 1000 * 1.5)) {
            currentStreak += 1;
        } else {
            currentStreak = 1;
        }
        maxStreak = Math.max(maxStreak, currentStreak);
    }

    return {
        progress,
        hours,
        activeDays,
        actionsPerDay,
        totalActions: totalCompleted,
        avgHoursPerDay,
        maxStreak,
    };
};

const LayoutSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <label className="space-y-1">
        <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/82">{label}</span>
            <span className="text-[11px] font-bold text-white/72">{value.toFixed(step < 1 ? 2 : 0)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-[var(--skin-accent-color)]"
        />
    </label>
);

const LEGACY_STAGE_WIDTH = 390;
const LEGACY_STAGE_HEIGHT = 844;

export const LegacyProjectionScene: React.FC<LegacyProjectionSceneProps> = ({
    id,
    eras,
    sovereignName,
    projectionActive = true,
    interactive = false,
    showLayoutEditor = false,
    autoAdvance = false,
    enteringProjection = false,
    fallbackIdentity,
    backdropSkinId,
    onSequenceComplete,
    onActivatePlaque,
    onOpenCycle,
    onOpenEra,
}) => {
    const orderedEras = useMemo(
        () => [...eras]
            .map((era) => ({
                ...era,
                cycles: [...(era.cycles || [])].sort((left, right) => getChronologyValue(left.startDate || left.endDate) - getChronologyValue(right.startDate || right.endDate)),
            }))
            .sort((left, right) => getChronologyValue(left.startDate || left.endDate || left.cycles?.[0]?.startDate) - getChronologyValue(right.startDate || right.endDate || right.cycles?.[0]?.startDate)),
        [eras]
    );
    const cycleEntries = useMemo(
        () => orderedEras.flatMap((era, eraIndex) => (era.cycles || []).map((cycle, cycleIndex) => ({ era, eraIndex, cycle, cycleIndex }))),
        [orderedEras]
    );
    const backdropSkin = getLegacyBackdropSkin(backdropSkinId);
    const layout = useLegacyLayoutConfig();
    const scenePlaqueWidth = getLegacyPlaqueWidthPx('scene', layout);
    const scenePlaqueScale = getLegacyPlaqueScale('scene', layout);
    const [viewportSize, setViewportSize] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : LEGACY_STAGE_WIDTH,
        height: typeof window !== 'undefined' ? window.innerHeight : LEGACY_STAGE_HEIGHT,
    }));

    const [activeCycleId, setActiveCycleId] = useState<string>(() => {
        if (!cycleEntries.length) return '';
        return cycleEntries[0]?.cycle.id || '';
    });
    const [identityPulse, setIdentityPulse] = useState(false);
    const [eraTransitionPulse, setEraTransitionPulse] = useState<string | null>(null);
    const [sequenceCompleted, setSequenceCompleted] = useState(false);
    const [timelineEdgePadding, setTimelineEdgePadding] = useState({ left: 24, right: 24 });
    const [layoutEditorOpen, setLayoutEditorOpen] = useState(false);
    const [layoutCopyState, setLayoutCopyState] = useState<'idle' | 'copied' | 'prompt'>('idle');
    const previousIdentityKeyRef = useRef<string>('');
    const didCompleteRef = useRef(false);
    const timelineScrollRef = useRef<HTMLDivElement | null>(null);
    const timelineContentRef = useRef<HTMLDivElement | null>(null);
    const cycleCardRefs = useRef<Record<string, HTMLButtonElement | HTMLDivElement | null>>({});
    const scrollSyncFrameRef = useRef<number | null>(null);
    const manualScrollTimeoutRef = useRef<number | null>(null);
    const layoutCopyTimeoutRef = useRef<number | null>(null);
    const userIsDraggingTimelineRef = useRef(false);

    useEffect(() => {
        if (!cycleEntries.length) return;
        if (!cycleEntries.some((entry) => entry.cycle.id === activeCycleId)) {
            setActiveCycleId(cycleEntries[0].cycle.id);
        }
    }, [activeCycleId, cycleEntries]);

    useEffect(() => {
        setSequenceCompleted(false);
        didCompleteRef.current = false;
    }, [eras]);

    const activeEntry = cycleEntries.find((entry) => entry.cycle.id === activeCycleId) || cycleEntries[0];
    const activeIdentity = resolveLegacyIdentity(sovereignName, fallbackIdentity, activeEntry?.cycle.identitySnapshot);
    const activeIndex = cycleEntries.findIndex((entry) => entry.cycle.id === activeCycleId);

    const jumpToCycle = (nextIndex: number) => {
        const clampedIndex = Math.max(0, Math.min(cycleEntries.length - 1, nextIndex));
        const nextEntry = cycleEntries[clampedIndex];
        if (!nextEntry) return;

        if (activeEntry && nextEntry.era.key !== activeEntry.era.key && nextEntry.era.color) {
            setEraTransitionPulse(nextEntry.era.color);
            window.setTimeout(() => setEraTransitionPulse(null), 720);
        }

        setActiveCycleId(nextEntry.cycle.id);
    };

    const getClosestCycleToViewportCenter = useCallback(() => {
        const scroller = timelineScrollRef.current;
        if (!scroller) return null;

        const scrollerRect = scroller.getBoundingClientRect();
        const viewportCenter = scrollerRect.left + (scrollerRect.width / 2);
        let closestCycleId: string | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        cycleEntries.forEach((entry) => {
            const card = cycleCardRefs.current[entry.cycle.id];
            if (!card) return;
            const rect = card.getBoundingClientRect();
            const center = rect.left + (rect.width / 2);
            const distance = Math.abs(center - viewportCenter);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestCycleId = entry.cycle.id;
            }
        });

        return closestCycleId;
    }, [cycleEntries]);

    const alignCycleToViewportCenter = useCallback((cycleId: string, behavior: ScrollBehavior = 'smooth') => {
        const scroller = timelineScrollRef.current;
        const card = cycleCardRefs.current[cycleId];
        if (!scroller || !card) return;

        const scrollerRect = scroller.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const viewportCenter = scrollerRect.left + (scrollerRect.width / 2);
        const cardCenter = cardRect.left + (cardRect.width / 2);
        const delta = cardCenter - viewportCenter;
        if (Math.abs(delta) < 1) return;

        scroller.scrollTo({
            left: Math.max(scroller.scrollLeft + (delta / Math.max(layout.cyclesZoom, 0.01)), 0),
            behavior,
        });
    }, [layout.cyclesZoom]);

    const updateLayout = useCallback((patch: Partial<LegacyLayoutConfig>) => {
        setStoredLegacyLayoutConfig({ ...layout, ...patch });
    }, [layout]);

    const snapTimelineToClosestCycle = useCallback((behavior: ScrollBehavior = 'smooth') => {
        const closestCycleId = getClosestCycleToViewportCenter();
        if (!closestCycleId) return;
        setActiveCycleId((current) => (current === closestCycleId ? current : closestCycleId));
        alignCycleToViewportCenter(closestCycleId, behavior);
    }, [alignCycleToViewportCenter, getClosestCycleToViewportCenter]);

    const handleCopyLayoutJson = useCallback(async () => {
        const json = JSON.stringify(layout, null, 2);
        let usedPromptFallback = false;

        try {
            await navigator.clipboard.writeText(json);
        } catch {
            usedPromptFallback = true;
            window.prompt('Copie o JSON do layout', json);
        }

        if (layoutCopyTimeoutRef.current !== null) {
            window.clearTimeout(layoutCopyTimeoutRef.current);
        }
        setLayoutCopyState(usedPromptFallback ? 'prompt' : 'copied');
        layoutCopyTimeoutRef.current = window.setTimeout(() => setLayoutCopyState('idle'), 1400);
    }, [layout]);

    useEffect(() => {
        if (!autoAdvance || !projectionActive || cycleEntries.length <= 1 || sequenceCompleted) return;

        const currentIndex = activeIndex >= 0 ? activeIndex : 0;
        const currentEntry = cycleEntries[currentIndex];
        const nextEntry = cycleEntries[currentIndex + 1];
        const currentIdentity = resolveLegacyIdentity(sovereignName, fallbackIdentity, currentEntry?.cycle.identitySnapshot);
        const nextIdentity = nextEntry
            ? resolveLegacyIdentity(sovereignName, fallbackIdentity, nextEntry.cycle.identitySnapshot)
            : currentIdentity;
        const eraChanged = !!currentEntry && !!nextEntry && currentEntry.era.key !== nextEntry.era.key;
        const identityChanged = identityKey(currentIdentity) !== identityKey(nextIdentity);
        const importantScore = (nextEntry?.cycle.score || currentEntry?.cycle.score || 0) >= 90;
        const delay = eraChanged ? 2400 : identityChanged ? 1900 : importantScore ? 1700 : 1500;

        const timer = window.setTimeout(() => {
            if (!nextEntry) {
                setSequenceCompleted(true);
                if (!didCompleteRef.current) {
                    didCompleteRef.current = true;
                    onSequenceComplete?.();
                }
                return;
            }
            if (eraChanged && nextEntry.era.color) {
                setEraTransitionPulse(nextEntry.era.color);
                window.setTimeout(() => setEraTransitionPulse(null), 720);
            }
            setActiveCycleId(nextEntry.cycle.id);
        }, delay);

        return () => window.clearTimeout(timer);
    }, [activeIndex, activeCycleId, autoAdvance, cycleEntries, fallbackIdentity, onSequenceComplete, projectionActive, sequenceCompleted, sovereignName]);

    useEffect(() => {
        const currentKey = identityKey(activeIdentity);
        if (!previousIdentityKeyRef.current) {
            previousIdentityKeyRef.current = currentKey;
            return;
        }
        if (previousIdentityKeyRef.current !== currentKey) {
            setIdentityPulse(true);
            const timeout = window.setTimeout(() => setIdentityPulse(false), 900);
            previousIdentityKeyRef.current = currentKey;
            return () => window.clearTimeout(timeout);
        }
    }, [activeIdentity]);

    React.useLayoutEffect(() => {
        if (!interactive) return;
        const scroller = timelineScrollRef.current;
        const firstCard = cycleCardRefs.current[cycleEntries[0]?.cycle.id || ''];
        if (!scroller || !firstCard) return;

        const updatePadding = () => {
            const scrollerWidth = scroller.clientWidth || 320;
            const cardWidth = firstCard.offsetWidth || 188;
            const edgePadding = Math.max((scrollerWidth - cardWidth) / 2, 18);
            const trailingPadding = edgePadding + Math.max(Math.round(cardWidth * 0.82), 132);

            setTimelineEdgePadding((current) => {
                if (Math.abs(current.left - edgePadding) < 1 && Math.abs(current.right - trailingPadding) < 1) {
                    return current;
                }
                return { left: edgePadding, right: trailingPadding };
            });
        };

        updatePadding();

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => updatePadding())
            : null;

        resizeObserver?.observe(scroller);
        resizeObserver?.observe(firstCard);
        window.addEventListener('resize', updatePadding);

        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updatePadding);
        };
    }, [cycleEntries, interactive]);

    React.useLayoutEffect(() => {
        if (!interactive || activeIndex < 0 || userIsDraggingTimelineRef.current) return;
        alignCycleToViewportCenter(activeCycleId, 'auto');
    }, [activeCycleId, activeIndex, alignCycleToViewportCenter, interactive, timelineEdgePadding.left, timelineEdgePadding.right]);

    useEffect(() => () => {
        if (scrollSyncFrameRef.current !== null) {
            window.cancelAnimationFrame(scrollSyncFrameRef.current);
        }
        if (manualScrollTimeoutRef.current !== null) {
            window.clearTimeout(manualScrollTimeoutRef.current);
        }
        if (layoutCopyTimeoutRef.current !== null) {
            window.clearTimeout(layoutCopyTimeoutRef.current);
        }
    }, []);

    useEffect(() => {
        if (!interactive) return;
        const handleResize = () => {
            setViewportSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [interactive]);

    if (!eras.length) return null;

    const activePatent = activeIdentity.nobilityRankName || activeIdentity.title || 'Vagante';
    const activeClan = activeIdentity.clanName || 'Sem grupo';
    const displayNickname = activeIdentity.nickname || sovereignName;
    const nicknameClass = displayNickname.length > 24
        ? 'text-[0.82rem] tracking-[0.01em]'
        : displayNickname.length > 18
            ? 'text-[0.92rem] tracking-[0.015em]'
            : 'text-[1.02rem] tracking-[0.02em]';
    const timelineVisible = !interactive || projectionActive;
    const sceneCyclesTranslateX = layout.cyclesOffsetX;
    const sceneCyclesTranslateY = layout.cyclesOffsetY + 8;
    const backdropScale = interactive ? layout.backdropZoom : 1.02;
    const stageScale = interactive
        ? Math.min(
            Math.max((viewportSize.width - 10) / LEGACY_STAGE_WIDTH, 0.1),
            Math.max((viewportSize.height - 10) / LEGACY_STAGE_HEIGHT, 0.1),
        )
        : 1;
    const stageWidth = LEGACY_STAGE_WIDTH * stageScale;
    const stageHeight = LEGACY_STAGE_HEIGHT * stageScale;
    const sceneClass = interactive
        ? 'relative min-h-full overflow-hidden bg-black px-0 py-0 text-white'
        : 'relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.035),_rgba(255,255,255,0.012))] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.42)] w-[1720px]';
    const interactiveBackdropStyle: React.CSSProperties = {
        backgroundImage: `url(${backdropSkin.imageUrl})`,
        backgroundPosition: 'center 8%',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        transform: `scale(${backdropScale})`,
        transformOrigin: 'center top',
    };

    const handleTimelineScroll = () => {
        if (!interactive) return;
        userIsDraggingTimelineRef.current = true;

        if (scrollSyncFrameRef.current !== null) {
            window.cancelAnimationFrame(scrollSyncFrameRef.current);
        }

        scrollSyncFrameRef.current = window.requestAnimationFrame(() => {
            const closestCycleId = getClosestCycleToViewportCenter();
            if (closestCycleId) {
                setActiveCycleId((current) => (current === closestCycleId ? current : closestCycleId));
            }
        });

        if (manualScrollTimeoutRef.current !== null) {
            window.clearTimeout(manualScrollTimeoutRef.current);
        }

        manualScrollTimeoutRef.current = window.setTimeout(() => {
            userIsDraggingTimelineRef.current = false;
            snapTimelineToClosestCycle('smooth');
        }, 140);
    };

    const renderCycleNode = (
        cycle: LegacyEraSummary['cycles'][number],
        skin: ReturnType<typeof getEraRibbonSkin>,
        interactiveNode: boolean,
    ) => {
        const scoreInfo = getScoreGrade(cycle.score);
        const persistedGrade = cycle.grade?.trim().toUpperCase();
        const displayGrade = persistedGrade || scoreInfo.grade;
        const cycleMetrics = buildLegacyCycleMetrics(cycle);
        const isFocused = cycle.id === activeCycleId;
        const baseClass = 'shrink-0 rounded-[12px] border border-white/0 bg-transparent p-0 text-left transition-all opacity-100';
        const style = { boxShadow: isFocused ? `0 0 0 1px ${skin.edge}18, 0 8px 14px ${skin.baseBottom}24` : 'none' } as React.CSSProperties;
        const cycleContent = (
            <div className="flex w-[188px] flex-col items-center gap-0.5">
                <LegacyCycleCard
                    rank={displayGrade}
                    score={cycle.score}
                    title={cycle.name}
                    startDate={cycle.startDate}
                    endDate={cycle.endDate}
                    progress={cycleMetrics.progress}
                    avgHoursPerDay={cycleMetrics.avgHoursPerDay}
                    maxStreak={cycleMetrics.maxStreak}
                    activeDays={cycleMetrics.activeDays}
                    totalHours={cycleMetrics.hours}
                    totalActions={cycleMetrics.totalActions}
                    style={{ width: '88px' }}
                />
                <MiniCyclePlannerSnapshot
                    weeks={cycle.weeklyAtlas || []}
                    accentColor={skin.edge}
                    compact
                    className="legacy-cycle-planner w-full"
                    style={{ transformOrigin: 'top center' }}
                />
            </div>
        );

        if (!interactiveNode) {
            return (
                <div key={cycle.id} className={baseClass} style={style}>
                    {cycleContent}
                </div>
            );
        }

        return (
            <button
                key={cycle.id}
                ref={(node) => { cycleCardRefs.current[cycle.id] = node; }}
                type="button"
                onClick={() => {
                    setActiveCycleId(cycle.id);
                    onOpenCycle?.(cycle.id);
                }}
                className={`${baseClass} cursor-pointer`}
                style={style}
            >
                {cycleContent}
            </button>
        );
    };

    const renderInteractiveEraGroup = (
        era: LegacyEraSummary,
        eraIndex: number,
    ) => {
        const skin = getEraRibbonSkin(era.skinId);
        const isLastEra = eraIndex === orderedEras.length - 1;

        return (
            <div key={era.key || era.label} className="relative flex shrink-0 items-start gap-2.5 pt-5 pb-5">
                {eraIndex > 0 && (
                    <div className="pointer-events-none absolute -left-4 bottom-0 top-5 flex w-8 flex-col items-center">
                        <div className="h-7 w-px" style={{ background: `${skin.edge}66` }} />
                        <div className="mt-1 h-2.5 w-2.5 rotate-45 border" style={{ borderColor: `${skin.edge}66`, background: `${skin.baseTop}22` }} />
                        <div className="mt-1 w-px flex-1 bg-white/10" />
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => onOpenEra?.(era)}
                    className={`group flex shrink-0 flex-col items-center gap-1.5 pt-1 ${onOpenEra ? 'cursor-pointer' : 'cursor-default'}`}
                    title={onOpenEra ? `Abrir ${era.label}` : era.label}
                >
                    <span
                        className="rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition-colors group-hover:text-white"
                        style={{
                            borderColor: `${skin.edge}40`,
                            color: skin.edge,
                            background: 'linear-gradient(180deg, rgba(3,5,8,0.72), rgba(3,5,8,0.5))',
                        }}
                    >
                        {era.label}
                    </span>
                    <div className="h-[72px] w-[10px] overflow-hidden rounded-sm">
                        <EraRibbon label="" skinId={era.skinId} className="h-full w-full" />
                    </div>
                </button>

                <div className="relative flex gap-1.5 pb-4">
                    <div className="pointer-events-none absolute inset-x-0 -top-2.5 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                    <div
                        className="pointer-events-none absolute bottom-[6px] left-2 right-2 h-px"
                        style={{
                            background: `linear-gradient(90deg, ${skin.edge}00 0%, ${skin.edge}66 18%, ${skin.edge}88 50%, ${skin.edge}66 82%, ${skin.edge}00 100%)`,
                            boxShadow: `0 0 18px ${skin.edge}28`,
                        }}
                    />
                    <div className="pointer-events-none absolute bottom-[3px] left-2 h-[7px] w-[7px] rounded-full" style={{ backgroundColor: skin.edge, boxShadow: `0 0 14px ${skin.edge}44` }} />
                    <div className="pointer-events-none absolute bottom-[3px] right-2 h-[7px] w-[7px] rounded-full" style={{ backgroundColor: skin.edge, boxShadow: `0 0 14px ${skin.edge}44` }} />
                    {(era.cycles || []).map((cycle) => renderCycleNode(cycle, skin, true))}
                </div>

                {!isLastEra && (
                    <div className="pointer-events-none flex shrink-0 flex-col items-center justify-start gap-1 pt-2">
                        <span className="rounded-full border border-white/10 bg-black/32 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.18em] text-white/55">
                            Fim
                        </span>
                        <div className="h-2.5 w-2.5 rotate-45 border" style={{ borderColor: `${skin.edge}55`, background: `${skin.baseTop}22` }} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <section id={id} className={sceneClass}>
            <div
                className="legacy-scene-backdrop"
                aria-hidden="true"
                style={{
                    backgroundImage: `url(${backdropSkin.imageUrl})`,
                    borderRadius: interactive ? '0px' : '34px',
                    backgroundPosition: interactive ? 'center center' : 'center top',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    transform: interactive ? `scale(${Math.max(backdropScale, 1.06)})` : `scale(${backdropScale})`,
                    transformOrigin: interactive ? 'center center' : 'center top',
                    filter: interactive ? 'blur(16px) saturate(0.92) brightness(0.62)' : 'none',
                    opacity: interactive ? 0.56 : 1,
                }}
            />

            <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 transition-all duration-700 ${eraTransitionPulse ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    background: eraTransitionPulse
                        ? `radial-gradient(circle at center, ${eraTransitionPulse}22 0%, ${eraTransitionPulse}10 26%, rgba(0,0,0,0.32) 55%, rgba(0,0,0,0.68) 100%)`
                        : undefined,
                }}
            />

            <div className={`relative z-10 ${interactive ? 'flex min-h-full items-center justify-center p-1.5' : ''}`}>
                <div
                    className={interactive ? 'relative overflow-hidden' : 'relative z-10 flex min-h-full flex-col'}
                    style={interactive ? { width: `${stageWidth}px`, height: `${stageHeight}px` } : undefined}
                >
                <div
                    className={interactive ? 'relative flex h-full w-full flex-col overflow-hidden px-4 pb-3 pt-5 text-white' : 'relative z-10 flex min-h-full flex-col text-white'}
                    style={interactive ? { width: `${LEGACY_STAGE_WIDTH}px`, height: `${LEGACY_STAGE_HEIGHT}px`, transform: `scale(${stageScale})`, transformOrigin: 'top left' } : undefined}
                >
                {interactive && (
                    <>
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0"
                            style={interactiveBackdropStyle}
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background: [
                                    'linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.02) 18%, rgba(0,0,0,0.18) 100%)',
                                    'radial-gradient(circle at 50% 11%, rgba(255,255,255,0.08), transparent 18%)',
                                ].join(', '),
                            }}
                        />
                    </>
                )}
                {interactive && (
                    <>
                        <div className="pointer-events-none absolute inset-x-4 top-2 z-20 flex items-start justify-between gap-3 sm:top-3 sm:inset-x-5">
                            <div className="pointer-events-auto rounded-[18px] border border-[var(--skin-accent-color)]/18 bg-[linear-gradient(180deg,rgba(6,10,14,0.82),rgba(3,6,10,0.66))] px-2 py-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => jumpToCycle(activeIndex - 1)}
                                        disabled={activeIndex <= 0}
                                        aria-label="Ciclo anterior"
                                        className={`flex h-9 w-9 items-center justify-center rounded-full text-[1rem] font-black leading-none transition ${activeIndex <= 0 ? 'cursor-not-allowed border border-white/8 bg-white/5 text-white/28' : 'border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)] shadow-[0_0_18px_rgba(212,175,55,0.08)] hover:bg-[var(--skin-accent-color)]/16'}`}
                                    >
                                        <span aria-hidden="true">‹</span>
                                    </button>
                                    <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                        {Math.max(activeIndex + 1, 1)} / {cycleEntries.length}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (activeIndex >= cycleEntries.length - 1) {
                                                if (!didCompleteRef.current) {
                                                    didCompleteRef.current = true;
                                                    onSequenceComplete?.();
                                                }
                                                return;
                                            }
                                            jumpToCycle(activeIndex + 1);
                                        }}
                                        aria-label={activeIndex >= cycleEntries.length - 1 ? 'Concluir legado' : 'Proximo ciclo'}
                                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)] shadow-[0_0_18px_rgba(212,175,55,0.08)] text-[1rem] font-black leading-none transition hover:bg-[var(--skin-accent-color)]/16"
                                    >
                                        <span aria-hidden="true">›</span>
                                    </button>
                                </div>
                            </div>

                            {showLayoutEditor && (
                                <div className="pointer-events-auto flex flex-col items-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLayoutEditorOpen((current) => !current)}
                                        className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_10px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl transition ${layoutEditorOpen ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/12 text-[var(--skin-accent-color)]' : 'border-white/10 bg-black/35 text-white/56 hover:text-white/82'}`}
                                    >
                                        {layoutEditorOpen ? 'Fechar ajuste' : 'Ajustar cena'}
                                    </button>
                                    {layoutEditorOpen && (
                                        <div className="w-[228px] rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,10,14,0.82),rgba(3,6,10,0.7))] px-3.5 py-3.5 shadow-[0_16px_30px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl">
                                            <div className="space-y-2.5">
                                                <LayoutSlider label="Zoom do fundo" value={layout.backdropZoom} min={1} max={1.22} step={0.01} onChange={(value) => updateLayout({ backdropZoom: value })} />
                                                <LayoutSlider label="Zoom da placa" value={layout.plaqueZoom} min={0.8} max={1.55} step={0.01} onChange={(value) => updateLayout({ plaqueZoom: value })} />
                                                <LayoutSlider label="Y da placa" value={layout.plaqueOffsetY} min={-120} max={120} step={1} onChange={(value) => updateLayout({ plaqueOffsetY: value })} />
                                                <LayoutSlider label="Zoom do ciclo" value={layout.cyclesZoom} min={0.75} max={1.8} step={0.01} onChange={(value) => updateLayout({ cyclesZoom: value })} />
                                                <LayoutSlider label="Y do ciclo" value={layout.cyclesOffsetY} min={-360} max={140} step={1} onChange={(value) => updateLayout({ cyclesOffsetY: value })} />
                                                <LayoutSlider label="Y do perfil" value={layout.playerOffsetY} min={-140} max={140} step={1} onChange={(value) => updateLayout({ playerOffsetY: value })} />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleCopyLayoutJson}
                                                className="mt-3 w-full rounded-full border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--skin-accent-color)] transition hover:bg-[var(--skin-accent-color)]/16"
                                            >
                                                {layoutCopyState === 'copied' ? 'JSON copiado' : layoutCopyState === 'prompt' ? 'JSON aberto' : 'Gravar JSON'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
                <div
                    className={`mx-auto transition-all duration-700 ${timelineVisible ? 'opacity-100' : 'pointer-events-none opacity-40'} ${interactive ? 'cursor-pointer' : ''}`}
                    onClick={interactive ? onActivatePlaque : undefined}
                    style={{
                        marginTop: interactive ? '74px' : undefined,
                        width: interactive ? `${scenePlaqueWidth}px` : undefined,
                        maxWidth: interactive ? `${LEGACY_STAGE_WIDTH - 20}px` : undefined,
                        transform: `translate(${layout.plaqueOffsetX}px, ${(timelineVisible ? 0 : -16) + layout.plaqueOffsetY}px) scale(${(enteringProjection ? 0.985 : 1) * scenePlaqueScale})`,
                        transformOrigin: 'top center',
                        boxShadow: eraTransitionPulse
                            ? `0 -10px 60px ${eraTransitionPulse}22, inset 0 0 70px ${eraTransitionPulse}11`
                            : undefined,
                    }}
                >
                    <div
                        className={`transition-all duration-700 ${timelineVisible ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-80'} ${enteringProjection ? 'animate-pulse' : ''}`}
                        style={{
                            boxShadow: eraTransitionPulse
                                ? `0 0 36px ${eraTransitionPulse}40, inset 0 0 28px ${eraTransitionPulse}12`
                                : undefined,
                        }}
                    >
                        <LegacyGrandPlaque eras={orderedEras} sovereignName={sovereignName} compact hideSovereignName={interactive} portrait={interactive} />
                    </div>
                </div>

                <div className="mt-auto space-y-0.5 transition-all duration-700">
                    <div className={`mx-auto transition-all duration-1000 ${timelineVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`} style={{ maxWidth: interactive ? 'min(98vw, 1480px)' : undefined }}>
                        <div
                            ref={timelineScrollRef}
                            onScroll={handleTimelineScroll}
                            className={`${interactive ? 'overflow-x-auto pb-1 hide-scrollbar' : 'overflow-visible'}`}
                            style={{ transform: `translate(${sceneCyclesTranslateX}px, ${sceneCyclesTranslateY}px) scale(${layout.cyclesZoom})`, transformOrigin: 'top center' }}
                        >
                            <div
                                ref={timelineContentRef}
                                className={`relative inline-flex min-w-full items-start gap-1 ${interactive ? 'pt-6' : 'pt-2'}`}
                                style={interactive ? { paddingLeft: `${timelineEdgePadding.left}px`, paddingRight: `${timelineEdgePadding.right}px` } : undefined}
                            >
                                {interactive ? (
                                    orderedEras.map((era, eraIndex) => renderInteractiveEraGroup(era, eraIndex))
                                ) : (
                                    orderedEras.map((era, eraIndex) => {
                                        const skin = getEraRibbonSkin(era.skinId);
                                        return (
                                            <div key={era.key || era.label} className="relative flex shrink-0 gap-1">
                                                {eraIndex > 0 && (
                                                    <div className="absolute -left-4 bottom-0 top-0 flex w-8 flex-col items-center justify-start">
                                                        <div className="mt-[26px] h-8 w-px bg-[var(--skin-accent-color)]/42" />
                                                        <div className="mt-2 w-px flex-1 bg-white/10" />
                                                    </div>
                                                )}

                                                <button type="button" onClick={() => onOpenEra?.(era)} className={`group flex shrink-0 flex-col items-center gap-1 ${onOpenEra ? 'cursor-pointer' : 'cursor-default'}`} title="Abrir Era">
                                                    <div className="h-[72px] w-[10px] overflow-hidden rounded-sm">
                                                        <EraRibbon label="" skinId={era.skinId} className="h-full w-full" />
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase tracking-[0.16em] text-gray-500 transition-colors group-hover:text-white">{era.label}</span>
                                                </button>

                                                <div className="flex gap-1.5">
                                                    {(era.cycles || []).map((cycle) => renderCycleNode(cycle, skin, false))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        className={`mx-auto w-full legacy-identity-dock transition-all duration-500 ${identityPulse ? 'opacity-100' : ''}`}
                        style={{
                            maxWidth: '272px',
                            transform: `translate(${layout.playerOffsetX}px, ${layout.playerOffsetY}px) scale(${layout.playerZoom})`,
                            transformOrigin: 'bottom center',
                        }}
                    >
                        <div className={`h-[92px] w-full overflow-hidden rounded-[20px] border border-white/12 bg-[linear-gradient(180deg,rgba(8,11,18,0.88),rgba(3,5,8,0.7))] px-3 py-2 shadow-[0_14px_32px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-500 ${identityPulse ? 'ring-1 ring-[var(--skin-accent-color)]/32 shadow-[0_0_20px_rgba(212,175,55,0.12),0_14px_32px_rgba(0,0,0,0.34)]' : ''}`}>
                            <div className="flex items-center gap-2.5">
                                <UserAvatar
                                    avatarUrl={activeIdentity.avatarUrl}
                                    nickname={activeIdentity.nickname || sovereignName}
                                    className="h-12 w-12"
                                    borderColor="var(--skin-accent-color)"
                                    level={activeIdentity.level}
                                />
                                <div className="min-w-0 flex-1 overflow-hidden">
                                    <p className="text-[8px] font-black uppercase tracking-[0.22em] text-amber-100/58">Perfil soberano</p>
                                    <h3
                                        className={`truncate font-black text-white transition-all duration-500 ${nicknameClass} ${identityPulse ? 'text-[var(--skin-accent-color)]' : ''}`}
                                        title={displayNickname}
                                    >
                                        {displayNickname}
                                    </h3>
                                    <div className={`mt-1 grid ${activeIdentity.clanName ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5 overflow-hidden`}>
                                        <span className="truncate rounded-full border border-white/10 bg-white/6 px-1.5 py-[3px] text-center text-[8px] font-black uppercase tracking-[0.08em] text-white/82" title={activePatent}>
                                            {activePatent}
                                        </span>
                                        {activeIdentity.clanName && (
                                            <span className="truncate rounded-full border border-white/10 bg-white/6 px-1.5 py-[3px] text-center text-[8px] font-black uppercase tracking-[0.08em] text-white/72" title={activeClan}>
                                                {activeIdentity.clanIcon ? `${activeIdentity.clanIcon} ` : ''}{activeClan}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
                </div>
            </div>
        </section>
    );
};

