import React from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon, Trash2Icon, ShareIcon } from './Icons';
import { ItemDef } from '../constants/items';

interface ItemDetailModalProps {
    item: ItemDef;
    instanceId?: string;
    type: string;
    onClose: () => void;
    onOpen?: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, instanceId, type, onClose, onOpen }) => {
    const { userProfile, updateUserProfile, toggleEquipItem } = useGame();
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

    const isEquipped = (
        (item.category === 'border' && userProfile.border === item.id) ||
        (item.category === 'ui_skin' && userProfile.skin === item.id) ||
        (item.category === 'skin' && userProfile.sovereign?.outfit === item.id) ||
        (item.category === 'hair' && userProfile.sovereign?.hairStyle === item.id) ||
        (item.category === 'glyph' && userProfile.sovereign?.glyph === item.id) ||
        (item.category === 'aura' && userProfile.sovereign?.aura === item.id) ||
        (item.category === 'orb' && userProfile.sovereign?.orb === item.id) ||
        (item.category === 'plate' && [userProfile.sovereign?.sovereignPlate, userProfile.sovereign?.artifactPlate, userProfile.sovereign?.glyphPlate].includes(item.id)) ||
        (item.category === 'banner' && userProfile.bannerUrl === item.imageUrl)
    );

    const handleEquip = async () => {
        if (!instanceId) return;
        
        await toggleEquipItem({
            id: item.id,
            instanceId: instanceId,
            acquiredAt: new Date().toISOString(), // Dummy date, not used for logic
            isEquipped: isEquipped
        });
        onClose();
    };

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

    const handleOpen = () => {
        if (onOpen) {
            onOpen();
            onClose();
        }
    };

    return (
        <Portal>
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
                    <div className="mt-4 text-xs text-white/60 px-4">
                        {item.description || "Um item raro e misterioso."}
                    </div>
                </div>

                {/* Actions */}
                <div className="w-full grid grid-cols-2 gap-3 z-10">
                    {item.category === 'chest' ? (
                        <button 
                            onClick={handleOpen}
                            className={`col-span-2 py-3 rounded-xl font-bold uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg ${rarityClass.replace('plasma-', 'bg-')}/20 border ${rarityColor} hover:bg-${rarityColor.replace('text-', '')}/20`}
                        >
                            ABRIR
                        </button>
                    ) : (
                        <button 
                            onClick={handleEquip}
                            className={`col-span-2 py-3 rounded-xl font-bold uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg ${isEquipped ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
                        >
                            {isEquipped ? 'Desequipar' : 'Equipar'}
                        </button>
                    )}
                    
                    <button 
                        onClick={handleRecycle}
                        className="py-3 rounded-xl bg-red-500/10 text-red-400 font-bold uppercase tracking-wider border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Trash2Icon className="w-4 h-4" />
                        <span className="text-[10px]">Reciclar</span>
                    </button>
                    
                    <button 
                        onClick={handleDonate}
                        className="py-3 rounded-xl bg-blue-500/10 text-blue-400 font-bold uppercase tracking-wider border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <ShareIcon className="w-4 h-4" />
                        <span className="text-[10px]">Doar</span>
                    </button>
                </div>
            </div>
        </div>
        </Portal>
    );
};
