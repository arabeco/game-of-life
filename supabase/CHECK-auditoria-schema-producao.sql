-- AUDITORIA DE SCHEMA DO GLYPH — SOMENTE LEITURA
--
-- Rode no SQL Editor do projeto klmsdcncmhtgnlcejzdi.
-- Não cria, altera ou apaga nada. Cada bloco devolve uma parte do inventário.
-- Exporte os resultados em CSV ou cole-os aqui; o documento
-- docs/AUDITORIA-SCHEMA-LANCAMENTO.md será preenchido com o estado real.

-- 1. Identidade e versão. Confirma que a investigação aconteceu no banco certo.
select
  current_database() as banco,
  current_user as usuario_sql,
  version() as postgres,
  now() as auditado_em_utc;

-- 2. Tabelas e views expostas pelo schema public, com RLS e tamanho aproximado.
select
  c.relkind as tipo, -- r=tabela, p=partitioned table, v=view, m=materialized view
  n.nspname as schema,
  c.relname as objeto,
  coalesce(s.n_live_tup, 0) as linhas_estimadas,
  pg_size_pretty(pg_total_relation_size(c.oid)) as tamanho_total,
  coalesce(pc.relrowsecurity, false) as rls_ativo,
  coalesce(pc.relforcerowsecurity, false) as rls_forcado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_stat_user_tables s on s.relid = c.oid
left join pg_class pc on pc.oid = c.oid
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm')
order by c.relkind, c.relname;

-- 3. Todas as colunas, defaults e nulabilidade. Este é o dicionário bruto.
select
  table_schema as schema,
  table_name as tabela,
  ordinal_position as posicao,
  column_name as coluna,
  data_type,
  udt_name as tipo_interno,
  is_nullable as aceita_nulo,
  column_default as padrao,
  is_identity,
  is_generated
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- 4. Chaves, checks, únicos e referências. Fundamental para deleção e integridade.
select
  n.nspname as schema,
  c.relname as tabela,
  con.conname as nome,
  case con.contype
    when 'p' then 'primary_key'
    when 'f' then 'foreign_key'
    when 'u' then 'unique'
    when 'c' then 'check'
    when 'x' then 'exclude'
  end as tipo,
  pg_get_constraintdef(con.oid, true) as regra
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
order by c.relname, tipo, con.conname;

-- 5. Grafo de foreign keys: quem depende de quem e o comportamento ao deletar.
select
  tc.table_name as tabela_filha,
  kcu.column_name as coluna_filha,
  ccu.table_name as tabela_pai,
  ccu.column_name as coluna_pai,
  rc.delete_rule as ao_deletar,
  rc.update_rule as ao_atualizar,
  tc.constraint_name as constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.referential_constraints rc
  on tc.constraint_name = rc.constraint_name
 and tc.table_schema = rc.constraint_schema
join information_schema.constraint_column_usage ccu
  on rc.unique_constraint_name = ccu.constraint_name
 and rc.unique_constraint_schema = ccu.constraint_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
order by tabela_pai, tabela_filha, coluna_filha;

-- 6. Todas as policies RLS, inclusive expressões de leitura e escrita.
select
  schemaname as schema,
  tablename as tabela,
  policyname as policy,
  roles,
  cmd as operacao,
  qual as usando,
  with_check as ao_escrever
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 7. Grants efetivos em tabelas. Anon e authenticated merecem revisão humana.
select
  table_schema as schema,
  table_name as tabela,
  grantee,
  privilege_type as privilegio
from information_schema.role_table_grants
where table_schema = 'public'
order by table_name, grantee, privilege_type;

-- 8. Grants por coluna. Revela campos protegidos, como saldo e premium.
select
  table_schema as schema,
  table_name as tabela,
  column_name as coluna,
  grantee,
  privilege_type as privilegio
from information_schema.column_privileges
where table_schema = 'public'
order by table_name, column_name, grantee, privilege_type;

-- 9. Índices: procura queries grandes sem índice e índices duplicados.
-- Mantido na forma crua para funcionar também no SQL Editor gerenciado.
select *
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 10. Funções/RPCs públicas: autoridade, dono, segurança e assinatura.
select
  n.nspname as schema,
  p.proname as funcao,
  pg_get_function_identity_arguments(p.oid) as argumentos,
  pg_get_function_result(p.oid) as retorno,
  pg_get_userbyid(p.proowner) as dono,
  p.prosecdef as security_definer,
  p.provolatile as volatilidade,
  array_to_string(p.proconfig, ', ') as configuracao,
  coalesce(array_agg(distinct x.grantee order by x.grantee)
    filter (where x.privilege_type = 'EXECUTE'), '') as executavel_por
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
left join information_schema.routine_privileges x
  on x.routine_schema = n.nspname
 and x.routine_name = p.proname
where n.nspname = 'public'
group by n.nspname, p.oid
order by p.proname, argumentos;

-- 11. Corpo das funções SECURITY DEFINER. Revise search_path e auth.uid().
select
  p.proname as funcao,
  pg_get_function_identity_arguments(p.oid) as argumentos,
  pg_get_functiondef(p.oid) as definicao
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef = true
order by p.proname, argumentos;

-- 12. Triggers ativos. Eles são parte do schema que migrations costumam esconder.
select
  n.nspname as schema,
  c.relname as tabela,
  t.tgname as trigger,
  pg_get_triggerdef(t.oid, true) as definicao,
  p.proname as funcao
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where n.nspname = 'public'
  and not t.tgisinternal
order by c.relname, t.tgname;

-- 13. Extensões. Informa dependências de cron, UUID, HTTP e agendamento.
select extname as extensao, extversion as versao, extnamespace::regnamespace as schema
from pg_extension
order by extname;

-- 14. Buckets de Storage e exposição pública. Não devolve arquivos de usuários.
select id as bucket, name, public as publico, file_size_limit, allowed_mime_types, created_at, updated_at
from storage.buckets
order by id;

-- 15. Policies de Storage. Um bucket privado com policy pública ainda vaza.
select schemaname as schema, tablename as tabela, policyname as policy, roles, cmd as operacao, qual as usando, with_check as ao_escrever
from pg_policies
where schemaname = 'storage'
order by tablename, cmd, policyname;

-- 16. Histórico de migrations realmente aplicado. Se esta query falhar, anote isso:
-- a visualização pode não estar exposta ao papel do SQL Editor do projeto.
select version, name, statements, inserted_at
from supabase_migrations.schema_migrations
order by version;

-- 17. Jobs pg_cron. Pode falhar se a extensão não estiver habilitada; isso também é dado.
select jobid, schedule, command, database, username, active, jobname
from cron.job
order by jobid;

-- 18. Últimas execuções de jobs. Ajuda a localizar repetição/falhas, sem alterar nada.
select jobid, runid, status, return_message, start_time, end_time
from cron.job_run_details
order by start_time desc
limit 200;
