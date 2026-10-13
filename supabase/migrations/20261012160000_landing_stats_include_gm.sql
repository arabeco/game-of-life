-- Inclui jogadores com papel gm nos mesmos agregados públicos.
-- Maestria total soma o índice 0–100 de cada perfil, igual ao app.
-- niveis_somados permanece apenas para compatibilidade com o site antigo.
-- Ações são registros concluídos ainda presentes; não é contador vitalício.
BEGIN;
-- Public aggregate counters for the Glyph landing.
-- Keep v1 intact while the already published landing still calls it.
create or replace function public.get_landing_stats_v2()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with players as materialized (
    select
      id,
      coalesce(level, 0)::bigint as level,
      coalesce((nobility ->> 'exp')::bigint, 0) as experience
    from public.user_profiles
    where role in ('user', 'gm')
  )
  select jsonb_build_object(
    'maestria_total', (select coalesce(sum(least(100, greatest(0, round(level * 2)))), 0) from players),
    'niveis_somados', (select coalesce(sum(level), 0) from players),
    'arenas_criadas', (
      select count(*) from public.arenas a
      join players p on p.id = a.user_id
    ),
    'acoes_completadas', (
      select count(*) from public.scheduled_tasks t
      join players p on p.id = t.user_id
      where t.completed is true
    ),
    'pessoas_no_mundo', (select count(*) from players),
    'experiencia_acumulada', (select coalesce(sum(experience), 0) from players)
  );
$$;

revoke all on function public.get_landing_stats_v2() from public;
grant execute on function public.get_landing_stats_v2() to anon, authenticated;

COMMIT;
SELECT public.get_landing_stats_v2() AS contadores;
