// Only the account created by this execution is modified. No payment, mail or push.
const assert=require('node:assert/strict');const crypto=require('node:crypto');const fs=require('node:fs');const {execSync}=require('node:child_process');const {createClient}=require('@supabase/supabase-js');
(async()=>{
 const ref='klmsdcncmhtgnlcejzdi',url=`https://${ref}.supabase.co`;
 const keys=JSON.parse(execSync(`npx supabase projects api-keys --project-ref ${ref} -o json`,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}));
 const db=createClient(url,keys.find(k=>k.name==='service_role').api_key,{auth:{persistSession:false,autoRefreshToken:false}});
 const user=createClient(url,keys.find(k=>k.name==='anon').api_key,{auth:{persistSession:false,autoRefreshToken:false}});
 const run=crypto.randomUUID(),password=crypto.randomBytes(24).toString('base64url')+'aA1!',email=`campaign-audit-${run}@gol.local`;
 const report={run,checks:[],scope:'Authenticated RPC and owned library/arena/task persistence; no real purchase or Android UI'};
 const ok=(r,stage)=>{if(r.error)throw Error(stage+': '+r.error.code+' '+r.error.message);return r.data;};
 let uid;
 try{
  uid=ok(await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{audit_run:run}}),'create').user.id;
  report.userId=uid;ok(await db.from('user_profiles').upsert({id:uid,nickname:'qa'+run.replaceAll('-','').slice(0,16)}),'profile');
  ok(await user.auth.signInWithPassword({email,password}),'login');
  const template={title:'QA Corpo e mente',levels:[{level:1,title:'Leitura',assetId:'trabalho',actions:[{name:'Ler',duration:15,repetitions:1}]},{level:2,title:'Prática',assetId:'saude',actions:[{name:'Praticar',duration:15,repetitions:1}]}]};
  const book=ok(await user.from('codex').insert({owner_id:uid,name:template.title,template,schema_version:'v2',source_type:'created'}).select('id').single(),'library');
  assert.equal(ok(await user.from('arenas').select('id').eq('user_id',uid),'before install').length,0);report.checks.push('owned template does not create arenas');
  async function install(){
   const ids=[crypto.randomUUID(),crypto.randomUUID()],actions=[crypto.randomUUID(),crypto.randomUUID()];
   ok(await user.from('arenas').insert(ids.map((id,i)=>({id,user_id:uid,name:template.levels[i].title,asset_id:template.levels[i].assetId,origin_codex_id:book.id,is_archived:false}))),'install arenas');
   ok(await user.from('actions').insert(actions.map((id,i)=>({id,user_id:uid,arena_id:ids[i],name:template.levels[i].actions[0].name,action_type:'Ação Recorrente',duration:15,repetitions:1,origin_codex_id:book.id}))),'install actions');
   const campaign=ok(await user.from('campaigns').insert({user_id:uid,title:template.title,arena_ids:ids,source_codex_id:book.id,status:'active',arena_config:{[ids[1]]:{isLocked:true,prerequisiteArenaIds:[ids[0]]}}}).select('id').single(),'install run');return {ids,actions,id:campaign.id};
  }
  const first=await install();
  const denied=await user.rpc('finish_campaign_run',{p_campaign_id:first.id,p_status:'completed',p_template:template});assert.ok(denied.error);report.checks.push('unfinished completion rejected');
  ok(await user.from('scheduled_tasks').insert([{id:crypto.randomUUID(),user_id:uid,action_id:first.actions[0],date:'2026-09-01',start_time:600,duration:15,completed:true},{id:crypto.randomUUID(),user_id:uid,action_id:first.actions[1],date:'2026-10-16',start_time:600,duration:15,completed:true},{id:crypto.randomUUID(),user_id:uid,action_id:first.actions[1],date:'2099-01-01',start_time:600,duration:15,completed:false}]),'tasks across cycles');
  const finished=ok(await user.rpc('finish_campaign_run',{p_campaign_id:first.id,p_status:'completed',p_template:template}),'finish');assert.equal(finished.status,'completed');
  const arenas=ok(await user.from('arenas').select('asset_id,is_archived').in('id',first.ids),'arenas');assert.ok(arenas.every(a=>a.is_archived));assert.deepEqual(arenas.map(a=>a.asset_id).sort(),['saude','trabalho']);
  const tasks=ok(await user.from('scheduled_tasks').select('completed').eq('user_id',uid),'tasks');assert.equal(tasks.length,2);assert.ok(tasks.every(t=>t.completed));report.checks.push('cross-cycle completion archives both areas, preserves completed tasks, removes future pending task');
  ok(await user.rpc('finish_campaign_run',{p_campaign_id:first.id,p_status:'completed',p_template:template}),'repeat finish');
  assert.equal(ok(await user.from('codex').select('id').eq('owner_id',uid),'library preserved').length,1);report.checks.push('finish idempotent and owned template retained');
  const second=await install();assert.notEqual(first.id,second.id);assert.ok(second.ids.every(id=>!first.ids.includes(id)));assert.equal(ok(await user.from('scheduled_tasks').select('id').in('action_id',second.actions),'new tasks').length,0);
  ok(await user.rpc('finish_campaign_run',{p_campaign_id:second.id,p_status:'archived',p_template:template}),'archive');
  const history=ok(await user.from('campaigns').select('status,result_snapshot').eq('user_id',uid),'history');assert.equal(history.length,2);assert.ok(history.some(x=>x.status==='completed'));assert.ok(history.some(x=>x.status==='archived'));report.checks.push('reinstall uses fresh ids and zero progress; archive preserves two history entries');
  report.success=true;
 }catch(e){report.success=false;report.error=e.message;process.exitCode=1;}
 finally{if(uid){const found=await db.auth.admin.getUserById(uid);assert.equal(found.data.user.user_metadata.audit_run,run);const cleanup=await db.rpc('delete_account_data_for_user',{p_user_id:uid});if(!cleanup.error&&cleanup.data?.success){ok(await db.auth.admin.deleteUser(uid),'cleanup Auth');report.cleaned=true;}else{report.cleaned=false;process.exitCode=1;}}fs.mkdirSync('output/campaign-library',{recursive:true});fs.writeFileSync('output/campaign-library/live-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})().catch(()=>{console.error('Setup/cleanup failed; credentials suppressed');process.exitCode=1;});
