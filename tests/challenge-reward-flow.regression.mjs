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

// A MISSAO DOS CINCO DIAS E A SEQUENCIA SAIRAM. Aqui prendemos a AUSENCIA.
//
// O bonus de sequencia foi aposentado porque o foco passou a ser a missao
// individual: exigir dias consecutivos premiava quem tem rotina livre e punia
// quem trabalha por turno — media disponibilidade, nao esforco.
//
// As tres linhas que cobravam o contrario travaram a suite inteira depois da
// remocao. Invertidas, viram a garantia de que nada disso volta por descuido.
assert.doesNotMatch(systemChallenges, /Cinco dias em movimento/);
assert.doesNotMatch(seasonView, /currentProofStreak/);
assert.match(seasonView, /clearedArenaCount \* 100/);
assert.match(seasonView, /activeSystemQuests[\s\S]*?\.slice\(0, 1\)/);
assert.match(seasonView, /createsArena=\{!isSystemQuest\(selectedQuest\)\}/);

// Accepting a second challenge replaces the first; that swap has to stay visible
// instead of silently dropping the one already in progress.
assert.match(seasonView, /replaced && replaced\.id !== questId/);

assert.match(seasonDetail, /Missão pessoal/);
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
// A regra inverteu em 31aa379 e este teste ficou preso na forma antiga, passando
// a cobrar uma linha que o codigo nao tem mais — vermelho sem defeito nenhum.
// Antes era lista de PERMISSAO: so `insignia_quest_*` empilhava. Agora e lista de
// EXCECAO: toda insignia empilha, menos as que sao uma-de-cada. As de missao
// continuam empilhando por nao estarem na excecao, que e o que importa aqui;
// entao o teste passa a fixar a excecao, que e onde mora a decisao.
assert.match(gameContext, /const isOneOfEach = Boolean\(itemDef\?\.isSeasonExclusive\)/);
assert.match(gameContext, /itemId\.startsWith\('insignia_rank_'\)/);
assert.match(gameContext, /itemId\.startsWith\('insignia_season_'\)/);
assert.match(gameContext, /return !isOneOfEach;/);
assert.doesNotMatch(gameContext, /isOneOfEach[\s\S]{0,200}insignia_quest_/);
// A insignia de familia nasce dentro do ritual: prata para missao individual e
// azul-roxa para quest/missao de temporada. Como ela entra em grantedItemIds,
// o mesmo item e concedido ao inventario e exibido no modal.
assert.match(gameContext, /const missionInsigniaId = grant\.origem && grant\.origem !== 'missao'/);
assert.match(gameContext, /\? 'insignia_quest_master'/);
assert.match(gameContext, /: SYSTEM_CHALLENGE_INSIGNIA_ID/);
// A concessao da insignia ganhou uma EXCECAO e o teste tem que prender as duas
// pontas. As missoes iniciais completam sozinhas, nao ocupam o slot e nao pedem
// aceite — dar insignia nelas igualaria o que a pessoa escolheu fazer ao que o
// app fez por ela. Por isso 'semInsignia' existe; e por isso o caminho normal,
// que continua somando a insignia, tambem fica preso aqui.
assert.match(gameContext, /grant\.semInsignia/);
assert.match(gameContext, /\[\.\.\.new Set\(\[\.\.\.\(grant\.itemIds \|\| \[\]\), missionInsigniaId\]\)\]/);
assert.match(gameContext, /automaticChallengeClaimInFlightRef/);
assert.match(gameContext, /PRODUCT_FEATURES\.clanMissions[\s\S]*?filter\(\(quest\) => quest\.type !== 'clan'\)/);
assert.match(gameContext, /completedSeasonQuest[\s\S]*?claimSeasonQuest/);
assert.match(gameContext, /completedSystemChallenge[\s\S]*?claimSystemChallenge/);
assert.match(inventory, /x\{item\.count\}/);
assert.match(stackableMigration, /alter table public\.user_inventory drop constraint/);

console.log('Challenge reward flow regression: staged challenges and stackable badges are wired.');
