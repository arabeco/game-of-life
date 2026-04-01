import React from 'react';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';

interface LegacyGrandPlaqueProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    className?: string;
    compact?: boolean;
    hideSovereignName?: boolean;
    portrait?: boolean;
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
    hideSovereignName = false,
    portrait = false,
}) => {
    const { totalCycles, totalHours, totalSealedMetas, weightedAverageScore, averageGrade } = buildLegacyPlaqueSummary(eras);
    const isCompact = compact;
    const showSovereignName = !(isCompact && hideSovereignName);
    const compactPaddingClass = portrait ? 'rounded-[11px] px-1 py-3' : 'rounded-[10px] px-2 py-2';
    const compactOuterFrameClass = portrait ? 'inset-[4px] rounded-[9px]' : 'inset-[4px] rounded-[8px]';
    const compactInnerFrameClass = portrait ? 'inset-[6px] rounded-[7px]' : 'inset-[8px] rounded-[6px]';
    const compactGapClass = portrait ? 'gap-2' : 'gap-1.5';
    const compactRowsClass = portrait ? 'space-y-1.5' : 'space-y-1';
    const compactRowClass = portrait ? 'rounded-[8px] px-1.5 py-1.75' : 'rounded-[7px] px-1.5 py-1';
    const compactRowGapClass = portrait ? 'gap-1.5' : 'gap-3';
    const compactMetricMinHeight = portrait ? 'min-h-[2.7rem]' : 'min-h-[2.15rem]';
    const compactLabelSize = portrait ? 'text-[4.5px]' : 'text-[5px]';
    const compactValueSize = portrait ? 'text-[0.76rem]' : 'text-[0.8rem]';
    const plaqueRows = [
        [
            { label: 'Ciclos', value: totalCycles },
            { label: 'Carga', value: `${Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h` },
        ],
        [
            { label: 'Metas', value: totalSealedMetas },
            { label: 'Patamar', value: averageGrade, detail: weightedAverageScore },
        ],
    ] as const;

    return (
        <section
            className={`relative overflow-visible ${isCompact ? compactPaddingClass : 'rounded-[18px] px-4 py-4'} ${className}`}
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
                className={`pointer-events-none absolute ${isCompact ? compactOuterFrameClass : 'inset-[8px] rounded-[14px]'}`}
                style={{
                    border: '1px solid rgba(225, 190, 109, 0.82)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,243,214,0.18)',
                }}
            />

            <div
                className={`pointer-events-none absolute ${isCompact ? compactInnerFrameClass : 'inset-[14px] rounded-[10px]'}`}
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04) 26%, rgba(201,230,248,0.12) 54%, rgba(255,255,255,0.06) 100%)',
                    opacity: 0.72,
                }}
            />

            <div className={`relative z-10 flex flex-col ${isCompact ? compactGapClass : 'gap-3'}`}>
                {showSovereignName && (
                    <>
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
                    </>
                )}

                <div className={`${isCompact ? compactRowsClass : 'space-y-1.5'}`}>
                    {plaqueRows.map((row, rowIndex) => (
                        <div
                            key={rowIndex}
                                className={`${isCompact ? compactRowClass : 'rounded-[10px] px-2.5 py-1.5'} grid grid-cols-2 ${isCompact ? compactRowGapClass : 'gap-3'}`}
                                style={{
                                    borderTop: '1px solid rgba(216,180,112,0.24)',
                                    borderBottom: '1px solid rgba(216,180,112,0.18)',
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(75,104,127,0.08))',
                                }}
                        >
                            {row.map((item, itemIndex) => (
                                <div
                                    key={item.label}
                                    className={`flex ${isCompact ? compactMetricMinHeight : 'min-h-[2.15rem]'} flex-col items-center justify-center gap-0.5 text-center ${itemIndex === 1 ? 'border-l pl-2' : ''}`}
                                    style={itemIndex === 1 ? { borderColor: 'rgba(216,180,112,0.18)' } : undefined}
                                >
                                    <p className={`${isCompact ? compactLabelSize : 'text-[6px]'} font-black uppercase tracking-[0.18em]`} style={etchedLabel}>
                                        {item.label}
                                    </p>
                                    {item.detail !== undefined ? (
                                        <div className="flex flex-col items-center justify-center leading-none">
                                            <p
                                                className={`${isCompact ? compactValueSize : 'text-[0.98rem]'} font-black`}
                                                style={{ ...etchedValue, fontFamily: 'var(--font-heading)' }}
                                            >
                                                {item.value}
                                            </p>
                                            <p
                                                className={`${isCompact ? 'mt-0.5 text-[0.7rem]' : 'mt-0.5 text-[0.8rem]'} font-black tracking-[0.03em]`}
                                                style={{ ...etchedValue, fontFamily: 'var(--font-heading)' }}
                                            >
                                                {item.detail}
                                            </p>
                                        </div>
                                    ) : (
                                        <p
                                            className={`${isCompact ? compactValueSize : 'text-[0.98rem]'} font-black`}
                                            style={{ ...etchedValue, fontFamily: 'var(--font-heading)' }}
                                        >
                                            {item.value}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
