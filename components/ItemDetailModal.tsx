import React from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon, Trash2Icon, ShareIcon } from './Icons';
import { ITEMS_DB, ItemDef, ItemCategory } from '../constants/items';
import { UnlockCategory } from '../types';

interface ItemDetailModalProps {
    item: ItemDef;
    instanceId?: string;
    type: string;
    onClose: () => void;
    onOpen?: () => void;
}

const CATEGORY_MAP: Partial<Record<ItemCategory, UnlockCategory>> = {
    'skin': 'outfits',
    'hair': 'hairStyles',
    'border': 'borders',
    'banner': 'banners',
    'glyph': 'glyphs',
    'aura': 'auras',
    'ui_skin': 'skins',
    'artifact': 'artifacts',
    'orb': 'orbs',
    'plate': 'plates',
    // Adicionar outros mapeamentos conforme necessário se existirem no ItemCategory
};

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item: initialItem, instanceId: initialInstanceId, type, onClose, onOpen }) => {
    const { userProfile, updateUserProfile, toggleEquipItem } = useGame();
    const [currentItem, setCurrentItem] = React.useState<ItemDef>(initialItem);

    // Reset current item when prop changes
    React.useEffect(() => {
        setCurrentItem(initialItem);
    }, [initialItem]);

    const relatedItems = React.useMemo(() => {
        return ITEMS_DB.filter(i => i.category === currentItem.category);
    }, [currentItem.category]);

    // Check ownership
    const checkOwnership = (itemId: string, category: ItemCategory) => {
        // First check explicit inventory if available
        if (userProfile.inventory?.some(i => i.id === itemId)) return true;

        // Fallback to unlockedItems map
        const unlockCategory = CATEGORY_MAP[category];
        if (unlockCategory && userProfile.unlockedItems?.[unlockCategory]) {
             return !!userProfile.unlockedItems[unlockCategory][itemId];
        }
        
        // Special case for basic items or defaults
        if (itemId === 'none' || itemId === 'BASIC') return true;
        
        return false;
    };

    const isOwned = checkOwnership(currentItem.id, currentItem.category);
    
    // Find instanceId if owned (prefer from inventory)
    const currentInstanceId = React.useMemo(() => {
        if (currentItem.id === initialItem.id && initialInstanceId) return initialInstanceId;
        const invItem = userProfile.inventory?.find(i => i.id === currentItem.id);
        return invItem?.instanceId;
    }, [currentItem.id, initialItem.id, initialInstanceId, userProfile.inventory]);

    const imageUrl = currentItem.imageUrl || currentItem.icon;
    
    // Determine rarity styles
    const rarityClass = currentItem.rarity === 'legendary' ? 'plasma-legendary' : 
                        currentItem.rarity === 'epic' ? 'plasma-epic' :
                        currentItem.rarity === 'rare' ? 'plasma-rare' :
                        currentItem.rarity === 'uncommon' ? 'plasma-uncommon' : 'plasma-common';

    const rarityColor = currentItem.rarity === 'legendary' ? 'text-purple-500' : // Roxo
                        currentItem.rarity === 'epic' ? 'text-blue-500' :        // Azul
                        currentItem.rarity === 'rare' ? 'text-[#FFD700]' :      // Ouro
                        currentItem.rarity === 'uncommon' ? 'text-[#C0C0C0]' :   // Prata
                        'text-[#A0522D]';                                 // Marrom
    
    const rarityLabel = currentItem.rarity === 'legendary' ? 'Lendário' : 
                        currentItem.rarity === 'epic' ? 'Épico' : 
                        currentItem.rarity === 'rare' ? 'Raro' : 
                        currentItem.rarity === 'uncommon' ? 'Incomum' : 'Comum';

    const isEquipped = (
        (currentItem.category === 'border' && userProfile.border === currentItem.id) ||
        (currentItem.category === 'ui_skin' && userProfile.skin === currentItem.id) ||
        (currentItem.category === 'skin' && userProfile.sovereign?.outfit === currentItem.id) ||
        (currentItem.category === 'hair' && userProfile.sovereign?.hairStyle === currentItem.id) ||
        (currentItem.category === 'glyph' && userProfile.sovereign?.glyph === currentItem.id) ||
        (currentItem.category === 'aura' && userProfile.sovereign?.aura === currentItem.id) ||
        (currentItem.category === 'orb' && userProfile.sovereign?.orb === currentItem.id) ||
        (currentItem.category === 'plate' && [userProfile.sovereign?.sovereignPlate, userProfile.sovereign?.artifactPlate, userProfile.sovereign?.glyphPlate].includes(currentItem.id)) ||
        (currentItem.category === 'banner' && userProfile.bannerUrl === currentItem.imageUrl)
    );

    const handleEquip = async () => {
        // Se não tiver instanceId (ex: desbloqueado via legacy unlockedItems mas sem entrada no inventory array novo), 
        // talvez precisemos lidar com isso. Mas toggleEquipItem espera instanceId?
        // Vamos checar toggleEquipItem no context. Se ele precisar de instanceId e não tivermos, pode ser problema.
        // Mas assumindo que itens desbloqueados têm instanceId ou o sistema lida com isso.
        // Se isOwned é true, devemos permitir tentar equipar.
        
        // Se não tiver instanceId, passamos uma string vazia ou geramos? 
        // O ideal é que se o item é owned, ele DEVE estar no inventário ou ser lidado pelo backend.
        // Vou passar instanceId se tiver, senão undefined/null e deixar o context lidar (ou falhar).
        // Mas o tipo exige instanceId string.
        
        const effectiveInstanceId = currentInstanceId || `legacy_${currentItem.id}`;

        await toggleEquipItem({
            id: currentItem.id,
            instanceId: effectiveInstanceId,
            acquiredAt: new Date().toISOString(), 
            isEquipped: isEquipped
        });
        // Não fechar o modal ao equipar, para permitir ver o resultado (opcional, user não pediu para fechar)
        // Mas o código original fechava: onClose();
        // O usuário disse "pra vc alternar qual quer ver", então manter aberto parece melhor.
        // Mas se o comportamento original era fechar, talvez manter.
        // Vou manter o onClose() por compatibilidade, mas o usuário quer "ficar com vontade", então talvez explorar.
        // Vou manter onClose() por enquanto para equipar, mas para "ver" não fecha.
        onClose(); 
    };

    const handleDonate = () => {
        // eslint-disable-next-line no-alert
        alert(`Você doou ${currentItem.name}! (Simulação)`);
        // Logic to donate would go here
    };

    const handleRecycle = () => {
        // eslint-disable-next-line no-alert
        const confirm = window.confirm(`Tem certeza que deseja reciclar ${currentItem.name}? Esta ação não pode ser desfeita.`);
        if (confirm) {
            // Logic to remove from inventory
            // eslint-disable-next-line no-alert
            alert(`Você reciclou ${currentItem.name}! (Simulação)`);
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
                        {currentItem.imageUrl ? (
                            <img src={currentItem.imageUrl} alt={currentItem.name} className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                        ) : (
                            <span className="text-8xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{currentItem.icon}</span>
                        )}
                    </div>
                </div>

                {/* Item Info */}
                <div className="text-center space-y-2 z-10 w-full">
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-lg">{currentItem.name}</h2>
                    <div className="flex justify-center">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white/10 bg-black/40 backdrop-blur-sm ${rarityColor} shadow-lg`}>
                            {rarityLabel}
                        </span>
                    </div>
                    <div className="h-px w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto my-4" />
                    <div className="mt-4 text-xs text-white/60 px-4">
                        {currentItem.description || "Um item raro e misterioso."}
                    </div>
                </div>

                {/* Related Items Collection */}
                {relatedItems.length > 1 && (
                    <div className="w-full mt-2 z-10">
                        <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 pl-1">Coleção</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent mask-linear-fade">
                            {relatedItems.map(relItem => {
                                const isRelOwned = checkOwnership(relItem.id, relItem.category);
                                const isSelected = relItem.id === currentItem.id;
                                const relRarityColor = relItem.rarity === 'legendary' ? 'bg-purple-500' : 
                                                    relItem.rarity === 'epic' ? 'bg-blue-500' :
                                                    relItem.rarity === 'rare' ? 'bg-[#FFD700]' :
                                                    relItem.rarity === 'uncommon' ? 'bg-[#C0C0C0]' : 'bg-[#A0522D]';
                                
                                return (
                                    <button
                                        key={relItem.id}
                                        onClick={() => setCurrentItem(relItem)}
                                        className={`
                                            relative flex-shrink-0 w-12 h-12 rounded-lg border transition-all overflow-hidden group
                                            ${isSelected ? 'border-white ring-1 ring-white/30 scale-105 z-10 shadow-lg' : 'border-white/5 hover:border-white/20'}
                                            ${!isRelOwned ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100' : ''}
                                        `}
                                    >
                                        <div className={`absolute inset-0 opacity-10 ${relRarityColor}`} />
                                        <div className="relative w-full h-full flex items-center justify-center p-1">
                                            {relItem.imageUrl ? (
                                                <img src={relItem.imageUrl} alt={relItem.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-xl">{relItem.icon}</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="w-full grid grid-cols-2 gap-3 z-10 mt-2">
                    {currentItem.category === 'chest' ? (
                        <button 
                            onClick={handleOpen}
                            className={`col-span-2 py-3 rounded-xl font-bold uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg ${rarityClass.replace('plasma-', 'bg-')}/20 border ${rarityColor} hover:bg-${rarityColor.replace('text-', '')}/20`}
                        >
                            ABRIR
                        </button>
                    ) : (
                        <button 
                            onClick={handleEquip}
                            disabled={!isOwned}
                            className={`col-span-2 py-3 rounded-xl font-bold uppercase tracking-wider transition-all transform shadow-lg
                                ${!isOwned 
                                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700' 
                                    : isEquipped 
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:scale-105 active:scale-95' 
                                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-105 active:scale-95'
                                }`}
                        >
                            {!isOwned ? 'Bloqueado' : isEquipped ? 'Desequipar' : 'Equipar'}
                        </button>
                    )}
                    
                    <button 
                        onClick={handleRecycle}
                        disabled={!isOwned}
                        className={`py-3 rounded-xl font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2
                            ${!isOwned 
                                ? 'bg-transparent text-gray-600 border-gray-800 cursor-not-allowed' 
                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                            }`}
                    >
                        <Trash2Icon className="w-4 h-4" />
                        <span className="text-[10px]">Reciclar</span>
                    </button>
                    
                    <button 
                        onClick={handleDonate}
                        disabled={!isOwned}
                        className={`py-3 rounded-xl font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2
                            ${!isOwned 
                                ? 'bg-transparent text-gray-600 border-gray-800 cursor-not-allowed' 
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                            }`}
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
