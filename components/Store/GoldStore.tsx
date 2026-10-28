import React, { useEffect, useMemo, useState } from 'react';
import type { BillingInternalProductId } from '../../constants/billingCatalog';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { ARTE_DO_PRODUTO, GOLD_PACK_CATALOG } from '../../constants/goldCatalog';
import { BillingCheckoutGate } from './BillingCheckoutGate';
import { ValorIcon } from '../ValorIcon';

export const GoldStore: React.FC<{ scrollRequest?: { section: string; nonce: number } | null }> = ({ scrollRequest = null }) => {
    const { buyStoreItem, userProfile } = useGame();
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<{ amount: number; goldAmount: number; internalProductId: BillingInternalProductId } | null>(null);

    useEffect(() => {
        if (!scrollRequest) return;
        const idBySection: Record<string, string> = {
            packs: 'gold-store-packs',
        };
        const targetId = idBySection[scrollRequest.section];
        if (!targetId) return;
        window.setTimeout(() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    }, [scrollRequest]);


    const handleBuyPack = async (packId: string) => {
        const pack = GOLD_PACK_CATALOG.find((entry) => entry.id === packId);
        if (!pack) return;
        setSelectedPack({ amount: pack.priceBrl, goldAmount: pack.totalGold, internalProductId: pack.id });
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in pb-8">
                {/* Premium e Platinum sairam daqui, para components/Store/MembershipStore.tsx.
                    Ouro e consumivel; plano e assinatura. As lojas tratam os dois
                    como produtos de tipo diferente, e quem chega por "faltam 40
                    moedas" nao deve aterrissar ao lado de um pitch de assinatura.
                    Os boosts de XP sairam em 13/10/2026: ouro se compra com
                    dinheiro, entao boost de EXP era pay-to-win do mesmo jeito (e
                    o multiplicador nunca chegou a ser aplicado na EXP). */}
                <GlassCard id="gold-store-packs" variant="neutral" className="space-y-4 border-white/10 p-4">
                    {/* O titulo e o selo do canal sairam.
                        "Pacotes de Ouro" nomeava o que a tela inteira ja e — a aba
                        "Ouro" esta selecionada logo acima —, e "GOOGLE PLAY" e
                        detalhe de cobranca que aparece no proprio fluxo de compra.
                        Os dois ocupavam uma faixa inteira antes dos cards. */}
                    <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
                        {GOLD_PACK_CATALOG.map((pack) => (
                            /* Mais baixo e mais quadrado. A altura fixa de 12,4rem vinha
                               de tres blocos empilhados com folga — icone grande, nome em
                               duas linhas com altura minima reservada, e o número — para
                               mostrar tres informacoes curtas. O que a pessoa compara e a
                               QUANTIDADE e o PRECO; o nome do pacote e sabor e cabe numa
                               linha. E a quantidade vem com o simbolo da moeda, não com a
                               palavra ao lado. */
                            <GlassCard key={pack.id} className="group relative h-[10.2rem] overflow-hidden p-2.5 text-center transition-colors hover:bg-white/5">
                                {pack.bonusGold > 0 && (
                                    <div className="absolute right-1.5 top-1.5 rounded border border-green-500/30 bg-green-500/20 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-green-400">
                                        +{pack.bonusGold}
                                    </div>
                                )}

                                <div className="flex h-full flex-col items-center gap-1.5">
                                    <img
                                        src={ARTE_DO_PRODUTO[pack.id]}
                                        alt=""
                                        aria-hidden="true"
                                        loading="lazy"
                                        className="mt-0.5 h-11 w-11 rounded-xl object-cover shadow-[0_0_14px_rgba(255,215,0,0.25)] transition-transform duration-300 group-hover:scale-110"
                                    />

                                    <div className="flex items-center gap-1 text-xl font-black leading-none text-[var(--gold)]">
                                        {pack.totalGold}
                                        <ValorIcon valor="ouro" tamanho={15} rotulo="" />
                                    </div>

                                    <h4 className="truncate text-[9px] font-bold uppercase tracking-[0.06em] text-[color:var(--ui-card-text-soft)]">{pack.name}</h4>

                                    <button
                                        onClick={() => handleBuyPack(pack.id)}
                                        disabled={!!loading}
                                        className="luxe-skin-button mt-auto w-full whitespace-nowrap rounded-lg py-1.5 text-[12px] font-bold leading-none disabled:opacity-50"
                                    >
                                        {loading === pack.id ? '...' : pack.priceBrl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </GlassCard>


                {selectedPack && (
                    <BillingCheckoutGate
                        kind="gold"
                        internalProductId={selectedPack.internalProductId}
                        amount={selectedPack.amount}
                        goldAmount={selectedPack.goldAmount}
                        onClose={() => setSelectedPack(null)}
                    />
                )}
            </div>

        </>
    );
};



