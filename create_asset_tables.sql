-- Criação da tabela de níveis de ativos (Asset Levels)
create table if not exists public.asset_levels (
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id text not null,
  level int not null default 0,
  primary key (user_id, asset_id)
);

-- Habilitar RLS (Segurança a nível de linha)
alter table public.asset_levels enable row level security;

-- Políticas de segurança para asset_levels
create policy "Users can view their own asset levels"
on public.asset_levels for select
using (auth.uid() = user_id);

create policy "Users can insert their own asset levels"
on public.asset_levels for insert
with check (auth.uid() = user_id);

create policy "Users can update their own asset levels"
on public.asset_levels for update
using (auth.uid() = user_id);

-- Criação da tabela de slots de ativos (Asset Slots) - Caso ainda não exista
create table if not exists public.asset_slots (
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_id text not null,
  value text,
  primary key (user_id, slot_id)
);

-- Habilitar RLS
alter table public.asset_slots enable row level security;

-- Políticas de segurança para asset_slots
create policy "Users can view their own asset slots"
on public.asset_slots for select
using (auth.uid() = user_id);

create policy "Users can insert their own asset slots"
on public.asset_slots for insert
with check (auth.uid() = user_id);

create policy "Users can update their own asset slots"
on public.asset_slots for update
using (auth.uid() = user_id);
