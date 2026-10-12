import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const sql = readFileSync(new URL('../supabase/migrations/20261012120000_restrict_account_deletion_rpcs.sql', import.meta.url), 'utf8');
const signatures = [...sql.match(/targets constant text\[\] := ARRAY\[([\s\S]*?)\n  \]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
const db = new PGlite();
try {
  await db.exec('create role anon; create role authenticated; create role service_role; create table public.permission_probe(value int);');
  for (const signature of signatures) {
    await db.exec(`create function ${signature} returns void language sql security definer as $$insert into public.permission_probe values (1)$$;
      grant execute on function ${signature} to anon, authenticated, service_role;`);
  }
  await db.exec(sql);
  await db.exec(sql);
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    await assert.rejects(() => db.query('select public.delete_account_data_for_user(null::uuid)'), /permission denied/);
    await db.exec('reset role');
  }
  await db.exec('set role service_role; select public.delete_account_data_for_user(null::uuid); reset role;');
  assert.equal((await db.query('select count(*)::int as n from permission_probe')).rows[0].n, 1);
  console.log('PASS: grants explícitos removidos nas sete funções, chamada pública negada, servidor preservado e migração idempotente');
} finally {
  await db.close();
}
