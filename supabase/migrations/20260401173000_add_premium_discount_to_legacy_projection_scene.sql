create or replace function public.buy_legacy_projection_scene()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_base_cost integer := 50;
  v_cost integer := 50;
  v_new_gold integer;
  v_is_premium boolean := false;
  v_profile public.user_profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = v_uid;

  v_is_premium := lower(coalesce(v_profile.role, '')) in ('admin', 'gm', 'admin_gm')
    or (
      coalesce(v_profile.is_premium, false)
      and (
        v_profile.premium_expires_at is null
        or v_profile.premium_expires_at > now()
      )
    );

  if v_is_premium then
    v_cost := 25;
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
      'surface', 'legacy_projection'
    )
  );

  return jsonb_build_object(
    'success', true,
    'base_cost_gold', v_base_cost,
    'cost_gold', v_cost,
    'premium_discount_applied', v_is_premium,
    'new_gold', v_new_gold
  );
end;
$$;

revoke all on function public.buy_legacy_projection_scene() from public;
grant execute on function public.buy_legacy_projection_scene() to authenticated;
