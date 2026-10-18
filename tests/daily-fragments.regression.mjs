import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
if(!process.argv.includes('--worker')){
 const r=spawnSync(process.execPath,[import.meta.filename,'--worker'],{encoding:'utf8'});
 if(!r.stdout.includes('DAILY_FRAGMENTS_OK')){console.error(r.stdout,r.stderr);process.exit(1);}
 console.log(r.stdout.trim());process.exit(0);
}
const {PGlite}=await import('@electric-sql/pglite');const db=await PGlite.create();
await db.exec(readFileSync('scripts/sql-andaime.sql','utf8'));
await db.exec(`create or replace function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
const sql=readFileSync('supabase/migrations/20261017230000_daily_fragments.sql','utf8');await db.exec(sql);await db.exec(sql);
const uid='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',action='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',free='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
await db.exec(`insert into auth.users values('${uid}'),('${other}');insert into user_profiles(id,fragments,wallet) values('${uid}',20,'{"fragments":20,"gold":99}'),('${other}',0,'{}');insert into actions(id,user_id,action_type,duration) values('${action}','${uid}','Ação Recorrente',50),('${free}','${uid}','Livre',999);select set_config('request.jwt.claim.sub','${uid}',false);`);
const value=async(q)=>Object.values((await db.query(q)).rows[0])[0];
const today="(now() at time zone 'America/Sao_Paulo'-interval '4 hours')::date";
const claim=day=>value(`select claim_daily_fragments(${day})`);
assert.equal(await claim(`${today}-1`),null,'no rewards before migration activation');
await db.exec(`update daily_fragments_activation set start_day=${today}-20`);
await assert.rejects(()=>claim(today),/DAY_NOT_CLOSED/);await assert.rejects(()=>claim(`${today}+1`),/DAY_NOT_CLOSED/);
let balance=20;
for(const [i,exp] of [0,49,50,99,100,249,250,749,750,1500].entries()){
 const day=`${today}-${i+1}`;
 await db.exec(`insert into scheduled_tasks(id,user_id,action_id,date,start_time,duration,completed) values('task-${i}','${uid}','${action}',(${day})::text,600,${exp},true)`);
 const r=await claim(day),amount=Math.min(15,Math.floor(exp/50));balance+=amount;
 assert.equal(r.fragments,amount);assert.equal(r.rawExp,exp);assert.equal(r.balance,balance);
 assert.equal((await claim(day)).awarded,false);
 await db.exec(`update scheduled_tasks set duration=9999,completed=false where id='task-${i}';update scheduled_tasks set completed=true where id='task-${i}'`);
 assert.equal((await claim(day)).fragments,amount,'settled receipt remains frozen after edits');
}
const day=`${today}-15`;
await db.exec(`insert into scheduled_tasks(id,user_id,action_id,date,start_time,duration,completed) values
('carry','${uid}','${action}',(${day}+1)::text,120,100,true),
('free','${uid}','${free}',(${day})::text,600,999,true),
('pending','${uid}','${action}',(${day})::text,600,999,false),
('wrong-owner','${other}','${action}',(${day})::text,600,999,true)`);
const r=await claim(day);assert.equal(r.rawExp,100);assert.equal(r.fragments,2);balance+=2;
assert.equal(await value(`select wallet->>'gold' from user_profiles where id='${uid}'`),'99');
assert.equal(await value(`select fragments from user_profiles where id='${uid}'`),balance);
await db.exec(`select set_config('request.jwt.claim.sub','${other}',false)`);assert.equal((await claim(day)).fragments,0);
await db.exec('set role authenticated');await assert.rejects(()=>db.exec('delete from daily_fragment_receipts'),/permission denied/);await db.exec('reset role');
await db.exec("select set_config('request.jwt.claim.sub','',false)");await assert.rejects(()=>claim(day),/AUTH_REQUIRED/);
console.log('DAILY_FRAGMENTS_OK: /50 boundaries, cap 15, raw EXP, carryover, Free exclusion, ownership, retry/undo, closed days, activation and wallet preservation.');await db.close();
