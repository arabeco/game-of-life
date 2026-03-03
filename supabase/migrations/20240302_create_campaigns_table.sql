-- Tabela para armazenar as campanhas
create table public.campaigns (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text null,
  arena_ids jsonb not null default '[]'::jsonb, -- Array de IDs das arenas
  arena_config jsonb not null default '{}'::jsonb, -- Configurações (bloqueios, posições, dependências)
  status text not null default 'active', -- active, archived, completed
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  priority text null, -- alta, media, baixa
  constraint campaigns_pkey primary key (id)
);

-- Políticas de segurança (RLS)
alter table public.campaigns enable row level security;

create policy "Users can view their own campaigns" on public.campaigns
  for select using (auth.uid() = user_id);

create policy "Users can insert their own campaigns" on public.campaigns
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own campaigns" on public.campaigns
  for update using (auth.uid() = user_id);

create policy "Users can delete their own campaigns" on public.campaigns
  for delete using (auth.uid() = user_id);
