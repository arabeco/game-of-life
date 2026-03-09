import React from 'react';

interface RadarSeries {
  id: string;
  label?: string;
  values: number[];
  stroke: string;
  fill?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  dashed?: boolean;
  showDots?: boolean;
  dotRadius?: number;
  dotFill?: string;
  dotStroke?: string;
  valueLabel?: (value: number, index: number) => string | null;
  valueLabelColor?: string;
  valueLabelSize?: number;
  valueLabelWeight?: number | string;
}

interface SvgRadarChartProps {
  labels: string[];
  series: RadarSeries[];
  maxValue: number;
  levels?: number;
  className?: string;
  height?: number | string;
  labelColor?: string;
  labelSize?: number;
  showLegend?: boolean;
  legendAccentColor?: string;
}

const CHART_SIZE = 100;
const CENTER = 50;
const RADIUS = 34;

const getPoint = (index: number, total: number, magnitude: number) => {
  const angle = ((Math.PI * 2) / total) * index - Math.PI / 2;
  return {
    x: CENTER + Math.cos(angle) * magnitude,
    y: CENTER + Math.sin(angle) * magnitude,
    angle,
  };
};

const buildPolygon = (values: number[], total: number, maxValue: number) =>
  values
    .map((value, index) => {
      const normalized = Math.max(0, Math.min(value / maxValue, 1));
      const point = getPoint(index, total, RADIUS * normalized);
      return `${point.x},${point.y}`;
    })
    .join(' ');

const getAnchor = (angle: number) => {
  const cos = Math.cos(angle);
  if (cos > 0.22) return 'start';
  if (cos < -0.22) return 'end';
  return 'middle';
};

const getLabelDy = (angle: number) => {
  const sin = Math.sin(angle);
  if (sin > 0.4) return 6;
  if (sin < -0.4) return -4;
  return 3;
};

export const SvgRadarChart: React.FC<SvgRadarChartProps> = ({
  labels,
  series,
  maxValue,
  levels = 5,
  className,
  height = '100%',
  labelColor = 'rgba(255,255,255,0.55)',
  labelSize = 4,
  showLegend = false,
  legendAccentColor = 'rgba(255,255,255,0.7)',
}) => {
  const total = labels.length;
  const gridLevels = Array.from({ length: levels }, (_, index) => (index + 1) / levels);

  return (
    <div className={className} style={{ height }}>
      <svg viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`} className="w-full h-full overflow-visible">
        {gridLevels.map((level) => {
          const points = labels
            .map((_, index) => {
              const point = getPoint(index, total, RADIUS * level);
              return `${point.x},${point.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.35"
            />
          );
        })}

        {labels.map((_, index) => {
          const point = getPoint(index, total, RADIUS);
          return (
            <line
              key={`axis-${index}`}
              x1={CENTER}
              y1={CENTER}
              x2={point.x}
              y2={point.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.35"
            />
          );
        })}

        {series.map((item) => (
          <g key={item.id}>
            <polygon
              points={buildPolygon(item.values, total, maxValue)}
              fill={item.fill || item.stroke}
              fillOpacity={item.fillOpacity ?? 0.18}
              stroke={item.stroke}
              strokeWidth={item.strokeWidth ?? 1}
              strokeDasharray={item.dashed ? '2 2' : undefined}
              strokeLinejoin="round"
            />
            {item.showDots &&
              item.values.map((value, index) => {
                const normalized = Math.max(0, Math.min(value / maxValue, 1));
                const point = getPoint(index, total, RADIUS * normalized);
                const label = item.valueLabel?.(value, index) ?? null;
                return (
                  <g key={`${item.id}-dot-${index}`}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={item.dotRadius ?? 2.2}
                      fill={item.dotFill || '#000'}
                      stroke={item.dotStroke || item.stroke}
                      strokeWidth="0.55"
                    />
                    {label ? (
                      <text
                        x={point.x}
                        y={point.y + 1.1}
                        textAnchor="middle"
                        fill={item.valueLabelColor || item.stroke}
                        fontSize={item.valueLabelSize ?? 3}
                        fontWeight={item.valueLabelWeight ?? 800}
                      >
                        {label}
                      </text>
                    ) : null}
                  </g>
                );
              })}
          </g>
        ))}

        {labels.map((label, index) => {
          const point = getPoint(index, total, RADIUS + 8);
          return (
            <text
              key={`label-${label}-${index}`}
              x={point.x}
              y={point.y}
              dy={getLabelDy(point.angle)}
              textAnchor={getAnchor(point.angle)}
              fill={labelColor}
              fontSize={labelSize}
              fontWeight={800}
              letterSpacing="0.08em"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {showLegend ? (
        <div className="mt-3 flex items-center justify-center gap-4">
          {series
            .filter((item) => item.label)
            .map((item) => (
              <div
                key={`legend-${item.id}`}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: legendAccentColor }}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.stroke, opacity: item.fillOpacity ?? 1 }}
                />
                <span>{item.label}</span>
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
};
