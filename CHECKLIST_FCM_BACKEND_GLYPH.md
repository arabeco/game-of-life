# FCM Backend - GLYPH

Atualizado em: 2026-04-04

Objetivo:
- fechar o push remoto Android de verdade
- usando FCM no backend
- sem quebrar o web push atual

## O que ja ficou pronto no codigo

- o app Android ja registra token nativo
- o backend `web-push` ja salva esse token em `push_subscriptions`
- o backend agora ja sabe enviar:
  - `web push` para subscriptions do navegador
  - `FCM` para tokens nativos Android
- se o backend encontrar credenciais FCM validas, ele responde `fcm_ready`
- se nao encontrar, continua em modo `pending_fcm_server`

Arquivos principais:
- `supabase/functions/web-push/index.ts`
- `utils/pushRuntime.ts`
- `components/OracleSettingsModal.tsx`

## O que voce precisa pegar no Firebase

No Firebase console:
1. abrir `Project settings`
2. abrir `Service accounts`
3. clicar em `Generate new private key`
4. baixar o arquivo JSON da service account

Fonte oficial:
- `Settings > Service Accounts > Generate New Private Key`

## O que eu preciso desse JSON

O backend aceita 2 formatos.

### Opcao 1 - melhor para agora

Salvar o JSON inteiro como secret:

- `FCM_SERVICE_ACCOUNT_JSON`

### Opcao 2 - se quiser separar

- `FCM_PROJECT_ID`
- `FCM_CLIENT_EMAIL`
- `FCM_PRIVATE_KEY`

## Como subir no Supabase

Opcao simples:

```powershell
npx supabase secrets set FCM_SERVICE_ACCOUNT_JSON='COLE_O_JSON_COMPLETO_AQUI'
```

Depois:

```powershell
npx supabase functions deploy web-push
```

## O que esperar depois disso

1. abrir o app Android
2. ligar `Push no aparelho`
3. o backend deve responder `fcm_ready`
4. `remotePushRegistered` passa a ficar verdadeiro
5. notificacoes novas criadas no sistema podem chegar por FCM mesmo com o app fora da tela

## Como testar

Teste mais facil:

1. abrir o painel GM
2. clicar em `Sistema + Push (15s)`
3. colocar o app em segundo plano
4. esperar os 15 segundos

Resultado esperado:
- a notificacao chega como notificacao remota nativa do app
- sem cara de Chrome
- sem depender de abrir o app

## Se falhar

Os erros mais provaveis:
- JSON da service account nao entrou certo no secret
- `FCM_PRIVATE_KEY` ficou sem quebras de linha corretas
- function `web-push` nao foi redeployada
- token nativo foi registrado antes do backend ter credencial e precisa religar o push no aparelho

## Leitura final

Hoje o GLYPH ja passou da fase "so local". O proximo marco e:
- credencial da service account
- deploy da function
- reteste do `Sistema + Push (15s)` em segundo plano
