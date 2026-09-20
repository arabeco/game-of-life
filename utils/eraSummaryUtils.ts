export type EraNarrativeInput = {
    cycleCount: number;
    avgScore: number;
    dominantArena: string;
    bestStreak: number;
    topActions: { name: string; count: number }[];
    startDate?: string;
    endDate?: string;
};

const getScoreMood = (score: number) => {
    if (score >= 90) return 'uma fase de domínio alto e execução muito consistente';
    if (score >= 75) return 'uma fase de boa cadência e consolidacao real';
    if (score >= 60) return 'uma fase de construção com progresso perceptivel';
    if (score >= 45) return 'uma fase de reorganizacao com oscilação de ritmo';
    return 'uma fase mais crua, marcada por tentativa, ajuste e pouca tracao';
};

const getArenaPhrase = (arena: string) => {
    if (!arena || arena === 'Sem arena dominante' || arena === 'Nenhuma') {
        return 'sem uma arena dominante clara';
    }
    return `com concentracao principal em ${arena}`;
};

const getActionPhrase = (actions: { name: string; count: number }[]) => {
    const topAction = actions[0];
    if (!topAction?.name || topAction.name === 'Nenhuma') {
        return 'sem uma ação dominante registrada';
    }
    return `${topAction.name} como ação-chave da fase`;
};

const getStreakPhrase = (bestStreak: number) => {
    if (bestStreak >= 10) return `com pico de constância em ${bestStreak} dias seguidos`;
    if (bestStreak >= 5) return `com streak máxima de ${bestStreak} dias`;
    if (bestStreak > 0) return `com lampejos de constância chegando a ${bestStreak} dias`;
    return 'ainda sem streak relevante registrada';
};

export const buildEraAiSummary = ({
    cycleCount,
    avgScore,
    dominantArena,
    bestStreak,
    topActions,
}: EraNarrativeInput) => {
    const cyclesLabel = cycleCount === 1 ? '1 ciclo' : `${cycleCount} ciclos`;
    return `${cyclesLabel}, score médio ${avgScore}: ${getScoreMood(avgScore)}, ${getArenaPhrase(dominantArena)}, ${getActionPhrase(topActions)} e ${getStreakPhrase(bestStreak)}.`;
};
