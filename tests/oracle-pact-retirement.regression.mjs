import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { deriveOracleHostOperationalState, buildOracleHostVoiceDirective } from '../supabase/functions/_shared/oracle-host-voice.ts';
import { AVAILABLE_SYSTEM_CHALLENGES, SYSTEM_CHALLENGES } from '../constants/systemChallenges.ts';
const legacyId = 'system-five-day-proof-streak';
// A definicao legada foi mantida por um tempo "para interpretar aceites
// antigos". A conferencia no banco mostrou a coorte vazia — nenhum perfil com
// `legacy_five_day_eligible` —, entao nao havia ninguem para interpretar e ela
// foi apagada. O gatilho no banco continua removendo o id de qualquer array de
// aceites, entao binario antigo tambem nao a ressuscita.
assert.ok(!SYSTEM_CHALLENGES.some(c=>c.id===legacyId),'a sequencia global foi apagada, nao escondida');
assert.ok(!AVAILABLE_SYSTEM_CHALLENGES.some(c=>c.id===legacyId),'novo usuario nao recebe sequencia global');
// O catalogo publico e so o que se ACEITA: missao inicial acontece sozinha e nao
// pode aparecer como opcao competindo pelo slot.
assert.ok(!AVAILABLE_SYSTEM_CHALLENGES.some(c=>c.inicial),'missao inicial nao entra no catalogo de aceite');
assert.ok(SYSTEM_CHALLENGES.some(c=>c.inicial),'as missoes iniciais existem');
for(const count of [0,1,5,30,100]) {
 for(const last of ['2026-09-05','2026-09-04','2026-08-01']) {
  const context={currentTime:'2026-09-05T18:00:00Z',activeMode:'neutro',hasCycle:true,staleArenas:[],pendingActionsToday:0,pendingChests:0,dailyProofStreakCurrent:count,dailyProofLastClosedDate:last};
  assert.ok(!deriveOracleHostOperationalState(context,{operationalDate:'2026-09-05'}).startsWith('streak_'));
  assert.doesNotMatch(buildOracleHostVoiceDirective({context,surface:'card'}),/Estado dominante: streak_/);
 }
}
for(const file of ['supabase/functions/oracle/index.ts','supabase/functions/web-push/index.ts','supabase/functions/_shared/oracle-host-voice.ts']) {
 const result=ts.transpileModule(readFileSync(file,'utf8'),{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
 assert.deepEqual((result.diagnostics || []).filter(d=>d.category===ts.DiagnosticCategory.Error),[],file);
}
const game=readFileSync('contexts/GameContext.tsx','utf8');
const start=game.indexOf('const registerDailyProofAction');
assert.ok(start>=0);
assert.doesNotMatch(game,/emitAppSensoryCue\(['"](?:daily_streak|streak_milestone)['"]/);
const cron=readFileSync('supabase/functions/oracle/index.ts','utf8');
assert.doesNotMatch(cron,/maybeSendStreakAlert/);
console.log('Retirada global: catalogo novo/legado, 15 estados de voz, ausencia de cron/sensorial e sintaxe de 3 Edge Functions validados.');
