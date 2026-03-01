import React, { useEffect, useRef, useState } from 'react';
import { Arena, Action } from '../types';
import { DollarSignIcon, FlameIcon, CheckIcon, UsersIcon } from './Icons';
import { useGame } from '../contexts/GameContext';

const ASSET_ACCENT_COLORS: Record<string, string> = {
    consciencia: '#1a2a4a',
    'espaco-mental': '#0f2238',
    espiritualidade: '#1a0a2a',
    proposito: '#2a0f1a',
    projetos: '#1a2a2a',
    conexoes: '#1a2a1a',
    trabalho: '#2a2a1a',
    financas: '#2a1a00',
    hobbies: '#2a0f2a',
    fisico: '#3a0a0a',
    geral: '#1f1f1f',
};

const hexToRgb = (hex: string) => {
    const trimmed = hex.trim();
    
    // Handle rgba? format
    if (trimmed.startsWith('rgb')) {
        const matches = trimmed.match(/\d+/g);
        if (matches && matches.length >= 3) {
            return {
                r: parseInt(matches[0]),
                g: parseInt(matches[1]),
                b: parseInt(matches[2])
            };
        }
    }
    
    // Handle hex format
    const normalized = trimmed.replace('#', '');
    if (normalized.length === 3 || normalized.length === 6) {
        const value = normalized.length === 3
            ? normalized.split('').map(ch => ch + ch).join('')
            : normalized;
        const intValue = parseInt(value, 16);
        return {
            r: (intValue >> 16) & 255,
            g: (intValue >> 8) & 255,
            b: intValue & 255,
        };
    }
    
    // Default fallback (Gold)
    return { r: 240, g: 200, b: 67 };
};

const PlasmaCanvas: React.FC<{ color?: string; opacity: number; className?: string; width: number; height: number; }> = ({ color, opacity, className, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (canvasRef.current) {
            observer.observe(canvasRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let frame = 0;
        let lastColor = '';
        let r = 240, g = 200, b = 67; // Default gold
        let animationId: number;

        const draw = () => {
            // Update color from CSS variables in real-time or use prop
            let currentColor = color;
            if (!currentColor) {
                currentColor = getComputedStyle(canvas).getPropertyValue('--skin-accent-color').trim();
            }
            
            if (currentColor && currentColor !== lastColor) {
                lastColor = currentColor;
                const rgb = hexToRgb(currentColor);
                r = rgb.r;
                g = rgb.g;
                b = rgb.b;
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
                ctx.fillRect(0, 0, width * 1.5, height * 1.5);
            });

            ctx.globalCompositeOperation = 'source-over';
            animationId = requestAnimationFrame(draw);
        };
        
        draw();
        return () => cancelAnimationFrame(animationId);
    }, [color, opacity, width, height, isVisible]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={className}
        />
    );
};

const ActionIcon: React.FC<{ 
    action: Action; 
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    isDragOver?: boolean;
}> = ({ action, onDragStart, onDragOver, onDrop, isDragOver }) => {
    const { getActionBackgroundStyle, getArenas, getClanQuestProgress, getClanQuestForActionName } = useGame();
    const backgroundStyle = getActionBackgroundStyle(action.id);
    
    const arena = getArenas().find(ar => ar.id === action.arenaId);
    const normalizedArena = arena?.name ? arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
    const clanQuest = getClanQuestForActionName(action.name);
    const isClanQuest = !!clanQuest;
    const isSeasonQuest = normalizedArena.includes('quests - season');
    const displayIcon = action.icon || '🏆';

    const currentProgress = clanQuest ? getClanQuestProgress(clanQuest.id) : 0;
    const target = clanQuest?.requirements?.clanGoal || clanQuest?.goal_value || 50;
    const actionsRemaining = clanQuest ? Math.max(0, target - currentProgress) : 0;

    const renderIcon = () => {
        // Override for special quests
        if (isClanQuest) {
             return (
                 <div className="relative w-full h-full flex items-center justify-center">
                     <span className="text-sm text-white">{displayIcon}</span>
                     {actionsRemaining > 0 && (
                         <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[12px] text-center border border-black">
                             {actionsRemaining}
                         </div>
                     )}
                 </div>
             );
        }
        if (isSeasonQuest) return <span className="text-sm text-white">{displayIcon}</span>;

        switch (displayIcon) {
            case '$': return <DollarSignIcon className="w-4 h-4 text-white/80" />;
            case '🔥': return <FlameIcon className="w-4 h-4 text-white/80" />;
            default: return <span className="text-sm text-white">{displayIcon}</span>;
        }
    };
    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={backgroundStyle} 
            className={`w-6 h-6 border ${isDragOver ? 'border-white scale-110' : 'border-[var(--accent-bronze)]'} rounded-md flex items-center justify-center flex-shrink-0 relative overflow-visible transition-all cursor-grab active:cursor-grabbing`}
        >
            {renderIcon()}
        </div>
    );
};

interface ArenaCardProps {
    arena: Arena;
    actions: Action[];
    onClick: () => void;
    assetName?: string; // For overview
    variant: 'overview' | 'dossier';
}

export const ArenaCard: React.FC<ArenaCardProps & { tasks?: any[] }> = ({ arena, actions, onClick, assetName, variant, tasks: propTasks }) => {
    const { appMode, tasks: contextTasks, getActionBackgroundStyle, getClanQuestProgress, getArenas, clanQuestParticipants, fetchClanQuestParticipants, getClanQuestsForArena, reorderAction } = useGame();
    const tasks = (propTasks || contextTasks) as any[];
    const [skinTone, setSkinTone] = useState('#F0C843');
    const [dragOverActionId, setDragOverActionId] = useState<string | null>(null);

    const handleActionDragStart = (e: React.DragEvent, actionId: string) => {
        e.stopPropagation();
        e.dataTransfer.setData('actionId', actionId);
        e.dataTransfer.setData('sourceArenaId', arena.id);
    };

    const handleActionDragOver = (e: React.DragEvent, actionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverActionId(actionId);
    };

    const handleActionDrop = (e: React.DragEvent, targetActionId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverActionId(null);

        const draggedActionId = e.dataTransfer.getData('actionId');
        const sourceArenaId = e.dataTransfer.getData('sourceArenaId');

        if (sourceArenaId !== arena.id) return; // Only reorder within the same arena for now
        if (draggedActionId === targetActionId) return;

        const allActionIds = [...(arena.actionIds || [])];
        const targetIndex = allActionIds.indexOf(targetActionId);
        
        if (targetIndex !== -1) {
            reorderAction(arena.id, draggedActionId, targetIndex);
        }
    };

    const milestoneActions = actions.filter(a => a.actionType === 'Marco');
    const bronzeActions = actions.filter(a => a.actionType !== 'Marco');

    // Check if it's a clan arena
    const normalizedArena = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const clanQuests = getClanQuestsForArena(arena, actions);
    const isClanQuestArena = clanQuests.length > 0 || normalizedArena.includes('quests - cla');
    const isSeasonQuestArena = normalizedArena.includes('quests - season');
    
    let progress = 0;
    const isGold = isClanQuestArena; // Default to gold if clan arena
    
    // Clan Quest Data
    useEffect(() => {
        if (!isClanQuestArena) return;
        clanQuests.forEach(quest => {
            if (quest.actionTemplate?.name) {
                fetchClanQuestParticipants(quest.id, quest.actionTemplate.name);
            }
        });
    }, [isClanQuestArena, clanQuests, fetchClanQuestParticipants]);

    useEffect(() => {
        const updateSkinColor = () => {
            // Check computed style of body as it's the most reliable source for active CSS variables
            const style = getComputedStyle(document.body);
            let value = style.getPropertyValue('--skin-accent-color').trim();
            
            // If empty on body, check html element
            if (!value) {
                value = getComputedStyle(document.documentElement).getPropertyValue('--skin-accent-color').trim();
            }
            
            // Log for debugging if needed (invisible to user)
            if (value && value !== skinTone) {
                setSkinTone(value);
            }
        };

        // Initial update
        updateSkinColor();

        // Create an observer to watch for data-skin changes on body and html
        const observer = new MutationObserver((mutations) => {
            updateSkinColor();
        });
        
        // Observe both to be safe, as skins can be applied to either
        // Also observe 'class' just in case themes are applied via classes
        observer.observe(document.documentElement, { 
            attributes: true, 
            attributeFilter: ['data-skin', 'style', 'class'] 
        });
        observer.observe(document.body, { 
            attributes: true, 
            attributeFilter: ['data-skin', 'style', 'class'] 
        });

        // Some skins might change via JS without triggering MutationObserver on attributes
        // A small interval as fallback for skin transitions
        const interval = setInterval(updateSkinColor, 2000);

        return () => {
            observer.disconnect();
            clearInterval(interval);
        };
    }, [skinTone]);

    const participants = clanQuests.reduce((acc, quest) => acc + (clanQuestParticipants[quest.id] || 0), 0);

    if (isClanQuestArena && clanQuests.length > 0) {
        const clanQuestTotals = clanQuests.reduce((acc, quest) => {
            const goal = quest.requirements?.clanGoal || quest.goal_value || 50;
            const progressValue = getClanQuestProgress(quest.id);
            return {
                totalProgress: acc.totalProgress + progressValue,
                totalGoal: acc.totalGoal + goal
            };
        }, { totalProgress: 0, totalGoal: 0 });

        progress = clanQuestTotals.totalGoal > 0
            ? (clanQuestTotals.totalProgress / clanQuestTotals.totalGoal) * 100
            : (clanQuestTotals.totalProgress > 0 ? 100 : 0);
    } else {
        // Standard progress: Completed vs Planned (Repetitions)
        const totalPlanned = actions.reduce((acc, a) => acc + (a.repetitions || 0), 0);
        const totalCompleted = tasks.filter(t => actions.some(a => a.id === t.actionId) && t.completed).length;
        progress = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0;
    }
    
    progress = Math.min(100, Math.max(0, progress));

    const getIcon = () => {
        return <span className="text-xl leading-none">{arena.icon}</span>;
    };

    const isOverview = variant === 'overview';
    const accentColor = isClanQuestArena ? '#C0C0C0' : (ASSET_ACCENT_COLORS[arena.assetId] || '#F0C843');
    const skinColor = 'var(--skin-accent-color)';
    const baseClasses = `arena-plate p-1 rounded-lg border flex flex-col justify-between cursor-pointer relative overflow-hidden transition-all duration-300`;
    const styleClasses = isOverview 
        ? 'h-26' 
        : 'h-24';
    const archivedClasses = arena.isArchived ? 'opacity-50 saturate-50' : '';
    const cardStyle: React.CSSProperties = {
        borderColor: skinColor,
        backgroundImage: 'linear-gradient(135deg, rgba(22,22,22,0.95) 0%, rgba(10,10,10,1) 55%, rgba(18,18,18,0.9) 100%)',
    };
    const tiltStyle: React.CSSProperties = {
        transform: 'perspective(900px) rotateX(2.2deg) rotateY(-2deg)',
    };
    
    return (
        <div onClick={onClick} className={`${baseClasses} ${styleClasses} ${archivedClasses}`} style={{ ...cardStyle, ...tiltStyle }}>
            <div className="absolute top-0 left-0 right-0 h-[2px] z-10" style={{ backgroundColor: accentColor }} />
            <div className="arena-plasma">
                <PlasmaCanvas color={skinTone} opacity={0.35} className="arena-plasma-canvas" width={320} height={220} />
            </div>
            <div className="text-center relative z-10 -mt-2">
                <div className="arena-icon-slot">
                    <span className="arena-icon">
                        {getIcon()}
                    </span>
                </div>
                <div className="arena-title-wrap -mt-2">
                    <h3 className="arena-title arena-title-text text-[11px] text-white luxe-title-shadow leading-tight line-clamp-2">{arena.name}</h3>
                </div>
                {isOverview && assetName && <p className="text-[8px] text-gray-600 uppercase tracking-[0.22em] -mt-0.5">{assetName}</p>}
                
                {isClanQuestArena && (
                    <div className="flex justify-center gap-2 mt-2">
                         <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded text-[10px]" style={{ color: accentColor }}>
                            <UsersIcon className="w-3 h-3" />
                            <span className="font-mono">{participants}</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex flex-col items-center space-y-2 flex-shrink-0 relative z-10">
                {milestoneActions.length > 0 && (
                    <div className="w-full flex items-center justify-center h-8 gap-2">
                        {milestoneActions.map(action => {
                            const backgroundStyle = getActionBackgroundStyle(action.id);
                            const task = tasks.find(t => t.actionId === action.id);
                            const isCompleted = !!task?.completed;
                            const isDragOver = dragOverActionId === action.id;

                            return (
                                <div 
                                    key={action.id} 
                                    className={`relative w-7 h-7 flex-shrink-0 transition-all cursor-grab active:cursor-grabbing ${isDragOver ? 'scale-125' : ''}`}
                                    title={action.name}
                                    draggable
                                    onDragStart={(e) => handleActionDragStart(e, action.id)}
                                    onDragOver={(e) => handleActionDragOver(e, action.id)}
                                    onDrop={(e) => handleActionDrop(e, action.id)}
                                >
                                    <div className={`w-full h-full transform rotate-45 ${isDragOver ? 'brightness-125' : ''}`}>
                                        <div 
                                            style={backgroundStyle}
                                            className={`w-full h-full border ${isDragOver ? 'border-white' : 'border-[var(--accent-bronze)]'} rounded-sm relative`}
                                        >
                                            <div className="transform flex items-center justify-center h-full w-full">
                                                <span className="transform -rotate-45 text-sm">{action.icon}</span>
                                            </div>
                                            {isCompleted && (
                                                <div className="absolute inset-0 bg-black/60 rounded-sm flex items-center justify-center">
                                                    <CheckIcon className="w-4 h-4 text-white transform -rotate-45"/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                <div className="w-full flex items-center justify-center h-6 overflow-x-auto gap-1.5 hide-scrollbar">
                    {bronzeActions.map(action => (
                        <ActionIcon 
                            key={action.id} 
                            action={action} 
                            onDragStart={(e) => handleActionDragStart(e, action.id)}
                            onDragOver={(e) => handleActionDragOver(e, action.id)}
                            onDrop={(e) => handleActionDrop(e, action.id)}
                            isDragOver={dragOverActionId === action.id}
                        />
                    ))}
                </div>
                <div className="arena-plate-progress">
                    <div
                        className="arena-plate-progress-fill"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: skinColor,
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
