import React from 'react';
import type { LegacyEraSummary } from './LegacyExportDocument';

interface LegacyPlaqueArtifactProps {
    id?: string;
    eras: LegacyEraSummary[];
    sovereignName: string;
    plaqueUnlocked: boolean;
    className?: string;
    compact?: boolean;
}

const ENGRAVED_LABEL_STYLE: React.CSSProperties = {
    color: '#2c2823',
    textShadow: '0 1px 0 rgba(255,255,255,0.12), 0 -1px 0 rgba(0,0,0,0.35)',
};

const ENGRAVED_VALUE_STYLE: React.CSSProperties = {
    color: '#1f1b17',
    textShadow: '0 1px 0 rgba(255,255,255,0.1), 0 -1px 0 rgba(0,0,0,0.42)',
};

export const buildLegacyPlaqueSummary = (eras: LegacyEraSummary[]) => {
    const totalCycles = eras.reduce((sum, era) => sum + (era.cycleCount || 0), 0);
    const totalHours = eras.reduce((sum, era) => sum + (era.totalHours || 0), 0);
    const weightedAverageScore = totalCycles > 0
        ? Math.round(eras.reduce((sum, era) => sum + (era.avgScore * Math.max(era.cycleCount || 1, 1)), 0) / totalCycles)
        : 0;
    const crownEra = [...eras].sort((a, b) => (b.avgScore - a.avgScore) || (b.totalHours - a.totalHours))[0] || null;
    const plaqueInscription = crownEra?.finalSummary || crownEra?.description || crownEra?.aiSummary || `Trajetoria forjada em ${eras.length} eras e ${totalCycles} ciclos.`;

    return {
        totalCycles,
        totalHours,
        weightedAverageScore,
        crownEra,
        plaqueInscription,
    };
};

export const LegacyPlaqueArtifact: React.FC<LegacyPlaqueArtifactProps> = ({
    id,
    eras,
    sovereignName,
    plaqueUnlocked,
    className = '',
    compact = false,
}) => {
    const { totalCycles, totalHours, weightedAverageScore, crownEra, plaqueInscription } = buildLegacyPlaqueSummary(eras);
    const framePadding = compact ? 'p-5' : 'p-7';
    const titleSize = compact ? 'text-3xl' : 'text-4xl';
    const coinSize = compact ? 'h-24 w-24' : 'h-28 w-28';
    const innerCoinSize = compact ? 'h-16 w-16' : 'h-20 w-20';
    const metricsText = compact ? 'text-3xl' : 'text-[2.1rem]';

    return (
        <section
            id={id}
            className={`relative overflow-hidden rounded-[34px] border ${framePadding} ${className}`}
            style={{
                borderColor: plaqueUnlocked ? 'rgba(216,195,160,0.34)' : 'rgba(152,145,132,0.28)',
                background: 'linear-gradient(145deg, #8f8576 0%, #6d655b 22%, #948a7d 42%, #5b544b 64%, #3b352f 100%)',
                boxShadow: plaqueUnlocked
                    ? '0 24px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 8px rgba(0,0,0,0.36)'
                    : '0 18px 30px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 8px rgba(0,0,0,0.3)',
            }}
        >
            <div
                className="pointer-events-none absolute inset-[10px] rounded-[26px] border"
                style={{ borderColor: plaqueUnlocked ? 'rgba(241,225,188,0.18)' : 'rgba(255,255,255,0.08)' }}
            />
            <div
                className="pointer-events-none absolute inset-0 opacity-55"
                style={{
                    backgroundImage: 'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.14), transparent 18%), radial-gradient(circle at 78% 70%, rgba(0,0,0,0.18), transparent 22%), repeating-linear-gradient(132deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px), repeating-linear-gradient(28deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 9px)',
                }}
            />
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" viewBox="0 0 380 500" preserveAspectRatio="none" aria-hidden="true">
                <path d="M42 98 C78 106, 94 128, 102 168" stroke="rgba(38,32,28,0.35)" strokeWidth="2.2" fill="none" />
                <path d="M304 74 C282 112, 274 146, 258 174" stroke="rgba(255,255,255,0.08)" strokeWidth="1.4" fill="none" />
                <path d="M310 286 C286 304, 280 336, 270 380" stroke="rgba(40,34,29,0.34)" strokeWidth="2.1" fill="none" />
                <path d="M70 372 C106 350, 122 322, 148 292" stroke="rgba(255,255,255,0.06)" strokeWidth="1.4" fill="none" />
            </svg>
            <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 rounded-full border" style={{ borderColor: 'rgba(58,50,44,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }} />
            <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 rounded-full border" style={{ borderColor: 'rgba(58,50,44,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }} />
            <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 rounded-full border" style={{ borderColor: 'rgba(58,50,44,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }} />
            <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 rounded-full border" style={{ borderColor: 'rgba(58,50,44,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }} />

            <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                <div className="space-y-4">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.34em]" style={ENGRAVED_LABEL_STYLE}>Placa do Legado</p>
                        <h4 className={`mt-3 font-black tracking-[0.08em] uppercase ${titleSize}`} style={ENGRAVED_VALUE_STYLE}>Registro Forjado</h4>
                        <p className="mt-2 text-xs font-black uppercase tracking-[0.28em]" style={ENGRAVED_LABEL_STYLE}>{sovereignName}</p>
                    </div>

                    <div className={`mx-auto flex items-center justify-center rounded-full border ${coinSize}`} style={{ borderColor: 'rgba(58,50,44,0.26)', boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.14), inset 0 -6px 12px rgba(0,0,0,0.24)' }}>
                        <div className={`flex items-center justify-center rounded-full border ${innerCoinSize}`} style={{ borderColor: 'rgba(58,50,44,0.28)', background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), rgba(0,0,0,0.14))' }}>
                            <span className="text-lg font-black uppercase tracking-[0.36em]" style={ENGRAVED_VALUE_STYLE}>GL</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-[24px] border p-4" style={{ borderColor: 'rgba(58,50,44,0.22)', background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.05))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -4px 8px rgba(0,0,0,0.18)' }}>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Eras</p>
                            <p className={`mt-2 font-black ${metricsText}`} style={ENGRAVED_VALUE_STYLE}>{eras.length}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Ciclos</p>
                            <p className={`mt-2 font-black ${metricsText}`} style={ENGRAVED_VALUE_STYLE}>{totalCycles}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Score</p>
                            <p className={`mt-2 font-black ${compact ? 'text-2xl' : 'text-3xl'}`} style={ENGRAVED_VALUE_STYLE}>{weightedAverageScore}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Horas</p>
                            <p className={`mt-2 font-black ${compact ? 'text-2xl' : 'text-3xl'}`} style={ENGRAVED_VALUE_STYLE}>{Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 rounded-[24px] border p-4" style={{ borderColor: 'rgba(58,50,44,0.22)', background: 'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(0,0,0,0.05))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -4px 8px rgba(0,0,0,0.18)' }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Era de consagracao</p>
                        <p className="mt-2 text-lg font-black leading-tight uppercase" style={ENGRAVED_VALUE_STYLE}>{crownEra?.label || 'Sem era dominante'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Inscricao</p>
                        <p className="mt-2 text-sm leading-relaxed" style={ENGRAVED_VALUE_STYLE}>{plaqueInscription}</p>
                    </div>
                    <div className="rounded-2xl border px-3 py-2 text-center" style={{ borderColor: plaqueUnlocked ? 'rgba(128,108,80,0.24)' : 'rgba(74,66,58,0.18)', background: plaqueUnlocked ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Estado</p>
                        <p className="mt-1 text-sm font-black uppercase" style={ENGRAVED_VALUE_STYLE}>{plaqueUnlocked ? 'Pronta para o ritual' : 'Em observacao'}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};
