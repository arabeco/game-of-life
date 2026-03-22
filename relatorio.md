============================================================
           GLYPH: MASTER SYSTEM STATE (22/03/26)
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
- **EXECUCAO REAL: 9.7** (Build/Type-check ok. Economia social sem slots aplicada, board de Grupo mais operacional e `ArenasView` blindada no mobile).
- **ID VISUAL: 9.6** (Miniaturas/lista de arenas, Grupo e Legado mais coerentes no padrao luxe).
- **FLUXO USUARIO: 9.6** (ArenasView mais util, Grupo menos hibrido e camada social mais simples. Pendente: `e-mail/Convite`, QA em `2 contas` e D2).
- **RETENCAO: --** (Aguardando Beta)
- **AQUISICAO: --** (Aguardando Videos)

## 3. STATUS DE ENTREGA (CONCLUIDO NESTE CICLO)
[v] Fechar o laboratorio de notificacoes do GM com 3 botoes previsiveis (`Sistema Agora`, `Card do Oraculo`, `Sistema + Push 15s`) e destaque correto em `Avisos`/Oraculo. - Responsavel: PROTOCOLO
[v] Validar o PIX real do Mercado Pago ate o credito de ouro na conta, com QR funcional, status em pt-BR, toast de sucesso e fechamento automatico apos a aprovacao. - Responsavel: PROTOCOLO
[v] Adicionar atalho por `hold` da `Checklist` na `RestScreen`, abrindo a lista por cima da tela de descanso e zerando no reset operacional das `04:00`. - Responsavel: PROTOCOLO
[v] Subir `Humor` + `Rascunho operacional` na `RestScreen`, com salvamento por dia operacional em `daily_commitments.operational_scratch`. - Responsavel: PROTOCOLO
[x] Desligar a economia de `slots` e consolidar a camada social em Ouro direto (`Mentoria 100`, `Parceria 50`, `Competicao 50`, arena extra `50`), com SQL aplicado e copy publica puxada para `Campanha`/`Grupo`. - Responsavel: PROTOCOLO
[x] Integrar `Tarefas do grupo` ao board oficial de arenas: quest/tarefa aceita vira arena real, abre `ArenaDetailModal` e limpa participacao/arena vazia no retorno. - Responsavel: PROTOCOLO
[x] Entregar o `modo lista` da `ArenasView`, restaurar o scroll vertical mobile e preservar reorder em `Livre/Prioridades`, com expandir de todas as acoes por arena. - Responsavel: PROTOCOLO
[x] Lapidar a visualizacao compacta das arenas no mobile: card achatado, tipografia/icone ajustados, badge do ativo nos circulos e limpeza do modulo `Grupo`/copy publica residual. - Responsavel: PROTOCOLO

## 4. MATRIZ DE EXECUCAO (PENDENCIAS & PRIORIDADES)
### COMANDO (METAS IMEDIATAS & DONO)
[ ] Rodar o QA final da `Mentoria basica` em `2 contas`: convite, aceite, recusa, revogacao, refund, abertura da relacao, arena extra por `50 ouro` e campanha exclusiva por `100 ouro`, sem slots. - Responsavel: SENTINELA
[ ] Validar `Solicitacoes` no Social com amizade + vinculo no mesmo lugar, badge de relacao no card do amigo e notificacao/push coerentes no fluxo. - Responsavel: SENTINELA
[ ] Fechar a conta nova real restante: ramo `e-mail/Convite` e primeiro retorno `D2` sem ruido. - Responsavel: TRONO
[ ] Rodar a passada final de QA mobile em `Season`, `Genesis/Aurora` e hierarquia visual das vitrines para congelar o padrao. - Responsavel: SENTINELA

### TRONO (Governanca & Decisao)
[ ] Disparar os 5 primeiros Bilhetes Dourados.
[ ] Analisar dados reais de Ativacao, D2 e % de Ciclos para validar a entrada da Primeira Linhagem.

### PROTOCOLO (Integridade & Codigo)
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
- Data: 22/03/2026
- Atualizado por: GPT-5 Codex
- Resumo: O GLYPH segue em ALPHA na Fundacao (T1) e o fechamento de 22/03 consolidou a frente estrutural do produto: camada social convertida para Ouro direto sem slots, `Clã -> Grupo` puxado para o board oficial de arenas, `Tarefas do grupo` virando arenas reais e `ArenasView` ficando mais operacional com scroll mobile restaurado, modo lista e miniaturas compactas melhores. O foco seguinte ficou claro: QA real da mentoria em `2 contas`, validacao de `Solicitacoes`, prova real do ramo `e-mail/Convite`, GM Panel/e-mail e a ultima passada de polimento mobile/Season.
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
[ ] Mentoria basica ainda pede a rodada final em `2 contas`, com refund, arena extra `50 ouro`, campanha `100 ouro` e leitura da relacao no Social.
[ ] Conta nova real ainda pede fechamento do ramo `e-mail/Convite` e prova do primeiro retorno `D2`.
[ ] GM Panel ainda pede prova real de entrega de e-mail.
[ ] Acabamento final mobile ainda pede ultima passada em `Season`, `Genesis/Aurora`, pt-BR residual e hierarquia visual.
[ ] Economia social agora pede validacao em uso real para garantir que o modelo de Ouro direto segure sem reintroduzir slot ou micro-regra.

Legenda rapida:
- `[ ]` = pendente
- `[-]` = visto hoje / reaberto no QA / ainda em revisao
- `[x]` = concluido neste ciclo (ainda em vitrine de entrega)
- `[v]` = concluido e validado para historico
