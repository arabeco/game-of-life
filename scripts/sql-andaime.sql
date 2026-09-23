-- O MINIMO DE SUPABASE PARA UM ARQUIVO DE MIGRACAO COMPILAR.
--
-- O checador roda num Postgres vazio, e uma migracao sozinha nao se sustenta:
-- ela fala com tabelas que ja existiam, com `auth.uid()` e com os papeis que o
-- Supabase cria. Sem isto, todo arquivo falharia por falta de vizinho, e o
-- erro de verdade — o de sintaxe — ficaria escondido atras disso.
--
-- Isto NAO e uma copia do banco de producao, e nao tenta ser. E o bastante
-- para o Postgres aceitar analisar o arquivo. Quando um arquivo novo falar de
-- uma tabela que nao esta aqui, e so acrescentar a coluna ou a tabela.

create role anon;
create role authenticated;
create role service_role;

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);

-- Sempre nulo: o checador nao simula sessao. Quem testa comportamento de RLS e
-- o teste de integracao, nao este arquivo — aqui a pergunta e "compila?".
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select null::text $$;

create table if not exists public.user_profiles (
  id uuid,
  email text,
  nickname text,
  sovereign jsonb,
  avatar_url text,
  border text,
  level integer,
  background_url text,
  banner_url text,
  is_online boolean,
  visible_widgets text[],
  skin text,
  last_level_update bigint,
  nobility jsonb,
  mood integer,
  chests jsonb,
  role text,
  created_at timestamptz,
  updated_at timestamptz,
  is_premium boolean,
  completed_season_missions text[],
  unlocked_items jsonb,
  unlocked_skins jsonb,
  gold integer,
  fragments integer,
  wallet jsonb,
  app_mode text,
  theme_preference text,
  arenas_view_mode text,
  terms_version text,
  terms_accepted_at timestamptz,
  terms_accept_source text,
  privacy_version text,
  privacy_accepted_at timestamptz,
  privacy_accept_source text,
  onboarding_version text,
  onboarding_started_at timestamptz,
  onboarding_completed_at timestamptz,
  onboarding_dismissed_at timestamptz,
  codex_creation_slots_purchased integer,
  starter_rewards_pending boolean,
  vanguard_welcome_pending boolean,
  vanguard_welcome_payload jsonb,
  vanguard_welcome_shown_at timestamptz,
  assets_visibility text,
  mastery_visibility text,
  partnership_slots_purchased integer,
  competition_slots_purchased integer,
  mentor_slots_purchased integer,
  linked_arena_slots_purchased integer,
  premium_expires_at timestamptz,
  premium_reward_pending boolean,
  premium_reward_payload jsonb,
  premium_reward_shown_at timestamptz,
  exp_boost_multiplier numeric,
  exp_boost_expires_at timestamptz,
  exp_boost_product_id text,
  feats_visibility text,
  asset_art_by_id jsonb,
  asset_widget_values jsonb,
  sequence_items jsonb,
  subscription_tier text,
  legacy_projection_scene_credits integer,
  campaign_quiz_medium_credits integer,
  campaign_quiz_free_credits integer,
  onboarding_push_prompted_at timestamptz,
  beta_program_code text,
  beta_program_label text,
  beta_program_started_at timestamptz,
  beta_program_ends_at timestamptz,
  beta_program_last_check_in_date date,
  beta_program_check_in_count integer,
  beta_program_days_target integer,
  beta_reward_pending boolean,
  beta_reward_shown_at timestamptz,
  beta_reward_payload jsonb,
  username text,
  title text,
  checklist_items jsonb,
  garden_visibility text,
  garden_state jsonb,
  daily_proof_streak jsonb,
  planner_view_mode text,
  accepted_system_challenges text[],
  onboarding_age_range text,
  onboarding_purpose text,
  arena_pact_arena_id uuid,
  arena_pact_kind text,
  arena_pact_difficulty text,
  arena_pact_goal integer,
  arena_pact_started_on date,
  arena_pact_ends_on date,
  legacy_five_day_eligible boolean,
  legacy_plaque_color text
);
alter table public.user_profiles add primary key (id);


create table if not exists public.items (
  id text primary key,
  name text,
  category text,
  tier integer,
  rarity text,
  image_url text,
  gold_price integer,
  is_rank_exclusive boolean,
  is_gold_exclusive boolean,
  is_season_exclusive boolean,
  is_premium_only boolean,
  is_chest_exclusive boolean,
  is_legacy_retired boolean,
  season_key text,
  season_slot integer,
  recycle_value integer,
  craft_cost integer,
  is_live_in_game boolean,
  description text
);

create table if not exists public.user_inventory (
  user_id uuid,
  item_id text
);

create table if not exists public.cycles (
  id uuid primary key,
  user_id uuid,
  name text,
  start_date date,
  end_date date,
  arena_ids text[],
  created_at timestamptz default now(),
  report_data jsonb,
  performance_score integer,
  season_id text,
  banked_exp_bonus integer
);
