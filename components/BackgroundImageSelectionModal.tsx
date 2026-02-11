
import React from 'react';
import { GlassCard } from './GlassCard';
import { UploadIcon } from './Icons';

interface BackgroundImageSelectionModalProps {
    currentBackground: string;
    onClose: () => void;
    onSelect: (backgroundValue: string) => void;
}

const BACKGROUND_OPTIONS = [
    { id: 'zen', name: 'Montanhas Zen', value: 'https://picsum.photos/seed/picsum/400/150' },
    { id: 'gold', name: 'Ouro', value: 'var(--metal-gold)' },
    { id: 'silver', name: 'Prata', value: 'var(--metal-silver)' },
    { id: 'bronze', name: 'Bronze', value: 'var(--metal-bronze)' },
];

export const BackgroundImageSelectionModal: React.FC<BackgroundImageSelectionModalProps> = ({ currentBackground, onClose, onSelect }) => {
    
    // Placeholder for file upload logic
    const handleFileUpload = () => {
        alert("Upload de imagem ainda não implementado.");
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Selecionar Plano de Fundo</h2>
                <div className="grid grid-cols-2 gap-2 p-2 max-h-64 overflow-y-auto">
                    {BACKGROUND_OPTIONS.map(bg => {
                        const isSelected = currentBackground === bg.value;
                        const isUrl = bg.value.startsWith('http');
                        
                        return (
                            <div key={bg.id} className="text-center">
                                <button 
                                    onClick={() => onSelect(bg.value)}
                                    className={`aspect-[16/9] w-full rounded-lg overflow-hidden transition-all duration-200 ${isSelected ? 'ring-4 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}
                                >
                                    <div 
                                        className="w-full h-full"
                                        style={{
                                            background: isUrl ? `url(${bg.value})` : bg.value,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    />
                                </button>
                                <p className="text-xs mt-1">{bg.name}</p>
                            </div>
                        )
                    })}
                    <div className="text-center">
                        <button 
                            onClick={handleFileUpload}
                            className="aspect-[16/9] w-full rounded-lg bg-black/30 border-2 border-dashed border-gray-500 flex flex-col items-center justify-center text-gray-400 hover:border-white hover:text-white transition-colors"
                        >
                            <UploadIcon className="w-8 h-8"/>
                        </button>
                        <p className="text-xs mt-1">UPLOAD</p>
                    </div>
                </div>
                 <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-primary">
                    FECHAR
                </button>
            </GlassCard>
        </div>
    );
};