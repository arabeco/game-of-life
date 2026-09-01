# Launch Readiness Report

- Generated at: 2026-09-01T21:36:36.927Z
- Suite: `core`
- Smoke URL: `http://127.0.0.1:3011/`
- Build: PASS (14.2s)

## Checks

### PASS - Challenge reward flow regression (0.1s)
- Kind: `logic`
- Simulates: limita desafios visiveis
- Simulates: confere progresso de arenas
- Simulates: garante insignias acumulaveis

### PASS - Oracle cycle coach regression (0.2s)
- Kind: `logic`
- Simulates: le ritmo do ciclo localmente
- Simulates: prioriza arena em risco
- Simulates: oferece apenas navegacao segura

### PASS - Reward modal priority regression (0.2s)
- Kind: `logic`
- Simulates: nao mostra passagem antiga a conta nova
- Simulates: evita sobreposicao entre dicas, temporada e recompensas

### PASS - Daily widget execution regression (0.1s)
- Kind: `logic`
- Simulates: remove planejamento diario do widget
- Simulates: mostra acoes feitas, XP e arenas tocadas

### PASS - Daily reading regression (0.2s)
- Kind: `logic`
- Simulates: fala sobre o dia corrente, nao so sobre dias fechados
- Simulates: a assinatura muda a regua e nao o elogio
- Simulates: dia abaixo da media nao soa como falha

### PASS - Cycle comparison regression (0.2s)
- Kind: `logic`
- Simulates: o ciclo nao entra na propria referencia
- Simulates: dias sem entrega conta invertido
- Simulates: mediana aguenta ciclo extremo

### PASS - Subscription XP bonus regression (0.2s)
- Kind: `logic`
- Simulates: platinum rende mais que premium
- Simulates: assinatura vencida nao paga bonus
- Simulates: vitrine sai do mesmo numero do calculo

### PASS - Arena pacts regression (0.2s)
- Kind: `logic`
- Simulates: nao propoe arena arquivada, travada, vazia ou concluida
- Simulates: constancia conta dias e nao acoes
- Simulates: entrega anterior ao aceite nao conta

### PASS - XP scale regression (0.2s)
- Kind: `logic`
- Simulates: missoes, jornadas e pactos usam a mesma escala
- Simulates: nenhuma recompensa passa de 500 XP

### PASS - Mission reward unification regression (0.1s)
- Kind: `logic`
- Simulates: os resgates passam pelo mesmo ritual
- Simulates: subida de patente entra em todos
- Simulates: missao de item paga XP por reward_exp

### PASS - Exp ledger regression (0.1s)
- Kind: `logic`
- Simulates: o dia deposita e o fecho paga
- Simulates: abrir ciclo fecha a rodada
- Simulates: o fecho do ciclo nao recalcula a base ja paga

### PASS - Oracle reaction regression (0.2s)
- Kind: `logic`
- Simulates: a reacao nao repete a frase anterior
- Simulates: a primeira acao depois de uma pausa tem fala propria
- Simulates: a dica de tela olha o que existe na tela

### PASS - Sensory grammar regression (0.2s)
- Kind: `logic`
- Simulates: tres pesos e nada colidindo
- Simulates: fechar ciclo nao vibra como fechar painel
- Simulates: o marco de sequencia tem pulso proprio

### PASS - Oracle arbiter regression (0.2s)
- Kind: `logic`
- Simulates: as seis arenas competem em vez de morrer no ranking
- Simulates: a presenca e o corte de relevancia
- Simulates: sem candidato ele fica quieto

### PASS - Oracle presence policy regression (0.2s)
- Kind: `logic`
- Simulates: presenca decide o que ele fala
- Simulates: aviso decide onde chega
- Simulates: push nao volta a exigir presenca 3

### PASS - Safe area and late data regression (0.1s)
- Kind: `logic`
- Simulates: o cabecalho desce a barra de status
- Simulates: a tela de descanso respeita as duas barras
- Simulates: preferencia que ainda nao chegou nao vira botao morto

### PASS - Relationship link as timed product regression (0.2s)
- Kind: `logic`
- Simulates: o preco exibido e o preco cobrado
- Simulates: renovar custa menos que criar
- Simulates: vencer congela em vez de apagar

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

### PASS - Onboarding happy path (18.4s)
- Kind: `browser`
- Simulates: entra com conta temporaria
- Simulates: atravessa onboarding
- Simulates: cria arena/acao inicial
- Simulates: chega no fluxo principal sem travar

### PASS - Campaign quiz flow (14.9s)
- Kind: `browser`
- Simulates: abre loja de campanhas
- Simulates: roda quiz gratis
- Simulates: reabre quiz completo
- Simulates: instala campanha e confirma menu

### PASS - Cycle report flow (20.1s)
- Kind: `browser`
- Simulates: cria ciclo real
- Simulates: conclui tarefas
- Simulates: fecha ciclo
- Simulates: abre relatorio e reward flow

### PASS - UI shell smoke (11.1s)
- Kind: `browser`
- Simulates: abre shell principal
- Simulates: navega views centrais
- Simulates: garante que a casca da app sobe sem overlay travando

## Manual QA Still Required

- PIX/Ouro real ponta a ponta
- GM Panel com e-mail real
- Premium remoto em 2 aparelhos
- Passada final em aparelho real

