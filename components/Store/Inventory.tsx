import React, { useState, useMemo, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { ItemDef, resolveItemDef, isItemCatalogVisible } from '../../constants/items';
import { CheckIcon, SovereignIcon } from '../Icons';
import { SovereignCustomizer } from '../SovereignCustomizer';
import { ItemDetailModal } from '../ItemDetailModal';
import { useSensoryFeedback } from '../../hooks/useSensoryFeedback';
import { ChestType } from '../../types';
import { getChestDisplayName, getChestRarity, getChestTier, getChestVisual, getTierVisual, withAlpha } from '../../constants/rarityVisuals';
import { getChestArtUrl } from '../../constants/catalogAssets';
import { ItemArt } from '../ItemArt';
import { resolveCatalogAssetUrl } from '../../constants/catalogAssets';

type InventoryTab = 'all' | 'sovereign' | 'glyph' | 'interface' | 'honors' | 'chests';
type InventoryEntry = {
    id: string;
    instanceId: string;
    acquiredAt: string;
    isEquipped?: boolean;
    def?: ItemDef;
    count?: number;
};

const HONOR_CATEGORIES = new Set(['insignia', 'insignias']);
const NON_INVENTORY_CATEGORIES = new Set(['hair']);
const isHonorCategory = (category?: string) => HONOR_CATEGORIES.has(String(category || ''));
const isNonInventoryCategory = (category?: string) => NON_INVENTORY_CATEGORIES.has(String(category || ''));

const TABS: { id: InventoryTab; label: string; categories: string[] }[] = [
    { id: 'all', label: 'Tudo', categories: [] },
    { id: 'sovereign', label: 'Soberano', categories: ['skin', 'artifact'] },
    { id: 'glyph', label: 'Glifo', categories: ['glyph', 'aura', 'orb', 'plate'] },
    { id: 'interface', label: 'Interface', categories: ['border', 'ui_skin', 'banner'] },
    { id: 'honors', label: 'Honras', categories: ['insignia', 'insignias'] },
    { id: 'chests', label: 'Baus', categories: ['chest'] },
];

export const Inventory: React.FC = () => {
    const { inventory, userProfile, updateUserProfile, openChest, showToast } = useGame();
    const [activeTab, setActiveTab] = useState<InventoryTab>('all');
    
    // --- Editors State ---
    const [showSovereignEditor, setShowSovereignEditor] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{ def: ItemDef, instanceId: string } | null>(null);
    const [avisoDoItem, setAvisoDoItem] = useState<string | null>(null);
    const [extrasDoBau, setExtrasDoBau] = useState<Array<{ label: string; value: string; simbolo?: 'ouro' | 'fragmento' | 'exp' }>>([]);
    // Enquanto o bau abre. Segura o modal do item para a animacao acontecer.
    const [abrindoBau, setAbrindoBau] = useState<ChestType | null>(null);
    const { trigger } = useSensoryFeedback();

    // Toda aba aparece para todo mundo. Quem nao liga para cosmetico simplesmente
    // nao entra nelas - esconder dava trabalho e nao devolvia nada.
    const visibleTabs = TABS;

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
        if (category === 'banner') return !!imageUrl && resolveCatalogAssetUrl(userProfile.bannerUrl) === imageUrl;
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
                deduped.set(item.id, { ...item, count: 1 });
                continue;
            }

            const currentStamp = Date.parse(current.acquiredAt || '');
            const nextStamp = Date.parse(item.acquiredAt || '');
            const shouldReplace =
                Boolean(item.isEquipped) ||
                (!current.isEquipped && (Number.isNaN(currentStamp) || (!Number.isNaN(nextStamp) && nextStamp > currentStamp)));

            if (isHonorCategory(item.def?.category)) {
                const nextCount = (current.count || 1) + 1;
                deduped.set(item.id, { ...(shouldReplace ? item : current), count: nextCount });
                continue;
            }

            if (shouldReplace) {
                deduped.set(item.id, { ...item, count: current.count || 1 });
            }
        }

        return Array.from(deduped.values());
    }, [inventory, userProfile]);

    const filteredItems = useMemo(() => {
        return sourceItems.filter(item => {
            if (isNonInventoryCategory(item.def?.category)) return false;
            if (activeTab === 'all') return !isHonorCategory(item.def?.category);
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

    // O emoji do bau passou a ser so a rede de seguranca: a arte de verdade vem
    // de getChestArtUrl. Vale lembrar o que estes emoji sao, porque nenhum deles
    // e um bau — o de "epico" e uma URNA DE VOTACAO e o de "comum" e a caixa de
    // saida de e-mail. Ficaram porque nao havia desenho; agora ha.
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
        if (normalized === 'season') return 'MÍTICO';
        if (normalized === 'lendario' || normalized === 'legendary') return 'LENDARIO';
        return type.toUpperCase();
    };

    const getChestItemDef = (type: string): ItemDef => {
        const normalized = type.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const rarity = getChestRarity(type);

        return {
            id: `chest_${normalized}`,
            name: getChestDisplayName(type),
            category: 'chest',
            tier: getChestTier(type),
            rarity,
            icon: getChestIcon(type),
            imageUrl: getChestArtUrl(type),
            description: 'Um baú contendo recompensas misteriosas. Abra para descobrir o que ha dentro!'
        };
    };

    const resolveChestTypeFromName = (chestName: string): ChestType => {
        let type: ChestType = 'Comum';
        const normalized = chestName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        if (normalized.includes('skin') && normalized.includes('comum')) type = 'Skin Comum';
        else if (normalized.includes('incomum')) type = 'Incomum';
        else if (normalized.includes('raro') || normalized.includes('radiante')) type = 'Raro';
        else if (normalized.includes('ciclo')) type = 'Ciclo';
        else if (normalized.includes('epico')) type = 'Épico';
        else if (normalized.includes('season')) type = 'Season';
        else if (normalized.includes('lendario') || normalized.includes('legendary')) type = 'Lendário';

        return type;
    };

    /**
     * Abrir o bau: fecha o modal do bau, mostra a abertura, entrega o item.
     *
     * O video de abertura foi retirado — o ChestOpeningModal nao era importado
     * por ninguem havia tempo, entao os cinco mp4 no storage nunca rodaram para
     * ninguem. No lugar dele fica uma abertura curta com haptico, e o premio
     * aparece no MODAL DO ITEM, com arte grande e descricao, em vez do modal de
     * recompensa, que carrega varias informacoes e rouba o foco do que saiu.
     *
     * Duplicata continua no modal de recompensa: ali nao ha item novo para
     * mostrar, o que interessa e quantos fragmentos entraram.
     */
    const handleInventoryChestOpen = async (chestName: string) => {
        const chestType = resolveChestTypeFromName(chestName);
        setSelectedItem(null);
        setExtrasDoBau([]);
        setAbrindoBau(chestType);
        trigger('impact');

        // A espera e do servidor; a pausa minima existe para a abertura nao
        // piscar quando a resposta volta rapido demais para o olho acompanhar.
        const [result] = await Promise.all([
            openChest(chestType),
            new Promise((resolve) => setTimeout(resolve, 900)),
        ]);

        setAbrindoBau(null);
        if (!result) return;

        // Duplicata cai no MESMO modal. O servidor ja sorteia primeiro entre o
        // que a pessoa nao tem; duplicata so acontece quando o patamar inteiro
        // ja e dela. Nesse caso o item existe e tem arte — o que muda e so o
        // que aconteceu com ele, e isso cabe numa linha.
        const recebido = result.itemId ? resolveItemDef(result.itemId) : null;
        if (recebido) {
            const extras: Array<{ label: string; value: string; simbolo?: 'ouro' | 'fragmento' }> = [];
            if (Number(result.fragmentsGained || 0) > 0) {
                extras.push({ label: 'Fragmentos', value: `+${result.fragmentsGained}`, simbolo: 'fragmento' });
            }
            if (Number(result.goldGained || 0) > 0) {
                extras.push({ label: 'Ouro', value: `+${result.goldGained}`, simbolo: 'ouro' });
            }
            setExtrasDoBau(extras);
            trigger(result.isDuplicate ? 'success' : 'fanfare');
            setAvisoDoItem(result.isDuplicate
                ? `Você já tinha este item. Convertido em +${result.fragmentsGained || 0} fragmentos.`
                : null);
            setSelectedItem({ def: recebido, instanceId: `bau-${result.itemId}` });
            return;
        }

        trigger('success');
        showToast(`Baú aberto. +${result.fragmentsGained || 0} fragmentos.`, 'success');
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
                            <p>Nenhum baú disponivel.</p>
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
                                    <ItemArt
                                        itemId={`chest-${chest.type}`}
                                        src={getChestArtUrl(chest.type)}
                                        alt={getChestLabel(chest.type)}
                                        icon={getChestIcon(chest.type)}
                                        category="chest"
                                        className="w-3/4 h-3/4 flex items-center justify-center"
                                        imgClassName="w-full h-full object-contain"
                                        iconClassName="text-4xl"
                                    />
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
                                    {isHonorCategory(item.def?.category) && (item.count || 1) > 1 && (
                                        <div className="absolute top-1 left-1 min-w-6 rounded-full border border-amber-300/40 bg-amber-400/20 px-1.5 py-0.5 text-center text-[10px] font-black text-amber-100 shadow-lg">
                                            x{item.count}
                                        </div>
                                    )}

                                    <div className="group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg flex items-center justify-center w-full h-full mb-3">
                                        <ItemArt
                                            itemId={item.id}
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
                                        {/* Duas linhas: os nomes das insignias deixaram de
                                            comecar pelo metal ("Ouro: Soberano" virou
                                            "Insignia do Soberano"), entao o nome util fica
                                            no fim e truncar em uma linha esconde justamente
                                            de quem a insignia e. */}
                                        <span className="line-clamp-2 block w-full text-[9px] font-bold uppercase leading-tight tracking-wider text-white drop-shadow-md">
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

            {/* A abertura. Curta de proposito: cerimonia longa em acao repetida
                vira pedagio, e bau se abre varias vezes por ciclo. */}
            {abrindoBau && (
                <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 bg-black/85 backdrop-blur-sm animate-fade-in">
                    <div
                        className="relative flex h-40 w-40 items-center justify-center rounded-3xl border animate-pulse"
                        style={{
                            borderColor: withAlpha(getChestVisual(abrindoBau).rgb, 0.5),
                            background: `radial-gradient(circle at 50% 45%, ${withAlpha(getChestVisual(abrindoBau).rgb, 0.28)}, transparent 70%)`,
                            boxShadow: `0 0 60px ${withAlpha(getChestVisual(abrindoBau).rgb, 0.35)}`,
                        }}
                    >
                        <img
                            src={getChestArtUrl(abrindoBau)}
                            alt=""
                            className="h-28 w-28 object-contain drop-shadow-2xl"
                        />
                    </div>
                    <p
                        className="text-[10px] font-black uppercase tracking-[0.3em]"
                        style={{ color: getChestVisual(abrindoBau).hex }}
                    >
                        Abrindo
                    </p>
                </div>
            )}

            {/* Editors Modals */}
            {selectedItem && (
                <ItemDetailModal 
                    item={selectedItem.def} 
                    instanceId={selectedItem.instanceId}
                    type="inventory" 
                    aviso={avisoDoItem || undefined}
                    focusMode={selectedItem.instanceId.startsWith('bau-')}
                    extrasRecebidos={extrasDoBau}
                    onClose={() => { setSelectedItem(null); setAvisoDoItem(null); setExtrasDoBau([]); }}
                    onOpen={() => {
                        if (selectedItem.def.category === 'chest') {
                            void handleInventoryChestOpen(selectedItem.def.name);
                        }
                    }} 
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
