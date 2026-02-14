

export type SlotInputType = 'text' | 'textarea' | 'wheelpick' | 'slider' | 'image';
export type SlotLayoutType = 1 | 2 | 3; // 1: wide, 2: square, 3: rect
export type ChestType = 'Comum' | 'Raro' | 'Épico' | 'Lendário';

export interface SlotValueImage {
  imageUrl: string;
  caption: string;
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
}

export interface Nobility {
    exp: number;
    rankId: string;
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
}

export interface UserProfile {
  id: string;
  // FIX: Added optional email property to align with database schema and fix typing errors.
  email?: string;
  sovereign?: SovereignConfig;
  avatarUrl: string; // The circular profile picture
  border: string; // Corresponds to a Skin ID or 'default'
  nickname: string;
  level: number;
  backgroundUrl: string;
  bannerUrl?: string; // Flamula-style banner
  isOnline: boolean;
  visibleWidgets: string[];
  skin: string; // ID of the current skin
  lastLevelUpdate?: number; // Timestamp of the last level update
  nobility: Nobility;
  mood: number; // From 0 to 100
  chests?: { type: ChestType; count: number }[];
  role: 'admin' | 'user';
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
    };
    highlight: {
        mostFocusedArena: string;
        mostRepeatedAction: string;
    };
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

// FIX: Define EnrichedClanMember to resolve role conflict and be reusable.
export type EnrichedClanMember = Omit<UserProfile, 'role'> & {
    role: 'leader' | 'member';
    joined_at: string;
};


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

// --- Hall of Fame / Feed Types ---
export type FeedEventType = 'MILESTONE_COMPLETED' | 'ARENA_COMPLETED' | 'CYCLE_COMPLETED' | 'PLAYER_RANK_UP' | 'CLAN_RANK_UP';

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
