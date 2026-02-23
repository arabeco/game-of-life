
-- 1. REMOVE DUPLICATES (Keeping only the most recent one)
-- This is critical because if duplicates exist, adding the UNIQUE constraint will fail.
DELETE FROM clan_aldeia_presence a USING (
      SELECT min(ctid) as ctid, clan_id, user_id
      FROM clan_aldeia_presence 
      GROUP BY clan_id, user_id HAVING COUNT(*) > 1
      ) b
      WHERE a.clan_id = b.clan_id 
      AND a.user_id = b.user_id 
      AND a.ctid <> b.ctid;

-- 2. ENSURE UNIQUE CONSTRAINT
-- Drop it first to be safe, then re-add it.
ALTER TABLE clan_aldeia_presence DROP CONSTRAINT IF EXISTS unique_user_clan_presence;
ALTER TABLE clan_aldeia_presence ADD CONSTRAINT unique_user_clan_presence UNIQUE (clan_id, user_id);

-- 3. ENSURE RLS PERMISSIONS
-- Make sure the "ALL" policy exists so users can DELETE/UPDATE their own rows.
DROP POLICY IF EXISTS "Users can manage their own presence" ON clan_aldeia_presence;
CREATE POLICY "Users can manage their own presence" ON clan_aldeia_presence FOR ALL USING (
    auth.uid() = user_id
);

-- 4. RECREATE RPC FUNCTION
-- This function uses SECURITY DEFINER to bypass RLS for the atomic operation
CREATE OR REPLACE FUNCTION enter_aldeia_slot(
  p_clan_id UUID,
  p_slot_id TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Atomic Upsert
  INSERT INTO public.clan_aldeia_presence (clan_id, user_id, slot_id, started_at)
  VALUES (p_clan_id, v_user_id, p_slot_id, now())
  ON CONFLICT (clan_id, user_id)
  DO UPDATE SET slot_id = EXCLUDED.slot_id, started_at = EXCLUDED.started_at;
    
  -- Update slot activity
  UPDATE public.clan_aldeia_slots
  SET last_visited_at = now()
  WHERE clan_id = p_clan_id AND slot_id = p_slot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION enter_aldeia_slot(UUID, TEXT) TO authenticated;
