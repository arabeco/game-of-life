import React, { Suspense, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { SplashScreen } from './components/SplashScreen';

const LoginView = React.lazy(() => import('./views/LoginView').then((m) => ({ default: m.LoginView })));
const LegacyRenderView = React.lazy(() => import('./views/LegacyRenderView').then((m) => ({ default: m.LegacyRenderView })));
const AuthenticatedApp = React.lazy(() => import('./components/AuthenticatedApp'));
const ResetPasswordOverlay = React.lazy(() => import('./components/AppRuntimeOverlays').then((m) => ({ default: m.ResetPasswordOverlay })));

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const renderMode = useMemo(() => new URLSearchParams(window.location.search).get('render'), []);

    const handleSplashComplete = () => {
        sessionStorage.setItem('hasSeenSplash', 'true');
    };

    useEffect(() => {
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
                    setSession(restoredSession);
                }
            } catch (e) {
                console.error('Critical auth check error:', e);
                setSession(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, nextSession) => {
            if (event === 'SIGNED_OUT' || (event as string) === 'TOKEN_REFRESH_ERROR') {
                setSession(null);
                if ((event as string) === 'TOKEN_REFRESH_ERROR') {
                    supabase.auth.signOut();
                }
            } else if (event === 'PASSWORD_RECOVERY') {
                setShowResetPassword(true);
                setSession(nextSession);
            } else {
                setSession(nextSession);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

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

    if (renderMode === 'legacy') {
        return (
            <Suspense fallback={<div className="min-h-screen bg-black" />}>
                <LegacyRenderView />
            </Suspense>
        );
    }

    if (loading) {
        return <SplashScreen onComplete={handleSplashComplete} isLoading={loading} />;
    }

    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-black font-sans text-white">
            <Suspense fallback={<div className="min-h-screen bg-black" />}>
                {session ? <AuthenticatedApp session={session} /> : <LoginView />}
            </Suspense>
            {showResetPassword && (
                <Suspense fallback={null}>
                    <ResetPasswordOverlay onClose={() => setShowResetPassword(false)} />
                </Suspense>
            )}
        </div>
    );
};

export default App;
