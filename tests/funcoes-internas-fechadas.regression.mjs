import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * FUNCAO INTERNA NAO E API (26/11/2026).
 *
 * O Postgres da EXECUTE ao PUBLIC em toda funcao nova, e o Supabase expoe todo
 * o schema public em /rest/v1/rpc. A checagem de prontidao achou 15 funcoes
 * internas security definer que qualquer pessoa, sem login, chamava com a chave
 * publica do app — entre elas a que define o ouro de qualquer conta e a que
 * zera qualquer coluna de qualquer tabela. A migracao 20261126130000 fechou.
 *
 * Daqui em diante: migracao que cria funcao `public._algo` security definer
 * tem de tirar o acesso do public/anon no mesmo arquivo.
 */

const pasta = new URL('../supabase/migrations/', import.meta.url);
const ler = (nome) => readFileSync(new URL(nome, pasta), 'utf8').replace(/\r\n/g, '\n');

const trava = ler('20261126130000_fecha_funcoes_internas.sql');
for (const nome of [
  '_codex_debit_gold', '_codex_set_wallet_gold', '_create_competition_snapshot_from_invite',
  '_create_competition_snapshot', '_handoff_or_delete_led_clans', '_nullify_public_uuid_column',
  '_starter_reward_credit_gold', '_starter_reward_grant_inventory_item_once',
  '_starter_reward_mark_purchase', '_starter_reward_mark_unlock', '_starter_reward_set_wallet_gold',
  'anunciar_patente_do_cla', 'bootstrap_new_player_rewards_for_user',
  'enqueue_cycle_deadline_notifications', 'issue_golden_invites',
]) {
  assert.ok(trava.includes(`'${nome}'`), `a trava tem de cobrir ${nome}`);
}
assert.match(trava, /revoke all on function %s from public, anon, authenticated/);
assert.match(trava, /revoke all on function %s from public, anon'/, 'as chamadas pelo app perdem so o anon');

const novas = readdirSync(pasta).filter((nome) => nome.endsWith('.sql') && nome > '20261126130000');
for (const nome of novas) {
  const sql = ler(nome);
  const criadas = [...sql.matchAll(/create\s+(?:or\s+replace\s+)?function\s+public\.(_[a-z0-9_]+)\s*\(([\s\S]*?)\)\s*returns[\s\S]*?(?=\$\$|\$[a-z_]+\$)/gi)]
    .filter((m) => /security\s+definer/i.test(m[0]))
    .map((m) => m[1]);
  for (const funcao of criadas) {
    assert.match(sql, new RegExp(`revoke[\\s\\S]{0,200}function\\s+public\\.${funcao}\\b[\\s\\S]{0,200}from[\\s\\S]{0,40}\\b(public|anon)\\b`, 'i'),
      `${nome}: public.${funcao} e security definer e interna — revogue de public/anon no mesmo arquivo`);
  }
}

console.log('ok - funcoes internas security definer nao ficam abertas para quem nao fez login');
