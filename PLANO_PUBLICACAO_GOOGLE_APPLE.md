# Plano de Publicacao Google Play e App Store

## Resumo executivo

O app ja tem produto suficiente para virar aplicativo de loja, mas ainda nao esta estruturado como binario pronto para Google Play e App Store.

Os 4 maiores bloqueios hoje sao:

1. cobranca de bens digitais e assinaturas fora da loja
2. login Google sem camada iOS pronta para Sign in with Apple
3. camada social sem trilha clara de denunciar e bloquear
4. push e empacotamento ainda baseados em PWA, nao em stack nativa

O caminho mais inteligente nao parece ser reescrever tudo em React Native agora.
O caminho mais racional e:

1. manter a base React atual
2. empacotar com shell nativo
3. migrar pagamentos mobile para billing nativo
4. completar compliance Apple e Google

Veredito honesto:
sim, e dificil.
Mas e totalmente viavel se a gente fizer em fases e nao tentar subir tudo de uma vez.

## Estado atual do projeto

### O que ja ajuda

- app real e grande, nao e so landing page
- onboarding, gameplay, relatorios, legado, social e loja ja existem
- backend robusto com Supabase functions
- produto com loops claros
- base React/Vite organizada o bastante para shell nativo

### O que existe hoje no codigo

- PWA/web app:
  - [package.json](/C:/Users/Afonso/Downloads/GOL1.006/package.json)
  - [manifest.webmanifest](/C:/Users/Afonso/Downloads/GOL1.006/public/manifest.webmanifest)
  - [sw.js](/C:/Users/Afonso/Downloads/GOL1.006/public/sw.js)
- web push:
  - [webPush.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/webPush.ts)
  - [localNotification.ts](/C:/Users/Afonso/Downloads/GOL1.006/utils/localNotification.ts)
- login Google:
  - [App.tsx](/C:/Users/Afonso/Downloads/GOL1.006/App.tsx)
  - [LoginView.tsx](/C:/Users/Afonso/Downloads/GOL1.006/views/LoginView.tsx)
- pagamento PIX/Mercado Pago para ouro e assinatura:
  - [goldCatalog.ts](/C:/Users/Afonso/Downloads/GOL1.006/constants/goldCatalog.ts)
  - [mercadopago/index.ts](/C:/Users/Afonso/Downloads/GOL1.006/supabase/functions/mercadopago/index.ts)
- exclusao de conta em backend:
  - [SupabaseService.ts](/C:/Users/Afonso/Downloads/GOL1.006/services/SupabaseService.ts)
  - [account-delete/index.ts](/C:/Users/Afonso/Downloads/GOL1.006/supabase/functions/account-delete/index.ts)
- camada social:
  - [ClanChat.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/ClanChat.tsx)
  - [DirectMessages.tsx](/C:/Users/Afonso/Downloads/GOL1.006/components/DirectMessages.tsx)

## Decisao arquitetural recomendada

### Caminho recomendado

Usar Capacitor para gerar app Android e iOS em cima da base atual.

### Por que esse caminho faz mais sentido

- preserva a base React atual
- evita reescrever a UI inteira
- permite usar push nativo
- permite usar billing nativo
- reduz tempo para beta fechado mobile

### Caminhos que eu nao recomendaria agora

- reescrever tudo em React Native
- tentar publicar a PWA como se fosse app nativo sem adaptar pagamentos, push e login
- manter PIX/Mercado Pago dentro do app nativo para bens digitais

## Bloqueios de loja por area

### 1. Pagamentos e monetizacao

Hoje o app vende:

- ouro
- Premium
- Platinum
- boosts
- itens digitais e mecanicas digitais indiretamente via ouro

No mobile de loja, a trilha correta precisa ser:

- Google Play Billing no Android
- Apple In-App Purchase no iOS

#### Impacto no produto

- `Gold` vira produto consumivel
- `Premium` vira assinatura
- `Platinum` vira assinatura
- PIX/Mercado Pago pode continuar no web
- mobile de loja nao deve usar checkout externo para moeda digital e assinatura digital

#### Dono

- IA:
  - modelar camada abstrata de billing
  - adaptar backend para receipts Apple/Google
  - ligar entitlements no perfil
  - trocar CTAs mobile
- Voce:
  - criar contas de developer
  - cadastrar produtos na Apple e Google
  - definir preco final por pais
  - aprovar politica comercial
- Compartilhado:
  - decidir mapping final entre `gold`, `premium`, `platinum` e produtos da loja

### 2. Login e identidade

Hoje o app usa Google login.
No iOS, isso provavelmente pede Sign in with Apple tambem.

#### Dono

- IA:
  - implementar Sign in with Apple na camada de auth
  - ajustar fluxo de conta para identidade unica no backend
- Voce:
  - configurar chaves e contas Apple
  - preencher dados de provider e ambiente

### 3. Exclusao de conta

A infra ja existe, mas a UX precisa ficar inegavelmente pronta para auditoria de loja.

#### O que precisa existir

- entrada visivel em Configuracoes
- confirmacao forte
- delecao iniciada no app
- texto claro do que e apagado
- link web de exclusao para Play Console

#### Dono

- IA:
  - revisar e finalizar fluxo in-app
  - endurecer erros e feedback visual
  - deixar funcional em device real
- Voce:
  - fornecer texto final juridico se quiser linguagem propria
  - preencher URL publica de suporte/delecao se necessario

### 4. Social e UGC

Hoje existe grupo, DM e outras superficies sociais.
Isso tende a exigir:

- denunciar usuario
- denunciar conteudo
- bloquear usuario
- moderacao e resposta
- canal de suporte

#### Dono

- IA:
  - implementar botoes e backend basico de report/block
  - esconder ou limitar funcoes sociais se ainda nao estiver pronto
- Voce:
  - definir politica de moderacao
  - operar inbox ou painel de analise dos reports

### 5. Push e notificacoes

Hoje a base e web push.
Para app de loja, o ideal e:

- APNs no iOS
- FCM no Android

#### Dono

- IA:
  - adaptar camada de notificacao para push nativo
  - unificar tokens e preferencias
  - manter regras do Oraculo e das outras notificacoes
- Voce:
  - gerar certificados/chaves
  - ativar servicos no Firebase e Apple

### 6. Privacidade e disclosure

Vai precisar de:

- politica de privacidade publica final
- respostas de Data Safety no Google
- App Privacy no App Store Connect
- lista de dados coletados, compartilhados e finalidade

#### Dono

- IA:
  - montar inventario tecnico do que o app coleta
  - mapear dados por feature
  - gerar rascunho tecnico para formularios
- Voce:
  - validar com visao juridica e de negocio
  - publicar URLs finais

### 7. Release nativa

Vai precisar de:

- projeto Android
- projeto iOS
- assinatura de app
- icones, splash, nome, bundle id
- review notes
- screenshots por tamanho
- conta demo para review se necessario

#### Dono

- IA:
  - preparar shell nativo, configuracoes e checklist
  - ajudar com builds e ajustes
- Voce:
  - contas de developer
  - certificados
  - imagens finais de loja
  - submissao e respostas para review

## Plano por fases

## Fase 0 - Decisao e congelamento comercial

Objetivo:
decidir o que vai para mobile de loja e o que continua web.

### Entregas

- definir que mobile usa billing nativo
- definir que web pode continuar com PIX/Mercado Pago
- definir tabela de precos mobile
- decidir se Android beta vem antes de iOS

### Quem faz

- Voce:
  - aprovar modelo comercial
  - aprovar precos
- IA:
  - propor grade de produtos
  - ajustar copy e mapeamento tecnico

### Status

- prioridade critica
- baixa complexidade tecnica
- alta importancia estrategica

## Fase 1 - Shell nativo

Objetivo:
transformar o web app atual em app Android/iOS empacotado.

### Entregas

- integrar Capacitor
- gerar projeto Android
- gerar projeto iOS
- preparar ambiente, icones e splash
- garantir navegacao, auth e armazenamento funcionando no shell

### Quem faz

- IA:
  - integrar Capacitor
  - adaptar configuracoes do projeto
  - documentar comandos e estrutura
  - ajustar o que quebrar no shell
- Voce:
  - abrir contas Apple/Google se ainda nao abriu
  - rodar partes que exigirem ambiente local nativo especifico, se necessario

### Observacao

Essa fase sozinha nao garante aprovacao de loja.
Ela so coloca o app dentro do formato certo.

## Fase 2 - Billing nativo

Objetivo:
trocar a trilha de compra mobile por Apple/Google billing.

### Entregas

- produto consumivel para ouro
- assinaturas para Premium e Platinum
- camada de verificacao de recibo
- entrega de entitlement no Supabase
- separacao entre compra web e compra mobile

### Quem faz

- IA:
  - refatorar camada de compra
  - criar adaptador por plataforma
  - ajustar backend para reconciliar receipts
  - remover caminhos proibidos no mobile
- Voce:
  - cadastrar produtos nos consoles
  - informar IDs finais dos produtos
  - validar precos

### Risco

Esse e o maior bloqueio de aprovacao.
Sem isso, a chance de rejeicao e alta.

## Fase 3 - Compliance Apple/Google

Objetivo:
fechar os requisitos que costumam reprovar app.

### Entregas

- Sign in with Apple
- exclusao de conta visivel no app
- denunciar e bloquear em social
- privacy policy final
- Data Safety e App Privacy prontos
- permissao de notificacao correta

### Quem faz

- IA:
  - implementar fluxos
  - mapear dados
  - gerar checklist tecnico
- Voce:
  - validar textos
  - publicar paginas web
  - preencher consoles

## Fase 4 - Push nativo

Objetivo:
substituir dependencia de web push por push de app real.

### Entregas

- FCM Android
- APNs iOS
- registro de device token
- roteamento correto de notificacoes
- preferencias e quiet hours unificadas

### Quem faz

- IA:
  - integrar plugins e backend
  - migrar logica de subscription
- Voce:
  - fornecer chaves de push

## Fase 5 - Beta fechado Android

Objetivo:
soltar a primeira versao realmente instalavel via loja.

### Entregas

- bundle Android
- listing inicial
- screenshots
- conta de teste
- testadores fechados

### Quem faz

- IA:
  - checklist tecnico
  - correcoes finais
- Voce:
  - Play Console
  - submissao
  - convite de testers

## Fase 6 - TestFlight e App Store

Objetivo:
entrar no ecossistema Apple com menos surpresa.

### Entregas

- TestFlight
- ajustes de review
- metadata iOS
- build final para App Store

### Quem faz

- IA:
  - resolver bugs e exigencias de review
  - ajustar fluxo iOS
- Voce:
  - App Store Connect
  - certificados e perfis
  - resposta ao time de review

## Matriz de responsabilidade

### A IA consegue fazer

- integrar shell nativo
- adaptar o frontend para mobile app real
- implementar billing abstraction
- conectar receipts com entitlements
- preparar push nativo
- revisar conta/delecao
- implementar report/block
- gerar checklists de submissao
- revisar copy e UX de compra mobile

### Voce precisa fazer

- abrir e manter contas Apple/Google
- aprovar modelo de monetizacao
- definir preco e estrategia comercial
- criar produtos nas lojas
- fornecer chaves, certificados e acessos
- publicar politica de privacidade e paginas finais
- subir screenshots e metadata
- enviar builds e responder reviews

### Compartilhado

- decidir o que entra no mobile agora
- decidir o que fica web primeiro
- priorizar Android antes de iOS ou nao
- aprovar cortes de produto para reduzir risco

## Ordem mais inteligente para nao enlouquecer

Se eu estivesse conduzindo isso com foco de entrega, faria assim:

1. Android primeiro
2. Capacitor
3. billing nativo
4. exclusao de conta e social compliance
5. push nativo
6. beta fechado Android
7. depois iOS

Motivo:

- Android costuma aceitar iteração mais rapida
- iOS e mais sensivel em review, login e billing
- com Android rodando, o produto aprende antes de encarar App Store

## Riscos que podem explodir se ignorarmos

### risco 1

Submeter com PIX/Mercado Pago para ouro ou assinatura dentro do app nativo.

### risco 2

Submeter iOS com Google login sem Sign in with Apple.

### risco 3

Submeter com chat/grupo/DM sem denunciar e bloquear.

### risco 4

Submeter sem exclusao de conta facil e clara.

### risco 5

Submeter app que ainda parece PWA empacotada, sem adaptacoes nativas reais.

## Definicao pratica de sucesso

Considero que o projeto fica pronto para beta de loja quando tivermos:

- Android empacotado e instalando
- login funcionando no shell nativo
- push nativo funcionando
- billing nativo para ouro e assinatura
- exclusao de conta visivel
- denunciar e bloquear no social
- privacy/data safety mapeados
- listing inicial pronta

## Minha recomendacao final

Nao tratar isso como "vamos publicar o site na loja".
Tratar como:

"vamos transformar o produto atual em app nativo distribuivel, preservando a base React e substituindo so o que a loja exige."

Essa abordagem tem a melhor relacao entre:

- velocidade
- risco
- custo de engenharia
- chance real de aprovacao

## Proximo passo recomendado

O proximo passo mais inteligente e abrir a Fase 1 com este escopo:

1. integrar Capacitor
2. gerar shell Android
3. mapear o que quebra no ambiente nativo
4. desenhar a camada de billing mobile

Se voce quiser, o proximo documento que eu faco e:

- um plano operacional de execucao em ordem cronologica
- com checklist por semana
- e com marcacao exata de `IA faz`, `voce faz`, `depende de conta externa`

## Fontes oficiais usadas para orientar este plano

- Apple App Store Review Guidelines:
  [developer.apple.com/app-store/review/guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Apple account deletion:
  [developer.apple.com/support/offering-account-deletion-in-your-app](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- Apple App Privacy:
  [developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
- Google account deletion:
  [support.google.com/googleplay/android-developer/answer/13327111](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- Google Play Billing:
  [support.google.com/googleplay/android-developer/answer/1153481](https://support.google.com/googleplay/android-developer/answer/1153481?hl=en)
- Google target API requirements:
  [developer.android.com/google/play/requirements/target-sdk](https://developer.android.com/google/play/requirements/target-sdk?hl=en)
- Google Play App Signing:
  [support.google.com/googleplay/android-developer/answer/9842756](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en)
- Google Play UGC policy:
  [support.google.com/googleplay/android-developer/answer/9876937](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en)
