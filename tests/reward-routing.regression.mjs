import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Quebra de linha normalizada.
//
// Com core.autocrlf a copia de trabalho vem em CRLF, e uma ancora escrita com
// quebra de linha simples nunca casaria — o teste falharia por formato de
// arquivo, nao por roteamento de recompensa, que e o que ele existe para
// vigiar.
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const context = read('contexts/GameContext.tsx');

const body = (start, end) => {
  const from = context.indexOf(start);
  const to = context.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `trecho nao encontrado: ${start}`);
  return context.slice(from, to);
};

// As quatro origens de missao entregam por um ritual. Nenhuma delas concede
// o mesmo item ou abre a mesma celebracao por fora.
for (const [start, end] of [
  ['const claimSeasonQuest = ', '\n    const claimSeasonMission'],
  ['const claimSeasonMission = ', '\n    const claimSystemChallenge'],
  ['const claimSystemChallenge = ', '\n    useEffect('],
  ['const claimArenaPact = ', '\n\n\n    const taskPool'],
]) {
  const source = body(start, end);
  assert.match(source, /grantMissionReward\(/, `${start} perdeu o ritual unico`);
  assert.doesNotMatch(source, /setAchievementUnlocked\(/, `${start} voltou a abrir modal por fora`);
}

const mission = body('const claimSeasonMission = ', '\n    const claimSystemChallenge');
assert.doesNotMatch(mission, /grantInventoryItem\(/, 'missao de temporada voltou a conceder item duas vezes');
assert.doesNotMatch(mission, /await addChest\(/, 'missao de temporada voltou a conceder bau duas vezes');

const ritual = body('const grantMissionReward = ', '\n    const claimSeasonQuest');
assert.doesNotMatch(ritual, /PLAYER_RANK_UP/, 'ritual de missao voltou a competir com o observador de patente');
assert.doesNotMatch(ritual, /RANK_REWARDS/, 'ritual de missao voltou a conceder os cosmeticos de patente');

const rank = body('const oldRankId = userProfile.nobility.rankId', '\n    const updateUserProfile = ');
assert.match(rank, /RANK_REWARDS/, 'observador de patente perdeu a tabela canonica');
assert.match(rank, /grantInventoryItem\(reward\.itemId, true\)/, 'cosmeticos da patente voltaram a gerar toast antes do modal');
assert.doesNotMatch(rank, /grantInventoryItem\(rankInsigniaId/, 'insignia exclusiva voltou a ser concedida antes da propria tabela');
assert.doesNotMatch(rank, /Itens de legado integrados/, 'toast voltou a repetir o conteudo do modal de patente');

// Componentes antigos sem chamada nao devem reaparecer.
assert.equal(fs.existsSync(path.join(root, 'components', 'MissionCompletionModal.tsx')), false);
assert.equal(fs.existsSync(path.join(root, 'components', 'ChestOpeningModal.tsx')), false);

const cycle = read('utils/chestRewardPresentation.ts');
assert.doesNotMatch(cycle, /metricCards\.push\(\{ label: 'Baú'/, 'bau do ciclo voltou a aparecer duas vezes');
assert.match(cycle, /imageUrl: getChestArtUrl/, 'bau do ciclo perdeu a propria arte');

// A ativacao de plano separa entregas reais de vantagens. Bau e cosmetico usam
// o tratamento de item; capacidade, Oraculo e descontos usam faixas de beneficio.
const membership = body('const buildMembershipRewardPayload = ', '\n\n    const unlockPremiumPack');
assert.match(membership, /imageUrl: getChestArtUrl\(chestType\)/, 'bau do plano perdeu o PNG real');
assert.match(membership, /itemIds: grantedItemIds/, 'cosmeticos do plano deixaram de ser itens');
assert.match(membership, /activeBenefits: isPlatinum/, 'vantagens do plano deixaram de usar faixas proprias');
assert.doesNotMatch(membership, /Sem ficha|Sem crédito/, 'ausencia de credito voltou a ser exibida como recompensa');

const rewardBody = read('components/RewardPackBody.tsx');
assert.match(rewardBody, /benefitToneRgb/, 'faixas de vantagens perderam sua familia cromatica');
assert.match(rewardBody, /typeof rawBenefit === 'string'/, 'payload legado de vantagens deixou de ser aceito');

console.log('reward-routing: uma entrega por evento, uma autoridade de patente, sem modais mortos.');

// ===================================================================
// UM SLOT SO PARA A MISSAO INDIVIDUAL
//
// Ela pode ser DE ARENA ("Salvar Academia") ou DE SISTEMA ("Conclua 20 acoes").
// Eram dois slots paralelos: dava para estar com as duas ao mesmo tempo e o
// Oraculo falar de uma so. Missao INICIAL nao entra na conta — ela nao se
// aceita, acontece.
// ===================================================================

const seasonView = read('views/SeasonView.tsx');
const oracleChat = read('components/OracleChat.tsx');

// A conta de quem ocupa o slot ignora a inicial e a ja concluida.
assert.match(context, /const missaoDeSistemaAtiva = useMemo/, 'o contexto sabe quem ocupa o slot');
assert.match(context, /!desafio\.inicial && aceitas\.has\(desafio\.id\) && !concluidas\.has\(desafio\.id\)/,
  'inicial e concluida ficam fora da conta do slot');

// Os dois lados se recusam, e os dois oferecem a saida.
assert.match(context, /if \(missaoDeSistemaAtiva && !substituir\)/, 'a de arena respeita o slot ocupado pela de sistema');
assert.match(seasonView, /if \(activeArenaPact\) \{[\s\S]{0,220}?return;/, 'a de sistema respeita o slot ocupado pela de arena');

// Trocar limpa a anterior em vez de acumular.
assert.match(context, /if \(missaoDeSistemaAtiva && substituir\)[\s\S]{0,320}?acceptedSystemChallenges/,
  'substituir tira a de sistema do slot');

// E o botao do Oraculo tem de dizer QUEM ocupa: mostrar "Escolher missao" com o
// slot cheio faria a pessoa tocar para levar uma recusa.
assert.match(oracleChat, /activeArenaPact \|\| missaoDeSistemaAtiva/, 'o botao reconhece as duas familias');
assert.match(oracleChat, /missaoDeSistemaAtiva\s*\n?\s*\?\s*missaoDeSistemaAtiva\.title/, 'o botao mostra o titulo da de sistema');

console.log('Slot: uma missao individual por vez, de arena ou de sistema, com saida nos dois lados.');
