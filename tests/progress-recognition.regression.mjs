import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { transform } from 'esbuild';
const {code}=await transform(readFileSync('utils/progressRecognition.ts','utf8'),{loader:'ts',format:'esm'});
const {officialTop,expAverageLabel}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const value={kind:'mastery',subjectId:'x',current:90,cohortSize:100};
for(const [pct,label] of [[1,'Top 1%'],[2,'Top 5%'],[5,'Top 5%'],[6,'Top 10%'],[10,'Top 10%'],[11,null],[0,null],[NaN,null]]) assert.equal(officialTop({...value,topPercent:pct}),label);
assert.equal(officialTop({...value,cohortSize:99,topPercent:1}),null);
assert.equal(expAverageLabel(120,100,30),'↑ 20% acima da sua média de EXP');
assert.equal(expAverageLabel(88,100,30),'↓ 12% abaixo da sua média de EXP');
assert.equal(expAverageLabel(0,100,30),'↓ 100% abaixo da sua média de EXP');
assert.equal(expAverageLabel(10,0,30),null);
assert.equal(expAverageLabel(10,5,6),null);
assert.equal(expAverageLabel(100.1,100,30),'Na sua média de EXP');
const db=new PGlite();
const uid=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
try {
await db.exec(`create role anon;create role authenticated;create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
create table auth.users(id uuid primary key,created_at timestamptz);
create table public.user_profiles(id uuid primary key,role text,email text,level numeric);
create table public.daily_comparison_exclusions(user_id uuid);
create table public.actions(id uuid,user_id uuid,action_type text,duration numeric,difficulty numeric);
create table public.scheduled_tasks(id uuid,user_id uuid,action_id uuid,date date,start_time integer,duration numeric,completed boolean);
create table public.cycles(id uuid,user_id uuid,start_date date,end_date date,report_data jsonb);
create table public.clans(id uuid,exp numeric);
create table public.clan_members(user_id uuid,clan_id uuid);`);
const migration=readFileSync('supabase/migrations/20261013200000_progress_recognition.sql','utf8');
await db.exec(migration);await db.exec(migration);
const today=(await db.query("select (now() at time zone 'America/Sao_Paulo'-interval '4 hours')::date::text as day")).rows[0].day;
await db.query(`insert into auth.users values($1,now()-interval '100 days')`,[uid(1)]);
await db.exec(`insert into public.user_profiles select ('00000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'user','p'||i||'@glyph.test',case when i=1 then 50 else 40 end from generate_series(1,100) i;
insert into public.clans select id,case when level=50 then 1000 else 10 end from public.user_profiles;
insert into public.clan_members select id,id from public.user_profiles;`);
const asUser=async n=>db.query("select set_config('test.uid',$1,false)",[n?uid(n):'']);
const get=async (kind,date=null,cycle=null)=>(await db.query('select public.get_progress_recognition($1,$2,$3) as result',[kind,date,cycle])).rows[0].result;
await asUser(1);
assert.equal((await get('mastery')).topPercent,1);
assert.equal((await get('clan')).topPercent,1);
await db.exec(`update public.user_profiles set level=50 where id='${uid(2)}'`);
assert.equal((await get('mastery')).topPercent,2,'ties take end of group');
await db.exec(`update public.user_profiles set level=50`);
assert.equal(officialTop(await get('mastery')),null,'all tied earns no top tag');
await db.exec(`insert into public.daily_comparison_exclusions values('${uid(100)}')`);
assert.equal((await get('mastery')).topPercent,null,'99 legitimate participants: hidden');
await db.exec('delete from public.daily_comparison_exclusions');
await db.query(`insert into public.actions values($1,$1,'Pontuada',100,2),($2,$1,'Livre',999,3)`,[uid(1),uid(2)]);
await db.query(`insert into public.scheduled_tasks values
($1,$1,$1,$3::date-1,300,100,true),
($2,$1,$1,$3::date,100,100,true),
($4,$1,$1,$3::date,300,200,true),
($5,$1,$2,$3::date-1,300,999,true),
($6,$1,$1,$3::date+1,300,999,true)`,[uid(1),uid(2),today,uid(3),uid(4),uid(5)]);
const day=await get('day',today);
assert.equal(day.current,210,'difficulty matches client');
assert.equal(day.baseline,7,'two previous-day tasks including before 4h: 210/30; zeros count');
assert.equal(day.baselineDays,30);
await asUser(2);assert.equal(await get('day',today),null,'does not reuse another account baseline');await asUser(1);
// Closed cycles: total EXP with same duration, latest per other player.
await db.query(`insert into public.cycles select id,id,$1::date-6,$1::date,jsonb_build_object('exp_gained',case when id=$2 then 700 else 600 end) from public.user_profiles`,[today,uid(1)]);
await db.query(`insert into public.cycles values($1,$3,$4::date-40,$4::date-34,'{"exp_gained":700}'),($2,$3,$4::date-20,$4::date-14,'{"exp_gained":700}')`,[uid(201),uid(202),uid(1),today]);
const cycle=await get('cycle',null,uid(1));
assert.equal(cycle.current,700);assert.equal(cycle.days,7);assert.equal(cycle.topPercent,1);
assert.equal(cycle.baselineDays,34);assert.ok(Math.abs(cycle.baseline-1400/34)<1e-9,'zeros in gaps, exclude compared cycle');
await asUser(2);assert.equal(await get('cycle',null,uid(1)),null,'other report inaccessible');await asUser(1);
await db.query(`insert into public.cycles values($1,$2,$3::date-29,$3::date,'{"exp_gained":99999}')`,[uid(203),uid(2),today]);
assert.equal((await get('cycle',null,uid(1))).topPercent,1,'different duration not ranked against 7-day cycle');
await db.query(`update public.cycles set report_data='{"exp_gained":900}' where user_id<>$1 and id=user_id`,[uid(1)]);
assert.equal(officialTop(await get('cycle',null,uid(1))),null,'tag disappears as others overtake');
await asUser(null);assert.equal(await get('mastery'),null);
await db.exec('set role anon');await assert.rejects(()=>get('mastery'),/permission denied/);await db.exec('reset role');
console.log('PASS: official tiers, ties, population, changing positions, EXP math, 4h day, empty days, historical cycle baseline, duration cohorts, account isolation, grants, idempotent SQL.');
} finally { await db.close(); }
