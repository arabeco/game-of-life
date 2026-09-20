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

  /**
   * Forjar SEM escolher custa 60% do preco de escolher.
   *
   * Antes as duas formas custavam igual — a forja aceita categoria (sorteio no
   * patamar) e item exato, e getCraftCost so olhava o patamar. Com o mesmo
   * preco, ninguem sorteia: escolher e estritamente melhor, entao a opcao
   * aleatoria existia na tela sem nunca ter razao para ser usada.
   *
   * Com desconto, a forja passa a ter uma decisao: pagar menos e aceitar o que
   * vier, ou pagar cheio e levar o que quer.
   */
  random_craft_discount: 0.6,

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

/**
 * O preco em fragmentos de uma campanha casual. SEM USO — nenhuma tela chama.
 *
 * FRAGMENTO NAO COMPRA MAIS CAMPANHA, e a razao esta em duas tabelas deste
 * arquivo. O mesmo cosmetico custa 15 de ouro ou 40 de fragmento na forja, o
 * que fixa o cambio em ~2,7 fragmentos por ouro; e ouro vale R$ 0,10. Nessa
 * regua, o que o app dava de graca era:
 *
 *   bau lendario   200-500 fragmentos  =  R$  7,40 a 18,50
 *   duplicado t5      1000             =  R$ 37,00
 *   CAMPANHA          22-42            =  R$  0,81 a 1,55
 *
 * Uma campanha — conteudo estruturado de semanas — saia por menos que o
 * cosmetico mais barato do jogo, pago com moeda que chove de bau. Enquanto
 * fragmento comprar o que dinheiro compra, qualquer taxa de cunhagem vira taxa
 * de cambio, e o farm ganha sempre: e de graca, e o tempo da pessoa nao entra
 * na conta dela.
 *
 * O corte e POR NATUREZA, e nao por preco. Encarecer puniria o jogador novo e
 * nao incomodaria o veterano com 3000 fragmentos parados. Entao:
 *
 *   fragmento  ->  forja e reciclagem. A moeda do "transformei o repetido em
 *                  algo meu", fechada em si.
 *   ouro        ->  conteudo. Campanha se paga em ouro ou vem no premium.
 *
 * Isso tambem deixa o bau em paz. Bau e caixa de recompensa aleatoria e por
 * isso nao se vende — e o que a regulacao mira. Nao sendo vendido, ele nao
 * precisa valer DINHEIRO: precisa ser gostoso de abrir, o que cosmetico e
 * fragmento de forja resolvem.
 *
 * Fica aqui, e nao apagada, porque a capacidade continua no servidor: o
 * buyCodexWithFragments segue no contexto e price_fragments segue no catalogo.
 * Se a campanha voltar a ter preco em fragmento, que seja por decisao.
 */
export const getCasualCampaignFragmentCost = (durationDays: number): number => {
    if (durationDays >= 21) return 42;
    if (durationDays >= 14) return 34;
    if (durationDays >= 10) return 28;
    return 22;
};
