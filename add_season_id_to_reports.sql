-- Add season_id column to reports table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'season_id') THEN
        ALTER TABLE reports ADD COLUMN season_id TEXT;
    END IF;
END $$;
