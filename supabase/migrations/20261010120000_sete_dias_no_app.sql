-- SETE DIAS NO GLYPH (10/10/2026).
--
-- Uma missao inicial nova: abrir o app em 7 dias diferentes paga 10 de ouro,
-- uma vez. Os dias nao precisam ser seguidos, e faltar um dia nao zera nada —
-- a missao existe para a pessoa se acostumar com o app, nao para cobrar.
--
-- O QUE ENTRA:
--   1. public.dias_no_app: um dia por linha, por pessoa. Conta ENTRADA, e nao
--      acao concluida — decidido pelo Afonso.
--   2. marcar_dia_no_app(p_dia): o app chama ao abrir e ao voltar para a
--      frente. O dia vem do aparelho (a virada e as 4h, no fuso da pessoa), e
--      o servidor so aceita um dia vizinho ao de hoje em UTC, para ninguem
--      gravar uma semana de uma vez.
--   3. claim_glyph_progress_gold ganha o ramo 'system-seven-days-in-app': o
--      servidor conta os dias e paga 10. A trava de "ja recebeu" e a mesma das
--      outras missoes de ouro.
--
-- So o ramo novo e a excecao do aceite mudam na funcao de resgate; o resto e
-- copia fiel de 20260905180000_pact_volume_retire_global_streak.sql.

create table if not exists public.dias_no_app (
  user_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, dia)
);

alter table public.dias_no_app enable row level security;

drop policy if exists "dias_no_app: cada um le os seus" on public.dias_no_app;
create policy "dias_no_app: cada um le os seus"
  on public.dias_no_app for select
  to authenticated
  using (user_id = auth.uid());

-- Ninguem grava direto: so pela funcao abaixo.
revoke insert, update, delete on public.dias_no_app from anon, authenticated;

create or replace function public.marcar_dia_no_app(p_dia date)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_hoje date := (now() at time zone 'utc')::date;
  v_dias integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_dia is null or p_dia < v_hoje - 1 or p_dia > v_hoje + 1 then
    raise exception 'DIA_FORA_DA_JANELA';
  end if;

  insert into public.dias_no_app (user_id, dia)
  values (v_user_id, p_dia)
  on conflict (user_id, dia) do nothing;

  select count(*)::integer into v_dias
  from public.dias_no_app
  where user_id = v_user_id;

  return jsonb_build_object('success', true, 'dias', v_dias);
end;
$$;
revoke all on function public.marcar_dia_no_app(date) from public;
grant execute on function public.marcar_dia_no_app(date) to authenticated;

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

  -- A missao dos sete dias e INICIAL: roda para todo mundo e nao se aceita.
  if p_reward_id <> 'system-seven-days-in-app' and not exists (
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
  elsif p_reward_id = 'system-seven-days-in-app' then
    v_reward := 10;
    select count(*) >= 7
    into v_eligible
    from public.dias_no_app d
    where d.user_id = v_user_id;
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

-- Para conferir depois de rodar: a tabela existe e a funcao responde.
-- select count(*) from public.dias_no_app;
