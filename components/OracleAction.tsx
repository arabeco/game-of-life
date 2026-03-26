import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { Action, ActionType, Arena, DayOfWeek } from '../types';
import { CalendarIcon, CheckCircleIcon, EditIcon, PlannerIcon, SendIcon, SparklesIcon } from './Icons';
import { buildActionPoolByDate } from '../utils/coreLoopUtils.js';
import {
  formatDateLabel,
  formatDaysLabel,
  formatTimeLabel,
  isCancellationText,
  isConfirmationText,
  normalizeText,
  parseDateFromText,
  parseDaysOfWeek,
  parseDifficulty,
  parseDurationMinutes,
  parseOrganizeMode,
  parsePriority,
  parseRepetitions,
  parseTimeMinutes,
} from '../utils/oracleActionUtils';

type ExecutorKind =
  | 'create_cycle'
  | 'edit_cycle_date'
  | 'create_arena'
  | 'update_arena'
  | 'delete_arena'
  | 'create_action'
  | 'update_action'
  | 'schedule_action'
  | 'complete_action'
  | 'organize_day';

type AssistantTone = 'neutral' | 'success' | 'warning';

interface ActionMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  tone?: AssistantTone;
}

interface ExecutorPayload {
  cycleName?: string;
  endDate?: string;
  assetId?: string;
  targetArenaId?: string;
  targetActionId?: string;
  candidateArenaIds?: string[];
  candidateActionIds?: string[];
  name?: string;
  description?: string;
  priority?: Arena['priority'];
  isArchived?: boolean;
  duration?: number;
  repetitions?: number;
  difficulty?: number;
  actionType?: ActionType;
  daysOfWeek?: DayOfWeek[];
  date?: string;
  startTime?: number;
  organizeMode?: 'leve' | 'padrao' | 'intenso';
}

interface PendingExecutor {
  kind: Exclude<ExecutorKind, 'delete_arena'>;
  payload: ExecutorPayload;
  awaitingConfirmation: boolean;
}

interface RankedEntity<T> {
  entity?: T;
  candidates: T[];
}

const createMessageId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const EXAMPLE_PROMPTS = [
  'criar ciclo Reconstrucao ate 12/04',
  'criar arena Corrida em Corpo',
  'criar acao Leitura profunda na arena Foco com 25 min',
  'organizar meu dia no modo leve',
] as const;

const ACTION_INTRO = [
  'Aba operacional do GLYPH.',
  'Eu executo o core loop com perguntas curtas, rascunho e confirmacao antes de aplicar.',
  'Posso criar ciclo, ajustar a data final do ciclo, criar/editar arena, criar/editar/programar acao, concluir agora e organizar o dia.',
  'Excluir arena fica manual por seguranca.',
].join('\n\n');

const normalizeSpaces = (value: string) => value.replace(/\s+/g, ' ').trim();

const ENTITY_STOP_WORDS = new Set([
  'a',
  'acao',
  'acoes',
  'agenda',
  'agendar',
  'amanha',
  'arena',
  'arenas',
  'as',
  'ate',
  'com',
  'cria',
  'criar',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'edita',
  'editar',
  'em',
  'hoje',
  'marca',
  'marcar',
  'meu',
  'min',
  'minuto',
  'minutos',
  'na',
  'no',
  'nova',
  'novo',
  'para',
  'pra',
  'programa',
  'programar',
  'que',
  'um',
  'uma',
]);

const extractQuotedText = (text: string): string | null => {
  const match = text.match(/["'](.+?)["']/);
  return match?.[1]?.trim() || null;
};

const extractEntityTail = (text: string, keyword: 'ciclo' | 'arena' | 'acao'): string | null => {
  const aliases = keyword === 'acao' ? '(?:acao|ação)' : keyword;
  const match = text.match(new RegExp(`${aliases}\\s+(?:de\\s+|do\\s+|da\\s+|chamad[oa]\\s+)?(.+?)(?=\\s+(?:na|no|em|com|ate|até|para|pra|descricao|descrição|prioridade|dificuldade|seg|ter|qua|qui|sex|sab|dom|as\\b|\\d{1,2}[/:h]|$))`, 'i'));
  return match?.[1] ? normalizeSpaces(match[1]) : null;
};

const extractRenameTarget = (text: string): string | null => {
  const quoted = extractQuotedText(text);
  if (quoted) return quoted;
  const match = text.match(/(?:renome(?:ar|ia)|muda(?:r)?(?: o nome)?(?: para)?|nome(?: para)?)\s+(.+?)(?=\s+(?:com|descricao|descrição|prioridade|dificuldade|seg|ter|qua|qui|sex|sab|dom|as\b|\d{1,2}[/:h]|$))/i);
  return match?.[1] ? normalizeSpaces(match[1]) : null;
};

const extractDescription = (text: string): string | null => {
  const match = text.match(/(?:descricao|descrição)\s*:?[\s-]+(.+)$/i);
  return match?.[1] ? normalizeSpaces(match[1]) : null;
};

const extractActionReference = (text: string): string | null => {
  const quoted = extractQuotedText(text);
  if (quoted) return quoted;

  const explicit = extractEntityTail(text, 'acao');
  if (explicit) return explicit;

  const normalized = normalizeText(text);
  const patterns = [
    /(?:agendar|agenda|programar|programa|marcar|marca)\s+(.+?)(?=\s+(?:para|pra|amanha|hoje|seg|ter|qua|qui|sex|sab|dom|as\b|\d{1,2}[/:h]|$))/i,
    /(?:completar|completa|concluir|conclui)\s+(.+?)(?=\s+(?:agora|para|pra|amanha|hoje|as\b|\d{1,2}[/:h]|$))/i,
    /(?:editar|edita|alterar|altera|mudar|muda|renomear|renomeia|ajustar|ajusta)\s+(.+?)(?=\s+(?:com|para|pra|na|no|descricao|descriÃ§Ã£o|dificuldade|duracao|repeticoes|repetiÃ§Ãµes|$))/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return normalizeSpaces(match[1]);
    }
  }

  return null;
};

const extractArenaReference = (text: string): string | null => {
  const quoted = extractQuotedText(text);
  if (quoted) return quoted;

  const explicit = extractEntityTail(text, 'arena');
  if (explicit) return explicit;

  const normalized = normalizeText(text);
  const patterns = [
    /(?:editar|edita|alterar|altera|mudar|muda|arquivar|arquiva|desarquivar|desarquiva)\s+(.+?)(?=\s+(?:com|para|pra|descricao|descriÃ§Ã£o|prioridade|$))/i,
    /(?:remover|remove|deletar|deleta|apagar|apaga|excluir|exclui)\s+(.+?)(?=\s+(?:agora|$))/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return normalizeSpaces(match[1]);
    }
  }

  return null;
};

const tokenizeEntity = (value: string): string[] =>
  normalizeText(value)
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !ENTITY_STOP_WORDS.has(token));

const tokenMatches = (left: string, right: string) =>
  left === right || left.startsWith(right) || right.startsWith(left);

const scoreEntityMatch = (reference: string, candidateName: string): number => {
  const normalizedReference = normalizeText(reference);
  const normalizedCandidate = normalizeText(candidateName);
  if (!normalizedReference || !normalizedCandidate) return 0;

  if (normalizedReference === normalizedCandidate) return 160;
  if (normalizedCandidate.startsWith(normalizedReference)) return 135;
  if (normalizedReference.startsWith(normalizedCandidate)) return 118;
  if (normalizedCandidate.includes(normalizedReference) && normalizedReference.length >= 4) return 112;
  if (normalizedReference.includes(normalizedCandidate) && normalizedCandidate.length >= 4) return 104;

  const referenceTokens = tokenizeEntity(normalizedReference);
  const candidateTokens = tokenizeEntity(normalizedCandidate);
  if (referenceTokens.length === 0 || candidateTokens.length === 0) return 0;

  const matchedTokens = candidateTokens.filter((candidateToken) =>
    referenceTokens.some((referenceToken) => tokenMatches(referenceToken, candidateToken)));
  const uniqueMatches = Array.from(new Set(matchedTokens));
  if (uniqueMatches.length === 0) return 0;

  const coverageOnCandidate = uniqueMatches.length / candidateTokens.length;
  const coverageOnReference = uniqueMatches.length / referenceTokens.length;
  const firstTokenBoost = tokenMatches(referenceTokens[0], candidateTokens[0]) ? 10 : 0;

  return (uniqueMatches.length * 22)
    + (coverageOnCandidate * 42)
    + (coverageOnReference * 28)
    + firstTokenBoost;
};

const getNumericChoice = (text: string): number | null => {
  const match = normalizeText(text).match(/^\s*(\d+)\b/);
  return match ? parseInt(match[1], 10) : null;
};

const rankEntities = <T,>(
  text: string,
  items: T[],
  getId: (item: T) => string,
  getName: (item: T) => string,
  options: {
    fallbackId?: string;
    candidateIds?: string[];
    referenceExtractor?: (value: string) => string | null;
  } = {},
): RankedEntity<T> => {
  if (options.fallbackId) {
    const exact = items.find((item) => getId(item) === options.fallbackId);
    if (exact) return { entity: exact, candidates: [] };
  }

  const candidateScope = options.candidateIds?.length
    ? items.filter((item) => options.candidateIds!.includes(getId(item)))
    : items;
  if (candidateScope.length === 0) {
    return { candidates: [] };
  }

  const numericChoice = getNumericChoice(text);
  if (options.candidateIds?.length && numericChoice && numericChoice >= 1 && numericChoice <= candidateScope.length) {
    return { entity: candidateScope[numericChoice - 1], candidates: candidateScope };
  }

  const normalizedText = normalizeText(text);
  const byId = candidateScope.find((item) => normalizedText.includes(normalizeText(getId(item))));
  if (byId) {
    return { entity: byId, candidates: [] };
  }

  const reference = normalizeSpaces(options.referenceExtractor?.(text) || text);
  const normalizedReference = normalizeText(reference);
  const exactByName = candidateScope.find((item) => normalizeText(getName(item)) === normalizedReference);
  if (exactByName) {
    return { entity: exactByName, candidates: [] };
  }

  const ranked = candidateScope
    .map((item) => ({
      item,
      score: scoreEntityMatch(reference, getName(item)),
    }))
    .filter((entry) => entry.score >= 52)
    .sort((left, right) => right.score - left.score);

  if (ranked.length === 0) {
    return { candidates: [] };
  }

  const top = ranked[0];
  const second = ranked[1];
  const confident = top.score >= 105 || !second || (top.score - second.score >= 18);
  if (confident) {
    return { entity: top.item, candidates: ranked.slice(0, 3).map((entry) => entry.item) };
  }

  return { candidates: ranked.slice(0, 3).map((entry) => entry.item) };
};

const parseActionType = (text: string): ActionType | null => {
  const normalized = normalizeText(text);
  if (/\bmarco\b/.test(normalized)) return 'Marco';
  if (/\bcompromisso\b/.test(normalized)) return 'Compromisso';
  if (/\b(recorrente|recorrencia|repetir|todo dia|todos os dias)\b/.test(normalized)) return 'Ação Recorrente';
  if (/\blivre\b/.test(normalized)) return 'Livre';
  return null;
};

const formatAssistantText = (lines: string[]) => lines.filter(Boolean).join('\n');

const priorityScore = (priority?: Arena['priority']) => {
  if (priority === 'alta') return 0;
  if (priority === 'media') return 1;
  if (priority === 'baixa') return 2;
  return 3;
};

export const OracleAction: React.FC = () => {
  const {
    activeCycle,
    actions,
    addAction,
    addArena,
    assets,
    clearPendingTasksForAction,
    dailyCommitment,
    scheduleAndCompleteNow,
    scheduleMultipleTasks,
    scheduleTask,
    setDailyCommitment,
    startCycle,
    taskPool,
    tasks,
    unlockDailyCommitment,
    updateAction,
    updateArena,
    updateCycle,
    updateOperationalScratch,
  } = useGame();

  const [messages, setMessages] = useState<ActionMessage[]>([
    { id: createMessageId(), role: 'assistant', content: ACTION_INTRO },
  ]);
  const [input, setInput] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [pendingExecutor, setPendingExecutor] = useState<PendingExecutor | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allArenas = useMemo(() => assets.flatMap((asset) => asset.arenas), [assets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWorking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const appendAssistant = (content: string, tone: AssistantTone = 'neutral') => {
    setMessages((previous) => [...previous, { id: createMessageId(), role: 'assistant', content, tone }]);
  };

  const resolveAsset = (text: string, fallbackId?: string): string | undefined => {
    if (fallbackId) return fallbackId;
    const normalized = normalizeText(text);
    const found = assets.find((asset) => {
      const assetName = normalizeText(asset.name);
      return normalized.includes(assetName) || normalized.includes(asset.id.toLowerCase());
    });
    return found?.id;
  };

  const resolveArena = (text: string, fallbackId?: string): Arena | undefined => {
    return rankEntities(text, allArenas, (arena) => arena.id, (arena) => arena.name, {
      fallbackId,
      referenceExtractor: extractArenaReference,
    }).entity;
  };

  const resolveActionMatch = (text: string, fallbackId?: string, candidateIds?: string[]): RankedEntity<Action> =>
    rankEntities(text, actions, (action) => action.id, (action) => action.name, {
      fallbackId,
      candidateIds,
      referenceExtractor: extractActionReference,
    });

  const resolveArenaMatch = (text: string, fallbackId?: string, candidateIds?: string[]): RankedEntity<Arena> =>
    rankEntities(text, allArenas, (arena) => arena.id, (arena) => arena.name, {
      fallbackId,
      candidateIds,
      referenceExtractor: extractArenaReference,
    });

  const shouldReuseActionFallback = (text: string) =>
    !extractActionReference(text) && !getNumericChoice(text);

  const shouldReuseArenaFallback = (text: string) =>
    !extractArenaReference(text) && !getNumericChoice(text);

  const parseBasePayload = (kind: PendingExecutor['kind'], text: string, previous: ExecutorPayload = {}): ExecutorPayload => {
    const payload: ExecutorPayload = { ...previous };
    const normalized = normalizeText(text);
    const quoted = extractQuotedText(text);

    if (kind === 'create_cycle') {
      payload.cycleName = payload.cycleName
        || quoted
        || extractEntityTail(text, 'ciclo')
        || payload.cycleName;
      payload.endDate = parseDateFromText(text) || payload.endDate;
      return payload;
    }

    if (kind === 'edit_cycle_date') {
      payload.endDate = parseDateFromText(text) || payload.endDate;
      return payload;
    }

    if (kind === 'create_arena') {
      payload.name = payload.name
        || quoted
        || extractEntityTail(text, 'arena')
        || payload.name;
      payload.assetId = resolveAsset(text, payload.assetId);
      payload.description = extractDescription(text) || payload.description;
      payload.priority = parsePriority(text) || payload.priority;
      return payload;
    }

    if (kind === 'update_arena') {
      const arenaMatch = resolveArenaMatch(
        text,
        shouldReuseArenaFallback(text) ? payload.targetArenaId : undefined,
        payload.candidateArenaIds,
      );
      if (arenaMatch.entity) {
        payload.targetArenaId = arenaMatch.entity.id;
        payload.candidateArenaIds = undefined;
      } else if (!payload.targetArenaId && arenaMatch.candidates.length > 0) {
        payload.candidateArenaIds = arenaMatch.candidates.map((arena) => arena.id);
      }
      payload.name = extractRenameTarget(text) || payload.name;
      payload.description = extractDescription(text) || payload.description;
      payload.priority = parsePriority(text) || payload.priority;
      if (/\bdesarquiv/.test(normalized)) payload.isArchived = false;
      if (/\barquiv/.test(normalized) && !/\bdesarquiv/.test(normalized)) payload.isArchived = true;
      return payload;
    }

    if (kind === 'create_action') {
      const arenaMatch = resolveArenaMatch(
        text,
        shouldReuseArenaFallback(text) ? payload.targetArenaId : undefined,
        payload.candidateArenaIds,
      );
      if (arenaMatch.entity) {
        payload.targetArenaId = arenaMatch.entity.id;
        payload.candidateArenaIds = undefined;
      } else if (!payload.targetArenaId && arenaMatch.candidates.length > 0) {
        payload.candidateArenaIds = arenaMatch.candidates.map((arena) => arena.id);
      }

      payload.name = payload.name
        || quoted
        || extractEntityTail(text, 'acao')
        || payload.name;
      payload.description = extractDescription(text) || payload.description;
      payload.duration = parseDurationMinutes(text) || payload.duration;
      payload.repetitions = parseRepetitions(text) || payload.repetitions;
      payload.difficulty = parseDifficulty(text) || payload.difficulty;
      const parsedDays = parseDaysOfWeek(text);
      payload.daysOfWeek = parsedDays.length > 0 ? parsedDays : payload.daysOfWeek;
      payload.date = parseDateFromText(text) || payload.date;
      payload.startTime = parseTimeMinutes(text) ?? payload.startTime;
      payload.actionType = parseActionType(text) || payload.actionType;

      if (!payload.actionType) {
        if ((payload.daysOfWeek && payload.daysOfWeek.length > 0) || /\brecorr/.test(normalized)) {
          payload.actionType = 'Ação Recorrente';
        } else if (payload.date && typeof payload.startTime === 'number') {
          payload.actionType = 'Compromisso';
        } else {
          payload.actionType = 'Livre';
        }
      }
      return payload;
    }

    if (kind === 'update_action') {
      const actionMatch = resolveActionMatch(
        text,
        shouldReuseActionFallback(text) ? payload.targetActionId : undefined,
        payload.candidateActionIds,
      );
      if (actionMatch.entity) {
        payload.targetActionId = actionMatch.entity.id;
        payload.candidateActionIds = undefined;
      } else if (!payload.targetActionId && actionMatch.candidates.length > 0) {
        payload.candidateActionIds = actionMatch.candidates.map((action) => action.id);
      }

      const nextArenaMatch = resolveArenaMatch(
        text,
        shouldReuseArenaFallback(text) ? payload.targetArenaId : undefined,
        payload.candidateArenaIds,
      );
      if (nextArenaMatch.entity) {
        payload.targetArenaId = nextArenaMatch.entity.id;
        payload.candidateArenaIds = undefined;
      } else if (!payload.targetArenaId && nextArenaMatch.candidates.length > 0) {
        payload.candidateArenaIds = nextArenaMatch.candidates.map((arena) => arena.id);
      }

      payload.name = extractRenameTarget(text) || payload.name;
      payload.description = extractDescription(text) || payload.description;
      payload.duration = parseDurationMinutes(text) || payload.duration;
      payload.repetitions = parseRepetitions(text) || payload.repetitions;
      payload.difficulty = parseDifficulty(text) || payload.difficulty;
      payload.actionType = parseActionType(text) || payload.actionType;
      return payload;
    }

    if (kind === 'schedule_action') {
      const actionMatch = resolveActionMatch(
        text,
        shouldReuseActionFallback(text) ? payload.targetActionId : undefined,
        payload.candidateActionIds,
      );
      if (actionMatch.entity) {
        payload.targetActionId = actionMatch.entity.id;
        payload.candidateActionIds = undefined;
      } else if (!payload.targetActionId && actionMatch.candidates.length > 0) {
        payload.candidateActionIds = actionMatch.candidates.map((action) => action.id);
      }
      const parsedDays = parseDaysOfWeek(text);
      payload.daysOfWeek = parsedDays.length > 0 ? parsedDays : payload.daysOfWeek;
      payload.date = parseDateFromText(text) || payload.date;
      payload.startTime = parseTimeMinutes(text) ?? payload.startTime;
      return payload;
    }

    if (kind === 'complete_action') {
      const actionMatch = resolveActionMatch(
        text,
        shouldReuseActionFallback(text) ? payload.targetActionId : undefined,
        payload.candidateActionIds,
      );
      if (actionMatch.entity) {
        payload.targetActionId = actionMatch.entity.id;
        payload.candidateActionIds = undefined;
      } else if (!payload.targetActionId && actionMatch.candidates.length > 0) {
        payload.candidateActionIds = actionMatch.candidates.map((action) => action.id);
      }
      payload.date = parseDateFromText(text) || payload.date;
      payload.startTime = parseTimeMinutes(text) ?? payload.startTime;
      return payload;
    }

    if (kind === 'organize_day') {
      payload.organizeMode = parseOrganizeMode(text) || payload.organizeMode || 'padrao';
      return payload;
    }

    return payload;
  };

  const detectKind = (text: string): ExecutorKind | null => {
    const normalized = normalizeText(text);
    const actionReference = extractActionReference(text);
    const hasActionHint = !!actionReference || /\bacao\b/.test(normalized);

    if (/\b(organizar meu dia|organiza meu dia|organizar dia|planejar meu dia|organiza o dia)\b/.test(normalized)) {
      return 'organize_day';
    }

    if ((/\b(deletar|deleta|apagar|apaga|excluir|exclui)\b/.test(normalized) && /\barena\b/.test(normalized))
      || /\bremover arena\b/.test(normalized)) {
      return 'delete_arena';
    }

    if ((/\bciclo\b/.test(normalized) && /\b(data final|fim do ciclo|prazo|ate|estender|prorrogar|mudar data|editar data)\b/.test(normalized))
      || /\beditar ciclo\b/.test(normalized)) {
      return 'edit_cycle_date';
    }

    if (/\b(criar|cria|novo|nova)\b/.test(normalized) && /\bciclo\b/.test(normalized)) {
      return 'create_cycle';
    }

    if (/\b(editar|edita|alterar|altera|mudar|muda|renomear|renomeia|arquivar|arquiva|desarquivar|desarquiva)\b/.test(normalized) && /\barena\b/.test(normalized)) {
      return 'update_arena';
    }

    if (/\b(criar|cria|novo|nova)\b/.test(normalized) && /\barena\b/.test(normalized)) {
      return 'create_arena';
    }

    if ((/\b(completar|completa|concluir|conclui|feito agora|feita agora)\b/.test(normalized) && hasActionHint)
      || (/\b(completar|completa|concluir|conclui)\b/.test(normalized) && resolveActionMatch(text).candidates.length > 0)) {
      return 'complete_action';
    }

    if ((/\b(programar|programa|agendar|agenda|marcar|marca)\b/.test(normalized) && hasActionHint)
      || (/\b(programar|programa|agendar|agenda|marcar|marca)\b/.test(normalized) && resolveActionMatch(text).candidates.length > 0)) {
      return 'schedule_action';
    }

    if (/\b(editar|edita|alterar|altera|mudar|muda|renomear|renomeia|ajustar|ajusta)\b/.test(normalized) && hasActionHint) {
      return 'update_action';
    }

    if (/\b(criar|cria|novo|nova)\b/.test(normalized) && /\bacao\b/.test(normalized)) {
      return 'create_action';
    }

    return null;
  };

  const getMissingFields = (kind: PendingExecutor['kind'], payload: ExecutorPayload): string[] => {
    if (kind === 'create_cycle') {
      return ['cycleName', 'endDate'].filter((field) => !payload[field as keyof ExecutorPayload]) as string[];
    }

    if (kind === 'edit_cycle_date') {
      if (!activeCycle) return ['activeCycle'];
      return payload.endDate ? [] : ['endDate'];
    }

    if (kind === 'create_arena') {
      return ['name', 'assetId'].filter((field) => !payload[field as keyof ExecutorPayload]) as string[];
    }

    if (kind === 'update_arena') {
      const changes = [payload.name, payload.description, payload.priority, typeof payload.isArchived === 'boolean' ? payload.isArchived : undefined].filter((value) => value !== undefined);
      const missing: string[] = [];
      if (!payload.targetArenaId) missing.push('targetArenaId');
      if (changes.length === 0) missing.push('arenaChange');
      return missing;
    }

    if (kind === 'create_action') {
      const missing: string[] = [];
      if (!payload.name) missing.push('name');
      if (!payload.targetArenaId) missing.push('targetArenaId');
      if (payload.actionType === 'Ação Recorrente' && !payload.daysOfWeek?.length) missing.push('daysOfWeek');
      if ((payload.actionType === 'Ação Recorrente' || payload.actionType === 'Compromisso') && typeof payload.startTime !== 'number') missing.push('startTime');
      if (payload.actionType === 'Compromisso' && !payload.date) missing.push('date');
      return missing;
    }

    if (kind === 'update_action') {
      const action = actions.find((item) => item.id === payload.targetActionId);
      const changedArena = payload.targetArenaId && payload.targetArenaId !== action?.arenaId;
      const changes = [payload.name, payload.description, payload.duration, payload.repetitions, payload.difficulty, payload.actionType].filter((value) => value !== undefined);
      const missing: string[] = [];
      if (!payload.targetActionId) missing.push('targetActionId');
      if (changes.length === 0 && !changedArena) missing.push('actionChange');
      return missing;
    }

    if (kind === 'schedule_action') {
      const missing: string[] = [];
      if (!payload.targetActionId) missing.push('targetActionId');
      if (typeof payload.startTime !== 'number') missing.push('startTime');
      if (!payload.date && (!payload.daysOfWeek || payload.daysOfWeek.length === 0)) missing.push('scheduleMode');
      return missing;
    }

    if (kind === 'complete_action') {
      return payload.targetActionId ? [] : ['targetActionId'];
    }

    return [];
  };

  const buildMissingPrompt = (kind: PendingExecutor['kind'], missingFields: string[], payload?: ExecutorPayload): string => {
    if (missingFields.includes('activeCycle')) {
      return 'Nao existe ciclo ativo para editar agora.';
    }

    const promptPayload = payload || pendingExecutor?.payload;

    const assetOptions = assets.slice(0, 6).map((asset) => asset.name).join(', ');

    const prompts: Record<string, string> = {
      cycleName: 'Qual nome devo usar para o ciclo?',
      endDate: 'Qual deve ser a data final? Ex.: 12/04 ou 12 de abril.',
      name: kind === 'create_arena'
        ? 'Qual nome devo usar para a nova arena?'
        : 'Qual nome devo usar para a nova acao?',
      assetId: `Essa arena entra em qual ativo? Posso usar ${assetOptions || 'um ativo existente'}.`,
      targetArenaId: kind === 'create_action'
        ? 'Essa acao entra em qual arena?'
        : 'Qual arena voce quer editar?',
      arenaChange: 'O que devo mudar nessa arena? Posso ajustar nome, descricao, prioridade ou arquivar/desarquivar.',
      targetActionId: 'Qual acao voce quer usar?',
      actionChange: 'O que devo mudar nessa acao? Posso ajustar nome, descricao, duracao, repeticoes, dificuldade ou tipo.',
      startTime: 'Qual horario devo usar? Ex.: 07:00 ou 19h.',
      date: 'Qual data devo usar para essa instancia unica?',
      daysOfWeek: 'Quais dias da semana devo programar? Ex.: seg qua sex.',
      scheduleMode: 'Voce quer uma instancia unica ou recorrente? Diga uma data ou os dias da semana.',
    };

    if (missingFields.includes('targetActionId') && promptPayload?.candidateActionIds?.length) {
      const options = promptPayload.candidateActionIds
        .map((id) => actions.find((action) => action.id === id))
        .filter((action): action is Action => !!action)
        .map((action, index) => `${index + 1}. ${action.name}`);
      return formatAssistantText([
        'Ainda nao consigo aplicar.',
        '',
        'Achei acoes proximas. Me diga o numero ou o nome:',
        ...options,
        ...(missingFields.includes('startTime')
          ? ['', 'Depois disso ainda preciso do horario.']
          : []),
      ]);
    }

    if (missingFields.includes('targetArenaId') && promptPayload?.candidateArenaIds?.length) {
      const options = promptPayload.candidateArenaIds
        .map((id) => allArenas.find((arena) => arena.id === id))
        .filter((arena): arena is Arena => !!arena)
        .map((arena, index) => `${index + 1}. ${arena.name}`);
      return formatAssistantText([
        'Ainda nao consigo aplicar.',
        '',
        'Achei arenas proximas. Me diga o numero ou o nome:',
        ...options,
      ]);
    }

    return formatAssistantText([
      'Nao consigo aplicar ainda.',
      '',
      'Preciso de:',
      ...missingFields.slice(0, 3).map((field, index) => `${index + 1}. ${prompts[field] || 'Mais contexto sobre o pedido.'}`),
    ]);
  };

  const buildConfirmationFooter = (kind: PendingExecutor['kind']) => {
    const adjustmentHint = kind === 'schedule_action'
      ? 'Se quiser ajustar, responda so com a mudanca. Ex.: 14h ou sexta.'
      : kind === 'create_action' || kind === 'update_action'
        ? 'Se quiser ajustar, responda so com a mudanca. Ex.: 40 min, arena Corpo ou dificuldade 2.'
        : kind === 'create_cycle' || kind === 'edit_cycle_date'
          ? 'Se quiser ajustar, responda so com a nova data ou o novo nome.'
          : kind === 'create_arena' || kind === 'update_arena'
            ? 'Se quiser ajustar, responda so com a mudanca. Ex.: prioridade alta ou nome novo.'
            : 'Se quiser ajustar, responda so com a mudanca.';

    return ['', 'Se estiver certo, diga "pode" ou toque em Aplicar.', adjustmentHint, 'Se quiser abortar, diga "cancelar".'];
  };

  const buildPreview = (kind: PendingExecutor['kind'], payload: ExecutorPayload): string => {
    if (kind === 'create_cycle') {
      return formatAssistantText([
        `Rascunho pronto: criar o ciclo "${payload.cycleName}" com fim em ${formatDateLabel(payload.endDate!)}.`,
        ...buildConfirmationFooter(kind),
      ]);
    }

    if (kind === 'edit_cycle_date') {
      return formatAssistantText([
        `Rascunho pronto: mover a data final do ciclo atual para ${formatDateLabel(payload.endDate!)}.`,
        ...buildConfirmationFooter(kind),
      ]);
    }

    if (kind === 'create_arena') {
      const asset = assets.find((item) => item.id === payload.assetId);
      return formatAssistantText([
        `Rascunho pronto: criar a arena "${payload.name}" dentro de ${asset?.name || payload.assetId}.`,
        ...buildConfirmationFooter(kind),
      ]);
    }

    if (kind === 'update_arena') {
      const arena = allArenas.find((item) => item.id === payload.targetArenaId);
      const changes: string[] = [];
      if (payload.name) changes.push(`nome -> ${payload.name}`);
      if (payload.description) changes.push(`descricao -> ${payload.description}`);
      if (payload.priority) changes.push(`prioridade -> ${payload.priority}`);
      if (payload.isArchived === true) changes.push('estado -> arquivada');
      if (payload.isArchived === false) changes.push('estado -> ativa');
      return formatAssistantText([
        `Rascunho pronto: atualizar a arena "${arena?.name || 'selecionada'}": ${changes.join(' | ')}.`,
        ...buildConfirmationFooter(kind),
      ]);
    }

    if (kind === 'create_action') {
      const arena = allArenas.find((item) => item.id === payload.targetArenaId);
      const scheduleLine = payload.actionType === 'Ação Recorrente'
        ? ` Recorrencia: ${formatDaysLabel(payload.daysOfWeek || [])} as ${formatTimeLabel(payload.startTime!)}.`
        : payload.actionType === 'Compromisso'
          ? ` Instancia unica: ${formatDateLabel(payload.date!)} as ${formatTimeLabel(payload.startTime!)}.`
          : '';
      return formatAssistantText([
        `Rascunho pronto: criar a acao "${payload.name}" na arena "${arena?.name || 'selecionada'}" com ${payload.duration || 30} min.${scheduleLine}`,
        ...buildConfirmationFooter(kind),
      ]);
    }

    if (kind === 'update_action') {
      const action = actions.find((item) => item.id === payload.targetActionId);
      const targetArena = payload.targetArenaId ? allArenas.find((item) => item.id === payload.targetArenaId) : null;
      const changes: string[] = [];
      if (payload.name) changes.push(`nome -> ${payload.name}`);
      if (payload.description) changes.push(`descricao -> ${payload.description}`);
      if (payload.duration) changes.push(`duracao -> ${payload.duration} min`);
      if (payload.repetitions) changes.push(`repeticoes -> ${payload.repetitions}x`);
      if (payload.difficulty) changes.push(`dificuldade -> ${payload.difficulty}`);
      if (payload.actionType) changes.push(`tipo -> ${payload.actionType}`);
      if (targetArena && action?.arenaId !== targetArena.id) changes.push(`arena -> ${targetArena.name}`);
      return formatAssistantText([
        `Rascunho pronto: atualizar a acao "${action?.name || 'selecionada'}": ${changes.join(' | ')}.`,
        ...buildConfirmationFooter(kind),
      ]);
    }

    if (kind === 'schedule_action') {
      const action = actions.find((item) => item.id === payload.targetActionId);
      const scheduleLine = payload.daysOfWeek?.length
        ? `${formatDaysLabel(payload.daysOfWeek)} as ${formatTimeLabel(payload.startTime!)}`
        : `${formatDateLabel(payload.date!)} as ${formatTimeLabel(payload.startTime!)}`;
      return formatAssistantText([
        `Rascunho pronto: programar "${action?.name || 'a acao'}" em ${scheduleLine}.`,
        ...buildConfirmationFooter(kind),
      ]);
    }

    if (kind === 'complete_action') {
      const action = actions.find((item) => item.id === payload.targetActionId);
      return formatAssistantText([
        `Rascunho pronto: concluir "${action?.name || 'a acao'}" agora.`,
        ...buildConfirmationFooter(kind),
      ]);
    }

    return formatAssistantText([
      `Rascunho pronto: organizar hoje em modo ${payload.organizeMode || 'padrao'}, mexendo no planner e no painel diario.`,
      ...buildConfirmationFooter(kind),
    ]);
  };

  const executeOperation = async (kind: PendingExecutor['kind'], payload: ExecutorPayload): Promise<string> => {
    if (kind === 'create_cycle') {
      startCycle(payload.cycleName!, payload.endDate!);
      return `Ciclo criado com fim em ${formatDateLabel(payload.endDate!)}.`;
    }

    if (kind === 'edit_cycle_date') {
      if (!activeCycle) return 'Nao existe ciclo ativo para editar.';
      await updateCycle(activeCycle.id, { endDate: payload.endDate! });
      return `Data final do ciclo atualizada para ${formatDateLabel(payload.endDate!)}.`;
    }

    if (kind === 'create_arena') {
      await addArena(payload.assetId!, {
        name: payload.name!,
        description: payload.description || 'Criada pela aba Acao',
        icon: '✨',
        priority: payload.priority,
      });
      return `Arena "${payload.name}" criada.`;
    }

    if (kind === 'update_arena') {
      updateArena(payload.targetArenaId!, {
        name: payload.name,
        description: payload.description,
        priority: payload.priority,
        isArchived: payload.isArchived,
      });
      return 'Arena atualizada.';
    }

    if (kind === 'create_action') {
      const actionType = payload.actionType || 'Livre';
      const createdAction = await addAction({
        arenaId: payload.targetArenaId!,
        name: payload.name!,
        description: payload.description || 'Criada pela aba Acao',
        icon: '📝',
        duration: payload.duration || 30,
        repetitions: actionType === 'Ação Recorrente' ? (payload.repetitions || 1) : 1,
        actionType,
        difficulty: payload.difficulty || 3,
        scheduledDays: actionType === 'Ação Recorrente' ? payload.daysOfWeek : undefined,
        scheduledStartTime: actionType !== 'Livre' ? payload.startTime : undefined,
      });

      if (actionType === 'Ação Recorrente' && payload.daysOfWeek?.length && typeof payload.startTime === 'number') {
        await scheduleMultipleTasks(createdAction, payload.daysOfWeek, payload.startTime);
      }

      if (actionType === 'Compromisso' && payload.date && typeof payload.startTime === 'number') {
        await scheduleTask(createdAction, payload.date, payload.startTime);
      }

      return `Acao "${payload.name}" criada.`;
    }

    if (kind === 'update_action') {
      const action = actions.find((item) => item.id === payload.targetActionId);
      const nextArenaId = payload.targetArenaId && payload.targetArenaId !== action?.arenaId ? payload.targetArenaId : undefined;
      updateAction(payload.targetActionId!, {
        name: payload.name,
        description: payload.description,
        duration: payload.duration,
        repetitions: payload.repetitions,
        difficulty: payload.difficulty,
        actionType: payload.actionType,
        arenaId: nextArenaId,
      });
      return 'Acao atualizada.';
    }

    if (kind === 'schedule_action') {
      if (payload.daysOfWeek?.length) {
        await clearPendingTasksForAction(payload.targetActionId!);
        updateAction(payload.targetActionId!, {
          actionType: 'Ação Recorrente',
          scheduledDays: payload.daysOfWeek,
          scheduledStartTime: payload.startTime,
        });
        await scheduleMultipleTasks(payload.targetActionId!, payload.daysOfWeek, payload.startTime!);
        return 'Acao recorrente programada.';
      }

      await scheduleTask(payload.targetActionId!, payload.date!, payload.startTime!);
      updateAction(payload.targetActionId!, {
        actionType: 'Compromisso',
        scheduledStartTime: payload.startTime,
      });
      return `Instancia unica criada para ${formatDateLabel(payload.date!)}.`;
    }

    if (kind === 'complete_action') {
      await scheduleAndCompleteNow(payload.targetActionId!);
      return 'Acao concluida agora.';
    }

    const targetCount = payload.organizeMode === 'leve'
      ? 2
      : payload.organizeMode === 'intenso'
        ? 4
        : 3;

    if (dailyCommitment.stage === 'judgment') {
      return 'O painel diario ja esta em julgamento. Reabra no proximo dia para reorganizar.';
    }

    if (dailyCommitment.stage === 'battle') {
      unlockDailyCommitment();
    }

    const today = getLocalDateString();
    const todaysPendingTasks = tasks
      .filter((task) => task.date === today && !task.completed)
      .sort((a, b) => {
        if (a.startTime < 0 && b.startTime >= 0) return 1;
        if (a.startTime >= 0 && b.startTime < 0) return -1;
        return a.startTime - b.startTime;
      });

    const selectedTaskIds = todaysPendingTasks.slice(0, targetCount).map((task) => task.id);
    const existingActionIds = new Set(todaysPendingTasks.map((task) => task.actionId));
    const usedStartTimes = new Set(todaysPendingTasks.filter((task) => task.startTime >= 0).map((task) => task.startTime));

    if (selectedTaskIds.length < targetCount) {
      const pool = buildActionPoolByDate(actions, taskPool, tasks, today, []);
      const candidateActions = actions
        .filter((action) => (pool[action.id]?.count || 0) > 0)
        .filter((action) => !existingActionIds.has(action.id))
        .filter((action) => {
          const arena = allArenas.find((item) => item.id === action.arenaId);
          return !arena?.isArchived;
        })
        .sort((a, b) => {
          const arenaA = allArenas.find((item) => item.id === a.arenaId);
          const arenaB = allArenas.find((item) => item.id === b.arenaId);
          return priorityScore(arenaA?.priority) - priorityScore(arenaB?.priority)
            || (a.duration || 30) - (b.duration || 30)
            || (a.difficulty || 3) - (b.difficulty || 3);
        });

      const slots = [540, 720, 900, 1080, 1260];
      for (const action of candidateActions) {
        if (selectedTaskIds.length >= targetCount) break;
        const nextSlot = slots.find((slot) => !usedStartTimes.has(slot));
        if (typeof nextSlot !== 'number') break;
        const createdTask = await scheduleTask(action, today, nextSlot);
        usedStartTimes.add(nextSlot);
        if (createdTask?.id) {
          selectedTaskIds.push(createdTask.id);
        }
      }
    }

    if (selectedTaskIds.length === 0) {
      return 'Nao encontrei acoes boas para montar o dia agora.';
    }

    setDailyCommitment(selectedTaskIds);
    updateOperationalScratch(`Dia organizado em modo ${payload.organizeMode || 'padrao'} pela aba Acao.`);
    return `Dia organizado com ${selectedTaskIds.length} frente(s) no painel diario.`;
  };

  const handleExecutorStart = (kind: PendingExecutor['kind'], payload: ExecutorPayload) => {
    const missingFields = getMissingFields(kind, payload);
    if (missingFields.length > 0) {
      setPendingExecutor({ kind, payload, awaitingConfirmation: false });
      appendAssistant(buildMissingPrompt(kind, missingFields, payload), 'warning');
      return;
    }

    setPendingExecutor({ kind, payload, awaitingConfirmation: true });
    appendAssistant(buildPreview(kind, payload));
  };

  const handleDeleteArenaRequest = (text: string) => {
    const arena = resolveArena(text);
    appendAssistant(
      formatAssistantText([
        'Excluir arena precisa ser feito manualmente por seguranca.',
        arena ? `Arena detectada: ${arena.name}.` : '',
        'Se quiser, eu posso te ajudar a arquivar essa arena ou ajustar alguma informacao dela.',
      ]),
      'warning',
    );
  };

  const handleSendMessage = async (overrideInput?: string) => {
    const nextInput = (overrideInput ?? input).trim();
    if (!nextInput || isWorking) return;

    setMessages((previous) => [...previous, { id: createMessageId(), role: 'user', content: nextInput }]);
    setInput('');

    if (pendingExecutor) {
      if (pendingExecutor.awaitingConfirmation) {
        if (isCancellationText(nextInput)) {
          setPendingExecutor(null);
          appendAssistant('Pedido cancelado. Quando quiser, eu monto outro rascunho.', 'warning');
          return;
        }

        if (!isConfirmationText(nextInput)) {
          const mergedPayload = parseBasePayload(pendingExecutor.kind, nextInput, pendingExecutor.payload);
          const missingFields = getMissingFields(pendingExecutor.kind, mergedPayload);
          if (missingFields.length > 0) {
            setPendingExecutor({ kind: pendingExecutor.kind, payload: mergedPayload, awaitingConfirmation: false });
            appendAssistant(buildMissingPrompt(pendingExecutor.kind, missingFields, mergedPayload), 'warning');
            return;
          }

          setPendingExecutor({ kind: pendingExecutor.kind, payload: mergedPayload, awaitingConfirmation: true });
          appendAssistant('Ajustei o rascunho.');
          appendAssistant(buildPreview(pendingExecutor.kind, mergedPayload));
          return;
        }

        setIsWorking(true);
        try {
          const result = await executeOperation(pendingExecutor.kind, pendingExecutor.payload);
          setPendingExecutor(null);
          appendAssistant(result, 'success');
        } catch (error) {
          console.error('OracleAction execute error:', error);
          appendAssistant('Nao consegui aplicar essa operacao agora.', 'warning');
        } finally {
          setIsWorking(false);
        }
        return;
      }

      const mergedPayload = parseBasePayload(pendingExecutor.kind, nextInput, pendingExecutor.payload);
      const missingFields = getMissingFields(pendingExecutor.kind, mergedPayload);
      if (missingFields.length > 0) {
        setPendingExecutor({ ...pendingExecutor, payload: mergedPayload });
        appendAssistant(buildMissingPrompt(pendingExecutor.kind, missingFields, mergedPayload), 'warning');
        return;
      }

      setPendingExecutor({ kind: pendingExecutor.kind, payload: mergedPayload, awaitingConfirmation: true });
      appendAssistant(buildPreview(pendingExecutor.kind, mergedPayload));
      return;
    }

    const detectedKind = detectKind(nextInput);
    if (!detectedKind) {
      appendAssistant(
        formatAssistantText([
          'Nao classifiquei o pedido ainda.',
          '',
          'Posso receber coisas como:',
          '1. criar ciclo Reconstrucao ate 12/04',
          '2. criar arena Corrida em Corpo',
          '3. criar acao Leitura na arena Foco com 25 min',
          '4. programar acao Leitura seg qua sex as 07:00',
          '5. organizar meu dia no modo leve',
        ]),
        'warning',
      );
      return;
    }

    if (detectedKind === 'delete_arena') {
      handleDeleteArenaRequest(nextInput);
      return;
    }

    const initialPayload = parseBasePayload(detectedKind, nextInput);
    if (detectedKind === 'complete_action') {
      const hasFutureSchedule = initialPayload.date || typeof initialPayload.startTime === 'number';
      if (hasFutureSchedule && typeof initialPayload.startTime === 'number') {
        const targetDate = initialPayload.date || getLocalDateString();
        const nowMinutes = (new Date().getHours() * 60) + new Date().getMinutes();
        const isFuture = targetDate > getLocalDateString() || (targetDate === getLocalDateString() && initialPayload.startTime > nowMinutes);
        if (isFuture) {
          const schedulePayload: ExecutorPayload = {
            targetActionId: initialPayload.targetActionId,
            candidateActionIds: initialPayload.candidateActionIds,
            date: targetDate,
            startTime: initialPayload.startTime,
          };
          const missingFields = getMissingFields('schedule_action', schedulePayload);
          if (missingFields.length > 0) {
            setPendingExecutor({ kind: 'schedule_action', payload: schedulePayload, awaitingConfirmation: false });
            appendAssistant('Completar no futuro vira agendamento, mas ainda falta contexto.', 'warning');
            appendAssistant(buildMissingPrompt('schedule_action', missingFields, schedulePayload), 'warning');
            return;
          }

          setPendingExecutor({ kind: 'schedule_action', payload: schedulePayload, awaitingConfirmation: true });
          appendAssistant('Completar no futuro vira agendamento. Vou converter esse pedido.');
          appendAssistant(buildPreview('schedule_action', schedulePayload));
          return;
        }
      }
    }

    handleExecutorStart(detectedKind, initialPayload);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const pendingSelectionOptions = pendingExecutor?.awaitingConfirmation
    ? []
    : pendingExecutor?.payload.candidateActionIds?.length
      ? pendingExecutor.payload.candidateActionIds
        .map((id) => actions.find((action) => action.id === id))
        .filter((action): action is Action => !!action)
        .map((action, index) => ({ key: `${action.id}_${index}`, label: action.name }))
      : pendingExecutor?.payload.candidateArenaIds?.length
        ? pendingExecutor.payload.candidateArenaIds
          .map((id) => allArenas.find((arena) => arena.id === id))
          .filter((arena): arena is Arena => !!arena)
          .map((arena, index) => ({ key: `${arena.id}_${index}`, label: arena.name }))
        : [];

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-none items-center justify-between border-b border-white/5 bg-black/25 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)]">
            <EditIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--skin-accent-color)]">Acao</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-gray-500">Executor do core loop</div>
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
          direto
        </div>
      </div>

      <div className="flex-none border-b border-white/5 bg-black/15 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              onClick={() => {
                setInput(example);
                inputRef.current?.focus();
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-300 transition-colors hover:border-[var(--skin-accent-color)]/25 hover:text-white"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <div className="space-y-4">
          {messages.map((message) => {
            const toneClass = message.tone === 'success'
              ? 'border-emerald-400/18 bg-emerald-500/8 text-emerald-100'
              : message.tone === 'warning'
                ? 'border-amber-300/18 bg-amber-500/8 text-amber-100'
                : 'border-white/8 bg-white/[0.04] text-white/90';

            return (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-tr-sm border-white/8 bg-white/10 text-white'
                      : `rounded-tl-sm ${toneClass}`
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })}

          {isWorking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3 text-xs text-gray-400">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                </div>
                <span>Aplicando no app...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-none border-t border-white/10 bg-black/40 p-4">
        <div className="mb-3 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.18em] text-gray-500">
          <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5 text-gray-400">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>ciclo</span>
            </div>
            <div className="text-white/70">criar / editar prazo</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5 text-gray-400">
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>arena</span>
            </div>
            <div className="text-white/70">criar / editar</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
            <div className="mb-1 flex items-center gap-1.5 text-gray-400">
              <PlannerIcon className="h-3.5 w-3.5" />
              <span>dia</span>
            </div>
            <div className="text-white/70">planner + painel</div>
          </div>
        </div>

        <div className="relative flex items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Peca algo operacional. Ex.: criar arena Corrida em Corpo"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 transition-all focus:border-[var(--skin-accent-color)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--skin-accent-color)]/20"
          />
          <button
            onClick={() => void handleSendMessage()}
            disabled={!input.trim() || isWorking}
            className="absolute right-2 rounded-lg bg-white/10 p-2 text-[var(--skin-accent-color)] transition-colors hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>

        {pendingSelectionOptions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingSelectionOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => void handleSendMessage(option.label)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-300 transition-colors hover:border-[var(--skin-accent-color)]/25 hover:text-white"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {pendingExecutor?.awaitingConfirmation && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-gray-500">
              <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-300" />
              <span>aplique, ajuste no proprio texto ou cancele</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void handleSendMessage('pode')}
                disabled={isWorking}
                className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
              >
                Aplicar
              </button>
              <button
                onClick={() => void handleSendMessage('cancelar')}
                disabled={isWorking}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-300 transition-colors hover:bg-white/10 disabled:opacity-40"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
