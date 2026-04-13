import React, { useMemo, useState } from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { CheckIcon, SendIcon, XIcon } from './Icons';
import { Portal } from './Portal';
import { SupabaseService } from '../services/SupabaseService';

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

    const availableFriends = useMemo(() => (
        friends.filter(friend =>
            !enrichedClanMembers.some(member => member.id === friend.id)
        )
    ), [friends, enrichedClanMembers]);

    const canManage = useMemo(
        () => enrichedClanMembers.some(member => member.id === userProfile?.id && member.role === 'leader'),
        [enrichedClanMembers, userProfile?.id]
    );

    const handleSendInvite = async (friendId: string, nickname: string) => {
        if (!clan) return;
        if (!canManage) {
            showToast('Apenas o lider do grupo pode enviar convites.', 'warning');
            return;
        }
        if (busyId) return;

        setBusyId(friendId);
        const content = `${userProfile.nickname || 'Um lider'} convidou voce para entrar no grupo ${clan.name}. Abra o grupo e solicite entrada.`;
        await SupabaseService.createNotification(
            friendId,
            'clan_invite',
            content,
            {
                clanId: clan.id,
                clanName: clan.name,
                joinRequest: false,
                inviteNotification: true,
                inviterId: userProfile.id,
                senderId: userProfile.id,
                senderNickname: userProfile.nickname || null,
                url: '/?oracle=clan',
            },
        );
        showToast(`Convite enviado para ${nickname}.`, 'success');
        setBusyId(null);
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10002] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold uppercase tracking-wider">Entrada no Grupo</h2>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-gray-300">
                        Convites servem para avisar a pessoa. A entrada continua sendo por solicitacao aprovada.
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
                                        <img src={request.requesterProfile?.avatarUrl} alt={request.requesterProfile?.nickname} className="w-10 h-10 rounded-full" />
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-bold text-white text-sm truncate">{request.requesterProfile?.nickname || 'Jogador'}</h4>
                                            <p className="text-xs text-gray-400">Nivel {request.requesterProfile?.level || 1}</p>
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
                                        <img src={friend.avatarUrl} alt={friend.nickname} className="w-10 h-10 rounded-full" />
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-white text-sm">{friend.nickname}</h4>
                                            <p className="text-xs text-gray-400">Nivel {friend.level}</p>
                                        </div>
                                        <button
                                            onClick={() => handleSendInvite(friend.id, friend.nickname)}
                                            disabled={!canManage || busyId === friend.id}
                                            className="px-3 py-1 bg-white/10 text-sm rounded-lg hover:bg-white/20 disabled:opacity-50 inline-flex items-center gap-1"
                                        >
                                            <SendIcon className="w-4 h-4" />
                                            Convidar
                                        </button>
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
