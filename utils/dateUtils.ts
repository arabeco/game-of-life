export const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

export const formatDate = (dateStr: string) => {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

type FairnessLike = {
    measurementStatus?: 'scored' | 'low_signal';
    historyConfidence?: 'stable' | 'seeded' | 'fallback';
    honoredLoadUnits?: number;
    planLoadRatio?: number;
    scoreBreakdown?: {
        metaPts?: number;
    };
};

const canUseSGrade = (fairness?: FairnessLike | null) => {
    if (!fairness) return true;
    return fairness.measurementStatus === 'scored'
        && fairness.historyConfidence === 'stable'
        && (fairness.honoredLoadUnits || 0) >= 8
        && (fairness.scoreBreakdown?.metaPts || 0) >= 15
        && (fairness.planLoadRatio || 0) >= 0.55;
};

export const getScoreGrade = (score: number, fairness?: FairnessLike | null) => {
    if (score >= 92 && canUseSGrade(fairness)) return { grade: 'S', color: 'text-cyan-400', phrase: 'Plano honrado em alto patamar. Raro e preciso.' };
    if (score >= 84) return { grade: 'A', color: 'text-green-400', phrase: 'Execucao solida. O ciclo foi honrado.' };
    if (score >= 70) return { grade: 'B', color: 'text-yellow-400', phrase: 'Bom ciclo. Algumas brechas a selar.' };
    if (score >= 55) return { grade: 'C', color: 'text-orange-400', phrase: 'Metade do caminho. O que travou?' };
    if (score >= 40) return { grade: 'D', color: 'text-red-400', phrase: 'Ciclo comprometido. Revise o plano.' };
    return { grade: 'E', color: 'text-red-900', phrase: 'O plano existiu. A execucao, nao.' };
};
