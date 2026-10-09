import React from 'react';
import { SparklesIcon } from './Icons';

/**
 * A REGUA DE CORES DO ORACULO (aprovada em 09/10/2026, ver
 * docs/2026-10-09-handoff-push-cores-e-imagens.md, secao 9):
 *   neutral     — branco: informacao neutra (ciclo, planner, estoque, sabedoria)
 *   guide       — azul: orientacao, comeco ou retorno
 *   success     — verde: avanco concreto, ainda em andamento
 *   achievement — dourado: conquista completa
 *   danger      — vermelho: reservado, sem gatilho automatico
 * warning e info ficam para quem ja os usava.
 */
export type OracleSpeakerTone = 'neutral' | 'guide' | 'success' | 'achievement' | 'warning' | 'danger' | 'info';

const TONE_TOKENS: Record<OracleSpeakerTone, {
  core: string;
  coreSoft: string;
  border: string;
  glow: string;
  label: string;
}> = {
  neutral: {
    core: '#eef1f6',
    coreSoft: 'rgba(238,241,246,0.12)',
    border: 'rgba(238,241,246,0.38)',
    glow: 'rgba(238,241,246,0.16)',
    label: 'Oraculo',
  },
  achievement: {
    core: '#f3d48a',
    coreSoft: 'rgba(243,212,138,0.16)',
    border: 'rgba(243,212,138,0.52)',
    glow: 'rgba(243,212,138,0.22)',
    label: 'Conquista',
  },
  guide: {
    core: '#9fd8ff',
    coreSoft: 'rgba(159,216,255,0.14)',
    border: 'rgba(159,216,255,0.46)',
    glow: 'rgba(159,216,255,0.20)',
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
    core: '#eaf2ff',
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
    badge: 'h-4 w-4 -right-0.5 -top-0.5',
    badgeIcon: 'h-2.5 w-2.5',
  },
  md: {
    shell: 'h-14 w-14',
    icon: 'h-9 w-9',
    badge: 'h-4.5 w-4.5 -right-1 -top-1',
    badgeIcon: 'h-3 w-3',
  },
  lg: {
    shell: 'h-16 w-16',
    icon: 'h-11 w-11',
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

  /*
   * O SIMBOLO GANHA A COR (aprovado na previa tools/oracle-colors-preview).
   *
   * Era o logo colorido com uma bolinha no centro levando o tom, sobre uma casca
   * sempre dourada. Agora e a silhueta do losango acesa na cor do tom, sobre
   * fundo escuro, com borda fina e brilho suave: a cor se ve de longe, e o
   * desenho continua sendo o do Oraculo.
   */
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full border ${sizes.shell} ${className}`}
      style={{
        background: '#111216',
        borderColor: tokens.border,
        color: tokens.core,
        boxShadow: `0 0 12px ${tokens.coreSoft}, 0 12px 28px rgba(0,0,0,0.44)`,
      }}
      aria-label={tokens.label}
    >
      <svg
        viewBox="-5 -5 110 110"
        aria-hidden="true"
        className={`${sizes.icon} ${pulse ? 'animate-pulse-slow' : ''}`}
        style={{ filter: `drop-shadow(0 0 3px ${tokens.glow})` }}
      >
        <path d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" fill="currentColor" />
        <path d="M50 15 L60 40 L85 50 L60 60 L50 85 L40 60 L15 50 L40 40 Z" fill="none" stroke="#111216" strokeOpacity=".3" strokeWidth="2" />
      </svg>
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
