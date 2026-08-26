export const GOLD_PACK_CATALOG = [
    { id: 'pack_gold_1', name: 'Pepita', priceBrl: 5, goldBase: 50, bonusGold: 0, totalGold: 50, icon: '\u{1FA99}' },
    { id: 'pack_gold_2', name: 'Barra Pequena', priceBrl: 10, goldBase: 100, bonusGold: 10, totalGold: 110, icon: '\u{1F9C8}' },
    { id: 'pack_gold_3', name: 'Barra Grande', priceBrl: 20, goldBase: 200, bonusGold: 30, totalGold: 230, icon: '\u{1F9F1}' },
    { id: 'pack_gold_4', name: 'Cofre', priceBrl: 50, goldBase: 500, bonusGold: 100, totalGold: 600, icon: '\u{1F3E6}' },
    { id: 'pack_gold_5', name: 'Tesouro', priceBrl: 100, goldBase: 1000, bonusGold: 300, totalGold: 1300, icon: '\u{1F48E}' },
] as const;

export const GOLD_PREMIUM_PRODUCT = {
    id: 'premium_30d',
    name: 'Premium (30 dias)',
    tier: 'premium',
    priceGold: 200,
    priceBrl: 17.9,
    benefits: [
        'Até 15 arenas ativas (vs 10 no plano base)',
        'Fundos premium de perfil e ativos',
        'Oráculo: todos os tons de fala',
        'Bônus de legado: +5% XP no ciclo',
        'Cena do legado com 50% off',
        '1 baú raro por renovação',
    ],
} as const;

export const GOLD_PLATINUM_PRODUCT = {
    id: 'platinum_30d',
    name: 'Platinum (30 dias)',
    tier: 'platinum',
    priceGold: 500,
    priceBrl: 44.9,
    benefits: [
        'Todas as vantagens do Premium, com o dobro do bônus de XP (+10%)',
        'Até 30 arenas ativas',
        'Cena do legado com 70% off',
        '1 campanha média grátis por renovação',
        'Todos os planos de fundo e aparências premium',
        '1 baú raro + 1 baú lendário por renovação',
    ],
} as const;

export const GOLD_BOOST_PRODUCTS = [
    {
        id: 'boost_xp_24h',
        name: 'Boost XP +5% (24h)',
        priceGold: 50,
        durationHours: 24,
        multiplier: 1.05,
        icon: '\u{1F680}',
        description: 'Aumenta os ganhos em 5% por 1 dia.',
    },
    {
        id: 'boost_xp_7d',
        name: 'Boost XP +10% (7 dias)',
        priceGold: 200,
        durationHours: 168,
        multiplier: 1.1,
        icon: '\u{1F4C5}',
        description: 'Aumenta os ganhos em 10% por uma semana.',
    },
] as const;

export const GOLD_CLAN_CREATION_COST = 100;

export const ACTIVE_GOLD_ITEM_PRICE_BY_ID = {
    item_border_1_002: 10,
    item_skin_1_003: 15,
    item_glyph_1_002: 18,
    item_plate_1_001: 18,
    item_glyph_1_003: 20,
    item_banner_disciplinado: 20,
    item_border_2_001: 30,
    item_skin_2_003: 35,
    item_banner_popular: 40,
    item_plate_2_001: 42,
    item_banner_t2_veterano: 55,
    item_orb_2_003: 60,
    item_skin_3_001: 70,
    item_border_3_001: 80,
    item_skin_3_002: 85,
    item_banner_imparavel: 90,
    item_skin_3_003: 95,
    item_plate_3_001: 95,
    item_border_t3_mistico: 110,
    item_banner_t3_mistico: 110,
    item_orb_3_001: 125,
    GOLD: 135,
    FROST: 135,
    item_border_t3_transcendente: 130,
    item_glyph_3_002: 135,
    EMBER: 220,
    CYBER: 220,
    AURORA: 220,
    item_border_t4_celestial: 180,
    item_banner_lendaviva: 180,
    item_skin_4_001: 190,
    item_banner_t4_celestial: 195,
    item_plate_4_001: 200,
    item_glyph_4_002: 210,
    item_border_t4_guardia: 220,
    item_banner_t4_guardia: 220,
    item_border_t4_oraculo: 250,
    item_banner_t4_oraculo: 250,
    item_banner_t4_transcendente: 280,
    VOID: 420,
    item_plate_5_001: 340,
    item_plate_5_002: 360,
    item_glyph_5_002: 420,
    item_orb_5_002: 500,
} as const;

export const ACTIVE_GOLD_STORE_ITEMS = [
    { id: 'item_border_1_002', name: 'Disciplinado', category: 'border', tier: 1, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_1_002 },
    { id: 'item_skin_1_003', name: 'Gym Rat', category: 'skin', tier: 1, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_1_003 },
    { id: 'item_glyph_1_002', name: 'Manuscrito', category: 'glyph', tier: 1, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_glyph_1_002 },
    { id: 'item_plate_1_001', name: 'Placa Madeira', category: 'plate', tier: 1, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_1_001 },
    { id: 'item_glyph_1_003', name: 'Lajota', category: 'glyph', tier: 1, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_glyph_1_003 },
    { id: 'item_banner_disciplinado', name: 'Disciplinado', category: 'banner', tier: 1, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_disciplinado },
    { id: 'item_border_2_001', name: 'Popular', category: 'border', tier: 2, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_2_001 },
    { id: 'item_skin_2_003', name: 'Acadêmico', category: 'skin', tier: 2, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_2_003 },
    { id: 'item_banner_popular', name: 'Popular', category: 'banner', tier: 2, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_popular },
    { id: 'item_plate_2_001', name: 'Placa Pedra', category: 'plate', tier: 2, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_2_001 },
    { id: 'item_banner_t2_veterano', name: 'Veterano', category: 'banner', tier: 2, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t2_veterano },
    { id: 'item_orb_2_003', name: 'Orbe Tempestade', category: 'orb', tier: 2, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_orb_2_003 },
    { id: 'item_skin_3_001', name: 'Nômade', category: 'skin', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_3_001 },
    { id: 'item_border_3_001', name: 'Imparável', category: 'border', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_3_001 },
    { id: 'item_skin_3_002', name: 'Alquimista', category: 'skin', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_3_002 },
    { id: 'item_banner_imparavel', name: 'Imparável', category: 'banner', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_imparavel },
    { id: 'item_skin_3_003', name: 'Híbrido', category: 'skin', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_3_003 },
    { id: 'item_plate_3_001', name: 'Placa Prata', category: 'plate', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_3_001 },
    { id: 'item_border_t3_mistico', name: 'Místico', category: 'border', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_t3_mistico },
    { id: 'item_banner_t3_mistico', name: 'Místico', category: 'banner', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t3_mistico },
    { id: 'item_orb_3_001', name: 'Orbe de Ouro', category: 'orb', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_orb_3_001 },
    { id: 'GOLD', name: 'Tema: Ouro Soberano', category: 'ui_skin', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.GOLD },
    { id: 'FROST', name: 'Tema: Gelo Eterno', category: 'ui_skin', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.FROST },
    { id: 'item_border_t3_transcendente', name: 'Transcendente', category: 'border', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_t3_transcendente },
    { id: 'item_glyph_3_002', name: 'Mecanismo Bronze', category: 'glyph', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_glyph_3_002 },
    { id: 'EMBER', name: 'Tema: Chama Viva', category: 'ui_skin', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.EMBER },
    { id: 'CYBER', name: 'Tema: Cyberpunk', category: 'ui_skin', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.CYBER },
    { id: 'AURORA', name: 'Tema: Aurora Boreal', category: 'ui_skin', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.AURORA },
    { id: 'item_border_t4_celestial', name: 'Celestial', category: 'border', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_t4_celestial },
    { id: 'item_banner_lendaviva', name: 'Lenda Viva', category: 'banner', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_lendaviva },
    { id: 'item_skin_4_001', name: 'Armadura Placa', category: 'skin', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_4_001 },
    { id: 'item_banner_t4_celestial', name: 'Celestial', category: 'banner', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t4_celestial },
    { id: 'item_plate_4_001', name: 'Placa Roxa', category: 'plate', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_4_001 },
    { id: 'item_glyph_4_002', name: 'Cristal Branco', category: 'glyph', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_glyph_4_002 },
    { id: 'item_border_t4_guardia', name: 'Guardião', category: 'border', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_t4_guardia },
    { id: 'item_banner_t4_guardia', name: 'Guardião', category: 'banner', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t4_guardia },
    { id: 'item_border_t4_oraculo', name: 'Oráculo', category: 'border', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_border_t4_oraculo },
    { id: 'item_banner_t4_oraculo', name: 'Oráculo', category: 'banner', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t4_oraculo },
    { id: 'item_banner_t4_transcendente', name: 'Transcendente', category: 'banner', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t4_transcendente },
    { id: 'VOID', name: 'Tema: Vazio Primordial', category: 'ui_skin', tier: 5, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.VOID },
    { id: 'item_plate_5_001', name: 'Placa Ouro', category: 'plate', tier: 5, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_5_001 },
    { id: 'item_plate_5_002', name: 'Placa Gelo', category: 'plate', tier: 5, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_plate_5_002 },
    { id: 'item_glyph_5_002', name: 'Artefato Sombrio', category: 'glyph', tier: 5, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_glyph_5_002 },
    { id: 'item_orb_5_002', name: 'Orbe Soberano', category: 'orb', tier: 5, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_orb_5_002 },
] as const;

export const ACTIVE_GOLD_STORE_ITEM_IDS = ACTIVE_GOLD_STORE_ITEMS.map((item) => item.id);

export const GOLD_CODEX_CATALOG = [
    { id: 'despertar_de_ferro', name: 'Despertar de Ferro', priceGold: 200, source: 'sql' },
    { id: 'reset_dopaminergico', name: 'Reset Dopaminérgico', priceGold: 350, source: 'sql' },
    { id: 'foco_blindado', name: 'Foco Blindado', priceGold: 500, source: 'sql' },
    { id: 'logistica_de_vanguarda', name: 'Logística de Vanguarda', priceGold: 350, source: 'sql' },
    { id: 'pacto_de_soberania', name: 'O Pacto de Soberania', priceGold: 400, source: 'sql' },
] as const;

export const GOLD_MECHANIC_CATALOG = [
    { id: 'create_clan', name: 'Criar grupo', priceGold: GOLD_CLAN_CREATION_COST, source: 'sql' },
    { id: 'legacy_projection_scene', name: 'Gerar a cena do legado', priceGold: 50, source: 'sql' },
    // O preco mora no VINCULO, nao nas acoes de dentro. Os numeros de verdade
    // estao em constants/relationshipLinks.ts e em public.relationship_link_price;
    // aqui ficam so para a vitrine de mecanicas nao mentir sobre o que custa.
    { id: 'relationship_link_mentoria', name: 'Vinculo de mentoria (30 dias)', priceGold: 100, source: 'sql' },
    { id: 'relationship_link_parceria', name: 'Vinculo de parceria (30 dias)', priceGold: 50, source: 'sql' },
    { id: 'relationship_link_competicao', name: 'Vinculo de competição (30 dias)', priceGold: 50, source: 'sql' },
    { id: 'relationship_link_renewal', name: 'Renovar vínculo (metade do preço)', priceGold: 25, source: 'sql' },
    { id: 'mentor_codex_forge', name: 'Forjar campanha nova para pupilo', priceGold: 100, source: 'sql' },
    { id: 'codex_share_external', name: 'Gerar link externo de campanha', priceGold: 50, source: 'sql' },
    { id: 'codex_share_in_app', name: 'Enviar campanha por @nickname', priceGold: 50, source: 'sql' },
] as const;

export const GOLD_CATALOG_NOTES = [
    'Pedido de amizade não custa ouro.',
    'Não existe mais compra separada de slot de criação. A compra ativa já libera o uso.',
    'Não existe mais compra separada de capacidade social. O catálogo ativo não lista slots.',
    'Nenhum item entregue por patente entra na loja de ouro.',
    'A vitrine ativa prioriza bordas, skins e banners, com apoio de glifos, placas e orbes.',
    'Empreendedor, Fundador e Fênix Dourada seguem fora da loja ativa por enquanto.',
] as const;

export const UNIFIED_GOLD_CATALOG = {
    packs: GOLD_PACK_CATALOG,
    premium: GOLD_PREMIUM_PRODUCT,
    platinum: GOLD_PLATINUM_PRODUCT,
    boosts: GOLD_BOOST_PRODUCTS,
    storeItems: ACTIVE_GOLD_STORE_ITEMS,
    codexCatalog: GOLD_CODEX_CATALOG,
    mechanics: GOLD_MECHANIC_CATALOG,
    notes: GOLD_CATALOG_NOTES,
} as const;

export const getGoldBoostProduct = (id: string) => GOLD_BOOST_PRODUCTS.find((boost) => boost.id === id);

export const getGoldMembershipProduct = (id: string) =>
    [GOLD_PREMIUM_PRODUCT, GOLD_PLATINUM_PRODUCT].find((product) => product.id === id);

export const getGoldMembershipProductByTier = (tier?: string | null) =>
    [GOLD_PREMIUM_PRODUCT, GOLD_PLATINUM_PRODUCT].find((product) => product.tier === tier);

export const getGoldMechanicPrice = (id: string, fallback = 0) =>
    GOLD_MECHANIC_CATALOG.find((entry) => entry.id === id)?.priceGold ?? fallback;

