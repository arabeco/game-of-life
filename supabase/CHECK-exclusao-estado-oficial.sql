-- Somente leitura: estrutura e rotinas instaladas, sem dados de contas.
-- Executar inteiro e compartilhar a coluna diagnostico.
WITH targets AS (
  SELECT unnest(ARRAY[
    'account_deletion_requests',
    'account_deletion_web_requests',
    'notification_email_dispatches',
    'deleted_account_blocks'
  ]) AS nome
), tabelas AS (
  SELECT t.nome,
    to_regclass(format('public.%I', t.nome)) IS NOT NULL AS existe,
    c.relrowsecurity AS rls,
    (SELECT jsonb_agg(jsonb_build_object(
      'nome', a.column_name, 'tipo', a.data_type,
      'nullable', a.is_nullable, 'padrao', a.column_default
    ) ORDER BY a.ordinal_position)
      FROM information_schema.columns a
      WHERE a.table_schema='public' AND a.table_name=t.nome) AS colunas,
    (SELECT jsonb_agg(jsonb_build_object(
      'nome', con.conname, 'definicao', pg_get_constraintdef(con.oid)
    )) FROM pg_constraint con WHERE con.conrelid=c.oid) AS restricoes,
    (SELECT jsonb_agg(jsonb_build_object(
      'nome', p.policyname, 'operacao', p.cmd, 'papeis', p.roles,
      'using', p.qual, 'check', p.with_check
    )) FROM pg_policies p
      WHERE p.schemaname='public' AND p.tablename=t.nome) AS politicas,
    (SELECT jsonb_agg(jsonb_build_object(
      'papel', g.grantee, 'permissao', g.privilege_type
    )) FROM information_schema.role_table_grants g
      WHERE g.table_schema='public' AND g.table_name=t.nome) AS permissoes,
    (SELECT jsonb_agg(pg_get_triggerdef(tr.oid)) FROM pg_trigger tr
      WHERE tr.tgrelid=c.oid AND NOT tr.tgisinternal) AS gatilhos
  FROM targets t LEFT JOIN pg_class c
    ON c.oid=to_regclass(format('public.%I', t.nome))
), funcoes AS (
  SELECT p.oid::regprocedure::text AS assinatura,
    p.prosecdef AS security_definer,
    p.proacl::text AS permissoes,
    pg_get_functiondef(p.oid) AS definicao
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prokind='f'
    AND p.proname IN (
      'delete_account_data_for_user', 'list_account_storage_objects',
      '_delete_public_rows_by_common_user_columns',
      '_delete_public_rows_if_any_uuid_match', '_delete_public_rows_if_uuid_match',
      'register_deleted_account_block', 'release_golden_invite_claim_for_user'
    )
)
SELECT jsonb_build_object(
  'tabelas', (SELECT jsonb_agg(to_jsonb(t)) FROM tabelas t),
  'funcoes', (SELECT jsonb_agg(to_jsonb(f)) FROM funcoes f)
) AS diagnostico;
