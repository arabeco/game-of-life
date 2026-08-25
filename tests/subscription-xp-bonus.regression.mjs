import assert from 'node:assert/strict';
import {
  CYCLE_XP_BONUS_BY_TIER,
  getCycleXpBonusPercentLabel,
  getCycleXpBonusRate,
  hasPlatinumAccess,
  hasPremiumAccess,
} from '../utils/premiumAccess.ts';

// O bonus era um `0.1` solto no GameContext atras de hasPremiumAccess — que
// responde true para platinum tambem. Os dois tiers pagos recebiam o mesmo
// bonus e o Platinum nao tinha vantagem nenhuma de progressao.
// A escada agora e 0 / 5% / 10%, e este teste existe para que ela nao volte a
// achatar.

const futuro = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const passado = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const perfil = (extra = {}) => ({ role: 'player', ...extra });

const gratis = perfil();
const premium = perfil({ isPremium: true, premiumExpiresAt: futuro, subscriptionTier: 'premium' });
const platinum = perfil({ isPremium: true, premiumExpiresAt: futuro, subscriptionTier: 'platinum' });
const expirado = perfil({ isPremium: true, premiumExpiresAt: passado, subscriptionTier: 'platinum' });

// --- a escada existe e tem a ordem certa ----------------------------------
assert.equal(getCycleXpBonusRate(gratis), 0);
assert.equal(getCycleXpBonusRate(premium), 0.05);
assert.equal(getCycleXpBonusRate(platinum), 0.10);

assert.ok(
  getCycleXpBonusRate(platinum) > getCycleXpBonusRate(premium),
  'Platinum precisa render mais que Premium — foi exatamente isso que faltava antes',
);
assert.ok(
  getCycleXpBonusRate(premium) > getCycleXpBonusRate(gratis),
  'Premium precisa render mais que o plano gratuito',
);

// --- assinatura vencida nao paga bonus ------------------------------------
assert.equal(getCycleXpBonusRate(expirado), 0, 'assinatura expirada nao rende bonus');
assert.equal(getCycleXpBonusRate(null), 0);
assert.equal(getCycleXpBonusRate(undefined), 0);

// --- platinum continua contando como premium para o resto do app ----------
// Varias telas checam hasPremiumAccess para liberar recurso; se platinum caisse
// fora dali, o tier de cima perderia funcionalidade do de baixo.
assert.equal(hasPremiumAccess(platinum), true);
assert.equal(hasPlatinumAccess(platinum), true);
assert.equal(hasPremiumAccess(premium), true);
assert.equal(hasPlatinumAccess(premium), false);

// --- staff enxerga como platinum ------------------------------------------
const staff = perfil({ role: 'gm' });
if (hasPremiumAccess(staff)) {
  assert.equal(getCycleXpBonusRate(staff), 0.10, 'staff equivale a platinum');
}

// --- o rotulo da vitrine sai do mesmo numero do calculo -------------------
// Antes o texto vivia solto em 8 arquivos e podia divergir do codigo.
assert.equal(getCycleXpBonusPercentLabel('premium'), '5%');
assert.equal(getCycleXpBonusPercentLabel('platinum'), '10%');
assert.equal(
  getCycleXpBonusPercentLabel('premium'),
  `${Math.round(CYCLE_XP_BONUS_BY_TIER.premium * 100)}%`,
);

// --- o calculo aplicado sobre uma base real -------------------------------
const baseXp = 1000;
assert.equal(Math.round(baseXp * getCycleXpBonusRate(gratis)), 0);
assert.equal(Math.round(baseXp * getCycleXpBonusRate(premium)), 50);
assert.equal(Math.round(baseXp * getCycleXpBonusRate(platinum)), 100);

console.log('Subscription XP bonus regression: escada 0 / 5% / 10% e vitrine presa ao calculo.');

// --- descontos: o tier de cima sempre paga menos ---------------------------
// O Platinum ganhava UMA cena de legado por renovacao e, gasto o voucher,
// voltava a pagar o mesmo que o Premium. Voucher de uso unico nao sustenta um
// tier que custa 2,5x; desconto permanente sim. Mesma logica da campanha.
const {
  getCampaignPriceForProfile,
  getLegacyProjectionScenePrice,
  CAMPAIGN_DISCOUNT_BY_TIER,
  LEGACY_PROJECTION_DISCOUNT_BY_TIER,
} = await import('../utils/premiumAccess.ts');

// campanha de 100
assert.equal(getCampaignPriceForProfile(100, gratis), 100);
assert.equal(getCampaignPriceForProfile(100, premium), 100, 'campanha: Premium ainda paga cheio');
assert.equal(getCampaignPriceForProfile(100, platinum), 80, 'campanha: Platinum paga 20% menos');
assert.equal(getCampaignPriceForProfile(100, expirado), 100, 'assinatura vencida nao desconta');

// cena de legado de 50
assert.equal(getLegacyProjectionScenePrice(gratis, 50), 50);
assert.equal(getLegacyProjectionScenePrice(premium, 50), 25);
assert.equal(getLegacyProjectionScenePrice(platinum, 50), 15, 'Platinum paga menos que Premium, sempre');
assert.equal(getLegacyProjectionScenePrice(expirado, 50), 50);

// a escada nunca inverte
assert.ok(
  LEGACY_PROJECTION_DISCOUNT_BY_TIER.platinum > LEGACY_PROJECTION_DISCOUNT_BY_TIER.premium,
  'Platinum nao pode descontar menos que Premium na cena de legado',
);
assert.ok(
  CAMPAIGN_DISCOUNT_BY_TIER.platinum >= CAMPAIGN_DISCOUNT_BY_TIER.premium,
  'Platinum nao pode descontar menos que Premium na campanha',
);

// preco nunca vira zero por desconto: gratis so com credito, que e outra porta
assert.ok(getCampaignPriceForProfile(1, platinum) >= 1);
assert.ok(getLegacyProjectionScenePrice(platinum, 1) >= 0);

console.log('Descontos: Platinum paga menos que Premium em campanha e cena de legado, sempre.');
