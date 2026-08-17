# Launch Readiness Report

- Generated at: 2026-08-17T21:41:18.439Z
- Suite: `full`
- Smoke URL: `http://127.0.0.1:3011/`
- Build: PASS (10.7s)

## Checks

### PASS - Challenge reward flow regression (0.1s)
- Kind: `logic`
- Simulates: limita desafios visiveis
- Simulates: confere progresso de arenas
- Simulates: garante insignias acumulaveis

### PASS - Oracle cycle coach regression (0.1s)
- Kind: `logic`
- Simulates: le ritmo do ciclo localmente
- Simulates: prioriza arena em risco
- Simulates: oferece apenas navegacao segura

### PASS - Reward modal priority regression (0.1s)
- Kind: `logic`
- Simulates: nao mostra passagem antiga a conta nova
- Simulates: evita sobreposicao entre dicas, temporada e recompensas

### PASS - Daily widget execution regression (0.1s)
- Kind: `logic`
- Simulates: remove planejamento diario do widget
- Simulates: mostra acoes feitas, XP e arenas tocadas

### PASS - Planner simple list regression (0.1s)
- Kind: `logic`
- Simulates: preserva horarios
- Simulates: salva a ordem no banco
- Simulates: mantem conclusoes fora da baia

### PASS - Core loop regression (0.1s)
- Kind: `logic`
- Simulates: recalcula o core loop
- Simulates: valida progresso de campanha/arena
- Simulates: confere score, atlas e mutacoes utilitarias

### PASS - Onboarding happy path (19.3s)
- Kind: `browser`
- Simulates: entra com conta temporaria
- Simulates: atravessa onboarding
- Simulates: cria arena/acao inicial
- Simulates: chega no fluxo principal sem travar

### PASS - Campaign quiz flow (16.6s)
- Kind: `browser`
- Simulates: abre loja de campanhas
- Simulates: roda quiz gratis
- Simulates: reabre quiz completo
- Simulates: instala campanha e confirma menu

### PASS - Cycle report flow (17.5s)
- Kind: `browser`
- Simulates: cria ciclo real
- Simulates: conclui tarefas
- Simulates: fecha ciclo
- Simulates: abre relatorio e reward flow

### FAIL - UI shell smoke
- Kind: `browser`
- Simulates: abre shell principal
- Simulates: navega views centrais
- Simulates: garante que a casca da app sobe sem overlay travando
- Error: UI shell smoke failed with exit 1

### PLANNED - Onboarding + oracle + delete
- Kind: `browser`
- Simulates: valida onboarding
- Simulates: abre oracle
- Simulates: exercita fluxo de delete/account cleanup

### PLANNED - Notification lab
- Kind: `browser`
- Simulates: abre laboratorio de notificacoes
- Simulates: injeta notificacoes de teste
- Simulates: confere renderizacao e estados basicos

### PLANNED - Clan creation
- Kind: `browser`
- Simulates: abre criacao de grupo
- Simulates: confirma debito/fluxo
- Simulates: garante que o grupo nasce na UI

### PLANNED - Mentorship planner sync
- Kind: `browser`
- Simulates: cria mentoria 2 contas
- Simulates: cria arena vinculada
- Simulates: sincroniza planner entre os lados

### PLANNED - Mentorship arenas visibility
- Kind: `browser`
- Simulates: abre mentoria existente
- Simulates: confere arenas compartilhadas
- Simulates: valida leitura correta no board

### PLANNED - Partnership mutual arenas
- Kind: `browser`
- Simulates: cria parceria 2 contas
- Simulates: espelha arenas dos dois lados
- Simulates: confirma visibilidade mutua

### PLANNED - Competition race
- Kind: `browser`
- Simulates: abre competicao
- Simulates: executa corrida entre contas
- Simulates: confere vencedor, bau e reflexo final

### PLANNED - Season clan smoke
- Kind: `browser`
- Simulates: abre temporada
- Simulates: entra em superficie de missao/quest
- Simulates: verifica integracao base com grupo

### PLANNED - Legacy era customization
- Kind: `browser`
- Simulates: abre customizacao do legado
- Simulates: troca configuracoes principais
- Simulates: confirma persistencia visual

### PLANNED - Legacy plaque flow
- Kind: `browser`
- Simulates: gera placa final
- Simulates: abre cena de legado
- Simulates: confere fluxo de conclusao visual

## Manual QA Still Required

- PIX/Ouro real ponta a ponta
- GM Panel com e-mail real
- Premium remoto em 2 aparelhos
- Passada final em aparelho real

