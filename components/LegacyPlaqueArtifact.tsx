import React from 'react';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { getScoreGrade } from '../utils/dateUtils';

interface LegacyPlaqueArtifactProps {
    id?: string;
    eras: LegacyEraSummary[];
    sovereignName: string;
    plaqueUnlocked: boolean;
    className?: string;
    compact?: boolean;
    subdued?: boolean;
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
    const totalExp = eras.reduce((sum, era) => sum + (era.totalExp || 0), 0);
    const totalSealedMetas = eras.reduce((sum, era) => {
        if (Number.isFinite(era.totalMetas)) return sum + (era.totalMetas || 0);
        return sum + ((era.cycles || []).reduce((cycleSum, cycle) => cycleSum + (cycle.sealedMetas || 0), 0));
    }, 0);
    const totalActions = eras.reduce((sum, era) => (
        sum + (era.cycles || []).reduce((cycleSum, cycle) => (
            cycleSum + (cycle.weeklyAtlas || []).reduce((weekSum, week) => weekSum + (week.completedCount || 0), 0)
        ), 0)
    ), 0);
    const activeDays = new Set(
        eras.flatMap((era) => (
            era.cycles || []
        ).flatMap((cycle) => (
            cycle.weeklyAtlas || []
        ).flatMap((week) => week.days || [])
            .filter((day) => (day.completedCount || 0) > 0 || (day.plannedCount || 0) > 0)
            .map((day) => day.date))
    )).size;
    const weightedAverageScore = totalCycles > 0
        ? Math.round(eras.reduce((sum, era) => sum + (era.avgScore * Math.max(era.cycleCount || 1, 1)), 0) / totalCycles)
        : 0;
    const averageGrade = getScoreGrade(weightedAverageScore).grade;
    const crownEra = [...eras].sort((a, b) => (b.avgScore - a.avgScore) || (b.totalHours - a.totalHours))[0] || null;
    const plaqueInscription = crownEra?.finalSummary || crownEra?.description || crownEra?.aiSummary || `Trajetoria forjada em ${totalCycles} ciclos, ${Math.round(totalHours)}h e ${totalSealedMetas} metas seladas.`;

    return {
        totalCycles,
        totalHours,
        totalExp,
        totalSealedMetas,
        totalActions,
        activeDays,
        weightedAverageScore,
        averageGrade,
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
    subdued = false,
}) => {
    const { totalCycles, totalHours, totalSealedMetas, weightedAverageScore, averageGrade } = buildLegacyPlaqueSummary(eras);
    const isCompact = compact || subdued;
    const framePadding = subdued ? 'p-4' : compact ? 'p-5' : 'p-7';
    const coinSize = subdued ? 'h-16 w-16' : compact ? 'h-24 w-24' : 'h-28 w-28';
    const innerCoinSize = subdued ? 'h-11 w-11' : compact ? 'h-16 w-16' : 'h-20 w-20';
    const metricsText = subdued ? 'text-[1.2rem]' : compact ? 'text-2xl' : 'text-[2rem]';
    const minorMetricText = subdued ? 'text-[1.15rem]' : compact ? 'text-2xl' : 'text-3xl';
    const sectionGap = subdued ? 'gap-3' : 'gap-6';
    const contentGap = subdued ? 'space-y-3' : 'space-y-5';
    const metricCardPadding = subdued ? 'p-3' : 'p-4';
    const metricGridGap = subdued ? 'gap-2.5' : 'gap-3';

    return (
        <section
            id={id}
            className={`relative overflow-hidden ${subdued ? 'rounded-[26px]' : 'rounded-[34px]'} border ${framePadding} ${className}`}
            style={{
                borderColor: plaqueUnlocked ? 'rgba(216,195,160,0.34)' : 'rgba(152,145,132,0.28)',
                background: 'linear-gradient(145deg, #8f8576 0%, #6d655b 22%, #948a7d 42%, #5b544b 64%, #3b352f 100%)',
                boxShadow: plaqueUnlocked
                    ? '0 24px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 8px rgba(0,0,0,0.36)'
                    : '0 18px 30px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -2px 8px rgba(0,0,0,0.3)',
            }}
        >
            <div
                className={`pointer-events-none absolute border ${subdued ? 'inset-[8px] rounded-[18px]' : 'inset-[10px] rounded-[26px]'}`}
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
            {!subdued && (
                <>
                    <div className="pointer-events-none absolute left-5 top-5 h-8 w-8 rounded-full border" style={{ borderColor: 'rgba(58,50,44,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }} />
                    <div className="pointer-events-none absolute right-5 top-5 h-8 w-8 rounded-full border" style={{ borderColor: 'rgba(58,50,44,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }} />
                    <div className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 rounded-full border" style={{ borderColor: 'rgba(58,50,44,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }} />
                    <div className="pointer-events-none absolute bottom-5 right-5 h-8 w-8 rounded-full border" style={{ borderColor: 'rgba(58,50,44,0.22)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }} />
                </>
            )}

            <div className={`relative z-10 flex h-full flex-col justify-between ${sectionGap}`}>
                <div className={contentGap}>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.34em]" style={ENGRAVED_LABEL_STYLE}>Placa do Legado</p>
                        <p className={`${subdued ? 'mt-1.5 text-[11px] tracking-[0.22em]' : 'mt-2 text-xs tracking-[0.28em]'} font-black uppercase`} style={ENGRAVED_LABEL_STYLE}>{sovereignName}</p>
                    </div>

                    <div className={`mx-auto flex items-center justify-center rounded-full border ${coinSize}`} style={{ borderColor: 'rgba(58,50,44,0.26)', boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.14), inset 0 -6px 12px rgba(0,0,0,0.24)' }}>
                        <div className={`flex items-center justify-center rounded-full border ${innerCoinSize}`} style={{ borderColor: 'rgba(58,50,44,0.28)', background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), rgba(0,0,0,0.14))' }}>
                            <span className={`${subdued ? 'text-[11px] tracking-[0.28em]' : 'text-lg tracking-[0.36em]'} font-black uppercase`} style={ENGRAVED_VALUE_STYLE}>GL</span>
                        </div>
                    </div>

                    <div className={`grid grid-cols-2 ${metricGridGap} ${subdued ? 'rounded-[18px]' : 'rounded-[24px]'} border ${metricCardPadding}`} style={{ borderColor: 'rgba(58,50,44,0.22)', background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.05))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -4px 8px rgba(0,0,0,0.18)' }}>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Ciclos</p>
                            <p className={`mt-2 font-black ${metricsText}`} style={ENGRAVED_VALUE_STYLE}>{totalCycles}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Carga</p>
                            <p className={`mt-2 font-black ${metricsText}`} style={ENGRAVED_VALUE_STYLE}>{Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Metas</p>
                            <p className={`mt-2 font-black ${minorMetricText}`} style={ENGRAVED_VALUE_STYLE}>{totalSealedMetas}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={ENGRAVED_LABEL_STYLE}>Patamar</p>
                            <p className={`mt-2 font-black ${minorMetricText}`} style={ENGRAVED_VALUE_STYLE}>{averageGrade} | {weightedAverageScore}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
