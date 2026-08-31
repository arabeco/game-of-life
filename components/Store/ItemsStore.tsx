import React, { useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { getCatalogItems, ItemDef, ItemCategory } from '../../constants/items';
import { ACTIVE_GOLD_STORE_ITEM_IDS } from '../../constants/goldCatalog';
import { ItemArt } from '../ItemArt';
import { ItemDetailModal } from '../ItemDetailModal';
import { ConfirmationModal } from '../ConfirmationModal';

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

/**
 * O nome da raridade em portugues.
 *
 * A tela mostrava `item.rarity` cru, que e a chave do banco: COMMON, RARE,
 * LEGENDARY. Chave de dados nao e texto de interface — e a unica palavra em
 * ingles de um app inteiro em portugues fica sublinhada na tela.
 */
const RARITY_LABELS: Record<string, string> = {
    common: 'Comum',
    uncommon: 'Incomum',
    rare: 'Raro',
    epic: 'Épico',
    legendary: 'Lendário',
    mythic: 'Mítico',
};

const RARITY_STYLES: Record<string, string> = {
    common: 'border-white/10 bg-white/5 text-gray-300',
    uncommon: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    rare: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
    epic: 'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300',
    legendary: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
};

export const ItemsStore: React.FC = () => {
    const { buyStoreItem, inventory, userProfile } = useGame();
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<ItemDef | null>(null);
    const [pendingPurchaseItem, setPendingPurchaseItem] = useState<ItemDef | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'all' | ItemDef['category']>('all');

    const items = useMemo(() => {
        const lowTicketIds = new Set<string>(ACTIVE_GOLD_STORE_ITEM_IDS);
        const catalog = getCatalogItems(item => lowTicketIds.has(item.id) && item.category !== 'hair');
        const order = new Map<string, number>(ACTIVE_GOLD_STORE_ITEM_IDS.map((id, index) => [id, index]));

        return [...catalog].sort((a, b) => {
            const left = order.get(a.id) ?? 999;
            const right = order.get(b.id) ?? 999;
            return left - right;
        });
    }, []);

    const ownedItemIds = useMemo(() => {
        const ids = new Set(inventory.map((item) => item.id));
        Object.entries(userProfile.unlockedItems?.ui_skins || {}).forEach(([itemId, isUnlocked]) => {
            if (isUnlocked) ids.add(itemId);
        });
        return ids;
    }, [inventory, userProfile.unlockedItems]);
    const availableCategories = useMemo(() => {
        const ids = Array.from(new Set<ItemCategory>(items.map((item) => item.category)));
        return ids.map((category) => ({
            id: category,
            label: STORE_CATEGORY_LABELS[category] || category,
        }));
    }, [items]);
    const filteredItems = useMemo(() => {
        const normalizedQuery = searchQuery
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

        return items.filter((item) => {
            if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
            if (!normalizedQuery) return true;

            const haystack = [
                item.name,
                item.category,
                STORE_CATEGORY_LABELS[item.category],
                item.rarity,
                `t${item.tier}`,
            ]
                .filter(Boolean)
                .join(' ')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();

            return haystack.includes(normalizedQuery);
        });
    }, [items, searchQuery, selectedCategory]);

    const handleBuy = async (event: React.MouseEvent<HTMLButtonElement>, item: ItemDef) => {
        event.stopPropagation();
        if (loading || !item.costGold || ownedItemIds.has(item.id)) return;
        setPendingPurchaseItem(item);
    };

    const handleConfirmBuy = async () => {
        if (!pendingPurchaseItem || !pendingPurchaseItem.costGold) return;
        setLoading(pendingPurchaseItem.id);
        try {
            await buyStoreItem(pendingPurchaseItem.id, 'exclusive');
        } catch (error) {
            console.error('Store item purchase failed', error);
        } finally {
            setLoading(null);
            setPendingPurchaseItem(null);
        }
    };

    return (
        <>
            <div className="space-y-3 animate-fade-in pb-8">
                <GlassCard variant="neutral" className="overflow-hidden border-white/10 p-3">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Buscar item, raridade ou tipo..."
                                className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[var(--skin-accent-color)]/35"
                            />
                            <div className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                                {filteredItems.length}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {/* "Tipos de item" rotulava uma fileira de chips que ja
                                se explica, e "10 a 500" anunciava a faixa de preco de
                                um catalogo inteiro — informacao que nao ajuda a
                                escolher nada. As duas ocupavam uma linha inteira. */}
                            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory('all')}
                                    className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                >
                                    Todos
                                </button>
                                {availableCategories.map((category) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] whitespace-nowrap transition-all ${selectedCategory === category.id ? 'luxe-skin-button' : 'luxe-button-secondary'}`}
                                    >
                                        {category.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {filteredItems.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {filteredItems.map((item) => {
                        const alreadyOwns = ownedItemIds.has(item.id);
                        const isBusy = loading === item.id;

                        return (
                            <div key={item.id} className="space-y-2">
                            <GlassCard
                                onClick={() => setSelectedItem(item)}
                                className="relative group aspect-square p-2 flex flex-col items-center justify-center transition-all border cursor-pointer hover:border-white/50"
                                style={{ borderColor: 'var(--skin-accent-color)' }}
                            >
                                <div className="group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg flex items-center justify-center w-full h-full mb-3">
                                    <ItemArt
                                        itemId={item.id}
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
                                    <span className="line-clamp-2 block w-full text-[9px] font-bold uppercase leading-tight tracking-wider text-white drop-shadow-md">{item.name}</span>
                                    <span className="block text-[8px] uppercase tracking-[0.18em] text-gray-500 font-bold mt-0.5">{STORE_CATEGORY_LABELS[item.category]} · T{item.tier}</span>
                                </div>

                                <div className={`absolute top-1.5 right-1.5 px-1.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-[0.18em] border ${RARITY_STYLES[item.rarity] ?? 'border-white/10 bg-white/5 text-gray-300'}`}>
                                    {RARITY_LABELS[item.rarity] || item.rarity}
                                </div>

                                {/* "Ja possui" era um BOTAO desabilitado numa faixa
                                    propria embaixo do card: uma linha inteira, em todo
                                    item que voce ja tem, para dizer que nao ha nada a
                                    fazer. Item que voce tem nao precisa de botao — precisa
                                    de um selo. O espaco vai para os que voce ainda pode
                                    comprar. */}
                                {alreadyOwns && (
                                    <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-[10px] leading-none text-emerald-200">
                                        ✓
                                    </div>
                                )}
                            </GlassCard>

                            {!alreadyOwns && (
                            <button
                                onClick={(event) => handleBuy(event, item)}
                                disabled={!!loading || !item.costGold}
                                className={`h-8 w-full rounded-xl text-[10px] font-black uppercase tracking-[0.18em] inline-flex items-center justify-center gap-1.5 transition-all luxe-skin-button ${
                                    (!!loading || !item.costGold) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                <span className="text-[11px] leading-none">🪙</span>
                                <span>{isBusy ? '...' : item.costGold}</span>
                            </button>
                            )}
                            </div>
                        );
                    })}
                </div>
                ) : (
                    <GlassCard variant="neutral" className="border-dashed border-white/10 px-4 py-12 text-center">
                        <div className="text-sm font-semibold text-white/80">Nenhum item encontrado.</div>
                        <div className="mt-1 text-xs text-white/45">Tente mudar a busca ou o filtro.</div>
                    </GlassCard>
                )}
            </div>

            {selectedItem && (
                <ItemDetailModal
                    item={selectedItem}
                    type="catalog"
                    onClose={() => setSelectedItem(null)}
                />
            )}
            {pendingPurchaseItem && pendingPurchaseItem.costGold && (
                <ConfirmationModal
                    title="Confirmar compra"
                    message={`${pendingPurchaseItem.name} vai debitar ${pendingPurchaseItem.costGold} ouro da sua conta. Deseja continuar?`}
                    confirmLabel={`COMPRAR · ${pendingPurchaseItem.costGold} 🪙`}
                    onConfirm={() => { void handleConfirmBuy(); }}
                    onCancel={() => setPendingPurchaseItem(null)}
                />
            )}
        </>
    );
};
