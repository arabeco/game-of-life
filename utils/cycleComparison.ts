import type { Report } from '../types';

/**
 * Comparacao de um ciclo contra os ciclos que o jogador ja fechou.
 *
 * O relatorio descreve um ciclo isolado: numeros sem regua. Esta comparacao
 * existe para responder "isso e bom PARA MIM", que e a pergunta que um numero
 * sozinho nao responde.
 *
 * Custo: nenhum. O app ja carrega ate 100 ciclos com report_data em cada sessao
 * (GameContext), entao aqui e so calculo sobre dado que ja esta na memoria.
 *
 * Mediana, nao media: um unico ciclo desastroso ou heroico nao deve deslocar a
 * referencia do jogador.
 *
 * Nada aqui pontua ou pune. O app fecha ciclo por `fair_v2_1` justamente para
 * nao castigar quem teve um periodo ruim, e a leitura acompanha: `direction`
 * diz para onde foi, e cabe a interface nao transformar isso em cobranca.
 */

export type ComparisonDirection = 'acima' | 'abaixo' | 'estavel';

export interface CycleMetricComparison {
  id: 'execucao' | 'constancia' | 'sequencia' | 'lacunas' | 'pontuacao';
  label: string;
  /** Valor deste ciclo, ja arredondado para exibicao. */
  current: number;
  /** Mediana dos ciclos anteriores. */
  baseline: number;
  /** current - baseline, no mesmo arredondamento. */
  delta: number;
  direction: ComparisonDirection;
  /** Se verdadeiro, numero menor e o resultado melhor (ex.: dias sem entrega). */
  lowerIsBetter: boolean;
  suffix: string;
}

export interface CycleComparison {
  /** Quantos ciclos fechados sustentam a comparacao. */
  sampleSize: number;
  metrics: CycleMetricComparison[];
  /** Uma frase de leitura geral, ou null quando nao ha amostra. */
  headline: string | null;
}

/** Abaixo disso a comparacao mente mais do que informa. */
export const MIN_CYCLES_FOR_COMPARISON = 2;

const median = (values: number[]): number | null => {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** Relatorios antigos nem sempre gravaram executionRatePct; da para reconstruir. */
const executionRate = (report: Report): number | null => {
  const direct = report.metrics?.executionRatePct;
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct;
  const done = Number(report.metrics?.actionsCompleted || 0);
  const planned = Number(report.metrics?.totalPlannedActions || 0);
  return planned > 0 ? (done / planned) * 100 : null;
};

const numeric = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

const READERS: Array<{
  id: CycleMetricComparison['id'];
  label: string;
  suffix: string;
  lowerIsBetter: boolean;
  /** Margem abaixo da qual a diferenca conta como estavel. */
  tolerance: number;
  read: (report: Report) => number | null;
}> = [
  {
    id: 'execucao',
    label: 'Execucao',
    suffix: '%',
    lowerIsBetter: false,
    tolerance: 5,
    read: executionRate,
  },
  {
    id: 'constancia',
    label: 'Dias com entrega',
    suffix: '',
    lowerIsBetter: false,
    tolerance: 1,
    read: (report) => numeric(report.metrics?.consistencyDays),
  },
  {
    id: 'sequencia',
    label: 'Maior sequencia',
    suffix: '',
    lowerIsBetter: false,
    tolerance: 1,
    read: (report) => numeric(report.metrics?.maxStreak),
  },
  {
    id: 'lacunas',
    label: 'Dias sem entrega',
    suffix: '',
    lowerIsBetter: true,
    tolerance: 1,
    read: (report) => numeric(report.metrics?.daysWithoutCompletion),
  },
  {
    id: 'pontuacao',
    label: 'Pontuacao',
    suffix: '',
    lowerIsBetter: false,
    tolerance: 4,
    read: (report) => numeric(report.performanceScore),
  },
];

const buildHeadline = (metrics: CycleMetricComparison[], sampleSize: number): string | null => {
  if (metrics.length === 0) return null;

  const better = metrics.filter((metric) => metric.direction === 'acima' && !metric.lowerIsBetter).length
    + metrics.filter((metric) => metric.direction === 'abaixo' && metric.lowerIsBetter).length;
  const worse = metrics.filter((metric) => metric.direction === 'abaixo' && !metric.lowerIsBetter).length
    + metrics.filter((metric) => metric.direction === 'acima' && metric.lowerIsBetter).length;

  const referencia = `seus ${sampleSize} ciclos anteriores`;

  if (better > worse && worse === 0) {
    return `Este ciclo ficou acima de ${referencia} em tudo que da para medir.`;
  }
  if (better > worse) {
    return `Na maior parte das medidas este ciclo ficou acima de ${referencia}.`;
  }
  if (worse > better && better === 0) {
    return `Este ciclo ficou abaixo de ${referencia}. Vale olhar se a carga planejada mudou antes de concluir qualquer coisa.`;
  }
  if (worse > better) {
    return `Na maior parte das medidas este ciclo ficou abaixo de ${referencia}.`;
  }
  return `Este ciclo ficou no seu padrao: nem acima nem abaixo de ${referencia}.`;
};

export const buildCycleComparison = (
  report: Report,
  history: Report[],
): CycleComparison => {
  // O proprio ciclo nao pode entrar na propria referencia.
  const previous = (history || []).filter((entry) => (
    entry
    && entry.id !== report.id
    && (!report.cycleId || entry.cycleId !== report.cycleId)
  ));

  if (previous.length < MIN_CYCLES_FOR_COMPARISON) {
    return { sampleSize: previous.length, metrics: [], headline: null };
  }

  const metrics: CycleMetricComparison[] = [];

  for (const reader of READERS) {
    const current = reader.read(report);
    if (current === null) continue;

    const baseline = median(
      previous
        .map(reader.read)
        .filter((value): value is number => value !== null),
    );
    if (baseline === null) continue;

    const roundedCurrent = Math.round(current);
    const roundedBaseline = Math.round(baseline);
    const delta = roundedCurrent - roundedBaseline;

    metrics.push({
      id: reader.id,
      label: reader.label,
      current: roundedCurrent,
      baseline: roundedBaseline,
      delta,
      direction: Math.abs(delta) < reader.tolerance
        ? 'estavel'
        : delta > 0 ? 'acima' : 'abaixo',
      lowerIsBetter: reader.lowerIsBetter,
      suffix: reader.suffix,
    });
  }

  return {
    sampleSize: previous.length,
    metrics,
    headline: buildHeadline(metrics, previous.length),
  };
};

/** True quando a diferenca joga a favor do jogador, respeitando lowerIsBetter. */
export const isFavourable = (metric: CycleMetricComparison): boolean => (
  metric.direction === 'estavel'
    ? true
    : metric.lowerIsBetter
      ? metric.direction === 'abaixo'
      : metric.direction === 'acima'
);
