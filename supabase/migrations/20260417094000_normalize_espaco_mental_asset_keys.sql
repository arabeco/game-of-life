update public.user_profiles
set asset_art_by_id =
  (
    coalesce(asset_art_by_id, '{}'::jsonb)
    - 'espacoMental'
    - 'espaco_mental'
  )
  || case
    when coalesce(asset_art_by_id, '{}'::jsonb) ? 'espaco-mental' then jsonb_build_object('espaco-mental', coalesce(asset_art_by_id, '{}'::jsonb) -> 'espaco-mental')
    when coalesce(asset_art_by_id, '{}'::jsonb) ? 'espacoMental' then jsonb_build_object('espaco-mental', coalesce(asset_art_by_id, '{}'::jsonb) -> 'espacoMental')
    when coalesce(asset_art_by_id, '{}'::jsonb) ? 'espaco_mental' then jsonb_build_object('espaco-mental', coalesce(asset_art_by_id, '{}'::jsonb) -> 'espaco_mental')
    else '{}'::jsonb
  end
where coalesce(asset_art_by_id, '{}'::jsonb) ?| array['espacoMental', 'espaco_mental'];

update public.user_profiles
set asset_widget_values =
  (
    coalesce(asset_widget_values, '{}'::jsonb)
    - 'espacoMental'
    - 'espaco_mental'
  )
  || case
    when coalesce(asset_widget_values, '{}'::jsonb) ? 'espaco-mental' then jsonb_build_object('espaco-mental', coalesce(asset_widget_values, '{}'::jsonb) -> 'espaco-mental')
    when coalesce(asset_widget_values, '{}'::jsonb) ? 'espacoMental' then jsonb_build_object('espaco-mental', coalesce(asset_widget_values, '{}'::jsonb) -> 'espacoMental')
    when coalesce(asset_widget_values, '{}'::jsonb) ? 'espaco_mental' then jsonb_build_object('espaco-mental', coalesce(asset_widget_values, '{}'::jsonb) -> 'espaco_mental')
    else '{}'::jsonb
  end
where coalesce(asset_widget_values, '{}'::jsonb) ?| array['espacoMental', 'espaco_mental'];
