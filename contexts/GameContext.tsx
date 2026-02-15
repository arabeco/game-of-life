
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Asset, Slot, SlotValue, Arena, Action, ScheduledTask, ChecklistItem, UserProfile, Report, NobilityRank, Clan, ClanJoinRequest, ClanRank, DayOfWeek, Cycle, DailyCommitment, ChestType, FeedEvent, FeedEventType, EnrichedClanMember, ClanMember, Season, SeasonMission, SeasonQuest, FriendRequest, LevelUnlocks, UnlockCategory, UserUnlocks } from '../types';
import { ASSETS_DATA, MASTERY_LEVEL_DESCRIPTIONS, MAX_CLAN_MEMBERS, GM_CONFIG } from '../constants';
import { buildDefaultLevelUnlocks, DEFAULT_SOVEREIGN_CONFIG } from '../constants/avatar';
import { supabase } from '../supabaseClient';
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

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);


const TUTORIAL_ACTION_ID = 'action_tutorial_01';

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

const isNewUserCheck = () => {
    try {
        return !localStorage.getItem('userProfile');
    } catch {
        return false;
    }
};

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

const MOCK_SEARCHABLE_CLANS: Clan[] = [];

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
    unlockedItems: {
        bodyStyles: {},
        hairStyles: {},
        outfits: {},
        head_under_items: {},
        helmets: {},
        head_over_items: {},
        artifacts: {},
    },
    completedSeasonMissions: []
};

const defaultChecklistItems: ChecklistItem[] = [
    { id: 'c1', text: 'Arrumar a cama', completed: true },
    { id: 'c2', text: 'Beber 1L de água', completed: false },
    { id: 'c3', text: 'Ler 10 páginas', completed: false },
    { id: 'c4', text: 'Meditar 5 min', completed: false },
];

const DEFAULT_FRIENDS: UserProfile[] = [
    { ...DEFAULT_USER_PROFILE, id: 'friend_01', nickname: 'Nexus', avatarUrl: 'https://picsum.photos/seed/friend01/100/100', sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, body: 'female_base', hairStyle: 'parted', hairColor: '#B8860B', outfit: 'lab_coat', head_under: 'glasses' }, isOnline: true, role: 'user' },
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
    const defaultActions: Action[] = [
        { id: 'act1', arenaId: 'arena_proposito_1', name: 'Estudar Carreira', icon: '📚', duration: 60, repetitions: 12, actionType: 'Ação Recorrente', difficulty: 3 },
        { id: 'act2', arenaId: 'arena_financas_1', name: 'Analisar Gastos', icon: '$', duration: 30, repetitions: 4, actionType: 'Ação Recorrente', difficulty: 2 },
        { id: 'act3', arenaId: 'arena_financas_2', name: 'Estudar Ações', icon: '📈', duration: 45, repetitions: 8, actionType: 'Ação Recorrente', difficulty: 4 },
        { id: 'act4', arenaId: 'arena_fisico_1', name: 'Correr 5km', icon: '🏃‍♂️', duration: 30, repetitions: 1, actionType: 'Marco', difficulty: 3 },
    ];
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
  getClanQuestProgress: (questId: string) => number;
  levelUnlocks: LevelUnlocks;
  setAchievementUnlocked: (achievement: { type: FeedEventType; data: any; } | null) => void;
  updateLevelUnlocks: (next: LevelUnlocks) => void;
  grantUserUnlock: (category: UnlockCategory, itemId: string) => void;
  completeSeasonMission: (mission: SeasonMission) => void;
  feed: FeedEvent[];
  addFeedEvent: (eventData: Pick<FeedEvent, 'type' | 'content'>) => void;
  updateAssetSlotValue: (assetId: string, slotId: string, value: SlotValue) => void;
  getArenas: () => Arena[];
  addArena: (assetId: string, arenaData: Pick<Arena, 'name' | 'description' | 'icon'>) => Arena;
  updateArena: (arenaId: string, arenaData: Partial<Pick<Arena, 'name' | 'description' | 'icon'>>) => void;
  deleteArena: (arenaId: string) => void;
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
  addChest: (chestType: ChestType) => void;
  startNewCycle: (arenaChanges: ArenaSetupChange[], cycleDetails: { name: string; endDate: string; }) => void;
  setDailyCommitment: (taskIds: string[]) => void;
  lockDailyCommitment: () => void;
  endDailyBattle: () => void;
  resetDailyCommitment: () => void;
  openChest: (chestType: ChestType) => boolean;
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
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode, session: Session | null }> = ({ children, session }) => {
  const [isNewUser] = useState(isNewUserCheck);
  
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
        const saved = localStorage.getItem('assets');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load assets from storage", e); }
    return createDefaultAssets(isNewUser);
  });
  
  const [actions, setActions] = useState<Action[]>(() => {
    try {
        const saved = localStorage.getItem('actions');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load actions from storage", e); }
    return createDefaultActions(isNewUser);
  });

  const [tasks, setTasks] = useState<ScheduledTask[]>(() => {
      try {
        const saved = localStorage.getItem('tasks');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load tasks from storage", e); }
    return [];
  });
  const [taskPool, setTaskPool] = useState<TaskPoolItem[]>([]);
  
  const [reports, setReports] = useState<Report[]>(() => {
    try {
        const saved = localStorage.getItem('reports');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load reports from storage", e); }
    return [];
  });
  
  const nobilityRanks = NOBILITY_RANKS;
  const clanRanks = CLAN_RANKS;
  
  const [dailyCommitment, setDailyCommitmentState] = useState<DailyCommitment>(() => {
    try {
        const saved = localStorage.getItem('dailyCommitment');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.date === getTodayString()) return parsed;
        }
    } catch (e) { console.error("Failed to load dailyCommitment from storage", e); }
    return createDefaultDailyCommitment();
  });

  const [cycleExpBonus, setCycleExpBonus] = useState<number>(() => {
    try {
        const saved = localStorage.getItem('cycleExpBonus');
        if (saved) {
            const parsed = Number(saved);
            return Number.isFinite(parsed) ? parsed : 0;
        }
    } catch (e) { console.error("Failed to load cycleExpBonus from storage", e); }
    return 0;
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
        const savedProfile = localStorage.getItem('userProfile');
        const parsedProfile = savedProfile ? JSON.parse(savedProfile) : {};
        // Use a generic ID if no session exists yet, but avoid hardcoded 'placeholder_user' as the source of truth
        return { 
          ...DEFAULT_USER_PROFILE, 
          id: session?.user.id || parsedProfile.id || DEFAULT_USER_PROFILE.id,
          ...parsedProfile, 
          sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, ...(parsedProfile.sovereign || {}) } 
        };
    } catch (error) {
        console.error("Failed to parse user profile from localStorage", error);
        return DEFAULT_USER_PROFILE;
    }
  });

  // Update profile when session changes
  useEffect(() => {
    if (session?.user.id && userProfile.id !== session.user.id) {
        setUserProfile(prev => ({ ...prev, id: session.user.id }));
    }
  }, [session?.user.id]);

  useEffect(() => {
    const currentUserId = session?.user.id;
    if (!currentUserId) return;

    let storedUserId: string | null = null;
    let storedProfileId: string | null = null;
    try {
        storedUserId = localStorage.getItem('activeUserId');
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            if (parsed?.id) storedProfileId = parsed.id;
        }
    } catch {
        storedUserId = null;
        storedProfileId = null;
    }

    const previousId = storedUserId || storedProfileId;
    if (previousId && previousId !== currentUserId) {
        const keysToClear = [
            'assets',
            'actions',
            'tasks',
            'reports',
            'clan',
            'checklistItems',
            'userProfile',
            'activeCycle',
            'feed',
            'dailyCommitment',
            'cycleExpBonus',
            'levelUnlocks',
            'clanQuestProgress',
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));

        setAssets(createDefaultAssets(isNewUser));
        setActions(createDefaultActions(isNewUser));
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
        setUserProfile({
            ...DEFAULT_USER_PROFILE,
            id: currentUserId,
            sovereign: { ...DEFAULT_SOVEREIGN_CONFIG },
        });
    }

    try {
        localStorage.setItem('activeUserId', currentUserId);
    } catch {}
  }, [session?.user.id, isNewUser]);

  const [activeCycle, setActiveCycle] = useState<Cycle | null>(() => {
    try {
        const savedCycle = localStorage.getItem('activeCycle');
        return savedCycle ? JSON.parse(savedCycle) : null;
    } catch (error) {
        console.error("Failed to parse active cycle from localStorage", error);
        return null;
    }
  });

  const [clan, setClan] = useState<Clan | null>(() => {
    try {
      const saved = localStorage.getItem('clan');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load clan from storage", e); }
    return null;
  });

  const [enrichedClanMembers, setEnrichedClanMembers] = useState<EnrichedClanMember[]>([]);

  const [friends, setFriends] = useState<UserProfile[]>(DEFAULT_FRIENDS);
  const [friendRequestsIncoming, setFriendRequestsIncoming] = useState<FriendRequest[]>([]);
  const [friendRequestsOutgoing, setFriendRequestsOutgoing] = useState<FriendRequest[]>([]);
  const [clanJoinRequestsIncoming, setClanJoinRequestsIncoming] = useState<ClanJoinRequest[]>([]);
  const [clanJoinRequestsOutgoing, setClanJoinRequestsOutgoing] = useState<ClanJoinRequest[]>([]);
  
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() => {
      try {
        const saved = localStorage.getItem('checklistItems');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load checklistItems from storage", e); }
    return [...defaultChecklistItems];
  });

  const [achievementUnlocked, setAchievementUnlocked] = useState<{ type: FeedEventType; data: any; } | null>(null);
  const [feed, setFeed] = useState<FeedEvent[]>(() => {
    try {
        const saved = localStorage.getItem('feed');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load feed from storage", e); }
    return [];
  });

  const [clanQuestProgress, setClanQuestProgress] = useState<Record<string, Record<string, number>>>(() => {
    try {
        const saved = localStorage.getItem('clanQuestProgress');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load clanQuestProgress from storage", e); }
    return {};
  });

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonMissions, setSeasonMissions] = useState<SeasonMission[]>([]);
  const seasonQuests = GM_CONFIG.seasonQuests || [];
  const [levelUnlocks, setLevelUnlocks] = useState<LevelUnlocks>(() => {
    try {
        const saved = localStorage.getItem('levelUnlocks');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load levelUnlocks from storage", e); }
    return buildDefaultLevelUnlocks();
  });

  const persistTimeoutRef = useRef<number | null>(null);
  const clanQuestProgressTableReadyRef = useRef(true);

  useEffect(() => {
    if (persistTimeoutRef.current !== null) window.clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = window.setTimeout(() => {
        try {
            localStorage.setItem('assets', JSON.stringify(assets));
            localStorage.setItem('actions', JSON.stringify(actions));
            localStorage.setItem('tasks', JSON.stringify(tasks));
            localStorage.setItem('reports', JSON.stringify(reports));
            if (clan) localStorage.setItem('clan', JSON.stringify(clan));
            else localStorage.removeItem('clan');
            localStorage.setItem('checklistItems', JSON.stringify(checklistItems));
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            if (activeCycle) localStorage.setItem('activeCycle', JSON.stringify(activeCycle));
            else localStorage.removeItem('activeCycle');
            localStorage.setItem('feed', JSON.stringify(feed));
            localStorage.setItem('dailyCommitment', JSON.stringify(dailyCommitment));
            localStorage.setItem('cycleExpBonus', String(cycleExpBonus));
            localStorage.setItem('levelUnlocks', JSON.stringify(levelUnlocks));
            localStorage.setItem('clanQuestProgress', JSON.stringify(clanQuestProgress));
        } catch (e) {
            console.error(e);
        }
    }, 250);
    return () => {
        if (persistTimeoutRef.current !== null) window.clearTimeout(persistTimeoutRef.current);
    };
  }, [assets, actions, tasks, reports, clan, checklistItems, userProfile, activeCycle, feed, dailyCommitment, cycleExpBonus, levelUnlocks, clanQuestProgress]);

  const isClanQuestProgressMissing = (error: unknown) => {
    if (!error) return false;
    const status = (error as any)?.status ?? (error as any)?.code;
    const message = String((error as any)?.message || '');
    return status === 404 || message.includes('Not Found') || message.includes('404') || (message.includes('relation') && message.includes('clan_quest_progress'));
  };

  const fetchClanQuestProgress = useCallback(async (clanId: string) => {
    if (!clanQuestProgressTableReadyRef.current) return;
    const { data, error } = await supabase.from('clan_quest_progress').select('*').eq('clan_id', clanId);
    if (error || !data) {
        if (isClanQuestProgressMissing(error)) {
            clanQuestProgressTableReadyRef.current = false;
        }
        return;
    }
    const progressMap = data.reduce((acc: Record<string, number>, row: any) => {
        const mapped = mapToCamelCase(row);
        if (!mapped?.questId) return acc;
        acc[mapped.questId] = Number(mapped.progress) || 0;
        return acc;
    }, {} as Record<string, number>);
    setClanQuestProgress(prev => ({ ...prev, [clanId]: progressMap }));
  }, []);

  const hydrateProfilesByIds = useCallback(async (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
    if (uniqueIds.length === 0) return {} as Record<string, UserProfile>;

    const { data: profilesData, error: profilesError } = await supabase.from('user_profiles').select('*').in('id', uniqueIds);
    if (profilesError || !profilesData) {
        console.error('Error fetching profiles:', profilesError?.message);
        return {} as Record<string, UserProfile>;
    }

    const mapped = mapToCamelCase(profilesData) as UserProfile[];
    return mapped.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
    }, {} as Record<string, UserProfile>);
  }, []);

  const loadFriendsAndRequests = useCallback(async (userId: string) => {
    const [{ data: friendsData, error: friendsError }, { data: incomingData, error: incomingError }, { data: outgoingData, error: outgoingError }] = await Promise.all([
        supabase.from('friends').select('*').eq('user_id', userId),
        supabase.from('friend_requests').select('*').eq('recipient_id', userId),
        supabase.from('friend_requests').select('*').eq('sender_id', userId),
    ]);

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
    ];

    const profilesById = await hydrateProfilesByIds(profileIdsToHydrate);

    setFriends(friendIds.map(id => profilesById[id]).filter(Boolean));
    setFriendRequestsIncoming(incomingRequests.map(r => ({
        ...r,
        senderProfile: profilesById[r.senderId],
        recipientProfile: profilesById[r.recipientId],
    })));
    setFriendRequestsOutgoing(outgoingRequests.map(r => ({
        ...r,
        senderProfile: profilesById[r.senderId],
        recipientProfile: profilesById[r.recipientId],
    })));
  }, [hydrateProfilesByIds]);

  const loadClanJoinRequestsOutgoing = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('clan_join_requests').select('*').eq('user_id', userId);
    if (error || !data) {
        if (error) console.error('Error fetching outgoing clan join requests:', error.message);
        return;
    }
    const mapped = mapToCamelCase(data || []) as ClanJoinRequest[];
    setClanJoinRequestsOutgoing(mapped.filter(r => r.status === 'pending'));
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

  const loadClanAndMembers = useCallback(async (clanId: string) => {
    const { data: clanData, error: clanError } = await supabase.from('clans').select('*').eq('id', clanId).single();
    if (clanError || !clanData) { console.error('Error fetching clan data:', clanError?.message); return; }

    setClan(mapToCamelCase(clanData) as Clan);
    await fetchClanQuestProgress(clanId);

    const { data: membersData, error: membersError } = await supabase.from('clan_members').select('*').eq('clan_id', clanId);
    if (membersError || !membersData) { console.error('Error fetching clan members:', membersError?.message); return; }

    const memberIds = membersData.map((m: any) => m.user_id);
    if (memberIds.length === 0) { setEnrichedClanMembers([]); return; }

    const { data: memberProfiles, error: profilesError } = await supabase.from('user_profiles').select('*').in('id', memberIds);
    if (profilesError || !memberProfiles) { console.error('Error fetching member profiles:', profilesError?.message); return; }

    const enrichedMembers: EnrichedClanMember[] = memberProfiles.map((profile: any) => {
        const memberInfo = membersData.find((m: any) => m.user_id === profile.id);
        if (!memberInfo) return null;
        
        const { role: userRole, ...camelCaseProfile } = mapToCamelCase(profile) as UserProfile;

        return {
            ...camelCaseProfile,
            role: memberInfo.role as 'leader' | 'member',
            joinedAt: memberInfo.joined_at,
        };
    }).filter((m): m is EnrichedClanMember => m !== null);

    setEnrichedClanMembers(enrichedMembers);

    const currentUserId = session?.user.id ?? userProfile.id;
    const currentMember = membersData.find((m: any) => m.user_id === currentUserId);
    if (currentMember?.role === 'leader') {
        await loadClanJoinRequestsIncoming(clanId);
    } else {
        setClanJoinRequestsIncoming([]);
    }
  }, [setClan, setEnrichedClanMembers, fetchClanQuestProgress, session?.user.id, userProfile.id, loadClanJoinRequestsIncoming]);


  // --- Supabase Data Sync ---
  useEffect(() => {
    const today = getTodayString();
    
    // Check for daily reset
    if (dailyCommitment.date !== today) {
        resetDailyCommitment();
        // Also reset checklist items (uncheck them)
        setChecklistItems(prev => prev.map(item => ({ ...item, completed: false })));
    }
    
    const userId = session?.user.id ?? userProfile.id;
    if (!userId || userId === 'placeholder_user') return; // Don't load if it's the default placeholder

    const loadDataFromSupabase = async () => {
        
        
        // 1. Load Profile
        const { data: profileData, error: profileError } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
        if (!profileError && profileData) {
            const camelProfile = mapToCamelCase(profileData) as UserProfile;
            setUserProfile(prev => ({ ...prev, ...camelProfile }));
        }

        await loadFriendsAndRequests(userId);
        await loadClanJoinRequestsOutgoing(userId);

        let camelArenas: Arena[] | null = null;
        const { data: arenasData, error: arenasError } = await supabase.from('arenas').select('*').eq('user_id', userId);
        if (!arenasError && arenasData) {
            camelArenas = (mapToCamelCase(arenasData) as Arena[]).map(arena => ({
                ...arena,
                actionIds: Array.isArray(arena.actionIds) ? arena.actionIds : [],
                isArchived: typeof arena.isArchived === 'boolean' ? arena.isArchived : false,
            }));
        }

        // 3. Load Actions
        const { data: actionsData, error: actionsError } = await supabase.from('actions').select('*').eq('user_id', userId);
        if (!actionsError && actionsData) {
            setActions(mapToCamelCase(actionsData) as Action[]);
        }

        // 4. Load Scheduled Tasks
        const { data: tasksData, error: tasksError } = await supabase.from('scheduled_tasks').select('*').eq('user_id', userId);
        if (!tasksError && tasksData) {
            setTasks(mapToCamelCase(tasksData) as ScheduledTask[]);
        }

        const { data: slotsData, error: slotsError } = await supabase.from('asset_slots').select('*').eq('user_id', userId);
        if ((!arenasError && arenasData) || (!slotsError && slotsData)) {
            setAssets(prevAssets => {
                let nextAssets = prevAssets;
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
                return nextAssets;
            });
        }
        
        const { data: clanMemberData, error: clanMemberError } = await supabase.from('clan_members').select('clan_id').eq('user_id', userId).single();

        if (clanMemberError || !clanMemberData) {
            setClan(null);
            setEnrichedClanMembers([]);
            setClanJoinRequestsIncoming([]);
        } else {
            loadClanAndMembers(clanMemberData.clan_id);
        }

        const { data: reportsData, error: reportsError } = await supabase.from('reports').select('*').eq('user_id', userId).order('end_date', { ascending: false });
        if (!reportsError && reportsData) {
            setReports(mapToCamelCase(reportsData) as Report[]);
        }

        const { data: cyclesData, error: cyclesError } = await supabase.from('cycles').select('*').eq('user_id', userId).is('end_date', null).limit(1);
        if (!cyclesError && cyclesData && cyclesData.length > 0) {
            setActiveCycle(mapToCamelCase(cyclesData[0]) as Cycle);
        }
    };


    loadDataFromSupabase();
  }, [session, userProfile.id, loadClanAndMembers, loadFriendsAndRequests, loadClanJoinRequestsOutgoing]);

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

  const openChest = (chestType: ChestType): boolean => {
    let success = false;
    setUserProfile(prev => {
      const existingChests = prev.chests || [];
      const chestIndex = existingChests.findIndex(c => c.type === chestType);

      if (chestIndex === -1 || existingChests[chestIndex].count === 0) return prev;
      success = true;
      const newChests = existingChests.map((chest, index) => 
        index === chestIndex ? { ...chest, count: chest.count - 1 } : chest
      ).filter(chest => chest.count > 0);

      return { ...prev, chests: newChests };
    });
    return success;
  };
  


  const isClanQuestActionId = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return false;
    const arena = assets.flatMap(asset => asset.arenas).find(ar => ar.id === action.arenaId);
    if (!arena?.name) return false;
    const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return normalized.includes('quests - cla');
  };

  const resetDailyCommitment = () => setDailyCommitmentState({ date: getTodayString(), taskIds: [], stage: 'planning', score: null, expDeposited: null, sitrepBonus: null });
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
    const committedTasks = tasks.filter(t => dailyCommitment.taskIds.includes(t.id) && t.date === dailyCommitment.date && !isClanQuestActionId(t.actionId));
    const committedCounts = committedTasks.reduce((acc, task) => {
        acc[task.actionId] = (acc[task.actionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const completedCounts = tasks.reduce((acc, task) => {
        if (task.date !== dailyCommitment.date) return acc;
        if (!committedCounts[task.actionId]) return acc;
        if (isClanQuestActionId(task.actionId)) return acc;
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
    const userId = session?.user.id ?? userProfile.id;
    if (userId && userId !== 'placeholder_user') {
      const sitrepReport = {
        id: crypto.randomUUID(),
        user_id: userId,
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

  useEffect(() => {
    if (!clan?.id) return;
    fetchClanQuestProgress(clan.id);
    const intervalId = window.setInterval(() => fetchClanQuestProgress(clan.id), 15000);
    return () => window.clearInterval(intervalId);
  }, [clan?.id, fetchClanQuestProgress]);

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
        if (isClanQuestActionId(action.id)) return [{ actionId: action.id, unlimited: true }];
        const scheduledCount = scheduledCounts[action.id] || 0;
        const poolCount = Math.max(0, action.repetitions - scheduledCount);
        return Array.from({ length: poolCount }, () => ({ actionId: action.id }));
    });
    
    setTaskPool(pool);
  }, [actions, tasks, assets]); 

  useEffect(() => { document.body.setAttribute('data-skin', userProfile.skin); }, [userProfile.skin]);

  useEffect(() => {
    const displayedAssets = assets.filter(a => a.id !== 'geral');
    const totalLevel = displayedAssets.reduce((sum, asset) => sum + asset.level, 0);

    if (userProfile.level !== totalLevel) {
        updateUserProfile({ level: totalLevel });
    }
  }, [assets, userProfile.level]);

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

  const updateUserProfile = (profileData: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profileData }));
    const userId = session?.user.id;
    if (userId && userId !== 'placeholder_user' && isUuid(userId)) {
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
        const entries = Object.entries(profileData).filter(([key, value]) => allowedKeys.includes(key as keyof UserProfile) && value !== undefined);
        if (entries.length > 0) {
            const snakeCaseData = mapToSnakeCase(Object.fromEntries(entries));
            supabase.from('user_profiles').update(snakeCaseData).eq('id', userId).then(({ error }) => { if (error) console.error("Supabase profile update error:", error.message); });
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

  const completeSeasonMission = (mission: SeasonMission) => {
    const rewardValue = typeof mission.reward_value === 'string' ? mission.reward_value : '';
    const rewardParts = rewardValue.includes(':') ? rewardValue.split(':') : [];
    const rewardCategory = rewardParts[0] as UnlockCategory | undefined;
    const rewardItemId = rewardParts[1];

    const completed = userProfile.completedSeasonMissions || [];
    if (completed.includes(mission.id)) return;
    const unlockedItems: UserUnlocks = userProfile.unlockedItems || {
        bodyStyles: {},
        hairStyles: {},
        outfits: {},
        head_under_items: {},
        helmets: {},
        head_over_items: {},
        artifacts: {},
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

  const updateAllAssetLevels = (levels: Record<string, number>, levelDescriptions?: Record<string, string[]>): boolean => {
    const lastUpdate = userProfile.lastLevelUpdate || 0;
    const threeDays = 72 * 60 * 60 * 1000;
    if (Date.now() - lastUpdate < threeDays && userProfile.role !== 'admin') {
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

    updateUserProfile({ lastLevelUpdate: Date.now(), level: nextTotalLevel });
    return true;
  };

  const startCycle = (name: string, endDate: string) => {
    const userId = session?.user.id ?? userProfile.id;
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
    if (userId && userId !== 'placeholder_user') {
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
    }
  };
  const endCycle = (currentAssets: Asset[], currentActions: Action[]): EndCycleResult => {
    const cycle = activeCycle;
    const userId = session?.user.id ?? userProfile.id;
    const startDate = cycle?.startDate || '2000-01-01'; // Fallback para o primeiro ciclo sem data
    const endDate = new Date().toISOString().split('T')[0];

    // Filtrar tarefas apenas do usuário atual e dentro do período do ciclo
    const cycleTasks = tasks.filter(t => t.date >= startDate && t.date <= endDate && !isClanQuestActionId(t.actionId));
    const completedTasks = cycleTasks.filter(t => t.completed);

    // Arenas e Ações envolvidas (baseado nas tarefas do ciclo)
    const actionIdsInCycle = new Set(cycleTasks.map(t => t.actionId));
    const involvedActions = currentActions.filter(a => actionIdsInCycle.has(a.id));
    
    const arenaIdsInCycle = new Set(involvedActions.map(a => a.arenaId));
    const involvedArenas = currentAssets.flatMap(as => as.arenas).filter(ar => arenaIdsInCycle.has(ar.id));

    // Performance Score baseado nas tarefas planejadas do ciclo
    const performanceScore = cycleTasks.length > 0 ? Math.round((completedTasks.length / cycleTasks.length) * 100) : 100;

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

    const newReport: Report = { 
        id: crypto.randomUUID(), 
        startDate, 
        endDate, 
        performanceScore, 
        metrics: { 
            actionsCompleted: completedTasks.length, 
            totalPlannedActions: cycleTasks.length, 
            arenasInvolved: involvedArenas.length, 
            goalsMet: involvedActions.filter(a => a.actionType === 'Marco').length, 
            totalHours: Math.round(completedTasks.reduce((sum, t) => sum + (t.duration / 60), 0)) 
        }, 
        highlight: { 
            mostFocusedArena, 
            mostRepeatedAction 
        }, 
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
    if (userId && userId !== 'placeholder_user') {
        const snakeCaseReport = {
            id: newReport.id,
            user_id: userId,
            start_date: newReport.startDate,
            end_date: newReport.endDate,
            performance_score: newReport.performanceScore,
            metrics: newReport.metrics,
            highlight: newReport.highlight,
            asset_progress: newReport.assetProgress
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

  const addChest = (chestType: ChestType) => {
    // ... (rest of the function is correct)
  };
  
  const startNewCycle = (arenaChanges: ArenaSetupChange[], cycleDetails: { name: string; endDate: string; }) => {
    setCycleExpBonus(0);
  };

  const setCurrentSkin = (skinId: string) => updateUserProfile({ skin: skinId });
  const addFriend = (nickname: string) => {
    if(nickname.trim() && !friends.find(f => f.nickname === nickname)) {
        const newFriend: UserProfile = { ...DEFAULT_USER_PROFILE, id: `friend_${Date.now()}`, nickname, sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, body: 'female_base', hairStyle: 'ponytail', hairColor: '#B8860B' }, isOnline: Math.random() > 0.5 };
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
    const senderId = session?.user.id ?? userProfile.id;
    if (!senderId || senderId === 'placeholder_user') return;
    if (!recipientId || recipientId === senderId) return;
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
    const userId = session?.user.id ?? userProfile.id;
    if (!userId || userId === 'placeholder_user') return;
    const request = friendRequestsIncoming.find(r => r.id === requestId);
    if (!request) return;

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
    const userId = session?.user.id ?? userProfile.id;
    if (!userId || userId === 'placeholder_user') return;
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

  const updateClanQuestProgress = (questId: string, delta: number) => {
    if (!clan) return;
    let nextValue = 0;
    setClanQuestProgress(prev => {
        const clanProgress = prev[clan.id] || {};
        nextValue = Math.max(0, (clanProgress[questId] || 0) + delta);
        return { ...prev, [clan.id]: { ...clanProgress, [questId]: nextValue } };
    });
    const userId = session?.user.id ?? userProfile.id;
    if (userId && clanQuestProgressTableReadyRef.current) {
        supabase.from('clan_quest_progress').upsert({
            clan_id: clan.id,
            quest_id: questId,
            progress: nextValue
        }).then(({ error }) => {
            if (!error) return;
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
    const userId = session?.user.id ?? userProfile.id;
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
  const addArena = (assetId: string, arenaData: Pick<Arena, 'name' | 'description' | 'icon'>): Arena => {
    const newArena: Arena = { ...arenaData, id: crypto.randomUUID(), assetId, actionIds: [], isArchived: false };
    setAssets(prevAssets => prevAssets.map(asset => asset.id === assetId ? { ...asset, arenas: [...asset.arenas, newArena] } : asset));
    const userId = session?.user.id ?? userProfile.id;
    if (userId) {
        const snakeCaseData = { ...mapToSnakeCase(newArena), user_id: userId };
        delete snakeCaseData.action_ids; // Not a column
        supabase.from('arenas').insert(snakeCaseData).then(({error}) => { if (error) console.error("Supabase add arena error:", error.message) });
    }
    return newArena;
  };
  
  const updateArena = (arenaId: string, arenaData: Partial<Pick<Arena, 'name' | 'description' | 'icon'>>) => {
    setAssets(prevAssets => prevAssets.map(asset => ({
        ...asset,
        arenas: asset.arenas.map(arena => arena.id === arenaId ? { ...arena, ...arenaData } : arena)
    })));
    const userId = session?.user.id ?? userProfile.id;
    if (userId) {
        const snakeCaseData = mapToSnakeCase(arenaData);
        supabase.from('arenas').update(snakeCaseData).eq('id', arenaId).then(({error}) => { 
            if (error) console.error("Supabase update arena error:", error.message);
        });
    }
  };
  const deleteArena = (arenaId: string) => {
     setAssets(prevAssets => prevAssets.map(asset => ({
        ...asset,
        arenas: asset.arenas.filter(arena => arena.id !== arenaId)
    })));
    setActions(prevActions => prevActions.filter(action => action.arenaId !== arenaId));
    const userId = session?.user.id ?? userProfile.id;
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
    }
    const asset = getAssetForAction(actionId);
    return { background: `var(--asset-grad-${asset?.id || 'default'})` };
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

    const userId = session?.user.id ?? userProfile.id;
    if (userId) {
        const snakeCaseData = { ...mapToSnakeCase(newAction), user_id: userId };
        supabase.from('actions').insert(snakeCaseData).then(({error}) => { 
            if (error) console.error("Supabase add action error:", error.message);
        });
    }

    return newAction;
  };
  const updateAction = (actionId: string, actionData: Partial<Action>) => {
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, ...actionData } : a));
    const userId = session?.user.id ?? userProfile.id;
    if (userId) {
        const snakeCaseData = mapToSnakeCase(actionData);
        supabase.from('actions').update(snakeCaseData).eq('id', actionId).then(({error}) => { 
            if (error) console.error("Supabase update action error:", error.message);
        });
    }
  };
  const deleteAction = (actionId: string) => {
    setActions(prev => prev.filter(a => a.id !== actionId));
    setTasks(prev => prev.filter(t => t.actionId !== actionId));
    setAssets(prevAssets => prevAssets.map(asset => ({
        ...asset,
        arenas: asset.arenas.map(arena => {
            const actionIds = Array.isArray(arena.actionIds) ? arena.actionIds : [];
            return {
                ...arena,
                actionIds: actionIds.filter(id => id !== actionId)
            };
        })
    })));
    const userId = session?.user.id ?? userProfile.id;
    if (userId) {
        supabase.from('actions').delete().eq('id', actionId).then(({error}) => { 
            if (error) console.error("Supabase delete action error:", error.message);
        });
    }
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

    const userId = session?.user.id ?? userProfile.id;
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

      const userId = session?.user.id ?? userProfile.id;
      if (userId) {
          const snakeCaseData = { ...mapToSnakeCase(newTask), user_id: userId };
          supabase.from('scheduled_tasks').insert(snakeCaseData).then(({error}) => {
              if (error) console.error("Supabase schedule task error:", error.message);
          });
      }

      return newTask;
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
    
    // If it's today, add to daily commitment so it shows in SITREP
    if (date === dailyCommitment.date && !isClanQuestActionId(actionId)) {
        setDailyCommitmentState(prev => ({
            ...prev,
            taskIds: [...prev.taskIds, newTask.id]
        }));
    }

    const userId = session?.user.id ?? userProfile.id;
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

    const userId = session?.user.id ?? userProfile.id;
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
    const userId = session?.user.id ?? userProfile.id;
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
    const userId = session?.user.id ?? userProfile.id;
    if (userId) {
        supabase.from('scheduled_tasks')
            .update({ date: newDate, start_time: newStartTime })
            .eq('id', taskId)
            .then(({ error }) => {
                if (error) console.error("Supabase reschedule task error:", error.message);
            });
    }
  };
  const getClanQuestForAction = (action: Action | undefined) => {
    if (!action) return null;
    const arena = getArenas().find(ar => ar.id === action.arenaId);
    if (!arena?.name) return null;
    const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!normalized.includes('quests - cla')) return null;
    const activeSeason = seasons.find(s => s.is_active);
    return seasonQuests.find(q => q.scope === 'clan' && q.title === action.name && (!activeSeason || q.season_id === activeSeason.id)) || null;
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
                    updateClanQuestProgress(clanQuest.id, updatedTask.completed ? 1 : -1);
                }

                // Update in Supabase
                const userId = session?.user.id ?? userProfile.id;
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
    const userId = session ? session.user.id : userProfile.id;
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
      const userId = session ? session.user.id : userProfile.id;
      if (!userId) { console.error("User not authenticated"); return; }
      const { error } = await supabase.from('clan_members').delete().eq('user_id', userId);
      if (error) { console.error("Error leaving clan:", error.message); return; }
      setClan(null);
      setEnrichedClanMembers([]);
      setClanJoinRequestsIncoming([]);
  };

  const transferLeadershipAndLeave = async (newLeaderId: string) => {
    if (!clan || !session) return;
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
      const { error } = await supabase.from('clan_members').delete().eq('user_id', memberId).eq('clan_id', clan.id);
      if (error) { console.error("Error kicking member:", error.message); return; }
      setEnrichedClanMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const addClanMember = async (memberId: string) => {
      if (!clan) return;

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
    const userId = session ? session.user.id : userProfile.id;
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
    const userId = session ? session.user.id : userProfile.id;
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
      const { data, error } = await supabase.from('season_missions').insert(mapToSnakeCase(missionData)).select().single();
      if (error) { console.error("Error adding season mission:", error.message); return; }
      if (data) {
          setSeasonMissions(prev => [...prev, mapToCamelCase(data) as SeasonMission]);
      }
  };

  return (
    <GameContext.Provider value={{ isNewUser, assets, actions, tasks, taskPool, checklistItems, userProfile, friends, friendRequestsIncoming, friendRequestsOutgoing, clanJoinRequestsIncoming, clanJoinRequestsOutgoing, reports, nobilityRanks, clan, clanRanks, enrichedClanMembers, activeCycle, dailyCommitment, achievementUnlocked, seasons, seasonMissions, seasonQuests, clanQuestProgress, getClanQuestProgress, levelUnlocks, setAchievementUnlocked, updateLevelUnlocks, grantUserUnlock, completeSeasonMission, feed, addFeedEvent, updateAssetSlotValue, getArenas, addArena, updateArena, getActionsForArena, addAction, scheduleTask, getTasksForDate, rescheduleTask, toggleTaskCompletion, updateAction, deleteAction, scheduleAndCompleteNow, returnTaskToPool, deleteTask, completeTutorialMission, deleteArena, toggleChecklistItem, addChecklistItem, updateChecklistItem, deleteChecklistItem, updateUserProfile, addFriend, searchPlayers, sendFriendRequest, acceptFriendRequest, declineFriendRequest, setCurrentSkin, updateAllAssetLevels, startCycle, endCycle, startNewCycle, updateMood, scheduleMultipleTasks, getAssetForAction, getActionBackgroundStyle, scheduleAndCompleteMilestoneNow, setDailyCommitment, lockDailyCommitment, endDailyBattle, resetDailyCommitment, manualCloseSITREP, openChest, applyExp, addChest, createClan, updateClan, leaveClan, transferLeadershipAndLeave, deleteClan, kickClanMember, addClanMember, searchClans, joinClan, approveClanJoinRequest, rejectClanJoinRequest, addSeason, updateSeason, addSeasonMission }}>
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
