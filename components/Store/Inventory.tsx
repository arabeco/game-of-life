import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { ITEMS_DB, ItemDef, resolveItemDef } from '../../constants/items';
import { CheckIcon, SovereignIcon, GlyphIcon } from '../Icons';
import { SovereignCustomizer } from '../SovereignCustomizer';
import { ItemDetailModal } from '../ItemDetailModal';
import { ChestType } from '../../types';
import { ChestOpeningModal } from '../ChestOpeningModal';

type InventoryTab = 'all' | 'skins' | 'character' | 'ui' | 'glyphs' | 'chests';

const TABS: { id: InventoryTab; label: string; categories: string[] }[] = [
    { id: 'all', label: 'Tudo', categories: [] },
    { id: 'skins', label: 'Skins', categories: ['skin', 'hair', 'ui_skin'] },
    { id: 'character', label: 'Personagem', categories: ['skin', 'hair'] },
    { id: 'ui', label: 'Interface', categories: ['border', 'ui_skin', 'banner', 'aura'] },
    { id: 'glyphs', label: 'Glifos', categories: ['glyph', 'orb', 'plate'] },
    { id: 'chests', label: 'Baús', categories: ['chest'] },
];

export const Inventory: React.FC = () => {
    const { inventory, userProfile, updateUserProfile, appMode } = useGame();
    const [activeTab, setActiveTab] = useState<InventoryTab>('all');
    
    // --- Editors State ---
    const [showSovereignEditor, setShowSovereignEditor] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ def: ItemDef, instanceId: string } | null>(null);
    const [showGlyphEditor, setShowGlyphEditor] = useState(false);
    const [showChestOpeningModal, setShowChestOpeningModal] = useState<ChestType | null>(null);

    const normalizedRole = userProfile?.role?.toLowerCase?.() || '';
    const isGM = normalizedRole === 'admin' || normalizedRole === 'gm';

    // Filter Tabs based on App Mode
    const visibleTabs = useMemo(() => {
        if (appMode === 'BASIC') {
            // Hide cosmetic tabs and chests in BASIC mode (Focus on productivity)
            return TABS.filter(t => !['skins', 'character', 'ui', 'glyphs', 'chests'].includes(t.id));
        }
        return TABS;
    }, [appMode]);

    // Reset active tab if it becomes invisible
    useEffect(() => {
        if (appMode === 'BASIC' && ['skins', 'character', 'ui', 'glyphs', 'chests'].includes(activeTab)) {
            setActiveTab('all');
        }
    }, [appMode, activeTab]);

    const sourceItems = useMemo(() => {
        // Normal user sees their inventory
        return inventory.map(inst => {
            const def = resolveItemDef(inst.id);
            // Use item_id from DB if resolving fails (though inst.id is usually item_id in local context if mapped)
            // But let's be robust: inst.id should be the ITEM ID (e.g., 'skin_gold')
            const resolvedId = def?.id || inst.id;
            return { ...inst, id: resolvedId, def };
        }).filter(i => i.def); // Filter out items with missing definitions
    }, [inventory]);

    const filteredItems = useMemo(() => {
        return sourceItems.filter(item => {
            if (activeTab === 'all') return true;
            if (activeTab === 'chests') return false; // Handled separately
            const tabConfig = TABS.find(t => t.id === activeTab);
            return tabConfig?.categories.includes(item.def?.category || '');
        }).sort((a, b) => (b.def?.tier || 0) - (a.def?.tier || 0)); // Sort by Tier Desc
    }, [sourceItems, activeTab]);

    const isEquipped = (itemId: string, category: string) => {
        if (category === 'skin') return userProfile.sovereign.outfit === itemId;
        if (category === 'hair') return userProfile.sovereign.hairStyle === itemId;
        if (category === 'glyph') return userProfile.sovereign.glyph === itemId;
        if (category === 'aura') return userProfile.sovereign.aura === itemId;
        if (category === 'orb') return userProfile.sovereign.orb === itemId;
        if (category === 'plate') return [userProfile.sovereign.sovereignPlate, userProfile.sovereign.artifactPlate, userProfile.sovereign.glyphPlate].includes(itemId);
        if (category === 'border') return userProfile.border === itemId;
        if (category === 'ui_skin') return userProfile.skin === itemId;
        return false;
    };

    const getRarityStyles = (tier: number) => {
        switch(tier) {
            case 1: return { text: 'text-[#A0522D]', bg: 'bg-[#A0522D]', shadow: '' }; // Comum: Marrom
            case 2: return { text: 'text-[#C0C0C0]', bg: 'bg-[#C0C0C0]', shadow: '' }; // Incomum: Prata
            case 3: return { text: 'text-[#FFD700]', bg: 'bg-[#FFD700]', shadow: '' }; // Raro: Ouro
            case 4: return { text: 'text-blue-500', bg: 'bg-blue-500', shadow: '' };   // Épico: Azul
            case 5: return { 
                text: 'text-purple-500', 
                bg: 'bg-purple-500', 
                shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]' 
            }; // Lendário: Roxo
            default: return { text: 'text-gray-400', bg: 'bg-gray-400', shadow: '' };
        }
    };

    const userChests = userProfile.chests || [];

    const getChestIcon = (type: string) => {
        // Map backend lowercase to frontend expectation if needed, or handle both
        const normalized = type.toLowerCase();
        if (normalized.includes('comum') || normalized === 'incomum') return '📤'; // Incomum
        if (normalized.includes('ciclo') || normalized === 'raro') return '🎁'; // Raro/Ciclo
        if (normalized.includes('radiante') || normalized === 'épico' || normalized === 'epico') return '🗳️'; // Épico/Radiante
        if (normalized.includes('lendário') || normalized.includes('legendary') || normalized.includes('season')) return '👑'; // Lendário/Season
        return '📦'; // Fallback
    };

    const getChestColor = (type: string) => {
        const normalized = type.toLowerCase();
        if (normalized.includes('comum')) return 'text-[#A0522D]'; // Marrom
        if (normalized.includes('incomum')) return 'text-[#C0C0C0]'; // Prata
        if (normalized.includes('ciclo') || normalized.includes('raro')) return 'text-[#FFD700]'; // Ouro
        if (normalized.includes('radiante') || normalized.includes('épico') || normalized.includes('epico')) return 'text-blue-500'; // Azul
        if (normalized.includes('lendário') || normalized.includes('legendary') || normalized.includes('season')) return 'text-purple-500'; // Roxo
        return 'text-gray-400';
    };

    const getChestLabel = (type: string) => {
        const normalized = type.toLowerCase();
        if (normalized === 'ciclo') return 'RARO';
        return type;
    };

    const getChestItemDef = (type: string): ItemDef => {
        const normalized = type.toLowerCase();
        let rarity: any = 'common';
        if (normalized.includes('incomum')) rarity = 'uncommon';
        else if (normalized.includes('raro') || normalized.includes('ciclo')) rarity = 'rare';
        else if (normalized.includes('épico') || normalized.includes('epico') || normalized.includes('radiante')) rarity = 'epic';
        else if (normalized.includes('lendário') || normalized.includes('legendary') || normalized.includes('season')) rarity = 'legendary';

        return {
            id: `chest_${normalized}`,
            name: type,
            category: 'chest',
            tier: rarity === 'legendary' ? 5 : rarity === 'epic' ? 4 : rarity === 'rare' ? 3 : rarity === 'uncommon' ? 2 : 1,
            rarity,
            icon: getChestIcon(type),
            description: 'Um baú contendo recompensas misteriosas. Abra para descobrir o que há dentro!'
        };
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-fade-in pb-2">
            {/* --- ACTION BUTTONS (Editors) --- */}
            <div className="flex-none flex gap-3">
                <button 
                    onClick={() => setShowSovereignEditor(true)}
                    className="w-full py-3 px-4 rounded-xl luxe-skin-button flex items-center justify-center gap-2 hover:scale-105 transition-transform group"
                >
                    <SovereignIcon className="w-5 h-5 text-black/70 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest text-black/80">Editor Soberano</span>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex-none flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
                {visibleTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Items Grid - Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {activeTab === 'chests' ? (
                    userChests.length === 0 ? (
                         <div className="col-span-full text-center py-20 text-gray-500 opacity-50">
                            <div className="text-4xl mb-4">📭</div>
                            <p>Nenhum baú disponível.</p>
                        </div>
                    ) : (
                        userChests.map((chest, idx) => (
                            <GlassCard 
                                key={`chest-${idx}`}
                                className="relative group aspect-square p-2 flex flex-col items-center justify-center transition-all border cursor-pointer hover:border-white/50"
                                style={{ borderColor: 'var(--skin-accent-color)' }}
                                onClick={() => setSelectedItem({ def: getChestItemDef(chest.type), instanceId: `chest-${idx}` })}
                            >
                                <div className="group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg flex items-center justify-center w-full h-full mb-3">
                                    <span className="text-4xl">{getChestIcon(chest.type)}</span>
                                </div>
                                <div className="absolute bottom-2 left-1 right-1 text-center">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider truncate block w-full drop-shadow-md ${getChestColor(chest.type)}`}>
                                        {getChestLabel(chest.type)}
                                    </span>
                                </div>
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow-lg">
                                    {chest.count}
                                </div>
                            </GlassCard>
                        ))
                    )
                ) : (
                    filteredItems.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-gray-500 opacity-50">
                            <div className="text-4xl mb-4">🎒</div>
                            <p>Inventário vazio nesta categoria.</p>
                        </div>
                    ) : (
                        filteredItems.map(item => {
                            const equipped = isEquipped(item.id, item.def?.category || '');
                            const styles = getRarityStyles(item.def?.tier || 1);

                            return (
                                <GlassCard 
                                    key={item.instanceId} 
                                    className={`relative group aspect-square p-2 flex flex-col items-center justify-center transition-all border cursor-pointer hover:border-white/50 ${equipped ? 'bg-white/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : styles.shadow}`}
                                    style={{ borderColor: 'var(--skin-accent-color)' }}
                                    onClick={() => item.def && setSelectedItem({ def: item.def, instanceId: item.instanceId })}
                                >
                                    {equipped && (
                                        <div className="absolute top-1 right-1 bg-green-500/20 text-green-400 rounded-full p-0.5 border border-green-500/30">
                                            <CheckIcon className="w-3 h-3" />
                                        </div>
                                    )}

                                    <div className="group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg flex items-center justify-center w-full h-full mb-3">
                                        {item.def?.imageUrl ? (
                                            <img src={item.def.imageUrl} alt={item.def.name} className="w-3/4 h-3/4 object-contain" />
                                        ) : (
                                            <span className="text-2xl">{item.def?.icon}</span>
                                        )}
                                    </div>
                                    
                                    {/* Item Name */}
                                    <div className="absolute bottom-2 left-1 right-1 text-center">
                                        <span className="text-[9px] font-bold text-white uppercase tracking-wider truncate block w-full drop-shadow-md">
                                            {item.def?.name}
                                        </span>
                                    </div>
                                    
                                    {/* Rarity Indicator - Discrete Dot */}
                                    <div className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${styles.bg} ${item.def?.tier === 5 ? 'animate-pulse shadow-[0_0_4px_rgba(250,204,21,0.6)]' : ''}`} title={`Tier ${item.def?.tier}`} />
                                </GlassCard>
                            );
                        })
                    )
                )}
            </div>
            </div>

            {/* Editors Modals */}
            {selectedItem && (
                <ItemDetailModal 
                    item={selectedItem.def} 
                    instanceId={selectedItem.instanceId}
                    type="inventory" 
                    onClose={() => setSelectedItem(null)}
                    onOpen={() => {
                        if (selectedItem.def.category === 'chest') {
                            const chestName = selectedItem.def.name;
                            let type: ChestType = 'Comum';
                            const normalized = chestName.toLowerCase();
                            
                            if (normalized.includes('incomum')) type = 'Incomum';
                            else if (normalized.includes('raro') || normalized.includes('ciclo')) type = 'Raro';
                            else if (normalized.includes('épico') || normalized.includes('epico') || normalized.includes('radiante')) type = 'Épico';
                            else if (normalized.includes('lendário') || normalized.includes('legendary') || normalized.includes('season')) type = 'Lendário';
                            
                            setShowChestOpeningModal(type);
                        }
                    }} 
                />
            )}
            {showChestOpeningModal && (
                <ChestOpeningModal
                    chestType={showChestOpeningModal}
                    onClose={() => setShowChestOpeningModal(null)}
                />
            )}
            {showSovereignEditor && (
                <SovereignCustomizer
                    initialConfig={userProfile.sovereign}
                    onClose={() => setShowSovereignEditor(false)} 
                    onSave={async (newConfig) => {
                        await updateUserProfile({ sovereign: newConfig });
                        setShowSovereignEditor(false);
                    }} 
                />
            )}
        </div>
    );
};
