# Implementation Plan - iOS / Apple Track for GLYPH

Atualizado em: 2026-04-04

## Objective

Ship a real iOS track for `life.glyph.app` without rewriting the product:

1. Generate the Capacitor iOS platform
2. Open and sign in Xcode
3. Implement native StoreKit billing
4. Reuse the existing login/billing UI already prepared in the repo
5. Add iOS push using the current native push architecture
6. Produce a TestFlight-ready build

---

## Current repo state

### Already prepared

- Capacitor app id: [capacitor.config.ts](/C:/Users/Afonso/Downloads/GOL1.006/capacitor.config.ts)
  - `appId = life.glyph.app`
  - `appName = GLYPH`
- Billing catalog already split by platform: [billingCatalog.ts](/C:/Users/Afonso/Downloads/GOL1.006/constants/billingCatalog.ts)
- Shared billing gate already exists: [BillingCheckoutGate.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/Store/BillingCheckoutGate.tsx)
- Billing runtime already distinguishes `web` / `android` / `ios`: [billingRuntime.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/billingRuntime.ts)
- Android native billing bridge already exists as the reference implementation:
  - [StoreBillingPlugin.java](/C:/Users/Afonso/Downloads/GOL1.006/android/app/src/main/java/life/glyph/app/billing/StoreBillingPlugin.java)
  - [nativeBilling.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/nativeBilling.ts)
- Apple login button is already wired for future activation:
  - [LoginView.tsx](/C:/Users/Afonso/Downloads/GOL1.006/views/LoginView.tsx)
  - [appleAuth.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/appleAuth.ts)
- Native auth callback path already exists and can be reused:
  - [nativeAuth.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/nativeAuth.ts)
  - [App.tsx](/C:/Users/Afonso/Downloads/GOL1.006/App.tsx)
- Native push registration path already exists and is now platform-aware:
  - [pushRuntime.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/pushRuntime.ts)
  - [OracleSettingsModal.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/OracleSettingsModal.tsx)
- Backend native push subscription storage already accepts generic platform labels:
  - [web-push/index.ts](/C:/Users/Afonso/Downloads/GOL1.006/supabase/functions/web-push/index.ts)

### Not implemented yet

- Capacitor iOS platform folder
- Xcode signing/provisioning
- Native iOS billing plugin (StoreKit)
- Backend purchase reconciliation for Apple transactions
- Real Sign in with Apple provider configuration
- iOS push delivery

---

## Product IDs already decided

These must be used in App Store Connect exactly as declared in [billingCatalog.ts](/C:/Users/Afonso/Downloads/GOL1.006/constants/billingCatalog.ts):

### Consumables

- `life.glyph.app.gold.pack1`
- `life.glyph.app.gold.pack2`
- `life.glyph.app.gold.pack3`
- `life.glyph.app.gold.pack4`
- `life.glyph.app.gold.pack5`

### Auto-renewable subscriptions

- `life.glyph.app.subscription.premium30d`
- `life.glyph.app.subscription.platinum30d`

---

## Recommended architecture decision

### Billing

Use `StoreKit 2` on iOS and map it into the same JS surface used by Android.

### Push

Do **not** build a separate direct APNs server path in phase 1.

Use the current backend path and keep Firebase in the loop on iOS too:

1. iOS app receives APNs token on-device
2. Firebase Messaging bridges that into an FCM token
3. Existing backend continues to send via FCM
4. Apple/APNs stays underneath the device-side pipeline

Reason:

- [web-push/index.ts](/C:/Users/Afonso/Downloads/GOL1.006/supabase/functions/web-push/index.ts) already sends native push through FCM
- this avoids building a second remote push server implementation immediately
- Firebase is already part of the Android native push path

---

## Required external inputs

### Apple

- Apple Developer Program membership
- App Store Connect access
- real Apple ID with 2FA
- a Mac with Xcode installed
- ideally a real iPhone for device testing

### Firebase

- existing Firebase project used by Android
- add iOS app to the same project
- download `GoogleService-Info.plist`
- APNs auth key upload inside Firebase console

### Supabase

- access to Auth provider settings
- access to secrets / functions deploy flow if needed

---

## Execution phases

## Phase 0 - Apple account and console setup

### 0.1 Enroll and unlock tooling

- Enroll in Apple Developer Program
- Log into App Store Connect
- Create app entry for bundle id `life.glyph.app`

### 0.2 Enable required Apple capabilities

For the App ID / bundle:

- `In-App Purchase`
- `Sign in with Apple`
- `Push Notifications`

### 0.3 Create App Store products

In App Store Connect:

- create 5 consumables for gold packs
- create 2 auto-renewable subscriptions for `premium_30d` and `platinum_30d`

Do not invent new product ids. Use the ids already in [billingCatalog.ts](/C:/Users/Afonso/Downloads/GOL1.006/constants/billingCatalog.ts).

---

## Phase 1 - Create and bootstrap the iOS platform

Run on the Mac, from repo root:

```bash
npm install
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

Expected result:

- new `ios/` folder
- Xcode workspace opens
- Capacitor shell loads the current GLYPH web build

### Xcode baseline tasks

- choose your Apple team
- confirm bundle id is `life.glyph.app`
- verify deployment target
- verify signing works on a real device

---

## Phase 2 - Native iOS billing plugin

### Goal

Replace the current iOS placeholder in [BillingCheckoutGate.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/Store/BillingCheckoutGate.tsx) with real StoreKit calls.

### Native files to add on iOS

Target structure:

- `ios/App/App/StoreBillingPlugin.swift`
- optional helper types for StoreKit mapping

### JS surface to keep

Do not redesign the product API. Match the Android shape in [nativeBilling.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/nativeBilling.ts):

- `getStatus`
- `getProduct`
- `purchaseProduct`
- `getActivePurchases`

Add:

- `restorePurchases`

### StoreKit 2 responsibilities

- query product metadata using product ids from [billingCatalog.ts](/C:/Users/Afonso/Downloads/GOL1.006/constants/billingCatalog.ts)
- launch purchase
- return transaction state to JS
- restore entitlements for subscriptions
- finalize transaction handling correctly

### UI already waiting for this

The shared gate already contains:

- `Comprar pela App Store`
- `Restaurar compras Apple`
- iOS-specific store messaging

Files already ready:

- [BillingCheckoutGate.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/Store/BillingCheckoutGate.tsx)
- [billingRuntime.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/billingRuntime.ts)

### Follow-up JS change required

Current [nativeBilling.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/nativeBilling.ts) still effectively assumes Android for native store usage.

Required update when iOS plugin exists:

- allow `canUseNativeStoreBilling()` on iOS too
- call the shared Capacitor plugin on both mobile platforms
- expose `restoreNativeStorePurchases()`

---

## Phase 3 - Apple purchase reconciliation on backend

### Goal

Do not grant gold/premium purely from the client.

Build a backend reconciliation path that:

1. receives StoreKit transaction proof / transaction id
2. verifies it server-side
3. grants:
   - gold for consumables
   - premium/platinum entitlement for subscriptions

### Existing Android gap

This is already the next missing layer on Android too.

So the ideal move is:

- build one generic purchase reconciliation model
- add provider-specific verification for:
  - Google Play
  - Apple App Store

### Deliverable

Expected final server behavior:

- client purchase success does not directly modify wallet/premium
- backend becomes source of truth

---

## Phase 4 - Sign in with Apple

### Goal

Turn the already visible Apple button into a real provider flow.

### Current repo state

- button already exists in [LoginView.tsx](/C:/Users/Afonso/Downloads/GOL1.006/views/LoginView.tsx)
- helper already exists in [appleAuth.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/appleAuth.ts)
- native auth callback shape already exists in [nativeAuth.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/nativeAuth.ts)
- app-level callback listener already exists in [App.tsx](/C:/Users/Afonso/Downloads/GOL1.006/App.tsx)

### Preferred implementation

Use Supabase Auth with Apple provider, not a bespoke auth silo.

Tasks:

1. configure Apple provider in Supabase Auth
2. set redirect URL for native callback:
   - `life.glyph.app://auth/callback`
3. replace `VITE_APPLE_SIGN_IN_URL` placeholder path with real provider launch path
4. keep Apple and Google returning through the same native callback scheme if possible

### Important Apple review rule

If iOS app offers Google login as a primary account method, it should also offer Sign in with Apple.

---

## Phase 5 - iOS push

### Recommended implementation path

Keep the current backend FCM sender and make iOS emit a usable FCM token by wiring Firebase on iOS.

### Why this path

[web-push/index.ts](/C:/Users/Afonso/Downloads/GOL1.006/supabase/functions/web-push/index.ts) already:

- stores generic native subscriptions
- sends remote native push via FCM

This means phase 1 iOS push should be:

1. add iOS app in Firebase
2. download `GoogleService-Info.plist`
3. add Firebase Messaging to the iOS project
4. configure APNs key in Firebase console
5. let the device obtain an FCM token
6. register that token through existing `register_native`

### Native iOS work

In Xcode:

- add `Push Notifications` capability
- add `Background Modes`
  - remote notifications
- wire APNs + Firebase Messaging

### JS/runtime work

[pushRuntime.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/pushRuntime.ts) is now platform-aware and can carry `ios`.

Needed next steps:

- confirm iOS token registration path returns a usable token
- update any remaining copy/status text if delivery labels stay FCM-specific

### UI already prepared

[OracleSettingsModal.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/OracleSettingsModal.tsx) now already explains:

- browser push
- Android push
- iPhone push

without redesigning the settings screen later

---

## Phase 6 - Testing matrix

### Device testing

Required:

- real iPhone
- at least one signed install from Xcode

### Billing testing

Validate:

- consumable purchase
- subscription purchase
- restore purchases
- cancellation / expiration behavior
- duplicate prevention

### Auth testing

Validate:

- Sign in with Apple
- Google login still works
- native callback returns to app correctly

### Push testing

Validate:

- permission prompt
- token registration
- app background notification delivery
- app closed notification delivery

### Distribution testing

Validate:

- App Store Connect build upload
- TestFlight internal install

---

## Borrowed Mac workflow

This is the intended usage pattern if the Mac is not yours:

1. use your own Apple ID
2. clone/open this repo
3. run the iOS bootstrap commands
4. open Xcode
5. sign/build/archive/upload
6. sign out of your Apple account afterward

The Mac is only a build tool in this plan.

Identity enrollment and account ownership should stay with your own Apple account.

---

## Deliverables expected at the end

### Phase A deliverable

- iOS Capacitor shell opens on device

### Phase B deliverable

- App Store billing is real
- restore works
- Apple login works

### Phase C deliverable

- push works on iPhone
- TestFlight build is installable

---

## Known blockers

1. No Mac / Xcode means no real iOS implementation
2. No Apple Developer Program means no App Store Connect / TestFlight / distribution
3. No StoreKit backend verification means purchases are not production-safe
4. No Firebase iOS setup means the current native push backend path cannot be reused efficiently

---

## Immediate next action when a Mac is available

Run:

```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

Then start Phase 1 in Xcode.
