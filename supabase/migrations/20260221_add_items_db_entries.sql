-- Add new Banners and Borders to items table

INSERT INTO items (id, name, category, tier, rarity, recycle_value, craft_cost, gold_price, image_url) VALUES
-- BORDERS
-- T1
('item_border_t1_aprendiz', 'Aprendiz', 'border', 1, 'common', 10, 40, NULL, '🎓'),
-- T2
('item_border_t2_veterano', 'Veterano', 'border', 2, 'uncommon', 30, 120, NULL, '🎖️'),
-- T3
('item_border_t3_mistico', 'Místico', 'border', 3, 'rare', 100, 400, NULL, '🔮'),
('item_border_t3_transcendente', 'Transcendente', 'border', 3, 'rare', 100, 400, NULL, '✨'),
-- T4
('item_border_t4_celestial', 'Celestial', 'border', 4, 'epic', 300, 1200, NULL, '👼'),
('item_border_t4_guardia', 'Guardiã', 'border', 4, 'epic', 300, 1200, NULL, '🛡️'),
('item_border_t4_oraculo', 'Oráculo', 'border', 4, 'epic', 300, 1200, NULL, '👁️'),
-- T5
('item_border_t5_genesis', 'Gênesis', 'border', 5, 'legendary', 1000, 4000, NULL, '🌋'),

-- BANNERS (New Category 'banner')
-- T1
('item_banner_disciplinado', 'Disciplinado', 'banner', 1, 'common', 10, 40, NULL, '📏'),
('item_banner_t1_aprendiz', 'Aprendiz', 'banner', 1, 'common', 10, 40, NULL, '🎓'),
-- T2
('item_banner_popular', 'Popular', 'banner', 2, 'uncommon', 30, 120, NULL, '🌟'),
('item_banner_t2_veterano', 'Veterano', 'banner', 2, 'uncommon', 30, 120, NULL, '🎖️'),
-- T3
('item_banner_imparavel', 'Imparável', 'banner', 3, 'rare', 100, 400, NULL, '🚀'),
('item_banner_t3_mistico', 'Místico', 'banner', 3, 'rare', 100, 400, NULL, '🔮'),
-- T4
('item_banner_lendaviva', 'Lenda Viva', 'banner', 4, 'epic', 300, 1200, NULL, '🦁'),
('item_banner_t4_celestial', 'Celestial', 'banner', 4, 'epic', 300, 1200, NULL, '👼'),
('item_banner_t4_guardia', 'Guardiã', 'banner', 4, 'epic', 300, 1200, NULL, '🛡️'),
('item_banner_t4_oraculo', 'Oráculo', 'banner', 4, 'epic', 300, 1200, NULL, '👁️'),
('item_banner_t4_transcendente', 'Transcendente', 'banner', 4, 'epic', 300, 1200, NULL, '✨'),
-- T5
('item_banner_gm', 'Grão Mestre', 'banner', 5, 'legendary', 1000, 4000, NULL, '🐲'),
('item_banner_t5_genesis', 'Gênesis', 'banner', 5, 'legendary', 1000, 4000, NULL, '🌋')

ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    tier = EXCLUDED.tier,
    rarity = EXCLUDED.rarity,
    recycle_value = EXCLUDED.recycle_value,
    craft_cost = EXCLUDED.craft_cost,
    image_url = EXCLUDED.image_url;
