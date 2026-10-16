import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
import {PGlite} from '@electric-sql/pglite';
const {code}=await transform(readFileSync('supabase/functions/resend/handler.ts','utf8'),{loader:'ts',format:'esm'});
const {createDeletionEmailHandler}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const rows=new Map();
let insertFails=false, calls=0, failures=0;
const requests=[];
const admin={from:()=>({
 insert:async row=>{if(insertFails)return{error:{code:'XX'}};if(rows.has(row.dispatch_key))return{error:{code:'23505'}};rows.set(row.dispatch_key,{...row,created_at:new Date().toISOString()});return{error:null};},
 select:()=>({eq:(_,key)=>({single:async()=>({data:rows.get(key),error:null})})}),
 update:values=>({eq:(_,key)=>{
  const apply=(exclude)=>{const row=rows.get(key);if(row&&row.status!==exclude)Object.assign(row,values);return{error:null};};
  return{then:resolve=>resolve(apply()),neq:async(_,exclude)=>apply(exclude)};
 }}),
})};
const fetcher=async(_url, options)=>{calls++;requests.push(options);if(failures-->0)throw Error('network');return new Response(JSON.stringify({id:'provider-1'}),{status:200});};
const handler=createDeletionEmailHandler({serviceKey:'server-only',apiKey:'test-key',from:'Glyph <no-reply@glyph.life>',admin,fetcher});
const payload=id=>({type:'account_deleted',content:'Conta excluída <texto>',metadata:{accountDeleted:true,sendEmail:true,email:'test@example.com',dispatchKey:`account-deleted:${id}`}});
const req=(id,token='server-only')=>new Request('https://local.test',{method:'POST',headers:{authorization:`Bearer ${token}`},body:JSON.stringify(payload(id))});
assert.equal((await handler(req(1,'user-jwt'))).status,401);assert.equal(calls,0);
insertFails=true;assert.equal((await handler(req(1))).status,503);assert.equal(calls,0);insertFails=false;
failures=1;assert.equal((await handler(req(1))).status,200);assert.equal(calls,2);
assert.equal(requests[0].headers['Idempotency-Key'],requests[1].headers['Idempotency-Key']);
assert.equal(requests[0].body,requests[1].body);assert.ok(requests[0].body.includes('&lt;texto&gt;'));
assert.equal((await (await handler(req(1))).json()).alreadyAccepted,true);assert.equal(calls,2);
failures=3;assert.equal((await handler(req(2))).status,502);assert.equal(rows.get('v2:account-deleted:2').status,'failed');
assert.equal((await handler(req(2))).status,200);assert.equal(rows.get('v2:account-deleted:2').status,'accepted');
rows.set('v2:account-deleted:3',{status:'pending',created_at:new Date(Date.now()-24*3600000).toISOString()});
const before=calls;assert.equal((await handler(req(3))).status,409);assert.equal(calls,before);
const testPayload={type:'delivery_test',metadata:{sendEmail:true,email:'test@example.com',dispatchKey:'delivery-test:regression-01'}};
const testReq=(token='server-only')=>new Request('https://local.test',{method:'POST',headers:{authorization:`Bearer ${token}`},body:JSON.stringify(testPayload)});
assert.equal((await handler(testReq('user-jwt'))).status,401);assert.equal(calls,before);
assert.equal((await handler(testReq())).status,200);
const testMail=JSON.parse(requests.at(-1).body);
assert.equal(testMail.subject,'Glyph — Teste de entrega');assert.ok(testMail.text.includes('Nenhuma conta foi excluída'));
assert.equal(rows.get('v2:delivery-test:regression-01').notification_type,'delivery_test');
const afterTest=calls;assert.equal((await (await handler(testReq())).json()).alreadyAccepted,true);assert.equal(calls,afterTest);
testPayload.metadata.dispatchKey='account-deleted:999';assert.equal((await handler(testReq())).status,400);
const db=new PGlite();try{
 await db.exec('create role anon;create role authenticated;create role service_role;create table notification_email_dispatches(dispatch_key text primary key);insert into notification_email_dispatches values(\'old\');');
 const sql=readFileSync('supabase/migrations/20261012180000_email_dispatch_state.sql','utf8');await db.exec(sql);await db.exec(sql);
 assert.equal((await db.query('select status from notification_email_dispatches')).rows[0].status,'legacy_unknown');
 await db.exec('set role anon');await assert.rejects(()=>db.query('select * from notification_email_dispatches'),/permission denied/);
}finally{await db.close();}
console.log('PASS: envio só backend, falha de banco bloqueia envio, retry com chave/corpo iguais, falha pode retentar, duplicata aceita não reenvia, janela vencida bloqueada, HTML escapado e schema privado/idempotente.');
