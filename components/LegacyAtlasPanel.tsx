import React from 'react';
import { formatDate, getScoreGrade } from '../utils/dateUtils';
import { EraRibbon, getEraRibbonSkin } from './EraRibbon';
import { LegacyPlaqueArtifact } from './LegacyPlaqueArtifact';
import type { LegacyEraSummary } from './LegacyExportDocument';

interface LegacyAtlasPanelProps {
    eras: LegacyEraSummary[];
    onOpenEra: (era: LegacyEraSummary) => void;
    onOpenCycle: (cycleId: string) => void;
    onOpenPlaque: () => void;
    plaqueUnlocked: boolean;
    plaqueForged: boolean;
    sovereignName: string;
}

export const LegacyAtlasPanel: React.FC<LegacyAtlasPanelProps> = ({ eras, onOpenEra, onOpenCycle, onOpenPlaque, plaqueUnlocked, plaqueForged, sovereignName }) => {
    if (!eras.length) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-500">Atlas do Legado</p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-white">Linha historica continua das Eras</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-400">
                        Deslize horizontalmente pela memoria completa: Era por Era, ciclo por ciclo, sem quebrar a narrativa da trajetoria.
                    </p>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${plaqueUnlocked ? 'border-amber-300/30 bg-amber-400/10 text-amber-100' : 'border-white/10 bg-white/5 text-gray-500'}`}>
                    {plaqueUnlocked ? (plaqueForged ? 'Placa forjada' : 'Placa pronta para forja') : 'Placa bloqueada'}
                </div>
            </div>

            <div id="legacy-atlas-panel" className="hide-scrollbar overflow-x-auto pb-2">
                <div className="inline-flex min-w-full items-stretch gap-4">
                    {eras.map((era) => {
                        const skin = getEraRibbonSkin(era.skinId);
                        return (
                            <section
                                key={era.key || era.label}
                                className="flex min-w-[340px] max-w-[420px] shrink-0 gap-3 rounded-[28px] border p-4"
                                style={{
                                    borderColor: `${skin.edge}35`,
                                    backgroundImage: `linear-gradient(145deg, ${skin.baseTop}88 0%, rgba(0,0,0,0.72) 42%, ${skin.baseBottom}f2 100%)`,
                                    boxShadow: `0 18px 34px ${skin.baseBottom}55, inset 0 0 0 1px ${skin.glow}10`,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => onOpenEra(era)}
                                    className="group flex shrink-0 flex-col items-center gap-2"
                                    title="Abrir Era"
                                >
                                    <div className="h-full min-h-[220px] w-9 overflow-hidden rounded-sm">
                                        <EraRibbon label="" skinId={era.skinId} className="h-full w-full" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400 transition-colors group-hover:text-white">Editar</span>
                                </button>

                                <div className="min-w-0 flex-1 space-y-4">
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-[0.32em]" style={{ color: skin.edge }}>{era.label}</p>
                                                <p className="mt-2 text-sm font-black text-white">{formatDate(era.startDate)} - {formatDate(era.endDate)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black" style={{ color: era.color }}>{era.avgScore}</p>
                                                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">score</p>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs leading-relaxed text-gray-300">
                                            {era.finalSummary || era.description || era.aiSummary || 'Sem resumo final desta Era ainda.'}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                            <span>{era.cycles?.length || 0} ciclos</span>
                                            <span>{era.dominantArena || 'Sem foco'}</span>
                                        </div>
                                        <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
                                            {(era.cycles || []).map((cycle, index) => {
                                                const scoreInfo = getScoreGrade(cycle.score);
                                                return (
                                                    <button
                                                        key={cycle.id}
                                                        id={`legacy-atlas-cycle-${cycle.id}`}
                                                        type="button"
                                                        onClick={() => onOpenCycle(cycle.id)}
                                                        className="min-w-[156px] rounded-2xl border p-3 text-left transition-transform hover:-translate-y-0.5"
                                                        style={{
                                                            borderColor: `${skin.edge}30`,
                                                            backgroundColor: 'rgba(0,0,0,0.28)',
                                                            boxShadow: `inset 0 0 0 1px ${skin.glow}10`,
                                                        }}
                                                        title="Abrir relatorio do ciclo"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: skin.edge }}>
                                                                    {index === 0 ? 'Origem' : index === (era.cycles || []).length - 1 ? 'Fecho' : `C${index + 1}`}
                                                                </p>
                                                                <p className="mt-2 line-clamp-2 text-sm font-black leading-tight text-white">{cycle.name}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`text-xl font-black ${scoreInfo.color}`}>{scoreInfo.grade}</p>
                                                                <p className="text-[10px] text-gray-500">{cycle.score}</p>
                                                            </div>
                                                        </div>
                                                        <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-gray-500">
                                                            {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                                                        </p>
                                                        <div className="mt-3 space-y-1 text-[11px] text-gray-300">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-gray-500">Foco</span>
                                                                <span className="truncate text-right">{cycle.focusArena || 'Nenhuma'}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-gray-500">Ação-chave</span>
                                                                <span className="truncate text-right">{cycle.signatureAction || 'Nenhuma'}</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );
                    })}

                    <button
                        id="legacy-plaque-preview"
                        type="button"
                        onClick={onOpenPlaque}
                        disabled={!plaqueUnlocked}
                        className={`min-w-[380px] shrink-0 text-left transition-transform ${plaqueUnlocked ? 'hover:-translate-y-1' : 'cursor-not-allowed opacity-85'}`}
                        title={plaqueUnlocked ? (plaqueForged ? 'Abrir Placa do Legado' : 'Iniciar forja da placa') : 'Placa bloqueada'}
                    >
                        <LegacyPlaqueArtifact
                            eras={eras}
                            sovereignName={sovereignName}
                            plaqueUnlocked={plaqueUnlocked}
                            compact
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};
