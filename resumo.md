# RESUMO FUNCIONAL: GLYPH 1.003b

Data: 11/03/2026

## 1. Leitura Rapida

O GLYPH hoje nao e so planner e tambem nao e so jogo.
Ele funciona em 4 estacoes:

- Estacao 1: entrar no core loop
- Estacao 2: criar ritmo e identidade
- Estacao 3: abrir mundo social e estruturas prontas
- Estacao 4: desenhar sistemas maiores e legado

Para quem acabou de chegar, a entrada ideal continua sendo:

- escolher uma Arena
- criar ou puxar uma Acao
- jogar no Planner
- usar o SITREP
- acompanhar o Ciclo
- fechar o dia
- fechar o ciclo
- revisar Historico
- abrir Legado

Esse vinculo entre `arenas`, `planner`, `sitrep` e `ciclo` e hoje a base mais forte do app.

## 2. Estacoes do Produto

### Estacao 1. Alicerce

Objetivo:
- fazer o usuario comecar leve
- reduzir peso cognitivo
- colocar a pessoa no loop no mesmo dia

Subestacoes:

#### 1.1 Arenas
- organizam as frentes da vida
- podem ser ativas, concluidas e arquivadas
- agora convivem melhor com campanhas e leitura de progresso

#### 1.2 Acoes
- acao rapida
- recorrente
- compromisso
- marco
- parsing
- compartilhada

#### 1.3 Planner
- dia
- semana
- estoque
- quick add
- horario
- ponto central de execucao

#### 1.4 SITREP
- abertura
- travar compromisso
- acompanhamento
- fechamento
- leitura do dia em tempo real

#### 1.5 Ciclos
- abrir
- encerrar
- score
- metas do periodo
- ritmo de revisao

#### 1.6 Relatorios
- fechamento de ciclo
- card metalico
- resumo compartilhavel
- leitura do Oraculo

### Estacao 2. Identidade e Ritmo

Objetivo:
- transformar uso em consistencia
- fazer o sistema refletir a pessoa
- ligar execucao com percepcao de progresso

Subestacoes:

#### 2.1 Historico
- timeline vertical
- cards de ciclo
- fases

#### 2.2 Eras
- cortes maiores
- nome
- skin
- consagracao

#### 2.3 Legado
- preview separado do Historico
- cena full-screen
- kit PNG
- registro completo
- placa final

#### 2.4 Patentes
- nivel
- rank
- progressao
- insignias

#### 2.5 Maestria
- leitura por area
- progressao
- percepcao de maturidade

#### 2.6 Quiz de Maestria
- calibragem
- recalibragem
- leitura de maturidade

#### 2.7 Perfil Soberano
- avatar
- nickname
- cla
- titulo
- vitrine

### Estacao 3. Mundo e Expansao

Objetivo:
- abrir o social
- permitir estruturas prontas
- fazer o usuario crescer sem ter que construir tudo sozinho

Subestacoes:

#### 3.1 Aliados
- amigos
- busca
- convites
- base dos vinculos

#### 3.2 Vinculos
- mentoria
- parceria
- desafio
- observacao de arenas
- avaliacao de pupilo

#### 3.3 Mentoria
- mentor observa arena do pupilo
- mentor pode abrir o modal de observacao
- mentor pode entregar Codex autoral para pupilo
- mentor pode criar um Codex na hora para aquele pupilo

#### 3.4 Clas
- entrar
- criar
- membros
- missao coletiva

#### 3.5 Quests de Temporada
- quests
- missoes
- recompensas
- insignias de quest

#### 3.6 Codex
- metodologias
- biblioteca
- loja
- preview em formato de campanha
- instalacao no fluxo de arenas
- drafts autorais persistidos no Supabase

#### 3.7 Loja de Codex
- vitrine
- preview no mesmo padrao visual de campanha
- compra

#### 3.8 Meus Codexes
- biblioteca pessoal
- ver campanha
- instalar campanha
- duplicar codex autoral para aliados e pupilos

### Estacao 4. Arquiteto

Objetivo:
- sair do uso tatico
- entrar em organizacao de metodo
- transformar rotina em estrutura replicavel

Subestacoes:

#### 4.1 Campanhas
- projetos longos
- sequencia de arenas
- desbloqueios
- fluxo visual com fases

#### 4.2 Codex Builder
- criar arenas
- criar acoes
- editar metodologia
- preview da campanha
- importar para o jogo
- entregar direto para pupilo

#### 4.3 Arsenal
- inventario
- skins
- artefatos
- glyphs
- orbes
- bordas
- baus

#### 4.4 Loja e Forja
- ouro
- pepitas
- barras
- compra
- craft
- reciclagem

#### 4.5 Preferencias
- sons
- animacoes
- modo basico/game
- IA
- notificacoes

#### 4.6 Oraculo
- feed
- modos
- notificacoes
- prompts
- conselhos
- analise

#### 4.7 Descanso
- energia
- retomada rapida

#### 4.8 Deep Focus
- foco profundo
- ambiente
- sessao

#### 4.9 Modo Office do Cla
- delegacao
- operacao
- times
- gestao coletiva

## 3. O Que Ja Foi Consolidado

- Historico vertical separado do Legado
- Legado full-screen com kit de export em PNG
- Placa do legado em iteracao com skins de fundo reais
- Cards metalicos de ciclo
- Radars proprios em SVG
- Baus alinhados ao catalogo vivo do banco
- Inventario e soberano mais coerentes entre si
- AssetsView redesenhada para ficar util no modo basico
- Layout Lab simples para calibrar a cena do legado
- `GM_HELP.md` para manter itens e seasons sem baguncar o projeto
- Preview de Codex unificado em loja, biblioteca e criador
- Drafts de Codex persistidos no Supabase
- Doacao de Codex autoral para pupilo dentro da mentoria

## 4. Regras Funcionais de Codex

- Codex comprado pode ser instalado, mas nao pode ser copiado para pupilos
- Codex autoral pode ser duplicado para varias pessoas
- Codex autoral pode ser criado na hora para um pupilo
- Depois de instalado, o Codex entra no fluxo de campanha

## 5. Regras de Insignia

- Rank = ouro
- Quest = prata
- Relatorio = bronze
- SITREP = nao da insignia
- Entrada inicial = sem level up e sem insignia automatica

## 6. AssetsView

A aba de ativos hoje serve para duas leituras:

- `Arenas`: mostra arenas concluidas e ativas daquela area
- `Widgets`: mostra o espelho interno da area

Intencao:

- modo basico = utilidade
- modo game = identidade

## 7. Pendencias Importantes

- revisar e simplificar tutorial pelas 4 estacoes
- encaixar melhor campanhas, codex e mentoria nesse onboarding
- arrumar miniaturas de arenas
- notificacoes com badge/numerinho no homescreen app
- polish da placa do legado
- polish do slideshow do legado
- polish fino da AssetsView
- smoke visual do fluxo do legado

## 8. Direcao de Produto

Nao fazer o GLYPH ser so planner nem so jogo.

A direcao certa continua sendo:

- planner organiza o presente
- SITREP interpreta o dia
- ciclo interpreta a fase
- legado interpreta a identidade

E o novo complemento fica assim:

- campanhas organizam jornadas maiores
- codex transforma metodo em estrutura
- mentoria distribui estrutura entre pessoas

Esse conjunto e hoje o diferencial mais forte do produto.
