begin;

alter table public.items
  add column if not exists is_chest_exclusive boolean not null default false,
  add column if not exists is_legacy_retired boolean not null default false,
  add column if not exists is_gm_exclusive boolean not null default false,
  add column if not exists is_quest_exclusive boolean not null default false,
  add column if not exists is_report_exclusive boolean not null default false,
  add column if not exists season_key text,
  add column if not exists season_slot text;

update public.items
set
  is_legacy_retired = case
    when id in ('item_border_genesis_01', 'item_banner_origin_01') then true
    else coalesce(is_legacy_retired, false)
  end,
  season_key = case
    when id in ('item_border_aurora_1_2026', 'item_banner_aurora_1_2026', 'insignia_season_aurora_1') then 'aurora_1_2026'
    when id in ('item_skin_season_001', 'item_border_genesis_01', 'item_banner_origin_01', 'item_theme_nebulosa') then 'genesis_legacy'
    else season_key
  end,
  season_slot = case
    when id = 'item_skin_season_001' then 'skin'
    when id in ('item_border_aurora_1_2026', 'item_border_genesis_01') then 'border'
    when id in ('item_banner_aurora_1_2026', 'item_banner_origin_01') then 'banner'
    when id = 'insignia_season_aurora_1' then 'insignia'
    when id = 'item_theme_nebulosa' then 'ui_skin'
    else season_slot
  end
where id in (
  'item_border_aurora_1_2026',
  'item_banner_aurora_1_2026',
  'insignia_season_aurora_1',
  'item_skin_season_001',
  'item_border_genesis_01',
  'item_banner_origin_01',
  'item_theme_nebulosa'
);

commit;
