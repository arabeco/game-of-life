import type { View } from '../types';

export type ScreenIntroTipView = View;

export type ScreenIntroTipDef = {
  view: ScreenIntroTipView;
  label: string;
  title: string;
  summary: string;
  items: string[];
};

export const SCREEN_INTRO_TIPS_SETTINGS_CHANGED_EVENT = 'glyph:screen-intro-tips-settings-changed';

const SCREEN_INTRO_TIPS_ENABLED_PREFIX = 'glyph:screen-intro-tips:enabled';
const SCREEN_INTRO_TIPS_SEEN_PREFIX = 'glyph:screen-intro-tips:seen';

const sanitizeUserId = (userId?: string | null) => {
  const trimmed = String(userId || '').trim();
  return trimmed || 'anon';
};

const getEnabledStorageKey = (userId?: string | null) =>
  `${SCREEN_INTRO_TIPS_ENABLED_PREFIX}:${sanitizeUserId(userId)}`;

const getSeenStorageKey = (userId: string | null | undefined, view: ScreenIntroTipView) =>
  `${SCREEN_INTRO_TIPS_SEEN_PREFIX}:${sanitizeUserId(userId)}:${view}`;

export const SCREEN_INTRO_TIPS: Record<ScreenIntroTipView, ScreenIntroTipDef> = {
  assets: {
    view: 'assets',
    label: 'Ativos',
    title: 'Panorama vivo dos seus ativos',
    summary: 'Aqui voce enxerga a distribuicao geral da jornada e abre as leituras visuais mais rapidas do sistema.',
    items: [
      'forca atual por area da vida',
      'atalhos para identidade e leitura visual',
      'entrada rapida para modo jogo e camadas de progresso',
    ],
  },
  arenas: {
    view: 'arenas',
    label: 'Arenas',
    title: 'Frentes reais da sua vida',
    summary: 'Arenas organizam o territorio operacional. E aqui que metas grandes viram frentes legiveis.',
    items: [
      'arenas como frentes principais',
      'campanhas e estruturas maiores',
      'acoes ligadas a cada frente',
    ],
  },
  planner: {
    view: 'planner',
    label: 'Planner',
    title: 'Onde a intencao vira grade',
    summary: 'O planner segura o dia e a semana. Ele junta ciclo, carga, horario e o fluxo de execucao.',
    items: [
      'grade diaria e semanal',
      'ciclo e ritmo da fase atual',
      'sitrep e leitura do agora',
    ],
  },
  social: {
    view: 'social',
    label: 'Mundo',
    title: 'Camada compartilhada do sistema',
    summary: 'Aqui entram grupos, vinculos, loja e operacao social sem tirar o foco da base pessoal.',
    items: [
      'grupos, vinculos e operacao compartilhada',
      'biblioteca, codices e campanhas',
      'loja, premium e expansoes do sistema',
    ],
  },
  settings: {
    view: 'settings',
    label: 'Config',
    title: 'Ajustes finos da experiencia',
    summary: 'Configuracoes guardam o tom do app, a camada do Oraculo, privacidade e o acesso aos tutoriais.',
    items: [
      'modo jogo e preferencias gerais',
      'oraculo, alertas e privacidade',
      'tutoriais e releituras guiadas',
    ],
  },
};

export const SCREEN_INTRO_TIP_LIST = Object.values(SCREEN_INTRO_TIPS);

export const hasScreenIntroTip = (view: string): view is ScreenIntroTipView =>
  Object.prototype.hasOwnProperty.call(SCREEN_INTRO_TIPS, view);

export const areScreenIntroTipsEnabled = (userId?: string | null): boolean => {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(getEnabledStorageKey(userId)) !== '0';
};

export const setScreenIntroTipsEnabled = (userId: string | null | undefined, enabled: boolean) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getEnabledStorageKey(userId), enabled ? '1' : '0');
};

export const hasSeenScreenIntroTip = (userId: string | null | undefined, view: ScreenIntroTipView): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(getSeenStorageKey(userId, view)) === 'seen';
};

export const markScreenIntroTipSeen = (userId: string | null | undefined, view: ScreenIntroTipView) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getSeenStorageKey(userId, view), 'seen');
};
