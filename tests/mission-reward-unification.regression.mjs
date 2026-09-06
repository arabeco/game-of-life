import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Um ritual so para entregar recompensa de missao.
 *
 * Havia quatro resgates escritos em dias diferentes — jornada de temporada,
 * missao de temporada, desafio de sistema e pacto de arena — e eles tinham
 * divergido em silencio:
 *
 *  - Os dois de temporada detectavam SUBIDA DE PATENTE, davam a insignia da
 *    patente e abriam o modal PLAYER_RANK_UP. Os outros dois chamavam applyExp,
 *    que nao detecta patente nenhuma: bater a patente fechando um desafio ou um
 *    pacto nao dava insignia e nao mostrava tela.
 *  - applyExp ainda deposita o XP no ciclo quando ha ciclo ativo e soma o bonus
 *    de assinatura; o caminho de temporada escrevia direto no perfil, sem bonus.
 *    A mesma recompensa valia coisas diferentes conforme quem a entregasse.
 *
 * Este teste le o codigo e prende o que foi unificado. E leitura de fonte, nao
 * execucao: nao prova que o baú caiu no inventario, prova que os caminhos nao
 * voltaram a se separar.
 */

const source = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');

const corpo = (nome, ate) => {
  const inicio = source.indexOf(`const ${nome} = `);
  assert.ok(inicio >= 0, `${nome} deve existir`);
  const fim = source.indexOf(ate, inicio);
  assert.ok(fim > inicio, `o fim de ${nome} deve ser identificavel`);
  return source.slice(inicio, fim);
};

// --- o ritual existe; a patente tem uma unica autoridade ------------------
const ritual = corpo('grantMissionReward', '\n    const claimSeasonQuest');
assert.match(ritual, /completedSeasonMissions/, 'o ritual marca a missao como concluida');
assert.match(ritual, /addChest/, 'o ritual entrega o bau');
assert.doesNotMatch(ritual, /NOBILITY_RANKS\.find/, 'o ritual nao pode duplicar a deteccao de patente');
assert.doesNotMatch(ritual, /PLAYER_RANK_UP/, 'o ritual nao pode abrir um segundo modal de patente');

const rankObserver = source.slice(
  source.indexOf('const oldRankId = userProfile.nobility.rankId'),
  source.indexOf('const updateUserProfile = ', source.indexOf('const oldRankId = userProfile.nobility.rankId')),
);
assert.match(rankObserver, /RANK_UP_INSIGNIA_ID/, 'o observador unico precisa entregar a insignia acumulativa');
assert.match(rankObserver, /RANK_REWARDS/, 'o observador unico precisa entregar os cosmeticos da patente');
assert.match(rankObserver, /PLAYER_RANK_UP/, 'o observador unico precisa abrir a celebracao da patente');

// O XP do ritual vai ao perfil, nao ao ciclo: e o numero que o modal promete
// na hora. Se voltar a passar por applyExp, o valor exibido e o creditado
// divergem de novo.
assert.doesNotMatch(ritual, /applyExp\(/, 'o ritual nao pode delegar o XP para applyExp');
assert.match(ritual, /grant\.origem && grant\.origem !== 'missao'/, 'o ritual precisa distinguir a familia da temporada');
assert.match(ritual, /insignia_quest_master/, 'quest e missao de temporada precisam receber a insignia azul-roxa');
assert.match(ritual, /SYSTEM_CHALLENGE_INSIGNIA_ID/, 'missao individual precisa receber a insignia prata');
assert.match(ritual, /grantedItemIds/, 'a insignia precisa entrar na mesma lista concedida e mostrada no modal');

// --- os quatro resgates usam o ritual -------------------------------------
const resgates = [
  ['claimSeasonQuest', '\n    const claimSeasonMission'],
  ['claimSeasonMission', '\n    const claimSystemChallenge'],
  ['claimArenaPact', '\n    const '],
  ['claimSystemChallenge', '\n    const '],
];

for (const [nome, ate] of resgates) {
  const fn = corpo(nome, ate);
  assert.match(fn, /grantMissionReward\(/, `${nome} precisa passar pelo ritual unico`);
  assert.doesNotMatch(
    fn,
    /setAchievementUnlocked\(/,
    `${nome} nao pode abrir a tela de conquista por conta propria`,
  );
}

// --- nenhum resgate volta a usar applyExp ---------------------------------
// applyExp continua valendo para credito avulso fora de missao; o que nao pode
// e um resgate de missao passar por ele, porque ai a patente some.
for (const [nome, ate] of resgates) {
  const fn = corpo(nome, ate);
  assert.doesNotMatch(fn, /applyExp\(/, `${nome} nao pode pagar XP de missao por applyExp`);
}

// --- missao que entrega item ainda paga XP --------------------------------
// reward_value carrega o premio principal e nem sempre e numero: quando a missao
// entrega insignia (o Selo da Genesis), o XP mora em reward_exp. Ler so o
// primeiro fazia a missao pagar zero sem avisar.
const claimMission = corpo('claimSeasonMission', '\n    const claimSystemChallenge');
assert.match(
  claimMission,
  /reward_exp/,
  'claimSeasonMission precisa cair em reward_exp quando reward_value nao e numero',
);
assert.doesNotMatch(claimMission, /insignia_quest_incomum/, 'missao de temporada nao pode receber a insignia prata');

const claimQuest = corpo('claimSeasonQuest', '\n    const claimSeasonMission');
assert.match(claimQuest, /origem: 'quest_temporada'/, 'quest de temporada precisa selecionar a familia azul-roxa');
assert.doesNotMatch(claimQuest, /insignia_quest_incomum/, 'quest de temporada nao pode receber a insignia prata');

// --- o Selo da Genesis e uma missao de item com XP proprio ----------------
const seasonSource = readFileSync(new URL('../constants/seasonContent.ts', import.meta.url), 'utf8');
const selo = seasonSource.slice(
  seasonSource.indexOf("id: 'sm_genesis_meta_1'"),
  seasonSource.indexOf("id: 'sm_aurora_meta_1'"),
);
assert.match(selo, /reward_type: 'item_id'/);
assert.match(selo, /reward_exp: \d+/, 'o Selo precisa declarar o XP em reward_exp');
assert.match(selo, /sourceQuestIds: \['quest-wanderer', 'quest-scholar', 'quest-warrior'\]/,
  'o Selo aponta para as tres jornadas reais da Genesis');

console.log('Mission reward unification: um ritual, quatro resgates, uma autoridade de patente.');
