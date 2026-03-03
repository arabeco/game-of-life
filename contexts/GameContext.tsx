
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import { Asset, Slot, SlotValue, Arena, ArenaFolder, Action, ScheduledTask, ChecklistItem, UserProfile, Report, NobilityRank, Clan, ClanJoinRequest, ClanRank, DayOfWeek, Cycle, DailyCommitment, ChestType, FeedEvent, FeedEventType, EnrichedClanMember, ClanMember, Season, SeasonMission, SeasonQuest, FriendRequest, LevelUnlocks, UnlockCategory, UserUnlocks, InventoryItem, UserWallet, OraclePreferences, OracleMessage, OracleMode, OracleContext, Notification, AldeiaSlot, AldeiaPresence, AldeiaSlotId, Campaign, AppMode, ThemePreference, DirectMessage, DMConversation, ItemRarity } from '../types';
import { ASSETS_DATA, MASTERY_LEVEL_DESCRIPTIONS, MAX_CLAN_MEMBERS, GM_CONFIG, SEASONS, ACTIVE_SEASON_ID, buildDefaultLevelUnlocks, DEFAULT_SOVEREIGN_CONFIG } from '../constants';
import { ITEMS_DB, GOLD_PACKS, CODEXES, XP_BOOSTS, ItemCategory, ItemDef, resolveItemDef } from '../constants/items';
import { BIOLOGICAL_MACHINE_CODEX } from '../data/initialCodex';
import { NOBILITY_RANKS, RANK_REWARDS } from '../constants/nobility';
import { supabase } from '../supabaseClient';
import { ORACLE_MODES } from '../constants/oracle';
import { SupabaseService } from '../services/SupabaseService';
import { rateLimiter } from '../services/SimpleRateLimiter';
import type { Session } from '@supabase/supabase-js';
import { useCodexBuilder } from './CodexBuilderContext';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

// --- Universal Supabase Data Mappers ---

const mapToCamelCase = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(v => mapToCamelCase(v));
    if (obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));
            result[camelKey] = mapToCamelCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

const mapToSnakeCase = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(v => mapToSnakeCase(v));
    if (obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            result[snakeKey] = mapToSnakeCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);


const TUTORIAL_ACTION_ID = 'action_tutorial_01';

export const STORAGE_KEY_PROFILE = 'gol_user_profile_v2';
export const STORAGE_KEY_ASSET_LEVELS = 'gol_asset_levels_v2';
export const STORAGE_KEY_CAMPAIGNS = 'gol_campaigns_v2';

export const PROFILE_FLAG_TERMS_ACCEPTED = '__flag_terms_accepted_v1';
export const PROFILE_FLAG_TERMS_PENDING = '__flag_terms_pending_v1';
export const PROFILE_FLAG_TUTORIAL_COMPLETED = '__flag_tutorial_completed_v1';

const TUTORIAL_ACTION: Action = {
    id: TUTORIAL_ACTION_ID,
    arenaId: 'arena_outros',
    name: 'Missão: Concluir Tutorial de Iniciação',
    icon: '🎓',
    duration: 15,
    repetitions: 1,
    actionType: 'Marco',
    difficulty: 1,
};

const isNewUserCheck = () => true;

const CLAN_RANKS: ClanRank[] = [
    { id: 'feudo', name: 'Feudo', expRequired: 0 },
    { id: 'bastiao', name: 'Bastião', expRequired: 10000 },
    { id: 'provincia', name: 'Província', expRequired: 50000 },
    { id: 'principado', name: 'Principado', expRequired: 150000 },
    { id: 'reino', name: 'Reino', expRequired: 400000 },
    { id: 'dinastia', name: 'Dinastia', expRequired: 1000000 },
    { id: 'imperio', name: 'Império', expRequired: 2500000 },
];


const DEFAULT_USER_PROFILE: UserProfile = {
    id: 'placeholder_user',
    nickname: 'Soberano',
    level: 1,
    avatarUrl: '',
    border: 'default',
    backgroundUrl: '',
    isOnline: false,
    visibleWidgets: [],
    sovereign: DEFAULT_SOVEREIGN_CONFIG,
    nobility: { exp: 0, rankId: 'vagante' },
    mood: 50,
    role: 'user',
    isPremium: false,
    skin: 'GOLD',
    unlockedSkins: { GOLD: true },
    inventory: [],
    wallet: { gold: 0, fragments: 0 },
    unlockedItems: {
        bodyStyles: {},
        hairStyles: {},
        outfits: {},
        head_under_items: {},
        helmets: {},
        head_over_items: {},
        artifacts: {},
        codexes: {},
        skins: {},
        borders: {},
        banners: {},
        glyphs: {},
        auras: {},
        orbs: {},
        plates: {},
        ornament: {},
    },
    completedSeasonMissions: []
};

const defaultChecklistItems: ChecklistItem[] = [];

const DEFAULT_FRIENDS: UserProfile[] = [
    { ...DEFAULT_USER_PROFILE, id: 'friend_01', nickname: 'Nexus', avatarUrl: 'https://picsum.photos/seed/friend01/100/100', sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, body: 'body_fem_1', hairStyle: 'parted', hairColor: '#B8860B', outfit: 'lab_coat', head_under: 'glasses' }, isOnline: true, role: 'user' },
    { ...DEFAULT_USER_PROFILE, id: 'friend_02', nickname: 'Zypher', avatarUrl: 'https://picsum.photos/seed/friend02/100/100', sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, hairStyle: 'mullet', hairColor: '#FFFFFF', skinTone: '#C68642', outfit: 'silver_armor', helmet: 'silver_helm' }, isOnline: false, role: 'user' },
]

type TaskPoolItem = {
    actionId: string;
    unlimited?: boolean;
}

export type ArenaSetupChange = {
    id: string;
    status: 'renew' | 'archive' | 'delete';
    updatedData?: Partial<Pick<Arena, 'name' | 'description' | 'icon'>>;
};


const getTodayString = () => new Date().toISOString().split('T')[0];
const SITREP_BONUS_A = 60;
const SITREP_BONUS_S = 120;

const createDefaultDailyCommitment = (): DailyCommitment => ({
    date: getTodayString(),
    taskIds: [],
    stage: 'planning',
    score: null,
    expDeposited: null,
    sitrepBonus: null,
});

const createDefaultAssets = (newUser: boolean) => {
    const defaultAssets = JSON.parse(JSON.stringify(ASSETS_DATA));
    if (newUser) {
        const geralAsset = defaultAssets.find((a: Asset) => a.id === 'geral');
        if (geralAsset) {
            const outrosArena = geralAsset.arenas.find((ar: Arena) => ar.id === 'arena_outros');
            if (outrosArena && !outrosArena.actionIds.includes(TUTORIAL_ACTION_ID)) {
                outrosArena.actionIds.push(TUTORIAL_ACTION_ID);
            }
        }
    }
    return defaultAssets;
};

const createDefaultActions = (newUser: boolean): Action[] => {
    const defaultActions: Action[] = [];
    if (newUser) {
        return [...defaultActions, TUTORIAL_ACTION];
    }
    return defaultActions;
};

interface EndCycleResult {
    report: Report;
    expGained: number;
}

export interface CodexCatalogItem {
    id: string;
    title: string;
    description: string;
    author_name: string;
    price_brl: number;
    is_premium: boolean;
    cover_image?: string;
    duration_days: number;
    created_at: string;
    template: any; // Using 'any' for now, ideally strictly typed
}

export interface UserCodex {
    id: string;
    owner_id: string;
    name: string;
    description: string;
    author: string;
    price: number;
    template: any;
    created_at: string;
}

export interface GameContextType {
  isNewUser: boolean;
  assets: Asset[];
  arenaFolders: ArenaFolder[];
  actions: Action[];
  tasks: ScheduledTask[];
  taskPool: TaskPoolItem[];
  checklistItems: ChecklistItem[];
  userProfile: UserProfile;
  friends: UserProfile[];
  friendRequestsIncoming: FriendRequest[];
  friendRequestsOutgoing: FriendRequest[];
  clanJoinRequestsIncoming: ClanJoinRequest[];
  clanJoinRequestsOutgoing: ClanJoinRequest[];
  reports: Report[];
  nobilityRanks: NobilityRank[];
  clan: Clan | null;
  clanRanks: ClanRank[];
  enrichedClanMembers: EnrichedClanMember[];
  activeCycle: Cycle | null;
  dailyCommitment: DailyCommitment;
  achievementUnlocked: { type: FeedEventType; data: any; } | null;
  seasons: Season[];
  seasonMissions: SeasonMission[];
  seasonQuests: SeasonQuest[];
  clanQuestProgress: Record<string, Record<string, number>>;
  clanQuestParticipants: Record<string, number>;
  getClanQuestProgress: (questId: string) => number;
  getClanQuestForActionName: (actionName?: string) => SeasonQuest | null;
  getClanQuestsForArena: (arena: Arena, arenaActions: Action[]) => SeasonQuest[];
  fetchClanQuestParticipants: (questId: string, actionName: string) => Promise<void>;
  userMissionParticipations: Record<string, boolean>;
  joinClanMission: (questId: string) => Promise<void>;
  updateClanMissionProgress: (questId: string, increment: number) => Promise<void>;
  leaveClanMission: (questId: string) => Promise<void>;
  getUserPublicData: (userId: string) => Promise<{ profile: UserProfile | null, clan: Clan | null, clanRank: ClanRank | undefined, slots: Slot[] }>;
  levelUnlocks: LevelUnlocks;
  setAchievementUnlocked: (achievement: { type: FeedEventType; data: any; } | null) => void;
  updateLevelUnlocks: (next: LevelUnlocks) => void;
  grantUserUnlock: (category: UnlockCategory, itemId: string) => void;
  addCompletedMission: (mission: SeasonMission) => void;
  acceptSeasonQuest: (questId: string) => void;
  abortSeasonQuest: (questId: string) => Promise<void>;
  claimSeasonQuest: (questId: string) => void;
  claimSeasonMission: (missionId: string) => Promise<void>;
  addProfileFlag: (flag: string) => void;
  feed: FeedEvent[];
  addFeedEvent: (eventData: Pick<FeedEvent, 'type' | 'content'>) => void;
  updateAssetSlotValue: (assetId: string, slotId: string, value: SlotValue) => void;
  getArenas: () => Arena[];
  addArena: (assetId: string, arenaData: Pick<Arena, 'name' | 'description' | 'icon'>, skipDb?: boolean) => Promise<Arena>;
  updateArena: (arenaId: string, arenaData: Partial<Pick<Arena, 'name' | 'description' | 'icon' | 'folderId' | 'isArchived'>>) => void;
  deleteArena: (arenaId: string) => void;
  createArenaFolder: (name: string, icon: string, assetId?: string) => Promise<ArenaFolder | null>;
  updateArenaFolder: (folderId: string, data: Partial<ArenaFolder>) => Promise<void>;
  deleteArenaFolder: (folderId: string) => Promise<void>;
  moveArenaToFolder: (arenaId: string, folderId: string | null) => Promise<void>;
  reorderArena: (arenaId: string, newIndex: number | string, side?: 'left' | 'right') => Promise<void>;
  reorderArenaPriority: (arenaId: string, priority: 'alta' | 'media' | 'baixa', newIndex: number | string) => Promise<void>;
  reorderEntity: (draggedId: string, draggedType: 'arena' | 'campaign', targetId: string, targetType: 'arena' | 'campaign', side?: 'left' | 'right') => Promise<void>;
  reorderEntityPriority: (draggedId: string, draggedType: 'arena' | 'campaign', priority: 'alta' | 'media' | 'baixa', targetId?: string) => Promise<void>;
  arenasViewMode: ArenasViewMode;
  setArenasViewMode: (mode: ArenasViewMode) => Promise<void>;
  reorderAction: (arenaId: string, actionId: string, newIndex: number) => void;
  getActionsForArena: (arenaId: string) => Action[];
  getAssetForAction: (actionId: string) => Asset | undefined;
  getActionBackgroundStyle: (actionId: string) => React.CSSProperties;
  addAction: (actionData: Omit<Action, 'id'>) => Promise<Action>;
  updateAction: (actionId: string, actionData: Partial<Action>) => void;
  deleteAction: (actionId: string) => void;
  scheduleTask: (actionOrId: string | Action, date: string, startTime: number) => Promise<ScheduledTask | undefined>;
  scheduleMultipleTasks: (actionOrId: string | Action, daysOfWeek: DayOfWeek[], startTimeInMinutes: number) => Promise<void>;
  scheduleAndCompleteNow: (actionId: string) => void;
  scheduleAndCompleteMilestoneNow: (actionId: string) => void;
  returnTaskToPool: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  getTasksForDate: (date: Date) => ScheduledTask[];
  rescheduleTask: (taskId: string, newDate: string, newStartTime: number) => void;
  updateTask: (taskId: string, updates: Partial<ScheduledTask>) => void;
  toggleTaskCompletion: (taskId: string) => void;
  completeTutorialMission: () => void;
  toggleChecklistItem: (id: string) => void;
  addChecklistItem: (text: string) => void;
  updateChecklistItem: (id: string, text: string) => void;
  deleteChecklistItem: (id: string) => void;
  updateUserProfile: (profileData: Partial<UserProfile>) => void;
  updateMood: (mood: number) => void;
  setCurrentSkin: (skinId: string) => void;
  addFriend: (nickname: string) => void;
  searchPlayers: (query: string) => Promise<UserProfile[]>;
  sendFriendRequest: (recipientId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  updateAllAssetLevels: (levels: Record<string, number>, levelDescriptions?: Record<string, string[]>) => boolean;
  startCycle: (name: string, endDate: string) => void;
  endCycle: (currentAssets: Asset[], currentActions: Action[]) => EndCycleResult;
  applyExp: (expGained: number) => void;
  addChest: (chestType: ChestType) => Promise<void>;
  startNewCycle: (arenaChanges: ArenaSetupChange[], cycleDetails: { name: string; endDate: string; }) => void;
  setDailyCommitment: (taskIds: string[]) => void;
  lockDailyCommitment: () => void;
  endDailyBattle: () => void;
  resetDailyCommitment: () => void;
  openChest: (chestType: ChestType) => Promise<boolean>;
  createClan: (clanDetails: Omit<Clan, 'id' | 'exp' | 'rankId'>) => Promise<void>;
  updateClan: (clanId: string, data: Partial<Pick<Clan, 'name' | 'icon' | 'description' | 'backgroundUrl'>>) => Promise<void>;
  leaveClan: () => Promise<void>;
  transferLeadershipAndLeave: (newLeaderId: string) => Promise<void>;
  deleteClan: () => Promise<void>;
  kickClanMember: (memberId: string) => Promise<void>;
  addClanMember: (memberId: string) => Promise<void>;
  searchClans: (query: string) => Promise<Clan[]>;
  joinClan: (clanToJoin: Clan) => Promise<void>;
  approveClanJoinRequest: (request: ClanJoinRequest) => Promise<void>;
  rejectClanJoinRequest: (request: ClanJoinRequest) => Promise<void>;
  addSeason: (seasonData: Omit<Season, 'id'>) => Promise<void>;
  updateSeason: (seasonId: string, seasonData: Partial<Omit<Season, 'id'>>) => Promise<void>;
  addSeasonMission: (missionData: Omit<SeasonMission, 'id'>) => Promise<void>;
  manualCloseSITREP: () => void;
  saveSanctuaryPosition: (payload: { clanId: string; userId: string; row: number; col: number; area: string; action: string; timestamp: string }) => Promise<void>;
  getSanctuaryPositionsForClan: (clanId: string) => Promise<Record<string, { row: number; col: number; area: string; action: string; timestamp: string }>>;
  getSanctuaryAreaStats: (clanId: string) => Promise<Record<string, { totalSeconds: number; lastUpdated: string }>>;
  updateSanctuaryAreaTime: (clanId: string, area: string, seconds: number) => Promise<void>;
  applySanctuaryAreaDecay: (clanId: string, occupancy: Record<string, number>, totalMembers?: number) => Promise<void>;
  loadClanAndMembers: (clanId: string, force?: boolean) => Promise<void>;
  oraclePreferences: OraclePreferences | null;
  updateOraclePreferences: (prefs: Partial<OraclePreferences>) => Promise<void>;
  oracleMessages: OracleMessage[];
  markOracleMessageAsRead: (messageId: string) => Promise<void>;
  triggerOracle: (triggerType?: 'app_open' | 'cron' | 'manual') => Promise<void>;
  
  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  
  // Direct Messages
  directMessages: DirectMessage[];
  dmConversations: DMConversation[];
  sendDirectMessage: (recipientId: string, content: string) => Promise<void>;
  markDMAsRead: (senderId: string) => Promise<void>;
  fetchDMs: () => Promise<void>;

  // Aldeia
  getAldeiaSlots: (clanId: string) => Promise<AldeiaSlot[]>;
  updateAldeiaSlot: (clanId: string, slotId: AldeiaSlotId, updates: Partial<AldeiaSlot>) => Promise<void>;
  getAldeiaPresence: (clanId: string) => Promise<AldeiaPresence[]>;
  enterAldeiaSlot: (clanId: string, slotId: AldeiaSlotId) => Promise<void>;
  performAldeiaDailyUpdate: (clanId: string) => Promise<void>;

  showToast: (message: string) => void;
  toast: { message: string; visible: boolean; style?: React.CSSProperties };
  hideToast: () => void;
  // Forge & Store
  inventory: InventoryItem[];
  buyGoldPack: (packId: string) => Promise<void>;
  buyStoreItem: (itemId: string, type: 'premium' | 'codex' | 'exclusive' | 'boost') => Promise<void>;
  recycleItem: (instanceId: string) => Promise<void>;
  craftItem: (tier: number, category?: string, exactItemId?: string) => Promise<InventoryItem | null>;
  equipItem: (item: InventoryItem) => Promise<void>;
  toggleEquipItem: (item: InventoryItem) => Promise<void>;
  updateCustomClanMissionProgress: (missionId: string, increment: number) => Promise<void>;
  
  // Codex System
  userCodexes: UserCodex[];
  codexCatalog: CodexCatalogItem[];
  buyCodex: (catalogId: string) => Promise<void>;
  installCodex: (userCodexId: string) => Promise<void>;

  // PWA
  installPrompt: any;
  promptInstall: () => Promise<void>;

  // Campaigns
  campaigns: Campaign[];
  addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'status'>) => Promise<Campaign>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;

  // App Mode & Theme
  appMode: AppMode;
  isProfileLoaded: boolean;
  setAppMode: (mode: AppMode) => void;
  activeTheme: ThemePreference;
  toggleTheme: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode, session: Session | null }> = ({ children, session }) => {
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const userId = session?.user.id;
    if (userId) {
        try {
            const savedProfile = localStorage.getItem(`${STORAGE_KEY_PROFILE}_${userId}`);
            if (savedProfile) {
                const parsed = JSON.parse(savedProfile);
                return {
                    ...DEFAULT_USER_PROFILE,
                    ...parsed,
                    id: userId,
                    isOnline: true
                };
            }
        } catch (e) {
            console.error("Failed to load user profile from local storage:", e);
        }
    }
    return { 
      ...DEFAULT_USER_PROFILE, 
      id: userId || DEFAULT_USER_PROFILE.id,
    };
  });

  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  const isNewUser = useMemo(() => {
      return !userProfile.completedSeasonMissions?.includes(PROFILE_FLAG_TUTORIAL_COMPLETED);
  }, [userProfile.completedSeasonMissions]);

  const [arenasViewMode, setArenasViewModeState] = useState<ArenasViewMode>(() => {
    const userId = session?.user.id;
    if (userId) {
        const saved = localStorage.getItem(`${STORAGE_KEY_PROFILE}_${userId}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.arenasViewMode || 'free';
            } catch (e) {}
        }
    }
    return 'free';
  });

  const setArenasViewMode = async (mode: ArenasViewMode) => {
    setArenasViewModeState(mode);
    updateUserProfile({ arenasViewMode: mode });
  };

  useEffect(() => {
    if (userProfile?.arenasViewMode) {
        setArenasViewModeState(userProfile.arenasViewMode);
    }
  }, [userProfile?.arenasViewMode]);

  const [assets, setAssets] = useState<Asset[]>(() => {
    const defaults = createDefaultAssets(true);
    const userId = session?.user.id;
    if (userId) {
        try {
            const savedLevels = localStorage.getItem(`${STORAGE_KEY_ASSET_LEVELS}_${userId}`);
            if (savedLevels) {
                const levels = JSON.parse(savedLevels);
                return defaults.map(a => ({
                    ...a,
                    level: levels[a.id] ?? a.level
                }));
            }
        } catch (e) {
            console.error("Failed to load assets from local storage:", e);
        }
    }
    return defaults;
  });

  const [arenaFolders, setArenaFolders] = useState<ArenaFolder[]>(() => []);
  
  const [actions, setActions] = useState<Action[]>(() => {
      const userId = session?.user.id;
      let isTutorialDone = false;
      if (userId) {
          try {
              const savedProfile = localStorage.getItem(`${STORAGE_KEY_PROFILE}_${userId}`);
              if (savedProfile) {
                  const profile = JSON.parse(savedProfile);
                  if (profile.completedSeasonMissions?.includes(PROFILE_FLAG_TUTORIAL_COMPLETED)) {
                      isTutorialDone = true;
                  }
              }
          } catch (e) {}
      }
      return createDefaultActions(!isTutorialDone);
  });

  const [tasks, setTasks] = useState<ScheduledTask[]>(() => []);
  const [taskPool, setTaskPool] = useState<TaskPoolItem[]>([]);
  
  const [reports, setReports] = useState<Report[]>(() => []);
  
  const nobilityRanks = NOBILITY_RANKS;
  const clanRanks = CLAN_RANKS;
  
  const [dailyCommitment, setDailyCommitmentState] = useState<DailyCommitment>(() => createDefaultDailyCommitment());

  const [cycleExpBonus, setCycleExpBonus] = useState<number>(0);

  const [oraclePreferences, setOraclePreferences] = useState<OraclePreferences | null>(null);
  const [oracleMessages, setOracleMessages] = useState<OracleMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [dmConversations, setDMConversations] = useState<DMConversation[]>([]);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // PWA Installation State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // Campaigns State
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
      // Optimistic load from localStorage first
      const userId = session?.user.id;
      if (userId) {
          try {
              const saved = localStorage.getItem(`${STORAGE_KEY_CAMPAIGNS}_${userId}`);
              return saved ? JSON.parse(saved) : [];
          } catch (e) {
              return [];
          }
      }
      return [];
  });

  // Fetch campaigns from Supabase on load
  useEffect(() => {
      const userId = session?.user.id;
      if (userId) {
          supabase.from('campaigns').select('*').eq('user_id', userId)
              .then(({ data, error }) => {
                  if (data) {
                      const mappedCampaigns = mapToCamelCase(data);
                      setCampaigns(mappedCampaigns);
                      // Update localStorage to keep sync
                      localStorage.setItem(`${STORAGE_KEY_CAMPAIGNS}_${userId}`, JSON.stringify(mappedCampaigns));
                  }
                  if (error) console.error("Error fetching campaigns:", error);
              });
      }
  }, [session?.user.id]);

  useEffect(() => {
      const userId = session?.user.id;
      if (userId) {
          localStorage.setItem(`${STORAGE_KEY_CAMPAIGNS}_${userId}`, JSON.stringify(campaigns));
      }
  }, [campaigns, session?.user.id]);

  const addCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'status'>): Promise<Campaign> => {
      const userId = session?.user.id;
      if (!userId) throw new Error("User not authenticated");

      const newCampaign: Campaign = {
          ...campaignData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          status: 'active'
      };
      
      // Optimistic update
      setCampaigns(prev => [...prev, newCampaign]);
      
      // Persist to Supabase
      const { error } = await supabase.from('campaigns').insert(mapToSnakeCase({
          ...newCampaign,
          userId
      }));
      
      if (error) {
          console.error("Error creating campaign:", error);
          // Revert optimistic update? Or retry?
      }
      
      return newCampaign;
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      
      const { error } = await supabase.from('campaigns').update(mapToSnakeCase(updates)).eq('id', id);
      if (error) console.error("Error updating campaign:", error);
  };

  const deleteCampaign = async (id: string) => {
      setCampaigns(prev => prev.filter(c => c.id !== id));
      // Arenas are not deleted, they just lose their campaign context implicitly
      
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) console.error("Error deleting campaign:", error);
  };

  // App Mode & Theme Implementation
  const [appMode, setAppModeState] = useState<AppMode>(() => {
    const userId = session?.user.id;
    if (userId) {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY_PROFILE}_${userId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                const val = parsed.appMode;
                if (val === 'GAME' || val === 'BASIC') return val;
                if (val === 'OFFICE') return 'BASIC';
                return 'GAME';
            }
        } catch (e) {}
    }
    return 'GAME';
  });
  
  const [activeTheme, setActiveTheme] = useState<ThemePreference>(() => {
    const userId = session?.user.id;
    if (userId) {
        try {
            const saved = localStorage.getItem(`${STORAGE_KEY_PROFILE}_${userId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.themePreference || 'DARK';
            }
        } catch (e) {}
    }
    return 'DARK';
  });

  useEffect(() => {
    if (userProfile?.appMode) {
        setAppModeState(userProfile.appMode);
    }
    if (userProfile?.themePreference) {
        setActiveTheme(userProfile.themePreference);
    }
  }, [userProfile?.appMode, userProfile?.themePreference]);

  const setAppMode = useCallback(async (mode: AppMode) => {
      setAppModeState(mode);
      if (userProfile) {
          // Optimistic update
          updateUserProfile({ appMode: mode });
          
          // Persist
          const { error } = await supabase
              .from('user_profiles')
              .update({ app_mode: mode })
              .eq('id', userProfile.id);
              
          if (error) console.error('Error updating app mode:', error);
      }
  }, [userProfile]);

  const toggleTheme = useCallback(async () => {
      const newTheme = activeTheme === 'DARK' ? 'LIGHT' : 'DARK';
      setActiveTheme(newTheme);
      
      if (userProfile) {
          updateUserProfile({ themePreference: newTheme });
          
          const { error } = await supabase
              .from('user_profiles')
              .update({ theme_preference: newTheme })
              .eq('id', userProfile.id);
              
          if (error) console.error('Error updating theme:', error);
      }
  }, [activeTheme, userProfile]);

  const showToast = useCallback((message: string) => {
      setToast({ message, visible: true });
  }, []);

  const hideToast = useCallback(() => {
      setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const fetchOraclePreferences = useCallback(async (userId: string) => {
      const { data, error } = await supabase
          .from('oracle_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error("Error fetching oracle preferences:", error);
          return;
      }

      if (data) {
          setOraclePreferences(mapToCamelCase(data));
      } else {
          // Default preferences
          const defaultPrefs: OraclePreferences = {
              userId,
              iaEnabled: true,
              notificationsEnabled: true,
              animationsEnabled: true,
              soundsEnabled: true,
              hapticsEnabled: true,
              enabledCategories: ['frases_inspiradoras', 'reflexoes_filosoficas', 'fragmentos_sabedoria', 'dicas_produtividade', 'rituais_lifestyle', 'provocacoes'],
              activeMode: 'neutro',
              quietHoursStart: '22:00',
              quietHoursEnd: '07:00',
              updatedAt: new Date().toISOString()
          };
          
          // Insert default
          const { error: insertError } = await supabase.from('oracle_preferences').insert(mapToSnakeCase(defaultPrefs));
          if (!insertError) {
              setOraclePreferences(defaultPrefs);
          }
      }
  }, []);

  const updateOraclePreferences = async (prefs: Partial<OraclePreferences>) => {
      const userId = getSupabaseUserId();
      if (!userId) return;

      const newPrefs = { ...oraclePreferences, ...prefs, updatedAt: new Date().toISOString() };
      // Optimistic update
      setOraclePreferences(newPrefs as OraclePreferences);

      const { error } = await supabase
          .from('oracle_preferences')
          .upsert(mapToSnakeCase({ ...newPrefs, userId }));

      if (error) {
          console.error("Error updating oracle preferences:", error);
          // Revert? For now, we assume it works or user refreshes.
      }
  };

  const fetchOracleMessages = useCallback(async (userId: string) => {
      const { data, error } = await supabase
          .from('oracle_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

      if (error) {
          console.error("Error fetching oracle messages:", error);
          return;
      }

      if (data) {
          setOracleMessages(mapToCamelCase(data));
      }
  }, []);

  const markOracleMessageAsRead = async (messageId: string) => {
      setOracleMessages(prev => prev.map(m => m.id === messageId ? { ...m, read: true } : m));
      
      const { error } = await supabase
          .from('oracle_messages')
          .update({ read: true })
          .eq('id', messageId);
          
      if (error) {
          console.error("Error marking message as read:", error);
      }
  };

  const triggerOracle = async (triggerType: 'app_open' | 'cron' | 'manual' = 'app_open') => {
      const userId = getSupabaseUserId();
      if (!userId || !oraclePreferences?.iaEnabled) return;

      // API Key (Hardcoded as per instructions found in codebase)
      const API_KEY = "AIzaSyAryjNyDFBRrwfvsHdQWvUTCRm1-yx83zo";

      // 1. Check Quiet Hours (if not manual)
      if (triggerType !== 'manual') {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const [startH, startM] = (oraclePreferences.quietHoursStart || '22:00').split(':').map(Number);
          const [endH, endM] = (oraclePreferences.quietHoursEnd || '07:00').split(':').map(Number);
          
          const start = startH * 60 + startM;
          const end = endH * 60 + endM;
          
          let isQuiet = false;
          if (start > end) { // Spans midnight (e.g. 22:00 to 07:00)
              isQuiet = currentTime >= start || currentTime < end;
          } else {
              isQuiet = currentTime >= start && currentTime < end;
          }
          
          if (isQuiet) {
              console.log("Oracle is in quiet hours.");
              return;
          }
      }

      // 2. Check Daily Limits
      const today = new Date().toISOString().split('T')[0];
      const todayMessages = oracleMessages.filter(m => m.createdAt.startsWith(today) && m.deliveryType === 'feed');
      const isPremium = userProfile.isPremium || userProfile.role === 'admin' || userProfile.role === 'gm';
      const limit = isPremium ? 6 : 3;
      
      if (todayMessages.length >= limit && triggerType !== 'manual') {
          console.log("Oracle daily limit reached.");
          return;
      }
      
      // 3. Minimum Time Between Messages (2 hours)
      if (todayMessages.length > 0 && triggerType !== 'manual') {
          const lastMsg = new Date(todayMessages[0].createdAt).getTime();
          const now = new Date().getTime();
          const hoursSinceLast = (now - lastMsg) / (1000 * 60 * 60);
          if (hoursSinceLast < 2) {
              console.log("Oracle resting (min 2h).");
              return;
          }
      }

      // 4. Select Category (Greeting Logic)
      let category: string = 'frases_inspiradoras';
      const now = new Date();
      const hour = now.getHours();
      
      const totalChests = userProfile.chests?.reduce((acc: any, c: any) => acc + c.count, 0) || 0;
      
      if (totalChests > 0) {
          category = 'dicas_produtividade'; // Context will show chests, AI should pick it up
      } else if (!activeCycle) {
          category = 'dicas_produtividade'; // Suggest cycle
      } else if (assets.every(a => a.arenas.length === 0)) {
          category = 'dicas_produtividade'; // Suggest arena
      } else {
          if (hour >= 6 && hour < 12) category = 'frases_inspiradoras';
          else if (hour >= 12 && hour < 18) category = 'dicas_produtividade';
          else if (hour >= 18 && hour < 22) category = 'reflexoes_filosoficas'; // Reflexão
          else category = 'fragmentos_sabedoria'; // Madrugada
      }
      
      // Ensure category is enabled and add variety
      const enabled = oraclePreferences.enabledCategories || [];
      
      // 30% chance to pick a random enabled category for variety (if not empty)
      if (enabled.length > 0 && Math.random() < 0.3) {
          category = enabled[Math.floor(Math.random() * enabled.length)];
      } else if (enabled.length > 0 && !enabled.includes(category as any)) {
          // Fallback if the time-based category is disabled
          category = enabled[Math.floor(Math.random() * enabled.length)];
      }

      // 5. Build Context
      let timeOfDay: "madrugada" | "manhã" | "tarde" | "noite" = "manhã";
      if (hour >= 0 && hour < 6) timeOfDay = "madrugada";
      else if (hour >= 6 && hour < 12) timeOfDay = "manhã";
      else if (hour >= 12 && hour < 18) timeOfDay = "tarde";
      else timeOfDay = "noite";

      const contextData: OracleContext = {
          currentTime: now.toISOString(),
          timeOfDay,
          hasCycle: !!activeCycle,
          cycleDayNumber: activeCycle ? Math.floor((now.getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) : null,
          cycleTotalDays: activeCycle ? Math.floor((new Date(activeCycle.endDate).getTime() - new Date(activeCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) : null,
          cycleCompletionPercent: null,
          hasArenas: assets.some(a => a.arenas.length > 0),
          totalArenas: assets.reduce((acc, a) => acc + a.arenas.length, 0),
          arenaNames: assets.flatMap(a => a.arenas.map(ar => ar.name)),
          staleArenas: [],
          completedActionsInCycle: 0,
          pendingActionsToday: tasks.filter(t => t.date === now.toISOString().split('T')[0] && !t.completed).length,
          overdueActions: 0,
          activeMode: oraclePreferences.activeMode,
          customModeInstructions: oraclePreferences.customModeInstructions || null,
          enabledCategories: oraclePreferences.enabledCategories || [],
          username: userProfile.nickname,
          level: userProfile.level,
          sephirotLevels: assets.reduce((acc, a) => ({ ...acc, [a.name]: a.level }), {}),
          clanName: clan?.name || null,
          seasonName: null,
          pendingChests: totalChests
      };

      // 6. Generate Prompt
      // Dynamic Mode Selection based on Category (The "Speak for All" Logic)
      let selectedMode = oraclePreferences.activeMode;
      
      if (oraclePreferences.activeMode !== 'personalizado') {
          switch (category) {
              case 'dicas_produtividade':
                  selectedMode = 'coach'; // Coach cobra produtividade
                  break;
              case 'frases_inspiradoras':
                  selectedMode = 'calmo'; // Inspiração serena
                  break;
              case 'reflexoes_filosoficas':
              case 'fragmentos_sabedoria':
                  selectedMode = 'reflexivo'; // Filósofo reflete
                  break;
              case 'rituais_lifestyle':
                  selectedMode = 'calmo'; // Lifestyle pede calma
                  break;
              case 'provocacoes':
                  selectedMode = 'tatico'; // Provocação direta
                  break;
              case 'analise_padroes':
                  selectedMode = 'estrategico'; // Análise pede estratégia
                  break;
              case 'sussurros_maestria':
                  selectedMode = 'neutro'; // Mistério
                  break;
              default:
                  selectedMode = oraclePreferences.activeMode;
          }
      }

      const modeConfig = ORACLE_MODES[selectedMode] || ORACLE_MODES['neutro'];
      const systemPrompt = modeConfig.systemPromptTemplate(contextData);
      
      const userPrompt = `Gere uma mensagem curta (máximo 3 frases) para o feed do usuário.
      Categoria solicitada: ${category}
      Contexto atual: ${JSON.stringify(contextData)}
      `;

      // 7. Call AI
      try {
          const google = createGoogleGenerativeAI({
              apiKey: API_KEY
          });
          
          const { text } = await generateText({
              model: google('models/gemini-3-flash-preview'),
              system: systemPrompt,
              prompt: userPrompt,
          });

          // 8. Save and Update
          const newMessage: OracleMessage = {
              id: crypto.randomUUID(),
              userId,
              category: category as any,
              content: text,
              mode: selectedMode, // Save the dynamic mode
              deliveryType: 'feed',
              read: false,
              createdAt: new Date().toISOString()
          };
          
          setOracleMessages(prev => [newMessage, ...prev]);
          await supabase.from('oracle_messages').insert(mapToSnakeCase(newMessage));
          
          console.log("Oracle generated message:", text);

      } catch (error) {
          console.error("Oracle AI generation failed:", error);
      }
  };

  // --- Notifications Implementation ---
  const fetchNotifications = useCallback(async () => {
      const userId = session?.user.id;
      if (userId) {
          const data = await SupabaseService.getNotifications(userId);
          setNotifications(data);
      }
  }, [session?.user.id]);

  const markNotificationRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await SupabaseService.markNotificationRead(id);
  };

  const deleteNotification = async (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await SupabaseService.deleteNotification(id);
  };

  useEffect(() => {
      const userId = session?.user.id;
      if (userId && isUuid(userId)) {
          fetchOraclePreferences(userId);
          fetchOracleMessages(userId);
          fetchNotifications();
      } else {
          setOraclePreferences(null);
          setOracleMessages([]);
          setNotifications([]);
      }
  }, [session?.user.id, fetchOraclePreferences, fetchOracleMessages, fetchNotifications]);

  // --- FORGE SYSTEM ---
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const fetchInventory = useCallback(async (userId: string) => {
      const { data, error } = await supabase.from('user_inventory').select('*').eq('user_id', userId);
      if (error) {
          console.error("Error fetching inventory:", error);
          return;
      }

      // Auto-grant Starter Pack (T1 Items) if inventory is empty
      if ((!data || data.length === 0)) {
          console.log("Inventory empty. Granting Starter Pack (v1.006)...");
          
          // IDs definidos no LOJA.MD e items.ts
          const starterItemIds = [
              'item_skin_1_001', // Náufrago
              'cachos',          // Cabelo 1
              'medio_reto',      // Cabelo 2
              'grunge_longo',    // Cabelo 3
              'textured_crop',   // Cabelo 4
              'item_orb_1_002',  // Orbe de Cobre
              'item_plate_1_001', // Placa Madeira
              'BASIC'            // Tema Básico
          ];

          const starterItems = ITEMS_DB.filter(i => starterItemIds.includes(i.id));
          
          if (starterItems.length > 0) {
              const toInsert = starterItems.map(i => ({
                  user_id: userId,
                  item_id: i.id
              }));
              
              const { error: insertError } = await supabase.from('user_inventory').insert(toInsert);
              
              if (!insertError) {
                   // Grant initial chests
                   await addChest('Comum');
                   await addChest('Skin Comum');

                   // Set initial rank and exp if needed (Vagante Level 1)
                   // O level do usuário é a soma dos níveis dos assets.
                   // Vamos garantir que o perfil comece com os dados corretos.
                   updateUserProfile({ 
                       nobility: { exp: 0, rankId: 'vagante' },
                       level: 1 // Forçar nível 1 inicial
                   });

                   const newItems = starterItems.map(i => ({
                       id: i.id,
                       instanceId: 'temp_' + i.id, 
                       acquiredAt: new Date().toISOString(),
                       isEquipped: false
                   }));
                   setInventory(newItems);
                   return; 
              } else {
                  console.error("Error granting starter pack:", insertError);
              }
          }
      }

      const items = data ? data.map((row: any) => {
          const resolvedDef = resolveItemDef(row.item_id);
          const resolvedId = resolvedDef?.id || row.item_id;
          return {
              id: resolvedId,
              instanceId: row.id,
              acquiredAt: row.acquired_at,
              isEquipped: row.is_equipped
          };
      }) : [];
      setInventory(items);
  }, []);

  // Sync inventory state to userProfile to ensure consistency
  useEffect(() => {
      if (session?.user.id && userProfile.id === session.user.id) {
          setUserProfile(prev => {
              // Deep comparison to avoid infinite loops
              if (JSON.stringify(prev.inventory) !== JSON.stringify(inventory)) {
                  return { ...prev, inventory: [...inventory] };
              }
              return prev;
          });
      }
  }, [inventory, session?.user.id, userProfile.id]);

  useEffect(() => {
      const userId = session?.user.id;
      if (userId && isUuid(userId)) {
          fetchInventory(userId);
      } else {
          setInventory([]);
      }
  }, [session?.user.id, fetchInventory]);

  const buyGoldPack = async (packId: string) => {
      const pack = GOLD_PACKS.find(p => p.id === packId);
      if (!pack) return;
      const userId = getSupabaseUserId();
      if (!userId) return;

      const { data, error } = await supabase.rpc('buy_gold_pack', {
          p_pack_id: packId,
          p_amount_gold: pack.total,
          p_cost_brl: pack.price
      });

      if (error) {
          console.error("Error buying gold pack:", error);
          showToast("Erro ao processar compra.");
          return;
      }
      
      if (data && data.success) {
          updateUserProfile({ wallet: { ...userProfile.wallet, gold: data.new_gold } });
          showToast(`Compra de ${pack.name} realizada! +${pack.total} Ouro.`);
      }
  };

  const buyStoreItem = async (itemId: string, type: 'premium' | 'codex' | 'exclusive' | 'boost') => {
      const userId = getSupabaseUserId();
      if (!userId) return;
      
      let cost = 0;
      let name = '';
      
      if (type === 'codex') {
          const item = CODEXES.find(c => c.id === itemId);
          if (!item) return;
          cost = item.cost;
          name = item.name;
      } else if (type === 'exclusive') {
          const item = ITEMS_DB.find(i => i.id === itemId);
          if (!item || !item.costGold) return;
          cost = item.costGold;
          name = item.name;
      } else if (type === 'boost') {
          const item = XP_BOOSTS.find(b => b.id === itemId);
          if (!item) return;
          cost = item.cost;
          name = item.name;
      } else if (type === 'premium') {
          cost = 200;
          name = 'Premium Mensal';
      }

      if ((userProfile.wallet?.gold || 0) < cost) {
          showToast("Ouro insuficiente!");
          return;
      }

      const { data, error } = await supabase.rpc('buy_store_item', {
          p_item_id: itemId,
          p_cost_gold: cost,
          p_type: type
      });

      if (error) {
          console.error("Error buying store item:", error);
          showToast("Erro ao comprar item.");
          return;
      }

      // Update Local State Optimistically or Refetch
      const newGold = (userProfile.wallet?.gold || 0) - cost;
      updateUserProfile({ wallet: { ...userProfile.wallet, gold: newGold } });

      if (type === 'exclusive') {
          // Re-fetch inventory to get the new item
          fetchInventory(userId);
      } else if (type === 'codex') {
          grantUserUnlock('codexes', itemId);
      } else if (type === 'premium') {
          updateUserProfile({ isPremium: true });
      }
      
      showToast(`Compra de ${name} realizada com sucesso!`);
  };

  const recycleItem = async (instanceId: string) => {
      const userId = getSupabaseUserId();
      if (!userId) return;
      
      const { data, error } = await supabase.rpc('recycle_item', {
          p_item_instance_id: instanceId
      });

      if (error) {
          console.error("Error recycling:", error);
          showToast("Erro ao reciclar item.");
          return;
      }

      if (data && data.success) {
          // Update Local Inventory
          setInventory(prev => prev.filter(i => i.instanceId !== instanceId));
          // Update Fragments
          const newFragments = (userProfile.wallet?.fragments || 0) + data.fragments_gained;
          updateUserProfile({ wallet: { ...userProfile.wallet, fragments: newFragments } });
      }
  };

  const craftItem = async (tier: number, category?: string, exactItemId?: string) => {
      const userId = getSupabaseUserId();
      if (!userId) return null;

      const { data, error } = await supabase.rpc('craft_item', {
          p_tier: tier,
          p_category: category,
          p_exact_item_id: exactItemId
      });

      if (error) {
          console.error("Error crafting:", error);
          showToast("Erro ao forjar item: " + error.message);
          return null;
      }

      if (data && data.success) {
           // Update Fragments (we could optimize this by returning new balance from RPC)
           // For now, we estimate or refetch. Let's refetch profile to be safe or calc locally.
           // Since we don't have cost in response, we use local cost consts to update UI optimistically
           let cost = 0;
           if (tier === 1) cost = 40;
           else if (tier === 2) cost = 120;
           else if (tier === 3) cost = 400;
           else if (tier === 4) cost = 1200;
           else if (tier === 5) cost = 4000;
           
           const newFragments = (userProfile.wallet?.fragments || 0) - cost;
           updateUserProfile({ wallet: { ...userProfile.wallet, fragments: newFragments } });

           const craftedDef = resolveItemDef(data.item_id);
           const craftedId = craftedDef?.id || data.item_id;
           const newItem: InventoryItem = { 
               id: craftedId, 
               instanceId: data.instance_id, 
               acquiredAt: new Date().toISOString(), 
               isEquipped: false 
            };
           setInventory(prev => [...prev, newItem]);
           return newItem;
      }
      return null;
  };

  const equipItem = async (item: InventoryItem) => {
      // Unequip Logic
      if (item.id === 'none') {
          // Find what category the original item belonged to, or pass it explicitly.
          // Since we passed { ...item, id: 'none' }, 'item' here has the instanceId but 'none' id.
          // This is tricky because we need the category to know what slot to clear.
          // Let's refactor: pass the *original* item to equipItem, and a separate 'unequip' flag or let equipItem toggle.
          // BUT, to keep signature simple, let's assume if we are un-equipping, we handle it by checking current state against item.id
          return; 
      }

      // Re-implementing with Toggle logic support in mind
      // The caller (Inventory.tsx) is now calling equipItem({ ...item, id: 'none' }) for unequip.
      // But we need the category.
      // Let's change the strategy: Inventory.tsx calls unequipItem() instead.
  };

  const toggleEquipItem = async (item: InventoryItem) => {
      const itemDef = ITEMS_DB.find(d => d.id === item.id);
      if (!itemDef) return;

      const isCurrentlyEquipped = (
          (itemDef.category === 'border' && userProfile.border === item.id) ||
          (itemDef.category === 'ui_skin' && userProfile.skin === item.id) ||
          (itemDef.category === 'skin' && userProfile.sovereign.outfit === item.id) ||
          (itemDef.category === 'hair' && userProfile.sovereign.hairStyle === item.id) ||
          (itemDef.category === 'glyph' && userProfile.sovereign.glyph === item.id) ||
          (itemDef.category === 'aura' && userProfile.sovereign.aura === item.id) ||
          (itemDef.category === 'orb' && userProfile.sovereign.orb === item.id) ||
          (itemDef.category === 'plate' && [userProfile.sovereign.sovereignPlate, userProfile.sovereign.artifactPlate, userProfile.sovereign.glyphPlate].includes(item.id)) ||
          (itemDef.category === 'banner' && userProfile.bannerUrl === itemDef.imageUrl)
      );

      if (isCurrentlyEquipped) {
          // Unequip
          if (itemDef.category === 'border') {
              updateUserProfile({ border: 'default' });
          } else if (itemDef.category === 'ui_skin') {
              updateUserProfile({ skin: 'GOLD' }); // Default skin
              showToast('Skin de Interface removida. Tema padrão restaurado.');
          } else if (itemDef.category === 'banner') {
              updateUserProfile({ bannerUrl: '' });
          } else {
              const newSovereign = { ...userProfile.sovereign };
              if (itemDef.category === 'skin') newSovereign.outfit = 'none';
              if (itemDef.category === 'hair') newSovereign.hairStyle = 'none';
              if (itemDef.category === 'glyph') newSovereign.glyph = 'none';
              if (itemDef.category === 'aura') newSovereign.aura = 'none';
              if (itemDef.category === 'orb') newSovereign.orb = 'none';
              if (itemDef.category === 'plate') {
                  if (userProfile.sovereign.primaryDisplay === 'item') newSovereign.artifactPlate = 'none';
                  else if (userProfile.sovereign.primaryDisplay === 'glyph') newSovereign.glyphPlate = 'none';
                  else newSovereign.sovereignPlate = 'none';
              }
              updateUserProfile({ sovereign: newSovereign });
          }
      } else {
          // Equip (Auto-unequip logic is implicit because we overwrite the single slot)
          
          if (itemDef.category === 'border') {
              updateUserProfile({ border: itemDef.id });
          } else if (itemDef.category === 'ui_skin') {
              updateUserProfile({ skin: itemDef.id });
              showToast(`Skin de Interface "${itemDef.name}" aplicada!`);
          } else if (itemDef.category === 'banner') {
              updateUserProfile({ bannerUrl: itemDef.imageUrl || '' });
          } else {
              const newSovereign = { ...userProfile.sovereign };
              if (itemDef.category === 'skin') newSovereign.outfit = itemDef.id;
              if (itemDef.category === 'hair') newSovereign.hairStyle = itemDef.id;
              if (itemDef.category === 'glyph') newSovereign.glyph = itemDef.id;
              if (itemDef.category === 'aura') newSovereign.aura = itemDef.id;
              if (itemDef.category === 'orb') newSovereign.orb = itemDef.id;
              if (itemDef.category === 'plate') {
                  if (userProfile.sovereign.primaryDisplay === 'item') newSovereign.artifactPlate = itemDef.id;
                  else if (userProfile.sovereign.primaryDisplay === 'glyph') newSovereign.glyphPlate = itemDef.id;
                  else newSovereign.sovereignPlate = itemDef.id;
              }
              updateUserProfile({ sovereign: newSovereign });
          }
      }
  };

  // Update profile when session changes and reset state (Online Only Mode)
  useEffect(() => {
    const currentUserId = session?.user.id;
    if (currentUserId && userProfile.id !== currentUserId) {
        suspendPersistenceRef.current = true;
        clanCacheRef.current = null;
        setHasHydratedFromSupabase(false);

        // Assets with Local Storage
        let loadedAssets = createDefaultAssets(true);
        try {
            const savedLevels = localStorage.getItem(`${STORAGE_KEY_ASSET_LEVELS}_${currentUserId}`);
            if (savedLevels) {
                const levels = JSON.parse(savedLevels);
                loadedAssets = loadedAssets.map(a => ({
                    ...a,
                    level: levels[a.id] ?? a.level
                }));
            }
        } catch (e) { console.error("Failed to load cached assets:", e); }
        setAssets(loadedAssets);

        setArenaFolders([]);
        setActions(createDefaultActions(true));
        setTasks([]);
        setReports([]);
        setClan(null);
        setEnrichedClanMembers([]);
        setChecklistItems([...defaultChecklistItems]);
        setFeed([]);
        setActiveCycle(null);
        setDailyCommitmentState(createDefaultDailyCommitment());
        setCycleExpBonus(0);
        setLevelUnlocks(buildDefaultLevelUnlocks());
        setClanQuestProgress({});
        setClanQuestParticipants({});
        setUserMissionParticipations({});
        
        // Profile with Local Storage
        let nextProfile = { ...DEFAULT_USER_PROFILE, id: currentUserId, isOnline: true };
        try {
             const savedProfile = localStorage.getItem(`${STORAGE_KEY_PROFILE}_${currentUserId}`);
             if (savedProfile) {
                 const parsed = JSON.parse(savedProfile);
                 nextProfile = { ...nextProfile, ...parsed, id: currentUserId, isOnline: true };
             }
        } catch (e) { console.error("Failed to load cached profile:", e); }
        setUserProfile(nextProfile);
        
        // Fetch fresh chests count immediately to ensure sync
        fetchChestsFromDB(currentUserId).then(chests => {
             if (chests) setUserProfile(prev => ({ ...prev, chests }));
        });
    }
  }, [session?.user.id]);

  // Helper to fetch chests directly from user_chests table
  const fetchChestsFromDB = async (userId: string) => {
      if (!isUuid(userId)) return null;
      const { data, error } = await supabase
          .from('user_chests')
          .select('chest_type')
          .eq('user_id', userId)
          .eq('is_opened', false);
          
      if (error) {
          console.error("Error fetching chests:", error.message);
          return null;
      }
      
      if (!data) return [];
      
      const counts: Record<string, number> = {};
      data.forEach((row: any) => {
          counts[row.chest_type] = (counts[row.chest_type] || 0) + 1;
      });
      
      return Object.entries(counts).map(([type, count]) => ({ type: type as ChestType, count }));
  };

  const getSupabaseUserId = useCallback(() => {
    const candidate = session?.user.id;
    if (!candidate) return null;
    if (!isUuid(candidate)) return null;
    return candidate;
  }, [session?.user.id]);

  // Online Only: Removed local storage migration and persistence
  // State reset is now handled in the session change effect above.

  const [activeCycle, setActiveCycle] = useState<Cycle | null>(() => null);

  const [clan, setClan] = useState<Clan | null>(() => null);

  const [enrichedClanMembers, setEnrichedClanMembers] = useState<EnrichedClanMember[]>([]);

  const [friends, setFriends] = useState<UserProfile[]>(DEFAULT_FRIENDS);
  const [friendRequestsIncoming, setFriendRequestsIncoming] = useState<FriendRequest[]>([]);
  const [friendRequestsOutgoing, setFriendRequestsOutgoing] = useState<FriendRequest[]>([]);
  const [clanJoinRequestsIncoming, setClanJoinRequestsIncoming] = useState<ClanJoinRequest[]>([]);
  const [clanJoinRequestsOutgoing, setClanJoinRequestsOutgoing] = useState<ClanJoinRequest[]>([]);
  
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() => [...defaultChecklistItems]);

  const [achievementUnlocked, setAchievementUnlocked] = useState<{ type: FeedEventType; data: any; } | null>(null);
  const [feed, setFeed] = useState<FeedEvent[]>(() => []);

  const [clanQuestProgress, setClanQuestProgress] = useState<Record<string, Record<string, number>>>(() => ({}));

  const [clanQuestParticipants, setClanQuestParticipants] = useState<Record<string, number>>({});
  const [userMissionParticipations, setUserMissionParticipations] = useState<Record<string, boolean>>({}); // missionId -> boolean

  const fetchClanQuestParticipants = useCallback(async (questId: string, actionName: string) => {
    if (!clan) return;

    // 1. Tentar buscar da tabela robusta primeiro
    const { count: dbCount, error: dbError } = await supabase
        .from('clan_mission_participants')
        .select('*', { count: 'exact', head: true })
        .eq('clan_id', clan.id)
        .eq('mission_id', questId);

    if (!dbError && dbCount !== null) {
         setClanQuestParticipants(prev => ({ ...prev, [questId]: dbCount }));
         
         // Verificar se o usuário atual está participando
         const userId = getSupabaseUserId();
         if (userId) {
             const { data: myPart } = await supabase
                .from('clan_mission_participants')
                .select('id')
                .eq('clan_id', clan.id)
                .eq('mission_id', questId)
                .eq('user_id', userId)
                .maybeSingle();
             
             setUserMissionParticipations(prev => ({ ...prev, [questId]: !!myPart }));
         }
         return;
    }
    
    // Fallback para o método antigo (contar ações) se a tabela nova estiver vazia ou der erro
    // Contar usuários que têm a ação correspondente
    const { count, error } = await supabase
        .from('actions')
        .select('user_id', { count: 'exact', head: true })
        .eq('name', actionName)
        .in('user_id', enrichedClanMembers.map(m => m.id));
    
    if (!error && count !== null) {
        setClanQuestParticipants(prev => ({ ...prev, [questId]: count }));
        // No fallback, assumimos que se tem a ação, está participando (aproximação)
        const hasAction = actions.some(a => a.name === actionName);
        setUserMissionParticipations(prev => ({ ...prev, [questId]: hasAction }));
    }
  }, [clan, enrichedClanMembers, actions]);

  const joinClanMission = async (questId: string) => {
      if (!clan) return;
      const userId = getSupabaseUserId();
      if (!userId) return;

      // Check if already participating
      const { data: existing } = await supabase
          .from('clan_mission_participants')
          .select('id')
          .eq('clan_id', clan.id)
          .eq('mission_id', questId)
          .eq('user_id', userId)
          .maybeSingle();

      if (existing) {
          // Already participating, just update local state
          setUserMissionParticipations(prev => ({ ...prev, [questId]: true }));
          // Don't increment if already exists, just rely on fetchClanQuestParticipants
          return;
      }

      // Inserir na tabela de participantes
      const { error } = await supabase.from('clan_mission_participants').insert({
          clan_id: clan.id,
          mission_id: questId,
          user_id: userId
      });

      if (error) {
        if (error.code === '23505') {
            console.log("Already participating in clan mission (duplicate key ignored)");
            setUserMissionParticipations(prev => ({ ...prev, [questId]: true }));
        } else {
            console.error("Error joining clan mission:", error);
            return;
        }
      } else {
        // Success: Update local state immediately
        setUserMissionParticipations(prev => ({ ...prev, [questId]: true }));
        setClanQuestParticipants(prev => ({ ...prev, [questId]: (prev[questId] || 0) + 1 }));
      }
      
      // Garantir que o progresso da missão existe (caso tenha sido deletado manualmente)
      const quest = SEASONS[ACTIVE_SEASON_ID]?.quests.find(q => q.id === questId);
      const targetValue = quest?.requirements?.clanGoal || 50;
      
      await supabase.from('clan_mission_progress').upsert({
          clan_id: clan.id,
          mission_id: questId,
          target_value: targetValue,
          current_value: 0 // Começa com 0 se não existir
      }, { onConflict: 'clan_id,mission_id', ignoreDuplicates: true }); // Se já existir, NÃO sobrescreve (mantém o progresso atual)
  };

  const leaveClanMission = async (questId: string) => {
      if (!clan) return;
      const userId = getSupabaseUserId();
      if (!userId) return;

      const { error } = await supabase
          .from('clan_mission_participants')
          .delete()
          .eq('clan_id', clan.id)
          .eq('mission_id', questId)
          .eq('user_id', userId);

      if (error) {
          console.error("Error leaving clan mission:", error);
      } else {
          setUserMissionParticipations(prev => {
              const next = { ...prev };
              delete next[questId];
              return next;
          });
          setClanQuestParticipants(prev => ({ ...prev, [questId]: Math.max(0, (prev[questId] || 0) - 1) }));
      }
  };

  const updateClanMissionProgress = async (questId: string, increment: number) => {
      if (!clan) return;
      
      // Optimistic update
      setClanQuestProgress(prev => {
          const currentClanProgress = prev[clan.id] || {};
          const currentVal = currentClanProgress[questId] || 0;
          return {
              ...prev,
              [clan.id]: {
                  ...currentClanProgress,
                  [questId]: currentVal + increment
              }
          };
      });

      const { error } = await supabase.rpc('increment_clan_mission_progress', { 
          p_clan_id: clan.id, 
          p_mission_id: questId, 
          p_increment: increment 
      });
      
      if (error) {
          console.error("Error updating clan mission progress:", error.message);
          // Revert optimistic update on error (optional, but good practice)
          setClanQuestProgress(prev => {
              const currentClanProgress = prev[clan.id] || {};
              const currentVal = currentClanProgress[questId] || 0;
              return {
                  ...prev,
                  [clan.id]: {
                      ...currentClanProgress,
                      [questId]: currentVal - increment
                  }
              };
          });
      }
  };



  const [seasons, setSeasons] = useState<Season[]>(() => {
    // Initialize with active season from GameContent
    const active = SEASONS[ACTIVE_SEASON_ID];
    if (active) {
        return [{
            id: active.id,
            name: active.name,
            start_date: active.startDate,
            end_date: active.endDate,
            background_png_url: '', 
            lore_text: '',
            is_active: true
        }];
    }
    return [];
  });
  const [seasonMissions, setSeasonMissions] = useState<SeasonMission[]>([]);
  
  const seasonQuests = useMemo(() => {
    const activeSeason = seasons.find(s => s.is_active);
    
    // Default quests from constant
    let quests: SeasonQuest[] = [];
    if (activeSeason && SEASONS[activeSeason.id]) {
         quests = SEASONS[activeSeason.id].quests.map(q => ({
             id: q.id,
             title: q.title,
             description: q.description,
             type: q.type,
             category: q.category,
             actionTemplate: q.actionTemplate,
             requirements: q.requirements,
             rewards: q.rewards
         })) as SeasonQuest[];
    } else if (!activeSeason) {
        quests = SEASONS[ACTIVE_SEASON_ID].quests.map(q => ({ ...q })) as SeasonQuest[];
    }

    const targetSeasonId = activeSeason?.id || ACTIVE_SEASON_ID;
    const dbMissions = seasonMissions.filter(m => m.season_id === targetSeasonId);
    
    // If we have DB missions for this season, prioritize them (override static config)
    if (dbMissions.length > 0) {
        quests = [];
    }

    const mappedMissions: SeasonQuest[] = dbMissions.map(m => ({
        id: m.id,
        title: m.title,
        description: m.description,
        type: m.type || 'individual',
        category: 'physical',
        actionTemplate: {
            name: m.action_name || m.title,
            description: m.description,
            duration: 15,
            icon: m.icon || '📜',
            repetitions: m.goal_value || 1,
            isMilestone: m.requirements?.milestone || false
        },
        requirements: m.requirements || {
            totalReps: m.goal_value || 1,
            clanGoal: m.type === 'clan' ? (m.goal_value || 50) : undefined,
            milestone: m.requirements?.milestone || false
        },
        rewards: {
            xp: m.reward_type === 'exp' ? Number(m.reward_value) : 0,
            items: m.reward_type === 'item_id' ? [String(m.reward_value)] : []
        },
        season_id: m.season_id
    }));

    return [...quests, ...mappedMissions];
  }, [seasons, seasonMissions]);

  // Load Global Game Content (Seasons, Missions)
  useEffect(() => {
    const loadGlobalContent = async () => {
        const { data: seasonsData, error: seasonsError } = await supabase.from('seasons').select('*');
        if (!seasonsError && seasonsData) {
            setSeasons(seasonsData as Season[]);
        }

        const { data: missionsData, error: missionsError } = await supabase.from('season_missions').select('*');
        if (!missionsError && missionsData) {
            setSeasonMissions(missionsData as SeasonMission[]);
        }
    };
    
    loadGlobalContent();
  }, []);

  const [levelUnlocks, setLevelUnlocks] = useState<LevelUnlocks>(() => buildDefaultLevelUnlocks());

  const persistTimeoutRef = useRef<number | null>(null);
  const dataLoadTimeoutRef = useRef<number | null>(null);
  const clanCacheRef = useRef<{ clanId: string; timestamp: number; members: EnrichedClanMember[] } | null>(null);
  const enableClanQuestProgress = true; // Always enable for now
  const clanQuestProgressTableReadyRef = useRef(enableClanQuestProgress);
  const pendingGuestMigrationRef = useRef<{ fromId: string; toId: string } | null>(null);
  const suspendPersistenceRef = useRef(false);
  const pendingProfilePatchRef = useRef<Partial<UserProfile> | null>(null);
  const profileUpdateInFlightRef = useRef<Record<string, boolean>>({});
  const [hasHydratedFromSupabase, setHasHydratedFromSupabase] = useState(false);

  const isClanQuestProgressMissing = (error: unknown) => {
    if (!error) return false;
    const status = (error as any)?.status ?? (error as any)?.code;
    const message = String((error as any)?.message || '');
    return status === 404 || message.includes('Not Found') || message.includes('404') || (message.includes('relation') && message.includes('clan_mission_progress'));
  };

  const fetchClanQuestProgress = useCallback(async (clanId: string) => {
    // if (!clanQuestProgressTableReadyRef.current) return; // Always try to fetch if called
    const { data, error } = await supabase.from('clan_mission_progress').select('*').eq('clan_id', clanId);
    if (error || !data) {
        if (isClanQuestProgressMissing(error)) {
            clanQuestProgressTableReadyRef.current = false;
        }
        return;
    }
    const progressMap = data.reduce((acc: Record<string, number>, row: any) => {
        const mapped = mapToCamelCase(row);
        if (!mapped?.missionId) return acc;
        acc[mapped.missionId] = Number(mapped.currentValue) || 0;
        return acc;
    }, {} as Record<string, number>);
    setClanQuestProgress(prev => ({ ...prev, [clanId]: progressMap }));
  }, []);

  const hydrateProfilesByIds = useCallback(async (ids: string[]) => {
    let uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    uniqueIds = uniqueIds.filter(id => isUuid(id));
    if (uniqueIds.length === 0) return {} as Record<string, UserProfile>;

    const { data: profilesData, error: profilesError } = await supabase.from('user_profiles').select('*, clan_members(clans(name, icon))').in('id', uniqueIds);
    if (profilesError || !profilesData) {
        console.error('Error fetching profiles:', profilesError?.message);
        return {} as Record<string, UserProfile>;
    }

    const mapped = mapToCamelCase(profilesData) as any[];
    return mapped.reduce((acc, profileData) => {
        // Extrair informações do clã se existirem
        const clanInfo = profileData.clanMembers?.[0]?.clans;
        
        const profile = {
            ...profileData,
            clanName: clanInfo?.name,
            clanIcon: clanInfo?.icon,
            wallet: { gold: profileData.gold || 0, fragments: profileData.fragments || 0 },
            inventory: [] 
        } as UserProfile;
            
            acc[profile.id] = profile;
            return acc;
        }, {} as Record<string, UserProfile>);
    }, []);

  const loadFriendsAndRequests = useCallback(async (userId: string) => {
    if (!isUuid(userId)) {
        setFriends([]);
        setFriendRequestsIncoming([]);
        setFriendRequestsOutgoing([]);
        return;
    }

    try {
        // Usar rate limiter para controlar número de requisições simultâneas
        const results = await rateLimiter.batchRequests([
            () => supabase.from('friends').select('*').eq('user_id', userId),
            () => supabase.from('friend_requests').select('*').eq('recipient_id', userId),
            () => supabase.from('friend_requests').select('*').eq('sender_id', userId),
        ]) as any[];

        const [{ data: friendsData, error: friendsError }, { data: incomingData, error: incomingError }, { data: outgoingData, error: outgoingError }] = results;

        if (friendsError) console.error('Error fetching friends:', friendsError.message);
        if (incomingError) console.error('Error fetching incoming friend requests:', incomingError.message);
        if (outgoingError) console.error('Error fetching outgoing friend requests:', outgoingError.message);

        const incomingRequests = (incomingData || []).filter((row: any) => row.status === 'pending').map((row: any) => ({
            id: row.id,
            senderId: row.sender_id,
            recipientId: row.recipient_id,
            status: row.status,
            createdAt: row.created_at,
            respondedAt: row.responded_at,
        })) as FriendRequest[];

        const outgoingRequests = (outgoingData || []).filter((row: any) => row.status === 'pending').map((row: any) => ({
            id: row.id,
            senderId: row.sender_id,
            recipientId: row.recipient_id,
            status: row.status,
            createdAt: row.created_at,
            respondedAt: row.responded_at,
        })) as FriendRequest[];

        const friendIds = (friendsData || []).map((row: any) => row.friend_id).filter(Boolean);
        const profileIdsToHydrate = [
            ...friendIds,
            ...incomingRequests.map(r => r.senderId),
            ...incomingRequests.map(r => r.recipientId),
            ...outgoingRequests.map(r => r.senderId),
            ...outgoingRequests.map(r => r.recipientId),
        ].filter((id, index, arr) => id && arr.indexOf(id) === index);

        setFriendRequestsIncoming(incomingRequests);
        setFriendRequestsOutgoing(outgoingRequests);

        if (profileIdsToHydrate.length > 0) {
            const profiles = await hydrateProfilesByIds(profileIdsToHydrate);
            // Criar array de perfis de amigos a partir dos IDs
            const friendProfiles = friendIds.map(id => profiles[id]).filter(Boolean);
            setFriends(friendProfiles);
        } else {
            setFriends([]);
        }
    } catch (error) {
        console.error('Error in loadFriendsAndRequests:', error);
        setFriends([]);
        setFriendRequestsIncoming([]);
        setFriendRequestsOutgoing([]);
    }
  }, []);

  const loadClanJoinRequestsOutgoing = useCallback(async (userId: string) => {
    if (!isUuid(userId)) {
        setClanJoinRequestsOutgoing([]);
        return;
    }
    
    try {
        const result = await rateLimiter.addRequest(() => 
            supabase.from('clan_join_requests').select('*').eq('user_id', userId)
        );
        
        const { data, error } = result;
        if (error || !data) {
            if (error) console.error('Error fetching outgoing clan join requests:', error.message);
            return;
        }
        const mapped = mapToCamelCase(data || []) as ClanJoinRequest[];
        setClanJoinRequestsOutgoing(mapped.filter(r => r.status === 'pending'));
    } catch (error) {
        console.error('Error in loadClanJoinRequestsOutgoing:', error);
        setClanJoinRequestsOutgoing([]);
    }
  }, []);

  const loadClanJoinRequestsIncoming = useCallback(async (clanId: string) => {
    const { data, error } = await supabase.from('clan_join_requests').select('*').eq('clan_id', clanId);
    if (error || !data) {
        if (error) console.error('Error fetching incoming clan join requests:', error.message);
        return;
    }
    const mapped = mapToCamelCase(data || []) as ClanJoinRequest[];
    const pending = mapped.filter(r => r.status === 'pending');
    const profilesById = await hydrateProfilesByIds(pending.map(r => r.userId));
    setClanJoinRequestsIncoming(pending.map(req => ({ ...req, requesterProfile: profilesById[req.userId] })));
  }, [hydrateProfilesByIds]);

  useEffect(() => {
    if (!clan) return;

    const channel = supabase.channel(`clan-updates-${clan.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clan_mission_progress',
          filter: `clan_id=eq.${clan.id}`,
        },
        (payload) => {
          if (payload.new && 'mission_id' in payload.new) {
             const newRow = mapToCamelCase(payload.new);
             setClanQuestProgress(prev => ({
                 ...prev,
                 [clan.id]: {
                     ...(prev[clan.id] || {}),
                     [newRow.missionId]: Number(newRow.currentValue) || 0
                 }
             }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clan_mission_participants',
          filter: `clan_id=eq.${clan.id}`,
        },
        () => {
             // Refresh participants for all clan quests
             seasonQuests.forEach(q => {
                 if (q.type === 'clan' && q.actionTemplate) {
                     fetchClanQuestParticipants(q.id, q.actionTemplate.name);
                 }
             });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clan?.id, seasonQuests, fetchClanQuestParticipants]);

  // --- Aldeia System Implementation ---
  const getAldeiaSlots = async (clanId: string): Promise<AldeiaSlot[]> => {
      const { data, error } = await supabase.from('clan_aldeia_slots').select('*').eq('clan_id', clanId);
      if (error) { console.error("Error fetching aldeia slots:", error.message); return []; }
      return mapToCamelCase(data) as AldeiaSlot[];
  };

  const updateAldeiaSlot = async (clanId: string, slotId: AldeiaSlotId, updates: Partial<AldeiaSlot>) => {
      const snakeUpdates = mapToSnakeCase(updates);
      const { error } = await supabase.from('clan_aldeia_slots').update(snakeUpdates).eq('clan_id', clanId).eq('slot_id', slotId);
      if (error) console.error("Error updating aldeia slot:", error.message);
  };

  const getAldeiaPresence = async (clanId: string): Promise<AldeiaPresence[]> => {
      const { data, error } = await supabase.from('clan_aldeia_presence').select('*').eq('clan_id', clanId);
      if (error) { console.error("Error fetching aldeia presence:", error.message); return []; }
      return mapToCamelCase(data) as AldeiaPresence[];
  };

  const enterAldeiaSlot = async (clanId: string, slotId: AldeiaSlotId) => {
      const userId = getSupabaseUserId();
      console.log(`[ENTER_ALDEIA] Starting for user ${userId}, clan ${clanId}, slot ${slotId}`);
      if (!userId) return;

      // STRATEGY: EXCLUSIVE RPC V2
      // We rely 100% on the server-side function to handle the upsert logic.
      // This eliminates client-side 409 conflicts because the client never attempts an INSERT directly.

      console.log(`[ENTER_ALDEIA] Calling RPC enter_aldeia_slot_v2...`);
      const { data, error } = await supabase.rpc('enter_aldeia_slot_v2', {
          p_clan_id: clanId,
          p_slot_id: slotId
      });

      if (error) {
          console.error("[ENTER_ALDEIA] RPC V2 Failed:", error);
          console.error("[ENTER_ALDEIA] Error Message:", error.message);
          console.error("[ENTER_ALDEIA] Error Details:", error.details);
          console.error("[ENTER_ALDEIA] Error Hint:", error.hint);
          
          // If even the V2 fails, it's likely a network or auth issue, not a logic conflict.
          // We do NOT fallback to client-side insert to avoid the 409 loop.
          console.error(`Erro ao entrar no slot (RPC): ${error.message}`);
          showToast(`Erro ao entrar: ${error.message}`);
      } else {
          console.log(`[ENTER_ALDEIA] RPC V2 Success! Data:`, data);
          // Success! Optimistically update UI if needed (GameContext state usually auto-updates via subscription or refresh)
          // We can trigger a refresh just in case
          // loadAldeiaData(clanId); // Assuming this exists or is part of a useEffect
      }
  };

  const performAldeiaDailyUpdate = async (clanId: string) => {
      let slots = await getAldeiaSlots(clanId);
      const today = new Date().toISOString().split('T')[0];
      
      // Get clan type to check if it's Office
      const { data: clanData } = await supabase.from('clans').select('clan_type').eq('id', clanId).single();
      const isOfficeClan = clanData?.clan_type?.toLowerCase() === 'office';

      // Initialize slots if missing
      const REQUIRED_SLOTS: AldeiaSlotId[] = ['fogueira', 'forja', 'torre', 'horta', 'altar', 'trono'];
      const missingSlots = REQUIRED_SLOTS.filter(id => !slots.some(s => s.slotId === id));
      
      if (missingSlots.length > 0) {
          const newSlots = missingSlots.map(id => ({
              clan_id: clanId,
              slot_id: id,
              health: 50,
              streak_good: 0,
              streak_bad: 0,
              last_visited_at: null,
              last_decay_calculation: null
          }));
          
          const { error } = await supabase.from('clan_aldeia_slots').insert(newSlots);
          if (error) console.error("Error initializing aldeia slots:", error.message);
          else {
              slots = await getAldeiaSlots(clanId);
          }
      }

      for (const slot of slots) {
          // If already updated today, skip
          if (slot.lastDecayCalculation === today) continue;

          // OFFICE CLAN: No automatic decay or gain. Leader sets manually.
          if (isOfficeClan) {
              await updateAldeiaSlot(clanId, slot.slotId, {
                  lastDecayCalculation: today
              });
              continue;
          }

          // Calculate days passed since last visited
          const lastVisit = slot.lastVisitedAt ? new Date(slot.lastVisitedAt) : null;
          let daysSinceVisit = 100; // Default large number if never visited
          if (lastVisit) {
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - lastVisit.getTime());
              daysSinceVisit = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
          }

          // Apply logic
          // FORMULA:
          // Gain: If visited within 24h (daysSinceVisit === 0) -> +2 + (streak * 0.5) (Max 10)
          // Decay: If not visited (daysSinceVisit > 0) -> -2 - (streak * 0.8) (Max 15)
          let newHealth = slot.health;
          let newStreakGood = slot.streakGood;
          let newStreakBad = slot.streakBad;

          // If visited today (0 days ago), it's a gain.
          if (daysSinceVisit === 0) {
               newStreakGood += 1;
               newStreakBad = 0;
               const gain = Math.min(2 + (newStreakGood * 0.5), 10);
               newHealth = Math.min(newHealth + gain, 100);
          } else {
               // Missed days - Decay
               newStreakBad += 1; // Increment bad streak
               newStreakGood = 0;
               
               const loss = Math.min(2 + (newStreakBad * 0.8), 15);
               newHealth = Math.max(newHealth - loss, 0);
          }

          // Update DB
          await updateAldeiaSlot(clanId, slot.slotId, {
              health: newHealth,
              streakGood: newStreakGood,
              streakBad: newStreakBad,
              lastDecayCalculation: today
          });
      }
  };

  const loadClanAndMembers = useCallback(async (clanId: string, force = false) => {
    // Check cache first - use cache if less than 30 seconds old and not forced
    const now = Date.now();
    const cacheExpiry = 30 * 1000; // 30 seconds
    
    if (!force &&
        clanCacheRef.current && 
        clanCacheRef.current.clanId === clanId && 
        (now - clanCacheRef.current.timestamp) < cacheExpiry) {
        // Use cached data
        setEnrichedClanMembers(clanCacheRef.current.members);
        return;
    }

    const { data: clanData, error: clanError } = await supabase.from('clans').select('*').eq('id', clanId).maybeSingle();
    if (clanError || !clanData) { console.error('Error fetching clan data:', clanError?.message); return; }

    setClan(mapToCamelCase(clanData) as Clan);
    if (enableClanQuestProgress) {
        await fetchClanQuestProgress(clanId);
    }

    const { data: membersData, error: membersError } = await supabase.from('clan_members').select('*').eq('clan_id', clanId);
    if (membersError || !membersData) { console.error('Error fetching clan members:', membersError?.message); return; }

    const memberIds = membersData.map((m: any) => m.user_id).filter((id: string) => isUuid(id));
    if (memberIds.length === 0) { setEnrichedClanMembers([]); return; }

    const { data: memberProfiles, error: profilesError } = await supabase.from('user_profiles').select('*').in('id', memberIds);
    if (profilesError || !memberProfiles) { console.error('Error fetching member profiles:', profilesError?.message); return; }

    const enrichedMembers: EnrichedClanMember[] = memberIds.map((memberId: string) => {
        const memberInfo = membersData.find((m: any) => m.user_id === memberId);
        if (!memberInfo) return null;
        
        let profile = memberProfiles.find((p: any) => p.id === memberId);
        
        // Fallback: If profile not found in DB but it's the current user, use local state
        if (!profile && memberId === userProfile.id) {
             profile = mapToSnakeCase(userProfile);
        }

        // If still no profile, create a ghost profile so the member is visible (and kickable)
        if (!profile) {
            return {
                id: memberId,
                nickname: 'Membro Desconhecido',
                level: 0,
                avatarUrl: '',
                border: 'default',
                backgroundUrl: '',
                isOnline: false,
                visibleWidgets: [],
                skin: 'default',
                nobility: { exp: 0, rankId: 'vagante' },
                mood: 50,
                role: memberInfo.role as 'leader' | 'member',
                joined_at: memberInfo.joined_at,
            } as EnrichedClanMember;
        }

        const { role: userRole, ...camelCaseProfile } = mapToCamelCase(profile) as UserProfile;

        return {
            ...camelCaseProfile,
            role: memberInfo.role as 'leader' | 'member',
            joined_at: memberInfo.joined_at,
        };
    }).filter((m): m is EnrichedClanMember => m !== null);

    // Cache the results
    clanCacheRef.current = {
        clanId,
        timestamp: now,
        members: enrichedMembers
    };

    setEnrichedClanMembers(enrichedMembers);

    const currentUserId = session?.user.id;
    const currentMember = currentUserId ? membersData.find((m: any) => m.user_id === currentUserId) : null;
    if (currentMember?.role === 'leader') {
        await loadClanJoinRequestsIncoming(clanId);
    } else {
        setClanJoinRequestsIncoming([]);
    }
  }, [setClan, setEnrichedClanMembers, fetchClanQuestProgress, session?.user.id, userProfile.id, loadClanJoinRequestsIncoming]);

  const migrateGuestDataToSupabase = useCallback(async (userId: string) => {
    if (!isUuid(userId)) {
        console.error("Invalid userId for migration to Supabase");
        return;
    }
    
    const errors: string[] = [];
    const syncedProfile = await SupabaseService.syncUserProfile({ ...userProfile, id: userId, isOnline: true });
    if (!syncedProfile) errors.push('profile');

    if (arenaFolders.length > 0) {
        const foldersPayload = arenaFolders.map(folder => ({ ...mapToSnakeCase(folder), user_id: userId }));
        const { error } = await supabase.from('arena_folders').upsert(foldersPayload, { onConflict: 'id' });
        if (error) errors.push('arena_folders');
    }

    const arenas = assets.flatMap(asset => asset.arenas.map(arena => ({ ...arena, assetId: arena.assetId || asset.id })));
    if (arenas.length > 0) {
        const arenasPayload = arenas.map(arena => {
            const snake = mapToSnakeCase(arena);
            delete snake.action_ids;
            return { ...snake, user_id: userId };
        });
        const { error } = await supabase.from('arenas').upsert(arenasPayload, { onConflict: 'id' });
        if (error) errors.push('arenas');
    }

    if (actions.length > 0) {
        const actionsPayload = actions.map(action => ({ ...mapToSnakeCase(action), user_id: userId }));
        const { error } = await supabase.from('actions').upsert(actionsPayload, { onConflict: 'id' });
        if (error) errors.push('actions');
    }

    if (tasks.length > 0) {
        const tasksPayload = tasks.map(task => ({ ...mapToSnakeCase(task), user_id: userId }));
        const { error } = await supabase.from('scheduled_tasks').upsert(tasksPayload, { onConflict: 'id' });
        if (error) errors.push('scheduled_tasks');
    }

    if (reports.length > 0) {
        const reportsPayload = reports.map(report => ({ ...mapToSnakeCase(report), user_id: userId }));
        const { error } = await supabase.from('reports').upsert(reportsPayload, { onConflict: 'id' });
        if (error) errors.push('reports');
    }

    if (activeCycle?.id) {
        const cyclePayload = { ...mapToSnakeCase(activeCycle), user_id: userId };
        const { error } = await supabase.from('cycles').upsert([cyclePayload], { onConflict: 'id' });
        if (error) errors.push('cycles');
    }

    // Sync Asset Levels
    const levelsPayload = assets.filter(a => a.id !== 'geral').map(asset => ({
        user_id: userId,
        asset_id: asset.id,
        level: asset.level
    }));
    if (levelsPayload.length > 0) {
        const { error } = await supabase.from('asset_levels').upsert(levelsPayload, { onConflict: 'user_id,asset_id' });
    if (error) {
        console.error("Error syncing asset levels:", error.message, error.details, error.hint);
        errors.push('asset_levels');
    }
    }

    const slotsPayload = assets.flatMap(asset => asset.slots.map(slot => ({
        slot_id: slot.id,
        user_id: userId,
        value: typeof slot.value === 'object' ? JSON.stringify(slot.value) : String(slot.value)
    })));
    if (slotsPayload.length > 0) {
        const { error } = await supabase.from('asset_slots').upsert(slotsPayload, { onConflict: 'user_id,slot_id' });
        if (error) errors.push('asset_slots');
    }

    return errors.length === 0;
  }, [assets, actions, tasks, reports, activeCycle, userProfile, arenaFolders]);


  // --- Local Storage Persistence ---
  useEffect(() => {
    if (userProfile.id && userProfile.id !== DEFAULT_USER_PROFILE.id) {
        try {
            localStorage.setItem(`${STORAGE_KEY_PROFILE}_${userProfile.id}`, JSON.stringify(userProfile));
        } catch (e) {
            console.error("Failed to save user profile to local storage:", e);
        }
    }
  }, [userProfile]);

  useEffect(() => {
    const userId = session?.user.id;
    if (userId) {
        try {
            const levels = assets.reduce((acc, asset) => {
                acc[asset.id] = asset.level;
                return acc;
            }, {} as Record<string, number>);
            localStorage.setItem(`${STORAGE_KEY_ASSET_LEVELS}_${userId}`, JSON.stringify(levels));
        } catch (e) {
            console.error("Failed to save asset levels to local storage:", e);
        }
    }
  }, [assets, session?.user.id]);

  // Ref to hold the latest migration function
  const migrateGuestDataToSupabaseRef = useRef(migrateGuestDataToSupabase);
  useEffect(() => {
      migrateGuestDataToSupabaseRef.current = migrateGuestDataToSupabase;
  }, [migrateGuestDataToSupabase]);

  // --- Supabase Data Sync ---
  useEffect(() => {
    const today = getTodayString();
    
    // Check for daily reset
    if (dailyCommitment.date !== today) {
        resetDailyCommitment();
        // Also reset checklist items (uncheck them)
        setChecklistItems(prev => prev.map(item => ({ ...item, completed: false })));
    }
    
    const userId = getSupabaseUserId();
    if (!userId) return;

    const loadDataFromSupabase = async () => {
        // Verificar se o userId é válido antes de fazer queries
        if (!isUuid(userId)) {
            console.error("Invalid userId for loading data from Supabase");
            return;
        }
        
        // 1. Load Profile
        const profileResult = await rateLimiter.addRequest(() => 
            supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle()
        );
        const { data: profileData, error: profileError } = profileResult;
        
        if (!profileData && !profileError) {
            const [
                arenasCountResult,
                actionsCountResult,
                levelsCountResult,
                slotsCountResult,
                clanCountResult,
            ] = await Promise.all([
                rateLimiter.addRequest(() => supabase.from('arenas').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
                rateLimiter.addRequest(() => supabase.from('actions').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
                rateLimiter.addRequest(() => supabase.from('asset_levels').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
                rateLimiter.addRequest(() => supabase.from('asset_slots').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
                rateLimiter.addRequest(() => supabase.from('clan_members').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
            ]);

            if (arenasCountResult.error) console.error('Error checking arenas count:', arenasCountResult.error.message);
            if (actionsCountResult.error) console.error('Error checking actions count:', actionsCountResult.error.message);
            if (levelsCountResult.error) console.error('Error checking asset levels count:', levelsCountResult.error.message);
            if (slotsCountResult.error) console.error('Error checking asset slots count:', slotsCountResult.error.message);
            if (clanCountResult.error) console.error('Error checking clan membership count:', clanCountResult.error.message);

            const counts = [
                arenasCountResult.count,
                actionsCountResult.count,
                levelsCountResult.count,
                slotsCountResult.count,
                clanCountResult.count,
            ];
            const hasExistingData = counts.some(count => typeof count === 'number' && count > 0);

            if (hasExistingData) {
                const newProfile = { ...DEFAULT_USER_PROFILE, id: userId, isOnline: true };
                await supabase.from('user_profiles').insert(newProfile);
                setUserProfile(newProfile);
            } else {
                // Use the ref to access the latest version of migrateGuestDataToSupabase without triggering effect
                await migrateGuestDataToSupabaseRef.current(userId);
            }
        }

        // Fetch chests independently to ensure they are up to date
        fetchChestsFromDB(userId).then(chests => {
             if (chests) setUserProfile(prev => ({ ...prev, chests }));
        });

        if (!profileError && profileData) {
            const camelProfile = mapToCamelCase(profileData) as UserProfile;
            const normalizedRole = typeof camelProfile.role === 'string' ? camelProfile.role.toLowerCase() : undefined;
            const role = normalizedRole === 'admin' || normalizedRole === 'gm' ? normalizedRole : (normalizedRole || 'user');
            setUserProfile(prev => {
                let next = { ...prev, ...camelProfile, role } as UserProfile;
                const pendingPatch = pendingProfilePatchRef.current;
                if (pendingPatch) {
                    next = { ...next, ...pendingPatch };
                }
                const inflight = profileUpdateInFlightRef.current;
                const inflightKeys = Object.keys(inflight).filter(key => inflight[key]);
                if (inflightKeys.length > 0) {
                    for (const key of inflightKeys) {
                        (next as any)[key] = (prev as any)[key];
                    }
                }
                return next;
            });
        }

        await Promise.all([
            loadFriendsAndRequests(userId),
            loadClanJoinRequestsOutgoing(userId)
        ]);

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const minDate = threeMonthsAgo.toISOString().split('T')[0];

        const [
            foldersResult,
            arenasResult,
            actionsResult,
            tasksResult,
            slotsResult,
            levelsResult,
            clanMemberResult,
            reportsResult,
            cyclesResult,
            campaignsResult
        ] = await rateLimiter.batchRequests([
            () => supabase.from('arena_folders').select('*').eq('user_id', userId),
            () => supabase.from('arenas').select('*').eq('user_id', userId),
            () => supabase.from('actions').select('*').eq('user_id', userId),
            () => supabase.from('scheduled_tasks').select('*').eq('user_id', userId).gte('date', minDate),
            () => supabase.from('asset_slots').select('*').eq('user_id', userId),
            () => supabase.from('asset_levels').select('*').eq('user_id', userId),
            () => supabase.from('clan_members').select('clan_id').eq('user_id', userId).maybeSingle(),
            () => supabase.from('cycles').select('*').eq('user_id', userId).not('report_data', 'is', null).order('end_date', { ascending: false }).limit(100),
            () => supabase.from('cycles').select('*').eq('user_id', userId).is('report_data', null).limit(1),
            () => supabase.from('campaigns').select('*').eq('user_id', userId)
        ]) as any[];

        const { data: foldersData, error: foldersError } = foldersResult;
        if (!foldersError && foldersData) {
            setArenaFolders(mapToCamelCase(foldersData) as ArenaFolder[]);
        }

        const { data: campaignsData, error: campaignsError } = campaignsResult;
        if (!campaignsError && campaignsData) {
            setCampaigns(mapToCamelCase(campaignsData) as Campaign[]);
        }

        let camelArenas: Arena[] | null = null;
        const { data: arenasData, error: arenasError } = arenasResult;
        if (!arenasError && arenasData) {
            camelArenas = (mapToCamelCase(arenasData) as Arena[]).map(arena => ({
                ...arena,
                actionIds: Array.isArray(arena.actionIds) ? arena.actionIds : [],
                isArchived: typeof arena.isArchived === 'boolean' ? arena.isArchived : false,
            }));
        }

        const { data: actionsData, error: actionsError } = actionsResult;
        if (!actionsError && actionsData) {
            const rawActions = mapToCamelCase(actionsData) as Action[];
            const normalizedActions = rawActions.map(action => {
                const schedule = (action.context && typeof action.context === 'object') ? (action.context as Action['context'])?.schedule : undefined;
                return {
                    ...action,
                    scheduledDays: action.scheduledDays ?? schedule?.days,
                    scheduledStartTime: action.scheduledStartTime ?? schedule?.startTime,
                };
            });
            if (camelArenas) {
                const validArenaIds = new Set(camelArenas.map(a => a.id));
                const validActions = normalizedActions.filter(a => validArenaIds.has(a.arenaId));
                setActions(validActions);
            } else {
                 setActions(normalizedActions);
            }
        }

        const { data: tasksData, error: tasksError } = tasksResult;
        if (!tasksError && tasksData) {
            setTasks(mapToCamelCase(tasksData) as ScheduledTask[]);
        }

        const { data: slotsData, error: slotsError } = slotsResult;
        const { data: levelsData, error: levelsError } = levelsResult;

        if ((!arenasError && arenasData) || (!slotsError && slotsData) || (!levelsError && levelsData)) {
            setAssets(() => {
                let nextAssets = createDefaultAssets(true);
                if (camelArenas) {
                    nextAssets = nextAssets.map(asset => ({
                        ...asset,
                        arenas: camelArenas.filter(a => a.assetId === asset.id)
                    }));
                }
                if (!slotsError && slotsData) {
                    nextAssets = nextAssets.map(asset => ({
                        ...asset,
                        slots: asset.slots.map(slot => {
                            const dbSlot = slotsData.find(s => s.slot_id === slot.id);
                            if (dbSlot) {
                                try {
                                    return { ...slot, value: JSON.parse(dbSlot.value) };
                                } catch {
                                    return { ...slot, value: dbSlot.value };
                                }
                            }
                            return slot;
                        })
                    }));
                }
                if (!levelsError && levelsData) {
                    nextAssets = nextAssets.map(asset => {
                        const dbLevel = levelsData.find(l => l.asset_id === asset.id);
                        if (dbLevel) {
                            return { ...asset, level: dbLevel.level };
                        }
                        return asset;
                    });
                }
                return nextAssets;
            });
        }

        const { data: clanMemberData, error: clanMemberError } = clanMemberResult;

        if (clanMemberError) {
            console.error('Error fetching clan membership:', clanMemberError.message);
            if (clanMemberError.code === 'PGRST116') {
                setClan(null);
                setEnrichedClanMembers([]);
                setClanJoinRequestsIncoming([]);
            }
        } else if (!clanMemberData) {
            setClan(null);
            setEnrichedClanMembers([]);
            setClanJoinRequestsIncoming([]);
        } else {
            if (!clan || clan.id !== clanMemberData.clan_id) {
                loadClanAndMembers(clanMemberData.clan_id, true);
            }
        }

        const { data: reportsData, error: reportsError } = reportsResult;
        if (!reportsError && reportsData) {
            // Map cycles with report_data to Report objects
            const nextReports = reportsData.map((row: any) => {
                if (row.report_data) {
                    return mapToCamelCase(row.report_data);
                }
                return null;
            }).filter(Boolean) as Report[];

            if (nextReports.length > 0) {
                setReports(nextReports);
            } else {
                setReports(prev => (prev.length > 0 ? prev : []));
            }
        }

        const { data: cyclesData, error: cyclesError } = cyclesResult;
        if (!cyclesError && cyclesData && cyclesData.length > 0) {
            setActiveCycle(mapToCamelCase(cyclesData[0]) as Cycle);
        }
    };


    const run = async () => {
        let hydrated = false;
        try {
            suspendPersistenceRef.current = true;
            const pendingMigration = pendingGuestMigrationRef.current;
            if (pendingMigration?.toId === userId) {
                // Use the ref to access the latest version of migrateGuestDataToSupabase without triggering effect
                const ok = await migrateGuestDataToSupabaseRef.current(userId);
                if (ok) {
                    pendingGuestMigrationRef.current = null;
                    hydrated = true;
                }
                return;
            }
        await loadDataFromSupabase();
        
        // Use the actual cycle from state (it will be updated after loadDataFromSupabase finishes)
        // Since loadDataFromSupabase calls setActiveCycle, we can't just read state here.
        // Let's modify loadDataFromSupabase to return the found cycle or fetch it again.
        
        // Actually, we can fetch it directly here to be sure.
        const { data: currentCycleData } = await supabase
            .from('cycles')
            .select('*')
            .eq('user_id', userId)
            .is('report_data', null)
            .maybeSingle();

        if (currentCycleData) {
            const cycle = mapToCamelCase(currentCycleData) as Cycle;
            setActiveCycle(cycle); // CRITICAL: Actually set the active cycle in state
            
            const { data: sitreps } = await supabase
                .from('sitrep_reports')
                .select('score')
                .gte('date', cycle.startDate)
                .lte('date', cycle.endDate);
            
            if (sitreps) {
                const totalBonus = sitreps.reduce((sum, r) => {
                    const bonus = r.score >= 95 ? 120 : r.score >= 85 ? 60 : 0;
                    return sum + bonus;
                }, 0);
                setCycleExpBonus(totalBonus);
            }
        } else {
            setActiveCycle(null); // Ensure state is cleared if no active cycle found
        }

            hydrated = true;
        } finally {
            if (hydrated) setHasHydratedFromSupabase(true);
            setIsProfileLoaded(true);
            suspendPersistenceRef.current = false;
        if (hydrated && pendingProfilePatchRef.current) {
            const patch = pendingProfilePatchRef.current;
            pendingProfilePatchRef.current = null;
            updateUserProfile(patch);
        }
        }
    };

    run();
  }, [session?.user.id, userProfile.id]);

  // Codex System
  const [userCodexes, setUserCodexes] = useState<UserCodex[]>([]);
  const [codexCatalog, setCodexCatalog] = useState<CodexCatalogItem[]>([]);

  useEffect(() => {
    const fetchCodexData = async () => {
        console.log("Fetching Codex Data...");
        let catalog: CodexCatalogItem[] = [];
        try {
            const { data: catalogData, error } = await supabase.from('codex_catalog').select('*');
            if (error) console.error("Supabase Error fetching catalog:", error);
            
            console.log("Raw Catalog Data from DB:", catalogData);

            if (catalogData && catalogData.length > 0) {
                catalog = (catalogData as any[]).map(item => {
                     // Handle potential JSON string for template
                     let template = item.template;
                     if (typeof template === 'string') {
                         try { template = JSON.parse(template); } catch (e) { console.error("Error parsing template JSON for item", item.id, e); }
                     }

                     // Robust fallback for missing template using shared constant
                     // Check by ID OR Title (case insensitive)
                     const isBioMachine = item.id === BIOLOGICAL_MACHINE_CODEX.id || 
                                          (item.title && BIOLOGICAL_MACHINE_CODEX.title && item.title.toLowerCase().trim() === BIOLOGICAL_MACHINE_CODEX.title.toLowerCase().trim());
                     
                     if (isBioMachine && (!template || !template.levels)) {
                        console.log("Injecting fallback template for Biological Machine item:", item.id);
                        template = BIOLOGICAL_MACHINE_CODEX;
                    }
                    return { ...item, template };
                }).filter(item => {
                    const isValid = item.template && item.template.levels && Array.isArray(item.template.levels);
                    if (!isValid) console.warn("Filtering out invalid catalog item (missing template or levels):", item.title || item.id);
                    return isValid;
                }); 
            }
        } catch (err) {
            console.error("Failed to fetch codex catalog", err);
        }

        console.log("Processed Catalog:", catalog);

        // Fallback: If DB is empty, fails, or filtered out everything, use hardcoded data
        // Also, if the catalog DOES NOT contain the Biological Machine, force add it.
        const bioMachineExists = catalog.some(c => c.id === BIOLOGICAL_MACHINE_CODEX.id || c.title === BIOLOGICAL_MACHINE_CODEX.title);
        
        if (!bioMachineExists) {
             console.log("Biological Machine not found in valid catalog. Adding fallback.");
             const fallbackItem: CodexCatalogItem = {
                 id: BIOLOGICAL_MACHINE_CODEX.id,
                 title: BIOLOGICAL_MACHINE_CODEX.title,
                 description: BIOLOGICAL_MACHINE_CODEX.description,
                 price_brl: BIOLOGICAL_MACHINE_CODEX.price,
                 is_premium: false,
                 cover_image: BIOLOGICAL_MACHINE_CODEX.coverImage,
                 author_name: BIOLOGICAL_MACHINE_CODEX.author,
                 duration_days: BIOLOGICAL_MACHINE_CODEX.durationDays,
                 created_at: new Date().toISOString(),
                 template: BIOLOGICAL_MACHINE_CODEX
             };
             // Add to beginning of catalog
             catalog = [fallbackItem, ...catalog];
        }

        console.log("Final Catalog set to state:", catalog);
        setCodexCatalog([...catalog]); // Spread to ensure new reference
        
        // Fetch user codexes after catalog is set (or in parallel)
        const userId = getSupabaseUserId();
        console.log("Fetching User Codexes for UserID:", userId);
        if (userId) {
            const { data: userCodexData, error: userError } = await supabase.from('codex').select('*').eq('owner_id', userId);
            if (userError) console.error("Error fetching user codexes:", userError);
            console.log("User Codexes Data:", userCodexData);
            if (userCodexData) {
                // Also parse template for user codexes if needed
                const parsedUserCodexes = userCodexData.map((uc: any) => {
                    let t = uc.template;
                    if (typeof t === 'string') {
                        try { t = JSON.parse(t); } catch(e) {}
                    }
                    // FALLBACK: If template is missing in user codex (due to bad insert), try to find it in catalog
                    if (!t) {
                        const catalogItem = codexCatalog.find(c => c.id === uc.catalog_id || c.title === uc.name);
                        if (catalogItem) {
                            console.log("Recovered template from catalog for user codex:", uc.name);
                            t = catalogItem.template;
                        } else if (uc.name === BIOLOGICAL_MACHINE_CODEX.title) {
                            console.log("Recovered fallback template for Biological Machine");
                            t = BIOLOGICAL_MACHINE_CODEX;
                        }
                    }
                    return { ...uc, template: t };
                });
                setUserCodexes(parsedUserCodexes as UserCodex[]);
            }
        }
    };
    // Force re-fetch on mount regardless of session state for catalog
    fetchCodexData();
  }, [session?.user.id]);

  const buyCodex = async (catalogId: string) => {
    const userId = getSupabaseUserId();
    if (!userId) return;

    const catalogItem = codexCatalog.find(c => c.id === catalogId);
    if (!catalogItem) return;

    // Create User Codex linked to Catalog
    const { data, error } = await supabase.from('codex').insert({
        owner_id: userId,
        catalog_id: catalogItem.id,
        name: catalogItem.title,
        description: catalogItem.description,
        author: catalogItem.author_name,
        price: catalogItem.price_brl,
        template: catalogItem.template,
        schema_version: 'v2',
        is_public: false
    }).select().single();

    if (error) {
        console.error("Error buying codex:", error);
        showToast("Erro ao adquirir Codex.");
        return;
    }

    setUserCodexes(prev => [...prev, data as UserCodex]);
    showToast(`Codex "${catalogItem.title}" adquirido!`);
  };

  const deleteUserCodex = async (codexId: string) => {
      const userId = getSupabaseUserId();
      if (!userId) return;

      setUserCodexes(prev => prev.filter(c => c.id !== codexId));
      
      const { error } = await supabase.from('codex').delete().eq('id', codexId);
      if (error) {
          console.error("Error deleting codex:", error);
          showToast("Erro ao deletar Codex.");
      }
  };

  const transferUserCodex = async (codexId: string, recipientId: string) => {
      const userId = getSupabaseUserId();
      if (!userId) return;

      setUserCodexes(prev => prev.filter(c => c.id !== codexId));

      const { error } = await supabase.from('codex').update({ owner_id: recipientId }).eq('id', codexId);
      if (error) {
          console.error("Error transferring codex:", error);
          showToast("Erro ao transferir Codex.");
      }
  };

  const installCodex = async (userCodexId: string) => {
      const userId = getSupabaseUserId();
      if (!userId) return;

      const codex = userCodexes.find(c => c.id === userCodexId);
      if (!codex || !codex.template) return;

      const template = codex.template;
      
      // 1. Create Campaign
      const campaignId = crypto.randomUUID();
      const arenaIds: string[] = [];
      const arenaConfig: Record<string, any> = {};

      // 2. Create Arenas & Actions for each level
      for (const level of template.levels) {
          // Find asset ID (default to 'fisico' or first available)
          const assetId = assets.find(a => a.id === 'fisico')?.id || assets[0]?.id || 'geral';
          
          const arenaId = crypto.randomUUID();
          arenaIds.push(arenaId);
          
          // Determine if locked (Level 1 is unlocked, others locked)
          const isLocked = level.level > 1;
          const prereqIds = level.level > 1 ? [arenaIds[arenaIds.length - 2]] : []; // Simple linear dependency on previous arena

          arenaConfig[arenaId] = {
              isLocked,
              isHidden: false,
              prerequisiteArenaIds: prereqIds
          };

          // Insert Arena
          await supabase.from('arenas').insert({
              id: arenaId,
              user_id: userId,
              asset_id: assetId,
              name: level.title,
              description: level.description,
              icon: '📜', // Default Codex Icon
              origin_codex_id: codex.id,
              codex_level: level.level,
              is_archived: false,
              priority: 'media',
              order: 0,
              priority_order: 0
          });

          // Insert Actions
          // Fix: Ensure we wait for actions to be inserted before proceeding or catching errors
          for (const action of level.actions) {
              const { error: actionError } = await supabase.from('actions').insert({
                  id: crypto.randomUUID(), // Ensure ID is generated
                  user_id: userId,
                  arena_id: arenaId,
                  name: action.name,
                  description: action.description,
                  icon: action.icon || '⚔️', // Default icon if missing
                  duration: action.duration || 0,
                  repetitions: action.repetitions || 0,
                  action_type: action.actionType || 'check',
                  difficulty: action.difficulty || 'easy',
                  origin_codex_id: codex.id,
              });
              
              if (actionError) {
                  console.error("Error inserting action:", actionError);
              }
          }
      }

      // 3. Insert Campaign
      const newCampaign: Campaign = {
          id: campaignId,
          userId,
          title: template.title,
          description: template.description,
          status: 'active',
          type: 'sequential', // Codexes are usually sequential levels
          arenaIds,
          arenaConfig,
          createdAt: new Date().toISOString(),
          priority: 'media',
          order: 0,
          priorityOrder: 0
      };

      const { error } = await supabase.from('campaigns').insert({
          id: campaignId,
          user_id: userId,
          title: newCampaign.title,
          description: newCampaign.description,
          status: newCampaign.status,
          type: newCampaign.type,
          arena_ids: newCampaign.arenaIds,
          arena_config: newCampaign.arenaConfig,
          priority: 'media',
          order: 0,
          priority_order: 0
      });

      if (error) {
          console.error("Error creating campaign from codex:", error);
          showToast("Erro ao criar campanha: " + error.message);
          return;
      }

      showToast(`Codex "${codex.name}" instalado com sucesso!`);
      // Give DB a moment to index before reloading
      setTimeout(() => {
        window.location.reload(); 
      }, 500);
  };

  const addFeedEvent = (eventData: Pick<FeedEvent, 'type' | 'content'>) => {
    const newEvent: FeedEvent = {
        id: `feed_${Date.now()}`,
        userId: userProfile.id,
        timestamp: new Date().toISOString(),
        type: eventData.type,
        content: eventData.content
    };
    setFeed(prev => [newEvent, ...prev]);
  };

  const openChest = async (chestType: ChestType): Promise<boolean> => {
    const userId = getSupabaseUserId();
    if (!userId) return false;

    // Lógica especial para o Baú de Skin Comum (Exclusivo para Skins)
    if (chestType === 'Skin Comum') {
        // Filtrar apenas skins
        const allSkins = ITEMS_DB.filter(i => i.category === 'skin' && !i.isGoldExclusive && !i.isSeasonExclusive);
        
        // Rarity weights for Skin Comum chest
        // 75% Common, 20% Uncommon, 5% Rare
        const rand = Math.random() * 100;
        let targetRarity: ItemRarity = 'common';
        if (rand > 95) targetRarity = 'rare';
        else if (rand > 75) targetRarity = 'uncommon';
        
        const possibleSkins = allSkins.filter(s => s.rarity === targetRarity);
        // Fallback if no skins of that rarity found (shouldn't happen with current DB)
        const selectedSkin = possibleSkins.length > 0 
            ? possibleSkins[Math.floor(Math.random() * possibleSkins.length)]
            : allSkins[0];

        // Call RPC to grant the specific item (mimics open_chest logic)
        const { data, error } = await supabase.rpc('open_chest_specific', {
            p_chest_type: 'Skin Comum',
            p_item_id: selectedSkin.id
        });

        // Se o RPC open_chest_specific não existir, vamos tentar o open_chest padrão 
        // mas o ideal é que o backend suporte esse novo baú.
        // Como não podemos mudar o backend, vamos usar a lógica local e atualizar o DB manualmente se necessário.
        // Mas o sistema já tem recycle_item e craft_item que usam RPCs.
        
        if (error) {
            console.error("Error opening Skin Chest:", error);
            // Fallback: Tentar usar o open_chest normal se o específico falhar
            const { data: fallbackData, error: fallbackError } = await supabase.rpc('open_chest', {
                p_chest_type: 'Comum' // Fallback para comum se der erro no custom
            });
            if (fallbackError) {
            showToast("Erro: " + fallbackError.message);
            return false;
        }
        // Continue with fallback data
        handleChestOpenResult(fallbackData, 'Comum');
        return true;
    }

    if (data && data.success) {
        handleChestOpenResult(data, 'Skin Comum');
        return true;
    }
    return false;
}

const { data, error } = await supabase.rpc('open_chest', {
    p_chest_type: chestType
});

if (error) {
    console.error("Error opening chest:", error);
    showToast("Erro: " + error.message);
    return false;
}

    if (data && data.success) {
        handleChestOpenResult(data, chestType);
        return true;
    }
    return false;
  };

  // Helper to process chest opening results
  const handleChestOpenResult = (data: any, chestType: ChestType) => {
    const userId = getSupabaseUserId();
    if (!userId) return;

    // Show reward (item + fragments)
    const rewardMsg = `✦ +${data.item_name} (Tier ${data.tier}) · +${data.fragments_gained} Fragmentos!`;
    showToast(rewardMsg);

    // Update local state
    const newFragments = (userProfile.wallet?.fragments || 0) + data.fragments_gained;
    updateUserProfile({ wallet: { ...userProfile.wallet, fragments: newFragments } });
    
    if (!data.is_duplicate) {
         fetchInventory(userId);
    }
    
    // Update chest count locally
    setUserProfile(prev => {
        const existingChests = prev.chests || [];
        const chestIndex = existingChests.findIndex(c => c.type === chestType);
  
        if (chestIndex === -1 || existingChests[chestIndex].count === 0) return prev;
        
        const newChests = existingChests.map((chest, index) => 
          index === chestIndex ? { ...chest, count: chest.count - 1 } : chest
        ).filter(chest => chest.count > 0);
  
        return { ...prev, chests: newChests };
    });
  };
  


  const isQuestActionId = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return false;
    const arena = assets.flatMap(asset => asset.arenas).find(ar => ar.id === action.arenaId);
    if (!arena?.name) return false;
    const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return normalized.includes('quests');
  };

  const isClanQuestActionId = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return false;
    const arena = assets.flatMap(asset => asset.arenas).find(ar => ar.id === action.arenaId);
    if (!arena?.name) return false;
    const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return normalized.includes('quests - cla');
  };

  const resetDailyCommitment = () => {
    setDailyCommitmentState({ 
      date: getTodayString(), 
      taskIds: [], 
      stage: 'planning', 
      score: null, 
      expDeposited: null, 
      sitrepBonus: null,
      earnedInsigniaId: null 
    });
    setChecklistItems(prev => prev.map(item => ({ ...item, completed: false })));
  };
  const setDailyCommitment = (taskIds: string[]) => setDailyCommitmentState(prev => ({ ...prev, taskIds }));
  const lockDailyCommitment = () => setDailyCommitmentState(prev => ({...prev, stage: 'battle' }));

  useEffect(() => {
    const checkDailyReset = () => {
        const today = getTodayString();
        if (dailyCommitment.date !== today) {
            resetDailyCommitment();
            setChecklistItems(prev => prev.map(item => ({ ...item, completed: false })));
        }
    };

    checkDailyReset();
    const intervalId = window.setInterval(checkDailyReset, 60000);
    return () => window.clearInterval(intervalId);
  }, [dailyCommitment.date, resetDailyCommitment, setChecklistItems]);
  
  const endDailyBattle = () => {
    // Modified to include ALL tasks in the battle calculation (including Clan Quests)
    const committedTasks = tasks.filter(t => dailyCommitment.taskIds.includes(t.id) && t.date === dailyCommitment.date);
    const completedCount = committedTasks.filter(t => t.completed).length;
    const totalCount = committedTasks.length;
    const score = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

    const expDepositBase = committedTasks.reduce((sum, task) => {
        if (!task.completed) return sum;
        const action = actions.find(a => a.id === task.actionId);
        const duration = task.duration > 0 ? task.duration : (Number.isFinite(action?.duration) ? (action?.duration || 0) : 0);
        return sum + duration;
    }, 0);
    const sitrepBonus = score >= 95 ? SITREP_BONUS_S : score >= 85 ? SITREP_BONUS_A : 0;
    const expDeposited = expDepositBase + sitrepBonus;
    
    setAchievementUnlocked({
      type: 'REPORT_COMPLETED',
      data: {
        title: `Relatório Diário - ${score}%`,
        reward: {
          exp: expDeposited
        }
      }
    });

    const newStage = 'judgment';
    setDailyCommitmentState(prev => ({...prev, stage: newStage, score, expDeposited, sitrepBonus, earnedInsigniaId: null }));
    if (activeCycle && sitrepBonus > 0) {
        setCycleExpBonus(prev => prev + sitrepBonus);
    }
    
    // NEW: Show SITREP EXP toast
    if (expDeposited > 0) {
        showToast(`${expDeposited} EXP foi adicionada ao seu ciclo.`);
    }

    // Persist to Supabase if logged in
    const supabaseUserId = getSupabaseUserId();
    if (supabaseUserId) {
      const sitrepReport = {
        id: crypto.randomUUID(),
        user_id: supabaseUserId,
        date: dailyCommitment.date,
        score: score,
        completed_tasks: completedCount,
        total_tasks: totalCount,
        task_ids: dailyCommitment.taskIds,
        bonus_xp: sitrepBonus // Add explicit bonus_xp column if it exists or rely on recalculation
      };

      supabase.from('sitrep_reports').insert(sitrepReport).then(({ error }) => {
        if (error) console.error("Supabase SITREP report insert error:", error.message);
      });
    }
  };

  const manualCloseSITREP = () => {
    if (dailyCommitment.stage !== 'battle') return;
    endDailyBattle();
  };

  const saveSanctuaryPosition = async (payload: { clanId: string; userId: string; row: number; col: number; area: string; action: string; timestamp: string }) => {
    try {
      const uid = getSupabaseUserId();
      if (!uid) {
        console.error('Cannot save sanctuary position: User not authenticated');
        return;
      }

      // Usar Supabase para salvar posição, garantindo que user_id seja o do usuário logado
      const { error } = await supabase
        .from('sanctuary_positions')
        .upsert({
          clan_id: payload.clanId,
          user_id: uid, // Use auth uid instead of payload.userId to satisfy RLS
          row: payload.row,
          col: payload.col,
          area: payload.area,
          action: payload.action,
          timestamp: payload.timestamp
        }, {
          onConflict: 'clan_id,user_id'
        });

      if (error) {
        console.error('Failed to save sanctuary position to Supabase:', error);
      }
    } catch (e) {
      console.error('Failed to save sanctuary position:', e);
    }
  };

  const getSanctuaryPositionsForClan = async (clanId: string): Promise<Record<string, { row: number; col: number; area: string; action: string; timestamp: string }>> => {
    try {
      // Buscar posições do Supabase
      const { data, error } = await supabase
        .from('sanctuary_positions')
        .select('*')
        .eq('clan_id', clanId);

      if (error) {
        console.error('Failed to get sanctuary positions from Supabase:', error);
        return {};
      }

      if (!data || data.length === 0) {
        return {};
      }

      // Converter array do Supabase para objeto com userId como chave
      const positions: Record<string, { row: number; col: number; area: string; action: string; timestamp: string }> = {};
      data.forEach((position: any) => {
        positions[position.user_id] = {
          row: position.row,
          col: position.col,
          area: position.area,
          action: position.action,
          timestamp: position.timestamp
        };
      });

      return positions;
    } catch (e) {
      console.error('Failed to get sanctuary positions:', e);
      return {};
    }
  };

  const getSanctuaryAreaStats = useCallback(async (clanId: string): Promise<Record<string, { totalSeconds: number; lastUpdated: string }>> => {
    try {
      const currentTime = new Date().toISOString();
      const { data, error } = await supabase
        .from('sanctuary_area_stats')
        .select('*')
        .eq('clan_id', clanId);

      if (error) {
        console.error('Failed to get sanctuary area stats from Supabase:', error);
        return {};
      }

      if (!data || data.length === 0) {
        return {};
      }

      const stats: Record<string, { totalSeconds: number; lastUpdated: string }> = {};
      data.forEach((stat: any) => {
        stats[stat.area] = {
          totalSeconds: stat.total_seconds,
          lastUpdated: stat.last_updated || currentTime
        };
      });

      return stats;
    } catch (e) {
      console.error('Failed to get sanctuary area stats:', e);
      return {};
    }
  }, []);

  const updateSanctuaryAreaTime = async (clanId: string, area: string, seconds: number) => {
    try {
      const { data: currentStats, error: fetchError } = await supabase
        .from('sanctuary_area_stats')
        .select('total_seconds')
        .eq('clan_id', clanId)
        .eq('area', area)
        .maybeSingle();

      if (fetchError) {
        console.error('Failed to load sanctuary area time from Supabase:', fetchError);
        return;
      }

      const nextTotalSeconds = (currentStats?.total_seconds ?? 0) + seconds;
      const { error } = await supabase
        .from('sanctuary_area_stats')
        .upsert({
          clan_id: clanId,
          area: area,
          total_seconds: nextTotalSeconds,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'clan_id,area'
        });

      if (error) {
        console.error('Failed to update sanctuary area time in Supabase:', error);
      }
    } catch (e) {
      console.error('Failed to update sanctuary area time:', e);
    }
  };



  // Função para atualizar estatísticas do santuário baseada em tempo (Crescimento/Decaimento suave)
  const applySanctuaryAreaDecay = async (clanId: string, occupancy: Record<string, number>, totalMembers: number = 1) => {
    try {
      const currentTime = new Date();
      const areas = ['meditation', 'devotion', 'rest', 'garden'];
      
      // Constantes de Balanceamento (Baseado em 28800s = 100%)
      const MAX_POINTS = 28800; 
      // Ganho de 30% (8640s) por dia (86400s) -> mais rápido para incentivar
      const MAX_DAILY_GROWTH = MAX_POINTS * 0.30;
      const GROWTH_RATE_PER_SECOND = MAX_DAILY_GROWTH / 86400; 
      
      // Perda de 25% (7200s) por dia (86400s) -> decaimento visível
      const DECAY_RATE_PER_SECOND = (MAX_POINTS * 0.25) / 86400;

      // Intervalo mínimo de atualização reduzido para 10s para ser muito fluido
      const MIN_UPDATE_INTERVAL = 10;

      // OTIMIZAÇÃO: Buscar todos de uma vez para reduzir reads
      const { data: allStats, error: fetchError } = await supabase
        .from('sanctuary_area_stats')
        .select('area, total_seconds, last_updated')
        .eq('clan_id', clanId);
      
      if (fetchError) {
          console.error('Failed to fetch sanctuary stats:', fetchError);
          return;
      }

      const statsMap = new Map();
      if (allStats) {
          allStats.forEach((s: any) => statsMap.set(s.area, s));
      }

      for (const area of areas) {
        const currentStats = statsMap.get(area);

        const lastUpdated = currentStats?.last_updated ? new Date(currentStats.last_updated) : currentTime;
        // Se não existir, assume 50%
        let totalSeconds = currentStats ? Number(currentStats.total_seconds) : 14400;
        
        // Calcular tempo passado em segundos
        const secondsPassed = (currentTime.getTime() - lastUpdated.getTime()) / 1000;
        
        // Ignorar atualizações muito frequentes para economizar writes
        if (secondsPassed < MIN_UPDATE_INTERVAL && currentStats) continue;

        let change = 0;
        const activeUsers = occupancy[area] || 0;

        if (activeUsers > 0) {
           // Se ocupado: Cresce proporcionalmente à participação do clã
           // Meta: 10% ao dia se 100% do clã estiver participando
           const participationRatio = Math.min(1, activeUsers / Math.max(1, totalMembers));
           change = secondsPassed * GROWTH_RATE_PER_SECOND * participationRatio;
        } else {
           // Se vazio: Decai 5% ao dia
           change = -(secondsPassed * DECAY_RATE_PER_SECOND);
        }

        let nextTotalSeconds = totalSeconds + change;
        // Clamp entre 0 e Max
        nextTotalSeconds = Math.max(0, Math.min(MAX_POINTS, nextTotalSeconds));
        
        // Arredondar para inteiro para evitar "dígitos quebrados"
        const finalSeconds = Math.floor(nextTotalSeconds);
        
        // Se não mudou nada (devido ao arredondamento), ignora
        if (finalSeconds === Math.floor(totalSeconds) && currentStats) continue;

        // Atualizar no banco
        const { error: updateError } = await supabase
            .from('sanctuary_area_stats')
            .upsert({
            clan_id: clanId,
            area: area,
            total_seconds: finalSeconds,
            last_updated: currentTime.toISOString()
            }, {
            onConflict: 'clan_id,area'
            });
        
        if (updateError) {
            console.error(`Failed to update sanctuary stats for ${area}:`, updateError);
        }
      }
    } catch (e) {
      console.error('Failed to update sanctuary stats:', e);
    }
  };

  useEffect(() => {
    if (!clan?.id || !enableClanQuestProgress) return;
    fetchClanQuestProgress(clan.id);
    const intervalId = window.setInterval(() => fetchClanQuestProgress(clan.id), 15000);
    
    // Add periodic check for sanctuary decay (every minute)
    // This ensures that even if the modal isn't open, the decay is applied if the user is online
    const sanctuaryInterval = window.setInterval(() => {
        // We need to fetch occupancy for applySanctuaryAreaDecay
        // For now, let's just trigger it with empty occupancy or fetch it inside
        // Actually, applySanctuaryAreaDecay requires occupancy.
        // Let's assume we can fetch it or just pass empty if we want decay only.
        // BUT, getSanctuaryPositionsForClan is available.
        getSanctuaryPositionsForClan(clan.id).then(positions => {
             const occupancy: Record<string, number> = {};
             Object.values(positions).forEach(p => {
                 occupancy[p.area] = (occupancy[p.area] || 0) + 1;
             });
             // Also need total members... clan object has it? No, need enrichedClanMembers.length
             // But enrichedClanMembers might not be loaded fully?
             // Let's use a safe default or try to use what we have.
             const totalMembers = enrichedClanMembers.length || 1;
             applySanctuaryAreaDecay(clan.id, occupancy, totalMembers);
        });
    }, 60000); // 1 minute (reduced from 1 hour for visible decay)

    return () => {
        window.clearInterval(intervalId);
        window.clearInterval(sanctuaryInterval);
    };
  }, [clan?.id, fetchClanQuestProgress, enableClanQuestProgress, enrichedClanMembers.length]);

  // Real-time Clan Mission Progress & Participants
  useEffect(() => {
      if (!clan?.id) return;
      
      const channel = supabase
        .channel('public:clan_mission_data')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'clan_mission_progress',
                filter: `clan_id=eq.${clan.id}`
            },
            (payload) => {
                const { mission_id, current_value } = payload.new as any;
                if (mission_id && typeof current_value === 'number') {
                    setClanQuestProgress(prev => ({
                        ...prev,
                        [clan.id]: {
                            ...(prev[clan.id] || {}),
                            [mission_id]: current_value
                        }
                    }));
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'clan_mission_participants',
                filter: `clan_id=eq.${clan.id}`
            },
            async (payload) => {
                 // When participants change, refetch the count for the affected mission
                 const missionId = (payload.new as any)?.mission_id || (payload.old as any)?.mission_id;
                 if (missionId) {
                     // We can't just increment/decrement safely because we don't know the full state
                     // So we refetch the count
                     const { count } = await supabase
                        .from('clan_mission_participants')
                        .select('*', { count: 'exact', head: true })
                        .eq('clan_id', clan.id)
                        .eq('mission_id', missionId);
                        
                     if (count !== null) {
                         setClanQuestParticipants(prev => ({ ...prev, [missionId]: count }));
                     }
                 }
            }
        )
        .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, [clan?.id]);

  useEffect(() => {
    const activeArenas = assets.flatMap(asset => asset.arenas.filter(a => !a.isArchived));
    
    // Filter out arenas that are locked by any active campaign
    const lockedArenaIds = new Set<string>();
    campaigns.forEach(campaign => {
        if (campaign.status === 'active' && campaign.arenaConfig) {
            Object.entries(campaign.arenaConfig).forEach(([arenaId, config]: [string, any]) => {
                if (config.isLocked) {
                    lockedArenaIds.add(arenaId);
                }
            });
        }
    });

    // If activeCycle has specific arenaIds, only include those
    let activeArenaIds: Set<string>;
    if (activeCycle?.arenaIds && activeCycle.arenaIds.length > 0) {
        activeArenaIds = new Set(activeCycle.arenaIds.filter(id => !lockedArenaIds.has(id)));
    } else {
        activeArenaIds = new Set(activeArenas.map(a => a.id).filter(id => !lockedArenaIds.has(id)));
    }

    const activeActions = actions.filter(a => activeArenaIds.has(a.arenaId));

    // Create a count map of scheduled tasks to avoid nested loops.
    const scheduledCounts = tasks.reduce((acc, task) => {
        acc[task.actionId] = (acc[task.actionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const poolableActions = activeActions.filter(action => action.actionType !== 'Marco');

    const pool = poolableActions.flatMap(action => {
        if (isClanQuestActionId(action.id)) return [{ actionId: action.id, unlimited: true }];
        const scheduledCount = scheduledCounts[action.id] || 0;
        const repetitions = Number.isFinite(action.repetitions) ? Math.max(1, Math.floor(action.repetitions)) : 1;
        
        // MODIFICAÇÃO: Não reduzir o pool baseado nas tarefas já agendadas (scheduledCount).
        // Isso garante que as ações continuem aparecendo no Planner mesmo se já estiverem no Sitrep,
        // permitindo que o usuário veja o que planejou para o dia.
        const poolCount = repetitions; 
        
        return Array.from({ length: poolCount }, () => ({ actionId: action.id }));
    });
    
    setTaskPool(pool);
  }, [actions, tasks, assets, activeCycle?.arenaIds, campaigns]); 

  useEffect(() => { document.body.setAttribute('data-skin', userProfile.skin); }, [userProfile.skin]);

  useEffect(() => {
    const supabaseUserId = getSupabaseUserId();
    if (supabaseUserId) return;

    const displayedAssets = assets.filter(a => a.id !== 'geral');
    const totalLevel = displayedAssets.reduce((sum, asset) => sum + asset.level, 0);

    if (userProfile.level !== totalLevel) {
        updateUserProfile({ level: totalLevel });
    }
  }, [assets, userProfile.level, session?.user.id]);

  useEffect(() => {
    if (!hasHydratedFromSupabase) return;
    const oldRankId = userProfile.nobility.rankId;
    const currentExp = userProfile.nobility.exp || 0;
    const newRank = nobilityRanks.slice().reverse().find(r => currentExp >= r.expTotalRequired);
    const newRankId = newRank ? newRank.id : oldRankId;

    if (oldRankId !== newRankId) {
        const oldRankIndex = nobilityRanks.findIndex(r => r.id === oldRankId);
        const newRankIndex = nobilityRanks.findIndex(r => r.id === newRankId);
        
        // MODIFICAÇÃO: Só dispara se subiu de fato e não é o carregamento inicial (oldRankIndex !== -1)
        // E também não dispara se o novo rank for o inicial (Vagante) para evitar aviso no login para nível 1
        if (newRankIndex > oldRankIndex && oldRankIndex !== -1 && newRankIndex > 0) {
            if (newRank) {
                // Determine rank insignia ID
                const rankInsigniaId = `insignia_rank_${newRankIndex + 1}_${newRankId}`;

                // NEW: Grant rare insignia for rank up
                const rareInsigniaId = 'insignia_levelup_rara';
                grantUserUnlock('insignias', rareInsigniaId);
                grantInventoryItem(rareInsigniaId, true);

                // Grant specific rank insignia
                grantUserUnlock('insignias', rankInsigniaId);
                grantInventoryItem(rankInsigniaId, true);

                const allRankInsignias = [rareInsigniaId, rankInsigniaId];

                setAchievementUnlocked({ 
                    type: 'PLAYER_RANK_UP', 
                    data: { 
                        ...newRank,
                        reward: {
                            exp: 0, // Exp already added
                            items: allRankInsignias
                        }
                    } 
                });
                
                // Grant Rank Rewards
                const rewards = RANK_REWARDS[newRankId];
                if (rewards) {
                    rewards.forEach(reward => {
                        grantUserUnlock(reward.category, reward.itemId);
                        if (reward.category !== 'ui_skins') {
                            grantInventoryItem(reward.itemId);
                        } else {
                            // UI Skins don't go to inventory, just unlock
                            showToast(`Tema desbloqueado: ${reward.name}`, 'success');
                        }
                    });
                }
            }
        }
        updateUserProfile({ nobility: { ...userProfile.nobility, rankId: newRankId } });
    }
  }, [userProfile.nobility.exp, userProfile.nobility.rankId, hasHydratedFromSupabase]);

  const updateUserProfile = (profileData: Partial<UserProfile>) => {
    if (profileData.avatarUrl) {
        console.log("Updating profile avatarUrl:", profileData.avatarUrl);
    }
    setUserProfile(prev => ({ ...prev, ...profileData }));
    if (profileData.skin) {
        document.body.setAttribute('data-skin', profileData.skin);
    }
    const supabaseUserId = getSupabaseUserId();
    if (supabaseUserId) {
        if (!hasHydratedFromSupabase || suspendPersistenceRef.current) {
            pendingProfilePatchRef.current = {
                ...(pendingProfilePatchRef.current || {}),
                ...profileData,
            };
            return;
        }
        if (!isUuid(supabaseUserId)) {
            // console.error("Invalid Supabase User ID for profile update"); // Optional logging to avoid spam
            return;
        }
        const allowedKeys: (keyof UserProfile)[] = [
            'email',
            'sovereign',
            'avatarUrl',
            'border',
            'nickname',
            'level',
            'backgroundUrl',
            'bannerUrl',
            'isOnline',
            'visibleWidgets',
            'skin',
            'lastLevelUpdate',
            'nobility',
            'mood',
            'chests',
            'unlockedItems',
            'unlockedSkins',
            'completedSeasonMissions',
            'role',
            'isPremium',
            'appMode',
            'themePreference',
            'arenasViewMode'
        ];
        const entries = Object.entries(profileData).filter(([key, value]) => {
            if (!allowedKeys.includes(key as keyof UserProfile)) return false;
            if (value === undefined) return false;
            return true;
        });
        if (entries.length > 0) {
            for (const [key] of entries) {
                profileUpdateInFlightRef.current[key] = true;
            }
            const snakeCaseData = mapToSnakeCase(Object.fromEntries(entries));
            supabase.from('user_profiles').update(snakeCaseData).eq('id', supabaseUserId).then(({ error }) => {
                for (const [key] of entries) {
                    delete profileUpdateInFlightRef.current[key];
                }
                if (!error) return;
                console.error("Supabase profile update error:", error.message);
            });
        }
    }
  };

  const updateMood = (mood: number) => updateUserProfile({ mood });

  const updateLevelUnlocks = (next: LevelUnlocks) => {
    setLevelUnlocks(next);
  };

  const grantUserUnlock = (category: UnlockCategory, itemId: string) => {
    const unlockedItems: UserUnlocks = userProfile.unlockedItems || {
        bodyStyles: {},
        hairStyles: {},
        outfits: {},
        head_under_items: {},
        helmets: {},
        head_over_items: {},
        artifacts: {},
        codexes: {},
        skins: {},
        borders: {},
        banners: {},
        glyphs: {},
        auras: {},
        orbs: {},
        plates: {},
        insignias: {},
        ornament: {},
        ui_skins: {},
    };
    if (unlockedItems[category]?.[itemId]) return;
    const nextUnlockedItems = {
        ...unlockedItems,
        [category]: {
            ...unlockedItems[category],
            [itemId]: true,
        },
    };
    updateUserProfile({ unlockedItems: nextUnlockedItems });
  };

  const grantInventoryItem = async (itemId: string, silent: boolean = false) => {
      const userId = getSupabaseUserId();
      if (!userId) return;

      const { data, error } = await supabase
          .from('user_inventory')
          .insert({
              user_id: userId,
              item_id: itemId
          })
          .select()
          .single();

      if (error) {
          console.error("Error granting inventory item:", error);
          return;
      }

      if (data) {
          const newItem: InventoryItem = {
              id: data.item_id, // This should match ItemDef.id
              instanceId: data.id,
              acquiredAt: data.created_at || new Date().toISOString(),
              isEquipped: false
          };
          setInventory(prev => [...prev, newItem]);
          
          const itemDef = resolveItemDef(itemId);
          const isInsignia = itemDef?.category === 'insignias' || itemDef?.category === 'insignia';
          
          if (isInsignia) {
              console.log(`[Supabase] Insígnia persistida com sucesso: ${itemId} (ID: ${data.id})`);
          }

          if (!silent) {
            let toastMsg = '';
            if (isInsignia) {
                toastMsg = `Insígnia ${itemDef?.name || itemId} foi adicionada ao seu inventário.`;
            } else {
                const prefix = itemDef?.category === 'skin' ? 'Skin' : 'Item';
                const suffix = itemDef?.category === 'skin' ? 'foi adicionada ao seu inventário.' : 'foi adicionado ao seu inventário.';
                toastMsg = `${prefix} ${itemDef?.name || itemId} ${suffix}`;
            }
            
            showToast(toastMsg);
          }
      }
  };

  const addCompletedMission = (mission: SeasonMission) => {
    const completed = userProfile.completedSeasonMissions || [];
    if (completed.includes(mission.id)) return;

    // Handle XP Reward - Adds to Cycle Bonus to be computed at Cycle End
    if (mission.reward_type === 'exp') {
        const xpAmount = Number(mission.reward_value);
        if (!isNaN(xpAmount) && xpAmount > 0) {
             setCycleExpBonus(prev => prev + xpAmount);
             addFeedEvent({
                 type: 'LEVEL_UP', 
                 content: { title: `Missão Concluída: ${mission.title} (+${xpAmount} XP)`, icon: '✨' }
             });
        }
    }

    const rewardValue = typeof mission.reward_value === 'string' ? mission.reward_value : '';
    const rewardParts = rewardValue.includes(':') ? rewardValue.split(':') : [];
    const rewardCategory = rewardParts[0] as UnlockCategory | undefined;
    const rewardItemId = rewardParts[1];

    // Check for Badge/Inventory Item Reward
    if (mission.reward_type === 'item_id' && rewardCategory === 'ornament' && rewardItemId) {
        grantInventoryItem(rewardItemId);
    }
    
    // NEW: Grant insignia for quest completion
    // We grant a specific insignia if the mission has one, or a generic one if it's a season mission
    if (mission.reward_type === 'item_id' && (rewardCategory === 'insignias' || rewardCategory === 'insignia') && rewardItemId) {
        grantUserUnlock('insignias', rewardItemId);
        grantInventoryItem(rewardItemId);
    } else {
        // Generic insignia for completing ANY season mission/quest
        const genericInsigniaId = mission.type === 'season' ? 'insignia_quest_master' : 'insignia_quest_incomum';
        grantUserUnlock('insignias', genericInsigniaId);
        grantInventoryItem(genericInsigniaId, true); // Silent because the modal will show it
    }

    const unlockedItems: UserUnlocks = userProfile.unlockedItems || {
        bodyStyles: {},
        hairStyles: {},
        outfits: {},
        head_under_items: {},
        helmets: {},
        head_over_items: {},
        artifacts: {},
        codexes: {},
        skins: {},
        borders: {},
        banners: {},
        glyphs: {},
        auras: {},
        orbs: {},
        plates: {},
    };
    const shouldUnlock = mission.reward_type === 'item_id' && rewardCategory && rewardItemId;
    const nextUnlockedItems = shouldUnlock ? {
        ...unlockedItems,
        [rewardCategory]: {
            ...unlockedItems[rewardCategory],
            [rewardItemId]: true,
        },
    } : unlockedItems;

    updateUserProfile({
        completedSeasonMissions: [...completed, mission.id],
        unlockedItems: nextUnlockedItems,
    });
  };

  const addProfileFlag = (flag: string) => {
    const completed = userProfile.completedSeasonMissions || [];
    if (completed.includes(flag)) return;
    
    updateUserProfile({
        completedSeasonMissions: [...completed, flag],
    });
  };

  const updateAllAssetLevels = (levels: Record<string, number>, levelDescriptions?: Record<string, string[]>): boolean => {
    const lastUpdate = userProfile.lastLevelUpdate || 0;
    const threeDays = 72 * 60 * 60 * 1000;
    
    // Sem restrição para contas admin, gm ou admin_gm
    if (userProfile.role === 'admin' || userProfile.role === 'gm' || userProfile.role === 'admin_gm') {
        // Permite atualização imediata para contas privilegiadas
    } else if (Date.now() - lastUpdate < threeDays) {
        showToast("Você só pode atualizar seus níveis de maestria a cada 72 horas.");
        return false;
    }

    const nextTotalLevel = assets.filter(a => a.id !== 'geral').reduce((sum, asset) => {
        const nextLevel = levels[asset.id] ?? asset.level;
        return sum + nextLevel;
    }, 0);

    setAssets(prev => prev.map(asset => ({
        ...asset,
        level: levels[asset.id] || asset.level,
        levelDescriptions: levelDescriptions ? 
            levelDescriptions[asset.id]?.reduce((acc, desc, i) => ({ ...acc, [i+1]: desc }), {}) || asset.levelDescriptions 
            : asset.levelDescriptions
    })));

    const userId = getSupabaseUserId();
    if (userId) {
        const levelsPayload = assets.filter(a => a.id !== 'geral').map(asset => {
             const newLevel = levels[asset.id];
             if (newLevel === undefined) return null;
             return {
                user_id: userId,
                asset_id: asset.id,
                level: newLevel
            };
        }).filter(Boolean);

        if (levelsPayload.length > 0) {
            supabase.from('asset_levels').upsert(levelsPayload, { onConflict: 'user_id,asset_id' })
            .then(({ error }) => {
                if (error) console.error("Supabase update asset levels error:", error.message, error.details, error.hint);
            });
        }
    }

    updateUserProfile({ lastLevelUpdate: Date.now(), level: nextTotalLevel });
    return true;
  };

  const startCycle = (name: string, endDate: string, arenaIds?: string[]) => {
    const userId = getSupabaseUserId();
    if (!userId) return;
    const newCycle: Cycle = { 
        id: crypto.randomUUID(), 
        name, 
        startDate: new Date().toISOString().split('T')[0], 
        endDate: endDate,
        userId: userId,
        arenaIds: arenaIds || assets.flatMap(a => a.arenas.filter(ar => !ar.isArchived).map(ar => ar.id)),
        seasonId: ACTIVE_SEASON_ID
    };
    setCycleExpBonus(0);
    setActiveCycle(newCycle);

    // Sync to Supabase
    const snakeCaseCycle = {
        id: newCycle.id,
        user_id: userId,
        name: newCycle.name,
        start_date: newCycle.startDate,
        end_date: newCycle.endDate,
        arena_ids: newCycle.arenaIds,
        season_id: ACTIVE_SEASON_ID
    };
    supabase.from('cycles').insert(snakeCaseCycle).then(({ error }) => {
        if (error) console.error("Supabase start cycle error:", error.message);
    });
  };
  const endCycle = (currentAssets: Asset[], currentActions: Action[]): EndCycleResult => {
    const cycle = activeCycle;
    const supabaseUserId = getSupabaseUserId();
    const startDate = cycle?.startDate || '2000-01-01'; // Fallback para o primeiro ciclo sem data
    const endDate = new Date().toISOString().split('T')[0];
    const plannedEndDate = cycle?.endDate;
    const cycleSeasonId = cycle?.seasonId || ACTIVE_SEASON_ID; // Use stored season or default to current

    // 1. Filter Tasks
    // Standard Tasks (Planned) - Include Quests now as per user request
    const cycleTasks = tasks.filter(t => t.date >= startDate && t.date <= endDate);
    const completedTasks = cycleTasks.filter(t => t.completed);
    
    // Quest Tasks (kept for bonus calculation)
    const questTasks = tasks.filter(t => t.date >= startDate && t.date <= endDate && isQuestActionId(t.actionId));
    const completedQuests = questTasks.filter(t => t.completed);

    // 2. Calculate Fidelity (Base Score)
    // fidelidade = (ações realizadas / ações planejadas) × 100
    const fidelity = cycleTasks.length > 0 ? (completedTasks.length / cycleTasks.length) * 100 : 100;

    // 3. Calculate Bonuses
    // +10 per milestone (Marco)
    const getMilestones = (taskList: ScheduledTask[]) => taskList.filter(t => {
        const action = currentActions.find(a => a.id === t.actionId);
        return action?.actionType === 'Marco';
    }).length;

    // Since cycleTasks now includes quests, we only need to count milestones from completedTasks
    const milestonesCompleted = getMilestones(completedTasks);
    // Weighted Milestone Bonus: Metas are critical for a good cycle
    const milestoneBonus = milestonesCompleted * 15;

    // +5 per quest
    const questsCompletedCount = completedQuests.length;
    const questBonus = questsCompletedCount * 10; // Increased importance of quests

    // Consistency (Unique Days)
    const uniqueDays = new Set([...completedTasks, ...completedQuests].map(t => t.date)).size;
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const durationDays = Math.max(1, Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    // Consistency Bonus: 20 points if consistent (>80% of days active), scaled down
    const consistencyRatio = uniqueDays / durationDays;
    const consistencyBonus = consistencyRatio >= 0.8 ? 20 : (consistencyRatio >= 0.5 ? 10 : 0);

    // Volume Bonus (Hours of deep work)
    // User insight: 15h = 1000 XP. Good cycle needs "many hours".
    const totalMinutes = completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const volumeBonus = Math.min(30, Math.floor(totalHours / 2)); // Max 30 points for 60 hours

    // Final Performance Score (0-100+)
    // Base: Fidelity (0-100)
    // Plus: Metas, Quests, Consistency, Volume
    // We normalize to ensure it's a 0-100 grade mostly, but can exceed for S+
    let performanceScore = Math.round(
        (fidelity * 0.4) + // Fidelity is 40% of the grade
        milestoneBonus + 
        questBonus + 
        consistencyBonus + 
        volumeBonus
    );

    // Arenas e Ações envolvidas (baseado nas tarefas do ciclo)
    const actionIdsInCycle = new Set(cycleTasks.map(t => t.actionId));
    const involvedActions = currentActions.filter(a => actionIdsInCycle.has(a.id));
    
    const arenaIdsInCycle = new Set(involvedActions.map(a => a.arenaId));
    const involvedArenas = currentAssets.flatMap(as => as.arenas).filter(ar => arenaIdsInCycle.has(ar.id));

    // Highlights
    const arenaCompletionCounts = completedTasks.reduce((acc, task) => {
        const action = currentActions.find(a => a.id === task.actionId);
        if (action) acc[action.arenaId] = (acc[action.arenaId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    let mostFocusedArenaId = '';
    let maxArenaCompletions = 0;
    (Object.entries(arenaCompletionCounts) as Array<[string, number]>).forEach(([id, count]) => {
        if (count > maxArenaCompletions) {
            maxArenaCompletions = count;
            mostFocusedArenaId = id;
        }
    });
    const mostFocusedArena = involvedArenas.find(a => a.id === mostFocusedArenaId)?.name || 'Nenhuma';

    const actionCompletionCounts = completedTasks.reduce((acc, task) => {
        acc[task.actionId] = (acc[task.actionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    let mostRepeatedActionId = '';
    let maxActionCompletions = 0;
    (Object.entries(actionCompletionCounts) as Array<[string, number]>).forEach(([id, count]) => {
        if (count > maxActionCompletions) {
            maxActionCompletions = count;
            mostRepeatedActionId = id;
        }
    });
    const mostRepeatedAction = currentActions.find(a => a.id === mostRepeatedActionId)?.name || 'Nenhuma';
    
    // Calculate Exp Gained
    const expFromActions = completedTasks.reduce((sum, task) => {
        const duration = Number.isFinite(task.duration) ? task.duration : 0;
        if (duration > 0) return sum + duration;
        const action = currentActions.find(a => a.id === task.actionId);
        return sum + (action?.duration || 0);
    }, 0);
    const missionBonusExp = completedTasks.reduce((sum, task) => {
        const action = currentActions.find(a => a.id === task.actionId);
        if (action?.actionType !== 'Marco') return sum;
        const duration = Number.isFinite(task.duration) ? task.duration : (action?.duration || 0);
        return sum + duration;
    }, 0);
    const expGained = expFromActions + missionBonusExp + cycleExpBonus;

    // Calculate Clan Points (XP from completed clan quests)
    const activeSeason = SEASONS[ACTIVE_SEASON_ID];
    const clanPoints = completedQuests.reduce((sum, task) => {
        const action = currentActions.find(a => a.id === task.actionId);
        if (!action) return sum;
        const quest = activeSeason?.quests.find(q => 
            q.type === 'clan' && 
            (q.title === action.name || q.actionTemplate.name === action.name)
        );
        return sum + (quest?.rewards.xp || 0);
    }, 0);

    const newReport: Report = { 
        id: crypto.randomUUID(), 
        startDate, 
        endDate, 
        performanceScore, 
        cycleName: cycle?.name,
        seasonId: cycleSeasonId,
        metrics: { 
            actionsCompleted: completedTasks.length, 
            totalPlannedActions: cycleTasks.length, 
            arenasInvolved: involvedArenas.length, 
            goalsMet: milestonesCompleted, 
            totalHours: Math.round(completedTasks.reduce((sum, t) => sum + (t.duration / 60), 0)),
            questsCompleted: questsCompletedCount,
            consistencyDays: uniqueDays,
            expGained,
            plannedEndDate
        }, 
        highlight: { 
            mostFocusedArena, 
            mostFocusedArenaId,
            mostRepeatedAction,
            mostRepeatedActionCount: maxActionCompletions
        }, 
        clanPoints,
        assetProgress: currentAssets.map(asset => {
            if (asset.id === 'geral') return null;

            // Compute value as percentage of total actions dedicated to this asset
            const assetArenaIds = asset.arenas.map(a => a.id);
            const assetActionIds = currentActions.filter(a => assetArenaIds.includes(a.arenaId)).map(a => a.id);
            const assetCompletedCount = completedTasks.filter(t => assetActionIds.includes(t.actionId)).length;
            const totalCompleted = completedTasks.length;
            const value = totalCompleted > 0 ? (assetCompletedCount / totalCompleted) * 100 : 0;

            return {
                asset: asset.name,
                value: Math.round(value),
                assetId: asset.id,
                startLevel: asset.level,
                endLevel: asset.level,
                expGained: 0
            };
        }).filter(Boolean) as { asset: string; value: number }[]
    };

    // Salvar relatório e atualizar ciclo no Supabase se logado
    if (supabaseUserId) {
        const snakeCaseReport = {
            id: newReport.id,
            user_id: supabaseUserId,
            start_date: newReport.startDate,
            end_date: newReport.endDate,
            performance_score: newReport.performanceScore,
            metrics: newReport.metrics,
            highlight: newReport.highlight,
            asset_progress: newReport.assetProgress,
            cycle_name: newReport.cycleName,
            season_id: newReport.seasonId,
            clan_points: newReport.clanPoints
        };
        
        // 1. Update Cycle with Report Data (Single Source of Truth)
        if (cycle?.id) {
            const updatePayload = {
                end_date: endDate,
                report_data: snakeCaseReport,
                performance_score: newReport.performanceScore,
                season_id: newReport.seasonId
            };
            supabase.from('cycles').update(updatePayload).eq('id', cycle.id).then(({ error }) => {
                if (error) console.error("Supabase cycle update error:", error.message);
            });
        }
    }
    
    // Encerrar ciclo ativo
    setActiveCycle(null);
    setCycleExpBonus(0);
    
    // Adicionar relatório à lista
    setReports(prev => [newReport, ...prev]);

    return { report: newReport, expGained };
  };

  const applyExp = (expGained: number) => {
    if (!expGained) return;
    updateUserProfile({ nobility: { ...userProfile.nobility, exp: userProfile.nobility.exp + expGained } });
  };

  const addChest = async (chestType: ChestType) => {
    const userId = getSupabaseUserId();
    if (!userId) return;

    // Use RPC or direct insert
    const { error } = await supabase.rpc('grant_chest', {
        p_user_id: userId,
        p_chest_type: chestType
    });

    if (error) {
        console.error("Error adding chest:", error);
        return;
    }

    // Optimistically update or refetch profile
    setUserProfile(prev => {
      const existingChests = prev.chests || [];
      const chestIndex = existingChests.findIndex(c => c.type === chestType);
      
      let newChests;
      if (chestIndex >= 0) {
        newChests = existingChests.map((chest, index) => 
          index === chestIndex ? { ...chest, count: chest.count + 1 } : chest
        );
      } else {
        newChests = [...existingChests, { type: chestType, count: 1 }];
      }
      
      return { ...prev, chests: newChests };
    });
  };
  
  const startNewCycle = async (arenaChanges: ArenaSetupChange[], cycleDetails: { name: string; endDate: string; }) => {
    setCycleExpBonus(0);
    
    // Process arena changes
    for (const change of arenaChanges) {
        if (change.status === 'archive') {
            updateArena(change.id, { isArchived: true });
        } else if (change.status === 'delete') {
            await deleteArena(change.id);
        } else if (change.status === 'renew') {
            updateArena(change.id, { isArchived: false });
        }
        
        if (change.updatedData) {
            updateArena(change.id, change.updatedData);
        }
    }

    // Start the new cycle using the details provided
    const newArenaIds = arenaChanges
        .filter(c => c.status === 'renew' || (c.status !== 'archive' && c.status !== 'delete'))
        .map(c => c.id);
        
    startCycle(cycleDetails.name, cycleDetails.endDate, newArenaIds.length > 0 ? newArenaIds : undefined);
  };

  const setCurrentSkin = (skinId: string) => updateUserProfile({ skin: skinId });
  const addFriend = (nickname: string) => {
    if(nickname.trim() && !friends.find(f => f.nickname === nickname)) {
        const newFriend: UserProfile = { ...DEFAULT_USER_PROFILE, id: `friend_${Date.now()}`, nickname, sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, body: 'body_fem_1', hairStyle: 'parted', hairColor: '#B8860B' }, isOnline: Math.random() > 0.5 };
        setFriends(prev => [newFriend, ...prev]);
    }
  };

  const searchPlayers = async (query: string): Promise<UserProfile[]> => {
    const normalized = query.trim();
    if (!normalized) return [];

    // Remove numbers from end of string (like #1234) if present, though we search by nickname mostly
    const baseQuery = normalized.replace(/\d+$/g, '').trim();
    const searchTerms = [normalized];
    if (baseQuery && baseQuery !== normalized) searchTerms.push(baseQuery);

    // Parallel search by nickname and email
    const responses = await Promise.all(
        searchTerms.flatMap(term => ([
            supabase.from('user_profiles').select('*').ilike('nickname', `%${term}%`).limit(20),
            // Also search by email just in case
            supabase.from('user_profiles').select('*').ilike('email', `%${term}%`).limit(20),
        ]))
    );

    const errors = responses.map(r => r.error).filter(Boolean);
    if (errors.length > 0) {
        console.error('Error searching players:', errors[0]?.message);
        return [];
    }

    const merged = responses.flatMap(r => r.data || []);
    // Deduplicate by ID
    const mapped = mapToCamelCase(merged) as UserProfile[];
    const unique = Array.from(new Map(mapped.map(profile => [profile.id, profile])).values());

    // Filter out self and return top 20
    return unique.filter(profile => profile.id !== userProfile.id).slice(0, 20);
  };

  const getUserPublicData = useCallback(async (userId: string) => {
    if (!isUuid(userId)) return { profile: null, clan: null, clanRank: undefined, slots: [], levels: {} as Record<string, number> };

    const [clanRes, slotsRes, levelsRes, profileRes] = await Promise.all([
      supabase
        .from('clan_members')
        .select('clan_id, role, clans(*)')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('asset_slots')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('asset_levels')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
    ]);

    const clanData = clanRes.data?.clans ? mapToCamelCase(clanRes.data.clans) as Clan : null;
    const clanRank = clanData ? CLAN_RANKS.find(r => r.id === (clanData as any).rankId) : undefined;
    
    let publicProfile: UserProfile | null = null;
    if (profileRes.data) {
        publicProfile = mapToCamelCase(profileRes.data) as UserProfile;
    }

    // Merge slots with defaults to ensure all widgets are available even if not in DB
    const defaultAssets = createDefaultAssets(true);
    const allBaseSlots = defaultAssets.flatMap(a => a.slots);
    const userSlots: Slot[] = allBaseSlots.map(baseSlot => {
        const dbSlot = slotsRes.data?.find((s: any) => s.slot_id === baseSlot.id);
        if (dbSlot) {
            let val = dbSlot.value;
            try { val = JSON.parse(dbSlot.value); } catch {}
            return { ...baseSlot, value: val };
        }
        return baseSlot;
    });

    const userLevels: Record<string, number> = {};
    if (levelsRes.data) {
        levelsRes.data.forEach((l: any) => {
            userLevels[l.asset_id] = l.level;
        });
    }

    return { profile: publicProfile, clan: clanData, clanRank, slots: userSlots, levels: userLevels };
  }, []);

  const sendFriendRequest = async (recipientId: string): Promise<void> => {
    const senderId = getSupabaseUserId();
    if (!senderId) return;
    if (!recipientId || recipientId === senderId) return;
    if (!isUuid(recipientId)) {
        console.error("Invalid recipient ID for friend request");
        return;
    }
    if (friends.some(friend => friend.id === recipientId)) return;
    if (friendRequestsOutgoing.some(request => request.recipientId === recipientId)) return;
    if (friendRequestsIncoming.some(request => request.senderId === recipientId)) return;

    const { error } = await supabase.from('friend_requests').insert({
        sender_id: senderId,
        recipient_id: recipientId,
        status: 'pending',
    });
    if (error) {
        console.error('Error sending friend request:', error.message);
        return;
    }
    await loadFriendsAndRequests(senderId);
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    const userId = getSupabaseUserId();
    if (!userId) return;
    const request = friendRequestsIncoming.find(r => r.id === requestId);
    if (!request) return;

    if (!isUuid(request.senderId) || !isUuid(request.recipientId)) {
        console.error("Invalid sender or recipient ID in friend request");
        return;
    }

    const { error: updateError } = await supabase.from('friend_requests')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', requestId);
    if (updateError) {
        console.error('Error accepting friend request:', updateError.message);
        return;
    }

    const { error: insertError } = await supabase.from('friends').insert([
        { user_id: request.senderId, friend_id: request.recipientId },
        { user_id: request.recipientId, friend_id: request.senderId },
    ]);
    if (insertError) {
        console.error('Error creating friend link:', insertError.message);
        return;
    }

    await loadFriendsAndRequests(userId);
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    const userId = getSupabaseUserId();
    if (!userId) return;
    const { error } = await supabase.from('friend_requests')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', requestId);
    if (error) {
        console.error('Error declining friend request:', error.message);
        return;
    }
    await loadFriendsAndRequests(userId);
  };

  const cancelFriendRequest = async (requestId: string): Promise<void> => {
    const userId = getSupabaseUserId();
    if (!userId) return;
    // We delete pending requests that we sent
    const { error } = await supabase.from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', userId)
        .eq('status', 'pending'); // Safety check
        
    if (error) {
        console.error('Error canceling friend request:', error.message);
        return;
    }
    await loadFriendsAndRequests(userId);
  };
  
  const getActionById = (actionId: string) => actions.find(a => a.id === actionId);

  const getClanQuestProgress = (questId: string) => {
    if (!clan) return 0;
    return clanQuestProgress[clan.id]?.[questId] || 0;
  };

  const updateClanQuestProgress = async (questId: string, delta: number) => {
    if (!clan || !enableClanQuestProgress) return;
    
    // Optimistic update
    setClanQuestProgress(prev => {
        const clanProgress = prev[clan.id] || {};
        const currentValue = clanProgress[questId] || 0;
        const nextValue = Math.max(0, currentValue + delta);
        return { ...prev, [clan.id]: { ...clanProgress, [questId]: nextValue } };
    });

    const userId = getSupabaseUserId();
    if (userId && clanQuestProgressTableReadyRef.current) {
        // Fetch current value from DB to avoid race conditions
        const { data: currentData, error: fetchError } = await supabase
            .from('clan_mission_progress')
            .select('current_value')
            .eq('clan_id', clan.id)
            .eq('mission_id', questId)
            .maybeSingle();

        if (fetchError) {
            console.error("Error fetching clan quest progress for update:", fetchError.message);
            // Fallback to blind update if fetch fails? Better to stop to avoid corruption.
            return;
        }

        const dbValue = currentData?.current_value || 0;
        const nextValue = Math.max(0, dbValue + delta);

        supabase.from('clan_mission_progress').upsert({
            clan_id: clan.id,
            mission_id: questId,
            current_value: nextValue,
            last_updated: new Date().toISOString()
        }, { onConflict: 'clan_id,mission_id' }).then(({ error }) => {
            if (!error) {
                 // Update local state with the confirmed DB value
                 setClanQuestProgress(prev => {
                    const clanProgress = prev[clan.id] || {};
                    return { ...prev, [clan.id]: { ...clanProgress, [questId]: nextValue } };
                });
                return;
            }
            if (isClanQuestProgressMissing(error)) {
                clanQuestProgressTableReadyRef.current = false;
            }
        });
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };
  const addChecklistItem = (text: string) => {
    if (!text.trim()) return;
    const newItem: ChecklistItem = { id: crypto.randomUUID(), text, completed: false };
    setChecklistItems(prev => [...prev, newItem]);
  };
  const updateChecklistItem = (id: string, text: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, text } : item));
  };
  const deleteChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.filter(item => item.id !== id));
  };

  const updateAssetSlotValue = (assetId: string, slotId: string, value: SlotValue) => {
    setAssets(prevAssets => prevAssets.map(asset => asset.id === assetId ? { ...asset, slots: asset.slots.map(slot => slot.id === slotId ? { ...slot, value } : slot) } : asset));
    const userId = getSupabaseUserId();
    if (userId) {
        // Correct upsert for asset_slots: use user_id and slot_id as composite key or unique identifiers
        supabase.from('asset_slots').upsert({ 
            slot_id: slotId, 
            user_id: userId, 
            value: typeof value === 'object' ? JSON.stringify(value) : String(value) 
        }, { onConflict: 'user_id,slot_id' }).then(({ error }) => { 
            if (error) console.error("Supabase slot update error:", error.message); 
        });
    }
  };

  const getArenas = () => assets.flatMap(asset => asset.arenas);
  const addArena = async (assetId: string, arenaData: Omit<Arena, 'id' | 'assetId' | 'actionIds'>, skipDb: boolean = false): Promise<Arena> => {
    const newArena: Arena = { ...arenaData, id: crypto.randomUUID(), assetId, actionIds: [], isArchived: false };
    
    // Optimistic Update
    setAssets(prevAssets => prevAssets.map(asset => asset.id === assetId ? { ...asset, arenas: [...asset.arenas, newArena] } : asset));
    
    const userId = getSupabaseUserId();
    if (userId && !skipDb) {
        const snakeCaseData = { ...mapToSnakeCase(newArena), user_id: userId };
        delete snakeCaseData.action_ids; // Not a column
        delete snakeCaseData.folder_id;
        if (snakeCaseData.origin_codex_id && !isUuid(String(snakeCaseData.origin_codex_id))) {
            delete snakeCaseData.origin_codex_id;
        }
        
        // Non-blocking DB insert to prevent UI freeze
        supabase.from('arenas').insert(snakeCaseData).then(({ error }) => {
            if (error) {
                console.error("Supabase add arena error:", error.message);
                showToast("Erro ao salvar arena no servidor: " + error.message);
                // In a real app, we might want to rollback the optimistic update here
            }
        });
    }
    return newArena;
  };
  
  const updateArena = (arenaId: string, arenaData: Partial<Pick<Arena, 'name' | 'description' | 'icon' | 'folderId' | 'isArchived' | 'priority'>>) => {
    setAssets(prevAssets => prevAssets.map(asset => ({
        ...asset,
        arenas: asset.arenas.map(arena => arena.id === arenaId ? { ...arena, ...arenaData } : arena)
    })));
    const userId = getSupabaseUserId();
    if (userId) {
        const snakeCaseData = mapToSnakeCase(arenaData);
        supabase.from('arenas').update(snakeCaseData).eq('id', arenaId).then(({error}) => { 
            if (error) console.error("Supabase update arena error:", error.message);
        });
    }
  };

  // --- Arena Folders Logic ---
  const createArenaFolder = async (name: string, icon: string, assetId?: string): Promise<ArenaFolder | null> => {
      const newFolder: ArenaFolder = {
          id: crypto.randomUUID(),
          name,
          icon,
          assetId,
          status: 'active',
          createdAt: new Date().toISOString()
      };
      
      setArenaFolders(prev => [...prev, newFolder]);
      
      const userId = getSupabaseUserId();
      if (userId) {
          const snakeCaseData = { ...mapToSnakeCase(newFolder), user_id: userId };
          const { error } = await supabase.from('arena_folders').insert(snakeCaseData);
          if (error) {
              console.error("Supabase create folder error:", error.message);
              return null;
          }
      }
      return newFolder;
  };

  const updateArenaFolder = async (folderId: string, data: Partial<ArenaFolder>) => {
      setArenaFolders(prev => prev.map(f => f.id === folderId ? { ...f, ...data } : f));
      
      const userId = getSupabaseUserId();
      if (userId) {
          const snakeCaseData = mapToSnakeCase(data);
          const { error } = await supabase.from('arena_folders').update(snakeCaseData).eq('id', folderId);
          if (error) console.error("Supabase update folder error:", error.message);
      }
  };

  const deleteArenaFolder = async (folderId: string) => {
      // Move arenas out of folder first (or delete them? Usually move to root)
      // Here we will move them to root (folderId = null)
      setAssets(prevAssets => prevAssets.map(asset => ({
          ...asset,
          arenas: asset.arenas.map(a => a.folderId === folderId ? { ...a, folderId: undefined } : a)
      })));

      setArenaFolders(prev => prev.filter(f => f.id !== folderId));

      const userId = getSupabaseUserId();
      if (userId) {
          // Update arenas in DB to remove folder_id
          await supabase.from('arenas').update({ folder_id: null }).eq('folder_id', folderId);
          // Delete folder
          const { error } = await supabase.from('arena_folders').delete().eq('id', folderId);
          if (error) console.error("Supabase delete folder error:", error.message);
      }
  };

  const moveArenaToFolder = async (arenaId: string, folderId: string | null) => {
      updateArena(arenaId, { folderId: folderId || null }); // Use null explicitly for DB update
  };

  const reorderArena = async (arenaId: string, newIndexOrTargetId: number | string, side?: 'left' | 'right') => {
    let updatesToPersist: { id: string, order: number }[] = [];
    
    setAssets(prevAssets => {
        const allArenasAcrossAssets = prevAssets.flatMap(a => a.arenas);
        const draggedArena = allArenasAcrossAssets.find(a => a.id === arenaId);
        if (!draggedArena) return prevAssets;

        const targetArena = allArenasAcrossAssets.find(a => a.id === newIndexOrTargetId);
        if (!targetArena) return prevAssets;

        const folderId = draggedArena.folderId;
        const relevantArenas = allArenasAcrossAssets
            .filter(a => a.folderId === folderId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        const draggedIdx = relevantArenas.findIndex(a => a.id === arenaId);
        if (draggedIdx === -1) return prevAssets;

        const [movedArena] = relevantArenas.splice(draggedIdx, 1);

        let finalTargetIdx = relevantArenas.findIndex(a => a.id === newIndexOrTargetId);
        if (finalTargetIdx === -1) return prevAssets;
        
        if (side === 'right') finalTargetIdx += 1;

        relevantArenas.splice(finalTargetIdx, 0, movedArena);

        const reorderedGroup = relevantArenas.map((a, idx) => ({ ...a, order: idx }));
        
        // Prepare updates for persistence within the same logic
        updatesToPersist = reorderedGroup.map(a => ({ id: a.id, order: a.order }));

        return prevAssets.map(asset => ({
            ...asset,
            arenas: asset.arenas.map(arena => {
                const updated = reorderedGroup.find(u => u.id === arena.id);
                return updated ? { ...arena, order: updated.order } : arena;
            })
        }));
    });

    const userId = getSupabaseUserId();
    if (userId && updatesToPersist.length > 0) {
        const updates = updatesToPersist.map(u => ({
            id: u.id,
            user_id: userId,
            order: u.order
        }));
        
        const { error } = await supabase
            .from('arenas')
            .upsert(updates, { onConflict: 'id' });
            
        if (error) console.error("Supabase reorder update error:", error.message);
    }
  };

  const reorderArenaPriority = async (arenaId: string, priority: 'alta' | 'media' | 'baixa', newIndexOrTargetId: number | string) => {
    let updatesToPersist: { id: string, priority: string, priority_order: number }[] = [];

    setAssets(prevAssets => {
        const allArenasAcrossAssets = prevAssets.flatMap(a => a.arenas);
        const draggedArena = allArenasAcrossAssets.find(a => a.id === arenaId);
        if (!draggedArena) return prevAssets;

        // 1. Create a modified list where the dragged arena already has the NEW priority
        const modifiedArenas = allArenasAcrossAssets.map(a => 
            a.id === arenaId ? { ...a, priority } : a
        );
        
        // 2. Filter to the target priority group
        const priorityArenas = modifiedArenas
            .filter(a => (a.priority === priority) || (priority === 'media' && !a.priority))
            .sort((a, b) => (a.priorityOrder || 0) - (b.priorityOrder || 0));

        // 3. Find its current position in the TARGET group
        const draggedIdx = priorityArenas.findIndex(a => a.id === arenaId);
        if (draggedIdx === -1) return prevAssets;

        // 4. Remove and re-insert at the desired position
        const [movedArena] = priorityArenas.splice(draggedIdx, 1);
        
        let newIndex: number;
        if (typeof newIndexOrTargetId === 'string') {
            newIndex = priorityArenas.findIndex(a => a.id === newIndexOrTargetId);
            if (newIndex === -1) newIndex = priorityArenas.length;
        } else {
            newIndex = newIndexOrTargetId as number;
        }

        priorityArenas.splice(newIndex, 0, movedArena);

        // 5. Reassign priorityOrder within the group
        const reorderedGroup = priorityArenas.map((a, idx) => ({ 
            ...a, 
            priorityOrder: idx,
            priority: priority // Ensure priority is set correctly
        }));
        
        // Prepare updates for persistence
        updatesToPersist = reorderedGroup.map(a => ({ 
            id: a.id, 
            priority: a.priority || 'media', 
            priority_order: a.priorityOrder 
        }));

        // 6. Map back to assets
        return prevAssets.map(asset => ({
            ...asset,
            arenas: asset.arenas.map(arena => {
                const updated = reorderedGroup.find(u => u.id === arena.id);
                if (updated) {
                    return { 
                        ...arena, 
                        priority: updated.priority as any, 
                        priorityOrder: updated.priorityOrder 
                    };
                }
                // If it was the dragged arena but not in the reorderedGroup (shouldn't happen), 
                // still update its priority
                if (arena.id === arenaId) {
                    return { ...arena, priority };
                }
                return arena;
            })
        }));
    });

    const userId = getSupabaseUserId();
    if (userId && updatesToPersist.length > 0) {
        const updates = updatesToPersist.map(u => ({
            id: u.id,
            user_id: userId,
            priority: u.priority,
            priority_order: u.priority_order
        }));
        
        const { error } = await supabase
            .from('arenas')
            .upsert(updates, { onConflict: 'id' });
            
        if (error) console.error("Supabase priority reorder error:", error.message);
    }
  };

  const reorderEntity = async (draggedId: string, draggedType: 'arena' | 'campaign', targetId: string, targetType: 'arena' | 'campaign', side: 'left' | 'right' = 'left') => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        // 1. Get current flat list of everything sorted by current order
        const allArenas = getArenas().filter(a => !a.folderId && !a.isArchived); // Filtered similar to view
        
        // Filter out arenas that are inside campaigns (they are not top-level entities)
        const campaignArenaIds = campaigns.flatMap(c => c.arenaIds);
        const rootArenas = allArenas.filter(a => !campaignArenaIds.includes(a.id));

        // Create unified list
        const items = [
            ...campaigns.map(c => ({ id: c.id, type: 'campaign' as const, order: c.order || 0 })),
            ...rootArenas.map(a => ({ id: a.id, type: 'arena' as const, order: a.order || 0 }))
        ].sort((a, b) => a.order - b.order);

        // 2. Remove dragged item
        const draggedIndex = items.findIndex(i => i.id === draggedId && i.type === draggedType);
        if (draggedIndex === -1) return;
        
        const [movedItem] = items.splice(draggedIndex, 1);

        // 3. Find insertion index
        let targetIndex = items.findIndex(i => i.id === targetId && i.type === targetType);
        
        // If target not found (e.g. dropped at end of container), append
        if (targetIndex === -1) {
             items.push(movedItem);
        } else {
             if (side === 'right') targetIndex += 1;
             items.splice(targetIndex, 0, movedItem);
        }

        // 4. Reassign order and persist
        const updates = items.map((item, index) => ({
            id: item.id,
            type: item.type,
            order: index
        }));

        const arenaUpdates = updates.filter(u => u.type === 'arena');
        const campaignUpdates = updates.filter(u => u.type === 'campaign');

        // Optimistic Updates
        if (arenaUpdates.length > 0) {
            setAssets(prev => prev.map(a => ({
                ...a,
                arenas: a.arenas.map(ar => {
                    const up = arenaUpdates.find(u => u.id === ar.id);
                    return up ? { ...ar, order: up.order } : ar;
                })
            })));
             
            await supabase.from('arenas').upsert(arenaUpdates.map(u => ({ id: u.id, user_id: userId, order: u.order })));
        }

        if (campaignUpdates.length > 0) {
            setCampaigns(prev => prev.map(c => {
                const up = campaignUpdates.find(u => u.id === c.id);
                return up ? { ...c, order: up.order } : c;
            }));
            
            await supabase.from('campaigns').upsert(campaignUpdates.map(u => ({ id: u.id, user_id: userId, order: u.order })));
        }
    };

    const reorderEntityPriority = async (draggedId: string, draggedType: 'arena' | 'campaign', priority: 'alta' | 'media' | 'baixa', targetId?: string) => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        // 1. Get all items for THIS priority
        const allArenas = getArenas().filter(a => !a.folderId && !a.isArchived);
        const campaignArenaIds = campaigns.flatMap(c => c.arenaIds);
        const rootArenas = allArenas.filter(a => !campaignArenaIds.includes(a.id));

        // Get items that currently match the target priority (or default 'media')
        // We include the dragged item in this list IF it wasn't already there, treating it as if it moved in.
        // But simpler: just get all items that WILL be in this priority group.
        
        // Filter items that are NOT the dragged item, but ARE in the target priority
        const currentPriorityItems = [
            ...campaigns.filter(c => c.id !== draggedId && (c.priority === priority || (!c.priority && priority === 'media'))).map(c => ({ id: c.id, type: 'campaign' as const, priorityOrder: c.priorityOrder || 0 })),
            ...rootArenas.filter(a => a.id !== draggedId && (a.priority === priority || (!a.priority && priority === 'media'))).map(a => ({ id: a.id, type: 'arena' as const, priorityOrder: a.priorityOrder || 0 }))
        ].sort((a, b) => a.priorityOrder - b.priorityOrder);

        // Determine insertion index
        let insertIndex = currentPriorityItems.length;
        if (targetId) {
            const idx = currentPriorityItems.findIndex(i => i.id === targetId);
            if (idx !== -1) insertIndex = idx;
        }

        // Insert dragged item
        currentPriorityItems.splice(insertIndex, 0, { id: draggedId, type: draggedType, priorityOrder: 0 }); // Order will be reassigned

        // Reassign priorityOrder
        const updates = currentPriorityItems.map((item, index) => ({
            id: item.id,
            type: item.type,
            priorityOrder: index,
            priority: priority // Ensure priority is set correctly
        }));

        const arenaUpdates = updates.filter(u => u.type === 'arena');
        const campaignUpdates = updates.filter(u => u.type === 'campaign');

        // Optimistic Updates
        if (arenaUpdates.length > 0) {
            setAssets(prev => prev.map(a => ({
                ...a,
                arenas: a.arenas.map(ar => {
                    const up = arenaUpdates.find(u => u.id === ar.id);
                    // Update priority too if it's the dragged item
                    if (ar.id === draggedId) return { ...ar, priority: priority, priorityOrder: up ? up.priorityOrder : 0 };
                    return up ? { ...ar, priorityOrder: up.priorityOrder } : ar;
                })
            })));
             
            await supabase.from('arenas').upsert(arenaUpdates.map(u => ({ 
                id: u.id, 
                user_id: userId, 
                priority_order: u.priorityOrder,
                priority: priority // All items in this group have this priority
            })));
        }

        if (campaignUpdates.length > 0) {
            setCampaigns(prev => prev.map(c => {
                const up = campaignUpdates.find(u => u.id === c.id);
                // Update priority too if it's the dragged item
                if (c.id === draggedId) return { ...c, priority: priority, priorityOrder: up ? up.priorityOrder : 0 };
                return up ? { ...c, priorityOrder: up.priorityOrder } : c;
            }));
            
            await supabase.from('campaigns').upsert(campaignUpdates.map(u => ({ 
                id: u.id, 
                user_id: userId, 
                priority_order: u.priorityOrder,
                priority: priority
            })));
        }
    };

  const reorderAction = (arenaId: string, actionId: string, newIndex: number) => {
    setAssets(prevAssets => {
        return prevAssets.map(asset => {
            const arenaIndex = asset.arenas.findIndex(a => a.id === arenaId);
            if (arenaIndex === -1) return asset;

            const newArenas = [...asset.arenas];
            const arena = { ...newArenas[arenaIndex] };
            
            // Get current actionIds and handle if null
            const currentActionIds = [...(arena.actionIds || [])];
            
            // Remove from old position
            const oldIndex = currentActionIds.indexOf(actionId);
            if (oldIndex !== -1) {
                currentActionIds.splice(oldIndex, 1);
            }
            
            // Insert at new position
            currentActionIds.splice(newIndex, 0, actionId);
            
            arena.actionIds = currentActionIds;
            newArenas[arenaIndex] = arena;

            return { ...asset, arenas: newArenas };
        });
    });
  };

  const deleteArena = async (arenaId: string) => {
     const userId = getSupabaseUserId();
     const arena = getArenas().find(a => a.id === arenaId);
     const folderId = arena?.folderId;
     const normalizedArenaName = arena?.name
        ? arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        : '';
     const isQuestArena = normalizedArenaName.includes('quests - season') || normalizedArenaName.includes('quests - cla');
     
     // Check if the arena contains any clan mission actions and remove participation
      // We iterate ALL actions in the arena to see if they correspond to a clan quest
      // This handles cases where the arena name is wrong (e.g. "1") or customized
      const arenaActions = getActionsForArena(arenaId);
      let clanQuestFound = false;
      
      for (const action of arenaActions) {
          const activeSeason = SEASONS[ACTIVE_SEASON_ID];
          let quest = activeSeason?.quests.find(q => q.actionTemplate.name === action.name && q.type === 'clan');
          
          // FALLBACK: If action name doesn't match, check for "Ler" vs "Socializar" mismatch
          if (!quest && activeSeason) {
               // Check if the action name is "Leitura Focada" (old bug) and we have a "Unidade do Clã" quest
               if (action.name.includes('Leitura') || action.name.includes('Ler')) {
                   // quest = activeSeason.quests.find(q => q.id === 'quest-scholar'); // Should be scholar? Assuming existing logic was trying to fix something specific.
               }
               if (action.name.includes('Socializar') || action.name.includes('socializar')) {
                   quest = activeSeason.quests.find(q => q.id === 'quest-clan-unity');
               }
          }

          if (quest && clan) {
               clanQuestFound = true;
               if (userId) {
                   // Remove from clan_mission_participants
                   const { error } = await supabase.from('clan_mission_participants')
                       .delete()
                       .eq('clan_id', clan.id)
                       .eq('mission_id', quest.id)
                       .eq('user_id', userId);
                   
                   if (error) {
                       console.error("Error deleting clan mission participation:", error.message);
                       // If RLS prevents delete, it must be fixed in Supabase policies.
                       // Using migrations/20260219_fix_clan_mission_rls_v2.sql should resolve this.
                   } else {
                       console.log("Successfully deleted clan mission participation");
                   }
                       
                   // Update local state regardless of server success (optimistic leave) to unblock UI
                   setUserMissionParticipations(prev => {
                       const newState = { ...prev };
                       delete newState[quest.id];
                       return newState;
                   });
                   
                   // Update participants count locally (optimistic)
                   setClanQuestParticipants(prev => ({
                       ...prev,
                       [quest.id]: Math.max(0, (prev[quest.id] || 1) - 1)
                   }));
               }
          }
      }
      
      // If no quest was found via action matching, but the arena name is "1" or "Quests - Clã", 
      // and the user has a participation, maybe we should just remove them from the active clan quest?
      if (!clanQuestFound && clan) {
          const normalized = arena?.name ? arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
          if (normalized === '1' || normalized.includes('quests - cla') || normalized.includes('socializar') || normalized.includes('unidade')) {
               const activeSeason = SEASONS[ACTIVE_SEASON_ID];
               const defaultClanQuest = activeSeason?.quests.find(q => q.type === 'clan');
               if (defaultClanQuest) {
                   // Try to leave this one as a last resort
                   console.log("Attempting to leave default clan quest due to suspicious arena deletion (fallback)");
                   const userId = getSupabaseUserId();
                   if (userId) {
                        // Optimistic update first
                        setUserMissionParticipations(prev => {
                           const newState = { ...prev };
                           delete newState[defaultClanQuest.id];
                           return newState;
                       });
                       setClanQuestParticipants(prev => ({
                           ...prev,
                           [defaultClanQuest.id]: Math.max(0, (prev[defaultClanQuest.id] || 1) - 1)
                       }));

                        await supabase.from('clan_mission_participants')
                           .delete()
                           .eq('clan_id', clan.id)
                           .eq('mission_id', defaultClanQuest.id)
                           .eq('user_id', userId);
                   }
               }
          }
      }

     if (isQuestArena) {
        // If it's a season/clan quest arena, deleting it implies leaving/abandoning all quests within it
        if (userId && arenaActions.length > 0) {
            const activeSeason = SEASONS[ACTIVE_SEASON_ID];
            
            for (const action of arenaActions) {
                // Check for clan mission participation
                if (clan && normalizedArenaName.includes('quests - cla')) {
                    // Try to match action to quest
                    let quest = activeSeason?.quests?.find(q => q.actionTemplate.name === action.name && q.type === 'clan');
                    
                    // Fallback for hardcoded quests
                    if (!quest && activeSeason && (action.name.includes('Socializar') || action.name.includes('socializar'))) {
                        quest = activeSeason.quests.find(q => q.id === 'quest-clan-unity');
                    }

                    if (quest) {
                        console.log("Leaving clan mission via Arena Delete:", quest.title);
                        // Optimistic update
                        setUserMissionParticipations(prev => {
                            const newState = { ...prev };
                            delete newState[quest.id];
                            return newState;
                        });
                        setClanQuestParticipants(prev => ({
                            ...prev,
                            [quest.id]: Math.max(0, (prev[quest.id] || 1) - 1)
                        }));

                        // DB Update
                        supabase.from('clan_mission_participants')
                            .delete()
                            .eq('clan_id', clan.id)
                            .eq('mission_id', quest.id)
                            .eq('user_id', userId)
                            .then(({ error }) => {
                                if (error) console.error("Error deleting clan mission participation:", error.message);
                            });
                    }
                }
            }
        }

        if (arenaActions.length === 0) {
            updateArena(arenaId, { isArchived: true });
        } else {
             // If not empty, we proceed to delete the arena and its actions below, 
             // effectively "quitting" the quests.
        }
        // return; // REMOVED RETURN to allow deletion logic below to proceed
     }

     // CHECK FOR HISTORY: If any action has completed tasks, we must ARCHIVE instead of DELETE
     // This preserves the "color" (mastery/heatmap) of the user's history
     // We check BOTH local state (for speed/offline) and Supabase (for full history > 3 months)
     let actionsWithHistoryIds = new Set<string>();
     
     // 1. Local Check
     arenaActions.forEach(action => {
         if (tasks.some(t => t.actionId === action.id && t.completed)) {
             actionsWithHistoryIds.add(action.id);
         }
     });

     // 2. Remote Check (if user is online)
     if (userId && arenaActions.length > 0) {
         const actionIds = arenaActions.map(a => a.id);
         const { data: remoteHistory } = await supabase
             .from('scheduled_tasks')
             .select('action_id')
             .in('action_id', actionIds)
             .eq('completed', true)
             .limit(1000); // Limit to avoid massive payload, we just need existence
         
         remoteHistory?.forEach((h: any) => actionsWithHistoryIds.add(h.action_id));
     }

     const actionsWithHistory = arenaActions.filter(action => actionsWithHistoryIds.has(action.id));

     if (actionsWithHistory.length > 0) {
         console.log(`Arena ${arenaId} has history (${actionsWithHistory.length} actions). Archiving instead of deleting.`);
         
         // 1. Archive the Arena (updates Supabase via updateArena)
         updateArena(arenaId, { isArchived: true });
         
         // 2. Delete ONLY the actions that have NO history
         const actionsToDelete = arenaActions.filter(a => !actionsWithHistoryIds.has(a.id));
         
         if (actionsToDelete.length > 0) {
             setActions(prev => prev.filter(a => !actionsToDelete.some(del => del.id === a.id)));
             
             if (userId) {
                 const idsToDelete = actionsToDelete.map(a => a.id);
                 supabase.from('actions').delete().in('id', idsToDelete).then(({ error }) => {
                     if (error) console.error("Supabase delete unused actions error:", error.message);
                 });
             }
         }
         
         return; // Exit, do not fully delete the arena
     }

     setAssets(prevAssets => prevAssets.map(asset => ({
        ...asset,
        arenas: asset.arenas.filter(arena => arena.id !== arenaId)
    })));
    setActions(prevActions => prevActions.filter(action => action.arenaId !== arenaId));
    
    // Cleanup empty folder if needed
    if (folderId) {
        // We need to check if folder is empty AFTER deletion. 
        // Since state update is async, we check against current state minus the deleted one.
        const arenasInFolder = getArenas().filter(a => a.folderId === folderId && a.id !== arenaId);
        if (arenasInFolder.length === 0) {
            deleteArenaFolder(folderId);
        }
    }

    if (userId) {
        // Delete actions first to avoid orphans if no CASCADE is set
        await supabase.from('actions').delete().eq('arena_id', arenaId);
        
        supabase.from('arenas').delete().eq('id', arenaId).then(({error}) => { 
            if (error) console.error("Supabase delete arena error:", error.message);
        });
    }
  };
  const getActionsForArena = (arenaId: string) => actions.filter(a => a.arenaId === arenaId);
  const getAssetForAction = (actionId: string): Asset | undefined => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return undefined;
    const arena = getArenas().find(ar => ar.id === action.arenaId);
    if (!arena) return undefined;
    return assets.find(as => as.id === arena.assetId);
  };
  const getActionBackgroundStyle = (actionId: string): React.CSSProperties => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return { background: 'var(--asset-grad-default)' };
    const arena = getArenas().find(ar => ar.id === action.arenaId);
    if (arena?.name) {
        const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (normalized.includes('quests - season')) return { background: 'var(--quest-grad-season)' };
        if (normalized.includes('quests - cla')) return { background: 'var(--quest-grad-clan)' };
        if (normalized.includes('outros') || normalized.includes('sidequest') || normalized.includes('side quest')) return { background: 'var(--quest-grad-sidequest)' };
    }
    const asset = getAssetForAction(actionId);
    return { background: `var(--asset-grad-${asset?.id || 'default'})` };
  };

  const mergeScheduleIntoContext = (baseContext: Action['context'] | undefined, scheduledDays?: DayOfWeek[], scheduledStartTime?: number) => {
    const hasSchedule = scheduledDays !== undefined || scheduledStartTime !== undefined;
    if (!hasSchedule) return baseContext;
    const schedule = {
        ...(baseContext?.schedule || {}),
        ...(scheduledDays !== undefined ? { days: scheduledDays } : {}),
        ...(scheduledStartTime !== undefined ? { startTime: scheduledStartTime } : {})
    };
    return { ...(baseContext || {}), schedule };
  };

  const addAction = async (actionData: Omit<Action, 'id'>): Promise<Action> => {
    const newAction: Action = { ...actionData, id: crypto.randomUUID() };
    setActions(prev => [...prev, newAction]);
    setAssets(prevAssets => prevAssets.map(asset => {
        const arena = asset.arenas.find(ar => ar.id === newAction.arenaId);
        if (arena) {
            return {
                ...asset,
                arenas: asset.arenas.map(ar => {
                    if (ar.id !== newAction.arenaId) return ar;
                    const actionIds = Array.isArray(ar.actionIds) ? ar.actionIds : [];
                    return { ...ar, actionIds: [...actionIds, newAction.id] };
                })
            };
        }
        return asset;
    }));

    const userId = getSupabaseUserId();
    if (userId) {
        const contextPayload = mergeScheduleIntoContext(newAction.context, newAction.scheduledDays, newAction.scheduledStartTime);
        const originCodexId = newAction.originCodexId && isUuid(newAction.originCodexId) ? newAction.originCodexId : null;
        // Explicit payload construction to ensure compatibility with Supabase schema
        const actionPayload = {
            id: newAction.id,
            user_id: userId,
            arena_id: newAction.arenaId,
            name: newAction.name,
            description: newAction.description || null,
            icon: newAction.icon,
            duration: newAction.duration,
            repetitions: newAction.repetitions,
            action_type: newAction.actionType,
            difficulty: newAction.difficulty || null,
            briefing: newAction.briefing || null,
            assets: newAction.assets || [],
            pre_flight: newAction.preFlight || [],
            context: contextPayload || {},
            origin_codex_id: originCodexId
        };
        
        const { error } = await supabase.from('actions').insert(actionPayload);
        if (error) {
            console.error("Supabase add action error:", error.message);
            showToast("Erro ao salvar ação: " + error.message);
            throw error;
        }
    }

    return newAction;
  };
  const updateAction = (actionId: string, actionData: Partial<Action>) => {
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, ...actionData } : a));
    const userId = getSupabaseUserId();
    if (userId) {
        // Explicit payload construction for updates
        const updatePayload: any = {};
        if (actionData.name !== undefined) updatePayload.name = actionData.name;
        if (actionData.description !== undefined) updatePayload.description = actionData.description;
        if (actionData.icon !== undefined) updatePayload.icon = actionData.icon;
        if (actionData.duration !== undefined) updatePayload.duration = actionData.duration;
        if (actionData.repetitions !== undefined) updatePayload.repetitions = actionData.repetitions;
        if (actionData.actionType !== undefined) updatePayload.action_type = actionData.actionType;
        if (actionData.difficulty !== undefined) updatePayload.difficulty = actionData.difficulty;
        if (actionData.briefing !== undefined) updatePayload.briefing = actionData.briefing;
        if (actionData.assets !== undefined) updatePayload.assets = actionData.assets;
        if (actionData.preFlight !== undefined) updatePayload.pre_flight = actionData.preFlight;
        if (actionData.context !== undefined || actionData.scheduledDays !== undefined || actionData.scheduledStartTime !== undefined) {
            updatePayload.context = mergeScheduleIntoContext(actionData.context, actionData.scheduledDays, actionData.scheduledStartTime);
        }
        
        if (Object.keys(updatePayload).length > 0) {
            supabase.from('actions').update(updatePayload).eq('id', actionId).then(({error}) => { 
                if (error) console.error("Supabase update action error:", error.message);
            });
        }
    }
  };
  const deleteAction = async (actionId: string) => {
    // Check if we need to remove the arena (if it becomes empty and is a special quest arena)
    const action = actions.find(a => a.id === actionId);
    const arenaId = action?.arenaId;

    // Remove clan mission participation if applicable
    if (action && clan) {
        const activeSeason = SEASONS[ACTIVE_SEASON_ID];
        let quest = activeSeason?.quests?.find(q => q.actionTemplate.name === action.name && q.type === 'clan');
        
        if (!quest && activeSeason) {
             // Fallback logic matches deleteArena
             if (action.name.includes('Socializar') || action.name.includes('socializar')) {
                 quest = activeSeason.quests.find(q => q.id === 'quest-clan-unity');
             }
        }

        if (quest) {
            console.log("Leaving clan mission via deleteAction:", quest.title);
            const userId = getSupabaseUserId();
            if (userId) {
                 // Optimistic update
                 setUserMissionParticipations(prev => {
                    const newState = { ...prev };
                    delete newState[quest.id];
                    return newState;
                });
                setClanQuestParticipants(prev => ({
                    ...prev,
                    [quest.id]: Math.max(0, (prev[quest.id] || 1) - 1)
                }));

                 const { error } = await supabase.from('clan_mission_participants')
                    .delete()
                    .eq('clan_id', clan.id)
                    .eq('mission_id', quest.id)
                    .eq('user_id', userId);
                 
                 if (error) console.error("Error deleting clan mission participation:", error.message);
            }
        }
    }
    
    setActions(prev => prev.filter(a => a.id !== actionId));
    setTasks(prev => prev.filter(t => t.actionId !== actionId));
    
    setAssets(prevAssets => {
        return prevAssets.map(asset => {
            // Check if this asset contains the arena
            const hasArena = asset.arenas.some(ar => ar.id === arenaId);
            if (!hasArena) return asset;

            return {
                ...asset,
                arenas: asset.arenas.map(arena => {
                    if (arena.id !== arenaId) return arena;
                    const actionIds = Array.isArray(arena.actionIds) ? arena.actionIds : [];
                    return {
                        ...arena,
                        actionIds: actionIds.filter(id => id !== actionId)
                    };
                })
            };
        });
    });

    // Post-deletion check for empty special arenas
    if (arenaId) {
        // We need to check the state AFTER the deletion, but we can't access next state here easily.
        // So we check if it WAS the last action.
        const arena = getArenas().find(ar => ar.id === arenaId);
        if (arena) {
            const remainingActions = actions.filter(a => a.arenaId === arenaId && a.id !== actionId);
            if (remainingActions.length === 0) {
                const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                if (normalized.includes('quests - season') || normalized.includes('quests - cla')) {
                    updateArena(arenaId, { isArchived: true });
                }
                setTimeout(() => deleteArena(arenaId), 0);
            }
        }
    }

    const userId = getSupabaseUserId();
    if (userId) {
        supabase.from('actions').delete().eq('id', actionId).then(({error}) => { 
            if (error) console.error("Supabase delete action error:", error.message);
        });
    }
  };

  const acceptSeasonQuest = async (questId: string) => {
    const activeSeason = SEASONS[ACTIVE_SEASON_ID];
    if (!activeSeason) return;
    
    const quest = activeSeason.quests.find(q => q.id === questId);
    if (!quest) return;

    // If it's a clan quest, ensure the user joins the mission participants list
    if (quest.type === 'clan') {
        joinClanMission(quest.id);
    }

    // 1. Global Check: Does this action already exist anywhere AND is the arena valid?
    // This prevents duplicate actions even if arenas are duplicated.
    const arenas = getArenas();
    const existingAction = actions.find(a => a.name === quest.actionTemplate.name);
    const isActionValid = existingAction && arenas.some(ar => ar.id === existingAction.arenaId);

    if (isActionValid) {
        // If the action exists locally AND belongs to a valid arena, we assume the user is already "in" the quest.
        
        // Special handling for Clan Quests: Ensure remote participation matches local state
        if (quest.type === 'clan' && clan) {
             const isParticipating = userMissionParticipations[quest.id];
             if (!isParticipating) {
                 console.log("User has valid action but not participating in clan quest. Re-joining...");
                 await joinClanMission(quest.id);
                 alert("Sincronizando participação na missão de clã...");
                 return;
             }
        }

        alert("Você já aceitou esta missão!");
        return;
    } else if (existingAction) {
        // Action exists but arena is missing (Orphaned/Ghost action).
        // We should clean it up locally and proceed with creating a new one.
        console.warn("Found orphaned action (arena missing). Cleaning up and recreating.", existingAction);
        setActions(prev => prev.filter(a => a.id !== existingAction.id));
        // Proceed to create...
    }

    const isClanQuest = quest.type === 'clan';
    const seasonArenaName = isClanQuest ? 'Quests - Clã' : `Quests - Season ${activeSeason.name}`;
    
    // 2. Robust Arena Search
    // Normalize names to ensure we find existing arenas regardless of minor discrepancies
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const targetName = normalize(seasonArenaName);
    
    let arena = getArenas().find(a => normalize(a.name) === targetName);
    
    if (!arena) {
        const assetId = assets[0]?.id || 'geral';
        // Create locally but skip auto-DB insert to ensure order
        arena = await addArena(assetId, {
            name: seasonArenaName,
            description: isClanQuest ? 'Missões Coletivas do Clã' : `Missões da temporada ${activeSeason.name}`,
            icon: isClanQuest ? '🛡️' : '📜'
        }, true);

        // Manually persist and await
        const userId = getSupabaseUserId();
    if (userId) {
        try {
            const snakeCaseData = { ...mapToSnakeCase(arena), user_id: userId };
            delete snakeCaseData.action_ids;
            const { error } = await supabase.from('arenas').insert(snakeCaseData);
            if (error) {
                console.error("Supabase add arena error:", error.message);
                // Non-blocking error if it's just a sync issue
            }
        } catch (e) {
            console.error("Supabase insert error caught:", e);
        }
    }
    }

    if (arena?.isArchived) {
        updateArena(arena.id, { isArchived: false });
    }

    const newAction = await addAction({
        arenaId: arena.id,
        name: quest.actionTemplate.name,
        description: quest.actionTemplate.description,
        icon: isClanQuest ? '🛡️' : quest.actionTemplate.icon, // Change icon for clan missions to shield
        duration: quest.actionTemplate.duration,
        repetitions: isClanQuest ? 50 : (quest.actionTemplate.repetitions || 1), // Set 50 repetitions for clan quest
        actionType: quest.actionTemplate.isMilestone ? 'Marco' : 'Ação Recorrente',
        difficulty: 3
    });

    // Ensure action is persisted to DB immediately to avoid "disappearing" on reload if sync is slow
    const userId = getSupabaseUserId();
    if (userId) {
        // Explicit payload construction
        const questPayload = {
             id: newAction.id,
             user_id: userId,
             arena_id: newAction.arenaId,
             name: newAction.name,
             description: newAction.description || null,
             icon: newAction.icon,
             duration: newAction.duration,
             repetitions: newAction.repetitions,
             action_type: newAction.actionType,
             difficulty: newAction.difficulty || null,
             briefing: newAction.briefing || null,
             assets: newAction.assets || [],
             pre_flight: newAction.preFlight || [],
             context: newAction.context || {},
             origin_codex_id: newAction.originCodexId || null
        };

        const { error } = await supabase.from('actions').upsert(questPayload, { onConflict: 'id' });
        if (error) {
             console.error("Supabase add action manual persist error:", error.message);
        }
    }
    
    // For Clan Quests: Initialize or join shared progress
    if (isClanQuest && clan) {
        // Ensure shared progress entry exists (idempotent upsert)
        // We do this to ensure there's a record to update
        await supabase.from('clan_mission_progress').upsert({
            clan_id: clan.id,
            mission_id: quest.id,
            target_value: 50, // Default target
        }, { onConflict: 'clan_id,mission_id', ignoreDuplicates: true }); // Only insert if missing

        // Also join the mission as a participant
        await joinClanMission(quest.id);
    }

    alert(`Missão "${quest.title}" aceita! Verifique a arena "${seasonArenaName}" no seu Planner.`);
  };

  const abortSeasonQuest = async (questId: string) => {
    const quest = seasonQuests.find(q => q.id === questId);
    if (!quest) return;

    // 1. If it's a clan quest, remove participation
    if (quest.type === 'clan') {
        await leaveClanMission(quest.id);
    }

    // 2. Find and delete associated action
    const existingAction = actions.find(a => a.name === quest.actionTemplate.name);
    if (existingAction) {
        // Delete action locally
        setActions(prev => prev.filter(a => a.id !== existingAction.id));
        
        // Delete action from Supabase
        const { error } = await supabase
            .from('actions')
            .delete()
            .eq('id', existingAction.id);
            
        if (error) {
            console.error("Error deleting season quest action:", error);
        }
    }

    showToast(`Missão "${quest.title}" abandonada.`);
  };

  const claimSeasonQuest = async (questId: string) => {
    const activeSeason = SEASONS[ACTIVE_SEASON_ID];
    if (!activeSeason) return;
    const quest = activeSeason.quests.find(q => q.id === questId);
    if (!quest) return;

    if (userProfile.completedSeasonMissions?.includes(questId)) {
        showToast("Recompensa já resgatada!");
        return;
    }

    // Add XP
    const currentExp = userProfile.nobility.exp;
    const addedExp = quest.rewards.xp;
    const nextExp = currentExp + addedExp;

    // Check for chest rewards in description
    let earnedChest: string | null = null;
    if (quest.description.includes("Baú Comum")) earnedChest = 'Comum';
    else if (quest.description.includes("Baú Incomum")) earnedChest = 'Incomum';
    else if (quest.description.includes("Baú Ciclo")) earnedChest = 'Ciclo';
    else if (quest.description.includes("Baú Raro")) earnedChest = 'Raro';
    else if (quest.description.includes("Baú Épico")) earnedChest = 'Épico';
    else if (quest.description.includes("Baú Lendário")) earnedChest = 'Lendário';

    if (earnedChest) await addChest(earnedChest);

    // Grant items from rewards
    const earnedItemIds: string[] = [];
    if (quest.rewards?.items) {
        for (const itemId of quest.rewards.items) {
            const def = resolveItemDef(itemId);
            if (def?.category === 'insignia') {
                grantUserUnlock('insignias', itemId);
            }
            grantInventoryItem(itemId, true); // Silent
            earnedItemIds.push(itemId);
        }
    }

    // Grant uncommon insignia for quest completion
    const questInsigniaId = 'insignia_quest_incomum';
    grantUserUnlock('insignias', questInsigniaId);
    grantInventoryItem(questInsigniaId, true);
    earnedItemIds.push(questInsigniaId);

    // Check if this completion should grant a rank insignia (levelup flow)
    const nextRank = NOBILITY_RANKS.find(r => r.expTotalRequired <= nextExp && r.expTotalRequired > currentExp);
    if (nextRank) {
        const rankInsigniaId = `insignia_rank_${NOBILITY_RANKS.indexOf(nextRank) + 1}_${nextRank.id}`;
        grantUserUnlock('insignias', rankInsigniaId);
        grantInventoryItem(rankInsigniaId, true);
        earnedItemIds.push(rankInsigniaId);
    }

    // Update Profile (Removing gold)
    updateUserProfile({
        nobility: { ...userProfile.nobility, exp: nextExp },
        completedSeasonMissions: [...(userProfile.completedSeasonMissions || []), questId]
    });

    addFeedEvent({
        type: 'QUEST_COMPLETED', // Changed from MILESTONE_COMPLETED
        content: { title: `Quest Completada: ${quest.title}`, icon: '🏆', score: addedExp }
    });

    // Determine all insignias to show in modal
    // Deduplicate IDs
    const allEarnedItems: string[] = [...new Set(earnedItemIds)];

    // If Ranked Up, show PLAYER_RANK_UP modal with all rewards
    if (nextRank) {
        setAchievementUnlocked({
            type: 'PLAYER_RANK_UP',
            data: {
                name: nextRank.name,
                rank: nextRank,
                rewards: {
                    exp: addedExp,
                    items: allEarnedItems,
                    chest: earnedChest
                }
            }
        });
    } else {
        setAchievementUnlocked({
            type: 'QUEST_COMPLETED',
            data: {
                title: quest.title,
                reward: {
                    exp: addedExp,
                    items: allEarnedItems,
                    chest: earnedChest
                }
            }
        });
    }
  };

  const claimSeasonMission = async (missionId: string) => {
    const mission = GM_CONFIG.seasonMissions.find(m => m.id === missionId);
    if (!mission) return;

    if (userProfile.completedSeasonMissions?.includes(missionId)) {
        showToast("Recompensa já resgatada!");
        return;
    }

    // Add XP
    const currentExp = userProfile.nobility.exp;
    const addedExp = mission.reward_value;
    const nextExp = currentExp + addedExp;

    // Check for chest rewards in description
    if (mission.description.includes("Baú Comum")) await addChest('Comum');
    if (mission.description.includes("Baú Incomum")) await addChest('Incomum');
    if (mission.description.includes("Baú Ciclo")) await addChest('Ciclo');
    if (mission.description.includes("Baú Raro")) await addChest('Raro');
    if (mission.description.includes("Baú Épico")) await addChest('Épico');
    if (mission.description.includes("Baú Lendário")) await addChest('Lendário');

    // Grant items if it's an item reward
    const earnedItemIds: string[] = [];
    if (mission.reward_type === 'item_id' && typeof mission.reward_value === 'string') {
        const itemId = mission.reward_value;
        const def = resolveItemDef(itemId);
        if (def?.category === 'insignia') {
            grantUserUnlock('insignias', itemId);
        }
        grantInventoryItem(itemId, true); // Silent
        earnedItemIds.push(itemId);
    }

    // Grant uncommon insignia for mission completion
    const questInsigniaId = 'insignia_quest_incomum';
    grantUserUnlock('insignias', questInsigniaId);
    grantInventoryItem(questInsigniaId, true);
    earnedItemIds.push(questInsigniaId);

    // Check if this completion should grant a rank insignia (levelup flow)
    const nextRank = NOBILITY_RANKS.find(r => r.expTotalRequired <= nextExp && r.expTotalRequired > currentExp);
    if (nextRank) {
        const rankInsigniaId = `insignia_rank_${NOBILITY_RANKS.indexOf(nextRank) + 1}_${nextRank.id}`;
        grantUserUnlock('insignias', rankInsigniaId);
        grantInventoryItem(rankInsigniaId, true);
        earnedItemIds.push(rankInsigniaId);
    }

    // Update Profile
    updateUserProfile({
        nobility: { ...userProfile.nobility, exp: nextExp },
        completedSeasonMissions: [...(userProfile.completedSeasonMissions || []), missionId]
    });

    addFeedEvent({
        type: 'QUEST_COMPLETED',
        content: { title: `Missão de Temporada: ${mission.title}`, icon: '🌟', score: Number(addedExp) }
    });

    // Determine all insignias to show in modal
    // Deduplicate IDs
    const allEarnedItems: string[] = [...new Set(earnedItemIds)];

    // If Ranked Up, show PLAYER_RANK_UP modal with all rewards
    if (nextRank) {
        setAchievementUnlocked({
            type: 'PLAYER_RANK_UP',
            data: {
                name: nextRank.name,
                rank: nextRank,
                rewards: {
                    exp: addedExp,
                    items: allEarnedItems,
                    chest: earnedChest
                }
            }
        });
    } else {
        setAchievementUnlocked({
            type: 'QUEST_COMPLETED',
            data: {
                title: mission.title,
                reward: {
                    exp: addedExp,
                    items: allEarnedItems
                }
            }
        });
    }
  };
  
  const scheduleMultipleTasks = async (actionOrId: string | Action, daysOfWeek: DayOfWeek[], startTimeInMinutes: number) => {
    const action = typeof actionOrId === 'string' ? getActionById(actionOrId) : actionOrId;
    if (!action) return;
    const actionId = action.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMap: DayOfWeek[] = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    // Check existing tasks for duplicates
    const existingKeys = new Set(tasks.map(t => `${t.actionId}_${t.date}_${t.startTime}`));
    const newTasks: ScheduledTask[] = [];

    for (let i = 0; i < 7; i += 1) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayKey = dayMap[date.getDay()];
        if (!daysOfWeek.includes(dayKey)) continue;

        const dateString = date.toISOString().split('T')[0];
        const key = `${actionId}_${dateString}_${startTimeInMinutes}`;
        if (existingKeys.has(key)) continue;

        newTasks.push({
            id: crypto.randomUUID(),
            actionId: actionId,
            date: dateString,
            startTime: startTimeInMinutes,
            duration: action.duration,
            completed: false,
        });
        existingKeys.add(key);
    }

    if (newTasks.length === 0) return;

    setTasks(prevTasks => [...prevTasks, ...newTasks]);

    const userId = getSupabaseUserId();
    if (userId) {
        const snakeCaseData = newTasks.map(task => ({ ...mapToSnakeCase(task), user_id: userId }));
        const { error } = await supabase.from('scheduled_tasks').insert(snakeCaseData);
        if (error) {
            console.error("Supabase schedule multiple tasks error:", error.message);
            showToast("Erro ao agendar tarefas recorrentes: " + error.message);
            throw error;
        }
    }
  };
  const scheduleTask = async (actionOrId: string | Action, date: string, startTime: number): Promise<ScheduledTask | undefined> => {
      const action = typeof actionOrId === 'string' ? getActionById(actionOrId) : actionOrId;
      if (!action) return undefined;
      const actionId = action.id;

      const newTask: ScheduledTask = {
        id: crypto.randomUUID(),
        actionId: actionId,
        date: date,
        startTime: startTime,
        duration: action.duration,
        completed: false,
      };

      setTasks(prevTasks => [...prevTasks, newTask]);

      const userId = getSupabaseUserId();
      if (userId) {
          const snakeCaseData = { ...mapToSnakeCase(newTask), user_id: userId };
          const { error } = await supabase.from('scheduled_tasks').insert(snakeCaseData);
          if (error) {
              console.error("Supabase schedule task error:", error.message);
              showToast("Erro ao agendar tarefa: " + error.message);
              throw error;
          }
      }

      return newTask;
  };

  const normalizeQuestLabel = (value?: string) => {
    if (!value) return '';
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  const getClanQuestForActionName = (actionName?: string): SeasonQuest | null => {
    if (!actionName) return null;
    const normalized = normalizeQuestLabel(actionName);
    const direct = seasonQuests.find(q => q.type === 'clan' && normalizeQuestLabel(q.actionTemplate?.name) === normalized);
    if (direct) return direct;
    const byTitle = seasonQuests.find(q => q.type === 'clan' && normalizeQuestLabel(q.title) === normalized);
    if (byTitle) return byTitle;
    if (normalized.includes('socializar')) {
        return seasonQuests.find(q => q.id === 'quest-clan-unity') || null;
    }
    return null;
  };

  const getClanQuestsForArena = (arena: Arena, arenaActions: Action[]) => {
    const map = new Map<string, SeasonQuest>();
    const byArenaName = seasonQuests.find(q => q.type === 'clan' && normalizeQuestLabel(q.title) === normalizeQuestLabel(arena.name));
    if (byArenaName) map.set(byArenaName.id, byArenaName);
    arenaActions.forEach(action => {
        const quest = getClanQuestForActionName(action.name);
        if (quest) map.set(quest.id, quest);
    });
    return Array.from(map.values());
  };

  const getClanQuestForAction = (action: Action | undefined) => {
    if (!action) return null;
    return getClanQuestForActionName(action.name);
  };

  const updateCustomClanMissionProgress = async (missionId: string, increment: number) => {
      const { data, error } = await supabase.rpc('update_clan_mission_progress', {
          p_mission_id: missionId,
          p_increment: increment
      });
      if (error) {
          console.error("Error updating clan mission progress:", error);
      } else {
          console.log("Clan mission progress updated:", data);
      }
  };

  const scheduleAndCompleteNow = (actionId: string) => {
    const action = getActionById(actionId);
    if (!action || action.actionType === 'Marco') return;

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();
    // O horário de início retrocede para que o fim da ação seja exatamente AGORA
    const startTime = Math.max(0, nowInMinutes - action.duration);

    const newTask: ScheduledTask = {
        id: crypto.randomUUID(),
        actionId: actionId,
        date: date,
        startTime: startTime,
        duration: action.duration,
        completed: true,
    };

    setTasks(prevTasks => [...prevTasks, newTask]);

    // Handle Clan Quest Progress
    // Check if this action corresponds to a clan quest, regardless of arena
    const clanQuest = getClanQuestForAction(action);
    
    if (clanQuest) {
        updateClanMissionProgress(clanQuest.id, 1);
    }

    // Handle Custom Clan Mission Progress
    if (action.originCodexId?.startsWith('clan_quest:')) {
        const questId = action.originCodexId.split(':')[1];
        updateCustomClanMissionProgress(questId, 1);
    }
    
    // If it's today, add to daily commitment so it shows in SITREP
    if (date === dailyCommitment.date && !isClanQuestActionId(actionId)) {
        setDailyCommitmentState(prev => ({
            ...prev,
            taskIds: [...prev.taskIds, newTask.id]
        }));
    }

    const userId = getSupabaseUserId();
    if (userId) {
        const snakeCaseData = { ...mapToSnakeCase(newTask), user_id: userId };
        supabase.from('scheduled_tasks').insert(snakeCaseData).then(({error}) => {
            if (error) console.error("Supabase schedule task now error:", error.message);
        });
    }
  };
  const scheduleAndCompleteMilestoneNow = (actionId: string) => {
    const action = getActionById(actionId);
    if (!action || action.actionType !== 'Marco') return;

    const alreadyExists = tasks.some(t => t.actionId === actionId);
    if (alreadyExists) {
        const existingTask = tasks.find(t => t.actionId === actionId);
        if (existingTask && !existingTask.completed) {
            toggleTaskCompletion(existingTask.id);
        }
        return;
    }

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const nowInMinutes = now.getHours() * 60 + now.getMinutes();
    // O horário de início retrocede para que o fim da ação seja exatamente AGORA
    const startTime = Math.max(0, nowInMinutes - action.duration);

    const newTask: ScheduledTask = {
        id: crypto.randomUUID(),
        actionId: actionId,
        date: date,
        startTime: startTime,
        duration: action.duration,
        completed: true,
    };

    setTasks(prevTasks => [...prevTasks, newTask]);

    // Handle Clan Quest Progress for Milestones
    // Check if this action corresponds to a clan quest, regardless of arena
    const activeSeasonConfig = SEASONS[ACTIVE_SEASON_ID];
    const clanQuest = activeSeasonConfig?.quests.find(q => 
        (q.type === 'clan' && q.actionTemplate.name === action.name) ||
        (q.id === 'quest-clan-unity' && (action.name.includes('Socializar') || action.name.includes('socializar')))
    );
    
    if (clanQuest) {
        updateClanMissionProgress(clanQuest.id, 1);
    }
    
    // Handle Custom Clan Mission Progress
    if (action.originCodexId?.startsWith('clan_quest:')) {
        const questId = action.originCodexId.split(':')[1];
        updateCustomClanMissionProgress(questId, 1);
    }

    // If it's today, add to daily commitment
    if (date === dailyCommitment.date) {
        setDailyCommitmentState(prev => ({
            ...prev,
            taskIds: [...prev.taskIds, newTask.id]
        }));
    }

    setAchievementUnlocked({ type: 'MILESTONE_COMPLETED', data: action });
    addFeedEvent({
        type: 'MILESTONE_COMPLETED',
        content: { title: action.name, icon: action.icon }
    });

    const userId = getSupabaseUserId();
    if (userId) {
        const snakeCaseData = { ...mapToSnakeCase(newTask), user_id: userId };
        supabase.from('scheduled_tasks').insert(snakeCaseData).then(({error}) => {
            if (error) console.error("Supabase schedule milestone now error:", error.message);
        });
    }
  };
  const completeTutorialMission = () => {
    const tutorialTask = tasks.find(t => t.actionId === TUTORIAL_ACTION_ID);
    if (tutorialTask && !tutorialTask.completed) {
      toggleTaskCompletion(tutorialTask.id);
    } else if (!tutorialTask) {
      scheduleAndCompleteMilestoneNow(TUTORIAL_ACTION_ID);
    }
    
    // Ensure the flag is added to user profile for persistence
    addProfileFlag(PROFILE_FLAG_TUTORIAL_COMPLETED);
  };
  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    const userId = getSupabaseUserId();
    if (userId) {
        supabase.from('scheduled_tasks').delete().eq('id', taskId).then(({ error }) => {
            if (error) console.error("Supabase delete task error:", error.message);
        });
    }
  };
  const returnTaskToPool = (taskId: string) => {
    deleteTask(taskId);
  };
  const updateTask = (taskId: string, updates: Partial<ScheduledTask>) => {
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
    const userId = getSupabaseUserId();
    if (userId) {
        // Map camelCase updates to snake_case for Supabase if needed
        const snakeCaseUpdates: any = {};
        if (updates.date !== undefined) snakeCaseUpdates.date = updates.date;
        if (updates.startTime !== undefined) snakeCaseUpdates.start_time = updates.startTime;
        if (updates.duration !== undefined) snakeCaseUpdates.duration = updates.duration;
        if (updates.completed !== undefined) snakeCaseUpdates.completed = updates.completed;

        if (Object.keys(snakeCaseUpdates).length > 0) {
            supabase.from('scheduled_tasks')
                .update(snakeCaseUpdates)
                .eq('id', taskId)
                .then(({ error }) => {
                    if (error) console.error("Supabase update task error:", error.message);
                });
        }
    }
  };

  const rescheduleTask = (taskId: string, newDate: string, newStartTime: number) => {
    updateTask(taskId, { date: newDate, startTime: newStartTime });
  };
  const toggleTaskCompletion = (taskId: string) => {
    // Check for future task completion (Anti-Exploit)
    const taskToCheck = tasks.find(t => t.id === taskId);
    if (taskToCheck && !taskToCheck.completed) {
        const now = new Date();
        const todayString = now.toISOString().split('T')[0];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        if (taskToCheck.date > todayString) {
             showToast("Você não pode completar uma tarefa do futuro!", "error");
             return;
        }
        
        if (taskToCheck.date === todayString && taskToCheck.startTime > currentMinutes) {
             showToast("Aguarde o horário da tarefa para completá-la.", "error");
             return;
        }
    }

    setTasks(prevTasks => {
        const newTasks = prevTasks.map(task => {
            if (task.id === taskId) {
                const updatedTask = { ...task, completed: !task.completed };

                // Update in daily commitment if it exists there
                if (dailyCommitment.taskIds.includes(taskId)) {
                    // This will trigger a re-render of SITREP since dailyCommitment is state
                    setDailyCommitmentState(prev => ({ ...prev }));
                }

                // If we are completing a milestone, trigger achievement
                if (updatedTask.completed) {
                    const action = getActionById(task.actionId);
                    if (action) {
                        const expValue = task.duration > 0 ? task.duration : (action.duration || 10);
                        showToast(`+${expValue} EXP: ${action.name}`, 'success');
                        if (action.actionType === 'Marco') {
                            setAchievementUnlocked({ type: 'MILESTONE_COMPLETED', data: action });
                            addFeedEvent({
                                type: 'MILESTONE_COMPLETED',
                                content: { title: action.name, icon: action.icon }
                            });
                        }

                        // Check for PVP Arena Completion
                        const arena = getArenas().find(a => a.id === action.arenaId);
                        if (arena && arena.name === "Quem corre 15km antes") {
                            const allArenaActions = getActionsForArena(arena.id);
                            const completedCount = prevTasks.filter(t => 
                                allArenaActions.some(a => a.id === t.actionId) && t.completed && t.id !== taskId
                            ).length + 1;

                            if (completedCount >= 15) {
                                showToast("PARABÉNS! DESAFIO DE 15KM COMPLETADO!", 'success');
                                // Future: Send notification to opponent
                            }
                        }
                    }
                }

                const actionForClanQuest = getActionById(task.actionId);
                const clanQuest = getClanQuestForAction(actionForClanQuest);
                if (clanQuest) {
                    updateClanMissionProgress(clanQuest.id, updatedTask.completed ? 1 : -1);
                }

                // Handle Custom Clan Mission Progress
                if (actionForClanQuest?.originCodexId?.startsWith('clan_quest:')) {
                    const questId = actionForClanQuest.originCodexId.split(':')[1];
                    updateCustomClanMissionProgress(questId, updatedTask.completed ? 1 : -1);
                }

                // Update in Supabase
                const userId = getSupabaseUserId();
                if (userId) {
                    supabase.from('scheduled_tasks')
                        .update({ completed: updatedTask.completed })
                        .eq('id', taskId)
                        .then(({ error }) => {
                            if (error) console.error("Supabase toggle task completion error:", error.message);
                        });
                }

                return updatedTask;
            }
            return task;
        });
        return newTasks;
    });
  };
  const getTasksForDate = (date: Date) => { const dateString = date.toISOString().split('T')[0]; return tasks.filter(t => t.date === dateString); };

  // --- Clan Functions ---
  const createClan = async (clanDetails: Omit<Clan, 'id' | 'exp' | 'rankId'>) => {
    const userId = getSupabaseUserId();
    if (!userId) { console.error("User not authenticated"); return; }
    
    const snakeCaseDetails = { ...mapToSnakeCase(clanDetails), exp: 0, rank_id: 'feudo' };
    delete (snakeCaseDetails as Record<string, unknown>).background_url;

    const { data: clanData, error: clanError } = await supabase
        .from('clans')
        .insert(snakeCaseDetails)
        .select()
        .single();
        
    if (clanError || !clanData) { console.error('Error creating clan:', clanError?.message); return; }

    const { error: memberError } = await supabase
        .from('clan_members')
        .insert({ user_id: userId, clan_id: clanData.id, role: 'leader' });
        
    if (memberError) { console.error('Error adding leader to clan:', memberError?.message); return; }

    await loadClanAndMembers(clanData.id);
  };

  const updateClan = async (clanId: string, data: Partial<Pick<Clan, 'name' | 'icon' | 'description' | 'backgroundUrl'>>) => {
      const snakeCaseData = mapToSnakeCase(data) as Record<string, unknown>;
      delete snakeCaseData.background_url;
      const { error } = await supabase.from('clans').update(snakeCaseData).eq('id', clanId);
      if (error) { console.error("Error updating clan:", error.message); return; }
      setClan(prev => (prev && prev.id === clanId) ? { ...prev, ...data } : prev);
  };
  
  const leaveClan = async () => {
      const userId = getSupabaseUserId();
      if (!userId) { console.error("User not authenticated"); return; }
      const { error } = await supabase.from('clan_members').delete().eq('user_id', userId);
      if (error) { console.error("Error leaving clan:", error.message); return; }
      
      // Invalidate cache for the clan we just left
      if (clan && clanCacheRef.current && clanCacheRef.current.clanId === clan.id) {
          clanCacheRef.current.timestamp = 0;
      }
      
      setClan(null);
      setEnrichedClanMembers([]);
      setClanJoinRequestsIncoming([]);
  };

  const transferLeadershipAndLeave = async (newLeaderId: string) => {
    if (!clan || !session) return;
    if (!isUuid(newLeaderId)) {
        console.error("Invalid new leader ID");
        return;
    }
    const { error: promoteError } = await supabase.from('clan_members').update({ role: 'leader' }).eq('clan_id', clan.id).eq('user_id', newLeaderId);
    if (promoteError) { console.error("Error transferring leadership:", promoteError.message); return; }
    await leaveClan();
  };

  const deleteClan = async () => {
    if (!clan) return;
    const { error } = await supabase.from('clans').delete().eq('id', clan.id);
    if (error) { console.error("Error deleting clan:", error.message); return; }
    await leaveClan(); // Also cleans up the member record
  };

  const kickClanMember = async (memberId: string) => {
      if(!clan) return;
      if (!isUuid(memberId)) {
          console.error("Invalid member ID for kicking");
          return;
      }
      const { error } = await supabase.from('clan_members').delete().eq('user_id', memberId).eq('clan_id', clan.id);
      if (error) { console.error("Error kicking member:", error.message); return; }
      setEnrichedClanMembers(prev => prev.filter(m => m.id !== memberId));
      
      // Update cache
      if (clanCacheRef.current && clanCacheRef.current.clanId === clan.id) {
         clanCacheRef.current.members = clanCacheRef.current.members.filter(m => m.id !== memberId);
      }
  };

  const addClanMember = async (memberId: string) => {
      if (!clan) return;
      if (!isUuid(memberId)) {
          console.error("Invalid member ID for clan addition");
          return;
      }

      const { count, error: countError } = await supabase
          .from('clan_members')
          .select('*', { count: 'exact', head: true })
          .eq('clan_id', clan.id);

      if (countError) { console.error("Error checking clan size:", countError.message); return; }

      if (count !== null && count >= MAX_CLAN_MEMBERS) {
          alert(`O clã atingiu o limite máximo de ${MAX_CLAN_MEMBERS} membros.`);
          return;
      }

      const { error } = await supabase.from('clan_members').insert({ user_id: memberId, clan_id: clan.id, role: 'member'});
      if (error) { console.error("Error adding member:", error.message); return; }
      
      const friendProfile = friends.find(f => f.id === memberId);
      if (friendProfile) {
          const newMember: EnrichedClanMember = { ...friendProfile, role: 'member', joinedAt: new Date().toISOString() };
          setEnrichedClanMembers(prev => [...prev, newMember]);
          // Update cache to prevent stale data on reload
          if (clanCacheRef.current && clanCacheRef.current.clanId === clan.id) {
             clanCacheRef.current.members = [...clanCacheRef.current.members, newMember];
          }
      } else {
          // If friend profile not found immediately, force reload
          if (clanCacheRef.current) clanCacheRef.current.timestamp = 0; // Invalidate cache
          await loadClanAndMembers(clan.id);
      }
  };

  const searchClans = async (query: string): Promise<Clan[]> => {
      if (!query.trim()) return [];
      const { data, error } = await supabase.from('clans').select('*').ilike('name', `%${query}%`).limit(10);
      if (error) { console.error('Error searching clans:', error.message); return []; }
      return mapToCamelCase(data || []) as Clan[];
  };

  const requestClanJoin = async (clanToJoin: Clan) => {
    if (clan) return;
    const userId = getSupabaseUserId();
    if (!userId) { console.error("User ID not found"); return; }
    if (clanJoinRequestsOutgoing.some(r => r.clanId === clanToJoin.id && r.status === 'pending')) return;

    const payload = {
        clan_id: clanToJoin.id,
        user_id: userId,
        status: 'pending',
        created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('clan_join_requests').insert(payload).select().single();
    if (error) { console.error("Error requesting clan join:", error.message); return; }
    if (data) {
        const mapped = mapToCamelCase(data) as ClanJoinRequest;
        setClanJoinRequestsOutgoing(prev => [...prev, mapped]);
    }
  };

  const joinClan = async (clanToJoin: Clan) => {
    if (clan) return; 
    const userId = getSupabaseUserId();
    if (!userId) { console.error("User ID not found"); return; }

    const recruitmentStatus = (clanToJoin as any).recruitment_status ?? (clanToJoin as any).recruitmentStatus;
    if (recruitmentStatus === 'Privado') {
        await requestClanJoin(clanToJoin);
        return;
    }

    const { count, error: countError } = await supabase
        .from('clan_members')
        .select('*', { count: 'exact', head: true })
        .eq('clan_id', clanToJoin.id);

    if (countError) { console.error("Error checking clan size:", countError.message); return; }

    if (count !== null && count >= MAX_CLAN_MEMBERS) {
        alert(`Este clã atingiu o limite máximo de ${MAX_CLAN_MEMBERS} membros.`);
        return;
    }

    const { error } = await supabase.from('clan_members').insert({ user_id: userId, clan_id: clanToJoin.id, role: 'member'});
    if (error) { console.error("Error joining clan:", error.message); return; }
    await loadClanAndMembers(clanToJoin.id);
  };

  const approveClanJoinRequest = async (request: ClanJoinRequest) => {
    if (!clan || request.clanId !== clan.id) return;

    const { count, error: countError } = await supabase
        .from('clan_members')
        .select('*', { count: 'exact', head: true })
        .eq('clan_id', clan.id);

    if (countError) { console.error("Error checking clan size:", countError.message); return; }
    if (count !== null && count >= MAX_CLAN_MEMBERS) {
        alert(`O clã atingiu o limite máximo de ${MAX_CLAN_MEMBERS} membros.`);
        return;
    }

    const { error: updateError } = await supabase
        .from('clan_join_requests')
        .update({ status: 'approved', responded_at: new Date().toISOString() })
        .eq('id', request.id);
    if (updateError) { console.error("Error approving clan join request:", updateError.message); return; }

    const { error: insertError } = await supabase.from('clan_members').insert({ user_id: request.userId, clan_id: clan.id, role: 'member'});
    if (insertError) { console.error("Error adding member from request:", insertError.message); return; }

    // Invalidate cache before reloading to ensure new member is fetched
    if (clanCacheRef.current) clanCacheRef.current.timestamp = 0;
    
    await loadClanAndMembers(clan.id);
    await loadClanJoinRequestsIncoming(clan.id);
  };

  const rejectClanJoinRequest = async (request: ClanJoinRequest) => {
    if (!clan || request.clanId !== clan.id) return;
    const { error } = await supabase
        .from('clan_join_requests')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', request.id);
    if (error) { console.error("Error rejecting clan join request:", error.message); return; }

    setClanJoinRequestsIncoming(prev => prev.filter(r => r.id !== request.id));
  };
  
  const fetchDMs = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender_profile:user_profiles!direct_messages_sender_id_fkey(*)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching DMs:', error);
      return;
    }

    const mapped = mapToCamelCase(data || []) as DirectMessage[];
    setDirectMessages(mapped);

    // Group into conversations
    const convsMap = new Map<string, DMConversation>();
    mapped.forEach(msg => {
      const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      if (!convsMap.has(otherId)) {
        // Find profile for this conversation
        let profile = msg.senderId === otherId ? msg.senderProfile : undefined;
        // If profile not in message (sent by us), we might need to fetch it or find it in friends
        if (!profile) {
           const friend = friends.find(f => f.id === otherId);
           if (friend) profile = friend;
        }

        if (profile) {
          convsMap.set(otherId, {
            participantId: otherId,
            profile,
            lastMessage: msg,
            unreadCount: msg.recipientId === userId && !msg.read ? 1 : 0
          });
        }
      } else if (msg.recipientId === userId && !msg.read) {
        const conv = convsMap.get(otherId)!;
        conv.unreadCount += 1;
      }
    });
    setDMConversations(Array.from(convsMap.values()));
  }, [session?.user.id, friends]);

  const sendDirectMessage = async (recipientId: string, content: string) => {
    const userId = session?.user.id;
    if (!userId) return;

    const newMessage = {
      sender_id: userId,
      recipient_id: recipientId,
      content,
      read: false,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('direct_messages')
      .insert(newMessage)
      .select(`
        *,
        sender_profile:user_profiles!direct_messages_sender_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('Error sending DM:', error);
      showToast('Erro ao enviar mensagem');
      return;
    }

    const mapped = mapToCamelCase(data) as DirectMessage;
    setDirectMessages(prev => [mapped, ...prev]);
    
    // Update conversation list locally
    setDMConversations(prev => {
      const index = prev.findIndex(c => c.participantId === recipientId);
      if (index === -1) {
        // New conversation, need to fetch profile if not in friends
        const friend = friends.find(f => f.id === recipientId);
        if (friend) {
          return [{
            participantId: recipientId,
            profile: friend,
            lastMessage: mapped,
            unreadCount: 0
          }, ...prev];
        }
        return prev;
      }
      const updated = [...prev];
      const [conv] = updated.splice(index, 1);
      updated.unshift({
        ...conv,
        lastMessage: mapped
      });
      return updated;
    });
  };

  const markDMAsRead = async (senderId: string) => {
    const userId = session?.user.id;
    if (!userId) return;

    const { error } = await supabase
      .from('direct_messages')
      .update({ read: true })
      .eq('sender_id', senderId)
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking DMs as read:', error);
      return;
    }

    setDirectMessages(prev => prev.map(msg => 
      msg.senderId === senderId && msg.recipientId === userId ? { ...msg, read: true } : msg
    ));

    setDMConversations(prev => prev.map(c => 
      c.participantId === senderId ? { ...c, unreadCount: 0 } : c
    ));
  };

  useEffect(() => {
    if (session?.user.id) {
      fetchDMs();
      
      // Subscribe to new DMs
      const subscription = supabase
        .channel('direct_messages_realtime')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages',
          filter: `recipient_id=eq.${session.user.id}`
        }, (payload) => {
          fetchDMs(); // Refetch all for simplicity and consistency
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session?.user.id, fetchDMs]);

  // --- Season Functions ---
  const addSeason = async (seasonData: Omit<Season, 'id'>) => {
    const { data, error } = await supabase.from('seasons').insert(mapToSnakeCase(seasonData)).select().single();
    if (error) { console.error("Error adding season:", error.message); return; }
    if (data) {
        const newSeason = data as Season;
        if (newSeason.is_active) {
            setSeasons(prev => [...prev.map(s => ({...s, is_active: false})), newSeason]);
        } else {
            setSeasons(prev => [...prev, newSeason]);
        }
    }
  };

  const updateSeason = async (seasonId: string, seasonData: Partial<Omit<Season, 'id'>>) => {
      const { data, error } = await supabase.from('seasons').update(mapToSnakeCase(seasonData)).eq('id', seasonId).select().single();
      if (error) { console.error("Error updating season:", error.message); return; }
      if (data) {
          const updatedSeason = data as Season;
          setSeasons(prev => {
              let newSeasons = [...prev];
              if (updatedSeason.is_active) {
                  newSeasons = newSeasons.map(s => s.id === updatedSeason.id ? s : { ...s, is_active: false });
              }
              const index = newSeasons.findIndex(s => s.id === seasonId);
              if (index > -1) newSeasons[index] = updatedSeason;
              return newSeasons;
          });
      }
  };

  const addSeasonMission = async (missionData: Omit<SeasonMission, 'id'>) => {
      const userId = getSupabaseUserId();
      if (!userId) { console.error("User not authenticated for adding season mission"); return; }
      if (!isUuid(userId)) {
          console.error("Invalid userId for adding season mission");
          return;
      }
      
      const { data, error } = await supabase.from('season_missions').insert(mapToSnakeCase(missionData)).select().single();
      if (error) { console.error("Error adding season mission:", error.message); return; }
      if (data) {
          setSeasonMissions(prev => [...prev, mapToCamelCase(data) as SeasonMission]);
      }
  };

  // --- Ensure PVP Arena Logic ---
  useEffect(() => {
    const ensurePvpArena = async () => {
        if (!isProfileLoaded || !hasHydratedFromSupabase) return;
        const arenaName = "Quem corre 15km antes";
        const allArenas = assets.flatMap(a => a.arenas);
        const existingArena = allArenas.find(a => a.name === arenaName);
        
        if (!existingArena) {
            console.log("Creating PVP Arena: ", arenaName);
            try {
                // 'fisico' is the asset ID for physical activities
                const newArena = await addArena('fisico', {
                    name: arenaName,
                    description: "Desafio PVP de corrida. Quem completar 15km primeiro vence.",
                    icon: "🏃",
                    priority: 'alta'
                });

                if (newArena) {
                    const actionsToCreate = Array.from({ length: 15 }, (_, i) => ({
                        name: "Correr 1km",
                        description: `Km ${i + 1} de 15`,
                        arenaId: newArena.id,
                        icon: "🏃",
                        duration: 10,
                        repetitions: 1,
                        actionType: 'Ação Recorrente' as any,
                        difficulty: 3
                    }));

                    for (const actionData of actionsToCreate) {
                         await addAction(actionData);
                    }
                    console.log("PVP Arena created with 15 actions.");
                }
            } catch (e) {
                console.error("Error creating PVP arena:", e);
            }
        }
    };
    ensurePvpArena();
  }, [isProfileLoaded, hasHydratedFromSupabase, assets.length]); // Check assets length to ensure they are loaded

  return (
    <GameContext.Provider value={{ isNewUser, assets, actions, arenaFolders, tasks, taskPool, checklistItems, userProfile, friends, friendRequestsIncoming, friendRequestsOutgoing, clanJoinRequestsIncoming, clanJoinRequestsOutgoing, reports, nobilityRanks, clan, clanRanks, enrichedClanMembers, activeCycle, dailyCommitment, achievementUnlocked, seasons, seasonMissions, seasonQuests, clanQuestProgress, clanQuestParticipants, getClanQuestProgress, getClanQuestForActionName, getClanQuestsForArena, fetchClanQuestParticipants, levelUnlocks, setAchievementUnlocked, updateLevelUnlocks, grantUserUnlock, addCompletedMission, acceptSeasonQuest,
        abortSeasonQuest,
        claimSeasonQuest,
        claimSeasonMission,
        addProfileFlag, feed, addFeedEvent, updateAssetSlotValue, getArenas, addArena, updateArena, getActionsForArena, addAction, scheduleTask, getTasksForDate, rescheduleTask, updateTask, toggleTaskCompletion, updateAction, deleteAction, scheduleAndCompleteNow, returnTaskToPool, deleteTask, completeTutorialMission, deleteArena, toggleChecklistItem, addChecklistItem, updateChecklistItem, deleteChecklistItem, updateUserProfile, addFriend, searchPlayers, sendFriendRequest, acceptFriendRequest, declineFriendRequest, cancelFriendRequest, setCurrentSkin, updateAllAssetLevels, startCycle, endCycle, startNewCycle, updateMood, scheduleMultipleTasks, getAssetForAction, getActionBackgroundStyle, scheduleAndCompleteMilestoneNow, setDailyCommitment, lockDailyCommitment, endDailyBattle, resetDailyCommitment, manualCloseSITREP, openChest, applyExp, addChest, createClan, updateClan, leaveClan, transferLeadershipAndLeave, deleteClan, kickClanMember, addClanMember, searchClans, joinClan, approveClanJoinRequest, rejectClanJoinRequest, 
      directMessages, dmConversations, sendDirectMessage, markDMAsRead, fetchDMs,
      addSeason, updateSeason, addSeasonMission, saveSanctuaryPosition, getSanctuaryPositionsForClan, getSanctuaryAreaStats, updateSanctuaryAreaTime, applySanctuaryAreaDecay, loadClanAndMembers, userMissionParticipations, joinClanMission, updateClanMissionProgress, leaveClanMission, updateCustomClanMissionProgress, appMode, isProfileLoaded, setAppMode, activeTheme, toggleTheme, createArenaFolder, updateArenaFolder, deleteArenaFolder, moveArenaToFolder, reorderArena, reorderArenaPriority, arenasViewMode, setArenasViewMode, reorderAction, getUserPublicData, oraclePreferences, updateOraclePreferences, oracleMessages, markOracleMessageAsRead, triggerOracle, inventory, buyGoldPack, buyStoreItem, recycleItem, craftItem, equipItem, toggleEquipItem, showToast, toast, hideToast, notifications, markNotificationRead, deleteNotification, fetchNotifications, getAldeiaSlots, updateAldeiaSlot, getAldeiaPresence, enterAldeiaSlot, performAldeiaDailyUpdate, campaigns, addCampaign, updateCampaign, deleteCampaign, installPrompt, promptInstall, codexCatalog, userCodexes, buyCodex, installCodex, deleteUserCodex, transferUserCodex }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  const builder = useCodexBuilder();
  if (context === undefined) throw new Error('useGame must be used within a GameProvider');
  if (!builder.isBuilderMode) return context;
  return { ...context, ...builder.gameOverrides };
};
