# Billing Mobile GLYPH

Atualizado em: 2026-04-04

## O que vende dinheiro real

Estes produtos saem do dinheiro real e entram na trilha da loja mobile:

- `pack_gold_1` -> consumable
- `pack_gold_2` -> consumable
- `pack_gold_3` -> consumable
- `pack_gold_4` -> consumable
- `pack_gold_5` -> consumable
- `premium_30d` -> subscription
- `platinum_30d` -> subscription

## O que NAO vai para Google Play / App Store como produto separado

Estes continuam como economia interna do jogo, pagos com `ouro` ja adquirido:

- boosts
- codexes
- cosmetics/itens da loja de ouro
- custos sociais
- cenas de legado
- custos de campanha

Ou seja:

- loja mobile vende `ouro`
- loja mobile vende `premium/platinum`
- o resto continua como gasto interno do saldo do usuario

## SKU planejado

### Google Play

- `pack_gold_1`
- `pack_gold_2`
- `pack_gold_3`
- `pack_gold_4`
- `pack_gold_5`
- `premium_30d`
- `platinum_30d`

### App Store

- `life.glyph.app.gold.pack1`
- `life.glyph.app.gold.pack2`
- `life.glyph.app.gold.pack3`
- `life.glyph.app.gold.pack4`
- `life.glyph.app.gold.pack5`
- `life.glyph.app.subscription.premium30d`
- `life.glyph.app.subscription.platinum30d`

## Estado atual do codigo

- web continua usando `Mercado Pago`
- app nativo agora passa por um `BillingCheckoutGate`
- nesse gate, o build nativo mostra a trilha de loja e so oferece fallback web de forma explicita
- o checkout ja recebe `internalProductId` para preparar a troca do gateway
- o catalogo central fica em [billingCatalog.ts](/C:/Users/Afonso/Downloads/GOL1.006/constants/billingCatalog.ts)
- o runtime de cobranca fica em [billingRuntime.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/billingRuntime.ts)
- a porta de checkout por plataforma fica em [BillingCheckoutGate.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/Store/BillingCheckoutGate.tsx)
- o plugin nativo do Android fica em [StoreBillingPlugin.java](/C:/Users/Afonso/Downloads/GOL1.006/android/app/src/main/java/life/glyph/app/billing/StoreBillingPlugin.java)
- a ponte JS do Android fica em [nativeBilling.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/nativeBilling.ts)
- no Android, o gate ja consulta o produto da Google Play e tenta abrir a compra nativa
- no iOS, a UI do gate ja esta pronta com compra e restauracao desenhadas, faltando apenas plugar o StoreKit no projeto Apple

## Proxima fase

1. confirmar entrega/restore no backend
2. conciliar ouro e premium a partir do token da compra
3. repetir a trilha no iOS
4. validar renovacao, cancelamento e reembolso

## Nota importante

Antes de publicar o app nas lojas:

- Android nao pode continuar fechando compra digital via `Mercado Pago web`
- iOS nao pode continuar fechando compra digital via checkout web

O fluxo web atual ainda pode continuar existindo para o PWA/site.
