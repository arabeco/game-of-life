create extension if not exists pgcrypto with schema extensions;

alter table public.codex
  add column if not exists source_type text,
  add column if not exists origin_codex_id uuid,
  add column if not exists created_by_user_id uuid;

update public.codex
set source_type = case
  when catalog_id is not null then 'catalog'
  else 'created'
end
where source_type is null;

update public.codex
set created_by_user_id = owner_id
where created_by_user_id is null
  and owner_id is not null;

alter table public.codex
  alter column source_type set default 'created';

alter table public.codex
  alter column source_type set not null;

alter table public.codex
  drop constraint if exists codex_source_type_check;

alter table public.codex
  add constraint codex_source_type_check
  check (source_type in ('created', 'catalog', 'gift_link', 'gift_in_app'));

alter table public.codex
  drop constraint if exists codex_origin_codex_id_fkey;

alter table public.codex
  add constraint codex_origin_codex_id_fkey
  foreign key (origin_codex_id)
  references public.codex(id)
  on delete set null;

alter table public.codex
  drop constraint if exists codex_created_by_user_id_fkey;

alter table public.codex
  add constraint codex_created_by_user_id_fkey
  foreign key (created_by_user_id)
  references auth.users(id)
  on delete set null;

create index if not exists codex_owner_source_idx
  on public.codex (owner_id, source_type, created_at desc);

alter table public.notifications
  add column if not exists metadata jsonb;

alter table public.notifications
  alter column metadata set default '{}'::jsonb;

alter table public.user_profiles
  add column if not exists codex_creation_slots_purchased integer;

update public.user_profiles
set codex_creation_slots_purchased = 0
where codex_creation_slots_purchased is null;

alter table public.user_profiles
  alter column codex_creation_slots_purchased set default 0;

alter table public.user_profiles
  alter column codex_creation_slots_purchased set not null;

create table if not exists public.codex_shares (
  id uuid primary key default extensions.gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid null references auth.users(id) on delete set null,
  source_codex_id uuid not null references public.codex(id) on delete cascade,
  delivery_method text not null check (delivery_method in ('external_link', 'in_app')),
  share_token text null,
  status text not null default 'pending' check (status in ('pending', 'claimed', 'revoked', 'expired')),
  cost_gold integer not null default 50,
  notification_id uuid null references public.notifications(id) on delete set null,
  claimed_by_user_id uuid null references auth.users(id) on delete set null,
  claimed_codex_id uuid null references public.codex(id) on delete set null,
  claimed_at timestamptz null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists codex_shares_token_unique_idx
  on public.codex_shares (share_token)
  where share_token is not null;

create index if not exists codex_shares_sender_idx
  on public.codex_shares (sender_user_id, created_at desc);

create index if not exists codex_shares_recipient_idx
  on public.codex_shares (recipient_user_id, created_at desc)
  where recipient_user_id is not null;

create index if not exists codex_shares_status_idx
  on public.codex_shares (status, created_at desc);

alter table public.codex_shares enable row level security;

revoke all on table public.codex_shares from public;
revoke all on table public.codex_shares from anon;
revoke all on table public.codex_shares from authenticated;

create or replace function public._codex_template_is_shareable(p_template jsonb)
returns boolean
language plpgsql
immutable
as $$
begin
  if p_template is null then
    return false;
  end if;

  if jsonb_typeof(p_template -> 'levels') <> 'array' then
    return false;
  end if;

  return jsonb_array_length(p_template -> 'levels') > 0;
end;
$$;

create or replace function public._codex_set_wallet_gold(
  p_user_id uuid,
  p_new_gold integer
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.user_profiles%rowtype;
  v_fragments integer;
begin
  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_fragments := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'fragments')::integer, v_profile.fragments, 0);

  update public.user_profiles
  set
    gold = p_new_gold,
    wallet = jsonb_build_object(
      'gold', p_new_gold,
      'fragments', v_fragments
    ),
    updated_at = now()
  where id = p_user_id;
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

  if coalesce(p_amount, 0) <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = p_user_id
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer, v_profile.gold, 0);
  if v_current_gold < p_amount then
    raise exception 'Saldo insuficiente de Ouro.';
  end if;

  v_new_gold := v_current_gold - p_amount;

  perform public._codex_set_wallet_gold(p_user_id, v_new_gold);

  insert into public.transactions (
    id,
    user_id,
    type,
    currency,
    amount,
    description,
    created_at,
    metadata
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

create or replace function public.buy_codex_creation_slot()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_new_gold integer;
  v_new_slots integer;
  v_product_id text := extensions.gen_random_uuid()::text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    50,
    'codex_creation_slot',
    'Compra de Slot de Criacao de Codex',
    jsonb_build_object('product_type', 'codex_creation_slot', 'product_id', v_product_id)
  );

  update public.user_profiles
  set codex_creation_slots_purchased = coalesce(codex_creation_slots_purchased, 0) + 1,
      updated_at = now()
  where id = v_uid
  returning codex_creation_slots_purchased into v_new_slots;

  insert into public.user_purchases (
    user_id,
    product_type,
    product_id,
    gold_spent,
    expires_at,
    is_active,
    purchased_at
  ) values (
    v_uid,
    'codex_creation_slot',
    v_product_id,
    50,
    null,
    true,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'new_gold', v_new_gold,
    'slots_purchased', v_new_slots
  );
end;
$$;

create or replace function public.create_codex_share_link(p_codex_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_codex public.codex%rowtype;
  v_new_gold integer;
  v_share_id uuid := extensions.gen_random_uuid();
  v_share_token text := lower(replace(extensions.gen_random_uuid()::text, '-', '')) || lower(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 8));
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_codex
  from public.codex
  where id = p_codex_id
    and owner_id = v_uid
  for update;

  if not found then
    raise exception 'CODEX_NOT_FOUND';
  end if;

  if coalesce(v_codex.source_type, 'created') <> 'created' then
    raise exception 'Apenas Codex autoral pode ser compartilhado.';
  end if;

  if not public._codex_template_is_shareable(v_codex.template) then
    raise exception 'Finalize o manuscrito antes de compartilhar.';
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    50,
    'codex_share_gas',
    format('Gas Fee para compartilhar o Codex %s', coalesce(v_codex.name, 'Sem nome')),
    jsonb_build_object('product_type', 'codex_share_gas', 'delivery_method', 'external_link', 'source_codex_id', p_codex_id, 'share_id', v_share_id)
  );

  insert into public.codex_shares (
    id,
    sender_user_id,
    recipient_user_id,
    source_codex_id,
    delivery_method,
    share_token,
    status,
    cost_gold,
    metadata
  ) values (
    v_share_id,
    v_uid,
    null,
    p_codex_id,
    'external_link',
    v_share_token,
    'pending',
    50,
    jsonb_build_object('codex_name', v_codex.name)
  );

  insert into public.user_purchases (
    user_id,
    product_type,
    product_id,
    gold_spent,
    expires_at,
    is_active,
    purchased_at
  ) values (
    v_uid,
    'codex_share_gas',
    v_share_id::text,
    50,
    null,
    false,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'share_id', v_share_id,
    'share_token', v_share_token,
    'new_gold', v_new_gold
  );
end;
$$;

create or replace function public.send_codex_to_nickname(
  p_codex_id uuid,
  p_nickname text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_codex public.codex%rowtype;
  v_sender_nickname text;
  v_recipient_id uuid;
  v_recipient_nickname text;
  v_new_gold integer;
  v_share_id uuid := extensions.gen_random_uuid();
  v_notification_id uuid := extensions.gen_random_uuid();
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if coalesce(trim(p_nickname), '') = '' then
    raise exception 'Digite o @nickname de quem vai receber.';
  end if;

  select *
  into v_codex
  from public.codex
  where id = p_codex_id
    and owner_id = v_uid
  for update;

  if not found then
    raise exception 'CODEX_NOT_FOUND';
  end if;

  if coalesce(v_codex.source_type, 'created') <> 'created' then
    raise exception 'Apenas Codex autoral pode ser compartilhado.';
  end if;

  if not public._codex_template_is_shareable(v_codex.template) then
    raise exception 'Finalize o manuscrito antes de compartilhar.';
  end if;

  select nickname
  into v_sender_nickname
  from public.user_profiles
  where id = v_uid;

  select id, nickname
  into v_recipient_id, v_recipient_nickname
  from public.user_profiles
  where lower(nickname) = lower(trim(leading '@' from trim(p_nickname)))
  order by created_at asc nulls last
  limit 1;

  if v_recipient_id is null then
    raise exception 'Soberano nao encontrado para esse @nickname.';
  end if;

  if v_recipient_id = v_uid then
    raise exception 'Voce nao pode enviar um Codex para si mesmo.';
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    50,
    'codex_share_gas',
    format('Gas Fee para enviar o Codex %s para @%s', coalesce(v_codex.name, 'Sem nome'), coalesce(v_recipient_nickname, trim(leading '@' from trim(p_nickname)))),
    jsonb_build_object('product_type', 'codex_share_gas', 'delivery_method', 'in_app', 'source_codex_id', p_codex_id, 'share_id', v_share_id, 'recipient_user_id', v_recipient_id)
  );

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
    v_recipient_id,
    'codex_gift',
    format('@%s enviou o Codex "%s" para voce.', coalesce(v_sender_nickname, 'Soberano'), coalesce(v_codex.name, 'Codex')),
    false,
    now(),
    jsonb_build_object(
      'shareId', v_share_id,
      'codexId', v_codex.id,
      'codexName', v_codex.name,
      'senderNickname', v_sender_nickname,
      'recipientNickname', v_recipient_nickname
    )
  );

  insert into public.codex_shares (
    id,
    sender_user_id,
    recipient_user_id,
    source_codex_id,
    delivery_method,
    share_token,
    status,
    cost_gold,
    notification_id,
    metadata
  ) values (
    v_share_id,
    v_uid,
    v_recipient_id,
    p_codex_id,
    'in_app',
    null,
    'pending',
    50,
    v_notification_id,
    jsonb_build_object('codex_name', v_codex.name)
  );

  insert into public.user_purchases (
    user_id,
    product_type,
    product_id,
    gold_spent,
    expires_at,
    is_active,
    purchased_at
  ) values (
    v_uid,
    'codex_share_gas',
    v_share_id::text,
    50,
    null,
    false,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'share_id', v_share_id,
    'recipient_nickname', v_recipient_nickname,
    'new_gold', v_new_gold
  );
end;
$$;

create or replace function public.get_codex_share_preview(
  p_token text default null,
  p_share_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_share public.codex_shares%rowtype;
  v_codex public.codex%rowtype;
  v_sender_nickname text;
  v_recipient_nickname text;
  v_can_claim boolean := false;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_share_id is not null then
    select * into v_share
    from public.codex_shares
    where id = p_share_id;
  elsif coalesce(trim(p_token), '') <> '' then
    select * into v_share
    from public.codex_shares
    where share_token = trim(p_token);
  end if;

  if not found then
    return null;
  end if;

  select * into v_codex
  from public.codex
  where id = v_share.source_codex_id;

  if not found then
    return null;
  end if;

  select nickname into v_sender_nickname
  from public.user_profiles
  where id = v_share.sender_user_id;

  if v_share.recipient_user_id is not null then
    select nickname into v_recipient_nickname
    from public.user_profiles
    where id = v_share.recipient_user_id;
  end if;

  if v_share.delivery_method = 'in_app'
     and v_uid <> v_share.recipient_user_id
     and v_uid <> v_share.sender_user_id then
    return null;
  end if;

  v_can_claim := v_share.status = 'pending'
    and public._codex_template_is_shareable(v_codex.template)
    and v_uid <> v_share.sender_user_id
    and (
      v_share.delivery_method = 'external_link'
      or (v_share.delivery_method = 'in_app' and v_share.recipient_user_id = v_uid)
    );

  return jsonb_build_object(
    'share_id', v_share.id,
    'status', v_share.status,
    'delivery_method', v_share.delivery_method,
    'codex_id', v_codex.id,
    'codex_name', v_codex.name,
    'codex_description', coalesce(v_codex.description, ''),
    'codex_author', coalesce(v_codex.author, 'Soberano'),
    'codex_template', v_codex.template,
    'sender_nickname', v_sender_nickname,
    'recipient_nickname', v_recipient_nickname,
    'claimed_at', v_share.claimed_at,
    'can_claim', v_can_claim
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
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_share_id is not null then
    select * into v_share
    from public.codex_shares
    where id = p_share_id
    for update;
  elsif coalesce(trim(p_token), '') <> '' then
    select * into v_share
    from public.codex_shares
    where share_token = trim(p_token)
    for update;
  else
    raise exception 'SHARE_REFERENCE_REQUIRED';
  end if;

  if not found then
    raise exception 'Esse convite de Codex nao existe mais.';
  end if;

  if v_share.sender_user_id = v_uid then
    raise exception 'Voce nao pode reivindicar o proprio Codex.';
  end if;

  if v_share.delivery_method = 'in_app' and v_share.recipient_user_id <> v_uid then
    raise exception 'Esse Codex nao foi enviado para voce.';
  end if;

  if v_share.status <> 'pending' then
    raise exception 'Esse Codex ja foi reivindicado ou expirou.';
  end if;

  select * into v_codex
  from public.codex
  where id = v_share.source_codex_id;

  if not found then
    raise exception 'O Codex de origem nao foi encontrado.';
  end if;

  if not public._codex_template_is_shareable(v_codex.template) then
    raise exception 'Esse Codex nao esta pronto para ser reivindicado.';
  end if;

  v_source_type := case
    when v_share.delivery_method = 'external_link' then 'gift_link'
    else 'gift_in_app'
  end;

  insert into public.codex (
    id,
    owner_id,
    catalog_id,
    name,
    description,
    author,
    price,
    template,
    schema_version,
    is_public,
    created_at,
    updated_at,
    source_type,
    origin_codex_id,
    created_by_user_id
  ) values (
    v_new_codex_id,
    v_uid,
    v_codex.catalog_id,
    v_codex.name,
    v_codex.description,
    v_codex.author,
    null,
    v_codex.template,
    coalesce(v_codex.schema_version, 'v2'),
    false,
    now(),
    now(),
    v_source_type,
    v_codex.id,
    coalesce(v_codex.created_by_user_id, v_share.sender_user_id, v_codex.owner_id)
  );

  update public.codex_shares
  set
    status = 'claimed',
    claimed_by_user_id = v_uid,
    claimed_codex_id = v_new_codex_id,
    claimed_at = now()
  where id = v_share.id;

  if v_share.notification_id is not null then
    update public.notifications
    set read = true
    where id = v_share.notification_id
      and user_id = v_uid;
  end if;

  return jsonb_build_object(
    'success', true,
    'share_id', v_share.id,
    'codex_id', v_new_codex_id,
    'codex_name', v_codex.name
  );
end;
$$;

revoke all on function public._codex_template_is_shareable(jsonb) from public;
revoke all on function public._codex_set_wallet_gold(uuid, integer) from public;
revoke all on function public._codex_debit_gold(uuid, integer, text, text, jsonb) from public;
revoke all on function public.buy_codex_creation_slot() from public;
revoke all on function public.create_codex_share_link(uuid) from public;
revoke all on function public.send_codex_to_nickname(uuid, text) from public;
revoke all on function public.get_codex_share_preview(text, uuid) from public;
revoke all on function public.claim_codex_share(text, uuid) from public;

grant execute on function public.buy_codex_creation_slot() to authenticated;
grant execute on function public.create_codex_share_link(uuid) to authenticated;
grant execute on function public.send_codex_to_nickname(uuid, text) to authenticated;
grant execute on function public.get_codex_share_preview(text, uuid) to authenticated;
grant execute on function public.claim_codex_share(text, uuid) to authenticated;
