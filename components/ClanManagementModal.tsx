

import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { XIcon, CrownIcon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
import { ConfirmationModal } from './ConfirmationModal';
import { EnrichedClanMember } from '../types';
import { AddClanMemberModal } from './AddClanMemberModal';

export const ClanManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { clan, enrichedClanMembers, friends, updateClan, kickClanMember } = useGame();
    const [name, setName] = useState(clan?.name || '');
    const [icon, setIcon] = useState(clan?.icon || '🏛️');
    const [description, setDescription] = useState(clan?.description || '');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [memberToKick, setMemberToKick] = useState<string | null>(null);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    if (!clan) return null;

    const handleSave = async () => {
        await updateClan(clan.id, { name, icon, description });
        onClose();
    };
    
    const handleKickMember = async () => {
        if(memberToKick) {
            await kickClanMember(memberToKick);
            setMemberToKick(null);
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[240] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="gold" className="w-full max-w-sm m-4 space-y-4 rounded-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center flex-shrink-0">
                        <h2 className="text-lg font-bold uppercase tracking-wider">Gerenciar Clã</h2>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5"/></button>
                    </div>

                    <div className="flex flex-col items-center space-y-4 flex-shrink-0">
                        <button onClick={() => setIsIconPickerOpen(true)} className="w-24 h-24 bg-black/20 rounded-2xl flex items-center justify-center text-5xl">
                            {icon}
                        </button>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--gold)] text-center font-bold"
                        />
                         <textarea
                            placeholder="Lore / Descrição do Clã..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full p-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--gold)] text-sm text-center"
                        />
                    </div>
                    
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                         <h3 className="text-sm font-bold uppercase text-center text-gray-400">Membros</h3>
                        {enrichedClanMembers.map(member => (
                            <div key={member.id} className="bg-black/20 p-2 rounded-xl flex items-center space-x-3">
                                <img src={member.avatarUrl} alt={member.nickname} className="w-10 h-10 rounded-full"/>
                                <div className="flex-grow">
                                    <h4 className="font-bold text-white text-sm">{member.nickname}</h4>
                                    <p className="text-xs text-gray-400">Nível {member.level}</p>
                                </div>
                                {member.role === 'leader' ? (
                                    <CrownIcon className="w-5 h-5 text-yellow-400" />
                                ) : (
                                    <button onClick={() => setMemberToKick(member.id)} className="p-1">
                                        <XIcon className="w-5 h-5 text-red-500"/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex-shrink-0 space-y-2">
                        <button onClick={() => setIsAddMemberModalOpen(true)} className="w-full py-2 rounded-xl luxe-button-secondary">Adicionar Membro</button>
                        <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-button-primary">SALVAR MUDANÇAS</button>
                    </div>
                </GlassCard>
            </div>
            {isIconPickerOpen && <IconPickerModal onSelect={(i) => { setIcon(i); setIsIconPickerOpen(false); }} onClose={() => setIsIconPickerOpen(false)} />}
            {memberToKick && <ConfirmationModal title="Expulsar Membro" message={`Tem certeza que deseja expulsar ${enrichedClanMembers.find(m => m.id === memberToKick)?.nickname}?`} onConfirm={handleKickMember} onCancel={() => setMemberToKick(null)} />}
            {isAddMemberModalOpen && <AddClanMemberModal onClose={() => setIsAddMemberModalOpen(false)} />}
        </>
    );
};