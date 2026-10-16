import assert from 'node:assert/strict';
import { build } from 'esbuild';
const built = await build({entryPoints:['supabase/functions/_shared/accountDeletion.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {processAccountDeletion} = await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
function fixture(options={}) {
  let profile=true, user=true;
  const events=[];
  const row={id:12,user_id:'verified-user',metadata:{identity_verified:true,user_email:'test@example.invalid'}};
  const db={
    from(table) { return {
      update(value) { return {async eq() { events.push('persist'); Object.assign(row,structuredClone(value)); return {error:null}; }}; },
      select() {return {eq() {return {async maybeSingle() { return {data:profile?{id:'verified-user'}:null,error:null}; }}; }};},
    }; },
    async rpc(name) {
      events.push(name);
      if(name==='list_account_storage_objects') return options.listFail?{error:{message:'offline'}}:{data:[{bucket_id:'images',object_name:'owned/image.png'}]};
      if(name==='delete_account_data_for_user') {
        if(options.dataFail)return {data:{success:false,error:'constraint'}};
        if(!options.profileRemains)profile=false;
        return {data:{success:true}};
      }
      return {data:{success:true}};
    },
    storage:{from(){return {async remove(){events.push('remove');return {error:options.storageFail?{message:'offline'}:null};}};}},
    auth:{admin:{async deleteUser(){events.push('deleteUser'); if(options.authFail)return {error:{message:'unavailable'}};user=false;return {};},async getUserById(){return user?{data:{user:{id:'verified-user'}}}:{data:{user:null},error:{status:404}};}}},
    functions:{async invoke(){if(options.emailFail)throw Error('email');return {data:{accepted:true}};}},
  };
  return {db,row,events,get profile(){return profile;},get user(){return user;}};
}
let f=fixture(); let result=await processAccountDeletion(f.db,f.row);
assert.equal(result.success,true);assert.equal(f.profile,false);assert.equal(f.user,false);
assert.equal(f.row.status,'completed');assert.equal(f.row.metadata.user_email,undefined);
assert.ok(f.events.indexOf('persist')<f.events.indexOf('remove'),'manifest persisted before deleting files');
f=fixture({storageFail:true});result=await processAccountDeletion(f.db,f.row);
assert.equal(result.cleanupPending,true);assert.equal(f.row.status,'cleanup_pending');assert.equal(f.row.metadata.storage_pending_files.length,1);
const retry=fixture();retry.row.metadata=f.row.metadata;
result=await processAccountDeletion(retry.db,retry.row);
assert.equal(result.success,true);assert.equal(retry.row.status,'completed');assert.ok(!retry.events.includes('deleteUser'),'cleanup does not re-delete Auth');
for(const options of [{dataFail:true},{profileRemains:true},{authFail:true}]) {
  f=fixture(options);result=await processAccountDeletion(f.db,f.row);
  assert.equal(result.success,false);assert.equal(f.row.status,'failed');assert.equal(f.row.completed_at,null);
  if(!options.authFail)assert.ok(!f.events.includes('deleteUser'),'do not delete login before verified profile removal');
}
f=fixture({listFail:true});result=await processAccountDeletion(f.db,f.row);assert.equal(result.cleanupPending,true);
f=fixture({emailFail:true});result=await processAccountDeletion(f.db,f.row);assert.equal(result.success,true);assert.equal(f.row.metadata.deletion_email_status,'failed');
console.log('PASS: profile/Auth verification, durable manifest, failed stages, retry cleanup, email isolation. Mock backend only.');
