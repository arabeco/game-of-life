import React, { useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { resolveItemDef, getCatalogItems, isForgeEligibleItem, ItemCategory } from '../../constants/items';
import { ECONOMY } from '../../constants/economy';
import { RefreshCwIcon, Trash2Icon } from '../Icons';
import { getTierVisual, withAlpha } from '../../constants/rarityVisuals';
import { ItemArt } from '../ItemArt';
import { ItemDetailModal } from '../ItemDetailModal';

type ForgeTab = 'craft' | 'recycle';

const CATEGORY_LABELS: Record<ItemCategory, string> = {
    skin: 'Skin',
    hair: 'Cabelo',
    border: 'Borda',
    banner: 'Banner',
    glyph: 'Glifo',
    aura: 'Aura',
    ui_skin: 'Tema',
    artifact: 'Artefato',
    orb: 'Orbe',
    plate: 'Placa',
    chest: 'Bau',
    insignia: 'Insignia',
    insignias: 'Insignia',
};

export const TheForge: React.FC = () => {
    const { userProfile, craftItem, recycleItem, inventory } = useGame();
    const [activeTab, setActiveTab] = useState<ForgeTab>('craft');
    const [selectedTier, setSelectedTier] = useState<number>(1);
    const [processing, setProcessing] = useState<string | null>(null);
    const [confirmRecycleId, setConfirmRecycleId] = useState<string | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const craftableItems = useMemo(() => {
        return getCatalogItems(item => item.tier === selectedTier && isForgeEligibleItem(item));
    }, [selectedTier]);

    const categories = useMemo(() => {
        if (selectedTier < 4) return [];
        return Array.from(new Set(craftableItems.map(item => item.category)));
    }, [craftableItems, selectedTier]);

    const selectedItem = selectedItemId ? resolveItemDef(selectedItemId) : null;

    const recyclables = useMemo(() => {
        return inventory
            .filter(inst => !inst.isEquipped)
            .map(inst => ({ ...inst, def: resolveItemDef(inst.id) }))
            .filter(item => item.def);
    }, [inventory]);

    const getCraftCost = (tier: number) => {
        switch (tier) {
            case 1: return ECONOMY.craft_costs.tier_1;
            case 2: return ECONOMY.craft_costs.tier_2;
            case 3: return ECONOMY.craft_costs.tier_3;
            case 4: return ECONOMY.craft_costs.tier_4;
            case 5: return ECONOMY.craft_costs.tier_5;
            default: return 0;
        }
    };

    const getRecycleValue = (tier: number) => {
        switch (tier) {
            case 1: return ECONOMY.recycle_values.tier_1;
            case 2: return ECONOMY.recycle_values.tier_2;
            case 3: return ECONOMY.recycle_values.tier_3;
            case 4: return ECONOMY.recycle_values.tier_4;
            case 5: return ECONOMY.recycle_values.tier_5;
            default: return 0;
        }
    };

    const getTierStyles = (tier: number) => {
        const visual = getTierVisual(tier);
        return {
            borderColor: withAlpha(visual.rgb, 0.28),
            badgeColor: visual.hex,
        };
    };

    const handleCraft = async (itemOrCategory: string, isCategory: boolean) => {
        if (processing) return;
        setProcessing(`craft-${itemOrCategory}`);
        try {
            if (isCategory) await craftItem(selectedTier, itemOrCategory);
            else await craftItem(selectedTier, undefined, itemOrCategory);
        } catch (error) {
            console.error('Craft failed', error);
        } finally {
            setProcessing(null);
        }
    };

    const handleRecycle = async (instanceId: string) => {
        if (confirmRecycleId !== instanceId) {
            setConfirmRecycleId(instanceId);
            return;
        }

        if (processing) return;
        setProcessing(`recycle-${instanceId}`);
        try {
            await recycleItem(instanceId);
        } catch (error) {
            console.error('Recycle failed', error);
        } finally {
            setProcessing(null);
            setConfirmRecycleId(null);
        }
    };

    return (
        <div className="the-forge-root space-y-6 animate-fade-in">
            <div className="flex justify-center space-x-3">
                <button onClick={() => setActiveTab('craft')} className={`forge-subtab-button min-w-[7.5rem] rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${activeTab === 'craft' ? 'luxe-skin-button forge-subtab-button-active' : 'luxe-button-secondary forge-subtab-button-inactive'}`}>
                    Forjar
                </button>
                <button onClick={() => setActiveTab('recycle')} className={`forge-subtab-button min-w-[7.5rem] rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${activeTab === 'recycle' ? 'luxe-skin-button forge-subtab-button-active' : 'luxe-button-secondary forge-subtab-button-inactive'}`}>
                    Reciclar
                </button>
            </div>

            {activeTab === 'craft' && (
                <div className="space-y-5">
                    <div className="forge-tier-strip flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/10 overflow-x-auto">
                        {[1, 2, 3, 4, 5].map((tier) => (
                            <button key={tier} onClick={() => setSelectedTier(tier)} className={`forge-tier-button flex-1 min-w-[64px] rounded-xl py-2 text-sm font-bold transition-all ${selectedTier === tier ? 'luxe-skin-button forge-tier-button-active' : 'luxe-button-secondary forge-tier-button-inactive'}`}>
                                T{tier}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <div>
                            <div className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Custo de Forja</div>
                            <div className="mt-1 text-2xl font-black text-cyan-300">{getCraftCost(selectedTier)} <span className="text-sm">💎</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Saldo</div>
                            <div className="mt-1 text-lg font-black text-white">{userProfile.wallet?.fragments || 0}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {selectedTier <= 3 ? (
                            craftableItems.map((item) => {
                                const styles = getTierStyles(item.tier);
                                return (
                                    <div key={item.id} className="space-y-2">
                                        <GlassCard onClick={() => setSelectedItemId(item.id)} className="relative aspect-square p-2 flex flex-col items-center justify-center border cursor-pointer hover:border-white/40 transition-colors" style={{ borderColor: styles.borderColor }}>
                                            <div className="flex items-center justify-center w-full h-full mb-3">
                                                <ItemArt src={item.imageUrl} alt={item.name} icon={item.icon} category={item.category} className="w-3/4 h-3/4 flex items-center justify-center" imgClassName="w-full h-full object-contain" iconClassName="text-2xl" />
                                            </div>
                                            <div className="absolute top-1.5 right-1.5 rounded-full bg-black/50 border border-white/10 px-1.5 py-1 text-[8px] font-black uppercase tracking-[0.16em]" style={{ color: styles.badgeColor }}>T{item.tier}</div>
                                            <div className="absolute bottom-2 left-1 right-1 text-center">
                                                <span className="block truncate text-[9px] font-bold uppercase tracking-wider text-white">{item.name}</span>
                                                <span className="block text-[8px] uppercase tracking-[0.18em] text-gray-500 mt-0.5">{CATEGORY_LABELS[item.category]}</span>
                                            </div>
                                        </GlassCard>

                                        <button onClick={(event) => { event.stopPropagation(); handleCraft(item.id, false); }} disabled={!!processing || (userProfile.wallet?.fragments || 0) < getCraftCost(item.tier)} className="luxe-skin-button h-8 w-full rounded-xl text-[10px] font-black uppercase tracking-[0.18em] inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <span>{processing === `craft-${item.id}` ? '...' : 'Forjar'}</span>
                                        </button>
                                    </div>
                                );
                            })
                        ) : (
                            categories.map((category) => {
                                const styles = getTierStyles(selectedTier);
                                return (
                                    <div key={category} className="space-y-2">
                                        <GlassCard className="relative aspect-square p-4 flex flex-col items-center justify-center border text-center" style={{ borderColor: styles.borderColor }}>
                                            <div className="text-5xl mb-3">✦</div>
                                            <div className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: styles.badgeColor }}>{CATEGORY_LABELS[category]}</div>
                                            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-gray-500">Item aleatorio</div>
                                            <div className="absolute top-1.5 right-1.5 rounded-full bg-black/50 border border-white/10 px-1.5 py-1 text-[8px] font-black uppercase tracking-[0.16em]" style={{ color: styles.badgeColor }}>T{selectedTier}</div>
                                        </GlassCard>

                                        <button onClick={() => handleCraft(category, true)} disabled={!!processing || (userProfile.wallet?.fragments || 0) < getCraftCost(selectedTier)} className="luxe-skin-button h-8 w-full rounded-xl text-[10px] font-black uppercase tracking-[0.18em] inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <span>{processing === `craft-${category}` ? '...' : 'Tentar sorte'}</span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {selectedTier <= 3 && craftableItems.length === 0 && <div className="text-center py-12 text-gray-500">Nenhum item disponivel para este tier.</div>}
                </div>
            )}

            {activeTab === 'recycle' && (
                <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                        <p className="text-red-300 text-sm">Reciclar destrói o item e devolve fragmentos.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {recyclables.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">Nenhum item reciclavel no inventario.</div>
                        ) : (
                            recyclables.map((item) => (
                                <div key={item.instanceId} onClick={() => setSelectedItemId(item.id)} className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors gap-3 cursor-pointer">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                                            <ItemArt src={item.def?.imageUrl} alt={item.def?.name || item.id} icon={item.def?.icon} category={item.def?.category} className="w-10 h-10 flex items-center justify-center" imgClassName="w-full h-full object-contain" iconClassName="text-xl" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm truncate text-white">{item.def?.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-[0.18em]">T{item.def?.tier} · {CATEGORY_LABELS[item.def?.category || 'artifact']}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right">
                                            <div className="text-cyan-300 font-black">+{getRecycleValue(item.def?.tier || 1)}</div>
                                            <div className="text-[9px] uppercase tracking-[0.18em] text-gray-500">Fragmentos</div>
                                        </div>
                                        <button onClick={(event) => { event.stopPropagation(); handleRecycle(item.instanceId); }} disabled={!!processing} className={`h-10 min-w-[44px] px-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${confirmRecycleId === item.instanceId ? 'bg-red-500 text-white animate-pulse' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'}`}>
                                            {processing === `recycle-${item.instanceId}` ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : confirmRecycleId === item.instanceId ? <span className="text-[10px] font-black uppercase tracking-[0.12em]">Confirmar</span> : <Trash2Icon className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    type="catalog"
                    onClose={() => setSelectedItemId(null)}
                />
            )}
        </div>
    );
};
