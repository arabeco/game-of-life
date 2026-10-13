import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filtrarFeed } from '../utils/feedAbas.ts';

/**
 * DUAS ABAS NO FEED, SEM REPETICAO (12/10/2026, pedido do Afonso):
 *   - Aliados: voce e seus amigos;
 *   - Reino: todo o resto. Quem e do seu cla e nao e amigo fica aqui (depois
 *     pode ganhar preferencia na ordem).
 * A aba Grupo saiu: amigo que tambem e do cla aparecia em duas abas.
 * Mais novo primeiro.
 */
const EU = 'eu', AMIGO = 'amigo', COLEGA = 'colega', ESTRANHO = 'estranho';
const post = (id, userId, dia, authorClanName) => ({ id, userId, authorClanName, timestamp: `2026-10-${String(dia).padStart(2, '0')}T12:00:00Z` });
const feed = [
  post('p-eu', EU, 1, 'Lobos'),
  post('p-amigo', AMIGO, 2, 'Lobos'),
  post('p-colega', COLEGA, 3, 'Lobos'),
  post('p-estranho', ESTRANHO, 5, 'Corvos'),
];
const ctx = { meuId: EU, amigos: [{ id: AMIGO }] };
const ids = (aba) => filtrarFeed(feed, aba, ctx).map((e) => e.id);

assert.deepEqual(ids('Aliados'), ['p-amigo', 'p-eu']);
assert.deepEqual(ids('Reino'), ['p-estranho', 'p-colega'], 'o Reino repetia voce ou seus amigos, ou deixava de fora o colega de cla que nao e amigo');
console.log('ok - Aliados e Reino sem repeticao');

const tela = readFileSync(new URL('../views/HallOfFameView.tsx', import.meta.url), 'utf8');
assert.doesNotMatch(tela, /'Grupo'/, 'a aba Grupo ainda aparece');
console.log('Feed: duas abas, sem repeticao.');
