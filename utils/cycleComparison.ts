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
    label: 'Execução',
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
    label: 'Maior sequência',
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
    label: 'Pontuação',
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
  return `Este ciclo ficou no seu padrão: nem acima nem abaixo de ${referencia}.`;
};

/**
 * O fecho da comparacao, no lugar do resumo seco.
 *
 * A headline diz PARA ONDE foi; esta diz o que fazer com isso. Sao coisas
 * diferentes: "ficou acima em tudo" e leitura, "não precisa provar de novo
 * amanha" e a frase que sobra na cabeca depois de fechar a tela.
 *
 * Nenhuma cobra. O ciclo ja fechou — nao ha o que corrigir nele, so o que levar
 * para o proximo.
 */
export const buildComparisonClosingLine = (comparison: CycleComparison): string | null => {
  if (comparison.metrics.length === 0) return null;

  const favoraveis = comparison.metrics.filter(isFavourable).length;
  const total = comparison.metrics.length;

  if (favoraveis === total) {
    return 'Você não competiu com ninguém aqui. Superou a sua própria média, e isso conta diferente.';
  }
  if (favoraveis === 0) {
    return 'Um ciclo abaixo do seu normal continua sendo um ciclo. O que ele mostra vale para o próximo.';
  }
  if (favoraveis >= total / 2) {
    return 'Nem tudo subiu, e não precisava. O que segurou o ciclo esta acima do seu padrão.';
  }
  return 'A maior parte cedeu, mas não tudo. O que resistiu e por onde começar da próxima vez.';
};

/* ==========================================================================
 * A NARRACAO DO CICLO.
 *
 * As duas frases acima CONTAM quantas medidas subiram e quantas desceram, e
 * nenhuma delas NOMEIA nada: "na maior parte das medidas este ciclo ficou acima
 * de seus 3 ciclos anteriores" serve para qualquer ciclo de qualquer pessoa em
 * qualquer mes. A pessoa le uma vez e nao leva nada.
 *
 * Esta pega os dois extremos — o que mais subiu a favor e o que mais cedeu — e
 * diz os numeros deles. "A maior sequencia subiu de 4 para 9 dias. A execucao
 * cedeu de 88% para 76%." Duas frases curtas com nome e numero valem mais que
 * um paragrafo de leitura geral, e so podem ter sido escritas sobre ESTE ciclo.
 *
 * O fecho e uma leitura, e nao uma cobranca: o ciclo ja acabou, nao ha o que
 * corrigir nele.
 * ========================================================================== */

const SUJEITOS: Record<CycleMetricComparison['id'], { nome: string; unidade: string }> = {
  execucao: { nome: 'A execução', unidade: '' },
  constancia: { nome: 'Os dias com entrega', unidade: '' },
  sequencia: { nome: 'A maior sequência', unidade: ' dias' },
  lacunas: { nome: 'Os dias sem entrega', unidade: '' },
  pontuacao: { nome: 'A pontuação', unidade: '' },
};

const frasear = (metrica: CycleMetricComparison): string => {
  const { nome, unidade } = SUJEITOS[metrica.id];
  // O verbo segue a DIRECAO do numero, e nao se aquilo foi bom: "os dias sem
  // entrega cederam" seria elogio dito como perda. Numero que desce, desce.
  const verbo = metrica.delta > 0
    ? (isFavourable(metrica) ? 'subiu' : 'cresceu')
    : (isFavourable(metrica) ? 'caiu' : 'cedeu');
  const plural = nome.startsWith('Os');
  const conjugado = plural
    ? { subiu: 'subiram', cresceu: 'cresceram', caiu: 'caíram', cedeu: 'cederam' }[verbo]
    : verbo;
  return `${nome} ${conjugado} de ${metrica.baseline}${metrica.suffix} para ${metrica.current}${metrica.suffix}${unidade}.`;
};

export const buildComparisonNarration = (comparison: CycleComparison): string | null => {
  if (comparison.metrics.length === 0) return null;

  const moveram = comparison.metrics.filter((metrica) => metrica.direction !== 'estavel');
  if (moveram.length === 0) {
    return `Nada se moveu além do ruído. Este ciclo repetiu, medida por medida, o que você já vinha fazendo nos ${comparison.sampleSize} anteriores.`;
  }

  /*
   * A FORCA E RELATIVA, E NAO O DELTA CRU.
   *
   * As medidas nao estao na mesma unidade: pontuacao anda de 0 a 100, sequencia
   * anda de 0 a 28. Ordenando pelo delta cru, a pontuacao ganhava quase sempre —
   * "+14 pontos" enterrava uma sequencia que dobrou de 4 para 9 dias, que e a
   * coisa notavel do ciclo. Proporcao ao proprio normal poe as cinco na mesma
   * regua: 4 para 9 e +125%, 74 para 88 e +19%.
   */
  const forca = (metrica: CycleMetricComparison) => (
    Math.abs(metrica.delta) / Math.max(1, Math.abs(metrica.baseline))
  );
  const aFavor = moveram.filter(isFavourable).sort((esq, dir) => forca(dir) - forca(esq));
  const contra = moveram.filter((metrica) => !isFavourable(metrica)).sort((esq, dir) => forca(dir) - forca(esq));

  const partes: string[] = [];
  if (aFavor[0]) partes.push(frasear(aFavor[0]));
  if (contra[0]) partes.push(frasear(contra[0]));

  if (contra.length === 0) {
    partes.push('Nada cedeu no caminho.');
  } else if (aFavor.length === 0) {
    partes.push('Vale olhar se a carga planejada mudou antes de concluir qualquer coisa.');
  } else if (aFavor.length > contra.length) {
    partes.push('No saldo, o ciclo andou para a frente.');
  } else if (contra.length > aFavor.length) {
    partes.push('No saldo, ele pediu mais do que rendeu.');
  } else {
    partes.push('Um ciclo de troca: o que subiu custou o que desceu.');
  }

  return partes.join(' ');
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
