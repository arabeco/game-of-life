export type BillingMonetizationKind = 'consumable' | 'subscription';
export type BillingInternalProductId =
    | 'pack_gold_1'
    | 'pack_gold_2'
    | 'pack_gold_3'
    | 'pack_gold_4'
    | 'pack_gold_5'
    | 'premium_30d'
    | 'platinum_30d';

export interface BillingCatalogEntry {
    internalId: BillingInternalProductId;
    kind: BillingMonetizationKind;
    displayName: string;
    googlePlayProductId: string;
    appStoreProductId: string;
}

export const BILLING_CATALOG: BillingCatalogEntry[] = [
    {
        internalId: 'pack_gold_1',
        kind: 'consumable',
        displayName: 'Pepita',
        googlePlayProductId: 'pack_gold_1',
        appStoreProductId: 'life.glyph.app.gold.pack1',
    },
    {
        internalId: 'pack_gold_2',
        kind: 'consumable',
        displayName: 'Barra Pequena',
        googlePlayProductId: 'pack_gold_2',
        appStoreProductId: 'life.glyph.app.gold.pack2',
    },
    {
        internalId: 'pack_gold_3',
        kind: 'consumable',
        displayName: 'Barra Grande',
        googlePlayProductId: 'pack_gold_3',
        appStoreProductId: 'life.glyph.app.gold.pack3',
    },
    {
        internalId: 'pack_gold_4',
        kind: 'consumable',
        displayName: 'Cofre',
        googlePlayProductId: 'pack_gold_4',
        appStoreProductId: 'life.glyph.app.gold.pack4',
    },
    {
        internalId: 'pack_gold_5',
        kind: 'consumable',
        displayName: 'Tesouro',
        googlePlayProductId: 'pack_gold_5',
        appStoreProductId: 'life.glyph.app.gold.pack5',
    },
    {
        internalId: 'premium_30d',
        kind: 'subscription',
        displayName: 'Premium (30 dias)',
        googlePlayProductId: 'premium_30d',
        appStoreProductId: 'life.glyph.app.subscription.premium30d',
    },
    {
        internalId: 'platinum_30d',
        kind: 'subscription',
        displayName: 'Platinum (30 dias)',
        googlePlayProductId: 'platinum_30d',
        appStoreProductId: 'life.glyph.app.subscription.platinum30d',
    },
] as const;

export const getBillingCatalogEntry = (internalId: string) =>
    BILLING_CATALOG.find((entry) => entry.internalId === internalId);
