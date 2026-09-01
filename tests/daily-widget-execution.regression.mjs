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
// O botao de concluir saiu do provider em 194adb8, quando a acao passou a ser
// escolher na lista e agir na barra de baixo. Ele nao sumiu: virou rotulo de
// layout e rotulo de linha. Como o teste so lia o provider, ficou cobrando um
// texto que mudou de arquivo — vermelho sem defeito nenhum.
const widgetLayout = readFileSync(
  new URL('../android/app/src/main/res/layout/glyph_day_widget.xml', import.meta.url),
  'utf8',
);
const bayServiceSource = readFileSync(
  new URL('../android/app/src/main/java/life/glyph/app/GlyphBayWidgetService.java', import.meta.url),
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
assert.match(widgetProvider, /"FAZER"/);
// Concluir mora na barra de baixo; a linha so escolhe. Os dois rotulos juntos sao
// a prova de que ha um caminho unico: a linha marca "ESCOLHIDA", a barra "CONCLUIR".
assert.match(widgetLayout, /android:text="CONCLUIR"/);
assert.match(bayServiceSource, /isSelected \? "ESCOLHIDA" : "FEITO"/);
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
