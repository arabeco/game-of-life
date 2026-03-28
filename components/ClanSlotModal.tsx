
import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';
import { AldeiaSlotId, EnrichedClanMember, UserProfile, ClanCustomQuest } from '../types';
import { UserAvatar } from './UserAvatar';
import { PlusIcon, XIcon, CheckIcon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
import { PlasmaCanvas } from './PlasmaCanvas';
import { supabase } from '../supabaseClient';

interface ClanSlotModalProps {
    clanId: string;
    slotId: AldeiaSlotId;
    slotLabel: string;
    slotEmoji?: string;
    slotNote?: string;
    occupant?: EnrichedClanMember;
    clanQuests?: ClanCustomQuest[];
    onClose: () => void;
    onOccupy: () => void;
    userRole: 'leader' | 'member';
    onUpdate?: () => void;
    myParticipations?: string[];
    onOptIn?: (quest: ClanCustomQuest) => void | Promise<void>;
    allSlots?: { id: AldeiaSlotId; label: string; emoji: string; note?: string }[];
}

export const ClanSlotModal: React.FC<ClanSlotModalProps> = ({ 
    clanId, 
    slotId, 
    slotLabel, 
    slotEmoji = '📌', 
    slotNote = '',
    occupant, 
    clanQuests = [],
    onClose, 
    onOccupy, 
    userRole,
    onUpdate,
    myParticipations = [],
    onOptIn,
    allSlots = []
}) => {
    const { userProfile, showToast, appMode, clan, getArenas, getActionsForArena, deleteAction } = useGame();
    const isBasicMode = appMode === 'BASIC';
    const isOfficeClan = clan?.clanType?.toLowerCase() === 'office';
    const [view, setView] = useState<'details' | 'create-quest' | 'edit-slot' | 'move-quest'>('details');
    
    // Quest State
    const [questTitle, setQuestTitle] = useState('');
    const [questDescription, setQuestDescription] = useState('');
    const [questType, setQuestType] = useState<'individual' | 'clan'>('individual');
    const [questXp, setQuestXp] = useState(50);
    const [questGold, setQuestGold] = useState(100);
    const [assignToOccupant, setAssignToOccupant] = useState(!!occupant);
    const [selectedQuestToMove, setSelectedQuestToMove] = useState<ClanCustomQuest | null>(null);
    const [slotHealth, setSlotHealth] = useState(100);

    useEffect(() => {
        const fetchSlotHealth = async () => {
            const { data } = await supabase.from('clan_aldeia_slots').select('health').eq('clan_id', clanId).eq('slot_id', slotId).single();
            if (data) setSlotHealth(data.health);
        };
        fetchSlotHealth();
    }, [clanId, slotId]);

    const handleUpdateHealth = async (newHealth: number) => {
        setSlotHealth(newHealth);
        try {
            await supabase.from('clan_aldeia_slots').update({ health: newHealth }).eq('clan_id', clanId).eq('slot_id', slotId);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
        }
    };
    
    // New Office Mode Fields
    const [questPriority, setQuestPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [questCategory, setQuestCategory] = useState('work');
    const [questDeadline, setQuestDeadline] = useState('');

    // Edit Slot State
    const [customName, setCustomName] = useState(slotLabel);
    const [customEmoji, setCustomEmoji] = useState(slotEmoji);
    const [customNote, setCustomNote] = useState(slotNote);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

    useEffect(() => {
        setCustomName(slotLabel);
        setCustomEmoji(slotEmoji);
        setCustomNote(slotNote);
    }, [slotLabel, slotEmoji, slotNote]);

    useEffect(() => {
        // Reset view when slotId changes
        setView('details');
        setSelectedQuestToMove(null);
    }, [slotId]);

    const plannerProgress = React.useMemo(() => {
        if (!occupant) return 0;
        const memberActiveQuests = clanQuests.filter(q => q.assigned_user_id === occupant.id && q.status === 'locked');
        if (memberActiveQuests.length === 0) return 0;
        const totalProgress = memberActiveQuests.reduce((acc, q) => acc + (q.current_value / Math.max(1, q.target_value)), 0);
        return Math.min(100, (totalProgress / memberActiveQuests.length) * 100);
    }, [occupant, clanQuests]);

    const slotQuests = React.useMemo(
        () => clanQuests.filter(q => q.slot_id === slotId && q.status !== 'completed'),
        [clanQuests, slotId]
    );

    const boardTitle = isOfficeClan ? 'Tarefas desta mesa' : 'Jornadas deste lugar';
    const boardEmptyText = isOfficeClan ? 'Esta mesa esta vazia.' : 'Ninguem entrou aqui ainda.';
    const slotRecadoLabel = isOfficeClan ? 'Recado desta mesa' : 'Recado deste lugar';
    const slotShellLabel = isOfficeClan ? 'Mesa' : 'Lugar';
    const createEntryLabel = isOfficeClan ? 'Nova tarefa' : 'Nova jornada';
    const getMissionTypeLabel = (quest: ClanCustomQuest) => quest.mission_type === 'singular' ? 'Individual' : 'Coletiva';
    const getPrimaryActionLabel = (_quest: ClanCustomQuest, _isParticipating: boolean) => 'Ver';

    const findRuntimeQuestAction = (quest: ClanCustomQuest) => {
        const marker = `clan_quest:${quest.id}`;
        return getArenas()
            .flatMap(arena => getActionsForArena(arena.id))
            .find(action => {
                const context = action.context as (typeof action.context & {
                    clanTask?: {
                        missionId?: string;
                    };
                }) | undefined;
                return action.originCodexId === marker || context?.clanTask?.missionId === quest.id;
            });
    };

    const handleQuestEntry = async (quest: ClanCustomQuest) => {
        const isAssignedToMe = quest.assigned_user_id === userProfile?.id;
        const isParticipating = myParticipations.includes(quest.id);
        const canAccept = !isParticipating && (isAssignedToMe || (!quest.assigned_user_id && quest.status === 'active'));

        if (isParticipating) {
            openQuestInApp(quest);
            return;
        }

        if (!canAccept) return;

        await onOptIn?.(quest);
        window.setTimeout(() => openQuestInApp(quest), 180);
    };

    const openQuestInApp = (quest: ClanCustomQuest, attempt: number = 0) => {
        const runtimeAction = findRuntimeQuestAction(quest);
        if (!runtimeAction) {
            if (attempt < 1) {
                window.setTimeout(() => openQuestInApp(quest, attempt + 1), 220);
                return;
            }
            showToast('Essa acao ainda nao foi instalada no seu app.', 'info');
            return;
        }

        window.dispatchEvent(new CustomEvent('tutorialNavigate', {
            detail: {
                view: 'arenas',
                showArenaId: runtimeAction.arenaId,
            },
        }));
        onClose();
    };

    const handleDeleteQuest = async (quest: ClanCustomQuest) => {
        if (userRole !== 'leader') return;
        if (!window.confirm(`Apagar a tarefa "${quest.title}"?`)) return;

        try {
            const runtimeAction = findRuntimeQuestAction(quest);

            if (runtimeAction) {
                await deleteAction(runtimeAction.id);
            }

            await supabase
                .from('clan_mission_participants')
                .delete()
                .eq('clan_id', clanId)
                .eq('mission_id', quest.id);

            const { error } = await supabase
                .from('clan_custom_quests')
                .delete()
                .eq('clan_id', clanId)
                .eq('id', quest.id);

            if (error) throw error;

            showToast('Tarefa apagada com sucesso!', 'success');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            showToast('Erro ao apagar tarefa', 'error');
        }
    };

    const handleCreateQuest = async () => {
        if (!questTitle.trim()) return showToast("Título obrigatório", "error");
        
        try {
            const isAssigned = questType === 'individual' && assignToOccupant && occupant;
            const targetSlotId = (isBasicMode && questType === 'clan') ? 'fogueira' : slotId;
            
            const { error } = await supabase.from('clan_custom_quests').insert({
                clan_id: clanId,
                creator_id: userProfile?.id,
                title: questTitle,
                description: questDescription,
                mission_type: questType === 'individual' ? 'singular' : 'shared',
                slot_id: targetSlotId,
                status: isAssigned ? 'locked' : 'active',
                assigned_user_id: isAssigned ? occupant.id : null,
                reward_xp: questXp,
                reward_gold: questGold,
                priority: questPriority,
                category: questCategory,
                due_date: questDeadline || null
            });

            if (error) throw error;

            showToast("Tarefa criada com sucesso!", "success");
            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Erro ao criar tarefa", "error");
        }
    };

    const handleSaveSlot = async () => {
        try {
            // Fetch current config
            const { data: clanData, error: fetchError } = await supabase
                .from('clans')
                .select('slot_config')
                .eq('id', clanId)
                .single();
                
            if (fetchError) throw fetchError;
            
            const currentConfig = clanData.slot_config || {};
            const existingSlotConfig = currentConfig[slotId] || {};
            const newConfig = {
                ...currentConfig,
                [slotId]: {
                    ...existingSlotConfig,
                    label: customName,
                    emoji: customEmoji,
                    note: customNote.trim()
                }
            };
            
            const { error: updateError } = await supabase
                .from('clans')
                .update({ slot_config: newConfig })
                .eq('id', clanId);
                
            if (updateError) throw updateError;

            showToast(isOfficeClan ? "Mesa atualizada!" : "Espaco atualizado!", "success");
            if (onUpdate) onUpdate();
            setView('details');
        } catch (error) {
            console.error(error);
            showToast("Erro ao salvar alterações", "error");
        }
    };

    const handleMoveQuest = async (targetSlotId: string) => {
        if (!selectedQuestToMove) return;
        
        try {
            const { error } = await supabase
                .from('clan_custom_quests')
                .update({ slot_id: targetSlotId })
                .eq('id', selectedQuestToMove.id);
                
            if (error) throw error;
            
            showToast("Tarefa movida com sucesso!", "success");
            if (onUpdate) onUpdate();
            setView('details');
            setSelectedQuestToMove(null);
        } catch (error) {
            console.error(error);
            showToast("Erro ao mover tarefa", "error");
        }
    };

    return (
        <Portal>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[20000] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 p-5 space-y-4 relative" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className="text-2xl">{customEmoji}</div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{customName}</h2>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">{occupant ? 'Ocupado' : 'Disponível'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><XIcon className="w-5 h-5"/></button>
                </div>

                {/* Content */}
                {view === 'details' && (
                    <div className="space-y-6">
                        {/* Occupant Status */}
                        <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-2xl border border-white/5">
                            {occupant ? (
                                <>
                                    <div className="relative mb-2">
                                        <UserAvatar profile={occupant} size="lg" />
                                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full text-black">Online</div>
                                    </div>
                                    <h3 className="font-bold text-lg">{occupant.nickname}</h3>
                                    <p className="text-xs text-gray-400">{occupant.title || 'Pessoa do Grupo'}</p>
                                    
                                    {/* Planner Progress Bar */}
                                    <div className="w-full max-w-[150px] mt-3 space-y-1">
                                        <div className="flex justify-between text-[10px] text-gray-400">
                                            <span>Planner</span>
                                            <span>{Math.floor(plannerProgress)}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--skin-accent-color)] transition-all duration-500" style={{ width: `${plannerProgress}%` }}></div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 border border-dashed border-white/20">
                                        <span className="text-2xl opacity-50">{slotEmoji}</span>
                                    </div>
                                    <p className="text-sm text-gray-400">{boardEmptyText}</p>
                                </div>
                            )}
                        </div>

                        {customNote.trim() && (
                            <div className="space-y-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    {slotRecadoLabel}
                                </div>
                                <p className="text-sm text-gray-200 leading-relaxed">{customNote}</p>
                            </div>
                        )}

                        {/* Leader Editable Health Bar (Office Mode) */}
                        {isOfficeClan && userRole === 'leader' && slotId !== 'trono' && (
                            <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Produtividade: {slotLabel}</h4>
                                    <span className={`text-xs font-bold ${slotHealth >= 80 ? 'text-green-400' : slotHealth >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {slotHealth >= 80 ? 'Alta' : slotHealth >= 40 ? 'Média' : 'Baixa'}
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={slotHealth} 
                                    onChange={(e) => handleUpdateHealth(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-black/50 rounded-full appearance-none cursor-pointer accent-[var(--skin-accent-color)]"
                                />
                                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                                    <span>0%</span>
                                    <span>{slotHealth}%</span>
                                    <span>100%</span>
                                </div>
                                <p className="text-[9px] text-center text-gray-500 italic">O Diretor define manualmente a produtividade desta mesa.</p>
                            </div>
                        )}

                        {/* Active Group Tasks on this Slot */}
                        {(slotQuests.length > 0 || userRole === 'leader') && (
                            <div className="space-y-4">
                                <div className='relative text-center flex-shrink-0'>
                                    <hr className="border-t border-gray-800" />
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest absolute -top-2 left-1/2 -translate-x-1/2 bg-[#101010] px-3">
                                        {boardTitle}
                                    </h3>
                                </div>
                                
                                <div className={isOfficeClan ? 'hidden' : 'flex overflow-x-auto pb-4 pt-2 gap-2 snap-x hide-scrollbar'}>
                                    {(() => {
                                        const skinColor = getComputedStyle(document.documentElement).getPropertyValue('--skin-accent-color').trim() || '#F0C843';
                                        const bronzeColor = '#cd7f32';

                                        const quests = slotQuests.map(quest => {
                                            const isAssignedToMe = quest.assigned_user_id === userProfile?.id;
                                            const isLocked = quest.status === 'locked';
                                            const isParticipating = myParticipations.includes(quest.id);
                                            const canAccept = !isParticipating && (isAssignedToMe || (!quest.assigned_user_id && quest.status === 'active'));
                                            
                                            const displayIcon = quest.category === 'work' ? '💼' : 
                                                              quest.category === 'meeting' ? '📅' : 
                                                              quest.category === 'report' ? '📊' : 
                                                              quest.category === 'development' ? '👨‍💻' : '✨';
                                            
                                            return (
                                                <div
                                                    key={quest.id}
                                                    className={`relative flex-shrink-0 snap-center ${(canAccept || isParticipating) ? 'cursor-pointer' : ''}`}
                                                    onClick={() => {
                                                        if (!canAccept && !isParticipating) return;
                                                        void handleQuestEntry(quest);
                                                    }}
                                                >
                                                    {/* Card */}
                                                    <div className={`relative w-28 h-28 rounded-2xl flex flex-col items-center justify-center p-2 transition-all duration-300 overflow-hidden group
                                                        ${isOfficeClan ? 'bg-amber-900/20 border border-amber-800/30' : 'bg-gray-900/80 border border-white/10'}
                                                    `}>
                                                        {/* Plasma Background */}
                                                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                                                            <PlasmaCanvas 
                                                                color={isOfficeClan ? bronzeColor : skinColor}
                                                                opacity={0.5}
                                                                className="w-full h-full"
                                                            />
                                                        </div>

                                                        {/* Status Icon */}
                                                        <div className="text-2xl mb-1 relative z-10 drop-shadow-lg filter brightness-110">
                                                            {displayIcon}
                                                        </div>
                                                        
                                                        {/* Title */}
                                                        <div className={`text-[10px] font-bold text-center leading-tight line-clamp-2 z-10 w-full px-1 ${isOfficeClan ? 'text-amber-100' : 'text-gray-200'}`}>
                                                            {quest.title}
                                                        </div>

                                                        {/* Reward */}
                                                        <div className="mt-1 text-[9px] font-mono text-[var(--skin-accent-color)] z-10 bg-black/40 px-1.5 py-0.5 rounded">
                                                            +{quest.xp_reward}XP
                                                        </div>

                                                        {/* Status Overlay */}
                                                        {isLocked && (
                                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                                                                <span className="text-xs">🔒</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Accept Button Overlay */}
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (canAccept) {
                                                                onOptIn?.(quest);
                                                            } else if (isAssignedToMe) {
                                                                // View details?
                                                            }
                                                        }}
                                                        disabled={!canAccept && !isAssignedToMe}
                                                        className={`absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl gap-2
                                                            ${!canAccept && !isAssignedToMe ? 'cursor-not-allowed' : 'cursor-pointer'}
                                                        `}>
                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-white">
                                                            {canAccept ? getPrimaryActionLabel(quest, false) : 
                                                                isAssignedToMe 
                                                                ? (isOfficeClan ? `${quest.current_value || 0}/${quest.target_value || 1}` : '🔒') 
                                                                : (quest.mission_type === 'singular' ? 'Com alguem' : 'Ativa')
                                                            }
                                                        </div>

                                                        {quest.priority === 'urgent' && (
                                                            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                                                        )}
                                                    </button>

                                                    {/* Devolver/Cancelar button below - only if assigned to me */}
                                                    <div className="mt-2 flex flex-col gap-1 items-center">
                                                        {(isAssignedToMe || (userRole === 'leader' && isLocked)) && (
                                                            <button 
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const updateData: any = { status: 'active', assigned_user_id: null };
                                                                        if (isBasicMode && quest.mission_type === 'singular') {
                                                                            updateData.slot_id = 'fogueira';
                                                                        }
                                                                        const { error } = await supabase.from('clan_custom_quests').update(updateData).eq('id', quest.id);
                                                                        if (error) throw error;
                                                                        
                                                                        // Delete participation records
                                                                        if (isAssignedToMe) {
                                                                            await supabase.from('clan_mission_participants').delete().eq('mission_id', quest.id).eq('user_id', userProfile?.id);
                                                                        } else if (userRole === 'leader') {
                                                                            await supabase.from('clan_mission_participants').delete().eq('mission_id', quest.id);
                                                                        }
                                                                        
                                                                        showToast("Tarefa devolvida", "success");
                                                                        if (onUpdate) onUpdate();
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                        showToast("Erro ao processar", "error");
                                                                    }
                                                                }}
                                                                className={`w-full py-1 px-4 rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm
                                                                    ${isOfficeClan 
                                                                        ? 'bg-red-600/20 text-red-200 border border-red-500/30 hover:bg-red-600/40' 
                                                                        : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                                                    }`}
                                                            >
                                                                {isBasicMode ? 'Devolver' : 'Cancelar'}
                                                            </button>
                                                        )}

                                                        {userRole === 'leader' && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedQuestToMove(quest);
                                                                    setView('move-quest');
                                                                }}
                                                                className={`w-full py-1 px-4 rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm
                                                                    ${isOfficeClan 
                                                                        ? 'bg-blue-600/20 text-blue-200 border border-blue-500/30 hover:bg-blue-600/40' 
                                                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                                                                    }`}
                                                            >
                                                                Mover
                                                            </button>
                                                        )}
                                                        {userRole === 'leader' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    void handleDeleteQuest(quest);
                                                                }}
                                                                className="w-full py-1 px-4 rounded-lg text-[9px] font-bold uppercase transition-all shadow-sm bg-red-900/25 text-red-200 border border-red-500/30 hover:bg-red-900/40"
                                                            >
                                                                Excluir
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        });

                                        if (userRole === 'leader') {
                                            quests.push(
                                                <div key="add-quest-btn" className="relative flex-shrink-0 snap-center">
                                                    <button 
                                                        onClick={() => setView('create-quest')}
                                                        className={`w-24 h-24 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center text-center gap-2
                                                            ${isOfficeClan 
                                                                ? 'border-amber-800/40 text-amber-700 hover:bg-amber-900/10' 
                                                                : 'border-white/10 text-gray-500 hover:bg-white/5'
                                                            }
                                                        `}
                                                    >
                                                        <PlusIcon className="w-6 h-6 opacity-50" />
                                                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">{createEntryLabel}</span>
                                                    </button>
                                                </div>
                                            );
                                        }

                                        return quests;
                                    })()}
                                </div>
                                {isOfficeClan && (
                                    <div className="space-y-3 pt-2">
                                        {slotQuests.map((quest) => {
                                            const isAssignedToMe = quest.assigned_user_id === userProfile?.id;
                                            const isLocked = quest.status === 'locked';
                                            const isParticipating = myParticipations.includes(quest.id);
                                            const canAccept = !isParticipating && (isAssignedToMe || (!quest.assigned_user_id && quest.status === 'active'));
                                            const displayIcon = quest.category === 'work' ? '💼'
                                                : quest.category === 'meeting' ? '📅'
                                                    : quest.category === 'report' ? '📊'
                                                        : quest.category === 'development' ? '👨‍💻'
                                                            : '✨';

                                            return (
                                                <div key={`office-${quest.id}`} className="rounded-2xl border border-amber-800/30 bg-amber-950/20 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-700/30 bg-black/25 text-2xl">
                                                            {displayIcon}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-sm font-bold text-amber-100">{quest.title}</div>
                                                            <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/62">
                                                                {quest.description || 'Tarefa da mesa.'}
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">
                                                                <span className={`rounded border px-2 py-1 ${quest.mission_type === 'singular' ? 'border-purple-500/30 bg-purple-500/10 text-purple-200' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'}`}>
                                                                    {getMissionTypeLabel(quest)}
                                                                </span>
                                                                <span className="rounded border border-white/10 bg-black/20 px-2 py-1 text-white/75">
                                                                    {quest.current_value || 0}/{quest.target_value || 1}
                                                                </span>
                                                                {quest.priority === 'urgent' && (
                                                                    <span className="rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-300">
                                                                        Urgente
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 space-y-2">
                                                        {!isParticipating ? (
                                                            <button
                                                                onClick={async () => {
                                                                    if (!canAccept) return;
                                                                    await handleQuestEntry(quest);
                                                                }}
                                                                disabled={!canAccept}
                                                                className={`w-full rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                                    canAccept
                                                                        ? 'border border-[var(--skin-accent-color)]/30 bg-[var(--skin-accent-color)]/15 text-[var(--skin-accent-color)] hover:bg-[var(--skin-accent-color)]/20'
                                                                        : 'border border-white/10 bg-black/20 text-white/35 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                {getPrimaryActionLabel(quest, false)}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleQuestEntry(quest)}
                                                                className="w-full rounded-xl border border-purple-500/30 bg-purple-900/30 py-2.5 text-[10px] font-bold uppercase tracking-wider text-purple-200 hover:bg-purple-900/45"
                                                            >
                                                                Ver
                                                            </button>
                                                        )}

                                                        {(isAssignedToMe || (userRole === 'leader' && isLocked)) ? (
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        const updateData: any = { status: 'active', assigned_user_id: null };
                                                                        if (isBasicMode && quest.mission_type === 'singular') updateData.slot_id = 'fogueira';
                                                                        const { error } = await supabase.from('clan_custom_quests').update(updateData).eq('id', quest.id);
                                                                        if (error) throw error;
                                                                        if (isAssignedToMe) {
                                                                            await supabase.from('clan_mission_participants').delete().eq('mission_id', quest.id).eq('user_id', userProfile?.id);
                                                                        } else if (userRole === 'leader') {
                                                                            await supabase.from('clan_mission_participants').delete().eq('mission_id', quest.id);
                                                                        }
                                                                        showToast('Tarefa devolvida', 'success');
                                                                        if (onUpdate) onUpdate();
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                        showToast('Erro ao processar', 'error');
                                                                    }
                                                                }}
                                                                className="w-full rounded-xl border border-red-500/30 bg-red-600/15 py-2.5 text-[10px] font-bold uppercase tracking-wider text-red-200 hover:bg-red-600/25"
                                                            >
                                                                {isBasicMode ? 'Devolver' : 'Cancelar'}
                                                            </button>
                                                        ) : (
                                                            <div className="w-full rounded-xl border border-white/8 bg-black/15 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-white/35">
                                                                {canAccept ? 'Pronta' : 'Indisponivel'}
                                                            </div>
                                                        )}

                                                        {userRole === 'leader' && (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedQuestToMove(quest);
                                                                        setView('move-quest');
                                                                    }}
                                                                    className="rounded-xl border border-blue-500/30 bg-blue-600/15 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-200 hover:bg-blue-600/25"
                                                                >
                                                                    Mover
                                                                </button>
                                                                <button
                                                                    onClick={() => void handleDeleteQuest(quest)}
                                                                    className="rounded-xl border border-red-500/30 bg-red-900/35 py-2 text-[10px] font-bold uppercase tracking-wider text-red-200 hover:bg-red-900/50"
                                                                >
                                                                    Excluir
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {userRole === 'leader' && (
                                            <button
                                                onClick={() => setView('create-quest')}
                                                className="w-full min-h-[88px] rounded-xl border-2 border-dashed border-amber-800/40 text-amber-700 transition-all hover:bg-amber-900/10"
                                            >
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <PlusIcon className="w-6 h-6 opacity-50" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{createEntryLabel}</span>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    {/* Actions */}
                    <div className="space-y-2">
                        {!occupant && (
                            <button 
                                onClick={onOccupy}
                                className="w-full py-3 rounded-xl bg-[var(--skin-accent-color)] text-black font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-[var(--skin-accent-color)]/20"
                            >
                                Entrar aqui
                            </button>
                        )}
                        
                        {userRole === 'leader' && (
                            <button 
                                onClick={() => setView('edit-slot')}
                                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">🖌️</span>
                                Personalizar {slotShellLabel}
                            </button>
                        )}
                    </div>
                    </div>
                )}

                {view === 'create-quest' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--skin-accent-color)]">{createEntryLabel}</h3>
                        
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Titulo da Tarefa"
                                className="w-full p-3 bg-black/30 border border-white/10 rounded-xl focus:border-[var(--skin-accent-color)] outline-none text-sm text-white"
                                value={questTitle}
                                onChange={e => setQuestTitle(e.target.value)}
                            />
                            
                            <div className="grid grid-cols-2 gap-2">
                                <select 
                                    className="p-3 bg-black/30 border border-white/10 rounded-xl focus:border-[var(--skin-accent-color)] outline-none text-sm text-gray-300"
                                    value={questPriority}
                                    onChange={e => setQuestPriority(e.target.value as any)}
                                >
                                    <option value="low">Prioridade: Baixa</option>
                                    <option value="medium">Prioridade: Média</option>
                                    <option value="high">Prioridade: Alta</option>
                                    <option value="urgent">Prioridade: Urgente</option>
                                </select>
                                
                                <select 
                                    className="p-3 bg-black/30 border border-white/10 rounded-xl focus:border-[var(--skin-accent-color)] outline-none text-sm text-gray-300"
                                    value={questCategory}
                                    onChange={e => setQuestCategory(e.target.value)}
                                >
                                    <option value="work">Trabalho</option>
                                    <option value="meeting">Reunião</option>
                                    <option value="report">Relatório</option>
                                    <option value="development">Desenvolvimento</option>
                                </select>
                            </div>

                            <input 
                                type="datetime-local" 
                                className="w-full p-3 bg-black/30 border border-white/10 rounded-xl focus:border-[var(--skin-accent-color)] outline-none text-sm text-gray-300"
                                value={questDeadline}
                                onChange={e => setQuestDeadline(e.target.value)}
                            />

                            <textarea 
                                placeholder="Descreva a tarefa..."
                                rows={3}
                                className="w-full p-3 bg-black/30 border border-white/10 rounded-xl focus:border-[var(--skin-accent-color)] outline-none text-sm"
                                value={questDescription}
                                onChange={e => setQuestDescription(e.target.value)}
                            />
                            
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setQuestType('individual')}
                                    className={`p-3 rounded-xl border text-xs font-bold uppercase transition-all ${questType === 'individual' ? 'bg-[var(--skin-accent-color)]/20 border-[var(--skin-accent-color)] text-[var(--skin-accent-color)]' : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="text-lg mb-1">👤</div>
                                    Individual
                                    <div className="text-[9px] opacity-60 normal-case mt-1">Fica atribuida a uma pessoa</div>
                                </button>
                                <button 
                                    onClick={() => setQuestType('clan')}
                                    className={`p-3 rounded-xl border text-xs font-bold uppercase transition-all ${questType === 'clan' ? 'bg-[var(--skin-accent-color)]/20 border-[var(--skin-accent-color)] text-[var(--skin-accent-color)]' : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="text-lg mb-1">👥</div>
                                    Coletiva
                                    <div className="text-[9px] opacity-60 normal-case mt-1">Fica aberta para contribuicao coletiva</div>
                                </button>
                            </div>

                            {questType === 'individual' && occupant && (
                                <div 
                                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${assignToOccupant ? 'bg-green-500/10 border-green-500/30' : 'bg-black/30 border-white/5'}`}
                                    onClick={() => setAssignToOccupant(!assignToOccupant)}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${assignToOccupant ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                                        {assignToOccupant && <CheckIcon className="w-3 h-3 text-black" />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-200">Atribuir para {occupant.nickname}</div>
                                        <div className="text-[10px] text-gray-500">A tarefa ficara reservada para essa pessoa</div>
                                    </div>
                                </div>
                            )}

                            {isBasicMode && (
                                <div className="space-y-3 pt-2 border-t border-white/5 mt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Prioridade</label>
                                            <select 
                                                className="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-xs text-white outline-none"
                                                value={questPriority}
                                                onChange={e => setQuestPriority(e.target.value as any)}
                                            >
                                                <option value="low">Baixa</option>
                                                <option value="medium">Média</option>
                                                <option value="high">Alta</option>
                                                <option value="urgent">Urgente</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Categoria</label>
                                            <select 
                                                className="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-xs text-white outline-none"
                                                value={questCategory}
                                                onChange={e => setQuestCategory(e.target.value)}
                                            >
                                                <option value="work">💼 Trabalho</option>
                                                <option value="meeting">📅 Reunião</option>
                                                <option value="report">📊 Relatório</option>
                                                <option value="development">👨‍💻 Dev</option>
                                                <option value="other">✨ Outro</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Prazo (Deadline)</label>
                                        <input 
                                            type="datetime-local" 
                                            className="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-xs text-white outline-none"
                                            value={questDeadline}
                                            onChange={e => setQuestDeadline(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setView('details')} className="flex-1 py-2 rounded-lg bg-white/5 text-gray-400 text-xs font-bold hover:bg-white/10">Voltar</button>
                            <button onClick={handleCreateQuest} className="flex-[2] py-2 rounded-lg bg-[var(--skin-accent-color)] text-black text-xs font-bold hover:brightness-110">Criar Tarefa</button>
                        </div>
                    </div>
                )}

                {view === 'edit-slot' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--skin-accent-color)]">Personalizar {slotShellLabel}</h3>
                        
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-2">
                                <button 
                                    onClick={() => setIsIconPickerOpen(true)}
                                    className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl hover:bg-white/10 transition-all"
                                >
                                    {customEmoji}
                                </button>
                                <span className="text-[10px] text-gray-500 uppercase font-bold">Alterar Ícone</span>
                            </div>

                            <input 
                                type="text" 
                                placeholder={isOfficeClan ? "Nome da Mesa" : "Nome do Lugar"}
                                className="w-full p-3 bg-black/30 border border-white/10 rounded-xl focus:border-[var(--skin-accent-color)] outline-none text-sm text-white"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                            />

                            <textarea
                                rows={3}
                                placeholder={isOfficeClan ? "Recado desta mesa..." : "Recado deste lugar..."}
                                className="w-full p-3 bg-black/30 border border-white/10 rounded-xl focus:border-[var(--skin-accent-color)] outline-none text-sm text-white resize-none"
                                value={customNote}
                                onChange={e => setCustomNote(e.target.value)}
                            />

                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={() => setView('details')}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold uppercase text-xs"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveSlot}
                                    className="flex-1 py-3 rounded-xl bg-[var(--skin-accent-color)] text-black font-bold uppercase text-xs"
                                >
                                    Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'move-quest' && selectedQuestToMove && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400">Mover Tarefa</h3>
                        <p className="text-xs text-gray-400">Selecione a nova mesa para: <span className="text-white font-bold">{selectedQuestToMove.title}</span></p>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {allSlots.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleMoveQuest(s.id)}
                                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${s.id === slotId ? 'bg-white/5 border-white/20 opacity-50 cursor-not-allowed' : 'bg-black/20 border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5'}`}
                                    disabled={s.id === slotId}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{s.emoji}</span>
                                        <span className="text-sm font-medium text-gray-200">{s.label}</span>
                                    </div>
                                    {s.id === slotId && <span className="text-[10px] text-gray-500 font-bold uppercase">Atual</span>}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={() => { setView('details'); setSelectedQuestToMove(null); }}
                            className="w-full py-3 rounded-xl bg-white/5 text-gray-400 font-bold uppercase text-xs"
                        >
                            Cancelar
                        </button>
                    </div>
                )}

                {isIconPickerOpen && (
                    <IconPickerModal 
                        onSelect={(icon) => { setCustomEmoji(icon); setIsIconPickerOpen(false); }} 
                        onClose={() => setIsIconPickerOpen(false)} 
                    />
                )}

            </GlassCard>
        </div>
        </Portal>
    );
};
