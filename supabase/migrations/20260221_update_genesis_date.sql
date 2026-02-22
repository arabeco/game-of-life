-- Update Genesis Season Date
UPDATE seasons
SET 
    end_date = '2026-03-20'
WHERE name ILIKE '%Genesis%' OR id = 'season-01';

-- Update Season Missions to ensure they have correct types if missing
UPDATE season_missions
SET type = 'individual'
WHERE type IS NULL;
