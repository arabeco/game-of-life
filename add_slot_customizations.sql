
ALTER TABLE public.clans ADD COLUMN IF NOT EXISTS slot_config JSONB DEFAULT '{}'::jsonb;
