
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';

interface IconPickerModalProps {
    onSelect: (icon: string) => void;
    onClose: () => void;
}

const iconCategories = {
    'Sugeridos': ['🏆', '📚', '🔥', '$', '🏃‍♂️', '❤️', '🧠', '💼', '🧘', '🎨', '🎵', '💬'],
    'Pessoas': ['😀', '😎', '👨‍💻', '👩‍🎨', '👨‍🏫', '👩‍🚀', '🤴', '👸', '🦸', '🥷', '👨‍👩‍👧‍👦', '👥'],
    'Natureza': ['🌲', '🌳', '🌊', '☀️', '🌙', '⭐', '🏔️', '🏞️', '🌱', '🐾', '🍎', '🍇'],
    'Objetos': ['⚙️', '⚖️', '⛓️', '🔑', '💎', '⚱️', '⚔️', '🛡️', '👑', '📜', '🧭', '🔭'],
    'Símbolos': ['⚛️', '☯️', '♾️', '⚜️', '⚕️', '❤️‍🔥', '⚡', '⏳', '🎯', '⚓', '✨', '✔️'],
};

export const IconPickerModal: React.FC<IconPickerModalProps> = ({ onSelect, onClose }) => {
    const [activeCategory, setActiveCategory] = useState<keyof typeof iconCategories>('Sugeridos');

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-3 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Selecionar Ícone</h2>
                
                <div className="bg-black/20 p-1 rounded-2xl flex justify-around flex-wrap text-sm">
                    {Object.keys(iconCategories).map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat as keyof typeof iconCategories)} className={`px-3 py-1 rounded-xl ${activeCategory === cat ? 'bg-white/20' : ''}`}>
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-6 gap-2 p-2 max-h-48 overflow-y-auto bg-black/20 rounded-xl">
                    {iconCategories[activeCategory].map(icon => (
                        <button 
                            key={icon}
                            onClick={() => onSelect(icon)}
                            className="aspect-square rounded-lg text-2xl flex items-center justify-center transition-transform hover:scale-110 hover:bg-white/10"
                        >
                            {icon}
                        </button>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
};