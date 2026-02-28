
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
    occupant?: EnrichedClanMember;
    clanQuests?: ClanCustomQuest[];
    onClose: () => void;
    onOccupy: () => void;
    userRole: 'leader' | 'member';
    onUpdate?: () => void;
    myParticipations?: string[];
    onOptIn?: (quest: ClanCustomQuest) => void;
    allSlots?: { id: AldeiaSlotId; label: string; emoji: string }[];
}

export const ClanSlotModal: React.FC<ClanSlotModalProps> = ({ 
    clanId, 
    slotId, 
    slotLabel, 
    slotEmoji = '📌', 
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
    const { userProfile, showToast, appMode, clan } = useGame();
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
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

    useEffect(() => {
        setCustomName(slotLabel);
        setCustomEmoji(slotEmoji);
    }, [slotLabel, slotEmoji]);

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

            showToast(isBasicMode ? "Ação criada com sucesso!" : "Missão criada com sucesso!", "success");
            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            showToast(isBasicMode ? "Erro ao criar ação" : "Erro ao criar missão", "error");
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
            const newConfig = {
                ...currentConfig,
                [slotId]: { label: customName, emoji: customEmoji }
            };
            
            const { error: updateError } = await supabase
                .from('clans')
                .update({ slot_config: newConfig })
                .eq('id', clanId);
                
            if (updateError) throw updateError;

            showToast(isOfficeClan ? "Mesa atualizada!" : "Slot atualizado!", "success");
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
            
            showToast(isBasicMode ? "Ação movida com sucesso!" : "Missão movida com sucesso!", "success");
            if (onUpdate) onUpdate();
            setView('details');
            setSelectedQuestToMove(null);
        } catch (error) {
            console.error(error);
            showToast(isBasicMode ? "Erro ao mover ação" : "Erro ao mover missão", "error");
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
                                    <p className="text-xs text-gray-400">{occupant.title || 'Membro do Clã'}</p>
                                    
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
                                    <p className="text-sm text-gray-400">Esta mesa está vazia.</p>
                                </div>
                            )}
                        </div>

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

                        {/* Active Quests on this Slot */}
                        {(clanQuests.filter(q => q.slot_id === slotId && q.status !== 'completed').length > 0 || userRole === 'leader') && (
                            <div className="space-y-4">
                                <div className='relative text-center flex-shrink-0'>
                                    <hr className="border-t border-gray-800" />
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest absolute -top-2 left-1/2 -translate-x-1/2 bg-[#101010] px-3">
                                        {isBasicMode ? 'Ações de Bronze' : 'Missões de Bronze'}
                                    </h3>
                                </div>
                                
                                <div className="flex overflow-x-auto pb-4 pt-2 gap-2 snap-x hide-scrollbar">
                                    {(() => {
                                        const skinColor = getComputedStyle(document.documentElement).getPropertyValue('--skin-accent-color').trim() || '#F0C843';
                                        const bronzeColor = '#cd7f32';

                                        const quests = clanQuests.filter(q => q.slot_id === slotId && q.status !== 'completed').map(quest => {
                                            const isAssignedToMe = quest.assigned_user_id === userProfile?.id;
                                            const isLocked = quest.status === 'locked';
                                            const isParticipating = myParticipations.includes(quest.id);
                                            const isAvailable = !isLocked || (isLocked && !quest.assigned_user_id);
                                            const canAccept = !isParticipating && (isAssignedToMe || (!quest.assigned_user_id && quest.status === 'active'));
                                            
                                            const displayIcon = quest.category === 'work' ? '💼' : 
                                                              quest.category === 'meeting' ? '📅' : 
                                                              quest.category === 'report' ? '📊' : 
                                                              quest.category === 'development' ? '👨‍💻' : '✨';
                                            
                                            return (
                                                <div key={quest.id} className="relative flex-shrink-0 snap-center">
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
                                                            {canAccept ? 'Aceitar' : 
                                                                isAssignedToMe 
                                                                ? (isOfficeClan ? `${quest.current_value || 0}/${quest.target_value || 1}` : '🔒') 
                                                                : (isOfficeClan ? 'DISP' : 'FREE')
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
                                                                        
                                                                        showToast(isBasicMode ? "Ação devolvida" : "Missão devolvida", "success");
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
                                                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">Nova</span>
                                                    </button>
                                                </div>
                                            );
                                        }

                                        return quests;
                                    })()}
                                </div>
                            </div>
                        )}

                    {/* Actions */}
                    <div className="space-y-2">
                        {!occupant && (
                            <button 
                                onClick={onOccupy}
                                className="w-full py-3 rounded-xl bg-[var(--skin-accent-color)] text-black font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-lg shadow-[var(--skin-accent-color)]/20"
                            >
                                Ocupar {slotLabel}
                            </button>
                        )}
                        
                        {userRole === 'leader' && (
                            <button 
                                onClick={() => setView('edit-slot')}
                                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">🖌️</span>
                                Personalizar {isOfficeClan ? 'Mesa' : 'Slot'}
                            </button>
                        )}
                    </div>
                    </div>
                )}

                {view === 'create-quest' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--skin-accent-color)]">{isBasicMode ? 'Nova Ação' : 'Nova Missão'}</h3>
                        
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder={isBasicMode ? "Título da Ação" : "Título da Missão"} 
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
                                placeholder={isBasicMode ? "Descreva a ação..." : "Descreva a missão..."} 
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
                                    Singular
                                    <div className="text-[9px] opacity-60 normal-case mt-1">Vai para a mesa de quem aceitar</div>
                                </button>
                                <button 
                                    onClick={() => setQuestType('clan')}
                                    className={`p-3 rounded-xl border text-xs font-bold uppercase transition-all ${questType === 'clan' ? 'bg-[var(--skin-accent-color)]/20 border-[var(--skin-accent-color)] text-[var(--skin-accent-color)]' : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5'}`}
                                >
                                    <div className="text-lg mb-1">👥</div>
                                    Compartilhada
                                    <div className="text-[9px] opacity-60 normal-case mt-1">Fica no mural principal</div>
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
                                        <div className="text-[10px] text-gray-500">A missão aparecerá travada para ele</div>
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
                            <button onClick={handleCreateQuest} className="flex-[2] py-2 rounded-lg bg-[var(--skin-accent-color)] text-black text-xs font-bold hover:brightness-110">{isBasicMode ? 'Criar Ação' : 'Criar Missão'}</button>
                        </div>
                    </div>
                )}

                {view === 'edit-slot' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--skin-accent-color)]">Personalizar {isOfficeClan ? 'Mesa' : 'Slot'}</h3>
                        
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
                                placeholder={isOfficeClan ? "Nome da Mesa" : "Nome do Slot"}
                                className="w-full p-3 bg-black/30 border border-white/10 rounded-xl focus:border-[var(--skin-accent-color)] outline-none text-sm text-white"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
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
                        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400">{isBasicMode ? 'Mover Ação' : 'Mover Missão'}</h3>
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
