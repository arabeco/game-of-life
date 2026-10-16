import assert from 'node:assert/strict';
import {build} from 'esbuild';
let handler;
globalThis.__capture=fn=>{handler=fn;};
globalThis.Deno={env:{get:key=>({SUPABASE_URL:'https://example.invalid',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'private-fixture',WEB_PUSH_WEBHOOK_SECRET:'worker-fixture'}[key])}};
let calls=[];
globalThis.__client={auth:{getUser:async token=>token==='valid-user-token'?{data:{user:{id:'verified-id',email:'test@example.invalid',app_metadata:{}}}}:{error:{message:'invalid'}}},rpc:async(name,args)=>{calls.push({name,args});return {data:{busy:true,request:{id:99}}};}};
async function load(entry){
 const bundled=await build({entryPoints:[entry],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'fixtures',setup(b){
   b.onResolve({filter:/^https:\/\//},args=>({path:args.path,namespace:'fixture'}));
   b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path.includes('server.ts')?'export const serve=globalThis.__capture;':'export const createClient=()=>globalThis.__client;',loader:'js'}));
 }}]});
 await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
}
await load('supabase/functions/account-delete/index.ts');
const req=(token,body={})=>new Request('https://example.invalid',{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
assert.equal((await handler(req())).status,401);
assert.equal((await handler(req('forged'))).status,401);assert.equal(calls.length,0);
assert.equal((await handler(req('valid-user-token',{userId:'victim',source:'website'}))).status,409);
assert.equal(calls[0].args.p_user_id,'verified-id');assert.equal(calls[0].args.p_metadata.identity_verified,true);
calls=[];
await load('supabase/functions/account-delete-retry/index.ts');
assert.equal((await handler(req('valid-user-token'))).status,401);assert.equal(calls.length,0);
globalThis.__client.rpc=async()=>({data:[]});
const response=await handler(new Request('https://example.invalid',{method:'POST',headers:{'x-account-cleanup-secret':'worker-fixture'}}));
assert.equal(response.status,200);
console.log('PASS: unauthenticated/forged tokens blocked, user id derived from verified identity, active request not duplicated, worker restricted to its secret.');
