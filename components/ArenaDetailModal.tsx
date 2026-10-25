import { getArenaTone, getArenaActionGradient } from '../utils/arenaTones.ts';
import { getTaskMinutes } from '../utils/taskExp';
import { ReferencePlate } from './ReferencePlate';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Arena, Action, ScheduledTask, RelationshipLinkType } from '../types';
import { getLocalDateString, useGame } from '../contexts/GameContext';
import { PlusIcon, EditIcon, CheckIcon, LinkIcon, Trash2Icon, UsersIcon, SendIcon } from './Icons';
import { ActionModal } from './ActionModal';
import { IconPickerModal } from './IconPickerModal';
import { ConfirmationModal } from './ConfirmationModal';
import { Portal } from './Portal';
import { PlasmaCanvas } from './PlasmaCanvas';
import { supabase } from '../supabaseClient';
import { QUEST_VISUAL, withAlpha } from '../constants/rarityVisuals';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { FIRST_USE_ONBOARDING_EVENTS } from '../utils/firstUseOnboarding';
import { calculateArenaProgress, isExplicitSharedArena } from '../utils/progressUtils';
import { getActionSurfaceBadgeClassName, resolveActionSurfaceBadge } from '../utils/actionSurfaceBadges';
import { filterTasksAfterFreeProgressReset } from '../utils/freeProgressScope';
import './arena-ui.css';
import './arena-layout.css';
import { EmojiGlyph } from './EmojiGlyph';
import { ConnectionsModal } from './ConnectionsModal';
import { PRODUCT_FEATURES } from '../constants/featureFlags';
import { ArenaStatusTags } from './ArenaStatusTags';

const hexToRgb = (hex: string) => {
    const trimmed = hex.trim();
    if (trimmed.startsWith('rgb')) {
        const matches = trimmed.match(/\d+/g);
        if (matches && matches.length >= 3) {
            return { r: parseInt(matches[0]), g: parseInt(matches[1]), b: parseInt(matches[2]) };
        }
    }
    const normalized = trimmed.replace('#', '');
    if (normalized.length === 3 || normalized.length === 6) {
        const value = normalized.length === 3 ?normalized.split('').map(ch => ch + ch).join('') : normalized;
        const intValue = parseInt(value, 16);
        return { r: (intValue >> 16) & 255, g: (intValue >> 8) & 255, b: intValue & 255 };
    }
    return { r: 240, g: 200, b: 67 };
};

const rgbaString = (hex: string, alpha: number) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const normalizeAssetKey = (value?: string | null) =>
    (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-');

const ActionSquare: React.FC<{
    action: Action;
    onClick: () => void;
    skinColor: string;
    sharedPool: boolean;
    countingTasks: ScheduledTask[];
    relationshipLinkType?: RelationshipLinkType | null;
}> = ({ action, onClick, skinColor, sharedPool, countingTasks, relationshipLinkType = null }) => {
    const { getActionBackgroundStyle, getArenas, getClanQuestProgress, getClanQuestForActionName, getSharedActionPoolProgress } = useGame();
    const backgroundStyle = getActionBackgroundStyle(action.id);

    const arena = getArenas?.()?.find(ar => ar.id === action.arenaId);
    const personalCompleted = countingTasks.filter(t => t.actionId === action.id && t.completed).length;

    // SAFE ACCESS: Only call shared progress if it's a shared pool AND the function exists
    let sharedCompleted = 0;
    if (sharedPool && typeof getSharedActionPoolProgress === 'function') {
        try {
            sharedCompleted = getSharedActionPoolProgress(action.arenaId, action.id) || 0;
        } catch (e) {
            console.error("Error fetching shared progress:", e);
        }
    }

    const completedCount = sharedPool ?sharedCompleted : personalCompleted;
    const totalProposed = action.repetitions || 1;
    const isFreeAction = action.actionType === 'Livre';

    const normalizedArena = arena?.name ?arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

    // SAFE ACCESS: Clan Quest logic
    const clanQuest = typeof getClanQuestForActionName === 'function' ?getClanQuestForActionName(action.name) : null;
    const isClanQuest = !!clanQuest;

    let clanProgress = 0;
    if (isClanQuest && typeof getClanQuestProgress === 'function') {
        clanProgress = getClanQuestProgress(clanQuest.id) || 0;
    }

    const target = clanQuest?.requirements?.clanGoal || clanQuest?.goal_value || 50;
    const displayProgress = isClanQuest ?`${clanProgress}/${target}` : (isFreeAction ?`${completedCount}` : `${completedCount}/${totalProposed}`);
    const displayIcon = action.icon || '\u{1F4DD}';
    const surfaceBadge = resolveActionSurfaceBadge(action, relationshipLinkType);

    return (
        <div className="relative flex-shrink-0">
            <button
                onClick={onClick}
                style={isClanQuest ?{
                    backgroundColor: withAlpha(QUEST_VISUAL.rgb, 0.22),
                    borderColor: QUEST_VISUAL.hex,
                    boxShadow: `0 0 15px ${withAlpha(QUEST_VISUAL.rgb, 0.3)}`
                } : {
                    ...backgroundStyle,
                }}
                className={`relative w-24 h-24 border rounded-xl hover:opacity-80 transition-all overflow-hidden ${isClanQuest ?'' : 'border-[var(--skin-accent-color)]'}`}
            >
                <div className="arena-plasma">
                    <PlasmaCanvas color={isClanQuest ?QUEST_VISUAL.hex : skinColor} opacity={isClanQuest ?0.3 : 0.189} className="arena-plasma-canvas" />
                </div>
                <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-2 py-1.5 space-y-1.5">
                    <EmojiGlyph symbol={displayIcon} size="detail" className="text-white" />
                    <p className="text-[13px] font-bold leading-[1.05] line-clamp-2 text-white">{action.name}</p>
                </div>
            </button>
            <div
                className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none border ${isClanQuest ?'' : 'bg-black/50 text-white border-white/8'}`}
                style={isClanQuest ?{
                    backgroundColor: withAlpha(QUEST_VISUAL.rgb, 0.24),
                    color: QUEST_VISUAL.hex,
                    borderColor: withAlpha(QUEST_VISUAL.rgb, 0.35),
                } : undefined}
            >
                <span>{displayProgress}</span>
            </div>
            {surfaceBadge && (
                <div className={`pointer-events-none absolute bottom-1 left-1/2 z-20 -translate-x-1/2 rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase leading-none tracking-[0.08em] shadow-[0_4px_12px_rgba(0,0,0,0.35)] ${getActionSurfaceBadgeClassName(surfaceBadge.tone)}`}>
                    {surfaceBadge.label}
                </div>
            )}
        </div>
    );
};

export const ArenaDetailModal: React.FC<{
    arena: Arena;
    onClose: () => void;
    actionsOverride?: Action[];
    tasksOverride?: ScheduledTask[];
    readOnly?: boolean;
    previewMode?: boolean;
    linkedRelationshipLinkId?: string;
    linkedRelationshipType?: RelationshipLinkType | null;
    collaborativeRole?: 'mentor' | 'pupil' | null;
    allowLinkedMentorshipEdit?: boolean;
    collaborativeOwnerUserId?: string | null;
    onLinkedArenaRefresh?: (() => Promise<void>) | (() => void);
}> = ({
    arena,
    onClose,
    actionsOverride,
    tasksOverride,
    readOnly = false,
    previewMode = false,
    linkedRelationshipLinkId,
    linkedRelationshipType = null,
    collaborativeRole = null,
    allowLinkedMentorshipEdit = false,
    collaborativeOwnerUserId = null,
    onLinkedArenaRefresh,
}) => {
    const { getActionsForArena, assets, updateArena, deleteArena, removeRelationshipArenaShare, tasks, activeCycle, activeArenaPact, freeProgressResetAt, getActionBackgroundStyle, getClanQuestProgress, clanQuestParticipants, fetchClanQuestParticipants, joinClanMission, getClanQuestsForArena, seasonQuests, setArenaAsShared, clan, userProfile, enrichedClanMembers, getSharedActionPoolProgress, showToast, userCodexes } = useGame();
    const [actionModalState, setActionModalState] = useState<{ action: Action | null, mode: 'view' | 'edit', key: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableArena, setEditableArena] = useState({ assetId: arena.assetId, name: arena.name, description: arena.description, icon: arena.icon });
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [isLinkingObserver, setIsLinkingObserver] = useState(false);
    const [isRelationshipHubOpen, setRelationshipHubOpen] = useState(false);
    const [arenaTab, setArenaTab] = useState<'actions' | 'about'>('actions');
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const newActionRef = useRef<HTMLButtonElement>(null);
    const [currentLinkType, setCurrentLinkType] = useState<string | null>(linkedRelationshipType);
    const [currentCollaborativeRole, setCurrentCollaborativeRole] = useState<'mentor' | 'pupil' | null>(collaborativeRole);
    const [selectionType, setSelectionType] = useState<'mentoria' | 'competicao' | 'parceria'>('mentoria');

    useEffect(() => {
        setEditableArena({ assetId: arena.assetId, name: arena.name, description: arena.description, icon: arena.icon });
        setIsEditing(false);
    }, [arena.id, arena.assetId, arena.name, arena.description, arena.icon]);

    useEffect(() => {
        const fetchLinkType = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const uid = sessionData.session?.user.id;
            if (!uid) return;

            const linkedArenaResult = await supabase
                .from('relationship_link_arenas')
                .select('relationship_link_id')
                .eq('arena_id', arena.id)
                .maybeSingle();

            const linkedRelationshipId = linkedRelationshipLinkId || linkedArenaResult.data?.relationship_link_id || null;

            const { data } = await supabase.from('relationship_links')
                .select('link_type, mentor_id, pupil_id')
                .or(`mentor_id.eq.${uid},pupil_id.eq.${uid}`)
                .eq(linkedRelationshipId ? 'id' : 'arena_id', linkedRelationshipId || arena.id)
                .is('ended_at', null)
                .maybeSingle();

            if (data) {
                setCurrentLinkType(data.link_type);
                setCurrentCollaborativeRole(
                    data.link_type === 'mentoria'
                        ? (data.mentor_id === uid ? 'mentor' : data.pupil_id === uid ? 'pupil' : null)
                        : null
                );
            }
        };
        fetchLinkType();
    }, [arena.id, linkedRelationshipLinkId]);

    const localArenaExists = useMemo(
        () => assets.some((asset) => asset.arenas.some((candidate) => candidate.id === arena.id)),
        [arena.id, assets]
    );
    const effectiveRelationshipType = currentLinkType || linkedRelationshipType;
    const effectiveCollaborativeRole = currentCollaborativeRole || collaborativeRole;
    const isDetachedMentorshipCollab = false;
    const isMentorshipLinkedArena = effectiveRelationshipType === 'mentoria';
    const isCompetitionLinkedArena = effectiveRelationshipType === 'competicao';
    const isPupilMentorshipArena = isMentorshipLinkedArena && effectiveCollaborativeRole === 'pupil';
    const isReadOnlyArena = readOnly || previewMode || isCompetitionLinkedArena || !localArenaExists;
    const activeAssetId = isEditing ? editableArena.assetId : arena.assetId;
    const parentAsset = assets.find(a => a.id === activeAssetId);
    const formatAssetLabel = (assetId: string, assetName: string) => assetId === 'geral' ? 'OUTROS / SIDEQUEST' : assetName;
    const normalizedArena = arena.name ?arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

    const allActions = useMemo(() => {
        if (Array.isArray(actionsOverride)) return actionsOverride;
        if (typeof getActionsForArena !== 'function') return [];
        return getActionsForArena(arena.id) || [];
    }, [actionsOverride, arena.id, getActionsForArena]);

    /**
     * A ARENA DA JORNADA NAO RECEBE ACAO NOVA.
     *
     * Ela nao foi criada pela pessoa: nasce no acceptSeasonQuest, com o nome da
     * missao e uma acao so, e se recolhe sozinha quando a jornada acaba ou a
     * temporada vira. Deixar acrescentar acao ali cria duas coisas ruins de uma
     * vez — um trabalho proprio dentro de um recipiente que vai ser arquivado
     * sem aviso, e uma arena que diz "O Andarilho" e guarda outra coisa.
     *
     * Quem quer construir em cima cria a arena dele, que e de graca e nao some.
     */
    const isArenaDeJornada = useMemo(
        () => allActions.some((candidate) => Boolean(candidate?.sourceQuestId)),
        [allActions],
    );

    const clanQuests = useMemo(() => {
        if (!arena || typeof getClanQuestsForArena !== 'function') return [];
        return getClanQuestsForArena(arena, allActions) || [];
    }, [arena, allActions, getClanQuestsForArena]);

    const isClanQuestArena = useMemo(() => {
        if (!PRODUCT_FEATURES.clanMissions) return false;
        return (clanQuests && clanQuests.length > 0) || normalizedArena.includes('quests - clã');
    }, [clanQuests, normalizedArena]);

    const isSeasonQuestArena = useMemo(() => normalizedArena.includes('quests - season'), [normalizedArena]);
    const isSpecialArena = isClanQuestArena || isSeasonQuestArena;
    const hasPersonalPact = activeArenaPact?.arenaId === arena.id;
    const sourceCodex = useMemo(
        () => (arena.originCodexId ? userCodexes.find(codex => codex.id === arena.originCodexId) ?? null : null),
        [arena.originCodexId, userCodexes]
    );
    // O Codex de mentor chega como presente, mas nao e conteudo protegido: o
    // orientado recebeu um ponto de partida e deve adaptar a propria arena.
    const isMentorDeliveredArena = Boolean(sourceCodex?.mentor_relationship_link_id);
    const isReceivedCodexArena = !isMentorDeliveredArena && (
        sourceCodex?.source_type === 'gift_link' || sourceCodex?.source_type === 'gift_in_app'
    );
    const isArenaEditLocked = isSpecialArena || isReceivedCodexArena;
    const arenaEditLockMessage = isSeasonQuestArena
        ? 'Missões de temporada são travadas e não podem ser editadas.'
        : isSpecialArena
            ? 'Essa arena especial não pode ser editada por aqui.'
            : isReceivedCodexArena
                ? 'Campanha recebida fica protegida. So campanha comprada ou autoral pode ser adaptada.'
                : null;
    const resolvedAssetAccent = getArenaTone({ ...arena, ...editableArena });
    const accentColor = isClanQuestArena ?QUEST_VISUAL.hex : resolvedAssetAccent;

    useEffect(() => {
        if (!isClanQuestArena || !clanQuests || clanQuests.length === 0) return;

        clanQuests.forEach(quest => {
            if (quest?.id) {
                if (quest.actionTemplate?.name && typeof fetchClanQuestParticipants === 'function') {
                    fetchClanQuestParticipants(quest.id, quest.actionTemplate.name).catch(e => console.error("Error fetching participants:", e));
                }
                if (typeof joinClanMission === 'function') {
                    joinClanMission(quest.id).catch(e => console.error("Error joining clan mission:", e));
                }
            }
        });
    }, [isClanQuestArena, clanQuests, fetchClanQuestParticipants, joinClanMission]);

    const milestoneActions = useMemo(() => allActions.filter(a => a.actionType === 'Marco'), [allActions]);
    const bronzeActions = useMemo(() => allActions.filter(a => a.actionType !== 'Marco'), [allActions]);

    const clanQuestTotals = useMemo(() => {
        if (!clanQuests) return { totalProgress: 0, totalGoal: 0 };
        return clanQuests.reduce((acc, quest) => {
            let progressValue = 0;
            if (typeof getClanQuestProgress === 'function') {
                progressValue = getClanQuestProgress(quest.id) || 0;
            }
            const goal = quest.requirements?.clanGoal || quest.goal_value || 50;
            return {
                totalProgress: acc.totalProgress + progressValue,
                totalGoal: acc.totalGoal + goal
            };
        }, { totalProgress: 0, totalGoal: 0 });
    }, [clanQuests, getClanQuestProgress]);

    const isOfficeMode = PRODUCT_FEATURES.clanSharedActions && clan?.clanType === 'Office';
    const isLeader = enrichedClanMembers.some(member => member.id === userProfile?.id && member.role === 'leader');
    // Ver ArenaCard: vinculo NAO troca o seu contador pelo pool. Office sim.
    // E o pool so vale para arena explicitamente coletiva — esperar o tipo de
    // vinculo chegar fazia o numero trocar depois de aberto.
    const forceSharedPool = isOfficeMode ? true : (isExplicitSharedArena(arena) ? undefined : false);
    const tasksForCounts = useMemo(() => {
        if (Array.isArray(tasksOverride)) return tasksOverride;
        if (arena.originCodexId) return tasks;
        if (!activeCycle) return filterTasksAfterFreeProgressReset(tasks, freeProgressResetAt);

        const today = getLocalDateString();
        const cycleEnd = today < activeCycle.endDate ? today : activeCycle.endDate;
        return tasks.filter(task =>
            typeof task?.date === 'string' &&
            task.date >= activeCycle.startDate &&
            task.date <= cycleEnd
        );
    }, [activeCycle, freeProgressResetAt, tasks, tasksOverride, arena.originCodexId]);
    const arenaProgressState = useMemo(() => calculateArenaProgress({
        arena,
        actions: allActions,
        tasks: tasksForCounts,
        clanQuests,
        getClanQuestProgress,
        getSharedActionPoolProgress,
        forceSharedPool,
    }), [allActions, arena, clanQuests, forceSharedPool, getClanQuestProgress, getSharedActionPoolProgress, tasksForCounts]);
    const isSharedPool = arenaProgressState.isSharedPool;
    const completedArenaMinutes = tasksForCounts.reduce((total, task) => {
        const action = allActions.find(candidate => candidate.id === task.actionId);
        return task.completed && action ? total + getTaskMinutes(task, action) : total;
    }, 0);
    const practiceLabel = completedArenaMinutes >= 60
        ? `${Math.floor(completedArenaMinutes / 60)}h${completedArenaMinutes % 60 ? ` ${completedArenaMinutes % 60}min` : ''}`
        : `${completedArenaMinutes}min`;


    const allActionInstances = arenaProgressState.totalPlanned || 0;
    const allCompletedInstances = arenaProgressState.totalCompleted || 0;
    const progress = arenaProgressState.progressPercent || 0;
    const hasMeasurableProgress = arenaProgressState.hasMeasurableProgress;
    const isRelationshipArena = effectiveRelationshipType === 'mentoria' || effectiveRelationshipType === 'competicao' || effectiveRelationshipType === 'parceria';
    const canUnsharePartnershipArena = effectiveRelationshipType === 'parceria' && localArenaExists;
    const allowRelationshipArenaDelete = effectiveRelationshipType === 'mentoria'
        ? effectiveCollaborativeRole === 'pupil'
        : effectiveRelationshipType === 'parceria'
            ? canUnsharePartnershipArena
            : false;
    const canDeleteOwnArena = localArenaExists && !isArenaEditLocked && !isRelationshipArena;
    const canDeleteArenaFromModal = !isReadOnlyArena && (canDeleteOwnArena || allowRelationshipArenaDelete);
    const deleteDialogTitle = isSpecialArena
        ? 'Sair da Missão'
        : arena.isArchived
            ? 'Excluir arena'
        : effectiveRelationshipType === 'competicao'
            ? 'Desafio selado'
            : effectiveRelationshipType === 'parceria'
                ? 'Remover arena da parceria'
                : effectiveRelationshipType === 'mentoria'
                    ? 'Remover arena da mentoria'
                    : 'Excluir Arena';
    const deleteDialogMessage = isSpecialArena
        ? 'Ao sair, sua participacao e removida e esta arena e apagada de vez. Tem certeza?'
        : arena.isArchived
            ? 'Esta arena já esta arquivada. Excluir agora apaga esse registro de forma definitiva. Tem certeza?'
        : effectiveRelationshipType === 'competicao'
            ? 'Essa arena pertence a um duelo selado. Ela fica disponível apenas para consulta e histórico.'
            : effectiveRelationshipType === 'parceria'
                ? 'Você esta retirando esta arena da vitrine da parceria. A arena continua sua e o parceiro perde o acesso imediato.'
                : effectiveRelationshipType === 'mentoria'
                    ? 'O mentor deixara de acompanhar esta arena. A arena, as ações e todo o progresso continuam na sua conta.'
                    : 'Tem certeza que deseja excluir esta arena? Todo o progresso registrado nela será perdido.';
    const handleEditToggle = async () => {
        if (isReadOnlyArena) {
            showToast('Essa arena compartilhada abre aqui apenas para leitura.', 'warning');
            return;
        }
        if (isArenaEditLocked) {
            showToast(arenaEditLockMessage || 'Essa arena não pode ser editada.', 'warning');
            return;
        }
        if (isEditing) {
            const nextArenaData = {
                assetId: editableArena.assetId,
                name: editableArena.name,
                description: editableArena.description,
                icon: editableArena.icon,
            };

            if (isDetachedMentorshipCollab) {
                const { error } = await supabase
                    .from('arenas')
                    .update({
                        asset_id: nextArenaData.assetId,
                        name: nextArenaData.name,
                        description: nextArenaData.description,
                        icon: nextArenaData.icon,
                    })
                    .eq('id', arena.id);

                if (error) {
                    console.error('Supabase collaborative arena update error:', error.message);
                    showToast('Não foi possível atualizar essa arena vinculada.', 'error');
                    return;
                }

                await Promise.resolve(onLinkedArenaRefresh?.());
                window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            } else {
                updateArena(arena.id, nextArenaData);
            }

            showToast('Arena atualizada.', 'success');
        }
        setIsEditing(!isEditing);
    };

    const handleDeleteArena = async () => {
        setShowDeleteConfirmation(false);

        if (effectiveRelationshipType === 'mentoria') {
            try {
                const { error } = await supabase.rpc('delete_linked_relationship_arena', {
                    p_arena_id: arena.id,
                });

                if (error) throw error;

                await Promise.resolve(onLinkedArenaRefresh?.());
                window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
                showToast('Arena retirada da mentoria. Seu progresso foi preservado.', 'success');
                onClose();
                return;
            } catch (error: any) {
                console.error('Error deleting collaborative linked arena:', error);
                const message = String(error?.message || '');
                showToast(
                    message.includes('delete_linked_relationship_arena')
                        ? 'Essa base ainda não recebeu o SQL novo para permitir remover arenas de mentoria.'
                        : 'Não foi possível remover essa arena vinculada.',
                    'error'
                );
                return;
            }
        }

        if (canUnsharePartnershipArena && linkedRelationshipLinkId) {
            const success = await removeRelationshipArenaShare(linkedRelationshipLinkId, arena.id);
            if (success) {
                await Promise.resolve(onLinkedArenaRefresh?.());
                onClose();
            }
            return;
        }

        await Promise.resolve(deleteArena(arena.id));
        if (isRelationshipArena) {
            window.dispatchEvent(new CustomEvent('glyph:relationships-updated'));
            void Promise.resolve(onLinkedArenaRefresh?.());
        }
        onClose();
    };

    const handleIconSelect = (selectedIcon: string) => {
        setEditableArena(prev => ({ ...prev, icon: selectedIcon }));
        setIsIconPickerOpen(false);
    }

    const openActionDetails = (action: Action) => {
        setActionModalState({ action, mode: 'view', key: `action-modal-${action.id}-${Date.now()}` });
    };

    const openNewAction = () => {
        if (isReadOnlyArena) {
            showToast('Essa arena compartilhada abre aqui apenas para leitura.', 'warning');
            return;
        }
        if (isArenaEditLocked) {
            showToast(
                isReceivedCodexArena
                    ? 'Campanha recebida fica protegida. So campanha comprada ou autoral pode ser adaptada.'
                    : 'Essa arena especial recebe missões pelo menu de Missões.',
                'warning'
            );
            return;
        }
        window.dispatchEvent(new CustomEvent(FIRST_USE_ONBOARDING_EVENTS.actionModalOpened));
        setActionModalState({ action: null, mode: 'edit', key: `new-action-modal-${Date.now()}` });
    };

    useEffect(() => {
        const handleTutorialRequestActionModal = () => {
            openNewAction();
        };

        window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.requestActionModalOpen, handleTutorialRequestActionModal);
        return () => window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.requestActionModalOpen, handleTutorialRequestActionModal);
    });

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const openRelationshipHub = (tab: 'mentoria' | 'parceria' | 'competicao' | 'arenas') => {
        if (tab !== 'arenas') {
            setSelectionType(tab);
        }
        setIsLinkingObserver(false);
        setRelationshipHubOpen(true);
    };

    const availableFriends: any[] = [];
    const linkStatus: string | null = null;
    const sendObserverInvite = async (_friend?: any, _type?: any) => {
        openRelationshipHub(selectionType);
    };

    /*
    const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    const availableFriends = friends.filter(f => isUuid(f.id));

    const sendObserverInvite = async (friend: UserProfile, type: 'mentoria' | 'competicao' | 'parceria') => {
        setLinkStatus(null);
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user.id;
        if (!uid || !isUuid(uid)) {
            setLinkStatus('Faça login para enviar convites.');
            return;
        }
        if (!isUuid(friend.id)) {
            setLinkStatus('Este aliado não possui ID válido.');
            return;
        }

        // Mentoria nao e vantagem de plano: o servidor cobra o vinculo de todo
        // mundo (relationship_lifecycle_v3) e nao exige Premium (13/10/2026).

        const { error } = await supabase.from('relationship_link_invites').insert({
            sender_id: uid,
            recipient_id: friend.id,
            link_type: type,
            arena_id: arena.id,
            arena_snapshot: { name: editableArena.name || arena.name, icon: editableArena.icon || arena.icon },
            status: 'pending',
        });
        if (error) {
            setLinkStatus(error.message);
            return;
        }
        setLinkStatus(`Convite de ${type === 'competicao' ?'Desafio' : type === 'parceria' ?'Parceria' : 'Mentoria'} enviado para ${friend.nickname}.`);
        window.setTimeout(() => {
            setIsLinkingObserver(false);
            setLinkStatus(null);
        }, 1200);
    };
    */

    // Removed SharedArenaView block to use standard render as requested

    return (
        <Portal>
            <div className="reference-arena-overlay ui-modal-backdrop z-50" onClick={handleBackdropClick}>
                <ReferencePlate role="dialog" aria-modal="true" aria-label={arena.name} className="reference-arena" style={{'--arena-accent': accentColor, '--arena-gradient': getArenaActionGradient({ ...arena, ...editableArena })} as React.CSSProperties}>
                    <div className="reference-arena-content">
                        <div className="reference-header reference-arena-header">
                            <div className="reference-arena-tools">
                                {/* Allow editing for flexible arenas or if user is the Mentor */}
                                {!isReadOnlyArena && (!isArenaEditLocked || isEditing || effectiveRelationshipType === 'mentoria') && (
                                    <button aria-label={isEditing ? 'Cancelar edição da arena' : 'Editar arena'} onClick={() => { if (isEditing) { setEditableArena({...arena}); setIsEditing(false); setArenaTab('actions'); } else { handleEditToggle(); setArenaTab('about'); } }} className="reference-corner reference-edit">
                                        {isEditing ? <span>←</span> : <EditIcon className="w-4 h-4" />}
                                    </button>
                                )}

                                {!isReadOnlyArena && isEditing && (
                                    <button
                                        onClick={() => {
                                            if (effectiveRelationshipType === 'competicao' || effectiveRelationshipType === 'parceria' || effectiveRelationshipType === 'mentoria') {
                                                setSelectionType(effectiveRelationshipType);
                                            } else {
                                                setSelectionType('mentoria');
                                            }
                                            setRelationshipHubOpen(true);
                                        }}
                                        className="p-2 rounded-full transition-colors border border-white/14 bg-black/30 hover:bg-black/40"
                                    >
                                        <LinkIcon className="w-4 h-4 accent-text" />
                                    </button>
                                )}
                                {/* Shared Arena Toggle for Leaders */}
                                {PRODUCT_FEATURES.clanSharedActions && !isReadOnlyArena && isEditing && isLeader && !isSpecialArena && (
                                    <button
                                        onClick={() => typeof setArenaAsShared === 'function' && setArenaAsShared(arena.id, !arena.description?.includes('[SHARED]'))}
                                        className={`p-2 rounded-full transition-colors border ${arena.description?.includes('[SHARED]')
                                            ?'border-green-500/50 bg-green-500/20 hover:bg-green-500/30'
                                            : 'border-white/14 bg-black/30 hover:bg-black/40'
                                            }`}
                                        title={arena.description?.includes('[SHARED]') ? 'Arena compartilhada' : 'Compartilhar arena para o clã'}
                                    >
                                        <UsersIcon className={`w-4 h-4 ${arena.description?.includes('[SHARED]') ?'text-green-400' : 'text-gray-400'}`} />
                                    </button>
                                )}
                            </div>
                            <div className="reference-arena-identity">
<button aria-label="Escolher ícone da arena"
                                onClick={() => isEditing && setIsIconPickerOpen(true)}
                                disabled={!isEditing}
                                className="reference-emoji"
                            >
                                <EmojiGlyph
                                    symbol={editableArena.icon}
                                    size="picker"
                                    className="text-white"
                                />
                            </button>
                                <div className="reference-eyebrow">{parentAsset?.name && formatAssetLabel(parentAsset.id, parentAsset.name)}</div>
                                {isEditing ? <input
                                        type="text"
                                        maxLength={80}
                                        aria-label="Nome da arena"
                                        value={editableArena.name}
                                        onChange={(e) => setEditableArena(prev => ({ ...prev, name: e.target.value }))}
                                        className="reference-title-input"
                                    /> : <h2>{arena.name}</h2>}
                                <ArenaStatusTags
                                    relationshipType={effectiveRelationshipType as RelationshipLinkType | null}
                                    hasPersonalPact={hasPersonalPact}
                                    hasSeasonMission={isSeasonQuestArena}
                                    className="mt-1.5"
                                />
                                {isReadOnlyArena && (
                                    <div className="bg-white/8 border border-white/14 text-white/72 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1">
                                        Somente leitura
                                    </div>
                                )}
                                {isClanQuestArena && (
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full text-[10px] accent-text border border-white/8">
                                            <UsersIcon className="w-3 h-3" />
                                            <span className="font-mono font-bold">
                                                {(() => {
                                                    const quest = seasonQuests?.find(q => q.type === 'clan' && (
                                                        q.title === arena.name ||
                                                        q.actionTemplate?.name === arena.name ||
                                                        allActions?.some(a => a.name === q.actionTemplate?.name)
                                                    ));
                                                    return quest ?(clanQuestParticipants?.[quest.id] || 0) : 0;
                                                })()}
                                            </span>
                                        </div>
                                        {/* Office Mode Tags for Clan Quests */}
                                        {allActions.some(a => a.name.includes('[URGENTE]')) && (
                                            <span className="text-[9px] font-bold text-red-400 bg-red-900/20 px-1.5 rounded border border-red-500/30 uppercase tracking-widest animate-pulse">
                                                URGENTE
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button className="reference-corner reference-close" aria-label="Fechar arena" onClick={onClose}>×</button>
                        </div>

                        {showDeleteConfirmation && (
                            <ConfirmationModal
                                title={deleteDialogTitle}
                                message={deleteDialogMessage}
                                eyebrow="ATO IRREVERSIVEL"
                                variant="danger"
                                icon={<Trash2Icon className="h-5 w-5" />}
                                confirmLabel={isSpecialArena ? 'SAIR DA MISSÃO' : 'EXCLUIR ARENA'}
                                cancelLabel="VOLTAR"
                                onConfirm={handleDeleteArena}
                                onCancel={() => setShowDeleteConfirmation(false)}
                            />
                        )}

                        <nav className="reference-tabs arena-detail-tabs" aria-label="Abas da arena">
                            <button aria-pressed={arenaTab === 'actions' && !isEditing} onClick={()=>setArenaTab('actions')} disabled={isEditing}>Ações</button>
                            <button aria-pressed={arenaTab === 'about' || isEditing} onClick={()=>setArenaTab('about')}>Sobre</button>
                        </nav>
                        {(arenaTab === 'about' || isEditing) ? <div className="arena-about">                        <div className="flex-shrink-0 flex flex-col items-center text-center space-y-1">
                            {isEditing ?(
                                <>
                                    <label className="reference-field w-full text-left"><span>O que você quer construir?</span><textarea
                                        value={editableArena.description}
                                        onChange={(e) => setEditableArena(prev => ({ ...prev, description: e.target.value }))}
                                        rows={2}
                                        maxLength={1000}
                                        aria-label="Descrição da arena"
                                    /></label>
                                    <div className="reference-field w-full text-left">
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-2">
                                            Área da vida
                                        </label>
                                        <select
                                            value={editableArena.assetId}
                                            onChange={(e) => setEditableArena(prev => ({ ...prev, assetId: e.target.value }))}
                                            className="w-full rounded-xl border border-white/8 bg-black/35 px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-[var(--skin-accent-color)]/45"
                                        >
                                            {assets.map(asset => (
                                                <option key={asset.id} value={asset.id}>
                                                    {formatAssetLabel(asset.id, asset.name)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 pt-1">{arena.description || 'Sem descrição.'}</p>
                            )}
                        </div>

</div> : <>
                            <div className="reference-arena-summary">
                                <span><b>{isClanQuestArena || isSharedPool ? allCompletedInstances : tasksForCounts.filter(task => task.completed && allActions.some(action => action.id === task.actionId)).length}</b> concluídas</span>
                                <span><b>{hasMeasurableProgress ? allActionInstances : allActions.length}</b> ações</span>
                                <span><b>{practiceLabel}</b> {isClanQuestArena || isSharedPool ? 'por você' : 'de prática'}</span>
                            </div>
                        {!isEditing && <div className="reference-arena-progress" aria-label="Progresso da arena">
                            {hasMeasurableProgress ? (
                                <div className="arena-plate-progress" role="progressbar" aria-label="Progresso da arena" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, progress))}>
                                    <div className="arena-plate-progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                            ) : (
                                <div className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/42">
                                    Sem meta definida
                                </div>
                            )}
                                <p className="text-sm font-bold text-gray-300 text-center">
                                {!hasMeasurableProgress
                                    ? (allActions.length > 0 ? 'Ações livres' : 'Sem ações')
                                    : isClanQuestArena
                                    ?`${clanQuestTotals.totalProgress}/${clanQuestTotals.totalGoal}`
                                    : isSharedPool
                                        ? `${allActionInstances - allCompletedInstances} ações restantes`
                                        : `${progress.toFixed(0)}%`}
                            </p>
                        </div>}
                            <div className="reference-list-heading"><span>Suas ações</span><small>Progresso registrado</small></div>
                            <div className="arena-actions-list" aria-label="Ações da arena">
                                {allActions.map(action => {
                                    const actionProgress = calculateArenaProgress({ arena, actions: [action], tasks: tasksForCounts, clanQuests: [], getClanQuestProgress, getSharedActionPoolProgress, forceSharedPool });
                                    const isMilestoneAction = action.actionType === 'Marco';
                                    const isFreeAction = action.actionType === 'Livre';
                                    const completed = action.actionType === 'Livre'
                                        ? tasksForCounts.filter(task => task.actionId === action.id && task.completed).length
                                        : actionProgress.totalCompleted;
                                    const countLabel = isClanQuestArena ? 'Clã' : action.actionType === 'Livre' ? `${completed} feitas` : `${completed} / ${actionProgress.totalPlanned}`;
                                    return <button key={action.id} className="arena-action-row" onClick={()=>openActionDetails(action)}>
                                        <span className={`arena-action-tile ${isMilestoneAction ? 'arena-action-tile--milestone' : isFreeAction ? 'free-action-shell free-action-outline arena-action-tile--free' : ''}`} style={isFreeAction ? { '--free-action-bg': getActionBackgroundStyle(action.id).background } as React.CSSProperties : getActionBackgroundStyle(action.id)}><EmojiGlyph symbol={action.icon || (isMilestoneAction ? '🏁' : '📝')} size="picker" /></span>
                                        <span className="arena-action-copy"><strong>{action.name}</strong><small>{action.duration} min · {action.actionType === 'Ação Recorrente' ? 'recorrente' : isMilestoneAction ? 'objetivo único' : <b className="action-type--free">LIVRE</b>}</small>{!isClanQuestArena && actionProgress.hasMeasurableProgress && <span className="reference-line-progress"><i style={{width: `${Math.min(100,actionProgress.progressPercent)}%`}} /></span>}</span>
                                        <span className="reference-action-count">{countLabel}<span>›</span></span>
                                    </button>;
                                })}
                                {!allActions.length && <p className="arena-actions-empty">Nenhuma ação ainda.</p>}
                            </div>
                            {!previewMode && !isReadOnlyArena && !isArenaDeJornada && <button aria-label="Nova ação" id="add-action-button" ref={newActionRef} onClick={openNewAction} className="arena-action-add"><PlusIcon className="w-5 h-5" /></button>}
                        </>}
                        {isEditing && <footer className="reference-footer reference-arena-edit-footer">
                            {canDeleteArenaFromModal && <button className="reference-delete" onClick={() => setShowDeleteConfirmation(true)}><Trash2Icon className="w-4 h-4" />{deleteDialogTitle}</button>}
                            <button className="reference-primary" onClick={handleEditToggle}>Salvar arena</button>
                        </footer>}
                    </div>
                </ReferencePlate>
            </div>
            {isIconPickerOpen && <IconPickerModal onSelect={handleIconSelect} onClose={() => setIsIconPickerOpen(false)} />}
            {actionModalState && (
                <ActionModal
                    key={actionModalState.key}
                    arenaId={arena.id}
                    action={actionModalState.action}
                    initialMode={actionModalState.mode}
                    isPreview={previewMode}
                    disableAuthoring={isCompetitionLinkedArena}
                    lockArenaAssignment={isMentorshipLinkedArena}
                    collaborativeLinkedArena={isDetachedMentorshipCollab}
                    collaborativeOwnerUserId={isDetachedMentorshipCollab ? collaborativeOwnerUserId : null}
                    collaborativeArenaTasks={isDetachedMentorshipCollab ? (tasksOverride || []) : undefined}
                    onCollaborativeRefresh={isDetachedMentorshipCollab ? onLinkedArenaRefresh : undefined}
                    onClose={() => setActionModalState(null)}
                />
            )}
            {PRODUCT_FEATURES.relationshipLegacyHub && isLinkingObserver && (
            <div className="arena-detail-modal fixed inset-0 bg-black/70 backdrop-blur-sm z-[240] flex items-center justify-center animate-fade-in" onClick={() => setIsLinkingObserver(false)}>
                    <div className="arena-link-panel bg-black/70 border border-white/8 w-full max-w-sm m-4 space-y-3 rounded-2xl p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">VINCULAR ALIADO</div>
                            <button aria-label="Fechar" onClick={() => setIsLinkingObserver(false)} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><span className="text-white">?</span></button>
                        </div>
                        <div className="text-xs text-gray-400">Escolha o tipo de v?nculo e convide um amigo para {editableArena.name || arena.name}.</div>

                        <div className="flex gap-2 mb-2">
                            <button onClick={() => setSelectionType('mentoria')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${selectionType === 'mentoria' ?'bg-[var(--skin-accent-color)] text-black border-[var(--skin-accent-color)]' : 'bg-black/30 text-gray-400 border-white/8'}`}>Mentoria</button>
                            <button onClick={() => setSelectionType('competicao')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${selectionType === 'competicao' ?'bg-red-500 text-white border-red-500' : 'bg-black/30 text-gray-400 border-white/8'}`}>Desafio</button>
                            <button onClick={() => setSelectionType('parceria')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${selectionType === 'parceria' ?'bg-blue-500 text-white border-blue-500' : 'bg-black/30 text-gray-400 border-white/8'}`}>Parceria</button>
                        </div>
                        {selectionType === 'mentoria' && (
                            <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-400/20 rounded-xl px-3 py-2">
                                Mentoria basica entra por 🪙 100. Depois, cada nova arena compartilhada custa 🪙 50.
                            </div>
                        )}

                        {availableFriends.length === 0 ?(
                            <div className="text-center text-sm text-gray-500 py-6">Nenhum amigo com ID válido.</div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {availableFriends.map(friend => {
                                    return (
                                    <button
                                        key={friend.id}
                                        onClick={() => sendObserverInvite(friend, selectionType)}
                                        className="w-full p-3 rounded-xl text-left border flex items-center gap-3 bg-black/20 hover:bg-black/30 border-white/8"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-black/30 border border-white/8 overflow-hidden flex items-center justify-center">
                                                {friend.avatarUrl ?<img src={friend.avatarUrl} alt={friend.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">👤</span>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{friend.nickname}</div>
                                            <div className="text-[10px] text-gray-500">
                                                {friend.isOnline ?'ONLINE' : 'OFFLINE'}
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white/5 rounded-full">
                                            <SendIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </button>
                                )})}
                            </div>
                        )}
                        {linkStatus && <div className="text-xs text-gray-300 bg-black/30 border border-white/8 rounded-xl p-2">{linkStatus}</div>}
                    </div>
                </div>
            )}
            {isRelationshipHubOpen && (
                <ConnectionsModal
                    initialTab={selectionType}
                    onClose={() => setRelationshipHubOpen(false)}
                />
            )}
        </Portal>
    );
};
