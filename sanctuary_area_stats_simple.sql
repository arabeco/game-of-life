-- 📊 CRIAR TABELA SANCTUARY_AREA_STATS (sem políticas por enquanto)
create table if not exists sanctuary_area_stats (
  id uuid default gen_random_uuid() primary key,
  clan_id uuid not null,
  area text not null check (area in ('meditation','devotion','rest','garden')),
  total_seconds bigint not null default 0,
  last_updated timestamptz not null default now()
);

-- Índice único para garantir uma estatística por área por clan
create unique index if not exists sanctuary_area_stats_unique
  on sanctuary_area_stats (clan_id, area);

-- Ativar RLS (mas sem políticas por enquanto)
alter table sanctuary_area_stats enable row level security;