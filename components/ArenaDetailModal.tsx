import React, { useState, useRef, useEffect } from 'react';
import { Arena, Action } from '../types';
import { useGame } from '../contexts/GameContext';
import { PlusIcon, EditIcon, CheckIcon } from './Icons';
import { ActionModal } from './ActionModal';
import { IconPickerModal } from './IconPickerModal';
import { useTutorial } from '../contexts/TutorialContext';

const ActionSquare: React.FC<{ action: Action, onClick: () => void }> = ({ action, onClick }) => {
    const { getAssetForAction, tasks } = useGame();
    const asset = getAssetForAction(action.id);
    const backgroundStyle = { background: `var(--asset-grad-${asset?.id || 'default'})` };
    
    const completedCount = tasks.filter(t => t.actionId === action.id && t.completed).length;
    const totalProposed = action.repetitions;

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
                {completedCount}/{totalProposed}
            </div>
        </div>
    );
};

export const ArenaDetailModal: React.FC<{ arena: Arena, onClose: () => void }> = ({ arena, onClose }) => {
    const { getActionsForArena, assets, updateArena, tasks, getAssetForAction } = useGame();
    const { isTutorialActive, currentStep, nextStep, setSpotlight } = useTutorial();
    const [actionModalState, setActionModalState] = useState<{ action: Action | null, mode: 'view' | 'edit', key: string } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableArena, setEditableArena] = useState({ name: arena.name, description: arena.description, icon: arena.icon });
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
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
    
    const allActionInstances = allActions.reduce((acc, action) => acc + action.repetitions, 0);
    const allCompletedInstances = allActions.reduce((acc, action) => {
        const completed = tasks.filter(t => t.actionId === action.id && t.completed).length;
        return acc + completed;
    }, 0);
    
    const progress = allActionInstances > 0
        ? (allCompletedInstances / allActionInstances) * 100
        : 0;

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
                                        const asset = getAssetForAction(action.id);
                                        const backgroundStyle = { background: `var(--asset-grad-${asset?.id || 'default'})` };
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
        </>
    );
};
