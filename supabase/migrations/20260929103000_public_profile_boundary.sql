-- O perfil social nao e a linha inteira de user_profiles.
-- O dono ainda le a propria linha pelo RLS existente. As outras pessoas usam
-- estas duas RPCs, que devolvem apenas o cartao publico e os blocos permitidos
-- pelas preferencias do perfil visitado.
begin;

drop policy if exists user_profiles_select on public.user_profiles;
revoke select on table public.user_profiles from anon;

create or replace function public.search_public_profiles(p_query text)
returns table (
  id uuid,
  nickname text,
  sovereign jsonb,
  avatar_url text,
  border text,
  level integer,
  background_url text,
  banner_url text,
  skin text,
  nobility jsonb,
  is_online boolean
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_query text := btrim(coalesce(p_query, ''));
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if char_length(v_query) < 3 then
    return;
  end if;

  return query
  select
    up.id,
    up.nickname,
    up.sovereign,
    up.avatar_url,
    up.border,
    up.level,
    up.background_url,
    up.banner_url,
    up.skin,
    up.nobility,
    up.is_online
  from public.user_profiles up
  where up.id <> auth.uid()
    and up.nickname ilike v_query || '%'
  order by lower(up.nickname), up.id
  limit 10;
end;
$$;

create or replace function public.get_public_profile_data(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_viewer uuid := auth.uid();
  v_profile public.user_profiles%rowtype;
  v_is_friend boolean := false;
  v_can_assets boolean := false;
  v_can_mastery boolean := false;
  v_can_feats boolean := false;
  v_can_garden boolean := false;
begin
  if v_viewer is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_profile
  from public.user_profiles
  where id = p_user_id;

  if not found then
    return null;
  end if;

  if v_viewer <> p_user_id then
    select exists(
      select 1
      from public.friends f
      where (f.user_id = v_viewer and f.friend_id = p_user_id)
         or (f.user_id = p_user_id and f.friend_id = v_viewer)
    ) into v_is_friend;
  end if;

  v_can_assets := v_viewer = p_user_id
    or v_profile.assets_visibility = 'all'
    or (v_profile.assets_visibility = 'friends' and v_is_friend);
  v_can_mastery := v_viewer = p_user_id
    or v_profile.mastery_visibility = 'all'
    or (v_profile.mastery_visibility = 'friends' and v_is_friend);
  v_can_feats := v_viewer = p_user_id
    or v_profile.feats_visibility = 'all'
    or (v_profile.feats_visibility = 'friends' and v_is_friend);
  v_can_garden := v_viewer = p_user_id
    or v_profile.garden_visibility = 'all'
    or (v_profile.garden_visibility = 'friends' and v_is_friend);

  return jsonb_build_object(
    'is_friend', v_is_friend,
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'nickname', v_profile.nickname,
      'sovereign', v_profile.sovereign,
      'avatar_url', v_profile.avatar_url,
      'border', v_profile.border,
      'level', v_profile.level,
      'background_url', v_profile.background_url,
      'banner_url', v_profile.banner_url,
      'skin', v_profile.skin,
      'nobility', v_profile.nobility,
      'is_online', v_profile.is_online,
      'assets_visibility', v_profile.assets_visibility,
      'mastery_visibility', v_profile.mastery_visibility,
      'feats_visibility', v_profile.feats_visibility,
      'garden_visibility', v_profile.garden_visibility,
      'visible_widgets', case when v_can_assets then coalesce(v_profile.visible_widgets, array[]::text[]) else array[]::text[] end,
      'asset_art_by_id', case when v_can_assets then coalesce(v_profile.asset_art_by_id, '{}'::jsonb) else '{}'::jsonb end,
      'asset_widget_values', case when v_can_assets then coalesce(v_profile.asset_widget_values, '{}'::jsonb) else '{}'::jsonb end,
      'garden_state', case when v_can_garden then v_profile.garden_state else null end,
      'unlocked_items', case when v_can_feats then coalesce(v_profile.unlocked_items, '{}'::jsonb) else '{}'::jsonb end,
      'inventory', case when v_can_feats then coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', ui.item_id,
          'instance_id', ui.id,
          'acquired_at', ui.acquired_at,
          'is_equipped', ui.is_equipped
        ) order by ui.acquired_at, ui.id)
        from public.user_inventory ui
        where ui.user_id = v_profile.id
      ), '[]'::jsonb) else '[]'::jsonb end
    ),
    'levels', case when v_can_mastery then coalesce((
      select jsonb_agg(jsonb_build_object('asset_id', al.asset_id, 'level', al.level))
      from public.asset_levels al
      where al.user_id = v_profile.id
    ), '[]'::jsonb) else '[]'::jsonb end,
    'arenas', case when v_can_feats then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'asset_id', a.asset_id,
        'name', a.name,
        'description', a.description,
        'icon', a.icon,
        'action_ids', a.action_ids,
        'is_archived', a.is_archived,
        'order', a."order",
        'priority', a.priority
      ) order by a."order", a.id)
      from public.arenas a
      where a.user_id = v_profile.id
    ), '[]'::jsonb) else '[]'::jsonb end
  );
end;
$$;

revoke all on function public.search_public_profiles(text) from public;
revoke all on function public.get_public_profile_data(uuid) from public;
grant execute on function public.search_public_profiles(text) to authenticated;
grant execute on function public.get_public_profile_data(uuid) to authenticated;

commit;
