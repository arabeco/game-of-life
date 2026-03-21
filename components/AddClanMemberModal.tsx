import React from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { XIcon } from './Icons';
import { Portal } from './Portal';

export const AddClanMemberModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { friends, enrichedClanMembers, showToast } = useGame();

    const availableFriends = friends.filter(friend =>
        !enrichedClanMembers.some(member => member.id === friend.id)
    );

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10002] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold uppercase tracking-wider">Entrada no Clã</h2>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-gray-300">
                        Cada pessoa precisa solicitar a própria entrada. O líder só aprova ou recusa na fila de solicitações.
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {availableFriends.length > 0 ? (
                            availableFriends.map(friend => (
                                <div key={friend.id} className="bg-black/20 p-2 rounded-xl flex items-center space-x-3">
                                    <img src={friend.avatarUrl} alt={friend.nickname} className="w-10 h-10 rounded-full" />
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-white text-sm">{friend.nickname}</h4>
                                        <p className="text-xs text-gray-400">Nível {friend.level}</p>
                                    </div>
                                    <button
                                        onClick={() => showToast('Essa pessoa precisa abrir o clã e solicitar entrada primeiro.', 'warning')}
                                        className="px-3 py-1 bg-white/10 text-sm rounded-lg hover:bg-white/20"
                                    >
                                        Só por solicitação
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-gray-500 py-4">Nenhum amigo disponível fora do clã.</p>
                        )}
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
