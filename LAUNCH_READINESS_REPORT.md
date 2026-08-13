# Launch Readiness Report

- Generated at: 2026-08-13T08:45:08.863Z
- Suite: `core`
- Smoke URL: `http://127.0.0.1:3011/`
- Build: PASS (16.1s)

## Checks

### PASS - Core loop regression (0.1s)
- Kind: `logic`
- Simulates: recalcula o core loop
- Simulates: valida progresso de campanha/arena
- Simulates: confere score, atlas e mutacoes utilitarias

### PASS - Onboarding happy path (22.9s)
- Kind: `browser`
- Simulates: entra com conta temporaria
- Simulates: atravessa onboarding
- Simulates: cria arena/acao inicial
- Simulates: chega no fluxo principal sem travar

### PASS - Campaign quiz flow (15.5s)
- Kind: `browser`
- Simulates: abre loja de campanhas
- Simulates: roda quiz gratis
- Simulates: reabre quiz completo
- Simulates: instala campanha e confirma menu

### PASS - Cycle report flow (17.0s)
- Kind: `browser`
- Simulates: cria ciclo real
- Simulates: conclui tarefas
- Simulates: fecha ciclo
- Simulates: abre relatorio e reward flow

### PASS - UI shell smoke (9.4s)
- Kind: `browser`
- Simulates: abre shell principal
- Simulates: navega views centrais
- Simulates: garante que a casca da app sobe sem overlay travando

## Manual QA Still Required

- PIX/Ouro real ponta a ponta
- GM Panel com e-mail real
- Premium remoto em 2 aparelhos
- Passada final em aparelho real

