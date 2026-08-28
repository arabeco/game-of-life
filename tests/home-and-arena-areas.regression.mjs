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
assert.match(headerSource, /getMasteryIndexFromAssets/);
assert.match(headerSource, /header-mastery-index/);
assert.match(profileSource, /const masteryIndex = getMasteryIndex\(assets\)/);

// --- uma formula so para o nivel que o usuario ve ------------------------
// `profile.level` guarda a soma crua dos niveis das cinco areas; o Indice Glyph,
// que e o numero do cabecalho, e essa soma vezes dois. As duas conviviam e cada
// tela escolhia uma: o cabecalho mostrava 72 e a placa do legado mostrava 36
// para a mesma pessoa, no mesmo instante.
const lifeAreas = readFileSync(new URL('../constants/lifeAreas.ts', import.meta.url), 'utf8');
assert.match(lifeAreas, /export const getDisplayLevel/, 'o nivel exibido precisa ter uma funcao so');

const plaque = readFileSync(new URL('../components/LegacyGrandPlaque.tsx', import.meta.url), 'utf8');
assert.match(plaque, /getDisplayLevel\(identity\?\.level\)/, 'a placa mostra o mesmo numero do cabecalho');
assert.doesNotMatch(
  plaque,
  /Number\(identity\?\.level \|\| 1\)/,
  'ler o nivel cru na placa e o que fazia ela mostrar metade',
);

// Nenhuma tela pode voltar a imprimir profile.level cru ao lado da palavra Nivel.
for (const arquivo of [
  'components/AddClanMemberModal.tsx',
  'components/ClanDetailModal.tsx',
  'components/ClanManagementModal.tsx',
  'components/ConnectionsModal.tsx',
  'components/RelationshipHubModal.tsx',
  'components/TransferLeadershipModal.tsx',
  'views/SettingsView.tsx',
]) {
  const tela = readFileSync(new URL(`../${arquivo}`, import.meta.url), 'utf8');
  assert.doesNotMatch(
    tela,
    /N[ií]vel \{[a-zA-Z.?]*\.level/,
    `${arquivo} precisa passar o nivel por getDisplayLevel`,
  );
}

console.log('Home and arena areas regression: Assets is home and all five areas remain visible.');
