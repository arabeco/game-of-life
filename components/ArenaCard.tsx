import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Arena, Action } from '../types';
import { CheckIcon, UsersIcon } from './Icons';
import { getLocalDateString, useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { calculateArenaProgress } from '../utils/progressUtils';
import { EmojiGlyph } from './EmojiGlyph';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import './arena-ui.css';

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

const rgbaString = (hex: string, alpha: number) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
        let r = 240, g = 200, b = 67;
        let animationId: number;

        const draw = () => {
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
    compact?: boolean;
}> = ({ action, onDragStart, onDragOver, onDrop, isDragOver, compact = false }) => {
    const { getActionBackgroundStyle, getArenas, getClanQuestProgress, getClanQuestForActionName } = useGame();
    const backgroundStyle = getActionBackgroundStyle(action.id);
    
    const arena = getArenas().find(ar => ar.id === action.arenaId);
    const normalizedArena = arena?.name ? arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
    const clanQuest = getClanQuestForActionName(action.name);
    const isClanQuest = !!clanQuest;
    const isSeasonQuest = normalizedArena.includes('quests - season');
    const displayIcon = action.icon || '\u{1F3DB}\uFE0F';

    const currentProgress = clanQuest ? getClanQuestProgress(clanQuest.id) : 0;
    const target = clanQuest?.requirements?.clanGoal || clanQuest?.goal_value || 50;
    const actionsRemaining = clanQuest ? Math.max(0, target - currentProgress) : 0;

    const renderIcon = () => {
        // Override for special quests
        if (isClanQuest) {
             return (
                 <div className="relative w-full h-full flex items-center justify-center">
                     <EmojiGlyph symbol={displayIcon} size="action" className="text-white" />
                     {actionsRemaining > 0 && (
                         <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full min-w-[12px] text-center border border-black">
                             {actionsRemaining}
                         </div>
                     )}
                 </div>
             );
        }
        if (isSeasonQuest) return <EmojiGlyph symbol={displayIcon} size="action" className="text-white" />;

        return <EmojiGlyph symbol={displayIcon} size="action" className="text-white" />;
    };
    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            style={backgroundStyle} 
            className={`${compact ? 'w-[1.32rem] h-[1.32rem] rounded-[6px]' : 'w-6 h-6 rounded-md'} border ${isDragOver ? 'border-white scale-110' : 'border-[var(--accent-bronze)]'} flex items-center justify-center flex-shrink-0 relative overflow-visible transition-all cursor-grab active:cursor-grabbing`}
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
    variant: 'overview' | 'dossier' | 'compact';
    highlightPhase?: 'populate' | 'celebrate' | null;
}

export const ArenaCard: React.FC<ArenaCardProps & { tasks?: any[] }> = ({ 
    arena, 
    actions, 
    onClick, 
    assetName, 
    variant, 
    highlightPhase = null,
    tasks: propTasks
}) => {
    const { appMode, tasks: contextTasks, activeCycle, getActionBackgroundStyle, getClanQuestProgress, getArenas, clanQuestParticipants, fetchClanQuestParticipants, getClanQuestsForArena, getSharedActionPoolProgress, reorderAction } = useGame();
    const tasks = (propTasks || contextTasks) as any[];
    const tasksForCounts = useMemo(() => {
        if (propTasks || !activeCycle) return tasks;

        const today = getLocalDateString();
        const cycleEnd = today < activeCycle.endDate ? today : activeCycle.endDate;
        return tasks.filter(task =>
            typeof task?.date === 'string' &&
            task.date >= activeCycle.startDate &&
            task.date <= cycleEnd
        );
    }, [activeCycle, propTasks, tasks]);
    const [dragOverActionId, setDragOverActionId] = useState<string | null>(null);
    const [linkType, setLinkType] = useState<string | null>(null);

    useEffect(() => {
        // Fetch link type for icon
        const fetchLinkType = async () => {
             const { data: sessionData } = await supabase.auth.getSession();
             const uid = sessionData.session?.user.id;
             if (!uid) return;

             const linkedArenaResult = await supabase
                 .from('relationship_link_arenas')
                 .select('relationship_link_id')
                 .eq('arena_id', arena.id)
                 .maybeSingle();

             const linkedRelationshipId = linkedArenaResult.data?.relationship_link_id || null;

             const { data } = await supabase.from('relationship_links')
                 .select('link_type')
                 .or(`mentor_id.eq.${uid},pupil_id.eq.${uid}`)
                 .eq(linkedRelationshipId ? 'id' : 'arena_id', linkedRelationshipId || arena.id)
                 .is('ended_at', null)
                 .maybeSingle();

             if (data) {
                 setLinkType(data.link_type);
             }
        };
        fetchLinkType();
    }, [arena.id]);

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
    
    
    // Clan Quest Data
    useEffect(() => {
        if (!isClanQuestArena) return;
        clanQuests.forEach(quest => {
            if (quest.actionTemplate?.name) {
                fetchClanQuestParticipants(quest.id, quest.actionTemplate.name);
            }
        });
    }, [isClanQuestArena, clanQuests, fetchClanQuestParticipants]);

    const participants = clanQuests.reduce((acc, quest) => acc + (clanQuestParticipants[quest.id] || 0), 0);

    const progress = calculateArenaProgress({
        arena,
        actions,
        tasks: tasksForCounts,
        clanQuests,
        getClanQuestProgress,
        getSharedActionPoolProgress,
        forceSharedPool: !!linkType,
    }).progressPercent;

    const getIcon = () => {
        return <EmojiGlyph symbol={arena.icon || '\u{1F3DB}\uFE0F'} size="arena" className="text-white" />;
    };

    const isOverview = variant === 'overview';
    const isCompactThumbnail = variant === 'overview' || variant === 'compact';
    const visibleMilestones = isCompactThumbnail ? milestoneActions.slice(0, 1) : milestoneActions;
    const visibleBronzeActions = isCompactThumbnail ? bronzeActions.slice(0, 3) : bronzeActions;
    const accentColor = isClanQuestArena ? '#C0C0C0' : (ASSET_ACCENT_COLORS[arena.assetId] || '#F0C843');
    const skinColor = 'var(--arena-card-border-color, var(--skin-accent-color))';
    const progressFillColor = 'linear-gradient(90deg, #7a5813 0%, #d4af37 46%, #f6e2a3 100%)';
    const highlightClass = highlightPhase === 'populate'
        ? 'arena-card-highlight arena-card-highlight--populate'
        : highlightPhase === 'celebrate'
            ? 'arena-card-highlight arena-card-highlight--celebrate'
            : '';
    const baseClasses = `arena-plate rounded-lg border-[0.75px] flex flex-col relative overflow-hidden transition-all duration-300 select-none pointer-events-none ${isCompactThumbnail ? 'justify-start px-[0.34rem] pt-[0.12rem] pb-[0.14rem]' : 'justify-between px-1 py-[0.34rem]'} ${highlightClass}`;
    const styleClasses = isOverview 
        ? 'h-[6.7rem]' 
        : variant === 'dossier' ? 'h-full w-full' : 'h-[5.5rem]';
    const archivedClasses = arena.isArchived ? 'opacity-50 saturate-50' : '';
    const compactHeight = isOverview ? '6.85rem' : variant === 'compact' ? '5.7rem' : undefined;
    const cardStyle: React.CSSProperties = {
        borderColor: skinColor,
        backgroundImage: [
            `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.26), rgba(255,255,255,0.08) 26%, transparent 52%)`,
            `radial-gradient(circle at 100% 100%, ${rgbaString(accentColor, 0.24)}, transparent 38%)`,
            `linear-gradient(160deg, rgba(156,164,177,0.98) 0%, rgba(112,120,133,0.94) 26%, rgba(46,49,58,0.95) 58%, ${rgbaString(accentColor, 0.18)} 84%, rgba(12,14,18,0.99) 100%)`,
        ].join(', '),
        ...(compactHeight ? { height: compactHeight } : {}),
    };
    const tiltStyle: React.CSSProperties = {
        transform: 'none',
    };
    
    return (
        <div 
            onClick={onClick} 
            className={`${baseClasses} ${styleClasses} ${archivedClasses} ${isCompactThumbnail ? 'justify-start gap-[1px]' : ''}`} 
            style={{ ...cardStyle, ...tiltStyle }}
        >
            {!isCompactThumbnail && <div className="absolute top-0 left-0 right-0 h-[2px] z-10" style={{ backgroundColor: skinColor }} />}
            <div className="arena-plasma pointer-events-none">
                <PlasmaCanvas color={accentColor} opacity={0.35} className="arena-plasma-canvas" width={320} height={220} />
            </div>
            <div
                className={`text-center relative z-10 pointer-events-none select-none ${isCompactThumbnail ? 'arena-thumb-layout flex-shrink-0' : ''}`}
            >
                {isCompactThumbnail ? (
                    <>
                    <div className="arena-thumb-header">
                        <div className="arena-thumb-link-space">
                            {linkType === 'competicao' && <EmojiGlyph symbol={'\u2694\uFE0F'} size="badge" className="arena-thumb-link-badge text-red-400" />}
                            {linkType === 'mentoria' && <EmojiGlyph symbol={'\u{1F441}\uFE0F'} size="badge" className="arena-thumb-link-badge text-blue-400" />}
                            {linkType === 'parceria' && <EmojiGlyph symbol={'\u2694\uFE0F'} size="badge" className="arena-thumb-link-badge text-purple-400" />}
                        </div>
                        <span className="arena-thumb-header-icon-wrap">
                            <span className="arena-icon arena-thumb-header-icon" style={{ lineHeight: 0 }}>
                                {getIcon()}
                            </span>
                        </span>
                        <div className="arena-thumb-header-copy">
                            <h3 className={`arena-thumb-heading arena-title arena-title-text text-white luxe-title-shadow ${arena.name.length > 18 ? 'arena-thumb-heading--sm' : 'arena-thumb-heading--lg'}`}>{arena.name}</h3>
                        </div>
                    </div>
                    {isOverview && assetName && <span className="arena-subtitle arena-thumb-asset">{assetName}</span>}
                    </>
                ) : (
                    <>
                        <div className="arena-icon-slot">
                            <span className="arena-icon">
                                {getIcon()}
                            </span>
                        </div>
                        <div className="arena-title-wrap">
                            <div className="flex flex-col items-center justify-start">
                                <h3 className="arena-title arena-title-text text-[11px] text-white luxe-title-shadow leading-tight line-clamp-2 arena-thumb-title">{arena.name}</h3>
                                {isOverview && assetName && <span className="arena-subtitle">{assetName}</span>}
                            </div>
                        </div>
                    </>
                )}
                
                {!isCompactThumbnail && isClanQuestArena && (
                    <div className="flex justify-center gap-2 mt-1">
                         <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded text-[10px]" style={{ color: accentColor }}>
                            <UsersIcon className="w-3 h-3" />
                            <span className="font-mono">{participants}</span>
                        </div>
                    </div>
                )}

                {linkType && !isCompactThumbnail && (
                    <div className="absolute top-1 left-1 z-20">
                        {linkType === 'competicao' && <span title="Desafio PVP" className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded border border-red-500/30"><EmojiGlyph symbol={'\u2694\uFE0F'} size="badge" className="text-red-400" /></span>}
                        {linkType === 'mentoria' && <span title="Mentoria" className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded border border-blue-500/30"><EmojiGlyph symbol={'\u{1F441}\uFE0F'} size="badge" className="text-blue-400" /></span>}
                        {linkType === 'parceria' && <span title="Parceria" className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded border border-purple-500/30"><EmojiGlyph symbol={'\u2694\uFE0F'} size="badge" className="text-purple-400" /></span>}
                    </div>
                )}
            </div>
            
            <div className={`flex flex-col items-center flex-shrink-0 relative z-10 pointer-events-auto ${isCompactThumbnail ? 'arena-mini-stack w-full' : 'space-y-2'}`}>
                <div className={`w-full flex items-center justify-center ${isCompactThumbnail ? 'arena-mini-milestones gap-1' : 'h-8 gap-2'}`}>
                    {visibleMilestones.map(action => {
                        const backgroundStyle = getActionBackgroundStyle(action.id);
                        const task = tasksForCounts.find(t => t.actionId === action.id);
                        const isCompleted = !!task?.completed;
                        const isDragOver = dragOverActionId === action.id;

                        return (
                            <div 
                                key={action.id} 
                                className={`relative ${isCompactThumbnail ? 'w-5 h-5' : 'w-7 h-7'} flex-shrink-0 transition-all cursor-grab active:cursor-grabbing ${isDragOver ? 'scale-125' : ''}`}
                                title={action.name}
                                draggable
                                onDragStart={(e) => handleActionDragStart(e, action.id)}
                                onDragOver={(e) => handleActionDragOver(e, action.id)}
                                onDrop={(e) => handleActionDrop(e, action.id)}
                            >
                                <div className={`w-full h-full transform rotate-45 ${isDragOver ? 'brightness-125' : ''}`}>
                                    <div 
                                        style={backgroundStyle}
                                        className={`w-full h-full ${isCompactThumbnail ? 'border-[0.75px]' : 'border'} ${isDragOver ? 'border-white' : 'border-[var(--accent-bronze)]'} rounded-sm relative`}
                                    >
                                        <div className="transform flex items-center justify-center h-full w-full">
                                            <EmojiGlyph symbol={action.icon || '\u{1F3DB}\uFE0F'} size="milestone" className="transform -rotate-45 text-white" />
                                        </div>
                                        {isCompleted && (
                                            <div className="absolute inset-0 bg-black/60 rounded-sm flex items-center justify-center">
                                                <CheckIcon className={`${isCompactThumbnail ? 'w-3 h-3' : 'w-4 h-4'} text-white transform -rotate-45`}/>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className={`w-full flex items-center justify-center overflow-x-auto hide-scrollbar ${isCompactThumbnail ? 'arena-mini-actions gap-1' : 'h-6 gap-1.5'}`}>
                    {visibleBronzeActions.map(action => (
                        <ActionIcon 
                            key={action.id} 
                            action={action} 
                            onDragStart={(e) => handleActionDragStart(e, action.id)}
                            onDragOver={(e) => handleActionDragOver(e, action.id)}
                            onDrop={(e) => handleActionDrop(e, action.id)}
                            isDragOver={dragOverActionId === action.id}
                            compact={isCompactThumbnail}
                        />
                    ))}
                </div>
                <div className={`arena-plate-progress w-full ${isCompactThumbnail ? 'arena-mini-progress' : 'mt-0.5'}`}>
                    <div
                        className={`arena-plate-progress-fill ${highlightPhase === 'celebrate' && progress >= 100 ? 'arena-plate-progress-fill--celebrate' : ''}`}
                        style={{
                            width: `${progress}%`,
                            background: progressFillColor,
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

