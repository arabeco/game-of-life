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
import { calculateArenaProgress } from '../utils/progressUtils';
import './arena-ui.css';
import { EmojiGlyph } from './EmojiGlyph';
import { RelationshipHubModal } from './RelationshipHubModal';

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
}> = ({ action, onClick, skinColor, sharedPool, countingTasks }) => {
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
                className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none border ${isClanQuest ?'' : 'bg-black/50 text-white border-white/10'}`}
                style={isClanQuest ?{
                    backgroundColor: withAlpha(QUEST_VISUAL.rgb, 0.24),
                    color: QUEST_VISUAL.hex,
                    borderColor: withAlpha(QUEST_VISUAL.rgb, 0.35),
                } : undefined}
            >
                <span>{displayProgress}</span>
            </div>
        </div>
    );
};

export const ArenaDetailModal: React.FC<{
    arena: Arena;
    onClose: () => void;
    actionsOverride?: Action[];
    tasksOverride?: ScheduledTask[];
    readOnly?: boolean;
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
    linkedRelationshipLinkId,
    linkedRelationshipType = null,
    collaborativeRole = null,
    allowLinkedMentorshipEdit = false,
    collaborativeOwnerUserId = null,
    onLinkedArenaRefresh,
}) => {
    const { getActionsForArena, assets, updateArena, deleteArena, tasks, activeCycle, getActionBackgroundStyle, getClanQuestProgress, clanQuestParticipants, fetchClanQuestParticipants, joinClanMission, getClanQuestsForArena, seasonQuests, setArenaAsShared, clan, userProfile, getSharedActionPoolProgress, showToast, userCodexes } = useGame();
    const [actionModalState, setActionModalState] = useState<{ action: Action | null, mode: 'view' | 'edit', key: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableArena, setEditableArena] = useState({ assetId: arena.assetId, name: arena.name, description: arena.description, icon: arena.icon });
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [isLinkingObserver, setIsLinkingObserver] = useState(false);
    const [isRelationshipHubOpen, setRelationshipHubOpen] = useState(false);
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
    const isDetachedMentorshipCollab = Boolean(
        allowLinkedMentorshipEdit &&
        (linkedRelationshipType === 'mentoria' || currentLinkType === 'mentoria') &&
        !localArenaExists
    );
    const isMentorshipLinkedArena = (linkedRelationshipType === 'mentoria' || currentLinkType === 'mentoria');
    const isPupilMentorshipArena = isMentorshipLinkedArena && currentCollaborativeRole === 'pupil';
    const isReadOnlyArena = readOnly || (!localArenaExists && !isDetachedMentorshipCollab);
    const activeAssetId = isEditing ? editableArena.assetId : arena.assetId;
    const parentAsset = assets.find(a => a.id === activeAssetId);
    const formatAssetLabel = (assetId: string, assetName: string) => assetId === 'geral' ? 'OUTROS / SIDEQUEST' : assetName;
    const normalizedArena = arena.name ?arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

    const allActions = useMemo(() => {
        if (Array.isArray(actionsOverride)) return actionsOverride;
        if (typeof getActionsForArena !== 'function') return [];
        return getActionsForArena(arena.id) || [];
    }, [actionsOverride, arena.id, getActionsForArena]);

    const clanQuests = useMemo(() => {
        if (!arena || typeof getClanQuestsForArena !== 'function') return [];
        return getClanQuestsForArena(arena, allActions) || [];
    }, [arena, allActions, getClanQuestsForArena]);

    const isClanQuestArena = useMemo(() => {
        return (clanQuests && clanQuests.length > 0) || normalizedArena.includes('quests - cla');
    }, [clanQuests, normalizedArena]);

    const isSeasonQuestArena = useMemo(() => normalizedArena.includes('quests - season'), [normalizedArena]);
    const isSpecialArena = isClanQuestArena || isSeasonQuestArena;
    const sourceCodex = useMemo(
        () => (arena.originCodexId ? userCodexes.find(codex => codex.id === arena.originCodexId) ?? null : null),
        [arena.originCodexId, userCodexes]
    );
    const isReceivedCodexArena = sourceCodex?.source_type === 'gift_link' || sourceCodex?.source_type === 'gift_in_app';
    const isArenaEditLocked = isSpecialArena || isReceivedCodexArena;
    const arenaEditLockMessage = isSeasonQuestArena
        ? 'Missoes de temporada sao travadas e nao podem ser editadas.'
        : isSpecialArena
            ? 'Essa arena especial nao pode ser editada por aqui.'
            : isReceivedCodexArena
                ? 'Campanha recebida fica protegida. So campanha comprada ou autoral pode ser adaptada.'
                : null;
    const resolvedAssetAccent =
        ASSET_ACCENT_COLORS[arena.assetId as keyof typeof ASSET_ACCENT_COLORS]
        || ASSET_ACCENT_COLORS[normalizeAssetKey(parentAsset?.name) as keyof typeof ASSET_ACCENT_COLORS]
        || '#F0C843';
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

    const isOfficeMode = clan?.clanType === 'Office';
    const isLeader = clan?.leaderId === userProfile?.id;
    const forceSharedPool = currentLinkType ? true : (isOfficeMode ? true : undefined);
    const tasksForCounts = useMemo(() => {
        if (Array.isArray(tasksOverride)) return tasksOverride;
        if (!activeCycle) return tasks;

        const today = getLocalDateString();
        const cycleEnd = today < activeCycle.endDate ? today : activeCycle.endDate;
        return tasks.filter(task =>
            typeof task?.date === 'string' &&
            task.date >= activeCycle.startDate &&
            task.date <= cycleEnd
        );
    }, [activeCycle, tasks, tasksOverride]);
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

    const allActionInstances = arenaProgressState.totalPlanned || 0;
    const allCompletedInstances = arenaProgressState.totalCompleted || 0;
    const progress = arenaProgressState.progressPercent || 0;
    const isRelationshipArena = currentLinkType === 'mentoria' || currentLinkType === 'competicao' || currentLinkType === 'parceria';
    const allowRelationshipArenaDelete = !isPupilMentorshipArena;
    const deleteDialogTitle = isSpecialArena
        ? 'Sair da Missao'
        : arena.isArchived
            ? 'Excluir arena'
        : currentLinkType === 'competicao'
            ? 'Sair do desafio'
            : currentLinkType === 'parceria'
                ? 'Remover arena da parceria'
                : currentLinkType === 'mentoria'
                    ? 'Remover arena da mentoria'
                    : 'Excluir Arena';
    const deleteDialogMessage = isSpecialArena
        ? 'Ao sair, sua participacao e removida e esta arena e apagada de vez. Tem certeza?'
        : arena.isArchived
            ? 'Esta arena ja esta arquivada. Excluir agora apaga esse registro de forma definitiva. Tem certeza?'
        : currentLinkType === 'competicao'
            ? 'Voce esta saindo do desafio desta arena. A competicao continua ativa, mas esta arena sera apagada de vez. Tem certeza?'
            : currentLinkType === 'parceria'
                ? 'Voce esta removendo a arena ligada a esta parceria. A relacao continua ativa, mas esta arena sera apagada de vez. Tem certeza?'
                : currentLinkType === 'mentoria'
                    ? 'Voce esta removendo a arena ligada a esta mentoria. A relacao continua ativa, mas esta arena sera apagada de vez. Tem certeza?'
                    : 'Tem certeza que deseja excluir esta arena? Esta acao nao pode ser desfeita.';
    const handleEditToggle = () => {
        if (isReadOnlyArena) {
            showToast('Essa arena compartilhada abre aqui apenas para leitura.', 'warning');
            return;
        }
        if (isArenaEditLocked) {
            showToast(arenaEditLockMessage || 'Essa arena nao pode ser editada.', 'warning');
            return;
        }
        if (isEditing) {
            updateArena(arena.id, {
                assetId: editableArena.assetId,
                name: editableArena.name,
                description: editableArena.description,
                icon: editableArena.icon,
            });
            if (isDetachedMentorshipCollab) {
                void Promise.resolve(onLinkedArenaRefresh?.());
            }
            showToast('Arena atualizada.', 'success');
        }
        setIsEditing(!isEditing);
    };

    const handleDeleteArena = () => {
        deleteArena(arena.id);
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
                    : 'Essa arena especial recebe missoes pelo menu de Missoes.',
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
            setLinkStatus('FaÃ§a login para enviar convites.');
            return;
        }
        if (!isUuid(friend.id)) {
            setLinkStatus('Este aliado nÃ£o possui ID vÃ¡lido.');
            return;
        }

        if (type === 'mentoria' && !hasPremiumAccess(userProfile) && !hasPremiumAccess(friend)) {
            setLinkStatus(`Mentoria exige que o Mentor seja Premium.`);
            return;
        }

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
            <div className="arena-detail-modal arena-detail-modal-overlay fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={handleBackdropClick}>
                <div
                    className="arena-detail-modal-root dossier-bg arena-plate border w-full max-w-[21rem] m-4 rounded-2xl px-4 py-5 flex flex-col h-auto max-h-[92vh] relative overflow-hidden"
                    style={{
                        borderColor: 'var(--skin-accent-color)',
                        backgroundImage: [
                            `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.18), rgba(255,255,255,0.07) 18%, transparent 44%)`,
                            `radial-gradient(circle at 18% 14%, rgba(255,255,255,0.05), transparent 22%)`,
                            `radial-gradient(circle at 100% 100%, ${rgbaString(accentColor, 0.22)}, transparent 40%)`,
                            `linear-gradient(160deg, rgba(192,197,207,0.6) 0%, rgba(118,125,138,0.68) 20%, rgba(66,72,84,0.82) 38%, rgba(18,20,26,0.94) 72%, ${rgbaString(accentColor, 0.14)} 92%, rgba(7,8,11,0.995) 100%)`,
                        ].join(', '),
                    }}
                >
                    <div
                        className="modal-aura-overlay"
                        style={{ '--modal-aura-color': 'rgba(214, 224, 238, 0.16)' } as React.CSSProperties}
                    />
                    <div
                        className="modal-sheen-overlay"
                        style={{ '--modal-sheen-color': 'rgba(219, 229, 244, 0.52)' } as React.CSSProperties}
                    />
                    <div className="relative z-10 flex flex-col space-y-3">
                        <div className="arena-detail-modal-header arena-plate-header flex justify-between items-start flex-shrink-0 gap-2 rounded-xl px-2 py-2 bg-black/20">
                            <div className="flex flex-col items-center gap-1">
                                {/* Allow editing for flexible arenas or if user is the Mentor */}
                                {!isReadOnlyArena && (!isArenaEditLocked || isEditing || currentLinkType === 'mentoria') && (
                                    <button onClick={handleEditToggle} className={`p-2 rounded-full transition-colors border border-white/20 ${isEditing ?'bg-white/20' : 'bg-transparent'}`}>
                                        <EditIcon className={`w-5 h-5 ${isEditing ?'text-white' : 'text-gray-300'}`} />
                                    </button>
                                )}

                                {!isReadOnlyArena && allowRelationshipArenaDelete && (isSpecialArena || isRelationshipArena || arena.isArchived) && !isEditing && (
                                    <button
                                        onClick={() => setShowDeleteConfirmation(true)}
                                        className="p-2 rounded-full transition-colors border border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
                                        title={arena.isArchived ? 'Excluir arena' : 'Abandonar Missao'}
                                    >
                                        <Trash2Icon className="w-5 h-5 text-red-500" />
                                    </button>
                                )}
                                {!isReadOnlyArena && isEditing && (
                                    <button
                                        onClick={() => {
                                            if (currentLinkType === 'competicao' || currentLinkType === 'parceria' || currentLinkType === 'mentoria') {
                                                setSelectionType(currentLinkType);
                                            } else {
                                                setSelectionType('mentoria');
                                            }
                                            setRelationshipHubOpen(true);
                                        }}
                                        className="p-2 rounded-full transition-colors border border-white/15 bg-black/30 hover:bg-black/40"
                                    >
                                        <LinkIcon className="w-4 h-4 accent-text" />
                                    </button>
                                )}
                                {/* Shared Arena Toggle for Leaders */}
                                {!isReadOnlyArena && isEditing && isLeader && !isSpecialArena && (
                                    <button
                                        onClick={() => typeof setArenaAsShared === 'function' && setArenaAsShared(arena.id, !arena.description?.includes('[SHARED]'))}
                                        className={`p-2 rounded-full transition-colors border ${arena.description?.includes('[SHARED]')
                                            ?'border-green-500/50 bg-green-500/20 hover:bg-green-500/30'
                                            : 'border-white/15 bg-black/30 hover:bg-black/40'
                                            }`}
                                        title={arena.description?.includes('[SHARED]') ? 'Arena compartilhada' : 'Compartilhar arena para o clÃ£'}
                                    >
                                        <UsersIcon className={`w-4 h-4 ${arena.description?.includes('[SHARED]') ?'text-green-400' : 'text-gray-400'}`} />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col items-center text-center">
                                <h2 className="luxe-title-ornate text-lg font-black uppercase tracking-wider text-[color:var(--skin-accent-color)]">
                                    {isEditing ?"EDITAR ARENA" : arena.name}
                                </h2>
                                {parentAsset?.name && (
                                    <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-gray-300">{formatAssetLabel(parentAsset.id, parentAsset.name)}</p>
                                )}
                                {currentLinkType === 'competicao' && (
                                    <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                                        <span>âš”ï¸</span> PVP
                                    </div>
                                )}
                                {currentLinkType === 'mentoria' && (
                                    <div className="bg-blue-500/20 border border-blue-500/50 text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                                        <span>ðŸ‘ï¸</span> MENTORIA
                                    </div>
                                )}
                                {currentLinkType === 'mentoria' && currentCollaborativeRole === 'pupil' && (
                                    <div className="bg-emerald-500/16 border border-emerald-300/30 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1">
                                        Plano guiado
                                    </div>
                                )}
                                {isReadOnlyArena && (
                                    <div className="bg-white/8 border border-white/14 text-white/72 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1">
                                        Somente leitura
                                    </div>
                                )}
                                {isClanQuestArena && (
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full text-[10px] accent-text border border-white/10">
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
                            {/* Right side actions - redundant delete button removed if we moved it to left for special arenas, but kept for consistency in edit mode */}
                            {!isReadOnlyArena && allowRelationshipArenaDelete && isEditing && (
                                <button
                                    onClick={() => setShowDeleteConfirmation(true)}
                                    className="p-2 rounded-full transition-colors border border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
                                >
                                    <Trash2Icon className="w-5 h-5 text-red-500" />
                                </button>
                            )}
                            {!isEditing && (
                                <button onClick={onClose} className="px-5 py-2 text-sm font-bold rounded-xl luxe-skin-button">
                                    OK
                                </button>
                            )}
                        </div>

                        {showDeleteConfirmation && false && (
                            <ConfirmationModal
                                title={isSpecialArena ? "Sair da MissÃ£o" : "Excluir Arena"}
                                message={isSpecialArena ? "Ao sair, sua participaÃ§Ã£o Ã© removida, mas a arena e aÃ§Ãµes ficam salvas." : "Tem certeza que deseja excluir esta arena? Esta aÃ§Ã£o nÃ£o pode ser desfeita."}
                                onConfirm={handleDeleteArena}
                                onCancel={() => setShowDeleteConfirmation(false)}
                            />
                        )}

                        {showDeleteConfirmation && (
                            <ConfirmationModal
                                title={deleteDialogTitle}
                                message={deleteDialogMessage}
                                onConfirm={handleDeleteArena}
                                onCancel={() => setShowDeleteConfirmation(false)}
                            />
                        )}

                        <div className="flex-shrink-0 flex flex-col items-center text-center space-y-1">
                            <button
                                onClick={() => isEditing && setIsIconPickerOpen(true)}
                                disabled={!isEditing}
                                className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer disabled:cursor-default"
                            >
                                <EmojiGlyph
                                    symbol={editableArena.icon}
                                    size="picker"
                                    className="arena-icon scale-[2.55] text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]"
                                />
                            </button>

                            {isEditing ?(
                                <>
                                    <input
                                        type="text"
                                        value={editableArena.name}
                                        onChange={(e) => setEditableArena(prev => ({ ...prev, name: e.target.value }))}
                                        className="luxe-title-ornate w-full text-center bg-transparent text-2xl font-bold uppercase tracking-widest text-[color:var(--skin-accent-color)] pt-2 focus:outline-none border-b border-dashed border-white/20"
                                    />
                                    <textarea
                                        value={editableArena.description}
                                        onChange={(e) => setEditableArena(prev => ({ ...prev, description: e.target.value }))}
                                        rows={2}
                                        className="w-full text-center bg-transparent text-sm text-gray-500 pt-1 focus:outline-none"
                                    />
                                    <div className="arena-detail-field-card w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-left">
                                        <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-2">
                                            Ativo pai
                                        </label>
                                        <select
                                            value={editableArena.assetId}
                                            onChange={(e) => setEditableArena(prev => ({ ...prev, assetId: e.target.value }))}
                                            className="w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-[var(--skin-accent-color)]/45"
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
                                <p className="text-sm text-gray-500 pt-1">{arena.description || 'Sem descriÃ§Ã£o.'}</p>
                            )}
                        </div>

                        <div className="flex-grow space-y-2 flex flex-col overflow-y-auto">
                            {milestoneActions.length > 0 && (
                                <div className="flex-shrink-0">
                                    <div className='relative text-center mb-2'>
                                        <hr className="border-t border-gray-800" />
                                        <h3 className="arena-detail-section-label text-xs font-semibold text-[var(--skin-accent-color)] uppercase tracking-wider absolute -top-2 left-1/2 -translate-x-1/2 bg-[#101010] px-2">Marcos</h3>
                                    </div>
                                    <div className="flex flex-col items-center space-y-2 py-2">
                                        {milestoneActions.map(action => {
                                            const backgroundStyle = getActionBackgroundStyle(action.id);
                                            const task = tasksForCounts.find(t => t.actionId === action.id);
                                            const isCompleted = task?.completed;

                                            return (
                                                <div key={action.id} className="relative">
                                                    <button
                                                        onClick={() => openActionDetails(action)}
                                                        style={backgroundStyle}
                                                        className="relative w-20 h-20 flex-shrink-0 border border-[var(--skin-accent-color)] rounded-xl hover:scale-105 transition-transform overflow-hidden p-1 transform rotate-45"
                                                    >
                                                        <div className="arena-plasma">
                                                            <PlasmaCanvas color={'var(--skin-accent-color)'} opacity={0.189} className="arena-plasma-canvas" />
                                                        </div>
                                                        <div className="relative z-10 transform -rotate-45 flex flex-col items-center justify-center px-1 space-y-1.5">
                                                            <EmojiGlyph symbol={action.icon || "ðŸ†"} size="milestone" className="text-white" />
                                                            <p className="text-[13px] font-bold leading-[1.05] line-clamp-2 text-white">{action.name}</p>
                                                        </div>
                                                    </button>
                                                    {isCompleted && (
                                                        <div className="absolute top-0 right-0 bg-green-500 rounded-full p-1 border-2 border-black">
                                                            <CheckIcon className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex-grow overflow-x-auto overflow-y-hidden py-2">
                                <div className="flex space-x-2 h-full items-center">
                                    {bronzeActions.map(action => (
                                        <ActionSquare
                                            key={action.id}
                                            action={action}
                                            skinColor={'var(--skin-accent-color)'}
                                            onClick={() => openActionDetails(action)}
                                            sharedPool={isSharedPool}
                                            countingTasks={tasksForCounts}
                                        />
                                    ))}
                                    <button id="add-action-button" ref={newActionRef} onClick={openNewAction} className="w-24 h-24 flex-shrink-0 border-2 border-dashed border-[var(--skin-accent-color)] rounded-xl flex flex-col items-center justify-center hover:border-[var(--skin-accent-color)] transition-colors text-gray-500 hover:text-white">
                                        <PlusIcon className="w-8 h-8" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-shrink-0 space-y-2 pt-2">
                            <div className="arena-plate-progress">
                                <div className="arena-plate-progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7a5813 0%, #d4af37 46%, #f6e2a3 100%)' }}></div>
                            </div>
                            <p className="text-sm font-bold text-gray-300 text-center">
                                {isClanQuestArena
                                    ?`${clanQuestTotals.totalProgress}/${clanQuestTotals.totalGoal}`
                                    : isSharedPool
                                        ? `${allActionInstances - allCompletedInstances} aÃ§Ãµes restantes`
                                        : `${progress.toFixed(0)}%`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {isIconPickerOpen && <IconPickerModal onSelect={handleIconSelect} onClose={() => setIsIconPickerOpen(false)} />}
            {actionModalState && (
                <ActionModal
                    key={actionModalState.key}
                    arenaId={arena.id}
                    action={actionModalState.action}
                    initialMode={actionModalState.mode}
                    lockArenaAssignment={isMentorshipLinkedArena}
                    collaborativeLinkedArena={isDetachedMentorshipCollab}
                    collaborativeOwnerUserId={isDetachedMentorshipCollab ? collaborativeOwnerUserId : null}
                    collaborativeArenaTasks={isDetachedMentorshipCollab ? (tasksOverride || []) : undefined}
                    onCollaborativeRefresh={isDetachedMentorshipCollab ? onLinkedArenaRefresh : undefined}
                    onClose={() => setActionModalState(null)}
                />
            )}
            {isLinkingObserver && (
            <div className="arena-detail-modal fixed inset-0 bg-black/70 backdrop-blur-sm z-[240] flex items-center justify-center animate-fade-in" onClick={() => setIsLinkingObserver(false)}>
                    <div className="arena-link-panel bg-black/70 border border-white/10 w-full max-w-sm m-4 space-y-3 rounded-2xl p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">VINCULAR ALIADO</div>
                            <button onClick={() => setIsLinkingObserver(false)} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><span className="text-white">?</span></button>
                        </div>
                        <div className="text-xs text-gray-400">Escolha o tipo de v?nculo e convide um amigo para {editableArena.name || arena.name}.</div>

                        <div className="flex gap-2 mb-2">
                            <button onClick={() => setSelectionType('mentoria')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${selectionType === 'mentoria' ?'bg-[var(--skin-accent-color)] text-black border-[var(--skin-accent-color)]' : 'bg-black/30 text-gray-400 border-white/10'}`}>Mentoria</button>
                            <button onClick={() => setSelectionType('competicao')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${selectionType === 'competicao' ?'bg-red-500 text-white border-red-500' : 'bg-black/30 text-gray-400 border-white/10'}`}>Desafio</button>
                            <button onClick={() => setSelectionType('parceria')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${selectionType === 'parceria' ?'bg-blue-500 text-white border-blue-500' : 'bg-black/30 text-gray-400 border-white/10'}`}>Parceria</button>
                        </div>
                        {selectionType === 'mentoria' && (
                            <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-400/20 rounded-xl px-3 py-2">
                                Mentoria basica entra por 🪙 100. Depois, cada nova arena compartilhada custa 🪙 50.
                            </div>
                        )}

                        {availableFriends.length === 0 ?(
                            <div className="text-center text-sm text-gray-500 py-6">Nenhum amigo com ID vÃ¡lido.</div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {availableFriends.map(friend => {
                                    return (
                                    <button
                                        key={friend.id}
                                        onClick={() => sendObserverInvite(friend, selectionType)}
                                        className="w-full p-3 rounded-xl text-left border flex items-center gap-3 bg-black/20 hover:bg-black/30 border-white/10"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                            {friend.avatarUrl ?<img src={friend.avatarUrl} alt={friend.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">ðŸ‘¤</span>}
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
                        {linkStatus && <div className="text-xs text-gray-300 bg-black/30 border border-white/10 rounded-xl p-2">{linkStatus}</div>}
                    </div>
                </div>
            )}
            {isRelationshipHubOpen && (
                <RelationshipHubModal
                    initialTab={selectionType}
                    onClose={() => setRelationshipHubOpen(false)}
                />
            )}
        </Portal>
    );
};



