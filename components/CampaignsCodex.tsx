import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { useRef } from 'react';
import { Action, Arena, Campaign } from '../types';
import { PlusIcon, LockIcon, TrashIcon, EditIcon, LinkIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, LightbulbIcon } from './Icons';
import { ArenaCard } from './ArenaCard';
import { NewArenaModal } from './NewArenaModal';
import { ArenaDetailModal } from './ArenaDetailModal';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';
import { CampaignArenaStack } from './CampaignArenaStack';
import { CreateCampaignModal } from './CreateCampaignModal';
import { calculateCampaignProgressSummary, getCampaignArenaStates } from '../utils/progressUtils';
import { buildCodexCampaignPreview, type CodexCampaignPreview } from '../utils/codexPreview';
import { getContentVisualPalette, resolveCampaignVisualFamily } from '../utils/contentCardVisuals';
import { UserCodex } from '../types';
import { CodexCoverArt as SharedCodexCoverArt } from './CodexCoverArt';
import { CampaignRecommendationQuizModal } from './Store/CampaignRecommendationQuizModal';
import { hasCompletedFreeCampaignQuiz } from '../utils/campaignQuiz';
import { filterTasksAfterFreeProgressReset } from '../utils/freeProgressScope';

interface CampaignsCodexProps {
    onClose: () => void;
    initialCampaignId?: string | null;
    previewCampaign?: Campaign | null;
    previewArenas?: Arena[];
    previewActions?: Action[];
    previewEditable?: boolean;
    autoOpenRecommendationQuiz?: boolean;
    onDeletePreviewCampaign?: (() => void | Promise<void>) | null;
    onUpdatePreviewCampaign?: ((payload: {
        title: string;
        description: string;
        arenas: Arena[];
        actions: Action[];
        campaign: Campaign;
    }) => Promise<boolean | void>) | null;
    previewMeta?: {
        coverImage?: string;
        badgeLabel?: string;
        author?: string;
        note?: string;
        hideArenaDetails?: boolean;
        installLabel?: string;
        installDisabled?: boolean;
        onInstall?: (() => void | Promise<void>) | null;
    };
}

const isProbablyImageUrl = (value?: string | null) => {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('/') || normalized.startsWith('data:image/');
};

const PreviewArenaMiniCard: React.FC<{ arena: Arena; actions: Action[] }> = ({ arena, actions }) => (
    <div className="h-[4.95rem] w-[11rem] flex-shrink-0">
        <ArenaCard
            arena={arena}
            actions={actions}
            tasks={[]}
            onClick={() => {}}
            variant="compact"
        />
    </div>
);

const CompactCampaignFolderTile: React.FC<{
    title: string;
    arenas: Arena[];
    actions: Action[];
    onClick: () => void;
    visualPalette: ReturnType<typeof getContentVisualPalette>;
    sourceLabel?: string | null;
    footerLabel?: string | null;
    installed?: boolean;
    badgeLabel?: string | null;
}> = ({
    title,
    arenas,
    actions,
    onClick,
    visualPalette,
    sourceLabel,
    footerLabel,
    installed = false,
    badgeLabel = null,
}) => (
    <button
        type="button"
        onClick={onClick}
        className="group relative aspect-[4/3] w-full overflow-hidden rounded-[1.2rem] border text-left transition-all duration-200 hover:-translate-y-0.5"
        style={{
            borderColor: visualPalette.border,
            background: visualPalette.listBackground,
            boxShadow: `0 12px 24px ${visualPalette.glow}`,
        }}
    >
        <div className="absolute left-0 top-0 h-1 w-[38%]" style={{ background: visualPalette.accent }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_48%)]" />
        <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-2 px-3 pb-1 pt-3">
                <div className="min-w-0 flex items-start gap-2">
                    <span
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px]"
                        style={{
                            borderColor: visualPalette.border,
                            background: `linear-gradient(160deg, ${visualPalette.chipBackground} 0%, rgba(0,0,0,0.18) 100%)`,
                        }}
                    >
                        {'\u{1F4C1}'}
                    </span>
                    <div className="min-w-0">
                        {badgeLabel ? (
                            <div className="mb-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
                                {badgeLabel}
                            </div>
                        ) : null}
                        <div className="line-clamp-2 text-[11px] font-black uppercase leading-[1.02] tracking-[0.06em] text-white">
                            {title}
                        </div>
                    </div>
                </div>
                {sourceLabel ? (
                    <span
                        className="inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em]"
                        style={{
                            borderColor: visualPalette.chipBorder,
                            background: visualPalette.chipBackground,
                            color: visualPalette.chipText,
                        }}
                    >
                        {sourceLabel}
                    </span>
                ) : null}
            </div>

            <div className="flex-1 px-3 py-2">
                <div
                    className="flex h-full items-center justify-center rounded-[1rem] border px-2 py-2"
                    style={{
                        borderColor: visualPalette.chipBorder,
                        background: visualPalette.stackBackground,
                    }}
                >
                    <CampaignArenaStack arenas={arenas} actions={actions} size="sm" />
                </div>
            </div>

            <div
                className="flex items-center justify-between gap-2 border-t px-3 py-2"
                style={{
                    borderTopColor: visualPalette.chipBorder,
                    background: visualPalette.footerBackground,
                }}
            >
                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-white/56">
                    {footerLabel || `${arenas.length} arenas`}
                </div>
                {installed ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-400/26 bg-emerald-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-200">
                        Instalada
                    </span>
                ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/70 transition-all group-hover:bg-white/12">
                        <ChevronRightIcon className="h-3 w-3" />
                    </span>
                )}
            </div>
        </div>
    </button>
);

const getCampaignSourceLabel = (codex: UserCodex | null | undefined) => {
    if (!codex) return 'Minha';
    if (codex.mentor_relationship_link_id) return 'Recebida';
    if (codex.source_type === 'gift_link' || codex.source_type === 'gift_in_app') return 'Recebida';
    if (codex.source_type === 'catalog') return 'Loja';
    return 'Meu codex';
};

export const CampaignsCodex: React.FC<CampaignsCodexProps> = ({
    onClose,
    initialCampaignId,
    previewCampaign,
    previewArenas = [],
    previewActions = [],
    previewEditable = false,
    autoOpenRecommendationQuiz = false,
    onDeletePreviewCampaign = null,
    onUpdatePreviewCampaign = null,
    previewMeta,
}) => {
    const { campaigns, getArenas, actions, tasks, activeCycle, freeProgressResetAt, updateCampaign, deleteCampaign, getClanQuestsForArena, getClanQuestProgress, getSharedActionPoolProgress, userCodexes, userProfile, installCodex, showToast } = useGame();
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampaignId || null);
    const [isCreatingArena, setIsCreatingArena] = useState(false);
    const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
    const [isAttachArenaModalOpen, setIsAttachArenaModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);
    
    const [draggedArenaId, setDraggedArenaId] = useState<string | null>(null);
    const [isLinkingMode] = useState(false);
    const [linkingSourceId] = useState<string | null>(null);
    const [visiblePhaseCount, setVisiblePhaseCount] = useState(1);
    const [libraryPreview, setLibraryPreview] = useState<CodexCampaignPreview | null>(null);
    const [libraryPreviewCodex, setLibraryPreviewCodex] = useState<UserCodex | null>(null);
    const [isRecommendationQuizOpen, setRecommendationQuizOpen] = useState(false);
    const autoOpenedRecommendationQuizRef = useRef(false);

    // Expandable Description State
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [localPreviewCampaign, setLocalPreviewCampaign] = useState<Campaign | null>(previewCampaign);
    const [localPreviewArenas, setLocalPreviewArenas] = useState<Arena[]>(previewArenas);
    const [localPreviewActions, setLocalPreviewActions] = useState<Action[]>(previewActions);

    useEffect(() => {
        setLocalPreviewCampaign(previewCampaign);
        setLocalPreviewArenas(previewArenas);
        setLocalPreviewActions(previewActions);
    }, [previewActions, previewArenas, previewCampaign]);

    useEffect(() => {
        if (!autoOpenRecommendationQuiz || autoOpenedRecommendationQuizRef.current) return;
        autoOpenedRecommendationQuizRef.current = true;
        setRecommendationQuizOpen(true);
    }, [autoOpenRecommendationQuiz]);

    const handleOpenCampaignStore = () => {
        window.dispatchEvent(new CustomEvent('navigate-to-store', { detail: { tab: 'codexes' } }));
        onClose();
    };

    const allArenas = getArenas();
    const arenaById = useMemo(
        () => new Map(allArenas.map((arena) => [arena.id, arena] as const)),
        [allArenas],
    );
    const codexById = useMemo(
        () => new Map(userCodexes.map((codex) => [codex.id, codex] as const)),
        [userCodexes],
    );
    const installedCodexIds = useMemo(
        () => new Set(allArenas.map((arena) => arena.originCodexId).filter(Boolean)),
        [allArenas],
    );
    const libraryEntries = useMemo(() => (
        userCodexes
            .filter((codex) => Array.isArray(codex.template?.levels) && codex.template.levels.length > 0)
            .sort((left, right) => {
                const leftInstalled = installedCodexIds.has(left.id);
                const rightInstalled = installedCodexIds.has(right.id);
                if (leftInstalled !== rightInstalled) {
                    return leftInstalled ? 1 : -1;
                }
                return new Date(right.updated_at || right.created_at).getTime() - new Date(left.updated_at || left.created_at).getTime();
            })
            .map((codex) => {
                const preview = buildCodexCampaignPreview(codex.id, codex.template);
                const sourceLabel = getCampaignSourceLabel(codex);
                const isInstalled = installedCodexIds.has(codex.id);
                const visualPalette = getContentVisualPalette(resolveCampaignVisualFamily({
                    campaign: preview.campaign,
                    arenas: preview.arenas,
                    relationshipLinkType: codex.mentor_relationship_link_id ? 'mentoria' : null,
                    sourceCodex: codex,
                }));

                return {
                    codex,
                    preview,
                    arenaCount: preview.arenas.length,
                    sourceLabel,
                    isInstalled,
                    visualPalette,
                };
            })
    ), [installedCodexIds, userCodexes]);
    const readyToInstallLibraryCount = useMemo(
        () => libraryEntries.filter((entry) => !entry.isInstalled).length,
        [libraryEntries],
    );
    const hasOwnedFreeCampaign = useMemo(
        () => libraryEntries.some((entry) => Number(entry.codex.price || 0) <= 0),
        [libraryEntries],
    );
    const hasPendingFreeQuiz = !hasCompletedFreeCampaignQuiz() && !hasOwnedFreeCampaign;
    const campaignQuizFreeCredits = Math.max(0, Number(userProfile.campaignQuizFreeCredits || 0));
    const campaignQuizMediumCredits = Math.max(0, Number(userProfile.campaignQuizMediumCredits || 0));
    const totalQuizCredits = campaignQuizFreeCredits + campaignQuizMediumCredits;
    const quizButtonLabel = hasPendingFreeQuiz
        ? 'Quiz grátis'
        : campaignQuizFreeCredits > 0
            ? 'Ficha grátis'
            : campaignQuizMediumCredits > 0
                ? 'Ficha média'
                : 'Quiz';
    const quizButtonBadgeLabel = totalQuizCredits > 0 ? String(totalQuizCredits) : null;
    const quizHelperLabel = hasPendingFreeQuiz
        ? 'Libera sua primeira campanha guiada'
        : campaignQuizFreeCredits > 0
            ? 'Usa sua ficha grátis para recomendar e liberar'
            : campaignQuizMediumCredits > 0
                ? 'Usa sua ficha média para recomendar e liberar'
                : 'Responde e o sistema aponta a campanha certa';
    const handleInstallLibraryCampaign = async (codex: UserCodex) => {
        if (installedCodexIds.has(codex.id)) {
            showToast('Essa campanha ja esta instalada nas suas campanhas.', 'info');
            return;
        }

        await installCodex(codex.id);
    };
    const handlePreviewLibraryCampaign = (codex: UserCodex) => {
        setLibraryPreviewCodex(codex);
        setLibraryPreview(buildCodexCampaignPreview(codex.id, codex.template));
    };
    const effectivePreviewCampaign: Campaign | null = localPreviewCampaign
        ? {
            ...localPreviewCampaign,
            order: localPreviewCampaign.order ?? -1,
            priorityOrder: localPreviewCampaign.priorityOrder ?? -1,
        }
        : null;
    const validCampaigns = campaigns.filter(Boolean);
    const allCampaignArenaIds = useMemo(
        () => validCampaigns.flatMap((campaign) => campaign.arenaIds),
        [validCampaigns],
    );
    const allCampaignArenaIdSet = useMemo(
        () => new Set(allCampaignArenaIds),
        [allCampaignArenaIds],
    );
    const visibleCampaigns = effectivePreviewCampaign
        ? [effectivePreviewCampaign, ...validCampaigns.filter((campaign) => campaign.id !== effectivePreviewCampaign.id)]
        : validCampaigns;
    const selectedCampaign = selectedCampaignId ? visibleCampaigns.find(c => c.id === selectedCampaignId) : null;
    const isPreviewCampaign = selectedCampaignId === effectivePreviewCampaign?.id;
    const campaignArenasSource = isPreviewCampaign ? localPreviewArenas : allArenas;
    const campaignActionsSource = isPreviewCampaign ? localPreviewActions : actions;
    const cycleScopedTasks = useMemo(() => {
        if (isPreviewCampaign) return [] as typeof tasks;
        if (!activeCycle) return filterTasksAfterFreeProgressReset(tasks, freeProgressResetAt);
        return tasks.filter(task => task.date >= activeCycle.startDate && task.date <= activeCycle.endDate);
    }, [activeCycle, freeProgressResetAt, isPreviewCampaign, tasks]);
    
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

    // Identify source-based campaigns
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
    const canDeletePreviewCampaign = isPreviewCampaign && typeof onDeletePreviewCampaign === 'function';
    const canEditPreviewCampaign = isPreviewCampaign && previewEditable && typeof onUpdatePreviewCampaign === 'function';
    const canEditCampaignMetadata = isPreviewCampaign ? canEditPreviewCampaign : true;
    const canEditCampaignStructure = isPreviewCampaign ? canEditPreviewCampaign : (canEditCampaignMetadata && !isReadOnlyCodexCampaign);
    const availableArenaIdsForNewCampaign = useMemo(
        () => allArenas
            .filter((arena) => !allCampaignArenaIdSet.has(arena.id))
            .map((arena) => arena.id),
        [allArenas, allCampaignArenaIdSet],
    );
    const attachableArenaIds = useMemo(() => {
        if (!selectedCampaign) return [];
        return allArenas
            .filter((arena) => !allCampaignArenaIdSet.has(arena.id) || selectedCampaign.arenaIds.includes(arena.id))
            .filter((arena) => !selectedCampaign.arenaIds.includes(arena.id))
            .map((arena) => arena.id);
    }, [allArenas, allCampaignArenaIdSet, selectedCampaign]);

    const handleCreateCampaign = () => {
        setIsCreateCampaignModalOpen(true);
    };

    const handleSaveCampaign = async () => {
        if (!selectedCampaign) return;
        if (isPreviewCampaign) {
            if (!canEditPreviewCampaign) return;
            const saved = await Promise.resolve(onUpdatePreviewCampaign?.({
                title: editTitle,
                description: editDescription,
                arenas: localPreviewArenas,
                actions: localPreviewActions,
                campaign: {
                    ...selectedCampaign,
                    title: editTitle,
                    description: editDescription,
                },
            }));
            if (saved !== false) {
                setLocalPreviewCampaign((prev) => prev ? { ...prev, title: editTitle, description: editDescription } : prev);
                setIsEditing(false);
            }
            return;
        }
        const saved = await updateCampaign(selectedCampaign.id, {
            title: editTitle,
            description: editDescription
        });
        if (saved) {
            setIsEditing(false);
        }
    };

    const handleDeleteCampaign = async () => {
        if (!selectedCampaign) return;

        if (canDeletePreviewCampaign) {
            if (confirm('Tem certeza que deseja remover esta campanha deste vínculo? Isso não pode ser desfeito.')) {
                await Promise.resolve(onDeletePreviewCampaign?.());
                onClose();
            }
            return;
        }

        if (isPreviewCampaign || isReadOnlyCodexCampaign) return;
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
            tasks: cycleScopedTasks,
            getClanQuestsForArena,
            getClanQuestProgress,
            getSharedActionPoolProgress,
        });
    }, [selectedCampaign, campaignArenasSource, campaignActionsSource, cycleScopedTasks, getClanQuestsForArena, getClanQuestProgress, getSharedActionPoolProgress]);
    const selectedCampaignProgressSummary = useMemo(() => {
        if (!selectedCampaign) {
            return {
                progressPercent: 0,
                totalCompleted: 0,
                totalPlanned: 0,
                clearedArenaCount: 0,
                totalArenaCount: 0,
            };
        }
        const arenasById = Object.fromEntries(campaignArenasSource.map(arena => [arena.id, arena]));
        const actionsByArena = Object.fromEntries(campaignArenasSource.map(arena => [arena.id, campaignActionsSource.filter(action => action.arenaId === arena.id)]));

        return calculateCampaignProgressSummary({
            campaign: selectedCampaign,
            arenasById,
            actionsByArena,
            tasks: cycleScopedTasks,
            getClanQuestsForArena,
            getClanQuestProgress,
            getSharedActionPoolProgress,
        });
    }, [selectedCampaign, campaignArenasSource, campaignActionsSource, cycleScopedTasks, getClanQuestsForArena, getClanQuestProgress, getSharedActionPoolProgress]);
    const selectedCampaignProgress = selectedCampaignProgressSummary.progressPercent;
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
        if (!selectedCampaign) return;
        
        if (!canEditCampaignStructure || (isReadOnlyCodexCampaign && !isPreviewCampaign)) {
            alert("Campanha recebida fica protegida e nao pode ser remodelada.");
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

            if (isPreviewCampaign) {
                setLocalPreviewCampaign((prev) => prev ? {
                    ...prev,
                    arenaIds: newArenaIds,
                    arenaConfig: newConfig,
                } : prev);
                setLocalPreviewArenas((prev) => prev.filter((arena) => arena.id !== arenaId));
                setLocalPreviewActions((prev) => prev.filter((action) => action.arenaId !== arenaId));
                if (selectedArenaId === arenaId) {
                    setSelectedArenaId(null);
                }
            } else {
                updateCampaign(selectedCampaign.id, {
                    arenaIds: newArenaIds,
                    arenaConfig: newConfig
                });
            }
        }
    };

    const handleMoveArena = (arenaId: string, direction: 'left' | 'right', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedCampaign || !canEditCampaignStructure) return;
        if (isReadOnlyCodexCampaign && !isPreviewCampaign) return;
        
        const currentIds = [...selectedCampaign.arenaIds];
        const currentIndex = currentIds.indexOf(arenaId);
        if (currentIndex === -1) return;
        
        const newIndex = direction === 'left' ?currentIndex - 1 : currentIndex + 1;
        
        if (newIndex >= 0 && newIndex < currentIds.length) {
            [currentIds[currentIndex], currentIds[newIndex]] = [currentIds[newIndex], currentIds[currentIndex]];
            if (isPreviewCampaign) {
                setLocalPreviewCampaign((prev) => prev ? { ...prev, arenaIds: currentIds } : prev);
            } else {
                updateCampaign(selectedCampaign.id, { arenaIds: currentIds });
            }
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
        if (!selectedCampaign || !canEditCampaignStructure) return;
        const assignments = getPhaseAssignments();
        assignments[arenaId] = Math.max(0, Math.min(4, targetPhase));
        const config = buildArenaConfigFromPhases(assignments);
        if (isPreviewCampaign) {
            setLocalPreviewCampaign((prev) => prev ? { ...prev, arenaConfig: config } : prev);
        } else {
            updateCampaign(selectedCampaign.id, { arenaConfig: config });
        }
        setVisiblePhaseCount((current) => Math.max(current, Math.min(5, targetPhase + 1)));
    };

    const handleArenaDragStart = (arenaId: string) => {
        if (!isEditing || !canEditCampaignStructure) return;
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
        if (!canEditCampaignStructure) return;
        setIsCreatingArena(true);
    };
    const handleAttachExistingArenas = () => {
        if (!canEditCampaignStructure || !selectedCampaign) return;
        setIsAttachArenaModalOpen(true);
    };

    const onArenaCreated = (newArena: Arena) => {
        if (!selectedCampaign) return;
        
        if (isPreviewCampaign) {
            setLocalPreviewCampaign((prev) => prev ? {
                ...prev,
                arenaIds: [...prev.arenaIds, newArena.id],
                arenaConfig: {
                    ...(prev.arenaConfig || {}),
                    [newArena.id]: {
                        isLocked: false,
                        isHidden: false
                    }
                }
            } : prev);
            setLocalPreviewArenas((prev) => [...prev, newArena]);
        } else {
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
        }
        setIsCreatingArena(false);
    };

    const selectedArena = selectedArenaId ?campaignArenasSource.find(a => a.id === selectedArenaId) : null;
    const selectedArenaActions = useMemo(
        () => selectedArenaId ? campaignActionsSource.filter((entry) => entry.arenaId === selectedArenaId) : [],
        [campaignActionsSource, selectedArenaId]
    );
    const selectedArenaTasks = useMemo(() => {
        if (!selectedArenaId || isPreviewCampaign) return [];
        const actionIds = new Set(selectedArenaActions.map((entry) => entry.id));
        return cycleScopedTasks.filter((task) => actionIds.has(task.actionId));
    }, [cycleScopedTasks, isPreviewCampaign, selectedArenaActions, selectedArenaId]);
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
                <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                    <GlassCard variant="neutral" className="dossier-bg relative flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.7rem] border border-[color:var(--skin-accent-color)]/16 shadow-2xl shadow-black/60" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-white/10 bg-black/20 px-4 pb-4 pt-3">
                            <div className="relative flex min-h-[2.75rem] items-center justify-center">
                                <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
                                    Campanhas
                                </h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="luxe-skin-button absolute right-0 top-1/2 inline-flex h-10 min-w-[3.5rem] -translate-y-1/2 items-center justify-center rounded-2xl px-4 text-[11px] font-black uppercase tracking-[0.16em]"
                                >
                                    OK
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setRecommendationQuizOpen(true);
                                    }}
                                    className={`relative inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
                                        hasPendingFreeQuiz
                                            ? 'border border-[var(--skin-accent-color)]/30 bg-[var(--skin-accent-color)]/16 text-[var(--ui-text-accent)] shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:border-[var(--skin-accent-color)]/45 hover:bg-[var(--skin-accent-color)]/22'
                                            : 'border border-[var(--skin-accent-color)]/22 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)] hover:border-[var(--skin-accent-color)]/38 hover:bg-[var(--skin-accent-color)]/16'
                                    }`}
                                >
                                    <LightbulbIcon className="h-3.5 w-3.5" />
                                    <span>{quizButtonLabel}</span>
                                    {quizButtonBadgeLabel ? (
                                        <span className="absolute -right-1 -top-1 rounded-full border border-[var(--skin-accent-color)]/20 bg-black/85 px-1.5 py-0.5 text-[8px] font-black leading-none text-white">
                                            {quizButtonBadgeLabel}
                                        </span>
                                    ) : null}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleOpenCampaignStore}
                                    className="inline-flex min-h-[42px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/86 transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/10"
                                >
                                    Loja
                                </button>
                            </div>
                            <div className="mt-2 text-center text-[10px] text-white/48">
                                {quizHelperLabel}
                            </div>
                        </div>
                        
                        <div className="overflow-y-auto p-4">
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <div className="flex items-end justify-between gap-3">
                                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Ativas</div>
                                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
                                            {visibleCampaigns.length} em uso
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                        <button
                                            onClick={handleCreateCampaign}
                                            className="group aspect-[4/3] rounded-[1.2rem] border-2 border-dashed border-white/10 bg-white/[0.02] transition-all hover:border-[var(--skin-accent-color)] hover:bg-white/5"
                                        >
                                            <div className="flex h-full flex-col items-center justify-center gap-2">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all group-hover:border-[var(--skin-accent-color)]/40 group-hover:bg-[var(--skin-accent-color)]/16">
                                                    <PlusIcon className="h-5 w-5" />
                                                </div>
                                                <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white/62 transition-colors group-hover:text-white">
                                                    Nova campanha
                                                </span>
                                            </div>
                                        </button>

                                        {visibleCampaigns.map((campaign) => {
                                            const campaignArenas = campaign.arenaIds
                                                .map((arenaId) => (campaignArenasSource === allArenas ? arenaById.get(arenaId) : campaignArenasSource.find((arena) => arena.id === arenaId)))
                                                .filter((arena): arena is Arena => Boolean(arena));
                                            const sourceCodex = campaignArenas
                                                .map((arena) => arena.originCodexId ? codexById.get(arena.originCodexId) ?? null : null)
                                                .find(Boolean) || null;
                                            const sourceLabel = getCampaignSourceLabel(sourceCodex);
                                            const visualPalette = getContentVisualPalette(resolveCampaignVisualFamily({
                                                campaign,
                                                arenas: campaignArenas,
                                                sourceCodex,
                                            }));

                                            return (
                                                <CompactCampaignFolderTile
                                                    key={campaign.id}
                                                    title={campaign.title}
                                                    arenas={campaignArenas}
                                                    actions={campaignActionsSource}
                                                    onClick={() => setSelectedCampaignId(campaign.id)}
                                                    visualPalette={visualPalette}
                                                    sourceLabel={sourceLabel}
                                                    footerLabel={`${campaign.arenaIds.length} arenas`}
                                                    badgeLabel={campaign.id === effectivePreviewCampaign?.id ? (previewMeta?.badgeLabel || 'Preview') : null}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {libraryEntries.length > 0 && (
                                    <div className="space-y-3 border-t border-white/8 pt-4">
                                        <div className="flex items-end justify-between gap-3">
                                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Biblioteca</div>
                                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
                                                {readyToInstallLibraryCount > 0 ? `${readyToInstallLibraryCount} prontas` : 'Todas instaladas'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                                            {libraryEntries.map(({ codex, preview, arenaCount, sourceLabel, isInstalled, visualPalette }) => (
                                                <CompactCampaignFolderTile
                                                    key={`library-${codex.id}`}
                                                    title={codex.name}
                                                    arenas={preview.arenas}
                                                    actions={preview.actions}
                                                    onClick={() => handlePreviewLibraryCampaign(codex)}
                                                    visualPalette={visualPalette}
                                                    sourceLabel={sourceLabel}
                                                    footerLabel={`${arenaCount} arenas`}
                                                    installed={isInstalled}
                                                    badgeLabel="Biblioteca"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </GlassCard>
                    {isCreateCampaignModalOpen && (
                        <CreateCampaignModal
                            availableArenaIds={availableArenaIdsForNewCampaign}
                            onClose={() => setIsCreateCampaignModalOpen(false)}
                            onCreated={(campaign) => {
                                setSelectedCampaignId(campaign.id);
                                setIsEditing(campaign.arenaIds.length === 0);
                                setIsCreateCampaignModalOpen(false);
                            }}
                        />
                    )}
                    {isRecommendationQuizOpen && (
                        <CampaignRecommendationQuizModal onClose={() => setRecommendationQuizOpen(false)} />
                    )}
                </div>
            </Portal>
        );
    }

    // RENDER: DETAIL VIEW
    return (
        <Portal>
                <div className="fixed inset-0 z-[230] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                 <GlassCard variant="neutral" className="dossier-bg relative flex max-h-[92vh] w-full max-w-[40rem] flex-col overflow-hidden rounded-[1.45rem] border border-[color:var(--skin-accent-color)]/18 shadow-2xl shadow-black/70" onClick={e => e.stopPropagation()}>
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
                        <div className="shrink-0 border-b border-white/10 bg-black/25 p-3">
                            <div className="flex items-start gap-2.5">
                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[0.95rem] border border-white/10 bg-black/35">
                                    <SharedCodexCoverArt
                                        cover={previewMeta?.coverImage}
                                        title={displayCampaignTitle}
                                        emojiSize="cover-sm"
                                        backgroundClassName="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_60%),linear-gradient(180deg,rgba(26,20,12,0.94),rgba(9,8,12,0.98))]"
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="mb-1 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/62">
                                                {previewMeta?.badgeLabel || 'Campanha'}
                                            </div>
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

                                        <div className="flex shrink-0 items-center gap-2">
                                            {canDeletePreviewCampaign && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing((current) => !current)}
                                                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${isEditing ? 'border-white/18 bg-white/12 text-white' : 'border-white/10 bg-white/5 text-white/78 hover:border-[var(--skin-accent-color)]/35 hover:bg-white/10 hover:text-white'}`}
                                                    title={isEditing ? 'Fechar edição' : 'Editar campanha'}
                                                >
                                                    <EditIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                            {canDeletePreviewCampaign && isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => { void handleDeleteCampaign(); }}
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/18 bg-red-500/10 text-red-200 transition-all hover:bg-red-500/18"
                                                    title="Remover campanha deste vínculo"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                            {previewMeta?.onInstall && (
                                                <button
                                                    type="button"
                                                    onClick={() => { void previewMeta.onInstall?.(); }}
                                                    disabled={previewMeta.installDisabled}
                                                    className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${
                                                        previewMeta.installDisabled
                                                            ? 'border border-emerald-400/24 bg-emerald-500/10 text-emerald-200/82'
                                                            : 'luxe-skin-button'
                                                    }`}
                                                >
                                                    {previewMeta.installLabel || 'Instalar'}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleOpenCampaignStore}
                                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/82 transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/10"
                                            >
                                                Loja
                                            </button>
                                            <button onClick={onClose} className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] luxe-skin-button">
                                                OK
                                            </button>
                                        </div>
                                    </div>

                                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/68">
                                        {displayCampaignDescription || 'Sem descrição.'}
                                    </p>

                                    {previewMeta?.note && (
                                        <div className="mt-1.5 rounded-xl border border-white/8 bg-white/5 px-2.5 py-2 text-[10px] leading-relaxed text-white/62">
                                            {previewMeta.note}
                                        </div>
                                    )}

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
                                {canEditCampaignMetadata && (
                                    <button
                                        onClick={() => setIsEditing((current) => !current)}
                                        className={`p-2 rounded-full transition-colors border border-white/20 ${isEditing ?'bg-white/20' : 'bg-transparent'}`}
                                        title={isEditing ?'Fechar edição' : 'Editar campanha'}
                                    >
                                        <EditIcon className={`w-5 h-5 ${isEditing ?'text-white' : 'text-gray-300'}`} />
                                    </button>
                                )}
                                {canEditCampaignStructure && isEditing && (
                                    <button
                                        onClick={() => { void handleDeleteCampaign(); }}
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
                                        {!canEditCampaignStructure && (
                                            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-[11px] leading-relaxed text-white/70">
                                                Campanha recebida aceita so ajustes locais de nome e descricao. Fases, arenas e ordem continuam protegidas.
                                            </div>
                                        )}
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
                                <button
                                    type="button"
                                    onClick={handleOpenCampaignStore}
                                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/82 transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/10"
                                >
                                    Loja
                                </button>
                                <button onClick={onClose} className="px-5 py-2 text-sm font-bold rounded-xl luxe-skin-button">
                                    OK
                                </button>
                                {canEditCampaignStructure && isEditing && (
                                    <button
                                        type="button"
                                        onClick={handleAttachExistingArenas}
                                        disabled={attachableArenaIds.length === 0}
                                        className="inline-flex items-center gap-1 rounded-xl border border-white/12 bg-white/6 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/78 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                        title={attachableArenaIds.length === 0 ? 'Nenhuma arena livre para anexar' : 'Escolher arenas existentes'}
                                    >
                                        <LinkIcon className="h-3.5 w-3.5" />
                                        <span>Arenas</span>
                                    </button>
                                )}
                                {canEditCampaignStructure && isEditing && (
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
                                {canEditCampaignStructure && (
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        <button 
                                            onClick={handleAttachExistingArenas}
                                            disabled={attachableArenaIds.length === 0}
                                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <LinkIcon className="h-4 w-4" />
                                            <span>Escolher arenas</span>
                                        </button>
                                        <button 
                                            onClick={handleCreateFutureArena}
                                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm transition-all hover:bg-white/5"
                                        >
                                            <PlusIcon className="h-4 w-4" />
                                            <span>Nova arena</span>
                                        </button>
                                    </div>
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
                                                {`Fase ${phase + 1}`}
                                            </div>
                                        )}
                                        <div className={`flex ${isPreviewCampaign ? 'min-h-[6.9rem]' : 'min-h-[7.1rem]'} gap-3 overflow-x-auto rounded-[1rem] border border-white/6 pb-2 pr-1 hide-scrollbar ${isEditing ?'bg-black/15 p-2' : isPreviewCampaign ? 'bg-black/10 p-1.5' : ''}`}>
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
                                            className={`relative w-[11rem] flex-shrink-0 transition-all duration-300 group ${scaleClass} ${isPreviewCampaign && previewMeta?.hideArenaDetails ? 'cursor-default' : 'cursor-pointer'}`}
                                            onClick={() => handleArenaClick(arena.id)}
                                            draggable={isEditing && canEditCampaignStructure}
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

                                            <div className="relative">
                                                
                                                {/* Floating Controls (Top Right) - Only for custom campaigns */}
                                                {canEditCampaignStructure && isEditing && !isLinkingMode && (
                                                    <div className="absolute right-1 top-1 z-30 flex items-center gap-1 rounded-lg border border-white/10 bg-black/72 p-1 opacity-100 backdrop-blur-sm">
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
                                                    <div className={`absolute left-0 right-0 top-0 z-20 h-1 ${
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

                                                <div className={`${isLinkingMode ? 'pointer-events-none' : ''} rounded-[1rem] border border-transparent ${borderClass}`}>
                                                    {isPreviewCampaign ? (
                                                        <PreviewArenaMiniCard arena={arena} actions={arenaActions} />
                                                    ) : (
                                                        <div className="h-[4.95rem] w-[11rem]">
                                                            <ArenaCard 
                                                                arena={arena}
                                                                actions={arenaActions}
                                                                tasks={cycleScopedTasks}
                                                                variant="compact" 
                                                                onClick={() => {}}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {!isReadOnlyCodexCampaign && prereqs.length > 0 && (
                                                <div className="mt-1 flex min-h-[24px] items-center justify-center rounded-[0.8rem] border border-white/6 bg-black/55 px-1.5 py-1">
                                                    <div className="flex w-full flex-wrap justify-center gap-1">
                                                        {prereqs.map(pid => {
                                                            const pArena = campaignArenasSource.find(a => a.id === pid);
                                                            const pCleared = campaignArenaStates[pid]?.isCleared;
                                                            return (
                                                                <div key={pid} className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-bold ${
                                                                    pCleared
                                                                        ? 'border-green-500/50 bg-green-900/40 text-green-400 opacity-50'
                                                                        : 'border-red-500/50 bg-red-900/40 text-red-400'
                                                                }`} title={`Requer: ${pArena?.name}`}>
                                                                    <LinkIcon className="h-2.5 w-2.5" />
                                                                    <span className="max-w-[60px] truncate">{pArena?.name}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                        })}
                                        {arenas.length === 0 && isEditing && (
                                            <div className="flex min-h-[5.8rem] flex-1 items-center justify-center rounded-[0.9rem] border border-dashed border-white/10 bg-black/15 px-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                                                Solte uma arena aqui
                                            </div>
                                        )}
                                        {canEditCampaignStructure && phaseIndex === renderedPhaseRows.length - 1 && (
                                            <div className="flex min-h-[5.8rem] items-end gap-2 self-stretch pb-1 pr-1">
                                                <button
                                                    type="button"
                                                    onClick={handleAttachExistingArenas}
                                                    disabled={attachableArenaIds.length === 0}
                                                    className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-white/12 bg-white/8 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/78 transition-all hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40"
                                                    title={attachableArenaIds.length === 0 ? 'Nenhuma arena livre para anexar' : 'Escolher arenas existentes'}
                                                >
                                                    <LinkIcon className="h-3.5 w-3.5" />
                                                    <span>Arenas</span>
                                                </button>
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
                                <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--skin-accent-color)]">
                                    <span>{selectedCampaignProgressSummary.totalCompleted}/{selectedCampaignProgressSummary.totalPlanned} acoes</span>
                                    <span>{selectedCampaignProgress}%</span>
                                </div>
                                <div className="h-[5px] w-full overflow-hidden rounded-full border border-white/10 bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-[var(--skin-accent-color)] transition-all duration-300"
                                        style={{ width: `${selectedCampaignProgress}%` }}
                                    />
                                </div>
                                <div className="mt-1 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">
                                    {selectedCampaignProgressSummary.clearedArenaCount}/{selectedCampaignProgressSummary.totalArenaCount} arenas concluidas
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

                    {isAttachArenaModalOpen && selectedCampaign && (
                        <CreateCampaignModal
                            targetCampaign={selectedCampaign}
                            availableArenaIds={attachableArenaIds}
                            onClose={() => setIsAttachArenaModalOpen(false)}
                            onAttached={() => {
                                setIsAttachArenaModalOpen(false);
                                setIsEditing(true);
                            }}
                        />
                    )}
                    
                    {selectedArena && !(isPreviewCampaign && previewMeta?.hideArenaDetails) && (
                        <ArenaDetailModal 
                            arena={selectedArena}
                            actionsOverride={selectedArenaActions}
                            tasksOverride={selectedArenaTasks}
                            readOnly={isPreviewCampaign || !canEditPreviewCampaign}
                            previewMode={isPreviewCampaign}
                            onClose={() => setSelectedArenaId(null)}
                        />
                    )}

                    {libraryPreview && (
                        <CampaignsCodex
                            onClose={() => {
                                setLibraryPreview(null);
                                setLibraryPreviewCodex(null);
                            }}
                            initialCampaignId={libraryPreview.campaign.id}
                            previewCampaign={libraryPreview.campaign}
                            previewArenas={libraryPreview.arenas}
                            previewActions={libraryPreview.actions}
                            previewMeta={{
                                coverImage: libraryPreviewCodex?.template?.coverImage,
                                badgeLabel: 'Biblioteca',
                                author: libraryPreviewCodex?.author || 'Autor desconhecido',
                                note: 'Essa campanha ja e sua e pode ser instalada a qualquer momento.',
                                installLabel: installedCodexIds.has(libraryPreviewCodex?.id || '') ? 'Instalada' : 'Instalar',
                                installDisabled: installedCodexIds.has(libraryPreviewCodex?.id || ''),
                                onInstall: libraryPreviewCodex
                                    ? () => handleInstallLibraryCampaign(libraryPreviewCodex)
                                    : null,
                            }}
                        />
                    )}
                    {isRecommendationQuizOpen && (
                        <CampaignRecommendationQuizModal onClose={() => setRecommendationQuizOpen(false)} />
                    )}
                </GlassCard>
            </div>
        </Portal>
    );
};




