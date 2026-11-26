import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * BAU COM LIMITE E PORTAS FECHADAS (26/11/2026).
 *
 * Segunda rodada da checagem de prontidao. Bau sem limite virava fragmentos
 * sem fim, e fragmento compra campanha: era campanha paga de graca. Codigo
 * promocional e Bilhete Dourado podiam ser gastos em nome de outra conta sem
 * login; o banco chamava o Oraculo para qualquer conta a pedido de qualquer um;
 * e qualquer conta somava o que quisesse na missao de qualquer cla.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const sql = ler('supabase/migrations/20261126160000_trava_bau_e_codigos.sql');

// Bau: limite por dia e dos raros, com trava por conta.
assert.match(sql, /v_ultimas_24h >= 4 then\s+raise exception 'CHEST_DAILY_LIMIT'/);
assert.match(sql, /v_raros_24h >= 1 or v_raros_7d >= 2 then\s+raise exception 'CHEST_RARE_LIMIT'/);
assert.match(sql, /pg_advisory_xact_lock\(hashtextextended\('grant_my_chest:'/);
assert.match(sql, /revoke all on function public\.grant_my_chest\(text\) from public, anon;/);

// Codigos: so com login.
assert.match(sql, /p\.proname in \('redeem_reward_code', 'consume_golden_invite'\)[\s\S]{0,200}revoke all on function %s from public, anon'/);

// Oraculo por conta: so o servidor.
assert.match(sql, /p\.proname = 'enqueue_oracle_automatic_feed_webhook_for_user'[\s\S]{0,200}from public, anon, authenticated'/);

// Missao de cla: so +1/-1, so do proprio cla, nunca abaixo de zero.
assert.match(sql, /p_increment not in \(-1, 1\)/);
assert.match(sql, /m\.clan_id = p_clan_id and m\.user_id = auth\.uid\(\)/);
assert.match(sql, /greatest\(clan_mission_progress\.current_value \+ p_increment, 0\)/);

// O app continua chamando do jeito que a funcao aceita.
const contexto = ler('contexts/GameContext.tsx');
assert.match(contexto, /supabase\.rpc\('grant_my_chest', \{\s*p_chest_type: chestType\s*\}\)/);
assert.match(contexto, /if \(error\) \{\s*console\.error\("Error adding chest:", error\);\s*return false;/, 'recusa do limite nao derruba a recompensa');
const tarefas = ler('contexts/gameDomains/taskDomain.ts');
for (const m of tarefas.matchAll(/updateClanMissionProgress\([^,]+,\s*([^)]+)\)/g)) {
  assert.match(m[1].trim(), /^(1|-1|updatedTask\.completed \? 1 : -1)$/, `missao de cla manda so +1/-1: ${m[1]}`);
}

console.log('ok - bau tem limite, codigo pede login, Oraculo por conta e missao de cla fechados');
