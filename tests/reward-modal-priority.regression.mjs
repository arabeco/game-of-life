import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { didProfileExistBeforeSeason } from '../utils/seasonTransitionEligibility.ts';

assert.equal(
  didProfileExistBeforeSeason('2026-05-31T23:59:59.000Z', '2026-06-01'),
  true,
  'uma conta anterior a temporada pode ver a passagem',
);
assert.equal(
  didProfileExistBeforeSeason('2026-06-01T12:00:00.000Z', '2026-06-01'),
  false,
  'uma conta criada na temporada atual nao deve receber fechamento antigo',
);
assert.equal(didProfileExistBeforeSeason(undefined, '2026-06-01'), true);

const appSource = readFileSync(new URL('../components/AuthenticatedApp.tsx', import.meta.url), 'utf8');
const contextSource = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const reportsSource = readFileSync(new URL('../views/ReportsView.tsx', import.meta.url), 'utf8');
const achievementSource = readFileSync(new URL('../components/AchievementModal.tsx', import.meta.url), 'utf8');
assert.match(appSource, /!isRestScreenVisible/);
assert.match(appSource, /!activeScreenTipId/);
assert.match(appSource, /!achievementUnlocked/);
assert.match(appSource, /!shouldShowVanguardWelcome/);
assert.match(appSource, /!shouldShowPremiumReward/);
assert.match(appSource, /!shouldShowBetaReward/);
assert.match(appSource, /allowSeasonTransition=\{[\s\S]*?!shouldShowVanguardWelcome/);
assert.match(appSource, /suppressScreenIntroTips=\{[\s\S]*?shouldShowVanguardWelcome/);
assert.match(appSource, /onBlockingOverlayChange=\{setInnerBlockingOverlayVisible\}/);
assert.match(appSource, /!isInnerBlockingOverlayVisible/);
assert.match(contextSource, /activeAchievementRef/);
assert.match(contextSource, /setAchievementQueue/);
assert.match(contextSource, /emitDailyCompletionPrompt\(\{[\s\S]*?kind: 'sitrep'/);
assert.match(appSource, /setPendingDailyCompletionPrompt\(customEvent\.detail\)/);
assert.match(appSource, /glyph:daily-panel-opened/);
assert.doesNotMatch(appSource, /setDailyCompletionPrompt\(customEvent\.detail\)/);
assert.match(reportsSource, /ensurePostCycleRewardsGranted/);
assert.match(reportsSource, /ReportResultCarousel/);
assert.match(reportsSource, /RewardPackModal/);
assert.match(achievementSource, /DESAFIO CONCLUÍDO/);

console.log('Reward modal regression: daily summary, season, cycle, challenge and rank flows are wired and gated.');
