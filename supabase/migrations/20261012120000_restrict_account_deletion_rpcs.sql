-- Corrige grants explícitos vistos no diagnóstico oficial de 12/10.
-- REVOKE de PUBLIC sozinho não remove grants de anon/authenticated.
-- Não exclui dados nem altera o corpo das funções.
BEGIN;
DO $permissions$
DECLARE
  target text;
  targets constant text[] := ARRAY[
    'public.delete_account_data_for_user(uuid)',
    'public._delete_public_rows_by_common_user_columns(uuid)',
    'public._delete_public_rows_if_any_uuid_match(text,text[],uuid)',
    'public._delete_public_rows_if_uuid_match(text,text,uuid)',
    'public.list_account_storage_objects(uuid)',
    'public.register_deleted_account_block(text,uuid,text,text,jsonb)',
    'public.release_golden_invite_claim_for_user(uuid)'
  ];
BEGIN
  FOREACH target IN ARRAY targets LOOP
    -- Ausência inesperada aborta; não declarar sucesso parcial.
    IF to_regprocedure(target) IS NULL THEN
      RAISE EXCEPTION 'Função esperada ausente: %', target;
    END IF;
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', target);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', target);
    IF has_function_privilege('anon', target, 'EXECUTE')
      OR has_function_privilege('authenticated', target, 'EXECUTE')
      OR NOT has_function_privilege('service_role', target, 'EXECUTE') THEN
      RAISE EXCEPTION 'Permissões inesperadas após correção: %', target;
    END IF;
  END LOOP;
END;
$permissions$;
COMMIT;

SELECT p.oid::regprocedure::text AS funcao,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_pode_executar,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS usuario_pode_executar,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS servidor_pode_executar
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN (
  'delete_account_data_for_user', '_delete_public_rows_by_common_user_columns',
  '_delete_public_rows_if_any_uuid_match', '_delete_public_rows_if_uuid_match',
  'list_account_storage_objects', 'register_deleted_account_block',
  'release_golden_invite_claim_for_user'
)
ORDER BY funcao;
