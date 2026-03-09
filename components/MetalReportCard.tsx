import React, { useId } from 'react';
import './metal-report-card.css';

export type MetalReportRank = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'SS';

interface MetalMetric {
  label: string;
  value: string;
}

interface MetalBadge {
  label: string;
  value?: string;
}

export interface MetalRankPalette {
  rank: MetalReportRank;
  label: string;
  base: string;
  baseDeep: string;
  highlight: string;
  edge: string;
  glow: string;
  text: string;
}

interface MetalReportCardProps {
  rank: string;
  score?: number;
  title: string;
  subtitle?: string;
  dateRange?: string;
  summary?: string;
  metrics?: MetalMetric[];
  badges?: MetalBadge[];
  compact?: boolean;
  captureId?: string;
  entryFlash?: boolean;
  className?: string;
}

const METAL_RANKS: Record<MetalReportRank, MetalRankPalette> = {
  SS: {
    rank: 'SS',
    label: 'Eter Epico',
    base: '#5a2d8a',
    baseDeep: '#221230',
    highlight: '#b47dff',
    edge: '#f1dcff',
    glow: 'rgba(167, 103, 255, 0.38)',
    text: '#f6ebff',
  },
  S: {
    rank: 'S',
    label: 'Eter Epico',
    base: '#4f2a7d',
    baseDeep: '#1d1328',
    highlight: '#a970ff',
    edge: '#ead8ff',
    glow: 'rgba(149, 94, 255, 0.34)',
    text: '#f5e9ff',
  },
  A: {
    rank: 'A',
    label: 'Ouro Selado',
    base: '#8c6a1f',
    baseDeep: '#2d2211',
    highlight: '#ffd976',
    edge: '#fff0c7',
    glow: 'rgba(255, 204, 92, 0.34)',
    text: '#fff6db',
  },
  B: {
    rank: 'B',
    label: 'Prata Fria',
    base: '#7b838f',
    baseDeep: '#232830',
    highlight: '#ebf2fb',
    edge: '#f8fbff',
    glow: 'rgba(203, 213, 225, 0.28)',
    text: '#f2f6fb',
  },
  C: {
    rank: 'C',
    label: 'Bronze Vivo',
    base: '#8f5f36',
    baseDeep: '#2f1d12',
    highlight: '#e7a96b',
    edge: '#f2d1b0',
    glow: 'rgba(205, 127, 50, 0.26)',
    text: '#f7e3d1',
  },
  D: {
    rank: 'D',
    label: 'Ferro Gasto',
    base: '#525862',
    baseDeep: '#181c21',
    highlight: '#a1a8b1',
    edge: '#d0d4d8',
    glow: 'rgba(148, 163, 184, 0.2)',
    text: '#e6eaee',
  },
  E: {
    rank: 'E',
    label: 'Ferro Gasto',
    base: '#44474d',
    baseDeep: '#15171a',
    highlight: '#8e949d',
    edge: '#c2c8cf',
    glow: 'rgba(113, 113, 122, 0.18)',
    text: '#e2e5e9',
  },
};

export const getMetalRankPalette = (rank: string): MetalRankPalette => {
  const normalized = (rank || 'D').toUpperCase() as MetalReportRank;
  return METAL_RANKS[normalized] || METAL_RANKS.D;
};

export const MetalReportCard: React.FC<MetalReportCardProps> = ({
  rank,
  score,
  title,
  subtitle,
  dateRange,
  summary,
  metrics = [],
  badges = [],
  compact = false,
  captureId,
  entryFlash = false,
  className = '',
}) => {
  const palette = getMetalRankPalette(rank);
  const uid = useId().replace(/:/g, '');
  const gradientId = `metal-gradient-${uid}`;
  const linesId = `metal-lines-${uid}`;
  const noiseId = `metal-noise-${uid}`;
  const frameId = `metal-frame-${uid}`;

  return (
    <div
      id={captureId}
      className={`metal-report-card ${compact ? 'metal-report-card--compact' : ''} ${entryFlash ? 'metal-report-card--entry-flash' : ''} ${className}`.trim()}
      style={{
        ['--metal-base' as string]: palette.base,
        ['--metal-base-deep' as string]: palette.baseDeep,
        ['--metal-highlight' as string]: palette.highlight,
        ['--metal-edge' as string]: palette.edge,
        ['--metal-glow' as string]: palette.glow,
        ['--metal-text' as string]: palette.text,
      }}
    >
      <svg className="metal-report-card__svg" viewBox="0 0 860 480" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.highlight} stopOpacity="0.82" />
            <stop offset="18%" stopColor={palette.base} stopOpacity="0.96" />
            <stop offset="52%" stopColor={palette.baseDeep} stopOpacity="1" />
            <stop offset="82%" stopColor={palette.base} stopOpacity="0.98" />
            <stop offset="100%" stopColor={palette.highlight} stopOpacity="0.86" />
          </linearGradient>
          <linearGradient id={frameId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={palette.edge} stopOpacity="0.18" />
            <stop offset="50%" stopColor={palette.edge} stopOpacity="0.95" />
            <stop offset="100%" stopColor={palette.edge} stopOpacity="0.12" />
          </linearGradient>
          <pattern id={linesId} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="18" height="18" fill="transparent" />
            <rect x="0" y="0" width="18" height="2" fill="rgba(255,255,255,0.05)" />
          </pattern>
          <filter id={noiseId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="8" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
            <feComponentTransfer in="mono" result="grain">
              <feFuncA type="table" tableValues="0 0.04" />
            </feComponentTransfer>
            <feSpecularLighting in="mono" surfaceScale="2.5" specularConstant="0.55" specularExponent="18" lightingColor="#ffffff" result="specular">
              <feDistantLight azimuth="225" elevation="42" />
            </feSpecularLighting>
            <feBlend in="SourceGraphic" in2="grain" mode="overlay" result="metal" />
            <feBlend in="metal" in2="specular" mode="screen" />
          </filter>
        </defs>

        <rect x="12" y="12" width="836" height="456" rx="34" fill={`url(#${gradientId})`} filter={`url(#${noiseId})`} />
        <rect x="18" y="18" width="824" height="444" rx="30" fill={`url(#${linesId})`} opacity="0.32" />
        <rect x="18" y="18" width="824" height="444" rx="30" fill="none" stroke={`url(#${frameId})`} strokeWidth="2.5" />
        <path d="M42 88 H818" stroke={palette.edge} strokeOpacity="0.18" strokeWidth="1.5" />
        <path d="M42 356 H818" stroke={palette.edge} strokeOpacity="0.15" strokeWidth="1.5" />
        <path d="M665 54 H800" stroke={palette.edge} strokeOpacity="0.28" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <div className="metal-report-card__sheen" aria-hidden="true" />

      <div className="metal-report-card__content">
        <div className="metal-report-card__header">
          <div className="metal-report-card__title-block">
            <p className="metal-report-card__kicker">Resumo selado</p>
            <h3 className="metal-report-card__title engraved-text">{title}</h3>
            {(subtitle || dateRange) && (
              <p className="metal-report-card__subtitle engraved-text-soft">
                {subtitle || ''}
                {subtitle && dateRange ? ' • ' : ''}
                {dateRange || ''}
              </p>
            )}
          </div>

          <div className="metal-report-card__rank-block">
            <div className="metal-report-card__rank engraved-text">{palette.rank}</div>
            {typeof score === 'number' && <div className="metal-report-card__score engraved-text-soft">{score}</div>}
            <div className="metal-report-card__rank-label">{palette.label}</div>
          </div>
        </div>

        {summary && <p className="metal-report-card__summary engraved-text-soft">{summary}</p>}

        {metrics.length > 0 && (
          <div className="metal-report-card__metrics">
            {metrics.slice(0, compact ? 2 : 4).map((metric) => (
              <div key={`${metric.label}-${metric.value}`} className="metal-report-card__metric engraved-panel">
                <span className="metal-report-card__metric-label">{metric.label}</span>
                <span className="metal-report-card__metric-value engraved-text">{metric.value}</span>
              </div>
            ))}
          </div>
        )}

        {badges.length > 0 && (
          <div className="metal-report-card__badges">
            {badges.slice(0, compact ? 3 : 5).map((badge) => (
              <span key={`${badge.label}-${badge.value || ''}`} className="metal-report-card__badge engraved-panel">
                <span className="metal-report-card__badge-label">{badge.label}</span>
                {badge.value ? <span className="metal-report-card__badge-value engraved-text-soft">{badge.value}</span> : null}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
