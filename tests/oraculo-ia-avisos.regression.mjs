import assert from 'node:assert/strict';
import { avisoDoOraculo } from '../utils/oraculoIaAvisos.ts';

/**
 * OS AVISOS DO ORACULO COM IA, NA VOZ DELE (03/11/2026, com o Afonso).
 *
 * Sem internet, erro e conversas esgotadas viram uma fala do Oraculo no chat,
 * nao um aviso solto. So o esgotado do gratis leva o botao do Premium.
 */
const semInternet = avisoDoOraculo('SEM_INTERNET', { gratis: true });
assert.match(semInternet.texto, /internet/i);
assert.match(semInternet.texto, /não contou|não gastou/i, 'deixa claro que nao gastou');
assert.equal(semInternet.premium, false);

const falhou = avisoDoOraculo('FALHOU', { gratis: false });
assert.match(falhou.texto, /de novo/i);
assert.equal(falhou.premium, false);

const acabouGratis = avisoDoOraculo('LIMITE', { gratis: true, limite: 1 });
assert.match(acabouGratis.texto, /amanhã/i);
assert.match(acabouGratis.texto, /Premium/);
assert.equal(acabouGratis.premium, true, 'gratis esgotado mostra o Premium');

const acabouPago = avisoDoOraculo('LIMITE', { gratis: false, limite: 5 });
assert.match(acabouPago.texto, /5 conversas/);
assert.doesNotMatch(acabouPago.texto, /Premium/, 'quem ja paga nao recebe propaganda');
assert.equal(acabouPago.premium, false);

console.log('Avisos do Oraculo com IA: sem internet, erro e esgotado, na voz dele.');
