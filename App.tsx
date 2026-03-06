import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Portal } from './components/Portal';
import { LoginView } from './views/LoginView';

// Code-Splitting: Heavy views loaded on demand via React.lazy()
const AssetsView = React.lazy(() => import('./views/AssetsView').then(m => ({ default: m.AssetsView })));
const ArenasView = React.lazy(() => import('./views/ArenasView').then(m => ({ default: m.ArenasView })));
const PlannerView = React.lazy(() => import('./views/PlannerView').then(m => ({ default: m.PlannerView })));
const MundoView = React.lazy(() => import('./views/MundoView'));
const SettingsView = React.lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));
const ProfileView = React.lazy(() => import('./views/ProfileView').then(m => ({ default: m.ProfileView })));
const ReportsView = React.lazy(() => import('./views/ReportsView').then(m => ({ default: m.ReportsView })));
import { GameProvider, useGame, PROFILE_FLAG_TERMS_ACCEPTED, PROFILE_FLAG_TERMS_PENDING, PROFILE_FLAG_TUTORIAL_COMPLETED } from './contexts/GameContext';
import { CodexBuilderProvider, useCodexBuilder } from './contexts/CodexBuilderContext';
import { TutorialProvider, useTutorial } from './contexts/TutorialContext';
import { OracleTutorialOverlay } from './components/OracleTutorialOverlay';
import { ModeSelectionOverlay } from './components/ModeSelectionOverlay';
// Removed TutorialHub import

import { TUTORIAL_STEPS } from './constants/tutorialSteps';
import { View as TutorialView } from './types';
import { TutorialOverlay } from './components/TutorialOverlay';
import { GlobalHeader } from './components/GlobalHeader';
import { AssetIcon, ArenaIcon, PlannerIcon, SocialIcon, ConfigIcon, GameLogoIcon } from './components/Icons';
import { AchievementModal } from './components/AchievementModal';
import { supabase } from './supabaseClient';
import { GoldenToast } from './components/GoldenToast';
import type { Session } from '@supabase/supabase-js';
import { useLongPress } from './hooks/useLongPress';
import { useSensoryFeedback } from './hooks/useSensoryFeedback';

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

type View = 'assets' | 'arenas' | 'planner' | 'social' | 'settings' | 'reports';

const TutorialBridge: React.FC<{ currentView: View; onNavigate: (v: View) => void }> = ({ currentView, onNavigate }) => {
    // Disabled old TutorialOverlay to avoid duplication with the new OracleTutorialOverlay
    return null;
};

const OracleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4Z" fill="url(#oracle-gradient-terms)" fillOpacity="0.2" />
        <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8Z" fill="url(#oracle-gradient-terms)" />
        <defs>
            <linearGradient id="oracle-gradient-terms" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFD700" />
                <stop offset="1" stopColor="#FF8C00" />
            </linearGradient>
        </defs>
    </svg>
);

const TermsOverlay: React.FC<{ open: boolean; onAccept: () => void; }> = ({ open, onAccept }) => {
    const clauses = [
        {
            title: 'O DESPERTAR DO SOBERANO',
            text: 'Para acessar a interface, você deve aceitar os termos do pacto que regem este domínio.'
        },
        {
            title: 'I. PROPRIEDADE ABSOLUTA',
            text: 'Seus dados são sua soberania. O Life OS é “Local First”: anotações, diários e registros residem no seu dispositivo. A nuvem é apenas o seu espelho de segurança. Nós não mineramos sua vida.'
        },
        {
            title: 'II. O VÍNCULO DE MENTORIA',
            text: 'Ao aceitar um Mentor, você autoriza a visualização parcial do seu progresso. Seus diários privados permanecem ocultos. O Life OS não se responsabiliza por orientações de terceiros; você é o único executor de suas ações.'
        },
        {
            title: 'III. ISENÇÃO DE RESPONSABILIDADE',
            text: 'Este sistema é uma ferramenta de autogestão. Não somos médicos, terapeutas ou consultores financeiros. O risco da execução física, mental ou financeira de qualquer Codex é inteiramente do Soberano.'
        },
        {
            title: 'IV. DIREITO AO EXÍLIO',
            text: 'A qualquer momento, você pode incinerar seus dados. O comando “Deletar Conta” é definitivo e apaga sua existência em nossos servidores, sem rastro ou recuperação.'
        }
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
            setTypedText(currentClause.text.slice(0, i));
            if (i >= currentClause.text.length) {
                window.clearInterval(timer);
                setIsTyping(false);
            }
        }, 20); // Faster typewriter as per Oracle style
        return () => window.clearInterval(timer);
    }, [step, open]); // Simplified dependency

    const handleAccept = () => {
        setIsHolding(false);
        setIsSealing(true);
        window.setTimeout(() => {
            setIsSealing(false);
            setStep(0);
            onAccept();
        }, 500); // 500ms delay for ritual feel
    };

    const longPressEvents = useLongPress({
        onLongPress: () => {
            if (isTyping) {
                setTypedText(currentClause.text);
                setIsTyping(false);
            }
            if (isLast) handleAccept();
            // REMOVED: setStep auto-advance from long press on non-last steps to avoid confusion
        },
        onLongPressCancel: () => setIsHolding(false),
        onLongPressRelease: () => setIsHolding(false),
        onClick: () => {
            setIsHolding(false);
            if (isTyping) {
                setTypedText(currentClause.text);
                setIsTyping(false);
                return;
            }
            if (!isLast) {
                setStep(prev => Math.min(prev + 1, clauses.length - 1));
            }
        },
        delay: holdDurationMs,
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isLast) {
            setIsHolding(true);
            (longPressEvents as any).onMouseDown?.(e);
        } else {
            // Click only behavior for non-last steps
            (longPressEvents as any).onClick?.(e as any);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isLast) {
            setIsHolding(true);
            (longPressEvents as any).onTouchStart?.(e);
        } else {
            // Click only behavior for non-last steps
            (longPressEvents as any).onClick?.(e as any);
        }
    };

    if (!open) return null;

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[20000] flex items-center justify-center animate-fade-in"
                style={{ background: 'radial-gradient(circle at center, #0A0A0A 0%, #000000 72%)' }}
            >
                <div className="absolute inset-4 border border-white/10 rounded-[32px] pointer-events-none" />
                {isSealing && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--gold),rgba(0,0,0,0.95))] animate-fade-in z-50" />}

                <div className="relative w-full max-w-2xl mx-auto px-6 flex flex-col items-center">
                    {/* Oracle Styled Box */}
                    <div className="bg-black/95 border border-white/20 backdrop-blur-xl rounded-xl p-4 md:p-6 w-full shadow-2xl flex gap-4 animate-fade-in-down border-b-4 border-b-[var(--gold)]">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-[var(--gold)] flex items-center justify-center shadow-lg">
                                <OracleIcon className="w-8 h-8 md:w-10 md:h-10 animate-pulse-slow" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow flex flex-col justify-between min-h-[120px]">
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col">
                                        <h3 className="text-[var(--gold)] font-bold uppercase tracking-[0.2em] text-[10px] md:text-sm">
                                            {currentClause.title}
                                        </h3>
                                        <span className="text-[8px] md:text-[10px] text-gray-500 font-mono">
                                            CLÁUSULA {step + 1} / {clauses.length}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-gray-200 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-mono min-h-[80px]">
                                    {typedText}
                                    {isTyping && <span className="animate-pulse inline-block w-1 h-3 md:w-2 md:h-4 bg-[var(--gold)] ml-1 align-middle opacity-70"></span>}
                                </p>
                            </div>

                            <div className="flex justify-center w-full mt-4">
                                <div
                                    className={`relative flex flex-col items-center justify-center gap-1 cursor-pointer select-none active:scale-95 transition-all shadow-[0_0_15px_rgba(184,134,11,0.2)] hover:shadow-[0_0_25px_rgba(184,134,11,0.4)] border-2 border-[var(--gold)] ${isLast
                                        ? 'w-24 h-24 md:w-32 md:h-32 rounded-full'
                                        : 'px-10 py-4 rounded-xl w-full'
                                        }`}
                                    onMouseDown={handleMouseDown}
                                    onTouchStart={handleTouchStart}
                                    onContextMenu={(longPressEvents as any).onContextMenu}
                                    style={{ touchAction: 'none' }}
                                >
                                    <span className={`text-[var(--gold)] font-black uppercase luxe-title-shadow ${isLast ? 'text-sm md:text-base tracking-widest' : 'text-xs md:text-sm tracking-[0.4em]'
                                        }`}>
                                        {isLast ? (isHolding ? 'FIRMAR...' : 'ACEITAR') : 'PRÓXIMO'}
                                    </span>
                                    <span className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-[0.1em] font-bold text-center px-2">
                                        {isHolding ? 'ASSINANDO' : (isLast ? 'SEGURE' : 'AVANÇAR')}
                                    </span>

                                    {/* Progress Ritual Signature Line (Round for last, linear for others) */}
                                    {isLast ? (
                                        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                                            <circle
                                                cx="50%"
                                                cy="50%"
                                                r="48%"
                                                stroke="var(--gold)"
                                                strokeWidth="4"
                                                fill="transparent"
                                                strokeDasharray="100 100"
                                                strokeDashoffset={isHolding ? 100 - (100 * 1) : 100} // Simplified since animation is handled by wide width transition below
                                                className="transition-all duration-100 ease-linear"
                                                style={{ strokeDashoffset: isHolding ? 0 : 315, strokeDasharray: 315, opacity: isHolding ? 1 : 0 }}
                                            />
                                        </svg>
                                    ) : (
                                        <div className="absolute bottom-0 left-0 h-0.5 bg-[var(--gold)] shadow-[0_0_15px_var(--gold)] transition-all duration-100 ease-linear rounded-full"
                                            style={{ width: `${isHolding ? 100 : 0}%`, opacity: isHolding ? 1 : 0 }} />
                                    )}

                                    {/* Signature Glow Effect */}
                                    {isHolding && isLast && (
                                        <div className="absolute inset-0 bg-[var(--gold)]/10 animate-pulse rounded-full pointer-events-none" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .animate-pulse-slow {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .seal-progress-v2 {
                    height: 100%;
                    background: linear-gradient(to top, var(--gold) 0%, transparent 100%);
                    opacity: 0.3;
                    animation: sealFillHorizontal linear forwards;
                }
                @keyframes sealFillHorizontal {
                    from { transform: scaleX(0); transform-origin: left; }
                    to { transform: scaleX(1); transform-origin: left; }
                }
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}</style>
        </Portal>
    );
};

const OfflineOverlay: React.FC<{ open: boolean }> = ({ open }) => {
    if (!open) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-sm flex items-center justify-center safe-area-top safe-area-bottom">
                <div className="w-full max-w-sm mx-auto p-6 text-center space-y-3">
                    <div className="text-3xl">📡</div>
                    <h2 className="text-lg font-black tracking-wider text-white">Conectando ao servidor da Liga...</h2>
                    <p className="text-xs text-gray-400">Sem internet. Verifique sua conexão para continuar.</p>
                </div>
            </div>
        </Portal>
    );
};

// Removed TutorialGateOverlay as requested - skipping straight to tutorial after mode selection


const BootRitualOverlay: React.FC<{ open: boolean }> = ({ open }) => {
    if (!open) return null;

    return (
        <Portal>
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
        </Portal>
    );
};

const AppWithTutorial: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('assets');
    const [isProfileVisible, setProfileVisible] = useState(false);
    const [isReportsVisible, setReportsVisible] = useState(false);
    const [isRestScreenOpen, setRestScreenOpen] = useState(false);
    const { isBuilderMode, draftName, setDraftName, exitBuilderMode, packDraftToJson } = useCodexBuilder();
    const { userProfile, appMode, activeTheme, clan } = useGame();
    const { isTutorialActive, currentStep, isHubOpen, setIsHubOpen, didForceGameMode } = useTutorial();
    const historyReady = useRef(false);

    // CRITICAL: Logic for Mode Display (HUB Architecture)
    const activeUIMode = appMode === 'GAME' ? 'GAME' : 'BASIC';
    const isBasicMode = activeUIMode === 'BASIC';

    useEffect(() => {
        const handleNavigateToStore = () => {
            setCurrentView('social');
            // Give time for MundoView to mount if not active
            setTimeout(() => {
                const storeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('LOJA'));
                if (storeBtn) storeBtn.click();
            }, 100);
        };
        window.addEventListener('navigate-to-store', handleNavigateToStore);
        return () => window.removeEventListener('navigate-to-store', handleNavigateToStore);
    }, []);

    // Bottom Nav Swipe Logic
    const navContainerRef = useRef<HTMLDivElement>(null);
    const navItemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    const [navIndicatorStyle, setNavIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
    const touchStartRef = useRef<number | null>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const currentDeltaRef = useRef<number>(0);

    const updateNavIndicator = useCallback(() => {
        const currentRef = navItemRefs.current.get(currentView);
        if (currentRef && navContainerRef.current) {
            const containerRect = navContainerRef.current.getBoundingClientRect();
            const itemRect = currentRef.getBoundingClientRect();
            // Center a 32px indicator
            const indicatorWidth = 32;
            const left = (itemRect.left - containerRect.left) + (itemRect.width / 2) - (indicatorWidth / 2);
            setNavIndicatorStyle({ left, width: indicatorWidth, opacity: 1 });
        }
    }, [currentView]);

    useEffect(() => {
        // Small delay to ensure layout is stable
        const timer = setTimeout(updateNavIndicator, 50);
        window.addEventListener('resize', updateNavIndicator);
        return () => {
            window.removeEventListener('resize', updateNavIndicator);
            clearTimeout(timer);
        };
    }, [updateNavIndicator]);

    const handleNavTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientX;
        currentDeltaRef.current = 0;
        if (indicatorRef.current) {
            indicatorRef.current.style.transition = 'none';
        }
    };

    const handleNavTouchMove = (e: React.TouchEvent) => {
        if (touchStartRef.current === null || !indicatorRef.current) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartRef.current;
        currentDeltaRef.current = diff;

        // Invert direction: Drag Right (positive diff) moves indicator Left (negative transform)
        indicatorRef.current.style.transform = `translateX(${-diff}px)`;
    };

    const handleNavTouchEnd = (e: React.TouchEvent) => {
        if (touchStartRef.current === null) return;

        const diff = currentDeltaRef.current;
        const threshold = 40; // Swipe threshold

        // Restore transition and clear transform
        if (indicatorRef.current) {
            indicatorRef.current.style.transition = '';
            indicatorRef.current.style.transform = '';
        }

        if (Math.abs(diff) > threshold) {
            const views: View[] = activeUIMode === 'BASIC'
                ? ['arenas', 'planner', 'social', 'settings']
                : ['assets', 'arenas', 'planner', 'social', 'settings'];
            const currentIndex = views.indexOf(currentView);

            // Inverted Logic:
            // Drag Right (diff > 0) -> Previous Item (Index - 1)
            // Drag Left (diff < 0) -> Next Item (Index + 1)
            if (diff > 0 && currentIndex > 0) {
                handleSetView(views[currentIndex - 1]);
            } else if (diff < 0 && currentIndex < views.length - 1) {
                handleSetView(views[currentIndex + 1]);
            }
        }
        touchStartRef.current = null;
        currentDeltaRef.current = 0;
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey) {
                switch (e.key) {
                    case '1': setCurrentView('assets'); break;
                    case '2': setCurrentView('arenas'); break;
                    case '3': setCurrentView('planner'); break;
                    case '4': setCurrentView('social'); break;
                    case '5': setCurrentView('settings'); break;
                    case 'r':
                    case 'R': setReportsVisible(prev => !prev); break;
                    case 'p':
                    case 'P': setProfileVisible(prev => !prev); break;
                    case 's':
                    case 'S': {
                        const event = new CustomEvent('openSitrep');
                        window.dispatchEvent(event);
                        break;
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
            console.log('App: tutorialNavigate event received', e.detail);

            // Handle Profile visibility
            if (e.detail.showProfile !== undefined) {
                setProfileVisible(e.detail.showProfile);
            } else {
                setProfileVisible(false);
            }

            // Handle Rest Screen visibility
            if (e.detail.showRestScreen !== undefined) {
                setRestScreenOpen(e.detail.showRestScreen);
                // Also dispatch to GlobalHeader which manages its own state
                const restEvent = new CustomEvent('tutorialRestScreen', { detail: { open: e.detail.showRestScreen } });
                window.dispatchEvent(restEvent);
            } else {
                setRestScreenOpen(false);
                const restEvent = new CustomEvent('tutorialRestScreen', { detail: { open: false } });
                window.dispatchEvent(restEvent);
            }

            // Handle Reports visibility
            if (e.detail.showReports !== undefined) {
                setReportsVisible(e.detail.showReports);
            } else {
                setReportsVisible(false);
            }

            // Handle Oracle Settings
            if (e.detail.showOracleSettings !== undefined) {
                const settingsEvent = new CustomEvent('tutorialOracleSettings', { detail: { open: e.detail.showOracleSettings } });
                window.dispatchEvent(settingsEvent);
            } else {
                const settingsEvent = new CustomEvent('tutorialOracleSettings', { detail: { open: false } });
                window.dispatchEvent(settingsEvent);
            }

            // Handle Arena Modal
            if (e.detail.showArenaId !== undefined) {
                const arenaEvent = new CustomEvent('tutorialOpenArena', { detail: { arenaId: e.detail.showArenaId } });
                window.dispatchEvent(arenaEvent);
            } else {
                const arenaEvent = new CustomEvent('tutorialOpenArena', { detail: { arenaId: null } });
                window.dispatchEvent(arenaEvent);
            }

            if (e.detail.view) {
                setCurrentView(e.detail.view);
            }

            if (e.detail.tab) {
                setTimeout(() => {
                    const tabEvent = new CustomEvent('tutorialTabChange', { detail: { tab: e.detail.tab } });
                    window.dispatchEvent(tabEvent);
                }, 100);
            }
        };
        window.addEventListener('tutorialNavigate', handleNavigate as EventListener);
        return () => window.removeEventListener('tutorialNavigate', handleNavigate as EventListener);
    }, []);

    useEffect(() => {
        if (isBuilderMode) setCurrentView('arenas');
    }, [isBuilderMode]);

    useEffect(() => {
        const state = window.history.state as { view?: View } | null;
        if (state?.view) {
            setCurrentView(state.view);
        } else {
            window.history.replaceState({ view: currentView }, '');
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
            if (isBuilderMode && nextView !== 'arenas') {
                setCurrentView('arenas');
                window.history.pushState({ view: 'arenas' }, '');
                return;
            }
            setCurrentView(nextView);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
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
                    .from('codex')
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
        const viewContent = (() => {
            switch (currentView) {
                case 'assets': return <AssetsView />;
                case 'arenas': return <ArenasView />;
                case 'planner': return <PlannerView onReportsClick={() => setReportsVisible(true)} />;
                case 'social': return <MundoView />;
                case 'settings': return <SettingsView />;
                default: return <AssetsView />;
            }
        })();
        return (
            <Suspense fallback={
                <div className="flex items-center justify-center h-full w-full">
                    <div className="w-8 h-8 border-2 border-[var(--skin-accent-color)] border-t-transparent rounded-full animate-spin" />
                </div>
            }>
                {viewContent}
            </Suspense>
        );
    };

    const NavItem: React.FC<{ view: View; label: string; icon: React.ReactNode; id?: string }> = ({ view, label, icon, id }) => (
        <button
            id={id}
            ref={(el) => { if (el) navItemRefs.current.set(view, el); }}
            onClick={() => handleSetView(view)}
            className={`flex flex-col items-center justify-center w-full transition-colors duration-200 relative z-10 ${currentView === view ? 'accent-text' : 'text-gray-500 hover:text-gray-300'
                }`}
        >
            {icon}
            <span className="text-[10px] font-bold tracking-wider mt-1">{label}</span>
        </button>
    );

    const baseTopPadding = isBuilderMode ? 128 : 80;
    const baseBottomPadding = 64;
    const mainPaddingTop = `calc(${baseTopPadding}px + var(--safe-area-top))`;
    const mainPaddingBottom = currentView === 'assets'
        ? 'var(--safe-area-bottom)'
        : `calc(${baseBottomPadding}px + var(--safe-area-bottom))`;

    const themeClass = activeUIMode === 'BASIC' ? `mode-office theme-${(activeTheme || 'DARK').toLowerCase()}` : '';

    useEffect(() => {
        // If in BASIC mode and trying to access 'assets', force back to 'arenas'
        // UNLESS a tutorial is forcing GAME mode (even if the base appMode is BASIC)
        if (appMode === 'BASIC' && currentView === 'assets' && !didForceGameMode) {
            setCurrentView('arenas');
        }
    }, [appMode, currentView, didForceGameMode]);

    useEffect(() => {
        const skin = activeUIMode === 'BASIC' ? 'default' : userProfile.skin;
        document.body.setAttribute('data-skin', skin);
        document.documentElement.setAttribute('data-skin', skin);
    }, [activeUIMode, userProfile.skin]);

    return (
        <div
            id="app-root"
            className={`h-screen min-h-0 overflow-hidden text-gray-200 font-sans flex flex-col ${isBuilderMode ? 'border-4 border-yellow-400 border-dashed' : ''} ${themeClass}`}
            data-skin={activeUIMode === 'BASIC' ? 'default' : userProfile.skin}
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
            <TutorialBridge currentView={currentView} onNavigate={handleSetView} />
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ paddingTop: mainPaddingTop, paddingBottom: mainPaddingBottom }}>
                <div className="max-w-7xl mx-auto w-full h-full min-h-0 flex flex-col overflow-hidden">
                    {renderView()}
                </div>
            </main>

            {isProfileVisible && <ProfileView onClose={() => setProfileVisible(false)} />}
            {isReportsVisible && <ReportsView onClose={() => setReportsVisible(false)} />}

            <footer
                className={`fixed bottom-0 left-0 right-0 z-30 ${activeUIMode === 'BASIC' ? 'bg-[var(--nav-bg)] border-t border-[var(--nav-border)]' : 'bg-black/80 backdrop-blur-xl border-t border-[var(--glass-border)]'} safe-area-bottom`}
                style={{ paddingBottom: 'var(--safe-area-bottom)' }}
            >
                <div
                    className="max-w-7xl mx-auto relative"
                    ref={navContainerRef}
                    onTouchStart={handleNavTouchStart}
                    onTouchMove={handleNavTouchMove}
                    onTouchEnd={handleNavTouchEnd}
                >
                    <div
                        ref={indicatorRef}
                        className="absolute bottom-1 h-1 bg-[var(--skin-accent-color)] rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] shadow-[0_0_10px_var(--skin-accent-color)]"
                        style={{
                            left: navIndicatorStyle.left,
                            width: navIndicatorStyle.width,
                            opacity: navIndicatorStyle.opacity
                        }}
                    />
                    <div className="flex justify-around items-center h-16">
                        {activeUIMode === 'GAME' && <NavItem view="assets" label="ATIVOS" icon={<AssetIcon />} id="nav-assets" />}
                        <NavItem view="arenas" label={activeUIMode === 'BASIC' ? "ÁREAS" : "ARENAS"} icon={<ArenaIcon />} id="nav-arenas" />
                        <NavItem view="planner" label="PLANNER" icon={<PlannerIcon />} id="nav-planner" />
                        <NavItem view="social" label={activeUIMode === 'BASIC' ? "EQUIPE" : "MUNDO"} icon={<SocialIcon />} id="nav-mundo" />
                        <NavItem view="settings" label="CONFIG" icon={<ConfigIcon />} id="nav-settings" />
                    </div>
                </div>
            </footer>
        </div>
    );
};

const MainApp: React.FC = () => {
    const { achievementUnlocked, setAchievementUnlocked, userProfile, updateUserProfile, addProfileFlag, toast, hideToast, isProfileLoaded, showToast } = useGame();
    const { isTutorialCompleted, isTutorialActive, startTutorial } = useTutorial();
    const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
    const { trigger } = useSensoryFeedback();

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            const interactive = target.closest('button, [role="button"], a, input[type="button"], input[type="submit"], .luxe-skin-button') as HTMLElement | null;
            if (!interactive) return;

            trigger('click');

            interactive.classList.add('click-flash');
            window.setTimeout(() => interactive.classList.remove('click-flash'), 180);
        };

        document.addEventListener('pointerdown', handlePointerDown, { passive: true });

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [trigger]);

    const [forceShowTerms, setForceShowTerms] = useState(false);

    useEffect(() => {
        const handleOpenTerms = () => setForceShowTerms(true);
        window.addEventListener('openTermsOverlay', handleOpenTerms);
        return () => window.removeEventListener('openTermsOverlay', handleOpenTerms);
    }, []);

    // Sequencing Logic for Onboarding
    const completed = userProfile.completedSeasonMissions || [];
    const acceptedTerms = completed.includes(PROFILE_FLAG_TERMS_ACCEPTED);
    const pendingTerms = completed.includes(PROFILE_FLAG_TERMS_PENDING);
    // Explicitly show terms if NOT accepted AND (pending OR admin/gm bypass check) OR forced
    const showTerms = forceShowTerms || (!acceptedTerms && (pendingTerms || (userProfile.role !== 'admin' && userProfile.role !== 'gm' && userProfile.role !== 'admin_gm')));

    // Mode Selection logic (Applies after terms)
    const needsModeSelection = acceptedTerms && !userProfile.appMode;

    // Tutorial start logic (Applies after mode selection)
    const [tutorialShownInSession, setTutorialShownInSession] = useState(false);

    useEffect(() => {
        if (userProfile.id === 'placeholder_user' || !isProfileLoaded || showTerms || needsModeSelection) return;

        // CRITICAL: Check both the flag and the context state
        const tutorialFlags = userProfile.completedSeasonMissions || [];
        const tutorialAlreadyDone = isTutorialCompleted || tutorialFlags.includes(PROFILE_FLAG_TUTORIAL_COMPLETED);

        if (!tutorialAlreadyDone && !isTutorialActive && !tutorialShownInSession) {
            console.log('App: Starting tutorial after Terms and Mode Selection');
            startTutorial(0);
            setTutorialShownInSession(true);
        }
    }, [userProfile.id, userProfile.appMode, isProfileLoaded, showTerms, needsModeSelection, isTutorialCompleted, isTutorialActive, startTutorial, tutorialShownInSession, userProfile.completedSeasonMissions]);

    const handleAcceptTerms = () => {
        if (forceShowTerms) {
            setForceShowTerms(false);
            return;
        }
        const nextCompleted = (userProfile.completedSeasonMissions || []).filter(flag => flag !== PROFILE_FLAG_TERMS_PENDING);
        if (!nextCompleted.includes(PROFILE_FLAG_TERMS_ACCEPTED)) nextCompleted.push(PROFILE_FLAG_TERMS_ACCEPTED);
        updateUserProfile({ completedSeasonMissions: nextCompleted });
    };

    // Handle tutorial completion
    useEffect(() => {
        if (isTutorialCompleted && !(userProfile.completedSeasonMissions || []).includes(PROFILE_FLAG_TUTORIAL_COMPLETED)) {
            addProfileFlag(PROFILE_FLAG_TUTORIAL_COMPLETED);
        }
    }, [isTutorialCompleted, userProfile.completedSeasonMissions]);

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

    return (
        <>
            <AppWithTutorial />
            {!showTerms && <ModeSelectionOverlay />}
            <TermsOverlay open={showTerms} onAccept={handleAcceptTerms} />
            <OfflineOverlay open={!isOnline} />
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

import { SplashScreen } from './components/SplashScreen';

const ResetPasswordOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async () => {
        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setSuccess(true);
            window.setTimeout(onClose, 2000);
        } catch (err: any) {
            setError(err.message || 'Erro ao redefinir senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[30000] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
                <div className="w-full max-w-sm mx-auto p-6 space-y-6 border border-[var(--gold)]/30 rounded-2xl bg-black/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-50" />

                    <div className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-full bg-black/60 border border-[var(--gold)]/50 mx-auto flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(184,134,11,0.2)]">
                            <OracleIcon className="w-10 h-10 text-[var(--gold)] animate-pulse-slow" />
                        </div>
                        <h2 className="text-[var(--gold)] font-black tracking-[0.2em] uppercase text-sm">Redefinir Consciência</h2>
                        <p className="text-gray-500 text-[10px] tracking-widest uppercase">Digite sua nova chave de acesso</p>
                    </div>

                    {success ? (
                        <div className="py-8 text-center animate-fade-in">
                            <div className="text-green-500 mb-2">✓</div>
                            <p className="text-white font-bold text-xs tracking-widest uppercase">CONSCIÊNCIA RESTAURADA</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <input
                                type="password"
                                placeholder="Nova Senha"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl focus:outline-none focus:border-[var(--gold)] transition-colors text-white placeholder-gray-600 text-sm font-mono"
                            />
                            {error && <p className="text-red-500 text-[10px] text-center uppercase font-bold tracking-tight">{error}</p>}
                            <button
                                onClick={handleReset}
                                disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-b from-[var(--gold)] to-[#8B6508] text-black font-black text-xs tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? 'RESTAURANDO...' : 'ATUALIZAR CHAVE'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Portal>
    );
};

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBootRitual, setShowBootRitual] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    // Inicia mostrando o splash sempre
    const [showSplash, setShowSplash] = useState(true);

    const handleSplashComplete = () => {
        setShowSplash(false);
        sessionStorage.setItem('hasSeenSplash', 'true');
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.warn("Session restore error (silent):", error.message);
                    setSession(null);
                } else {
                    setSession(session);
                }
            } catch (e) {
                console.error("Critical auth check error:", e);
                setSession(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth Event:", event);
            // Handle refresh errors silently by clearing session
            if (event === 'SIGNED_OUT' || (event as string) === 'TOKEN_REFRESH_ERROR') {
                setSession(null);
                if ((event as string) === 'TOKEN_REFRESH_ERROR') {
                    // Force logout on refresh error to clean local storage
                    supabase.auth.signOut();
                }
            } else if (event === 'PASSWORD_RECOVERY') {
                setShowResetPassword(true);
                setSession(session);
            } else {
                setSession(session);
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

    if (loading) {
        return <SplashScreen onComplete={handleSplashComplete} isLoading={loading} />;
    }

    const renderContent = () => {
        return session ? <MainApp /> : <LoginView />;
    };

    return (
        <CodexBuilderProvider>
            <GameProvider session={session}>
                <TutorialProvider>
                    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col font-sans">
                        {renderContent()}
                        {showResetPassword && <ResetPasswordOverlay onClose={() => setShowResetPassword(false)} />}
                    </div>
                </TutorialProvider>
            </GameProvider>
        </CodexBuilderProvider>
    );
};

export default App;
