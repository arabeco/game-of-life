import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { Action, Arena, Campaign } from '../types';
import { PlusIcon, LockIcon, TrashIcon, EditIcon, LinkIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, CheckIcon } from './Icons';
import { ArenaCard } from './ArenaCard';
import { NewArenaModal } from './NewArenaModal';
import { ArenaDetailModal } from './ArenaDetailModal';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';
import { CampaignArenaStack } from './CampaignArenaStack';
import { calculateCampaignProgress, getCampaignArenaStates } from '../utils/progressUtils';
import { EmojiGlyph } from './EmojiGlyph';

interface CampaignsCodexProps {
    onClose: () => void;
    initialCampaignId?: string | null;
    previewCampaign?: Campaign | null;
    previewArenas?: Arena[];
    previewActions?: Action[];
    previewMeta?: {
        coverImage?: string;
        badgeLabel?: string;
        author?: string;
        note?: string;
        hideArenaDetails?: boolean;
    };
}

const isProbablyImageUrl = (value?: string | null) => {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('/') || normalized.startsWith('data:image/');
};

const PreviewArenaMiniCard: React.FC<{ arena: Arena; actions: Action[] }> = ({ arena, actions }) => {
    const visibleActions = actions.slice(0, 3);
    const hiddenActions = Math.max(0, actions.length - visibleActions.length);

    return (
        <div className="w-[10rem] flex-shrink-0 rounded-[0.95rem] border border-white/10 bg-[linear-gradient(180deg,rgba(91,65,167,0.18),rgba(17,17,20,0.96))] p-2 shadow-[0_12px_20px_rgba(0,0,0,0.22)]">
            <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] border border-white/10 bg-black/35 text-white">
                    <EmojiGlyph symbol={arena.icon || '🏛️'} size="action" className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[11px] font-black uppercase leading-tight text-white">
                        {arena.name}
                    </div>
                </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
                {visibleActions.length > 0 ? visibleActions.map((action) => (
                    <span
                        key={action.id}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/8 bg-white/[0.05] px-1.5 py-1 text-[9px] font-semibold text-white/72"
                    >
                        <span className="shrink-0 leading-none">{action.icon || '📝'}</span>
                        <span className="truncate">{action.name}</span>
                    </span>
                )) : (
                    <span className="inline-flex rounded-full border border-white/8 bg-white/[0.05] px-2 py-1 text-[10px] font-semibold text-white/45">
                        Sem acoes
                    </span>
                )}
                {hiddenActions > 0 && (
                    <span className="inline-flex rounded-full border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--skin-accent-color)]">
                        +{hiddenActions}
                    </span>
                )}
            </div>
        </div>
    );
};

export const CampaignsCodex: React.FC<CampaignsCodexProps> = ({ onClose, initialCampaignId, previewCampaign, previewArenas = [], previewActions = [], previewMeta }) => {
    const { campaigns, getArenas, actions, tasks, updateCampaign, deleteCampaign, addCampaign, getClanQuestsForArena, getClanQuestProgress, getSharedActionPoolProgress, userCodexes } = useGame();
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampaignId || null);
    const [isCreatingArena, setIsCreatingArena] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);
    
    const [draggedArenaId, setDraggedArenaId] = useState<string | null>(null);
    const [isLinkingMode] = useState(false);
    const [linkingSourceId] = useState<string | null>(null);
    const [visiblePhaseCount, setVisiblePhaseCount] = useState(1);

    // Expandable Description State
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const allArenas = getArenas();
    const effectivePreviewCampaign: Campaign | null = previewCampaign
        ? {
            ...previewCampaign,
            order: previewCampaign.order ?? -1,
            priorityOrder: previewCampaign.priorityOrder ?? -1,
        }
        : null;
    const validCampaigns = campaigns.filter(Boolean);
    const visibleCampaigns = effectivePreviewCampaign
        ? [effectivePreviewCampaign, ...validCampaigns.filter((campaign) => campaign.id !== effectivePreviewCampaign.id)]
        : validCampaigns;
    const selectedCampaign = selectedCampaignId ? visibleCampaigns.find(c => c.id === selectedCampaignId) : null;
    const isPreviewCampaign = selectedCampaignId === effectivePreviewCampaign?.id;
    const campaignArenasSource = isPreviewCampaign ? previewArenas : allArenas;
    const campaignActionsSource = isPreviewCampaign ? previewActions : actions;
    
    // Reset selection if campaign is deleted
    useEffect(() => {
        if (selectedCampaignId && !selectedCampaign) {
            setSelectedCampaignId(null);
        }
    }, [visibleCampaigns, selectedCampaignId, selectedCampaign]);

    // Update edit fields when campaign changes
    useEffect(() => {
        if (selectedCampaign) {
            setEditTitle(selectedCampaign.title);
            setEditDescription(selectedCampaign.description || '');
            setIsDescriptionExpanded(false); // Reset expansion on change
        }
    }, [selectedCampaign]);

    useEffect(() => {
        if (!selectedCampaign) {
            setVisiblePhaseCount(1);
            return;
        }
        const config = selectedCampaign.arenaConfig || {};
        const highestPhase = selectedCampaign.arenaIds.reduce((maxPhase, arenaId) => {
            const explicitPhase = config[arenaId]?.phase;
            if (typeof explicitPhase === 'number') return Math.max(maxPhase, explicitPhase);
            const prereqCount = config[arenaId]?.prerequisiteArenaIds?.length || 0;
            return Math.max(maxPhase, prereqCount > 0 ?1 : 0);
        }, 0);
        setVisiblePhaseCount(Math.min(5, Math.max(1, highestPhase + 1)));
    }, [selectedCampaign]);

    // Identify Codex-based campaigns
    const isCodexCampaign = selectedCampaign?.arenaIds.some(id => {
        const arena = campaignArenasSource.find(a => a.id === id);
        return !!arena?.originCodexId;
    });
    const campaignCodexOriginId = selectedCampaign?.arenaIds
        .map(id => campaignArenasSource.find(arena => arena.id === id)?.originCodexId)
        .find(Boolean);
    const campaignCodex = campaignCodexOriginId
        ? userCodexes.find(codex => codex.id === campaignCodexOriginId) ?? null
        : null;
    const isReadOnlyCodexCampaign = campaignCodex?.source_type === 'gift_link' || campaignCodex?.source_type === 'gift_in_app';

    const handleCreateCampaign = async () => {
        const title = `Nova Campanha ${validCampaigns.length + 1}`;
        const createdCampaign = await addCampaign({
            title,
            description: 'Descrição da campanha...',
            type: 'parallel',
            arenaIds: [],
            arenaConfig: {},
            priority: 'media',
            order: validCampaigns.length,
            priorityOrder: 0
        });
        setSelectedCampaignId(createdCampaign.id);
        setIsEditing(true);
    };

    const handleSaveCampaign = () => {
        if (!selectedCampaign || isPreviewCampaign) return;
        updateCampaign(selectedCampaign.id, {
            title: editTitle,
            description: editDescription
        });
        setIsEditing(false);
    };

    const handleDeleteCampaign = () => {
        if (!selectedCampaign || isPreviewCampaign) return;
        if (confirm('Tem certeza que deseja excluir esta campanha?TODAS as arenas e ações dentro dela serão excluídas permanentemente.')) {
            deleteCampaign(selectedCampaign.id);
            setSelectedCampaignId(null);
        }
    };
    
    const campaignArenas = selectedCampaign 
        ?campaignArenasSource.filter(a => selectedCampaign.arenaIds.includes(a.id))
        : [];

    const sortedArenas = selectedCampaign 
        ?[...campaignArenas].sort((a, b) => {
            const indexA = selectedCampaign.arenaIds.indexOf(a.id);
            const indexB = selectedCampaign.arenaIds.indexOf(b.id);
            return indexA - indexB;
        })
        : [];

    const campaignArenaStates = useMemo(() => {
        if (!selectedCampaign) return {};

        const arenasById = Object.fromEntries(campaignArenasSource.map(arena => [arena.id, arena]));
        const actionsByArena = Object.fromEntries(campaignArenasSource.map(arena => [arena.id, campaignActionsSource.filter(action => action.arenaId === arena.id)]));

        return getCampaignArenaStates({
            campaign: selectedCampaign,
            arenasById,
            actionsByArena,
            tasks,
            getClanQuestsForArena,
            getClanQuestProgress,
            getSharedActionPoolProgress,
        });
    }, [selectedCampaign, campaignArenasSource, campaignActionsSource, tasks, getClanQuestsForArena, getClanQuestProgress, getSharedActionPoolProgress]);
    const selectedCampaignProgress = useMemo(() => {
        if (!selectedCampaign) return 0;
        const arenasById = Object.fromEntries(campaignArenasSource.map(arena => [arena.id, arena]));
        const actionsByArena = Object.fromEntries(campaignArenasSource.map(arena => [arena.id, campaignActionsSource.filter(action => action.arenaId === arena.id)]));

        return calculateCampaignProgress({
            campaign: selectedCampaign,
            arenasById,
            actionsByArena,
            tasks,
            getClanQuestsForArena,
            getClanQuestProgress,
            getSharedActionPoolProgress,
        });
    }, [selectedCampaign, campaignArenasSource, campaignActionsSource, tasks, getClanQuestsForArena, getClanQuestProgress, getSharedActionPoolProgress]);
    const arenaPhaseRows = useMemo(() => {
        if (!selectedCampaign || sortedArenas.length === 0) return [];

        const config = selectedCampaign.arenaConfig || {};
        const arenaById = Object.fromEntries(sortedArenas.map(arena => [arena.id, arena]));
        const memo = new Map<string, number>();

        const resolvePhase = (arenaId: string, trail = new Set<string>()): number => {
            if (memo.has(arenaId)) return memo.get(arenaId)!;
            if (trail.has(arenaId)) return 0;

            const explicitPhase = config[arenaId]?.phase;
            if (typeof explicitPhase === 'number') {
                memo.set(arenaId, explicitPhase);
                return explicitPhase;
            }

            trail.add(arenaId);
            const prereqs = (config[arenaId]?.prerequisiteArenaIds || []).filter(id => arenaById[id]);
            const phase = prereqs.length === 0
                ? 0
                : Math.max(...prereqs.map(id => resolvePhase(id, new Set(trail)))) + 1;

            memo.set(arenaId, phase);
            return phase;
        };

        const buckets = new Map<number, Arena[]>();
        sortedArenas.forEach(arena => {
            const phase = resolvePhase(arena.id);
            const list = buckets.get(phase) || [];
            list.push(arena);
            buckets.set(phase, list);
        });

        return Array.from(buckets.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([phase, arenas]) => ({ phase, arenas }));
    }, [selectedCampaign, sortedArenas]);
    
    const handleRemoveArena = (arenaId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedCampaign || isPreviewCampaign) return;
        
        if (isReadOnlyCodexCampaign) {
            alert("Codex recebido fica protegido e nao pode ter a campanha remodelada.");
            return;
        }

        if (window.confirm("Tem certeza que deseja remover esta arena da campanha?")) {
            const newArenaIds = selectedCampaign.arenaIds.filter(id => id !== arenaId);
            const newConfig = { ...selectedCampaign.arenaConfig };
            delete newConfig[arenaId];
            
            Object.keys(newConfig).forEach(key => {
                const prereqs = newConfig[key].prerequisiteArenaIds || [];
                if (prereqs.includes(arenaId)) {
                    newConfig[key] = {
                        ...newConfig[key],
                        prerequisiteArenaIds: prereqs.filter(id => id !== arenaId)
                    };
                }
            });

            updateCampaign(selectedCampaign.id, {
                arenaIds: newArenaIds,
                arenaConfig: newConfig
            });
        }
    };

    const handleMoveArena = (arenaId: string, direction: 'left' | 'right', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedCampaign || isPreviewCampaign) return;
        if (isReadOnlyCodexCampaign) return;
        
        const currentIds = [...selectedCampaign.arenaIds];
        const currentIndex = currentIds.indexOf(arenaId);
        if (currentIndex === -1) return;
        
        const newIndex = direction === 'left' ?currentIndex - 1 : currentIndex + 1;
        
        if (newIndex >= 0 && newIndex < currentIds.length) {
            [currentIds[currentIndex], currentIds[newIndex]] = [currentIds[newIndex], currentIds[currentIndex]];
            updateCampaign(selectedCampaign.id, { arenaIds: currentIds });
        }
    };
    
    const isArenaLocked = (arenaId: string) => {
        return campaignArenaStates[arenaId]?.isLocked || false;
    };

    const getPhaseAssignments = () => {
        const assignments: Record<string, number> = {};
        arenaPhaseRows.forEach(({ phase, arenas }) => {
            arenas.forEach((arena) => {
                assignments[arena.id] = phase;
            });
        });
        sortedArenas.forEach((arena) => {
            if (assignments[arena.id] === undefined) assignments[arena.id] = 0;
        });
        return assignments;
    };

    const buildArenaConfigFromPhases = (assignments: Record<string, number>) => {
        if (!selectedCampaign) return {};
        const currentConfig = selectedCampaign.arenaConfig || {};
        const usedPhases = Array.from(new Set(Object.values(assignments))).sort((a, b) => a - b);
        const compressedPhases = new Map<number, number>(usedPhases.map((phase, index) => [phase, index]));
        const normalized = Object.fromEntries(
            Object.entries(assignments).map(([arenaId, phase]) => [arenaId, compressedPhases.get(phase) ?? 0])
        ) as Record<string, number>;

        if (!Object.values(normalized).includes(0) && sortedArenas[0]) {
            normalized[sortedArenas[0].id] = 0;
        }

        return Object.fromEntries(
            selectedCampaign.arenaIds.map((arenaId) => {
                const phase = normalized[arenaId] ?? 0;
                const previousPhaseArenaIds = selectedCampaign.arenaIds.filter(
                    (id) => id !== arenaId && (normalized[id] ?? 0) === phase - 1
                );

                return [arenaId, {
                    ...(currentConfig[arenaId] || { isLocked: false, isHidden: false }),
                    phase,
                    prerequisiteArenaIds: phase === 0 ? [] : previousPhaseArenaIds,
                }];
            })
        );
    };

    const handleAddPhase = () => {
        setVisiblePhaseCount((current) => Math.min(5, current + 1));
    };

    const handleAssignArenaToPhase = (arenaId: string, targetPhase: number) => {
        if (!selectedCampaign || isPreviewCampaign || isReadOnlyCodexCampaign) return;
        const assignments = getPhaseAssignments();
        assignments[arenaId] = Math.max(0, Math.min(4, targetPhase));
        const config = buildArenaConfigFromPhases(assignments);
        updateCampaign(selectedCampaign.id, { arenaConfig: config });
        setVisiblePhaseCount((current) => Math.max(current, Math.min(5, targetPhase + 1)));
    };

    const handleArenaDragStart = (arenaId: string) => {
        if (!isEditing || isPreviewCampaign || isReadOnlyCodexCampaign) return;
        setDraggedArenaId(arenaId);
    };

    const handleArenaDropIntoPhase = (phase: number) => {
        if (!draggedArenaId) return;
        handleAssignArenaToPhase(draggedArenaId, phase);
        setDraggedArenaId(null);
    };

    const handleArenaClick = (arenaId: string) => {
        if (!selectedCampaign) return;
        if (isPreviewCampaign && previewMeta?.hideArenaDetails) return;
        setSelectedArenaId(arenaId);
    };

    const handleCreateFutureArena = () => {
        if (isPreviewCampaign) return;
        setIsCreatingArena(true);
    };

    const onArenaCreated = (newArena: Arena) => {
        if (!selectedCampaign) return;
        
        updateCampaign(selectedCampaign.id, {
            arenaIds: [...selectedCampaign.arenaIds, newArena.id],
            arenaConfig: {
                ...(selectedCampaign.arenaConfig || {}),
                [newArena.id]: {
                    isLocked: false,
                    isHidden: false
                }
            }
        });
        setIsCreatingArena(false);
    };

    const selectedArena = selectedArenaId ?campaignArenasSource.find(a => a.id === selectedArenaId) : null;
    const showPhaseHeaders = arenaPhaseRows.length > 1;
    const displayCampaignTitle = editTitle?.trim() || selectedCampaign?.title || '';
    const displayCampaignDescription = editDescription?.trim() || selectedCampaign?.description || '';
    const previewActionCount = isPreviewCampaign ? previewActions.length : 0;
    const renderedPhaseRows = Array.from(
        { length: isEditing ?visiblePhaseCount : Math.max(1, arenaPhaseRows.length) },
        (_, phase) => ({ phase, arenas: arenaPhaseRows.find((row) => row.phase === phase)?.arenas || [] })
    );
    // RENDER: LIST VIEW (Grid of Campaigns)
    if (!selectedCampaign) {
        return (
            <Portal>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                    <GlassCard variant="neutral" className="relative flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.7rem]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-lg font-bold uppercase tracking-[0.22em] text-white">Campanhas</h2>
                            <button onClick={onClose} className="luxe-skin-button flex h-11 min-w-[3.25rem] items-center justify-center rounded-2xl px-4 text-sm font-bold">
                                <CheckIcon className="h-5 w-5" />
                            </button>
                            {!isReadOnlyCodexCampaign && !isPreviewCampaign && isEditing && visiblePhaseCount < 5 && (
                                <button
                                    onClick={handleAddPhase}
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                                        isLinkingMode 
                                            ?'border-blue-500 bg-blue-500/20 text-blue-300 shadow-[0_0_24px_rgba(59,130,246,0.3)]' 
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-[var(--skin-accent-color)]/35 hover:bg-white/10 hover:text-white'
                                    }`}
                                    title={isLinkingMode ?'Modo de vínculo ativo' : 'Ativar vínculos'}
                                >
                                    <LinkIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        
                        <div className="overflow-y-auto p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Create New Button */}
                                <button 
                                    onClick={handleCreateCampaign}
                                    className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-[var(--skin-accent-color)] hover:bg-white/5 flex flex-col items-center justify-center gap-2 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-[var(--skin-accent-color)] group-hover:text-black flex items-center justify-center transition-all">
                                        <PlusIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-400 group-hover:text-white">Nova Campanha</span>
                                </button>

                                {/* Campaign Cards */}
                                {visibleCampaigns.map(campaign => {
                                    // Determine if it's a Codex campaign for visual cue
                                    const isCodex = campaign.arenaIds.some(id => campaignArenasSource.find(a => a.id === id)?.originCodexId);
                                    
                                    // Check if it's the "Máquina Biológica" campaign
                                    const isBioMachine = campaign.title.toLowerCase().includes('máquina biológica') || campaign.title.toLowerCase().includes('maquina biologica');
                                    
                                    if (isBioMachine) {
                                        return (
                                            <div 
                                                key={campaign.id}
                                                onClick={() => setSelectedCampaignId(campaign.id)}
                                                className="aspect-[4/3] relative rounded-2xl cursor-pointer flex flex-col overflow-hidden group transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(0,255,127,0.3)] border border-white/10 hover:border-emerald-500/50"
                                            >
                                                {/* Animated Background */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-black to-black z-0" />
                                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518531933037-9a82bf558667?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80')] opacity-20 mix-blend-overlay bg-cover bg-center z-0 transition-transform duration-700 group-hover:scale-110" />
                                                
                                                {/* Codex Badge */}
                                                <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 rounded text-[9px] font-black text-emerald-400 uppercase tracking-widest backdrop-blur-sm z-10 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                                    SYSTEM CODEX
                                                </div>

                                                <div className="absolute top-3 left-3 z-10">
                                                    <div className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center text-lg shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                                        🧬
                                                    </div>
                                                </div>

                                                <div className="flex-1 p-5 flex flex-col justify-end relative z-10">
                                                    <h3 className="text-xl font-black text-white leading-tight mb-1 group-hover:text-emerald-400 transition-colors drop-shadow-md tracking-wide font-mono">
                                                        MÁQUINA<br/>BIOLÓGICA
                                                    </h3>
                                                    <p className="text-[10px] text-emerald-200/70 line-clamp-2 font-mono border-l-2 border-emerald-500/30 pl-2">
                                                        {campaign.description || "Reconfiguração do sistema biológico."}
                                                    </p>
                                                </div>
                                                
                                                {/* Tech footer */}
                                                <div className="px-4 py-2 bg-emerald-900/20 border-t border-emerald-500/10 flex items-center justify-between relative z-10 backdrop-blur-sm">
                                                    <div className="text-[9px] text-emerald-400/60 font-mono flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                                                        {campaign.arenaIds.length} MÓDULOS
                                                    </div>
                                                    <ChevronRightIcon className="w-3 h-3 text-emerald-500/50 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div 
                                            key={campaign.id}
                                            onClick={() => setSelectedCampaignId(campaign.id)}
                                            className="aspect-[4/3] bg-[#1a1a1a] rounded-2xl border border-white/10 hover:border-[var(--skin-accent-color)] cursor-pointer flex flex-col overflow-hidden group relative transition-all hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                        >
                                            {/* Folder Tab Effect */}
                                            <div className="absolute top-0 left-0 w-1/3 h-1 bg-white/20 group-hover:bg-[var(--skin-accent-color)] transition-colors" />
                                            
                                            {isCodex && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-[var(--skin-accent-color)]/20 border border-[var(--skin-accent-color)]/50 rounded text-[9px] font-bold text-[var(--skin-accent-color)] uppercase tracking-wider">
                                                    Codex
                                                </div>
                                            )}
                                            {campaign.id === effectivePreviewCampaign?.id && (
                                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/10 border border-white/15 rounded text-[9px] font-bold text-gray-200 uppercase tracking-wider z-10">
                                                    {previewMeta?.badgeLabel || 'Preview'}
                                                </div>
                                            )}

                                            <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                                                <div className="flex items-center justify-center rounded-xl border border-white/6 bg-[linear-gradient(180deg,rgba(139,92,246,0.16),rgba(12,12,12,0.18))] px-2 py-2">
                                                    <CampaignArenaStack
                                                        arenas={campaignArenasSource.filter(arena => campaign.arenaIds.includes(arena.id))}
                                                        size="sm"
                                                    />
                                                </div>
                                                <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 mb-1 group-hover:text-[var(--skin-accent-color)] transition-colors">
                                                    {campaign.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 line-clamp-2">
                                                    {campaign.description || "Sem descrição."}
                                                </p>
                                            </div>
                                            
                                            <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between">
                                                <div className="text-[10px] text-gray-400 font-mono">
                                                    {campaign.arenaIds.length} Arenas
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                                    <ChevronRightIcon className="w-3 h-3 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </Portal>
        );
    }

    // RENDER: DETAIL VIEW
    return (
        <Portal>
             <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                 <GlassCard variant="neutral" className="relative flex max-h-[92vh] w-full max-w-[40rem] flex-col overflow-hidden rounded-[1.45rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),rgba(255,255,255,0.10)_22%,transparent_48%),radial-gradient(circle_at_38%_18%,rgba(255,255,255,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(109,40,217,0.18),transparent_34%),linear-gradient(145deg,rgba(102,109,120,0.98)_0%,rgba(132,139,151,0.95)_26%,rgba(82,88,101,0.94)_48%,rgba(38,33,53,0.96)_78%,rgba(16,11,28,0.99)_100%)]" onClick={e => e.stopPropagation()}>
                     <div
                        className="modal-aura-overlay"
                        style={{ '--modal-aura-color': 'rgba(154, 122, 255, 0.16)' } as React.CSSProperties}
                    />
                     <div
                        className="modal-sheen-overlay"
                        style={{ '--modal-sheen-color': 'rgba(154, 122, 255, 0.50)' } as React.CSSProperties}
                     />
                    {/* Header */}
                    {isPreviewCampaign ? (
                        <div className="shrink-0 border-b border-white/10 bg-black/25 p-2.5">
                            <div className="flex items-start gap-2.5">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[0.95rem] border border-white/10 bg-black/35">
                                    {isProbablyImageUrl(previewMeta?.coverImage) ? (
                                        <img
                                            src={previewMeta?.coverImage}
                                            alt={displayCampaignTitle}
                                            className="absolute inset-0 h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_60%),linear-gradient(180deg,rgba(26,20,12,0.94),rgba(9,8,12,0.98))] text-[1.5rem]">
                                            {previewMeta?.coverImage || '📜'}
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h1
                                                className="text-left font-black uppercase tracking-[0.05em] text-[17px] leading-[0.94] text-[color:var(--skin-accent-color)]"
                                                style={{ overflowWrap: 'anywhere', wordBreak: 'normal' }}
                                            >
                                                {displayCampaignTitle}
                                            </h1>
                                            {previewMeta?.author && (
                                                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/46">
                                                    {previewMeta.author}
                                                </div>
                                            )}
                                        </div>

                                        <button onClick={onClose} className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] luxe-skin-button">
                                            OK
                                        </button>
                                    </div>

                                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/68">
                                        {displayCampaignDescription || 'Sem descrição.'}
                                    </p>

                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/64">
                                            {sortedArenas.length} arenas
                                        </span>
                                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/64">
                                            {previewActionCount} acoes
                                        </span>
                                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/64">
                                            {renderedPhaseRows.filter((row) => row.arenas.length > 0).length} fases
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                    <div className="p-4 border-b border-white/10 shrink-0 bg-black/20">
                        <div className="arena-plate-header flex justify-between items-start gap-1 rounded-xl px-1 py-2 bg-black/20">
                            <div className="flex flex-col items-center gap-1 pl-0.5">
                                {!isReadOnlyCodexCampaign && !isPreviewCampaign && (
                                    <button
                                        onClick={() => setIsEditing((current) => !current)}
                                        className={`p-2 rounded-full transition-colors border border-white/20 ${isEditing ?'bg-white/20' : 'bg-transparent'}`}
                                        title={isEditing ?'Fechar edição' : 'Editar campanha'}
                                    >
                                        <EditIcon className={`w-5 h-5 ${isEditing ?'text-white' : 'text-gray-300'}`} />
                                    </button>
                                )}
                                {!isPreviewCampaign && isEditing && (
                                    <button
                                        onClick={handleDeleteCampaign}
                                        className="p-2 rounded-full transition-colors border border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
                                        title="Excluir campanha"
                                    >
                                        <TrashIcon className="w-5 h-5 text-red-400" />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 px-1 flex flex-col items-center text-center">
                                {isEditing ?(
                                    <div className="w-full max-w-[30rem] space-y-2">
                                        <input
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            className="luxe-title-ornate w-full bg-transparent border-b border-dashed border-white/20 p-1 text-center text-[20px] font-bold uppercase tracking-[0.08em] text-[color:var(--skin-accent-color)] focus:outline-none focus:border-[var(--skin-accent-color)]"
                                            placeholder="Nome da Campanha"
                                            autoFocus
                                        />
                                        <textarea
                                            value={editDescription}
                                            onChange={e => setEditDescription(e.target.value)}
                                            className="w-full resize-none rounded-lg border border-white/10 bg-black/50 p-2 text-center text-sm text-gray-300 focus:outline-none focus:border-[var(--skin-accent-color)]"
                                            rows={2}
                                            placeholder="Descrição..."
                                        />
                                        <div className="flex justify-center gap-2">
                                            <button onClick={handleSaveCampaign} className="luxe-skin-button rounded-xl px-3 py-1 text-xs font-bold">Salvar</button>
                                            <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded hover:bg-white/20">Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-full max-w-[16.75rem] md:max-w-[19rem]">
                                            <h1
                                                className="luxe-title-ornate text-center font-black uppercase tracking-[0.06em] text-[20px] text-[color:var(--skin-accent-color)] leading-[0.92]"
                                                style={{ overflowWrap: 'anywhere', wordBreak: 'normal' }}
                                            >
                                                {displayCampaignTitle}
                                            </h1>
                                        </div>
                                        <div className="relative mt-4 w-full">
                                            <p className={`mx-auto max-w-[34rem] text-center text-sm leading-relaxed text-gray-400 transition-all ${isDescriptionExpanded ?'' : 'line-clamp-2'}`}>
                                                {displayCampaignDescription || 'Sem descrição.'}
                                            </p>
                                            {(displayCampaignDescription && displayCampaignDescription.length > 100) && (
                                                <button
                                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                                    className="mx-auto mt-1 flex items-center gap-1 text-xs font-bold text-[var(--skin-accent-color)] hover:underline"
                                                >
                                                    {isDescriptionExpanded ?'Mostrar menos' : 'Mostrar mais'}
                                                    <ChevronDownIcon className={`w-3 h-3 transition-transform ${isDescriptionExpanded ?'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col items-center gap-1 pr-0.5">
                                <button onClick={onClose} className="px-5 py-2 text-sm font-bold rounded-xl luxe-skin-button">
                                    OK
                                </button>
                                {!isReadOnlyCodexCampaign && !isPreviewCampaign && isEditing && (
                                    <button
                                        onClick={handleAddPhase}
                                        className="p-2 rounded-full transition-colors border border-white/15 bg-black/30 hover:bg-black/40"
                                        title="Adicionar fase"
                                    >
                                        <PlusIcon className="w-4 h-4 accent-text" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Grid Area */}
                    <div className="relative flex-1 overflow-y-auto bg-black/35 p-2.5">
                        {sortedArenas.length === 0 ?(
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <p className="mb-4">Nenhuma arena definida nesta campanha.</p>
                                {!isReadOnlyCodexCampaign && !isPreviewCampaign && (
                                    <button 
                                        onClick={handleCreateFutureArena}
                                        className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm transition-all"
                                    >
                                        + Adicionar Primeira Arena
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                            <div className="rounded-[1.35rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.30),rgba(255,255,255,0.10)_24%,transparent_54%),radial-gradient(circle_at_40%_18%,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(109,40,217,0.16),transparent_34%),linear-gradient(180deg,rgba(177,184,194,0.34)_0%,rgba(121,128,141,0.90)_28%,rgba(74,79,91,0.92)_50%,rgba(38,31,53,0.96)_78%,rgba(12,10,20,0.99)_100%)] px-2.5 pb-2.5 pt-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]">
                                <div className="space-y-2.5">
                                {renderedPhaseRows.map(({ phase, arenas }, phaseIndex) => (
                                    <div
                                        key={phase}
                                        className="space-y-2"
                                        onDragOver={(e) => {
                                            if (!isEditing || isReadOnlyCodexCampaign || isPreviewCampaign) return;
                                            e.preventDefault();
                                        }}
                                        onDrop={() => handleArenaDropIntoPhase(phase)}
                                    >
                                        {(showPhaseHeaders || isEditing) && (
                                            <div className="px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--skin-accent-color)]/80">
                                                Fase {phase + 1}
                                            </div>
                                        )}
                                        <div className={`flex ${isPreviewCampaign ? 'min-h-[5.8rem]' : 'min-h-[7rem]'} gap-2 overflow-x-auto rounded-[1rem] border border-white/6 pb-2 pr-1 hide-scrollbar ${isEditing ?'bg-black/15 p-2' : isPreviewCampaign ? 'bg-black/10 p-1.5' : ''}`}>
                                        {arenas.map((arena) => {
                                            const index = sortedArenas.findIndex(item => item.id === arena.id);
                                    const locked = isArenaLocked(arena.id);
                                    const config = selectedCampaign.arenaConfig?.[arena.id] || {};
                                    const prereqs = config.prerequisiteArenaIds || [];
                                    const isSource = linkingSourceId === arena.id;
                                    const isPrereqOfSource = linkingSourceId && selectedCampaign.arenaConfig?.[linkingSourceId]?.prerequisiteArenaIds?.includes(arena.id);
                                    const isTargetOfSource = linkingSourceId && prereqs.includes(linkingSourceId);
                                    const arenaActions = campaignActionsSource.filter(a => a.arenaId === arena.id);
                                    
                                    // Highlight logic for linking mode
                                    let borderClass = 'border-transparent';
                                    let scaleClass = '';
                                    
                                    if (isLinkingMode) {
                                        if (isSource) {
                                            borderClass = 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.6)]';
                                            scaleClass = 'scale-105 z-10';
                                        }
                                        else if (isTargetOfSource) {
                                            borderClass = 'border-green-500 border-dashed shadow-[0_0_15px_rgba(34,197,94,0.4)]';
                                        }
                                        else if (linkingSourceId) {
                                            borderClass = 'border-white/10 hover:border-blue-300 cursor-pointer';
                                        }
                                    } else {
                                        if (locked) borderClass = 'border-red-500/35';
                                        else if (campaignArenaStates[arena.id]?.isCleared) borderClass = 'border-green-500/30';
                                    }

                                    return (
                                        <div 
                                            key={arena.id} 
                                            className={`relative ${isPreviewCampaign ? 'w-[10rem]' : 'w-[79px]'} flex-shrink-0 transition-all duration-300 group ${scaleClass} ${isPreviewCampaign && previewMeta?.hideArenaDetails ? 'cursor-default' : 'cursor-pointer'}`}
                                            onClick={() => handleArenaClick(arena.id)}
                                            draggable={isEditing && !isReadOnlyCodexCampaign && !isPreviewCampaign}
                                            onDragStart={() => handleArenaDragStart(arena.id)}
                                            onDragEnd={() => setDraggedArenaId(null)}
                                        >
                                            {/* Linking Indicators */}
                                            {isLinkingMode && (
                                                <div className="absolute -top-3 left-0 w-full flex justify-center z-20 pointer-events-none">
                                                    {isSource && <span className="bg-blue-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shadow-lg">Requisito</span>}
                                                    {isTargetOfSource && <span className="bg-green-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shadow-lg">Liberado</span>}
                                                </div>
                                            )}

                                            {/* Main Card Wrapper */}
                                            <div className={`rounded-[1rem] border transition-all duration-300 bg-[linear-gradient(180deg,rgba(100,70,180,0.18),rgba(18,18,18,0.96))] overflow-hidden ${borderClass} relative group`}>
                                                
                                                {/* Floating Controls (Top Right) - Only for custom campaigns */}
                                                {!isReadOnlyCodexCampaign && !isPreviewCampaign && !isLinkingMode && (
                                                    <div className="absolute top-1 right-1 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm rounded-lg p-1 border border-white/10">
                                                        <button 
                                                            onClick={(e) => handleMoveArena(arena.id, 'left', e)}
                                                            disabled={index === 0}
                                                            className="p-1 rounded hover:bg-white/20 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Mover para Esquerda"
                                                        >
                                                            <ChevronLeftIcon className="w-3 h-3" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => handleMoveArena(arena.id, 'right', e)}
                                                            disabled={index === sortedArenas.length - 1}
                                                            className="p-1 rounded hover:bg-white/20 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Mover para Direita"
                                                        >
                                                            <ChevronRightIcon className="w-3 h-3" />
                                                        </button>
                                                        <div className="w-px h-3 bg-white/20 mx-0.5" />
                                                        <button 
                                                            onClick={(e) => handleRemoveArena(arena.id, e)}
                                                            className="p-1 rounded hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
                                                            title="Remover da Campanha"
                                                        >
                                                            <TrashIcon className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Status Header Overlay */}
                                                {(locked || campaignArenaStates[arena.id]?.isCleared) && !isLinkingMode && (
                                                    <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${
                                                        locked ?'bg-red-500' : 'bg-green-500'
                                                    }`} />
                                                )}
                                                
                                                {/* Locked Overlay with Padlock */}
                                                {locked && !isLinkingMode && (
                                                    <div className="absolute left-2 top-2 z-20 pointer-events-none">
                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-red-500/35 bg-black/70 shadow-lg backdrop-blur-sm">
                                                            <LockIcon className="w-3.5 h-3.5 text-red-300" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Mini Arena Card Content */}
                                                <div className={`${(isLinkingMode) ?'pointer-events-none' : ''}`}>
                                                    {isPreviewCampaign ? (
                                                        <PreviewArenaMiniCard arena={arena} actions={arenaActions} />
                                                    ) : (
                                                        <div className="h-[6.15rem] w-full rounded-[0.95rem] bg-[linear-gradient(180deg,rgba(91,65,167,0.24),rgba(20,20,20,0.45))]">
                                                            <ArenaCard 
                                                                arena={arena}
                                                                actions={arenaActions}
                                                                variant="compact" 
                                                                onClick={() => {}}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer Controls / Prerequisites */}
                                                {!isReadOnlyCodexCampaign && prereqs.length > 0 && (
                                                    <div className="p-1.5 bg-black/80 border-t border-white/5 flex items-center justify-center min-h-[24px]">
                                                        {/* Dependencies */}
                                                        <div className="flex flex-wrap gap-1 justify-center w-full">
                                                            {prereqs.map(pid => {
                                                                const pArena = campaignArenasSource.find(a => a.id === pid);
                                                                const pCleared = campaignArenaStates[pid]?.isCleared;
                                                                return (
                                                                    <div key={pid} className={`px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[8px] font-bold border ${
                                                                        pCleared 
                                                                            ?'bg-green-900/40 border-green-500/50 text-green-400 opacity-50' 
                                                                            : 'bg-red-900/40 border-red-500/50 text-red-400'
                                                                    }`} title={`Requer: ${pArena?.name}`}>
                                                                        <LinkIcon className="w-2.5 h-2.5" />
                                                                        <span className="max-w-[60px] truncate">{pArena?.name}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                        })}
                                        {arenas.length === 0 && isEditing && (
                                            <div className="flex min-h-[5.8rem] flex-1 items-center justify-center rounded-[0.9rem] border border-dashed border-white/10 bg-black/15 px-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                                                Solte uma arena aqui
                                            </div>
                                        )}
                                        {!isReadOnlyCodexCampaign && !isPreviewCampaign && phaseIndex === renderedPhaseRows.length - 1 && (
                                            <div className="flex min-h-[5.8rem] items-end justify-end self-stretch pb-1 pr-1">
                                                <button
                                                    onClick={handleCreateFutureArena}
                                                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full luxe-skin-button shadow-lg shadow-black/30"
                                                    title="Adicionar Arena"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                            <div className="px-1 pt-3">
                                <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--skin-accent-color)]">
                                    {selectedCampaignProgress}%
                                </div>
                                <div className="h-[5px] w-full overflow-hidden rounded-full border border-white/10 bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-[var(--skin-accent-color)] transition-all duration-300"
                                        style={{ width: `${selectedCampaignProgress}%` }}
                                    />
                                </div>
                            </div>
                            </>
                        )}
                    </div>

                    {isCreatingArena && (
                        <NewArenaModal 
                            isOpen={true}
                            onClose={() => setIsCreatingArena(false)} 
                            onArenaCreated={onArenaCreated}
                        />
                    )}
                    
                    {selectedArena && !(isPreviewCampaign && previewMeta?.hideArenaDetails) && (
                        <ArenaDetailModal 
                            arena={selectedArena}
                            onClose={() => setSelectedArenaId(null)}
                        />
                    )}
                </GlassCard>
            </div>
        </Portal>
    );
};



