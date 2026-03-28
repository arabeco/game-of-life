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
        return getCatalogItems((item) => item.tier === selectedTier && isForgeEligibleItem(item));
    }, [selectedTier]);

    const categories = useMemo(() => {
        if (selectedTier < 4) return [];
        return Array.from(new Set(craftableItems.map((item) => item.category)));
    }, [craftableItems, selectedTier]);

    const selectedItem = selectedItemId ? resolveItemDef(selectedItemId) : null;

    const recyclables = useMemo(() => {
        return inventory
            .filter((inst) => !inst.isEquipped)
            .map((inst) => ({ ...inst, def: resolveItemDef(inst.id) }))
            .filter((item) => item.def);
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
        <div className="the-forge-root space-y-5 animate-fade-in pb-8">
            <GlassCard variant="neutral" className="overflow-hidden border-white/10 p-3">
                <div className="space-y-3">
                    <div className="flex justify-center gap-3">
                        <button onClick={() => setActiveTab('craft')} className={`forge-subtab-button min-w-[7.5rem] rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${activeTab === 'craft' ? 'luxe-skin-button forge-subtab-button-active' : 'luxe-button-secondary forge-subtab-button-inactive'}`}>
                            Forjar
                        </button>
                        <button onClick={() => setActiveTab('recycle')} className={`forge-subtab-button min-w-[7.5rem] rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition-all ${activeTab === 'recycle' ? 'luxe-skin-button forge-subtab-button-active' : 'luxe-button-secondary forge-subtab-button-inactive'}`}>
                            Reciclar
                        </button>
                    </div>

                    {activeTab === 'craft' ? (
                        <>
                            <div className="forge-tier-strip flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-1.5 hide-scrollbar">
                                {[1, 2, 3, 4, 5].map((tier) => (
                                    <button key={tier} onClick={() => setSelectedTier(tier)} className={`forge-tier-button min-w-[64px] flex-1 rounded-xl py-2 text-sm font-bold transition-all ${selectedTier === tier ? 'luxe-skin-button forge-tier-button-active' : 'luxe-button-secondary forge-tier-button-inactive'}`}>
                                        T{tier}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/15 p-3">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Custo de forja</div>
                                    <div className="mt-1 text-2xl font-black text-cyan-300">
                                        {getCraftCost(selectedTier)} <span className="text-sm">💎</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Saldo</div>
                                    <div className="mt-1 text-2xl font-black text-white">{userProfile.wallet?.fragments || 0}</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center">
                            <p className="text-sm text-red-300">Reciclar destroi o item e devolve fragmentos.</p>
                        </div>
                    )}
                </div>
            </GlassCard>

            {activeTab === 'craft' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {selectedTier <= 3 ? (
                            craftableItems.map((item) => {
                                const styles = getTierStyles(item.tier);
                                return (
                                    <div key={item.id} className="space-y-2">
                                        <GlassCard onClick={() => setSelectedItemId(item.id)} className="relative group aspect-square border p-2 transition-all cursor-pointer hover:border-white/50" style={{ borderColor: styles.borderColor }}>
                                            <div className="flex h-full w-full items-center justify-center pb-5">
                                                <ItemArt src={item.imageUrl} alt={item.name} icon={item.icon} category={item.category} className="flex h-3/4 w-3/4 items-center justify-center" imgClassName="h-full w-full object-contain" iconClassName="text-2xl" />
                                            </div>
                                            <div className="absolute top-1.5 right-1.5 rounded-full border border-white/10 bg-black/50 px-1.5 py-1 text-[8px] font-black uppercase tracking-[0.16em]" style={{ color: styles.badgeColor }}>
                                                T{item.tier}
                                            </div>
                                            <div className="absolute bottom-2 left-1 right-1 text-center">
                                                <span className="block truncate text-[9px] font-bold uppercase tracking-wider text-white">{item.name}</span>
                                                <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-[0.18em] text-gray-500">{CATEGORY_LABELS[item.category]}</span>
                                            </div>
                                        </GlassCard>

                                        <button onClick={(event) => { event.stopPropagation(); handleCraft(item.id, false); }} disabled={!!processing || (userProfile.wallet?.fragments || 0) < getCraftCost(item.tier)} className="luxe-skin-button inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50">
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
                                        <GlassCard className="relative group aspect-square border p-4 text-center" style={{ borderColor: styles.borderColor }}>
                                            <div className="mb-3 text-5xl">✦</div>
                                            <div className="text-sm font-black uppercase tracking-[0.18em]" style={{ color: styles.badgeColor }}>{CATEGORY_LABELS[category]}</div>
                                            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-gray-500">Item aleatorio</div>
                                            <div className="absolute top-1.5 right-1.5 rounded-full border border-white/10 bg-black/50 px-1.5 py-1 text-[8px] font-black uppercase tracking-[0.16em]" style={{ color: styles.badgeColor }}>
                                                T{selectedTier}
                                            </div>
                                        </GlassCard>

                                        <button onClick={() => handleCraft(category, true)} disabled={!!processing || (userProfile.wallet?.fragments || 0) < getCraftCost(selectedTier)} className="luxe-skin-button inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50">
                                            <span>{processing === `craft-${category}` ? '...' : 'Tentar sorte'}</span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {selectedTier <= 3 && craftableItems.length === 0 && (
                        <GlassCard variant="neutral" className="border-dashed border-white/10 px-4 py-12 text-center">
                            <div className="text-sm font-semibold text-white/80">Nenhum item disponivel para este tier.</div>
                        </GlassCard>
                    )}
                </div>
            )}

            {activeTab === 'recycle' && (
                <GlassCard variant="neutral" className="space-y-3 border-white/10 p-3">
                    <div className="grid grid-cols-1 gap-3">
                        {recyclables.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">Nenhum item reciclavel no inventario.</div>
                        ) : (
                            recyclables.map((item) => (
                                <div key={item.instanceId} onClick={() => setSelectedItemId(item.id)} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/40 p-3 transition-colors hover:border-white/10">
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/5">
                                            <ItemArt src={item.def?.imageUrl} alt={item.def?.name || item.id} icon={item.def?.icon} category={item.def?.category} className="flex h-10 w-10 items-center justify-center" imgClassName="h-full w-full object-contain" iconClassName="text-xl" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-bold text-white">{item.def?.name}</div>
                                            <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">T{item.def?.tier} · {CATEGORY_LABELS[item.def?.category || 'artifact']}</div>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-3">
                                        <div className="text-right">
                                            <div className="font-black text-cyan-300">+{getRecycleValue(item.def?.tier || 1)}</div>
                                            <div className="text-[9px] uppercase tracking-[0.18em] text-gray-500">Fragmentos</div>
                                        </div>
                                        <button onClick={(event) => { event.stopPropagation(); handleRecycle(item.instanceId); }} disabled={!!processing} className={`flex h-10 min-w-[44px] items-center justify-center gap-2 rounded-xl px-3 transition-colors ${confirmRecycleId === item.instanceId ? 'bg-red-500 text-white animate-pulse' : 'border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                                            {processing === `recycle-${item.instanceId}`
                                                ? <RefreshCwIcon className="h-4 w-4 animate-spin" />
                                                : confirmRecycleId === item.instanceId
                                                    ? <span className="text-[10px] font-black uppercase tracking-[0.12em]">Confirmar</span>
                                                    : <Trash2Icon className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>
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
