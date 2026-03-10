import React from 'react';
import { GlyphIcon } from './Icons';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';

interface LegacyGrandPlaqueProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    className?: string;
    compact?: boolean;
}

const etchedLabel: React.CSSProperties = {
    color: 'rgba(154, 116, 40, 0.92)',
    textShadow: '0 1px 0 rgba(255,255,255,0.22), 0 -1px 0 rgba(66,46,12,0.32)',
};

const etchedValue: React.CSSProperties = {
    color: '#fff0c7',
    textShadow: '0 1px 0 rgba(255,255,255,0.14), 0 0 18px rgba(139,214,255,0.2)',
};

export const LegacyGrandPlaque: React.FC<LegacyGrandPlaqueProps> = ({
    eras,
    sovereignName,
    className = '',
    compact = false,
}) => {
    const { totalCycles, totalHours, weightedAverageScore, crownEra, plaqueInscription } = buildLegacyPlaqueSummary(eras);
    const shellRadius = compact ? 'rounded-[32px]' : 'rounded-[42px]';
    const shellPadding = compact ? 'p-4' : 'p-6';
    const frameInset = compact ? 'inset-[14px]' : 'inset-[18px]';
    const innerInset = compact ? 'inset-[26px]' : 'inset-[32px]';
    const heroHeight = compact ? 'h-[200px]' : 'h-[280px]';
    const titleClass = compact ? 'text-[1.5rem]' : 'text-[2.15rem]';
    const medallionSize = compact ? 'h-20 w-20' : 'h-28 w-28';

    return (
        <section
            className={`relative overflow-hidden border border-[#c59645]/45 bg-[linear-gradient(180deg,_rgba(11,12,15,0.9),_rgba(5,6,8,0.96))] ${shellRadius} ${shellPadding} shadow-[0_34px_90px_rgba(0,0,0,0.56),inset_0_1px_0_rgba(255,255,255,0.08)] ${className}`}
        >
            <div className={`pointer-events-none absolute ${frameInset} rounded-[30px] border border-[#d5ab5d]/28`} />
            <div className={`pointer-events-none absolute ${innerInset} rounded-[24px] border border-[#e8c373]/18`} />

            <div
                className="pointer-events-none absolute inset-[22px] rounded-[26px]"
                style={{
                    background: 'radial-gradient(circle at 50% 12%, rgba(255,255,255,0.22), transparent 18%), linear-gradient(180deg, rgba(146,221,255,0.26) 0%, rgba(78,164,218,0.18) 20%, rgba(41,88,124,0.18) 52%, rgba(10,24,36,0.4) 100%)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 90px rgba(104,205,255,0.14), inset 0 -24px 40px rgba(0,0,0,0.24)',
                    backdropFilter: 'blur(12px)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-[22px] rounded-[26px]"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.18), transparent 24%, transparent 62%, rgba(255,255,255,0.12) 74%, transparent 90%), radial-gradient(circle at 50% 48%, rgba(110,208,255,0.18), transparent 26%)',
                    opacity: 0.92,
                }}
            />
            <div className="pointer-events-none absolute inset-x-[34px] top-[34px] h-12 rounded-[16px] border border-[#d4a85c]/28 bg-[linear-gradient(180deg,_rgba(255,235,196,0.16),_rgba(123,91,34,0.18))] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]" />
            <div className="pointer-events-none absolute inset-x-[34px] bottom-[34px] h-[136px] rounded-[20px] border border-[#d4a85c]/24 bg-[linear-gradient(180deg,_rgba(9,11,14,0.18),_rgba(7,8,10,0.38))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
            <div className="pointer-events-none absolute left-1/2 top-[84px] h-[1px] w-[62%] -translate-x-1/2 bg-[linear-gradient(90deg,_transparent,_rgba(255,221,154,0.6),_transparent)]" />

            <div className="relative z-10 flex h-full flex-col">
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.34em]" style={etchedLabel}>Legado total</p>
                    <h3 className={`mt-3 font-black tracking-[0.08em] text-white ${titleClass}`}>{sovereignName}</h3>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.28em]" style={etchedLabel}>Placa mestra de soberania</p>
                </div>

                <div className={`relative mt-5 flex items-center justify-center ${heroHeight}`}>
                    <div className="absolute inset-x-6 top-0 bottom-0 rounded-[28px] border border-[#e1bc72]/16 bg-[linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0.01))]" />
                    <div className={`relative flex ${medallionSize} items-center justify-center rounded-full border border-[#dfb86b]/35 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(105,205,255,0.12)_34%,_rgba(11,22,30,0.42)_72%)] shadow-[0_0_42px_rgba(106,203,255,0.16),inset_0_0_28px_rgba(255,255,255,0.1)]`}>
                        <div className="absolute inset-3 rounded-full border border-[#e6c67c]/25" />
                        <GlyphIcon className={compact ? 'h-8 w-8 text-[#f3d989]' : 'h-10 w-10 text-[#f3d989]'} />
                    </div>
                    <div className="absolute inset-x-12 bottom-6 rounded-[18px] border border-[#e5c374]/18 bg-[linear-gradient(180deg,_rgba(0,0,0,0.08),_rgba(0,0,0,0.24))] px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={etchedLabel}>Inscricao</p>
                        <p className={`mt-2 ${compact ? 'text-xs' : 'text-sm'} leading-relaxed text-[#eaf3fb]/86`}>{plaqueInscription}</p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-[16px] border border-[#d7b46b]/22 bg-black/16 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={etchedLabel}>Eras</p>
                        <p className="mt-2 text-3xl font-black" style={etchedValue}>{eras.length}</p>
                    </div>
                    <div className="rounded-[16px] border border-[#d7b46b]/22 bg-black/16 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={etchedLabel}>Ciclos</p>
                        <p className="mt-2 text-3xl font-black" style={etchedValue}>{totalCycles}</p>
                    </div>
                    <div className="rounded-[16px] border border-[#d7b46b]/22 bg-black/16 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={etchedLabel}>Score</p>
                        <p className="mt-2 text-3xl font-black" style={etchedValue}>{weightedAverageScore}</p>
                    </div>
                    <div className="rounded-[16px] border border-[#d7b46b]/22 bg-black/16 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={etchedLabel}>Horas</p>
                        <p className="mt-2 text-3xl font-black" style={etchedValue}>{Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}</p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3 rounded-[18px] border border-[#d7b46b]/22 bg-black/18 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={etchedLabel}>Era de consagracao</p>
                        <p className="mt-2 text-lg font-black tracking-[0.05em] text-white">{crownEra?.label || 'Sem era dominante'}</p>
                    </div>
                    <div className="rounded-full border border-[#d9bd80]/24 bg-black/18 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em]" style={etchedValue}>
                        Glyph
                    </div>
                </div>
            </div>
        </section>
    );
};
