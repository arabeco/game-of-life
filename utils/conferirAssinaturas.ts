import type { NativeStoreBillingPurchaseResult } from './nativeBilling';

/**
 * A RENOVACAO AUTOMATICA (28/10/2026).
 *
 * A Play renova a assinatura sozinha, mas ninguem avisava o Glyph: o plano
 * vencia no dia 31 com o mes seguinte pago. Agora, ao abrir no Android, o app
 * pega as compras ativas da Play e manda as assinaturas para o servidor
 * conferir (google-play-purchase). Cobranca nova estende o plano pela data da
 * Google; cobranca ja entregue so volta "ja processado".
 */
const PLANOS_DA_PLAY: Record<string, 'premium' | 'platinum'> = {
    premium_30d: 'premium',
    platinum_30d: 'platinum',
};

export type AssinaturaParaConferir = {
    productId: string;
    tier: 'premium' | 'platinum';
    purchaseToken: string;
    orderId: string;
    packageName: string;
    products: string[];
};

/** So as assinaturas do Glyph, ja compradas (pendente ainda nao foi paga). */
export const assinaturasParaConferir = (compras: NativeStoreBillingPurchaseResult[]): AssinaturaParaConferir[] =>
    compras.flatMap((compra) => {
        if (compra.purchaseState !== 'purchased' || !compra.purchaseToken) return [];
        const productId = (compra.products || []).find((id) => PLANOS_DA_PLAY[id]);
        if (!productId) return [];
        return [{
            productId,
            tier: PLANOS_DA_PLAY[productId],
            purchaseToken: compra.purchaseToken,
            orderId: compra.orderId,
            packageName: compra.packageName,
            products: compra.products || [],
        }];
    });

const SEIS_HORAS = 6 * 60 * 60 * 1000;

/** Confere no maximo a cada 6 horas: renovacao e mensal, nao precisa de mais. */
export const hojeConfere = (ultimaConferencia: number | null, agora: number = Date.now()): boolean =>
    !ultimaConferencia || !Number.isFinite(ultimaConferencia) || agora - ultimaConferencia >= SEIS_HORAS;
