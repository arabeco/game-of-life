-- POR QUE O CICLO DIZ 70/86, E O QUE SOBRA SE A TEMPORADA SAIR DA CONTA.
--
-- Isto aqui SO LE. Nenhuma linha e escrita, nenhum ciclo e fechado.
--
-- Tres perguntas, tres tabelas:
--   1. quem sou eu, e qual e o ciclo aberto
--   2. de onde vem o 86 — quantas tarefas o ciclo conta, e quantas sao de
--      arena de temporada
--   3. como ficaria a conta sem a temporada, que e o que ficou combinado
--
-- A arena de temporada se identifica pelo NOME: o app marca com
-- `normalizedName.includes('quests - season')`, depois de baixar a caixa e
-- tirar acento. Aqui o `ilike '%quests - season%'` faz o equivalente.

-- ---------------------------------------------------------------- 1. eu
select
  id        as user_id,
  nickname,
  level     as maestria_crua,
  level * 2 as nivel_exibido
from public.user_profiles
where nickname ilike 'misterxhermit';

-- ------------------------------------------------- 2. os ciclos recentes
select
  c.id as cycle_id,
  c.start_date,
  c.end_date,
  (c.end_date::date - c.start_date::date) + 1 as dias_inclusive,
  c.report_data is not null                   as ja_tem_relatorio,
  c.report_data ->> 'grade'                   as nota_gravada,
  c.report_data ->> 'performance_score'        as score_gravado,
  array_length(c.arena_ids, 1)                as arenas_no_escopo
from public.cycles c
join public.user_profiles p on p.id = c.user_id
where p.nickname ilike 'misterxhermit'
order by c.start_date desc
limit 3;

-- -------------------------------------- 3. de onde vem o 70/86, por grupo
--
-- `start_time >= 0` e o que separa o que esta NO DIA do que espera na baia:
-- -1 quer dizer sem horario, ou seja ninguem pos aquilo num dia. Concluida
-- entra sempre, com horario ou sem — fazer sem ter marcado hora continua
-- sendo fazer.
with eu as (
  select id from public.user_profiles where nickname ilike 'misterxhermit'
),
ciclo as (
  select c.*
  from public.cycles c
  join eu on eu.id = c.user_id
  order by c.start_date desc
  limit 1
),
tarefas as (
  select
    t.id,
    t.completed,
    t.start_time,
    a.arena_id,
    ar.name as arena,
    (ar.name ilike '%quests - season%') as e_temporada
  from public.scheduled_tasks t
  join eu on eu.id = t.user_id
  join ciclo on true
  join public.actions a on a.id = t.action_id
  left join public.arenas ar on ar.id = a.arena_id
  where t.date between ciclo.start_date and ciclo.end_date
    and (t.completed or t.start_time >= 0)
)
select
  case when e_temporada then 'missao de temporada' else 'o resto do ciclo' end as grupo,
  count(*)                                  as no_denominador,
  count(*) filter (where completed)         as concluidas,
  count(*) filter (where not completed)     as faltando
from tarefas
group by e_temporada

union all

select
  'TOTAL (o que a tela mostra)',
  count(*),
  count(*) filter (where completed),
  count(*) filter (where not completed)
from tarefas;

-- ------------------------------- 4. a mesma conta, SEM a temporada
--
-- Este e o numero que a tela deveria mostrar: a temporada combina 28 dias e
-- nao cabe num ciclo de 7, entao ela entra como bonus e nao como compromisso.
with eu as (
  select id from public.user_profiles where nickname ilike 'misterxhermit'
),
ciclo as (
  select c.* from public.cycles c join eu on eu.id = c.user_id
  order by c.start_date desc limit 1
),
tarefas as (
  select t.completed
  from public.scheduled_tasks t
  join eu on eu.id = t.user_id
  join ciclo on true
  join public.actions a on a.id = t.action_id
  left join public.arenas ar on ar.id = a.arena_id
  where t.date between ciclo.start_date and ciclo.end_date
    and (t.completed or t.start_time >= 0)
    and coalesce(ar.name, '') not ilike '%quests - season%'
)
select
  count(*) filter (where completed) as concluidas,
  count(*)                          as planejadas,
  round(100.0 * count(*) filter (where completed) / nullif(count(*), 0), 1) as pct
from tarefas;

-- ------------------------------- 5. quais arenas de temporada estao no meio
with eu as (
  select id from public.user_profiles where nickname ilike 'misterxhermit'
),
ciclo as (
  select c.* from public.cycles c join eu on eu.id = c.user_id
  order by c.start_date desc limit 1
)
select
  ar.name                               as arena,
  count(*)                              as tarefas,
  count(*) filter (where t.completed)   as concluidas
from public.scheduled_tasks t
join eu on eu.id = t.user_id
join ciclo on true
join public.actions a on a.id = t.action_id
join public.arenas ar on ar.id = a.arena_id
where t.date between ciclo.start_date and ciclo.end_date
  and (t.completed or t.start_time >= 0)
  and ar.name ilike '%quests - season%'
group by ar.name
order by tarefas desc;
