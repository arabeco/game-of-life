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

assert.match(systemChallenges, /title: 'Completar 3 Arenas'/);
assert.match(systemChallenges, /title: 'Sete Dias em Movimento'/);
assert.match(seasonView, /clearedArenaCount \/ 3/);
assert.match(seasonView, /currentProofStreak \/ 7/);
assert.match(seasonView, /pendingSystemQuests\.slice\(0, 3\)/);
assert.match(seasonView, /createsArena=\{!isSystemQuest\(selectedQuest\)\}/);

assert.match(seasonDetail, /Desafio pessoal/);
assert.match(seasonDetail, /Como concluir/);
assert.match(seasonDetail, /\{rewardLabel\} \+ insignia/);
assert.doesNotMatch(seasonDetail, />Aceitar missao</);
assert.doesNotMatch(seasonDetail, /RESGATAR RECOMPENSA/i);
assert.doesNotMatch(seasonView, /RESGATAR RECOMPENSA/i);
assert.doesNotMatch(clanDetail, /RESGATAR RECOMPENSA/i);
assert.match(clanDetail, /ENTREGANDO RECOMPENSA/);
assert.match(clanDetail, /PRODUCT_FEATURES\.clanMissions && activeTab === 'missoes'/);
assert.match(clanDetail, /if \(!PRODUCT_FEATURES\.clanMissions \|\| !clan\?\.id\) return/);

assert.match(gameContext, /const isStackableHonorItem/);
assert.match(gameContext, /itemId\.startsWith\('insignia_quest_'\)/);
assert.match(gameContext, /await grantInventoryItem\(genericInsigniaId, true\)/);
assert.match(gameContext, /automaticChallengeClaimInFlightRef/);
assert.match(gameContext, /PRODUCT_FEATURES\.clanMissions[\s\S]*?filter\(\(quest\) => quest\.type !== 'clan'\)/);
assert.match(gameContext, /completedSeasonQuest[\s\S]*?claimSeasonQuest/);
assert.match(gameContext, /completedSystemChallenge[\s\S]*?claimSystemChallenge/);
assert.match(inventory, /x\{item\.count\}/);
assert.match(stackableMigration, /alter table public\.user_inventory drop constraint/);

console.log('Challenge reward flow regression: staged challenges and stackable badges are wired.');
