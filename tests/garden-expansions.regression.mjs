import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
if(!process.argv.includes('--worker')){
 const r=spawnSync(process.execPath,[import.meta.filename,'--worker'],{encoding:'utf8'});
 if(!r.stdout.includes('EXPANSIONS_OK')){console.error(r.stdout,r.stderr);process.exit(1);}
 console.log(r.stdout.trim());process.exit(0);
}
const {PGlite}=await import('@electric-sql/pglite');const db=await PGlite.create();
await db.exec(readFileSync('scripts/sql-andaime.sql','utf8'));
await db.exec(`create or replace function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table user_gardens_3d(user_id uuid primary key, state jsonb not null);`);
const sql=readFileSync('supabase/migrations/20261017220000_garden_expansions.sql','utf8');await db.exec(sql);await db.exec(sql);
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
await db.exec(`insert into auth.users values('${owner}'),('${other}');insert into user_profiles(id,fragments,wallet) values('${owner}',3000,'{"fragments":3000,"gold":99}'),('${other}',10,'{"fragments":10}');select set_config('request.jwt.claim.sub','${owner}',false);`);
const value=async(q)=>Object.values((await db.query(q)).rows[0])[0];
const buy=n=>value(`select buy_garden_expansion(${n})`);
assert.equal(await value('select get_garden_expansion()'),0);
await assert.rejects(()=>buy(2),/EXPANSION_ORDER/);await assert.rejects(()=>buy(8),/INVALID_EXPANSION/);
await assert.rejects(()=>db.exec(`insert into user_gardens_3d values('${owner}','{"terrain":{"size":"expansion-1"}}')`),/GARDEN_SIZE_NOT_OWNED/);
await db.exec(`insert into user_gardens_3d values('${owner}','{"terrain":{"size":"spacious"},"objects":[{"id":"keep"}]}')`);
let balance=3000;
for(const [i,price] of [80,140,220,320,450,650,900].entries()){
 const r=await buy(i+1);balance-=price;assert.equal(r.balance,balance);assert.equal(r.charged,price);
 assert.equal((await buy(i+1)).charged,0);
 await db.exec(`update user_gardens_3d set state=jsonb_set(state,'{terrain,size}','"expansion-${i+1}"') where user_id='${owner}'`);
}
assert.equal(balance,240);assert.equal(await value(`select wallet->>'gold' from user_profiles where id='${owner}'`),'99');
assert.equal(await value(`select state#>>'{objects,0,id}' from user_gardens_3d where user_id='${owner}'`),'keep');
await db.exec(`select set_config('request.jwt.claim.sub','${other}',false)`);
assert.equal(await value('select get_garden_expansion()'),0);await assert.rejects(()=>buy(1),/INSUFFICIENT_FRAGMENTS/);
assert.equal(await value(`select fragments from user_profiles where id='${other}'`),10);
await db.exec('set role authenticated');await assert.rejects(()=>db.exec(`update garden_expansions set level=7`),/permission denied/);
await db.exec('reset role');await db.exec("select set_config('request.jwt.claim.sub','',false)");await assert.rejects(()=>buy(1),/AUTH_REQUIRED/);
console.log('EXPANSIONS_OK: prices, sequence, ownership on save, retries, balance, gold, layout, insufficient funds and access verified in local PostgreSQL.');await db.close();
