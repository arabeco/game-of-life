
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useGame } from '../contexts/GameContext';
import { IconPickerModal } from './IconPickerModal';
import { PlusIcon, XIcon, CheckIcon } from './Icons';
import { ClanType, RecruitmentStatus } from '../types';
import { DEFAULT_SANCTUARY_BACKGROUND, SANCTUARY_BACKGROUND_OPTIONS } from '../constants';
import { Portal } from './Portal';

const clanTypes: ClanType[] = ['Casual', 'Office'];
const recruitmentOptions: RecruitmentStatus[] = ['Aberto', 'Privado'];

export const CreateClanModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { createClan, appMode } = useGame();
    const isBasicMode = appMode === 'BASIC';
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🏛️');
    const [clanType, setClanType] = useState<ClanType>(isBasicMode ? 'Office' : 'Casual');
    const [recruitmentStatus, setRecruitmentStatus] = useState<RecruitmentStatus>('Aberto');
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_SANCTUARY_BACKGROUND);

    const officeBackgrounds = [
        { id: 'office1', label: 'Escritório 1', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office1.jpg' },
        { id: 'office2', label: 'Escritório 2', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office2.jpg' },
        { id: 'office3', label: 'Escritório 3', value: 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/office3.jpg' },
    ];

    const handleSave = async () => {
        if (!name.trim()) {
            alert("O nome do clã não pode estar vazio.");
            return;
        }

        let finalBackgroundUrl = backgroundUrl;
        if (clanType.toLowerCase() === 'office' && !officeBackgrounds.some(bg => bg.value === backgroundUrl)) {
            finalBackgroundUrl = officeBackgrounds[0].value;
        }

        await createClan({ name, icon, description, clanType, recruitmentStatus, backgroundUrl: finalBackgroundUrl });
        onClose();
    };

    return (
        <>
            <Portal>
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="gold" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-center">Fundar Clã</h2>
                    <div className="flex flex-col items-center space-y-4">
                        <button onClick={() => setIsIconPickerOpen(true)} className="w-24 h-24 bg-black/20 rounded-2xl flex items-center justify-center text-5xl">
                            {icon}
                        </button>
                        <div className="w-full space-y-3">
                            <input
                                id="create-clan-name-input"
                                type="text"
                                placeholder="Nome do Clã"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] text-center font-bold"
                            />
                             <textarea
                                id="create-clan-description-input"
                                placeholder="Lore / Descrição do Clã..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className="w-full p-3 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] text-sm text-center"
                            />
                            <div>
                                <label className="text-xs font-bold text-gray-400">Tipo de Clã</label>
                                <div className="flex bg-black/20 p-1 rounded-xl mt-1">
                                    {isBasicMode ? (
                                        <button className="w-full py-1 text-sm rounded-lg bg-white/10 text-gray-200 cursor-default">Office</button>
                                    ) : (
                                        clanTypes.map(type => (
                                            <button key={type} onClick={() => setClanType(type)} className={`w-full py-1 text-sm rounded-lg ${clanType === type ? 'bg-white/10' : 'text-gray-400'}`}>{type}</button>
                                        ))
                                    )}
                                </div>
                            </div>
                            {/* Background Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Fundo do Escritório</label>
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
                                <label className="text-xs font-bold text-gray-400">Recrutamento</label>
                                <div className="flex bg-black/20 p-1 rounded-xl mt-1">
                                    {recruitmentOptions.map(opt => (
                                        <button key={opt} onClick={() => setRecruitmentStatus(opt)} className={`w-full py-1 text-sm rounded-lg ${recruitmentStatus === opt ? 'bg-white/10' : 'text-gray-400'}`}>{opt}</button>
                                    ))}
                                </div>
                            </div>
                            {/* <div>
                                <label className="text-xs font-bold text-gray-400">Fundo do Santuário</label>
                                <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                                    <div
                                        className="aspect-[16/9] w-full bg-cover bg-center"
                                        style={{ backgroundImage: `url(${backgroundUrl})` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {SANCTUARY_BACKGROUND_OPTIONS.map(option => {
                                        const isSelected = backgroundUrl === option.value;
                                        return (
                                            <button
                                                key={option.id}
                                                onClick={() => setBackgroundUrl(option.value)}
                                                className={`rounded-lg overflow-hidden border ${isSelected ? 'border-white' : 'border-white/10'}`}
                                            >
                                                <div
                                                    className="aspect-[16/9] w-full bg-cover bg-center"
                                                    style={{ backgroundImage: `url(${option.value})` }}
                                                />
                                                <div className="text-[10px] text-center py-1 text-gray-300 bg-black/40">
                                                    {option.name}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div> */}
                        </div>
                    </div>
                    <div className="flex space-x-2">
                            <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary">CANCELAR</button>
                            <button id="create-clan-submit-button" onClick={handleSave} className="w-full py-2 rounded-xl luxe-skin-button">FUNDAR</button>
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
