import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

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
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [spotlightTarget, setSpotlightTarget] = useState<DOMRect | null>(null);
    const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
    const [isTutorialCompleted, setIsTutorialCompleted] = useState(() => {
        try {
            return localStorage.getItem('tutorialCompleted') === 'true';
        } catch {
            return false;
        }
    });

    const startTutorial = useCallback(() => {
        setIsTutorialActive(true);
        setCurrentStep(0);
    }, []);

    const endTutorial = useCallback((completed = true) => {
        setIsTutorialActive(false);
        setSpotlightTarget(null);
        setTooltipContent(null);
        setCurrentStep(0);
        if (completed) {
            setIsTutorialCompleted(true);
            try {
                localStorage.setItem('tutorialCompleted', 'true');
            } catch (error) {
                console.error("Failed to save tutorial completion state", error);
            }
        }
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep(prev => prev + 1);
    }, []);

    const goToStep = useCallback((step: number) => {
        setCurrentStep(step);
    }, []);

    const setSpotlight = useCallback((rect: DOMRect | null, content: TooltipContent | null) => {
        setSpotlightTarget(rect);
        setTooltipContent(content);
    }, []);

    return (
        <TutorialContext.Provider value={{
            isTutorialActive,
            isTutorialCompleted,
            currentStep,
            spotlightTarget,
            tooltipContent,
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
