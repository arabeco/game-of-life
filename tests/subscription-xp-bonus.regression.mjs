import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CYCLE_XP_BONUS_BY_TIER,
  getCycleXpBonusRate,
  hasPlatinumAccess,
  hasPremiumAccess,
} from '../utils/premiumAccess.ts';

// SEM PAY-TO-WIN (13/10/2026, decisao do Afonso).
//
// Premium e Platinum davam +5% e +10% de EXP no fecho do ciclo. EXP sobe a
// patente, que e status publico (perfil, Feitos, Hall da Fama), e alimenta o cla
// e qualquer ranking futuro: pagar mais = subir mais rapido. Saiu. Os planos
// vendem conforto, visual e leitura; progressao e so do que a pessoa faz.

const futuro = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const passado = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const perfil = (extra = {}) => ({ role: 'player', ...extra });

const gratis = perfil();
const premium = perfil({ isPremium: true, premiumExpiresAt: futuro, subscriptionTier: 'premium' });
const platinum = perfil({ isPremium: true, premiumExpiresAt: futuro, subscriptionTier: 'platinum' });
const expirado = perfil({ isPremium: true, premiumExpiresAt: passado, subscriptionTier: 'platinum' });

for (const [nome, p] of [['gratis', gratis], ['premium', premium], ['platinum', platinum], ['expirado', expirado], ['gm', perfil({ role: 'gm' })]]) {
  assert.equal(getCycleXpBonusRate(p), 0, `${nome} ganhava EXP extra por pagar`);
}
assert.deepEqual(CYCLE_XP_BONUS_BY_TIER, { premium: 0, platinum: 0 });

// --- platinum continua contando como premium para o resto do app ----------
assert.equal(hasPremiumAccess(platinum), true);
assert.equal(hasPlatinumAccess(platinum), true);
assert.equal(hasPremiumAccess(premium), true);
assert.equal(hasPlatinumAccess(premium), false);

// --- e nenhum texto de plano promete EXP -----------------------------------
const lerFonte = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8');
for (const arquivo of ['constants/goldCatalog.ts', 'constants/economy.ts', 'views/SovereignPanelView.tsx', 'components/Store/MembershipStore.tsx']) {
  assert.doesNotMatch(lerFonte(arquivo), /\+\s?(5|10)%\s?(de\s)?(XP|EXP)|\d+% XP legado|bônus de XP|Bônus de legado/i, `${arquivo} ainda vende EXP no plano`);
}

console.log('Sem pay-to-win: nenhum plano da EXP extra, e nenhum texto promete.');

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

// --- mentoria nao e vantagem de plano (13/10/2026) -------------------------
// O servidor cobra o vinculo de todo mundo (75 de ouro, renovacao 40) e nao
// exige Premium desde 20260812002000. A trava no app era sobra.
assert.doesNotMatch(lerFonte('components/ArenaDetailModal.tsx'), /Mentoria exige que o Mentor seja Premium/, 'o app ainda exige Premium para mentoria');
console.log('Mentoria: preco para todos, sem trava de plano.');
