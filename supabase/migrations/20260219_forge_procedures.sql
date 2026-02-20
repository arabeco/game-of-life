-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL, -- 'skin', 'hair', 'border', 'glyph', 'aura'
  tier INT CHECK (tier BETWEEN 1 AND 5),
  rarity VARCHAR(20) NOT NULL, -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
  is_season_exclusive BOOLEAN DEFAULT FALSE,
  is_gold_exclusive BOOLEAN DEFAULT FALSE,
  recycle_value INT NOT NULL,
  craft_cost INT NOT NULL,
  gold_price INT DEFAULT NULL,
  image_url VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_items_category_tier ON items (category, tier);
CREATE INDEX IF NOT EXISTS idx_items_season ON items (is_season_exclusive);

-- Populate items
INSERT INTO items (id, name, category, tier, rarity, recycle_value, craft_cost, gold_price, image_url) VALUES
-- Skins T1 (Comum) - Recycle: 10, Craft: 40
('item_skin_1_001', 'Náufrago', 'skin', 1, 'common', 10, 40, NULL, '🏝️'),
('item_skin_1_002', 'Casual', 'skin', 1, 'common', 10, 40, NULL, '👕'),
('item_skin_1_003', 'Gym Rat', 'skin', 1, 'common', 10, 40, NULL, '💪'),
('item_skin_1_004', 'Street', 'skin', 1, 'common', 10, 40, NULL, '🛹'),
-- Skins T2 (Incomum) - Recycle: 30, Craft: 120
('item_skin_2_001', 'Executivo', 'skin', 2, 'uncommon', 30, 120, NULL, '💼'),
('item_skin_2_002', 'Tático', 'skin', 2, 'uncommon', 30, 120, NULL, '🕶️'),
('item_skin_2_003', 'Acadêmico', 'skin', 2, 'uncommon', 30, 120, NULL, '🎓'),
-- Skins T3 (Raro) - Recycle: 100, Craft: 400
('item_skin_3_001', 'Nômade', 'skin', 3, 'rare', 100, 400, NULL, '🐪'),
('item_skin_3_002', 'Alquimista', 'skin', 3, 'rare', 100, 400, NULL, '⚗️'),
('item_skin_3_003', 'Híbrido', 'skin', 3, 'rare', 100, 400, NULL, '🤖'),
-- Skins T4 (Épico) - Recycle: 300, Craft: 1200
('item_skin_4_001', 'Armadura Placa', 'skin', 4, 'epic', 300, 1200, NULL, '🛡️'),
('item_skin_4_002', 'Mago Círculo', 'skin', 4, 'epic', 300, 1200, NULL, '🧙‍♂️'),
-- Skins T5 (Lendário) - Recycle: 1000, Craft: 4000
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

-- Create Procedures
-- 1. Recycle Item
CREATE OR REPLACE FUNCTION recycle_item(
  p_item_instance_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_item_id TEXT;
  v_fragments INT;
  v_item_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  -- Get item info and verify ownership
  SELECT i.id, i.recycle_value, i.name
  INTO v_item_id, v_fragments, v_item_name
  FROM user_inventory u
  JOIN items i ON u.item_id = i.id
  WHERE u.id = p_item_instance_id AND u.user_id = v_user_id;
  
  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'Item not found or not owned by user';
  END IF;

  -- Delete from inventory
  DELETE FROM user_inventory WHERE id = p_item_instance_id;
  
  -- Update fragments
  UPDATE user_profiles
  SET fragments = COALESCE(fragments, 0) + v_fragments
  WHERE id = v_user_id;
  
  -- Log transaction
  INSERT INTO transactions (user_id, type, currency, amount, description)
  VALUES (v_user_id, 'recycle', 'fragments', v_fragments, 'Recycled ' || v_item_name);
  
  RETURN jsonb_build_object('success', true, 'fragments_gained', v_fragments);
END;
$$;

-- 2. Craft Item
CREATE OR REPLACE FUNCTION craft_item(
  p_tier INT,
  p_category TEXT DEFAULT NULL,
  p_exact_item_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_cost INT;
  v_target_item_id TEXT;
  v_fragments_owned INT;
  v_item_name TEXT;
  v_new_instance_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Determine cost
  CASE p_tier
    WHEN 1 THEN v_cost := 40;
    WHEN 2 THEN v_cost := 120;
    WHEN 3 THEN v_cost := 400;
    WHEN 4 THEN v_cost := 1200;
    WHEN 5 THEN v_cost := 4000;
    ELSE RAISE EXCEPTION 'Invalid tier';
  END CASE;
  
  -- Check funds
  SELECT fragments INTO v_fragments_owned FROM user_profiles WHERE id = v_user_id;
  IF v_fragments_owned < v_cost THEN
    RAISE EXCEPTION 'Insufficient fragments';
  END IF;
  
  -- Determine item
  IF p_tier <= 3 THEN
    IF p_exact_item_id IS NULL THEN
      RAISE EXCEPTION 'Exact item ID required for T1-T3';
    END IF;
    v_target_item_id := p_exact_item_id;
  ELSE
    IF p_category IS NULL THEN
      RAISE EXCEPTION 'Category required for T4-T5';
    END IF;
    -- Select random item
    SELECT id INTO v_target_item_id
    FROM items
    WHERE tier = p_tier 
      AND category = p_category 
      AND (is_gold_exclusive = FALSE OR is_gold_exclusive IS NULL)
    ORDER BY random()
    LIMIT 1;
    
    IF v_target_item_id IS NULL THEN
      RAISE EXCEPTION 'No items found for this category/tier';
    END IF;
  END IF;

  -- Get item name
  SELECT name INTO v_item_name FROM items WHERE id = v_target_item_id;

  -- Deduct fragments
  UPDATE user_profiles
  SET fragments = fragments - v_cost
  WHERE id = v_user_id;
  
  -- Add to inventory
  INSERT INTO user_inventory (user_id, item_id)
  VALUES (v_user_id, v_target_item_id)
  RETURNING id INTO v_new_instance_id;
  
  -- Log transaction
  INSERT INTO transactions (user_id, type, currency, amount, description)
  VALUES (v_user_id, 'craft', 'fragments', -v_cost, 'Crafted ' || v_item_name);
  
  RETURN jsonb_build_object(
    'success', true, 
    'item_id', v_target_item_id, 
    'instance_id', v_new_instance_id,
    'name', v_item_name
  );
END;
$$;

-- 3. Buy Gold Pack
CREATE OR REPLACE FUNCTION buy_gold_pack(
  p_pack_id TEXT,
  p_amount_gold INT,
  p_cost_brl NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- In a real app, we would verify payment here or via webhook
  -- For this demo, we trust the client (mock purchase)
  
  UPDATE user_profiles
  SET gold = COALESCE(gold, 0) + p_amount_gold
  WHERE id = v_user_id;
  
  INSERT INTO transactions (user_id, type, currency, amount, description)
  VALUES (v_user_id, 'purchase', 'gold', p_amount_gold, 'Bought pack ' || p_pack_id);
  
  RETURN jsonb_build_object('success', true, 'new_gold', (SELECT gold FROM user_profiles WHERE id = v_user_id));
END;
$$;

-- 4. Buy Store Item (Gold)
CREATE OR REPLACE FUNCTION buy_store_item(
  p_item_id TEXT,
  p_cost_gold INT,
  p_type TEXT -- 'premium', 'codex', 'exclusive', 'boost'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_gold_owned INT;
  v_item_name TEXT;
BEGIN
  v_user_id := auth.uid();
  
  SELECT gold INTO v_gold_owned FROM user_profiles WHERE id = v_user_id;
  
  IF v_gold_owned < p_cost_gold THEN
    RAISE EXCEPTION 'Insufficient gold';
  END IF;
  
  -- Deduct Gold
  UPDATE user_profiles
  SET gold = gold - p_cost_gold
  WHERE id = v_user_id;
  
  -- Handle Logic based on type
  IF p_type = 'exclusive' THEN
    SELECT name INTO v_item_name FROM items WHERE id = p_item_id;
    INSERT INTO user_inventory (user_id, item_id) VALUES (v_user_id, p_item_id);
  ELSIF p_type = 'premium' THEN
    v_item_name := 'Premium Membership';
    UPDATE user_profiles SET is_premium = TRUE WHERE id = v_user_id; -- Assuming is_premium column exists or using JSONB
  ELSE
    v_item_name := p_item_id;
    -- Handle other types (codex, boost) logic here or rely on client to update specific fields if not normalized
    -- ideally we should have tables for active_boosts, unlocked_codexes etc.
    -- For now, we assume simple transaction logging + return success
  END IF;
  
  INSERT INTO transactions (user_id, type, currency, amount, description)
  VALUES (v_user_id, 'spend', 'gold', -p_cost_gold, 'Bought ' || v_item_name);
  
  RETURN jsonb_build_object('success', true);
END;
$$;
