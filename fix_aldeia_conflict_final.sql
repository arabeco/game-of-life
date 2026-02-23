-- The issue is likely that the `id` column is the PRIMARY KEY, and upsert without specifying `id` 
-- tries to insert a new row with a new random UUID.
-- However, the UNIQUE constraint (clan_id, user_id) blocks this insertion because the user is already there.
-- AND, because `id` is not in the conflict target (only clan_id, user_id are), Supabase/Postgres might be confused 
-- or the client library is defaulting to `id` as the conflict target if not explicit enough for some versions.

-- BUT, the error 409 usually means the client sent a POST (Insert) instead of a PATCH/PUT (Update) or the ON CONFLICT clause wasn't processed correctly by the API.

-- Let's try to fix the constraint definition to be absolutely sure it's usable for UPSERT.

-- 1. Drop existing constraint if any
ALTER TABLE clan_aldeia_presence DROP CONSTRAINT IF EXISTS unique_user_clan_presence;

-- 2. Re-create it explicitly
ALTER TABLE clan_aldeia_presence ADD CONSTRAINT unique_user_clan_presence UNIQUE (clan_id, user_id);

-- 3. CRITICAL: Ensure RLS policies allow UPDATE on this table based on the same condition
DROP POLICY IF EXISTS "Users can manage their own presence" ON clan_aldeia_presence;
CREATE POLICY "Users can manage their own presence" ON clan_aldeia_presence FOR ALL USING (
    auth.uid() = user_id
) WITH CHECK (
    auth.uid() = user_id
);
