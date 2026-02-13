import React, { useState, useEffect, useRef } from 'react';
import { AssetsView } from './views/AssetsView';
import { ArenasView } from './views/ArenasView';
import { PlannerView } from './views/PlannerView';
import { SocialView } from './views/SocialView';
import { SettingsView } from './views/SettingsView';
import { ProfileView } from './views/ProfileView';
import { ReportsView } from './views/ReportsView';
import { LoginView } from './views/LoginView';
import { GameProvider, useGame } from './contexts/GameContext';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';
import { TutorialOverlay } from './components/TutorialOverlay';
import { GlobalHeader } from './components/GlobalHeader';
import { AssetIcon, ArenaIcon, PlannerIcon, SocialIcon, ConfigIcon } from './components/Icons';
import { AchievementModal } from './components/AchievementModal';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

// --- MODO DE CONSTRUÇÃO OFFLINE ---
// Defina como 'false' para reativar a autenticação do Supabase.
const OFFLINE_MODE = false;

type View = 'assets' | 'arenas' | 'planner' | 'social' | 'settings' | 'reports';

const AppWithTutorial: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('assets');
    const [isProfileVisible, setProfileVisible] = useState(false);
    const [isReportsVisible, setReportsVisible] = useState(false);
    const { isTutorialActive, currentStep, nextStep, setSpotlight } = useTutorial();

    const arenasNavRef = useRef<HTMLButtonElement>(null);
    const plannerNavRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isTutorialActive) return;

        // Step 1: Go to Arenas
        if (currentStep === 1 && arenasNavRef.current) {
            const rect = arenasNavRef.current.getBoundingClientRect();
            setSpotlight(rect, {
                title: "Passo 1: Arenas",
                text: "Acesse suas Arenas. Elas representam os grandes contextos da sua vida, como 'Trabalho' ou 'Saúde'.",
            });
        }
        // Step 6: Go to Planner
        else if (currentStep === 6 && plannerNavRef.current) {
            const rect = plannerNavRef.current.getBoundingClientRect();
             setSpotlight(rect, {
                title: "Passo 6: O Planner",
                text: "Excelente. Agora vamos organizar sua execução. Volte ao Planner.",
            });
        }

    }, [isTutorialActive, currentStep, setSpotlight]);

    const handleSetView = (view: View) => {
        if (isTutorialActive) {
            if (currentStep === 1 && view === 'arenas') {
                setSpotlight(null, null);
                nextStep();
            } else if (currentStep === 6 && view === 'planner') {
                setSpotlight(null, null);
                nextStep();
            } else {
                return; // Block navigation during other tutorial steps
            }
        }
        setCurrentView(view);
    };

    const renderView = () => {
        switch (currentView) {
            case 'assets': return <AssetsView />;
            case 'arenas': return <ArenasView />;
            case 'planner': return <PlannerView onReportsClick={() => setReportsVisible(true)} />;
            case 'social': return <SocialView />;
            case 'settings': return <SettingsView />;
            default: return <AssetsView />;
        }
    };

    const NavItem: React.FC<{ view: View; label: string; icon: React.ReactNode; navRef?: React.Ref<HTMLButtonElement> }> = ({ view, label, icon, navRef }) => (
        <button
            ref={navRef}
            onClick={() => handleSetView(view)}
            className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${
                currentView === view ? 'gold-text' : 'text-gray-500 hover:text-gray-300'
            }`}
        >
            {icon}
            <span className="text-xs font-bold tracking-wider mt-1">{label}</span>
            {currentView === view && <div className="w-4 h-0.5 bg-current rounded-full mt-1"></div>}
        </button>
    );

    return (
        <div className="min-h-screen text-gray-200 font-sans flex flex-col">
            <TutorialOverlay />
            <GlobalHeader onProfileClick={() => setProfileVisible(true)} />
            <main className="flex-1 pt-20 pb-16 flex flex-col">
                <div className="max-w-[420px] mx-auto w-full h-full flex flex-col">
                    {renderView()}
                </div>
            </main>
            
            {isProfileVisible && <ProfileView onClose={() => setProfileVisible(false)} />}
            {isReportsVisible && <ReportsView onClose={() => setReportsVisible(false)} />}
            
            <footer className="fixed bottom-0 left-0 right-0 z-30 bg-black/50 backdrop-blur-lg border-t border-[var(--glass-border)]">
                <div className="max-w-[420px] mx-auto">
                    <div className="flex justify-around items-center h-16">
                        <NavItem view="assets" label="ATIVOS" icon={<AssetIcon />} />
                        <NavItem view="arenas" label="ARENAS" icon={<ArenaIcon />} navRef={arenasNavRef} />
                        <NavItem view="planner" label="PLANNER" icon={<PlannerIcon />} navRef={plannerNavRef} />
                        <NavItem view="social" label="SOCIAL" icon={<SocialIcon />} />
                        <NavItem view="settings" label="CONFIG" icon={<ConfigIcon />} />
                    </div>
                </div>
            </footer>
        </div>
    );
};

const MainApp: React.FC = () => {
    const { isNewUser, achievementUnlocked, setAchievementUnlocked } = useGame();
    const { isTutorialCompleted, startTutorial } = useTutorial();

    useEffect(() => {
        if (isNewUser && !isTutorialCompleted) {
            const timer = setTimeout(() => startTutorial(), 500); // Small delay to ensure UI is ready
            return () => clearTimeout(timer);
        }
    }, [isNewUser, isTutorialCompleted, startTutorial]);

    return (
        <>
            <AppWithTutorial />
            {achievementUnlocked && (
                <AchievementModal 
                    achievement={achievementUnlocked}
                    onClose={() => setAchievementUnlocked(null)}
                />
            )}
        </>
    );
}

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // --- Auth Logic ---
        if (OFFLINE_MODE) {
            setLoading(false);
            return;
        }

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);
    
    const handleGuestLogin = () => {
        setIsGuest(true);
    };

    if (loading && !OFFLINE_MODE) {
        return <div className="w-screen h-screen flex items-center justify-center bg-black">Carregando...</div>;
    }

    const renderContent = () => {
        if (OFFLINE_MODE) {
            // Em modo offline, sempre mostramos o MainApp, assumindo o "modo convidado".
            return <MainApp />;
        }
        
        return (session || isGuest) 
            ? <MainApp /> 
            : <LoginView onGuestLogin={handleGuestLogin} />;
    };

    return (
        <GameProvider>
          <TutorialProvider>
            {renderContent()}
          </TutorialProvider>
        </GameProvider>
    );
};

export default App;