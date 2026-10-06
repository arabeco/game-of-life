-- Diagnostico dos tres vinculos. Execute tudo no SQL Editor do Supabase.
-- Somente leitura: nao chama RPCs, nao cobra ouro e nao finaliza duelos.
-- Copie/exporte TODAS as linhas do resultado (inclusive as funcoes).
-- Datas em UTC; a coleta identifica o instante usado para avaliar expiracao.  
BEGIN TRANSACTION READ ONLY;
SET LOCAL TIME ZONE 'UTC';

WITH
param AS (SELECT 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid AS uid),
links AS (
  SELECT l.*, to_jsonb(l) AS doc
  FROM public.relationship_links l, param p
  WHERE l.mentor_id = p.uid OR l.pupil_id = p.uid
),
shares AS (
  SELECT s.*, to_jsonb(s) AS doc
  FROM public.relationship_link_arenas s
  JOIN links l ON l.id = s.relationship_link_id
),
arena_ids AS (
  SELECT arena_id AS id FROM shares
  UNION
  SELECT (doc->>'arena_id')::uuid FROM links
  WHERE nullif(doc->>'arena_id', '') IS NOT NULL
),
function_names(name) AS (VALUES
  ('relationship_link_price'), ('relationship_link_is_live'),
  ('share_relationship_arena'), ('remove_relationship_arena_share'),
  ('select_my_mentorship_arena'), ('mark_relationship_arena_completed'),
  ('create_relationship_link_invite'), ('respond_relationship_link_invite'),
  ('create_competition_invite'), ('create_competition_challenge'),
  ('propose_competition_challenge'), ('respond_competition_challenge'),
  ('cancel_competition_challenge'), ('resolve_competition_challenge_outcome'),
  ('offer_mentorship_arena'), ('respond_mentorship_offer'),
  ('buy_relationship_capacity_slot'),
  ('renew_relationship_link'), ('end_relationship_link'),
  ('_relationship_start_link'), ('_relationship_get_invite_cost'),
  ('_competition_compute_arena_progress_at'), ('_competition_finalize_challenge'),
  ('finalize_due_competition_challenges'), ('set_scheduled_task_completed_at'),
  ('expire_stale_relationship_link_invites'), ('get_relationship_capacity_summary')
),
installed_functions AS (
  SELECT p.* FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
),
report AS (
  SELECT '00_coleta'::text AS diagnostico, jsonb_build_object(
    'usuario', p.uid, 'agora', now(), 'fuso_sessao', current_setting('TimeZone'),
    'vinculos_incluindo_encerrados', (SELECT count(*) FROM links),
    'cron_instalado', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'),
    'nota', 'Contagens de tarefas abaixo sao historicas, nao a nota do ciclo.'
  ) AS dados FROM param p

  UNION ALL
  SELECT '01_vinculo/' || l.id, (l.doc - 'arena_snapshot') || jsonb_build_object(
    'estado_por_data', CASE
      WHEN l.doc->>'ended_at' IS NOT NULL THEN 'encerrado'
      WHEN (l.doc->>'expires_at')::timestamptz <= now() THEN 'expirado'
      ELSE 'ativo_ou_sem_prazo' END,
    'vagas_ocupadas_por_criador', (
      SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (
        SELECT s.doc->>'created_by_user_id' AS criador, count(*) AS arenas
        FROM shares s WHERE s.relationship_link_id = l.id
        GROUP BY s.doc->>'created_by_user_id'
      ) x
    )
  ) FROM links l

  UNION ALL
  SELECT '02_arena_compartilhada/' || s.id, s.doc FROM shares s

  UNION ALL
  SELECT '03_arena/' || a.id, jsonb_build_object(
    'id', a.id, 'nome', a.name, 'usuario', a.user_id,
    'arquivada', to_jsonb(a)->'is_archived',
    'acoes', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', ac.id, 'nome', to_jsonb(ac)->>'name',
        'tipo', to_jsonb(ac)->>'action_type', 'repeticoes', ac.repetitions,
        'tarefas_historicas', (SELECT count(*) FROM public.scheduled_tasks t WHERE t.action_id = ac.id::text),
        'concluidas_historicas', (SELECT count(*) FROM public.scheduled_tasks t WHERE t.action_id = ac.id::text AND t.completed IS TRUE),
        'concluidas_sem_timestamp', (SELECT count(*) FROM public.scheduled_tasks t WHERE t.action_id = ac.id::text AND t.completed IS TRUE AND to_jsonb(t)->>'completed_at' IS NULL),
        'ultima_conclusao', (SELECT max(to_jsonb(t)->>'completed_at') FROM public.scheduled_tasks t WHERE t.action_id = ac.id::text AND t.completed IS TRUE)
      ) ORDER BY ac.id), '[]'::jsonb)
      FROM public.actions ac WHERE ac.arena_id = a.id
    )
  ) FROM public.arenas a JOIN arena_ids ids ON ids.id = a.id

  UNION ALL
  SELECT '04_duelo/' || c.id, (to_jsonb(c) - 'arena_snapshot') || jsonb_build_object(
    'prazo_passou_sem_resultado',
      (to_jsonb(c)->>'deadline_at')::timestamptz <= now()
      AND to_jsonb(c)->>'completed_at' IS NULL
  ) FROM public.relationship_competition_challenges c
    JOIN links l ON l.id = c.relationship_link_id

  UNION ALL
  SELECT '05_convite/' || i.id, to_jsonb(i) - 'arena_snapshot'
  FROM public.relationship_link_invites i, param p
  WHERE i.sender_id = p.uid OR i.recipient_id = p.uid

  UNION ALL
  SELECT '06_colunas', coalesce(jsonb_agg(jsonb_build_object(
    'tabela', table_name, 'coluna', column_name, 'tipo', data_type,
    'default', column_default
  ) ORDER BY table_name, ordinal_position), '[]'::jsonb)
  FROM information_schema.columns
  WHERE table_schema = 'public' AND (table_name LIKE 'relationship_%'
    OR (table_name = 'scheduled_tasks' AND column_name IN ('completed', 'completed_at', 'date', 'action_id')))

  UNION ALL
  SELECT '07_politicas_de_acesso', coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
  FROM pg_policies p WHERE p.schemaname = 'public'
    AND (p.tablename LIKE 'relationship_%' OR p.tablename IN ('arenas', 'actions', 'scheduled_tasks'))

  UNION ALL
  SELECT '08_triggers', coalesce(jsonb_agg(jsonb_build_object(
    'tabela', c.relname, 'nome', t.tgname, 'habilitado', t.tgenabled,
    'definicao', pg_get_triggerdef(t.oid)
  )), '[]'::jsonb)
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal
    AND (c.relname LIKE 'relationship_%' OR c.relname IN ('arenas', 'actions', 'scheduled_tasks'))

  UNION ALL
  SELECT '09_funcao/' || names.name || coalesce('(' || pg_get_function_identity_arguments(f.oid) || ')', ''),
    jsonb_build_object('existe', f.oid IS NOT NULL,
      'security_definer', f.prosecdef, 'config', f.proconfig,
      'definicao', CASE WHEN f.oid IS NOT NULL THEN pg_get_functiondef(f.oid) END)
  FROM function_names names LEFT JOIN installed_functions f ON f.proname = names.name
)
SELECT diagnostico, dados FROM report ORDER BY diagnostico;

COMMIT;

-- OPCIONAL: execute este SELECT SEPARADAMENTE se a coleta disser cron_instalado=true.
-- Confere se existe um job ativo para encerrar os duelos. Nao executa o job.
-- SELECT jobid, jobname, schedule, active, command
-- FROM cron.job
-- WHERE command ILIKE '%finalize_due_competition_challenges%'
--    OR jobname ILIKE '%competition%';
