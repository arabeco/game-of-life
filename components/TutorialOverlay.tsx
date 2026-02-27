import React, { useState, useEffect, useRef } from 'react';
import { useTutorial } from '../contexts/TutorialContext';
import { Portal } from './Portal';

const OracleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4Z" fill="url(#oracle-gradient)" fillOpacity="0.2"/>
        <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8Z" fill="url(#oracle-gradient)"/>
        <defs>
            <linearGradient id="oracle-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFD700"/>
                <stop offset="1" stopColor="#FF8C00"/>
            </linearGradient>
        </defs>
    </svg>
);

export const TutorialOverlay: React.FC = () => {
    const { isTutorialActive, currentStep, nextStep, endTutorial, tutorialSteps } = useTutorial();
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
    
    const step = tutorialSteps[currentStep];

    // View Switching
    useEffect(() => {
        if (!isTutorialActive || !step) return;

        // Dispatch event to switch view in App.tsx
        const event = new CustomEvent('tutorialNavigate', { detail: { view: step.view } });
        window.dispatchEvent(event);
    }, [currentStep, isTutorialActive, step]);

    // Typing Effect
    useEffect(() => {
        if (!isTutorialActive || !step) return;

        setDisplayedText('');
        setIsTyping(true);
        
        const fullText = step.text;
        let charIndex = 0;

        const typingInterval = setInterval(() => {
            if (charIndex <= fullText.length) {
                setDisplayedText(fullText.slice(0, charIndex));
                charIndex++;
            } else {
                setIsTyping(false);
                clearInterval(typingInterval);
            }
        }, 30);

        return () => clearInterval(typingInterval);
    }, [currentStep, isTutorialActive, step]);

    // Spotlight Calculation
    useEffect(() => {
        if (!isTutorialActive || !step?.targetId) {
            setSpotlightRect(null);
            return;
        }

        const updateRect = () => {
            const el = document.getElementById(step.targetId!);
            if (el) {
                const rect = el.getBoundingClientRect();
                setSpotlightRect(rect);
            } else {
                // Retry if element not found (maybe rendering)
                setTimeout(() => {
                    const elRetry = document.getElementById(step.targetId!);
                    if (elRetry) setSpotlightRect(elRetry.getBoundingClientRect());
                }, 500);
            }
        };

        updateRect();
        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true); // Capture scroll events
        return () => {
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
        };
    }, [currentStep, isTutorialActive, step]);

    // Keyboard Navigation
    useEffect(() => {
        if (!isTutorialActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                endTutorial(true);
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault(); // Prevent scrolling
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTutorialActive, isTyping, currentStep]); // Depend on isTyping to skip anim

    if (!isTutorialActive || !step) return null;

    const handleNext = () => {
        if (isTyping) {
            // Complete typing instantly
            setDisplayedText(step.text);
            setIsTyping(false);
        } else {
            if (currentStep >= tutorialSteps.length - 1) {
                endTutorial(true);
            } else {
                nextStep();
            }
        }
    };

    return (
        <Portal>
        <div className="fixed inset-0 z-[9999] pointer-events-auto">
            {/* Backdrop with Hole (Spotlight) */}
            {spotlightRect ? (
                <>
                    <div className="absolute bg-black/70 backdrop-blur-[2px] transition-all duration-300" style={{ top: 0, left: 0, right: 0, height: spotlightRect.top }} />
                    <div className="absolute bg-black/70 backdrop-blur-[2px] transition-all duration-300" style={{ top: spotlightRect.bottom, left: 0, right: 0, bottom: 0 }} />
                    <div className="absolute bg-black/70 backdrop-blur-[2px] transition-all duration-300" style={{ top: spotlightRect.top, left: 0, width: spotlightRect.left, height: spotlightRect.height }} />
                    <div className="absolute bg-black/70 backdrop-blur-[2px] transition-all duration-300" style={{ top: spotlightRect.top, left: spotlightRect.right, right: 0, height: spotlightRect.height }} />
                    
                    {/* Highlight Border */}
                    <div 
                        className="absolute border-2 border-[var(--gold)] rounded-lg shadow-[0_0_20px_var(--gold)] animate-pulse transition-all duration-300 pointer-events-none"
                        style={{
                            top: spotlightRect.top - 4,
                            left: spotlightRect.left - 4,
                            width: spotlightRect.width + 8,
                            height: spotlightRect.height + 8,
                        }}
                    />
                </>
            ) : (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            )}

            {/* Dialog Box - Fixed at Top */}
            <div className="absolute top-16 left-0 right-0 flex justify-center px-4 pointer-events-none">
                <div className="bg-black/80 border border-white/20 backdrop-blur-md rounded-xl p-4 w-full max-w-2xl shadow-2xl flex gap-4 pointer-events-auto animate-fade-in-down">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-[var(--gold)] flex items-center justify-center shadow-lg">
                            <OracleIcon className="w-10 h-10 animate-pulse-slow" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-grow flex flex-col justify-between min-h-[100px]">
                        <div>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-[var(--gold)] font-bold uppercase tracking-widest text-sm">{step.title}</h3>
                                <button onClick={() => endTutorial(true)} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider transition-colors">
                                    Pular [ESC]
                                </button>
                            </div>
                            <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                {displayedText}
                                <span className="animate-pulse inline-block w-2 h-4 bg-[var(--gold)] ml-1 align-middle opacity-70"></span>
                            </p>
                        </div>

                        {/* Footer / Indicator */}
                        <div className="flex justify-end mt-2">
                            {!isTyping && (
                                <button 
                                    onClick={handleNext}
                                    className="text-[var(--gold)] text-xs font-bold animate-bounce flex items-center gap-1 hover:text-white transition-colors"
                                >
                                    {currentStep === tutorialSteps.length - 1 ? 'CONCLUIR' : 'PRÓXIMO'} ▼
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Capture clicks everywhere to advance */}
            <div className="absolute inset-0 z-[-1]" onClick={handleNext} />
        </div>
        </Portal>
    );
};
