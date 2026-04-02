alter table public.user_profiles
  add column if not exists campaign_quiz_free_credits integer not null default 0;

create or replace function public.claim_campaign_quiz_free_codex(p_catalog_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_uid uuid := auth.uid();
  v_catalog public.codex_catalog%rowtype;
  v_existing public.codex%rowtype;
  v_profile public.user_profiles%rowtype;
  v_inserted public.codex%rowtype;
  v_current_gold integer := 0;
  v_remaining_credits integer := 0;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_catalog
  from public.codex_catalog
  where id = p_catalog_id;

  if not found then
    raise exception 'CODEX_CATALOG_NOT_FOUND';
  end if;

  if coalesce(v_catalog.price_gold, 0) > 0 then
    raise exception 'CAMPAIGN_QUIZ_FREE_CODEX_INELIGIBLE';
  end if;

  select *
  into v_existing
  from public.codex
  where owner_id = v_uid
    and catalog_id = p_catalog_id
  order by created_at desc nulls last
  limit 1;

  if found then
    raise exception 'Voce ja possui este Codex.';
  end if;

  select *
  into v_profile
  from public.user_profiles
  where id = v_uid
  for update;

  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if coalesce(v_profile.campaign_quiz_free_credits, 0) <= 0 then
    raise exception 'CAMPAIGN_QUIZ_FREE_CREDIT_REQUIRED';
  end if;

  v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer, v_profile.gold, 0);

  update public.user_profiles
  set campaign_quiz_free_credits = greatest(campaign_quiz_free_credits - 1, 0)
  where id = v_uid
  returning campaign_quiz_free_credits into v_remaining_credits;

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
    v_uid,
    v_catalog.id,
    v_catalog.title,
    v_catalog.description,
    v_catalog.author_name,
    0,
    v_catalog.template,
    'v2',
    false,
    'catalog',
    null,
    null
  )
  returning * into v_inserted;

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
    'campaign_quiz_free',
    v_catalog.id::text,
    0,
    null,
    true,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'catalog_id', v_catalog.id,
    'price_gold', 0,
    'new_gold', v_current_gold,
    'campaign_quiz_free_credits_remaining', coalesce(v_remaining_credits, 0),
    'codex', to_jsonb(v_inserted)
  );
end;
$$;

revoke all on function public.claim_campaign_quiz_free_codex(uuid) from public;
grant execute on function public.claim_campaign_quiz_free_codex(uuid) to authenticated;
