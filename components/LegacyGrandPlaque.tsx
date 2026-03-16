import React from 'react';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';

interface LegacyGrandPlaqueProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    className?: string;
    compact?: boolean;
}

const etchedLabel: React.CSSProperties = {
    color: 'rgba(181, 136, 58, 0.98)',
    textShadow: '0 1px 0 rgba(255,250,234,0.18), 0 -1px 0 rgba(92,65,24,0.38)',
};

const etchedValue: React.CSSProperties = {
    color: 'rgba(58, 67, 78, 0.96)',
    textShadow: '0 1px 0 rgba(255,255,255,0.12), 0 -1px 0 rgba(8,20,34,0.12)',
};

export const LegacyGrandPlaque: React.FC<LegacyGrandPlaqueProps> = ({
    eras,
    sovereignName,
    className = '',
    compact = false,
}) => {
    const { totalCycles, totalHours, totalSealedMetas, weightedAverageScore, averageGrade } = buildLegacyPlaqueSummary(eras);
    const isCompact = compact;

    return (
        <section
            className={`relative overflow-visible ${isCompact ? 'rounded-[10px] px-2 py-2' : 'rounded-[18px] px-4 py-4'} ${className}`}
            style={{
                background: [
                    'radial-gradient(circle at 50% 8%, rgba(255,255,255,0.56), rgba(255,255,255,0.14) 26%, transparent 46%)',
                    'radial-gradient(circle at 18% 16%, rgba(233,246,255,0.48), transparent 32%)',
                    'linear-gradient(180deg, #f2fbff 0%, #d7efff 18%, #add7f0 40%, #7fb4d5 64%, #5d85a4 82%, #436178 100%)',
                ].join(', '),
                border: '1.5px solid rgba(217, 177, 95, 0.96)',
                boxShadow: [
                    '0 14px 28px rgba(0,0,0,0.18)',
                    '0 0 0 1px rgba(130, 93, 36, 0.24)',
                    'inset 0 0 0 1px rgba(255,248,225,0.28)',
                    'inset 0 14px 22px rgba(255,255,255,0.14)',
                    'inset 0 -14px 20px rgba(40,72,98,0.18)',
                ].join(', '),
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
            }}
        >
            <div
                className={`pointer-events-none absolute ${isCompact ? 'inset-[4px] rounded-[8px]' : 'inset-[8px] rounded-[14px]'}`}
                style={{
                    border: '1px solid rgba(225, 190, 109, 0.82)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,243,214,0.18)',
                }}
            />

            <div
                className={`pointer-events-none absolute ${isCompact ? 'inset-[8px] rounded-[6px]' : 'inset-[14px] rounded-[10px]'}`}
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04) 26%, rgba(201,230,248,0.12) 54%, rgba(255,255,255,0.06) 100%)',
                    opacity: 0.72,
                }}
            />

            <div className={`relative z-10 flex flex-col ${isCompact ? 'gap-1.5' : 'gap-3'}`}>
                <div className={`${isCompact ? 'pt-0.5' : 'pt-1'} text-center`}>
                    <p
                        className={`${isCompact ? 'text-[0.7rem] leading-[0.94] px-1' : 'text-[1.02rem] leading-none px-2'} block truncate font-black uppercase tracking-[0.02em]`}
                        style={{ ...etchedValue, fontFamily: 'var(--font-heading)' }}
                        title={sovereignName || 'Usuario'}
                    >
                        {sovereignName || 'Usuario'}
                    </p>
                </div>

                <div className="h-px bg-[linear-gradient(90deg,_transparent,_rgba(211,180,111,0.55),_transparent)]" />

                <div className={`${isCompact ? 'space-y-1' : 'space-y-1.5'}`}>
                    {[
                        [
                            ['Ciclos', totalCycles],
                            ['Carga', `${Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h`],
                        ],
                        [
                            ['Metas', totalSealedMetas],
                            ['Patamar', `${averageGrade} | ${weightedAverageScore}`],
                        ],
                    ].map((row, rowIndex) => (
                        <div
                            key={rowIndex}
                                className={`${isCompact ? 'rounded-[7px] px-1.5 py-1' : 'rounded-[10px] px-2.5 py-1.5'} grid grid-cols-2 gap-3`}
                                style={{
                                    borderTop: '1px solid rgba(216,180,112,0.24)',
                                    borderBottom: '1px solid rgba(216,180,112,0.18)',
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(75,104,127,0.08))',
                                }}
                        >
                            {row.map(([label, value], itemIndex) => (
                                <div
                                    key={String(label)}
                                    className={`flex min-h-[2.15rem] flex-col items-center justify-center gap-0.5 text-center ${itemIndex === 1 ? 'border-l pl-2' : ''}`}
                                    style={itemIndex === 1 ? { borderColor: 'rgba(216,180,112,0.18)' } : undefined}
                                >
                                    <p className={`${isCompact ? 'text-[4.5px]' : 'text-[6px]'} font-black uppercase tracking-[0.18em]`} style={etchedLabel}>
                                        {label}
                                    </p>
                                    <p
                                        className={`${isCompact ? 'text-[0.72rem]' : 'text-[0.98rem]'} font-black`}
                                        style={{ ...etchedValue, fontFamily: 'var(--font-heading)' }}
                                    >
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
