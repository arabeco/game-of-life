import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { GOLD_BOOST_PRODUCTS, GOLD_PACK_CATALOG, GOLD_PREMIUM_PRODUCT } from '../../constants/goldCatalog';
import { CheckIcon, CrownIcon } from '../Icons';
import { MercadoPagoBrick } from './MercadoPagoBrick';
import { getExpBoostHoursRemaining, getExpBoostLabel, hasActiveExpBoost } from '../../utils/expBoostAccess';
import { getPremiumDaysRemaining, hasPremiumAccess } from '../../utils/premiumAccess';
import { ConfirmationModal } from '../ConfirmationModal';

type GoldConfirmState =
    | { kind: 'premium'; costGold: number }
    | { kind: 'boost'; boostId: string; boostName: string; costGold: number };

const GOLD_SYMBOL = '\u{1FA99}';

export const GoldStore: React.FC<{ scrollRequest?: { section: string; nonce: number } | null }> = ({ scrollRequest = null }) => {
    const { buyStoreItem, userProfile } = useGame();
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<{ amount: number; goldAmount: number } | null>(null);
    const [confirmState, setConfirmState] = useState<GoldConfirmState | null>(null);
    const isPremium = hasPremiumAccess(userProfile);
    const premiumDaysRemaining = getPremiumDaysRemaining(userProfile);
    const premiumExpiresLabel = userProfile.premiumExpiresAt
        ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(userProfile.premiumExpiresAt))
        : null;
    const hasExpBoost = hasActiveExpBoost(userProfile);
    const expBoostHoursRemaining = getExpBoostHoursRemaining(userProfile);
    const expBoostLabel = getExpBoostLabel(userProfile);

    useEffect(() => {
        if (!scrollRequest) return;
        const idBySection: Record<string, string> = {
            premium: 'gold-store-premium',
            packs: 'gold-store-packs',
            boosts: 'gold-store-boosts',
        };
        const targetId = idBySection[scrollRequest.section];
        if (!targetId) return;
        window.setTimeout(() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    }, [scrollRequest]);

    const premiumBadgeLabel = useMemo(() => {
        if (isPremium && premiumExpiresLabel) {
            return `${premiumDaysRemaining ?? 0}d - ate ${premiumExpiresLabel}`;
        }
        return '30 dias';
    }, [isPremium, premiumDaysRemaining, premiumExpiresLabel]);

    const activeBoostBadge = useMemo(() => {
        if (!hasExpBoost) return 'sem boost';
        return `${expBoostLabel || '2x ativo'}${expBoostHoursRemaining != null ? ` - ${expBoostHoursRemaining}h` : ''}`;
    }, [expBoostHoursRemaining, expBoostLabel, hasExpBoost]);

    const handleBuyPack = async (packId: string) => {
        const pack = GOLD_PACK_CATALOG.find((entry) => entry.id === packId);
        if (!pack) return;
        setSelectedPack({ amount: pack.priceBrl, goldAmount: pack.totalGold });
    };

    const handleConfirmPurchase = async () => {
        if (!confirmState || loading) return;

        if (confirmState.kind === 'premium') {
            setLoading('premium');
            try {
                await buyStoreItem('premium_30d', 'premium');
            } catch (error) {
                console.error('Premium purchase failed', error);
            } finally {
                setLoading(null);
                setConfirmState(null);
            }
            return;
        }

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
                <GlassCard id="gold-store-premium" className="relative overflow-hidden border-[var(--ui-border-accent-soft)]">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-yellow-900/20 via-yellow-500/5 to-transparent" />
                    <div className="relative z-10 flex flex-col items-center justify-between gap-6 p-6 md:flex-row">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full border border-[var(--ui-border-accent)] bg-[var(--ui-core-surface-strong-bg)] p-4 shadow-[0_0_20px_var(--ui-button-primary-glow)]">
                                <CrownIcon className="h-8 w-8 text-[var(--ui-text-accent)]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight text-[color:var(--ui-card-text)]">{GOLD_PREMIUM_PRODUCT.name}</h2>
                                <p className="text-sm font-bold uppercase tracking-wider text-[color:var(--ui-card-text-soft)]">Assinatura mensal</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-[color:var(--ui-card-text-soft)] md:grid-cols-2">
                            {GOLD_PREMIUM_PRODUCT.benefits.map((benefit) => (
                                <div key={benefit} className="flex items-center gap-2">
                                    <CheckIcon className="h-4 w-4 text-green-400" />
                                    <span>{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex min-w-[150px] flex-col items-center gap-2">
                            <button
                                onClick={() => setConfirmState({ kind: 'premium', costGold: GOLD_PREMIUM_PRODUCT.priceGold })}
                                disabled={!!loading}
                                className="luxe-skin-button inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-3 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="text-[12px] leading-none">{GOLD_SYMBOL}</span>
                                <span>{loading === 'premium' ? '...' : GOLD_PREMIUM_PRODUCT.priceGold}</span>
                            </button>
                            <span className="text-[10px] font-bold uppercase text-[color:var(--ui-card-text-soft)]">
                                {premiumBadgeLabel}
                            </span>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard id="gold-store-packs" variant="neutral" className="space-y-4 border-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-[color:var(--ui-card-text)]">Pacotes de Ouro</h3>
                        <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-yellow-300">
                            Compra avulsa
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
                        {GOLD_PACK_CATALOG.map((pack) => (
                            <GlassCard key={pack.id} className="group relative h-[12.4rem] overflow-hidden p-3 text-center transition-colors hover:bg-white/5">
                                {pack.bonusGold > 0 && (
                                    <div className="absolute right-2 top-2 rounded border border-green-500/30 bg-green-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-400">
                                        +{pack.bonusGold} bonus
                                    </div>
                                )}

                                <div className="flex h-full flex-col items-center gap-2">
                                    <div className="mt-1 text-4xl drop-shadow-[0_0_10px_rgba(255,215,0,0.25)] transition-transform duration-300 group-hover:scale-110">
                                        {pack.icon}
                                    </div>

                                    <div className="min-h-[2.6rem]">
                                        <h4 className="line-clamp-2 text-[11px] font-black uppercase tracking-[0.06em] text-[color:var(--ui-card-text)]">{pack.name}</h4>
                                    </div>

                                    <div className="text-2xl font-black text-[var(--gold)]">{pack.totalGold}</div>

                                    <button
                                        onClick={() => handleBuyPack(pack.id)}
                                        disabled={!!loading}
                                        className="luxe-skin-button mt-auto w-full rounded-xl py-2 text-sm font-bold disabled:opacity-50"
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

                {selectedPack && <MercadoPagoBrick amount={selectedPack.amount} goldAmount={selectedPack.goldAmount} onClose={() => setSelectedPack(null)} />}
            </div>

            {confirmState && (
                <ConfirmationModal
                    title={confirmState.kind === 'premium' ? 'Confirmar premium' : 'Confirmar boost'}
                    message={confirmState.kind === 'premium'
                        ? `Ativar ou renovar o premium vai debitar ${confirmState.costGold} ouro da sua conta. Deseja continuar?`
                        : `${confirmState.boostName} vai debitar ${confirmState.costGold} ouro da sua conta. Deseja continuar?`}
                    confirmLabel={confirmState.kind === 'premium'
                        ? `PREMIUM - ${confirmState.costGold} ${GOLD_SYMBOL}`
                        : `BOOST - ${confirmState.costGold} ${GOLD_SYMBOL}`}
                    onConfirm={() => { void handleConfirmPurchase(); }}
                    onCancel={() => setConfirmState(null)}
                />
            )}
        </>
    );
};
