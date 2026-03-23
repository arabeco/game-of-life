import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { ItemDef, resolveItemDef, isItemCatalogVisible } from '../../constants/items';
import { CheckIcon, SovereignIcon } from '../Icons';
import { SovereignCustomizer } from '../SovereignCustomizer';
import { ItemDetailModal } from '../ItemDetailModal';
import { ChestType } from '../../types';
import { ChestOpeningModal } from '../ChestOpeningModal';
import { getChestVisual, getTierVisual, normalizeVisualRarity, withAlpha } from '../../constants/rarityVisuals';
import { ItemArt } from '../ItemArt';

type InventoryTab = 'all' | 'sovereign' | 'glyph' | 'interface' | 'insignias' | 'chests';
type InventoryEntry = {
    id: string;
    instanceId: string;
    acquiredAt: string;
    isEquipped?: boolean;
    def?: ItemDef;
};

const TABS: { id: InventoryTab; label: string; categories: string[] }[] = [
    { id: 'all', label: 'Tudo', categories: [] },
    { id: 'sovereign', label: 'Soberano', categories: ['skin', 'hair', 'artifact'] },
    { id: 'glyph', label: 'Glifo', categories: ['glyph', 'aura', 'orb', 'plate'] },
    { id: 'interface', label: 'Interface', categories: ['border', 'ui_skin', 'banner'] },
    { id: 'insignias', label: 'Insignias', categories: ['insignia'] },
    { id: 'chests', label: 'Baus', categories: ['chest'] },
];

export const Inventory: React.FC = () => {
    const { inventory, userProfile, updateUserProfile, appMode } = useGame();
    const [activeTab, setActiveTab] = useState<InventoryTab>('all');
    
    // --- Editors State ---
    const [showSovereignEditor, setShowSovereignEditor] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ def: ItemDef, instanceId: string } | null>(null);
    const [showChestOpeningModal, setShowChestOpeningModal] = useState<ChestType | null>(null);

    // Filter Tabs based on App Mode
    const visibleTabs = useMemo(() => {
        if (appMode === 'BASIC') {
            // Hide cosmetic tabs and chests in BASIC mode (Focus on productivity)
            return TABS.filter(t => !['sovereign', 'glyph', 'interface', 'insignias', 'chests'].includes(t.id));
        }
        return TABS;
    }, [appMode]);

    // Reset active tab if it becomes invisible
    useEffect(() => {
        if (appMode === 'BASIC' && ['sovereign', 'glyph', 'interface', 'insignias', 'chests'].includes(activeTab)) {
            setActiveTab('all');
        }
    }, [appMode, activeTab]);

    const isEquipped = (itemId: string, category: string, imageUrl?: string) => {
        if (category === 'skin') return userProfile.sovereign.outfit === itemId;
        if (category === 'hair') return userProfile.sovereign.hairStyle === itemId;
        if (category === 'artifact') return userProfile.sovereign.artifact === itemId;
        if (category === 'glyph') return userProfile.sovereign.glyph === itemId;
        if (category === 'aura') return userProfile.sovereign.aura === itemId;
        if (category === 'orb') return userProfile.sovereign.orb === itemId;
        if (category === 'plate') return [userProfile.sovereign.sovereignPlate, userProfile.sovereign.artifactPlate, userProfile.sovereign.glyphPlate].includes(itemId);
        if (category === 'border') return userProfile.border === itemId;
        if (category === 'ui_skin') return userProfile.skin === itemId;
        if (category === 'banner') return !!imageUrl && userProfile.bannerUrl === imageUrl;
        return false;
    };

    const sourceItems = useMemo(() => {
        const visibleItems = inventory.map<InventoryEntry>(inst => {
            const def = resolveItemDef(inst.id);
            return { ...inst, id: def?.id || inst.id, def };
        }).filter((item): item is InventoryEntry & { def: ItemDef } => {
            if (!item.def) return false;
            return isItemCatalogVisible(item.def) || isEquipped(item.id, item.def.category, item.def.imageUrl);
        });

        const deduped = new Map<string, InventoryEntry & { def: ItemDef }>();

        for (const item of visibleItems) {
            const current = deduped.get(item.id);
            if (!current) {
                deduped.set(item.id, item);
                continue;
            }

            const currentStamp = Date.parse(current.acquiredAt || '');
            const nextStamp = Date.parse(item.acquiredAt || '');
            const shouldReplace =
                Boolean(item.isEquipped) ||
                (!current.isEquipped && (Number.isNaN(currentStamp) || (!Number.isNaN(nextStamp) && nextStamp > currentStamp)));

            if (shouldReplace) {
                deduped.set(item.id, item);
            }
        }

        return Array.from(deduped.values());
    }, [inventory, userProfile]);

    const filteredItems = useMemo(() => {
        return sourceItems.filter(item => {
            if (activeTab === 'all') return true;
            if (activeTab === 'chests') return false; // Handled separately
            const tabConfig = TABS.find(t => t.id === activeTab);
            return tabConfig?.categories.includes(item.def?.category || '');
        }).sort((a, b) => (b.def?.tier || 0) - (a.def?.tier || 0)); // Sort by Tier Desc
    }, [sourceItems, activeTab]);

    const getRarityStyles = (tier: number) => {
        const visual = getTierVisual(tier);
        return {
            textColor: visual.hex,
            dotColor: visual.hex,
            shadow: tier >= 4 ? `0 0 15px ${withAlpha(visual.rgb, 0.28)}` : undefined,
        };
    };

    const userChests = userProfile.chests || [];

    const getChestIcon = (type: string) => {
        const normalized = type.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (normalized.includes('comum') || normalized === 'incomum') return '\u{1F4E4}';
        if (normalized.includes('raro') || normalized.includes('radiante') || normalized.includes('ciclo')) return '\u{1F381}';
        if (normalized.includes('epico')) return '\u{1F5F3}\uFE0F';
        if (normalized.includes('season')) return '\u{1F31F}';
        if (normalized.includes('lendario') || normalized.includes('legendary')) return '\u{1F451}';
        return '\u{1F4E6}';
    };

    const getChestLabel = (type: string) => {
        const normalized = type.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (normalized.includes('skin') && normalized.includes('comum')) return 'SKIN COMUM';
        if (normalized === 'comum') return 'COMUM';
        if (normalized === 'incomum') return 'INCOMUM';
        if (normalized === 'raro' || normalized === 'radiante') return 'RARO';
        if (normalized === 'ciclo') return 'CICLO';
        if (normalized === 'epico') return '\u00C9PICO';
        if (normalized === 'season') return 'TEMPORADA';
        if (normalized === 'lendario' || normalized === 'legendary') return 'LENDARIO';
        return type.toUpperCase();
    };

    const getChestItemDef = (type: string): ItemDef => {
        const normalized = type.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const rarity = normalizeVisualRarity(type) || (normalized.includes('ciclo') ? 'rare' : 'common');

        return {
            id: `chest_${normalized}`,
            name: type,
            category: 'chest',
            tier: rarity === 'legendary' ? 5 : rarity === 'epic' ? 4 : rarity === 'rare' ? 3 : rarity === 'uncommon' ? 2 : 1,
            rarity: rarity === 'quest' ? 'rare' : rarity,
            icon: getChestIcon(type),
            description: 'Um bau contendo recompensas misteriosas. Abra para descobrir o que ha dentro!'
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
                            <div className="text-4xl mb-4">🎒</div>
                            <p>Nenhum bau disponivel.</p>
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
                                    <span className="block w-full truncate text-[9px] font-bold uppercase tracking-wider drop-shadow-md" style={{ color: getChestVisual(chest.type).hex }}>
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
                            <p>Inventario vazio nesta categoria.</p>
                        </div>
                    ) : (
                        filteredItems.map(item => {
                            const equipped = isEquipped(item.id, item.def?.category || '', item.def?.imageUrl);
                            const styles = getRarityStyles(item.def?.tier || 1);

                            return (
                                <GlassCard 
                                    key={item.instanceId} 
                                    className="relative group aspect-square p-2 flex flex-col items-center justify-center transition-all border cursor-pointer hover:border-white/50"
                                    style={{ borderColor: 'var(--skin-accent-color)', boxShadow: equipped ? '0 0 15px rgba(34,197,94,0.1)' : styles.shadow }}
                                    onClick={() => item.def && setSelectedItem({ def: item.def, instanceId: item.instanceId })}
                                >
                                    {equipped && (
                                        <div className="absolute top-1 right-1 bg-green-500/20 text-green-400 rounded-full p-0.5 border border-green-500/30">
                                            <CheckIcon className="w-3 h-3" />
                                        </div>
                                    )}

                                    <div className="group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg flex items-center justify-center w-full h-full mb-3">
                                        <ItemArt
                                            src={item.def?.imageUrl}
                                            alt={item.def?.name || item.id}
                                            icon={item.def?.icon}
                                            category={item.def?.category}
                                            className="w-3/4 h-3/4 flex items-center justify-center"
                                            imgClassName="w-full h-full object-contain"
                                            iconClassName="text-2xl"
                                        />
                                    </div>
                                    
                                    {/* Item Name */}
                                    <div className="absolute bottom-2 left-1 right-1 text-center">
                                        <span className="text-[9px] font-bold text-white uppercase tracking-wider truncate block w-full drop-shadow-md">
                                            {item.def?.name}
                                        </span>
                                    </div>
                                    
                                    {/* Rarity Indicator - Discrete Dot */}
                                    <div className={`absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ${item.def?.tier === 5 ? 'animate-pulse' : ''}`} style={{ backgroundColor: styles.dotColor, boxShadow: styles.shadow || undefined }} title={`Tier ${item.def?.tier}`} />
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
                            const normalized = chestName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                            
                            if (normalized.includes('skin') && normalized.includes('comum')) type = 'Skin Comum';
                            else if (normalized.includes('incomum')) type = 'Incomum';
                            else if (normalized.includes('raro') || normalized.includes('radiante')) type = 'Raro';
                            else if (normalized.includes('ciclo')) type = 'Ciclo';
                            else if (normalized.includes('epico')) type = '\u00C9pico';
                            else if (normalized.includes('season')) type = 'Season';
                            else if (normalized.includes('lendario') || normalized.includes('legendary')) type = 'Lend\u00E1rio';
                            
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

