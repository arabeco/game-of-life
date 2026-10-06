-- AS REGRAS SECRETAS DE BORDA E BANNER: O QUE O BANCO TEM PARA MEDIR CADA UMA.
-- So leitura: nada aqui grava.
--
-- Antes de escrever o medidor das dez regras de constants/desbloqueiosPorRegra.ts,
-- tres perguntas precisam de resposta do banco de verdade, e nao do andaime:
--
--   1. as colunas e chaves que cada regra leria existem com estes nomes?
--   2. a loja e o bau podem deixar de oferecer as pecas so com dado, sem
--      reescrever open_chest e buy_store_item?
--   3. com os numeros da conta principal, os limiares fazem sentido?
--
-- Conta: misterxhermit. Um resultado so, em linhas, lido de cima para baixo.
with
eu as (
  select 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid as id
),
pecas_de_regra(regra, item_id) as (
  values
    ('Disciplinado', 'item_border_1_002'), ('Disciplinado', 'item_banner_disciplinado'),
    ('Popular', 'item_border_2_001'), ('Popular', 'item_banner_popular'),
    ('Veterano', 'item_border_t2_veterano'), ('Veterano', 'item_banner_t2_veterano'),
    ('Imparavel', 'item_border_3_001'), ('Imparavel', 'item_banner_imparavel'),
    ('Mistico', 'item_border_t3_mistico'), ('Mistico', 'item_banner_t3_mistico'),
    ('Transcendente', 'item_border_t3_transcendente'), ('Transcendente', 'item_banner_t4_transcendente'),
    ('Celestial', 'item_border_t4_celestial'), ('Celestial', 'item_banner_t4_celestial'),
    ('Guardia', 'item_border_t4_guardia'), ('Guardia', 'item_banner_t4_guardia'),
    ('Oraculo', 'item_border_t4_oraculo'), ('Oraculo', 'item_banner_t4_oraculo'),
    ('Lenda Viva', 'item_border_4_001'), ('Lenda Viva', 'item_banner_lendaviva')
),
-- Os relatorios gravam as metricas em snake_case, mas nem todo relatorio antigo
-- passou pelo mesmo conversor: le os dois nomes.
fechados as (
  select
    c.end_date,
    (c.end_date - c.start_date + 1) as dias,
    nullif(coalesce(c.report_data->'metrics'->>'actions_completed', c.report_data->'metrics'->>'actionsCompleted'), '')::numeric as feitas,
    nullif(coalesce(c.report_data->'metrics'->>'total_planned_actions', c.report_data->'metrics'->>'totalPlannedActions'), '')::numeric as planejadas
  from public.cycles c, eu
  where c.user_id = eu.id and c.report_data is not null
),
-- A sequencia como o relatorio a conta: dias seguidos com ao menos uma acao
-- concluida, pela data da tarefa.
dias_com_acao as (
  select distinct left(st.date, 10)::date as dia
  from public.scheduled_tasks st, eu
  where st.user_id = eu.id
    and coalesce(st.completed, false)
    and st.date ~ '^\d{4}-\d{2}-\d{2}'
),
sequencias as (
  select count(*) as tamanho, min(dia) as de, max(dia) as ate
  from (select dia, dia - (row_number() over (order by dia))::int as grupo from dias_com_acao) ilhas
  group by grupo
),
mentorias as (
  select l.ended_at, l.expires_at
  from public.relationship_links l, eu
  where l.link_type = 'mentoria' and l.mentor_id = eu.id
),
funcoes as (
  select p.proname, pg_get_functiondef(p.oid) as def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('open_chest', 'buy_store_item')
)
select ordem, o_que, detalhe
from (
  -- ------------------------------------------------- 1. os nomes existem?
  select 1 as ordem, 'colunas: ' || t.tabela as o_que,
    coalesce(string_agg(c.column_name || ' ' || c.data_type, ', ' order by c.ordinal_position), '(TABELA NAO EXISTE)') as detalhe
  from (values ('friends'), ('relationship_links'), ('user_purchases'), ('arenas'), ('scheduled_tasks')) t(tabela)
  left join information_schema.columns c on c.table_schema = 'public' and c.table_name = t.tabela
  group by t.tabela
  union all
  select 2, 'chaves de report_data.metrics (ciclo fechado mais recente)',
    coalesce((
      select string_agg(k, ', ' order by k)
      from public.cycles c, eu, jsonb_object_keys(case when jsonb_typeof(c.report_data->'metrics') = 'object' then c.report_data->'metrics' end) k
      where c.id = (select c2.id from public.cycles c2 where c2.user_id = eu.id and c2.report_data is not null order by c2.end_date desc limit 1)
    ), '(sem ciclo fechado)')

  -- ------------------------------------- 2. loja e bau, so com dado?
  union all
  select 3, 'filtro por is_rank_exclusive: ' || f.proname,
    case when f.def ilike '%is_rank_exclusive%' then 'sim' else 'NAO' end
    || case when f.def ilike '%gold_price%' then ' · le gold_price' else '' end
  from funcoes f
  union all
  select 4, 'pecas de regra em public.items',
    coalesce(string_agg(
      r.item_id || ' [ouro ' || coalesce(i.gold_price::text, '-')
      || ', rank ' || coalesce(i.is_rank_exclusive::text, '-')
      || ', vivo ' || coalesce(i.is_live_in_game::text, '-') || ']',
      ', ' order by r.regra, r.item_id), '-')
    || case when count(i.id) < count(*) then ' · FALTAM ' || (count(*) - count(i.id))::text || ' no banco' else '' end
  from pecas_de_regra r
  left join public.items i on i.id = r.item_id
  union all
  select 5, 'quem ja tem pecas de regra (todas as contas)',
    count(distinct ui.user_id)::text || ' contas, ' || count(*)::text || ' linhas'
  from public.user_inventory ui
  where ui.item_id in (select item_id from pecas_de_regra)
  union all
  select 6, 'policies de user_purchases',
    coalesce((select string_agg(policyname || ' (' || cmd || ')', ', ')
              from pg_policies where schemaname = 'public' and tablename = 'user_purchases'), '(nenhuma)')

  -- ------------------------------- 3. os numeros da conta principal
  union all
  select 10, 'Disciplinado: ciclos fechados com 100%',
    count(*) filter (where planejadas > 0 and feitas >= planejadas)::text || ' de ' || count(*)::text
    || coalesce(' — ' || string_agg(end_date::text || ' (' || dias || 'd, ' || feitas || '/' || planejadas || ')', ', ' order by end_date)
        filter (where planejadas > 0 and feitas >= planejadas), '')
  from fechados
  union all
  select 11, 'Popular: amizades',
    (select count(*)::text from public.friends f, eu where f.user_id = eu.id)
  union all
  select 12, 'Veterano: meses distintos com ciclo fechado',
    count(distinct to_char(end_date, 'YYYY-MM'))::text
    || coalesce(' — ' || string_agg(distinct to_char(end_date, 'YYYY-MM'), ', '), '')
  from fechados
  union all
  select 13, 'Imparavel: maior sequencia de dias com acao',
    coalesce((select tamanho::text || ' dias (' || de || ' a ' || ate || ')' from sequencias order by tamanho desc, ate desc limit 1), '0')
  union all
  select 14, 'Transcendente: ciclos com 100+ planejadas e 90%+',
    count(*) filter (where planejadas >= 100 and feitas >= planejadas * 0.9)::text
    || ' · maior ciclo: ' || coalesce(max(planejadas)::text, '0') || ' planejadas'
  from fechados
  union all
  select 15, 'Guardia: mentorias como mentor',
    count(*)::text || ' no total; '
    || count(*) filter (where expires_at <= now() and (ended_at is null or ended_at >= expires_at))::text || ' chegaram ao fim do prazo; '
    || count(*) filter (where ended_at is not null and (expires_at is null or ended_at < expires_at))::text || ' encerradas antes; '
    || count(*) filter (where ended_at is null and (expires_at is null or expires_at > now()))::text || ' vivas'
  from mentorias
  union all
  select 16, 'Oraculo: pactos de arena reclamados',
    (select count(*)::text from public.user_purchases up, eu where up.user_id = eu.id and up.product_type = 'arena_pact')
  union all
  select 17, 'Lenda Viva: acoes concluidas na vida',
    (select count(*)::text from public.scheduled_tasks st, eu where st.user_id = eu.id and coalesce(st.completed, false))
) resultado
order by ordem, o_que;
