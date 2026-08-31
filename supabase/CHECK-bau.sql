-- CHECAGEM — só lê, não altera nada. Pode rodar à vontade.
--
-- Confere se o terreno é o que a migração do baú espera. Ela errou o nome da
-- tabela na primeira tentativa (`profiles` em vez de `user_profiles`), então
-- vale conferir o resto antes de rodar de novo.
--
-- Espere ver: 4 linhas, todas com "OK".

select
  'tabela user_profiles' as verificacao,
  case when to_regclass('public.user_profiles') is not null
       then 'OK' else 'FALTA — a migração vai abortar' end as resultado,
  coalesce(to_regclass('public.user_profiles')::text, '(não existe)') as detalhe

union all

-- A coluna precisa ser jsonb com a chave "fragments": a função lê
-- (wallet->>'fragments')::integer e grava com jsonb_set.
select
  'coluna wallet é jsonb',
  case when exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_profiles'
      and column_name = 'wallet' and data_type = 'jsonb'
  ) then 'OK' else 'FALTA ou não é jsonb' end,
  coalesce((
    select data_type from information_schema.columns
    where table_schema = 'public' and table_name = 'user_profiles' and column_name = 'wallet'
  ), '(sem coluna wallet)')

union all

-- grant_chest não nasceu numa migração deste repositório, então o tipo exato
-- dos parâmetros não está versionado. O detalhe mostra a assinatura real: a
-- migração chama por NOME de parâmetro (p_user_id, p_chest_type), então esses
-- dois nomes precisam aparecer aí.
select
  'função grant_chest',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'grant_chest'
  ) then 'OK' else 'FALTA — sem ela o baú não é concedido' end,
  coalesce((
    select string_agg(format('grant_chest(%s)', pg_get_function_arguments(p.oid)), ' | ')
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'grant_chest'
  ), '(não existe)')

union all

-- Se já existir, rodar de novo é `create or replace` e apenas substitui.
select
  'buy_chest_with_fragments',
  case when exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'buy_chest_with_fragments'
  ) then 'JÁ EXISTE — rodar de novo só substitui' else 'ainda não existe (esperado)' end,
  coalesce((
    select pg_get_function_arguments(p.oid)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'buy_chest_with_fragments'
    limit 1
  ), '—');
