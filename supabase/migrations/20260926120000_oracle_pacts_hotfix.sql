-- Hotfix das missoes individuais do Oraculo.
-- Aplicar no SQL Editor do projeto GLYPH antes de distribuir o AAB que inclui
-- a interface nova. Nao cria nem paga missoes existentes.
begin;

alter table public.user_profiles
  drop constraint if exists user_profiles_arena_pact_kind_check;
alter table public.user_profiles
  add constraint user_profiles_arena_pact_kind_check
  check (arena_pact_kind is null or arena_pact_kind in ('primeira','constancia','conclusao','retomada','volume'));

alter table public.user_profiles
  drop constraint if exists user_profiles_arena_pact_volume_check;
alter table public.user_profiles
  add constraint user_profiles_arena_pact_volume_check
  check (arena_pact_kind not in ('volume','primeira') or (arena_pact_ends_on is not null and arena_pact_ends_on >= arena_pact_started_on));

create or replace function public.accept_arena_pact(p_arena_id uuid,p_kind text,p_difficulty text,p_goal integer)
returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  v_user uuid := auth.uid();
  v_active text;
  v_start date := (timezone('America/Sao_Paulo',now()) - interval '4 hours')::date;
  v_end date;
  v_goal integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select arena_pact_kind into v_active from public.user_profiles where id=v_user for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  if v_active is not null then raise exception 'PACT_ALREADY_ACTIVE'; end if;
  if p_kind is null or p_kind not in ('primeira','volume','constancia','conclusao','retomada')
    or p_difficulty is null or p_difficulty not in ('leve','media','alta')
    or p_goal is null or p_goal < 1 then raise exception 'INVALID_PACT'; end if;
  if public._starter_reward_has_purchase_marker(v_user,'arena_pact',coalesce(p_arena_id::text,'sistema') || ':' || p_kind || ':' || to_char(v_start,'YYYY-MM-DD')) then
    raise exception 'PACT_ALREADY_REWARDED_TODAY';
  end if;

  if p_kind = 'primeira' then
    if p_arena_id is not null or p_goal <> 1 or p_difficulty <> 'leve' then raise exception 'INVALID_PACT_GOAL'; end if;
    v_goal := 1;
    v_end := v_start + 13;
  else
    if p_arena_id is null then
      if p_kind <> 'volume' then raise exception 'PACT_SCOPE_REQUIRES_VOLUME'; end if;
    elsif not exists(select 1 from public.arenas where id=p_arena_id and user_id=v_user and not coalesce(is_archived,false)) then
      raise exception 'PACT_ARENA_NOT_FOUND';
    elsif not exists (
      select 1 from public.actions a
      where a.id in (select id from public.actions where arena_id=p_arena_id and user_id=v_user)
        and coalesce(a.action_type,'') <> 'Livre'
        and (select count(*) from public.scheduled_tasks st where st.user_id=v_user and st.action_id::text=a.id::text and coalesce(st.completed,false)) < greatest(1,coalesce(a.repetitions,1))
    ) then
      raise exception 'PACT_ARENA_COMPLETE';
    end if;

    if p_kind = 'volume' then
      if p_goal not between 3 and 10 then raise exception 'INVALID_PACT_GOAL'; end if;
      if not exists(select 1 from public.actions a where a.user_id=v_user and (p_arena_id is null or a.arena_id=p_arena_id) and coalesce(a.action_type,'') <> 'Livre') then raise exception 'PACT_NO_MEASURABLE_ACTION'; end if;
      if exists(select 1 from public.user_purchases where user_id=v_user and product_type='arena_pact_volume_window'
        and split_part(product_id,':',1)=coalesce(p_arena_id::text,'sistema')
        and split_part(product_id,':',2) >= to_char(v_start,'YYYY-MM-DD')) then raise exception 'PACT_PREVIOUS_WINDOW_STILL_OPEN'; end if;
      v_goal := p_goal;
      v_end := v_start + 13;
    elsif p_kind = 'retomada' and p_goal not between 1 and 2 then
      raise exception 'INVALID_PACT_GOAL';
    elsif p_kind = 'constancia' and p_goal not between 2 and 7 then
      raise exception 'INVALID_PACT_GOAL';
    elsif p_kind = 'conclusao' and p_goal not between 1 and 50 then
      raise exception 'INVALID_PACT_GOAL';
    else
      v_goal := p_goal;
    end if;
  end if;

  p_difficulty := case when v_goal <= 3 then 'leve' when v_goal <= 7 then 'media' else 'alta' end;
  perform set_config('glyph.pact_write','on',true);
  update public.user_profiles set arena_pact_arena_id=p_arena_id, arena_pact_kind=p_kind,
    arena_pact_difficulty=p_difficulty, arena_pact_goal=v_goal, arena_pact_started_on=v_start, arena_pact_ends_on=v_end
  where id=v_user;
  perform set_config('glyph.pact_write','off',true);
  return jsonb_build_object('success',true,'started_on',v_start,'ends_on',v_end);
end $$;

create or replace function public.claim_arena_pact_reward()
returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  v_user uuid := auth.uid(); v_arena uuid; v_kind text; v_difficulty text; v_goal integer; v_start date; v_end date;
  v_today date := (timezone('America/Sao_Paulo',now()) - interval '4 hours')::date;
  v_eligible boolean := false; v_reward integer; v_marker text; v_new_gold integer;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select arena_pact_arena_id,arena_pact_kind,arena_pact_difficulty,arena_pact_goal,arena_pact_started_on,arena_pact_ends_on
    into v_arena,v_kind,v_difficulty,v_goal,v_start,v_end from public.user_profiles where id=v_user for update;
  if v_kind is null then raise exception 'NO_ACTIVE_PACT'; end if;
  if v_kind in ('volume','primeira') and (v_end is null or v_end < v_start) then raise exception 'INVALID_PACT_WINDOW'; end if;

  if v_kind = 'primeira' then
    select exists(select 1 from public.scheduled_tasks st join public.actions a on a.id::text=st.action_id::text and a.user_id=v_user
      where st.user_id=v_user and coalesce(st.completed,false) and coalesce(a.action_type,'') <> 'Livre'
        and (nullif(st.date::text,'')::date - case when st.start_time >= 0 and st.start_time < 240 then 1 else 0 end) between v_start and least(v_end,v_today)) into v_eligible;
  elsif v_kind = 'volume' then
    select count(distinct st.id) >= v_goal into v_eligible from public.scheduled_tasks st join public.actions a on a.id::text=st.action_id::text and a.user_id=v_user
      where st.user_id=v_user and coalesce(st.completed,false) and coalesce(a.action_type,'') <> 'Livre'
        and (v_arena is null or a.arena_id=v_arena)
        and (nullif(st.date::text,'')::date - case when st.start_time >= 0 and st.start_time < 240 then 1 else 0 end) between v_start and least(v_end,v_today);
  elsif v_kind = 'retomada' then
    select count(distinct st.id) >= v_goal into v_eligible from public.scheduled_tasks st join public.actions a on a.id::text=st.action_id::text and a.user_id=v_user
      where st.user_id=v_user and a.arena_id=v_arena and coalesce(st.completed,false) and coalesce(a.action_type,'') <> 'Livre'
        and (nullif(st.date::text,'')::date - case when st.start_time >= 0 and st.start_time < 240 then 1 else 0 end) between v_start and v_today;
  elsif v_kind = 'constancia' then
    select count(distinct (nullif(st.date::text,'')::date - case when st.start_time >= 0 and st.start_time < 240 then 1 else 0 end)) >= v_goal into v_eligible from public.scheduled_tasks st join public.actions a on a.id::text=st.action_id::text and a.user_id=v_user
      where st.user_id=v_user and a.arena_id=v_arena and coalesce(st.completed,false) and coalesce(a.action_type,'') <> 'Livre'
        and (nullif(st.date::text,'')::date - case when st.start_time >= 0 and st.start_time < 240 then 1 else 0 end) between v_start and v_today;
  elsif v_kind = 'conclusao' then
    select not exists(select 1 from public.actions a where a.user_id=v_user and a.arena_id=v_arena and coalesce(a.action_type,'') <> 'Livre'
      and (select count(*) from public.scheduled_tasks st where st.user_id=v_user and st.action_id::text=a.id::text and coalesce(st.completed,false)) < greatest(1,coalesce(a.repetitions,1))) into v_eligible;
  else raise exception 'UNKNOWN_PACT_KIND'; end if;
  if not coalesce(v_eligible,false) then raise exception 'PACT_NOT_COMPLETE'; end if;

  v_difficulty := case when v_goal <= 3 then 'leve' when v_goal <= 7 then 'media' else 'alta' end;
  v_reward := case v_difficulty when 'leve' then 2 when 'media' then 5 else 10 end;
  v_marker := coalesce(v_arena::text,'sistema') || ':' || v_kind || ':' || to_char(v_start,'YYYY-MM-DD');
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':arena_pact:' || v_marker,0));
  if public._starter_reward_has_purchase_marker(v_user,'arena_pact',v_marker) then
    select coalesce((coalesce(wallet,'{}'::jsonb)->>'gold')::integer,gold,0) into v_new_gold from public.user_profiles where id=v_user;
    return jsonb_build_object('success',true,'already_claimed',true,'gold_granted',0,'new_gold',v_new_gold);
  end if;
  v_new_gold := public._starter_reward_credit_gold(v_user,v_reward,'arena_pact','Recompensa de pacto de arena',jsonb_build_object('arena_id',v_arena,'kind',v_kind,'difficulty',v_difficulty));
  perform public._starter_reward_mark_purchase(v_user,'arena_pact',v_marker,false);
  if v_kind = 'volume' then
    perform public._starter_reward_mark_purchase(v_user,'arena_pact_volume_window',coalesce(v_arena::text,'sistema') || ':' || to_char(v_end,'YYYY-MM-DD'),false);
  end if;
  perform set_config('glyph.pact_write','on',true);
  update public.user_profiles set arena_pact_arena_id=null,arena_pact_kind=null,arena_pact_difficulty=null,arena_pact_goal=null,arena_pact_started_on=null,arena_pact_ends_on=null where id=v_user;
  perform set_config('glyph.pact_write','off',true);
  return jsonb_build_object('success',true,'already_claimed',false,'gold_granted',v_reward,'new_gold',v_new_gold,'kind',v_kind,'difficulty',v_difficulty);
end $$;

revoke all on function public.accept_arena_pact(uuid,text,text,integer) from public;
grant execute on function public.accept_arena_pact(uuid,text,text,integer) to authenticated;
revoke all on function public.claim_arena_pact_reward() from public;
grant execute on function public.claim_arena_pact_reward() to authenticated;
commit;
