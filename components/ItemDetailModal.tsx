import React from 'react';
import { useGame } from '../contexts/GameContext';
import { useConfirmation } from '../hooks/useConfirmation';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon, Trash2Icon, GiftIcon } from './Icons';
import { ITEMS_DB, ItemDef, ItemCategory, isItemCatalogVisible, isForgeEligibleItem } from '../constants/items';
import { ECONOMY } from '../constants/economy';
import { resolveCatalogAssetUrl } from '../constants/catalogAssets';
import { UnlockCategory } from '../types';
import { ItemArt } from './ItemArt';
import { ValorIcon } from './ValorIcon';
import { getRarityVisual } from '../constants/rarityVisuals';
import { REWARD_PLATE_VIEWPORT_STYLE } from '../constants/rewardPlateStyles';

interface ItemDetailModalProps {
    item: ItemDef;
    instanceId?: string;
    type: string;
    onClose: () => void;
    onOpen?: () => void;
    /**
     * Aviso curto acima da descricao. Existe para a DUPLICATA do bau.
     *
     * Antes, bau com item repetido abria um modal diferente do bau com item
     * novo: o de recompensa, com o vocabulario de pacote e sem a arte grande.
     * Mesma acao, duas telas — e a pior das duas justamente quando a noticia ja
     * era ruim. Agora e sempre esta, e o aviso diz o que aconteceu.
     */
    aviso?: string;
    /** Revelacao de bau: concentra a cena no premio e esconde a vitrine lateral. */
    focusMode?: boolean;
    /** Valores adicionais do mesmo baú. O item em destaque não entra aqui. */
    extrasRecebidos?: Array<{
        label: string;
        value: string;
        simbolo?: 'ouro' | 'fragmento' | 'exp';
    }>;
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

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item: initialItem, instanceId: initialInstanceId, type, onClose, onOpen, aviso, focusMode = false, extrasRecebidos = [] }) => {
    const { userProfile, updateUserProfile, toggleEquipItem, recycleItem, craftItem, buyStoreItem, showToast, donateItem, friends } = useGame();
    const { confirm, confirmationElement } = useConfirmation();
    const [escolhendoAmigo, setEscolhendoAmigo] = React.useState(false);
    const [acaoEmCurso, setAcaoEmCurso] = React.useState<string | null>(null);
    const [currentItem, setCurrentItem] = React.useState<ItemDef>(initialItem);

    // Reset current item when prop changes
    React.useEffect(() => {
        setCurrentItem(initialItem);
    }, [initialItem]);

    const relatedItems = React.useMemo(() => {
        return ITEMS_DB.filter(i => i.category === currentItem.category && (isItemCatalogVisible(i) || i.id === currentItem.id));
    }, [currentItem.category, currentItem.id]);

    // Check ownership
    const checkOwnership = (itemId: string, category: ItemCategory) => {
        if (category === 'hair') return true;

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
    const rarityClass = `plasma-${currentItem.rarity}`;
    const rarityVisual = getRarityVisual(currentItem.rarity);

    const isEquipped = (
        (currentItem.category === 'border' && userProfile.border === currentItem.id) ||
        (currentItem.category === 'ui_skin' && userProfile.skin === currentItem.id) ||
        (currentItem.category === 'skin' && userProfile.sovereign?.outfit === currentItem.id) ||
        (currentItem.category === 'hair' && userProfile.sovereign?.hairStyle === currentItem.id) ||
        (currentItem.category === 'artifact' && userProfile.sovereign?.artifact === currentItem.id) ||
        (currentItem.category === 'glyph' && userProfile.sovereign?.glyph === currentItem.id) ||
        (currentItem.category === 'aura' && userProfile.sovereign?.aura === currentItem.id) ||
        (currentItem.category === 'orb' && userProfile.sovereign?.orb === currentItem.id) ||
        (currentItem.category === 'plate' && [userProfile.sovereign?.sovereignPlate, userProfile.sovereign?.artifactPlate, userProfile.sovereign?.glyphPlate].includes(currentItem.id)) ||
        (currentItem.category === 'banner' && resolveCatalogAssetUrl(userProfile.bannerUrl) === currentItem.imageUrl)
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

    /**
     * Doar abre a lista de amigos. So amigos.
     *
     * Isto era `alert("(Simulação)")` com um comentario dizendo que a logica viria
     * depois. O botao estava publicado e parecia real.
     *
     * Doar para qualquer apelido abriria a porta mais barata de engenharia social
     * que existe num jogo — "me manda o item que eu te devolvo". Exigir amizade
     * nao impede um golpe entre conhecidos, mas tira o golpe de desconhecido, que
     * e a forma que escala.
     */
    const handleDonate = () => {
        if (!currentInstanceId) return;
        // Bau nao se doa. A colecao de temporada e dimensionada pelo numero de
        // baus que a temporada entrega — tres missoes mais o fecho, quatro no
        // total. Doacao fura essa conta: uma conta acumularia baus miticos de
        // varias pessoas e esgotaria a colecao inteira em uma tarde, enquanto a
        // outra ficaria sem. O item que sai do bau continua doavel.
        if (currentItem.category === 'chest') {
            showToast('Baú não pode ser doado. Abra e doe o item que sair.', 'info');
            return;
        }
        if (isEquipped) {
            showToast('Desequipe o item antes de doar.', 'error');
            return;
        }
        if (friends.length === 0) {
            showToast('Você ainda não tem amigos para doar.', 'info');
            return;
        }
        setEscolhendoAmigo(true);
    };

    const confirmarDoacao = async (amigoId: string, amigoNome: string) => {
        if (!currentInstanceId || acaoEmCurso) return;
        // eslint-disable-next-line no-alert
        if (!(await confirm({
            title: 'Doar item?',
            message: `${currentItem.name} vai para ${amigoNome}. Não há como desfazer.`,
            confirmLabel: 'DOAR',
        }))) return;
        setAcaoEmCurso('doar');
        try {
            const ok = await donateItem(currentInstanceId, amigoId);
            if (ok) {
                setEscolhendoAmigo(false);
                onClose();
            }
        } finally {
            setAcaoEmCurso(null);
        }
    };

    /**
     * Quanto vale, em fragmentos, cada operacao deste item.
     *
     * Sao os mesmos numeros que o item repetido ja usa ao quebrar sozinho
     * (getDuplicateItemFragmentReward le a mesma tabela), entao quebrar a mao e
     * quebrar por duplicata pagam igual — como tem de ser, ou uma das duas vira
     * a esperta.
     */
    const patamar = Math.min(6, Math.max(1, Number(currentItem.tier || 1)));
    const valorAoQuebrar = Number(ECONOMY.recycle_values[`tier_${patamar}` as keyof typeof ECONOMY.recycle_values] || 0);
    const custoDeForja = Number(ECONOMY.craft_costs[`tier_${patamar}` as keyof typeof ECONOMY.craft_costs] || 0);
    const fragmentosNaCarteira = Number(userProfile.wallet?.fragments || 0);
    const ouroNaCarteira = Number(userProfile.wallet?.gold || 0);
    const podeForjar = isForgeEligibleItem(currentItem);
    const precoEmOuro = Number(currentItem.costGold || 0);

    /**
     * Quebrar de verdade.
     *
     * Isto era uma SIMULACAO: window.confirm, um alert dizendo "(Simulação)" e
     * fecha. O botao existia, parecia real e nao chamava recycleItem — o item
     * continuava no inventario e nenhum fragmento aparecia.
     */
    const handleRecycle = async () => {
        if (!currentInstanceId || acaoEmCurso) return;
        // eslint-disable-next-line no-alert
        if (!(await confirm({
            title: 'Quebrar item?',
            message: `${currentItem.name} vira ${valorAoQuebrar} \u{1F48E} fragmentos. O item não volta.`,
            confirmLabel: 'QUEBRAR',
            variant: 'danger',
        }))) return;
        setAcaoEmCurso('quebrar');
        try {
            await recycleItem(currentInstanceId);
            onClose();
        } finally {
            setAcaoEmCurso(null);
        }
    };

    /** Forjar exatamente este. E o caminho caro, e o unico em que voce escolhe. */
    const handleForge = async () => {
        if (acaoEmCurso || fragmentosNaCarteira < custoDeForja) return;
        setAcaoEmCurso('forjar');
        try {
            await craftItem(currentItem.tier, undefined, currentItem.id);
        } finally {
            setAcaoEmCurso(null);
        }
    };

    /** Comprar daqui, em vez de mandar procurar o mesmo item na loja. */
    const handleBuy = async () => {
        if (acaoEmCurso || !precoEmOuro || ouroNaCarteira < precoEmOuro) return;
        setAcaoEmCurso('comprar');
        try {
            await buyStoreItem(currentItem.id);
        } finally {
            setAcaoEmCurso(null);
        }
    };

    const handleOpen = () => {
        if (onOpen) {
            onOpen();
            onClose();
        }
    };

    const isInsignia = currentItem.category === 'insignia' || currentItem.category === 'insignias';

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
                <div 
                    className={`custom-scrollbar relative flex flex-col items-center gap-4 overflow-y-auto rounded-[30px] p-5 plasma-card plasma-bg ${rarityClass} ${focusMode ? 'animate-[scaleIn_.38s_cubic-bezier(.2,.9,.2,1)]' : 'max-h-[86svh] w-full max-w-[22rem]'}`}
                    style={focusMode ? REWARD_PLATE_VIEWPORT_STYLE : undefined}
                    onClick={e => e.stopPropagation()}
                >
                <button aria-label="Fechar" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors z-20">
                    <XIcon className="w-6 h-6" />
                </button>

                {/* Item Image with Glow */}
                <div className="relative z-10 group">
                    <div className={`absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />
                    <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110">
                        <ItemArt
                            itemId={currentItem.id}
                            src={currentItem.imageUrl}
                            alt={currentItem.name}
                            icon={currentItem.icon}
                            category={currentItem.category}
                            className="w-full h-full flex items-center justify-center"
                            imgClassName="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            iconClassName="text-8xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        />
                    </div>
                </div>

                {/* Item Info */}
                <div className="text-center space-y-2 z-10 w-full">
                    <h2 className={`${focusMode ? 'reward-title-metal' : 'text-white'} text-xl font-black uppercase tracking-[0.14em] drop-shadow-lg`}>
                        {focusMode ? 'Item recebido!' : currentItem.name}
                    </h2>
                    {focusMode && (
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/62">
                            {currentItem.name}
                        </div>
                    )}
                    <div className="flex justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg" style={{ color: rarityVisual.hex }}>
                            {rarityVisual.label}
                        </span>
                    </div>
                    {isInsignia && (
                        <div className="mt-2 text-[9px] font-bold text-blue-400 uppercase tracking-widest animate-pulse">
                            Colecionável · Somente Visualização
                        </div>
                    )}
                    {aviso && (
                        <div className="mx-auto mt-3 flex max-w-[92%] items-center justify-center gap-1.5 rounded-xl border border-violet-400/25 bg-violet-400/[0.07] px-3 py-2 text-[11px] font-semibold leading-snug text-violet-100">
                            {aviso}
                        </div>
                    )}
                    <div className="h-px w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto my-4" />
                    <div className="mt-2 px-2 text-xs text-white/60">
                        {currentItem.description || "Um item raro e misterioso."}
                    </div>
                </div>

                {focusMode && extrasRecebidos.length > 0 && (
                    <div className="z-10 w-full">
                        <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/45">
                            <span>Itens recebidos</span>
                            <span className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {extrasRecebidos.map((extra) => (
                                <div key={`${extra.label}-${extra.value}`} className="flex min-h-14 items-center gap-2 border border-white/10 bg-black/30 px-2.5 py-2">
                                    {extra.simbolo && (
                                        <span className="grid h-8 w-8 shrink-0 place-items-center border border-white/10 bg-black/35">
                                            <ValorIcon valor={extra.simbolo} tamanho={21} rotulo="" />
                                        </span>
                                    )}
                                    <span className="min-w-0">
                                        <strong className="block text-[12px] font-black text-white">{extra.value}</strong>
                                        <small className="block truncate text-[8px] font-black uppercase tracking-[0.13em] text-white/45">{extra.label}</small>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Items Collection */}
                {!focusMode && relatedItems.length > 1 && (
                    <div className="w-full mt-2 z-10">
                        <h3 className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2 pl-1">Coleção</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent mask-linear-fade">
                            {relatedItems.map(relItem => {
                                const isRelOwned = checkOwnership(relItem.id, relItem.category);
                                const isSelected = relItem.id === currentItem.id;
                                const relRarityColor = getRarityVisual(relItem.rarity).hex;
                                
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
                                        <div className="absolute inset-0 opacity-10" style={{ backgroundColor: relRarityColor }} />
                                        <div className="relative w-full h-full flex items-center justify-center p-1">
                                            <ItemArt
                                                itemId={relItem.id}
                                                src={relItem.imageUrl}
                                                alt={relItem.name}
                                                icon={relItem.icon}
                                                category={relItem.category}
                                                className="w-full h-full flex items-center justify-center"
                                                imgClassName="w-full h-full object-contain"
                                                iconClassName="text-xl"
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="z-10 mt-auto grid w-full grid-cols-2 gap-2.5 pt-3">
                    {currentItem.category === 'chest' ? (
                        <button 
                            onClick={handleOpen}
                            className="col-span-2 py-3 luxe-bico luxe-skin-button"
                        >
                            ABRIR
                        </button>
                    ) : (
                        <button 
                            onClick={handleEquip}
                            disabled={!isOwned || isInsignia || currentItem.category === 'garden'}
                            className={`col-span-2 py-3 rounded-xl font-bold uppercase tracking-wider transition-all transform shadow-lg
                                ${(!isOwned || isInsignia || currentItem.category === 'garden')
                                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700' 
                                    : isEquipped 
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:scale-105 active:scale-95' 
                                        : 'luxe-skin-button hover:scale-105 active:scale-95'
                                }`}
                        >
                            {currentItem.category === 'garden' ? (isOwned ? 'Disponível no Jardim' : 'Bloqueado') : isInsignia ? 'Somente Visualização' : (!isOwned ? 'Bloqueado' : isEquipped ? 'Desequipar' : 'Equipar')}
                        </button>
                    )}
                    
                    {/* A lista de amigos cobre as acoes enquanto esta aberta:
                        escolher para quem doar e uma decisao, e decisao com os
                        outros botoes ainda clicaveis atras convida engano. */}
                    {escolhendoAmigo && (
                        <div className="col-span-2 space-y-2 rounded-2xl border border-white/12 bg-black/60 p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">Doar para</p>
                                <button aria-label="Voltar"
                                    type="button"
                                    onClick={() => setEscolhendoAmigo(false)}
                                    className="rounded-full p-1 text-white/40 hover:text-white"
                                >
                                    <XIcon className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="max-h-40 space-y-1 overflow-y-auto hide-scrollbar">
                                {friends.map((amigo) => {
                                    const nome = amigo.nickname || amigo.username || 'Soberano';
                                    return (
                                        <button
                                            key={amigo.id}
                                            type="button"
                                            onClick={() => { void confirmarDoacao(amigo.id, nome); }}
                                            disabled={!!acaoEmCurso}
                                            className="flex w-full items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-2 text-left transition-colors hover:border-[var(--skin-accent-color)]/35 hover:bg-white/[0.07] disabled:opacity-50"
                                        >
                                            {amigo.avatarUrl ? (
                                                <img src={amigo.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                                            ) : (
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold">
                                                    {nome.slice(0, 2).toUpperCase()}
                                                </span>
                                            )}
                                            <span className="truncate text-[11px] font-bold text-white/85">{nome}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Quebrar diz QUANTO rende.
                        "Reciclar" com um icone de lixo pede que a pessoa aceite
                        perder algo sem saber o que ganha — e o que ela ganha e
                        exatamente o argumento para aceitar. */}
                    {/* Item equipado nao aparece aqui. O servidor recusa quebrar o que
                        esta em uso — apagar deixaria o perfil apontando para um item
                        que nao existe mais — e oferecer um botao que sempre falha e
                        pior do que nao oferecer botao. Para quebrar, desequipe. */}
                    {isOwned && !isInsignia && !isEquipped && (
                        <button
                            onClick={handleRecycle}
                            disabled={!!acaoEmCurso || !currentInstanceId}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 py-3 font-bold uppercase tracking-wider text-red-400 transition-all hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Trash2Icon className="w-4 h-4" />
                            <span className="text-[10px]">{acaoEmCurso === 'quebrar' ? '...' : `Quebrar ${valorAoQuebrar}`}</span>
                            <ValorIcon valor="fragmento" tamanho={14} rotulo="" />
                        </button>
                    )}

                    {/* Faltando: as duas saidas ficam AQUI, onde a vontade nasceu.
                        Ver a colecao e descobrir o que falta e o momento em que a
                        pessoa quer o item; mandar ela procurar o mesmo item noutra
                        aba e perder esse momento. */}
                    {!isOwned && !isInsignia && precoEmOuro > 0 && (
                        <button
                            onClick={handleBuy}
                            disabled={!!acaoEmCurso || ouroNaCarteira < precoEmOuro}
                            className="luxe-skin-button flex items-center justify-center gap-1.5 rounded-xl py-3 font-bold uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="text-[10px]">{acaoEmCurso === 'comprar' ? '...' : precoEmOuro}</span>
                            <ValorIcon valor="ouro" tamanho={14} rotulo="" />
                        </button>
                    )}

                    {!isOwned && !isInsignia && podeForjar && (
                        <button
                            onClick={handleForge}
                            disabled={!!acaoEmCurso || fragmentosNaCarteira < custoDeForja}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/25 bg-cyan-400/10 py-3 font-bold uppercase tracking-wider text-cyan-200 transition-all hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="text-[10px]">{acaoEmCurso === 'forjar' ? '...' : `Forjar ${custoDeForja}`}</span>
                            <ValorIcon valor="fragmento" tamanho={14} rotulo="" />
                        </button>
                    )}
                    
                    <button 
                        onClick={handleDonate}
                        disabled={!isOwned || isInsignia || currentItem.category === 'chest'}
                        className={`py-3 rounded-xl font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2
                            ${(!isOwned || isInsignia || currentItem.category === 'chest')
                                ? 'bg-transparent text-gray-600 border-gray-800 cursor-not-allowed' 
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                            }`}
                    >
                        {/* Presente, nao compartilhar. Doar entrega o item e ele sai
                            do seu inventario; o icone de compartilhar promete a coisa
                            oposta — mostrar sem perder. */}
                        <GiftIcon className="w-4 h-4" />
                        <span className="text-[10px]">Doar</span>
                    </button>
                </div>
            </div>
        </div>
            {confirmationElement}
        </Portal>
    );
};
