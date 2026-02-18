-- Add new columns to actions table to support extended action details
ALTER TABLE actions 
ADD COLUMN IF NOT EXISTS briefing TEXT,
ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pre_flight JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'::jsonb;

-- Comment on columns for clarity
COMMENT ON COLUMN actions.briefing IS 'Detailed briefing or notes for the action (Anotação)';
COMMENT ON COLUMN actions.assets IS 'Array of media assets (images, videos) for the action';
COMMENT ON COLUMN actions.pre_flight IS 'Checklist items or summary points (Resumo)';
COMMENT ON COLUMN actions.context IS 'Contextual tags like energy level, time of day, etc.';
