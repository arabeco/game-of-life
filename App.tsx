import React, { useState, useEffect, useRef } from 'react';
import { AssetsView } from './views/AssetsView';
import { ArenasView } from './views/ArenasView';
import { PlannerView } from './views/PlannerView';
import MundoView from './views/MundoView';
import { SettingsView } from './views/SettingsView';
import { ProfileView } from './views/ProfileView';
import { ReportsView } from './views/ReportsView';
import { LoginView } from './views/LoginView';
import { GameProvider, useGame, PROFILE_FLAG_TERMS_ACCEPTED, PROFILE_FLAG_TERMS_PENDING, PROFILE_FLAG_TUTORIAL_COMPLETED } from './contexts/GameContext';
import { CodexBuilderProvider, useCodexBuilder } from './contexts/CodexBuilderContext';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';
import { OracleTutorialOverlay } from './components/OracleTutorialOverlay';
import { TUTORIAL_STEPS } from './constants/tutorialSteps';
import { GlobalHeader } from './components/GlobalHeader';
import { AssetIcon, ArenaIcon, PlannerIcon, SocialIcon, ConfigIcon, GameLogoIcon } from './components/Icons';
import { AchievementModal } from './components/AchievementModal';
import { supabase } from './supabaseClient';
import { GoldenToast } from './components/GoldenToast';
import type { Session } from '@supabase/supabase-js';
import { useLongPress } from './hooks/useLongPress';

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

type View = 'assets' | 'arenas' | 'planner' | 'social' | 'settings' | 'reports';

const TermsOverlay: React.FC<{ open: boolean; onAccept: () => void; }> = ({ open, onAccept }) => {
    const clauses = [
        'O DESPERTAR DO SOBERANO\n\nPara acessar a interface, você deve aceitar os termos do pacto que regem este domínio.',
        'I. PROPRIEDADE ABSOLUTA\nSeus dados são sua soberania. O Life OS é “Local First”: anotações, diários e SITREPS residem no seu dispositivo. A nuvem é apenas o seu espelho de segurança. Nós não mineramos sua vida.',
        'II. O VÍNCULO DE MENTORIA\nAo aceitar um Mentor, você autoriza a visualização parcial do seu progresso. Seus diários privados permanecem ocultos. O Life OS não se responsabiliza por orientações de terceiros; você é o único executor de suas ações.',
        'III. ISENÇÃO DE RESPONSABILIDADE\nEste sistema é uma ferramenta de autogestão. Não somos médicos, terapeutas ou consultores financeiros. O risco da execução física, mental ou financeira de qualquer Codex é inteiramente do Soberano.',
        'IV. DIREITO AO EXÍLIO\nA qualquer momento, você pode incinerar seus dados. O comando “Deletar Conta” é definitivo e apaga sua existência em nossos servidores, sem rastro ou recuperação.',
    ];
    const [step, setStep] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isHolding, setIsHolding] = useState(false);
    const [isSealing, setIsSealing] = useState(false);
    const holdDurationMs = 800;
    const currentClause = clauses[step];
    const isLast = step === clauses.length - 1;

    useEffect(() => {
        if (!open) return;
        setTypedText('');
        setIsTyping(true);
        setIsHolding(false);
        let i = 0;
        const timer = window.setInterval(() => {
            i += 1;
            setTypedText(currentClause.slice(0, i));
            if (i >= currentClause.length) {
                window.clearInterval(timer);
                setIsTyping(false);
            }
        }, 26);
        return () => window.clearInterval(timer);
    }, [currentClause, open]);

    const handleNext = () => {
        if (isTyping || isLast) return;
        setStep(prev => Math.min(prev + 1, clauses.length - 1));
    };

    const handleAccept = () => {
        setIsHolding(false);
        setIsSealing(true);
        window.setTimeout(() => {
            setIsSealing(false);
            setStep(0);
            onAccept();
        }, 420);
    };

    const longPressEvents = useLongPress({
        onLongPress: () => {
            if (isTyping) {
                setTypedText(currentClause);
                setIsTyping(false);
            }
            if (isLast) handleAccept();
            else setStep(prev => Math.min(prev + 1, clauses.length - 1));
        },
        onLongPressCancel: () => setIsHolding(false),
        onLongPressRelease: () => setIsHolding(false),
        onClick: () => setIsHolding(false),
        delay: holdDurationMs,
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsHolding(true);
        longPressEvents.onMouseDown?.(e);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsHolding(true);
        longPressEvents.onTouchStart?.(e);
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in"
            style={{ background: 'radial-gradient(circle at center, #0A0A0A 0%, #000000 72%)' }}
        >
            <div className="absolute inset-4 border border-[var(--skin-line-color)] rounded-[32px]" />
            {isSealing && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--sephirot-glow-color),rgba(0,0,0,0.95))] animate-fade-in" />}
            <div className="relative w-full max-w-md mx-auto h-full px-6 py-12 flex flex-col justify-center gap-10">
                <div className="text-center space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.45em] text-[#8f8f8f]">Pacto de Soberania</p>
                    <h1
                        className="text-2xl uppercase tracking-[0.18em]"
                        style={{ color: 'var(--skin-accent-color)', textShadow: '0 0 16px var(--sephirot-glow-color)', fontFamily: '"Cinzel Decorative","Playfair Display",serif' }}
                    >
                        O Despertar do Soberano
                    </h1>
                </div>

                <div className="relative min-h-[220px] text-base leading-relaxed whitespace-pre-line text-[#E0E0E0] text-center">
                    {typedText}
                    {isTyping && <span className="inline-block w-2 h-5 bg-[var(--skin-accent-color)] ml-1 animate-pulse" />}
                    {isTyping && <div className="absolute inset-0 dust-layer" />}
                </div>

                <div className="flex flex-col items-center gap-3">
                    <div
                        className="relative w-32 h-32 rounded-full border border-[var(--skin-accent-color)] flex items-center justify-center text-[var(--skin-accent-color)] font-black tracking-[0.2em] select-none"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        onContextMenu={longPressEvents.onContextMenu}
                        style={{ touchAction: 'none', fontFamily: '"Cinzel Decorative","Playfair Display",serif' }}
                    >
                        SELO
                        <div className="absolute inset-2 rounded-full border border-[var(--skin-line-color)]" />
                        {isHolding && (
                            <div
                                className="absolute inset-2 rounded-full seal-fill"
                                style={{ animationDuration: `${holdDurationMs}ms` }}
                            />
                        )}
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-[#9b9b9b]">
                        {isLast ? 'Segure para selar o pacto' : 'Segure para avançar'}
                    </p>
                </div>
            </div>
            <style>{`
                .seal-fill {
                    background: radial-gradient(circle at center, var(--sephirot-glow-color), rgba(197,160,89,0.08));
                    animation: sealFill linear forwards;
                    box-shadow: 0 0 25px var(--sephirot-glow-color);
                    clip-path: inset(100% 0 0 0);
                }
                .dust-layer {
                    background-image:
                        radial-gradient(circle at 20% 30%, var(--sephirot-glow-color) 0 2px, transparent 3px),
                        radial-gradient(circle at 60% 35%, var(--sephirot-glow-color) 0 1px, transparent 3px),
                        radial-gradient(circle at 35% 70%, var(--sephirot-glow-color) 0 2px, transparent 3px),
                        radial-gradient(circle at 75% 65%, var(--sephirot-glow-color) 0 1px, transparent 3px);
                    opacity: 0.65;
                    animation: dustFade 1.6s ease-out infinite;
                    pointer-events: none;
                }
                @keyframes sealFill {
                    to { clip-path: inset(0% 0 0 0); }
                }
                @keyframes dustFade {
                    0% { opacity: 0.2; transform: scale(0.98); }
                    60% { opacity: 0.75; transform: scale(1); }
                    100% { opacity: 0.2; transform: scale(1.02); }
                }
            `}</style>
        </div>
    );
};

const TutorialGateOverlay: React.FC<{ open: boolean; onStart: () => void; onSkip: () => void; }> = ({ open, onStart, onSkip }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[9998] flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 space-y-4 max-w-sm text-center animate-fade-in">
                <h2 className="text-2xl font-bold text-white">Você já viu o tutorial?</h2>
                <p className="text-gray-300">Se já concluiu, seguimos direto. Se não, te guio pelos primeiros passos.</p>
                <div className="flex space-x-2">
                    <button onClick={onSkip} className="w-full py-2 rounded-lg bg-gray-700 text-white">Já vi</button>
                    <button onClick={onStart} className="w-full py-2 rounded-lg bg-yellow-500 text-black font-bold">Quero ver</button>
                </div>
            </div>
        </div>
    );
};

const BootRitualOverlay: React.FC<{ open: boolean }> = ({ open }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(7,6,4,0.8),rgba(0,0,0,0.98))]" />
            <div className="absolute inset-8 rounded-[36px] border border-[var(--skin-line-color)] boot-frame" />
            <div className="relative flex flex-col items-center gap-8">
                <div className="relative w-48 h-48">
                    <div className="absolute inset-0 boot-orbit" />
                    <div className="absolute inset-6 boot-orbit boot-orbit-delayed" />
                    <div className="absolute inset-12 boot-orbit" />
                    <div className="absolute left-1/2 top-1/2 w-40 h-px -translate-x-1/2 -translate-y-1/2 boot-line" />
                    <div className="absolute left-1/2 top-1/2 w-px h-40 -translate-x-1/2 -translate-y-1/2 boot-line" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="boot-logo">
                            <GameLogoIcon />
                        </div>
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.5em] text-[#7f7f7f]">Ritual de Boot</p>
                    <p className="text-sm font-semibold text-[var(--skin-accent-color)] tracking-[0.2em]">Modo Soberano</p>
                </div>
            </div>
            <style>{`
                .boot-frame { animation: bootFrame 2s ease-out forwards; }
                .boot-orbit { border: 1px solid var(--skin-line-color); border-radius: 9999px; box-shadow: 0 0 25px var(--sephirot-glow-color); animation: bootOrbit 2s ease-out forwards; }
                .boot-orbit-delayed { animation-delay: 0.25s; }
                .boot-line { background: linear-gradient(90deg, transparent, var(--skin-accent-color), transparent); animation: bootLine 2s ease-out forwards; }
                .boot-logo { color: var(--skin-accent-color); filter: drop-shadow(0 0 18px var(--sephirot-glow-color)); transform: scale(0.6); opacity: 0; animation: bootLogo 2s ease-out forwards; }
                @keyframes bootOrbit { 0% { opacity: 0; transform: scale(0.75); } 45% { opacity: 1; transform: scale(1); } 100% { opacity: 0.9; transform: scale(1.02); } }
                @keyframes bootLine { 0% { opacity: 0; transform: scaleX(0.6); } 40% { opacity: 0.7; transform: scaleX(1); } 100% { opacity: 0.25; transform: scaleX(1.1); } }
                @keyframes bootLogo { 0% { opacity: 0; transform: scale(0.4) rotate(-6deg); } 55% { opacity: 1; transform: scale(1) rotate(0deg); } 100% { opacity: 0.85; transform: scale(1.05); } }
                @keyframes bootFrame { 0% { opacity: 0; } 60% { opacity: 1; } 100% { opacity: 0.8; } }
            `}</style>
        </div>
    );
};

const AppWithTutorial: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('assets');
    const [isProfileVisible, setProfileVisible] = useState(false);
    const [isReportsVisible, setReportsVisible] = useState(false);
    const { isBuilderMode, draftName, setDraftName, exitBuilderMode, packDraftToJson } = useCodexBuilder();
    const { userProfile } = useGame();
    const { isTutorialActive, currentStep } = useTutorial();

    useEffect(() => {
        if (isTutorialActive) {
            const step = TUTORIAL_STEPS[currentStep];
            if (step) {
                setCurrentView(step.view);
            }
        }
    }, [isTutorialActive, currentStep]);

    useEffect(() => {
        if (isBuilderMode) setCurrentView('arenas');
    }, [isBuilderMode]);

    const handleSetView = (view: View) => {
        if (isBuilderMode && view !== 'arenas') return;
        setCurrentView(view);
    };

    const handlePackDraft = async () => {
        const json = packDraftToJson();
        const safeName = (draftName || 'codex').trim().replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '_');
        const fileName = `${safeName || 'codex'}.json`;

        try {
            const parsed = JSON.parse(json) as { schemaVersion?: number; metadata?: { name?: string; author?: string; price?: number; description?: string } };
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user.id;
            
            // Verificar se temos um userId válido antes de tentar inserir
            if (userId && isUuid(userId)) {
                await supabase
                    .from('codexes')
                    .insert({
                        owner_id: userId,
                        schema_version: typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1,
                        name: (parsed.metadata?.name || draftName || 'Codex').toString(),
                        author: parsed.metadata?.author ?? null,
                        price: typeof parsed.metadata?.price === 'number' ? parsed.metadata.price : null,
                        description: parsed.metadata?.description ?? null,
                        template: parsed,
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
        switch (currentView) {
            case 'assets': return <AssetsView />;
            case 'arenas': return <ArenasView />;
            case 'planner': return <PlannerView onReportsClick={() => setReportsVisible(true)} />;
            case 'social': return <MundoView />;
            case 'settings': return <SettingsView />;
            default: return <AssetsView />;
        }
    };

    const NavItem: React.FC<{ view: View; label: string; icon: React.ReactNode; navRef?: React.Ref<HTMLButtonElement> }> = ({ view, label, icon, navRef }) => (
        <button
            ref={navRef}
            onClick={() => handleSetView(view)}
            className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${
                currentView === view ? 'accent-text' : 'text-gray-500 hover:text-gray-300'
            }`}
        >
            {icon}
            <span className="text-xs font-bold tracking-wider mt-1">{label}</span>
            {currentView === view && <div className="w-4 h-0.5 bg-current rounded-full mt-1"></div>}
        </button>
    );

    return (
        <div 
            className={`min-h-screen text-gray-200 font-sans flex flex-col ${isBuilderMode ? 'border-4 border-yellow-400 border-dashed' : ''}`}
            data-skin={userProfile.skin}
        >
            <OracleTutorialOverlay />
            {isBuilderMode && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500/15 backdrop-blur-lg border-b border-yellow-500/40">
                    <div className="max-w-[420px] mx-auto px-4 h-11 flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest text-yellow-300 whitespace-nowrap">MODO ARQUITETO</span>
                        <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="flex-1 bg-black/30 border border-yellow-500/40 rounded-md px-2 py-1 text-xs font-bold text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                            placeholder="Nome do Codex"
                        />
                        <button
                            onClick={exitBuilderMode}
                            className="text-[11px] font-black tracking-wider text-gray-200 px-2 py-1 rounded-md bg-black/30 border border-yellow-500/30 hover:bg-black/40"
                        >
                            CANCELAR
                        </button>
                        <button
                            onClick={handlePackDraft}
                            className="text-[11px] font-black tracking-wider text-black px-2 py-1 rounded-md bg-yellow-400 hover:bg-yellow-300"
                        >
                            EMPACOTAR
                        </button>
                    </div>
                </div>
            )}
            <GlobalHeader onProfileClick={() => setProfileVisible(true)} topOffsetPx={isBuilderMode ? 44 : 0} />
            <main className={`flex-1 ${isBuilderMode ? 'pt-32' : 'pt-20'} pb-16 flex flex-col`}>
                <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                    {renderView()}
                </div>
            </main>
            
            {isProfileVisible && <ProfileView onClose={() => setProfileVisible(false)} />}
            {isReportsVisible && <ReportsView onClose={() => setReportsVisible(false)} />}
            
            <footer className="fixed bottom-0 left-0 right-0 z-30 bg-black/50 backdrop-blur-lg border-t border-[var(--glass-border)]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-around items-center h-16">
                        <NavItem view="assets" label="ATIVOS" icon={<AssetIcon />} />
                        <NavItem view="arenas" label="ARENAS" icon={<ArenaIcon />} />
                        <NavItem view="planner" label="PLANNER" icon={<PlannerIcon />} />
                        <NavItem view="social" label="MUNDO" icon={<SocialIcon />} />
                        <NavItem view="settings" label="CONFIG" icon={<ConfigIcon />} />
                    </div>
                </div>
            </footer>
        </div>
    );
};

const MainApp: React.FC = () => {
    const { achievementUnlocked, setAchievementUnlocked, userProfile, updateUserProfile, addProfileFlag, toast, hideToast } = useGame();
    const { isTutorialCompleted, isTutorialActive, startTutorial } = useTutorial();
    const [showTerms, setShowTerms] = useState(false);

    // Online Only: Removed localStorage migration for tutorial completion
    
    useEffect(() => {
        if (userProfile.id === 'placeholder_user') return;
        if (!isTutorialCompleted && !isTutorialActive) {
            startTutorial();
        }
    }, [userProfile.id, isTutorialCompleted, isTutorialActive, startTutorial]);

    useEffect(() => {
        // Não mostrar termos para contas privilegiadas
        if (userProfile.role === 'admin' || userProfile.role === 'gm' || userProfile.role === 'admin_gm') {
            setShowTerms(false);
            return;
        }

        const completed = userProfile.completedSeasonMissions || [];
        const acceptedByProfile = completed.includes(PROFILE_FLAG_TERMS_ACCEPTED);
        const pendingByProfile = completed.includes(PROFILE_FLAG_TERMS_PENDING);
        if (!pendingByProfile || acceptedByProfile) {
            setShowTerms(false);
            return;
        }

        setShowTerms(true);
    }, [userProfile.id, userProfile.completedSeasonMissions, userProfile.role]);

    const handleAcceptTerms = () => {
        const completed = userProfile.completedSeasonMissions || [];
        const nextCompleted = completed.filter(flag => flag !== PROFILE_FLAG_TERMS_PENDING);
        if (!nextCompleted.includes(PROFILE_FLAG_TERMS_ACCEPTED)) nextCompleted.push(PROFILE_FLAG_TERMS_ACCEPTED);
        updateUserProfile({ completedSeasonMissions: nextCompleted });
        setShowTerms(false);
    };

    // Handle tutorial completion
    useEffect(() => {
        if (isTutorialCompleted && !(userProfile.completedSeasonMissions || []).includes(PROFILE_FLAG_TUTORIAL_COMPLETED)) {
            addProfileFlag(PROFILE_FLAG_TUTORIAL_COMPLETED);
        }
    }, [isTutorialCompleted, userProfile.completedSeasonMissions]);

    return (
        <>
            <AppWithTutorial />
            <TermsOverlay open={showTerms} onAccept={handleAcceptTerms} />
            {achievementUnlocked && (
                <AchievementModal 
                    achievement={achievementUnlocked}
                    onClose={() => setAchievementUnlocked(null)}
                />
            )}
            {toast.visible && (
                <GoldenToast 
                    message={toast.message} 
                    onClose={hideToast}
                />
            )}
        </>
    );
}

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBootRitual, setShowBootRitual] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const lastSoundAtRef = useRef(0);
    useEffect(() => {
        // --- Auth Logic ---
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event as unknown as string) === 'TOKEN_REFRESH_ERROR') {
                supabase.auth.signOut();
                setSession(null);
            } else {
                setSession(session);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const playClickSound = () => {
            const now = performance.now();
            if (now - lastSoundAtRef.current < 40) return;
            lastSoundAtRef.current = now;

            const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextClass) return;
            if (!audioContextRef.current) {
                try {
                    audioContextRef.current = new AudioContextClass();
                } catch {
                    return;
                }
            }
            const ctx = audioContextRef.current;
            if (!ctx) return;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            const t = ctx.currentTime;
            const master = ctx.createGain();
            master.gain.setValueAtTime(0.0001, t);
            master.gain.exponentialRampToValueAtTime(0.08, t + 0.002);
            master.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);

            const click = ctx.createOscillator();
            click.type = 'square';
            click.frequency.setValueAtTime(1400, t);
            click.frequency.exponentialRampToValueAtTime(700, t + 0.02);

            const snap = ctx.createOscillator();
            snap.type = 'sine';
            snap.frequency.setValueAtTime(3000, t);
            snap.frequency.exponentialRampToValueAtTime(1800, t + 0.015);
            const snapGain = ctx.createGain();
            snapGain.gain.setValueAtTime(0.0001, t);
            snapGain.gain.exponentialRampToValueAtTime(0.05, t + 0.001);
            snapGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

            click.connect(master);
            snap.connect(snapGain);
            snapGain.connect(master);
            master.connect(ctx.destination);

            click.start(t);
            snap.start(t);
            click.stop(t + 0.05);
            snap.stop(t + 0.03);
        };

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            const interactive = target.closest('button, [role="button"], a, input[type="button"], input[type="submit"], .luxe-skin-button') as HTMLElement | null;
            if (!interactive) return;
            playClickSound();
            interactive.classList.add('click-flash');
            window.setTimeout(() => interactive.classList.remove('click-flash'), 180);
        };

        document.addEventListener('pointerdown', handlePointerDown, { passive: true });

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
        };
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
    
    if (loading) {
        return <div className="w-screen h-screen flex items-center justify-center bg-black">Carregando...</div>;
    }

    const renderContent = () => {
        return session ? <MainApp /> : <LoginView />;
    };

    return (
        <CodexBuilderProvider>
          <GameProvider session={session}>
            <TutorialProvider>
              {renderContent()}
              <BootRitualOverlay open={showBootRitual} />
            </TutorialProvider>
          </GameProvider>
        </CodexBuilderProvider>
    );
};

export default App;
