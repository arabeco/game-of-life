import React from 'react';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';

interface LegacyGrandPlaqueProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    className?: string;
    compact?: boolean;
    banner?: boolean;
    hideSovereignName?: boolean;
    portrait?: boolean;
}

const etchedLabel: React.CSSProperties = {
    color: 'rgba(149, 104, 26, 0.98)',
    textShadow: '0 1px 0 rgba(255,248,226,0.18), 0 -1px 0 rgba(78,54,16,0.36)',
};

const etchedValue: React.CSSProperties = {
    color: 'rgba(31, 43, 58, 0.98)',
    textShadow: '0 1px 0 rgba(255,255,255,0.1), 0 -1px 0 rgba(6,18,30,0.22)',
};

export const LegacyGrandPlaque: React.FC<LegacyGrandPlaqueProps> = ({
    eras,
    sovereignName,
    className = '',
    compact = false,
    banner = false,
    hideSovereignName = false,
    portrait = false,
}) => {
    const { totalCycles, totalHours, totalSealedMetas, weightedAverageScore, averageGrade } = buildLegacyPlaqueSummary(eras);
    const isCompact = compact;
    const showSovereignName = !(isCompact && hideSovereignName);
    const isBannerCompact = isCompact && banner && !portrait;
    const compactPaddingClass = portrait
        ? 'rounded-[11px] px-1.5 py-3'
        : isBannerCompact
            ? 'rounded-[10px] px-2 py-1.5'
            : 'rounded-[10px] px-2.5 py-2.5';
    const compactOuterFrameClass = portrait ? 'inset-[4px] rounded-[9px]' : 'inset-[4px] rounded-[8px]';
    const compactInnerFrameClass = portrait ? 'inset-[6px] rounded-[7px]' : isBannerCompact ? 'inset-[6px] rounded-[6px]' : 'inset-[8px] rounded-[6px]';
    const compactGapClass = portrait ? 'gap-2' : isBannerCompact ? 'gap-1' : 'gap-1.5';
    const compactRowsClass = portrait ? 'space-y-1.5' : isBannerCompact ? 'space-y-0.5' : 'space-y-1';
    const compactRowClass = portrait ? 'rounded-[8px] px-1.5 py-2' : isBannerCompact ? 'rounded-[7px] px-1.5 py-1' : 'rounded-[7px] px-2 py-1.5';
    const compactRowGapClass = portrait ? 'gap-1.5' : isBannerCompact ? 'gap-2' : 'gap-2.5';
    const compactMetricMinHeight = portrait ? 'min-h-[2.7rem]' : isBannerCompact ? 'min-h-[2.05rem]' : 'min-h-[2.45rem]';
    const compactMetricGapClass = isBannerCompact ? 'gap-0' : 'gap-0.5';
    const compactLabelSize = portrait ? 'text-[5px]' : isBannerCompact ? 'text-[9px]' : 'text-[6.5px]';
    const compactValueSize = portrait ? 'text-[0.82rem]' : isBannerCompact ? 'text-[1.32rem]' : 'text-[1rem]';
    const compactDetailSize = portrait ? 'text-[0.84rem]' : isBannerCompact ? 'text-[1.08rem]' : 'text-[0.84rem]';
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
                    'radial-gradient(circle at 50% 6%, rgba(255,255,255,0.24), rgba(255,255,255,0.05) 24%, transparent 42%)',
                    'radial-gradient(circle at 16% 14%, rgba(190,223,248,0.18), transparent 30%)',
                    'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(11,28,44,0.12) 58%, rgba(7,18,30,0.22) 100%)',
                    'linear-gradient(180deg, #d9edf8 0%, #bfdced 16%, #8bb5d1 38%, #5e84a3 62%, #3d5f79 82%, #25394d 100%)',
                ].join(', '),
                border: '1.5px solid rgba(217, 177, 95, 0.96)',
                boxShadow: [
                    '0 14px 28px rgba(0,0,0,0.2)',
                    '0 0 0 1px rgba(130, 93, 36, 0.24)',
                    'inset 0 0 0 1px rgba(255,248,225,0.18)',
                    'inset 0 10px 18px rgba(255,255,255,0.08)',
                    'inset 0 -16px 24px rgba(16,38,56,0.26)',
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
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03) 24%, rgba(120,160,190,0.08) 56%, rgba(255,255,255,0.04) 100%)',
                    opacity: 0.62,
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
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(55,88,114,0.1))',
                                }}
                        >
                            {row.map((item, itemIndex) => (
                                <div
                                    key={item.label}
                                    className={`flex ${isCompact ? compactMetricMinHeight : 'min-h-[2.15rem]'} ${isCompact ? compactMetricGapClass : 'gap-0.5'} flex-col items-center justify-center text-center ${itemIndex === 1 ? 'border-l pl-2' : ''}`}
                                    style={itemIndex === 1 ? { borderColor: 'rgba(216,180,112,0.18)' } : undefined}
                                >
                                    <p className={`${isCompact ? compactLabelSize : 'text-[6px]'} font-black uppercase leading-none tracking-[0.1em]`} style={etchedLabel}>
                                        {item.label}
                                    </p>
                                    {item.detail !== undefined ? (
                                        <div className="flex flex-col items-center justify-center leading-none">
                                            <p
                                                className={`${isCompact ? compactValueSize : 'text-[0.98rem]'} font-black leading-none`}
                                                style={{ ...etchedValue, fontFamily: 'var(--font-heading)' }}
                                            >
                                                {item.value}
                                            </p>
                                            <p
                                                className={`${isCompact ? `${isBannerCompact ? 'mt-0' : 'mt-0.5'} ${compactDetailSize}` : 'mt-0.5 text-[0.8rem]'} font-black leading-none tracking-[0.03em]`}
                                                style={{ ...etchedValue, fontFamily: 'var(--font-heading)' }}
                                            >
                                                {item.detail}
                                            </p>
                                        </div>
                                    ) : (
                                        <p
                                            className={`${isCompact ? compactValueSize : 'text-[0.98rem]'} font-black leading-none`}
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
