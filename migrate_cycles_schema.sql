-- Add columns to cycles table to store report data
ALTER TABLE public.cycles 
ADD COLUMN IF NOT EXISTS report_data JSONB,
ADD COLUMN IF NOT EXISTS performance_score INTEGER,
ADD COLUMN IF NOT EXISTS season_id TEXT;

-- Optional: Try to migrate existing reports to cycles if they match
-- This matches based on user_id and approximate end_date (within 1 minute)
UPDATE public.cycles c
SET 
    report_data = to_jsonb(r),
    performance_score = r.performance_score,
    season_id = r.season_id
FROM public.reports r
WHERE 
    c.user_id = r.user_id 
    AND c.report_data IS NULL
    AND c.end_date IS NOT NULL
    AND r.end_date IS NOT NULL
    AND ABS(EXTRACT(EPOCH FROM (c.end_date::timestamp - r.end_date::timestamp))) < 60;
