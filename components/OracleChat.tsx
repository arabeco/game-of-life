import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { XIcon, SendIcon, SparklesIcon, ZapIcon, EyeIcon, CrownIcon, LightbulbIcon, CheckIcon, PlannerIcon, GameLogoIcon, MicIcon } from './Icons';
import { ORACLE_MODES } from '../constants/oracle';
import { Notification, OracleCategory, OracleMode, OraclePremiumHint, OracleResponseKind, OracleResponsePayload, OracleStructuredContext } from '../types';
import { Portal } from './Portal';
import { supabase } from '../supabaseClient';
import { buildActionPoolByDate } from '../utils/coreLoopUtils.js';
import { isTaskInPool } from '../utils/taskDomain.js';
import { hasPremiumAccess } from '../utils/premiumAccess';
import { getOracleFeedQuotaStatus } from '../utils/oracleFeedUtils';
import { buildOracleOperationalContext } from '../utils/oracleOperationalContext';
import { getNotificationBody, getNotificationTitle, getOracleChatNotificationsForProfile } from '../constants/oracleNotificationPolicy';
import { buildOracleConversationMemory } from '../utils/oracleConversationMemory';
import { APP_NAVIGATE_EVENT, type AppNavigatePayload } from '../utils/arenaAttention';
import { PLANNER_OPEN_ACTION_MODAL_EVENT } from '../utils/restScreenActionSession';
import { buildOracleCycleCoachBrief } from '../utils/oracleCoach';

type OracleTabTarget = 'chat' | 'requests';
interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: OracleMode;
  responseKind?: OracleResponseKind;
  structuredContext?: OracleStructuredContext | null;
  premiumHint?: OraclePremiumHint | null;
  originalInput?: string | null;
  feedId?: string;
  feedCategory?: OracleCategory;
  feedPresentation?: 'ambient_pulse' | 'info_card';
  feedSummary?: string;
  feedTrigger?: 'app_open' | 'cron' | 'manual';
  systemId?: string;
  quickActions?: ChatQuickAction[];
}

type ChatQuickAction =
  | { id: string; label: string; kind: 'send_prompt'; prompt: string }
  | { id: string; label: string; kind: 'open_planner_create_action' }
  | { id: string; label: string; kind: 'open_sitrep' }
  | { id: string; label: string; kind: 'open_planner' }
  | { id: string; label: string; kind: 'open_cycle' }
  | { id: string; label: string; kind: 'open_arenas' }
  | { id: string; label: string; kind: 'open_arena'; arenaId: string };

const normalizeOracleText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const detectRequestedInfoCardCategory = (rawInput: string): OracleCategory | null => {
  const normalized = normalizeOracleText(rawInput);
  const asksForContent = /\b(card|manda|mande|mostra|mostre|quero|traz|traga|puxa|puxe|conteudo)\b/.test(normalized);
  if (!asksForContent) return null;

  if (/\b(inspir|motivacional|frase)\b/.test(normalized)) return 'frases_inspiradoras';
  if (/\b(filosof|estoic|reflex)\b/.test(normalized)) return 'reflexoes_filosoficas';
  if (/\b(sabedoria|fragmento)\b/.test(normalized)) return 'fragmentos_sabedoria';
  if (/\b(ritual|dica de vida|estilo de vida|lifestyle)\b/.test(normalized)) return 'rituais_lifestyle';
  if (/\b(maestria|sussurro)\b/.test(normalized)) return 'sussurros_maestria';
  return null;
};

const readResponseBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.clone().json();
  } catch {
    try {
      return await response.clone().text();
    } catch {
      return null;
    }
  }
};

const parseOracleFunctionError = async (error: unknown): Promise<{ status: number | null; message: string; details: unknown }> => {
  const rawError = error as { message?: string; context?: Response };
  const response = rawError?.context;

  if (!response || typeof response.status !== 'number') {
    return {
      status: null,
      message: rawError?.message || 'Oracle function failed.',
      details: null,
    };
  }

  const details = await readResponseBody(response);
  let message = rawError?.message || `Oracle HTTP ${response.status}`;

  if (details && typeof details === 'object' && 'error' in details) {
    const errorMessage = (details as { error?: unknown }).error;
    if (typeof errorMessage === 'string' && errorMessage.trim()) {
      message = errorMessage;
    }
  }

  return {
    status: response.status,
    message,
    details,
  };
};

const dispatchAppView = (detail: AppNavigatePayload) => {
  window.dispatchEvent(new CustomEvent<AppNavigatePayload>(APP_NAVIGATE_EVENT, { detail }));
};
const MODE_VISUALS: Record<OracleMode, { icon: React.FC<{ className?: string }>, color: string, bg: string, border: string }> = {
    neutro: { 
        icon: GameLogoIcon, 
        color: "text-[var(--skin-accent-color)]", 
        bg: "bg-black/60", 
        border: "border-[var(--skin-accent-color)]/30" 
    },
    coach: { 
        icon: ZapIcon, 
        color: "text-yellow-400", 
        bg: "bg-yellow-900/20", 
        border: "border-yellow-500/30" 
    },
    calmo: { 
        icon: EyeIcon, 
        color: "text-blue-300", 
        bg: "bg-blue-900/20", 
        border: "border-blue-500/30" 
    },
    reflexivo: { 
        icon: LightbulbIcon, 
        color: "text-purple-300", 
        bg: "bg-purple-900/20", 
        border: "border-purple-500/30" 
    },
    tatico: { 
        icon: CheckIcon, 
        color: "text-green-400", 
        bg: "bg-green-900/20", 
        border: "border-green-500/30" 
    },
    estrategico: { 
        icon: PlannerIcon, 
        color: "text-indigo-400", 
        bg: "bg-indigo-900/20", 
        border: "border-indigo-500/30" 
    },
    personalizado: { 
        icon: CrownIcon, 
        color: "text-pink-400", 
        bg: "bg-pink-900/20", 
        border: "border-pink-500/30" 
    }
};

const ORACLE_CATEGORY_VISUALS: Record<OracleCategory, {
    label: string;
    accentClass: string;
    badgeClass: string;
    borderClass: string;
    bgClass: string;
}> = {
    frases_inspiradoras: {
        label: 'Carta inspiradora',
        accentClass: 'text-emerald-200',
        badgeClass: 'border-emerald-400/20 bg-emerald-400/12 text-emerald-200',
        borderClass: 'border-emerald-400/16',
        bgClass: 'bg-emerald-500/8',
    },
    reflexoes_filosoficas: {
        label: 'Reflexao filosofica',
        accentClass: 'text-sky-200',
        badgeClass: 'border-sky-400/20 bg-sky-400/12 text-sky-200',
        borderClass: 'border-sky-400/16',
        bgClass: 'bg-sky-500/8',
    },
    fragmentos_sabedoria: {
        label: 'Fragmento de sabedoria',
        accentClass: 'text-violet-200',
        badgeClass: 'border-violet-400/20 bg-violet-400/12 text-violet-200',
        borderClass: 'border-violet-400/16',
        bgClass: 'bg-violet-500/8',
    },
    dicas_produtividade: {
        label: 'Sinal de foco',
        accentClass: 'text-amber-100',
        badgeClass: 'border-amber-300/20 bg-amber-400/12 text-amber-100',
        borderClass: 'border-amber-300/18',
        bgClass: 'bg-amber-500/8',
    },
    rituais_lifestyle: {
        label: 'Dica de vida',
        accentClass: 'text-lime-100',
        badgeClass: 'border-lime-300/20 bg-lime-400/12 text-lime-100',
        borderClass: 'border-lime-300/16',
        bgClass: 'bg-lime-500/8',
    },
    provocacoes: {
        label: 'Sinal de alerta',
        accentClass: 'text-rose-100',
        badgeClass: 'border-rose-300/20 bg-rose-400/12 text-rose-100',
        borderClass: 'border-rose-300/18',
        bgClass: 'bg-rose-500/8',
    },
    sussurros_maestria: {
        label: 'Sussurro de maestria',
        accentClass: 'text-fuchsia-100',
        badgeClass: 'border-fuchsia-300/20 bg-fuchsia-400/12 text-fuchsia-100',
        borderClass: 'border-fuchsia-300/16',
        bgClass: 'bg-fuchsia-500/8',
    },
    analise_padroes: {
        label: 'Leitura de ritmo',
        accentClass: 'text-cyan-100',
        badgeClass: 'border-cyan-300/20 bg-cyan-400/12 text-cyan-100',
        borderClass: 'border-cyan-300/18',
        bgClass: 'bg-cyan-500/8',
    },
};

const resolveFeedPresentation = (
    _category?: OracleCategory,
    snapshot?: { presentation?: 'ambient_pulse' | 'info_card' | null } | null,
): 'ambient_pulse' | 'info_card' => {
    if (snapshot?.presentation === 'ambient_pulse' || snapshot?.presentation === 'info_card') {
        return snapshot.presentation;
    }
    return 'ambient_pulse';
};

const buildNotificationSignalMessage = (notification: Notification, oracleMode: OracleMode): Message => {
  const title = getNotificationTitle(notification);
  const body = getNotificationBody(notification, oracleMode);
  const content = title === body ? body : `${title}\n${body}`;

  return {
    role: 'assistant',
    content,
    timestamp: new Date(notification.createdAt),
    mode: oracleMode,
    feedId: `notification:${notification.id}`,
    feedCategory: 'analise_padroes',
    feedPresentation: 'info_card',
    feedSummary: 'Sinal do Oraculo',
    feedTrigger: 'app_open',
  };
};

const buildVoicePreview = (transcript: string) => {
  const normalized = normalizeOracleText(transcript);
  const soundsOperational = /\b(criar|cria|editar|edita|ajustar|ajusta|agendar|agenda|programar|organizar|organiza|completei|concluir|conclui|marcar|marca)\b/.test(normalized);
  if (soundsOperational) {
    return `Entendi isso: "${transcript}". Envie e eu ajudo voce a decidir o melhor caminho no app.`;
  }
  return `Entendi isso: "${transcript}". Isso parece conversa. Se estiver certo, envie e eu sigo daqui.`;
};

export const OracleChat: React.FC<{ onClose: () => void; hideHeader?: boolean; isEmbedded?: boolean; onNavigateTab?: (tab: OracleTabTarget) => void }> = ({ onClose, hideHeader = false, isEmbedded = false }) => {
  const { userProfile, assets, actions, tasks, taskPool, activeCycle, dailyCommitment, cycleProgress, oraclePreferences, oracleMessages, notifications, requestOracleContentCard } = useGame();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechAvailable, setIsSpeechAvailable] = useState(false);
  const isInitialLoadRef = useRef(true);
  const firstConversationNotice = 'Aviso: o Oráculo usa IA externa. Evite compartilhar dados sensíveis nas conversas.';
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<any>(null);
  const sendMessageRef = useRef<(overrideInput?: string) => void>(() => {});

  const [currentMode, setCurrentMode] = useState<OracleMode>(oraclePreferences?.activeMode || 'neutro');
  const isPremiumUser = useMemo(() => hasPremiumAccess(userProfile), [userProfile]);
  const oracleFeedStatus = useMemo(
    () => getOracleFeedQuotaStatus(
      oracleMessages,
      oraclePreferences,
      new Date(),
      userProfile.appMode === 'BASIC' ? 'BASIC' : 'GAME',
    ),
    [oracleMessages, oraclePreferences, userProfile.appMode],
  );
  const oracleSignalNotifications = useMemo(
    () => getOracleChatNotificationsForProfile(notifications, userProfile.appMode === 'BASIC' ? 'BASIC' : 'GAME', currentMode),
    [currentMode, notifications, userProfile.appMode],
  );

  const availableTaskPool = useMemo(() => buildActionPoolByDate(actions, taskPool, tasks, null), [actions, taskPool, tasks]);
  const bayAreaTasks = useMemo(() => tasks.filter(isTaskInPool), [tasks]);
  const bayAreaVisibleCount = useMemo(() => {
    const unified = { ...availableTaskPool };

    bayAreaTasks.forEach((task) => {
      if (!unified[task.actionId]) {
        unified[task.actionId] = { count: 0, isUnlimited: false, taskIds: [] };
      }

      if (!unified[task.actionId].taskIds) {
        unified[task.actionId].taskIds = [];
      }

      unified[task.actionId].taskIds.push(task.id);
    });

    return Object.values(unified).filter((payload: any) => payload.count > 0 || ((payload.taskIds?.length || 0) > 0)).length;
  }, [availableTaskPool, bayAreaTasks]);
  const starterMessageInjectedRef = useRef(false);

  const openPlannerCreateAction = useCallback(() => {
    dispatchAppView({ view: 'planner' });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(PLANNER_OPEN_ACTION_MODAL_EVENT, {
        detail: { createNew: true },
      }));
    }, 220);
  }, []);

  const openPlannerSitrep = useCallback(() => {
    dispatchAppView({ view: 'planner', openSitrep: true });
  }, []);

  const openCycleReview = useCallback(() => {
    window.dispatchEvent(new CustomEvent('tutorialNavigate', {
      detail: {
        view: 'planner',
        showReports: true,
      },
    }));
  }, []);

  const openArenasView = useCallback(() => {
    dispatchAppView({ view: 'arenas' });
  }, []);

  const openPlannerView = useCallback(() => {
    dispatchAppView({ view: 'planner' });
  }, []);

  const openArena = useCallback((arenaId: string) => {
    window.dispatchEvent(new CustomEvent('tutorialNavigate', {
      detail: { view: 'arenas', showArenaId: arenaId },
    }));
  }, []);

  const operationalContext = useMemo(() => buildOracleOperationalContext({
    now: new Date(),
    assets,
    actions,
    tasks,
    activeCycle,
    dailyCommitment,
    dailyProofStreak: userProfile.dailyProofStreak || null,
    cycleProgress,
    activeMode: currentMode,
    customModeInstructions: oraclePreferences?.customModeInstructions || null,
    enabledCategories: oraclePreferences?.enabledCategories || [],
    username: userProfile.nickname || 'Viajante',
    level: userProfile.level || 1,
    clanName: null,
    seasonName: null,
    pendingChests: userProfile.chests?.reduce((acc, chest) => acc + (chest.count || 0), 0) || 0,
  }), [activeCycle, actions, assets, currentMode, cycleProgress, dailyCommitment, oraclePreferences, tasks, userProfile]);

  const contextualStarter = useMemo(() => {
    return buildOracleCycleCoachBrief(operationalContext);
  }, [operationalContext]);

  // Update mode when preferences change
  useEffect(() => {
    if (oraclePreferences?.activeMode) {
      setCurrentMode(oraclePreferences.activeMode);
    }
  }, [oraclePreferences?.activeMode]);

  // Load recent Oracle pulses without overriding the chosen preference mode.
  useEffect(() => {
    const recentFeedCards = (oracleMessages || [])
      .filter((message) => message.deliveryType === 'feed')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (recentFeedCards.length === 0) {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
      return;
    }

    const feedCards: Message[] = recentFeedCards.slice(-4).map((feedMessage) => ({
      role: 'assistant',
      content: feedMessage.content,
      timestamp: new Date(feedMessage.createdAt),
      mode: feedMessage.mode,
      feedId: feedMessage.id,
      feedCategory: feedMessage.category,
      feedPresentation: resolveFeedPresentation(feedMessage.category, feedMessage.contextSnapshot),
      feedSummary: feedMessage.contextSnapshot?.summary || feedMessage.contextSnapshot?.categoryLabel || undefined,
      feedTrigger: feedMessage.contextSnapshot?.triggerType,
    }));

    setMessages((previous) => {
      if (isInitialLoadRef.current) {
        return feedCards;
      }

      const preservedMessages = previous.filter((message) => !(message.feedId && !message.feedId.startsWith('notification:')));
      const mergedMessages = [...preservedMessages];

      feedCards.forEach((feedCard) => {
        if (!mergedMessages.some((message) => message.feedId === feedCard.feedId)) {
          mergedMessages.push(feedCard);
        }
      });

      mergedMessages.sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
      return mergedMessages;
    });
    isInitialLoadRef.current = false;
  }, [oracleMessages]);

  useEffect(() => {
    if (oracleSignalNotifications.length === 0) return;

    const signalMessages = [...oracleSignalNotifications]
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
      .map((notification): Message => buildNotificationSignalMessage(notification, currentMode));

    setMessages((previous) => {
      const withoutOldSignals = previous.filter((message) => !(message.feedId && message.feedId.startsWith('notification:')));
      const nextMessages = [...withoutOldSignals];

      signalMessages.forEach((message) => {
        if (!nextMessages.some((entry) => entry.feedId === message.feedId)) {
          nextMessages.push(message);
        }
      });

      nextMessages.sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
      return nextMessages;
    });
  }, [currentMode, oracleSignalNotifications]);

  useEffect(() => {
    if (isInitialLoadRef.current || starterMessageInjectedRef.current) return;

    const hasStarter = messages.some((message) => message.systemId === 'oracle:starter');
    const hasConversation = messages.some((message) => !message.feedId && message.role === 'user');
    if (hasStarter || hasConversation) {
      starterMessageInjectedRef.current = true;
      return;
    }

    setMessages((previous) => {
      if (previous.some((message) => message.systemId === 'oracle:starter')) {
        return previous;
      }
      return [
        ...previous,
        {
          role: 'assistant',
          content: contextualStarter.content,
          timestamp: new Date(),
          mode: currentMode,
          systemId: 'oracle:starter',
          quickActions: contextualStarter.quickActions,
        },
      ];
    });
    starterMessageInjectedRef.current = true;
  }, [contextualStarter, currentMode, messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    // Only focus if NOT embedded to avoid keyboard popping up on mobile feed open
    if (!isEmbedded) {
        inputRef.current?.focus();
    }
  }, [isEmbedded]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechAvailable(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Nao consegui captar audio agora. Tente novamente.', timestamp: new Date(), mode: currentMode }]);
    };
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      setInput(transcript);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: buildVoicePreview(transcript),
        timestamp: new Date(),
        mode: currentMode,
      }]);
    };

    speechRef.current = recognition;
    setIsSpeechAvailable(true);

    return () => {
      try {
        recognition.abort?.();
      } catch {
        // noop
      }
    };
  }, [currentMode]);

  // Build System Prompt based on Mode
  const systemPrompt = useMemo(() => {
    const config = ORACLE_MODES[currentMode];
    return config.systemPromptTemplate(operationalContext);
  }, [currentMode, operationalContext]);

  const buildRecoveryFastPath = useCallback((rawInput: string): string | null => {
    const normalized = rawInput
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    const soundsExhausted = /exaust|esgotad|sobrecarregad|cansad|sem energia|no limite|destru[ií]d/.test(normalized);
    const mentionsTomorrow = /amanh/.test(normalized);

    if (!soundsExhausted || !mentionsTomorrow) {
      return null;
    }

    const now = new Date();
    const hourLabel = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const todayStr = now.toISOString().split('T')[0];

    const mentalAssetName = assets.find((asset) => {
      const assetLabel = `${asset.id} ${asset.name}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      return assetLabel.includes('espaco mental') || assetLabel.includes('mental');
    })?.name || 'Espaço Mental';

    const pendingToday = tasks.filter((task) => {
      if (!task.date || task.completed) return false;
      return task.date.split('T')[0] === todayStr;
    }).length;

    const bayLine = bayAreaVisibleCount > 0
      ? bayAreaVisibleCount + ' ação' + (bayAreaVisibleCount === 1 ? '' : 'es') + ' em espera'
      : 'estoque de ações limpo';

    const pendingLine = pendingToday > 0
      ? `${pendingToday} pendência${pendingToday === 1 ? '' : 's'} hoje`
      : 'nenhuma pendência hoje';

    const cycleLine = !activeCycle
      ? 'Sem ciclo ativo no momento.'
      : cycleProgress >= 70
        ? `Seu ciclo está em bom ritmo (${cycleProgress}%).`
        : cycleProgress >= 40
          ? `Seu ciclo está em ritmo médio (${cycleProgress}%).`
          : `Seu ciclo pede contenção (${cycleProgress}%).`;

    return `${mentalAssetName} pedindo contenção às ${hourLabel}. Vejo ${bayLine} e ${pendingLine}. ${cycleLine} Amanhã, preserve só 1 missão crítica e encaixe 30 min de Tela de Descanso antes de reacelerar.`;
  }, [activeCycle, assets, bayAreaVisibleCount, cycleProgress, tasks]);

  const handleCommand = async (cmd: string): Promise<string | null> => {
    const lowerCmd = cmd.toLowerCase().trim();

    if (lowerCmd.startsWith('!criar-arena')) {
      return 'Eu nao crio arenas pelo chat. Abra Arenas e toque no +; se quiser, eu posso ajudar voce a decidir o nome, a prioridade e o que vale acompanhar.';
    }

    if (lowerCmd.startsWith('!criar-acao')) {
      return 'Eu nao crio acoes pelo chat. Abra a arena, toque no + e use o formulario direto; posso ajudar a escolher uma meta realista antes disso.';
    }
    
    // Help Command
    if (lowerCmd === '?ajuda' || lowerCmd === '?help') {
        return "**Como eu posso ajudar**\n\nPergunte sobre seu ciclo, suas arenas ou o que fazer hoje. Eu leio o progresso, aponto riscos e ajudo voce a decidir. Para criar ou editar algo, use os botoes do proprio app.";
    }

    // Explanation Commands (?)
    if (lowerCmd === '?arenas') {
        return "**Sobre as arenas**\n\nAs cinco áreas organizam sua vida. Dentro delas, cada arena representa algo concreto que você quer cuidar, como academia, faculdade ou família. Abra uma área e toque no + para criar uma arena.";
    }

    // List Commands (!)
    if (lowerCmd === '!arenas') {
        const arenaList = assets.flatMap(a => a.arenas.map(ar => ({ name: ar.name, id: ar.id, asset: a.name })));
        if (arenaList.length === 0) {
            return "?? **Suas Arenas**\n\nVocê ainda não possui Arenas ativas. Vá até o Inventário para criar sua primeira Arena.";
        }
        return `?? **Suas Arenas Ativas**\n\n${arenaList.map(a => `• **${a.name}** (ID: \`${a.id.slice(0,8)}\`) - Categoria: ${a.asset}`).join('\n')}`;
    }

    if (lowerCmd === '!assets') {
        if (assets.length === 0) return "Áreas não encontradas.";
        return `**Suas áreas**\n\n${assets.filter((asset) => asset.id !== 'geral').map(a => `• **${a.name}**`).join('\n')}`;
    }

    return null;
  };

  const handleSendMessage = async (overrideInput?: string) => {
    const nextInput = (overrideInput ?? input).trim();
    if (!nextInput || isLoading) return;

    const userMessage: Message = { role: 'user', content: nextInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const requestedInfoCategory = detectRequestedInfoCardCategory(nextInput);
    if (requestedInfoCategory) {
      try {
        const result = await requestOracleContentCard(requestedInfoCategory);
        if (result?.status === 'generated' && result.message) {
          setMessages((previous) => [
            ...previous,
            {
              role: 'assistant',
              content: result.message!.content,
              timestamp: new Date(result.message!.createdAt),
              mode: result.message!.mode,
              feedId: result.message!.id,
              feedCategory: result.message!.category,
              feedPresentation: resolveFeedPresentation(result.message!.category, result.message!.contextSnapshot),
              feedSummary: result.message!.contextSnapshot?.categoryLabel || 'Card de conteudo',
              feedTrigger: 'manual',
            },
          ]);
        } else {
          const statusText = result?.status === 'premium_required'
            ? 'Esses cards fazem parte do Premium.'
            : result?.status === 'daily_limit'
              ? 'Esse tema ja foi entregue hoje, ou os cinco temas do dia ja foram usados.'
              : 'Nao consegui entregar esse card agora.';
          setMessages((previous) => [...previous, {
            role: 'assistant',
            content: statusText,
            timestamp: new Date(),
            mode: currentMode,
          }]);
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (nextInput.startsWith('?') || nextInput.startsWith('!')) {
        const commandResponse = await handleCommand(nextInput);
        if (commandResponse) {
             setTimeout(() => {
                 setMessages(prev => [...prev, { role: 'assistant', content: commandResponse, timestamp: new Date() }]);
                 setIsLoading(false);
             }, 600);
             return;
        }
    }

    const recoveryFastPath = buildRecoveryFastPath(nextInput);
    if (recoveryFastPath) {
      window.setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: recoveryFastPath,
          timestamp: new Date(),
          mode: currentMode,
        }]);
        setIsLoading(false);
      }, 850);
      return;
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (sessionError || !accessToken) {
        throw new Error('Sessao autenticada ausente para consultar o Oraculo.');
      }

      const memory = buildOracleConversationMemory(
        [...messages, userMessage].filter((message) => !message.feedId && message.content.trim().length > 0).map((message) => ({
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
        })),
        {},
      );

      const { data, error } = await supabase.functions.invoke('oracle', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          text: userMessage.content,
          channel: 'chat',
          isPremium: isPremiumUser,
          mode: currentMode,
          memory,
        }
      });

      if (error) {
        throw error;
      }

      const payload = data as OracleResponsePayload | null;
      const text = String(payload?.message || '').trim();
      if (!payload || !text) {
        throw new Error('Oracle function returned empty content.');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: text,
        timestamp: new Date(),
        mode: currentMode,
        responseKind: payload.kind,
        structuredContext: payload.structuredContext,
        premiumHint: payload.premiumHint || null,
        originalInput: userMessage.content,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const parsedError = await parseOracleFunctionError(error);
      console.error('Oracle Error:', parsedError, error);

      let fallbackMessage = 'O Oraculo esta em silencio momentaneo. Tente novamente.';
      if (parsedError.status === 401) fallbackMessage = 'Sessao expirada no Oraculo. Entre novamente na conta e tente de novo.';
      if (parsedError.status === 403) fallbackMessage = 'Oraculo bloqueado para esta origem. Verifique o dominio liberado no Supabase.';
      if (parsedError.status === 500) fallbackMessage = 'Oraculo indisponivel: configuracao ausente no servidor.';
      if (parsedError.status === 502) fallbackMessage = 'Oraculo indisponivel no provedor de IA. Tente novamente em instantes.';

      setMessages(prev => [...prev, { role: 'assistant', content: fallbackMessage, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickAction = useCallback((action: ChatQuickAction) => {
    switch (action.kind) {
      case 'send_prompt':
        handleSendMessage(action.prompt);
        return;
      case 'open_planner_create_action':
        openPlannerCreateAction();
        onClose();
        return;
      case 'open_sitrep':
        openPlannerSitrep();
        onClose();
        return;
      case 'open_planner':
        openPlannerView();
        onClose();
        return;
      case 'open_cycle':
        openCycleReview();
        onClose();
        return;
      case 'open_arenas':
        openArenasView();
        onClose();
        return;
      case 'open_arena':
        openArena(action.arenaId);
        onClose();
        return;
      default:
        return;
    }
  }, [onClose, openArena, openArenasView, openCycleReview, openPlannerCreateAction, openPlannerSitrep, openPlannerView]);

  const formatCooldownLabel = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'agora';

    const totalMinutes = Math.max(1, Math.ceil(milliseconds / 60000));
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
  };

  const buildManualCardStatusMessage = (status: string, cooldownMs?: number | null): string | null => {
    switch (status) {
      case 'premium_required':
        return 'Gerar card manual fica liberado apenas no Premium.';
      case 'disabled':
        return 'Ative a IA do Oráculo para gerar cards informativos no chat.';
      case 'daily_limit':
        return `Os temas de hoje ja foram entregues (${oracleFeedStatus.combinedSentToday}/${oracleFeedStatus.dailyLimit}). Amanhã cada tema fica disponivel novamente.`;
      case 'cooldown':
        return `Novo card manual em ${formatCooldownLabel(cooldownMs || 0)}.`;
      case 'error':
        return 'Nao consegui gerar o card agora. Tente novamente em instantes.';
      default:
        return null;
    }
  };

  const handleGenerateCard = async () => {
    if (isGeneratingCard || isLoading) return;

    setIsGeneratingCard(true);
    try {
      const result = await requestOracleContentCard();
      if (result?.status === 'generated' && result.message) {
        setMessages((previous) => {
          if (previous.some((message) => message.feedId === result.message?.id)) {
            return previous;
          }

          return [
            ...previous,
            {
              role: 'assistant',
              content: result.message.content,
              timestamp: new Date(result.message.createdAt),
              mode: result.message.mode,
              feedId: result.message.id,
              feedCategory: result.message.category,
              feedPresentation: resolveFeedPresentation(result.message.category, result.message.contextSnapshot),
              feedSummary: result.message.contextSnapshot?.summary || result.message.contextSnapshot?.categoryLabel || 'Card manual do chat',
              feedTrigger: result.message.contextSnapshot?.triggerType,
            },
          ];
        });
      } else {
        const statusMessage = buildManualCardStatusMessage(result?.status || 'error', result?.cooldownMs);
        if (statusMessage) {
          setMessages((previous) => [
            ...previous,
            {
              role: 'assistant',
              content: statusMessage,
              timestamp: new Date(),
              mode: currentMode,
            },
          ]);
        }
      }
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const manualGenerateDisabled = isGeneratingCard || isLoading;
  const selectedThemeCount = oraclePreferences?.enabledCategories?.length || 0;
  const manualQuotaLabel = `${oracleFeedStatus.combinedSentToday}/${oracleFeedStatus.dailyLimit}`;
  const manualGenerateLabel = !isPremiumUser
    ? 'Premium'
    : isGeneratingCard
      ? 'Gerando...'
      : 'Card do Oraculo';
  const selectedThemeLabel = selectedThemeCount === 1 ? '1 tema marcado' : `${selectedThemeCount} temas marcados`;
  const oracleInputHint = selectedThemeCount > 0
    ? `Premium: um card por tema ao dia, ate 5 no total. Pedir agora consome a vaga de um dos seus ${selectedThemeLabel}.`
    : 'Premium: escolha temas para receber ate 5 cards por dia.';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  sendMessageRef.current = (overrideInput?: string) => handleSendMessage(overrideInput);

  const handleVoiceToggle = () => {
    if (!isSpeechAvailable) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Comando de voz indisponivel neste navegador/app.', timestamp: new Date(), mode: currentMode }]);
      return;
    }

    if (isListening) {
      try {
        speechRef.current?.stop?.();
      } catch {
        // noop
      }
      return;
    }

    try {
      speechRef.current?.start?.();
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Nao consegui iniciar o microfone agora.', timestamp: new Date(), mode: currentMode }]);
    }
  };

  const HeaderIcon = MODE_VISUALS[currentMode].icon || GameLogoIcon;
  
  // Custom header for Embedded mode (since default header might be hidden)
  // If isEmbedded is true, we render a smaller status bar inside the chat area if header is hidden
  const showStatusPill = isEmbedded || hideHeader;

  const content = (
      <>
        {/* Main Header (Only if NOT hidden) */}
        {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${MODE_VISUALS[currentMode].border} ${MODE_VISUALS[currentMode].bg} shadow-lg`}>
               <HeaderIcon className={`w-6 h-6 ${MODE_VISUALS[currentMode].color}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--skin-accent-color)] tracking-wider">ORÁCULO</h3>
              <div className="flex flex-col">
                  <span className={`text-[10px] uppercase tracking-widest text-gray-400`}>{ORACLE_MODES[currentMode].name}</span>
                  <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Online</span>
                  </div>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        )}

        {/* Embedded Status Bar (If header is hidden) */}
        {showStatusPill && (
            <div className="flex-none px-4 py-2 bg-black/20 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)] animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Modo: <span className={`${MODE_VISUALS[currentMode].color}`}>{ORACLE_MODES[currentMode].name}</span>
                    </span>
                 </div>
                 {isEmbedded && (
                     <div className="flex items-center gap-1 text-[9px] text-gray-600">
                         <HeaderIcon className={`w-3 h-3 ${MODE_VISUALS[currentMode].color}`} />
                         <span>v2.0</span>
                     </div>
                 )}
            </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="flex min-h-full flex-col items-center justify-center p-6 text-center">
              <div className="mb-5 max-w-[300px] rounded-2xl rounded-tl-sm border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-left text-[11px] italic leading-relaxed text-amber-100/75 shadow-inner">
                {firstConversationNotice}
              </div>
              <div className="opacity-50">
              <HeaderIcon className={`w-16 h-16 mb-4 ${MODE_VISUALS[currentMode].color} drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]`} />
              <p className="text-sm text-gray-400 font-bold">O Oráculo aguarda sua consulta, Soberano.</p>
              <p className="text-xs text-gray-600 mt-2 max-w-[200px]">Modo atual: {ORACLE_MODES[currentMode].description}</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => {
             const msgMode = msg.role === 'assistant' ? (msg.mode || 'neutro') : 'neutro';
             const visuals = MODE_VISUALS[msgMode];
             const ModeIcon = visuals.icon;
             const isFeedCard = msg.role === 'assistant' && Boolean(msg.feedId);
             const feedCategory = msg.feedCategory || 'frases_inspiradoras';
             const feedPresentation = msg.feedPresentation || 'ambient_pulse';
             const feedVisual = ORACLE_CATEGORY_VISUALS[feedCategory];
             const feedTriggerLabel = msg.feedTrigger === 'manual' ? 'manual' : 'auto';

             return (
            <div 
              key={idx} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-4`}
            >
              {msg.role === 'assistant' && (
                 <div className="flex items-center gap-2 mb-1 ml-1">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${visuals.bg} border ${visuals.border}`}>
                        <ModeIcon className={`w-2.5 h-2.5 ${visuals.color}`} />
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest ${visuals.color}`}>
                        {ORACLE_MODES[msgMode].name}
                    </span>
                 </div>
              )}
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-white/5 bg-white/10 p-3 text-sm leading-relaxed text-white">
                  {msg.content}
                </div>
              ) : isFeedCard ? (
                <div
                  className={`max-w-[92%] rounded-[22px] border p-4 text-sm leading-relaxed shadow-[0_14px_34px_rgba(0,0,0,0.24)] ${
                    feedPresentation === 'info_card'
                      ? `${feedVisual.borderClass} ${feedVisual.bgClass}`
                      : `${feedVisual.borderClass} ${feedVisual.bgClass}`
                  }`}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${feedVisual.badgeClass}`}>
                      {feedVisual.label}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
                      {feedTriggerLabel}
                    </span>
                    {msg.feedSummary && (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/36">
                        {msg.feedSummary}
                      </span>
                    )}
                  </div>
                  <div className={`whitespace-pre-line ${feedVisual.accentClass} ${feedPresentation === 'info_card' ? 'font-medium text-[14px]' : 'text-white/88'}`}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div 
                  className={`
                    max-w-[85%] whitespace-pre-line p-3 rounded-2xl text-sm leading-relaxed
                    ${visuals.bg} ${visuals.color.replace('text-', 'text-white/90 ')} rounded-tl-sm border ${visuals.border} shadow-inner
                  `}
                >
                  {msg.content}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-white/80">
                      {msg.quickActions.map((action, actionIndex) => (
                        <React.Fragment key={action.id}>
                          {actionIndex > 0 ? <span className="text-white/25"> · </span> : null}
                          <button
                            type="button"
                            onClick={() => runQuickAction(action)}
                            className="inline p-0 font-semibold text-[var(--skin-accent-color)] underline decoration-[var(--skin-accent-color)]/45 underline-offset-4 transition-colors hover:text-white"
                          >
                            {action.label}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  {msg.premiumHint && !isPremiumUser && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] leading-relaxed text-white/72">
                      <span className="font-black uppercase tracking-[0.14em] text-[var(--skin-accent-color)]">{msg.premiumHint.label}</span>
                      <div className="mt-1">{msg.premiumHint.message}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )})}
          
          {isLoading && (
            <div className="flex justify-start">
                <div className="bg-black/40 text-gray-300 rounded-tl-sm border border-white/5 shadow-inner p-3 rounded-2xl flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-xs text-gray-500 animate-pulse ml-1">
                    {["Consultando os astros...", "Ouvindo os sussurros...", "Decifrando o destino...", "Conectando ao éter..."][Math.floor(Math.random() * 4)]}
                  </span>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <button
                onClick={handleGenerateCard}
                disabled={manualGenerateDisabled}
                className={`group relative flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                  manualGenerateDisabled
                    ? 'cursor-not-allowed border-white/10 bg-white/5 text-gray-500'
                    : 'border-[var(--skin-accent-color)]/30 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0.03)_45%,rgba(6,9,14,0.94)_100%)] text-[var(--skin-accent-color)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_28px_rgba(0,0,0,0.22),0_0_28px_rgba(255,255,255,0.04)] hover:border-[var(--skin-accent-color)]/45 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_12px_30px_rgba(0,0,0,0.24),0_0_34px_rgba(255,255,255,0.06)]'
                }`}
                title={oracleInputHint}
                aria-label={`${manualGenerateLabel}. ${manualQuotaLabel} hoje.`}
              >
                {!isPremiumUser ? <CrownIcon className="h-4.5 w-4.5" /> : <GameLogoIcon className="h-6 w-6 transition-transform group-hover:scale-105" />}
              </button>
              <div className={`pointer-events-none absolute -right-1 -top-1 rounded-full border px-1.5 py-0.5 text-[8px] font-black tracking-[0.12em] ${
                manualGenerateDisabled
                  ? 'border-white/10 bg-black text-gray-500'
                  : 'border-[var(--skin-accent-color)]/25 bg-black text-[var(--skin-accent-color)]'
              }`}>
                {manualQuotaLabel}
              </div>
            </div>
            {/* Free-form chat removed: it called the model for every user with no
                premium gate, so its cost grew with signups rather than revenue. The
                Oracle now speaks through cards and contextual lines only. */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-[color:var(--ui-card-text)]">{manualGenerateLabel}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-[color:var(--ui-card-text-soft)]">{oracleInputHint}</p>
            </div>
          </div>
        </div>
      </>
  );

  if (isEmbedded) {
      return (
        <div className="flex flex-col h-full w-full">
          {content}
        </div>
      );
  }

  return (
    <Portal>
        <>
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 pointer-events-none">
            {/* Backdrop for mobile mostly, but let's keep it clickable through except the chat */}
            <div className="absolute inset-0 bg-transparent" onClick={onClose} />
            
            <div className="pointer-events-auto w-full max-w-sm mt-16 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh] animate-in slide-in-from-top-5 fade-in duration-300">
                {content}
            </div>
        </div>
        </>
    </Portal>
  );
};






