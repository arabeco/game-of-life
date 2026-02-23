-- Create a new public bucket named 'videos' that allows video files
-- This bucket is configured to accept MP4, WebM, MOV and common image formats
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'videos', 
  'videos', 
  true, 
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/png', 'image/jpeg', 'image/webp'],
  52428800 -- 50MB limit (adjust as needed)
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/png', 'image/jpeg', 'image/webp'];

-- Attempt to create policies (this might fail if you are not a superuser, 
-- in which case you should use the Supabase Storage UI)

DO $$
BEGIN
    -- Only try to create policies if we have permission (ignoring errors usually requires manual handling)
    -- But since we are in SQL editor, let's try standard creation without ALTER TABLE
    
    -- POLICY 1: Public Read Access
    DROP POLICY IF EXISTS "Public Videos Access" ON storage.objects;
    CREATE POLICY "Public Videos Access"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'videos' );

    -- POLICY 2: Authenticated Upload Access
    DROP POLICY IF EXISTS "Authenticated Upload Videos" ON storage.objects;
    CREATE POLICY "Authenticated Upload Videos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK ( bucket_id = 'videos' );

    -- POLICY 3: Owner Management (Update/Delete)
    DROP POLICY IF EXISTS "Users Update Own Videos" ON storage.objects;
    CREATE POLICY "Users Update Own Videos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING ( bucket_id = 'videos' AND auth.uid() = owner );

    DROP POLICY IF EXISTS "Users Delete Own Videos" ON storage.objects;
    CREATE POLICY "Users Delete Own Videos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING ( bucket_id = 'videos' AND auth.uid() = owner );

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create policies automatically: %', SQLERRM;
    RAISE NOTICE 'Please create the "videos" bucket and policies manually in the Supabase Storage UI.';
END $$;
