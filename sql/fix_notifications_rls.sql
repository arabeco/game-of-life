-- Policy to allow users to create notifications for their allies (friends)
-- This is necessary for mentorship, partnership and arena challenge invites

DO $$ 
BEGIN
    -- Allow users to INSERT notifications for other users if they are friends
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' AND policyname = 'Users can notify friends'
    ) THEN
        CREATE POLICY "Users can notify friends" ON public.notifications
        FOR INSERT
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.friends f
                WHERE (f.user_id = auth.uid() AND f.friend_id = user_id)
                   OR (f.user_id = user_id AND f.friend_id = auth.uid())
            )
            OR 
            -- Allow system/cron notifications (if any) or if the user is a GM
            (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'sovereign'
        );
    END IF;

    -- Also ensure users can read/delete their own notifications (standard)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' AND policyname = 'Users can view own notifications'
    ) THEN
        CREATE POLICY "Users can view own notifications" ON public.notifications
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' AND policyname = 'Users can update own notifications'
    ) THEN
        CREATE POLICY "Users can update own notifications" ON public.notifications
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' AND policyname = 'Users can delete own notifications'
    ) THEN
        CREATE POLICY "Users can delete own notifications" ON public.notifications
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;
END $$;
