# Implementation Plan - Purchase Reconciliation Backend

Atualizado em: 2026-04-04

## Objective

Turn mobile purchases into real, trustworthy account changes.

This plan covers the missing server layer for:

- Google Play purchases on Android
- App Store purchases on iOS

and unifies them with the purchase/account model already used by the current web/Pix flow.

---

## Why this layer is required

Current mobile state:

- Android native billing already opens real Google Play purchase flow
- iOS UI is already prepared for StoreKit
- client-side purchase results already contain store-side proof data

What is still missing:

- wallet gold is **not** credited by trusted backend verification
- premium/platinum is **not** activated by trusted backend verification
- renewals / restores / duplicate protection are not complete for mobile stores

Without this layer:

- purchase UX can look successful
- but account state is not production-safe

---

## Existing backend building blocks

### Purchase ledger already exists

The repo already has `user_purchases` and uses it as a ledger / duplicate guard.

Evidence:

- [20240304_create_payment_system.sql](/C:/Users/Afonso/Downloads/GOL1.006/supabase/migrations/20240304_create_payment_system.sql)
- later migrations insert internal gold purchases using `product_type`, `product_id`, `gold_spent`, `expires_at`, `is_active`, `purchased_at`

### Current web/Pix approved flows already exist

Gold:

- [process_approved_payment](/C:/Users/Afonso/Downloads/GOL1.006/supabase/migrations/20240304_create_payment_system.sql)

Membership:

- [process_approved_membership_payment](/C:/Users/Afonso/Downloads/GOL1.006/supabase/migrations/20260402113000_add_direct_membership_pix_checkout.sql)

### User state already has the target fields

The backend already knows how to mutate:

- `user_profiles.wallet.gold`
- `user_profiles.is_premium`
- `user_profiles.premium_expires_at`
- `user_profiles.subscription_tier`
- premium reward / credit payload fields

This is good because mobile reconciliation should **reuse** this account state model, not invent another one.

---

## Current client outputs available for reconciliation

### Android

The native Android plugin already returns enough data to start server-side verification:

- `purchaseToken`
- `orderId`
- `products[]`
- `purchaseState`
- `packageName`
- `acknowledged`
- `consumed`

Source:

- [StoreBillingPlugin.java](/C:/Users/Afonso/Downloads/GOL1.006/android/app/src/main/java/life/glyph/app/billing/StoreBillingPlugin.java)
- [nativeBilling.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/nativeBilling.ts)

### iOS

StoreKit is not implemented yet, but the future server contract should expect:

- `transactionId`
- `originalTransactionId` for subscription lineage / restore
- `productId`
- `purchaseDate`
- store-side signed proof if applicable

---

## Product model to preserve

These are already defined in [billingCatalog.ts](/C:/Users/Afonso/Downloads/GOL1.006/constants/billingCatalog.ts).

### Consumables

- `pack_gold_1`
- `pack_gold_2`
- `pack_gold_3`
- `pack_gold_4`
- `pack_gold_5`

### Subscriptions

- `premium_30d`
- `platinum_30d`

### Rule

Only these money products should hit store verification.

Everything else remains internal economy paid with gold.

---

## Architecture decision

### Principle

The client submits store proof. The backend verifies and applies account mutations.

### Do not do this

- do not credit gold directly from client success
- do not trust a purchase token just because the device returned it
- do not make wallet/premium the responsibility of UI code

### Do this

Use one generic reconciliation entrypoint with provider-specific verification branches.

Proposed providers:

- `google_play`
- `app_store`

---

## Proposed backend flow

## Step 1 - Create a dedicated reconciliation function

Recommended new edge function:

- `supabase/functions/store-reconcile/index.ts`

Purpose:

1. authenticate current user
2. receive store payload
3. verify purchase with provider
4. apply idempotent account mutation
5. persist ledger record
6. return normalized result to app

Suggested request shape:

```json
{
  "provider": "google_play",
  "internalProductId": "pack_gold_3",
  "productId": "pack_gold_3",
  "purchaseToken": "...",
  "orderId": "...",
  "packageName": "life.glyph.app",
  "purchaseState": "purchased"
}
```

Future iOS shape:

```json
{
  "provider": "app_store",
  "internalProductId": "premium_30d",
  "productId": "life.glyph.app.subscription.premium30d",
  "transactionId": "...",
  "originalTransactionId": "...",
  "appAccountToken": "...optional..."
}
```

---

## Step 2 - Add a normalized external purchase record

### Recommended approach

Use `user_purchases` as the core ledger, but extend it for store-native purchases instead of creating a completely separate money ledger.

Suggested additional columns:

- `store_provider text`
- `store_product_id text`
- `internal_product_id text`
- `store_purchase_token text`
- `store_order_id text`
- `store_transaction_id text`
- `store_original_transaction_id text`
- `verification_status text`
- `verified_at timestamptz`
- `last_verified_at timestamptz`
- `purchase_kind text`

Important indexes / uniqueness:

- unique on Google token per provider
- unique on Apple transaction id per provider
- keep idempotency strong

### Why

The table already acts like a purchase ledger.
We should enrich it instead of scattering purchase truth across ad hoc tables.

---

## Step 3 - Provider verification

## Google Play branch

### Required external setup

- Google Play Developer API access
- service account / credentials for server verification
- Play Console app using package `life.glyph.app`

### Verify on backend

For consumables:

- verify purchase token against Google Play Developer API
- confirm product id
- confirm package name
- confirm purchase state

For subscriptions:

- verify token/subscription state
- derive current entitlement window
- renewal / cancel / grace state later

### Normalized backend result needed

```json
{
  "provider": "google_play",
  "verified": true,
  "kind": "consumable",
  "internalProductId": "pack_gold_3",
  "storeProductId": "pack_gold_3",
  "storePurchaseKey": "purchaseTokenHere"
}
```

## Apple branch

### Required external setup

- Apple Developer / App Store Connect
- StoreKit products created
- App Store Server API credentials or equivalent verification path

### Verify on backend

For consumables:

- verify Apple transaction

For subscriptions:

- verify entitlement / expiration / active state
- treat `originalTransactionId` as subscription lineage key

### Normalized backend result needed

```json
{
  "provider": "app_store",
  "verified": true,
  "kind": "subscription",
  "internalProductId": "premium_30d",
  "storeProductId": "life.glyph.app.subscription.premium30d",
  "storePurchaseKey": "appleTransactionIdHere"
}
```

---

## Step 4 - Product mapping

### Central rule

Server must not trust raw store product id alone.

It should map the incoming `internalProductId` + provider product id through [billingCatalog.ts](/C:/Users/Afonso/Downloads/GOL1.006/constants/billingCatalog.ts)-equivalent server constants.

### Recommended server-side catalog mirror

Create a server constant map inside reconciliation function:

- `internalProductId`
- provider product ids
- kind
- gold amount if consumable
- membership tier if subscription

This avoids:

- client spoofing a product id
- provider mismatch
- wrong price pack granting wrong gold

---

## Step 5 - Account mutation rules

## Consumable packs

For `pack_gold_*`:

1. verify provider purchase
2. confirm it has not been processed before
3. increment `wallet.gold`
4. insert/update `user_purchases`
5. record transaction/event if desired

### Suggested grant source of truth

Use a dedicated SQL function, similar spirit to `process_approved_payment`, but for store-native purchases.

Suggested SQL function:

- `process_store_gold_purchase(...)`

Inputs:

- `p_user_id`
- `p_store_provider`
- `p_store_purchase_key`
- `p_internal_product_id`
- `p_store_product_id`
- `p_gold_amount`
- `p_amount_paid`
- `p_metadata`

## Memberships

For `premium_30d` and `platinum_30d`:

1. verify provider purchase / entitlement
2. derive effective membership tier
3. extend entitlement safely from current active expiry
4. set reward payloads / credits
5. persist ledger entry

### Suggested grant source of truth

Reuse the logic pattern already present in:

- [process_approved_membership_payment](/C:/Users/Afonso/Downloads/GOL1.006/supabase/migrations/20260402113000_add_direct_membership_pix_checkout.sql)

Prefer creating a store-generic version rather than duplicating logic twice:

- `process_store_membership_purchase(...)`

Inputs:

- `p_user_id`
- `p_store_provider`
- `p_store_purchase_key`
- `p_internal_product_id`
- `p_store_product_id`
- `p_membership_tier`
- `p_amount_paid`
- `p_metadata`

---

## Step 6 - Idempotency rules

This is non-negotiable.

### Google

Primary idempotency key:

- `google_play + purchaseToken`

### Apple

Primary idempotency key:

- `app_store + transactionId`

### Rule

If the purchase was already processed as approved:

- do not mutate wallet twice
- do not extend premium twice
- return current account result safely

---

## Step 7 - Client integration

## Android client

Current state:

- purchase flow already returns native payload
- UI still says backend reconciliation is pending

Next change after backend exists:

1. successful native purchase
2. call `store-reconcile`
3. refresh user profile
4. show final success UI only after backend response

This should replace the current temporary toast in:

- [BillingCheckoutGate.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/Store/BillingCheckoutGate.tsx)

## iOS client

Do the same after StoreKit exists:

1. StoreKit purchase succeeds
2. call `store-reconcile`
3. refresh user profile
4. show entitlement granted / restored

---

## Step 8 - Restore and renewal

## Android

Use active purchase query + backend verification to rebuild entitlement.

### Need

- a server path to re-check existing subscriptions
- probably a `restore` / `sync-entitlements` endpoint later

## iOS

Restore is mandatory UX.

The button is already present in:

- [BillingCheckoutGate.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/Store/BillingCheckoutGate.tsx)

When StoreKit is connected:

1. restore transactions
2. send latest verified transaction lineage to backend
3. reapply premium state if needed

---

## Proposed implementation order

## Phase A - Android first

1. create reconciliation edge function
2. add Google Play verification
3. add store-aware SQL grant function for gold
4. add store-aware SQL grant function for memberships
5. wire Android client to call reconciliation

## Phase B - Stabilize server model

1. add purchase ledger columns if needed
2. harden idempotency
3. add observability / failure logging

## Phase C - iOS on same architecture

1. implement StoreKit client
2. add Apple verification branch
3. wire restore flow
4. keep same server grant functions

---

## Recommended files to add next

### Edge function

- `supabase/functions/store-reconcile/index.ts`

### Migrations

- `supabase/migrations/<timestamp>_extend_user_purchases_for_store_reconciliation.sql`
- `supabase/migrations/<timestamp>_add_process_store_gold_purchase.sql`
- `supabase/migrations/<timestamp>_add_process_store_membership_purchase.sql`

### Client

- update [BillingCheckoutGate.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/Store/BillingCheckoutGate.tsx)
- add a small service helper, e.g.:
  - `utils/storeReconciliation.ts`

---

## Open design decisions

1. Whether to store raw provider payload snapshots in `metadata`
2. Whether to add a dedicated `store_purchases` table or extend `user_purchases`
3. Whether subscription renewals should generate a new ledger row each cycle or update a lineage record plus append event history

Recommendation:

- extend `user_purchases`
- keep raw provider snapshot in `metadata`
- append a new ledger row per real external purchase event when possible

---

## Success criteria

The backend reconciliation work is done when:

1. Android gold pack purchase increases wallet only after verified backend approval
2. Android premium/platinum extends entitlement only after verified backend approval
3. duplicate processing is impossible
4. iOS can plug into the same server contract later
5. restore / re-check paths can rebuild entitlements without trusting the client alone
