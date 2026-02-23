-- Policies for the 'videos' bucket
-- We assume the bucket 'videos' already exists (Steps 1-4 completed)

-- 1. Allow Public Read Access (Everyone can view videos)
CREATE POLICY "Public Videos Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );

-- 2. Allow Authenticated Uploads (Logged in users can upload)
CREATE POLICY "Authenticated Upload Videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'videos' );

-- 3. Allow Users to Update their own videos
CREATE POLICY "Users Update Own Videos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'videos' AND auth.uid() = owner );

-- 4. Allow Users to Delete their own videos
CREATE POLICY "Users Delete Own Videos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'videos' AND auth.uid() = owner );
