import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const contextSource = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const reportsSource = readFileSync(new URL('../views/ReportsView.tsx', import.meta.url), 'utf8');
const sealSource = readFileSync(new URL('../components/ReportGenerationModal.tsx', import.meta.url), 'utf8');
const miniAtlasSource = readFileSync(new URL('../components/MiniCyclePlannerSnapshot.tsx', import.meta.url), 'utf8');
const atlasBuilderSource = readFileSync(new URL('../utils/reportAtlasUtils.js', import.meta.url), 'utf8');
const projectionSource = readFileSync(new URL('../components/LegacyProjectionScene.tsx', import.meta.url), 'utf8');
const projectionModalSource = readFileSync(new URL('../components/LegacyProjectionModal.tsx', import.meta.url), 'utf8');
const plaqueSource = readFileSync(new URL('../components/LegacyGrandPlaque.tsx', import.meta.url), 'utf8');

assert.match(contextSource, /const endCycle = async/);
assert.match(contextSource, /await supabase[\s\S]*?from\('cycles'\)[\s\S]*?select\('id'\)[\s\S]*?single\(\)/);
assert.match(contextSource, /atlasSnapshotVersion: 2/);
assert.match(contextSource, /rawMetrics\.atlasSnapshotVersion === 1 \|\| rawMetrics\.atlasSnapshotVersion === 2/);
assert.match(contextSource, /sealedAt: new Date\(\)\.toISOString\(\)/);
assert.match(contextSource, /snapshotVersion: 2 as const/);
assert.match(contextSource, /borderId: userProfile\.border/);
assert.match(contextSource, /sovereign: userProfile\.sovereign/);
assert.match(contextSource, /clanRankId: clan\?\.rankId/);
assert.match(contextSource, /setReports\(prev => prev\.filter\(report => report\.cycleId !== cycleId && report\.id !== cycleId\)\)/);
assert.match(reportsSource, /await endCycleRef\.current/);
assert.match(reportsSource, /if \(\(report\.metrics\.atlasSnapshotVersion \|\| 0\) >= 2\) return weeks/);
assert.match(sealSource, /videoCompletionRef\.current\?\.promise/);
assert.match(sealSource, /onCompleteRef\.current\(\)/);
assert.doesNotMatch(miniAtlasSource, /scheduledItems\.slice\(/);
assert.doesNotMatch(miniAtlasSource, /unscheduledItems\.slice\(/);
assert.match(atlasBuilderSource, /startTime: Number\.isFinite\(task\.startTime\) \? task\.startTime : -1/);
assert.match(atlasBuilderSource, /areaId: arena\?\.assetId \|\| 'geral'/);
assert.match(miniAtlasSource, /LIFE_AREA_BY_ID\[normalizedArea\]\.color/);
assert.match(projectionSource, /snapshot\.clanName \?\? null/);
assert.doesNotMatch(projectionSource, /snapshot\.clanName !== undefined \? snapshot\.clanName : fallback\.clanName/);
assert.match(projectionSource, /identity=\{displayedPlaqueIdentity\}/);
assert.doesNotMatch(projectionSource, /legacy-identity-dock/);
assert.doesNotMatch(projectionModalSource, /legacy-identity-dock/);
// O `identityMode` saiu de proposito em 4ea7441: na cena do legado ele trocava
// a unica letra da placa por um carimbo de data, e "16/09/2026" e tres vezes
// mais largo que "A", entao as duas pontas ficavam tortas. A trava agora guarda
// a decisao — a placa recebe a identidade e mais nada — em vez de guardar o
// prop que foi removido, que e o que fazia este teste falhar.
assert.match(projectionModalSource, /identity=\{fallbackIdentity\}/);
assert.doesNotMatch(projectionModalSource, /identityMode=/);
// O grid de tres colunas virou flex em 4ea7441, pelo motivo que o comentario
// da propria placa registra: a coluna do meio era fixa em 210px e um apelido de
// treze letras ja entrava cortado. O que a trava guarda continua sendo a mesma
// decisao — o miolo e ELASTICO e pode encolher (`min-w-0 flex-1`), que e o que
// impede o nome de empurrar os dois selos para fora da placa. Prender a trava a
// `grid-cols-[58px_minmax(0,1fr)_76px]` era prender a uma medida, nao a uma
// regra, e foi o que fez este teste falhar por duas versoes seguidas.
assert.match(plaqueSource, /min-w-0 flex-1/);
// "Ciclo fechado" nunca foi o titulo da placa: era o texto de reserva do
// CARIMBO DE DATA, que so existia dentro do ramo `identityMode === 'historical'`
// removido em 4ea7441. A trava guarda a decisao que restou: a chapa da direita
// e a NOTA, sempre — dois numeros do mesmo peso, um em cada ponta. Era o
// carimbo que tomava o lugar da unica letra da placa.
assert.match(plaqueSource, /'Patamar',/);
assert.doesNotMatch(plaqueSource, /capturedDate/);

console.log('Cycle seal and Legacy regression: identity, arenas, actions and planner marks remain frozen until the cycle itself is deleted.');
