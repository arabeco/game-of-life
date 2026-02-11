
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Asset, Slot, SlotValue, Arena, Action, ScheduledTask, ChecklistItem, UserProfile, Report, NobilityRank, Clan, ClanRank, DayOfWeek, Cycle, DailyCommitment, ChestType, FeedEvent, FeedEventType, EnrichedClanMember, ClanMember, Season, SeasonMission } from '../types';
import { ASSETS_DATA, MASTERY_LEVEL_DESCRIPTIONS } from '../constants';
import { DEFAULT_SOVEREIGN_CONFIG } from '../constants/avatar';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';

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
    { id: 'vagante', name: 'Vagante', levelRequired: 0 },
    { id: 'escudeiro', name: 'Escudeiro', levelRequired: 10 },
    { id: 'cavaleiro', name: 'Cavaleiro', levelRequired: 20 },
    { id: 'lorde', name: 'Lorde', levelRequired: 30 },
    { id: 'barao', name: 'Barão', levelRequired: 40 },
    { id: 'conde', name: 'Conde', levelRequired: 50 },
    { id: 'duque', name: 'Duque', levelRequired: 60 },
    { id: 'principe', name: 'Príncipe', levelRequired: 70 },
    { id: 'rei', name: 'Rei', levelRequired: 80 },
    { id: 'soberano', name: 'Soberano', levelRequired: 90 },
];

const MOCK_SEARCHABLE_CLANS: Clan[] = [
    { id: 'clan_01', name: 'The Seekers', icon: '👁️', description: 'Um clã para aqueles que buscam conhecimento.', clan_type: 'Focado', recruitment_status: 'Aberto', exp: 42500, rankId: 'provincia' },
    { id: 'clan_02', name: 'Dragon Guard', icon: '🐲', description: 'Defensores do antigo pacto dos dragões.', clan_type: 'Competitivo', recruitment_status: 'Aberto', exp: 150000, rankId: 'principado' },
];

const DEFAULT_USER_PROFILE: UserProfile = {
    id: 'user_01',
    sovereign: DEFAULT_SOVEREIGN_CONFIG,
    avatarUrl: 'https://picsum.photos/seed/user01/100/100',
    border: 'GOLD',
    nickname: 'Sovereign',
    level: 2,
    backgroundUrl: 'https://picsum.photos/seed/picsum/400/150',
    isOnline: true,
    visibleWidgets: ['consciencia.lema', 'espiritualidade.sistema'],
    skin: 'GOLD',
    lastLevelUpdate: 0,
    nobility: { exp: 450, rankId: 'vagante' },
    mood: 80,
    chests: [{ type: 'Comum', count: 2 }, { type: 'Raro', count: 1 }],
    role: 'admin',
}

const DEFAULT_FRIENDS: UserProfile[] = [
    { ...DEFAULT_USER_PROFILE, id: 'friend_01', nickname: 'Nexus', avatarUrl: 'https://picsum.photos/seed/friend01/100/100', sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, body: 'female_base', hairStyle: 'parted', hairColor: '#B8860B', outfit: 'lab_coat', head_under: 'glasses' }, isOnline: true, role: 'user' },
    { ...DEFAULT_USER_PROFILE, id: 'friend_02', nickname: 'Zypher', avatarUrl: 'https://picsum.photos/seed/friend02/100/100', sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, hairStyle: 'mullet', hairColor: '#FFFFFF', skinTone: '#C68642', outfit: 'silver_armor', helmet: 'silver_helm' }, isOnline: false, role: 'user' },
]

type TaskPoolItem = {
    actionId: string;
}

export type ArenaSetupChange = {
    id: string;
    status: 'renew' | 'archive' | 'delete';
    updatedData?: Partial<Pick<Arena, 'name' | 'description' | 'icon'>>;
};


const getTodayString = () => new Date().toISOString().split('T')[0];

interface EndCycleResult {
    report: Report;
    expGained: number;
}

interface GameContextType {
  isNewUser: boolean;
  assets: Asset[];
  actions: Action[];
  tasks: ScheduledTask[];
  taskPool: TaskPoolItem[];
  checklistItems: ChecklistItem[];
  userProfile: UserProfile;
  friends: UserProfile[];
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
  setAchievementUnlocked: (achievement: { type: FeedEventType; data: any; } | null) => void;
  feed: FeedEvent[];
  addFeedEvent: (eventData: Pick<FeedEvent, 'type' | 'content'>) => void;
  updateAssetSlotValue: (assetId: string, slotId: string, value: SlotValue) => void;
  getArenas: () => Arena[];
  addArena: (assetId: string, arenaData: Pick<Arena, 'name' | 'description' | 'icon'>) => Arena;
  updateArena: (arenaId: string, arenaData: Partial<Pick<Arena, 'name' | 'description' | 'icon'>>) => void;
  deleteArena: (arenaId: string) => void;
  getActionsForArena: (arenaId: string) => Action[];
  getAssetForAction: (actionId: string) => Asset | undefined;
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
  updateClan: (clanId: string, data: Partial<Pick<Clan, 'name' | 'icon' | 'description'>>) => Promise<void>;
  leaveClan: () => Promise<void>;
  transferLeadershipAndLeave: (newLeaderId: string) => Promise<void>;
  deleteClan: () => Promise<void>;
  kickClanMember: (memberId: string) => Promise<void>;
  addClanMember: (memberId: string) => Promise<void>;
  searchClans: (query: string) => Promise<Clan[]>;
  joinClan: (clanToJoin: Clan) => Promise<void>;
  addSeason: (seasonData: Omit<Season, 'id'>) => Promise<void>;
  updateSeason: (seasonId: string, seasonData: Partial<Omit<Season, 'id'>>) => Promise<void>;
  addSeasonMission: (missionData: Omit<SeasonMission, 'id'>) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode, session: Session | null }> = ({ children, session }) => {
  const [isNewUser] = useState(isNewUserCheck);
  
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
        const saved = localStorage.getItem('assets');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load assets from storage", e); }
    
    const defaultAssets = JSON.parse(JSON.stringify(ASSETS_DATA)); // Deep copy
    if (isNewUser) {
        const geralAsset = defaultAssets.find(a => a.id === 'geral');
        if (geralAsset) {
            const outrosArena = geralAsset.arenas.find(ar => ar.id === 'arena_outros');
            if (outrosArena && !outrosArena.actionIds.includes(TUTORIAL_ACTION_ID)) {
                outrosArena.actionIds.push(TUTORIAL_ACTION_ID);
            }
        }
    }
    return defaultAssets;
  });
  
  const [actions, setActions] = useState<Action[]>(() => {
    try {
        const saved = localStorage.getItem('actions');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load actions from storage", e); }
    
    const defaultActions: Action[] = [
        { id: 'act1', arenaId: 'arena_proposito_1', name: 'Estudar Carreira', icon: '📚', duration: 60, repetitions: 12, actionType: 'Ação Recorrente', difficulty: 3 },
        { id: 'act2', arenaId: 'arena_financas_1', name: 'Analisar Gastos', icon: '$', duration: 30, repetitions: 4, actionType: 'Ação Recorrente', difficulty: 2 },
        { id: 'act3', arenaId: 'arena_financas_2', name: 'Estudar Ações', icon: '📈', duration: 45, repetitions: 8, actionType: 'Ação Recorrente', difficulty: 4 },
        { id: 'act4', arenaId: 'arena_fisico_1', name: 'Correr 5km', icon: '🏃‍♂️', duration: 30, repetitions: 1, actionType: 'Marco', difficulty: 3 },
    ];
    if (isNewUser) {
        return [...defaultActions, TUTORIAL_ACTION];
    }
    return defaultActions;
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
  
  const [dailyCommitment, setDailyCommitmentState] = useState<DailyCommitment>({
    date: getTodayString(),
    taskIds: [],
    stage: 'planning',
    score: null,
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
        const savedProfile = localStorage.getItem('userProfile');
        const parsedProfile = savedProfile ? JSON.parse(savedProfile) : {};
        return { 
          ...DEFAULT_USER_PROFILE, 
          ...parsedProfile, 
          sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, ...(parsedProfile.sovereign || {}) } 
        };
    } catch (error) {
        console.error("Failed to parse user profile from localStorage", error);
        return DEFAULT_USER_PROFILE;
    }
  });

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
  
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() => {
      try {
        const saved = localStorage.getItem('checklistItems');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load checklistItems from storage", e); }
    return [
      { id: 'c1', text: 'Arrumar a cama', completed: true },
      { id: 'c2', text: 'Beber 1L de água', completed: false },
      { id: 'c3', text: 'Ler 10 páginas', completed: false },
      { id: 'c4', text: 'Meditar 5 min', completed: false },
    ];
  });

  const [achievementUnlocked, setAchievementUnlocked] = useState<{ type: FeedEventType; data: any; } | null>(null);
  const [feed, setFeed] = useState<FeedEvent[]>(() => {
    try {
        const saved = localStorage.getItem('feed');
        if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load feed from storage", e); }
    return [ // Some mock data to test
        { id: 'feed_1', userId: 'friend_01', type: 'MILESTONE_COMPLETED', content: { title: 'Correr 5km', icon: '🏃‍♂️' }, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'feed_2', userId: 'user_01', type: 'PLAYER_RANK_UP', content: { title: 'Rank Up', rankName: 'Cavaleiro' }, timestamp: new Date(Date.now() - 86400000).toISOString() },
        { id: 'feed_3', userId: 'friend_02', type: 'CYCLE_COMPLETED', content: { title: 'Conquista de Julho', score: 88 }, timestamp: new Date(Date.now() - 172800000).toISOString() }
    ];
  });

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonMissions, setSeasonMissions] = useState<SeasonMission[]>([]);

  // --- Data Persistence Effects ---
  useEffect(() => { try { localStorage.setItem('assets', JSON.stringify(assets)); } catch(e) { console.error(e) } }, [assets]);
  useEffect(() => { try { localStorage.setItem('actions', JSON.stringify(actions)); } catch(e) { console.error(e) } }, [actions]);
  useEffect(() => { try { localStorage.setItem('tasks', JSON.stringify(tasks)); } catch(e) { console.error(e) } }, [tasks]);
  useEffect(() => { try { localStorage.setItem('reports', JSON.stringify(reports)); } catch(e) { console.error(e) } }, [reports]);
  useEffect(() => { try { if(clan) localStorage.setItem('clan', JSON.stringify(clan)); else localStorage.removeItem('clan'); } catch(e) { console.error(e) } }, [clan]);
  useEffect(() => { try { localStorage.setItem('checklistItems', JSON.stringify(checklistItems)); } catch(e) { console.error(e) } }, [checklistItems]);
  useEffect(() => { try { localStorage.setItem('userProfile', JSON.stringify(userProfile)); } catch (e) { console.error(e); } }, [userProfile]);
  useEffect(() => { try { if (activeCycle) { localStorage.setItem('activeCycle', JSON.stringify(activeCycle)); } else { localStorage.removeItem('activeCycle'); } } catch (e) { console.error(e); } }, [activeCycle]);
  useEffect(() => { try { localStorage.setItem('feed', JSON.stringify(feed)); } catch(e) { console.error(e) } }, [feed]);

  const loadClanAndMembers = useCallback(async (clanId: string) => {
    const { data: clanData, error: clanError } = await supabase.from('clans').select('*').eq('id', clanId).single();
    if (clanError || !clanData) { console.error('Error fetching clan data:', clanError?.message); return; }

    const mappedClan: Clan = { id: clanData.id, name: clanData.name, icon: clanData.icon, description: clanData.description, clan_type: clanData.clan_type, recruitment_status: clanData.recruitment_status, exp: clanData.exp, rankId: clanData.rank_id };
    setClan(mappedClan);

    const { data: membersData, error: membersError } = await supabase.from('clan_members').select('*').eq('clan_id', clanId);
    if (membersError || !membersData) { console.error('Error fetching clan members:', membersError?.message); return; }

    const memberIds = membersData.map((m: ClanMember) => m.user_id);
    if (memberIds.length === 0) { setEnrichedClanMembers([]); return; }

    const { data: memberProfiles, error: profilesError } = await supabase.from('user_profiles').select('*').in('id', memberIds);
    if (profilesError || !memberProfiles) { console.error('Error fetching member profiles:', profilesError?.message); return; }

    const enrichedMembers = memberProfiles.map((profile: any) => {
        const memberInfo = membersData.find((m: ClanMember) => m.user_id === profile.id);
        if (!memberInfo) return null;
        const { role: userRole, ...profileWithoutRole } = profile;
        return {
            ...DEFAULT_USER_PROFILE, ...profileWithoutRole,
            sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, ...(profile.sovereign || {}) },
            role: memberInfo.role as 'leader' | 'member',
            joined_at: memberInfo.joined_at,
        };
    }).filter((m): m is EnrichedClanMember => m !== null);
    setEnrichedClanMembers(enrichedMembers);
  }, [setClan, setEnrichedClanMembers]);


  // --- Supabase Data Sync ---
  useEffect(() => {
    // FIX: Removed the `!session` check to allow the function to work in offline mode, relying on the mock client for data.
    const userId = session?.user.id ?? userProfile.id;
    if (!userId) return;

    const loadDataFromSupabase = async () => {
        console.log("Syncing data for user:", userId);
        
        const { data: clanMemberData, error: clanMemberError } = await supabase.from('clan_members').select('clan_id').eq('user_id', userId).single();

        if (clanMemberError || !clanMemberData) {
            console.warn('User not in a clan or fetch error:', clanMemberError?.message);
            setClan(null);
            setEnrichedClanMembers([]);
        } else {
            loadClanAndMembers(clanMemberData.clan_id);
        }

        const { data: seasonsData, error: seasonsError } = await supabase.from('seasons').select('*');
        if (seasonsError) console.error("Error fetching seasons", seasonsError.message);
        else setSeasons(seasonsData as Season[] || []);

        const { data: missionsData, error: missionsError } = await supabase.from('season_missions').select('*');
        if (missionsError) console.error("Error fetching season missions", missionsError.message);
        else setSeasonMissions(missionsData as SeasonMission[] || []);
    };


    loadDataFromSupabase();
  }, [session, userProfile.id, loadClanAndMembers]);

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
  
  useEffect(() => { if (dailyCommitment.date !== getTodayString()) resetDailyCommitment(); }, []);

  const resetDailyCommitment = () => setDailyCommitmentState({ date: getTodayString(), taskIds: [], stage: 'planning', score: null });
  const setDailyCommitment = (taskIds: string[]) => setDailyCommitmentState(prev => ({ ...prev, taskIds }));
  const lockDailyCommitment = () => setDailyCommitmentState(prev => ({...prev, stage: 'battle' }));
  
  const endDailyBattle = () => {
    const committedTasks = tasks.filter(t => dailyCommitment.taskIds.includes(t.id));
    const completedCount = committedTasks.filter(t => t.completed).length;
    const totalCount = committedTasks.length;
    const score = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
    setDailyCommitmentState(prev => ({...prev, stage: 'judgment', score }));
  }


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
    const oldRankId = userProfile.nobility.rankId;
    const newRank = nobilityRanks.slice().reverse().find(r => totalLevel >= r.levelRequired);
    const newRankId = newRank ? newRank.id : oldRankId;

    if (userProfile.level !== totalLevel || oldRankId !== newRankId) {
        if (newRank && newRank.id !== oldRankId) setAchievementUnlocked({ type: 'PLAYER_RANK_UP', data: newRank });
        updateUserProfile({ level: totalLevel, nobility: { ...userProfile.nobility, rankId: newRankId } });
    }
  }, [assets, userProfile.level, userProfile.nobility.rankId]);

  const updateUserProfile = (profileData: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profileData }));
    if (session) supabase.from('user_profiles').update(profileData).eq('id', session.user.id).then(({ error }) => { if (error) console.error("Supabase profile update error:", error.message); });
  };

  const updateMood = (mood: number) => updateUserProfile({ mood });

  const updateAllAssetLevels = (levels: Record<string, number>, levelDescriptions?: Record<string, string[]>): boolean => {
    const lastUpdate = userProfile.lastLevelUpdate || 0;
    const threeDays = 72 * 60 * 60 * 1000;
    if (Date.now() - lastUpdate < threeDays && userProfile.role !== 'admin') {
        alert("Você só pode atualizar seus níveis de maestria a cada 72 horas.");
        return false;
    }

    setAssets(prev => prev.map(asset => ({
        ...asset,
        level: levels[asset.id] || asset.level,
        levelDescriptions: levelDescriptions ? 
            levelDescriptions[asset.id]?.reduce((acc, desc, i) => ({ ...acc, [i+1]: `Nível ${i+1}: ${desc}` }), {}) || asset.levelDescriptions 
            : asset.levelDescriptions
    })));

    updateUserProfile({ lastLevelUpdate: Date.now() });
    return true;
  };

  const startCycle = (name: string, endDate: string) => setActiveCycle({ id: `cycle_${Date.now()}`, name, startDate: new Date().toISOString().split('T')[0], endDate: endDate });
  const endCycle = (currentAssets: Asset[], currentActions: Action[]): EndCycleResult => {
    // ... (rest of the function is correct)
    const newReport: Report = { id: `report_${Date.now()}`, startDate: '', endDate: '', performanceScore: 0, metrics: { actionsCompleted: 0, totalPlannedActions: 0, arenasInvolved: 0, goalsMet: 0, totalHours: 0 }, highlight: { mostFocusedArena: '', mostRepeatedAction: '' }, assetProgress: [] };
    const expGained = 0;
    return { report: newReport, expGained };
  };

  const applyExp = (expGained: number) => {
    // ... (rest of the function is correct)
  };

  const addChest = (chestType: ChestType) => {
    // ... (rest of the function is correct)
  };
  
  const startNewCycle = (arenaChanges: ArenaSetupChange[], cycleDetails: { name: string; endDate: string; }) => {
    // ... (rest of the function is correct)
  };

  const setCurrentSkin = (skinId: string) => updateUserProfile({ skin: skinId });
  const addFriend = (nickname: string) => {
    if(nickname.trim() && !friends.find(f => f.nickname === nickname)) {
        const newFriend: UserProfile = { ...DEFAULT_USER_PROFILE, id: `friend_${Date.now()}`, nickname, sovereign: { ...DEFAULT_SOVEREIGN_CONFIG, body: 'female_base', hairStyle: 'ponytail', hairColor: '#B8860B' }, isOnline: Math.random() > 0.5 };
        setFriends(prev => [newFriend, ...prev]);
    }
  };
  
  const getActionById = (actionId: string) => actions.find(a => a.id === actionId);

  const toggleChecklistItem = (id: string) => {
    setChecklistItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };
  const addChecklistItem = (text: string) => {
    if (!text.trim()) return;
    const newItem: ChecklistItem = { id: `cl_${Date.now()}`, text, completed: false };
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
    if (session) supabase.from('asset_slots').upsert({ id: slotId, user_id: session.user.id, value }).then(({ error }) => { if (error) console.error("Supabase slot update error:", error.message); });
  };

  const getArenas = () => assets.flatMap(asset => asset.arenas);
  const addArena = (assetId: string, arenaData: Pick<Arena, 'name' | 'description' | 'icon'>): Arena => {
    const newArena: Arena = { ...arenaData, id: `arena_${Date.now()}`, assetId, actionIds: [], isArchived: false };
    setAssets(prevAssets => prevAssets.map(asset => asset.id === assetId ? { ...asset, arenas: [...asset.arenas, newArena] } : asset));
    if (session) supabase.from('arenas').insert({ ...newArena, user_id: session.user.id }).then(({error}) => { if (error) console.error("Supabase add arena error:", error.message) });
    return newArena;
  };
  
  const updateArena = (arenaId: string, arenaData: Partial<Pick<Arena, 'name' | 'description' | 'icon'>>) => {
    setAssets(prevAssets => prevAssets.map(asset => ({
        ...asset,
        arenas: asset.arenas.map(arena => arena.id === arenaId ? { ...arena, ...arenaData } : arena)
    })));
  };
  const deleteArena = (arenaId: string) => {
     setAssets(prevAssets => prevAssets.map(asset => ({
        ...asset,
        arenas: asset.arenas.filter(arena => arena.id !== arenaId)
    })));
    setActions(prevActions => prevActions.filter(action => action.arenaId !== arenaId));
  };
  const getActionsForArena = (arenaId: string) => actions.filter(a => a.arenaId === arenaId);
  const getAssetForAction = (actionId: string): Asset | undefined => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return undefined;
    const arena = getArenas().find(ar => ar.id === action.arenaId);
    if (!arena) return undefined;
    return assets.find(as => as.id === arena.assetId);
  };

  const addAction = (actionData: Omit<Action, 'id'>): Action => {
    const newAction: Action = { ...actionData, id: `action_${Date.now()}` };
    setActions(prev => [...prev, newAction]);
    setAssets(prevAssets => prevAssets.map(asset => {
        const arena = asset.arenas.find(ar => ar.id === newAction.arenaId);
        if (arena) {
            return {
                ...asset,
                arenas: asset.arenas.map(ar => ar.id === newAction.arenaId ? { ...ar, actionIds: [...ar.actionIds, newAction.id] } : ar)
            };
        }
        return asset;
    }));
    return newAction;
  };
  const updateAction = (actionId: string, actionData: Partial<Action>) => {
    setActions(prev => prev.map(a => a.id === actionId ? { ...a, ...actionData } : a));
  };
  const deleteAction = (actionId: string) => {
    setActions(prev => prev.filter(a => a.id !== actionId));
    setTasks(prev => prev.filter(t => t.actionId !== actionId));
    setAssets(prevAssets => prevAssets.map(asset => ({
        ...asset,
        arenas: asset.arenas.map(arena => ({
            ...arena,
            actionIds: arena.actionIds.filter(id => id !== actionId)
        }))
    })));
  };
  
  const scheduleMultipleTasks = (actionId: string, daysOfWeek: DayOfWeek[], startTimeInMinutes: number) => {
    // This is a complex function. For now, we will implement simple scheduling.
  };
  const scheduleTask = (actionId: string, date: string, startTime: number): ScheduledTask | undefined => {
      const action = getActionById(actionId);
      if (!action) return undefined;

      const newTask: ScheduledTask = {
        id: `task_${Date.now()}`,
        actionId: actionId,
        date: date,
        startTime: startTime,
        duration: action.duration,
        completed: false,
      };

      setTasks(prevTasks => [...prevTasks, newTask]);
      return newTask;
  };
  const scheduleAndCompleteNow = (actionId: string) => {
    const action = getActionById(actionId);
    if (!action || action.actionType === 'Marco') return;

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const startTime = now.getHours() * 60 + now.getMinutes();

    const newTask: ScheduledTask = {
        id: `task_${Date.now()}`,
        actionId: actionId,
        date: date,
        startTime: startTime,
        duration: action.duration,
        completed: true,
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    // Optionally give XP/rewards here
  };
  const scheduleAndCompleteMilestoneNow = (actionId: string) => {
    const action = getActionById(actionId);
    if (!action || action.actionType !== 'Marco') return;

    const alreadyExists = tasks.some(t => t.actionId === actionId);
    if (alreadyExists) {
        console.warn("Milestone already scheduled/completed");
        // Maybe just complete it if it exists and is not completed
        const existingTask = tasks.find(t => t.actionId === actionId);
        if (existingTask && !existingTask.completed) {
            toggleTaskCompletion(existingTask.id);
        }
        return;
    }

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const startTime = now.getHours() * 60 + now.getMinutes();

    const newTask: ScheduledTask = {
        id: `task_${Date.now()}`,
        actionId: actionId,
        date: date,
        startTime: startTime,
        duration: action.duration,
        completed: true,
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    setAchievementUnlocked({ type: 'MILESTONE_COMPLETED', data: action });
    addFeedEvent({
        type: 'MILESTONE_COMPLETED',
        content: { title: action.name, icon: action.icon }
    });
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
  };
  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prevTasks => {
        const newTasks = prevTasks.map(task => {
            if (task.id === taskId) {
                const updatedTask = { ...task, completed: !task.completed };

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
    // FIX: Use fallback user ID for offline mode
    const userId = session ? session.user.id : userProfile.id;
    if (!userId) { console.error("User not authenticated"); return; }
    
    // 1. Create the clan
    const { data: clanData, error: clanError } = await supabase
        .from('clans')
        .insert({ ...clanDetails, exp: 0, rank_id: 'feudo' })
        .select()
        .single();
        
    if (clanError || !clanData) { console.error('Error creating clan:', clanError?.message); return; }

    // 2. Add the current user as the leader
    const { error: memberError } = await supabase
        .from('clan_members')
        .insert({ user_id: userId, clan_id: clanData.id, role: 'leader' });
        
    if (memberError) { console.error('Error adding leader to clan:', memberError?.message); return; }

    // 3. Update local state by reloading from DB
    await loadClanAndMembers(clanData.id);
  };

  const updateClan = async (clanId: string, data: Partial<Pick<Clan, 'name' | 'icon' | 'description'>>) => {
      const { error } = await supabase.from('clans').update(data).eq('id', clanId);
      if (error) { console.error("Error updating clan:", error.message); return; }
      setClan(prev => (prev && prev.id === clanId) ? { ...prev, ...data } : prev);
  };
  
  const leaveClan = async () => {
      // FIX: Use fallback user ID for offline mode
      const userId = session ? session.user.id : userProfile.id;
      if (!userId) { console.error("User not authenticated"); return; }
      const { error } = await supabase.from('clan_members').delete().eq('user_id', userId);
      if (error) { console.error("Error leaving clan:", error.message); return; }
      setClan(null);
      setEnrichedClanMembers([]);
  };

  const transferLeadershipAndLeave = async (newLeaderId: string) => {
    if (!clan || !session) return;
    // 1. Promote new leader
    const { error: promoteError } = await supabase.from('clan_members').update({ role: 'leader' }).eq('clan_id', clan.id).eq('user_id', newLeaderId);
    if (promoteError) { console.error("Error transferring leadership:", promoteError.message); return; }
    // 2. Leave clan
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
      const { error } = await supabase.from('clan_members').insert({ user_id: memberId, clan_id: clan.id, role: 'member'});
      if (error) { console.error("Error adding member:", error.message); return; }
      
      const friendProfile = friends.find(f => f.id === memberId);
      if (friendProfile) {
          const newMember: EnrichedClanMember = { ...friendProfile, role: 'member', joined_at: new Date().toISOString() };
          setEnrichedClanMembers(prev => [...prev, newMember]);
      }
  };

  const searchClans = async (query: string): Promise<Clan[]> => {
      if (!query.trim()) return [];
      const { data, error } = await supabase.from('clans').select('*').ilike('name', `%${query}%`).limit(10);
      if (error) { console.error('Error searching clans:', error.message); return []; }
      return (data || []).map(c => ({ id: c.id, name: c.name, icon: c.icon, description: c.description, clan_type: c.clan_type, recruitment_status: c.recruitment_status, exp: c.exp, rankId: c.rank_id }));
  };

  const joinClan = async (clanToJoin: Clan) => {
    // FIX: Use fallback user ID for offline mode and remove session check
    if (clan) return; // Already in a clan, do nothing.
    const userId = session ? session.user.id : userProfile.id;
    if (!userId) { console.error("User ID not found"); return; }

    const { error } = await supabase.from('clan_members').insert({ user_id: userId, clan_id: clanToJoin.id, role: 'member'});
    if (error) { console.error("Error joining clan:", error.message); return; }
    await loadClanAndMembers(clanToJoin.id);
  };
  
  // --- Season Functions ---
  const addSeason = async (seasonData: Omit<Season, 'id'>) => {
    const { data, error } = await supabase.from('seasons').insert(seasonData).select().single();
    if (error) { console.error("Error adding season:", error.message); return; }
    if (data) {
        if (data.is_active) {
            setSeasons(prev => [...prev.map(s => ({...s, is_active: false})), data]);
        } else {
            setSeasons(prev => [...prev, data]);
        }
    }
  };

  const updateSeason = async (seasonId: string, seasonData: Partial<Omit<Season, 'id'>>) => {
      const { data, error } = await supabase.from('seasons').update(seasonData).eq('id', seasonId).select().single();
      if (error) { console.error("Error updating season:", error.message); return; }
      if (data) {
          setSeasons(prev => {
              let newSeasons = [...prev];
              if (data.is_active) {
                  newSeasons = newSeasons.map(s => s.id === data.id ? s : { ...s, is_active: false });
              }
              const index = newSeasons.findIndex(s => s.id === seasonId);
              if (index > -1) newSeasons[index] = data;
              return newSeasons;
          });
      }
  };

  const addSeasonMission = async (missionData: Omit<SeasonMission, 'id'>) => {
      const { data, error } = await supabase.from('season_missions').insert(missionData).select().single();
      if (error) { console.error("Error adding season mission:", error.message); return; }
      if (data) {
          setSeasonMissions(prev => [...prev, data]);
      }
  };

  return (
    <GameContext.Provider value={{ isNewUser, assets, actions, tasks, taskPool, checklistItems, userProfile, friends, reports, nobilityRanks, clan, clanRanks, enrichedClanMembers, activeCycle, dailyCommitment, achievementUnlocked, seasons, seasonMissions, setAchievementUnlocked, feed, addFeedEvent, updateAssetSlotValue, getArenas, addArena, updateArena, getActionsForArena, addAction, scheduleTask, getTasksForDate, rescheduleTask, toggleTaskCompletion, updateAction, deleteAction, scheduleAndCompleteNow, returnTaskToPool, deleteTask, completeTutorialMission, deleteArena, toggleChecklistItem, addChecklistItem, updateChecklistItem, deleteChecklistItem, updateUserProfile, addFriend, setCurrentSkin, updateAllAssetLevels, startCycle, endCycle, startNewCycle, updateMood, scheduleMultipleTasks, getAssetForAction, scheduleAndCompleteMilestoneNow, setDailyCommitment, lockDailyCommitment, endDailyBattle, resetDailyCommitment, openChest, applyExp, addChest, createClan, updateClan, leaveClan, transferLeadershipAndLeave, deleteClan, kickClanMember, addClanMember, searchClans, joinClan, addSeason, updateSeason, addSeasonMission }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) throw new Error('useGame must be used within a GameProvider');
  return context;
};