import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../contexts/GameContext';
import { Arena, ActionType, ArenaFolder, Campaign } from '../types';
import { PlusIcon, EyeIcon, XIcon, LayersIcon } from '../components/Icons';
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

export const ArenasView: React.FC = () => {
    const { getArenas, assets, actions, addArena, updateArena, addAction, arenaFolders, createArenaFolder, moveArenaToFolder, reorderArena, reorderEntity, reorderEntityPriority, campaigns, addCampaign, updateCampaign, deleteCampaign, activeCycle, arenasViewMode, setArenasViewMode, userProfile } = useGame();
    const { isBuilderMode } = useCodexBuilder();
    const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [isCreatingArena, setIsCreatingArena] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    // Remove local viewMode state
    const fabRef = useRef<HTMLButtonElement>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dragOverSide, setDragOverSide] = useState<'left' | 'right' | null>(null);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (id: string) => {
        setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

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
    
    const allArenas = getArenas().filter(a => showArchived || !a.isArchived);
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
        element: HTMLElement
    } | null>(null);
    
    const [dragPosition, setDragPosition] = useState<{x: number, y: number} | null>(null);

    const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, id: string, type: 'arena' | 'campaign') => {
        if (isSelectionMode && type === 'arena' && allCampaignArenaIds.includes(id)) return;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        interactionRef.current = {
            id: id,
            type: type,
            startX: clientX,
            startY: clientY,
            element: e.currentTarget as HTMLElement
        };
    };

    const handleInteractionMove = (e: MouseEvent | TouchEvent) => {
        if (!interactionRef.current) return;
        
        const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
        
        const deltaX = Math.abs(clientX - interactionRef.current.startX);
        const deltaY = Math.abs(clientY - interactionRef.current.startY);
        
        // If moved more than threshold, start dragging
        if (!draggedId && (deltaX > 10 || deltaY > 10)) {
            setDraggedId(interactionRef.current.id);
        }

        if (draggedId) {
            if (e.cancelable && e.type !== 'mousemove') e.preventDefault(); // Prevent scroll on touch, allow mouse move
            
            setDragPosition({ x: clientX, y: clientY });

            // Find drop target manually via elementFromPoint
            const targetEl = document.elementFromPoint(clientX, clientY);
            const dropZone = targetEl?.closest('[data-drop-id]');
            
            if (dropZone) {
                const dropId = dropZone.getAttribute('data-drop-id');
                // Ensure we are not dropping on self
                if (dropId && dropId !== draggedId) {
                    const rect = dropZone.getBoundingClientRect();
                    const side = (clientX - rect.left) > rect.width / 2 ? 'right' : 'left';
                    setDragOverId(dropId);
                    setDragOverSide(side);
                }
            } else {
                setDragOverId(null);
            }
        }
    };

    const handleInteractionEnd = async (e: MouseEvent | TouchEvent) => {
        if (!draggedId || !interactionRef.current) {
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
                     } as any, dragOverId as any, draggedId);
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

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
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
                addCampaign({
                    title: "Nova Campanha",
                    description: "",
                    arenaIds: [targetId, finalDraggedId],
                    arenaConfig: {
                        [targetId]: { isLocked: false, isHidden: false },
                        [finalDraggedId]: { isLocked: true, isHidden: false }
                    },
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
    };

    // Helper to render Campaign Card
    const renderCampaignCard = (campaign: Campaign, isParallel: boolean, progress: number) => {
        const campaignArenas = getArenas().filter(a => campaign.arenaIds.includes(a.id));
        const isDragOver = dragOverId === campaign.id;
        const isDragged = draggedId === campaign.id;

        return (
            <div
                key={campaign.id}
                data-drop-id={campaign.id}
                onMouseDown={(e) => handleInteractionStart(e, campaign.id, 'campaign')}
                onTouchStart={(e) => handleInteractionStart(e, campaign.id, 'campaign')}
                onClick={() => setSelectedCampaignId(campaign.id)}
                className={`relative col-span-2 aspect-[4/3] bg-[#1a1a1a] rounded-2xl border flex flex-col cursor-pointer transition-all group overflow-hidden ${isDragOver ? 'z-10 ring-2 ring-[var(--skin-accent-color)]' : ''} ${isDragged ? 'opacity-30' : ''}`}
                style={{ borderColor: userProfile.skinColor || 'var(--skin-accent-color)' }}
            >
                {/* Folder Stack Effect */}
                <div className="absolute top-0 right-0 w-full h-full bg-white/5 rounded-2xl -z-10 transform translate-x-1 -translate-y-1 border border-white/5" />
                
                {/* Header */}
                <div className="p-2 border-b border-white/5 bg-black/20 flex items-center justify-between shrink-0 h-8">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-sm">📁</span>
                        <span className="text-[9px] font-bold text-gray-300 truncate leading-none pt-0.5">{campaign.title}</span>
                    </div>
                    {isParallel && (
                         <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden shrink-0 ml-1">
                            <div 
                                className="h-full bg-[var(--skin-accent-color)] transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Content / Thumbnails - Adjusted for taller/wider layout */}
                <div className="flex-1 p-2 grid grid-cols-2 gap-1.5 content-start overflow-hidden">
                    {campaignArenas.slice(0, 4).map(arena => (
                        <div key={arena.id} className="aspect-[3/4] rounded border border-white/10 relative bg-black/40 overflow-hidden transform scale-90 origin-top-left w-[110%] h-[110%]">
                            <div className="absolute inset-0 pointer-events-none z-10" /> 
                            <div className="w-full h-full">
                                <ArenaCard 
                                    arena={arena}
                                    actions={getActionsForArena(arena.id)}
                                    onClick={() => {}}
                                    variant="overview"
                                />
                            </div>
                        </div>
                    ))}
                    {campaignArenas.length > 4 && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded border border-white/20 z-20 shadow-lg">
                             <span className="text-[9px] font-bold text-gray-400">+{campaignArenas.length - 4}</span>
                        </div>
                    )}
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
                <div className="p-4 space-y-4 min-h-full">
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
                                        <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-xl">{action.icon}</div>
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
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Arenas do Codex</div>
                            <button onClick={() => setShowArchived(s => !s)} className={`p-2 rounded-full transition-colors ${showArchived ? 'bg-white/20 text-white' : 'text-gray-500'}`}>
                                <EyeIcon className="w-4 h-4" />
                            </button>
                        </div>
                        {allArenas.length === 0 ? (
                            <div className="text-center text-xs text-gray-500">Nenhuma arena criada ainda.</div>
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

    return (
        <>
            {renderDragPreview()}
            <div className="px-4 pb-4 pt-4 relative min-h-full">
                <div className="flex items-center justify-end gap-2 mb-4 z-[60]">
                    <button 
                        onClick={handleCreateCampaignClick} 
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                            isSelectionMode 
                                ? 'bg-[var(--skin-accent-color)] text-black animate-pulse'
                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                    >
                        {isSelectionMode ? 'Modo Organização (Ativo)' : 'Organizar Campanhas'}
                    </button>
                    <div className="flex items-center bg-black/40 rounded-full px-1 border border-white/5">
                        <button 
                            onClick={handleCycleViewMode}
                            className={`p-1.5 rounded-full transition-colors flex items-center gap-1.5 ${arenasViewMode !== 'free' ? 'text-[var(--skin-accent-color)]' : 'text-gray-500 hover:text-gray-300'}`}
                            title={`Modo: ${arenasViewMode === 'free' ? 'Livre' : arenasViewMode === 'priorities' ? 'Prioridades' : 'Por Ativo'}`}
                        >
                            <LayersIcon className="w-4 h-4" />
                            <span className="text-[9px] font-bold uppercase tracking-tighter w-12 text-center truncate">
                                {arenasViewMode === 'free' ? 'Livre' : arenasViewMode === 'priorities' ? 'Prios' : 'Ativo'}
                            </span>
                        </button>
                        <div className="w-[1px] h-3 bg-white/10 mx-0.5" />
                        <button onClick={() => setShowArchived(s => !s)} className={`p-1.5 rounded-full transition-colors ${showArchived ? 'text-white' : 'text-gray-500'}`}>
                            <EyeIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {isSelectionMode && (
                    <div className="mb-4 p-3 bg-[var(--skin-accent-color)]/10 border border-[var(--skin-accent-color)]/20 rounded-xl">
                        {/* Prompt removed per user request */}
                    </div>
                )}

                <div id="arenas-container" className="space-y-8">
                    {arenasViewMode === 'free' && (
                        <div className="grid grid-cols-4 gap-3">
                            {/* Render Folders First */}
                            {arenaFolders.map(folder => {
                                const arenasInFolder = getArenas().filter(a => a.folderId === folder.id && !allCampaignArenaIds.includes(a.id)); 
                                const isDragOver = dragOverId === folder.id;
                                
                                return (
                                     <div 
                                        key={folder.id}
                                        data-drop-id={folder.id}
                                        onClick={() => setSelectedFolderId(folder.id)}
                                        className={`relative aspect-[3/4] bg-gray-800/80 rounded-2xl border-2 border-dashed ${isDragOver ? 'border-[var(--skin-accent-color)] bg-gray-700' : 'border-gray-600'} flex items-center justify-center cursor-pointer hover:border-[var(--skin-accent-color)] transition-colors group`}
                                    >
                                        {/* Stack visual effect */}
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

                            {/* Render Mixed Items (Campaigns + Arenas) Sorted by Order */}
                            {[
                                ...campaigns.map(c => ({ ...c, type: 'campaign' as const, order: c.order || 0 })),
                                ...rootArenas.map(a => ({ ...a, type: 'arena' as const, order: a.order || 0 }))
                            ]
                            .sort((a, b) => a.order - b.order)
                            .map(item => {
                                if (item.type === 'campaign') {
                                    const campaign = item as unknown as Campaign;
                                    const campaignArenas = getArenas().filter(a => campaign.arenaIds.includes(a.id));
                                    const isParallel = campaign.type === 'parallel';
                                    let progress = 0;
                                    if (isParallel && campaignArenas.length > 0) {
                                        const totalActions = campaignArenas.reduce((acc, arena) => acc + getActionsForArena(arena.id).length, 0);
                                        const completedActions = campaignArenas.reduce((acc, arena) => {
                                            const completedIds = campaign.arenaConfig?.[arena.id]?.completedActionIds || [];
                                            return acc + completedIds.length;
                                        }, 0);
                                        progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
                                    }
                                    return renderCampaignCard(campaign, isParallel, progress);
                                } else {
                                    const arena = item as unknown as Arena;
                                    const asset = getAssetById(arena.assetId);
                                    const arenaActions = getActionsForArena(arena.id);
                                    const isDragOver = dragOverId === arena.id;
                                    const isDragged = draggedId === arena.id;
                                    const isSelected = selectedForCampaign.includes(arena.id);
                                    
                                    // Check if arena is already in a campaign to visually disable it in selection mode
                                    const alreadyInCampaign = allCampaignArenaIds.includes(arena.id);

                                    return (
                                        <div
                                            key={arena.id}
                                            data-drop-id={arena.id}
                                            onMouseDown={(e) => handleInteractionStart(e, arena.id, 'arena')}
                                            onTouchStart={(e) => handleInteractionStart(e, arena.id, 'arena')}
                                            className={`relative transition-all duration-200 select-none cursor-grab active:cursor-grabbing
                                                ${isDragOver ? 'z-50' : 'z-10'} 
                                                ${isDragged ? 'opacity-30 brightness-50' : ''} 
                                                ${isSelectionMode && alreadyInCampaign ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                                            `}
                                            onClick={() => isSelectionMode ? null : setSelectedArenaId(arena.id)}
                                        >
                                            <div className="absolute inset-0 z-50 pointer-events-auto" />
                                            {/* Indicador visual de inserção magnética */}
                                            {isDragOver && (
                                                <div className={`absolute top-0 bottom-0 w-1 bg-[var(--skin-accent-color)] shadow-[0_0_8px_var(--skin-accent-color)] z-30 pointer-events-none rounded-full
                                                    ${dragOverSide === 'left' ? '-left-1.5' : '-right-1.5'}`} 
                                                />
                                            )}

                                            <div className={`relative transition-transform duration-200 ${isDragOver ? (dragOverSide === 'left' ? 'translate-x-1' : '-translate-x-1') : ''}`}>
                                                <ArenaCard 
                                                    arena={arena}
                                                    assetName={asset?.name || ''}
                                                    actions={arenaActions}
                                                    onClick={() => {}} // Click handled by parent div
                                                    variant="overview"
                                                />
                                                {isSelectionMode && alreadyInCampaign && (
                                                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center border-gray-400 bg-black/50`}>
                                                        <span className="text-gray-500 font-bold text-[10px]">⛔</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    )}

                    {arenasViewMode === 'priorities' && (
                        <div className="space-y-6">
                            {(['alta', 'media', 'baixa'] as const).map(p => {
                                const isCollapsed = collapsedSections[`priority-${p}`];
                                const isDragOverGroup = dragOverId === p;
                                const itemsInPriority = [
                                    ...campaigns.filter(c => (c.priority === p) || (!c.priority && p === 'media')),
                                    ...rootArenas.filter(a => (a.priority === p) || (!a.priority && p === 'media'))
                                ];
                                const isEmpty = itemsInPriority.length === 0;

                                return (
                                    <div 
                                        key={p} 
                                        data-drop-id={p} // Drop zone for priority group
                                        className={`space-y-2 rounded-2xl transition-all duration-200 ${isDragOverGroup ? 'bg-[var(--skin-accent-color)]/10 ring-2 ring-[var(--skin-accent-color)] p-2' : ''}`}
                                    >
                                        <div 
                                            className="flex items-center gap-2 px-2 cursor-pointer group"
                                            onClick={() => toggleSection(`priority-${p}`)}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${p === 'alta' ? 'bg-red-500' : p === 'media' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-400 transition-colors">
                                                {p === 'alta' ? 'Alta Prioridade' : p === 'media' ? 'Média Prioridade' : 'Baixa Prioridade'}
                                            </span>
                                            <div className="flex-1 h-[1px] bg-white/5" />
                                            <span className={`text-[10px] text-gray-600 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`}>▼</span>
                                        </div>
                                        {!isCollapsed && (
                                            <div className={`grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-1 duration-200 ${isEmpty ? 'min-h-[80px] border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center' : ''}`}>
                                                {isEmpty && (
                                                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                                                        Arraste aqui
                                                    </span>
                                                )}
                                                {[
                                                    ...campaigns.filter(c => (c.priority === p) || (!c.priority && p === 'media')).map(c => ({ ...c, type: 'campaign' as const, priorityOrder: c.priorityOrder || 0 })),
                                                    ...rootArenas.filter(a => (a.priority === p) || (!a.priority && p === 'media')).map(a => ({ ...a, type: 'arena' as const, priorityOrder: a.priorityOrder || 0 }))
                                                ]
                                                .sort((a, b) => a.priorityOrder - b.priorityOrder)
                                                .map((item: any) => {
                                                    const isCampaign = item.type === 'campaign';
                                                    
                                                    if (isCampaign) {
                                                        const campaign = item as Campaign;
                                                        const campaignArenas = getArenas().filter(a => campaign.arenaIds.includes(a.id));
                                                        const isParallel = campaign.type === 'parallel';
                                                        let progress = 0;
                                                        if (isParallel && campaignArenas.length > 0) {
                                                            const totalActions = campaignArenas.reduce((acc, arena) => acc + getActionsForArena(arena.id).length, 0);
                                                            const completedActions = campaignArenas.reduce((acc, arena) => {
                                                                const completedIds = campaign.arenaConfig?.[arena.id]?.completedActionIds || [];
                                                                return acc + completedIds.length;
                                                            }, 0);
                                                            progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
                                                        }

                                                        return renderCampaignCard(campaign, isParallel, progress);
                                                    }

                                                    const arena = item as Arena;
                                                    const isDragOver = dragOverId === arena.id;
                                                    const isDragged = draggedId === arena.id;
                                                    
                                                    return (
                                        <div
                                            key={arena.id}
                                            data-drop-id={arena.id}
                                            onMouseDown={(e) => handleInteractionStart(e, arena.id, 'arena')}
                                            onTouchStart={(e) => handleInteractionStart(e, arena.id, 'arena')}
                                            className={`relative transition-all duration-300 select-none cursor-grab active:cursor-grabbing 
                                                ${isDragOver ? 'z-50 ring-2 ring-[var(--skin-accent-color)] rounded-2xl' : 'z-10'} 
                                                ${isDragged ? 'opacity-30 brightness-50' : ''}`}
                                            style={{ touchAction: 'none' }}
                                            onClick={() => isSelectionMode ? null : setSelectedArenaId(arena.id)} // Disable selection click, enable detail click only if not selection mode
                                        >
                                                            <div className="absolute inset-0 z-50 pointer-events-auto" />
                                                            <ArenaCard 
                                                                arena={arena} 
                                                                assetName={getAssetById(arena.assetId)?.name}
                                                                actions={getActionsForArena(arena.id)}
                                                                onClick={() => {}} // Handled by parent
                                                                variant="overview"
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {arenasViewMode === 'assets' && (
                        <div className="space-y-6">
                            {/* Render Campaigns at the top of Assets View */}
                            {campaigns.length > 0 && (
                                <div className="space-y-2">
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
                                        <div className="grid grid-cols-4 gap-3">
                                             {campaigns.map(campaign => {
                                                const campaignArenas = getArenas().filter(a => campaign.arenaIds.includes(a.id));
                                                const isParallel = campaign.type === 'parallel';
                                                let progress = 0;
                                                if (isParallel && campaignArenas.length > 0) {
                                                    const totalActions = campaignArenas.reduce((acc, arena) => acc + getActionsForArena(arena.id).length, 0);
                                                    const completedActions = campaignArenas.reduce((acc, arena) => {
                                                        const completedIds = campaign.arenaConfig?.[arena.id]?.completedActionIds || [];
                                                        return acc + completedIds.length;
                                                    }, 0);
                                                    progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
                                                }
                                                return renderCampaignCard(campaign, isParallel, progress);
                                             })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {assetGroups.map(group => {
                                const isCollapsed = collapsedSections[`asset-${group.id}`];
                                return (
                                    <div key={group.id} className="space-y-2">
                                        <div 
                                            className="flex items-center gap-2 px-2 cursor-pointer group"
                                            onClick={() => toggleSection(`asset-${group.id}`)}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-400 transition-colors">
                                                {group.name}
                                            </span>
                                            <div className="flex-1 h-[1px] bg-white/5" />
                                            <span className={`text-[10px] text-gray-600 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`}>▼</span>
                                        </div>
                                        {!isCollapsed && (
                                            <div className="grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                                {group.arenas.map(arena => {
                                                    // In Assets view, disable selection if arena is in campaign
                                                    const alreadyInCampaign = allCampaignArenaIds.includes(arena.id);
                                                    const isSelected = selectedForCampaign.includes(arena.id);

                                                    return (
                                                        <div 
                                                            key={arena.id} 
                                                            data-drop-id={arena.id}
                                                            onMouseDown={(e) => handleInteractionStart(e, arena.id, 'arena')}
                                                            onTouchStart={(e) => handleInteractionStart(e, arena.id, 'arena')}
                                                            className={`relative select-none cursor-grab active:cursor-grabbing z-10
                                                                ${isSelectionMode && alreadyInCampaign ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                                                                ${dragOverId === arena.id ? 'z-50 ring-2 ring-[var(--skin-accent-color)] rounded-xl' : ''}
                                                            `}
                                                            onClick={() => isSelectionMode && alreadyInCampaign ? null : (isSelectionMode ? null : setSelectedArenaId(arena.id))}
                                                        >
                                                            <div className="absolute inset-0 z-50 pointer-events-auto" />
                                                            <ArenaCard 
                                                                arena={arena} 
                                                                assetName={group.name}
                                                                actions={getActionsForArena(arena.id)}
                                                                onClick={() => {}} // Click handled by parent div
                                                                variant="overview"
                                                            />
                                                             {isSelectionMode && alreadyInCampaign && (
                                                                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center border-gray-400 bg-black/50`}>
                                                                    <span className="text-gray-500 font-bold text-[10px]">⛔</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                 <button 
                    ref={fabRef}
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
