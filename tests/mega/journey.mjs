import {createPlayer,cleanup,launch,playerPage,step,results,writeReport,output,unlock} from './journey-support.mjs';
const url=process.env.SMOKE_URL||'http://127.0.0.1:4180/';
if(!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Use a versão local do app para esta jornada');
if(!process.argv.includes('--live'))throw Error('Esta jornada cria duas contas QA reais. Execute com --live.');
let browser;let a,b;
async function navigate(p,selector){
 await unlock(p);
 for(let attempt=0;attempt<3;attempt++){
  try{await p.locator(selector).click({timeout:5000});return;}
  catch(error){
   // A delayed visibility event can reopen RestScreen after the first unlock.
   // Retry only navigation, never a purchase or another transactional action.
   if(attempt===2||!await p.locator('.restscreen-unlock-trigger').isVisible())throw error;
   await unlock(p);
  }
 }
}
async function mundo(p){await p.waitForTimeout(2000);await navigate(p,'#nav-mundo');await p.locator('#social-container').waitFor();}
async function poll(fn){for(let i=0;i<20;i++){const value=await fn();if(value)return value;await new Promise(r=>setTimeout(r,700));}throw Error('Resultado não persistiu no backend');}
async function dependent(id,deps,page,fn){
 const missing=deps.filter(d=>!results.some(r=>r.id===d&&r.status==='PASS'));
 if(missing.length){results.push({id,status:'BLOCKED',evidence:'Depende de '+missing.join(', ')});writeReport();return false;}
 return step(id,page,fn);
}
try{
 a=await createPlayer('A');b=await createPlayer('B');browser=await launch();
 const pa=await playerPage(browser,a,url),pb=await playerPage(browser,b,url);
 const sent=await step('01-enviar-amizade',pa,async()=>{await mundo(pa);await pa.getByPlaceholder('Buscar Soberano ou Grupo...').fill(b.nickname);await pa.getByRole('button',{name:'Adicionar',exact:true}).click();await poll(async()=>{const r=await a.client.from('friend_requests').select('id').eq('sender_id',a.userId).eq('recipient_id',b.userId);if(r.error)throw r.error;return r.data?.length;});return {evidence:'UI + convite persistido no banco'};});
 if(sent)await step('02-aceitar-amizade',pb,async()=>{await pb.reload();await pb.locator('#nav-mundo').waitFor();await mundo(pb);await pb.getByRole('button',{name:/Solicitações/}).click();await pb.getByRole('button',{name:'Aceitar pedido de amizade',exact:true}).click();await poll(async()=>{const r=await b.client.from('friends').select('friend_id').eq('user_id',b.userId).eq('friend_id',a.userId);return r.data?.length;});});

 async function rows(table,field='user_id'){const r=await a.client.from(table).select('*').eq(field,a.userId);if(r.error)throw r.error;return r.data;}
 async function wallet(){return (await rows('user_profiles','id'))[0].wallet;}
 async function shop(){await mundo(pa);await pa.locator('#nav-loja').click();await pa.getByRole('button',{name:'Itens',exact:true}).click();await pa.getByTitle('Baú Comum',{exact:true}).waitFor();}
 await dependent('03-criar-vinculo',['02-aceitar-amizade'],pa,async()=>{
  await pa.reload();await pa.locator('#nav-mundo').waitFor();await mundo(pa);await pa.locator('#links-button').click();await pa.locator('#connections-tab-parceria').click();await pa.locator('#connections-invite-open').click();await pa.locator('#connections-invite-friend-'+b.userId).click();
  await poll(async()=>{const r=await a.client.from('relationship_link_invites').select('id').eq('sender_id',a.userId).eq('recipient_id',b.userId);return r.data?.length;});return {evidence:'UI + convite persistido no Supabase'};
 });
 await dependent('04-aceitar-vinculo',['03-criar-vinculo'],pb,async()=>{
  await pb.reload();await pb.locator('#nav-mundo').waitFor();await mundo(pb);await pb.locator('#links-button').click();await pb.locator('#connections-tab-parceria').click();await pb.getByRole('button',{name:'Aceitar convite',exact:true}).click();await pb.locator('#connections-active-list').waitFor();return {evidence:'UI: vínculo ativo após aceite; banco validado pela carga da tela'};
 });
 let boughtItem;let boughtName;
 await step('05-comprar-item',pa,async()=>{
  await pa.reload();await pa.locator('#nav-mundo').waitFor();await shop();const before=await wallet();const buy=pa.locator('button[data-item-id]').first();boughtItem=await buy.getAttribute('data-item-id');boughtName=(await buy.getAttribute('aria-label')).replace(/^Comprar /,'');const price=Number(await buy.getAttribute('data-price'));await buy.click();await pa.getByRole('button',{name:/^COMPRAR ·/i}).click();
  await poll(async()=> (await rows('user_inventory')).some(i=>i.item_id===boughtItem));const after=await wallet();if(before.gold-after.gold!==price)throw Error('Débito de ouro divergente');return {evidence:'UI + item no inventário + débito exato no banco',item:boughtItem,price};
 });
 await dependent('05b-equipar-item',['05-comprar-item'],pa,async()=>{
  await mundo(pa);await pa.locator('#nav-arsenal').click();await pa.getByText(boughtName,{exact:true}).first().click();await pa.getByRole('button',{name:'Equipar',exact:true}).click();
  await poll(async()=>(async()=>{const p=(await rows('user_profiles','id'))[0];return p.border===boughtItem||p.skin===boughtItem||Object.values(p.sovereign||{}).includes(boughtItem);})());return {evidence:'UI: equipar + item referenciado no perfil persistido',item:boughtItem};
 });
 let beforeChest;
 const chestBought=await step('06-comprar-bau',pa,async()=>{
  await shop();const before=await wallet();beforeChest=await rows('user_chests');await pa.getByTitle('Baú Comum',{exact:true}).dblclick();await poll(async()=> (await wallet()).fragments===before.fragments-24);const after=await rows('user_chests');if(JSON.stringify(after)===JSON.stringify(beforeChest))throw Error('Saldo mudou sem entregar baú');return {evidence:'Duplo clique real + débito único de 24 fragmentos + baú entregue'};
 });
 if(chestBought)await step('07-abrir-bau',pa,async()=>{
  const before=await rows('user_chests');const balance=await wallet();await mundo(pa);await pa.locator('#nav-arsenal').click();await pa.getByRole('button',{name:/^Ba[uú]s$/i}).click();await pa.getByRole('img',{name:/Comum/i}).first().click();await pa.getByRole('button',{name:'ABRIR',exact:true}).click();
  await poll(async()=> JSON.stringify(await rows('user_chests'))!==JSON.stringify(before));await pa.getByRole('button',{name:/Equipar|Continuar|Fechar/i}).first().waitFor({timeout:30000});const reward=pa.megaRpc.filter(r=>r.rpc==='open_chest'||r.rpc==='open_chest_specific').at(-1);if(!reward?.success||!reward.itemId)throw Error('RPC não confirmou recompensa');const inventory=await rows('user_inventory');if(!inventory.some(i=>i.item_id===reward.itemId))throw Error('Recompensa ausente do inventário');if((await wallet()).fragments-balance.fragments!==Number(reward.fragments||0))throw Error('Fragmentos recebidos divergentes');const after=await rows('user_chests');if(before.filter(c=>!c.is_opened).length-after.filter(c=>!c.is_opened).length!==1)throw Error('Consumo de baú não foi unitário');return {evidence:'UI + exatamente um baú consumido + item recebido + fragmentos conferidos',item:reward.itemId,duplicate:reward.duplicate};
 });
 await step('08-comprar-campanha',pa,async()=>{
  await pa.reload();await pa.locator('#nav-mundo').waitFor();await mundo(pa);await pa.locator('#nav-loja').click();await pa.getByRole('button',{name:'Campanhas',exact:true}).click();const buy=pa.locator('button[data-catalog-id]').first();await buy.waitFor();const catalog=await buy.getAttribute('data-catalog-id');await buy.click();await pa.getByRole('button',{name:/^COMPRAR -/i}).click();
  await poll(async()=> (await rows('codex','owner_id')).some(c=>c.catalog_id===catalog));return {evidence:'UI + campanha adquirida no banco',catalog};
 });
 await dependent('09-instalar-campanha',['08-comprar-campanha'],pa,async()=>{
  const install=pa.getByRole('button',{name:'Instalar',exact:true}).first();if(await install.isVisible())await install.click();const arenas=await poll(async()=>{const r=await rows('arenas');return r.length?r:null;});await unlock(pa);await navigate(pa,'#nav-arenas');await pa.getByText(arenas[0].name,{exact:true}).first().waitFor();return {evidence:'Instalação pelo fluxo de compra + arenas persistidas e visíveis',count:arenas.length};
 });
 await dependent('10-persistencia-reentrada',['05-comprar-item'],pa,async()=>{
  await pa.reload();await pa.locator('#nav-assets').waitFor();await unlock(pa);await mundo(pa);await pa.locator('#nav-arsenal').click();await pa.waitForTimeout(1200);if(boughtItem&&!(await rows('user_inventory')).some(i=>i.item_id===boughtItem))throw Error('Item não persistiu');return {evidence:'Reabertura real + inventário persistido no banco'};
 });
 await step('11-premium-gratuito',pa,async()=>{const close=pa.getByRole('button',{name:'Fechar',exact:true});if(await close.isVisible())await close.click();await unlock(pa);await navigate(pa,'#nav-settings');await pa.locator('#settings-tab-premium').click();await pa.getByRole('button',{name:/Ativar 30 dias/i}).first().waitFor();const profile=(await rows('user_profiles','id'))[0];if(profile.is_premium)throw Error('Conta gratuita virou Premium sem compra');return {evidence:'UI oferece ativação + conta continua gratuita no banco'};});

 await step('12-premium-ativo',pb,async()=>{
  const update=await b.client.from('user_profiles').update({is_premium:true,subscription_tier:'premium',premium_expires_at:new Date(Date.now()+86400000*3).toISOString()}).eq('id',b.userId);if(update.error)throw update.error;
  await pb.reload();await pb.locator('#nav-settings').waitFor();await pb.waitForTimeout(2000);await unlock(pb);await navigate(pb,'#nav-settings');await pb.locator('#settings-tab-premium').click();await pb.getByRole('button',{name:/Estender 30 dias/i}).first().waitFor();
  results.push({id:'seguranca-premium-escrita-pelo-cliente',status:'FAIL',evidence:'Sessão comum da própria conta QA conseguiu gravar Premium e a UI reconheceu. Nenhuma service role utilizada.',error:'Servidor aceitou ativação de Premium pelo próprio usuário; revisar proteção dos campos de assinatura.'});
  return {evidence:'Estado Premium preparado só na conta QA + UI reconhece assinatura; não testa pagamento'};
 });
 await dependent('13-premium-expirado',['12-premium-ativo'],pb,async()=>{
  const update=await b.client.from('user_profiles').update({premium_expires_at:new Date(Date.now()-86400000).toISOString()}).eq('id',b.userId);if(update.error)throw update.error;
  await pb.reload();await pb.locator('#nav-settings').waitFor();await pb.waitForTimeout(2000);await unlock(pb);await navigate(pb,'#nav-settings');await pb.locator('#settings-tab-premium').click();await pb.getByRole('button',{name:/Ativar 30 dias/i}).first().waitFor();if(await pb.getByRole('button',{name:/Estender 30 dias/i}).count())throw Error('Assinatura vencida continua ativa na UI');return {evidence:'Expiração preparada na conta QA + UI volta a oferecer ativação'};
 });
 await dependent('14-missao-inicial-sem-duplicar',['09-instalar-campanha'],pa,async()=>{
  await poll(async()=> (await rows('user_profiles','id'))[0].completed_season_missions?.includes('system-first-campaign'));await unlock(pa);await pa.waitForTimeout(1500);const before=(await rows('user_profiles','id'))[0];
  await pa.reload();await pa.locator('#nav-assets').waitFor();await pa.waitForTimeout(2500);await unlock(pa);const after=(await rows('user_profiles','id'))[0];
  if(after.completed_season_missions.filter(id=>id==='system-first-campaign').length!==1)throw Error('Conclusão duplicada');if(after.nobility.exp!==before.nobility.exp)throw Error('EXP mudou ao reabrir, sem nova execução');return {evidence:'Missão inicial concluída automaticamente por instalar + flag única + EXP estável na reentrada',exp:after.nobility.exp};
 });

 await step('15-compra-sem-rede',pa,async()=>{
  await pa.reload();await pa.locator('#nav-mundo').waitFor();await shop();const target=pa.locator('button[data-item-id]').first();const item=await target.getAttribute('data-item-id');const before=await wallet();const inventoryBefore=await rows('user_inventory');let blocked=0;
  const pattern='**/rest/v1/**';const block=async route=>{if(['POST','PATCH','PUT','DELETE'].includes(route.request().method())){blocked++;await route.abort('internetdisconnected');}else await route.continue();};
  await pa.route(pattern,block);
  try{
   await target.click();await pa.getByRole('button',{name:/^COMPRAR ·/i}).click();await pa.waitForTimeout(2000);
   if(blocked===0)throw Error('Não houve tentativa de escrita para testar');
   const after=await wallet();const inventoryAfter=await rows('user_inventory');if(after.gold!==before.gold||inventoryAfter.length!==inventoryBefore.length)throw Error('Compra sem rede alterou saldo ou inventário no banco');
  }finally{await pa.unroute(pattern,block);}
  await pa.reload();await pa.locator('#nav-mundo').waitFor();await shop();await pa.locator('button[data-item-id="'+item+'"]').waitFor();return {evidence:'Escritas bloqueadas só no navegador QA; banco inalterado e item continua disponível após reentrada',blockedRequests:blocked};
 });
 for(const id of ['google-play-pagamento-real','missao-individual-prazo-resgate','vinculo-permissoes-concorrentes','todos-itens-equipar'])results.push({id,status:'PENDING',evidence:'Ainda sem cenário integrado implementado; não conta como PASS'});
} catch(e){results.push({id:'setup',status:'FAIL',error:e.message});console.error(e.message);if(browser){for(const [i,p] of browser.contexts().flatMap(c=>c.pages()).entries())await p.screenshot({path:output+'/setup-'+i+'.png'}).catch(()=>{});}}
finally {
 try {
  if(browser){for(const context of browser.contexts())await context.close();await browser.close();}
 } catch(error){results.push({id:'browser-close',status:'FAIL',error:error.message});}
 finally {await cleanup();writeReport();}
 console.log('RELATORIO',output);
 process.exitCode=results.some(r=>r.status==='FAIL')?1:results.some(r=>['PENDING','BLOCKED','SKIPPED'].includes(r.status))?2:0;
}
