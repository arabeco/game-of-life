import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  new URL('../supabase/migrations/20260926120000_oracle_pacts_hotfix.sql', import.meta.url),
  'utf8',
);
const client = readFileSync(new URL('../utils/arenaPacts.ts', import.meta.url), 'utf8');

assert.match(sql, /'primeira','constancia','conclusao','retomada','volume'/, 'o banco nao aceita todos os tipos que o app oferece');
assert.match(sql, /p_goal not between 3 and 10/, 'volume perdeu o intervalo validado pelo banco');
assert.match(sql, /PACT_ARENA_COMPLETE/, 'o banco voltou a aceitar pacto para arena concluida');
assert.match(sql, /v_kind = 'primeira'/, 'a missao inicial nao pode ser concluida no banco');
assert.match(sql, /arena_pact_volume_window/, 'volume perdeu a trava contra recompensa repetida');
assert.match(client, /VOLUME_TARGETS = \{ leve: \{ actions: 3, days: 14 \}/, 'cliente voltou a prometer uma janela diferente da RPC');
assert.doesNotMatch(client, /const metaCurta =/, 'cliente voltou a fabricar meta abaixo de 3 no fim do ciclo');

console.log('oracle-pacts-contract: cliente e RPC usam o mesmo contrato');
