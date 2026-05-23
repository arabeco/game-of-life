# GLYPH STATUS: 1.0.37 (FINAL HARDENING)
**Data:** 20/05/2026 | **Fase:** FUNDACAO -> PEDIDO DE PRODUCAO | **Soberano:** Zee

## 1. ESTADO REAL
- **Closed test Google Play:** aceito. O gargalo deixou de ser "passar no teste" e virou fechar a versao final com confianca.
- **Release local atual:** `versionCode 37`, `versionName 1.0.37`.
- **Postura de agora:** patch pequeno, verificavel, sem refatoracao ampla por ansiedade.

## 2. SCORECARD DE AUDITORIA
- **EXECUCAO REAL: 8.9** - loop central esta vivo, beta aceito, Android sincronizado em rodadas recentes; ainda precisa passada final em localhost/aparelho para os pontos abaixo.
- **ID VISUAL: 8.6** - Planner, widget, Assets e barras de ciclo melhoraram; miniaturas de arena receberam reforco visual por parecerem transparentes demais.
- **FLUXO USUARIO: 8.5** - ciclo, Planner, Painel Diario, campanhas e social existem; medo atual esta concentrado em bordas de Clan/Premium/Campanhas e notificacao duplicada.
- **RETENCAO: 8.7** - Oraculo, checklist noturno, EXP diaria, ciclos e relatorio sustentam retorno; Oraculo recebeu ajuste de voz para soar menos robotico.

## 3. FECHADO AGORA
[x] Teste fechado aceito pela Google Play.
[x] Projeto Android em `targetSdkVersion 36`.
[x] Versao local em `1.0.37 / 37`.
[x] Widget/cabecalho do ciclo aprovado visualmente no localhost.
[x] Historico de ciclo no Planner isolado na direita; ferramentas do dia ficam na esquerda.
[x] Checklist so ganha relevo depois das 20:00 quando ainda ha pendencias.
[x] Confirmacao generica subiu para camada `z-[21000]` para nao aparecer atras de modais de ciclo.
[x] Miniaturas compactas de arena ficaram mais opacas, saturadas e legiveis.
[x] Placar discreto de EXP entrou no Planner: antes do fechamento mostra estimativa do dia; depois mostra EXP depositada.
[x] Oraculo recebeu regra de voz mais humana e menos template no prompt backend.

## 4. ATENCAO ANTES DE PRODUCAO
[!] **EXP diaria:** completar acao nao deposita direto na nobreza. A acao marca tarefa e atualiza estimativa; a EXP entra no ciclo quando o Painel Diario fecha. Dias passados sem julgamento sao reconciliados automaticamente quando o app hidrata o ciclo.
[!] **Notificacao duplicada:** se o mesmo usuario habilitou push no navegador e no app, pode receber nos dois destinos. Precisa validar preferencia por dispositivo antes de tratar como bug de todos.
[!] **Clan/Premium/Campanhas:** nao ha novo bug comprovado neste passe, mas seguem como trilha de smoke final por risco de lancamento.
[!] **Billing/Premium real:** manter como promessa controlada ate validar reconciliacao ponta a ponta.
[!] **Encoding/mojibake:** ainda existe residuo historico; limpar so onde aparecer para usuario.

## 5. ORDEM DE FECHAMENTO
1. Rodar `npm run build`.
2. Conferir localhost focando: deletar ciclo, miniaturas de arena, Planner EXP, Clan, Premium e Campanhas.
3. Se aprovado visualmente, decidir se esta rodada merece `cap sync android` e novo envio.
4. Antes de producao, fazer smoke manual curto em aparelho real: login, criar/fechar dia, historico, campanha instalada, premium/paywall, cla e notificacao.

## 6. NOTA DE CONFIANCA
O medo de lancar e esperado: o produto e grande e voce esta segurando varias superficies sozinho. O estado correto nao e "sem medo"; e "P0/P1 conhecidos fechados, riscos nomeados e smoke final curto".

## 7. BLUEPRINT DE MATURIDADE BECO'S LAB / GLYPH

### Nivel 1: Ideia
- [x] Manifesto do projeto e definicao do "Superpoder" escrito
- [x] Fluxograma logico de decisoes e caminhos do usuario desenhado
- [x] Stack tecnica definida e validada
- [x] GATE: Blueprint completo e visao de escopo travada sem furos

### Nivel 2: Infraestrutura
- [x] 1o Commit, Projeto criado, Tailwind/Design System e Repo configurados
- [x] Instancia do Supabase ativa com Tabelas, RLS e Auth configurados
- [x] Deploy na Vercel ativo com URL de teste respondendo
- [x] GATE: Ambiente de desenvolvimento e nuvem em harmonia total

### Nivel 3: Design
- [x] Paleta Beco's Lab e tipografia implementadas no codigo
- [x] Componentes base (Glassmorphism, Botoes, Cards) criados
- [x] Estrutura de menus (Sidebar e Bottom Tabs) funcional e padronizada
- [x] GATE: Interface soberana e estetica de produto premium consolidada

### Nivel 4: Fluxo
- [x] Roteamento completo entre todas as telas do app funcionando
- [x] Fluxo de Onboarding e transicoes de tela implementados
- [x] GATE: Caminho do jogador mapeado e navegavel

### Nivel 5: Engine
- [x] Arquivo global de tipos TypeScript estruturado e sem erros
- [x] Algoritmos de calculo, score ou decisoes core implementados
- [x] Validacao das regras de negocio e limites de sistema testados
- [x] GATE: Cerebro do app estavel, inteligente e a prova de falhas logicas

### Nivel 6: Persistencia
- [x] Gerenciamento de estado global integrado
- [x] Persistencia em LocalStorage/Supabase configurada
- [x] Logica de Hydration funcionando sem resetar o app no fluxo normal
- [x] GATE: Memoria local indestrutivel e retencao inicial engatilhada

### Nivel 7: Conexao
- [x] Login Real Social/Email funcionando
- [x] Sincronizacao entre Local e Banco de Dados Supabase funcional
- [x] Backup de progresso e perfil multi-dispositivo validados
- [x] Teste humano validando o fluxo completo no localhost/app
- [x] GATE: App conectado, seguro e pronto para receber usuarios na nuvem

### Nivel 8: Refino
- [x] Sistema global de Toasts e feedbacks visuais de erro/sucesso
- [x] Otimizacao de performance suficiente para beta fechado
- [x] Build Mobile Capacitor gerado e testado em dispositivo fisico
- [x] Implementacao da logica de Paywall e Area Premium
- [x] GATE: Produto de prateleira pronto para beta, com correcoes rapidas em andamento

### Nivel 9: Marketing & Testes
- [x] Setup completo na Google Play Console
- [x] Redes sociais criadas e Instagram com seguidores/posts agendados
- [x] Inicio do Closed Beta com 20 testers / 14 dias
- [x] Producao de material visual com prints reais e uso real do app
- [ ] GATE: Validacao externa concluida e tracao inicial de comunidade

**Marco:** Glyph aceito para producao. Proximo passo e rodar ultimos testes e fechar a versao final.

### Nivel 10: Produto Vivo
- [ ] Lancamento oficial para o publico geral
- [ ] Supabase Pro ativado ou Free validado com margem segura para uso publico
- [ ] Custom domain Supabase configurado para Auth, Edge Functions e Storage
- [ ] Webhooks de pagamento apontando para dominio/projeto definitivo
- [ ] URLs antigas de Storage/Supabase removidas do app antes de escala
- [ ] Ativacao final de gateways de pagamento e planos Plus/Pro com receita real
- [ ] Configuracao final de ASO com keywords e screenshots profissionais
- [ ] Monitoramento de metricas e inicio do trafego pago
- [ ] GATE: Soberania digital atingida com geracao de receita e escala ativa

**Nivel atual:** Nivel 9 iniciado.

### Depois do Produto Vivo: Operacao Continua
- [ ] Monitorar egress, storage, database, Edge Functions e custos semanalmente no primeiro mes
- [ ] Revisar logs de erro, crash reports e feedbacks reais dos usuarios
- [ ] Continuar cuidando da pagina do Instagram com posts, stories, prints reais e prova social
- [ ] Atualizar ASO, screenshots e descricao da loja conforme feedback dos primeiros usuarios
- [ ] Criar uma nova season a cada 3 meses com tema, recompensas, campanhas/skins e comunicacao propria
- [ ] Planejar ciclos de melhoria sem reabrir escopo infinito: Oraculo, achievements, streaks, campanhas e Jardim Zen

### Nota sobre plano do banco / Supabase
- O alerta de grace period/quota nao deve ser interpretado sozinho como risco normal para 20 usuarios: houve um dia atipico de smoke test pesado que inflou uso.
- Para o lancamento, a decisao correta e monitorar `egress`, `database size`, `storage` e `disk IO` nos primeiros dias de uso real.
- O Jardim Zen salva `garden_state` manualmente por botao e em JSON leve; nao deve ser o vetor principal de egress.
- Se o uso real de usuarios comuns mantiver crescimento baixo, o plano atual pode aguentar a validacao inicial. Se o egress voltar a subir sem smoke test, revisar cache de imagens/storage e considerar upgrade de plano antes de trafego pago.
