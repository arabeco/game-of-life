-- ============================================================
-- PASSO 1 — confirmacao da conta (opcional).
--
-- A versao anterior filtrava por e-mail e voltava "no rows": o e-mail da sessao
-- aponta para um perfil VAZIO. As consultas abaixo ja usam o id da conta
-- misterxhermit direto, entao este passo e so conferencia.
-- ============================================================
select
  up.id,
  up.nickname,
  up.email,
  (select count(*) from public.arenas a where a.user_id = up.id) as arenas,
  (select count(*) from public.actions ac where ac.user_id = up.id) as acoes
from public.user_profiles up
where up.nickname ilike '%hermit%'
   or lower(coalesce(up.email, '')) like '%hermit%'
order by arenas desc;


-- ============================================================
-- PASSO 2 — existe algum compartilhamento de arena registrado?
--
-- Se este passo vier vazio, o problema NAO e a consulta: e que a parceria nao
-- gravou a linha de arena compartilhada, e ai o item 4 tem outra causa alem da
-- que ja corrigi no cliente.
-- ============================================================
select count(*) as total_arenas_de_vinculo from public.relationship_link_arenas;

select
  rla.id,
  rla.relationship_link_id,
  rla.arena_id,
  rla.created_by_user_id,
  a.name        as arena,
  a.user_id     as dono_da_arena,
  rl.link_type,
  rl.ended_at,
  case when rl.ended_at is null then 'ativo' else 'encerrado' end as situacao
from public.relationship_link_arenas rla
left join public.arenas a on a.id = rla.arena_id
left join public.relationship_links rl on rl.id = rla.relationship_link_id
order by rla.created_at desc
limit 20;


-- ============================================================
-- PASSO 3 — o progresso real, usando o ID do PASSO 1.
--
-- pct_pessoal e o numero que o app passa a mostrar depois da correcao.
-- pct_pool e o que ele mostrava antes (contador compartilhado), e e por isso
-- que a arena ia a 0%: numa parceria recem-aceita o pool esta vazio.
-- ============================================================
with por_acao as (
  select
    a.id    as arena_id,
    a.name  as arena,
    ac.id   as action_id,
    greatest(1, coalesce(ac.repetitions, 1)) as planejado,
    (
      select count(*)
      from public.scheduled_tasks st
      where st.action_id = ac.id::text
        and st.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid
        and coalesce(st.completed, false) = true
    ) as feito_por_mim,
    (
      select count(*)
      from public.shared_action_completions sac
      where sac.arena_id::text = a.id::text
        and sac.action_id::text = ac.id::text
    ) as feito_no_pool
  from public.arenas a
  join public.relationship_link_arenas rla on rla.arena_id = a.id
  join public.actions ac on ac.arena_id = a.id
  where a.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid
    and coalesce(ac.action_type, '') <> 'Livre'
)
select
  arena,
  sum(planejado)      as planejado,
  sum(feito_por_mim)  as feito_por_mim,
  sum(feito_no_pool)  as feito_no_pool,
  round(100.0 * least(sum(feito_por_mim), sum(planejado)) / nullif(sum(planejado), 0), 1) as pct_pessoal,
  round(100.0 * least(sum(feito_no_pool), sum(planejado)) / nullif(sum(planejado), 0), 1) as pct_pool
from por_acao
group by arena
order by arena;


-- ============================================================
-- PASSO 3b — se o PASSO 3 vier vazio, rode SEM o filtro de vinculo.
--
-- Isto lista TODAS as suas arenas. Se aqui vier resultado e no PASSO 3 nao,
-- entao a arena que voce compartilhou nao esta em relationship_link_arenas —
-- o compartilhamento nao gravou.
-- ============================================================
with por_acao as (
  select
    a.name  as arena,
    ac.id   as action_id,
    greatest(1, coalesce(ac.repetitions, 1)) as planejado,
    (
      select count(*)
      from public.scheduled_tasks st
      where st.action_id = ac.id::text
        and st.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid
        and coalesce(st.completed, false) = true
    ) as feito_por_mim
  from public.arenas a
  join public.actions ac on ac.arena_id = a.id
  where a.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid
    and coalesce(a.is_archived, false) = false
    and coalesce(ac.action_type, '') <> 'Livre'
)
select
  arena,
  sum(planejado)     as planejado,
  sum(feito_por_mim) as feito_por_mim,
  round(100.0 * least(sum(feito_por_mim), sum(planejado)) / nullif(sum(planejado), 0), 1) as pct_pessoal
from por_acao
group by arena
order by pct_pessoal desc nulls last;


-- ============================================================
-- PASSO 4 — os RPCs de convite de grupo (ja conferido: 4 linhas, ok).
-- Mantido aqui so como registro.
-- ============================================================
-- select p.proname, pg_get_function_identity_arguments(p.oid)
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in ('send_my_clan_invite','respond_to_my_clan_invite',
--                     'revoke_my_clan_invite','get_my_pending_clan_invitee_ids');
