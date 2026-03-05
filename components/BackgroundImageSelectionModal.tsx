
import React from 'react';
import { GlassCard } from './GlassCard';
import { UploadIcon } from './Icons';

interface BackgroundImageSelectionModalProps {
    currentBackground: string;
    onClose: () => void;
    onSelect: (backgroundValue: string) => void;
    options?: Array<{ id: string; name: string; value: string; isPremiumOnly?: boolean }>;
    title?: string;
    showUpload?: boolean;
    isPremiumUser?: boolean;
}

const BACKGROUND_OPTIONS = [
    { id: 'random', name: 'Aleatória', value: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800&h=450', isPremiumOnly: false },
    { id: 'slate', name: 'Sóbrio', value: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', isPremiumOnly: false },
    { id: 'ocean', name: 'Oceano Profundo', value: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', isPremiumOnly: false },
    { id: 'nebula', name: 'Nebulosa Premium', value: 'linear-gradient(45deg, #7028e4 0%, #e5b2ca 100%)', isPremiumOnly: false },
    { id: 'silver', name: 'Prata Metálica', value: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)', isPremiumOnly: false },
    { id: 'cyber', name: 'Cyber Neon', value: 'linear-gradient(135deg, #FF0080 0%, #00E0FF 100%)', isPremiumOnly: false },
    { id: 'noir', name: 'Noir Elegante', value: 'radial-gradient(circle at 50% -10%, #333 0%, #000 80%)', isPremiumOnly: false },
    
    // Premium Only
    { id: 'sunset', name: 'Amanhecer', value: 'linear-gradient(to right, #ff5f6d, #ffc371)', isPremiumOnly: true },
    { id: 'midnight', name: 'Noite Profunda', value: 'linear-gradient(180deg, #2c3e50 0%, #000000 100%)', isPremiumOnly: true },
    { id: 'emerald', name: 'Floresta Esmeralda', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', isPremiumOnly: true },
    { id: 'gold_dust', name: 'Poeira de Ouro', value: 'radial-gradient(circle, #bf953f 0%, #fcf6ba 50%, #b38728 100%)', isPremiumOnly: true },
    { id: 'royal', name: 'Veludo Real', value: 'linear-gradient(45deg, #800080 0%, #ff00ff 100%)', isPremiumOnly: true },
];

import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';

export const BackgroundImageSelectionModal: React.FC<BackgroundImageSelectionModalProps> = ({ currentBackground, onClose, onSelect, options, title, showUpload, isPremiumUser: propIsPremium }) => {
    const { userProfile, showToast } = useGame();
    const isPremiumUser = propIsPremium ?? (userProfile?.isPremium || userProfile?.role === 'gm' || userProfile?.role === 'admin');
    
    const backgroundOptions = (options as any) ?? BACKGROUND_OPTIONS;
    const modalTitle = title ?? 'Selecionar Plano de Fundo';
    const allowUpload = showUpload ?? true;

    const handleSelect = (bg: any) => {
        if (bg.isPremiumOnly && !isPremiumUser) {
            showToast('Acesso negado. Recurso restrito a assinantes Premium.', 'error');
            return;
        }
        onSelect(bg.value);
    };

    const handleFileUpload = () => {
        if (!isPremiumUser) {
            showToast('Acesso negado. Recurso restrito a assinantes Premium.', 'error');
            return;
        }
        alert("Upload de imagem ainda não implementado.");
    }

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-center">{modalTitle}</h2>
                    <div className="grid grid-cols-2 gap-2 p-2 max-h-64 overflow-y-auto">
                        {backgroundOptions.map(bg => {
                            const isSelected = currentBackground === bg.value;
                            const isGradient = bg.value.includes('-gradient(') || bg.value.startsWith('var(');
                            const isUrl = bg.value.startsWith('http') || (!isGradient && bg.value.includes('.'));

                            return (
                                <div key={bg.id} className="text-center relative">
                                    <button 
                                        onClick={() => handleSelect(bg)}
                                        className={`aspect-[16/9] w-full rounded-lg overflow-hidden transition-all duration-200 relative ${isSelected ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-white' : ''} ${bg.isPremiumOnly && !isPremiumUser ? 'opacity-80 grayscale-[0.5]' : ''}`}
                                    >
                                        <div 
                                            className="w-full h-full"
                                            style={{
                                                background: isUrl ? `url(${bg.value})` : bg.value,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        />
                                        
                                        {/* Lock Overlay */}
                                        {bg.isPremiumOnly && !isPremiumUser && (
                                            <div className="absolute top-1 right-1 bg-black/80 rounded-full w-5 h-5 flex items-center justify-center border border-yellow-500/50 shadow-lg">
                                                <span className="text-[10px]">🔒</span>
                                            </div>
                                        )}
                                    </button>
                                    <p className="text-xs mt-1 uppercase font-bold tracking-tighter opacity-70">{bg.name}</p>
                                </div>
                            )
                        })}
                        {allowUpload && (
                            <div className="text-center relative">
                                <button 
                                    onClick={handleFileUpload}
                                    className={`aspect-[16/9] w-full rounded-lg bg-black/30 border-2 border-dashed flex flex-col items-center justify-center transition-colors relative ${!isPremiumUser ? 'border-yellow-500/30 text-yellow-500/50 grayscale-[0.5]' : 'border-gray-500 text-gray-400 hover:border-white hover:text-white'}`}
                                >
                                    <UploadIcon className="w-8 h-8"/>
                                    
                                    {!isPremiumUser && (
                                        <div className="absolute top-1 right-1 bg-black/80 rounded-full w-5 h-5 flex items-center justify-center border border-yellow-500/50 shadow-lg">
                                            <span className="text-[10px]">🔒</span>
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
