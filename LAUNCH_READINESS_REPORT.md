# Launch Readiness Report

- Generated at: 2026-08-28T18:57:59.207Z
- Suite: `core`
- Smoke URL: `http://127.0.0.1:3011/`
- Build: PASS (10.1s)

## Checks

### FAIL - Challenge reward flow regression
- Kind: `logic`
- Simulates: limita desafios visiveis
- Simulates: confere progresso de arenas
- Simulates: garante insignias acumulaveis
- Error: Challenge reward flow regression failed with exit 1

### PLANNED - Oracle cycle coach regression
- Kind: `logic`
- Simulates: le ritmo do ciclo localmente
- Simulates: prioriza arena em risco
- Simulates: oferece apenas navegacao segura

### PLANNED - Reward modal priority regression
- Kind: `logic`
- Simulates: nao mostra passagem antiga a conta nova
- Simulates: evita sobreposicao entre dicas, temporada e recompensas

### PLANNED - Daily widget execution regression
- Kind: `logic`
- Simulates: remove planejamento diario do widget
- Simulates: mostra acoes feitas, XP e arenas tocadas

### PLANNED - Daily reading regression
- Kind: `logic`
- Simulates: fala sobre o dia corrente, nao so sobre dias fechados
- Simulates: a assinatura muda a regua e nao o elogio
- Simulates: dia abaixo da media nao soa como falha

### PLANNED - Cycle comparison regression
- Kind: `logic`
- Simulates: o ciclo nao entra na propria referencia
- Simulates: dias sem entrega conta invertido
- Simulates: mediana aguenta ciclo extremo

### PLANNED - Subscription XP bonus regression
- Kind: `logic`
- Simulates: platinum rende mais que premium
- Simulates: assinatura vencida nao paga bonus
- Simulates: vitrine sai do mesmo numero do calculo

### PLANNED - Arena pacts regression
- Kind: `logic`
- Simulates: nao propoe arena arquivada, travada, vazia ou concluida
- Simulates: constancia conta dias e nao acoes
- Simulates: entrega anterior ao aceite nao conta

### PLANNED - XP scale regression
- Kind: `logic`
- Simulates: missoes, jornadas e pactos usam a mesma escala
- Simulates: nenhuma recompensa passa de 500 XP

### PLANNED - Mission reward unification regression
- Kind: `logic`
- Simulates: os resgates passam pelo mesmo ritual
- Simulates: subida de patente entra em todos
- Simulates: missao de item paga XP por reward_exp

### PLANNED - Oracle presence policy regression
- Kind: `logic`
- Simulates: presenca decide o que ele fala
- Simulates: aviso decide onde chega
- Simulates: push nao volta a exigir presenca 3

### PLANNED - Safe area and late data regression
- Kind: `logic`
- Simulates: o cabecalho desce a barra de status
- Simulates: a tela de descanso respeita as duas barras
- Simulates: preferencia que ainda nao chegou nao vira botao morto

### PLANNED - Relationship link as timed product regression
- Kind: `logic`
- Simulates: o preco exibido e o preco cobrado
- Simulates: renovar custa menos que criar
- Simulates: vencer congela em vez de apagar

### PLANNED - Planner simple list regression
- Kind: `logic`
- Simulates: preserva horarios
- Simulates: salva a ordem no banco
- Simulates: mantem conclusoes fora da baia

### PLANNED - Core loop regression
- Kind: `logic`
- Simulates: recalcula o core loop
- Simulates: valida progresso de campanha/arena
- Simulates: confere score, atlas e mutacoes utilitarias

### PLANNED - Onboarding happy path
- Kind: `browser`
- Simulates: entra com conta temporaria
- Simulates: atravessa onboarding
- Simulates: cria arena/acao inicial
- Simulates: chega no fluxo principal sem travar

### PLANNED - Campaign quiz flow
- Kind: `browser`
- Simulates: abre loja de campanhas
- Simulates: roda quiz gratis
- Simulates: reabre quiz completo
- Simulates: instala campanha e confirma menu

### PLANNED - Cycle report flow
- Kind: `browser`
- Simulates: cria ciclo real
- Simulates: conclui tarefas
- Simulates: fecha ciclo
- Simulates: abre relatorio e reward flow

### PLANNED - UI shell smoke
- Kind: `browser`
- Simulates: abre shell principal
- Simulates: navega views centrais
- Simulates: garante que a casca da app sobe sem overlay travando

## Manual QA Still Required

- PIX/Ouro real ponta a ponta
- GM Panel com e-mail real
- Premium remoto em 2 aparelhos
- Passada final em aparelho real

