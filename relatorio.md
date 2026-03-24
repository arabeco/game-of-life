============================================================
           GLYPH: MASTER SYSTEM STATE (24/03/26)
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
- **EXECUCAO REAL: 9.8** (Build/Type-check ok. `Campanhas`, `Premium` e o ritual de recompensa foram religados sem quebrar o core).
- **ID VISUAL: 9.7** (A UI ficou mais coerente: `Vinculos` no `Social`, `Campanhas` mais visiveis e `Premium` finalmente no trilho de assinatura real).
- **FLUXO USUARIO: 9.8** (A descoberta de campanhas melhorou, o `Premium` ganhou validade real de 30 dias e o modal de renovacao entrou no mesmo padrao da `Vanguarda`. Pendente: QA real de onboarding, `e-mail/Convite`, D2 e renovacao remota).
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
[x] Reorganizar a arquitetura interna das superficies premium: `Campanhas` com acesso principal em `Arenas`, `Vinculos` com botao/modal proprio no `Social` e aba `Premium` reduzida para status, beneficios e renovacao. - Responsavel: PROTOCOLO
[x] Refatorar a loja/catalogo de `Campanhas`: grid compacto mobile, separacao `Gratis/Premium`, filtros por ativo/tipo/tema, primeiras microaulas de `Aprendizado` via `Anotacao` e seed de campanhas gratis base. - Responsavel: PROTOCOLO
[x] Implementar assinatura `Premium` real de `30 dias`, com expiracao persistida no perfil, renovacao acumulando validade, modal de recompensa no padrao da `Vanguarda` e entrega real de bau/cosmeticos sazonais quando faltarem. - Responsavel: PROTOCOLO

## 4. MATRIZ DE EXECUCAO (PENDENCIAS & PRIORIDADES)
### CHECK FINAL ABSOLUTO (BLOQUEIA O BETA)
[ ] Fazer a checagem final absoluta do loop principal do app: login, termos, onboarding, criar `1 arena`, criar `1 acao`, iniciar `1 ciclo`, fechar `1 ciclo`, abrir `Historico` e retornar ao app sem travas nem telas mortas. - Responsavel: SENTINELA
[ ] Rodar QA completo do onboarding sem seletor inicial de modo: validar fim do onboarding, `Tutoriais` 1/2 no basico, ativacao de `Modo Jogo` em `Preferencias` e desbloqueio correto dos cards 3/4. - Responsavel: SENTINELA
[ ] Fazer a checagem final absoluta de retorno e persistencia: trocar o dia, reabrir o app, retomar cronometro/foco, ver transicao de `Temporada`, autoencerramento de ciclo e memoria de modais/rituais sem repetir ou quebrar entre aparelhos. - Responsavel: SENTINELA
[ ] Fazer a checagem final absoluta da navegacao mobile: `Ativos`, `Arenas`, `Planner`, `Mundo` e `Config`, com modais abrindo/fechando direito, `X` clicavel, scroll consistente e nenhum layout critico quebrando por modelo de celular. - Responsavel: SENTINELA
[ ] Fazer a checagem final absoluta das skins UI: contraste de texto, bordas, planner, patentes, modais de ativo e leitura em `modo claro/escuro` nas skins principais, fechando o ultimo refinamento visual sem deixar caso isolado passar. - Responsavel: SENTINELA
[ ] Rodar QA completo do novo leitor paginado de `Anotacao`: textos longos, swipe direita/esquerda, setas pequenas, preview no modal, separacao `[[page]]` e conforto real no mobile. - Responsavel: SENTINELA
[ ] Fechar a conta nova real restante: ramo `e-mail/Convite` e primeiro retorno `D2` sem ruido. - Responsavel: TRONO
[ ] Fechar o teste real de e-mail via GM Panel e isolar o erro exato se a entrega nao chegar. - Responsavel: PROTOCOLO
[ ] Rodar o QA final da `Mentoria basica` em `2 contas`: convite, aceite, recusa, revogacao, refund, abertura da relacao, arena extra por `50 ouro` e campanha exclusiva por `100 ouro`, sem slots. - Responsavel: SENTINELA
[ ] Validar `Solicitacoes` no Social com amizade + vinculo no mesmo lugar, badge de relacao no card do amigo e notificacao/push coerentes no fluxo. - Responsavel: SENTINELA
[ ] Fazer a checagem final absoluta da malha social: amizade, `Vinculos`, `Grupo`, convite, entrar/sair, criar grupo comum, criar `Equipe`, entrar em grupo social no basico e leitura coerente dos chips/tags em todos os cards. - Responsavel: PROTOCOLO
[ ] Fazer a checagem final absoluta da camada compartilhada: acao de grupo, arena compartilhada, fluxos de `Mentoria`, `Parceria` e `Competicao`, criacao, execucao, reflexo no board e leitura correta para os dois lados. - Responsavel: PROTOCOLO
[ ] Fazer a checagem final absoluta de `Campanhas`: descobrir, filtrar, abrir detalhe, comprar, instalar, operar arenas do pacote, navegar entre `Gratis/Premium` e confirmar que a campanha entra no lugar certo sem duplicar arena nem perder metadata. - Responsavel: PROTOCOLO
[ ] Fazer a checagem final absoluta da economia de campanhas: custo em `Ouro`, aba `Gratis/Premium`, install do pacote, premio de onboarding se existir, e retorno claro quando faltar saldo ou quando a compra der certo. - Responsavel: TESOURO
[ ] Fazer a revisao curatorial da vitrine de `Campanhas`: checar preco, numero de acoes, duracao e texto de cada campanha, e decidir/ligar o ganho de `1 campanha gratis` no onboarding para a primeira conta. - Responsavel: TESOURO
[ ] Fechar o pipeline de recarga de `Ouro`: vitrine, modo de pagamento, confirmacao, credito no saldo e retorno claro para a compra de premium/campanhas sem quebrar o fluxo. - Responsavel: TESOURO
[ ] Fazer a checagem final absoluta do `PIX` e da recarga de Ouro: gerar cobranca, pagar, confirmar, creditar saldo, refletir na carteira e voltar ao fluxo de compra sem ruido. - Responsavel: TESOURO
[ ] Aplicar no Supabase a migration da assinatura premium e validar em `2 aparelhos` a expiracao real, a renovacao acumulada e o modal de recompensa com os itens sazonais corretos. - Responsavel: PROTOCOLO
[ ] Fazer a checagem final absoluta da economia premium: comprar `Premium`, renovar antes de vencer, renovar vencido, receber recompensas reais, ganhar skin/borda/banner sazonal se ainda faltar e cair no modal certo em vez de toast seco. - Responsavel: TESOURO
[ ] Fazer a checagem final absoluta do `Modo Jogo`: ligar/desligar, ver o que some e o que continua, confirmar `quests`, `patentes`, `Hall`, `inventario`, `soberano` e `baus` no estado correto sem quebrar o core para quem fica no basico. - Responsavel: PROTOCOLO
[ ] Validar em uso real a leitura de Ouro direto da camada social (`Mentoria 100`, `Parceria 50`, `Competicao 50`, arena extra `50`) e garantir que nenhuma copy/regra de slot reapareca. - Responsavel: TESOURO

### COMANDO (METAS IMEDIATAS & DONO)
[ ] Executar o bloco `CHECK FINAL ABSOLUTO` acima em aparelho real e consolidar os achados para congelar o hot path do Beta. - Responsavel: SENTINELA
[ ] Rodar a passada final de QA mobile em `Season`, `Genesis/Aurora` e hierarquia visual das vitrines para congelar o padrao. - Responsavel: SENTINELA

### TRONO (Governanca & Decisao)
[ ] Disparar os 5 primeiros Bilhetes Dourados.
[ ] Analisar dados reais de Ativacao, D2 e % de Ciclos para validar a entrada da Primeira Linhagem.

### PROTOCOLO (Integridade & Codigo)
[ ] Fechar a convergencia final do `Modo Jogo`: empacotar o metajogo num toggle unico, esconder o que for pacote game e limpar os ramos legados `GAME/BASIC` que ainda sobraram no codigo. - Responsavel: PROTOCOLO
[ ] Fechar o teste real de e-mail via GM Panel e isolar o erro exato se a entrega nao chegar. - Responsavel: PROTOCOLO
[ ] Concluir a ultima passada de pt-BR residual e acabamento fino do cadastro manual apos o novo ritual de Termos pos-login. - Responsavel: PROTOCOLO

### DOMINIO (FORA DO HOT PATH)
[ ] Criar e publicar videos curtos/Reels dos fluxos principais, usando isso para apresentar os 5 primeiros acessos e abrir a narrativa publica do GLYPH.
[ ] Fazer uma vistoria do site/landing para alinhar copy, fluxo e apresentacao publica antes de empurrar mais trafego.

### TESOURO (Produto & Economia)
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
- Data: 24/03/2026
- Atualizado por: GPT-5 Codex
- Resumo: O GLYPH segue em ALPHA na Fundacao (T1) e o fechamento de 24/03 empurrou tres frentes importantes: `Campanhas` e `Vinculos` foram realocados para casas mais naturais da navegacao, a loja/catalogo de campanhas ganhou uma estrutura melhor para descoberta com campanhas gratis base e microaulas de `Aprendizado`, e o `Premium` saiu do estado de booleano solto para virar uma assinatura real de `30 dias`, com renovacao acumulada, recompensa concreta e modal no padrao da `Vanguarda`. O foco seguinte ficou claro: QA forte do leitor paginado, revisao curatorial de precos/textos/acoes das campanhas, apply da migration premium no Supabase, pipeline de recarga de Ouro e a ultima rodada de QA real do onboarding/mentoria.
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
[ ] A assinatura premium agora pede apply da migration no Supabase e QA remoto para validar expirar, renovar e receber as recompensas certas entre aparelhos.
[ ] A nova vitrine de `Campanhas` ainda pede uma rodada curatorial de preco, quantidade de acoes, textos e gatilho de uma campanha gratis no onboarding.
[ ] O acabamento visual agora pede uma checagem final absoluta das skins UI em claro/escuro para fechar contraste, planner, patentes e modais sem deixar excecao viva.

Legenda rapida:
- `[ ]` = pendente
- `[-]` = visto hoje / reaberto no QA / ainda em revisao
- `[x]` = concluido neste ciclo (ainda em vitrine de entrega)
- `[v]` = concluido e validado para historico
