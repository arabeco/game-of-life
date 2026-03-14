import React, { useState, useEffect, useRef } from 'react';
import { Arena, Action, ScheduledTask } from '../types';
import { useGame } from '../contexts/GameContext';
import { CheckIcon, CloseIcon } from './Icons';
import { ArenaCard } from './ArenaCard';
import { Portal } from './Portal';
import './arena-ui.css';
import { EmojiGlyph } from './EmojiGlyph';

// Helper to render plasma background (reused from ArenaDetailModal)
const hexToRgb = (hex: string) => {
    const trimmed = hex.trim();
    if (trimmed.startsWith('rgb')) {
        const values = trimmed.replace(/rgba?\(|\)/g, '').split(',').map(val => Number.parseFloat(val.trim()));
        return { r: values[0] || 0, g: values[1] || 0, b: values[2] || 0 };
    }
    const normalized = trimmed.replace('#', '');
    const value = normalized.length === 3
        ?normalized.split('').map(ch => ch + ch).join('')
        : normalized;
    const intValue = Number.parseInt(value, 16);
    return {
        r: (intValue >> 16) & 255,
        g: (intValue >> 8) & 255,
        b: intValue & 255,
    };
};

const PlasmaCanvas: React.FC<{ color: string; opacity: number; className?: string; }> = ({ color, opacity, className }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sizeRef = useRef({ width: 0, height: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
            const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
            if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
                canvas.width = nextWidth;
                canvas.height = nextHeight;
                sizeRef.current = { width: nextWidth, height: nextHeight };
            }
        };
        resize();
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        window.addEventListener('resize', resize);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', resize);
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { r, g, b } = hexToRgb(color);
        let frame = 0;
        const draw = () => {
            const { width, height } = sizeRef.current;
            if (!width || !height) {
                requestAnimationFrame(draw);
                return;
            }
            frame += 0.006;
            ctx.clearRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'lighter';
            const pulse = (Math.sin(frame * 0.7) + 1) * 0.5;
            const blobs = [
                { x: width * (0.3 + Math.sin(frame * 1.2) * 0.18), y: height * (0.4 + Math.cos(frame * 0.9) * 0.2), radius: width * 0.5 },
                { x: width * (0.65 + Math.cos(frame * 1.1) * 0.22), y: height * (0.35 + Math.sin(frame * 1.3) * 0.18), radius: width * 0.45 },
                { x: width * (0.5 + Math.sin(frame * 0.8) * 0.16), y: height * (0.65 + Math.cos(frame * 1.05) * 0.16), radius: width * 0.55 },
            ];
            const centerGradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.45);
            centerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity * (0.7 + pulse * 0.6)})`);
            centerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = centerGradient;
            ctx.fillRect(0, 0, width, height);
            ctx.save();
            ctx.translate(width * 0.5, height * 0.5);
            ctx.rotate(frame * 0.35);
            const beamGradient = ctx.createLinearGradient(-width * 0.5, 0, width * 0.5, 0);
            beamGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            beamGradient.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`);
            beamGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${opacity * 0.9})`);
            beamGradient.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`);
            beamGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = beamGradient;
            ctx.fillRect(-width * 0.75, -height * 0.08, width * 1.5, height * 0.16);
            ctx.restore();
            blobs.forEach(blob => {
                const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            });
            ctx.globalCompositeOperation = 'source-over';
            requestAnimationFrame(draw);
        };
        const id = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(id);
    }, [color, opacity]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
        />
    );
};

interface SpectatorArenaModalProps {
    arena: Arena;
    actions: Action[];
    tasks: ScheduledTask[];
    pupilName: string;
    onClose: () => void;
    // Mentor Controls
    isMentor?: boolean;
    satisfactionLevel?: number;
    onSatisfactionChange?: (value: number) => void;
    onSignal?: (type: 'praise' | 'support' | 'scold') => void;
}

export const SpectatorArenaModal: React.FC<SpectatorArenaModalProps> = ({ 
    arena, 
    actions, 
    tasks, 
    pupilName, 
    onClose,
    isMentor,
    satisfactionLevel = 50,
    onSatisfactionChange,
    onSignal
}) => {
    const { getActionBackgroundStyle, getClanQuestsForArena, getClanQuestProgress } = useGame();
    const [skinColor, setSkinColor] = useState('#F0C843');
    const [localSatisfaction, setLocalSatisfaction] = useState(satisfactionLevel);

    useEffect(() => {
        setLocalSatisfaction(satisfactionLevel);
    }, [satisfactionLevel]);

    useEffect(() => {
        const value = getComputedStyle(document.documentElement).getPropertyValue('--skin-accent-color').trim();
        if (value) setSkinColor(value);
    }, []);

    const sliderColor = (value: number) => {
        if (value <= 33) return 'from-red-500 to-red-600';
        if (value <= 66) return 'from-yellow-500 to-yellow-600';
        return 'from-green-500 to-green-600';
    };

    const handleSignal = (type: 'praise' | 'support' | 'scold') => {
        if (onSignal) onSignal(type);
        // Visual feedback could be added here
    };

    const milestoneActions = actions.filter(a => a.actionType === 'Marco');
    const bronzeActions = actions.filter(a => a.actionType !== 'Marco');

    const normalizedArena = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const clanQuests = getClanQuestsForArena(arena, actions);
    const isClanQuestArena = clanQuests.length > 0 || normalizedArena.includes('quests - cla');

    const totalPlanned = actions.reduce((acc, a) => acc + (a.repetitions || 0), 0);
    const totalCompleted = tasks.filter(t => actions.some(a => a.id === t.actionId) && t.completed).length;
    const clanQuestTotals = clanQuests.reduce((acc, quest) => {
        const progressValue = getClanQuestProgress(quest.id);
        const goal = quest.requirements?.clanGoal || quest.goal_value || 50;
        return {
            totalProgress: acc.totalProgress + progressValue,
            totalGoal: acc.totalGoal + goal
        };
    }, { totalProgress: 0, totalGoal: 0 });

    const progress = isClanQuestArena && clanQuests.length > 0
        ?(clanQuestTotals.totalGoal > 0
            ?(clanQuestTotals.totalProgress / clanQuestTotals.totalGoal) * 100
            : Math.min(100, clanQuestTotals.totalProgress))
        : (totalPlanned > 0 ?(totalCompleted / totalPlanned) * 100 : 0);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center animate-fade-in" onClick={handleBackdropClick}>
            <div 
                className="dossier-bg arena-plate border w-full max-w-sm m-4 rounded-2xl p-4 flex flex-col h-auto max-h-[90vh] relative overflow-hidden"
                style={{ borderColor: 'var(--skin-accent-color)', backgroundImage: 'linear-gradient(135deg, rgba(20,20,20,0.96) 0%, rgba(10,10,10,1) 58%, rgba(18,18,18,0.9) 100%)' }}
            >
                <div className="arena-plasma" style={{ opacity: 0.45 }}>
                    <PlasmaCanvas color={skinColor} opacity={0.189} className="arena-plasma-canvas" />
                </div>

                <div className="relative z-10 flex flex-col space-y-3">
                    <div className="arena-plate-header flex justify-between items-center flex-shrink-0 gap-2 rounded-xl px-2 py-2 bg-black/20">
                         <div className="flex-1 text-center">
                            <h2 className="luxe-title-ornate text-lg font-black uppercase tracking-wider text-[color:var(--skin-accent-color)]">
                                {arena.name}
                            </h2>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">OBSERVANDO {pupilName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
                            <CloseIcon className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-center text-center space-y-1">
                        <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center">
                           <EmojiGlyph symbol={arena.icon || "🏛️"} size="arena" className="arena-icon text-white" />
                        </div>
                        <p className="text-sm text-gray-500 pt-1">{arena.description || 'Sem descrição.'}</p>
                    </div>

                    <div className="flex-grow space-y-2 flex flex-col overflow-y-auto custom-scrollbar">
                         {milestoneActions.length > 0 && (
                            <div className="flex-shrink-0">
                                <div className='relative text-center mb-2'>
                                   <hr className="border-t border-gray-800" />
                                   <h3 className="text-xs font-semibold text-[var(--skin-accent-color)] uppercase tracking-wider absolute -top-2 left-1/2 -translate-x-1/2 bg-[#101010] px-2">Marcos</h3>
                                </div>
                                <div className="flex flex-col items-center space-y-2 py-2">
                                    {milestoneActions.map(action => {
                                        const backgroundStyle = getActionBackgroundStyle(action.id);
                                        const task = tasks.find(t => t.actionId === action.id);
                                        const isCompleted = task?.completed;

                                        return (
                                            <div key={action.id} className="relative">
                                                <div 
                                                    style={backgroundStyle}
                                                    className="relative w-20 h-20 flex-shrink-0 border border-[var(--skin-accent-color)] rounded-xl overflow-hidden p-1 transform rotate-45"
                                                >
                                                    <div className="arena-plasma">
                                                        <PlasmaCanvas color={skinColor} opacity={0.189} className="arena-plasma-canvas" />
                                                    </div>
                                                    <div className="relative z-10 transform -rotate-45 flex flex-col items-center justify-center space-y-1 h-full">
                                                        <EmojiGlyph symbol={action.icon || '📝'} size="picker" className="text-white" />
                                                        <p className="text-xs font-bold leading-tight line-clamp-2">{action.name}</p>
                                                    </div>
                                                </div>
                                                {isCompleted && (
                                                    <div className="absolute top-0 right-0 bg-green-500 rounded-full p-1 border-2 border-black z-20">
                                                        <CheckIcon className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                       <div className='relative text-center mb-2 flex-shrink-0'>
                           <hr className="border-t border-gray-800" />
                           <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider absolute -top-2 left-1/2 -translate-x-1/2 bg-[#101010] px-2">Ações de Bronze</h3>
                       </div>
                       <div className="flex-grow overflow-x-auto overflow-y-hidden py-2">
                           <div className="flex space-x-2 h-full items-center justify-center">
                               {bronzeActions.map(action => {
                                    const backgroundStyle = getActionBackgroundStyle(action.id);
                                    const task = tasks.find(t => t.actionId === action.id);
                                    const completedCount = tasks.filter(t => t.actionId === action.id && t.completed).length;
                                    const totalProposed = action.repetitions;
                                    const displayProgress = `${completedCount}/${totalProposed}`;

                                    return (
                                        <div key={action.id} className="relative flex-shrink-0">
                                            <div 
                                                style={backgroundStyle}
                                                className="relative w-20 h-20 border border-[var(--skin-accent-color)] rounded-xl overflow-hidden"
                                            >
                                                <div className="arena-plasma">
                                                    <PlasmaCanvas color={skinColor} opacity={0.189} className="arena-plasma-canvas" />
                                                </div>
                                                <div className="relative z-10 flex flex-col items-center justify-center text-center p-1 space-y-1 h-full">
                                                    <EmojiGlyph symbol={action.icon || '📝'} size="picker" className="text-white" />
                                                    <p className="text-xs font-bold leading-tight line-clamp-2">{action.name}</p>
                                                </div>
                                            </div>
                                            <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none border border-white/10">
                                                {displayProgress}
                                            </div>
                                        </div>
                                    );
                               })}
                               {bronzeActions.length === 0 && <div className="text-xs text-gray-500">Sem ações.</div>}
                           </div>
                       </div>
                    </div>

                    <div className="flex-shrink-0 space-y-2 pt-2">
                        <div className="arena-plate-progress">
                            <div className="arena-plate-progress-fill" style={{ width: `${progress}%`, backgroundColor: 'var(--skin-accent-color)' }}></div>
                        </div>
                        <p className="text-sm font-bold text-gray-300 text-center">{progress.toFixed(0)}%</p>
                    </div>

                    {/* Mentor Controls - Floating Footer */}
                    {isMentor && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                                    <span className="text-gray-400">Nível de Satisfação</span>
                                    <span className={localSatisfaction <= 33 ?'text-red-400' : localSatisfaction <= 66 ?'text-yellow-400' : 'text-green-400'}>{Math.round(localSatisfaction)}%</span>
                                </div>
                                <div className="relative h-6 w-full flex items-center">
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={localSatisfaction}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setLocalSatisfaction(val);
                                        }}
                                        onMouseUp={() => onSatisfactionChange?.(localSatisfaction)}
                                        onTouchEnd={() => onSatisfactionChange?.(localSatisfaction)}
                                        className="w-full h-2 rounded-full appearance-none bg-black/50 outline-none z-20 relative cursor-pointer"
                                        style={{
                                            backgroundImage: `linear-gradient(to right, ${localSatisfaction <= 33 ?'#ef4444' : localSatisfaction <= 66 ?'#eab308' : '#22c55e'} ${localSatisfaction}%, rgba(255,255,255,0.1) ${localSatisfaction}%)`
                                        }}
                                    />
                                    {/* Tick marks or decoration could go here */}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => handleSignal('praise')}
                                    className="py-3 rounded-xl bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 text-[10px] font-bold uppercase tracking-wider text-green-300 hover:bg-green-500/20 hover:border-green-400 transition-all flex flex-col items-center gap-1 active:scale-95"
                                >
                                    <span className="text-lg">🔥</span>
                                    Elogio
                                </button>
                                <button 
                                    onClick={() => handleSignal('support')}
                                    className="py-3 rounded-xl bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider text-blue-300 hover:bg-blue-500/20 hover:border-blue-400 transition-all flex flex-col items-center gap-1 active:scale-95"
                                >
                                    <span className="text-lg">🛡️</span>
                                    Força
                                </button>
                                <button 
                                    onClick={() => handleSignal('scold')}
                                    className="py-3 rounded-xl bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider text-red-300 hover:bg-red-500/20 hover:border-red-400 transition-all flex flex-col items-center gap-1 active:scale-95"
                                >
                                    <span className="text-lg">⚡</span>
                                    Bronca
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pupil View (Read Only Satisfaction) */}
                    {!isMentor && satisfactionLevel !== undefined && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider mb-2">
                                    <span className="text-gray-400">Avaliação do Mentor</span>
                                    <span className={satisfactionLevel <= 33 ?'text-red-400' : satisfactionLevel <= 66 ?'text-yellow-400' : 'text-green-400'}>{Math.round(satisfactionLevel)}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ${satisfactionLevel <= 33 ?'bg-red-500' : satisfactionLevel <= 66 ?'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${satisfactionLevel}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </Portal>
    );
};
