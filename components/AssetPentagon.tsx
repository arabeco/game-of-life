import React from 'react';
import { Asset } from '../types';
import { LIFE_AREAS, MASTERY_AREA_MAX_LEVEL, MASTERY_TOTAL_MAX_LEVEL, toMasteryIndex } from '../constants/lifeAreas';
import { SvgRadarChart } from './SvgRadarChart';

interface AssetPentagonProps {
  assets: Asset[];
  tempLevels?: Record<string, number>;
  size?: number | string;
  showCentralLevel?: boolean;
}

export const AssetPentagon: React.FC<AssetPentagonProps> = ({
  assets,
  tempLevels,
  size = 280,
  showCentralLevel = true,
}) => {
  const chartAreas = LIFE_AREAS
    .map((area) => ({ area, asset: assets.find((asset) => asset.id === area.id) }))
    .filter((entry): entry is { area: typeof LIFE_AREAS[number]; asset: Asset } => Boolean(entry.asset));
  const levels = chartAreas.map(({ asset }) => tempLevels?.[asset.id] ?? Math.max(1, asset.level || 1));
  const masteryIndex = toMasteryIndex(levels.reduce((sum, level) => sum + Number(level || 0), 0));
  const labels = chartAreas.map(({ area }) => area.shortName);

  const goldMetallic = '#705E43';
  const goldBright = '#C5A021';

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-visible" style={{ height: size }}>
      <SvgRadarChart
        labels={labels}
        maxValue={MASTERY_AREA_MAX_LEVEL}
        levels={5}
        height="100%"
        labelColor="rgba(255,255,255,0.48)"
        labelSize={3.2}
        series={[{
          id: 'area-levels',
          values: levels,
          stroke: goldBright,
          fill: goldBright,
          fillOpacity: 0.38,
          strokeWidth: 1.2,
          showDots: true,
          dotRadius: 2.2,
          dotFill: '#000',
          dotStroke: goldMetallic,
          valueLabel: (value) => String(value),
          valueLabelColor: goldBright,
          valueLabelSize: 3,
          valueLabelWeight: 900,
        }]}
      />

      {showCentralLevel ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="mb-[-2px] translate-y-[-14px] text-[6px] font-black uppercase tracking-[0.34em] text-white/28">INDICE</span>
          <span className="text-2xl font-black drop-shadow-[0_0_8px_rgba(197,160,33,0.4)]" style={{ color: goldBright }}>
            {masteryIndex}<span className="ml-0.5 text-[9px] text-white/36">/{MASTERY_TOTAL_MAX_LEVEL}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
};
