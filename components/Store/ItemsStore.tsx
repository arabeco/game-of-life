import React, { useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { getCatalogItems, ItemDef } from '../../constants/items';
import { ItemArt } from '../ItemArt';
import { ItemDetailModal } from '../ItemDetailModal';

const LOW_TICKET_ITEM_IDS = [
    'item_skin_1_003',
    'item_skin_2_003',
    'item_orb_2_003',
    'item_skin_3_001',
    'item_banner_imparavel',
    'item_skin_3_002',
    'item_skin_3_003',
    'item_orb_3_001',
    'item_banner_t3_mistico',
    'item_banner_lendaviva',
    'item_banner_t4_oraculo',
    'item_skin_4_001',
] as const;

const STORE_CATEGORY_LABELS: Record<ItemDef['category'], string> = {
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
    chest: 'Baú',
    insignia: 'Insígnia',
    insignias: 'Insígnia',
};

const RARITY_STYLES: Record<string, string> = {
    common: 'border-white/10 bg-white/5 text-gray-300',
    uncommon: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    rare: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
    epic: 'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300',
    legendary: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
};

export const ItemsStore: React.FC = () => {
    const { buyStoreItem } = useGame();
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<ItemDef | null>(null);

    const items = useMemo(() => {
        const lowTicketIds = new Set<string>(LOW_TICKET_ITEM_IDS);
        const catalog = getCatalogItems(item => lowTicketIds.has(item.id));
        const order = new Map<string, number>(LOW_TICKET_ITEM_IDS.map((id, index) => [id, index]));

        return [...catalog].sort((a, b) => {
            const left = order.get(a.id) ?? 999;
            const right = order.get(b.id) ?? 999;
            return left - right;
        });
    }, []);

    const handleBuy = async (event: React.MouseEvent<HTMLButtonElement>, item: ItemDef) => {
        event.stopPropagation();
        if (loading || !item.costGold) return;
        setLoading(item.id);
        try {
            await buyStoreItem(item.id, 'exclusive');
        } catch (error) {
            console.error('Store item purchase failed', error);
        } finally {
            setLoading(null);
        }
    };

    return (
        <>
            <div className="space-y-5 animate-fade-in">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-white">Itens por Ouro</h3>
                        <p className="text-sm text-gray-500">Seleção compacta de skins, orbes e banners fortes.</p>
                    </div>
                    <div className="px-3 py-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
                        5 a 50
                    </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {items.map((item) => (
                        <div key={item.id} className="space-y-2">
                            <GlassCard
                                onClick={() => setSelectedItem(item)}
                                className="relative group aspect-square p-2 flex flex-col items-center justify-center transition-all border cursor-pointer hover:border-white/50"
                                style={{ borderColor: 'var(--skin-accent-color)' }}
                            >
                                <div className="group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg flex items-center justify-center w-full h-full mb-3">
                                    <ItemArt
                                        src={item.imageUrl}
                                        alt={item.name}
                                        icon={item.icon}
                                        category={item.category}
                                        className="w-3/4 h-3/4 flex items-center justify-center"
                                        imgClassName="w-full h-full object-contain"
                                        iconClassName="text-2xl"
                                        emojiSize="action"
                                    />
                                </div>

                                <div className="absolute bottom-2 left-1 right-1 text-center">
                                    <span className="text-[9px] font-bold text-white uppercase tracking-wider truncate block w-full drop-shadow-md">{item.name}</span>
                                    <span className="block text-[8px] uppercase tracking-[0.18em] text-gray-500 font-bold mt-0.5">{STORE_CATEGORY_LABELS[item.category]} · T{item.tier}</span>
                                </div>

                                <div className={`absolute top-1.5 right-1.5 px-1.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-[0.18em] border ${RARITY_STYLES[item.rarity] ?? 'border-white/10 bg-white/5 text-gray-300'}`}>
                                    {item.rarity}
                                </div>
                            </GlassCard>

                            <button
                                onClick={(event) => handleBuy(event, item)}
                                disabled={!!loading || !item.costGold}
                                className="luxe-skin-button h-8 w-full rounded-xl text-[10px] font-black uppercase tracking-[0.18em] inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="text-[11px] leading-none">🪙</span>
                                <span>{loading === item.id ? '...' : item.costGold}</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    type="catalog"
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </>
    );
};
