# Checklist Semana 1 - Capacitor e Android

Baseado em:

- [PLANO_PUBLICACAO_GOOGLE_APPLE.md](/C:/Users/Afonso/Downloads/GOL1.006/PLANO_PUBLICACAO_GOOGLE_APPLE.md)
- [CRONOGRAMA_PUBLICACAO_MOBILE.md](/C:/Users/Afonso/Downloads/GOL1.006/CRONOGRAMA_PUBLICACAO_MOBILE.md)

## Objetivo da semana

Sair de:

- app web/PWA

Para:

- app rodando dentro de um shell Android real

Sem ainda fechar billing, push nativo e loja.

Essa semana serve para:

1. empacotar
2. abrir no Android
3. descobrir o que quebra
4. preparar a fase de integracao nativa

## Resultado esperado no fim da semana

- Capacitor instalado
- projeto Android gerado
- app abrindo no Android
- navegacao principal funcionando
- login abrindo
- lista clara do que ainda depende de web/PWA

## O que o Codex consegue fazer aqui dentro

### O Codex pode fazer

- instalar e configurar o Capacitor no projeto
- criar e editar:
  - `capacitor.config.*`
  - scripts no `package.json`
  - ajustes de build e base path
- gerar a estrutura inicial Android
- adaptar o app para rodar melhor sem depender de service worker
- mapear tudo que hoje usa:
  - `manifest.webmanifest`
  - `serviceWorker`
  - `PushManager`
  - `Notification API`
  - OAuth web puro
- corrigir erros de runtime do shell
- preparar documento de gaps da migracao
- preparar a base para billing nativo depois

### O Codex tambem pode

- revisar o fluxo de auth atual
- propor a estrategia de deep link
- ajustar textos, rotas, permissao e comportamento para mobile
- te entregar os comandos exatos para rodar localmente

### O que o Codex nao consegue fazer sozinho

- criar conta Google Play Developer
- pagar taxa da conta de developer
- aceitar contratos do Google/Apple
- instalar Android Studio por voce
- clicar e configurar coisas dentro dos consoles da Google e Apple
- gerar certificados ligados a sua conta sem os acessos
- publicar o app na loja sem sua conta

## O que voce precisa fazer por fora

### Essencial

- ter Android Studio instalado
- ter SDK Android instalado
- ter pelo menos um emulador Android ou aparelho real com depuracao USB

### Muito desejavel

- conta Google Play Developer pronta
- nome final do app aprovado
- package id aprovado

### Depois, mas nao precisa nesta semana

- Play Console com produto cadastrado
- billing products criados
- Firebase final

## Sequencia operacional

## Etapa 1 - Preparacao

### Codex faz

- revisar a base atual do app
- preparar integracao do Capacitor
- ajustar scripts

### Voce faz

- confirmar que tem:
  - Node funcionando
  - Android Studio instalado
  - SDK Android funcional

### Saida esperada

- ambiente local pronto para gerar shell

## Etapa 2 - Integrar Capacitor

### Codex faz

- adicionar dependencias do Capacitor
- criar configuracao inicial
- preparar diretoria `android`
- alinhar build do Vite com o shell

### Voce faz

- rodar os comandos que pedirem ambiente Android local, se eu te orientar a fazer

### Saida esperada

- projeto Android gerado

## Etapa 3 - Rodar no Android

### Codex faz

- preparar app para abrir no shell
- corrigir erros obvios de runtime
- identificar dependencias do navegador que precisam de fallback

### Voce faz

- abrir no emulador ou aparelho real
- me mandar prints ou erros se algum comportamento for diferente

### Saida esperada

- app abre na home principal

## Etapa 4 - Auditoria de dependencias web

### Codex faz

- listar tudo que hoje depende de web/PWA
- classificar em:
  - bloqueia Android
  - nao bloqueia agora
  - precisa virar nativo depois

### Voce faz

- aprovar as prioridades do que resolver primeiro

### Saida esperada

- backlog tecnico claro da migracao

## Gaps que eu ja espero encontrar

Provavelmente vao aparecer aqui:

- push ainda baseado em service worker
- notificacao ainda baseada em API web
- login Google ainda com fluxo web-first
- possivel dependencia do manifest/PWA install
- compras ainda apontando para Mercado Pago

Isso nao significa fracasso da semana.
Significa que a semana cumpriu o papel dela:

- abrir no Android
- medir o que falta

## Checklist tecnico da Semana 1

### Shell

- [ ] Capacitor instalado
- [ ] config criado
- [ ] `android/` gerado
- [ ] build web integrado ao shell

### App abre

- [ ] splash abre
- [ ] home abre
- [ ] navegacao principal abre
- [ ] nao fecha sozinho

### Auth

- [ ] tela de login abre
- [ ] sessao local nao quebra o app
- [ ] Google login ao menos foi mapeado, mesmo se ainda nao estiver final

### Persistencia

- [ ] local storage continua funcionando
- [ ] preferencias basicas continuam persistindo

### UI

- [ ] layout principal abre no Android
- [ ] fontes e temas principais nao quebram
- [ ] bottom nav continua clicavel

## Comandos que provavelmente vamos usar

Observacao:
eu posso preparar esses comandos e parte deles eu consigo rodar aqui.
Os que dependerem do Android local do seu ambiente, eu te digo exatamente quando usar.

Exemplos de trilha esperada:

```bash
npm install
```

```bash
npm install @capacitor/core @capacitor/cli
```

```bash
npx cap init
```

```bash
npm run build
```

```bash
npx cap add android
```

```bash
npx cap sync android
```

```bash
npx cap open android
```

## Riscos reais da Semana 1

### risco 1

O app abrir, mas alguma parte da auth quebrar por fluxo web.

### risco 2

O app abrir, mas notificacoes ainda nao fazerem sentido no shell.

### risco 3

O app abrir, mas o login Google precisar de uma rodada propria.

### risco 4

O app abrir, mas compras ainda estarem no caminho web atual.

Tudo isso e aceitavel nesta semana.

## Definicao de sucesso

Semana 1 e sucesso se:

- o app abre no Android
- a nave base funciona
- a gente sabe exatamente o que falta para:
  - auth
  - push
  - billing

## Decisao pratica

Se no fim da semana o app abrir bem no Android, seguimos para:

- Semana 2: camada nativa minima

Se no fim da semana o shell estiver muito instavel, fazemos uma semana intermediaria so de estabilizacao.

## Minha leitura honesta

O mais importante agora nao e "publicar logo".
E provar isto:

"o produto atual cabe num app Android real sem precisar ser refeito do zero."

Se isso se confirmar, o resto vira engenharia de integracao e compliance, nao uma reconstrucao total.

## O que eu recomendo fazer agora

Proximo passo operacional:

1. eu preparo a integracao inicial do Capacitor no projeto
2. eu ajusto o que for necessario no codigo
3. depois te passo os comandos exatos para abrir no Android

Se voce quiser, eu posso ir direto para esse passo agora.
