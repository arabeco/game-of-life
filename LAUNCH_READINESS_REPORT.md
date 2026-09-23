# Launch Readiness Report

- Generated at: 2026-09-23T22:00:13.025Z
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

### PASS - Arena pacts regression (0.1s)
- Kind: `logic`
- Simulates: nao propoe arena arquivada, travada, vazia ou concluida
- Simulates: constancia conta dias e nao acoes
- Simulates: entrega anterior ao aceite nao conta

### PASS - Cycle scheduling regression (0.1s)
- Kind: `logic`
- Simulates: renovar uma arena nao expulsa as outras do ciclo
- Simulates: a virada reagenda as acoes recorrentes
- Simulates: o agendamento para no fim do ciclo, nao em 365 dias

### PASS - Continuar sem ciclo regression (0.1s)
- Kind: `logic`
- Simulates: fechar o ciclo e continuar nao deixa as arenas cheias
- Simulates: a experiencia do ciclo nao volta na rodada e nao e paga duas vezes

### PASS - Rodada nao paga duas vezes regression (0.1s)
- Kind: `logic`
- Simulates: concluir a rodada no meio do dia nao devolve o dia ja pago
- Simulates: a marca na virada do dia conta o proprio dia

### PASS - Regras de desbloqueio regression (0.2s)
- Kind: `logic`
- Simulates: nenhuma borda ou banner fica sem caminho
- Simulates: regra nao promete item que nao existe
- Simulates: um item nao sai por duas regras

### PASS - Nota do ciclo regression (0.1s)
- Kind: `logic`
- Simulates: a conclusao da a nota e o porte da o teto
- Simulates: o SS pede um mes impecavel e nao um mes comprido
- Simulates: o bau sai da nota e de mais nada

### FAIL - Cards de sabedoria regression
- Kind: `logic`
- Simulates: o card do dia nasce ligado
- Simulates: a leitura do ciclo e o card de tema nao dividem a vaga do dia
- Simulates: cada um cai na sua aba
- Simulates: um banco de textos so para o app e para o cron
- Error: Cards de sabedoria regression failed with exit 1

### PASS - Ciclo recem-nascido regression (0.1s)
- Kind: `logic`
- Simulates: o dia 1 nao recebe "salve o que puder"
- Simulates: um dia cheio pela frente nao e ciclo perdido
- Simulates: sem ciclo nao ha risco de ciclo
- Simulates: mais tarde o aviso continua vindo

### PASS - Manha nao tem veredito regression (0.1s)
- Kind: `logic`
- Simulates: as sete da manha o plano nao e diagnostico
- Simulates: a tarde o diagnostico volta inteiro
- Simulates: a frase fala da arena e nao do dia
- Simulates: nenhuma frase promete que uma acao resolve o dia

### PASS - Relatorio sem repeticao regression (0.1s)
- Kind: `logic`
- Simulates: cada quadro responde uma pergunta diferente
- Simulates: um numero aparece uma vez so
- Simulates: o melhor dia e a maior sequencia saem do banco para a tela
- Simulates: a comparacao com o historico deixa de ser so do Platinum

### PASS - Apagar conta regression (0.1s)
- Kind: `logic`
- Simulates: so a exclusao pode abortar a exclusao
- Simulates: limpeza de arquivo avisa e segue
- Simulates: o pedido se registra antes de apagar
- Simulates: o app continua tendo por onde pedir

### PASS - Pagamento web regression (0.1s)
- Kind: `logic`
- Simulates: preco e premio saem do catalogo do servidor
- Simulates: o dono da compra sai do token
- Simulates: o catalogo do servidor bate com o do app
- Simulates: o webhook confere assinatura e valor cobrado

### PASS - Economia descontos regression (0.1s)
- Kind: `logic`
- Simulates: a tela e o banco descontam igual
- Simulates: o preco final em ouro bate
- Simulates: o custo com plano nao volta a ser numero fixo
- Simulates: o credito antigo continua honrado

### PASS - Bau com dono regression (0.1s)
- Kind: `logic`
- Simulates: a porta do app nao aceita destino
- Simulates: a porta que aceita destino so o servidor alcanca
- Simulates: as duas validam o tipo contra ChestType
- Simulates: o app chama a porta certa

### PASS - Journal egress regression (0.1s)
- Kind: `logic`
- Simulates: o contexto nao conhece o diario
- Simulates: o indice nao traz o texto das paginas
- Simulates: ler e salvar sao de uma pagina so
- Simulates: o diario e so de quem escreveu

### PASS - Ciclo so existe no banco regression (0.1s)
- Kind: `logic`
- Simulates: o insert do ciclo e esperado
- Simulates: o insert pede a linha de volta
- Simulates: a tela so muda depois da confirmacao
- Simulates: a rodada nao fecha por um ciclo que nao nasceu
- Simulates: a falha vira aviso e nao console.error

### PASS - Widget conta o dia certo regression (0.1s)
- Kind: `logic`
- Simulates: o numero do dia e elapsedDays + 1
- Simulates: o snapshot leva o rotulo pronto
- Simulates: o widget usa o rotulo em vez de remontar
- Simulates: a linha de Tempo continua sendo dias decorridos

### PASS - Loja cobra o preco dela regression (0.1s)
- Kind: `logic`
- Simulates: p_cost_gold nao decide nada
- Simulates: o preco sai de items e store_prices
- Simulates: item de bau/patente nao se compra
- Simulates: o desconto de renovacao e conferido no servidor
- Simulates: o debito continua atomico
- Simulates: a tela mostra o que foi cobrado

### PASS - Perfil nao se escreve a mao regression (0.1s)
- Kind: `logic`
- Simulates: as nove colunas de economia ficam fora da concessao
- Simulates: o revoke de tabela vem antes do grant por coluna
- Simulates: o saldo e o maior entre wallet e a coluna gold
- Simulates: anon nao escreve perfil
- Simulates: ninguem trunca user_profiles

### PASS - Tinta metalica regression (0.1s)
- Kind: `logic`
- Simulates: drop-shadow nao volta para cima do recorte por texto
- Simulates: o numero nao vira um tijolo dourado
- Simulates: a tinta metalica tem um dono so

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

### PASS - Oracle presence policy regression (0.5s)
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

### PASS - Displayed level scale regression (0.1s)
- Kind: `logic`
- Simulates: confere que area e Indice usam o mesmo fator
- Simulates: proibe nivel cru na tela
- Simulates: proibe dobrar a mao

### PASS - Skin button contrast regression (0.1s)
- Kind: `logic`
- Simulates: interpola o gradiente do botao
- Simulates: cobra o minimo da WCAG em cada skin
- Simulates: trava a faixa de luz que corre sozinha

### PASS - Core loop regression (0.1s)
- Kind: `logic`
- Simulates: recalcula o core loop
- Simulates: valida progresso de campanha/arena
- Simulates: confere score, atlas e mutacoes utilitarias

## Manual QA Still Required

- Compra real pela Google Play (recibo validado na edge function)
- Premium remoto em 2 aparelhos
- Passada final em aparelho real

