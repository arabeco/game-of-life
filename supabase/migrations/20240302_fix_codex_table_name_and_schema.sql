-- Fix table name and schema for Codex
-- 1. Ensure 'codex' table exists (renamed from codexes if needed, or created new)

-- Check if 'codexes' exists and 'codex' does NOT exist, then rename
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'codexes') 
     AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'codex') THEN
    ALTER TABLE public.codexes RENAME TO codex;
  END IF;
END $$;

-- 2. Ensure 'codex' table exists with correct columns
CREATE TABLE IF NOT EXISTS public.codex (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    catalog_id UUID REFERENCES public.codex_catalog(id),
    name TEXT NOT NULL,
    description TEXT,
    author TEXT,
    price NUMERIC,
    template JSONB NOT NULL,
    schema_version TEXT DEFAULT 'v2',
    is_public BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fix columns if table already exists (Add missing ones)
ALTER TABLE public.codex ADD COLUMN IF NOT EXISTS catalog_id UUID REFERENCES public.codex_catalog(id);
ALTER TABLE public.codex ADD COLUMN IF NOT EXISTS template JSONB;
ALTER TABLE public.codex ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE public.codex ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT 'v2';
ALTER TABLE public.codex ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.codex ADD COLUMN IF NOT EXISTS author TEXT;

-- 4. CRITICAL: Fix schema_version type if it was created as INTEGER
-- We cast to text to avoid errors if there's data like 1 or 2
ALTER TABLE public.codex ALTER COLUMN schema_version TYPE TEXT USING schema_version::text;

-- 5. Enable RLS
ALTER TABLE public.codex ENABLE ROW LEVEL SECURITY;

-- 6. Update Policies (Drop old ones referencing codexes if any, create new for codex)
DROP POLICY IF EXISTS "Users can read own codexes" ON public.codex;
DROP POLICY IF EXISTS "Users can insert own codexes" ON public.codex;
DROP POLICY IF EXISTS "Users can read own codex" ON public.codex;
DROP POLICY IF EXISTS "Users can insert own codex" ON public.codex;

CREATE POLICY "Users can read own codex" ON public.codex FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own codex" ON public.codex FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 7. Fix existing rows if needed (e.g. if schema_version was null)
UPDATE public.codex SET schema_version = 'v2' WHERE schema_version IS NULL;
