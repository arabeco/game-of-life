============================================================
           GLYPH: MASTER SYSTEM STATE (23/04/26)
============================================================
STATUS: [ ] ALPHA  |  [X] BETA FECHADO  |  [ ] LIVE
FASE:   [X] FUNDACAO (T1) | [ ] CERCO | [ ] ASCENSAO
------------------------------------------------------------

## 1. FASE ATUAL: FUNDACAO (T1)
- Status: Beta fechado ativo na Google Play, com usuarios reais instalando pela Play Store.
- Missao: atravessar os 14 dias de closed test sem quebrar quem esta usando, coletar feedback real e preparar um pedido de producao forte.
- Trilha oficial: `T1 Fundacao -> T2 O Cerco -> T3 A Ascensao`.
- Regra desta fase: patch pequeno, testavel e reversivel. Nada de refatoracao grande durante o beta sem bug real comprovado.

## 2. SCORECARD DE AUDITORIA
- **EXECUCAO REAL: 8.6** (`type-check` verde, core loop verde e app aceito em closed test; foco agora e proteger a versao em uso real).
- **ID VISUAL: 8.2** (identidade forte ja existe: skins, luxe, BASIC/GAME, Oraculo, Mundo, Planner e Relatorio; ainda ha mojibake residual e telas densas).
- **FLUXO USUARIO: 8.0** (login, beta gate, onboarding, ciclo, arena, acao, planner, rest screen e relatorio existem; agora o foco e blindar o trilho real dos testers).
- **RETENCAO: 8.4** (motor de retorno forte: ciclos, Sitrep, Oraculo, push, relatorio, legado, recompensas, social e campanhas; falta medir retencao real no closed test).
- **AQUISICAO: 8.0** (formularios do Google respondidos, prints reais ja existem e a narrativa publica esta pronta para sustentar o pedido de producao).

## 3. ESTADO REAL HOJE
### FECHADO [x]
[x] `Google Play`: closed test ativo e aceito pela Play Console. - Responsavel: TRONO + DOMINIO
[x] `Android SDK`: projeto alinhado com `targetSdkVersion 36`. - Responsavel: SENTINELA
[x] `Release atual`: `versionCode 26`, `versionName 1.0.26`. - Responsavel: SENTINELA
[x] `Vercel/web`: app publicado e funcional fora do Android. - Responsavel: SENTINELA
[x] `Type-check`: `npm run type-check` verde apos limpeza conservadora de tipagem. - Responsavel: SENTINELA
[x] `Core loop`: `npm run test` passou com 24 cenarios. - Responsavel: SENTINELA
[x] `Capacitor/Android`: shell Android criado, sincronizado e validado em aparelho real em rodadas anteriores. - Responsavel: SENTINELA
[x] `Play Console`: conteudo do app preenchido (`Privacidade`, `Data Safety`, `Classificacao`, `Ads`, `Acesso`, `Exclusao`, etc.). - Responsavel: PROTOCOLO
[x] `Questionarios Google`: formularios respondidos com material real do app. - Responsavel: TRONO
[x] `Provas visuais`: prints reais ja existem para sustentar a revisao e o pedido de producao. - Responsavel: DOMINIO
[x] `Login real`: fluxo real cai no destino correto. - Responsavel: PROTOCOLO
[x] `marco1_beta_tracking`: planilha/painel ja e a fonte operacional para acompanhar testers e sinais do beta. - Responsavel: TRONO
[x] `Push Android`: camada nativa/local funcionando e trilha `FCM` preparada no backend. - Responsavel: PROTOCOLO
[x] `Oraculo -> Planner`: CTA do painel diario abre o Planner/Sitrep pelo fluxo `APP_NAVIGATE_EVENT` com `openSitrep`. - Responsavel: PROTOCOLO
[x] `Mundo/Social`: DMs, cla, pessoas e solicitacoes estao na superficie social certa, com Oraculo como triagem. - Responsavel: PROTOCOLO

### TRAVAS ATUAIS [!]
[!] `Closed test`: manter testers optados e ativos durante 14 dias continuos. Estamos no dia 2. - Responsavel: TRONO + DOMINIO
[!] `Encoding`: `check:encoding` ainda acusa mojibake em fontes e assets Android antigos; limpar por prioridade visual, nao em massa. - Responsavel: SENTINELA
[!] `Billing real`: ainda precisa validacao ponta a ponta com reconciliacao segura antes de virar promessa publica. - Responsavel: TESOURO
[!] `Apple/iOS`: trilha inteira ainda por abrir (`Apple Developer`, `Xcode`, `StoreKit`, `APNs`, `Sign in with Apple`, `TestFlight`). - Responsavel: SENTINELA + PROTOCOLO

### OBSERVACOES [~]
[~] `Node 22`: considerar depois, quando for preparar uma nova versao/AAB com calma. Nao e pauta para mexer agora. - Responsavel: SENTINELA

## 4. ORDEM OPERACIONAL PARA ATRAVESSAR O CLOSED TEST
1. **Operar pelo `marco1_beta_tracking`**
   - usar a planilha/painel como fonte central
   - acompanhar quem entrou, instalou, abriu e voltou
   - registrar feedback real sem inventar processo paralelo
2. **Proteger a versao atual**
   - se esta instalando, abrindo e logando certo, manter
   - nao subir versao nova por ansiedade tecnica
   - qualquer nova versao precisa aumentar `versionCode`, senao a Play nem aceita
3. **Registrar sinais do beta**
   - prints reais
   - formulario Google ja respondido
   - problemas reportados por tester
   - sinais de ativacao e retorno
4. **Corrigir so o que aparecer no uso real**
   - bug que impede login/entrada
   - bug que trava ciclo/arena/acao/planner
   - bug visivel que prejudica a revisao
5. **Preparar producao**
   - consolidar evidencias no fim da janela
   - usar o historico do `marco1_beta_tracking`
   - pedir `Production` com base no teste real, nao em checklist artificial

## 5. MATRIZ DE EXECUCAO
### BLOQUEIA PRODUCAO ANDROID
[ ] Fechar os 14 dias de closed test com testers optados e uso real. - Responsavel: TRONO + DOMINIO
[ ] Manter `marco1_beta_tracking` atualizado com instalacao, abertura, retorno e feedback. - Responsavel: TRONO
[ ] Se houver update, gerar v27+ com `versionCode` maior e subir no mesmo closed testing track. - Responsavel: SENTINELA
[ ] Confirmar billing real ou deixar paywall/compra fora da promessa publica ate estar reconciliado. - Responsavel: TESOURO
[ ] Pedir aprovacao de `Production` com formularios ja respondidos, prints reais e dados do beta. - Responsavel: TRONO

### FORA DO HOT PATH IMEDIATO
[ ] Limpeza ampla de encoding fora do fluxo principal. - Responsavel: SENTINELA
[ ] Refatoracao grande de navegacao/eventos. - Responsavel: SENTINELA + PROTOCOLO
[ ] Atualizacao grande de Capacitor/Gradle/dependencias. - Responsavel: SENTINELA
[ ] Trocar/baixar para Node 22 em momento calmo de preparacao de nova versao. - Responsavel: SENTINELA
[ ] Apple/iOS: abrir trilha inteira `Apple Developer + App Store Connect + Capacitor iOS + Xcode + StoreKit + APNs + Sign in with Apple + TestFlight`. - Responsavel: SENTINELA + PROTOCOLO
[ ] Fechar reels/landing/funil antes de empurrar trafego aberto. - Responsavel: DOMINIO

## 6. CORTE BETA 25
[x] Android em closed test pela Play Store.
[x] App instalavel por usuarios reais.
[x] `targetSdkVersion 36`.
[x] `type-check` verde.
[x] Core loop verde.
[x] Formularios Google respondidos.
[x] Prints reais existentes.
[x] Login real cai no destino correto.
[x] `marco1_beta_tracking` existe como base de acompanhamento.
[ ] 14 dias completos de closed test.
[ ] Feedback real consolidado no tracking.
[ ] Proximo AAB gerado apenas se for necessario update real.
[ ] Billing Android reconciliado ou claramente fora do caminho publico.
[ ] Pedido de producao enviado e aprovado.

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
[ ] Testers optados no closed test: acompanhar no `marco1_beta_tracking`
[ ] Dias de closed test: 2/14
[ ] Instalaram pela Play: acompanhar no `marco1_beta_tracking`
[ ] Abriram o app apos instalar: acompanhar no `marco1_beta_tracking`
[ ] Ativacao onboarding: acompanhar no `marco1_beta_tracking`
[ ] Retorno D2: acompanhar no `marco1_beta_tracking`
[ ] Fechamento 1 ciclo: acompanhar no `marco1_beta_tracking`
[ ] Bugs P0/P1 abertos: 0/0
[x] Cobertura `marco1_beta_tracking`: fonte operacional definida

## 10. RESUMO ATUALIZADO
- Data: 23/04/2026
- Atualizado por: ChatGPT 5.5 / Codex
- Resumo: o GLYPH esta em beta fechado real na Google Play. Formularios do Google ja foram respondidos, prints reais existem e o login real cai no destino correto. O foco agora e operar pelo `marco1_beta_tracking`, proteger a versao atual, registrar uso real e pedir producao com evidencia do teste. Node 22 fica como ajuste tecnico posterior para uma nova versao, nao como bloqueio atual.

## 11. MODO DE USO DO RELATORIO
1. Ler `relatorio.md`, `status.md`, `roadmap-soberania.md` e `progresso.md` antes de mexer no estado do projeto.
2. O item `3` mostra o estado real atual; o item `4` mostra a ordem pratica para atravessar o closed test.
3. O item `5` e a leitura operacional de bloqueios; o item `6` e o corte minimo para producao Android.
4. O que entrar como fechado e estavel deve migrar depois para `progresso.md`.
