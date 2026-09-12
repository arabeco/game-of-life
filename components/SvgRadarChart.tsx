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
  /**
   * Empurra a pastilha do numero para FORA do vertice, ao longo do eixo.
   *
   * Com o numero em cima do vertice, duas coisas quebram: a linha do poligono
   * atravessa o texto, e um valor baixo (que fica perto do centro) cai em cima
   * do anel do indice. Deslocando, o numero nunca briga com nenhum dos dois,
   * qualquer que seja o valor — e o ponto exato continua marcado pelo disco.
   */
  valueLabelOffset?: number;
  activeIndex?: number;
}

interface SvgRadarChartProps {
  labels: string[];
  series: RadarSeries[];
  maxValue: number;
  /**
   * A fracao do raio que a figura JA OCUPA com valor zero, de 0 a 1.
   *
   * Existe para graficos cuja escala nao comeca no zero. No pentagono da
   * maestria o Indice parte de 50, e desenhar o degrau 0 encostando no centro
   * dizia que ali nao ha nada — quando ha a base que todo mundo tem. Com a base
   * declarada, o miolo e o piso e os valores preenchem o que sobra.
   */
  baseInterna?: number;
  levels?: number;
  className?: string;
  height?: number | string;
  labelColor?: string;
  labelSize?: number;
  showLegend?: boolean;
  legendAccentColor?: string;
  /** Distancia do nome da area ate a borda. Sobe quando os numeros saem para fora. */
  labelOffset?: number;
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

/** O raio de um valor, ja contando a base que a escala nao comeca do zero. */
const magnitudeDe = (value: number, maxValue: number, base: number) => {
  const normalized = Math.max(0, Math.min(value / maxValue, 1));
  return RADIUS * (base + (1 - base) * normalized);
};

const buildPolygon = (values: number[], total: number, maxValue: number, base: number) =>
  values
    .map((value, index) => {
      const point = getPoint(index, total, magnitudeDe(value, maxValue, base));
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
  baseInterna = 0,
  levels = 5,
  className,
  height = '100%',
  labelColor = 'rgba(255,255,255,0.55)',
  labelSize = 4,
  showLegend = false,
  legendAccentColor = 'rgba(255,255,255,0.7)',
  labelOffset = 8,
}) => {
  const total = labels.length;
  // Os aneis dividem o que RESTA acima da base: abaixo dela nao ha degrau
  // nenhum para marcar, e um anel ali sugeriria uma divisao que nao existe.
  const gridLevels = Array.from(
    { length: levels },
    (_, index) => baseInterna + (1 - baseInterna) * ((index + 1) / levels),
  );

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
              points={buildPolygon(item.values, total, maxValue, baseInterna)}
              fill={item.fill || item.stroke}
              fillOpacity={item.fillOpacity ?? 0.18}
              stroke={item.stroke}
              strokeWidth={item.strokeWidth ?? 1}
              strokeDasharray={item.dashed ? '2 2' : undefined}
              strokeLinejoin="round"
            />
            {item.showDots &&
              item.values.map((value, index) => {
                const magnitude = magnitudeDe(value, maxValue, baseInterna);
                const point = getPoint(index, total, magnitude);
                const label = item.valueLabel?.(value, index) ?? null;
                return (
                  <g key={`${item.id}-dot-${index}`}>
                    {item.activeIndex === index && (
                      <circle cx={point.x} cy={point.y} r={4} fill={item.stroke} fillOpacity={0.2} stroke={item.stroke} strokeWidth={0.65} />
                    )}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={item.dotRadius ?? 2.2}
                      fill={item.dotFill || '#000'}
                      stroke={item.dotStroke || item.stroke}
                      strokeWidth="0.55"
                    />
                    {label ? (() => {
                      const recuo = item.valueLabelOffset ?? 0;
                      const alvo = recuo > 0
                        ? getPoint(index, total, magnitude + recuo)
                        : point;
                      const corpo = item.valueLabelSize ?? 3;
                      return (
                        <>
                          {/* O disco da pastilha acompanha quantos digitos o
                              numero tem: um raio fixo corta o "16" e sobra no
                              "2". So existe quando o numero sai do vertice. */}
                          {recuo > 0 ? (
                            <circle
                              cx={alvo.x}
                              cy={alvo.y}
                              r={corpo * (0.62 + 0.2 * label.length)}
                              fill={item.dotFill || '#000'}
                              fillOpacity={0.92}
                              stroke={item.dotStroke || item.stroke}
                              strokeWidth="0.5"
                            />
                          ) : null}
                          <text
                            x={alvo.x}
                            y={alvo.y + corpo * 0.35}
                            textAnchor="middle"
                            fill={item.activeIndex === index ? '#ffffff' : item.valueLabelColor || item.stroke}
                            fontSize={corpo}
                            fontWeight={item.valueLabelWeight ?? 800}
                          >
                            {label}
                          </text>
                        </>
                      );
                    })() : null}
                  </g>
                );
              })}
          </g>
        ))}

        {labels.map((label, index) => {
          const point = getPoint(index, total, RADIUS + labelOffset);
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
