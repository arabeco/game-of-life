-- Reconhecimento atual e média pessoal. Rodar manualmente no Supabase.
-- Não cria prêmio, ranking nominal, tabela, cron nem permissão de leitura de terceiros.
begin;

create or replace function public._recognition_report_exp(p_report jsonb)
returns numeric language sql immutable set search_path = '' as $$
  select case when coalesce(p_report->>'exp_gained', p_report->'metrics'->>'exp_gained', '') ~ '^[0-9]+([.][0-9]+)?$'
    then coalesce(p_report->>'exp_gained', p_report->'metrics'->>'exp_gained')::numeric else null end;
$$;
revoke all on function public._recognition_report_exp(jsonb) from public, anon, authenticated;

create or replace function public.get_progress_recognition(p_kind text, p_date date default null, p_cycle_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_today date := (now() at time zone 'America/Sao_Paulo' - interval '4 hours')::date;
  v_start date; v_end date; v_created date; v_days integer;
  v_current numeric; v_baseline numeric; v_base_days integer; v_base_start date;
  v_size bigint; v_at_least bigint; v_clan uuid; v_result jsonb;
begin
  if v_user is null then return null; end if;
  if p_kind = 'day' then
    if p_date is null or p_date > v_today then return null; end if;
    select (created_at at time zone 'America/Sao_Paulo' - interval '4 hours')::date
      into v_created from auth.users where id = v_user;
    if v_created is null or p_date < v_created then return null; end if;
    v_base_start := greatest(p_date - 30, v_created);
    v_base_days := p_date - v_base_start;
    -- Mesma EXP base de buildDailyExpSnapshot: dificuldade, Livre sem pontos,
    -- duração positiva da tarefa ou duração da ação. Dias sem ações contam zero.
    with tasks as (
      select t.date::date - case when t.start_time >= 0 and t.start_time < 240 then 1 else 0 end as day,
        case when a.action_type = 'Livre' then 0 else
          greatest(0, round((case when t.duration > 0 then t.duration else coalesce(a.duration, 0) end)::numeric *
            case least(3, greatest(0, round(coalesce(a.difficulty, 2)::numeric)))
              when 0 then 0 when 2 then 1.05 when 3 then 1.1 else 1 end)) end as xp
      from public.scheduled_tasks t
      join public.actions a on a.id::text = t.action_id::text and a.user_id = t.user_id
      where t.user_id = v_user and t.completed = true
        and t.date::date between v_base_start and p_date + 1
    ) select coalesce(sum(xp) filter (where day = p_date),0),
       case when v_base_days >= 7 then coalesce(sum(xp) filter (where day >= v_base_start and day < p_date),0) / v_base_days else null end
      into v_current, v_baseline from tasks;
    return jsonb_build_object('kind',p_kind,'subjectId',p_date::text,'current',v_current,
      'baseline',v_baseline,'baselineDays',v_base_days,'baselineStart',v_base_start,'baselineEnd',p_date-1);
  elsif p_kind = 'cycle' then
    select c.start_date::date, c.end_date::date, public._recognition_report_exp(c.report_data)
      into v_start,v_end,v_current from public.cycles c
      where c.id = p_cycle_id and c.user_id = v_user and c.report_data is not null;
    if v_current is null or v_start is null or v_end < v_start or v_end > v_today then return null; end if;
    v_days := v_end - v_start + 1;
    -- Referência pessoal: ciclos anteriores fechados, sem o ciclo comparado.
    -- Dias vazios dentro dos ciclos e entre eles integram o denominador.
    with prior as (
      select c.start_date::date as start_day, c.end_date::date as end_day, public._recognition_report_exp(c.report_data) as xp
      from public.cycles c where c.user_id = v_user and c.id <> p_cycle_id
        and c.report_data is not null and c.end_date::date < v_start
        and c.end_date::date >= c.start_date::date
    ) select case when count(*) >= 2 and v_start-min(start_day) >= 7
             then sum(xp)/(v_start-min(start_day)) else null end,
        v_start-min(start_day),min(start_day)
      into v_baseline,v_base_days,v_base_start from prior where xp is not null;
    -- População atual: um ciclo por jogador nos últimos 90 dias, mesma duração.
    -- O próprio ciclo avaliado substitui os demais ciclos desse jogador.
    with eligible as (
      select p.id from public.user_profiles p where coalesce(p.role,'user')='user'
        and coalesce(p.email,'') !~* '(^codex-|^qa[._+-]|^smoke[._+-]|@example\.(com|org|net)$)'
        and not exists(select 1 from public.daily_comparison_exclusions e where e.user_id=p.id)
    ), latest as (
      select distinct on(c.user_id) c.user_id, public._recognition_report_exp(c.report_data) as xp
      from public.cycles c join eligible e on e.id=c.user_id
      where c.user_id <> v_user and c.report_data is not null
        and c.end_date::date between v_today-90 and v_today
        and c.end_date::date-c.start_date::date+1=v_days
        and public._recognition_report_exp(c.report_data) is not null
      order by c.user_id,c.end_date desc,c.id
    ), population as (
      select xp from latest union all
      select v_current where exists(select 1 from eligible where id=v_user) and v_end >= v_today-90
    ) select count(*),count(*) filter(where xp >= v_current) into v_size,v_at_least from population;
    if not exists(select 1 from public.user_profiles p where p.id=v_user and coalesce(p.role,'user')='user'
      and coalesce(p.email,'') !~* '(^codex-|^qa[._+-]|^smoke[._+-]|@example\.(com|org|net)$)'
      and not exists(select 1 from public.daily_comparison_exclusions e where e.user_id=p.id)) or v_end < v_today-90 then v_size:=0; end if;
    return jsonb_build_object('kind',p_kind,'subjectId',p_cycle_id::text,'current',v_current,'days',v_days,
      'baseline',v_baseline,'baselineDays',v_base_days,'baselineStart',v_base_start,'baselineEnd',v_start-1,
      'cohortSize',v_size,'topPercent',case when v_size>=100 and v_current>0 then ceil(v_at_least*100.0/v_size) else null end);
  elsif p_kind in ('mastery','clan') then
    if p_kind='clan' then
      select clan_id into v_clan from public.clan_members where user_id=v_user limit 1;
      if v_clan is null then return null; end if;
    end if;
    with eligible as (
      select p.id, least(100,greatest(0,round(coalesce(p.level,0)::numeric*2))) as mastery
      from public.user_profiles p where coalesce(p.role,'user')='user'
        and coalesce(p.email,'') !~* '(^codex-|^qa[._+-]|^smoke[._+-]|@example\.(com|org|net)$)'
        and not exists(select 1 from public.daily_comparison_exclusions e where e.user_id=p.id)
    ), population as (
      select id,mastery as score from eligible where p_kind='mastery'
      union all
      select c.id,greatest(0,coalesce(c.exp,0))::numeric from public.clans c
      where p_kind='clan' and exists(select 1 from public.clan_members m join eligible e on e.id=m.user_id where m.clan_id=c.id)
    ), own as (select score from population where id=case when p_kind='clan' then v_clan else v_user end)
    select max(o.score),count(*),count(*) filter(where p.score>=o.score)
      into v_current,v_size,v_at_least from population p cross join own o;
    if v_current is null then return null; end if;
    return jsonb_build_object('kind',p_kind,'subjectId',case when p_kind='clan' then v_clan else v_user end,
      'current',v_current,'cohortSize',v_size,
      'topPercent',case when v_size>=100 and v_current>0 then ceil(v_at_least*100.0/v_size) else null end);
  end if;
  return null;
end;
$$;
revoke all on function public.get_progress_recognition(text,date,uuid) from public, anon;
grant execute on function public.get_progress_recognition(text,date,uuid) to authenticated;
commit;
