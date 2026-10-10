-- QUANTO A CONTA DO AFONSO PESA NO BANCO (10/10/2026).
--
-- So leitura. Tres blocos: rode UM DE CADA VEZ (o SQL Editor mostra so o
-- resultado do ultimo) e me mande as tres tabelas.
--
-- O que isto NAO mede: o egress. Egress e o que SAI do Supabase pela rede, e ele
-- e medido na porta da API, nao dentro do Postgres — o numero real esta no
-- painel do Supabase, em Usage > Egress. O bloco 1 da a nocao do lado de dentro:
-- carregar TUDO da sua conta de uma vez baixaria mais ou menos esse tanto (um
-- pouco mais, porque o JSON da API e maior que o dado guardado).

-- 1. O QUE E SEU, TABELA POR TABELA --------------------------------------------
with tabelas as (
  select c.table_name, c.column_name
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
  where c.table_schema = 'public'
    and (c.column_name = 'user_id' or (c.table_name = 'user_profiles' and c.column_name = 'id'))
),
medidas as (
  select tb.table_name, x
  from tabelas tb,
  lateral query_to_xml(format(
    'select count(*) as n, coalesce(sum(pg_column_size(t.*)), 0) as b from public.%I t where t.%I::text = %L',
    tb.table_name, tb.column_name, 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
  ), false, true, '') as x
),
linhas as (
  select
    table_name as tabela,
    (xpath('/row/n/text()', x))[1]::text::bigint as linhas,
    (xpath('/row/b/text()', x))[1]::text::bigint as bytes
  from medidas
)
select tabela, linhas, round(bytes / 1024.0, 1) as kb
from linhas
where linhas > 0
union all
select 'TOTAL', sum(linhas), round(sum(bytes) / 1024.0, 1)
from linhas
order by kb desc;

-- 2. O BANCO INTEIRO, E AS 15 TABELAS MAIS PESADAS ------------------------------
select
  c.relname as tabela,
  pg_size_pretty(pg_total_relation_size(c.oid)) as tamanho,
  c.reltuples::bigint as linhas_aprox,
  pg_size_pretty(pg_database_size(current_database())) as banco_inteiro,
  (select count(*) from public.user_profiles) as contas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by pg_total_relation_size(c.oid) desc
limit 15;

-- 3. OS SEUS ARQUIVOS NO STORAGE (foto de perfil, capas, etc.) -------------------
select
  bucket_id as pasta,
  count(*) as arquivos,
  round(coalesce(sum((metadata ->> 'size')::bigint), 0) / 1048576.0, 2) as mb
from storage.objects
where owner = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid
   or name like '%e76e2b7f-a771-4738-a10a-30a993ecafeb%'
group by bucket_id
order by mb desc;
