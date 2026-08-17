import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const seasonView = readFileSync(new URL('../views/SeasonView.tsx', import.meta.url), 'utf8');
const seasonDetail = readFileSync(new URL('../components/SeasonDetailModal.tsx', import.meta.url), 'utf8');
const clanDetail = readFileSync(new URL('../components/ClanDetailModal.tsx', import.meta.url), 'utf8');
const gameContext = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const systemChallenges = readFileSync(new URL('../constants/systemChallenges.ts', import.meta.url), 'utf8');
const inventory = readFileSync(new URL('../components/Store/Inventory.tsx', import.meta.url), 'utf8');
const stackableMigration = readFileSync(
  new URL('../supabase/migrations/20260528201500_allow_stackable_honor_inventory.sql', import.meta.url),
  'utf8',
);

// Thresholds were lowered in 1.0.57/1.0.58 (3 arenas -> 1, 7 days -> 5) and the
// player now holds one system challenge at a time instead of three. Title, progress
// maths and UI must keep agreeing with each other.
assert.match(systemChallenges, /title: 'Complete sua primeira arena'/);
assert.match(systemChallenges, /title: 'Cinco dias em movimento'/);
assert.match(seasonView, /clearedArenaCount \* 100/);
assert.match(seasonView, /currentProofStreak \/ 5/);
assert.match(seasonView, /Math\.min\(currentProofStreak, 5\)/);
assert.match(seasonView, /activeSystemQuests[\s\S]*?\.slice\(0, 1\)/);
assert.match(seasonView, /createsArena=\{!isSystemQuest\(selectedQuest\)\}/);

// Accepting a second challenge replaces the first; that swap has to stay visible
// instead of silently dropping the one already in progress.
assert.match(seasonView, /replaced && replaced\.id !== questId/);

assert.match(seasonDetail, /Desafio pessoal/);
assert.match(seasonDetail, /Como concluir/);
// The chest/gold/XP summary still has to reach the detail modal, even though it is
// no longer rendered as the literal "{rewardLabel} + insignia" string.
assert.match(seasonDetail, /const rewardLabel = rewardChest === 'Season'/);
assert.match(seasonDetail, /rewardSummary/);
assert.doesNotMatch(seasonDetail, />Aceitar missao</);
assert.doesNotMatch(seasonDetail, /RESGATAR RECOMPENSA/i);
assert.doesNotMatch(seasonView, /RESGATAR RECOMPENSA/i);
assert.doesNotMatch(clanDetail, /RESGATAR RECOMPENSA/i);
assert.match(clanDetail, /ENTREGANDO RECOMPENSA/);
assert.match(clanDetail, /PRODUCT_FEATURES\.clanMissions && activeTab === 'missoes'/);
assert.match(clanDetail, /if \(!PRODUCT_FEATURES\.clanMissions \|\| !clan\?\.id\) return/);

assert.match(gameContext, /const isStackableHonorItem/);
assert.match(gameContext, /itemId\.startsWith\('insignia_quest_'\)/);
// Every completed mission grants an insignia: the one it names, or the generic
// stackable badge for its tier. The second argument is the stackable flag, so it
// must be true exactly when the generic badge is the one being granted.
assert.match(gameContext, /await grantInventoryItem\(insigniaId, !rewardsInsignia\)/);
assert.match(gameContext, /insignia_quest_master' : 'insignia_quest_incomum'/);
assert.match(gameContext, /automaticChallengeClaimInFlightRef/);
assert.match(gameContext, /PRODUCT_FEATURES\.clanMissions[\s\S]*?filter\(\(quest\) => quest\.type !== 'clan'\)/);
assert.match(gameContext, /completedSeasonQuest[\s\S]*?claimSeasonQuest/);
assert.match(gameContext, /completedSystemChallenge[\s\S]*?claimSystemChallenge/);
assert.match(inventory, /x\{item\.count\}/);
assert.match(stackableMigration, /alter table public\.user_inventory drop constraint/);

console.log('Challenge reward flow regression: staged challenges and stackable badges are wired.');
