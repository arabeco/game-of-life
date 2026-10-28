import React, { useEffect, useMemo, useState } from 'react';
import type { BillingInternalProductId } from '../../constants/billingCatalog';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { GOLD_PLATINUM_PRODUCT, GOLD_PREMIUM_PRODUCT } from '../../constants/goldCatalog';
import { CheckIcon, CrownIcon } from '../Icons';
import { BillingCheckoutGate } from './BillingCheckoutGate';
import { getActiveSubscriptionTier, getPremiumDaysRemaining, hasPlatinumAccess, hasPremiumAccess, isStaffRole } from '../../utils/premiumAccess';
import { getMoneyCheckoutSalesCopy } from '../../utils/billingRuntime';
import { canUseNativeStoreBilling } from '../../utils/nativeBilling';

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
 * Boost de EXP nao existe mais (13/10/2026): nem aqui nem no ouro. Plano vende
 * conforto, visual e leitura; progressao e so do que a pessoa faz.
 */

type MembershipCheckoutState = {
    amount: number;
    membershipId: BillingInternalProductId;
    membershipName: string;
    membershipTier: 'premium' | 'platinum';
    equivalentGold: number;
};

const formatBrl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * OS BOTOES DE UM PLANO (28/10/2026): mensal em dinheiro, anual em dinheiro e
 * mensal em ouro. O anual so aparece no app Android, onde a Play cobra pelo
 * plano base `anual`; no navegador o checkout e so o mensal.
 */
const BotoesDoPlano: React.FC<{
    produto: typeof GOLD_PREMIUM_PRODUCT | typeof GOLD_PLATINUM_PRODUCT;
    rotuloMensal: string;
    desabilitado: boolean;
    ouroNaCarteira: number;
    onDinheiro: (id: BillingInternalProductId, valor: number, nome: string) => void;
    onOuro: () => void;
    rodape: string;
}> = ({ produto, rotuloMensal, desabilitado, ouroNaCarteira, onDinheiro, onOuro, rodape }) => {
    const mostraAnual = canUseNativeStoreBilling();
    const porMes = produto.priceBrlAnnual / 12;
    return (
        <div className="flex min-w-[176px] flex-col items-stretch gap-2">
            <button
                onClick={() => onDinheiro(produto.id, produto.priceBrl, produto.name)}
                disabled={desabilitado}
                className="luxe-skin-button inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span>{rotuloMensal}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-[11px]">{formatBrl(produto.priceBrl)}</span>
            </button>
            {mostraAnual && (
                <button
                    onClick={() => onDinheiro(produto.annualId, produto.priceBrlAnnual, produto.name.replace('30 dias', '12 meses'))}
                    disabled={desabilitado}
                    className="inline-flex w-full flex-col items-center rounded-2xl border border-[var(--skin-accent-color)]/45 bg-[var(--skin-accent-color)]/10 py-2 text-[var(--ui-text-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className="text-xs font-black uppercase tracking-[0.16em]">12 meses · {formatBrl(produto.priceBrlAnnual)}</span>
                    <span className="text-[10px] font-semibold opacity-80">{formatBrl(porMes)} por mês</span>
                </button>
            )}
            <button
                onClick={onOuro}
                disabled={desabilitado}
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-2 text-[11px] font-bold text-amber-200/90 disabled:cursor-not-allowed disabled:opacity-50"
                title={ouroNaCarteira < produto.priceGold ? `Faltam ${produto.priceGold - ouroNaCarteira} ouro` : undefined}
            >
                ou {produto.priceGold} ouro por 30 dias
            </button>
            <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">{rodape}</span>
        </div>
    );
};

const splitBenefitsIntoColumns = (benefits: readonly string[]) => {
    const midpoint = Math.ceil(benefits.length / 2);
    return [benefits.slice(0, midpoint), benefits.slice(midpoint)];
};

export const MembershipStore: React.FC<{ scrollRequest?: { section: string; nonce: number } | null }> = ({ scrollRequest = null }) => {
    const { userProfile, modoEssencial, buyStoreItem } = useGame();
    const ouroNaCarteira = Number(userProfile.wallet?.gold || 0);
    const pagarComOuro = (id: string) => { void buyStoreItem(id, 'premium'); };
    const abrirCheckout = (tier: 'premium' | 'platinum', equivalentGold: number) => (id: BillingInternalProductId, valor: number, nome: string) =>
        setSelectedMembership({ amount: valor, membershipId: id, membershipName: nome, membershipTier: tier, equivalentGold });
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

    // Essencial (27/10/2026): os planos nao prometem aparencia (fundos e
    // aparencias premium), que esse modo nao mostra.
    const semAparencia = (lista: readonly string[]) => (modoEssencial ? lista.filter((linha) => !/fundo|aparência/i.test(linha)) : [...lista]);
    const premiumBenefits = useMemo(() => semAparencia(GOLD_PREMIUM_PRODUCT.benefits), [modoEssencial]);
    const platinumBenefits = useMemo(() => semAparencia(GOLD_PLATINUM_PRODUCT.benefits), [modoEssencial]);
    const [premiumBenefitLeft, premiumBenefitRight] = useMemo(() => splitBenefitsIntoColumns(premiumBenefits), [premiumBenefits]);
    const [platinumBenefitLeft, platinumBenefitRight] = useMemo(() => splitBenefitsIntoColumns(platinumBenefits), [platinumBenefits]);

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            <GlassCard id="gold-store-premium" className="relative overflow-hidden border-[var(--ui-border-accent-soft)]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-yellow-900/20 via-yellow-500/5 to-transparent" />
                <div className="relative z-10 grid gap-4 p-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_auto] md:items-center">
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
                            <h2 className="text-lg font-black uppercase tracking-[0.05em] text-[color:var(--ui-card-text)]">Premium</h2>
                            <p className="mt-1 max-w-[26rem] text-[13px] leading-snug text-[color:var(--ui-card-text-soft)]">
                                Para quem usa o Glyph todo dia: a leitura completa do seu dia e do seu ciclo, o Oráculo inteiro e mais arenas.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                                    {isStaffAccess ? 'Acesso GM' : isPlatinum ? 'Platinum 30 dias ativo' : premiumBadgeLabel}
                                </span>
                                <span className="rounded-full border border-[var(--skin-accent-color)]/18 bg-[var(--skin-accent-color)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--ui-text-accent)]">
                                    Até 20 arenas
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {[premiumBenefitLeft, premiumBenefitRight].map((column, columnIndex) => (
                            <div key={`premium-col-${columnIndex}`} className="space-y-2">
                                {column.map((benefit) => (
                                    <div key={benefit} className="flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-2 py-1.5">
                                        <CheckIcon className="h-3.5 w-3.5 shrink-0 text-green-400" />
                                        <span className="text-[10px] leading-tight text-[color:var(--ui-card-text-soft)]">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <BotoesDoPlano
                        produto={GOLD_PREMIUM_PRODUCT}
                        rotuloMensal={isPlatinum ? 'Platinum ativo' : isPremium ? 'Estender 30 dias' : 'Assinar mensal'}
                        desabilitado={!!loading || isPlatinum}
                        ouroNaCarteira={ouroNaCarteira}
                        onDinheiro={abrirCheckout('premium', GOLD_PREMIUM_PRODUCT.priceGold)}
                        onOuro={() => pagarComOuro(GOLD_PREMIUM_PRODUCT.id)}
                        rodape={isStaffAccess ? 'Acesso liberado para equipe' : isPlatinum ? 'Já incluso no plano maior' : moneyCheckoutSalesCopy}
                    />
                </div>
            </GlassCard>

            <GlassCard id="gold-store-platinum" className="relative overflow-hidden border-[var(--ui-border-accent)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,244,206,0.18),transparent_56%),linear-gradient(135deg,rgba(186,144,255,0.12),transparent_46%)]" />
                <div className="relative z-10 grid gap-4 p-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_auto] md:items-center">
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
                            <h2 className="text-lg font-black uppercase tracking-[0.05em] text-[color:var(--ui-card-text)]">Platinum</h2>
                            <p className="mt-1 max-w-[26rem] text-[13px] leading-snug text-[color:var(--ui-card-text-soft)]">
                                Tudo do Premium, para quem acompanha outras pessoas ou quer tudo: 40 arenas, 5 fichas de vínculo e todos os temas.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[color:var(--ui-card-text-soft)]">
                                    {isPlatinum ? premiumBadgeLabel : '30 dias'}
                                </span>
                                <span className="rounded-full border border-amber-200/18 bg-amber-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
                                    Até 40 arenas
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {[platinumBenefitLeft, platinumBenefitRight].map((column, columnIndex) => (
                            <div key={`platinum-col-${columnIndex}`} className="space-y-2">
                                {column.map((benefit) => (
                                    <div key={benefit} className="flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[var(--ui-core-surface-border)] bg-[var(--ui-core-surface-bg)] px-2 py-1.5">
                                        <CheckIcon className="h-3.5 w-3.5 shrink-0 text-green-400" />
                                        <span className="text-[10px] leading-tight text-[color:var(--ui-card-text-soft)]">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <BotoesDoPlano
                        produto={GOLD_PLATINUM_PRODUCT}
                        rotuloMensal={isPlatinum ? 'Estender 30 dias' : activeMembershipTier === 'premium' ? 'Subir para Platinum' : 'Assinar mensal'}
                        desabilitado={!!loading}
                        ouroNaCarteira={ouroNaCarteira}
                        onDinheiro={abrirCheckout('platinum', GOLD_PLATINUM_PRODUCT.priceGold)}
                        onOuro={() => pagarComOuro(GOLD_PLATINUM_PRODUCT.id)}
                        rodape={moneyCheckoutSalesCopy}
                    />
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
