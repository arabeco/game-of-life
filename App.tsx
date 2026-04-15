import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from './supabaseClient';
import { SplashScreen } from './components/SplashScreen';
import { ClosedBetaGoogleInviteModal } from './components/ClosedBetaGoogleInviteModal';
import { AppRuntimeMetricsService, type AppRuntimeEntryMode } from './services/AppRuntimeMetricsService';
import { SupabaseService } from './services/SupabaseService';
import {
    clearClosedBetaGoogleAuthPending,
    clearRememberedClosedBetaGoogleAccess,
    hasClosedBetaGoogleAuthPending,
    hasRememberedClosedBetaGoogleAccess,
    rememberClosedBetaGoogleAccess,
    saveClosedBetaGoogleRedirect,
} from './utils/closedBetaAuth';
import { parseBooleanEnvFlag } from './utils/envFlags';
import { startInstallPromptCapture } from './utils/installPrompt';
import {
    clearIntentionalSignOutPending,
    isIntentionalSignOutPending,
    signOutAndClearSupabaseSession,
} from './utils/authSession';
import { ensureClosedBetaUserProfile } from './utils/closedBetaProfile';
import { isNativeAuthCallbackUrl, parseNativeAuthCallback } from './utils/nativeAuth';
import { loadSessionBackup, saveSessionBackup } from './utils/sessionBackup';
import { appendAuthTrace, snapshotAuthStorageState } from './utils/authTrace';
import { isCapacitorNativeRuntime } from './utils/runtimePlatform';
import { resolveUiSkinId } from './utils/uiSkinTokens';

const LoginView = React.lazy(() => import('./views/LoginView').then((m) => ({ default: m.LoginView })));
const LegacyRenderView = React.lazy(() => import('./views/LegacyRenderView').then((m) => ({ default: m.LegacyRenderView })));
const AuthenticatedApp = React.lazy(() => import('./components/AuthenticatedApp'));
const ResetPasswordOverlay = React.lazy(() => import('./components/AppRuntimeOverlays').then((m) => ({ default: m.ResetPasswordOverlay })));
const STORAGE_KEY_PROFILE = 'gol_user_profile_v2';
const GOOGLE_OAUTH_RECOVERY_DELAYS_MS = [250, 350, 500, 700, 900, 1200, 1500, 1800, 2200, 2600] as const;

const AppBootScreen: React.FC<{ accentColor?: string; mode?: 'GAME' | 'BASIC'; theme?: 'LIGHT' | 'DARK' | null }> = ({
    accentColor = '#d4af37',
    mode = 'BASIC',
    theme = 'DARK',
}) => (
    <div
        className={`relative flex h-full min-h-0 items-center justify-center overflow-hidden text-white ${mode === 'BASIC' ? `mode-office theme-${(theme || 'DARK').toLowerCase()}` : ''}`}
        style={{
            ['--skin-accent-color' as string]: accentColor,
            background: 'radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 28%), linear-gradient(180deg, #050505 0%, #000000 100%)',
        }}
    >
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_62%)]" />
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,215,0,0.10),transparent_68%)] blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="relative h-18 w-18">
                <img src="/logo-diamond.png" alt="GLYPH" className="h-full w-full drop-shadow-[0_0_18px_rgba(255,215,0,0.24)]" />
                <div className="absolute inset-0 animate-spin-slow opacity-80">
                    <img src="/logo-core.png" alt="" className="h-full w-full" />
                </div>
            </div>
            <div className="space-y-1 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/55">Entrando</p>
                <p className="text-sm font-medium text-white/80">Preparando o ambiente...</p>
            </div>
            <div className="h-1 w-36 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full animate-[shimmer_1.6s_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.24),transparent)]" />
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [pendingGoogleInviteSession, setPendingGoogleInviteSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [authGuardLoading, setAuthGuardLoading] = useState(false);
    const [resumeRecoveryPending, setResumeRecoveryPending] = useState(false);
    const [googleAuthPending, setGoogleAuthPending] = useState(() => hasClosedBetaGoogleAuthPending());
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [isSplashComplete, setIsSplashComplete] = useState(false);
    const [isAppContentReady, setIsAppContentReady] = useState(false);
    const authResolutionRef = useRef(0);
    const sessionRef = useRef<Session | null>(null);
    const sessionRecoveryInFlightRef = useRef<Promise<Session | null> | null>(null);
    const lastSessionRecoveryAttemptRef = useRef(0);
    const bootStartedAtRef = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());
    const bootMetricSentRef = useRef(false);
    const bootErrorSignatureRef = useRef('');
    const bootEntryModeRef = useRef<AppRuntimeEntryMode>('unknown');
    const [bootVisuals, setBootVisuals] = useState<{ skin: string; mode: 'GAME' | 'BASIC'; theme: 'LIGHT' | 'DARK' | null }>({
        skin: 'BASIC',
        mode: 'BASIC',
        theme: 'DARK',
    });
    const bootVisualsRef = useRef(bootVisuals);
    const renderMode = useMemo(() => new URLSearchParams(window.location.search).get('render'), []);
    const renderModeRef = useRef(renderMode);
    const disableGoldInviteByEnv = parseBooleanEnvFlag(import.meta.env.VITE_DISABLE_GOLD_INVITE);
    const isGoldenInviteGateEnabled = !import.meta.env.DEV && !disableGoldInviteByEnv;
    const showFullScreenBoot = loading || googleAuthPending || (!session && (authGuardLoading || resumeRecoveryPending));

    const handleSplashComplete = () => {
        setIsSplashComplete(true);
    };

    useEffect(() => {
        sessionRef.current = session;
        if (session) {
            clearIntentionalSignOutPending();
            void saveSessionBackup(session);
        }
    }, [session]);

    useEffect(() => {
        bootVisualsRef.current = bootVisuals;
    }, [bootVisuals]);

    useEffect(() => {
        setIsAppContentReady(false);
    }, [session?.user?.id]);

    const captureBootError = useCallback((errorName: string, errorMessage: string) => {
        if (bootMetricSentRef.current) return;

        const userId = sessionRef.current?.user?.id;
        if (!userId) return;

        const signature = `${errorName}:${errorMessage}`;
        if (bootErrorSignatureRef.current === signature) return;
        bootErrorSignatureRef.current = signature;

        AppRuntimeMetricsService.trackBootError({
            userId,
            durationMs: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - bootStartedAtRef.current,
            entryMode: bootEntryModeRef.current,
            appMode: bootVisualsRef.current.mode,
            renderMode: renderModeRef.current,
            errorName,
            errorMessage,
        });
    }, []);

    const handleAuthenticatedAppReady = useCallback(() => {
        setIsAppContentReady(true);

        if (bootMetricSentRef.current) return;
        const userId = sessionRef.current?.user?.id;
        if (!userId) return;

        bootMetricSentRef.current = true;
        AppRuntimeMetricsService.trackShellReady({
            userId,
            durationMs: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - bootStartedAtRef.current,
            entryMode: bootEntryModeRef.current,
            appMode: bootVisualsRef.current.mode,
            renderMode: renderModeRef.current,
            theme: bootVisualsRef.current.theme,
        });
    }, []);

    useEffect(() => {
        if (!isCapacitorNativeRuntime()) return;

        let disposed = false;
        let listenerHandle: { remove: () => Promise<void> } | null = null;

        const setupNativeAuthCallback = async () => {
            listenerHandle = await CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
                if (disposed || !isNativeAuthCallbackUrl(url)) return;

                const { code, error, errorDescription } = parseNativeAuthCallback(url);

                try {
                    await Browser.close();
                } catch (_closeError) {
                    // noop
                }

                if (error) {
                    clearClosedBetaGoogleAuthPending();
                    setGoogleAuthPending(false);
                    saveClosedBetaGoogleRedirect({
                        mode: 'login',
                        email: '',
                        message: errorDescription || 'Nao consegui concluir o login nativo com Google.',
                    });
                    return;
                }

                if (!code) {
                    clearClosedBetaGoogleAuthPending();
                    setGoogleAuthPending(false);
                    saveClosedBetaGoogleRedirect({
                        mode: 'login',
                        email: '',
                        message: 'O Google voltou para o app sem codigo de autenticacao.',
                    });
                    return;
                }

                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                if (exchangeError) {
                    clearClosedBetaGoogleAuthPending();
                    setGoogleAuthPending(false);
                    saveClosedBetaGoogleRedirect({
                        mode: 'login',
                        email: '',
                        message: exchangeError.message || 'Falha ao trocar o codigo do Google pela sessao no app.',
                    });
                    return;
                }

                const {
                    data: { session: exchangedSession },
                } = await supabase.auth.getSession();

                if (exchangedSession) {
                    await saveSessionBackup(exchangedSession);
                    await snapshotAuthStorageState('native-auth-callback:save');
                }
            });
        };

        void setupNativeAuthCallback();

        return () => {
            disposed = true;
            if (listenerHandle) {
                void listenerHandle.remove();
            }
        };
    }, []);

    useEffect(() => {
        startInstallPromptCapture();
        void import('./views/LoginView');
        void import('./components/AuthenticatedApp');
        void appendAuthTrace('boot:init', { native: isCapacitorNativeRuntime() });

        const syncNativeAutoRefresh = (isActive: boolean, reason: string) => {
            if (!isCapacitorNativeRuntime()) return;

            try {
                if (isActive) {
                    supabase.auth.startAutoRefresh();
                    void appendAuthTrace('auto-refresh:start', { reason });
                } else {
                    supabase.auth.stopAutoRefresh();
                    void appendAuthTrace('auto-refresh:stop', { reason });
                }
            } catch (error) {
                void appendAuthTrace('auto-refresh:error', {
                    reason,
                    message: error instanceof Error ? error.message : String(error),
                });
            }
        };

        const clearPendingGoogleAuthState = () => {
            clearClosedBetaGoogleAuthPending();
            setGoogleAuthPending(false);
        };

        const retryPendingGoogleAuthSession = async (reason = 'pending-google-oauth'): Promise<Session | null> => {
            if (!hasClosedBetaGoogleAuthPending()) return null;

            for (let attempt = 0; attempt < GOOGLE_OAUTH_RECOVERY_DELAYS_MS.length; attempt += 1) {
                await new Promise((resolve) => window.setTimeout(resolve, GOOGLE_OAUTH_RECOVERY_DELAYS_MS[attempt]));
                const {
                    data: { session: retriedSession },
                    error: retryError,
                } = await supabase.auth.getSession();

                if (retryError) {
                    console.warn(`Retry session restore error after Google OAuth (${reason}):`, retryError.message);
                    return null;
                }

                if (retriedSession) {
                    return retriedSession;
                }
            }

            return null;
        };

        const waitForSessionRetry = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

        const getStoredSession = async (reason: string): Promise<Session | null> => {
            const {
                data: { session: storedSession },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                console.warn(`Session lookup failed during ${reason}:`, sessionError.message);
                await appendAuthTrace('session:get:error', { reason, message: sessionError.message });
                return null;
            }

            await appendAuthTrace('session:get:result', {
                reason,
                found: !!storedSession,
                userId: storedSession?.user?.id ?? null,
            });

            return storedSession;
        };

        const refreshSessionFromCandidate = async (candidate: Session | null, reason: string): Promise<Session | null> => {
            if (!candidate?.refresh_token) {
                await appendAuthTrace('session:refresh:skip', { reason, hasCandidate: !!candidate });
                return null;
            }

            const {
                data: refreshData,
                error: refreshError,
            } = await supabase.auth.refreshSession(candidate);

            if (refreshError) {
                console.warn(`Session refresh failed during ${reason}:`, refreshError.message);
                await appendAuthTrace('session:refresh:error', { reason, message: refreshError.message });
                return null;
            }

            await appendAuthTrace('session:refresh:result', {
                reason,
                found: !!refreshData.session,
                userId: refreshData.session?.user?.id ?? null,
            });

            return refreshData.session ?? null;
        };

        const restoreSessionFromBackup = async (reason: string): Promise<Session | null> => {
            const backupSession = await loadSessionBackup();
            if (!backupSession?.refresh_token || !backupSession.access_token) {
                await appendAuthTrace('session:backup:skip', { reason, hasBackup: !!backupSession });
                return null;
            }

            const {
                data: restoredData,
                error: restoredError,
            } = await supabase.auth.setSession({
                access_token: backupSession.access_token,
                refresh_token: backupSession.refresh_token,
            });

            if (restoredError) {
                console.warn(`Backup session restore failed during ${reason}:`, restoredError.message);
                await appendAuthTrace('session:backup:error', { reason, message: restoredError.message });
                return refreshSessionFromCandidate(backupSession, `${reason}:refresh-backup`);
            }

            await appendAuthTrace('session:backup:result', {
                reason,
                found: !!(restoredData.session ?? backupSession),
                userId: restoredData.session?.user?.id ?? backupSession.user?.id ?? null,
            });

            return restoredData.session ?? backupSession;
        };

        const recoverSessionGracefully = async (reason: string, preferredSession: Session | null = null): Promise<Session | null> => {
            if (sessionRecoveryInFlightRef.current) {
                await appendAuthTrace('session:recover:reuse', { reason });
                return sessionRecoveryInFlightRef.current;
            }

            lastSessionRecoveryAttemptRef.current = Date.now();
            const recoveryPromise = (async () => {
                await appendAuthTrace('session:recover:start', {
                    reason,
                    currentUserId: sessionRef.current?.user?.id ?? null,
                    preferredUserId: preferredSession?.user?.id ?? null,
                });
                await snapshotAuthStorageState(`session:recover:storage:${reason}`);

                const seedSession = preferredSession || sessionRef.current;
                const immediateStoredSession = await getStoredSession(`${reason}:stored`);
                if (immediateStoredSession) return immediateStoredSession;

                const immediateRefreshedSession = await refreshSessionFromCandidate(seedSession, `${reason}:refresh`);
                if (immediateRefreshedSession) return immediateRefreshedSession;

                const immediateBackupSession = await restoreSessionFromBackup(`${reason}:backup`);
                if (immediateBackupSession) return immediateBackupSession;

                for (let attempt = 0; attempt < 3; attempt += 1) {
                    await appendAuthTrace('session:recover:retry', { reason, attempt: attempt + 1 });
                    await waitForSessionRetry(300 * (attempt + 1));

                    const retriedStoredSession = await getStoredSession(`${reason}:retry-stored:${attempt + 1}`);
                    if (retriedStoredSession) return retriedStoredSession;

                    const retriedRefreshedSession = await refreshSessionFromCandidate(sessionRef.current || seedSession, `${reason}:retry-refresh:${attempt + 1}`);
                    if (retriedRefreshedSession) return retriedRefreshedSession;

                    const retriedBackupSession = await restoreSessionFromBackup(`${reason}:retry-backup:${attempt + 1}`);
                    if (retriedBackupSession) return retriedBackupSession;
                }

                await appendAuthTrace('session:recover:miss', { reason });
                return null;
            })().finally(() => {
                sessionRecoveryInFlightRef.current = null;
            });

            sessionRecoveryInFlightRef.current = recoveryPromise;
            return recoveryPromise;
        };

        const preloadBootVisuals = (currentUserId?: string | null) => {
            if (!currentUserId) return;

            try {
                const cached = localStorage.getItem(`${STORAGE_KEY_PROFILE}_${currentUserId}`);
                if (!cached) return;

                const parsed = JSON.parse(cached);
                setBootVisuals({
                    skin: parsed?.skin || 'BASIC',
                    mode: parsed?.appMode === 'GAME' ? 'GAME' : 'BASIC',
                    theme: parsed?.themePreference === 'LIGHT' ? 'LIGHT' : 'DARK',
                });
            } catch (storageError) {
                console.warn('Failed to preload cached profile visuals:', storageError);
            }
        };

        const isGoogleSession = (candidate: Session): boolean => {
            const directProvider = String(candidate.user?.app_metadata?.provider || '').toLowerCase();
            const providerList = Array.isArray(candidate.user?.app_metadata?.providers)
                ? candidate.user.app_metadata.providers.map((provider) => String(provider).toLowerCase())
                : [];
            const identityList = Array.isArray((candidate.user as { identities?: Array<{ provider?: string }> })?.identities)
                ? ((candidate.user as { identities?: Array<{ provider?: string }> }).identities || []).map((identity) => String(identity?.provider || '').toLowerCase())
                : [];

            return directProvider === 'google' || providerList.includes('google') || identityList.includes('google');
        };

        const hasUserProfile = async (userId?: string | null) => {
            if (!userId) return false;

            const { data, error } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.warn('Failed to verify user profile after auth:', error);
                return false;
            }

            return !!data?.id;
        };

        const setPendingInviteSessionIfCurrent = (resolutionId: number, nextSession: Session | null) => {
            if (authResolutionRef.current !== resolutionId) return;
            setPendingGoogleInviteSession(nextSession);
        };

        const setSessionIfCurrent = (resolutionId: number, nextSession: Session | null) => {
            if (authResolutionRef.current !== resolutionId) return;
            setSession(nextSession);
        };

        const resolveClosedBetaSession = async (candidate: Session | null, resolutionId: number): Promise<Session | null> => {
            if (!candidate) return null;

            clearPendingGoogleAuthState();
            preloadBootVisuals(candidate.user?.id);

            if (!isGoldenInviteGateEnabled) {
                setPendingInviteSessionIfCurrent(resolutionId, null);
                return candidate;
            }

            const accessStatus = await SupabaseService.getClosedBetaAccessStatus();
            const hasProfile = accessStatus?.hasProfile === true || await hasUserProfile(candidate.user?.id);
            const hasRememberedAccess = hasRememberedClosedBetaGoogleAccess(candidate.user?.id);

            if (accessStatus?.reentryBlocked && isGoogleSession(candidate)) {
                clearRememberedClosedBetaGoogleAccess(candidate.user?.id);
                saveClosedBetaGoogleRedirect({
                    mode: 'login',
                    email: candidate.user.email || '',
                    message: 'Esta conta foi excluida e nao pode entrar novamente com este Google.',
                });
                const cleanupResult = await SupabaseService.deleteMyAccount({
                    blockReentry: false,
                    reason: 'deleted_account_reentry_cleanup',
                });
                if (!cleanupResult.success) {
                    console.error('Failed to delete provisional Google reentry account after access status block:', cleanupResult.error);
                }
                await signOutAndClearSupabaseSession('local', 'closed-beta-reentry-blocked');
                return null;
            }

            if (!hasProfile && (accessStatus?.hasInvite || hasRememberedAccess)) {
                const repairResult = await ensureClosedBetaUserProfile(candidate);
                if (repairResult.success) {
                    rememberClosedBetaGoogleAccess(candidate.user?.id, candidate.user.email);
                    setPendingInviteSessionIfCurrent(resolutionId, null);
                    return candidate;
                }

                console.error('Failed to rebuild user_profile for authenticated closed beta account:', repairResult.error);
                saveClosedBetaGoogleRedirect({
                    mode: 'login',
                    email: candidate.user.email || '',
                    message: repairResult.error || 'Seu acesso ja tinha Bilhete vinculado, mas nao consegui reconstruir o perfil agora.',
                });
                await signOutAndClearSupabaseSession('local', 'closed-beta-profile-repair-failed');
                return null;
            }

            if (!isGoogleSession(candidate)) {
                setPendingInviteSessionIfCurrent(resolutionId, null);
                return candidate;
            }

            const deletedAccountBlock = candidate.user.email
                ? await SupabaseService.getDeletedAccountBlockStatus(candidate.user.email)
                : null;

            if (deletedAccountBlock?.blocked) {
                clearRememberedClosedBetaGoogleAccess(candidate.user?.id);
                saveClosedBetaGoogleRedirect({
                    mode: 'login',
                    email: candidate.user.email || '',
                    message: 'Esta conta foi excluida e nao pode entrar novamente com este Google.',
                });
                const cleanupResult = await SupabaseService.deleteMyAccount({
                    blockReentry: false,
                    reason: 'deleted_account_reentry_cleanup',
                });
                if (!cleanupResult.success) {
                    console.error('Failed to delete provisional Google reentry account:', cleanupResult.error);
                }
                await signOutAndClearSupabaseSession('local', 'closed-beta-deleted-account-blocked');
                return null;
            }

            if (hasProfile) {
                rememberClosedBetaGoogleAccess(candidate.user?.id, candidate.user.email);
                setPendingInviteSessionIfCurrent(resolutionId, null);
                return candidate;
            }

            setPendingInviteSessionIfCurrent(resolutionId, candidate);
            return null;
        };

        const applyResolvedSession = async (candidate: Session | null) => {
            const resolutionId = authResolutionRef.current + 1;
            authResolutionRef.current = resolutionId;
            setAuthGuardLoading(true);
            try {
                const resolvedSession = await resolveClosedBetaSession(candidate, resolutionId);
                if (resolvedSession) {
                    await saveSessionBackup(resolvedSession);
                    await snapshotAuthStorageState('apply-resolved-session:save');
                }
                setSessionIfCurrent(resolutionId, resolvedSession);
            } finally {
                if (authResolutionRef.current === resolutionId) {
                    setAuthGuardLoading(false);
                }
            }
        };

        const persistCurrentSessionBackup = async (reason: string) => {
            const currentSession = sessionRef.current || await getStoredSession(`${reason}:persist-current`);
            if (!currentSession) {
                await appendAuthTrace('backup:persist:skip', { reason });
                return;
            }

            await saveSessionBackup(currentSession);
            await snapshotAuthStorageState(`backup:persist:${reason}`);
        };

        const recoverSessionOnResume = async (trigger: 'visibilitychange' | 'focus' | 'pageshow' | 'appStateChange') => {
            if (document.visibilityState === 'hidden') {
                await appendAuthTrace('resume:skip:hidden', { trigger });
                return;
            }
            if (sessionRecoveryInFlightRef.current) {
                await appendAuthTrace('resume:skip:inflight', { trigger });
                return;
            }
            if (Date.now() - lastSessionRecoveryAttemptRef.current < 1200) {
                await appendAuthTrace('resume:skip:throttle', { trigger });
                return;
            }

            await appendAuthTrace('resume:start', {
                trigger,
                currentUserId: sessionRef.current?.user?.id ?? null,
            });

            const shouldHoldBoot = isCapacitorNativeRuntime() && !sessionRef.current;
            if (shouldHoldBoot) {
                setResumeRecoveryPending(true);
            }

            try {
                const recoveredSession = await recoverSessionGracefully(`resume:${trigger}`);
                if (!recoveredSession) {
                    await appendAuthTrace('resume:miss', { trigger });
                    return;
                }

                const currentSession = sessionRef.current;
                const sessionChanged =
                    !currentSession ||
                    currentSession.user?.id !== recoveredSession.user?.id ||
                    currentSession.access_token !== recoveredSession.access_token ||
                    currentSession.refresh_token !== recoveredSession.refresh_token;

                if (sessionChanged) {
                    await appendAuthTrace('resume:apply', {
                        trigger,
                        userId: recoveredSession.user?.id ?? null,
                    });
                    bootStartedAtRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
                    bootMetricSentRef.current = false;
                    bootErrorSignatureRef.current = '';
                    bootEntryModeRef.current = 'resume_recovery';
                    await applyResolvedSession(recoveredSession);
                } else {
                    await appendAuthTrace('resume:no-change', {
                        trigger,
                        userId: recoveredSession.user?.id ?? null,
                    });
                }
            } finally {
                if (shouldHoldBoot) {
                    setResumeRecoveryPending(false);
                }
            }
        };

        const checkSession = async () => {
            try {
                await appendAuthTrace('check-session:start', {
                    native: isCapacitorNativeRuntime(),
                });
                await snapshotAuthStorageState('check-session:storage');
                const {
                    data: { session: restoredSession },
                    error,
                } = await supabase.auth.getSession();
                if (error) {
                    console.warn('Session restore error (silent):', error.message);
                    await appendAuthTrace('check-session:error', { message: error.message });
                    const recoveredSession =
                        await recoverSessionGracefully('initial-check-error') ||
                        await retryPendingGoogleAuthSession('initial-check-error');
                    bootEntryModeRef.current = recoveredSession ? 'oauth_recovery' : 'unknown';
                    if (!recoveredSession) {
                        clearPendingGoogleAuthState();
                    }
                    await applyResolvedSession(recoveredSession);
                } else {
                    await appendAuthTrace('check-session:result', {
                        restored: !!restoredSession,
                        userId: restoredSession?.user?.id ?? null,
                    });
                    if (restoredSession) {
                        await saveSessionBackup(restoredSession);
                    }
                    const recoveredSession =
                        restoredSession ||
                        await recoverSessionGracefully('initial-check-empty') ||
                        await retryPendingGoogleAuthSession();
                    if (restoredSession) {
                        bootEntryModeRef.current = 'session_restore';
                    } else if (recoveredSession) {
                        bootEntryModeRef.current = 'oauth_recovery';
                    }
                    if (!recoveredSession) {
                        clearPendingGoogleAuthState();
                    }
                    await applyResolvedSession(recoveredSession);
                }
            } catch (e) {
                console.error('Critical auth check error:', e);
                captureBootError('critical_auth_check_error', e instanceof Error ? e.message : String(e));
                clearPendingGoogleAuthState();
                setSession(null);
            } finally {
                setLoading(false);
            }
        };

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, nextSession) => {
            void (async () => {
                if (nextSession) {
                    clearIntentionalSignOutPending();
                    await saveSessionBackup(nextSession);
                }

                const intentionalSignOut = event === 'SIGNED_OUT' && isIntentionalSignOutPending();
                await appendAuthTrace('auth:event', {
                    event,
                    hasNextSession: !!nextSession,
                    nextUserId: nextSession?.user?.id ?? null,
                    currentUserId: sessionRef.current?.user?.id ?? null,
                    intentionalSignOut,
                    googlePending: hasClosedBetaGoogleAuthPending(),
                });

                if (event === 'SIGNED_IN' && nextSession && sessionRef.current?.user?.id !== nextSession.user?.id) {
                    bootStartedAtRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
                    bootMetricSentRef.current = false;
                    bootErrorSignatureRef.current = '';
                    bootEntryModeRef.current = 'signed_in';
                } else if (event === 'INITIAL_SESSION' && nextSession) {
                    bootEntryModeRef.current = 'session_restore';
                } else if (event === 'PASSWORD_RECOVERY') {
                    bootStartedAtRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
                    bootMetricSentRef.current = false;
                    bootErrorSignatureRef.current = '';
                    bootEntryModeRef.current = 'password_recovery';
                }

                if ((event as string) === 'TOKEN_REFRESH_ERROR') {
                    await snapshotAuthStorageState('auth:token-refresh-error');
                    setResumeRecoveryPending(true);
                    try {
                        const recoveredSession = await recoverSessionGracefully('token-refresh-error', nextSession || sessionRef.current);
                        if (recoveredSession) {
                            clearPendingGoogleAuthState();
                            await applyResolvedSession(recoveredSession);
                            return;
                        }

                        if (sessionRef.current) {
                            console.warn('Token refresh failed, but an in-memory session still exists. Preserving current session and retrying on the next app resume.');
                            return;
                        }

                        clearPendingGoogleAuthState();
                        authResolutionRef.current += 1;
                        await appendAuthTrace('auth:session-cleared', { reason: 'token-refresh-error' });
                        setSession(null);
                        setPendingGoogleInviteSession(null);
                        console.warn('Token refresh failed on native runtime. Keeping persisted auth storage intact so the next resume/boot can restore the session.');
                    } finally {
                        setResumeRecoveryPending(false);
                    }
                } else if (event === 'SIGNED_OUT' && hasClosedBetaGoogleAuthPending()) {
                    await snapshotAuthStorageState('auth:signed-out:google-pending');
                    const recoveredSession =
                        await recoverSessionGracefully('signed-out-during-google-oauth', sessionRef.current) ||
                        await retryPendingGoogleAuthSession('signed-out-during-google-oauth');

                    if (recoveredSession) {
                        clearPendingGoogleAuthState();
                        await applyResolvedSession(recoveredSession);
                        return;
                    }

                    clearPendingGoogleAuthState();
                    authResolutionRef.current += 1;
                    await appendAuthTrace('auth:session-cleared', { reason: 'signed-out-during-google-oauth' });
                    setSession(null);
                    setPendingGoogleInviteSession(null);
                } else if (event === 'SIGNED_OUT') {
                    await snapshotAuthStorageState('auth:signed-out');
                    if (intentionalSignOut) {
                        clearIntentionalSignOutPending();
                        clearPendingGoogleAuthState();
                        authResolutionRef.current += 1;
                        await appendAuthTrace('auth:session-cleared', { reason: 'intentional-sign-out' });
                        setSession(null);
                        setPendingGoogleInviteSession(null);
                        return;
                    }

                    if (isCapacitorNativeRuntime() || sessionRef.current) {
                        setResumeRecoveryPending(true);
                        try {
                            const recoveredSession = await recoverSessionGracefully('signed-out-native-rescue', sessionRef.current);
                            if (recoveredSession) {
                                clearPendingGoogleAuthState();
                                await applyResolvedSession(recoveredSession);
                                return;
                            }

                            if (sessionRef.current) {
                                console.warn('SIGNED_OUT received while a native/in-memory session still exists. Preserving session until recovery definitively fails.');
                                return;
                            }
                        } finally {
                            setResumeRecoveryPending(false);
                        }
                    }

                    clearPendingGoogleAuthState();
                    authResolutionRef.current += 1;
                    await appendAuthTrace('auth:session-cleared', { reason: 'signed-out-fallback' });
                    setSession(null);
                    setPendingGoogleInviteSession(null);
                } else if (event === 'INITIAL_SESSION' && !nextSession && hasClosedBetaGoogleAuthPending()) {
                    return;
                } else if (!nextSession && hasClosedBetaGoogleAuthPending()) {
                    const recoveredSession =
                        await recoverSessionGracefully(`pending-google-event:${event}`, sessionRef.current) ||
                        await retryPendingGoogleAuthSession(`pending-google-event:${event}`);

                    if (recoveredSession) {
                        clearPendingGoogleAuthState();
                        await applyResolvedSession(recoveredSession);
                    }
                    return;
                } else if (event === 'PASSWORD_RECOVERY') {
                    if (nextSession) clearPendingGoogleAuthState();
                    setShowResetPassword(true);
                    await applyResolvedSession(nextSession);
                } else {
                    if (nextSession || !hasClosedBetaGoogleAuthPending()) {
                        clearPendingGoogleAuthState();
                    }
                    await applyResolvedSession(nextSession);
                }
            })();
        });

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                syncNativeAutoRefresh(false, 'visibility:hidden');
                if (isCapacitorNativeRuntime()) {
                    void persistCurrentSessionBackup('visibility:hidden');
                }
                return;
            }

            if (document.visibilityState === 'visible') {
                syncNativeAutoRefresh(true, 'visibility:visible');
                void recoverSessionOnResume('visibilitychange');
            }
        };

        const handleFocus = () => {
            void recoverSessionOnResume('focus');
        };

        const handlePageShow = () => {
            void recoverSessionOnResume('pageshow');
        };

        let nativeAppStateHandle: { remove: () => Promise<void> } | null = null;
        if (isCapacitorNativeRuntime()) {
            syncNativeAutoRefresh(document.visibilityState !== 'hidden', 'effect:init');
            void CapacitorApp.addListener('appStateChange', ({ isActive }) => {
                if (isActive) {
                    syncNativeAutoRefresh(true, 'appStateChange:active');
                    void recoverSessionOnResume('appStateChange');
                } else {
                    syncNativeAutoRefresh(false, 'appStateChange:inactive');
                    void persistCurrentSessionBackup('appStateChange:inactive');
                }
            }).then((handle) => {
                nativeAppStateHandle = handle;
            });
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus, { passive: true });
        window.addEventListener('pageshow', handlePageShow, { passive: true });

        void checkSession();

        return () => {
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('pageshow', handlePageShow);
            if (nativeAppStateHandle) {
                void nativeAppStateHandle.remove();
            }
            syncNativeAutoRefresh(false, 'effect:cleanup');
        };
    }, [captureBootError, isGoldenInviteGateEnabled]);

    useEffect(() => {
        const handleWindowError = (event: ErrorEvent) => {
            const errorName = event.error instanceof Error && event.error.name
                ? event.error.name
                : 'window_error';
            captureBootError(errorName, event.message || 'Unknown window error');
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const errorName = reason instanceof Error && reason.name
                ? reason.name
                : 'unhandled_rejection';
            const errorMessage = reason instanceof Error
                ? reason.message
                : typeof reason === 'string'
                    ? reason
                    : 'Unknown promise rejection';
            captureBootError(errorName, errorMessage);
        };

        window.addEventListener('error', handleWindowError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleWindowError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [captureBootError]);

    useLayoutEffect(() => {
        const skin = resolveUiSkinId(bootVisuals.mode === 'BASIC' ? 'default' : bootVisuals.skin);
        document.body.setAttribute('data-skin', skin);
        document.documentElement.setAttribute('data-skin', skin);
    }, [bootVisuals]);

    useEffect(() => {
        const root = document.documentElement;
        let hasOrientation = false;
        let mouseListener: ((event: MouseEvent) => void) | null = null;

        const updateTilt = (x: number, y: number) => {
            root.style.setProperty('--tilt-x', x.toFixed(2));
            root.style.setProperty('--tilt-y', y.toFixed(2));
        };

        const handleOrientation = (event: DeviceOrientationEvent) => {
            if (event.gamma === null || event.beta === null) return;
            hasOrientation = true;
            const x = Math.max(-18, Math.min(18, event.gamma));
            const y = Math.max(-18, Math.min(18, event.beta));
            updateTilt(x, y);
        };

        const attachMouseFallback = () => {
            mouseListener = (event: MouseEvent) => {
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                const x = ((event.clientX - centerX) / centerX) * 10;
                const y = ((event.clientY - centerY) / centerY) * 10;
                updateTilt(x, y);
            };
            window.addEventListener('mousemove', mouseListener, { passive: true });
        };

        window.addEventListener('deviceorientation', handleOrientation, true);
        const fallbackTimer = window.setTimeout(() => {
            if (!hasOrientation) attachMouseFallback();
        }, 800);

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
            window.clearTimeout(fallbackTimer);
            if (mouseListener) window.removeEventListener('mousemove', mouseListener);
        };
    }, []);

    return (
        <>
            {renderMode === 'legacy' ? (
                <Suspense fallback={<div className="min-h-screen bg-black" />}>
                    <LegacyRenderView />
                </Suspense>
            ) : (
                <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-transparent font-sans text-white">
                    {showFullScreenBoot ? (
                        <AppBootScreen accentColor={bootVisuals.mode === 'BASIC' ? '#ffffff' : undefined} mode={bootVisuals.mode} theme={bootVisuals.theme} />
                    ) : (
                        <Suspense fallback={<AppBootScreen accentColor={bootVisuals.mode === 'BASIC' ? '#ffffff' : undefined} mode={bootVisuals.mode} theme={bootVisuals.theme} />}>
                            {session ? <AuthenticatedApp session={session} onReady={handleAuthenticatedAppReady} /> : <LoginView />}
                        </Suspense>
                    )}
                    {showResetPassword && (
                        <Suspense fallback={null}>
                            <ResetPasswordOverlay onClose={() => setShowResetPassword(false)} />
                        </Suspense>
                    )}
                    {!showFullScreenBoot && pendingGoogleInviteSession && (
                        <ClosedBetaGoogleInviteModal
                            session={pendingGoogleInviteSession}
                            onClose={() => setPendingGoogleInviteSession(null)}
                            onComplete={(nextSession) => {
                                setPendingGoogleInviteSession(null);
                                setSession(nextSession);
                            }}
                        />
                    )}
                </div>
            )}
            {!isSplashComplete && renderMode !== 'legacy' && (
                <SplashScreen onComplete={handleSplashComplete} isLoading={showFullScreenBoot || (Boolean(session) && !isAppContentReady)} />
            )}
        </>
    );
};

export default App;

