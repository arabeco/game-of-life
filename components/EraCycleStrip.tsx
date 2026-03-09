import React from 'react';
import { formatDate, getScoreGrade } from '../utils/dateUtils';
import { getEraRibbonSkin } from './EraRibbon';
import type { LegacyEraCycleDigest } from './LegacyExportDocument';

interface EraCycleStripProps {
    cycles: LegacyEraCycleDigest[];
    skinId?: string;
    eraLabel: string;
}

export const EraCycleStrip: React.FC<EraCycleStripProps> = ({ cycles, skinId, eraLabel }) => {
    const skin = getEraRibbonSkin(skinId);

    if (!cycles.length) {
        return (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-500">
                Sem ciclos suficientes para montar a cartografia desta Era.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Cartografia da Era</p>
                    <p className="mt-1 text-sm text-gray-400">Faixa horizontal dos ciclos da {eraLabel.toLowerCase()}.</p>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: skin.edge }}>
                    {cycles.length} ciclos
                </div>
            </div>

            <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
                {cycles.map((cycle, index) => {
                    const scoreInfo = getScoreGrade(cycle.score);
                    const isFirst = index === 0;
                    const isLast = index === cycles.length - 1;
                    return (
                        <div
                            key={cycle.id}
                            className="relative min-w-[176px] rounded-2xl border p-4"
                            style={{
                                borderColor: `${skin.edge}40`,
                                backgroundImage: `linear-gradient(160deg, ${skin.baseTop}99 0%, rgba(0,0,0,0.75) 62%, ${skin.baseBottom}ee 100%)`,
                                boxShadow: `0 10px 24px ${skin.baseBottom}66, inset 0 0 0 1px ${skin.glow}10`,
                            }}
                        >
                            <div className="pointer-events-none absolute inset-x-4 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent 0%, ${skin.glow} 50%, transparent 100%)` }} />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: skin.edge }}>
                                        {isFirst ? 'Origem' : isLast ? 'Fecho' : `Ciclo ${index + 1}`}
                                    </p>
                                    <h4 className="mt-2 text-sm font-black leading-tight text-white">{cycle.name}</h4>
                                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-gray-400">
                                        {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-2xl font-black ${scoreInfo.color}`}>{scoreInfo.grade}</p>
                                    <p className="text-[10px] text-gray-500">{cycle.score}</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 text-xs text-gray-300">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-gray-500">Foco</span>
                                    <span className="truncate text-right">{cycle.focusArena || 'Nenhuma'}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-gray-500">Assinatura</span>
                                    <span className="truncate text-right">{cycle.signatureAction || 'Nenhuma'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

