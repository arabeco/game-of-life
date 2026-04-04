# Cronograma operacional de publicacao mobile

Baseado em:

- [PLANO_PUBLICACAO_GOOGLE_APPLE.md](/C:/Users/Afonso/Downloads/GOL1.006/PLANO_PUBLICACAO_GOOGLE_APPLE.md)

## Objetivo

Transformar o Glyph em app publicavel com o menor risco possivel, priorizando:

1. Android primeiro
2. iOS logo depois
3. sem reescrever o produto inteiro
4. sem tentar entrar na loja com pagamentos errados

## Estrategia geral

### Meta realista

Primeiro marco:

- Android em beta fechado pela Google Play

Segundo marco:

- iOS em TestFlight

Terceiro marco:

- submissao oficial nas duas lojas

### O que nao vamos fazer neste ciclo

- reescrever tudo em React Native
- manter PIX para compra de bens digitais dentro do app nativo
- publicar iOS antes de fechar billing e compliance

## Donos

### IA

- shell nativo
- adaptacoes do frontend
- billing abstraction
- integracao backend para entitlements
- push nativo
- ajuste de auth
- fluxo de deletar conta
- fluxo de denunciar e bloquear
- checklists tecnicos

### Voce

- contas Google Play e Apple Developer
- acessos a Firebase e Apple
- cadastro de produtos nas lojas
- precos finais
- textos finais de privacidade e suporte
- screenshots e material visual final
- submissao nas lojas

### Compartilhado

- prioridades
- recortes de produto
- aprovacao dos fluxos comerciais

## Visao de 6 semanas

## Semana 0 - Preflight

Objetivo:
deixar o terreno limpo antes de mexer no app.

### Entregas

- confirmar contas de developer
- confirmar se Android vem antes de iOS
- confirmar naming final do app
- confirmar bundle ids e package ids
- confirmar precos finais de `Gold`, `Premium`, `Platinum`
- congelar a regra comercial mobile

### IA faz

- preparar checklist tecnico inicial
- mapear o que hoje depende de PWA
- mapear o que hoje depende de Mercado Pago

### Voce faz

- criar ou validar:
  - conta Google Play Developer
  - conta Apple Developer
  - projeto Firebase
- decidir nomes finais:
  - app name
  - package Android
  - bundle iOS
- aprovar tabela de precos mobile

### Critero de saida

- contas criadas
- estrategia comercial aprovada
- ids base definidos

## Semana 1 - Shell nativo

Objetivo:
empacotar a base atual como app nativo e descobrir o que quebra.

### Entregas

- integrar Capacitor
- gerar projeto Android
- gerar projeto iOS
- abrir app no emulador Android
- abrir app no simulador iOS ou ao menos deixar projeto pronto
- validar login, navegacao e storage local

### IA faz

- instalar e configurar Capacitor
- criar estrutura `android/` e `ios/`
- ajustar `base url`, deep links e assets basicos
- documentar comandos de sync/build

### Voce faz

- rodar o que depender de ambiente Apple local, se necessario
- fornecer nome final e icones base se ja tiver

### Riscos

- auth web quebrar no shell
- service worker nao fazer sentido no app nativo
- alguma dependencia do navegador puro precisar de fallback

### Critero de saida

- app abre em shell Android
- login entra
- navegacao principal nao quebra

## Semana 2 - Camada nativa minima

Objetivo:
trocar dependencias web mais sensiveis por trilhas nativas.

### Entregas

- plano de substituicao do web push
- decisao tecnica para auth mobile
- mapear permissao de notificacao Android
- preparar Sign in with Apple para iOS

### IA faz

- levantar pontos que usam:
  - service worker
  - PushManager
  - Notification API
  - fluxo OAuth web
- criar camada de notificacao agnostica
- preparar integracao de push nativo
- preparar integracao Sign in with Apple

### Voce faz

- criar chaves/certificados quando eu pedir
- liberar configuracao do Firebase
- liberar configuracao Apple para login e push

### Critero de saida

- desenho de push nativo fechado
- desenho de auth mobile fechado
- backlog de ajustes web-only mapeado

## Semana 3 - Billing mobile

Objetivo:
tirar o maior risco de rejeicao.

### Entregas

- camada de compra por plataforma
- produtos mobile definidos
- Gold como consumivel
- Premium e Platinum como subscription
- backend recebendo receipts Apple/Google
- entitlement refletido em `user_profiles`

### IA faz

- criar billing abstraction
- separar:
  - compra web
  - compra Android
  - compra iOS
- adaptar frontend para abrir compra nativa no mobile
- adaptar backend para validar e aplicar receipts

### Voce faz

- criar produtos no Play Console
- criar produtos no App Store Connect
- me passar IDs finais dos produtos
- aprovar precos finais

### Riscos

- confusao entre Gold web e Gold mobile
- renewal de assinatura mal reconciliado
- edge cases de restore purchases

### Critero de saida

- compra de teste Android funcionando
- Premium/Platinum setando entitlement certo
- Gold entrando certo

## Semana 4 - Compliance de loja

Objetivo:
matar os riscos de review.

### Entregas

- exclusao de conta visivel e funcional no app
- Sign in with Apple
- denunciar e bloquear em chat/grupo/DM
- pagina de privacidade final publicada
- rascunho de Data Safety e App Privacy

### IA faz

- finalizar UX de deletar conta
- implementar denunciar e bloquear
- revisar termos e pontos tecnicos de privacidade
- gerar inventario tecnico de dados

### Voce faz

- aprovar copy juridica
- publicar links finais:
  - privacidade
  - termos
  - suporte
  - delecao de conta, se precisar pagina extra

### Critero de saida

- conta pode ser deletada no app
- UGC tem report/block
- links publicos existem
- formulario tecnico de privacidade pode ser preenchido

## Semana 5 - Push nativo e beta Android

Objetivo:
subir o Android para teste real.

### Entregas

- FCM ativo
- push do Oraculo e notificacoes gerais via app nativo
- build Android assinada
- internal testing ou closed testing no Play Console
- checklist manual de QA mobile

### IA faz

- integrar FCM
- registrar tokens no backend
- adaptar roteamento das notificacoes
- preparar checklist de smoke test Android

### Voce faz

- configurar Firebase final
- subir build no Play Console
- convidar testadores

### Critero de saida

- notificacao chega em Android real
- compra de teste funciona
- login funciona
- Play Console aceita build

## Semana 6 - iOS e TestFlight

Objetivo:
preparar iOS sem entrar cego na review final.

### Entregas

- APNs ativo
- Sign in with Apple validado
- build iOS em TestFlight
- App Privacy preenchida
- review notes prontas

### IA faz

- integrar APNs
- finalizar fluxo iOS
- revisar textos e permissoes

### Voce faz

- certificados Apple
- App Store Connect
- screenshots iOS
- submissao para TestFlight

### Critero de saida

- app abre no iPhone
- login funciona
- push funciona
- compra teste funciona
- TestFlight sobe

## Sequencia detalhada da Fase 1

Se quisermos comecar amanha sem dispersao, a ordem exata e:

1. instalar Capacitor
2. gerar shell Android
3. rodar no Android local
4. listar tudo que hoje depende de PWA
5. isolar a camada de notificacao
6. isolar a camada de billing
7. trocar o caminho de compra mobile

## Checklist de conta externa

### Google

- conta Google Play Developer
- app criado no console
- package name definido
- Play App Signing ativo
- internal testing track pronta
- produtos in-app criados
- subscription groups criados
- Data Safety preenchivel

### Apple

- Apple Developer ativo
- app criado no App Store Connect
- bundle id definido
- Sign in with Apple configurado
- push configurado
- subscriptions criadas
- In-App Purchases criadas
- App Privacy preenchivel

## Checklist tecnico

### Shell e runtime

- app abre sem service worker obrigatorio
- storage local continua consistente
- deeplink funciona
- splash e icone corretos

### Auth

- login Google continua funcionando onde for permitido
- Sign in with Apple existe no iOS
- sessao persiste ao fechar e abrir

### Compra

- Gold entra como consumivel
- Premium renova certo
- Platinum renova certo
- restore purchases existe

### Social

- denunciar usuario
- bloquear usuario
- denunciar mensagem
- esconder conteudo bloqueado

### Conta

- deletar conta visivel
- deletar conta funcional
- logout limpo

### Push

- permissao nativa
- token registrado
- push chega em foreground
- push chega em background
- deep link da notificacao abre tela certa

## Itens que podem ser cortados para acelerar

Se a publicacao estiver pesada demais, eu cortaria temporariamente:

- partes menos essenciais da camada social
- funcoes secundarias de compartilhamento
- algumas superficies experimentais

Nao cortaria:

- billing correto
- auth correta
- deletar conta
- report/block
- push nativo

## Matriz de decisao rapida

### Se faltar tempo

- prioridade 1:
  - Android beta com billing e conta correta
- prioridade 2:
  - push nativo
- prioridade 3:
  - iOS/TestFlight

### Se faltar recurso visual

- usar assets temporarios de loja
- nao bloquear engenharia por screenshot final

### Se faltar operacao de moderacao

- reduzir ou limitar superficie social antes de loja

## O que eu recomendo fazer agora

### Passo 1

Abrir um subplano tecnico de shell nativo.

### Passo 2

Listar tudo que hoje depende de:

- service worker
- web push
- Notification API
- OAuth web
- Mercado Pago para bens digitais

### Passo 3

Comecar Android primeiro.

## Proximo documento sugerido

Se quiser, o proximo arquivo que eu faco e um:

- `CHECKLIST_CAPACITOR_ANDROID.md`

com comandos, arquivos, dependencias e ordem exata para iniciar a Semana 1.
