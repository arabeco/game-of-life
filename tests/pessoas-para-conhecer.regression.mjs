import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db=await PGlite.create();
await db.exec(readFileSync('scripts/sql-andaime.sql','utf8'));
await db.exec(`alter table friend_requests add column responded_at timestamptz;
create table social_feed_events(id uuid primary key,user_id uuid,created_at timestamptz default now());
create table social_feed_likes(event_id uuid,user_id uuid,created_at timestamptz default now());
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
` .replace('create function auth.uid()', 'create or replace function auth.uid()'));
await db.exec(readFileSync('supabase/migrations/20261117120000_pessoas_para_conhecer.sql','utf8'));
const u='00000000-0000-0000-0000-000000000001',v='00000000-0000-0000-0000-000000000002',w='00000000-0000-0000-0000-000000000003';
for(const id of [u,v,w]){
 await db.query('insert into auth.users values($1)',[id]);
 await db.query("insert into user_profiles(id,nickname,feats_visibility,nobility) values($1,'Pessoa','all','{\"rankId\":\"vagante\"}')",[id]);
 await db.query("select set_config('request.uid',$1,false)",[id]);
 await db.query('select registrar_presenca_social()');
}
await db.query("select set_config('request.uid',$1,false)",[u]);
const people=async()=> (await db.query('select * from pessoas_para_conhecer()')).rows;
assert.equal((await people()).length,2);
await db.query('update user_profiles set social_discoverable=false where id=$1',[v]);
assert(!(await people()).some(p=>p.id===v));
await db.query('update user_profiles set social_discoverable=true where id=$1',[v]);
await db.query('insert into friends(user_id,friend_id) values($1,$2)',[v,u]);
assert(!(await people()).some(p=>p.id===v));
await db.exec('delete from friends');
await db.query("insert into friend_requests(id,sender_id,recipient_id,status,responded_at) values(gen_random_uuid(),$1,$2,'declined',now())",[v,u]);
assert(!(await people()).some(p=>p.id===v));
await db.exec('delete from friend_requests');
await db.query("insert into arenas(id,user_id,asset_id,name) values(gen_random_uuid(),$1,'strength','Treino força'),(gen_random_uuid(),$2,'strength','Treino força')",[u,v]);
assert.equal((await people()).find(p=>p.id===v).motivo,'Tem uma arena parecida com a sua');
await db.query("update user_profiles set feats_visibility='nobody' where id=$1",[v]);
assert.notEqual((await people()).find(p=>p.id===v).motivo,'Tem uma arena parecida com a sua');
for(let i=0;i<4;i++){
 const event=(await db.query('insert into social_feed_events(id,user_id) values(gen_random_uuid(),$1) returning id',[u])).rows[0].id;
 await db.query('insert into social_feed_likes(event_id,user_id) values($1,$2)',[event,v]);
}
assert.equal((await people()).find(p=>p.id===v).motivo,'Curtiu 3 feitos seus');
assert.equal((await db.query('select * from pontuacao_do_reino($1)',[[v]])).rows[0].pontos,13);
await db.query("insert into friend_requests(id,sender_id,recipient_id,status) values(gen_random_uuid(),$1,$2,'pending')",[u,v]);
assert(!(await people()).some(p=>p.id===v));await db.exec('delete from friend_requests');
await db.query("update social_presence set seen_at=now()-interval '8 days' where user_id=$1",[v]);
assert(!(await people()).some(p=>p.id===v));
assert(!(await people()).some(p=>'email' in p));
console.log('ok - Recomendações: privacidade, amizades, recusas, motivo, arena privada e atividade');
await db.close();
