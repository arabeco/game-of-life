import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useGame, PROFILE_FLAG_TUTORIAL_COMPLETED } from './GameContext';

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
    startTutorial: () => void;
    endTutorial: (completed?: boolean) => void;
    nextStep: () => void;
    goToStep: (step: number) => void;
    setSpotlight: (rect: DOMRect | null, content: TooltipContent | null) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { userProfile, addProfileFlag } = useGame();
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    
    // Get tutorial completion status from user profile
    const isTutorialCompleted = (userProfile.completedSeasonMissions || []).includes(PROFILE_FLAG_TUTORIAL_COMPLETED);

    const startTutorial = useCallback(() => {
        setIsTutorialActive(true);
        setCurrentStep(0);
    }, []);

    const endTutorial = useCallback((completed = true) => {
        setIsTutorialActive(false);
        setCurrentStep(0);
        if (completed) {
            // Save tutorial completion to user profile instead of localStorage
            addProfileFlag(PROFILE_FLAG_TUTORIAL_COMPLETED);
        }
    }, [addProfileFlag]);

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
            startTutorial,
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
