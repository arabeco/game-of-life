-- Add app_mode and theme_preference to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS app_mode TEXT DEFAULT 'GAME',
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'DARK';

-- Update existing profiles to have defaults if null
UPDATE public.user_profiles SET app_mode = 'GAME' WHERE app_mode IS NULL;
UPDATE public.user_profiles SET theme_preference = 'DARK' WHERE theme_preference IS NULL;
