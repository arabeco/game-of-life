import React from 'react';
import { SvgRadarChart } from './SvgRadarChart';

interface ReportRadarChartProps {
  data: Array<{
    subject: string;
    A: number;
    fullMark: number;
  }>;
  /** Quando o quadro tem espaco, o pentagono cresce com ele. */
  height?: number;
}

/**
 * O PENTAGONO DAS AREAS, E POR QUE ELE SAIA MINUSCULO.
 *
 * O `value` de cada area nao e nota nem nivel: e a FATIA dela no ciclo —
 * `completadasDaArea / completadasDoCiclo * 100`. As cinco somam 100.
 *
 * E ele era desenhado contra `maxValue={100}`. Entao quem espalhou o esforco
 * pelas cinco areas tirava 20 em cada uma e desenhava um pentagono com um quinto
 * do tamanho do quadro: o ciclo MAIS EQUILIBRADO produzia a figura MENOR. A
 * unica forma de encher o desenho era jogar tudo numa area so.
 *
 * Quem fez muita coisa e bem distribuida via uma bolinha no meio do nada, e o
 * grafico dizia o contrario do que tinha acontecido.
 *
 * A escala agora e a MAIOR FATIA. A figura sempre ocupa o quadro, e o que ela
 * mostra e o que este slide quer dizer: para onde o ciclo pendeu. E o anel
 * tracejado marca a divisao igual — com ele, um pentagono regular grande se le
 * como "espalhei por igual" em vez de "nao fiz nada".
 */
export const ReportRadarChart: React.FC<ReportRadarChartProps> = ({ data, height = 276 }) => {
  const fatias = data.map((item) => Math.max(0, item.A));
  const maiorFatia = Math.max(...fatias, 1);
  // Um respiro no topo para o vertice mais alto nao encostar no anel externo.
  const escala = Math.max(1, Math.ceil(maiorFatia * 1.12));
  const divisaoIgual = fatias.length > 0 ? 100 / fatias.length : 0;

  return (
    <SvgRadarChart
      labels={data.map((item) => item.subject)}
      maxValue={escala}
      levels={3}
      height={height}
      labelColor="#8a8378"
      labelSize={3.1}
      series={[
        // A REFERENCIA VEM PRIMEIRO, para ficar por baixo do poligono cheio.
        {
          id: 'divisao-igual',
          values: fatias.map(() => Math.min(divisaoIgual, escala)),
          stroke: 'rgba(255,255,255,0.22)',
          strokeWidth: 0.7,
          dashed: true,
          fillOpacity: 0,
        },
        {
          id: 'report-radar',
          values: fatias,
          stroke: 'var(--skin-accent-color)',
          fill: 'var(--skin-accent-color)',
          fillOpacity: 0.4,
          strokeWidth: 1.4,
        },
      ]}
    />
  );
};
