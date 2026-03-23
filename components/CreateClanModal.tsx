import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { IconPickerModal } from './IconPickerModal';
import { CheckIcon } from './Icons';
import { ClanType, RecruitmentStatus } from '../types';
import { DEFAULT_SANCTUARY_BACKGROUND } from '../constants';
import { GOLD_CLAN_CREATION_COST } from '../constants/goldCatalog';
import { Portal } from './Portal';

const clanTypes: ClanType[] = ['Casual', 'Office'];
const recruitmentOptions: RecruitmentStatus[] = ['Aberto', 'Privado'];

export const CreateClanModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { createClan, appMode, userProfile } = useGame();
    const isBasicMode = appMode === 'BASIC';
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🏛️');
    const [clanType, setClanType] = useState<ClanType>(isBasicMode ? 'Office' : 'Casual');
    const [recruitmentStatus, setRecruitmentStatus] = useState<RecruitmentStatus>('Aberto');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_SANCTUARY_BACKGROUND);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const canAffordClanCreation = (userProfile.wallet?.gold || 0) >= GOLD_CLAN_CREATION_COST;

    const officeBackgrounds = [
        { id: 'office1', label: 'Escritorio 1', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office1.jpg' },
        { id: 'office2', label: 'Escritorio 2', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office2.jpg' },
        { id: 'office3', label: 'Escritorio 3', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office3.jpg' },
    ];

    const handleSave = async () => {
        if (!name.trim()) {
            alert('O nome do grupo nao pode estar vazio.');
            return;
        }

        let finalBackgroundUrl = backgroundUrl;
        if (clanType.toLowerCase() === 'office' && !officeBackgrounds.some(bg => bg.value === backgroundUrl)) {
            finalBackgroundUrl = officeBackgrounds[0].value;
        }

        setIsSubmitting(true);
        try {
            const created = await createClan({ name, icon, description, clanType, recruitmentStatus, backgroundUrl: finalBackgroundUrl });
            if (created) onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Portal>
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
                    <GlassCard variant="gold" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-bold uppercase tracking-wider text-center">Criar Grupo</h2>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-yellow-300">
                                {`Criacao institucional - ${GOLD_CLAN_CREATION_COST} ouro`}
                            </div>
                            <button onClick={() => setIsIconPickerOpen(true)} className="w-24 h-24 bg-black/20 rounded-2xl flex items-center justify-center text-5xl">
                                {icon}
                            </button>
                            <div className="w-full space-y-3">
                                <input
                                    id="create-clan-name-input"
                                    type="text"
                                    placeholder="Nome do Grupo"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] text-center font-bold"
                                />
                                <textarea
                                    id="create-clan-description-input"
                                    placeholder="Recado / descricao do grupo..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full p-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] text-sm text-center"
                                />
                                <div>
                                    <label className="text-xs font-bold text-gray-400">Tipo de Grupo</label>
                                    <div className="flex bg-black/20 p-1 rounded-xl mt-1">
                                        {isBasicMode ? (
                                            <button className="w-full py-1 text-sm rounded-lg bg-white/10 text-gray-200 cursor-default">Equipe</button>
                                        ) : (
                                            clanTypes.map(type => (
                                                <button key={type} onClick={() => setClanType(type)} className={`w-full py-1 text-sm rounded-lg ${clanType === type ? 'bg-white/10' : 'text-gray-400'}`}>{type === 'Office' ? 'Equipe' : 'Social'}</button>
                                            ))
                                        )}
                                    </div>
                                    {isBasicMode && (
                                        <p className="mt-1 text-[10px] text-gray-500">No modo basico, novos grupos nascem como equipe.</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Fundo do Espaco</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(clanType.toLowerCase() === 'office' ? officeBackgrounds : []).map(option => {
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
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-[var(--skin-accent-color)]/10 flex items-center justify-center">
                                                            <CheckIcon className="w-6 h-6 text-[var(--skin-accent-color)]" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400">Entrada</label>
                                    <div className="flex bg-black/20 p-1 rounded-xl mt-1">
                                        {recruitmentOptions.map(opt => (
                                            <button key={opt} onClick={() => setRecruitmentStatus(opt)} className={`w-full py-1 text-sm rounded-lg ${recruitmentStatus === opt ? 'bg-white/10' : 'text-gray-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className={`rounded-2xl border px-3 py-2 text-center text-xs ${canAffordClanCreation ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-300'}`}>
                                    {canAffordClanCreation
                                        ? `Saldo ok para abrir o cla. Debito: ${GOLD_CLAN_CREATION_COST} ouro.`
                                        : `Saldo insuficiente. Criar cla custa ${GOLD_CLAN_CREATION_COST} ouro.`}
                                </div>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary">CANCELAR</button>
                            <button
                                id="create-clan-submit-button"
                                onClick={handleSave}
                                disabled={isSubmitting || !canAffordClanCreation}
                                className="w-full py-2 rounded-xl luxe-skin-button disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? 'CRIANDO...' : `CRIAR - ${GOLD_CLAN_CREATION_COST}`}
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
        </>
    );
};
