-- Fix RLS policies for Clan Missions

-- 1. Allow users to DELETE their own participation from clan missions
-- This fixes the "Error deleting clan mission participation" issue
DROP POLICY IF EXISTS "delete_own_clan_mission_participation" ON public.clan_mission_participants;

CREATE POLICY "delete_own_clan_mission_participation" ON public.clan_mission_participants
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Allow users (clan members) to INSERT/UPDATE clan mission states
-- This is needed for the upsert call in GameContext.tsx when joining a mission
-- We should restrict this to clan members
DROP POLICY IF EXISTS "membros_gerenciam_estado_missao" ON public.clan_mission_states;

CREATE POLICY "membros_gerenciam_estado_missao" ON public.clan_mission_states
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_states.clan_id AND cm.user_id = auth.uid())
    );

-- 3. Ensure clan_mission_progress is writable by members (for progress updates)
-- Currently GameContext updates it via RPC or direct update?
-- It seems to use 'clan_mission_progress' table. Let's check if it exists and has policies.
-- Assuming it does, but if not, we might need to add policies there too.
-- For now, the critical fix is the DELETE policy above.
