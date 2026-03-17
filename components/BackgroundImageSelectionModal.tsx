import React from 'react';
import { GlassCard } from './GlassCard';
import { LockIcon, UploadIcon } from './Icons';
import { Portal } from './Portal';
import { ProfileBackgroundSurface } from './ProfileBackgroundSurface';
import { useGame } from '../contexts/GameContext';
import { PROFILE_BACKGROUND_OPTIONS, resolveProfileBackgroundValue } from '../utils/profileBackgrounds';

interface BackgroundImageSelectionModalProps {
    currentBackground: string;
    onClose: () => void;
    onSelect: (backgroundValue: string) => void;
    options?: Array<{ id: string; name: string; value: string; isPremiumOnly?: boolean }>;
    title?: string;
    showUpload?: boolean;
    isPremiumUser?: boolean;
}

export const BackgroundImageSelectionModal: React.FC<BackgroundImageSelectionModalProps> = ({
    currentBackground,
    onClose,
    onSelect,
    options,
    title,
    showUpload,
    isPremiumUser: propIsPremium,
}) => {
    const { userProfile, showToast } = useGame();
    const isPremiumUser = propIsPremium ?? (userProfile?.isPremium || userProfile?.role === 'gm' || userProfile?.role === 'admin');

    const backgroundOptions = (options as any) ?? PROFILE_BACKGROUND_OPTIONS;
    const modalTitle = title ?? 'Selecionar Plano de Fundo';
    const allowUpload = showUpload ?? true;

    const handleSelect = (bg: { value: string; isPremiumOnly?: boolean }) => {
        if (bg.isPremiumOnly && !isPremiumUser) {
            showToast('Acesso negado. Recurso restrito a assinantes Premium.', 'error');
            return;
        }
        onSelect(resolveProfileBackgroundValue(bg.value));
    };

    const handleFileUpload = () => {
        if (!isPremiumUser) {
            showToast('Acesso negado. Recurso restrito a assinantes Premium.', 'error');
            return;
        }
        alert('Upload de imagem ainda nao implementado.');
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-center">{modalTitle}</h2>
                    <div className="grid grid-cols-2 gap-2 p-2 max-h-64 overflow-y-auto">
                        {backgroundOptions.map(bg => {
                            const resolvedValue = resolveProfileBackgroundValue(bg.value);
                            const resolvedCurrent = resolveProfileBackgroundValue(currentBackground);
                            const isSelected = resolvedCurrent === resolvedValue;

                            return (
                                <div key={bg.id} className="text-center relative">
                                    <button
                                        onClick={() => handleSelect(bg)}
                                        className={`aspect-[16/9] w-full rounded-lg overflow-hidden transition-all duration-200 relative ${isSelected ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-white' : ''} ${bg.isPremiumOnly && !isPremiumUser ? 'opacity-80 grayscale-[0.5]' : ''}`}
                                    >
                                        <ProfileBackgroundSurface
                                            value={resolvedValue}
                                            className="w-full h-full object-cover"
                                            alt={bg.name}
                                        />
                                        {bg.isPremiumOnly && !isPremiumUser && (
                                            <div className="absolute top-1 right-1 bg-black/80 rounded-full w-5 h-5 flex items-center justify-center border border-yellow-500/50 shadow-lg">
                                                <LockIcon className="w-2.5 h-2.5 text-yellow-300" />
                                            </div>
                                        )}
                                    </button>
                                    <p className="text-xs mt-1 uppercase font-bold tracking-tighter opacity-70">{bg.name}</p>
                                </div>
                            );
                        })}
                        {allowUpload && (
                            <div className="text-center relative">
                                <button
                                    onClick={handleFileUpload}
                                    className={`aspect-[16/9] w-full rounded-lg bg-black/30 border-2 border-dashed flex flex-col items-center justify-center transition-colors relative ${!isPremiumUser ? 'border-yellow-500/30 text-yellow-500/50 grayscale-[0.5]' : 'border-gray-500 text-gray-400 hover:border-white hover:text-white'}`}
                                >
                                    <UploadIcon className="w-8 h-8" />
                                    {!isPremiumUser && (
                                        <div className="absolute top-1 right-1 bg-black/80 rounded-full w-5 h-5 flex items-center justify-center border border-yellow-500/50 shadow-lg">
                                            <LockIcon className="w-2.5 h-2.5 text-yellow-300" />
                                        </div>
                                    )}
                                </button>
                                <p className="text-xs mt-1 uppercase font-bold tracking-tighter opacity-70">UPLOAD</p>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="w-full py-2 rounded-xl luxe-skin-button">
                        FECHAR
                    </button>
                </GlassCard>
            </div>
        </Portal>
    );
};
