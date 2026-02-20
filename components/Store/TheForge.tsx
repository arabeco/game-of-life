import React, { useState, useMemo } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { ITEMS_DB, ItemDef } from '../../constants/items';
import { ECONOMY } from '../../constants/economy';
import { CheckIcon, SparklesIcon, RefreshCwIcon, Trash2Icon } from '../Icons';

type ForgeTab = 'craft' | 'recycle';

export const TheForge: React.FC = () => {
    const { userProfile, craftItem, recycleItem, inventory } = useGame();
    const [activeTab, setActiveTab] = useState<ForgeTab>('craft');
    const [selectedTier, setSelectedTier] = useState<number>(1);
    const [processing, setProcessing] = useState<string | null>(null);

    // --- CRAFTING LOGIC ---
    const craftableItems = useMemo(() => {
        return ITEMS_DB.filter(item => item.tier === selectedTier && !item.isGoldExclusive && !item.isSeasonExclusive);
    }, [selectedTier]);

    // Group by category for T4/T5
    const categories = useMemo(() => {
        if (selectedTier < 4) return [];
        const cats = new Set(craftableItems.map(i => i.category));
        return Array.from(cats);
    }, [craftableItems, selectedTier]);

    const handleCraft = async (itemOrCategory: string, isCategory: boolean) => {
        if (processing) return;
        setProcessing(`craft-${itemOrCategory}`);
        
        try {
            if (isCategory) {
                await craftItem(selectedTier, itemOrCategory);
            } else {
                await craftItem(selectedTier, undefined, itemOrCategory);
            }
        } catch (error) {
            console.error("Craft failed", error);
        } finally {
            setProcessing(null);
        }
    };

    const getCraftCost = (tier: number) => {
        switch(tier) {
            case 1: return ECONOMY.craft_costs.tier_1;
            case 2: return ECONOMY.craft_costs.tier_2;
            case 3: return ECONOMY.craft_costs.tier_3;
            case 4: return ECONOMY.craft_costs.tier_4;
            case 5: return ECONOMY.craft_costs.tier_5;
            default: return 0;
        }
    };

    // --- RECYCLING LOGIC ---
    const recyclables = useMemo(() => {
        return inventory.filter(inst => !inst.isEquipped).map(inst => {
            const def = ITEMS_DB.find(d => d.id === inst.id);
            return { ...inst, def };
        }).filter(i => i.def); // Ensure definition exists
    }, [inventory]);

    const handleRecycle = async (instanceId: string) => {
        if (!confirm("Tem certeza que deseja reciclar este item? A ação é irreversível.")) return;
        if (processing) return;
        setProcessing(`recycle-${instanceId}`);
        try {
            await recycleItem(instanceId);
        } catch (error) {
            console.error("Recycle failed", error);
        } finally {
            setProcessing(null);
        }
    };

    const getRecycleValue = (tier: number) => {
        switch(tier) {
            case 1: return ECONOMY.recycle_values.tier_1;
            case 2: return ECONOMY.recycle_values.tier_2;
            case 3: return ECONOMY.recycle_values.tier_3;
            case 4: return ECONOMY.recycle_values.tier_4;
            case 5: return ECONOMY.recycle_values.tier_5;
            default: return 0;
        }
    };

    const getRarityColor = (tier: number) => {
        switch(tier) {
            case 1: return 'text-gray-400 border-gray-400/30';
            case 2: return 'text-green-400 border-green-400/30';
            case 3: return 'text-blue-400 border-blue-400/30';
            case 4: return 'text-purple-400 border-purple-400/30';
            case 5: return 'text-yellow-400 border-yellow-400/30';
            default: return 'text-gray-400 border-gray-400/30';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Forge Header / Tabs */}
            <div className="flex justify-center space-x-4 mb-6">
                <button 
                    onClick={() => setActiveTab('craft')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest transition-all ${activeTab === 'craft' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="mr-2">🔨</span> Forjar
                </button>
                <button 
                    onClick={() => setActiveTab('recycle')}
                    className={`px-6 py-2 rounded-full font-black uppercase tracking-widest transition-all ${activeTab === 'recycle' ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(248,113,113,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    <span className="mr-2">♻️</span> Reciclar
                </button>
            </div>

            {activeTab === 'craft' && (
                <div className="space-y-6">
                    {/* Tier Selector */}
                    <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/10 overflow-x-auto">
                        {[1, 2, 3, 4, 5].map(tier => (
                            <button
                                key={tier}
                                onClick={() => setSelectedTier(tier)}
                                className={`flex-1 min-w-[60px] py-2 rounded-lg font-bold text-sm transition-all ${selectedTier === tier ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                T{tier}
                            </button>
                        ))}
                    </div>

                    <div className="text-center mb-4">
                        <span className="text-sm text-gray-400 uppercase tracking-wider">Custo de Forja:</span>
                        <div className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                            {getCraftCost(selectedTier)} <span className="text-sm">💎</span>
                        </div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {selectedTier <= 3 ? (
                            // T1-T3: Specific Items
                            craftableItems.map(item => (
                                <GlassCard key={item.id} className={`p-4 flex flex-col items-center space-y-3 group hover:bg-white/5 transition-all border ${getRarityColor(item.tier).split(' ')[1]}`}>
                                    <div className="text-4xl group-hover:scale-110 transition-transform">{item.icon}</div>
                                    <div className="text-center">
                                        <div className={`font-bold text-sm ${getRarityColor(item.tier).split(' ')[0]}`}>{item.name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase">{item.category}</div>
                                    </div>
                                    <button 
                                        onClick={() => handleCraft(item.id, false)}
                                        disabled={!!processing || (userProfile.wallet?.fragments || 0) < getCraftCost(item.tier)}
                                        className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing === `craft-${item.id}` ? 'Forjando...' : 'Forjar'}
                                    </button>
                                </GlassCard>
                            ))
                        ) : (
                            // T4-T5: Category Lottery
                            categories.map(cat => (
                                <GlassCard key={cat} className={`p-6 flex flex-col items-center space-y-4 group hover:bg-white/5 transition-all border ${getRarityColor(selectedTier).split(' ')[1]}`}>
                                    <div className="text-5xl group-hover:animate-pulse">❓</div>
                                    <div className="text-center">
                                        <div className={`font-bold text-lg ${getRarityColor(selectedTier).split(' ')[0]}`}>{cat.toUpperCase()}</div>
                                        <div className="text-xs text-gray-500">Item Aleatório</div>
                                    </div>
                                    <button 
                                        onClick={() => handleCraft(cat, true)}
                                        disabled={!!processing || (userProfile.wallet?.fragments || 0) < getCraftCost(selectedTier)}
                                        className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-bold uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing === `craft-${cat}` ? 'Forjar...' : 'Tentar Sorte'}
                                    </button>
                                </GlassCard>
                            ))
                        )}
                        
                        {selectedTier <= 3 && craftableItems.length === 0 && (
                            <div className="col-span-full text-center py-10 text-gray-500">
                                Nenhum item disponível para forjar neste tier.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'recycle' && (
                <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center mb-6">
                        <p className="text-red-300 text-sm">Reciclar itens destrói o item permanentemente e devolve Fragmentos.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {recyclables.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                Nenhum item reciclável no inventário.
                            </div>
                        ) : (
                            recyclables.map(item => (
                                <div key={item.instanceId} className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-2xl">{item.def?.icon}</div>
                                        <div>
                                            <div className={`font-bold text-sm ${getRarityColor(item.def?.tier || 1).split(' ')[0]}`}>{item.def?.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase">T{item.def?.tier} • {item.def?.category}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                        <div className="flex flex-col items-end">
                                            <span className="text-cyan-400 font-bold">+{getRecycleValue(item.def?.tier || 1)}</span>
                                            <span className="text-[9px] text-gray-500 uppercase">Fragmentos</span>
                                        </div>
                                        <button 
                                            onClick={() => handleRecycle(item.instanceId)}
                                            disabled={!!processing}
                                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                        >
                                            {processing === `recycle-${item.instanceId}` ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : <Trash2Icon className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
