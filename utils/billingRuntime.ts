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
        return 'Google Play Billing nativo';
    }

    if (platform === 'ios') {
        return 'App Store Billing em preparacao';
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
        return 'Este build Android ja abre a compra nativa da Google Play. O que falta agora e a conciliacao do credito pelo backend.';
    }

    if (platform === 'ios') {
        return 'Este build iOS ainda abre o checkout web. Antes da publicacao, ele sera trocado por App Store Billing.';
    }

    return null;
};
