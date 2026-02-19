import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Arena, ActionType, ArenaFolder } from '../types';
import { PlusIcon, EyeIcon, XIcon } from '../components/Icons';
import { ArenaDetailModal } from '../components/ArenaDetailModal';
import { NewArenaModal } from '../components/NewArenaModal';
import { ArenaCard } from '../components/ArenaCard';
import { useTutorial } from '../contexts/TutorialContext';
import { useCodexBuilder } from '../contexts/CodexBuilderContext';
import { IconPickerModal } from '../components/IconPickerModal';
import { FolderDetailModal } from '../components/FolderDetailModal';

type PendingAction = {
    id: string;
    name: string;
    description?: string;
    icon: string;
    duration: number;
    repetitions: number;
    actionType: ActionType;
    difficulty?: number;
};

export const ArenasView: React.FC = () => {
    const { getArenas, assets, actions, addArena, updateArena, addAction, arenaFolders, createArenaFolder, moveArenaToFolder, reorderArena } = useGame();
    const { isTutorialActive, currentStep, nextStep, setSpotlight } = useTutorial();
    const { isBuilderMode } = useCodexBuilder();
    const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isCreatingArena, setIsCreatingArena] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const fabRef = useRef<HTMLButtonElement>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const [builderAssetId, setBuilderAssetId] = useState('');
    const [arenaName, setArenaName] = useState('');
    const [arenaDescription, setArenaDescription] = useState('');
    const [arenaIcon, setArenaIcon] = useState('🏟️');
    const [arenaActive, setArenaActive] = useState(true);
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
    const [actionName, setActionName] = useState('');
    const [actionDescription, setActionDescription] = useState('');
    const [actionIcon, setActionIcon] = useState('📝');
    const [actionType, setActionType] = useState<ActionType>('Ação Recorrente');
    const [actionDuration, setActionDuration] = useState(60);
    const [actionRepetitions, setActionRepetitions] = useState(1);
    const [iconTarget, setIconTarget] = useState<'arena' | 'action' | null>(null);
    
    const allArenas = getArenas().filter(a => showArchived || !a.isArchived);
    const rootArenas = allArenas.filter(a => !a.folderId);
    const selectedArena = allArenas.find(a => a.id === selectedArenaId);
    const selectedFolder = arenaFolders.find(f => f.id === selectedFolderId);

    const handleDragStart = (e: React.DragEvent, id: string, type: 'arena') => {
        e.dataTransfer.setData('id', id);
        e.dataTransfer.setData('type', type);
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        setDragOverId(id);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Prevent flickering when dragging over children
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOverId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetId: string, targetType: 'arena' | 'folder') => {
        e.preventDefault();
        setDragOverId(null);
        const draggedId = e.dataTransfer.getData('id');
        const draggedType = e.dataTransfer.getData('type');

        if (draggedType !== 'arena') return;
        if (draggedId === targetId) return;

        if (targetType === 'folder') {
            await moveArenaToFolder(draggedId, targetId);
        } else if (targetType === 'arena') {
             const targetArena = allArenas.find(a => a.id === targetId);
             if (!targetArena) return;
             
             // Se já está em uma pasta, move o arrastado para a mesma pasta
             if (targetArena.folderId) {
                 await moveArenaToFolder(draggedId, targetArena.folderId);
                 return;
             }

             // Cria nova pasta automaticamente
             const folderName = "Nova Pasta";
             const newFolder = await createArenaFolder(folderName, '📁', targetArena.assetId);
            if (newFolder) {
                await moveArenaToFolder(targetId, newFolder.id);
                await moveArenaToFolder(draggedId, newFolder.id);
            } else {
                console.error("Failed to create folder");
                // Fallback: just try to move without creating folder? No, that doesn't make sense.
            }
        }
    };

    useEffect(() => {
        if (isTutorialActive && currentStep === 2 && fabRef.current) {
            const rect = fabRef.current.getBoundingClientRect();
            setSpotlight(rect, {
                title: "Passo 2: Crie uma Arena",
                text: "Toque aqui para criar sua primeira Arena. Ela representará um contexto da sua vida, como 'Trabalho' ou 'Saúde'.",
            });
        }
    }, [isTutorialActive, currentStep, setSpotlight]);

    useEffect(() => {
        if (!isBuilderMode) return;
        if (builderAssetId) return;
        const fallback = assets.find(a => a.id !== 'geral')?.id || assets[0]?.id || '';
        if (fallback) setBuilderAssetId(fallback);
    }, [assets, builderAssetId, isBuilderMode]);

    const getAssetById = (id: string) => assets.find(a => a.id === id);
    const getActionsForArena = (arenaId: string) => actions.filter(a => a.arenaId === arenaId);
    const assetOptions = assets;

    const handleAddPendingAction = () => {
        if (!actionName.trim()) return;
        const repetitions = actionType === 'Ação Recorrente' ? Math.max(1, actionRepetitions) : 1;
        const duration = Math.max(5, Math.round(actionDuration));
        const newAction: PendingAction = {
            id: crypto.randomUUID(),
            name: actionName.trim(),
            description: actionDescription.trim() || undefined,
            icon: actionIcon || '📝',
            duration,
            repetitions,
            actionType,
            difficulty: 3,
        };
        setPendingActions(prev => [newAction, ...prev]);
        setActionName('');
        setActionDescription('');
        setActionIcon('📝');
        setActionType('Ação Recorrente');
        setActionDuration(60);
        setActionRepetitions(1);
    };

    const handleRemovePendingAction = (id: string) => {
        setPendingActions(prev => prev.filter(action => action.id !== id));
    };

    const handleSaveArenaDraft = () => {
        if (!arenaName.trim() || !builderAssetId) return;
        const newArena = addArena(builderAssetId, {
            name: arenaName.trim(),
            description: arenaDescription.trim(),
            icon: arenaIcon || '🏟️',
        });
        if (!arenaActive) updateArena(newArena.id, { isArchived: true });
        [...pendingActions].reverse().forEach(action => {
            addAction({
                arenaId: newArena.id,
                name: action.name,
                description: action.description,
                icon: action.icon,
                duration: action.duration,
                repetitions: action.repetitions,
                actionType: action.actionType,
                difficulty: action.difficulty,
            });
        });
        setArenaName('');
        setArenaDescription('');
        setArenaIcon('🏟️');
        setArenaActive(true);
        setPendingActions([]);
    };

    const handleOpenCreateArena = () => {
        if (isTutorialActive && currentStep === 2) {
            setSpotlight(null, null);
            nextStep();
        }
        setIsCreatingArena(true);
    };

    const handleArenaCreated = (newArena: Arena) => {
        setIsCreatingArena(false);
        if (isTutorialActive && currentStep === 4) {
            // Automatically open the new arena to continue the tutorial
            setSelectedArenaId(newArena.id);
        }
    };

    if (isBuilderMode) {
        return (
            <>
                <div className="p-4 space-y-4 min-h-full">
                    <div className="bg-black/30 border border-[var(--skin-accent-color)]/30 rounded-2xl p-3 space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider accent-text">Modo Arquiteto</div>
                        <div className="text-[11px] text-gray-400">Sandbox isolado. Nada do jogo atual é alterado.</div>
                    </div>

                    <div className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Arena</div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">Ativo</label>
                            <select value={builderAssetId} onChange={e => setBuilderAssetId(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]">
                                {assetOptions.map(asset => (
                                    <option key={asset.id} value={asset.id}>{asset.id === 'geral' ? 'OUTROS / SIDEQUEST' : asset.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">Nome da Arena</label>
                            <input value={arenaName} onChange={e => setArenaName(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">Descrição</label>
                            <textarea value={arenaDescription} onChange={e => setArenaDescription(e.target.value)} rows={2} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-gray-400">Ícone</label>
                                <button onClick={() => setIconTarget('arena')} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl flex items-center justify-center text-2xl">
                                    {arenaIcon}
                                </button>
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                    <input type="checkbox" checked={arenaActive} onChange={e => setArenaActive(e.target.checked)} className="accent-[var(--skin-accent-color)]" />
                                    Arena ativa
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Ações</div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">Nome da Ação</label>
                            <input value={actionName} onChange={e => setActionName(e.target.value)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400">Descrição</label>
                            <textarea value={actionDescription} onChange={e => setActionDescription(e.target.value)} rows={2} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-bold text-gray-400">Ícone</label>
                                <button onClick={() => setIconTarget('action')} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl flex items-center justify-center text-2xl">
                                    {actionIcon}
                                </button>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400">Tipo</label>
                                <select value={actionType} onChange={e => setActionType(e.target.value as ActionType)} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]">
                                    <option value="Ação Recorrente">Ação Recorrente</option>
                                    <option value="Compromisso">Compromisso</option>
                                    <option value="Marco">Marco</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400">Duração (min)</label>
                                <input type="number" min={5} value={actionDuration} onChange={e => setActionDuration(Number(e.target.value))} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400">Repetições</label>
                                <input type="number" min={1} value={actionRepetitions} disabled={actionType !== 'Ação Recorrente'} onChange={e => setActionRepetitions(Number(e.target.value))} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)] disabled:opacity-50" />
                            </div>
                        </div>
                        <button onClick={handleAddPendingAction} className="w-full py-2 rounded-xl luxe-skin-button">Adicionar ação</button>
                        {pendingActions.length === 0 ? (
                            <div className="text-center text-xs text-gray-500">Nenhuma ação adicionada ainda.</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {pendingActions.map(action => (
                                    <div key={action.id} className="bg-black/20 border border-white/10 rounded-xl p-2 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center text-xl">{action.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-white truncate">{action.name}</div>
                                            <div className="text-[10px] text-gray-400 truncate">
                                                {action.actionType} • {action.duration}m{action.actionType === 'Ação Recorrente' ? ` • x${action.repetitions}` : ''}
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemovePendingAction(action.id)} className="p-1 text-gray-400 hover:text-gray-200">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={handleSaveArenaDraft} disabled={!arenaName.trim() || !builderAssetId} className="w-full py-3 rounded-xl luxe-skin-button disabled:opacity-50">Salvar arena</button>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Arenas do Codex</div>
                            <button onClick={() => setShowArchived(s => !s)} className={`p-2 rounded-full transition-colors ${showArchived ? 'bg-white/20 text-white' : 'text-gray-500'}`}>
                                <EyeIcon className="w-4 h-4" />
                            </button>
                        </div>
                        {allArenas.length === 0 ? (
                            <div className="text-center text-xs text-gray-500">Nenhuma arena criada ainda.</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {allArenas.map(arena => {
                                    const arenaActions = getActionsForArena(arena.id);
                                    const isDragOver = dragOverId === arena.id;
                                    
                                    return (
                                        <div 
                                            key={arena.id}
                                            draggable={!arena.isArchived}
                                            onDragStart={(e) => handleDragStart(e, arena.id, 'arena')}
                                            onDragOver={(e) => handleDragOver(e, arena.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, arena.id, 'arena')}
                                            className={`transition-all duration-200 ${isDragOver ? 'scale-105 z-10 ring-2 ring-[var(--skin-accent-color)] rounded-xl' : ''}`}
                                        >
                                            <ArenaCard
                                                arena={arena}
                                                actions={arenaActions}
                                                onClick={() => setSelectedArenaId(arena.id)}
                                                variant="dossier"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                {selectedFolderId && (
                <FolderDetailModal
                    folder={arenaFolders.find(f => f.id === selectedFolderId)!}
                    onClose={() => setSelectedFolderId(null)}
                />
            )}
            {selectedArena && (
                    <ArenaDetailModal
                        arena={selectedArena}
                        onClose={() => setSelectedArenaId(null)}
                    />
                )}
                {iconTarget && (
                    <IconPickerModal
                        onSelect={icon => {
                            if (iconTarget === 'arena') setArenaIcon(icon);
                            if (iconTarget === 'action') setActionIcon(icon);
                            setIconTarget(null);
                        }}
                        onClose={() => setIconTarget(null)}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <div className="p-4 relative min-h-full">
                 <div className="absolute top-0 right-4">
                    <button onClick={() => setShowArchived(s => !s)} className={`p-2 rounded-full transition-colors ${showArchived ? 'bg-white/20 text-white' : 'text-gray-500'}`}>
                        <EyeIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-8">
                    {/* Render Folders */}
                    {arenaFolders.map(folder => {
                        const arenasInFolder = getArenas().filter(a => a.folderId === folder.id); // Use getArenas to include all including archived if needed
                        const isDragOver = dragOverId === folder.id;
                        
                        return (
                             <div 
                                key={folder.id}
                                onDragOver={(e) => handleDragOver(e, folder.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, folder.id, 'folder')}
                                onClick={() => setSelectedFolderId(folder.id)}
                                className={`relative aspect-[3/4] bg-gray-800/80 rounded-2xl border-2 border-dashed ${isDragOver ? 'border-[var(--skin-accent-color)] bg-gray-700' : 'border-gray-600'} flex items-center justify-center cursor-pointer hover:border-[var(--skin-accent-color)] transition-colors group`}
                            >
                                {/* Stack visual effect */}
                                <div className="absolute top-1 right-1 w-full h-full bg-gray-700/50 rounded-2xl -z-10 transform translate-x-1 -translate-y-1" />
                                <div className="absolute top-2 right-2 w-full h-full bg-gray-600/30 rounded-2xl -z-20 transform translate-x-2 -translate-y-2" />
                                
                                <div className="flex flex-col items-center p-2 text-center">
                                    <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{folder.icon}</span>
                                    <span className="text-sm font-bold text-gray-200 line-clamp-2">{folder.name}</span>
                                    <span className="text-xs text-gray-500 mt-1">{arenasInFolder.length} arenas</span>
                                </div>
                            </div>
                        );
                    })}

                    {rootArenas.map((arena) => {
                         const asset = getAssetById(arena.assetId);
                         const arenaActions = getActionsForArena(arena.id);
                         const isDragOver = dragOverId === arena.id;

                        return (
                            <div
                                key={arena.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, arena.id, 'arena')}
                                onDragOver={(e) => handleDragOver(e, arena.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, arena.id, 'arena')}
                                className={`transition-transform ${isDragOver ? 'scale-105 brightness-110 z-10' : ''}`}
                            >
                                <ArenaCard 
                                    arena={arena} 
                                    assetName={asset?.name || ''}
                                    actions={arenaActions}
                                    onClick={() => setSelectedArenaId(arena.id)}
                                    variant="overview"
                                />
                            </div>
                        )
                    })}
                </div>
                 <button 
                    ref={fabRef}
                    onClick={handleOpenCreateArena}
                    className="fixed bottom-20 right-4 w-16 h-16 rounded-full bg-[var(--skin-accent-color)] flex items-center justify-center shadow-lg shadow-black/50 transform hover:scale-110 transition-transform"
                >
                    <PlusIcon className="w-8 h-8 text-black" />
                </button>
            </div>
            {selectedArena && (
                <ArenaDetailModal
                    arena={selectedArena}
                    onClose={() => setSelectedArenaId(null)}
                />
            )}
            {isCreatingArena && (
                <NewArenaModal 
                    assetId="" // Let user choose inside modal
                    onClose={() => setIsCreatingArena(false)} 
                    onArenaCreated={handleArenaCreated}
                />
            )}
        </>
    );
};
