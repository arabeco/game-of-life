-- O ALMOCO QUE NAO ZEROU (02/11/2026). So leitura: nao muda nada.
-- Lista toda execucao das acoes com "almo" no nome, de qualquer pessoa (a
-- arena e compartilhada), e diz se cada uma cai antes ou depois do zerar.
with eu as (select 'e76e2b7f-a771-4738-a10a-30a993ecafeb'::uuid as id),
zerar as (
  -- A marca d'agua do ultimo zerar fica em completed_season_missions.
  select max(substr(marca, length('free_progress_reset_at:') + 1)::timestamptz) as em
  from public.user_profiles p, eu,
       jsonb_array_elements_text(coalesce(to_jsonb(p)->'completed_season_missions', '[]'::jsonb)) as marca
  where p.id = eu.id and marca like 'free_progress_reset_at:%'
),
ciclo as (
  select max(c.end_date)::date as ultimo_fim,
         bool_or(c.report_data is null) as tem_ciclo_aberto
  from public.cycles c, eu where c.user_id = eu.id
),
almocos as (
  select a.id, a.name, a.user_id as dono_da_acao, a.arena_id, ar.name as arena
  from public.actions a
  left join public.arenas ar on ar.id = a.arena_id
  where a.name ilike '%almo%'
    and (a.user_id = (select id from eu)
         or a.arena_id in (select arena_id from public.actions where user_id = (select id from eu)))
)
select al.arena, al.name as acao, al.id as action_id,
       case when al.dono_da_acao = (select id from eu) then 'minha' else 'do par' end as acao_de,
       case when st.user_id = (select id from eu) then 'eu' else 'o par' end as quem_fez,
       st.date as dia, st.completed, st.completed_at,
       (select em from zerar) as zerar_em,
       (select ultimo_fim from ciclo) as fim_do_ultimo_ciclo,
       (select tem_ciclo_aberto from ciclo) as ciclo_aberto_agora,
       case when (select em from zerar) is null then 'sem zerar'
            when st.date::date >= ((select em from zerar) at time zone 'America/Sao_Paulo')::date then 'DEPOIS do zerar (conta)'
            else 'antes do zerar (nao devia contar)' end as situacao
from almocos al
join public.scheduled_tasks st on st.action_id = al.id::text
where st.completed
order by st.date desc
limit 40;
