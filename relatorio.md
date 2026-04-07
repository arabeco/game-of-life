============================================================
           GLYPH: MASTER SYSTEM STATE (05/04/26)
============================================================
STATUS: [X] ALPHA  |  [ ] BETA  |  [ ] LIVE
FASE:   [X] FUNDACAO (T1) | [ ] CERCO | [ ] ASCENSAO
------------------------------------------------------------

## 1. FASE ATUAL: FUNDACAO (T1)
- Status: ALPHA operacional com trilha real de publicacao Android iniciada.
- Missao: sair do "app web forte" para "app Android publicavel" sem quebrar o produto vivo.
- Trilha oficial: `T1 Fundacao -> T2 O Cerco -> T3 A Ascensao`.

## 2. SCORECARD DE AUDITORIA
- **EXECUCAO REAL: 9.9** (`build` ok, shell Android validado em aparelho real, `AAB` assinado gerado e upload interno iniciado no Play Console).
- **ID VISUAL: 9.8** (`Campanhas`, miniaturas, `Vinculos`, abertura de video e estados mobile mais coerentes).
- **FLUXO USUARIO: 9.9** (`Planner`, push, login nativo, billing Android e leitura do `Oraculo` estao muito mais perto de app de verdade).
- **RETENCAO: --** (Aguardando Beta)
- **AQUISICAO: --** (Dominio quase pronto; faltam `3 reels` para destravar a fila de `~75 posts`.)

## 3. ESTADO REAL HOJE
### FECHADO [x]
[x] `Capacitor/Android`: shell Android criado, sincronizado e rodando em aparelho real. - Responsavel: SENTINELA
[x] `Play Console`: app `Glyph` criado e secao `Conteudo do app` preenchida (`Privacidade`, `Data Safety`, `Classificacao`, `Ads`, `Acesso`, `Exclusao`, etc.). - Responsavel: PROTOCOLO
[x] `Release Android`: `AAB` assinado de `release` gerado e uploadado no `Teste interno`. - Responsavel: SENTINELA
[x] `Push Android`: camada nativa/local funcionando e trilha `FCM` preparada no backend. - Responsavel: PROTOCOLO
[x] `Billing Android`: plugin nativo, gate por plataforma e fluxo Google Play preparados no app. - Responsavel: TESOURO
[x] `Widgets futuros`: calculos de `Ciclo`, `Painel Diario`, `Oraculo` e `Acao ativa` extraidos para builders puros fora do JSX. - Responsavel: SENTINELA

### TRAVAS ATUAIS [!]
[!] `Google Play` bloqueado por verificacao da conta de desenvolvedor (`identidade` + `endereco` + `dispositivo Android` + telefone depois). - Responsavel: TRONO
[!] `Billing real` ainda nao fecha ponta a ponta porque falta reconciliacao do token de compra no backend. - Responsavel: TESOURO
[!] `Closed test` da conta pessoal exige `12 testers` por `14 dias` antes do pedido de producao. - Responsavel: TRONO + DOMINIO

### OBSERVACOES [~]
[~] `Web publicado`: aparentemente saudavel apos o ultimo push. - Responsavel: SENTINELA
[~] `localhost OAuth`: o login local pode cair em `app.glyph.life` se a URL de dev nao estiver na allowlist de redirect do Supabase; isso nao bloqueia a publicacao. - Responsavel: PROTOCOLO

## 4. ORDEM OPERACIONAL PARA PUBLICAR NO ANDROID
1. **Destravar a conta Play**
   - concluir verificacao de identidade
   - alinhar endereco real/documentavel no perfil
   - validar acesso a aparelho Android
   - liberar telefone quando o Google pedir
2. **Fechar produtos da loja no Play Console**
   - criar SKUs de ouro
   - criar `premium_30d`
   - criar `platinum_30d`
   - alinhar nomes, precos e tipo de produto
3. **Implementar reconciliacao backend do billing**
   - verificar compra Google Play no backend
   - tornar creditos idempotentes
   - creditar ouro / ativar premium so apos verificacao real
4. **Rodar compra Android de verdade**
   - testar ouro
   - testar premium
   - testar renovacao / expiracao / restauracao do estado
5. **Fechar a passada manual final no app real**
   - `Campanhas`
   - `Mentoria`
   - `Parceria`
   - `Competicao`
   - `Planner`
   - `Ciclo`
   - `Oraculo`
   - push / e-mail do `GM Panel`
6. **Abrir e sustentar o closed test**
   - publicar versao na faixa fechada
   - por `12+` testers
   - manter por `14 dias`
7. **Solicitar acesso a producao**
   - responder o questionario do teste fechado
   - pedir liberacao de `Production`
   - so depois apertar a publicacao aberta

## 5. MATRIZ DE EXECUCAO
### BLOQUEIA PUBLICACAO ANDROID
[ ] Verificacao completa da conta Play (`identidade`, `endereco`, `device`, telefone). - Responsavel: TRONO
[ ] Cadastro dos produtos reais no Play Console (`ouro`, `premium_30d`, `platinum_30d`). - Responsavel: TESOURO
[ ] `store-reconcile`: backend validar compra Google Play e creditar ouro/premium de forma idempotente. - Responsavel: TESOURO + PROTOCOLO
[ ] Validar compra Android ponta a ponta em aparelho real. - Responsavel: TESOURO
[ ] Fechar teste real de notificacao e e-mail do `GM Panel`. - Responsavel: PROTOCOLO
[ ] Fechar passada final de `Campanhas`, `Mentoria`, `Parceria`, `Competicao`, `Planner`, `Ciclo` e `Oraculo` no app real. - Responsavel: SENTINELA + PROTOCOLO
[ ] Abrir `closed test` com `12 testers` por `14 dias`. - Responsavel: TRONO + DOMINIO

### FORA DO HOT PATH IMEDIATO
[ ] `localhost` OAuth: adicionar todas as URLs de dev na allowlist do Supabase para o login local nao cair no host publico. - Responsavel: PROTOCOLO
[ ] pt-BR residual e robustez final do `Oraculo`. - Responsavel: PROTOCOLO
[ ] Fechar os `3 reels` restantes e alinhar landing/site antes de empurrar trafego. - Responsavel: DOMINIO
[ ] Widgets nativos: persistir snapshots em storage compartilhado e criar leitura nativa depois da loja. - Responsavel: SENTINELA
[ ] Apple/iOS: abrir trilha `Capacitor iOS + Xcode + StoreKit + APNs + Sign in with Apple` quando houver conta paga e Mac disponivel. - Responsavel: SENTINELA + PROTOCOLO

## 6. CORTE BETA 25
[ ] Android publicavel em closed test com `12` testers e versao instalada pela Play.
[ ] Billing Android reconciliado no backend para ouro e premium.
[ ] Push Android remoto real validado fora do app.
[ ] Passada final de `Campanhas`, `Mentoria`, `Parceria`, `Competicao`, `Planner`, `Ciclo` e `Oraculo`.
[ ] `GM Panel` com notificacao/e-mail testados de verdade.
[ ] Ultimo pacote de mobile/skins/responsividade fechado.

## 7. DEPOIS DO ANDROID (APPLE)
[ ] Pagar `Apple Developer Program`.
[ ] Criar app no `App Store Connect`.
[ ] `npx cap add ios` e abrir no `Xcode`.
[ ] Plugar `StoreKit` na mesma `BillingCheckoutGate`.
[ ] Plugar `APNs`/Firebase no push iOS.
[ ] Fechar `Sign in with Apple`.
[ ] Subir `TestFlight`.

## 8. MARCO 1: PROVA (DEZ/2026)
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

## 9. STATS PRA FICAR DE OLHO
[ ] Ativacao onboarding: 0/60%
[ ] Retorno D2: 0/30%
[ ] Fechamento 1 ciclo: 0/20%
[ ] Usuarios ativos T1: 0/50
[ ] Usuarios ativos Beta inicial: 0/25
[ ] Cobertura `marco1_beta_tracking`: 0/100%
[ ] Friccao mobile critica (P0/P1): 0/0

## 10. RESUMO ATUALIZADO
- Data: 05/04/2026
- Atualizado por: GPT-5 Codex
- Resumo: o GLYPH continua em ALPHA na Fundacao (T1), mas agora a trilha Android deixou de ser teorica. O shell nativo rodou em aparelho real, o `AAB` de `release` foi gerado e uploadado no `Teste interno`, o `Play Console` ja esta com o `Conteudo do app` preenchido, e push/billing Android ficaram com cara de app nativo. O gargalo principal nao e mais "conseguir empacotar"; e sim fechar a burocracia do Google Play, cadastrar os produtos da loja, implementar a reconciliacao backend das compras e atravessar o `closed test` obrigatorio de `12 testers / 14 dias`. Depois disso, a publicacao Android vira trilho plausivel; Apple fica logo na sequencia, mas nao e o bloqueio numero um de agora.

## 11. MODO DE USO DO RELATORIO
1. Ler `relatorio.md`, `status.md`, `roadmap-soberania.md` e `progresso.md` antes de mexer no estado do projeto.
2. O item `3` mostra o estado real atual; o item `4` mostra a ordem pratica para publicar.
3. O item `5` e a leitura operacional de bloqueios; o item `6` e o corte minimo para abrir beta/publicacao Android.
4. O que entrar como fechado e estavel deve migrar depois para `progresso.md`.
