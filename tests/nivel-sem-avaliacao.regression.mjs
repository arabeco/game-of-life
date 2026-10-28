import assert from 'node:assert/strict';
import { nivelOuTraco, temNivel, getDisplayLevel } from '../constants/lifeAreas.ts';

/**
 * QUEM NUNCA AVALIOU A MAESTRIA NAO TEM NIVEL (27/10/2026): nao e 0 nem 10.
 * O texto mostra um traco e a bolinha do avatar nao aparece.
 */
for (const vazio of [undefined, null, 0, NaN]) {
    assert.equal(temNivel(vazio), false);
    assert.equal(nivelOuTraco(vazio), '—');
}
assert.equal(temNivel(18), true);
assert.equal(nivelOuTraco(18), getDisplayLevel(18));
console.log('Nivel sem avaliacao: traco no texto, sem bolinha.');
