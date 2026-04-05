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
import { useGame } from '../../contexts/GameContext';

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
    const { showToast } = useGame();
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
                showToast('Compra pendente na Google Play. Aguarde a confirmacao final.', 'warning');
                return;
            }

            showToast('Compra confirmada na Google Play. O credito ainda sera conciliado no backend.', 'success');
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

    return (
        <Portal>
            <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/80 p-4 animate-fade-in backdrop-blur-md">
                <GlassCard className="relative flex w-full max-w-md flex-col overflow-hidden rounded-[30px] border-[var(--skin-accent-color)]/20 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/10 bg-black/40 p-4 backdrop-blur-md">
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white">Billing da loja</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--skin-accent-color)]">
                                {formatBrl(props.amount)} - {productSummary}
                            </p>
                        </div>
                        <button onClick={props.onClose} className="rounded-full p-2 text-gray-400 transition-all hover:scale-110 hover:bg-white/10 hover:text-white">
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-4 bg-black/60 px-5 py-6">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">
                                {runtimePlatform === 'android' ? 'Google Play' : 'App Store'}
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-white">
                                {runtimePlatform === 'android'
                                    ? 'Este build nativo ja entra na trilha da Google Play. A compra abre pela loja do aparelho, e a conciliacao do credito sera a proxima camada.'
                                    : 'Este fluxo iOS ja ficou separado do checkout web. A proxima etapa no Mac/Xcode e plugar o StoreKit e manter este mesmo layout.'}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">Produto</div>
                            <div className="mt-1 text-base font-black text-white">{productSummary}</div>
                            {billingEntry && (
                                <div className="mt-3 space-y-1 text-[11px] text-gray-300">
                                    <div><span className="font-bold text-white/70">Play SKU:</span> {billingEntry.googlePlayProductId}</div>
                                    <div><span className="font-bold text-white/70">App Store SKU:</span> {billingEntry.appStoreProductId}</div>
                                    <div><span className="font-bold text-white/70">Tipo:</span> {billingEntry.kind === 'subscription' ? 'assinatura' : 'consumivel'}</div>
                                </div>
                            )}
                        </div>

                        {runtimePlatform === 'android' && (
                            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">Estado da Google Play</div>
                                <div className="mt-2 space-y-2 text-[12px] leading-relaxed text-cyan-50">
                                    {androidStatus && !androidError && (
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/80">
                                            {androidStatus.connected ? 'Conectado' : 'Nao conectado'}
                                        </p>
                                    )}
                                    {isLoadingAndroidProduct && <p>Consultando produto na Google Play...</p>}
                                    {!isLoadingAndroidProduct && androidError && <p>{androidError}</p>}
                                    {!isLoadingAndroidProduct && !androidError && androidProduct && (
                                        <>
                                            <p className="font-bold text-white">{androidProduct.title || productSummary}</p>
                                            <p>{androidProduct.description || 'Produto carregado pela Google Play neste aparelho.'}</p>
                                            <p className="font-black uppercase tracking-[0.14em] text-cyan-100">
                                                {androidProduct.formattedPrice || formatBrl(props.amount)}
                                            </p>
                                        </>
                                    )}
                                    {!isLoadingAndroidProduct && !androidError && !androidProduct && (
                                        <p>O produto ainda nao apareceu na Google Play deste aparelho.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {isIosStoreFlow && (
                            <div className="rounded-2xl border border-slate-200/15 bg-slate-100/10 p-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-100">Estado da App Store</div>
                                <div className="mt-2 space-y-2 text-[12px] leading-relaxed text-slate-100/90">
                                    <p className="font-bold text-white">{productSummary}</p>
                                    <p>O produto ja esta mapeado para o SKU da Apple e esta pronto para receber StoreKit assim que o projeto iOS for aberto no Xcode.</p>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-100/70">
                                        SKU iOS: {billingEntry?.appStoreProductId}
                                    </p>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-100/70">
                                        Tipo: {billingEntry?.kind === 'subscription' ? 'assinatura' : 'consumivel'}
                                    </p>
                                    {iosStatusMessage && (
                                        <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] leading-relaxed text-slate-50">
                                            {iosStatusMessage}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {androidPurchaseResult && runtimePlatform === 'android' && (
                            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-[11px] leading-relaxed text-amber-100">
                                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-50">Ultimo retorno da loja</div>
                                <div className="mt-2 space-y-1">
                                    <p><span className="font-bold text-white/85">Estado:</span> {androidPurchaseResult.purchaseState}</p>
                                    <p><span className="font-bold text-white/85">Produto:</span> {androidPurchaseResult.products.join(', ') || billingEntry?.googlePlayProductId}</p>
                                    <p><span className="font-bold text-white/85">Pedido:</span> {androidPurchaseResult.orderId || 'sem orderId ainda'}</p>
                                    <p>{androidPurchaseResult.developerNote || 'Compra registrada na Google Play. Falta conciliar o credito no backend.'}</p>
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-[11px] leading-relaxed text-amber-100">
                            No app publicado, compra digital nao deve fechar no Pix/web. Aqui o fallback web fica exposto so para este build de desenvolvimento.
                        </div>

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
                            <button
                                type="button"
                                onClick={() => setForceWebFallback(true)}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
                            >
                                {runtimePlatform === 'ios' ? 'Abrir fallback web enquanto o StoreKit nao entra' : 'Abrir fallback web neste build'}
                            </button>
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
