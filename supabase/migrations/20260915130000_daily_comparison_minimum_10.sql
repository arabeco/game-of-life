create or replace function public.get_daily_comparison(p_date date)
returns jsonb language plpgsql stable security definer set search_path = public
as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo' - interval '4 hours')::date;
  v_result jsonb;
begin
  if auth.uid() is null then return null; end if;
  if p_date is null or p_date > v_today or p_date < v_today - 30 then return null; end if;
  with daily as (
    select t.user_id, count(*)::integer as actions,
      sum(case when a.action_type = 'Livre' then 0
        else greatest(0, round(coalesce(t.duration, a.duration, 0)::numeric)) end) as xp
    from public.scheduled_tasks t
    join public.actions a on a.id::text = t.action_id::text and a.user_id = t.user_id
    join public.user_profiles p on p.id = t.user_id
    where t.completed = true
      and t.date::date between p_date and p_date + 1
      and (t.date::date - case when t.start_time >= 0 and t.start_time < 240 then 1 else 0 end) = p_date
      and coalesce(p.role, 'user') = 'user'
      and coalesce(p.email, '') !~* '(^codex-|^qa[._+-]|^smoke[._+-]|@example\.(com|org|net)$)'
      and not exists(select 1 from public.daily_comparison_exclusions e where e.user_id = t.user_id)
    group by t.user_id
  ), own as (select * from daily where user_id = auth.uid()), aggregate as (
    select count(*) as size,
      count(*) filter(where d.actions >= o.actions) as actions_at_least,
      count(*) filter(where d.xp >= o.xp) as xp_at_least,
      max(o.actions) as own_actions, max(o.xp) as own_xp
    from daily d cross join own o
  )
  select case when size >= 10 then jsonb_build_object(
    'date', p_date, 'cohortSize', size, 'actions', own_actions, 'xp', own_xp,
    -- Ties take the end of their group: 100 equal players are top 100%, not top 1%.
    'actionsTopPercent', ceil(actions_at_least * 100.0 / size),
    'xpTopPercent', case when own_xp > 0 then ceil(xp_at_least * 100.0 / size) else null end,
    'provisional', p_date = v_today, 'calculatedAt', now()
  ) else null end into v_result from aggregate;
  return v_result;
end;
$$;
revoke all on function public.get_daily_comparison(date) from public, anon;
grant execute on function public.get_daily_comparison(date) to authenticated;

