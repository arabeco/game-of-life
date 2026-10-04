import React from 'react';
import { Asset } from '../types';
import {
  LIFE_AREAS,
  MASTERY_AREA_MAX_LEVEL,
  MASTERY_INDEX_BASE,
  MASTERY_RAW_TOTAL_MAX_LEVEL,
  MASTERY_TOTAL_MAX_LEVEL,
  PONTOS_POR_DEGRAU,
  getMasteryIndexFromLevels,
} from '../constants/lifeAreas';
import { SvgRadarChart } from './SvgRadarChart';

interface AssetPentagonProps {
  assets: Asset[];
  tempLevels?: Record<string, number>;
  size?: number | string;
  showCentralLevel?: boolean;
  centralStyle?: 'badge' | 'plain';
  /**
   * Destaca o numero de cada ponta.
   *
   * No perfil o pentagono e um resumo e os numeros sao apoio. Na tela que fecha
   * a avaliacao eles sao o ASSUNTO — a pessoa acabou de escolher os cinco, um a
   * um, e e neles que ela quer se reconhecer.
   */
  destacarPontas?: boolean;
  activeAreaId?: string;
}

export const AssetPentagon: React.FC<AssetPentagonProps> = ({
  assets,
  tempLevels,
  size = 280,
  showCentralLevel = true,
  centralStyle = 'badge',
  destacarPontas = false,
  activeAreaId,
}) => {
  const chartAreas = LIFE_AREAS
    .map((area) => ({ area, asset: assets.find((asset) => asset.id === area.id) }))
    .filter((entry): entry is { area: typeof LIFE_AREAS[number]; asset: Asset } => Boolean(entry.asset));
  const levels = chartAreas.map(({ asset }) => tempLevels?.[asset.id] ?? Math.max(0, asset.level || 0));
  const masteryIndex = getMasteryIndexFromLevels(levels);
  /**
   * A MAESTRIA CRUA, que e a soma das cinco pontas.
   *
   * Ela aparece ESCRITA embaixo do nivel porque o nivel e o dobro dela. Esse
   * dobro ja existiu sozinho e produziu o cabecalho dizendo 72 com a placa do
   * legado dizendo 36 — nao porque a conta estivesse errada, mas porque nada na
   * tela dizia que eram duas grandezas. Com `23/50` logo abaixo do 46, a relacao
   * fica dita em vez de deduzida.
   */
  const maestriaCrua = levels.reduce((soma, nivel) => soma + Math.max(0, nivel), 0);
  const labels = chartAreas.map(({ area }) => area.shortName);

  const goldMetallic = '#8d7951';
  const goldBright = '#d6c38e';
  const goldFill = '#6f5d2f';

  /**
   * O PENTAGONO MOSTRA O DEGRAU: de 1 a 10, como a avaliacao pergunta.
   *
   * Houve uma versao com 0 a 20, para as cinco pontas somarem o numero do meio.
   * A conta fechava, mas "estou no vinte em Saude" e um numero que o modelo nao
   * tem. As pontas somam 50 e o centro diz 100 — sao o nivel de uma area e o
   * indice do conjunto, duas coisas.
   */
  const pontos = levels.map((nivel) => nivel * PONTOS_POR_DEGRAU);

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-visible" style={{ height: size }}>
      <SvgRadarChart
        labels={labels}
        maxValue={MASTERY_AREA_MAX_LEVEL * PONTOS_POR_DEGRAU}
        /* SEM BASE INTERNA: o Indice nao parte mais de 50.
           O anel de dentro desenhava o piso que ninguem conquistava. Agora o
           nivel comeca em 0, entao uma area em zero puxa a ponta ate o centro —
           e esta certo: ali nao ha nada mesmo. A figura mordida passou a ser
           informacao em vez de defeito. */
        baseInterna={MASTERY_INDEX_BASE / MASTERY_TOTAL_MAX_LEVEL}
        levels={3}
        height="100%"
        className="drop-shadow-[0_10px_22px_rgba(0,0,0,.46)]"
        labelColor="rgba(235,229,213,0.58)"
        labelSize={3.35}
        labelOffset={destacarPontas ? 13 : 8}
        series={[{
          id: 'area-levels',
          activeIndex: activeAreaId ? chartAreas.findIndex(({ area }) => area.id === activeAreaId) : undefined,
          values: pontos,
          stroke: goldBright,
          fill: goldFill,
          fillOpacity: 0.28,
          strokeWidth: 1.35,
          showDots: true,
          dotRadius: destacarPontas ? 1.5 : 1.8,
          dotFill: '#11110f',
          dotStroke: goldBright,
          valueLabel: (value) => String(Math.round(value)),
          valueLabelColor: destacarPontas ? '#fff6dd' : '#eee4c8',
          valueLabelSize: destacarPontas ? 4.2 : 2.75,
          valueLabelWeight: 900,
          valueLabelOffset: destacarPontas ? 6 : 0,
        }]}
      />

      {showCentralLevel ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            /* O NUMERO DEIXA DE TAPAR O DESENHO.
               Era um disco de 62px com fundo 88% opaco, plantado exatamente onde
               as cinco linhas do pentagono se encontram — ou seja, escondia a
               parte que da forma a figura. Agora e um anel: menor, quase
               transparente e desfocado, entao o grafico atravessa por baixo e o
               numero continua legivel. */
            className={centralStyle === 'plain' ? 'flex items-center justify-center' : 'flex h-[52px] w-[52px] items-center justify-center rounded-full border bg-[#0b0c0d]/38 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_7px_18px_rgba(0,0,0,.45)] backdrop-blur-[3px]'}
            style={{ borderColor: goldMetallic }}
          >
            {/* Os DOIS numeros, um debaixo do outro: o nivel e o dobro da
                maestria, e dizer isso custa uma linha de 8px. */}
            <span className="flex flex-col items-center leading-none">
              <span className="text-2xl font-black [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]" style={{ color: goldBright }}>
                {masteryIndex}
              </span>
              <span
                className="mt-[3px] text-[8px] font-bold tabular-nums [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]"
                style={{ color: 'rgba(235,229,213,0.62)' }}
              >
                {maestriaCrua}/{MASTERY_RAW_TOTAL_MAX_LEVEL}
              </span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
