import React from 'react';
import type { LegacyRenderCycleDigest, LegacyRenderEraSummary } from '../types';
import { formatDate, getScoreGrade } from '../utils/dateUtils';
import { EraRibbon } from './EraRibbon';
import { LegacyPlaqueArtifact } from './LegacyPlaqueArtifact';
import './legacy-ui.css';

export type LegacyEraCycleDigest = LegacyRenderCycleDigest;

export type LegacyEraSummary = LegacyRenderEraSummary;

interface LegacyExportDocumentProps {
    id?: string;
    userName: string;
    generatedAt: string;
    eraSummaries: LegacyEraSummary[];
    totalCycles: number;
    historicalAverageScore: number;
    totalHistoricalHours: number;
    historyStartDate?: string;
    historyEndDate?: string;
}

const formatHours = (value: number) => {
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(1);
};

export const LegacyExportDocument: React.FC<LegacyExportDocumentProps> = ({
    id,
    userName,
    generatedAt,
    eraSummaries,
    totalCycles,
    historicalAverageScore,
    totalHistoricalHours,
    historyStartDate,
    historyEndDate,
}) => {
    const historicalGrade = getScoreGrade(Math.round(historicalAverageScore));

    return (
        <div id={id} className="w-[1040px] bg-[#050505] text-white p-8">
            <div className="rounded-[36px] border border-white/10 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_transparent_48%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))] shadow-[0_0_80px_rgba(0,0,0,0.55)]">
                <div className="p-8 border-b border-white/10">
                    <div className="flex items-start justify-between gap-8">
                        <div className="max-w-3xl">
                            <p className="text-[10px] uppercase tracking-[0.45em] font-black text-[var(--skin-accent-color)]">Glyph 1.003b</p>
                            <h1 className="text-5xl font-black tracking-tight mt-3">Registro de Soberania</h1>
                            <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                                Consolidado definitivo do legado construido no Glyph. Todas as Eras abaixo foram agrupadas a partir dos ciclos e relatorios reais da jornada.
                            </p>
                        </div>
                        <div className="legacy-panel-strong min-w-[220px] p-6 text-right">
                            <p className="legacy-kicker legacy-kicker-muted">Score medio historico</p>
                            <p className={`text-6xl font-black mt-3 ${historicalGrade.color}`}>{Math.round(historicalAverageScore)}</p>
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mt-2">Patamar {historicalGrade.grade}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-8">
                        <div className="legacy-panel-soft p-5">
                            <p className="legacy-kicker legacy-kicker-muted">Soberano</p>
                            <p className="text-2xl font-black mt-2 tracking-tight">{userName}</p>
                            <p className="text-xs text-gray-500 mt-2">{historyStartDate && historyEndDate ? `${formatDate(historyStartDate)} - ${formatDate(historyEndDate)}` : 'Sem periodo fechado'}</p>
                        </div>
                        <div className="legacy-panel-soft p-5">
                            <p className="legacy-kicker legacy-kicker-muted">Eras</p>
                            <p className="text-4xl font-black mt-2 tracking-tight">{eraSummaries.length}</p>
                            <p className="text-xs text-gray-500 mt-2">Segmentos historicos consolidados</p>
                        </div>
                        <div className="legacy-panel-soft p-5">
                            <p className="legacy-kicker legacy-kicker-muted">Ciclos</p>
                            <p className="text-4xl font-black mt-2 tracking-tight">{totalCycles}</p>
                            <p className="text-xs text-gray-500 mt-2">Base completa do legado</p>
                        </div>
                        <div className="legacy-panel-soft p-5">
                            <p className="legacy-kicker legacy-kicker-muted">Horas totais</p>
                            <p className="text-4xl font-black mt-2 tracking-tight">{formatHours(totalHistoricalHours)}</p>
                            <p className="text-xs text-gray-500 mt-2">Tempo investido em soberania</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {eraSummaries.map((era) => (
                        <section key={era.key || era.label} className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] overflow-hidden">
                            <div className="px-8 py-7 border-b border-white/10" style={{ background: `linear-gradient(135deg, ${era.color}1F 0%, rgba(0,0,0,0.12) 55%, rgba(0,0,0,0.3) 100%)` }}>
                                <div className="flex items-start justify-between gap-8">
                                    <div className="flex items-start gap-5">
                                        <div className="h-28 shrink-0">
                                            <EraRibbon label="" skinId={era.skinId} className="h-full" />
                                        </div>
                                        <div>
                                            <p className="legacy-kicker legacy-kicker-soft">{era.label}</p>
                                            <h2 className="text-3xl font-black tracking-tight mt-2">{formatDate(era.startDate)} - {formatDate(era.endDate)}</h2>
                                            <p className="text-sm text-gray-300 mt-2">{era.cycleCount} ciclos consolidados neste periodo.</p>
                                            {era.finalSummary && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-200">{era.finalSummary}</p>}
                                        </div>
                                    </div>
                                    <div className="min-w-[180px] rounded-[24px] border p-5 text-right" style={{ borderColor: `${era.color}55`, backgroundColor: `${era.color}12` }}>
                                        <p className="legacy-kicker legacy-kicker-soft">Score medio</p>
                                        <p className="text-5xl font-black mt-3" style={{ color: era.color }}>{era.avgScore}</p>
                                        <p className="text-xs uppercase tracking-[0.25em] text-gray-300 mt-2">Patamar {era.grade}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="legacy-stat-card p-5">
                                        <p className="legacy-kicker legacy-kicker-muted">Horas totais</p>
                                        <p className="text-3xl font-black mt-2 tracking-tight">{formatHours(era.totalHours)}</p>
                                    </div>
                                    <div className="legacy-stat-card p-5">
                                        <p className="legacy-kicker legacy-kicker-muted">Arena dominante</p>
                                        <p className="text-lg font-black mt-2 tracking-tight leading-tight">{era.dominantArena}</p>
                                    </div>
                                    <div className="legacy-stat-card p-5">
                                        <p className="legacy-kicker legacy-kicker-muted">Melhor streak</p>
                                        <p className="text-3xl font-black mt-2 tracking-tight">{era.bestStreak}</p>
                                        <p className="text-xs text-gray-500 mt-2">dias seguidos de execucao</p>
                                    </div>
                                    <div className="legacy-stat-card p-5">
                                        <p className="legacy-kicker legacy-kicker-muted">Ação-chave da Era</p>
                                        <p className="text-lg font-black mt-2 tracking-tight">{era.topActions[0]?.name || 'Sem acao dominante'}</p>
                                        <p className="text-xs text-gray-500 mt-2">acao mais recorrente do periodo</p>
                                    </div>
                                </div>

                                {(era.description || era.aiSummary) && (
                                    <div className="legacy-panel-soft p-6">
                                        <p className="legacy-kicker legacy-kicker-muted">Leitura da Era</p>
                                        <p className="mt-3 text-sm leading-relaxed text-gray-300">{era.description || era.aiSummary}</p>
                                    </div>
                                )}

                                <div className="legacy-panel-soft p-6">
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div>
                                            <p className="legacy-kicker legacy-kicker-muted">Acoes dominantes</p>
                                            <p className="text-sm text-gray-400 mt-1">As tres acoes que mais definiram esta fase.</p>
                                        </div>
                                        <p className="text-xs text-gray-500">Registro consolidado da {era.label.toLowerCase()}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        {era.topActions.length > 0 ? era.topActions.map((action, actionIndex) => (
                                            <div key={`${era.key || era.label}-${action.name}`} className="rounded-[20px] border border-white/10 bg-white/[0.02] p-5">
                                                <p className="legacy-kicker legacy-kicker-muted">{['I', 'II', 'III'][actionIndex] || 'IV'}</p>
                                                <p className="text-lg font-black mt-3 leading-tight min-h-[56px]">{action.name}</p>
                                                <p className="text-3xl font-black mt-4" style={{ color: era.color }}>{action.count}</p>
                                                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mt-1">repeticoes</p>
                                            </div>
                                        )) : (
                                            <div className="col-span-3 rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-gray-500">
                                                Nenhuma acao dominante registrada nesta Era.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                <div className="px-8 pb-8">
                    <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] overflow-hidden">
                        <div className="px-8 py-7 border-b border-white/10 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_44%),linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))]">
                            <p className="legacy-kicker legacy-kicker-soft">Artefato final</p>
                            <h2 className="mt-3 text-3xl font-black tracking-tight">Placa do Legado</h2>
                            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300">
                                Condensacao final da jornada. Esta placa grava em pedra os quatro sinais centrais do legado: ciclos, carga, metas seladas e patamar medio.
                            </p>
                        </div>
                        <div className="p-8">
                            <LegacyPlaqueArtifact
                                eras={eraSummaries}
                                sovereignName={userName}
                                plaqueUnlocked={true}
                            />
                        </div>
                    </section>
                </div>

                <div className="px-8 py-6 border-t border-white/10 bg-black/30 flex items-end justify-between gap-6">
                    <div>
                        <p className="legacy-kicker legacy-kicker-muted">Memoria final</p>
                        <p className="text-sm text-gray-300 mt-2 max-w-2xl">
                            Se o app desaparecer, este registro continua como prova visual da sua trajetoria: eras, ciclos, carga, metas e o patamar medio que sustentou seu sistema pessoal.
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="legacy-kicker legacy-kicker-muted">Emitido em</p>
                        <p className="text-sm text-white mt-2">{generatedAt}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};







