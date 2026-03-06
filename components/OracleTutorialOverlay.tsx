import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTutorial } from '../contexts/TutorialContext';
import { TUTORIAL_STEPS } from '../constants/tutorialSteps';
import { Portal } from './Portal';

const OracleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4Z" fill="url(#oracle-gradient)" fillOpacity="0.2" />
        <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8Z" fill="url(#oracle-gradient)" />
        <defs>
            <linearGradient id="oracle-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFD700" />
                <stop offset="1" stopColor="#FF8C00" />
            </linearGradient>
        </defs>
    </svg>
);

export const OracleTutorialOverlay: React.FC = () => {
    const { isTutorialActive, currentStep, nextStep, endTutorial, tutorialSteps } = useTutorial();
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

    const step = tutorialSteps[currentStep];

    // View Switching
    useEffect(() => {
        if (!isTutorialActive || !step) return;

        console.log(`Tutorial navigating to view: ${step.view}, tab: ${step.tab}, showProfile: ${step.showProfile}`);

        // Dispatch event to switch view in App.tsx
        const event = new CustomEvent('tutorialNavigate', {
            detail: {
                view: step.view,
                tab: step.tab,
                showReports: step.showReports,
                showProfile: step.showProfile,
                showOracleSettings: step.showOracleSettings,
                showRestScreen: step.showRestScreen
            }
        });
        window.dispatchEvent(event);
    }, [currentStep, isTutorialActive, step]);

    // Calculate if bubble should be at top or bottom
    const bubblePosition = useMemo(() => {
        if (!spotlightRect) return 'top';

        const screenHeight = window.innerHeight;
        const spotlightCenterY = spotlightRect.top + spotlightRect.height / 2;

        // Use a 40% threshold to avoid being too jumpy in the middle
        if (spotlightCenterY < screenHeight * 0.45) {
            return 'bottom';
        }
        return 'top';
    }, [spotlightRect]);

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
        }, 15); // Even faster typing for better UX

        return () => clearInterval(typingInterval);
    }, [currentStep, isTutorialActive, step]);

    // Spotlight Calculation with multiple retries and mutation observer
    useEffect(() => {
        if (!isTutorialActive || !step?.targetId) {
            setSpotlightRect(null);
            return;
        }

        let retryCount = 0;
        const maxRetries = 10; // Increased retries

        const updateRect = () => {
            const el = document.getElementById(step.targetId!);
            if (el) {
                const rect = el.getBoundingClientRect();
                // Check if rect is valid and has visible size
                if (rect.width > 0 && rect.height > 0) {
                    setSpotlightRect(rect);
                    return true;
                }
            }
            return false;
        };

        const attemptUpdate = () => {
            if (updateRect()) return;

            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(attemptUpdate, 150 * retryCount);
            }
        };

        // Initial delay for transitions and modal openings
        const timer = setTimeout(attemptUpdate, 400);

        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        // Listen for ANY change in the DOM (very helpful for modals/portals)
        const observer = new MutationObserver(() => {
            if (updateRect()) {
                // If we found it via mutation, we can stop the retry timer but keep the observer
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
            observer.disconnect();
        };
    }, [currentStep, isTutorialActive, step]);

    // Keyboard Navigation (Space/Enter to advance, but ONLY if typing is finished or to skip it)
    useEffect(() => {
        if (!isTutorialActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                endTutorial(true);
            } else if (e.key === ' ' || e.key === 'Enter') {
                // Advance tutorial manually on key press
                e.preventDefault();
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTutorialActive, isTyping, currentStep, tutorialSteps]);

    if (!isTutorialActive || !step) return null;

    const handleNext = () => {
        if (isTyping) {
            // Complete typing instantly instead of going to next step
            setDisplayedText(step.text);
            setIsTyping(false);
        } else {
            // Only go to next step if typing is finished
            if (currentStep >= tutorialSteps.length - 1) {
                endTutorial(true);
            } else {
                nextStep();
            }
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[20000] pointer-events-auto" onClick={(e) => {
                // Capture clicks everywhere to advance, but allow interactions with the dialog itself
                if (e.target === e.currentTarget) {
                    handleNext();
                }
            }}>
                {/* Ultra-transparent backdrop to keep UI visible as requested */}
                <div
                    className="absolute inset-0 bg-black/5 transition-all duration-500"
                    onClick={handleNext} // Clicking the backdrop advances
                    style={{
                        maskImage: spotlightRect
                            ? `radial-gradient(circle ${Math.max(spotlightRect.width, spotlightRect.height) / 1.5 + 20}px at ${spotlightRect.left + spotlightRect.width / 2}px ${spotlightRect.top + spotlightRect.height / 2}px, transparent 100%, black 100%)`
                            : 'none',
                        WebkitMaskImage: spotlightRect
                            ? `radial-gradient(circle ${Math.max(spotlightRect.width, spotlightRect.height) / 1.5 + 20}px at ${spotlightRect.left + spotlightRect.width / 2}px ${spotlightRect.top + spotlightRect.height / 2}px, transparent 100%, black 100%)`
                            : 'none'
                    } as any}
                />

                {/* Yellow Spotlight Frame */}
                {spotlightRect && (
                    <div
                        className="absolute border-2 border-yellow-400/80 rounded-lg transition-all duration-500 shadow-[0_0_20px_rgba(250,204,21,0.4)] pointer-events-none"
                        style={{
                            left: spotlightRect.left - 10,
                            top: spotlightRect.top - 10,
                            width: spotlightRect.width + 20,
                            height: spotlightRect.height + 20,
                        }}
                    >
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-yellow-200" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-yellow-200" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-yellow-200" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-yellow-200" />
                    </div>
                )}

                {/* Dialog Box - Dynamic Positioning */}
                <div className={`absolute left-0 right-0 flex justify-center px-4 transition-all duration-500 pointer-events-none ${bubblePosition === 'top' ? 'top-6 md:top-16' : 'bottom-16 md:bottom-24'}`}>
                    <div className="bg-black/95 border border-white/20 backdrop-blur-xl rounded-xl p-2 md:p-4 w-full max-w-[min(480px,94vw)] md:max-w-2xl shadow-2xl flex gap-3 md:gap-4 pointer-events-auto animate-fade-in-down border-b-4 border-b-[var(--gold)]">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-[var(--gold)] flex items-center justify-center shadow-lg">
                                <OracleIcon className="w-6 h-6 md:w-10 md:h-10 animate-pulse-slow" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-grow flex flex-col justify-between min-h-[60px] md:min-h-[100px]">
                            <div>
                                <div className="flex justify-between items-start mb-0.5">
                                    <div className="flex flex-col">
                                        <h3 className="text-[var(--gold)] font-bold uppercase tracking-widest text-[9px] md:text-sm">{step.title}</h3>
                                        <span className="text-[8px] md:text-[10px] text-gray-500 font-mono">
                                            {currentStep === 0 ? 'INTRO' : `${currentStep} / ${tutorialSteps.length - 1}`}
                                        </span>
                                    </div>
                                    <button onClick={() => endTutorial(true)} className="text-[8px] md:text-[10px] text-gray-500 hover:text-white uppercase tracking-wider transition-colors px-1">
                                        Pular [ESC]
                                    </button>
                                </div>
                                <p className="text-gray-200 text-[11px] md:text-sm leading-tight md:leading-relaxed whitespace-pre-wrap font-mono">
                                    {displayedText}
                                    <span className="animate-pulse inline-block w-1 h-3 md:w-2 md:h-4 bg-[var(--gold)] ml-1 align-middle opacity-70"></span>
                                </p>
                            </div>

                            {/* Footer / Indicator */}
                            <div className="flex justify-end mt-1">
                                <button
                                    onClick={handleNext}
                                    className={`text-[var(--gold)] text-[10px] md:text-xs font-bold flex items-center gap-1 hover:text-white transition-colors ${!isTyping ? 'animate-bounce' : 'opacity-80'}`}
                                >
                                    {currentStep === tutorialSteps.length - 1 ? 'FINALIZAR' : 'PRÓXIMO'} ▼
                                </button>
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
