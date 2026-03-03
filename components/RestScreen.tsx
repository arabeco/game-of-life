import React, { useState, useEffect, useRef } from 'react';
import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';
import { LockIcon, UnlockIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, SparklesIcon, UsersIcon, ZapIcon, ClockIcon, ShareIcon } from './Icons';
import { handleShare } from './Share';
import { GlassCard } from './GlassCard';
import { SephirotFog } from './SephirotFog';
import { MoodModal } from './MoodModal';
import { SitrepContent } from './SitrepContent';

interface RestScreenProps {
    onClose: () => void;
    onOpenMood?: () => void;
    onOpenOracle?: () => void;
    onOpenClan?: () => void;
    onOpenDeepWork?: () => void;
}

export const RestScreen: React.FC<RestScreenProps> = ({ onClose, onOpenMood, onOpenOracle, onOpenClan, onOpenDeepWork }) => {
    const {
        activeCycle,
        dailyCommitment,
        tasks,
        userProfile,
        currentMood,
        clan
    } = useGame();
    const [isClosing, setIsClosing] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const holdInterval = useRef<number | null>(null);
    const actionHoldInterval = useRef<number | null>(null);
    const [actionProgress, setActionProgress] = useState<{ id: string, progress: number } | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMoodOpen, setIsMoodOpen] = useState(false);
    const [isOracleOpen, setIsOracleOpen] = useState(false);
    const [isClanOpen, setIsClanOpen] = useState(false);
    const [isSitrepLocked, setIsSitrepLocked] = useState(true); // Default to locked (safe mode)
    const [isDeepWorkOpen, setIsDeepWorkOpen] = useState(false);
    const [selectedDeepWorkTime, setSelectedDeepWorkTime] = useState('25');
    const [deepWorkActive, setDeepWorkActive] = useState(false);
    const [deepWorkTimeLeft, setDeepWorkTimeLeft] = useState(0);

    const deepWorkOptions = ['15', '20', '25', '30', '40', '45', '50', '60', '90', '120'];

    const handleQuickActionStart = (action: 'mood' | 'oracle' | 'clan' | 'deepwork') => {
        if (actionHoldInterval.current) return;

        const startTime = Date.now();
        const duration = 600; // 0.6 seconds to trigger action

        actionHoldInterval.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setActionProgress({ id: action, progress });

            if (progress >= 100) {
                if (actionHoldInterval.current) clearInterval(actionHoldInterval.current);
                actionHoldInterval.current = null;
                setActionProgress(null);
                handleQuickAction(action);
            }
        }, 16);
    };

    const handleQuickActionEnd = () => {
        if (actionHoldInterval.current) {
            clearInterval(actionHoldInterval.current);
            actionHoldInterval.current = null;
        }
        setActionProgress(null);
    };

    const handleQuickAction = (action: 'mood' | 'oracle' | 'clan' | 'deepwork') => {
        if (action === 'mood') {
            setIsMoodOpen(true);
        } else if (action === 'deepwork') {
            setIsDeepWorkOpen(true);
        } else {
            // For others, close RestScreen and then open the modal via callback
            setIsClosing(true);
            setTimeout(() => {
                onClose();
                if (action === 'oracle') onOpenOracle?.();
                else if (action === 'clan') onOpenClan?.();
            }, 700);
        }
    };

    const handleDeepWorkStart = () => {
        const minutes = parseInt(selectedDeepWorkTime);
        setDeepWorkTimeLeft(minutes * 60);
        setDeepWorkActive(true);
        setIsDeepWorkOpen(false);
    };

    useEffect(() => {
        let interval: number;
        if (deepWorkActive && deepWorkTimeLeft > 0) {
            interval = window.setInterval(() => {
                setDeepWorkTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (deepWorkTimeLeft === 0) {
            setDeepWorkActive(false);
        }
        return () => clearInterval(interval);
    }, [deepWorkActive, deepWorkTimeLeft]);

    const formatDeepWorkTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Animation for mounting

    // Animation for mounting
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => {
            setMounted(false);
            clearInterval(timer);
        };
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const handleStartHold = () => {
        if (holdInterval.current) return;

        const startTime = Date.now();
        const duration = 1000; // 1 second to unlock

        holdInterval.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setHoldProgress(progress);

            if (progress >= 100) {
                if (holdInterval.current) clearInterval(holdInterval.current);
                handleUnlock();
            }
        }, 16);
    };

    const handleEndHold = () => {
        if (holdInterval.current) {
            clearInterval(holdInterval.current);
            holdInterval.current = null;
        }
        if (!isUnlocked) {
            setHoldProgress(0);
        }
    };

    const handleUnlock = () => {
        setIsUnlocked(true);
        setIsClosing(true);
        setTimeout(onClose, 700); // Wait for slide up animation
    };

    // Calculate Cycle Progress
    const getCycleProgress = () => {
        if (!activeCycle) return 0;
        const start = new Date(activeCycle.startDate).getTime();
        const end = new Date(activeCycle.endDate).getTime();
        const now = new Date().getTime();
        const total = end - start;
        const current = now - start;
        return Math.min(Math.max((current / total) * 100, 0), 100);
    };

    const cycleProgress = getCycleProgress();
    const daysLeft = activeCycle ? Math.ceil((new Date(activeCycle.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return (
        <Portal>
            <div
                className={`fixed inset-0 z-[9000] flex flex-col items-center justify-start gap-2 bg-black transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] border-x border-y border-[var(--skin-accent-color)]/20 ${mounted && !isClosing ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ touchAction: 'none' }} // Prevent scrolling
            >
                {/* Sephirot Fog Background */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
                    <SephirotFog
                        points={[{ x: 50, y: 50, level: 10 }]}
                        color={currentMood?.color || 'var(--skin-accent-color)'}
                        mode="arena"
                    />
                </div>

                {/* Ambient Smoke Layer */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--skin-accent-color)]/5 to-transparent animate-smoke-slow" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--skin-accent-color)]/5 to-transparent animate-smoke-slow-reverse" />

                    {/* Floating Blur Layers */}
                    <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[var(--skin-accent-color)]/10 rounded-full blur-[100px] animate-float" />
                    <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[var(--skin-accent-color)]/10 rounded-full blur-[120px] animate-float-delayed" />

                    {/* Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
                </div>

                {/* Top Section: Profile & Clock */}
                <div className="w-full max-w-md p-6 pt-4 flex flex-col items-center gap-2 z-10">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center gap-2 animate-fade-in-down">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            {/* Avatar Container */}
                            <div
                                className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-black/40"
                                style={{
                                    width: 'calc(100% - 6px)',
                                    height: 'calc(100% - 6px)',
                                }}
                            >
                                {userProfile.avatarUrl ? (
                                    <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-xl font-black text-gray-500">
                                        {userProfile.nickname?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Border Overlay */}
                            <div
                                className="absolute inset-0 w-full h-full pointer-events-none z-40 border-2 rounded-full"
                                style={{
                                    borderColor: 'var(--skin-accent-color)',
                                }}
                            />

                            {/* Level Badge - Bolinha Estilo Header */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-900/90 rounded-full w-6 h-6 flex items-center justify-center border shadow-lg z-50" style={{ borderColor: 'var(--skin-accent-color)' }}>
                                <span className="text-[11px] font-black text-white">{userProfile.level}</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{userProfile.nickname}</h3>
                        </div>
                    </div>

                    {/* Digital Clock & Status */}
                    <div className="flex flex-col items-center animate-fade-in delay-200">
                        <div className="text-5xl font-light text-[var(--skin-accent-color)] tracking-tighter tabular-nums drop-shadow-[0_0_20px_var(--skin-accent-color)]">
                            {deepWorkActive ? formatDeepWorkTime(deepWorkTimeLeft) : formatTime(currentTime)}
                        </div>

                        {/* Date/Status */}
                        <div className="text-[9px] font-bold text-[var(--skin-accent-color)] uppercase tracking-[0.3em] opacity-60 mt-2">
                            {deepWorkActive ? 'DEEP WORK ATIVO' : formatDate(currentTime)}
                        </div>
                    </div>

                    {/* Cycle Detail - Only if active */}
                    {activeCycle && !deepWorkActive && (
                        <div className="w-full animate-fade-in-down delay-100 mt-1">
                            <div className="flex flex-col items-center gap-2">
                                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                                    <CalendarIcon className="w-3 h-3 text-[var(--skin-accent-color)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{activeCycle.name}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="text-[9px] font-bold text-gray-400">{daysLeft}D RESTANTES</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center Section: SITREP (Main Focus) */}
                <div className="flex-1 flex flex-col items-center justify-start w-full max-w-sm px-4 z-10 animate-fade-in overflow-hidden h-full min-h-0 mb-4">
                    <div className="relative w-full h-full flex flex-col group">
                        {/* Decorative background glow */}
                        <div className="absolute inset-0 bg-[var(--skin-accent-color)]/5 blur-2xl rounded-3xl -z-10 transition-all duration-500" />

                        <GlassCard
                            id="sitrep-embedded-card"
                            variant="gold"
                            className="bg-black/40 backdrop-blur-md rounded-[2rem] p-4 flex flex-col gap-2 shadow-2xl relative overflow-hidden h-full border border-white/10"
                        >
                            {/* Header / Lock Control */}
                            <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-[var(--skin-accent-color)]/10 flex items-center justify-center border border-[var(--skin-accent-color)]/30">
                                        <CheckCircleIcon className="w-4 h-4 text-[var(--skin-accent-color)]" />
                                    </div>
                                    <div>
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">SITREP</h2>
                                        <div className="text-xs font-bold text-white uppercase tracking-wider">
                                            {dailyCommitment.stage === 'planning' ? 'Planejamento' : dailyCommitment.stage === 'battle' ? 'Combate' : 'Julgamento'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSitrepLocked(!isSitrepLocked)}
                                    className={`p-2 rounded-full transition-all ${isSitrepLocked
                                            ? 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                                            : 'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] border border-[var(--skin-accent-color)]/30'
                                        }`}
                                >
                                    {isSitrepLocked ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${isSitrepLocked ? 'opacity-50 pointer-events-none grayscale-[0.5]' : 'opacity-100 pointer-events-auto'}`}>
                                <SitrepContent />
                            </div>

                            {/* Locked Overlay Hint */}
                            {isSitrepLocked && (
                                <div className="absolute inset-0 top-16 z-10 flex items-center justify-center pointer-events-none">
                                    <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                                        <LockIcon className="w-3 h-3 text-gray-400" />
                                        <span className="text-[10px] uppercase tracking-wider text-gray-300 font-bold">Modo Visualização</span>
                                    </div>
                                </div>
                            )}
                        </GlassCard>
                    </div>
                </div>

                {/* Bottom Section: Indicators & Unlock */}
                <div className="flex-none mb-8 flex flex-col items-center gap-6 z-10 w-full px-6">
                    {/* Quick Indicators Row */}
                    <div className="flex items-center justify-center gap-4 animate-fade-in delay-500">
                        {/* Mood Indicator */}
                        <button
                            onMouseDown={() => handleQuickActionStart('mood')}
                            onMouseUp={handleQuickActionEnd}
                            onMouseLeave={handleQuickActionEnd}
                            onTouchStart={() => handleQuickActionStart('mood')}
                            onTouchEnd={handleQuickActionEnd}
                            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform relative"
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg group-hover:border-[var(--skin-accent-color)]/50 transition-colors relative overflow-hidden ${actionProgress?.id === 'mood' ? 'scale-110 border-[var(--skin-accent-color)]' : ''}`}
                                style={{ borderColor: `${currentMood?.color}40` }}
                            >
                                {/* Individual Progress Ring */}
                                {actionProgress?.id === 'mood' && (
                                    <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="48"
                                            fill="none"
                                            stroke="var(--skin-accent-color)"
                                            strokeWidth="4"
                                            strokeDasharray="301.6"
                                            strokeDashoffset={301.6 - (301.6 * actionProgress.progress) / 100}
                                        />
                                    </svg>
                                )}
                                <div
                                    className="w-5 h-5 rounded-full shadow-[0_0_10px_currentColor]"
                                    style={{ backgroundColor: currentMood?.color, color: currentMood?.color }}
                                />
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Humor</span>
                        </button>

                        {/* Clan Indicator */}
                        {clan && (
                            <button
                                onMouseDown={() => handleQuickActionStart('clan')}
                                onMouseUp={handleQuickActionEnd}
                                onMouseLeave={handleQuickActionEnd}
                                onTouchStart={() => handleQuickActionStart('clan')}
                                onTouchEnd={handleQuickActionEnd}
                                className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform relative"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg group-hover:border-[var(--skin-accent-color)]/50 transition-colors relative overflow-hidden ${actionProgress?.id === 'clan' ? 'scale-110 border-[var(--skin-accent-color)]' : ''}`}>
                                    {actionProgress?.id === 'clan' && (
                                        <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="48"
                                                fill="none"
                                                stroke="var(--skin-accent-color)"
                                                strokeWidth="4"
                                                strokeDasharray="301.6"
                                                strokeDashoffset={301.6 - (301.6 * actionProgress.progress) / 100}
                                            />
                                        </svg>
                                    )}
                                    <UsersIcon className="w-5 h-5 text-[var(--skin-accent-color)]" />
                                </div>
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Clã</span>
                            </button>
                        )}

                        {/* Oracle Indicator */}
                        <button
                            onMouseDown={() => handleQuickActionStart('oracle')}
                            onMouseUp={handleQuickActionEnd}
                            onMouseLeave={handleQuickActionEnd}
                            onTouchStart={() => handleQuickActionStart('oracle')}
                            onTouchEnd={handleQuickActionEnd}
                            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform relative"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg group-hover:border-amber-400/50 transition-colors relative overflow-hidden ${actionProgress?.id === 'oracle' ? 'scale-110 border-amber-400' : ''}`}>
                                {actionProgress?.id === 'oracle' && (
                                    <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="48"
                                            fill="none"
                                            stroke="#fbbf24"
                                            strokeWidth="4"
                                            strokeDasharray="301.6"
                                            strokeDashoffset={301.6 - (301.6 * actionProgress.progress) / 100}
                                        />
                                    </svg>
                                )}
                                <SparklesIcon className="w-5 h-5 text-amber-400" />
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Oracle</span>
                        </button>

                        {/* Deep Work Indicator */}
                        <button
                            onMouseDown={() => handleQuickActionStart('deepwork')}
                            onMouseUp={handleQuickActionEnd}
                            onMouseLeave={handleQuickActionEnd}
                            onTouchStart={() => handleQuickActionStart('deepwork')}
                            onTouchEnd={handleQuickActionEnd}
                            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform relative"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg group-hover:border-cyan-400/50 transition-colors relative overflow-hidden ${deepWorkActive ? 'border-cyan-400/50 ring-1 ring-cyan-400/20' : ''} ${actionProgress?.id === 'deepwork' ? 'scale-110 border-cyan-400' : ''}`}>
                                {actionProgress?.id === 'deepwork' && (
                                    <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="48"
                                            fill="none"
                                            stroke="#22d3ee"
                                            strokeWidth="4"
                                            strokeDasharray="301.6"
                                            strokeDashoffset={301.6 - (301.6 * actionProgress.progress) / 100}
                                        />
                                    </svg>
                                )}
                                <ZapIcon className={`w-5 h-5 ${deepWorkActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Foco</span>
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            onMouseDown={handleStartHold}
                            onMouseUp={handleEndHold}
                            onMouseLeave={handleEndHold}
                            onTouchStart={handleStartHold}
                            onTouchEnd={handleEndHold}
                            className="relative group active:scale-95 transition-transform duration-200"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {/* Progress Ring Background */}
                            <div className="absolute inset-0 rounded-full border-2 border-white/5" />

                            {/* Progress Ring Active */}
                            <svg className="absolute inset-[-4px] -rotate-90 w-[calc(100%+8px)] h-[calc(100%+8px)] pointer-events-none" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="48"
                                    fill="none"
                                    stroke="var(--skin-accent-color)"
                                    strokeWidth="2"
                                    strokeDasharray="301.6" // 2 * pi * 48
                                    strokeDashoffset={301.6 - (301.6 * holdProgress) / 100}
                                    className="transition-all duration-75 ease-linear"
                                    style={{ filter: 'drop-shadow(0 0 5px var(--skin-accent-color))' }}
                                />
                            </svg>

                            {/* Button Content */}
                            <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center relative z-10 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--skin-accent-color)]/5 to-transparent opacity-50" />
                                {isUnlocked ? (
                                    <UnlockIcon className="w-6 h-6 text-[var(--skin-accent-color)] animate-unlock" />
                                ) : (
                                    <LockIcon className="w-6 h-6 text-gray-500 group-active:text-[var(--skin-accent-color)] transition-colors duration-300" />
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Modals Overlay */}
                {isMoodOpen && (
                    <div className="fixed inset-0 z-[10001]">
                        <MoodModal onClose={() => setIsMoodOpen(false)} />
                    </div>
                )}
                {isOracleOpen && (
                    <div className="fixed inset-0 z-[10001]">
                        <OracleFeed onClose={() => setIsOracleOpen(false)} />
                    </div>
                )}
                {isClanOpen && clan && (
                    <div className="fixed inset-0 z-[10001]">
                        <ClanDetailModal clanName={clan.name} onClose={() => setIsClanOpen(false)} />
                    </div>
                )}
                {/* Removed isSitrepOpen block since it is now embedded */}

                {/* Deep Work Selection Modal */}
                {isDeepWorkOpen && (
                    <Portal>
                        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
                            <GlassCard variant="gold" className="w-full max-w-xs p-6 flex flex-col items-center gap-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center border border-cyan-400/30">
                                        <ClockIcon className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Deep Work</h2>
                                    <p className="text-[10px] text-gray-400 text-center uppercase tracking-wider">Selecione o tempo de foco</p>
                                </div>

                                <div className="w-full">
                                    <WheelPicker
                                        options={deepWorkOptions}
                                        value={selectedDeepWorkTime}
                                        onSelect={setSelectedDeepWorkTime}
                                    />
                                    <div className="mt-2 text-center">
                                        <span className="text-[10px] font-black text-cyan-400/60 uppercase">Minutos</span>
                                    </div>
                                </div>

                                <div className="flex w-full gap-3">
                                    <button
                                        onClick={() => setIsDeepWorkOpen(false)}
                                        className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDeepWorkStart}
                                        className="flex-1 py-3 rounded-xl bg-cyan-500 text-[10px] font-black uppercase tracking-widest text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                    >
                                        Iniciar
                                    </button>
                                </div>
                            </GlassCard>
                        </div>
                    </Portal>
                )}
            </div>
        </Portal>
    );
};
