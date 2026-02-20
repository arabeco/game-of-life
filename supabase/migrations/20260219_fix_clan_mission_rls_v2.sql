-- Fix RLS policies for Clan Missions (Corrected)

-- 1. Allow users to DELETE their own participation from clan missions
-- This fixes the "Error deleting clan mission participation" issue
DROP POLICY IF EXISTS "delete_own_clan_mission_participation" ON public.clan_mission_participants;

CREATE POLICY "delete_own_clan_mission_participation" ON public.clan_mission_participants
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Allow users (clan members) to INSERT/UPDATE clan mission progress
-- This is needed for the upsert call in GameContext.tsx when joining a mission
-- Note: usage of clan_mission_states was removed from codebase as it is redundant/missing
DROP POLICY IF EXISTS "membros_gerenciam_progresso_missao" ON public.clan_mission_progress;

CREATE POLICY "membros_gerenciam_progresso_missao" ON public.clan_mission_progress
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.clan_members cm WHERE cm.clan_id = clan_mission_progress.clan_id AND cm.user_id = auth.uid())
    );
