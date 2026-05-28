import { Capacitor } from '@capacitor/core';
import { isCapacitorNativeRuntime } from './runtimePlatform';

export type BillingRuntimePlatform = 'web' | 'android' | 'ios';

export const getBillingRuntimePlatform = (): BillingRuntimePlatform => {
    if (!isCapacitorNativeRuntime()) {
        return 'web';
    }

    try {
        const platform = String(Capacitor.getPlatform?.() || '').trim().toLowerCase();
        if (platform === 'ios') return 'ios';
        if (platform === 'android') return 'android';
    } catch (_error) {
        // noop
    }

    return 'android';
};

export const shouldUseStoreBilling = (): boolean =>
    getBillingRuntimePlatform() !== 'web';

export const getMoneyCheckoutSalesCopy = (): string => {
    const platform = getBillingRuntimePlatform();

    if (platform === 'android') {
        return 'Google Play';
    }

    if (platform === 'ios') {
        return 'App Store';
    }

    return 'Produto direto no Pix';
};

export const getGoldPackChannelBadgeCopy = (): string => {
    const platform = getBillingRuntimePlatform();

    if (platform === 'android') {
        return 'Google Play';
    }

    if (platform === 'ios') {
        return 'Compra pela App Store';
    }

    return 'Compra avulsa';
};

export const getMoneyCheckoutRuntimeWarning = (): string | null => {
    const platform = getBillingRuntimePlatform();

    if (platform === 'android') {
        return 'Este build Android ja abre a compra nativa da Google Play. A liberacao final do produto depende da confirmacao segura do backend.';
    }

    if (platform === 'ios') {
        return 'A UI de compra iOS ja esta pronta. Falta ligar StoreKit, restauracao de compras e conciliacao backend quando o projeto abrir no Xcode.';
    }

    return null;
};
