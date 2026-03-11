# RESUMO FUNCIONAL: GLYPH 1.003b

Data: 11/03/2026

## 1. Core Loop

O loop principal hoje e:
- criar arena
- criar acao
- jogar no planner
- usar o sitrep
- fechar o dia
- fechar ciclo
- revisar historico
- abrir legado

Esse vinculo entre `planner`, `sitrep` e `ciclo` foi blindado e hoje e a base mais forte do app.

## 2. O Que Ja Existe

### 01. Arenas
- Meta
- Registro / Acompanhamento
- ativas
- concluidas
- arquivadas

### 02. Acoes
- acao rapida
- recorrente
- parsing
- compromisso
- marco
- compartilhada

### 03. Planner
- dia
- semana
- estoque
- quick add
- horario

### 04. SITREP
- abertura
- travar compromisso
- acompanhamento
- fechamento

### 05. Ciclos
- abrir
- encerrar
- score
- metas do periodo

### 06. Relatorios
- fechamento de ciclo
- card metalico
- resumo compartilhavel
- leitura do Oraculo

### 07. Historico
- timeline vertical
- cards de ciclo
- fases

### 08. Eras
- cortes
- nome
- skin
- consagracao

### 09. Legado
- preview
- cena full-screen
- kit PNG
- registro completo
- placa final

### 10. Patentes
- nivel
- rank
- progressao
- insignias

### 11. Maestria
- ativos
- leitura da area
- progressao

### 12. Quiz de Maestria
- calibragem
- recalibragem
- leitura de maturidade

### 13. Perfil Soberano
- avatar
- nickname
- cla
- titulo
- vitrine

### 14. Arsenal
- inventario
- skins
- artefatos
- glyphs
- orbes
- bordas
- baus

### 15. Loja e Forja
- ouro
- pepitas
- barras
- compra
- craft
- reciclagem

### 16. Preferencias
- sons
- animacoes
- modo basico/game
- IA
- notificacoes

### 17. Oraculo
- feed
- modos
- notificacoes
- prompts
- conselhos
- analise

### 18. Descanso
- energia
- retomada rapida

### 19. Deep Focus
- foco profundo
- ambiente
- sessao

### 20. Aliados
- amigos
- busca
- convites
- vinculos

### 21. Clas
- entrar
- criar
- membros
- missao coletiva

### 22. Quests de Temporada
- quests
- missoes
- recompensas
- insignias de quest

### 23. Campanhas
- projetos longos
- sequencia de arenas
- desbloqueios

### 24. Codex
- metodologias
- mentorias
- instalacao no fluxo

### 25. Modo Office do Cla
- delegacao
- operacao
- times
- gestao coletiva

## 3. Funcionalidades Novas ou Consolidadas

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

## 4. Regras de Insignia

- Rank = ouro
- Quest = prata
- Relatorio = bronze
- Sitrep = nao da insignia
- Entrada inicial = sem level up e sem insignia automatica

## 5. Legado

Hoje o legado tem:
- preview separado do Historico
- cena full-screen
- fundo por skins
- cards de ciclo na timeline
- kit de export em PNG
- registro completo em PNG

Ainda falta:
- polish final da placa
- polish final do slideshow
- encaixe final das informacoes para celular

## 6. AssetsView

A aba de ativos agora serve para duas leituras:
- `Arenas`: mostra arenas concluidas e ativas daquela area
- `Widgets`: mostra o espelho interno da area

A intencao e:
- modo basico = utilidade
- modo game = identidade

## 7. Coisas Pendentes Importantes

- revisar tutorial
- arrumar miniaturas de arenas
- notificacoes com badge/numerinho no homescreen app
- polish da placa do legado
- polish do slideshow do legado
- polish fino da AssetsView
- smoke visual do fluxo do legado

## 8. Direcao de Produto

Nao fazer o Glyph ser so planner nem so jogo.
A direcao certa continua sendo:
- planner organiza o presente
- sitrep interpreta o dia
- ciclo interpreta a fase
- legado interpreta a identidade

Esse e o diferencial mais forte do produto.
