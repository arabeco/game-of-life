begin;

-- Consolidated model:
-- 1. Creating a social link is free and has no capacity slots.
-- 2. Valuable actions keep their gold cost in their own RPCs.
-- 3. Mentorship links are open; delivering an existing authored campaign is Premium.

do $$
declare
  v_missing text[] := array[]::text[];
begin
  if to_regclass('public.user_profiles') is null then
    v_missing := array_append(v_missing, 'public.user_profiles');
  end if;
  if to_regclass('public.relationship_link_invites') is null then
    v_missing := array_append(v_missing, 'public.relationship_link_invites');
  end if;
  if to_regclass('public.relationship_links') is null then
    v_missing := array_append(v_missing, 'public.relationship_links');
  end if;
  if to_regclass('public.relationship_link_arenas') is null then
    v_missing := array_append(v_missing, 'public.relationship_link_arenas');
  end if;
  if to_regclass('public.codex') is null then
    v_missing := array_append(v_missing, 'public.codex');
  end if;

  if cardinality(v_missing) > 0 then
    raise exception 'RELATIONSHIP_MIGRATION_MISSING_TABLES: %', array_to_string(v_missing, ', ');
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'codex'
      and column_name = 'mentor_relationship_link_id'
  ) then
    raise exception 'RELATIONSHIP_MIGRATION_MISSING_COLUMN: public.codex.mentor_relationship_link_id';
  end if;

  if to_regprocedure('public._codex_set_wallet_gold(uuid,integer)') is null then
    raise exception 'RELATIONSHIP_MIGRATION_MISSING_FUNCTION: public._codex_set_wallet_gold(uuid,integer)';
  end if;
  if to_regprocedure('public._relationship_refund_pending_invite(uuid,text)') is null then
    raise exception 'RELATIONSHIP_MIGRATION_MISSING_FUNCTION: public._relationship_refund_pending_invite(uuid,text)';
  end if;
  if to_regprocedure('public._codex_user_has_mentor_access(uuid)') is null then
    raise exception 'RELATIONSHIP_MIGRATION_MISSING_FUNCTION: public._codex_user_has_mentor_access(uuid)';
  end if;
  if to_regprocedure('public._codex_template_is_shareable(jsonb)') is null then
    raise exception 'RELATIONSHIP_MIGRATION_MISSING_FUNCTION: public._codex_template_is_shareable(jsonb)';
  end if;
end;
$$;

create or replace function public._relationship_get_invite_cost(p_link_type text)
returns integer
language plpgsql
immutable
as $$
begin
  case coalesce(p_link_type, '')
    when 'mentoria' then return 0;
    when 'parceria' then return 0;
    when 'competicao' then return 0;
    else raise exception 'RELATIONSHIP_LINK_TYPE_INVALID';
  end case;
end;
$$;

create or replace function public._codex_debit_gold(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_profile public.user_profiles%rowtype;
  v_current_gold integer;
  v_new_gold integer;
begin
  if p_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_current_gold := coalesce(
    (coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer,
    v_profile.gold,
    0
  );

  -- Relationship invitations intentionally generate no debit or ledger row.
  if p_type = 'relationship_invite' and coalesce(p_amount, 0) = 0 then
    return v_current_gold;
  end if;

  if coalesce(p_amount, 0) <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  if v_current_gold < p_amount then
    raise exception 'Saldo insuficiente de Ouro.';
  end if;

  v_new_gold := v_current_gold - p_amount;
  perform public._codex_set_wallet_gold(p_user_id, v_new_gold);

  insert into public.transactions (
    id, user_id, type, currency, amount, description, created_at, metadata
  ) values (
    extensions.gen_random_uuid(),
    p_user_id,
    p_type,
    'gold',
    -abs(p_amount),
    p_description,
    now(),
    coalesce(p_metadata, '{}'::jsonb)
  );

  return v_new_gold;
end;
$$;

-- Old Premium/capacity triggers conflict with the simplified relationship model.
drop trigger if exists enforce_premium_mentoria_invites on public.relationship_link_invites;
drop trigger if exists enforce_premium_mentoria_links on public.relationship_links;

create or replace function public._relationship_build_capacity_summary(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_partnership integer := 0;
  v_competition integer := 0;
  v_mentor integer := 0;
  v_pupil_mentor integer := 0;
  v_linked_arenas integer := 0;
begin
  if not exists (select 1 from public.user_profiles where id = p_user_id) then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select count(*) into v_partnership
  from public.relationship_links
  where link_type = 'parceria'
    and ended_at is null
    and (mentor_id = p_user_id or pupil_id = p_user_id);

  select count(*) into v_competition
  from public.relationship_links
  where link_type = 'competicao'
    and ended_at is null
    and (mentor_id = p_user_id or pupil_id = p_user_id);

  select count(*) into v_mentor
  from public.relationship_links
  where link_type = 'mentoria'
    and ended_at is null
    and mentor_id = p_user_id;

  select count(*) into v_pupil_mentor
  from public.relationship_links
  where link_type = 'mentoria'
    and ended_at is null
    and pupil_id = p_user_id;

  select count(*) into v_linked_arenas
  from public.relationship_link_arenas rla
  join public.relationship_links rl on rl.id = rla.relationship_link_id
  where rl.ended_at is null
    and (rl.mentor_id = p_user_id or rl.pupil_id = p_user_id);

  return jsonb_build_object(
    'partnership', jsonb_build_object(
      'used', v_partnership, 'limit', greatest(v_partnership, 1),
      'base', 0, 'purchased', 0, 'costGold', 0,
      'requiresPremium', false, 'unlimited', true
    ),
    'competition', jsonb_build_object(
      'used', v_competition, 'limit', greatest(v_competition, 1),
      'base', 0, 'purchased', 0, 'costGold', 0,
      'requiresPremium', false, 'unlimited', true
    ),
    'mentor', jsonb_build_object(
      'used', v_mentor, 'limit', greatest(v_mentor, 1),
      'base', 0, 'purchased', 0, 'costGold', 0,
      'requiresPremium', false, 'unlimited', true
    ),
    'linked_arena', jsonb_build_object(
      'used', v_linked_arenas, 'limit', greatest(v_linked_arenas, 1),
      'base', 0, 'purchased', 0, 'costGold', 50,
      'requiresPremium', false, 'unlimited', true
    ),
    'pupil_mentor', jsonb_build_object(
      'used', v_pupil_mentor, 'limit', greatest(v_pupil_mentor, 1),
      'base', 0, 'purchased', 0, 'costGold', 0,
      'requiresPremium', false, 'unlimited', true
    )
  );
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
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(p_action, '') not in ('accept', 'decline', 'revoke') then
    raise exception 'RELATIONSHIP_INVITE_ACTION_INVALID';
  end if;

  select *
  into v_invite
  from public.relationship_link_invites
  where id = p_invite_id
  for update;

  if not found then
    raise exception 'RELATIONSHIP_INVITE_NOT_FOUND';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'RELATIONSHIP_INVITE_NOT_PENDING';
  end if;

  if p_action = 'accept' then
    if v_invite.recipient_id <> v_uid then
      raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED';
    end if;

    -- Serialize accepts for the same pair/type and prevent duplicate live links.
    perform pg_advisory_xact_lock(hashtextextended(
      concat_ws(':',
        v_invite.link_type,
        least(v_invite.sender_id::text, v_invite.recipient_id::text),
        greatest(v_invite.sender_id::text, v_invite.recipient_id::text)
      ),
      0
    ));

    if exists (
      select 1
      from public.relationship_links rl
      where rl.link_type = v_invite.link_type
        and rl.ended_at is null
        and (
          (rl.mentor_id = v_invite.sender_id and rl.pupil_id = v_invite.recipient_id)
          or (rl.mentor_id = v_invite.recipient_id and rl.pupil_id = v_invite.sender_id)
        )
    ) then
      raise exception 'RELATIONSHIP_LINK_ALREADY_ACTIVE';
    end if;

    insert into public.relationship_links (
      mentor_id, pupil_id, link_type, arena_id, arena_snapshot, satisfaction_level
    ) values (
      v_invite.sender_id,
      v_invite.recipient_id,
      v_invite.link_type,
      v_invite.arena_id,
      v_invite.arena_snapshot,
      50
    )
    returning * into v_link;

    update public.relationship_link_invites
    set status = 'accepted', responded_at = now()
    where id = v_invite.id;

    if v_invite.arena_id is not null
       and exists (select 1 from public.arenas a where a.id = v_invite.arena_id) then
      insert into public.relationship_link_arenas (
        relationship_link_id, arena_id, created_by_user_id, created_at, metadata
      ) values (
        v_link.id,
        v_invite.arena_id,
        v_invite.sender_id,
        now(),
        jsonb_build_object('source', 'legacy_invite_accept')
      )
      on conflict (relationship_link_id, arena_id) do nothing;
    end if;

    return jsonb_build_object(
      'success', true,
      'link', to_jsonb(v_link),
      'summary', public._relationship_build_capacity_summary(v_uid)
    );
  end if;

  if p_action = 'decline' then
    if v_invite.recipient_id <> v_uid then
      raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED';
    end if;

    v_new_gold := public._relationship_refund_pending_invite(v_invite.id, 'declined');
    update public.relationship_link_invites
    set status = 'declined', responded_at = now()
    where id = v_invite.id;

    return jsonb_build_object(
      'success', true,
      'new_gold', v_new_gold,
      'summary', public._relationship_build_capacity_summary(v_invite.sender_id)
    );
  end if;

  if v_invite.sender_id <> v_uid then
    raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED';
  end if;

  v_new_gold := public._relationship_refund_pending_invite(v_invite.id, 'revoked');
  update public.relationship_link_invites
  set status = 'revoked', responded_at = now()
  where id = v_invite.id;

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'summary', public._relationship_build_capacity_summary(v_uid)
  );
end;
$$;

create or replace function public._codex_resolve_active_mentor_link(
  p_sender_id uuid,
  p_recipient_id uuid,
  p_relationship_link_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_link_id uuid;
begin
  if p_sender_id is null or p_recipient_id is null then
    raise exception 'MENTOR_LINK_REQUIRED';
  end if;

  if p_relationship_link_id is not null then
    select id into v_link_id
    from public.relationship_links
    where id = p_relationship_link_id
      and link_type = 'mentoria'
      and ended_at is null
      and mentor_id = p_sender_id
      and pupil_id = p_recipient_id;
  else
    select id into v_link_id
    from public.relationship_links
    where link_type = 'mentoria'
      and ended_at is null
      and mentor_id = p_sender_id
      and pupil_id = p_recipient_id
    order by created_at desc nulls last
    limit 1;
  end if;

  if v_link_id is null then
    raise exception 'MENTOR_LINK_REQUIRED';
  end if;

  return v_link_id;
end;
$$;

create or replace function public.deliver_authored_codex_to_pupil(
  p_source_codex_id uuid,
  p_recipient_id uuid,
  p_relationship_link_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_sender_profile public.user_profiles%rowtype;
  v_source_codex public.codex%rowtype;
  v_inserted_codex public.codex%rowtype;
  v_notification_id uuid := extensions.gen_random_uuid();
  v_relationship_link_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not coalesce(public._codex_user_has_mentor_access(v_uid), false) then
    raise exception 'MENTOR_PREMIUM_REQUIRED';
  end if;

  select * into v_sender_profile
  from public.user_profiles
  where id = v_uid;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if p_recipient_id is null or p_recipient_id = v_uid then
    raise exception 'INVALID_RECIPIENT';
  end if;

  if not exists (select 1 from public.user_profiles where id = p_recipient_id) then
    raise exception 'PUPIL_NOT_FOUND';
  end if;

  v_relationship_link_id := public._codex_resolve_active_mentor_link(
    v_uid,
    p_recipient_id,
    p_relationship_link_id
  );

  select * into v_source_codex
  from public.codex
  where id = p_source_codex_id
    and owner_id = v_uid
  for update;

  if not found then
    raise exception 'CODEX_NOT_FOUND';
  end if;

  if coalesce(v_source_codex.source_type, 'created') <> 'created' then
    raise exception 'Apenas campanha autoral pode ser entregue ao pupilo.';
  end if;

  if not public._codex_template_is_shareable(v_source_codex.template) then
    raise exception 'Finalize a campanha antes de entregar ao pupilo.';
  end if;

  insert into public.codex (
    owner_id, catalog_id, name, description, author, price, template,
    schema_version, is_public, source_type, created_by_user_id,
    origin_codex_id, mentor_relationship_link_id
  ) values (
    p_recipient_id,
    null,
    coalesce(v_source_codex.name, 'Campanha sem nome'),
    coalesce(v_source_codex.description, ''),
    coalesce(v_source_codex.author, v_sender_profile.nickname, 'Mentor'),
    null,
    v_source_codex.template,
    coalesce(v_source_codex.schema_version, 'v2'),
    false,
    'gift_in_app',
    v_uid,
    v_source_codex.id,
    v_relationship_link_id
  )
  returning * into v_inserted_codex;

  insert into public.notifications (
    id, user_id, type, content, read, created_at, metadata
  ) values (
    v_notification_id,
    p_recipient_id,
    'codex_gift',
    format('@%s enviou a campanha "%s" para voce.',
      coalesce(v_sender_profile.nickname, 'Mentor'),
      coalesce(v_source_codex.name, 'Campanha')
    ),
    false,
    now(),
    jsonb_build_object(
      'codexId', v_inserted_codex.id,
      'originCodexId', v_source_codex.id,
      'codexName', v_inserted_codex.name,
      'senderNickname', v_sender_profile.nickname,
      'relationshipLinkId', v_relationship_link_id
    )
  );

  return jsonb_build_object(
    'success', true,
    'codex_id', v_inserted_codex.id,
    'codex_name', v_inserted_codex.name,
    'relationship_link_id', v_relationship_link_id
  );
end;
$$;

-- Repair old mentorship deliveries that predate relationship linkage.
update public.codex c
set mentor_relationship_link_id = (
  select rl.id
  from public.relationship_links rl
  where rl.link_type = 'mentoria'
    and rl.mentor_id = c.created_by_user_id
    and rl.pupil_id = c.owner_id
  order by
    case when rl.ended_at is null then 0 else 1 end,
    rl.created_at desc nulls last
  limit 1
)
where c.mentor_relationship_link_id is null
  and c.source_type = 'gift_in_app'
  and c.created_by_user_id is not null
  and exists (
    select 1
    from public.relationship_links rl
    where rl.link_type = 'mentoria'
      and rl.mentor_id = c.created_by_user_id
      and rl.pupil_id = c.owner_id
  );

create index if not exists relationship_links_active_type_participants_idx
  on public.relationship_links (link_type, mentor_id, pupil_id)
  where ended_at is null;

create index if not exists codex_mentor_relationship_link_idx
  on public.codex (mentor_relationship_link_id, created_by_user_id, origin_codex_id);

revoke all on function public._relationship_get_invite_cost(text) from public;
revoke all on function public._codex_debit_gold(uuid, integer, text, text, jsonb) from public;
revoke all on function public._relationship_build_capacity_summary(uuid) from public;
revoke all on function public._codex_resolve_active_mentor_link(uuid, uuid, uuid) from public;

revoke all on function public.respond_relationship_link_invite(uuid, text) from public;
grant execute on function public.respond_relationship_link_invite(uuid, text) to authenticated;

revoke all on function public.deliver_authored_codex_to_pupil(uuid, uuid, uuid) from public;
grant execute on function public.deliver_authored_codex_to_pupil(uuid, uuid, uuid) to authenticated;

commit;

-- Post-run audit. Expected costs: invites 0; actions 50/50/50; new campaign 100.
select
  public._relationship_get_invite_cost('mentoria') as convite_mentoria,
  public._relationship_get_invite_cost('parceria') as convite_parceria,
  public._relationship_get_invite_cost('competicao') as convite_competicao,
  50 as arena_mentoria,
  50 as arena_parceria,
  50 as duelo_competitivo,
  100 as campanha_nova;
