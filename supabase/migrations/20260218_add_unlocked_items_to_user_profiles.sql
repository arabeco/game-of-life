-- Add unlocked_items column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS unlocked_items JSONB DEFAULT '{}'::jsonb;

-- Add unlocked_skins column to user_profiles table (if not exists)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS unlocked_skins JSONB DEFAULT '{}'::jsonb;

-- Add completed_season_missions column if not exists (handling array of strings)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS completed_season_missions TEXT[] DEFAULT '{}';

-- Add chests column if not exists
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS chests JSONB DEFAULT '[]'::jsonb;

-- Create an index for better performance when querying JSONB columns
CREATE INDEX IF NOT EXISTS idx_user_profiles_unlocked_items ON public.user_profiles USING gin (unlocked_items);
CREATE INDEX IF NOT EXISTS idx_user_profiles_unlocked_skins ON public.user_profiles USING gin (unlocked_skins);
