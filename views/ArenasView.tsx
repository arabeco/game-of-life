import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Arena } from '../types';
import { PlusIcon, EyeIcon } from '../components/Icons';
import { ArenaDetailModal } from '../components/ArenaDetailModal';
import { NewArenaModal } from '../components/NewArenaModal';
import { ArenaCard } from '../components/ArenaCard';
import { useTutorial } from '../contexts/TutorialContext';

export const ArenasView: React.FC = () => {
    const { getArenas, assets, actions } = useGame();
    const { isTutorialActive, currentStep, nextStep, setSpotlight } = useTutorial();
    const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);
    const [isCreatingArena, setIsCreatingArena] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const fabRef = useRef<HTMLButtonElement>(null);
    
    const allArenas = getArenas().filter(a => showArchived || !a.isArchived);
    const selectedArena = allArenas.find(a => a.id === selectedArenaId);

    useEffect(() => {
        if (isTutorialActive && currentStep === 2 && fabRef.current) {
            const rect = fabRef.current.getBoundingClientRect();
            setSpotlight(rect, {
                title: "Passo 2: Crie uma Arena",
                text: "Toque aqui para criar sua primeira Arena. Ela representará um contexto da sua vida, como 'Trabalho' ou 'Saúde'.",
            });
        }
    }, [isTutorialActive, currentStep, setSpotlight]);
    
    const getAssetById = (id: string) => assets.find(a => a.id === id);
    const getActionsForArena = (arenaId: string) => actions.filter(a => a.arenaId === arenaId);

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

    return (
        <>
            <div className="p-4 relative min-h-full">
                 <div className="absolute top-0 right-4">
                    <button onClick={() => setShowArchived(s => !s)} className={`p-2 rounded-full transition-colors ${showArchived ? 'bg-white/20 text-white' : 'text-gray-500'}`}>
                        <EyeIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-8">
                    {allArenas.map((arena) => {
                         const asset = getAssetById(arena.assetId);
                         const arenaActions = getActionsForArena(arena.id);
                        return (
                            <ArenaCard 
                                key={arena.id} 
                                arena={arena} 
                                assetName={asset?.name || ''}
                                actions={arenaActions}
                                onClick={() => setSelectedArenaId(arena.id)}
                                variant="overview"
                            />
                        )
                    })}
                </div>
                 <button 
                    ref={fabRef}
                    onClick={handleOpenCreateArena}
                    className="fixed bottom-20 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-black/50 transform hover:scale-110 transition-transform"
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