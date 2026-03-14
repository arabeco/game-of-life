import React from 'react';
import { Asset } from '../types';
import { SvgRadarChart } from './SvgRadarChart';

interface AssetDecagonProps {
  assets: Asset[];
  tempLevels?: Record<string, number>;
  size?: number | string;
  showCentralLevel?: boolean;
}

export const AssetDecagon: React.FC<AssetDecagonProps> = ({
  assets,
  tempLevels,
  size = 280,
  showCentralLevel = true,
}) => {
  const filteredAssets = assets.filter((asset) => asset.id !== 'geral');
  const levels = filteredAssets.map((asset) => (tempLevels ?tempLevels[asset.id] || 1 : asset.level));

  const totalLevel = tempLevels
    ?Object.entries(tempLevels)
        .filter(([id]) => id !== 'geral')
        .reduce((sum, [, level]) => sum + Number(level), 0)
    : filteredAssets.reduce((sum, asset) => sum + asset.level, 0);

  const labels = filteredAssets.map((asset) => {
    const normalized = asset.name.toUpperCase();
    if (normalized === 'TRABALHO/ESTUDOS') return 'TRABALHO';
    if (normalized === 'ESPA?O MENTAL') return 'MENTAL';
    if (normalized === 'ESPIRITUALIDADE') return 'ESPIRIT.';
    return normalized;
  });

  const goldMetallic = '#705E43';
  const goldBright = '#C5A021';

  return (
    <div className="relative flex flex-col items-center justify-center w-full overflow-visible" style={{ height: size }}>
      <SvgRadarChart
        labels={labels}
        maxValue={10}
        levels={5}
        height="100%"
        labelColor="rgba(255,255,255,0.4)"
        labelSize={3.2}
        series={[
          {
            id: 'asset-levels',
            values: levels,
            stroke: goldBright,
            fill: goldBright,
            fillOpacity: 0.4,
            strokeWidth: 1.2,
            showDots: true,
            dotRadius: 2.2,
            dotFill: '#000',
            dotStroke: goldMetallic,
            valueLabel: (value) => String(value),
            valueLabelColor: goldBright,
            valueLabelSize: 3,
            valueLabelWeight: 900,
          },
        ]}
      />

      {showCentralLevel ?(
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[6px] uppercase tracking-[0.5em] text-white/10 font-black mb-[-2px] translate-y-[-14px]">TOTAL</span>
          <span
            className="text-2xl font-black drop-shadow-[0_0_8px_rgba(197,160,33,0.4)]"
            style={{ color: goldBright }}
          >
            {totalLevel}
          </span>
        </div>
      ) : null}
    </div>
  );
};
