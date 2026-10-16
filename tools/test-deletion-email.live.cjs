// Authorized alias only; existing accounts are never reused or deleted.
const {execSync}=require('node:child_process');
const crypto=require('node:crypto');const fs=require('node:fs');const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
(async()=>{
 const ref='klmsdcncmhtgnlcejzdi',url=`https://${ref}.supabase.co`;
 const keys=JSON.parse(execSync(`npx supabase projects api-keys --project-ref ${ref} -o json`,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}));
 const service=keys.find(k=>k.name==='service_role').api_key,anon=keys.find(k=>k.name==='anon').api_key;
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const run=crypto.randomUUID(),email='misterxhermit+glyph-teste@gmail.com',password=crypto.randomBytes(28).toString('base64url')+'aA1!';
 const report={run,email,checks:[],scope:'Real account-delete backend and internal Resend call; no UI or inbox proof'};
 const ok=(r,stage)=>{if(r.error)throw Error(stage+': '+(r.error.code||r.error.status||'failed'));return r.data;};
 let uid;
 const save=()=>{fs.mkdirSync('output/deletion-email',{recursive:true});fs.writeFileSync('output/deletion-email/live-report.json',JSON.stringify(report,null,2));};
 try{
  uid=ok(await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{audit_run:run}}),'create new disposable account').user.id;
  report.userId=uid;save();
  const identity=ok(await db.auth.admin.getUserById(uid),'verify disposable identity').user;
  assert.equal(identity.user_metadata.audit_run,run);assert.equal(identity.email,email);
  ok(await db.from('user_profiles').upsert({id:uid,nickname:'qa'+run.replaceAll('-','').slice(0,16)}),'create profile');
  const session=ok(await auth.auth.signInWithPassword({email,password}),'sign in disposable account').session;
  assert.equal(session.user.id,uid);
  const response=await fetch(url+'/functions/v1/account-delete',{method:'POST',headers:{apikey:anon,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({source:'app',blockReentry:false,reason:'Authorized disposable email delivery verification'})});
  const result=await response.json();
  report.http=response.status;report.requestId=result.requestId;report.deletionEmailStatus=result.deletionEmailStatus;report.cleanupPending=result.cleanupPending;
  assert.equal(result.success,true,'account-delete did not confirm success');
  const absent=await db.auth.admin.getUserById(uid);
  assert.ok(!absent.data?.user && (absent.error?.status===404 || absent.error?.code==='user_not_found'));
  report.checks.push('Disposable Auth account removed');
  assert.equal(ok(await db.from('user_profiles').select('id').eq('id',uid),'verify profile removal').length,0);
  report.checks.push('Disposable profile removed');
  const protocol=ok(await db.from('account_deletion_requests').select('status,metadata').eq('id',result.requestId).single(),'protocol');
  report.protocolStatus=protocol.status;report.emailStatusPersisted=protocol.metadata?.deletion_email_status;
  const dispatch=await db.from('notification_email_dispatches').select('status,provider_email_id').eq('dispatch_key',`v2:account-deleted:${result.requestId}`).maybeSingle();
  report.dispatchLookup=dispatch.error?'dispatch read unavailable':dispatch.data;
  report.success=true;
 }catch(e){report.success=false;report.error=e.message;process.exitCode=1;}
 finally{
  if(uid){const current=await db.auth.admin.getUserById(uid);if(current.data?.user){assert.equal(current.data.user.user_metadata.audit_run,run);report.cleanup='Disposable account remains; no unrelated account touched';}}
  save();console.log(JSON.stringify(report,null,2));
 }
})().catch(()=>{console.error('Setup failed; credentials suppressed.');process.exitCode=1;});

