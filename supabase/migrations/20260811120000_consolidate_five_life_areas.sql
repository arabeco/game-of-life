begin;

-- Keep arena identity and history intact; only replace the retired area key.
update public.arenas
set asset_id = case asset_id
  when 'consciencia' then 'proposito'
  when 'espiritualidade' then 'proposito'
  when 'espaco-mental' then 'proposito'
  when 'espaco_mental' then 'proposito'
  when 'espacoMental' then 'proposito'
  when 'projetos' then 'trabalho'
  when 'financas' then 'trabalho'
  when 'conexoes' then 'relacoes'
  when 'conexao' then 'relacoes'
  when 'hobbies' then 'lazer'
  when 'fisico' then 'saude'
  when 'corpo' then 'saude'
  else asset_id
end
where asset_id in (
  'consciencia', 'espiritualidade', 'espaco-mental', 'espaco_mental', 'espacoMental',
  'projetos', 'financas', 'conexoes', 'conexao', 'hobbies', 'fisico', 'corpo'
);

-- A broad new area inherits the rounded average of its former parts.
with mapped_levels as (
  select
    user_id,
    case asset_id
      when 'consciencia' then 'proposito'
      when 'espiritualidade' then 'proposito'
      when 'espaco-mental' then 'proposito'
      when 'espaco_mental' then 'proposito'
      when 'espacoMental' then 'proposito'
      when 'projetos' then 'trabalho'
      when 'financas' then 'trabalho'
      when 'conexoes' then 'relacoes'
      when 'conexao' then 'relacoes'
      when 'hobbies' then 'lazer'
      when 'fisico' then 'saude'
      when 'corpo' then 'saude'
      else asset_id
    end as asset_id,
    greatest(1, least(10, level)) as level
  from public.asset_levels
  where asset_id in (
    'proposito', 'relacoes', 'trabalho', 'lazer', 'saude',
    'consciencia', 'espiritualidade', 'espaco-mental', 'espaco_mental', 'espacoMental',
    'projetos', 'financas', 'conexoes', 'conexao', 'hobbies', 'fisico', 'corpo'
  )
), collapsed_levels as (
  select user_id, asset_id, round(avg(level))::integer as level
  from mapped_levels
  group by user_id, asset_id
)
insert into public.asset_levels (user_id, asset_id, level)
select user_id, asset_id, level
from collapsed_levels
on conflict (user_id, asset_id)
do update set level = excluded.level;

delete from public.asset_levels
where asset_id in (
  'consciencia', 'espiritualidade', 'espaco-mental', 'espaco_mental', 'espacoMental',
  'projetos', 'financas', 'conexoes', 'conexao', 'hobbies', 'fisico', 'corpo'
);

update public.user_profiles
set
  asset_art_by_id =
    (coalesce(asset_art_by_id, '{}'::jsonb) - array[
      'consciencia', 'espiritualidade', 'espaco-mental', 'espaco_mental', 'espacoMental',
      'projetos', 'financas', 'conexoes', 'conexao', 'hobbies', 'fisico', 'corpo'
    ]::text[])
    || jsonb_strip_nulls(jsonb_build_object(
      'proposito', coalesce(
        asset_art_by_id -> 'proposito',
        asset_art_by_id -> 'consciencia',
        asset_art_by_id -> 'espiritualidade',
        asset_art_by_id -> 'espaco-mental',
        asset_art_by_id -> 'espaco_mental',
        asset_art_by_id -> 'espacoMental'
      ),
      'relacoes', coalesce(asset_art_by_id -> 'relacoes', asset_art_by_id -> 'conexoes', asset_art_by_id -> 'conexao'),
      'trabalho', coalesce(asset_art_by_id -> 'trabalho', asset_art_by_id -> 'projetos', asset_art_by_id -> 'financas'),
      'lazer', coalesce(asset_art_by_id -> 'lazer', asset_art_by_id -> 'hobbies'),
      'saude', coalesce(asset_art_by_id -> 'saude', asset_art_by_id -> 'fisico', asset_art_by_id -> 'corpo')
    )),
  asset_widget_values =
    (coalesce(asset_widget_values, '{}'::jsonb) - array[
      'consciencia', 'espiritualidade', 'espaco-mental', 'espaco_mental', 'espacoMental',
      'projetos', 'financas', 'conexoes', 'conexao', 'hobbies', 'fisico', 'corpo'
    ]::text[])
    || jsonb_strip_nulls(jsonb_build_object(
      'proposito', coalesce(
        asset_widget_values -> 'proposito',
        asset_widget_values -> 'consciencia',
        asset_widget_values -> 'espiritualidade',
        asset_widget_values -> 'espaco-mental',
        asset_widget_values -> 'espaco_mental',
        asset_widget_values -> 'espacoMental'
      ),
      'relacoes', coalesce(asset_widget_values -> 'relacoes', asset_widget_values -> 'conexoes', asset_widget_values -> 'conexao'),
      'trabalho', coalesce(asset_widget_values -> 'trabalho', asset_widget_values -> 'projetos', asset_widget_values -> 'financas'),
      'lazer', coalesce(asset_widget_values -> 'lazer', asset_widget_values -> 'hobbies'),
      'saude', coalesce(asset_widget_values -> 'saude', asset_widget_values -> 'fisico', asset_widget_values -> 'corpo')
    )),
  visible_widgets = coalesce((
    select array_agg(mapped_widget.asset_id order by mapped_widget.first_position)
    from (
      select
        case widget.asset_id
          when 'consciencia' then 'proposito'
          when 'espiritualidade' then 'proposito'
          when 'espaco-mental' then 'proposito'
          when 'espaco_mental' then 'proposito'
          when 'espacoMental' then 'proposito'
          when 'projetos' then 'trabalho'
          when 'financas' then 'trabalho'
          when 'conexoes' then 'relacoes'
          when 'conexao' then 'relacoes'
          when 'hobbies' then 'lazer'
          when 'fisico' then 'saude'
          when 'corpo' then 'saude'
          else widget.asset_id
        end as asset_id,
        min(widget.position) as first_position
      from unnest(coalesce(user_profiles.visible_widgets, '{}'::text[]))
        with ordinality as widget(asset_id, position)
      group by 1
    ) mapped_widget
    where mapped_widget.asset_id in ('proposito', 'relacoes', 'trabalho', 'lazer', 'saude')
  ), '{}'::text[]),
  last_level_update = null;

update public.user_profiles profile
set level = mastery.total_level
from (
  select user_id, sum(level)::integer as total_level
  from public.asset_levels
  where asset_id in ('proposito', 'relacoes', 'trabalho', 'lazer', 'saude')
  group by user_id
) mastery
where profile.id = mastery.user_id
  and profile.level is distinct from mastery.total_level;

do $$
begin
  if exists (
    select 1
    from public.arenas
    where asset_id not in ('proposito', 'relacoes', 'trabalho', 'lazer', 'saude', 'geral')
  ) then
    raise exception 'Five-area migration left an unknown arenas.asset_id';
  end if;

  if exists (
    select 1
    from public.asset_levels
    where asset_id not in ('proposito', 'relacoes', 'trabalho', 'lazer', 'saude')
       or level not between 1 and 10
  ) then
    raise exception 'Five-area migration left an invalid asset_levels row';
  end if;

  if exists (
    select 1
    from public.user_profiles profile
    join (
      select user_id, sum(level) as total_level
      from public.asset_levels
      group by user_id
    ) mastery on mastery.user_id = profile.id
    where mastery.total_level > 50
       or profile.level is distinct from mastery.total_level
  ) then
    raise exception 'Five-area migration produced an invalid profile mastery total';
  end if;

  if exists (
    select 1
    from public.actions action_row
    left join public.arenas arena on arena.id = action_row.arena_id
    where arena.id is null
  ) then
    raise exception 'Five-area migration found an action without an arena';
  end if;
end $$;

commit;
