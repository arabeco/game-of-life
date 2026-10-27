import assert from 'node:assert/strict';
import { getArenaCapacitySummary, STANDARD_ARENA_LIMIT } from '../utils/arenaCapacity.ts';

/**
 * O LIMITE DE ARENAS (26/10/2026, decidido com o Afonso).
 *
 * Conta so arena ativa. Arquivar libera a vaga; desarquivar com o limite cheio
 * e barrado (no GameContext, com aviso). Arena de campanha conta como qualquer
 * outra aqui; a da loja ou de mentor vale uma vaga so (campanha-conta-uma-vaga).
 * Arena de missao (temporada ou cla) NAO conta: a missao vem do jogo,
 * e nao pode ser barrada nem ocupar o lugar das arenas da pessoa.
 */
const arena = (id, extra = {}) => ({ id, name: id, isArchived: false, actionIds: [], ...extra });
const assets = [
  { id: 'saude', arenas: [arena('a1'), arena('a2'), arena('arquivada', { isArchived: true }), arena('campanha', { originCodexId: 'c1' })] },
  { id: 'proposito', arenas: [arena('andarilho'), arena('a3')] },
];
const questArenaIds = new Set(['andarilho']);

const r = getArenaCapacitySummary(assets, null, questArenaIds);
assert.equal(r.total, 4, 'conta a1, a2, a3 e a campanha; a arquivada e a de missao ficam fora');
assert.equal(r.limit, STANDARD_ARENA_LIMIT);
assert.equal(r.remaining, STANDARD_ARENA_LIMIT - 4);
console.log('ok - so ativa conta; campanha conta; missao e arquivada nao');

const semMissao = getArenaCapacitySummary(assets, null);
assert.equal(semMissao.total, 5, 'sem a lista de missoes, toda ativa conta (compatibilidade)');
console.log('Limite de arenas: regra conferida.');
