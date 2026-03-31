import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Arena, Action, RelationshipLinkType } from '../types';
import { CheckIcon, CrownIcon, TrophyIcon, UsersIcon } from './Icons';
import { getLocalDateString, useGame } from '../contexts/GameContext';
import { supabase } from '../supabaseClient';
import { calculateArenaProgress } from '../utils/progressUtils';
import { EmojiGlyph } from './EmojiGlyph';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { getContentVisualPalette, resolveArenaVisualFamily } from '../utils/contentCardVisuals';
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
    relationshipBadgeType?: RelationshipLinkType | null;
}

export const ArenaCard: React.FC<ArenaCardProps & { tasks?: any[] }> = ({ 
    arena, 
    actions, 
    onClick, 
    assetName, 
    variant, 
    highlightPhase = null,
    relationshipBadgeType = null,
    tasks: propTasks
}) => {
    const { appMode, tasks: contextTasks, activeCycle, getActionBackgroundStyle, getClanQuestProgress, getArenas, clanQuestParticipants, fetchClanQuestParticipants, getClanQuestsForArena, getSharedActionPoolProgress, oraclePreferences, reorderAction, userCodexes } = useGame();
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
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
        updatePreference();

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', updatePreference);
            return () => mediaQuery.removeEventListener('change', updatePreference);
        }

        mediaQuery.addListener(updatePreference);
        return () => mediaQuery.removeListener(updatePreference);
    }, []);

    useEffect(() => {
        if (relationshipBadgeType) {
            setLinkType(relationshipBadgeType);
            return;
        }
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
    }, [arena.id, relationshipBadgeType]);

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
    const orderedCompactActions = useMemo(() => {
        const orderedIds = Array.isArray(arena.actionIds) ? arena.actionIds : [];
        if (orderedIds.length === 0) return actions;

        const actionById = new Map(actions.map(action => [action.id, action]));
        const ordered = orderedIds
            .map((actionId) => actionById.get(actionId))
            .filter((action): action is Action => Boolean(action));

        const remaining = actions.filter(action => !orderedIds.includes(action.id));
        return [...ordered, ...remaining];
    }, [actions, arena.actionIds]);

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
        forceSharedPool: linkType ? true : undefined,
    }).progressPercent;

    const getIcon = () => {
        return <EmojiGlyph symbol={arena.icon || '\u{1F3DB}\uFE0F'} size="arena" className="text-white" />;
    };
    const effectiveLinkType = relationshipBadgeType || linkType;
    const codexById = useMemo(
        () => new Map(userCodexes.map((codex) => [codex.id, codex] as const)),
        [userCodexes]
    );
    const sourceCodex = arena.originCodexId ? codexById.get(arena.originCodexId) ?? null : null;
    const renderRelationshipBadge = () => {
        if (effectiveLinkType === 'mentoria') {
            return (
                <span title="Mentoria" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/18 text-emerald-300 shadow-[0_4px_10px_rgba(16,185,129,0.18)]">
                    <CrownIcon className="h-[9px] w-[9px]" />
                </span>
            );
        }

        if (effectiveLinkType === 'parceria') {
            return (
                <span title="Parceria" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-sky-300/40 bg-sky-500/18 text-sky-300 shadow-[0_4px_10px_rgba(56,189,248,0.16)]">
                    <UsersIcon className="h-[9px] w-[9px]" />
                </span>
            );
        }

        if (effectiveLinkType === 'competicao') {
            return (
                <span title="Competição" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-rose-300/40 bg-rose-500/18 text-rose-300 shadow-[0_4px_10px_rgba(244,63,94,0.18)]">
                    <TrophyIcon className="h-[9px] w-[9px]" />
                </span>
            );
        }

        return null;
    };

    const isOverview = variant === 'overview';
    const isCompactThumbnail = variant === 'overview' || variant === 'compact';
    const plasmaEnabled = (oraclePreferences?.animationsEnabled ?? true) && !prefersReducedMotion;
    const visibleMilestones = isCompactThumbnail ? milestoneActions.slice(0, 1) : milestoneActions;
    const visibleBronzeActions = isCompactThumbnail ? bronzeActions.slice(0, 3) : bronzeActions;
    const visualFamily = resolveArenaVisualFamily({
        arena,
        relationshipLinkType: effectiveLinkType,
        sourceCodex,
    });
    const visualPalette = getContentVisualPalette(visualFamily);
    const assetAccentColor = Object.prototype.hasOwnProperty.call(ASSET_ACCENT_COLORS, arena.assetId)
        ? ASSET_ACCENT_COLORS[arena.assetId as keyof typeof ASSET_ACCENT_COLORS]
        : '#F0C843';
    const accentColor = visualFamily === 'normal'
        ? (isClanQuestArena ? '#C0C0C0' : assetAccentColor)
        : visualPalette.accent;
    const skinColor = visualPalette.border;
    const progressFillColor = `linear-gradient(90deg, ${rgbaString(accentColor, 0.32)} 0%, ${accentColor} 52%, rgba(255,255,255,0.92) 100%)`;
    const highlightClass = highlightPhase === 'populate'
        ? 'arena-card-highlight arena-card-highlight--populate'
        : highlightPhase === 'celebrate'
            ? 'arena-card-highlight arena-card-highlight--celebrate'
            : '';
    const baseClasses = `arena-plate rounded-lg border-[0.75px] flex flex-col relative overflow-hidden transition-all duration-300 select-none ${isCompactThumbnail ? 'justify-start px-[0.28rem] pt-[0.08rem] pb-[0.1rem]' : 'justify-between px-1 py-[0.34rem]'} ${highlightClass}`;
    const styleClasses = isOverview 
        ? 'h-[4.75rem] w-full' 
        : variant === 'dossier' ? 'h-full w-full' : 'h-[4.95rem]';
    const archivedClasses = arena.isArchived ? 'opacity-50 saturate-50' : '';
    const compactHeight = isOverview ? '4.75rem' : variant === 'compact' ? '4.95rem' : undefined;
    const cardBackground = visualFamily === 'normal' && isCompactThumbnail
        ? [
            'radial-gradient(circle at 14% 0%, rgba(255,255,255,0.2), transparent 30%)',
            `radial-gradient(86% 66% at 96% 88%, ${rgbaString(accentColor, 0.2)} 0%, ${rgbaString(accentColor, 0.1)} 14%, transparent 30%)`,
            `linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 64%, ${rgbaString(accentColor, 0.06)} 76%, ${rgbaString(accentColor, 0.15)} 84%, rgba(8,10,14,0) 94%)`,
            `linear-gradient(118deg, rgba(228,233,241,0.95) 0%, rgba(183,191,202,0.93) 18%, rgba(88,94,106,0.96) 44%, rgba(31,35,44,0.98) 70%, rgba(11,13,19,0.99) 100%)`,
        ].join(', ')
        : visualPalette.cardBackground;
    const cardStyle: React.CSSProperties = {
        borderColor: skinColor,
        backgroundImage: cardBackground,
        boxShadow: `0 14px 26px ${visualPalette.glow}`,
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
            {arena.isArchived && (
                <div
                    title="Arquivada"
                    className={`absolute right-1 top-1 z-20 rounded-full border border-amber-200/18 bg-black/68 px-1.5 py-[2px] font-black uppercase tracking-[0.16em] text-amber-100/88 backdrop-blur-sm ${isCompactThumbnail ? 'text-[6px]' : 'text-[7px]'}`}
                >
                    {isCompactThumbnail ? 'ARQ' : 'Arquivada'}
                </div>
            )}
            <div className={`arena-plasma pointer-events-none ${isCompactThumbnail ? 'arena-plasma--compact' : ''}`}>
                {plasmaEnabled && (
                    <PlasmaCanvas
                        color={accentColor}
                        opacity={0.35}
                        className="arena-plasma-canvas"
                        width={isCompactThumbnail ? 380 : 320}
                        height={isCompactThumbnail ? 260 : 220}
                    />
                )}
            </div>
            <div
                className={`text-center relative z-10 pointer-events-none select-none ${isCompactThumbnail ? 'arena-thumb-layout flex-1 min-h-0' : ''}`}
            >
                {isCompactThumbnail ? (
                    <>
                    <div className="arena-thumb-header flex-1 justify-start gap-[0.02rem] pt-0">
                        <div className="arena-thumb-link-space left-auto right-[0.04rem] top-[0.02rem] z-[3]">
                            {renderRelationshipBadge()}
                        </div>
                        <div className="relative h-[1.58rem] w-full">
                            <span
                                className="absolute -left-[0.3rem] top-[0.08rem] z-[3] inline-flex h-[1.14rem] w-[1.14rem] items-center justify-center rounded-full border shadow-[0_6px_14px_rgba(0,0,0,0.24)]"
                                style={{
                                    borderColor: skinColor,
                                    background: `linear-gradient(160deg, ${rgbaString(accentColor, 0.52)} 0%, ${rgbaString(accentColor, 0.24)} 100%)`,
                                }}
                            >
                                <span className="arena-icon arena-thumb-header-icon" style={{ lineHeight: 0 }}>
                                    {getIcon()}
                                </span>
                            </span>
                            <div className="ml-[0.38rem] flex h-[1.56rem] w-[calc(100%-0.38rem)] items-center justify-center overflow-hidden rounded-[0.58rem] bg-black/30 px-[0.16rem] py-[0.04rem]">
                                <div className="flex h-full w-full items-center justify-center overflow-hidden py-[0.08rem]">
                                    <h3 className={`arena-title arena-title-text arena-title-readable w-full break-normal [overflow-wrap:normal] text-white luxe-title-shadow text-center leading-[0.88] tracking-[0.03em] line-clamp-2 ${arena.name.length > 18 ? 'text-[5.45px]' : arena.name.length > 14 ? 'text-[5.7px]' : arena.name.length > 10 ? 'text-[6px]' : arena.name.length > 8 ? 'text-[6.3px]' : 'text-[6.55px]'}`}>{arena.name}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                    {isOverview && (
                        <div className="mt-[0.04rem] mb-[0.06rem] flex h-[0.32rem] w-full items-center justify-center overflow-hidden px-[0.08rem]">
                            {assetName ? <span className="arena-subtitle arena-thumb-asset mt-0 w-full truncate">{assetName}</span> : null}
                        </div>
                    )}
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
                                <h3 className="arena-title arena-title-text arena-title-readable text-[11.6px] text-white luxe-title-shadow leading-tight line-clamp-2 arena-thumb-title">{arena.name}</h3>
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

                {effectiveLinkType && !isCompactThumbnail && (
                    <div className="absolute top-1 left-1 z-20">
                        {renderRelationshipBadge()}
                    </div>
                )}
            </div>
            
            <div className={`flex flex-col items-center flex-shrink-0 relative z-10 pointer-events-auto ${isCompactThumbnail ? 'w-full gap-[0.08rem] mt-auto' : 'space-y-2'}`}>
                {isCompactThumbnail ? (
                    <div className="w-full overflow-x-auto hide-scrollbar rounded-[0.48rem] bg-black/18 px-[0.08rem] py-[0.08rem]">
                        <div className="flex min-w-max items-center gap-[0.18rem]">
                            {orderedCompactActions.map(action => {
                                const backgroundStyle = getActionBackgroundStyle(action.id);
                                const task = tasksForCounts.find(t => t.actionId === action.id);
                                const isCompleted = !!task?.completed;
                                const isDragOver = dragOverActionId === action.id;
                                const isMilestone = action.actionType === 'Marco';

                                if (isMilestone) {
                                    return (
                                        <div
                                            key={action.id}
                                            className={`relative h-[0.98rem] w-[0.98rem] flex-shrink-0 transition-all cursor-grab active:cursor-grabbing ${isDragOver ? 'scale-125' : ''}`}
                                            title={action.name}
                                            draggable
                                            onDragStart={(e) => handleActionDragStart(e, action.id)}
                                            onDragOver={(e) => handleActionDragOver(e, action.id)}
                                            onDrop={(e) => handleActionDrop(e, action.id)}
                                        >
                                            <div className={`h-full w-full rotate-45 ${isDragOver ? 'brightness-125' : ''}`}>
                                                <div
                                                    style={backgroundStyle}
                                                    className={`relative h-full w-full rounded-[3px] border-[0.75px] ${isDragOver ? 'border-white' : 'border-[var(--accent-bronze)]'}`}
                                                >
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <EmojiGlyph symbol={action.icon || '\u{1F3DB}\uFE0F'} size="milestone" className="text-white -rotate-45" />
                                                    </div>
                                                    {isCompleted && (
                                                        <div className="absolute inset-0 flex items-center justify-center rounded-[3px] bg-black/60">
                                                            <CheckIcon className="h-3 w-3 text-white -rotate-45" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <ActionIcon
                                        key={action.id}
                                        action={action}
                                        onDragStart={(e) => handleActionDragStart(e, action.id)}
                                        onDragOver={(e) => handleActionDragOver(e, action.id)}
                                        onDrop={(e) => handleActionDrop(e, action.id)}
                                        isDragOver={isDragOver}
                                        compact
                                    />
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-full flex items-center justify-center h-8 gap-2">
                            {visibleMilestones.map(action => {
                                const backgroundStyle = getActionBackgroundStyle(action.id);
                                const task = tasksForCounts.find(t => t.actionId === action.id);
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
                                                    <EmojiGlyph symbol={action.icon || '\u{1F3DB}\uFE0F'} size="milestone" className="transform -rotate-45 text-white" />
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
                        
                        <div className="w-full flex items-center justify-center overflow-x-auto hide-scrollbar h-6 gap-1.5">
                            {visibleBronzeActions.map(action => (
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
                    </>
                )}
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
