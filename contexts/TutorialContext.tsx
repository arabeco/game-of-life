import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useGame, PROFILE_FLAG_TUTORIAL_COMPLETED } from './GameContext';
import { TUTORIAL_STEPS } from '../constants/tutorialSteps';
import { TutorialStep } from '../types';

interface TooltipContent {
    title: string;
    text: string;
}

interface TutorialContextType {
    isTutorialActive: boolean;
    isTutorialCompleted: boolean;
    isFlagCompleted: (flag: string) => boolean;
    currentStep: number;
    spotlightTarget: DOMRect | null;
    tooltipContent: TooltipContent | null;
    tutorialSteps: TutorialStep[];
    didForceGameMode: boolean;
    originalMode: 'BASIC' | 'GAME' | null;
    startedFromSettings: boolean;
    startTutorial: (startIndex?: number | null, levelIndicator?: number | null, fromSettings?: boolean) => void;
    startTutorialLevel: (level: number) => void;
    restartTutorial: () => void;
    endTutorial: (completed?: boolean) => void;
    nextStep: () => void;
    goToStep: (step: number) => void;
    setSpotlight: (rect: DOMRect | null, content: TooltipContent | null) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userProfile, completeTutorialMission, appMode, setAppMode, addProfileFlag } = useGame();
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [didForceGameMode, setDidForceGameMode] = useState(false);
    const [originalMode, setOriginalMode] = useState<'BASIC' | 'GAME' | null>(null);
    const [activeLevel, setActiveLevel] = useState<number | null>(null);
    const [startedFromSettings, setStartedFromSettings] = useState(false);

    // Get tutorial completion status from user profile
    const isTutorialCompleted = (userProfile.completedSeasonMissions || []).includes(PROFILE_FLAG_TUTORIAL_COMPLETED);

    // Check if a specific tutorial flag is completed
    const isFlagCompleted = useCallback((flag: string) => {
        return (userProfile.completedSeasonMissions || []).includes(flag);
    }, [userProfile.completedSeasonMissions]);

    // Use the unified 25+1 steps tutorial
    const tutorialSteps = useMemo(() => {
        return TUTORIAL_STEPS;
    }, []);

    const restartTutorial = useCallback(() => {
        setActiveLevel(null);
        setIsTutorialActive(true);
        setCurrentStep(0);
    }, []);

    const endTutorial = useCallback((completed: boolean = false) => {
        setIsTutorialActive(false);

        // Restore original mode if we forced it or saved it
        if (didForceGameMode || originalMode) {
            const modeToRestore = originalMode || 'BASIC';
            console.log(`Tutorial Engine: Restoring original mode (${modeToRestore})`);

            // Small delay to let the overlay unmount before the whole app re-renders
            setTimeout(() => {
                setAppMode(modeToRestore);
                setDidForceGameMode(false);
                setOriginalMode(null);
            }, 100);
        }

        const finishedLevel = activeLevel;
        setActiveLevel(null);
        setCurrentStep(0);

        if (completed) {
            if (finishedLevel !== null) {
                // Mark specific level as completed
                addProfileFlag(`tutorial_level_${finishedLevel}_completed`);
            } else {
                // Original full tutorial completion
                completeTutorialMission();
            }
        }
    }, [completeTutorialMission, activeLevel, addProfileFlag, originalMode, setAppMode, didForceGameMode, startedFromSettings]);

    const startTutorial = useCallback((startIndex: number | null = null, levelIndicator: number | null = null, fromSettings: boolean = false) => {
        const index = startIndex !== null ? startIndex : 0;
        setStartedFromSettings(fromSettings);

        // Save original mode before starting
        console.log(`Tutorial Engine: Saving original mode (${appMode})`);
        setOriginalMode(appMode as 'BASIC' | 'GAME');

        setActiveLevel(levelIndicator !== null ? levelIndicator : startIndex);
        console.log(`Tutorial Engine: Jump to Index ${index} (Target: ${TUTORIAL_STEPS[index]?.title})`);
        setCurrentStep(index);
        setIsTutorialActive(true);
    }, [appMode]);

    // Real mode switching based on current step
    useEffect(() => {
        if (!isTutorialActive) return;

        const step = TUTORIAL_STEPS[currentStep];
        const isGameStep = step && (step.category === 'IDENTIDADE' || step.category === 'MUNDO' || (currentStep >= 9 && currentStep <= 19));

        if (isGameStep && appMode === 'BASIC') {
            console.log(`Tutorial Engine: Forcing GAME Mode for step ${currentStep}`);
            // If we don't have an original mode yet, save it
            if (!originalMode) setOriginalMode('BASIC');
            setDidForceGameMode(true);
            setAppMode('GAME');
        } else if (!isGameStep && didForceGameMode && appMode === 'GAME') {
            console.log(`Tutorial Engine: Reverting to original mode (${originalMode || 'BASIC'})`);
            setAppMode(originalMode || 'BASIC');
            setDidForceGameMode(false);
        }

        // Automatic trigger for Mastery Quiz at Step 11
        if (currentStep === 11) {
            console.log('Tutorial Engine: Triggering Mastery Quiz Event');
            window.dispatchEvent(new CustomEvent('tutorialOpenMasteryQuiz'));
        }
    }, [currentStep, isTutorialActive, appMode, didForceGameMode, setAppMode, originalMode]);

    const nextStep = useCallback(() => {
        const currentCategory = TUTORIAL_STEPS[currentStep]?.category;
        const nextIdx = currentStep + 1;
        const nextCategory = TUTORIAL_STEPS[nextIdx]?.category;

        // CRITICAL: Stop flow IF category changes (except when finishing INTRO)
        // This forces the user back to the HUB after completing a station
        if (nextIdx >= TUTORIAL_STEPS.length || (currentCategory !== nextCategory && currentCategory !== 'INTRO')) {
            console.log(`Tutorial Engine: End of station reached (${currentCategory}).`);
            // Every end of station represents a completed section
            endTutorial(true);
        } else {
            setCurrentStep(nextIdx);
        }
    }, [currentStep, endTutorial]);

    const goToStep = useCallback((step: number) => {
        setCurrentStep(step);
    }, []);

    // NEW: Robust mapping from Station Level (1-4) to Step Index
    const startTutorialLevel = useCallback((level: number) => {
        let targetIndex = 1; // Default to Alicerçe
        switch (level) {
            case 1: targetIndex = 1; break;  // O Alicerce
            case 2: targetIndex = 9; break;  // A Identidade
            case 3: targetIndex = 16; break; // O Mundo
            case 4: targetIndex = 20; break; // O Arquiteto
            default: targetIndex = level; // Fallback to raw index if passed
        }
        console.log(`Tutorial Engine: Starting Station Level ${level} -> Index ${targetIndex}`);
        startTutorial(targetIndex, level, true);
    }, [startTutorial]);

    const setSpotlight = useCallback((rect: DOMRect | null, content: TooltipContent | null) => {
        // No-op
    }, []);

    return (
        <TutorialContext.Provider value={{
            isTutorialActive,
            isTutorialCompleted,
            isFlagCompleted,
            currentStep,
            spotlightTarget: null,
            tooltipContent: null,
            tutorialSteps,
            didForceGameMode,
            originalMode,
            startedFromSettings,
            startTutorial,
            startTutorialLevel,
            restartTutorial,
            endTutorial,
            nextStep,
            goToStep,
            setSpotlight,
        }}>
            {children}
        </TutorialContext.Provider>
    );
};

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};
