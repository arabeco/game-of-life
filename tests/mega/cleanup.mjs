import fs from 'node:fs';
import {createAnonClient} from '../_smoke.supabase.mjs';
import {accounts,privatePath,cleanup,writeReport} from './journey-support.mjs';
if(fs.existsSync(privatePath)){
 for(const record of JSON.parse(fs.readFileSync(privatePath,'utf8'))){
  if(!record.email?.startsWith('codex-mega-'))throw Error('Conta fora da fixture recusada');
  const client=createAnonClient();await client.auth.setSession(record.session);accounts.push({...record,client});
 }
 await cleanup();writeReport();
 if(fs.existsSync(privatePath))process.exitCode=1;
}else console.log('Nenhuma conta QA pendente de limpeza.');
