import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

// Offline must never hide the initial legal acceptance, and the old copied
// "Liga" wording must not return in the system connection layer.
{
  const app = read('components/AuthenticatedApp.tsx');
  const overlays = read('components/AppRuntimeOverlays.tsx');
  assert.match(
    app,
    /<OfflineOverlay open=\{!isOnline && !showTerms && !isFirstUseOnboardingActive\} \/>/,
    'a camada offline voltou a bloquear os termos ou o onboarding',
  );
  assert.doesNotMatch(overlays, /servidor da Liga/i, 'a mensagem copiada da Liga voltou');
  assert.match(overlays, />Sem conexão</, 'a camada offline perdeu uma mensagem clara');
}

// Switching accounts needs a new state tree. Otherwise an achievement queue
// from the previous identity can cover the freshly loaded account.
{
  const app = read('App.tsx');
  assert.match(
    app,
    /<AuthenticatedApp key=\{session\.user\.id\} session=\{session\}/,
    'a troca de conta deixou de reiniciar a árvore autenticada',
  );
}

// Dismissing the achievement is a local UI action; persistence cannot keep its
// blocking layer alive when a request stalls.
{
  const modal = read('components/AchievementModal.tsx');
  const handler = modal.slice(modal.indexOf('const handleDisableCelebrations'));
  assert.ok(handler.indexOf('handleClose();') < handler.indexOf('await updateOraclePreferences'), 'a preferência voltou a bloquear o fechamento da placa');
}

// The only bypass for sealed competition snapshots lives in the service-role
// account deletion RPC, scoped to its current transaction.
{
  const migration = read('supabase/migrations/20260924120000_allow_account_deletion_of_competition_snapshots.sql');
  assert.match(migration, /set_config\('app\.relationship_competition_admin', '1', true\)/, 'a exclusão não libera o guard de snapshot na própria transação');
  assert.match(migration, /grant execute on function public\.delete_account_data_for_user\(uuid\) to service_role/, 'a rotina de exclusão perdeu a restrição de service role');
}

console.log('launch-blockers: ok');
