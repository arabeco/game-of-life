-- Check somente leitura: funcoes V3 e cron.
-- Nao cria convite, nao cobra ouro e nao executa nenhuma rotina.

SELECT
  'cron' AS item,
  jobid::text AS identificador,
  jobname AS nome,
  active::text AS ativo,
  schedule AS agenda,
  command AS comando
FROM cron.job
WHERE command ILIKE '%expire_relationships_v3%'
   OR jobname ILIKE '%relationship%'
   OR jobname ILIKE '%competition%'
ORDER BY jobid;

SELECT
  'funcao' AS item,
  p.oid::regprocedure::text AS identificador,
  p.prosecdef::text AS security_definer,
  CASE WHEN p.prosrc ILIKE '%relationship_link_price%'
          OR p.prosrc ILIKE '%expire_relationships_v3%'
       THEN 'corpo presente' ELSE 'assinatura encontrada' END AS estado
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'relationship_link_price',
    'select_relationship_arenas',
    'propose_relationship_v3',
    'respond_relationship_link_invite',
    'renew_relationship_link',
    'manage_duel_copy',
    'expire_relationships_v3',
    'finalize_due_competition_challenges',
    'relationship_arena_scopes',
    'can_read_relationship_arena'
  )
ORDER BY p.proname, p.oid::regprocedure::text;

SELECT
  'precos' AS item,
  public.relationship_link_price('mentoria', 1) AS mentoria,
  public.relationship_link_price('parceria', 1) AS parceria,
  public.relationship_link_price('competicao', 1) AS competicao;

SELECT
  'renovacao' AS item,
  p.oid::regprocedure::text AS funcao,
  CASE WHEN pg_get_functiondef(p.oid) ILIKE '%when l.link_type%'
       THEN 'funcao V3 encontrada' ELSE 'verificar corpo' END AS estado
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'renew_relationship_link';
