import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const sql=readFileSync(new URL('../supabase/migrations/20261011180000_remove_confirmed_legacy_tables.sql',import.meta.url),'utf8');
const names=[...sql.match(/targets constant text\[\] := ARRAY\[([\s\S]*?)\]/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
for(const mode of ['empty','data','trigger','view','job']){
 const db=new PGlite();try{
 await db.exec(names.map(n=>`create table public.${n}(id int);`).join('\n')+`create table public.asset_levels(id int); create table public.asset_slots(id int); create function public.handle_new_user() returns trigger language plpgsql as $$begin return new; end$$;`);
 if(mode==='data')await db.exec('insert into user_assets values(1)');
 if(mode==='trigger')await db.exec('create trigger old_signup before insert on asset_levels for each row execute function handle_new_user()');
 if(mode==='view')await db.exec('create view keep_old as select * from user_assets');
 if(mode==='job')await db.exec("create schema cron; create table cron.job(command text); insert into cron.job values('select * from public.user_assets');");
 if(mode==='empty'){await db.exec(sql);await db.exec(sql);assert.equal((await db.query("select to_regclass('public.user_assets') x")).rows[0].x,null);}
 else {await assert.rejects(()=>db.exec(sql));await db.exec('rollback');for(const n of names)assert.ok((await db.query('select to_regclass($1) x',[`public.${n}`])).rows[0].x);assert.ok((await db.query("select to_regprocedure('public.handle_new_user()') x")).rows[0].x);}
 assert.ok((await db.query("select to_regclass('public.asset_levels') x")).rows[0].x);assert.ok((await db.query("select to_regclass('public.asset_slots') x")).rows[0].x);
 console.log('PASS',mode);
 }finally{await db.close();}
}
