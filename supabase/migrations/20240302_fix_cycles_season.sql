-- Fix Cycles Table Season ID
-- This script ensures the cycles table has a season_id column and backfills it for existing records.

-- 1. Add season_id column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cycles' AND column_name = 'season_id') THEN
        ALTER TABLE cycles ADD COLUMN season_id text;
    END IF;
END $$;

-- 2. Update existing cycles that have no season_id
-- We set a default season for old cycles to avoid issues. 
-- You can adjust 'season-genesis-0' to your actual default season ID if different.
UPDATE cycles 
SET season_id = 'season-genesis-0' 
WHERE season_id IS NULL;

-- 3. Ensure performance_score is present (optional, just safety)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cycles' AND column_name = 'performance_score') THEN
        ALTER TABLE cycles ADD COLUMN performance_score integer;
    END IF;
END $$;

-- 4. Ensure report_data is present
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cycles' AND column_name = 'report_data') THEN
        ALTER TABLE cycles ADD COLUMN report_data jsonb;
    END IF;
END $$;
