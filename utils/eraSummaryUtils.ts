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
    if (score >= 90) return 'uma fase de dominio alto e execucao muito consistente';
    if (score >= 75) return 'uma fase de boa cadencia e consolidacao real';
    if (score >= 60) return 'uma fase de construcao com progresso perceptivel';
    if (score >= 45) return 'uma fase de reorganizacao com oscilacao de ritmo';
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
        return 'sem uma acao dominante registrada';
    }
    return `${topAction.name} como assinatura pratica da fase`;
};

const getStreakPhrase = (bestStreak: number) => {
    if (bestStreak >= 10) return `com pico de constancia em ${bestStreak} dias seguidos`;
    if (bestStreak >= 5) return `com streak maxima de ${bestStreak} dias`;
    if (bestStreak > 0) return `com lampejos de constancia chegando a ${bestStreak} dias`;
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
    return `${cyclesLabel}, score medio ${avgScore}: ${getScoreMood(avgScore)}, ${getArenaPhrase(dominantArena)}, ${getActionPhrase(topActions)} e ${getStreakPhrase(bestStreak)}.`;
};
