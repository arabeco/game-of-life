
-- Enable RLS for storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow public read access to the bucket 'user-images'
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'user-images' );

-- Policy to allow authenticated users to upload to 'user-images'
-- This policy allows users to upload files to a folder named with their user ID
-- or simply anywhere in the bucket if we want to be less restrictive for now.
-- Given the issues, let's be permissive for authenticated users uploading to this bucket.
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'user-images' );

-- Policy to allow users to update/delete their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'user-images' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'user-images' AND auth.uid() = owner );

-- Ensure user_profiles policies allow updating avatar_url
-- This assumes there's already a policy for users to update their own profile.
-- If not, or if it's too restrictive, we add one.

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- If the bucket doesn't exist, we should create it (this usually requires dashboard access or a function)
-- But we can try to insert it into storage.buckets if we have permissions (often postgres role doesn't, but let's try)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-images', 'user-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
