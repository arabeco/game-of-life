export const ECONOMY = {
  currency: {
    gold_to_brl_rate: 10,
  },

  recycle_values: {
    tier_1: 10,
    tier_2: 30,
    tier_3: 100,
    tier_4: 300,
    tier_5: 1000,
    // Mitico: so temporada, fora da escada normal.
    tier_6: 3000,
  },

  craft_costs: {
    tier_1: 40,
    tier_2: 120,
    tier_3: 400,
    tier_4: 1200,
    tier_5: 4000,
    tier_6: 12000,
  },

  chest_bonus_fragments: {
    incomum: { min: 5, max: 15 },
    ciclo: { min: 10, max: 30 },
    raro: { min: 30, max: 80 },
    epico: { min: 80, max: 200 },
    lendario: { min: 200, max: 500 },
    season: { min: 200, max: 500 },
  },

  pity_system: {
    ciclo: 15,
    raro: 10,
    epico: 8,
    lendario: 5,
    season: 5,
  },

  chest_gold_bonus: {
    epico: { chance_pct: 20, amount: 5 },
    lendario: { chance_pct: 35, amount: 10 },
  },

  loot_tables: {
    incomum: { tier_1: 70, tier_2: 25, tier_3: 5 },
    ciclo: { tier_1: 40, tier_2: 35, tier_3: 20, tier_4: 5 },
    raro: { tier_2: 45, tier_3: 40, tier_4: 10, tier_5: 5 },
    epico: { tier_3: 50, tier_4: 35, tier_5: 15 },
    lendario: { tier_4: 60, tier_5: 40 },
    season: { tier_4: 60, tier_5: 40 },
  },

  gold_packs: [
    { id: 'pack_pepita', name: 'Pepita', price_brl: 5.0, gold_base: 50, bonus: 0, total: 50, icon: 'P' },
    { id: 'pack_barra_pq', name: 'Barra Pequena', price_brl: 10.0, gold_base: 100, bonus: 10, total: 110, icon: '$' },
    { id: 'pack_barra_gd', name: 'Barra Grande', price_brl: 20.0, gold_base: 200, bonus: 30, total: 230, icon: 'BG' },
    { id: 'pack_cofre', name: 'Cofre', price_brl: 50.0, gold_base: 500, bonus: 100, total: 600, icon: 'CF' },
    { id: 'pack_tesouro', name: 'Tesouro', price_brl: 100.0, gold_base: 1000, bonus: 300, total: 1300, icon: 'T' },
  ],

  gold_products: {
    premium_monthly: {
      id: 'premium_30d',
      name: 'Premium (30 dias)',
      cost: 200,
      benefits: [
        'Até 15 arenas ativas (vs 10 no plano base)',
        'Fundos premium de perfil',
        'Cena do legado com 50% off',
        'Oráculo: todos os tons de fala',
        'Oráculo: escolha os temas e peça card na hora',
        'Bônus de legado: +5% XP no ciclo',
        '1 campanha curta grátis por renovação',
      ],
    },
    platinum_monthly: {
      id: 'platinum_30d',
      name: 'Platinum (30 dias)',
      cost: 500,
      benefits: [
        'Todas as vantagens do Premium, com o dobro do bônus de XP (+10%)',
        'Até 30 arenas ativas',
        'Cena do legado com 70% off',
        '1 campanha média grátis por renovação',
        'Todos os planos de fundo',
        'Todas as aparências premium',
        '1 baú raro + 1 baú lendário por renovação',
      ],
    },
    codex: 150,
    boost_24h: 50,
    boost_7d: 200,
  },
};

