import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!process.argv.includes('--worker')) {
  const child = spawnSync(process.execPath, [import.meta.filename, '--worker'], { encoding: 'utf8' });
  if (!child.stdout.includes('GARDEN_BASKET_OK')) {
    console.error(child.stdout, child.stderr); process.exit(1);
  }
  console.log(child.stdout.trim()); process.exit(0);
}
const { PGlite } = await import('@electric-sql/pglite');
const db = await PGlite.create();
await db.exec(readFileSync('scripts/sql-andaime.sql','utf8'));
await db.exec(`
 create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table public.basket_test_chests(user_id uuid, chest_type text);
 create function public.grant_chest(p_user_id uuid,p_chest_type text) returns void language sql as $$ insert into public.basket_test_chests values(p_user_id,p_chest_type) $$;
`);
const migration = readFileSync('supabase/migrations/20261017210000_garden_basket.sql','utf8');
await db.exec(migration);
await db.exec(migration); // Safe to reapply; no retroactive grants.
const owner='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222';
const action='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
await db.exec(`insert into auth.users values('${owner}'),('${other}');
insert into public.user_profiles(id,fragments,wallet) values('${owner}',20,'{"fragments":25,"gold":99}'),('${other}',0,'{}');
insert into public.actions(id,user_id) values('${action}','${owner}');
select set_config('request.jwt.claim.sub','${owner}',false);`);
const today="(now() at time zone 'America/Sao_Paulo')::date";
let task=0;
const complete=async(date=today)=>db.exec(`insert into public.scheduled_tasks(id,action_id,date,completed) values('task-${++task}','${action}',(${date})::text,true)`);
const value=async(sql)=>Object.values((await db.query(sql)).rows[0])[0];
await complete(`${today}-30`); await complete(`${today}+1`); await complete('null');
assert.equal(await value('select count(*)::int from garden_basket_progress'),0);
await complete();
assert.equal(await value('select active_days from garden_basket_progress'),1);
await complete();
await db.exec(`update scheduled_tasks set completed=false where id='task-${task}';update scheduled_tasks set completed=true where id='task-${task}'`);
assert.equal(await value('select active_days from garden_basket_progress'),1,'daily latch survives undo and another task');
assert.equal(await value('select count(*)::int from garden_basket_deliveries'),0,'no daily delivery');
// Advance the server-owned day latch only in this isolated test database.
await db.exec('update garden_basket_progress set target_days=3');
for(let i=0;i<2;i++){ await db.exec('update garden_basket_progress set last_credit_day=last_credit_day-1'); await complete(); }
assert.equal(await value('select count(*)::int from garden_basket_deliveries'),1);
assert.equal(await value('select active_days from garden_basket_progress'),0);
assert.ok([3,4,5].includes(await value('select target_days from garden_basket_progress')));
for(let i=0;i<12;i++){ await db.exec('update garden_basket_progress set last_credit_day=last_credit_day-1'); await complete(); }
assert.equal(await value('select count(*)::int from garden_basket_deliveries'),2,'pending cap');
const ids=(await db.query('select id from garden_basket_deliveries order by created_at,id')).rows.map(r=>r.id);
await db.exec(`update garden_basket_deliveries set score=10,created_at=now()-interval '90 days' where id='${ids[0]}';update garden_basket_deliveries set score=16 where id='${ids[1]}'`);
const claim=async(id)=>value(`select public.claim_garden_basket('${id}')`);
let receipt=await claim(ids[0]);
assert.deepEqual(receipt,{awarded:true,fragments:10,chest:null,balance:35},'old pending reward never expires');
assert.equal(await value(`select wallet->>'gold' from user_profiles where id='${owner}'`),'99');
assert.equal((await claim(ids[0])).awarded,false,'retry is idempotent');
receipt=await claim(ids[1]);
assert.equal(receipt.chest,'Comum'); assert.equal(receipt.fragments,0); assert.equal(receipt.balance,35);
await claim(ids[1]); assert.equal(await value('select count(*)::int from basket_test_chests'),1,'one chest, no fragments on overflow');
await db.exec(`select set_config('request.jwt.claim.sub','${other}',false)`);
await assert.rejects(()=>claim(ids[0]),/BASKET_NOT_FOUND/);
const before=await value('select active_days from garden_basket_progress');
await db.exec('update garden_basket_progress set last_credit_day=last_credit_day-1'); await complete();
assert.equal(await value('select active_days from garden_basket_progress'),before,'another user cannot advance owner');
await db.exec('set role authenticated');
assert.equal(await value('select count(*)::int from garden_basket_deliveries'),0,'visitor cannot read owner rewards');
await assert.rejects(()=>db.exec(`insert into garden_basket_deliveries(user_id,score) values('${other}',15)`),/permission denied/);
await db.exec('reset role');
// Auth absent must never allow claiming.
await db.exec("select set_config('request.jwt.claim.sub','',false)");
await assert.rejects(()=>claim(ids[0]),/AUTH_REQUIRED/);
console.log('GARDEN_BASKET_OK — SQL execution: cadence, day cap, undo/retry, queue cap, no expiry, overflow chest, wallet, RLS, ownership and anonymous claim.');
await db.close();
