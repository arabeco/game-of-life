-- 1. Ensure Items Table is Populated
INSERT INTO items (id, name, category, tier, rarity, recycle_value, craft_cost, gold_price, image_url) VALUES
-- Skins T1
('item_skin_1_001', 'Náufrago', 'skin', 1, 'common', 10, 40, NULL, '🏝️'),
('item_skin_1_002', 'Casual', 'skin', 1, 'common', 10, 40, NULL, '👕'),
('item_skin_1_003', 'Gym Rat', 'skin', 1, 'common', 10, 40, NULL, '💪'),
('item_skin_1_004', 'Street', 'skin', 1, 'common', 10, 40, NULL, '🛹'),
-- Skins T2
('item_skin_2_001', 'Executivo', 'skin', 2, 'uncommon', 30, 120, NULL, '💼'),
('item_skin_2_002', 'Tático', 'skin', 2, 'uncommon', 30, 120, NULL, '🕶️'),
('item_skin_2_003', 'Acadêmico', 'skin', 2, 'uncommon', 30, 120, NULL, '🎓'),
-- Skins T3
('item_skin_3_001', 'Nômade', 'skin', 3, 'rare', 100, 400, NULL, '🐪'),
('item_skin_3_002', 'Alquimista', 'skin', 3, 'rare', 100, 400, NULL, '⚗️'),
('item_skin_3_003', 'Híbrido', 'skin', 3, 'rare', 100, 400, NULL, '🤖'),
-- Skins T4
('item_skin_4_001', 'Armadura Placa', 'skin', 4, 'epic', 300, 1200, NULL, '🛡️'),
('item_skin_4_002', 'Mago Círculo', 'skin', 4, 'epic', 300, 1200, NULL, '🧙‍♂️'),
-- Skins T5
('item_skin_5_001', 'Entidade de Luz', 'skin', 5, 'legendary', 1000, 4000, NULL, '✨'),
-- Skins Season
('item_skin_season_001', 'O Criador', 'skin', 4, 'epic', 300, 1200, NULL, '🎨'),

-- Hair T1
('item_hair_1_001', 'Recruta', 'hair', 1, 'common', 10, 40, NULL, '💇'),
('item_hair_1_002', 'Cachos', 'hair', 1, 'common', 10, 40, NULL, '➰'),
('item_hair_1_003', 'Mullet', 'hair', 1, 'common', 10, 40, NULL, '🎸'),
('item_hair_1_004', 'Rabo de Cavalo', 'hair', 1, 'common', 10, 40, NULL, '👱‍♀️'),
-- Hair T2
('item_hair_2_001', 'Dreads', 'hair', 2, 'uncommon', 30, 120, NULL, '🧶'),
('item_hair_2_002', 'Coque', 'hair', 2, 'uncommon', 30, 120, NULL, '🥯'),
('item_hair_2_003', 'Curto Fem', 'hair', 2, 'uncommon', 30, 120, NULL, '👩'),
-- Hair T3
('item_hair_3_001', 'Princesa', 'hair', 3, 'rare', 100, 400, NULL, '👸'),
('item_hair_3_002', 'Goku', 'hair', 3, 'rare', 100, 400, NULL, '🔥'),
-- Hair T4
('item_hair_4_001', 'Fluxo Espiritual Anime', 'hair', 4, 'epic', 300, 1200, NULL, '🌬️'),

-- Border T1
('item_border_1_001', 'Pupilo (Beta)', 'border', 1, 'common', 10, 40, NULL, '🔰'),
('item_border_1_002', 'Disciplinado', 'border', 1, 'common', 10, 40, NULL, '📏'),
('item_border_1_003', 'Vanguardista', 'border', 1, 'common', 10, 40, NULL, '🚩'),
('item_border_1_004', 'Rústico', 'border', 1, 'common', 10, 40, NULL, '🪵'),
-- Border T2
('item_border_2_001', 'Popular', 'border', 2, 'uncommon', 30, 120, NULL, '🌟'),
('item_border_2_002', 'Protetor', 'border', 2, 'uncommon', 30, 120, NULL, '🛡️'),
-- Border T3
('item_border_3_001', 'Imparável', 'border', 3, 'rare', 100, 400, NULL, '🚀'),
('item_border_3_002', 'Arquétipo', 'border', 3, 'rare', 100, 400, NULL, '🎭'),
-- Border T4
('item_border_4_001', 'Lenda Viva', 'border', 4, 'epic', 300, 1200, NULL, '🦁'),
('item_border_4_002', 'Soberano', 'border', 4, 'epic', 300, 1200, NULL, '👑'),
-- Border T5
('item_border_5_001', 'GM - Grande Mestre', 'border', 5, 'legendary', 1000, 4000, NULL, '🐲'),

-- Glyph T1
('item_glyph_1_001', 'Tábua Aprendiz', 'glyph', 1, 'common', 10, 40, NULL, '🪵'),
('item_glyph_1_002', 'Manuscrito', 'glyph', 1, 'common', 10, 40, NULL, '📜'),
('item_glyph_1_003', 'Lajota', 'glyph', 1, 'common', 10, 40, NULL, '🧱'),
-- Glyph T2
('item_glyph_2_001', 'Totem Obelisco', 'glyph', 2, 'uncommon', 30, 120, NULL, '🗿'),
('item_glyph_2_002', 'Granito Rúnico', 'glyph', 2, 'uncommon', 30, 120, NULL, '🪨'),
-- Glyph T3
('item_glyph_3_001', 'Monólito Aço', 'glyph', 3, 'rare', 100, 400, NULL, '🔩'),
-- Glyph T5
('item_glyph_5_001', 'A FORJA - Losango 3D', 'glyph', 5, 'legendary', 1000, 4000, NULL, '💠'),

-- Aura T1
('item_aura_1_001', 'Bruma', 'aura', 1, 'common', 10, 40, NULL, '🌫️'),
('item_aura_1_002', 'Safira', 'aura', 1, 'common', 10, 40, NULL, '🔹'),
('item_aura_1_003', 'Rubi', 'aura', 1, 'common', 10, 40, NULL, '🔻'),
-- Aura T2
('item_aura_2_001', 'Esmeralda', 'aura', 2, 'uncommon', 30, 120, NULL, '❇️'),
('item_aura_2_002', 'Prata', 'aura', 2, 'uncommon', 30, 120, NULL, '⚪'),
-- Aura T3
('item_aura_3_001', 'Ouro', 'aura', 3, 'rare', 100, 400, NULL, '🟡'),
-- Aura T5
('item_aura_5_001', 'Pedra da Lua', 'aura', 5, 'legendary', 1000, 4000, NULL, '🌙'),
('item_aura_5_002', 'Multiverso', 'aura', 5, 'legendary', 1000, 4000, NULL, '🌌'),

-- Exclusives
('item_skin_exclusive_001', 'Empreendedor', 'skin', 4, 'epic', 300, 1200, 500, '💼'),
('item_aura_exclusive_001', 'Fênix Dourada', 'aura', 5, 'legendary', 1000, 4000, 800, '🐦'),
('item_border_exclusive_001', 'Fundador', 'border', 4, 'epic', 300, 1200, 400, '🏛️')

ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    tier = EXCLUDED.tier,
    rarity = EXCLUDED.rarity,
    image_url = EXCLUDED.image_url,
    gold_price = EXCLUDED.gold_price;


-- 2. Grant Tier 1 (Common) items to ALL users (Starter Pack)
-- This ensures no one has an empty inventory
DO $$
DECLARE
    r_user RECORD;
    r_item RECORD;
BEGIN
    FOR r_user IN SELECT id FROM public.user_profiles LOOP
        -- For each T1 item
        FOR r_item IN SELECT id FROM items WHERE tier = 1 LOOP
            -- Insert if not exists
            INSERT INTO user_inventory (user_id, item_id)
            SELECT r_user.id, r_item.id
            WHERE NOT EXISTS (
                SELECT 1 FROM user_inventory WHERE user_id = r_user.id AND item_id = r_item.id
            );
        END LOOP;
    END LOOP;
END $$;


-- 3. Migrate Legacy Unlocks (from user_profiles.unlocked_skins JSONB)
-- Assuming structure is { "SKIN_ID": true }
DO $$
DECLARE
    r_user RECORD;
    skin_key TEXT;
BEGIN
    FOR r_user IN SELECT id, unlocked_skins FROM user_profiles WHERE unlocked_skins IS NOT NULL LOOP
        FOR skin_key IN SELECT jsonb_object_keys(r_user.unlocked_skins) LOOP
            -- Check if skin_key exists in items table
            IF EXISTS (SELECT 1 FROM items WHERE id = skin_key) THEN
                INSERT INTO user_inventory (user_id, item_id)
                SELECT r_user.id, skin_key
                WHERE NOT EXISTS (
                    SELECT 1 FROM user_inventory WHERE user_id = r_user.id AND item_id = skin_key
                );
            END IF;
            
            -- Legacy Mapping for 'GOLD'
            IF skin_key = 'GOLD' THEN
                -- Grant Entidade de Luz (T5)
                INSERT INTO user_inventory (user_id, item_id)
                SELECT r_user.id, 'item_skin_5_001'
                WHERE NOT EXISTS (
                    SELECT 1 FROM user_inventory WHERE user_id = r_user.id AND item_id = 'item_skin_5_001'
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;


-- 4. Set Admin Role for "Soberano" or "GM" users
UPDATE user_profiles
SET role = 'admin'
WHERE nickname IN ('Soberano', 'GM', 'Admin') OR role = 'admin';
