-- 1. Remove duplicates, keeping the most recent one per user per clan
DELETE FROM clan_aldeia_presence
WHERE id NOT IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, clan_id ORDER BY started_at DESC) as rnum
        FROM clan_aldeia_presence
    ) t
    WHERE t.rnum = 1
);

-- 2. Add Unique Constraint to prevent future duplicates
ALTER TABLE clan_aldeia_presence 
ADD CONSTRAINT unique_user_clan_presence UNIQUE (clan_id, user_id);
