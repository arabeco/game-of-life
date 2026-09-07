# Launch Readiness Report

- Generated at: 2026-09-07T22:18:44.863Z
- Suite: `full`
- Smoke URL: `http://127.0.0.1:3011/`
- Build: SKIPPED

## Checks

### PASS - Avatar offsets regression (0.2s)
- Kind: `logic`
- Simulates: tabela vazia desenha igual ao comportamento antigo
- Simulates: escala cresce do centro da peca
- Simulates: o gabarito do corpo bate entre o codigo e o script

### PASS - Reward modal regression (0.1s)
- Kind: `logic`
- Simulates: trava que existe um miolo so de recompensa
- Simulates: impede a letra solta voltar no lugar do simbolo
- Simulates: fixa a altura do card de item

### PASS - Item art regression (0.3s)
- Kind: `logic`
- Simulates: confere que todo imageUrl existe no disco
- Simulates: trava as categorias que ainda vivem de emoji
- Simulates: avisa quando item some do catalogo por falta de arte

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

### PASS - Reward modal priority regression (0.1s)
- Kind: `logic`
- Simulates: nao mostra passagem antiga a conta nova
- Simulates: evita sobreposicao entre dicas, temporada e recompensas

### PASS - Daily widget execution regression (0.1s)
- Kind: `logic`
- Simulates: remove planejamento diario do widget
- Simulates: mostra acoes feitas, XP e arenas tocadas

### PASS - Daily reading regression (0.1s)
- Kind: `logic`
- Simulates: fala sobre o dia corrente, nao so sobre dias fechados
- Simulates: a assinatura muda a regua e nao o elogio
- Simulates: dia abaixo da media nao soa como falha

### PASS - Cycle comparison regression (0.1s)
- Kind: `logic`
- Simulates: o ciclo nao entra na propria referencia
- Simulates: dias sem entrega conta invertido
- Simulates: mediana aguenta ciclo extremo

### PASS - Subscription XP bonus regression (0.1s)
- Kind: `logic`
- Simulates: platinum rende mais que premium
- Simulates: assinatura vencida nao paga bonus
- Simulates: vitrine sai do mesmo numero do calculo

### PASS - Arena pacts regression (0.2s)
- Kind: `logic`
- Simulates: nao propoe arena arquivada, travada, vazia ou concluida
- Simulates: constancia conta dias e nao acoes
- Simulates: entrega anterior ao aceite nao conta

### PASS - Cycle scheduling regression (0.1s)
- Kind: `logic`
- Simulates: renovar uma arena nao expulsa as outras do ciclo
- Simulates: a virada reagenda as acoes recorrentes
- Simulates: o agendamento para no fim do ciclo, nao em 365 dias

### PASS - XP scale regression (0.1s)
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

### PASS - Oracle reaction regression (0.1s)
- Kind: `logic`
- Simulates: a reacao nao repete a frase anterior
- Simulates: a primeira acao depois de uma pausa tem fala propria
- Simulates: a dica de tela olha o que existe na tela

### PASS - Sensory grammar regression (0.1s)
- Kind: `logic`
- Simulates: tres pesos e nada colidindo
- Simulates: fechar ciclo nao vibra como fechar painel
- Simulates: o marco de sequencia tem pulso proprio

### PASS - Oracle arbiter regression (0.2s)
- Kind: `logic`
- Simulates: as seis arenas competem em vez de morrer no ranking
- Simulates: a presenca e o corte de relevancia
- Simulates: sem candidato ele fica quieto

### PASS - Oracle presence policy regression (0.6s)
- Kind: `logic`
- Simulates: presenca decide o que ele fala
- Simulates: aviso decide onde chega
- Simulates: push nao volta a exigir presenca 3

### PASS - Safe area and late data regression (0.1s)
- Kind: `logic`
- Simulates: o cabecalho desce a barra de status
- Simulates: a tela de descanso respeita as duas barras
- Simulates: preferencia que ainda nao chegou nao vira botao morto

### PASS - Relationship link as timed product regression (0.1s)
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

### PASS - Onboarding happy path (17.7s)
- Kind: `browser`
- Simulates: entra com conta temporaria
- Simulates: atravessa onboarding
- Simulates: cria arena/acao inicial
- Simulates: chega no fluxo principal sem travar

### PASS - Campaign quiz flow (15.1s)
- Kind: `browser`
- Simulates: abre loja de campanhas
- Simulates: roda quiz gratis
- Simulates: reabre quiz completo
- Simulates: instala campanha e confirma menu

### PASS - Cycle report flow (19.7s)
- Kind: `browser`
- Simulates: cria ciclo real
- Simulates: conclui tarefas
- Simulates: fecha ciclo
- Simulates: abre relatorio e reward flow

### PASS - UI shell smoke (10.8s)
- Kind: `browser`
- Simulates: abre shell principal
- Simulates: navega views centrais
- Simulates: garante que a casca da app sobe sem overlay travando

### PASS - Onboarding + oracle + delete (23.3s)
- Kind: `browser`
- Simulates: valida onboarding
- Simulates: abre oracle
- Simulates: exercita fluxo de delete/account cleanup

### SKIP - Notification lab
- Kind: `browser`
- Simulates: abre laboratorio de notificacoes
- Simulates: injeta notificacoes de teste
- Simulates: confere renderizacao e estados basicos
- Error: o laboratorio de notificacoes nao tem tela no app

### PASS - Clan creation (15.5s)
- Kind: `browser`
- Simulates: abre criacao de grupo
- Simulates: confirma debito/fluxo
- Simulates: garante que o grupo nasce na UI

### FAIL - Mentorship planner sync
- Kind: `browser`
- Simulates: cria mentoria 2 contas
- Simulates: cria arena vinculada
- Simulates: sincroniza planner entre os lados
- Error: Mentorship planner sync failed with exit 1

### FAIL - Mentorship arenas visibility
- Kind: `browser`
- Simulates: abre mentoria existente
- Simulates: confere arenas compartilhadas
- Simulates: valida leitura correta no board
- Error: Mentorship arenas visibility failed with exit 1

### FAIL - Partnership mutual arenas
- Kind: `browser`
- Simulates: cria parceria 2 contas
- Simulates: espelha arenas dos dois lados
- Simulates: confirma visibilidade mutua
- Error: Partnership mutual arenas failed with exit 1

### FAIL - Competition race
- Kind: `browser`
- Simulates: abre competicao
- Simulates: executa corrida entre contas
- Simulates: confere vencedor, bau e reflexo final
- Error: Competition race failed with exit 1

### SKIP - Season clan smoke
- Kind: `browser`
- Simulates: abre temporada
- Simulates: entra em superficie de missao/quest
- Simulates: verifica integracao base com grupo
- Error: feature clanMissions desligada

### SKIP - Legacy era customization
- Kind: `browser`
- Simulates: abre customizacao do legado
- Simulates: troca configuracoes principais
- Simulates: confirma persistencia visual
- Error: o modal de customizar era nao tem porta de entrada no app

### FAIL - Legacy plaque flow
- Kind: `browser`
- Simulates: gera placa final
- Simulates: abre cena de legado
- Simulates: confere fluxo de conclusao visual
- Error: Legacy plaque flow failed with exit 1

## Manual QA Still Required

- PIX/Ouro real ponta a ponta
- GM Panel com e-mail real
- Premium remoto em 2 aparelhos
- Passada final em aparelho real

