import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import type { ReportIdentitySnapshot } from '../types';
import { formatDate, getScoreGrade } from '../utils/dateUtils';
import { GlyphIcon } from './Icons';
import { EraRibbon, getEraRibbonSkin } from './EraRibbon';
import { buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';
import { LegacyGrandPlaque } from './LegacyGrandPlaque';
import { MetalReportCard } from './MetalReportCard';
import { MiniCyclePlannerSnapshot } from './MiniCyclePlannerSnapshot';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { getLegacyBackdropSkin, type LegacyBackdropSkinId } from '../constants/legacyBackdropSkins';
import './legacy-ui.css';

export interface LegacyExportKitSlide {
    id: string;
    fileName: string;
    title: string;
}

export interface LegacyExportKitHandle {
    getSlides: () => LegacyExportKitSlide[];
}

interface LegacyExportKitProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    fallbackIdentity?: ReportIdentitySnapshot;
    backdropSkinId?: LegacyBackdropSkinId;
}

const KIT_WIDTH = 'w-[1080px]';
const KIT_HEIGHT = 'min-h-[1920px]';

const formatHours = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1));

export const LegacyExportKit = forwardRef<LegacyExportKitHandle, LegacyExportKitProps>(({ eras, sovereignName, fallbackIdentity, backdropSkinId }, ref) => {
    const slideRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const summary = useMemo(() => buildLegacyPlaqueSummary(eras), [eras]);
    const backdropSkin = getLegacyBackdropSkin(backdropSkinId);
    const exportIdentity = useMemo(() => ({
        nickname: fallbackIdentity?.nickname || sovereignName,
        level: fallbackIdentity?.level || 1,
        clanName: fallbackIdentity?.clanName || 'Sem grupo',
        title: fallbackIdentity?.nobilityRankName || fallbackIdentity?.title || 'Vagante',
    }), [fallbackIdentity, sovereignName]);

    const slides = useMemo<LegacyExportKitSlide[]>(() => {
        const items: LegacyExportKitSlide[] = [
            {
                id: 'legacy-kit-slide-summary',
                fileName: `glyph-legado-01-resumo-${new Date().toISOString().slice(0, 10)}.png`,
                title: 'Resumo do legado',
            },
        ];

        let sequence = 2;
        eras.forEach((era, eraIndex) => {
            (era.cycles || []).forEach((cycle, cycleIndex) => {
                items.push({
                    id: `legacy-kit-cycle-${eraIndex + 1}-${cycleIndex + 1}-${cycle.id}`,
                    fileName: `glyph-legado-${String(sequence).padStart(2, '0')}-era-${eraIndex + 1}-ciclo-${cycleIndex + 1}.png`,
                    title: `${era.label} - ${cycle.name}`,
                });
                sequence += 1;
            });
        });

        items.push({
            id: 'legacy-kit-slide-final',
            fileName: `glyph-legado-${String(sequence).padStart(2, '0')}-fecho-${new Date().toISOString().slice(0, 10)}.png`,
            title: 'Fecho do legado',
        });

        return items;
    }, [eras]);

    useImperativeHandle(ref, () => ({
        getSlides: () => slides.filter((slide) => slideRefs.current[slide.id]),
    }), [slides]);

    const historicalAverageScore = summary.totalCycles > 0
        ? Math.round(eras.reduce((sum, era) => sum + (era.avgScore * Math.max(era.cycleCount || 1, 1)), 0) / summary.totalCycles)
        : 0;
    const historicalGrade = getScoreGrade(historicalAverageScore);
    const historyStart = eras[0]?.startDate;
    const historyEnd = eras[eras.length - 1]?.endDate;

    return (
        <div className="space-y-8 bg-[#050505] p-4 text-white">
            <div
                id="legacy-kit-slide-summary"
                ref={(node) => { slideRefs.current['legacy-kit-slide-summary'] = node; }}
                className={`${KIT_WIDTH} ${KIT_HEIGHT} overflow-hidden rounded-[36px] border border-white/10 p-10 shadow-[0_24px_60px_rgba(0,0,0,0.48)]`}
                style={{ backgroundImage: `${backdropSkin.overlay}, url(${backdropSkin.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                <div className="flex h-full flex-col items-center gap-6">
                    <div className="w-full max-w-[300px] pt-4">
                        <LegacyGrandPlaque eras={eras} sovereignName={sovereignName} compact />
                    </div>
                    <div className="legacy-identity-rail w-full max-w-[920px]">
                        <div className="legacy-identity-avatar">
                            <div className="flex h-full w-full items-center justify-center text-lg font-black tracking-[0.18em] text-white/85">{exportIdentity.nickname.slice(0, 2).toUpperCase()}</div>
                        </div>
                        <div className="legacy-identity-copy">
                            <p className="legacy-kicker legacy-kicker-muted">Soberano</p>
                            <h3 className="mt-2 text-xl font-black tracking-tight text-white">{exportIdentity.nickname}</h3>
                        </div>
                        <div className="legacy-identity-stat">
                            <p className="legacy-kicker legacy-kicker-muted">Patente</p>
                            <p className="mt-2 text-sm font-black text-white">{exportIdentity.title}</p>
                        </div>
                        <div className="legacy-identity-stat">
                            <p className="legacy-kicker legacy-kicker-muted">Cla</p>
                            <p className="mt-2 text-sm font-black text-white">{exportIdentity.clanName}</p>
                        </div>
                        <div className="legacy-identity-stat">
                            <p className="legacy-kicker legacy-kicker-muted">Nivel</p>
                            <p className="mt-2 text-sm font-black text-white">{exportIdentity.level}</p>
                        </div>
                    </div>
                    <div className="legacy-panel-strong w-full p-6 text-center">
                        <p className="legacy-kicker legacy-kicker-accent">Resumo total</p>
                        <h2 className="mt-3 text-5xl font-black tracking-tight text-white">Legado consolidado</h2>
                        <p className="mx-auto mt-3 max-w-3xl text-base leading-relaxed text-gray-300">
                            Resumo geral pronto para carrossel, montagem manual em slides e postagem. A capa do kit replica a leitura condensada do legado.
                        </p>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-4">
                        <div className="legacy-panel-soft p-6 text-center">
                            <p className="legacy-kicker legacy-kicker-muted">Ciclos</p>
                            <p className="mt-2 text-5xl font-black text-white">{summary.totalCycles}</p>
                        </div>
                        <div className="legacy-panel-soft p-6 text-center">
                            <p className="legacy-kicker legacy-kicker-muted">Carga</p>
                            <p className="mt-2 text-5xl font-black text-white">{formatHours(summary.totalHours)}h</p>
                        </div>
                        <div className="legacy-panel-soft p-6 text-center">
                            <p className="legacy-kicker legacy-kicker-muted">Metas</p>
                            <p className="mt-2 text-5xl font-black text-white">{summary.totalSealedMetas}</p>
                        </div>
                        <div className="legacy-panel-soft p-6 text-center">
                            <p className="legacy-kicker legacy-kicker-muted">Patamar</p>
                            <p className={`mt-2 text-5xl font-black ${historicalGrade.color}`}>{summary.averageGrade} | {historicalAverageScore}</p>
                        </div>
                    </div>
                    <div className="legacy-panel-soft w-full p-6 text-center">
                        <p className="legacy-kicker legacy-kicker-muted">Periodo completo</p>
                        <p className="mt-3 text-3xl font-black tracking-tight text-white">
                            {historyStart && historyEnd ? `${formatDate(historyStart)} - ${formatDate(historyEnd)}` : 'Sem periodo fechado'}
                        </p>
                        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-gray-300">{summary.plaqueInscription}</p>
                    </div>
                </div>
            </div>

            {eras.map((era, eraIndex) => {
                const skin = getEraRibbonSkin(era.skinId);
                return (era.cycles || []).map((cycle, cycleIndex) => {
                    const slideId = `legacy-kit-cycle-${eraIndex + 1}-${cycleIndex + 1}-${cycle.id}`;
                    const scoreInfo = getScoreGrade(cycle.score);

                    return (
                        <div
                            key={slideId}
                            id={slideId}
                            ref={(node) => { slideRefs.current[slideId] = node; }}
                            className={`${KIT_WIDTH} ${KIT_HEIGHT} overflow-hidden rounded-[36px] border border-white/10 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.48)]`}
                            style={{ backgroundImage: `${backdropSkin.overlay}, url(${backdropSkin.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        >
                            <div className="flex h-full flex-col gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-12 overflow-hidden rounded-sm">
                                        <EraRibbon label="" skinId={era.skinId} className="h-full w-full" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="legacy-kicker" style={{ color: skin.edge }}>{era.label}</p>
                                        <h3 className="mt-2 text-3xl font-black tracking-tight text-white">{cycle.name}</h3>
                                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-gray-400">{formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className={`text-5xl font-black ${scoreInfo.color}`}>{cycle.score}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Patamar {scoreInfo.grade}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center">
                                    <MetalReportCard
                                        rank={scoreInfo.grade}
                                        score={cycle.score}
                                        title={cycle.name}
                                        subtitle={era.label}
                                        dateRange={`${formatDate(cycle.startDate)} - ${formatDate(cycle.endDate)}`}
                                        summary={scoreInfo.phrase}
                                        metrics={[
                                            { label: 'Foco', value: cycle.focusArena || 'Nenhuma' },
                                            { label: 'Assinatura', value: cycle.signatureAction || 'Nenhuma' },
                                            { label: 'Score', value: String(cycle.score) },
                                            { label: 'Era', value: era.label },
                                        ]}
                                        badges={[
                                            { label: 'Inicio', value: formatDate(cycle.startDate) },
                                            { label: 'Fecho', value: formatDate(cycle.endDate) },
                                        ]}
                                        className="w-full max-w-[760px]"
                                    />
                                </div>

                                <div className="legacy-panel-soft flex-1 p-5">
                                    <p className="legacy-kicker legacy-kicker-muted text-center">Planner do ciclo</p>
                                    <MiniCyclePlannerSnapshot weeks={cycle.weeklyAtlas || []} accentColor={skin.edge} className="mt-5" />
                                </div>
                            </div>
                        </div>
                    );
                });
            })}

            <div
                id="legacy-kit-slide-final"
                ref={(node) => { slideRefs.current['legacy-kit-slide-final'] = node; }}
                className={`${KIT_WIDTH} ${KIT_HEIGHT} overflow-hidden rounded-[36px] border border-white/10 p-10 shadow-[0_24px_60px_rgba(0,0,0,0.48)]`}
                style={{ backgroundImage: `${backdropSkin.overlay}, url(${backdropSkin.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                <div className="flex min-h-[720px] flex-col items-center justify-center text-center">
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/25 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_rgba(255,255,255,0.03))] shadow-[0_0_42px_rgba(212,175,55,0.18)]">
                        <GlyphIcon className="h-10 w-10 text-[var(--skin-accent-color)]" />
                    </div>
                    <p className="mt-8 text-[11px] font-black uppercase tracking-[0.36em] text-[var(--skin-accent-color)]">Fecho do Glyph</p>
                    <h2 className="mt-4 max-w-3xl text-5xl font-black tracking-tight text-white">Trajetoria condensada em eras, ciclos e memoria operacional.</h2>
                    <p className="mt-5 max-w-3xl text-lg leading-relaxed text-gray-300">{summary.plaqueInscription}</p>
                    <div className="mt-10 grid grid-cols-3 gap-4">
                        <div className="legacy-panel-soft p-5">
                            <p className="legacy-kicker legacy-kicker-muted">Soberano</p>
                            <p className="mt-2 text-2xl font-black text-white">{sovereignName}</p>
                        </div>
                        <div className="legacy-panel-soft p-5">
                            <p className="legacy-kicker legacy-kicker-muted">Consagracao</p>
                            <p className="mt-2 text-2xl font-black text-white">{summary.crownEra?.label || 'Sem era dominante'}</p>
                        </div>
                        <div className="legacy-panel-soft p-5">
                            <p className="legacy-kicker legacy-kicker-muted">Registro</p>
                            <p className="mt-2 text-2xl font-black text-white">{summary.totalCycles} Ciclos - {summary.totalSealedMetas} Metas</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

LegacyExportKit.displayName = 'LegacyExportKit';
