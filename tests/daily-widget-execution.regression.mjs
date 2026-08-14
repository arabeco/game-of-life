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

assert.match(widgetSnapshotSource, /if \(!activeCycle\) \{/);
assert.match(widgetSnapshotSource, /const todaysTasks = cycleTasks\.filter/);
assert.match(widgetSnapshotSource, /earnedExp/);
assert.match(widgetSnapshotSource, /touchedArenaCount/);
assert.match(widgetSnapshotSource, /openActionCount/);
assert.match(widgetSnapshotSource, /todayActions/);
assert.match(widgetSnapshotSource, /quickActions/);
assert.doesNotMatch(widgetSnapshotSource, /if \(!activeCycle \|\| !dailyCommitment\)/);
assert.match(widgetProvider, /HOJE NO GLYPH/);
assert.match(widgetProvider, /ACTION_TAB_TODAY/);
assert.match(widgetProvider, /ACTION_TAB_DO/);
assert.match(widgetProvider, /FEITO/);
assert.match(widgetProvider, /ACTIONS_IN_FLIGHT\.add/);
assert.match(widgetProvider, /\/functions\/v1\/widget-action/);
assert.match(widgetProvider, /refreshSession/);
assert.match(widgetProvider, /life\.glyph\.app:\/\/widget\/planner/);
assert.doesNotMatch(widgetProvider, /programadas|estoque|Planejando/);
assert.match(edgeFunctionSource, /auth\.getUser/);
assert.match(edgeFunctionSource, /\.eq\("user_id", user\.id\)/);
assert.match(edgeFunctionSource, /repeatedTasks/);
assert.match(edgeFunctionSource, /daily_proof_streak/);

console.log('Daily widget regression: tabs, authenticated quick completion and duplicate protection are wired.');
