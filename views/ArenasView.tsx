import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../contexts/GameContext';
import { Arena, Action, ActionType, ArenaFolder, Campaign, LinkedRelationshipArena, RelationshipLinkType, ScheduledTask } from '../types';
import { PlusIcon, ArchiveBoxIcon, XIcon, LayersIcon, ListRowsIcon, ChevronDownIcon, ChevronRightIcon, CrownIcon, TrophyIcon, UsersIcon, FolderStarIcon, EditIcon } from '../components/Icons';
import { ArenaDetailModal } from '../components/ArenaDetailModal';
import { NewArenaModal } from '../components/NewArenaModal';
import { ArenaCard } from '../components/ArenaCard';
import { MiniCycleHUD } from '../components/MiniCycleHUD';
import { useCodexBuilder } from '../contexts/CodexBuilderContext';
import { IconPickerModal } from '../components/IconPickerModal';
import { FolderDetailModal } from '../components/FolderDetailModal';
import { CampaignDetailModal } from '../components/CampaignDetailModal';
import { CampaignsCodex } from '../components/CampaignsCodex';
import { CreateCampaignModal } from '../components/CreateCampaignModal';
import { CampaignArenaStack } from '../components/CampaignArenaStack';
import { EmojiGlyph } from '../components/EmojiGlyph';
import { calculateArenaProgress, calculateCampaignProgress } from '../utils/progressUtils';
import { ARENA_ATTENTION_EVENT, ArenaAttentionPayload, ArenaAttentionPhase, consumeArenaAttention } from '../utils/arenaAttention';
import { buildCodexCampaignPreview, type CodexCampaignPreview } from '../utils/codexPreview';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { FIRST_USE_ONBOARDING_EVENTS } from '../utils/firstUseOnboarding';
import { supabase } from '../supabaseClient';

const hexToRgb = (hex: string) => {
    const trimmed = hex.trim();
    if (trimmed.startsWith('rgb')) {
        const matches = trimmed.match(/\d+/g);
        if (matches && matches.length >= 3) {
            return {
                r: parseInt(matches[0], 10),
                g: parseInt(matches[1], 10),
                b: parseInt(matches[2], 10),
            };
        }
    }

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

    return { r: 240, g: 200, b: 67 };
};

const rgbaString = (hex: string, alpha: number) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type PendingAction = {
    id: string;
    name: string;
    description?: string;
    icon: string;
    duration: number;
    repetitions: number;
    actionType: ActionType;
    difficulty?: number;
};

type ArenaAttentionState = {
    arenaIds: string[];
    campaignId?: string | null;
    focusArenaId?: string | null;
    phase: ArenaAttentionPhase;
    token: number;
};

export const ArenasView: React.FC = () => {
    const { getArenas, assets, actions, tasks, addArena, updateArena, addAction, arenaFolders, createArenaFolder, moveArenaToFolder, reorderArena, reorderEntity, reorderEntityPriority, campaigns, addCampaign, updateCampaign, deleteCampaign, activeCycle, arenasViewMode, setArenasViewMode, userProfile, getClanQuestProgress, getClanQuestsForArena, getSharedActionPoolProgress, userCodexes, installCodex } = useGame();
    const { isBuilderMode } = useCodexBuilder();
    const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);
    const [sharedLinkedArenas, setSharedLinkedArenas] = useState<LinkedRelationshipArena[]>([]);
    const [selectedSharedArenaDetail, setSelectedSharedArenaDetail] = useState<{
        arena: Arena;
        actions: Action[];
        tasks: ScheduledTask[];
    } | null>(null);
    const [selectedReceivedCampaignPreview, setSelectedReceivedCampaignPreview] = useState<CodexCampaignPreview | null>(null);

    useEffect(() => {
        const handleTutorialOpenArena = (e: any) => {
            const arenaId = e.detail?.arenaId;
            if (arenaId === null) {
                setSelectedArenaId(null);
            } else if (arenaId) {
                // If it's a specific ID or 'first', we handle it
                if (arenaId === 'first') {
                    const firstArena = getArenas()[0];
                    if (firstArena) setSelectedArenaId(firstArena.id);
                } else {
                    setSelectedArenaId(arenaId);
                }
            }
        };
        window.addEventListener('tutorialOpenArena', handleTutorialOpenArena);
        return () => window.removeEventListener('tutorialOpenArena', handleTutorialOpenArena);
    }, [getArenas]);

    useEffect(() => {
        const handleTutorialRequestArenaModal = () => {
            setIsCreatingArena(true);
        };

        window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.requestArenaModalOpen, handleTutorialRequestArenaModal);
        return () => window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.requestArenaModalOpen, handleTutorialRequestArenaModal);
    }, []);

    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [isCampaignHubOpen, setCampaignHubOpen] = useState(false);
    const [isCreatingArena, setIsCreatingArena] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [arenaPresentationMode, setArenaPresentationMode] = useState<'cards' | 'list'>('cards');
    const [expandedArenaRows, setExpandedArenaRows] = useState<Record<string, boolean>>({});
    // Remove local viewMode state
    const fabRef = useRef<HTMLButtonElement>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dragOverSide, setDragOverSide] = useState<'left' | 'right' | null>(null);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
    const [arenaAttention, setArenaAttention] = useState<ArenaAttentionState | null>(null);
    const arenaAttentionTimeoutRef = useRef<number | null>(null);
    const arenaCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const campaignCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const toggleSection = (id: string) => {
        setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const registerArenaCardRef = (arenaId: string, node: HTMLDivElement | null) => {
        if (node) {
            arenaCardRefs.current.set(arenaId, node);
            return;
        }
        arenaCardRefs.current.delete(arenaId);
    };

    const registerCampaignCardRef = (campaignId: string, node: HTMLDivElement | null) => {
        if (node) {
            campaignCardRefs.current.set(campaignId, node);
            return;
        }
        campaignCardRefs.current.delete(campaignId);
    };

    const applyArenaAttention = React.useCallback((payload: ArenaAttentionPayload) => {
        const nextState: ArenaAttentionState = {
            arenaIds: payload.arenaIds,
            campaignId: payload.campaignId ?? null,
            focusArenaId: payload.focusArenaId ?? payload.arenaIds[0] ?? null,
            phase: payload.phase,
            token: payload.timestamp,
        };

        setArenaAttention(nextState);

        if (arenaAttentionTimeoutRef.current) {
            window.clearTimeout(arenaAttentionTimeoutRef.current);
        }

        arenaAttentionTimeoutRef.current = window.setTimeout(() => {
            setArenaAttention(current => current?.token === nextState.token ? null : current);
        }, payload.phase === 'celebrate' ? 2600 : 1900);

        window.setTimeout(() => {
            const targetId = payload.campaignId || payload.focusArenaId || payload.arenaIds[0];
            if (!targetId) return;

            const targetNode = payload.campaignId
                ? campaignCardRefs.current.get(payload.campaignId)
                : arenaCardRefs.current.get(targetId);

            targetNode?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }, 140);
    }, []);

    useEffect(() => {
        const pendingAttention = consumeArenaAttention();
        if (pendingAttention) {
            applyArenaAttention(pendingAttention);
        }

        const handleArenaAttention = (event: Event) => {
            const customEvent = event as CustomEvent<ArenaAttentionPayload>;
            if (!customEvent.detail) return;
            applyArenaAttention(customEvent.detail);
        };

        window.addEventListener(ARENA_ATTENTION_EVENT, handleArenaAttention);
        return () => {
            window.removeEventListener(ARENA_ATTENTION_EVENT, handleArenaAttention);
            if (arenaAttentionTimeoutRef.current) {
                window.clearTimeout(arenaAttentionTimeoutRef.current);
            }
        };
    }, [applyArenaAttention]);

    // Campaign Creation Mode
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedForCampaign, setSelectedForCampaign] = useState<string[]>([]);
    const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);

    // Builder State
    const [builderAssetId, setBuilderAssetId] = useState<string>('');
    const [arenaName, setArenaName] = useState('');
    const [arenaDescription, setArenaDescription] = useState('');
    const [arenaIcon, setArenaIcon] = useState('🏟️');
    const [arenaActive, setArenaActive] = useState(true);
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
    const [actionName, setActionName] = useState('');
    const [actionDescription, setActionDescription] = useState('');
    const [actionIcon, setActionIcon] = useState('📝');
    const [actionType, setActionType] = useState<ActionType>('Ação Recorrente');
    const [actionDuration, setActionDuration] = useState(60);
    const [actionRepetitions, setActionRepetitions] = useState(1);
    const [iconTarget, setIconTarget] = useState<'arena' | 'action' | null>(null);
    
    // Filter out arenas that are in campaigns
    const allCampaignArenaIds = campaigns.reduce((acc, campaign) => [...acc, ...campaign.arenaIds], [] as string[]);
    const ownedArenaIds = useMemo(() => {
        const ids = new Set<string>();
        assets.forEach(asset => asset.arenas.forEach(arena => ids.add(arena.id)));
        return ids;
    }, [assets]);
    const relationshipLinkTypeByArenaId = useMemo(() => {
        const linkTypes = new Map<string, RelationshipLinkType>();
        sharedLinkedArenas.forEach((linkedArena) => {
            if (linkedArena.arenaId && linkedArena.linkType) {
                linkTypes.set(linkedArena.arenaId, linkedArena.linkType);
            }
        });
        return linkTypes;
    }, [sharedLinkedArenas]);
    
    const allArenas = getArenas().filter(a => (showArchived || !a.isArchived));
    const rootArenas = allArenas
        .filter(a => !a.folderId && !allCampaignArenaIds.includes(a.id))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    const selectedArena = allArenas.find(a => a.id === selectedArenaId);
    const selectedFolder = arenaFolders.find(f => f.id === selectedFolderId);
    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

    // Priorities grouping
    const priorities = {
        alta: [
            ...rootArenas.filter(a => a.priority === 'alta'),
            ...campaigns.filter(c => c.priority === 'alta')
        ],
        media: [
            ...rootArenas.filter(a => a.priority === 'media' || !a.priority),
            ...campaigns.filter(c => c.priority === 'media' || !c.priority)
        ],
        baixa: [
            ...rootArenas.filter(a => a.priority === 'baixa'),
            ...campaigns.filter(c => c.priority === 'baixa')
        ],
    };

    // Assets grouping - For 'Assets' view mode, we want ALL arenas, even those in campaigns
    const assetGroups = assets.map(asset => ({
        ...asset,
        arenas: allArenas.filter(a => a.assetId === asset.id) // Use allArenas instead of rootArenas
    })).filter(group => group.arenas.length > 0);
    const receivedSharedArenas = useMemo(
        () => sharedLinkedArenas.filter(linkedArena => linkedArena.arenaId && !ownedArenaIds.has(linkedArena.arenaId)),
        [ownedArenaIds, sharedLinkedArenas]
    );
    const installedOriginCodexIds = useMemo(() => {
        const ids = new Set<string>();
        assets.forEach((asset) => {
            asset.arenas.forEach((arena) => {
                if (arena.originCodexId) {
                    ids.add(arena.originCodexId);
                }
            });
        });
        return ids;
    }, [assets]);
    const receivedMentorCampaigns = useMemo(
        () => userCodexes.flatMap((codex: any) => {
            if (!codex?.mentor_relationship_link_id) return [];
            if (!Array.isArray(codex.template?.levels) || codex.template.levels.length === 0) return [];
            if (installedOriginCodexIds.has(codex.id)) return [];

            const preview = buildCodexCampaignPreview(
                codex.id,
                {
                    ...codex.template,
                    title: codex.template?.title || codex.name || 'Campanha recebida',
                    description: codex.template?.description || codex.description || '',
                },
                `__mentor_campaign_preview_${codex.id}__`
            );

            return [{ codex, preview }];
        }),
        [installedOriginCodexIds, userCodexes]
    );

    useEffect(() => {
        let cancelled = false;

        const loadSharedLinkedArenas = async () => {
            if (!userProfile?.id) {
                setSharedLinkedArenas([]);
                return;
            }

            const maxAttempts = 6;

            for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
                try {
                    const linksResult = await supabase
                        .from('relationship_links')
                        .select('*')
                        .or(`mentor_id.eq.${userProfile.id},pupil_id.eq.${userProfile.id}`)
                        .is('ended_at', null)
                        .order('created_at', { ascending: false });

                    if (linksResult.error) throw linksResult.error;

                    const links = linksResult.data || [];
                    const linksById = new Map(links.map((link: any) => [String(link.id), link] as const));
                    const linkIds = links.map((link: any) => String(link.id)).filter(Boolean);

                    if (linkIds.length === 0) {
                        setSharedLinkedArenas([]);
                        return;
                    }

                    const linkedArenasResult = await supabase
                        .from('relationship_link_arenas')
                        .select('*')
                        .in('relationship_link_id', linkIds)
                        .order('created_at', { ascending: false });

                    if (linkedArenasResult.error) throw linkedArenasResult.error;

                    const linkedArenaRows = linkedArenasResult.data || [];
                    const arenaIds = [...new Set(linkedArenaRows.map((row: any) => String(row.arena_id || '')).filter(Boolean))];

                    if (arenaIds.length === 0) {
                        setSharedLinkedArenas([]);
                        return;
                    }

                    const [arenasResult, actionsResult] = await Promise.all([
                        supabase.from('arenas').select('*').in('id', arenaIds),
                        supabase.from('actions').select('*').in('arena_id', arenaIds),
                    ]);

                    if (arenasResult.error) throw arenasResult.error;
                    if (actionsResult.error) throw actionsResult.error;

                    const actionRows = actionsResult.data || [];
                    const actionIds = actionRows.map((row: any) => String(row.id || '')).filter(Boolean);
                    const tasksResult = actionIds.length > 0
                        ? await supabase.from('scheduled_tasks').select('*').in('action_id', actionIds)
                        : { data: [], error: null } as const;

                    if (tasksResult.error) throw tasksResult.error;

                    const actionsByArenaId = new Map<string, Action[]>();
                    actionRows.forEach((row: any) => {
                        const mappedAction: Action = {
                            id: String(row.id),
                            arenaId: String(row.arena_id),
                            name: String(row.name || 'Ação'),
                            description: String(row.description || ''),
                            icon: String(row.icon || '📝'),
                            duration: Number(row.duration || 0),
                            repetitions: Number(row.repetitions || 1),
                            actionType: row.action_type,
                            difficulty: typeof row.difficulty === 'number' ? row.difficulty : row.difficulty ? Number(row.difficulty) : undefined,
                            briefing: typeof row.briefing === 'string' ? row.briefing : undefined,
                            assets: Array.isArray(row.assets) ? row.assets : [],
                            preFlight: Array.isArray(row.pre_flight) ? row.pre_flight : [],
                            context: row.context && typeof row.context === 'object' ? row.context : {},
                            originCodexId: row.origin_codex_id ?? undefined,
                            scheduledDays: row.scheduled_days ?? row.context?.schedule?.days,
                            scheduledStartTime: row.scheduled_start_time ?? row.context?.schedule?.startTime,
                        };
                        const nextActions = actionsByArenaId.get(mappedAction.arenaId) || [];
                        nextActions.push(mappedAction);
                        actionsByArenaId.set(mappedAction.arenaId, nextActions);
                    });

                    const tasksByArenaId = new Map<string, ScheduledTask[]>();
                    (tasksResult.data || []).forEach((row: any) => {
                        const actionArenaId = actionRows.find((action: any) => String(action.id) === String(row.action_id))?.arena_id;
                        if (!actionArenaId) return;

                        const taskOwnerId = String(row.user_id || '');
                        if (taskOwnerId && taskOwnerId !== userProfile.id) return;

                        const mappedTask: ScheduledTask = {
                            id: String(row.id),
                            actionId: String(row.action_id),
                            date: String(row.date),
                            startTime: Number(row.start_time || 0),
                            completed: Boolean(row.completed),
                            completedAt: row.completed_at ?? null,
                            userId: row.user_id ?? undefined,
                        } as ScheduledTask;

                        const nextTasks = tasksByArenaId.get(String(actionArenaId)) || [];
                        nextTasks.push(mappedTask);
                        tasksByArenaId.set(String(actionArenaId), nextTasks);
                    });

                    const arenasById = new Map<string, Arena>();
                    (arenasResult.data || []).forEach((row: any) => {
                        const arenaId = String(row.id);
                        const arenaActions = actionsByArenaId.get(arenaId) || [];
                        arenasById.set(arenaId, {
                            id: arenaId,
                            assetId: String(row.asset_id || 'geral'),
                            name: String(row.name || 'Arena vinculada'),
                            description: String(row.description || ''),
                            icon: String(row.icon || '🏛️'),
                            actionIds: arenaActions.map((action) => action.id),
                            isArchived: Boolean(row.is_archived),
                            folderId: row.folder_id ?? undefined,
                            originCodexId: row.origin_codex_id ?? undefined,
                            codexLevel: row.codex_level ?? undefined,
                            order: typeof row.order === 'number' ? row.order : 0,
                            priority: row.priority ?? undefined,
                            priorityOrder: typeof row.priority_order === 'number' ? row.priority_order : 0,
                        });
                    });

                    const hub = {
                        linkedArenas: linkedArenaRows.map((row: any) => {
                            const link = linksById.get(String(row.relationship_link_id));
                            const arenaId = String(row.arena_id || '');
                            return {
                                id: String(row.id),
                                relationshipLinkId: String(row.relationship_link_id),
                                linkType: link?.link_type,
                                arenaId,
                                createdByUserId: row.created_by_user_id ?? null,
                                createdAt: String(row.created_at),
                                metadata: row.metadata ?? null,
                                arena: arenasById.get(arenaId) || null,
                                actions: actionsByArenaId.get(arenaId) || [],
                                tasks: tasksByArenaId.get(arenaId) || [],
                            } as LinkedRelationshipArena;
                        }),
                    };
                    if (cancelled) return;

                    const nextLinkedArenas = hub.linkedArenas || [];
                    setSharedLinkedArenas(nextLinkedArenas);

                    const hasOperationalMentorshipArena = nextLinkedArenas.some((linkedArena) =>
                        linkedArena.linkType === 'mentoria' && Boolean(linkedArena.arenaId)
                    );

                    if (hasOperationalMentorshipArena || attempt === maxAttempts - 1) {
                        return;
                    }
                } catch (error) {
                    if (cancelled) return;
                    if (attempt === maxAttempts - 1) {
                        console.error('Failed to load shared relationship arenas for ArenasView:', error);
                        return;
                    }
                }

                await new Promise((resolve) => window.setTimeout(resolve, 1000 * (attempt + 1)));
            }
        };

        void loadSharedLinkedArenas();

        return () => {
            cancelled = true;
        };
    }, [userProfile?.id]);

    const getAssetNameForSharedArena = (linkedArena: LinkedRelationshipArena) => {
        const assetId = linkedArena.arena?.assetId || String(linkedArena.metadata?.asset_id || '');
        if (!assetId) return 'Ativo vinculado';
        return assets.find(asset => asset.id === assetId)?.name || 'Ativo vinculado';
    };
    const getPreviewArenaForSharedArena = (linkedArena: LinkedRelationshipArena): Arena => (
        linkedArena.arena || {
            id: linkedArena.arenaId || `shared-preview-${linkedArena.id}`,
            assetId: String(linkedArena.metadata?.asset_id || 'geral'),
            name: String(linkedArena.metadata?.name || 'Arena compartilhada'),
            description: String(linkedArena.metadata?.description || ''),
            icon: String(linkedArena.metadata?.icon || '\u{1F3DB}\uFE0F'),
            actionIds: [],
            isArchived: false,
        }
    );
    const renderRelationshipMiniBadge = (linkType?: RelationshipLinkType | null) => {
        if (linkType === 'mentoria') {
            return (
                <span title="Mentoria" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/18 text-emerald-300">
                    <CrownIcon className="h-[9px] w-[9px]" />
                </span>
            );
        }
        if (linkType === 'parceria') {
            return (
                <span title="Parceria" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-sky-300/40 bg-sky-500/18 text-sky-300">
                    <UsersIcon className="h-[9px] w-[9px]" />
                </span>
            );
        }
        if (linkType === 'competicao') {
            return (
                <span title="Competição" className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-rose-300/40 bg-rose-500/18 text-rose-300">
                    <TrophyIcon className="h-[9px] w-[9px]" />
                </span>
            );
        }
        return null;
    };

    const handlePriorityDrop = async (e: React.DragEvent, priority: 'alta' | 'media' | 'baixa', targetId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Handle Grouping Logic even in Priority View if in Selection Mode
        if (isSelectionMode) {
            const idFromState = draggedId;
            const draggedIdFromData = e.dataTransfer.getData('id');
            const finalDraggedId = idFromState || draggedIdFromData;
            
            // Delegate to main handleDrop for grouping logic
            await handleDrop(e, targetId || '', 'arena'); 
            return;
        }

        setDragOverId(null);
        
        const finalDraggedId = draggedId || e.dataTransfer.getData('id');
        const draggedType = (e.dataTransfer.getData('type') || 'arena') as 'arena' | 'campaign';
        
        if (finalDraggedId) {
            await reorderEntityPriority(finalDraggedId, draggedType, priority, targetId);
        }
        
        setDraggedId(null);
    };

    const handleCycleViewMode = () => {
        const modes: ('free' | 'priorities' | 'assets')[] = ['free', 'priorities', 'assets'];
        const nextIndex = (modes.indexOf(arenasViewMode) + 1) % modes.length;
        setArenasViewMode(modes[nextIndex]);
    };

    const handleCreateCampaignClick = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedForCampaign([]);
    };


    const handleDragEnd = (e: React.DragEvent) => {
        setDragOverId(null);
        setDragOverSide(null);
        setDraggedId(null);
    };

    // Unified Interaction State (Mouse & Touch)
    const interactionRef = useRef<{ 
        id: string, 
        type: 'arena' | 'campaign', 
        startX: number, 
        startY: number, 
        element: HTMLElement,
        input: 'mouse' | 'touch',
        touchDragReady: boolean,
        touchDragBlocked: boolean
    } | null>(null);
    const touchHoldTimeoutRef = useRef<number | null>(null);
    
    const [dragPosition, setDragPosition] = useState<{x: number, y: number} | null>(null);

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, id: string, type: 'arena' | 'campaign') => {
        if (isSelectionMode && type === 'arena' && allCampaignArenaIds.includes(id)) return;
        
        const isTouch = 'touches' in e;
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;
        
        interactionRef.current = {
            id: id,
            type: type,
            startX: clientX,
            startY: clientY,
            element: e.currentTarget as HTMLElement,
            input: isTouch ? 'touch' : 'mouse',
            touchDragReady: false,
            touchDragBlocked: false,
        };

        if (touchHoldTimeoutRef.current) {
            window.clearTimeout(touchHoldTimeoutRef.current);
            touchHoldTimeoutRef.current = null;
        }

        if (isTouch) {
            touchHoldTimeoutRef.current = window.setTimeout(() => {
                const current = interactionRef.current;
                if (!current || current.id !== id || current.type !== type || current.touchDragBlocked) {
                    return;
                }

                interactionRef.current = {
                    ...current,
                    touchDragReady: true,
                };
                setDraggedId(id);
                setDragPosition({ x: current.startX, y: current.startY });
            }, 260);
        }
    };

    const handleInteractionMove = (e: MouseEvent | TouchEvent) => {
        if (!interactionRef.current) return;
        
        const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
        
        const deltaX = Math.abs(clientX - interactionRef.current.startX);
        const deltaY = Math.abs(clientY - interactionRef.current.startY);
        
        if (interactionRef.current.input === 'touch' && !interactionRef.current.touchDragReady) {
            if (deltaX > 8 || deltaY > 8) {
                if (touchHoldTimeoutRef.current) {
                    window.clearTimeout(touchHoldTimeoutRef.current);
                    touchHoldTimeoutRef.current = null;
                }
                interactionRef.current = {
                    ...interactionRef.current,
                    touchDragBlocked: true,
                };
            }
            return;
        }

        let currentDraggedId = draggedId;

        if (!currentDraggedId && interactionRef.current.input === 'mouse' && (deltaX > 10 || deltaY > 10)) {
            currentDraggedId = interactionRef.current.id;
            setDraggedId(currentDraggedId);
        }

        if (currentDraggedId) {
            if (e.cancelable && e.type !== 'mousemove') e.preventDefault(); // Prevent scroll on touch, allow mouse move
            
            setDragPosition({ x: clientX, y: clientY });

            // Find drop target manually via elementFromPoint
            const targetEl = document.elementFromPoint(clientX, clientY);
            const dropZone = targetEl?.closest('[data-drop-id]');
            
            if (dropZone) {
                const dropId = dropZone.getAttribute('data-drop-id');
                // Ensure we are not dropping on self
                if (dropId && dropId !== currentDraggedId) {
                    const rect = dropZone.getBoundingClientRect();
                    const isVerticalListTarget =
                        shouldEnableListReorder &&
                        (dropZone as HTMLElement).dataset.listRow === 'true';
                    const side = isVerticalListTarget
                        ? ((clientY - rect.top) > rect.height / 2 ? 'right' : 'left')
                        : ((clientX - rect.left) > rect.width / 2 ? 'right' : 'left');
                    setDragOverId(dropId);
                    setDragOverSide(side);
                }
            } else {
                setDragOverId(null);
            }
        }
    };

    const handleInteractionEnd = async (e: MouseEvent | TouchEvent) => {
        if (touchHoldTimeoutRef.current) {
            window.clearTimeout(touchHoldTimeoutRef.current);
            touchHoldTimeoutRef.current = null;
        }

        const activeDraggedId = draggedId || (interactionRef.current?.touchDragReady ? interactionRef.current.id : null);

        if (!activeDraggedId || !interactionRef.current) {
            interactionRef.current = null;
            setDragPosition(null);
            return;
        }

        const draggedType = interactionRef.current.type;

        // Logic similar to Drop
        if (dragOverId) {
             const isFolder = arenaFolders.some(f => f.id === dragOverId);
             const isCampaign = campaigns.some(c => c.id === dragOverId);
             const targetType = isFolder ? 'folder' : isCampaign ? 'campaign' : 'arena';
             
             // Check if target is a Priority section (only for Priority View)
             if (arenasViewMode === 'priorities') {
                 if (['alta', 'media', 'baixa'].includes(dragOverId)) {
                     // Dropped directly on the priority header/zone
                     await handlePriorityDrop({
                         preventDefault: () => {},
                         stopPropagation: () => {},
                         dataTransfer: { getData: (key: string) => key === 'type' ? draggedType : '' } // Mock with type
                     } as any, dragOverId as any, activeDraggedId);
                 } else {
                     // Dropped on an item (Arena or Campaign) within a priority list
                     // Find the priority of the target to know where we are dropping
                     const targetArena = allArenas.find(a => a.id === dragOverId);
                     const targetCampaign = campaigns.find(c => c.id === dragOverId);
                     
                     // Default to media if not found, though it should be found
                     const targetPriority = targetArena?.priority || targetCampaign?.priority || 'media';
                     
                     await handlePriorityDrop({
                         preventDefault: () => {},
                         stopPropagation: () => {},
                         dataTransfer: { getData: (key: string) => key === 'type' ? draggedType : '' } // Mock with type
                     } as any, targetPriority as any, dragOverId);
                 }
             } else {
                 // Standard drop (Arena swap/Campaign)
                 await handleDrop({
                     preventDefault: () => {},
                     stopPropagation: () => {},
                     dataTransfer: { getData: (key: string) => key === 'type' ? draggedType : '' } // Mock with type
                 } as any, dragOverId, targetType);
             }
        }

        setDraggedId(null);
        setDragOverId(null);
        setDragPosition(null);
        interactionRef.current = null;
    };

    useEffect(() => {
        const onMove = (e: MouseEvent | TouchEvent) => handleInteractionMove(e);
        const onEnd = (e: MouseEvent | TouchEvent) => handleInteractionEnd(e);

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
        window.addEventListener('touchcancel', onEnd);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
            window.removeEventListener('touchcancel', onEnd);
            if (touchHoldTimeoutRef.current) {
                window.clearTimeout(touchHoldTimeoutRef.current);
            }
        };
    }, [draggedId, arenasViewMode, isSelectionMode, dragOverId]); // Add necessary dependencies

    const handleDragStart = (e: React.DragEvent, id: string, type: 'arena' | 'campaign') => {
        console.log('DRAG START:', id, type, 'SelectionMode:', isSelectionMode);
        // Prevent dragging locked arenas in selection mode
        if (isSelectionMode && type === 'arena' && allCampaignArenaIds.includes(id)) {
            console.log('BLOCKED: Arena is in campaign and SelectionMode is on');
            e.preventDefault();
            return;
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('id', id);
        e.dataTransfer.setData('type', type);
        e.dataTransfer.setData('text/plain', id); // Required for some browsers
        setDraggedId(id);
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation(); // Essential to allow drop!
        e.dataTransfer.dropEffect = 'move';
        
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const side = x > rect.width / 2 ? 'right' : 'left';
        
        setDragOverId(id);
        setDragOverSide(side);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOverId(null);
        setDragOverSide(null);
    };

    const handleDrop = async (e: React.DragEvent, targetId: string, targetType: 'arena' | 'folder' | 'campaign') => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('DROP TRIGGERED on:', targetId, targetType, 'SelectionMode:', isSelectionMode);

        // Use the ID from state if available, fallback to dataTransfer
        const idFromState = draggedId;
        const draggedIdFromData = e.dataTransfer.getData('id');
        const finalDraggedId = idFromState || draggedIdFromData;
        const draggedType = (e.dataTransfer.getData('type') || 'arena') as 'arena' | 'campaign';
        const side = dragOverSide || 'left';
        
        console.log('DROP DETAILS:', { finalDraggedId, draggedType, side });

        // Reset states immediately for clean visual feedback
        setDragOverId(null);
        setDragOverSide(null);
        setDraggedId(null);

        if (!finalDraggedId) {
            console.log('DROP CANCELLED: No dragged ID');
            return;
        }
        if (finalDraggedId === targetId) {
            console.log('DROP CANCELLED: Dropped on self');
            return;
        }

        // If in Edit/Selection Mode, handle Grouping Logic
        if (isSelectionMode) {
            // ... (rest of selection mode logic)
            console.log('PROCESSING SELECTION MODE DROP');
            if (targetType === 'campaign') {
                if (draggedType !== 'arena') return;
                if (allCampaignArenaIds.includes(finalDraggedId)) {
                     console.log('BLOCKED: Already in campaign');
                     return; 
                }

                const campaign = campaigns.find(c => c.id === targetId);
                if (!campaign) return;

                console.log('ADDING TO CAMPAIGN:', campaign.id);
                // Add to campaign without confirmation (Edit Mode)
                updateCampaign(campaign.id, {
                    arenaIds: [...campaign.arenaIds, finalDraggedId],
                    arenaConfig: {
                        ...campaign.arenaConfig,
                        [finalDraggedId]: { isLocked: false, isHidden: false }
                    }
                });
            } else if (targetType === 'arena') {
                if (draggedType !== 'arena') return;
                
                // Create new Campaign from two arenas
                const targetArena = allArenas.find(a => a.id === targetId);
                const draggedArena = allArenas.find(a => a.id === finalDraggedId);
                
                if (!targetArena || !draggedArena) return;
                if (allCampaignArenaIds.includes(targetId) || allCampaignArenaIds.includes(finalDraggedId)) {
                    console.log('BLOCKED: Target or Source already in campaign');
                    return; 
                }

                console.log('CREATING NEW CAMPAIGN');
                // Create new campaign without confirmation (Edit Mode)
                await addCampaign({
                    title: "Nova Campanha",
                    description: "",
                    arenaIds: [targetId, finalDraggedId],
                    arenaConfig: {
                        [targetId]: { isLocked: false, isHidden: false },
                        [finalDraggedId]: { isLocked: false, isHidden: false }
                    },
                    type: 'parallel',
                    status: 'active',
                    order: 0,
                    priority: 'media',
                    priorityOrder: 0
                });
            }
            return;
        }
        
        console.log('PROCESSING STANDARD MODE DROP');

        // Standard Drag Logic (Not in Edit Mode)
        if (targetType === 'folder') {
            await moveArenaToFolder(finalDraggedId, targetId);
        } else if (arenasViewMode === 'free') {
             // In Free Mode, reorder any entity
             await reorderEntity(finalDraggedId, draggedType, targetId, targetType, side);
        } else if (targetType === 'arena') {
             const targetArena = allArenas.find(a => a.id === targetId);
             if (!targetArena) return;

             // Se já está em uma pasta, move o arrastado para a mesma pasta
             if (targetArena.folderId) {
                 await moveArenaToFolder(draggedId, targetArena.folderId);
                 return;
             }
        }
    };

    useEffect(() => {
        if (!isBuilderMode) return;
        if (builderAssetId) return;
        const fallback = assets.find(a => a.id !== 'geral')?.id || assets[0]?.id || '';
        if (fallback) setBuilderAssetId(fallback);
    }, [assets, builderAssetId, isBuilderMode]);

    const getAssetById = (id: string) => assets.find(a => a.id === id);
    const getActionsForArena = (arenaId: string) => actions.filter(a => a.arenaId === arenaId);
    const cycleScopedTasks = useMemo(() => {
        if (!activeCycle) return tasks;
        return tasks.filter(task => task.date >= activeCycle.startDate && task.date <= activeCycle.endDate);
    }, [activeCycle, tasks]);
    const tasksByActionId = useMemo(() => {
        const map = new Map<string, ScheduledTask[]>();
        cycleScopedTasks.forEach((task) => {
            const existing = map.get(task.actionId);
            if (existing) {
                existing.push(task);
                return;
            }
            map.set(task.actionId, [task]);
        });
        return map;
    }, [cycleScopedTasks]);
    const toggleArenaRow = (rowId: string) => {
        setExpandedArenaRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
    };
    const formatDurationShort = (duration: number) => `${Math.max(0, Math.round(duration || 0))}m`;
    const shouldEnableListReorder = arenaPresentationMode === 'list' && (arenasViewMode === 'free' || arenasViewMode === 'priorities');
    const getOrderedActionsForArena = (arena: Arena, sourceActions?: Action[]) => {
        const arenaActions = sourceActions ?? getActionsForArena(arena.id);
        const orderedIds = Array.isArray(arena.actionIds) ? arena.actionIds : [];
        if (orderedIds.length === 0) {
            return arenaActions;
        }

        const byId = new Map(arenaActions.map((action) => [action.id, action]));
        const ordered = orderedIds
            .map((actionId) => byId.get(actionId))
            .filter((action): action is Action => Boolean(action));
        const remaining = arenaActions.filter((action) => !orderedIds.includes(action.id));
        return [...ordered, ...remaining];
    };
    const getActionListMetrics = (action: Action, actionTasks?: ScheduledTask[]) => {
        const scopedTasks = actionTasks ?? tasksByActionId.get(action.id) ?? [];
        const total = scopedTasks.length > 0 ? scopedTasks.length : Math.max(1, action.repetitions || 1);
        const completed = scopedTasks.filter((task) => task.completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            durationLabel: formatDurationShort(action.duration),
            completed,
            total,
            progress,
        };
    };
    const getArenaListMetrics = (arena: Arena, arenaActions: Action[], arenaTasks?: ScheduledTask[]) => {
        const progress = calculateArenaProgress({
            arena,
            actions: arenaActions,
            tasks: arenaTasks ?? cycleScopedTasks,
            clanQuests: getClanQuestsForArena(arena, arenaActions),
            getClanQuestProgress,
            getSharedActionPoolProgress,
        });

        return {
            completed: progress.totalCompleted,
            total: progress.totalPlanned,
            percent: Math.round(progress.progressPercent),
        };
    };
    const getCampaignProgress = (campaign: Campaign) => {
        const arenasById = Object.fromEntries(getArenas().map(arena => [arena.id, arena]));
        const actionsByArena = Object.fromEntries(getArenas().map(arena => [arena.id, getActionsForArena(arena.id)]));

        return calculateCampaignProgress({
            campaign,
            arenasById,
            actionsByArena,
            tasks: cycleScopedTasks,
            getClanQuestsForArena,
            getClanQuestProgress,
            getSharedActionPoolProgress,
        });
    };
    const renderListValue = (value: string, muted = false) => (
        <span className={`min-w-[2.75rem] text-right text-[10px] font-bold uppercase tracking-[0.08em] tabular-nums ${muted ? 'text-white/42' : 'text-white/78'}`}>
            {value}
        </span>
    );
    const renderActionListRow = (action: Action, actionTasks?: ScheduledTask[]) => {
        const metrics = getActionListMetrics(action, actionTasks);

        return (
            <div key={action.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2 rounded-xl border border-white/6 bg-black/18 px-2 py-1.5">
                <div className="min-w-0 text-[11px] font-semibold text-white/88 truncate">
                    {action.name}
                </div>
                {renderListValue(metrics.durationLabel, true)}
                {renderListValue(`${metrics.completed}/${metrics.total}`)}
                {renderListValue(`${metrics.progress}%`)}
            </div>
        );
    };
    const renderArenaListRow = (
        arena: Arena,
        options: {
            rowId?: string;
            assetName?: string;
            actionsOverride?: Action[];
            tasksOverride?: ScheduledTask[];
            onOpen?: () => void;
            sortableType?: 'arena' | 'campaign';
            registerNode?: (node: HTMLDivElement | null) => void;
            relationshipBadgeType?: RelationshipLinkType | null;
        } = {}
    ) => {
        const rowId = options.rowId ?? arena.id;
        const rowActions = getOrderedActionsForArena(arena, options.actionsOverride);
        const metrics = getArenaListMetrics(arena, rowActions, options.tasksOverride);
        const assetLabel = options.assetName ? ` (${options.assetName})` : '';
        const isExpanded = !!expandedArenaRows[rowId];
        const isDragOver = dragOverId === rowId;
        const isDragged = draggedId === rowId;
        const isSortable = shouldEnableListReorder && !!options.sortableType;
        const arenaAccentColor = ASSET_ACCENT_COLORS[arena.assetId] || '#F0C843';
        const relationshipBadgeType = options.relationshipBadgeType ?? relationshipLinkTypeByArenaId.get(arena.id) ?? null;

        return (
            <div
                key={rowId}
                ref={options.registerNode}
                data-drop-id={isSortable ? rowId : undefined}
                data-list-row={isSortable ? 'true' : undefined}
                onMouseDown={isSortable ? (e) => handleInteractionStart(e, rowId, options.sortableType!) : undefined}
                onTouchStart={isSortable ? (e) => handleInteractionStart(e, rowId, options.sortableType!) : undefined}
                className={`relative rounded-2xl border border-white/8 bg-black/22 overflow-hidden transition-all duration-200 ${isSortable ? 'select-none cursor-grab active:cursor-grabbing' : ''} ${isDragOver ? 'ring-2 ring-[var(--skin-accent-color)] z-10' : ''} ${isDragged ? 'opacity-30 brightness-75' : ''}`}
                style={isSortable ? { touchAction: 'pan-y' } : undefined}
            >
                {isSortable && isDragOver && (
                    <div
                        className={`absolute left-2 right-2 h-1 rounded-full bg-[var(--skin-accent-color)] shadow-[0_0_8px_var(--skin-accent-color)] pointer-events-none z-20 ${dragOverSide === 'left' ? 'top-0.5' : 'bottom-0.5'}`}
                    />
                )}
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-2.5 py-2">
                    <button
                        type="button"
                        onClick={() => (options.onOpen ? options.onOpen() : setSelectedArenaId(arena.id))}
                        className="min-w-0 flex items-center gap-2 text-left"
                    >
                        <span
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/35 text-[14px]"
                            style={{ background: `linear-gradient(160deg, ${rgbaString(arenaAccentColor, 0.52)} 0%, ${rgbaString(arenaAccentColor, 0.24)} 100%)` }}
                        >
                            <EmojiGlyph symbol={arena.icon || '🏛️'} size="action" className="text-white" />
                        </span>
                        {relationshipBadgeType && renderRelationshipMiniBadge(relationshipBadgeType)}
                        <span className="min-w-0 truncate text-[12px] font-bold text-white/92">
                            {arena.name}
                            <span className="text-white/45 font-medium">{assetLabel}</span>
                        </span>
                    </button>
                    <div className="flex items-center gap-2">
                        {renderListValue(`${metrics.completed}/${metrics.total}`)}
                        {renderListValue(`${metrics.percent}%`)}
                    </div>
                    <button
                        type="button"
                        onClick={() => toggleArenaRow(rowId)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10"
                        title={isExpanded ? 'Recolher ações' : 'Expandir ações'}
                    >
                        {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                    </button>
                </div>
                {isExpanded && (
                    <div className="space-y-1 border-t border-white/6 bg-black/14 px-2 py-2">
                        {rowActions.length > 0 ? rowActions.map((action) => {
                            const actionTasks = options.tasksOverride
                                ? options.tasksOverride.filter((task) => task.actionId === action.id)
                                : (tasksByActionId.get(action.id) ?? []);
                            return renderActionListRow(action, actionTasks);
                        }) : (
                            <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/38">
                                Sem ações
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };
    const renderCampaignListRow = (
        campaign: Campaign,
        progress: number,
        options: {
            onOpen?: () => void;
            actionCount?: number;
            installAction?: (() => Promise<void>) | null;
            sortable?: boolean;
            registerNode?: (node: HTMLDivElement | null) => void;
            mentorBadge?: boolean;
        } = {}
    ) => {
        const arenaCount = campaign.arenaIds.length;
        const actionCount = options.actionCount ?? campaign.arenaIds.reduce((count, arenaId) => count + getActionsForArena(arenaId).length, 0);
        const isDragOver = dragOverId === campaign.id;
        const isDragged = draggedId === campaign.id;
        const isSortable = shouldEnableListReorder && !!options.sortable;

        return (
            <div
                key={campaign.id}
                ref={options.registerNode}
                data-drop-id={isSortable ? campaign.id : undefined}
                data-list-row={isSortable ? 'true' : undefined}
                onMouseDown={isSortable ? (e) => handleInteractionStart(e, campaign.id, 'campaign') : undefined}
                onTouchStart={isSortable ? (e) => handleInteractionStart(e, campaign.id, 'campaign') : undefined}
                className={`relative rounded-2xl border border-white/8 bg-black/22 overflow-hidden transition-all duration-200 ${isSortable ? 'select-none cursor-grab active:cursor-grabbing' : ''} ${isDragOver ? 'ring-2 ring-[var(--skin-accent-color)] z-10' : ''} ${isDragged ? 'opacity-30 brightness-75' : ''}`}
                style={isSortable ? { touchAction: 'pan-y' } : undefined}
            >
                {isSortable && isDragOver && (
                    <div
                        className={`absolute left-2 right-2 h-1 rounded-full bg-[var(--skin-accent-color)] shadow-[0_0_8px_var(--skin-accent-color)] pointer-events-none z-20 ${dragOverSide === 'left' ? 'top-0.5' : 'bottom-0.5'}`}
                    />
                )}
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-2.5 py-2">
                    <button
                        type="button"
                        onClick={() => (options.onOpen ? options.onOpen() : setSelectedCampaignId(campaign.id))}
                        className="min-w-0 flex items-center gap-2 text-left"
                    >
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/35 bg-black/28 text-[13px]">
                            📁
                        </span>
                        {options.mentorBadge && renderRelationshipMiniBadge('mentoria')}
                        <span className="min-w-0 truncate text-[12px] font-bold text-white/92">
                            {campaign.title}
                            <span className="text-white/45 font-medium"> (Campanha)</span>
                        </span>
                    </button>
                    <div className="flex items-center gap-2">
                        {renderListValue(`${arenaCount} ar`)}
                        {renderListValue(`${actionCount} ac`, true)}
                        {renderListValue(`${Math.round(progress)}%`)}
                    </div>
                    {options.installAction ? (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                void options.installAction?.();
                            }}
                            className="rounded-full border border-white/12 bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/84 transition-all hover:bg-white/12"
                        >
                            Instalar
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => (options.onOpen ? options.onOpen() : setSelectedCampaignId(campaign.id))}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10"
                            title="Abrir campanha"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    };
    const renderFolderListRow = (folder: ArenaFolder, arenaCount: number) => {
        return (
            <div
                key={folder.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedFolderId(folder.id)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedFolderId(folder.id);
                    }
                }}
                className="rounded-2xl border border-white/8 bg-black/22 overflow-hidden cursor-pointer transition-colors hover:border-white/14"
            >
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 px-2.5 py-2">
                    <div className="min-w-0 flex items-center gap-2 text-left">
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/35 bg-black/28 text-[15px]">
                            {folder.icon}
                        </span>
                        <span className="min-w-0 truncate text-[12px] font-bold text-white/92">
                            {folder.name}
                            <span className="text-white/45 font-medium"> (Pasta)</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {renderListValue(`${arenaCount} ar`)}
                    </div>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setSelectedFolderId(folder.id);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10"
                        title="Abrir pasta"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };
    const assetOptions = assets;

    const handleAddPendingAction = () => {
        if (!actionName.trim()) return;
        const repetitions = actionType === 'Ação Recorrente' ? Math.max(1, actionRepetitions) : 1;
        const duration = Math.max(5, Math.round(actionDuration));
        const newAction: PendingAction = {
            id: crypto.randomUUID(),
            name: actionName.trim(),
            description: actionDescription.trim() || undefined,
            icon: actionIcon || '📝',
            duration,
            repetitions,
            actionType,
            difficulty: 3,
        };
        setPendingActions(prev => [newAction, ...prev]);
        setActionName('');
        setActionDescription('');
        setActionIcon('📝');
        setActionType('Ação Recorrente');
        setActionDuration(60);
        setActionRepetitions(1);
    };

    const handleRemovePendingAction = (id: string) => {
        setPendingActions(prev => prev.filter(action => action.id !== id));
    };

    const handleSaveArenaDraft = async () => {
        if (!arenaName.trim() || !builderAssetId) return;
        
        try {
            const newArena = await addArena(builderAssetId, {
                name: arenaName.trim(),
                description: arenaDescription.trim(),
                icon: arenaIcon || '🏟️',
            });
            
            if (!arenaActive) updateArena(newArena.id, { isArchived: true });
            
            // Create all actions in parallel
            const actionPromises = [...pendingActions].reverse().map(action => 
                addAction({
                    arenaId: newArena.id,
                    name: action.name,
                    description: action.description,
                    icon: action.icon,
                    duration: action.duration,
                    repetitions: action.repetitions,
                    actionType: action.actionType,
                    difficulty: action.difficulty,
                })
            );
            
            await Promise.all(actionPromises);
            
            setArenaName('');
            setArenaDescription('');
            setArenaIcon('🏟️');
            setArenaActive(true);
            setPendingActions([]);
        } catch (error) {
            console.error("Error creating arena draft:", error);
            // Optionally show user feedback here
        }
    };

    const handleOpenCreateArena = () => {
        setIsCreatingArena(true);
    };

    const handleArenaCreated = (newArena: Arena) => {
        setIsCreatingArena(false);
        setSelectedArenaId(newArena.id);
    };

    // Helper to render Campaign Card
    const renderCampaignCard = (campaign: Campaign, isParallel: boolean, progress: number) => {
        const campaignArenas = getArenas().filter(a => campaign.arenaIds.includes(a.id));
        const isDragOver = dragOverId === campaign.id;
        const isDragged = draggedId === campaign.id;
        const isAttentionTarget = arenaAttention?.campaignId === campaign.id;
        const campaignAttentionClass = isAttentionTarget
            ? arenaAttention?.phase === 'celebrate'
                ? 'arena-card-highlight arena-card-highlight--celebrate'
                : 'arena-card-highlight arena-card-highlight--populate'
            : '';
        const progressFillClass = isAttentionTarget && arenaAttention?.phase === 'celebrate' && progress >= 100
            ? 'arena-plate-progress-fill arena-plate-progress-fill--celebrate'
            : 'arena-plate-progress-fill';

        return (
            <div
                key={campaign.id}
                ref={(node) => registerCampaignCardRef(campaign.id, node)}
                data-drop-id={campaign.id}
                onMouseDown={(e) => handleInteractionStart(e, campaign.id, 'campaign')}
                onTouchStart={(e) => handleInteractionStart(e, campaign.id, 'campaign')}
                onClick={() => setSelectedCampaignId(campaign.id)}
                className={`relative col-span-2 aspect-[4/3] bg-[#1a1a1a] rounded-2xl border flex flex-col cursor-pointer transition-all group overflow-hidden ${isDragOver ? 'z-10 ring-2 ring-[var(--skin-accent-color)]' : ''} ${isDragged ? 'opacity-30' : ''} ${campaignAttentionClass}`}
                style={{ borderColor: userProfile.skinColor || 'var(--skin-accent-color)', touchAction: 'pan-y' }}
            >
                {/* Folder Stack Effect */}
                <div className="absolute top-0 right-0 w-full h-full bg-white/5 rounded-2xl -z-10 transform translate-x-1 -translate-y-1 border border-white/5" />
                
                {/* Header */}
                <div className="p-2 border-b border-white/5 bg-black/20 flex items-center justify-between shrink-0 h-8">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-sm">📁</span>
                        <span className="text-[9px] font-bold text-gray-300 truncate leading-none pt-0.5">{campaign.title}</span>
                    </div>
                    <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden shrink-0 ml-1">
                            <div 
                                className={progressFillClass}
                                style={{ width: `${progress}%`, background: 'var(--skin-accent-color)' }}
                            />
                        </div>
                </div>

                {/* Content / Thumbnails */}
                <div className="flex-1 px-2.5 pt-1 pb-2 overflow-hidden">
                    <div className="flex h-full min-h-[7.25rem] items-start justify-center rounded-xl border border-white/6 bg-[linear-gradient(180deg,rgba(139,92,246,0.26),rgba(36,25,74,0.2)_55%,rgba(15,15,15,0.18))] pt-0.5">
                        <CampaignArenaStack arenas={campaignArenas} size="md" />
                    </div>
                </div>
            </div>
        );
    };

    // Helper to render Drag Preview
    const renderDragPreview = () => {
        if (!draggedId || !dragPosition) return null;
        
        const draggedArena = allArenas.find(a => a.id === draggedId);
        const draggedCampaign = campaigns.find(c => c.id === draggedId);
        const name = draggedArena?.name || draggedCampaign?.title || 'Moving...';
        const type = draggedArena ? 'Arena' : 'Campaign';
        
        return createPortal(
            <div 
                style={{
                    position: 'fixed',
                    left: dragPosition.x,
                    top: dragPosition.y,
                    transform: 'translate(-50%, -50%) rotate(5deg) scale(1.05)',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    width: '220px',
                }}
                className="pointer-events-none"
            >
                 <div className="bg-[#1a1a1a] border-2 border-[var(--skin-accent-color)] rounded-xl p-0 shadow-2xl flex flex-col gap-0 opacity-100 overflow-hidden w-full h-full">
                    {/* Render a miniature version of the card or just a clean label */}
                    <div className="bg-black/50 p-2 border-b border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--skin-accent-color)]"></div>
                        <span className="text-[10px] uppercase font-black tracking-widest text-[var(--skin-accent-color)]">{type}</span>
                    </div>
                    <div className="p-3 bg-[#1a1a1a]">
                        <h3 className="font-bold text-white truncate text-sm leading-tight">
                            {name}
                        </h3>
                    </div>
                 </div>
            </div>,
            document.body
        );
    };

    if (isBuilderMode) {
        return (
            <>
                {/* Drag Preview in Builder Mode too if needed, though mostly unused there */}
                <div className="arenas-view-root arenas-view-root--builder h-full overflow-y-auto overflow-x-hidden p-4 space-y-4 min-h-0 custom-scrollbar">
                    <div className="bg-black/30 border border-[var(--skin-accent-color)]/30 rounded-2xl p-3 space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider accent-text">Modo Arquiteto</div>
                        <div className="text-[11px] text-gray-400">Sandbox isolado. Nada do jogo atual é alterado.</div>
                    </div>

                    <div className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Arena</div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">Ativo</label>
                            <select value={builderAssetId} onChange={e => setBuilderAssetId(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]">
                                {assetOptions.map(asset => (
                                    <option key={asset.id} value={asset.id}>{asset.id === 'geral' ? 'OUTROS / SIDEQUEST' : asset.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">Nome da Arena</label>
                            <input value={arenaName} onChange={e => setArenaName(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">Descrição</label>
                            <textarea value={arenaDescription} onChange={e => setArenaDescription(e.target.value)} rows={2} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-gray-400">Ícone</label>
                                <button onClick={() => setIconTarget('arena')} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl flex items-center justify-center text-2xl">
                                    {arenaIcon}
                                </button>
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                    <input type="checkbox" checked={arenaActive} onChange={e => setArenaActive(e.target.checked)} className="accent-[var(--skin-accent-color)]" />
                                    Arena ativa
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Ações</div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">Nome da Ação</label>
                            <input value={actionName} onChange={e => setActionName(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">Descrição</label>
                            <textarea value={actionDescription} onChange={e => setActionDescription(e.target.value)} rows={2} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-gray-400">Ícone</label>
                                <button onClick={() => setIconTarget('action')} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl flex items-center justify-center text-2xl">
                                    {actionIcon}
                                </button>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400">Tipo</label>
                                <select value={actionType} onChange={e => setActionType(e.target.value as ActionType)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]">
                                    <option value="Ação Recorrente">Ação Recorrente</option>
                                    <option value="Compromisso">Compromisso</option>
                                    <option value="Marco">Marco</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400">Duração (min)</label>
                                <input type="number" min={5} value={actionDuration} onChange={e => setActionDuration(Number(e.target.value))} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400">Repetições</label>
                                <input type="number" min={1} value={actionRepetitions} disabled={actionType !== 'Ação Recorrente'} onChange={e => setActionRepetitions(Number(e.target.value))} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] disabled:opacity-50" />
                            </div>
                        </div>
                        <button onClick={handleAddPendingAction} className="w-full py-2 rounded-xl luxe-skin-button">Adicionar ação</button>
                        {pendingActions.length === 0 ? (
                            <div className="text-center text-xs text-gray-500">Nenhuma ação adicionada ainda.</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {pendingActions.map(action => (
                                    <div key={action.id} className="bg-black/20 border border-white/10 rounded-xl p-2 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center"><EmojiGlyph symbol={action.icon || '??'} size="picker" className="text-white" /></div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-white truncate">{action.name}</div>
                                            <div className="text-[10px] text-gray-400 truncate">
                                                {action.actionType} • {action.duration}m{action.actionType === 'Ação Recorrente' ? ` • x${action.repetitions}` : ''}
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemovePendingAction(action.id)} className="p-1 text-gray-400 hover:text-gray-200">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={handleSaveArenaDraft} disabled={!arenaName.trim() || !builderAssetId} className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-50">Salvar arena</button>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Arenas da campanha</div>
                            <button onClick={() => setShowArchived(s => !s)} className={`p-2 rounded-full transition-colors ${showArchived ? 'bg-white/20 text-white' : 'text-gray-500'}`} title={showArchived ? 'Ocultar arquivadas' : 'Mostrar arquivadas'}>
                                <ArchiveBoxIcon className="w-4 h-4" />
                            </button>
                        </div>
                        {allArenas.length === 0 ? (
                            <div className="text-center text-xs italic text-gray-500/80">Sem arenas ainda.</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {allArenas.map(arena => {
                                    const arenaActions = getActionsForArena(arena.id);
                                    const isDragOver = dragOverId === arena.id;
                                    
                                    return (
                                        <div 
                                            key={arena.id}
                                            draggable={!arena.isArchived}
                                            onDragStart={(e) => handleDragStart(e, arena.id, 'arena')}
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) => handleDragOver(e, arena.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, arena.id, 'arena')}
                                            className={`transition-all duration-200 ${isDragOver ? 'z-10 ring-2 ring-[var(--skin-accent-color)] rounded-xl' : ''}`}
                                        >
                                            <ArenaCard
                                                arena={arena}
                                                actions={arenaActions}
                                                onClick={() => setSelectedArenaId(arena.id)}
                                                variant="dossier"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                {selectedFolderId && (
                <FolderDetailModal
                    folder={arenaFolders.find(f => f.id === selectedFolderId)!}
                    onClose={() => setSelectedFolderId(null)}
                />
            )}
            {selectedArena && (
                    <ArenaDetailModal
                        arena={selectedArena}
                        onClose={() => setSelectedArenaId(null)}
                    />
                )}
                {iconTarget && (
                    <IconPickerModal
                        onSelect={icon => {
                            if (iconTarget === 'arena') setArenaIcon(icon);
                            if (iconTarget === 'action') setActionIcon(icon);
                            setIconTarget(null);
                        }}
                        onClose={() => setIconTarget(null)}
                    />
                )}
            </>
        );
    }

    function renderArenaBoardCard(arena: Arena, options: { assetName?: string; showInsertionIndicator?: boolean } = {}) {
        const alreadyInCampaign = allCampaignArenaIds.includes(arena.id);
        const isBlocked = isSelectionMode && alreadyInCampaign;
        const isDragOver = dragOverId === arena.id;
        const isDragged = draggedId === arena.id;
        const arenaHighlightPhase = arenaAttention?.arenaIds.includes(arena.id) ? arenaAttention.phase : null;

        return (
            <div
                key={arena.id}
                ref={(node) => registerArenaCardRef(arena.id, node)}
                data-drop-id={arena.id}
                onMouseDown={(e) => handleInteractionStart(e, arena.id, 'arena')}
                onTouchStart={(e) => handleInteractionStart(e, arena.id, 'arena')}
                className={`relative transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${isDragOver ? 'z-50 ring-2 ring-[var(--skin-accent-color)] rounded-2xl' : 'z-10'} ${isDragged ? 'opacity-30 brightness-50' : ''} ${isBlocked ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                style={{ touchAction: 'pan-y' }}
                onClick={() => {
                    if (!isSelectionMode && !isBlocked) {
                        setSelectedArenaId(arena.id);
                    }
                }}
            >
                {options.showInsertionIndicator && isDragOver && (
                    <div
                        className={`absolute top-0 bottom-0 w-1 bg-[var(--skin-accent-color)] shadow-[0_0_8px_var(--skin-accent-color)] z-30 pointer-events-none rounded-full ${dragOverSide === 'left' ? '-left-1.5' : '-right-1.5'}`}
                    />
                )}
                <div className={`relative transition-transform duration-200 ${options.showInsertionIndicator && isDragOver ? (dragOverSide === 'left' ? 'translate-x-1' : '-translate-x-1') : ''}`}>
                    <ArenaCard
                        arena={arena}
                        assetName={options.assetName}
                        actions={getActionsForArena(arena.id)}
                        relationshipBadgeType={relationshipLinkTypeByArenaId.get(arena.id) ?? null}
                        onClick={() => {}}
                        variant="overview"
                        highlightPhase={arenaHighlightPhase}
                    />
                    {isBlocked && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center border-gray-400 bg-black/50">
                            <span className="text-gray-500 font-bold text-[10px]">⛔</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            {renderDragPreview()}
            <div className="arenas-view-root h-full overflow-y-auto overflow-x-hidden px-4 pb-4 pt-4 relative min-h-0 custom-scrollbar">
                {receivedMentorCampaigns.length > 0 && (
                    <div className="mb-6 space-y-2">
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                Campanhas do mentor
                            </span>
                            <div className="flex-1 h-[1px] bg-white/5" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--skin-accent-color)]">
                                {receivedMentorCampaigns.length}
                            </span>
                        </div>
                        {arenaPresentationMode === 'list' ? (
                            <div className="space-y-2">
                                {receivedMentorCampaigns.map(({ codex, preview }) => (
                                    renderCampaignListRow(
                                        preview.campaign,
                                        calculateCampaignProgress({
                                            campaign: preview.campaign,
                                            arenasById: Object.fromEntries(preview.arenas.map((arena) => [arena.id, arena])),
                                            actionsByArena: Object.fromEntries(
                                                preview.arenas.map((arena) => [
                                                    arena.id,
                                                    preview.actions.filter((action) => action.arenaId === arena.id),
                                                ])
                                            ),
                                            tasks: [],
                                            getClanQuestsForArena,
                                            getClanQuestProgress,
                                            getSharedActionPoolProgress,
                                        }),
                                        {
                                            onOpen: () => setSelectedReceivedCampaignPreview(preview),
                                            actionCount: preview.actions.length,
                                            mentorBadge: true,
                                            installAction: async () => {
                                                await installCodex(codex.id);
                                            },
                                            registerNode: (node) => registerCampaignCardRef(preview.campaign.id, node),
                                        }
                                    )
                                ))}
                            </div>
                        ) : (
                        <div className="overflow-x-auto hide-scrollbar pb-1">
                            <div className="grid min-w-max grid-flow-col grid-rows-1 auto-cols-[7.45rem] gap-3 px-2 pt-1">
                            {receivedMentorCampaigns.map(({ codex, preview }) => (
                                <div
                                    key={codex.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedReceivedCampaignPreview(preview)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setSelectedReceivedCampaignPreview(preview);
                                        }
                                    }}
                                    className="relative col-span-2 aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] text-left transition-all hover:border-[var(--skin-accent-color)]/35 cursor-pointer"
                                >
                                        <div className="p-2 border-b border-white/5 bg-black/20 flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--skin-accent-color)]">
                                                {renderRelationshipMiniBadge('mentoria')}
                                                <span>Campanha</span>
                                            </div>
                                            <div className="truncate text-[11px] font-black text-white">{preview.campaign.title}</div>
                                            </div>
                                        <div className="rounded-full border border-white/10 bg-white/8 px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/60">
                                            {preview.arenas.length} arenas
                                        </div>
                                    </div>
                                    <div className="p-2.5 space-y-3">
                                        <div className="flex min-h-[7.25rem] items-start justify-center overflow-hidden rounded-xl border border-white/6 bg-[linear-gradient(180deg,rgba(139,92,246,0.26),rgba(36,25,74,0.2)_55%,rgba(15,15,15,0.18))] pt-0.5">
                                            <CampaignArenaStack arenas={preview.arenas} size="md" />
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">
                                                {preview.actions.length} ações
                                            </span>
                                            <button
                                                type="button"
                                                onClick={async (event) => {
                                                    event.stopPropagation();
                                                    await installCodex(codex.id);
                                                }}
                                                className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/84 transition-all hover:bg-white/12"
                                            >
                                                Instalar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            </div>
                        </div>
                        )}
                    </div>
                )}
                {receivedSharedArenas.length > 0 && (
                    <div className="mb-6 space-y-2">
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                Arenas compartilhadas
                            </span>
                            <div className="flex-1 h-[1px] bg-white/5" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--skin-accent-color)]">
                                {receivedSharedArenas.length}
                            </span>
                        </div>
                        {arenaPresentationMode === 'list' ? (
                            <div className="space-y-2">
                                {receivedSharedArenas.map((linkedArena) => (
                                    renderArenaListRow(getPreviewArenaForSharedArena(linkedArena), {
                                        rowId: linkedArena.id,
                                        assetName: getAssetNameForSharedArena(linkedArena),
                                        actionsOverride: linkedArena.actions || [],
                                        tasksOverride: linkedArena.tasks || [],
                                        onOpen: () => {
                                            setSelectedSharedArenaDetail({
                                                arena: getPreviewArenaForSharedArena(linkedArena),
                                                actions: linkedArena.actions || [],
                                                tasks: linkedArena.tasks || [],
                                            });
                                        },
                                    })
                                ))}
                            </div>
                        ) : (
                        <div className="overflow-x-auto hide-scrollbar pb-1">
                            <div className="grid min-w-max grid-flow-col grid-rows-1 auto-cols-[7.45rem] gap-3 px-2 pt-1">
                            {receivedSharedArenas.map((linkedArena) => (
                                <div key={linkedArena.id}>
                                    <ArenaCard
                                        arena={getPreviewArenaForSharedArena(linkedArena)}
                                        assetName={getAssetNameForSharedArena(linkedArena)}
                                        actions={linkedArena.actions || []}
                                        tasks={linkedArena.tasks || []}
                                        relationshipBadgeType={linkedArena.linkType ?? null}
                                        onClick={() => {
                                            setSelectedSharedArenaDetail({
                                                arena: getPreviewArenaForSharedArena(linkedArena),
                                                actions: linkedArena.actions || [],
                                                tasks: linkedArena.tasks || [],
                                            });
                                        }}
                                        variant="overview"
                                    />
                                </div>
                            ))}
                            </div>
                        </div>
                        )}
                    </div>
                )}
                <div className="mb-4 flex items-center gap-1.5 z-[60]" id="campaigns-section">
                    <div className="flex items-center bg-black/40 rounded-full px-1 border border-white/5">
                    <button
                        id="campaigns-button"
                        onClick={() => setCampaignHubOpen(true)}
                        className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--ui-text-accent)] transition-colors hover:bg-white/8"
                        title="Abrir campanhas"
                    >
                        <FolderStarIcon className="h-3.5 w-3.5" />
                        <span className="absolute -right-1 -top-1 rounded-full border border-[var(--skin-accent-color)]/18 bg-black/85 px-1 py-0.5 text-[7px] font-black leading-none text-white">
                            {campaigns.length}
                        </span>
                    </button>
                    <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                    <button
                        onClick={handleCreateCampaignClick}
                        title={isSelectionMode ? 'Organização ativa' : 'Gerenciar campanhas'}
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                            isSelectionMode
                                ? 'bg-[var(--skin-accent-color)]/18 text-[var(--ui-text-accent)] animate-pulse'
                                : 'text-gray-400 hover:bg-white/8 hover:text-white'
                        }`}
                    >
                        <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    </div>
                    <div className="ml-auto flex min-w-0 shrink-0 items-center bg-black/40 rounded-full px-1 border border-white/5">
                        <button
                            onClick={handleCycleViewMode}
                            className={`px-1.5 py-1 rounded-full transition-colors flex items-center gap-1 ${arenasViewMode !== 'free' ? 'text-[var(--skin-accent-color)]' : 'text-gray-500 hover:text-gray-300'}`}
                            title={`Modo: ${arenasViewMode === 'free' ? 'Livre' : arenasViewMode === 'priorities' ? 'Prioridades' : 'Por Ativo'}`}
                        >
                            <LayersIcon className="w-3.5 h-3.5" />
                            <span className="text-[8px] font-black uppercase tracking-[0.08em] w-10 text-center truncate">
                                {arenasViewMode === 'free' ? 'Livre' : arenasViewMode === 'priorities' ? 'Prios' : 'Ativo'}
                            </span>
                        </button>
                        <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                        <button
                            onClick={() => setArenaPresentationMode((current) => current === 'cards' ? 'list' : 'cards')}
                            className={`p-1.5 rounded-full transition-colors ${arenaPresentationMode === 'list' ? 'text-white' : 'text-gray-500'}`}
                            title={arenaPresentationMode === 'list' ? 'Voltar para miniaturas' : 'Modo lista'}
                        >
                            <ListRowsIcon className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                        <button onClick={() => setShowArchived(s => !s)} className={`p-1.5 rounded-full transition-colors ${showArchived ? 'text-white' : 'text-gray-500'}`} title={showArchived ? 'Ocultar arquivadas' : 'Mostrar arquivadas'}>
                            <ArchiveBoxIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {isSelectionMode && (
                    <div className="mb-4 p-3 bg-[var(--skin-accent-color)]/10 border border-[var(--skin-accent-color)]/20 rounded-xl">
                        {/* Prompt removed per user request */}
                    </div>
                )}

                <div id="arenas-container" className={arenaPresentationMode === 'list' ? 'space-y-4' : 'space-y-8'}>
                    {arenasViewMode === 'free' && (
                        arenaPresentationMode === 'list' ? (
                            <div className="space-y-1">
                                {arenaFolders.map(folder => {
                                    const arenasInFolder = getArenas().filter(a => a.folderId === folder.id && !allCampaignArenaIds.includes(a.id));
                                    return renderFolderListRow(folder, arenasInFolder.length);
                                })}

                                {[
                                    ...campaigns.map(campaign => ({ itemType: 'campaign' as const, value: campaign, sortOrder: campaign.order || 0 })),
                                    ...rootArenas.map(arena => ({ itemType: 'arena' as const, value: arena, sortOrder: arena.order || 0 })),
                                ]
                                    .sort((a, b) => a.sortOrder - b.sortOrder)
                                    .map(item => {
                                        if (item.itemType === 'campaign') {
                                            const campaign = item.value as Campaign;
                                            return renderCampaignListRow(campaign, getCampaignProgress(campaign), {
                                                sortable: true,
                                                registerNode: (node) => registerCampaignCardRef(campaign.id, node),
                                            });
                                        }

                                        const arena = item.value as Arena;
                                        return renderArenaListRow(arena, {
                                            assetName: getAssetById(arena.assetId)?.name || '',
                                            sortableType: 'arena',
                                            registerNode: (node) => registerArenaCardRef(arena.id, node),
                                        });
                                    })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-3">
                                {arenaFolders.map(folder => {
                                    const arenasInFolder = getArenas().filter(a => a.folderId === folder.id && !allCampaignArenaIds.includes(a.id));
                                    const isFolderDragOver = dragOverId === folder.id;

                                    return (
                                        <div
                                            key={folder.id}
                                            data-drop-id={folder.id}
                                            onClick={() => setSelectedFolderId(folder.id)}
                                            className={`relative aspect-[3/4] bg-gray-800/80 rounded-2xl border-2 border-dashed ${isFolderDragOver ? 'border-[var(--skin-accent-color)] bg-gray-700' : 'border-gray-600'} flex items-center justify-center cursor-pointer hover:border-[var(--skin-accent-color)] transition-colors group`}
                                        >
                                            <div className="absolute top-1 right-1 w-full h-full bg-gray-700/50 rounded-2xl -z-10 transform translate-x-1 -translate-y-1" />
                                            <div className="absolute top-2 right-2 w-full h-full bg-gray-600/30 rounded-2xl -z-20 transform translate-x-2 -translate-y-2" />
                                            <div className="flex flex-col items-center p-2 text-center">
                                                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{folder.icon}</span>
                                                <span className="text-sm font-bold text-gray-200 line-clamp-2">{folder.name}</span>
                                                <span className="text-xs text-gray-500 mt-1">{arenasInFolder.length} arenas</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {[
                                    ...campaigns.map(campaign => ({ itemType: 'campaign' as const, value: campaign, sortOrder: campaign.order || 0 })),
                                    ...rootArenas.map(arena => ({ itemType: 'arena' as const, value: arena, sortOrder: arena.order || 0 })),
                                ]
                                    .sort((a, b) => a.sortOrder - b.sortOrder)
                                    .map(item => {
                                        if (item.itemType === 'campaign') {
                                            const campaign = item.value as Campaign;
                                            return renderCampaignCard(campaign, campaign.type === 'parallel', getCampaignProgress(campaign));
                                        }

                                        const arena = item.value as Arena;
                                        return renderArenaBoardCard(arena, {
                                            assetName: getAssetById(arena.assetId)?.name || '',
                                            showInsertionIndicator: true,
                                        });
                                    })}
                            </div>
                        )
                    )}

                    {arenasViewMode === 'priorities' && (
                        <div className={arenaPresentationMode === 'list' ? 'space-y-4' : 'space-y-6'}>
                            {(['alta', 'media', 'baixa'] as const).map(priority => {
                                const sectionId = `priority-${priority}`;
                                const isCollapsed = collapsedSections[sectionId];
                                const isPriorityDragOver = dragOverId === priority;
                                const items = [
                                    ...campaigns
                                        .filter(campaign => (campaign.priority === priority) || (!campaign.priority && priority === 'media'))
                                        .map(campaign => ({ itemType: 'campaign' as const, value: campaign, sortOrder: campaign.priorityOrder || 0 })),
                                    ...rootArenas
                                        .filter(arena => (arena.priority === priority) || (!arena.priority && priority === 'media'))
                                        .map(arena => ({ itemType: 'arena' as const, value: arena, sortOrder: arena.priorityOrder || 0 })),
                                ].sort((a, b) => a.sortOrder - b.sortOrder);
                                const isEmpty = items.length === 0;

                                return (
                                    <div
                                        key={priority}
                                        data-drop-id={priority}
                                        className={`space-y-2 rounded-2xl transition-all duration-200 ${isPriorityDragOver ? 'bg-[var(--skin-accent-color)]/10 ring-2 ring-[var(--skin-accent-color)] p-2' : ''}`}
                                    >
                                        <div
                                            className="flex items-center gap-2 px-2 cursor-pointer group"
                                            onClick={() => toggleSection(sectionId)}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${priority === 'alta' ? 'bg-red-500' : priority === 'media' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-400 transition-colors">
                                                {priority === 'alta' ? 'Alta Prioridade' : priority === 'media' ? 'Média Prioridade' : 'Baixa Prioridade'}
                                            </span>
                                            <div className="flex-1 h-[1px] bg-white/5" />
                                            <span className={`text-[10px] text-gray-600 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`}>▼</span>
                                        </div>
                                        {!isCollapsed && (
                                            <div className={`animate-in fade-in slide-in-from-top-1 duration-200 ${isEmpty ? 'grid min-h-[80px] border-2 border-dashed border-white/5 rounded-xl place-items-center' : arenaPresentationMode === 'list' ? 'space-y-2' : 'overflow-x-auto hide-scrollbar pb-1'}`}>
                                                {isEmpty ? (
                                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Arraste aqui</span>
                                                ) : arenaPresentationMode === 'list' ? (
                                                    <>
                                                        {items.map(item => {
                                                            if (item.itemType === 'campaign') {
                                                                const campaign = item.value as Campaign;
                                                                return renderCampaignListRow(campaign, getCampaignProgress(campaign), {
                                                                    sortable: true,
                                                                    registerNode: (node) => registerCampaignCardRef(campaign.id, node),
                                                                });
                                                            }

                                                            const arena = item.value as Arena;
                                                            return renderArenaListRow(arena, {
                                                                assetName: getAssetById(arena.assetId)?.name,
                                                                sortableType: 'arena',
                                                                registerNode: (node) => registerArenaCardRef(arena.id, node),
                                                            });
                                                        })}
                                                    </>
                                                ) : (
                                                    <div className="grid min-w-max grid-flow-col grid-rows-1 auto-cols-[8.45rem] gap-3 px-2 pt-1">
                                                        {items.map(item => {
                                                            if (item.itemType === 'campaign') {
                                                                const campaign = item.value as Campaign;
                                                                return renderCampaignCard(campaign, campaign.type === 'parallel', getCampaignProgress(campaign));
                                                            }

                                                            const arena = item.value as Arena;
                                                            return renderArenaBoardCard(arena, {
                                                                assetName: getAssetById(arena.assetId)?.name,
                                                            });
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {arenasViewMode === 'assets' && (
                        <div className={arenaPresentationMode === 'list' ? 'space-y-4' : 'space-y-6'}>
                            {campaigns.length > 0 && (
                                <div className={arenaPresentationMode === 'list' ? 'space-y-1' : 'space-y-2'}>
                                    <div
                                        className="flex items-center gap-2 px-2 cursor-pointer group"
                                        onClick={() => toggleSection('campaigns')}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--skin-accent-color)] group-hover:text-white transition-colors">
                                            Campanhas Ativas
                                        </span>
                                        <div className="flex-1 h-[1px] bg-[var(--skin-accent-color)]/20" />
                                        <span className={`text-[10px] text-gray-600 transition-transform duration-300 ${collapsedSections['campaigns'] ? '-rotate-90' : ''}`}>▼</span>
                                    </div>
                                    {!collapsedSections['campaigns'] && (
                                        arenaPresentationMode === 'list' ? (
                                            <div className="space-y-2">
                                                {campaigns.map(campaign => renderCampaignListRow(campaign, getCampaignProgress(campaign), {
                                                    registerNode: (node) => registerCampaignCardRef(campaign.id, node),
                                                }))}
                                            </div>
                                        ) : (
                                        <div className="overflow-x-auto hide-scrollbar pb-1">
                                            <div className="grid min-w-max grid-flow-col grid-rows-1 auto-cols-[7.45rem] gap-3 px-2 pt-1">
                                                {campaigns.map(campaign => renderCampaignCard(campaign, campaign.type === 'parallel', getCampaignProgress(campaign)))}
                                            </div>
                                        </div>
                                        )
                                    )}
                                </div>
                            )}

                            {assetGroups.map(group => {
                                const sectionId = `asset-${group.id}`;
                                const isCollapsed = collapsedSections[sectionId];

                                return (
                                    <div key={group.id} className={arenaPresentationMode === 'list' ? 'space-y-1' : 'space-y-2'}>
                                        <div
                                            className="flex items-center gap-2 px-2 cursor-pointer group"
                                            onClick={() => toggleSection(sectionId)}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-400 transition-colors">
                                                {group.name}
                                            </span>
                                            <div className="flex-1 h-[1px] bg-white/5" />
                                            <span className={`text-[10px] text-gray-600 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`}>▼</span>
                                        </div>
                                        {!isCollapsed && (
                                            arenaPresentationMode === 'list' ? (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {group.arenas.map(arena => renderArenaListRow(arena, {
                                                        registerNode: (node) => registerArenaCardRef(arena.id, node),
                                                    }))}
                                                </div>
                                            ) : (
                                            <div className="overflow-x-auto hide-scrollbar pb-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <div className="grid min-w-max grid-flow-col grid-rows-1 auto-cols-[8.45rem] gap-3 px-2 pt-1">
                                                    {group.arenas.map(arena => renderArenaBoardCard(arena, { assetName: group.name }))}
                                                </div>
                                            </div>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <button
                    ref={fabRef}
                    id="new-action-button"
                    data-onboarding-id="new-arena-button"
                    onClick={handleOpenCreateArena}
                    className={`fixed bottom-20 right-4 w-12 h-12 rounded-full luxe-skin-button flex items-center justify-center shadow-lg shadow-black/50 transform hover:scale-110 transition-transform ${isSelectionMode ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    <PlusIcon className="w-6 h-6 text-black" />
                </button>
            </div>
            {selectedArena && (
                <ArenaDetailModal
                    arena={selectedArena}
                    onClose={() => setSelectedArenaId(null)}
                />
            )}
            {selectedSharedArenaDetail && (
                <ArenaDetailModal
                    arena={selectedSharedArenaDetail.arena}
                    actionsOverride={selectedSharedArenaDetail.actions}
                    tasksOverride={selectedSharedArenaDetail.tasks}
                    readOnly
                    onClose={() => setSelectedSharedArenaDetail(null)}
                />
            )}
            {selectedReceivedCampaignPreview && (
                <CampaignsCodex
                    initialCampaignId={selectedReceivedCampaignPreview.campaign.id}
                    previewCampaign={selectedReceivedCampaignPreview.campaign}
                    previewArenas={selectedReceivedCampaignPreview.arenas}
                    previewActions={selectedReceivedCampaignPreview.actions}
                    onClose={() => setSelectedReceivedCampaignPreview(null)}
                />
            )}
            {isCampaignHubOpen && (
                <CampaignsCodex onClose={() => setCampaignHubOpen(false)} />
            )}
            {selectedCampaign && (
                <CampaignsCodex
                    initialCampaignId={selectedCampaign.id}
                    onClose={() => setSelectedCampaignId(null)}
                />
            )}
            {showCreateCampaignModal && (
                <CreateCampaignModal
                    selectedArenaIds={selectedForCampaign}
                    onClose={() => setShowCreateCampaignModal(false)}
                    onCreated={() => {
                        setIsSelectionMode(false);
                        setSelectedForCampaign([]);
                    }}
                />
            )}
            {isCreatingArena && (
                <NewArenaModal
                    isOpen={true}
                    onClose={() => setIsCreatingArena(false)}
                    onArenaCreated={handleArenaCreated}
                />
            )}
        </>
    );
};



