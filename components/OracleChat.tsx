import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import { XIcon, SparklesIcon, ZapIcon, EyeIcon, CrownIcon, LightbulbIcon, GameLogoIcon } from './Icons';
import { ORACLE_FREE_TONE, ORACLE_TONE_LABELS, type OracleSpeechTone } from '../constants/oracleSpeechLibrary';
import { Notification, OracleCategory, OracleMode, OraclePremiumHint, OracleResponseKind, OracleStructuredContext } from '../types';
import { Portal } from './Portal';
import { buildActionPoolByDate } from '../utils/coreLoopUtils.js';
import { isTaskInPool } from '../utils/taskDomain.js';
import { hasPremiumAccess } from '../utils/premiumAccess';
import { getOracleFeedQuotaStatus } from '../utils/oracleFeedUtils';
import { buildOracleOperationalContext } from '../utils/oracleOperationalContext';
import { getNotificationBody, getNotificationTitle, getOracleChatNotificationsForProfile } from '../constants/oracleNotificationPolicy';
import { APP_NAVIGATE_EVENT, type AppNavigatePayload } from '../utils/arenaAttention';
import { PLANNER_OPEN_ACTION_MODAL_EVENT } from '../utils/restScreenActionSession';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { buildOracleCycleCoachBrief } from '../utils/oracleCoach';
import { emitOracleSpeech } from '../utils/oracleSpeech';
import { ArenaPactBalloon, ArenaPactProposal } from './ArenaPactBalloon';

type OracleTabTarget = 'chat' | 'requests';
// Marca a leitura pedida a mao: uma so por vez na lista, e nunca vai para o banco.
const READING_FEED_ID = 'reading:now';

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
  feedPurpose?: string;
  feedTrigger?: 'app_open' | 'cron' | 'manual';
  systemId?: string;
  quickActions?: ChatQuickAction[];
}

type ChatQuickAction =
  | { id: string; label: string; kind: 'open_planner_create_action' }
  | { id: string; label: string; kind: 'open_daily_panel' }
  | { id: string; label: string; kind: 'open_planner' }
  | { id: string; label: string; kind: 'open_cycle' }
  | { id: string; label: string; kind: 'open_arenas' }
  | { id: string; label: string; kind: 'open_arena'; arenaId: string };





/**
 * Quando a fala aconteceu.
 *
 * Hoje mostra so a hora; de outro dia mostra dia/mes junto. Carimbar "26/08" numa
 * mensagem de dez minutos atras e ruido — a data so informa quando ela deixa de
 * ser obvia.
 */
const formatFeedMoment = (moment: Date): string => {
  const agora = new Date();
  const mesmoDia = moment.getDate() === agora.getDate()
    && moment.getMonth() === agora.getMonth()
    && moment.getFullYear() === agora.getFullYear();
  const hora = moment.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (mesmoDia) return hora;
  const dia = moment.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${dia} ${hora}`;
};

const dispatchAppView = (detail: AppNavigatePayload) => {
  window.dispatchEvent(new CustomEvent<AppNavigatePayload>(APP_NAVIGATE_EVENT, { detail }));
};
// Mensagens salvas antes da troca ainda carregam modos que sairam
// (tatico, estrategico, personalizado): caem no tom gratuito.
const resolveTone = (mode: string | null | undefined): OracleSpeechTone =>
    mode && mode in ORACLE_TONE_LABELS ? (mode as OracleSpeechTone) : ORACLE_FREE_TONE;

const MODE_VISUALS: Record<OracleSpeechTone, { icon: React.FC<{ className?: string }>, color: string, bg: string, border: string }> = {
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
    feedSummary: 'Sinal do Oráculo',
    feedTrigger: 'app_open',
  };
};


export const OracleChat: React.FC<{ onClose: () => void; hideHeader?: boolean; isEmbedded?: boolean; onNavigateTab?: (tab: OracleTabTarget) => void }> = ({ onClose, hideHeader = false, isEmbedded = false }) => {
  const { userProfile, assets, actions, tasks, taskPool, activeCycle, dailyCommitment, cycleProgress, oraclePreferences, oracleMessages, notifications, requestOracleContentCard, activeArenaPact, arenaPactProgress, arenaPactCandidates, missaoIndividualDisponivel, missaoDeSistemaAtiva, showToast } = useGame();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const isInitialLoadRef = useRef(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentMode, setCurrentMode] = useState<OracleSpeechTone>(oraclePreferences?.speechTone || ORACLE_FREE_TONE);
  const isPremiumUser = useMemo(() => hasPremiumAccess(userProfile), [userProfile]);
  const oracleFeedStatus = useMemo(
    () => getOracleFeedQuotaStatus(
      oracleMessages,
      oraclePreferences,
      new Date(),
    ),
    [oracleMessages, oraclePreferences],
  );
  const oracleSignalNotifications = useMemo(
    () => getOracleChatNotificationsForProfile(notifications, currentMode),
    [currentMode, notifications],
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

  const openPlannerCreateAction = useCallback(() => {
    dispatchAppView({ view: 'planner' });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(PLANNER_OPEN_ACTION_MODAL_EVENT, {
        detail: { createNew: true },
      }));
    }, 220);
  }, []);

  const openPlannerDailyPanel = useCallback(() => {
    dispatchAppView({ view: 'planner', openDailyPanel: true });
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
    activeArenaPact,
    arenaPactProgress,
  }), [activeArenaPact, arenaPactProgress, activeCycle, actions, assets, currentMode, cycleProgress, dailyCommitment, oraclePreferences, tasks, userProfile]);


  // Update mode when preferences change
  useEffect(() => {
    if (oraclePreferences?.speechTone) {
      setCurrentMode(oraclePreferences.speechTone);
    }
  }, [oraclePreferences?.speechTone]);

  // Load recent Oracle pulses without overriding the chosen preference mode.
  useEffect(() => {
    // Card de infos ('feed') e fala do Oraculo ('chat') entram os dois. Sao coisas
    // diferentes — o card e conteudo pago com cota propria, a fala e o Oraculo
    // falando — mas as duas sao mensagens de verdade e as duas moram no historico
    // com data e hora. Antes so o card era lido, e a fala evaporava no balao.
    const recentFeedCards = (oracleMessages || [])
      .filter((message) => (
        message.deliveryType === 'feed'
        || (message.deliveryType === 'chat' && message.contextSnapshot?.purpose === 'oracle_speech')
      ))
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
      feedPurpose: feedMessage.contextSnapshot?.purpose,
      quickActions: Array.isArray(feedMessage.contextSnapshot?.quickActions)
        ? (feedMessage.contextSnapshot?.quickActions as ChatQuickAction[])
        : undefined,
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

  // A starter foi embora. Ela era um painel vestido de mensagem: recalculada no
  // cliente a cada abertura do chat, sem hora, sem historico e sem push, sentada
  // num log ao lado de mensagens de verdade que tinham as tres coisas.
  //
  // O que ela dizia nao se perdeu — os mesmos botoes viajam agora na fala de
  // abertura, que e uma linha em oracle_messages e passa pelo mesmo caminho de
  // qualquer outra fala do Oraculo.

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  
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
      return 'Eu não crio arenas pelo chat. Abra Arenas e toque no +; se quiser, eu posso ajudar você a decidir o nome, a prioridade e o que vale acompanhar.';
    }

    if (lowerCmd.startsWith('!criar-acao')) {
      return 'Eu não crio ações pelo chat. Abra a arena, toque no + e use o formulario direto; posso ajudar a escolher uma meta realista antes disso.';
    }
    
    // Help Command
    if (lowerCmd === '?ajuda' || lowerCmd === '?help') {
        return "**Como eu posso ajudar**\n\nPergunte sobre seu ciclo, suas arenas ou o que fazer hoje. Eu leio o progresso, aponto riscos e ajudo você a decidir. Para criar ou editar algo, use os botoes do proprio app.";
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


  const { trigger: sensory } = useSensoryFeedback();
  const [pactPanelOpen, setPactPanelOpen] = useState(false);
  // Trocar e o caminho mais usado: quem tem um pacto raramente quer ficar sem
  // nenhum, quer outro no lugar. Este estado abre a proposta POR CIMA do pacto
  // ativo, em vez de exigir encerrar antes.
  const [trocandoPacto, setTrocandoPacto] = useState(false);

  // Sem arena elegivel não ha pacto possível. O botao fica opaco em vez de sumir:
  // sumir faz o rodape pular, e não explica nada.
  // Inclui a missao do APP INTEIRO, e nao so as por arena. Antes, quem nao tinha
  // nenhuma frente isolada elegivel — cedo na jornada, ou sem ciclo aberto —
  // levava "Nenhuma arena sua esta elegivel" com a missao geral disponivel logo
  // ali dentro do balao.
  const missionAvailable = missaoIndividualDisponivel;

  /**
   * A leitura do proprio estado, na hora e de graca.
   *
   * Tudo que ela precisa ja esta na memória: arenas, ações, tarefas e ciclo. Não
   * ha ida ao servidor, entao ela pode ser livre e gratuita — e da ao plano
   * gratuito um botao para apertar, coisa que o rodape não tinha.
   *
   * Apertar duas vezes devolve a mesma frase de proposito: o que muda a leitura e
   * o seu estado mudar, não o Oráculo ter mais sinonimos.
   *
   * E ela NÃO fica gravada. E resposta a um toque, sobre algo que a pessoa esta
   * olhando — como o painel de missão, que aparece, recebe as duas escolhas e
   * some. Gravar encheria o histórico de linhas iguais num mesmo dia, e o
   * histórico existe para o que o Oráculo disse por conta propria.
   */
  // A leitura sai NO CHAT, não em balao flutuante. O balao existe para te alcancar
  // quando você esta em outra tela; pedir a leitura de dentro do proprio Oráculo e
  // receber um balao que aparece ATRAS do painel aberto e o pior dos dois mundos.
  //
  // E ela não empilha: o mesmo feedId sai e volta, entao pedir de novo troca a
  // leitura no lugar e a hora muda junto. Continua sem gravar no banco — some ao
  // fechar o Oráculo, como a proposta de missão.
  const handleReadMyDay = useCallback(() => {
    const brief = buildOracleCycleCoachBrief(operationalContext);
    if (!brief?.content) return;
    sensory('click_soft');
    setMessages((previous) => [
      ...previous.filter((message) => message.feedId !== READING_FEED_ID),
      {
        role: 'assistant',
        content: brief.content,
        timestamp: new Date(),
        mode: currentMode,
        feedId: READING_FEED_ID,
        feedCategory: 'analise_padroes',
        feedPresentation: 'ambient_pulse',
        feedSummary: 'Leitura do momento',
        feedTrigger: 'manual',
        quickActions: brief.quickActions,
      },
    ]);
  }, [operationalContext, sensory, currentMode]);

  const handleAskMission = useCallback(() => {
    if (activeArenaPact) {
      setTrocandoPacto(false);
      setPactPanelOpen(true);
      return;
    }
    // O slot esta com uma missao de sistema. Abrir a proposta aqui daria um painel
    // que recusaria o aceite depois — mais honesto dizer onde ela mora.
    if (missaoDeSistemaAtiva) {
      sensory('click_soft');
      showToast(`"${missaoDeSistemaAtiva.title}" esta em andamento. Ela fica na aba Temporada.`, 'info');
      return;
    }
    if (!missionAvailable) {
      sensory('error');
      showToast('Nenhuma missao disponivel agora. Registre uma acao e eu volto com uma.', 'warning');
      return;
    }
    sensory('click_soft');
    setPactPanelOpen(true);
  }, [activeArenaPact, missaoDeSistemaAtiva, missionAvailable, sensory, showToast]);

  const runQuickAction = useCallback((action: ChatQuickAction) => {
    switch (action.kind) {
      case 'open_planner_create_action':
        openPlannerCreateAction();
        onClose();
        return;
      case 'open_daily_panel':
        openPlannerDailyPanel();
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
  }, [onClose, openArena, openArenasView, openCycleReview, openPlannerCreateAction, openPlannerDailyPanel, openPlannerView]);

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
        return 'Não consegui gerar o card agora. Tente novamente em instantes.';
      default:
        return null;
    }
  };

  const handleGenerateCard = async () => {
    if (isGeneratingCard) return;

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

  const manualGenerateDisabled = isGeneratingCard;
  const selectedThemeCount = oraclePreferences?.enabledCategories?.length || 0;
  const manualQuotaLabel = `${oracleFeedStatus.combinedSentToday}/${oracleFeedStatus.dailyLimit}`;
  const manualGenerateLabel = !isPremiumUser
    ? 'Premium'
    : isGeneratingCard
      ? 'Gerando...'
      : 'Card do Oráculo';
  const selectedThemeLabel = selectedThemeCount === 1 ? '1 tema marcado' : `${selectedThemeCount} temas marcados`;
  // O card automático virou um por dia para todo mundo, inclusive no gratuito: a
  // pool tem 3 variacoes por estado, entao volume maior entregaria repeticao. O
  // que o Premium compra agora e escolher o tema e pedir na hora — profundidade,
  // não quantidade. O texto tem de dizer isso, senao vende o que não existe.
  const oracleInputHint = !isPremiumUser
    ? 'Um card por dia, todo dia. No Premium você escolhe o tema e pode pedir na hora.'
    : selectedThemeCount > 0
      ? `Um card por dia entra sozinho. Pedir agora consome a vaga de um dos seus ${selectedThemeLabel}.`
      : 'Escolha temas para pedir card na hora. O card do dia entra sozinho de qualquer forma.';

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
                  <span className={`text-[10px] uppercase tracking-widest text-gray-400`}>{ORACLE_TONE_LABELS[currentMode].name}</span>
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
          <button aria-label="Fechar" 
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
                        Tom: <span className={`${MODE_VISUALS[currentMode].color}`}>{ORACLE_TONE_LABELS[currentMode].name}</span>
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
              <div className="opacity-50">
              <HeaderIcon className={`w-16 h-16 mb-4 ${MODE_VISUALS[currentMode].color} drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]`} />
              <p className="text-sm text-gray-400 font-bold">O Oráculo aguarda sua consulta, Soberano.</p>
              <p className="text-xs text-gray-600 mt-2 max-w-[200px]">Tom atual: {ORACLE_TONE_LABELS[currentMode].hint}</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => {
             const msgMode = msg.role === 'assistant' ? resolveTone(msg.mode) : ORACLE_FREE_TONE;
             const visuals = MODE_VISUALS[msgMode];
             const isFeedCard = msg.role === 'assistant' && Boolean(msg.feedId);
             const feedCategory = msg.feedCategory || 'frases_inspiradoras';
             const feedPresentation = msg.feedPresentation || 'ambient_pulse';
             // Categoria desconhecida não pode derrubar o painel. Sem esta rede,
             // uma linha gravada com categoria fora da lista fazia
             // `feedVisual.borderClass` estourar e, como não ha error boundary no
             // app, o Oráculo inteiro sumia ao abrir.
             const feedVisual = ORACLE_CATEGORY_VISUALS[feedCategory]
               || ORACLE_CATEGORY_VISUALS.frases_inspiradoras;
             // A fala não e card de conteúdo, entao não usa o rotulo do tema.
             const isSpeech = msg.feedPurpose === 'oracle_speech';
             const feedLabel = isSpeech ? 'Oráculo' : feedVisual.label;

             return (
            <div 
              key={idx} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} mb-4`}
            >
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
                  {/* Um rotulo e a hora. Antes eram quatro coisas dizendo quase a
                      mesma: o tom em cima de cada bolha, o selo do tipo, o selo de
                      gatilho (AUTO/MANUAL — vocabulario de quem escreveu o codigo,
                      nao de quem le) e o resumo, que repetia o texto do selo. */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${feedVisual.badgeClass}`}>
                      {feedLabel}
                    </span>
                    {/* A hora vem de created_at, que ja chegava na mesma consulta —
                        so nao era desenhada. Sem ela o historico e uma pilha de
                        falas sem quando, e nao da para saber se a de cima e de
                        agora ou da semana passada. Custo de egress: zero. */}
                    <span className="ml-auto text-[10px] font-semibold tabular-nums tracking-[0.08em] text-white/32">
                      {formatFeedMoment(msg.timestamp)}
                    </span>
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

          <div ref={messagesEndRef} />
        </div>

        {/* O painel do pacto abre ACIMA da barra, dentro do proprio Oraculo.
            Ele nao e conversa: sao duas escolhas — arena e molde — e um aceitar.
            Nada dele vira mensagem, entao o historico continua limpo. */}
        {pactPanelOpen && (
          <div className="border-t border-white/10 bg-black/30 p-3 flex-shrink-0">
            {activeArenaPact && !trocandoPacto
              ? <ArenaPactBalloon onTrocar={() => setTrocandoPacto(true)} />
              : <ArenaPactProposal
                  substituindo={Boolean(activeArenaPact)}
                  onClose={() => { setTrocandoPacto(false); setPactPanelOpen(false); }}
                />}
            <button
              onClick={() => { setTrocandoPacto(false); setPactPanelOpen(false); }}
              className="mt-2 w-full rounded-xl border border-white/10 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white/80"
            >
              Fechar
            </button>
          </div>
        )}

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
            {/* O chat livre saiu: ele chamava o modelo para todo mundo sem portao de
                Premium, entao o custo crescia com cadastros e nao com receita. O
                espaco dele virava duas linhas explicando o botao ao lado — texto
                sobre um botao que ja tem rotulo.
                Agora sao duas acoes que a pessoa pode pedir quando quiser, e as
                duas custam ZERO de rede: leem o que ja esta na memoria do app. */}
            <div className="flex min-w-0 flex-1 gap-2">
              <button
                id="oracle-read-my-day"
                onClick={handleReadMyDay}
                className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/[0.04] px-2.5 py-2.5 text-left transition-colors hover:border-[var(--skin-accent-color)]/35 hover:bg-white/[0.07]"
              >
                <span className="block text-[11px] font-black uppercase leading-tight tracking-[0.02em] text-white/82">Ler meu dia</span>
                <span className="mt-0.5 block truncate text-[9px] text-white/38">agora</span>
              </button>

              {/* UM slot, tres estados: vazio convida, ocupado informa QUEM ocupa.
                  A missao individual pode ser de arena ou de sistema, e o botao tem
                  de dizer a verdade nos dois casos — senao a pessoa ve "Escolher
                  missao", toca, e leva um aviso de que ja tem uma.

                  Botao que some faz o rodape pular; opaco com aviso diz por que nao
                  da, em vez de nao dar e ficar calado. */}
              <button
                onClick={handleAskMission}
                className={`min-w-0 flex-1 rounded-2xl border px-2.5 py-2.5 text-left transition-colors ${
                  activeArenaPact || missaoDeSistemaAtiva
                    ? 'border-[var(--skin-accent-color)]/32 bg-[var(--skin-accent-color)]/8 hover:bg-[var(--skin-accent-color)]/12'
                    : missionAvailable
                      ? 'border-white/12 bg-white/[0.04] hover:border-[var(--skin-accent-color)]/35 hover:bg-white/[0.07]'
                      : 'border-white/8 bg-white/[0.02] opacity-45'
                }`}
              >
                <span className={`block truncate text-[11px] font-black uppercase leading-tight tracking-[0.02em] ${activeArenaPact || missaoDeSistemaAtiva ? 'text-[var(--skin-accent-color)]' : 'text-white/82'}`}>
                  {activeArenaPact
                    ? activeArenaPact.title
                    : missaoDeSistemaAtiva
                      ? missaoDeSistemaAtiva.title
                      : 'Escolher missão'}
                </span>
                <span className="mt-0.5 block truncate text-[9px] text-white/38">
                  {activeArenaPact
                    ? `${arenaPactProgress.current}/${arenaPactProgress.goal}`
                    : missaoDeSistemaAtiva
                      ? 'em Temporada'
                      : 'uma de cada vez'}
                </span>
              </button>
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
        <div
            className="fixed inset-0 z-50 flex items-start justify-center px-3 pointer-events-none"
            style={{
                // Alturas reais do aparelho, não do documento. `vh` no Android ignora
                // a barra de status e a de navegacao, entao o painel nascia mais alto
                // que a area visivel e o topo dele ficava fora da tela.
                paddingTop: 'calc(var(--safe-area-top, 0px) + 4.5rem)',
                paddingBottom: 'calc(var(--safe-area-bottom, 0px) + 0.75rem)',
            }}
        >
            {/* pointer-events-auto no FUNDO também.
                O pai e pointer-events-none e so o painel reativava os eventos — entao
                este `onClick={onClose}` nunca podia disparar: o toque fora atravessava
                o fundo inteiro sem encontrar nada. Com o chat alto, o X do topo saia
                da area visivel e nao sobrava jeito nenhum de fechar. */}
            <div className="pointer-events-auto absolute inset-0 bg-black/20" onClick={onClose} />

            {/* Centralizado. Com justify-end ele encostava na borda direita e parecia
                empurrado para fora, sobrando margem so de um lado. */}
            <div className="pointer-events-auto relative flex h-full max-h-[38rem] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-5 fade-in duration-300">
                {content}
            </div>
        </div>
        </>
    </Portal>
  );
};






