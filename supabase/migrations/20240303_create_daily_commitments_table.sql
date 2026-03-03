-- Create daily_commitments table
CREATE TABLE IF NOT EXISTS daily_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    task_ids UUID[] DEFAULT '{}',
    stage TEXT DEFAULT 'planning', -- 'planning', 'battle', 'judgment'
    score INTEGER,
    exp_deposited INTEGER,
    sitrep_bonus INTEGER,
    earned_insignia_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE daily_commitments ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can manage their own daily commitments" 
ON daily_commitments FOR ALL 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_commitments_user_date ON daily_commitments(user_id, date);
