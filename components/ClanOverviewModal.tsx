import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { DEFAULT_SANCTUARY_BACKGROUND } from '../constants';
import { ConfirmationModal } from './ConfirmationModal';
import { ClanManagementModal } from './ClanManagementModal';
import { CrownIcon, RefreshCwIcon, UsersIcon, XIcon } from './Icons';
import { Portal } from './Portal';
import { UserAvatar } from './UserAvatar';

type ClanOverviewTab = 'progress' | 'members';

export const ClanOverviewModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const {
        clan,
        clanRanks,
        enrichedClanMembers,
        loadClanAndMembers,
        leaveClan,
        userProfile,
    } = useGame();
    const [activeTab, setActiveTab] = useState<ClanOverviewTab>('progress');
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
    const totalRecordedContribution = sortedMembers.reduce(
        (sum, member) => sum + Number(member.contributionPoints || 0),
        0,
    );

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
            <Portal>
                <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm" onClick={onClose}>
                    <div className="flex h-full items-center justify-center p-3 sm:p-5">
                        <section
                            className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-[24px] border border-white/12 bg-[#090b0e] shadow-2xl"
                            onClick={event => event.stopPropagation()}
                        >
                            <div className="relative min-h-[220px] overflow-hidden border-b border-white/10">
                                <img
                                    src={clan.backgroundUrl || DEFAULT_SANCTUARY_BACKGROUND}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/42 to-[#090b0e]" />
                                <div className="relative flex items-start justify-between p-4">
                                    <button
                                        type="button"
                                        onClick={() => void handleRefresh()}
                                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-black/45 text-white/80"
                                        title="Atualizar grupo"
                                    >
                                        <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-black/45 text-white/80"
                                        title="Fechar"
                                    >
                                        <XIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 px-5 pb-4">
                                    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border border-white/18 bg-black/55 text-[42px] shadow-xl">
                                        {clan.icon || '🏛️'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="truncate text-xl font-black uppercase tracking-[0.08em] text-white">{clan.name}</h2>
                                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/62">
                                            {clan.description || 'Um grupo construindo progresso em conjunto.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-1 border-b border-white/8 bg-black/20 p-1.5">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('progress')}
                                    className={`rounded-lg py-2 text-[11px] font-black uppercase tracking-[0.12em] ${activeTab === 'progress' ? 'bg-white/10 text-white' : 'text-white/45'}`}
                                >
                                    Progresso
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('members')}
                                    className={`rounded-lg py-2 text-[11px] font-black uppercase tracking-[0.12em] ${activeTab === 'members' ? 'bg-white/10 text-white' : 'text-white/45'}`}
                                >
                                    Pessoas
                                </button>
                            </div>

                            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                                {activeTab === 'progress' ? (
                                    <div className="space-y-4">
                                        <div className="rounded-lg border border-amber-200/16 bg-amber-100/6 p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/42">Patente do grupo</p>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <CrownIcon className="h-5 w-5 text-amber-300" />
                                                        <span className="text-lg font-black text-white">{currentRank?.name || 'Feudo'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-amber-200">{clanExp.toLocaleString('pt-BR')}</p>
                                                    <p className="text-[9px] font-bold uppercase text-white/38">EXP conjunta</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/45">
                                                <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${rankProgress}%` }} />
                                            </div>
                                            <div className="mt-2 flex justify-between text-[10px] text-white/42">
                                                <span>{nextRank ? `${Math.max(0, nextFloor - clanExp).toLocaleString('pt-BR')} para ${nextRank.name}` : 'Patente máxima'}</span>
                                                <span>{sortedMembers.length} pessoas</span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-2 flex items-center justify-between px-1">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">Maiores contribuições</h3>
                                                <span className="text-[10px] font-bold text-white/38">{totalRecordedContribution.toLocaleString('pt-BR')} registradas</span>
                                            </div>
                                            <div className="space-y-2">
                                                {sortedMembers.slice(0, 5).map((member, index) => (
                                                    <div key={member.id} className="grid grid-cols-[26px_40px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-white/8 bg-white/[0.035] px-3 py-2.5">
                                                        <span className="text-center text-xs font-black text-white/35">{index + 1}</span>
                                                        <UserAvatar avatarUrl={member.avatarUrl} nickname={member.nickname} className="h-10 w-10" level={member.level} showBorder={false} />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-white">{member.nickname}</p>
                                                            <p className="text-[9px] uppercase text-white/35">{member.role === 'leader' ? 'Liderança' : 'Membro'}</p>
                                                        </div>
                                                        <span className="font-mono text-sm font-black text-amber-200">{Number(member.contributionPoints || 0).toLocaleString('pt-BR')}</span>
                                                    </div>
                                                ))}
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
                        </section>
                    </div>
                </div>
            </Portal>
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
