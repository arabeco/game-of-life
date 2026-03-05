import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Portal } from './components/Portal';
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
import { ModeSelectionOverlay } from './components/ModeSelectionOverlay';
import { TutorialHub } from './components/TutorialHub';
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

const TermsOverlay: React.FC<{ open: boolean; onAccept: () => void; }> = ({ open, onAccept }) => {
    const clauses = [
        'O DESPERTAR DO SOBERANO\n\nPara acessar a interface, você deve aceitar os termos do pacto que regem este domínio.',
        'I. PROPRIEDADE ABSOLUTA\nSeus dados são sua soberania. O Life OS é “Local First”: anotações, diários e registros residem no seu dispositivo. A nuvem é apenas o seu espelho de segurança. Nós não mineramos sua vida.',
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
        <Portal>
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

const TutorialGateOverlay: React.FC<{ open: boolean; onStart: () => void; onSkip: () => void; }> = ({ open, onStart, onSkip }) => {
    if (!open) return null;

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 z-[9998] flex items-center justify-center p-4">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 space-y-4 max-w-sm text-center animate-fade-in">
                    <h2 className="text-2xl font-bold text-white">Você já viu o tutorial?</h2>
                    <p className="text-gray-300">Se já concluiu, seguimos direto. Se não, te guio pelos primeiros passos.</p>
                    <div className="flex space-x-2">
                        <button onClick={onSkip} className="w-full py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all">Já vi</button>
                        <button onClick={onStart} className="w-full py-2 rounded-lg luxe-skin-button">Quero ver</button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

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
        switch (currentView) {
            case 'assets': return <AssetsView />;
            case 'arenas': return <ArenasView />;
            case 'planner': return <PlannerView onReportsClick={() => setReportsVisible(true)} />;
            case 'social': return <MundoView />;
            case 'settings': return <SettingsView />;
            default: return <AssetsView />;
        }
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
            <TutorialHub isOpen={isHubOpen} onClose={() => setIsHubOpen(false)} />
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
    const [showTerms, setShowTerms] = useState(false);
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

    // Inicia o tutorial apenas uma vez por sessão se não estiver concluído
    const [tutorialShownInSession, setTutorialShownInSession] = useState(false);

    useEffect(() => {
        if (userProfile.id === 'placeholder_user' || !isProfileLoaded) return;
        if (!isTutorialCompleted && !isTutorialActive && !tutorialShownInSession) {
            startTutorial();
            setTutorialShownInSession(true);
        }
    }, [userProfile.id, isProfileLoaded, isTutorialCompleted, isTutorialActive, startTutorial, tutorialShownInSession]);

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
            <ModeSelectionOverlay />
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

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [showBootRitual, setShowBootRitual] = useState(false);
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
            // Handle refresh errors silently by clearing session
            if (event === 'SIGNED_OUT' || (event as string) === 'TOKEN_REFRESH_ERROR') {
                setSession(null);
                if ((event as string) === 'TOKEN_REFRESH_ERROR') {
                    // Force logout on refresh error to clean local storage
                    supabase.auth.signOut();
                }
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
                    {renderContent()}
                    <BootRitualOverlay open={showBootRitual} />
                    {showSplash && !loading && <SplashScreen onComplete={handleSplashComplete} />}
                </TutorialProvider>
            </GameProvider>
        </CodexBuilderProvider>
    );
};

export default App;
