
-- MIGRATION: 20260322180000_apply_rls_and_triggers_fixes.sql
-- Consolidates fixes for:
-- 1. Welcome notification trigger
-- 2. Mentor arena edit RLS
-- 3. Clan members RLS
-- 4. Mentorship premium trigger

-- ==========================================
-- 1. WELCOME NOTIFICATION TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, content, metadata)
    VALUES (
        NEW.id,
        'system',
        'Bem-vindo ao Oráculo! Seu Starter Pack foi entregue. Explore as Arenas e o Planner para começar sua jornada.',
        jsonb_build_object('welcome', true)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON public.user_profiles;
CREATE TRIGGER on_auth_user_created_welcome
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_welcome_notification();

-- ==========================================
-- 2. MENTOR ARENA EDIT RLS
-- ==========================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'arenas' AND policyname = 'Mentors can edit pupil arenas'
    ) THEN
        CREATE POLICY "Mentors can edit pupil arenas" ON public.arenas
        FOR UPDATE
        USING (
            EXISTS (
                SELECT 1 FROM public.relationship_links rl
                WHERE rl.arena_id::uuid = arenas.id::uuid
                  AND rl.mentor_id::uuid = auth.uid()
                  AND rl.ended_at IS NULL
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.relationship_links rl
                WHERE rl.arena_id::uuid = arenas.id::uuid
                  AND rl.mentor_id::uuid = auth.uid()
                  AND rl.ended_at IS NULL
            )
        );
    END IF;
END $$;

-- ==========================================
-- 3. CLAN MEMBERS RLS
-- ==========================================

ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view clan members" ON public.clan_members;
CREATE POLICY "Anyone can view clan members" ON public.clan_members
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join clans" ON public.clan_members;
CREATE POLICY "Users can join clans" ON public.clan_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND role = 'member'
    );

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

DROP POLICY IF EXISTS "Leaders can insert themselves on creation" ON public.clan_members;
CREATE POLICY "Leaders can insert themselves on creation" ON public.clan_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id 
        AND role = 'leader'
    );

DROP POLICY IF EXISTS "Users can leave clans" ON public.clan_members;
CREATE POLICY "Users can leave clans" ON public.clan_members
    FOR DELETE USING (auth.uid() = user_id);

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

-- ==========================================
-- 4. MENTORSHIP PREMIUM TRIGGER
-- ==========================================

create or replace function public.enforce_premium_mentoria_invites()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Only care about mentorship type
  if coalesce(new.link_type, '') <> 'mentoria' then
    return new;
  end if;

  -- The Mentor is the one initiating (sender_id)
  if new.sender_id is null then
    raise exception 'SENDER_ID_REQUIRED';
  end if;

  -- Check if the SENDER has premium/mentor access
  if not public._codex_user_has_mentor_access(new.sender_id) then
    raise exception 'MENTOR_PREMIUM_REQUIRED';
  end if;

  return new;
end;
$$;
