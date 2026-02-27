-- Add new columns to clan_custom_quests for Office Mode features
ALTER TABLE clan_custom_quests 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'work',
ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id);

-- Create index for faster queries on assigned tasks
CREATE INDEX IF NOT EXISTS idx_clan_quests_assigned_user ON clan_custom_quests(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_clan_quests_due_date ON clan_custom_quests(due_date);
