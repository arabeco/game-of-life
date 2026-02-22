-- Fix visibility of asset_slots for public profiles
-- This allows any authenticated user to view asset_slots
-- ONLY IF the slot_id is listed in the user's visible_widgets array.

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own asset slots" ON public.asset_slots;

-- Create new secure policy
CREATE POLICY "Public can view visible asset slots"
ON public.asset_slots FOR SELECT
USING (
  -- User can see their own slots
  auth.uid() = user_id
  OR
  -- Anyone can see slots that are listed in the user's visible_widgets
  EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = asset_slots.user_id
    AND asset_slots.slot_id = ANY(up.visible_widgets)
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.asset_slots ENABLE ROW LEVEL SECURITY;
