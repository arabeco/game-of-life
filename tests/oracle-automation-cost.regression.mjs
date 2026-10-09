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
// Desde o motor V2 (08/10/2026) as tarefas vem de fetchReadingTasks, que pagina a
// consulta. A funcao e escrita antes das arenas, mas a carga acontece onde ela e
// CHAMADA — e e isso que tem de vir depois das portas.
const taskQuery = automatic.indexOf('.from("scheduled_tasks")');
const taskLoad = automatic.indexOf('fetchReadingTasks()') >= 0
  ? automatic.indexOf('fetchReadingTasks()')
  : taskQuery;

assert.ok(preferenceGate >= 0 && preferenceGate < arenaLoad, 'preferencias devem ser verificadas antes das arenas');
assert.ok(quotaGate >= 0 && quotaGate < arenaLoad, 'cota deve ser verificada antes do estado operacional');
assert.ok(quotaGate < taskQuery, 'a consulta de tarefas nao existe antes da cota');
assert.ok(taskLoad > arenaLoad, 'tarefas pertencem a carga operacional tardia');
assert.match(automatic, /\.gte\("date", taskWindowStart\)[\s\S]*?\.lte\("date", taskWindowEnd\)/);
assert.doesNotMatch(automatic, /clan_mission_update/);

const cronStart = source.indexOf('const handleAutomaticOracleCron');
const cron = source.slice(cronStart);
assert.match(cron, /\.from\("oracle_preferences"\)/);
assert.doesNotMatch(cron, /\.from\("push_subscriptions"\)/);

console.log('Oracle automation cost regression: eligibility precedes operational load.');
