-- Update all slots for a specific clan to 100% health
-- Replace 'YOUR_CLAN_ID_HERE' with the actual Clan UUID
UPDATE public.clan_aldeia_slots
SET health = 100
WHERE clan_id = 'YOUR_CLAN_ID_HERE';

-- Alternatively, to update ALL clans (use with caution):
-- UPDATE public.clan_aldeia_slots SET health = 100;
