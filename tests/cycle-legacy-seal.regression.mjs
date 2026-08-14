import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const contextSource = readFileSync(new URL('../contexts/GameContext.tsx', import.meta.url), 'utf8');
const reportsSource = readFileSync(new URL('../views/ReportsView.tsx', import.meta.url), 'utf8');
const sealSource = readFileSync(new URL('../components/ReportGenerationModal.tsx', import.meta.url), 'utf8');
const miniAtlasSource = readFileSync(new URL('../components/MiniCyclePlannerSnapshot.tsx', import.meta.url), 'utf8');
const atlasBuilderSource = readFileSync(new URL('../utils/reportAtlasUtils.js', import.meta.url), 'utf8');

assert.match(contextSource, /const endCycle = async/);
assert.match(contextSource, /await supabase[\s\S]*?from\('cycles'\)[\s\S]*?select\('id'\)[\s\S]*?single\(\)/);
assert.match(contextSource, /atlasSnapshotVersion: 2/);
assert.match(contextSource, /rawMetrics\.atlasSnapshotVersion === 1 \|\| rawMetrics\.atlasSnapshotVersion === 2/);
assert.match(contextSource, /sealedAt: new Date\(\)\.toISOString\(\)/);
assert.match(reportsSource, /await endCycleRef\.current/);
assert.match(sealSource, /videoCompletionRef\.current\?\.promise/);
assert.match(sealSource, /onCompleteRef\.current\(\)/);
assert.doesNotMatch(miniAtlasSource, /scheduledItems\.slice\(/);
assert.doesNotMatch(miniAtlasSource, /unscheduledItems\.slice\(/);
assert.match(atlasBuilderSource, /startTime: Number\.isFinite\(task\.startTime\) \? task\.startTime : -1/);
assert.match(atlasBuilderSource, /areaId: arena\?\.assetId \|\| 'geral'/);
assert.match(miniAtlasSource, /LIFE_AREA_BY_ID\[normalizedArea\]\.color/);

console.log('Cycle seal and Legacy atlas regression: persistence is awaited and the sealed mini planner keeps every task mark.');
