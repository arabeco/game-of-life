import type { Action, Arena, Campaign, ScheduledTask, SeasonQuest } from '../types';

type SharedProgressGetter = (arenaId: string, actionId: string) => number;

interface ArenaProgressOptions {
  arena: Arena;
  actions: Action[];
  tasks: ScheduledTask[];
  clanQuests?: SeasonQuest[];
  getClanQuestProgress?: (questId: string) => number;
  getSharedActionPoolProgress?: SharedProgressGetter;
  forceSharedPool?: boolean;
}

export interface ArenaProgressResult {
  progressPercent: number;
  totalCompleted: number;
  totalPlanned: number;
  hasMeasurableProgress: boolean;
  completedActionIds: string[];
  isClanQuestArena: boolean;
  isSeasonQuestArena: boolean;
  isSharedPool: boolean;
  isCleared: boolean;
}

interface CampaignArenaStatesOptions {
  campaign: Campaign;
  arenasById: Record<string, Arena>;
  actionsByArena: Record<string, Action[]>;
  tasks: ScheduledTask[];
  getClanQuestsForArena?: (arena: Arena, arenaActions: Action[]) => SeasonQuest[];
  getClanQuestProgress?: (questId: string) => number;
  getSharedActionPoolProgress?: SharedProgressGetter;
}

export interface CampaignArenaState extends ArenaProgressResult {
  isLocked: boolean;
  prerequisiteArenaIds: string[];
}

export function calculateArenaProgress(options: ArenaProgressOptions): ArenaProgressResult;
export function getCampaignArenaStates(options: CampaignArenaStatesOptions): Record<string, CampaignArenaState>;
export function calculateCampaignProgress(options: CampaignArenaStatesOptions): number;
export function calculateCampaignProgressSummary(options: CampaignArenaStatesOptions): CampaignProgressSummary;
