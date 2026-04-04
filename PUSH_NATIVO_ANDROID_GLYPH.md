# Push Nativo Android - GLYPH

Atualizado em: 2026-04-04

Objetivo: registrar o estado real do push no GLYPH depois da primeira prova com Capacitor/Android.

---

## 1. Veredito curto

Hoje o GLYPH ainda esta em modo:

- `web push`
- `Notification API`
- `service worker`

Isso funciona para:

- web
- PWA

Mas nao e a trilha certa para o app Android nativo.

Para Android nativo, o caminho certo sera:

- `FCM`
- token do aparelho
- backend do GLYPH/Supabase disparando o push

---

## 2. O que existe hoje

### Frontend web

Arquivos principais:

- `utils/webPush.ts`
- `utils/localNotification.ts`
- `index.tsx`
- `components/OracleSettingsModal.tsx`
- `contexts/GameContext.tsx`

O desenho atual:

- registra `service worker`
- cria subscription de browser
- sincroniza com a edge function `web-push`
- usa `Notification` e `registration.showNotification`

### Backend

Arquivo principal:

- `supabase/functions/web-push/index.ts`

Hoje ele:

- recebe registro de subscriptions web
- salva em `push_subscriptions`
- dispara notificacoes web

---

## 3. O que o Android ja tem de preparacao

No projeto Android:

- `android/app/build.gradle`
- `android/build.gradle`

Ja existe:

- plugin `com.google.gms.google-services` no build root
- tentativa condicional de aplicar `google-services` se existir `google-services.json`

Isso e bom sinal.

Traduzindo:

- o GLYPH ainda nao tem push nativo pronto
- mas o Android shell ja ficou preparado para receber Firebase depois

---

## 4. O que ainda NAO existe

Ainda nao existe no repo:

- `@capacitor/push-notifications`
- fluxo JS de registro de token nativo
- persistencia de token FCM
- edge function/rota para enviar push nativo Android
- distincao clara entre:
  - subscription web
  - token nativo Android

---

## 5. O que vai mudar

### Web continua

No web:

- continua `service worker`
- continua `web push`
- continua `Notification API`

### Android nativo ganha trilha propria

No Android:

- pedir permissao nativa
- registrar no `PushNotifications`
- receber token FCM
- mandar token para o backend
- backend dispara via FCM

---

## 6. Arquitetura alvo

### No aparelho

App Android:

1. pede permissao
2. registra push nativo
3. recebe token FCM
4. envia token para backend

### No backend

Backend GLYPH:

1. salva token Android
2. decide quando notificar
3. dispara push via FCM

### Importante

Nao estamos trocando Supabase por Firebase.

O certo e:

- `Supabase = cerebro`
- `FCM = entregador Android`

---

## 7. Ordem inteligente

1. instalar plugin nativo de push
2. criar wrapper de notificacao por plataforma
3. registrar token Android
4. salvar token no backend
5. enviar push de teste
6. depois pensar em APNs no iOS

---

## 8. O que eu recomendo como proximo passo

### Etapa tecnica imediata

Adicionar:

- `@capacitor/push-notifications`

E criar uma camada tipo:

- `utils/pushRuntime.ts`

Responsabilidades:

- detectar `web` vs `android native`
- no web usar o que ja existe
- no Android usar `PushNotifications`

### Etapa operacional fora do repo

Voce vai precisar:

- criar projeto no Firebase
- cadastrar app Android `life.glyph.app`
- baixar `google-services.json`
- colocar em `android/app/google-services.json`

---

## 9. Conclusao honesta

O GLYPH ja provou o shell Android no celular.

Agora o push entra na fase real, mas ainda nao esta implementado no nativo.

O estado atual e:

- web: ok
- Android nativo: preparado parcialmente
- FCM: ainda falta integrar

Isso nao bloqueia o aprendizado do app.
Mas bloqueia a trilha de push mobile serio para publicacao.
