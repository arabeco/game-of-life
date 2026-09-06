import React from 'react';
import { Asset } from '../types';
import { LIFE_AREAS, MASTERY_AREA_MAX_LEVEL, getMasteryIndexFromLevels } from '../constants/lifeAreas';
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
  const masteryIndex = getMasteryIndexFromLevels(levels);
  const labels = chartAreas.map(({ area }) => area.shortName);

  const goldMetallic = '#8d7951';
  const goldBright = '#d6c38e';
  const goldFill = '#6f5d2f';

  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-visible" style={{ height: size }}>
      <SvgRadarChart
        labels={labels}
        maxValue={MASTERY_AREA_MAX_LEVEL}
        levels={3}
        height="100%"
        className="drop-shadow-[0_10px_22px_rgba(0,0,0,.46)]"
        labelColor="rgba(235,229,213,0.58)"
        labelSize={3.35}
        series={[{
          id: 'area-levels',
          values: levels,
          stroke: goldBright,
          fill: goldFill,
          fillOpacity: 0.28,
          strokeWidth: 1.35,
          showDots: true,
          dotRadius: 1.8,
          dotFill: '#11110f',
          dotStroke: goldBright,
          valueLabel: (value) => String(value),
          valueLabelColor: '#eee4c8',
          valueLabelSize: 2.75,
          valueLabelWeight: 900,
        }]}
      />

      {showCentralLevel ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex h-[62px] w-[62px] items-center justify-center rounded-full border bg-[#0b0c0d]/88 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_7px_18px_rgba(0,0,0,.55)]"
            style={{ borderColor: goldMetallic }}
          >
            <span className="text-2xl font-black leading-none" style={{ color: goldBright }}>
              {masteryIndex}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
