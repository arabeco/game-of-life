# Checklist de Compliance Atual - Google Play e App Store

Data de corte: 2026-04-03

Objetivo: separar o que o app ja tem hoje do que ainda falta para publicacao mobile em lojas.

## Veredito rapido

- O fluxo de excluir conta dentro do app esta bom e ja conta a favor.
- O maior buraco hoje nao e "deletar conta". Sao:
  - pagamentos digitais no mobile
  - Sign in with Apple real
  - moderacao de UGC (denunciar / bloquear)
  - shell nativo com Capacitor
  - push nativo
  - privacidade/disclosure preenchiveis nas lojas

## Ja temos hoje

### 1. Exclusao de conta iniciada dentro do app

Status: bom

O app ja tem:

- botao visivel em Configuracoes > Geral
- confirmacao forte com digitacao manual de `DELETAR`
- chamada para exclusao real via service
- edge function dedicada de exclusao
- limpeza de sessao local ao final

Arquivos:

- `views/SettingsView.tsx`
- `services/SupabaseService.ts`
- `supabase/functions/account-delete/index.ts`

Leitura de loja:

- Apple: ajuda bastante porque a exclusao ja e iniciada dentro do app.
- Google: a trilha in-app esta boa, mas ainda falta pagina web publica para exclusao/solicitacao quando a loja pedir isso fora do app.

### 2. Termos e privacidade no produto

Status: parcial

O app ja tem:

- links de Termos e Privacidade no login
- modal/resumo legal em configuracoes
- colunas de aceite no perfil

Arquivos:

- `views/LoginView.tsx`
- `views/SettingsView.tsx`
- `constants/legal.ts`
- `supabase/migrations/20260312_add_legal_acceptance_columns.sql`

O que ainda nao posso assumir como fechado:

- politica de privacidade final e publica no dominio
- termos finais e publicos no dominio
- URL publica de exclusao/contato
- canal de suporte e privacidade final

### 3. Login social

Status: parcial

O app ja tem:

- Google login funcionando
- botao Apple preparado visualmente

Arquivos:

- `views/LoginView.tsx`

O que falta:

- conta Apple Developer ativa
- configuracao real de Sign in with Apple
- provider Apple ligado no Supabase
- teste real em iPhone

### 4. Estrutura legal/tecnica de exclusao no backend

Status: bom

Ja existe:

- edge function `account-delete`
- fallback RPC no service
- bloqueio de reentrada
- remocao de arquivos do bucket do usuario

Arquivos:

- `services/SupabaseService.ts`
- `supabase/functions/account-delete/index.ts`
- `supabase/migrations/20260315052000_block_deleted_account_reentry.sql`

## Faltas criticas antes de loja

### 1. Billing nativo para bens digitais

Status: faltando

Hoje o app vende digital por fluxo proprio.

Para loja:

- Android: Google Play Billing
- iOS: In-App Purchase / subscriptions da Apple

Impacta:

- gold
- premium
- platinum
- boosts
- qualquer item digital comprado no app

Sem isso, o risco de reprovacao e alto.

### 2. Moderacao de UGC

Status: faltando

Hoje existem superficies sociais como:

- `components/DirectMessages.tsx`
- `components/ClanChat.tsx`

Mas eu nao encontrei fluxo claro de:

- denunciar usuario
- denunciar mensagem
- bloquear usuario
- silenciar/mute
- politica de moderacao operacional

Esse e um gap importante para Google e Apple.

### 3. Politica de privacidade / support / exclusao web

Status: parcial

Precisamos fechar:

- politica de privacidade publica final
- termos publicos finais
- support URL publica
- pagina ou canal web de exclusao
- e-mail/canal de suporte real
- e-mail/canal de privacidade real

### 4. Data Safety do Play e App Privacy da Apple

Status: faltando

Precisamos mapear formalmente:

- quais dados o app coleta
- quais terceiros/SDKs participam
- se dados sao ligados ao usuario
- se ha compartilhamento
- se ha tracking
- politica de retencao/delecao

Sem esse inventario, voce nao preenche os formularios da loja com seguranca.

### 5. Shell nativo com Capacitor

Status: faltando

Precisamos:

- instalar Capacitor
- gerar projeto Android
- depois gerar projeto iOS
- adaptar diferencas entre web e app nativo

### 6. Push nativo

Status: faltando para app de loja

Hoje existe web push.

Para app nativo serio:

- Android: FCM
- iOS: APNs via plugin/camada nativa

### 7. Publicacao Android tecnica

Status: faltando

Precisamos:

- Android App Bundle (`.aab`)
- Play App Signing
- target API atual da Play
- closed testing configurado

### 8. Publicacao iOS tecnica

Status: faltando

Precisamos:

- Apple Developer ativo
- app criado no App Store Connect
- bundle id final
- Sign in with Apple real
- subscriptions / IAP configurados
- TestFlight

## Qualidade importante para app hibrido

Nao sao o centro do problema, mas precisam entrar no trilho:

- tela offline melhor
- back button Android correto
- links externos abrindo fora da WebView quando fizer sentido
- permissoes nativas pedidas do jeito certo
- revisao de banners/UX que facam sentido no navegador, mas nao no app

## O que esta "bom o bastante" hoje

### Botao de deletar conta

Veredito: sim, para mim esta bom como base de compliance in-app.

Por que:

- esta visivel
- esta no caminho de configuracoes
- nao depende de mandar e-mail
- exige confirmacao forte
- chama exclusao real

O que falta nao e mexer nele. E completar o ecossistema ao redor:

- pagina web de exclusao
- support URL
- textos finais de privacidade

## Quem faz o que

### Codex faz

- integrar Sign in with Apple no codigo quando a conta Apple estiver pronta
- preparar billing por plataforma
- integrar Capacitor
- preparar FCM/APNs no codigo
- mapear Data Safety / App Privacy a partir do codigo
- implementar denunciar / bloquear / silenciar
- revisar UX de links externos, offline e back button

### Voce faz por fora

- pagar/ativar Apple Developer
- criar app no Play Console
- criar app no App Store Connect
- criar produtos e subscriptions nas lojas
- publicar pagina final de privacidade
- publicar pagina final de termos
- publicar pagina/canal de exclusao
- definir suporte real e contato de privacidade

## Ordem recomendada

1. Fechar paginas publicas: privacidade, termos, suporte, exclusao.
2. Fechar moderacao minima: denunciar + bloquear.
3. Preparar inventario de dados para Play/App Privacy.
4. Entrar na Fase 1 tecnica: Capacitor + Android.
5. Depois billing nativo.
6. Depois push nativo.
7. Depois iOS.
