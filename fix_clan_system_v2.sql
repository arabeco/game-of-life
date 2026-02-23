
-- 1. Ensure clan_type column exists and has default
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clans' AND column_name = 'clan_type') THEN
        ALTER TABLE clans ADD COLUMN clan_type TEXT DEFAULT 'Casual';
    END IF;
END $$;

-- 2. Update existing clans to have a type if null (Set to Casual by default, or Office if you prefer testing)
-- You can manually change this to 'Office' for your specific clan in the Supabase Table Editor if needed.
UPDATE clans SET clan_type = 'Casual' WHERE clan_type IS NULL OR clan_type = '';

-- 3. Create or Replace the V2 RPC function for sitting in slots
-- This is CRITICAL for the "Sitting" functionality to work
CREATE OR REPLACE FUNCTION enter_aldeia_slot_v2(
  p_clan_id UUID,
  p_slot_id TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Attempt to UPSERT presence
  INSERT INTO public.clan_aldeia_presence (clan_id, user_id, slot_id, started_at)
  VALUES (p_clan_id, v_user_id, p_slot_id, now())
  ON CONFLICT (clan_id, user_id)
  DO UPDATE SET 
    slot_id = EXCLUDED.slot_id,
    started_at = EXCLUDED.started_at;
    
  -- Update slot activity timestamp
  UPDATE public.clan_aldeia_slots
  SET last_visited_at = now()
  WHERE clan_id = p_clan_id AND slot_id = p_slot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION enter_aldeia_slot_v2(UUID, TEXT) TO authenticated;

-- 5. Ensure Clan Custom Quests table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.clan_custom_quests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    mission_type TEXT NOT NULL CHECK (mission_type IN ('singular', 'shared')),
    target_value INTEGER DEFAULT 1,
    current_value INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 10,
    reward_gold INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'locked', 'completed', 'expired')),
    assigned_user_id UUID REFERENCES auth.users(id), -- For singular quests
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- 6. Policies for Quests
ALTER TABLE public.clan_custom_quests ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_custom_quests' AND policyname = 'Clan members can view quests') THEN
        CREATE POLICY "Clan members can view quests" ON public.clan_custom_quests FOR SELECT USING (
            EXISTS (SELECT 1 FROM clan_members WHERE clan_members.clan_id = clan_custom_quests.clan_id AND clan_members.user_id = auth.uid())
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_custom_quests' AND policyname = 'Leaders can manage quests') THEN
        CREATE POLICY "Leaders can manage quests" ON public.clan_custom_quests FOR ALL USING (
            EXISTS (SELECT 1 FROM clan_members WHERE clan_members.clan_id = clan_custom_quests.clan_id AND clan_members.user_id = auth.uid() AND clan_members.role = 'leader')
        );
    END IF;
    
    -- Allow members to update quests (for opt-in/contribution) - stricter checks handled in app/RPC usually, but basic update needed
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clan_custom_quests' AND policyname = 'Members can update quests') THEN
        CREATE POLICY "Members can update quests" ON public.clan_custom_quests FOR UPDATE USING (
            EXISTS (SELECT 1 FROM clan_members WHERE clan_members.clan_id = clan_custom_quests.clan_id AND clan_members.user_id = auth.uid())
        );
    END IF;
END $$;
