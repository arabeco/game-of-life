import React, { Suspense, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { SplashScreen } from './components/SplashScreen';
import { ClosedBetaGoogleInviteModal } from './components/ClosedBetaGoogleInviteModal';
import { SupabaseService } from './services/SupabaseService';
import { saveClosedBetaGoogleRedirect } from './utils/closedBetaAuth';
import { parseBooleanEnvFlag } from './utils/envFlags';
import { startInstallPromptCapture } from './utils/installPrompt';
import { signOutAndClearSupabaseSession } from './utils/authSession';
import { ensureClosedBetaUserProfile } from './utils/closedBetaProfile';

const LoginView = React.lazy(() => import('./views/LoginView').then((m) => ({ default: m.LoginView })));
const LegacyRenderView = React.lazy(() => import('./views/LegacyRenderView').then((m) => ({ default: m.LegacyRenderView })));
const AuthenticatedApp = React.lazy(() => import('./components/AuthenticatedApp'));
const ResetPasswordOverlay = React.lazy(() => import('./components/AppRuntimeOverlays').then((m) => ({ default: m.ResetPasswordOverlay })));
const STORAGE_KEY_PROFILE = 'gol_user_profile_v2';

const AppBootScreen: React.FC<{ accentColor?: string; mode?: 'GAME' | 'BASIC'; theme?: 'LIGHT' | 'DARK' | null }> = ({
    accentColor = '#d4af37',
    mode = 'GAME',
    theme = 'DARK',
}) => (
    <div
        className={`relative flex min-h-screen items-center justify-center overflow-hidden text-white ${mode === 'BASIC' ? `mode-office theme-${(theme || 'DARK').toLowerCase()}` : ''}`}
        style={{
            ['--skin-accent-color' as string]: accentColor,
            background: 'radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 28%), linear-gradient(180deg, #050505 0%, #000000 100%)',
        }}
        data-skin={mode === 'BASIC' ? 'default' : undefined}
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
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [isSplashComplete, setIsSplashComplete] = useState(() => sessionStorage.getItem('hasSeenSplash') === 'true');
    const [bootVisuals, setBootVisuals] = useState<{ skin: string; mode: 'GAME' | 'BASIC'; theme: 'LIGHT' | 'DARK' | null }>({
        skin: 'BASIC',
        mode: 'GAME',
        theme: 'DARK',
    });
    const renderMode = useMemo(() => new URLSearchParams(window.location.search).get('render'), []);
    const disableGoldInviteByEnv = parseBooleanEnvFlag(import.meta.env.VITE_DISABLE_GOLD_INVITE);
    const isGoldenInviteGateEnabled = !import.meta.env.DEV && !disableGoldInviteByEnv;

    const handleSplashComplete = () => {
        sessionStorage.setItem('hasSeenSplash', 'true');
        setIsSplashComplete(true);
    };

    useEffect(() => {
        startInstallPromptCapture();
        void import('./views/LoginView');
        void import('./components/AuthenticatedApp');

        const preloadBootVisuals = (currentUserId?: string | null) => {
            if (!currentUserId) return;

            try {
                const cached = localStorage.getItem(`${STORAGE_KEY_PROFILE}_${currentUserId}`);
                if (!cached) return;

                const parsed = JSON.parse(cached);
                setBootVisuals({
                    skin: parsed?.skin || 'BASIC',
                    mode: parsed?.appMode === 'BASIC' ? 'BASIC' : 'GAME',
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

        const resolveClosedBetaSession = async (candidate: Session | null): Promise<Session | null> => {
            if (!candidate) return null;

            preloadBootVisuals(candidate.user?.id);

            if (!isGoldenInviteGateEnabled) {
                setPendingGoogleInviteSession(null);
                return candidate;
            }

            const accessStatus = await SupabaseService.getClosedBetaAccessStatus();
            const hasProfile = accessStatus?.hasProfile === true || await hasUserProfile(candidate.user?.id);

            if (accessStatus?.reentryBlocked && isGoogleSession(candidate)) {
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
                await signOutAndClearSupabaseSession('local');
                return null;
            }

            if (!hasProfile && accessStatus?.hasInvite) {
                const repairResult = await ensureClosedBetaUserProfile(candidate);
                if (repairResult.success) {
                    setPendingGoogleInviteSession(null);
                    return candidate;
                }

                console.error('Failed to rebuild user_profile for authenticated closed beta account:', repairResult.error);
                saveClosedBetaGoogleRedirect({
                    mode: 'login',
                    email: candidate.user.email || '',
                    message: repairResult.error || 'Seu acesso ja tinha Bilhete vinculado, mas nao consegui reconstruir o perfil agora.',
                });
                await signOutAndClearSupabaseSession('local');
                return null;
            }

            if (!isGoogleSession(candidate)) {
                setPendingGoogleInviteSession(null);
                return candidate;
            }

            const deletedAccountBlock = candidate.user.email
                ? await SupabaseService.getDeletedAccountBlockStatus(candidate.user.email)
                : null;

            if (deletedAccountBlock?.blocked) {
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
                await signOutAndClearSupabaseSession('local');
                return null;
            }

            if (hasProfile) {
                setPendingGoogleInviteSession(null);
                return candidate;
            }

            setPendingGoogleInviteSession(candidate);
            return null;
        };

        const applyResolvedSession = async (candidate: Session | null) => {
            setAuthGuardLoading(true);
            try {
                const resolvedSession = await resolveClosedBetaSession(candidate);
                setSession(resolvedSession);
            } finally {
                setAuthGuardLoading(false);
            }
        };

        const checkSession = async () => {
            try {
                const {
                    data: { session: restoredSession },
                    error,
                } = await supabase.auth.getSession();
                if (error) {
                    console.warn('Session restore error (silent):', error.message);
                    setSession(null);
                } else {
                    await applyResolvedSession(restoredSession);
                }
            } catch (e) {
                console.error('Critical auth check error:', e);
                setSession(null);
            } finally {
                setLoading(false);
            }
        };

        void checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, nextSession) => {
            void (async () => {
                if (event === 'SIGNED_OUT' || (event as string) === 'TOKEN_REFRESH_ERROR') {
                    setSession(null);
                    setPendingGoogleInviteSession(null);
                    if ((event as string) === 'TOKEN_REFRESH_ERROR') {
                        await signOutAndClearSupabaseSession('global');
                    }
                } else if (event === 'PASSWORD_RECOVERY') {
                    setShowResetPassword(true);
                    await applyResolvedSession(nextSession);
                } else {
                    await applyResolvedSession(nextSession);
                }
            })();
        });

        return () => subscription.unsubscribe();
    }, [isGoldenInviteGateEnabled]);

    useEffect(() => {
        const skin = bootVisuals.mode === 'BASIC' ? 'default' : bootVisuals.skin;
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
                <div className="relative flex min-h-screen flex-col overflow-hidden bg-black font-sans text-white">
                    {loading || authGuardLoading ? (
                        <AppBootScreen accentColor={bootVisuals.mode === 'BASIC' ? '#ffffff' : undefined} mode={bootVisuals.mode} theme={bootVisuals.theme} />
                    ) : (
                        <Suspense fallback={<AppBootScreen accentColor={bootVisuals.mode === 'BASIC' ? '#ffffff' : undefined} mode={bootVisuals.mode} theme={bootVisuals.theme} />}>
                            {session ? <AuthenticatedApp session={session} /> : <LoginView />}
                        </Suspense>
                    )}
                    {showResetPassword && (
                        <Suspense fallback={null}>
                            <ResetPasswordOverlay onClose={() => setShowResetPassword(false)} />
                        </Suspense>
                    )}
                    {pendingGoogleInviteSession && (
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
                <SplashScreen onComplete={handleSplashComplete} isLoading={loading || authGuardLoading} />
            )}
        </>
    );
};

export default App;
