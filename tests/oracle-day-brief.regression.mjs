import assert from 'node:assert/strict';
import { buildOracleDayBrief } from '../utils/oracleDayBrief.ts';

const now = new Date(2026, 8, 10, 12);
const done = { id: 'done', date: '2026-09-10', startTime: 600, completed: true };
const pending = { id: 'pending', date: '2026-09-10', startTime: 720, completed: false };
assert.match(buildOracleDayBrief([], now).content, /ainda não há atividades/);
assert.match(buildOracleDayBrief([done], now).content, /planejamento do dia está em dia/);
assert.match(buildOracleDayBrief([done, pending, done], now).content, /concluiu 1 de 2/);
assert.match(buildOracleDayBrief([done, {...pending, date: '2026-09-11'}], now).content, /concluiu a atividade registrada/);
const dawn = new Date(2026, 8, 11, 2);
assert.match(buildOracleDayBrief([done, {...pending, date: '2026-09-11', startTime: 120}], dawn).content, /concluiu 1 de 2/);
assert.match(buildOracleDayBrief([done], new Date(2026, 8, 11, 4)).content, /ainda não há atividades/);
assert.equal(buildOracleDayBrief([pending], now).quickActions[0].kind, 'open_planner');
console.log('Oracle day: empty, completed, pending, duplicates, future dates and 4h rollover passed.');
