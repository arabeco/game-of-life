import React, { useState, useRef, useEffect } from 'react';
import { Arena, Action, UserProfile } from '../types';
import { useGame } from '../contexts/GameContext';
import { PlusIcon, EditIcon, CheckIcon } from './Icons';
import { ActionModal } from './ActionModal';
import { IconPickerModal } from './IconPickerModal';
import { useTutorial } from '../contexts/TutorialContext';
import { supabase } from '../supabaseClient';

const ActionSquare: React.FC<{ action: Action, onClick: () => void }> = ({ action, onClick }) => {
    const { getActionBackgroundStyle, tasks, getArenas, seasonQuests, getClanQuestProgress } = useGame();
    const backgroundStyle = getActionBackgroundStyle(action.id);
    
    const completedCount = tasks.filter(t => t.actionId === action.id && t.completed).length;
    const totalProposed = action.repetitions;
    const arena = getArenas().find(ar => ar.id === action.arenaId);
    const normalizedArena = arena?.name ? arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
    const isClanQuest = normalizedArena.includes('quests - cla');
    const clanQuest = isClanQuest ? seasonQuests.find(q => q.scope === 'clan' && q.title === action.name) : undefined;
    const clanProgress = clanQuest ? getClanQuestProgress(clanQuest.id) : 0;
    const clanPercent = clanQuest && clanQuest.goal_value > 0 ? Math.min(100, Math.round((clanProgress / clanQuest.goal_value) * 100)) : Math.min(100, clanProgress);

    return (
        <div className="relative flex-shrink-0">
            <button 
                onClick={onClick}
                style={backgroundStyle}
                className="w-24 h-24 border border-[var(--accent-bronze)] rounded-xl hover:opacity-80 transition-opacity flex flex-col items-center justify-center text-center p-1 space-y-1"
            >
                <span className="text-3xl">{action.icon}</span>
                <p className="text-xs font-bold leading-tight line-clamp-2">{action.name}</p>
            </button>
            <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none">
                {isClanQuest ? `${clanPercent}%` : `${completedCount}/${totalProposed}`}
            </div>
        </div>
    );
};

export const ArenaDetailModal: React.FC<{ arena: Arena, onClose: () => void }> = ({ arena, onClose }) => {
    const { getActionsForArena, assets, updateArena, tasks, getActionBackgroundStyle, friends, seasonQuests, getClanQuestProgress } = useGame();
    const { isTutorialActive, currentStep, nextStep, setSpotlight } = useTutorial();
    const [actionModalState, setActionModalState] = useState<{ action: Action | null, mode: 'view' | 'edit', key: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableArena, setEditableArena] = useState({ name: arena.name, description: arena.description, icon: arena.icon });
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [isLinkingObserver, setIsLinkingObserver] = useState(false);
    const [linkStatus, setLinkStatus] = useState<string | null>(null);
    const newActionRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isTutorialActive && currentStep === 4 && newActionRef.current) {
             const rect = newActionRef.current.getBoundingClientRect();
             setSpotlight(rect, {
                title: "Passo 4: Crie uma Ação",
                text: "Agora crie uma Ação. A soma das suas ações definirá sua meta para este Ciclo.",
            });
        }
    }, [isTutorialActive, currentStep, setSpotlight]);

    const allActions = getActionsForArena(arena.id);
    const milestoneActions = allActions.filter(a => a.actionType === 'Marco');
    const bronzeActions = allActions.filter(a => a.actionType !== 'Marco');

    const parentAsset = assets.find(a => a.id === arena.assetId);
    
    const normalizedArena = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const isClanQuestArena = normalizedArena.includes('quests - cla');
    const clanQuestTotals = allActions.reduce((acc, action) => {
        const quest = seasonQuests.find(q => q.scope === 'clan' && q.title === action.name);
        if (!quest) return acc;
        const progressValue = getClanQuestProgress(quest.id);
        return {
            totalProgress: acc.totalProgress + progressValue,
            totalGoal: acc.totalGoal + (quest.goal_value > 0 ? quest.goal_value : 0)
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
        if (isEditing) {
            updateArena(arena.id, { name: editableArena.name, description: editableArena.description, icon: editableArena.icon });
        }
        setIsEditing(!isEditing);
    };

    const handleIconSelect = (selectedIcon: string) => {
        setEditableArena(prev => ({ ...prev, icon: selectedIcon }));
        setIsIconPickerOpen(false);
    }
    
    const openActionDetails = (action: Action) => {
        setActionModalState({ action, mode: 'view', key: `action-modal-${action.id}-${Date.now()}` });
    };

    const openNewAction = () => {
        if (isTutorialActive && currentStep === 4) {
            setSpotlight(null, null);
            nextStep();
        }
        setActionModalState({ action: null, mode: 'edit', key: `new-action-modal-${Date.now()}` });
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    const availableFriends = friends.filter(f => isUuid(f.id));

    const sendObserverInvite = async (friend: UserProfile) => {
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
            link_type: 'mentoria',
            arena_id: arena.id,
            arena_snapshot: { name: editableArena.name || arena.name, icon: editableArena.icon || arena.icon },
            status: 'pending',
        });
        if (error) {
            setLinkStatus(error.message);
            return;
        }
        setLinkStatus(`Convite enviado para ${friend.nickname}.`);
        window.setTimeout(() => {
            setIsLinkingObserver(false);
            setLinkStatus(null);
        }, 1200);
    };
    
    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={handleBackdropClick}>
                <div 
                    className="dossier-bg border border-[color:var(--accent-silver-soft)] w-full max-w-sm m-4 space-y-3 rounded-2xl p-4 flex flex-col h-auto max-h-[90vh] relative overflow-hidden"
                >
                    <div className="flex justify-between items-center flex-shrink-0">
                         <button onClick={handleEditToggle} className={`p-2 rounded-full transition-colors border border-white/20 ${isEditing ? 'bg-white/20' : 'bg-transparent'}`}>
                            <EditIcon className={`w-5 h-5 ${isEditing ? 'text-white' : 'text-gray-300'}`} />
                        </button>
                         <h2 className="text-lg font-black uppercase tracking-wider text-white">{isEditing ? "EDITAR ARENA" : parentAsset?.name}</h2>
                        {isEditing ? (
                            <button
                                onClick={() => setIsLinkingObserver(true)}
                                className="px-3 py-2 text-[10px] font-black tracking-widest rounded-xl bg-black/30 border border-white/15 text-[var(--gold)] hover:bg-black/40"
                            >
                                VINCULAR OBSERVADOR
                            </button>
                        ) : (
                            <div className="w-[142px]" />
                        )}
                        <button onClick={onClose} className="px-5 py-2 text-sm font-bold rounded-xl luxe-gold-button">
                            OK
                        </button>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-center text-center space-y-1">
                        <button 
                            onClick={() => isEditing && setIsIconPickerOpen(true)}
                            disabled={!isEditing}
                            className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer disabled:cursor-default"
                        >
                           <span className="text-5xl">{editableArena.icon}</span>
                        </button>

                        {isEditing ? (
                            <>
                                <input 
                                    type="text" 
                                    value={editableArena.name}
                                    onChange={(e) => setEditableArena(prev => ({...prev, name: e.target.value}))}
                                    className="w-full text-center bg-transparent text-2xl font-bold uppercase tracking-wider text-white pt-2 focus:outline-none border-b border-dashed border-white/20"
                                />
                                <textarea 
                                    value={editableArena.description}
                                    onChange={(e) => setEditableArena(prev => ({...prev, description: e.target.value}))}
                                    rows={2}
                                    className="w-full text-center bg-transparent text-sm text-gray-500 pt-1 focus:outline-none"
                                />
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-black uppercase tracking-wider text-[var(--accent-silver)] pt-2 luxe-title-shadow">{arena.name}</h2>
                                <p className="text-sm text-gray-500 pt-1">{arena.description || 'Sem descrição.'}</p>
                            </>
                        )}
                    </div>

                    <div className="flex-grow space-y-2 flex flex-col overflow-y-auto">
                        {milestoneActions.length > 0 && (
                            <div className="flex-shrink-0">
                                <div className='relative text-center mb-2'>
                                   <hr className="border-t border-gray-800" />
                                   <h3 className="text-xs font-semibold text-[var(--accent-bronze)] uppercase tracking-wider absolute -top-2 left-1/2 -translate-x-1/2 bg-[#101010] px-2">Marcos</h3>
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
                                                    className="w-20 h-20 flex-shrink-0 border border-[var(--accent-bronze)] rounded-xl hover:scale-105 transition-transform flex items-center justify-center text-center p-1 transform rotate-45"
                                                >
                                                    <div className="transform -rotate-45 flex flex-col items-center justify-center space-y-1">
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
                               {bronzeActions.map(action => <ActionSquare key={action.id} action={action} onClick={() => openActionDetails(action)} />)}
                               <button ref={newActionRef} onClick={openNewAction} className="w-24 h-24 flex-shrink-0 border-2 border-dashed border-[var(--accent-bronze)] rounded-xl flex flex-col items-center justify-center hover:border-[var(--gold)] transition-colors text-gray-500 hover:text-white">
                                   <PlusIcon className="w-8 h-8"/>
                               </button>
                           </div>
                       </div>
                    </div>

                    <div className="flex-shrink-0 space-y-2 pt-2">
                        <div className="w-full h-1.5 bg-black/30 rounded-full">
                            <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-sm font-bold text-gray-300 text-center">{progress.toFixed(0)}%</p>
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
                            <div className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">ESCOLHA SEU JUIZ</div>
                            <button onClick={() => setIsLinkingObserver(false)} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><span className="text-white">×</span></button>
                        </div>
                        <div className="text-xs text-gray-400">Convide um aliado para observar {editableArena.name || arena.name}.</div>
                        {availableFriends.length === 0 ? (
                            <div className="text-center text-sm text-gray-500 py-6">Nenhum amigo com ID válido.</div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {availableFriends.map(friend => (
                                    <button
                                        key={friend.id}
                                        onClick={() => sendObserverInvite(friend)}
                                        className="w-full p-3 rounded-xl text-left bg-black/20 hover:bg-black/30 border border-white/10 flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                                            {friend.avatarUrl ? <img src={friend.avatarUrl} alt={friend.nickname} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-500">?</span>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white">{friend.nickname}</div>
                                            <div className="text-[10px] text-gray-500">{friend.isOnline ? 'ONLINE' : 'OFFLINE'}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        {linkStatus && <div className="text-xs text-gray-300 bg-black/30 border border-white/10 rounded-xl p-2">{linkStatus}</div>}
                    </div>
                </div>
            )}
        </>
    );
};
