-- CONFERE OS DOIS SQLs DO EGRESS DE ABERTURA (12/10/2026).
--
-- So leitura. Rode DEPOIS dos dois:
--   1. 20261012170000_impressao_do_relatorio.sql
--   2. 20261012190000_perfil_de_abertura.sql
-- Tudo tem de dar true. Se der "function ... does not exist", o 2 nao foi rodado.
--
-- O perfil e lido como se fosse o app da conta do Afonso (o set_config faz o
-- auth.uid() valer o id dele so durante esta consulta).

with eu as (select 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid as id),
sessao as (
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', (select id from eu), 'role', 'authenticated')::text,
    true
  ) as s
),
perfil as (
  select public.meu_perfil_de_abertura() as p from sessao where sessao.s is not null
)
select
  to_regprocedure('public.report_hash(public.cycles)') is not null as "1_impressao_existe",
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.report_hash(public.cycles)'), 'execute'), false) as "1_app_pode_ler",
  (select count(*) > 0 and count(*) = count(c.report_hash)
   from public.cycles c, eu
   where c.user_id::text = eu.id::text and c.report_data is not null) as "1_todo_relatorio_tem_impressao",
  to_regprocedure('public.meu_perfil_de_abertura()') is not null as "2_perfil_existe",
  coalesce(has_function_privilege('authenticated', to_regprocedure('public.meu_perfil_de_abertura()'), 'execute'), false) as "2_app_pode_ler",
  (select (p ->> 'id') = (select id::text from eu) from perfil) as "2_devolve_seu_perfil",
  (select not (p ? 'garden_state') from perfil) as "2_sem_o_jardim",
  (select (select count(*) from jsonb_object_keys(p))
        = (select count(*) - 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'user_profiles')
   from perfil) as "2_todas_as_outras_colunas";
