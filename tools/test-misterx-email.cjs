// Single recipient explicitly authorized by the user. Fixed dispatch key prevents duplicates.
const {execSync}=require('child_process');
(async()=>{
 const ref='klmsdcncmhtgnlcejzdi';
 const keys=JSON.parse(execSync(`npx supabase projects api-keys --project-ref ${ref} -o json`,{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']}));
 const key=keys.find(k=>k.name==='service_role')?.api_key;
 if(!key)throw Error('No service key');
 const response=await fetch(`https://${ref}.supabase.co/functions/v1/resend`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({type:'delivery_test',metadata:{sendEmail:true,email:'misterxhermit@gmail.com',dispatchKey:'delivery-test:20261016-misterx-01'}})});
 const result=await response.json();
 console.log(JSON.stringify({http:response.status,accepted:result.accepted,id:result.id,error:result.error,alreadyAccepted:result.alreadyAccepted}));
})().catch(()=>{console.error('Email test failed; sensitive response suppressed.');process.exitCode=1;});
