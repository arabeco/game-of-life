-- Arquitetura base para Planner de Vida Real (Supabase/Postgres)
-- Perfis + Tarefas + Metas + Amigos (com RLS)

-- 1) Perfil (identidade + estado + cosméticos/atributos flexíveis)
alter table public.profiles add column if not exists global_level int default 0;
alter table public.profiles add column if not exists current_mood text;
alter table public.profiles add column if not exists cosmetics jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists attributes jsonb default '{}'::jsonb;

-- 2) Tarefas (Arenas/Afazeres)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  arena_tag text,
  asset_category text,
  status text default 'Pendente',
  due_date timestamptz,
  is_weekly boolean default false,
  is_postponable boolean default false,
  created_at timestamptz default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_due_date_idx on public.tasks(due_date);

alter table public.tasks enable row level security;
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select
  using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update
  using (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete
  using (auth.uid() = user_id);

-- 2.5) Planner Actions (Motor do Tempo)
create table if not exists public.planner_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  asset_category text,
  arena_tag text,
  planned_at timestamptz not null,
  completed_at timestamptz,
  status text default 'pending' check (status in ('pending', 'done', 'missed', 'rescheduled')),
  is_postponable boolean default false,
  created_at timestamptz default now()
);

create index if not exists planner_actions_user_id_idx on public.planner_actions(user_id);
create index if not exists planner_actions_planned_at_idx on public.planner_actions(planned_at);

alter table public.planner_actions enable row level security;
drop policy if exists "planner_actions_select_own" on public.planner_actions;
create policy "planner_actions_select_own" on public.planner_actions
  for select
  using (auth.uid() = user_id);

drop policy if exists "planner_actions_insert_own" on public.planner_actions;
create policy "planner_actions_insert_own" on public.planner_actions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "planner_actions_update_own" on public.planner_actions;
create policy "planner_actions_update_own" on public.planner_actions
  for update
  using (auth.uid() = user_id);

drop policy if exists "planner_actions_delete_own" on public.planner_actions;
create policy "planner_actions_delete_own" on public.planner_actions
  for delete
  using (auth.uid() = user_id);

-- 3) Metas de longo prazo
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  progress int default 0,
  target_date date,
  is_postponable boolean default false,
  created_at timestamptz default now()
);

alter table public.tasks add column if not exists is_postponable boolean default false;
alter table public.planner_actions add column if not exists is_postponable boolean default false;
alter table public.goals add column if not exists is_postponable boolean default false;

create index if not exists goals_user_id_idx on public.goals(user_id);

alter table public.goals enable row level security;
drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
  for select
  using (auth.uid() = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
  for update
  using (auth.uid() = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
  for delete
  using (auth.uid() = user_id);

-- 4) Amigos (rede social simples)
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id_1 uuid not null references auth.users(id) on delete cascade,
  user_id_2 uuid not null references auth.users(id) on delete cascade,
  status text default 'Pendente',
  created_at timestamptz default now()
);

create index if not exists friends_user_id_1_idx on public.friends(user_id_1);
create index if not exists friends_user_id_2_idx on public.friends(user_id_2);

alter table public.friends enable row level security;
drop policy if exists "friends_select_own" on public.friends;
create policy "friends_select_own" on public.friends
  for select
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

drop policy if exists "friends_insert_own" on public.friends;
create policy "friends_insert_own" on public.friends
  for insert
  with check (auth.uid() = user_id_1 or auth.uid() = user_id_2);

drop policy if exists "friends_update_own" on public.friends;
create policy "friends_update_own" on public.friends
  for update
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

drop policy if exists "friends_delete_own" on public.friends;
create policy "friends_delete_own" on public.friends
  for delete
  using (auth.uid() = user_id_1 or auth.uid() = user_id_2);

-- 5) Storage bucket público para assets
insert into storage.buckets (id, name, public)
values ('app-assets', 'app-assets', true)
on conflict (id) do nothing;

-- 6) Temas visuais (Skins)
create table if not exists public.cosmetic_themes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  banner_path text not null,
  border_path text not null,
  description text,
  created_at timestamptz default now()
);

-- Seed de temas visuais
insert into public.cosmetic_themes (slug, name, banner_path, border_path, description)
values
  ('gm_gold', 'GRÃO-MESTRE', 'skins/banner_gm.png', 'skins/borda_gm.png', 'Ouro maciço, platina e engrenagens. Realeza e estratégia suprema.'),
  ('disciplined_ice', 'DISCIPLINADO', 'skins/banner_disciplinado.png', 'skins/borda_disciplinado.png', 'Metal frio, correntes e gelo. Resistência e rigor.'),
  ('popular_arcane', 'POPULAR', 'skins/banner_popular.png', 'skins/borda_popular.png', 'Roxo neon, magenta e conexões de rede. Influência e energia arcana.'),
  ('unstoppable_fire', 'IMPARÁVEL', 'skins/banner_imparavel.png', 'skins/borda_imparavel.png', 'Magma, ferro negro e brasas. Fúria e força bruta.'),
  ('legend_holy', 'LENDA VIVA', 'skins/banner_lenda.png', 'skins/borda_lenda.png', 'Iridescente, aurora boreal e luz divina. Transcendência.')
on conflict (slug) do nothing;
