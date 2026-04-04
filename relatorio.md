============================================================
           GLYPH: MASTER SYSTEM STATE (04/04/26)
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
- Consolidados movidos para `progresso.md`.

### FEITOS HOJE [x]
[x] Planner blindado: o pool/bay area nao reaproveita mais task antiga julgada; ciclo novo reseta estoque pela janela do ciclo e, sem ciclo ativo, o planner fica preso ao dia operacional visivel. - Responsavel: SENTINELA
[x] Base mobile preparada: runtime `web` vs `native` separado para iniciar `Capacitor` sem vazar `service worker` e `install prompt` no shell nativo. - Responsavel: SENTINELA
[x] Trilha de publicacao documentada: `Data Safety`, `App Privacy`, `Play Console`, `widgets` futuros e semana `1` de `Capacitor/Android` consolidados em `.md`. - Responsavel: PROTOCOLO

## 4. MATRIZ DE EXECUCAO
### BLOQUEIA O BETA 25
[ ] `GM Panel`: teste real de notificacao e e-mail. - Responsavel: PROTOCOLO
[ ] `Campanhas` + `Vinculos` + camada compartilhada: deletar arenas e campanhas. - Responsavel: SENTINELA + PROTOCOLO
[-] `PIX/Ouro`. - Responsavel: TESOURO
[-] Economia premium: comprar, renovar, expiracao, recompensar e cair no modal certo. - Responsavel: TESOURO

### FORA DO HOT PATH
[ ] pt-BR residual e robustez final do `Oraculo`. - Responsavel: PROTOCOLO
[ ] Fechar os `3 reels` restantes e alinhar landing/site antes de empurrar trafego. - Responsavel: DOMINIO
[ ] Executar a `Semana 1` de `Capacitor/Android shell` e provar o app local fora da web. - Responsavel: SENTINELA + PROTOCOLO

## 5. CORTE BETA 25 (O QUE FALTA PARA ABRIR LOGO)
[ ] Fechar a passada final de `Campanhas`, `Mentoria`, `Parceria` e `Competicao` no app real.
[ ] Fechar `PIX/Ouro` integrado no fluxo final da carteira.
[ ] Validar `Premium remoto` em `2 aparelhos`.
[ ] Validar notificacoes push, cards do `Oraculo` e e-mails.
[ ] Fechar `mobile/skins` e o ultimo pacote de responsividade/contraste.

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
- Data: 04/04/2026
- Atualizado por: GPT-5 Codex
- Resumo: o GLYPH segue em ALPHA na Fundacao (T1). Hoje o miolo tecnico ficou mais robusto: o `Planner` parou de vazar task antiga julgada para o pool, o fallback sem ciclo foi endurecido para o dia operacional visivel, e a frente mobile/compliance ganhou trilha executavel de `Capacitor`, `Play Console`, `Data Safety`, `App Privacy` e widgets futuros. O que ainda segura o Beta `25` continua sendo o mesmo nucleo: passada final de `Campanhas`/`Vinculos`, `PIX/Ouro`, `Premium remoto`, notificacoes/e-mails e o ultimo polimento de mobile/skins.

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
