export const ECONOMY = {
  currency: {
    gold_to_brl_rate: 10
  },
  
  recycle_values: {
    tier_1: 10,
    tier_2: 30,
    tier_3: 100,
    tier_4: 300,
    tier_5: 1000
  },
  
  craft_costs: {
    tier_1: 40,
    tier_2: 120,
    tier_3: 400,
    tier_4: 1200,
    tier_5: 4000
  },
  
  chest_bonus_fragments: {
    incomum: { min: 5, max: 15 },
    ciclo: { min: 10, max: 30 },
    radiante: { min: 30, max: 80 },
    epico: { min: 80, max: 200 },
    season: { min: 200, max: 500 }
  },
  
  pity_system: {
    ciclo: 15,
    radiante: 10,
    epico: 8,
    season: 5
  },
  
  loot_tables: {
    incomum: { tier_1: 70, tier_2: 25, tier_3: 5 },
    ciclo: { tier_1: 40, tier_2: 35, tier_3: 20, tier_4: 5 },
    radiante: { tier_2: 45, tier_3: 40, tier_4: 10, tier_5: 5 },
    epico: { tier_3: 50, tier_4: 35, tier_5: 15 },
    season: { tier_4: 60, tier_5: 30, season_exclusive: 10 }
  },
  
  gold_packs: [
    {
      id: 'pack_pepita',
      name: 'Pepita',
      price_brl: 5.00,
      gold_base: 50,
      bonus: 0,
      total: 50,
      icon: '🪙'
    },
    {
      id: 'pack_barra_pq',
      name: 'Barra Pequena',
      price_brl: 10.00,
      gold_base: 100,
      bonus: 10,
      total: 110,
      icon: '💰'
    },
    {
      id: 'pack_barra_gd',
      name: 'Barra Grande',
      price_brl: 20.00,
      gold_base: 200,
      bonus: 30,
      total: 230,
      icon: '🏦'
    },
    {
      id: 'pack_cofre',
      name: 'Cofre',
      price_brl: 50.00,
      gold_base: 500,
      bonus: 100,
      total: 600,
      icon: '🏰'
    },
    {
      id: 'pack_tesouro',
      name: 'Tesouro',
      price_brl: 100.00,
      gold_base: 1000,
      bonus: 300,
      total: 1300,
      icon: '👑'
    }
  ],

  gold_products: {
    premium_monthly: {
        id: 'premium_30d',
        name: 'Premium (30 dias)',
        cost: 200,
        benefits: [
            "XP +50% em todas atividades",
            "1 Baú Radiante grátis por semana",
            "Emblema Premium exclusivo",
            "Acesso antecipado a itens de Season"
        ]
    },
    codex: 150,
    boost_24h: 50,
    boost_7d: 200
  }
};
