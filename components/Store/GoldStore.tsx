import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { GOLD_BOOST_PRODUCTS, GOLD_PACK_CATALOG, GOLD_PLATINUM_PRODUCT, GOLD_PREMIUM_PRODUCT } from '../../constants/goldCatalog';
import { CheckIcon, CrownIcon } from '../Icons';
import { MercadoPagoBrick } from './MercadoPagoBrick';
import { getExpBoostHoursRemaining, getExpBoostLabel, hasActiveExpBoost } from '../../utils/expBoostAccess';
import { getActiveSubscriptionTier, getPremiumDaysRemaining, hasPlatinumAccess, hasPremiumAccess } from '../../utils/premiumAccess';
import { ConfirmationModal } from '../ConfirmationModal';

type GoldConfirmState =
    | { kind: 'membership'; membershipId: string; membershipName: string; costGold: number }
    | { kind: 'boost'; boostId: string; boostName: string; costGold: number };

const GOLD_SYMBOL = '\u{1FA99}';

export const GoldStore: React.FC<{ scrollRequest?: { section: string; nonce: number } | null }> = ({ scrollRequest = null }) => {
    const { buyStoreItem, userProfile } = useGame();
    const [loading, setLoading] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<{ amount: number; goldAmount: number } | null>(null);
    const [confirmState, setConfirmState] = useState<GoldConfirmState | null>(null);
    const isPremium = hasPremiumAccess(userProfile);
    const isPlatinum = hasPlatinumAccess(userProfile);
    const activeMembershipTier = getActiveSubscriptionTier(userProfile);
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
            return `${premiumDaysRemaining ?? 0}d - até ${premiumExpiresLabel}`;
        }
        return '30 dias';
    }, [isPremium, premiumDaysRemaining, premiumExpiresLabel]);

    const activeBoostBadge = useMemo(() => {
        if (!hasExpBoost) return 'sem boost';
        return `${expBoostLabel || 'boost ativo'}${expBoostHoursRemaining != null ? ` - ${expBoostHoursRemaining}h` : ''}`;
    }, [expBoostHoursRemaining, expBoostLabel, hasExpBoost]);

    const premiumBenefits = useMemo(() => ([
        'Até 15 arenas ativas',
        'Fundos premium de perfil e ativos',
        'Todos os modos do Oráculo',
        'Cena do legado com 50% off',
        'Bônus de legado +10% XP',
        '1 ficha grátis de quiz por renovação',
    ]), []);

    const platinumBenefits = useMemo(() => ([
    'Todas as vantagens do Premium',
    'Até 30 arenas ativas',
    '1 cena de legado grátis por renovação',
    '1 ficha média de quiz por renovação',
    'Todos os planos de fundo de perfil e ativos',
    'Todas as aparências premium',
    '1 baú da Temporada + 1 baú raro por renovação',
    ]), []);

    const handleBuyPack = async (packId: string) => {
        const pack = GOLD_PACK_CATALOG.find((entry) => entry.id === packId);
        if (!pack) return;
        setSelectedPack({ amount: pack.priceBrl, goldAmount: pack.totalGold });
    };

    const handleConfirmPurchase = async () => {
        if (!confirmState || loading) return;

        if (confirmState.kind === 'membership') {
            setLoading(confirmState.membershipId);
            try {
                await buyStoreItem(confirmState.membershipId, 'premium');
            } catch (error) {
                console.error('Membership purchase failed', error);
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
                    <div className="relative z-10 grid gap-5 p-5 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_auto] md:items-center">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full border border-[var(--ui-border-accent)] bg-[var(--ui-core-surface-strong-bg)] p-3 shadow-[0_0_20px_var(--ui-button-primary-glow)]">
                                    <CrownIcon className="h-6 w-6 text-[var(--ui-text-accent)]" />
                                </div>
                                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isPremium ? 'border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/12 text-[var(--ui-text-accent)]' : 'border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] text-[color:var(--ui-card-text-soft)]'}`}>
                                    {isPremium ? 'Ativo' : 'Disponível'}
                                </div>
                            </div>

                            <div className="mt-3">
                                <h2 className="text-xl font-black uppercase tracking-[0.06em] text-[color:var(--ui-card-text)]">Premium</h2>
                                <p className="mt-1 max-w-[26rem] text-sm leading-relaxed text-[color:var(--ui-card-text-soft)]">
                                    30 dias de acesso, mais alcance no Oráculo, mais fôlego nas arenas e bônus real de legado.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                                        {isPlatinum ? 'Platinum ativo' : premiumBadgeLabel}
                                    </span>
                                    <span className="rounded-full border border-[var(--skin-accent-color)]/18 bg-[var(--skin-accent-color)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ui-text-accent)]">
                                        +10% XP legado
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            {premiumBenefits.map((benefit) => (
                                <div key={benefit} className="flex items-center gap-2 rounded-xl border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-3 py-2">
                                    <CheckIcon className="h-4 w-4 text-green-400" />
                                    <span className="text-sm text-[color:var(--ui-card-text-soft)]">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex min-w-[176px] flex-col items-stretch gap-2">
                            <button
                                onClick={() => setConfirmState({ kind: 'membership', membershipId: GOLD_PREMIUM_PRODUCT.id, membershipName: GOLD_PREMIUM_PRODUCT.name, costGold: GOLD_PREMIUM_PRODUCT.priceGold })}
                                disabled={!!loading || isPlatinum}
                                className="luxe-skin-button inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span>{isPlatinum ? 'Platinum ativo' : isPremium ? 'Estender premium' : 'Ativar premium'}</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-[11px]">
                                    <span className="text-[12px] leading-none">{GOLD_SYMBOL}</span>
                                    <span>{loading === GOLD_PREMIUM_PRODUCT.id ? '...' : GOLD_PREMIUM_PRODUCT.priceGold}</span>
                                </span>
                            </button>
                            <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                                {isPlatinum ? 'Já incluso no plano maior' : isPremium ? 'Renove quando quiser' : 'Compra manual em ouro'}
                            </span>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard id="gold-store-platinum" className="relative overflow-hidden border-[var(--ui-border-accent)]">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,244,206,0.18),transparent_56%),linear-gradient(135deg,rgba(186,144,255,0.12),transparent_46%)]" />
                    <div className="relative z-10 grid gap-5 p-5 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_auto] md:items-center">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full border border-white/20 bg-white/10 p-3 shadow-[0_0_26px_rgba(240,218,160,0.2)]">
                                    <CrownIcon className="h-6 w-6 text-amber-100" />
                                </div>
                                <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isPlatinum ? 'border-amber-200/30 bg-amber-200/12 text-amber-100' : 'border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] text-[color:var(--ui-card-text-soft)]'}`}>
                                    {isPlatinum ? 'Ativo' : 'Disponível'}
                                </div>
                            </div>

                            <div className="mt-3">
                                <h2 className="text-xl font-black uppercase tracking-[0.06em] text-[color:var(--ui-card-text)]">Platinum</h2>
                                <p className="mt-1 max-w-[26rem] text-sm leading-relaxed text-[color:var(--ui-card-text-soft)]">
                                    O pacote mais alto: leva tudo do Premium e empurra identidade, vitrine e legado para o patamar máximo.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="rounded-full border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                                        {isPlatinum ? premiumBadgeLabel : '30 dias'}
                                    </span>
                                    <span className="rounded-full border border-amber-200/18 bg-amber-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
                                        1 legado grátis por renovação
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            {platinumBenefits.map((benefit) => (
                                <div key={benefit} className="flex items-center gap-2 rounded-xl border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-3 py-2">
                                    <CheckIcon className="h-4 w-4 text-green-400" />
                                    <span className="text-sm text-[color:var(--ui-card-text-soft)]">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex min-w-[176px] flex-col items-stretch gap-2">
                            <button
                                onClick={() => setConfirmState({ kind: 'membership', membershipId: GOLD_PLATINUM_PRODUCT.id, membershipName: GOLD_PLATINUM_PRODUCT.name, costGold: GOLD_PLATINUM_PRODUCT.priceGold })}
                                disabled={!!loading}
                                className="luxe-skin-button inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span>{isPlatinum ? 'Estender platinum' : activeMembershipTier === 'premium' ? 'Subir para platinum' : 'Ativar platinum'}</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-[11px]">
                                    <span className="text-[12px] leading-none">{GOLD_SYMBOL}</span>
                                    <span>{loading === GOLD_PLATINUM_PRODUCT.id ? '...' : GOLD_PLATINUM_PRODUCT.priceGold}</span>
                                </span>
                            </button>
                            <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                                {isPlatinum ? 'Renove quando quiser' : activeMembershipTier === 'premium' ? 'Upgrade manual em ouro' : 'Compra manual em ouro'}
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
                                        +{pack.bonusGold} bônus
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
                    title={confirmState.kind === 'membership' ? `Confirmar ${confirmState.membershipName}` : 'Confirmar boost'}
                    message={confirmState.kind === 'membership'
                        ? `Ativar ou renovar ${confirmState.membershipName} vai debitar ${confirmState.costGold} ouro da sua conta. Deseja continuar?`
                        : `${confirmState.boostName} vai debitar ${confirmState.costGold} ouro da sua conta. Deseja continuar?`}
                    confirmLabel={confirmState.kind === 'membership'
                        ? `${confirmState.membershipName.toUpperCase()} - ${confirmState.costGold} ${GOLD_SYMBOL}`
                        : `BOOST - ${confirmState.costGold} ${GOLD_SYMBOL}`}
                    onConfirm={() => { void handleConfirmPurchase(); }}
                    onCancel={() => setConfirmState(null)}
                />
            )}
        </>
    );
};



