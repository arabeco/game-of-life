import React, { useEffect, useMemo, useState } from 'react';
import { Portal } from '../Portal';
import { GlassCard } from '../GlassCard';
import { XIcon } from '../Icons';
import { MercadoPagoBrick } from './MercadoPagoBrick';
import { BillingInternalProductId, getBillingCatalogEntry } from '../../constants/billingCatalog';
import { getBillingRuntimePlatform, shouldUseStoreBilling } from '../../utils/billingRuntime';
import {
    getNativeStoreBillingStatus,
    getNativeStoreProduct,
    purchaseNativeStoreProduct,
    type NativeStoreBillingProduct,
    type NativeStoreBillingPurchaseResult,
    type NativeStoreBillingStatus,
} from '../../utils/nativeBilling';
import { useGame, type GoldPackPurchaseContext } from '../../contexts/GameContext';
import { supabase } from '../../supabaseClient';

type GoldBillingCheckoutConfig = {
    kind: 'gold';
    internalProductId: BillingInternalProductId;
    amount: number;
    goldAmount: number;
    onClose: () => void;
};

type MembershipBillingCheckoutConfig = {
    kind: 'membership';
    internalProductId: BillingInternalProductId;
    amount: number;
    membershipTier: 'premium' | 'platinum';
    membershipName: string;
    equivalentGold: number;
    onClose: () => void;
};

type BillingCheckoutGateProps = GoldBillingCheckoutConfig | MembershipBillingCheckoutConfig;

const formatBrl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const BillingCheckoutGate: React.FC<BillingCheckoutGateProps> = (props) => {
    const { buyGoldPack, showToast, updateUserProfile } = useGame();
    const [forceWebFallback, setForceWebFallback] = useState(false);
    const [isLoadingAndroidProduct, setIsLoadingAndroidProduct] = useState(false);
    const [androidStatus, setAndroidStatus] = useState<NativeStoreBillingStatus | null>(null);
    const [androidProduct, setAndroidProduct] = useState<NativeStoreBillingProduct | null>(null);
    const [androidError, setAndroidError] = useState<string | null>(null);
    const [isPurchasingAndroid, setIsPurchasingAndroid] = useState(false);
    const [androidPurchaseResult, setAndroidPurchaseResult] = useState<NativeStoreBillingPurchaseResult | null>(null);
    const [iosStatusMessage, setIosStatusMessage] = useState<string | null>(null);
    const runtimePlatform = getBillingRuntimePlatform();
    const shouldUseNativeStoreBilling = shouldUseStoreBilling() && !forceWebFallback;
    const billingEntry = getBillingCatalogEntry(props.internalProductId);
    const isAndroidStoreFlow = shouldUseNativeStoreBilling && runtimePlatform === 'android' && !!billingEntry;
    const isIosStoreFlow = shouldUseNativeStoreBilling && runtimePlatform === 'ios' && !!billingEntry;

    const productSummary = useMemo(() => {
        if (props.kind === 'gold') {
            return `${props.goldAmount} ouro`;
        }

        return props.membershipName;
    }, [props]);

    useEffect(() => {
        if (!isAndroidStoreFlow || !billingEntry) {
            setAndroidStatus(null);
            setAndroidProduct(null);
            setAndroidError(null);
            setAndroidPurchaseResult(null);
            setIsLoadingAndroidProduct(false);
            return;
        }

        let cancelled = false;
        setAndroidStatus(null);
        setAndroidProduct(null);
        setAndroidError(null);
        setAndroidPurchaseResult(null);
        setIsLoadingAndroidProduct(true);

        (async () => {
            try {
                const status = await getNativeStoreBillingStatus();
                if (cancelled) return;
                setAndroidStatus(status);

                if (!status.available || !status.connected || !status.canMakePayments) {
                    setAndroidError(status.reason || 'Google Play Billing indisponivel neste aparelho.');
                    return;
                }

                const product = await getNativeStoreProduct(billingEntry.googlePlayProductId, billingEntry.kind);
                if (cancelled) return;
                setAndroidProduct(product);
            } catch (error) {
                if (cancelled) return;
                setAndroidError(error instanceof Error ? error.message : 'Nao foi possivel consultar o produto na Google Play.');
            } finally {
                if (!cancelled) {
                    setIsLoadingAndroidProduct(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [billingEntry, isAndroidStoreFlow]);

    const handleAndroidPurchase = async () => {
        if (!billingEntry || isPurchasingAndroid) return;

        setIsPurchasingAndroid(true);
        try {
            const result = await purchaseNativeStoreProduct(billingEntry.googlePlayProductId, billingEntry.kind);
            setAndroidPurchaseResult(result);

            if (result.purchaseState === 'pending') {
                showToast('Compra pendente na Google Play. Assim que aprovar, o app libera o produto.', 'warning');
                return;
            }

            if (props.kind === 'gold') {
                const purchaseContext: GoldPackPurchaseContext = {
                    platform: result.platform,
                    productId: billingEntry.googlePlayProductId,
                    orderId: result.orderId,
                    purchaseToken: result.purchaseToken,
                    packageName: result.packageName,
                    consumed: result.consumed,
                    acknowledged: result.acknowledged,
                    needsServerReconciliation: result.needsServerReconciliation,
                    products: result.products,
                };
                const credited = await buyGoldPack(props.internalProductId, purchaseContext);
                if (credited) props.onClose();
                return;
            }

            const purchaseContext = {
                platform: result.platform,
                productId: billingEntry.googlePlayProductId,
                orderId: result.orderId,
                purchaseToken: result.purchaseToken,
                packageName: result.packageName,
                consumed: result.consumed,
                acknowledged: result.acknowledged,
                needsServerReconciliation: result.needsServerReconciliation,
                products: result.products,
            };

            if (!purchaseContext.purchaseToken) {
                throw new Error('A Google Play nao retornou o recibo da compra.');
            }

            const { data, error } = await supabase.functions.invoke('google-play-purchase', {
                body: {
                    kind: 'membership',
                    membershipTier: props.membershipTier,
                    productId: billingEntry.googlePlayProductId,
                    orderId: purchaseContext.orderId || null,
                    purchaseToken: purchaseContext.purchaseToken,
                    packageName: purchaseContext.packageName || null,
                    platform: purchaseContext.platform || 'android',
                    consumed: purchaseContext.consumed ?? null,
                    acknowledged: purchaseContext.acknowledged ?? null,
                    needsServerReconciliation: purchaseContext.needsServerReconciliation ?? null,
                    products: purchaseContext.products || [],
                },
            });

            if (error || !(data as any)?.success) {
                console.error('Google Play membership validation failed:', error || data);
                throw new Error('Plano nao validado pela Google Play. Se houve cobranca, me avise para conciliar.');
            }

            updateUserProfile({
                isPremium: true,
                subscriptionTier: ((data as any).membership_tier === 'platinum' ? 'platinum' : 'premium'),
                premiumExpiresAt: (data as any).premium_expires_at || null,
                premiumRewardPending: true,
            });

            showToast(`${props.membershipName} ativado pela Google Play.`, 'success');
            props.onClose();
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Falha ao abrir a compra na Google Play.', 'error');
        } finally {
            setIsPurchasingAndroid(false);
        }
    };

    const handleIosPlaceholderAction = (action: 'purchase' | 'restore') => {
        const nextMessage = action === 'purchase'
            ? 'A compra iOS ja esta preparada nesta tela. No Mac/Xcode, vamos plugar o StoreKit exatamente neste botao.'
            : 'A restauracao de compras iOS ja esta prevista aqui. Falta conectar o StoreKit e a conciliacao no backend.';

        setIosStatusMessage(nextMessage);
        showToast(nextMessage, 'info');
    };

    if (!shouldUseNativeStoreBilling) {
        return <MercadoPagoBrick {...props} />;
    }

    const canShowWebFallback = runtimePlatform === 'web' || import.meta.env.DEV;

    return (
        <Portal>
            <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-md">
                <GlassCard className="relative flex w-full max-w-md flex-col overflow-hidden rounded-[30px] border-[var(--skin-accent-color)]/20 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 bg-black/40 p-4 backdrop-blur-md">
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">Compra segura</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--skin-accent-color)]">
                                {formatBrl(props.amount)} - {productSummary}
                            </p>
                        </div>
                        <button onClick={props.onClose} className="rounded-full p-2 text-gray-400 transition-all hover:scale-110 hover:bg-white/10 hover:text-white">
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-4 bg-black/60 px-5 py-6">
                        <div className="rounded-2xl border border-[var(--skin-accent-color)]/25 bg-white/[0.04] p-4 shadow-inner">
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--skin-accent-color)]">
                                {runtimePlatform === 'android' ? 'Google Play' : 'App Store'}
                            </div>
                            <div className="mt-2 text-2xl font-black text-white">{productSummary}</div>
                            <p className="mt-1 text-sm font-semibold text-white/70">
                                {androidProduct?.formattedPrice || formatBrl(props.amount)}
                            </p>
                        </div>

                        {runtimePlatform === 'android' && (
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                <div className="space-y-2 text-[12px] leading-relaxed text-white/75">
                                    {isLoadingAndroidProduct && <p>Carregando compra segura...</p>}
                                    {!isLoadingAndroidProduct && androidError && <p>{androidError}</p>}
                                    {!isLoadingAndroidProduct && !androidError && androidProduct && (
                                        <>
                                            <p className="font-bold text-white">{androidProduct.title || productSummary}</p>
                                            <p>{androidProduct.description || 'Compra processada com seguranca pela Google Play.'}</p>
                                        </>
                                    )}
                                    {!isLoadingAndroidProduct && !androidError && !androidProduct && (
                                        <p>Esta compra ainda nao apareceu na Google Play deste aparelho.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {isIosStoreFlow && (
                            <div className="rounded-2xl border border-slate-200/15 bg-slate-100/10 p-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-100">Estado da App Store</div>
                                <div className="mt-2 space-y-2 text-[12px] leading-relaxed text-slate-100/90">
                                    <p className="font-bold text-white">{productSummary}</p>
                                    <p>A compra pela App Store sera liberada na versao iOS.</p>
                                    {iosStatusMessage && (
                                        <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] leading-relaxed text-slate-50">
                                            {iosStatusMessage}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {androidPurchaseResult && runtimePlatform === 'android' && (
                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-[12px] leading-relaxed text-emerald-50">
                                {androidPurchaseResult.purchaseState === 'pending'
                                    ? 'Sua compra ficou pendente na Google Play.'
                                    : props.kind === 'gold'
                                        ? 'Compra aprovada. Seu Ouro foi liberado.'
                                        : 'Compra aprovada.'}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            {runtimePlatform === 'android' && (
                                <button
                                    type="button"
                                    onClick={() => void handleAndroidPurchase()}
                                    disabled={isLoadingAndroidProduct || isPurchasingAndroid || !androidProduct}
                                    className="luxe-skin-button w-full rounded-xl py-3 text-xs font-bold uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isPurchasingAndroid
                                        ? 'Abrindo Google Play...'
                                            : props.kind === 'membership'
                                                ? `Ativar 30 dias na Google Play${androidProduct?.formattedPrice ? ` - ${androidProduct.formattedPrice}` : ''}`
                                                : androidProduct?.formattedPrice
                                                    ? `Comprar na Google Play - ${androidProduct.formattedPrice}`
                                                    : 'Comprar na Google Play'}
                                </button>
                            )}
                            {isIosStoreFlow && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleIosPlaceholderAction('purchase')}
                                        className="luxe-skin-button w-full rounded-xl py-3 text-xs font-bold uppercase tracking-widest"
                                    >
                                        Comprar pela App Store
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleIosPlaceholderAction('restore')}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
                                    >
                                        Restaurar compras Apple
                                    </button>
                                </>
                            )}
                            {canShowWebFallback && (
                                <button
                                    type="button"
                                    onClick={() => setForceWebFallback(true)}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
                                >
                                    Abrir checkout web
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={props.onClose}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
