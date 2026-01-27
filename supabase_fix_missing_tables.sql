-- Fix: Criar tabelas e colunas faltantes para o Game of Life
-- Execute este script no SQL Editor do Supabase

-- 1) Adicionar coluna planner_state na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS planner_state jsonb DEFAULT '{}'::jsonb;

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

-- 4) Garantir que user_missions tem user_id como chave estrangeira (se não tiver)
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

-- 5) Criar índice em user_id se não existir
CREATE INDEX IF NOT EXISTS user_missions_user_id_idx ON public.user_missions(user_id);

-- 6) Garantir RLS na user_missions
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

-- 7) Comentários para documentação
COMMENT ON COLUMN public.profiles.planner_state IS 'Estado do planner do usuário em formato JSONB';
COMMENT ON TABLE public.action_logs IS 'Logs de ações do usuário para rastreamento de vitalidade';
COMMENT ON COLUMN public.user_missions.m1 IS 'Missão 1 completada';
COMMENT ON COLUMN public.user_missions.m2 IS 'Missão 2 completada';
COMMENT ON COLUMN public.user_missions.m3 IS 'Missão 3 completada';
COMMENT ON COLUMN public.user_missions.m4 IS 'Missão 4 completada';
COMMENT ON COLUMN public.user_missions.m5 IS 'Missão 5 completada';
COMMENT ON COLUMN public.user_missions.initiation_finished IS 'Iniciação finalizada';
