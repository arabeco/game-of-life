// Explicitly authorized disposable-account smoke test. Never uses an existing user's ID.
const assert=require('node:assert/strict');
const fs=require('node:fs');const {execSync}=require('node:child_process');const crypto=require('node:crypto');
const {createClient}=require('@supabase/supabase-js');
const {chromium}=require('C:/Users/Afonso/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const ref='klmsdcncmhtgnlcejzdi';
(async()=>{
 const keys=JSON.parse(execSync(`npx supabase projects api-keys --project-ref ${ref} -o json`,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}));
 const service=keys.find(k=>k.name==='service_role').api_key,anon=keys.find(k=>k.name==='anon').api_key;
 const url=`https://${ref}.supabase.co`;
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const run=crypto.randomUUID(),email=`deletion-audit-${run}@gol.local`,password=crypto.randomBytes(24).toString('base64url')+'aA1!';
 const report={run,checks:[],emailDelivery:'synthetic @gol.local is rejected by resend before provider delivery'};
 let uid,session,browser;
 const check=(r,stage)=>{if(r.error)throw Error(`${stage}: ${r.error.code||r.error.status||'failed'} ${r.error.message||''}`);return r.data;};
 const file=()=>`avatars/${uid}/deletion-proof.png`;
 const save=()=>fs.writeFileSync('output/functions-audit-2026-10-15/disposable-live-test.json',JSON.stringify(report,null,2));
 try {
  uid=check(await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{audit_run:run}}),'create disposable user').user.id;
  report.userId=uid;save();
  check(await db.from('user_profiles').upsert({id:uid,nickname:'qa'+run.replaceAll('-','').slice(0,16)}),'create disposable profile');
  session=check(await auth.auth.signInWithPassword({email,password}),'sign in disposable user').session;
  const before=crypto.randomUUID(),target=crypto.randomUUID(),a=crypto.randomUUID(),b=crypto.randomUUID();
  check(await db.from('arenas').insert([{id:before,user_id:uid,asset_id:'trabalho',name:'QA prerequisite',is_archived:false},{id:target,user_id:uid,asset_id:'trabalho',name:'QA target',is_archived:true}]),'fixture arenas');
  check(await db.from('actions').insert([{id:a,user_id:uid,arena_id:before,name:'QA prerequisite action',action_type:'Ação Recorrente',duration:15,repetitions:1},{id:b,user_id:uid,arena_id:target,name:'QA target action',action_type:'Ação Recorrente',duration:15,repetitions:1}]),'fixture actions');
  const date=new Date().toISOString().slice(0,10);
  async function widget(){const r=await fetch(url+'/functions/v1/widget-action',{method:'POST',headers:{apikey:anon,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({actionId:b,date,completionMinute:600})});return {status:r.status,body:await r.json()};}
  assert.equal((await widget()).status,409);report.checks.push('archived arena rejected');
  check(await db.from('arenas').update({is_archived:false}).eq('id',target).eq('user_id',uid),'unarchive fixture');
  const campaign=check(await db.from('campaigns').insert({user_id:uid,title:'Disposable QA',arena_ids:[before,target],arena_config:{[target]:{isLocked:true,prerequisiteArenaIds:[before]}},status:'active'}).select('id').single(),'fixture campaign');
  assert.equal((await widget()).status,409);report.checks.push('unfinished prerequisite rejected');
  const empty=check(await db.from('scheduled_tasks').select('id').eq('user_id',uid).eq('action_id',b),'blocked tasks');assert.equal(empty.length,0);
  check(await db.from('scheduled_tasks').insert({id:crypto.randomUUID(),user_id:uid,action_id:a,date,start_time:500,duration:15,completed:true}),'complete prerequisite fixture');
  const unlocked=await widget();assert.equal(unlocked.status,200,JSON.stringify(unlocked.body));assert.equal(unlocked.body.success,true);report.checks.push('completed prerequisite unlocks widget');
  check(await db.from('campaigns').update({status:'archived'}).eq('id',campaign.id).eq('user_id',uid),'archive fixture campaign');
  assert.equal((await widget()).status,409);report.checks.push('archived campaign rejected');
  check(await db.storage.from('user-images').upload(file(),Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64'),{contentType:'image/png'}),'upload disposable file');
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto('https://glyph.life/exclusao.html',{waitUntil:'networkidle'});
  await page.locator('#del-email').fill(email);await page.locator('#del-password').fill(password);
  await page.getByRole('button',{name:'Entrar com senha'}).click();
  await page.locator('#deletion-form').waitFor({state:'visible',timeout:20000});
  await page.locator('#del-confirm').check();
  const response=page.waitForResponse(r=>r.url().endsWith('/functions/v1/account-delete')&&r.request().method()==='POST',{timeout:60000});
  await page.getByRole('button',{name:'Excluir minha conta',exact:true}).click();
  const deleted=await (await response).json();
  report.deletionResponse=deleted;save();assert.equal(deleted.success,true,deleted.error);
  await page.waitForFunction(()=>document.getElementById('deletion-message').textContent.includes('Sua conta foi excluída'));
  report.checks.push('published website authenticates and confirms real deletion');
  for(const table of ['user_profiles','arenas','actions','scheduled_tasks','campaigns']){
   const rows=check(await db.from(table).select('id').eq(table==='user_profiles'?'id':'user_id',uid),`verify ${table}`);
   assert.equal(rows.length,0,table+' still contains disposable rows');report.checks.push(table+' absent');
  }
  const user=await db.auth.admin.getUserById(uid);assert.ok(!user.data?.user);assert.ok(user.error?.status===404||user.error?.code==='user_not_found');report.checks.push('Auth user absent');
  const objects=check(await db.storage.from('user-images').list(`avatars/${uid}`),'verify file');assert.equal(objects.length,0);report.checks.push('Storage file absent');
  const request=check(await db.from('account_deletion_requests').select('id,status,metadata').eq('id',deleted.requestId).single(),'verify protocol');
  assert.equal(request.status,'completed');assert.equal(request.metadata.auth_deleted,true);report.checks.push('protocol completed and Auth verification persisted');
  report.success=true;save();console.log(JSON.stringify(report,null,2));
 } catch(error) {report.success=false;report.error=String(error.message);save();console.error(report.error);process.exitCode=1;}
 finally {
  if(browser)await browser.close();
  if(uid){
   // Cleanup is restricted to the UUID returned by createUser in this execution.
   const user=await db.auth.admin.getUserById(uid);
   if(user.data?.user){
    assert.equal(user.data.user.user_metadata.audit_run,run,'refuse cleanup of unrelated user');
    await db.storage.from('user-images').remove([file()]);
    const cleanup=await db.rpc('delete_account_data_for_user',{p_user_id:uid});
    if(!cleanup.error&&cleanup.data?.success)await db.auth.admin.deleteUser(uid);
    else console.error('Disposable cleanup needs attention; exact UUID recorded in report.');
   }
  }
 }
})().catch(()=>{console.error('Live test setup failed; credentials suppressed.');process.exitCode=1;});
