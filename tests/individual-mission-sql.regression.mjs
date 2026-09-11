// Executes the actual migration in local PostgreSQL. Fixtures only, no live account.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {PGlite}=await import(process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
const db=new PGlite();
const user='00000000-0000-0000-0000-000000000001';
const arena='00000000-0000-0000-0000-000000000002';
const other='00000000-0000-0000-0000-000000000003';
try {
await db.exec(`
create schema auth; create schema extensions;
create function auth.uid() returns uuid language sql as $$select '${user}'::uuid$$;
create table user_profiles(id uuid primary key, arena_pact_arena_id uuid, arena_pact_kind text,
 arena_pact_difficulty text, arena_pact_goal integer, arena_pact_started_on date, arena_pact_ends_on date,
 gold integer default 0, wallet jsonb default '{}');
create table arenas(id uuid primary key,user_id uuid,is_archived boolean default false);
create table actions(id text primary key,user_id uuid,arena_id uuid,action_type text,repetitions integer default 1);
create table scheduled_tasks(id text primary key,user_id uuid,action_id text,date date,start_time integer,completed boolean);
create table user_purchases(user_id uuid,product_type text,product_id text);
create function _starter_reward_has_purchase_marker(u uuid,t text,i text) returns boolean language sql as $$
 select exists(select 1 from user_purchases where user_id=u and product_type=t and product_id=i)$$;
create function _starter_reward_mark_purchase(u uuid,t text,i text,b boolean) returns void language sql as $$
 insert into user_purchases values(u,t,i)$$;
-- Reward dependencies are fixture stubs: verifies RPC amount and atomic slot clearing,
-- not the production wallet, EXP, chest or ledger implementations.
create function _starter_reward_credit_gold(u uuid,amount integer,t text,label text,details jsonb) returns integer language plpgsql as $$
declare result integer; begin update user_profiles set gold=gold+amount where id=u returning gold into result; return result; end$$;
insert into user_profiles(id) values('${user}');
insert into arenas(id,user_id) values('${arena}','${user}'),('${other}','${user}');
insert into actions values('a','${user}','${arena}','Padrao',1),('b','${user}','${other}','Padrao',1),('free','${user}','${arena}','Livre',1);
`);
await db.exec(await readFile(new URL('../supabase/migrations/20260910220000_fix_individual_mission_scope.sql',import.meta.url),'utf8'));
const accept=(scope,kind,goal)=>db.query('select accept_arena_pact($1,$2,$3,$4) as result',[scope,kind,'alta',goal]);
const claim=()=>db.query('select claim_arena_pact_reward() as result');
const add=(id,action,offset=0,start=600)=>db.query(`insert into scheduled_tasks values($1,$2,$3,
 (timezone('America/Sao_Paulo',now())-interval '4 hours')::date+$4::integer,$5,true)`,[id,user,action,offset,start]);
await accept(null,'volume',3);
assert.equal((await db.query('select arena_pact_difficulty as d from user_profiles')).rows[0].d,'leve');
await assert.rejects(accept(arena,'volume',3), /PACT_ALREADY_ACTIVE/);
await add('one','a'); await add('two','b'); await add('excluded','free');
await assert.rejects(claim(), /PACT_NOT_COMPLETE/);
await add('three','b');
assert.equal((await claim()).rows[0].result.gold_granted,2);
await assert.rejects(claim(), /NO_ACTIVE_PACT/);
await assert.rejects(accept(null,'volume',3), /PACT_ALREADY_REWARDED_TODAY/);
// Remove only the identity marker to exercise the independent paid-window guard.
await db.exec("delete from user_purchases where product_type='arena_pact'");
await assert.rejects(accept(null,'volume',3), /PACT_PREVIOUS_WINDOW_STILL_OPEN/);
await assert.rejects(accept(null,'retomada',2), /PACT_SCOPE_REQUIRES_VOLUME/);
console.log('PASS general mission, unique slot, cross-arena progress, Livre exclusion, single reward, paid window');
await db.exec('truncate scheduled_tasks');
await accept(arena,'retomada',2);
await add('first','a'); await add('future','a',1); await add('dawnBeforeStart','a',0,120); await add('anotherArena','b');
await assert.rejects(claim(), /PACT_NOT_COMPLETE/);
await add('second','a');
assert.equal((await claim()).rows[0].result.gold_granted,2);
await assert.rejects(claim(), /NO_ACTIVE_PACT/);
console.log('PASS return mission requires two, ignores future, pre-start 4am rollover and other arena');
await assert.rejects(accept(arena,'retomada',2), /PACT_ALREADY_REWARDED_TODAY/);
// Independent legacy fixture: same-day marker from the previous case must not carry over.
await db.exec('truncate scheduled_tasks, user_purchases');
await accept(arena,'retomada',1); await add('legacy','a');
assert.equal((await claim()).rows[0].result.gold_granted,2);
console.log('PASS legacy return mission goal 1 preserved');
await db.exec('truncate scheduled_tasks');
await accept(arena,'constancia',2);
await add('sameDay1','a'); await add('sameDay2','a');
await assert.rejects(claim(), /PACT_NOT_COMPLETE/);
await db.exec("update user_profiles set arena_pact_started_on=arena_pact_started_on-1");
await add('previousOperationalDay','a',0,120);
assert.equal((await claim()).rows[0].result.gold_granted,2);
console.log('PASS constancy counts operational days, not deliveries');
const check=await db.query(await readFile(new URL('../supabase/CHECK-missao-individual.sql',import.meta.url),'utf8'));
assert.equal(check.rows[0].verificacao.missoes_gerais_ativas,0);
assert.equal(check.rows[0].verificacao.funcoes.some(f=>f.checagem_tipo_ativo_com_uuid),false);
console.log('PASS read-only diagnostic on migrated fixture schema');
} finally { await db.close(); }
