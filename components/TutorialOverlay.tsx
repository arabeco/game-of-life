import React from 'react';
import { useTutorial } from '../contexts/TutorialContext';
import { useGame } from '../contexts/GameContext';

const Tooltip: React.FC<{
    content: { title: string; text: string; };
    onNext?: () => void;
    onClose?: () => void;
}> = ({ content, onNext, onClose }) => {
    const style: React.CSSProperties = {
        position: 'fixed',
        top: '5.5rem', // Positioned below the GlobalHeader (h-20 is 5rem)
        left: 0,
        right: 0,
        margin: '0 auto', // Horizontally center the element
        maxWidth: 'calc(100% - 1rem)',
        width: '380px',
        zIndex: 10001,
        pointerEvents: 'auto',
    };

    return (
        <div style={style} className="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-3 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white">{content.title}</h3>
            <p className="text-sm text-gray-300">{content.text}</p>
            <div className="flex justify-end space-x-2">
                {onClose && <button onClick={onClose} className="text-xs font-bold text-gray-400 hover:text-white px-3 py-1">PULAR</button>}
                {onNext && <button onClick={onNext} className="text-sm font-bold bg-yellow-500 text-black px-4 py-2 rounded-lg">PRÓXIMO</button>}
            </div>
        </div>
    );
};

export const TutorialOverlay: React.FC = () => {
    const { isTutorialActive, currentStep, spotlightTarget, tooltipContent, nextStep, endTutorial } = useTutorial();
    const { completeTutorialMission } = useGame();

    if (!isTutorialActive) return null;

    const handleEndAndComplete = () => {
        completeTutorialMission();
        endTutorial(true);
    };

    // Step 0: Welcome Modal
    if (currentStep === 0) {
        return (
            <div className="fixed inset-0 bg-black/80 z-[9998] flex items-center justify-center p-4">
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 space-y-4 max-w-sm text-center animate-fade-in">
                    <h2 className="text-2xl font-bold text-white">Bem-vindo ao Life OS!</h2>
                    <p className="text-gray-300">Vamos configurar sua primeira missão. Este tutorial rápido irá guiá-lo pelos conceitos básicos.</p>
                    <div className="flex space-x-2">
                        <button onClick={() => endTutorial(false)} className="w-full py-2 rounded-lg bg-gray-700 text-white">Pular Tutorial</button>
                        <button onClick={nextStep} className="w-full py-2 rounded-lg bg-yellow-500 text-black font-bold">Começar</button>
                    </div>
                </div>
            </div>
        );
    }

    // Step 9: Victory Modal
    if (currentStep === 9) {
         return (
            <div className="fixed inset-0 bg-black/80 z-[9998] flex items-center justify-center p-4">
                <div className="bg-gray-800 border border-yellow-500 rounded-lg p-6 space-y-4 max-w-sm text-center animate-fade-in">
                    <h2 className="text-2xl font-bold text-yellow-400">🏆 Parabéns!</h2>
                    <p className="text-gray-300">Tutorial concluído! Você dominou o básico do Life OS e ganhou seu primeiro XP. Continue a jornada, Soberano.</p>
                    <button onClick={handleEndAndComplete} className="w-full py-2 rounded-lg bg-yellow-500 text-black font-bold">CONCLUIR</button>
                </div>
            </div>
        );
    }
    
    // Default overlay with spotlight and tooltip for other steps
    return (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
            {spotlightTarget && (
                <>
                    {/* 4 overlay divs to create a clickable hole */}
                    <div className="fixed bg-black/70 z-[9999]" style={{ top: 0, left: 0, width: '100%', height: spotlightTarget.top }} />
                    <div className="fixed bg-black/70 z-[9999]" style={{ top: spotlightTarget.bottom, left: 0, width: '100%', bottom: 0 }} />
                    <div className="fixed bg-black/70 z-[9999]" style={{ top: spotlightTarget.top, left: 0, width: spotlightTarget.left, height: spotlightTarget.height }} />
                    <div className="fixed bg-black/70 z-[9999]" style={{ top: spotlightTarget.top, left: spotlightTarget.right, right: 0, height: spotlightTarget.height }} />
                    
                    {/* The highlight border around the hole */}
                    <div
                        className="fixed border-2 border-dashed border-[var(--gold)] rounded-2xl transition-all duration-300 ease-in-out z-[9999] animate-pulse"
                        style={{
                            top: spotlightTarget.top - 4,
                            left: spotlightTarget.left - 4,
                            width: spotlightTarget.width + 8,
                            height: spotlightTarget.height + 8,
                        }}
                     />
                </>
            )}
            {tooltipContent && (
                 <Tooltip
                    content={tooltipContent}
                    onClose={() => endTutorial(false)}
                />
            )}
        </div>
    );
};
