# GLYPH STATUS: 1.0.60

**Data:** 17/08/2026 | **Fase:** PRODUCAO -> ESTABILIZACAO | **Soberano:** Zee

## 1. ESTADO REAL

- **Release local:** `versionCode 60`, `versionName 1.0.60`. O AAB gerado hoje ainda e anterior a otimizacao do catalogo; regerar antes de enviar.
- **Banco:** 29 MB depois da limpeza. 73% do que ocupava era historico de `pg_cron`/`pg_net` sem poda, nao dado de usuario. Poda diaria agendada as 4h.
- **Download do app:** catalogo de arte caiu de 17 MB para 6,3 MB por quantizacao de paleta. AAB deve sair perto de 14 MB.
- **IA:** o app nao faz nenhuma chamada de modelo. Custo de IA por usuario e zero.
- **Postura de agora:** fechar o que foi relatado por usuario real, com teste que verifique em vez de afirmar.

## 2. O QUE ESTAVA QUEBRADO E FOI FECHADO

- **Fechar ciclo falhava para todos.** `claim_cycle_completion_gold` gravava `product_type = 'cycle_completion_reward'` (23 caracteres) numa coluna `varchar(20)`. O insert estourava e `endCycle` morria antes de devolver relatorio, virando o toast generico "Nao foi possivel analisar o ciclo". Corrigido por migration; confirmado ponta a ponta.
- **Convite de desafio derrubava a tela social.** `RELATION_LABELS` nao tinha `competicao`, entao `undefined.toLowerCase()` estourava no render e apagava a arvore inteira.
- **Parceria aceita sumia da lista.** Dois refreshes concorrentes sem ordenacao: o que partia antes do vinculo existir podia responder por ultimo e sobrescrever.
- **Missao de cla era oferecida com a feature desligada.** `PRODUCT_FEATURES.clanMissions` e `false` e nenhuma UI ativa a missao, mas a tela de missoes nao checava o flag.
- **EXP bancada parecia perdida.** O selo dizia "Ciclo +150" sem indicar que so entra no perfil ao fechar. Agora diz "+150 ao fechar".
- **Save de acao recusado em silencio.** As tres validacoes avisavam so por toast, que o overlay do tutorial cobre. Agora o motivo aparece dentro do modal.

## 3. ATENCAO ANTES DE PRODUCAO

- [!] **Regerar o AAB.** O atual nao tem a arte otimizada nem nenhuma correcao de hoje.
- [!] **Exclusao de conta:** cinco tabelas referenciam `auth.users` com `NO ACTION` (`cycles`, `daily_commitments`, `clan_custom_quests` x2, `shared_action_completions`). A varredura de exclusao cobre quatro; `clan_custom_quests` foi coberta por migration hoje. Exclusao de conta e exigencia da Play — vale um teste real.
- [!] **Quiz de campanha:** ficha e ouro ainda liberam campanha no codigo. So o texto e a apresentacao foram simplificados. Decidir se a economia sai ou fica.
- [!] **Notificacao duplicada:** push no navegador e no app podem entregar nos dois destinos.
- [!] **Billing/Premium real:** manter como promessa controlada ate validar reconciliacao ponta a ponta.
- [!] **`tsconfig` sem `strict`:** `noImplicitAny` desligado. `npm run type-check` passa em coisas que quebram em producao — foi assim que o `RELATION_LABELS` passou.
- [!] **`supabase/functions` fora do `tsconfig`:** mudanca em edge function nao e coberta pelo check padrao.

## 4. ESTADO DOS TESTES

- 11 regressoes de logica passam. Duas estavam vermelhas desde a 1.0.57 por descreverem um desenho antigo, nao por bug.
- A suite `test:launch:full` e fail-fast: enquanto o check 01 estava quebrado, os outros 19 nunca rodaram. Foi por isso que o fechamento de ciclo ficou quebrado sem ninguem saber.
- **Os smoke sociais miram em telas mortas.** `partnership-mutual-arenas`, `competition-race` e os de mentoria dirigem o `RelationshipHubModal`, que nao e montado. A tela viva e o `ConnectionsModal`, que hoje ganhou ganchos de teste.
- `createTempUser` nunca apaga o que cria. Cada rodada da suite deixa contas `codex-*@example.com` permanentes.
- `cycle-report-flow` agora despeja erros de console na falha. Foi isso que entregou a causa do fechamento de ciclo em um minuto. Vale espalhar para os outros.

## 5. ORDEM DE FECHAMENTO

1. `npm run build`
2. Conferir no aparelho: fechar ciclo, aceitar parceria e desafio, EXP do ciclo, arte do catalogo depois da quantizacao.
3. `npx cap sync android && cd android && ./gradlew bundleRelease`
4. Smoke manual pelo `CHECKLIST-TESTES-MANUAIS.md` (36 itens).

## 6. NOTA DE CONFIANCA

O medo de lancar e esperado: o produto e grande e voce esta segurando varias superficies sozinho. O estado correto nao e "sem medo"; e "P0/P1 conhecidos fechados, riscos nomeados e smoke final curto".

O padrao que mais custou ate aqui nao foi codigo novo com bug. Foi corte pela metade: a tela nova entrou, a antiga ficou, e o teste continuou apontando para a morta. Ao revisar qualquer remocao, a pergunta util e "saiu da interface, ou so do lugar onde eu olhei?".

## 7. O QUE FOI CORTADO

Registro do conceito, nao do codigo. O codigo o git guarda; o motivo, nao.

| Corte | O que era | Situacao no codigo |
|---|---|---|
| 10 areas -> 5 | Areas da vida como eixo do progresso | Feito. `proposito`, `relacoes`, `trabalho`, `lazer`, `saude` + `geral` |
| Chat livre do Oraculo | Conversa aberta com o modelo | Removido da UI. Endpoint ainda vivo no servidor |
| Modos de tom do Oraculo | Neutro/Acolhedor/Direto/Reflexivo | Removido hoje. Continuava sendo oferecido e vendido como Premium |
| Oraculo cria coisas pelo usuario | Acao rapida por interpretacao de texto | Feito. `oracle-command-parser` e a funcao `oracle-command` estao orfaos |
| Resgate manual de missao | Botao "Resgatar recompensa" | Feito. Conclusao e automatica |
| Missoes prontas de cla | Missoes coletivas com progresso compartilhado | Flag `clanMissions: false`. Tabelas, RPC e canais continuam |
| Santuario / jardim do cla | Espaco coletivo com presenca | Flags off. `ClanSlotModal` e `SanctuaryAreaStats` nao montados |
| Acoes compartilhadas / mentor cria tarefa | Mentor agindo na arena do orientado | Flag off. `SharedArenaView` nao montado |
| Dia julgado | Vocabulario de julgamento do dia | Saiu da interface. O mecanismo continua: `daily_commitments.stage = 'judgment'` e o que deposita EXP no ciclo |
| Ouro/ficha do quiz | Economia para liberar campanha | **Nao removido.** So o texto foi simplificado |

**Telas nao montadas, candidatas a apagar:** `ClanDetailModal`, `ClanSlotModal`, `RelationshipHubModal`, `SharedArenaView`, `SanctuaryAreaStats`. Nao entram no bundle, entao nao pesam no download. Mas ja estao desatualizadas em relacao as vivas — o `RelationshipHubModal` dirige um fluxo de arena vinculada que nao existe mais. Ressuscitar exigiria reescrever, entao o que se perde ao apagar e referencia, nao codigo aproveitavel. O git guarda.

**Tabelas do banco das features desligadas:** deixar quietas. Guardam dado, custam pouco depois da limpeza, e dropar tem risco real.

## 8. BLUEPRINT DE MATURIDADE BECO'S LAB / GLYPH

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
- [x] Setup completo dos canais de distribuicao/publicacao
- [x] Redes sociais criadas e primeiros materiais de aquisicao preparados
- [x] Teste externo com usuarios reais concluido
- [x] Producao de material visual com prints reais e uso real do app
- [ ] Ativacao real de monetizacao: produtos, paywall, compra, reembolso e entrega validados ponta a ponta
- [ ] Integracoes criticas de lancamento validadas entre codigo, backend, hospedagem, autenticacao, pagamentos e console de distribuicao
- [ ] GATE: Validacao externa concluida, tracao inicial de comunidade e receita testada sem intervencao manual

**Marco:** Glyph aceito para producao. Proximo passo e rodar ultimos testes e fechar a versao final.

### Nivel 10: Produto Vivo
- [ ] Lancamento oficial para o publico geral
- [ ] Infraestrutura validada com margem segura para uso publico
- [ ] Dominios, webhooks, storage e URLs finais configurados
- [ ] Configuracao final de ASO, copy e screenshots profissionais
- [ ] Monitoramento de metricas, custos, erros e feedback real
- [ ] Inicio controlado de aquisicao/trafego
- [ ] GATE: Soberania digital atingida com geracao de receita e escala ativa

**Nivel atual:** Nivel 9 em fechamento.

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

