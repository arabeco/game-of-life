import type { Action, Arena, Campaign, Cycle, ScheduledTask } from '../types';
import { getCampaignArenaStates } from './progressUtilsEngine.js';

export function unavailableCampaignArenas(campaigns: Campaign[], arenas: Arena[], actions: Action[], tasks: ScheduledTask[], cycle?: Cycle | null) {
  const blocked = new Set(arenas.filter(a => a.isArchived).map(a => a.id));
  const arenasById = Object.fromEntries(arenas.map(a => [a.id, a]));
  const actionsByArena = Object.fromEntries(arenas.map(a => [a.id, actions.filter(action => action.arenaId === a.id)]));
  for (const campaign of campaigns) {
    if (campaign.status !== 'active') { campaign.arenaIds.forEach(id => blocked.add(id)); continue; }
    const lifetime = campaign.arenaIds.some(id => arenasById[id]?.originCodexId);
    const scoped = lifetime || !cycle ? tasks : tasks.filter(t => t.date >= cycle.startDate && t.date <= cycle.endDate);
    const states = getCampaignArenaStates({ campaign, arenasById, actionsByArena, tasks: scoped });
    for (const [id, state] of Object.entries(states)) if (state.isLocked) blocked.add(id);
  }
  return blocked;
}
