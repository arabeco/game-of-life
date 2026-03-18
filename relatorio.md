============================================================
           GLYPH: MASTER SYSTEM STATE (18/03/26)
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
- **EXECUCAO REAL: 9.5** (Build/Type-check/Encoding ok. Auth beta, Planner, tracking e Codex/Mentoria mais blindados).
- **ID VISUAL: 9.4** (Login, GM Board, Perfil e ecossistema de Codex mais coerentes no padrao luxe).
- **FLUXO USUARIO: 9.4** (Conta real Google/Bilhete, onboarding e exclusao validados. Planner/Rest/boot mobile mais refinados. Pendente: e-mail/Convite, D2 e publish do pacote).
- **RETENCAO: --** (Aguardando Beta)
- **AQUISICAO: --** (Aguardando Videos)

## 3. STATUS DE ENTREGA (CONCLUIDO NESTE CICLO)
[x] Entregar a primeira passagem da `Central de Vinculos` no padrao luxe, separando vinculo de arena vinculada e conectando custos, slots e Loja para Parceria, Competicao e Mentoria. - Responsavel: PROTOCOLO
[x] Estruturar o backend do novo pacote social: `relationship_link_arenas`, RPCs monetizadas com refund, limite de `2` Codex de mentoria e migration compatibilizada com banco legado. - Responsavel: PROTOCOLO
[x] Blindar o retorno do OAuth Google para nao cair de volta na LoginView: memoria curta de auth pendente, retry de sessao e boot mais estavel no primeiro retorno do provedor. - Responsavel: PROTOCOLO

## 4. MATRIZ DE EXECUCAO (PENDENCIAS & PRIORIDADES)
### COMANDO (METAS IMEDIATAS & DONO)
[-] Fechar a validacao de conta nova real restante: e-mail/Convite, aceite explicito de Termos no cadastro manual e primeiro retorno D2. - Responsavel: TRONO
[-] Publicar e validar em `app.glyph.life` o pacote atual de Login/Codex/Mentoria/Planner/Vinculos antes de abrir os primeiros Bilhetes. - Responsavel: PROTOCOLO
[ ] Rodar 3 contas reais de ensaio e registrar tempo, travas e duvidas do D0 ao primeiro retorno. - Responsavel: SENTINELA
[-] Rodar smoke real consolidado do pacote Loja/Codex/Mentoria/Vinculos/Planner/Rest no celular: compra, slots, parceria/competicao, envio mentor -> pupilo, forja por `300 ouro`, arena vinculada, bay global, duracao apos drop, drag noturno, retorno de background e fluxo de desbloqueio. - Responsavel: SENTINELA
[-] Fechar QA de campo/mobile do pacote Login -> Perfil -> Loja -> Codex -> Planner -> Customizacao e congelar o padrao visual. - Responsavel: SENTINELA

### TRONO (Governanca & Decisao)
[ ] Disparar os 5 primeiros Bilhetes Dourados.
[ ] Analisar dados reais de Ativacao, D2 e % de Ciclos para validar a entrada da Primeira Linhagem.

### PROTOCOLO (Integridade & Codigo)
[-] Validar em uso real se o novo `marco1_beta_tracking`/GM Panel esta lendo bem `ouro`, `prata`, `bronze` e o funil `60/30/20`.
[-] Revisar o cadastro manual para explicitar Termos/Privacidade antes da criacao da conta e concluir a ultima passada de pt-BR residual.
[-] Consertar a exibicao do PIX QR Code no fluxo de compra real da Loja. - Responsavel: PROTOCOLO
[-] Checar Notificacoes e e-mail ponta a ponta, incluindo convites e sinais do pacote social. - Responsavel: PROTOCOLO
[-] Ajustar o compartilhar imagem para nao tratar cancelamento como erro: toast de carregamento, cancelamento limpo e feedback correto ao usuario. - Responsavel: PROTOCOLO

### DOMINIO (Marketing & Presenca)
[ ] Criar e publicar videos curtos/Reels dos fluxos principais, usando isso para apresentar os 5 primeiros acessos e abrir a narrativa publica do GLYPH.
[ ] Fazer uma vistoria do site/landing para alinhar copy, fluxo e apresentacao publica antes de empurrar mais trafego.

### TESOURO (Produto & Economia)
[-] Fechar a segunda passada do pacote social: custos, permissoes e telas de Mentoria, Parceria e Competicao, com leitura clara do que e gratis, premium, pago e vinculado a arenas compartilhadas. - Responsavel: TESOURO
[ ] Validar com uso real se mentor Premium + forja de `300 ouro` sustenta bem a economia da mentoria e a leitura de valor de Ouro, Slots, Codex, cosmeticos e Vanguarda.

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
- Data: 18/03/2026
- Atualizado por: GPT-5 Codex
- Resumo: O GLYPH segue em ALPHA na Fundacao (T1) e o fechamento de hoje abriu um novo bloco concreto no pacote social: primeira passagem da Central de Vinculos no padrao luxe, separacao formal entre vinculo e arena vinculada, slots/custos na Loja e base de backend com RPCs, refunds, linked arenas e limite de `2` Codex de mentoria. O retorno do Google segue na vitrine de entrega e a matriz de execucao foi atualizada para refletir o que entrou no radar de QA de hoje: smoke real do pacote social no celular, PIX QR Code, notificacoes/e-mail e o cancelamento correto do compartilhamento de imagem. O foco imediato continua sendo publicar e validar esse pacote em uso real sem ruido.
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
[ ] Conta nova real: ainda falta fechar sem ruido o ramo e-mail/Convite, o aceite de Termos no cadastro manual e o primeiro retorno D2.
[ ] Pacote de hoje ainda pede publicacao e smoke real em `app.glyph.life` para Login/Codex/Mentoria/Planner/Vinculos.
[ ] Operacao solo: execucao, QA e revisao ainda concentrados em 1 pessoa.
[ ] Acabamento final: mobile, pt-BR residual, PIX QR, notificacoes/e-mail e o comportamento de retorno/background ainda pedem ultima passada.
[ ] Atritos de UX: compartilhamento de imagem ainda precisa diferenciar cancelamento do erro real.
[ ] Tese de valor: Loja, Codex, Mentoria e Vanguarda ainda sem validacao forte em beta real.

Legenda rapida:
- `[ ]` = pendente
- `[-]` = visto hoje / reaberto no QA / ainda em revisao
- `[x]` = concluido neste ciclo (ainda em vitrine de entrega)
- `[v]` = concluido e validado para historico
