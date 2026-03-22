
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { XIcon } from './Icons';
import { Portal } from './Portal';

interface TransferLeadershipModalProps {
    onClose: () => void;
    onConfirm: (newLeaderId: string) => void;
}

export const TransferLeadershipModal: React.FC<TransferLeadershipModalProps> = ({ onClose, onConfirm }) => {
    const { enrichedClanMembers, userProfile } = useGame();
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    const otherMembers = enrichedClanMembers.filter(member => member.id !== userProfile.id);

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[240] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="gold" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold uppercase tracking-wider">Transferir Liderança</h2>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5"/></button>
                    </div>

                    <p className="text-sm text-center text-gray-300">Você precisa nomear uma nova pessoa líder antes de sair do grupo.</p>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {otherMembers.map(member => (
                            <button 
                                key={member.id}
                                onClick={() => setSelectedMemberId(member.id)}
                                className={`w-full p-2 rounded-xl flex items-center space-x-3 text-left transition-colors ${selectedMemberId === member.id ? 'bg-white/20 ring-2 ring-[var(--skin-accent-color)]' : 'bg-black/20 hover:bg-white/10'}`}
                            >
                                <img src={member.avatarUrl} alt={member.nickname} className="w-10 h-10 rounded-full"/>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{member.nickname}</h4>
                                    <p className="text-xs text-gray-400">Nível {member.level}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => selectedMemberId && onConfirm(selectedMemberId)} 
                        disabled={!selectedMemberId}
                        className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-50"
                    >
                        Transferir e Sair
                    </button>
                </GlassCard>
            </div>
        </Portal>
    );
};
