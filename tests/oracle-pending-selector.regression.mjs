// Local PostgreSQL (PGlite), synthetic data only. No Supabase credentials/network.
// PGLITE_MODULE may point to a temporary install to avoid changing app dependencies.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(process.env.PGLITE_MODULE
  ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
const db = new PGlite();
const sql = await readFile(new URL('../supabase/experiments/oracle-pending-preview.sql', import.meta.url), 'utf8');
await db.exec(`
  create table oracle_preferences (
    user_id uuid primary key, ia_enabled boolean default true,
    notifications_enabled boolean default true, daily_focus_card_enabled boolean default true,
    presence_level integer default 2,
    enabled_categories text[] default array['frases_inspiradoras'],
    quiet_hours_start time default '22:00', quiet_hours_end time default '07:00'
  );
  create table oracle_messages (
    user_id uuid, category text default 'frases_inspiradoras',
    delivery_type text default 'feed', context_snapshot jsonb default '{}', created_at timestamptz
  );
  create index on oracle_messages(user_id, created_at);
`);
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const at = async (instant = '2026-09-10T15:00:00Z') => {
  // Clock replacement only in this fixture; production preview always uses now().
  const result = await db.query(sql.replaceAll('now()', `timestamptz '${instant}'`));
  return Object.fromEntries(Object.entries(result.rows[0]).map(([key, value]) => [key, Number(value)]));
};
const pending = async instant => (await at(instant)).ainda_sem_card_automatico_hoje;
const reset = async () => {
  await db.exec('truncate oracle_preferences, oracle_messages');
  await db.query('insert into oracle_preferences(user_id) values ($1)', [id(1)]);
};
const message = async (time, trigger = 'cron', delivery = 'feed', category = 'frases_inspiradoras') =>
  db.query('insert into oracle_messages(user_id, created_at, context_snapshot, delivery_type, category) values($1,$2,$3,$4,$5)',
    [id(1), time, JSON.stringify({triggerType: trigger}), delivery, category]);
let checks = 0;
async function check(name, fn) { await reset(); await fn(); checks++; console.log(`PASS ${name}`); }
try {
  await check('1000 users: at most 25 IDs, including users without schedules', async () => {
    await db.exec(`insert into oracle_preferences(user_id)
      select ('00000000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid from generate_series(2,1000) n`);
    assert.deepEqual(await at(), {
      usuarios_no_select_atual: 1000, fora_do_silencio_com_categorias: 1000,
      ainda_sem_card_automatico_hoje: 1000, usuarios_retornados_no_lote_novo: 25,
      ids_a_menos_transferidos_nesta_consulta: 975,
    });
    await db.exec(`insert into oracle_messages(user_id,created_at)
      select user_id, timestamptz '2026-09-10 12:00Z' from oracle_preferences`);
    assert.equal(await pending(), 0);
    assert.equal((await at()).usuarios_retornados_no_lote_novo, 0);
  });
  for (const field of ['ia_enabled','notifications_enabled','daily_focus_card_enabled']) {
    await check(`${field} off`, async () => {
      await db.exec(`update oracle_preferences set ${field}=false`);
      assert.equal(await pending(), 0);
    });
  }
  await check('silent presence', async () => {
    await db.exec('update oracle_preferences set presence_level=0'); assert.equal(await pending(), 0);
  });
  await check('presence 1 preserves current server behavior', async () => {
    await db.exec('update oracle_preferences set presence_level=1'); assert.equal(await pending(), 1);
  });
  await check('empty and unsupported categories; null uses backend defaults', async () => {
    for (const value of ["'{}'", "array['analise_padroes']"]) {
      await db.exec(`update oracle_preferences set enabled_categories=${value}`); assert.equal(await pending(), 0);
    }
    await db.exec('update oracle_preferences set enabled_categories=null'); assert.equal(await pending(), 1);
  });
  await check('overnight quiet window exact boundaries in Sao Paulo', async () => {
    assert.equal(await pending('2026-09-11T01:00:00Z'), 0);
    assert.equal(await pending('2026-09-11T09:59:59Z'), 0);
    assert.equal(await pending('2026-09-11T10:00:00Z'), 1);
  });
  await check('daytime quiet window and equal endpoints', async () => {
    await db.exec("update oracle_preferences set quiet_hours_start='11:00', quiet_hours_end='13:00'");
    assert.equal(await pending(), 0);
    assert.equal(await pending('2026-09-10T16:00:00Z'), 1);
    await db.exec("update oracle_preferences set quiet_hours_end='11:00'"); assert.equal(await pending(), 1);
  });
  await check('seconds in quiet preferences are ignored like the backend', async () => {
    await db.exec("update oracle_preferences set quiet_hours_start='12:00:30', quiet_hours_end='13:00:30'");
    assert.equal(await pending('2026-09-10T15:00:00Z'), 0);
    assert.equal(await pending('2026-09-10T16:00:00Z'), 1);
  });
  await check('manual, chat, and other categories do not consume automatic quota', async () => {
    await message('2026-09-10T12:00Z', 'manual');
    await message('2026-09-10T12:00Z', 'cron', 'chat');
    await message('2026-09-10T12:00Z', 'cron', 'feed', 'analise_padroes');
    assert.equal(await pending(), 1);
    await message('2026-09-10T12:00Z'); assert.equal(await pending(), 0);
  });
  await check('4am rollover, not midnight; old and future days excluded', async () => {
    await db.exec("update oracle_preferences set quiet_hours_start='00:00', quiet_hours_end='00:00'");
    await message('2026-09-10T12:00Z');
    assert.equal(await pending('2026-09-11T06:59:59Z'), 0);
    assert.equal(await pending('2026-09-11T07:00:00Z'), 1);
    await message('2026-09-12T12:00Z'); assert.equal(await pending('2026-09-11T07:00:00Z'), 1);
  });
  await check('quota still found behind 60 newer manual records', async () => {
    await message('2026-09-10T10:00Z');
    for (let n=0;n<60;n++) await message('2026-09-10T12:00Z','manual');
    assert.equal(await pending(), 0);
  });
  await check('preview is read-only; repeated selection is NOT a concurrency lock', async () => {
    const before = await db.query('select * from oracle_preferences');
    assert.deepEqual(await at(), await at());
    assert.equal(await pending(), 1);
    assert.deepEqual(await db.query('select * from oracle_preferences'), before);
    assert.equal((await db.query('select count(*)::int as n from oracle_messages')).rows[0].n, 0);
  });
  console.log(`${checks} scenarios passed in local PostgreSQL. No real push, deployed schema, or billed egress verified.`);
} finally { await db.close(); }
