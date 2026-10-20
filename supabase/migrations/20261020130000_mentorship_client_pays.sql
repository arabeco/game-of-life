-- Mentoria e um servico pedido/aceito pelo cliente. Quem cria o convite pode
-- ser coach ou cliente, mas quem paga e sempre o mentorado, no aceite.

begin;

create or replace function public.propose_client_paid_mentorship(
  p_recipient_id uuid,
  p_pupil_id uuid,
  p_renewal_link_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_link public.relationship_links%rowtype;
  v_invite public.relationship_link_invites%rowtype;
  v_pupil uuid;
  v_price integer;
  v_snapshot jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_recipient_id is null or p_recipient_id = v_uid or p_pupil_id not in (v_uid, p_recipient_id) then
    raise exception 'INVALID_RECIPIENT';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(concat_ws(':', 'mentoria', least(v_uid::text, p_recipient_id::text), greatest(v_uid::text, p_recipient_id::text)), 0));
  if exists (select 1 from public.relationship_link_invites where status = 'pending' and link_type = 'mentoria'
    and ((sender_id = v_uid and recipient_id = p_recipient_id) or (sender_id = p_recipient_id and recipient_id = v_uid))) then
    raise exception 'RELATIONSHIP_INVITE_ALREADY_PENDING';
  end if;

  v_pupil := p_pupil_id;
  if p_renewal_link_id is not null then
    select * into v_link from public.relationship_links where id = p_renewal_link_id and link_type = 'mentoria'
      and v_uid in (mentor_id, pupil_id) and p_recipient_id in (mentor_id, pupil_id) for update;
    if not found or public.relationship_link_is_live(v_link) then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
    v_pupil := v_link.pupil_id;
    v_price := 40;
    select jsonb_build_object('name', 'Renovação', 'selection', coalesce(jsonb_agg(jsonb_build_object('arenaId', s.arena_id, 'name', a.name, 'ownerId', a.user_id)), '[]'::jsonb))
      into v_snapshot
      from public.relationship_link_arenas s join public.arenas a on a.id = s.arena_id
      where s.relationship_link_id = v_link.id and not coalesce(a.is_archived, false);
  else
    if exists (select 1 from public.relationship_links where link_type = 'mentoria' and ended_at is null
      and v_uid in (mentor_id, pupil_id) and p_recipient_id in (mentor_id, pupil_id)) then
      raise exception 'RELATIONSHIP_LINK_ALREADY_ACTIVE';
    end if;
    v_price := 75;
  end if;

  insert into public.relationship_link_invites(sender_id, recipient_id, link_type, status, cost_gold, expires_at, arena_slots, renewal_link_id, pupil_user_id, arena_snapshot)
  values (v_uid, p_recipient_id, 'mentoria', 'pending', v_price, now() + interval '7 days', 1, p_renewal_link_id, v_pupil, v_snapshot)
  returning * into v_invite;
  insert into public.notifications(id, user_id, type, content, read, metadata)
  values (extensions.gen_random_uuid(), p_recipient_id, 'mentor_invite', 'Novo convite de mentoria.', false,
    jsonb_build_object('inviteId', v_invite.id, 'linkType', 'mentoria', 'clientPays', true, 'clientId', v_pupil));
  return jsonb_build_object('success', true, 'invite', to_jsonb(v_invite));
end;
$$;

create or replace function public.respond_client_paid_mentorship_invite(p_invite_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.relationship_link_invites%rowtype;
  v_pupil uuid;
  v_gold integer;
begin
  select * into v_invite from public.relationship_link_invites where id = p_invite_id for update;
  if not found or v_invite.link_type <> 'mentoria' or v_uid is null or v_uid not in (v_invite.sender_id, v_invite.recipient_id) then
    raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_invite.id::text, 0));
  if v_invite.status <> 'pending' then raise exception 'RELATIONSHIP_INVITE_NOT_PENDING'; end if;
  if p_action in ('decline', 'revoke') then
    if (p_action = 'decline' and v_uid <> v_invite.recipient_id) or (p_action = 'revoke' and v_uid <> v_invite.sender_id) then
      raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED';
    end if;
    update public.relationship_link_invites set status = case p_action when 'decline' then 'declined' else 'revoked' end, responded_at = now() where id = v_invite.id;
    return jsonb_build_object('success', true);
  end if;
  if p_action <> 'accept' or v_uid <> v_invite.recipient_id or v_invite.expires_at <= now() then
    raise exception 'RELATIONSHIP_INVITE_PERMISSION_DENIED';
  end if;
  v_pupil := coalesce(v_invite.pupil_user_id, v_invite.recipient_id);
  v_gold := public._codex_debit_gold(v_pupil, v_invite.cost_gold, 'mentorship_access', 'Mentoria · 30 dias', jsonb_build_object('invite_id', v_invite.id));
  return public.respond_relationship_link_invite(v_invite.id, 'accept') || jsonb_build_object('client_new_gold', v_gold);
end;
$$;

create or replace function public.renew_client_paid_mentorship(p_relationship_link_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_link public.relationship_links%rowtype;
begin
  select * into v_link from public.relationship_links where id = p_relationship_link_id and auth.uid() in (mentor_id, pupil_id);
  if not found or v_link.link_type <> 'mentoria' then raise exception 'RELATIONSHIP_LINK_NOT_FOUND'; end if;
  return public.propose_client_paid_mentorship(case when auth.uid() = v_link.mentor_id then v_link.pupil_id else v_link.mentor_id end, v_link.pupil_id, v_link.id);
end;
$$;

-- Uma campanha e parte do acompanhamento comprado. O mentor ainda precisa de
-- vinculo ativo e a pessoa continua aceitando antes de receber a copia.
create or replace function public.forge_mentor_codex_for_pupil(
  p_recipient_id uuid, p_name text, p_description text default '', p_template jsonb default '{}'::jsonb, p_relationship_link_id uuid default null
)
returns jsonb language plpgsql security definer set search_path = public, auth, extensions as $$
declare v_uid uuid := auth.uid(); v_sender public.user_profiles%rowtype; v_recipient public.user_profiles%rowtype;
  v_link public.relationship_links%rowtype; v_source public.codex%rowtype; v_share_id uuid := extensions.gen_random_uuid();
  v_notification_id uuid := extensions.gen_random_uuid(); v_level_count integer := 0;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_sender from public.user_profiles where id = v_uid;
  select * into v_recipient from public.user_profiles where id = p_recipient_id;
  if not found then raise exception 'PUPIL_NOT_FOUND'; end if;
  if jsonb_typeof(coalesce(p_template -> 'levels', 'null'::jsonb)) = 'array' then v_level_count := jsonb_array_length(coalesce(p_template -> 'levels', '[]'::jsonb)); end if;
  if v_level_count <= 0 then raise exception 'CODEX_TEMPLATE_LEVELS_REQUIRED'; end if;
  select * into v_link from public.relationship_links where id = p_relationship_link_id and mentor_id = v_uid and pupil_id = p_recipient_id
    and link_type = 'mentoria' and ended_at is null and (expires_at is null or expires_at > now()) for update;
  if not found then raise exception 'ACTIVE_MENTORIA_LINK_REQUIRED'; end if;
  insert into public.codex(owner_id, name, description, author, price, template, schema_version, is_public, source_type, created_by_user_id, mentor_relationship_link_id)
  values (v_uid, coalesce(nullif(trim(p_name), ''), 'Nova Campanha'), coalesce(trim(p_description), ''), coalesce(nullif(trim(v_sender.nickname), ''), 'Mentor'), null, p_template, 'v2', false, 'created', v_uid, v_link.id) returning * into v_source;
  insert into public.notifications(id, user_id, type, content, read, created_at, metadata)
  values (v_notification_id, p_recipient_id, 'codex_gift', format('@%s preparou uma campanha para voce: "%s".', coalesce(v_sender.nickname, 'Mentor'), v_source.name), false, now(), jsonb_build_object('shareId', v_share_id, 'codexId', v_source.id, 'codexName', v_source.name, 'senderNickname', v_sender.nickname, 'relationshipLinkId', v_link.id, 'deliveryMethod', 'mentor_proposal'));
  insert into public.codex_shares(id, sender_user_id, recipient_user_id, source_codex_id, delivery_method, share_token, status, cost_gold, notification_id, metadata)
  values (v_share_id, v_uid, p_recipient_id, v_source.id, 'in_app', null, 'pending', 0, v_notification_id, jsonb_build_object('mentorRelationshipLinkId', v_link.id, 'deliveryMethod', 'mentor_proposal'));
  return jsonb_build_object('success', true, 'new_gold', null, 'share_id', v_share_id, 'codex_name', v_source.name);
end;
$$;

create or replace function public.decline_codex_share(p_share_id uuid)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_share public.codex_shares%rowtype;
begin
  select * into v_share from public.codex_shares where id = p_share_id for update;
  if not found or auth.uid() is null or v_share.recipient_user_id <> auth.uid() or v_share.delivery_method <> 'in_app' then
    raise exception 'SHARE_PERMISSION_DENIED';
  end if;
  if v_share.status <> 'pending' then raise exception 'SHARE_NOT_PENDING'; end if;
  update public.codex_shares set status = 'declined' where id = v_share.id;
  if v_share.notification_id is not null then
    update public.notifications set read = true where id = v_share.notification_id and user_id = auth.uid();
  end if;
  return jsonb_build_object('success', true, 'share_id', v_share.id);
end;
$$;

revoke all on function public.propose_client_paid_mentorship(uuid, uuid, uuid) from public, anon;
revoke all on function public.respond_client_paid_mentorship_invite(uuid, text) from public, anon;
revoke all on function public.renew_client_paid_mentorship(uuid) from public, anon;
revoke all on function public.decline_codex_share(uuid) from public, anon;
grant execute on function public.propose_client_paid_mentorship(uuid, uuid, uuid) to authenticated;
grant execute on function public.respond_client_paid_mentorship_invite(uuid, text) to authenticated;
grant execute on function public.renew_client_paid_mentorship(uuid) to authenticated;
grant execute on function public.decline_codex_share(uuid) to authenticated;

commit;
