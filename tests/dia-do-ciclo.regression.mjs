import assert from 'node:assert/strict';
import { getCycleTimingSummary } from '../utils/dateUtils.ts';
import { getOperationalDateString } from '../utils/operationalDay.js';

// Segunda e o dia 1, mesmo sem nenhum dia encerrado para avaliar o ritmo.
for (const [date, day, elapsed] of [
  ['2026-10-05', 1, 0],
  ['2026-10-06', 2, 1],
  ['2026-10-07', 3, 2],
  ['2026-10-11', 7, 6],
  ['2026-10-12', 7, 7],
]) {
  const timing = getCycleTimingSummary('2026-10-05', '2026-10-11', date);
  assert.equal(timing.statusLabel, `Dia ${day}/7`);
  assert.equal(timing.elapsedDays, elapsed);
  assert.equal(timing.timeProgress, elapsed / 7 * 100);
}
assert.equal(getCycleTimingSummary('2026-10-05', '2026-10-11', '2026-10-04').statusLabel, 'Começa amanhã');
assert.equal(getCycleTimingSummary('2026-10-05', '2026-10-11', '2026-10-04').timeProgress, 0);
assert.equal(getCycleTimingSummary('2026-10-05', '2026-10-05', '2026-10-05').statusLabel, 'Dia 1/1');
assert.equal(getCycleTimingSummary('2026-10-05', '2026-10-05', '2026-10-05').timeProgress, 0);
for (const [hour, minute, expected] of [[3, 59, 'Dia 2/7'], [4, 0, 'Dia 3/7']]) {
  const date = getOperationalDateString(new Date(2026, 9, 7, hour, minute));
  assert.equal(getCycleTimingSummary('2026-10-05', '2026-10-11', date).statusLabel, expected);
}
console.log('Dia do ciclo: contagem inclusiva, limites e virada às 4h OK.');

// Starting Monday remains upcoming until Monday 04:00. The final Sunday
// remains available through Monday 03:59, including after reopening the app.
for (const [date, upcoming, expired, label] of [
  [new Date(2026, 9, 5, 0, 0), true, false, 'Começa amanhã'],
  [new Date(2026, 9, 5, 3, 59), true, false, 'Começa amanhã'],
  [new Date(2026, 9, 5, 4, 0), false, false, 'Dia 1/7'],
  [new Date(2026, 9, 12, 3, 59), false, false, 'Dia 7/7'],
  [new Date(2026, 9, 12, 4, 0), false, true, 'Dia 7/7'],
]) {
  const operationalDate = getOperationalDateString(date);
  const timing = getCycleTimingSummary('2026-10-05', '2026-10-11', operationalDate);
  assert.equal(operationalDate < '2026-10-05', upcoming);
  assert.equal(operationalDate > '2026-10-11', expired);
  assert.equal(timing.statusLabel, label);
}
