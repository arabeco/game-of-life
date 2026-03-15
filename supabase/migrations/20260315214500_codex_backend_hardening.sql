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
    select id
    into v_link_id
    from public.relationship_links
    where id = p_relationship_link_id
      and link_type = 'mentoria'
      and status = 'active'
      and mentor_id = p_sender_id
      and pupil_id = p_recipient_id;
  else
    select id
    into v_link_id
    from public.relationship_links
    where link_type = 'mentoria'
      and status = 'active'
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

revoke all on function public._codex_resolve_active_mentor_link(uuid, uuid, uuid) from public;

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
  v_recipient_profile public.user_profiles%rowtype;
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

  select *
  into v_sender_profile
  from public.user_profiles
  where id = v_uid;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select *
  into v_recipient_profile
  from public.user_profiles
  where id = p_recipient_id;

  if not found then
    raise exception 'PUPIL_NOT_FOUND';
  end if;

  if v_uid = p_recipient_id then
    raise exception 'INVALID_RECIPIENT';
  end if;

  v_relationship_link_id := public._codex_resolve_active_mentor_link(v_uid, p_recipient_id, p_relationship_link_id);

  select *
  into v_source_codex
  from public.codex
  where id = p_source_codex_id
    and owner_id = v_uid
  for update;

  if not found then
    raise exception 'CODEX_NOT_FOUND';
  end if;

  if coalesce(v_source_codex.source_type, 'created') <> 'created' then
    raise exception 'Apenas Codex autoral pode ser entregue ao pupilo.';
  end if;

  if not public._codex_template_is_shareable(v_source_codex.template) then
    raise exception 'Finalize o manuscrito antes de entregar ao pupilo.';
  end if;

  insert into public.codex (
    owner_id,
    catalog_id,
    name,
    description,
    author,
    price,
    template,
    schema_version,
    is_public,
    source_type,
    created_by_user_id,
    origin_codex_id
  ) values (
    p_recipient_id,
    null,
    coalesce(v_source_codex.name, 'Codex sem nome'),
    coalesce(v_source_codex.description, ''),
    coalesce(v_source_codex.author, v_sender_profile.nickname, 'Mentor'),
    null,
    v_source_codex.template,
    coalesce(v_source_codex.schema_version, 'v2'),
    false,
    'gift_in_app',
    v_uid,
    v_source_codex.id
  )
  returning * into v_inserted_codex;

  insert into public.notifications (
    id,
    user_id,
    type,
    content,
    read,
    created_at,
    metadata
  ) values (
    v_notification_id,
    p_recipient_id,
    'codex_gift',
    format('@%s enviou o Codex "%s" para voce.', coalesce(v_sender_profile.nickname, 'Mentor'), coalesce(v_source_codex.name, 'Codex')),
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

create or replace function public.enforce_codex_creation_slot_limit()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_allowed_slots integer;
  v_used_slots integer;
begin
  if new.owner_id is null then
    return new;
  end if;

  if coalesce(new.source_type, 'created') <> 'created' then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and coalesce(old.source_type, 'created') = 'created'
     and old.owner_id is not distinct from new.owner_id then
    return new;
  end if;

  select 1 + coalesce(codex_creation_slots_purchased, 0)
  into v_allowed_slots
  from public.user_profiles
  where id = new.owner_id;

  if v_allowed_slots is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  select count(*)
  into v_used_slots
  from public.codex
  where owner_id = new.owner_id
    and coalesce(source_type, 'created') = 'created'
    and id <> new.id;

  if v_used_slots >= v_allowed_slots then
    raise exception 'SLOT_LIMIT_REACHED'
      using detail = format('created_codexes=%s, allowed_slots=%s', v_used_slots, v_allowed_slots),
            hint = 'Compre outro slot de criacao para forjar mais um Codex autoral.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_codex_creation_slot_limit on public.codex;

create trigger enforce_codex_creation_slot_limit
before insert or update of owner_id, source_type
on public.codex
for each row
execute function public.enforce_codex_creation_slot_limit();

revoke all on function public.deliver_authored_codex_to_pupil(uuid, uuid, uuid) from public;
grant execute on function public.deliver_authored_codex_to_pupil(uuid, uuid, uuid) to authenticated;
