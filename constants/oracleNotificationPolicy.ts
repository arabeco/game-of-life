import { AppMode, Notification, NotificationType, OracleMode } from '../types';

export type NotificationLane = 'essential' | 'progress' | 'feed';
export type NotificationPriority = 'critical' | 'actionable' | 'progress' | 'ambient';
export type OracleNotificationSurface = 'chat' | 'requests';

interface NotificationPolicy {
  lane: NotificationLane;
  priority: NotificationPriority;
  badge: boolean;
  basicVisible: boolean;
  gameVisible: boolean;
  icon: string;
  label: string;
}

const POLICY: Record<NotificationType, NotificationPolicy> = {
  mentor_invite: {
    lane: 'essential',
    priority: 'critical',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'M',
    label: 'Mentor',
  },
  direct_message: {
    lane: 'essential',
    priority: 'actionable',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'D',
    label: 'DM',
  },
  friend_request: {
    lane: 'essential',
    priority: 'critical',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'F',
    label: 'Amizade',
  },
  friend_response: {
    lane: 'essential',
    priority: 'actionable',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'F',
    label: 'Resposta',
  },
  friend_accepted: {
    lane: 'feed',
    priority: 'ambient',
    badge: false,
    basicVisible: false,
    gameVisible: true,
    icon: 'F',
    label: 'Aliado',
  },
  clan_invite: {
    lane: 'essential',
    priority: 'critical',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'C',
    label: 'Cla',
  },
  clan_response: {
    lane: 'essential',
    priority: 'actionable',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'C',
    label: 'Resposta',
  },
  clan_join: {
    lane: 'feed',
    priority: 'ambient',
    badge: false,
    basicVisible: false,
    gameVisible: true,
    icon: 'C',
    label: 'Cla',
  },
  clan_mission_update: {
    lane: 'essential',
    priority: 'critical',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'M',
    label: 'Missao',
  },
  cycle_ending: {
    lane: 'essential',
    priority: 'critical',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'C',
    label: 'Ciclo',
  },
  cycle_finalized: {
    lane: 'progress',
    priority: 'progress',
    badge: false,
    basicVisible: false,
    gameVisible: true,
    icon: 'R',
    label: 'Relatorio',
  },
  season_ending: {
    lane: 'essential',
    priority: 'critical',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'S',
    label: 'Temporada',
  },
  reward_ready: {
    lane: 'essential',
    priority: 'actionable',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'R',
    label: 'Recompensa',
  },
  mission_redeemable: {
    lane: 'essential',
    priority: 'actionable',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'R',
    label: 'Resgate',
  },
  level_up: {
    lane: 'progress',
    priority: 'progress',
    badge: false,
    basicVisible: false,
    gameVisible: true,
    icon: 'L',
    label: 'Patente',
  },
  title_unlocked: {
    lane: 'progress',
    priority: 'progress',
    badge: false,
    basicVisible: false,
    gameVisible: true,
    icon: 'T',
    label: 'Titulo',
  },
  oracle_prompt: {
    lane: 'feed',
    priority: 'ambient',
    badge: false,
    basicVisible: false,
    gameVisible: true,
    icon: 'O',
    label: 'Oraculo',
  },
  codex_gift: {
    lane: 'essential',
    priority: 'actionable',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'C',
    label: 'Campanha',
  },
  partnership_invite: {
    lane: 'essential',
    priority: 'critical',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'P',
    label: 'Parceria',
  },
  arena_access: {
    lane: 'progress',
    priority: 'actionable',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'A',
    label: 'Arena',
  },
  competition_result: {
    lane: 'essential',
    priority: 'critical',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: 'T',
    label: 'Duelo',
  },
  action_reminder: {
    lane: 'essential',
    priority: 'actionable',
    badge: false,
    basicVisible: true,
    gameVisible: true,
    icon: 'R',
    label: 'Lembrete',
  },
  system: {
    lane: 'essential',
    priority: 'critical',
    badge: true,
    basicVisible: true,
    gameVisible: true,
    icon: '!',
    label: 'Sistema',
  },
};

const FALLBACK_POLICY: NotificationPolicy = POLICY.system;
const ORACLE_CHAT_NOTIFICATION_TYPES: NotificationType[] = [];

const getPolicy = (type: NotificationType): NotificationPolicy => POLICY[type] || FALLBACK_POLICY;

export const getOracleNotificationSurface = (type: NotificationType): OracleNotificationSurface =>
  ORACLE_CHAT_NOTIFICATION_TYPES.includes(type) ? 'chat' : 'requests';

export const isOracleChatNotificationType = (type: NotificationType): boolean =>
  getOracleNotificationSurface(type) === 'chat';

export const isBadgeNotification = (notificationOrType: Notification | NotificationType): boolean => {
  const type = typeof notificationOrType === 'string' ? notificationOrType : notificationOrType.type;
  return getPolicy(type).badge;
};

export const getNotificationLane = (type: NotificationType): NotificationLane => getPolicy(type).lane;
export const getNotificationPriority = (type: NotificationType): NotificationPriority => getPolicy(type).priority;

export const getNotificationIcon = (type: NotificationType): string => getPolicy(type).icon;

export const getNotificationLabel = (type: NotificationType): string => getPolicy(type).label;

export const getNotificationLaneLabel = (type: NotificationType): string => {
  const lane = getPolicy(type).lane;
  if (lane === 'essential') return 'Essencial';
  if (lane === 'progress') return 'Progresso';
  return 'Feed';
};

export const getNotificationTitle = (notification: Notification): string => {
  switch (notification.type) {
    case 'cycle_ending':
      return 'Seu ciclo esta proximo do fim.';
    case 'cycle_finalized':
      return 'Parabens! Seu ciclo foi finalizado.';
    case 'reward_ready':
    case 'mission_redeemable':
      return 'Voce tem novas recompensas.';
    case 'mentor_invite':
      return 'Voce recebeu um convite de mentor.';
    case 'direct_message':
      return typeof notification.metadata?.senderNickname === 'string' && notification.metadata.senderNickname.trim().length > 0
        ? notification.metadata.senderNickname
        : 'Nova mensagem direta.';
    case 'clan_invite':
      if (notification.metadata?.joinRequest) {
        return 'Novo pedido para o seu grupo.';
      }
      return 'Voce recebeu um convite de grupo.';
    case 'friend_request':
      return 'Voce recebeu um convite de amizade.';
    case 'friend_response':
      return 'Seu convite de amizade foi respondido.';
    case 'friend_accepted':
      return 'Seu convite de amizade foi aceito.';
    case 'clan_response':
      return 'Seu pedido de grupo foi respondido.';
    case 'clan_join':
      return 'Seu pedido de grupo foi aceito.';
    case 'clan_mission_update':
      return 'Seu grupo precisa de voce.';
    case 'season_ending':
      return 'A temporada esta acabando.';
    case 'level_up':
      return 'Voce subiu de nivel.';
    case 'title_unlocked':
      return 'Voce desbloqueou um titulo.';
    case 'oracle_prompt':
      return 'O Oraculo chamou sua atencao.';
    case 'codex_gift':
      return 'Uma Campanha chegou para voce.';
    case 'partnership_invite':
      return 'Voce recebeu um convite de parceria.';
    case 'arena_access':
      return 'Uma nova arena foi compartilhada.';
    case 'competition_result':
      return 'Seu duelo recebeu um desfecho.';
    case 'action_reminder':
      return 'Sua acao vai comecar em breve.';
    case 'system':
      return 'Aviso do sistema.';
    default:
      return 'Aviso do sistema.';
  }
};

const extractDaysLeft = (content?: string | null): number | null => {
  if (!content) return null;
  const match = content.match(/(\d+)/);
  if (!match) return null;
  const days = Number(match[1]);
  return Number.isFinite(days) ? days : null;
};

const getDaysLeftLabel = (daysLeft: number | null): string => {
  if (daysLeft == null) return 'Seu ciclo esta perto do fim.';
  if (daysLeft <= 0) return 'Seu ciclo termina hoje.';
  if (daysLeft === 1) return 'Falta 1 dia para o fim do ciclo.';
  return `Faltam ${daysLeft} dias para o fim do ciclo.`;
};

export const getNotificationBody = (
  notification: Notification,
  oracleMode: OracleMode,
): string => {
  if (notification.content?.trim()) {
    if (
      notification.type === 'mentor_invite' ||
      notification.type === 'clan_invite' ||
      notification.type === 'friend_request' ||
      notification.type === 'friend_response' ||
      notification.type === 'friend_accepted' ||
      notification.type === 'clan_response' ||
      notification.type === 'clan_join' ||
      notification.type === 'clan_mission_update' ||
      notification.type === 'cycle_finalized' ||
      notification.type === 'system' ||
      notification.type === 'oracle_prompt' ||
      notification.type === 'direct_message' ||
      notification.type === 'codex_gift' ||
      notification.type === 'partnership_invite' ||
      notification.type === 'arena_access' ||
      notification.type === 'competition_result' ||
      notification.type === 'action_reminder'
    ) {
      return notification.content;
    }
  }

  switch (notification.type) {
    case 'cycle_ending': {
      const daysLeft = extractDaysLeft(notification.content);
      const lead = getDaysLeftLabel(daysLeft);
      switch (oracleMode) {
        case 'coach':
          return `${lead} Fecha o que importa agora e entra na revisao com o jogo na mao.`;
        case 'tatico':
          return `${lead} Priorize marcos e o encerramento.`;
        case 'estrategico':
          return `${lead} Consolidar o fechamento agora preserva a leitura da fase.`;
        case 'calmo':
          return `${lead} Ainda ha tempo para encerrar com clareza.`;
        case 'reflexivo':
          return `${lead} Observe o que este ciclo ainda quer fechar.`;
        default:
          return lead;
      }
    }
    case 'reward_ready':
    case 'mission_redeemable':
      switch (oracleMode) {
        case 'coach':
          return 'Resgate agora e siga. Nao deixa recompensa virar pendencia.';
        case 'tatico':
          return 'Recompensa disponivel. Recolha para manter o fluxo limpo.';
        case 'estrategico':
          return 'Seu progresso ja liberou novas recompensas.';
        default:
          return 'Voce tem recompensas prontas para resgate.';
      }
    case 'season_ending':
      return 'A temporada esta perto do fim. Vale revisar o que ainda da para fechar.';
    case 'level_up':
      return 'Sua progressao avancou. Vale registrar esse salto na memoria do ciclo.';
    case 'title_unlocked':
      return 'Um novo titulo foi desbloqueado no seu percurso.';
    case 'friend_accepted':
      return notification.content || 'Seu convite de amizade foi aceito.';
    case 'clan_join':
      return notification.content || 'Seu pedido de entrada no grupo foi aceito.';
    case 'mentor_invite':
      return notification.content || 'Alguem quer entrar em um vinculo de mentoria com voce.';
    case 'direct_message':
      return typeof notification.metadata?.messagePreview === 'string' && notification.metadata.messagePreview.trim().length > 0
        ? notification.metadata.messagePreview
        : (notification.content || 'Uma nova mensagem direta chegou para voce.');
    case 'friend_request':
      return notification.content || 'Existe um novo convite de amizade esperando sua resposta.';
    case 'clan_invite':
      return notification.content || 'Existe um novo convite de grupo esperando sua resposta.';
    case 'oracle_prompt':
      switch (oracleMode) {
        case 'coach':
          return notification.content || 'O Oraculo viu um ponto de execucao que merece sua atencao.';
        case 'tatico':
          return notification.content || 'O Oraculo detectou um ajuste operacional necessario.';
        case 'estrategico':
          return notification.content || 'O Oraculo detectou um sinal importante na sua fase atual.';
        default:
          return notification.content || 'O Oraculo tem uma chamada curta para voce.';
      }
    case 'codex_gift':
      return notification.content || 'Uma campanha valiosa foi enviada para a sua biblioteca.';
    case 'competition_result':
      return notification.content || 'Seu rival fechou o duelo primeiro e o baú dessa corrida já foi decidido.';
    case 'action_reminder':
      return notification.content || 'Uma acao programada sua vai comecar em breve.';
    default:
      return notification.content || 'Ha uma atualizacao importante esperando sua leitura.';
  }
};

const PUSH_PRIORITIES: NotificationPriority[] = ['critical', 'actionable'];

export const shouldShowNotificationForProfile = (
  type: NotificationType,
  appMode: AppMode,
  oracleMode: OracleMode,
): boolean => {
  void oracleMode;
  const policy = getPolicy(type);

  if (appMode === 'BASIC') {
    return policy.basicVisible;
  }

  return policy.gameVisible;
};

export const shouldPushNotificationForProfile = (
  notification: Notification,
  appMode: AppMode,
  oracleMode: OracleMode,
): boolean => {
  void oracleMode;
  if (notification.read) return false;
  if (!shouldShowNotificationForProfile(notification.type, appMode, oracleMode)) return false;

  const policy = getPolicy(notification.type);
  return PUSH_PRIORITIES.includes(policy.priority);
};

export const getVisibleNotificationsForProfile = (
  notifications: Notification[],
  appMode: AppMode,
  oracleMode: OracleMode,
): Notification[] => {
  return notifications
    .filter((notification) => shouldShowNotificationForProfile(notification.type, appMode, oracleMode))
    .sort((left, right) => {
      const leftPolicy = getPolicy(left.type);
      const rightPolicy = getPolicy(right.type);

      if (left.read !== right.read) {
        return left.read ? 1 : -1;
      }

      if (leftPolicy.badge !== rightPolicy.badge) {
        return leftPolicy.badge ? -1 : 1;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
};

export const getOracleChatNotificationsForProfile = (
  notifications: Notification[],
  appMode: AppMode,
  oracleMode: OracleMode,
): Notification[] =>
  getVisibleNotificationsForProfile(notifications, appMode, oracleMode)
    .filter((notification) => isOracleChatNotificationType(notification.type));

export const getOracleRequestNotificationsForProfile = (
  notifications: Notification[],
  appMode: AppMode,
  oracleMode: OracleMode,
): Notification[] =>
  getVisibleNotificationsForProfile(notifications, appMode, oracleMode)
    .filter((notification) => !isOracleChatNotificationType(notification.type));

export const getUnreadBadgeCount = (notifications: Notification[]): number =>
  notifications.filter((notification) => !notification.read && isBadgeNotification(notification)).length;
