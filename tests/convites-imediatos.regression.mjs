import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const db=new PGlite();
const owner='00000000-0000-0000-0000-000000000001';
try {
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key, created_at timestamptz default now());
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table user_profiles(id uuid primary key, nickname text);
create table reward_codes(code text);
create table friends(user_id uuid, friend_id uuid);
create table notifications(id uuid,user_id uuid,type text,content text,read boolean,created_at timestamptz,metadata jsonb);
create table markers(uid uuid,kind text,marker text,unique(uid,kind,marker));
create table rewards(uid uuid,kind text,amount int);
create function _starter_reward_has_purchase_marker(uuid,text,text) returns boolean language sql as $$select exists(select 1 from markers where uid=$1 and kind=$2 and marker=$3)$$;
create function _starter_reward_mark_purchase(uuid,text,text,boolean) returns void language sql as $$insert into markers values($1,$2,$3)$$;
create function _starter_reward_credit_gold(uuid,int,text,text,jsonb) returns int language plpgsql as $$begin insert into rewards values($1,'gold',$2); return $2; end$$;
create function grant_chest(uuid,text) returns void language sql as $$insert into rewards values($1,$2,1)$$;
insert into auth.users(id) values('${owner}'); insert into user_profiles values('${owner}','Owner');`);
await db.exec(read('supabase/migrations/20261010150000_convite_de_amigo.sql'));
await db.exec(read('supabase/migrations/20261011120000_convites_imediatos.sql'));
await db.exec(`insert into convites values('${owner}','OWNER-123',now());`);
const login=async id=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);
const rpc=async(sql,args=[])=> (await db.query(sql,args)).rows[0].v;
await login(owner);
assert.equal((await rpc("select usar_codigo_de_convite('OWNER-123') v")).error,'OWN_CODE');
await assert.rejects(()=>rpc('select receber_premio_de_convite(1) v'),/MARCO_NAO_ALCANCADO/);
for(let i=2;i<=11;i++) {
const id=`00000000-0000-0000-0000-${String(i).padStart(12,'0')}`;
await db.query('insert into auth.users(id) values($1)',[id]); await login(id);
assert.equal((await rpc("select usar_codigo_de_convite('OWNER-123') v")).success,true);
assert.equal((await rpc("select usar_codigo_de_convite('OWNER-123') v")).error,'INVITE_ALREADY_USED');
await login(owner);
const state=await rpc('select meus_convites() v'); assert.equal(state.entraram,i-1); assert.equal(state.completaram,i-1);
if([1,5,10].includes(i-1)) {
const result=await rpc('select receber_premio_de_convite($1) v',[i-1]);
assert.equal(result.chest_type, i===2?'Comum':i===6?'Raro':null);
assert.equal((await rpc('select receber_premio_de_convite($1) v',[i-1])).already_claimed,true);
}
}
const state=await rpc('select meus_convites() v'); assert.ok(state.recebeu_1&&state.recebeu_5&&state.recebeu_10);
assert.equal((await db.query('select * from notifications')).rows.length,10);
assert.match((await db.query('select content from notifications limit 1')).rows[0].content,/baú Comum/);
assert.equal((await db.query('select * from rewards where uid=$1',[owner])).rows.length,3);
await assert.rejects(()=>rpc('select receber_premio_de_convite(2) v'),/MARCO_INVALIDO/);
console.log('PASS: convite imediato sem dias_no_app; 1/5/10; resgate único; avisos; próprio código e repetição bloqueados.');
} finally {await db.close();}
