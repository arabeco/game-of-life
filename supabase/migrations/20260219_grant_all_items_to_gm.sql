-- Grant ALL items to Admins/GMs (Fix GM items bug)
DO $$
DECLARE
    r_admin RECORD;
    r_item RECORD;
BEGIN
    -- Iterate over all users with admin or gm role
    FOR r_admin IN SELECT id FROM public.user_profiles WHERE role IN ('admin', 'gm') LOOP
        -- Iterate over all items in the items table
        FOR r_item IN SELECT id FROM public.items LOOP
            -- Insert into inventory if not exists
            IF NOT EXISTS (
                SELECT 1 FROM public.user_inventory 
                WHERE user_id = r_admin.id AND item_id = r_item.id
            ) THEN
                INSERT INTO public.user_inventory (user_id, item_id)
                VALUES (r_admin.id, r_item.id);
            END IF;
        END LOOP;
    END LOOP;
END $$;
