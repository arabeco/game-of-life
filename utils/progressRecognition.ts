export type RecognitionKind = 'day' | 'cycle' | 'mastery' | 'clan';
export interface ProgressRecognition {
    kind: RecognitionKind;
    subjectId: string;
    current: number;
    cohortSize?: number;
    topPercent?: number | null;
    baseline?: number | null;
    baselineDays?: number;
    baselineStart?: string;
    baselineEnd?: string;
    days?: number;
}

/** Empates já chegam na posição final do grupo; não arredondar para promover. */
export function officialTop(value: ProgressRecognition | null): 'Top 1%' | 'Top 5%' | 'Top 10%' | null {
    const pct = value?.topPercent;
    if (!value || !Number.isFinite(value.cohortSize) || (value.cohortSize || 0) < 100
        || typeof pct !== 'number' || !Number.isFinite(pct) || pct <= 0 || value.current <= 0) return null;
    return pct <= 1 ? 'Top 1%' : pct <= 5 ? 'Top 5%' : pct <= 10 ? 'Top 10%' : null;
}

export function expAverageLabel(current: number, baseline: number | null | undefined, days: number = 0): string | null {
    if (!Number.isFinite(current) || current < 0 || typeof baseline !== 'number'
        || !Number.isFinite(baseline) || baseline <= 0 || days < 7) return null;
    const delta = (current / baseline - 1) * 100;
    if (Math.abs(delta) < 0.5) return 'Na sua média de EXP';
    const percentage = Math.round(Math.abs(delta)).toLocaleString('pt-BR');
    return `${delta > 0 ? '↑' : '↓'} ${percentage}% ${delta > 0 ? 'acima' : 'abaixo'} da sua média de EXP`;
}
