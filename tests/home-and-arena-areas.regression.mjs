import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shellSource = readFileSync(new URL('../components/AuthenticatedApp.tsx', import.meta.url), 'utf8');
const initialViewState = shellSource.slice(
  shellSource.indexOf('const [currentView, setCurrentView]'),
  shellSource.indexOf('const [isRestScreenVisible'),
);
assert.match(initialViewState, /getDefaultView\(canUseAssetsView, isBuilderMode\)/);
assert.doesNotMatch(initialViewState, /defaultRestScreenOpen\s*\?\s*'planner'/);

const historyInitialization = shellSource.slice(
  shellSource.indexOf("const state = window.history.state as { view?: View } | null;"),
  shellSource.indexOf('historyReady.current = true;'),
);
assert.match(historyInitialization, /const initialView = getDefaultView/);
assert.doesNotMatch(historyInitialization, /state\?\.view\s*\?\?/);

const arenasSource = readFileSync(new URL('../views/ArenasView.tsx', import.meta.url), 'utf8');
const assetsSource = readFileSync(new URL('../views/AssetsView.tsx', import.meta.url), 'utf8');
const headerSource = readFileSync(new URL('../components/GlobalHeader.tsx', import.meta.url), 'utf8');
const profileSource = readFileSync(new URL('../views/ProfileView.tsx', import.meta.url), 'utf8');
const areaGrouping = arenasSource.slice(
  arenasSource.indexOf('const assetGroups ='),
  arenasSource.indexOf('const receivedSharedArenas'),
);
assert.match(areaGrouping, /LIFE_AREAS\.map/);
assert.doesNotMatch(areaGrouping, /filter\(group => group\.arenas\.length > 0\)/);
assert.match(arenasSource, /Nenhuma arena nesta area/);
assert.match(assetsSource, /asset-overview-card/);
assert.match(headerSource, /toMasteryIndex/);
assert.match(headerSource, /header-mastery-index/);
assert.match(profileSource, /const masteryIndex = getMasteryIndex\(profileAssets\)/);

console.log('Home and arena areas regression: Assets is home and all five areas remain visible.');
