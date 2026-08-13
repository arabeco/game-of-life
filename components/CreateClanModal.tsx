import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { IconPickerModal } from './IconPickerModal';
import { CheckIcon } from './Icons';
import { RecruitmentStatus } from '../types';
import { DEFAULT_SANCTUARY_BACKGROUND, SANCTUARY_BACKGROUND_OPTIONS } from '../constants';
import { GOLD_CLAN_CREATION_COST } from '../constants/goldCatalog';
import { Portal } from './Portal';
import { ConfirmationModal } from './ConfirmationModal';

const recruitmentOptions: RecruitmentStatus[] = ['Aberto', 'Privado'];

export const CreateClanModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { createClan, userProfile } = useGame();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('\u{1F3DB}\uFE0F');
    const [recruitmentStatus, setRecruitmentStatus] = useState<RecruitmentStatus>('Aberto');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_SANCTUARY_BACKGROUND);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmingDebit, setIsConfirmingDebit] = useState(false);
    const canAffordClanCreation = (userProfile.wallet?.gold || 0) >= GOLD_CLAN_CREATION_COST;

    const performSave = async () => {
        if (!name.trim()) {
            alert('O nome do grupo nao pode estar vazio.');
            return;
        }

        setIsSubmitting(true);
        try {
            const created = await createClan({ name, icon, description, clanType: 'Casual', recruitmentStatus, backgroundUrl });
            if (created) onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = async () => {
        if (isSubmitting) return;
        if (!name.trim()) {
            alert('O nome do grupo nao pode estar vazio.');
            return;
        }
        if (!canAffordClanCreation) {
            window.dispatchEvent(new CustomEvent('gold-shortage', {
                detail: {
                    requiredGold: GOLD_CLAN_CREATION_COST,
                    currentGold: Number(userProfile.wallet?.gold || 0),
                    label: 'criar um grupo',
                    storeTab: 'store',
                    section: 'packs',
                },
            }));
            return;
        }
        setIsConfirmingDebit(true);
    };

    const handleConfirmDebit = async () => {
        setIsConfirmingDebit(false);
        await performSave();
    };

    return (
        <>
            <Portal>
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
                    <GlassCard variant="gold" className="m-4 w-full max-w-md space-y-4 rounded-3xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-center text-lg font-bold uppercase tracking-wider">Criar Grupo</h2>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-yellow-300">
                                {`Criacao institucional - ${GOLD_CLAN_CREATION_COST} ouro`}
                            </div>
                            <button onClick={() => setIsIconPickerOpen(true)} className="flex h-24 w-24 items-center justify-center rounded-2xl bg-black/20 text-5xl">
                                {icon}
                            </button>
                            <div className="w-full space-y-3">
                                <input
                                    id="create-clan-name-input"
                                    type="text"
                                    placeholder="Nome do Grupo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 w-full rounded-xl border border-[var(--glass-border)] bg-black/30 px-4 text-center font-bold focus:border-[var(--skin-accent-color)] focus:outline-none"
                                />
                                <textarea
                                    id="create-clan-description-input"
                                    placeholder="Recado / descricao do grupo..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-xl border border-[var(--glass-border)] bg-black/30 p-3 text-center text-sm focus:border-[var(--skin-accent-color)] focus:outline-none"
                                />
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">Plano de fundo</label>
                                    <div className="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto pr-1">
                                        {SANCTUARY_BACKGROUND_OPTIONS.map((option) => {
                                            const isSelected = backgroundUrl === option.value;
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => setBackgroundUrl(option.value)}
                                                    className={`relative overflow-hidden rounded-xl border-2 transition-all ${isSelected ? 'border-[var(--skin-accent-color)]' : 'border-white/10 opacity-70 hover:opacity-100'}`}
                                                >
                                                    <div className="aspect-[16/9] w-full bg-cover bg-center" style={{ backgroundImage: `url(${option.value})` }} title={option.name} />
                                                    <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-[10px] font-bold text-white">{option.name}</span>
                                                    {isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--skin-accent-color)]/10">
                                                            <CheckIcon className="h-6 w-6 text-[var(--skin-accent-color)]" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400">Entrada</label>
                                    <div className="mt-1 flex rounded-xl bg-black/20 p-1">
                                        {recruitmentOptions.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setRecruitmentStatus(opt)}
                                                className={`w-full rounded-lg py-1 text-sm ${recruitmentStatus === opt ? 'bg-white/10' : 'text-gray-400'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className={`rounded-2xl border px-3 py-2 text-center text-xs ${canAffordClanCreation ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-300'}`}>
                                    {canAffordClanCreation
                                        ? `Saldo ok para abrir o grupo. Debito: ${GOLD_CLAN_CREATION_COST} ouro.`
                                        : `Saldo insuficiente. Criar grupo custa ${GOLD_CLAN_CREATION_COST} ouro.`}
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={onClose} className="w-full rounded-xl py-2 luxe-button-secondary">CANCELAR</button>
                            <button
                                id="create-clan-submit-button"
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 luxe-skin-button disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? 'CRIANDO...' : <><span>Criar</span><span className="text-[11px] leading-none">{'\u{1FA99}'}</span><span>{GOLD_CLAN_CREATION_COST}</span></>}
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </Portal>
            {isIconPickerOpen && (
                <IconPickerModal
                    onSelect={(i) => {
                        setIcon(i);
                        setIsIconPickerOpen(false);
                    }}
                    onClose={() => setIsIconPickerOpen(false)}
                />
            )}
            {isConfirmingDebit && (
                <ConfirmationModal
                    title="Confirmar criacao"
                    message={`Criar este grupo vai debitar ${GOLD_CLAN_CREATION_COST} ouro da sua conta. Deseja continuar?`}
                    confirmLabel={`CRIAR · ${GOLD_CLAN_CREATION_COST} \u{1FA99}`}
                    onConfirm={handleConfirmDebit}
                    onCancel={() => setIsConfirmingDebit(false)}
                />
            )}
        </>
    );
};
