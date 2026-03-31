============================================================
           GLYPH: MASTER SYSTEM STATE (31/03/26)
============================================================
STATUS: [X] ALPHA  |  [ ] BETA  |  [ ] LIVE
FASE:   [X] FUNDACAO (T1) | [ ] CERCO | [ ] ASCENSAO
------------------------------------------------------------

## 1. FASE ATUAL: FUNDACAO (T1)
- Status: ALPHA
- Missao: provar onboarding, loop diario, retorno D2 e conclusao de ciclos reais.
- Trilha oficial: `T1 Fundacao -> T2 O Cerco -> T3 A Ascensao`.

## 2. SCORECARD DE AUDITORIA
- **EXECUCAO REAL: 9.9** (`build` ok, SQL novo validado em teste real e push remoto funcionando em producao).
- **ID VISUAL: 9.8** (`Campanhas`, miniaturas, `Vinculos` e a leitura das notificacoes ficaram mais coerentes).
- **FLUXO USUARIO: 9.9** (`Campanhas`, `Mentoria`, `Parceria`, `Competicao` e DM push ficaram muito mais claros; falta a passada manual final no aparelho real).
- **RETENCAO: --** (Aguardando Beta)
- **AQUISICAO: --** (Dominio quase pronto; faltam `3 reels` para destravar a fila de `~75 posts`.)

## 3. ABA PRONTOS
### PRONTOS [v]
[v] Curadoria base de campanhas: preco, acoes, duracao, texto e campanha gratis inicial.
[v] Ouro social final de `Mentoria`, `Parceria`, `Competicao` e arena extra.
[v] Reconstrucao da `Central de Vinculos` e reorganizacao das superficies premium.
[v] PIX real do Mercado Pago validado ate credito de ouro.
[v] Push remoto fora do app selado em producao: notificacao normal, card do `Oraculo`, lembrete de `acao` e DM com preferencia propria.
[v] Refino do fluxo de `Campanhas`: criar, comprar, instalar e anexar arenas sem gambiarra.
[v] Entrega do mentor para o pupilo ficou mais direta, com painel de campanhas e vinculos mais claro.
[v] `Parceria` foi reescrita para `arena existente em live-read`, com retirada da vitrine sem apagar a arena.
[v] `Competicao` foi reescrita para multiplos duelos `snapshot`, read-only, com bonus de duelo e historico selado.
[v] Loja no `Modo Basico` agora respeita o corte: sem `Itens` e sem `Forja`.
[v] `ArenasView` recebeu alivio de scroll/mobile, correcao de crash em runtime e leitura melhor com muitas arenas.
[v] Push de DM agora abre direto no `Oraculo`/conversa certa e ficou com copy mais honesta para mensagens nao lidas.
[v] `GM Panel` foi separado da propaganda de `Premium` e ficou tratado como superficie interna de staff, sem misturar beneficio de soberano com poder de GM.

### FEITOS HOJE [x]
[x] `Planner` + `Painel Diario`: devolver uma acao para a Bay Area agora zera o contador corretamente quando ela deixa de estar planejada para hoje.
[x] `Ativos`: as molduras internas ficaram mais leves para revelar melhor a arte de fundo sem sacrificar a leitura de titulo, arenas e acoes.

### EM REVISAO [-]
[-] Rodada manual final no app real de `Campanhas`, `Mentoria`, `Parceria` e `Competicao`.
[-] Leitura final no aparelho real da camada social e das notificacoes fora do app.

## 4. MATRIZ DE EXECUCAO
### BLOQUEIA O BETA 25
[-] Hot path real: loop principal e onboarding principal ja passaram em smoke; falta a rodada final em aparelho real. - Responsavel: SENTINELA
[ ] Persistencia critica: troca de dia, reabertura, cronometro, temporada, modais e rituais. - Responsavel: SENTINELA
[ ] Mobile final: `Ativos`, `Arenas`, `Planner`, `Mundo`, `Config`, modais e scroll. - Responsavel: SENTINELA
[ ] Skins UI: contraste final, planner, patentes e modais em claro/escuro. - Responsavel: SENTINELA
[ ] Leitor paginado: swipe, setas, preview e `[[page]]` no mobile. - Responsavel: SENTINELA
[ ] `GM Panel`: teste real de e-mail. - Responsavel: PROTOCOLO
[-] `Campanhas` + `Vinculos` + camada compartilhada: o pacote novo esta muito melhor, mas falta a passada manual final no app real. - Responsavel: SENTINELA + PROTOCOLO
[-] `PIX/Ouro`: base real validada; falta a passada final integrada com carteira e retorno ao fluxo. - Responsavel: TESOURO
[ ] `Premium remoto`: expiracao/renovacao em `2 aparelhos`. - Responsavel: PROTOCOLO
[ ] Economia premium: comprar, renovar, recompensar e cair no modal certo. - Responsavel: TESOURO
[ ] `Modo Jogo` final: liga/desliga, some/aparece, inventario, baus e feitos. - Responsavel: PROTOCOLO

### FORA DO HOT PATH
[ ] pt-BR residual e robustez final do `Oraculo`. - Responsavel: PROTOCOLO
[ ] Fechar os `3 reels` restantes e alinhar landing/site antes de empurrar trafego. - Responsavel: DOMINIO
[ ] Completar `Season Aurora` e o catalogo curto que ainda pede arte. - Responsavel: DOMINIO + TESOURO

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
[ ] Fechar `pt-BR` residual e robustez final do `Oraculo`.
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
- Data: 31/03/2026
- Atualizado por: GPT-5 Codex
- Resumo: o GLYPH segue em ALPHA na Fundacao (T1), mas o tabuleiro continua ficando mais limpo. O pacote pesado de ontem subiu para `[v]`: campanhas, vinculos, `Parceria`, `Competicao`, DM push e a separacao entre `Premium` e `GM Panel`. Hoje fechamos dois ajustes importantes de robustez e leitura: o `Planner`/`Painel Diario` parou de contar acao fantasma devolvida para a Bay Area, e a tela `Ativos` abriu mais espaco para a arte sem perder legibilidade. O que segura o Beta `25` continua bem objetivo: rodada manual final no aparelho real, persistencia critica, `PIX/Ouro` integrado, `Premium` remoto, polimento mobile/skins e teste real de e-mail do `GM Panel`.

## 10. MODO DE USO DO RELATORIO
1. Ler `relatorio.md`, `status.md`, `roadmap-soberania.md` e `progresso.md` antes de mexer no estado do projeto.
2. No item `3` e no item `4`:
   - `[v]` = pronto consolidado / ja pode morar no historico
   - `[x]` = feito hoje / aguarda passada manual ou consolidacao
   - `[-]` = visto hoje / em revisao / falta ultima rodada
   - `[ ]` = pendente real
3. Itens em `[v]` tambem devem entrar em `progresso.md`.
4. O que foi `x` em dia anterior nao deve ficar zumbi no relatorio: ou vira `[v]`, ou desce para `[-]`, ou volta para `[ ]`.
5. Nao repetir o mesmo item em `Feitos Hoje`, `Matriz`, `Corte Beta 25` e backlog. O item `4` e a leitura operacional; o item `5` e o corte de liberacao.
