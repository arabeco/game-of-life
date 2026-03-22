import { Action, Arena, Campaign, DayOfWeek } from '../types';
import { suggestEmojiForLabel } from './suggestEmojiForLabel';

type CodexTemplateLevelAction = {
  name?: string;
  description?: string;
  icon?: string;
  duration?: number;
  repetitions?: number;
  actionType?: string;
  difficulty?: number;
  briefing?: string;
  assets?: any[];
  preFlight?: string[];
  context?: any;
  scheduledDays?: string[];
  scheduledStartTime?: number;
};

type CodexTemplateLevel = {
  level?: number;
  title?: string;
  description?: string;
  actions?: CodexTemplateLevelAction[];
};

type CodexTemplateLike = {
  title?: string;
  description?: string;
  levels?: CodexTemplateLevel[];
};

export type CodexCampaignPreview = {
  campaign: Campaign;
  arenas: Arena[];
  actions: Action[];
};

export type CodexTemplatePayload = {
  title: string;
  description: string;
  coverImage?: string;
  levels: Array<{
    level: number;
    title: string;
    description?: string;
    actions: CodexTemplateLevelAction[];
  }>;
};

const DAY_OF_WEEK_VALUES: DayOfWeek[] = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const RECURRING_ACTION_TYPE: Action['actionType'] = 'Ação Recorrente';

const normalizeScheduledDays = (scheduledDays?: string[]): DayOfWeek[] | undefined => {
  if (!Array.isArray(scheduledDays)) return undefined;
  const normalized = scheduledDays.filter((day): day is DayOfWeek =>
    DAY_OF_WEEK_VALUES.includes(day as DayOfWeek)
  );
  return normalized.length ? normalized : undefined;
};

const normalizeActionType = (actionType?: string): Action['actionType'] => {
  if (actionType === 'Marco' || actionType === 'Compromisso' || actionType === RECURRING_ACTION_TYPE) {
    return actionType;
  }
  return RECURRING_ACTION_TYPE;
};

export const buildCodexCampaignPreview = (
  codexId: string,
  template: CodexTemplateLike,
  campaignId = `__codex_preview_${codexId}__`
): CodexCampaignPreview => {
  const levels = Array.isArray(template?.levels) ? template.levels : [];
  const arenas: Arena[] = [];
  const actions: Action[] = [];
  const arenaIds: string[] = [];
  const arenaConfig: NonNullable<Campaign['arenaConfig']> = {};

  levels.forEach((level, index) => {
    const levelNumber = typeof level?.level === 'number' ? level.level : index + 1;
    const arenaId = `codex-preview-arena-${codexId}-${levelNumber}`;
    const arenaActions = Array.isArray(level?.actions) ? level.actions : [];
    const previousArenaId = arenaIds[arenaIds.length - 1];

    const arena: Arena = {
      id: arenaId,
      assetId: 'geral',
      name: level?.title || `Fase ${levelNumber}`,
      description: level?.description || '',
      icon: suggestEmojiForLabel(level?.title, 'arena', {
        fallback: arenaActions[0]?.icon || '\u{1F3DB}\uFE0F',
      }),
      actionIds: [],
      isArchived: false,
      originCodexId: codexId,
      codexLevel: levelNumber,
    };

    arenaIds.push(arenaId);
    arenas.push(arena);
    arenaConfig[arenaId] = {
      isLocked: levelNumber > 1,
      isHidden: false,
      prerequisiteArenaIds: levelNumber > 1 && previousArenaId ? [previousArenaId] : [],
    };

    arena.actionIds = arenaActions.map((_, actionIndex) => `codex-preview-action-${codexId}-${levelNumber}-${actionIndex}`);

    arenaActions.forEach((action, actionIndex) => {
      actions.push({
        id: `codex-preview-action-${codexId}-${levelNumber}-${actionIndex}`,
        arenaId,
        name: action?.name || `Ação ${actionIndex + 1}`,
        description: action?.description || '',
        icon: suggestEmojiForLabel(action?.name, 'action', {
          actionType: action?.actionType,
          fallback: action?.icon || '\u2728',
        }),
        duration: typeof action?.duration === 'number' ? action.duration : 15,
        repetitions: typeof action?.repetitions === 'number' ? Math.max(1, Math.floor(action.repetitions)) : 1,
        actionType: normalizeActionType(action?.actionType),
        difficulty: typeof action?.difficulty === 'number' ? action.difficulty : 1,
        briefing: action?.briefing,
        assets: action?.assets,
        preFlight: action?.preFlight,
        context: action?.context,
        scheduledDays: normalizeScheduledDays(action?.scheduledDays),
        scheduledStartTime: action?.scheduledStartTime,
        originCodexId: codexId,
      });
    });
  });

  return {
    campaign: {
      id: campaignId,
      userId: 'codex-preview',
      title: template?.title || 'Preview de Campanha',
      description: template?.description || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      arenaIds,
      arenaConfig,
      type: 'sequential',
      priority: 'media',
      order: -1,
      priorityOrder: -1,
    },
    arenas,
    actions,
  };
};

export const buildCodexTemplateFromDraft = (draft: {
  name?: string;
  description?: string;
  arenas?: Arena[];
  actions?: Action[];
}): CodexTemplatePayload => {
  const arenas = Array.isArray(draft.arenas) ? draft.arenas : [];
  const actions = Array.isArray(draft.actions) ? draft.actions : [];

  return {
    title: draft.name?.trim() || 'Nova Campanha',
    description: draft.description?.trim() || '',
    coverImage: suggestEmojiForLabel(draft.name, 'codex', {
      fallback: arenas[0]?.icon || '\u{1F4DC}',
    }),
    levels: arenas.map((arena, index) => ({
      level: index + 1,
      title: arena.name || `Fase ${index + 1}`,
      description: arena.description || '',
      actions: actions
        .filter((action) => action.arenaId === arena.id)
        .map((action) => ({
          name: action.name,
          description: action.description,
          icon: action.icon,
          duration: action.duration,
          repetitions: action.repetitions,
          actionType: action.actionType,
          difficulty: action.difficulty,
          briefing: action.briefing,
          assets: action.assets,
          preFlight: action.preFlight,
          context: action.context,
          scheduledDays: normalizeScheduledDays(action.scheduledDays),
          scheduledStartTime: action.scheduledStartTime,
        })),
    })),
  };
};
