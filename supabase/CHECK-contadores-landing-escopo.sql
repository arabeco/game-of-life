-- Somente leitura. Compara os grupos excluídos pelo filtro role='user'.
-- Não retorna nomes, e-mails nem identificadores de pessoas.
WITH por_pessoa AS (
  SELECT p.id, coalesce(p.role::text, '(sem role)') AS papel,
    coalesce(p.level, 0)::bigint AS nivel_armazenado,
    coalesce((p.nobility->>'exp')::bigint, 0) AS exp,
    (SELECT count(*) FROM public.arenas a WHERE a.user_id=p.id) AS arenas,
    (SELECT count(*) FROM public.scheduled_tasks t
      WHERE t.user_id=p.id AND t.completed IS TRUE) AS acoes_concluidas_presentes
  FROM public.user_profiles p
), grupos AS (
  SELECT papel, count(*) AS perfis,
    sum(nivel_armazenado) AS soma_nivel_armazenado,
    max(nivel_armazenado) AS maior_nivel_armazenado,
    sum(exp) AS exp_somada, max(exp) AS maior_exp,
    sum(arenas) AS arenas,
    sum(acoes_concluidas_presentes) AS acoes_concluidas_presentes
  FROM por_pessoa GROUP BY papel
)
SELECT jsonb_build_object(
  'por_papel', (SELECT jsonb_agg(to_jsonb(g) ORDER BY papel) FROM grupos g),
  'funcao_instalada', pg_get_functiondef('public.get_landing_stats_v2()'::regprocedure),
  'retorno_atual', public.get_landing_stats_v2()
) AS diagnostico;
