# Funções SQL do Supabase - Compilação Completa

Este documento contém todas as funções SQL criadas para o projeto Game of Life no Supabase.

---

## 📋 Índice

1. [Funções JSONB e Utilitários](#1-funções-jsonb-e-utilitários)
2. [Funções de Perfil](#2-funções-de-perfil)
3. [Views](#3-views)
4. [Tabelas e Estruturas](#4-tabelas-e-estruturas)
5. [Políticas RLS (Row Level Security)](#5-políticas-rls-row-level-security)
6. [Storage Policies](#6-storage-policies)

---

## 1. Funções JSONB e Utilitários

### `jsonb_deep_merge(target jsonb, patch jsonb)`

Função para fazer merge profundo de objetos JSONB.

```sql
-- Utilitarios JSONB + indices + checks (profiles.attributes)

-- 1) Merge parcial no JSONB (deep merge simples)
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
```

### `update_profile_attributes(p_user_id uuid, p_patch jsonb)`

Aplica um patch de atributos ao perfil do usuário usando merge profundo.

```sql
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
```

### Índices para Chaves JSONB

```sql
-- 2) Indices para chaves usadas na UI
create index if not exists profiles_attr_motto_main_idx
  on public.profiles ((attributes #>> '{gratitude,motto_main}'));

create index if not exists profiles_attr_projects_list_idx
  on public.profiles using gin ((attributes #> '{inspiration,projects_list}'));
```

### Constraints de Níveis (1-10)

```sql
-- 3) Checks de levels 1-10
alter table public.profiles
  add constraint if not exists chk_gratitude_level
  check ((attributes #>> '{gratitude,gratitude_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_spirit_level
  check ((attributes #>> '{spirit,spirit_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_mental_level
  check ((attributes #>> '{mental,mental_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_truth_level
  check ((attributes #>> '{truth,truth_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_inspiration_level
  check ((attributes #>> '{inspiration,inspiration_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_love_level
  check ((attributes #>> '{love,love_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_abundance_level
  check ((attributes #>> '{abundance,abundance_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_work_level
  check ((attributes #>> '{work,work_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_authenticity_level
  check ((attributes #>> '{authenticity,authenticity_level}')::int between 1 and 10);

alter table public.profiles
  add constraint if not exists chk_physical_level
  check ((attributes #>> '{physical,physical_level}')::int between 1 and 10);
```

---

## 2. Funções de Perfil

### `create_profile_minimal(p_user_id uuid, p_nickname text, p_full_name text, p_status_title text)`

Cria um perfil mínimo com valores padrão para attributes e cosmetics.

```sql
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
```

### `resolve_login_email(p_nickname text)`

Resolve o email de login a partir do nickname (para uso antes do login).

```sql
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
```

---

## 3. Views

### `profiles_summary`

View simplificada para visualizar perfis rapidamente.

```sql
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
```

---

## 4. Tabelas e Estruturas

### Alterações na Tabela `profiles`

```sql
-- Perfil estendido com JSONB (mais simples e visivel)
alter table public.profiles add column if not exists login_email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists status_title text;
alter table public.profiles add column if not exists archetype_name text;
alter table public.profiles add column if not exists archetype_tags text[];
alter table public.profiles add column if not exists cover_url text;
alter table public.profiles add column if not exists is_npc boolean default false;
alter table public.profiles add column if not exists npc_id uuid;
alter table public.profiles add column if not exists player_data jsonb default '{}'::jsonb;

-- Colunas para planner e DNA
alter table public.profiles add column if not exists planner_state jsonb DEFAULT '{}'::jsonb;
alter table public.profiles add column if not exists dna_state jsonb;

-- Colunas para tema e maestria
alter table public.profiles add column if not exists theme text DEFAULT 'gold';
alter table public.profiles add column if not exists status text DEFAULT 'sovereign';
alter table public.profiles add column if not exists mastery_mode text DEFAULT 'sovereign';
alter table public.profiles add column if not exists widgets jsonb DEFAULT '[]'::jsonb;

-- Colunas básicas
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
```

### Tabela `tasks`

```sql
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
```

### Tabela `planner_actions`

```sql
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
```

### Tabela `goals`

```sql
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

create index if not exists goals_user_id_idx on public.goals(user_id);
```

### Tabela `friends`

```sql
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
```

### Tabela `action_logs`

```sql
-- 2) Criar tabela action_logs (se não existir)
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
```

### Tabela `arenas`

```sql
-- 5) ARENAS: tabela para arenas por utilizador
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
```

### Tabela `cosmetic_themes`

```sql
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
```

### Alterações na Tabela `user_missions`

```sql
-- 3) Adicionar colunas faltantes na tabela user_missions (se não existirem)
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
```

### Storage Buckets

```sql
-- 5) Storage bucket público para assets
insert into storage.buckets (id, name, public)
values ('app-assets', 'app-assets', true)
on conflict (id) do nothing;
```

---

## 5. Políticas RLS (Row Level Security)

### Políticas para `profiles`

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- NPC público (leitura liberada) mantendo RLS
DROP POLICY IF EXISTS "profiles_select_npc" ON public.profiles;
CREATE POLICY "profiles_select_npc" ON public.profiles
  FOR SELECT
  USING (is_npc = true);
```

### Políticas para `tasks`

```sql
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select_own" ON public.tasks;
CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_insert_own" ON public.tasks;
CREATE POLICY "tasks_insert_own" ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_update_own" ON public.tasks;
CREATE POLICY "tasks_update_own" ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tasks_delete_own" ON public.tasks;
CREATE POLICY "tasks_delete_own" ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Políticas para `planner_actions`

```sql
ALTER TABLE public.planner_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planner_actions_select_own" ON public.planner_actions;
CREATE POLICY "planner_actions_select_own" ON public.planner_actions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "planner_actions_insert_own" ON public.planner_actions;
CREATE POLICY "planner_actions_insert_own" ON public.planner_actions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "planner_actions_update_own" ON public.planner_actions;
CREATE POLICY "planner_actions_update_own" ON public.planner_actions
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "planner_actions_delete_own" ON public.planner_actions;
CREATE POLICY "planner_actions_delete_own" ON public.planner_actions
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Políticas para `goals`

```sql
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goals_select_own" ON public.goals;
CREATE POLICY "goals_select_own" ON public.goals
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_insert_own" ON public.goals;
CREATE POLICY "goals_insert_own" ON public.goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_update_own" ON public.goals;
CREATE POLICY "goals_update_own" ON public.goals
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_delete_own" ON public.goals;
CREATE POLICY "goals_delete_own" ON public.goals
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Políticas para `friends`

```sql
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friends_select_own" ON public.friends;
CREATE POLICY "friends_select_own" ON public.friends
  FOR SELECT
  USING (auth.uid() = user_id_1 or auth.uid() = user_id_2);

DROP POLICY IF EXISTS "friends_insert_own" ON public.friends;
CREATE POLICY "friends_insert_own" ON public.friends
  FOR INSERT
  WITH CHECK (auth.uid() = user_id_1 or auth.uid() = user_id_2);

DROP POLICY IF EXISTS "friends_update_own" ON public.friends;
CREATE POLICY "friends_update_own" ON public.friends
  FOR UPDATE
  USING (auth.uid() = user_id_1 or auth.uid() = user_id_2);

DROP POLICY IF EXISTS "friends_delete_own" ON public.friends;
CREATE POLICY "friends_delete_own" ON public.friends
  FOR DELETE
  USING (auth.uid() = user_id_1 or auth.uid() = user_id_2);
```

### Políticas para `action_logs`

```sql
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
```

### Políticas para `arenas`

```sql
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
```

### Políticas para `user_missions`

```sql
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
```

---

## 6. Storage Policies

### Políticas para Bucket `banners`

```sql
-- Policy para permitir leitura pública de banners
CREATE POLICY "Allow public read banners"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'banners');
```

### Políticas para Bucket `borders`

```sql
-- Policy para permitir leitura pública de bordas
CREATE POLICY "Allow public read borders"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'borders');
```

---

## 📝 Comentários de Documentação

```sql
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
```

---

## 🔧 Como Usar

1. **Executar no Supabase SQL Editor**: Copie e cole cada seção no SQL Editor do Supabase Dashboard.
2. **Ordem de Execução Recomendada**:
   - Primeiro: Funções JSONB e Utilitários
   - Segundo: Funções de Perfil
   - Terceiro: Views
   - Quarto: Tabelas e Estruturas
   - Quinto: Políticas RLS
   - Sexto: Storage Policies
3. **Verificação**: Execute `SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';` para verificar as policies de storage.

---

## 📚 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [PostgreSQL JSONB Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Última atualização**: 2026-01-27
