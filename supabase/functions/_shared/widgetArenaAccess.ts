import { getCampaignArenaStates } from './campaignProgress.js';

export async function checkWidgetArenaAccess(db: any, userId: string, arenaId: string) {
  const arenaResult = await db.from('arenas').select('id,name,is_archived,origin_codex_id').eq('id', arenaId).eq('user_id', userId).maybeSingle();
  if (arenaResult.error) throw new Error('Não foi possível conferir a arena.');
  if (!arenaResult.data || arenaResult.data.is_archived) return 'Esta arena está arquivada ou indisponível.';
  const campaigns = await db.from('campaigns').select('id,status,arena_ids,arena_config').eq('user_id', userId).filter('arena_ids', 'cs', JSON.stringify([arenaId]));
  if (campaigns.error) throw new Error('Não foi possível conferir a campanha.');
  for (const campaign of campaigns.data || []) {
    if (campaign.status !== 'active') return 'Esta campanha não está em andamento.';
    const config = campaign.arena_config?.[arenaId] || {};
    const prerequisites = config.prerequisiteArenaIds || [];
    if (!prerequisites.length) {
      if (config.isLocked) return 'Esta arena ainda está bloqueada na campanha.';
      continue;
    }
    const arenas = await db.from('arenas').select('id,name,origin_codex_id').eq('user_id', userId).in('id', campaign.arena_ids);
    if (arenas.error) throw new Error('Não foi possível conferir as fases da campanha.');
    const actions: {data:any[]} = {data:[]};
    for (let page=0; ; page+=500) {
      const result = await db.from('actions').select('id,arena_id,action_type,repetitions').eq('user_id', userId).in('arena_id', campaign.arena_ids).order('id').range(page,page+499);
      if (result.error) throw new Error('Não foi possível conferir as ações da campanha.');
      actions.data.push(...result.data);
      if(result.data.length<500) break;
    }
    const lifetime = arenas.data.some((a: any) => a.origin_codex_id);
    let cycle: any = null;
    if (!lifetime) {
      const result = await db.from('cycles').select('start_date,end_date').eq('user_id',userId).is('report_data',null).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if (result.error) throw new Error('Não foi possível conferir o ciclo.');
      cycle = result.data;
    }
    const tasks: any[] = [];
    const ids = actions.data.map((a: any) => a.id);
    for (let offset = 0; offset < ids.length; offset += 100) {
      for (let page = 0; ; page += 500) {
        let query = db.from('scheduled_tasks').select('id,action_id,completed').eq('user_id',userId).eq('completed',true).in('action_id',ids.slice(offset,offset+100)).order('id').range(page,page+499);
        if (cycle?.start_date) query = query.gte('date',cycle.start_date);
        if (cycle?.end_date) query = query.lte('date',cycle.end_date);
        const result = await query;
        if (result.error) throw new Error('Não foi possível conferir o progresso.');
        tasks.push(...result.data.map((t: any) => ({...t,actionId:t.action_id})));
        if (result.data.length < 500) break;
      }
    }
    const states = getCampaignArenaStates({
      campaign: {arenaIds:campaign.arena_ids,arenaConfig:campaign.arena_config},
      arenasById:Object.fromEntries(arenas.data.map((a: any)=>[a.id,a])),
      actionsByArena:Object.fromEntries(arenas.data.map((a: any)=>[a.id,actions.data.filter((x: any)=>x.arena_id===a.id).map((x: any)=>({...x,actionType:x.action_type}))])),
      tasks,
    });
    if (!states[arenaId] || states[arenaId].isLocked) return 'Conclua as fases anteriores para liberar esta arena.';
  }
  return null;
}
