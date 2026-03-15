============================================================
           GLYPH: MASTER SYSTEM STATE (15/03/26)
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
- **EXECUCAO REAL: 9.3** (Build/Type-check/Test ok. Core loop blindado. Baus/Catalogo coerentes).
- **ID VISUAL: 9.1** (Historico/Legado separados. Legado full-screen estruturado).
- **FLUXO USUARIO: 9.1** (Smoke verde em onboarding, Oraculo e exclusao. Pendente: QA real de conta nova e polimento final).
- **RETENCAO: --** (Aguardando Beta)
- **AQUISICAO: --** (Aguardando Videos)

## 3. STATUS DE ENTREGA (CONCLUIDO NESTE CICLO)
[x] Reestruturar o acesso do beta fechado: bloquear entrada sem conta, autenticar Google, pedir Bilhete Dourado em modal e liberar so apos validacao. - Responsavel: PROTOCOLO
[x] Ajustar o onboarding inicial para terminar na Rest Screen e apontar para `Configuracoes > Tutoriais`. - Responsavel: PROTOCOLO
[x] Corrigir o Oraculo em `app.glyph.life` com ajuste de CORS e deploy da Edge Function `oracle`. - Responsavel: PROTOCOLO
[x] Corrigir a exclusao de conta com `account-delete`, limpeza de sessao local e encerramento sem loop. - Responsavel: PROTOCOLO
[x] Remover o texto explicativo extra do cadeado no Painel Diario da Rest Screen. - Responsavel: PROTOCOLO
[x] Validar em smoke o pacote `onboarding -> Oraculo -> exclusao de conta` com resultado verde apos os fixes de auth, infra e sessao local. - Responsavel: PROTOCOLO

## 4. MATRIZ DE EXECUCAO (PENDENCIAS & PRIORIDADES)
### COMANDO (METAS IMEDIATAS & DONO)
[-] Validar conta nova real ponta a ponta: e-mail/Convite, Google/Bilhete, Termos, Modo, Onboarding, Rest e primeiro retorno. - Responsavel: TRONO
[-] Fazer varredura pt-BR/encoding residual e corrigir o checkbox de Termos no cadastro manual. - Responsavel: PROTOCOLO
[ ] Rodar 3 contas reais de ensaio e registrar tempo, travas e duvidas do D0 ao primeiro retorno. - Responsavel: SENTINELA
[ ] Montar uma estacao fixa de QA na sala: suporte de celular, carregador, luz estavel e planilha/bloco de friccao. - Responsavel: SENTINELA
[ ] Deixar um quadro visivel na sala com `60/30/20`, 5 Bilhetes enviados e os 3 bugs P0/P1 do dia. - Responsavel: TRONO
[ ] Fechar QA mobile do pacote Perfil -> Loja -> Customizacao e congelar o padrao visual. - Responsavel: SENTINELA
[ ] Revisar leitura de valor da Loja, Vanguarda e cosmeticos antes de expor isso com mais forca. - Responsavel: TESOURO

### TRONO (Governanca & Decisao)
[ ] Disparar os 5 primeiros Bilhetes Dourados.
[ ] Analisar dados reais de Ativacao, D2 e % de Ciclos.
[ ] Validar se o sistema sustenta a entrada da Primeira Linhagem.

### PROTOCOLO (Integridade & Codigo)
[-] Confirmar se `marco1_beta_tracking` e o GM Panel estao coerentes nas metas `60/30/20`.
[ ] Blindar fallback de backgrounds (`.png`/`.jpg`) e dependencia de arte faltante em cosmeticos.

### DOMINIO (Marketing & Presenca)
[ ] Gravar screen recordings dos fluxos principais e organizar a apresentacao dos 5 primeiros acessos.
[ ] Criar criativos de "Gatilho de Ordem" para midias sociais.

### SENTINELA (Friccao & QA de Campo)
[ ] Fechar QA manual em campo depois do smoke verde: Google/Bilhete, e-mail/Convite, onboarding, exclusao e retorno inicial no celular.
[ ] Validar no celular os modais reduzidos de Perfil, Vanguarda, Loja e Season.

### TESOURO (Produto & Economia)
[ ] Validar no mobile a leitura de valor de Ouro, Slots, Codex, cosmeticos e pacote Vanguarda.

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
- Data: 15/03/2026
- Atualizado por: GPT-5.4
- Resumo: O GLYPH segue em ALPHA na Fundacao (T1) e hoje fechou com smoke verde o pacote onboarding, Oraculo e exclusao de conta, consolidando o bloco mais critico de acesso beta e sessao local. O foco imediato agora e validar conta nova real sem ruido, limpar residuos pt-BR/encoding, alinhar o GM Panel e organizar o QA em campo/mobile.
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
[ ] Conta nova real: ainda falta validacao manual sem ruido em Google/Bilhete, e-mail/Convite e retorno D2.
[ ] Operacao solo: execucao, QA e revisao ainda concentrados em 1 pessoa.
[ ] Acabamento final: pt-BR, encoding residual e mobile ainda pedem ultima passada.
[ ] Tese de valor: Loja, Codex e Vanguarda ainda sem validacao forte em beta real.

Legenda rapida:
- `[ ]` = pendente
- `[-]` = visto hoje / reaberto no QA / ainda em revisao
- `[x]` = concluido neste ciclo (ainda em vitrine de entrega)
- `[v]` = concluido e validado para historico
