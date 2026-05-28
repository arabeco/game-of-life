create or replace function public.process_google_play_gold_purchase(
    p_user_id uuid,
    p_pack_id text,
    p_amount_gold integer,
    p_cost_brl numeric,
    p_payment_id text,
    p_platform text default 'android',
    p_product_id text default null,
    p_metadata jsonb default '{}'
) returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
    v_payment_id text := nullif(trim(coalesce(p_payment_id, '')), '');
    v_profile public.user_profiles%rowtype;
    v_existing_status text;
    v_existing_user_id uuid;
    v_current_gold integer := 0;
    v_current_fragments integer := 0;
    v_new_gold integer := 0;
    v_pack_id text := trim(coalesce(p_pack_id, ''));
    v_pack_gold integer := 0;
    v_pack_cost numeric(10, 2) := 0;
    v_metadata jsonb := '{}'::jsonb;
    v_purchase_id bigint;
begin
    if p_user_id is null then
        raise exception 'USER_REQUIRED';
    end if;

    if v_pack_id = '' then
        raise exception 'PACK_REQUIRED';
    end if;

    if v_payment_id is null then
        raise exception 'PAYMENT_REQUIRED';
    end if;

    case v_pack_id
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

    if coalesce(p_amount_gold, v_pack_gold) <> v_pack_gold then
        raise exception 'GOLD_AMOUNT_MISMATCH';
    end if;

    if nullif(trim(coalesce(p_product_id, '')), '') is not null
        and trim(coalesce(p_product_id, '')) <> v_pack_id then
        raise exception 'PRODUCT_MISMATCH';
    end if;

    select status, user_id
    into v_existing_status, v_existing_user_id
    from public.user_purchases
    where payment_id = v_payment_id
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
        if v_existing_user_id is not null and v_existing_user_id <> p_user_id then
            raise exception 'PURCHASE_TOKEN_ALREADY_USED';
        end if;

        return jsonb_build_object(
            'success', true,
            'duplicate', true,
            'new_gold', v_current_gold,
            'fragments', v_current_fragments,
            'wallet', jsonb_build_object('gold', v_current_gold, 'fragments', v_current_fragments)
        );
    end if;

    v_metadata := coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'pack_id', v_pack_id,
        'platform', coalesce(p_platform, 'android'),
        'product_id', p_product_id,
        'payment_token_present', true,
        'requested_gold', p_amount_gold,
        'credited_gold', v_pack_gold,
        'requested_cost_brl', p_cost_brl,
        'catalog_cost_brl', v_pack_cost
    );

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
        v_payment_id,
        v_pack_gold,
        v_pack_cost,
        'approved',
        v_metadata,
        'gold_pack',
        v_pack_id,
        0,
        null,
        false,
        now(),
        now()
    )
    on conflict (payment_id) do nothing
    returning id into v_purchase_id;

    if v_purchase_id is null then
        select user_id
        into v_existing_user_id
        from public.user_purchases
        where payment_id = v_payment_id;

        if v_existing_user_id is not null and v_existing_user_id <> p_user_id then
            raise exception 'PURCHASE_TOKEN_ALREADY_USED';
        end if;

        return jsonb_build_object(
            'success', true,
            'duplicate', true,
            'new_gold', v_current_gold,
            'fragments', v_current_fragments,
            'wallet', jsonb_build_object('gold', v_current_gold, 'fragments', v_current_fragments)
        );
    end if;

    v_new_gold := v_current_gold + v_pack_gold;

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
        p_user_id,
        'google_play_gold_purchase',
        'gold',
        abs(v_pack_gold),
        format('Google Play: compra de %s Ouro', v_pack_gold),
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

revoke all on function public.process_google_play_gold_purchase(uuid, text, integer, numeric, text, text, text, jsonb) from public;
revoke all on function public.process_google_play_gold_purchase(uuid, text, integer, numeric, text, text, text, jsonb) from anon;
revoke all on function public.process_google_play_gold_purchase(uuid, text, integer, numeric, text, text, text, jsonb) from authenticated;
grant execute on function public.process_google_play_gold_purchase(uuid, text, integer, numeric, text, text, text, jsonb) to service_role;
