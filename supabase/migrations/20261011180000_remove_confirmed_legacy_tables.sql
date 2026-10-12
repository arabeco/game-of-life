-- Escopo aprovado em 11/10/2026: nove backups + user_assets + handle_new_user().
-- Não toca asset_levels, asset_slots, assets, competições ou filas de renderização.
-- Executar inteiro. Dados novos ou dependências encontradas abortam a transação.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $cleanup$
DECLARE
  targets constant text[] := ARRAY[
    'backup_cycles_orphans_20260315',
    'backup_daily_commitments_orphans_20260315',
    'backup_oracle_preferences_orphans_20260315',
    'backup_scheduled_tasks_orphans_20260315',
    'backup_sitrep_reports_orphans_20260315',
    'backup_user_assets_orphans_20260315',
    'backup_user_inventory_20260312',
    'backup_user_profiles_items_20260312',
    'backup_user_profiles_orphans_20260315',
    'user_assets'
  ];
  target text;
  has_rows boolean;
  has_job boolean;
  old_function oid := to_regprocedure('public.handle_new_user()');
BEGIN
  IF old_function IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgfoid = old_function
  ) THEN
    RAISE EXCEPTION 'Limpeza cancelada: handle_new_user ainda possui gatilho.';
  END IF;

  -- Bloqueia escrita antes da conferência; nenhum registro será descartado.
  FOREACH target IN ARRAY targets LOOP
    IF to_regclass(format('public.%I', target)) IS NOT NULL THEN
      EXECUTE format('LOCK TABLE public.%I IN ACCESS EXCLUSIVE MODE', target);
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I LIMIT 1)', target) INTO has_rows;
      IF has_rows THEN
        RAISE EXCEPTION 'Limpeza cancelada: public.% contém dados.', target;
      END IF;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND p.oid IS DISTINCT FROM old_function
        AND strpos(lower(p.prosrc), target) > 0
    ) THEN
      RAISE EXCEPTION 'Limpeza cancelada: outra rotina menciona %.', target;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname NOT IN ('pg_catalog','information_schema')
      AND p.oid IS DISTINCT FROM old_function
      AND strpos(lower(p.prosrc), 'handle_new_user') > 0
  ) THEN
    RAISE EXCEPTION 'Limpeza cancelada: outra rotina menciona handle_new_user.';
  END IF;

  IF to_regclass('cron.job') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (
      SELECT 1 FROM cron.job j, unnest($1::text[]) target
      WHERE strpos(lower(j.command), target) > 0
    )' INTO has_job USING array_append(targets, 'handle_new_user');
    IF has_job THEN
      RAISE EXCEPTION 'Limpeza cancelada: há agendamento mencionando um alvo.';
    END IF;
  END IF;

  EXECUTE 'DROP FUNCTION IF EXISTS public.handle_new_user() RESTRICT';
  FOREACH target IN ARRAY targets LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I RESTRICT', target);
  END LOOP;
END;
$cleanup$;
COMMIT;

SELECT 'Limpeza concluída: somente os dez alvos e a função antiga.' AS resultado;
