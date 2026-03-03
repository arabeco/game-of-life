-- Create sitrep_reports table
CREATE TABLE IF NOT EXISTS public.sitrep_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    completed_tasks_count INTEGER DEFAULT 0,
    total_tasks_count INTEGER DEFAULT 0,
    task_ids JSONB DEFAULT '[]'::jsonb,
    bonus_xp INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.sitrep_reports ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own sitrep reports"
    ON public.sitrep_reports
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sitrep reports"
    ON public.sitrep_reports
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sitrep reports"
    ON public.sitrep_reports
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sitrep reports"
    ON public.sitrep_reports
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sitrep_reports_user_date ON public.sitrep_reports(user_id, date);
CREATE INDEX IF NOT EXISTS idx_sitrep_reports_cycle_id ON public.sitrep_reports(cycle_id);
