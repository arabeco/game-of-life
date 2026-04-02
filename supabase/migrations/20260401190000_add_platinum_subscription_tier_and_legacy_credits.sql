alter table public.user_profiles
  add column if not exists subscription_tier text,
  add column if not exists legacy_projection_scene_credits integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_subscription_tier_check'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_subscription_tier_check
      check (subscription_tier is null or subscription_tier in ('premium', 'platinum'));
  end if;
end $$;

update public.user_profiles
set subscription_tier = 'premium'
where coalesce(is_premium, false) = true
  and subscription_tier is null;

create or replace function public.buy_legacy_projection_scene()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.user_profiles%rowtype;
  v_base_cost integer := 50;
  v_cost integer := 50;
  v_new_gold integer;
  v_is_premium boolean := false;
  v_active_tier text := null;
  v_current_gold integer := 0;
  v_remaining_credits integer := 0;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = v_uid
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb)->>'gold')::integer, 0);

  v_is_premium := lower(coalesce(v_profile.role, '')) in ('admin', 'gm', 'admin_gm')
    or (
      coalesce(v_profile.is_premium, false)
      and (
        v_profile.premium_expires_at is null
        or v_profile.premium_expires_at > now()
      )
    );

  if v_is_premium then
    v_active_tier := coalesce(nullif(lower(coalesce(v_profile.subscription_tier, '')), ''), 'premium');
    v_cost := 25;
  end if;

  if v_active_tier = 'platinum' and coalesce(v_profile.legacy_projection_scene_credits, 0) > 0 then
    update public.user_profiles
    set legacy_projection_scene_credits = greatest(legacy_projection_scene_credits - 1, 0)
    where id = v_uid
    returning legacy_projection_scene_credits into v_remaining_credits;

    return jsonb_build_object(
      'success', true,
      'base_cost_gold', v_base_cost,
      'cost_gold', 0,
      'premium_discount_applied', true,
      'legacy_projection_scene_credit_applied', true,
      'legacy_projection_scene_credits_remaining', coalesce(v_remaining_credits, 0),
      'new_gold', v_current_gold
    );
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid,
    v_cost,
    'legacy_projection_scene',
    'Geracao da cena do legado',
    jsonb_build_object(
      'base_cost_gold', v_base_cost,
      'cost_gold', v_cost,
      'premium_discount_applied', v_is_premium,
      'legacy_projection_scene_credit_applied', false,
      'surface', 'legacy_projection'
    )
  );

  return jsonb_build_object(
    'success', true,
    'base_cost_gold', v_base_cost,
    'cost_gold', v_cost,
    'premium_discount_applied', v_is_premium,
    'legacy_projection_scene_credit_applied', false,
    'legacy_projection_scene_credits_remaining', coalesce(v_profile.legacy_projection_scene_credits, 0),
    'new_gold', v_new_gold
  );
end;
$$;

revoke all on function public.buy_legacy_projection_scene() from public;
grant execute on function public.buy_legacy_projection_scene() to authenticated;
