import assert from 'node:assert/strict';
import { getArenaCapacitySummary, gruposQueContamUmaVaga } from '../utils/arenaCapacity.ts';

/**
 * CAMPANHA DA LOJA OU DE MENTOR CONTA COMO UMA VAGA (27/10/2026, com o Afonso).
 *
 * Cada fase da campanha vira uma arena, mas a campanha comprada na loja (ou
 * dada por um mentor) ocupa UMA vaga no limite, quantas fases tiver. A que a
 * pessoa monta para si mesma (ou ganha de um amigo) continua contando uma vaga
 * por arena — senao viraria o jeito de fugir do limite.
 */
const arena = (id, extra = {}) => ({ id, name: id, isArchived: false, actionIds: [], ...extra });
const assets = [
  { id: 'trabalho', arenas: [arena('solta'), arena('loja-1'), arena('loja-2'), arena('loja-3'), arena('propria-1'), arena('propria-2')] },
  { id: 'saude', arenas: [arena('mentor-1'), arena('mentor-2'), arena('amigo-1'), arena('amigo-2')] },
];
const campanhas = [
  { id: 'c-loja', status: 'active', sourceCodexId: 'x-loja', arenaIds: ['loja-1', 'loja-2', 'loja-3'] },
  { id: 'c-propria', status: 'active', sourceCodexId: 'x-propria', arenaIds: ['propria-1', 'propria-2'] },
  { id: 'c-mentor', status: 'active', sourceCodexId: 'x-mentor', arenaIds: ['mentor-1', 'mentor-2'] },
  { id: 'c-amigo', status: 'active', sourceCodexId: 'x-amigo', arenaIds: ['amigo-1', 'amigo-2'] },
];
const codex = [
  { id: 'x-loja', catalog_id: 'cat-1', source_type: 'catalog' },
  { id: 'x-propria', catalog_id: null, source_type: 'created' },
  { id: 'x-mentor', catalog_id: null, source_type: 'gift_in_app', mentor_relationship_link_id: 'vinculo-1' },
  { id: 'x-amigo', catalog_id: null, source_type: 'gift_link' },
];

const grupos = gruposQueContamUmaVaga(campanhas, codex);
assert.deepEqual(grupos.map((g) => g.join(',')).sort(), ['loja-1,loja-2,loja-3', 'mentor-1,mentor-2'], 'so loja e mentor viram grupo');

const sem = getArenaCapacitySummary(assets, null);
assert.equal(sem.total, 10, 'sem grupos, toda arena ativa conta (compatibilidade)');

const com = getArenaCapacitySummary(assets, null, undefined, grupos);
// solta 1 + loja 1 + propria 2 + mentor 1 + amigo 2
assert.equal(com.total, 7, 'loja e mentor contam 1 cada; propria e de amigo contam por arena');
console.log('ok - loja e mentor ocupam uma vaga; propria e de amigo, uma por arena');

// Fase arquivada ou finalizada nao segura a vaga sozinha; o grupo some quando todas saem.
const tudoGuardado = assets.map((a) => ({ ...a, arenas: a.arenas.map((x) => (x.id.startsWith('loja') ? { ...x, isArchived: true } : x)) }));
assert.equal(getArenaCapacitySummary(tudoGuardado, null, undefined, grupos).total, 6, 'campanha da loja guardada libera a vaga');
const umaAberta = assets.map((a) => ({ ...a, arenas: a.arenas.map((x) => (x.id === 'loja-1' || x.id === 'loja-2' ? { ...x, completedAt: '2026-10-20T00:00:00Z' } : x)) }));
assert.equal(getArenaCapacitySummary(umaAberta, null, undefined, grupos).total, 7, 'com uma fase ainda ativa, a campanha segue ocupando 1');

// Campanha concluida ou arquivada nao vira grupo (as arenas dela ja estao fora ou contam soltas).
const encerradas = gruposQueContamUmaVaga(campanhas.map((c) => ({ ...c, status: 'completed' })), codex);
assert.equal(encerradas.length, 0);
console.log('Campanha conta uma vaga: regra conferida.');
