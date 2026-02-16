
-- Drop the table to ensure clean state (since we are fixing a broken schema)
DROP TABLE IF EXISTS public.clan_mission_progress CASCADE;

-- Recreate the table with correct columns
CREATE TABLE public.clan_mission_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    mission_id TEXT NOT NULL,
    current_value INTEGER DEFAULT 0,
    target_value INTEGER DEFAULT 50,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clan_id, mission_id)
);

-- Enable RLS
ALTER TABLE public.clan_mission_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "select_clan_mission_progress" ON public.clan_mission_progress
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_progress.clan_id AND cm.user_id = auth.uid())
    );

CREATE POLICY "update_clan_mission_progress" ON public.clan_mission_progress
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_progress.clan_id AND cm.user_id = auth.uid())
    );

CREATE POLICY "insert_clan_mission_progress" ON public.clan_mission_progress
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_progress.clan_id AND cm.user_id = auth.uid())
    );

-- Recreate the function to ensure it matches
CREATE OR REPLACE FUNCTION increment_clan_mission_progress(p_clan_id UUID, p_mission_id TEXT, p_increment INT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.clan_mission_progress (clan_id, mission_id, current_value, target_value)
  VALUES (p_clan_id, p_mission_id, p_increment, 50)
  ON CONFLICT (clan_id, mission_id)
  DO UPDATE SET 
    current_value = clan_mission_progress.current_value + p_increment,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
