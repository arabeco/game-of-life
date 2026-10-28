export type BillingMonetizationKind = 'consumable' | 'subscription';
export type BillingInternalProductId =
    | 'pack_gold_1'
    | 'pack_gold_2'
    | 'pack_gold_3'
    | 'pack_gold_4'
    | 'pack_gold_5'
    | 'premium_30d'
    | 'platinum_30d'
    | 'premium_365d'
    | 'platinum_365d';

export interface BillingCatalogEntry {
    internalId: BillingInternalProductId;
    kind: BillingMonetizationKind;
    displayName: string;
    googlePlayProductId: string;
    /**
     * O plano base dentro da assinatura da Play (28/10/2026). O anual e o mesmo
     * produto (premium_30d / platinum_30d) com o plano base `anual`; o mensal
     * fica sem, e a Play usa o primeiro plano do produto, como sempre foi.
     */
    googlePlayBasePlanId?: string;
    appStoreProductId: string;
}

/** O id do plano base anual no Play Console. Tem de ser criado com este nome. */
export const GOOGLE_PLAY_ANNUAL_BASE_PLAN_ID = 'anual';

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
    {
        internalId: 'premium_365d',
        kind: 'subscription',
        displayName: 'Premium (12 meses)',
        googlePlayProductId: 'premium_30d',
        googlePlayBasePlanId: GOOGLE_PLAY_ANNUAL_BASE_PLAN_ID,
        appStoreProductId: 'life.glyph.app.subscription.premium365d',
    },
    {
        internalId: 'platinum_365d',
        kind: 'subscription',
        displayName: 'Platinum (12 meses)',
        googlePlayProductId: 'platinum_30d',
        googlePlayBasePlanId: GOOGLE_PLAY_ANNUAL_BASE_PLAN_ID,
        appStoreProductId: 'life.glyph.app.subscription.platinum365d',
    },
] as const;

export const getBillingCatalogEntry = (internalId: string) =>
    BILLING_CATALOG.find((entry) => entry.internalId === internalId);
