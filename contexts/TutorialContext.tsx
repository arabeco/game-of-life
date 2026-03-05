import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useGame, PROFILE_FLAG_TUTORIAL_COMPLETED } from './GameContext';
import { TUTORIAL_LEVEL_1, TUTORIAL_LEVEL_2, TUTORIAL_LEVEL_3, TUTORIAL_LEVEL_4, TUTORIAL_STEPS_25, TUTORIAL_STEPS_BASIC } from '../constants/tutorialSteps';
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
    startTutorial: () => void;
    startTutorialLevel: (level: number) => void;
    restartTutorial: () => void;
    endTutorial: (completed?: boolean) => void;
    nextStep: () => void;
    goToStep: (step: number) => void;
    setSpotlight: (rect: DOMRect | null, content: TooltipContent | null) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userProfile, completeTutorialMission, appMode, addProfileFlag } = useGame();
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [activeLevel, setActiveLevel] = useState<number | null>(null);
    
    // Get tutorial completion status from user profile
    const isTutorialCompleted = (userProfile.completedSeasonMissions || []).includes(PROFILE_FLAG_TUTORIAL_COMPLETED);

    // Check if a specific tutorial flag is completed
    const isFlagCompleted = useCallback((flag: string) => {
        return (userProfile.completedSeasonMissions || []).includes(flag);
    }, [userProfile.completedSeasonMissions]);

    // Select tutorial steps based on app mode and active level
    const tutorialSteps = useMemo(() => {
        if (appMode === 'BASIC') return TUTORIAL_STEPS_BASIC;
        
        switch (activeLevel) {
            case 1: return TUTORIAL_LEVEL_1;
            case 2: return TUTORIAL_LEVEL_2;
            case 3: return TUTORIAL_LEVEL_3;
            case 4: return TUTORIAL_LEVEL_4;
            default: return TUTORIAL_STEPS_25;
        }
    }, [appMode, activeLevel]);

    const startTutorial = useCallback(() => {
        setActiveLevel(null);
        setIsTutorialActive(true);
        setCurrentStep(0);
    }, []);

    const startTutorialLevel = useCallback((level: number) => {
        console.log(`Starting tutorial level: ${level}`);
        setActiveLevel(level);
        setIsTutorialActive(true);
        setCurrentStep(0);
    }, []);

    const restartTutorial = useCallback(() => {
        setActiveLevel(null);
        setIsTutorialActive(true);
        setCurrentStep(0);
    }, []);

    const endTutorial = useCallback((completed = true) => {
        setIsTutorialActive(false);
        const finishedLevel = activeLevel;
        setActiveLevel(null);
        setCurrentStep(0);
        
        if (completed) {
            if (finishedLevel) {
                // Mark specific level as completed
                addProfileFlag(`tutorial_level_${finishedLevel}_completed`);
            } else {
                // Original full tutorial completion
                completeTutorialMission();
            }
        }
    }, [completeTutorialMission, activeLevel, addProfileFlag]);

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
            isFlagCompleted,
            currentStep,
            spotlightTarget: null,
            tooltipContent: null,
            tutorialSteps,
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
