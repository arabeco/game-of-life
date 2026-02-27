
import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';
import { AldeiaSlotId, EnrichedClanMember, UserProfile, ClanCustomQuest } from '../types';
import { UserAvatar } from './UserAvatar';
import { PlusIcon, XIcon, CheckIcon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
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
    const isOffice = clan?.clanType?.toLowerCase() === 'office' || appMode === 'OFFICE';
    const [view, setView] = useState<'details' | 'create-quest' | 'edit-slot' | 'move-quest'>('details');
    
    // Quest State
    const [questTitle, setQuestTitle] = useState('');
    const [questDescription, setQuestDescription] = useState('');
    const [questType, setQuestType] = useState<'individual' | 'clan'>('individual');
    const [questXp, setQuestXp] = useState(50);
    const [questGold, setQuestGold] = useState(100);
    const [assignToOccupant, setAssignToOccupant] = useState(!!occupant);
    const [selectedQuestToMove, setSelectedQuestToMove] = useState<ClanCustomQuest | null>(null);
    
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
            const targetSlotId = (isOffice && questType === 'clan') ? 'fogueira' : slotId;
            
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

            showToast("Missão criada com sucesso!", "success");
            if (onUpdate) onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            showToast("Erro ao criar missão", "error");
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

            showToast("Mesa atualizada!", "success");
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
            
            showToast(isOffice ? "Ação movida com sucesso!" : "Missão movida com sucesso!", "success");
            if (onUpdate) onUpdate();
            setView('details');
            setSelectedQuestToMove(null);
        } catch (error) {
            console.error(error);
            showToast(isOffice ? "Erro ao mover ação" : "Erro ao mover missão", "error");
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

                        {/* Active Quests on this Slot */}
                        {clanQuests.filter(q => q.slot_id === slotId && q.status !== 'completed').length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Missões na Mesa</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                                    {clanQuests.filter(q => q.slot_id === slotId && q.status !== 'completed').map(quest => {
                                        const isAssignedToMe = quest.assigned_user_id === userProfile?.id;
                                        const isLocked = quest.status === 'locked';
                                        const isParticipating = myParticipations.includes(quest.id);
                                        
                                        return (
                                            <div key={quest.id} className={`bg-black/30 rounded-xl p-3 border ${quest.priority === 'urgent' ? 'border-red-500/50' : 'border-white/5'} relative group`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-purple-500' : 'bg-green-500'}`} />
                                                        <span className="text-sm font-bold text-gray-200">{quest.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {quest.priority === 'urgent' && <span className="text-[10px] text-red-500 font-bold uppercase">URGENTE</span>}
                                                        {quest.priority === 'high' && <span className="text-[10px] text-orange-400 font-bold uppercase">ALTA</span>}
                                                        {isLocked && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">Travada</span>}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-2 mb-2">{quest.description}</p>
                                                
                                                {quest.due_date && (
                                                    <div className="flex items-center gap-1 mb-2 text-[10px] text-gray-500">
                                                        <span>🕒</span>
                                                        <span>{new Date(quest.due_date).toLocaleString()}</span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex gap-2">
                                                    {(isAssignedToMe || (!quest.assigned_user_id && quest.status === 'active')) && !isParticipating && (
                                                        <button 
                                                            onClick={() => onOptIn?.(quest)}
                                                            className="flex-1 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase hover:bg-green-500/20"
                                                        >
                                                            {isOffice ? 'Pegar Ação' : 'Aceitar'}
                                                        </button>
                                                    )}
                                                    
                                                    {(userRole === 'leader' || isAssignedToMe) && (
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedQuestToMove(quest);
                                                                setView('move-quest');
                                                            }}
                                                            className="flex-1 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase hover:bg-blue-500/20"
                                                        >
                                                            Mover
                                                        </button>
                                                    )}
                                                    
                                                    {(isAssignedToMe || userRole === 'leader') && (
                                                        <button 
                                                            onClick={async () => {
                                                                // Logic to return/abort mission
                                                                try {
                                                                    // If singular, return to central table (fogueira)
                                                                    const updateData: any = { status: 'active', assigned_user_id: null };
                                                                    if (isOffice && quest.mission_type === 'singular') {
                                                                        updateData.slot_id = 'fogueira';
                                                                    }

                                                                    const { error } = await supabase
                                                                        .from('clan_custom_quests')
                                                                        .update(updateData)
                                                                        .eq('id', quest.id);
                                                                    if (error) throw error;
                                                                    
                                                                    // Also remove participation
                                                                    if (isAssignedToMe) {
                                                                        await supabase.from('clan_mission_participants').delete().eq('mission_id', quest.id).eq('user_id', userProfile?.id);
                                                                    } else if (userRole === 'leader') {
                                                                        // Leader can remove anyone's participation for this mission
                                                                        await supabase.from('clan_mission_participants').delete().eq('mission_id', quest.id);
                                                                    }
                                                                    
                                                                    showToast(isOffice ? "Ação devolvida para a mesa central" : "Missão devolvida para a fogueira", "success");
                                                                    if (onUpdate) onUpdate();
                                                                } catch (e) {
                                                                    console.error(e);
                                                                    showToast(isOffice ? "Erro ao devolver ação" : "Erro ao devolver missão", "error");
                                                                }
                                                            }}
                                                            className="flex-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase hover:bg-red-500/20"
                                                        >
                                                            {isParticipating ? (isOffice ? 'Desistir' : 'Desistir') : (isOffice ? 'Devolver' : 'Recusar')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                                    Ocupar Mesa
                                </button>
                            )}
                            
                            {userRole === 'leader' && (
                                <>
                                    <button 
                                        onClick={() => setView('create-quest')}
                                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        {isOffice ? 'Nova Ação' : 'Adicionar Missão'}
                                    </button>
                                    <button 
                                        onClick={() => setView('edit-slot')}
                                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="text-lg">🖌️</span>
                                        Personalizar Mesa
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {view === 'create-quest' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--skin-accent-color)]">{isOffice ? 'Nova Ação' : 'Nova Missão'}</h3>
                        
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Título da Missão" 
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
                                placeholder="Descrição..." 
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

                            {isOffice && (
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
                            <button onClick={handleCreateQuest} className="flex-[2] py-2 rounded-lg bg-[var(--skin-accent-color)] text-black text-xs font-bold hover:brightness-110">{isOffice ? 'Criar Ação' : 'Criar Missão'}</button>
                        </div>
                    </div>
                )}

                {view === 'edit-slot' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--skin-accent-color)]">Personalizar Mesa</h3>
                        
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
                                placeholder="Nome da Mesa" 
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
                        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400">{isOffice ? 'Mover Ação' : 'Mover Missão'}</h3>
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
