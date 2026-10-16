// Read-only audit. Credentials stay in process memory and are never printed/saved.
const fs=require('fs');const {execSync}=require('child_process');
const ref='klmsdcncmhtgnlcejzdi';
function cli(command){return JSON.parse(execSync(`npx supabase ${command} --project-ref ${ref} -o json`,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}));}
(async()=>{
 const keys=cli('projects api-keys');
 const service=keys.find(k=>k.name==='service_role')?.api_key;
 const anon=keys.find(k=>k.name==='anon')?.api_key;
 if(!service||!anon)throw Error('Required API credentials unavailable');
 const secretRows=cli('secrets list');
 const secrets=secretRows.map(s=>s.name);
 const remote='output/functions-audit-2026-10-15/supabase/functions';
 const report={checkedAt:new Date().toISOString(),functions:[],tables:{},probes:[]};
 for(const name of fs.readdirSync(remote).filter(n=>n!=='_shared')){
   const source=fs.readFileSync(`${remote}/${name}/index.ts`,'utf8');
   const local=fs.readFileSync(`supabase/functions/${name}/index.ts`,'utf8');
   const env=[...source.matchAll(/Deno\.env\.get\(["']([^"']+)["']\)/g)].map(m=>m[1]);
   report.functions.push({name,sameEntrySource:source.replace(/\r\n/g,'\n')===local.replace(/\r\n/g,'\n'),configured:env.filter(e=>secrets.includes(e)||e.startsWith('SUPABASE_')),notListed:env.filter(e=>!secrets.includes(e)&&!e.startsWith('SUPABASE_'))});
 }
 async function read(path){const r=await fetch(`https://${ref}.supabase.co/rest/v1/${path}`,{headers:{apikey:service,Authorization:`Bearer ${service}`}});return {status:r.status,body:await r.json()};}
 const schema=await read('');
 report.deletionRetryRpcPresent=Boolean(schema.body.paths?.['/rpc/claim_account_deletion_retries']);
 const columns=await read('account_deletion_requests?select=retry_count,lease_until,retry_after&limit=0');
 report.deletionRetryColumnsPresent=columns.status===200;
 const config=await fetch(`https://${ref}.supabase.co/rest/v1/rpc/get_internal_runtime_config`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},body:JSON.stringify({p_key:'web_push_webhook_secret'})});
 const internalSecret=await config.json();
 report.pushCronConfigReadStatus=config.status;
 report.pushCronConfigPresent=typeof internalSecret==='string'&&internalSecret.length>0;
 if(report.pushCronConfigPresent){
   const check=await fetch(`https://${ref}.supabase.co/functions/v1/web-push`,{method:'POST',headers:{'Content-Type':'application/json','x-web-push-secret':internalSecret},body:JSON.stringify({action:'dispatch-notification'})});
   report.pushCronSecretAccepted=check.status===400;await check.text();
 }
 const anonConfig=await fetch(`https://${ref}.supabase.co/rest/v1/rpc/get_internal_runtime_config`,{method:'POST',headers:{apikey:anon,Authorization:`Bearer ${anon}`,'Content-Type':'application/json'},body:JSON.stringify({p_key:'web_push_webhook_secret'})});
 report.internalConfigAnonymousReadStatus=anonConfig.status;await anonConfig.text();
 for(const [table,columns] of Object.entries({push_subscriptions:'failure_count,last_error,last_success_at,disabled_at',notification_push_dispatches:'status',oracle_message_push_dispatches:'status',account_deletion_requests:'status'})){
   const r=await read(`${table}?select=${columns}&limit=1000`);
   if(r.status!==200){report.tables[table]={http:r.status,code:r.body.code};continue;}
   if(table==='push_subscriptions')report.tables[table]={sample:r.body.length,active:r.body.filter(x=>!x.disabled_at).length,activeWithErrors:r.body.filter(x=>!x.disabled_at&&x.last_error).length,disabled:r.body.filter(x=>x.disabled_at).length,everSucceeded:r.body.filter(x=>x.last_success_at).length,latestSuccess:r.body.map(x=>x.last_success_at).filter(Boolean).sort().at(-1),failures:r.body.filter(x=>x.failure_count>0).length,errorKinds:[...new Set(r.body.filter(x=>x.last_error).map(x=>/UNREGISTERED|registration-token-not-registered|not registered|not found|no longer valid/i.test(x.last_error)?'expired_token':/SENDER_ID_MISMATCH/i.test(x.last_error)?'sender_mismatch':/superseded/i.test(x.last_error)?'superseded_token':/permission|credential|unauth/i.test(x.last_error)?'authorization':'other'))]};
   else report.tables[table]={sample:r.body.length,statuses:r.body.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{})};
 }
 // Only unauthenticated calls; guards reject these before any delivery or mutation.
 for(const [name,body] of [['web-push',{action:'register'}],['web-push',{action:'dispatch-notification'}],['web-push',{action:'dispatch-oracle-message'}],['account-delete',{}],['account-delete-retry',{}],['oracle',{action:'generate-automatic-feed'}],['resend',{}],['widget-action',{}],['google-play-purchase',{}]]){
   const r=await fetch(`https://${ref}.supabase.co/functions/v1/${name}`,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify(body)});
   report.probes.push({name,action:body.action||null,http:r.status});await r.text();
 }
 fs.writeFileSync('output/functions-audit-2026-10-15/report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
})().catch(()=>{console.error('Audit failed; credentials and raw responses suppressed.');process.exitCode=1;});
