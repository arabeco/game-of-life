import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ReportIdentitySnapshot } from '../types';
import { formatDate, getScoreGrade } from '../utils/dateUtils';
import { EraRibbon, getEraRibbonSkin } from './EraRibbon';
import { LegacyPlaqueArtifact } from './LegacyPlaqueArtifact';
import { MetalReportCard } from './MetalReportCard';
import { MiniCyclePlannerSnapshot } from './MiniCyclePlannerSnapshot';
import type { LegacyEraSummary } from './LegacyExportDocument';
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

const identityKey = (identity: ReportIdentitySnapshot) => [
    identity.nickname || '',
    identity.title || '',
    identity.level || 0,
    identity.nobilityRankId || '',
    identity.nobilityRankName || '',
    identity.clanName || '',
    identity.clanRankName || '',
].join('|');

export const LegacyProjectionScene: React.FC<LegacyProjectionSceneProps> = ({
    id,
    eras,
    sovereignName,
    projectionActive = true,
    interactive = false,
    autoAdvance = false,
    enteringProjection = false,
    fallbackIdentity,
    onSequenceComplete,
    onActivatePlaque,
    onOpenCycle,
    onOpenEra,
}) => {
    const cycleEntries = useMemo(
        () => eras.flatMap((era, eraIndex) => (era.cycles || []).map((cycle, cycleIndex) => ({ era, eraIndex, cycle, cycleIndex }))),
        [eras]
    );

    const [activeCycleId, setActiveCycleId] = useState<string>(() => cycleEntries[0]?.cycle.id || '');
    const [identityPulse, setIdentityPulse] = useState(false);
    const [eraTransitionPulse, setEraTransitionPulse] = useState<string | null>(null);
    const [sequenceCompleted, setSequenceCompleted] = useState(false);
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

        const cardRect = card.getBoundingClientRect();
        const scrollRect = scroller.getBoundingClientRect();
        const offset = (cardRect.left - scrollRect.left) - (scrollRect.width / 2) + (cardRect.width / 2);
        scroller.scrollTo({ left: scroller.scrollLeft + offset, behavior: 'smooth' });
    }, [activeCycleId, activeIndex, interactive]);

    if (!eras.length) return null;

    const activePatent = activeIdentity.nobilityRankName || activeIdentity.title || 'Vagante';
    const activeClan = activeIdentity.clanName || 'Sem cla';
    const avatarInitials = (activeIdentity.nickname || sovereignName).slice(0, 2).toUpperCase();
    const timelineVisible = !interactive || projectionActive;
    const plaqueReclaimingFocus = interactive && sequenceCompleted;

    return (
        <section
            id={id}
            className={`relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.1),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.015))] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.42)] ${interactive ? 'w-full' : 'w-[1720px]'}`}
        >
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 rounded-[34px] transition-all duration-700 ${eraTransitionPulse ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    background: eraTransitionPulse
                        ? `radial-gradient(circle at center, ${eraTransitionPulse}22 0%, ${eraTransitionPulse}10 26%, rgba(0,0,0,0.32) 55%, rgba(0,0,0,0.68) 100%)`
                        : undefined,
                }}
            />

            <div
                className={`legacy-panel-strong p-5 transition-all duration-500 ${identityPulse ? 'scale-[1.01] shadow-[0_0_42px_rgba(212,175,55,0.18)]' : ''}`}
                style={{
                    boxShadow: plaqueReclaimingFocus
                        ? '0 0 0 1px rgba(212,175,55,0.35), 0 0 55px 8px rgba(212,175,55,0.12)'
                        : eraTransitionPulse
                            ? `0 0 0 1px ${eraTransitionPulse}60, 0 0 30px 20px ${eraTransitionPulse}22`
                            : undefined,
                }}
            >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(255,255,255,0.04))] transition-all duration-500 ${identityPulse ? 'shadow-[0_0_35px_rgba(212,175,55,0.28)]' : 'shadow-[0_0_25px_rgba(212,175,55,0.12)]'}`}>
                            {activeIdentity.avatarUrl ? (
                                <img src={activeIdentity.avatarUrl} alt={activeIdentity.nickname} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-xl font-black tracking-[0.2em] text-white/80">{avatarInitials}</div>
                            )}
                            <div className={`absolute bottom-2 right-2 rounded-full border border-black/30 bg-black/60 px-2 py-0.5 text-[10px] font-black text-white transition-all duration-500 ${identityPulse ? 'ring-2 ring-[var(--skin-accent-color)]/45' : ''}`}>
                                {activeIdentity.level}
                            </div>
                        </div>
                        <div>
                            <p className="legacy-kicker legacy-kicker-accent">Identidade projetada</p>
                            <h2 className={`mt-2 text-3xl font-black tracking-tight text-white transition-all duration-500 ${identityPulse ? 'text-[var(--skin-accent-color)]' : ''}`}>{activeIdentity.nickname || sovereignName}</h2>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className={`legacy-chip transition-all duration-500 ${identityPulse ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/10 text-white' : ''}`}>Patente {activePatent}</span>
                                <span className={`legacy-chip transition-all duration-500 ${identityPulse ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/10 text-white' : ''}`}>Nivel {activeIdentity.level}</span>
                                <span className={`legacy-chip transition-all duration-500 ${identityPulse ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/10 text-white' : ''}`}>{activeIdentity.clanIcon ? `${activeIdentity.clanIcon} ` : ''}{activeClan}</span>
                            </div>
                        </div>
                    </div>
                    <div className="legacy-panel px-4 py-3 lg:min-w-[340px]">
                        <p className="legacy-kicker legacy-kicker-muted">Ciclo em foco</p>
                        <p className="mt-2 text-sm font-black text-white">{activeEntry?.cycle.name || 'Sem ciclo ativo'}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-gray-400">
                            {activeEntry ? `${formatDate(activeEntry.cycle.startDate)} - ${formatDate(activeEntry.cycle.endDate)}` : 'Sem periodo'}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-400">
                            {sequenceCompleted ? 'A travessia terminou. A placa segura o fechamento do legado.' : 'A projecao percorre cada ciclo uma vez e desacelera apenas nas viradas importantes.'}
                        </p>
                    </div>
                </div>
            </div>

            <div
                className={`mt-6 transition-all duration-700 ${timelineVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-40'} ${enteringProjection ? 'scale-[0.985]' : plaqueReclaimingFocus ? 'scale-[1.03]' : 'scale-100'} ${interactive ? 'cursor-pointer' : ''}`}
                onClick={interactive ? onActivatePlaque : undefined}
                style={{
                    boxShadow: plaqueReclaimingFocus
                        ? '0 -6px 45px rgba(212,175,55,0.18), inset 0 0 100px rgba(212,175,55,0.08)'
                        : eraTransitionPulse
                            ? `0 -10px 60px ${eraTransitionPulse}22, inset 0 0 70px ${eraTransitionPulse}11`
                            : undefined,
                }}
            >
                <div
                    className={`transition-all duration-700 ${timelineVisible ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-80'} ${enteringProjection ? 'animate-pulse' : ''}`}
                    style={{
                        boxShadow: plaqueReclaimingFocus
                            ? '0 0 70px rgba(212,175,55,0.22), inset 0 0 70px rgba(212,175,55,0.08)'
                            : eraTransitionPulse
                                ? `0 0 40px ${eraTransitionPulse}55, inset 0 0 60px ${eraTransitionPulse}22`
                                : undefined,
                    }}
                >
                    <LegacyPlaqueArtifact eras={eras} sovereignName={sovereignName} plaqueUnlocked={true} compact={!interactive} />
                </div>
            </div>

            <div className={`mt-6 transition-all duration-1000 ${timelineVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'} ${plaqueReclaimingFocus ? 'scale-[0.97] opacity-35 blur-[1px]' : ''}`}>
                <div ref={timelineScrollRef} className={`${interactive ? 'overflow-x-auto pb-2 hide-scrollbar' : 'overflow-visible'}`}>
                    <div className="relative inline-flex min-w-full items-start gap-8 pt-10">
                        <div className="absolute left-0 right-0 top-[46px] h-px bg-[linear-gradient(90deg,_rgba(212,175,55,0.55),_rgba(212,175,55,0.12))]" />
                        {eras.map((era, eraIndex) => {
                            const skin = getEraRibbonSkin(era.skinId);
                            return (
                                <div key={era.key || era.label} className="relative flex shrink-0 gap-4">
                                    {eraIndex > 0 && (
                                        <div className="absolute -left-4 bottom-0 top-0 flex w-8 flex-col items-center justify-start">
                                            <div className="mt-[36px] h-10 w-px bg-[var(--skin-accent-color)]/50" />
                                            <div className={`mt-2 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.22em] transition-all duration-500 ${eraTransitionPulse ? 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/10 text-white shadow-[0_0_18px_rgba(212,175,55,0.22)]' : 'border-white/10 bg-black/50 text-gray-400'}`}>Nova Era</div>
                                            <div className="mt-2 w-px flex-1 bg-white/10" />
                                        </div>
                                    )}

                                    <button type="button" onClick={() => onOpenEra?.(era)} className={`group flex shrink-0 flex-col items-center gap-2 ${onOpenEra ? 'cursor-pointer' : 'cursor-default'}`} title="Abrir Era">
                                        <div className="h-[280px] w-10 overflow-hidden rounded-sm">
                                            <EraRibbon label="" skinId={era.skinId} className="h-full w-full" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 transition-colors group-hover:text-white">{era.label}</span>
                                    </button>

                                    <div className="space-y-4">
                                            <div className="rounded-[28px] border px-5 py-4" style={{ borderColor: `${skin.edge}35`, background: `linear-gradient(145deg, ${skin.baseTop}88 0%, rgba(0,0,0,0.58) 48%, ${skin.baseBottom}f2 100%)`, boxShadow: `0 18px 34px ${skin.baseBottom}55` }}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="legacy-kicker" style={{ color: skin.edge }}>{era.label}</p>
                                                        <p className="mt-2 text-sm font-black text-white">{formatDate(era.startDate)} - {formatDate(era.endDate)}</p>
                                                        <p className="mt-2 max-w-[360px] text-xs leading-relaxed text-gray-300">{era.finalSummary || era.description || era.aiSummary || 'Sem leitura final desta Era ainda.'}</p>
                                                    </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black" style={{ color: era.color }}>{era.avgScore}</p>
                                                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">score</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            {(era.cycles || []).map((cycle, cycleIndex) => {
                                                const scoreInfo = getScoreGrade(cycle.score);
                                                const isFocused = cycle.id === activeCycleId;
                                                const baseClass = `w-[330px] shrink-0 rounded-[26px] border bg-black/30 p-4 text-left shadow-[0_18px_30px_rgba(0,0,0,0.28)] transition-all ${interactive ? 'hover:-translate-y-1' : ''} ${isFocused ? 'ring-2 ring-[var(--skin-accent-color)]/45 scale-[1.01] opacity-100' : 'opacity-80'}`;
                                                const style = { borderColor: isFocused ? `${skin.edge}70` : 'rgba(255,255,255,0.1)', boxShadow: isFocused ? `0 0 0 1px ${skin.edge}22, 0 18px 34px ${skin.baseBottom}55` : '0 18px 30px rgba(0,0,0,0.28)' } as React.CSSProperties;
                                                const cycleContent = (
                                                    <>
                                                        <MetalReportCard
                                                            rank={scoreInfo.grade}
                                                            score={cycle.score}
                                                            title={cycle.name}
                                                            subtitle={cycleIndex === 0 ? 'Origem' : cycleIndex === (era.cycles || []).length - 1 ? 'Fecho' : `C${cycleIndex + 1}`}
                                                            dateRange={`${formatDate(cycle.startDate)} - ${formatDate(cycle.endDate)}`}
                                                            summary={scoreInfo.phrase}
                                                            metrics={[
                                                                { label: 'Foco', value: cycle.focusArena || 'Nenhuma' },
                                                                { label: 'Assinatura', value: cycle.signatureAction || 'Nenhuma' },
                                                            ]}
                                                            badges={[
                                                                { label: 'Era', value: era.label },
                                                                { label: 'Score', value: String(cycle.score) },
                                                            ]}
                                                            compact
                                                        />
                                                        <MiniCyclePlannerSnapshot weeks={cycle.weeklyAtlas || []} accentColor={skin.edge} className="mt-4" />
                                                    </>
                                                );

                                                if (onOpenCycle) {
                                                    return (
                                                        <button
                                                            ref={(node) => { cycleCardRefs.current[cycle.id] = node; }}
                                                            key={cycle.id}
                                                            type="button"
                                                            onMouseEnter={() => setActiveCycleId(cycle.id)}
                                                            onFocus={() => setActiveCycleId(cycle.id)}
                                                            onClick={() => onOpenCycle(cycle.id)}
                                                            className={baseClass}
                                                            style={style}
                                                        >
                                                            {cycleContent}
                                                        </button>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        ref={(node) => { cycleCardRefs.current[cycle.id] = node; }}
                                                        key={cycle.id}
                                                        onMouseEnter={() => setActiveCycleId(cycle.id)}
                                                        className={baseClass}
                                                        style={style}
                                                    >
                                                        {cycleContent}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {sequenceCompleted && interactive && (
                <div className="mt-6 rounded-[24px] border border-[var(--skin-accent-color)]/20 bg-[linear-gradient(180deg,_rgba(212,175,55,0.1),_rgba(255,255,255,0.03))] px-5 py-4 text-center shadow-[0_0_34px_rgba(212,175,55,0.12)]">
                    <p className="legacy-kicker legacy-kicker-accent">Legado percorrido</p>
                    <p className="mt-2 text-sm font-black text-white">A timeline recua e a placa fecha a leitura do legado.</p>
                </div>
            )}
        </section>
    );
};



