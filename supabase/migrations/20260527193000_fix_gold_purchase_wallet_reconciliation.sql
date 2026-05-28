create extension if not exists pgcrypto with schema extensions;

alter table public.user_purchases
  add column if not exists product_type text,
  add column if not exists product_id text,
  add column if not exists gold_spent integer not null default 0,
  add column if not exists expires_at timestamptz,
  add column if not exists is_active boolean not null default false,
  add column if not exists purchased_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.process_approved_payment(
    p_user_id uuid,
    p_payment_id text,
    p_gold_amount integer,
    p_amount_paid decimal(10, 2),
    p_metadata jsonb default '{}'
) returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
    v_profile public.user_profiles%rowtype;
    v_existing_status text;
    v_current_gold integer := 0;
    v_current_fragments integer := 0;
    v_new_gold integer := 0;
begin
    if p_user_id is null then
        raise exception 'USER_REQUIRED';
    end if;

    if coalesce(trim(p_payment_id), '') = '' then
        raise exception 'PAYMENT_REQUIRED';
    end if;

    if coalesce(p_gold_amount, 0) <= 0 then
        raise exception 'INVALID_GOLD_AMOUNT';
    end if;

    select status
    into v_existing_status
    from public.user_purchases
    where payment_id = p_payment_id
    for update;

    select *
    into v_profile
    from public.user_profiles
    where id = p_user_id
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
            'wallet', jsonb_build_object('gold', v_current_gold, 'fragments', v_current_fragments),
            'message', 'Pagamento ja processado'
        );
    end if;

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
        p_user_id,
        p_payment_id,
        p_gold_amount,
        coalesce(p_amount_paid, 0),
        'approved',
        coalesce(p_metadata, '{}'::jsonb),
        'gold_pack',
        coalesce(p_metadata ->> 'pack_id', 'gold_pack'),
        0,
        null,
        false,
        now(),
        now()
    )
    on conflict (payment_id) do update
    set
        status = 'approved',
        metadata = coalesce(public.user_purchases.metadata, '{}'::jsonb) || coalesce(excluded.metadata, '{}'::jsonb),
        updated_at = now();

    v_new_gold := v_current_gold + p_gold_amount;

    update public.user_profiles
    set
        gold = v_new_gold,
        fragments = v_current_fragments,
        wallet = jsonb_build_object(
            'gold', v_new_gold,
            'fragments', v_current_fragments
        ),
        updated_at = now()
    where id = p_user_id;

    return jsonb_build_object(
        'success', true,
        'duplicate', false,
        'new_gold', v_new_gold,
        'wallet', jsonb_build_object('gold', v_new_gold, 'fragments', v_current_fragments),
        'message', 'Ouro creditado com sucesso'
    );
end;
$$;

drop function if exists public.buy_gold_pack(text, integer, numeric);
drop function if exists public.buy_gold_pack(character varying, integer, numeric);
drop function if exists public.buy_gold_pack(text, integer, numeric, text, text, text, text, jsonb);

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
    v_metadata jsonb := '{}'::jsonb;
begin
    if v_uid is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    if coalesce(trim(p_pack_id), '') = '' then
        raise exception 'PACK_REQUIRED';
    end if;

    if coalesce(p_amount_gold, 0) <= 0 then
        raise exception 'INVALID_GOLD_AMOUNT';
    end if;

    if coalesce(trim(p_order_id), trim(p_purchase_token), '') = '' then
        raise exception 'PURCHASE_RECEIPT_REQUIRED';
    end if;

    v_payment_id := coalesce(
        nullif(trim(p_order_id), ''),
        nullif(trim(p_purchase_token), '')
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
        'pack_id', p_pack_id,
        'platform', coalesce(p_platform, 'web'),
        'product_id', p_product_id,
        'order_id', p_order_id,
        'purchase_token_present', coalesce(trim(p_purchase_token), '') <> ''
    );

    v_new_gold := v_current_gold + p_amount_gold;

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
        p_amount_gold,
        coalesce(p_cost_brl, 0),
        'approved',
        v_metadata,
        'gold_pack',
        p_pack_id,
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
        metadata
    ) values (
        extensions.gen_random_uuid(),
        v_uid,
        'gold_pack_purchase',
        'gold',
        abs(p_amount_gold),
        format('Compra de %s Ouro', p_amount_gold),
        now(),
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
grant execute on function public.buy_gold_pack(text, integer, numeric, text, text, text, text, jsonb) to authenticated;

revoke all on function public.process_approved_payment(uuid, text, integer, decimal, jsonb) from public;
grant execute on function public.process_approved_payment(uuid, text, integer, decimal, jsonb) to service_role;
