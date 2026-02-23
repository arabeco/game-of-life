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

-- Ensure RLS is enabled for storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- POLICY 1: Public Read Access
-- Allows anyone to view/download files from the 'videos' bucket
DROP POLICY IF EXISTS "Public Videos Access" ON storage.objects;
CREATE POLICY "Public Videos Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );

-- POLICY 2: Authenticated Upload Access
-- Allows any logged-in user to upload files to the 'videos' bucket
DROP POLICY IF EXISTS "Authenticated Upload Videos" ON storage.objects;
CREATE POLICY "Authenticated Upload Videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'videos' );

-- POLICY 3: Owner Management (Update/Delete)
-- Allows users to update or delete files they uploaded
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
