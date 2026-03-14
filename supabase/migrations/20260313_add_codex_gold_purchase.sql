alter table public.codex_catalog
  add column if not exists price_gold integer;

update public.codex_catalog
set price_gold = coalesce(price_gold, greatest(round(coalesce(price_brl, 0))::integer, 0));

alter table public.codex_catalog
  alter column price_gold set default 0;

update public.codex_catalog
set price_gold = 0
where price_gold is null;

alter table public.codex_catalog
  alter column price_gold set not null;

create or replace function public.buy_codex_catalog_item(p_catalog_id uuid)
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
  v_new_gold integer := 0;
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

  v_current_gold := coalesce((coalesce(v_profile.wallet, '{}'::jsonb) ->> 'gold')::integer, v_profile.gold, 0);

  if coalesce(v_catalog.price_gold, 0) > 0 then
    v_new_gold := public._codex_debit_gold(
      v_uid,
      v_catalog.price_gold,
      'codex_catalog_purchase',
      format('Compra do Codex "%s"', coalesce(v_catalog.title, 'Codex')),
      jsonb_build_object(
        'catalog_id', v_catalog.id,
        'title', v_catalog.title,
        'price_gold', v_catalog.price_gold
      )
    );
  else
    v_new_gold := v_current_gold;
  end if;

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
    coalesce(v_catalog.price_gold, 0),
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
    'codex_catalog',
    v_catalog.id::text,
    coalesce(v_catalog.price_gold, 0),
    null,
    true,
    now()
  );

  return jsonb_build_object(
    'success', true,
    'catalog_id', v_catalog.id,
    'price_gold', coalesce(v_catalog.price_gold, 0),
    'new_gold', v_new_gold,
    'codex', to_jsonb(v_inserted)
  );
end;
$$;

revoke all on function public.buy_codex_catalog_item(uuid) from public;
grant execute on function public.buy_codex_catalog_item(uuid) to authenticated;
