import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { GlobalHeader } from './GlobalHeader';
import { AssetIcon, ArenaIcon, ConfigIcon, PlannerIcon, SocialIcon } from './Icons';
import { supabase } from '../supabaseClient';
import { GameProvider, PROFILE_FLAG_TERMS_ACCEPTED, PROFILE_FLAG_TERMS_PENDING, PROFILE_FLAG_TUTORIAL_COMPLETED, useGame } from '../contexts/GameContext';
import { CodexBuilderProvider, useCodexBuilder } from '../contexts/CodexBuilderContext';
import { TutorialProvider, useTutorial } from '../contexts/TutorialContext';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { updateInstalledAppBadge } from '../utils/appBadge';
import { buildVanguardRewardsToast } from '../utils/vanguardRewards';
import { getUnreadBadgeCount } from '../constants/oracleNotificationPolicy';
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
import './auth-shell.css';

const AssetsView = React.lazy(() => import('../views/AssetsView').then((m) => ({ default: m.AssetsView })));
const ArenasView = React.lazy(() => import('../views/ArenasView').then((m) => ({ default: m.ArenasView })));
const PlannerView = React.lazy(() => import('../views/PlannerView').then((m) => ({ default: m.PlannerView })));
const MundoView = React.lazy(() => import('../views/MundoView'));
const SettingsView = React.lazy(() => import('../views/SettingsView').then((m) => ({ default: m.SettingsView })));
const ProfileView = React.lazy(() => import('../views/ProfileView').then((m) => ({ default: m.ProfileView })));
const ReportsView = React.lazy(() => import('../views/ReportsView').then((m) => ({ default: m.ReportsView })));
const OracleTutorialOverlay = React.lazy(() => import('./OracleTutorialOverlay').then((m) => ({ default: m.OracleTutorialOverlay })));
const ModeSelectionOverlay = React.lazy(() => import('./ModeSelectionOverlay').then((m) => ({ default: m.ModeSelectionOverlay })));
const AchievementModal = React.lazy(() => import('./AchievementModal').then((m) => ({ default: m.AchievementModal })));
const GoldenToast = React.lazy(() => import('./GoldenToast').then((m) => ({ default: m.GoldenToast })));
const TermsOverlay = React.lazy(() => import('./AppRuntimeOverlays').then((m) => ({ default: m.TermsOverlay })));
const OfflineOverlay = React.lazy(() => import('./AppRuntimeOverlays').then((m) => ({ default: m.OfflineOverlay })));
const FirstUseOnboardingOverlay = React.lazy(() => import('./FirstUseOnboardingOverlay').then((m) => ({ default: m.FirstUseOnboardingOverlay })));
const CodexClaimModal = React.lazy(() => import('./CodexClaimModal').then((m) => ({ default: m.CodexClaimModal })));
const VanguardWelcomeModal = React.lazy(() => import('./VanguardWelcomeModal').then((m) => ({ default: m.VanguardWelcomeModal })));

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

type View = 'assets' | 'arenas' | 'planner' | 'social' | 'settings' | 'reports';

const GAME_NAV_VIEWS: View[] = ['assets', 'arenas', 'planner', 'social', 'settings'];
const BASIC_NAV_VIEWS: View[] = ['arenas', 'planner', 'social', 'settings'];

const getAvailableViews = (canUseAssetsView: boolean, isBuilderMode: boolean): View[] => {
    if (isBuilderMode) return ['arenas'];
    return canUseAssetsView ? GAME_NAV_VIEWS : BASIC_NAV_VIEWS;
};

const getDefaultView = (canUseAssetsView: boolean, isBuilderMode: boolean): View => {
    if (isBuilderMode) return 'arenas';
    return canUseAssetsView ? 'assets' : 'arenas';
};

const sanitizeView = (view: View | null | undefined, canUseAssetsView: boolean, isBuilderMode: boolean): View => {
    const availableViews = getAvailableViews(canUseAssetsView, isBuilderMode);
    if (view && availableViews.includes(view)) return view;
    return getDefaultView(canUseAssetsView, isBuilderMode);
};

const TutorialBridge: React.FC = () => null;

const AppWithTutorial: React.FC<{ defaultRestScreenOpen?: boolean }> = ({ defaultRestScreenOpen = true }) => {
    const { isBuilderMode, draftName, setDraftName, exitBuilderMode, packDraftToJson } = useCodexBuilder();
    const { userProfile, appMode, activeTheme, notifications } = useGame();
    const { didForceGameMode } = useTutorial();
    const historyReady = useRef(false);

    const activeUIMode = appMode === 'GAME' ?'GAME' : 'BASIC';
    const canUseAssetsView = activeUIMode === 'GAME' || didForceGameMode;
    const availableViews = useMemo(() => getAvailableViews(canUseAssetsView, isBuilderMode), [canUseAssetsView, isBuilderMode]);
    const [currentView, setCurrentView] = useState<View>(() => getDefaultView(canUseAssetsView, isBuilderMode));
    const [isProfileVisible, setProfileVisible] = useState(false);
    const [isReportsVisible, setReportsVisible] = useState(false);
    const unreadNotificationsCount = getUnreadBadgeCount(notifications);

    useEffect(() => {
        void updateInstalledAppBadge(unreadNotificationsCount);
    }, [unreadNotificationsCount]);

    useEffect(() => {
        const handleNavigateToStore = () => {
            setCurrentView((prev) => {
                const nextView = sanitizeView('social', canUseAssetsView, isBuilderMode);
                return prev === nextView ?prev : nextView;
            });
            window.setTimeout(() => {
                const storeBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('LOJA'));
                if (storeBtn) storeBtn.click();
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
        setCurrentView((prev) => {
            const nextView = sanitizeView(prev, canUseAssetsView, isBuilderMode);
            return prev === nextView ?prev : nextView;
        });
    }, [canUseAssetsView, isBuilderMode]);

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
                    name: (parsed.metadata?.name || draftName || 'Codex').toString(),
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

    const renderView = () => {
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
                {viewContent}
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
            className={`relative z-10 flex w-full flex-col items-center justify-center transition-colors duration-200 ${currentView === view ?'auth-nav-active' : 'text-gray-500 hover:text-gray-300'}`}
        >
            {icon}
            {badgeCount > 0 && (
                <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-black bg-red-500 px-1 text-[9px] font-black text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]">
                    {badgeCount > 9 ?'9+' : badgeCount}
                </span>
            )}
            <span className="mt-1 text-[10px] font-bold tracking-wider">{label}</span>
        </button>
    );

    const baseTopPadding = isBuilderMode ?128 : 80;
    const baseBottomPadding = 64;
    const mainPaddingTop = `calc(${baseTopPadding}px + var(--safe-area-top))`;
    const mainPaddingBottom = currentView === 'assets'
        ?'var(--safe-area-bottom)'
        : `calc(${baseBottomPadding}px + var(--safe-area-bottom))`;
    const themeClass = activeUIMode === 'BASIC' ?`mode-office theme-${(activeTheme || 'DARK').toLowerCase()}` : '';

    useEffect(() => {
        const skin = activeUIMode === 'BASIC' ?'default' : userProfile.skin;
        document.body.setAttribute('data-skin', skin);
        document.documentElement.setAttribute('data-skin', skin);
    }, [activeUIMode, userProfile.skin]);

    return (
        <div
            id="app-root"
            className={`auth-app-root flex flex-col overflow-hidden font-sans text-gray-200 ${isBuilderMode ?'auth-app-root--builder' : ''} ${themeClass}`}
            data-skin={activeUIMode === 'BASIC' ?'default' : userProfile.skin}
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
                            placeholder="Nome do Codex"
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

            <GlobalHeader onProfileClick={() => setProfileVisible(true)} topOffsetPx={isBuilderMode ?44 : 0} defaultRestScreenOpen={defaultRestScreenOpen} />
            <TutorialBridge />

            <main className="flex min-h-0 flex-1 flex-col overflow-hidden" style={{ paddingTop: mainPaddingTop, paddingBottom: mainPaddingBottom }}>
                <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col overflow-hidden">
                    {renderView()}
                </div>
            </main>

            <Suspense fallback={null}>
                {isProfileVisible && <ProfileView onClose={() => setProfileVisible(false)} />}
                {isReportsVisible && <ReportsView onClose={() => setReportsVisible(false)} />}
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
                        {activeUIMode === 'GAME' && <NavItem view="assets" label="ATIVOS" icon={<AssetIcon />} id="nav-assets" />}
                        <NavItem view="arenas" label={activeUIMode === 'BASIC' ? 'ÁREAS' : 'ARENAS'} icon={<ArenaIcon />} id="nav-arenas" />
                        <NavItem view="planner" label="PLANNER" icon={<PlannerIcon />} id="nav-planner" />
                        <NavItem view="social" label={activeUIMode === 'BASIC' ?'EQUIPE' : 'MUNDO'} icon={<SocialIcon />} id="nav-mundo" />
                        <NavItem view="settings" label="CONFIG" icon={<ConfigIcon />} id="nav-settings" />
                    </div>
                </div>
            </footer>
        </div>
    );
};

const MainApp: React.FC = () => {
    const {
        achievementUnlocked,
        setAchievementUnlocked,
        userProfile,
        updateUserProfile,
        addProfileFlag,
        toast,
        hideToast,
        isProfileLoaded,
        showToast,
    } = useGame();
    const { isTutorialCompleted } = useTutorial();
    const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ?true : navigator.onLine);
    const { trigger } = useSensoryFeedback();
    const [forceShowTerms, setForceShowTerms] = useState(false);
    const lastToastSignatureRef = useRef('');

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

    const completed = userProfile.completedSeasonMissions || [];
    const acceptedTerms = completed.includes(PROFILE_FLAG_TERMS_ACCEPTED);
    const requiresTermsAcceptance = !acceptedTerms && isProfileLoaded && userProfile.id !== 'placeholder_user';
    const showTerms = forceShowTerms || requiresTermsAcceptance;
    const needsModeSelection = acceptedTerms && !userProfile.appMode;
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
        if (userProfile.id === 'placeholder_user' || !isProfileLoaded || showTerms || needsModeSelection) return;
        if (!needsFirstUseOnboarding || isFirstUseOnboardingActive || onboardingShownInSession) return;

        updateUserProfile(buildOnboardingStartPatch(userProfile));
        setFirstUseOnboardingActive(true);
        setOnboardingShownInSession(true);
    }, [
        userProfile,
        isProfileLoaded,
        showTerms,
        needsModeSelection,
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

    const hasVanguardPayload =
        !!userProfile.vanguardWelcomePayload &&
        Object.keys(userProfile.vanguardWelcomePayload).length > 0;

    const shouldShowVanguardWelcome =
        !showTerms &&
        !needsModeSelection &&
        !isFirstUseOnboardingActive &&
        !shouldHoldVanguardWelcome &&
        !!userProfile.vanguardWelcomePending &&
        hasVanguardPayload;

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
        !needsModeSelection &&
        !claimToken &&
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
        if (!toast.visible) return;
        const signature = `${toast.type || 'info'}:${toast.message}`;
        if (lastToastSignatureRef.current === signature) return;
        lastToastSignatureRef.current = signature;

        if (toast.type === 'success') trigger('success');
        if (toast.type === 'warning') trigger('warning');
        if (toast.type === 'error') trigger('error');
    }, [toast.message, toast.type, toast.visible, trigger]);

    return (
        <>
            {!requiresTermsAcceptance && <AppWithTutorial defaultRestScreenOpen={shouldOpenRestByDefault} />}
            {!showTerms && (
                <Suspense fallback={null}>
                    <ModeSelectionOverlay />
                </Suspense>
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

const AuthenticatedApp: React.FC<{ session: Session }> = ({ session }) => (
    <GameProvider session={session}>
        <CodexBuilderProvider>
            <TutorialProvider>
                <MainApp />
            </TutorialProvider>
        </CodexBuilderProvider>
    </GameProvider>
);

export default AuthenticatedApp;


















