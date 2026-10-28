// Executes the migration and RPCs in real local PostgreSQL (PGlite), synthetic accounts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const read = p => readFileSync(new URL('../'+p, import.meta.url),'utf8');
await db.exec(`
create role authenticated; create role anon;
create schema auth; create schema extensions; create schema cron;
create function extensions.gen_random_uuid() returns uuid language sql as $$select gen_random_uuid()$$;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.uid',true),'')::uuid$$;
create function cron.schedule(text,text,text) returns bigint language sql as $$select 1::bigint$$;
create table auth.users(id uuid primary key);
create table user_profiles(id uuid primary key,nickname text,wallet jsonb default '{"gold":1000}',nobility jsonb default '{"exp":0}',completed_season_missions jsonb default '[]',role text,is_premium boolean default false,premium_expires_at timestamptz,subscription_tier text,relationship_slots_purchased int not null default 0,linked_arena_slots_purchased int not null default 0);
create table arenas(id uuid primary key default gen_random_uuid(),user_id uuid,asset_id text,name text,description text,icon text,is_archived boolean default false);
create table actions(id uuid primary key default gen_random_uuid(),user_id uuid,arena_id uuid references arenas on delete cascade,name text,description text,icon text,duration int,repetitions int,action_type text,difficulty text,briefing text,assets jsonb,pre_flight jsonb,context jsonb,origin_codex_id uuid);
create table scheduled_tasks(id uuid primary key default gen_random_uuid(),user_id uuid,action_id text,date text,completed boolean default false,completed_at timestamptz,created_at timestamptz default now());
create table cycles(id uuid primary key default gen_random_uuid(),user_id uuid,start_date text,end_date text,report_data jsonb,created_at timestamptz default now());
create table notifications(id uuid primary key default gen_random_uuid(),user_id uuid,type text,content text,read boolean,metadata jsonb,created_at timestamptz default now());
create table relationship_links(id uuid primary key default gen_random_uuid(),mentor_id uuid,pupil_id uuid,link_type text,arena_id uuid,arena_snapshot jsonb,satisfaction_level int default 50,created_at timestamptz default now(),updated_at timestamptz default now(),ended_at timestamptz,expires_at timestamptz,arena_slots int default 1,renewed_at timestamptz,renewal_count int default 0);
create table relationship_link_invites(id uuid primary key default gen_random_uuid(),sender_id uuid,recipient_id uuid,link_type text,arena_id uuid,arena_snapshot jsonb,status text default 'pending',created_at timestamptz default now(),responded_at timestamptz,cost_gold int default 0,refunded_at timestamptz,expires_at timestamptz,arena_slots int default 1);
create table relationship_link_arenas(id uuid primary key default gen_random_uuid(),relationship_link_id uuid references relationship_links,arena_id uuid references arenas on delete cascade,created_by_user_id uuid,created_at timestamptz default now(),metadata jsonb default '{}',completed_at timestamptz,unique(relationship_link_id,arena_id));
create table relationship_competition_challenges(id uuid primary key default gen_random_uuid(),relationship_link_id uuid references relationship_links,source_arena_id uuid references arenas on delete set null,challenger_user_id uuid,opponent_user_id uuid,challenger_arena_id uuid not null references arenas on delete cascade,opponent_arena_id uuid not null references arenas on delete cascade,winner_user_id uuid,winner_arena_id uuid references arenas on delete set null,reward_chest_type varchar(30),winner_bonus_xp int,reward_granted_at timestamptz,created_at timestamptz default now(),completed_at timestamptz,sealed_at timestamptz,challenger_completed_at timestamptz,opponent_completed_at timestamptz,duration_days int,starts_at timestamptz,deadline_at timestamptz,result_kind text,metadata jsonb default '{}');
create policy "Relationship participants can read linked arenas" on arenas for select using(true);
create policy "Relationship participants can read linked actions" on actions for select using(true);
create policy "Relationship participants can read linked scheduled tasks" on scheduled_tasks for select using(true);
create policy "Competition participants can read challenges" on relationship_competition_challenges for select using(true);
create policy "Participants can read linked relationship arenas" on relationship_link_arenas for select using(true);
create table test_rewards(user_id uuid,kind text);
create function _competition_grant_chest(uuid,varchar) returns void language sql as $$insert into test_rewards values($1,$2)$$;
create function _codex_debit_gold(uuid,int,text,text,jsonb) returns int language plpgsql as $$declare g int; begin
 update user_profiles set wallet=jsonb_build_object('gold',(wallet->>'gold')::int-$2) where id=$1 and (wallet->>'gold')::int >= $2 returning (wallet->>'gold')::int into g;
 if g is null then raise exception 'Saldo insuficiente';end if;return g;end$$;
create function _relationship_credit_gold(uuid,int,text,text,jsonb) returns int language sql as $$update user_profiles set wallet=jsonb_build_object('gold',(wallet->>'gold')::int+$2) where id=$1 returning (wallet->>'gold')::int$$;
`);
function extract(file, name) {
 const source=read(file); const start=source.indexOf('create or replace function public.'+name+'(');
 assert(start>=0,name); const end=source.indexOf('$$;',start);return source.slice(start,end+3);
}
for(const name of ['_competition_snapshot_arena_exists','_competition_calculate_bonus_xp','guard_competition_snapshot_arena_mutation','guard_competition_snapshot_action_mutation'])
 await db.exec(extract('supabase/migrations/20260330113000_refine_relationship_competition_and_partnership.sql',name));
await db.exec(extract('supabase/migrations/20260317224500_relationship_capacity_rework.sql','_relationship_refund_pending_invite'));
await db.exec(extract('supabase/migrations/20260814170000_add_timed_competition_results.sql','_competition_grant_bonus_xp'));
await db.exec(`create trigger guard_arena before update or delete on arenas for each row execute function guard_competition_snapshot_arena_mutation();
create trigger guard_action before insert or update or delete on actions for each row execute function guard_competition_snapshot_action_mutation();`);
await db.exec(read('supabase/migrations/20261006120000_relationship_lifecycle_v3.sql'));
const q=async(sql,args=[]) => (await db.query(sql,args)).rows;
const rpc=async(sql,args=[]) => (await q('select '+sql+' as result',args))[0].result;
const u='00000000-0000-0000-0000-000000000001',v='00000000-0000-0000-0000-000000000002',stranger='00000000-0000-0000-0000-000000000003',p='00000000-0000-0000-0000-000000000004';
const login=id=>q("select set_config('request.uid',$1,false)",[id]);
for(const id of [u,v,stranger,p]){await q('insert into auth.users values($1)',[id]);await q('insert into user_profiles(id) values($1)',[id]);}

// AS FICHAS DE VINCULO (28/10/2026): a migracao nova por cima da v3.
await db.exec("create function public._relationship_linked_arena_capacity(p_user_id uuid) returns jsonb language sql as $$ select '{}'::jsonb $$;");
await db.exec(read('supabase/migrations/20261028130000_fichas_de_vinculo.sql'));
const ouro=async id=>(await q('select wallet from user_profiles where id=$1',[id]))[0].wallet.gold;
const fichas=async id=>(await q('select fichas_de_vinculo n from user_profiles where id=$1',[id]))[0].n;

// 1. Gratis sem ficha nao convida; comprar a ficha custa 50 ouro e fica guardada.
await login(u);
await assert.rejects(()=>rpc("propose_relationship_v3($1,'parceria')",[v]),/FICHA_DE_VINCULO_NECESSARIA/);
await rpc("buy_relationship_capacity_slot('relationship_slot')");
assert.equal(await ouro(u),950); assert.equal(await fichas(u),1);

// 2. Convidar gasta a ficha e nao cobra ouro.
let convite=(await rpc("propose_relationship_v3($1,'parceria')",[v])).invite;
assert.equal(convite.cost_gold,0); assert.equal(convite.paga_com,'ficha');
assert.equal(await fichas(u),0); assert.equal(await ouro(u),950);

// 3. Recusado, a ficha volta.
await login(v); await rpc("respond_relationship_link_invite($1,'decline')",[convite.id]);
assert.equal(await fichas(u),1);

// 4. Aceito, o vinculo nasce por 30 dias, sem limite de vagas.
await login(u); convite=(await rpc("propose_relationship_v3($1,'parceria')",[v])).invite;
await login(v); const vinculo=(await rpc("respond_relationship_link_invite($1,'accept')",[convite.id])).link;
assert.ok(vinculo.id); assert.equal(await fichas(u),0);

// 5. Premium: 2 fichas do plano por mes; a terceira pede ficha comprada.
await q("update user_profiles set is_premium=true, subscription_tier='premium', premium_expires_at=now()+interval '10 days' where id=$1",[p]);
await login(p);
let resumo=await rpc('_relationship_build_capacity_summary($1)',[p]);
assert.deepEqual([resumo.relationship_slot.base,resumo.relationship_slot.used,resumo.relationship_slot.limit],[2,0,2]);
const c1=(await rpc("propose_relationship_v3($1,'parceria')",[u])).invite;
const c2=(await rpc("propose_relationship_v3($1,'parceria')",[v])).invite;
assert.equal(c1.paga_com,'plano'); assert.equal(c2.paga_com,'plano');
await assert.rejects(()=>rpc("propose_relationship_v3($1,'parceria')",[stranger]),/FICHA_DE_VINCULO_NECESSARIA/);
resumo=await rpc('_relationship_build_capacity_summary($1)',[p]);
assert.deepEqual([resumo.relationship_slot.used,resumo.relationship_slot.limit],[2,2]);

// 6. Revogar devolve a ficha do plano ao mes; o plano nao acumula de um mes para o outro.
await rpc("respond_relationship_link_invite($1,'revoke')",[c2.id]);
resumo=await rpc('_relationship_build_capacity_summary($1)',[p]);
assert.equal(resumo.relationship_slot.used,1);
await q("update relationship_link_invites set created_at=now()-interval '40 days' where id=$1",[c1.id]);
resumo=await rpc('_relationship_build_capacity_summary($1)',[p]);
assert.equal(resumo.relationship_slot.used,0, 'o mes novo comeca com as fichas do plano inteiras');

// 7. Platinum: 5 por mes. Mentoria pedida pelo cliente tambem gasta ficha de quem convida.
await q("update user_profiles set subscription_tier='platinum' where id=$1",[p]);
resumo=await rpc('_relationship_build_capacity_summary($1)',[p]);
assert.equal(resumo.relationship_slot.base,5);
const m=(await rpc('propose_client_paid_mentorship($1,$2)',[stranger,p])).invite;
assert.equal(m.paga_com,'plano'); assert.equal(m.cost_gold,0);

// 8. Vaga comprada antes vira ficha guardada.
await q('update user_profiles set relationship_slots_purchased=3 where id=$1',[stranger]);
await db.exec(read('supabase/migrations/20261028130000_fichas_de_vinculo.sql'));
assert.equal(await fichas(stranger),3);

console.log('Fichas de vinculo: ficha no lugar do ouro e da vaga, reembolso, plano por mes que nao acumula.');
