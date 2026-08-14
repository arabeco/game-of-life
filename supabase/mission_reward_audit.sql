-- Auditoria somente de leitura para desafios, insignias e baus.
-- Execute no SQL Editor do Supabase. Nenhuma linha e alterada.

with expected_functions(name) as (
  values ('grant_chest'), ('open_chest')
)
select
  'funcoes_de_bau' as verificacao,
  ef.name as item,
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = ef.name
  ) as ok
from expected_functions ef

union all

select
  'rls_user_inventory',
  'user_inventory',
  coalesce(c.relrowsecurity, false)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'user_inventory'

union all

select
  'duplicidade_permitida',
  'user_inventory(user_id,item_id)',
  not exists (
    select 1
    from pg_index i
    join pg_class rel on rel.oid = i.indrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public'
      and rel.relname = 'user_inventory'
      and i.indisunique
      and (
        select array_agg(a.attname::text order by a.attname::text)
        from unnest(i.indkey) key(attnum)
        join pg_attribute a on a.attrelid = rel.oid and a.attnum = key.attnum
      ) = array['item_id', 'user_id']::text[]
  );

select
  item_id,
  count(*) as unidades,
  count(distinct user_id) as usuarios,
  count(*) - count(distinct user_id) as copias_acumuladas
from public.user_inventory
where item_id like 'insignia_quest_%'
   or item_id like 'insignia_report_%'
group by item_id
order by item_id;

select
  count(distinct user_id) as usuarios_com_baus,
  count(*) as baus_guardados
from public.user_chests
where is_opened = false;
