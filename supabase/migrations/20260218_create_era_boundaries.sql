CREATE TABLE IF NOT EXISTS public.era_boundaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  after_report_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, after_report_id)
);

CREATE INDEX IF NOT EXISTS idx_era_boundaries_user ON public.era_boundaries(user_id);

ALTER TABLE public.era_boundaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_era_boundaries" ON public.era_boundaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own_era_boundaries" ON public.era_boundaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_era_boundaries" ON public.era_boundaries
  FOR DELETE USING (auth.uid() = user_id);
