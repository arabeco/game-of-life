-- 🏛️ CRIAR TABELA SANCTUARY_POSITIONS (sem políticas por enquanto)
create table if not exists sanctuary_positions (
  id uuid default gen_random_uuid() primary key,
  clan_id uuid not null,
  user_id uuid not null,
  row smallint not null check (row between 0 and 5),
  col smallint not null check (col between 0 and 5),
  area text not null check (area in ('meditation','devotion','rest','garden')),
  action text not null,
  timestamp timestamptz not null default now()
);

-- Índice único para garantir que cada membro tenha apenas uma posição por clan
create unique index if not exists sanctuary_positions_unique_member
  on sanctuary_positions (clan_id, user_id);

-- Ativar RLS (mas sem políticas por enquanto)
alter table sanctuary_positions enable row level security;