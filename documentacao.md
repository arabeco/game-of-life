# GLYPH: MASTER SYSTEM STATE (11/03/2026)

Status: [x] ALPHA  |  [ ] BETA  |  [ ] LIVE  
Fase: [x] FUNDACAO (T1)  |  [ ] CERCO  |  [ ] ASCENSAO

## 1. Estrutura (O Conselho)

| Pilar | Peso | Agente | Estado |
| --- | ---: | --- | --- |
| TRONO | 80% | Zee | ATIVO |
| PROTOCOLO | 05% | IA Arquit. | ATIVO |
| TESOURO | 05% | IA Escudo | STANDBY |
| DOMINIO | 05% | IA Clamor | ESTRATEGICO |
| SENTINELA | 05% | IA Alicer. | OPERACIONAL |

## 2. Scorecard (Notas de Auditoria)

- EXECUCAO REAL: 9.3  
  Base: `build` ok, `type-check` ok, `test` ok, core loop planner <-> sitrep <-> ciclo segue blindado e baus/catalogo estao coerentes entre cliente e backend.
- ID VISUAL: 9.1  
  Base: Historico e Legado estao mais separados, legado full-screen ganhou estrutura melhor, mas a placa final e as miniaturas de arena ainda pedem polish.
- FLUXO USUARIO: 9.0  
  Base: AssetsView ficou mais util, mas ainda precisamos revisar tutorial, miniaturas e alguns refinamentos de leitura no modo basico.
- RETENCAO: --  
  Sem dado real de beta aberto ainda.
- AQUISICAO: --  
  Sem maquina de conteudo/distribuicao validada ainda.

## 3. Snapshot Tecnico

- Views principais: 17
- Arquivos TSX: 177
- Contextos TSX: 4
- Suite de regressao do core loop: 17 cenarios
- `GameContext.tsx`: 6.034 linhas
- Pagamentos: Mercado Pago + Supabase ativos no codigo
- Export legado: kit vertical PNG + registro completo PNG
- `open_chest`: alinhado ao catalogo vivo via `is_live_in_game`
- `recharts`: removido; radars agora usam SVG proprio

## 4. Perfil & Marcos

- AUTORIDADE: Vagante (Genesis)
- USUARIOS: ~5 (beta interno, sem nova medicao local no repo)
- MARCOS: 0 / 2 concluidos

1. MARCO 1: Prova de Fogo (Dez/2026)  
   Salario zero / 1k users
2. MARCO 2: Consolidacao (Jun/2027)  
   Seed R$ 800k / mentores

## 5. Bloco de Notas (Onde Estamos)

O produto esta mais coerente em tres camadas: uso diario, fechamento de ciclo e memoria historica. A frente tecnica esta mais limpa. O gargalo atual e acabamento de UX, onboarding e validacao real de uso.

## 6. Mapa das 25 Estacoes

### 01. Arenas
- Meta
- Registro / Acompanhamento
- arenas ativas
- arenas concluidas
- arenas arquivadas

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
- abertura do dia
- travar compromisso
- acompanhamento do dia
- fechamento simples

### 05. Ciclos
- abrir ciclo
- encerrar ciclo
- score
- metas do periodo
- ciclo atual

### 06. Relatorios
- fechamento do ciclo
- card metalico
- resumo compartilhavel
- leitura do Oraculo

### 07. Historico
- timeline vertical
- ciclos empilhados
- cards de ciclo
- navegacao por fase

### 08. Eras
- cortes
- nome
- skin
- consagracao
- agrupamento de ciclos

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
- insignias de rank

### 11. Maestria
- 10 ativos
- leitura da area
- progressao por ativo

### 12. Quiz de Maestria
- calibragem inicial
- recalibragem
- leitura de maturidade

### 13. Perfil Soberano
- avatar
- nickname
- cla
- titulo
- vitrine pessoal

### 14. Arsenal
- inventario
- skins
- artefatos
- glyphs
- orbes
- bordas
- insignias
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
- analise de ciclo

### 18. Descanso
- tela de descanso
- energia
- retomada rapida

### 19. Deep Focus
- foco profundo
- ambiente imersivo
- sessao de trabalho

### 20. Aliados
- amigos
- busca
- convites
- vinculos

### 21. Clas
- entrar
- criar
- aceitar membros
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
- metodologias prontas
- mentorias
- instalacao no fluxo

### 25. Modo Office do Cla
- delegacao
- operacao
- times
- gestao coletiva

## 7. Checklist de Pendencias

- [ ] Revisar e simplificar o tutorial
- [ ] Arrumar de vez as miniaturas de arenas
- [ ] Adicionar notificacoes com numerinho/badge no homescreen do app
- [ ] Polir a placa do legado no preview e na cena
- [ ] Dar polish final no slideshow do legado
- [ ] Polir o card metalico compacto do Historico
- [ ] Fechar a nova AssetsView no modo basico/game sem ruido visual
- [ ] Rodar smoke visual do fluxo `Ver Legado` com as skins finais
- [ ] Abrir MEI
- [ ] Rodar beta fechado com usuarios suficientes para medir retencao
- [ ] Instrumentar analytics real de funil e ativacao
- [ ] Iniciar 2 videos semanais de clamor/distribuicao

## 8. Zoom: Relatorio de Hoje

### O que fizemos

- Mantivemos `Historico` vertical e `Legado` como experiencia separada.
- Abandonamos o caminho de MP4 como fluxo principal e focamos em kit PNG vertical.
- Plugamos fundos reais para o legado e criamos um `Layout Lab` simples para ajustar placa, ciclos e card inferior.
- Reformulamos a `AssetsView` para ficar mais util no modo basico e no modo game.
- Alinhamos o backend de baus ao catalogo vivo do banco.
- Centralizamos raridade/cores e removemos `recharts` do app.
- Mantivemos o shell inicial leve com split seguro.

## 9. Leitura Seca

Glyph 1.003b esta tecnicamente mais solido e mais claro. O que falta agora e menos sistema novo e mais acabamento: tutorial, miniaturas, legado e validacao real com usuarios.
