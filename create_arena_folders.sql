
-- Create table for Arena Folders
CREATE TABLE IF NOT EXISTS public.arena_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📁',
    asset_id TEXT, -- Optional: link folder to an asset context
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.arena_folders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own arena folders" ON public.arena_folders
    FOR ALL USING (auth.uid() = user_id);

-- Add folder_id to arenas
ALTER TABLE public.arenas 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.arena_folders(id) ON DELETE SET NULL;
