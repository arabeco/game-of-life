# Operar o GLYPH

Runbook pessoal para lançar, observar, conter e recuperar o GLYPH.

- **Atualizado em:** 24/09/2026
- **Status:** documento vivo; preencher os campos marcados como `PENDENTE` antes do rollout amplo
- **Projeto Supabase:** `klmsdcncmhtgnlcejzdi`
- **Regra principal:** diagnóstico primeiro, escrita depois

Este documento existe para reduzir a dependência de memória durante um incidente. Ele não promete que o sistema está saudável agora. Ele mostra onde olhar, qual pergunta fazer e qual ação é segura em cada situação.

## 1. O que significa operar

Depois do lançamento, a pergunta não é somente “o código está correto?”. É preciso conseguir responder, em poucos minutos:

1. O que quebrou?
2. Quantas contas foram afetadas?
3. Como paro o dano sem piorar os dados?
4. Como recupero a conta ou volto a uma versão segura?
5. Como registro a causa para não repetir o incidente?

Cada alerta precisa ter quatro coisas: **sinal**, **lugar para conferir**, **ação de contenção** e **caminho de recuperação**.

## 2. Regra de emergência em cinco minutos

Quando algo parecer errado:

1. **Pare mudanças paralelas.** Não faça deploy, migration, limpeza ou correção manual enquanto o alcance ainda é desconhecido.
2. **Classifique:** dados, dinheiro, acesso, push, custo, indisponibilidade ou apenas aparência.
3. **Leia primeiro.** Use logs e consultas `read only`; salve horário, erro, função e quantidade afetada.
4. **Contenha.** Pause o job, rollout, push ou fluxo de compra responsável, se houver um interruptor seguro.
5. **Preserve evidência.** Guarde o erro, o intervalo de tempo, o release e os identificadores necessários. Não copie tokens, service keys ou dados pessoais para este arquivo.
6. **Recupere em uma conta de teste.** Só depois faça uma correção limitada e verificável.
7. **Feche o incidente.** Registre causa, alcance, correção, validação e o teste que passa a proteger o caso.

### Severidade prática

| Nível | Situação | Conduta |
| --- | --- | --- |
| **P0** | perda/corrupção de dados, cobrança errada, vazamento, recompensa duplicada em escala | congelar o fluxo afetado e tratar como incidente ativo |
| **P1** | login, compra, push ou função importante indisponível para várias contas | conter, medir alcance e preparar rollback |
| **P2** | erro localizado, regressão visual ou função secundária falhando | registrar, corrigir com rollout pequeno |
| **P3** | texto, acabamento ou melhoria sem impacto no estado | entra no backlog normal |

## 3. Mapa real do GLYPH

### Superfícies

- **Web/Vite/React:** cliente principal, persistência via Supabase e cache de rede.
- **Android/Capacitor:** WebView, notificações nativas, FCM, Play Billing e Jardim 3D.
- **Supabase Database:** dados de conta, ciclos, ações, inventário, compras, preferências, jobs e RLS.
- **Supabase Edge Functions:**
  - `account-delete`
  - `google-play-purchase`
  - `mercadopago`
  - `oracle`
  - `oracle-command`
  - `resend`
  - `web-push`
  - `widget-action`
- `supabase/functions/_shared` contém código compartilhado; não é uma função para deploy isolado.

### Jobs agendados conhecidos

| Job | Frequência | Responsabilidade | Risco se duplicar |
| --- | --- | --- | --- |
| `glyph-enqueue-action-reminders` | a cada minuto | enfileirar lembretes de ações | push repetido |
| `glyph-generate-oracle-feed` | a cada 10 minutos | gerar feed automático do Oráculo | cards ou chamadas de IA repetidos |
| `glyph-finalize-competition-challenges` | a cada minuto | fechar competições vencidas | resultado/recompensa duplicados |
| `glyph-cycle-deadline-notice` | a cada 10 minutos | enfileirar aviso de prazo do ciclo | aviso repetido |
| `purge-runtime-history` | 04:00 | podar histórico do cron e `pg_net` | remoção de diagnóstico se usado fora do prazo |

Os quatro primeiros nascem em migrations. `purge-runtime-history` é criado pelo arquivo manual [supabase/maintenance_cleanup.sql](../supabase/maintenance_cleanup.sql) e só deve ser instalado depois de conferir o resultado dos blocos de diagnóstico.

## 4. Painéis que precisam estar à mão

- [Supabase Dashboard](https://supabase.com/dashboard/project/klmsdcncmhtgnlcejzdi)
  - Database: tamanho, tabelas quentes, conexões e query performance
  - Logs: API, Auth, Database e Edge Functions
  - Edge Functions: invocações, erro, duração e logs
  - Storage: uso, arquivos grandes e tráfego
  - Reports/Usage: egress e demais limites do plano
- [Google Play Console](https://play.google.com/console)
  - Android vitals: crash, ANR e aparelhos afetados
  - trilha de teste/produção e percentual do rollout
  - Play Billing e pedidos com problema
- Console do provedor de push: FCM e Web Push, quando o incidente envolver entrega.
- Console do provedor de pagamento: Mercado Pago, quando o incidente envolver PIX/webhook.

**PENDENTE antes do lançamento:** guardar aqui os links exatos de cada painel e o nome da conta de acesso, sem guardar senha ou token.

## 5. Rotina diária de saúde

### Checagem curta, 5 a 10 minutos

- [ ] Não há release novo em observação sem uma decisão registrada.
- [ ] Erros recentes de Edge Functions não mostram uma onda nova.
- [ ] Os quatro jobs de produto estão ativos e com execuções recentes.
- [ ] Não há aumento fora do padrão em API 4xx/5xx, timeout ou latência.
- [ ] Egress, banco e Storage estão dentro do orçamento observado.
- [ ] Crash/ANR do Play não piorou após a última versão.
- [ ] Não há fila de pagamento ou push parada.
- [ ] O último incidente aberto tem responsável e próximo passo.

### Checagem semanal

- [ ] Comparar uso atual com a semana anterior: egress, invocações, banco, Storage e Auth.
- [ ] Conferir tabelas que crescem por histórico: `cron.job_run_details`, `net._http_response`, `app_runtime_events`, dispatches de push e mensagens do Oráculo.
- [ ] Confirmar que jobs continuam idempotentes e que a trava contra concorrência continua existindo.
- [ ] Testar login em aparelho novo e refresh de sessão.
- [ ] Conferir uma compra de teste/reconciliação disponível no ambiente correto.
- [ ] Revisar erros de usuários e transformar recorrência em regressão ou alerta.

## 6. Consultas e arquivos de diagnóstico

Comece pelos arquivos existentes. Eles são diagnósticos, não prova de que todos os passos externos deram certo.

### Cron e volume do Oráculo

[supabase/CHECK-oraculo-cron-e-volume.sql](../supabase/CHECK-oraculo-cron-e-volume.sql)

- somente leitura;
- mostra jobs do Oráculo e execuções recentes;
- separa público elegível, cards gravados e entrega;
- `succeeded` no `pg_cron` confirma o SQL do job, não confirma geração nem entrega do push.

### Caminho de push

[supabase/CHECK-push-do-oraculo.sql](../supabase/CHECK-push-do-oraculo.sql)

Leia da esquerda para a direita: configuração, cron, interruptores, inscrição, cards, tentativas, envios bem-sucedidos e último erro.

Antes de executar, confira se o `user_id` do arquivo é uma conta de QA autorizada. Não use o diagnóstico de uma conta para afirmar que todos os aparelhos receberam push.

### Lista geral de jobs

Consulta somente leitura para o SQL Editor:

```sql
begin transaction read only;
set local statement_timeout = '15s';

select jobid, jobname, schedule, active
from cron.job
order by jobid;

select j.jobname, d.status, count(*) as execucoes_24h,
       min(d.start_time) as primeira,
       max(d.start_time) as ultima
from cron.job_run_details d
join cron.job j on j.jobid = d.jobid
where d.start_time >= now() - interval '24 hours'
group by j.jobname, d.status
order by j.jobname, d.status;

commit;
```

### Tamanho e crescimento do banco

```sql
begin transaction read only;
set local statement_timeout = '15s';

select pg_size_pretty(pg_database_size(current_database())) as banco;

select relname as tabela,
       n_live_tup as linhas_vivas,
       n_dead_tup as linhas_mortas,
       pg_size_pretty(pg_total_relation_size(relid)) as tamanho
from pg_stat_user_tables
order by pg_total_relation_size(relid) desc
limit 20;

commit;
```

### Manutenção

[supabase/maintenance_cleanup.sql](../supabase/maintenance_cleanup.sql) contém operações de escrita e `TRUNCATE`. Ele **não** é uma checagem diária. Antes de usar:

1. executar os blocos de medição;
2. salvar o tamanho antes;
3. confirmar que o histórico realmente pode ser descartado;
4. executar um bloco por vez;
5. medir depois;
6. registrar data, operador e resultado.

Não rodar `VACUUM FULL` pelo SQL Editor; o próprio arquivo explica que precisa de conexão direta e bloqueia a tabela durante a operação.

## 7. Guardrails antes do rollout

### Dados

- [ ] Existe backup/PITR no plano do Supabase e você sabe onde iniciar uma restauração.
- [ ] Uma restauração foi testada em projeto/ambiente separado ou existe um teste documentado equivalente.
- [ ] Migrations novas são aditivas quando possível: adicionar, migrar, observar, só depois remover.
- [ ] Nenhuma correção manual edita saldo, XP, inventário ou assinatura sem trilha e conferência posterior.
- [ ] Colunas decididas pelo servidor continuam protegidas por RLS/grants. Um `403` em `user_profiles` é sinal para revisar autoridade, não para abrir a tabela inteira.

### Execuções automáticas

- [ ] Cada job possui chave de deduplicação, `unique` ou trava transacional.
- [ ] Uma segunda execução concorrente não cria segunda recompensa, segundo card ou segundo push.
- [ ] Existe forma documentada de desativar o job problemático.
- [ ] O job registra sucesso, falha e quantidade processada.

### Custos

- [ ] Egress, Edge Functions, Storage, banco e serviços externos têm orçamento mensal anotado.
- [ ] Existe uma linha de base de pelo menos três dias com usuários de teste.
- [ ] Alertas iniciais ficam em 70%, 85% e 100% do orçamento; ajuste depois de observar o uso real.
- [ ] Chamadas caras têm limite, cache ou deduplicação quando a regra permite.

### Acesso e segurança

- [ ] RLS e grants foram testados com usuário autenticado e usuário sem sessão.
- [ ] Nenhuma service key ou segredo aparece no cliente, log, commit ou documento.
- [ ] Endpoints públicos rejeitam payload inválido e repetição abusiva.
- [ ] Compra e recompensa são decididas no servidor; o cliente mostra o espelho.

## 8. Rollout seguro

### Antes de publicar

- [ ] `npm run type-check`
- [ ] `npm run test:launch`
- [ ] `npm run test:launch:full` antes de abrir Beta/LIVE
- [ ] QA manual dos pontos que os testes não cobrem: compra Play real, premium em dois aparelhos, aparelho real e QA visual mobile
- [ ] migration aplicada no projeto correto e verificada por consulta
- [ ] changelog com mudanças de dados, jobs, funções e flags
- [ ] plano de rollback escrito antes do upload

O [LAUNCH_READINESS.md](../LAUNCH_READINESS.md) é a fonte da suite. O relatório pode marcar **Build: SKIPPED** ou deixar itens manuais pendentes; isso não deve ser lido como aprovação completa.

### Durante o rollout

1. publicar em teste interno;
2. observar logs, crash, Auth, Edge, banco e push;
3. abrir para 50–100 usuários;
4. observar uma janela completa de rotina e virada de dia;
5. avançar para aproximadamente 500;
6. só então considerar 1.000+;
7. parar o avanço se surgir erro P0/P1 ou crescimento sem explicação.

O número de usuários é uma barreira de impacto, não uma prova de capacidade. O comportamento precisa ser observado em cada etapa.

## 9. Playbooks de incidente

### 9.1 Egress ou custo subindo

1. comparar o período com a linha de base;
2. separar API, Storage, Edge e serviço externo;
3. procurar loop de polling, retry sem limite, payload grande e consulta repetida por tela;
4. desligar temporariamente a feature ou job que causa o salto;
5. preservar logs e contadores antes de alterar cache;
6. corrigir, rodar regressão e reabrir para uma coorte pequena.

O relatório [docs/reports/otimizacao-trafego-2026-09-13.md](reports/otimizacao-trafego-2026-09-13.md) mede reentrada e cache. Ele não substitui medição de cobrança nem prova capacidade simultânea.

### 9.2 Job duplicando push, card ou recompensa

1. desativar o job afetado;
2. verificar `cron.job_run_details` e as tabelas de resultado;
3. contar duplicatas por chave de negócio e janela de tempo;
4. não apagar linhas antes de exportar os identificadores afetados;
5. corrigir a deduplicação/transação;
6. reparar somente as contas afetadas;
7. reativar com uma coorte e acompanhar a próxima execução.

### 9.3 Progresso, ciclo ou inventário incorreto

1. impedir novas escritas do fluxo específico;
2. identificar a primeira linha/ação incorreta e a última correta;
3. salvar snapshot do usuário e dos registros relacionados;
4. preferir RPC corretiva idempotente a editar várias tabelas à mão;
5. testar em conta de QA;
6. corrigir a menor quantidade de contas possível;
7. conferir saldo, XP, ciclo, inventário e histórico depois da correção.

Nunca usar `UPDATE` amplo por conveniência em `user_profiles`. A autoridade de saldo, compra, prêmio e capacidade deve continuar no servidor.

### 9.4 `403` ou erro de permissão no perfil

1. registrar coluna, endpoint, usuário e migration vigente;
2. conferir se a coluna é espelho de uma RPC ou decisão do cliente;
3. se for espelho, remover a coluna do patch do cliente;
4. se for decisão legítima do cliente, revisar grant/RLS com teste e migration explícita;
5. nunca resolver dando `grant update` na tabela inteira;
6. adicionar regressão para impedir que a coluna volte ao allowlist.

### 9.5 Push parado ou virando spam

1. verificar configuração, job, preferências, assinatura, tentativa e envio;
2. pausar o job antes de tentar reenviar;
3. separar “card salvo” de “push aceito pelo provedor”;
4. deduplicar por `dispatchKey`/chave de negócio;
5. testar em um aparelho Web e um Android;
6. reabrir gradualmente.

### 9.6 Pagamento aprovado sem benefício

1. não conceder manualmente antes de conferir o provedor;
2. localizar o pagamento pelo identificador externo;
3. confirmar assinatura, valor, produto, usuário e status;
4. conferir `user_purchases` e a RPC responsável;
5. repetir a reconciliação de forma idempotente;
6. registrar o resultado e testar restore/segunda chamada.

Os caminhos principais estão em `google-play-purchase` e `mercadopago`. A unicidade de `payment_id` deve continuar sendo uma barreira contra duplicidade.

### 9.7 Crash, ANR ou memória no Android

1. pausar o rollout para a versão afetada;
2. separar crash de startup, WebView, push, billing e Jardim 3D;
3. comparar modelo/Android/versão do aparelho;
4. desligar a feature pesada por flag quando houver esse caminho;
5. gerar hotfix pequeno e testar em aparelho fraco/intermediário;
6. reabrir para poucos usuários.

Teste no aparelho real continua obrigatório. Build, type-check e smoke de navegador não comprovam memória, haptics, WebView ou Play Billing.

## 10. Auth, conta e aparelho novo

Teste em cada release relevante:

- [ ] login e logout;
- [ ] refresh token depois de horas/dias;
- [ ] troca de aparelho;
- [ ] recuperação de senha;
- [ ] conta sem preferência ainda consegue entrar;
- [ ] exclusão de conta remove os registros e arquivos esperados;
- [ ] usuário antigo abre a versão nova sem perder dados;
- [ ] usuário com versão antiga não quebra por migration incompatível.

Ao investigar Auth, não pedir senha nem token no suporte. Solicitar horário, versão, plataforma, mensagem visível e identificador seguro da conta.

## 11. O que cada teste realmente prova

| Evidência | Prova | Não prova |
| --- | --- | --- |
| regressão local | contrato do código atual | produção aplicada ou dados remotos |
| type-check | tipos compilam | runtime Android, memória ou provider externo |
| build | bundle pode ser gerado naquele ambiente | upload, assinatura, Play ou Supabase |
| smoke de navegador | fluxo clicável no navegador | push fora da tela, WebView e aparelho fraco |
| consulta SQL read-only | estado observado naquele momento | entrega ao celular ou ausência de dados fora da consulta |
| log de `cron` como `succeeded` | SQL do job terminou | Edge Function, IA, push ou recompensa concluída |
| push `sent` | provedor aceitou o envio | usuário recebeu ou abriu |
| pagamento aprovado no provedor | cobrança reconhecida | benefício persistido até a conta sem reconciliação |

## 12. Registro de incidente

Copie este bloco para um arquivo em `docs/incidents/` quando houver algo relevante:

```md
# Incidente YYYY-MM-DD — título curto

- Severidade: P0/P1/P2/P3
- Início (UTC e São Paulo):
- Fim:
- Release/app:
- Ambiente/projeto:
- Responsável:

## Sintoma

## Alcance medido

## Evidências

- painel/log:
- consulta:
- identificadores afetados:

## Contenção aplicada

## Recuperação aplicada

## Validação depois da recuperação

## Causa provável e causa confirmada

## Regressão, alerta ou mudança de processo criada

## O que ficou pendente
```

## 13. Checklist de confiança antes do público amplo

- [ ] Sei onde ver crash, Edge, banco, Storage, Auth, push, pagamentos e egress.
- [ ] Sei desligar cada job automático sem apagar dados.
- [ ] Sei qual migration está aplicada no projeto de produção.
- [ ] Tenho backup/PITR e sei testar uma restauração.
- [ ] Tenho rollback de frontend e plano para migration corretiva.
- [ ] Tenho uma conta de QA para login, push, compra e dados ruins.
- [ ] Tenho uma janela de observação após cada etapa do rollout.
- [ ] Sei quem recebe a comunicação se o incidente sair do meu controle.

Se uma resposta for “ainda não sei”, isso vira uma tarefa operacional concreta. Não é motivo para adivinhar segurança; é o item que precisa ser fechado antes de aumentar o alcance.

## Referências do repositório

- [LAUNCH_READINESS.md](../LAUNCH_READINESS.md)
- [LAUNCH_READINESS_REPORT.md](../LAUNCH_READINESS_REPORT.md)
- [RELEASE_BUNDLE_ANDROID.md](../RELEASE_BUNDLE_ANDROID.md)
- [CHECKLIST_FCM_BACKEND_GLYPH.md](../CHECKLIST_FCM_BACKEND_GLYPH.md)
- [CHECKLIST_PLAY_CONSOLE_PRIMEIROS_PASSOS_GLYPH.md](../CHECKLIST_PLAY_CONSOLE_PRIMEIROS_PASSOS_GLYPH.md)
- [DATA_SAFETY_APP_PRIVACY_GLYPH.md](../DATA_SAFETY_APP_PRIVACY_GLYPH.md)
- [docs/reports/otimizacao-trafego-2026-09-13.md](reports/otimizacao-trafego-2026-09-13.md)
- [supabase/CHECK-oraculo-cron-e-volume.sql](../supabase/CHECK-oraculo-cron-e-volume.sql)
- [supabase/CHECK-push-do-oraculo.sql](../supabase/CHECK-push-do-oraculo.sql)
- [supabase/maintenance_cleanup.sql](../supabase/maintenance_cleanup.sql)
