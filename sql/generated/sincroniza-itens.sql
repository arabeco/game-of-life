-- Sincroniza public.items com constants/items.ts
--
-- Gerado por scripts/build-items-sync.mjs em 20/09/2026, 20:05, commit 607674c.
-- 125 itens. Nao edite a mao: a proxima geracao apaga.
--
-- O codigo manda em: nome, categoria, tier, raridade, arte, preco e as flags de
-- porta. O banco continua mandando em recycle_value, craft_cost e description —
-- o codigo nao conhece esses tres, e escrever null por cima seria apagar.
--
-- Roda inteiro. E uma transacao: ou passa tudo, ou nada muda.

begin;

-- Item que ja existe e corrigido; item que o codigo criou e inserido.
--
-- A diferenca entre os dois esta no do update: ele NAO repete recycle_value,
-- craft_cost, description e is_live_in_game. Esses quatro so valem na inclusao.
-- Num item que ja esta no banco eles podem ter sido mexidos a mao, e o codigo
-- nao tem como saber disso — reescrever seria apagar no escuro. E is_live_in_game
-- fica de fora por um motivo proprio: item desligado pode ter sido desligado de
-- proposito, e o sync nao religa nada.
insert into public.items (
  id, name, category, tier, rarity, image_url, gold_price,
  is_rank_exclusive, is_gold_exclusive, is_season_exclusive,
  is_premium_only, is_chest_exclusive, is_legacy_retired,
  season_key, season_slot, recycle_value, craft_cost, is_live_in_game
)
values
  ('garden_base_path', 'Jardim: Caminho antigo', 'garden', 2, 'uncommon', '/garden3d/catalog/garden_base_path.svg', 45, false, false, false, false, false, false, null, null, 30, 120, true),
  ('garden_base_pond', 'Jardim: Espelho do bosque', 'garden', 3, 'rare', '/garden3d/catalog/garden_base_pond.svg', 110, false, false, false, false, false, false, null, null, 100, 400, true),
  ('garden_kit_luxury', 'Kit Jardim: Pátio dourado', 'garden', 4, 'epic', '/garden3d/catalog/garden_kit_luxury.svg', 210, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('garden_base_river', 'Jardim: Margens do refúgio', 'garden', 4, 'epic', '/garden3d/catalog/garden_base_river.svg', 260, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('garden_kit_genesis', 'Kit Jardim: Gênesis', 'garden', 5, 'legendary', '/garden3d/catalog/garden_kit_genesis.svg', 480, false, false, false, false, false, false, null, null, 1000, 4000, true),
  ('item_skin_1_001', 'Náufrago', 'skin', 1, 'common', '/assets/catalog/avatars/SKIN_T1_NAUFRAGO.png', null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_skin_1_002', 'Casual', 'skin', 1, 'common', '/assets/catalog/avatars/SKIN_T1_CASUAL.png', null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_skin_1_003', 'Gym Rat', 'skin', 1, 'common', '/assets/catalog/avatars/SKIN_T1_GYM_RAT.png', 15, false, false, false, false, false, false, null, null, 10, 40, true),
  ('item_skin_1_004', 'Street', 'skin', 1, 'common', '/assets/catalog/avatars/SKIN_T1_STREET.png', null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_skin_1_005', 'Caçador', 'skin', 1, 'common', '/assets/catalog/avatars/SKIN_T1_CACADOR.png', null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_skin_1_006', 'Casual 2', 'skin', 1, 'common', '/assets/catalog/avatars/SKIN_T1_CASUAL_2.png', null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_skin_2_001', 'Executivo', 'skin', 2, 'uncommon', '/assets/catalog/avatars/SKIN_T2_EXECUTIVO.png', null, true, false, false, false, false, false, null, null, 30, 120, true),
  ('item_skin_2_002', 'Tático', 'skin', 2, 'uncommon', '/assets/catalog/avatars/SKIN_T2_TATICO.png', null, true, false, false, false, false, false, null, null, 30, 120, true),
  ('item_skin_2_003', 'Acadêmico', 'skin', 2, 'uncommon', '/assets/catalog/avatars/SKIN_T2_ACADEMICO.png', 35, true, false, false, false, false, false, null, null, 30, 120, true),
  ('item_skin_3_001', 'Nômade', 'skin', 3, 'rare', '/assets/catalog/avatars/SKIN_T3_NOMADE.png', 70, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_skin_3_002', 'Alquimista', 'skin', 3, 'rare', '/assets/catalog/avatars/SKIN_T3_ALQUIMISTA.png', 85, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_skin_3_003', 'Híbrido', 'skin', 3, 'rare', '/assets/catalog/avatars/SKIN_T3_HIBRIDO.png', 95, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_skin_4_001', 'Armadura Placa', 'skin', 4, 'epic', '/assets/catalog/avatars/SKIN_T4_ARMADURA_PLACA.png', 190, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_skin_4_002', 'Mago Círculo', 'skin', 4, 'epic', '/assets/catalog/avatars/SKIN_T4_MAGO_CIRCULO.png', null, true, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_skin_5_001', 'Entidade de Luz', 'skin', 5, 'legendary', null, null, true, false, false, false, false, false, null, null, 1000, 4000, true),
  ('item_skin_5_002', 'Vestido Real', 'skin', 6, 'mythic', '/assets/catalog/avatars/SKIN_T5_VESTIDO_REAL.png', null, false, false, true, false, false, false, 'genesis_legacy', 'skin', 0, 0, true),
  ('item_skin_season_001', 'O Criador', 'skin', 4, 'epic', '/assets/catalog/avatars/SKIN_SEASON_CRIADOR.png', null, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_skin_aurora_1_2026', 'Guardião Aurora', 'skin', 6, 'mythic', '/assets/catalog/avatars/SKIN_QUEST_GUARDIAO_AURORA.png', null, false, false, true, false, false, false, 'aurora_1_2026', 'skin', 0, 0, true),
  ('item_artifact_1_001', 'Adaga Aprendiz', 'artifact', 1, 'common', '/assets/catalog/avatars/artefato_t1_adagaaprendiz.png', null, false, false, false, false, false, false, null, null, 10, 40, true),
  ('item_artifact_1_002', 'Cachorro Beagle', 'artifact', 1, 'common', '/assets/catalog/avatars/artefato_t1_cachorrobeagle.png', null, false, false, false, false, false, false, null, null, 10, 40, true),
  ('item_artifact_1_003', 'Gato Laranja', 'artifact', 1, 'common', '/assets/catalog/avatars/artefato_t1_gatolaranja.png', null, false, false, false, false, false, false, null, null, 10, 40, true),
  ('item_artifact_1_004', 'Halteres', 'artifact', 1, 'common', '/assets/catalog/avatars/artefato_t1_halterespar.png', null, false, false, false, false, false, false, null, null, 10, 40, true),
  ('item_artifact_1_005', 'Trio Café', 'artifact', 1, 'common', '/assets/catalog/avatars/artefato_t1_triocafe.png', null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_artifact_2_001', 'Cachorro Husky', 'artifact', 2, 'uncommon', '/assets/catalog/avatars/artefato_t2_cachorrohusky.png', null, false, false, false, false, false, false, null, null, 30, 120, true),
  ('item_artifact_2_002', 'Gato Siamês', 'artifact', 2, 'uncommon', '/assets/catalog/avatars/artefato_t2_gatosiames.png', null, false, false, false, false, false, false, null, null, 30, 120, true),
  ('item_artifact_2_003', 'Setup', 'artifact', 2, 'uncommon', '/assets/catalog/avatars/artefato_t2_setup.png', null, true, false, false, false, false, false, null, null, 30, 120, true),
  ('item_artifact_3_001', 'Cachorro Jack', 'artifact', 3, 'rare', '/assets/catalog/avatars/artefato_t3_cachorrojack.png', null, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_artifact_3_002', 'Caixa Mágica', 'artifact', 3, 'rare', '/assets/catalog/avatars/ARTEFATO_T3_caixamagica.png', null, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_artifact_3_003', 'Cetro Esmeralda', 'artifact', 3, 'rare', '/assets/catalog/avatars/ARTEFATO_T3_cetroesmeralda.png', null, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_artifact_3_004', 'Coroa Prata', 'artifact', 3, 'rare', '/assets/catalog/avatars/ARTEFATO_T3_coroaprata.png', null, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_artifact_3_005', 'Divine Scepter', 'artifact', 3, 'rare', '/assets/catalog/avatars/artefato_t3_DivineScepter.png', null, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_artifact_3_006', 'Espada Runas', 'artifact', 3, 'rare', '/assets/catalog/avatars/ARTEFATO_T3_espadarunas.png', null, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_artifact_4_001', 'Coroa de Espinhos', 'artifact', 4, 'epic', '/assets/catalog/avatars/ARTEFATO_T4_COROA_ESPINHOS.png', null, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_artifact_4_002', 'Dragão Bebê', 'artifact', 4, 'epic', '/assets/catalog/avatars/ARTEFATO_T4_DRAGAO_BEBE.png', null, true, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_artifact_4_003', 'Grimório Arcano', 'artifact', 4, 'epic', '/assets/catalog/avatars/ARTEFATO_T4_GRIMORIO_ARCANO.png', null, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_artifact_4_004', 'Manta', 'artifact', 4, 'epic', '/assets/catalog/avatars/artefato_t4_manta.png', null, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_artifact_5_001', 'Fênix Cósmico', 'artifact', 5, 'legendary', '/assets/catalog/avatars/ARTEFATO_T5_FENIX_COSMICO.png', null, false, false, false, false, false, false, null, null, 1000, 4000, true),
  ('item_artifact_5_002', 'Tesseract', 'artifact', 5, 'legendary', '/assets/catalog/avatars/ARTEFATO_T5_tessaract.png', null, false, false, false, false, false, false, null, null, 1000, 4000, true),
  ('cachos', 'Cachos', 'hair', 1, 'common', '/assets/catalog/avatars/hair/CABELO_T1_CACHOS_cast.png', null, false, false, false, false, false, false, null, null, 10, 40, true),
  ('medio_reto', 'Médio Reto', 'hair', 1, 'common', '/assets/catalog/avatars/hair/CABELO_T1_MEDIO_RETO_bran.png', null, false, false, false, false, false, false, null, null, 10, 40, true),
  ('textured_crop', 'Texturizado', 'hair', 2, 'uncommon', '/assets/catalog/avatars/hair/CABELO_T2_TEXTURED_CROP_bran.png', null, false, false, false, false, false, false, null, null, 30, 120, true),
  ('dreads', 'Dreads', 'hair', 3, 'rare', '/assets/catalog/avatars/hair/CABELO_T3_DREADS_bran.png', null, false, false, false, false, false, false, null, null, 100, 400, true),
  ('mullet_topete', 'Mullet Top', 'hair', 3, 'rare', '/assets/catalog/avatars/hair/CABELO_T3_MULLET_TOPETE_ama.png', null, false, false, false, false, false, false, null, null, 100, 400, true),
  ('anime_spikes', 'Anime Spiky', 'hair', 4, 'epic', '/assets/catalog/avatars/hair/CABELO_T4_ANIME_SPIKES_ama.png', null, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('princesa', 'Princesa', 'hair', 4, 'epic', '/assets/catalog/avatars/hair/CABELO_T4_PRINCESA_bran.png', null, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('fluxo_espiritual', 'Fluxo Espiritual', 'hair', 5, 'legendary', '/assets/catalog/avatars/hair/CABELO_T5_FLUXO_ESPIRITUAL_ama.png', null, false, false, false, false, false, false, null, null, 1000, 4000, true),
  ('item_border_1_002', 'Disciplinado', 'border', 1, 'common', '/assets/catalog/interface/borda_disciplinado.png', 10, false, false, false, false, false, false, null, null, 10, 40, true),
  ('item_border_t1_aprendiz', 'Aprendiz', 'border', 1, 'common', '/assets/catalog/interface/borda_t1_aprendiz.png', null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_border_2_001', 'Popular', 'border', 2, 'uncommon', '/assets/catalog/interface/borda_popular.png', 30, false, false, false, false, false, false, null, null, 30, 120, true),
  ('item_border_t2_veterano', 'Veterano', 'border', 2, 'uncommon', '/assets/catalog/interface/borda_t2_veterano.png', null, true, false, false, false, false, false, null, null, 30, 120, true),
  ('item_border_3_001', 'Imparável', 'border', 3, 'rare', '/assets/catalog/interface/borda_imparavel.png', 80, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_border_t3_mistico', 'Místico', 'border', 3, 'rare', '/assets/catalog/interface/borda_t3_mistico.png', 110, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_border_t3_transcendente', 'Transcendente', 'border', 3, 'rare', '/assets/catalog/interface/borda_t3_transcendente.png', 130, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_border_vanguarda_01', 'Borda Vanguarda', 'border', 3, 'rare', '/assets/catalog/interface/borda_vanguarda.png', null, true, false, false, false, false, false, null, null, 100, 400, true),
  ('item_border_4_001', 'Lenda Viva', 'border', 4, 'epic', '/assets/catalog/interface/borda_lendaviva.png', null, true, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_border_4_002', 'Soberano', 'border', 4, 'epic', null, null, true, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_border_t4_celestial', 'Celestial', 'border', 4, 'epic', '/assets/catalog/interface/borda_t4_celestial.png', 180, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_border_t4_guardia', 'Guardiã', 'border', 4, 'epic', '/assets/catalog/interface/borda_t4_guardia.png', 220, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_border_t4_oraculo', 'Oráculo', 'border', 4, 'epic', '/assets/catalog/interface/borda_t4_oraculo.png', 250, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_border_5_001', 'GM - Grande Mestre', 'border', 5, 'legendary', '/assets/catalog/interface/borda_gm.png', null, false, false, false, false, false, false, null, null, 1000, 4000, true),
  ('item_border_aurora_1_2026', 'Aurora II', 'border', 6, 'mythic', '/assets/catalog/interface/borda_aurora_i.webp', null, false, false, true, false, false, false, 'aurora_1_2026', 'border', 0, 0, true),
  ('item_border_t5_genesis', 'Gênesis', 'border', 6, 'mythic', '/assets/catalog/interface/borda_t5_genesis.png', null, false, false, true, false, false, false, 'genesis_legacy', 'border', 0, 0, true),
  ('item_banner_disciplinado', 'Disciplinado', 'banner', 1, 'common', '/assets/catalog/interface/banner_disciplinado.png', 20, false, false, false, false, false, false, null, null, 10, 40, true),
  ('item_banner_t1_aprendiz', 'Aprendiz', 'banner', 1, 'common', '/assets/catalog/interface/banner_t1_aprendiz.png', null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_banner_popular', 'Popular', 'banner', 2, 'uncommon', '/assets/catalog/interface/banner_popular.png', 40, false, false, false, false, false, false, null, null, 30, 120, true),
  ('item_banner_t2_veterano', 'Veterano', 'banner', 2, 'uncommon', '/assets/catalog/interface/banner_t2_veterano.png', 55, false, false, false, false, false, false, null, null, 30, 120, true),
  ('item_banner_imparavel', 'Imparável', 'banner', 3, 'rare', '/assets/catalog/interface/banner_imparavel.png', 90, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_banner_t3_mistico', 'Místico', 'banner', 3, 'rare', '/assets/catalog/interface/banner_t3_mistico.png', 110, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_banner_vanguarda_01', 'Banner Vanguarda', 'banner', 3, 'rare', '/assets/catalog/interface/banner_vanguarda.png', null, true, false, false, false, false, false, null, null, 100, 400, true),
  ('item_banner_lendaviva', 'Lenda Viva', 'banner', 4, 'epic', '/assets/catalog/interface/banner_lendaviva.png', 180, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_banner_t4_celestial', 'Celestial', 'banner', 4, 'epic', '/assets/catalog/interface/banner_t4_celestial.png', 195, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_banner_t4_guardia', 'Guardiã', 'banner', 4, 'epic', '/assets/catalog/interface/banner_t4_guardia.png', 220, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_banner_t4_oraculo', 'Oráculo', 'banner', 4, 'epic', '/assets/catalog/interface/banner_t4_oraculo.png', 250, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_banner_t4_transcendente', 'Transcendente', 'banner', 4, 'epic', '/assets/catalog/interface/banner_t4_transcendente.png', 280, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_banner_gm', 'Grão Mestre', 'banner', 5, 'legendary', '/assets/catalog/interface/banner_gm.png', null, false, false, false, false, false, false, null, null, 1000, 4000, true),
  ('item_banner_aurora_1_2026', 'Aurora II', 'banner', 6, 'mythic', '/assets/catalog/interface/banner_aurora_i.webp', null, false, false, true, false, false, false, 'aurora_1_2026', 'banner', 0, 0, true),
  ('item_banner_t5_genesis', 'Gênesis', 'banner', 6, 'mythic', '/assets/catalog/interface/banner_t5_genesis.png', null, false, false, true, false, false, false, 'genesis_legacy', 'banner', 0, 0, true),
  ('item_aura_1_001', 'Bruma', 'aura', 1, 'common', null, null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_aura_1_002', 'Safira', 'aura', 1, 'common', null, null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_aura_1_003', 'Rubi', 'aura', 1, 'common', null, null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('item_aura_2_001', 'Esmeralda', 'aura', 2, 'uncommon', null, null, true, false, false, false, false, false, null, null, 30, 120, true),
  ('item_aura_2_002', 'Prata', 'aura', 2, 'uncommon', null, null, true, false, false, false, false, false, null, null, 30, 120, true),
  ('item_aura_3_001', 'Ouro', 'aura', 3, 'rare', null, null, true, false, false, false, false, false, null, null, 100, 400, true),
  ('item_aura_4_001', 'Eclipse', 'aura', 4, 'epic', null, null, true, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_aura_5_001', 'Pedra da Lua', 'aura', 5, 'legendary', null, null, true, false, false, false, false, false, null, null, 1000, 4000, true),
  ('item_aura_5_002', 'Multiverso', 'aura', 5, 'legendary', null, null, true, false, false, false, false, false, null, null, 1000, 4000, true),
  ('item_plate_1_001', 'Placa Madeira', 'plate', 1, 'common', '/assets/catalog/avatars/glyphs/PLACA_MADEIRA.png', 18, false, false, false, false, false, false, null, null, 10, 40, true),
  ('item_plate_2_001', 'Placa Pedra', 'plate', 2, 'uncommon', '/assets/catalog/avatars/glyphs/PLACA_PEDRA.png', 42, false, false, false, false, false, false, null, null, 30, 120, true),
  ('item_plate_3_001', 'Placa Prata', 'plate', 3, 'rare', '/assets/catalog/avatars/glyphs/PLACA_PRATA.png', 95, false, false, false, false, false, false, null, null, 100, 400, true),
  ('item_plate_4_001', 'Placa Roxa', 'plate', 4, 'epic', '/assets/catalog/avatars/glyphs/PLACA_ROXA.png', 200, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('item_plate_5_001', 'Placa Ouro', 'plate', 5, 'legendary', '/assets/catalog/avatars/glyphs/PLACA_OURO.png', 340, false, false, false, false, false, false, null, null, 1000, 4000, true),
  ('item_plate_5_002', 'Placa Gelo', 'plate', 5, 'legendary', '/assets/catalog/avatars/glyphs/PLACA_GELO.png', 360, false, false, false, false, false, false, null, null, 1000, 4000, true),
  ('BASIC', 'Tema: Básico Profissional', 'ui_skin', 1, 'common', '/assets/catalog/basic.png', null, false, false, false, false, false, false, null, null, 10, 40, true),
  ('GOLD', 'Tema: Ouro Soberano', 'ui_skin', 3, 'rare', '/assets/catalog/gold.png', 135, false, false, false, false, false, false, null, null, 100, 400, true),
  ('FROST', 'Tema: Gelo Eterno', 'ui_skin', 3, 'rare', '/assets/catalog/frost.png', 135, false, false, false, false, false, false, null, null, 100, 400, true),
  ('EMBER', 'Tema: Chama Viva', 'ui_skin', 4, 'epic', '/assets/catalog/ember.png', 220, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('CYBER', 'Tema: Cyberpunk', 'ui_skin', 4, 'epic', '/assets/catalog/cyber.jpg', 220, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('AURORA', 'Tema: Aurora Boreal', 'ui_skin', 4, 'epic', '/assets/catalog/aurora.png', 220, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('AURORA_I', 'Tema: Aurora II', 'ui_skin', 6, 'mythic', '/assets/catalog/aurora_i.png', null, false, false, true, false, false, false, 'aurora_1_2026', 'ui_skin', 0, 0, true),
  ('VOID', 'Tema: Vazio Primordial', 'ui_skin', 5, 'legendary', '/assets/catalog/void.png', 420, false, false, false, false, false, false, null, null, 1000, 4000, true),
  ('GENESIS', 'Tema: Genesis', 'ui_skin', 6, 'mythic', '/assets/catalog/genesis.png', null, false, false, true, false, false, false, 'genesis_legacy', 'ui_skin', 0, 0, true),
  ('item_skin_exclusive_001', 'Empreendedor', 'skin', 4, 'epic', null, null, false, false, false, false, false, false, null, null, 300, 1200, true),
  ('insignia_rank_1_vagante', 'Insígnia do Vagante', 'insignia', 1, 'common', '/assets/catalog/interface/insignia_rank_1_vagante.webp', null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('insignia_rank_2_escudeiro', 'Insígnia do Escudeiro', 'insignia', 1, 'common', '/assets/catalog/interface/insignia_rank_2_escudeiro.webp', null, true, false, false, false, false, false, null, null, 10, 40, true),
  ('insignia_rank_3_cavaleiro', 'Insígnia do Cavaleiro', 'insignia', 2, 'uncommon', '/assets/catalog/interface/insignia_rank_3_cavaleiro.webp', null, true, false, false, false, false, false, null, null, 30, 120, true),
  ('insignia_rank_4_lorde', 'Insígnia do Lorde', 'insignia', 3, 'rare', '/assets/catalog/interface/insignia_rank_4_lorde.webp', null, true, false, false, false, false, false, null, null, 100, 400, true),
  ('insignia_rank_5_barao', 'Insígnia do Barão', 'insignia', 4, 'epic', '/assets/catalog/interface/insignia_rank_5_barao.webp', null, true, false, false, false, false, false, null, null, 300, 1200, true),
  ('insignia_rank_6_conde', 'Insígnia do Conde', 'insignia', 4, 'epic', '/assets/catalog/interface/insignia_rank_6_conde.webp', null, true, false, false, false, false, false, null, null, 300, 1200, true),
  ('insignia_rank_7_duque', 'Insígnia do Duque', 'insignia', 5, 'legendary', '/assets/catalog/interface/insignia_rank_7_duque.webp', null, true, false, false, false, false, false, null, null, 1000, 4000, true),
  ('insignia_rank_8_principe', 'Insígnia do Príncipe', 'insignia', 5, 'legendary', '/assets/catalog/interface/insignia_rank_8_principe.webp', null, true, false, false, false, false, false, null, null, 1000, 4000, true),
  ('insignia_rank_9_rei', 'Insígnia do Rei', 'insignia', 5, 'legendary', '/assets/catalog/interface/insignia_rank_9_rei.webp', null, true, false, false, false, false, false, null, null, 1000, 4000, true),
  ('insignia_rank_10_soberano', 'Insígnia do Soberano', 'insignia', 5, 'legendary', '/assets/catalog/interface/insignia_rank_10_soberano.webp', null, true, false, false, false, false, false, null, null, 1000, 4000, true),
  ('insignia_quest_master', 'Insígnia de Missão de Temporada', 'insignia', 3, 'rare', '/assets/catalog/interface/insignia_quest_temporada.webp', null, false, false, false, false, false, false, null, null, 100, 400, true),
  ('insignia_report_comum', 'Insígnia de Relatório de Ciclo', 'insignia', 1, 'common', '/assets/catalog/interface/insignia_ciclo_bronze.webp', null, false, false, false, false, false, false, null, null, 10, 40, true),
  ('insignia_quest_incomum', 'Insígnia de Missão', 'insignia', 2, 'uncommon', '/assets/catalog/interface/insignia_missao_prata.webp', null, false, false, false, false, false, false, null, null, 30, 120, true),
  ('insignia_levelup_rara', 'Insígnia de Patente Rara', 'insignia', 3, 'rare', '/assets/catalog/interface/insignia_rank_7_duque.webp', null, true, false, false, false, false, false, null, null, 100, 400, true),
  ('insignia_season_genesis', 'Gênesis', 'insignia', 6, 'mythic', '/assets/catalog/interface/insignia_season_genesis.webp', null, false, false, true, false, false, false, 'genesis_legacy', 'insignia', 0, 0, true),
  ('insignia_season_aurora_1', 'Aurora II', 'insignia', 6, 'mythic', '/assets/catalog/interface/insignia_season_aurora_1.webp', null, false, false, true, false, false, false, 'aurora_1_2026', 'insignia', 0, 0, true),
  ('item_border_genesis_01', 'Borda Gênesis', 'border', 4, 'epic', '/assets/catalog/interface/borda_t5_genesis.png', null, false, false, true, false, false, true, 'genesis_legacy', 'border', 300, 1200, true),
  ('item_banner_origin_01', 'Banner Origem', 'banner', 4, 'epic', '/assets/catalog/interface/banner_origem.png', null, false, false, true, false, false, true, 'genesis_legacy', 'banner', 300, 1200, true)
on conflict (id) do update
set
  name = excluded.name,
  category = excluded.category,
  tier = excluded.tier,
  rarity = excluded.rarity,
  image_url = excluded.image_url,
  gold_price = excluded.gold_price,
  is_rank_exclusive = excluded.is_rank_exclusive,
  is_gold_exclusive = excluded.is_gold_exclusive,
  is_season_exclusive = excluded.is_season_exclusive,
  is_premium_only = excluded.is_premium_only,
  is_chest_exclusive = excluded.is_chest_exclusive,
  is_legacy_retired = excluded.is_legacy_retired,
  season_key = excluded.season_key,
  season_slot = excluded.season_slot;

-- Quem saiu do codigo e aposentado, nao apagado: quem ja tem continua tendo, e
-- o sorteio para de alcancar. (O glifo e o orbe sairam em 20/09; sao 17.)
--
-- O coalesce no WHERE nao e enfeite: sem ele o update tocaria tambem em quem ja
-- estava desligado, e o RETURNING abaixo misturaria o que ESTA desligado com o
-- que ACABOU de ser desligado. Foi assim que a primeira versao deste arquivo
-- fez parecer que tinha apagado a borda e o banner da Aurora II, que ja estavam
-- fora porque a temporada ativa e a Genesis.
with aposentados as (
  update public.items
  set is_live_in_game = false
  where coalesce(is_live_in_game, true) = true
    and id <> all (array[
      'garden_base_path',
      'garden_base_pond',
      'garden_kit_luxury',
      'garden_base_river',
      'garden_kit_genesis',
      'item_skin_1_001',
      'item_skin_1_002',
      'item_skin_1_003',
      'item_skin_1_004',
      'item_skin_1_005',
      'item_skin_1_006',
      'item_skin_2_001',
      'item_skin_2_002',
      'item_skin_2_003',
      'item_skin_3_001',
      'item_skin_3_002',
      'item_skin_3_003',
      'item_skin_4_001',
      'item_skin_4_002',
      'item_skin_5_001',
      'item_skin_5_002',
      'item_skin_season_001',
      'item_skin_aurora_1_2026',
      'item_artifact_1_001',
      'item_artifact_1_002',
      'item_artifact_1_003',
      'item_artifact_1_004',
      'item_artifact_1_005',
      'item_artifact_2_001',
      'item_artifact_2_002',
      'item_artifact_2_003',
      'item_artifact_3_001',
      'item_artifact_3_002',
      'item_artifact_3_003',
      'item_artifact_3_004',
      'item_artifact_3_005',
      'item_artifact_3_006',
      'item_artifact_4_001',
      'item_artifact_4_002',
      'item_artifact_4_003',
      'item_artifact_4_004',
      'item_artifact_5_001',
      'item_artifact_5_002',
      'cachos',
      'medio_reto',
      'textured_crop',
      'dreads',
      'mullet_topete',
      'anime_spikes',
      'princesa',
      'fluxo_espiritual',
      'item_border_1_002',
      'item_border_t1_aprendiz',
      'item_border_2_001',
      'item_border_t2_veterano',
      'item_border_3_001',
      'item_border_t3_mistico',
      'item_border_t3_transcendente',
      'item_border_vanguarda_01',
      'item_border_4_001',
      'item_border_4_002',
      'item_border_t4_celestial',
      'item_border_t4_guardia',
      'item_border_t4_oraculo',
      'item_border_5_001',
      'item_border_aurora_1_2026',
      'item_border_t5_genesis',
      'item_banner_disciplinado',
      'item_banner_t1_aprendiz',
      'item_banner_popular',
      'item_banner_t2_veterano',
      'item_banner_imparavel',
      'item_banner_t3_mistico',
      'item_banner_vanguarda_01',
      'item_banner_lendaviva',
      'item_banner_t4_celestial',
      'item_banner_t4_guardia',
      'item_banner_t4_oraculo',
      'item_banner_t4_transcendente',
      'item_banner_gm',
      'item_banner_aurora_1_2026',
      'item_banner_t5_genesis',
      'item_aura_1_001',
      'item_aura_1_002',
      'item_aura_1_003',
      'item_aura_2_001',
      'item_aura_2_002',
      'item_aura_3_001',
      'item_aura_4_001',
      'item_aura_5_001',
      'item_aura_5_002',
      'item_plate_1_001',
      'item_plate_2_001',
      'item_plate_3_001',
      'item_plate_4_001',
      'item_plate_5_001',
      'item_plate_5_002',
      'BASIC',
      'GOLD',
      'FROST',
      'EMBER',
      'CYBER',
      'AURORA',
      'AURORA_I',
      'VOID',
      'GENESIS',
      'item_skin_exclusive_001',
      'insignia_rank_1_vagante',
      'insignia_rank_2_escudeiro',
      'insignia_rank_3_cavaleiro',
      'insignia_rank_4_lorde',
      'insignia_rank_5_barao',
      'insignia_rank_6_conde',
      'insignia_rank_7_duque',
      'insignia_rank_8_principe',
      'insignia_rank_9_rei',
      'insignia_rank_10_soberano',
      'insignia_quest_master',
      'insignia_report_comum',
      'insignia_quest_incomum',
      'insignia_levelup_rara',
      'insignia_season_genesis',
      'insignia_season_aurora_1',
      'item_border_genesis_01',
      'item_banner_origin_01'
    ]::text[])
  returning id, name, category, tier
)
select id, name, category, tier, 'DESLIGADO AGORA' as o_que_mudou
from aposentados
order by category, tier, id;

commit;

-- --------------------------------------------------------------------------
-- COMO FICOU. Roda junto e me manda.
-- --------------------------------------------------------------------------

-- 1. Quantos itens cada tier oferece ao sorteio, com o filtro do servidor.
select
  tier,
  count(*) as sorteaveis
from public.items
where coalesce(is_live_in_game, true) = true
  and category not in ('insignia', 'insignias')
  and category <> 'hair'
  and is_rank_exclusive is not true
  and is_premium_only is not true
  and is_legacy_retired is not true
  and (is_gold_exclusive = false or is_gold_exclusive is null)
  and (is_season_exclusive = false or is_season_exclusive is null)
group by tier
order by tier;

-- 2. Por categoria: quantos sao de patente e quantos sobram no sorteio.
select
  category,
  count(*) filter (where is_rank_exclusive is true) as de_patente,
  count(*) filter (where is_rank_exclusive is not true) as sorteaveis
from public.items
where coalesce(is_live_in_game, true) = true
group by category
order by category;

-- 3. Sobrou algum item do codigo sem linha no banco? Tem de vir vazio.
--
-- Desde que o bloco virou upsert isto e so uma rede: se aparecer alguem aqui, o
-- insert falhou em silencio e vale olhar.
select codigo.id as so_no_codigo
from (values
  ('garden_base_path'),
  ('garden_base_pond'),
  ('garden_kit_luxury'),
  ('garden_base_river'),
  ('garden_kit_genesis'),
  ('item_skin_1_001'),
  ('item_skin_1_002'),
  ('item_skin_1_003'),
  ('item_skin_1_004'),
  ('item_skin_1_005'),
  ('item_skin_1_006'),
  ('item_skin_2_001'),
  ('item_skin_2_002'),
  ('item_skin_2_003'),
  ('item_skin_3_001'),
  ('item_skin_3_002'),
  ('item_skin_3_003'),
  ('item_skin_4_001'),
  ('item_skin_4_002'),
  ('item_skin_5_001'),
  ('item_skin_5_002'),
  ('item_skin_season_001'),
  ('item_skin_aurora_1_2026'),
  ('item_artifact_1_001'),
  ('item_artifact_1_002'),
  ('item_artifact_1_003'),
  ('item_artifact_1_004'),
  ('item_artifact_1_005'),
  ('item_artifact_2_001'),
  ('item_artifact_2_002'),
  ('item_artifact_2_003'),
  ('item_artifact_3_001'),
  ('item_artifact_3_002'),
  ('item_artifact_3_003'),
  ('item_artifact_3_004'),
  ('item_artifact_3_005'),
  ('item_artifact_3_006'),
  ('item_artifact_4_001'),
  ('item_artifact_4_002'),
  ('item_artifact_4_003'),
  ('item_artifact_4_004'),
  ('item_artifact_5_001'),
  ('item_artifact_5_002'),
  ('cachos'),
  ('medio_reto'),
  ('textured_crop'),
  ('dreads'),
  ('mullet_topete'),
  ('anime_spikes'),
  ('princesa'),
  ('fluxo_espiritual'),
  ('item_border_1_002'),
  ('item_border_t1_aprendiz'),
  ('item_border_2_001'),
  ('item_border_t2_veterano'),
  ('item_border_3_001'),
  ('item_border_t3_mistico'),
  ('item_border_t3_transcendente'),
  ('item_border_vanguarda_01'),
  ('item_border_4_001'),
  ('item_border_4_002'),
  ('item_border_t4_celestial'),
  ('item_border_t4_guardia'),
  ('item_border_t4_oraculo'),
  ('item_border_5_001'),
  ('item_border_aurora_1_2026'),
  ('item_border_t5_genesis'),
  ('item_banner_disciplinado'),
  ('item_banner_t1_aprendiz'),
  ('item_banner_popular'),
  ('item_banner_t2_veterano'),
  ('item_banner_imparavel'),
  ('item_banner_t3_mistico'),
  ('item_banner_vanguarda_01'),
  ('item_banner_lendaviva'),
  ('item_banner_t4_celestial'),
  ('item_banner_t4_guardia'),
  ('item_banner_t4_oraculo'),
  ('item_banner_t4_transcendente'),
  ('item_banner_gm'),
  ('item_banner_aurora_1_2026'),
  ('item_banner_t5_genesis'),
  ('item_aura_1_001'),
  ('item_aura_1_002'),
  ('item_aura_1_003'),
  ('item_aura_2_001'),
  ('item_aura_2_002'),
  ('item_aura_3_001'),
  ('item_aura_4_001'),
  ('item_aura_5_001'),
  ('item_aura_5_002'),
  ('item_plate_1_001'),
  ('item_plate_2_001'),
  ('item_plate_3_001'),
  ('item_plate_4_001'),
  ('item_plate_5_001'),
  ('item_plate_5_002'),
  ('BASIC'),
  ('GOLD'),
  ('FROST'),
  ('EMBER'),
  ('CYBER'),
  ('AURORA'),
  ('AURORA_I'),
  ('VOID'),
  ('GENESIS'),
  ('item_skin_exclusive_001'),
  ('insignia_rank_1_vagante'),
  ('insignia_rank_2_escudeiro'),
  ('insignia_rank_3_cavaleiro'),
  ('insignia_rank_4_lorde'),
  ('insignia_rank_5_barao'),
  ('insignia_rank_6_conde'),
  ('insignia_rank_7_duque'),
  ('insignia_rank_8_principe'),
  ('insignia_rank_9_rei'),
  ('insignia_rank_10_soberano'),
  ('insignia_quest_master'),
  ('insignia_report_comum'),
  ('insignia_quest_incomum'),
  ('insignia_levelup_rara'),
  ('insignia_season_genesis'),
  ('insignia_season_aurora_1'),
  ('item_border_genesis_01'),
  ('item_banner_origin_01')
) as codigo (id)
where not exists (select 1 from public.items i where i.id = codigo.id);

-- 4. TUDO o que esta desligado hoje — nao so o que este bloco desligou.
--
-- Aqui entram tres coisas diferentes, e vale saber qual e qual:
--   - o que saiu do codigo agora (glifo, orbe, e o que o RETURNING acima listou)
--   - o que esta fora porque a temporada nao e a da vez (Aurora II)
--   - o que so existe no banco e nunca chegou ao codigo
select
  id, name, category, tier,
  case
    when id like 'item_glyph_%' or id like 'item_orb_%' then 'saiu do codigo'
    when id like '%aurora_1_2026%' or id like '%genesis%' then 'temporada fora da vez'
    else 'so existe no banco'
  end as por_que
from public.items
where coalesce(is_live_in_game, true) = false
order by por_que, category, tier, id;

-- --------------------------------------------------------------------------
-- OPCIONAL, E E DECISAO SUA. Nao roda junto.
--
-- Staff, quest e relatorio nao tem coluna no banco, entao o WHERE do open_chest
-- nao sabe recusa-los. Sao 7 itens:
--
--   t4 skin · O Criador
--   t6 skin · Guardião Aurora
--   t5 border · GM - Grande Mestre
--   t5 banner · Grão Mestre
--   t3 insignia · Insígnia de Missão de Temporada
--   t1 insignia · Insígnia de Relatório de Ciclo
--   t2 insignia · Insígnia de Missão
--
-- Os de tier 5 sao os que doem: o bau Lendario sorteia so no tier 5.
-- Desligar tira do sorteio E de qualquer outra entrega — inclusive de ser dado
-- a mao. Por isso fica comentado.
--
-- update public.items
-- set is_live_in_game = false
-- where id in ('item_skin_season_001', 'item_skin_aurora_1_2026', 'item_border_5_001', 'item_banner_gm', 'insignia_quest_master', 'insignia_report_comum', 'insignia_quest_incomum');
