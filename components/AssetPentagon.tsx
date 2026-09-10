import React from 'react';
import { Asset } from '../types';
import { LIFE_AREAS, MASTERY_AREA_MAX_LEVEL, PONTOS_POR_DEGRAU, getMasteryIndexFromLevels } from '../constants/lifeAreas';
import { SvgRadarChart } from './SvgRadarChart';

interface AssetPentagonProps {
  assets: Asset[];
  tempLevels?: Record<string, number>;
  size?: number | string;
  showCentralLevel?: boolean;
  /**
   * Destaca o numero de cada ponta.
   *
   * No perfil o pentagono e um resumo e os numeros sao apoio. Na tela que fecha
   * a avaliacao eles sao o ASSUNTO — a pessoa acabou de escolher os cinco, um a
   * um, e e neles que ela quer se reconhecer.
   */
  destacarPontas?: boolean;
}

export const AssetPentagon: React.FC<AssetPentagonProps> = ({
  assets,
  tempLevels,
  size = 280,
  showCentralLevel = true,
  destacarPontas = false,
}) => {
  const chartAreas = LIFE_AREAS
    .map((area) => ({ area, asset: assets.find((asset) => asset.id === area.id) }))
    .filter((entry): entry is { area: typeof LIFE_AREAS[number]; asset: Asset } => Boolean(entry.asset));
  const levels = chartAreas.map(({ asset }) => tempLevels?.[asset.id] ?? Math.max(1, asset.level || 1));
  const masteryIndex = getMasteryIndexFromLevels(levels);
  const labels = chartAreas.map(({ area }) => area.shortName);

  const goldMetallic = '#8d7951';
  const goldBright = '#d6c38e';
  const goldFill = '#6f5d2f';

  /**
   * O PENTAGONO MOSTRA DE 0 A 20, e nao de 1 a 10.
   *
   * A avaliacao continua tendo dez degraus — o que muda e a ESCALA em que o
   * numero aparece. Cada degrau vale dois pontos, entao o topo de uma area e 20
   * e a soma das cinco fecha exatamente nos 100 do numero do meio.
   *
   * A razao nao e estetica: com 1 a 10 no grafico e 0 a 100 no centro, a pessoa
   * precisa fazer a conta para ligar as duas coisas. Com 0 a 20 ela nao precisa
   * — e passa a poder dizer "estou no vinte em Saude", que e uma frase que se
   * fala. "Estou no dez que vale vinte" nao e.
   */
  const pontos = levels.map((nivel) => nivel * PONTOS_POR_DEGRAU);

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-visible" style={{ height: size }}>
      <SvgRadarChart
        labels={labels}
        maxValue={MASTERY_AREA_MAX_LEVEL * PONTOS_POR_DEGRAU}
        levels={3}
        height="100%"
        className="drop-shadow-[0_10px_22px_rgba(0,0,0,.46)]"
        labelColor="rgba(235,229,213,0.58)"
        labelSize={3.35}
        labelOffset={destacarPontas ? 13 : 8}
        series={[{
          id: 'area-levels',
          values: pontos,
          stroke: goldBright,
          fill: goldFill,
          fillOpacity: 0.28,
          strokeWidth: 1.35,
          showDots: true,
          dotRadius: destacarPontas ? 1.5 : 1.8,
          dotFill: '#11110f',
          dotStroke: goldBright,
          valueLabel: (value) => String(value),
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
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full border bg-[#0b0c0d]/38 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_7px_18px_rgba(0,0,0,.45)] backdrop-blur-[3px]"
            style={{ borderColor: goldMetallic }}
          >
            <span className="text-2xl font-black leading-none [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]" style={{ color: goldBright }}>
              {masteryIndex}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
