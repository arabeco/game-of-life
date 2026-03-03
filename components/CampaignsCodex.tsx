import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Arena, Campaign } from '../types';
import { XIcon, PlusIcon, LockIcon, TrashIcon, EditIcon, LinkIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from './Icons';
import { ArenaCard } from './ArenaCard';
import { NewArenaModal } from './NewArenaModal';
import { ArenaDetailModal } from './ArenaDetailModal';
import { Portal } from './Portal';
import { GlassCard } from './GlassCard';

interface CampaignsCodexProps {
    onClose: () => void;
    initialCampaignId?: string | null;
}

export const CampaignsCodex: React.FC<CampaignsCodexProps> = ({ onClose, initialCampaignId }) => {
    const { campaigns, getArenas, actions, updateCampaign, deleteCampaign, addCampaign } = useGame();
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampaignId || null);
    const [isCreatingArena, setIsCreatingArena] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);
    
    // Linking Mode State
    const [isLinkingMode, setIsLinkingMode] = useState(false);
    const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);

    // Expandable Description State
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Filter out valid campaigns (ignore deleted/null)
    const validCampaigns = campaigns.filter(Boolean);

    // Derived state for the selected campaign
    const selectedCampaign = selectedCampaignId ? validCampaigns.find(c => c.id === selectedCampaignId) : null;
    
    // Reset selection if campaign is deleted
    useEffect(() => {
        if (selectedCampaignId && !selectedCampaign) {
            setSelectedCampaignId(null);
        }
    }, [validCampaigns, selectedCampaignId]);

    // Update edit fields when campaign changes
    useEffect(() => {
        if (selectedCampaign) {
            setEditTitle(selectedCampaign.title);
            setEditDescription(selectedCampaign.description || '');
            setIsDescriptionExpanded(false); // Reset expansion on change
        }
    }, [selectedCampaign]);

    // Identify Codex-based campaigns
    const isCodexCampaign = selectedCampaign?.arenaIds.some(id => {
        const arena = getArenas().find(a => a.id === id);
        return !!arena?.originCodexId;
    });

    const handleCreateCampaign = async () => {
        const newId = crypto.randomUUID();
        const title = `Nova Campanha ${validCampaigns.length + 1}`;
        await addCampaign({
            title,
            description: 'Descrição da campanha...',
            status: 'active',
            type: 'sequential',
            arenaIds: [],
            arenaConfig: {},
            priority: 'media',
            order: validCampaigns.length,
            priorityOrder: 0
        });
        setSelectedCampaignId(newId); // Open it immediately
        setIsEditing(true); // Auto-enter edit mode
    };

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
        if (confirm('Tem certeza que deseja excluir esta campanha? TODAS as arenas e ações dentro dela serão excluídas permanentemente.')) {
            deleteCampaign(selectedCampaign.id);
            setSelectedCampaignId(null);
        }
    };
    
    const campaignArenas = selectedCampaign 
        ? getArenas().filter(a => selectedCampaign.arenaIds.includes(a.id))
        : [];

    const sortedArenas = selectedCampaign 
        ? [...campaignArenas].sort((a, b) => {
            const indexA = selectedCampaign.arenaIds.indexOf(a.id);
            const indexB = selectedCampaign.arenaIds.indexOf(b.id);
            return indexA - indexB;
        })
        : [];
    
    const handleRemoveArena = (arenaId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedCampaign) return;
        
        if (isCodexCampaign) {
            alert("Não é possível remover arenas de uma campanha de Codex.");
            return;
        }

        if (window.confirm("Tem certeza que deseja remover esta arena da campanha?")) {
            const newArenaIds = selectedCampaign.arenaIds.filter(id => id !== arenaId);
            const newConfig = { ...selectedCampaign.arenaConfig };
            delete newConfig[arenaId];
            
            Object.keys(newConfig).forEach(key => {
                const prereqs = newConfig[key].prerequisiteArenaIds || [];
                if (prereqs.includes(arenaId)) {
                    newConfig[key] = {
                        ...newConfig[key],
                        prerequisiteArenaIds: prereqs.filter(id => id !== arenaId)
                    };
                }
            });

            updateCampaign(selectedCampaign.id, {
                arenaIds: newArenaIds,
                arenaConfig: newConfig
            });
        }
    };

    const handleMoveArena = (arenaId: string, direction: 'left' | 'right', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedCampaign) return;
        if (isCodexCampaign) return; // Prevent reordering codex arenas
        
        const currentIds = [...selectedCampaign.arenaIds];
        const currentIndex = currentIds.indexOf(arenaId);
        if (currentIndex === -1) return;
        
        const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
        
        if (newIndex >= 0 && newIndex < currentIds.length) {
            [currentIds[currentIndex], currentIds[newIndex]] = [currentIds[newIndex], currentIds[currentIndex]];
            updateCampaign(selectedCampaign.id, { arenaIds: currentIds });
        }
    };
    
    const isArenaLocked = (arenaId: string) => {
        if (!selectedCampaign) return false;
        const config = selectedCampaign.arenaConfig?.[arenaId];
        
        // Manual lock override is effectively removed from UI but respected if set
        if (config?.isLocked) return true;

        // Check prerequisites
        const prerequisites = config?.prerequisiteArenaIds || [];
        
        // In Codex campaigns (sequential), check if previous arena is cleared
        if (isCodexCampaign) {
            const arenaIndex = selectedCampaign.arenaIds.indexOf(arenaId);
            if (arenaIndex > 0) {
                const prevArenaId = selectedCampaign.arenaIds[arenaIndex - 1];
                const prevConfig = selectedCampaign.arenaConfig?.[prevArenaId];
                if (!prevConfig?.isCleared) return true;
            }
        }

        if (prerequisites.length === 0) return false;

        // Check if all prerequisites are cleared
        const allPrereqsCleared = prerequisites.every(prereqId => {
            const prereqConfig = selectedCampaign.arenaConfig?.[prereqId];
            return prereqConfig?.isCleared;
        });

        return !allPrereqsCleared;
    };

    const handleArenaClick = (arenaId: string) => {
        if (!selectedCampaign) return;

        if (isLinkingMode) {
            if (isCodexCampaign) return; // Disable linking for Codex campaigns
            if (!linkingSourceId) {
                setLinkingSourceId(arenaId);
            } else {
                if (linkingSourceId === arenaId) {
                    setLinkingSourceId(null);
                    return;
                }
                const currentConfig = selectedCampaign.arenaConfig || {};
                const targetConfig = currentConfig[arenaId] || {};
                const currentPrereqs = targetConfig.prerequisiteArenaIds || [];
                
                let newPrereqs;
                if (currentPrereqs.includes(linkingSourceId)) {
                    newPrereqs = currentPrereqs.filter(id => id !== linkingSourceId);
                } else {
                    const sourceConfig = currentConfig[linkingSourceId] || {};
                    const sourcePrereqs = sourceConfig.prerequisiteArenaIds || [];
                    if (sourcePrereqs.includes(arenaId)) {
                        alert("Não é possível criar dependência circular!");
                        return;
                    }
                    newPrereqs = [...currentPrereqs, linkingSourceId];
                }

                updateCampaign(selectedCampaign.id, {
                    arenaConfig: {
                        ...currentConfig,
                        [arenaId]: {
                            ...targetConfig,
                            prerequisiteArenaIds: newPrereqs
                        }
                    }
                });
            }
        } else {
            setSelectedArenaId(arenaId);
        }
    };

    const handleCreateFutureArena = () => {
        setIsCreatingArena(true);
    };

    const onArenaCreated = (newArena: Arena) => {
        if (!selectedCampaign) return;
        
        updateCampaign(selectedCampaign.id, {
            arenaIds: [...selectedCampaign.arenaIds, newArena.id],
            arenaConfig: {
                ...(selectedCampaign.arenaConfig || {}),
                [newArena.id]: {
                    isLocked: false,
                    isHidden: false
                }
            }
        });
        setIsCreatingArena(false);
    };

    const selectedArena = selectedArenaId ? getArenas().find(a => a.id === selectedArenaId) : null;

    // RENDER: LIST VIEW (Grid of Campaigns)
    if (!selectedCampaign) {
        return (
            <Portal>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                    <GlassCard variant="neutral" className="w-full max-w-5xl h-[85vh] flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-bold uppercase tracking-wider text-white">Campanhas</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {/* Create New Button */}
                                <button 
                                    onClick={handleCreateCampaign}
                                    className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-[var(--skin-accent-color)] hover:bg-white/5 flex flex-col items-center justify-center gap-2 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-[var(--skin-accent-color)] group-hover:text-black flex items-center justify-center transition-all">
                                        <PlusIcon className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-400 group-hover:text-white">Nova Campanha</span>
                                </button>

                                {/* Campaign Cards */}
                                {validCampaigns.map(campaign => {
                                    // Determine if it's a Codex campaign for visual cue
                                    const isCodex = campaign.arenaIds.some(id => getArenas().find(a => a.id === id)?.originCodexId);
                                    
                                    return (
                                        <div 
                                            key={campaign.id}
                                            onClick={() => setSelectedCampaignId(campaign.id)}
                                            className="aspect-[4/3] bg-[#1a1a1a] rounded-2xl border border-white/10 hover:border-[var(--skin-accent-color)] cursor-pointer flex flex-col overflow-hidden group relative transition-all hover:shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                        >
                                            {/* Folder Tab Effect */}
                                            <div className="absolute top-0 left-0 w-1/3 h-1 bg-white/20 group-hover:bg-[var(--skin-accent-color)] transition-colors" />
                                            
                                            {isCodex && (
                                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-[var(--skin-accent-color)]/20 border border-[var(--skin-accent-color)]/50 rounded text-[9px] font-bold text-[var(--skin-accent-color)] uppercase tracking-wider">
                                                    Codex
                                                </div>
                                            )}

                                            <div className="flex-1 p-4 flex flex-col justify-end">
                                                <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 mb-1 group-hover:text-[var(--skin-accent-color)] transition-colors">
                                                    {campaign.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 line-clamp-2">
                                                    {campaign.description || "Sem descrição."}
                                                </p>
                                            </div>
                                            
                                            <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex items-center justify-between">
                                                <div className="text-[10px] text-gray-400 font-mono">
                                                    {campaign.arenaIds.length} Arenas
                                                </div>
                                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                                    <ChevronRightIcon className="w-3 h-3 text-gray-400" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </Portal>
        );
    }

    // RENDER: DETAIL VIEW
    return (
        <Portal>
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden relative" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex justify-between items-start shrink-0 bg-black/20">
                        <div className="flex items-start gap-4 flex-1">
                            <button 
                                onClick={() => setSelectedCampaignId(null)}
                                className="mt-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                title="Voltar"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            
                            <div className="flex-1 mr-4">
                                {isEditing ? (
                                    <div className="space-y-2 max-w-xl">
                                        <input 
                                            value={editTitle}
                                            onChange={e => setEditTitle(e.target.value)}
                                            className="w-full bg-black/50 border-b border-white/20 text-xl font-bold text-white p-1 focus:outline-none focus:border-[var(--skin-accent-color)]"
                                            placeholder="Nome da Campanha"
                                            autoFocus
                                        />
                                        <textarea 
                                            value={editDescription}
                                            onChange={e => setEditDescription(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg text-gray-300 p-2 text-sm focus:outline-none focus:border-[var(--skin-accent-color)] resize-none"
                                            rows={2}
                                            placeholder="Descrição..."
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={handleSaveCampaign} className="px-3 py-1 bg-[var(--skin-accent-color)] text-black text-xs font-bold rounded hover:brightness-110">Salvar</button>
                                            <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded hover:bg-white/20">Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="arena-title arena-title-text text-3xl text-[var(--skin-accent-color)] luxe-title-shadow leading-tight line-clamp-2" style={{ fontFamily: 'Cinzel, serif' }}>
                                                {selectedCampaign.title}
                                            </h1>
                                            {!isCodexCampaign && (
                                                <div className="flex items-center gap-1 ml-2 bg-black/40 rounded-lg p-1 border border-white/10">
                                                    <button onClick={() => setIsEditing(true)} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-all" title="Editar Título/Descrição">
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    <div className="w-px h-4 bg-white/10"></div>
                                                    <button onClick={handleDeleteCampaign} className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-all" title="Excluir Campanha">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Expandable Description */}
                                        <div className="relative mt-2">
                                            <p className={`text-gray-400 text-sm max-w-2xl transition-all leading-relaxed ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
                                                {selectedCampaign.description}
                                            </p>
                                            {(selectedCampaign.description && selectedCampaign.description.length > 100) && (
                                                <button 
                                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                                    className="text-[var(--skin-accent-color)] text-xs font-bold mt-1 hover:underline flex items-center gap-1"
                                                >
                                                    {isDescriptionExpanded ? 'Mostrar menos' : 'Mostrar mais'}
                                                    <ChevronDownIcon className={`w-3 h-3 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {isLinkingMode && (
                                <span className="text-xs text-[var(--skin-accent-color)] font-bold animate-pulse mr-2">
                                    Selecione o REQUISITO, depois as arenas que ele BLOQUEIA.
                                </span>
                            )}
                            {!isCodexCampaign && (
                                <>
                                    <button
                                        onClick={() => setIsLinkingMode(!isLinkingMode)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                                            isLinkingMode 
                                                ? 'bg-blue-500/20 border-blue-500 text-blue-400 animate-pulse' 
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        {isLinkingMode ? 'Vínculo (Ativo)' : 'Vincular'}
                                    </button>
                                    <button 
                                        onClick={handleCreateFutureArena}
                                        className="flex items-center justify-center w-8 h-8 bg-[var(--skin-accent-color)]/10 hover:bg-[var(--skin-accent-color)]/20 border border-[var(--skin-accent-color)]/30 rounded-lg transition-all text-[var(--skin-accent-color)]"
                                        title="Adicionar Arena"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Grid Area */}
                    <div className="flex-1 overflow-y-auto relative p-6 bg-black/40">
                        {sortedArenas.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <p className="mb-4">Nenhuma arena definida nesta campanha.</p>
                                {!isCodexCampaign && (
                                    <button 
                                        onClick={handleCreateFutureArena}
                                        className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm transition-all"
                                    >
                                        + Adicionar Primeira Arena
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-4 justify-center content-start">
                                {sortedArenas.map((arena, index) => {
                                    const locked = isArenaLocked(arena.id);
                                    const config = selectedCampaign.arenaConfig?.[arena.id] || {};
                                    const prereqs = config.prerequisiteArenaIds || [];
                                    const isSource = linkingSourceId === arena.id;
                                    const isPrereqOfSource = linkingSourceId && selectedCampaign.arenaConfig?.[linkingSourceId]?.prerequisiteArenaIds?.includes(arena.id);
                                    const isTargetOfSource = linkingSourceId && prereqs.includes(linkingSourceId);
                                    
                                    // Highlight logic for linking mode
                                    let borderClass = 'border-transparent';
                                    let scaleClass = '';
                                    
                                    if (isLinkingMode) {
                                        if (isSource) {
                                            borderClass = 'border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.6)]';
                                            scaleClass = 'scale-105 z-10';
                                        }
                                        else if (isTargetOfSource) {
                                            borderClass = 'border-green-500 border-dashed shadow-[0_0_15px_rgba(34,197,94,0.4)]';
                                        }
                                        else if (linkingSourceId) {
                                            borderClass = 'border-white/10 hover:border-blue-300 cursor-pointer';
                                        }
                                    } else {
                                        if (locked) borderClass = 'border-red-900/50 grayscale-[0.5] opacity-75';
                                        else if (config.isCleared) borderClass = 'border-green-500/30';
                                    }

                                    return (
                                        <div 
                                            key={arena.id} 
                                            className={`relative w-[240px] flex-shrink-0 transition-all duration-300 group ${scaleClass}`}
                                            onClick={() => handleArenaClick(arena.id)}
                                        >
                                            {/* Linking Indicators */}
                                            {isLinkingMode && (
                                                <div className="absolute -top-3 left-0 w-full flex justify-center z-20 pointer-events-none">
                                                    {isSource && <span className="bg-blue-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shadow-lg">Requisito</span>}
                                                    {isTargetOfSource && <span className="bg-green-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shadow-lg">Liberado</span>}
                                                </div>
                                            )}

                                            {/* Main Card Wrapper */}
                                            <div className={`rounded-xl border-2 transition-all duration-300 bg-[#1a1a1a] overflow-hidden ${borderClass} relative group`}>
                                                
                                                {/* Floating Controls (Top Right) - Only for custom campaigns */}
                                                {!isCodexCampaign && !isLinkingMode && (
                                                    <div className="absolute top-1 right-1 z-30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm rounded-lg p-1 border border-white/10">
                                                        <button 
                                                            onClick={(e) => handleMoveArena(arena.id, 'left', e)}
                                                            disabled={index === 0}
                                                            className="p-1 rounded hover:bg-white/20 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Mover para Esquerda"
                                                        >
                                                            <ChevronLeftIcon className="w-3 h-3" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => handleMoveArena(arena.id, 'right', e)}
                                                            disabled={index === sortedArenas.length - 1}
                                                            className="p-1 rounded hover:bg-white/20 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Mover para Direita"
                                                        >
                                                            <ChevronRightIcon className="w-3 h-3" />
                                                        </button>
                                                        <div className="w-px h-3 bg-white/20 mx-0.5" />
                                                        <button 
                                                            onClick={(e) => handleRemoveArena(arena.id, e)}
                                                            className="p-1 rounded hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
                                                            title="Remover da Campanha"
                                                        >
                                                            <TrashIcon className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Status Header Overlay */}
                                                {(locked || config.isCleared) && !isLinkingMode && (
                                                    <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${
                                                        locked ? 'bg-red-500' : 'bg-green-500'
                                                    }`} />
                                                )}
                                                
                                                {/* Locked Overlay with Padlock */}
                                                {locked && !isLinkingMode && (
                                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px] pointer-events-none">
                                                        <div className="bg-black/60 p-3 rounded-full border border-red-500/30 shadow-lg backdrop-blur-md">
                                                            <LockIcon className="w-6 h-6 text-red-400" />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Mini Arena Card Content */}
                                                <div className={`${(isLinkingMode) ? 'pointer-events-none' : ''}`}>
                                                    <ArenaCard 
                                                        arena={arena}
                                                        actions={actions.filter(a => a.arenaId === arena.id)}
                                                        variant="overview" 
                                                        onClick={() => {}} // Click handled by parent div
                                                    />
                                                </div>

                                                {/* Footer Controls / Prerequisites */}
                                                {!isCodexCampaign && prereqs.length > 0 && (
                                                    <div className="p-1.5 bg-black/80 border-t border-white/5 flex items-center justify-center min-h-[24px]">
                                                        {/* Dependencies */}
                                                        <div className="flex flex-wrap gap-1 justify-center w-full">
                                                            {prereqs.map(pid => {
                                                                const pArena = getArenas().find(a => a.id === pid);
                                                                const pCleared = selectedCampaign.arenaConfig?.[pid]?.isCleared;
                                                                return (
                                                                    <div key={pid} className={`px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[8px] font-bold border ${
                                                                        pCleared 
                                                                            ? 'bg-green-900/40 border-green-500/50 text-green-400 opacity-50' 
                                                                            : 'bg-red-900/40 border-red-500/50 text-red-400'
                                                                    }`} title={`Requer: ${pArena?.name}`}>
                                                                        <LinkIcon className="w-2.5 h-2.5" />
                                                                        <span className="max-w-[60px] truncate">{pArena?.name}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {isCreatingArena && (
                        <NewArenaModal 
                            assetId="" 
                            onClose={() => setIsCreatingArena(false)} 
                            onArenaCreated={onArenaCreated}
                        />
                    )}
                    
                    {selectedArena && (
                        <ArenaDetailModal 
                            arena={selectedArena}
                            onClose={() => setSelectedArenaId(null)}
                        />
                    )}
                </GlassCard>
            </div>
        </Portal>
    );
};
