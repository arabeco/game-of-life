

export type SlotInputType = 'text' | 'textarea' | 'wheelpick' | 'slider' | 'image';
export type SlotLayoutType = 1 | 2 | 3; // 1: wide, 2: square, 3: rect
export type ChestType = 'Comum' | 'Incomum' | 'Raro' | 'Épico' | 'Lendário';

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
  folderId?: string; // New: Arena grouping
  
  // Codex Fields
  originCodexId?: string;
  codexLevel?: number; // 1, 2, 3...
}

export interface ArenaFolder {
    id: string;
    name: string;
    icon: string;
    assetId?: string;
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
    primaryDisplay?: 'sovereign' | 'item' | 'glyph'; // Preferred miniature display
}

export type UnlockCategory = 'bodyStyles' | 'hairStyles' | 'outfits' | 'head_under_items' | 'helmets' | 'head_over_items' | 'artifacts' | 'codexes' | 'skins' | 'borders' | 'glyphs' | 'auras';

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

export interface UserProfile {
  id: string;
  // FIX: Added optional email property to align with database schema and fix typing errors.
  email?: string;
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

export type ClanType = 'Casual' | 'Focado' | 'Competitivo';
export type RecruitmentStatus = 'Aberto' | 'Privado';

export interface Clan {
    id: string;
    name: string;
    icon: string;
    description: string;
    backgroundUrl?: string;
    clan_type: ClanType;
    recruitment_status: RecruitmentStatus;
    exp: number;
    rankId: string;
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
}

export type DailyCommitmentStage = 'planning' | 'battle' | 'judgment';

export interface DailyCommitment {
    date: string; // YYYY-MM-DD
    taskIds: string[];
    stage: DailyCommitmentStage;
    score: number | null;
    expDeposited?: number | null;
    sitrepBonus?: number | null;
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
export type FeedEventType = 'MILESTONE_COMPLETED' | 'ARENA_COMPLETED' | 'CYCLE_COMPLETED' | 'PLAYER_RANK_UP' | 'CLAN_RANK_UP' | 'LEVEL_UP';

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

export type RelationshipLinkType = 'mentoria' | 'parceria';

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
