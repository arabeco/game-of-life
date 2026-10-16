import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({entryPoints:['supabase/functions/_shared/pushRetry.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {withPushRetry}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
let count=0;const waits=[];
const opts={sleep:async ms=>{waits.push(ms);},random:()=>0,now:()=>Date.parse('2026-10-16T00:00:00Z')};
assert.equal(await withPushRetry(async()=>{count++;return 'sent';},opts),'sent');assert.equal(count,1);
count=0;
assert.equal(await withPushRetry(async()=>{if(++count<3)throw {statusCode:503};return 'sent';},opts),'sent');assert.equal(count,3);assert.deepEqual(waits,[1000,2000]);
for(const error of [{statusCode:429},{statusCode:401},{statusCode:404},{statusCode:410},new Error('timeout'),{statusCode:503,retryAfter:'60'},{statusCode:503,retryAfter:'invalid'}]){
 count=0;await assert.rejects(()=>withPushRetry(async()=>{count++;throw error;},opts));assert.equal(count,1);
}
count=0;await assert.rejects(()=>withPushRetry(async()=>{count++;throw {statusCode:500};},opts));assert.equal(count,3);
count=0;waits.length=0;
await withPushRetry(async()=>{if(++count===1)throw {statusCode:503,headers:{'retry-after':'Fri, 16 Oct 2026 00:00:03 GMT'}};return true;},opts);
assert.deepEqual(waits,[3000]);
console.log('PASS: success sent once; transient 500/503 bounded; Retry-After honored; timeout, quota and expired tokens never blindly resent. No live messages.');
