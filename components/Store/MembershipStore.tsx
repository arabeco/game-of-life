import React, { useEffect, useMemo, useState } from 'react';
import type { BillingInternalProductId } from '../../constants/billingCatalog';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { GOLD_PLATINUM_PRODUCT, GOLD_PREMIUM_PRODUCT } from '../../constants/goldCatalog';
import { CheckIcon, CrownIcon } from '../Icons';
import { BillingCheckoutGate } from './BillingCheckoutGate';
import { getActiveSubscriptionTier, getPremiumDaysRemaining, hasPlatinumAccess, hasPremiumAccess, isStaffRole } from '../../utils/premiumAccess';
import { getMoneyCheckoutSalesCopy } from '../../utils/billingRuntime';

/**
 * OS PLANOS SAIRAM DA ABA DE OURO.
 *
 * Premium, Platinum e os pacotes de ouro moravam no mesmo scroll, e sao coisas
 * diferentes em tudo que importa aqui:
 *
 * - Para as lojas, ouro e CONSUMIVEL e plano e ASSINATURA. Tipo de produto
 *   diferente, regra de reembolso diferente, restauracao de compra diferente.
 * - Para quem usa, misturar os dois faz o link profundo de "faltam 40 moedas"
 *   aterrissar ao lado de um pitch de assinatura — quem veio comprar moeda le
 *   isso como isca.
 *
 * Os boosts ficaram com o ouro, e nao aqui: eles sao pagos EM ouro, entao quem
 * esta nessa aba ja tem a moeda na mao.
 */

type MembershipCheckoutState = {
    amount: number;
    membershipId: BillingInternalProductId;
    membershipName: string;
    membershipTier: 'premium' | 'platinum';
    equivalentGold: number;
};

const formatBrl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const splitBenefitsIntoColumns = (benefits: readonly string[]) => {
    const midpoint = Math.ceil(benefits.length / 2);
    return [benefits.slice(0, midpoint), benefits.slice(midpoint)];
};

export const MembershipStore: React.FC<{ scrollRequest?: { section: string; nonce: number } | null }> = ({ scrollRequest = null }) => {
    const { userProfile } = useGame();
    const [loading] = useState<string | null>(null);
    const [selectedMembership, setSelectedMembership] = useState<MembershipCheckoutState | null>(null);
    const isStaffAccess = isStaffRole(userProfile.role);
    const isPremium = hasPremiumAccess(userProfile);
    const isPlatinum = hasPlatinumAccess(userProfile);
    const activeMembershipTier = getActiveSubscriptionTier(userProfile);
    const premiumDaysRemaining = getPremiumDaysRemaining(userProfile);
    const premiumExpiresLabel = userProfile.premiumExpiresAt
        ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(userProfile.premiumExpiresAt))
        : null;
    const moneyCheckoutSalesCopy = getMoneyCheckoutSalesCopy();

    useEffect(() => {
        if (!scrollRequest) return;
        const idBySection: Record<string, string> = {
            premium: 'gold-store-premium',
            platinum: 'gold-store-platinum',
        };
        const targetId = idBySection[scrollRequest.section];
        if (!targetId) return;
        window.setTimeout(() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    }, [scrollRequest]);

    const premiumBadgeLabel = useMemo(() => {
        if (isStaffAccess) {
            return 'Acesso GM';
        }
        if (isPremium && premiumExpiresLabel) {
            return `${premiumDaysRemaining ?? 0}d - ate ${premiumExpiresLabel}`;
        }
        return '30 dias';
    }, [isPremium, isStaffAccess, premiumDaysRemaining, premiumExpiresLabel]);

    const premiumBenefits = useMemo(() => ([
        'Ate 15 arenas ativas',
        'Fundos premium de perfil e ativos',
        'Todos os tons de fala do Oraculo',
        'Cena do legado com 50% off',
        'Bonus de legado +5% XP',
        '1 bau raro por ativacao',
    ]), []);

    const platinumBenefits = useMemo(() => ([
        'Todas as vantagens do Premium, com o dobro do bonus de XP (+10%)',
        'Ate 30 arenas ativas',
        'Cena do legado com 70% off',
        '1 campanha media gratis por ativacao',
        'Todos os planos de fundo e aparencias premium',
        '1 bau raro + 1 bau lendario por ativacao',
    ]), []);
    const [premiumBenefitLeft, premiumBenefitRight] = useMemo(() => splitBenefitsIntoColumns(premiumBenefits), [premiumBenefits]);
    const [platinumBenefitLeft, platinumBenefitRight] = useMemo(() => splitBenefitsIntoColumns(platinumBenefits), [platinumBenefits]);

    return (
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
                                {isStaffAccess ? 'Acesso GM' : isPremium ? 'Ativo' : 'Disponível'}
                            </div>
                        </div>

                        <div className="mt-3">
                            <h2 className="text-xl font-black uppercase tracking-[0.06em] text-[color:var(--ui-card-text)]">Premium 30 dias</h2>
                            <p className="mt-1 max-w-[26rem] text-sm leading-relaxed text-[color:var(--ui-card-text-soft)]">
                                30 dias de acesso, mais alcance no Oráculo, mais fôlego nas arenas e bônus real de legado.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                                    {isStaffAccess ? 'Acesso GM' : isPlatinum ? 'Platinum 30 dias ativo' : premiumBadgeLabel}
                                </span>
                                <span className="rounded-full border border-[var(--skin-accent-color)]/18 bg-[var(--skin-accent-color)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ui-text-accent)]">
                                    +5% XP legado
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {[premiumBenefitLeft, premiumBenefitRight].map((column, columnIndex) => (
                            <div key={`premium-col-${columnIndex}`} className="space-y-2">
                                {column.map((benefit) => (
                                    <div key={benefit} className="flex min-h-[38px] items-center gap-2 rounded-xl border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-2.5 py-2">
                                        <CheckIcon className="h-3.5 w-3.5 shrink-0 text-green-400" />
                                        <span className="text-[11px] leading-snug text-[color:var(--ui-card-text-soft)]">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex min-w-[176px] flex-col items-stretch gap-2">
                        <button
                            onClick={() => setSelectedMembership({
                                amount: GOLD_PREMIUM_PRODUCT.priceBrl,
                                membershipId: GOLD_PREMIUM_PRODUCT.id,
                                membershipName: GOLD_PREMIUM_PRODUCT.name,
                                membershipTier: 'premium',
                                equivalentGold: GOLD_PREMIUM_PRODUCT.priceGold,
                            })}
                            disabled={!!loading || isPlatinum}
                            className="luxe-skin-button inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span>{isPlatinum ? 'Platinum 30 dias ativo' : isPremium ? 'Estender 30 dias' : 'Ativar 30 dias'}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-[11px]">
                                <span>{formatBrl(GOLD_PREMIUM_PRODUCT.priceBrl)}</span>
                            </span>
                        </button>
                        <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                            {isStaffAccess ? 'Acesso liberado para equipe' : isPlatinum ? 'Já incluso no plano maior' : moneyCheckoutSalesCopy}
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
                            <h2 className="text-xl font-black uppercase tracking-[0.06em] text-[color:var(--ui-card-text)]">Platinum 30 dias</h2>
                            <p className="mt-1 max-w-[26rem] text-sm leading-relaxed text-[color:var(--ui-card-text-soft)]">
                                O pacote mais alto: leva tudo do Premium e empurra identidade, vitrine e legado para o patamar máximo.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                                    {isPlatinum ? premiumBadgeLabel : '30 dias'}
                                </span>
                                <span className="rounded-full border border-amber-200/18 bg-amber-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
                                    1 legado grátis por ativação
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {[platinumBenefitLeft, platinumBenefitRight].map((column, columnIndex) => (
                            <div key={`platinum-col-${columnIndex}`} className="space-y-2">
                                {column.map((benefit) => (
                                    <div key={benefit} className="flex min-h-[38px] items-center gap-2 rounded-xl border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-2.5 py-2">
                                        <CheckIcon className="h-3.5 w-3.5 shrink-0 text-green-400" />
                                        <span className="text-[11px] leading-snug text-[color:var(--ui-card-text-soft)]">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex min-w-[176px] flex-col items-stretch gap-2">
                        <button
                            onClick={() => setSelectedMembership({
                                amount: GOLD_PLATINUM_PRODUCT.priceBrl,
                                membershipId: GOLD_PLATINUM_PRODUCT.id,
                                membershipName: GOLD_PLATINUM_PRODUCT.name,
                                membershipTier: 'platinum',
                                equivalentGold: GOLD_PLATINUM_PRODUCT.priceGold,
                            })}
                            disabled={!!loading}
                            className="luxe-skin-button inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span>{isPlatinum ? 'Estender 30 dias' : activeMembershipTier === 'premium' ? 'Subir para Platinum 30 dias' : 'Ativar 30 dias'}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-[11px]">
                                <span>{formatBrl(GOLD_PLATINUM_PRODUCT.priceBrl)}</span>
                            </span>
                        </button>
                        <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                            {moneyCheckoutSalesCopy}
                        </span>
                    </div>
                </div>
            </GlassCard>
            {selectedMembership && (
                <BillingCheckoutGate
                    kind="membership"
                    internalProductId={selectedMembership.membershipId}
                    amount={selectedMembership.amount}
                    membershipTier={selectedMembership.membershipTier}
                    membershipName={selectedMembership.membershipName}
                    equivalentGold={selectedMembership.equivalentGold}
                    onClose={() => setSelectedMembership(null)}
                />
            )}
        </div>
    );
};
