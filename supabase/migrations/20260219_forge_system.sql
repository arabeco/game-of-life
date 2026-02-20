-- Add economy columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS gold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fragments INTEGER DEFAULT 0;

-- Create Inventory Table
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL, -- Matches constants/items.ts IDs
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb -- For unique properties if needed
);

-- Create Transactions Table for Audit
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'purchase', 'craft', 'recycle', 'reward', 'usage'
    currency TEXT NOT NULL, -- 'gold', 'fragments'
    amount INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- RLS Policies
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Inventory Policies
CREATE POLICY "Users can view own inventory" ON user_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own inventory" ON user_inventory
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" ON user_inventory
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own inventory" ON user_inventory
    FOR DELETE USING (auth.uid() = user_id);

-- Transactions Policies (Read only for users)
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Only system/functions should insert transactions ideally, but for now allow user to insert via client (in a real app this would be server-side only)
CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
