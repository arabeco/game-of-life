import React, { useMemo, useState } from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { CheckIcon, SendIcon, XIcon } from './Icons';
import { Portal } from './Portal';
import { SupabaseService } from '../services/SupabaseService';
import { UserAvatar } from './UserAvatar';
import { getDisplayLevel } from '../constants/lifeAreas';

export const AddClanMemberModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const {
        clan,
        userProfile,
        friends,
        enrichedClanMembers,
        clanJoinRequestsIncoming,
        approveClanJoinRequest,
        rejectClanJoinRequest,
        showToast,
    } = useGame();
    const [activeTab, setActiveTab] = useState<'requests' | 'invite'>('requests');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [pendingInviteeIds, setPendingInviteeIds] = useState<string[]>([]);

    const availableFriends = useMemo(() => (
        friends.filter(friend =>
            !enrichedClanMembers.some(member => member.id === friend.id)
        )
    ), [friends, enrichedClanMembers]);

    const canManage = useMemo(
        () => enrichedClanMembers.some(member => member.id === userProfile?.id && member.role === 'leader'),
        [enrichedClanMembers, userProfile?.id]
    );

    React.useEffect(() => {
        if (!canManage) return;
        void SupabaseService.getPendingClanInviteeIds().then(setPendingInviteeIds);
    }, [canManage]);

    const handleSendInvite = async (friendId: string, nickname: string) => {
        if (!clan) return;
        if (!canManage) {
            showToast('Apenas o lider do grupo pode enviar convites.', 'warning');
            return;
        }
        if (busyId) return;

        setBusyId(friendId);
        try {
            const result = await SupabaseService.sendClanInvitation(friendId);
            if (!result.ok) {
                showToast(result.reason === 'already_invited' ? 'Esse convite ja esta pendente.' : 'Nao foi possivel enviar o convite.', 'warning');
                return;
            }
            setPendingInviteeIds(current => current.includes(friendId) ? current : [...current, friendId]);
            showToast(`Convite enviado para ${nickname}.`, 'success');
        } finally {
            setBusyId(null);
        }
    };

    const handleRevokeInvite = async (friendId: string) => {
        if (busyId) return;
        setBusyId(friendId);
        try {
            const revoked = await SupabaseService.revokeClanInvitation(friendId);
            if (!revoked) {
                showToast('Nao foi possivel cancelar o convite.', 'error');
                return;
            }
            setPendingInviteeIds(current => current.filter(id => id !== friendId));
            showToast('Convite cancelado.', 'success');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10002] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-md m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold uppercase tracking-wider">Entrada no Grupo</h2>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-gray-300">
                        A pessoa pode aceitar ou recusar o convite diretamente em Solicitacoes.
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`rounded-xl py-2 text-xs font-bold uppercase tracking-wider ${activeTab === 'requests' ? 'luxe-skin-button' : 'bg-white/10 text-white/70'}`}
                        >
                            Solicitacoes
                        </button>
                        <button
                            onClick={() => setActiveTab('invite')}
                            className={`rounded-xl py-2 text-xs font-bold uppercase tracking-wider ${activeTab === 'invite' ? 'luxe-skin-button' : 'bg-white/10 text-white/70'}`}
                        >
                            Convidar
                        </button>
                    </div>

                    {activeTab === 'requests' && (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {clanJoinRequestsIncoming.length > 0 ? (
                                clanJoinRequestsIncoming.map(request => (
                                    <div key={request.id} className="bg-black/20 p-2 rounded-xl flex items-center space-x-3">
                                        <UserAvatar avatarUrl={request.requesterProfile?.avatarUrl} nickname={request.requesterProfile?.nickname || 'Jogador'} className="h-10 w-10" level={request.requesterProfile?.level} showBorder={false} />
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-bold text-white text-sm truncate">{request.requesterProfile?.nickname || 'Jogador'}</h4>
                                            <p className="text-xs text-gray-400">Nivel {getDisplayLevel(request.requesterProfile?.level)}</p>
                                        </div>
                                        <button
                                            onClick={() => approveClanJoinRequest(request)}
                                            disabled={!canManage}
                                            className="p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 disabled:opacity-50"
                                            title="Aceitar"
                                        >
                                            <CheckIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => rejectClanJoinRequest(request)}
                                            disabled={!canManage}
                                            className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                                            title="Recusar"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-4">Nenhuma solicitacao pendente.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'invite' && (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {availableFriends.length > 0 ? (
                                availableFriends.map(friend => (
                                    <div key={friend.id} className="bg-black/20 p-2 rounded-xl flex items-center space-x-3">
                                        <UserAvatar avatarUrl={friend.avatarUrl} nickname={friend.nickname} className="h-10 w-10" level={friend.level} showBorder={false} />
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-white text-sm">{friend.nickname}</h4>
                                            <p className="text-xs text-gray-400">Nivel {getDisplayLevel(friend.level)}</p>
                                        </div>
                                        {pendingInviteeIds.includes(friend.id) ? (
                                            <button onClick={() => handleRevokeInvite(friend.id)} disabled={busyId === friend.id} className="px-3 py-2 bg-red-500/12 text-red-300 text-xs font-bold rounded-lg hover:bg-red-500/20 disabled:opacity-50 inline-flex items-center gap-1">
                                                <XIcon className="w-4 h-4" /> Cancelar
                                            </button>
                                        ) : (
                                            <button onClick={() => handleSendInvite(friend.id, friend.nickname)} disabled={!canManage || busyId === friend.id} className="px-3 py-2 bg-white/10 text-xs font-bold rounded-lg hover:bg-white/20 disabled:opacity-50 inline-flex items-center gap-1">
                                                <SendIcon className="w-4 h-4" /> Convidar
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-4">Nenhum amigo disponivel fora do grupo.</p>
                            )}
                        </div>
                    )}
                </GlassCard>
            </div>
        </Portal>
    );
};
