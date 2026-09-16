/**
 * @typedef {Object} CycleGradeEvidence
 * @property {'scored'|'low_signal'} [measurementStatus]
 * @property {'stable'|'seeded'|'fallback'} [historyConfidence]
 * @property {number} [honoredLoadUnits]
 * @property {number} [planLoadRatio]
 * @property {{metaPts?: number}} [scoreBreakdown]
 */

/** @param {CycleGradeEvidence|null|undefined} fairness */
const qualifiesForTopGrade = (fairness) => !!fairness
    && fairness.measurementStatus === 'scored'
    && fairness.historyConfidence === 'stable'
    && (fairness.honoredLoadUnits || 0) >= 8
    && (fairness.scoreBreakdown?.metaPts || 0) >= 15
    && (fairness.planLoadRatio || 0) >= 0.55;

/**
 * One classifier for score calculation and presentation.
 * SS needs a measured perfect cycle; score-only legacy/average callers keep
 * their existing S fallback rather than inferring missing quality evidence.
 * @param {number} score
 * @param {CycleGradeEvidence|null} [fairness]
 */
export const getScoreGrade = (score, fairness) => {
    const eligible = qualifiesForTopGrade(fairness);
    if (score === 100 && eligible) return { grade: 'SS', color: 'text-rose-400', phrase: 'Ciclo perfeito. Excelência em cada compromisso.' };
    if (score >= 92 && (!fairness || eligible)) return { grade: 'S', color: 'text-purple-400', phrase: 'Plano honrado em alto patamar. Raro e preciso.' };
    if (score >= 84) return { grade: 'A', color: 'text-amber-300', phrase: 'Execucao solida. O ciclo foi honrado.' };
    if (score >= 70) return { grade: 'B', color: 'text-yellow-400', phrase: 'Bom ciclo. Algumas brechas a selar.' };
    if (score >= 55) return { grade: 'C', color: 'text-orange-400', phrase: 'Metade do caminho. O que travou?' };
    if (score >= 40) return { grade: 'D', color: 'text-red-400', phrase: 'Ciclo comprometido. Revise o plano.' };
    return { grade: 'E', color: 'text-red-900', phrase: 'O plano existiu. A execucao, não.' };
};

/** Preserve the measured grade carried by the legacy payload in every output.
 * @param {{score: number, grade?: string|null}} cycle
 */
export const getLegacyCycleGrade = (cycle) => {
    const inferred = getScoreGrade(cycle.score);
    const grade = cycle.grade?.trim().toUpperCase();
    const colors = {E:'text-red-900',D:'text-red-400',C:'text-orange-400',B:'text-yellow-400',A:'text-amber-300',S:'text-purple-400',SS:'text-rose-400'};
    return grade && Object.hasOwn(colors, grade) ? {...inferred, grade, color: colors[grade]} : inferred;
};
