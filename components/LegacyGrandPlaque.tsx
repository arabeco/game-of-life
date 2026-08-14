import React from 'react';
import type { ReportIdentitySnapshot } from '../types';
import type { LegacyEraSummary } from './LegacyExportDocument';
import { buildLegacyPlaqueSummary } from './LegacyPlaqueArtifact';
import { UserAvatar } from './UserAvatar';

interface LegacyGrandPlaqueProps {
    eras: LegacyEraSummary[];
    sovereignName: string;
    identity?: ReportIdentitySnapshot;
    identityMode?: 'historical' | 'current';
    className?: string;
    compact?: boolean;
    banner?: boolean;
    hideSovereignName?: boolean;
    portrait?: boolean;
}

export const LegacyGrandPlaque: React.FC<LegacyGrandPlaqueProps> = ({
    eras,
    sovereignName,
    identity,
    identityMode = 'current',
    className = '',
    compact = false,
}) => {
    const { totalCycles, totalHours, weightedAverageScore, averageGrade } = buildLegacyPlaqueSummary(eras);
    const nickname = identity?.nickname?.trim() || sovereignName || 'Usuario';
    const patent = identity?.nobilityRankName || identity?.title || 'Vagante';
    const clanName = identity?.clanName?.trim() || '';
    const clanRank = identity?.clanRankName?.trim() || '';
    const level = Math.max(1, Number(identity?.level || 1));
    const formattedHours = `${Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h`;
    const capturedAt = identity?.capturedAt ? new Date(identity.capturedAt) : null;
    const capturedDate = capturedAt && !Number.isNaN(capturedAt.getTime())
        ? capturedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '';
    const titleSize = nickname.length > 22 ? 'text-[0.72rem]' : nickname.length > 16 ? 'text-[0.82rem]' : 'text-[0.94rem]';

    return (
        <section
            className={`relative isolate min-h-[104px] w-full overflow-visible rounded-[13px] px-3 pb-2.5 pt-3 ${className}`}
            style={{
                background: [
                    'radial-gradient(circle at 18% 0%, rgba(255,248,211,0.2), transparent 34%)',
                    'linear-gradient(145deg, rgba(255,255,255,0.12), transparent 35%, rgba(4,18,31,0.24) 78%)',
                    'linear-gradient(180deg, #bcd8e8 0%, #7196af 46%, #2d4a61 100%)',
                ].join(', '),
                border: '1.5px solid rgba(224, 185, 93, 0.96)',
                boxShadow: '0 14px 28px rgba(0,0,0,0.3), 0 0 0 1px rgba(92,62,20,0.28), inset 0 1px 0 rgba(255,255,255,0.36), inset 0 -18px 26px rgba(4,18,31,0.22)',
            }}
        >
            <div className="pointer-events-none absolute inset-[4px] rounded-[10px] border border-amber-100/45" />
            <div className="pointer-events-none absolute inset-[7px] rounded-[8px] border border-white/12" />

            <div
                className="absolute -left-2 -top-2 z-30 flex h-[46px] w-[46px] flex-col items-center justify-center rounded-full border-2 border-amber-200/90 bg-[radial-gradient(circle_at_34%_26%,#31536d,#101b28_66%,#05080d)] shadow-[0_8px_18px_rgba(0,0,0,0.42),0_0_0_2px_rgba(10,18,28,0.86),inset_0_1px_0_rgba(255,255,255,0.2)]"
                aria-label={`Nivel ${level}`}
            >
                <span className="text-[5px] font-black uppercase tracking-[0.14em] text-amber-100/68">Nivel</span>
                <strong className="text-[1.06rem] font-black leading-none tabular-nums text-white">{level}</strong>
            </div>

            <div className="relative z-10 grid min-h-[86px] grid-cols-[58px_minmax(0,1fr)_76px] items-center gap-2 pl-3">
                <UserAvatar
                    avatarUrl={identity?.avatarUrl}
                    nickname={nickname}
                    borderId={identity?.borderId}
                    className="h-[54px] w-[54px]"
                    borderColor="rgba(237,196,96,0.96)"
                    showBorder
                />

                <div className="min-w-0 self-stretch py-1.5">
                    <p className="text-[5px] font-black uppercase tracking-[0.22em] text-amber-100/68">
                        {identityMode === 'historical' ? 'Retrato do ciclo' : 'Identidade atual'}
                    </p>
                    <h2
                        className={`mt-1 truncate font-black uppercase leading-none text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.38)] ${titleSize}`}
                        title={nickname}
                    >
                        {nickname}
                    </h2>
                    <p className="mt-1 truncate text-[7px] font-black uppercase tracking-[0.08em] text-sky-50/82" title={patent}>
                        {patent}
                    </p>
                    <div className="mt-2 h-px w-full bg-gradient-to-r from-amber-200/70 via-white/18 to-transparent" />
                    <p className="mt-1.5 truncate text-[7px] font-bold text-white/76" title={clanName || 'Sem cla neste ciclo'}>
                        {clanName ? `${identity?.clanIcon ? `${identity.clanIcon} ` : ''}${clanName}${clanRank ? ` - ${clanRank}` : ''}` : 'Sem cla neste ciclo'}
                    </p>
                </div>

                {identityMode === 'historical' ? (
                    <div className="flex h-[72px] flex-col items-center justify-center overflow-hidden rounded-[9px] border border-white/14 bg-[#08131e]/38 px-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <span className="text-[5px] font-black uppercase tracking-[0.13em] text-amber-100/65">Registro</span>
                        <strong className="mt-1 text-[9px] font-black leading-tight tabular-nums text-white">{capturedDate || 'Ciclo fechado'}</strong>
                        <span className="mt-1.5 text-[5px] font-bold uppercase leading-tight tracking-[0.08em] text-sky-100/58">Identidade preservada</span>
                    </div>
                ) : (
                    <div className="grid h-[72px] grid-rows-2 overflow-hidden rounded-[9px] border border-white/14 bg-[#08131e]/38 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                        <div className="flex items-center justify-center gap-1 border-b border-white/10 px-1">
                            <span className="text-[5px] font-black uppercase tracking-[0.1em] text-amber-100/65">Patamar</span>
                            <strong className="text-[1.05rem] font-black leading-none text-white">{averageGrade}</strong>
                            <span className="text-[7px] font-black tabular-nums text-white/70">{weightedAverageScore}</span>
                        </div>
                        <div className="grid grid-cols-2 items-center divide-x divide-white/10">
                            <span className="flex flex-col items-center justify-center">
                                <small className="text-[4.5px] font-black uppercase tracking-[0.08em] text-sky-100/58">Ciclos</small>
                                <strong className="text-[9px] font-black text-white">{totalCycles}</strong>
                            </span>
                            <span className="flex flex-col items-center justify-center">
                                <small className="text-[4.5px] font-black uppercase tracking-[0.08em] text-sky-100/58">Carga</small>
                                <strong className="text-[9px] font-black text-white">{formattedHours}</strong>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {!compact && (
                <div className="pointer-events-none absolute inset-x-8 bottom-1 h-px bg-gradient-to-r from-transparent via-amber-200/48 to-transparent" />
            )}
        </section>
    );
};
