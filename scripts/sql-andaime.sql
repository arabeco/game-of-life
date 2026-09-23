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
  id uuid primary key,
  wallet jsonb default '{}'::jsonb,
  nickname text,
  subscription_tier text,
  premium_expires_at timestamptz,
  is_premium boolean,
  completed_season_missions text[],
  checklist_items jsonb
);

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
