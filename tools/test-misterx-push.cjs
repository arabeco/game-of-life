// User-authorized single-recipient test. Never print credentials or device tokens.
const { execSync } = require('child_process');
(async () => {
 const ref='klmsdcncmhtgnlcejzdi';
 const keys=JSON.parse(execSync(`npx supabase projects api-keys --project-ref ${ref} -o json`,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}));
 const key=keys.find(k=>k.name==='service_role')?.api_key;
 if(!key) throw Error('No service key');
 const root=`https://${ref}.supabase.co`;
 const response=await fetch(`${root}/rest/v1/rpc/get_internal_runtime_config`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({p_key:'web_push_webhook_secret'})});
 const secret=await response.json();
 if(!response.ok || typeof secret!=='string' || !secret) throw Error('No dispatch credential');
 const result=await fetch(`${root}/functions/v1/web-push`,{method:'POST',headers:{'Content-Type':'application/json','x-web-push-secret':secret},body:JSON.stringify({action:'dispatch-notification',record:{id:'glyph-authorized-test-20261016-misterx-01',user_id:'e76e2b7f-a771-4738-a10a-30a993ecafeb',type:'system',content:'Teste solicitado por você: o push do Glyph chegou ao seu Android. Confirme no chat.',read:false}})});
 const data=await result.json();
 console.log(JSON.stringify({http:result.status,sent:data.sent,failed:data.failed,skipped:data.skipped,reason:data.reason,success:data.success}));
})().catch(()=>{console.error('Push test failed; sensitive details suppressed.');process.exitCode=1;});
