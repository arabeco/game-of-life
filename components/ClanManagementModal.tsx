import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { Portal } from './Portal';
import { XIcon, CrownIcon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
import { ConfirmationModal } from './ConfirmationModal';
import { AddClanMemberModal } from './AddClanMemberModal';

export const ClanManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { clan, enrichedClanMembers, updateClan, kickClanMember } = useGame();
    const [name, setName] = useState(clan?.name || '');
    const [icon, setIcon] = useState(clan?.icon || '🏛️');
    const [description, setDescription] = useState(clan?.description || '');
    const [backgroundUrl, setBackgroundUrl] = useState(clan?.backgroundUrl || '');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [memberToKick, setMemberToKick] = useState<string | null>(null);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    const isOfficeClan = clan?.clanType?.toLowerCase() === 'office';
    const officeBackgrounds = [
        { id: 'office1', label: 'Escritorio 1', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office1.jpg' },
        { id: 'office2', label: 'Escritorio 2', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office2.jpg' },
        { id: 'office3', label: 'Escritorio 3', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office3.jpg' },
    ];

    if (!clan) return null;

    const handleSave = async () => {
        await updateClan(clan.id, { name, icon, description, backgroundUrl });
        onClose();
    };

    const handleKickMember = async () => {
        if (memberToKick) {
            await kickClanMember(memberToKick);
            setMemberToKick(null);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10001] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="gold" className="w-full max-w-sm m-4 space-y-4 rounded-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center flex-shrink-0">
                        <h2 className="text-lg font-bold uppercase tracking-wider">Gerenciar Grupo</h2>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>

                    <div className="flex flex-col items-center space-y-4 flex-shrink-0">
                        <button onClick={() => setIsIconPickerOpen(true)} className="w-24 h-24 bg-black/20 rounded-2xl flex items-center justify-center text-5xl">
                            {icon}
                        </button>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] text-center font-bold"
                        />
                        <textarea
                            placeholder="Recado / descricao do grupo..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full p-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] text-sm text-center"
                        />

                        {isOfficeClan && (
                            <div className="w-full space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center block">Fundo do Espaco</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {officeBackgrounds.map(option => {
                                        const isSelected = backgroundUrl === option.value;
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => setBackgroundUrl(option.value)}
                                                className={`relative rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-[var(--skin-accent-color)] scale-105' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                                            >
                                                <div
                                                    className="aspect-square w-full bg-cover bg-center"
                                                    style={{ backgroundImage: `url(${option.value})` }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                        <h3 className="text-sm font-bold uppercase text-center text-gray-400">Pessoas</h3>
                        {enrichedClanMembers.map(member => (
                            <div key={member.id} className="bg-black/20 p-2 rounded-xl flex items-center space-x-3">
                                <img src={member.avatarUrl} alt={member.nickname} className="w-10 h-10 rounded-full" />
                                <div className="flex-grow">
                                    <h4 className="font-bold text-white text-sm">{member.nickname}</h4>
                                    <p className="text-xs text-gray-400">Nivel {member.level}</p>
                                </div>
                                {member.role === 'leader' ? (
                                    <CrownIcon className="w-5 h-5 text-[var(--skin-accent-color)]" />
                                ) : (
                                    <button onClick={() => setMemberToKick(member.id)} className="p-1">
                                        <XIcon className="w-5 h-5 text-red-500" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex-shrink-0 space-y-2">
                        <button onClick={() => setIsAddMemberModalOpen(true)} className="w-full py-2 rounded-xl luxe-button-secondary">Gerir Entradas</button>
                        <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-skin-button">SALVAR MUDANCAS</button>
                    </div>
                </GlassCard>
            </div>
            {isIconPickerOpen && <IconPickerModal onSelect={(i) => { setIcon(i); setIsIconPickerOpen(false); }} onClose={() => setIsIconPickerOpen(false)} />}
            {memberToKick && <ConfirmationModal title="Remover Pessoa" message={`Tem certeza que deseja remover ${enrichedClanMembers.find(m => m.id === memberToKick)?.nickname}?`} onConfirm={handleKickMember} onCancel={() => setMemberToKick(null)} />}
            {isAddMemberModalOpen && <AddClanMemberModal onClose={() => setIsAddMemberModalOpen(false)} />}
        </Portal>
    );
};
