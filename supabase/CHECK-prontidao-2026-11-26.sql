-- LAUDO DE PRONTIDAO DO GLYPH (26/11/2026) — so le, nao altera nada.
--
-- Uma consulta so, uma linha por sinal vital. Cole no SQL Editor, rode e me
-- mande a tabela inteira. Os limites sao os do plano gratis do Supabase:
--   egress 5 GB/mes · banco 500 MB · storage 1 GB
--
-- O egress daqui e ESTIMADO: o medidor de abertura (shell_ready) conta o JSON
-- descompactado dos primeiros 30 s de cada abertura — teto, nao a fatura. O
-- numero oficial fica em Settings > Usage do painel; compare os dois.

with
aberturas as (
  select user_id, created_at,
         nullif(metadata ->> 'egress_anterior_kb', '')::numeric as kb
  from public.app_runtime_events
  where event_name = 'shell_ready'
    and created_at > now() - interval '30 days'
),
erros as (
  select count(*) as n, count(distinct user_id) as pessoas
  from public.app_runtime_events
  where event_name = 'boot_error' and created_at > now() - interval '30 days'
),
medida as (
  select count(*) as aberturas,
         count(distinct user_id) as ativos_30d,
         count(distinct user_id) filter (where created_at > now() - interval '7 days') as ativos_7d,
         avg(kb) as kb_medio,
         percentile_cont(0.9) within group (order by kb) as kb_p90,
         coalesce(sum(kb), 0) as kb_total
  from aberturas
),
feed as (
  -- O feed social e rebaixado a cada 2 min com o app aberto (80 linhas).
  select coalesce(sum(octet_length(to_jsonb(t)::text)), 0) / 1024.0 as kb
  from (select id, user_id, event_type, author_nickname, author_avatar_url,
               author_clan_name, author_clan_icon, content, created_at
        from public.social_feed_events order by created_at desc limit 80) t
),
banco as (
  select pg_database_size(current_database()) / 1048576.0 as mb
),
entulho as (
  select coalesce(pg_total_relation_size(to_regclass('cron.job_run_details')), 0) / 1048576.0 as cron_mb,
         coalesce(pg_total_relation_size(to_regclass('net._http_response')), 0) / 1048576.0 as net_mb
),
maiores as (
  select c.oid::regclass::text as tabela,
         pg_total_relation_size(c.oid) / 1048576.0 as mb,
         row_number() over (order by pg_total_relation_size(c.oid) desc) as pos
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r' and n.nspname not in ('pg_catalog', 'information_schema')
),
arquivos as (
  select bucket_id, count(*) as n,
         coalesce(sum((metadata ->> 'size')::bigint), 0) / 1048576.0 as mb
  from storage.objects group by bucket_id
),
contas as (
  select count(*) as n,
         count(*) filter (where created_at > now() - interval '30 days') as novas_30d
  from auth.users
),
laudo(ordem, area, sinal, valor, limite, estado) as (
  select 10, 'egress', 'aberturas medidas (30 dias)', m.aberturas::text, '—', '—' from medida m
  union all
  select 11, 'egress', 'pessoas ativas 7d / 30d', m.ativos_7d || ' / ' || m.ativos_30d, '—', '—' from medida m
  union all
  select 12, 'egress', 'KB por abertura (media / p90)',
         round(coalesce(m.kb_medio, 0), 1) || ' / ' || round(coalesce(m.kb_p90, 0)::numeric, 1), '—',
         case when m.kb_medio is null then 'sem medida'
              when m.kb_medio > 400 then 'PESADO' when m.kb_medio > 150 then 'atencao' else 'ok' end
  from medida m
  union all
  select 13, 'egress', 'aberturas: MB nos ultimos 30 dias', round(m.kb_total / 1024.0, 1)::text, '5120',
         case when m.kb_total / 1024.0 > 2500 then 'PERTO DO TETO' when m.kb_total / 1024.0 > 1200 then 'atencao' else 'ok' end
  from medida m
  union all
  select 14, 'egress', 'feed social: KB por recarga (2 em 2 min)', round(f.kb, 1)::text, '—',
         case when f.kb > 60 then 'atencao' else 'ok' end
  from feed f
  union all
  select 15, 'egress', 'ativos/dia que cabem em 5 GB (abertura media x 3/dia, +100% de folga)',
         case when coalesce(m.kb_medio, 0) = 0 then '—'
              else floor(5120.0 * 1024 / (m.kb_medio * 3 * 30 * 2))::text end, '—', '—'
  from medida m
  union all
  select 20, 'banco', 'tamanho total (MB)', round(b.mb, 1)::text, '500',
         case when b.mb > 400 then 'PERTO DO TETO' when b.mb > 250 then 'atencao' else 'ok' end
  from banco b
  union all
  select 21, 'banco', 'historico do pg_cron (MB) — volta a crescer sozinho', round(e.cron_mb, 1)::text, '—',
         case when e.cron_mb > 50 then 'LIMPAR' when e.cron_mb > 15 then 'atencao' else 'ok' end
  from entulho e
  union all
  select 22, 'banco', 'respostas do pg_net (MB)', round(e.net_mb, 1)::text, '—',
         case when e.net_mb > 30 then 'LIMPAR' else 'ok' end
  from entulho e
  union all
  select 23 + x.pos::int, 'banco', 'maior tabela #' || x.pos || ': ' || x.tabela, round(x.mb, 1)::text, '—', '—'
  from maiores x where x.pos <= 5
  union all
  select 30, 'storage', 'total (MB)', round(coalesce(sum(a.mb), 0), 1)::text, '1024',
         case when coalesce(sum(a.mb), 0) > 800 then 'PERTO DO TETO' when coalesce(sum(a.mb), 0) > 500 then 'atencao' else 'ok' end
  from arquivos a
  union all
  select 31, 'storage', 'bucket ' || a.bucket_id || ' (' || a.n || ' arquivos)', round(a.mb, 1)::text, '—', '—'
  from arquivos a
  union all
  select 40, 'contas', 'contas / novas em 30 dias', c.n || ' / ' || c.novas_30d, '50000 MAU', 'ok' from contas c
  union all
  -- Tres tabelas de disparo nasceram sem RLS e sem REVOKE nas migracoes. Para
  -- estranho (anon) ja dao 401; aqui se ve se quem esta LOGADO le tudo de todos.
  select 45, 'seguranca', 'tabela ' || c.relname || ': RLS / logado le?',
         (case when c.relrowsecurity then 'RLS on' else 'RLS off' end) || ' / ' ||
         (case when has_table_privilege('authenticated', c.oid, 'select') then 'le' else 'nao le' end),
         '—',
         case when not c.relrowsecurity and has_table_privilege('authenticated', c.oid, 'select') then 'ABERTA' else 'ok' end
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('action_reminder_dispatches', 'notification_push_dispatches', 'oracle_message_push_dispatches')
  union all
  select 46, 'seguranca', 'outras tabelas do public com RLS desligado',
         coalesce(string_agg(c.relname, ', '), 'nenhuma'), '—',
         case when count(*) = 0 then 'ok' else 'OLHAR' end
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
    and c.relname not in ('action_reminder_dispatches', 'notification_push_dispatches', 'oracle_message_push_dispatches')
  union all
  select 50, 'saude', 'erros de abertura (boot_error) em 30 dias', e.n || ' (' || e.pessoas || ' pessoas)', '—',
         case when e.n = 0 then 'ok' when e.n < 10 then 'atencao' else 'OLHAR' end
  from erros e
)
select area, sinal, valor, limite, estado
from laudo
order by ordem;
