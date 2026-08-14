begin;

-- A partnership has one visible arena per participant. The first choice costs
-- gold; replacing that choice does not charge again.
with ranked as (
  select id,
         row_number() over (
           partition by relationship_link_id, created_by_user_id
           order by created_at desc, id desc
         ) as position
  from public.relationship_link_arenas
  where created_by_user_id is not null
    and coalesce(metadata->>'link_type', '') = 'parceria'
)
delete from public.relationship_link_arenas linked
using ranked
where linked.id = ranked.id
  and ranked.position > 1;

create unique index if not exists relationship_link_arenas_one_per_participant_idx
  on public.relationship_link_arenas (relationship_link_id, created_by_user_id)
  where created_by_user_id is not null
    and coalesce(metadata->>'link_type', '') = 'parceria';

create or replace function public.share_relationship_arena(
  p_relationship_link_id uuid,
  p_arena_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_arena public.arenas%rowtype;
  v_existing public.relationship_link_arenas%rowtype;
  v_linked public.relationship_link_arenas%rowtype;
  v_partner_id uuid;
  v_new_gold integer;
  v_sender_nickname text;
  v_changed boolean := true;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and link_type = 'parceria'
    and ended_at is null
    and (mentor_id = v_uid or pupil_id = v_uid)
  for update;
  if not found then raise exception 'ACTIVE_PARTNERSHIP_LINK_REQUIRED'; end if;

  select * into v_arena
  from public.arenas
  where id = p_arena_id
    and user_id = v_uid
    and coalesce(is_archived, false) = false
  for update;
  if not found then raise exception 'PARTNERSHIP_SOURCE_ARENA_REQUIRED'; end if;

  select * into v_existing
  from public.relationship_link_arenas
  where relationship_link_id = v_link.id
    and created_by_user_id = v_uid
    and coalesce(metadata->>'link_type', '') = 'parceria'
  order by created_at desc
  limit 1
  for update;

  if found and v_existing.arena_id = v_arena.id then
    v_changed := false;
    v_linked := v_existing;
    select coalesce((coalesce(wallet, '{}'::jsonb)->>'gold')::integer, gold, 0)
      into v_new_gold from public.user_profiles where id = v_uid;
  else
    if exists (
      select 1
      from public.relationship_link_arenas rla
      join public.relationship_links rl on rl.id = rla.relationship_link_id
      where rla.arena_id = v_arena.id
        and rla.id is distinct from v_existing.id
        and rl.ended_at is null
    ) then
      raise exception 'RELATIONSHIP_ARENA_ALREADY_LINKED';
    end if;

    if v_existing.id is null then
      v_new_gold := public._codex_debit_gold(
        v_uid, 50, 'partnership_linked_arena',
        format('Arena escolhida para parceria: %s', trim(v_arena.name)),
        jsonb_build_object('relationship_link_id', v_link.id, 'arena_id', v_arena.id)
      );
    else
      select coalesce((coalesce(wallet, '{}'::jsonb)->>'gold')::integer, gold, 0)
        into v_new_gold from public.user_profiles where id = v_uid;
      delete from public.relationship_link_arenas where id = v_existing.id;
    end if;

    insert into public.relationship_link_arenas (
      relationship_link_id, arena_id, created_by_user_id, created_at, metadata
    ) values (
      v_link.id, v_arena.id, v_uid, now(),
      jsonb_build_object(
        'link_type', 'parceria', 'owner_user_id', v_uid, 'share_mode', 'live',
        'asset_id', v_arena.asset_id, 'name', v_arena.name,
        'description', coalesce(v_arena.description, ''), 'icon', v_arena.icon
      )
    ) returning * into v_linked;
  end if;

  v_partner_id := case when v_link.mentor_id = v_uid then v_link.pupil_id else v_link.mentor_id end;
  select nickname into v_sender_nickname from public.user_profiles where id = v_uid;

  if v_changed then
    insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
    values (
      extensions.gen_random_uuid(), v_partner_id, 'arena_access',
      format('@%s escolheu "%s" para a parceria.', coalesce(v_sender_nickname, 'Seu parceiro'), v_arena.name),
      false, now(),
      jsonb_build_object('relationshipLinkId', v_link.id, 'arenaId', v_arena.id, 'linkType', 'parceria')
    );
  end if;

  return jsonb_build_object(
    'success', true, 'changed', v_changed, 'new_gold', v_new_gold,
    'arena', to_jsonb(v_arena), 'linked_arena', to_jsonb(v_linked),
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;

-- Builds the two sealed copies without depending on the accepting user's
-- auth.uid(). This is called only while accepting a paid competition invite.
create or replace function public._create_competition_snapshot_from_invite(
  p_relationship_link_id uuid,
  p_source_arena_id uuid,
  p_challenger_id uuid,
  p_opponent_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_source public.arenas%rowtype;
  v_challenger_arena public.arenas%rowtype;
  v_opponent_arena public.arenas%rowtype;
  v_challenge public.relationship_competition_challenges%rowtype;
  v_action_count integer := 0;
  v_total_planned integer := 0;
begin
  select * into v_source
  from public.arenas
  where id = p_source_arena_id
    and user_id = p_challenger_id
    and coalesce(is_archived, false) = false
  for update;
  if not found then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;

  select count(*), coalesce(sum(greatest(1, coalesce(repetitions, 1))), 0)
    into v_action_count, v_total_planned
  from public.actions
  where arena_id = v_source.id and coalesce(action_type, '') <> 'Livre';
  if v_action_count = 0 then raise exception 'COMPETITION_SOURCE_ARENA_EMPTY'; end if;

  insert into public.arenas (id, user_id, asset_id, name, description, icon, is_archived)
  values (extensions.gen_random_uuid(), p_challenger_id, v_source.asset_id, v_source.name,
          coalesce(v_source.description, ''), coalesce(nullif(v_source.icon, ''), '🏆'), false)
  returning * into v_challenger_arena;

  insert into public.arenas (id, user_id, asset_id, name, description, icon, is_archived)
  values (extensions.gen_random_uuid(), p_opponent_id, v_source.asset_id, v_source.name,
          coalesce(v_source.description, ''), coalesce(nullif(v_source.icon, ''), '🏆'), false)
  returning * into v_opponent_arena;

  insert into public.relationship_competition_challenges (
    relationship_link_id, source_arena_id, challenger_user_id, opponent_user_id,
    challenger_arena_id, opponent_arena_id, metadata
  ) values (
    p_relationship_link_id, v_source.id, p_challenger_id, p_opponent_id,
    v_challenger_arena.id, v_opponent_arena.id,
    jsonb_build_object(
      'source_name', v_source.name, 'source_icon', coalesce(v_source.icon, '🏆'),
      'source_asset_id', v_source.asset_id, 'action_count', v_action_count,
      'planned_total', v_total_planned, 'lock_mode', 'snapshot', 'created_from_invite', true
    )
  ) returning * into v_challenge;

  insert into public.actions (
    id, user_id, arena_id, name, description, icon, duration, repetitions,
    action_type, difficulty, briefing, assets, pre_flight, context, origin_codex_id
  )
  select extensions.gen_random_uuid(), p_challenger_id, v_challenger_arena.id,
         name, description, icon, duration, repetitions, action_type, difficulty,
         briefing, coalesce(assets, '[]'::jsonb), coalesce(pre_flight, '[]'::jsonb),
         coalesce(context, '{}'::jsonb), origin_codex_id
  from public.actions where arena_id = v_source.id;

  insert into public.actions (
    id, user_id, arena_id, name, description, icon, duration, repetitions,
    action_type, difficulty, briefing, assets, pre_flight, context, origin_codex_id
  )
  select extensions.gen_random_uuid(), p_opponent_id, v_opponent_arena.id,
         name, description, icon, duration, repetitions, action_type, difficulty,
         briefing, coalesce(assets, '[]'::jsonb), coalesce(pre_flight, '[]'::jsonb),
         coalesce(context, '{}'::jsonb), origin_codex_id
  from public.actions where arena_id = v_source.id;

  insert into public.relationship_link_arenas (
    relationship_link_id, arena_id, created_by_user_id, created_at, metadata
  ) values
  (
    p_relationship_link_id, v_challenger_arena.id, p_challenger_id, now(),
    jsonb_build_object('link_type', 'competicao', 'challenge_id', v_challenge.id,
      'owner_user_id', p_challenger_id, 'lock_mode', 'snapshot',
      'asset_id', v_source.asset_id, 'name', v_source.name, 'icon', v_source.icon)
  ),
  (
    p_relationship_link_id, v_opponent_arena.id, p_opponent_id, now(),
    jsonb_build_object('link_type', 'competicao', 'challenge_id', v_challenge.id,
      'owner_user_id', p_opponent_id, 'lock_mode', 'snapshot',
      'asset_id', v_source.asset_id, 'name', v_source.name, 'icon', v_source.icon)
  );

  return jsonb_build_object('challenge', to_jsonb(v_challenge));
end;
$$;

create or replace function public.create_competition_invite(
  p_recipient_id uuid,
  p_source_arena_id uuid
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
  v_new_gold integer;
  v_action_count integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid then raise exception 'INVALID_RECIPIENT'; end if;

  select * into v_profile from public.user_profiles where id = v_uid;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;

  select * into v_arena from public.arenas
  where id = p_source_arena_id and user_id = v_uid and coalesce(is_archived, false) = false
  for update;
  if not found then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;

  select count(*) into v_action_count from public.actions
  where arena_id = v_arena.id and coalesce(action_type, '') <> 'Livre';
  if v_action_count = 0 then raise exception 'COMPETITION_SOURCE_ARENA_EMPTY'; end if;

  if exists (
    select 1 from public.relationship_links
    where link_type = 'competicao' and ended_at is null
      and ((mentor_id = v_uid and pupil_id = p_recipient_id)
        or (mentor_id = p_recipient_id and pupil_id = v_uid))
  ) then raise exception 'RELATIONSHIP_LINK_ALREADY_ACTIVE'; end if;

  if exists (
    select 1 from public.relationship_link_invites
    where link_type = 'competicao' and status = 'pending'
      and ((sender_id = v_uid and recipient_id = p_recipient_id)
        or (sender_id = p_recipient_id and recipient_id = v_uid))
  ) then raise exception 'RELATIONSHIP_INVITE_ALREADY_PENDING'; end if;

  v_new_gold := public._codex_debit_gold(
    v_uid, 50, 'relationship_invite', format('Desafio: %s', trim(v_arena.name)),
    jsonb_build_object('recipient_id', p_recipient_id, 'link_type', 'competicao', 'arena_id', v_arena.id)
  );

  insert into public.relationship_link_invites (
    sender_id, recipient_id, link_type, arena_id, arena_snapshot, status,
    cost_gold, refunded_at, expires_at
  ) values (
    v_uid, p_recipient_id, 'competicao', v_arena.id,
    jsonb_build_object('name', v_arena.name, 'icon', v_arena.icon, 'actionCount', v_action_count),
    'pending', 50, null, now() + interval '7 days'
  ) returning * into v_invite;

  insert into public.notifications (id, user_id, type, content, read, created_at, metadata)
  values (
    extensions.gen_random_uuid(), p_recipient_id, 'arena_access',
    format('@%s desafiou voce em "%s".', coalesce(v_profile.nickname, 'Um aliado'), v_arena.name),
    false, now(),
    jsonb_build_object('inviteId', v_invite.id, 'senderId', v_uid, 'linkType', 'competicao', 'arenaId', v_arena.id)
  );

  return jsonb_build_object('success', true, 'new_gold', v_new_gold, 'invite', to_jsonb(v_invite));
end;
$$;

create or replace function public.respond_relationship_link_invite(
  p_invite_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.relationship_link_invites%rowtype;
  v_link public.relationship_links%rowtype;
  v_new_gold integer := 0;
  v_competition jsonb := null;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(p_action, '') not in ('accept', 'decline', 'revoke') then
    raise exception 'RELATIONSHIP_INVITE_ACTION_INVALID';
  end if;

  select * into v_invite from public.relationship_link_invites where id = p_invite_id for update;
  if not found then raise exception 'RELATIONSHIP_INVITE_NOT_FOUND'; end if;
  if v_invite.status <> 'pending' then raise exception 'RELATIONSHIP_INVITE_NOT_PENDING'; end if;

  if p_action = 'accept' then
    if v_invite.recipient_id <> v_uid then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;

    perform pg_advisory_xact_lock(hashtextextended(concat_ws(':', v_invite.link_type,
      least(v_invite.sender_id::text, v_invite.recipient_id::text),
      greatest(v_invite.sender_id::text, v_invite.recipient_id::text)), 0));

    if exists (
      select 1 from public.relationship_links rl
      where rl.link_type = v_invite.link_type and rl.ended_at is null
        and ((rl.mentor_id = v_invite.sender_id and rl.pupil_id = v_invite.recipient_id)
          or (rl.mentor_id = v_invite.recipient_id and rl.pupil_id = v_invite.sender_id))
    ) then raise exception 'RELATIONSHIP_LINK_ALREADY_ACTIVE'; end if;

    insert into public.relationship_links (
      mentor_id, pupil_id, link_type, arena_id, arena_snapshot, satisfaction_level
    ) values (
      v_invite.sender_id, v_invite.recipient_id, v_invite.link_type,
      v_invite.arena_id, v_invite.arena_snapshot, 50
    ) returning * into v_link;

    if v_invite.link_type = 'competicao' then
      if v_invite.arena_id is null then raise exception 'COMPETITION_SOURCE_ARENA_REQUIRED'; end if;
      v_competition := public._create_competition_snapshot_from_invite(
        v_link.id, v_invite.arena_id, v_invite.sender_id, v_invite.recipient_id
      );
    end if;

    update public.relationship_link_invites set status = 'accepted', responded_at = now()
    where id = v_invite.id;

    return jsonb_build_object(
      'success', true, 'link', to_jsonb(v_link), 'competition', v_competition,
      'summary', public._relationship_build_capacity_summary(v_uid)
    );
  end if;

  if p_action = 'decline' then
    if v_invite.recipient_id <> v_uid then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
    v_new_gold := public._relationship_refund_pending_invite(v_invite.id, 'declined');
    update public.relationship_link_invites set status = 'declined', responded_at = now() where id = v_invite.id;
    return jsonb_build_object('success', true, 'new_gold', v_new_gold,
      'summary', public._relationship_build_capacity_summary(v_invite.sender_id));
  end if;

  if v_invite.sender_id <> v_uid then raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED'; end if;
  v_new_gold := public._relationship_refund_pending_invite(v_invite.id, 'revoked');
  update public.relationship_link_invites set status = 'revoked', responded_at = now() where id = v_invite.id;
  return jsonb_build_object('success', true, 'new_gold', v_new_gold,
    'summary', public._relationship_build_capacity_summary(v_uid));
end;
$$;

revoke all on function public.create_competition_invite(uuid, uuid) from public;
grant execute on function public.create_competition_invite(uuid, uuid) to authenticated;
revoke all on function public._create_competition_snapshot_from_invite(uuid, uuid, uuid, uuid) from public;
revoke all on function public.share_relationship_arena(uuid, uuid) from public;
grant execute on function public.share_relationship_arena(uuid, uuid) to authenticated;
revoke all on function public.respond_relationship_link_invite(uuid, text) from public;
grant execute on function public.respond_relationship_link_invite(uuid, text) to authenticated;

commit;
