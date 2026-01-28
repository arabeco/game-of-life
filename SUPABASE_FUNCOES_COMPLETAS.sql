-- ============================================
-- FUNÇÕES SQL DO SUPABASE - COMPILAÇÃO COMPLETA
-- Game of Life Project
-- ============================================
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. FUNÇÕES JSONB E UTILITÁRIOS
-- ============================================

-- Merge parcial no JSONB (deep merge simples)
create or replace function public.jsonb_deep_merge(target jsonb, patch jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  result jsonb := target;
  key text;
  value jsonb;
begin
  if target is null then
    return patch;
  end if;
  if patch is null then
    return target;
  end if;
  for key, value in select * from jsonb_each(patch)
  loop
    if jsonb_typeof(value) = 'object' and jsonb_typeof(target -> key) = 'object' then
      result := jsonb_set(result, array[key], public.jsonb_deep_merge(target -> key, value), true);
    else
      result := jsonb_set(result, array[key], value, true);
    end if;
  end loop;
  return result;
end;
$$;

-- Helper para aplicar patch no profile atual
create or replace function public.update_profile_attributes(p_user_id uuid, p_patch jsonb)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.profiles
     set attributes = public.jsonb_deep_merge(coalesce(attributes, '{}'::jsonb), p_patch)
   where user_id = p_user_id;
end;
$$;

grant execute on function public.update_profile_attributes(uuid, jsonb) to authenticated;

-- Indices para chaves usadas na UI
create index if not exists profiles_attr_motto_main_idx
  on public.profiles ((attributes #>> '{gratitude,motto_main}'));

create index if not exists profiles_attr_projects_list_idx
  on public.profiles using gin ((attributes #> '{inspiration,projects_list}'));

-- Checks de levels 1-10
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_gratitude_level'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_gratitude_level
    CHECK ((attributes #>> '{gratitude,gratitude_level}')::int between 1 and 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_spirit_level'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_spirit_level
    CHECK ((attributes #>> '{spirit,spirit_level}')::int between 1 and 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_mental_level'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_mental_level
    CHECK ((attributes #>> '{mental,mental_level}')::int between 1 and 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_truth_level'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_truth_level
    CHECK ((attributes #>> '{truth,truth_level}')::int between 1 and 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_inspiration_level'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_inspiration_level
    CHECK ((attributes #>> '{inspiration,inspiration_level}')::int between 1 and 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_love_level'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_love_level
    CHECK ((attributes #>> '{love,love_level}')::int between 1 and 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_abundance_level'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_abundance_level
    CHECK ((attributes #>> '{abundance,abundance_level}')::int between 1 and 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_work_level'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_work_level
    CHECK ((attributes #>> '{work,work_level}')::int between 1 and 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_authenticity_level'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_authenticity_level
    CHECK ((attributes #>> '{authenticity,authenticity_level}')::int between 1 and 10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_physical_level'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT chk_physical_level
    CHECK ((attributes #>> '{physical,physical_level}')::int between 1 and 10);
  END IF;
END $$;

-- ============================================
-- 2. FUNÇÕES DE PERFIL
-- ============================================

-- Criacao rapida de perfil com defaults (attributes/cosmetics)
create or replace function public.create_profile_minimal(
  p_user_id uuid,
  p_nickname text,
  p_full_name text,
  p_status_title text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (
    user_id,
    nickname,
    full_name,
    status_title,
    global_level,
    attributes,
    cosmetics
  )
  values (
    p_user_id,
    p_nickname,
    p_full_name,
    p_status_title,
    0,
    jsonb_build_object(
      'gratitude', jsonb_build_object(
        'level', 1,
        'motto_main', jsonb_build_object('type','type1','title','Lema','value',''),
        'beliefs_list', jsonb_build_object('type','type1','title','Crenças','value',''),
        'flow_state_analysis', jsonb_build_object('type','type1','title','Flow','value','')
      ),
      'spirit', jsonb_build_object(
        'level', 1,
        'belief_system', jsonb_build_object('type','type1','title','Sistema','value',''),
        'entity_leader', jsonb_build_object('type','type3','title','Entidade Líder','image_url','', 'caption',''),
        'entity_protector', jsonb_build_object('type','type3','title','Entidade Protetora','image_url','', 'caption','')
      ),
      'mental', jsonb_build_object(
        'level', 1,
        'operational_philosophy', jsonb_build_object('type','type1','title','Filosofia','value',''),
        'mental_status', jsonb_build_object('type','type5','title','Status Mental','current_value','', 'options_list', jsonb_build_array()),
        'vulnerability_desc', jsonb_build_object('type','type1','title','Vulnerabilidade','value','')
      ),
      'truth', jsonb_build_object(
        'level', 1,
        'mtp_mission', jsonb_build_object('type','type1','title','Missão','value',''),
        'passive_traits', jsonb_build_object('type','type5','title','Traços','current_value','', 'options_list', jsonb_build_array()),
        'mbti_type', jsonb_build_object('type','type1','title','MBTI','value',''),
        'zodiac_sign', jsonb_build_object('type','type1','title','Signo','value',''),
        'inspiration_slots', jsonb_build_array()
      ),
      'inspiration', jsonb_build_object(
        'level', 1,
        'projects_list', jsonb_build_array()
      ),
      'love', jsonb_build_object(
        'level', 1,
        'social_role_analysis', jsonb_build_object('type','type1','title','Papel Social','value',''),
        'inner_circle', jsonb_build_array(),
        'war_brothers', jsonb_build_array()
      ),
      'abundance', jsonb_build_object(
        'level', 1,
        'burn_rate_indicator', jsonb_build_object('type','type1','title','Burn Rate','value',''),
        'liquidity_sources', jsonb_build_object('type','type1','title','Fontes','value',''),
        'assets_slots', jsonb_build_array()
      ),
      'work', jsonb_build_object(
        'level', 1,
        'primary_class', jsonb_build_object('type','type2','title','Classe Primária','value','', 'sub_value',''),
        'secondary_class', jsonb_build_object('type','type2','title','Classe Secundária','value','', 'sub_value',''),
        'career_history', jsonb_build_object('type','type1','title','Histórico','value','')
      ),
      'authenticity', jsonb_build_object(
        'level', 1,
        'hobbies_slots', jsonb_build_array()
      ),
      'physical', jsonb_build_object(
        'level', 1,
        'shape_photo', jsonb_build_object('type','type4','top_label','', 'image_url','', 'caption',''),
        'physical_status', jsonb_build_object('type','type5','title','Status Físico','current_value','', 'options_list', jsonb_build_array()),
        'attributes_stats', jsonb_build_array()
      )
    ),
    jsonb_build_object(
      'banner_id', 'solar_crest',
      'frame_id', 'halo_gold',
      'color_theme', 'gold',
      'active_effects', jsonb_build_array()
    )
  );
end;
$$;

grant execute on function public.create_profile_minimal(uuid, text, text, text) to authenticated;

-- Resolver login por nickname com segurança (para uso antes do login)
create or replace function public.resolve_login_email(p_nickname text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_email text;
begin
  select p.login_email
    into v_email
  from public.profiles p
  where lower(p.nickname) = lower(p_nickname)
     or lower(p.userid) = lower(p_nickname)
  limit 1;
  return v_email;
end;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- ============================================
-- 3. VIEWS
-- ============================================

-- View simples para visualizar perfis rapidamente
create or replace view public.profiles_summary as
select
  id,
  user_id,
  nickname,
  full_name,
  status_title,
  global_level,
  avatar_url,
  cover_url,
  (attributes #>> '{gratitude,motto_main,value}') as motto_main,
  (attributes #>> '{truth,mtp_mission,value}') as mtp_mission,
  (attributes #>> '{mental,mental_status,current_value}') as mental_status,
  (attributes #>> '{physical,physical_status,current_value}') as physical_status,
  (cosmetics ->> 'banner_id') as banner_id,
  (cosmetics ->> 'frame_id') as frame_id,
  (cosmetics ->> 'color_theme') as color_theme
from public.profiles;

-- ============================================
-- 4. TABELAS E ESTRUTURAS
-- ============================================

-- Perfil estendido com JSONB
alter table public.profiles add column if not exists login_email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists status_title text;
alter table public.profiles add column if not exists archetype_name text;
alter table public.profiles add column if not exists archetype_tags text[];
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists is_npc boolean default false;
alter table public.profiles add column if not exists npc_id uuid;
alter table public.profiles add column if not exists player_data jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists planner_state jsonb DEFAULT '{}'::jsonb;
alter table public.profiles add column if not exists dna_state jsonb;
alter table public.profiles add column if not exists theme text DEFAULT 'gold';
alter table public.profiles add column if not exists status text DEFAULT 'sovereign';
alter table public.profiles add column if not exists mastery_mode text DEFAULT 'sovereign';
alter table public.profiles add column if not exists widgets jsonb DEFAULT '[]'::jsonb;
alter table public.profiles add column if not exists global_level int default 0;
alter table public.profiles add column if not exists current_mood text;
alter table public.profiles add column if not exists cosmetics jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists attributes jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists id uuid;
alter table public.profiles add column if not exists user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.profiles add column if not exists nickname text DEFAULT '';
alter table public.profiles add column if not exists handle text DEFAULT '';
alter table public.profiles add column if not exists lema text DEFAULT '';
alter table public.profiles add column if not exists avatar_url text DEFAULT '';
alter table public.profiles add column if not exists total_level int DEFAULT 0;
alter table public.profiles add column if not exists level_geral int DEFAULT 0;
alter table public.profiles add column if not exists asset_levels jsonb DEFAULT '{}'::jsonb;

-- Tarefas (Arenas/Afazeres)
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

-- Planner Actions (Motor do Tempo)
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

-- Metas de longo prazo
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  progress int default 0,
  target_date date,
  is_postponable boolean default false,
  created_at timestamptz default now()
);

create index if not exists goals_user_id_idx on public.goals(user_id);

alter table public.tasks add column if not exists is_postponable boolean default false;
alter table public.planner_actions add column if not exists is_postponable boolean default false;
alter table public.goals add column if not exists is_postponable boolean default false;

-- Amigos (rede social simples)
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id_1 uuid not null references auth.users(id) on delete cascade,
  user_id_2 uuid not null references auth.users(id) on delete cascade,
  status text default 'Pendente',
  created_at timestamptz default now()
);

create index if not exists friends_user_id_1_idx on public.friends(user_id_1);
create index if not exists friends_user_id_2_idx on public.friends(user_id_2);

-- Action Logs
CREATE TABLE IF NOT EXISTS public.action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id text,
  assetId text,
  action_type text,
  type text,
  kind text,
  created_at timestamptz DEFAULT now(),
  createdDate timestamptz,
  timestamp timestamptz
);

CREATE INDEX IF NOT EXISTS action_logs_user_id_idx ON public.action_logs(user_id);
CREATE INDEX IF NOT EXISTS action_logs_created_at_idx ON public.action_logs(created_at);
CREATE INDEX IF NOT EXISTS action_logs_asset_id_idx ON public.action_logs(asset_id);

-- Arenas
CREATE TABLE IF NOT EXISTS public.arenas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id text,
  title text,
  description text,
  target_count int,
  completed_count int DEFAULT 0,
  completion int DEFAULT 0,
  display_order int DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  payload jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS arenas_user_id_idx ON public.arenas(user_id);

-- Temas visuais (Skins)
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

-- User Missions - colunas faltantes
ALTER TABLE public.user_missions 
ADD COLUMN IF NOT EXISTS m1 boolean DEFAULT false;

ALTER TABLE public.user_missions 
ADD COLUMN IF NOT EXISTS m2 boolean DEFAULT false;

ALTER TABLE public.user_missions 
ADD COLUMN IF NOT EXISTS m3 boolean DEFAULT false;

ALTER TABLE public.user_missions 
ADD COLUMN IF NOT EXISTS m4 boolean DEFAULT false;

ALTER TABLE public.user_missions 
ADD COLUMN IF NOT EXISTS m5 boolean DEFAULT false;

ALTER TABLE public.user_missions 
ADD COLUMN IF NOT EXISTS initiation_finished boolean DEFAULT false;

-- Garantir que user_missions tem user_id como chave estrangeira
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_missions_user_id_fkey' 
    AND table_name = 'user_missions'
  ) THEN
    ALTER TABLE public.user_missions 
    ADD CONSTRAINT user_missions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS user_missions_user_id_idx ON public.user_missions(user_id);

-- Storage bucket público para assets
insert into storage.buckets (id, name, public)
values ('app-assets', 'app-assets', true)
on conflict (id) do nothing;

-- ============================================
-- 5. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_npc" ON public.profiles;
CREATE POLICY "profiles_select_npc" ON public.profiles
  FOR SELECT
  USING (is_npc = true);

-- Tasks RLS
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

-- Planner Actions RLS
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

-- Goals RLS
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

-- Friends RLS
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

-- Action Logs RLS
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "action_logs_select_own" ON public.action_logs;
CREATE POLICY "action_logs_select_own" ON public.action_logs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "action_logs_insert_own" ON public.action_logs;
CREATE POLICY "action_logs_insert_own" ON public.action_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "action_logs_update_own" ON public.action_logs;
CREATE POLICY "action_logs_update_own" ON public.action_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "action_logs_delete_own" ON public.action_logs;
CREATE POLICY "action_logs_delete_own" ON public.action_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Arenas RLS
ALTER TABLE public.arenas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arenas_select_own" ON public.arenas;
CREATE POLICY "arenas_select_own" ON public.arenas 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "arenas_insert_own" ON public.arenas;
CREATE POLICY "arenas_insert_own" ON public.arenas 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "arenas_update_own" ON public.arenas;
CREATE POLICY "arenas_update_own" ON public.arenas 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "arenas_delete_own" ON public.arenas;
CREATE POLICY "arenas_delete_own" ON public.arenas 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- User Missions RLS
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_missions_select_own" ON public.user_missions;
CREATE POLICY "user_missions_select_own" ON public.user_missions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_missions_insert_own" ON public.user_missions;
CREATE POLICY "user_missions_insert_own" ON public.user_missions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_missions_update_own" ON public.user_missions;
CREATE POLICY "user_missions_update_own" ON public.user_missions
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_missions_delete_own" ON public.user_missions;
CREATE POLICY "user_missions_delete_own" ON public.user_missions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. STORAGE POLICIES
-- ============================================

-- Policy para permitir leitura pública de banners
DROP POLICY IF EXISTS "Allow public read banners" ON storage.objects;
CREATE POLICY "Allow public read banners"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'banners');

-- Policy para permitir leitura pública de bordas
DROP POLICY IF EXISTS "Allow public read borders" ON storage.objects;
CREATE POLICY "Allow public read borders"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'borders');

-- ============================================
-- 7. COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================

COMMENT ON COLUMN public.profiles.planner_state IS 'Estado do planner do usuário em formato JSONB';
COMMENT ON TABLE public.action_logs IS 'Logs de ações do usuário para rastreamento de vitalidade';
COMMENT ON COLUMN public.user_missions.m1 IS 'Missão 1 completada';
COMMENT ON COLUMN public.user_missions.m2 IS 'Missão 2 completada';
COMMENT ON COLUMN public.user_missions.m3 IS 'Missão 3 completada';
COMMENT ON COLUMN public.user_missions.m4 IS 'Missão 4 completada';
COMMENT ON COLUMN public.user_missions.m5 IS 'Missão 5 completada';
COMMENT ON COLUMN public.user_missions.initiation_finished IS 'Iniciação finalizada';
COMMENT ON COLUMN public.profiles.theme IS 'Tema visual: gold, frost, ember, aurora, cyber, void';
COMMENT ON COLUMN public.profiles.status IS 'Estado do jogador: sovereign, oracle';
COMMENT ON COLUMN public.profiles.mastery_mode IS 'Tipo de maestria (ex: sovereign, oracle)';
COMMENT ON COLUMN public.profiles.widgets IS 'Configuração/ids dos widgets visíveis';
COMMENT ON COLUMN public.profiles.login_email IS 'Email (espelho do Auth, para busca por nickname)';
COMMENT ON TABLE public.arenas IS 'Arenas (metas) por utilizador; sync substitui game_of_life.arenas em localStorage';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
