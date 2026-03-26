# Launch Readiness

Fonte automatizada principal: [tests/launch-readiness.mjs](/C:/Users/Afonso/Downloads/GOL1.006/tests/launch-readiness.mjs)

## O que existe agora

- `npm run test:launch`
  - suite `core`
  - valida build + core loop + onboarding + quiz de campanha + fluxo de relatorio + shell da UI

- `npm run test:launch:full`
  - suite `full`
  - soma `core + account + social + legacy`

## Suites

- `core`
  - `core-loop.regression.mjs`
  - `onboarding-happy-path.cdp.mjs`
  - `campaign-quiz-flow-smoke.cdp.mjs`
  - `cycle-report-flow.cdp.mjs`
  - `ui-smoke.cdp.mjs`

- `account`
  - `onboarding-oracle-delete-smoke.cdp.mjs`
  - `notification-lab-smoke.cdp.mjs`

- `social`
  - `clan-create-smoke.cdp.mjs`
  - `mentorship-planner-sync-smoke.cdp.mjs`
  - `mentorship-arenas-visibility-smoke.cdp.mjs`
  - `partnership-mutual-arenas-smoke.cdp.mjs`
  - `competition-race-smoke.cdp.mjs`
  - `season-clan-smoke.cdp.mjs`

- `legacy`
  - `legacy-era-customization.cdp.mjs`
  - `legacy-plaque-flow.cdp.mjs`

## Uso rapido

```bash
npm run test:launch
```

```bash
npm run test:launch:full
```

```bash
node tests/launch-readiness.mjs --suite=social
```

```bash
node tests/launch-readiness.mjs --suite=full --list
```

## O que isso prova

- o app builda
- o shell principal sobe
- onboarding real segue clicavel
- campanhas e quiz seguem integrados
- ciclo e relatorio nao quebraram
- notificacoes/oraculo continuam vivos
- camada social principal ainda responde
- legado/customizacao nao foi quebrado

## O que ainda nao substitui

- `PIX/Ouro` real ponta a ponta
- `GM Panel` com e-mail real
- `Premium` em `2 aparelhos`
- passada final em aparelho real
- QA visual final mobile

## Regra pratica

- antes de qualquer release: `npm run test:launch`
- antes de abrir Beta/LIVE: `npm run test:launch:full` + QA manual dos 4 pontos acima
