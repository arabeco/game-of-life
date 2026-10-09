import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useGame, PROFILE_FLAG_TUTORIAL_COMPLETED } from './GameContext';
import { TUTORIAL_STEPS, TUTORIAL_SECTIONS } from '../constants/tutorialSteps';
import { TutorialStep } from '../types';
import { completedTutorialFlags } from '../utils/tutorialCompletion';

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
    activeLevel: number | null;
    // Mantido apenas porque a MundoView ainda le esta flag; hoje e sempre false.
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

const getFirstStepIndexForCategory = (category: TutorialStep['category']) => {
    const index = TUTORIAL_STEPS.findIndex((step) => step.category === category);
    return index >= 0 ? index : 0;
};

const getTutorialSection = (level: number | null) => {
    if (level === null) return null;
    return TUTORIAL_SECTIONS.find((section) => section.id === level) || null;
};

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userProfile, completeTutorialMission, updateUserProfile } = useGame();
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [activeLevel, setActiveLevel] = useState<number | null>(null);
    const [startedFromSettings, setStartedFromSettings] = useState(false);

    // Get tutorial completion status from user profile
    const isTutorialCompleted = (userProfile.completedSeasonMissions || []).includes(PROFILE_FLAG_TUTORIAL_COMPLETED);

    // Check if a specific tutorial flag is completed
    const isFlagCompleted = useCallback((flag: string) => {
        return (userProfile.completedSeasonMissions || []).includes(flag);
    }, [userProfile.completedSeasonMissions]);

    // Sections share one ordered catalog.
    const tutorialSteps = useMemo(() => {
        return TUTORIAL_STEPS;
    }, []);

    useEffect(() => {
        const flags = userProfile.completedSeasonMissions || [];
        if (flags.includes(PROFILE_FLAG_TUTORIAL_COMPLETED)) return;
        if (!TUTORIAL_SECTIONS.every(section => flags.includes(section.flag))) return;
        updateUserProfile({ completedSeasonMissions: [...flags, PROFILE_FLAG_TUTORIAL_COMPLETED],
            tutorialCompletedAt: userProfile.tutorialCompletedAt || Date.now() });
    }, [userProfile.completedSeasonMissions, userProfile.tutorialCompletedAt, updateUserProfile]);

    const restartTutorial = useCallback(() => {
        setActiveLevel(null);
        setIsTutorialActive(true);
        setCurrentStep(0);
    }, []);

    const endTutorial = useCallback((completed: boolean = false) => {
        setIsTutorialActive(false);

        const finishedLevel = activeLevel;
        setActiveLevel(null);
        setCurrentStep(0);

        if (completed) {
            if (finishedLevel !== null && finishedLevel > 0) {
                const result = completedTutorialFlags(userProfile.completedSeasonMissions || [], finishedLevel,
                    TUTORIAL_SECTIONS.map(section => section.id), PROFILE_FLAG_TUTORIAL_COMPLETED);
                updateUserProfile({ completedSeasonMissions: result.flags,
                    ...(result.allCompleted ? { tutorialCompletedAt: userProfile.tutorialCompletedAt || Date.now() } : {}) });
            } else {
                // Original full tutorial completion
                completeTutorialMission();
                updateUserProfile({ tutorialCompletedAt: Date.now() });
            }
        }
    }, [completeTutorialMission, activeLevel, updateUserProfile, userProfile.completedSeasonMissions, userProfile.tutorialCompletedAt]);

    const startTutorial = useCallback((startIndex: number | null = null, levelIndicator: number | null = null, fromSettings: boolean = false) => {
        const index = startIndex !== null ? startIndex : 0;
        setStartedFromSettings(fromSettings);

        setActiveLevel(levelIndicator !== null ? levelIndicator : null);
        console.log(`Tutorial Engine: Jump to Index ${index} (Target: ${TUTORIAL_STEPS[index]?.title})`);
        setCurrentStep(index);
        setIsTutorialActive(true);
    }, []);

    useEffect(() => {
        if (!isTutorialActive) {
            (window as any).__GOL_TUTORIAL_ACTIVE__ = false;
            return;
        }

        (window as any).__GOL_TUTORIAL_ACTIVE__ = true;

        // The guide highlights controls; opening a subview would remove its anchor.
    }, [currentStep, isTutorialActive]);

    const nextStep = useCallback(() => {
        const activeSection = getTutorialSection(activeLevel);
        const nextIdx = currentStep + 1;

        if (activeSection) {
            if (currentStep >= activeSection.endIndex) {
                console.log(`Tutorial Engine: End of station reached (${activeSection.name}).`);
                endTutorial(true);
            } else {
                setCurrentStep(Math.min(nextIdx, activeSection.endIndex));
            }
            return;
        }

        // A full guide only completes after the final step, not a category boundary.
        if (nextIdx >= TUTORIAL_STEPS.length) {
            endTutorial(true);
        } else {
            setCurrentStep(nextIdx);
        }
    }, [currentStep, endTutorial]);

    const goToStep = useCallback((step: number) => {
        setCurrentStep(step);
    }, []);

    const startTutorialLevel = useCallback((level: number) => {
        const targetSection = getTutorialSection(level);
        const targetIndex = targetSection ? targetSection.startIndex : getFirstStepIndexForCategory('ALICERCE');
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
            activeLevel,
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
