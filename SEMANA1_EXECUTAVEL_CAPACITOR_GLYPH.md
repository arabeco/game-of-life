# Semana 1 Executavel - Capacitor no GLYPH

Atualizado em: 2026-04-03

Objetivo: sair da conversa abstrata e transformar a Fase 1 em uma sequencia que realmente pode ser executada.

Base:

- [CHECKLIST_SEMANA1_CAPACITOR_ANDROID.md](C:\Users\Afonso\Downloads\GOL1.006\CHECKLIST_SEMANA1_CAPACITOR_ANDROID.md)
- [AUDITORIA_CAPACITOR_GLYPH.md](C:\Users\Afonso\Downloads\GOL1.006\AUDITORIA_CAPACITOR_GLYPH.md)
- [TESTE_ANDROID_SEM_PLAYSTORE_GLYPH.md](C:\Users\Afonso\Downloads\GOL1.006\TESTE_ANDROID_SEM_PLAYSTORE_GLYPH.md)

---

## 1. Resultado esperado no fim da Semana 1

Se tudo correr bem, no fim desta semana voce deve ter:

- Capacitor instalado no projeto
- plataforma Android criada
- shell Android abrindo o GLYPH
- app rodando em emulador ou celular fisico
- lista dos primeiros gaps reais

Nao faz parte da Semana 1:

- billing mobile pronto
- push nativo pronto
- App Store
- TestFlight
- Google Play release

---

## 2. O que precisa existir antes de comecar

## No projeto

- `npm install` funcionando
- build web funcionando

## Na sua maquina

- Android Studio instalado
- Android SDK instalado
- pelo menos um destes:
  - emulador Android
  - celular Android com depuracao USB

## Nao precisa ainda

- pagar Apple
- ter Play Console pronta
- Firebase completo

---

## 3. Divisao de responsabilidade

## Eu faco no repo

- integrar Capacitor
- criar configuracao inicial
- preparar scripts
- blindar partes web/PWA para nao vazarem no app nativo
- mapear os primeiros blockers

## Voce faz fora do repo

- garantir Android Studio
- abrir em emulador ou aparelho
- confirmar erros visuais ou de runtime no Android

---

## 4. Dia 1 - Preparar o projeto

Objetivo:

- deixar o repo pronto para receber Capacitor

O que eu faco:

- revisar `package.json`
- revisar pontos PWA
- criar helper de runtime por plataforma

Status do GLYPH:

- essa parte ja comecou
- agora o projeto ja tem base para detectar runtime nativo

Arquivos ja preparados:

- [runtimePlatform.ts](C:\Users\Afonso\Downloads\GOL1.006\utils\runtimePlatform.ts)
- [index.tsx](C:\Users\Afonso\Downloads\GOL1.006\index.tsx)
- [installPrompt.ts](C:\Users\Afonso\Downloads\GOL1.006\utils\installPrompt.ts)

---

## 5. Dia 2 - Instalar Capacitor

Objetivo:

- adicionar o shell nativo ao projeto

Comandos esperados:

```bash
npm install @capacitor/core @capacitor/cli
```

```bash
npx cap init
```

Decisoes que vao aparecer:

- nome do app: `GLYPH`
- app id sugerido:
  - `life.glyph.app`
  - ou outro package id final que voce preferir

Saida esperada:

- arquivo `capacitor.config.*`
- dependencias do Capacitor no projeto

---

## 6. Dia 3 - Gerar Android

Objetivo:

- criar a plataforma Android local

Comandos esperados:

```bash
npm run build
```

```bash
npx cap add android
```

```bash
npx cap sync android
```

Saida esperada:

- pasta `android/`
- projeto abrivel no Android Studio

---

## 7. Dia 4 - Abrir no Android Studio

Objetivo:

- transformar a build web em app executavel no Android

Comando esperado:

```bash
npx cap open android
```

O que voce faz:

- abrir o projeto no Android Studio
- escolher:
  - emulador
  - ou aparelho real
- rodar a primeira build

Saida esperada:

- o app instala
- splash abre
- home carrega

---

## 8. Dia 5 - Primeira rodada de verificacao

Objetivo:

- descobrir os primeiros gargalos reais

Checklist:

- login abre
- bottom nav funciona
- scroll funciona
- teclado nao quebra a tela
- fonts carregam
- o app nao fecha sozinho

Provaveis achados:

- install prompt precisa sumir no app nativo
- service worker deixa de ser central
- notificacao ainda esta web-first
- links externos vao precisar tratamento
- pagamentos continuam web-first

---

## 9. Primeiros comandos provaveis do fluxo inteiro

```bash
npm install
```

```bash
npm install @capacitor/core @capacitor/cli
```

```bash
npx cap init GLYPH life.glyph.app
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

---

## 10. Gaps que aceitamos encontrar nesta semana

E aceitavel se, no fim da semana, ainda estiver faltando:

- push nativo
- billing mobile
- Sign in with Apple real
- politicas de loja preenchidas
- release signing final

Isso nao e falha.
Isso e esperado.

---

## 11. O que define sucesso

Semana 1 e sucesso se:

- o app web virou app Android local
- abriu no shell
- a navegacao principal foi validada
- existe uma lista pequena e honesta dos blockers

---

## 12. Proximo passo apos a Semana 1

Se a Semana 1 der certo, a Semana 2 vira:

- estabilizacao Android
- links externos
- notificacoes por plataforma
- comeco da estrategia de billing mobile

---

## 13. Leitura honesta final

O passo mais importante agora nao e a loja.
E provar que o GLYPH vive bem dentro do shell Android.

Se isso se confirmar, o resto deixa de ser misterio e vira backlog tecnico real.
