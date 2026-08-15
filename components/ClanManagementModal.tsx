import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { Portal } from './Portal';
import { XIcon, CrownIcon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
import { ConfirmationModal } from './ConfirmationModal';
import { AddClanMemberModal } from './AddClanMemberModal';
import { RecruitmentStatus } from '../types';
import { UserAvatar } from './UserAvatar';
import { CLAN_EMBLEM_OPTIONS, resolveClanBackground, SANCTUARY_BACKGROUND_OPTIONS } from '../constants';
import { ClanEmblem } from './ClanEmblem';

export const ClanManagementModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { clan, enrichedClanMembers, updateClan, kickClanMember, deleteClan } = useGame();
    const [name, setName] = useState(clan?.name || '');
    const [icon, setIcon] = useState(clan?.icon || '🏛️');
    const [description, setDescription] = useState(clan?.description || '');
    const [backgroundUrl, setBackgroundUrl] = useState(resolveClanBackground(clan?.backgroundUrl));
    const [recruitmentStatus, setRecruitmentStatus] = useState<RecruitmentStatus>(clan?.recruitmentStatus || 'Aberto');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [memberToKick, setMemberToKick] = useState<string | null>(null);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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

    const handleDeleteClan = async () => {
        setIsConfirmingDelete(false);
        await deleteClan();
        onClose();
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10001] overflow-y-auto animate-fade-in" onClick={onClose}>
                <div className="min-h-full flex items-start justify-center p-4">
                <GlassCard variant="gold" className="w-full max-w-md space-y-5 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="sticky top-0 z-10 flex justify-between items-center bg-[color:var(--modal-bg,#0a0b0f)]/92 backdrop-blur-md rounded-t-3xl -mx-0 px-0">
                        <h2 className="text-lg font-bold uppercase tracking-wider">Gerenciar Grupo</h2>
                        <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                        <ClanEmblem value={icon} className="h-24 w-24 rounded-[26px] border border-amber-200/25 bg-black/30 p-2 text-5xl shadow-xl" />
                        <div className="w-full space-y-2">
                            <label className="block text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">Emblema</label>
                            <div className="grid grid-cols-6 gap-2">
                                {CLAN_EMBLEM_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setIcon(option.value)}
                                        title={option.name}
                                        className={`aspect-square rounded-xl border p-1 transition-all ${icon === option.value ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/12' : 'border-white/10 bg-black/20 opacity-65 hover:opacity-100'}`}
                                    >
                                        <ClanEmblem value={option.value} className="h-full w-full" />
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={() => setIsIconPickerOpen(true)} className="mx-auto block text-[10px] font-bold uppercase tracking-[0.1em] text-white/45 hover:text-white/75">
                                Usar símbolo
                            </button>
                        </div>
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

                        <div className="w-full space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center block">Plano de fundo</label>
                                <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto pr-1">
                                    {SANCTUARY_BACKGROUND_OPTIONS.map(option => {
                                        const isSelected = backgroundUrl === option.value;
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => setBackgroundUrl(option.value)}
                                                className={`relative rounded-xl overflow-hidden border-2 transition-all ${isSelected ? 'border-[var(--skin-accent-color)]' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                                            >
                                                <div
                                                    className="aspect-[16/9] w-full bg-cover bg-center"
                                                    style={{ backgroundImage: `url(${option.value})` }}
                                                />
                                                <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-[10px] font-bold text-white">{option.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-bold uppercase text-center text-gray-400">Pessoas</h3>
                        {enrichedClanMembers.map(member => (
                            <div key={member.id} className="bg-black/20 p-2 rounded-xl flex items-center space-x-3">
                                <UserAvatar avatarUrl={member.avatarUrl} nickname={member.nickname} className="h-10 w-10" level={member.level} showBorder={false} />
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
                        <button onClick={() => setIsAddMemberModalOpen(true)} className="w-full py-2 rounded-xl luxe-button-secondary">Pedidos e Convites</button>
                        <button
                            onClick={() => setIsConfirmingDelete(true)}
                            disabled={enrichedClanMembers.length > 1}
                            className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-2 text-xs font-bold uppercase text-red-300 disabled:cursor-not-allowed disabled:opacity-35"
                            title={enrichedClanMembers.length > 1 ? 'Remova ou transfira as outras pessoas antes de excluir.' : 'Excluir grupo'}
                        >
                            Excluir grupo
                        </button>
                        {enrichedClanMembers.length > 1 && <p className="text-center text-[10px] text-white/35">Para excluir, o grupo precisa ficar apenas com a lideranca.</p>}
                        <button onClick={handleSave} disabled={isSaving} className="w-full py-2 rounded-xl luxe-skin-button disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'SALVANDO...' : 'SALVAR MUDANÇAS'}</button>
                    </div>
                </GlassCard>
                </div>
            </div>
            {isIconPickerOpen && <IconPickerModal onSelect={(i) => { setIcon(i); setIsIconPickerOpen(false); }} onClose={() => setIsIconPickerOpen(false)} />}
            {memberToKick && <ConfirmationModal title="Remover Pessoa" message={`Tem certeza que deseja remover ${enrichedClanMembers.find(m => m.id === memberToKick)?.nickname}?`} onConfirm={handleKickMember} onCancel={() => setMemberToKick(null)} />}
            {isConfirmingDelete && <ConfirmationModal title="Excluir Grupo" message="Essa acao apaga o grupo definitivamente. O progresso pessoal e os ciclos permanecem." onConfirm={handleDeleteClan} onCancel={() => setIsConfirmingDelete(false)} />}
            {isAddMemberModalOpen && <AddClanMemberModal onClose={() => setIsAddMemberModalOpen(false)} />}
        </Portal>
    );
};
