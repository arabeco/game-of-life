-- Passos 3 e 4: aplicar inteiro no SQL Editor do Supabase.
-- Nao executado pelo Codex. Requer as migrations existentes de pactos e recompensas.
-- Nao altera EXP, nota de ciclo nem recompensas ja pagas.
begin;
alter table public.user_profiles add column if not exists arena_pact_ends_on date;
alter table public.user_profiles drop constraint if exists user_profiles_arena_pact_kind_check;
alter table public.user_profiles add constraint user_profiles_arena_pact_kind_check
 check (arena_pact_kind is null or arena_pact_kind in ('constancia','conclusao','retomada','volume'));
alter table public.user_profiles drop constraint if exists user_profiles_arena_pact_volume_check;
alter table public.user_profiles add constraint user_profiles_arena_pact_volume_check check (
 arena_pact_kind <> 'volume' or (arena_pact_ends_on is not null and arena_pact_ends_on >= arena_pact_started_on));

-- Fotografia permanente dos aceites antigos. Reaplicar nao amplia a coorte.
alter table public.user_profiles add column if not exists legacy_five_day_eligible boolean;
update public.user_profiles set legacy_five_day_eligible =
 'system-five-day-proof-streak' = any(coalesce(accepted_system_challenges,'{}'::text[]))
 where legacy_five_day_eligible is null;
alter table public.user_profiles alter column legacy_five_day_eligible set default false;
alter table public.user_profiles alter column legacy_five_day_eligible set not null;

create or replace function public.guard_retired_streak_and_volume_pact()
returns trigger language plpgsql set search_path = public as $$
begin
 if TG_OP = 'INSERT' then
   new.legacy_five_day_eligible := false;
   if new.arena_pact_kind = 'volume' then raise exception 'PACT_USE_ACCEPT_RPC'; end if;
 else
   new.legacy_five_day_eligible := old.legacy_five_day_eligible;
   if (old.arena_pact_kind = 'volume' or new.arena_pact_kind = 'volume')
     and row(new.arena_pact_arena_id,new.arena_pact_kind,new.arena_pact_difficulty,new.arena_pact_goal,new.arena_pact_started_on,new.arena_pact_ends_on)
       is distinct from row(old.arena_pact_arena_id,old.arena_pact_kind,old.arena_pact_difficulty,old.arena_pact_goal,old.arena_pact_started_on,old.arena_pact_ends_on)
     and coalesce(current_setting('glyph.pact_write',true),'') <> 'on'
     and pg_trigger_depth() <= 1 then
     raise exception 'PACT_USE_RPC';
   end if;
 end if;
 if not new.legacy_five_day_eligible then
   new.accepted_system_challenges := array_remove(new.accepted_system_challenges,'system-five-day-proof-streak');
 end if;
 return new;
end $$;
drop trigger if exists guard_retired_streak_and_volume_pact on public.user_profiles;
create trigger guard_retired_streak_and_volume_pact before insert or update on public.user_profiles
 for each row execute function public.guard_retired_streak_and_volume_pact();

create or replace function public.accept_arena_pact(p_arena_id uuid,p_kind text,p_difficulty text,p_goal integer)
returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
declare
 v_user uuid := auth.uid();
 v_active uuid;
 v_start date := (timezone('America/Sao_Paulo',now()) - interval '4 hours')::date;
 v_end date;
 v_goal integer;
 v_days integer;
begin
 if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
 select arena_pact_arena_id into v_active from public.user_profiles where id=v_user for update;
 if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
 if v_active is not null then raise exception 'PACT_ALREADY_ACTIVE'; end if;
 if p_kind is null or p_kind not in ('volume','constancia','conclusao','retomada')
   or p_difficulty is null or p_difficulty not in ('leve','media','alta')
   or p_goal is null or p_goal < 1 then raise exception 'INVALID_PACT'; end if;
 if not exists(select 1 from public.arenas where id=p_arena_id and user_id=v_user and not coalesce(is_archived,false)) then
   raise exception 'PACT_ARENA_NOT_FOUND'; end if;
 if p_kind='volume' then
   v_goal := case p_difficulty when 'leve' then 3 when 'media' then 6 else 10 end;
   v_days := case p_difficulty when 'leve' then 7 when 'media' then 14 else 21 end;
   if p_goal <> v_goal then raise exception 'INVALID_PACT_GOAL'; end if;
   v_end := v_start + v_days - 1;
   if not exists(select 1 from public.actions where user_id=v_user and arena_id=p_arena_id and coalesce(action_type,'') <> 'Livre') then
     raise exception 'PACT_NO_MEASURABLE_ACTION'; end if;
   -- Janela paga nao pode ser reutilizada por outro pacto de volume.
   if exists(select 1 from public.user_purchases where user_id=v_user
     and product_type='arena_pact_volume_window'
     and split_part(product_id,':',1)=p_arena_id::text
     and split_part(product_id,':',2) >= to_char(v_start,'YYYY-MM-DD')) then
     raise exception 'PACT_PREVIOUS_WINDOW_STILL_OPEN'; end if;
 else
   v_goal := p_goal;
   if p_kind='retomada' and p_goal<>1 then raise exception 'INVALID_PACT_GOAL'; end if;
   if p_kind='constancia' and p_goal <> (case p_difficulty when 'leve' then 3 when 'media' then 5 else 7 end) then
     raise exception 'INVALID_PACT_GOAL'; end if;
 end if;
 perform set_config('glyph.pact_write','on',true);
 update public.user_profiles set arena_pact_arena_id=p_arena_id,arena_pact_kind=p_kind,
   arena_pact_difficulty=p_difficulty,arena_pact_goal=v_goal,arena_pact_started_on=v_start,arena_pact_ends_on=v_end where id=v_user;
 perform set_config('glyph.pact_write','off',true);
 return jsonb_build_object('success',true,'started_on',v_start,'ends_on',v_end);
end $$;
revoke all on function public.accept_arena_pact(uuid,text,text,integer) from public;
grant execute on function public.accept_arena_pact(uuid,text,text,integer) to authenticated;

create or replace function public.abandon_arena_pact()
returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 perform 1 from public.user_profiles where id=auth.uid() for update;
 perform set_config('glyph.pact_write','on',true);
 update public.user_profiles set arena_pact_arena_id=null,arena_pact_kind=null,arena_pact_difficulty=null,
   arena_pact_goal=null,arena_pact_started_on=null,arena_pact_ends_on=null where id=auth.uid();
 perform set_config('glyph.pact_write','off',true);
 return jsonb_build_object('success',true);
end $$;
revoke all on function public.abandon_arena_pact() from public;
grant execute on function public.abandon_arena_pact() to authenticated;

create or replace function public.claim_arena_pact_reward()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_arena_id uuid;
  v_kind text;
  v_difficulty text;
  v_goal integer;
  v_started_on date;
  v_ends_on date;
  v_today date := (timezone('America/Sao_Paulo',now()) - interval '4 hours')::date;
  v_reward integer := 0;
  v_eligible boolean := false;
  v_marker text;
  v_new_gold integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select arena_pact_arena_id, arena_pact_kind, arena_pact_difficulty, arena_pact_goal, arena_pact_started_on, arena_pact_ends_on
    into v_arena_id, v_kind, v_difficulty, v_goal, v_started_on, v_ends_on
  from public.user_profiles
  where id = v_user_id for update;

  if v_arena_id is null or v_kind is null then
    raise exception 'NO_ACTIVE_PACT';
  end if;

  -- A arena tem de continuar sendo da pessoa. Sem isso, trocar o id na coluna
  -- daria premio por arena alheia.
  if not exists (
    select 1 from public.arenas where id = v_arena_id and user_id = v_user_id
  ) then
    raise exception 'PACT_ARENA_NOT_FOUND';
  end if;

  v_reward := case v_difficulty
    when 'leve' then 2
    when 'media' then 5
    when 'alta' then 10
    else 0
  end;

  if v_reward <= 0 then
    raise exception 'UNKNOWN_PACT_DIFFICULTY';
  end if;

  if v_kind = 'volume' then
    if v_goal <> (case v_difficulty when 'leve' then 3 when 'media' then 6 else 10 end)
      or v_ends_on is null
      or v_ends_on <> v_started_on + (case v_difficulty when 'leve' then 7 when 'media' then 14 else 21 end) - 1 then
      raise exception 'INVALID_PACT_WINDOW'; end if;
    select count(distinct st.id) >= v_goal into v_eligible
    from public.scheduled_tasks st join public.actions a on a.id::text=st.action_id::text and a.user_id=v_user_id
    where st.user_id=v_user_id and a.arena_id=v_arena_id and coalesce(st.completed,false)
      and coalesce(a.action_type,'') <> 'Livre'
      and (nullif(st.date::text,'')::date - case when st.start_time >= 0 and st.start_time < 240 then 1 else 0 end)
        between v_started_on and least(v_ends_on,v_today);
  elsif v_kind = 'constancia' then
    -- Dias distintos, nao numero de acoes: cinco entregas num dia valem um dia.
    -- Nada anterior ao aceite conta.
    select count(distinct nullif(st.date::text, '')::date) >= v_goal
      into v_eligible
    from public.scheduled_tasks st
    join public.actions a
      on a.id::text = st.action_id::text
     and a.user_id = v_user_id
    where st.user_id = v_user_id
      and a.arena_id = v_arena_id
      and coalesce(st.completed, false) = true
      and nullif(st.date::text, '')::date >= v_started_on;

  elsif v_kind = 'retomada' then
    select exists (
      select 1
      from public.scheduled_tasks st
      join public.actions a
        on a.id::text = st.action_id::text
       and a.user_id = v_user_id
      where st.user_id = v_user_id
        and a.arena_id = v_arena_id
        and coalesce(st.completed, false) = true
        and nullif(st.date::text, '')::date >= v_started_on
    ) into v_eligible;

  elsif v_kind = 'conclusao' then
    -- Mesma definicao de "arena fechada" usada em claim_glyph_progress_gold:
    -- nenhuma acao da arena abaixo das proprias repeticoes. Acao Livre fica de
    -- fora da conta, como no resto do app.
    select not exists (
      select 1
      from public.actions a
      where a.arena_id = v_arena_id
        and a.user_id = v_user_id
        and coalesce(a.action_type, '') <> 'Livre'
        and (
          select count(*)
          from public.scheduled_tasks st
          where st.user_id = v_user_id
            and st.action_id::text = a.id::text
            and coalesce(st.completed, false) = true
        ) < greatest(1, coalesce(a.repetitions, 1))
    ) and exists (
      select 1
      from public.actions a
      where a.arena_id = v_arena_id
        and a.user_id = v_user_id
        and coalesce(a.action_type, '') <> 'Livre'
    ) into v_eligible;

  else
    raise exception 'UNKNOWN_PACT_KIND';
  end if;

  if not coalesce(v_eligible, false) then
    raise exception 'PACT_NOT_COMPLETE';
  end if;

  -- A identidade do pacto e molde + arena + data de aceite. A mesma arena pode
  -- receber pacto de novo depois, e isso tem de contar como recompensa nova.
  v_marker := v_arena_id::text || ':' || v_kind || ':' || to_char(v_started_on, 'YYYY-MM-DD');

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':arena_pact:' || v_marker, 0));

  if public._starter_reward_has_purchase_marker(v_user_id, 'arena_pact', v_marker) then
    select coalesce((coalesce(wallet, '{}'::jsonb) ->> 'gold')::integer, gold, 0)
      into v_new_gold
    from public.user_profiles
    where id = v_user_id;

    return jsonb_build_object(
      'success', true,
      'already_claimed', true,
      'gold_granted', 0,
      'new_gold', v_new_gold
    );
  end if;

  v_new_gold := public._starter_reward_credit_gold(
    v_user_id,
    v_reward,
    'arena_pact',
    'Recompensa de pacto de arena',
    jsonb_build_object('arena_id', v_arena_id, 'kind', v_kind, 'difficulty', v_difficulty)
  );
  perform public._starter_reward_mark_purchase(v_user_id, 'arena_pact', v_marker, false);

  if v_kind='volume' then
    perform public._starter_reward_mark_purchase(v_user_id,'arena_pact_volume_window',v_arena_id::text || ':' || to_char(v_ends_on,'YYYY-MM-DD'),false);
  end if;
  perform set_config('glyph.pact_write','on',true);
  -- Fecha o pacto na mesma transacao do pagamento: o slot volta a ficar livre
  -- e a mesma linha nao pode pagar duas vezes.
  update public.user_profiles
     set arena_pact_arena_id = null,
         arena_pact_kind = null,
         arena_pact_difficulty = null,
         arena_pact_goal = null,
         arena_pact_started_on = null,
         arena_pact_ends_on = null
   where id = v_user_id;

  perform set_config('glyph.pact_write','off',true);
  return jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'gold_granted', v_reward,
    'new_gold', v_new_gold,
    'kind', v_kind,
    'difficulty', v_difficulty
  );
end;
$$;

revoke all on function public.claim_arena_pact_reward() from public;
grant execute on function public.claim_arena_pact_reward() to authenticated;

create or replace function public.claim_glyph_progress_gold(p_reward_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_reward integer := 0;
  v_eligible boolean := false;
  v_new_gold integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.user_profiles
    where id = v_user_id
      and p_reward_id = any(coalesce(accepted_system_challenges, '{}'::text[]))
  ) then
    raise exception 'MISSION_NOT_ACCEPTED';
  end if;

  if p_reward_id = 'system-five-day-proof-streak' and not exists(
    select 1 from public.user_profiles where id=v_user_id and legacy_five_day_eligible
  ) then raise exception 'MISSION_RETIRED'; end if;

  if p_reward_id = 'system-first-arena-gold' then
    v_reward := 1;
    select exists (
      select 1
      from public.arenas ar
      where ar.user_id = v_user_id
        and exists (
          select 1
          from public.actions a
          where a.arena_id::text = ar.id::text
            and a.user_id = v_user_id
            and coalesce(a.action_type, '') <> 'Livre'
        )
        and not exists (
          select 1
          from public.actions a
          where a.arena_id::text = ar.id::text
            and a.user_id = v_user_id
            and coalesce(a.action_type, '') <> 'Livre'
            and (
              select count(*)
              from public.scheduled_tasks st
              where st.user_id = v_user_id
                and st.action_id::text = a.id::text
                and coalesce(st.completed, false) = true
            ) < greatest(1, coalesce(a.repetitions, 1))
        )
    ) into v_eligible;
  elsif p_reward_id = 'system-five-day-proof-streak' then
    v_reward := 2;
    select coalesce(
      nullif(daily_proof_streak ->> 'current', '')::integer,
      nullif(daily_proof_streak ->> 'current_streak', '')::integer,
      0
    ) >= 5
    into v_eligible
    from public.user_profiles
    where id = v_user_id;
  elsif p_reward_id = 'system-twenty-actions' then
    v_reward := 2;
    select count(*) >= 20
    into v_eligible
    from public.scheduled_tasks st
    join public.actions a
      on a.id::text = st.action_id::text
     and a.user_id = v_user_id
    where st.user_id = v_user_id
      and coalesce(st.completed, false) = true
      and coalesce(a.action_type, '') <> 'Livre';
  else
    raise exception 'UNKNOWN_PROGRESS_REWARD';
  end if;

  if not coalesce(v_eligible, false) then
    raise exception 'REWARD_NOT_ELIGIBLE';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':progress:' || p_reward_id, 0));

  if public._starter_reward_has_purchase_marker(v_user_id, 'progress_reward', p_reward_id) then
    select coalesce((coalesce(wallet, '{}'::jsonb) ->> 'gold')::integer, gold, 0)
    into v_new_gold
    from public.user_profiles
    where id = v_user_id;

    return jsonb_build_object(
      'success', true,
      'already_claimed', true,
      'gold_granted', 0,
      'new_gold', v_new_gold
    );
  end if;

  v_new_gold := public._starter_reward_credit_gold(
    v_user_id,
    v_reward,
    'progress_reward',
    'Recompensa de missao opcional',
    jsonb_build_object('reward_id', p_reward_id)
  );
  perform public._starter_reward_mark_purchase(v_user_id, 'progress_reward', p_reward_id, false);

  return jsonb_build_object(
    'success', true,
    'already_claimed', false,
    'gold_granted', v_reward,
    'new_gold', v_new_gold
  );
end;
$$;
revoke all on function public.claim_glyph_progress_gold(text) from public;
grant execute on function public.claim_glyph_progress_gold(text) to authenticated;

-- Compatibilidade com cron antigo: nao grava novos avisos globais de sequencia.
create or replace function public.suppress_retired_streak_message()
returns trigger language plpgsql set search_path = public as $$
begin
 if coalesce(new.context_snapshot->>'purpose','') = 'streak_alert'
   or coalesce(new.context_snapshot->>'operationalState','') in ('streak_mantida','streak_quebrada')
   or (coalesce(new.context_snapshot->>'purpose','') = 'oracle_speech'
     and (coalesce(new.context_snapshot->>'title','') ~* '^sequ[eê]ncia$'
       or coalesce(new.content,'') ~* '(sequ[eê]ncia|dias seguidos|dias em movimento)')) then
   return null;
 end if;
 return new;
end $$;
drop trigger if exists suppress_retired_streak_message on public.oracle_messages;
create trigger suppress_retired_streak_message before insert on public.oracle_messages
 for each row execute function public.suppress_retired_streak_message();

create or replace function public.retire_global_streak_alert_preference()
returns trigger language plpgsql set search_path = public as $$
begin new.important_alerts_enabled := false; return new; end $$;
update public.oracle_preferences set important_alerts_enabled=false where important_alerts_enabled;
drop trigger if exists retire_global_streak_alert_preference on public.oracle_preferences;
create trigger retire_global_streak_alert_preference before insert or update on public.oracle_preferences
 for each row execute function public.retire_global_streak_alert_preference();
commit;
