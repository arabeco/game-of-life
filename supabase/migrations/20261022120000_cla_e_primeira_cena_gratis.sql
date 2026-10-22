-- O clã inicia o social do produto; ouro não pode impedir uma pessoa de
-- convidar gente. O Legado também precisa de uma primeira cena compartilhável
-- sem cobrança. Repetições preservam o preço e os descontos existentes.

begin;

alter table public.user_profiles
  add column if not exists legacy_projection_scene_free_claimed_at timestamptz;

create or replace function public.create_clan_with_gold(
  p_name text,
  p_icon text default null,
  p_description text default '',
  p_clan_type text default 'Casual',
  p_recruitment_status text default 'Aberto'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_new_gold integer := 0;
  v_clan public.clans%rowtype;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'CLAN_NAME_REQUIRED'; end if;

  if exists (select 1 from public.clan_members cm where cm.user_id = v_uid) then
    raise exception 'CLAN_ALREADY_JOINED';
  end if;

  select coalesce((coalesce(wallet, '{}'::jsonb) ->> 'gold')::integer, gold, 0)
  into v_new_gold
  from public.user_profiles
  where id = v_uid;

  insert into public.clans (name, icon, description, clan_type, recruitment_status, exp, rank_id)
  values (
    trim(p_name),
    nullif(trim(coalesce(p_icon, '')), ''),
    coalesce(p_description, ''),
    coalesce(nullif(trim(p_clan_type), ''), 'Casual'),
    coalesce(nullif(trim(p_recruitment_status), ''), 'Aberto'),
    0,
    'feudo'
  )
  returning * into v_clan;

  insert into public.clan_members (user_id, clan_id, role)
  values (v_uid, v_clan.id, 'leader');

  return jsonb_build_object(
    'success', true,
    'cost_gold', 0,
    'new_gold', coalesce(v_new_gold, 0),
    'clan', to_jsonb(v_clan)
  );
exception
  when unique_violation then raise exception 'CLAN_NAME_ALREADY_EXISTS';
end;
$$;

create or replace function public.buy_legacy_projection_scene()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth', 'extensions'
as $function$
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
  v_free_claimed_at timestamptz;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_profile from public.user_profiles where id = v_uid for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;

  v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb)->>'gold')::integer, 0);

  -- Esta é a porta de entrada do Legado. Não consome crédito Platinum: ele
  -- continua pertencendo a quem já o recebeu e vale para uma cena extra.
  if v_profile.legacy_projection_scene_free_claimed_at is null then
    update public.user_profiles
    set legacy_projection_scene_free_claimed_at = now()
    where id = v_uid
    returning legacy_projection_scene_free_claimed_at into v_free_claimed_at;

    return jsonb_build_object(
      'success', true,
      'base_cost_gold', v_base_cost,
      'cost_gold', 0,
      'legacy_projection_scene_first_free_applied', true,
      'legacy_projection_scene_credit_applied', false,
      'legacy_projection_scene_credits_remaining', coalesce(v_profile.legacy_projection_scene_credits, 0),
      'legacy_projection_scene_free_claimed_at', v_free_claimed_at,
      'new_gold', v_current_gold
    );
  end if;

  v_is_premium := lower(coalesce(v_profile.role, '')) in ('admin', 'gm', 'admin_gm')
    or (coalesce(v_profile.is_premium, false) and (v_profile.premium_expires_at is null or v_profile.premium_expires_at > now()));

  if v_is_premium then
    v_active_tier := coalesce(nullif(lower(coalesce(v_profile.subscription_tier, '')), ''), 'premium');
    v_cost := greatest(1, floor(v_base_cost * (1 - public._desconto_da_cena_do_legado(v_active_tier)))::integer);
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
      'legacy_projection_scene_first_free_applied', false,
      'legacy_projection_scene_credit_applied', true,
      'legacy_projection_scene_credits_remaining', coalesce(v_remaining_credits, 0),
      'legacy_projection_scene_free_claimed_at', v_profile.legacy_projection_scene_free_claimed_at,
      'new_gold', v_current_gold
    );
  end if;

  v_new_gold := public._codex_debit_gold(
    v_uid, v_cost, 'legacy_projection_scene', 'Geracao da cena do legado',
    jsonb_build_object('base_cost_gold', v_base_cost, 'cost_gold', v_cost, 'premium_discount_applied', v_is_premium, 'surface', 'legacy_projection')
  );

  return jsonb_build_object(
    'success', true,
    'base_cost_gold', v_base_cost,
    'cost_gold', v_cost,
    'legacy_projection_scene_first_free_applied', false,
    'legacy_projection_scene_credit_applied', false,
    'legacy_projection_scene_credits_remaining', coalesce(v_profile.legacy_projection_scene_credits, 0),
    'legacy_projection_scene_free_claimed_at', v_profile.legacy_projection_scene_free_claimed_at,
    'new_gold', v_new_gold
  );
end;
$function$;

revoke all on function public.create_clan_with_gold(text, text, text, text, text) from public;
grant execute on function public.create_clan_with_gold(text, text, text, text, text) to authenticated;
revoke all on function public.buy_legacy_projection_scene() from public, anon;
grant execute on function public.buy_legacy_projection_scene() to authenticated;

commit;
