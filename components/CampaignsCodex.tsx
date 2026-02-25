import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Campaign, Arena, Action } from '../types';
import { XIcon, PlusIcon, ChevronRightIcon, ChevronDownIcon, LockIcon, UnlockIcon, EyeIcon, EyeOffIcon, TrashIcon, CheckIcon, EditIcon } from './Icons';
import { ArenaCard } from './ArenaCard';
import { NewArenaModal } from './NewArenaModal';
import { Portal } from './Portal';

interface CampaignsCodexProps {
    onClose: () => void;
    initialCampaignId?: string | null;
}

export const CampaignsCodex: React.FC<CampaignsCodexProps> = ({ onClose, initialCampaignId }) => {
    const { campaigns, getArenas, actions, updateCampaign, deleteCampaign, addArena } = useGame();
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampaignId || campaigns[0]?.id || null);
    const [isCreatingArena, setIsCreatingArena] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
    
    useEffect(() => {
        if (selectedCampaign) {
            setEditTitle(selectedCampaign.title);
            setEditDescription(selectedCampaign.description || '');
        }
    }, [selectedCampaign]);

    const handleSaveCampaign = () => {
        if (!selectedCampaign) return;
        updateCampaign(selectedCampaign.id, {
            title: editTitle,
            description: editDescription
        });
        setIsEditing(false);
    };

    const handleDeleteCampaign = () => {
        if (!selectedCampaign) return;
        if (confirm('Tem certeza que deseja excluir esta campanha?')) {
            deleteCampaign(selectedCampaign.id);
            if (campaigns.length > 1) {
                const next = campaigns.find(c => c.id !== selectedCampaign.id);
                setSelectedCampaignId(next?.id || null);
            } else {
                onClose();
            }
        }
    };
    
    // Derived state for the selected campaign
    const campaignArenas = selectedCampaign 
        ? getArenas().filter(a => selectedCampaign.arenaIds.includes(a.id))
        : [];
        
    // Sort arenas based on their order in arenaIds
    const sortedArenas = selectedCampaign 
        ? [...campaignArenas].sort((a, b) => {
            const indexA = selectedCampaign.arenaIds.indexOf(a.id);
            const indexB = selectedCampaign.arenaIds.indexOf(b.id);
            return indexA - indexB;
        })
        : [];

    const handleToggleLock = (arenaId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedCampaign) return;
        
        const currentConfig = selectedCampaign.arenaConfig || {};
        const isLocked = currentConfig[arenaId]?.isLocked || false;
        
        updateCampaign(selectedCampaign.id, {
            arenaConfig: {
                ...currentConfig,
                [arenaId]: {
                    ...currentConfig[arenaId],
                    isLocked: !isLocked
                }
            }
        });
    };

    const handleBossKill = (arenaId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedCampaign) return;
        
        const actionsInArena = actions.filter(a => a.arenaId === arenaId);
        const otherActions = actionsInArena.filter(a => a.actionType !== 'Marco');
        const currentConfig = selectedCampaign.arenaConfig || {};
        const arenaConfig = currentConfig[arenaId] || {};
        const completedActionIds = arenaConfig.completedActionIds || [];
        
        const allGruntsDefeated = otherActions.every(action => completedActionIds.includes(action.id));
        const isCleared = arenaConfig.isCleared || false;

        // If trying to clear (not uncheck) and grunts are not defeated, show alert
        if (!isCleared && !allGruntsDefeated && otherActions.length > 0) {
            alert('Você precisa completar todas as ações menores antes de enfrentar o Chefão da Fase!');
            return;
        }
        
        // Calculate new state
        const newClearedState = !isCleared;
        
        const newConfig = {
            ...currentConfig,
            [arenaId]: {
                ...(currentConfig[arenaId] || { isLocked: false, isHidden: false }),
                isCleared: newClearedState
            }
        };

        // Progressive Disclosure Logic
        const currentIndex = selectedCampaign.arenaIds.indexOf(arenaId);
        if (currentIndex !== -1 && currentIndex < selectedCampaign.arenaIds.length - 1) {
            const nextArenaId = selectedCampaign.arenaIds[currentIndex + 1];
            
            if (newClearedState) {
                // Unlock next phase
                newConfig[nextArenaId] = {
                    ...(newConfig[nextArenaId] || { isLocked: true }), // Default to locked if undefined
                    isLocked: false,
                    isHidden: false
                };
            } else {
                // Re-lock next phase if we uncheck this one
                newConfig[nextArenaId] = {
                    ...(newConfig[nextArenaId] || {}),
                    isLocked: true
                };
            }
        }

        updateCampaign(selectedCampaign.id, {
            arenaConfig: newConfig
        });
    };

    const handleCreateFutureArena = () => {
        setIsCreatingArena(true);
    };

    const handleToggleAction = (arenaId: string, actionId: string) => {
        if (!selectedCampaign) return;

        const currentConfig = selectedCampaign.arenaConfig || {};
        const arenaConfig = currentConfig[arenaId] || { isLocked: false };
        const completedActions = arenaConfig.completedActionIds || [];

        const isCompleted = completedActions.includes(actionId);
        const newCompletedActions = isCompleted
            ? completedActions.filter(id => id !== actionId)
            : [...completedActions, actionId];

        updateCampaign(selectedCampaign.id, {
            arenaConfig: {
                ...currentConfig,
                [arenaId]: {
                    ...arenaConfig,
                    completedActionIds: newCompletedActions
                }
            }
        });
    };

    const onArenaCreated = (newArena: Arena) => {
        if (!selectedCampaign) return;
        
        const isFirstArena = selectedCampaign.arenaIds.length === 0;

        // Add to campaign and lock it by default unless it's the first one
        updateCampaign(selectedCampaign.id, {
            arenaIds: [...selectedCampaign.arenaIds, newArena.id],
            arenaConfig: {
                ...(selectedCampaign.arenaConfig || {}),
                [newArena.id]: {
                    isLocked: !isFirstArena,
                    isHidden: false
                }
            }
        });
        setIsCreatingArena(false);
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-50 bg-black text-white flex flex-col md:flex-row overflow-hidden font-sans">
                {/* Sidebar - Campaign List */}
            <div className="w-full md:w-80 bg-[#0a0a0a] border-r border-white/10 flex flex-col h-[30vh] md:h-full">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50">
                    <h2 className="text-xl font-bold tracking-wider text-[var(--skin-accent-color)] uppercase flex items-center gap-2">
                        <span>📜</span> Codex
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden">
                        <XIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 text-sm italic">
                            Nenhuma campanha ativa.
                        </div>
                    ) : (
                        campaigns.map(campaign => (
                            <button
                                key={campaign.id}
                                onClick={() => setSelectedCampaignId(campaign.id)}
                                className={`w-full text-left p-3 rounded-xl transition-all border ${
                                    selectedCampaignId === campaign.id 
                                        ? 'bg-[var(--skin-accent-color)]/10 border-[var(--skin-accent-color)]/50 shadow-[0_0_15px_rgba(var(--skin-accent-color-rgb),0.2)]' 
                                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20'
                                }`}
                            >
                                <div className="font-bold text-sm truncate flex items-center gap-2">
                                    <span>{selectedCampaignId === campaign.id ? '📂' : '📁'}</span>
                                    {campaign.title}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-1 flex justify-between items-center">
                                    <span>{campaign.arenaIds.length} fases</span>
                                    {campaign.deadline && <span>{new Date(campaign.deadline).toLocaleDateString()}</span>}
                                </div>
                            </button>
                        ))
                    )}
                </div>
                
                <div className="p-4 border-t border-white/10 bg-black/50 hidden md:block">
                    <button onClick={onClose} className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors text-gray-400 hover:text-white">
                        Fechar Codex
                    </button>
                </div>
            </div>

            {/* Main Content - Campaign Details */}
            <div className="flex-1 bg-[#121212] flex flex-col h-[70vh] md:h-full relative overflow-hidden">
                {selectedCampaign ? (
                    <>
                        {/* Header */}
                        <div className="p-6 md:p-8 border-b border-white/10 bg-gradient-to-r from-black/80 to-transparent backdrop-blur-md sticky top-0 z-10">
                             <div className="flex justify-between items-start">
                                <div className="flex-1 mr-4">
                                    <div className="text-[10px] font-bold text-[var(--skin-accent-color)] uppercase tracking-[0.2em] mb-2">
                                        Campanha Ativa
                                    </div>
                                    
                                    {isEditing ? (
                                        <div className="space-y-4 max-w-2xl bg-black/40 p-4 rounded-xl border border-white/10">
                                            <input 
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                className="w-full bg-black/50 border-b border-white/20 text-2xl font-bold text-white p-2 focus:outline-none focus:border-[var(--skin-accent-color)]"
                                                placeholder="Nome da Campanha"
                                                autoFocus
                                            />
                                            <textarea 
                                                value={editDescription}
                                                onChange={e => setEditDescription(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-lg text-gray-300 p-3 text-sm focus:outline-none focus:border-[var(--skin-accent-color)] resize-none"
                                                rows={3}
                                                placeholder="Descrição..."
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white/5 text-gray-400 text-xs font-bold rounded-lg hover:bg-white/10 transition-colors">Cancelar</button>
                                                <button onClick={handleSaveCampaign} className="px-4 py-2 bg-[var(--skin-accent-color)] text-black text-xs font-bold rounded-lg hover:brightness-110 transition-colors">Salvar Alterações</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 group">
                                                <h1 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
                                                    {selectedCampaign.title}
                                                </h1>
                                                <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all transform hover:scale-110">
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button onClick={handleDeleteCampaign} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-full text-red-400 hover:text-red-300 transition-all transform hover:scale-110">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {selectedCampaign.description && (
                                                <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">
                                                    {selectedCampaign.description}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                     {!isEditing && (
                                         <button 
                                            onClick={handleCreateFutureArena}
                                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-[var(--skin-accent-color)]/10 hover:bg-[var(--skin-accent-color)]/20 border border-[var(--skin-accent-color)]/30 rounded-lg transition-all text-[var(--skin-accent-color)] text-xs font-bold uppercase tracking-wider"
                                        >
                                            <PlusIcon className="w-4 h-4" />
                                            Nova Fase
                                        </button>
                                     )}
                                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden absolute top-4 right-4">
                                        <XIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stages (Arenas) List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6">
                            {sortedArenas.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-white/5 rounded-3xl">
                                    <p className="mb-4">Nenhuma fase definida nesta campanha.</p>
                                    <button 
                                        onClick={handleCreateFutureArena}
                                        className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Criar Primeira Fase
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8 relative">
                                    {/* Vertical connecting line */}
                                    <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[var(--skin-accent-color)]/50 via-white/10 to-transparent pointer-events-none" />
                                    
                                    {sortedArenas.map((arena, index) => {
                                        const isLocked = selectedCampaign.arenaConfig?.[arena.id]?.isLocked || false;
                                        const isCleared = selectedCampaign.arenaConfig?.[arena.id]?.isCleared || false;
                                        const actionsInArena = actions.filter(a => a.arenaId === arena.id);
                                        const bossAction = actionsInArena.find(a => a.actionType === 'Marco');
                                        const otherActions = actionsInArena.filter(a => a.actionType !== 'Marco');
                                        
                                        return (
                                            <div key={arena.id} className={`relative pl-20 transition-all duration-500 ${isLocked ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                                                {/* Node Marker */}
                                                <div className={`absolute left-6 top-6 w-8 h-8 -ml-2 rounded-full border-4 border-[#121212] z-10 flex items-center justify-center transition-all ${
                                                    isLocked 
                                                        ? 'bg-gray-700 text-gray-400' 
                                                        : isCleared
                                                            ? 'bg-green-500 text-black shadow-[0_0_15px_var(--green-500)] scale-110'
                                                            : 'bg-[var(--skin-accent-color)] text-black shadow-[0_0_15px_var(--skin-accent-color)] scale-110'
                                                }`}>
                                                    {isCleared ? <CheckIcon className="w-4 h-4" /> : <span className="text-xs font-black">{index + 1}</span>}
                                                </div>
                                                
                                                {/* Connecting Line Segment */}
                                                {index < sortedArenas.length - 1 && (
                                                    <div className={`absolute left-6 top-14 bottom-[-2rem] w-0.5 -ml-px z-0 ${
                                                        isLocked 
                                                            ? 'bg-gray-800 border-l border-dashed border-gray-600' 
                                                            : isCleared 
                                                                ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                                                : 'bg-[var(--skin-accent-color)]/50'
                                                    }`} />
                                                )}
                                                
                                                {/* Stage Card */}
                                                <div className={`bg-[#1a1a1a] border rounded-2xl overflow-hidden transition-all group ${
                                                    isLocked 
                                                        ? 'border-white/5' 
                                                        : isCleared
                                                            ? 'border-green-500/30 hover:border-green-500/50'
                                                            : 'border-[var(--skin-accent-color)]/30 hover:border-[var(--skin-accent-color)]/50'
                                                }`}>
                                                    <div className="p-4 flex items-center gap-4 bg-gradient-to-r from-black/40 to-transparent">
                                                        <div className="text-4xl filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">{arena.icon}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                                                                    isLocked 
                                                                        ? 'bg-gray-800 text-gray-500' 
                                                                        : isCleared
                                                                            ? 'bg-green-500/20 text-green-400'
                                                                            : 'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)]'
                                                                }`}>
                                                                    Fase {index + 1}
                                                                </span>
                                                                {isLocked && <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><LockIcon className="w-3 h-3" /> BLOQUEADA</span>}
                                                                {isCleared && <span className="text-[10px] text-green-500 font-bold flex items-center gap-1"><CheckIcon className="w-3 h-3" /> COMPLETA</span>}
                                                            </div>
                                                            <h3 className={`text-xl font-black truncate transition-colors ${
                                                                isLocked 
                                                                    ? 'text-gray-500' 
                                                                    : isCleared
                                                                        ? 'text-green-100 line-through decoration-green-500/50'
                                                                        : 'text-white'
                                                            }`}>
                                                                {arena.name}
                                                            </h3>
                                                        </div>
                                                        
                                                        {/* Controls */}
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={(e) => handleToggleLock(arena.id, e)}
                                                                className={`p-2 rounded-full transition-colors ${isLocked ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-[var(--skin-accent-color)] hover:bg-[var(--skin-accent-color)]/10'}`}
                                                                title={isLocked ? "Desbloquear Fase" : "Bloquear Fase"}
                                                            >
                                                                {isLocked ? <LockIcon className="w-5 h-5" /> : <UnlockIcon className="w-5 h-5" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Expanded Content (Actions) */}
                                                    {!isLocked && (
                                                        <div className="p-4 border-t border-white/5 bg-black/20 space-y-3">
                                                            
                                                            {/* Grunt Actions (Minions/Steps) */}
                                                            {otherActions.length > 0 && (
                                                                <div className="grid grid-cols-1 gap-2 mb-4 relative">
                                                                    {/* Connector Line to Boss */}
                                                                    {bossAction && <div className="absolute left-6 top-full h-4 w-0.5 bg-white/10 -ml-px z-0" />}
                                                                    
                                                                    {otherActions.map((action, i) => {
                                                                        const isActionCompleted = selectedCampaign.arenaConfig?.[arena.id]?.completedActionIds?.includes(action.id) || false;
                                                                        return (
                                                                            <div 
                                                                                key={action.id} 
                                                                                onClick={() => handleToggleAction(arena.id, action.id)}
                                                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all group/action relative overflow-hidden cursor-pointer ${
                                                                                    isActionCompleted 
                                                                                        ? 'bg-green-900/10 border-green-500/20' 
                                                                                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                                                }`}
                                                                            >
                                                                                <div className={`w-8 h-8 rounded flex items-center justify-center text-lg shadow-inner transition-colors ${
                                                                                    isActionCompleted ? 'bg-green-500/20 text-green-400' : 'bg-black/40'
                                                                                }`}>
                                                                                    {action.icon}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className={`text-xs font-bold truncate transition-colors ${
                                                                                        isActionCompleted ? 'text-green-400 line-through' : 'text-gray-300'
                                                                                    }`}>
                                                                                        {action.name}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                                                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-gray-400">{action.actionType}</span>
                                                                                        {action.duration > 0 && <span>{action.duration}m</span>}
                                                                                    </div>
                                                                                </div>
                                                                                {/* Checkbox */}
                                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                                                    isActionCompleted 
                                                                                        ? 'border-green-500 bg-green-500 text-black' 
                                                                                        : 'border-white/20 group-hover/action:border-[var(--skin-accent-color)]'
                                                                                }`}>
                                                                                    {isActionCompleted && <CheckIcon className="w-3 h-3 font-bold" />}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Boss Fight Section (The Milestone) */}
                                                            {bossAction ? (() => {
                                                                const allGruntsDefeated = otherActions.every(action => 
                                                                    selectedCampaign.arenaConfig?.[arena.id]?.completedActionIds?.includes(action.id)
                                                                );
                                                                const isBossUnlocked = allGruntsDefeated || otherActions.length === 0;

                                                                return (
                                                                    <div 
                                                                        onClick={(e) => handleBossKill(arena.id, e)}
                                                                        className={`p-3 rounded-xl border relative overflow-hidden group/boss cursor-pointer transition-all hover:scale-[1.01] ${
                                                                            isCleared
                                                                                ? 'bg-green-900/10 border-green-500/30'
                                                                                : !isBossUnlocked
                                                                                    ? 'bg-gray-900/40 border-gray-700/30 opacity-75 grayscale'
                                                                                    : 'bg-red-900/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                                                                        }`}
                                                                    >
                                                                        <div className={`absolute top-0 right-0 p-1 rounded-bl-lg text-[8px] font-bold uppercase tracking-wider ${
                                                                            isCleared
                                                                                ? 'bg-green-500/20 text-green-400'
                                                                                : !isBossUnlocked
                                                                                    ? 'bg-gray-700 text-gray-400'
                                                                                    : 'bg-red-500/20 text-red-400'
                                                                        }`}>
                                                                            {isCleared ? 'MARCO ATINGIDO' : !isBossUnlocked ? 'BLOQUEADO' : 'CHEFÃO DA FASE'}
                                                                        </div>
                                                                        <div className="flex items-center gap-4 relative z-10">
                                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl shadow-lg ${
                                                                                isCleared 
                                                                                    ? 'bg-green-500/20 text-green-400' 
                                                                                    : !isBossUnlocked
                                                                                        ? 'bg-gray-800 text-gray-500'
                                                                                        : 'bg-red-500/20 text-red-400 animate-pulse'
                                                                            }`}>
                                                                                {!isBossUnlocked && !isCleared ? <LockIcon className="w-6 h-6" /> : (bossAction.icon || '☠️')}
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isCleared ? 'text-green-400' : !isBossUnlocked ? 'text-gray-500' : 'text-red-400'}`}>
                                                                                    {isCleared ? 'Vitória!' : !isBossUnlocked ? 'Complete as ações acima' : 'Desafio Final'}
                                                                                </div>
                                                                                <div className={`text-sm font-bold ${isCleared ? 'text-gray-400 line-through' : !isBossUnlocked ? 'text-gray-500' : 'text-white'}`}>
                                                                                    {bossAction.name}
                                                                                </div>
                                                                            </div>
                                                                            <button 
                                                                                className={`text-xs px-4 py-2 rounded-lg border font-black uppercase tracking-wider transition-all shadow-lg ${
                                                                                    isCleared
                                                                                        ? 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30'
                                                                                        : !isBossUnlocked
                                                                                            ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                                                                                            : 'bg-red-500 hover:bg-red-600 border-red-400 text-white hover:scale-105'
                                                                                }`}
                                                                            >
                                                                                {isCleared ? 'REVIVER' : !isBossUnlocked ? 'BLOQUEADO' : 'DERROTAR'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })() : (
                                                                /* Fallback: Manual Complete Button if no boss exists */
                                                                <div className="flex flex-col items-center gap-2 py-2">
                                                                    {otherActions.length === 0 && (
                                                                        <div className="text-xs text-gray-500 italic mb-2">Sem ações definidas.</div>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => handleBossKill(arena.id, e)}
                                                                        className={`w-full py-3 rounded-xl border border-dashed font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                                                            isCleared
                                                                                ? 'bg-green-900/10 border-green-500/30 text-green-400 hover:bg-green-900/20'
                                                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                                                                        }`}
                                                                    >
                                                                        {isCleared ? (
                                                                            <><CheckIcon className="w-4 h-4" /> Fase Completa</>
                                                                        ) : (
                                                                            <><CheckIcon className="w-4 h-4" /> Marcar Fase como Concluída</>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* Fab for mobile to add stage */}
                             <button 
                                onClick={handleCreateFutureArena}
                                className="md:hidden w-full py-4 mt-4 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span className="font-bold text-sm uppercase tracking-wider">Adicionar Próxima Fase</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <span className="text-6xl mb-4 opacity-20">📜</span>
                        <p>Selecione uma campanha para ver o Codex.</p>
                    </div>
                )}
            </div>

            {isCreatingArena && (
                <NewArenaModal 
                    assetId="" // Let user choose inside modal or default to general
                    onClose={() => setIsCreatingArena(false)} 
                    onArenaCreated={onArenaCreated}
                />
            )}
            </div>
        </Portal>
    );
};
