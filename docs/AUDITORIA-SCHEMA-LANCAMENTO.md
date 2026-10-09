# Auditoria de dados e Supabase — Glyph

**Estado:** inventário de produção pendente de extração.  
**Projeto esperado:** `klmsdcncmhtgnlcejzdi`.  
**Objetivo:** ter uma fotografia revisável do banco que está realmente recebendo usuários antes do lançamento público.

## Por que não basta ler as migrations

Há 168 migrations no repositório e oito Edge Functions: `account-delete`, `google-play-purchase`, `mercadopago`, `oracle`, `oracle-command`, `resend`, `web-push` e `widget-action`.

Isso explica a intenção do código, mas não prova três coisas importantes: quais migrations chegaram ao projeto remoto, quais alterações manuais existem no Dashboard e quais permissões estão efetivas agora. A fonte de verdade desta auditoria será a saída do SQL somente leitura em [CHECK-auditoria-schema-producao.sql](../supabase/CHECK-auditoria-schema-producao.sql).

## Entregáveis da investigação

1. **Dicionário de dados**: tabela, coluna, tipo, dono da escrita, dado pessoal, retenção e risco.
2. **Mapa de autoridade**: quem pode ler, inserir, atualizar e apagar cada tabela e RPC.
3. **Mapa de integridade**: foreign keys, `ON DELETE`, constraints, triggers e jobs.
4. **Mapa de superfície pública**: API, RPCs executáveis, buckets e Edge Functions.
5. **Matriz de lançamento**: bloqueador, prioridade, evidência e correção proposta.

## Como extrair o estado real

1. Abra o SQL Editor do projeto **Glyph** no Supabase.
2. Rode [CHECK-auditoria-schema-producao.sql](../supabase/CHECK-auditoria-schema-producao.sql) bloco por bloco.
3. Não execute os blocos 17 e 18 se `pg_cron` não estiver presente; registre a falha como parte do inventário.
4. Guarde o resultado datado. Não cole aqui valores de usuários, tokens, emails ou conteúdo de `auth.users`.

O script não contém `INSERT`, `UPDATE`, `DELETE`, DDL, nem chama RPC que altere dados.

## Convenção para anotar cada objeto

| Campo | O que registrar |
| --- | --- |
| Objeto | `public.tabela`, `public.funcao(args)` ou bucket |
| Papel | conta, Planner, ciclo, inventário, pagamento, push, exclusão, telemetria |
| Dados pessoais | nenhum, identificador, contato, conteúdo do usuário |
| Leitura | anon, autenticado próprio, servidor, staff |
| Escrita | cliente, RPC, Edge Function, job, service role |
| Integridade | PK, FK, unique, check, trigger e efeito ao apagar conta |
| Risco | acesso indevido, duplicidade, custo, perda, inconsistência |
| Evidência | query/bloco e data da extração |
| Decisão | manter, restringir, mover para RPC, indexar, monitorar |

## Pontos já conhecidos no código que exigem confirmação remota

| Área | O que conferir no schema real | Motivo |
| --- | --- | --- |
| `user_profiles` | grants por coluna, triggers de privilégio e RLS | premium, cargo e saldo não podem ser decididos pelo cliente |
| Economia | campos de EXP, baús, itens, ouro e fragmentos | algumas mutações ainda dependem do cliente; precisam virar autoridade de servidor gradualmente |
| Exclusão | FKs, triggers e `delete_account_data_for_user` | a falha `COMPETITION_SNAPSHOT_LOCKED` só está resolvida se a migration estiver aplicada |
| Pacto individual | `accept_arena_pact` e `claim_arena_pact_reward` | aceitar, validar arena e resgatar precisam ser idempotentes e autorizados |
| Compras | `google-play-purchase`, RPCs de entrega e perfil premium | recibo deve ser a única origem de benefício pago |
| Widget | `widget-action` e operações do Planner | a confirmação no widget precisa gravar uma única ação no horário correto |
| Push e Oráculo | jobs, função `web-push`, tabelas de fila e rate limits | detectar repetição, spam, falha silenciosa e custo inesperado |
| Storage | buckets públicos e policies | arte pública é aceitável; uploads de usuário precisam ser isolados |
| Pedido público de exclusão | `account_deletion_web_requests` | `anon` só pode inserir um pedido validado, nunca ler ou alterar pedidos |

## Achados da extração remota

### 2026-09-29 — índices

A saída recebida listou **100 índices**. Quatro pares têm a mesma definição e, portanto, mantêm duas estruturas físicas para a mesma busca:

| Tabela | Índice antigo | Índice duplicado | Definição |
| --- | --- | --- | --- |
| `actions` | `actions_user_id_idx` | `idx_actions_user_id` | `(user_id)` |
| `arenas` | `arenas_user_id_idx` | `idx_arenas_user_id` | `(user_id)` |
| `asset_slots` | `asset_slots_user_id_idx` | `idx_asset_slots_user_id` | `(user_id)` |
| `clan_members` | `clan_members_clan_idx` | `idx_clan_members_clan_id` | `(clan_id)` |

**Decisão pendente:** não remover ainda. Antes, consultar `pg_stat_user_indexes` para uso, localizar qual migration criou cada nome e escolher um nome canônico. Se forem removidos, a mudança deve ser uma migration própria e reversível, nunca um comando avulso no painel.

### 2026-09-29 — tabelas, volume e RLS

O banco tem volume pequeno para o estágio atual. As estimativas do catálogo apontam cinco perfis, 1.092 tarefas agendadas, 587 eventos de runtime, 393 itens de inventário, 278 mensagens do Oráculo e 203 registros de despacho de mensagem. Isso **não** é um problema de capacidade agora; é uma base boa para criar alertas antes do crescimento.

Todas as tabelas físicas de `public` retornaram `rls_ativo = true`. É um sinal positivo, mas não é aprovação de segurança: uma policy permissiva ou um grant amplo ainda pode expor dados.

| Achado | Leitura correta | Próximo passo |
| --- | --- | --- |
| Views `marco1_beta_*` sem RLS | Views não carregam RLS próprio como tabelas; isso não prova vazamento nem proteção | revisar grants, definição da view e se ela usa `security_invoker` |
| `user_profiles`: 5 linhas e 3,5 MB | pode ser JSON/TOAST, índices ou espaço morto de testes; o tamanho isolado não diagnostica bloat | conferir colunas e tamanho de índices/TOAST depois da auditoria de permissions |
| `scheduled_tasks`: 1.092 linhas | maior coleção operacional; pode crescer sem limite se histórico não for tratado | definir retenção e métrica mensal antes do rollout |
| Dispatches/eventos/mensagens | `app_runtime_events`, `oracle_message_push_dispatches`, `notification_*` guardam histórico operacional | definir prazo de retenção e rotina de limpeza segura |
| 9 tabelas `backup_*` vazias | não têm custo relevante agora, mas ampliam o schema e podem confundir a deleção de conta | classificar como backup ativo ou legado antes de removê-las em migration futura |
| `account_deletion_requests`: 93 linhas | contém histórico de pedido de exclusão e provavelmente identificadores | definir quem processa, prazo de retenção e como apagar/anonimizar após conclusão |

### 2026-09-29 — policies RLS, página 1 de 100

A extração retornou exatamente 100 linhas e parou alfabeticamente em `moderation_reports`; ela é paginada e ainda **não** permite concluir que todas as tabelas estejam protegidas. Coletar as páginas seguintes é obrigatório.

#### Achados preliminares que precisam de decisão/teste

| Área | Evidência observada | Risco / pergunta a responder |
| --- | --- | --- |
| Pedidos de amizade | remetente **ou** destinatário podem atualizar `friend_requests` | confirmar se o remetente consegue marcar seu próprio pedido como `accepted` e então criar amizade sem aceite alheio; se sim, fechar por RPC ou policy específica |
| Membros de clã | qualquer usuário pode inserir a si mesmo como `member` em `clan_members` | confirmar se clãs são mesmo abertos; se convites/solicitações são obrigatórios, esta policy ignora o fluxo |
| Progresso de missão de clã | qualquer membro pode atualizar `clan_mission_progress` | confirmar se valores de progresso/recompensa podem ser inflados pelo cliente; se puderem, mover a mutação para RPC autorizada |
| Dados de clã | `clans` e `clan_members` têm leitura `true` para `public` | confirmar que nome, membros e campos retornados são intencionalmente públicos e não contêm dados privados |
| Ações e arenas vinculadas | participantes do vínculo podem ler ações/arenas da arena ligada | esperado para mentoria/parceria, mas precisa de teste de ponta a ponta: vínculo encerrado não pode manter acesso |
| Policies duplicadas | `actions`, `arenas`, `asset_slots`, participantes de missão e log de vínculo têm policies sobrepostas | não é falha automática; reduz clareza e aumenta risco de uma policy antiga manter acesso após mudança futura |

As policies de `ALL` com `auth.uid() = user_id` são isolamento por linha, não proteção de coluna. Portanto elas não resolvem por si só a autoridade de EXP, inventário, recompensas ou saldo; isso será cruzado com grants de coluna e RPCs.

### 2026-09-29 — policies RLS, página 2 e conclusão da coleta

O banco retornou **177 policies**: as páginas 1 e 2 completam a listagem. A maior parte segue o padrão correto de restringir a linha a `auth.uid()`. Os itens abaixo exigem ação ou prova antes de abertura pública.

| Prioridade | Achado | Evidência | Ação antes de lançar |
| --- | --- | --- | --- |
| Crítica se o grant confirmar | Perfil inteiro pode ser legível por qualquer conta autenticada | `user_profiles_select` usa somente `auth.role() = 'authenticated'` | conferir grants imediatamente; se houver SELECT, trocar por view pública mínima ou policy por relação; email, preferências, saldo, onboarding e dados internos não podem sair no perfil social |
| Crítica se o grant confirmar | Waitlist pode ser legível anonimamente | `Allow anonymous select for count` usa `SELECT true` para `anon` | conferir grant; se houver SELECT, remover leitura anônima e criar RPC que retorne apenas a contagem, caso a landing precise dela |
| Alta se o grant confirmar | Inventário pode ser gravável diretamente pelo dono | `user_inventory` permite INSERT, UPDATE e DELETE quando `auth.uid() = user_id` | provar que grants/trigger bloqueiam item, raridade e quantidade; se não bloquearem, mover obtenção/consumo/equipamento para RPCs |
| Alta | Vínculo pode ser inserido por um único participante | `relationship_links` aceita INSERT se o chamador for mentor **ou** pupil | conferir constraints/triggers/RPC: o cliente não deve criar vínculo ativo com uma pessoa que nunca aceitou |
| Alta | Atualização de convite de vínculo é permissiva para remetente ou destinatário | `rl_invites_update_sender_or_recipient` | garantir que só o destinatário possa aceitar/recusar; remetente deve no máximo cancelar |
| Alta | Notificações podem ser inseridas por qualquer amigo | policy permite INSERT para relações de amizade | limitar tipo/conteúdo, adicionar rate limit e garantir que usuário não notifique a si mesmo/terceiros de forma abusiva |
| Média | 24 tabelas com RLS ativo não têm policy listada | inclui `account_deletion_requests`, dispatches, logs, preços e configurações internas | provavelmente são servidor-only; confirmar grants. RLS sem policy bloqueia cliente, mas grant amplo ou `SECURITY DEFINER` insegura pode reabrir a porta |

Também houve **schema drift**: a policy `user_profiles_select` ativa no remoto não foi localizada pelo nome nas migrations atuais. Isso significa que o banco tem ao menos uma regra que o repositório não documenta bem o suficiente para reproduzir/revisar. A auditoria de migrations aplicadas e grants é obrigatória.

### 2026-09-29 — grants críticos confirmados

Os grants remotos confirmaram que as três exposições abaixo são efetivas:

| Bloqueador | Grant + policy | Consequência |
| --- | --- | --- |
| Waitlist pública | `anon` tem `SELECT` e a policy permite `SELECT true` | qualquer visitante pode ler todas as linhas que a tabela expõe; não existe limitação para “apenas contagem” |
| Perfil global entre usuários | `authenticated` tem `SELECT` e `user_profiles_select` aceita qualquer sessão autenticada | qualquer jogador autenticado pode ler todas as colunas expostas de todos os perfis; não há RLS por coluna |
| Inventário autogravável | `authenticated` tem INSERT/UPDATE/DELETE e a policy permite a própria `user_id` | cliente autenticado pode tentar criar, alterar ou apagar as próprias linhas de inventário fora dos fluxos do jogo; constraints/triggers ainda precisam definir o alcance exato |

`anon` também tem CRUD em `user_inventory` e `waitlist`, mas as policies de inventário exigem `auth.uid()`, portanto a sessão anônima não passa nessa tabela. O grant amplo continua sendo má prática: aumenta a dependência de cada policy futura estar perfeita.

**Decisão de lançamento:** waitlist e leitura global de perfil precisam ser corrigidas antes de abrir o app publicamente. Inventário precisa ter sua integridade comprovada antes de venda, recompensa valiosa ou competição com valor real.

### Correções em andamento

| Correção | Arquivo | Estado |
| --- | --- | --- |
| Waitlist por menor privilégio | `20260929100000_waitlist_least_privilege.sql` | Aplicada pelo operador em 2026-09-29; confirmar por query que `anon` só tem INSERT e que a RPC retorna somente contagem |
| Fronteira de perfil público | `20260929103000_public_profile_boundary.sql` | Pronta localmente; pendente aplicação remota e teste entre duas contas |
| Pack inicial pelo servidor | `20260929104000_starter_pack_server_only.sql` + `GameContext.tsx` | Pronto localmente; pendente aplicação remota e teste de cadastro novo |

O bootstrap já existia no banco por trigger (`bootstrap_new_player_rewards_for_user`). O antigo fallback do cliente foi substituído por `ensure_my_starter_rewards()`, uma RPC sem parâmetro de usuário que apenas confirma o pack da própria sessão e respeita o marcador idempotente. Ele não concede o baú duas vezes.

## Critérios para fechar a auditoria

- [ ] Cada tabela `public` tem dono, finalidade e permissões anotados.
- [ ] Cada `SECURITY DEFINER` foi revisada para `search_path`, autorização e idempotência.
- [ ] Nenhum `anon` tem leitura/escrita ampla fora do que for explicitamente público.
- [ ] Campos de privilégio e moeda não aceitam alteração direta de usuário autenticado.
- [ ] Exclusão de conta foi percorrida pelos FKs e testada numa conta descartável.
- [ ] Jobs têm dono, frequência, custo esperado e trava contra execução duplicada.
- [ ] Buckets e policies de Storage foram classificados como público ou privado por intenção.
- [ ] A lista de migrations aplicada no remoto foi comparada à pasta local.
- [ ] Cada achado tem uma evidência datada, não apenas uma suposição baseada no frontend.

## Resultado esperado

Ao final haverá uma planilha ou seção complementar por objeto, mas este documento continua sendo o índice: ele deve responder rapidamente **o que é**, **quem pode mexer**, **o que quebra se falhar** e **onde olhar quando der problema**.
