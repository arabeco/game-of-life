
-- FIX CLAN MEMBERS RLS
-- This script ensures that clan leaders can add new members and manage them.

-- 1. Enable RLS
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

-- 2. Basic SELECT policy (Publicly visible)
DROP POLICY IF EXISTS "Anyone can view clan members" ON public.clan_members;
CREATE POLICY "Anyone can view clan members" ON public.clan_members
    FOR SELECT USING (true);

-- 3. INSERT policies
-- Allow users to join a clan themselves (role must be 'member')
DROP POLICY IF EXISTS "Users can join clans" ON public.clan_members;
CREATE POLICY "Users can join clans" ON public.clan_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND role = 'member'
    );

-- Allow leaders to add members to their own clan
DROP POLICY IF EXISTS "Leaders can add members" ON public.clan_members;
CREATE POLICY "Leaders can add members" ON public.clan_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clan_members
            WHERE clan_id = clan_members.clan_id
              AND user_id = auth.uid()
              AND role = 'leader'
        )
    );

-- Special case for clan creation (leader inserting themselves)
DROP POLICY IF EXISTS "Leaders can insert themselves on creation" ON public.clan_members;
CREATE POLICY "Leaders can insert themselves on creation" ON public.clan_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND role = 'leader'
    );

-- 4. DELETE policies
-- Allow users to leave their clan
DROP POLICY IF EXISTS "Users can leave clans" ON public.clan_members;
CREATE POLICY "Users can leave clans" ON public.clan_members
    FOR DELETE USING (auth.uid() = user_id);

-- Allow leaders to kick members from their clan
DROP POLICY IF EXISTS "Leaders can kick members" ON public.clan_members;
CREATE POLICY "Leaders can kick members" ON public.clan_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.clan_members
            WHERE clan_id = clan_members.clan_id
              AND user_id = auth.uid()
              AND role = 'leader'
        )
    );

-- 5. UPDATE policies (e.g. for changing roles, though not fully used in UI yet)
DROP POLICY IF EXISTS "Leaders can update member roles" ON public.clan_members;
CREATE POLICY "Leaders can update member roles" ON public.clan_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clan_members
            WHERE clan_id = clan_members.clan_id
              AND user_id = auth.uid()
              AND role = 'leader'
        )
    );
