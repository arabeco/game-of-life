import React, { useEffect, useMemo, useState } from 'react';
import type { BillingInternalProductId } from '../../constants/billingCatalog';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';
import { ARTE_DO_PRODUTO, GOLD_PLATINUM_PRODUCT, GOLD_PREMIUM_PRODUCT } from '../../constants/goldCatalog';
import { CheckIcon } from '../Icons';
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

/**
 * O CARTAO DE UM PLANO (28/10/2026): a arte do produto ao lado do nome, o
 * preco em destaque logo embaixo, as vantagens numa coluna so (sem caixinha em
 * volta de cada uma) e os botoes no pe. O mesmo desenho nos dois planos; muda
 * so o tom.
 */
const CartaoDoPlano: React.FC<{
    id: string;
    arte: string;
    nome: string;
    frase: string;
    estado: string;
    ativo: boolean;
    produto: typeof GOLD_PREMIUM_PRODUCT | typeof GOLD_PLATINUM_PRODUCT;
    vantagens: string[];
    tom: 'ouro' | 'platina';
    children: React.ReactNode;
}> = ({ id, arte, nome, frase, estado, ativo, produto, vantagens, tom, children }) => (
    <GlassCard id={id} className={`relative overflow-hidden ${tom === 'ouro' ? 'border-[var(--ui-border-accent-soft)]' : 'border-[var(--ui-border-accent)]'}`}>
        <div className={`pointer-events-none absolute inset-0 ${tom === 'ouro'
            ? 'bg-[radial-gradient(circle_at_0%_0%,rgba(243,212,138,0.16),transparent_55%)]'
            : 'bg-[radial-gradient(circle_at_0%_0%,rgba(170,195,255,0.16),transparent_55%)]'}`} />
        <div className="relative z-10 grid gap-4 p-4 md:grid-cols-[minmax(0,1.2fr)_auto] md:items-start">
            <div className="min-w-0 space-y-3">
                <div className="flex items-center gap-3">
                    <img
                        src={arte}
                        alt=""
                        aria-hidden="true"
                        className={`h-16 w-16 shrink-0 rounded-2xl object-cover ${tom === 'ouro' ? 'shadow-[0_0_22px_rgba(243,212,138,0.3)]' : 'shadow-[0_0_22px_rgba(170,195,255,0.3)]'}`}
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-black uppercase tracking-[0.05em] text-[color:var(--ui-card-text)]">{nome}</h2>
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${ativo ? 'border-[var(--skin-accent-color)]/40 bg-[var(--skin-accent-color)]/12 text-[var(--ui-text-accent)]' : 'border-white/12 text-[color:var(--ui-card-text-soft)]'}`}>{estado}</span>
                        </div>
                        <div className="mt-0.5 flex items-baseline gap-1.5">
                            <span className={`text-2xl font-black tabular-nums ${tom === 'ouro' ? 'text-[var(--gold)]' : 'text-[#dfe7ff]'}`}>{formatBrl(produto.priceBrl)}</span>
                            <span className="text-[11px] text-[color:var(--ui-card-text-soft)]">por mês</span>
                        </div>
                        <p className="text-[10px] text-[color:var(--ui-card-text-soft)]">ou {formatBrl(produto.priceBrlAnnual)} por ano · {formatBrl(produto.priceBrlAnnual / 12)} por mês</p>
                    </div>
                </div>
                <p className="text-[12px] leading-snug text-[color:var(--ui-card-text-soft)]">{frase}</p>
                <ul className="space-y-1.5">
                    {vantagens.map((vantagem) => (
                        <li key={vantagem} className="flex items-start gap-2 text-[12px] leading-snug text-[color:var(--ui-card-text)]">
                            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                            <span>{vantagem}</span>
                        </li>
                    ))}
                </ul>
            </div>
            {children}
        </div>
    </GlassCard>
);

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
    // Faltando menos de 2 dias, a hora entra: e quando a Play renova, e "ate 29
    // de out." nao diz se ainda vale hoje a noite.
    const premiumExpiresAt = userProfile.premiumExpiresAt ? new Date(userProfile.premiumExpiresAt) : null;
    const venceLogo = premiumExpiresAt ? premiumExpiresAt.getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000 : false;
    const premiumExpiresLabel = premiumExpiresAt
        ? new Intl.DateTimeFormat('pt-BR', venceLogo
            ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
            : { day: '2-digit', month: 'short' }).format(premiumExpiresAt)
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

    const estadoDoPlano = (doPlano: boolean) => {
        if (isStaffAccess) return 'Acesso GM';
        if (!doPlano) return 'Disponível';
        return premiumDaysRemaining != null && premiumExpiresLabel ? `Ativo · até ${premiumExpiresLabel}` : 'Ativo';
    };

    // Essencial (27/10/2026): os planos nao prometem aparencia (fundos e
    // aparencias premium), que esse modo nao mostra.
    const semAparencia = (lista: readonly string[]) => (modoEssencial ? lista.filter((linha) => !/fundo|aparência/i.test(linha)) : [...lista]);
    const premiumBenefits = useMemo(() => semAparencia(GOLD_PREMIUM_PRODUCT.benefits), [modoEssencial]);
    const platinumBenefits = useMemo(() => semAparencia(GOLD_PLATINUM_PRODUCT.benefits), [modoEssencial]);

    return (
        <div className="space-y-5 animate-fade-in pb-8">
            <CartaoDoPlano
                id="gold-store-premium"
                arte={ARTE_DO_PRODUTO.premium_30d}
                nome="Premium"
                frase="Para quem usa o Glyph todo dia: a leitura completa do seu dia e do seu ciclo, o Oráculo inteiro e mais arenas."
                estado={estadoDoPlano(isPremium && !isPlatinum)}
                ativo={isPremium && !isPlatinum}
                produto={GOLD_PREMIUM_PRODUCT}
                vantagens={premiumBenefits}
                tom="ouro"
            >
                <BotoesDoPlano
                    produto={GOLD_PREMIUM_PRODUCT}
                    rotuloMensal={isPlatinum ? 'Platinum ativo' : isPremium ? 'Estender 30 dias' : 'Assinar mensal'}
                    desabilitado={!!loading || isPlatinum}
                    ouroNaCarteira={ouroNaCarteira}
                    onDinheiro={abrirCheckout('premium', GOLD_PREMIUM_PRODUCT.priceGold)}
                    onOuro={() => pagarComOuro(GOLD_PREMIUM_PRODUCT.id)}
                    rodape={isStaffAccess ? 'Acesso liberado para equipe' : isPlatinum ? 'Já incluso no plano maior' : moneyCheckoutSalesCopy}
                />
            </CartaoDoPlano>

            <CartaoDoPlano
                id="gold-store-platinum"
                arte={ARTE_DO_PRODUTO.platinum_30d}
                nome="Platinum"
                frase="Tudo do Premium, para quem acompanha outras pessoas ou quer tudo: 40 arenas, 5 fichas de vínculo e todos os temas."
                estado={estadoDoPlano(isPlatinum)}
                ativo={isPlatinum}
                produto={GOLD_PLATINUM_PRODUCT}
                vantagens={platinumBenefits}
                tom="platina"
            >
                <BotoesDoPlano
                    produto={GOLD_PLATINUM_PRODUCT}
                    rotuloMensal={isPlatinum ? 'Estender 30 dias' : activeMembershipTier === 'premium' ? 'Subir para Platinum' : 'Assinar mensal'}
                    desabilitado={!!loading}
                    ouroNaCarteira={ouroNaCarteira}
                    onDinheiro={abrirCheckout('platinum', GOLD_PLATINUM_PRODUCT.priceGold)}
                    onOuro={() => pagarComOuro(GOLD_PLATINUM_PRODUCT.id)}
                    rodape={moneyCheckoutSalesCopy}
                />
            </CartaoDoPlano>
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
