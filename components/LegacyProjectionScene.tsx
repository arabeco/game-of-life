import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ReportIdentitySnapshot } from '../types';
import { formatDate, getScoreGrade } from '../utils/dateUtils';
import { EraRibbon, getEraRibbonSkin } from './EraRibbon';
import { LegacyGrandPlaque } from './LegacyGrandPlaque';
import { LegacyCycleCard } from './LegacyCycleCard';
import { MiniCyclePlannerSnapshot } from './MiniCyclePlannerSnapshot';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { getLegacyBackdropSkin, type LegacyBackdropSkinId } from '../constants/legacyBackdropSkins';
import { useLegacyLayoutConfig } from '../hooks/useLegacyLayoutConfig';
import {
    getLegacyPlaqueScale,
    getLegacyPlaqueWidthPx,
    resetStoredLegacyLayoutConfig,
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
    autoAdvance?: boolean;
    enteringProjection?: boolean;
    fallbackIdentity?: ReportIdentitySnapshot;
    backdropSkinId?: LegacyBackdropSkinId;
    onSequenceComplete?: () => void;
    onActivatePlaque?: () => void;
    onOpenCycle?: (cycleId: string) => void;
    onOpenEra?: (era: LegacyEraSummary) => void;
    showLayoutLab?: boolean;
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
    const activeDays = days.filter((day) => (day.completedCount || 0) > 0 || (day.plannedCount || 0) > 0).length;
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
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-100/82">{label}</span>
            <span className="text-[10px] font-bold text-white/72">{value.toFixed(step < 1 ? 2 : 0)}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/12 accent-[var(--skin-accent-color)]"
        />
    </label>
);

export const LegacyProjectionScene: React.FC<LegacyProjectionSceneProps> = ({
    id,
    eras,
    sovereignName,
    projectionActive = true,
    interactive = false,
    autoAdvance = false,
    enteringProjection = false,
    fallbackIdentity,
    backdropSkinId,
    onSequenceComplete,
    onActivatePlaque,
    onOpenCycle,
    onOpenEra,
    showLayoutLab = false,
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

    const [activeCycleId, setActiveCycleId] = useState<string>(() => {
        if (!cycleEntries.length) return '';
        return cycleEntries[0]?.cycle.id || '';
    });
    const [identityPulse, setIdentityPulse] = useState(false);
    const [eraTransitionPulse, setEraTransitionPulse] = useState<string | null>(null);
    const [sequenceCompleted, setSequenceCompleted] = useState(false);
    const [layoutLabOpen, setLayoutLabOpen] = useState(showLayoutLab);
    const previousIdentityKeyRef = useRef<string>('');
    const didCompleteRef = useRef(false);
    const timelineScrollRef = useRef<HTMLDivElement | null>(null);
    const cycleCardRefs = useRef<Record<string, HTMLButtonElement | HTMLDivElement | null>>({});

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
    const activeIdentity = activeEntry?.cycle.identitySnapshot || buildFallbackIdentity(sovereignName, fallbackIdentity);
    const activeIndex = cycleEntries.findIndex((entry) => entry.cycle.id === activeCycleId);

    const applyLayoutPatch = (patch: Partial<LegacyLayoutConfig>) => {
        setStoredLegacyLayoutConfig({ ...layout, ...patch });
    };

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

    useEffect(() => {
        if (!autoAdvance || !projectionActive || cycleEntries.length <= 1 || sequenceCompleted) return;

        const currentIndex = activeIndex >= 0 ? activeIndex : 0;
        const currentEntry = cycleEntries[currentIndex];
        const nextEntry = cycleEntries[currentIndex + 1];
        const currentIdentity = currentEntry?.cycle.identitySnapshot || buildFallbackIdentity(sovereignName, fallbackIdentity);
        const nextIdentity = nextEntry?.cycle.identitySnapshot || currentIdentity;
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

    useEffect(() => {
        if (!interactive || activeIndex < 0) return;
        const card = cycleCardRefs.current[activeCycleId];
        const scroller = timelineScrollRef.current;
        if (!card || !scroller) return;

        const frame = window.requestAnimationFrame(() => {
            if ('scrollIntoView' in card) {
                card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                return;
            }

            const cardRect = card.getBoundingClientRect();
            const scrollRect = scroller.getBoundingClientRect();
            const offset = (cardRect.left - scrollRect.left) - (scrollRect.width / 2) + (cardRect.width / 2);
            scroller.scrollTo({ left: scroller.scrollLeft + offset, behavior: 'smooth' });
        });

        return () => window.cancelAnimationFrame(frame);
    }, [activeCycleId, activeIndex, interactive]);

    if (!eras.length) return null;

    const activePatent = activeIdentity.nobilityRankName || activeIdentity.title || 'Vagante';
    const activeClan = activeIdentity.clanName || 'Sem cla';
    const avatarInitials = (activeIdentity.nickname || sovereignName).slice(0, 2).toUpperCase();
    const timelineVisible = !interactive || projectionActive;
    const sceneClass = interactive
        ? 'relative min-h-full overflow-hidden px-0 py-0 text-white'
        : 'relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.035),_rgba(255,255,255,0.012))] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.42)] w-[1720px]';

    return (
        <section id={id} className={sceneClass}>
            <div
                className="legacy-scene-backdrop"
                aria-hidden="true"
                style={{
                    backgroundImage: interactive ? `url(${backdropSkin.imageUrl})` : `url(${backdropSkin.imageUrl})`,
                    borderRadius: interactive ? '0px' : '34px',
                    backgroundPosition: interactive ? 'center center' : 'center top',
                    backgroundSize: interactive ? '100% 100%' : 'cover',
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

            <div className={`relative z-10 flex min-h-full flex-col ${interactive ? 'px-4 pb-3 pt-5 sm:px-5 sm:pb-4 sm:pt-5' : ''}`}>
                {interactive && (
                    <>
                        <div className="pointer-events-none absolute inset-x-4 top-2 z-20 flex items-start justify-between gap-3 sm:top-3 sm:inset-x-5">
                            <div className="pointer-events-auto rounded-[20px] border border-white/12 bg-black/55 px-3 py-2 shadow-[0_18px_38px_rgba(0,0,0,0.34)] backdrop-blur-md">
                                <p className="text-[9px] font-black uppercase tracking-[0.26em] text-amber-100/70">Navegacao manual</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => jumpToCycle(activeIndex - 1)}
                                        disabled={activeIndex <= 0}
                                        className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition ${activeIndex <= 0 ? 'cursor-not-allowed border border-white/8 bg-white/5 text-white/30' : 'border border-white/12 bg-white/8 text-white hover:bg-white/12'}`}
                                    >
                                        Anterior
                                    </button>
                                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/82">
                                        {Math.max(activeIndex + 1, 1)} / {cycleEntries.length}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => jumpToCycle(activeIndex + 1)}
                                        disabled={activeIndex >= cycleEntries.length - 1}
                                        className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition ${activeIndex >= cycleEntries.length - 1 ? 'cursor-not-allowed border border-white/8 bg-white/5 text-white/30' : 'luxe-skin-button'}`}
                                    >
                                        Proximo
                                    </button>
                                </div>
                            </div>

                            <div className="pointer-events-auto flex flex-col items-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLayoutLabOpen((current) => !current)}
                                    className="rounded-full border border-white/12 bg-black/55 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-[0_18px_38px_rgba(0,0,0,0.34)] backdrop-blur-md transition hover:bg-black/65"
                                >
                                    {layoutLabOpen ? 'Ocultar editor' : 'Editar cena'}
                                </button>
                                {layoutLabOpen && (
                                    <div className="w-[280px] rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(11,13,19,0.92),rgba(6,7,12,0.88))] p-4 shadow-[0_22px_54px_rgba(0,0,0,0.42)] backdrop-blur-lg">
                                        <p className="text-[9px] font-black uppercase tracking-[0.28em] text-amber-100/70">Editor da projecao</p>
                                        <div className="mt-3 space-y-3">
                                            <LayoutSlider label="Placa X" value={layout.plaqueOffsetX} min={-220} max={220} step={1} onChange={(value) => applyLayoutPatch({ plaqueOffsetX: value })} />
                                            <LayoutSlider label="Placa Y" value={layout.plaqueOffsetY} min={-120} max={120} step={1} onChange={(value) => applyLayoutPatch({ plaqueOffsetY: value })} />
                                            <LayoutSlider label="Placa Zoom" value={layout.plaqueZoom} min={0.55} max={1.6} step={0.01} onChange={(value) => applyLayoutPatch({ plaqueZoom: value })} />
                                            <LayoutSlider label="Grid Y" value={layout.cyclesOffsetY} min={-240} max={140} step={1} onChange={(value) => applyLayoutPatch({ cyclesOffsetY: value })} />
                                            <LayoutSlider label="Grid Zoom" value={layout.cyclesZoom} min={0.55} max={1.8} step={0.01} onChange={(value) => applyLayoutPatch({ cyclesZoom: value })} />
                                        </div>
                                        <div className="mt-4 flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => resetStoredLegacyLayoutConfig()}
                                                className="rounded-full border border-white/12 bg-white/6 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/78 transition hover:bg-white/10"
                                            >
                                                Resetar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
                <div
                    className={`mx-auto transition-all duration-700 ${timelineVisible ? 'opacity-100' : 'pointer-events-none opacity-40'} ${interactive ? 'cursor-pointer' : ''}`}
                    onClick={interactive ? onActivatePlaque : undefined}
                    style={{
                        marginTop: interactive ? '6vh' : undefined,
                        width: interactive ? `${scenePlaqueWidth}px` : undefined,
                        maxWidth: interactive ? 'calc(100vw - 2.5rem)' : undefined,
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
                        <LegacyGrandPlaque eras={orderedEras} sovereignName={sovereignName} compact />
                    </div>
                </div>

                <div className="mt-auto space-y-0.5 transition-all duration-700">
                    <div className={`mx-auto transition-all duration-1000 ${timelineVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`} style={{ maxWidth: interactive ? 'min(98vw, 1480px)' : undefined }}>
                        <div
                            ref={timelineScrollRef}
                            className={`${interactive ? 'overflow-x-auto pb-1 hide-scrollbar' : 'overflow-visible'}`}
                            style={{ transform: `translateY(${layout.cyclesOffsetY}px) scale(${layout.cyclesZoom})`, transformOrigin: 'top center' }}
                        >
                            <div className="relative inline-flex min-w-full items-start gap-1 pt-2">
                                {orderedEras.map((era, eraIndex) => {
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
                                                    {(era.cycles || []).map((cycle) => {
                                                        const scoreInfo = getScoreGrade(cycle.score);
                                                        const cycleMetrics = buildLegacyCycleMetrics(cycle);
                                                        const isFocused = cycle.id === activeCycleId;
                                                        const baseClass = `shrink-0 rounded-[12px] border border-white/0 bg-transparent p-0 text-left transition-all ${interactive ? 'hover:-translate-y-1' : ''} ${isFocused ? 'scale-[1.01] opacity-100' : 'opacity-100'}`;
                                                        const style = { boxShadow: isFocused ? `0 0 0 1px ${skin.edge}18, 0 8px 14px ${skin.baseBottom}24` : 'none' } as React.CSSProperties;
                                                        const cycleContent = (
                                                            <>
                                                                <LegacyCycleCard
                                                                    rank={scoreInfo.grade}
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
                                                                    className="legacy-cycle-planner"
                                                                    style={{ transformOrigin: 'top center' }}
                                                                />
                                                            </>
                                                        );

                                                        if (!interactive) {
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
                                                    })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div
                        className={`mx-auto w-full legacy-identity-dock transition-all duration-500 ${identityPulse ? 'opacity-100' : ''}`}
                        style={{
                            maxWidth: '218px',
                            transform: `translateY(${layout.playerOffsetY}px) scale(${layout.playerZoom})`,
                            transformOrigin: 'bottom center',
                        }}
                    >
                        <div className={`legacy-identity-avatar transition-all duration-500 ${identityPulse ? 'ring-2 ring-[var(--skin-accent-color)]/35 shadow-[0_0_18px_rgba(212,175,55,0.16)]' : ''}`}>
                            {activeIdentity.avatarUrl ? (
                                <img src={activeIdentity.avatarUrl} alt={activeIdentity.nickname} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-black tracking-[0.18em] text-white/85">{avatarInitials}</div>
                            )}
                        </div>
                        <div className="legacy-identity-copy">
                            <h3 className={`text-[0.98rem] font-black tracking-[0.04em] text-white transition-all duration-500 ${identityPulse ? 'text-[var(--skin-accent-color)]' : ''}`}>{activeIdentity.nickname || sovereignName}</h3>
                            <p className="legacy-identity-line mt-1">
                                <span>{activePatent}</span>
                                <span>{activeClan}</span>
                                <span>Nv {activeIdentity.level}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

