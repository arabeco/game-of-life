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

interface MetalDualProgress {
  progress: number;
  time: number;
  progressLabel?: string;
  progressValue?: string;
  timeLabel?: string;
  timeValue?: string;
}

export interface MetalRankPalette {
  rank: MetalReportRank;
  label: string;
  base: string;
  baseDeep: string;
  highlight: string;
  edge: string;
  trim: string;
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
  dualProgress?: MetalDualProgress;
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
    label: 'Regalia prisma',
    base: '#6432a3',
    baseDeep: '#12051f',
    highlight: '#cf9dff',
    edge: '#ffd86b',
    trim: '#fff5d0',
    glow: 'rgba(207, 157, 255, 0.42)',
    text: '#fbf2ff',
  },
  S: {
    rank: 'S',
    label: 'Violeta imperial',
    base: '#5c2d8f',
    baseDeep: '#100617',
    highlight: '#b785ff',
    edge: '#f1c45b',
    trim: '#fff0c2',
    glow: 'rgba(183, 133, 255, 0.36)',
    text: '#faf0ff',
  },
  A: {
    rank: 'A',
    label: 'Ouro selado',
    base: '#926f1e',
    baseDeep: '#1a1204',
    highlight: '#f1cb68',
    edge: '#ffe29a',
    trim: '#fff5d2',
    glow: 'rgba(241, 203, 104, 0.34)',
    text: '#fff7de',
  },
  B: {
    rank: 'B',
    label: 'Prata fria',
    base: '#6d7f97',
    baseDeep: '#0d131b',
    highlight: '#dce6f5',
    edge: '#f7fbff',
    trim: '#ffffff',
    glow: 'rgba(220, 230, 245, 0.28)',
    text: '#f3f8ff',
  },
  C: {
    rank: 'C',
    label: 'Bronze EDC',
    base: '#8e4b24',
    baseDeep: '#1a0d06',
    highlight: '#e0a05f',
    edge: '#f5c18e',
    trim: '#fbe0c2',
    glow: 'rgba(224, 160, 95, 0.28)',
    text: '#fde8d7',
  },
  D: {
    rank: 'D',
    label: 'Aco azulado',
    base: '#3d5265',
    baseDeep: '#071019',
    highlight: '#83aac7',
    edge: '#d6e7f2',
    trim: '#f2f8fc',
    glow: 'rgba(131, 170, 199, 0.24)',
    text: '#edf5fb',
  },
  E: {
    rank: 'E',
    label: 'Ferro carbonico',
    base: '#47403a',
    baseDeep: '#090807',
    highlight: '#8f7b68',
    edge: '#d2c1af',
    trim: '#efe6dc',
    glow: 'rgba(143, 123, 104, 0.2)',
    text: '#f0e7dd',
  },
};

export const getMetalRankPalette = (rank: string): MetalRankPalette => {
  const normalized = (rank || 'D').toUpperCase() as MetalReportRank;
  return METAL_RANKS[normalized] || METAL_RANKS.D;
};

const hexToRgb = (hex: string) => {
  const value = hex.replace('#', '');
  const normalized = value.length === 3
    ? value.split('').map((char) => char + char).join('')
    : value;

  const parsed = Number.parseInt(normalized, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

const mixHex = (from: string, to: string, amount: number) => {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const weight = Math.min(1, Math.max(0, amount));
  const mixChannel = (a: number, b: number) => Math.round(a + ((b - a) * weight));
  const mixed = [mixChannel(start.r, end.r), mixChannel(start.g, end.g), mixChannel(start.b, end.b)];
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

const withAlpha = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const MetalReportCard: React.FC<MetalReportCardProps> = ({
  rank,
  score,
  title,
  subtitle,
  dateRange,
  summary,
  dualProgress,
  metrics = [],
  badges = [],
  compact = false,
  captureId,
  entryFlash = false,
  className = '',
}) => {
  const palette = getMetalRankPalette(rank);
  const surfacePalette = compact
    ? {
        ...palette,
        base: mixHex(palette.base, '#111317', 0.42),
        baseDeep: mixHex(palette.baseDeep, '#010203', 0.36),
        highlight: mixHex(palette.highlight, '#636b76', 0.12),
        edge: mixHex(palette.edge, '#edf3fb', 0.1),
        trim: mixHex(palette.trim, '#ffffff', 0.1),
        glow: withAlpha(mixHex(palette.highlight, '#0f1114', 0.2), 0.2),
        text: mixHex(palette.text, '#ffffff', 0.04),
      }
    : palette;

  const uid = useId().replace(/:/g, '');
  const gradientId = `metal-gradient-${uid}`;
  const brushId = `metal-brush-${uid}`;
  const noiseId = `metal-noise-${uid}`;
  const frameId = `metal-frame-${uid}`;
  const railId = `metal-rail-${uid}`;
  const innerGlowId = `metal-inner-glow-${uid}`;

  const visibleMetrics = metrics.slice(0, compact ? 4 : 4);
  const visibleBadges = badges.slice(0, compact ? 2 : 4);
  const railLeft = subtitle || 'Ciclo consolidado';
  const railRight = dateRange || '';

  return (
    <div
      id={captureId}
      className={`metal-report-card ${compact ? 'metal-report-card--compact' : ''} ${entryFlash ? 'metal-report-card--entry-flash' : ''} ${className}`.trim()}
      style={{
        ['--metal-base' as string]: surfacePalette.base,
        ['--metal-base-deep' as string]: surfacePalette.baseDeep,
        ['--metal-highlight' as string]: surfacePalette.highlight,
        ['--metal-edge' as string]: surfacePalette.edge,
        ['--metal-trim' as string]: surfacePalette.trim,
        ['--metal-glow' as string]: surfacePalette.glow,
        ['--metal-text' as string]: surfacePalette.text,
      }}
    >
      <svg className="metal-report-card__svg" viewBox="0 0 720 980" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={surfacePalette.highlight} stopOpacity={compact ? '0.12' : '0.28'} />
            <stop offset="12%" stopColor={surfacePalette.base} stopOpacity="1" />
            <stop offset="52%" stopColor={surfacePalette.baseDeep} stopOpacity="1" />
            <stop offset="88%" stopColor={surfacePalette.base} stopOpacity="0.98" />
            <stop offset="100%" stopColor={surfacePalette.highlight} stopOpacity={compact ? '0.14' : '0.3'} />
          </linearGradient>
          <linearGradient id={frameId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={surfacePalette.edge} stopOpacity="0.18" />
            <stop offset="50%" stopColor={surfacePalette.trim} stopOpacity="0.95" />
            <stop offset="100%" stopColor={surfacePalette.edge} stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={railId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={surfacePalette.baseDeep} stopOpacity="0.68" />
            <stop offset="50%" stopColor={surfacePalette.highlight} stopOpacity="0.16" />
            <stop offset="100%" stopColor={surfacePalette.baseDeep} stopOpacity="0.68" />
          </linearGradient>
          <radialGradient id={innerGlowId} cx="50%" cy="0%" r="90%">
            <stop offset="0%" stopColor={surfacePalette.highlight} stopOpacity={compact ? '0.08' : '0.16'} />
            <stop offset="55%" stopColor={surfacePalette.base} stopOpacity="0" />
          </radialGradient>
          <pattern id={brushId} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="20" height="20" fill="transparent" />
            <rect x="0" y="0" width="20" height="2" fill="rgba(255,255,255,0.035)" />
            <rect x="0" y="9" width="20" height="1" fill="rgba(0,0,0,0.09)" />
          </pattern>
          <filter id={noiseId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
            <feComponentTransfer in="mono" result="grain">
              <feFuncA type="table" tableValues="0 0.05" />
            </feComponentTransfer>
            <feSpecularLighting in="mono" surfaceScale="2.2" specularConstant="0.5" specularExponent="22" lightingColor="#ffffff" result="specular">
              <feDistantLight azimuth="228" elevation="44" />
            </feSpecularLighting>
            <feBlend in="SourceGraphic" in2="grain" mode="overlay" result="metal" />
            <feBlend in="metal" in2="specular" mode="screen" />
          </filter>
        </defs>

        <rect x="10" y="10" width="700" height="960" rx="42" fill={`url(#${gradientId})`} filter={`url(#${noiseId})`} />
        <rect x="18" y="18" width="684" height="944" rx="36" fill={`url(#${brushId})`} opacity="0.3" />
        <rect x="18" y="18" width="684" height="944" rx="36" fill="none" stroke={`url(#${frameId})`} strokeWidth="2.5" />
        <rect x="40" y="42" width="640" height="96" rx="24" fill={`url(#${railId})`} stroke={surfacePalette.edge} strokeOpacity="0.18" strokeWidth="1.2" />
        <rect x="64" y="164" width="592" height="250" rx="34" fill={`url(#${innerGlowId})`} opacity="0.88" />
        <rect x="64" y="164" width="592" height="250" rx="34" fill="none" stroke={surfacePalette.edge} strokeOpacity="0.14" strokeWidth="1.5" />
        <path d="M84 494 H636" stroke={surfacePalette.edge} strokeOpacity="0.16" strokeWidth="1.5" />
        <path d="M84 802 H636" stroke={surfacePalette.edge} strokeOpacity="0.12" strokeWidth="1.5" />
        <rect x="54" y="54" width="612" height="872" rx="30" fill="none" stroke={surfacePalette.trim} strokeOpacity="0.08" strokeWidth="1" />
      </svg>

      <div className="metal-report-card__sheen" aria-hidden="true" />

      <div className="metal-report-card__content">
        <div className="metal-report-card__rail engraved-panel">
          <span className="metal-report-card__rail-label engraved-text-soft">{railLeft}</span>
          {railRight ? <span className="metal-report-card__rail-value engraved-text-soft">{railRight}</span> : null}
        </div>

        <div className="metal-report-card__hero">
          <div className="metal-report-card__seal engraved-panel" aria-hidden="true">
            <span className="metal-report-card__seal-core" />
            <span className="metal-report-card__seal-mark" />
          </div>
          <div className="metal-report-card__rank-cluster">
            <div className="metal-report-card__rank engraved-text">{surfacePalette.rank}</div>
            {typeof score === 'number' ? <div className="metal-report-card__score engraved-text-soft">Score {score}</div> : null}
          </div>
        </div>

        <div className="metal-report-card__title-stack">
          <h3 className="metal-report-card__title engraved-text">{title}</h3>
          {summary ? <p className="metal-report-card__summary engraved-text-soft">{summary}</p> : null}
        </div>

        {dualProgress ? (
          <div className="metal-report-card__dual-progress engraved-panel">
            <div className="metal-report-card__dual-progress-row">
              <div className="metal-report-card__dual-progress-meta">
                <span className="metal-report-card__dual-progress-label">{dualProgress.progressLabel || 'Progresso'}</span>
                <span className="metal-report-card__dual-progress-value engraved-text-soft">{dualProgress.progressValue || `${Math.round(dualProgress.progress)}%`}</span>
              </div>
              <div className="metal-report-card__dual-progress-track">
                <div
                  className="metal-report-card__dual-progress-fill metal-report-card__dual-progress-fill--progress"
                  style={{ width: `${Math.max(0, Math.min(100, dualProgress.progress))}%` }}
                />
              </div>
            </div>
            <div className="metal-report-card__dual-progress-row">
              <div className="metal-report-card__dual-progress-meta">
                <span className="metal-report-card__dual-progress-label">{dualProgress.timeLabel || 'Tempo'}</span>
                <span className="metal-report-card__dual-progress-value engraved-text-soft">{dualProgress.timeValue || `${Math.round(dualProgress.time)}%`}</span>
              </div>
              <div className="metal-report-card__dual-progress-track">
                <div
                  className="metal-report-card__dual-progress-fill metal-report-card__dual-progress-fill--time"
                  style={{ width: `${Math.max(0, Math.min(100, dualProgress.time))}%` }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {visibleMetrics.length > 0 && (
          <div className="metal-report-card__metrics">
            {visibleMetrics.map((metric) => (
              <div key={`${metric.label}-${metric.value}`} className="metal-report-card__metric engraved-panel">
                <span className="metal-report-card__metric-label">{metric.label}</span>
                <span className="metal-report-card__metric-value engraved-text">{metric.value}</span>
              </div>
            ))}
          </div>
        )}

        {visibleBadges.length > 0 && (
          <div className="metal-report-card__badges">
            {visibleBadges.map((badge) => (
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
