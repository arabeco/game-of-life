export const GOLD_PACK_CATALOG = [
    { id: 'pack_gold_1', name: 'Pepita', priceBrl: 5, goldBase: 50, bonusGold: 0, totalGold: 50, icon: '\u{1FA99}' },
    { id: 'pack_gold_2', name: 'Barra Pequena', priceBrl: 10, goldBase: 100, bonusGold: 10, totalGold: 110, icon: '\u{1F9C8}' },
    { id: 'pack_gold_3', name: 'Barra Grande', priceBrl: 20, goldBase: 200, bonusGold: 30, totalGold: 230, icon: '\u{1F9F1}' },
    { id: 'pack_gold_4', name: 'Cofre', priceBrl: 50, goldBase: 500, bonusGold: 100, totalGold: 600, icon: '\u{1F3E6}' },
    { id: 'pack_gold_5', name: 'Tesouro', priceBrl: 100, goldBase: 1000, bonusGold: 300, totalGold: 1300, icon: '\u{1F48E}' },
] as const;

export const GOLD_PREMIUM_PRODUCT = {
    id: 'premium_30d',
    name: 'Premium Soberano (30 dias)',
    priceGold: 200,
    benefits: [
        'Dossiês ampliados (6 slots vs 3)',
        'Deep Focus Audio: 9 faixas exclusivas',
        'Oráculo: todos os modos (Tático, Reflexivo...)',
        'Bônus de Legado: +10% XP em tudo',
        'Renovação com baú raro e cosméticos da temporada se faltarem',
    ],
} as const;

export const GOLD_BOOST_PRODUCTS = [
    {
        id: 'boost_xp_24h',
        name: 'Boost XP 2x (24h)',
        priceGold: 50,
        durationHours: 24,
        icon: '\u{1F680}',
        description: 'Dobra os ganhos por 1 dia.',
    },
    {
        id: 'boost_xp_7d',
        name: 'Boost XP 2x (7 dias)',
        priceGold: 200,
        durationHours: 168,
        icon: '\u{1F4C5}',
        description: 'Dobra os ganhos por uma semana.',
    },
] as const;

export const GOLD_CLAN_CREATION_COST = 100;

export const ACTIVE_GOLD_ITEM_PRICE_BY_ID = {
    item_skin_1_003: 5,
    item_skin_2_003: 9,
    item_orb_2_003: 12,
    item_skin_3_001: 15,
    item_banner_imparavel: 18,
    item_skin_3_002: 22,
    item_skin_3_003: 26,
    item_orb_3_001: 29,
    item_banner_t3_mistico: 32,
    item_banner_lendaviva: 40,
    item_banner_t4_oraculo: 48,
    item_skin_4_001: 50,
} as const;

export const ACTIVE_GOLD_STORE_ITEMS = [
    { id: 'item_skin_1_003', name: 'Gym Rat', category: 'skin', tier: 1, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_1_003 },
    { id: 'item_skin_2_003', name: 'Acadêmico', category: 'skin', tier: 2, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_2_003 },
    { id: 'item_orb_2_003', name: 'Orbe Tempestade', category: 'orb', tier: 2, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_orb_2_003 },
    { id: 'item_skin_3_001', name: 'Nômade', category: 'skin', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_3_001 },
    { id: 'item_banner_imparavel', name: 'Imparável', category: 'banner', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_imparavel },
    { id: 'item_skin_3_002', name: 'Alquimista', category: 'skin', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_3_002 },
    { id: 'item_skin_3_003', name: 'Híbrido', category: 'skin', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_3_003 },
    { id: 'item_orb_3_001', name: 'Orbe de Ouro', category: 'orb', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_orb_3_001 },
    { id: 'item_banner_t3_mistico', name: 'Místico', category: 'banner', tier: 3, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t3_mistico },
    { id: 'item_banner_lendaviva', name: 'Lenda Viva', category: 'banner', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_lendaviva },
    { id: 'item_banner_t4_oraculo', name: 'Oráculo', category: 'banner', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_banner_t4_oraculo },
    { id: 'item_skin_4_001', name: 'Armadura Placa', category: 'skin', tier: 4, priceGold: ACTIVE_GOLD_ITEM_PRICE_BY_ID.item_skin_4_001 },
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
    { id: 'relationship_invite_mentoria', name: 'Convite de mentoria', priceGold: 100, source: 'sql' },
    { id: 'relationship_invite_parceria', name: 'Convite de parceria', priceGold: 50, source: 'sql' },
    { id: 'relationship_invite_competicao', name: 'Convite de competição', priceGold: 50, source: 'sql' },
    { id: 'mentor_linked_arena', name: 'Nova arena vinculada de mentoria', priceGold: 50, source: 'sql' },
    { id: 'partnership_linked_arena', name: 'Mostrar arena para parceiro', priceGold: 50, source: 'sql' },
    { id: 'mentor_codex_forge', name: 'Forjar campanha nova para pupilo', priceGold: 100, source: 'sql' },
    { id: 'codex_share_external', name: 'Gerar link externo de campanha', priceGold: 50, source: 'sql' },
    { id: 'codex_share_in_app', name: 'Enviar campanha por @nickname', priceGold: 50, source: 'sql' },
] as const;

export const GOLD_CATALOG_NOTES = [
    'Pedido de amizade não custa ouro.',
    'Não existe mais compra separada de slot de criação. A compra ativa já libera o uso.',
    'Não existe mais compra separada de capacidade social. O catálogo ativo não lista slots.',
    'Empreendedor, Fundador e Fênix Dourada ficaram arquivados fora do catálogo ativo.',
] as const;

export const UNIFIED_GOLD_CATALOG = {
    packs: GOLD_PACK_CATALOG,
    premium: GOLD_PREMIUM_PRODUCT,
    boosts: GOLD_BOOST_PRODUCTS,
    storeItems: ACTIVE_GOLD_STORE_ITEMS,
    codexCatalog: GOLD_CODEX_CATALOG,
    mechanics: GOLD_MECHANIC_CATALOG,
    notes: GOLD_CATALOG_NOTES,
} as const;

export const getGoldBoostProduct = (id: string) => GOLD_BOOST_PRODUCTS.find((boost) => boost.id === id);

export const getGoldMechanicPrice = (id: string, fallback = 0) =>
    GOLD_MECHANIC_CATALOG.find((entry) => entry.id === id)?.priceGold ?? fallback;
