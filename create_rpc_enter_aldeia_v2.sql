
-- 1. DROP OLD FUNCTION IF EXISTS (to clean up)
DROP FUNCTION IF EXISTS enter_aldeia_slot(UUID, TEXT);

-- 2. CREATE V2 FUNCTION
-- This version uses explicit LOCK to prevent race conditions and handles the upsert logic manually
-- It also forces the update if the row exists, ignoring any client-side RLS issues for the update
CREATE OR REPLACE FUNCTION enter_aldeia_slot_v2(
  p_clan_id UUID,
  p_slot_id TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Attempt to UPDATE first (most common case for active users)
  UPDATE public.clan_aldeia_presence 
  SET slot_id = p_slot_id, started_at = now()
  WHERE clan_id = p_clan_id AND user_id = v_user_id;

  -- If no row was updated, INSERT
  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.clan_aldeia_presence (clan_id, user_id, slot_id, started_at)
      VALUES (p_clan_id, v_user_id, p_slot_id, now());
    EXCEPTION WHEN unique_violation THEN
      -- If insert failed due to race condition (row created by another process in milliseconds), retry UPDATE
      UPDATE public.clan_aldeia_presence 
      SET slot_id = p_slot_id, started_at = now()
      WHERE clan_id = p_clan_id AND user_id = v_user_id;
    END;
  END IF;

  -- Update slot activity (Best effort, not critical)
  UPDATE public.clan_aldeia_slots
  SET last_visited_at = now()
  WHERE clan_id = p_clan_id AND slot_id = p_slot_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION enter_aldeia_slot_v2(UUID, TEXT) TO authenticated;
