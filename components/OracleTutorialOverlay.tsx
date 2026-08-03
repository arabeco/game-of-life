import React, { useState, useEffect, useMemo } from 'react';
import { useTutorial } from '../contexts/TutorialContext';
import { Portal } from './Portal';
import { TUTORIAL_SECTIONS } from '../constants/tutorialSteps';
import { OracleSpeakerMark } from './OracleSpeakerMark';

const getCategoryLabel = (category?: string) => {
    switch (category) {
        case 'ALICERCE': return 'CARD 1';
        case 'IDENTIDADE': return 'CARD 2';
        case 'MUNDO': return 'CARD 3';
        case 'ARQUITETO': return 'CARD 4';
        default: return 'INTRO';
    }
};

export const OracleTutorialOverlay: React.FC = () => {
    const { isTutorialActive, currentStep, nextStep, endTutorial, tutorialSteps, activeLevel } = useTutorial();
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

    const step = tutorialSteps[currentStep];

    useEffect(() => {
        if (!isTutorialActive || !step) return;

        const event = new CustomEvent('tutorialNavigate', {
            detail: {
                view: step.view,
                tab: step.tab,
                showReports: step.showReports,
                showProfile: step.showProfile,
                showOracleSettings: step.showOracleSettings,
                showRestScreen: step.showRestScreen,
            }
        });
        window.dispatchEvent(event);
    }, [currentStep, isTutorialActive, step]);

    const bubblePosition = useMemo(() => {
        if (!spotlightRect) return 'top';

        const screenHeight = window.innerHeight;
        const spotlightCenterY = spotlightRect.top + spotlightRect.height / 2;
        return spotlightCenterY < screenHeight * 0.45 ? 'bottom' : 'top';
    }, [spotlightRect]);

    const currentSection = useMemo(() => TUTORIAL_SECTIONS.find((section) => section.id === activeLevel) || null, [activeLevel]);
    const categoryLabel = useMemo(() => currentSection ? `CARD ${currentSection.id}` : getCategoryLabel(step?.category), [currentSection, step?.category]);
    const progressLabel = useMemo(() => {
        if (!step) return '';
        if (step.category === 'INTRO') return 'Entrada';
        if (currentSection) {
            return `${currentStep - currentSection.startIndex + 1} / ${currentSection.endIndex - currentSection.startIndex + 1}`;
        }
        return `${currentStep} / ${tutorialSteps.length - 1}`;
    }, [currentSection, currentStep, step, tutorialSteps.length]);

    useEffect(() => {
        if (!isTutorialActive || !step) return;

        setDisplayedText('');
        setIsTyping(true);

        const fullText = step.text;
        let charIndex = 0;

        const typingInterval = setInterval(() => {
            if (charIndex <= fullText.length) {
                setDisplayedText(fullText.slice(0, charIndex));
                charIndex += 1;
            } else {
                setIsTyping(false);
                clearInterval(typingInterval);
            }
        }, 15);

        return () => clearInterval(typingInterval);
    }, [currentStep, isTutorialActive, step]);

    useEffect(() => {
        if (!isTutorialActive || !step?.targetId) {
            setSpotlightRect(null);
            return;
        }

        let retryCount = 0;
        const maxRetries = 10;

        const updateRect = () => {
            const el = document.getElementById(step.targetId!);
            if (el) {
                const rect = el.getBoundingClientRect();
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
                retryCount += 1;
                setTimeout(attemptUpdate, 150 * retryCount);
            }
        };

        const timer = setTimeout(attemptUpdate, 400);

        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect, true);

        const observer = new MutationObserver(() => {
            updateRect();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class'],
        });

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect, true);
            observer.disconnect();
        };
    }, [currentStep, isTutorialActive, step]);

    const handleNext = () => {
        if (!step) return;

        if (isTyping) {
            setDisplayedText(step.text);
            setIsTyping(false);
            return;
        }

        if (currentStep >= tutorialSteps.length - 1) {
            endTutorial(true);
        } else {
            nextStep();
        }
    };

    useEffect(() => {
        if (!isTutorialActive) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                endTutorial(true);
            } else if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTutorialActive, isTyping, currentStep, tutorialSteps.length]);

    if (!isTutorialActive || !step) return null;

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[20000] pointer-events-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) handleNext();
                }}
            >
                <div
                    className="absolute inset-0 bg-black/5 transition-all duration-500"
                    onClick={handleNext}
                    style={{
                        maskImage: spotlightRect
                            ? `radial-gradient(circle ${Math.max(spotlightRect.width, spotlightRect.height) / 1.5 + 20}px at ${spotlightRect.left + spotlightRect.width / 2}px ${spotlightRect.top + spotlightRect.height / 2}px, transparent 100%, black 100%)`
                            : 'none',
                        WebkitMaskImage: spotlightRect
                            ? `radial-gradient(circle ${Math.max(spotlightRect.width, spotlightRect.height) / 1.5 + 20}px at ${spotlightRect.left + spotlightRect.width / 2}px ${spotlightRect.top + spotlightRect.height / 2}px, transparent 100%, black 100%)`
                            : 'none',
                    } as any}
                />

                {spotlightRect && (
                    <div
                        className="absolute rounded-xl border border-[#f3d48a]/80 transition-all duration-500 shadow-[0_0_24px_rgba(250,204,21,0.28)] pointer-events-none"
                        style={{
                            left: spotlightRect.left - 10,
                            top: spotlightRect.top - 10,
                            width: spotlightRect.width + 20,
                            height: spotlightRect.height + 20,
                        }}
                    >
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#ffe9b0]" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#ffe9b0]" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#ffe9b0]" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#ffe9b0]" />
                    </div>
                )}

                <div className={`absolute left-0 right-0 flex justify-center px-4 transition-all duration-500 pointer-events-none ${bubblePosition === 'top' ? 'top-5 md:top-12' : 'bottom-12 md:bottom-20'}`}>
                    <div className="w-full max-w-[min(520px,94vw)] md:max-w-[720px] pointer-events-auto animate-fade-in-down">
                        <div className="relative overflow-hidden rounded-[22px] border border-[#f3d48a]/35 bg-[linear-gradient(180deg,rgba(19,16,13,0.96),rgba(8,8,9,0.97))] shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                            <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.18),transparent_70%)] pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#f3d48a]/60 to-transparent pointer-events-none" />

                            <div className="flex gap-3 md:gap-4 p-3 md:p-5">
                                <OracleSpeakerMark tone="guide" size="lg" badge className="mt-0.5 scale-[0.82] md:scale-100" />

                                <div className="flex-grow flex flex-col justify-between min-h-[78px] md:min-h-[112px]">
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.22em] text-[#f3d48a]">
                                                        Oraculo
                                                    </span>
                                                    <span className="h-1 w-1 rounded-full bg-white/20" />
                                                    <span className="inline-flex items-center rounded-full border border-[#f3d48a]/25 bg-[#f3d48a]/10 px-2 py-1 text-[8px] md:text-[10px] font-black tracking-[0.22em] text-[#f3d48a]">
                                                        {categoryLabel}
                                                    </span>
                                                    <span className="text-[9px] md:text-[10px] text-gray-500 tracking-[0.16em] uppercase">
                                                        {progressLabel}
                                                    </span>
                                                </div>
                                                <h3 className="text-[#f6dfab] font-bold uppercase tracking-[0.16em] text-[10px] md:text-sm leading-tight">
                                                    {step.title}
                                                </h3>
                                            </div>

                                            <button
                                                onClick={() => endTutorial(true)}
                                                className="shrink-0 text-[8px] md:text-[10px] text-gray-500 hover:text-white uppercase tracking-[0.18em] transition-colors px-1"
                                            >
                                                Pular
                                            </button>
                                        </div>

                                        <p className="text-gray-100/92 text-[12px] md:text-[15px] leading-[1.45] md:leading-[1.6] whitespace-pre-wrap">
                                            {displayedText}
                                            <span className="animate-pulse inline-block w-1 h-3 md:w-1.5 md:h-4 bg-[#f3d48a] ml-1 align-middle opacity-80"></span>
                                        </p>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3">
                                        <div className="text-[9px] md:text-[11px] text-gray-500 tracking-[0.08em]">
                                            {isTyping ? 'Toque para revelar tudo' : 'Toque em qualquer lugar para seguir'}
                                        </div>

                                        <button
                                            onClick={handleNext}
                                            className={`text-[#f3d48a] text-[10px] md:text-xs font-bold flex items-center gap-1 hover:text-white transition-colors ${!isTyping ? 'animate-bounce' : 'opacity-80'}`}
                                        >
                                            {currentStep === tutorialSteps.length - 1 ? 'FINALIZAR' : 'PRÓXIMO'} ▼
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 z-[-1]" onClick={handleNext} />
            </div>
        </Portal>
    );
};
