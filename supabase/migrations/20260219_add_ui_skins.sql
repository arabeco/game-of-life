-- Add UI Skin Items to the database
INSERT INTO items (id, name, category, tier, rarity, recycle_value, craft_cost, gold_price, image_url) VALUES
-- T3
('GOLD', 'Tema: Ouro Soberano', 'ui_skin', 3, 'rare', 100, 400, NULL, '⚜️'),
('FROST', 'Tema: Gelo Eterno', 'ui_skin', 3, 'rare', 100, 400, NULL, '❄️'),
-- T4
('EMBER', 'Tema: Chama Viva', 'ui_skin', 4, 'epic', 300, 1200, NULL, '🔥'),
('CYBER', 'Tema: Cyberpunk', 'ui_skin', 4, 'epic', 300, 1200, NULL, '🦾'),
('AURORA', 'Tema: Aurora Boreal', 'ui_skin', 4, 'epic', 300, 1200, NULL, '🌌'),
-- T5
('VOID', 'Tema: Vazio Primordial', 'ui_skin', 5, 'legendary', 1000, 4000, NULL, '🔮')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    tier = EXCLUDED.tier,
    rarity = EXCLUDED.rarity,
    image_url = EXCLUDED.image_url;

-- Grant these items to all Admin users
DO $$
DECLARE
    r_user RECORD;
    r_item RECORD;
BEGIN
    FOR r_user IN SELECT id FROM user_profiles WHERE role = 'admin' LOOP
        FOR r_item IN SELECT id FROM items WHERE category = 'ui_skin' LOOP
            INSERT INTO user_inventory (user_id, item_id)
            SELECT r_user.id, r_item.id
            WHERE NOT EXISTS (
                SELECT 1 FROM user_inventory WHERE user_id = r_user.id AND item_id = r_item.id
            );
        END LOOP;
    END LOOP;
END $$;
