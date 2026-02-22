-- Tabela de mensagens do Oráculo
CREATE TABLE IF NOT EXISTS public.oracle_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'neutro',
  delivery_type TEXT NOT NULL DEFAULT 'feed',
  context_snapshot JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de preferências do Oráculo
CREATE TABLE IF NOT EXISTS public.oracle_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Master toggles (Config → Preferências)
  ia_enabled BOOLEAN DEFAULT TRUE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  animations_enabled BOOLEAN DEFAULT TRUE,
  sounds_enabled BOOLEAN DEFAULT TRUE,
  haptics_enabled BOOLEAN DEFAULT TRUE,
  -- Oráculo config
  enabled_categories TEXT[] DEFAULT ARRAY[
    'frases_inspiradoras', 'reflexoes_filosoficas', 'fragmentos_sabedoria',
    'dicas_produtividade', 'rituais_lifestyle', 'provocacoes'
  ],
  active_mode TEXT DEFAULT 'neutro',
  custom_mode_instructions TEXT,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.oracle_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oracle_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own oracle messages"
ON public.oracle_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oracle messages"
ON public.oracle_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own oracle messages"
ON public.oracle_messages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own oracle preferences"
ON public.oracle_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own oracle preferences"
ON public.oracle_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own oracle preferences"
ON public.oracle_preferences FOR UPDATE
USING (auth.uid() = user_id);
