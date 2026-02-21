
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import { Asset, Slot, SlotValue, Arena, ArenaFolder, Action, ScheduledTask, ChecklistItem, UserProfile, Report, NobilityRank, Clan, ClanJoinRequest, ClanRank, DayOfWeek, Cycle, DailyCommitment, ChestType, FeedEvent, FeedEventType, EnrichedClanMember, ClanMember, Season, SeasonMission, SeasonQuest, FriendRequest, LevelUnlocks, UnlockCategory, UserUnlocks, InventoryItem, UserWallet } from '../types';
import { ASSETS_DATA, MASTERY_LEVEL_DESCRIPTIONS, MAX_CLAN_MEMBERS, GM_CONFIG, SEASONS, ACTIVE_SEASON_ID, buildDefaultLevelUnlocks, DEFAULT_SOVEREIGN_CONFIG } from '../constants';
import { ITEMS_DB, GOLD_PACKS, CODEXES, XP_BOOSTS, ItemCategory, ItemDef, resolveItemDef } from '../constants/items';
import { supabase } from '../supabaseClient';
import type { OracleMode } from '../constants/oracle';
import { SupabaseService } from '../services/SupabaseService';
import { rateLimiter } from '../services/SimpleRateLimiter';
import type { Session } from '@supabase/supabase-js';
import { useCodexBuilder } from './CodexBuilderContext';

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

const STORAGE_KEY_PROFILE = 'gol_user_profile_v2';
const STORAGE_KEY_ASSET_LEVELS = 'gol_asset_levels_v2';

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

const NOBILITY_RANKS: NobilityRank[] = [
    { id: 'vagante', name: 'Vagante', levelRequired: 0, expTotalRequired: 0 },
    { id: 'escudeiro', name: 'Escudeiro', levelRequired: 10, expTotalRequired: 10000 },
    { id: 'cavaleiro', name: 'Cavaleiro', levelRequired: 20, expTotalRequired: 35000 },
    { id: 'lorde', name: 'Lorde', levelRequired: 30, expTotalRequired: 85000 },
    { id: 'barao', name: 'Barão', levelRequired: 40, expTotalRequired: 185000 },
    { id: 'conde', name: 'Conde', levelRequired: 50, expTotalRequired: 350000 },
    { id: 'duque', name: 'Duque', levelRequired: 60, expTotalRequired: 512500 },
    { id: 'principe', name: 'Príncipe', levelRequired: 70, expTotalRequired: 675000 },
    { id: 'rei', name: 'Rei', levelRequired: 80, expTotalRequired: 837500 },
    { id: 'soberano', name: 'Soberano', levelRequired: 90, expTotalRequired: 1000000 },
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
  levelUnlocks: LevelUnlocks;
  setAchievementUnlocked: (achievement: { type: FeedEventType; data: any; } | null) => void;
  updateLevelUnlocks: (next: LevelUnlocks) => void;
  grantUserUnlock: (category: UnlockCategory, itemId: string) => void;
  addCompletedMission: (mission: SeasonMission) => void;
  acceptSeasonQuest: (questId: string) => void;
  claimSeasonQuestReward: (questId: string) => void;
  addProfileFlag: (flag: string) => void;
  feed: FeedEvent[];
  addFeedEvent: (eventData: Pick<FeedEvent, 'type' | 'content'>) => void;
  updateAssetSlotValue: (assetId: string, slotId: string, value: SlotValue) => void;
  getArenas: () => Arena[];
  addArena: (assetId: string, arenaData: Pick<Arena, 'name' | 'description' | 'icon'>, skipDb?: boolean) => Arena;
  updateArena: (arenaId: string, arenaData: Partial<Pick<Arena, 'name' | 'description' | 'icon' | 'folderId' | 'isArchived'>>) => void;
  deleteArena: (arenaId: string) => void;
  createArenaFolder: (name: string, icon: string, assetId?: string) => Promise<ArenaFolder | null>;
  updateArenaFolder: (folderId: string, data: Partial<ArenaFolder>) => Promise<void>;
  deleteArenaFolder: (folderId: string) => Promise<void>;
  moveArenaToFolder: (arenaId: string, folderId: string | null) => Promise<void>;
  reorderArena: (arenaId: string, newIndex: number) => void;
  getActionsForArena: (arenaId: string) => Action[];
  getAssetForAction: (actionId: string) => Asset | undefined;
  getActionBackgroundStyle: (actionId: string) => React.CSSProperties;
  addAction: (actionData: Omit<Action, 'id'>) => Action;
  updateAction: (actionId: string, actionData: Partial<Action>) => void;
  deleteAction: (actionId: string) => void;
  scheduleTask: (actionId: string, date: string, startTime: number) => ScheduledTask | undefined;
  scheduleMultipleTasks: (actionId: string, daysOfWeek: DayOfWeek[], startTimeInMinutes: number) => void;
  scheduleAndCompleteNow: (actionId: string) => void;
  scheduleAndCompleteMilestoneNow: (actionId: string) => void;
  returnTaskToPool: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  getTasksForDate: (date: Date) => ScheduledTask[];
  rescheduleTask: (taskId: string, newDate: string, newStartTime: number) => void;
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
  oracleMode: OracleMode;
  setOracleMode: (mode: OracleMode) => void;
  // Forge & Store
  inventory: InventoryItem[];
  buyGoldPack: (packId: string) => Promise<void>;
  buyStoreItem: (itemId: string, type: 'premium' | 'codex' | 'exclusive' | 'boost') => Promise<void>;
  recycleItem: (instanceId: string) => Promise<void>;
  craftItem: (tier: number, category?: string, exactItemId?: string) => Promise<InventoryItem | null>;
  equipItem: (item: InventoryItem) => Promise<void>;
  toggleEquipItem: (item: InventoryItem) => Promise<void>;
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

  const isNewUser = useMemo(() => {
      return !userProfile.completedSeasonMissions?.includes(PROFILE_FLAG_TUTORIAL_COMPLETED);
  }, [userProfile.completedSeasonMissions]);

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

  const [oracleMode, setOracleMode] = useState<OracleMode>('STANDARD');

  // --- FORGE SYSTEM ---
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const fetchInventory = useCallback(async (userId: string) => {
      const { data, error } = await supabase.from('user_inventory').select('*').eq('user_id', userId);
      if (error) {
          console.error("Error fetching inventory:", error);
          return;
      }
      const items = data.map((row: any) => {
          const resolvedDef = resolveItemDef(row.item_id);
          const resolvedId = resolvedDef?.id || row.item_id;
          return {
              id: resolvedId,
              instanceId: row.id,
              acquiredAt: row.acquired_at,
              isEquipped: row.is_equipped
          };
      });
      setInventory(items);
  }, []);

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
          alert("Erro ao processar compra.");
          return;
      }
      
      if (data && data.success) {
          updateUserProfile({ wallet: { ...userProfile.wallet, gold: data.new_gold } });
          alert(`Compra de ${pack.name} realizada! +${pack.total} Ouro.`);
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
          alert("Ouro insuficiente!");
          return;
      }

      const { data, error } = await supabase.rpc('buy_store_item', {
          p_item_id: itemId,
          p_cost_gold: cost,
          p_type: type
      });

      if (error) {
          console.error("Error buying store item:", error);
          alert("Erro ao comprar item.");
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
      
      alert(`Compra de ${name} realizada com sucesso!`);
  };

  const recycleItem = async (instanceId: string) => {
      const userId = getSupabaseUserId();
      if (!userId) return;
      
      const { data, error } = await supabase.rpc('recycle_item', {
          p_item_instance_id: instanceId
      });

      if (error) {
          console.error("Error recycling:", error);
          alert("Erro ao reciclar item.");
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
          alert("Erro ao forjar item: " + error.message);
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
              alert('Skin de Interface removida. Tema padrão restaurado.');
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
              alert(`Skin de Interface "${itemDef.name}" aplicada!`);
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
    }
  }, [session?.user.id]);

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
    const activeSeason = SEASONS[ACTIVE_SEASON_ID];
    if (!activeSeason) return [];
    
    return activeSeason.quests.map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      type: q.type,
      category: q.category,
      actionTemplate: q.actionTemplate,
      requirements: q.requirements,
      rewards: q.rewards
    })) as SeasonQuest[];
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

        const { data: profilesData, error: profilesError } = await supabase.from('user_profiles').select('*').in('id', uniqueIds);
        if (profilesError || !profilesData) {
            console.error('Error fetching profiles:', profilesError?.message);
            return {} as Record<string, UserProfile>;
        }

        const mapped = mapToCamelCase(profilesData) as any[];
        return mapped.reduce((acc, profileData) => {
            // Ensure wallet and inventory exist in profile
            const profile = {
                ...profileData,
                wallet: { gold: profileData.gold || 0, fragments: profileData.fragments || 0 },
                inventory: [] // We don't fetch inventory for others usually, saves bandwidth
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
                await migrateGuestDataToSupabase(userId);
            }
        }

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
            cyclesResult
        ] = await rateLimiter.batchRequests([
            () => supabase.from('arena_folders').select('*').eq('user_id', userId),
            () => supabase.from('arenas').select('*').eq('user_id', userId),
            () => supabase.from('actions').select('*').eq('user_id', userId),
            () => supabase.from('scheduled_tasks').select('*').eq('user_id', userId).gte('date', minDate),
            () => supabase.from('asset_slots').select('*').eq('user_id', userId),
            () => supabase.from('asset_levels').select('*').eq('user_id', userId),
            () => supabase.from('clan_members').select('clan_id').eq('user_id', userId).maybeSingle(),
            () => supabase.from('reports').select('*').eq('user_id', userId).order('end_date', { ascending: false }).limit(100),
            () => supabase.from('cycles').select('*').eq('user_id', userId).is('end_date', null).limit(1)
        ]) as any[];

        const { data: foldersData, error: foldersError } = foldersResult;
        if (!foldersError && foldersData) {
            setArenaFolders(mapToCamelCase(foldersData) as ArenaFolder[]);
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
            const nextReports = mapToCamelCase(reportsData) as Report[];
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
                const ok = await migrateGuestDataToSupabase(userId);
                if (ok) {
                    pendingGuestMigrationRef.current = null;
                    hydrated = true;
                }
                return;
            }
            await loadDataFromSupabase();
            hydrated = true;
        } finally {
            if (hydrated) setHasHydratedFromSupabase(true);
            suspendPersistenceRef.current = false;
        if (hydrated && pendingProfilePatchRef.current) {
            const patch = pendingProfilePatchRef.current;
            pendingProfilePatchRef.current = null;
            updateUserProfile(patch);
        }
        }
    };

    run();
  }, [session, userProfile.id, loadClanAndMembers, loadFriendsAndRequests, loadClanJoinRequestsOutgoing, migrateGuestDataToSupabase, getSupabaseUserId]);

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

    const { data, error } = await supabase.rpc('open_chest', {
        p_chest_type: chestType
    });

    if (error) {
        console.error("Error opening chest:", error);
        alert(error.message);
        return false;
    }

    if (data && data.success) {
        // Show reward (item + fragments)
        const rewardMsg = `You got ${data.item_name} (Tier ${data.tier}) + ${data.fragments_gained} Fragments!`;
        alert(rewardMsg);

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

        return true;
    }
    return false;
  };
  


  const isQuestActionId = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return false;
    const arena = assets.flatMap(asset => asset.arenas).find(ar => ar.id === action.arenaId);
    if (!arena?.name) return false;
    const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return normalized.includes('quests');
  };

  const resetDailyCommitment = () => {
    setDailyCommitmentState({ date: getTodayString(), taskIds: [], stage: 'planning', score: null, expDeposited: null, sitrepBonus: null });
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
    const committedTasks = tasks.filter(t => dailyCommitment.taskIds.includes(t.id) && t.date === dailyCommitment.date && !isQuestActionId(t.actionId));
    const committedCounts = committedTasks.reduce((acc, task) => {
        acc[task.actionId] = (acc[task.actionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const completedCounts = tasks.reduce((acc, task) => {
        if (task.date !== dailyCommitment.date) return acc;
        if (!committedCounts[task.actionId]) return acc;
        if (isQuestActionId(task.actionId)) return acc;
        if (task.completed) acc[task.actionId] = (acc[task.actionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const completedCount = Object.keys(committedCounts).reduce((sum, actionId) => {
        const committed = committedCounts[actionId] || 0;
        const completed = completedCounts[actionId] || 0;
        return sum + Math.min(committed, completed);
    }, 0);
    const totalCount = committedTasks.length;
    const score = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
    const expDepositBase = Object.keys(committedCounts).reduce((sum, actionId) => {
        const committed = committedCounts[actionId] || 0;
        const completed = completedCounts[actionId] || 0;
        const count = Math.min(committed, completed);
        if (count === 0) return sum;
        const action = actions.find(a => a.id === actionId);
        const duration = Number.isFinite(action?.duration) ? (action?.duration || 0) : 0;
        return sum + (duration * count);
    }, 0);
    const sitrepBonus = score >= 95 ? SITREP_BONUS_S : score >= 85 ? SITREP_BONUS_A : 0;
    const expDeposited = expDepositBase + sitrepBonus;
    
    const newStage = 'judgment';
    setDailyCommitmentState(prev => ({...prev, stage: newStage, score, expDeposited, sitrepBonus }));
    if (activeCycle && sitrepBonus > 0) {
        setCycleExpBonus(prev => prev + sitrepBonus);
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
        task_ids: dailyCommitment.taskIds
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
      // Ganho de 10% (2880s) por dia (86400s) -> ~0.0333s por segundo real
      const MAX_DAILY_GROWTH = MAX_POINTS * 0.10;
      const GROWTH_RATE_PER_SECOND = MAX_DAILY_GROWTH / 86400; 
      
      // Perda de 5% (1440s) por dia (86400s) -> ~0.0166s por segundo real
      const DECAY_RATE_PER_SECOND = (MAX_POINTS * 0.05) / 86400;

      // Intervalo mínimo de atualização (12 horas) para evitar writes excessivos
      // e manter as "barrinhas" estáveis como solicitado (2x ao dia)
      const MIN_UPDATE_INTERVAL = 43200;

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
    return () => window.clearInterval(intervalId);
  }, [clan?.id, fetchClanQuestProgress, enableClanQuestProgress]);

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
    const activeArenaIds = new Set(activeArenas.map(a => a.id));
    const activeActions = actions.filter(a => activeArenaIds.has(a.arenaId));

    // Create a count map of scheduled tasks to avoid nested loops.
    const scheduledCounts = tasks.reduce((acc, task) => {
        acc[task.actionId] = (acc[task.actionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const poolableActions = activeActions.filter(action => action.actionType !== 'Marco');

    const pool = poolableActions.flatMap(action => {
        if (isQuestActionId(action.id)) return [{ actionId: action.id, unlimited: true }];
        const scheduledCount = scheduledCounts[action.id] || 0;
        // Always allow at least one instance to be draggable (for unplanned/extra actions)
        const poolCount = Math.max(1, action.repetitions - scheduledCount);
        return Array.from({ length: poolCount }, () => ({ actionId: action.id }));
    });
    
    setTaskPool(pool);
  }, [actions, tasks, assets]); 

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
    const oldRankId = userProfile.nobility.rankId;
    const currentExp = userProfile.nobility.exp || 0;
    const newRank = nobilityRanks.slice().reverse().find(r => currentExp >= r.expTotalRequired);
    const newRankId = newRank ? newRank.id : oldRankId;

    if (oldRankId !== newRankId) {
        if (newRank) setAchievementUnlocked({ type: 'PLAYER_RANK_UP', data: newRank });
        updateUserProfile({ nobility: { ...userProfile.nobility, rankId: newRankId } });
    }
  }, [userProfile.nobility.exp, userProfile.nobility.rankId]);

  const missingProfileColumnsRef = useRef<{ completedSeasonMissions: boolean }>({ completedSeasonMissions: false });

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
            'isPremium'
        ];
        const entries = Object.entries(profileData).filter(([key, value]) => {
            if (!allowedKeys.includes(key as keyof UserProfile)) return false;
            if (value === undefined) return false;
            if (missingProfileColumnsRef.current.completedSeasonMissions && key === 'completedSeasonMissions') return false;
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
                const message = error.message || '';
                if (message.includes('completed_season_missions')) {
                    missingProfileColumnsRef.current.completedSeasonMissions = true;
                    const { completed_season_missions, ...rest } = snakeCaseData as Record<string, any>;
                    if (completed_season_missions !== undefined) {
                        supabase.from('user_profiles').update(rest).eq('id', supabaseUserId).then(({ error: retryError }) => {
                            if (retryError) console.error("Supabase profile update error:", retryError.message);
                        });
                        return;
                    }
                }
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
        alert("Você só pode atualizar seus níveis de maestria a cada 72 horas.");
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

  const startCycle = (name: string, endDate: string) => {
    const userId = getSupabaseUserId();
    if (!userId) return;
    const newCycle: Cycle = { 
        id: crypto.randomUUID(), 
        name, 
        startDate: new Date().toISOString().split('T')[0], 
        endDate: endDate,
        userId: userId,
        arenaIds: assets.flatMap(a => a.arenas.filter(ar => !ar.isArchived).map(ar => ar.id))
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
        arena_ids: newCycle.arenaIds
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

    // 1. Filter Tasks
    // Standard Tasks (Planned) - Exclude Quests
    const cycleTasks = tasks.filter(t => t.date >= startDate && t.date <= endDate && !isQuestActionId(t.actionId));
    const completedTasks = cycleTasks.filter(t => t.completed);
    
    // Quest Tasks
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

    const milestonesCompleted = getMilestones(completedTasks) + getMilestones(completedQuests);
    const milestoneBonus = milestonesCompleted * 10;

    // +5 per quest
    const questsCompletedCount = completedQuests.length;
    const questBonus = questsCompletedCount * 5;

    // +5 consistency (4+ unique days with completed actions)
    const uniqueDays = new Set([...completedTasks, ...completedQuests].map(t => t.date)).size;
    const consistencyBonus = uniqueDays >= 4 ? 5 : 0;

    // +5 total fidelity (zero abandoned actions)
    // Only if there were planned actions
    const totalFidelityBonus = (cycleTasks.length > 0 && completedTasks.length === cycleTasks.length) ? 5 : 0;

    // Final Performance Score
    let performanceScore = Math.round(fidelity + milestoneBonus + questBonus + consistencyBonus + totalFidelityBonus);

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
        seasonId: ACTIVE_SEASON_ID,
        metrics: { 
            actionsCompleted: completedTasks.length, 
            totalPlannedActions: cycleTasks.length, 
            arenasInvolved: involvedArenas.length, 
            goalsMet: milestonesCompleted, 
            totalHours: Math.round(completedTasks.reduce((sum, t) => sum + (t.duration / 60), 0)),
            questsCompleted: questsCompletedCount,
            consistencyDays: uniqueDays,
            expGained
        }, 
        highlight: { 
            mostFocusedArena, 
            mostFocusedArenaId,
            mostRepeatedAction,
            mostRepeatedActionCount: maxActionCompletions
        }, 
        clanPoints,
        assetProgress: currentAssets.map(asset => {
            // Se o asset não for 'geral', calcular o progresso se necessário
            return {
                asset: asset.name, // ReportsView usa .asset para RadarChart
                value: asset.level, // ReportsView usa .value para RadarChart
                assetId: asset.id,
                startLevel: asset.level,
                endLevel: asset.level,
                expGained: 0
            };
        }).filter(a => a.assetId !== 'geral')
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
        
        // 1. Insert Report
        supabase.from('reports').insert(snakeCaseReport).then(({error}) => {
            if (error) console.error("Supabase report insert error:", error.message);
        });

        // 2. Update/Delete Cycle (Mark as ended)
        if (cycle?.id) {
            supabase.from('cycles').update({ end_date: endDate }).eq('id', cycle.id).then(({ error }) => {
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
  
  const startNewCycle = (arenaChanges: ArenaSetupChange[], cycleDetails: { name: string; endDate: string; }) => {
    setCycleExpBonus(0);
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

    const baseQuery = normalized.replace(/\d+$/g, '').trim();
    const searchTerms = [normalized];
    if (baseQuery && baseQuery !== normalized) searchTerms.push(baseQuery);

    const responses = await Promise.all(
        searchTerms.flatMap(term => ([
            supabase.from('user_profiles').select('*').ilike('nickname', `%${term}%`).limit(20),
            supabase.from('user_profiles').select('*').ilike('email', `%${term}%`).limit(20),
        ]))
    );

    const errors = responses.map(r => r.error).filter(Boolean);
    if (errors.length > 0) {
        console.error('Error searching players:', errors[0]?.message);
        return [];
    }

    const merged = responses.flatMap(r => r.data || []);
    const mapped = mapToCamelCase(merged) as UserProfile[];
    const unique = Array.from(new Map(mapped.map(profile => [profile.id, profile])).values());
    return unique.filter(profile => profile.id !== userProfile.id).slice(0, 20);
  };

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
  const addArena = (assetId: string, arenaData: Omit<Arena, 'id' | 'assetId' | 'actionIds'>, skipDb: boolean = false): Arena => {
    const newArena: Arena = { ...arenaData, id: crypto.randomUUID(), assetId, actionIds: [], isArchived: false };
    setAssets(prevAssets => prevAssets.map(asset => asset.id === assetId ? { ...asset, arenas: [...asset.arenas, newArena] } : asset));
    const userId = getSupabaseUserId();
    if (userId && !skipDb) {
        const snakeCaseData = { ...mapToSnakeCase(newArena), user_id: userId };
        delete snakeCaseData.action_ids; // Not a column
        delete snakeCaseData.folder_id;
        if (snakeCaseData.origin_codex_id && !isUuid(String(snakeCaseData.origin_codex_id))) {
            delete snakeCaseData.origin_codex_id;
        }
        supabase.from('arenas').insert(snakeCaseData).then(({error}) => { if (error) console.error("Supabase add arena error:", error.message) });
    }
    return newArena;
  };
  
  const updateArena = (arenaId: string, arenaData: Partial<Pick<Arena, 'name' | 'description' | 'icon' | 'folderId' | 'isArchived'>>) => {
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
          assetId
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

  const reorderArena = (arenaId: string, newIndex: number) => {
    setAssets(prevAssets => {
        return prevAssets.map(asset => {
            const currentArenas = asset.arenas;
            const arenaIndex = currentArenas.findIndex(a => a.id === arenaId);
            if (arenaIndex === -1) return asset;

            const newArenas = [...currentArenas];
            const [movedArena] = newArenas.splice(arenaIndex, 1);
            newArenas.splice(newIndex, 0, movedArena);

            return { ...asset, arenas: newArenas };
        });
    });
  };

  const deleteArena = async (arenaId: string) => {
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
               const userId = getSupabaseUserId();
               if (userId) {
                   // Remove from clan_mission_participants
                   const { error } = await supabase.from('clan_mission_participants')
                       .delete()
                       .eq('clan_id', clan.id)
                       .eq('mission_id', quest.id)
                       .eq('user_id', userId);
                   
                   if (error) {
                       console.error("Error deleting clan mission participation:", error.message);
                       // If RLS prevents delete, we might be stuck. But usually users can delete their own rows if policy allows.
                       // Based on SQL analysis, there is NO explicit DELETE policy for clan_mission_participants in the main file!
                       // Wait, looking at `clan_missions_optin.sql`, there is NO DELETE POLICY!
                       // That explains why "deve ter q permitir no supabase".
                       // We need to use an RPC or just fail gracefully? 
                       // If I can't add policy, I can't fix it via code only... UNLESS there is a generic "service role" function I can call?
                       // No, I am client side.
                       // BUT, `fix_sanctuary_rls.sql` added delete policies. Maybe `clan_missions_optin.sql` was incomplete?
                       // If the user is right and they can't delete, I must inform them to ask the dev (me) to fix the DB.
                       // But I AM the dev.
                       // Since I cannot run SQL, I will try to use `rpc` if available, or just acknowledge the issue.
                       // However, wait! If I can't delete, maybe I can Update to "inactive"? No column for that.
                       
                       // LET'S ASSUME there might be a delete policy I missed or I can't see.
                       // If it fails, we should at least update local state so the user isn't blocked LOCALLY.
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
        if (arenaActions.length === 0) {
            updateArena(arenaId, { isArchived: true });
        }
        return;
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
     const userId = getSupabaseUserId();
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

  const addAction = (actionData: Omit<Action, 'id'>): Action => {
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
        
        supabase.from('actions').insert(actionPayload).then(({error}) => { 
            if (error) console.error("Supabase add action error:", error.message);
        });
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
        arena = addArena(assetId, {
            name: seasonArenaName,
            description: isClanQuest ? 'Missões Coletivas do Clã' : `Missões da temporada ${activeSeason.name}`,
            icon: isClanQuest ? '🛡️' : '📜'
        }, true);

        // Manually persist and await
        const userId = getSupabaseUserId();
        if (userId) {
            const snakeCaseData = { ...mapToSnakeCase(arena), user_id: userId };
            delete snakeCaseData.action_ids;
            const { error } = await supabase.from('arenas').insert(snakeCaseData);
            if (error) {
                console.error("Supabase add arena error:", error.message);
                return; // Stop if arena creation failed
            }
        }
    }

    if (arena?.isArchived) {
        updateArena(arena.id, { isArchived: false });
    }

    const newAction = addAction({
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



  const claimSeasonQuestReward = (questId: string) => {
    const activeSeason = SEASONS[ACTIVE_SEASON_ID];
    if (!activeSeason) return;
    const quest = activeSeason.quests.find(q => q.id === questId);
    if (!quest) return;

    if (userProfile.completedSeasonMissions?.includes(questId)) {
        alert("Recompensa já resgatada!");
        return;
    }

    // Add XP
    const currentExp = userProfile.nobility.exp;
    const addedExp = quest.rewards.xp;
    const nextExp = currentExp + addedExp;

    // Add Gold (if applicable)
    const currentGold = userProfile.wallet.gold || 0;
    const addedGold = quest.rewards.gold || 0;
    const nextGold = currentGold + addedGold;

    // Update Profile
    updateUserProfile({
        nobility: { ...userProfile.nobility, exp: nextExp },
        wallet: { ...userProfile.wallet, gold: nextGold },
        completedSeasonMissions: [...(userProfile.completedSeasonMissions || []), questId]
    });

    addFeedEvent({
        type: 'MILESTONE_COMPLETED', // Reusing this for now
        content: { title: `Quest Completada: ${quest.title}`, icon: '🏆', score: addedExp }
    });

    alert(`Recompensa resgatada! +${addedExp} XP${addedGold > 0 ? ` e +${addedGold} Gold` : ''}`);
  };
  
  const scheduleMultipleTasks = (actionId: string, daysOfWeek: DayOfWeek[], startTimeInMinutes: number) => {
    const action = getActionById(actionId);
    if (!action) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayMap: DayOfWeek[] = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
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
        supabase.from('scheduled_tasks').insert(snakeCaseData).then(({ error }) => {
            if (error) console.error("Supabase schedule multiple tasks error:", error.message);
        });
    }
  };
  const scheduleTask = (actionId: string, date: string, startTime: number): ScheduledTask | undefined => {
      const action = getActionById(actionId);
      if (!action) return undefined;

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
          supabase.from('scheduled_tasks').insert(snakeCaseData).then(({error}) => {
              if (error) console.error("Supabase schedule task error:", error.message);
          });
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

  const isClanQuestActionId = (actionId: string) => {
      const action = getActionById(actionId);
      return !!getClanQuestForAction(action);
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
    
    // If it's today, add to daily commitment
    if (date === dailyCommitment.date && !isClanQuestActionId(actionId)) {
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
  const rescheduleTask = (taskId: string, newDate: string, newStartTime: number) => {
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId 
        ? { ...task, date: newDate, startTime: newStartTime }
        : task
    ));
    const userId = getSupabaseUserId();
    if (userId) {
        supabase.from('scheduled_tasks')
            .update({ date: newDate, start_time: newStartTime })
            .eq('id', taskId)
            .then(({ error }) => {
                if (error) console.error("Supabase reschedule task error:", error.message);
            });
    }
  };
  const toggleTaskCompletion = (taskId: string) => {
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
                    if (action?.actionType === 'Marco') {
                        setAchievementUnlocked({ type: 'MILESTONE_COMPLETED', data: action });
                        addFeedEvent({
                            type: 'MILESTONE_COMPLETED',
                            content: { title: action.name, icon: action.icon }
                        });
                    }
                }

                const actionForClanQuest = getActionById(task.actionId);
                const clanQuest = getClanQuestForAction(actionForClanQuest);
                if (clanQuest) {
                    updateClanMissionProgress(clanQuest.id, updatedTask.completed ? 1 : -1);
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

  return (
    <GameContext.Provider value={{ isNewUser, assets, actions, arenaFolders, tasks, taskPool, checklistItems, userProfile, friends, friendRequestsIncoming, friendRequestsOutgoing, clanJoinRequestsIncoming, clanJoinRequestsOutgoing, reports, nobilityRanks, clan, clanRanks, enrichedClanMembers, activeCycle, dailyCommitment, achievementUnlocked, seasons, seasonMissions, seasonQuests, clanQuestProgress, clanQuestParticipants, getClanQuestProgress, getClanQuestForActionName, getClanQuestsForArena, fetchClanQuestParticipants, levelUnlocks, setAchievementUnlocked, updateLevelUnlocks, grantUserUnlock, addCompletedMission, acceptSeasonQuest, addProfileFlag, feed, addFeedEvent, updateAssetSlotValue, getArenas, addArena, updateArena, getActionsForArena, addAction, scheduleTask, getTasksForDate, rescheduleTask, toggleTaskCompletion, updateAction, deleteAction, scheduleAndCompleteNow, returnTaskToPool, deleteTask, completeTutorialMission, deleteArena, toggleChecklistItem, addChecklistItem, updateChecklistItem, deleteChecklistItem, updateUserProfile, addFriend, searchPlayers, sendFriendRequest, acceptFriendRequest, declineFriendRequest, setCurrentSkin, updateAllAssetLevels, startCycle, endCycle, startNewCycle, updateMood, scheduleMultipleTasks, getAssetForAction, getActionBackgroundStyle, scheduleAndCompleteMilestoneNow, setDailyCommitment, lockDailyCommitment, endDailyBattle, resetDailyCommitment, manualCloseSITREP, openChest, applyExp, addChest, createClan, updateClan, leaveClan, transferLeadershipAndLeave, deleteClan, kickClanMember, addClanMember, searchClans, joinClan, approveClanJoinRequest, rejectClanJoinRequest, addSeason, updateSeason, addSeasonMission, saveSanctuaryPosition, getSanctuaryPositionsForClan, getSanctuaryAreaStats, updateSanctuaryAreaTime, applySanctuaryAreaDecay, loadClanAndMembers, userMissionParticipations, joinClanMission, updateClanMissionProgress, createArenaFolder, updateArenaFolder, deleteArenaFolder, moveArenaToFolder, reorderArena, oracleMode, setOracleMode, inventory, buyGoldPack, buyStoreItem, recycleItem, craftItem, equipItem, toggleEquipItem }}>
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
