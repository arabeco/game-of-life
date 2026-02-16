-- 🏛️ TABELA SANCTUARY_POSITIONS (Posições dos membros no santuário)
create table if not exists sanctuary_positions (
  id uuid default gen_random_uuid() primary key,
  clan_id uuid not null,
  user_id uuid not null,
  row smallint not null check (row between 0 and 5),
  col smallint not null check (col between 0 and 5),
  area text not null check (area in ('meditation','devotion','rest','garden')),
  action text not null, -- 'Trabalhando', 'Regando', 'Passeando', 'Meditando', 'Rezando', 'Descansando'
  timestamp timestamptz not null default now()
);

-- Índice único para garantir que cada membro tenha apenas uma posição por clan
create unique index if not exists sanctuary_positions_unique_member
  on sanctuary_positions (clan_id, user_id);

-- Segurança: Ativar RLS (Row Level Security)
alter table sanctuary_positions enable row level security;

-- Política: Usuários só podem inserir suas próprias posições
create policy "insert own position" on sanctuary_positions
  for insert with check (auth.uid() = user_id);

-- Política: Membros do clan podem ver todas as posições do santuário
create policy "select clan positions" on sanctuary_positions
  for select using (
    exists (
      select 1 from clan_members cm
      where cm.clan_id = sanctuary_positions.clan_id
        and cm.user_id = auth.uid()
    )
  );

-- Política: Usuários só podem atualizar suas próprias posições
create policy "update own position" on sanctuary_positions
  for update with check (auth.uid() = user_id);


-- 📊 TABELA SANCTUARY_AREA_STATS (Estatísticas por área do santuário)
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

-- Segurança: Ativar RLS
alter table sanctuary_area_stats enable row level security;

-- Política: Membros do clan podem ver as estatísticas
create policy "select clan stats" on sanctuary_area_stats
  for select using (
    exists (
      select 1 from clan_members cm
      where cm.clan_id = sanctuary_area_stats.clan_id
        and cm.user_id = auth.uid()
    )
  );

-- Política: Membros do clan podem atualizar as estatísticas
create policy "update clan stats" on sanctuary_area_stats
  for update with check (
    exists (
      select 1 from clan_members cm
      where cm.clan_id = sanctuary_area_stats.clan_id
        and cm.user_id = auth.uid()
    )
  );