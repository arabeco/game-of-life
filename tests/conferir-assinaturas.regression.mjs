import assert from 'node:assert/strict';
import { assinaturasParaConferir, hojeConfere } from '../utils/conferirAssinaturas.ts';

/**
 * A RENOVACAO AUTOMATICA (28/10/2026).
 *
 * Ao abrir no Android, o app pega as compras ativas da Play e manda conferir
 * no servidor so as ASSINATURAS do Glyph (o ouro e consumivel, tem outro
 * caminho). A conferencia roda no maximo a cada 6 horas por pessoa.
 */
const compra = (products, extra = {}) => ({
  platform: 'android', purchaseState: 'purchased', orderId: 'GPA.1', purchaseToken: 'tok-' + products.join('-'),
  acknowledged: true, consumed: false, packageName: 'life.glyph.app', products, needsServerReconciliation: false, ...extra,
});

const lista = assinaturasParaConferir([
  compra(['premium_30d']),
  compra(['pack_gold_2']),
  compra(['platinum_30d']),
  compra(['premium_30d'], { purchaseState: 'pending', purchaseToken: 'tok-pendente' }),
]);
assert.deepEqual(lista.map((item) => [item.productId, item.tier]), [['premium_30d', 'premium'], ['platinum_30d', 'platinum']]);
assert.equal(lista[0].purchaseToken, 'tok-premium_30d');

const agora = Date.parse('2026-10-28T12:00:00Z');
assert.equal(hojeConfere(null, agora), true, 'nunca conferiu');
assert.equal(hojeConfere(agora - 2 * 3600e3, agora), false, 'conferiu ha 2 horas');
assert.equal(hojeConfere(agora - 7 * 3600e3, agora), true, 'conferiu ha 7 horas');
// Plano vencido ou vencendo em menos de 1 dia: confere em toda abertura. Senao
// o mes renovado pela Play ficava ate 6 horas aparecendo como vencido.
const dia = 24 * 3600e3;
assert.equal(hojeConfere(agora - 1 * 3600e3, agora, new Date(agora - 60e3).toISOString()), true, 'plano vencido confere ja');
assert.equal(hojeConfere(agora - 1 * 3600e3, agora, new Date(agora + 5 * 60e3).toISOString()), true, 'vence em 5 minutos confere ja');
assert.equal(hojeConfere(agora - 1 * 3600e3, agora, new Date(agora + 10 * dia).toISOString()), false, 'vence em 10 dias espera as 6 horas');
assert.equal(hojeConfere(agora - 1 * 3600e3, agora, null), false, 'sem plano espera as 6 horas');
console.log('Conferir assinaturas: so as do Glyph, compradas, a cada 6 horas, ou em toda abertura perto do vencimento.');
