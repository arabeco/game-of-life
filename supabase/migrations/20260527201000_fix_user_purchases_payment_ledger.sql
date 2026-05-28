create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_next_id bigint;
  v_is_identity text;
begin
  select is_identity
  into v_is_identity
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'user_purchases'
    and column_name = 'id';

  if coalesce(v_is_identity, 'NO') <> 'YES'
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'user_purchases'
        and column_name = 'id'
        and udt_name = 'int8'
    )
  then
    create sequence if not exists public.user_purchases_id_manual_seq;
    select greatest(coalesce(max(id), 0) + 1, 1)
    into v_next_id
    from public.user_purchases;

    perform setval('public.user_purchases_id_manual_seq'::regclass, v_next_id, false);

    alter table public.user_purchases
      alter column id set default nextval('public.user_purchases_id_manual_seq'::regclass);
  end if;
end $$;

alter table public.user_purchases
  add column if not exists payment_id text,
  add column if not exists gold_amount integer not null default 0,
  add column if not exists amount_paid numeric(10, 2) not null default 0,
  add column if not exists status text not null default 'approved',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.user_purchases
  alter column product_type set default 'payment',
  alter column product_id set default 'external_payment',
  alter column gold_spent set default 0,
  alter column is_active set default true,
  alter column purchased_at set default now(),
  alter column updated_at set default now();

create unique index if not exists user_purchases_payment_id_unique
  on public.user_purchases(payment_id);

create or replace function public.buy_gold_pack(
    p_pack_id text,
    p_amount_gold integer,
    p_cost_brl numeric,
    p_order_id text default null,
    p_purchase_token text default null,
    p_platform text default 'web',
    p_product_id text default null,
    p_metadata jsonb default '{}'
) returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
    v_uid uuid := auth.uid();
    v_payment_id text;
    v_profile public.user_profiles%rowtype;
    v_existing_status text;
    v_current_gold integer := 0;
    v_current_fragments integer := 0;
    v_new_gold integer := 0;
    v_pack_gold integer := 0;
    v_pack_cost numeric(10, 2) := 0;
    v_metadata jsonb := '{}'::jsonb;
begin
    if v_uid is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    if coalesce(trim(p_pack_id), '') = '' then
        raise exception 'PACK_REQUIRED';
    end if;

    if coalesce(trim(p_order_id), trim(p_purchase_token), '') = '' then
        raise exception 'PURCHASE_RECEIPT_REQUIRED';
    end if;

    case trim(p_pack_id)
        when 'pack_gold_1' then
            v_pack_gold := 50;
            v_pack_cost := 5;
        when 'pack_gold_2' then
            v_pack_gold := 110;
            v_pack_cost := 10;
        when 'pack_gold_3' then
            v_pack_gold := 230;
            v_pack_cost := 20;
        when 'pack_gold_4' then
            v_pack_gold := 600;
            v_pack_cost := 50;
        when 'pack_gold_5' then
            v_pack_gold := 1300;
            v_pack_cost := 100;
        else
            raise exception 'UNKNOWN_GOLD_PACK';
    end case;

    v_payment_id := coalesce(
        nullif(trim(p_purchase_token), ''),
        nullif(trim(p_order_id), '')
    );

    select status
    into v_existing_status
    from public.user_purchases
    where payment_id = v_payment_id
    for update;

    select *
    into v_profile
    from public.user_profiles
    where id = v_uid
    for update;

    if not found then
        raise exception 'PROFILE_NOT_FOUND';
    end if;

    v_current_gold := greatest(
        coalesce(v_profile.gold, 0),
        coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer, 0)
    );
    v_current_fragments := greatest(
        coalesce(v_profile.fragments, 0),
        coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'fragments')::integer, 0)
    );

    if v_existing_status is not null and lower(coalesce(v_existing_status, '')) = 'approved' then
        return jsonb_build_object(
            'success', true,
            'duplicate', true,
            'new_gold', v_current_gold,
            'fragments', v_current_fragments,
            'wallet', jsonb_build_object('gold', v_current_gold, 'fragments', v_current_fragments)
        );
    end if;

    v_metadata := coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'pack_id', trim(p_pack_id),
        'platform', coalesce(p_platform, 'web'),
        'product_id', p_product_id,
        'order_id', p_order_id,
        'purchase_token_present', coalesce(trim(p_purchase_token), '') <> '',
        'requested_gold', p_amount_gold,
        'credited_gold', v_pack_gold,
        'requested_cost_brl', p_cost_brl,
        'catalog_cost_brl', v_pack_cost
    );

    v_new_gold := v_current_gold + v_pack_gold;

    insert into public.user_purchases (
        user_id,
        payment_id,
        gold_amount,
        amount_paid,
        status,
        metadata,
        product_type,
        product_id,
        gold_spent,
        expires_at,
        is_active,
        purchased_at,
        updated_at
    ) values (
        v_uid,
        v_payment_id,
        v_pack_gold,
        v_pack_cost,
        'approved',
        v_metadata,
        'gold_pack',
        trim(p_pack_id),
        0,
        null,
        false,
        now(),
        now()
    )
    on conflict (payment_id) do nothing;

    if not found then
        return jsonb_build_object(
            'success', true,
            'duplicate', true,
            'new_gold', v_current_gold,
            'fragments', v_current_fragments,
            'wallet', jsonb_build_object('gold', v_current_gold, 'fragments', v_current_fragments)
        );
    end if;

    update public.user_profiles
    set
        gold = v_new_gold,
        fragments = v_current_fragments,
        wallet = jsonb_build_object(
            'gold', v_new_gold,
            'fragments', v_current_fragments
        ),
        updated_at = now()
    where id = v_uid;

    insert into public.transactions (
        id,
        user_id,
        type,
        currency,
        amount,
        description,
        created_at,
        payment_id,
        metadata
    ) values (
        extensions.gen_random_uuid(),
        v_uid,
        'gold_pack_purchase',
        'gold',
        abs(v_pack_gold),
        format('Compra de %s Ouro', v_pack_gold),
        now(),
        v_payment_id,
        v_metadata
    );

    return jsonb_build_object(
        'success', true,
        'duplicate', false,
        'new_gold', v_new_gold,
        'fragments', v_current_fragments,
        'wallet', jsonb_build_object('gold', v_new_gold, 'fragments', v_current_fragments)
    );
end;
$$;

revoke all on function public.buy_gold_pack(text, integer, numeric, text, text, text, text, jsonb) from public;
revoke all on function public.buy_gold_pack(text, integer, numeric, text, text, text, text, jsonb) from anon;
revoke all on function public.buy_gold_pack(text, integer, numeric, text, text, text, text, jsonb) from authenticated;
grant execute on function public.buy_gold_pack(text, integer, numeric, text, text, text, text, jsonb) to service_role;
