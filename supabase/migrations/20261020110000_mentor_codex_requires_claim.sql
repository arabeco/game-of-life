-- A campanha de mentoria e uma proposta: o orientado a recebe, revisa e so
-- passa a possui-la depois do aceite. A copia criada no aceite mantem o
-- vinculo de mentoria como credito, mas segue editavel pelo novo dono.
begin;

create or replace function public.forge_mentor_codex_for_pupil(
  p_recipient_id uuid,
  p_name text,
  p_description text default '',
  p_template jsonb default '{}'::jsonb,
  p_relationship_link_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_sender public.user_profiles%rowtype;
  v_recipient public.user_profiles%rowtype;
  v_link public.relationship_links%rowtype;
  v_source public.codex%rowtype;
  v_share_id uuid := extensions.gen_random_uuid();
  v_notification_id uuid := extensions.gen_random_uuid();
  v_new_gold integer;
  v_level_count integer := 0;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_sender from public.user_profiles where id = v_uid;
  select * into v_recipient from public.user_profiles where id = p_recipient_id;
  if not found then raise exception 'PUPIL_NOT_FOUND'; end if;

  if jsonb_typeof(coalesce(p_template -> 'levels', 'null'::jsonb)) = 'array' then
    v_level_count := jsonb_array_length(coalesce(p_template -> 'levels', '[]'::jsonb));
  end if;
  if v_level_count <= 0 then raise exception 'CODEX_TEMPLATE_LEVELS_REQUIRED'; end if;

  select * into v_link
  from public.relationship_links
  where id = p_relationship_link_id
    and mentor_id = v_uid
    and pupil_id = p_recipient_id
    and link_type = 'mentoria'
    and ended_at is null
    and (expires_at is null or expires_at > now())
  for update;
  if not found then raise exception 'ACTIVE_MENTORIA_LINK_REQUIRED'; end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    100,
    'mentor_codex_forge',
    format('Proposta de campanha para %s', coalesce(v_recipient.nickname, 'orientado')),
    jsonb_build_object('recipient_id', p_recipient_id, 'relationship_link_id', v_link.id)
  );

  -- O manuscrito fica com quem o escreveu. Nenhuma arena e criada para ele.
  insert into public.codex (
    owner_id, name, description, author, price, template, schema_version,
    is_public, source_type, created_by_user_id, mentor_relationship_link_id
  ) values (
    v_uid,
    coalesce(nullif(trim(p_name), ''), 'Nova Campanha'),
    coalesce(trim(p_description), ''),
    coalesce(nullif(trim(v_sender.nickname), ''), 'Mentor'),
    null, p_template, 'v2', false, 'created', v_uid, v_link.id
  ) returning * into v_source;

  insert into public.notifications (
    id, user_id, type, content, read, created_at, metadata
  ) values (
    v_notification_id,
    p_recipient_id,
    'codex_gift',
    format('@%s preparou uma campanha para voce: "%s".', coalesce(v_sender.nickname, 'Mentor'), v_source.name),
    false,
    now(),
    jsonb_build_object(
      'shareId', v_share_id,
      'codexId', v_source.id,
      'codexName', v_source.name,
      'senderNickname', v_sender.nickname,
      'relationshipLinkId', v_link.id,
      'deliveryMethod', 'mentor_proposal'
    )
  );

  insert into public.codex_shares (
    id, sender_user_id, recipient_user_id, source_codex_id, delivery_method,
    share_token, status, cost_gold, notification_id, metadata
  ) values (
    v_share_id, v_uid, p_recipient_id, v_source.id, 'in_app',
    null, 'pending', 100, v_notification_id,
    jsonb_build_object('mentorRelationshipLinkId', v_link.id, 'deliveryMethod', 'mentor_proposal')
  );

  insert into public.user_purchases (
    user_id, product_type, product_id, gold_spent, expires_at, is_active, purchased_at
  ) values (
    v_uid, 'mentor_codex_forge', v_share_id::text, 100, null, true, now()
  );

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'share_id', v_share_id,
    'codex_name', v_source.name
  );
end;
$$;

create or replace function public.claim_codex_share(
  p_token text default null,
  p_share_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_share public.codex_shares%rowtype;
  v_codex public.codex%rowtype;
  v_new_codex_id uuid := extensions.gen_random_uuid();
  v_source_type text;
  v_mentor_link_id uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_share_id is not null then
    select * into v_share from public.codex_shares where id = p_share_id for update;
  elsif coalesce(trim(p_token), '') <> '' then
    select * into v_share from public.codex_shares where share_token = trim(p_token) for update;
  else
    raise exception 'SHARE_REFERENCE_REQUIRED';
  end if;
  if not found then raise exception 'Esse convite de Codex nao existe mais.'; end if;
  if v_share.sender_user_id = v_uid then raise exception 'Voce nao pode reivindicar o proprio Codex.'; end if;
  if v_share.delivery_method = 'in_app' and v_share.recipient_user_id <> v_uid then
    raise exception 'Esse Codex nao foi enviado para voce.';
  end if;
  if v_share.status <> 'pending' then raise exception 'Esse Codex ja foi reivindicado ou expirou.'; end if;

  select * into v_codex from public.codex where id = v_share.source_codex_id;
  if not found then raise exception 'O Codex de origem nao foi encontrado.'; end if;
  if not public._codex_template_is_shareable(v_codex.template) then
    raise exception 'Esse Codex nao esta pronto para ser reivindicado.';
  end if;

  v_source_type := case when v_share.delivery_method = 'external_link' then 'gift_link' else 'gift_in_app' end;
  v_mentor_link_id := nullif(v_share.metadata ->> 'mentorRelationshipLinkId', '')::uuid;

  insert into public.codex (
    id, owner_id, catalog_id, name, description, author, price, template,
    schema_version, is_public, created_at, updated_at, source_type,
    origin_codex_id, created_by_user_id, mentor_relationship_link_id
  ) values (
    v_new_codex_id, v_uid, v_codex.catalog_id, v_codex.name, v_codex.description,
    v_codex.author, null, v_codex.template, coalesce(v_codex.schema_version, 'v2'),
    false, now(), now(), v_source_type, v_codex.id,
    coalesce(v_codex.created_by_user_id, v_share.sender_user_id, v_codex.owner_id),
    v_mentor_link_id
  );

  update public.codex_shares
  set status = 'claimed', claimed_by_user_id = v_uid, claimed_codex_id = v_new_codex_id, claimed_at = now()
  where id = v_share.id;
  if v_share.notification_id is not null then
    update public.notifications set read = true where id = v_share.notification_id and user_id = v_uid;
  end if;

  return jsonb_build_object('success', true, 'share_id', v_share.id, 'codex_id', v_new_codex_id, 'codex_name', v_codex.name);
end;
$$;

revoke all on function public.forge_mentor_codex_for_pupil(uuid, text, text, jsonb, uuid) from public;
revoke all on function public.claim_codex_share(text, uuid) from public;
grant execute on function public.forge_mentor_codex_for_pupil(uuid, text, text, jsonb, uuid) to authenticated;
grant execute on function public.claim_codex_share(text, uuid) to authenticated;

commit;
