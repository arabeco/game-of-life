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
create schema if not exists extensions;
create or replace function extensions.gen_random_uuid() returns uuid language sql volatile as $$ select gen_random_uuid() $$;
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
  season_slot text, -- Conferido no schema remoto em 18/10/2026.
  -- NOT NULL em producao: uma insercao sem ele quebrou na mao do Afonso em
  -- 06/10/2026 (23502). O andaime cobra o mesmo, para quebrar aqui antes.
  recycle_value integer not null,
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

-- Criada pela migracao 20260923160000. Migracao posterior que fale de precos
-- precisa dela de pe para ser analisada.
create table if not exists public.store_prices (
  id text primary key,
  kind text not null,
  gold_price integer not null,
  label text not null default ''
);
insert into public.store_prices (id, kind, gold_price) values
  ('boost_xp_24h', 'boost', 50),
  ('boost_xp_7d', 'boost', 200),
  ('premium_30d', 'premium', 200),
  ('platinum_30d', 'premium', 500)
on conflict (id) do nothing;

create table if not exists public.user_inventory (user_id uuid, item_id text);

-- Vinculos e arenas compartilhadas.
create table if not exists public.relationship_links (
  id uuid primary key,
  link_type text,
  mentor_id uuid,
  pupil_id uuid,
  ended_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz,
  mentor_status text,
  planner_share_mode text
);
create table if not exists public.relationship_link_invites (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid,
  recipient_id uuid,
  pupil_user_id uuid,
  link_type text,
  status text,
  cost_gold integer,
  expires_at timestamptz,
  responded_at timestamptz,
  arena_slots integer,
  renewal_link_id uuid,
  arena_snapshot jsonb,
  actions_snapshot jsonb
);
create or replace function public.relationship_link_is_live(p_link public.relationship_links)
returns boolean language sql stable as $$
  select p_link.ended_at is null and (p_link.expires_at is null or p_link.expires_at > now())
$$;

-- Implementacao real vem da migracao de ciclo de vida; o andaime so precisa
-- expor a assinatura para validar migracoes que a reusam.
create or replace function public.respond_relationship_link_invite(p_invite_id uuid, p_action text)
returns jsonb language sql as $$ select jsonb_build_object('success', true) $$;
create table if not exists public.relationship_link_arenas (
  id uuid primary key,
  relationship_link_id uuid,
  arena_id uuid,
  created_by_user_id uuid,
  created_at timestamptz default now(),
  completed_at timestamptz,
  metadata jsonb
);
create table if not exists public.arenas (id uuid primary key, user_id uuid, asset_id text, name text, icon text, is_archived boolean);

-- As duas que faltavam para checar qualquer consulta que olhe o CICLO de
-- verdade: o que foi agendado e a qual arena aquilo pertence. Sem elas, tanto
-- a migracao de estatisticas da landing quanto os checks de ciclo ficavam
-- marcados como "incompleto" por falta de vizinho, nao por erro proprio.
--
-- Colunas pelo tipo ScheduledTask/Action de types.ts, em snake_case, que e
-- como o app grava.
-- OS TIPOS AQUI SAO OS DO BANCO, descobertos um a um e do jeito caro.
--
-- Tres consultas seguidas compilaram neste andaime e quebraram em producao,
-- cada uma num par diferente:
--
--   actions.id (uuid)   vs scheduled_tasks.action_id (text)
--   arenas.id  (text)   vs actions.arena_id        (uuid)
--
-- Em 06/10/2026 o information_schema de producao disse outra coisa para dois
-- destes (supabase/CHECK-regras-secretas.sql): arenas.id e UUID, igual a
-- actions.arena_id, e scheduled_tasks.id e TEXT. O andaime segue o banco.
--   cycles.start_date (date) vs scheduled_tasks.date (text)
--
-- O andaime concordava com a suposicao de quem escrevia a consulta em vez de
-- discordar dela, que e a unica coisa util que um andaime faz. Quem mexer aqui:
-- confira contra information_schema antes de mudar um tipo por conveniencia.
create table if not exists public.actions (
  id uuid primary key,
  user_id uuid,
  arena_id uuid,
  name text,
  action_type text,
  repetitions integer,
  duration integer,
  difficulty integer,
  source_quest_id text
);

create table if not exists public.scheduled_tasks (
  id text primary key,
  user_id uuid,
  action_id text,
  date text,
  start_time integer,
  duration integer,
  completed boolean default false,
  completed_at timestamptz,
  execution_order integer,
  created_at timestamptz default now()
);

-- Amizade e marcadores de compra: o que as regras secretas de borda e banner
-- leem (supabase/CHECK-regras-secretas.sql). `friends` guarda as duas pontas
-- de cada amizade, uma linha por pessoa; `user_purchases` guarda tambem os
-- marcadores que as funcoes de recompensa usam como "ja pago" — o pacto de
-- arena reclamado vira um `product_type = 'arena_pact'`.
create table if not exists public.friends (
  user_id uuid,
  friend_id uuid,
  created_at timestamptz default now()
);

-- Cla: o nome e o icone entram no cartao publico de cada pessoa
-- (get_public_profile_cards).
create table if not exists public.clans (
  id uuid primary key,
  name text,
  icon text
);

create table if not exists public.clan_members (
  user_id uuid,
  clan_id uuid,
  role text,
  joined_at timestamptz default now()
);

create table if not exists public.user_purchases (
  user_id uuid,
  product_type text,
  product_id text,
  gold_spent integer,
  expires_at timestamptz,
  is_active boolean,
  purchased_at timestamptz default now()
);

-- Codex e propostas pendentes de mentor. O andaime nao simula o saldo nem RLS;
-- basta que as assinaturas existam para a migration ser analisada pelo Postgres.
create table if not exists public.codex (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  catalog_id uuid,
  name text,
  description text,
  author text,
  price integer,
  template jsonb,
  schema_version text,
  is_public boolean,
  source_type text,
  origin_codex_id uuid,
  created_by_user_id uuid,
  mentor_relationship_link_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.codex_shares (
  id uuid primary key,
  sender_user_id uuid,
  recipient_user_id uuid,
  source_codex_id uuid,
  delivery_method text,
  share_token text,
  status text,
  cost_gold integer,
  notification_id uuid,
  claimed_by_user_id uuid,
  claimed_codex_id uuid,
  claimed_at timestamptz,
  created_at timestamptz default now(),
  metadata jsonb
);
create or replace function public._codex_debit_gold(uuid, integer, text, text, jsonb)
returns integer language sql as $$ select 0 $$;

-- O que minhas_marcas_secretas() le alem do que ja estava aqui
-- (supabase/migrations/20261006180000_regras_secretas.sql).
create table if not exists public.journal_pages (
  user_id uuid,
  page_number smallint,
  content text not null default '',
  updated_at timestamptz default now()
);

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  value integer,
  recorded_at timestamptz default now()
);

create table if not exists public.relationship_competition_challenges (
  id uuid primary key default gen_random_uuid(),
  winner_user_id uuid
);

-- Codigos de resgate (20260420190000_reward_codes_como_o_banco_tem).
create table if not exists public.reward_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  description text null,
  is_active boolean not null default true,
  starts_at timestamptz null,
  ends_at timestamptz null,
  max_redemptions integer null,
  per_user_limit integer not null default 1,
  reward_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.reward_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.reward_codes(id) on delete cascade,
  user_id uuid not null,
  code text not null,
  reward_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- O storage do Supabase, so o que as consultas de peso leem.
create schema if not exists storage;
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- O registro de abertura do app (20260329183000_create_app_runtime_events).
create table if not exists public.app_runtime_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid,
  page_session_id uuid,
  event_name text,
  duration_ms integer,
  entry_mode text,
  metadata jsonb not null default '{}'::jsonb
);

-- Dias no app, convites e o sino (20261010120000, 20261010150000).
create table if not exists public.dias_no_app (
  user_id uuid not null,
  dia date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, dia)
);
create table if not exists public.convites (
  dono uuid primary key,
  codigo text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.convites_usados (
  convidado uuid primary key,
  dono uuid not null,
  codigo text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text,
  content text,
  read boolean default false,
  created_at timestamptz default now(),
  metadata jsonb
);

-- O que a abertura do app le (supabase/CHECK-o-que-a-abertura-baixa.sql).
create table if not exists public.asset_levels (user_id uuid, asset_id text, level integer);
create table if not exists public.campaigns (id uuid primary key, user_id uuid, name text);
create table if not exists public.arena_folders (id uuid primary key, user_id uuid, name text);
create table if not exists public.oracle_messages (id uuid primary key, user_id uuid, content text, created_at timestamptz default now());
create table if not exists public.friend_requests (id uuid primary key, sender_id uuid, recipient_id uuid, status text);
create table if not exists public.seasons (id text primary key, name text);
create table if not exists public.season_missions (id text primary key, season_id text, title text);

-- Lembretes de acao (20260330170000 / 20261025130000): so a assinatura, para checar os revokes.
create or replace function public.enqueue_due_action_reminder_notifications() returns integer language sql as $$ select 0 $$;

-- 20261026150000_missoes_secretas_meio_e_fim: meta final da arena e o deposito do dia.
alter table public.arenas add column if not exists final_goal text;
alter table public.arenas add column if not exists completed_at timestamptz;
create table if not exists public.daily_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  date date,
  stage text default 'planning',
  exp_deposited integer
);

-- Fichas de vinculo (28/10/2026): o que a migracao le e nao existia aqui.
alter table public.user_profiles add column if not exists relationship_slots_purchased integer not null default 0;
alter table public.relationship_link_invites add column if not exists created_at timestamptz default now();
alter table public.relationship_link_invites add column if not exists refunded_at timestamptz;
create or replace function public._relationship_credit_gold(p_user_id uuid, p_amount integer, p_reason text, p_label text, p_meta jsonb)
returns integer language sql as $$ select 0 $$;
create or replace function public._relationship_linked_arena_capacity(p_user_id uuid)
returns jsonb language sql as $$ select '{}'::jsonb $$;
create or replace function public._competition_snapshot_arena_exists(p_arena_id uuid)
returns boolean language sql as $$ select false $$;
