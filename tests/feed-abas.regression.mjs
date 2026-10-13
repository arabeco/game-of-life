import assert from 'node:assert/strict';
import { filtrarFeed } from '../utils/feedAbas.ts';

/**
 * AS TRES ABAS DO FEED NAO SE REPETEM (12/10/2026, pedido do Afonso):
 *   - Aliados: voce e seus amigos;
 *   - Grupo: voce e quem e do seu cla;
 *   - Reino: so quem NAO e seu amigo, nem do seu cla, nem voce — o que ja aparece
 *     nas outras abas nao entra de novo.
 * Mais novo primeiro.
 */
const EU = 'eu', AMIGO = 'amigo', COLEGA = 'colega', AMIGO_COLEGA = 'amigo-colega', ESTRANHO = 'estranho';
const post = (id, userId, dia, authorClanName) => ({ id, userId, authorClanName, timestamp: `2026-10-${String(dia).padStart(2, '0')}T12:00:00Z` });
const feed = [
  post('p-eu', EU, 1, 'Lobos'),
  post('p-amigo', AMIGO, 2, 'Corvos'),
  post('p-colega', COLEGA, 3, 'Lobos'),
  post('p-amigo-colega', AMIGO_COLEGA, 4, undefined),
  post('p-estranho', ESTRANHO, 5, 'Corvos'),
  post('p-estranho-2', ESTRANHO, 6, undefined),
];
const ctx = {
  meuId: EU,
  amigos: [{ id: AMIGO, clanName: 'Corvos' }, { id: AMIGO_COLEGA, clanName: 'Lobos' }],
  meuCla: 'Lobos',
};
const ids = (aba, c = ctx) => filtrarFeed(feed, aba, c).map((e) => e.id);

assert.deepEqual(ids('Aliados'), ['p-amigo-colega', 'p-amigo', 'p-eu']);
assert.deepEqual(ids('Grupo'), ['p-amigo-colega', 'p-colega', 'p-eu'], 'amigo que esta no cla conta no Grupo mesmo com post sem nome de cla');
assert.deepEqual(ids('Reino'), ['p-estranho-2', 'p-estranho'], 'o Reino repetia quem ja aparece em Aliados ou Grupo');
console.log('ok - Reino so com quem nao e amigo, nem do cla, nem voce');

// sem cla: o Grupo e so voce, e o colega de antes (cla Lobos) volta a ser "do reino"
const semCla = { ...ctx, meuCla: null };
assert.deepEqual(ids('Grupo', semCla), ['p-eu']);
assert.deepEqual(ids('Reino', semCla), ['p-estranho-2', 'p-estranho', 'p-colega']);
console.log('Feed: as tres abas sem repeticao.');
