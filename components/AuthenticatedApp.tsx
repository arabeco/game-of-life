import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { GlobalHeader } from './GlobalHeader';
import { AssetIcon, ArenaIcon, ConfigIcon, PlannerIcon, SocialIcon } from './Icons';
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
import { APP_NAVIGATE_EVENT, AppNavigatePayload } from '../utils/arenaAttention';
import {
    getSeasonLaunchToastStorageKey,
    getSeasonTransitionSeenFlag,
    getSeasonTransitionStorageKey,
    resolveRuntimeSeasonTransition,
} from '../utils/seasonPresentation';
import { getActiveSubscriptionTier, getDiscountedPremiumPrice, getPremiumDaysRemaining, hasPremiumAccess, isPremiumInLastDay } from '../utils/premiumAccess';
import { buildUiSkinTokens, resolveUiSkinId } from '../utils/uiSkinTokens';
import { getGoldMembershipProductByTier, GOLD_PREMIUM_PRODUCT } from '../constants/goldCatalog';
import { ConfirmationModal } from './ConfirmationModal';
import { DailyCompletionPromptModal } from './DailyCompletionPromptModal';
import { DAILY_COMPLETION_PROMPT_EVENT, DailyCompletionPromptPayload } from '../utils/dailyCompletionPrompt';
import { PLANNER_OPEN_ACTION_MODAL_EVENT, REST_SCREEN_ACTION_VIEW_REQUEST_EVENT, RestScreenActionViewRequestDetail } from '../utils/restScreenActionSession';
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

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

type View = 'assets' | 'arenas' | 'planner' | 'social' | 'settings' | 'reports';
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

const AppWithTutorial: React.FC<{ defaultRestScreenOpen?: boolean; allowSeasonTransition?: boolean }> = ({
    defaultRestScreenOpen = true,
    allowSeasonTransition = true,
}) => {
    const { isBuilderMode, draftName, setDraftName, exitBuilderMode, packDraftToJson } = useCodexBuilder();
    const { userProfile, appMode, activeTheme, notifications } = useGame();
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
    const unreadNotificationsCount = getUnreadBadgeCount(notifications);
    const previousViewRef = useRef<View>(currentView);
    const previousRestVisibilityRef = useRef(isRestScreenVisible);
    const hasInitializedViewTransitionRef = useRef(false);

    useEffect(() => {
        void updateInstalledAppBadge(unreadNotificationsCount);
    }, [unreadNotificationsCount]);

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
            handleSetView(customEvent.detail.view);
        };

        window.addEventListener(APP_NAVIGATE_EVENT, handleAppNavigate);
        return () => window.removeEventListener(APP_NAVIGATE_EVENT, handleAppNavigate);
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

    useEffect(() => {
        if (!historyReady.current) return;
        const state = window.history.state as { view?: View } | null;
        if (state?.view !== currentView) {
            window.history.pushState({ view: currentView }, '');
        }
    }, [currentView]);

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
                    key={`${currentView}:${viewTransitionVersion}`}
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

    const baseTopPadding = isBuilderMode ?124 : 76;
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

    const premiumDaysRemaining = getPremiumDaysRemaining(userProfile);
    const activeMembershipTier = getActiveSubscriptionTier(userProfile);
    const activeMembershipProduct = getGoldMembershipProductByTier(activeMembershipTier) || GOLD_PREMIUM_PRODUCT;
    const discountedPremiumPrice = getDiscountedPremiumPrice(activeMembershipProduct.priceGold, 0.1);
    const premiumRenewalOfferStorageKey = userProfile.premiumExpiresAt
        ? `glyph:premium-renewal-offer:${userProfile.id}:${userProfile.premiumExpiresAt}`
        : null;
    const shouldShowPremiumRenewalOffer =
        !showTerms &&
        !isFirstUseOnboardingActive &&
        !shouldHoldVanguardWelcome &&
        !shouldShowVanguardWelcome &&
        !shouldShowPremiumReward &&
        !claimToken &&
        hasPremiumAccess(userProfile) &&
        isPremiumInLastDay(userProfile) &&
        !premiumRenewalOfferSeen;

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
                successMessage: `Renovação ${activeMembershipProduct.tier} com 10% de desconto confirmada por ${discountedPremiumPrice} ouro.`,
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
        !isFirstUseOnboardingActive;
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
                        fallbackEyebrow="Renovação premium"
                        fallbackTitle="Recompensas da assinatura"
                        fallbackSummary="Sua renovação foi processada e os bônus reais desta fase já foram entregues."
                        fallbackButtonLabel="Continuar"
                        fallbackItemSectionTitle="Itens desta renovação"
                        fallbackEmptyMessage="A renovação foi concluída e nenhum cosmético novo precisava ser entregue agora."
                    />
                )}
                {shouldShowPremiumRenewalOffer && (
                    <ConfirmationModal
                        title={`Último dia do ${activeMembershipProduct.tier}`}
                        message={`Seu ${activeMembershipProduct.tier} termina em ${premiumDaysRemaining || 1} dia. Se quiser renovar agora, você garante 10% de desconto e fecha por ${discountedPremiumPrice} ouro.`}
                        confirmLabel={premiumRenewalBusy ? 'RENOVANDO...' : `RENOVAR · ${discountedPremiumPrice} \u{1FA99}`}
                        cancelLabel="AGORA NÃO"
                        onConfirm={() => { void handleConfirmPremiumRenewalOffer(); }}
                        onCancel={handleDismissPremiumRenewalOffer}
                    />
                )}
                {goldShortagePrompt && (
                    <ConfirmationModal
                        title="Saldo insuficiente"
                        message={`Você tem ${goldShortagePrompt.currentGold} de ouro, mas precisa de ${goldShortagePrompt.requiredGold} para ${goldShortagePrompt.label}. Deseja abrir a recarga agora?`}
                        confirmLabel="RECARREGAR OURO"
                        cancelLabel="DEPOIS"
                        onConfirm={handleOpenGoldStoreFromPrompt}
                        onCancel={() => setGoldShortagePrompt(null)}
                    />
                )}
            </Suspense>
            <Suspense fallback={null}>
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


















