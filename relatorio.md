============================================================
           GLYPH: MASTER SYSTEM STATE (30/03/26)
============================================================
STATUS: [X] ALPHA  |  [ ] BETA  |  [ ] LIVE
FASE:   [X] FUNDACAO (T1) | [ ] CERCO | [ ] ASCENSAO
------------------------------------------------------------

## 1. FASE ATUAL: FUNDACAO (T1)
- Status: ALPHA
- Missao: provar onboarding, loop diario, retorno D2 e conclusao de ciclos reais.
- Trilha oficial: `T1 Fundacao -> T2 O Cerco -> T3 A Ascensao`.

## 2. SCORECARD DE AUDITORIA
- **EXECUCAO REAL: 9.9** (`build` ok, camada social/campanhas refinada e SQL novo validado em teste real/laboratorio).
- **ID VISUAL: 9.8** (`Campanhas`, miniaturas e `Vinculos` ficaram mais coerentes e mais vendaveis).
- **FLUXO USUARIO: 9.9** (criacao de campanha, entrega de mentor, parceria live-read e competicao snapshot ficaram muito melhores; o que falta agora e a passada manual final em aparelho real).
- **RETENCAO: --** (Aguardando Beta)
- **AQUISICAO: --** (Dominio quase pronto; faltam `3 reels` para destravar a fila de `~75 posts`.)

## 3. ABA PRONTOS
### PRONTOS [v]
[v] Curadoria base de campanhas: preco, acoes, duracao, texto e campanha gratis inicial.
[v] Ouro social final de `Mentoria`, `Parceria`, `Competicao` e arena extra.
[v] Reconstrucao da `Central de Vinculos` e reorganizacao das superficies premium.
[v] Camada social compartilhada de base no remoto: `Grupo`, `Mentoria`, `Parceria` e `Competicao` funcionando no pacote antigo.
[v] PIX real do Mercado Pago ja validado ate credito de ouro.

### FEITOS HOJE [x]
[x] Refino do fluxo de `Campanhas`: criar campanha sem gambiarra de arrastar arena, comprar, instalar e anexar arenas de forma mais clara.
[x] Entrega do mentor para o pupilo agora entra no app de forma mais direta, com painel de campanhas mais limpo e origem melhor distinguida.
[x] `Parceria` foi reescrita para `arena existente em live-read`, com retirada da vitrine sem apagar a arena.
[x] `Competicao` foi reescrita para multiplos duelos `snapshot`, read-only, bonus de duelo no `Sitrep/Ciclo` e historico selado.
[x] SQL novo de `Parceria` + `Competicao` foi validado: competicao passou em cenario real; parceria passou em laboratorio com `rollback`.

### AINDA EM X ATE A PASSADA MANUAL DE AMANHA
[x] Rodar a leitura final no app real para `Campanhas`, `Mentoria`, `Parceria` e `Competicao`, e so depois mover esses itens para `progresso.md`.

## 4. MATRIZ DE EXECUCAO
### CHECK FINAL ABSOLUTO (BLOQUEIA O BETA)
[-] Hot path real: loop principal e maior parte do QA manual ja passaram; falta fechar a rodada final em aparelho real com acabamento mobile. - Responsavel: SENTINELA
[-] Onboarding final: tutoriais `1/2`, toggle `Modo Jogo`, cards `3/4` e passada visual real. - Responsavel: SENTINELA
[ ] Persistencia: troca de dia, reabertura, cronometro, temporada, modais e rituais. - Responsavel: SENTINELA
[ ] Mobile final: `Ativos`, `Arenas`, `Planner`, `Mundo`, `Config`, modais e scroll. - Responsavel: SENTINELA
[ ] Skins UI: contraste final, planner, patentes e modais em claro/escuro. - Responsavel: SENTINELA
[ ] Leitor paginado: swipe, setas, preview e `[[page]]` no mobile. - Responsavel: SENTINELA
[ ] GM Panel: teste real de e-mail. - Responsavel: PROTOCOLO
[-] Mentoria 2 contas: aceite, arena em leitura e base do fluxo ja passaram em smoke; entrega automatica de campanha foi ajustada hoje. Faltam recusa, revogacao, refund e pacote final. - Responsavel: SENTINELA
[-] Social integrado: solicitacoes, amizade, `Vinculos`, `Grupo`, `Equipe`, badges/push e leitura final dos chips. A camada ficou mais redonda hoje; falta a rodada final integrada. - Responsavel: PROTOCOLO
[-] Camada compartilhada: `Grupo` e `Mentoria` ja estavam validados; `Parceria` e `Competicao` foram refinadas hoje com SQL testado. Falta a passada manual final no board/app real. - Responsavel: PROTOCOLO
[-] Campanhas: descobrir, comprar, instalar, receber do mentor e operar sem duplicar nada. O fluxo melhorou muito hoje; falta a rodada manual ponta a ponta. - Responsavel: PROTOCOLO
[ ] Economia de campanhas: custo, `Gratis/Premium`, premio de onboarding e retorno de compra. - Responsavel: TESOURO
[ ] Recarga de Ouro: vitrine, pagamento, credito e retorno ao fluxo. - Responsavel: TESOURO
[-] PIX final: o PIX real ja foi validado; falta a passada final integrada com recarga, carteira e retorno ao fluxo. - Responsavel: TESOURO
[ ] Premium remoto: expiracao/renovacao em `2 aparelhos`. - Responsavel: PROTOCOLO
[ ] Economia premium: comprar, renovar, recompensar e cair no modal certo. - Responsavel: TESOURO
[ ] `Modo Jogo` final: liga/desliga, some/aparece, inventario, baus e feitos. - Responsavel: PROTOCOLO

### COMANDO
[-] Rodar o `CHECK FINAL` em aparelho real e congelar o hot path do Beta `25`. - Responsavel: SENTINELA
[-] Fazer a passada manual final de `Campanhas`, `Mentoria`, `Parceria` e `Competicao` amanha e mover os `[x]` para `[v]`. - Responsavel: SENTINELA + PROTOCOLO
[ ] Fechar a passada final mobile em `Season`, `Genesis/Aurora` e vitrines. - Responsavel: SENTINELA

### TRONO
[ ] Ler Ativacao, D2 e % de Ciclos reais.

### PROTOCOLO
[ ] Concluir a passada final de pt-BR residual. - Responsavel: PROTOCOLO
[ ] Melhorar o Oraculo e o parsing de acao para funcionar com robustez e acionar tools corretamente. - Responsavel: PROTOCOLO

### DOMINIO (FORA DO HOT PATH)
[ ] Fechar os `3 reels` restantes e alinhar landing/site antes de empurrar trafego. Dominio e material-base ja foram enviados; com isso a fila prevista sobe para `~75 posts`.
[ ] Gerar o pacote das `10 skins` novas e completar os itens faltantes da `Season Aurora` (`glifo` e `orbe`; `skin`, `borda`, `banner` e `insignia` ja existem). - Responsavel: DOMINIO + TESOURO
[ ] Lista curta de arte/catalogo pendente:
- `Aurora I`: criar `glifo` e `orbe` para fechar o set principal da season.
- `Empreendedor`: skin cadastrada, mas ainda sem PNG final no catalogo.
- `Fenix Dourada`: aura exclusiva ainda sem arte dedicada no catalogo.
- `Insignias`: seguem sem PNG proprio; hoje funcionam como honras com icone/rotulo.
- `O Criador`: skin ja tem asset, mas ainda pede fonte/regra final de obtencao no jogo.

## 5. CORTE BETA 25 (O QUE FALTA PARA ABRIR LOGO)
[ ] Rodada manual final em aparelho real do hot path completo.
[ ] Fechar persistencia critica (`troca de dia`, `reabertura`, `cronometro`, `temporada`, modais/rituais).
[ ] Fechar a passada final de `Campanhas`, `Mentoria`, `Parceria` e `Competicao` no app real.
[ ] Fechar `PIX/Ouro` integrado no fluxo final da carteira.
[ ] Validar `Premium remoto` em `2 aparelhos`.
[ ] Fechar `mobile/skins` e o ultimo pacote de responsividade/contraste.
[ ] Rodar teste real de e-mail do `GM Panel`.

## 6. CORTE BETA 50 (LOGO DEPOIS DO 25)
[ ] Tirar os numeros reais de `Ativacao`, `D2` e `% de Ciclos`.
[ ] Fechar `marco1_beta_tracking` em `100%` e ler friccao real `P0/P1`.
[ ] Reduzir as ultimas friccoes mobile vistas no uso real de `25 pessoas`.
[ ] Fechar `pt-BR` residual e robustez do `Oraculo`.
[ ] Alinhar `landing/site` e publicar os `3 reels` restantes para liberar a fila de `~75 posts`.
[ ] Completar o pacote de conteudo/skins da `Season Aurora` e o resto do catalogo curto.

## 7. MARCO 1: PROVA (DEZ/2026)
- Objetivo: sair do estado de projeto e provar produto com retencao real.
- Meta de gloria: `1.000 usuarios ativos`.
- Submarcos:
  - `T1 Fundacao (mar -> mai)` = onboarding, loop diario e primeiro retorno.
  - `T2 O Cerco (jun -> ago)` = publicar nas stores e atrair `300 usuarios externos`.
  - `T3 A Ascensao (set -> dez)` = escalar e cravar `1.000 usuarios ativos`.
- Metricas de passagem do T1:
  - `60%+` criam `1 arena + 1 acao + 1 tarefa`
  - `30%+` retornam no `D2`
  - `20%+` fecham `1 ciclo`

## 8. STATS PRA FICAR DE OLHO
[ ] Ativacao onboarding: 0/60%
[ ] Retorno D2: 0/30%
[ ] Fechamento 1 ciclo: 0/20%
[ ] Usuarios ativos T1: 0/50
[ ] Usuarios ativos Beta inicial: 0/25
[ ] Cobertura `marco1_beta_tracking`: 0/100%
[ ] Friccao mobile critica (P0/P1): 0/0

## 9. RESUMO ATUALIZADO
- Data: 30/03/2026
- Atualizado por: GPT-5 Codex
- Resumo: o GLYPH segue em ALPHA na Fundacao (T1), mas o tabuleiro esta bem mais limpo do que antes. Hoje fechamos o grosso de `Campanhas`, `Parceria` e `Competicao` no codigo e no SQL, com validacao real/laboratorio. O que ainda segura o Beta `25` nao e mais invencao de produto; agora e rodada manual final em aparelho real, persistencia critica, `PIX/Ouro` integrado, `Premium` remoto, polimento final mobile/skins e teste real de e-mail do `GM Panel`. Depois disso, o corte para `50 pessoas` vira leitura de dados reais, tracking completo, reducao de friccao, conteudo/landing e robustez final de linguagem/Oraculo.

## 10. MODO DE USO DO RELATORIO
1. Ler `relatorio.md`, `status.md`, `roadmap-soberania.md` e `progresso.md` antes de mexer no estado do projeto.
2. No item 3 e no item 4:
   - `[v]` = pronto consolidado / ja pode morar no historico
   - `[x]` = feito hoje / aguarda passada manual ou consolidacao
   - `[-]` = visto hoje / em revisao / falta ultima rodada
   - `[ ]` = pendente real
3. Quando um bloco em `[x]` fechar de verdade, mover para `progresso.md`.
4. Nao inventar avancos: so marcar o que foi validado no app, na infra ou no SQL.

## 11. BLOQUEIOS ATUAIS
[-] Onboarding/tutorial ja passou no smoke principal, mas ainda pede a passada final em aparelho real.
[ ] Persistencia ainda pede fechamento ponta a ponta.
[-] `Campanhas`, `Parceria` e `Competicao` ficaram redondas hoje, mas ainda pedem a rodada manual final no app real.
[ ] Premium ainda pede QA remoto final em `2 aparelhos`.
[-] PIX/Ouro ja passou na base real, mas ainda pede a passada final integrada.
[ ] Mobile/skins ainda pedem a ultima rodada de contraste e responsividade.
[ ] GM Panel ainda pede o teste real de e-mail.
[ ] Dominio/conteudo ja enviou quase tudo; faltam `3 reels` para destravar a fila de `~75 posts`.
