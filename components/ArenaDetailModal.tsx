import React, { useState, useRef, useEffect } from 'react';
import { Arena, Action, UserProfile } from '../types';
import { useGame } from '../contexts/GameContext';
import { PlusIcon, EditIcon, CheckIcon, LinkIcon, Trash2Icon, UsersIcon, CloseIcon, SendIcon } from './Icons';
import { ActionModal } from './ActionModal';
import { IconPickerModal } from './IconPickerModal';
import { ConfirmationModal } from './ConfirmationModal';
import { Portal } from './Portal';
import { PlasmaCanvas } from './PlasmaCanvas';
import { supabase } from '../supabaseClient';

const ActionSquare: React.FC<{ action: Action, onClick: () => void; skinColor: string }> = ({ action, onClick, skinColor }) => {
    const { getActionBackgroundStyle, tasks, getArenas, getClanQuestProgress, getClanQuestForActionName } = useGame();
    const backgroundStyle = getActionBackgroundStyle(action.id);
    
    const completedCount = tasks.filter(t => t.actionId === action.id && t.completed).length;
    const totalProposed = action.repetitions;
    const arena = getArenas().find(ar => ar.id === action.arenaId);
    const normalizedArena = arena?.name ? arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
    const isSeasonQuest = normalizedArena.includes('quests - season');
    
    const clanQuest = getClanQuestForActionName(action.name);
    const isClanQuest = !!clanQuest;
    
    const clanProgress = clanQuest ? getClanQuestProgress(clanQuest.id) : 0;
    const target = clanQuest?.requirements?.clanGoal || clanQuest?.goal_value || 50;
    const displayProgress = clanQuest ? `${clanProgress}/${target}` : `${completedCount}/${totalProposed}`;
    const displayIcon = action.icon || '🏆';

    return (
        <div className="relative flex-shrink-0">
            <button 
                onClick={onClick}
                style={isClanQuest ? {
                    backgroundColor: 'rgba(88, 28, 135, 0.4)', // Purple-900/40
                    borderColor: '#a855f7', // Purple-500
                    boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)'
                } : backgroundStyle}
                className={`relative w-24 h-24 border rounded-xl hover:opacity-80 transition-all overflow-hidden ${isClanQuest ? 'border-purple-500' : 'border-[var(--skin-accent-color)]'}`}
            >
                <div className="arena-plasma">
                    <PlasmaCanvas color={isClanQuest ? '#a855f7' : skinColor} opacity={isClanQuest ? 0.3 : 0.189} className="arena-plasma-canvas" />
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-1 space-y-1">
                    <span className="text-3xl">{displayIcon}</span>
                    <p className="text-xs font-bold leading-tight line-clamp-2 text-white">{action.name}</p>
                </div>
            </button>
            <div className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none border ${isClanQuest ? 'bg-purple-900/80 text-purple-200 border-purple-500/30' : 'bg-black/50 text-white border-white/10'}`}>
                <span>{displayProgress}</span>
            </div>
        </div>
    );
};

export const ArenaDetailModal: React.FC<{ arena: Arena, onClose: () => void }> = ({ arena, onClose }) => {
    const { getActionsForArena, assets, updateArena, deleteArena, tasks, getActionBackgroundStyle, friends, getClanQuestProgress, clanQuestParticipants, fetchClanQuestParticipants, joinClanMission, getClanQuestsForArena, seasonQuests } = useGame();
    const [actionModalState, setActionModalState] = useState<{ action: Action | null, mode: 'view' | 'edit', key: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableArena, setEditableArena] = useState({ name: arena.name, description: arena.description, icon: arena.icon });
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [isLinkingObserver, setIsLinkingObserver] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [linkStatus, setLinkStatus] = useState<string | null>(null);
    const newActionRef = useRef<HTMLButtonElement>(null);
    const [skinColor, setSkinColor] = useState('#F0C843');
    const [currentLinkType, setCurrentLinkType] = useState<string | null>(null);

    useEffect(() => {
        const fetchLinkType = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const uid = sessionData.session?.user.id;
            if (!uid) return;
            
            const { data } = await supabase.from('relationship_links')
                .select('link_type')
                .or(`mentor_id.eq.${uid},pupil_id.eq.${uid}`)
                .eq('arena_id', arena.id)
                .is('ended_at', null)
                .maybeSingle();
            
            if (data) {
                setCurrentLinkType(data.link_type);
            }
        };
        fetchLinkType();
    }, [arena.id]);

    const parentAsset = assets.find(a => a.id === arena.assetId);
    const normalizedArena = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const allActions = getActionsForArena(arena.id);
    const clanQuests = getClanQuestsForArena(arena, allActions);
    const isClanQuestArena = clanQuests.length > 0 || normalizedArena.includes('quests - cla');

    const isSeasonQuestArena = normalizedArena.includes('quests - season');
    const isSpecialArena = isClanQuestArena || isSeasonQuestArena;

    useEffect(() => {
        const updateSkinColor = () => {
            const style = getComputedStyle(document.body);
            let value = style.getPropertyValue('--skin-accent-color').trim();
            if (!value) {
                value = getComputedStyle(document.documentElement).getPropertyValue('--skin-accent-color').trim();
            }
            if (value && value !== skinColor) {
                setSkinColor(value);
            }
        };

        updateSkinColor();

        const observer = new MutationObserver(updateSkinColor);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-skin'] });
        observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class', 'data-skin'] });

        return () => observer.disconnect();
    }, [skinColor]);

    useEffect(() => {
        if (!isClanQuestArena || clanQuests.length === 0) return;
        clanQuests.forEach(quest => {
            if (quest.actionTemplate?.name) {
                fetchClanQuestParticipants(quest.id, quest.actionTemplate.name);
            }
            joinClanMission(quest.id);
        });
    }, [isClanQuestArena, clanQuests, fetchClanQuestParticipants, joinClanMission]);

    const milestoneActions = allActions.filter(a => a.actionType === 'Marco');
    const bronzeActions = allActions.filter(a => a.actionType !== 'Marco');

    const clanQuestTotals = clanQuests.reduce((acc, quest) => {
        const progressValue = getClanQuestProgress(quest.id);
        const goal = quest.requirements?.clanGoal || quest.goal_value || 50;
        return {
            totalProgress: acc.totalProgress + progressValue,
            totalGoal: acc.totalGoal + goal
        };
    }, { totalProgress: 0, totalGoal: 0 });
    const allActionInstances = allActions.reduce((acc, action) => acc + action.repetitions, 0);
    const allCompletedInstances = allActions.reduce((acc, action) => {
        const completed = tasks.filter(t => t.actionId === action.id && t.completed).length;
        return acc + completed;
    }, 0);

    const progress = isClanQuestArena
        ? (clanQuestTotals.totalGoal > 0
            ? (clanQuestTotals.totalProgress / clanQuestTotals.totalGoal) * 100
            : Math.min(100, clanQuestTotals.totalProgress))
        : (allActionInstances > 0 ? (allCompletedInstances / allActionInstances) * 100 : 0);
    const handleEditToggle = () => {
        if (isSpecialArena) return; // Disable editing for special arenas
        if (isEditing) {
            updateArena(arena.id, { name: editableArena.name, description: editableArena.description, icon: editableArena.icon });
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
        if (isSpecialArena) {
            alert("Para adicionar novas missões, acesse a aba Missões no Menu de Configurações ou no Clã.");
            return;
        }
        setActionModalState({ action: null, mode: 'edit', key: `new-action-modal-${Date.now()}` });
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

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
        setLinkStatus(`Convite de ${type === 'competicao' ? 'Desafio' : type === 'parceria' ? 'Parceria' : 'Mentoria'} enviado para ${friend.nickname}.`);
        window.setTimeout(() => {
            setIsLinkingObserver(false);
            setLinkStatus(null);
        }, 1200);
    };

    // Removed SharedArenaView block to use standard render as requested
    
    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={handleBackdropClick}>
                <div 
                    className="dossier-bg arena-plate border w-full max-w-sm m-4 rounded-2xl p-4 flex flex-col h-auto max-h-[90vh] relative overflow-hidden"
                    style={{ borderColor: 'var(--skin-accent-color)', backgroundImage: 'linear-gradient(135deg, rgba(20,20,20,0.96) 0%, rgba(10,10,10,1) 58%, rgba(18,18,18,0.9) 100%)' }}
                >
                    <div className="arena-plasma" style={{ opacity: 0.45 }}>
                        <PlasmaCanvas color={skinColor} opacity={0.189} className="arena-plasma-canvas" />
                    </div>
                    <div className="relative z-10 flex flex-col space-y-3">
                    <div className="arena-plate-header flex justify-between items-start flex-shrink-0 gap-2 rounded-xl px-2 py-2 bg-black/20">
                        <div className="flex flex-col items-center gap-1">
                            {/* Allow editing for all arenas, EXCEPT special ones */}
                            {!isSpecialArena && (
                                <button onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-full transition-colors border border-white/20 ${isEditing ? 'bg-white/20' : 'bg-transparent'}`}>
                                    <EditIcon className={`w-5 h-5 ${isEditing ? 'text-white' : 'text-gray-300'}`} />
                                </button>
                            )}
                            
                            {isSpecialArena && !isEditing && (
                                <button 
                                    onClick={() => setShowDeleteConfirmation(true)}
                                    className="p-2 rounded-full transition-colors border border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
                                    title="Abandonar Missão"
                                >
                                    <Trash2Icon className="w-5 h-5 text-red-500" />
                                </button>
                            )}
                            {isEditing && (
                                <button
                                    onClick={() => setIsLinkingObserver(true)}
                                    className="p-2 rounded-full transition-colors border border-white/15 bg-black/30 hover:bg-black/40"
                                >
                                    <LinkIcon className="w-4 h-4 accent-text" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 flex flex-col items-center text-center">
                            <h2 className="luxe-title-ornate text-lg font-black uppercase tracking-wider text-[color:var(--skin-accent-color)]">
                                {isEditing ? "EDITAR ARENA" : arena.name}
                            </h2>
                            {parentAsset?.name && (
                                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-gray-300">{parentAsset.name}</p>
                            )}
                            {currentLinkType === 'competicao' && (
                                <div className="bg-red-500/20 border border-red-500/50 text-red-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                                    <span>⚔️</span> PVP
                                </div>
                            )}
                            {currentLinkType === 'mentoria' && (
                                <div className="bg-blue-500/20 border border-blue-500/50 text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                                    <span>🎓</span> MENTORIA
                                </div>
                            )}
                            {isClanQuestArena && (
                                <div className="flex flex-col items-center gap-1 mt-1">
                                    <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full text-[10px] accent-text border border-white/10">
                                        <UsersIcon className="w-3 h-3" />
                                        <span className="font-mono font-bold">
                                            {(() => {
                                                const quest = seasonQuests.find(q => q.type === 'clan' && (
                                                    q.title === arena.name || 
                                                    q.actionTemplate.name === arena.name || 
                                                    allActions.some(a => a.name === q.actionTemplate.name || (q.id === 'quest-clan-unity' && (a.name.includes('Socializar') || a.name.includes('socializar'))))
                                                ));
                                                return quest ? (clanQuestParticipants[quest.id] || 0) : 0;
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
                        {isEditing && (
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

                    {showDeleteConfirmation && (
                        <ConfirmationModal
                            title={isSpecialArena ? "Sair da Missão" : "Excluir Arena"}
                            message={isSpecialArena ? "Ao sair, sua participação é removida, mas a arena e ações ficam salvas." : "Tem certeza que deseja excluir esta arena? Esta ação não pode ser desfeita."}
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
                           <span className="text-5xl arena-icon">{editableArena.icon}</span>
                        </button>

                        {isEditing ? (
                            <>
                                <input 
                                    type="text" 
                                    value={editableArena.name}
                                    onChange={(e) => setEditableArena(prev => ({...prev, name: e.target.value}))}
                                    className="luxe-title-ornate w-full text-center bg-transparent text-2xl font-bold uppercase tracking-widest text-[color:var(--skin-accent-color)] pt-2 focus:outline-none border-b border-dashed border-white/20"
                                />
                                <textarea 
                                    value={editableArena.description}
                                    onChange={(e) => setEditableArena(prev => ({...prev, description: e.target.value}))}
                                    rows={2}
                                    className="w-full text-center bg-transparent text-sm text-gray-500 pt-1 focus:outline-none"
                                />
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 pt-1">{arena.description || 'Sem descrição.'}</p>
                        )}
                    </div>

                    <div className="flex-grow space-y-2 flex flex-col overflow-y-auto">
                        {milestoneActions.length > 0 && (
                            <div className="flex-shrink-0">
                                <div className='relative text-center mb-2'>
                                   <hr className="border-t border-gray-800" />
                                   <h3 className="text-xs font-semibold text-[var(--skin-accent-color)] uppercase tracking-wider absolute -top-2 left-1/2 -translate-x-1/2 bg-[#101010] px-2">Marcos</h3>
                                </div>
                                <div className="flex flex-col items-center space-y-2 py-2">
                                    {milestoneActions.map(action => {
                                        const backgroundStyle = getActionBackgroundStyle(action.id);
                                        const task = tasks.find(t => t.actionId === action.id);
                                        const isCompleted = task?.completed;

                                        return (
                                            <div key={action.id} className="relative">
                                                <button 
                                                    onClick={() => openActionDetails(action)}
                                                    style={backgroundStyle}
                                                    className="relative w-20 h-20 flex-shrink-0 border border-[var(--skin-accent-color)] rounded-xl hover:scale-105 transition-transform overflow-hidden p-1 transform rotate-45"
                                                >
                                                    <div className="arena-plasma">
                                                        <PlasmaCanvas color={skinColor} opacity={0.189} className="arena-plasma-canvas" />
                                                    </div>
                                                    <div className="relative z-10 transform -rotate-45 flex flex-col items-center justify-center space-y-1">
                                                        <span className="text-3xl">{action.icon}</span>
                                                        <p className="text-xs font-bold leading-tight line-clamp-2">{action.name}</p>
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

                       <div className='relative text-center mb-2 flex-shrink-0'>
                           <hr className="border-t border-gray-800" />
                           <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider absolute -top-2 left-1/2 -translate-x-1/2 bg-[#101010] px-2">Ações de Bronze</h3>
                       </div>
                       <div className="flex-grow overflow-x-auto overflow-y-hidden py-2">
                           <div className="flex space-x-2 h-full items-center">
                               {bronzeActions.map(action => <ActionSquare key={action.id} action={action} skinColor={skinColor} onClick={() => openActionDetails(action)} />)}
                               <button ref={newActionRef} onClick={openNewAction} className="w-24 h-24 flex-shrink-0 border-2 border-dashed border-[var(--skin-accent-color)] rounded-xl flex flex-col items-center justify-center hover:border-[var(--skin-accent-color)] transition-colors text-gray-500 hover:text-white">
                                   <PlusIcon className="w-8 h-8"/>
                               </button>
                           </div>
                       </div>
                    </div>

                    <div className="flex-shrink-0 space-y-2 pt-2">
                        <div className="arena-plate-progress">
                            <div className="arena-plate-progress-fill" style={{ width: `${progress}%`, backgroundColor: 'var(--skin-accent-color)' }}></div>
                        </div>
                        <p className="text-sm font-bold text-gray-300 text-center">
                            {isClanQuestArena 
                                ? `${clanQuestTotals.totalProgress}/${clanQuestTotals.totalGoal}` 
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
                    onClose={() => setActionModalState(null)}
                />
            )}
            {isLinkingObserver && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={() => setIsLinkingObserver(false)}>
                    <div className="bg-black/70 border border-white/10 w-full max-w-sm m-4 space-y-3 rounded-2xl p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">VINCULAR ALIADO</div>
                            <button onClick={() => setIsLinkingObserver(false)} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><span className="text-white">×</span></button>
                        </div>
                        <div className="text-xs text-gray-400">Escolha o tipo de vínculo e convide um amigo para {editableArena.name || arena.name}.</div>
                        
                        <div className="flex gap-2 mb-2">
                             <button onClick={() => setCurrentLinkType('mentoria')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${currentLinkType === 'mentoria' ? 'bg-[var(--skin-accent-color)] text-black border-[var(--skin-accent-color)]' : 'bg-black/30 text-gray-400 border-white/10'}`}>Mentoria</button>
                             <button onClick={() => setCurrentLinkType('competicao')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${currentLinkType === 'competicao' ? 'bg-red-500 text-white border-red-500' : 'bg-black/30 text-gray-400 border-white/10'}`}>Desafio</button>
                             <button onClick={() => setCurrentLinkType('parceria')} className={`flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border ${currentLinkType === 'parceria' ? 'bg-blue-500 text-white border-blue-500' : 'bg-black/30 text-gray-400 border-white/10'}`}>Parceria</button>
                        </div>

                        {availableFriends.length === 0 ? (
                            <div className="text-center text-sm text-gray-500 py-6">Nenhum amigo com ID válido.</div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {availableFriends.map(friend => (
                                    <button
                                        key={friend.id}
                                        onClick={() => sendObserverInvite(friend, (currentLinkType as any) || 'mentoria')}
                                        className="w-full p-3 rounded-xl text-left bg-black/20 hover:bg-black/30 border border-white/10 flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                            {friend.avatarUrl ? <img src={friend.avatarUrl} alt={friend.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">?</span>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{friend.nickname}</div>
                                            <div className="text-[10px] text-gray-500">{friend.isOnline ? 'ONLINE' : 'OFFLINE'}</div>
                                        </div>
                                        <div className="p-2 bg-white/5 rounded-full">
                                            <SendIcon className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {linkStatus && <div className="text-xs text-gray-300 bg-black/30 border border-white/10 rounded-xl p-2">{linkStatus}</div>}
                    </div>
                </div>
            )}
        </Portal>
    );
};
