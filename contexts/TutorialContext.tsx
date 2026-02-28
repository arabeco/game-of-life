import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useGame, PROFILE_FLAG_TUTORIAL_COMPLETED } from './GameContext';
import { TUTORIAL_STEPS_GAME, TUTORIAL_STEPS_BASIC, TutorialStep } from '../constants/tutorialSteps';

interface TooltipContent {
    title: string;
    text: string;
}

interface TutorialContextType {
    isTutorialActive: boolean;
    isTutorialCompleted: boolean;
    currentStep: number;
    spotlightTarget: DOMRect | null;
    tooltipContent: TooltipContent | null;
    tutorialSteps: TutorialStep[];
    startTutorial: () => void;
    restartTutorial: () => void;
    endTutorial: (completed?: boolean) => void;
    nextStep: () => void;
    goToStep: (step: number) => void;
    setSpotlight: (rect: DOMRect | null, content: TooltipContent | null) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userProfile, completeTutorialMission, appMode } = useGame();
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    
    // Get tutorial completion status from user profile
    const isTutorialCompleted = (userProfile.completedSeasonMissions || []).includes(PROFILE_FLAG_TUTORIAL_COMPLETED);

    // Select tutorial steps based on app mode
    const tutorialSteps = useMemo(() => {
        return appMode === 'BASIC' ? TUTORIAL_STEPS_BASIC : TUTORIAL_STEPS_GAME;
    }, [appMode]);

    const startTutorial = useCallback(() => {
        setIsTutorialActive(true);
        setCurrentStep(0);
    }, []);

    const restartTutorial = useCallback(() => {
        setIsTutorialActive(true);
        setCurrentStep(0);
    }, []);

    const endTutorial = useCallback((completed = true) => {
        setIsTutorialActive(false);
        setCurrentStep(0);
        if (completed) {
            // Use the completeTutorialMission from GameContext which handles both task and flag
            completeTutorialMission();
        }
    }, [completeTutorialMission]);

    const nextStep = useCallback(() => {
        setCurrentStep(prev => prev + 1);
    }, []);

    const goToStep = useCallback((step: number) => {
        setCurrentStep(step);
    }, []);

    // Deprecated: No-op for compatibility during migration
    const setSpotlight = useCallback((rect: DOMRect | null, content: TooltipContent | null) => {
        // No-op
    }, []);

    return (
        <TutorialContext.Provider value={{
            isTutorialActive,
            isTutorialCompleted,
            currentStep,
            spotlightTarget: null,
            tooltipContent: null,
            tutorialSteps,
            startTutorial,
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
