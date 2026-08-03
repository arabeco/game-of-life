import React from 'react';
import { GameLogoIcon, SparklesIcon } from './Icons';

export type OracleSpeakerTone = 'neutral' | 'guide' | 'success' | 'warning' | 'danger' | 'info';

const TONE_TOKENS: Record<OracleSpeakerTone, {
  core: string;
  coreSoft: string;
  border: string;
  glow: string;
  label: string;
}> = {
  neutral: {
    core: '#f3d48a',
    coreSoft: 'rgba(243,212,138,0.16)',
    border: 'rgba(243,212,138,0.52)',
    glow: 'rgba(243,212,138,0.2)',
    label: 'Oraculo',
  },
  guide: {
    core: '#f3d48a',
    coreSoft: 'rgba(243,212,138,0.16)',
    border: 'rgba(243,212,138,0.46)',
    glow: 'rgba(243,212,138,0.18)',
    label: 'Guia',
  },
  success: {
    core: '#7cf5b1',
    coreSoft: 'rgba(124,245,177,0.14)',
    border: 'rgba(124,245,177,0.48)',
    glow: 'rgba(124,245,177,0.22)',
    label: 'Progresso',
  },
  warning: {
    core: '#ffd166',
    coreSoft: 'rgba(255,209,102,0.16)',
    border: 'rgba(255,209,102,0.5)',
    glow: 'rgba(255,209,102,0.22)',
    label: 'Atencao',
  },
  danger: {
    core: '#ff6b6b',
    coreSoft: 'rgba(255,107,107,0.16)',
    border: 'rgba(255,107,107,0.5)',
    glow: 'rgba(255,107,107,0.24)',
    label: 'Risco',
  },
  info: {
    core: '#f3d48a',
    coreSoft: 'rgba(243,212,138,0.14)',
    border: 'rgba(243,212,138,0.44)',
    glow: 'rgba(243,212,138,0.18)',
    label: 'Sinal',
  },
};

const SIZE_CLASSES = {
  sm: {
    shell: 'h-11 w-11',
    icon: 'h-7 w-7',
    dot: 'h-3 w-3',
    badge: 'h-4 w-4 -right-0.5 -top-0.5',
    badgeIcon: 'h-2.5 w-2.5',
  },
  md: {
    shell: 'h-14 w-14',
    icon: 'h-9 w-9',
    dot: 'h-3.5 w-3.5',
    badge: 'h-4.5 w-4.5 -right-1 -top-1',
    badgeIcon: 'h-3 w-3',
  },
  lg: {
    shell: 'h-16 w-16',
    icon: 'h-11 w-11',
    dot: 'h-4 w-4',
    badge: 'h-5 w-5 -right-1 -top-1',
    badgeIcon: 'h-3.5 w-3.5',
  },
} as const;

export const getOracleSpeakerToneTokens = (tone: OracleSpeakerTone = 'neutral') =>
  TONE_TOKENS[tone] || TONE_TOKENS.neutral;

export const OracleSpeakerMark: React.FC<{
  tone?: OracleSpeakerTone;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
  pulse?: boolean;
  badge?: boolean;
}> = ({
  tone = 'neutral',
  size = 'md',
  className = '',
  pulse = true,
  badge = false,
}) => {
  const resolvedTone = tone as OracleSpeakerTone;
  const tokens = getOracleSpeakerToneTokens(resolvedTone);
  const sizes = SIZE_CLASSES[size];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full border bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(145deg,rgba(45,38,28,0.98),rgba(0,0,0,0.98))] ${sizes.shell} ${className}`}
      style={{
        borderColor: 'rgba(243,212,138,0.46)',
        color: tokens.core,
        boxShadow: `0 0 18px rgba(243,212,138,0.16), 0 12px 28px rgba(0,0,0,0.44)`,
      }}
      aria-label={tokens.label}
    >
      <GameLogoIcon className={`${sizes.icon} ${pulse ? 'animate-pulse-slow' : ''}`} />
      <span
        className={`pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-white/55 shadow-[0_0_14px_currentColor] ${sizes.dot}`}
        style={{
          background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), ${tokens.core} 38%, ${tokens.coreSoft} 100%)`,
          color: tokens.core,
          transform: 'translate(-50%, -50%)',
        }}
      />
      {badge && (
        <span
          className={`absolute flex items-center justify-center rounded-full border border-black/20 text-black ${sizes.badge}`}
          style={{ background: tokens.core, boxShadow: `0 0 14px ${tokens.glow}` }}
        >
          <SparklesIcon className={sizes.badgeIcon} />
        </span>
      )}
    </div>
  );
};
