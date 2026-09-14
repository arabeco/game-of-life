import assert from 'node:assert/strict';
import {loadCatalogRows,createCoalescedFetch} from '../utils/networkEfficiency.js';
const data=new Map();const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};let calls=0;const fetchRows=async()=>{calls++;return [{id:calls}]};
assert.deepEqual(await loadCatalogRows({storage,key:'alice',fetchRows,now:10}),[{id:1}]);
assert.deepEqual(await loadCatalogRows({storage,key:'alice',fetchRows,now:11}),[{id:1}]);assert.equal(calls,1);
await loadCatalogRows({storage,key:'bob',fetchRows,now:11});assert.equal(calls,2);
await loadCatalogRows({storage,key:'alice',fetchRows,now:12,force:true});assert.equal(calls,3);
await loadCatalogRows({storage,key:'alice',fetchRows,now:86400012});assert.equal(calls,4);
data.set('alice','bad json');await loadCatalogRows({storage,key:'alice',fetchRows,now:14});assert.equal(calls,5);
await assert.rejects(loadCatalogRows({storage,key:'alice',force:true,fetchRows:async()=>{throw Error('offline')}}));assert.equal(JSON.parse(data.get('alice')).rows[0].id,5);
let requests=[];const network=createCoalescedFetch((input,init)=>new Promise(resolve=>requests.push({input,init,resolve})),'https://qa.supabase.co');const url='https://qa.supabase.co/rest/v1/actions?select=*';
const a=network(url),b=network(url);assert.equal(requests.length,1);requests[0].resolve(new Response('[]'));assert.deepEqual(await (await a).json(),[]);assert.deepEqual(await (await b).json(),[]);
const c=network(url,{headers:{Authorization:'Bearer alice'}}),d=network(url,{headers:{Authorization:'Bearer bob'}});assert.equal(requests.length,3);requests[1].resolve(new Response('[]'));requests[2].resolve(new Response('[]'));await Promise.all([c,d]);
const old=network(url);const write=network(url,{method:'PATCH',body:'{}'});const fresh=network(url);assert.equal(requests.length,6);for(let i=3;i<6;i++)requests[i].resolve(new Response('[]'));await Promise.all([old,write,fresh]);
const abort=new AbortController();const e=network(url,{signal:abort.signal}),f=network(url,{signal:abort.signal});assert.equal(requests.length,8);requests[6].resolve(new Response('[]'));requests[7].resolve(new Response('[]'));await Promise.all([e,f]);
console.log('PASS: catalog TTL, forced refresh, account isolation, corrupted storage, failure, coalescing, independent bodies, auth boundaries, writes, cancellation');

let retries=0;const retry=createCoalescedFetch(async()=>{retries++;if(retries===1)throw Error('network');return new Response('fresh')},'https://qa.supabase.co');
await assert.rejects(retry(url));assert.equal(await (await retry(url)).text(),'fresh');assert.equal(retries,2);
let freshCalls=0;const noStale=createCoalescedFetch(async()=>new Response(String(++freshCalls)),'https://qa.supabase.co');assert.equal(await (await noStale(url)).text(),'1');assert.equal(await (await noStale(url)).text(),'2');
console.log('PASS: rejected reads are retryable; sequential mutable reads always go to server');

assert.deepEqual(await loadCatalogRows({storage:{getItem(){throw Error('disabled')},setItem(){throw Error('quota')}},key:'disabled',fetchRows:async()=>[{id:'live'}]}),[{id:'live'}]);
console.log('PASS: disabled browser storage and exhausted quota do not prevent live reads');

const pendingWrites=[];const during=createCoalescedFetch(()=>new Promise(resolve=>pendingWrites.push(resolve)),'https://qa.supabase.co');
const mutation=during(url,{method:'PATCH',body:'{}'});const readingDuring=during(url);pendingWrites[0](new Response('{}'));await mutation;const readingAfter=during(url);assert.equal(pendingWrites.length,3);pendingWrites[1](new Response('old'));pendingWrites[2](new Response('new'));assert.equal(await (await readingAfter).text(),'new');await readingDuring;
console.log('PASS: read after a completed write cannot join a read started during that write');
