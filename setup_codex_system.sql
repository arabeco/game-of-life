-- 1. Alter Existing Tables to Support Codex & Rich Actions

-- Add Codex tracking to Arenas
ALTER TABLE public.arenas 
ADD COLUMN IF NOT EXISTS origin_codex_id UUID,
ADD COLUMN IF NOT EXISTS codex_level INT;

-- Add Rich Content fields to Actions
ALTER TABLE public.actions
ADD COLUMN IF NOT EXISTS origin_codex_id UUID,
ADD COLUMN IF NOT EXISTS briefing TEXT,
ADD COLUMN IF NOT EXISTS assets JSONB, -- Array of { type, url, title }
ADD COLUMN IF NOT EXISTS pre_flight JSONB, -- Array of strings (checklist)
ADD COLUMN IF NOT EXISTS context JSONB; -- { energyLevel, timeOfDay }

-- 2. Create Codex System Tables

CREATE TABLE IF NOT EXISTS public.codex_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price_brl DECIMAL(10, 2),
    is_premium BOOLEAN DEFAULT FALSE,
    cover_image TEXT,
    author_name TEXT,
    duration_days INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_codex_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    codex_id UUID NOT NULL REFERENCES public.codex_catalog(id),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
    current_day INT DEFAULT 1,
    UNIQUE(user_id, codex_id)
);

-- 3. Seed "Máquina Biológica" Codex

INSERT INTO public.codex_catalog (id, title, description, price_brl, is_premium, author_name, duration_days)
VALUES (
    'd290f1ee-6c54-4b01-90e6-d701748f0851',
    'Codex: Máquina Biológica',
    'Reconfigure sua biologia para performance máxima em 28 dias.',
    0.00,
    FALSE,
    'Soberano System',
    28
) ON CONFLICT (id) DO NOTHING;