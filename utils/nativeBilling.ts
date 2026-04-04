import { Capacitor, registerPlugin } from '@capacitor/core';
import type { BillingMonetizationKind } from '../constants/billingCatalog';
import { isCapacitorNativeRuntime } from './runtimePlatform';

export interface NativeStoreBillingStatus {
    platform: 'android';
    available: boolean;
    connected: boolean;
    canMakePayments: boolean;
    reason: string;
    responseCode: number;
}

export interface NativeStoreBillingProduct {
    platform: 'android';
    available: boolean;
    productId: string;
    title: string;
    description: string;
    formattedPrice: string;
    offerTokenAvailable: boolean;
    type: BillingMonetizationKind;
}

export interface NativeStoreBillingPurchaseResult {
    platform: 'android';
    purchaseState: 'pending' | 'purchased';
    orderId: string;
    purchaseToken: string;
    acknowledged: boolean;
    consumed: boolean;
    packageName: string;
    products: string[];
    needsServerReconciliation: boolean;
    developerNote?: string;
    consumedPurchaseToken?: string;
}

interface StoreBillingPlugin {
    getStatus(): Promise<NativeStoreBillingStatus>;
    getProduct(options: { productId: string; kind: BillingMonetizationKind }): Promise<NativeStoreBillingProduct>;
    purchaseProduct(options: { productId: string; kind: BillingMonetizationKind }): Promise<NativeStoreBillingPurchaseResult>;
    getActivePurchases(): Promise<{ purchases: NativeStoreBillingPurchaseResult[] }>;
}

const StoreBilling = registerPlugin<StoreBillingPlugin>('StoreBilling');

export const canUseNativeStoreBilling = (): boolean =>
    isCapacitorNativeRuntime() && String(Capacitor.getPlatform?.() || '').trim().toLowerCase() === 'android';

const normalizePluginError = (error: unknown): Error => {
    if (error instanceof Error) return error;
    if (typeof error === 'string') return new Error(error);
    if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
        return new Error((error as { message: string }).message);
    }

    return new Error('Native store billing indisponivel.');
};

export const getNativeStoreBillingStatus = async (): Promise<NativeStoreBillingStatus> => {
    if (!canUseNativeStoreBilling()) {
        return {
            platform: 'android',
            available: false,
            connected: false,
            canMakePayments: false,
            reason: 'Native billing indisponivel fora do app.',
            responseCode: -1,
        };
    }

    try {
        return await StoreBilling.getStatus();
    } catch (error) {
        throw normalizePluginError(error);
    }
};

export const getNativeStoreProduct = async (
    productId: string,
    kind: BillingMonetizationKind,
): Promise<NativeStoreBillingProduct> => {
    try {
        return await StoreBilling.getProduct({ productId, kind });
    } catch (error) {
        throw normalizePluginError(error);
    }
};

export const purchaseNativeStoreProduct = async (
    productId: string,
    kind: BillingMonetizationKind,
): Promise<NativeStoreBillingPurchaseResult> => {
    try {
        return await StoreBilling.purchaseProduct({ productId, kind });
    } catch (error) {
        throw normalizePluginError(error);
    }
};

export const getNativeStoreActivePurchases = async (): Promise<NativeStoreBillingPurchaseResult[]> => {
    try {
        const result = await StoreBilling.getActivePurchases();
        return Array.isArray(result?.purchases) ? result.purchases : [];
    } catch (error) {
        throw normalizePluginError(error);
    }
};
