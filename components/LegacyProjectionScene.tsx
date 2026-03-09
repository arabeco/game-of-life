import React from 'react';
import { formatDate, getScoreGrade } from '../utils/dateUtils';
import { EraRibbon, getEraRibbonSkin } from './EraRibbon';
import { LegacyPlaqueArtifact } from './LegacyPlaqueArtifact';
import { MiniCyclePlannerSnapshot } from './MiniCyclePlannerSnapshot';
import type { LegacyEraSummary } from './LegacyExportDocument';

interface LegacyProjectionSceneProps {
    id?: string;
    eras: LegacyEraSummary[];
    sovereignName: string;
    projectionActive?: boolean;
    interactive?: boolean;
    onActivatePlaque?: () => void;
    onOpenCycle?: (cycleId: string) => void;
    onOpenEra?: (era: LegacyEraSummary) => void;
}

export const LegacyProjectionScene: React.FC<LegacyProjectionSceneProps> = ({
    id,
    eras,
    sovereignName,
    projectionActive = true,
    interactive = false,
    onActivatePlaque,
    onOpenCycle,
    onOpenEra,
}) => {
    if (!eras.length) return null;

    const timelineVisible = !interactive || projectionActive;

    const plaqueBlock = (
        <>
            <div>
                <LegacyPlaqueArtifact
                    eras={eras}
                    sovereignName={sovereignName}
                    plaqueUnlocked={true}
                    compact={!interactive}
                />
            </div>
            {interactive && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                        {projectionActive ? 'Placa ativa' : 'Clique na placa para projetar o legado'}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-300">
                        {projectionActive
                            ? 'A linha do tempo foi aberta. Agora voce pode atravessar eras e ciclos na horizontal.'
                            : 'Ela tremula, grava o resumo total e libera a linha horizontal com as Eras, os ciclos e o mini planner de cada fase.'}
                    </p>
                </div>
            )}
        </>
    );

    return (
        <section
            id={id}
            className={`rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.1),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.015))] p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.42)] ${interactive ? 'w-full' : 'w-max min-w-[1520px]'}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--skin-accent-color)]">Legado Projetado</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight">Linha viva da trajetoria</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
                        A placa condensa o resumo total. A projecao percorre Era por Era, ciclo por ciclo, mantendo a memoria do planner em miniatura sob cada fase fechada.
                    </p>
                </div>
                <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
                    {eras.length} eras
                </div>
            </div>

            <div className={`mt-6 ${interactive ? 'overflow-x-auto pb-2 hide-scrollbar' : 'overflow-visible'}`}>
                <div className={`inline-flex min-w-full items-start gap-6 ${interactive ? '' : 'w-max'}`}>
                    {interactive ? (
                        <button
                            type="button"
                            onClick={onActivatePlaque}
                            className={`relative w-[380px] shrink-0 cursor-pointer text-left transition-all duration-500 ${!projectionActive ? 'hover:-translate-y-1' : ''}`}
                        >
                            {plaqueBlock}
                        </button>
                    ) : (
                        <div className="relative w-[420px] shrink-0 text-left">
                            {plaqueBlock}
                        </div>
                    )}

                    <div className={`relative min-w-0 flex-1 transition-all duration-500 ${timelineVisible ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-8 opacity-0'}`}>
                        <div className="absolute left-0 right-0 top-[68px] h-px bg-[linear-gradient(90deg,_rgba(212,175,55,0.55),_rgba(212,175,55,0.12))]" />
                        <div className="relative inline-flex min-w-full items-start gap-8 pl-2 pt-10">
                            {eras.map((era, eraIndex) => {
                                const skin = getEraRibbonSkin(era.skinId);
                                return (
                                    <div key={era.key || era.label} className="relative flex shrink-0 gap-4">
                                        {eraIndex > 0 && (
                                            <div className="absolute -left-4 bottom-0 top-0 flex w-8 flex-col items-center justify-start">
                                                <div className="mt-[58px] h-8 w-px bg-[var(--skin-accent-color)]/50" />
                                                <div className="mt-2 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-gray-400">
                                                    Nova Era
                                                </div>
                                                <div className="mt-2 w-px flex-1 bg-white/10" />
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => onOpenEra?.(era)}
                                            className={`group flex shrink-0 flex-col items-center gap-2 ${onOpenEra ? 'cursor-pointer' : 'cursor-default'}`}
                                            title="Abrir Era"
                                        >
                                            <div className="h-[280px] w-10 overflow-hidden rounded-sm">
                                                <EraRibbon label="" skinId={era.skinId} className="h-full w-full" />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 transition-colors group-hover:text-white">{era.label}</span>
                                        </button>

                                        <div className="space-y-4">
                                            <div
                                                className="rounded-[28px] border px-5 py-4"
                                                style={{
                                                    borderColor: `${skin.edge}35`,
                                                    background: `linear-gradient(145deg, ${skin.baseTop}88 0%, rgba(0,0,0,0.58) 48%, ${skin.baseBottom}f2 100%)`,
                                                    boxShadow: `0 18px 34px ${skin.baseBottom}55`,
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: skin.edge }}>{era.label}</p>
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
                                                    const cycleContent = (
                                                        <>
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: skin.edge }}>
                                                                        {cycleIndex === 0 ? 'Origem' : cycleIndex === (era.cycles || []).length - 1 ? 'Fecho' : `C${cycleIndex + 1}`}
                                                                    </p>
                                                                    <h4 className="mt-2 line-clamp-2 text-sm font-black leading-tight text-white">{cycle.name}</h4>
                                                                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gray-500">{formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`text-2xl font-black ${scoreInfo.color}`}>{scoreInfo.grade}</p>
                                                                    <p className="text-[10px] text-gray-500">{cycle.score}</p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 space-y-1 text-[11px] text-gray-300">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-gray-500">Foco</span>
                                                                    <span className="truncate text-right">{cycle.focusArena || 'Nenhuma'}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="text-gray-500">Assinatura</span>
                                                                    <span className="truncate text-right">{cycle.signatureAction || 'Nenhuma'}</span>
                                                                </div>
                                                            </div>
                                                            <MiniCyclePlannerSnapshot weeks={cycle.weeklyAtlas || []} accentColor={skin.edge} className="mt-4" />
                                                        </>
                                                    );

                                                    if (onOpenCycle) {
                                                        return (
                                                            <button
                                                                key={cycle.id}
                                                                type="button"
                                                                onClick={() => onOpenCycle(cycle.id)}
                                                                className="w-[290px] shrink-0 rounded-[26px] border border-white/10 bg-black/35 p-4 text-left shadow-[0_18px_30px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-1"
                                                            >
                                                                {cycleContent}
                                                            </button>
                                                        );
                                                    }

                                                    return (
                                                        <div key={cycle.id} className="w-[290px] shrink-0 rounded-[26px] border border-white/10 bg-black/35 p-4 shadow-[0_18px_30px_rgba(0,0,0,0.28)]">
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
            </div>
        </section>
    );
};
