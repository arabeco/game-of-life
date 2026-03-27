import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { Portal } from './Portal';
import { XIcon, CrownIcon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
import { ConfirmationModal } from './ConfirmationModal';
import { AddClanMemberModal } from './AddClanMemberModal';
import { RecruitmentStatus } from '../types';

export const ClanManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { clan, enrichedClanMembers, updateClan, kickClanMember } = useGame();
    const [name, setName] = useState(clan?.name || '');
    const [icon, setIcon] = useState(clan?.icon || '🏛️');
    const [description, setDescription] = useState(clan?.description || '');
    const [backgroundUrl, setBackgroundUrl] = useState(clan?.backgroundUrl || '');
    const [recruitmentStatus, setRecruitmentStatus] = useState<RecruitmentStatus>(clan?.recruitmentStatus || 'Aberto');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [memberToKick, setMemberToKick] = useState<string | null>(null);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isOfficeClan = clan?.clanType?.toLowerCase() === 'office';
    const officeBackgrounds = [
        { id: 'office1', label: 'Escritorio 1', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office1.jpg' },
        { id: 'office2', label: 'Escritorio 2', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office2.jpg' },
        { id: 'office3', label: 'Escritorio 3', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office3.jpg' },
    ];

    if (!clan) return null;

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const saved = await updateClan(clan.id, { name, icon, description, backgroundUrl, recruitmentStatus });
            if (saved) onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleKickMember = async () => {
        if (memberToKick) {
            await kickClanMember(memberToKick);
            setMemberToKick(null);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10001] overflow-y-auto animate-fade-in" onClick={onClose}>
                <div className="min-h-full flex items-start justify-center p-4">
                <GlassCard variant="gold" className="w-full max-w-sm space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="sticky top-0 z-10 flex justify-between items-center bg-[color:var(--modal-bg,#0a0b0f)]/92 backdrop-blur-md rounded-t-3xl -mx-0 px-0">
                        <h2 className="text-lg font-bold uppercase tracking-wider">Gerenciar Grupo</h2>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
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
                            placeholder="Recado / descrição do grupo..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full p-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] text-sm text-center"
                        />

                        <div className="w-full space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center block">Entrada no grupo</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['Aberto', 'Privado'] as RecruitmentStatus[]).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => setRecruitmentStatus(option)}
                                        className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase transition-all ${
                                            recruitmentStatus === option
                                                ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/15 text-[var(--skin-accent-color)]'
                                                : 'border-white/10 bg-black/20 text-gray-400 hover:bg-white/5'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>

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

                    <div className="space-y-2">
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

                    <div className="space-y-2">
                        <button onClick={() => setIsAddMemberModalOpen(true)} className="w-full py-2 rounded-xl luxe-button-secondary">Gerir Entradas</button>
                        <button onClick={handleSave} disabled={isSaving} className="w-full py-2 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'SALVANDO...' : 'SALVAR MUDANÇAS'}</button>
                    </div>
                </GlassCard>
                </div>
            </div>
            {isIconPickerOpen && <IconPickerModal onSelect={(i) => { setIcon(i); setIsIconPickerOpen(false); }} onClose={() => setIsIconPickerOpen(false)} />}
            {memberToKick && <ConfirmationModal title="Remover Pessoa" message={`Tem certeza que deseja remover ${enrichedClanMembers.find(m => m.id === memberToKick)?.nickname}?`} onConfirm={handleKickMember} onCancel={() => setMemberToKick(null)} />}
            {isAddMemberModalOpen && <AddClanMemberModal onClose={() => setIsAddMemberModalOpen(false)} />}
        </Portal>
    );
};
