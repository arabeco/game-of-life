import React, { useEffect, useMemo, useState } from 'react';
import type { EnrichedClanMember } from '../types';
import { useGame } from '../contexts/GameContext';
import { resolveClanBackground } from '../constants';
import { ConfirmationModal } from './ConfirmationModal';
import { ClanManagementModal } from './ClanManagementModal';
import { CrownIcon, EditIcon, RefreshCwIcon, UsersIcon, XIcon } from './Icons';
import { Portal } from './Portal';
import { UserAvatar } from './UserAvatar';
import { Sovereign } from './Avatar';
import { ClanEmblem } from './ClanEmblem';

type ClanOverviewTab = 'headquarters' | 'members';

const ClanOverviewShell: React.FC<{
    embedded: boolean;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ embedded, onClose, children }) => {
    const panel = (
        <section
            className={`relative flex w-full max-w-xl flex-col overflow-hidden border border-white/12 bg-[#090b0e] shadow-2xl ${embedded
                ? 'min-h-[calc(100dvh-15rem)] rounded-[20px]'
                : 'max-h-[92dvh] rounded-[24px]'}`}
            onClick={event => event.stopPropagation()}
        >
            {children}
        </section>
    );

    if (embedded) return panel;

    return (
        <Portal>
            <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <div className="flex h-full items-center justify-center p-3 sm:p-5">
                    {panel}
                </div>
            </div>
        </Portal>
    );
};

export const ClanOverviewModal: React.FC<{ onClose: () => void; embedded?: boolean }> = ({ onClose, embedded = false }) => {
    const {
        clan,
        clanRanks,
        enrichedClanMembers,
        loadClanAndMembers,
        leaveClan,
        userProfile,
    } = useGame();
    const [activeTab, setActiveTab] = useState<ClanOverviewTab>('headquarters');
    const [isManaging, setIsManaging] = useState(false);
    const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (clan?.id) void loadClanAndMembers(clan.id, true);
    }, [clan?.id, loadClanAndMembers]);

    const currentMember = enrichedClanMembers.find(member => member.id === userProfile.id);
    const isLeader = currentMember?.role === 'leader';
    const currentRankIndex = Math.max(0, clanRanks.findIndex(rank => rank.id === clan?.rankId));
    const currentRank = clanRanks[currentRankIndex];
    const nextRank = clanRanks[currentRankIndex + 1];
    const currentFloor = currentRank?.expRequired || 0;
    const nextFloor = nextRank?.expRequired || currentFloor;
    const clanExp = Math.max(0, Number(clan?.exp || 0));
    const rankSpan = Math.max(0, nextFloor - currentFloor);
    const rankProgress = nextRank && rankSpan > 0
        ? Math.max(0, Math.min(100, ((clanExp - currentFloor) / rankSpan) * 100))
        : 100;
    const sortedMembers = useMemo(
        () => [...enrichedClanMembers].sort((left, right) =>
            Number(right.contributionPoints || 0) - Number(left.contributionPoints || 0)
            || left.nickname.localeCompare(right.nickname)),
        [enrichedClanMembers],
    );
    const seasonMembers = useMemo(
        () => [...enrichedClanMembers].sort((left, right) =>
            Number(right.seasonContributionPoints || 0) - Number(left.seasonContributionPoints || 0)
            || Number(right.contributionPoints || 0) - Number(left.contributionPoints || 0)
            || left.nickname.localeCompare(right.nickname)),
        [enrichedClanMembers],
    );
    const totalRecordedContribution = sortedMembers.reduce(
        (sum, member) => sum + Number(member.contributionPoints || 0),
        0,
    );
    const seasonRecordedContribution = seasonMembers.reduce(
        (sum, member) => sum + Number(member.seasonContributionPoints || 0),
        0,
    );
    const sceneBackground = resolveClanBackground(clan?.backgroundUrl);
    const getSovereignOnlyConfig = (member: EnrichedClanMember) => member.sovereign
        ? {
            ...member.sovereign,
            artifact: 'none',
            glyph: 'none',
            aura: 'none',
            orb: 'none',
            sovereignPlate: 'none',
            artifactPlate: 'none',
            glyphPlate: 'none',
            primaryDisplay: 'sovereign' as const,
        }
        : undefined;

    if (!clan) return null;

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        try {
            await loadClanAndMembers(clan.id, true);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleLeave = async () => {
        setIsConfirmingLeave(false);
        await leaveClan();
        onClose();
    };

    return (
        <>
            <ClanOverviewShell embedded={embedded} onClose={onClose}>
                            <div className="pointer-events-none absolute inset-x-0 top-0 h-[590px] overflow-hidden">
                                <img
                                    src={sceneBackground}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/28 via-black/12 to-[#090b0e]" />
                            </div>
                            <div className="relative z-10 min-h-[300px] overflow-hidden border-b border-white/10">
                                <div className="relative flex items-start justify-between p-4">
                                    <button
                                        type="button"
                                        onClick={() => void handleRefresh()}
                                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-black/45 text-white/80"
                                        title="Atualizar grupo"
                                    >
                                        <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                    <div className="flex items-center gap-2">
                                    {isLeader && (
                                        <button
                                            type="button"
                                            onClick={() => setIsManaging(true)}
                                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-black/45 text-white/80"
                                            title="Editar grupo"
                                        >
                                            <EditIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                    {!embedded && (
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-black/45 text-white/80"
                                            title="Fechar"
                                        >
                                            <XIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    </div>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-5 text-center">
                                    <ClanEmblem value={clan.icon} className="h-[92px] w-[92px] rounded-[26px] border border-amber-200/35 bg-black/55 p-2 text-[52px] shadow-[0_14px_40px_rgba(0,0,0,0.65),0_0_28px_rgba(212,175,55,0.13)] backdrop-blur-md" />
                                    <h2 className="mt-3 max-w-full truncate text-2xl font-black uppercase tracking-[0.08em] text-white drop-shadow-lg">{clan.name}</h2>
                                    <div className="mt-1 flex items-center gap-2 text-amber-200">
                                        <CrownIcon className="h-4 w-4" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.16em]">{currentRank?.name || 'Feudo'}</span>
                                    </div>
                                    <div className="mt-3 w-full max-w-sm">
                                        <div className="h-2 overflow-hidden rounded-full border border-white/14 bg-black/55">
                                            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-200 transition-all" style={{ width: `${rankProgress}%` }} />
                                        </div>
                                        <div className="mt-1.5 flex justify-between text-[9px] font-bold uppercase tracking-[0.08em] text-white/48">
                                            <span>{clanExp.toLocaleString('pt-BR')} EXP</span>
                                            <span>{nextRank ? `${Math.max(0, nextFloor - clanExp).toLocaleString('pt-BR')} para ${nextRank.name}` : 'Patente máxima'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 grid grid-cols-2 gap-1 border-b border-white/8 bg-black/35 p-1.5 backdrop-blur-sm">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('headquarters')}
                                    className={`rounded-lg py-2 text-[11px] font-black uppercase tracking-[0.12em] ${activeTab === 'headquarters' ? 'bg-white/10 text-white' : 'text-white/45'}`}
                                >
                                    Sede
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('members')}
                                    className={`rounded-lg py-2 text-[11px] font-black uppercase tracking-[0.12em] ${activeTab === 'members' ? 'bg-white/10 text-white' : 'text-white/45'}`}
                                >
                                    Pessoas
                                </button>
                            </div>

                            <div className={`relative z-10 min-h-0 flex-1 overflow-y-auto p-4 ${activeTab === 'members' ? 'bg-[#090b0e]' : ''}`}>
                                {activeTab === 'headquarters' ? (
                                    <div className="space-y-4">
                                        <div className="relative min-h-[230px] overflow-hidden rounded-xl border border-white/10 px-3">
                                            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
                                            <div className="relative flex min-h-[228px] items-end justify-center -space-x-7 overflow-hidden px-1 pb-3">
                                                {seasonMembers.slice(0, 6).map((member, index) => (
                                                    <div
                                                        key={member.id}
                                                        className={`relative flex w-[104px] shrink-0 flex-col items-center origin-bottom ${member.role === 'leader' ? 'scale-110' : ''}`}
                                                        style={{ zIndex: member.role === 'leader' ? 20 : Math.max(1, 10 - index) }}
                                                    >
                                                        <div className="relative h-[178px] w-[104px] overflow-hidden drop-shadow-[0_12px_14px_rgba(0,0,0,0.85)]">
                                                            <Sovereign
                                                                sovereignConfig={getSovereignOnlyConfig(member)}
                                                                className="absolute left-1/2 top-1/2 h-[142%] w-[142%] -translate-x-1/2 -translate-y-1/2 object-contain"
                                                            />
                                                        </div>
                                                        <div className="relative -mt-5 max-w-[96px] rounded-full border border-white/12 bg-black/75 px-2 py-1 text-center backdrop-blur-sm">
                                                            <p className="truncate text-[8px] font-black uppercase tracking-[0.05em] text-white/82">{member.nickname}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between px-1">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Temporada atual</h3>
                                                <span className="text-[10px] font-bold text-amber-200/70">{seasonRecordedContribution.toLocaleString('pt-BR')} EXP</span>
                                            </div>
                                            <div className="space-y-2">
                                                {seasonMembers.slice(0, 5).map((member, index) => (
                                                    <div key={member.id} className="grid grid-cols-[26px_40px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-white/8 bg-white/[0.035] px-3 py-2.5">
                                                        <span className="text-center text-xs font-black text-white/35">{index + 1}</span>
                                                        <UserAvatar avatarUrl={member.avatarUrl} nickname={member.nickname} className="h-10 w-10" level={member.level} showBorder={false} />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-white">{member.nickname}</p>
                                                            <p className="text-[9px] uppercase text-white/35">{member.role === 'leader' ? 'Liderança' : 'Membro'}</p>
                                                        </div>
                                                        <span className="font-mono text-sm font-black text-amber-200">{Number(member.seasonContributionPoints || 0).toLocaleString('pt-BR')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 flex justify-between border-t border-white/8 px-1 pt-3 text-[9px] font-bold uppercase tracking-[0.08em] text-white/32">
                                                <span>Legado total</span>
                                                <span>{totalRecordedContribution.toLocaleString('pt-BR')} EXP</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="mb-3 flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2 text-white/60">
                                                <UsersIcon className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.16em]">Pessoas do grupo</span>
                                            </div>
                                            {isLeader && (
                                                <button type="button" onClick={() => setIsManaging(true)} className="rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-[10px] font-black uppercase text-white/75">
                                                    Gerenciar
                                                </button>
                                            )}
                                        </div>
                                        {sortedMembers.map(member => (
                                            <div key={member.id} className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.035] p-3">
                                                <UserAvatar avatarUrl={member.avatarUrl} nickname={member.nickname} className="h-11 w-11" level={member.level} showBorder={false} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-sm font-bold text-white">{member.nickname}</p>
                                                        {member.role === 'leader' && <CrownIcon className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
                                                    </div>
                                                    <p className="text-[10px] text-white/38">Contribuiu {Number(member.contributionPoints || 0).toLocaleString('pt-BR')} EXP</p>
                                                </div>
                                                <span className="text-xs font-black text-white/45">Nv. {member.level}</span>
                                            </div>
                                        ))}
                                        {!isLeader && (
                                            <button type="button" onClick={() => setIsConfirmingLeave(true)} className="mt-4 w-full py-3 text-xs font-bold text-red-300/80">
                                                Sair do grupo
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
            </ClanOverviewShell>
            {isManaging && <ClanManagementModal onClose={() => setIsManaging(false)} />}
            {isConfirmingLeave && (
                <ConfirmationModal
                    title="Sair do grupo"
                    message="Sua contribuição histórica continua no grupo, mas sua próxima experiência não será somada aqui."
                    confirmLabel="SAIR"
                    variant="danger"
                    onConfirm={() => void handleLeave()}
                    onCancel={() => setIsConfirmingLeave(false)}
                />
            )}
        </>
    );
};
