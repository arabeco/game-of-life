import assert from 'node:assert/strict';
import { datasDaAcao, diasValidos, horarioSugerido, inicioDaFaseQueAbriu, modeloTemAgenda } from '../utils/agendaDaCampanha.ts';

/**
 * A AGENDA DA CAMPANHA (27/10/2026).
 *
 * Cada acao diz o dia dela dentro da fase; ao iniciar, a fase 1 cai a partir
 * do dia escolhido e as seguintes a partir do dia depois de abrir.
 */
assert.deepEqual(datasDaAcao('2026-10-27', [1, 3, 5]), ['2026-10-27', '2026-10-29', '2026-10-31']);
assert.deepEqual(datasDaAcao('2026-10-30', [1, 3]), ['2026-10-30', '2026-11-01'], 'vira o mes');
assert.deepEqual(datasDaAcao('2026-12-31', [2]), ['2027-01-01'], 'vira o ano');
assert.deepEqual(datasDaAcao('2026-10-27', undefined), [], 'acao sem dia nao agenda');
assert.deepEqual(diasValidos([3, 1, 3, 0, -2, 2.5, '4']), [1, 3, 4], 'ignora repetido, zero, negativo e fracao');
console.log('ok - os dias da fase viram datas a partir do inicio');

assert.equal(horarioSugerido({ scheduledStartTime: 420 }), 420, 'o horario da acao manda');
assert.equal(horarioSugerido({ context: { timeOfDay: 'night' } }), 21 * 60 + 30);
assert.equal(horarioSugerido({ context: { timeOfDay: 'morning' } }), 7 * 60);
assert.equal(horarioSugerido({}), 9 * 60, 'sem nada, 09:00');
console.log('ok - horario sugerido pela acao ou pelo momento do dia');

assert.equal(modeloTemAgenda({ levels: [{ actions: [{ name: 'a' }] }] }), false);
assert.equal(modeloTemAgenda({ levels: [{ actions: [{ name: 'a' }] }, { actions: [{ name: 'b', dias: [2] }] }] }), true);
assert.equal(inicioDaFaseQueAbriu('2026-10-31'), '2026-11-01', 'fase que abriu comeca no dia seguinte');
console.log('Agenda da campanha: datas, horarios e fases conferidos.');
