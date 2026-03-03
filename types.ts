

export interface CodexLevel {
  level: number;
  title: string;
  description: string;
  actions: Omit<Action, 'id' | 'arenaId'>[];
}

export interface CodexTemplate {
  id: string;
  title: string;
  description: string;
  author: string;
  price: number; // 0 for free
  durationDays: number;
  levels: CodexLevel[];
  coverImage?: string; // Emoji or URL
  tags: string[];
}

export interface CodexCatalogItem {
    id: string;
    title: string;
    description: string;
    price_brl: number;
    is_premium: boolean;
    cover_image?: string;
    author_name: string;
    duration_days: number;
    created_at: string;
    template?: CodexTemplate; // JSONB
}

export interface UserCodex {
    id: string;
    owner_id: string;
    schema_version: string;
    name: string;
    author: string;
    price: number;
    description: string;
    template: CodexTemplate; // JSONB
    is_public: boolean;
    published_at?: string;
    created_at: string;
    updated_at: string;
}

export type SlotInputType = 'text' | 'textarea' | 'wheelpick' | 'slider' | 'image';
export type SlotLayoutType = 1 | 2 | 3 | 4; // 1: wide, 2: square, 3: rect, 4: centered-wide
export type ChestType = 'Comum' | 'Incomum' | 'Raro' | 'Épico' | 'Lendário' | 'Ciclo' | 'Skin Comum';

export interface SlotValueImage {
  imageUrl: string;
  caption: string;
  rarity?: ItemRarity;
}

export type SlotValue = string | number | SlotValueImage;

export interface Slot {
  id: string;
  label: string;
  type: SlotLayoutType;
  inputType: SlotInputType;
  options?: string[];
  range?: { min: number; max: number };
  placeholder?: string;
  value: SlotValue;
  rarity?: ItemRarity;
}

export type DayOfWeek = 'DOM' | 'SEG' | 'TER' | 'QUA' | 'QUI' | 'SEX' | 'SAB';
export type ActionType = 'Marco' | 'Compromisso' | 'Ação Recorrente';

export interface Action {
  id: string;
  arenaId: string;
  name: string;
  description?: string;
  icon: string;
  duration: number; // in minutes
  repetitions: number; // For 'Ação Recorrente'
  actionType: ActionType;
  difficulty?: number; // 1 to 5
  scheduledDays?: DayOfWeek[]; // Days to automatically schedule
  scheduledStartTime?: number; // Time in minutes to automatically schedule
  
  // Codex / Rich Content Fields
  originCodexId?: string; // If injected from a Codex
  briefing?: string; // The "Why"
  assets?: {
    type: 'video' | 'image' | 'pdf' | 'audio' | 'link';
    url: string;
    title: string;
  }[];
  preFlight?: string[]; // Checklist before starting
  context?: {
    energyLevel?: 'low' | 'medium' | 'high';
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    schedule?: {
      days?: DayOfWeek[];
      startTime?: number;
    };
  };
}

export interface Arena {
  id:string;
  assetId: string;
  name: string;
  description: string;
  icon: string;
  tags?: string[];
  actionIds: string[];
  isArchived?: boolean;
  folderId?: string; // Links to ArenaFolder
  
  // Campaign/Progression State
  isLocked?: boolean;
  isHidden?: boolean;
  isCleared?: boolean;
  priority?: 'alta' | 'media' | 'baixa';
  order?: number; // Global order for "free" mode
  priorityOrder?: number; // Order within a specific priority level
  
  // Codex Fields
  originCodexId?: string;
  codexLevel?: number; // 1, 2, 3...
}

export interface ArenaFolder {
    id: string;
    name: string;
    icon: string;
    assetId?: string; // Optional context link
    
    // Campaign metadata
    description?: string;
    deadline?: string;
    status: 'active' | 'completed' | 'archived';
    createdAt: string;
    completedAt?: string;
    
    // UI Config
    theme?: string; // For "subpastinhas" visual
}

// Alias for backward compatibility if needed, but prefer ArenaFolder
export interface Campaign {
    id: string;
    userId: string; // Add userId explicitly if missing in interface but present in DB
    title: string;
    description?: string;
    deadline?: string;
    status: 'active' | 'completed' | 'archived';
    createdAt: string;
    completedAt?: string;
    arenaIds: string[];
    arenaConfig?: Record<string, {
        isLocked: boolean;
        isHidden?: boolean;
        isCleared?: boolean;
        completedActionIds?: string[];
        prerequisiteArenaIds?: string[]; // IDs of arenas that must be cleared to unlock this one
    }>;
    priority?: 'alta' | 'media' | 'baixa';
    type?: 'sequential' | 'parallel';
    order?: number;
    priorityOrder?: number;
}

export interface Asset {
  id: string;
  name: string;
  level: number;
  levelDescriptions: { [key: number]: string };
  arenas: Arena[];
  slots: Slot[];
}

export interface Skin {
  id: string;
  name: string;
  color: string;
  imageUrl?: string;
  rarity?: ItemRarity;
}

export type ClanCustomQuestType = 'singular' | 'shared';

export interface ClanCustomQuest {
  id: string;
  clan_id: string;
  creator_id: string;
  title: string;
  description?: string;
  mission_type: ClanCustomQuestType;
  slot_id?: string;
  status: 'active' | 'locked' | 'completed' | 'aborted';
  target_value: number;
  current_value: number;
  reward_xp: number;
  reward_gold: number;
  created_at: string;
  assigned_user_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'work' | 'meeting' | 'report' | 'development' | 'other';
  due_date?: string;
}

export interface Nobility {
    exp: number;
    rankId: string;
}

export interface InventoryItem {
    id: string; // References ItemDef.id
    instanceId: string; // Unique ID for this specific item instance (UUID)
    acquiredAt: string;
    isEquipped?: boolean;
}

export interface UserWallet {
    gold: number;
    fragments: number;
}

export interface SovereignConfig {
    body: string;
    skinTone: string;
    hairStyle: string;
    hairColor: string;
    outfit: string;
    head_under: string; // mascara, oculos, tapa-olho
    helmet: string; // elmos
    head_over: string; // coroa, boné, chapéu
    artifact: string;
    glyph: string; // NEW: Glifo slot
    aura: string; // NEW: Aura slot
    orb?: string; // NEW: Orbe slot
    sovereignPlate?: string; // NEW: Placa slot for Sovereign
    artifactPlate?: string; // NEW: Placa slot for Artifact
    glyphPlate?: string; // NEW: Placa slot for Glyph
    primaryDisplay?: 'sovereign' | 'item' | 'glyph'; // Preferred miniature display
}

export type UnlockCategory = 'bodyStyles' | 'hairStyles' | 'outfits' | 'head_under_items' | 'helmets' | 'head_over_items' | 'artifacts' | 'codexes' | 'skins' | 'borders' | 'banners' | 'glyphs' | 'auras' | 'orbs' | 'plates' | 'ornament' | 'insignias' | 'ui_skins';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type LevelUnlocks = Record<UnlockCategory, Record<string, number>>;

export type UserUnlocks = Record<UnlockCategory, Record<string, boolean>>;

export interface ClanMissionParticipant {
  id: string;
  clanId: string;
  missionId: string;
  userId: string;
  joinedAt: string;
  contributionValue: number;
}

export interface ClanMissionState {
  id: string;
  clanId: string;
  missionId: string;
  isCompleted: boolean;
  completedAt?: string;
}

export type AppMode = 'GAME' | 'BASIC';
export type ThemePreference = 'LIGHT' | 'DARK';
export type ArenasViewMode = 'free' | 'priorities' | 'assets';

export interface UserProfile {
  id: string;
  // FIX: Added optional email property to align with database schema and fix typing errors.
  email?: string;
  username: string;
  appMode?: AppMode;
  themePreference?: ThemePreference;
  arenasViewMode?: ArenasViewMode;
  sovereign?: SovereignConfig;
  avatarUrl: string; // The circular profile picture
  border: string; // Corresponds to a Skin ID or 'default'
  nickname: string;
  title?: string;
  level: number;
  backgroundUrl: string;
  bannerUrl?: string; // Flamula-style banner
  isOnline: boolean;
  visibleWidgets: string[];
  skin: string; // ID of the current skin
  lastLevelUpdate?: number; // Timestamp of the last level update
  nobility: Nobility;
  mood: number; // From 0 to 100
  wallet: UserWallet;
  chests?: { type: ChestType; count: number }[];
  inventory: InventoryItem[]; // NEW: Full inventory list
  unlockedItems?: UserUnlocks; // Legacy support, maybe migrate later
  unlockedSkins?: Record<string, boolean>; // Legacy support
  completedSeasonMissions?: string[];
  role: 'admin' | 'gm' | 'user';
  isPremium?: boolean;
  clanName?: string;
  clanIcon?: string;
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export interface FriendRequest {
  id: string;
  senderId: string;
  recipientId: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt?: string | null;
  senderProfile?: UserProfile;
  recipientProfile?: UserProfile;
}

export interface ScheduledTask {
  id: string;
  actionId: string;
  date: string; // ISO string for date part only
  startTime: number; // minutes from midnight
  duration: number; // minutes
  completed?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Report {
    id: string;
    cycleId?: string;
    startDate: string;
    endDate: string;
    performanceScore: number;
    metrics: {
        actionsCompleted: number;
        totalPlannedActions: number;
        arenasInvolved: number;
        goalsMet: number; // Assuming milestones are goals
        totalHours: number;
        questsCompleted?: number;
        consistencyDays?: number;
        expGained?: number;
        plannedEndDate?: string;
    };
    highlight: {
        mostFocusedArena: string;
        mostFocusedArenaId?: string;
        mostRepeatedAction: string;
        mostRepeatedActionCount?: number;
    };
    cycleName?: string;
    seasonId?: string;
    clanPoints?: number;
    assetProgress: { asset: string; value: number }[];
}

export interface NobilityRank {
    id: string;
    name: string;
    levelRequired: number;
    expTotalRequired: number;
}

export interface ClanRank {
    id: string;
    name: string;
    expRequired: number;
}

export type ClanType = 'Casual' | 'Office';
export type RecruitmentStatus = 'Aberto' | 'Privado';
export type ClanRankId = string;

export interface Clan {
    id: string;
    name: string;
    icon?: string;
    description: string;
    backgroundUrl?: string;
    leaderId: string;
    rankId: ClanRankId;
    level: number;
    experience: number;
    exp: number;
    bannerUrl?: string;
    clanType: ClanType;
    created_at?: string;
    privacy: 'open' | 'invite-only' | 'closed';
    recruitmentStatus?: RecruitmentStatus;
    slotConfig?: Record<string, { label: string; emoji: string }>;
}

export interface ClanMember {
  user_id: string;
  clan_id: string;
  role: 'leader' | 'member';
  joined_at: string; // ISO String
}

export interface ClanJoinRequest {
  id: string;
  clanId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  respondedAt?: string | null;
  requesterProfile?: UserProfile;
}

// FIX: Define EnrichedClanMember to resolve role conflict and be reusable.
export type EnrichedClanMember = Omit<UserProfile, 'role'> & {
    role: 'leader' | 'member';
    joined_at: string;
};

// Sistema de Santuário - Posicionamento e Tempo
export type SanctuaryArea = 'meditation' | 'devotion' | 'rest' | 'garden';
export type GardenAction = 'working' | 'watering' | 'walking';

export interface SanctuaryPosition {
    userId: string;
    row: number;
    col: number;
    area: SanctuaryArea;
    gardenAction?: GardenAction;
    lastUpdated: string; // ISO timestamp
}

export interface SanctuaryTimeTracker {
    userId: string;
    area: SanctuaryArea;
    totalTime: number; // seconds
    currentSessionStart?: string; // ISO timestamp
    lastCalculatedDecay: string; // ISO timestamp
}

export interface SanctuaryAreaStats {
    area: SanctuaryArea;
    totalTime: number; // seconds
    activeUsers: number;
    lastUpdated: string;
    decayRate: number; // seconds per hour when empty
}


export interface Mood {
    label: string;
    min: number;
    max: number;
    color: string;
    trackStart: string;
    trackEnd: string;
}

export interface Cycle {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    arenaIds: string[]; // IDs das arenas ativas neste ciclo
    userId: string; // ID do usuário dono do ciclo
    seasonId?: string;
    arenaConfig?: Record<string, {
        isLocked: boolean;
        isHidden?: boolean;
        isCleared?: boolean;
        completedActionIds?: string[];
    }>;
}

export type DailyCommitmentStage = 'planning' | 'battle' | 'judgment';

export interface DailyCommitment {
    date: string; // YYYY-MM-DD
    taskIds: string[];
    stage: DailyCommitmentStage;
    score: number | null;
    expDeposited?: number | null;
    sitrepBonus?: number | null;
    earnedInsigniaId?: string | null;
}

// --- Sovereign Control Panel Types ---

export interface GoldenInvite {
    id: string;
    code: string;
    is_used: boolean;
    claimed_by_user_id: string | null;
    claimed_at: string | null;
    created_at: string;
}

export interface Season {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    background_png_url: string;
    lore_text: string;
    is_active: boolean;
}

export interface SeasonMission {
    id: string;
    season_id: string;
    title: string;
    description: string;
    goal_type: 'km_run' | 'books_read' | 'meditation_days' | 'actions_completed';
    goal_value: number;
    reward_type: 'exp' | 'item_id';
    reward_value: number | string;
    type?: 'individual' | 'clan';
    action_name?: string;
    icon?: string;
    requirements?: any;
}

export interface QuestActionTemplate {
    name: string;
    description: string;
    duration: number; // minutos
    icon: string;
    repetitions?: number; 
    isMilestone?: boolean;
    actionType?: string;
    difficulty?: number;
}

export type ConfigSeasonQuest = SeasonQuest;

export interface SeasonQuest {
    id: string;
    title: string;
    description: string;
    type: 'individual' | 'clan';
    category?: 'physical' | 'intellectual' | 'social' | 'spiritual';
    actionTemplate: QuestActionTemplate;
    requirements: {
        totalReps?: number;
        milestone?: boolean;
        clanGoal?: number;
    };
    rewards: {
        xp: number;
        gold?: number;
        items?: string[];
    };
    clanConfig?: {
        collectiveGoal: number;
    };
    season_id?: string;
    goal_type?: 'actions_completed' | 'milestones_completed'; // Optional for compatibility if needed
    goal_value?: number;
    reward_type?: 'exp' | 'item_id' | 'chest';
    reward_value?: number | string;
    maxParticipants?: number;
}

// --- Hall of Fame / Feed Types ---
export type FeedEventType = 'MILESTONE_COMPLETED' | 'ARENA_COMPLETED' | 'CYCLE_COMPLETED' | 'PLAYER_RANK_UP' | 'CLAN_RANK_UP' | 'LEVEL_UP' | 'QUEST_COMPLETED' | 'REPORT_COMPLETED';

export interface FeedEvent {
  id: string;
  userId: string;
  type: FeedEventType;
  content: {
    title: string;
    icon?: string;
    score?: number;
    rankName?: string;
  };
  timestamp: string;
}

export type RelationshipLinkType = 'mentoria' | 'parceria' | 'competicao';

export type RelationshipInviteStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export interface RelationshipLinkInvite {
  id: string;
  senderId: string;
  recipientId: string;
  linkType: RelationshipLinkType;
  arenaId: string;
  arenaSnapshot: { name: string; icon?: string };
  status: RelationshipInviteStatus;
  createdAt: string;
  respondedAt?: string | null;
}

export interface RelationshipLink {
  id: string;
  mentorId: string;
  pupilId: string;
  linkType: RelationshipLinkType;
  arenaId: string;
  arenaSnapshot: { name: string; icon?: string };
  satisfactionLevel: number;
  createdAt: string;
  updatedAt: string;
  endedAt?: string | null;
}

export type LinkNotificationType = 'praise' | 'support' | 'scold';

export interface LinkNotificationLog {
  id: string;
  linkId: string;
  senderId: string;
  recipientId: string;
  notificationType: LinkNotificationType;
  createdAt: string;
}

// --- Oracle System ---

export type OracleMode = 'calmo' | 'reflexivo' | 'tatico' | 'estrategico' | 'coach' | 'personalizado' | 'neutro';

export type OracleCategory = 
    | 'frases_inspiradoras' 
    | 'reflexoes_filosoficas' 
    | 'fragmentos_sabedoria' 
    | 'dicas_produtividade' 
    | 'rituais_lifestyle' 
    | 'provocacoes' 
    | 'sussurros_maestria' 
    | 'analise_padroes';

export interface OraclePreferences {
    userId: string;
    iaEnabled: boolean;
    notificationsEnabled: boolean;
    animationsEnabled: boolean;
    soundsEnabled: boolean;
    hapticsEnabled: boolean;
    enabledCategories: OracleCategory[];
    activeMode: OracleMode;
    customModeInstructions?: string;
    quietHoursStart: string;
    quietHoursEnd: string;
    updatedAt: string;
}

export interface OracleMessage {
    id: string;
    userId: string;
    category: OracleCategory;
    content: string;
    mode: OracleMode;
    deliveryType: 'feed' | 'push' | 'chat';
    contextSnapshot?: any;
    read: boolean;
    createdAt: string;
}

export interface OracleContext {
    currentTime: string;
    timeOfDay: "madrugada" | "manhã" | "tarde" | "noite";
    hasCycle: boolean;
    cycleDayNumber: number | null;
    cycleTotalDays: number | null;
    cycleCompletionPercent: number | null;
    hasArenas: boolean;
    totalArenas: number;
    arenaNames: string[];
    staleArenas: string[];
    completedActionsInCycle: number;
    pendingActionsToday: number;
    overdueActions: number;
    activeMode: OracleMode;
    customModeInstructions: string | null;
    enabledCategories: OracleCategory[];
    username: string;
    level: number;
    sephirotLevels: Record<string, number>;
    clanName: string | null;
    seasonName: string | null;
    pendingChests: number;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'friend_request' | 'friend_accepted' | 'clan_invite' | 'clan_join' | 'clan_mission_update' | 'cycle_ending' | 'season_ending' | 'level_up' | 'title_unlocked' | 'mission_redeemable' | 'system';
    content: string;
    read: boolean;
    createdAt: string;
}

// --- Direct Messages ---

export interface DirectMessage {
    id: string;
    senderId: string;
    recipientId: string;
    content: string;
    read: boolean;
    createdAt: string;
    senderProfile?: UserProfile;
}

export interface DMConversation {
    participantId: string;
    profile: UserProfile;
    lastMessage?: DirectMessage;
    unreadCount: number;
}

// --- Aldeia System ---
export type AldeiaSlotId = 'fogueira' | 'forja' | 'torre' | 'horta' | 'altar' | 'trono';

export interface AldeiaSlot {
    id: string;
    clanId: string;
    slotId: AldeiaSlotId;
    health: number;
    streakGood: number;
    streakBad: number;
    lastVisitedAt: string | null;
    lastDecayCalculation: string | null;
    updatedAt: string;
}

export interface AldeiaPresence {
    id: string;
    clanId: string;
    userId: string;
    slotId: AldeiaSlotId;
    startedAt: string;
    hoursCounted: number;
}


