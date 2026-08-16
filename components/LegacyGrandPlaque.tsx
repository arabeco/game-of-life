import React from 'react';
import { isClanEmblemImage } from './ClanEmblem';
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
    const { totalCycles, totalHours, totalActions, activeDays, weightedAverageScore, averageGrade } = buildLegacyPlaqueSummary(eras);
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
    const titleSize = nickname.length > 22 ? 'text-[0.86rem]' : nickname.length > 16 ? 'text-[0.98rem]' : 'text-[1.12rem]';
    const metricItems = [
        { label: 'Ciclos', value: totalCycles },
        { label: 'Carga', value: formattedHours },
        { label: 'Acoes', value: totalActions },
        { label: 'Dias ativos', value: activeDays },
    ];

    return (
        <section
            className={`relative isolate w-full overflow-hidden rounded-[18px] px-3 pb-3 pt-3 text-white ${compact ? 'min-h-[132px]' : 'min-h-[196px] px-5 pb-4 pt-4'} ${className}`}
            style={{
                border: '1.5px solid transparent',
                background: [
                    'radial-gradient(circle at 12% 0%, rgba(255,230,150,0.16), transparent 32%) padding-box',
                    'radial-gradient(circle at 96% 100%, rgba(47,125,159,0.18), transparent 34%) padding-box',
                    'linear-gradient(118deg, rgba(255,255,255,0.07), transparent 24%, rgba(255,255,255,0.025) 52%, transparent 74%) padding-box',
                    'linear-gradient(160deg, #17212a 0%, #0b1118 48%, #030608 100%) padding-box',
                    'linear-gradient(147deg, #f7e7b0 0%, #c9a34e 15%, #705523 34%, #e4cd88 52%, #7d6029 72%, #c6a052 88%, #f7e7b0 100%) border-box',
                ].join(', '),
                boxShadow: '0 18px 36px rgba(0,0,0,0.46), 0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,244,203,0.24), inset 0 -22px 38px rgba(0,0,0,0.34)',
            }}
        >
            <div
                className="pointer-events-none absolute inset-[5px] rounded-[13px]"
                style={{
                    border: '1px solid rgba(238,214,150,0.24)',
                    boxShadow: 'inset 0 1px 0 rgba(255,246,214,0.14), 0 1px 0 rgba(0,0,0,0.55)',
                }}
            />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
                style={{ background: 'repeating-linear-gradient(101deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0) 2px, rgba(255,255,255,0) 5px)' }}
            />
            <div className="pointer-events-none absolute inset-x-5 top-[8px] h-px bg-gradient-to-r from-transparent via-amber-200/75 to-transparent" />
            <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rotate-12 border border-amber-200/10" />
            <div className="pointer-events-none absolute bottom-0 left-[27%] h-20 w-px rotate-[28deg] bg-gradient-to-b from-transparent via-white/8 to-transparent" />
            {([
                'left-[9px] top-[9px] border-l border-t',
                'right-[9px] top-[9px] border-r border-t',
                'left-[9px] bottom-[9px] border-b border-l',
                'right-[9px] bottom-[9px] border-b border-r',
            ]).map((corner) => (
                <div key={corner} className={`pointer-events-none absolute h-2.5 w-2.5 border-amber-100/45 ${corner}`} />
            ))}

            <div className={`relative z-10 grid items-center ${compact ? 'grid-cols-[58px_minmax(0,1fr)_58px] gap-2' : 'grid-cols-[64px_minmax(0,1fr)_64px] gap-2 sm:grid-cols-[88px_minmax(0,1fr)_96px] sm:gap-4'}`}>
                <div className="relative flex items-center justify-center">
                    <div className={`absolute -bottom-1 right-0 z-20 flex flex-col items-center justify-center rounded-full border border-amber-200/85 bg-[#070a0d] shadow-[0_5px_12px_rgba(0,0,0,0.55),0_0_0_2px_rgba(8,10,12,0.88)] ${compact ? 'h-7 w-7' : 'h-8 w-8 sm:h-10 sm:w-10'}`} aria-label={`Nivel ${level}`}>
                        <span className={`${compact ? 'text-[4px]' : 'text-[5px]'} font-black uppercase tracking-[0.08em] text-amber-200/60`}>Nivel</span>
                        <strong className={`${compact ? 'text-[0.72rem]' : 'text-[0.86rem] sm:text-[1rem]'} font-black leading-none tabular-nums text-white`}>{level}</strong>
                    </div>
                    <UserAvatar
                        avatarUrl={identity?.avatarUrl}
                        nickname={nickname}
                        borderId={identity?.borderId}
                        className={compact ? 'h-[52px] w-[52px]' : 'h-[58px] w-[58px] sm:h-[78px] sm:w-[78px]'}
                        borderColor="rgba(237,196,96,0.96)"
                        showBorder
                    />
                </div>

                <div className="min-w-0 self-center">
                    <p className={`${compact ? 'text-[5px]' : 'text-[7px]'} font-black uppercase tracking-[0.24em] text-amber-200/65`}>
                        Placa do Legado
                    </p>
                    <h2 className={`mt-1 truncate font-black uppercase leading-none text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.65)] ${compact ? titleSize : 'text-[1.1rem] sm:text-[1.5rem]'}`} title={nickname}>
                        {nickname}
                    </h2>
                    <div className="mt-1.5 h-px w-full bg-gradient-to-r from-amber-200/80 via-amber-100/18 to-transparent" />
                    <p className={`${compact ? 'mt-1 text-[7px]' : 'mt-2 text-[10px]'} truncate font-black uppercase tracking-[0.08em] text-sky-50/76`} title={patent}>
                        {patent}
                    </p>
                    <p className={`${compact ? 'mt-0.5 text-[6px]' : 'mt-1 text-[9px]'} truncate font-semibold text-white/58`} title={clanName || 'Sem cla neste registro'}>
                        {clanName ? `${identity?.clanIcon && !isClanEmblemImage(identity.clanIcon) ? `${identity.clanIcon} ` : ''}${clanName}${clanRank ? ` - ${clanRank}` : ''}` : 'Jornada individual'}
                    </p>
                </div>

                <div
                    className={`relative flex flex-col items-center justify-center rounded-full text-center ${compact ? 'h-[54px] w-[54px]' : 'h-[60px] w-[60px] sm:h-[86px] sm:w-[86px]'}`}
                    style={{
                        border: '1.5px solid transparent',
                        background: [
                            'radial-gradient(circle at 34% 26%, rgba(255,239,181,0.16), rgba(8,14,19,0.96) 62%) padding-box',
                            'linear-gradient(150deg, #f2dda0 0%, #b8934a 26%, #6a5122 52%, #ddc17f 78%, #f2dda0 100%) border-box',
                        ].join(', '),
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -6px 12px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.38)',
                    }}
                >
                    <span className={`${compact ? 'text-[4px]' : 'text-[6px]'} font-black uppercase tracking-[0.1em] text-amber-200/64`}>{identityMode === 'historical' ? 'Registro' : 'Patamar'}</span>
                    {identityMode === 'historical' ? (
                        <strong className={`${compact ? 'mt-1 text-[7px]' : 'mt-1.5 text-[10px]'} max-w-[80%] font-black leading-tight text-white`}>{capturedDate || 'Ciclo fechado'}</strong>
                    ) : (
                        <>
                            <strong className={`${compact ? 'text-[1.45rem]' : 'text-[2.45rem]'} font-black leading-none text-white`}>{averageGrade}</strong>
                            <span className={`${compact ? 'text-[7px]' : 'text-[10px]'} font-black tabular-nums text-amber-100/74`}>{weightedAverageScore}</span>
                        </>
                    )}
                </div>
            </div>

            <div
                className={`relative z-10 mt-2 grid grid-cols-4 divide-x divide-amber-100/12 overflow-hidden rounded-[9px] ${compact ? 'py-1.5' : 'mt-4 py-2'}`}
                style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.34), rgba(0,0,0,0.12))',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,244,203,0.09)',
                }}
            >
                <div className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/45 to-transparent" />
                {metricItems.map((item) => (
                    <div key={item.label} className="flex min-w-0 flex-col items-center justify-center px-1 text-center">
                        <span className={`${compact ? 'text-[4.5px]' : 'text-[6px]'} truncate font-black uppercase tracking-[0.1em] text-amber-100/48`}>{item.label}</span>
                        <strong className={`${compact ? 'mt-0.5 text-[9px]' : 'mt-1 text-[14px]'} font-black tabular-nums text-white/92`}>{item.value}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
};
