import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ARENA_PACT_REWARDS } from '../utils/arenaPacts.ts';

/**
 * Uma regua so para toda recompensa em XP.
 *
 * O XP no Glyph e minuto de acao: uma acao de 30 minutos vale ~30 XP. O premio
 * de uma missao e BONUS por cima do que a acao ja pagou, entao nao pode ser
 * multiplo do esforco.
 *
 * As faixas sao tres:
 *   100  marco de um toque      (criar o primeiro ciclo, instalar campanha)
 *   300  esforco sustentado     (5 dias em movimento, 20 acoes, pacto medio)
 *   500  o maior do jogo        (concluir um ciclo, fechar uma jornada)
 *
 * Este teste existe porque as reguas JA divergiram: as missoes de sistema iam
 * de 500 a 3500, as jornadas de temporada a 2250, e os pactos de arena nasceram
 * em 300/750/1500 — tres tabelas para a mesma moeda, cada uma escrita em um dia
 * diferente. Aqui elas ficam presas uma na outra.
 */

const FAIXAS = [100, 300, 500];

const arquivo = (caminho) => readFileSync(new URL(caminho, import.meta.url), 'utf8');

const foraDaEscala = (valores) => valores.filter((entry) => !FAIXAS.includes(entry.xp));

// --- missoes de sistema ----------------------------------------------------
const systemSource = arquivo('../constants/systemChallenges.ts');
const systemRewards = [...systemSource.matchAll(/title: '([^']+)',[\s\S]*?rewards: \{ xp: (\d+)/g)]
  .map((match) => ({ nome: match[1], xp: Number(match[2]) }));

assert.ok(systemRewards.length >= 7, 'as missoes de sistema devem ser lidas');
assert.deepEqual(
  foraDaEscala(systemRewards),
  [],
  'missao de sistema fora da escala 100/300/500',
);

// --- jornadas da temporada -------------------------------------------------
const seasonSource = arquivo('../constants/seasonContent.ts');
const genesisStart = seasonSource.indexOf("'season-genesis-0': {");
const genesisEnd = seasonSource.indexOf("'season-aurora-1-2026': {", genesisStart);
assert.ok(genesisStart >= 0 && genesisEnd > genesisStart, 'o bloco da Genesis deve ser identificavel');
const genesis = seasonSource.slice(genesisStart, genesisEnd);

const questRewards = [...genesis.matchAll(/title: '([^']+)',[\s\S]*?rewards: \{ xp: (\d+)/g)]
  .map((match) => ({ nome: match[1], xp: Number(match[2]) }));

assert.equal(questRewards.length, 3, 'a Genesis tem tres jornadas');
assert.deepEqual(
  foraDaEscala(questRewards),
  [],
  'jornada da temporada fora da escala 100/300/500',
);

// --- pactos de arena -------------------------------------------------------
const pactRewards = Object.entries(ARENA_PACT_REWARDS)
  .map(([faixa, reward]) => ({ nome: `pacto ${faixa}`, xp: reward.xp }));

assert.deepEqual(
  foraDaEscala(pactRewards),
  [],
  'pacto de arena fora da escala 100/300/500',
);

// A escada do pacto tem de subir junto com a dificuldade.
assert.ok(ARENA_PACT_REWARDS.leve.xp < ARENA_PACT_REWARDS.media.xp);
assert.ok(ARENA_PACT_REWARDS.media.xp < ARENA_PACT_REWARDS.alta.xp);

// --- nenhuma fonte pode passar do teto ------------------------------------
const tudo = [...systemRewards, ...questRewards, ...pactRewards];
const teto = Math.max(...tudo.map((entry) => entry.xp));
assert.equal(teto, 500, `nenhuma recompensa passa de 500 XP; achei ${teto}`);

// --- o selo da temporada tambem obedece -----------------------------------
const selo = seasonSource.match(/id: 'sm_genesis_meta_1'[\s\S]*?reward_exp: (\d+)/);
assert.ok(selo, 'o Selo da Genesis deve existir');
assert.ok(
  FAIXAS.includes(Number(selo[1])),
  `o Selo da Genesis paga ${selo[1]} XP, fora da escala`,
);

console.log(`XP scale regression: ${tudo.length} recompensas em tres fontes, todas em 100/300/500.`);
