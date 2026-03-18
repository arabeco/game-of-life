-- Policy to allow Mentors to update their pupil's arenas
-- We check relationship_links to see if the current user is a mentor for the arena's original owner
-- Note: 'arenas' usually has 'user_id' for the owner (pupil).

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
