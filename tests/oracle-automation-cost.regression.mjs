import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../supabase/functions/oracle/index.ts', import.meta.url), 'utf8');
const automaticStart = source.indexOf('const createAutomaticOracleMessage');
const automaticEnd = source.indexOf('const buildOracleChatSystemPrompt', automaticStart);
const automatic = source.slice(automaticStart, automaticEnd);

const preferenceGate = automatic.indexOf('if (!preferences.dailyFocusCardEnabled)');
// A cota virou DUAS, uma por aba: a leitura do ciclo e o card de tema contam
// separado desde 21/09. O que este teste guarda continua sendo o mesmo — sair do
// dia cheio custa uma consulta, e essa decisao tem de acontecer antes da carga
// operacional, nao depois de ler arenas e tarefas.
const quotaGate = automatic.indexOf('if (!faltaInsight && !faltaSabedoria)');
const arenaLoad = automatic.indexOf('.from("arenas")');
const taskLoad = automatic.indexOf('.from("scheduled_tasks")');

assert.ok(preferenceGate >= 0 && preferenceGate < arenaLoad, 'preferencias devem ser verificadas antes das arenas');
assert.ok(quotaGate >= 0 && quotaGate < arenaLoad, 'cota deve ser verificada antes do estado operacional');
assert.ok(taskLoad > arenaLoad, 'tarefas pertencem a carga operacional tardia');
assert.match(automatic, /\.gte\("date", taskWindowStart\)[\s\S]*?\.lte\("date", taskWindowEnd\)/);
assert.doesNotMatch(automatic, /clan_mission_update/);

const cronStart = source.indexOf('const handleAutomaticOracleCron');
const cron = source.slice(cronStart);
assert.match(cron, /\.from\("oracle_preferences"\)/);
assert.doesNotMatch(cron, /\.from\("push_subscriptions"\)/);

console.log('Oracle automation cost regression: eligibility precedes operational load.');
