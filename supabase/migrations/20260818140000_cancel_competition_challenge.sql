-- Duelo abandonado nao e duelo concluido.
--
-- Ate aqui so existiam dois estados: aberto (completed_at null) e concluido.
-- Quem quisesse destravar a dupla tinha que marcar completed_at, o que entra no
-- historico como se o duelo tivesse terminado - e o vencedor sai errado.
--
-- Cancelar e um terceiro estado: encerra o duelo, libera a dupla e nao paga
-- ninguem. O ouro do desafiante nao volta, porque ele ja foi gasto no aceite;
-- desistir custa, e isso e proposital.

alter table public.relationship_competition_challenges
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references auth.users(id) on delete set null;

-- O indice de duelo ativo passa a ignorar tambem os cancelados, senao um duelo
-- cancelado continuaria bloqueando a dupla.
drop index if exists public.relationship_competition_challenges_active_link_idx;
create unique index if not exists relationship_competition_challenges_active_link_idx
  on public.relationship_competition_challenges (relationship_link_id)
  where completed_at is null and cancelled_at is null;

create or replace function public.cancel_competition_challenge(
  p_challenge_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_challenge public.relationship_competition_challenges%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_challenge
  from public.relationship_competition_challenges
  where id = p_challenge_id
  for update;

  if not found then
    raise exception 'COMPETITION_CHALLENGE_NOT_FOUND';
  end if;

  -- Qualquer um dos dois lados pode desistir: prender alguem num duelo que a
  -- outra pessoa abandonou seria pior do que deixar cancelar.
  if v_challenge.challenger_user_id <> v_uid and v_challenge.opponent_user_id <> v_uid then
    raise exception 'COMPETITION_CHALLENGE_PERMISSION_DENIED';
  end if;

  if v_challenge.completed_at is not null then
    raise exception 'COMPETITION_CHALLENGE_ALREADY_FINISHED';
  end if;

  if v_challenge.cancelled_at is not null then
    return jsonb_build_object('success', true, 'already_cancelled', true);
  end if;

  -- Duelo que ja pagou recompensa nao pode ser desfeito por cancelamento.
  if v_challenge.reward_granted_at is not null then
    raise exception 'COMPETITION_CHALLENGE_ALREADY_FINISHED';
  end if;

  update public.relationship_competition_challenges
  set cancelled_at = now(),
      cancelled_by = v_uid
  where id = p_challenge_id;

  return jsonb_build_object(
    'success', true,
    'challenge_id', p_challenge_id,
    'cancelled_by', v_uid
  );
end;
$$;

revoke all on function public.cancel_competition_challenge(uuid) from public;
grant execute on function public.cancel_competition_challenge(uuid) to authenticated;

comment on column public.relationship_competition_challenges.cancelled_at is
  'Duelo abandonado por um dos lados. Libera a dupla sem declarar vencedor nem pagar recompensa.';

-- Reemitida so para a guarda de duelo ativo passar a ignorar cancelados.
-- Sem isto, cancelar nao libera a dupla e o botao novo nao serve para nada.
create or replace function public.create_competition_invite(
  p_recipient_id uuid,
  p_source_arena_id uuid,
  p_duration_days integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.user_profiles%rowtype;
  v_arena public.arenas%rowtype;
  v_invite public.relationship_link_invites%rowtype;
  v_action_count integer := 0;
  v_total_planned integer := 0;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then raise exception 'INVALID_RECIPIENT'; end if;
  if coalesce(p_duration_days, 0) not between 1 and 30 then raise exception 'COMPETITION_DURATION_INVALID'; end if;

  select * into v_profile from public.user_profiles where id = v_uid;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;

  select * into v_arena from public.arenas
  where id = p_source_arena_id and user_id = v_uid and coalesce(is_archived, false) = false
  for update;
  if not found then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;

  select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
  into v_action_count, v_total_planned
  from public.actions
  where arena_id = v_arena.id and coalesce(action_type, '') <> 'Livre';
  if v_action_count = 0 then raise exception 'COMPETITION_SOURCE_ARENA_EMPTY'; end if;

  if exists (
    select 1 from public.relationship_link_invites
    where link_type = 'competicao' and status = 'pending'
      and ((sender_id = v_uid and recipient_id = p_recipient_id)
        or (sender_id = p_recipient_id and recipient_id = v_uid))
  ) then raise exception 'RELATIONSHIP_INVITE_ALREADY_PENDING'; end if;

  if exists (
    select 1
    from public.relationship_competition_challenges challenge
    where challenge.completed_at is null
      and challenge.cancelled_at is null
      and ((challenge.challenger_user_id = v_uid and challenge.opponent_user_id = p_recipient_id)
        or (challenge.challenger_user_id = p_recipient_id and challenge.opponent_user_id = v_uid))
  ) then raise exception 'COMPETITION_CHALLENGE_ALREADY_ACTIVE'; end if;

  if exists (
    select 1 from public.relationship_competition_challenges
    where reward_granted_at > now() - interval '7 days'
      and ((challenger_user_id = v_uid and opponent_user_id = p_recipient_id)
        or (challenger_user_id = p_recipient_id and opponent_user_id = v_uid))
  ) then raise exception 'COMPETITION_REWARD_COOLDOWN'; end if;

  insert into public.relationship_link_invites (
    sender_id, recipient_id, link_type, arena_id, arena_snapshot, status,
    cost_gold, refunded_at, expires_at
  ) values (
    v_uid, p_recipient_id, 'competicao', v_arena.id,
    jsonb_build_object(
      'name', v_arena.name, 'icon', v_arena.icon, 'actionCount', v_action_count,
      'plannedTotal', v_total_planned, 'durationDays', p_duration_days,
      'rewardChestType', case when v_total_planned >= 6 or v_action_count >= 4 then 'Incomum' else 'Comum' end,
      'rewardXp', public._competition_calculate_bonus_xp(v_total_planned, v_action_count)
    ),
    'pending', 0, null, now() + interval '7 days'
  ) returning * into v_invite;

  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  values (
    extensions.gen_random_uuid(), p_recipient_id, 'arena_access',
    format('@%s desafiou voce em "%s" por %s dia(s).', coalesce(v_profile.nickname, 'Um aliado'), v_arena.name, p_duration_days),
    false, now(),
    jsonb_build_object('inviteId', v_invite.id, 'senderId', v_uid, 'linkType', 'competicao',
      'arenaId', v_arena.id, 'durationDays', p_duration_days)
  );

  return jsonb_build_object('success', true, 'invite', to_jsonb(v_invite));
end;
$$;
