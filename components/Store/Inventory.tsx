import React, { useState, useMemo } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { ITEMS_DB, ItemDef } from '../../constants/items';
import { CheckIcon, SovereignIcon, GlyphIcon } from '../Icons';
import { SovereignEditorModal } from '../AvatarCustomizerModal';
import { ItemDetailModal } from '../ItemDetailModal';

type InventoryTab = 'all' | 'skins' | 'character' | 'ui';

const TABS: { id: InventoryTab; label: string; categories: string[] }[] = [
    { id: 'all', label: 'Tudo', categories: [] },
    { id: 'skins', label: 'Skins', categories: ['skin', 'hair', 'ui_skin'] },
    { id: 'character', label: 'Personagem', categories: ['skin', 'hair'] },
    { id: 'ui', label: 'Interface', categories: ['border', 'glyph', 'aura', 'ui_skin'] },
];

export const Inventory: React.FC = () => {
    const { inventory, userProfile, updateUserProfile } = useGame();
    const [activeTab, setActiveTab] = useState<InventoryTab>('all');
    
    // --- Editors State ---
    const [showSovereignEditor, setShowSovereignEditor] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ def: ItemDef, instanceId: string } | null>(null);
    const [showGlyphEditor, setShowGlyphEditor] = useState(false);

    const isGM = userProfile?.role === 'admin' || userProfile?.role === 'gm';

    const sourceItems = useMemo(() => {
        if (isGM) {
            // GM sees ALL items as if they owned them
            return ITEMS_DB.map(def => ({
                id: def.id,
                instanceId: `gm_${def.id}`, // Fake instance ID
                def,
                acquiredAt: new Date().toISOString(),
                isEquipped: false
            }));
        } else {
            // Normal user sees their inventory
            return inventory.map(inst => {
                const def = ITEMS_DB.find(d => d.id === inst.id);
                return { ...inst, def };
            }).filter(i => i.def); // Filter out items with missing definitions
        }
    }, [inventory, isGM]);

    const filteredItems = useMemo(() => {
        return sourceItems.filter(item => {
            if (activeTab === 'all') return true;
            const tabConfig = TABS.find(t => t.id === activeTab);
            return tabConfig?.categories.includes(item.def?.category || '');
        }).sort((a, b) => (b.def?.tier || 0) - (a.def?.tier || 0)); // Sort by Tier Desc
    }, [sourceItems, activeTab]);

    const isEquipped = (itemId: string, category: string) => {
        if (category === 'skin') return userProfile.sovereign.outfit === itemId;
        if (category === 'hair') return userProfile.sovereign.hairStyle === itemId;
        if (category === 'glyph') return userProfile.sovereign.glyph === itemId;
        if (category === 'aura') return userProfile.sovereign.aura === itemId;
        if (category === 'border') return userProfile.border === itemId;
        if (category === 'ui_skin') return userProfile.skin === itemId;
        return false;
    };

    const getRarityStyles = (tier: number) => {
        switch(tier) {
            case 1: return { text: 'text-gray-400', bg: 'bg-gray-400', shadow: '' };
            case 2: return { text: 'text-green-400', bg: 'bg-green-400', shadow: '' };
            case 3: return { text: 'text-blue-400', bg: 'bg-blue-400', shadow: '' };
            case 4: return { text: 'text-purple-400', bg: 'bg-purple-400', shadow: '' };
            case 5: return { 
                text: 'text-yellow-400', 
                bg: 'bg-yellow-400', 
                shadow: 'shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
            };
            default: return { text: 'text-gray-400', bg: 'bg-gray-400', shadow: '' };
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* --- ACTION BUTTONS (Editors) --- */}
            <div className="flex gap-3">
                <button 
                    onClick={() => setShowSovereignEditor(true)}
                    className="w-full py-3 px-4 rounded-xl luxe-skin-button flex items-center justify-center gap-2 hover:scale-105 transition-transform group"
                >
                    <SovereignIcon className="w-5 h-5 text-black/70 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest text-black/80">Editor Soberano</span>
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {filteredItems.length === 0 ? (
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
                )}
            </div>

            {/* Editors Modals */}
            {selectedItem && (
                <ItemDetailModal 
                    item={selectedItem.def} 
                    type="inventory" 
                    onClose={() => setSelectedItem(null)} 
                />
            )}
            {showSovereignEditor && (
                <SovereignEditorModal 
                    onClose={() => setShowSovereignEditor(false)} 
                    onSave={async (newConfig) => {
                        await updateUserProfile({ sovereign: newConfig });
                        setShowSovereignEditor(false);
                    }} 
                />
            )}
            
            {/* Placeholder for Glyph Editor - To be implemented or reused */}
            {showGlyphEditor && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowGlyphEditor(false)}>
                     <div className="bg-gray-800 p-8 rounded text-center">
                         <h2 className="text-xl font-bold mb-4">Forja de Glifos</h2>
                         <p className="mb-4">Em breve...</p>
                         <button onClick={() => setShowGlyphEditor(false)} className="px-4 py-2 bg-gray-600 rounded">Fechar</button>
                     </div>
                </div>
            )}
        </div>
    );
};
