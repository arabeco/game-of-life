import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({entryPoints:['supabase/functions/_shared/widgetArenaAccess.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {checkWidgetArenaAccess}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const base={id:'target',name:'Destino',is_archived:false,origin_codex_id:'installed'};
function database({archived=false,status='active',lock=true,prereqs=['before'],done=0,fail=false,noCampaign=false}={}){
 const queries=[];
 return {queries,from(table){let single=false,filters=[];const q={
   select(){return q;},eq(k,v){filters.push([k,v]);return q;},filter(){return q;},in(){return q;},order(){return q;},range(){return q;},gte(){return q;},lte(){return q;},is(){return q;},limit(){return q;},maybeSingle(){single=true;return q;},
   then(resolve){queries.push({table,filters});let data;
    if(table==='arenas')data=single?{...base,is_archived:archived}:[base,{id:'before',name:'Anterior',origin_codex_id:'installed'}];
    if(table==='campaigns')data=noCampaign?[]:[{status,arena_ids:['before','target'],arena_config:{target:{isLocked:lock,prerequisiteArenaIds:prereqs}}}];
    if(table==='actions')data=[{id:'a',arena_id:'before',action_type:'Ação Recorrente',repetitions:2}];
    if(table==='scheduled_tasks')data=Array.from({length:done},(_,i)=>({id:String(i),action_id:'a',completed:true}));
    if(table==='cycles')data=null;
    resolve({data,error:fail?{message:'offline'}:null});
   },
 };return q;}};
}
for(const opts of [{archived:true},{status:'completed'},{status:'archived'},{prereqs:[]},{done:1}]) assert.ok(await checkWidgetArenaAccess(database(opts),'owner','target'));
for(const opts of [{noCampaign:true},{done:2},{done:3},{prereqs:[],lock:false}]){
 const db=database(opts);assert.equal(await checkWidgetArenaAccess(db,'owner','target'),null);
 assert.ok(db.queries.every(q=>q.filters.some(([key,value])=>key==='user_id'&&value==='owner')),'queries are owner-scoped');
}
await assert.rejects(()=>checkWidgetArenaAccess(database({fail:true}),'owner','target'));
console.log('PASS: archived/inactive/locked/unfinished blocked, prerequisites unlock, personal arenas work, owner scoping, failure closed.');
