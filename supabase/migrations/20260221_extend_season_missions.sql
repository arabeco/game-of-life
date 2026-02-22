ALTER TABLE season_missions 
ADD COLUMN IF NOT EXISTS action_name text,
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS type text DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS requirements jsonb DEFAULT '{}'::jsonb;
