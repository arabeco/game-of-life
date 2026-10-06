-- A CONTA TEM O CATALOGO INTEIRO? So leitura: nada aqui grava.
--
-- Compara o inventario da conta principal (misterxhermit) com o catalogo que o
-- APP conhece — constants/items.ts, so os itens visiveis, que e exatamente o que
-- a concessao de staff em fetchInventory tenta inserir a cada carga. E confere
-- tambem se a tabela public.items do banco (bau e reciclagem leem dela) tem
-- cada um desses itens.
--
-- Gerado em 06/10/2026 do commit 15dbc9a: 149 itens visiveis
-- (garden 5, skin 36, artifact 20, hair 12, border 16, banner 16, aura 9, plate 10, ui_skin 9, insignia 16).
-- Se o catalogo mudar, este arquivo envelhece junto: gere de novo.
--
-- Um resultado so, em linhas. Leia de cima para baixo:
--   1 papel da conta     staff (admin/gm) recebe o catalogo sozinho ao abrir o app
--   2 catalogo do app    quantos itens o app conhece
--   3 a conta tem        quantos a conta tem, de quantos
--   4 faltam: <categoria> o que falta, por categoria (sem linha = nada falta)
--   5 na conta, fora do catalogo   ids antigos ou aposentados que a conta guarda
--   6 banco sem o item   ids que o app conhece e a tabela public.items nao
with catalogo(id, categoria, tier, nome, arquivo, via) as (
  values
    ('item_artifact_1_001', 'artifact', 1, 'Adaga Aprendiz', 'artefato_t1_adagaaprendiz', 'loja/bau'),
    ('item_artifact_1_002', 'artifact', 1, 'Cachorro Beagle', 'artefato_t1_cachorrobeagle', 'loja/bau'),
    ('item_artifact_1_003', 'artifact', 1, 'Gato Laranja', 'artefato_t1_gatolaranja', 'loja/bau'),
    ('item_artifact_1_004', 'artifact', 1, 'Halteres', 'artefato_t1_halterespar', 'loja/bau'),
    ('item_artifact_1_005', 'artifact', 1, 'Trio Café', 'artefato_t1_triocafe', 'patente'),
    ('item_artifact_2_001', 'artifact', 2, 'Cachorro Husky', 'artefato_t2_cachorrohusky', 'loja/bau'),
    ('item_artifact_2_002', 'artifact', 2, 'Gato Siamês', 'artefato_t2_gatosiames', 'loja/bau'),
    ('item_artifact_2_003', 'artifact', 2, 'Setup', 'artefato_t2_setup', 'patente'),
    ('item_artifact_3_001', 'artifact', 3, 'Cachorro Jack', 'artefato_t3_cachorrojack', 'loja/bau'),
    ('item_artifact_3_002', 'artifact', 3, 'Caixa Mágica', 'artefato_t3_caixamagica', 'loja/bau'),
    ('item_artifact_3_003', 'artifact', 3, 'Cetro Esmeralda', 'artefato_t3_cetroesmeralda', 'loja/bau'),
    ('item_artifact_3_004', 'artifact', 3, 'Coroa Prata', 'artefato_t3_coroaprata', 'loja/bau'),
    ('item_artifact_3_005', 'artifact', 3, 'Divine Scepter', 'artefato_t3_divinescepter', 'loja/bau'),
    ('item_artifact_3_006', 'artifact', 3, 'Espada Runas', 'artefato_t3_espadarunas', 'loja/bau'),
    ('item_artifact_4_001', 'artifact', 4, 'Coroa de Espinhos', 'artefato_t4_coroa_espinhos', 'loja/bau'),
    ('item_artifact_4_002', 'artifact', 4, 'Dragão Bebê', 'artefato_t4_dragao_bebe', 'patente'),
    ('item_artifact_4_003', 'artifact', 4, 'Grimório Arcano', 'artefato_t4_grimorio_arcano', 'loja/bau'),
    ('item_artifact_4_004', 'artifact', 4, 'Manta', 'artefato_t4_manta', 'loja/bau'),
    ('item_artifact_5_001', 'artifact', 5, 'Fênix Cósmico', 'artefato_t5_fenix_cosmico', 'loja/bau'),
    ('item_artifact_5_002', 'artifact', 5, 'Tesseract', 'artefato_t5_tessaract', 'loja/bau'),
    ('item_aura_1_001', 'aura', 1, 'Bruma', '', 'patente'),
    ('item_aura_1_002', 'aura', 1, 'Safira', '', 'patente'),
    ('item_aura_1_003', 'aura', 1, 'Rubi', '', 'patente'),
    ('item_aura_2_001', 'aura', 2, 'Esmeralda', '', 'patente'),
    ('item_aura_2_002', 'aura', 2, 'Prata', '', 'patente'),
    ('item_aura_3_001', 'aura', 3, 'Ouro', '', 'patente'),
    ('item_aura_4_001', 'aura', 4, 'Eclipse', '', 'patente'),
    ('item_aura_5_001', 'aura', 5, 'Pedra da Lua', '', 'patente'),
    ('item_aura_5_002', 'aura', 5, 'Multiverso', '', 'patente'),
    ('item_banner_disciplinado', 'banner', 1, 'Disciplinado', 'banner_disciplinado', 'loja/bau'),
    ('item_banner_t1_aprendiz', 'banner', 1, 'Aprendiz', 'banner_t1_aprendiz', 'patente'),
    ('item_banner_popular', 'banner', 2, 'Popular', 'banner_popular', 'loja/bau'),
    ('item_banner_t2_veterano', 'banner', 2, 'Veterano', 'banner_t2_veterano', 'loja/bau'),
    ('item_banner_imparavel', 'banner', 3, 'Imparável', 'banner_imparavel', 'loja/bau'),
    ('item_banner_t3_mistico', 'banner', 3, 'Místico', 'banner_t3_mistico', 'loja/bau'),
    ('item_banner_vanguarda_01', 'banner', 3, 'Banner Vanguarda', 'banner_vanguarda', 'patente'),
    ('item_banner_lendaviva', 'banner', 4, 'Lenda Viva', 'banner_lendaviva', 'loja/bau'),
    ('item_banner_origin_01', 'banner', 4, 'Banner Origem', 'banner_origem', 'temporada'),
    ('item_banner_t4_celestial', 'banner', 4, 'Celestial', 'banner_t4_celestial', 'loja/bau'),
    ('item_banner_t4_guardia', 'banner', 4, 'Guardiã', 'banner_t4_guardia', 'loja/bau'),
    ('item_banner_t4_oraculo', 'banner', 4, 'Oráculo', 'banner_t4_oraculo', 'loja/bau'),
    ('item_banner_t4_transcendente', 'banner', 4, 'Transcendente', 'banner_t4_transcendente', 'loja/bau'),
    ('item_banner_gm', 'banner', 5, 'Grão Mestre', 'banner_gm', 'gm'),
    ('item_banner_aurora_1_2026', 'banner', 6, 'Aurora II', 'banner_aurora_i', 'temporada'),
    ('item_banner_t5_genesis', 'banner', 6, 'Gênesis', 'banner_t5_genesis', 'temporada'),
    ('item_border_1_002', 'border', 1, 'Disciplinado', 'borda_disciplinado', 'loja/bau'),
    ('item_border_t1_aprendiz', 'border', 1, 'Aprendiz', 'borda_t1_aprendiz', 'patente'),
    ('item_border_2_001', 'border', 2, 'Popular', 'borda_popular', 'loja/bau'),
    ('item_border_t2_veterano', 'border', 2, 'Veterano', 'borda_t2_veterano', 'patente'),
    ('item_border_3_001', 'border', 3, 'Imparável', 'borda_imparavel', 'loja/bau'),
    ('item_border_t3_mistico', 'border', 3, 'Místico', 'borda_t3_mistico', 'loja/bau'),
    ('item_border_t3_transcendente', 'border', 3, 'Transcendente', 'borda_t3_transcendente', 'loja/bau'),
    ('item_border_vanguarda_01', 'border', 3, 'Borda Vanguarda', 'borda_vanguarda', 'patente'),
    ('item_border_4_001', 'border', 4, 'Lenda Viva', 'borda_lendaviva', 'patente'),
    ('item_border_genesis_01', 'border', 4, 'Borda Gênesis', 'borda_t5_genesis', 'temporada'),
    ('item_border_t4_celestial', 'border', 4, 'Celestial', 'borda_t4_celestial', 'loja/bau'),
    ('item_border_t4_guardia', 'border', 4, 'Guardiã', 'borda_t4_guardia', 'loja/bau'),
    ('item_border_t4_oraculo', 'border', 4, 'Oráculo', 'borda_t4_oraculo', 'loja/bau'),
    ('item_border_5_001', 'border', 5, 'GM - Grande Mestre', 'borda_gm', 'gm'),
    ('item_border_aurora_1_2026', 'border', 6, 'Aurora II', 'borda_aurora_i', 'temporada'),
    ('item_border_t5_genesis', 'border', 6, 'Gênesis', 'borda_t5_genesis', 'temporada'),
    ('garden_base_path', 'garden', 2, 'Jardim: Caminho antigo', 'garden_base_path.svg', 'loja/bau'),
    ('garden_base_pond', 'garden', 3, 'Jardim: Espelho do bosque', 'garden_base_pond.svg', 'loja/bau'),
    ('garden_base_river', 'garden', 4, 'Jardim: Margens do refúgio', 'garden_base_river.svg', 'loja/bau'),
    ('garden_kit_luxury', 'garden', 4, 'Kit Jardim: Pátio dourado', 'garden_kit_luxury.svg', 'loja/bau'),
    ('garden_kit_genesis', 'garden', 5, 'Kit Jardim: Gênesis', 'garden_kit_genesis.svg', 'loja/bau'),
    ('cachos', 'hair', 1, 'Cachos', 'cabelo_t1_cachos_cast', 'loja/bau'),
    ('medio_reto', 'hair', 1, 'Médio Reto', 'cabelo_t1_medio_reto_bran', 'loja/bau'),
    ('rabo_de_cavalo', 'hair', 1, 'Rabo de Cavalo', 'cabelo_t1_rabo_de_cavalo_cast', 'loja/bau'),
    ('coque_solto', 'hair', 2, 'Coque Solto', 'cabelo_t2_coque_solto_cast', 'loja/bau'),
    ('textured_crop', 'hair', 2, 'Texturizado', 'cabelo_t2_textured_crop_bran', 'loja/bau'),
    ('dreads', 'hair', 3, 'Dreads', 'cabelo_t3_dreads_bran', 'loja/bau'),
    ('mullet_topete', 'hair', 3, 'Mullet Top', 'cabelo_t3_mullet_topete_ama', 'loja/bau'),
    ('undercut', 'hair', 3, 'Undercut', 'cabelo_t3_undercut_cast', 'loja/bau'),
    ('anime_spikes', 'hair', 4, 'Anime Spiky', 'cabelo_t4_anime_spikes_ama', 'loja/bau'),
    ('princesa', 'hair', 4, 'Princesa', 'cabelo_t4_princesa_bran', 'loja/bau'),
    ('tranca_lateral', 'hair', 4, 'Trança Lateral', 'cabelo_t4_tranca_lateral_cast', 'loja/bau'),
    ('fluxo_espiritual', 'hair', 5, 'Fluxo Espiritual', 'cabelo_t5_fluxo_espiritual_ama', 'loja/bau'),
    ('insignia_rank_1_vagante', 'insignia', 1, 'Insígnia do Vagante', 'insignia_rank_1_vagante', 'patente'),
    ('insignia_rank_2_escudeiro', 'insignia', 1, 'Insígnia do Escudeiro', 'insignia_rank_2_escudeiro', 'patente'),
    ('insignia_report_comum', 'insignia', 1, 'Insígnia de Relatório de Ciclo', 'insignia_ciclo_bronze', 'relatorio'),
    ('insignia_quest_incomum', 'insignia', 2, 'Insígnia de Missão', 'insignia_missao_prata', 'missao'),
    ('insignia_rank_3_cavaleiro', 'insignia', 2, 'Insígnia do Cavaleiro', 'insignia_rank_3_cavaleiro', 'patente'),
    ('insignia_levelup_rara', 'insignia', 3, 'Insígnia de Patente Rara', 'insignia_rank_7_duque', 'patente'),
    ('insignia_quest_master', 'insignia', 3, 'Insígnia de Missão de Temporada', 'insignia_quest_temporada', 'missao'),
    ('insignia_rank_4_lorde', 'insignia', 3, 'Insígnia do Lorde', 'insignia_rank_4_lorde', 'patente'),
    ('insignia_rank_5_barao', 'insignia', 4, 'Insígnia do Barão', 'insignia_rank_5_barao', 'patente'),
    ('insignia_rank_6_conde', 'insignia', 4, 'Insígnia do Conde', 'insignia_rank_6_conde', 'patente'),
    ('insignia_rank_10_soberano', 'insignia', 5, 'Insígnia do Soberano', 'insignia_rank_10_soberano', 'patente'),
    ('insignia_rank_7_duque', 'insignia', 5, 'Insígnia do Duque', 'insignia_rank_7_duque', 'patente'),
    ('insignia_rank_8_principe', 'insignia', 5, 'Insígnia do Príncipe', 'insignia_rank_8_principe', 'patente'),
    ('insignia_rank_9_rei', 'insignia', 5, 'Insígnia do Rei', 'insignia_rank_9_rei', 'patente'),
    ('insignia_season_aurora_1', 'insignia', 6, 'Aurora II', 'insignia_season_aurora_1', 'temporada'),
    ('insignia_season_genesis', 'insignia', 6, 'Gênesis', 'insignia_season_genesis', 'temporada'),
    ('item_plate_1_001', 'plate', 1, 'Placa Madeira', 'placa_madeira', 'loja/bau'),
    ('item_plate_1_002', 'plate', 1, 'Placa Couro', 'placa_couro', 'loja/bau'),
    ('item_plate_2_001', 'plate', 2, 'Placa Pedra', 'placa_pedra', 'loja/bau'),
    ('item_plate_2_002', 'plate', 2, 'Placa Cobre', 'placa_cobre', 'loja/bau'),
    ('item_plate_3_001', 'plate', 3, 'Placa Prata', 'placa_prata', 'loja/bau'),
    ('item_plate_3_002', 'plate', 3, 'Placa Obsidiana', 'placa_obsidiana', 'loja/bau'),
    ('item_plate_4_001', 'plate', 4, 'Placa Roxa', 'placa_roxa', 'loja/bau'),
    ('item_plate_4_002', 'plate', 4, 'Placa Esmeralda', 'placa_esmeralda', 'loja/bau'),
    ('item_plate_5_001', 'plate', 5, 'Placa Ouro', 'placa_ouro', 'loja/bau'),
    ('item_plate_5_002', 'plate', 5, 'Placa Gelo', 'placa_gelo', 'loja/bau'),
    ('item_skin_1_001', 'skin', 1, 'Náufrago', 'skin_t1_naufrago', 'patente'),
    ('item_skin_1_002', 'skin', 1, 'Casual', 'skin_t1_casual', 'patente'),
    ('item_skin_1_003', 'skin', 1, 'Gym Rat', 'skin_t1_gym_rat', 'loja/bau'),
    ('item_skin_1_004', 'skin', 1, 'Street', 'skin_t1_street', 'loja/bau'),
    ('item_skin_1_005', 'skin', 1, 'Caçador', 'skin_t1_cacador', 'patente'),
    ('item_skin_1_006', 'skin', 1, 'Casual 2', 'skin_t1_casual_2', 'patente'),
    ('item_skin_1_007', 'skin', 1, 'Pijama', 'skin_t1_pijama', 'loja/bau'),
    ('item_skin_1_008', 'skin', 1, 'Corrida', 'skin_t1_corrida', 'loja/bau'),
    ('item_skin_1_009', 'skin', 1, 'Chuva', 'skin_t1_chuva', 'loja/bau'),
    ('item_skin_1_010', 'skin', 1, 'Verão', 'skin_t1_verao', 'loja/bau'),
    ('item_skin_1_011', 'skin', 1, 'Escudeiro', 'skin_t1_escudeiro', 'patente'),
    ('item_skin_2_001', 'skin', 2, 'Executivo', 'skin_t2_executivo', 'loja/bau'),
    ('item_skin_2_002', 'skin', 2, 'Tático', 'skin_t2_tatico', 'loja/bau'),
    ('item_skin_2_003', 'skin', 2, 'Acadêmico', 'skin_t2_academico', 'loja/bau'),
    ('item_skin_2_005', 'skin', 2, 'Cavaleiro', 'skin_t2_cavaleiro', 'patente'),
    ('item_skin_2_006', 'skin', 2, 'Lorde', 'skin_t2_lorde', 'patente'),
    ('item_skin_2_007', 'skin', 2, 'Barão', 'skin_t2_barao', 'patente'),
    ('item_skin_2_008', 'skin', 2, 'Oficina', 'skin_t2_oficina', 'loja/bau'),
    ('item_skin_2_009', 'skin', 2, 'Trilha', 'skin_t2_trilha', 'loja/bau'),
    ('item_skin_3_001', 'skin', 3, 'Nômade', 'skin_t3_nomade', 'loja/bau'),
    ('item_skin_3_002', 'skin', 3, 'Alquimista', 'skin_t3_alquimista', 'loja/bau'),
    ('item_skin_3_003', 'skin', 3, 'Híbrido', 'skin_t3_hibrido', 'loja/bau'),
    ('item_skin_3_004', 'skin', 3, 'Conde', 'skin_t3_conde', 'patente'),
    ('item_skin_3_005', 'skin', 3, 'Duque', 'skin_t3_duque', 'patente'),
    ('item_skin_3_006', 'skin', 3, 'Noturno', 'skin_t3_noturno', 'loja/bau'),
    ('item_skin_3_007', 'skin', 3, 'Ateliê', 'skin_t3_atelie', 'loja/bau'),
    ('item_skin_3_008', 'skin', 3, 'Inverno', 'skin_t3_inverno', 'loja/bau'),
    ('item_skin_4_001', 'skin', 4, 'Armadura Placa', 'skin_t4_armadura_placa', 'loja/bau'),
    ('item_skin_4_002', 'skin', 4, 'Mago Círculo', 'skin_t4_mago_circulo', 'loja/bau'),
    ('item_skin_4_003', 'skin', 4, 'Príncipe', 'skin_t4_principe', 'patente'),
    ('item_skin_4_004', 'skin', 4, 'Rei', 'skin_t4_rei', 'patente'),
    ('item_skin_exclusive_001', 'skin', 4, 'Empreendedor', 'skin_t4_empreendedor', 'loja/bau'),
    ('item_skin_season_001', 'skin', 4, 'O Criador', 'skin_season_criador', 'gm'),
    ('item_skin_5_001', 'skin', 5, 'Soberano', 'skin_t5_soberano', 'patente'),
    ('item_skin_5_002', 'skin', 6, 'Vestido Real', 'skin_t5_vestido_real', 'temporada'),
    ('item_skin_aurora_1_2026', 'skin', 6, 'Guardião Aurora', 'skin_quest_guardiao_aurora', 'missao'),
    ('BASIC', 'ui_skin', 1, 'Tema: Básico Profissional', 'basic', 'loja/bau'),
    ('FROST', 'ui_skin', 3, 'Tema: Gelo Eterno', 'frost', 'loja/bau'),
    ('GOLD', 'ui_skin', 3, 'Tema: Ouro Soberano', 'gold', 'loja/bau'),
    ('AURORA', 'ui_skin', 4, 'Tema: Aurora Boreal', 'aurora', 'loja/bau'),
    ('CYBER', 'ui_skin', 4, 'Tema: Cyberpunk', 'cyber', 'loja/bau'),
    ('EMBER', 'ui_skin', 4, 'Tema: Chama Viva', 'ember', 'loja/bau'),
    ('VOID', 'ui_skin', 5, 'Tema: Vazio Primordial', 'void', 'loja/bau'),
    ('AURORA_I', 'ui_skin', 6, 'Tema: Aurora II', 'aurora_i', 'temporada'),
    ('GENESIS', 'ui_skin', 6, 'Tema: Genesis', 'genesis', 'temporada')
),
apelidos(antigo, novo) as (
  values
    ('insignia_sitrep_s', 'insignia_report_comum'),
    ('insignia_sitrep_a', 'insignia_report_comum'),
    ('insignia_sitrep_b', 'insignia_report_comum'),
    ('insignia_sitrep_c', 'insignia_report_comum'),
    ('default', 'BASIC'),
    ('basic', 'BASIC')
),
-- O inventario pode guardar o id antigo ou o nome do arquivo; o app resolve os
-- dois (resolveItemDef), entao a conta tambem.
linhas as (
  select
    ui.item_id as id_cru,
    coalesce(a.novo, ui.item_id) as id_resolvido,
    lower(regexp_replace(coalesce(a.novo, ui.item_id), '(\.(png|jpe?g|webp))+$', '', 'i')) as arquivo_resolvido
  from public.user_inventory ui
  left join apelidos a on a.antigo = ui.item_id
  where ui.user_id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'
),
posse as (
  select c.*,
    exists (
      select 1 from linhas l
      where l.id_resolvido = c.id
         or (c.arquivo <> '' and l.arquivo_resolvido = c.arquivo)
    ) as tem
  from catalogo c
),
sobra as (
  select distinct l.id_cru
  from linhas l
  where not exists (
    select 1 from catalogo c
    where l.id_resolvido = c.id
       or (c.arquivo <> '' and l.arquivo_resolvido = c.arquivo)
  )
)
select ordem, o_que, detalhe
from (
  select 1 as ordem, 'papel da conta' as o_que,
    coalesce((select up.role from public.user_profiles up
              where up.id = 'e76e2b7f-a771-4738-a10a-30a993ecafeb'), '(perfil nao encontrado)') as detalhe
  union all
  select 2, 'catalogo do app', count(*)::text || ' itens visiveis' from catalogo
  union all
  select 3, 'a conta tem',
    count(*) filter (where tem)::text || ' de ' || count(*)::text
    || ' (linhas no inventario: ' || (select count(*) from linhas)::text || ')'
  from posse
  union all
  select 4, 'faltam: ' || categoria,
    count(*)::text || ' — ' || string_agg(nome || ' T' || tier || ' [' || via || ']', ', ' order by tier, nome)
  from posse
  where not tem
  group by categoria
  union all
  select 5, 'na conta, fora do catalogo',
    count(*)::text || ' — ' || string_agg(id_cru, ', ' order by id_cru)
  from sobra
  having count(*) > 0
  union all
  select 6, 'banco sem o item (public.items)',
    count(*)::text || ' — ' || string_agg(c.id, ', ' order by c.id)
  from catalogo c
  where not exists (select 1 from public.items i where i.id = c.id)
  having count(*) > 0
) resultado
order by ordem, o_que;
