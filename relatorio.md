============================================================
           GLYPH: MASTER SYSTEM STATE (23/03/26)
============================================================
STATUS: [X] ALPHA  |  [ ] BETA  |  [ ] LIVE
FASE:   [X] FUNDACAO (T1) | [ ] CERCO | [ ] ASCENSAO
------------------------------------------------------------

## 1. FASE ATUAL: FUNDACAO (T1)
- Status: ALPHA
- Missao: Provar onboarding, loop diario, retorno D2 e conclusao de ciclos reais.
- Enquadramento: T1 (Fundacao) e um submarco operacional do Marco 1: Prova (mar/2026 -> dez/2026).
- Trilha oficial do Marco 1: `T1 Fundacao -> T2 O Cerco -> T3 A Ascensao`.

## 2. SCORECARD DE AUDITORIA
- **EXECUCAO REAL: 9.8** (Build/Type-check ok. `Ativos`, `Modo Jogo` e tutorial passaram por uma rodada estrutural sem quebrar o core).
- **ID VISUAL: 9.7** (Tela de `Ativos` ficou mais painel e menos cena, com leitura melhor em dark/light e palette por ativo mais coerente).
- **FLUXO USUARIO: 9.7** (Onboarding/tutoriais agora conversam com `Modo Jogo`, sem escolha inicial de modo. Pendente: QA real de onboarding, `e-mail/Convite` e D2).
- **RETENCAO: --** (Aguardando Beta)
- **AQUISICAO: --** (Aguardando Videos)

## 3. STATUS DE ENTREGA (CONCLUIDO NESTE CICLO)
[v] Desligar a economia de `slots` e consolidar a camada social em Ouro direto (`Mentoria 100`, `Parceria 50`, `Competicao 50`, arena extra `50`), com SQL aplicado e copy publica puxada para `Campanha`/`Grupo`. - Responsavel: PROTOCOLO
[v] Integrar `Tarefas do grupo` ao board oficial de arenas: quest/tarefa aceita vira arena real, abre `ArenaDetailModal` e limpa participacao/arena vazia no retorno. - Responsavel: PROTOCOLO
[v] Entregar o `modo lista` da `ArenasView`, restaurar o scroll vertical mobile e preservar reorder em `Livre/Prioridades`, com expandir de todas as acoes por arena. - Responsavel: PROTOCOLO
[v] Lapidar a visualizacao compacta das arenas no mobile: card achatado, tipografia/icone ajustados, badge do ativo nos circulos e limpeza do modulo `Grupo`/copy publica residual. - Responsavel: PROTOCOLO
[v] Reestruturar a tela de `Ativos` como painel operacional: resumo fino do ciclo, cards por ativo nas posicoes oficiais, barrinhas finas de progresso, tint sutil por ativo e leitura melhor em dark/light. - Responsavel: PROTOCOLO
[v] Iniciar a convergencia publica `GAME/BASIC -> Modo Jogo`: nave unificada, `Ativos` voltando para todos, perfil em `Resumo/Widgets/Maestria` e `Modo Jogo` centralizado em `Preferencias`. - Responsavel: PROTOCOLO
[v] Revisar onboarding e tutoriais para o novo modelo `core + Modo Jogo`, com cards `1/2` no basico, cards `3/4` ligados ao toggle, copy alinhada e checagem final de anchors, `type-check` e `build`. - Responsavel: PROTOCOLO

## 4. MATRIZ DE EXECUCAO (PENDENCIAS & PRIORIDADES)
### COMANDO (METAS IMEDIATAS & DONO)
[ ] Rodar QA completo do onboarding sem seletor inicial de modo: validar fim do onboarding, `Tutoriais` 1/2 no basico, ativacao de `Modo Jogo` em `Preferencias` e desbloqueio correto dos cards 3/4. - Responsavel: SENTINELA
[ ] Rodar o QA final da `Mentoria basica` em `2 contas`: convite, aceite, recusa, revogacao, refund, abertura da relacao, arena extra por `50 ouro` e campanha exclusiva por `100 ouro`, sem slots. - Responsavel: SENTINELA
[ ] Validar `Solicitacoes` no Social com amizade + vinculo no mesmo lugar, badge de relacao no card do amigo e notificacao/push coerentes no fluxo. - Responsavel: SENTINELA
[ ] Fechar a conta nova real restante: ramo `e-mail/Convite` e primeiro retorno `D2` sem ruido. - Responsavel: TRONO
[ ] Rodar a passada final de QA mobile em `Season`, `Genesis/Aurora` e hierarquia visual das vitrines para congelar o padrao. - Responsavel: SENTINELA

### TRONO (Governanca & Decisao)
[ ] Disparar os 5 primeiros Bilhetes Dourados.
[ ] Analisar dados reais de Ativacao, D2 e % de Ciclos para validar a entrada da Primeira Linhagem.

### PROTOCOLO (Integridade & Codigo)
[ ] Fechar a convergencia final do `Modo Jogo`: empacotar o metajogo num toggle unico, esconder o que for pacote game e limpar os ramos legados `GAME/BASIC` que ainda sobraram no codigo. - Responsavel: PROTOCOLO
[ ] Fechar o teste real de e-mail via GM Panel e isolar o erro exato se a entrega nao chegar. - Responsavel: PROTOCOLO
[ ] Concluir a ultima passada de pt-BR residual e acabamento fino do cadastro manual apos o novo ritual de Termos pos-login. - Responsavel: PROTOCOLO

### DOMINIO (Marketing & Presenca)
[ ] Criar e publicar videos curtos/Reels dos fluxos principais, usando isso para apresentar os 5 primeiros acessos e abrir a narrativa publica do GLYPH.
[ ] Fazer uma vistoria do site/landing para alinhar copy, fluxo e apresentacao publica antes de empurrar mais trafego.

### TESOURO (Produto & Economia)
[ ] Validar em uso real a leitura de Ouro direto da camada social (`Mentoria 100`, `Parceria 50`, `Competicao 50`, arena extra `50`) e garantir que nenhuma copy/regra de slot reapareca. - Responsavel: TESOURO
[ ] Decidir so os complementos da economia leve (`campanha para outro`, `cosmetico`, `aceleracao`) sem reintroduzir slots ou micro-regras. - Responsavel: TESOURO

## 5. MARCO 1: PROVA (DEZ/2026)
- Tese: se o T1 falhar, o restante do Marco 1 perde base.
- Objetivo do Marco 1: sair do estado de projeto e provar produto com retencao real.
- Meta de gloria do Marco 1: `1.000 usuarios ativos` com retencao consistente.
- Papel do T1 (mar -> maio): checkpoint `5 -> 20 -> 50 usuarios` com loop completo rodando sem ruido.
- Submarcos oficiais do Marco 1:
  - `T1 Fundacao (mar -> mai)` = fechar onboarding, loop diario e primeiro retorno.
  - `T2 O Cerco (jun -> ago)` = publicar nas stores e atrair `300 usuarios externos`.
  - `T3 A Ascensao (set -> dez)` = escalar e cravar `1.000 usuarios ativos`.
- Marcos seguintes ja definidos:
  - `Marco 2: Coroa (jan -> jun/2027)` = `5.000 -> 10.000 usuarios`.
  - `Marco 3: Soberania (jul -> dez/2027)` = `50.000+ usuarios`.
- Metricas de passagem do T1:
  - `60%+` criam `1 arena + 1 acao + 1 tarefa`.
  - `30%+` retornam no `D2`.
  - `20%+` fecham `1 ciclo`.

## 6. STATS PRA FICAR DE OLHO (SEMANAL - PRINCIPAIS T1)
[ ] Ativacao onboarding: 0/60%
[ ] Retorno D2: 0/30%
[ ] Fechamento 1 ciclo: 0/20%

Monitor complementar:
[ ] Usuarios ativos T1: 0/50
[ ] Cobertura `marco1_beta_tracking`: 0/100%
[ ] Friccao mobile critica (P0/P1): 0/0

## 7. RESUMO ATUALIZADO
- Data: 23/03/2026
- Atualizado por: GPT-5 Codex
- Resumo: O GLYPH segue em ALPHA na Fundacao (T1) e o fechamento de 23/03 puxou a experiencia para um trilho mais unificado: a tela de `Ativos` virou painel operacional com resumo do ciclo e cards por ativo, a convergencia publica `GAME/BASIC -> Modo Jogo` comecou a tomar forma em `Preferencias`, o perfil foi reorganizado e o onboarding/tutoriais passaram a ensinar `core primeiro` e `Modo Jogo depois`. O foco seguinte ficou claro: QA real do novo onboarding sem seletor de modo, QA da mentoria em `2 contas`, validacao de `Solicitacoes`, prova real do ramo `e-mail/Convite` e a ultima rodada de limpeza do pacote `Modo Jogo`.
- Texto do relatorio: atualizado a cada fechamento.

## 8. MODO DE USO DO RELATORIO
1. Quando eu pedir para atualizar progresso, ler `relatorio.md`, `status.md`, `roadmap-soberania.md` e `progresso.md` antes de mexer em qualquer coisa.
2. Entender os papeis:
   - `relatorio.md` = quadro operacional vivo do ciclo atual.
   - `status.md` = estado geral consolidado do sistema e do produto.
   - `roadmap-soberania.md` = direcao dos marcos, fases e checkpoints.
   - `progresso.md` = historico consolidado do que ja foi validado.
3. Manter coerencia entre os 3 docs principais:
   - fase atual, marco atual, metas T1, linguagem e prioridades nao podem se contradizer.
4. No item 4 do relatorio:
   - marcar com `[-]` o que apareceu, reapareceu ou foi visto no QA do dia.
   - marcar com `[x]` o que foi realmente fechado neste ciclo.
5. Mover para o item 3 as tarefas `[x]` fechadas no item 4.
6. Atualizar o item 6 com foco nas 3 metricas principais do T1 (`60/30/20`).
7. Atualizar o item 7 com data, autor e resumo do fechamento.
8. Separar do item 3 as tarefas que ja estavam com `[v]` e mandar para `progresso.md`.
9. No fechamento seguinte, trocar as `[x]` antigas do item 3 para `[v]`.
10. Nao inventar avancos: so marcar como `[x]` ou `[v]` o que realmente foi feito e validado no app ou na infra.
11. Se eu pedir apenas para `atualizar progresso`, nao converter `[x]` em `[v]` e nao limpar o item 3: manter os `[x]` recem-fechados na vitrine de entrega.
12. So converter `[x]` em `[v]` e mover `[v]` para `progresso.md` quando eu pedir claramente para `fechar o dia`, `fechar ciclo` ou equivalente.

## 9. BLOQUEIOS ATUAIS (ABERTOS)
[ ] O novo trilho de onboarding/tutorial ainda pede QA ponta a ponta sem seletor inicial de modo, incluindo a liberacao dos cards 3/4 via `Modo Jogo`.
[ ] Mentoria basica ainda pede a rodada final em `2 contas`, com refund, arena extra `50 ouro`, campanha `100 ouro` e leitura da relacao no Social.
[ ] Conta nova real ainda pede fechamento do ramo `e-mail/Convite` e prova do primeiro retorno `D2`.
[ ] GM Panel ainda pede prova real de entrega de e-mail.
[ ] Acabamento final mobile ainda pede ultima passada em `Season`, `Genesis/Aurora`, pt-BR residual e hierarquia visual.
[ ] Economia social agora pede validacao em uso real para garantir que o modelo de Ouro direto segure sem reintroduzir slot ou micro-regra.
[ ] A convergencia final de `Modo Jogo` ainda pede esconder todo o pacote de metajogo por um unico toggle e remover o resto dos branches legados.

Legenda rapida:
- `[ ]` = pendente
- `[-]` = visto hoje / reaberto no QA / ainda em revisao
- `[x]` = concluido neste ciclo (ainda em vitrine de entrega)
- `[v]` = concluido e validado para historico
