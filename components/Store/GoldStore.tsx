import React, { useEffect, useMemo, useState } from 'react';
import type { BillingInternalProductId } from '../../constants/billingCatalog';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { GOLD_BOOST_PRODUCTS, GOLD_PACK_CATALOG } from '../../constants/goldCatalog';
import { BillingCheckoutGate } from './BillingCheckoutGate';
import { getExpBoostHoursRemaining, getExpBoostLabel, hasActiveExpBoost } from '../../utils/expBoostAccess';
import { ConfirmationModal } from '../ConfirmationModal';
import { ValorIcon } from '../ValorIcon';

type GoldConfirmState = { kind: 'boost'; boostId: string; boostName: string; costGold: number };

const GOLD_SYMBOL = '\u{1FA99}';

export const GoldStore: React.FC<{ scrollRequest?: { section: string; nonce: number } | null }> = ({ scrollRequest = null }) => {
    const { buyStoreItem, userProfile } = useGame();
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<{ amount: number; goldAmount: number; internalProductId: BillingInternalProductId } | null>(null);
    const [confirmState, setConfirmState] = useState<GoldConfirmState | null>(null);
    const hasExpBoost = hasActiveExpBoost(userProfile);
    const expBoostHoursRemaining = getExpBoostHoursRemaining(userProfile);
    const expBoostLabel = getExpBoostLabel(userProfile);

    useEffect(() => {
        if (!scrollRequest) return;
        const idBySection: Record<string, string> = {
            packs: 'gold-store-packs',
            boosts: 'gold-store-boosts',
        };
        const targetId = idBySection[scrollRequest.section];
        if (!targetId) return;
        window.setTimeout(() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    }, [scrollRequest]);


    const activeBoostBadge = useMemo(() => {
        if (!hasExpBoost) return 'sem boost';
        return `${expBoostLabel || 'boost ativo'}${expBoostHoursRemaining != null ? ` - ${expBoostHoursRemaining}h` : ''}`;
    }, [expBoostHoursRemaining, expBoostLabel, hasExpBoost]);



    const handleBuyPack = async (packId: string) => {
        const pack = GOLD_PACK_CATALOG.find((entry) => entry.id === packId);
        if (!pack) return;
        setSelectedPack({ amount: pack.priceBrl, goldAmount: pack.totalGold, internalProductId: pack.id });
    };

    const handleConfirmPurchase = async () => {
        if (!confirmState || loading) return;

        setLoading(confirmState.boostId);
        try {
            await buyStoreItem(confirmState.boostId, 'boost');
        } catch (error) {
            console.error('Boost purchase failed', error);
        } finally {
            setLoading(null);
            setConfirmState(null);
        }
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in pb-8">
                {/* Premium e Platinum sairam daqui, para components/Store/MembershipStore.tsx.
                    Ouro e consumivel; plano e assinatura. As lojas tratam os dois
                    como produtos de tipo diferente, e quem chega por "faltam 40
                    moedas" nao deve aterrissar ao lado de um pitch de assinatura.
                    Os boosts ficaram, porque sao pagos EM ouro. */}
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
                            <GlassCard key={pack.id} className="group relative h-[9.2rem] overflow-hidden p-2.5 text-center transition-colors hover:bg-white/5">
                                {pack.bonusGold > 0 && (
                                    <div className="absolute right-1.5 top-1.5 rounded border border-green-500/30 bg-green-500/20 px-1.5 py-0.5 text-[8px] font-bold tracking-wider text-green-400">
                                        +{pack.bonusGold}
                                    </div>
                                )}

                                <div className="flex h-full flex-col items-center gap-1.5">
                                    <div className="mt-0.5 text-[28px] leading-none drop-shadow-[0_0_10px_rgba(255,215,0,0.25)] transition-transform duration-300 group-hover:scale-110">
                                        {pack.icon}
                                    </div>

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
                                        {loading === pack.id ? '...' : `R$ ${pack.priceBrl.toFixed(2)}`}
                                    </button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </GlassCard>

                <GlassCard id="gold-store-boosts" className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-[color:var(--ui-card-text)]">Boosts de XP</h3>
                            <p className="text-sm text-[color:var(--ui-card-text-soft)]">Aceleradores simples para fases de execucao pesada.</p>
                        </div>
                        <div className="rounded-full border border-[var(--ui-border-accent-soft)] bg-[var(--ui-core-surface-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ui-text-accent)]">
                            {activeBoostBadge}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {GOLD_BOOST_PRODUCTS.map((boost) => (
                            <div key={boost.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] p-3">
                                <div>
                                    <div className="font-bold text-[var(--ui-text-accent)]">{boost.name}</div>
                                    <div className="text-xs text-[color:var(--ui-card-text-soft)]">{boost.description}</div>
                                </div>
                                <button
                                    onClick={() => setConfirmState({ kind: 'boost', boostId: boost.id, boostName: boost.name, costGold: boost.priceGold })}
                                    disabled={!!loading}
                                    className="luxe-skin-button inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
                                >
                                    <span className="text-[11px] leading-none">{GOLD_SYMBOL}</span>
                                    <span>{loading === boost.id ? '...' : boost.priceGold}</span>
                                </button>
                            </div>
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

            {confirmState && (
                <ConfirmationModal
                    title="Confirmar boost"
                    message={`${confirmState.boostName} vai debitar ${confirmState.costGold} ouro da sua conta. Deseja continuar?`}
                    confirmLabel={`BOOST - ${confirmState.costGold} ${GOLD_SYMBOL}`}
                    onConfirm={() => { void handleConfirmPurchase(); }}
                    onCancel={() => setConfirmState(null)}
                />
            )}
        </>
    );
};



