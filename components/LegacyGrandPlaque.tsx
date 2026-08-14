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
    const { totalCycles, totalHours, weightedAverageScore, averageGrade } = buildLegacyPlaqueSummary(eras);
    const formattedHours = `${Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h`;

    if (portrait) {
        return (
            <section
                className={`relative min-h-[132px] overflow-hidden rounded-[14px] px-3 pb-3 pt-3 ${className}`}
                style={{
                    background: [
                        'radial-gradient(circle at 50% 0%, rgba(255,246,196,0.34), transparent 34%)',
                        'linear-gradient(150deg, rgba(255,255,255,0.16), transparent 34%, rgba(7,24,40,0.2) 72%)',
                        'linear-gradient(180deg, #d9edf7 0%, #91bad2 34%, #496f8b 70%, #243b50 100%)',
                    ].join(', '),
                    border: '1.5px solid rgba(232, 193, 101, 0.98)',
                    boxShadow: [
                        '0 16px 30px rgba(0,0,0,0.28)',
                        '0 0 0 1px rgba(110,76,24,0.32)',
                        'inset 0 1px 0 rgba(255,255,255,0.42)',
                        'inset 0 -18px 28px rgba(7,22,36,0.3)',
                    ].join(', '),
                }}
            >
                <div className="pointer-events-none absolute inset-[4px] rounded-[11px] border border-amber-200/60" />
                <div className="pointer-events-none absolute inset-[7px] rounded-[8px] border border-white/16" />
                <div className="pointer-events-none absolute left-1/2 top-0 h-16 w-20 -translate-x-1/2 rounded-full bg-white/12 blur-xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-1.5">
                        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-700/55" />
                        <span className="text-[5px] font-black uppercase tracking-[0.24em] text-amber-900/85">Legado</span>
                        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-700/55" />
                    </div>

                    <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
                        <div className="flex min-w-0 flex-col items-center justify-center">
                            <span className="text-[6px] font-black uppercase tracking-[0.12em] text-amber-900/90">Média</span>
                            <strong className="mt-1 text-[1.72rem] font-black leading-none tabular-nums text-[#13283b] drop-shadow-[0_1px_0_rgba(255,255,255,0.26)]">
                                {weightedAverageScore}
                            </strong>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            <span className="h-12 w-px bg-gradient-to-b from-transparent via-amber-800/48 to-transparent" />
                        </div>

                        <div className="flex min-w-0 flex-col items-center justify-center">
                            <span className="text-[6px] font-black uppercase tracking-[0.12em] text-amber-900/90">Patamar</span>
                            <strong className="mt-1 text-[1.72rem] font-black leading-none text-[#13283b] drop-shadow-[0_1px_0_rgba(255,255,255,0.26)]">
                                {averageGrade}
                            </strong>
                        </div>
                    </div>

                    <div className="mx-auto mt-2 h-px w-[86%] bg-gradient-to-r from-transparent via-amber-700/50 to-transparent" />
                    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center rounded-[8px] border border-white/12 bg-[#142a3b]/38 px-2 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <span className="flex flex-col items-center justify-center">
                            <span className="text-[5px] font-black uppercase tracking-[0.12em] text-sky-100/72">Ciclos</span>
                            <strong className="mt-0.5 text-[9px] font-black leading-none tabular-nums text-white">{totalCycles}</strong>
                        </span>
                        <span className="mx-1 h-5 w-px bg-gradient-to-b from-transparent via-amber-300/55 to-transparent" />
                        <span className="flex flex-col items-center justify-center">
                            <span className="text-[5px] font-black uppercase tracking-[0.12em] text-sky-100/72">Carga</span>
                            <strong className="mt-0.5 text-[9px] font-black leading-none tabular-nums text-white">{formattedHours}</strong>
                        </span>
                    </div>
                </div>
            </section>
        );
    }

    const isCompact = compact;
    const showSovereignName = !(isCompact && hideSovereignName);
    const isBannerCompact = isCompact && banner && !portrait;
    const compactPaddingClass = portrait
        ? 'rounded-[11px] px-2 py-2.5'
        : isBannerCompact
            ? 'rounded-[10px] px-2 py-1.5'
            : 'rounded-[10px] px-2.5 py-2.5';
    const compactOuterFrameClass = portrait ? 'inset-[4px] rounded-[9px]' : 'inset-[4px] rounded-[8px]';
    const compactInnerFrameClass = portrait ? 'inset-[6px] rounded-[7px]' : isBannerCompact ? 'inset-[6px] rounded-[6px]' : 'inset-[8px] rounded-[6px]';
    const compactGapClass = portrait ? 'gap-1.5' : isBannerCompact ? 'gap-1' : 'gap-1.5';
    const compactRowsClass = portrait ? 'space-y-1' : isBannerCompact ? 'space-y-0.5' : 'space-y-1';
    const compactRowClass = portrait ? 'rounded-[8px] px-1.5 py-1.5' : isBannerCompact ? 'rounded-[7px] px-1.5 py-1' : 'rounded-[7px] px-2 py-1.5';
    const compactRowGapClass = portrait ? 'gap-1.5' : isBannerCompact ? 'gap-2' : 'gap-2.5';
    const compactMetricMinHeight = portrait ? 'min-h-[2.45rem]' : isBannerCompact ? 'min-h-[2.05rem]' : 'min-h-[2.45rem]';
    const compactMetricGapClass = isBannerCompact ? 'gap-0' : 'gap-0.5';
    const compactLabelSize = portrait ? 'text-[6px]' : isBannerCompact ? 'text-[9px]' : 'text-[6.5px]';
    const compactValueSize = portrait ? 'text-[0.94rem]' : isBannerCompact ? 'text-[1.32rem]' : 'text-[1rem]';
    const compactDetailSize = portrait ? 'text-[0.9rem]' : isBannerCompact ? 'text-[1.08rem]' : 'text-[0.84rem]';
    const plaqueRows = [
        [
            { label: 'Ciclos', value: totalCycles },
            { label: 'Carga', value: formattedHours },
        ],
        [
            { label: 'Média', value: weightedAverageScore },
            { label: 'Patamar', value: averageGrade },
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
                                    <p
                                        className={`${isCompact ? compactLabelSize : 'text-[6px]'} font-black uppercase leading-none tracking-[0.1em]`}
                                        style={{ ...etchedLabel, fontFamily: portrait ? 'Inter, system-ui, sans-serif' : undefined }}
                                    >
                                        {item.label}
                                    </p>
                                    {item.detail !== undefined ? (
                                        <div className="flex flex-col items-center justify-center leading-none">
                                            <p
                                                className={`${isCompact ? compactValueSize : 'text-[0.98rem]'} font-black leading-none`}
                                                style={{ ...etchedValue, fontFamily: portrait ? 'Inter, system-ui, sans-serif' : 'var(--font-heading)' }}
                                            >
                                                {item.value}
                                            </p>
                                            <p
                                                className={`${isCompact ? `${isBannerCompact ? 'mt-0' : 'mt-0.5'} ${compactDetailSize}` : 'mt-0.5 text-[0.8rem]'} font-black leading-none tracking-[0.03em]`}
                                                style={{ ...etchedValue, fontFamily: portrait ? 'Inter, system-ui, sans-serif' : 'var(--font-heading)' }}
                                            >
                                                {item.detail}
                                            </p>
                                        </div>
                                    ) : (
                                        <p
                                            className={`${isCompact ? compactValueSize : 'text-[0.98rem]'} font-black leading-none`}
                                            style={{ ...etchedValue, fontFamily: portrait ? 'Inter, system-ui, sans-serif' : 'var(--font-heading)' }}
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
