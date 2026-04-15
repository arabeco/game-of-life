import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
import { Asset, Arena, ArenaFolder, Action, ScheduledTask, ChecklistItem, SequenceItem, UserProfile, ProfileVisibilityScope, Report, NobilityRank, Clan, ClanJoinRequest, ClanRank, DayOfWeek, Cycle, DailyCommitment, DailyCommitmentStage, ChestType, FeedEvent, FeedEventType, EnrichedClanMember, ClanMember, Season, SeasonMission, SeasonQuest, FriendRequest, LevelUnlocks, UnlockCategory, UserUnlocks, InventoryItem, UserWallet, OraclePreferences, OracleMessage, OracleMode, OracleCategory, Notification, AldeiaSlot, AldeiaPresence, AldeiaSlotId, Campaign, AppMode, ThemePreference, ArenasViewMode, CodexSharePreview, DirectMessage, DMConversation, ItemRarity, ChestOpenResult, RelationshipLinkType, RelationshipLinkInvite, RelationshipLink, RelationshipCapacitySummary, RelationshipCapacitySlotType, RelationshipInviteAction, LinkedRelationshipArena, RelationshipCompetitionChallenge, RewardModalPayload, UserBlock, ModerationReportInput } from '../types';
import { ASSETS_DATA, MASTERY_LEVEL_DESCRIPTIONS, MAX_CLAN_MEMBERS, GM_CONFIG, SEASONS, ACTIVE_SEASON_ID, buildDefaultLevelUnlocks, DEFAULT_SOVEREIGN_CONFIG } from '../constants';
import { ITEMS_DB, GOLD_PACKS, CODEXES, ItemCategory, ItemDef, resolveItemDef, getCatalogItemsByCategory, isChestEligibleItem, isItemCatalogVisible } from '../constants/items';
import { getGoldBoostProduct, getGoldMechanicPrice, getGoldMembershipProduct, GOLD_CLAN_CREATION_COST, GOLD_PREMIUM_PRODUCT } from '../constants/goldCatalog';

import { BIOLOGICAL_MACHINE_CODEX } from '../data/initialCodex';
import { NOBILITY_RANKS, RANK_REWARDS } from '../constants/nobility';
import { supabase } from '../supabaseClient';
import { deriveLegacySentinelMode, getOracleModeConfig, ORACLE_MODES } from '../constants/oracle';
import { SupabaseService } from '../services/SupabaseService';
import { rateLimiter } from '../services/SimpleRateLimiter';
import type { Session } from '@supabase/supabase-js';
import { useCodexBuilder } from './CodexBuilderContext';
import { calculateArenaProgress, getCampaignArenaStates } from '../utils/progressUtils';
import { createTaskDomain } from './gameDomains/taskDomain';
import { useQuestSharedDomain } from './gameDomains/questSharedDomain';
import { buildCyclePaceMetrics, buildTaskPoolEntries, filterCycleTasksByScope, getInitialDailyCommitmentTaskIds } from '../utils/coreLoopUtils.js';
import { buildFairScoreFromTasks, recalculateReportsWithFairScore } from '../utils/fairScoreUtils.js';
import { buildCycleWeeklyAtlas } from '../utils/reportAtlasUtils.js';
import { getOracleFeedMessagesForOperationalDay, getOracleFeedQuotaStatus, isManualOracleFeedMessage } from '../utils/oracleFeedUtils';
import { getArenaDomainFlags, isClanQuestAction, isOfficeArena, isQuestAction, isQuestArena, looksLikeClanQuestArena, normalizeDomainLabel } from '../utils/taskDomain.js';
import { getInstallPrompt, promptForInstall, startInstallPromptCapture, subscribeInstallPrompt } from '../utils/installPrompt';
import { buildCodexTemplateFromDraft, getCodexLevelDisplayTitle } from '../utils/codexPreview';
import { parseBooleanEnvFlag } from '../utils/envFlags';
import { getExpBoostMultiplier, getNextExpBoostExpiryAt, hasActiveExpBoost } from '../utils/expBoostAccess';
import { formatLocalDateString, getOperationalDateString as getOperationalDateStringValue, getTaskOperationalDateString, shiftLocalDateString, taskMatchesOperationalDate } from '../utils/operationalDay.js';
import { getNextPremiumExpiryAt, hasPremiumAccess, isPremiumActive, normalizeSubscriptionTier } from '../utils/premiumAccess';
import { buildArenaLimitMessage, getArenaCapacitySummary } from '../utils/arenaCapacity';
import { resolveUiSkinId } from '../utils/uiSkinTokens';
import { emitArenaAttention } from '../utils/arenaAttention';
import { emitDailyCompletionPrompt } from '../utils/dailyCompletionPrompt';
import { emitAppSensoryCue } from '../utils/sensoryCue';
import { getSeasonLaunchRewardFlag, getSeasonLaunchToastStorageKey, resolveRuntimeActiveSeason, resolveSeasonConfigForSeason } from '../utils/seasonPresentation';
import { showLocalNotification } from '../utils/localNotification';
import { hasAppPushRemoteDeliveryReady, syncAppPushRegistration } from '../utils/pushRuntime';
import { getNotificationBody, getNotificationTitle, getVisibleNotificationsForProfile, shouldPushNotificationForProfile } from '../constants/oracleNotificationPolicy';
import { buildOracleOperationalContext } from '../utils/oracleOperationalContext';
import { resolveTemplateCampaignMeta } from '../utils/campaignCatalogMeta';

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

const normalizeActionFromDbRow = (row: any): Action => {
    const action = mapToCamelCase(row) as Action;
    const schedule = (action.context && typeof action.context === 'object')
        ? (action.context as Action['context'])?.schedule
        : undefined;

    const rawDifficulty = Number.isFinite(action.difficulty) ? Number(action.difficulty) : 2;
    const normalizedDifficulty = Math.min(3, Math.max(0, Math.round(rawDifficulty)));

    return {
        ...action,
        difficulty: normalizedDifficulty,
        scheduledDays: action.scheduledDays ?? schedule?.days,
        scheduledStartTime: action.scheduledStartTime ?? schedule?.startTime,
    };
};

const normalizeActionDifficulty = (value?: number | null): 0 | 1 | 2 | 3 => {
    const numeric = Number.isFinite(value) ? Number(value) : 2;
    return Math.min(3, Math.max(0, Math.round(numeric))) as 0 | 1 | 2 | 3;
};

const getActionExpMultiplier = (action?: Pick<Action, 'difficulty'> | null): number => {
    switch (normalizeActionDifficulty(action?.difficulty)) {
        case 0:
            return 0;
        case 2:
            return 1.05;
        case 3:
            return 1.1;
        case 1:
        default:
            return 1;
    }
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const getLocalDateString = (date: Date = new Date()) => formatLocalDateString(date);
export const getOperationalDateString = (date: Date = new Date()) => getOperationalDateStringValue(date);


const TUTORIAL_ACTION_ID = 'action_tutorial_01';

export const STORAGE_KEY_PROFILE = 'gol_user_profile_v2';
export const STORAGE_KEY_ASSET_LEVELS = 'gol_asset_levels_v2';
export const STORAGE_KEY_CAMPAIGNS = 'gol_campaigns_v2';

export const PROFILE_FLAG_TERMS_ACCEPTED = '__flag_terms_accepted_v1';
export const PROFILE_FLAG_TERMS_PENDING = '__flag_terms_pending_v1';
export const PROFILE_FLAG_TUTORIAL_COMPLETED = '__flag_tutorial_completed_v1';
const ACTION_REMINDER_RECHECK_MS = 60 * 1000;
const ACTION_REMINDER_LATE_GRACE_MS = 15 * 60 * 1000;

const TUTORIAL_ACTION: Action = {
    id: TUTORIAL_ACTION_ID,
    arenaId: 'arena_outros',
    name: 'MissÃ£o: Concluir Tutorial de IniciaÃ§Ã£o',
    icon: 'ðŸ“',
    duration: 15,
    repetitions: 1,
    actionType: 'Marco',
    difficulty: 1,
};

const isNewUserCheck = () => true;

const CLAN_RANKS: ClanRank[] = [
    { id: 'feudo', name: 'Feudo', expRequired: 0 },
    { id: 'bastiao', name: 'BastiÃ£o', expRequired: 10000 },
    { id: 'provincia', name: 'ProvÃ­ncia', expRequired: 50000 },
    { id: 'principado', name: 'Principado', expRequired: 150000 },
    { id: 'reino', name: 'Reino', expRequired: 400000 },
    { id: 'dinastia', name: 'Dinastia', expRequired: 1000000 },
    { id: 'imperio', name: 'ImpÃ©rio', expRequired: 2500000 },
];


const normalizeAssetsVisibilityScope = (value: unknown): ProfileVisibilityScope => {
    if (value === 'all' || value === 'friends' || value === 'nobody') return value;
    return 'nobody';
};

const normalizeMasteryVisibilityScope = (value: unknown): ProfileVisibilityScope => {
    if (value === 'all' || value === 'friends' || value === 'nobody') return value;
    return 'friends';
};

const normalizeFeatsVisibilityScope = (value: unknown): ProfileVisibilityScope => {
    if (value === 'all' || value === 'friends' || value === 'nobody') return value;
    return 'friends';
};

const normalizeSequenceItems = (value: unknown): SequenceItem[] => {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is SequenceItem => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string'))
        .map((item) => ({
            id: item.id,
            title: item.title.trim(),
            days: Number.isFinite(item.days) ? Math.max(0, Math.round(item.days)) : 0,
            lastMarkedDate: typeof item.lastMarkedDate === 'string' ? item.lastMarkedDate : null,
            updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
        }))
        .filter((item) => item.title.length > 0);
};

const DEFAULT_USER_PROFILE: UserProfile = {
    id: 'placeholder_user',
    nickname: 'Soberano',
    username: 'soberano',
    level: 1,
    avatarUrl: '',
    border: 'default',
    backgroundUrl: '',
    isOnline: false,
    visibleWidgets: [],
    sequenceItems: [],
    assetArtById: {},
    assetWidgetValues: {},
    assetsVisibility: 'nobody',
    masteryVisibility: 'friends',
    featsVisibility: 'friends',
    sovereign: DEFAULT_SOVEREIGN_CONFIG,
    nobility: { exp: 0, rankId: 'vagante' },
    mood: 50,
    role: 'user',
    isPremium: false,
    premiumExpiresAt: null,
    subscriptionTier: null,
    premiumRewardPending: false,
    premiumRewardPayload: null,
    legacyProjectionSceneCredits: 0,
    campaignQuizFreeCredits: 0,
    campaignQuizMediumCredits: 0,
    expBoostMultiplier: null,
    expBoostExpiresAt: null,
    expBoostProductId: null,
    skin: 'BASIC',
    unlockedSkins: { BASIC: true },
    inventory: [],
    wallet: { gold: 0, fragments: 0 },
    codexCreationSlotsPurchased: 0,
    partnershipSlotsPurchased: 0,
    competitionSlotsPurchased: 0,
    mentorSlotsPurchased: 0,
    linkedArenaSlotsPurchased: 0,
    starterRewardsPending: false,
    vanguardWelcomePending: false,
    vanguardWelcomePayload: null,
    unlockedItems: {
        bodyStyles: {},
        hairStyles: {},
        outfits: {},
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
        insignias: {},
        ui_skins: { BASIC: true },
    },
    completedSeasonMissions: []
};

const defaultChecklistItems: ChecklistItem[] = [];
const defaultSequenceItems: SequenceItem[] = [];
const PREMIUM_REWARD_CHEST: ChestType = 'Raro';
const PLATINUM_REWARD_CHESTS: ChestType[] = ['Season', 'Raro'];
const PLATINUM_REWARD_LEGACY_SCENE_CREDITS = 1;
const MEMBERSHIP_REWARD_CAMPAIGN_QUIZ_FREE_CREDITS = 1;
const MEMBERSHIP_REWARD_CAMPAIGN_QUIZ_MEDIUM_CREDITS = 1;
const PREMIUM_ACTIVE_BENEFITS = [
    'Até 15 arenas ativas',
    'Fundos premium de perfil e ativos',
    'Todos os modos do Oráculo',
    'Cena do legado com 50% off',
    'Bônus de legado +10% XP',
] as const;
const PLATINUM_ACTIVE_BENEFITS = [
    'Todas as vantagens do Premium',
    'Até 30 arenas ativas',
    'Todos os planos de fundo e aparências premium',
] as const;

const formatPremiumExpiryLabel = (expiresAt: string): string => {
    const parsed = new Date(expiresAt);
    if (Number.isNaN(parsed.getTime())) return '30 dias ativos';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(parsed);
};

type TaskPoolItem = {
    actionId: string;
    unlimited?: boolean;
}

export type ArenaSetupChange = {
    id: string;
    status: 'renew' | 'archive' | 'delete';
    updatedData?: Partial<Pick<Arena, 'name' | 'description' | 'icon'>>;
};


const getTodayString = () => getOperationalDateString();
const SITREP_BONUS_A = 60;
const SITREP_BONUS_S = 120;
const PARTNERSHIP_LINKED_ARENA_GOLD_COST = getGoldMechanicPrice('partnership_linked_arena', 50);
const COMPETITION_DUEL_GOLD_COST = getGoldMechanicPrice('competition_challenge', 50);
const MAX_VILLAGE_BONUS_PERCENT = 0.10; // 10% max bonus from Sanctuary Order

const createDefaultDailyCommitment = (): DailyCommitment => ({
    date: getTodayString(),
    taskIds: [],
    stage: 'planning',
    score: null,
    expDeposited: null,
    sitrepBonus: null,
    relationshipBonusXp: null,
    operationalScratch: null,
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

const normalizeArenasViewMode = (value: unknown): ArenasViewMode => {
    if (value === 'free' || value === 'priorities' || value === 'assets') return value;
    if (value === 'asset' || value === 'by_asset' || value === 'byAsset') return 'assets';
    return 'free';
};

const mapFeedEventFromDbRow = (row: any): FeedEvent => ({
    id: String(row.id),
    userId: String(row.user_id ?? row.userId),
    type: row.event_type ?? row.eventType,
    authorNickname: row.author_nickname ?? row.authorNickname ?? undefined,
    authorAvatarUrl: row.author_avatar_url ?? row.authorAvatarUrl ?? undefined,
    authorClanName: row.author_clan_name ?? row.authorClanName ?? undefined,
    authorClanIcon: row.author_clan_icon ?? row.authorClanIcon ?? undefined,
    content: mapToCamelCase(row.content || {}) as FeedEvent['content'],
    timestamp: row.created_at ?? row.createdAt ?? new Date().toISOString(),
});

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
    author: string | null;
    price: number | null;
    template: any;
    created_at: string;
    catalog_id?: string | null;
    schema_version?: string | null;
    is_public?: boolean | null;
    source_type?: 'created' | 'catalog' | 'gift_link' | 'gift_in_app';
    origin_codex_id?: string | null;
    created_by_user_id?: string | null;
    raw_template?: any;
}

type OracleTriggerStatus =
    | 'generated'
    | 'disabled'
    | 'quiet_hours'
    | 'cooldown'
    | 'daily_limit'
    | 'premium_required'
    | 'skipped'
    | 'error';

type OracleTriggerResult = {
    status: OracleTriggerStatus;
    message?: OracleMessage;
    autoDailyTarget?: number;
    autoSentToday?: number;
    autoRemainingToday?: number;
    manualDailyTarget?: number;
    manualSentToday?: number;
    manualRemainingToday?: number;
    cooldownMs?: number;
};

const ORACLE_INTEL_CATEGORIES = new Set<OracleCategory>([
    'dicas_produtividade',
    'provocacoes',
    'analise_padroes',
]);

const ORACLE_MANUAL_LIBRARY_CATEGORIES: OracleCategory[] = [
    'frases_inspiradoras',
    'reflexoes_filosoficas',
    'fragmentos_sabedoria',
    'rituais_lifestyle',
    'sussurros_maestria',
];

const normalizeOracleManualCategories = (enabledCategories: OracleCategory[] = []): OracleCategory[] => {
    const filtered = enabledCategories.filter((category) => ORACLE_MANUAL_LIBRARY_CATEGORIES.includes(category));
    return filtered.length > 0 ? filtered : [...ORACLE_MANUAL_LIBRARY_CATEGORIES];
};

const ORACLE_CATEGORY_LABELS: Record<OracleCategory, string> = {
    frases_inspiradoras: 'Carta inspiradora',
    reflexoes_filosoficas: 'Reflexao filosofica',
    fragmentos_sabedoria: 'Fragmento de sabedoria',
    dicas_produtividade: 'Card de foco',
    rituais_lifestyle: 'Dica de vida',
    provocacoes: 'Card de choque',
    sussurros_maestria: 'Sussurro de maestria',
    analise_padroes: 'Card de analise',
};

const resolveOraclePresentation = (
    category: OracleCategory,
    triggerType: 'app_open' | 'cron' | 'manual',
): 'ambient_pulse' | 'info_card' => (
    triggerType === 'manual' || ORACLE_INTEL_CATEGORIES.has(category) ? 'info_card' : 'ambient_pulse'
);

const resolveManualOracleCategory = (enabledCategories: OracleCategory[] = []): OracleCategory => {
    const manualPool = normalizeOracleManualCategories(enabledCategories);
    const randomIndex = Math.floor(Math.random() * manualPool.length);
    return manualPool[randomIndex] || 'frases_inspiradoras';
};

const hasOracleStructuralNeed = (contextData: ReturnType<typeof buildOracleOperationalContext>) => (
    !contextData.hasCycle ||
    contextData.needsFirstArena ||
    contextData.needsFirstAction ||
    contextData.needsFirstTask ||
    contextData.needsSitrepClosure
);

const resolveAutomaticOracleCategory = (
    mode: OracleMode,
    contextData: ReturnType<typeof buildOracleOperationalContext>,
    messages: OracleMessage[],
    enabledCategories: OracleCategory[] = [],
    now: Date = new Date(),
): OracleCategory => {
    if (hasOracleStructuralNeed(contextData)) {
        return 'dicas_produtividade';
    }

    const categoryProfile = getOracleModeConfig(mode).automaticCategories;

    if (contextData.cycleRisk === 'alto') {
        return contextData.overdueActions > 0 ? categoryProfile.critical : categoryProfile.high;
    }

    const ambientPool = normalizeOracleManualCategories(enabledCategories);
    const todayFeedMessages = getOracleFeedMessagesForOperationalDay(messages, now).filter((message) => !isManualOracleFeedMessage(message));
    const sentAmbientCategories = new Set(
        todayFeedMessages
            .map((message) => message.category)
            .filter((category): category is OracleCategory => ambientPool.includes(category as OracleCategory))
    );
    const nextAmbientCategory = ambientPool.find((category) => !sentAmbientCategories.has(category));

    if (nextAmbientCategory) {
        return nextAmbientCategory;
    }

    if (contextData.cycleRisk === 'medio') {
        return categoryProfile.medium;
    }

    return categoryProfile.low;
};

const shouldSkipAutomaticOracle = (
    mode: OracleMode,
    triggerType: 'app_open' | 'cron' | 'manual',
    contextData: ReturnType<typeof buildOracleOperationalContext>,
    isCriticalTrigger: boolean,
): boolean => {
    if (triggerType === 'manual') return false;

    const automationProfile = getOracleModeConfig(mode).automationProfile;
    const hasStructuralNeed = hasOracleStructuralNeed(contextData);
    const hasHighRisk = contextData.cycleRisk === 'alto';

    if (automationProfile === 'proativo') {
        return false;
    }

    if (automationProfile === 'equilibrado') {
        return triggerType === 'cron' && !isCriticalTrigger && !hasStructuralNeed && !hasHighRisk;
    }

    if (triggerType === 'cron') {
        return !isCriticalTrigger;
    }

    return !isCriticalTrigger && !hasStructuralNeed && !hasHighRisk;
};

const shouldPushOracleFeedMessage = (
    message: OracleMessage,
    appMode: AppMode = 'GAME',
    dailyFocusCardEnabled = false,
): boolean => {
    const modeConfig = getOracleModeConfig(message.mode);
    const presentation = message.contextSnapshot?.presentation;
    const triggerType = message.contextSnapshot?.triggerType;

    if (triggerType === 'manual') {
        return false;
    }

    if (appMode === 'BASIC' && dailyFocusCardEnabled) {
        return true;
    }

    if (modeConfig.pushProfile === 'essencial') {
        return false;
    }

    if (modeConfig.pushProfile === 'equilibrado') {
        return presentation === 'info_card';
    }

    return true;
};

export interface GameContextType {
    session: Session | null;
    isNewUser: boolean;
    assets: Asset[];
    arenaFolders: ArenaFolder[];
    actions: Action[];
    tasks: ScheduledTask[];
    taskPool: TaskPoolItem[];
    checklistItems: ChecklistItem[];
    sequenceItems: SequenceItem[];
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
    upcomingCycle: Cycle | null;
    dailyCommitment: DailyCommitment;
    updateOperationalScratch: (text: string) => void;
    unlockDailyCommitment: () => void;
    achievementUnlocked: { type: FeedEventType; data: any; } | null;
    seasons: Season[];
    seasonMissions: SeasonMission[];
    seasonQuests: SeasonQuest[];
    clanQuestProgress: Record<string, Record<string, number>>;
    clanQuestParticipants: Record<string, number>;
    getClanQuestProgress?: (questId: string) => number;
    getClanQuestForActionName?: (actionName?: string) => SeasonQuest | null;
    getClanQuestsForArena?: (arena: Arena, arenaActions: Action[]) => SeasonQuest[];
    fetchClanQuestParticipants?: (questId: string, actionName: string) => Promise<void>;
    userMissionParticipations: Record<string, boolean>;
    joinClanMission?: (questId: string) => Promise<void>;
    updateClanMissionProgress: (questId: string, increment: number) => Promise<void>;
    leaveClanMission: (questId: string) => Promise<void>;
    activateClanQuest: (questId: string) => Promise<void>;
    getUserPublicData: (userId: string) => Promise<{ profile: UserProfile | null, clan: Clan | null, clanRank: ClanRank | undefined, levels: Record<string, number>, arenasByAsset: Record<string, Arena[]> }>;
    levelUnlocks: LevelUnlocks;
    setAchievementUnlocked: (achievement: { type: FeedEventType; data: any; } | null) => void;
    updateLevelUnlocks: (next: LevelUnlocks) => void;
    grantUserUnlock: (category: UnlockCategory, itemId: string) => void;
    addCompletedMission: (mission: SeasonMission) => void;
    acceptSeasonQuest: (questId: string) => void;
    abortSeasonQuest: (questId: string) => Promise<void>;
    claimSeasonQuest: (questId: string) => Promise<void>;
    claimSeasonMission: (missionId: string) => Promise<void>;
    addProfileFlag: (flag: string) => void;
    feed: FeedEvent[];
    addFeedEvent: (eventData: Pick<FeedEvent, 'type' | 'content'>) => void;
    getArenas: () => Arena[];
    addArena: (assetId: string, arenaData: Omit<Arena, 'id' | 'assetId' | 'actionIds'>, skipDb?: boolean) => Promise<Arena>;
    updateArena: (arenaId: string, arenaData: Partial<Pick<Arena, 'assetId' | 'name' | 'description' | 'icon' | 'folderId' | 'isArchived' | 'priority'>>) => void;
    deleteArena: (arenaId: string, options?: { force?: boolean }) => void;
    createArenaFolder: (name: string, icon: string, assetId?: string) => Promise<ArenaFolder | null>;
    updateArenaFolder: (folderId: string, data: Partial<ArenaFolder>) => Promise<void>;
    deleteArenaFolder: (folderId: string) => Promise<void>;
    moveArenaToFolder: (arenaId: string, folderId: string | null) => Promise<void>;
    reorderArena: (arenaId: string, newIndex: number | string, side?: 'left' | 'right') => Promise<void>;
    reorderArenaPriority: (arenaId: string, priority: 'alta' | 'media' | 'baixa', newIndex: number | string) => Promise<void>;
    reorderEntity: (draggedId: string, draggedType: 'arena' | 'campaign', targetId: string, targetType: 'arena' | 'campaign', side?: 'left' | 'right') => Promise<void>;
    reorderEntityPriority: (draggedId: string, draggedType: 'arena' | 'campaign', priority: 'alta' | 'media' | 'baixa', targetId?: string) => Promise<void>;
    arenasViewMode: ArenasViewMode;
    setArenasViewMode: (mode: ArenasViewMode) => void;
    reorderAction: (arenaId: string, actionId: string, newIndex: number) => void;
    getActionsForArena: (arenaId: string) => Action[];
    getAssetForAction: (actionId: string) => Asset | undefined;
    getActionBackgroundStyle: (actionId: string) => React.CSSProperties;
    addAction: (actionData: Omit<Action, 'id'>) => Promise<Action>;
    updateAction: (actionId: string, actionData: Partial<Action>) => void;
    deleteAction: (actionId: string) => void;
    scheduleTask: (actionOrId: string | Action, date: string, startTime: number) => Promise<ScheduledTask | undefined>;
    scheduleMultipleTasks: (actionOrId: string | Action, daysOfWeek: DayOfWeek[], startTimeInMinutes: number) => Promise<void>;
    clearPendingTasksForAction: (actionId: string) => Promise<void>;
    scheduleAndCompleteNow: (actionId: string, taskId?: string) => Promise<void>;
    scheduleAndCompleteAt: (actionId: string, date: string, startTime: number, taskId?: string) => Promise<void>;
    scheduleAndCompleteMilestoneNow: (actionId: string) => Promise<void>;
    returnTaskToPool: (taskId: string, targetOperationalDate?: string) => void;
    deleteTask: (taskId: string) => void;
    getTasksForDate: (date: Date) => ScheduledTask[];
    rescheduleTask: (taskId: string, newDate: string, newStartTime: number) => void;
    updateTask: (taskId: string, updates: Partial<ScheduledTask>) => void;
    toggleTaskCompletion: (taskId: string) => Promise<void>;
    completeTutorialMission: () => void;
    toggleChecklistItem: (id: string) => void;
    addChecklistItem: (text: string) => void;
    updateChecklistItem: (id: string, text: string) => void;
    deleteChecklistItem: (id: string) => void;
    addSequenceItem: (title: string) => void;
    updateSequenceItem: (id: string, title: string) => void;
    markSequenceItemToday: (id: string) => void;
    adjustSequenceItemDays: (id: string, delta: number) => void;
    resetSequenceItem: (id: string) => void;
    deleteSequenceItem: (id: string) => void;
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
    startCycle: (name: string, endDate: string, startDate?: string) => void;
    updateCycle: (cycleId: string, updates: Partial<Pick<Cycle, 'name' | 'endDate'>>) => Promise<void>;
    endCycle: (currentAssets: Asset[], currentActions: Action[]) => EndCycleResult;
    applyExp: (expGained: number) => void;
    addChest: (chestType: ChestType) => Promise<void>;
    startNewCycle: (arenaChanges: ArenaSetupChange[], cycleDetails: { name: string; startDate?: string; endDate: string; }) => void;
    deleteCycle: (cycleId: string) => Promise<boolean>; // Added deleteCycle to interface
    setDailyCommitment: (taskIds: string[]) => void;
    lockDailyCommitment: () => void;
    endDailyBattle: () => void;
    resetDailyCommitment: () => void;
    openChest: (chestType: ChestType) => Promise<ChestOpenResult | null>;
    createClan: (clanDetails: Omit<Clan, 'id' | 'exp' | 'rankId'>) => Promise<boolean>;
    updateClan: (clanId: string, data: Partial<Pick<Clan, 'name' | 'icon' | 'description' | 'backgroundUrl' | 'recruitmentStatus'>>) => Promise<boolean>;
    leaveClan: () => Promise<void>;
    transferLeadershipAndLeave: (newLeaderId: string) => Promise<void>;
    deleteClan: () => Promise<void>;
    kickClanMember: (memberId: string) => Promise<void>;
    addClanMember: (memberId: string) => Promise<void>;
    searchClans: (query: string) => Promise<Clan[]>;
    joinClan: (clanToJoin: Clan) => Promise<void>;
    approveClanJoinRequest: (request: ClanJoinRequest) => Promise<void>;
    rejectClanJoinRequest: (request: ClanJoinRequest) => Promise<void>;
    cancelClanJoinRequest: (requestId: string) => Promise<void>;
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
    refreshOracleMessages: () => Promise<void>;
    triggerOracle: (triggerType?: 'app_open' | 'cron' | 'manual') => Promise<OracleTriggerResult | null>;

    // Notifications
    notifications: Notification[];
    cycleExpBonus: number;
    cycleProgress: number;
    markNotificationRead: (id: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    fetchNotifications: () => Promise<void>;

    // Direct Messages
    directMessages: DirectMessage[];
    dmConversations: DMConversation[];
    blockedUsers: UserBlock[];
    blockedUserIds: string[];
    sendDirectMessage: (recipientId: string, content: string) => Promise<void>;
    markDMAsRead: (senderId: string) => Promise<void>;
    fetchDMs: () => Promise<void>;
    blockUser: (blockedUserId: string, options?: { reason?: string | null }) => Promise<boolean>;
    unblockUser: (blockedUserId: string) => Promise<boolean>;
    submitModerationReport: (input: ModerationReportInput) => Promise<boolean>;

    // Aldeia
    getAldeiaSlots: (clanId: string) => Promise<AldeiaSlot[]>;
    updateAldeiaSlot: (clanId: string, slotId: AldeiaSlotId, updates: Partial<AldeiaSlot>) => Promise<void>;
    getAldeiaPresence: (clanId: string) => Promise<AldeiaPresence[]>;
    enterAldeiaSlot: (clanId: string, slotId: AldeiaSlotId) => Promise<void>;
    performAldeiaDailyUpdate: (clanId: string) => Promise<void>;
    setAldeiaSlots: React.Dispatch<React.SetStateAction<AldeiaSlot[]>>;
    setAldeiaPresence: React.Dispatch<React.SetStateAction<AldeiaPresence[]>>;

    showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
    toast: { message: string; visible: boolean; type?: 'success' | 'error' | 'warning' | 'info'; style?: React.CSSProperties };
    hideToast: () => void;
    // Forge & Store
    inventory: InventoryItem[];
    buyGoldPack: (packId: string) => Promise<void>;
    buyStoreItem: (itemId: string, type: 'premium' | 'codex' | 'exclusive' | 'boost', options?: { costOverrideGold?: number; successMessage?: string }) => Promise<void>;
    recycleItem: (instanceId: string) => Promise<void>;
    craftItem: (tier: number, category?: string, exactItemId?: string) => Promise<InventoryItem | null>;
    equipItem: (item: InventoryItem) => Promise<void>;
    toggleEquipItem: (item: InventoryItem) => Promise<void>;
    updateCustomClanMissionProgress: (missionId: string, increment: number) => Promise<void>;

    // Codex System
    userCodexes: UserCodex[];
    codexCatalog: CodexCatalogItem[];
    refreshCodexes: () => Promise<void>;
    buyCodex: (catalogId: string, options?: { silentSuccess?: boolean; useCampaignQuizFreeCredit?: boolean; useCampaignQuizMediumCredit?: boolean }) => Promise<UserCodex | null>;
    buyCodexCreationSlot: () => Promise<boolean>;
    getRelationshipCapacitySummary: () => Promise<RelationshipCapacitySummary | null>;
    fetchRelationshipHubData: () => Promise<{ invites: RelationshipLinkInvite[]; links: RelationshipLink[]; linkedArenas: LinkedRelationshipArena[]; competitionChallenges: RelationshipCompetitionChallenge[]; summary: RelationshipCapacitySummary | null }>;
    createRelationshipInvite: (recipientId: string, linkType: RelationshipLinkType) => Promise<boolean>;
    respondToRelationshipInvite: (inviteId: string, action: RelationshipInviteAction) => Promise<boolean>;
    endRelationshipLink: (relationshipLinkId: string) => Promise<boolean>;
    buyRelationshipCapacitySlot: (slotType: RelationshipCapacitySlotType) => Promise<boolean>;
    createLinkedRelationshipArena: (relationshipLinkId: string, arenaInput: { assetId: string; name: string; description?: string; icon?: string }) => Promise<Arena | null>;
    shareRelationshipArena: (relationshipLinkId: string, arenaId: string) => Promise<Arena | null>;
    removeRelationshipArenaShare: (relationshipLinkId: string, arenaId: string) => Promise<boolean>;
    createCompetitionChallenge: (relationshipLinkId: string, sourceArenaId: string) => Promise<Arena | null>;
    createCodexShareLink: (codexId: string) => Promise<{ url: string; token: string; shareId: string } | null>;
    sendCodexToNickname: (codexId: string, nickname: string) => Promise<void>;
    getCodexSharePreview: (input: { token?: string; shareId?: string }) => Promise<CodexSharePreview | null>;
    claimCodexShare: (input: { token?: string; shareId?: string }) => Promise<boolean>;
    installCodex: (userCodexId: string) => Promise<void>;
    duplicateUserCodexToRecipient: (codexId: string, recipientId: string, relationshipLinkId?: string | null) => Promise<boolean>;
    createMentorCodexForRecipient: (recipientId: string, codex: { name: string; description?: string; template: any }, relationshipLinkId?: string | null) => Promise<boolean>;

    // PWA
    installPrompt: any;
    promptInstall: () => Promise<void>;

    // Campaigns
    campaigns: Campaign[];
    addCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'status'>) => Promise<Campaign>;
    updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<boolean>;
    deleteCampaign: (id: string) => Promise<void>;

    // App Mode & Theme
    appMode: AppMode;
    isProfileLoaded: boolean;
    setAppMode: (mode: AppMode) => void;
    activeTheme: ThemePreference;
    toggleTheme: () => void;
    getSharedActionPoolProgress?: (arenaId: string, actionId: string) => number;
    getOrCreateOfficeArena: () => Promise<Arena | null>;
    cleanupEmptyOfficeArena: (arenaId: string) => void;
    setArenaAsShared: (arenaId: string, isShared: boolean) => void;
    aldeiaSlots: AldeiaSlot[];
    aldeiaPresence: AldeiaPresence[];
    loadAldeiaData: (clanId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode, session: Session | null }> = ({ children, session }) => {
    const disableGoldInviteByEnv = parseBooleanEnvFlag(import.meta.env.VITE_DISABLE_GOLD_INVITE);
    const isGoldenInviteGateEnabled = !import.meta.env.DEV && !disableGoldInviteByEnv;

    const [userProfile, setUserProfile] = useState<UserProfile>(() => {
        const userId = session?.user.id;
        return {
            ...DEFAULT_USER_PROFILE,
            id: userId || DEFAULT_USER_PROFILE.id,
            email: session?.user.email,
            emailConfirmedAt: session?.user.email_confirmed_at,
            createdAt: session?.user.created_at,
        };
    });

    const [isProfileLoaded, setIsProfileLoaded] = useState(false);

    const isNewUser = useMemo(() => {
        return !userProfile.completedSeasonMissions?.includes(PROFILE_FLAG_TUTORIAL_COMPLETED);
    }, [userProfile.completedSeasonMissions]);

    const [arenasViewMode, setArenasViewModeState] = useState<ArenasViewMode>(() => 'free');

    useEffect(() => {
        if (session?.user) {
            setUserProfile(prev => ({
                ...prev,
                id: session.user.id,
                email: session.user.email,
                emailConfirmedAt: session.user.email_confirmed_at,
                createdAt: session.user.created_at,
            }));
        }
    }, [session]);

    const setArenasViewMode = async (mode: ArenasViewMode) => {
        const nextMode = normalizeArenasViewMode(mode);
        setArenasViewModeState(nextMode);
        updateUserProfile({ arenasViewMode: nextMode });
    };
    const [aldeiaSlots, setAldeiaSlots] = useState<AldeiaSlot[]>([]);
    const [aldeiaPresence, setAldeiaPresence] = useState<AldeiaPresence[]>([]);
    const lastAldeiaUpdateRef = useRef<number>(0);

    const loadAldeiaData = async (clanId: string) => {
        if (!clanId) return;

        // Anti-flicker: if we just updated, don't refetch immediately
        if (Date.now() - lastAldeiaUpdateRef.current < 2000) return;

        const [slots, presence] = await Promise.all([
            getAldeiaSlots(clanId),
            getAldeiaPresence(clanId)
        ]);

        // Deduplicate presence by userId (keep latest startedAt) to fix visual multiplication bug
        const uniquePresence = Object.values(presence.reduce((acc, p) => {
            const userId = p.userId;
            const existing = acc[userId];
            if (!existing || (p.startedAt && existing.startedAt && new Date(p.startedAt) > new Date(existing.startedAt))) {
                acc[userId] = p;
            } else if (!existing.startedAt && p.startedAt) {
                acc[userId] = p;
            }
            return acc;
        }, {} as Record<string, AldeiaPresence>));

        setAldeiaSlots(slots);
        setAldeiaPresence(uniquePresence);
    };

    useEffect(() => {
        if (userProfile?.arenasViewMode) {
            setArenasViewModeState(normalizeArenasViewMode(userProfile.arenasViewMode));
        }
    }, [userProfile?.arenasViewMode]);

    const [assets, setAssets] = useState<Asset[]>(() => createDefaultAssets(true));
    const assetsRef = useRef<Asset[]>(createDefaultAssets(true));

    const [arenaFolders, setArenaFolders] = useState<ArenaFolder[]>(() => []);

    const [actions, setActions] = useState<Action[]>(() => createDefaultActions(true));
    const allArenas = useMemo(() => assets.flatMap(asset => asset.arenas), [assets]);

    useEffect(() => {
        assetsRef.current = assets;
    }, [assets]);

    const [tasks, setTasks] = useState<ScheduledTask[]>(() => []);

    const [reports, setReports] = useState<Report[]>(() => []);

    const nobilityRanks = NOBILITY_RANKS;
    const clanRanks = CLAN_RANKS;

    const [dailyCommitment, setDailyCommitmentState] = useState<DailyCommitment>(() => createDefaultDailyCommitment());
    const [judgedOperationalDates, setJudgedOperationalDates] = useState<string[]>([]);

    const [cycleExpBonus, setCycleExpBonus] = useState<number>(0);
    const [cycleProgress, setCycleProgress] = useState<number>(0);

    const [oraclePreferences, setOraclePreferences] = useState<OraclePreferences | null>(null);
    const [oracleMessages, setOracleMessages] = useState<OracleMessage[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
    const [dmConversations, setDMConversations] = useState<DMConversation[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<UserBlock[]>([]);
    const [remotePushRegistered, setRemotePushRegistered] = useState(false);
    const [toast, setToast] = useState<{ message: string; visible: boolean; type?: 'success' | 'error' | 'warning' | 'info' }>({ message: '', visible: false, type: 'info' });
    const blockedUserIds = useMemo(() => blockedUsers.map((entry) => entry.blockedUserId), [blockedUsers]);

    // PWA Installation State
    const [installPrompt, setInstallPrompt] = useState<any>(() => getInstallPrompt());

    useEffect(() => {
        startInstallPromptCapture();
        return subscribeInstallPrompt(setInstallPrompt);
    }, []);

    const promptInstall = async () => {
        await promptForInstall();
    };

    // Campaigns State
    const [campaigns, setCampaigns] = useState<Campaign[]>(() => []);
    const seenNotificationIdsRef = useRef<Set<string>>(new Set());
    const notificationsHydratedRef = useRef(false);
    const seenCodexGiftNotificationIdsRef = useRef<Set<string>>(new Set());
    const autoInstallingMentorCodexIdsRef = useRef<Set<string>>(new Set());
    const seenOracleMessageIdsRef = useRef<Set<string>>(new Set());
    const oracleMessagesHydratedRef = useRef(false);
    const dailyCommitmentPersistTimeoutRef = useRef<number | null>(null);
    const dmRefreshTimeoutRef = useRef<number | null>(null);
    const relationshipInviteExpiryCheckedAtRef = useRef<number>(0);
    const notificationsRefreshTimeoutRef = useRef<number | null>(null);
    const oracleMessagesRefreshTimeoutRef = useRef<number | null>(null);
    const socialFriendsRefreshTimeoutRef = useRef<number | null>(null);
    const socialClanOutgoingRefreshTimeoutRef = useRef<number | null>(null);
    const socialClanIncomingRefreshTimeoutRef = useRef<number | null>(null);
    const actionReminderTimeoutRef = useRef<number | null>(null);

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

    useEffect(() => {
        let cancelled = false;

        const syncRemotePushState = async () => {
            if (!session?.user.id || !oraclePreferences?.pushEnabled) {
                if (!cancelled) setRemotePushRegistered(false);
                return;
            }

            try {
                const syncResult = await syncAppPushRegistration();
                if (cancelled) return;

                if (syncResult.remoteDeliveryReady) {
                    setRemotePushRegistered(true);
                    return;
                }

                setRemotePushRegistered(await hasAppPushRemoteDeliveryReady());
            } catch (error) {
                console.warn('Remote push sync failed:', error);
                if (!cancelled) {
                    setRemotePushRegistered(await hasAppPushRemoteDeliveryReady());
                }
            }
        };

        void syncRemotePushState();

        return () => {
            cancelled = true;
        };
    }, [oraclePreferences?.pushEnabled, session?.user.id]);

    const addCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'status'>): Promise<Campaign> => {
        const userId = session?.user.id;
        if (!userId) throw new Error("User not authenticated");

        const newCampaign: Campaign = {
            ...campaignData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        setCampaigns(prev => [...prev, newCampaign]);

        try {
            const { error } = await supabase.from('campaigns').insert(mapToSnakeCase({
                ...newCampaign,
                userId
            }));

            if (error) throw error;
            return newCampaign;
        } catch (error) {
            console.error("Error creating campaign:", error);
            setCampaigns(prev => prev.filter(c => c.id !== newCampaign.id));
            showToast("Erro ao criar campanha.", 'error');
            throw error;
        }
    };

    const updateCampaign = async (id: string, updates: Partial<Campaign>): Promise<boolean> => {
        const userId = session?.user.id;
        if (!userId) {
            showToast("Voce precisa estar autenticado para salvar a campanha.", 'error');
            return false;
        }

        const currentCampaign = campaigns.find(c => c.id === id);
        if (!currentCampaign) {
            showToast("Campanha nao encontrada para salvar.", 'error');
            return false;
        }

        const normalizedUpdates: Partial<Campaign> = { ...updates };

        if (typeof normalizedUpdates.title === 'string') {
            const nextTitle = normalizedUpdates.title.trim();
            if (!nextTitle) {
                showToast("A campanha precisa de um nome.", 'error');
                return false;
            }
            normalizedUpdates.title = nextTitle;
        }

        if (typeof normalizedUpdates.description === 'string') {
            normalizedUpdates.description = normalizedUpdates.description.trim();
        }

        const optimisticCampaign = { ...currentCampaign, ...normalizedUpdates };
        setCampaigns(prev => prev.map(c => c.id === id ? optimisticCampaign : c));

        const payload = {
            ...mapToSnakeCase(normalizedUpdates),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('campaigns')
            .update(payload)
            .eq('id', id)
            .eq('user_id', userId)
            .select('*')
            .single();

        if (error) {
            console.error("Error updating campaign:", error);
            setCampaigns(prev => prev.map(c => c.id === id ? currentCampaign : c));
            showToast("Nao foi possivel salvar o novo nome da campanha.", 'error');
            return false;
        }

        const persistedCampaign = mapToCamelCase(data) as Campaign;
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...persistedCampaign } : c));
        return true;
    };

    const deleteCampaign = async (id: string) => {
        const userId = getSupabaseUserId();
        const campaign = campaigns.find(c => c.id === id);
        if (!campaign) return;
        setCampaigns(prev => prev.filter(c => c.id !== id));

        // Delete arenas inside the campaign (Cascading delete)
        if (campaign?.arenaIds?.length) {
            for (const arenaId of campaign.arenaIds) {
                await deleteArena(arenaId);
            }
        }

        const query = supabase.from('campaigns').delete().eq('id', id);
        const { error } = userId ? await query.eq('user_id', userId) : await query;
        if (error) {
            console.error("Error deleting campaign:", error);
            showToast("Nao foi possivel excluir a campanha por completo.", 'error');
        }
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
                    return 'BASIC';
                }
            } catch (e) { }
        }
        return 'BASIC';
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
            } catch (e) { }
        }
        return 'DARK';
    });

    useEffect(() => {
        setAppModeState(userProfile?.appMode === 'GAME' ? 'GAME' : 'BASIC');
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
        const newTheme = activeTheme === 'DARK' ?'LIGHT' : 'DARK';
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

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setToast({ message, type, visible: true });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);
    const getSentinelStorageKey = (userId: string) => `glyph_sentinel_mode_${userId}`;
    const getPushStorageKey = (userId: string) => `glyph_oracle_push_${userId}`;
    const getSequenceStorageKey = (userId: string) => `glyph_sequences_${userId}`;
    const getActionReminderStorageKey = (userId: string, taskId: string, date: string, startTime: number) =>
        `glyph_action_reminder_${userId}_${taskId}_${date}_${startTime}`;
    const readLegacySequenceItemsFromStorage = (userId: string): SequenceItem[] => {
        try {
            const saved = localStorage.getItem(getSequenceStorageKey(userId));
            if (!saved) return [];
            return normalizeSequenceItems(JSON.parse(saved));
        } catch (error) {
            console.error('Failed to read legacy sequence items from local storage:', error);
            return [];
        }
    };
    const getPushEnabled = (userId: string): boolean => {
        const saved = localStorage.getItem(getPushStorageKey(userId));
        if (saved === 'true') return true;
        if (saved === 'false') return false;
        return false;
    };

    const isOracleCriticalTrigger = (userId: string) => {
        const pendingToday = tasks.filter(t => t.date === getLocalDateString() && !t.completed).length;
        const hasCycleClosingRisk = !!activeCycle && pendingToday > 0 && (() => {
            const msToEnd = new Date(activeCycle.endDate).getTime() - Date.now();
            return msToEnd > 0 && msToEnd <= (24 * 60 * 60 * 1000);
        })();

        const hasOfficeUrgentAlert = clan?.clanType === 'Office' && notifications.some(n => !n.read && n.type === 'clan_mission_update');

        return hasCycleClosingRisk || hasOfficeUrgentAlert;
    };

    const maybeNotifyVillageDuty = (userId: string) => {
        if (!clan || !aldeiaSlots.length) return;
        const key = `glyph_village_duty_${userId}_${getLocalDateString()}`;
        if (localStorage.getItem(key) === '1') return;

        const mainSlots = aldeiaSlots.filter(s => s.slotId !== 'trono');
        if (mainSlots.length === 0) return;

        const villageOrder = mainSlots.reduce((acc, s) => acc + s.health, 0) / mainSlots.length;
        const villageBonusFactor = (villageOrder / 100) * MAX_VILLAGE_BONUS_PERCENT;
        const percent = Math.round(villageBonusFactor * 100);
        if (percent <= 0) return;

        showToast(`Dever Cumprido: Ordem da Aldeia ativa (+${percent}% de bonus de EXP).`, 'success');
        localStorage.setItem(key, '1');
    };

    // Helper for PWA Latency awareness
    const withLatencyToast = async <T,>(operation: Promise<T> | any, timeoutMs = 1500): Promise<T> => {
        let isComplete = false;

        const timeoutId = setTimeout(() => {
            if (!isComplete) {
                showToast("Sincronizando operaÃ§Ã£o com o servidor...", "info");
            }
        }, timeoutMs);

        try {
            const result = await operation;
            isComplete = true;
            clearTimeout(timeoutId);
            return result;
        } catch (error) {
            isComplete = true;
            clearTimeout(timeoutId);
            throw error;
        }
    };

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
            const mapped = mapToCamelCase(data) as OraclePreferences;
            const nextMode = mapped.activeMode || 'neutro';
            const nextIaEnabled = mapped.iaEnabled ?? true;
            setOraclePreferences({
                ...mapped,
                dailyFocusCardEnabled: mapped.dailyFocusCardEnabled ?? false,
                dmNotificationsEnabled: mapped.dmNotificationsEnabled ?? true,
                enabledCategories: normalizeOracleManualCategories(mapped.enabledCategories || []),
                sentinelMode: deriveLegacySentinelMode(nextMode, nextIaEnabled),
                pushEnabled: getPushEnabled(userId),
            });
        } else {
            // Default preferences
            const defaultPrefs: OraclePreferences = {
                userId,
                iaEnabled: true,
                notificationsEnabled: true,
                dailyFocusCardEnabled: false,
                dmNotificationsEnabled: true,
                pushEnabled: getPushEnabled(userId),
                animationsEnabled: true,
                soundsEnabled: true,
                hapticsEnabled: true,
                sentinelMode: deriveLegacySentinelMode('neutro', true),
                enabledCategories: [...ORACLE_MANUAL_LIBRARY_CATEGORIES],
                activeMode: 'neutro',
                quietHoursStart: '22:00',
                quietHoursEnd: '07:00',
                updatedAt: new Date().toISOString()
            };

            // Use upsert to prevent 409 Conflict if multiple calls happen simultaneously
            const { sentinelMode, pushEnabled, ...persistableDefaultPrefs } = defaultPrefs;
            const { error: insertError } = await supabase.from('oracle_preferences').upsert(mapToSnakeCase({ ...persistableDefaultPrefs, user_id: userId }));
            if (!insertError) {
                setOraclePreferences(defaultPrefs);
            }
        }
    }, []);

    const updateOraclePreferences = async (prefs: Partial<OraclePreferences>) => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        const nextMode = (prefs.activeMode ?? oraclePreferences?.activeMode ?? 'neutro') as OracleMode;
        const nextIaEnabled = Boolean(prefs.iaEnabled ?? oraclePreferences?.iaEnabled ?? true);
        const nextSentinelMode = deriveLegacySentinelMode(nextMode, nextIaEnabled);
        const nextPushEnabled = Boolean(prefs.pushEnabled ?? oraclePreferences?.pushEnabled ?? false);
        localStorage.setItem(getSentinelStorageKey(userId), nextSentinelMode || 'soberano_ativo');
        localStorage.setItem(getPushStorageKey(userId), nextPushEnabled ?'true' : 'false');

        const normalizedEnabledCategories = prefs.enabledCategories
            ? normalizeOracleManualCategories(prefs.enabledCategories)
            : oraclePreferences?.enabledCategories;
        const newPrefs = {
            ...oraclePreferences,
            ...prefs,
            enabledCategories: normalizedEnabledCategories,
            sentinelMode: nextSentinelMode,
            pushEnabled: nextPushEnabled,
            updatedAt: new Date().toISOString()
        };
        // Optimistic update
        setOraclePreferences(newPrefs as OraclePreferences);

        const { sentinelMode, pushEnabled, ...persistablePrefs } = (newPrefs as OraclePreferences);

        const { error } = await supabase
            .from('oracle_preferences')
            .upsert(mapToSnakeCase({ ...persistablePrefs, userId }));

        if (error) {
            console.error("Error updating oracle preferences:", error);
            // Revert?For now, we assume it works or user refreshes.
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
        setOracleMessages(prev => prev.map(m => m.id === messageId ?{ ...m, read: true } : m));

        const { error } = await supabase
            .from('oracle_messages')
            .update({ read: true })
            .eq('id', messageId);

        if (error) {
            console.error("Error marking message as read:", error);
        }
    };

    const triggerOracle = async (triggerType: 'app_open' | 'cron' | 'manual' = 'app_open'): Promise<OracleTriggerResult | null> => {
        const userId = getSupabaseUserId();
        if (!userId || !oraclePreferences) return null;

        const now = new Date();
        const quota = getOracleFeedQuotaStatus(
            oracleMessages,
            oraclePreferences,
            now,
            userProfile.appMode === 'BASIC' ? 'BASIC' : 'GAME',
        );
        const isPremiumUser = hasPremiumAccess(userProfile);
        const selectedMode = oraclePreferences.activeMode || 'neutro';

        if (triggerType === 'app_open') {
            maybeNotifyVillageDuty(userId);
        }

        if (triggerType === 'manual' && !isPremiumUser) {
            showToast('Gerar card manual e premium.', 'info');
            return { status: 'premium_required', ...quota };
        }

        if (triggerType !== 'manual' && !oraclePreferences.notificationsEnabled) {
            return { status: 'disabled', ...quota };
        }

        if (triggerType !== 'manual' && !oraclePreferences.dailyFocusCardEnabled) {
            return { status: 'disabled', ...quota };
        }

        if (!oraclePreferences.iaEnabled) {
            if (triggerType === 'manual') {
                showToast('Ative a IA do Oraculo para gerar cards.', 'info');
            }
            return { status: 'disabled', ...quota };
        }

        if (triggerType !== 'manual') {
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const [startH, startM] = (oraclePreferences.quietHoursStart || '22:00').split(':').map(Number);
            const [endH, endM] = (oraclePreferences.quietHoursEnd || '07:00').split(':').map(Number);

            const start = startH * 60 + startM;
            const end = endH * 60 + endM;

            let isQuiet = false;
            if (start > end) {
                isQuiet = currentTime >= start || currentTime < end;
            } else {
                isQuiet = currentTime >= start && currentTime < end;
            }

            if (isQuiet) {
                return { status: 'quiet_hours', ...quota };
            }
        }

        if (triggerType === 'manual' && quota.manualRemainingToday <= 0) {
            showToast(`Limite manual do Oraculo atingido (${quota.manualDailyTarget}/${quota.manualDailyTarget}).`, 'info');
            return { status: 'daily_limit', ...quota };
        }

        if (triggerType !== 'manual' && quota.autoRemainingToday <= 0) {
            return { status: 'daily_limit', ...quota };
        }

        if (triggerType !== 'manual' && quota.autoSentToday > 0 && quota.nextAutoInMs > 0) {
            return { status: 'cooldown', cooldownMs: quota.nextAutoInMs, ...quota };
        }

        const totalChests = userProfile.chests?.reduce((acc: any, c: any) => acc + c.count, 0) || 0;
        const contextData = buildOracleOperationalContext({
            now,
            assets,
            actions,
            tasks,
            activeCycle,
            cycleProgress,
            activeMode: oraclePreferences.activeMode,
            customModeInstructions: oraclePreferences.customModeInstructions || null,
            enabledCategories: oraclePreferences.enabledCategories || [],
            username: userProfile.nickname || 'Soberano',
            level: userProfile.level || 1,
            clanName: clan?.name || null,
            seasonName: null,
            pendingChests: totalChests,
            dailyCommitment,
        });
        const isCriticalTrigger = isOracleCriticalTrigger(userId);

        if (shouldSkipAutomaticOracle(selectedMode, triggerType, contextData, isCriticalTrigger)) {
            return { status: 'skipped', ...quota };
        }

        let category: OracleCategory = triggerType === 'manual'
            ? resolveManualOracleCategory(oraclePreferences.enabledCategories || [])
            : 'dicas_produtividade';
        const enabled = oraclePreferences.enabledCategories || [];

        if (triggerType !== 'manual') {
            category = resolveAutomaticOracleCategory(selectedMode, contextData, oracleMessages, enabled, now);
        } else if (enabled.length > 0 && !enabled.includes(category as any)) {
            category = enabled[0];
        }

        // 6. Generate Prompt
        // The selected assistant mode should stay stable across feed/chat.
        const modeConfig = ORACLE_MODES[selectedMode] || ORACLE_MODES['neutro'];
        const systemPrompt = modeConfig.systemPromptTemplate(contextData);
        const presentation = resolveOraclePresentation(category, triggerType);
        const isManualLibraryCard = triggerType === 'manual' && ORACLE_MANUAL_LIBRARY_CATEGORIES.includes(category);
        const userPrompt = isManualLibraryCard
            ? `Gere um card curto para o chat do usuario.
      Categoria solicitada: ${category}
      Objetivo: entregar uma peca breve de frase, reflexao, sabedoria ou dica de vida.
      Formato obrigatorio:
      TITULO: ate 4 palavras
      CARD: 2 a 4 linhas curtas
      FECHO: 1 linha final breve
      Regras:
      - sem saudacao
      - sem PRIORIDADE, RISCO ou AJA
      - sem linguagem corporativa
      - se a categoria for rituais_lifestyle, o card deve trazer uma dica de vida pratica e simples
      - nas outras categorias, o card deve soar memoravel, util e limpo
      - nao force foco operacional aqui
      Contexto atual: ${JSON.stringify(contextData)}`
            : triggerType === 'manual'
                ? `Gere um card operacional curto para o chat do usuario.
      Categoria solicitada: ${category}
      Formato obrigatorio:
      PRIORIDADE: uma frase curta
      RISCO: uma frase curta
      AJA: um comando concreto e imediato
      Regras:
      - sem saudacao
      - sem texto decorativo
      - se faltar ciclo, arena, acao, tarefa ou fechamento do SITREP, isso vira o AJA
      - se existir nextMove, use isso como centro
      Contexto atual: ${JSON.stringify(contextData)}`
            : presentation === 'info_card'
                ? `Gere um card curto para o feed do usuario.
      Categoria solicitada: ${category}
      Formato obrigatorio:
      PRIORIDADE: uma frase curta
      RISCO: uma frase curta
      AJA: um comando concreto e imediato
      Regras:
      - foco operacional
      - sem saudacao generica
      - sem misticismo
      - nao descreva o contexto inteiro; decida o que importa
      Contexto atual: ${JSON.stringify(contextData)}`
                : `Gere um pulso curto para o feed do usuario.
      Categoria solicitada: ${category}
      Regras:
      - no maximo 2 frases
      - a primeira frase define o foco
      - a segunda frase define o proximo movimento
      - sem saudacao e sem floreio
      Contexto atual: ${JSON.stringify(contextData)}`;

        // 7. Call AI via Edge Function (server-side secret)
        try {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            const accessToken = sessionData.session?.access_token;
            if (sessionError || !accessToken) {
                console.error('Oracle Edge Function skipped: authenticated session missing.');
                if (triggerType === 'manual') {
                    showToast('Sessao indisponivel para gerar card.', 'error');
                }
                return { status: 'error', ...quota };
            }

            const { data: oracleData, error: oracleError } = await supabase.functions.invoke('oracle', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: {
                    systemPrompt,
                    userPrompt
                }
            });

            if (oracleError) {
                console.error('Oracle Edge Function failed:', oracleError);
                if (triggerType === 'manual') {
                    showToast('Falha do Oraculo ao gerar card.', 'error');
                }
                return { status: 'error', ...quota };
            }

            const text = String(oracleData?.text || '').trim();
            if (!text) {
                console.error('Oracle Edge Function returned empty content.');
                if (triggerType === 'manual') {
                    showToast('O Oraculo voltou vazio para este card.', 'error');
                }
                return { status: 'error', ...quota };
            }

            // 8. Save and Update
            const newMessage: OracleMessage = {
                id: crypto.randomUUID(),
                userId,
                category: category as any,
                content: text,
                mode: selectedMode,
                deliveryType: 'feed',
                contextSnapshot: {
                    triggerType,
                    presentation,
                    categoryLabel: ORACLE_CATEGORY_LABELS[category],
                    generatedFor: triggerType === 'manual' ? 'chat' : 'feed',
                    summary: triggerType === 'manual'
                        ? 'Card operacional do chat'
                        : presentation === 'info_card'
                            ? 'Card operacional do Oraculo'
                            : 'Pulso curto do Oraculo',
                },
                read: false,
                createdAt: new Date().toISOString()
            };

            setOracleMessages(prev => [newMessage, ...prev]);
            await supabase.from('oracle_messages').insert(mapToSnakeCase(newMessage));

            console.log('Oracle generated message:', text);
            if (triggerType === 'manual') {
                const manualSentAfterGeneration = quota.manualSentToday + 1;
                showToast(`Card manual do Oraculo (${manualSentAfterGeneration}/${quota.manualDailyTarget}).`, 'success');
            }
            return {
                status: 'generated',
                message: newMessage,
                autoDailyTarget: quota.autoDailyTarget,
                autoSentToday: quota.autoSentToday + (triggerType === 'manual' ? 0 : 1),
                autoRemainingToday: Math.max(0, quota.autoRemainingToday - (triggerType === 'manual' ? 0 : 1)),
                manualDailyTarget: quota.manualDailyTarget,
                manualSentToday: quota.manualSentToday + (triggerType === 'manual' ? 1 : 0),
                manualRemainingToday: Math.max(0, quota.manualRemainingToday - (triggerType === 'manual' ? 1 : 0)),
            };

        } catch (error) {
            console.error('Oracle AI generation failed:', error);
            if (triggerType === 'manual') {
                showToast('Falha ao gerar card do Oraculo.', 'error');
            }
            return { status: 'error', ...quota };
        }
    };

    // --- Notifications Implementation ---
    const fetchNotifications = useCallback(async (targetUserId?: string) => {
        const userId = targetUserId || session?.user.id;
        if (userId && isUuid(userId)) {
            const data = await SupabaseService.getNotifications(userId);
            setNotifications(data);
        }
    }, [session?.user.id]);

    const refreshOracleMessages = useCallback(async (targetUserId?: string) => {
        const userId = targetUserId || session?.user.id;
        if (userId && isUuid(userId)) {
            await fetchOracleMessages(userId);
        }
    }, [session?.user.id, fetchOracleMessages]);

    const scheduleNotificationsRefresh = useCallback((targetUserId?: string) => {
        const userId = targetUserId || session?.user.id;
        if (!userId || !isUuid(userId) || notificationsRefreshTimeoutRef.current !== null) return;
        notificationsRefreshTimeoutRef.current = window.setTimeout(() => {
            notificationsRefreshTimeoutRef.current = null;
            void fetchNotifications(userId);
        }, 250);
    }, [session?.user.id, fetchNotifications]);

    const scheduleOracleMessagesRefresh = useCallback((targetUserId?: string) => {
        const userId = targetUserId || session?.user.id;
        if (!userId || !isUuid(userId) || oracleMessagesRefreshTimeoutRef.current !== null) return;
        oracleMessagesRefreshTimeoutRef.current = window.setTimeout(() => {
            oracleMessagesRefreshTimeoutRef.current = null;
            void refreshOracleMessages(userId);
        }, 250);
    }, [session?.user.id, refreshOracleMessages]);

    const markNotificationRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ?{ ...n, read: true } : n));
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

    useEffect(() => {
        const userId = session?.user.id;
        if (!userId || !isUuid(userId)) return;

        const notificationsChannel = supabase
            .channel(`notifications-realtime-${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            }, () => {
                scheduleNotificationsRefresh(userId);
            })
            .subscribe();

        const oracleMessagesChannel = supabase
            .channel(`oracle-messages-realtime-${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'oracle_messages',
                filter: `user_id=eq.${userId}`,
            }, () => {
                scheduleOracleMessagesRefresh(userId);
            })
            .subscribe();

        return () => {
            if (notificationsRefreshTimeoutRef.current !== null) {
                window.clearTimeout(notificationsRefreshTimeoutRef.current);
                notificationsRefreshTimeoutRef.current = null;
            }
            if (oracleMessagesRefreshTimeoutRef.current !== null) {
                window.clearTimeout(oracleMessagesRefreshTimeoutRef.current);
                oracleMessagesRefreshTimeoutRef.current = null;
            }
            notificationsChannel.unsubscribe();
            oracleMessagesChannel.unsubscribe();
        };
    }, [session?.user.id, scheduleNotificationsRefresh, scheduleOracleMessagesRefresh]);

    useEffect(() => {
        const userId = session?.user.id;
        if (!userId || !isUuid(userId)) {
            seenNotificationIdsRef.current = new Set();
            notificationsHydratedRef.current = false;
            return;
        }

        const currentIds = notifications.map((notification) => notification.id);

        if (!notificationsHydratedRef.current) {
            seenNotificationIdsRef.current = new Set(currentIds);
            notificationsHydratedRef.current = true;
            return;
        }

        const unseenNotifications = notifications.filter((notification) => !seenNotificationIdsRef.current.has(notification.id));
        seenNotificationIdsRef.current = new Set(currentIds);

        if (document.visibilityState === 'visible') {
            unseenNotifications
                .filter((notification) => notification.type === 'clan_response' && /aprovou/i.test(notification.content))
                .forEach((notification) => {
                    const clanName = String(notification.metadata?.clanName || '').trim();
                    showToast(
                        clanName ? `VocÃª entrou em ${clanName}.` : 'Sua entrada no grupo foi aprovada.',
                        'success',
                    );
                });
        }

        if (
            unseenNotifications.length === 0 ||
            !oraclePreferences?.pushEnabled ||
            remotePushRegistered ||
            document.visibilityState === 'visible'
        ) {
            return;
        }

        const activeOracleMode = oraclePreferences.activeMode || 'neutro';
        const dmNotificationsEnabled = oraclePreferences.dmNotificationsEnabled ?? true;
        const visibleNotifications = getVisibleNotificationsForProfile(unseenNotifications, appMode, activeOracleMode)
            .filter((notification) => shouldPushNotificationForProfile(notification, appMode, activeOracleMode))
            .filter((notification) => dmNotificationsEnabled || notification.type !== 'direct_message')
            .filter((notification) => notification.type !== 'action_reminder');

        if (visibleNotifications.length === 0) {
            return;
        }

        void (async () => {
            const unreadDirectMessages = notifications.filter((notification) =>
                !notification.read
                && notification.type === 'direct_message'
                && (dmNotificationsEnabled || notification.type !== 'direct_message')
            );
            const directMessageNotifications = visibleNotifications.filter((notification) => notification.type === 'direct_message');
            const remainingNotifications = visibleNotifications.filter((notification) => notification.type !== 'direct_message');

            if (directMessageNotifications.length > 0) {
                const senderIds = unreadDirectMessages
                    .map((notification) => String(notification.metadata?.senderId || '').trim())
                    .filter(Boolean);
                const uniqueSenderIds = Array.from(new Set(senderIds));
                const latestDirectMessage = unreadDirectMessages[0] || directMessageNotifications[0];
                const senderNickname = String(latestDirectMessage?.metadata?.senderNickname || '').trim() || 'Nova mensagem direta';
                const preview = String(latestDirectMessage?.metadata?.messagePreview || '').trim();
                const unreadCount = unreadDirectMessages.length || directMessageNotifications.length;
                const directMessageUrl = (typeof latestDirectMessage?.metadata?.url === 'string' && latestDirectMessage.metadata.url.trim().length > 0)
                    ? latestDirectMessage.metadata.url
                    : '/?oracle=dms';
                const sameSender = uniqueSenderIds.length <= 1;
                const title = unreadCount > 1
                    ? (sameSender ? senderNickname : 'Mensagens diretas')
                    : senderNickname;
                const body = unreadCount > 1
                    ? (sameSender ? `${unreadCount} mensagens nao lidas` : `${unreadCount} mensagens diretas nao lidas`)
                    : (preview || 'Uma nova mensagem direta chegou para voce.');
                const tag = sameSender
                    ? `glyph-direct-message-${String(latestDirectMessage?.metadata?.senderId || session?.user.id || 'dm')}`
                    : `glyph-direct-message-${session?.user.id || 'dm'}`;

                await showLocalNotification({
                    title,
                    body,
                    tag,
                    url: directMessageUrl,
                    renotify: unreadCount > 1,
                });
            }

            for (const notification of remainingNotifications) {
                await showLocalNotification({
                    title: getNotificationTitle(notification),
                    body: getNotificationBody(notification, activeOracleMode),
                    tag: `glyph-notification-${notification.id}`,
                    url: typeof notification.metadata?.url === 'string' && notification.metadata.url.trim().length > 0
                        ? notification.metadata.url
                        : '/?oracle=notifications',
                });
            }
        })();
    }, [appMode, notifications, oraclePreferences?.activeMode, oraclePreferences?.dmNotificationsEnabled, oraclePreferences?.pushEnabled, remotePushRegistered, session?.user.id, showToast]);


    useEffect(() => {
        const userId = session?.user.id;
        if (!userId || !isUuid(userId)) {
            seenOracleMessageIdsRef.current = new Set();
            oracleMessagesHydratedRef.current = false;
            return;
        }

        const feedMessages = oracleMessages.filter((message) => message.deliveryType === 'feed');
        const currentIds = feedMessages.map((message) => message.id);

        if (!oracleMessagesHydratedRef.current) {
            seenOracleMessageIdsRef.current = new Set(currentIds);
            oracleMessagesHydratedRef.current = true;
            return;
        }

        const unseenMessages = feedMessages.filter((message) => !seenOracleMessageIdsRef.current.has(message.id));
        seenOracleMessageIdsRef.current = new Set(currentIds);

        if (
            unseenMessages.length === 0 ||
            !oraclePreferences?.pushEnabled ||
            !oraclePreferences?.notificationsEnabled ||
            remotePushRegistered ||
            document.visibilityState === 'visible'
        ) {
            return;
        }

        const latestMessage = unseenMessages
            .slice()
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];

        if (!latestMessage || !shouldPushOracleFeedMessage(
            latestMessage,
            appMode === 'BASIC' ? 'BASIC' : 'GAME',
            Boolean(oraclePreferences?.dailyFocusCardEnabled),
        )) {
            return;
        }

        const modeConfig = ORACLE_MODES[latestMessage.mode] || ORACLE_MODES.neutro;
        void showLocalNotification({
            title: `Oraculo - ${modeConfig.name}`,
            body: latestMessage.content,
            tag: `glyph-oracle-${latestMessage.id}`,
            url: '/?oracle=chat',
        });
    }, [appMode, oracleMessages, oraclePreferences?.dailyFocusCardEnabled, oraclePreferences?.notificationsEnabled, oraclePreferences?.pushEnabled, remotePushRegistered, session?.user.id]);

    useEffect(() => {
        const userId = session?.user.id;
        if (actionReminderTimeoutRef.current !== null) {
            window.clearTimeout(actionReminderTimeoutRef.current);
            actionReminderTimeoutRef.current = null;
        }

        if (
            !userId
            || !isUuid(userId)
            || !oraclePreferences?.pushEnabled
            || (remotePushRegistered && typeof document !== 'undefined' && document.visibilityState !== 'visible')
        ) {
            return;
        }

        const buildTaskDateTime = (dateString: string, startTime: number) => {
            const [year, month, day] = dateString.split('-').map(Number);
            if (!year || !month || !day || !Number.isFinite(startTime) || startTime < 0) return null;
            const date = new Date(year, month - 1, day, 0, 0, 0, 0);
            date.setMinutes(startTime);
            return date;
        };

        const formatReminderClock = (date: Date) =>
            date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let isCancelled = false;

        const emitActionReminder = async () => {
            if (isCancelled) return;

            const now = Date.now();
            const arenaById = new Map(allArenas.map((arena) => [arena.id, arena] as const));
            const actionById = new Map(actions.map((action) => [action.id, action] as const));
            let nextCheckDelay = ACTION_REMINDER_RECHECK_MS;

            for (const task of tasks) {
                if (task.completed || !Number.isFinite(task.startTime) || task.startTime < 0) continue;

                const action = actionById.get(task.actionId);
                const reminderMinutes = action?.context?.schedule?.notifyBeforeMinutes;
                if (!action || reminderMinutes !== 15) continue;

                const taskStartAt = buildTaskDateTime(task.date, task.startTime);
                if (!taskStartAt) continue;

                const reminderAt = taskStartAt.getTime() - (reminderMinutes * 60 * 1000);
                const reminderKey = getActionReminderStorageKey(userId, task.id, task.date, task.startTime);
                if (localStorage.getItem(reminderKey) === '1') continue;

                if (now < reminderAt) {
                    nextCheckDelay = Math.min(nextCheckDelay, Math.max(10 * 1000, reminderAt - now));
                    continue;
                }

                if (now > taskStartAt.getTime() + ACTION_REMINDER_LATE_GRACE_MS) continue;

                const arena = arenaById.get(action.arenaId);
                const hasAlreadyStarted = now >= taskStartAt.getTime();
                const delivered = await showLocalNotification({
                    title: hasAlreadyStarted ? `Agora: ${action.name}` : `Em 15 min: ${action.name}`,
                    body: hasAlreadyStarted
                        ? (arena ? `${arena.icon} ${arena.name} ja comecou.` : 'Sua acao ja comecou.')
                        : (arena ? `${arena.icon} ${arena.name} comeca as ${formatReminderClock(taskStartAt)}.` : `Sua acao comeca as ${formatReminderClock(taskStartAt)}.`),
                    tag: `glyph-action-reminder-${task.id}`,
                    url: '/?view=planner',
                });

                if (delivered) {
                    localStorage.setItem(reminderKey, '1');
                } else {
                    nextCheckDelay = Math.min(nextCheckDelay, 15 * 1000);
                }
            }

            if (isCancelled) return;
            actionReminderTimeoutRef.current = window.setTimeout(() => {
                actionReminderTimeoutRef.current = null;
                void emitActionReminder();
            }, Math.max(10 * 1000, nextCheckDelay));
        };

        const handleWake = () => {
            if (isCancelled) return;
            if (actionReminderTimeoutRef.current !== null) {
                window.clearTimeout(actionReminderTimeoutRef.current);
                actionReminderTimeoutRef.current = null;
            }
            void emitActionReminder();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleWake();
            }
        };

        void emitActionReminder();
        window.addEventListener('focus', handleWake);
        window.addEventListener('pageshow', handleWake);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isCancelled = true;
            if (actionReminderTimeoutRef.current !== null) {
                window.clearTimeout(actionReminderTimeoutRef.current);
                actionReminderTimeoutRef.current = null;
            }
            window.removeEventListener('focus', handleWake);
            window.removeEventListener('pageshow', handleWake);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [actions, allArenas, oraclePreferences?.pushEnabled, remotePushRegistered, session?.user.id, tasks]);

    // --- FORGE SYSTEM ---
    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    const fetchInventory = useCallback(async (userId: string) => {
        const { data, error } = await supabase.from('user_inventory').select('*').eq('user_id', userId);
        if (error) {
            console.error("Error fetching inventory:", error);
            return;
        }

        const isStaffUser = ['admin', 'gm', 'admin_gm'].includes((userProfile.role || '').toLowerCase());
        let inventoryRows = data || [];

        if (isStaffUser) {
            const ownedIds = new Set(
                inventoryRows.map((row: any) => resolveItemDef(row.item_id)?.id || row.item_id)
            );
            const missingCatalogItems = ITEMS_DB.filter(item => isItemCatalogVisible(item) && !ownedIds.has(item.id));

            if (missingCatalogItems.length > 0) {
                const { data: insertedRows, error: insertStaffError } = await supabase
                    .from('user_inventory')
                    .insert(missingCatalogItems.map(item => ({ user_id: userId, item_id: item.id })))
                    .select('*');

                if (insertStaffError) {
                    console.error('Error granting staff catalog inventory:', insertStaffError);
                } else if (insertedRows) {
                    inventoryRows = [...inventoryRows, ...insertedRows];
                }
            }
        }

        // Auto-grant Starter Pack (T1 Items) if inventory is empty
        if (!isStaffUser && inventoryRows.length === 0) {
            console.log("Inventory empty. Granting Starter Pack (v1.006)...");

            // IDs definidos no LOJA.MD e items.ts
            const starterItemIds = [
                'item_skin_1_001', // NÃ¡ufrago
                'item_skin_1_002', // Casual
                'item_artifact_1_001', // Adaga Aprendiz
                'item_orb_1_002',  // Orbe de Cobre
                'item_plate_1_001', // Placa Madeira
                'BASIC'            // Tema BÃ¡sico
            ];

            const starterItems = starterItemIds
                .map(itemId => resolveItemDef(itemId))
                .filter((item): item is ItemDef => !!item && isItemCatalogVisible(item));

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

                    // Welcome Notification
                    void SupabaseService.createNotification(
                        userId,
                        'system',
                        'Bem-vindo ao OrÃ¡culo! Seu Starter Pack foi entregue. Explore as Arenas e o Planner para comeÃ§ar sua jornada.'
                    ).then(() => fetchNotifications());

                    // Set initial rank and exp if needed (Vagante Level 1)
                    // O level do usuÃ¡rio Ã© a soma dos nÃ­veis dos assets.
                    // Vamos garantir que o perfil comece com os dados corretos.
                    updateUserProfile({
                        nobility: { exp: 0, rankId: 'vagante' },
                        level: 1 // ForÃ§ar nÃ­vel 1 inicial
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

        const items = inventoryRows.map((row: any) => {
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
    }, [userProfile.role]);

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

    const promptGoldShortage = useCallback((detail: {
        requiredGold: number;
        label?: string;
        storeTab?: 'store' | 'codexes' | 'items' | 'forge';
        section?: string | null;
    }) => {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('gold-shortage', {
            detail: {
                requiredGold: detail.requiredGold,
                currentGold: Number(userProfile.wallet?.gold || 0),
                label: detail.label || 'esta compra',
                storeTab: detail.storeTab || 'store',
                section: detail.section || 'packs',
            },
        }));
    }, [userProfile.wallet?.gold]);

    const buyGoldPack = async (packId: string) => {
        const pack = GOLD_PACKS.find(p => p.id === packId);
        if (!pack) return;
        const userId = getSupabaseUserId();
        if (!userId) return;

        const { data, error } = await withLatencyToast<{ data: any, error: any }>(
            supabase.rpc('buy_gold_pack', {
                p_pack_id: packId,
                p_amount_gold: pack.total,
                p_cost_brl: pack.price
            }) as any
        );

        if (error) {
            console.error("Error buying gold pack:", error);
            showToast("Falha na sincronizaÃ§Ã£o de dados. Tente novamente ou verifique a conexÃ£o.", "error");
            return;
        }

        if (data && data.success) {
            updateUserProfile({ wallet: { ...userProfile.wallet, gold: data.new_gold } });
            showToast(`CrÃ©dito de ${pack.total} Ouro identificado.`, "success");
        }
    };

    const buyStoreItem = async (
        itemId: string,
        type: 'premium' | 'codex' | 'exclusive' | 'boost',
        options?: { costOverrideGold?: number; successMessage?: string },
    ) => {
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
            if (!isItemCatalogVisible(item)) {
                showToast("Este item ainda esta fora do jogo enquanto a arte final nao fica pronta.", "error");
                return;
            }
            cost = item.costGold;
            name = item.name;
        } else if (type === 'boost') {
            const item = getGoldBoostProduct(itemId);
            if (!item) return;
            cost = options?.costOverrideGold ?? item.priceGold;
            name = item.name;
        } else if (type === 'premium') {
            const membershipProduct = getGoldMembershipProduct(itemId);
            if (!membershipProduct) return;
            cost = options?.costOverrideGold ?? membershipProduct.priceGold;
            name = membershipProduct.name;
        }

        if ((userProfile.wallet?.gold || 0) < cost) {
            const missingGold = Math.max(0, cost - Number(userProfile.wallet?.gold || 0));
            showToast(`Saldo insuficiente. Faltam ${missingGold} de ouro para ${name || 'essa compra'}.`, "warning");
            if (type === 'premium') {
                window.dispatchEvent(new CustomEvent('navigate-to-store', {
                    detail: {
                        tab: 'store',
                        section: 'packs',
                    },
                }));
                return;
            }

            promptGoldShortage({
                requiredGold: cost,
                label: name || 'essa compra',
                storeTab: type === 'exclusive' ? 'items' : 'store',
                section: type === 'boost' ? 'boosts' : 'packs',
            });
            return;
        }

        if ((userProfile.wallet?.gold || 0) < cost) {
            showToast("Saldo insuficiente para esta operaÃ§Ã£o.", "error");
            setTimeout(() => {
                const mundoContainer = document.getElementById('social-container');
                if (mundoContainer) {
                    const storeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('LOJA'));
                    if (storeBtn) storeBtn.click();
                } else {
                    window.dispatchEvent(new CustomEvent('navigate-to-store'));
                }
            }, 1500);
            return;
        }

        const { data, error } = await withLatencyToast<{ data: any, error: any }>(
            supabase.rpc('buy_store_item', {
                p_item_id: itemId,
                p_cost_gold: cost,
                p_type: type
            }) as any
        );

        if (error) {
            console.error("Error buying store item:", error);
            showToast("Falha na sincronizaÃ§Ã£o de dados. Tente novamente ou verifique a conexÃ£o.", "error");
            return;
        }

        // Update Local State Optimistically or Refetch
        const newGold = (userProfile.wallet?.gold || 0) - cost;
        updateUserProfile({ wallet: { ...userProfile.wallet, gold: newGold } });

        if (type === 'exclusive') {
            fetchInventory(userId);
        } else if (type === 'codex') {
            grantUserUnlock('codexes', itemId);
        } else if (type === 'boost') {
            const boost = getGoldBoostProduct(itemId);
            if (!boost) return;

            const expBoostExpiresAt = getNextExpBoostExpiryAt(boost.durationHours, userProfile.expBoostExpiresAt);
            updateUserProfile({
                expBoostMultiplier: boost.multiplier ?? 1,
                expBoostExpiresAt,
                expBoostProductId: boost.id,
            });
            showToast(`Debito de ${cost} Ouro confirmado. ${boost.name} ativo.`, "success");
            return;
        } else if (type === 'premium') {
            const membershipProduct = getGoldMembershipProduct(itemId) || GOLD_PREMIUM_PRODUCT;
            const premiumExpiresAt = getNextPremiumExpiryAt(userProfile.premiumExpiresAt);
            const nextSubscriptionTier = membershipProduct.tier;
            const currentLegacyCredits = Math.max(0, Number(userProfile.legacyProjectionSceneCredits || 0));
            const currentCampaignQuizFreeCredits = Math.max(0, Number(userProfile.campaignQuizFreeCredits || 0));
            const currentCampaignQuizMediumCredits = Math.max(0, Number(userProfile.campaignQuizMediumCredits || 0));
            let premiumRewardPayload: RewardModalPayload;
            let legacyProjectionSceneCredits = currentLegacyCredits;
            let campaignQuizFreeCredits = currentCampaignQuizFreeCredits;
            let campaignQuizMediumCredits = currentCampaignQuizMediumCredits;

            if (nextSubscriptionTier === 'platinum') {
                const platinumReward = await unlockPlatinumPack(premiumExpiresAt);
                premiumRewardPayload = platinumReward.payload;
                legacyProjectionSceneCredits += platinumReward.legacySceneCreditsGranted;
                campaignQuizFreeCredits += platinumReward.campaignQuizFreeCreditsGranted;
                campaignQuizMediumCredits += platinumReward.campaignQuizMediumCreditsGranted;
            } else {
                const premiumReward = await unlockPremiumPack(premiumExpiresAt);
                premiumRewardPayload = premiumReward.payload;
                campaignQuizFreeCredits += premiumReward.campaignQuizFreeCreditsGranted;
                campaignQuizMediumCredits += premiumReward.campaignQuizMediumCreditsGranted;
            }

            updateUserProfile({
                isPremium: true,
                premiumExpiresAt,
                subscriptionTier: nextSubscriptionTier,
                premiumRewardPending: true,
                premiumRewardPayload,
                legacyProjectionSceneCredits,
                campaignQuizFreeCredits,
                campaignQuizMediumCredits,
            });
            showToast(
                options?.successMessage
                    || `Debito de ${cost} Ouro confirmado. ${nextSubscriptionTier === 'platinum' ? 'Platinum' : 'Premium'} renovado por 30 dias.`,
                "success",
            );
            return;
        }

        showToast(`DÃ©bito de ${cost} Ouro. Ativo adicionado ao Arsenal.`, "success");
    };

    const recycleItem = async (instanceId: string) => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        const { data, error } = await withLatencyToast<{ data: any, error: any }>(
            supabase.rpc('recycle_item', {
                p_item_instance_id: instanceId
            }) as any
        );

        if (error) {
            console.error("Error recycling:", error);
            showToast("Falha na sincronizaÃ§Ã£o de dados. Tente novamente ou verifique a conexÃ£o.", "error");
            return;
        }

        if (data && data.success) {
            setInventory(prev => prev.filter(i => i.instanceId !== instanceId));
            const newFragments = (userProfile.wallet?.fragments || 0) + data.fragments_gained;
            updateUserProfile({ wallet: { ...userProfile.wallet, fragments: newFragments } });

            showToast(`Item desconstruÃ­do. ${data.fragments_gained} Fragmentos adicionados ao inventÃ¡rio.`, "success");
        }
    };

    const craftItem = async (tier: number, category?: string, exactItemId?: string) => {
        const userId = getSupabaseUserId();
        if (!userId) return null;

        const { data, error } = await withLatencyToast<{ data: any, error: any }>(
            supabase.rpc('craft_item', {
                p_tier: tier,
                p_category: category,
                p_exact_item_id: exactItemId
            }) as any
        );

        if (error) {
            console.error("Error crafting:", error);
            showToast("Falha na sincronizaÃ§Ã£o de dados. Tente novamente ou verifique a conexÃ£o.", "error");
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

            showToast(`Recurso forjado com sucesso. Ativo de Patamar ${tier} adicionado.`, "success");

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
            (itemDef.category === 'artifact' && userProfile.sovereign.artifact === item.id) ||
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
                updateUserProfile({ skin: 'BASIC' }); // Default skin
                showToast('ConfiguraÃ§Ã£o estÃ©tica alterada. Novo ativo equipado.', 'success');
            } else if (itemDef.category === 'banner') {
                updateUserProfile({ bannerUrl: '' });
            } else {
                const newSovereign = { ...userProfile.sovereign };
                if (itemDef.category === 'skin') newSovereign.outfit = 'none';
                if (itemDef.category === 'hair') newSovereign.hairStyle = 'none';
                if (itemDef.category === 'artifact') newSovereign.artifact = 'none';
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
                showToast(`ConfiguraÃ§Ã£o estÃ©tica alterada. Novo ativo equipado.`, 'success');
            } else if (itemDef.category === 'banner') {
                updateUserProfile({ bannerUrl: itemDef.imageUrl || '' });
            } else {
                const newSovereign = { ...userProfile.sovereign };
                if (itemDef.category === 'skin') newSovereign.outfit = itemDef.id;
                if (itemDef.category === 'hair') newSovereign.hairStyle = itemDef.id;
                if (itemDef.category === 'artifact') newSovereign.artifact = itemDef.id;
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
            setUpcomingCycle(null);
            // SincronizaÃ§Ã£o inicial do Sitrep (Daily Commitment) - SerÃ¡ carregado via effect abaixo
            setDailyCommitmentState(createDefaultDailyCommitment());
            setCycleExpBonus(0);
            setLevelUnlocks(buildDefaultLevelUnlocks());
            setClanQuestProgress({});
            setClanQuestParticipants({});
            setUserMissionParticipations({});

            // Profile with Local Storage
            const sessionUser = session?.user;
            let nextProfile = {
                ...DEFAULT_USER_PROFILE,
                id: currentUserId,
                email: sessionUser?.email || '',
                nickname: sessionUser?.user_metadata?.full_name || sessionUser?.user_metadata?.name || DEFAULT_USER_PROFILE.nickname,
                avatarUrl: sessionUser?.user_metadata?.avatar_url || DEFAULT_USER_PROFILE.avatarUrl,
                isOnline: true
            };
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

    const persistFairScoreReports = useCallback(async (nextReports: Report[]) => {
        const userId = getSupabaseUserId();
        if (!userId || nextReports.length === 0) return;

        await Promise.all(nextReports
            .filter((report) => !!report.cycleId)
            .map(async (report) => {
                const snakeCaseReport = {
                    ...mapToSnakeCase(report),
                    user_id: userId,
                };

                const { error } = await supabase
                    .from('cycles')
                    .update({
                        report_data: snakeCaseReport,
                        performance_score: report.performanceScore,
                    })
                    .eq('id', report.cycleId);

                if (error) {
                    console.error('Error persisting fair score report:', error.message);
                }
            }));
    }, [getSupabaseUserId]);

    const normalizeLoadedReportFromCycleRow = useCallback((row: any): Report | null => {
        if (!row?.report_data) return null;

        const rawReport = mapToCamelCase(row.report_data) as Partial<Report>;
        const fallbackDate = getLocalDateString();
        const startDate = String(rawReport.startDate || row.start_date || row.end_date || fallbackDate);
        const endDate = String(rawReport.endDate || row.end_date || row.start_date || startDate);
        const rawMetrics = rawReport.metrics && typeof rawReport.metrics === 'object' ? rawReport.metrics : {};
        const rawHighlight = rawReport.highlight && typeof rawReport.highlight === 'object' ? rawReport.highlight : {};

        return {
            id: String(rawReport.id || row.id),
            cycleId: String(rawReport.cycleId || row.id),
            startDate,
            endDate,
            performanceScore: Number(rawReport.performanceScore ?? row.performance_score ?? 0),
            cycleName: String(rawReport.cycleName || row.name || 'Ciclo'),
            seasonId: rawReport.seasonId || row.season_id || undefined,
            clanPoints: typeof rawReport.clanPoints === 'number' ? rawReport.clanPoints : Number(rawReport.clanPoints || 0),
            expGained: typeof rawReport.expGained === 'number' ? rawReport.expGained : Number(rawMetrics.expGained || rawReport.expGained || 0),
            identitySnapshot: rawReport.identitySnapshot,
            metrics: {
                actionsCompleted: Number(rawMetrics.actionsCompleted || 0),
                totalPlannedActions: Number(rawMetrics.totalPlannedActions || 0),
                arenasInvolved: Number(rawMetrics.arenasInvolved || 0),
                goalsMet: Number(rawMetrics.goalsMet || 0),
                plannedMetas: Number(rawMetrics.plannedMetas || rawMetrics.goalsMet || 0),
                sealedMetas: Number(rawMetrics.sealedMetas || rawMetrics.goalsMet || 0),
                totalHours: Number(rawMetrics.totalHours || 0),
                questsCompleted: Number(rawMetrics.questsCompleted || 0),
                consistencyDays: Number(rawMetrics.consistencyDays || 0),
                expGained: Number(rawMetrics.expGained || rawReport.expGained || 0),
                plannedEndDate: rawMetrics.plannedEndDate,
                avgHoursPerDay: typeof rawMetrics.avgHoursPerDay === 'number' ? rawMetrics.avgHoursPerDay : undefined,
                maxStreak: Number(rawMetrics.maxStreak || 0),
                bestDay: rawMetrics.bestDay,
                bestDayCount: Number(rawMetrics.bestDayCount || 0),
                daysWithoutCompletion: Number(rawMetrics.daysWithoutCompletion || 0),
                executionRatePct: typeof rawMetrics.executionRatePct === 'number' ? rawMetrics.executionRatePct : undefined,
                timeElapsedPct: typeof rawMetrics.timeElapsedPct === 'number' ? rawMetrics.timeElapsedPct : undefined,
                paceDeltaPct: typeof rawMetrics.paceDeltaPct === 'number' ? rawMetrics.paceDeltaPct : undefined,
                top3Actions: Array.isArray(rawMetrics.top3Actions) ? rawMetrics.top3Actions : [],
                weeklyAtlas: Array.isArray(rawMetrics.weeklyAtlas) ? rawMetrics.weeklyAtlas : [],
                scoreModelVersion: rawMetrics.scoreModelVersion,
                fairness: rawMetrics.fairness,
                scoreBreakdown: rawMetrics.scoreBreakdown,
            },
            highlight: {
                mostFocusedArena: String(rawHighlight.mostFocusedArena || 'Sem arena'),
                mostFocusedArenaId: rawHighlight.mostFocusedArenaId,
                mostRepeatedAction: String(rawHighlight.mostRepeatedAction || 'Nenhuma'),
                mostRepeatedActionCount: Number(rawHighlight.mostRepeatedActionCount || 0),
            },
            assetProgress: Array.isArray(rawReport.assetProgress) ? rawReport.assetProgress : [],
        };
    }, []);

    const dedupeLoadedHistoryReports = useCallback((loadedReports: Report[]) => {
        const sortedByPriority = [...loadedReports].sort((left, right) => {
            const leftCapturedAt = new Date(left.identitySnapshot?.capturedAt || 0).getTime();
            const rightCapturedAt = new Date(right.identitySnapshot?.capturedAt || 0).getTime();
            if (rightCapturedAt !== leftCapturedAt) return rightCapturedAt - leftCapturedAt;

            const performanceDelta = (right.performanceScore || 0) - (left.performanceScore || 0);
            if (performanceDelta !== 0) return performanceDelta;

            const plannedDelta = (right.metrics?.totalPlannedActions || 0) - (left.metrics?.totalPlannedActions || 0);
            if (plannedDelta !== 0) return plannedDelta;

            return String(right.cycleId || right.id).localeCompare(String(left.cycleId || left.id));
        });

        const seenKeys = new Set<string>();
        return sortedByPriority.filter((report) => {
            const normalizedCycleName = String(report.cycleName || 'ciclo')
                .trim()
                .toLowerCase()
                .replace(/\s+/g, ' ');
            const duplicateKey = `${report.startDate}::${report.endDate}::${normalizedCycleName}`;
            if (seenKeys.has(duplicateKey)) {
                return false;
            }

            seenKeys.add(duplicateKey);
            return true;
        });
    }, []);

    const hydrateReportsWithFairScore = useCallback((loadedReports: Report[]) => {
        const normalizedReports = loadedReports.map((report) => ({
            ...report,
            cycleId: report.cycleId,
        }));
        return recalculateReportsWithFairScore(normalizedReports);
    }, []);

    // Online Only: Removed local storage migration and persistence
    // State reset is now handled in the session change effect above.

    const [activeCycle, setActiveCycle] = useState<Cycle | null>(() => null);
    const [upcomingCycle, setUpcomingCycle] = useState<Cycle | null>(() => null);

    const [clan, setClan] = useState<Clan | null>(() => null);

    const [enrichedClanMembers, setEnrichedClanMembers] = useState<EnrichedClanMember[]>([]);

    const [friends, setFriends] = useState<UserProfile[]>(() => []);
    const [friendRequestsIncoming, setFriendRequestsIncoming] = useState<FriendRequest[]>([]);
    const [friendRequestsOutgoing, setFriendRequestsOutgoing] = useState<FriendRequest[]>([]);
    const [clanJoinRequestsIncoming, setClanJoinRequestsIncoming] = useState<ClanJoinRequest[]>([]);
    const [clanJoinRequestsOutgoing, setClanJoinRequestsOutgoing] = useState<ClanJoinRequest[]>([]);
    const friendsRef = useRef<UserProfile[]>([]);

    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() => [...defaultChecklistItems]);
    const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>(() => [...defaultSequenceItems]);
    const sequenceItemsHydratedRef = useRef(false);

    const [achievementUnlocked, setAchievementUnlocked] = useState<{ type: FeedEventType; data: any; } | null>(null);
    const [feed, setFeed] = useState<FeedEvent[]>(() => []);

    useEffect(() => {
        friendsRef.current = friends;
    }, [friends]);

    const fetchSocialFeed = useCallback(async () => {
        const userId = getSupabaseUserId();
        if (!userId || !isUuid(userId)) {
            setFeed([]);
            return;
        }

        const { data, error } = await supabase
            .from('social_feed_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(120);

        if (error) {
            const message = String(error.message || '');
            if (message.includes('social_feed_events')) {
                return;
            }
            console.error('Error fetching social feed:', error.message);
            return;
        }

        setFeed((data || []).map(mapFeedEventFromDbRow));
    }, [getSupabaseUserId]);

    useEffect(() => {
        const userId = session?.user.id;
        if (!userId || !isUuid(userId)) {
            setFeed([]);
            return;
        }

        void fetchSocialFeed();
        const intervalId = window.setInterval(() => {
            void fetchSocialFeed();
        }, 30000);

        return () => window.clearInterval(intervalId);
    }, [session?.user.id, fetchSocialFeed]);

    const [clanQuestProgress, setClanQuestProgress] = useState<Record<string, Record<string, number>>>(() => ({}));

    const [clanQuestParticipants, setClanQuestParticipants] = useState<Record<string, number>>({});
    const [userMissionParticipations, setUserMissionParticipations] = useState<Record<string, boolean>>({}); // missionId -> boolean
    const getCurrentClanRole = useCallback((): 'leader' | 'member' | null => {
        const currentUserId = getSupabaseUserId();
        if (!currentUserId) return null;
        return enrichedClanMembers.find((member) => member.id === currentUserId)?.role || null;
    }, [enrichedClanMembers]);

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

            // Verificar se o usuÃ¡rio atual estÃ¡ participando
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

        // Fallback para o mÃ©todo antigo (contar aÃ§Ãµes) se a tabela nova estiver vazia ou der erro
        // Contar usuÃ¡rios que tÃªm a aÃ§Ã£o correspondente
        const { count, error } = await supabase
            .from('actions')
            .select('user_id', { count: 'exact', head: true })
            .eq('name', actionName)
            .in('user_id', enrichedClanMembers.map(m => m.id));

        if (!error && count !== null) {
            setClanQuestParticipants(prev => ({ ...prev, [questId]: count }));
            // No fallback, assumimos que se tem a aÃ§Ã£o, estÃ¡ participando (aproximaÃ§Ã£o)
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

        // Garantir que o progresso da missÃ£o existe (caso tenha sido deletado manualmente)
        const quest = findSeasonQuestById(questId);
        const targetValue = quest?.requirements?.clanGoal || quest?.goal_value || quest?.actionTemplate?.repetitions || 1;

        await supabase.from('clan_mission_progress').upsert({
            clan_id: clan.id,
            mission_id: questId,
            target_value: targetValue,
            current_value: 0 // ComeÃ§a com 0 se nÃ£o existir
        }, { onConflict: 'clan_id,mission_id', ignoreDuplicates: true }); // Se jÃ¡ existir, NÃ’O sobrescreve (manh?tÃ©m o progresso atual)
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
    const activeRuntimeSeason = useMemo(() => resolveRuntimeActiveSeason(seasons), [seasons]);
    const activeRuntimeSeasonId = activeRuntimeSeason?.id || ACTIVE_SEASON_ID;
    const activeRuntimeSeasonConfig = useMemo(
        () => resolveSeasonConfigForSeason(activeRuntimeSeason) || SEASONS[activeRuntimeSeasonId] || null,
        [activeRuntimeSeason, activeRuntimeSeasonId],
    );

    useEffect(() => {
        if (!activeRuntimeSeason) return;

        setSeasons((prev) => {
            const hasResolvedSeason = prev.some((season) => season.id === activeRuntimeSeason.id);
            const nextSeasons = prev.map((season) => ({
                ...season,
                is_active: season.id === activeRuntimeSeason.id,
            }));

            if (!hasResolvedSeason) {
                nextSeasons.push({ ...activeRuntimeSeason, is_active: true });
            }

            const isSameLength = nextSeasons.length === prev.length;
            const isSameContent = isSameLength && nextSeasons.every((season, index) => {
                const previous = prev[index];
                return previous
                    && previous.id === season.id
                    && previous.is_active === season.is_active
                    && previous.name === season.name
                    && previous.start_date === season.start_date
                    && previous.end_date === season.end_date
                    && previous.background_png_url === season.background_png_url
                    && previous.lore_text === season.lore_text;
            });

            return isSameContent ? prev : nextSeasons;
        });
    }, [activeRuntimeSeason]);

    const seasonQuests = useMemo(() => {
        // Default quests from constant
        let quests: SeasonQuest[] = [];
        if (activeRuntimeSeasonConfig) {
            quests = activeRuntimeSeasonConfig.quests.map(q => ({
                id: q.id,
                title: q.title,
                description: q.description,
                type: q.type,
                category: q.category,
                actionTemplate: q.actionTemplate,
                requirements: q.requirements,
                rewards: q.rewards,
                season_id: q.season_id || activeRuntimeSeasonId,
                goal_type: q.goal_type,
                goal_value: q.goal_value,
                reward_type: q.reward_type,
                reward_value: q.reward_value,
                maxParticipants: q.maxParticipants,
                tutorialLevel: q.tutorialLevel,
                clanConfig: q.clanConfig,
            })) as SeasonQuest[];
        }

        const targetSeasonId = activeRuntimeSeasonId;
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
                icon: m.icon || '?',
                repetitions: m.goal_value || 1,
                isMilestone: m.requirements?.milestone || false
            },
            requirements: m.requirements || {
                totalReps: m.goal_value || 1,
                clanGoal: m.type === 'clan' ?(m.goal_value || 1) : undefined,
                milestone: m.requirements?.milestone || false
            },
            rewards: {
                xp: m.reward_type === 'exp' ?Number(m.reward_value) : 0,
                items: m.reward_type === 'item_id' ?[String(m.reward_value)] : []
            },
            season_id: m.season_id
        }));

        return [...quests, ...mappedMissions];
    }, [activeRuntimeSeasonConfig, activeRuntimeSeasonId, seasonMissions]);

    const findSeasonQuestById = useCallback((questId: string) => {
        const dbQuest = seasonQuests.find(q => q.id === questId);
        if (dbQuest) return dbQuest;
        return Object.values(SEASONS)
            .flatMap(season => season.quests)
            .find(q => q.id === questId) || null;
    }, [seasonQuests]);

    const findSeasonMissionById = useCallback((missionId: string) => {
        return seasonMissions.find(m => m.id === missionId)
            || GM_CONFIG.seasonMissions.find(m => m.id === missionId)
            || null;
    }, [seasonMissions]);

    const findClanQuestByActionName = useCallback((actionName?: string) => {
        if (!actionName) return null;
        const normalized = normalizeDomainLabel(actionName);

        const directMatch = seasonQuests.find(q =>
            q.type === 'clan'
            && normalizeDomainLabel(q.actionTemplate?.name) === normalized
        );
        if (directMatch) return directMatch;

        const byTitle = seasonQuests.find(q =>
            q.type === 'clan'
            && normalizeDomainLabel(q.title) === normalized
        );
        if (byTitle) return byTitle;

        return null;
    }, [seasonQuests]);

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
    const joinClanInFlightRef = useRef<Set<string>>(new Set());
    const staleSeasonQuestCleanupKeyRef = useRef<string | null>(null);
    const enableClanQuestProgress = true; // Always enable for now
    const clanQuestProgressTableReadyRef = useRef(enableClanQuestProgress);
    const pendingGuestMigrationRef = useRef<{ fromId: string; toId: string } | null>(null);
    const suspendPersistenceRef = useRef(false);
    const autoFinishingCycleRef = useRef<string | null>(null);
    const pendingProfilePatchRef = useRef<Partial<UserProfile> | null>(null);
    const profileUpdateInFlightRef = useRef<Record<string, boolean>>({});
    const seasonLaunchRewardInFlightRef = useRef<Record<string, boolean>>({});
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
            // Extrair informaÃ§Ãµes do clÃ£ se existirem
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
            // Usar rate limiter para controlar nÃºmero de requisiÃ§Ãµes simultÃ¢neas
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

            if (profileIdsToHydrate.length > 0) {
                const profiles = await hydrateProfilesByIds(profileIdsToHydrate);
                
                // Hydrate requests with profiles
                setFriendRequestsIncoming(incomingRequests.map(req => ({
                    ...req,
                    senderProfile: profiles[req.senderId]
                })));
                setFriendRequestsOutgoing(outgoingRequests.map(req => ({
                    ...req,
                    recipientProfile: profiles[req.recipientId]
                })));

                // Criar array de perfis de amigos a partir dos IDs
                const friendProfiles = friendIds.map(id => profiles[id]).filter(Boolean);
                setFriends(friendProfiles);
            } else {
                setFriends([]);
                setFriendRequestsIncoming(incomingRequests);
                setFriendRequestsOutgoing(outgoingRequests);
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
                supabase.from('clan_join_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false })
            );

            const { data, error } = result;
            if (error || !data) {
                if (error) console.error('Error fetching outgoing clan join requests:', error.message);
                setClanJoinRequestsOutgoing([]);
                return;
            }
            const mapped = mapToCamelCase(data || []) as ClanJoinRequest[];
            const pending = mapped.filter(r => r.status === 'pending');
            const clanIds = [...new Set(pending.map(request => request.clanId).filter(isUuid))];

            if (clanIds.length === 0) {
                setClanJoinRequestsOutgoing(pending);
                return;
            }

            const { data: clansData, error: clansError } = await supabase
                .from('clans')
                .select('*')
                .in('id', clanIds);

            if (clansError) {
                console.error('Error hydrating outgoing clan request clans:', clansError.message);
                setClanJoinRequestsOutgoing(pending);
                return;
            }

            const clansById = (mapToCamelCase(clansData || []) as Clan[]).reduce((acc, nextClan) => {
                acc[nextClan.id] = nextClan;
                return acc;
            }, {} as Record<string, Clan>);

            setClanJoinRequestsOutgoing(pending.map(request => ({
                ...request,
                clanProfile: clansById[request.clanId],
            })));
        } catch (error) {
            console.error('Error in loadClanJoinRequestsOutgoing:', error);
            setClanJoinRequestsOutgoing([]);
        }
    }, []);

    const loadClanJoinRequestsIncoming = useCallback(async (clanId: string) => {
        const { data, error } = await supabase.from('clan_join_requests').select('*').eq('clan_id', clanId).order('created_at', { ascending: false });
        if (error || !data) {
            if (error) console.error('Error fetching incoming clan join requests:', error.message);
            setClanJoinRequestsIncoming([]);
            return;
        }
        const mapped = mapToCamelCase(data || []) as ClanJoinRequest[];
        const pending = mapped.filter(r => r.status === 'pending');
        const profilesById = await hydrateProfilesByIds(pending.map(r => r.userId));
        setClanJoinRequestsIncoming(pending.map(req => ({ ...req, requesterProfile: profilesById[req.userId] })));
    }, [hydrateProfilesByIds]);

    const scheduleFriendsAndRequestsRefresh = useCallback((userId: string) => {
        if (!isUuid(userId) || socialFriendsRefreshTimeoutRef.current !== null) return;
        socialFriendsRefreshTimeoutRef.current = window.setTimeout(() => {
            socialFriendsRefreshTimeoutRef.current = null;
            void loadFriendsAndRequests(userId);
        }, 250);
    }, [loadFriendsAndRequests]);

    const scheduleClanJoinRequestsOutgoingRefresh = useCallback((userId: string) => {
        if (!isUuid(userId) || socialClanOutgoingRefreshTimeoutRef.current !== null) return;
        socialClanOutgoingRefreshTimeoutRef.current = window.setTimeout(() => {
            socialClanOutgoingRefreshTimeoutRef.current = null;
            void loadClanJoinRequestsOutgoing(userId);
        }, 250);
    }, [loadClanJoinRequestsOutgoing]);

    const scheduleClanJoinRequestsIncomingRefresh = useCallback((clanId: string) => {
        if (!isUuid(clanId) || socialClanIncomingRefreshTimeoutRef.current !== null) return;
        socialClanIncomingRefreshTimeoutRef.current = window.setTimeout(() => {
            socialClanIncomingRefreshTimeoutRef.current = null;
            void loadClanJoinRequestsIncoming(clanId);
        }, 250);
    }, [loadClanJoinRequestsIncoming]);

    useEffect(() => {
        const userId = session?.user.id;
        if (!userId || !isUuid(userId)) return;

        const isClanLeader = getCurrentClanRole() === 'leader';
        const socialRequestsChannel = supabase
            .channel(`social-requests-realtime-${userId}-${clan?.id || 'no-clan'}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'friend_requests',
                filter: `recipient_id=eq.${userId}`,
            }, () => {
                scheduleFriendsAndRequestsRefresh(userId);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'friend_requests',
                filter: `sender_id=eq.${userId}`,
            }, () => {
                scheduleFriendsAndRequestsRefresh(userId);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clan_join_requests',
                filter: `user_id=eq.${userId}`,
            }, () => {
                scheduleClanJoinRequestsOutgoingRefresh(userId);
                window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            });

        socialRequestsChannel
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'relationship_link_invites',
                filter: `recipient_id=eq.${userId}`,
            }, () => {
                window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'relationship_link_invites',
                filter: `sender_id=eq.${userId}`,
            }, () => {
                window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'relationship_links',
                filter: `mentor_id=eq.${userId}`,
            }, () => {
                window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'relationship_links',
                filter: `pupil_id=eq.${userId}`,
            }, () => {
                window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            });

        if (clan?.id && isClanLeader) {
            socialRequestsChannel.on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clan_join_requests',
                filter: `clan_id=eq.${clan.id}`,
            }, () => {
                scheduleClanJoinRequestsIncomingRefresh(clan.id);
                window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            });
        }

        socialRequestsChannel.subscribe();

        return () => {
            if (socialFriendsRefreshTimeoutRef.current !== null) {
                window.clearTimeout(socialFriendsRefreshTimeoutRef.current);
                socialFriendsRefreshTimeoutRef.current = null;
            }
            if (socialClanOutgoingRefreshTimeoutRef.current !== null) {
                window.clearTimeout(socialClanOutgoingRefreshTimeoutRef.current);
                socialClanOutgoingRefreshTimeoutRef.current = null;
            }
            if (socialClanIncomingRefreshTimeoutRef.current !== null) {
                window.clearTimeout(socialClanIncomingRefreshTimeoutRef.current);
                socialClanIncomingRefreshTimeoutRef.current = null;
            }
            supabase.removeChannel(socialRequestsChannel);
        };
    }, [
        session?.user.id,
        clan?.id,
        getCurrentClanRole,
        userProfile.id,
        scheduleFriendsAndRequestsRefresh,
        scheduleClanJoinRequestsOutgoingRefresh,
        scheduleClanJoinRequestsIncomingRefresh,
    ]);

    const clearClanRuntimeState = useCallback(() => {
        clanCacheRef.current = null;
        setClan(null);
        setEnrichedClanMembers([]);
        setClanJoinRequestsIncoming([]);
        setClanJoinRequestsOutgoing([]);
        setClanQuestProgress({});
        setClanQuestParticipants({});
        setUserMissionParticipations({});
        setUserProfile(prev => ({ ...prev, clanName: undefined, clanIcon: undefined }));
    }, []);

    const deleteClanScopedRows = useCallback(async (table: string, clanId: string) => {
        const { error } = await supabase.from(table).delete().eq('clan_id', clanId);
        if (!error) return;

        const message = String(error.message || '');
        const code = String((error as any)?.code || '');
        const relationMissing = code === '42P01' || message.includes('relation') || message.includes('does not exist');
        if (!relationMissing) {
            console.error(`Error deleting ${table} for clan cleanup:`, error.message);
        }
    }, []);

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
        const today = getLocalDateString();

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

        // Fetch member count to scale decay
        const { count: memberCount } = await supabase.from('clan_members').select('*', { count: 'exact', head: true }).eq('clan_id', clanId);
        const members = memberCount || 1;

        // Fetch all presence for the clan to calculate stays
        const { data: presenceData } = await supabase.from('clan_aldeia_presence').select('*').eq('clan_id', clanId);
        const presences = presenceData ?(mapToCamelCase(presenceData) as AldeiaPresence[]) : [];

        // Calculate total clan energy for Resonance (25% of all stay minutes)
        let totalClanMinutes = 0;
        const now = new Date();
        presences.forEach(p => {
            const startedAt = new Date(p.startedAt).getTime();
            const elapsedMinutes = Math.floor((now.getTime() - startedAt) / 60000);
            totalClanMinutes += Math.max(0, Math.min(30, elapsedMinutes));
        });
        const villageResonanceBonus = (totalClanMinutes * 0.25) / 6; // 25% split across 6 slots

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

            // CASUAL CLAN: Refined Session-based growth
            const slotPresences = presences.filter(p => p.slotId === slot.slotId);
            let slotGain = 0;

            // First member to complete 30 mins gives +15. Others give +5.
            // We sort by elapsed time to find who "did 30 mins" first or most.
            const participantsByTime = slotPresences.map(p => {
                const startedAt = new Date(p.startedAt).getTime();
                return Math.floor((now.getTime() - startedAt) / 60000);
            }).filter(minutes => minutes >= 30);

            if (participantsByTime.length > 0) {
                slotGain = 15 + (participantsByTime.length - 1) * 5;
            } else if (slotPresences.length > 0) {
                // If no one hit 30m, but they stayed, give partial first-member bonus
                const maxStay = Math.max(...slotPresences.map(p => {
                    const startedAt = new Date(p.startedAt).getTime();
                    return Math.min(30, Math.floor((now.getTime() - startedAt) / 60000));
                }));
                slotGain = (maxStay / 30) * 15;
            }

            // Add resonance from the rest of the village
            slotGain += villageResonanceBonus;

            // Scaled Decay: 5 base + 0.5 per member
            const dailyDecay = 5 + (members * 0.5);
            const netChange = slotGain - dailyDecay;

            let newHealth = slot.health;
            let newStreakGood = slot.streakGood;
            let newStreakBad = slot.streakBad;

            if (netChange > 0) {
                newStreakGood += 1;
                newStreakBad = 0;
            } else if (netChange < 1) { // Slighly more forgiving
                newStreakBad += 1;
                newStreakGood = 0;
            }

            newHealth = Math.min(100, Math.max(0, newHealth + netChange));

            // Update DB
            await updateAldeiaSlot(clanId, slot.slotId, {
                health: Math.round(newHealth),
                streakGood: newStreakGood,
                streakBad: newStreakBad,
                lastDecayCalculation: today,
                lastVisitedAt: slotPresences.length > 0 ?new Date().toISOString() : slot.lastVisitedAt
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

        const uniqueMembersData = membersData.filter((member: any, index: number, array: any[]) =>
            array.findIndex((candidate: any) => candidate.user_id === member.user_id) === index
        );

        const memberIds = uniqueMembersData.map((m: any) => m.user_id).filter((id: string) => isUuid(id));
        if (memberIds.length === 0) { setEnrichedClanMembers([]); return; }

        const { data: memberProfiles, error: profilesError } = await supabase.from('user_profiles').select('*').in('id', memberIds);
        if (profilesError || !memberProfiles) { console.error('Error fetching member profiles:', profilesError?.message); return; }

        const enrichedMembers: EnrichedClanMember[] = memberIds.map((memberId: string) => {
            const memberInfo = uniqueMembersData.find((m: any) => m.user_id === memberId);
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
                    assetArtById: {},
                    assetWidgetValues: {},
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
        const currentMember = currentUserId ? uniqueMembersData.find((m: any) => m.user_id === currentUserId) : null;
        if (currentMember?.role === 'leader') {
            await loadClanJoinRequestsIncoming(clanId);
        } else {
            setClanJoinRequestsIncoming([]);
        }
    }, [setClan, setEnrichedClanMembers, fetchClanQuestProgress, session?.user.id, userProfile.id, loadClanJoinRequestsIncoming]);

    const refreshClanMembershipState = useCallback(async (userId: string) => {
        if (!isUuid(userId)) {
            clearClanRuntimeState();
            return;
        }

        const { data: membershipRows, error: membershipError } = await supabase
            .from('clan_members')
            .select('clan_id, joined_at')
            .eq('user_id', userId)
            .order('joined_at', { ascending: true });

        if (membershipError) {
            console.error('Error refreshing clan membership state:', membershipError.message);
            return;
        }

        const membershipRow = Array.isArray(membershipRows) ? membershipRows[0] : null;

        if (membershipRow?.clan_id) {
            await loadClanAndMembers(String(membershipRow.clan_id), true);
        } else {
            clearClanRuntimeState();
        }

        await loadClanJoinRequestsOutgoing(userId);
    }, [clearClanRuntimeState, loadClanAndMembers, loadClanJoinRequestsOutgoing]);

    useEffect(() => {
        const userId = session?.user.id;
        if (!userId || !isUuid(userId)) return;

        const channel = supabase
            .channel(`clan-membership-realtime-${userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clan_members',
                filter: `user_id=eq.${userId}`,
            }, () => {
                void refreshClanMembershipState(userId);
                window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            });

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user.id, refreshClanMembershipState]);

    const migrateGuestDataToSupabase = useCallback(async (userId: string, sessionMetadata?: { email: string, nickname: string, avatarUrl: string }) => {
        if (!isUuid(userId)) {
            console.error("Invalid userId for migration to Supabase");
            return;
        }

        const errors: string[] = [];
        const baseProfile = { ...userProfile, id: userId, isOnline: true };

        // Ensure session metadata is used if provided ( crucial for brand new social logins)
        if (sessionMetadata) {
            baseProfile.email = sessionMetadata.email || baseProfile.email;
            baseProfile.nickname = sessionMetadata.nickname || baseProfile.nickname;
            baseProfile.avatarUrl = sessionMetadata.avatarUrl || baseProfile.avatarUrl;
        }

        const syncedProfile = await SupabaseService.syncUserProfile(baseProfile);
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

    useEffect(() => {
        const userId = session?.user.id;
        sequenceItemsHydratedRef.current = false;
        setSequenceItems([...defaultSequenceItems]);
    }, [session?.user.id]);

    useEffect(() => {
        const userId = getSupabaseUserId();
        if (!userId || !isUuid(userId) || !hasHydratedFromSupabase || !sequenceItemsHydratedRef.current || suspendPersistenceRef.current) {
            return;
        }

        const normalized = normalizeSequenceItems(sequenceItems);
        supabase
            .from('user_profiles')
            .update({ sequence_items: normalized })
            .eq('id', userId)
            .then(({ error }) => {
                if (error) {
                    console.error('Failed to persist sequence items:', error);
                }
            });
    }, [getSupabaseUserId, hasHydratedFromSupabase, sequenceItems]);

    // Ref to hold the latest migration function
    const migrateGuestDataToSupabaseRef = useRef(migrateGuestDataToSupabase);
    const relationshipOperationalSyncRef = useRef<string | null>(null);
    useEffect(() => {
        migrateGuestDataToSupabaseRef.current = migrateGuestDataToSupabase;
    }, [migrateGuestDataToSupabase]);

    useEffect(() => {
        if (!isProfileLoaded || !hasHydratedFromSupabase) return;

        const userId = getSupabaseUserId();
        if (!userId) {
            relationshipOperationalSyncRef.current = null;
            return;
        }
        if (relationshipOperationalSyncRef.current === userId) return;

        relationshipOperationalSyncRef.current = userId;

        void fetchRelationshipHubData().catch((error) => {
            relationshipOperationalSyncRef.current = null;
            console.error('Failed to pre-sync relationship operational data:', error);
        });
        // fetchRelationshipHubData is intentionally omitted to avoid effect loops.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getSupabaseUserId, hasHydratedFromSupabase, isProfileLoaded, userProfile.id]);

    const refreshOpenCycleDerivedState = useCallback(async (cycle: Cycle | null) => {
        const userId = getSupabaseUserId();
        if (!userId || !cycle) {
            setCycleProgress(0);
            setCycleExpBonus(0);
            return;
        }

        try {
            const [sitrepsResult, commitmentsResult] = await Promise.all([
                supabase
                    .from('sitrep_reports')
                    .select('completed_tasks_count, total_tasks_count')
                    .eq('cycle_id', cycle.id),
                supabase
                    .from('daily_commitments')
                    .select('exp_deposited')
                    .eq('user_id', userId)
                    .eq('stage', 'judgment')
                    .gte('date', cycle.startDate)
                    .lte('date', cycle.endDate),
            ]);

            if (sitrepsResult.error) throw sitrepsResult.error;
            if (commitmentsResult.error) throw commitmentsResult.error;

            const sitreps = sitrepsResult.data || [];
            const totalCompleted = sitreps.reduce((acc, row) => acc + Number(row.completed_tasks_count || 0), 0);
            const totalTasks = sitreps.reduce((acc, row) => acc + Number(row.total_tasks_count || 0), 0);
            setCycleProgress(totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0);

            const judgedRows = commitmentsResult.data || [];
            const totalExpDeposited = judgedRows.reduce((sum, row) => sum + Number(row.exp_deposited || 0), 0);
            setCycleExpBonus(totalExpDeposited);
        } catch (error) {
            console.error('Failed to refresh open cycle derived state:', error);
        }
    }, [getSupabaseUserId]);

    const reconcileJudgedDayTaskMutation = useCallback(async ({
        taskBefore,
        previousTasks,
        nextTasks,
    }: {
        taskBefore: ScheduledTask;
        taskAfter: ScheduledTask;
        previousTasks: ScheduledTask[];
        nextTasks: ScheduledTask[];
    }) => {
        const userId = getSupabaseUserId();
        const operationalDate = getTaskOperationalDateString(taskBefore);

        if (!userId || !activeCycle || !operationalDate) return;
        if (operationalDate < activeCycle.startDate || operationalDate > activeCycle.endDate) return;

        const { data: commitmentRowRaw, error: commitmentError } = await supabase
            .from('daily_commitments')
            .select('*')
            .eq('user_id', userId)
            .eq('date', operationalDate)
            .maybeSingle();

        if (commitmentError) throw commitmentError;
        if (!commitmentRowRaw) return;

        const commitmentRow = mapToCamelCase(commitmentRowRaw) as Partial<DailyCommitment> & {
            operationalScratch?: string | null;
        };

        if (commitmentRow.stage !== 'judgment') return;

        const taskIds = Array.isArray(commitmentRow.taskIds)
            ? commitmentRow.taskIds.filter((taskId): taskId is string => typeof taskId === 'string' && taskId.length > 0)
            : [];

        const getCommittedTasksForDate = (sourceTasks: ScheduledTask[]) =>
            sourceTasks.filter((task) => taskIds.includes(task.id) && taskMatchesOperationalDate(task, operationalDate));

        const summarizeDay = (sourceTasks: ScheduledTask[]) => {
            const committedTasks = getCommittedTasksForDate(sourceTasks);
            const completedTasks = committedTasks.filter((task) => task.completed);
            const totalCount = committedTasks.length;
            const completedCount = completedTasks.length;
            const score = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
            const baseExp = completedTasks.reduce((sum, task) => {
                const action = actions.find((candidate) => candidate.id === task.actionId);
                const duration = task.duration > 0 ? task.duration : (Number.isFinite(action?.duration) ? (action?.duration || 0) : 0);
                return sum + Math.round(duration * getActionExpMultiplier(action));
            }, 0);

            return { totalCount, completedCount, score, baseExp };
        };

        const previousSummary = summarizeDay(previousTasks);
        const nextSummary = summarizeDay(nextTasks);
        const relationshipBonusXp = typeof commitmentRow.relationshipBonusXp === 'number'
            ? commitmentRow.relationshipBonusXp
            : Number(commitmentRow.relationshipBonusXp || 0);
        const previousPerformanceBonus = previousSummary.score >= 95 ? SITREP_BONUS_S : previousSummary.score >= 85 ? SITREP_BONUS_A : 0;
        const nextPerformanceBonus = nextSummary.score >= 95 ? SITREP_BONUS_S : nextSummary.score >= 85 ? SITREP_BONUS_A : 0;
        const previousSitrepBonus = typeof commitmentRow.sitrepBonus === 'number'
            ? commitmentRow.sitrepBonus
            : previousPerformanceBonus + relationshipBonusXp;
        const previousExpDeposited = typeof commitmentRow.expDeposited === 'number'
            ? commitmentRow.expDeposited
            : Number(commitmentRow.expDeposited || 0);
        const previousVillageBonus = Math.max(0, previousExpDeposited - previousSummary.baseExp - previousSitrepBonus);
        const previousVillageBasis = previousSummary.baseExp + previousSitrepBonus;
        const preservedVillageFactor = previousVillageBasis > 0 ? previousVillageBonus / previousVillageBasis : 0;
        const nextSitrepBonus = nextPerformanceBonus + relationshipBonusXp;
        const nextVillageBasis = nextSummary.baseExp + nextSitrepBonus;
        const nextVillageBonus = nextVillageBasis > 0 ? Math.max(0, Math.round(nextVillageBasis * preservedVillageFactor)) : 0;
        const nextExpDeposited = nextSummary.baseExp + nextSitrepBonus + nextVillageBonus;

        const nothingChanged =
            previousSummary.totalCount === nextSummary.totalCount &&
            previousSummary.completedCount === nextSummary.completedCount &&
            previousSummary.score === nextSummary.score &&
            previousExpDeposited === nextExpDeposited &&
            previousSitrepBonus === nextSitrepBonus;

        if (nothingChanged) return;

        const commitmentPayload = {
            user_id: userId,
            date: operationalDate,
            task_ids: taskIds,
            stage: 'judgment' as DailyCommitmentStage,
            score: nextSummary.score,
            exp_deposited: nextExpDeposited,
            sitrep_bonus: nextSitrepBonus,
            relationship_bonus_xp: relationshipBonusXp,
            operational_scratch: commitmentRow.operationalScratch ?? null,
            updated_at: new Date().toISOString(),
        };

        const { error: updateCommitmentError } = await supabase
            .from('daily_commitments')
            .upsert(commitmentPayload, { onConflict: 'user_id,date' });

        if (updateCommitmentError) throw updateCommitmentError;

        const sitrepPayload = {
            date: operationalDate,
            score: nextSummary.score,
            completed_tasks_count: nextSummary.completedCount,
            total_tasks_count: nextSummary.totalCount,
            task_ids: taskIds,
            bonus_xp: nextSitrepBonus,
            cycle_id: activeCycle.id,
        };

        const { data: existingSitreps, error: existingSitrepError } = await supabase
            .from('sitrep_reports')
            .select('id')
            .eq('user_id', userId)
            .eq('date', operationalDate)
            .eq('cycle_id', activeCycle.id)
            .limit(1);

        if (existingSitrepError) throw existingSitrepError;

        const existingSitrepId = Array.isArray(existingSitreps) && existingSitreps.length > 0
            ? String(existingSitreps[0].id)
            : null;

        if (existingSitrepId) {
            const { error: updateSitrepError } = await supabase
                .from('sitrep_reports')
                .update(sitrepPayload)
                .eq('id', existingSitrepId);

            if (updateSitrepError) throw updateSitrepError;
        } else {
            const { error: insertSitrepError } = await supabase
                .from('sitrep_reports')
                .insert({
                    id: crypto.randomUUID(),
                    user_id: userId,
                    ...sitrepPayload,
                });

            if (insertSitrepError) throw insertSitrepError;
        }

        if (dailyCommitment.date === operationalDate && dailyCommitment.stage === 'judgment') {
            setDailyCommitmentState((prev) => (
                prev.date !== operationalDate
                    ? prev
                    : {
                        ...prev,
                        stage: 'judgment',
                        score: nextSummary.score,
                        expDeposited: nextExpDeposited,
                        sitrepBonus: nextSitrepBonus,
                        relationshipBonusXp,
                    }
            ));
        }

        await refreshOpenCycleDerivedState(activeCycle);

        const formattedDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${operationalDate}T12:00:00`));
        const delta = nextExpDeposited - previousExpDeposited;
        showToast(
            delta !== 0
                ? `Dia ${formattedDate} recalculado. Delta no ciclo: ${delta > 0 ? `+${delta}` : delta} XP.`
                : `Dia ${formattedDate} recalculado no ciclo.`,
            'success'
        );
    }, [actions, activeCycle, dailyCommitment.date, dailyCommitment.stage, getSupabaseUserId, refreshOpenCycleDerivedState, showToast]);

    // --- Supabase Data Sync ---
    useEffect(() => {
        const today = getTodayString();

        // Check for daily reset
        if (dailyCommitment.date !== today) {
            resetDailyCommitment();
            setChecklistItems([...defaultChecklistItems]);
        }

        const userId = getSupabaseUserId();
        if (!userId) return;

        const loadDataFromSupabase = async () => {
            // Verificar se o userId Ã© vÃ¡lido antes de fazer queries
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
                if (isGoldenInviteGateEnabled) {
                    const accessStatus = await SupabaseService.getClosedBetaAccessStatus();
                    if (!accessStatus?.hasInvite) {
                        console.warn('Closed beta guard prevented implicit profile creation before Bilhete Dourado validation.');
                        return;
                    }
                }

                const [
                    arenasCountResult,
                    actionsCountResult,
                    levelsCountResult,
                    clanCountResult,
                ] = await Promise.all([
                    rateLimiter.addRequest(() => supabase.from('arenas').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
                    rateLimiter.addRequest(() => supabase.from('actions').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
                    rateLimiter.addRequest(() => supabase.from('asset_levels').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
                    rateLimiter.addRequest(() => supabase.from('clan_members').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
                ]);

                if (arenasCountResult.error) console.error('Error checking arenas count:', arenasCountResult.error.message);
                if (actionsCountResult.error) console.error('Error checking actions count:', actionsCountResult.error.message);
                if (levelsCountResult.error) console.error('Error checking asset levels count:', levelsCountResult.error.message);
                if (clanCountResult.error) console.error('Error checking clan membership count:', clanCountResult.error.message);

                const counts = [
                    arenasCountResult.count,
                    actionsCountResult.count,
                    levelsCountResult.count,
                    clanCountResult.count,
                ];
                const hasExistingData = counts.some(count => typeof count === 'number' && count > 0);

                const sessionUser = session?.user;
                if (hasExistingData) {
                    const newProfile = {
                        ...DEFAULT_USER_PROFILE,
                        id: userId,
                        email: sessionUser?.email || '',
                        nickname: sessionUser?.user_metadata?.full_name || sessionUser?.user_metadata?.name || DEFAULT_USER_PROFILE.nickname,
                        avatarUrl: sessionUser?.user_metadata?.avatar_url || DEFAULT_USER_PROFILE.avatarUrl,
                        isOnline: true
                    };
                    await supabase.from('user_profiles').insert(mapToSnakeCase(newProfile)).then(({ error }) => {
                        if (error) console.error("Error creating initial profile:", error);
                    });
                    setUserProfile(newProfile);
                } else {
                    // Use the ref to access the latest version of migrateGuestDataToSupabase without triggering effect
                    const metadata = {
                        email: sessionUser?.email || '',
                        nickname: sessionUser?.user_metadata?.full_name || sessionUser?.user_metadata?.name || DEFAULT_USER_PROFILE.nickname,
                        avatarUrl: sessionUser?.user_metadata?.avatar_url || DEFAULT_USER_PROFILE.avatarUrl
                    };
                    await migrateGuestDataToSupabaseRef.current(userId, metadata);
                }
            }

            if (!profileError && profileData) {
                const camelProfile = mapToCamelCase(profileData) as UserProfile;
                const normalizedRole = typeof camelProfile.role === 'string' ?camelProfile.role.toLowerCase() : undefined;
                const role = normalizedRole === 'admin' || normalizedRole === 'gm' ?normalizedRole : (normalizedRole || 'user');
                const normalizedSkin = !camelProfile.skin || camelProfile.skin === 'default' ?'BASIC' : camelProfile.skin;
                const subscriptionTier = normalizeSubscriptionTier(camelProfile.subscriptionTier) || (camelProfile.isPremium ? 'premium' : null);
                const normalizedPremium = role === 'admin' || role === 'gm'
                    ? true
                    : isPremiumActive({
                        isPremium: camelProfile.isPremium,
                        premiumExpiresAt: camelProfile.premiumExpiresAt,
                        role,
                    });
                const normalizedUnlockedSkins = {
                    ...(camelProfile.unlockedSkins || {}),
                    BASIC: true,
                };
                const storedSequenceItems = normalizeSequenceItems(camelProfile.sequenceItems);
                const legacySequenceItems = storedSequenceItems.length === 0 ? readLegacySequenceItemsFromStorage(userId) : [];
                const effectiveSequenceItems = storedSequenceItems.length > 0 ? storedSequenceItems : legacySequenceItems;
                setUserProfile(prev => {
                    let next = {
                        ...prev,
                        ...camelProfile,
                        role,
                        isPremium: normalizedPremium,
                        subscriptionTier: role === 'admin' || role === 'gm' ? 'platinum' : subscriptionTier,
                        legacyProjectionSceneCredits: Math.max(0, Number(camelProfile.legacyProjectionSceneCredits || 0)),
                        campaignQuizFreeCredits: Math.max(0, Number(camelProfile.campaignQuizFreeCredits || 0)),
                        campaignQuizMediumCredits: Math.max(0, Number(camelProfile.campaignQuizMediumCredits || 0)),
                        skin: normalizedSkin,
                        unlockedSkins: normalizedUnlockedSkins,
                        sequenceItems: effectiveSequenceItems,
                    } as UserProfile;
                    next.visibleWidgets = Array.isArray(next.visibleWidgets) ? next.visibleWidgets : [];
                    next.sequenceItems = effectiveSequenceItems;
                    next.assetArtById = next.assetArtById || {};
                    next.assetWidgetValues = next.assetWidgetValues || {};
                    next.assetsVisibility = normalizeAssetsVisibilityScope(next.assetsVisibility);
                    next.masteryVisibility = normalizeMasteryVisibilityScope(next.masteryVisibility);
                    next.featsVisibility = normalizeFeatsVisibilityScope(next.featsVisibility);
                    const normalizedUnlockedItems = next.unlockedItems || DEFAULT_USER_PROFILE.unlockedItems;
                    next.unlockedItems = {
                        ...normalizedUnlockedItems,
                        ui_skins: {
                            ...(normalizedUnlockedItems.ui_skins || {}),
                            BASIC: true,
                            [normalizedSkin]: true,
                        },
                    };
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
                setSequenceItems(effectiveSequenceItems);
                sequenceItemsHydratedRef.current = true;
                if (legacySequenceItems.length > 0) {
                    supabase
                        .from('user_profiles')
                        .update({ sequence_items: legacySequenceItems })
                        .eq('id', userId)
                        .then(({ error }) => {
                            if (error) {
                                console.error('Failed to migrate legacy sequence items to Supabase:', error);
                                return;
                            }
                            try {
                                localStorage.removeItem(getSequenceStorageKey(userId));
                            } catch (storageError) {
                                console.error('Failed to clear legacy sequence items from local storage:', storageError);
                            }
                        });
                }
            }

            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const minDate = getLocalDateString(threeMonthsAgo);

            const [
                arenasResult,
                actionsResult,
                tasksResult,
                levelsResult,
                cyclesResult
            ] = await rateLimiter.batchRequests([
                () => supabase.from('arenas').select('*').eq('user_id', userId),
                () => supabase.from('actions').select('*').eq('user_id', userId),
                () => supabase.from('scheduled_tasks').select('*').eq('user_id', userId).gte('date', minDate),
                () => supabase.from('asset_levels').select('*').eq('user_id', userId),
                () => supabase
                    .from('cycles')
                    .select('*')
                    .eq('user_id', userId)
                    .is('report_data', null)
                    .order('start_date', { ascending: true })
                    .order('created_at', { ascending: false })
                    .limit(50),
            ]) as any[];

            let loadedArenas: Arena[] = [];
            let loadedActions: Action[] = [];
            let loadedTasks: ScheduledTask[] = [];

            let camelArenas: Arena[] | null = null;
            const { data: arenasData, error: arenasError } = arenasResult;
            if (!arenasError && arenasData) {
                camelArenas = (mapToCamelCase(arenasData) as Arena[]).map(arena => ({
                    ...arena,
                    actionIds: Array.isArray(arena.actionIds) ?arena.actionIds : [],
                    isArchived: typeof arena.isArchived === 'boolean' ?arena.isArchived : false,
                }));
                if (camelArenas) loadedArenas = camelArenas;
            }

            const { data: actionsData, error: actionsError } = actionsResult;
            if (!actionsError && actionsData) {
                const normalizedActions = (actionsData || []).map(normalizeActionFromDbRow);
                if (camelArenas) {
                    const validArenaIds = new Set(camelArenas.map(a => a.id));
                    const validActions = normalizedActions.filter(a => validArenaIds.has(a.arenaId));
                    loadedActions = validActions;
                } else {
                    loadedActions = normalizedActions;
                }
            }

            const { data: tasksData, error: tasksError } = tasksResult;
            if (!tasksError && tasksData) {
                const tasks = mapToCamelCase(tasksData) as ScheduledTask[];
                loadedTasks = tasks;
            }

            const { data: levelsData, error: levelsError } = levelsResult;

            const applyOperationalState = (
                nextArenas: Arena[] | null,
                nextActions: Action[],
                nextTasks: ScheduledTask[],
            ) => {
                setActions(nextActions);
                setTasks(nextTasks);

                if ((!arenasError && arenasData) || (!levelsError && levelsData)) {
                    setAssets(() => {
                        let nextAssets = createDefaultAssets(true);
                        if (nextArenas) {
                            nextAssets = nextAssets.map(asset => ({
                                ...asset,
                                arenas: nextArenas.filter(a => a.assetId === asset.id)
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

                if (nextActions.length > 0 && nextArenas && nextArenas.length > 0) {
                    const validArenaIds = new Set(nextArenas.map(a => a.id));
                    const actionsById = new Map(nextActions.map(action => [action.id, action] as const));
                    const cleanedTasks = nextTasks.filter(task => {
                        const action = actionsById.get(task.actionId);
                        if (!action) return false;
                        if (!validArenaIds.has(action.arenaId)) return false;
                        return true;
                    });

                    if (cleanedTasks.length !== nextTasks.length) {
                        console.log(`Cleaned up ${nextTasks.length - cleanedTasks.length} orphan tasks.`);
                        setTasks(cleanedTasks);
                    }
                }
            };

            applyOperationalState(camelArenas, loadedActions, loadedTasks);

            const { data: cyclesData, error: cyclesError } = cyclesResult;
            if (!cyclesError && cyclesData && cyclesData.length > 0) {
                const today = getLocalDateString();
                const openCycles = (mapToCamelCase(cyclesData) as Cycle[])
                    .sort((left, right) => {
                        return new Date(left.startDate).getTime() - new Date(right.startDate).getTime();
                    });
                const activeCandidates = openCycles
                    .filter(cycle => cycle.startDate <= today)
                    .sort((left, right) => {
                        const startDelta = new Date(right.startDate).getTime() - new Date(left.startDate).getTime();
                        if (startDelta !== 0) return startDelta;
                        return 0;
                    });
                const currentCycle = activeCandidates[0] || null;
                const nextCycle = openCycles.find(cycle => cycle.startDate > today) || null;

                setActiveCycle(currentCycle);
                setUpcomingCycle(nextCycle);

                if (!currentCycle) {
                    setCycleProgress(0);
                    setCycleExpBonus(0);
                } else {
                    void (async () => {
                        try {
                            await refreshOpenCycleDerivedState(currentCycle);

                            const endDate = new Date(currentCycle.endDate);
                            const now = new Date();
                            if (now >= endDate && !currentCycle.isFinished) {
                                console.log('Cycle end date reached. Auto-finishing cycle...');
                                setTimeout(() => {
                                    void 0;
                                }, 2000);
                            }
                        } catch (error) {
                            console.error('Failed to hydrate cycle sitrep summary:', error);
                        }
                    })();
                }
            } else if (!cyclesError) {
                setActiveCycle(null);
                setUpcomingCycle(null);
                setCycleProgress(0);
                setCycleExpBonus(0);
            } else {
                console.error('Error fetching open cycles:', cyclesError);
                setActiveCycle(null);
                setUpcomingCycle(null);
                setCycleProgress(0);
                setCycleExpBonus(0);
            }

            void (async () => {
                fetchChestsFromDB(userId)
                    .then(chests => {
                        if (chests) setUserProfile(prev => ({ ...prev, chests }));
                    })
                    .catch(error => {
                        console.error('Failed to hydrate chests during deferred boot:', error);
                    });

                void loadFriendsAndRequests(userId);
                void loadClanJoinRequestsOutgoing(userId);

                const [
                    clanMemberResult,
                    foldersResult,
                    reportsResult,
                    campaignsResult,
                ] = await rateLimiter.batchRequests([
                    () => supabase.from('clan_members').select('clan_id').eq('user_id', userId).order('joined_at', { ascending: true }).limit(1).maybeSingle(),
                    () => supabase.from('arena_folders').select('*').eq('user_id', userId),
                    () => supabase.from('cycles').select('*').eq('user_id', userId).not('report_data', 'is', null).order('end_date', { ascending: false }).limit(100),
                    () => supabase.from('campaigns').select('*').eq('user_id', userId),
                ]) as any[];

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
                }

                const { data: foldersData, error: foldersError } = foldersResult;
                if (!foldersError && foldersData) {
                    setArenaFolders(mapToCamelCase(foldersData) as ArenaFolder[]);
                }

                const { data: campaignsData, error: campaignsError } = campaignsResult;
                if (!campaignsError && campaignsData) {
                    setCampaigns(mapToCamelCase(campaignsData) as Campaign[]);
                }

                const { data: reportsData, error: reportsError } = reportsResult;
                if (!reportsError && reportsData) {
                    const nextReports = reportsData
                        .map((row: any) => normalizeLoadedReportFromCycleRow(row))
                        .filter(Boolean) as Report[];

                    if (nextReports.length > 0) {
                        const sanitizedReports = dedupeLoadedHistoryReports(nextReports);
                        const { reports: recalculatedReports, changedReportIds } = hydrateReportsWithFairScore(sanitizedReports);
                        setReports(recalculatedReports);
                        if (changedReportIds.length > 0) {
                            void persistFairScoreReports(recalculatedReports.filter((report) => changedReportIds.includes(report.id)));
                        }
                    } else {
                        setReports([]);
                    }
                }

                if (clanMemberData && (!clan || clan.id !== clanMemberData.clan_id)) {
                    void loadClanAndMembers(clanMemberData.clan_id, true);
                }

                try {
                    let deferredArenas = camelArenas ? [...camelArenas] : null;
                    let deferredActions = [...loadedActions];
                    let deferredTasks = [...loadedTasks];
                    const mentorshipLinksResult = await supabase
                        .from('relationship_links')
                        .select('*')
                        .eq('link_type', 'mentoria')
                        .or(`mentor_id.eq.${userId},pupil_id.eq.${userId}`)
                        .is('ended_at', null);

                    if (!mentorshipLinksResult.error && mentorshipLinksResult.data && mentorshipLinksResult.data.length > 0) {
                        const pupilMentorshipLinkIds = mentorshipLinksResult.data
                            .filter((row: any) => String(row.pupil_id || '') === userId)
                            .map((row: any) => String(row.id))
                            .filter(Boolean);
                        const mentorMentorshipLinkIds = mentorshipLinksResult.data
                            .filter((row: any) => String(row.mentor_id || '') === userId)
                            .map((row: any) => String(row.id))
                            .filter(Boolean);
                        const mentorshipLinkIds = [...new Set([...pupilMentorshipLinkIds, ...mentorMentorshipLinkIds])];
                        const linkedMentorshipArenasResult = await supabase
                            .from('relationship_link_arenas')
                            .select('*')
                            .in('relationship_link_id', mentorshipLinkIds);

                        if (!linkedMentorshipArenasResult.error && linkedMentorshipArenasResult.data && linkedMentorshipArenasResult.data.length > 0) {
                            const mentorMentorshipArenaIds = new Set(
                                linkedMentorshipArenasResult.data
                                    .filter((row: any) => mentorMentorshipLinkIds.includes(String(row.relationship_link_id || '')))
                                    .map((row: any) => String(row.arena_id || ''))
                                    .filter(Boolean)
                            );
                            if (mentorMentorshipArenaIds.size > 0) {
                                if (deferredArenas) {
                                    deferredArenas = deferredArenas.filter((arena) => !mentorMentorshipArenaIds.has(arena.id));
                                }
                                deferredActions = deferredActions.filter((action) => !mentorMentorshipArenaIds.has(action.arenaId));
                                const keptActionIds = new Set(deferredActions.map((action) => action.id));
                                deferredTasks = deferredTasks.filter((task) => keptActionIds.has(task.actionId));
                            }

                            const pupilLinkedRows = linkedMentorshipArenasResult.data.filter((row: any) =>
                                pupilMentorshipLinkIds.includes(String(row.relationship_link_id || ''))
                            );
                            const linkedArenaIds = [...new Set(pupilLinkedRows.map((row: any) => String(row.arena_id || '')).filter(Boolean))];

                            if (linkedArenaIds.length > 0) {
                                const [mentorshipArenasResult, mentorshipActionsResult] = await Promise.all([
                                    supabase.from('arenas').select('*').in('id', linkedArenaIds),
                                    supabase.from('actions').select('*').in('arena_id', linkedArenaIds),
                                ]);

                                const mentorshipActions = !mentorshipActionsResult.error && mentorshipActionsResult.data
                                    ? mentorshipActionsResult.data.map(normalizeActionFromDbRow)
                                    : [];
                                const mentorshipActionIds = mentorshipActions.map((action) => action.id);

                                let mentorshipTasks: ScheduledTask[] = [];
                                if (mentorshipActionIds.length > 0) {
                                    const mentorshipTasksResult = await supabase
                                        .from('scheduled_tasks')
                                        .select('*')
                                        .in('action_id', mentorshipActionIds);

                                    if (!mentorshipTasksResult.error && mentorshipTasksResult.data) {
                                        mentorshipTasks = (mapToCamelCase(mentorshipTasksResult.data) as ScheduledTask[]).filter((task) => {
                                            const taskOwnerId = String((task as any).userId || '');
                                            return !taskOwnerId || taskOwnerId === userId;
                                        });
                                    }
                                }

                                if (!mentorshipArenasResult.error && mentorshipArenasResult.data) {
                                    const mentorshipArenaActionsById = new Map<string, Action[]>();
                                    mentorshipActions.forEach((action) => {
                                        const nextActions = mentorshipArenaActionsById.get(action.arenaId) || [];
                                        nextActions.push(action);
                                        mentorshipArenaActionsById.set(action.arenaId, nextActions);
                                    });

                                    const mergedArenaMap = new Map((deferredArenas || []).map((arena) => [arena.id, arena] as const));
                                    mentorshipArenasResult.data.forEach((row: any) => {
                                        const mappedArena = mapToCamelCase(row) as Arena;
                                        const arenaActions = mentorshipArenaActionsById.get(String(mappedArena.id)) || [];
                                        mergedArenaMap.set(String(mappedArena.id), {
                                            ...mappedArena,
                                            actionIds: arenaActions.map((action) => action.id),
                                            isArchived: mappedArena.isArchived ?? false,
                                        });
                                    });

                                    deferredArenas = Array.from(mergedArenaMap.values());

                                    const mergedActionMap = new Map(deferredActions.map((action) => [action.id, action] as const));
                                    mentorshipActions.forEach((action) => {
                                        mergedActionMap.set(action.id, action);
                                    });
                                    deferredActions = Array.from(mergedActionMap.values());

                                    const mergedTaskMap = new Map(deferredTasks.map((task) => [task.id, task] as const));
                                    mentorshipTasks.forEach((task) => {
                                        mergedTaskMap.set(task.id, task);
                                    });
                                    deferredTasks = Array.from(mergedTaskMap.values());
                                }
                            }
                        }
                    }

                    applyOperationalState(deferredArenas, deferredActions, deferredTasks);
                } catch (error) {
                    console.error('Failed to hydrate mentorship arenas into the operational state:', error);
                }
            })();
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
                hydrated = true;
                return;

                // Use the actual cycle from state (it will be updated after loadDataFromSupabase finishes)
                // Since loadDataFromSupabase calls setActiveCycle, we can't just read state here.
                // Let's modify loadDataFromSupabase to return the found cycle or fetch it again.

                // Actually, we can fetch it directly here to be sure.
                // Fix: Use order and limit to get the LATEST active cycle, in case multiple exist (ghost cycles)
                const { data: currentCycleData } = await supabase
                    .from('cycles')
                    .select('*')
                    .eq('user_id', userId)
                    .is('report_data', null)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (currentCycleData) {
                    const cycle = mapToCamelCase(currentCycleData) as Cycle;
                    setActiveCycle(cycle); // CRITICAL: Actually set the active cycle in state
                    await refreshOpenCycleDerivedState(cycle);

                    // --- AUTO FINISH CYCLE CHECK ---
                    // Se a data de tÃ©rmino passou, finaliza automaticamente
                    const endDate = new Date(cycle.endDate);
                    const now = new Date();
                    if (now >= endDate && !cycle.isFinished) {
                        console.log('Cycle end date reached. Auto-finishing cycle...');
                        setTimeout(() => {
                            void 0;
                        }, 2000);
                    }
                } else {
                    setActiveCycle(null); // Ensure state is cleared if no active cycle found
                }

                hydrated = true;
            } finally {
                if (hydrated) {
                    sequenceItemsHydratedRef.current = true;
                    setHasHydratedFromSupabase(true);
                }
                setIsProfileLoaded(true);
                suspendPersistenceRef.current = false;
                if (hydrated && pendingProfilePatchRef.current) {
                    const patch = pendingProfilePatchRef.current;
                    pendingProfilePatchRef.current = null;
                    updateUserProfile(patch);
                }
            }
        };

        // EXPOSE MANUAL CLEANUP FUNCTION TO WINDOW
        (window as any).cleanOrphans = async () => {
            console.log("[cleanup] Iniciando limpeza manual de tarefas orfas...");
            const uid = session?.user.id;
            if (!uid) {
                console.error("[cleanup] Usuario nao autenticado.");
                return;
            }

            // 1. Fetch ALL relevant data fresh from DB
            const { data: allTasks, error: tErr } = await supabase.from('scheduled_tasks').select('*').eq('user_id', uid);
            const { data: allActions, error: aErr } = await supabase.from('actions').select('id, arena_id').eq('user_id', uid);
            const { data: allArenas, error: arErr } = await supabase.from('arenas').select('id').eq('user_id', uid);

            if (tErr || aErr || arErr) {
                console.error("[cleanup] Erro ao buscar dados para limpeza:", tErr, aErr, arErr);
                return;
            }

            if (!allTasks || !allActions || !allArenas) {
                console.log("[cleanup] Dados insuficientes para limpeza.");
                return;
            }

            const validActionIds = new Set(allActions.map(a => a.id));
            const validArenaIds = new Set(allArenas.map(a => a.id));
            const actionArenaMap = new Map(allActions.map(a => [a.id, a.arena_id]));

            const tasksToDelete: string[] = [];

            allTasks.forEach(task => {
                // Check 0: Action ID is missing?
                if (!task.action_id) {
                    console.log(`[cleanup] Tarefa ${task.id} -> Action ID nulo/vazio.`);
                    tasksToDelete.push(task.id);
                    return;
                }

                // Check 1: Action exists?
                if (!validActionIds.has(task.action_id)) {
                    console.log(`[cleanup] Tarefa ${task.id} (Action ${task.action_id}) -> Acao nao existe.`);
                    tasksToDelete.push(task.id);
                    return;
                }

                // Check 2: Arena exists?
                const arenaId = actionArenaMap.get(task.action_id);
                if (arenaId && !validArenaIds.has(arenaId)) {
                    console.log(`[cleanup] Tarefa ${task.id} (Arena ${arenaId}) -> Arena nao existe.`);
                    tasksToDelete.push(task.id);
                    return;
                }
            });

            console.log(`[cleanup] Encontradas ${tasksToDelete.length} tarefas orfas para deletar.`);

            if (tasksToDelete.length > 0) {
                // Delete in batches of 100 to be safe
                for (let i = 0; i < tasksToDelete.length; i += 100) {
                    const batch = tasksToDelete.slice(i, i + 100);
                    const { error } = await supabase.from('scheduled_tasks').delete().in('id', batch);
                    if (error) {
                        console.error("[cleanup] Erro ao deletar lote:", error);
                    } else {
                        console.log(`[cleanup] Lote ${i / 100 + 1} deletado com sucesso.`);
                    }
                }

                // Refresh local state
                setTasks(prev => prev.filter(t => !tasksToDelete.includes(t.id)));
                console.log("[cleanup] Limpeza concluida e estado atualizado!");
                alert(`Limpeza concluida! ${tasksToDelete.length} tarefas orfas removidas.`);

                // Optional reload to force sync
                if (confirm("Deseja recarregar a pagina para garantir que todas as mudancas sejam aplicadas?")) {
                    window.location.reload();
                }
            } else {
                console.log("[cleanup] Nenhuma tarefa orfa encontrada.");
                alert("Nenhuma tarefa orfa encontrada no banco de dados. Se voce ainda ve tarefas quebradas, elas podem ser fantasmas locais. Tente recarregar a pagina.");
            }
        };

        run();
    }, [session?.user.id]);

    // Codex System
    const [userCodexes, setUserCodexes] = useState<UserCodex[]>([]);
    const [codexCatalog, setCodexCatalog] = useState<CodexCatalogItem[]>([]);

    const deriveCodexSourceType = (row: any): UserCodex['source_type'] => {
        if (row?.source_type === 'created' || row?.source_type === 'catalog' || row?.source_type === 'gift_link' || row?.source_type === 'gift_in_app') {
            return row.source_type;
        }
        if (row?.catalog_id) return 'catalog';
        return 'created';
    };

    const normalizeUserCodexRow = useCallback((row: any, catalog: CodexCatalogItem[]): UserCodex => {
        let rawTemplate = row?.template;
        if (typeof rawTemplate === 'string') {
            try {
                rawTemplate = JSON.parse(rawTemplate);
            } catch (error) {
                console.error('Failed to parse codex template', error);
            }
        }

        let template = rawTemplate;
        if (row?.schema_version === 'draft-v1' && rawTemplate?.draftVersion === 1) {
            try {
                template = buildCodexTemplateFromDraft({
                    name: row?.name,
                    description: row?.description,
                    arenas: Array.isArray(rawTemplate?.arenas) ?rawTemplate.arenas : [],
                    actions: Array.isArray(rawTemplate?.actions) ?rawTemplate.actions : [],
                });
            } catch (error) {
                console.error('Failed to normalize codex draft into template', error);
            }
        }

        if (!template) {
            const catalogItem = catalog.find(c => c.id === row?.catalog_id || c.title === row?.name);
            if (catalogItem) {
                template = catalogItem.template;
            } else if (row?.name === BIOLOGICAL_MACHINE_CODEX.title) {
                template = BIOLOGICAL_MACHINE_CODEX;
            }
        }

        return {
            ...row,
            template,
            raw_template: rawTemplate,
            catalog_id: row?.catalog_id ?? null,
            schema_version: row?.schema_version ?? null,
            is_public: row?.is_public ?? null,
            source_type: deriveCodexSourceType(row),
            origin_codex_id: row?.origin_codex_id ?? null,
            created_by_user_id: row?.created_by_user_id ?? null,
            mentor_relationship_link_id: row?.mentor_relationship_link_id ?? null,
        } as UserCodex;
    }, []);

    const fetchCodexData = useCallback(async () => {
        let catalog: CodexCatalogItem[] = [];
        try {
            const { data: catalogData, error } = await supabase.from('codex_catalog').select('*');
            if (error) console.error('Supabase Error fetching catalog:', error);

            if (catalogData && catalogData.length > 0) {
                catalog = (catalogData as any[]).map(item => {
                    let template = item.template;
                    if (typeof template === 'string') {
                        try {
                            template = JSON.parse(template);
                        } catch (e) {
                            console.error('Error parsing template JSON for item', item.id, e);
                        }
                    }

                    const isBioMachine = item.id === BIOLOGICAL_MACHINE_CODEX.id ||
                        (item.title && BIOLOGICAL_MACHINE_CODEX.title && item.title.toLowerCase().trim() === BIOLOGICAL_MACHINE_CODEX.title.toLowerCase().trim());

                    if (isBioMachine && (!template || !template.levels)) {
                        template = BIOLOGICAL_MACHINE_CODEX;
                    }

                    return { ...item, template };
                }).filter(item => {
                    const isValid = item.template && item.template.levels && Array.isArray(item.template.levels);
                    if (!isValid) console.warn('Filtering out invalid catalog item (missing template or levels):', item.title || item.id);
                    return isValid;
                });
            }
        } catch (err) {
            console.error('Failed to fetch codex catalog', err);
        }

        const bioMachineExists = catalog.some(c => c.id === BIOLOGICAL_MACHINE_CODEX.id || c.title === BIOLOGICAL_MACHINE_CODEX.title);
        if (!bioMachineExists) {
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
                template: BIOLOGICAL_MACHINE_CODEX,
            };
            catalog = [fallbackItem, ...catalog];
        }

        setCodexCatalog([...catalog]);

        const userId = getSupabaseUserId();
        if (!userId) {
            setUserCodexes([]);
            return;
        }

        const { data: userCodexData, error: userError } = await supabase
            .from('codex')
            .select('*')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false });

        if (userError) {
            console.error('Error fetching user codexes:', userError);
            return;
        }

        setUserCodexes((userCodexData || []).map((row: any) => normalizeUserCodexRow(row, catalog)));
    }, [getSupabaseUserId, normalizeUserCodexRow]);

    useEffect(() => {
        void fetchCodexData();
    }, [fetchCodexData, session?.user.id]);

    const refreshCodexes = useCallback(async () => {
        await fetchCodexData();
    }, [fetchCodexData]);

    useEffect(() => {
        const userId = session?.user.id;
        if (!userId || !isUuid(userId)) {
            seenCodexGiftNotificationIdsRef.current = new Set();
            return;
        }

        const codexGiftNotifications = notifications.filter((notification) => notification.type === 'codex_gift');
        const nextIds = new Set(codexGiftNotifications.map((notification) => notification.id));
        const hasNewCodexGift = codexGiftNotifications.some(
            (notification) => !seenCodexGiftNotificationIdsRef.current.has(notification.id)
        );

        seenCodexGiftNotificationIdsRef.current = nextIds;

        if (!hasNewCodexGift) return;
        void refreshCodexes();
    }, [notifications, refreshCodexes, session?.user.id]);

    const buyCodex = async (catalogId: string, options?: { silentSuccess?: boolean; useCampaignQuizFreeCredit?: boolean; useCampaignQuizMediumCredit?: boolean }): Promise<UserCodex | null> => {
        const userId = getSupabaseUserId();
        if (!userId) return null;

        const catalogItem = codexCatalog.find(c => c.id === catalogId);
        if (!catalogItem) return null;
        const priceGold = Number(catalogItem.price_gold ?? Math.round(catalogItem.price_brl ?? 0));
        const useCampaignQuizFreeCredit = Boolean(options?.useCampaignQuizFreeCredit);
        const useCampaignQuizMediumCredit = Boolean(options?.useCampaignQuizMediumCredit);

        if (useCampaignQuizFreeCredit && Math.max(0, Number(userProfile.campaignQuizFreeCredits || 0)) <= 0) {
            showToast('Você não tem ficha grátis de quiz disponível.', 'warning');
            return null;
        }

        if (useCampaignQuizMediumCredit && Math.max(0, Number(userProfile.campaignQuizMediumCredits || 0)) <= 0) {
            showToast('Você não tem ficha de quiz disponível.', 'warning');
            return null;
        }

        if (!useCampaignQuizFreeCredit && !useCampaignQuizMediumCredit && (userProfile.wallet?.gold || 0) < priceGold) {
            const missingGold = Math.max(0, priceGold - Number(userProfile.wallet?.gold || 0));
            showToast(`Saldo insuficiente. Faltam ${missingGold} de ouro para adquirir ${catalogItem.title}.`, 'warning');
            promptGoldShortage({
                requiredGold: priceGold,
                label: `adquirir ${catalogItem.title}`,
                storeTab: 'store',
                section: 'packs',
            });
            return null;
        }

        const { data, error } = useCampaignQuizFreeCredit
            ? await supabase.rpc('claim_campaign_quiz_free_codex', {
                p_catalog_id: catalogId,
            })
            : useCampaignQuizMediumCredit
            ? await supabase.rpc('claim_campaign_quiz_medium_codex', {
                p_catalog_id: catalogId,
            })
            : await supabase.rpc('buy_codex_catalog_item', {
                p_catalog_id: catalogId,
            });

        if (error) {
            console.error('Error buying codex:', error);
            showToast(error.message || (useCampaignQuizFreeCredit || useCampaignQuizMediumCredit ? 'Erro ao liberar campanha do quiz.' : 'Erro ao adquirir campanha.'));
            return null;
        }

        if ((data as any)?.success === false) {
            showToast(String((data as any)?.error || (useCampaignQuizFreeCredit || useCampaignQuizMediumCredit ? 'Erro ao liberar campanha do quiz.' : 'Erro ao adquirir campanha.')), 'error');
            return null;
        }

        const purchasedCodex = (data as any)?.codex;
        const nextGold = Number((data as any)?.new_gold ?? userProfile.wallet?.gold ?? 0);
        const nextCampaignQuizFreeCredits = Number((data as any)?.campaign_quiz_free_credits_remaining ?? userProfile.campaignQuizFreeCredits ?? 0);
        const nextCampaignQuizMediumCredits = Number((data as any)?.campaign_quiz_medium_credits_remaining ?? userProfile.campaignQuizMediumCredits ?? 0);
        let normalizedPurchasedCodex: UserCodex | null = null;

        if (purchasedCodex) {
            normalizedPurchasedCodex = normalizeUserCodexRow(purchasedCodex, codexCatalog);
            setUserCodexes(prev => [normalizedPurchasedCodex!, ...prev]);
        }

        updateUserProfile({
            wallet: { ...userProfile.wallet, gold: nextGold },
            campaignQuizFreeCredits: Math.max(0, nextCampaignQuizFreeCredits),
            campaignQuizMediumCredits: Math.max(0, nextCampaignQuizMediumCredits),
        });
        if (!options?.silentSuccess) {
            showToast(
                useCampaignQuizFreeCredit
                    ? `Campanha "${catalogItem.title}" liberada com sua ficha grátis de quiz.`
                    : useCampaignQuizMediumCredit
                    ? `Campanha "${catalogItem.title}" liberada com sua ficha média de quiz.`
                    : `Campanha "${catalogItem.title}" foi para sua biblioteca. Abra Campanhas para instalar quando quiser.`,
                'success',
            );
        }
        return normalizedPurchasedCodex;
    };

    const buyCodexCreationSlot = async (): Promise<boolean> => {
        showToast('A forja de campanhas nao usa mais limite de criacao.', 'info');
        return false;
    };

    const parseRelationshipCapacitySummary = (raw: any): RelationshipCapacitySummary | null => {
        if (!raw || typeof raw !== 'object') return null;

        const normalizeEntry = (entry: any) => ({
            used: Number(entry?.used ?? 0),
            limit: Number(entry?.limit ?? 0),
            base: Number(entry?.base ?? 0),
            purchased: Number(entry?.purchased ?? 0),
            costGold: Number(entry?.costGold ?? 0),
            requiresPremium: Boolean(entry?.requiresPremium),
        });

        return {
            partnership: normalizeEntry(raw.partnership),
            competition: normalizeEntry(raw.competition),
            mentor: normalizeEntry(raw.mentor),
            linked_arena: normalizeEntry(raw.linked_arena),
            pupil_mentor: normalizeEntry(raw.pupil_mentor),
        };
    };

    const syncRelationshipProfileSnapshot = async (userId: string) => {
        if (!isUuid(userId)) return;

        const { data, error } = await supabase
            .from('user_profiles')
            .select('wallet,partnership_slots_purchased,competition_slots_purchased,mentor_slots_purchased,linked_arena_slots_purchased')
            .eq('id', userId)
            .maybeSingle();

        if (error || !data) return;

        updateUserProfile({
            wallet: (data as any).wallet ?? userProfile.wallet,
            partnershipSlotsPurchased: Number((data as any).partnership_slots_purchased ?? userProfile.partnershipSlotsPurchased ?? 0),
            competitionSlotsPurchased: Number((data as any).competition_slots_purchased ?? userProfile.competitionSlotsPurchased ?? 0),
            mentorSlotsPurchased: Number((data as any).mentor_slots_purchased ?? userProfile.mentorSlotsPurchased ?? 0),
            linkedArenaSlotsPurchased: Number((data as any).linked_arena_slots_purchased ?? userProfile.linkedArenaSlotsPurchased ?? 0),
        });
    };

    const mapRelationshipInviteRow = (row: any): RelationshipLinkInvite => ({
        id: row.id,
        senderId: row.sender_id,
        recipientId: row.recipient_id,
        linkType: row.link_type,
        arenaId: row.arena_id ?? null,
        arenaSnapshot: row.arena_snapshot ?? null,
        status: row.status,
        createdAt: row.created_at,
        respondedAt: row.responded_at ?? null,
        costGold: Number(row.cost_gold ?? 0),
        refundedAt: row.refunded_at ?? null,
        expiresAt: row.expires_at ?? null,
    });

    const mapRelationshipLinkRow = (row: any): RelationshipLink => ({
        id: row.id,
        mentorId: row.mentor_id,
        pupilId: row.pupil_id,
        linkType: row.link_type,
        arenaId: row.arena_id ?? null,
        arenaSnapshot: row.arena_snapshot ?? null,
        satisfactionLevel: typeof row.satisfaction_level === 'number' ? row.satisfaction_level : 50,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        endedAt: row.ended_at ?? null,
    });

    const buildLinkedRelationshipArenaPreview = (
        row: any,
        link: RelationshipLink | undefined,
        sourceArena: Arena | null | undefined
    ): Arena => {
        const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
        const isPrimaryArena = Boolean(link?.arenaId && link.arenaId === row?.arena_id);
        const snapshotName = isPrimaryArena ? link?.arenaSnapshot?.name : null;
        const snapshotIcon = isPrimaryArena ? link?.arenaSnapshot?.icon : null;
        const name = String(sourceArena?.name || metadata?.name || snapshotName || 'Arena vinculada');
        const description = String(sourceArena?.description || metadata?.description || '');
        const icon = String(sourceArena?.icon || metadata?.icon || snapshotIcon || 'ðŸ›ï¸');
        const assetId = String(sourceArena?.assetId || metadata?.asset_id || 'geral');

        return {
            id: String(sourceArena?.id || row?.arena_id || crypto.randomUUID()),
            assetId,
            name,
            description,
            icon,
            actionIds: Array.isArray(sourceArena?.actionIds) ? sourceArena!.actionIds : [],
            isArchived: sourceArena?.isArchived ?? false,
        };
    };

    const mapLinkedRelationshipArenaRow = (
        row: any,
        linksById: Map<string, RelationshipLink>,
        arenasById: Map<string, Arena>,
        actionsByArenaId: Map<string, Action[]>,
        tasksByArenaId: Map<string, ScheduledTask[]>,
    ): LinkedRelationshipArena => {
        const sourceArena = arenasById.get(row.arena_id) ?? null;
        const link = linksById.get(row.relationship_link_id);
        const previewArena = buildLinkedRelationshipArenaPreview(row, link, sourceArena);

        return {
            id: row.id,
            relationshipLinkId: row.relationship_link_id,
            linkType: link?.linkType,
            mentorId: link?.mentorId,
            pupilId: link?.pupilId,
            arenaId: row.arena_id,
            createdByUserId: row.created_by_user_id ?? null,
            createdAt: row.created_at,
            metadata: row.metadata ?? null,
            arena: previewArena,
            actions: actionsByArenaId.get(row.arena_id) || [],
            tasks: tasksByArenaId.get(row.arena_id) || [],
        };
    };

    const mapCompetitionChallengeRow = (row: any): RelationshipCompetitionChallenge => ({
        id: row.id,
        relationshipLinkId: row.relationship_link_id,
        sourceArenaId: row.source_arena_id ?? null,
        challengerUserId: row.challenger_user_id,
        opponentUserId: row.opponent_user_id,
        challengerArenaId: row.challenger_arena_id,
        opponentArenaId: row.opponent_arena_id,
        winnerUserId: row.winner_user_id ?? null,
        winnerArenaId: row.winner_arena_id ?? null,
        rewardChestType: row.reward_chest_type ?? null,
        winnerBonusXp: row.winner_bonus_xp ?? null,
        rewardGrantedAt: row.reward_granted_at ?? null,
        loserNotifiedAt: row.loser_notified_at ?? null,
        challengerCompletedAt: row.challenger_completed_at ?? null,
        opponentCompletedAt: row.opponent_completed_at ?? null,
        sealedAt: row.sealed_at ?? null,
        createdAt: row.created_at,
        completedAt: row.completed_at ?? null,
        metadata: row.metadata ?? null,
    });

    const mapRelationshipErrorMessage = (message?: string, fallback = 'Nao foi possivel concluir o vinculo.') => {
        const raw = String(message || '').trim();
        if (!raw) return fallback;
        if (raw.includes('arena_snapshot')) return 'Seu banco ainda esta com o schema antigo da mentoria. Rode o SQL que libera arena_snapshot como opcional.';
        if (raw.includes('MENTOR_PREMIUM_REQUIRED')) return 'A mentoria basica nao usa mais Premium. Se isso apareceu, o banco ainda esta com regra antiga.';
        if (raw.includes('RELATIONSHIP_SLOT_LIMIT_REACHED')) return 'Nao foi possivel abrir outro vinculo desse tipo agora.';
        if (raw.includes('PUPIL_MENTOR_SLOT_LIMIT_REACHED')) return 'Esse pupilo ja esta em outra mentoria ativa.';
        if (raw.includes('RELATIONSHIP_INVITE_ALREADY_PENDING')) return 'Ja existe um convite pendente com esse aliado.';
        if (raw.includes('RELATIONSHIP_LINK_ALREADY_ACTIVE')) return 'Esse vinculo ja esta ativo.';
        if (raw.includes('RELATIONSHIP_LINK_NOT_FOUND')) return 'Esse vinculo nao foi encontrado.';
        if (raw.includes('RELATIONSHIP_LINK_ALREADY_ENDED')) return 'Esse vinculo ja foi encerrado.';
        if (raw.includes('RELATIONSHIP_LINK_PERMISSION_DENIED')) return 'Voce nao pode encerrar esse vinculo.';
        if (raw.includes('ACTIVE_SHAREABLE_LINK_REQUIRED')) return 'Esse vinculo nao pode receber arena compartilhada agora.';
        if (raw.includes('ACTIVE_MENTORIA_LINK_REQUIRED')) return 'So o mentor pode abrir arena nessa mentoria.';
        if (raw.includes('ACTIVE_PARTNERSHIP_LINK_REQUIRED')) return 'Essa parceria precisa estar ativa para compartilhar arenas.';
        if (raw.includes('ACTIVE_COMPETITION_LINK_REQUIRED')) return 'Essa competicao precisa estar ativa para lancar um desafio.';
        if (raw.includes('PARTNERSHIP_SOURCE_ARENA_REQUIRED')) return 'Escolha uma arena sua para expor nessa parceria.';
        if (raw.includes('RELATIONSHIP_ARENA_SHARE_ALREADY_EXISTS')) return 'Essa arena ja esta exposta nessa parceria.';
        if (raw.includes('RELATIONSHIP_ARENA_ALREADY_LINKED')) return 'Essa arena ja esta vinculada em outra relacao.';
        if (raw.includes('RELATIONSHIP_ARENA_SHARE_PERMISSION_DENIED')) return 'Voce nao pode retirar essa arena da parceria.';
        if (raw.includes('LINKED_ARENA_SLOT_LIMIT_REACHED')) return 'Cada arena compartilhada custa 50 de ouro por unidade. Se isso apareceu, o SQL novo ainda nao foi aplicado.';
        if (raw.includes('LINKED_ARENA_SLOT_DISABLED')) return 'Cada arena compartilhada custa 50 de ouro por unidade.';
        if (raw.includes('ARENA_NAME_REQUIRED')) return 'Diga o nome da arena vinculada.';
        if (raw.includes('ARENA_ASSET_REQUIRED')) return 'Escolha o ativo da arena vinculada.';
        if (raw.includes('COMPETITION_SOURCE_ARENA_REQUIRED')) return 'Escolha uma arena sua para espelhar nesse duelo.';
        if (raw.includes('COMPETITION_SOURCE_ARENA_LOCKED')) return 'Use uma arena autoral livre. Arena compartilhada ou duelo antigo nao pode virar base.';
        if (raw.includes('COMPETITION_SOURCE_ARENA_EMPTY')) return 'Essa arena ainda nao tem acoes suficientes para virar duelo.';
        if (raw.includes('COMPETITION_SNAPSHOT_LOCKED')) return 'Esse duelo foi selado como snapshot. Para mudar algo, forje outro duelo.';
        if (raw.includes('COMPETITION_CHALLENGE_ALREADY_ACTIVE')) return 'Ja existe um duelo ativo nesse vinculo.';
        if (raw.includes('COMPETITION_CHALLENGE_LIMIT_REACHED')) return 'Esse vinculo ja atingiu o limite de duelos abertos agora.';
        if (raw.includes('COMPETITION_CHALLENGE_NOT_FOUND')) return 'Esse duelo nao foi encontrado.';
        if (raw.includes('MENTOR_FORGED_CODEX_LIMIT_REACHED')) return 'A forja de campanhas da mentoria agora e paga por uso. Se isso apareceu, o banco ainda esta com regra antiga.';
        if (raw.includes('RELATIONSHIP_CAPACITY_DISABLED')) return 'A camada social agora funciona so por ouro.';
        return raw;
    };

    const getRelationshipCapacitySummary = async (): Promise<RelationshipCapacitySummary | null> => {
        const { data, error } = await supabase.rpc('get_relationship_capacity_summary');
        if (error) {
            console.error('Error fetching relationship capacity summary:', error);
            return null;
        }

        return parseRelationshipCapacitySummary(data);
    };

    const fetchRelationshipHubData = async () => {
        const userId = getSupabaseUserId();
        if (!userId || !isUuid(userId)) {
            return { invites: [], links: [], linkedArenas: [], competitionChallenges: [], summary: null };
        }

        const now = Date.now();
        if (now - relationshipInviteExpiryCheckedAtRef.current > 15 * 60 * 1000) {
            relationshipInviteExpiryCheckedAtRef.current = now;
            try {
                await supabase.rpc('expire_stale_relationship_link_invites', { p_max_age_hours: 168 });
            } catch (error: any) {
                relationshipInviteExpiryCheckedAtRef.current = 0;
                console.warn('Failed to expire stale relationship invites', error?.message || error);
            }
        }

        const [summary, invitesResult, linksResult] = await Promise.all([
            getRelationshipCapacitySummary(),
            supabase
                .from('relationship_link_invites')
                .select('*')
                .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
                .eq('status', 'pending')
                .order('created_at', { ascending: false }),
            supabase
                .from('relationship_links')
                .select('*')
                .or(`mentor_id.eq.${userId},pupil_id.eq.${userId}`)
                .is('ended_at', null)
                .order('created_at', { ascending: false }),
        ]);

        if (invitesResult.error) {
            console.error('Error fetching relationship invites:', invitesResult.error);
        }
        if (linksResult.error) {
            console.error('Error fetching relationship links:', linksResult.error);
        }

        const links = (linksResult.data || []).map(mapRelationshipLinkRow);
        const linksById = new Map(links.map((link) => [link.id, link] as const));
        const linkIds = links.map(link => link.id);
        const competitionLinkIds = links.filter((link) => link.linkType === 'competicao').map((link) => link.id);
        let linkedArenaRows: any[] = [];
        let competitionChallenges: RelationshipCompetitionChallenge[] = [];
        const arenasById = new Map<string, Arena>();
        const actionsByArenaId = new Map<string, Action[]>();
        const tasksByArenaId = new Map<string, ScheduledTask[]>();

        if (linkIds.length > 0) {
            if (competitionLinkIds.length > 0) {
                const competitionChallengesResult = await supabase
                    .from('relationship_competition_challenges')
                    .select('*')
                    .in('relationship_link_id', competitionLinkIds)
                    .order('created_at', { ascending: false });

                if (competitionChallengesResult.error) {
                    console.error('Error fetching relationship competition challenges:', competitionChallengesResult.error);
                } else {
                    competitionChallenges = (competitionChallengesResult.data || []).map(mapCompetitionChallengeRow);
                }
            }

            const linkedArenasResult = await supabase
                .from('relationship_link_arenas')
                .select('*')
                .in('relationship_link_id', linkIds)
                .order('created_at', { ascending: false });

            if (linkedArenasResult.error) {
                console.error('Error fetching linked relationship arenas:', linkedArenasResult.error);
            } else {
                linkedArenaRows = linkedArenasResult.data || [];
            }

            const arenaIds = [...new Set(linkedArenaRows.map(row => row.arena_id).filter(Boolean))];
            if (arenaIds.length > 0) {
                const linkByArenaId = new Map<string, RelationshipLink | undefined>();
                for (const linkedArenaRow of linkedArenaRows) {
                    linkByArenaId.set(String(linkedArenaRow.arena_id), linksById.get(String(linkedArenaRow.relationship_link_id)));
                }

                const arenasResult = await supabase.from('arenas').select('*').in('id', arenaIds);
                if (arenasResult.error) {
                    console.error('Error fetching linked arenas:', arenasResult.error);
                } else {
                    for (const row of arenasResult.data || []) {
                        const mapped = mapToCamelCase(row) as Arena;
                        arenasById.set(mapped.id, { ...mapped, actionIds: mapped.actionIds || [], isArchived: mapped.isArchived ?? false });
                    }
                }

                const actionsResult = await supabase
                    .from('actions')
                    .select('*')
                    .in('arena_id', arenaIds);

                if (actionsResult.error) {
                    console.error('Error fetching linked arena actions:', actionsResult.error);
                } else {
                    for (const row of actionsResult.data || []) {
                        const mapped = normalizeActionFromDbRow(row);
                        const arenaId = String((mapped as any).arenaId || row.arena_id || '');
                        if (!arenaId) continue;
                        const nextActions = actionsByArenaId.get(arenaId) || [];
                        nextActions.push(mapped);
                        actionsByArenaId.set(arenaId, nextActions);
                    }

                    const actionIds = [...new Set((actionsResult.data || []).map((row: any) => row.id).filter(Boolean))];
                    if (actionIds.length > 0) {
                        const tasksResult = await supabase
                            .from('scheduled_tasks')
                            .select('*')
                            .in('action_id', actionIds);

                        if (tasksResult.error) {
                            console.error('Error fetching linked arena tasks:', tasksResult.error);
                        } else {
                            const arenaIdByActionId = new Map<string, string>();
                            actionsByArenaId.forEach((arenaActions, arenaId) => {
                                arenaActions.forEach((action) => {
                                    arenaIdByActionId.set(action.id, arenaId);
                                });
                            });

                            for (const row of tasksResult.data || []) {
                                const mapped = mapToCamelCase(row) as ScheduledTask;
                                const arenaId = arenaIdByActionId.get(String((mapped as any).actionId || row.action_id || ''));
                                if (!arenaId) continue;
                                const linkedArenaLink = linkByArenaId.get(arenaId);
                                const isMentorshipArena = linkedArenaLink?.linkType === 'mentoria';
                                const shouldKeepTask = !isMentorshipArena
                                    || Boolean(linkedArenaLink && (linkedArenaLink.mentorId === userId || linkedArenaLink.pupilId === userId));
                                if (!shouldKeepTask) continue;
                                const nextTasks = tasksByArenaId.get(arenaId) || [];
                                nextTasks.push(mapped);
                                tasksByArenaId.set(arenaId, nextTasks);
                            }
                        }
                    }
                }

                const operationalLinkedArenas = (arenasResult.data || [])
                    .filter((row: any) => {
                        const link = linkByArenaId.get(String(row.id));
                        if (link?.linkType === 'mentoria') {
                            return link.pupilId === userId;
                        }
                        const ownerId = String(row.user_id || '');
                        return ownerId === userId;
                    })
                    .map((row: any) => {
                        const mappedArena = arenasById.get(String(row.id));
                        if (!mappedArena) return null;
                        const arenaActions = actionsByArenaId.get(mappedArena.id) || [];
                        const arenaTasks = (tasksByArenaId.get(mappedArena.id) || []).filter(task => {
                            const taskOwnerId = String((task as any).userId || '');
                            return !taskOwnerId || taskOwnerId === userId;
                        });
                        return {
                            arena: {
                                ...mappedArena,
                                actionIds: arenaActions.map((action) => action.id),
                            },
                            actions: arenaActions,
                            tasks: arenaTasks,
                        };
                    })
                    .filter((entry): entry is { arena: Arena; actions: Action[]; tasks: ScheduledTask[] } => Boolean(entry));

                if (operationalLinkedArenas.length > 0) {
                    setAssets((prevAssets) => {
                        let changed = false;
                        const byArenaId = new Map(operationalLinkedArenas.map((entry) => [entry.arena.id, entry.arena] as const));
                        const nextAssets = prevAssets.map((asset) => {
                            const existingArenaIds = new Set(asset.arenas.map((arena) => arena.id));
                            const updatedArenas = asset.arenas.map((arena) => {
                                const replacement = byArenaId.get(arena.id);
                                if (!replacement) return arena;
                                changed = true;
                                return replacement;
                            });
                            const additions = operationalLinkedArenas
                                .filter((entry) => entry.arena.assetId === asset.id && !existingArenaIds.has(entry.arena.id))
                                .map((entry) => entry.arena);

                            if (additions.length > 0) {
                                changed = true;
                                return { ...asset, arenas: [...updatedArenas, ...additions] };
                            }

                            return changed ? { ...asset, arenas: updatedArenas } : asset;
                        });

                        return changed ? nextAssets : prevAssets;
                    });

                    setActions((prevActions) => {
                        const linkedActionIds = new Set(operationalLinkedArenas.flatMap((entry) => entry.actions.map((action) => action.id)));
                        const preservedActions = prevActions.filter((action) => !linkedActionIds.has(action.id));
                        const mergedLinkedActions = operationalLinkedArenas.flatMap((entry) => entry.actions);
                        return [...preservedActions, ...mergedLinkedActions];
                    });

                    setTasks((prevTasks) => {
                        const linkedActionIds = new Set(operationalLinkedArenas.flatMap((entry) => entry.actions.map((action) => action.id)));
                        const preservedTasks = prevTasks.filter((task) => !linkedActionIds.has(task.actionId));
                        const mergedLinkedTasks = operationalLinkedArenas.flatMap((entry) => entry.tasks);
                        return [...preservedTasks, ...mergedLinkedTasks];
                    });
                }
            }
        }

        await syncRelationshipProfileSnapshot(userId);

        return {
            invites: (invitesResult.data || []).map(mapRelationshipInviteRow),
            links,
            linkedArenas: linkedArenaRows.map(row => mapLinkedRelationshipArenaRow(row, linksById, arenasById, actionsByArenaId, tasksByArenaId)),
            competitionChallenges,
            summary,
        };
    };

    const createRelationshipInvite = async (recipientId: string, linkType: RelationshipLinkType): Promise<boolean> => {
        const inviteCost = linkType === 'mentoria' ? 100 : 50;
        if ((userProfile.wallet?.gold || 0) < inviteCost) {
            const missingGold = Math.max(0, inviteCost - Number(userProfile.wallet?.gold || 0));
            showToast(`Saldo insuficiente. Faltam ${missingGold} de ouro para esse convite.`, 'warning');
            promptGoldShortage({
                requiredGold: inviteCost,
                label: linkType === 'mentoria' ? 'enviar mentoria' : linkType === 'parceria' ? 'enviar parceria' : 'enviar competicao',
                storeTab: 'store',
                section: 'packs',
            });
            return false;
        }

        const { data, error } = await supabase.rpc('create_relationship_link_invite', {
            p_recipient_id: recipientId,
            p_link_type: linkType,
        });

        if (error) {
            console.error('Error creating relationship invite:', error);
            showToast(mapRelationshipErrorMessage(error.message, 'Nao foi possivel enviar o convite.'), 'error');
            return false;
        }

        const nextGold = Number((data as any)?.new_gold ?? Math.max(0, (userProfile.wallet?.gold || 0) - inviteCost));
        const inviteId = String((data as any)?.invite?.id || '');
        updateUserProfile({ wallet: { ...userProfile.wallet, gold: nextGold } });

        if (linkType === 'mentoria' || linkType === 'parceria') {
            const notificationType = linkType === 'mentoria' ? 'mentor_invite' : 'partnership_invite';
            const senderNickname = userProfile.nickname || (linkType === 'mentoria' ? 'Mentor' : 'Aliado');
            const notificationContent = linkType === 'mentoria'
                ? `@${senderNickname} enviou um convite de Mentoria.`
                : `@${senderNickname} enviou um convite de Parceria.`;

            void SupabaseService.sendNotificationEmail(
                recipientId,
                notificationType,
                notificationContent,
                {
                    sendEmail: true,
                    inviteId,
                    senderNickname,
                    linkType,
                    dispatchKey: inviteId ? `invite:${notificationType}:${inviteId}` : undefined,
                },
            );
        }

        showToast(linkType === 'mentoria' ? 'Convite de mentoria enviado.' : linkType === 'parceria' ? 'Convite de parceria enviado.' : 'Convite de competicao enviado.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
        return true;
    };

    const respondToRelationshipInvite = async (inviteId: string, action: RelationshipInviteAction): Promise<boolean> => {
        const { data, error } = await supabase.rpc('respond_relationship_link_invite', {
            p_invite_id: inviteId,
            p_action: action,
        });

        if (error) {
            console.error('Error responding to relationship invite:', error);
            showToast(mapRelationshipErrorMessage(error.message, 'Nao foi possivel atualizar o convite.'), 'error');
            return false;
        }

        if (action === 'revoke') {
            const nextGold = Number((data as any)?.new_gold ?? userProfile.wallet?.gold ?? 0);
            updateUserProfile({ wallet: { ...userProfile.wallet, gold: nextGold } });
            showToast('Convite revogado e ouro devolvido.', 'success');
        } else if (action === 'decline') {
            showToast('Convite recusado.', 'success');
        } else {
            showToast('Convite aceito.', 'success');
        }

        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
        return true;
    };

    const endRelationshipLink = async (relationshipLinkId: string): Promise<boolean> => {
        const { data, error } = await supabase.rpc('end_relationship_link', {
            p_relationship_link_id: relationshipLinkId,
        });

        if (error) {
            console.error('Error ending relationship link:', error);
            showToast(mapRelationshipErrorMessage(error.message, 'Nao foi possivel encerrar este vinculo.'), 'error');
            return false;
        }

        const summary = parseRelationshipCapacitySummary((data as any)?.summary);
        if (summary) {
            updateUserProfile({
                partnershipSlotsPurchased: summary.partnership.purchased ?? userProfile.partnershipSlotsPurchased ?? 0,
                competitionSlotsPurchased: summary.competition.purchased ?? userProfile.competitionSlotsPurchased ?? 0,
                mentorSlotsPurchased: summary.mentor.purchased ?? userProfile.mentorSlotsPurchased ?? 0,
                linkedArenaSlotsPurchased: summary.linked_arena.purchased ?? userProfile.linkedArenaSlotsPurchased ?? 0,
            });
        }

        showToast('Vinculo encerrado.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
        return true;
    };

    const buyRelationshipCapacitySlot = async (slotType: RelationshipCapacitySlotType): Promise<boolean> => {
        showToast('A camada social agora funciona so por ouro.', 'info');
        return false;
    };

    const createLinkedRelationshipArena = async (
        relationshipLinkId: string,
        arenaInput: { assetId: string; name: string; description?: string; icon?: string }
    ): Promise<Arena | null> => {
        if ((userProfile.wallet?.gold || 0) < 50) {
            const missingGold = Math.max(0, 50 - Number(userProfile.wallet?.gold || 0));
            showToast(`Saldo insuficiente. Faltam ${missingGold} de ouro para compartilhar uma arena nesse vinculo.`, 'warning');
            promptGoldShortage({
                requiredGold: 50,
                label: 'compartilhar uma arena nesse vinculo',
                storeTab: 'store',
                section: 'packs',
            });
            return null;
        }

        const { data, error } = await supabase.rpc('create_linked_relationship_arena', {
            p_relationship_link_id: relationshipLinkId,
            p_asset_id: arenaInput.assetId,
            p_name: arenaInput.name,
            p_description: arenaInput.description ?? '',
            p_icon: arenaInput.icon ?? null,
        });

        if (error) {
            console.error('Error creating linked relationship arena:', error);
            showToast(mapRelationshipErrorMessage(error.message, 'Nao foi possivel criar a arena vinculada.'), 'error');
            return null;
        }

        const nextGold = Number((data as any)?.new_gold ?? userProfile.wallet?.gold ?? 0);
        const linkedArenaType = String((data as any)?.linked_arena?.metadata?.link_type || (data as any)?.link_type || '');
        updateUserProfile({ wallet: { ...userProfile.wallet, gold: nextGold } });

        const arenaRow = (data as any)?.arena;
        if (!arenaRow) {
            showToast(linkedArenaType === 'parceria' ? 'Arena compartilhada adicionada a parceria.' : 'Arena vinculada criada.', 'success');
            return null;
        }

        const mapped = mapToCamelCase(arenaRow) as Arena;
        const sessionUserId = getSupabaseUserId();
        const arenaOwnerId = String((arenaRow as any)?.user_id || '');
        const nextArena: Arena = {
            ...mapped,
            actionIds: mapped.actionIds || [],
            isArchived: mapped.isArchived ?? false,
        };

        const shouldAttachArenaToCurrentUser = Boolean(
            linkedArenaType !== 'mentoria'
            || !sessionUserId
            || arenaOwnerId === sessionUserId
        );

        if (shouldAttachArenaToCurrentUser) {
            setAssets(prevAssets => prevAssets.map(asset =>
                asset.id === nextArena.assetId
                    ? { ...asset, arenas: asset.arenas.some(arena => arena.id === nextArena.id) ? asset.arenas : [...asset.arenas, nextArena] }
                    : asset
            ));
        } else {
            setAssets(prevAssets => prevAssets.map(asset => ({
                ...asset,
                arenas: asset.arenas.filter(arena => arena.id !== nextArena.id),
            })));
            setActions(prevActions => prevActions.filter(action => action.arenaId !== nextArena.id));
            setTasks(prevTasks => prevTasks.filter(task => {
                const linkedAction = actions.find((action) => action.id === task.actionId);
                return linkedAction?.arenaId !== nextArena.id;
            }));
        }

        showToast(linkedArenaType === 'parceria' ? 'Arena compartilhada adicionada a parceria.' : 'Arena vinculada criada para a mentoria.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
        return nextArena;
    };

    const shareRelationshipArena = async (relationshipLinkId: string, arenaId: string): Promise<Arena | null> => {
        if (!arenaId) {
            showToast('Escolha uma arena sua para expor nessa parceria.', 'warning');
            return null;
        }

        if ((userProfile.wallet?.gold || 0) < PARTNERSHIP_LINKED_ARENA_GOLD_COST) {
            const missingGold = Math.max(0, PARTNERSHIP_LINKED_ARENA_GOLD_COST - Number(userProfile.wallet?.gold || 0));
            showToast(`Saldo insuficiente. Faltam ${missingGold} de ouro para expor essa arena.`, 'warning');
            promptGoldShortage({
                requiredGold: PARTNERSHIP_LINKED_ARENA_GOLD_COST,
                label: 'expor uma arena na parceria',
                storeTab: 'store',
                section: 'packs',
            });
            return null;
        }

        const { data, error } = await supabase.rpc('share_relationship_arena', {
            p_relationship_link_id: relationshipLinkId,
            p_arena_id: arenaId,
        });

        if (error) {
            console.error('Error sharing relationship arena:', error);
            showToast(mapRelationshipErrorMessage(error.message, 'Nao foi possivel expor essa arena na parceria.'), 'error');
            return null;
        }

        const nextGold = Number((data as any)?.new_gold ?? userProfile.wallet?.gold ?? 0);
        updateUserProfile({ wallet: { ...userProfile.wallet, gold: nextGold } });
        showToast('Arena exposta na parceria.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));

        const arenaRow = (data as any)?.arena;
        if (!arenaRow) return null;

        const mapped = mapToCamelCase(arenaRow) as Arena;
        return {
            ...mapped,
            actionIds: mapped.actionIds || [],
            isArchived: mapped.isArchived ?? false,
        };
    };

    const removeRelationshipArenaShare = async (relationshipLinkId: string, arenaId: string): Promise<boolean> => {
        const { error } = await supabase.rpc('remove_relationship_arena_share', {
            p_relationship_link_id: relationshipLinkId,
            p_arena_id: arenaId,
        });

        if (error) {
            console.error('Error removing relationship arena share:', error);
            showToast(mapRelationshipErrorMessage(error.message, 'Nao foi possivel retirar essa arena da parceria.'), 'error');
            return false;
        }

        showToast('Arena retirada da parceria.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
        return true;
    };

    const syncCompetitionChestLocally = async (chestType: ChestType) => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        const freshChests = await fetchChestsFromDB(userId);
        if (freshChests) {
            setUserProfile((prev) => ({ ...prev, chests: freshChests }));
            return;
        }

        setUserProfile((prev) => {
            const existingChests = prev.chests || [];
            const chestIndex = existingChests.findIndex((entry) => entry.type === chestType);
            const nextChests = chestIndex >= 0
                ? existingChests.map((entry, index) => index === chestIndex ? { ...entry, count: entry.count + 1 } : entry)
                : [...existingChests, { type: chestType, count: 1 }];
            return { ...prev, chests: nextChests };
        });
    };

    const createCompetitionChallenge = async (relationshipLinkId: string, sourceArenaId: string): Promise<Arena | null> => {
        if (!sourceArenaId) {
            showToast('Escolha uma arena sua para espelhar nesse duelo.', 'warning');
            return null;
        }

        if ((userProfile.wallet?.gold || 0) < COMPETITION_DUEL_GOLD_COST) {
            const missingGold = Math.max(0, COMPETITION_DUEL_GOLD_COST - Number(userProfile.wallet?.gold || 0));
            showToast(`Saldo insuficiente. Faltam ${missingGold} de ouro para forjar esse duelo.`, 'warning');
            promptGoldShortage({
                requiredGold: COMPETITION_DUEL_GOLD_COST,
                label: 'forjar um duelo competitivo',
                storeTab: 'store',
                section: 'packs',
            });
            return null;
        }

        const { data, error } = await supabase.rpc('create_competition_challenge', {
            p_relationship_link_id: relationshipLinkId,
            p_source_arena_id: sourceArenaId,
        });

        if (error) {
            console.error('Error creating competition challenge:', error);
            showToast(mapRelationshipErrorMessage(error.message, 'Nao foi possivel lancar esse duelo.'), 'error');
            return null;
        }

        const nextGold = Number((data as any)?.new_gold ?? userProfile.wallet?.gold ?? 0);
        updateUserProfile({ wallet: { ...userProfile.wallet, gold: nextGold } });

        const selfArenaRow = (data as any)?.challenger_arena;
        if (!selfArenaRow) {
            showToast('Desafio espelhado lancado.', 'success');
            return null;
        }

        const mappedArena = mapToCamelCase(selfArenaRow) as Arena;
        const challengerActions = Array.isArray((data as any)?.challenger_actions)
            ? ((data as any).challenger_actions as any[]).map(normalizeActionFromDbRow)
            : [];

        const nextArena: Arena = {
            ...mappedArena,
            actionIds: challengerActions.map((action) => action.id),
            isArchived: mappedArena.isArchived ?? false,
        };

        setAssets((prevAssets) => prevAssets.map((asset) => {
            if (asset.id !== nextArena.assetId) return asset;
            const existingIndex = asset.arenas.findIndex((arena) => arena.id === nextArena.id);
            if (existingIndex >= 0) {
                const nextArenas = [...asset.arenas];
                nextArenas[existingIndex] = nextArena;
                return { ...asset, arenas: nextArenas };
            }
            return { ...asset, arenas: [...asset.arenas, nextArena] };
        }));

        if (challengerActions.length > 0) {
            setActions((prevActions) => {
                const nextById = new Map(prevActions.map((action) => [action.id, action] as const));
                challengerActions.forEach((action) => {
                    nextById.set(action.id, action);
                });
                return Array.from(nextById.values());
            });
        }

        showToast('Duelo forjado. O snapshot foi selado e o primeiro que fechar leva o bonus.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
        return nextArena;
    };

    const resolveCompetitionChallengeOutcome = async (arenaId: string) => {
        if (!arenaId) return;

        const { data, error } = await supabase.rpc('resolve_competition_challenge_outcome', {
            p_arena_id: arenaId,
        });

        if (error) {
            console.error('Error resolving competition challenge outcome:', error);
            return;
        }

        const status = String((data as any)?.status || '');
        const winnerUserId = String((data as any)?.winner_user_id || '');
        const opponentNickname = String((data as any)?.opponent_nickname || 'seu rival');
        const challengeName = String((data as any)?.challenge_name || 'esse duelo');
        const rewardChestType = ((data as any)?.reward_chest_type || null) as ChestType | null;
        const winnerBonusXp = Number((data as any)?.winner_bonus_xp || 0);
        const rewardGrantedNow = Boolean((data as any)?.reward_granted_now);
        const sealedNow = Boolean((data as any)?.sealed_now);
        const currentUserId = getSupabaseUserId();

        if (status === 'winner' && currentUserId && winnerUserId === currentUserId) {
            if (rewardGrantedNow && rewardChestType) {
                await syncCompetitionChestLocally(rewardChestType);
            }
            const bonusDestination = winnerBonusXp > 0 ? applyRelationshipBonusXp(winnerBonusXp) : 'none';
            if (winnerBonusXp > 0) {
                if (bonusDestination === 'cycle') {
                    showToast(`Bonus de Duelo: +${winnerBonusXp} EXP adicionada direto no ciclo.`, 'success');
                } else if (bonusDestination === 'profile') {
                    showToast(`Bonus de Duelo: +${winnerBonusXp} EXP aplicada agora no perfil.`, 'success');
                }
            }
            window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            showToast(
                `Parabens! Voce terminou "${challengeName}" antes de @${opponentNickname} e ganhou um Bau ${rewardChestType || 'Comum'}${
                    winnerBonusXp > 0
                        ? bonusDestination === 'sitrep'
                            ? ` + ${winnerBonusXp} EXP de duelo para o fechamento do ciclo`
                            : ` + ${winnerBonusXp} EXP de duelo`
                        : ''
                }.`,
                'success'
            );
            return;
        }

        if (status === 'already_lost') {
            showToast(`@${opponentNickname} concluiu "${challengeName}" antes. Voce ainda pode fechar sua arena, mas sem o bonus de vencedor.`, 'info');
            return;
        }

        if (status === 'already_won') {
            showToast(`"${challengeName}" ja contou sua vitoria antes. O duelo segue registrado no historico.`, 'info');
            return;
        }

        if (status === 'sealed_after_loss') {
            window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            showToast(sealedNow
                ? `Voce concluiu "${challengeName}". O bonus ja tinha ido para @${opponentNickname}, entao o duelo foi selado no historico.`
                : `Voce concluiu "${challengeName}" sem o bonus extra.`, 'info');
        }
    };

    const createCodexShareLink = async (codexId: string): Promise<{ url: string; token: string; shareId: string } | null> => {
        const sourceCodex = userCodexes.find(c => c.id === codexId);
        if (!sourceCodex) {
            showToast('Campanha nao encontrada.', 'error');
            return null;
        }

        if (sourceCodex.source_type !== 'created') {
            showToast('Apenas campanhas autorais podem ser compartilhadas.', 'warning');
            return null;
        }

        if (!Array.isArray(sourceCodex.template?.levels) || sourceCodex.template.levels.length === 0) {
            showToast('Finalize o manuscrito antes de compartilhar.', 'warning');
            return null;
        }

        const { data, error } = await supabase.rpc('create_codex_share_link', {
            p_codex_id: codexId,
        });

        if (error) {
            console.error('Error creating codex share link:', error);
            showToast(error.message || 'Nao foi possivel forjar o link da campanha.', 'error');
            return null;
        }

        const shareToken = String((data as any)?.share_token || '');
        const shareId = String((data as any)?.share_id || '');
        const nextGold = Number((data as any)?.new_gold ?? Math.max(0, (userProfile.wallet?.gold || 0) - 50));
        updateUserProfile({ wallet: { ...userProfile.wallet, gold: nextGold } });

        const claimUrl = new URL(window.location.href);
        claimUrl.searchParams.set('claim_codex', shareToken);
        showToast('Link da campanha forjado.', 'success');
        return {
            url: claimUrl.toString(),
            token: shareToken,
            shareId,
        };
    };

    const sendCodexToNickname = async (codexId: string, nickname: string) => {
        const sourceCodex = userCodexes.find(c => c.id === codexId);
        if (!sourceCodex) {
            showToast('Campanha nao encontrada.', 'error');
            return;
        }

        if (sourceCodex.source_type !== 'created') {
            showToast('Apenas campanhas autorais podem ser compartilhadas.', 'warning');
            return;
        }

        if (!Array.isArray(sourceCodex.template?.levels) || sourceCodex.template.levels.length === 0) {
            showToast('Finalize o manuscrito antes de compartilhar.', 'warning');
            return;
        }

        const normalizedNickname = nickname.trim().replace(/^@+/, '');
        if (!normalizedNickname) {
            showToast('Digite o @nickname de quem vai receber.', 'warning');
            return;
        }

        const { data, error } = await supabase.rpc('send_codex_to_nickname', {
            p_codex_id: codexId,
            p_nickname: normalizedNickname,
        });

        if (error) {
            console.error('Error sending codex to nickname:', error);
            showToast(error.message || 'Nao foi possivel enviar a campanha.', 'error');
            return;
        }

        const nextGold = Number((data as any)?.new_gold ?? Math.max(0, (userProfile.wallet?.gold || 0) - 50));
        const recipientNickname = String((data as any)?.recipient_nickname || normalizedNickname);
        updateUserProfile({ wallet: { ...userProfile.wallet, gold: nextGold } });
        showToast(`Campanha enviada para @${recipientNickname}.`, 'success');
    };

    const getCodexSharePreview = async ({ token, shareId }: { token?: string; shareId?: string }): Promise<CodexSharePreview | null> => {
        const { data, error } = await supabase.rpc('get_codex_share_preview', {
            p_token: token ?? null,
            p_share_id: shareId ?? null,
        });

        if (error) {
            console.error('Error fetching codex share preview:', error);
            return null;
        }

        if (!data) return null;

        let template = (data as any)?.codex_template;
        if (typeof template === 'string') {
            try {
                template = JSON.parse(template);
            } catch (parseError) {
                console.error('Failed to parse codex share preview template', parseError);
            }
        }

        return {
            shareId: String((data as any)?.share_id || shareId || ''),
            status: (data as any)?.status || 'pending',
            deliveryMethod: (data as any)?.delivery_method || 'external_link',
            codexId: String((data as any)?.codex_id || ''),
            codexName: String((data as any)?.codex_name || 'Campanha sem nome'),
            codexDescription: String((data as any)?.codex_description || ''),
            codexAuthor: String((data as any)?.codex_author || 'Autor desconhecido'),
            codexTemplate: template,
            senderNickname: (data as any)?.sender_nickname || null,
            recipientNickname: (data as any)?.recipient_nickname || null,
            claimedAt: (data as any)?.claimed_at || null,
            canClaim: Boolean((data as any)?.can_claim),
        };
    };

    const claimCodexShare = async ({ token, shareId }: { token?: string; shareId?: string }): Promise<boolean> => {
        const { data, error } = await supabase.rpc('claim_codex_share', {
            p_token: token ?? null,
            p_share_id: shareId ?? null,
        });

        if (error) {
            console.error('Error claiming codex share:', error);
            showToast(error.message || 'Nao foi possivel reivindicar esta campanha.', 'error');
            return false;
        }

        if ((data as any)?.success === false) {
            showToast(String((data as any)?.error || 'Nao foi possivel reivindicar esta campanha.'), 'error');
            return false;
        }

        await fetchCodexData();
        await fetchNotifications();
        showToast(`Campanha "${String((data as any)?.codex_name || 'Recebida')}" reivindicada.`, 'success');
        return true;
    };
    const deleteUserCodex = async (codexId: string) => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        setUserCodexes(prev => prev.filter(c => c.id !== codexId));

        const { error } = await supabase.from('codex').delete().eq('id', codexId);
        if (error) {
            console.error("Error deleting codex:", error);
            showToast("Erro ao deletar campanha.");
        }
    };

    const transferUserCodex = async (codexId: string, recipientId: string) => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        setUserCodexes(prev => prev.filter(c => c.id !== codexId));

        const { error } = await supabase.from('codex').update({ owner_id: recipientId }).eq('id', codexId);
        if (error) {
            console.error("Error transferring codex:", error);
            showToast("Erro ao transferir campanha.");
        }
    };

    const duplicateUserCodexToRecipient = async (codexId: string, recipientId: string, relationshipLinkId: string | null = null): Promise<boolean> => {
        const userId = getSupabaseUserId();
        if (!userId) return false;

        const sourceCodex = userCodexes.find(c => c.id === codexId && c.owner_id === userId);
        if (!sourceCodex) {
            showToast('Campanha nao encontrada.');
            return false;
        }

        if (sourceCodex.catalog_id) {
            showToast('Campanha comprada nao pode ser copiada para pupilos.');
            return false;
        }

        if (!Array.isArray(sourceCodex.template?.levels) || sourceCodex.template.levels.length === 0) {
            showToast('Finalize o manuscrito antes de entregar ao pupilo.');
            return false;
        }

        const { data, error } = await supabase.rpc('deliver_authored_codex_to_pupil', {
            p_source_codex_id: codexId,
            p_recipient_id: recipientId,
            p_relationship_link_id: relationshipLinkId,
        });
        if (error) {
            console.error('Error duplicating mentor codex:', error);
            showToast(error.message || 'Erro ao entregar campanha ao pupilo.');
            return false;
        }

        if ((data as any)?.success === false) {
            showToast(String((data as any)?.error || 'Erro ao entregar campanha ao pupilo.'), 'error');
            return false;
        }

        showToast('Campanha autoral entregue ao pupilo.', 'success');
        return true;
    };

    const createMentorCodexForRecipient = async (
        recipientId: string,
        codex: { name: string; description?: string; template: any },
        relationshipLinkId: string | null = null
    ): Promise<boolean> => {
        const userId = getSupabaseUserId();
        if (!userId) return false;

        if ((userProfile.wallet?.gold || 0) < 100) {
            const missingGold = Math.max(0, 100 - Number(userProfile.wallet?.gold || 0));
            showToast(`Saldo insuficiente. Faltam ${missingGold} de ouro para forjar essa campanha.`, 'warning');
            promptGoldShortage({
                requiredGold: 100,
                label: 'forjar uma campanha para o pupilo',
                storeTab: 'store',
                section: 'packs',
            });
            return false;
        }

        if (!codex?.template || !Array.isArray(codex.template.levels) || codex.template.levels.length === 0) {
            showToast('Essa campanha ainda nao tem fases para enviar.');
            return false;
        }

        const { data, error } = await supabase.rpc('forge_mentor_codex_for_pupil', {
            p_recipient_id: recipientId,
            p_name: codex.name?.trim() || 'Nova Campanha',
            p_description: codex.description?.trim() || '',
            p_template: codex.template,
            p_relationship_link_id: relationshipLinkId,
        });
        if (error) {
            console.error('Error creating mentor codex for recipient:', error);
            showToast(mapRelationshipErrorMessage(error.message, 'Erro ao criar campanha para o pupilo.'), 'error');
            return false;
        }

        const nextGold = Number((data as any)?.new_gold ?? userProfile.wallet?.gold ?? 0);
        updateUserProfile({
            wallet: { ...userProfile.wallet, gold: nextGold },
        });
        showToast('Nova campanha enviada ao pupilo por 100 de ouro.', 'success');
        return true;
    };

    const installCodex = async (userCodexId: string) => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        const codex = userCodexes.find(c => c.id === userCodexId);
        if (!codex || !codex.template || !Array.isArray(codex.template.levels)) return;

        const template = codex.template;
        const catalogRefId = codex.catalog_id || codex.origin_codex_id || codex.id;
        const templateMeta = resolveTemplateCampaignMeta(catalogRefId, template);
        const preferredAssetId = templateMeta.primaryAssetId || 'fisico';
        const assetId =
            assets.find(a => a.id === preferredAssetId)?.id ||
            assets.find(a => a.id === 'fisico')?.id ||
            assets[0]?.id ||
            'geral';
        const arenaIds: string[] = [];
        const createdArenaIds: string[] = [];
        const createdActionIds: string[] = [];
        let createdCampaignId: string | null = null;
        const arenaConfig: NonNullable<Campaign['arenaConfig']> = {};
        const baseArenaOrder = getArenas().length;
        const baseCampaignOrder = campaigns.length;
        const baseCampaignPriorityOrder = campaigns.filter(c => (c.priority ?? 'media') === 'media').length;
        const previousCycleArenaIds = activeCycle ?[...activeCycle.arenaIds] : null;
        const requestedArenaCount = template.levels.length;
        const arenaCapacity = getArenaCapacitySummary(assetsRef.current, userProfile);

        emitArenaAttention({
            arenaIds: [],
            phase: 'populate',
            navigateToArenas: true,
        });

        if (arenaCapacity.total + requestedArenaCount > arenaCapacity.limit) {
            showToast(buildArenaLimitMessage(arenaCapacity, { requestedArenaCount }), 'warning');
            return;
        }

        const rollbackInstalledCodex = async () => {
            const arenaIdSet = new Set(createdArenaIds);
            const actionIdSet = new Set(createdActionIds);

            if (createdCampaignId) {
                setCampaigns(prev => prev.filter(campaign => campaign.id !== createdCampaignId));
            }

            if (createdActionIds.length > 0) {
                setTasks(prev => prev.filter(task => !actionIdSet.has(task.actionId)));
                setActions(prev => prev.filter(action => !actionIdSet.has(action.id)));
            }

            if (createdArenaIds.length > 0 || createdActionIds.length > 0) {
                setAssets(prevAssets => prevAssets.map(asset => ({
                    ...asset,
                    arenas: asset.arenas
                        .filter(arena => !arenaIdSet.has(arena.id))
                        .map(arena => {
                            const actionIds = Array.isArray(arena.actionIds) ?arena.actionIds : [];
                            return actionIds.some(id => actionIdSet.has(id))
                                ?{ ...arena, actionIds: actionIds.filter(id => !actionIdSet.has(id)) }
                                : arena;
                        })
                })));
            }

            if (activeCycle && previousCycleArenaIds) {
                setActiveCycle(prev => prev?.id === activeCycle.id ?{ ...prev, arenaIds: previousCycleArenaIds } : prev);
            }

            const rollbackOps: PromiseLike<any>[] = [];
            if (createdCampaignId) {
                rollbackOps.push(supabase.from('campaigns').delete().eq('id', createdCampaignId));
            }
            if (createdActionIds.length > 0) {
                rollbackOps.push(supabase.from('scheduled_tasks').delete().in('action_id', createdActionIds));
                rollbackOps.push(supabase.from('actions').delete().in('id', createdActionIds));
            }
            if (createdArenaIds.length > 0) {
                rollbackOps.push(supabase.from('arenas').delete().in('id', createdArenaIds));
            }
            if (activeCycle && previousCycleArenaIds) {
                rollbackOps.push(supabase.from('cycles').update({ arena_ids: previousCycleArenaIds }).eq('id', activeCycle.id));
            }

            if (rollbackOps.length > 0) {
                await Promise.allSettled(rollbackOps);
            }
        };

        try {
            for (const [index, level] of template.levels.entries()) {
                const levelNumber = typeof level?.level === 'number' ? level.level : index + 1;
                const createdArena = await addArena(assetId, {
                    name: getCodexLevelDisplayTitle(level.title, levelNumber),
                    description: level.description || '',
                    icon: level.actions?.[0]?.icon || '?',
                    originCodexId: codex.id,
                    codexLevel: level.level,
                    priority: 'media',
                    order: baseArenaOrder + index,
                    priorityOrder: index
                });

                createdArenaIds.push(createdArena.id);
                arenaIds.push(createdArena.id);
                emitArenaAttention({
                    arenaIds: [createdArena.id],
                    focusArenaId: createdArena.id,
                    phase: 'populate',
                    navigateToArenas: true,
                });
                const previousArenaId = arenaIds[arenaIds.length - 2];
                arenaConfig[createdArena.id] = {
                    isLocked: levelNumber > 1,
                    isHidden: false,
                    prerequisiteArenaIds: levelNumber > 1 && previousArenaId ? [previousArenaId] : []
                };

                for (const levelAction of level.actions || []) {
                    const actionType = levelAction.actionType === 'Marco' || levelAction.actionType === 'Compromisso' || levelAction.actionType === 'A\u00E7\u00E3o Recorrente'
                        ? levelAction.actionType
                        : 'A\u00E7\u00E3o Recorrente';

                    const createdAction = await addAction({
                        arenaId: createdArena.id,
                        name: levelAction.name,
                        description: levelAction.description || '',
                        icon: levelAction.icon || '\u{1F4DD}',
                        duration: Number.isFinite(levelAction.duration) ?levelAction.duration : 15,
                        repetitions: Number.isFinite(levelAction.repetitions) ?Math.max(1, Math.floor(levelAction.repetitions)) : 1,
                        actionType,
                        difficulty: typeof levelAction.difficulty === 'number' ?levelAction.difficulty : 1,
                        scheduledDays: Array.isArray(levelAction.scheduledDays) ?levelAction.scheduledDays : undefined,
                        scheduledStartTime: typeof levelAction.scheduledStartTime === 'number' ?levelAction.scheduledStartTime : undefined,
                        briefing: levelAction.briefing,
                        assets: levelAction.assets,
                        preFlight: levelAction.preFlight,
                        context: levelAction.context,
                        originCodexId: codex.id,
                    });

                    createdActionIds.push(createdAction.id);

                    if (
                        createdAction.actionType === 'A\u00E7\u00E3o Recorrente' &&
                        createdAction.scheduledDays &&
                        createdAction.scheduledDays.length > 0 &&
                        typeof createdAction.scheduledStartTime === 'number'
                    ) {
                        await scheduleMultipleTasks(createdAction, createdAction.scheduledDays, createdAction.scheduledStartTime);
                    }
                }
            }

            const createdCampaign = await addCampaign({
                userId,
                title: template.title,
                description: template.description,
                arenaIds,
                arenaConfig,
                type: 'sequential',
                priority: 'media',
                order: baseCampaignOrder,
                priorityOrder: baseCampaignPriorityOrder
            });
            createdCampaignId = createdCampaign.id;

            emitArenaAttention({
                arenaIds,
                campaignId: createdCampaign.id,
                focusArenaId: arenaIds[0] ?? null,
                phase: 'populate',
                navigateToArenas: true,
            });

            showToast(`Campanha "${codex.name}" instalada com sucesso!`);
        } catch (error: any) {
            await rollbackInstalledCodex();
            console.error("Error creating campaign from codex:", error);
            showToast("Erro ao instalar campanha: " + (error?.message || 'falha desconhecida'), 'error');
        }
    };

    useEffect(() => {
        const sessionUserId = session?.user.id;
        if (!sessionUserId || !isUuid(sessionUserId) || !isProfileLoaded || !hasHydratedFromSupabase) {
            autoInstallingMentorCodexIdsRef.current.clear();
            return;
        }

        const installedOriginCodexIds = new Set(
            assets.flatMap((asset) => asset.arenas.map((arena) => arena.originCodexId).filter(Boolean))
        );
        const pendingMentorCodexes = userCodexes.filter((codex) =>
            Boolean(codex.mentor_relationship_link_id)
            && Array.isArray(codex.template?.levels)
            && codex.template.levels.length > 0
            && !installedOriginCodexIds.has(codex.id)
            && !autoInstallingMentorCodexIdsRef.current.has(codex.id)
        );

        if (pendingMentorCodexes.length === 0) return;

        let cancelled = false;

        const autoInstallMentorCodexes = async () => {
            for (const codex of pendingMentorCodexes) {
                if (cancelled) return;

                autoInstallingMentorCodexIdsRef.current.add(codex.id);
                try {
                    await installCodex(codex.id);
                } finally {
                    autoInstallingMentorCodexIdsRef.current.delete(codex.id);
                }
            }
        };

        void autoInstallMentorCodexes();

        return () => {
            cancelled = true;
        };
    }, [assets, hasHydratedFromSupabase, isProfileLoaded, session?.user.id, userCodexes]);

    const addFeedEvent = (eventData: Pick<FeedEvent, 'type' | 'content'>) => {
        const localEvent: FeedEvent = {
            id: `feed_${Date.now()}`,
            userId: userProfile.id,
            authorNickname: userProfile.nickname,
            authorAvatarUrl: userProfile.avatarUrl,
            authorClanName: userProfile.clanName,
            authorClanIcon: userProfile.clanIcon,
            timestamp: new Date().toISOString(),
            type: eventData.type,
            content: eventData.content
        };

        const userId = getSupabaseUserId();
        if (!userId || !isUuid(userId)) {
            setFeed(prev => [localEvent, ...prev]);
            return;
        }

        void (async () => {
            const { error } = await supabase.from('social_feed_events').insert({
                user_id: userId,
                event_type: eventData.type,
                content: eventData.content,
                author_nickname: userProfile.nickname,
                author_avatar_url: userProfile.avatarUrl || null,
                author_clan_name: userProfile.clanName || null,
                author_clan_icon: userProfile.clanIcon || null,
            });

            if (error) {
                const message = String(error.message || '');
                if (message.includes('social_feed_events')) {
                    setFeed(prev => [localEvent, ...prev]);
                    return;
                }
                console.error('Error creating feed event:', error.message);
                setFeed(prev => [localEvent, ...prev]);
                return;
            }

            await fetchSocialFeed();
        })();
    };

    const openChest = async (chestType: ChestType): Promise<ChestOpenResult | null> => {
        const userId = getSupabaseUserId();
        if (!userId) return null;

        // LÃ³gica especial para o BaÃº de Skin Comum (Exclusivo para Skins)
        if (chestType === 'Skin Comum') {
            // Filtrar apenas skins
            const allSkins = getCatalogItemsByCategory('skin').filter(i => isChestEligibleItem(i));

            // Rarity weights for Skin Comum chest
            // 75% Common, 20% Uncommon, 5% Rare
            const rand = Math.random() * 100;
            let targetRarity: ItemRarity = 'common';
            if (rand > 95) targetRarity = 'rare';
            else if (rand > 75) targetRarity = 'uncommon';

            const possibleSkins = allSkins.filter(s => s.rarity === targetRarity);
            // Fallback if no skins of that rarity found (shouldn't happen with current DB)
            const selectedSkin = possibleSkins.length > 0
                ?possibleSkins[Math.floor(Math.random() * possibleSkins.length)]
                : allSkins[0];

            // Call RPC to grant the specific item (mimics open_chest logic)
            const { data, error } = await supabase.rpc('open_chest_specific', {
                p_chest_type: 'Skin Comum',
                p_item_id: selectedSkin.id
            });

            // Se o RPC open_chest_specific nÃ£o existir, vamos tentar o open_chest padrÃ£o 
            // mas o ideal Ã© que o backend suporte esse novo baÃº.
            // Como nÃ£o podemos mudar o backend, vamos usar a lÃ³gica local e atualizar o DB manualmente se necessÃ¡rio.
            // Mas o sistema jÃ¡ tem recycle_item e craft_item que usam RPCs.

            if (error) {
                console.error("Error opening Skin Chest:", error);
                // Fallback: Tentar usar o open_chest normal se o especÃ­fico falhar
                const { data: fallbackData, error: fallbackError } = await supabase.rpc('open_chest', {
                    p_chest_type: 'Comum' // Fallback para comum se der erro no custom
                });
                if (fallbackError) {
                    showToast("Erro: " + fallbackError.message);
                    return null;
                }
                // Continue with fallback data
                return handleChestOpenResult(fallbackData, 'Comum');
            }

            if (data && data.success) {
                return handleChestOpenResult(data, 'Skin Comum');
            }
            return null;
        }

        const { data, error } = await supabase.rpc('open_chest', {
            p_chest_type: chestType
        });

        if (error) {
            console.error("Error opening chest:", error);
            showToast("Erro: " + error.message);
            return null;
        }

        if (data && data.success) {
            return handleChestOpenResult(data, chestType);
        }
        return null;
    };

    // Helper to process chest opening results
    const handleChestOpenResult = (data: any, chestType: ChestType): ChestOpenResult => {
        const userId = getSupabaseUserId();
        const resolvedItem = resolveItemDef(data.item_id) || ITEMS_DB.find(item => item.name === data.item_name);
        const result: ChestOpenResult = {
            success: true,
            chestType,
            itemId: resolvedItem?.id || data.item_id,
            itemName: data.item_name || resolvedItem?.name,
            tier: data.tier || resolvedItem?.tier,
            rarity: resolvedItem?.rarity || 'common',
            fragmentsGained: Number(data.fragments_gained || 0),
            isDuplicate: !!data.is_duplicate,
        };
        if (!userId) return result;

        // Show reward (item + fragments)
        const rewardMsg = `\u{1F381} ${data.item_name} (Tier ${data.tier}) \u2022 +${data.fragments_gained} Fragmentos!`;
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
                index === chestIndex ?{ ...chest, count: chest.count - 1 } : chest
            ).filter(chest => chest.count > 0);

            return { ...prev, chests: newChests };
        });

        return result;
    };



    const isQuestActionId = useCallback((actionId: string) => isQuestAction(actionId, actions, allArenas), [actions, allArenas]);

    const isClanQuestActionId = useCallback((actionId: string) => isClanQuestAction(actionId, actions, allArenas), [actions, allArenas]);

    const resetDailyCommitment = () => {
        const today = getTodayString();
        setDailyCommitmentState({
            date: today,
            taskIds: getInitialDailyCommitmentTaskIds(tasks, today, isClanQuestActionId),
            stage: 'planning',
            score: null,
            expDeposited: null,
            sitrepBonus: null,
            relationshipBonusXp: null,
            operationalScratch: null,
        });
        setChecklistItems([...defaultChecklistItems]);
    };
    const setDailyCommitment = (taskIds: string[]) => setDailyCommitmentState(prev => ({ ...prev, taskIds: [...new Set(taskIds)] }));
    const updateOperationalScratch = (text: string) => setDailyCommitmentState(prev => ({ ...prev, operationalScratch: text }));
    const lockDailyCommitment = () => setDailyCommitmentState(prev => ({ ...prev, stage: 'battle' }));
    const unlockDailyCommitment = () => setDailyCommitmentState(prev => ({ ...prev, stage: 'planning' }));
    const applyRelationshipBonusXp = (bonusXp: number): 'sitrep' | 'cycle' | 'profile' | 'none' => {
        const normalizedBonus = Math.max(0, Math.round(bonusXp));
        if (normalizedBonus <= 0) return 'none';

        const today = getTodayString();
        if (dailyCommitment.date === today && dailyCommitment.stage !== 'judgment') {
            setDailyCommitmentState((prev) => ({
                ...prev,
                relationshipBonusXp: (prev.relationshipBonusXp || 0) + normalizedBonus,
            }));
            return 'sitrep';
        }

        if (activeCycle) {
            setCycleExpBonus((prev) => prev + normalizedBonus);
            return 'cycle';
        }

        const boostedExp = Math.round(normalizedBonus * getExpBoostMultiplier(userProfile));
        updateUserProfile({ nobility: { ...userProfile.nobility, exp: userProfile.nobility.exp + boostedExp } });
        return 'profile';
    };
    const refreshJudgedOperationalDates = useCallback(async () => {
        const userId = getSupabaseUserId();
        if (!userId) {
            setJudgedOperationalDates([]);
            return;
        }

        const { data, error } = await supabase
            .from('daily_commitments')
            .select('date')
            .eq('user_id', userId)
            .eq('stage', 'judgment');

        if (error) {
            console.error("Error loading judged operational dates:", error.message);
            return;
        }

        setJudgedOperationalDates(
            Array.isArray(data)
                ? data
                    .map((row: { date?: unknown }) => (typeof row.date === 'string' ? row.date : ''))
                    .filter((date): date is string => Boolean(date))
                : []
        );
    }, [getSupabaseUserId]);

    // Persistence: Save dailyCommitment to Supabase whenever it changes
    useEffect(() => {
        const userId = getSupabaseUserId();
        if (!userId || !dailyCommitment.date) return;

        const saveCommitment = async () => {
            const payload = {
                user_id: userId,
                date: dailyCommitment.date,
                task_ids: dailyCommitment.taskIds,
                stage: dailyCommitment.stage,
                score: dailyCommitment.score,
                exp_deposited: dailyCommitment.expDeposited,
                sitrep_bonus: dailyCommitment.sitrepBonus,
                relationship_bonus_xp: dailyCommitment.relationshipBonusXp ?? 0,
                operational_scratch: dailyCommitment.operationalScratch ?? null,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('daily_commitments')
                .upsert(payload, { onConflict: 'user_id,date' });

            if (error) {
                console.error("Error persisting daily commitment:", error.message);
            }
        };

        if (!isProfileLoaded) return;

        if (dailyCommitmentPersistTimeoutRef.current !== null) {
            window.clearTimeout(dailyCommitmentPersistTimeoutRef.current);
        }

        // Coalesce rapid planner edits and scratch typing into a single upsert.
        dailyCommitmentPersistTimeoutRef.current = window.setTimeout(() => {
            dailyCommitmentPersistTimeoutRef.current = null;
            void saveCommitment();
        }, typeof dailyCommitment.operationalScratch === 'string' ? 700 : 250);

        return () => {
            if (dailyCommitmentPersistTimeoutRef.current !== null) {
                window.clearTimeout(dailyCommitmentPersistTimeoutRef.current);
                dailyCommitmentPersistTimeoutRef.current = null;
            }
        };
    }, [dailyCommitment, getSupabaseUserId, isProfileLoaded]);

    // Hydration: Load dailyCommitment from Supabase on start or session change
    useEffect(() => {
        const userId = getSupabaseUserId();
        if (!userId) return;

        const loadCommitment = async () => {
            const today = getTodayString();
            const { data, error } = await supabase
                .from('daily_commitments')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today)
                .maybeSingle();

            if (error) {
                console.error("Error loading daily commitment:", error.message);
                return;
            }

            if (data) {
                const mapped = mapToCamelCase(data) as Record<string, unknown>;
                setDailyCommitmentState({
                    date: typeof mapped.date === 'string' ?mapped.date : today,
                    taskIds: Array.isArray(mapped.taskIds) ?mapped.taskIds as string[] : [],
                    stage: (mapped.stage as DailyCommitmentStage) || 'planning',
                    score: typeof mapped.score === 'number' ?mapped.score : null,
                    expDeposited: typeof mapped.expDeposited === 'number' ?mapped.expDeposited : null,
                    sitrepBonus: typeof mapped.sitrepBonus === 'number' ?mapped.sitrepBonus : null,
                    relationshipBonusXp: typeof mapped.relationshipBonusXp === 'number' ? mapped.relationshipBonusXp : 0,
                    operationalScratch: typeof mapped.operationalScratch === 'string' ?mapped.operationalScratch : null,
                });
            } else {
                setDailyCommitmentState({
                    date: today,
                    taskIds: getInitialDailyCommitmentTaskIds(tasks, today, isClanQuestActionId),
                    stage: 'planning',
                    score: null,
                    expDeposited: null,
                    sitrepBonus: null,
                    relationshipBonusXp: null,
                    operationalScratch: null,
                });
            }
        };

        if (isProfileLoaded) {
            loadCommitment();
        }
    }, [getSupabaseUserId, isProfileLoaded]);

    useEffect(() => {
        if (!isProfileLoaded) return;

        const userId = getSupabaseUserId();
        if (!userId) {
            setJudgedOperationalDates([]);
            return;
        }

        void refreshJudgedOperationalDates();
    }, [getSupabaseUserId, isProfileLoaded, refreshJudgedOperationalDates]);

    useEffect(() => {
        const checkDailyReset = () => {
            const today = getTodayString();
            if (dailyCommitment.date !== today) {
                resetDailyCommitment();
                setChecklistItems([...defaultChecklistItems]);
            }
        };

        checkDailyReset();
        const intervalId = window.setInterval(checkDailyReset, 60000);

        // [NEW] Retroactive EXP Safeguard (Phase 4)
        const checkRetroactiveExp = async () => {
            const userId = getSupabaseUserId();
            if (!userId) return;

            const today = getTodayString();
            const oldestOpenDate = shiftLocalDateString(today, -1);
            const { data: pendingDays, error } = await supabase
                .from('daily_commitments')
                .select('*')
                .lt('date', oldestOpenDate)
                .neq('stage', 'judgment'); // Not yet closed

            if (pendingDays && pendingDays.length > 0) {
                console.log(`[RETROACTIVE] Found ${pendingDays.length} unclosed days. Processing...`);
                const newlyJudgedDates: string[] = [];
                // For each unclosed day, we'll try to find its tasks and close it
                for (const day of pendingDays) {
                    const trackedTaskIds = Array.isArray(day.task_ids) ? day.task_ids.filter((id): id is string => typeof id === 'string') : [];
                    let dayTasks: { duration: number | null; completed: boolean | null; action_id: string | null }[] | null = null;

                    if (trackedTaskIds.length > 0) {
                        const result = await supabase
                            .from('scheduled_tasks')
                            .select('duration, completed, action_id')
                            .eq('user_id', userId)
                            .in('id', trackedTaskIds);
                        dayTasks = result.data;
                    } else {
                        const result = await supabase
                            .from('scheduled_tasks')
                            .select('duration, completed, action_id')
                            .eq('user_id', userId)
                            .eq('date', day.date);
                        dayTasks = result.data;
                    }

                    if (dayTasks && dayTasks.length > 0) {
                        const completedTasks = dayTasks.filter(t => t.completed);
                        if (completedTasks.length > 0) {
                            // Calculate EXP similar to endDailyBattle
                            const baseExp = completedTasks.reduce((acc, t) => {
                                const action = actions.find(candidate => candidate.id === t.action_id);
                                const weightedDuration = Math.round((t.duration || 0) * getActionExpMultiplier(action));
                                return acc + weightedDuration;
                            }, 0);
                            const score = dayTasks.length > 0 ?Math.round((completedTasks.length / dayTasks.length) * 100) : 100;
                            const bonus = score >= 95 ?SITREP_BONUS_S : score >= 85 ?SITREP_BONUS_A : 0;
                            const totalRetroExp = baseExp + bonus;

                            if (totalRetroExp > 0) {
                                // Deposit into Active Cycle or Profile
                                applyExp(totalRetroExp);
                                showToast(`EXP de ${day.date} recuperada: +${totalRetroExp}!`, 'success');
                            }
                        }
                    }

                    // Mark day as closed to avoid duplicate processing
                    await supabase
                        .from('daily_commitments')
                        .update({ stage: 'judgment', score: 0, exp_deposited: 0 })
                        .eq('user_id', userId)
                        .eq('date', day.date);

                    if (typeof day.date === 'string' && day.date) {
                        newlyJudgedDates.push(day.date);
                    }
                }

                if (newlyJudgedDates.length > 0) {
                    setJudgedOperationalDates(prev => Array.from(new Set([...prev, ...newlyJudgedDates])));
                }
            }
        };
        checkRetroactiveExp();

        return () => window.clearInterval(intervalId);
    }, [dailyCommitment.date, resetDailyCommitment, setChecklistItems]);

    useEffect(() => {
        if (dailyCommitment.taskIds.length === 0) return;

        const reconciledTaskIds = Array.from(new Set(dailyCommitment.taskIds)).filter(taskId => {
            const task = tasks.find(item => item.id === taskId);
            return !!task &&
                taskMatchesOperationalDate(task, dailyCommitment.date) &&
                !isClanQuestActionId(task.actionId);
        });

        const isSame =
            reconciledTaskIds.length === dailyCommitment.taskIds.length &&
            reconciledTaskIds.every((taskId, index) => taskId === dailyCommitment.taskIds[index]);

        if (isSame) return;

        setDailyCommitmentState(prev => (
            prev.date === dailyCommitment.date
                ? { ...prev, taskIds: reconciledTaskIds }
                : prev
        ));
    }, [dailyCommitment.date, dailyCommitment.taskIds, isClanQuestActionId, tasks]);

    const endDailyBattle = () => {
        // Anti-exploit: do not close battles from the future
        const now = new Date();
        const todayString = getTodayString();
        if (dailyCommitment.date > todayString) {
            showToast("AmanhÃ£ ainda nÃ£o pode ser julgado. Hoje vocÃª sÃ³ pode travar as metas.", "error");
            return;
        }

        const committedTasks = tasks.filter(t => dailyCommitment.taskIds.includes(t.id) && taskMatchesOperationalDate(t, dailyCommitment.date));
        const completedCount = committedTasks.filter(t => t.completed).length;
        const totalCount = committedTasks.length;
        const score = totalCount > 0 ?Math.round((completedCount / totalCount) * 100) : 100;

        const expDepositBase = committedTasks.reduce((sum, task) => {
            if (!task.completed) return sum;
            const action = actions.find(a => a.id === task.actionId);
            const duration = task.duration > 0 ?task.duration : (Number.isFinite(action?.duration) ?(action?.duration || 0) : 0);
            const weightedDuration = Math.round(duration * getActionExpMultiplier(action));
            return sum + weightedDuration;
        }, 0);
        const performanceSitrepBonus = score >= 95 ?SITREP_BONUS_S : score >= 85 ?SITREP_BONUS_A : 0;
        const relationshipBonusXp = Math.max(0, Math.round(dailyCommitment.relationshipBonusXp || 0));
        const sitrepBonus = performanceSitrepBonus + relationshipBonusXp;

        // [NEW] Village Order Bonus (Nerfed to 10% max)
        const mainSlots = aldeiaSlots.filter(s => s.slotId !== 'trono');
        const villageOrder = mainSlots.length > 0 ?(mainSlots.reduce((acc, s) => acc + s.health, 0) / mainSlots.length) : 0;
        const villageBonusFactor = (villageOrder / 100) * MAX_VILLAGE_BONUS_PERCENT;
        const villageBonusExp = Math.round((expDepositBase + sitrepBonus) * villageBonusFactor);

        const expDeposited = expDepositBase + sitrepBonus + villageBonusExp;
        emitAppSensoryCue('daily_panel_closed');
        if (relationshipBonusXp > 0) {
            showToast(`Bonus de Duelo: +${relationshipBonusXp} EXP no fechamento do ciclo.`, 'success');
        }

        if (villageBonusExp > 0) {
            showToast(`BÃ´nus de Ordem da Aldeia: +${villageBonusExp} EXP!`, 'success');
        }

        setAchievementUnlocked({
            type: 'REPORT_COMPLETED',
            data: {
                title: `RelatÃ³rio DiÃ¡rio - ${score}%`,
                reward: {
                    exp: expDeposited
                }
            }
        });

        const newStage = 'judgment';
        setDailyCommitmentState(prev => ({ ...prev, stage: newStage, score, expDeposited, sitrepBonus, relationshipBonusXp }));
        setJudgedOperationalDates(prev => (
            prev.includes(dailyCommitment.date)
                ? prev
                : [...prev, dailyCommitment.date]
        ));

        emitDailyCompletionPrompt({
            kind: 'sitrep',
            date: dailyCommitment.date,
            score,
            expDeposited,
        });

        if (activeCycle && expDeposited > 0) {
            setCycleExpBonus(prev => prev + expDeposited);
            showToast(`${expDeposited} EXP foi adicionada ao seu ciclo.`);
        } else if (expDeposited > 0) {
            const boostedExp = Math.round(expDeposited * getExpBoostMultiplier(userProfile));
            // Fallback if no cycle, apply to user directly?Or just warn?
            // User asked for "cycle", so assuming cycle is manh?datory for this flow.
            // But let's apply to user if no cycle, just in case.
            updateUserProfile({ nobility: { ...userProfile.nobility, exp: userProfile.nobility.exp + boostedExp } });
            showToast(`+${boostedExp} EXP`, 'success');
        }

        // Persist to Supabase if logged in
        const supabaseUserId = getSupabaseUserId();
        if (supabaseUserId) {
            const sitrepReport = {
                id: crypto.randomUUID(),
                user_id: supabaseUserId,
                date: dailyCommitment.date,
                score: score,
                completed_tasks_count: completedCount,
                total_tasks_count: totalCount,
                task_ids: dailyCommitment.taskIds,
                bonus_xp: sitrepBonus, // Add explicit bonus_xp column if it exists or rely on recalculation
                cycle_id: activeCycle?.id // Include cycle_id for proper linking
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

            // Usar Supabase para salvar posiÃ§Ã£o, garantindo que user_id seja o do usuÃ¡rio logado
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
            // Buscar posiÃ§Ãµes do Supabase
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



    // FunÃ§Ã£o para atualizar estatÃ­sticas do santuÃ¡rio baseada em tempo (Crescimento/Decaimento suave)
    const applySanctuaryAreaDecay = async (clanId: string, occupancy: Record<string, number>, totalMembers: number = 1) => {
        try {
            const currentTime = new Date();
            const areas = ['meditation', 'devotion', 'rest', 'garden'];

            // Constantes de Balanceamento (Baseado em 28800s = 100%)
            const MAX_POINTS = 28800;
            // Ganho de 30% (8640s) por dia (86400s) -> mais rÃ¡pido para incentivar
            const MAX_DAILY_GROWTH = MAX_POINTS * 0.30;
            const GROWTH_RATE_PER_SECOND = MAX_DAILY_GROWTH / 86400;

            // Perda de 25% (7200s) por dia (86400s) -> decaimento visÃ­vel
            const DECAY_RATE_PER_SECOND = (MAX_POINTS * 0.25) / 86400;

            // Intervalo mÃ­nimo de atualizaÃ§Ã£o reduzido para 10s para ser muito fluido
            const MIN_UPDATE_INTERVAL = 10;

            // OTIMIZACAO: Buscar todos de uma vez para reduzir reads
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

                const lastUpdated = currentStats?.last_updated ?new Date(currentStats.last_updated) : currentTime;
                // Se nÃ£o existir, assume 50%
                let totalSeconds = currentStats ?Number(currentStats.total_seconds) : 14400;

                // Calcular tempo passado em segundos
                const secondsPassed = (currentTime.getTime() - lastUpdated.getTime()) / 1000;

                // Ignorar atualizaÃ§Ãµes muito frequentes para economizar writes
                if (secondsPassed < MIN_UPDATE_INTERVAL && currentStats) continue;

                let change = 0;
                const activeUsers = occupancy[area] || 0;

                if (activeUsers > 0) {
                    // Se ocupado: Cresce proporcionalmente Ã  participaÃ§Ã£o do clÃ£
                    // Meta: 10% ao dia se 100% do clÃ£ estiver participando
                    const participationRatio = Math.min(1, activeUsers / Math.max(1, totalMembers));
                    change = secondsPassed * GROWTH_RATE_PER_SECOND * participationRatio;
                } else {
                    // Se vazio: Decai 5% ao dia
                    change = -(secondsPassed * DECAY_RATE_PER_SECOND);
                }

                let nextTotalSeconds = totalSeconds + change;
                // Clamp entre 0 e Max
                nextTotalSeconds = Math.max(0, Math.min(MAX_POINTS, nextTotalSeconds));

                // Arredondar para inteiro para evitar "dÃ­gitos quebrados"
                const finalSeconds = Math.floor(nextTotalSeconds);

                // Se nÃ£o mudou nada (devido ao arredondamento), ignora
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
                // Also need total members... clan object has it?No, need enrichedClanMembers.length
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
        document.body.setAttribute('data-skin', resolveUiSkinId(appMode === 'BASIC' ? 'BASIC' : userProfile.skin));
    }, [appMode, userProfile.skin]);

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
        const newRankId = newRank ?newRank.id : oldRankId;

        if (oldRankId !== newRankId) {
            const oldRankIndex = nobilityRanks.findIndex(r => r.id === oldRankId);
            const newRankIndex = nobilityRanks.findIndex(r => r.id === newRankId);

            // MODIFICACAO: So dispara se subiu de fato e nao e o carregamento inicial (oldRankIndex !== -1)
            // E tambem nao dispara se o novo rank for o inicial (Vagante) para evitar aviso no login para nivel 1
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

                    // Grant Rank Rewards (Escalada do Soberano 5.0)
                    const rewards = RANK_REWARDS[newRankId];
                    if (rewards) {
                        const rewardNames: string[] = [];
                        rewards.forEach(reward => {
                            grantUserUnlock(reward.category, reward.itemId);
                            if (reward.category !== 'ui_skins') {
                                grantInventoryItem(reward.itemId);
                            }
                            if (reward.category !== 'insignias') {
                                rewardNames.push(reward.name);
                            }
                        });
                        if (appMode === 'BASIC') {
                            showToast(`Patente ${newRank.name} alcanÃ§ada.`, 'success');
                        } else if (rewardNames.length > 0) {
                            showToast(`Patente ${newRank.name} alcanÃ§ada. Itens de Legado integrados ao Arsenal: ${rewardNames.join(', ')}.`, 'success');
                        }
                    }
                }
            }
            updateUserProfile({ nobility: { ...userProfile.nobility, rankId: newRankId } });
        }
    }, [userProfile.nobility.exp, userProfile.nobility.rankId, hasHydratedFromSupabase, appMode]);

    const updateUserProfile = (profileData: Partial<UserProfile>) => {
        if (profileData.avatarUrl) {
            console.log("Updating profile avatarUrl:", profileData.avatarUrl);
        }
        setUserProfile(prev => ({ ...prev, ...profileData }));
        if (profileData.skin) {
            document.body.setAttribute('data-skin', appMode === 'BASIC' ? 'BASIC' : profileData.skin);
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
                'termsVersion',
                'termsAcceptedAt',
                'termsAcceptSource',
                'privacyVersion',
                'privacyAcceptedAt',
                'privacyAcceptSource',
                'onboardingVersion',
                'onboardingStartedAt',
                'onboardingCompletedAt',
                'onboardingDismissedAt',
                'codexCreationSlotsPurchased',
                'partnershipSlotsPurchased',
                'competitionSlotsPurchased',
                'mentorSlotsPurchased',
                'linkedArenaSlotsPurchased',
                'tutorialCompletedAt',
                'sovereign',
                'avatarUrl',
                'border',
                'nickname',
                'level',
                'backgroundUrl',
                'bannerUrl',
                'isOnline',
                'visibleWidgets',
                'sequenceItems',
                'assetArtById',
                'assetWidgetValues',
                'assetsVisibility',
                'masteryVisibility',
                'featsVisibility',
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
                'premiumExpiresAt',
                'subscriptionTier',
                'premiumRewardPending',
                'premiumRewardShownAt',
                'premiumRewardPayload',
                'legacyProjectionSceneCredits',
                'campaignQuizFreeCredits',
                'campaignQuizMediumCredits',
                'expBoostMultiplier',
                'expBoostExpiresAt',
                'expBoostProductId',
                'appMode',
                'themePreference',
                'arenasViewMode',
                'starterRewardsPending',
                'vanguardWelcomePending',
                'vanguardWelcomeShownAt',
                'vanguardWelcomePayload'
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

    useEffect(() => {
        if (!hasHydratedFromSupabase) return;
        if (!userProfile.isPremium) return;
        if (!userProfile.premiumExpiresAt) return;
        if (userProfile.role === 'admin' || userProfile.role === 'gm') return;
        if (isPremiumActive(userProfile)) return;

        updateUserProfile({ isPremium: false, subscriptionTier: null });
    }, [hasHydratedFromSupabase, updateUserProfile, userProfile]);

    useEffect(() => {
        if (!hasHydratedFromSupabase) return;
        if (!userProfile.expBoostExpiresAt && !userProfile.expBoostMultiplier && !userProfile.expBoostProductId) return;
        if (hasActiveExpBoost(userProfile)) return;

        updateUserProfile({
            expBoostMultiplier: null,
            expBoostExpiresAt: null,
            expBoostProductId: null,
        });
    }, [hasHydratedFromSupabase, updateUserProfile, userProfile]);

    const updateMood = (mood: number) => updateUserProfile({ mood });

    const updateLevelUnlocks = (next: LevelUnlocks) => {
        setLevelUnlocks(next);
    };

    const grantUserUnlock = (category: UnlockCategory, itemId: string) => {
        if (itemId !== 'none' && category !== 'insignias' && !isItemCatalogVisible(itemId)) {
            return;
        }
        const unlockedItems: UserUnlocks = userProfile.unlockedItems || {
            bodyStyles: {},
            hairStyles: {},
            outfits: {},
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
            ui_skins: { BASIC: true },
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
        const itemDef = resolveItemDef(itemId);
        if (itemId !== 'none' && itemDef?.category !== 'insignia' && !isItemCatalogVisible(itemDef || itemId)) {
            return { item: null, granted: false };
        }
        const userId = getSupabaseUserId();
        if (!userId) return { item: null, granted: false };

        const localExisting = inventory.find((inventoryItem) => inventoryItem.id === itemId);
        if (localExisting) {
            return { item: localExisting, granted: false };
        }

        const { data: existingRows, error: existingLookupError } = await supabase
            .from('user_inventory')
            .select('id, item_id, created_at')
            .eq('user_id', userId)
            .eq('item_id', itemId)
            .limit(1);

        if (existingLookupError) {
            console.error('Error checking existing inventory item:', existingLookupError);
        } else if (existingRows && existingRows.length > 0) {
            const existingRow = existingRows[0];
            const existingItem: InventoryItem = {
                id: existingRow.item_id,
                instanceId: existingRow.id,
                acquiredAt: existingRow.created_at || new Date().toISOString(),
                isEquipped: false,
            };

            setInventory((prev) => prev.some((inventoryItem) => inventoryItem.instanceId === existingItem.instanceId) ? prev : [...prev, existingItem]);
            return { item: existingItem, granted: false };
        }

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
            return { item: null, granted: false };
        }

        if (data) {
            const newItem: InventoryItem = {
                id: data.item_id, // This should match ItemDef.id
                instanceId: data.id,
                acquiredAt: data.created_at || new Date().toISOString(),
                isEquipped: false
            };
            setInventory(prev => [...prev, newItem]);

            const isInsignia = itemDef?.category === 'insignias' || itemDef?.category === 'insignia';

            if (isInsignia) {
                console.log(`[Supabase] InsÃ­gnia persistida com sucesso: ${itemId} (ID: ${data.id})`);
            }

            if (!silent) {
                let toastMsg = '';
                if (isInsignia) {
                    toastMsg = `InsÃ­gnia ${itemDef?.name || itemId} foi adicionada ao seu inventÃ¡rio.`;
                } else {
                    const prefix = itemDef?.category === 'skin' ?'Skin' : 'Item';
                    const suffix = itemDef?.category === 'skin' ?'foi adicionada ao seu inventÃ¡rio.' : 'foi adicionado ao seu inventÃ¡rio.';
                    toastMsg = `${prefix} ${itemDef?.name || itemId} ${suffix}`;
                }

                showToast(toastMsg);
            }

            return { item: newItem, granted: true };
        }

        return { item: null, granted: false };
    };

    const formatMembershipChestLabel = (chestType: ChestType): string => {
        if (chestType === 'Season') return 'Temporada';
        return chestType;
    };

    const buildMembershipRewardPayload = (
        tier: 'premium' | 'platinum',
        expiresAt: string,
        grantedItemIds: string[],
        grantedChests: ChestType[],
        legacySceneCreditsGranted: number,
        campaignQuizFreeCreditsGranted: number,
        campaignQuizMediumCreditsGranted: number,
    ): RewardModalPayload => {
        const isPlatinum = tier === 'platinum';
        const chestSummary = grantedChests.length > 0
            ? grantedChests.map(formatMembershipChestLabel).join(' + ')
            : 'Integrado';
        const rewardHighlights = isPlatinum
            ? [
                {
                    label: 'Baús',
                    value: grantedChests.length > 0 ? chestSummary : 'Sem novo baú',
                    detail: grantedChests.length > 0 ? 'Temporada e raro entregues agora.' : 'Sem novo baú nesta rodada.',
                    tone: 'gold' as const,
                },
                {
                    label: 'Legado',
                    value: legacySceneCreditsGranted > 0 ? `${legacySceneCreditsGranted} grátis` : 'Sem crédito',
                    detail: legacySceneCreditsGranted > 0 ? 'Crédito aplicado para a próxima cena do legado.' : 'Nenhum crédito extra nesta rodada.',
                    tone: 'violet' as const,
                },
                {
                    label: 'Quiz',
                    value: campaignQuizMediumCreditsGranted > 0 ? `${campaignQuizMediumCreditsGranted} média` : 'Sem ficha',
                    detail: campaignQuizMediumCreditsGranted > 0 ? 'Use no próximo quiz para liberar uma campanha média.' : 'Nenhuma ficha extra nesta rodada.',
                    tone: 'cyan' as const,
                },
            ]
            : [
                {
                    label: 'Baú',
                    value: grantedChests.length > 0 ? chestSummary : 'Sem novo baú',
                    detail: grantedChests.length > 0 ? 'Baú raro entregue na renovação.' : 'Nenhum baú extra nesta rodada.',
                    tone: 'gold' as const,
                },
                {
                    label: 'Quiz',
                    value: campaignQuizFreeCreditsGranted > 0 ? `${campaignQuizFreeCreditsGranted} grátis` : 'Sem ficha',
                    detail: campaignQuizFreeCreditsGranted > 0 ? 'Use no próximo quiz para liberar uma campanha grátis.' : 'Nenhuma ficha extra nesta rodada.',
                    tone: 'cyan' as const,
                },
                {
                    label: 'Ciclo',
                    value: '+10% XP',
                    detail: 'Bônus ativo enquanto o Premium durar.',
                    tone: 'emerald' as const,
                },
            ];

        return {
            membershipTier: tier,
            eyebrow: isPlatinum ? 'Renovação platinum' : 'Renovação premium',
            title: isPlatinum ? 'Platinum ativo' : 'Premium ativo',
            summary: isPlatinum
                ? 'Seu plano maior foi renovado por mais 30 dias. Os baús desta rodada, a ficha média de quiz e o crédito grátis de legado já foram liberados.'
                : 'Seu Premium foi renovado por mais 30 dias. O baú raro e a ficha grátis de quiz desta rodada já foram liberados.',
            buttonLabel: 'Seguir',
            rewardHighlightsTitle: 'Entregue agora',
            rewardHighlights,
            itemSectionTitle: 'Cosméticos integrados',
            activeBenefitsTitle: 'Vantagens ativas',
            activeBenefits: isPlatinum ? [...PLATINUM_ACTIVE_BENEFITS] : [...PREMIUM_ACTIVE_BENEFITS],
            emptyMessage: grantedChests.length > 0 || legacySceneCreditsGranted > 0 || campaignQuizFreeCreditsGranted > 0 || campaignQuizMediumCreditsGranted > 0
                ? `Nenhum cosmético novo era necessário agora.${chestSummary !== 'Integrado' ? ` Os baús ${chestSummary} já foram entregues.` : ''}${legacySceneCreditsGranted > 0 ? ` Crédito de legado: ${legacySceneCreditsGranted}.` : ''}${campaignQuizFreeCreditsGranted > 0 ? ` Ficha grátis de quiz: ${campaignQuizFreeCreditsGranted}.` : ''}${campaignQuizMediumCreditsGranted > 0 ? ` Ficha média de quiz: ${campaignQuizMediumCreditsGranted}.` : ''}`.trim()
                : 'Sua assinatura foi renovada e nenhum cosmético novo precisava ser entregue agora.',
            metricCards: [
                {
                    label: 'Plano',
                    value: isPlatinum ? 'Platinum' : 'Premium',
                    detail: '30 dias ativos',
                },
                {
                    label: 'Ativo até',
                    value: formatPremiumExpiryLabel(expiresAt),
                    detail: 'validade atual',
                },
                {
                    label: 'Entrega',
                    value: isPlatinum ? 'Temporada + raro' : 'Baú raro + ficha',
                    detail: isPlatinum ? 'rodada do Platinum' : 'rodada do Premium',
                },
            ],
            chestType: grantedChests[0] || null,
            itemIds: grantedItemIds,
            legacyProjectionSceneCreditsGranted: legacySceneCreditsGranted,
            campaignQuizFreeCreditsGranted,
            campaignQuizMediumCreditsGranted,
        };
    };

    const unlockPremiumPack = async (expiresAt: string): Promise<{ payload: RewardModalPayload; campaignQuizFreeCreditsGranted: number; campaignQuizMediumCreditsGranted: number }> => {
        const grantedItemIds: string[] = [];

        const grantedChests: ChestType[] = [];
        const chestGranted = await addChest(PREMIUM_REWARD_CHEST);
        if (chestGranted) grantedChests.push(PREMIUM_REWARD_CHEST);
        return {
            payload: buildMembershipRewardPayload(
                'premium',
                expiresAt,
                grantedItemIds,
                grantedChests,
                0,
                MEMBERSHIP_REWARD_CAMPAIGN_QUIZ_FREE_CREDITS,
                0,
            ),
            campaignQuizFreeCreditsGranted: MEMBERSHIP_REWARD_CAMPAIGN_QUIZ_FREE_CREDITS,
            campaignQuizMediumCreditsGranted: 0,
        };
    };

    const unlockPlatinumPack = async (expiresAt: string): Promise<{ payload: RewardModalPayload; legacySceneCreditsGranted: number; campaignQuizFreeCreditsGranted: number; campaignQuizMediumCreditsGranted: number }> => {
        const grantedChests: ChestType[] = [];
        for (const chestType of PLATINUM_REWARD_CHESTS) {
            const granted = await addChest(chestType);
            if (granted) grantedChests.push(chestType);
        }

        return {
            payload: buildMembershipRewardPayload(
                'platinum',
                expiresAt,
                [],
                grantedChests,
                PLATINUM_REWARD_LEGACY_SCENE_CREDITS,
                0,
                MEMBERSHIP_REWARD_CAMPAIGN_QUIZ_MEDIUM_CREDITS,
            ),
            legacySceneCreditsGranted: PLATINUM_REWARD_LEGACY_SCENE_CREDITS,
            campaignQuizFreeCreditsGranted: 0,
            campaignQuizMediumCreditsGranted: MEMBERSHIP_REWARD_CAMPAIGN_QUIZ_MEDIUM_CREDITS,
        };
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
                    content: { title: `Miss\u00E3o Conclu\u00EDda: ${mission.title} (+${xpAmount} XP)`, icon: '\u{1F4DD}' }
                });
            }
        }

        const rewardValue = typeof mission.reward_value === 'string' ?mission.reward_value : '';
        const rewardParts = rewardValue.includes(':') ?rewardValue.split(':') : [];
        const rewardCategory = rewardParts[0] as UnlockCategory | undefined;
        const rewardItemId = rewardParts[1];

        // Check for Badge/Inventory Item Reward
        if (mission.reward_type === 'item_id' && rewardCategory === 'ornament' && rewardItemId) {
            grantInventoryItem(rewardItemId);
        }

        // NEW: Grant insignia for quest completion
        // We grant a specific insignia if the mission has one, or a generic one if it's a season mission
        if (mission.reward_type === 'item_id' && (rewardCategory as string === 'insignias' || rewardCategory as string === 'insignia') && rewardItemId) {
            grantUserUnlock('insignias', rewardItemId);
            grantInventoryItem(rewardItemId);
        } else {
            // Generic insignia for completing ANY season mission/quest
            const genericInsigniaId = (mission as any).type === 'season' ?'insignia_quest_master' : 'insignia_quest_incomum';
            grantUserUnlock('insignias', genericInsigniaId);
            grantInventoryItem(genericInsigniaId, true); // Silent because the modal will show it
        }

        const unlockedItems: UserUnlocks = userProfile.unlockedItems || {
            bodyStyles: {},
            hairStyles: {},
            outfits: {},
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
        const nextUnlockedItems = shouldUnlock ?{
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

    useEffect(() => {
        const activeSeason = activeRuntimeSeasonConfig;
        const rewardItemIds = activeSeason?.launchRewardItemIds || [];
        if (!activeSeason || rewardItemIds.length === 0) return;
        if (!isProfileLoaded || !hasHydratedFromSupabase) return;

        const userId = getSupabaseUserId();
        if (!userId) return;

        const rewardFlag = getSeasonLaunchRewardFlag(activeSeason.id);
        if ((userProfile.completedSeasonMissions || []).includes(rewardFlag)) return;
        if (seasonLaunchRewardInFlightRef.current[activeSeason.id]) return;

        seasonLaunchRewardInFlightRef.current[activeSeason.id] = true;
        let cancelled = false;

        (async () => {
            let grantedAny = false;

            for (const itemId of rewardItemIds) {
                const itemDef = resolveItemDef(itemId);
                if (itemDef?.category === 'insignia' || itemDef?.category === 'insignias') {
                    grantUserUnlock('insignias', itemId);
                }

                const grantResult = await grantInventoryItem(itemId, true);
                if (grantResult?.granted) {
                    grantedAny = true;
                }
            }

            if (cancelled) return;

            const completedFlags = userProfile.completedSeasonMissions || [];
            if (!completedFlags.includes(rewardFlag)) {
                updateUserProfile({
                    completedSeasonMissions: [...completedFlags, rewardFlag],
                });
            }

            if (grantedAny && activeSeason.launchRewardToast && typeof window !== 'undefined') {
                window.localStorage.setItem(
                    getSeasonLaunchToastStorageKey(activeSeason.id),
                    activeSeason.launchRewardToast,
                );
            }
        })().finally(() => {
            delete seasonLaunchRewardInFlightRef.current[activeSeason.id];
        });

        return () => {
            cancelled = true;
        };
    }, [
        activeRuntimeSeasonConfig,
        getSupabaseUserId,
        hasHydratedFromSupabase,
        isProfileLoaded,
        userProfile.completedSeasonMissions,
    ]);

    const updateAllAssetLevels = (levels: Record<string, number>, levelDescriptions?: Record<string, string[]>): boolean => {
        const lastUpdate = userProfile.lastLevelUpdate || 0;
        const threeDays = 72 * 60 * 60 * 1000;

        // Check for 1h grace period after tutorial completion
        const completedMissions = userProfile.completedSeasonMissions || [];
        const tutorialCompletedAt = userProfile.tutorialCompletedAt || 0; // Need to ensure this field exists or use a flag logic
        const oneHour = 60 * 60 * 1000;
        const isGracePeriod = (Date.now() - tutorialCompletedAt < oneHour) && tutorialCompletedAt > 0;

        const isTutorialActive = window.location.search.includes('tutorial=true') || (window as any).__GOL_TUTORIAL_ACTIVE__;

        if (userProfile.role === 'admin' || userProfile.role === 'gm' || userProfile.role === 'admin_gm' || isTutorialActive || isGracePeriod) {
            // Permite atualizaÃ§Ã£o imediata
        } else if (Date.now() - lastUpdate < threeDays) {
            const remainingHours = Math.ceil((threeDays - (Date.now() - lastUpdate)) / (60 * 60 * 1000));
            showToast(`Maestria em lockdown. DisponÃ­vel em ${remainingHours}h.`);
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
                levelDescriptions[asset.id]?.reduce((acc, desc, i) => ({ ...acc, [i + 1]: desc }), {}) || asset.levelDescriptions
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
        showToast('Maestria atualizada.', 'success');
        return true;
    };

    const startCycle = (name: string, endDate: string, startDate?: string, arenaIds?: string[]) => {
        const userId = getSupabaseUserId();
        if (!userId) return;
        const today = getLocalDateString();
        if (activeCycle || upcomingCycle) {
            showToast('Voce ja tem um ciclo ativo ou agendado. Encerre ou remova o atual antes de criar outro.', 'error');
            return;
        }
        const trimmedName = name.trim();
        const normalizedStartDate = (startDate || today).trim();
        const normalizedEndDate = endDate.trim();
        if (!trimmedName) {
            showToast('DÃª um nome para o ciclo.', 'error');
            return;
        }
        if (!normalizedStartDate || normalizedStartDate < today) {
            showToast('A data inicial do ciclo precisa ser hoje ou uma data futura.', 'error');
            return;
        }
        if (!normalizedEndDate || normalizedEndDate < normalizedStartDate) {
            showToast('A data final do ciclo precisa ser igual ou depois do inicio.', 'error');
            return;
        }
        const newCycle: Cycle = {
            id: crypto.randomUUID(),
            name: trimmedName,
            startDate: normalizedStartDate,
            endDate: normalizedEndDate,
            userId: userId,
            arenaIds: arenaIds || assets.flatMap(a => a.arenas.filter(ar => !ar.isArchived).map(ar => ar.id)),
            seasonId: activeRuntimeSeasonId
        };
        setCycleExpBonus(0);
        if (normalizedStartDate > today) {
            setActiveCycle(null);
            setUpcomingCycle(newCycle);
            showToast(`Ciclo agendado para ${normalizedStartDate}.`, 'success');
        } else {
            setUpcomingCycle(null);
            setActiveCycle(newCycle);
        }

        // Sync to Supabase
        const snakeCaseCycle = {
            id: newCycle.id,
            user_id: userId,
            name: newCycle.name,
            start_date: newCycle.startDate,
            end_date: newCycle.endDate,
            arena_ids: newCycle.arenaIds,
            season_id: activeRuntimeSeasonId
        };
        supabase.from('cycles').insert(snakeCaseCycle).then(({ error }) => {
            if (error) console.error("Supabase start cycle error:", error.message);
        });
    };
    const updateCycle = async (cycleId: string, updates: Partial<Pick<Cycle, 'name' | 'endDate'>>) => {
        const userId = getSupabaseUserId();
        if (!userId) return;
        const cycleToEdit = activeCycle?.id === cycleId
            ? activeCycle
            : (upcomingCycle?.id === cycleId ? upcomingCycle : null);
        const historicalReportToEdit = !cycleToEdit
            ? reports.find((report) => report.cycleId === cycleId || report.id === cycleId) || null
            : null;
        const today = getLocalDateString();
        const minimumAllowedEndDate = cycleToEdit?.startDate && cycleToEdit.startDate > today
            ? cycleToEdit.startDate
            : today;

        const sanitizedUpdates: Partial<Pick<Cycle, 'name' | 'endDate'>> = {};
        if (typeof updates.name === 'string' && updates.name.trim()) {
            sanitizedUpdates.name = updates.name.trim();
        }
        if (typeof updates.endDate === 'string' && updates.endDate.trim()) {
            if (!cycleToEdit) {
                showToast('Ciclos fechados so permitem editar o nome.', 'error');
                return;
            }
            const normalizedEndDate = updates.endDate.trim();
            if (normalizedEndDate < minimumAllowedEndDate) {
                const error = new Error('INVALID_CYCLE_END_DATE');
                showToast('A data final precisa ser hoje ou depois do inÃ­cio do ciclo.', 'error');
                throw error;
            }
            sanitizedUpdates.endDate = normalizedEndDate;
        }

        if (Object.keys(sanitizedUpdates).length === 0) {
            return;
        }

        const previousCycleSnapshot = activeCycle?.id === cycleId ? activeCycle : null;
        const previousUpcomingCycleSnapshot = upcomingCycle?.id === cycleId ? upcomingCycle : null;
        const previousHistoricalReportSnapshot = historicalReportToEdit ? { ...historicalReportToEdit } : null;
        if (previousCycleSnapshot) {
            setActiveCycle(prev => (prev?.id === cycleId ? { ...prev, ...sanitizedUpdates } : prev));
        }
        if (previousUpcomingCycleSnapshot) {
            setUpcomingCycle(prev => (prev?.id === cycleId ? { ...prev, ...sanitizedUpdates } : prev));
        }
        if (!previousCycleSnapshot && previousHistoricalReportSnapshot && sanitizedUpdates.name) {
            setReports(prev => prev.map(report => (
                report.cycleId === cycleId || report.id === cycleId
                    ? { ...report, cycleName: sanitizedUpdates.name }
                    : report
            )));
        }

        const dbUpdates: Record<string, any> = mapToSnakeCase(sanitizedUpdates);
        if (!previousCycleSnapshot && previousHistoricalReportSnapshot && sanitizedUpdates.name) {
            dbUpdates.report_data = mapToSnakeCase({
                ...previousHistoricalReportSnapshot,
                cycleName: sanitizedUpdates.name,
            });
        }

        const { error } = await supabase
            .from('cycles')
            .update(dbUpdates)
            .eq('id', cycleId)
            .eq('user_id', userId);

        if (error) {
            if (previousCycleSnapshot) {
                setActiveCycle(prev => (prev?.id === cycleId ? previousCycleSnapshot : prev));
            }
            if (previousUpcomingCycleSnapshot) {
                setUpcomingCycle(prev => (prev?.id === cycleId ? previousUpcomingCycleSnapshot : prev));
            }
            if (!previousCycleSnapshot && previousHistoricalReportSnapshot) {
                setReports(prev => prev.map(report => (
                    report.cycleId === cycleId || report.id === cycleId
                        ? previousHistoricalReportSnapshot
                        : report
                )));
            }
            console.error('Supabase update cycle error:', error.message);
            showToast('Erro ao atualizar ciclo.', 'error');
            throw error;
        }

        showToast('Ciclo atualizado.', 'success');
    };
    const endCycle = (currentAssets: Asset[], currentActions: Action[]): EndCycleResult => {
        const cycle = activeCycle;
        const supabaseUserId = getSupabaseUserId();
        const startDate = cycle?.startDate || '2000-01-01'; // Fallback para o primeiro ciclo sem data
        const endDate = getLocalDateString();
        const plannedEndDate = cycle?.endDate;
        const cycleSeasonId = cycle?.seasonId || activeRuntimeSeasonId; // Use stored season or default to current

        // 1. Filter Tasks
        const cycleTasks = filterCycleTasksByScope(tasks, currentActions, cycle, startDate, endDate);
        const freeActionIds = new Set(currentActions.filter(action => action.actionType === 'Livre').map(action => action.id));
        const scoredCycleTasks = cycleTasks.filter(t => !freeActionIds.has(t.actionId));
        const completedTasks = cycleTasks.filter(t => t.completed);
        const completedScoredTasks = scoredCycleTasks.filter(t => t.completed);

        // Quest Tasks (kept for bonus calculation)
        const questTasks = cycleTasks.filter(t => isQuestActionId(t.actionId));
        const completedQuests = questTasks.filter(t => t.completed);

        // 2. Calculate Progress (Base Score)
        // progresso = (acoes realizadas / acoes planejadas) * 100
        const progress = scoredCycleTasks.length > 0 ?(completedScoredTasks.length / scoredCycleTasks.length) * 100 : 100;

        // 3. Calculate Bonuses
        // +10 per milestone (Marco)
        const getMilestones = (taskList: ScheduledTask[]) => taskList.filter(t => {
            const action = currentActions.find(a => a.id === t.actionId);
            return action?.actionType === 'Marco';
        }).length;

        // Since cycleTasks now includes quests, we only need to count milestones from completedTasks
        const milestonesCompleted = getMilestones(completedScoredTasks);
        // Weighted Milestone Bonus: Metas are critical for a good cycle
        const milestoneBonus = milestonesCompleted * 15;

        // +5 per quest
        const questsCompletedCount = completedQuests.length;
        const questBonus = questsCompletedCount * 10; // Increased importance of quests

        // Consistency (Unique Days)
        const {
            executionRatePct,
            timeElapsedPct,
            paceDeltaPct,
            daysWithoutCompletion,
            consistencyDays: uniqueDays,
            durationDays,
        } = buildCyclePaceMetrics(scoredCycleTasks, startDate, endDate, plannedEndDate);

        // Consistency Bonus: 20 points if consistent (>80% of days active), scaled down
        const consistencyRatio = uniqueDays / durationDays;
        const consistencyBonus = consistencyRatio >= 0.8 ?20 : (consistencyRatio >= 0.5 ?10 : 0);

        // Volume Bonus (Hours of deep work)
        // User insight: 15h = 1000 XP. Good cycle needs "manh?y hours".
        const totalMinutes = completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
        const totalHours = Math.floor(totalMinutes / 60);
        const volumeBonus = Math.min(30, Math.floor(totalHours / 2)); // Max 30 points for 60 hours

        const legacyPerformanceScore = Math.round(
            (progress * 0.4) + // Progress is 40% of the grade
            milestoneBonus +
            questBonus +
            consistencyBonus +
            volumeBonus
        );

        const cycleArenas = currentAssets.flatMap(asset => asset.arenas);
        const reportsChronological = [...reports].sort((left, right) => {
            const endDiff = new Date(left.endDate).getTime() - new Date(right.endDate).getTime();
            if (endDiff !== 0) return endDiff;
            return new Date(left.startDate).getTime() - new Date(right.startDate).getTime();
        });
        const fairScoreResult = buildFairScoreFromTasks({
            tasks: cycleTasks.map((task) => {
                const action = currentActions.find(a => a.id === task.actionId);
                return {
                    ...task,
                    actionType: action?.actionType,
                    arenaId: action?.arenaId,
                };
            }),
            actions: currentActions,
            arenas: cycleArenas,
            previousReports: reportsChronological,
            durationDays,
            legacyPerformanceScore,
        });
        const performanceScore = fairScoreResult.fairScore;

        // Arenas e AÃ§Ãµes envolvidas (baseado nas tarefas do ciclo)
        const actionIdsInCycle = new Set(scoredCycleTasks.map(t => t.actionId));
        const involvedActions = currentActions.filter(a => actionIdsInCycle.has(a.id));

        const arenaIdsInCycle = new Set(involvedActions.map(a => a.arenaId));
        const involvedArenas = cycleArenas.filter(ar => arenaIdsInCycle.has(ar.id));

        // Highlights
        const arenaCompletionCounts = completedScoredTasks.reduce((acc, task) => {
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

        const actionCompletionCounts = completedScoredTasks.reduce((acc, task) => {
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

        const currentDayCommittedTasks =
            dailyCommitment.stage === 'judgment'
                ? []
                : tasks.filter(task =>
                    dailyCommitment.taskIds.includes(task.id) &&
                    taskMatchesOperationalDate(task, dailyCommitment.date) &&
                    (() => {
                        if (!cycle?.arenaIds?.length) return true;
                        const action = currentActions.find(item => item.id === task.actionId);
                        return !!action && cycle.arenaIds.includes(action.arenaId);
                    })()
                );
        const currentDayScoredTasks = currentDayCommittedTasks.filter(task => !freeActionIds.has(task.actionId));
        const currentDayCompletedCount = currentDayScoredTasks.filter(task => task.completed).length;
        const currentDayTotalCount = currentDayScoredTasks.length;
        const currentDayScore =
            currentDayTotalCount > 0
                ? Math.round((currentDayCompletedCount / currentDayTotalCount) * 100)
                : 100;
        const currentDayBaseExp = currentDayCommittedTasks.reduce((sum, task) => {
            if (!task.completed) return sum;
            const action = currentActions.find(a => a.id === task.actionId);
            const duration = task.duration > 0 ? task.duration : (Number.isFinite(action?.duration) ? (action?.duration || 0) : 0);
            return sum + duration;
        }, 0);
        const currentDaySitrepBonus =
            dailyCommitment.stage === 'judgment'
                ? 0
                : currentDayScore >= 95
                    ? SITREP_BONUS_S
                    : currentDayScore >= 85
                        ? SITREP_BONUS_A
                        : 0;
        const cycleMainSlots = aldeiaSlots.filter(slot => slot.slotId !== 'trono');
        const cycleVillageOrder =
            cycleMainSlots.length > 0
                ? cycleMainSlots.reduce((sum, slot) => sum + slot.health, 0) / cycleMainSlots.length
                : 0;
        const cycleVillageBonusFactor = (cycleVillageOrder / 100) * MAX_VILLAGE_BONUS_PERCENT;
        const currentDayVillageBonus =
            dailyCommitment.stage === 'judgment'
                ? 0
                : Math.round((currentDayBaseExp + currentDaySitrepBonus) * cycleVillageBonusFactor);
        const unbankedOpenDayExp = currentDayBaseExp + currentDaySitrepBonus + currentDayVillageBonus;
        const isPremiumUser = userProfile.isPremium || userProfile.role === 'admin' || userProfile.role === 'gm';
        const rawExp = cycleExpBonus + unbankedOpenDayExp;
        const boostMultiplier = getExpBoostMultiplier(userProfile);
        const boostedRawExp = Math.round(rawExp * boostMultiplier);
        const expBoostBonus = Math.max(0, boostedRawExp - rawExp);
        const premiumBonusExp = isPremiumUser ?Math.round(boostedRawExp * 0.1) : 0;
        const expGained = boostedRawExp + premiumBonusExp;

        const identitySnapshot = {
            avatarUrl: userProfile.avatarUrl,
            nickname: userProfile.nickname || userProfile.username || 'Usuario',
            title: userProfile.title,
            level: userProfile.level || 1,
            nobilityRankId: userProfile.nobility?.rankId,
            nobilityRankName: NOBILITY_RANKS.find(rank => rank.id === userProfile.nobility?.rankId)?.name || undefined,
            clanName: clan?.name || userProfile.clanName || null,
            clanIcon: clan?.icon || userProfile.clanIcon || null,
            clanRankName: clan ?(CLAN_RANKS.find(rank => rank.id === clan.rankId)?.name || null) : null,
            capturedAt: new Date().toISOString(),
        };

        // Calculate Clan Points (XP from completed clan quests)
        const clanPoints = completedQuests.reduce((sum, task) => {
            const action = currentActions.find(a => a.id === task.actionId);
            if (!action) return sum;
            const quest = findClanQuestByActionName(action.name);
            return sum + (quest?.rewards?.xp || 0);
        }, 0);

        // === Phase 10: Advanced Report Metrics ===
        // avgHoursPerDay
        const avgHoursPerDay = durationDays > 0 ?Math.round((totalHours / durationDays) * 10) / 10 : 0;

        // scoreBreakdown (reuse already computed bonus values)
        const scoreBreakdown = {
            progressPts: Math.round(progress * 0.4),
            milestonePts: milestoneBonus,
            questPts: questBonus,
            consistencyPts: consistencyBonus,
            volumePts: volumeBonus,
            expBoostBonusPts: expBoostBonus,
            premiumBonusPts: premiumBonusExp,
        };

        // bestDay + bestDayCount
        const dayActionCounts: Record<string, number> = {};
        completedScoredTasks.forEach(t => {
            dayActionCounts[t.date] = (dayActionCounts[t.date] || 0) + 1;
        });
        let bestDay = '';
        let bestDayCount = 0;
        Object.entries(dayActionCounts).forEach(([date, count]) => {
            if (count > bestDayCount) {
                bestDayCount = count;
                bestDay = date;
            }
        });

        // maxStreak (consecutive days with >=1 completed task)
        const activeDates = completedScoredTasks.map(t => t.date).filter((v, i, a) => a.indexOf(v) === i).sort();
        let maxStreak = 0;
        let currentStreak = 1;
        for (let i = 1; i < activeDates.length; i++) {
            const prev = new Date(activeDates[i - 1]);
            const curr = new Date(activeDates[i]);
            const diffMs = curr.getTime() - prev.getTime();
            if (diffMs <= 86400000 * 1.5) { // ~1 day tolerance for timezone
                currentStreak++;
            } else {
                currentStreak = 1;
            }
            maxStreak = Math.max(maxStreak, currentStreak);
        }
        if (activeDates.length === 1) maxStreak = 1;
        if (activeDates.length === 0) maxStreak = 0;

        // top3Actions (reuse actionCompletionCounts, resolve names)
        const top3Actions = (Object.entries(actionCompletionCounts) as [string, number][])
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([actionId, count]) => ({
                name: currentActions.find(a => a.id === actionId)?.name || 'Desconhecida',
                count,
            }));

        const weeklyAtlas = buildCycleWeeklyAtlas(
            scoredCycleTasks,
            currentActions,
            cycleArenas,
            startDate,
            endDate,
        );

        const newReport: Report = {
            id: crypto.randomUUID(),
            cycleId: cycle?.id,
            startDate,
            endDate,
            performanceScore,
            cycleName: cycle?.name,
            seasonId: cycleSeasonId,
            metrics: {
                actionsCompleted: completedScoredTasks.length,
                totalPlannedActions: scoredCycleTasks.length,
                arenasInvolved: involvedArenas.length,
                goalsMet: fairScoreResult.fairness.sealedMetas,
                plannedMetas: fairScoreResult.fairness.plannedMetas,
                sealedMetas: fairScoreResult.fairness.sealedMetas,
                totalHours: Math.round(completedScoredTasks.reduce((sum, t) => sum + (t.duration / 60), 0)),
                questsCompleted: questsCompletedCount,
                consistencyDays: uniqueDays,
                expGained,
                plannedEndDate,
                avgHoursPerDay,
                maxStreak,
                bestDay,
                bestDayCount,
                daysWithoutCompletion,
                executionRatePct,
                timeElapsedPct,
                paceDeltaPct,
                top3Actions,
                weeklyAtlas,
                scoreModelVersion: 'fair_v2_1',
                fairness: fairScoreResult.fairness as Report['metrics']['fairness'],
                scoreBreakdown,
            },
            highlight: {
                mostFocusedArena,
                mostFocusedArenaId,
                mostRepeatedAction,
                mostRepeatedActionCount: maxActionCompletions
            },
            clanPoints,
            expGained,
            identitySnapshot,
            assetProgress: currentAssets.map(asset => {
                if (asset.id === 'geral') return null;

                const arenasForAsset = cycle?.arenaIds?.length
                    ? asset.arenas.filter(arena => cycle.arenaIds.includes(arena.id))
                    : asset.arenas;
                const actionsForAsset = currentActions.filter(action => arenasForAsset.some(arena => arena.id === action.arenaId));
                const activeCount = arenasForAsset.filter(arena => !arena.isArchived).length;
                const archivedCount = arenasForAsset.filter(arena => arena.isArchived).length;

                let totalCompletedForAsset = 0;
                let totalPlannedForAsset = 0;

                for (const arena of arenasForAsset) {
                    const arenaActions = currentActions.filter(action => action.arenaId === arena.id);
                    const actionIds = new Set(arenaActions.map(action => action.id));
                    const arenaTasks = cycleTasks.filter(task => actionIds.has(task.actionId));
                    const arenaProgress = calculateArenaProgress({
                        arena,
                        actions: arenaActions,
                        tasks: arenaTasks,
                    });
                    totalCompletedForAsset += arenaProgress.totalCompleted;
                    totalPlannedForAsset += arenaProgress.totalPlanned;
                }

                // Radar continua lendo "value", mas agora o snapshot completo do ativo
                // tambem fica salvo junto no relatorio.
                const completedAcrossCycle = completedScoredTasks.length;
                const value = completedAcrossCycle > 0 ?(totalCompletedForAsset / completedAcrossCycle) * 100 : 0;
                const progressPercent = totalPlannedForAsset > 0 ? Math.round((totalCompletedForAsset / totalPlannedForAsset) * 100) : 100;

                return {
                    asset: asset.name,
                    value: Math.round(value),
                    assetId: asset.id,
                    activeCount,
                    archivedCount,
                    totalActions: actionsForAsset.length,
                    totalCompleted: totalCompletedForAsset,
                    totalPlanned: totalPlannedForAsset,
                    progressPercent,
                    startLevel: asset.level,
                    endLevel: asset.level,
                    expGained: 0
                };
            }).filter(Boolean) as { asset: string; value: number }[]
        };

        // Salvar relatÃ³rio e atualizar ciclo no Supabase se logado
        if (supabaseUserId) {
            const snakeCaseReport = {
                user_id: supabaseUserId,
                ...mapToSnakeCase(newReport),
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

        // Adicionar relatÃ³rio Ã  lista
        setReports(prev => [newReport, ...prev]);
        emitAppSensoryCue('cycle_complete');

        return { report: newReport, expGained };
    };

    const getAutoFinishedCycleSeenStorageKey = (userId: string, cycleId: string) =>
        `glyph:auto-finished-cycle-seen:${userId}:${cycleId}`;

    useEffect(() => {
        if (!hasHydratedFromSupabase || !activeCycle?.id) {
            autoFinishingCycleRef.current = null;
            return;
        }

        const userId = getSupabaseUserId();
        if (!userId) return;

        const hasExpired = getLocalDateString() > activeCycle.endDate;
        if (!hasExpired) {
            if (autoFinishingCycleRef.current === activeCycle.id) {
                autoFinishingCycleRef.current = null;
            }
            return;
        }

        if (typeof window !== 'undefined') {
            const seenStorageKey = getAutoFinishedCycleSeenStorageKey(userId, activeCycle.id);
            if (window.localStorage.getItem(seenStorageKey) === 'seen') {
                setActiveCycle(prev => prev?.id === activeCycle.id ? null : prev);
                autoFinishingCycleRef.current = activeCycle.id;
                return;
            }
        }

        if (autoFinishingCycleRef.current === activeCycle.id) return;
        if (assets.length === 0) return;

        autoFinishingCycleRef.current = activeCycle.id;
        const expiredCycleName = activeCycle.name;

        const timeoutId = window.setTimeout(() => {
            try {
                const result = endCycle(assets, actions);
                if (result?.report) {
                    if (typeof window !== 'undefined') {
                        const seenStorageKey = getAutoFinishedCycleSeenStorageKey(userId, activeCycle.id);
                        window.localStorage.setItem(seenStorageKey, 'seen');
                        (window as any).__glyphPendingCycleResults = {
                            report: result.report,
                            expGained: result.expGained,
                        };
                        window.dispatchEvent(new CustomEvent('glyph-cycle-auto-finished'));
                    }
                    showToast(`Ciclo "${expiredCycleName}" encerrado automaticamente.`, 'success');
                }
            } catch (error) {
                console.error('Error auto-finishing expired cycle:', error);
                showToast('Nao foi possivel encerrar automaticamente o ciclo vencido.', 'error');
                autoFinishingCycleRef.current = null;
            }
        }, 350);

        return () => window.clearTimeout(timeoutId);
    }, [activeCycle, actions, assets, endCycle, hasHydratedFromSupabase, showToast]);

    useEffect(() => {
        if (!hasHydratedFromSupabase || activeCycle || !upcomingCycle?.id) return;

        const today = getLocalDateString();
        if (upcomingCycle.startDate > today) return;

        setActiveCycle(upcomingCycle);
        setUpcomingCycle(null);
        setCycleProgress(0);
        setCycleExpBonus(0);
        showToast(`O ciclo "${upcomingCycle.name}" comecou hoje.`, 'success');
    }, [activeCycle, hasHydratedFromSupabase, showToast, upcomingCycle]);

    const applyExp = (expGained: number) => {
        // This function is now mostly for immediate visual feedback or small grants.
        // Major cycle EXP is applied at endDailyBattle or endCycle.
        if (!expGained) return;

        // Check if we should bank it for the cycle instead of immediate apply
        if (activeCycle) {
            setCycleExpBonus(prev => prev + expGained);
        } else {
            const boostedExp = Math.round(expGained * getExpBoostMultiplier(userProfile));
            updateUserProfile({ nobility: { ...userProfile.nobility, exp: userProfile.nobility.exp + boostedExp } });
        }
    };

    const addChest = async (chestType: ChestType) => {
        const userId = getSupabaseUserId();
        if (!userId) return false;

        // Use RPC or direct insert
        const { error } = await supabase.rpc('grant_chest', {
            p_user_id: userId,
            p_chest_type: chestType
        });

        if (error) {
            console.error("Error adding chest:", error);
            return false;
        }

        // Optimistically update or refetch profile
        setUserProfile(prev => {
            const existingChests = prev.chests || [];
            const chestIndex = existingChests.findIndex(c => c.type === chestType);

            let newChests;
            if (chestIndex >= 0) {
                newChests = existingChests.map((chest, index) =>
                    index === chestIndex ?{ ...chest, count: chest.count + 1 } : chest
                );
            } else {
                newChests = [...existingChests, { type: chestType, count: 1 }];
            }

            return { ...prev, chests: newChests };
        });
        return true;
    };

    const deleteCycle = async (cycleId: string) => {
        const userId = getSupabaseUserId();
        if (!userId) {
            showToast('Nao foi possivel identificar sua sessao para excluir o ciclo.', 'error');
            return false;
        }

        const wasActiveCycle = activeCycle?.id === cycleId;
        const wasUpcomingCycle = upcomingCycle?.id === cycleId;

        // 1. Delete from Supabase
        const { data: deletedRows, error } = await supabase
            .from('cycles')
            .delete()
            .eq('id', cycleId)
            .eq('user_id', userId)
            .select('id');

        if (error) {
            console.error("Error deleting cycle:", error);
            showToast("Erro ao excluir ciclo.");
            return false;
        }


        if (!deletedRows || deletedRows.length === 0) {
            showToast('Nao foi possivel encontrar esse ciclo para excluir.', 'error');
            return false;
        }

        if (wasActiveCycle) {
            setActiveCycle(null);
        }
        if (wasUpcomingCycle) {
            setUpcomingCycle(null);
        }

        setReports(prev => prev.filter(report => report.cycleId !== cycleId && report.id !== cycleId));
        showToast('Ciclo excluido com sucesso.', 'success');

        // If it was the active cycle, try to fetch another one or just clear state
        if (wasActiveCycle || wasUpcomingCycle) {
            const today = getLocalDateString();
            const { data: remainingCycles } = await supabase
                .from('cycles')
                .select('*')
                .eq('user_id', userId)
                .is('report_data', null)
                .order('start_date', { ascending: true })
                .order('created_at', { ascending: false })
                .limit(50);

            const openCycles = ((remainingCycles || []).map(row => mapToCamelCase(row) as Cycle))
                .sort((left, right) => new Date(left.startDate).getTime() - new Date(right.startDate).getTime());
            const nextActiveCycle = [...openCycles]
                .filter(cycle => cycle.startDate <= today)
                .sort((left, right) => new Date(right.startDate).getTime() - new Date(left.startDate).getTime())[0] || null;
            const nextUpcomingCycle = openCycles.find(cycle => cycle.startDate > today) || null;

            setActiveCycle(nextActiveCycle);
            setUpcomingCycle(nextUpcomingCycle);
        }

        return true;
    };

    const startNewCycle = async (arenaChanges: ArenaSetupChange[], cycleDetails: { name: string; startDate?: string; endDate: string; }) => {
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

        startCycle(cycleDetails.name, cycleDetails.endDate, cycleDetails.startDate, newArenaIds.length > 0 ?newArenaIds : undefined);
    };

    const setCurrentSkin = (skinId: string) => updateUserProfile({ skin: skinId });
    const addFriend = (nickname: string) => {
        if (nickname.trim() && !friends.find(f => f.nickname === nickname)) {
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
        if (!isUuid(userId)) return { profile: null, clan: null, clanRank: undefined, levels: {} as Record<string, number>, arenasByAsset: {} as Record<string, Arena[]> };

        const [clanRes, levelsRes, profileRes] = await Promise.all([
            supabase
                .from('clan_members')
                .select('clan_id, role, clans(*)')
                .eq('user_id', userId)
                .maybeSingle(),
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

        const clanData = clanRes.data?.clans ?mapToCamelCase(clanRes.data.clans) as Clan : null;
        const clanRank = clanData ?CLAN_RANKS.find(r => r.id === (clanData as any).rankId) : undefined;

        let publicProfile: UserProfile | null = null;
        if (profileRes.data) {
            publicProfile = mapToCamelCase(profileRes.data) as UserProfile;
            publicProfile.visibleWidgets = Array.isArray(publicProfile.visibleWidgets) ? publicProfile.visibleWidgets : [];
            publicProfile.assetArtById = publicProfile.assetArtById || {};
            publicProfile.assetWidgetValues = publicProfile.assetWidgetValues || {};
            publicProfile.assetsVisibility = normalizeAssetsVisibilityScope(publicProfile.assetsVisibility);
            publicProfile.masteryVisibility = normalizeMasteryVisibilityScope(publicProfile.masteryVisibility);
            publicProfile.featsVisibility = normalizeFeatsVisibilityScope(publicProfile.featsVisibility);
        }

        const isOwner = userProfile.id === userId;
        const isFriend = friends.some((friend) => friend.id === userId);
        const assetsVisibility = normalizeAssetsVisibilityScope(publicProfile?.assetsVisibility);
        const masteryVisibility = normalizeMasteryVisibilityScope(publicProfile?.masteryVisibility);
        const arenaMiniaturesVisibility = normalizeFeatsVisibilityScope(publicProfile?.featsVisibility);
        const canViewAssets = isOwner || assetsVisibility === 'all' || (assetsVisibility === 'friends' && isFriend);
        const canViewMastery = isOwner || masteryVisibility === 'all' || (masteryVisibility === 'friends' && isFriend);
        const canViewArenaMiniatures = isOwner || arenaMiniaturesVisibility === 'all' || (arenaMiniaturesVisibility === 'friends' && isFriend);

        const userLevels: Record<string, number> = {};
        if (levelsRes.data) {
            levelsRes.data.forEach((l: any) => {
                userLevels[l.asset_id] = l.level;
            });
        }

        if (publicProfile && !canViewAssets && !isOwner) {
            publicProfile.visibleWidgets = [];
            publicProfile.assetArtById = {};
            publicProfile.assetWidgetValues = {};
        }

        let arenasByAsset: Record<string, Arena[]> = {};
        if (canViewArenaMiniatures) {
            const { data: arenasData } = await supabase
                .from('arenas')
                .select('id, asset_id, name, description, icon, action_ids, is_archived, order, priority')
                .eq('user_id', userId);

            if (arenasData) {
                arenasByAsset = (arenasData as any[]).reduce((acc, row) => {
                    const arena = mapToCamelCase(row) as Arena;
                    if (!acc[arena.assetId]) acc[arena.assetId] = [];
                    acc[arena.assetId].push(arena);
                    return acc;
                }, {} as Record<string, Arena[]>);
            }
        }

        return {
            profile: publicProfile,
            clan: clanData,
            clanRank,
            levels: canViewMastery ?userLevels : {},
            arenasByAsset,
        };
    }, [friends, userProfile.id]);

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
        showToast('Convite de amizade enviado.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
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

        await SupabaseService.createNotification(
            request.senderId,
            'friend_response',
            `${userProfile.nickname || 'Seu aliado'} aceitou seu convite de amizade.`,
        );

        await loadFriendsAndRequests(userId);
        showToast('Amizade aceita.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
    };

    const declineFriendRequest = async (requestId: string): Promise<void> => {
        const userId = getSupabaseUserId();
        if (!userId) return;
        const request = friendRequestsIncoming.find(r => r.id === requestId);
        const { error } = await supabase.from('friend_requests')
            .update({ status: 'declined', responded_at: new Date().toISOString() })
            .eq('id', requestId);
        if (error) {
            console.error('Error declining friend request:', error.message);
            return;
        }
        if (request) {
            await SupabaseService.createNotification(
                request.senderId,
                'friend_response',
                `${userProfile.nickname || 'Seu aliado'} recusou seu convite de amizade.`,
            );
        }
        await loadFriendsAndRequests(userId);
        showToast('Convite de amizade recusado.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
    };

    const legacyCancelFriendRequest = async (requestId: string): Promise<void> => {
        const userId = getSupabaseUserId();
        if (!userId) return;
        const existingRequest = friendRequestsOutgoing.find((request) => request.id === requestId);
        if (!existingRequest) {
            showToast('Esse convite jÃ¡ nÃ£o estÃ¡ mais pendente.', 'info');
            return;
        }

        setFriendRequestsOutgoing(prev => prev.filter(request => request.id !== requestId));

        const { error } = await supabase.from('friend_requests')
            .delete()
            .eq('id', requestId)
            .eq('sender_id', userId)
            .eq('status', 'pending');

        if (error) {
            console.error('Error canceling friend request:', error.message);
            setFriendRequestsOutgoing(prev => prev.some(request => request.id === requestId) ? prev : [...prev, existingRequest]);
            showToast('NÃ£o foi possÃ­vel cancelar o convite de amizade.', 'error');
            return;
        }
        showToast('Convite de amizade cancelado.', 'success');
        await loadFriendsAndRequests(userId);
    };

    const cancelFriendRequest = async (requestId: string): Promise<void> => {
        const userId = getSupabaseUserId();
        if (!userId) return;
        const existingRequest = friendRequestsOutgoing.find((request) => request.id === requestId);
        if (!existingRequest) {
            showToast('Esse convite jÃ¡ nÃ£o estÃ¡ mais pendente.', 'info');
            await loadFriendsAndRequests(userId);
            return;
        }

        setFriendRequestsOutgoing(prev => prev.filter(request => request.id !== requestId));

        const { error } = await supabase
            .from('friend_requests')
            .delete()
            .eq('id', requestId)
            .eq('sender_id', userId)
            .eq('status', 'pending');

        if (error) {
            console.error('Error canceling friend request:', error.message);
            setFriendRequestsOutgoing(prev => prev.some(request => request.id === requestId) ? prev : [...prev, existingRequest]);
            showToast('NÃ£o foi possÃ­vel cancelar o convite de amizade.', 'error');
            await loadFriendsAndRequests(userId);
            return;
        }

        showToast('Convite de amizade cancelado.', 'success');
        await loadFriendsAndRequests(userId);
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
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
                // Fallback to blind update if fetch fails?Better to stop to avoid corruption.
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
        setChecklistItems(prev => prev.map(item => item.id === id ?{ ...item, completed: !item.completed } : item));
    };
    const addChecklistItem = (text: string) => {
        if (!text.trim()) return;
        const newItem: ChecklistItem = { id: crypto.randomUUID(), text, completed: false };
        setChecklistItems(prev => [...prev, newItem]);
    };
    const updateChecklistItem = (id: string, text: string) => {
        setChecklistItems(prev => prev.map(item => item.id === id ?{ ...item, text } : item));
    };
    const deleteChecklistItem = (id: string) => {
        setChecklistItems(prev => prev.filter(item => item.id !== id));
    };

    const addSequenceItem = (title: string) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        const now = new Date().toISOString();
        const newItem: SequenceItem = {
            id: crypto.randomUUID(),
            title: trimmedTitle,
            days: 0,
            lastMarkedDate: null,
            updatedAt: now,
        };
        setSequenceItems(prev => [...prev, newItem]);
    };

    const updateSequenceItem = (id: string, title: string) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        setSequenceItems(prev => prev.map(item => item.id === id
            ? { ...item, title: trimmedTitle, updatedAt: new Date().toISOString() }
            : item));
    };

    const markSequenceItemToday = (id: string) => {
        const today = getOperationalDateString();
        setSequenceItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            if (item.lastMarkedDate === today) return item;
            return {
                ...item,
                days: Math.max(0, item.days + 1),
                lastMarkedDate: today,
                updatedAt: new Date().toISOString(),
            };
        }));
    };

    const adjustSequenceItemDays = (id: string, delta: number) => {
        if (!Number.isFinite(delta) || delta === 0) return;

        setSequenceItems(prev => prev.map(item => item.id === id
            ? {
                ...item,
                days: Math.max(0, item.days + delta),
                updatedAt: new Date().toISOString(),
            }
            : item));
    };

    const resetSequenceItem = (id: string) => {
        setSequenceItems(prev => prev.map(item => item.id === id
            ? {
                ...item,
                days: 0,
                lastMarkedDate: null,
                updatedAt: new Date().toISOString(),
            }
            : item));
    };

    const deleteSequenceItem = (id: string) => {
        setSequenceItems(prev => prev.filter(item => item.id !== id));
    };

    const getArenas = () => allArenas;
    const addArena = async (assetId: string, arenaData: Omit<Arena, 'id' | 'assetId' | 'actionIds'>, skipDb: boolean = false): Promise<Arena> => {
        const willStartArchived = arenaData.isArchived ?? false;
        const capacity = getArenaCapacitySummary(assetsRef.current, userProfile);
        if (capacity.isAtLimit) {
            const message = buildArenaLimitMessage(capacity);
            showToast(message, 'warning');
            throw new Error(message);
        }

        const newArena: Arena = { ...arenaData, id: crypto.randomUUID(), assetId, actionIds: [], isArchived: willStartArchived };

        setAssets(prevAssets => {
            const nextAssets = prevAssets.map(asset => asset.id === assetId ?{ ...asset, arenas: [...asset.arenas, newArena] } : asset);
            assetsRef.current = nextAssets;
            return nextAssets;
        });

        const userId = getSupabaseUserId();
        if (!userId || skipDb) {
            return newArena;
        }

        const snakeCaseData = { ...mapToSnakeCase(newArena), user_id: userId };
        delete snakeCaseData.action_ids;
        delete snakeCaseData.folder_id;

        if (snakeCaseData.origin_codex_id && !isUuid(String(snakeCaseData.origin_codex_id))) {
            delete snakeCaseData.origin_codex_id;
        }

        try {
            const { error } = await supabase.from('arenas').insert(snakeCaseData);
            if (error) throw error;
            return newArena;
        } catch (error: any) {
            console.error("Supabase add arena error:", error?.message || error);
            setAssets(prevAssets => {
                const nextAssets = prevAssets.map(asset => asset.id === assetId ?{ ...asset, arenas: asset.arenas.filter(arena => arena.id !== newArena.id) } : asset);
                assetsRef.current = nextAssets;
                return nextAssets;
            });
            showToast("Erro ao salvar arena no servidor: " + (error?.message || 'falha desconhecida'), 'error');
            throw error;
        }
    };

    const updateArena = (arenaId: string, arenaData: Partial<Pick<Arena, 'assetId' | 'name' | 'description' | 'icon' | 'folderId' | 'isArchived' | 'priority'>>) => {
        setAssets(prevAssets => {
            const sourceAsset = prevAssets.find(asset => asset.arenas.some(arena => arena.id === arenaId));
            if (!sourceAsset) return prevAssets;

            const targetAssetId = arenaData.assetId || sourceAsset.id;
            const sourceArena = sourceAsset.arenas.find(arena => arena.id === arenaId);
            if (!sourceArena) return prevAssets;

            if (targetAssetId === sourceAsset.id) {
                return prevAssets.map(asset => ({
                    ...asset,
                    arenas: asset.arenas.map(arena => arena.id === arenaId ?{ ...arena, ...arenaData } : arena)
                }));
            }

            const targetAssetExists = prevAssets.some(asset => asset.id === targetAssetId);
            if (!targetAssetExists) {
                return prevAssets;
            }

            const movedArena = { ...sourceArena, ...arenaData, assetId: targetAssetId };
            return prevAssets.map(asset => {
                if (asset.id === sourceAsset.id) {
                    return {
                        ...asset,
                        arenas: asset.arenas.filter(arena => arena.id !== arenaId),
                    };
                }

                if (asset.id === targetAssetId) {
                    return {
                        ...asset,
                        arenas: [...asset.arenas, movedArena],
                    };
                }

                return asset;
            });
        });
        const userId = getSupabaseUserId();
        if (userId) {
            const snakeCaseData = mapToSnakeCase(arenaData);
            supabase.from('arenas').update(snakeCaseData).eq('id', arenaId).then(({ error }) => {
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
        setArenaFolders(prev => prev.map(f => f.id === folderId ?{ ...f, ...data } : f));

        const userId = getSupabaseUserId();
        if (userId) {
            const snakeCaseData = mapToSnakeCase(data);
            const { error } = await supabase.from('arena_folders').update(snakeCaseData).eq('id', folderId);
            if (error) console.error("Supabase update folder error:", error.message);
        }
    };

    const deleteArenaFolder = async (folderId: string) => {
        // Move arenas out of folder first (or delete them?Usually move to root)
        // Here we will move them to root (folderId = null)
        setAssets(prevAssets => prevAssets.map(asset => ({
            ...asset,
            arenas: asset.arenas.map(a => a.folderId === folderId ?{ ...a, folderId: undefined } : a)
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
                    return updated ?{ ...arena, order: updated.order } : arena;
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
                a.id === arenaId ?{ ...a, priority } : a
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
            // Force state update by creating a completely new array reference for assets
            // AND ensure we are replacing the entire arenas array within the asset
            setAssets(prev => prev.map(a => {
                // Check if this asset contains any of the modified arenas
                const relevantUpdates = arenaUpdates.filter(u => a.arenas.some(ar => ar.id === u.id));

                if (relevantUpdates.length === 0) return a;

                return {
                    ...a,
                    arenas: a.arenas.map(ar => {
                        const up = relevantUpdates.find(u => u.id === ar.id);
                        return up ?{ ...ar, order: up.order } : ar;
                    })
                };
            }));

            // Log payload for debugging
            console.log('Upserting arenas:', arenaUpdates.map(u => ({ id: u.id, user_id: userId, order: u.order })));

            const updatesWithAssetId = arenaUpdates.map(u => {
                const existingArena = getArenas().find(a => a.id === u.id);

                return {
                    id: u.id,
                    user_id: userId,
                    order: u.order,
                    asset_id: existingArena?.assetId, // Include asset_id
                    name: existingArena?.name, // Include name to satisfy constraint
                    description: existingArena?.description, // might as well
                    // difficulty: existingArena?.difficulty, // REMOVED: Column does not exist in Supabase
                    priority: existingArena?.priority,
                    folder_id: existingArena?.folderId
                };
            });

            // Using ignoreDuplicates: false (default) means it updates on conflict.
            const { error } = await supabase.from('arenas').upsert(updatesWithAssetId);
            if (error) console.error("Supabase arena reorder error:", error);
            else console.log("Supabase reorder success");

        }

        if (campaignUpdates.length > 0) {
            setCampaigns(prev => prev.map(c => {
                const up = campaignUpdates.find(u => u.id === c.id);
                return up ?{ ...c, order: up.order } : c;
            }));

            console.log('Upserting campaigns:', campaignUpdates.map(u => ({ id: u.id, user_id: userId, order: u.order })));

            const updatesWithColumns = campaignUpdates.map(u => {
                const existing = campaigns.find(c => c.id === u.id);
                return {
                    id: u.id,
                    user_id: userId,
                    order: u.order,
                    title: existing?.title,
                    description: existing?.description,
                    priority: existing?.priority,
                    priority_order: existing?.priorityOrder
                    // Add other required columns if needed
                };
            });

            const { error } = await supabase.from('campaigns').upsert(updatesWithColumns);
            if (error) console.error("Supabase campaign reorder error:", error);
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
            // Force state update by creating a completely new array reference for assets
            setAssets(prev => prev.map(a => {
                const hasUpdates = a.arenas.some(ar => arenaUpdates.some(u => u.id === ar.id));
                if (!hasUpdates) return a;

                return {
                    ...a,
                    arenas: a.arenas.map(ar => {
                        const up = arenaUpdates.find(u => u.id === ar.id);
                        if (ar.id === draggedId) return { ...ar, priority: priority, priorityOrder: up ?up.priorityOrder : 0 };
                        return up ?{ ...ar, priorityOrder: up.priorityOrder } : ar;
                    })
                };
            }));

            const updatesWithColumns = arenaUpdates.map(u => {
                const existingArena = getArenas().find(a => a.id === u.id);
                return {
                    id: u.id,
                    user_id: userId,
                    priority_order: u.priorityOrder,
                    priority: priority, // All items in this group have this priority
                    asset_id: existingArena?.assetId,
                    name: existingArena?.name,
                    description: existingArena?.description,
                    folder_id: existingArena?.folderId
                };
            });

            await supabase.from('arenas').upsert(updatesWithColumns);
        }

        if (campaignUpdates.length > 0) {
            setCampaigns(prev => prev.map(c => {
                const up = campaignUpdates.find(u => u.id === c.id);
                // Update priority too if it's the dragged item
                if (c.id === draggedId) return { ...c, priority: priority, priorityOrder: up ?up.priorityOrder : 0 };
                return up ?{ ...c, priorityOrder: up.priorityOrder } : c;
            }));

            const updatesWithColumns = campaignUpdates.map(u => {
                const existing = campaigns.find(c => c.id === u.id);
                return {
                    id: u.id,
                    user_id: userId,
                    priority_order: u.priorityOrder,
                    priority: priority,
                    title: existing?.title,
                    description: existing?.description
                };
            });

            await supabase.from('campaigns').upsert(updatesWithColumns);
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

    const deleteArena = async (arenaId: string, _options?: { force?: boolean }) => {
        const userId = getSupabaseUserId();
        const arena = getArenas().find(a => a.id === arenaId);
        if (!arena) return;
        const folderId = arena.folderId;
        const campaignUpdates = campaigns
            .filter(campaign => campaign.arenaIds.includes(arenaId))
            .map(campaign => {
                const nextArenaIds = campaign.arenaIds.filter(id => id !== arenaId);
                const currentConfig = (campaign.arenaConfig || {}) as NonNullable<Campaign['arenaConfig']>;
                const nextConfig = Object.fromEntries(
                    Object.entries(currentConfig)
                        .filter(([id]) => id !== arenaId)
                        .map(([id, config]) => [
                            id,
                            {
                                ...config,
                                prerequisiteArenaIds: (config.prerequisiteArenaIds || []).filter(prereqId => prereqId !== arenaId),
                            },
                        ])
                );
                return { id: campaign.id, nextArenaIds, nextConfig };
            });
        const emptiedCampaignIds = campaignUpdates
            .filter(campaign => campaign.nextArenaIds.length === 0)
            .map(campaign => campaign.id);
        const nextCycleArenaIds = activeCycle?.arenaIds.filter(id => id !== arenaId) || null;
        const shouldDetachArenaFromCycle = Boolean(activeCycle?.arenaIds.includes(arenaId));
        const arenaFlags = getArenaDomainFlags(arena);
        const isQuestArenaType = arenaFlags.isQuest;

        const arenaActions = getActionsForArena(arenaId);
        const arenaActionIds = arenaActions.map(action => action.id);
        let clanQuestFound = false;

        for (const action of arenaActions) {
            const quest = findClanQuestByActionName(action.name);

            if (quest && clan && userId) {
                clanQuestFound = true;
                const { error } = await supabase.from('clan_mission_participants')
                    .delete()
                    .eq('clan_id', clan.id)
                    .eq('mission_id', quest.id)
                    .eq('user_id', userId);

                if (error) {
                    console.error("Error deleting clan mission participation:", error.message);
                }

                setUserMissionParticipations(prev => {
                    const next = { ...prev };
                    delete next[quest.id];
                    return next;
                });

                setClanQuestParticipants(prev => ({
                    ...prev,
                    [quest.id]: Math.max(0, (prev[quest.id] || 1) - 1)
                }));
            }
        }

        if (!clanQuestFound && clan && looksLikeClanQuestArena(arena)) {
            const defaultClanQuest = seasonQuests.find(q => q.type === 'clan')
                || Object.values(SEASONS).flatMap(season => season.quests).find(q => q.type === 'clan');

            if (defaultClanQuest && userId) {
                setUserMissionParticipations(prev => {
                    const next = { ...prev };
                    delete next[defaultClanQuest.id];
                    return next;
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

        if (isQuestArenaType && userId && arenaActions.length > 0) {
            for (const action of arenaActions) {
                if (!clan || !arenaFlags.isClanQuest) continue;
                const quest = findClanQuestByActionName(action.name);
                if (!quest) continue;

                setUserMissionParticipations(prev => {
                    const next = { ...prev };
                    delete next[quest.id];
                    return next;
                });
                setClanQuestParticipants(prev => ({
                    ...prev,
                    [quest.id]: Math.max(0, (prev[quest.id] || 1) - 1)
                }));

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

        const removeTaskIdsFromDailyCommitment = (taskIdsToRemove: string[]) => {
            if (taskIdsToRemove.length === 0) return;
            setDailyCommitmentState(prev => {
                const nextTaskIds = prev.taskIds.filter(id => !taskIdsToRemove.includes(id));
                return nextTaskIds.length === prev.taskIds.length ? prev : { ...prev, taskIds: nextTaskIds };
            });
        };

        const purgeLocalTasksByActionIds = (actionIds: string[]) => {
            if (actionIds.length === 0) return;
            setTasks(prevTasks => {
                const removedTaskIds = prevTasks
                    .filter(task => actionIds.includes(task.actionId))
                    .map(task => task.id);
                removeTaskIdsFromDailyCommitment(removedTaskIds);
                return prevTasks.filter(task => !actionIds.includes(task.actionId));
            });
        };

        purgeLocalTasksByActionIds(arenaActionIds);
        setAssets(prevAssets => prevAssets.map(asset => ({
            ...asset,
            arenas: asset.arenas.filter(existingArena => existingArena.id !== arenaId)
        })));
        setActions(prevActions => prevActions.filter(action => action.arenaId !== arenaId));
        if (campaignUpdates.length > 0) {
            setCampaigns(prevCampaigns => prevCampaigns
                .filter(campaign => !emptiedCampaignIds.includes(campaign.id))
                .map(campaign => {
                    const update = campaignUpdates.find(item => item.id === campaign.id);
                    return update
                        ? { ...campaign, arenaIds: update.nextArenaIds, arenaConfig: update.nextConfig }
                        : campaign;
                }));
        }
        if (shouldDetachArenaFromCycle && nextCycleArenaIds) {
            setActiveCycle(prev => prev ? { ...prev, arenaIds: nextCycleArenaIds } : prev);
        }

        if (folderId) {
            const arenasInFolder = getArenas().filter(existingArena => existingArena.folderId === folderId && existingArena.id !== arenaId);
            if (arenasInFolder.length === 0) {
                deleteArenaFolder(folderId);
            }
        }

        if (userId) {
            if (arenaActionIds.length > 0) {
                await supabase.from('scheduled_tasks').delete().in('action_id', arenaActionIds);
            }
            await supabase.from('actions').delete().eq('arena_id', arenaId);
            await supabase.from('relationship_link_arenas').delete().eq('arena_id', arenaId);
            await supabase.from('relationship_links').update({ arena_id: null, arena_snapshot: null }).eq('arena_id', arenaId);
            if (campaignUpdates.length > 0) {
                const nonEmptyCampaignUpdates = campaignUpdates.filter(({ id }) => !emptiedCampaignIds.includes(id));
                if (nonEmptyCampaignUpdates.length > 0) {
                    await Promise.allSettled(
                        nonEmptyCampaignUpdates.map(({ id, nextArenaIds, nextConfig }) =>
                            supabase.from('campaigns').update({
                                arena_ids: nextArenaIds,
                                arena_config: nextConfig,
                            }).eq('id', id)
                        )
                    );
                }
                if (emptiedCampaignIds.length > 0) {
                    await supabase.from('campaigns').delete().in('id', emptiedCampaignIds);
                }
            }
            if (activeCycle?.id && nextCycleArenaIds && shouldDetachArenaFromCycle) {
                await supabase.from('cycles').update({ arena_ids: nextCycleArenaIds }).eq('id', activeCycle.id);
            }
            supabase.from('arenas').delete().eq('id', arenaId).then(({ error }) => {
                if (error) console.error("Supabase delete arena error:", error.message);
            });
        }

        showToast('Arena excluida definitivamente.', 'success');
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
        if (arena) {
            const arenaFlags = getArenaDomainFlags(arena);
            if (arenaFlags.isSeasonQuest) return { background: 'var(--quest-grad-season)' };
            if (arenaFlags.isClanQuest) return { background: 'var(--quest-grad-clan)' };
            if (arenaFlags.isSideQuest) return { background: 'var(--quest-grad-sidequest)' };
        }
        const asset = getAssetForAction(actionId);
        return { background: `var(--asset-grad-${asset?.id || 'default'})` };
    };

    const mergeScheduleIntoContext = (baseContext: Action['context'] | undefined, scheduledDays?: DayOfWeek[], scheduledStartTime?: number) => {
        const hasSchedule = scheduledDays !== undefined || scheduledStartTime !== undefined;
        if (!hasSchedule) return baseContext;
        const schedule = {
            ...(baseContext?.schedule || {}),
            ...(scheduledDays !== undefined ?{ days: scheduledDays } : {}),
            ...(scheduledStartTime !== undefined ?{ startTime: scheduledStartTime } : {})
        };
        return { ...(baseContext || {}), schedule };
    };

    const addAction = async (actionData: Omit<Action, 'id'>): Promise<Action> => {
        const newAction: Action = {
            ...actionData,
            id: crypto.randomUUID(),
            difficulty: normalizeActionDifficulty(actionData.difficulty),
        };
        const userId = getSupabaseUserId();
        const previousCycleArenaIds = activeCycle ?[...activeCycle.arenaIds] : null;
        const shouldAttachArenaToCycle = Boolean(activeCycle && !activeCycle.arenaIds.includes(newAction.arenaId));

        setActions(prev => [...prev, newAction]);
        setAssets(prevAssets => prevAssets.map(asset => {
            const arena = asset.arenas.find(ar => ar.id === newAction.arenaId);
            if (arena) {
                return {
                    ...asset,
                    arenas: asset.arenas.map(ar => {
                        if (ar.id !== newAction.arenaId) return ar;
                        const actionIds = Array.isArray(ar.actionIds) ?ar.actionIds : [];
                        return { ...ar, actionIds: [...actionIds, newAction.id] };
                    })
                };
            }
            return asset;
        }));

        if (shouldAttachArenaToCycle) {
            const arenaId = newAction.arenaId;
            console.log('[GameContext] Adding Arena ' + arenaId + ' to Active Cycle ' + activeCycle!.id + ' via addAction');

            setActiveCycle(prev => {
                if (!prev) return null;
                if (prev.arenaIds.includes(arenaId)) return prev;
                return { ...prev, arenaIds: [...prev.arenaIds, arenaId] };
            });

            if (userId) {
                const nextArenaIds = [...(previousCycleArenaIds || []), arenaId];
                supabase.from('cycles').update({ arena_ids: nextArenaIds }).eq('id', activeCycle!.id).then(({ error }) => {
                    if (error) console.error("Error updating cycle arena_ids:", error.message);
                });
            }
        }

        if (!userId) {
            return newAction;
        }

        try {
            const contextPayload = mergeScheduleIntoContext(newAction.context, newAction.scheduledDays, newAction.scheduledStartTime);
            const originCodexId = newAction.originCodexId && isUuid(newAction.originCodexId) ?newAction.originCodexId : null;
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
                difficulty: newAction.difficulty ?? null,
                briefing: newAction.briefing || null,
                assets: newAction.assets || [],
                pre_flight: newAction.preFlight || [],
                context: contextPayload || {},
                origin_codex_id: originCodexId
            };

            const { error } = await supabase.from('actions').insert(actionPayload);
            if (error) throw error;

            return newAction;
        } catch (error: any) {
            console.error("Supabase add action error:", error?.message || error);
            setActions(prev => prev.filter(action => action.id !== newAction.id));
            setTasks(prev => prev.filter(task => task.actionId !== newAction.id));
            setAssets(prevAssets => prevAssets.map(asset => ({
                ...asset,
                arenas: asset.arenas.map(arena => {
                    if (arena.id !== newAction.arenaId) return arena;
                    const actionIds = Array.isArray(arena.actionIds) ?arena.actionIds : [];
                    return { ...arena, actionIds: actionIds.filter(id => id !== newAction.id) };
                })
            })));

            if (shouldAttachArenaToCycle && activeCycle && previousCycleArenaIds) {
                setActiveCycle(prev => prev?.id === activeCycle.id ?{ ...prev, arenaIds: previousCycleArenaIds } : prev);
                await supabase.from('cycles').update({ arena_ids: previousCycleArenaIds }).eq('id', activeCycle.id);
            }

            showToast("Erro ao salvar aÃ§Ã£o: " + (error?.message || 'falha desconhecida'), 'error');
            throw error;
        }
    };

    const updateAction = (actionId: string, actionData: Partial<Action>) => {
        const previousAction = actions.find(a => a.id === actionId);
        const previousArenaId = previousAction?.arenaId;
        setActions(prev => prev.map(a => {
            if (a.id !== actionId) return a;

            const nextArenaId = typeof actionData.arenaId === 'string' && actionData.arenaId.trim()
                ?actionData.arenaId
                : a.arenaId;

            return {
                ...a,
                ...actionData,
                arenaId: nextArenaId,
                ...(actionData.difficulty !== undefined ? { difficulty: normalizeActionDifficulty(actionData.difficulty) } : {}),
            };
        }));
        const nextArenaId = typeof actionData.arenaId === 'string' && actionData.arenaId.trim()
            ? actionData.arenaId
            : previousArenaId;
        if (previousArenaId && nextArenaId && previousArenaId !== nextArenaId) {
            setAssets(prevAssets => prevAssets.map(asset => ({
                ...asset,
                arenas: asset.arenas.map(arena => {
                    if (arena.id === previousArenaId) {
                        const actionIds = Array.isArray(arena.actionIds) ? arena.actionIds : [];
                        return { ...arena, actionIds: actionIds.filter(id => id !== actionId) };
                    }
                    if (arena.id === nextArenaId) {
                        const actionIds = Array.isArray(arena.actionIds) ? arena.actionIds : [];
                        return actionIds.includes(actionId)
                            ? arena
                            : { ...arena, actionIds: [...actionIds, actionId] };
                    }
                    return arena;
                })
            })));
        }
        const userId = getSupabaseUserId();
        if (userId) {
            // Explicit payload construction for updates
            const updatePayload: any = {};
            if (actionData.arenaId !== undefined && typeof actionData.arenaId === 'string' && actionData.arenaId.trim()) {
                updatePayload.arena_id = actionData.arenaId;
            }
            if (actionData.name !== undefined) updatePayload.name = actionData.name;
            if (actionData.description !== undefined) updatePayload.description = actionData.description;
            if (actionData.icon !== undefined) updatePayload.icon = actionData.icon;
            if (actionData.duration !== undefined) updatePayload.duration = actionData.duration;
            if (actionData.repetitions !== undefined) updatePayload.repetitions = actionData.repetitions;
            if (actionData.actionType !== undefined) updatePayload.action_type = actionData.actionType;
            if (actionData.difficulty !== undefined) updatePayload.difficulty = normalizeActionDifficulty(actionData.difficulty);
            if (actionData.briefing !== undefined) updatePayload.briefing = actionData.briefing;
            if (actionData.assets !== undefined) updatePayload.assets = actionData.assets;
            if (actionData.preFlight !== undefined) updatePayload.pre_flight = actionData.preFlight;
            if (actionData.context !== undefined || actionData.scheduledDays !== undefined || actionData.scheduledStartTime !== undefined) {
                updatePayload.context = mergeScheduleIntoContext(actionData.context, actionData.scheduledDays, actionData.scheduledStartTime);
            }

            if (Object.keys(updatePayload).length > 0) {
                supabase.from('actions').update(updatePayload).eq('id', actionId).then(({ error }) => {
                    if (error) console.error("Supabase update action error:", error.message);
                });
            }
        }
    };
    const deleteAction = async (actionId: string) => {
        // Check if we need to remove the arena (if it becomes empty and is a special quest arena)
        const action = actions.find(a => a.id === actionId);
        const arenaId = action?.arenaId;
        const actionTaskIds = tasks.filter(task => task.actionId === actionId).map(task => task.id);

        // Remove clan mission participation if applicable
        if (action && clan) {
            const quest = findClanQuestByActionName(action.name);

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

            if (action.originCodexId?.startsWith('clan_quest:')) {
                const customQuestId = action.originCodexId.split(':')[1];
                const userId = getSupabaseUserId();
                if (userId) {
                    const { error: customPartError } = await supabase.from('clan_mission_participants')
                        .delete()
                        .eq('clan_id', clan.id)
                        .eq('mission_id', customQuestId)
                        .eq('user_id', userId);

                    if (customPartError) {
                        console.error("Error deleting custom group task participation:", customPartError.message);
                    }

                    const { error: unlockCustomError } = await supabase.from('clan_custom_quests')
                        .update({ status: 'active', assigned_user_id: null })
                        .eq('id', customQuestId)
                        .eq('assigned_user_id', userId);

                    if (unlockCustomError) {
                        console.error("Error unlocking custom group task:", unlockCustomError.message);
                    }
                }
            }
        }

        setActions(prev => prev.filter(a => a.id !== actionId));
        setTasks(prev => prev.filter(t => t.actionId !== actionId));
        if (actionTaskIds.length > 0) {
            setDailyCommitmentState(prev => ({
                ...prev,
                taskIds: prev.taskIds.filter(taskId => !actionTaskIds.includes(taskId))
            }));
        }

        setAssets(prevAssets => {
            return prevAssets.map(asset => {
                // Check if this asset contains the arena
                const hasArena = asset.arenas.some(ar => ar.id === arenaId);
                if (!hasArena) return asset;

                return {
                    ...asset,
                    arenas: asset.arenas.map(arena => {
                        if (arena.id !== arenaId) return arena;
                        const actionIds = Array.isArray(arena.actionIds) ?arena.actionIds : [];
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
                    const shouldDeleteEmptyArena = isQuestArena(arena) || isOfficeArena(arena);
                    if (isQuestArena(arena)) {
                        updateArena(arenaId, { isArchived: true });
                    }
                    // Also cleanup empty Office arenas
                    if (isOfficeArena(arena)) {
                        updateArena(arenaId, { isArchived: true });
                        showToast('Arena Office arquivada (sem aÃ§Ãµes).', 'info');
                    }
                    if (shouldDeleteEmptyArena) {
                        setTimeout(() => deleteArena(arenaId), 0);
                    }
                }
            }
        }

        const userId = getSupabaseUserId();
        if (userId) {
            await supabase.from('scheduled_tasks').delete().eq('action_id', actionId);
            supabase.from('actions').delete().eq('id', actionId).then(({ error }) => {
                if (error) console.error("Supabase delete action error:", error.message);
            });
        }
    };

    const activateClanQuest = async (questId: string) => {
        if (!clan) return;
        const quest = findSeasonQuestById(questId);
        if (!quest || quest.type !== 'clan') return;

        // Upsert into clan_mission_progress to mark it as active for the clan
        const { error } = await supabase.from('clan_mission_progress').upsert({
            clan_id: clan.id,
            mission_id: quest.id,
            target_value: quest.requirements?.clanGoal || quest.goal_value || quest.actionTemplate?.repetitions || 1,
            current_value: 0
        }, { onConflict: 'clan_id,mission_id', ignoreDuplicates: true });

        if (error) {
            console.error("Error activating clan quest:", error);
            showToast("Erro ao ativar tarefa do grupo.");
        } else {
            showToast("Tarefa ativada para o grupo!");
            // Refresh clan progress/state if needed
            fetchClanQuestProgress(clan.id);
        }
    };

    const findSeasonQuestArenaAndAction = useCallback((quest: SeasonQuest) => {
        const normalizedArenaName = normalizeDomainLabel(quest.title || '');
        const normalizedActionName = normalizeDomainLabel(quest.actionTemplate?.name || '');
        const arena = getArenas().find(candidate => normalizeDomainLabel(candidate.name || '') === normalizedArenaName);
        const action = arena
            ? actions.find(candidate =>
                candidate.arenaId === arena.id &&
                normalizeDomainLabel(candidate.name || '') === normalizedActionName
            )
            : undefined;

        return { arena, action };
    }, [actions, getArenas]);

    const acceptSeasonQuest = async (questId: string) => {
        const quest = findSeasonQuestById(questId);
        if (!quest) return;

        if (quest.season_id && quest.season_id !== activeRuntimeSeasonId) {
            showToast("Essa jornada pertence a uma temporada encerrada.", 'info');
            return;
        }

        // Se for quest de cla, garante participacao
        if (quest.type === 'clan') {
            // VERIFICACAO DE SEGURANCA: So permite entrar se o lider ja ativou
            if (clan) {
                const clanProgress = clanQuestProgress[clan.id];
                const isActiveForClan = clanProgress && clanProgress[quest.id] !== undefined;

                if (!isActiveForClan) {
                    showToast("Esta tarefa precisa ser ativada pelo lider do grupo primeiro.");
                    return;
                }
            }

            await joinClanMission(quest.id);
        }

        // 1. Verificar se a aÃ§Ã£o jÃ¡ existe
        const isClanQuest = quest.type === 'clan';
        // NOME DA ARENA = TÃTULO DA MISSÃ’O
        // O usuÃ¡rio solicitou explicitamente: "quero que cada quest de cla e de missao crie uma arena nova com o nome daquela missao"
        const seasonArenaName = quest.title; // Ex: "Correr 15km", "Ler Livro X"

        // 2. Buscar ou Criar Arena (EspecÃ­fica para esta missÃ£o)
        let { arena, action: existingAction } = findSeasonQuestArenaAndAction(quest);

        if (existingAction) {
            if (quest.type === 'clan' && clan) {
                const isParticipating = userMissionParticipations[quest.id];
                if (!isParticipating) {
                    await joinClanMission(quest.id);
                    return;
                }
            }
            showToast(`Tarefa "${quest.title}" ja esta ativa.`, 'info');
            return;
        }

        if (!arena) {
            // Se nÃ£o existe, cria uma nova arena dedicada
            const assetId = assets[0]?.id || 'geral';
            arena = await addArena(assetId, {
                name: seasonArenaName,
                description: quest.description || (isClanQuest ? 'Tarefa do grupo' : 'Missao de temporada'),
                icon: quest.actionTemplate.icon || (isClanQuest ? '\u2694\uFE0F' : '\u{1F4DD}'),
                priority: 'alta' // Destaque para missÃµes ativas
            });

            // PersistÃªncia Manual
        }

        // Garantir que nÃ£o estÃ¡ arquivada
        if (arena?.isArchived) {
            updateArena(arena.id, { isArchived: false });
        }

        // 3. Criar a AÃ§Ã£o na Arena
        await addAction({
            arenaId: arena.id,
            name: quest.actionTemplate.name,
            description: quest.actionTemplate.description,
            icon: isClanQuest ? '\u2694\uFE0F' : (quest.actionTemplate.icon || '\u{1F4DD}'),
            duration: quest.actionTemplate.duration,
            repetitions: isClanQuest ?(quest.requirements?.clanGoal || quest.goal_value || quest.actionTemplate.repetitions || 1) : (quest.actionTemplate.repetitions || quest.goal_value || 1),
            actionType: quest.actionTemplate.isMilestone ? 'Marco' : 'A\u00E7\u00E3o Recorrente',
            difficulty: 3
        });

        // ConfiguraÃ§Ã£o adicional para quests de clÃ£
        if (isClanQuest && clan) {
            // REMOVIDO: Upsert automÃ¡tico em clan_mission_progress. 
            // Agora o lÃ­der deve ativar explicitamente via activateClanQuest.
            // Apenas juntamos o membro Ã  missÃ£o.
            await joinClanMission(quest.id);
        }

        showToast(`Missao "${quest.title}" aceita. Confira a arena "${seasonArenaName}".`, 'success');
    };

    const abortSeasonQuest = async (questId: string) => {
        const quest = findSeasonQuestById(questId);
        if (!quest) return;

        const { action: existingAction } = findSeasonQuestArenaAndAction(quest);
        if (existingAction) {
            await deleteAction(existingAction.id);
        } else if (quest.type === 'clan') {
            await leaveClanMission(quest.id);
        }

        showToast(`Tarefa "${quest.title}" abandonada.`);
    };

    const claimSeasonQuest = async (questId: string) => {
        const quest = findSeasonQuestById(questId);
        if (!quest) return;
        if (quest.season_id && quest.season_id !== activeRuntimeSeasonId) {
            showToast("Essa jornada pertence a uma temporada encerrada.", 'info');
            return;
        }

        if (userProfile.completedSeasonMissions?.includes(questId)) {
            showToast("Recompensa jÃ¡ resgatada!");
            return;
        }

        // Add XP
        const currentExp = userProfile.nobility.exp;
        const addedExp = quest.rewards.xp;
        const nextExp = currentExp + addedExp;

        // Check for chest rewards in description
        const rewardValue = typeof quest.reward_value === 'string' ? quest.reward_value.trim() : '';
        let earnedChest: ChestType | null = null;
        if (quest.reward_type === 'chest' && rewardValue) {
            const normalizedReward = rewardValue.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            if (normalizedReward === 'season' || normalizedReward === 'temporada') earnedChest = 'Season';
            else if (normalizedReward === 'comum') earnedChest = 'Comum';
            else if (normalizedReward === 'incomum') earnedChest = 'Incomum';
            else if (normalizedReward === 'ciclo') earnedChest = 'Ciclo';
            else if (normalizedReward === 'raro') earnedChest = 'Raro';
            else if (normalizedReward === 'epico') earnedChest = 'Ã‰pico';
            else if (normalizedReward === 'lendario') earnedChest = 'LendÃ¡rio';
            else if (normalizedReward === 'skin comum') earnedChest = 'Skin Comum';
        }
        if (quest.description.includes("BaÃº Comum")) earnedChest = 'Comum';
        else if (quest.description.includes("BaÃº Incomum")) earnedChest = 'Incomum';
        else if (quest.description.includes("BaÃº Ciclo")) earnedChest = 'Ciclo';
        else if (quest.description.includes("BaÃº Raro")) earnedChest = 'Raro';
        else if (quest.description.includes("Ba\u00FA \u00C9pico")) earnedChest = '\u00C9pico';
        else if (quest.description.includes("Ba\u00FA Lend\u00E1rio")) earnedChest = 'Lend\u00E1rio';

        if (!earnedChest) {
            const normalizedDescription = quest.description.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (normalizedDescription.includes('Bau Season') || normalizedDescription.includes('Bau Temporada')) {
                earnedChest = 'Season';
            }
        }

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
            content: { title: `Quest Completada: ${quest.title}`, icon: 'ðŸ“', score: addedExp }
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
        const mission = findSeasonMissionById(missionId);
        if (!mission) return;
        if (mission.season_id && mission.season_id !== activeRuntimeSeasonId) {
            showToast("Essa missao pertence a uma temporada encerrada.", 'info');
            return;
        }

        if (userProfile.completedSeasonMissions?.includes(missionId)) {
            showToast("Recompensa jÃ¡ resgatada!");
            return;
        }

        // Add XP
        const currentExp = userProfile.nobility.exp;
        const addedExp = typeof mission.reward_value === 'number' ?mission.reward_value : 0;
        const nextExp = currentExp + addedExp;

        // Check for chest rewards in description
        if (mission.description.includes("BaÃº Comum")) await addChest('Comum');
        if (mission.description.includes("BaÃº Incomum")) await addChest('Incomum');
        if (mission.description.includes("BaÃº Ciclo")) await addChest('Ciclo');
        if (mission.description.includes("BaÃº Raro")) await addChest('Raro');
        if (mission.description.includes("Ba\u00FA \u00C9pico")) await addChest('\u00C9pico');
        if (mission.description.includes("Ba\u00FA Lend\u00E1rio")) await addChest('Lend\u00E1rio');

        // Grant items if it's an item reward
        const earnedItemIds: string[] = [];
        let earnedChest: ChestType | undefined =
            mission.description.includes("BaÃƒÂº Comum") ? 'Comum'
            : mission.description.includes("BaÃƒÂº Incomum") ? 'Incomum'
            : mission.description.includes("BaÃƒÂº Ciclo") ? 'Ciclo'
            : mission.description.includes("BaÃƒÂº Raro") ? 'Raro'
            : mission.description.includes("Ba\u00FA \u00C9pico") ? '\u00C9pico'
            : mission.description.includes("Ba\u00FA Lend\u00E1rio") ? 'Lend\u00E1rio'
            : undefined;
        if (mission.reward_type === 'item_id' && typeof mission.reward_value === 'string') {
            const itemId = mission.reward_value;
            const def = resolveItemDef(itemId);
            if (def?.category === 'insignia') {
                grantUserUnlock('insignias', itemId);
            }
            grantInventoryItem(itemId, true); // Silent
            earnedItemIds.push(itemId);
        }
        if (Array.isArray(mission.reward_item_ids)) {
            for (const itemId of mission.reward_item_ids) {
                if (!itemId || earnedItemIds.includes(itemId)) continue;
                const def = resolveItemDef(itemId);
                if (def?.category === 'insignia') {
                    grantUserUnlock('insignias', itemId);
                }
                grantInventoryItem(itemId, true);
                earnedItemIds.push(itemId);
            }
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
            content: { title: `Miss\u00E3o de Temporada: ${mission.title}`, icon: '\u{1F4DD}', score: Number(addedExp) }
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
                        items: allEarnedItems,
                        chest: earnedChest
                    }
                }
            });
        }
    };

    useEffect(() => {
        if (!isProfileLoaded || !hasHydratedFromSupabase) return;

        const staleSeasonQuests = Object.values(SEASONS)
            .flatMap((season) => season.quests || [])
            .filter((quest) => quest.season_id && quest.season_id !== activeRuntimeSeasonId);

        if (staleSeasonQuests.length === 0) return;

        const staleMatches = staleSeasonQuests
            .map((quest) => {
                const { arena, action } = findSeasonQuestArenaAndAction(quest);
                if (!action) return null;
                const arenaActionCount = arena ? actions.filter((candidate) => candidate.arenaId === arena.id).length : 0;
                return {
                    quest,
                    arena,
                    action,
                    shouldDeleteArenaAfterAction: Boolean(arena) && arenaActionCount <= 1,
                };
            })
            .filter((entry): entry is {
                quest: SeasonQuest;
                arena: Arena | undefined;
                action: Action;
                shouldDeleteArenaAfterAction: boolean;
            } => Boolean(entry));

        const cleanupKey = `${userProfile.id}:${activeRuntimeSeasonId}:${staleMatches.map((entry) => entry.action.id).sort().join('|')}`;
        if (staleMatches.length === 0 || staleSeasonQuestCleanupKeyRef.current === cleanupKey) return;
        staleSeasonQuestCleanupKeyRef.current = cleanupKey;

        let cancelled = false;

        void (async () => {
            for (const entry of staleMatches) {
                if (cancelled) return;
                await deleteAction(entry.action.id);
                if (entry.arena && entry.shouldDeleteArenaAfterAction) {
                    await deleteArena(entry.arena.id);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        actions,
        activeRuntimeSeasonId,
        deleteAction,
        deleteArena,
        findSeasonQuestArenaAndAction,
        hasHydratedFromSupabase,
        isProfileLoaded,
        userProfile.id,
    ]);

    const questSharedDomain = useQuestSharedDomain({
        seasonQuests,
        sessionUserId: session?.user.id,
        supabase,
        getSupabaseUserId,
        clan,
        assets,
        getArenas,
        getActionsForArena,
        addArena,
        updateArena,
        showToast,
    });

    const {
        getClanQuestForActionName,
        getClanQuestsForArena,
        getClanQuestForAction,
        getSharedActionPoolProgress,
        getOrCreateOfficeArena,
        cleanupEmptyOfficeArena,
        setArenaAsShared,
        updateCustomClanMissionProgress,
    } = questSharedDomain;

    const taskDomain = createTaskDomain({
        tasks,
        activeCycle,
        campaigns,
        dailyCommitment,
        judgedOperationalDates,
        clan,
        supabase,
        setTasks,
        setDailyCommitmentState,
        getActionById,
        getArenas,
        getActionsForArena,
        getClanQuestForAction,
        getSupabaseUserId,
        isClanQuestActionId,
        showToast,
        updateClanMissionProgress,
        updateCustomClanMissionProgress,
        handleCompetitionArenaCompletion: resolveCompetitionChallengeOutcome,
        setAchievementUnlocked,
        addFeedEvent,
        getLocalDateString,
        mapToSnakeCase,
        addProfileFlag,
        tutorialActionId: TUTORIAL_ACTION_ID,
        tutorialCompletedFlag: PROFILE_FLAG_TUTORIAL_COMPLETED,
        reconcileJudgedDayTaskMutation,
    });

    const {
        scheduleMultipleTasks,
        scheduleTask,
        scheduleAndCompleteNow,
        scheduleAndCompleteAt,
        scheduleAndCompleteMilestoneNow,
        returnTaskToPool,
        deleteTask,
        getTasksForDate,
        rescheduleTask,
        updateTask,
        toggleTaskCompletion,
        completeTutorialMission,
    } = taskDomain;

    const clearPendingTasksForAction = async (actionId: string) => {
        const pendingTaskIds = tasks
            .filter(task => task.actionId === actionId && !task.completed)
            .map(task => task.id);

        if (pendingTaskIds.length === 0) return;

        setTasks(prevTasks => prevTasks.filter(task => !(task.actionId === actionId && !task.completed)));
        setDailyCommitmentState(prev => ({
            ...prev,
            taskIds: prev.taskIds.filter(taskId => !pendingTaskIds.includes(taskId))
        }));

        const userId = getSupabaseUserId();
        if (!userId) return;

        const { error } = await supabase
            .from('scheduled_tasks')
            .delete()
            .eq('action_id', actionId)
            .eq('completed', false)
            .eq('user_id', userId);

        if (error) {
            console.error('Error clearing pending action tasks:', error.message);
            showToast('Nao foi possivel limpar os agendamentos antigos dessa acao.', 'error');
        }
    };

    const mapClanCreateErrorMessage = (message?: string) => {
        const normalizedMessage = String(message || '').trim();
        const lowerMessage = normalizedMessage.toLowerCase();

        switch (normalizedMessage) {
            case 'AUTH_REQUIRED':
                return 'Voce precisa estar autenticado para criar um grupo.';
            case 'CLAN_NAME_REQUIRED':
                return 'O nome do grupo nao pode ficar vazio.';
            case 'CLAN_ALREADY_JOINED':
                return 'Voce ja participa de um grupo.';
            case 'CLAN_NAME_ALREADY_EXISTS':
                return 'Ja existe um grupo com esse nome.';
            case 'Saldo insuficiente de Ouro.':
                return `Voce precisa de ${GOLD_CLAN_CREATION_COST} ouro para criar um grupo.`;
            default:
                if (lowerMessage.includes('duplicate') || lowerMessage.includes('already exists')) {
                    return 'Ja existe um grupo com esse nome.';
                }
                if (lowerMessage.includes('insufficient') || lowerMessage.includes('saldo insuficiente')) {
                    return `Voce precisa de ${GOLD_CLAN_CREATION_COST} ouro para criar um grupo.`;
                }
                if (lowerMessage.includes('joined') || lowerMessage.includes('participa')) {
                    return 'Voce ja participa de um grupo.';
                }
                if (lowerMessage.includes('auth') || lowerMessage.includes('row-level security')) {
                    return 'Voce precisa estar autenticado para criar um grupo.';
                }
                return normalizedMessage
                    ? `Nao foi possivel criar o grupo. ${normalizedMessage.slice(0, 140)}`
                    : 'Nao foi possivel criar o grupo.';
        }
    };

    // --- Clan Functions ---
    const createClan = async (clanDetails: Omit<Clan, 'id' | 'exp' | 'rankId'>): Promise<boolean> => {
        const userId = getSupabaseUserId();
        if (!userId) {
            console.error("User not authenticated");
            showToast('Voce precisa estar autenticado para criar um grupo.', 'error');
            return false;
        }

        if ((userProfile.wallet?.gold || 0) < GOLD_CLAN_CREATION_COST) {
            showToast(`Voce precisa de ${GOLD_CLAN_CREATION_COST} ouro para criar um grupo.`, 'warning');
            promptGoldShortage({
                requiredGold: GOLD_CLAN_CREATION_COST,
                label: 'criar um grupo',
                storeTab: 'store',
                section: 'packs',
            });
            return false;
        }

        const { data, error } = await supabase.rpc('create_clan_with_gold', {
            p_name: clanDetails.name,
            p_icon: clanDetails.icon ?? null,
            p_description: clanDetails.description ?? '',
            p_clan_type: clanDetails.clanType,
            p_recruitment_status: clanDetails.recruitmentStatus ?? 'Aberto',
        });

        if (error) {
            console.error('Error creating clan:', error.message);
            showToast(mapClanCreateErrorMessage(error.message), 'error');
            return false;
        }

        const createdClan = (data as any)?.clan;
        const newGold = Number((data as any)?.new_gold ?? userProfile.wallet?.gold ?? 0);
        const clanId = createdClan?.id;

        if (!clanId) {
            showToast('Nao foi possivel confirmar a criacao do grupo.', 'error');
            return false;
        }

        const optimisticClan = {
            ...(mapToCamelCase(createdClan) as Clan),
            backgroundUrl: clanDetails.backgroundUrl ?? mapToCamelCase(createdClan).backgroundUrl,
        } as Clan;

        clanCacheRef.current = null;
        setClan(optimisticClan);
        setEnrichedClanMembers([
            {
                ...userProfile,
                clanName: optimisticClan.name,
                clanIcon: optimisticClan.icon,
                role: 'leader',
                joined_at: new Date().toISOString(),
            } as EnrichedClanMember,
        ]);
        setClanJoinRequestsIncoming([]);

        updateUserProfile({
            clanName: optimisticClan.name,
            clanIcon: optimisticClan.icon,
            wallet: {
                ...userProfile.wallet,
                gold: newGold,
            },
        });

        await loadClanAndMembers(clanId, true);
        if (clanDetails.backgroundUrl) {
            const { error: backgroundError } = await supabase
                .from('clans')
                .update({ background_url: clanDetails.backgroundUrl })
                .eq('id', clanId);

            if (backgroundError) {
                console.error('Error persisting clan background:', backgroundError.message);
            } else {
                setClan(prev => (prev && prev.id === clanId) ? { ...prev, backgroundUrl: clanDetails.backgroundUrl } : prev);
            }
        }
        showToast(`Grupo criado com sucesso. ${GOLD_CLAN_CREATION_COST} ouro debitados.`, 'success');
        return true;
    };

    const updateClan = async (clanId: string, data: Partial<Pick<Clan, 'name' | 'icon' | 'description' | 'backgroundUrl' | 'recruitmentStatus'>>): Promise<boolean> => {
        const normalizedData = {
            ...data,
            ...(typeof data.name === 'string' ? { name: data.name.trim() } : {}),
            ...(typeof data.description === 'string' ? { description: data.description.trim() } : {}),
        };
        const snakeCaseData = mapToSnakeCase(normalizedData) as Record<string, unknown>;
        const { data: updatedClanRow, error } = await supabase
            .from('clans')
            .update(snakeCaseData)
            .eq('id', clanId)
            .select('*')
            .maybeSingle();

        if (error || !updatedClanRow) {
            console.error("Error updating clan:", error?.message || 'No clan row returned');
            showToast('Nao foi possivel atualizar o grupo.', 'error');
            return false;
        }

        const updatedClan = mapToCamelCase(updatedClanRow) as Clan;
        setClan(updatedClan);
        clanCacheRef.current = null;

        if (updatedClan.name || updatedClan.icon) {
            setEnrichedClanMembers(prev =>
                prev.map(member => ({
                    ...member,
                    clanName: updatedClan.name ?? member.clanName,
                    clanIcon: updatedClan.icon ?? member.clanIcon,
                }))
            );

            updateUserProfile({
                clanName: updatedClan.name ?? userProfile.clanName,
                clanIcon: updatedClan.icon ?? userProfile.clanIcon,
            });
        }

        await loadClanAndMembers(clanId, true);
        showToast('Grupo atualizado.', 'success');
        return true;
    };

    const leaveClan = async () => {
        const userId = getSupabaseUserId();
        if (!userId) { console.error("User not authenticated"); return; }
        const currentClanId = clan?.id || null;
        if (currentClanId) {
            const { error: missionError } = await supabase
                .from('clan_mission_participants')
                .delete()
                .eq('clan_id', currentClanId)
                .eq('user_id', userId);
            if (missionError) {
                console.error("Error clearing clan mission participations:", missionError.message);
            }
        }

        const { data: deletedMembershipRows, error } = await supabase
            .from('clan_members')
            .delete()
            .eq('user_id', userId)
            .eq('clan_id', currentClanId)
            .select('user_id');
        if (error) {
            console.error("Error leaving clan:", error.message);
            showToast('NÃ£o foi possÃ­vel sair do grupo agora.', 'error');
            return;
        }
        if (!deletedMembershipRows || deletedMembershipRows.length === 0) {
            showToast('Sua saÃ­da do grupo nÃ£o foi confirmada.', 'warning');
            await refreshClanMembershipState(userId);
            return;
        }

        // Invalidate cache for the clan we just left
        if (clan && clanCacheRef.current && clanCacheRef.current.clanId === clan.id) {
            clanCacheRef.current.timestamp = 0;
        }

        await refreshClanMembershipState(userId);
        showToast('VocÃª saiu do grupo.', 'success');
    };

    const legacyTransferLeadershipAndLeave = async (newLeaderId: string) => {
        if (!clan || !session) return;
        if (getCurrentClanRole() !== 'leader') {
            showToast('SÃ³ a lideranÃ§a pode transferir o grupo.', 'warning');
            return;
        }
        if (!isUuid(newLeaderId)) {
            console.error("Invalid new leader ID");
            return;
        }
        if (newLeaderId === session.user.id) {
            showToast('Escolha outra pessoa para assumir a lideranÃ§a.', 'warning');
            return;
        }
        const { error: promoteError } = await supabase.from('clan_members').update({ role: 'leader' }).eq('clan_id', clan.id).eq('user_id', newLeaderId);
        if (promoteError) { console.error("Error transferring leadership:", promoteError.message); showToast('NÃ£o foi possÃ­vel transferir a lideranÃ§a.', 'error'); return; }
        await leaveClan();
    };

    const legacyDeleteClan = async () => {
        if (!clan) return;
        const currentUserId = getSupabaseUserId();
        if (!currentUserId) return;
        if (getCurrentClanRole() !== 'leader') {
            showToast('SÃ³ a lideranÃ§a pode apagar o grupo.', 'warning');
            return;
        }
        if (enrichedClanMembers.length > 1) {
            showToast('Para apagar o grupo, primeiro ele precisa ficar sÃ³ com vocÃª.', 'warning');
            return;
        }

        let deleteError: { message?: string } | null = null;
        const firstDelete = await supabase.from('clans').delete().eq('id', clan.id);
        deleteError = firstDelete.error || null;

        if (deleteError) {
            const { error: memberDeleteError } = await supabase
                .from('clan_members')
                .delete()
                .eq('clan_id', clan.id)
                .eq('user_id', currentUserId);
            if (memberDeleteError) {
                console.error("Error deleting leader membership before clan delete:", memberDeleteError.message);
            }

            const retryDelete = await supabase.from('clans').delete().eq('id', clan.id);
            deleteError = retryDelete.error || null;
        }

        if (deleteError) {
            console.error("Error deleting clan:", deleteError.message);
            showToast('NÃ£o foi possÃ­vel apagar o grupo agora.', 'error');
            return;
        }

        if (clanCacheRef.current && clanCacheRef.current.clanId === clan.id) {
            clanCacheRef.current.timestamp = 0;
        }
        setClan(null);
        setEnrichedClanMembers([]);
        setClanJoinRequestsIncoming([]);
        setClanJoinRequestsOutgoing([]);
        setClanQuestProgress({});
        setClanQuestParticipants({});
        setUserMissionParticipations({});
        updateUserProfile({ clanName: undefined, clanIcon: undefined });
        showToast('Grupo apagado com sucesso.', 'success');
    };

    const transferLeadershipAndLeave = async (newLeaderId: string) => {
        if (!clan || !session) return;
        if (getCurrentClanRole() !== 'leader') {
            showToast('SÃ³ a lideranÃ§a pode transferir o grupo.', 'warning');
            return;
        }
        if (!isUuid(newLeaderId)) {
            console.error("Invalid new leader ID");
            return;
        }
        if (newLeaderId === session.user.id) {
            showToast('Escolha outra pessoa para assumir a lideranÃ§a.', 'warning');
            return;
        }

        const { error: promoteError } = await supabase
            .from('clan_members')
            .update({ role: 'leader' })
            .eq('clan_id', clan.id)
            .eq('user_id', newLeaderId);

        if (promoteError) {
            console.error("Error transferring leadership:", promoteError.message);
            showToast('NÃ£o foi possÃ­vel transferir a lideranÃ§a.', 'error');
            return;
        }

        await leaveClan();
    };

    const deleteClan = async () => {
        if (!clan) return;
        const currentUserId = getSupabaseUserId();
        if (!currentUserId) return;
        if (getCurrentClanRole() !== 'leader') {
            showToast('SÃ³ a lideranÃ§a pode apagar o grupo.', 'warning');
            return;
        }
        if (enrichedClanMembers.length > 1) {
            showToast('Para apagar o grupo, primeiro ele precisa ficar sÃ³ com vocÃª.', 'warning');
            return;
        }

        await Promise.all([
            deleteClanScopedRows('clan_mission_participants', clan.id),
            deleteClanScopedRows('clan_mission_progress', clan.id),
            deleteClanScopedRows('clan_join_requests', clan.id),
            deleteClanScopedRows('clan_aldeia_slots', clan.id),
            deleteClanScopedRows('clan_aldeia_presence', clan.id),
            deleteClanScopedRows('clan_custom_quests', clan.id),
            deleteClanScopedRows('sanctuary_positions', clan.id),
            deleteClanScopedRows('sanctuary_area_stats', clan.id),
        ]);

        const { error: memberCleanupError } = await supabase
            .from('clan_members')
            .delete()
            .eq('clan_id', clan.id);

        if (memberCleanupError) {
            console.error("Error deleting clan members before clan delete:", memberCleanupError.message);
        }

        const { data: deletedClanRows, error: deleteError } = await supabase
            .from('clans')
            .delete()
            .eq('id', clan.id)
            .select('id');

        if (deleteError) {
            console.error("Error deleting clan:", deleteError.message);
            showToast('NÃ£o foi possÃ­vel apagar o grupo agora.', 'error');
            await refreshClanMembershipState(currentUserId);
            return;
        }

        if (!deletedClanRows || deletedClanRows.length === 0) {
            showToast('A dissoluÃ§Ã£o do grupo nÃ£o foi confirmada.', 'warning');
            await refreshClanMembershipState(currentUserId);
            return;
        }

        if (clanCacheRef.current && clanCacheRef.current.clanId === clan.id) {
            clanCacheRef.current.timestamp = 0;
        }

        clearClanRuntimeState();
        await loadClanJoinRequestsOutgoing(currentUserId);
        showToast('Grupo apagado com sucesso.', 'success');
    };

    const kickClanMember = async (memberId: string) => {
        if (!clan) return;
        const currentUserId = getSupabaseUserId();
        if (!currentUserId) return;
        if (getCurrentClanRole() !== 'leader') {
            showToast('SÃ³ a lideranÃ§a pode remover pessoas.', 'warning');
            return;
        }
        if (!isUuid(memberId)) {
            console.error("Invalid member ID for kicking");
            return;
        }
        if (memberId === currentUserId) {
            showToast('Use a saÃ­da do grupo para vocÃª mesmo.', 'info');
            return;
        }
        const targetMember = enrichedClanMembers.find((member) => member.id === memberId);
        if (!targetMember) {
            showToast('Essa pessoa jÃ¡ nÃ£o estÃ¡ mais no grupo.', 'info');
            return;
        }
        if (targetMember.role === 'leader') {
            showToast('A lideranÃ§a nÃ£o pode ser removida por esse atalho.', 'warning');
            return;
        }

        const { data: participantRows, error: participantSelectError } = await supabase
            .from('clan_mission_participants')
            .select('mission_id')
            .eq('clan_id', clan.id)
            .eq('user_id', memberId);
        if (participantSelectError) {
            console.error("Error loading member clan mission participations:", participantSelectError.message);
        }

        const { error: participantDeleteError } = await supabase
            .from('clan_mission_participants')
            .delete()
            .eq('clan_id', clan.id)
            .eq('user_id', memberId);
        if (participantDeleteError) {
            console.error("Error clearing member clan mission participations:", participantDeleteError.message);
        }

        const { error } = await supabase.from('clan_members').delete().eq('user_id', memberId).eq('clan_id', clan.id);
        if (error) { console.error("Error kicking member:", error.message); showToast('NÃ£o foi possÃ­vel remover essa pessoa.', 'error'); return; }
        setEnrichedClanMembers(prev => prev.filter(m => m.id !== memberId));
        if (participantRows?.length) {
            const affectedMissionIds = participantRows
                .map((row: any) => String(row.mission_id || ''))
                .filter(Boolean);
            if (affectedMissionIds.length > 0) {
                setClanQuestParticipants(prev => {
                    const next = { ...prev };
                    affectedMissionIds.forEach((missionId) => {
                        next[missionId] = Math.max(0, (next[missionId] || 0) - 1);
                    });
                    return next;
                });
            }
        }

        // Update cache
        if (clanCacheRef.current && clanCacheRef.current.clanId === clan.id) {
            clanCacheRef.current.members = clanCacheRef.current.members.filter(m => m.id !== memberId);
        }
        showToast('Pessoa removida do grupo.', 'success');
    };

    const addClanMember = async (memberId: string) => {
        console.warn('Direct clan member insertion blocked. Member must request to join.', memberId);
        showToast('A entrada no grupo so acontece por solicitacao aprovada.', 'warning');
        return;
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
            alert(`O grupo atingiu o limite maximo de ${MAX_CLAN_MEMBERS} pessoas.`);
            return;
        }

        const { error } = await supabase.from('clan_members').insert({ user_id: memberId, clan_id: clan.id, role: 'member' });
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
            setClanJoinRequestsOutgoing(prev => [...prev, { ...mapped, clanProfile: clanToJoin }]);
            window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
        }
    };

    const joinClan = async (clanToJoin: Clan) => {
        if (clan) {
            showToast('Voce ja esta em um grupo.', 'info');
            return;
        }

        const userId = getSupabaseUserId();
        if (!userId) {
            console.error("User ID not found");
            return;
        }
        if (joinClanInFlightRef.current.size > 0) return;

        joinClanInFlightRef.current.add(clanToJoin.id);

        try {
            const { data: freshClanRow, error: freshClanError } = await supabase
                .from('clans')
                .select('id, recruitment_status')
                .eq('id', clanToJoin.id)
                .single();

            if (freshClanError) {
                console.error("Error checking clan recruitment status:", freshClanError.message);
                showToast('Nao foi possivel verificar a entrada desse grupo.', 'error');
                return;
            }

            const recruitmentStatus = String(
                (freshClanRow as any)?.recruitment_status
                ?? (clanToJoin as any).recruitment_status
                ?? (clanToJoin as any).recruitmentStatus
                ?? ''
            )
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim()
                .toLowerCase();
            if (recruitmentStatus === 'privado') {
                await requestClanJoin(clanToJoin);
                showToast('Solicitacao enviada. Agora o lider precisa aprovar sua entrada.', 'success');
                return;
            }

            const { data: existingMembershipRows, error: existingMembershipError } = await supabase
                .from('clan_members')
                .select('id, clan_id, joined_at')
                .eq('user_id', userId)
                .order('joined_at', { ascending: true });

            if (existingMembershipError) {
                console.error("Error checking existing clan membership:", existingMembershipError.message);
                showToast('Nao foi possivel verificar seu grupo atual.', 'error');
                return;
            }

            const existingMembership = Array.isArray(existingMembershipRows) ? existingMembershipRows[0] : null;
            if (existingMembership?.clan_id) {
                await refreshClanMembershipState(userId);
                if (String(existingMembership.clan_id) === clanToJoin.id) {
                    showToast(`Voce ja entrou em ${clanToJoin.name}.`, 'info');
                } else {
                    showToast('Voce ja participa de um grupo.', 'info');
                }
                return;
            }

            const { data: clanMembersData, error: clanMembersError } = await supabase
                .from('clan_members')
                .select('user_id')
                .eq('clan_id', clanToJoin.id);

            if (clanMembersError) {
                console.error("Error checking clan size:", clanMembersError.message);
                showToast('Nao foi possivel verificar o tamanho do grupo.', 'error');
                return;
            }

            const memberCount = new Set((clanMembersData ?? []).map((member: any) => String(member.user_id))).size;
            if (memberCount >= MAX_CLAN_MEMBERS) {
                alert(`Este grupo atingiu o limite maximo de ${MAX_CLAN_MEMBERS} pessoas.`);
                return;
            }

            const { error: joinError } = await supabase
                .from('clan_members')
                .insert({ user_id: userId, clan_id: clanToJoin.id, role: 'member' });

            if (joinError) {
                console.error("Error joining clan:", joinError.message);
                await refreshClanMembershipState(userId);
                showToast('Nao foi possivel entrar no grupo agora.', 'error');
                return;
            }

            clanCacheRef.current = null;
            setClan(clanToJoin);
            setEnrichedClanMembers([
                {
                    ...userProfile,
                    clanName: clanToJoin.name,
                    clanIcon: clanToJoin.icon,
                    role: 'member',
                    joined_at: new Date().toISOString(),
                } as EnrichedClanMember,
            ]);

            updateUserProfile({
                clanName: clanToJoin.name,
                clanIcon: clanToJoin.icon,
            });

            await supabase
                .from('clan_join_requests')
                .delete()
                .eq('clan_id', clanToJoin.id)
                .eq('user_id', userId)
                .eq('status', 'pending');

            setClanJoinRequestsOutgoing(prev => prev.filter(request => request.clanId !== clanToJoin.id));
            showToast(`Voce entrou em ${clanToJoin.name}.`, 'success');
            window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            await loadClanAndMembers(clanToJoin.id, true);
        } finally {
            joinClanInFlightRef.current.delete(clanToJoin.id);
        }
    };

    const approveClanJoinRequest = async (request: ClanJoinRequest) => {
        if (!clan || request.clanId !== clan.id) return;

        const { data: clanMembersData, error: clanMembersError } = await supabase
            .from('clan_members')
            .select('user_id')
            .eq('clan_id', clan.id);

        if (clanMembersError) { console.error("Error checking clan size:", clanMembersError.message); return; }
        const memberCount = new Set((clanMembersData ?? []).map((member: any) => String(member.user_id))).size;
        if (memberCount >= MAX_CLAN_MEMBERS) {
            alert(`O grupo atingiu o limite maximo de ${MAX_CLAN_MEMBERS} pessoas.`);
            return;
        }

        const { data: existingMembershipRows, error: existingMembershipError } = await supabase
            .from('clan_members')
            .select('id, clan_id, joined_at')
            .eq('user_id', request.userId)
            .order('joined_at', { ascending: true });
        if (existingMembershipError) { console.error("Error checking member before approval:", existingMembershipError.message); return; }

        const existingMembership = Array.isArray(existingMembershipRows) ? existingMembershipRows[0] : null;
        if (existingMembership?.clan_id) {
            await loadClanJoinRequestsIncoming(clan.id);
            if (String(existingMembership.clan_id) === clan.id) {
                showToast('Essa pessoa ja entrou no grupo.', 'info');
            } else {
                showToast('Essa pessoa ja participa de outro grupo.', 'warning');
            }
            return;
        }

        const { data: updatedRequestRows, error: updateError } = await supabase
            .from('clan_join_requests')
            .update({ status: 'approved', responded_at: new Date().toISOString() })
            .eq('id', request.id)
            .select('id');
        if (updateError || !updatedRequestRows || updatedRequestRows.length === 0) { console.error("Error approving clan join request:", updateError?.message || 'No request row updated'); return; }

        const { error: insertError } = await supabase.from('clan_members').insert({ user_id: request.userId, clan_id: clan.id, role: 'member' });
        if (insertError) { console.error("Error adding member from request:", insertError.message); return; }

        await SupabaseService.createNotification(
            request.userId,
            'clan_response',
            `${clan.name} aprovou sua entrada no grupo.`,
            { clanId: clan.id, clanName: clan.name, requestId: request.id },
        );

        // Invalidate cache before reloading to ensure new member is fetched
        if (clanCacheRef.current) clanCacheRef.current.timestamp = 0;

        await loadClanAndMembers(clan.id);
        await loadClanJoinRequestsIncoming(clan.id);
        showToast('Pedido aprovado.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
    };

    const rejectClanJoinRequest = async (request: ClanJoinRequest) => {
        if (!clan || request.clanId !== clan.id) return;
        const { data: rejectedRows, error } = await supabase
            .from('clan_join_requests')
            .update({ status: 'rejected', responded_at: new Date().toISOString() })
            .eq('id', request.id)
            .select('id');
        if (error || !rejectedRows || rejectedRows.length === 0) { console.error("Error rejecting clan join request:", error?.message || 'No request row updated'); return; }

        await SupabaseService.createNotification(
            request.userId,
            'clan_response',
            `${clan.name} recusou sua entrada no grupo.`,
            { clanId: clan.id, clanName: clan.name, requestId: request.id },
        );

        await loadClanJoinRequestsIncoming(clan.id);
        showToast('Pedido recusado.', 'success');
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
    };

    const legacyCancelClanJoinRequest = async (requestId: string): Promise<void> => {
        const userId = getSupabaseUserId();
        if (!userId) return;
        const existingRequest = clanJoinRequestsOutgoing.find((request) => request.id === requestId);
        if (!existingRequest) {
            showToast('Essa solicitaÃ§Ã£o jÃ¡ nÃ£o estÃ¡ mais pendente.', 'info');
            return;
        }

        setClanJoinRequestsOutgoing(prev => prev.filter(request => request.id !== requestId));

        const { error } = await supabase
            .from('clan_join_requests')
            .delete()
            .eq('id', requestId)
            .eq('user_id', userId)
            .eq('status', 'pending');

        if (error) {
            console.error("Error canceling clan join request:", error.message);
            setClanJoinRequestsOutgoing(prev => prev.some(request => request.id === requestId) ? prev : [...prev, existingRequest]);
            showToast('NÃ£o foi possÃ­vel cancelar a solicitaÃ§Ã£o ao grupo.', 'error');
            return;
        }

        showToast('SolicitaÃ§Ã£o ao grupo cancelada.', 'success');
        await loadClanJoinRequestsOutgoing(userId);
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
    };

    const cancelClanJoinRequest = async (requestId: string): Promise<void> => {
        const userId = getSupabaseUserId();
        if (!userId) return;
        const existingRequest = clanJoinRequestsOutgoing.find((request) => request.id === requestId);
        if (!existingRequest) {
            showToast('Essa solicitaÃ§Ã£o jÃ¡ nÃ£o estÃ¡ mais pendente.', 'info');
            await loadClanJoinRequestsOutgoing(userId);
            return;
        }

        setClanJoinRequestsOutgoing(prev => prev.filter(request => request.id !== requestId));

        const { error } = await supabase
            .from('clan_join_requests')
            .delete()
            .eq('id', requestId)
            .eq('user_id', userId)
            .eq('status', 'pending');

        if (error) {
            console.error("Error canceling clan join request:", error.message);
            setClanJoinRequestsOutgoing(prev => prev.some(request => request.id === requestId) ? prev : [...prev, existingRequest]);
            showToast('NÃ£o foi possÃ­vel cancelar a solicitaÃ§Ã£o ao grupo.', 'error');
            await loadClanJoinRequestsOutgoing(userId);
            return;
        }

        showToast('SolicitaÃ§Ã£o ao grupo cancelada.', 'success');
        await loadClanJoinRequestsOutgoing(userId);
        window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
    };

    const fetchBlockedUsers = useCallback(async (targetUserId?: string) => {
        const userId = targetUserId || session?.user.id;
        if (!userId) {
            setBlockedUsers([]);
            return;
        }

        const { data, error } = await supabase
            .from('user_blocks')
            .select('id, blocker_user_id, blocked_user_id, reason, created_at')
            .eq('blocker_user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            const message = String(error.message || '');
            if (message.includes('user_blocks')) {
                return;
            }
            console.error('Error fetching blocked users:', error);
            return;
        }

        setBlockedUsers(mapToCamelCase(data || []) as UserBlock[]);
    }, [session?.user.id]);

    const blockUser = async (blockedUserId: string, options?: { reason?: string | null }): Promise<boolean> => {
        const userId = session?.user.id;
        if (!userId) return false;
        if (!blockedUserId || blockedUserId === userId) {
            showToast('Nao e possivel bloquear este usuario.', 'warning');
            return false;
        }

        const payload = {
            blocker_user_id: userId,
            blocked_user_id: blockedUserId,
            reason: options?.reason?.trim() || null,
        };

        const { error } = await supabase
            .from('user_blocks')
            .upsert(payload, { onConflict: 'blocker_user_id,blocked_user_id' });

        if (error) {
            console.error('Error blocking user:', error);
            showToast('Nao foi possivel bloquear este usuario.', 'error');
            return false;
        }

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('type', 'direct_message')
            .contains('metadata', { senderId: blockedUserId });

        setNotifications(prev => prev.map(notification => (
            notification.userId === userId
            && notification.type === 'direct_message'
            && String(notification.metadata?.senderId || '') === blockedUserId
                ? { ...notification, read: true }
                : notification
        )));

        await fetchBlockedUsers(userId);
        await fetchDMs(userId);
        showToast('Usuario bloqueado.', 'success');
        return true;
    };

    const unblockUser = async (blockedUserId: string): Promise<boolean> => {
        const userId = session?.user.id;
        if (!userId) return false;

        const { error } = await supabase
            .from('user_blocks')
            .delete()
            .eq('blocker_user_id', userId)
            .eq('blocked_user_id', blockedUserId);

        if (error) {
            console.error('Error unblocking user:', error);
            showToast('Nao foi possivel desbloquear este usuario.', 'error');
            return false;
        }

        await fetchBlockedUsers(userId);
        await fetchDMs(userId);
        showToast('Usuario desbloqueado.', 'success');
        return true;
    };

    const submitModerationReport = async (input: ModerationReportInput): Promise<boolean> => {
        const userId = session?.user.id;
        if (!userId) return false;

        const payload = {
            reporter_user_id: userId,
            target_user_id: input.targetUserId || null,
            target_kind: input.targetKind,
            channel_kind: input.channelKind,
            target_id: input.targetId || null,
            reason: input.reason,
            details: input.details?.trim() || null,
            metadata: input.metadata || {},
        };

        const { error } = await supabase
            .from('moderation_reports')
            .insert(payload);

        if (error) {
            const message = String(error.message || '');
            console.error('Error submitting moderation report:', error);
            if (message.includes('moderation_reports')) {
                showToast('O canal de denuncia ainda nao foi publicado no banco.', 'warning');
                return false;
            }
            showToast('Nao foi possivel enviar a denuncia.', 'error');
            return false;
        }

        showToast('Denuncia enviada para revisao.', 'success');
        return true;
    };

    const fetchDMs = useCallback(async (targetUserId?: string) => {
        const userId = targetUserId || session?.user.id;
        if (!userId) return;
        const blockedSet = new Set(blockedUserIds);

        const { data, error } = await supabase
            .from('direct_messages')
            .select(`
        id,
        sender_id,
        recipient_id,
        content,
        read,
        created_at,
        sender_profile:user_profiles!direct_messages_sender_id_fkey(id,nickname,avatar_url,level,is_premium,is_online,role)
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
            const otherId = msg.senderId === userId ?msg.recipientId : msg.senderId;
            const isBlockedConversation = blockedSet.has(otherId);
            if (!convsMap.has(otherId)) {
                // Find profile for this conversation
                let profile = msg.senderId === otherId ?msg.senderProfile : undefined;
                // If profile not in message (sent by us), we might need to fetch it or find it in friends
                if (!profile) {
                    const friend = friendsRef.current.find(f => f.id === otherId);
                    if (friend) profile = friend;
                }

                if (profile) {
                    convsMap.set(otherId, {
                        participantId: otherId,
                        profile,
                        lastMessage: msg,
                        unreadCount: !isBlockedConversation && msg.recipientId === userId && !msg.read ?1 : 0,
                        isBlocked: isBlockedConversation,
                    });
                }
            } else if (!isBlockedConversation && msg.recipientId === userId && !msg.read) {
                const conv = convsMap.get(otherId)!;
                conv.unreadCount += 1;
            }
        });
        setDMConversations(Array.from(convsMap.values()));
    }, [blockedUserIds, session?.user.id]);

    const sendDirectMessage = async (recipientId: string, content: string) => {
        const userId = session?.user.id;
        if (!userId) return;
        if (blockedUserIds.includes(recipientId)) {
            showToast('Desbloqueie este usuario para voltar a enviar mensagens.', 'warning');
            return;
        }

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
            const message = String(error.message || '');
            if (message.includes('DIRECT_MESSAGE_BLOCKED')) {
                showToast('Essa conversa esta bloqueada.', 'warning');
                return;
            }
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
            msg.senderId === senderId && msg.recipientId === userId ?{ ...msg, read: true } : msg
        ));

        setDMConversations(prev => prev.map(c =>
            c.participantId === senderId ?{ ...c, unreadCount: 0 } : c
        ));

        const { error: notificationError } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('type', 'direct_message')
            .eq('read', false)
            .contains('metadata', { senderId });

        if (notificationError) {
            console.error('Error marking DM notifications as read:', notificationError);
        } else {
            setNotifications(prev => prev.map(notification => (
                notification.userId === userId
                && notification.type === 'direct_message'
                && !notification.read
                && String(notification.metadata?.senderId || '') === senderId
                    ? { ...notification, read: true }
                    : notification
            )));
        }
    };

    useEffect(() => {
        const userId = session?.user.id;
        if (!userId) {
            setBlockedUsers([]);
            return;
        }

        void fetchBlockedUsers(userId);
    }, [fetchBlockedUsers, session?.user.id]);

    useEffect(() => {
        const userId = session?.user.id;
        if (userId) {
            void fetchDMs(userId);

            // Subscribe to new DMs
            const dmSubscription = supabase
                .channel(`direct_messages_realtime_${userId}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `recipient_id=eq.${userId}`
                }, () => {
                    if (dmRefreshTimeoutRef.current !== null) return;
                    dmRefreshTimeoutRef.current = window.setTimeout(() => {
                        dmRefreshTimeoutRef.current = null;
                        void fetchDMs(userId);
                    }, 250);
                })
                .subscribe();

            return () => {
                if (dmRefreshTimeoutRef.current !== null) {
                    window.clearTimeout(dmRefreshTimeoutRef.current);
                    dmRefreshTimeoutRef.current = null;
                }
                dmSubscription.unsubscribe();
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
                setSeasons(prev => [...prev.map(s => ({ ...s, is_active: false })), newSeason]);
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
                    newSeasons = newSeasons.map(s => s.id === updatedSeason.id ?s : { ...s, is_active: false });
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
        // PVP Logic Removed per user request
        /*
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
                        icon: "?",
                        priority: 'alta'
                    });
     
                    if (newArena) {
                        const actionsToCreate = Array.from({ length: 15 }, (_, i) => ({
                            name: "Correr 1km",
                            description: `Km ${i + 1} de 15`,
                            arenaId: newArena.id,
                            icon: "?",
                            duration: 10,
                            repetitions: 1,
                            actionType: 'A\u00E7\u00E3o Recorrente' as any,
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
        */
    }, [isProfileLoaded, hasHydratedFromSupabase, assets.length]); // Check assets length to ensure they are loaded

    const cycleScopedTasks = useMemo(() => {
        if (!activeCycle) return tasks;
        return tasks.filter(task => task.date >= activeCycle.startDate && task.date <= activeCycle.endDate);
    }, [activeCycle, tasks]);

    const taskPool = useMemo(() => {
        const activeArenas = allArenas.filter(arena => !arena.isArchived);
        const lockedArenaIds = new Set<string>();
        const arenasById = Object.fromEntries(activeArenas.map(arena => [arena.id, arena]));
        const actionsByArena = Object.fromEntries(activeArenas.map(arena => [arena.id, actions.filter(action => action.arenaId === arena.id)]));

        campaigns.forEach(campaign => {
            if (campaign.status !== 'active') return;

            const arenaStates = getCampaignArenaStates({
                campaign,
                arenasById,
                actionsByArena,
                tasks: cycleScopedTasks,
                getClanQuestsForArena,
                getClanQuestProgress,
            });

            Object.entries(arenaStates).forEach(([arenaId, state]) => {
                if (state.isLocked) {
                    lockedArenaIds.add(arenaId);
                }
            });
        });

        const cycleArenaIds = activeCycle?.arenaIds?.length ?new Set(activeCycle.arenaIds) : null;
        const cycleScopedArenas = cycleArenaIds ?activeArenas.filter(arena => cycleArenaIds.has(arena.id)) : activeArenas;
        const availableArenas = cycleScopedArenas.length > 0 ?cycleScopedArenas : activeArenas;
        const activeArenaIds: Set<string> = new Set(availableArenas.map(arena => arena.id).filter(id => !lockedArenaIds.has(id)));

        return buildTaskPoolEntries(actions, activeArenaIds, isClanQuestActionId);
    }, [actions, allArenas, activeCycle?.arenaIds, campaigns, cycleScopedTasks, getClanQuestProgress, getClanQuestsForArena, isClanQuestActionId]);

    return (
        <GameContext.Provider value={{
            session,
            getSharedActionPoolProgress, isNewUser, assets, actions, arenaFolders, tasks, taskPool, checklistItems, sequenceItems, userProfile, friends, friendRequestsIncoming, friendRequestsOutgoing, clanJoinRequestsIncoming, clanJoinRequestsOutgoing, reports, nobilityRanks, clan, clanRanks, enrichedClanMembers, activeCycle, upcomingCycle, dailyCommitment, achievementUnlocked, seasons, seasonMissions, seasonQuests, clanQuestProgress, clanQuestParticipants, getClanQuestProgress, getClanQuestForActionName, getClanQuestsForArena, fetchClanQuestParticipants, levelUnlocks, setAchievementUnlocked, updateLevelUnlocks, grantUserUnlock, addCompletedMission, acceptSeasonQuest,
            abortSeasonQuest,
            claimSeasonQuest,
            claimSeasonMission,
            addProfileFlag, feed, addFeedEvent, getArenas, addArena, updateArena, getActionsForArena, addAction, ...taskDomain, clearPendingTasksForAction, updateAction, deleteAction, deleteArena, toggleChecklistItem, addChecklistItem, updateChecklistItem, deleteChecklistItem, addSequenceItem, updateSequenceItem, markSequenceItemToday, adjustSequenceItemDays, resetSequenceItem, deleteSequenceItem, updateUserProfile, addFriend, searchPlayers, sendFriendRequest, acceptFriendRequest, declineFriendRequest, cancelFriendRequest, setCurrentSkin, updateAllAssetLevels, startCycle, updateCycle, endCycle, startNewCycle, updateMood, getAssetForAction, getActionBackgroundStyle, setDailyCommitment, updateOperationalScratch, lockDailyCommitment, unlockDailyCommitment, endDailyBattle, resetDailyCommitment, manualCloseSITREP, openChest, applyExp, addChest, createClan, updateClan, leaveClan, transferLeadershipAndLeave, deleteClan, kickClanMember, addClanMember, searchClans, joinClan, approveClanJoinRequest, rejectClanJoinRequest, cancelClanJoinRequest,
            directMessages, dmConversations, blockedUsers, blockedUserIds, sendDirectMessage, markDMAsRead, fetchDMs, blockUser, unblockUser, submitModerationReport,
            addSeason, updateSeason, addSeasonMission, saveSanctuaryPosition, getSanctuaryPositionsForClan, getSanctuaryAreaStats, updateSanctuaryAreaTime, applySanctuaryAreaDecay, loadClanAndMembers, userMissionParticipations, joinClanMission, updateClanMissionProgress, leaveClanMission, activateClanQuest, updateCustomClanMissionProgress, appMode, isProfileLoaded, setAppMode, activeTheme, toggleTheme, createArenaFolder, updateArenaFolder, deleteArenaFolder, moveArenaToFolder, reorderArena, reorderArenaPriority, reorderEntity, reorderEntityPriority, arenasViewMode, setArenasViewMode, reorderAction, getUserPublicData, oraclePreferences, updateOraclePreferences, oracleMessages, markOracleMessageAsRead, refreshOracleMessages, triggerOracle, inventory, buyGoldPack, buyStoreItem, recycleItem, craftItem, equipItem, toggleEquipItem, showToast, toast, hideToast, notifications, markNotificationRead, deleteNotification, fetchNotifications, cycleExpBonus, cycleProgress, getAldeiaSlots, updateAldeiaSlot, getAldeiaPresence, enterAldeiaSlot, performAldeiaDailyUpdate, campaigns, addCampaign, updateCampaign, deleteCampaign, installPrompt, promptInstall, codexCatalog, userCodexes, refreshCodexes, buyCodex, buyCodexCreationSlot, getRelationshipCapacitySummary, fetchRelationshipHubData, createRelationshipInvite, respondToRelationshipInvite, endRelationshipLink, buyRelationshipCapacitySlot, createLinkedRelationshipArena, shareRelationshipArena, removeRelationshipArenaShare, createCompetitionChallenge, createCodexShareLink, sendCodexToNickname, getCodexSharePreview, claimCodexShare, installCodex, deleteUserCodex, transferUserCodex, duplicateUserCodexToRecipient, createMentorCodexForRecipient,
            getOrCreateOfficeArena, cleanupEmptyOfficeArena, setArenaAsShared,
            aldeiaSlots, aldeiaPresence, loadAldeiaData, setAldeiaSlots, setAldeiaPresence
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    // Optional usage of CodexBuilder, handle gracefully if not present
    // This avoids the "must be used within a CodexBuilderProvider" error when GameContext is used outside of it (e.g. Tutorial)
    let builder = { isBuilderMode: false, gameOverrides: {} };
    try {
        builder = useCodexBuilder();
    } catch (e) {
        // Ignore if not in builder context
    }

    if (context === undefined) throw new Error('useGame must be used within a GameProvider');

    if (!builder.isBuilderMode) return context;
    return { ...context, ...builder.gameOverrides };
};


