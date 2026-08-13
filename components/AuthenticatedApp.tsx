import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { GlobalHeader } from './GlobalHeader';
import { AssetIcon, ArenaIcon, ConfigIcon, PlannerIcon, SocialIcon, XIcon } from './Icons';
import { supabase } from '../supabaseClient';
import { GameProvider, PROFILE_FLAG_TERMS_ACCEPTED, PROFILE_FLAG_TERMS_PENDING, PROFILE_FLAG_TUTORIAL_COMPLETED, useGame } from '../contexts/GameContext';
import { CodexBuilderProvider, useCodexBuilder } from '../contexts/CodexBuilderContext';
import { TutorialProvider, useTutorial } from '../contexts/TutorialContext';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { updateInstalledAppBadge } from '../utils/appBadge';
import { buildPremiumRewardsToast } from '../utils/premiumRewards';
import { buildVanguardRewardsToast } from '../utils/vanguardRewards';
import { getUnreadBadgeCount } from '../constants/oracleNotificationPolicy';
import { APP_SENSORY_CUE_EVENT, type AppSensoryCuePayload } from '../utils/sensoryCue';
import {
    LEGAL_ACCEPT_SOURCE_INITIAL,
    LEGAL_ACCEPT_SOURCE_REVIEW,
    LEGAL_PRIVACY_VERSION,
    LEGAL_TERMS_VERSION,
} from '../constants/legal';
import {
    buildOnboardingCompletePatch,
    buildOnboardingDismissPatch,
    buildOnboardingStartPatch,
    shouldAutoStartOnboarding,
} from '../utils/firstUseOnboarding';
import { getAppPushPermission, requestAppPushPermission } from '../utils/pushRuntime';
import { APP_NAVIGATE_EVENT, AppNavigatePayload } from '../utils/arenaAttention';
import {
    getSeasonLaunchToastStorageKey,
    getSeasonTransitionSeenFlag,
    getSeasonTransitionStorageKey,
    resolveRuntimeSeasonTransition,
} from '../utils/seasonPresentation';
import { getActiveSubscriptionTier, getDiscountedPremiumPrice, getPremiumDaysRemaining, hasPremiumAccess } from '../utils/premiumAccess';
import { buildUiSkinTokens, resolveUiSkinId } from '../utils/uiSkinTokens';
import { getGoldMembershipProductByTier, GOLD_PREMIUM_PRODUCT } from '../constants/goldCatalog';
import {
    SCREEN_INTRO_TIP_CONTEXT_EVENT,
    SCREEN_INTRO_TIPS_SETTINGS_CHANGED_EVENT,
    areScreenIntroTipsEnabled,
    hasScreenIntroTip,
    hasSeenScreenIntroTip,
    markScreenIntroTipSeen,
    setScreenIntroTipsEnabled,
    SCREEN_INTRO_TIPS_DISABLED_FLAG,
    getScreenIntroTipSeenFlag,
    type ScreenIntroTipId,
} from '../utils/screenIntroTips';
import { ConfirmationModal } from './ConfirmationModal';
import { DailyCompletionPromptModal } from './DailyCompletionPromptModal';
import type { AppBroadcast } from './AppBroadcastModal';
import { DAILY_COMPLETION_PROMPT_EVENT, DailyCompletionPromptPayload } from '../utils/dailyCompletionPrompt';
import { PLANNER_OPEN_ACTION_MODAL_EVENT, REST_SCREEN_ACTION_VIEW_REQUEST_EVENT, RestScreenActionViewRequestDetail } from '../utils/restScreenActionSession';
import { ORACLE_SPEECH_EVENT, emitOracleSpeech, type OracleSpeechPayload } from '../utils/oracleSpeech';
import { getOracleSpeakerToneTokens, OracleSpeakerMark, type OracleSpeakerTone } from './OracleSpeakerMark';
import { buildOracleOperationalContext } from '../utils/oracleOperationalContext';
import {
    buildPlannerCoachSpeech,
    getOracleCoachDailyLimit,
    shouldShowPlannerCoach,
} from '../utils/oracleCoach';
import { getOperationalDateString, taskMatchesOperationalDate } from '../utils/operationalDay.js';
import './auth-shell.css';

const AssetsView = React.lazy(() => import('../views/AssetsView').then((m) => ({ default: m.AssetsView })));
const ArenasView = React.lazy(() => import('../views/ArenasView').then((m) => ({ default: m.ArenasView })));
const PlannerView = React.lazy(() => import('../views/PlannerView').then((m) => ({ default: m.PlannerView })));
const MundoView = React.lazy(() => import('../views/MundoView'));
const SettingsView = React.lazy(() => import('../views/SettingsView').then((m) => ({ default: m.SettingsView })));
const ProfileView = React.lazy(() => import('../views/ProfileView').then((m) => ({ default: m.ProfileView })));
const ReportsView = React.lazy(() => import('../views/ReportsView').then((m) => ({ default: m.ReportsView })));
const OracleTutorialOverlay = React.lazy(() => import('./OracleTutorialOverlay').then((m) => ({ default: m.OracleTutorialOverlay })));
const AchievementModal = React.lazy(() => import('./AchievementModal').then((m) => ({ default: m.AchievementModal })));
const GoldenToast = React.lazy(() => import('./GoldenToast').then((m) => ({ default: m.GoldenToast })));
const TermsOverlay = React.lazy(() => import('./AppRuntimeOverlays').then((m) => ({ default: m.TermsOverlay })));
const OfflineOverlay = React.lazy(() => import('./AppRuntimeOverlays').then((m) => ({ default: m.OfflineOverlay })));
const FirstUseOnboardingOverlay = React.lazy(() => import('./FirstUseOnboardingOverlay').then((m) => ({ default: m.FirstUseOnboardingOverlay })));
const CodexClaimModal = React.lazy(() => import('./CodexClaimModal').then((m) => ({ default: m.CodexClaimModal })));
const RewardPackModal = React.lazy(() => import('./RewardPackModal').then((m) => ({ default: m.RewardPackModal })));
const VanguardWelcomeModal = React.lazy(() => import('./VanguardWelcomeModal').then((m) => ({ default: m.VanguardWelcomeModal })));
const SeasonTransitionModal = React.lazy(() => import('./SeasonDetailModal').then((m) => ({ default: m.SeasonTransitionModal })));
const ScreenIntroTipOverlay = React.lazy(() => import('./ScreenIntroTipOverlay').then((m) => ({ default: m.ScreenIntroTipOverlay })));
const RewardVideoPreviewModal = React.lazy(() => import('./RewardVideoPreviewModal').then((m) => ({ default: m.RewardVideoPreviewModal })));
const AppBroadcastModal = React.lazy(() => import('./AppBroadcastModal').then((m) => ({ default: m.AppBroadcastModal })));

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

type View = 'assets' | 'arenas' | 'planner' | 'social' | 'settings' | 'reports';

const APP_VERSION = '1.0.48';
const APP_BROADCAST_SEEN_FLAG_PREFIX = 'app_broadcast_seen:';
const PLANNER_ORACLE_LAST_OPEN_PREFIX = 'planner_oracle_last_open:';
const PLANNER_ORACLE_LAST_SPEECH_PREFIX = 'planner_oracle_last_speech:';
const ORACLE_SPEECH_TYPING_INTERVAL_MS = 22;

const parseLocalDateOnly = (dateString?: string | null): Date | null => {
    if (!dateString) return null;
    const [year, month, day] = dateString.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const diffLocalDays = (fromDateString?: string | null, toDateString?: string | null): number | null => {
    const from = parseLocalDateOnly(fromDateString);
    const to = parseLocalDateOnly(toDateString || new Date().toISOString().slice(0, 10));
    if (!from || !to) return null;
    return Math.round((to.getTime() - from.getTime()) / 86400000);
};

const OracleSpeechOverlay: React.FC = () => {
    const { oraclePreferences, userProfile } = useGame();
    const [speech, setSpeech] = useState<(OracleSpeechPayload & { id: number }) | null>(null);
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        const handleSpeech = (event: Event) => {
            const detail = (event as CustomEvent<OracleSpeechPayload>).detail;
            if (!detail?.message?.trim()) return;

            const presenceLevel = oraclePreferences?.presenceLevel ?? 1;
            if (presenceLevel <= 0) return;

            const today = getOperationalDateString(new Date());
            const storageKey = `oracle_speech_daily:${userProfile.id}:${today}`;
            const spokenToday = Number.parseInt(localStorage.getItem(storageKey) || '0', 10) || 0;
            const dailyLimit = getOracleCoachDailyLimit(presenceLevel);
            if (spokenToday >= dailyLimit) return;

            localStorage.setItem(storageKey, String(spokenToday + 1));
            setSpeech({ ...detail, id: Date.now() });
        };

        window.addEventListener(ORACLE_SPEECH_EVENT, handleSpeech as EventListener);
        return () => window.removeEventListener(ORACLE_SPEECH_EVENT, handleSpeech as EventListener);
    }, [oraclePreferences?.presenceLevel, userProfile.id]);

    useEffect(() => {
        if (!speech) return;

        const fullText = speech.message;
        setDisplayedText('');
        let index = 0;
        const typingTimer = window.setInterval(() => {
            index += 1;
            setDisplayedText(fullText.slice(0, index));
            if (index >= fullText.length) window.clearInterval(typingTimer);
        }, ORACLE_SPEECH_TYPING_INTERVAL_MS);

        const readableDurationMs = fullText.length * ORACLE_SPEECH_TYPING_INTERVAL_MS + 2400;
        const closeTimer = window.setTimeout(() => {
            setSpeech((current) => current?.id === speech.id ? null : current);
        }, Math.max(speech.durationMs ?? 5200, readableDurationMs));

        return () => {
            window.clearInterval(typingTimer);
            window.clearTimeout(closeTimer);
        };
    }, [speech]);

    if (!speech) return null;

    const tone: OracleSpeakerTone = speech.tone || 'neutral';
    const toneTokens = getOracleSpeakerToneTokens(tone);
    const isTyping = displayedText.length < speech.message.length;

    return (
        <div className="pointer-events-none fixed inset-x-0 top-[calc(10px+var(--safe-area-top))] z-[10004] flex justify-center px-4">
            <div
                className="pointer-events-none relative flex w-full max-w-[22rem] gap-2 overflow-hidden rounded-[16px] border bg-[linear-gradient(180deg,rgba(20,17,13,0.96),rgba(7,7,8,0.98))] p-2.5 pl-[4.65rem] shadow-[0_12px_38px_rgba(0,0,0,0.38)] backdrop-blur-xl animate-in fade-in slide-in-from-top-3 duration-300"
                style={{
                    borderColor: toneTokens.border,
                    boxShadow: `0 12px 38px rgba(0,0,0,0.38), 0 0 20px ${toneTokens.glow}`,
                }}
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-10" style={{ background: `radial-gradient(circle at top, ${toneTokens.coreSoft}, transparent 72%)` }} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${toneTokens.border}, transparent)` }} />
                <OracleSpeakerMark tone={tone} size="sm" className="absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                    type="button"
                    onClick={() => setSpeech(null)}
                    className="pointer-events-auto absolute right-2.5 top-2 rounded-full border border-white/8 bg-white/[0.04] p-1 text-white/45 transition-colors hover:text-white"
                    aria-label="Fechar fala do Oraculo"
                >
                    <XIcon className="h-3 w-3" />
                </button>
                <div className="relative z-10 min-w-0 flex-1 pr-6">
                    <div className="text-[8px] font-black uppercase tracking-[0.16em]" style={{ color: toneTokens.core }}>
                        {speech.title || 'Oraculo'}
                    </div>
                    <p className="mt-1 min-h-[1.35rem] max-h-[2.8rem] overflow-hidden whitespace-pre-wrap text-[11px] font-semibold leading-snug text-white/86">
                        {displayedText}
                        {isTyping && <span className="ml-1 inline-block h-3 w-1 animate-pulse align-middle opacity-80" style={{ background: toneTokens.core }} />}
                    </p>
                </div>
            </div>
        </div>
    );
};

type AppBroadcastRow = {
    id: string;
    audience: 'all' | 'game' | 'basic' | 'beta';
    priority: number;
    eyebrow: string | null;
    title: string;
    summary: string;
    body: string | null;
    image_url: string | null;
    button_label: string | null;
    secondary_label: string | null;
    cta_type: 'none' | 'view' | 'url';
    cta_target: string | null;
    min_app_version: string | null;
    max_app_version: string | null;
    show_once: boolean;
    dismissible: boolean;
};

const compareVersions = (a: string, b: string) => {
    const left = a.split('.').map((part) => Number(part) || 0);
    const right = b.split('.').map((part) => Number(part) || 0);
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
        const delta = (left[index] || 0) - (right[index] || 0);
        if (delta !== 0) return delta;
    }
    return 0;
};

const isBroadcastCompatibleWithVersion = (row: AppBroadcastRow) => {
    if (row.min_app_version && compareVersions(APP_VERSION, row.min_app_version) < 0) return false;
    if (row.max_app_version && compareVersions(APP_VERSION, row.max_app_version) > 0) return false;
    return true;
};

const isBroadcastCompatibleWithMode = (row: AppBroadcastRow, appMode: string) => {
    if (row.audience === 'all' || row.audience === 'beta') return true;
    if (row.audience === 'basic') return appMode === 'BASIC';
    if (row.audience === 'game') return appMode !== 'BASIC';
    return false;
};

const mapBroadcastRow = (row: AppBroadcastRow): AppBroadcast => ({
    id: row.id,
    eyebrow: row.eyebrow,
    title: row.title,
    summary: row.summary,
    body: row.body,
    imageUrl: row.image_url,
    buttonLabel: row.button_label,
    secondaryLabel: row.secondary_label,
    ctaType: row.cta_type,
    ctaTarget: row.cta_target,
    dismissible: row.dismissible,
    showOnce: row.show_once,
});
type ViewTransitionKind = 'forward' | 'backward' | 'rest';

const CORE_NAV_VIEWS: View[] = ['assets', 'arenas', 'planner', 'social', 'settings'];

const getAvailableViews = (canUseAssetsView: boolean, isBuilderMode: boolean): View[] => {
    if (isBuilderMode) return ['arenas'];
    return CORE_NAV_VIEWS;
};

const getDefaultView = (canUseAssetsView: boolean, isBuilderMode: boolean): View => {
    if (isBuilderMode) return 'arenas';
    return 'assets';
};

const sanitizeView = (view: View | null | undefined, canUseAssetsView: boolean, isBuilderMode: boolean): View => {
    const availableViews = getAvailableViews(canUseAssetsView, isBuilderMode);
    if (view && availableViews.includes(view)) return view;
    return getDefaultView(canUseAssetsView, isBuilderMode);
};

const TutorialBridge: React.FC = () => null;
const GlobalSeasonTransitionGate: React.FC<{ enabled: boolean }> = ({ enabled }) => {
    const { seasons, showToast, userProfile, addProfileFlag } = useGame();
    const [pendingTransition, setPendingTransition] = useState<ReturnType<typeof resolveRuntimeSeasonTransition>>(null);

    useEffect(() => {
        if (!enabled) return;
        if (typeof window === 'undefined') return;
        if (pendingTransition) return;

        const runtimeTransition = resolveRuntimeSeasonTransition(seasons);
        if (!runtimeTransition) return;

        const seenFlag = getSeasonTransitionSeenFlag(runtimeTransition.toSeason.id);
        if ((userProfile.completedSeasonMissions || []).includes(seenFlag)) return;

        const storageKey = `${getSeasonTransitionStorageKey(
            runtimeTransition.fromSeason.id,
            runtimeTransition.toSeason.id,
        )}:${userProfile.id || 'anon'}`;

        if (window.localStorage.getItem(storageKey) === 'seen') return;

        setPendingTransition(runtimeTransition);
    }, [enabled, pendingTransition, seasons, userProfile.completedSeasonMissions, userProfile.id]);

    const handleClose = useCallback(() => {
        if (typeof window !== 'undefined' && pendingTransition) {
            const storageKey = `${getSeasonTransitionStorageKey(
                pendingTransition.fromSeason.id,
                pendingTransition.toSeason.id,
            )}:${userProfile.id || 'anon'}`;
            window.localStorage.setItem(storageKey, 'seen');

            const seenFlag = getSeasonTransitionSeenFlag(pendingTransition.toSeason.id);
            addProfileFlag(seenFlag);

            const toastKey = getSeasonLaunchToastStorageKey(pendingTransition.toSeason.id);
            const pendingToast = window.localStorage.getItem(toastKey);
            if (pendingToast) {
                window.localStorage.removeItem(toastKey);
                showToast(pendingToast, 'success');
            }
        }

        setPendingTransition(null);
    }, [addProfileFlag, pendingTransition, showToast, userProfile.id]);

    if (!pendingTransition) return null;

    return (
        <Suspense fallback={null}>
            <SeasonTransitionModal
                fromSeason={pendingTransition.fromSeason}
                toSeason={pendingTransition.toSeason}
                onClose={handleClose}
            />
        </Suspense>
    );
};

const AppWithTutorial: React.FC<{ defaultRestScreenOpen?: boolean; allowSeasonTransition?: boolean; suppressScreenIntroTips?: boolean }> = ({
    defaultRestScreenOpen = true,
    allowSeasonTransition = true,
    suppressScreenIntroTips = false,
}) => {
    const { isBuilderMode, draftName, setDraftName, exitBuilderMode, packDraftToJson } = useCodexBuilder();
    const { userProfile, appMode, activeTheme, notifications, showToast, assets, actions, tasks, activeCycle, dailyCommitment, cycleProgress, oraclePreferences, updateUserProfile } = useGame();
    const historyReady = useRef(false);

    const activeUIMode = appMode === 'GAME' ?'GAME' : 'BASIC';
    const effectiveUiSkin = resolveUiSkinId(activeUIMode === 'BASIC' ? 'BASIC' : (userProfile.skin || 'BASIC'));
    const canUseAssetsView = !isBuilderMode;
    const availableViews = useMemo(() => getAvailableViews(canUseAssetsView, isBuilderMode), [canUseAssetsView, isBuilderMode]);
    const [currentView, setCurrentView] = useState<View>(() => {
        if (isBuilderMode) return 'arenas';
        return defaultRestScreenOpen ? 'planner' : getDefaultView(canUseAssetsView, isBuilderMode);
    });
    const [isRestScreenVisible, setRestScreenVisible] = useState(defaultRestScreenOpen);
    const [viewTransitionKind, setViewTransitionKind] = useState<ViewTransitionKind>('rest');
    const [viewTransitionVersion, setViewTransitionVersion] = useState(0);
    const [isProfileVisible, setProfileVisible] = useState(false);
    const [isReportsVisible, setReportsVisible] = useState(false);
    const [dailyCompletionPrompt, setDailyCompletionPrompt] = useState<DailyCompletionPromptPayload | null>(null);
    const [pendingSitrepOpen, setPendingSitrepOpen] = useState(false);
    const [screenTipsEnabled, setScreenTipsEnabled] = useState(() => areScreenIntroTipsEnabled(userProfile.id, userProfile.completedSeasonMissions || []));
    const [activeScreenTipId, setActiveScreenTipId] = useState<ScreenIntroTipId | null>(null);
    const [screenIntroContextId, setScreenIntroContextId] = useState<ScreenIntroTipId | null>(null);
    const unreadNotificationsCount = getUnreadBadgeCount(notifications);
    const previousViewRef = useRef<View>(currentView);
    const previousRestVisibilityRef = useRef(isRestScreenVisible);
    const hasInitializedViewTransitionRef = useRef(false);

    useEffect(() => {
        void updateInstalledAppBadge(unreadNotificationsCount);
    }, [unreadNotificationsCount]);

    useEffect(() => {
        setScreenTipsEnabled(areScreenIntroTipsEnabled(userProfile.id, userProfile.completedSeasonMissions || []));
        setActiveScreenTipId(null);
        setScreenIntroContextId(null);
    }, [userProfile.completedSeasonMissions, userProfile.id]);

    useEffect(() => {
        setScreenIntroContextId(null);
    }, [currentView]);

    useEffect(() => {
        const handleSettingsChanged = (event: Event) => {
            const nextEnabled = (event as CustomEvent<{ enabled?: boolean }>).detail?.enabled;
            const resolvedEnabled = typeof nextEnabled === 'boolean'
                ? nextEnabled
                : areScreenIntroTipsEnabled(userProfile.id, userProfile.completedSeasonMissions || []);
            setScreenTipsEnabled(resolvedEnabled);
            if (!resolvedEnabled) setActiveScreenTipId(null);
        };

        window.addEventListener(SCREEN_INTRO_TIPS_SETTINGS_CHANGED_EVENT, handleSettingsChanged as EventListener);
        return () => window.removeEventListener(SCREEN_INTRO_TIPS_SETTINGS_CHANGED_EVENT, handleSettingsChanged as EventListener);
    }, [userProfile.completedSeasonMissions, userProfile.id]);

    useEffect(() => {
        const handleContextChanged = (event: Event) => {
            const detail = (event as CustomEvent<{ tipId?: string | null }>).detail || {};
            const nextTipId = typeof detail.tipId === 'string' && hasScreenIntroTip(detail.tipId)
                ? detail.tipId
                : null;
            setScreenIntroContextId(nextTipId);
        };

        window.addEventListener(SCREEN_INTRO_TIP_CONTEXT_EVENT, handleContextChanged as EventListener);
        return () => window.removeEventListener(SCREEN_INTRO_TIP_CONTEXT_EVENT, handleContextChanged as EventListener);
    }, []);

    useEffect(() => {
        const handleNavigateToStore = (event: Event) => {
            const detail = (event as CustomEvent<{ tab?: string; section?: string }>).detail || {};
            setCurrentView((prev) => {
                const nextView = sanitizeView('social', canUseAssetsView, isBuilderMode);
                return prev === nextView ?prev : nextView;
            });
            window.setTimeout(() => {
                window.dispatchEvent(new CustomEvent('mundo-tab-request', {
                    detail: {
                        tab: 'loja',
                        storeTab: detail.tab || 'store',
                        section: detail.section || null,
                    },
                }));
            }, 100);
        };
        window.addEventListener('navigate-to-store', handleNavigateToStore);
        return () => window.removeEventListener('navigate-to-store', handleNavigateToStore);
    }, [canUseAssetsView, isBuilderMode]);

    const navContainerRef = useRef<HTMLDivElement>(null);
    const navItemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const [navIndicatorStyle, setNavIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
    const touchStartRef = useRef<number | null>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const currentDeltaRef = useRef<number>(0);

    const updateNavIndicator = useCallback(() => {
        const currentRef = navItemRefs.current.get(currentView);
        if (!currentRef || !navContainerRef.current) return;
        const containerRect = navContainerRef.current.getBoundingClientRect();
        const itemRect = currentRef.getBoundingClientRect();
        const indicatorWidth = 32;
        const left = itemRect.left - containerRect.left + itemRect.width / 2 - indicatorWidth / 2;
        setNavIndicatorStyle({ left, width: indicatorWidth, opacity: 1 });
    }, [currentView]);

    useEffect(() => {
        const timer = window.setTimeout(updateNavIndicator, 50);
        window.addEventListener('resize', updateNavIndicator);
        return () => {
            window.removeEventListener('resize', updateNavIndicator);
            window.clearTimeout(timer);
        };
    }, [updateNavIndicator]);

    const handleNavTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientX;
        currentDeltaRef.current = 0;
        if (indicatorRef.current) indicatorRef.current.style.transition = 'none';
    };

    const handleNavTouchMove = (e: React.TouchEvent) => {
        if (touchStartRef.current === null || !indicatorRef.current) return;
        const diff = e.touches[0].clientX - touchStartRef.current;
        currentDeltaRef.current = diff;
        indicatorRef.current.style.transform = `translateX(${-diff}px)`;
    };

    const handleSetView = useCallback((view: View) => {
        setCurrentView((prev) => {
            const nextView = sanitizeView(view, canUseAssetsView, isBuilderMode);
            return prev === nextView ?prev : nextView;
        });
    }, [canUseAssetsView, isBuilderMode]);

    const handleNavTouchEnd = () => {
        if (touchStartRef.current === null) return;

        const diff = currentDeltaRef.current;
        const threshold = 40;

        if (indicatorRef.current) {
            indicatorRef.current.style.transition = '';
            indicatorRef.current.style.transform = '';
        }

        if (Math.abs(diff) > threshold) {
            const currentIndex = availableViews.indexOf(currentView);

            if (diff > 0 && currentIndex > 0) {
                handleSetView(availableViews[currentIndex - 1]);
            } else if (diff < 0 && currentIndex < availableViews.length - 1) {
                handleSetView(availableViews[currentIndex + 1]);
            }
        }
        touchStartRef.current = null;
        currentDeltaRef.current = 0;
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.altKey) return;
            switch (e.key) {
                case '1': handleSetView('assets'); break;
                case '2': handleSetView('arenas'); break;
                case '3': handleSetView('planner'); break;
                case '4': handleSetView('social'); break;
                case '5': handleSetView('settings'); break;
                case 'r':
                case 'R': setReportsVisible((prev) => !prev); break;
                case 'p':
                case 'P': setProfileVisible((prev) => !prev); break;
                case 's':
                case 'S':
                    window.dispatchEvent(new CustomEvent('openSitrep'));
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSetView]);

    useEffect(() => {
        const handleNavigate = (e: CustomEvent<{
            view: View;
            tab?: string;
            showReports?: boolean;
            showProfile?: boolean;
            showOracleSettings?: boolean;
            showRestScreen?: boolean;
            showArenaId?: string;
        }>) => {
            if (e.detail.showProfile !== undefined) {
                setProfileVisible(e.detail.showProfile);
            } else {
                setProfileVisible(false);
            }

            if (e.detail.showRestScreen !== undefined) {
                window.dispatchEvent(new CustomEvent('tutorialRestScreen', { detail: { open: e.detail.showRestScreen } }));
            } else {
                window.dispatchEvent(new CustomEvent('tutorialRestScreen', { detail: { open: false } }));
            }

            if (e.detail.showReports !== undefined) {
                setReportsVisible(e.detail.showReports);
            } else {
                setReportsVisible(false);
            }

            if (e.detail.showOracleSettings !== undefined) {
                window.dispatchEvent(new CustomEvent('tutorialOracleSettings', { detail: { open: e.detail.showOracleSettings } }));
            } else {
                window.dispatchEvent(new CustomEvent('tutorialOracleSettings', { detail: { open: false } }));
            }

            if (e.detail.showArenaId !== undefined) {
                window.dispatchEvent(new CustomEvent('tutorialOpenArena', { detail: { arenaId: e.detail.showArenaId } }));
            } else {
                window.dispatchEvent(new CustomEvent('tutorialOpenArena', { detail: { arenaId: null } }));
            }

            if (e.detail.view) {
                handleSetView(e.detail.view);
            }

            if (e.detail.tab) {
                window.setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('tutorialTabChange', { detail: { tab: e.detail.tab } }));
                }, 100);
            }
        };

        window.addEventListener('tutorialNavigate', handleNavigate as EventListener);
        return () => window.removeEventListener('tutorialNavigate', handleNavigate as EventListener);
    }, [handleSetView]);

    useEffect(() => {
        const handleAppNavigate = (event: Event) => {
            const customEvent = event as CustomEvent<AppNavigatePayload>;
            if (!customEvent.detail?.view) return;
            if (customEvent.detail.openSitrep) {
                setDailyCompletionPrompt(null);
                setPendingSitrepOpen(true);
                setRestScreenVisible(false);
                window.dispatchEvent(new CustomEvent('tutorialRestScreen', { detail: { open: false } }));
            }
            handleSetView(customEvent.detail.view);
        };

        window.addEventListener(APP_NAVIGATE_EVENT, handleAppNavigate);
        return () => window.removeEventListener(APP_NAVIGATE_EVENT, handleAppNavigate);
    }, [handleSetView]);

    useEffect(() => {
        const syncQueryNavigation = () => {
            const params = new URLSearchParams(window.location.search);
            const requestedView = params.get('view');
            const requestedReports = params.get('reports') === '1' || requestedView === 'reports';
            const requestedRest = params.get('rest');
            const requestedSocialSection = params.get('social');
            const requestedParticipantId = params.get('participant');

            if (requestedReports) {
                setProfileVisible(false);
                setRestScreenVisible(false);
                window.dispatchEvent(new CustomEvent('tutorialRestScreen', { detail: { open: false } }));
                setReportsVisible(true);
                handleSetView('planner');

                params.delete('view');
                params.delete('reports');
                params.delete('rest');
                const nextSearch = params.toString();
                const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
                window.history.replaceState(window.history.state, '', nextUrl);
                return;
            }

            if (requestedRest === '0') {
                setRestScreenVisible(false);
                window.dispatchEvent(new CustomEvent('tutorialRestScreen', { detail: { open: false } }));
                params.delete('rest');
                const nextSearch = params.toString();
                const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
                window.history.replaceState(window.history.state, '', nextUrl);
                return;
            }

            if (requestedView !== 'social' && !requestedSocialSection) return;

            handleSetView('social');
            window.setTimeout(() => {
                window.dispatchEvent(new CustomEvent('mundo-tab-request', {
                    detail: {
                        tab: 'social',
                        socialSection: requestedSocialSection === 'messages' || requestedSocialSection === 'clan' ? requestedSocialSection : 'people',
                        participantId: requestedParticipantId || null,
                    },
                }));
            }, 80);

            params.delete('view');
            params.delete('social');
            params.delete('participant');
            const nextSearch = params.toString();
            const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
            window.history.replaceState(window.history.state, '', nextUrl);
        };

        syncQueryNavigation();
        window.addEventListener('popstate', syncQueryNavigation);
        return () => window.removeEventListener('popstate', syncQueryNavigation);
    }, [handleSetView]);

    useEffect(() => {
        const handleDailyCompletionPrompt = (event: Event) => {
            const customEvent = event as CustomEvent<DailyCompletionPromptPayload>;
            if (!customEvent.detail) return;
            if (customEvent.detail.kind === 'task') return;
            setDailyCompletionPrompt(customEvent.detail);
        };

        window.addEventListener(DAILY_COMPLETION_PROMPT_EVENT, handleDailyCompletionPrompt as EventListener);
        return () => window.removeEventListener(DAILY_COMPLETION_PROMPT_EVENT, handleDailyCompletionPrompt as EventListener);
    }, []);

    useEffect(() => {
        const dispatchPlannerOpenAction = (detail: RestScreenActionViewRequestDetail) => {
            window.dispatchEvent(new CustomEvent(PLANNER_OPEN_ACTION_MODAL_EVENT, { detail }));
        };

        const handleOpenActionFromSession = (event: Event) => {
            const customEvent = event as CustomEvent<RestScreenActionViewRequestDetail>;
            if (!customEvent.detail?.actionId) return;

            handleSetView('planner');
            window.setTimeout(() => dispatchPlannerOpenAction(customEvent.detail), currentView === 'planner' ? 40 : 220);
        };

        window.addEventListener(REST_SCREEN_ACTION_VIEW_REQUEST_EVENT, handleOpenActionFromSession as EventListener);
        return () => window.removeEventListener(REST_SCREEN_ACTION_VIEW_REQUEST_EVENT, handleOpenActionFromSession as EventListener);
    }, [currentView, handleSetView]);

    useEffect(() => {
        if (!pendingSitrepOpen || currentView !== 'planner') return;

        const timer = window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openSitrep'));
            setPendingSitrepOpen(false);
        }, 180);

        return () => window.clearTimeout(timer);
    }, [currentView, pendingSitrepOpen]);

    useEffect(() => {
        if (currentView !== 'planner' || isRestScreenVisible || userProfile.id === 'placeholder_user') return;

        const now = new Date();
        const today = getOperationalDateString(now);
        const openKey = `${PLANNER_ORACLE_LAST_OPEN_PREFIX}${userProfile.id}`;
        const speechKey = `${PLANNER_ORACLE_LAST_SPEECH_PREFIX}${userProfile.id}`;
        const previousPlannerOpen = localStorage.getItem(openKey);
        const lastSpeechDate = localStorage.getItem(speechKey);
        localStorage.setItem(openKey, today);

        if (lastSpeechDate === today) return;

        const daysSinceLastPlannerOpen = diffLocalDays(previousPlannerOpen, today);
        const arenasCount = assets.reduce((sum, asset) => sum + (asset.arenas?.length || 0), 0);
        const cycleLengthDays = activeCycle
            ? (diffLocalDays(activeCycle.startDate, activeCycle.endDate) ?? 0) + 1
            : null;
        const lastProofDate = userProfile.dailyProofStreak?.lastProofDate || userProfile.dailyProofStreak?.lastClosedDate || null;
        const oracleContext = buildOracleOperationalContext({
            now,
            assets,
            actions,
            tasks,
            activeCycle,
            cycleProgress,
            activeMode: oraclePreferences?.activeMode || 'neutro',
            customModeInstructions: oraclePreferences?.customModeInstructions || null,
            enabledCategories: oraclePreferences?.enabledCategories || [],
            username: userProfile.nickname || 'Viajante',
            level: userProfile.level || 1,
            dailyCommitment,
            dailyProofStreak: userProfile.dailyProofStreak || null,
        });
        const actionById = new Map<string, (typeof actions)[number]>(
            actions.map((action) => [action.id, action] as const),
        );
        const completedActionNameToday = tasks
            .filter((task) => task.completed && taskMatchesOperationalDate(task, today))
            .map((task) => actionById.get(task.actionId)?.name || null)
            .find((name): name is string => Boolean(name)) || null;
        const message = buildPlannerCoachSpeech({
            arenasCount,
            actionsCount: actions.length,
            cycleLengthDays,
            cycleProgress,
            daysSinceLastPlannerOpen,
            daysSinceLastProof: diffLocalDays(lastProofDate, today),
            hasActiveCycle: Boolean(activeCycle),
            cyclePace: oracleContext.cyclePace,
            focusArenaName: oracleContext.focusArenaSignal?.arenaName || null,
            focusArenaPace: oracleContext.focusArenaSignal?.pace || null,
            focusArenaAdjustment: oracleContext.focusArenaSignal?.suggestedAdjustment || null,
            priorityActionName: oracleContext.priorityActionName,
            completedActionNameToday,
        });

        if (!message) return;

        localStorage.setItem(speechKey, today);
        const presenceLevel = oraclePreferences?.presenceLevel ?? 1;
        if (!shouldShowPlannerCoach(presenceLevel)) return;

        const timer = window.setTimeout(() => {
            emitOracleSpeech({
                title: 'Oraculo',
                message,
                tone: 'info',
                durationMs: 6800,
            });
        }, 520);

        return () => window.clearTimeout(timer);
    }, [actions, activeCycle, assets, currentView, cycleProgress, dailyCommitment, isRestScreenVisible, oraclePreferences, tasks, userProfile.dailyProofStreak, userProfile.id, userProfile.level, userProfile.nickname]);

    useEffect(() => {
        if (suppressScreenIntroTips) {
            setActiveScreenTipId(null);
            return;
        }

        if (!screenTipsEnabled) {
            setActiveScreenTipId(null);
            return;
        }

        if (userProfile.id === 'placeholder_user') {
            setActiveScreenTipId(null);
            return;
        }

        const resolvedTipId =
            isProfileVisible ? 'profile'
            : isReportsVisible ? 'reports'
            : isRestScreenVisible ? 'rest'
            : screenIntroContextId || currentView;

        if (!hasScreenIntroTip(resolvedTipId)) {
            setActiveScreenTipId(null);
            return;
        }

        if (hasSeenScreenIntroTip(userProfile.id, resolvedTipId, userProfile.completedSeasonMissions || [])) {
            setActiveScreenTipId(null);
            return;
        }

        const timer = window.setTimeout(() => {
            setActiveScreenTipId(resolvedTipId);
        }, 280);

        return () => window.clearTimeout(timer);
    }, [
        currentView,
        isProfileVisible,
        isReportsVisible,
        isRestScreenVisible,
        screenTipsEnabled,
        screenIntroContextId,
        suppressScreenIntroTips,
        userProfile.completedSeasonMissions,
        userProfile.id,
    ]);

    const handleCloseScreenIntroTip = useCallback((options?: { disableFuture?: boolean }) => {
        if (!activeScreenTipId) return;

        markScreenIntroTipSeen(userProfile.id, activeScreenTipId);
        const nextProfileFlags = new Set(userProfile.completedSeasonMissions || []);
        nextProfileFlags.add(getScreenIntroTipSeenFlag(activeScreenTipId));

        if (options?.disableFuture) {
            setScreenIntroTipsEnabled(userProfile.id, false);
            nextProfileFlags.add(SCREEN_INTRO_TIPS_DISABLED_FLAG);
            setScreenTipsEnabled(false);
            showToast('Dicas iniciais ocultadas. Para religar: Config > Preferencias > Tutoriais.', 'info');
            window.dispatchEvent(new CustomEvent(SCREEN_INTRO_TIPS_SETTINGS_CHANGED_EVENT, {
                detail: { enabled: false },
            }));
        }

        updateUserProfile({ completedSeasonMissions: Array.from(nextProfileFlags) });
        setActiveScreenTipId(null);
    }, [activeScreenTipId, showToast, updateUserProfile, userProfile.completedSeasonMissions, userProfile.id]);

    useEffect(() => {
        const handleAutoFinishedCycle = () => {
            setProfileVisible(false);
            setReportsVisible(true);
        };

        window.addEventListener('glyph-cycle-auto-finished', handleAutoFinishedCycle);
        return () => window.removeEventListener('glyph-cycle-auto-finished', handleAutoFinishedCycle);
    }, []);

    useEffect(() => {
        setCurrentView((prev) => {
            const nextView = sanitizeView(prev, canUseAssetsView, isBuilderMode);
            return prev === nextView ?prev : nextView;
        });
    }, [canUseAssetsView, isBuilderMode]);

    useEffect(() => {
        const previousView = previousViewRef.current;
        const wasRestVisible = previousRestVisibilityRef.current;

        if (!hasInitializedViewTransitionRef.current) {
            hasInitializedViewTransitionRef.current = true;
            previousViewRef.current = currentView;
            previousRestVisibilityRef.current = isRestScreenVisible;
            return;
        }

        let nextTransition: ViewTransitionKind | null = null;

        if (defaultRestScreenOpen && wasRestVisible && !isRestScreenVisible) {
            nextTransition = 'rest';
        } else if (!isRestScreenVisible && previousView !== currentView) {
            const previousIndex = availableViews.indexOf(previousView);
            const nextIndex = availableViews.indexOf(currentView);
            nextTransition = previousIndex === -1 || nextIndex === -1 || nextIndex >= previousIndex
                ? 'forward'
                : 'backward';
        }

        previousViewRef.current = currentView;
        previousRestVisibilityRef.current = isRestScreenVisible;

        if (nextTransition) {
            setViewTransitionKind(nextTransition);
            setViewTransitionVersion(prev => prev + 1);
        }
    }, [availableViews, currentView, defaultRestScreenOpen, isRestScreenVisible]);

    useEffect(() => {
        const state = window.history.state as { view?: View } | null;
        const initialView = sanitizeView(state?.view ?? currentView, canUseAssetsView, isBuilderMode);
        if (initialView !== currentView) {
            setCurrentView(initialView);
        }
        if (state?.view !== initialView) {
            window.history.replaceState({ ...(state ?? {}), view: initialView }, '');
        }
        historyReady.current = true;
    }, []);

    useLayoutEffect(() => {
        if (!('scrollRestoration' in window.history)) return undefined;

        const previousRestoration = window.history.scrollRestoration;
        window.history.scrollRestoration = 'manual';

        return () => {
            window.history.scrollRestoration = previousRestoration;
        };
    }, []);

    useEffect(() => {
        if (!historyReady.current) return;
        const state = window.history.state as { view?: View } | null;
        if (state?.view !== currentView) {
            window.history.pushState({ view: currentView }, '');
        }
    }, [currentView]);

    useLayoutEffect(() => {
        const resetShellScroll = () => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            const appRoot = document.getElementById('app-root');
            const authRoot = document.querySelector('.auth-app-root') as HTMLElement | null;
            const mainEl = document.querySelector('main') as HTMLElement | null;

            appRoot?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            authRoot?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            mainEl?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        };

        resetShellScroll();
        const rafId = window.requestAnimationFrame(resetShellScroll);
        return () => window.cancelAnimationFrame(rafId);
    }, [currentView, isRestScreenVisible]);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            const nextView = (event.state as { view?: View } | null)?.view;
            if (!nextView) return;
            handleSetView(nextView);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [handleSetView]);

    const handlePackDraft = async () => {
        const json = packDraftToJson();
        const safeName = (draftName || 'codex').trim().replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '_');
        const fileName = `${safeName || 'codex'}.json`;

        try {
            const parsed = JSON.parse(json) as { schemaVersion?: number; metadata?: { name?: string; author?: string; price?: number; description?: string } };
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user.id;

            if (userId && isUuid(userId)) {
                await supabase.from('codex').insert({
                    owner_id: userId,
                    schema_version: typeof parsed.schemaVersion === 'number' ?parsed.schemaVersion : 1,
                    name: (parsed.metadata?.name || draftName || 'Campanha').toString(),
                    author: parsed.metadata?.author || null,
                    price: typeof parsed.metadata?.price === 'number' ?parsed.metadata.price : null,
                    description: parsed.metadata?.description || null,
                    template: parsed,
                    source_type: 'created',
                    created_by_user_id: userId,
                    origin_codex_id: null,
                });
            } else {
                console.warn('Usuário não autenticado ou ID inválido. Salvando apenas localmente.');
            }
        } catch (e) {
            console.error('Falha ao salvar Codex no Supabase:', e);
        }

        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        exitBuilderMode();
    };

    const handleOpenSitrepFromPrompt = useCallback(() => {
        setDailyCompletionPrompt(null);
        setPendingSitrepOpen(true);
        setRestScreenVisible(false);
        window.dispatchEvent(new CustomEvent('tutorialRestScreen', { detail: { open: false } }));
        handleSetView('planner');
    }, [handleSetView]);

    const renderView = () => {
        if (defaultRestScreenOpen && isRestScreenVisible) {
            return <div className="h-full w-full" />;
        }

        const viewContent = (() => {
            switch (currentView) {
                case 'assets': return <AssetsView />;
                case 'arenas': return <ArenasView />;
                case 'planner': return <PlannerView onReportsClick={() => setReportsVisible(true)} />;
                case 'social': return <MundoView />;
                case 'settings': return <SettingsView />;
                default: return canUseAssetsView ?<AssetsView /> : <ArenasView />;
            }
        })();

        return (
            <Suspense
                fallback={
                    <div className="flex h-full w-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--skin-accent-color)] border-t-transparent" />
                    </div>
                }
            >
                <div
                    key={currentView}
                    className={`auth-view-stage${viewTransitionVersion > 0 ? ` auth-view-stage--${viewTransitionKind}` : ''}`}
                >
                    {viewContent}
                </div>
            </Suspense>
        );
    };

    const NavItem: React.FC<{ view: View; label: string; icon: React.ReactNode; id?: string; badgeCount?: number }> = ({ view, label, icon, id, badgeCount = 0 }) => (
        <button
            id={id}
            ref={(el) => {
                if (el) navItemRefs.current.set(view, el);
            }}
            onClick={() => handleSetView(view)}
            className={`auth-nav-item relative z-10 flex w-full flex-col items-center justify-center transition-colors duration-200 ${currentView === view ?'auth-nav-active' : ''}`}
        >
            {icon}
            {badgeCount > 0 && (
                <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-black bg-red-500 px-1 text-[9px] font-black text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                    {badgeCount > 9 ?'9+' : badgeCount}
                </span>
            )}
            <span className="auth-nav-label mt-1 text-[10px] font-bold tracking-wider">{label}</span>
        </button>
    );

    const baseTopPadding = isBuilderMode ?104 : 56;
    const baseBottomPadding = 64;
    const mainPaddingTop = `${baseTopPadding}px`;
    const mainPaddingBottom = currentView === 'assets'
        ?'var(--safe-area-bottom)'
        : `calc(${baseBottomPadding}px + var(--safe-area-bottom))`;
    const themeClass = activeUIMode === 'BASIC'
        ? `mode-office theme-${(activeTheme || 'DARK').toLowerCase()}`
        : `mode-game theme-${(activeTheme || 'DARK').toLowerCase()}`;

    useLayoutEffect(() => {
        const skin = effectiveUiSkin || 'BASIC';
        document.body.setAttribute('data-skin', skin);
        document.documentElement.setAttribute('data-skin', skin);
    }, [effectiveUiSkin]);

    useLayoutEffect(() => {
        const root = document.documentElement;
        const tokens = buildUiSkinTokens(effectiveUiSkin || 'BASIC', activeTheme === 'LIGHT' ? 'light' : 'dark');

        root.style.setProperty('--ui-accent-gradient-border', tokens.accentGradientBorder || tokens.buttonBackground);
        root.style.setProperty('--ui-button-primary-bg', tokens.buttonBackground);
        root.style.setProperty('--ui-button-primary-border', tokens.borderColor);
        root.style.setProperty('--ui-button-primary-glow', tokens.buttonGlow);
        root.style.setProperty('--ui-text-on-accent', tokens.buttonText);
        root.style.setProperty('--ui-text-accent', tokens.accentTextColor);
        root.style.setProperty('--ui-text-accent-soft', tokens.accentSoftTextColor);
        root.style.setProperty('--ui-border-accent', tokens.borderColor);
        root.style.setProperty('--ui-border-accent-soft', tokens.borderSoftColor);
        root.style.setProperty('--glass-bg', tokens.cardBackground);
        root.style.setProperty('--glass-border', tokens.borderSoftColor);
        root.style.setProperty('--glass-border-light', tokens.borderColor);
        root.style.setProperty('--dossier-bg-surface', tokens.cardStrongBackground);
        root.style.setProperty('--ui-card-text', tokens.cardTextColor);
        root.style.setProperty('--ui-card-text-soft', tokens.cardTextSoftColor);
        root.style.setProperty('--ui-core-surface-bg', tokens.cardBackground);
        root.style.setProperty('--ui-core-surface-strong-bg', tokens.cardStrongBackground);
        root.style.setProperty('--ui-core-surface-border', tokens.borderSoftColor);
        root.style.setProperty('--ui-core-surface-border-strong', tokens.borderColor);
        root.style.setProperty('--ui-core-pill-bg', tokens.cardBackground);
        root.style.setProperty('--ui-core-label-color', tokens.cardTextSoftColor);
        root.style.setProperty('--ui-core-caption-color', tokens.cardTextSoftColor);
        root.style.setProperty('--planner-top-bg', tokens.plannerTopBackground);
        root.style.setProperty('--planner-day-header-bg', tokens.plannerDayHeaderBackground);
        root.style.setProperty('--planner-day-header-text', tokens.plannerDayHeaderText);
        root.style.setProperty('--planner-scroll-bg', tokens.plannerScrollBackground);
        root.style.setProperty('--planner-surface-bg', tokens.plannerSurfaceBackground);
        root.style.setProperty('--planner-weekday-header-bg', tokens.plannerWeekdayHeaderBackground);
        root.style.setProperty('--planner-floating-bg', tokens.plannerFloatingBackground);
        root.style.setProperty('--planner-pill-bg', tokens.plannerPillBackground);
        root.style.setProperty('--planner-pill-active-bg', tokens.plannerPillActiveBackground);
        root.style.setProperty('--planner-soft-control-color', tokens.plannerSoftControlColor);
        root.style.setProperty('--planner-hour-label-color', tokens.plannerHourLabelColor);
        root.style.setProperty('--sephirot-text-color', tokens.sephirotTextColor || '#dbc16b');
    }, [activeTheme, effectiveUiSkin]);

    return (
        <div
            id="app-root"
            className={`auth-app-root flex flex-col overflow-hidden font-sans text-gray-200 ${isBuilderMode ?'auth-app-root--builder' : ''} ${themeClass}`}
            data-skin={effectiveUiSkin || 'BASIC'}
        >
            <Suspense fallback={null}>
                <OracleTutorialOverlay />
            </Suspense>

            {isBuilderMode && (
                <div className="auth-builder-banner">
                    <div className="auth-builder-banner__inner">
                        <span className="whitespace-nowrap text-[10px] font-black tracking-widest text-yellow-300">MODO ARQUITETO</span>
                        <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="flex-1 rounded-md border border-yellow-500/40 bg-black/30 px-2 py-1 text-xs font-bold text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                            placeholder="Nome da Campanha"
                        />
                        <button
                            onClick={exitBuilderMode}
                            className="rounded-md border border-yellow-500/30 bg-black/30 px-2 py-1 text-[11px] font-black tracking-wider text-gray-200 hover:bg-black/40"
                        >
                            CANCELAR
                        </button>
                        <button
                            onClick={handlePackDraft}
                            className="rounded-md bg-yellow-400 px-2 py-1 text-[11px] font-black tracking-wider text-black hover:bg-yellow-300"
                        >
                            EMPACOTAR
                        </button>
                    </div>
                </div>
            )}

            <GlobalHeader
                onProfileClick={() => setProfileVisible(true)}
                topOffsetPx={isBuilderMode ?44 : 0}
                defaultRestScreenOpen={defaultRestScreenOpen}
                onRestScreenVisibilityChange={setRestScreenVisible}
            />
            <TutorialBridge />
            <GlobalSeasonTransitionGate enabled={allowSeasonTransition} />

            <main className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ paddingTop: mainPaddingTop, paddingBottom: mainPaddingBottom }}>
                <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col overflow-hidden">
                    {renderView()}
                </div>
            </main>

            <Suspense fallback={null}>
                {isProfileVisible && <ProfileView onClose={() => setProfileVisible(false)} />}
                {isReportsVisible && <ReportsView onClose={() => setReportsVisible(false)} />}
            </Suspense>

            {dailyCompletionPrompt && (
                <DailyCompletionPromptModal
                    mode={activeUIMode}
                    payload={dailyCompletionPrompt}
                    onClose={() => setDailyCompletionPrompt(null)}
                    onOpenSitrep={handleOpenSitrepFromPrompt}
                />
            )}

            <Suspense fallback={null}>
                <ScreenIntroTipOverlay
                    open={!suppressScreenIntroTips && !!activeScreenTipId}
                    tipId={activeScreenTipId}
                    onClose={handleCloseScreenIntroTip}
                />
            </Suspense>

            <footer
                className={`auth-footer safe-area-bottom ${activeUIMode === 'BASIC' ?'auth-footer--basic' : 'auth-footer--game'}`}
                style={{ paddingBottom: 'var(--safe-area-bottom)' }}
            >
                <div
                    className="relative mx-auto max-w-7xl"
                    ref={navContainerRef}
                    onTouchStart={handleNavTouchStart}
                    onTouchMove={handleNavTouchMove}
                    onTouchEnd={handleNavTouchEnd}
                >
                    <div
                        ref={indicatorRef}
                        className="auth-nav-indicator"
                        style={{
                            left: navIndicatorStyle.left,
                            width: navIndicatorStyle.width,
                            opacity: navIndicatorStyle.opacity,
                        }}
                    />
                    <div className="flex h-16 items-center justify-around">
                        <NavItem view="assets" label="ATIVOS" icon={<AssetIcon />} id="nav-assets" />
                        <NavItem view="arenas" label="ARENAS" icon={<ArenaIcon />} id="nav-arenas" />
                        <NavItem view="planner" label="PLANNER" icon={<PlannerIcon />} id="nav-planner" />
                        <NavItem view="social" label="MUNDO" icon={<SocialIcon />} id="nav-mundo" />
                        <NavItem view="settings" label="CONFIG" icon={<ConfigIcon />} id="nav-settings" />
                    </div>
                </div>
            </footer>
        </div>
    );
};

const MainApp: React.FC<{ onReady?: () => void }> = ({ onReady }) => {
    const {
        achievementUnlocked,
        setAchievementUnlocked,
        userProfile,
        appMode,
        updateUserProfile,
        updateOraclePreferences,
        addProfileFlag,
        buyStoreItem,
        toast,
        hideToast,
        isProfileLoaded,
        showToast,
    } = useGame();
    const { isTutorialCompleted } = useTutorial();
    const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ?true : navigator.onLine);
    const { trigger } = useSensoryFeedback();
    const [forceShowTerms, setForceShowTerms] = useState(false);
    const [goldShortagePrompt, setGoldShortagePrompt] = useState<{
        requiredGold: number;
        currentGold: number;
        label: string;
        storeTab?: string;
        section?: string | null;
    } | null>(null);
    const [premiumRenewalOfferSeen, setPremiumRenewalOfferSeen] = useState(false);
    const [premiumRenewalBusy, setPremiumRenewalBusy] = useState(false);
    const [isOnboardingPushBusy, setOnboardingPushBusy] = useState(false);
    const [showRewardVideoPreview, setShowRewardVideoPreview] = useState(() => {
        if (typeof window === 'undefined') return false;
        return new URLSearchParams(window.location.search).get('video_preview') === '1';
    });
    const [pendingAppBroadcast, setPendingAppBroadcast] = useState<AppBroadcast | null>(null);
    const [sessionDismissedBroadcastIds, setSessionDismissedBroadcastIds] = useState<string[]>([]);
    const lastToastSignatureRef = useRef('');
    const toastSensorySuppressedUntilRef = useRef(0);
    const effectiveUiSkin = appMode === 'BASIC' ? 'BASIC' : (userProfile.skin || 'BASIC');

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            if (target.closest('[data-sensory-test="true"]')) return;
            const interactive = target.closest('button, [role="button"], a, input[type="button"], input[type="submit"], .luxe-skin-button') as HTMLElement | null;
            if (!interactive) return;

            trigger('click');
            interactive.classList.add('click-flash');
            window.setTimeout(() => interactive.classList.remove('click-flash'), 180);
        };

        document.addEventListener('pointerdown', handlePointerDown, { passive: true });
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [trigger]);

    useEffect(() => {
        const handleOpenTerms = () => setForceShowTerms(true);
        window.addEventListener('openTermsOverlay', handleOpenTerms);
        return () => window.removeEventListener('openTermsOverlay', handleOpenTerms);
    }, []);

    useEffect(() => {
        const handleOpenRewardVideoPreview = () => setShowRewardVideoPreview(true);
        window.addEventListener('openRewardVideoPreview', handleOpenRewardVideoPreview);
        return () => window.removeEventListener('openRewardVideoPreview', handleOpenRewardVideoPreview);
    }, []);

    useEffect(() => {
        if (!isProfileLoaded) return;
        if (!userProfile.id || userProfile.id === 'placeholder_user') return;
        if (pendingAppBroadcast) return;

        let cancelled = false;

        (async () => {
            try {
                const { data, error } = await supabase
                    .from('app_broadcasts')
                    .select('id,audience,priority,eyebrow,title,summary,body,image_url,button_label,secondary_label,cta_type,cta_target,min_app_version,max_app_version,show_once,dismissible')
                    .eq('status', 'published')
                    .order('priority', { ascending: false })
                    .order('starts_at', { ascending: false })
                    .limit(8);

                if (cancelled || error || !data?.length) return;

                const completedFlags = userProfile.completedSeasonMissions || [];
                const nextBroadcast = (data as AppBroadcastRow[]).find((row) => {
                    if (!isBroadcastCompatibleWithMode(row, appMode)) return false;
                    if (!isBroadcastCompatibleWithVersion(row)) return false;
                    if (sessionDismissedBroadcastIds.includes(row.id)) return false;
                    const seenFlag = `${APP_BROADCAST_SEEN_FLAG_PREFIX}${row.id}`;
                    if (row.show_once && completedFlags.includes(seenFlag)) return false;
                    return true;
                });

                if (nextBroadcast) {
                    setPendingAppBroadcast(mapBroadcastRow(nextBroadcast));
                }
            } catch (error) {
                console.warn('App broadcast fetch skipped:', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        appMode,
        isProfileLoaded,
        pendingAppBroadcast,
        sessionDismissedBroadcastIds,
        userProfile.completedSeasonMissions,
        userProfile.id,
    ]);

    useEffect(() => {
        const handleAppSensoryCue = (event: Event) => {
            const detail = (event as CustomEvent<AppSensoryCuePayload>).detail;
            if (!detail?.cue) return;

            if (detail.cue !== 'task_complete') {
                toastSensorySuppressedUntilRef.current = Date.now() + 420;
            }

            switch (detail.cue) {
                case 'task_complete':
                    trigger('impact');
                    break;
                case 'daily_streak':
                    trigger('success');
                    break;
                case 'daily_panel_closed':
                case 'arena_complete':
                    trigger('success');
                    break;
                case 'campaign_complete':
                    trigger('level_up');
                    break;
                case 'cycle_complete':
                    trigger('fanfare');
                    break;
            }
        };

        window.addEventListener(APP_SENSORY_CUE_EVENT, handleAppSensoryCue as EventListener);
        return () => window.removeEventListener(APP_SENSORY_CUE_EVENT, handleAppSensoryCue as EventListener);
    }, [trigger]);

    useEffect(() => {
        const handleGoldShortage = (event: Event) => {
            const detail = (event as CustomEvent<{
                requiredGold?: number;
                currentGold?: number;
                label?: string;
                storeTab?: string;
                section?: string | null;
            }>).detail || {};

            setGoldShortagePrompt({
                requiredGold: Number(detail.requiredGold || 0),
                currentGold: Number(detail.currentGold || userProfile.wallet?.gold || 0),
                label: detail.label || 'essa compra',
                storeTab: detail.storeTab || 'store',
                section: detail.section || 'packs',
            });
        };

        window.addEventListener('gold-shortage', handleGoldShortage);
        return () => window.removeEventListener('gold-shortage', handleGoldShortage);
    }, [userProfile.wallet?.gold]);

    const completed = userProfile.completedSeasonMissions || [];
    const acceptedTerms = completed.includes(PROFILE_FLAG_TERMS_ACCEPTED);
    const hasPendingTermsCeremony = completed.includes(PROFILE_FLAG_TERMS_PENDING);
    const requiresTermsAcceptance = (hasPendingTermsCeremony || !acceptedTerms) && isProfileLoaded && userProfile.id !== 'placeholder_user';
    const showTerms = forceShowTerms || requiresTermsAcceptance;
    const needsFirstUseOnboarding = shouldAutoStartOnboarding(userProfile);
    const [isFirstUseOnboardingActive, setFirstUseOnboardingActive] = useState(false);
    const [onboardingShownInSession, setOnboardingShownInSession] = useState(false);
    const [claimToken, setClaimToken] = useState<string | null>(null);
    const shouldHoldVanguardWelcome =
        needsFirstUseOnboarding &&
        !userProfile.onboardingCompletedAt &&
        !userProfile.onboardingDismissedAt &&
        !onboardingShownInSession;

    useEffect(() => {
        if (userProfile.id === 'placeholder_user' || !isProfileLoaded || showTerms) return;
        if (!needsFirstUseOnboarding || isFirstUseOnboardingActive || onboardingShownInSession) return;

        updateUserProfile(buildOnboardingStartPatch(userProfile));
        setFirstUseOnboardingActive(true);
        setOnboardingShownInSession(true);
    }, [
        userProfile,
        isProfileLoaded,
        showTerms,
        needsFirstUseOnboarding,
        isFirstUseOnboardingActive,
        onboardingShownInSession,
        updateUserProfile,
    ]);
    const clearClaimToken = useCallback(() => {
        setClaimToken(null);
        const params = new URLSearchParams(window.location.search);
        if (!params.has('claim_codex')) return;
        params.delete('claim_codex');
        const nextSearch = params.toString();
        const nextUrl = `${window.location.pathname}${nextSearch ?`?${nextSearch}` : ''}${window.location.hash}`;
        window.history.replaceState(window.history.state, '', nextUrl);
    }, []);

    useEffect(() => {
        const syncClaimToken = () => {
            const params = new URLSearchParams(window.location.search);
            const nextToken = params.get('claim_codex');
            setClaimToken(nextToken && nextToken.trim() ?nextToken.trim() : null);
        };

        syncClaimToken();
        window.addEventListener('popstate', syncClaimToken);
        return () => window.removeEventListener('popstate', syncClaimToken);
    }, []);

    const handleDismissOnboarding = useCallback(() => {
        updateUserProfile(buildOnboardingDismissPatch(userProfile));
        setFirstUseOnboardingActive(false);
    }, [updateUserProfile, userProfile]);

    const handleCompleteOnboarding = useCallback(() => {
        updateUserProfile(buildOnboardingCompletePatch(userProfile));
        setFirstUseOnboardingActive(false);
        window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent('tutorialNavigate', {
                detail: {
                    view: 'planner',
                    showReports: false,
                    showRestScreen: true,
                    showArenaId: null,
                },
            }));
        }, 120);
    }, [updateUserProfile, userProfile]);

    useEffect(() => {
        if (!isProfileLoaded || showTerms) return;
        if (userProfile.id === 'placeholder_user') return;
        if (userProfile.onboardingPushPromptedAt) return;
        if (isFirstUseOnboardingActive) return;
        if (shouldHoldVanguardWelcome) return;

        let cancelled = false;

        (async () => {
            const permission = await getAppPushPermission();
            if (cancelled || permission !== 'prompt') return;

            updateUserProfile({ onboardingPushPromptedAt: new Date().toISOString() });
            setOnboardingPushBusy(true);
            try {
                const nextPermission = await requestAppPushPermission();
                if (cancelled) return;
                if (nextPermission === 'granted') {
                    await updateOraclePreferences({ pushEnabled: true });
                    showToast('Push ativado. O Oraculo ja pode te acompanhar fora da tela.', 'success');
                } else if (nextPermission === 'denied') {
                    showToast('Tudo bem. O push ficou bloqueado neste aparelho por enquanto.', 'warning');
                }
            } finally {
                if (!cancelled) setOnboardingPushBusy(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [
        isFirstUseOnboardingActive,
        isProfileLoaded,
        shouldHoldVanguardWelcome,
        showTerms,
        showToast,
        updateOraclePreferences,
        updateUserProfile,
        userProfile.id,
        userProfile.onboardingPushPromptedAt,
    ]);

    const handleCloseVanguardWelcome = useCallback(() => {
        showToast(buildVanguardRewardsToast(userProfile.vanguardWelcomePayload), 'success');
        updateUserProfile({
            vanguardWelcomePending: false,
            vanguardWelcomeShownAt: new Date().toISOString(),
        });
    }, [showToast, updateUserProfile, userProfile.vanguardWelcomePayload]);

    const handleClosePremiumReward = useCallback(() => {
        showToast(buildPremiumRewardsToast(userProfile.premiumRewardPayload), 'success');
        updateUserProfile({
            premiumRewardPending: false,
            premiumRewardShownAt: new Date().toISOString(),
        });
    }, [showToast, updateUserProfile, userProfile.premiumRewardPayload]);

    const handleCloseBetaReward = useCallback(() => {
        showToast('Ciclo beta 14/14 concluido. Seus 50 de ouro ja foram integrados.', 'success');
        updateUserProfile({
            betaRewardPending: false,
            betaRewardShownAt: new Date().toISOString(),
        });
    }, [showToast, updateUserProfile]);

    const handleCloseAppBroadcast = useCallback((broadcast = pendingAppBroadcast) => {
        if (!broadcast) return;
        setSessionDismissedBroadcastIds((previous) => (
            previous.includes(broadcast.id) ?previous : [...previous, broadcast.id]
        ));
        if (broadcast.showOnce !== false) {
            addProfileFlag(`${APP_BROADCAST_SEEN_FLAG_PREFIX}${broadcast.id}`);
        }
        setPendingAppBroadcast(null);
    }, [addProfileFlag, pendingAppBroadcast]);

    const handleAppBroadcastCta = useCallback((broadcast: AppBroadcast) => {
        handleCloseAppBroadcast(broadcast);

        if (broadcast.ctaType === 'url' && broadcast.ctaTarget) {
            window.open(broadcast.ctaTarget, '_blank', 'noopener,noreferrer');
            return;
        }

        const targetView = broadcast.ctaTarget as View | null;
        if (broadcast.ctaType === 'view' && targetView && ['assets', 'arenas', 'planner', 'social', 'settings', 'reports'].includes(targetView)) {
            window.dispatchEvent(new CustomEvent(APP_NAVIGATE_EVENT, {
                detail: { view: targetView } satisfies AppNavigatePayload,
            }));
        }
    }, [handleCloseAppBroadcast]);

    const hasVanguardPayload =
        !!userProfile.vanguardWelcomePayload &&
        Object.keys(userProfile.vanguardWelcomePayload).length > 0;

    const shouldShowVanguardWelcome =
        !showTerms &&
        !isFirstUseOnboardingActive &&
        !shouldHoldVanguardWelcome &&
        !!userProfile.vanguardWelcomePending &&
        hasVanguardPayload;

    const hasPremiumRewardPayload =
        !!userProfile.premiumRewardPayload &&
        Object.keys(userProfile.premiumRewardPayload).length > 0;

    const shouldShowPremiumReward =
        !showTerms &&
        !isFirstUseOnboardingActive &&
        !shouldHoldVanguardWelcome &&
        !shouldShowVanguardWelcome &&
        !!userProfile.premiumRewardPending &&
        hasPremiumRewardPayload;

    const hasBetaRewardPayload =
        !!userProfile.betaRewardPayload &&
        Object.keys(userProfile.betaRewardPayload).length > 0;

    const shouldShowBetaReward =
        !showTerms &&
        !isFirstUseOnboardingActive &&
        !shouldHoldVanguardWelcome &&
        !shouldShowVanguardWelcome &&
        !shouldShowPremiumReward &&
        !!userProfile.betaRewardPending &&
        hasBetaRewardPayload;

    const premiumDaysRemaining = getPremiumDaysRemaining(userProfile);
    const activeMembershipTier = getActiveSubscriptionTier(userProfile);
    const activeMembershipProduct = getGoldMembershipProductByTier(activeMembershipTier) || GOLD_PREMIUM_PRODUCT;
    const discountedPremiumPrice = getDiscountedPremiumPrice(activeMembershipProduct.priceGold, 0.1);
    const premiumRenewalNoticeLevel = premiumDaysRemaining != null && premiumDaysRemaining <= 1
        ? '1d'
        : premiumDaysRemaining != null && premiumDaysRemaining <= 3
            ? '3d'
            : null;
    const premiumRenewalOfferStorageKey = userProfile.premiumExpiresAt && premiumRenewalNoticeLevel
        ? `glyph:premium-renewal-offer:${userProfile.id}:${userProfile.premiumExpiresAt}:${premiumRenewalNoticeLevel}`
        : null;
    const shouldShowPremiumRenewalOffer =
        !showTerms &&
        !isFirstUseOnboardingActive &&
        !shouldHoldVanguardWelcome &&
        !shouldShowVanguardWelcome &&
        !shouldShowPremiumReward &&
        !shouldShowBetaReward &&
        !claimToken &&
        hasPremiumAccess(userProfile) &&
        !!premiumRenewalNoticeLevel &&
        !premiumRenewalOfferSeen;

    const shouldShowAppBroadcast =
        !showTerms &&
        !isFirstUseOnboardingActive &&
        !shouldHoldVanguardWelcome &&
        !shouldShowVanguardWelcome &&
        !shouldShowPremiumReward &&
        !shouldShowBetaReward &&
        !shouldShowPremiumRenewalOffer &&
        !goldShortagePrompt &&
        !isOnboardingPushBusy &&
        !claimToken &&
        !!pendingAppBroadcast;

    useEffect(() => {
        if (!premiumRenewalOfferStorageKey || typeof window === 'undefined') {
            setPremiumRenewalOfferSeen(false);
            return;
        }

        setPremiumRenewalOfferSeen(window.localStorage.getItem(premiumRenewalOfferStorageKey) === 'seen');
    }, [premiumRenewalOfferStorageKey]);

    const handleDismissPremiumRenewalOffer = useCallback(() => {
        if (premiumRenewalOfferStorageKey && typeof window !== 'undefined') {
            window.localStorage.setItem(premiumRenewalOfferStorageKey, 'seen');
        }
        setPremiumRenewalOfferSeen(true);
    }, [premiumRenewalOfferStorageKey]);

    useEffect(() => {
        if (!shouldShowPremiumRenewalOffer || typeof window === 'undefined') return;
        const planName = activeMembershipProduct.tier === 'platinum' ? 'Platinum' : 'Premium';
        window.dispatchEvent(new CustomEvent<OracleSpeechPayload>(ORACLE_SPEECH_EVENT, {
            detail: {
                title: 'Oraculo',
                message: `${planName} termina em ${premiumDaysRemaining || 1} dia${(premiumDaysRemaining || 1) === 1 ? '' : 's'}. Se for continuar, estende antes de virar uma surpresa chata.`,
                tone: 'warning',
                durationMs: 6200,
            },
        }));
    }, [activeMembershipProduct.tier, premiumDaysRemaining, shouldShowPremiumRenewalOffer]);

    const handleConfirmPremiumRenewalOffer = useCallback(async () => {
        const currentGold = Number(userProfile.wallet?.gold || 0);
        if (currentGold < discountedPremiumPrice) {
            window.dispatchEvent(new CustomEvent('navigate-to-store', {
                detail: {
                    tab: 'store',
                    section: 'packs',
                },
            }));
            return;
        }

        setPremiumRenewalBusy(true);
        try {
            await buyStoreItem(activeMembershipProduct.id, 'premium', {
                costOverrideGold: discountedPremiumPrice,
                successMessage: `${activeMembershipProduct.tier === 'platinum' ? 'Platinum' : 'Premium'} estendido por mais 30 dias com 10% de desconto (${discountedPremiumPrice} ouro).`,
            });
            handleDismissPremiumRenewalOffer();
        } finally {
            setPremiumRenewalBusy(false);
        }
    }, [activeMembershipProduct.id, activeMembershipProduct.tier, buyStoreItem, discountedPremiumPrice, handleDismissPremiumRenewalOffer, userProfile.wallet?.gold]);

    const handleAcceptTerms = () => {
        const acceptedAt = new Date().toISOString();
        const nextCompleted = (userProfile.completedSeasonMissions || []).filter((flag) => flag !== PROFILE_FLAG_TERMS_PENDING);
        if (!nextCompleted.includes(PROFILE_FLAG_TERMS_ACCEPTED)) nextCompleted.push(PROFILE_FLAG_TERMS_ACCEPTED);
        const acceptSource = forceShowTerms ?LEGAL_ACCEPT_SOURCE_REVIEW : LEGAL_ACCEPT_SOURCE_INITIAL;

        updateUserProfile({
            completedSeasonMissions: nextCompleted,
            termsVersion: userProfile.termsVersion || LEGAL_TERMS_VERSION,
            termsAcceptedAt: userProfile.termsAcceptedAt || acceptedAt,
            termsAcceptSource: userProfile.termsAcceptSource || acceptSource,
            privacyVersion: userProfile.privacyVersion || LEGAL_PRIVACY_VERSION,
            privacyAcceptedAt: userProfile.privacyAcceptedAt || acceptedAt,
            privacyAcceptSource: userProfile.privacyAcceptSource || acceptSource,
        });

        if (forceShowTerms) {
            setForceShowTerms(false);
        }
    };

    useEffect(() => {
        if (isTutorialCompleted && !(userProfile.completedSeasonMissions || []).includes(PROFILE_FLAG_TUTORIAL_COMPLETED)) {
            addProfileFlag(PROFILE_FLAG_TUTORIAL_COMPLETED);
        }
    }, [isTutorialCompleted, userProfile.completedSeasonMissions, addProfileFlag]);

    const shouldOpenRestByDefault =
        !showTerms &&
        !claimToken &&
        !needsFirstUseOnboarding &&
        !isFirstUseOnboardingActive &&
        new URLSearchParams(window.location.search).get('rest') !== '0' &&
        new URLSearchParams(window.location.search).get('reports') !== '1';
    const shouldAllowSeasonTransition =
        !showTerms &&
        !needsFirstUseOnboarding &&
        !isFirstUseOnboardingActive;

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!isProfileLoaded) return;
        onReady?.();
    }, [isProfileLoaded, onReady]);

    useEffect(() => {
        if (!toast.visible) return;
        const signature = `${toast.type || 'info'}:${toast.message}`;
        if (lastToastSignatureRef.current === signature) return;
        lastToastSignatureRef.current = signature;
        if (Date.now() < toastSensorySuppressedUntilRef.current) return;

        if (toast.type === 'success') trigger('success');
        if (toast.type === 'warning') trigger('warning');
        if (toast.type === 'error') trigger('error');
    }, [toast.message, toast.type, toast.visible, trigger]);

    const handleOpenGoldStoreFromPrompt = useCallback(() => {
        if (!goldShortagePrompt) return;
        window.dispatchEvent(new CustomEvent('navigate-to-store', {
            detail: {
                tab: goldShortagePrompt.storeTab || 'store',
                section: goldShortagePrompt.section || 'packs',
            },
        }));
        setGoldShortagePrompt(null);
    }, [goldShortagePrompt]);

    if (!isProfileLoaded) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black text-white" data-skin={effectiveUiSkin || 'BASIC'}>
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--skin-accent-color)] border-t-transparent" />
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">Carregando</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {!requiresTermsAcceptance && (
                <AppWithTutorial
                    defaultRestScreenOpen={shouldOpenRestByDefault}
                    allowSeasonTransition={shouldAllowSeasonTransition}
                    suppressScreenIntroTips={isFirstUseOnboardingActive || onboardingShownInSession || isOnboardingPushBusy}
                />
            )}
            <Suspense fallback={null}>
                <TermsOverlay open={showTerms} onAccept={handleAcceptTerms} />
                <OfflineOverlay open={!isOnline} />
                <FirstUseOnboardingOverlay
                    active={isFirstUseOnboardingActive}
                    onDismiss={handleDismissOnboarding}
                    onComplete={handleCompleteOnboarding}
                />
                {claimToken && (
                    <CodexClaimModal
                        token={claimToken}
                        onClose={clearClaimToken}
                        onClaimed={clearClaimToken}
                    />
                )}
                {shouldShowVanguardWelcome && (
                    <VanguardWelcomeModal
                        open={shouldShowVanguardWelcome}
                        mode={userProfile.appMode}
                        payload={userProfile.vanguardWelcomePayload}
                        onClose={handleCloseVanguardWelcome}
                    />
                )}
                {shouldShowPremiumReward && (
                    <RewardPackModal
                        open={shouldShowPremiumReward}
                        mode={userProfile.appMode}
                        payload={userProfile.premiumRewardPayload}
                        onClose={handleClosePremiumReward}
                        fallbackEyebrow="Premium 30 dias"
                        fallbackTitle="Recompensas do plano"
                        fallbackSummary="Sua ativação foi processada e os bônus reais desta fase já foram entregues."
                        fallbackButtonLabel="Continuar"
                        fallbackItemSectionTitle="Itens desta ativação"
                        fallbackEmptyMessage="A ativação foi concluída e nenhum cosmético novo precisava ser entregue agora."
                    />
                )}
                {shouldShowBetaReward && (
                    <RewardPackModal
                        open={shouldShowBetaReward}
                        mode={userProfile.appMode}
                        payload={userProfile.betaRewardPayload}
                        onClose={handleCloseBetaReward}
                        fallbackEyebrow="Beta 14 de 14"
                        fallbackTitle="Recompensa da vigilia"
                        fallbackSummary="Voce atravessou os 14 dias completos do beta e a recompensa final ja foi entregue."
                        fallbackButtonLabel="Receber"
                        fallbackItemSectionTitle="Entregue no fim do beta"
                        fallbackEmptyMessage="Seu bonus final ja entrou no perfil."
                    />
                )}
                {shouldShowPremiumRenewalOffer && (
                    <ConfirmationModal
                        title={`${activeMembershipProduct.tier === 'platinum' ? 'Platinum' : 'Premium'} 30 dias`}
                        message={`Seu plano termina em ${premiumDaysRemaining || 1} dia${(premiumDaysRemaining || 1) === 1 ? '' : 's'}. Se quiser estender agora, você garante 10% de desconto e soma mais 30 dias por ${discountedPremiumPrice} ouro.`}
                        confirmLabel={premiumRenewalBusy ? 'ESTENDENDO...' : `ESTENDER 30 DIAS · ${discountedPremiumPrice} \u{1FA99}`}
                        cancelLabel="AGORA NÃO"
                        onConfirm={() => { void handleConfirmPremiumRenewalOffer(); }}
                        onCancel={handleDismissPremiumRenewalOffer}
                    />
                )}
                {shouldShowAppBroadcast && pendingAppBroadcast && (
                    <AppBroadcastModal
                        broadcast={pendingAppBroadcast}
                        mode={userProfile.appMode}
                        onClose={() => handleCloseAppBroadcast(pendingAppBroadcast)}
                        onCta={handleAppBroadcastCta}
                    />
                )}
                {goldShortagePrompt && (
                    <div className="fixed inset-0 z-[10060] flex items-center justify-center bg-black/82 px-4 py-6 backdrop-blur-md animate-fade-in" onClick={() => setGoldShortagePrompt(null)}>
                        <div
                            className="w-full max-w-[22rem] overflow-hidden rounded-[26px] border border-[var(--skin-accent-color)]/18 bg-[linear-gradient(180deg,rgba(20,18,14,0.98),rgba(5,5,6,0.98))] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.55)]"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/24 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)]">
                                    <span className="text-sm font-black">O</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[var(--skin-accent-color)]">Ouro insuficiente</p>
                                    <p className="mt-2 text-sm font-semibold leading-relaxed text-white/78">
                                        Faltam {Math.max(0, goldShortagePrompt.requiredGold - goldShortagePrompt.currentGold)} moedas para {goldShortagePrompt.label}.{' '}
                                        <button
                                            type="button"
                                            onClick={handleOpenGoldStoreFromPrompt}
                                            className="font-black text-[var(--skin-accent-color)] underline decoration-[var(--skin-accent-color)]/45 underline-offset-4 transition-colors hover:text-white"
                                        >
                                            Adquira {Math.max(0, goldShortagePrompt.requiredGold - goldShortagePrompt.currentGold)} moedas aqui
                                        </button>
                                        .
                                    </p>
                                    <p className="mt-2 text-[11px] font-medium text-white/38">
                                        Saldo atual: {goldShortagePrompt.currentGold} ouro.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setGoldShortagePrompt(null)}
                                    className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/52 transition-colors hover:border-white/18 hover:text-white"
                                >
                                    Depois
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showRewardVideoPreview && (
                    <RewardVideoPreviewModal onClose={() => setShowRewardVideoPreview(false)} />
                )}
            </Suspense>
            <Suspense fallback={null}>
                <OracleSpeechOverlay />
                {achievementUnlocked && (
                    <AchievementModal
                        achievement={achievementUnlocked}
                        onClose={() => setAchievementUnlocked(null)}
                    />
                )}
                {toast.visible && (
                    <GoldenToast
                        message={toast.message}
                        type={toast.type}
                        onClose={hideToast}
                    />
                )}
            </Suspense>
        </>
    );
};

const AuthenticatedApp: React.FC<{ session: Session; onReady?: () => void }> = ({ session, onReady }) => (
    <GameProvider session={session}>
        <CodexBuilderProvider>
            <TutorialProvider>
                <MainApp onReady={onReady} />
            </TutorialProvider>
        </CodexBuilderProvider>
    </GameProvider>
);

export default AuthenticatedApp;


















