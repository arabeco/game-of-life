import assert from 'node:assert/strict';
import { getCampaignPriceForProfile, getLegacyProjectionScenePrice } from '../utils/premiumAccess.ts';

/**
 * OS PLANOS DE 28/10/2026 (com o Afonso).
 * Campanha: Premium -20%, Platinum -40%. Cena do Legado: 50 para todos (sem
 * desconto por plano); o Platinum ganha 1 cena por mes, como credito.
 */
const futuro = new Date(Date.now() + 86400000).toISOString();
const premium = { isPremium: true, subscriptionTier: 'premium', premiumExpiresAt: futuro };
const platinum = { isPremium: true, subscriptionTier: 'platinum', premiumExpiresAt: futuro };

assert.equal(getCampaignPriceForProfile(100, null), 100);
assert.equal(getCampaignPriceForProfile(100, premium), 80);
assert.equal(getCampaignPriceForProfile(100, platinum), 60);
assert.equal(getCampaignPriceForProfile(25, premium), 20);
assert.equal(getCampaignPriceForProfile(25, platinum), 15);

const jaUsouAPrimeira = { legacyProjectionSceneFreeClaimedAt: '2026-10-01T00:00:00Z' };
assert.equal(getLegacyProjectionScenePrice({ ...jaUsouAPrimeira }), 50);
assert.equal(getLegacyProjectionScenePrice({ ...premium, ...jaUsouAPrimeira }), 50);
assert.equal(getLegacyProjectionScenePrice({ ...platinum, ...jaUsouAPrimeira }), 50);
assert.equal(getLegacyProjectionScenePrice({ ...platinum, ...jaUsouAPrimeira, legacyProjectionSceneCredits: 1 }), 0);
console.log('Planos de 28/10: campanha -20/-40 e cena do Legado sem desconto por plano.');
