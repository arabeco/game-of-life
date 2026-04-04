# Auditoria Capacitor do GLYPH

Atualizado em: 2026-04-03

Objetivo: mapear o que do GLYPH atual pode entrar quase direto em um shell Android com Capacitor, o que precisa adaptação e o que precisa mudar de arquitetura antes de loja.

---

## 1. Resposta curta

O GLYPH esta bem claramente estruturado como:

- app web
- PWA
- Supabase como backend

Isso e bom.

Porque significa que:

- a base de produto existe
- a maior parte da UI pode continuar
- o shell Android com Capacitor e viavel

Mas hoje o projeto ainda depende bastante de trilhas de navegador puro:

- service worker
- Web Push
- Notification API do browser
- `beforeinstallprompt`
- checkout digital via Mercado Pago web
- pequenos comportamentos de PWA

Entao a leitura honesta e:

- **nao e so empacotar**
- mas **tambem nao e reescrever tudo**

---

## 2. O que o projeto mostra hoje

Base observada:

- Vite + React em [package.json](C:\Users\Afonso\Downloads\GOL1.006\package.json)
- manifest PWA em [manifest.webmanifest](C:\Users\Afonso\Downloads\GOL1.006\public\manifest.webmanifest)
- service worker custom em [sw.js](C:\Users\Afonso\Downloads\GOL1.006\public\sw.js)
- registro do service worker em [index.tsx](C:\Users\Afonso\Downloads\GOL1.006\index.tsx)
- install prompt PWA em [installPrompt.ts](C:\Users\Afonso\Downloads\GOL1.006\utils\installPrompt.ts)
- Web Push em [webPush.ts](C:\Users\Afonso\Downloads\GOL1.006\utils\webPush.ts)
- notificacao local web em [localNotification.ts](C:\Users\Afonso\Downloads\GOL1.006\utils\localNotification.ts)
- checkout digital web em [MercadoPagoBrick.tsx](C:\Users\Afonso\Downloads\GOL1.006\components\Store\MercadoPagoBrick.tsx)
- webhook/processamento Mercado Pago em [mercadopago/index.ts](C:\Users\Afonso\Downloads\GOL1.006\supabase\functions\mercadopago\index.ts)
- login Google no frontend em [LoginView.tsx](C:\Users\Afonso\Downloads\GOL1.006\views\LoginView.tsx)

---

## 3. O que pode ir quase direto para Capacitor

## 3.1 Base React e Vite

Boa noticia:

- a UI React nao precisa ser reescrita so porque vai entrar no Android

Em principio, estas partes seguem:

- telas
- navegação interna do app
- renderização dos componentes
- chamadas ao Supabase
- lógica de estado do GameContext
- banco, storage e auth do Supabase

Resumo:

- o core do produto continua aproveitavel

---

## 3.2 Supabase continua

Nada indica que voce precise trocar o backend.

O papel do Supabase continua:

- auth
- banco
- storage
- edge functions

Em Capacitor, o que muda nao e o backend.
O que muda e a camada de dispositivo:

- push
- links externos
- permissões
- billing mobile

---

## 4. O que precisa adaptacao

## 4.1 Service worker e PWA shell

Hoje o projeto registra service worker automaticamente em:

- [index.tsx](C:\Users\Afonso\Downloads\GOL1.006\index.tsx)

E usa:

- cache offline
- push via service worker
- click de notificacao
- offline fallback

Arquivos:

- [sw.js](C:\Users\Afonso\Downloads\GOL1.006\public\sw.js)
- [manifest.webmanifest](C:\Users\Afonso\Downloads\GOL1.006\public\manifest.webmanifest)

No Android com Capacitor:

- o app pode continuar carregando a build web
- mas o service worker deixa de ser a espinha dorsal da experiencia mobile

Leitura pratica:

- o PWA pode continuar existindo para web
- mas o app Android precisa de uma trilha propria para:
  - push
  - install
  - comportamento offline

---

## 4.2 Install prompt

Hoje o login usa:

- `beforeinstallprompt`
- `appinstalled`

Arquivo:

- [installPrompt.ts](C:\Users\Afonso\Downloads\GOL1.006\utils\installPrompt.ts)

Isso faz sentido na web/PWA.
Dentro de um app Capacitor, nao faz sentido continuar mostrando convite de instalacao.

Conclusao:

- no app Android nativo, essa UI deve ser desligada
- no web, ela pode continuar

---

## 4.3 Notificacoes locais baseadas no browser

Hoje o projeto usa:

- `Notification.requestPermission()`
- `new Notification(...)`
- `registration.showNotification(...)`

Arquivo:

- [localNotification.ts](C:\Users\Afonso\Downloads\GOL1.006\utils\localNotification.ts)

Isso funciona bem na web.
No app Android nativo/hibrido, o ideal e passar a usar trilha nativa.

Conclusao:

- essa camada precisa de abstracao
- web continua com `Notification API`
- Android nativo passa a usar plugin nativo

---

## 4.4 Haptics / vibrate

Hoje o app usa `navigator.vibrate` em pontos de UX.

Exemplos:

- [useSensoryFeedback.ts](C:\Users\Afonso\Downloads\GOL1.006\hooks\useSensoryFeedback.ts)
- [ClanDetailModal.tsx](C:\Users\Afonso\Downloads\GOL1.006\components\ClanDetailModal.tsx)
- [SitrepContent.tsx](C:\Users\Afonso\Downloads\GOL1.006\components\SitrepContent.tsx)

No app Android isso pode continuar de forma limitada ou migrar para plugin de haptics.

Conclusao:

- nao e bloqueador
- mas vale criar uma camada unica de feedback sensorial por plataforma

---

## 4.5 Links externos

O GLYPH tem varios pontos que vao abrir links externos e fluxos web.

Em app nativo, abrir tudo no mesmo contexto web pode ficar ruim.

Direcao recomendada:

- links externos devem usar browser nativo controlado
- nao depender so de `window.location` ou comportamento default

Resumo:

- precisa revisar os pontos de saida do app
- especialmente pagamentos, redes sociais, suporte e links legais

---

## 5. O que precisa mudar de arquitetura

## 5.1 Push

Hoje a arquitetura de push principal do app e:

- Web Push
- `PushManager`
- service worker
- edge function `web-push`

Arquivos:

- [webPush.ts](C:\Users\Afonso\Downloads\GOL1.006\utils\webPush.ts)
- [sw.js](C:\Users\Afonso\Downloads\GOL1.006\public\sw.js)
- [web-push/index.ts](C:\Users\Afonso\Downloads\GOL1.006\supabase\functions\web-push\index.ts)

Para Android nativo/hibrido, a trilha madura passa a ser:

- FCM no aparelho
- token do dispositivo salvo no backend
- backend do GLYPH decidindo quando notificar

Resumo:

- backend continua seu
- entregador do push no Android muda

---

## 5.2 Pagamentos digitais

Esse e o maior ponto estrutural.

Hoje o GLYPH vende digital por Mercado Pago web:

- ouro
- premium
- platinum

Arquivos centrais:

- [MercadoPagoBrick.tsx](C:\Users\Afonso\Downloads\GOL1.006\components\Store\MercadoPagoBrick.tsx)
- [goldCatalog.ts](C:\Users\Afonso\Downloads\GOL1.006\constants\goldCatalog.ts)
- [mercadopago/index.ts](C:\Users\Afonso\Downloads\GOL1.006\supabase\functions\mercadopago\index.ts)

Isso pode continuar na web.

Mas para app de loja mobile:

- Android: Google Play Billing
- iPhone: In-App Purchase / assinaturas da Apple

Conclusao:

- essa parte nao e adaptacao visual
- e mudanca de modelo de cobranca por plataforma

---

## 5.3 Sign in with Apple real

Hoje o botao visual ja existe no login, mas ainda nao autentica de verdade.

Arquivo:

- [LoginView.tsx](C:\Users\Afonso\Downloads\GOL1.006\views\LoginView.tsx)

Para iOS publicar com tranquilidade, o ideal e:

- provider Apple real
- configuracao Apple Developer
- configuracao no Supabase Auth

---

## 6. Classificacao do projeto hoje

## Verde - pronto para reaproveitar

- frontend React/Vite
- Supabase auth, banco e storage
- navegação principal
- lógica de dominio
- maior parte da UI

## Amarelo - precisa camada por plataforma

- notificacoes locais
- push
- vibrate/haptics
- links externos
- install prompt
- offline/PWA behavior

## Vermelho - precisa estrategia nova

- pagamentos digitais no app mobile
- distribuicao iOS
- billing por plataforma

---

## 7. O que eu faria primeiro

## Passo 1

Adicionar Capacitor ao projeto e gerar shell Android local.

Objetivo:

- ver o GLYPH abrindo em um app Android real

## Passo 2

Criar uma camada de ambiente:

- web
- android nativo
- ios nativo

E usar essa camada para desligar:

- install prompt
- partes PWA irrelevantes dentro do app

## Passo 3

Mapear notificacoes:

- web continua como hoje
- android nativo vai para FCM depois

## Passo 4

Separar billing:

- web usa Mercado Pago
- mobile usa billing da loja

---

## 8. O que nao precisa virar paranoia agora

Voce nao precisa resolver de uma vez:

- iOS
- widget
- App Store review
- billing da Apple

Primeiro o corte certo e:

- shell Android
- abrir no aparelho
- validar navegacao

---

## 9. O que isso significa na pratica

Leitura honesta final:

- o GLYPH **esta pronto para entrar na fase Capacitor**
- mas **nao esta pronto para loja mobile sem adaptacoes**

Isso nao e fracasso.
Isso e exatamente o estado esperado de um app web forte que vai virar app publicavel.

---

## 10. Proximo passo recomendado

Criar a trilha tecnica da Semana 1:

- instalar Capacitor
- gerar plataforma Android
- abrir no Android Studio
- testar no aparelho
- registrar o que quebra no shell

Esse e o passo mais inteligente agora porque:

- nao depende de pagar Apple
- nao depende de subir na loja
- e transforma o problema abstrato em problema tecnico concreto
