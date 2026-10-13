import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const widgetProvider = readFileSync(
  new URL('../android/app/src/main/java/life/glyph/app/GlyphDayWidgetProvider.java', import.meta.url),
  'utf8',
);
const widgetSnapshotSource = readFileSync(
  new URL('../utils/widgetSnapshots.ts', import.meta.url),
  'utf8',
);
const edgeFunctionSource = readFileSync(
  new URL('../supabase/functions/widget-action/index.ts', import.meta.url),
  'utf8',
);
// A ABA FAZER SAIU (13/10/2026). O widget do dia virou vitrine: Resumo e
// Planner, tocar abre o app (tests/widget-planner-do-dia.regression.mjs cobre o
// desenho novo). As cobrancas da lista de concluir, da barra CONCLUIR/CANCELAR e
// da chamada autenticada saem daqui. A funcao widget-action continua no servidor,
// so que ninguem mais chama.
assert.match(widgetSnapshotSource, /if \(!activeCycle\) \{/);
assert.match(widgetSnapshotSource, /const todaysTasks = cycleTasks\.filter/);
assert.match(widgetSnapshotSource, /earnedExp/);
assert.match(widgetSnapshotSource, /touchedArenaCount/);
assert.match(widgetSnapshotSource, /openActionCount/);
assert.match(widgetSnapshotSource, /todayActions/);
assert.match(widgetSnapshotSource, /quickActions/);
assert.match(widgetSnapshotSource, /isUnlimited: group\.isUnlimited/);
assert.match(widgetSnapshotSource, /scheduledTodayCount/);
assert.match(widgetSnapshotSource, /bayActionCount/);
assert.match(widgetSnapshotSource, /notaDoCiclo\(\{/);
assert.match(widgetSnapshotSource, /completionRateForGrade/);
assert.match(widgetSnapshotSource, /grade: notaDoWidget/);
assert.doesNotMatch(widgetSnapshotSource, /getScoreGrade\(currentScore\)/);
assert.doesNotMatch(widgetSnapshotSource, /if \(!activeCycle \|\| !dailyCommitment\)/);
assert.match(widgetProvider, /life\.glyph\.app:\/\/widget\/planner/);
assert.doesNotMatch(widgetProvider, /programadas|estoque|Planejando/);
assert.doesNotMatch(widgetProvider, /\/functions\/v1\/widget-action|refreshSession|ACTION_COMPLETE/);
assert.match(edgeFunctionSource, /auth\.getUser/);
assert.match(edgeFunctionSource, /\.eq\("user_id", user\.id\)/);

console.log('Daily widget regression: o snapshot do dia segue certo, e o widget nao conclui mais nada.');
