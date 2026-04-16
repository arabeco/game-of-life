============================================================
           GLYPH: MASTER SYSTEM STATE (15/04/26)
============================================================
STATUS: [X] ALPHA  |  [ ] BETA  |  [ ] LIVE
FASE:   [X] FUNDACAO (T1) | [ ] CERCO | [ ] ASCENSAO
------------------------------------------------------------

## 1. FASE ATUAL: FUNDACAO (T1)
- Status: ALPHA operacional com trilha real de publicacao Android iniciada.
- Missao: sair do "app web forte" para "app Android publicavel" sem quebrar o produto vivo, fechando a v16 com loop principal mais legivel e mais vendavel.
- Trilha oficial: `T1 Fundacao -> T2 O Cerco -> T3 A Ascensao`.

## 2. SCORECARD DE AUDITORIA
- **EXECUCAO REAL: 9.9** (`build` ok, shell Android validado em aparelho real, `AAB` assinado gerado e trilha v16 pronta para sync/bundle).
- **ID VISUAL: 9.8** (`Mundo`, `Forja`, `Relatorios`, overlays de primeira vez e modais centrais ficaram mais coerentes com o padrao luxe atual).
- **FLUXO USUARIO: 9.9** (`Oraculo`, `Social`, `Fragmentos`, `Ciclo` e `Relatorio` estao mais legiveis; o produto parece menos bagunca e mais sistema).
- **RETENCAO: --** (Aguardando Beta)
- **AQUISICAO: --** (Dominio quase pronto; faltam `3 reels` para destravar a fila de `~75 posts`.)

## 3. ESTADO REAL HOJE
### FECHADO [x]
[x] `Capacitor/Android`: shell Android criado, sincronizado e rodando em aparelho real. - Responsavel: SENTINELA
[x] `Play Console`: app `Glyph` criado e secao `Conteudo do app` preenchida (`Privacidade`, `Data Safety`, `Classificacao`, `Ads`, `Acesso`, `Exclusao`, etc.). - Responsavel: PROTOCOLO
[x] `Release Android`: `AAB` assinado de `release` gerado e uploadado no `Teste interno`. - Responsavel: SENTINELA
[x] `Teste interno`: trilha de publicacao Android saiu do "teorico" e ja entrou no Play Console de verdade. - Responsavel: SENTINELA + TRONO
[x] `Push Android`: camada nativa/local funcionando e trilha `FCM` preparada no backend. - Responsavel: PROTOCOLO
[x] `Billing Android`: plugin nativo, gate por plataforma e fluxo Google Play preparados no app. - Responsavel: TESOURO
[x] `Widgets futuros`: calculos de `Ciclo`, `Painel Diario`, `Oraculo` e `Acao ativa` extraidos para builders puros fora do JSX. - Responsavel: SENTINELA
[x] `Oraculo vNext (base)`: conversa, fazer e solicitacoes ficaram mais separados; sinais do Oraculo voltaram para o chat e o social saiu da casa errada. - Responsavel: PROTOCOLO
[x] `Mundo/Social`: DMs, cla, pessoas e solicitacoes foram reorganizados na camada social certa, com o Oraculo virando triagem e ponte. - Responsavel: PROTOCOLO
[x] `Fragmentos`: recompensa de ciclo agora entrega fragmentos junto do resto, e a `Forja` ganhou campanhas casuais e itens curados compraveis por fragmentos. - Responsavel: TESOURO
[x] `Onboarding contextual`: dicas de primeira vez foram expandidas para telas importantes, incluindo `Reports`, `Criar Arena` e `Criar Acao`. - Responsavel: SENTINELA

### TRAVAS ATUAIS [!]
[!] `Billing real` ainda nao fecha ponta a ponta porque falta reconciliacao do token de compra no backend. - Responsavel: TESOURO
[!] `Closed test`: a fase critica agora e montar e sustentar o teste fechado com `20 usuarios` por `12 dias`, com build estavel e resposta ao questionario do Google depois. - Responsavel: TRONO + DOMINIO
[!] `Apple/iOS`: a trilha inteira ainda esta por abrir (`Apple Developer`, `Xcode`, `StoreKit`, `APNs`, `Sign in with Apple`, `TestFlight`). - Responsavel: SENTINELA + PROTOCOLO

### OBSERVACOES [~]
[~] `Web publicado`: aparentemente saudavel apos o ultimo push; a rodada local grande da v16 esta pronta para sync, bundle e passada manual. - Responsavel: SENTINELA
[~] `localhost OAuth`: o login local pode cair em `app.glyph.life` se a URL de dev nao estiver na allowlist de redirect do Supabase; isso nao bloqueia a publicacao. - Responsavel: PROTOCOLO
[~] `Delete cycle`: a correcao voltou com confirmacao e limpeza mais completa, mas a validacao manual final ainda depende de teste real do usuario. - Responsavel: SENTINELA

## 4. ORDEM OPERACIONAL PARA PUBLICAR NO ANDROID
1. **Fechar produtos da loja no Play Console**
   - criar SKUs de ouro
   - criar `premium_30d`
   - criar `platinum_30d`
   - alinhar nomes, precos e tipo de produto
2. **Implementar reconciliacao backend do billing**
   - verificar compra Google Play no backend
   - tornar creditos idempotentes
   - creditar ouro / ativar premium so apos verificacao real
3. **Rodar compra Android de verdade**
   - testar ouro
   - testar premium
   - testar renovacao / expiracao / restauracao do estado
4. **Fechar a passada manual final no app real**
   - `Oraculo vNext`
   - `Mundo / Social`
   - `Forja / fragmentos`
   - `Campanhas`
   - `Mentoria`
   - `Parceria`
   - `Competicao`
   - `Planner`
   - `Ciclo`
   - `Relatorio`
   - push / e-mail do `GM Panel`
5. **Abrir e sustentar o closed test**
   - publicar versao na faixa fechada
   - colocar `20 usuarios` reais no teste
   - sustentar por `12 dias`
   - garantir feedback, estabilidade e retorno minimo durante a janela
6. **Solicitar acesso a producao**
   - responder o questionario do teste fechado
   - pedir liberacao de `Production`
   - so depois apertar a publicacao aberta
7. **Abrir a trilha Apple inteira**
   - pagar `Apple Developer Program`
   - criar app no `App Store Connect`
   - subir `Capacitor iOS` e abrir no `Xcode`
   - plugar `StoreKit`, `APNs`, `Sign in with Apple` e `TestFlight`

## 5. MATRIZ DE EXECUCAO
### BLOQUEIA PUBLICACAO ANDROID
[ ] Cadastro dos produtos reais no Play Console (`ouro`, `premium_30d`, `platinum_30d`). - Responsavel: TESOURO
[ ] `store-reconcile`: backend validar compra Google Play e creditar ouro/premium de forma idempotente. - Responsavel: TESOURO + PROTOCOLO
[ ] Validar compra Android ponta a ponta em aparelho real. - Responsavel: TESOURO
[ ] Fechar teste real de notificacao e e-mail do `GM Panel`. - Responsavel: PROTOCOLO
[ ] Fechar passada final de `Oraculo vNext`, `Mundo/Social`, `Forja`, `Campanhas`, `Mentoria`, `Parceria`, `Competicao`, `Planner`, `Ciclo` e `Relatorio` no app real. - Responsavel: SENTINELA + PROTOCOLO
[ ] Fechar `closed test` com `20 usuarios` por `12 dias` e build estavel na Play. - Responsavel: TRONO + DOMINIO
[ ] Responder o formulario do Google e pedir aprovacao de `Production`. - Responsavel: TRONO

### FORA DO HOT PATH IMEDIATO
[ ] `localhost` OAuth: adicionar todas as URLs de dev na allowlist do Supabase para o login local nao cair no host publico. - Responsavel: PROTOCOLO
[ ] pt-BR residual, parsing e robustez final do `Oraculo`. - Responsavel: PROTOCOLO
[ ] Fechar os `3 reels` restantes e alinhar landing/site antes de empurrar trafego. - Responsavel: DOMINIO
[ ] Widgets nativos: persistir snapshots em storage compartilhado e criar leitura nativa depois da loja. - Responsavel: SENTINELA
[ ] Apple/iOS: abrir a trilha inteira `Apple Developer + App Store Connect + Capacitor iOS + Xcode + StoreKit + APNs + Sign in with Apple + TestFlight`. - Responsavel: SENTINELA + PROTOCOLO

## 6. CORTE BETA 25
[ ] Android publicavel em closed test com `20` usuarios e versao instalada pela Play.
[ ] Billing Android reconciliado no backend para ouro e premium.
[ ] Push Android remoto real validado fora do app.
[ ] Passada final de `Oraculo`, `Mundo/Social`, `Forja`, `Campanhas`, `Mentoria`, `Parceria`, `Competicao`, `Planner`, `Ciclo` e `Relatorio`.
[ ] `GM Panel` com notificacao/e-mail testados de verdade.
[ ] Ultimo pacote de mobile/skins/responsividade fechado.

## 7. DEPOIS DO ANDROID (APPLE)
[ ] Pagar `Apple Developer Program`.
[ ] Criar app no `App Store Connect`.
[ ] Rodar `npx cap add ios` se o shell ainda nao existir e abrir no `Xcode`.
[ ] Configurar certificados, provisioning e assinatura.
[ ] Ajustar capacidades nativas e permissoes de iOS no projeto.
[ ] Plugar `StoreKit` na mesma `BillingCheckoutGate`.
[ ] Plugar `APNs`/Firebase no push iOS.
[ ] Fechar `Sign in with Apple`.
[ ] Validar login, push, billing e restore purchase no aparelho real.
[ ] Subir `TestFlight`.
[ ] Preparar metadados, privacidade e submissao da App Store.

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
- Data: 15/04/2026
- Atualizado por: GPT-5 Codex
- Resumo: o GLYPH continua em ALPHA na Fundacao (T1), mas o foco imediato agora e Google Play de verdade. O teste interno ja existe, a v16 esta pronta para sync/bundle e a superficie do produto ficou mais coerente (`Oraculo`, `Mundo`, `Forja`, `Relatorio`, onboarding contextual). O gargalo principal deixou de ser "empacotar" e virou "atravessar publicacao Android": fechar SKUs e billing reconciliado, rodar compra real, sustentar o `closed test` com `20 usuarios` por `12 dias` e pedir aprovacao de producao. Depois disso, a trilha Apple segue inteira por fazer.

## 11. MODO DE USO DO RELATORIO
1. Ler `relatorio.md`, `status.md`, `roadmap-soberania.md` e `progresso.md` antes de mexer no estado do projeto.
2. O item `3` mostra o estado real atual; o item `4` mostra a ordem pratica para publicar.
3. O item `5` e a leitura operacional de bloqueios; o item `6` e o corte minimo para abrir beta/publicacao Android.
4. O que entrar como fechado e estavel deve migrar depois para `progresso.md`.

