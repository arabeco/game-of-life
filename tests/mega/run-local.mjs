import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'docs/reports/mega-smoke');
fs.mkdirSync(path.join(out,'logs'),{recursive:true});
const priority=/premium|subscription|reward|mission|relationship|chest|item|catalog|exp-ledger|pact/;
const files=fs.readdirSync(path.join(root,'tests')).filter(f=>f.endsWith('.regression.mjs')).sort((a,b)=>Number(priority.test(b))-Number(priority.test(a))||a.localeCompare(b));
const selected=files.filter(f=>!process.env.MEGA_FILTER||f.includes(process.env.MEGA_FILTER));
const results=[];
function run(file){return new Promise(resolve=>{
 const started=Date.now();let output='',timedOut=false;
 const child=spawn(process.execPath,[path.join(root,'tests',file)],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
 const timer=setTimeout(()=>{timedOut=true;child.kill();},90000);
 for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{output+=chunk.toString();});
 child.on('error',e=>{output+=e.message;});
 child.on('close',code=>{clearTimeout(timer);fs.writeFileSync(path.join(out,'logs',file+'.txt'),output);const result={file,status:timedOut?'TIMEOUT':code===0?'PASS':'FAIL',durationMs:Date.now()-started,evidence:'local: lógica e/ou contrato de código; não prova backend',log:'logs/'+file+'.txt'};results.push(result);console.log(result.status,file);resolve();});
});}
// Run serially: some existing checks share generated cache files.
for(const file of selected)await run(file);
const summary={generatedAt:new Date().toISOString(),scope:'Regressões locais existentes; sem contas remotas, pagamentos ou escrita no Supabase',total:results.length,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status!=='PASS').length,results};
fs.writeFileSync(path.join(out,'local-results.json'),JSON.stringify(summary,null,2));
const md=['# Ronda local do GLYPH',`Execução: ${summary.generatedAt}`,`${summary.passed}/${summary.total} suítes passaram; ${summary.failed} falharam.`,summary.scope,'Um PASS aqui não significa compra validada, item entregue ou transação remota comprovada.','','| Suíte | Resultado | Evidência |','|---|---|---|',...results.map(r=>`| ${r.file} | ${r.status} | [log](${r.log}) |`)];
fs.writeFileSync(path.join(out,'README.md'),md.join('\n')+'\n');
console.log(JSON.stringify({total:summary.total,passed:summary.passed,failed:summary.failed,report:path.join(out,'README.md')}));
process.exitCode=summary.failed?1:0;
