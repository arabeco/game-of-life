import React from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, Trash2Icon, ShareIcon } from './Icons';
import { ItemDef } from '../constants/items';

interface ItemDetailModalProps {
    item: ItemDef;
    type: string;
    onClose: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, type, onClose }) => {
    const { userProfile, updateUserProfile } = useGame();
    const imageUrl = item.imageUrl || item.icon;
    
    // Determine rarity styles
    const rarityClass = item.rarity === 'legendary' ? 'plasma-legendary' : 
                        item.rarity === 'epic' ? 'plasma-epic' :
                        item.rarity === 'rare' ? 'plasma-rare' :
                        item.rarity === 'uncommon' ? 'plasma-uncommon' : 'plasma-common';

    const rarityColor = item.rarity === 'legendary' ? 'text-yellow-400' : 
                        item.rarity === 'epic' ? 'text-purple-400' :
                        item.rarity === 'rare' ? 'text-blue-400' :
                        item.rarity === 'uncommon' ? 'text-green-400' : 'text-gray-400';
    
    const rarityLabel = item.rarity === 'legendary' ? 'Lendário' : 
                        item.rarity === 'epic' ? 'Épico' : 
                        item.rarity === 'rare' ? 'Raro' : 
                        item.rarity === 'uncommon' ? 'Incomum' : 'Comum';

    const handleDonate = () => {
        alert(`Você doou ${item.name}! (Simulação)`);
        // Logic to donate would go here
    };

    const handleRecycle = () => {
        const confirm = window.confirm(`Tem certeza que deseja reciclar ${item.name}? Esta ação não pode ser desfeita.`);
        if (confirm) {
            // Logic to remove from inventory
            alert(`Você reciclou ${item.name}! (Simulação)`);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className={`w-full max-w-sm relative overflow-hidden rounded-2xl flex flex-col items-center p-8 gap-6 plasma-card plasma-bg ${rarityClass}`} 
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors z-20">
                    <XIcon className="w-6 h-6" />
                </button>

                {/* Item Image with Glow */}
                <div className="relative z-10 group">
                    <div className={`absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />
                    <div className="w-40 h-40 rounded-2xl flex items-center justify-center relative z-10 transition-transform duration-500 group-hover:scale-110">
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                        ) : (
                            <span className="text-8xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{item.icon}</span>
                        )}
                    </div>
                </div>

                {/* Item Info */}
                <div className="text-center space-y-2 z-10 w-full">
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg">{item.name}</h2>
                    <div className="flex justify-center">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white/10 bg-black/40 backdrop-blur-sm ${rarityColor} shadow-lg`}>
                            {rarityLabel}
                        </span>
                    </div>
                    <div className="h-px w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto my-4" />
                    <p className="text-sm text-gray-300 italic leading-relaxed px-2 font-serif min-h-[60px] flex items-center justify-center">
                        "{item.description || "Um item misterioso encontrado em suas jornadas. Sua verdadeira utilidade ainda está para ser descoberta."}"
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4 w-full mt-2 z-10">
                    <button 
                        onClick={handleRecycle}
                        className="flex-1 py-3 rounded-xl bg-black/40 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/80 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 text-xs font-bold flex flex-col items-center gap-1 group"
                    >
                        <Trash2Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="tracking-wider">RECICLAR</span>
                    </button>
                    <button 
                        onClick={handleDonate}
                        className="flex-1 py-3 rounded-xl bg-black/40 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/80 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-300 text-xs font-bold flex flex-col items-center gap-1 group"
                    >
                        <ShareIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="tracking-wider">DOAR</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
