import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  Flag,
  Gift,
  Mail,
  Minus,
  RotateCcw,
  Users,
  X,
  Zap,
  Bell,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { LegacyProjectionModal } from '../components/LegacyProjectionModal';
import { ReportResultCarousel } from '../components/ReportResultCarousel';
import { RewardPackModal } from '../components/RewardPackModal';
import { SvgRadarChart } from '../components/SvgRadarChart';
import { supabase } from '../supabaseClient';
import { useGame } from '../contexts/GameContext';
import { requestLocalNotificationPermission, scheduleLocalNotification, showLocalNotification } from '../utils/localNotification';
import { isCapacitorNativeRuntime } from '../utils/runtimePlatform';
import { hasAppPushRemoteDeliveryReady } from '../utils/pushRuntime';
import { SKINS_DATA } from '../constants';
import type { ChestType, LegacyRenderCycleDigest, LegacyRenderEraSummary, NotificationType, Report, ReportAtlasWeek, ReportIdentitySnapshot, RewardModalPayload } from '../types';

type BetaTier = 'ouro' | 'prata' | 'bronze' | null;

type Marco1Stage =
  | 'candidate'
  | 'invited'
  | 'scheduled'
  | 'onboarding'
  | 'activated'
  | 'observed'
  | 'retained'
  | 'cycled'
  | 'lost'
  | 'ignored'
  | string;

interface Marco1BetaScoreboardRow {
  id: string;
  email: string | null;
  nickname: string | null;
  beta_tier: BetaTier;
  manual_stage: Marco1Stage | null;
  stage_suggested: Marco1Stage | null;
  activation_passed: boolean | null;
  d2_returned: boolean | null;
  cycle_closed: boolean | null;
  active_days_14d: number | null;
  invite_code: string | null;
  claimed_invite_code: string | null;
  created_at: string;
}

const TRACKED_TIERS = ['ouro', 'prata', 'bronze'] as const;
const KPI_GOALS = {
  population: 50,
  activationPct: 60,
  d2Pct: 30,
  cyclePct: 20,
};

const stageStyles: Record<string, string> = {
  candidate: 'border-white/10 bg-zinc-950 text-zinc-400',
  invited: 'border-white/10 bg-zinc-900 text-zinc-300',
  scheduled: 'border-sky-500/20 bg-sky-950/60 text-sky-300',
  onboarding: 'border-amber-500/20 bg-amber-950/50 text-amber-300',
  activated: 'border-cyan-500/20 bg-cyan-950/50 text-cyan-300',
  observed: 'border-zinc-700/70 bg-zinc-900 text-zinc-300',
  retained: 'border-emerald-500/20 bg-emerald-950/60 text-emerald-300',
  cycled: 'border-lime-500/20 bg-lime-950/60 text-lime-300',
  lost: 'border-rose-500/20 bg-rose-950/60 text-rose-300',
  ignored: 'border-slate-700/70 bg-slate-900 text-slate-400',
};

const tierStyles: Record<Exclude<BetaTier, null>, string> = {
  ouro: 'border-yellow-500/30 bg-yellow-950/50 text-yellow-300',
  prata: 'border-slate-400/30 bg-slate-800/60 text-slate-200',
  bronze: 'border-amber-700/30 bg-amber-950/50 text-amber-300',
};

const formatPercent = (value: number) => `${value.toFixed(0)}%`;

const formatStageLabel = (value: string | null | undefined) => {
  if (!value) return 'candidate';
  return value.replace(/_/g, ' ');
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return 'Nao informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getDisplayName = (row: Marco1BetaScoreboardRow) => {
  const nickname = row.nickname?.trim();
  if (nickname) return nickname;

  const emailPrefix = row.email?.split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;

  return 'Usuario sem nome';
};

const getInitials = (value: string) => {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'GL';

  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
};

const getStageClassName = (stage: Marco1Stage | null) => {
  if (!stage) return stageStyles.candidate;
  return stageStyles[stage] || stageStyles.candidate;
};

const getTierClassName = (tier: BetaTier) => {
  if (!tier) return 'border-white/10 bg-zinc-900 text-zinc-400';
  return tierStyles[tier] || 'border-white/10 bg-zinc-900 text-zinc-400';
};

const getProgressTone = (progressPct: number, targetPct: number) => {
  if (progressPct >= targetPct) {
    return 'from-emerald-400 via-emerald-300 to-lime-300';
  }
  if (progressPct >= targetPct * 0.6) {
    return 'from-amber-300 via-amber-200 to-yellow-200';
  }
  return 'from-rose-400 via-orange-300 to-amber-200';
};

const CheckCell: React.FC<{ value: boolean | null | undefined }> = ({ value }) => {
  if (value) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/70 text-emerald-300">
        <Check className="h-4 w-4" strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/30 text-zinc-600">
      <Minus className="h-4 w-4" strokeWidth={2.5} />
    </span>
  );
};

const MetricBar: React.FC<{ valuePct: number; tone: string }> = ({ valuePct, tone }) => {
  const safeValue = Math.max(0, Math.min(100, valuePct));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/8">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${tone} transition-all duration-500`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
};

const KpiCard: React.FC<{
  icon: LucideIcon;
  title: string;
  value: string;
  helper: string;
  target: string;
  progressPct: number;
  tone: string;
}> = ({ icon: Icon, title, value, helper, target, progressPct, tone }) => (
  <GlassCard variant="neutral" className="p-3 sm:p-3.5">
    <div className="flex items-start justify-between gap-2.5">
      <div className="space-y-1.5">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">{title}</p>
        <div className="space-y-1">
          <p className="text-[1.7rem] font-black tracking-tight text-white sm:text-2xl md:text-[1.75rem]">{value}</p>
          <p className="text-[11px] text-zinc-400">{helper}</p>
        </div>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300">
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="mt-3 space-y-2">
      <MetricBar valuePct={progressPct} tone={tone} />
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        <span>Meta</span>
        <span className="text-zinc-300">{target}</span>
      </div>
    </div>
  </GlassCard>
);

const KpiSkeletonCard: React.FC = () => (
  <GlassCard variant="neutral" className="animate-pulse p-3 md:p-3.5">
    <div className="flex items-start justify-between gap-2.5">
      <div className="space-y-2.5">
        <div className="h-2.5 w-28 rounded-full bg-white/8" />
        <div className="h-7 w-20 rounded-full bg-white/10" />
        <div className="h-2.5 w-24 rounded-full bg-white/8" />
      </div>
      <div className="h-9 w-9 rounded-xl border border-white/6 bg-white/5" />
    </div>
    <div className="mt-4 h-2.5 rounded-full bg-white/8" />
  </GlassCard>
);

type SkinPreviewTheme = 'dark' | 'light';

type RGB = [number, number, number];

const GM_SKIN_PREVIEW_ORDER = ['BASIC', 'GOLD', 'FROST', 'EMBER', 'CYBER', 'AURORA', 'VOID'] as const;

const GM_SKIN_ACCENTS: Record<(typeof GM_SKIN_PREVIEW_ORDER)[number], string> = {
  BASIC: '#ffffff',
  GOLD: '#C5A059',
  FROST: '#92d4f3',
  EMBER: '#ff6a00',
  CYBER: '#7cd9ff',
  AURORA: '#a5f3fc',
  VOID: '#f1edff',
};

const GM_SKIN_BUTTON_GRADIENTS: Record<(typeof GM_SKIN_PREVIEW_ORDER)[number], string> = {
  BASIC: 'linear-gradient(135deg, #333333 0%, #eeeeee 50%, #333333 100%)',
  GOLD: 'linear-gradient(135deg, #5c4a1f 0%, #d4af37 50%, #5c4a1f 100%)',
  FROST: 'linear-gradient(135deg, #4a90e2 0%, #92d4f3 50%, #4a90e2 100%)',
  EMBER: 'linear-gradient(135deg, #3d0909 0%, #7d1412 34%, #bf3c1b 72%, #5f0f18 100%)',
  CYBER: 'linear-gradient(135deg, #143345 0%, #7cd9ff 50%, #143345 100%)',
  AURORA: 'linear-gradient(135deg, #0ea5e9 0%, #a5f3fc 50%, #0ea5e9 100%)',
  VOID: 'linear-gradient(135deg, #120815 0%, #2a1336 50%, #120815 100%)',
};

const hexToRgb = (hex: string): RGB => {
  const value = hex.replace('#', '').trim();
  const normalized = value.length === 3
    ? value.split('').map((part) => part + part).join('')
    : value;
  const parsed = Number.parseInt(normalized, 16);
  return [
    (parsed >> 16) & 255,
    (parsed >> 8) & 255,
    parsed & 255,
  ];
};

const mixRgb = (a: RGB, b: RGB, amount: number): RGB => {
  const t = Math.max(0, Math.min(1, amount));
  return [
    Math.round(a[0] * (1 - t) + b[0] * t),
    Math.round(a[1] * (1 - t) + b[1] * t),
    Math.round(a[2] * (1 - t) + b[2] * t),
  ];
};

const rgbToString = (rgb: RGB, alpha = 1) =>
  alpha >= 1
    ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
    : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

const rgbToHex = (rgb: RGB) =>
  `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const buildSkinPreviewTokens = (skinId: (typeof GM_SKIN_PREVIEW_ORDER)[number], theme: SkinPreviewTheme) => {
  const accent = hexToRgb(GM_SKIN_ACCENTS[skinId]);
  const slateDark = hexToRgb('#243447');
  const slateMid = hexToRgb('#66788c');
  const safeDark = hexToRgb('#141b24');
  const safeDarkSoft = hexToRgb('#4f5f72');
  const white = hexToRgb('#ffffff');
  const deepDark = hexToRgb('#0a0d12');
  const darkShell = hexToRgb('#20242d');
  const lightTop = hexToRgb('#f5f8fa');
  const lightBottom = hexToRgb('#d5dde5');
  const plannerMid = hexToRgb('#afbed0');
  const plannerBase = hexToRgb('#6c7b8f');

  if (theme === 'dark') {
    const cardTop = mixRgb(accent, darkShell, 0.22);
    const cardBottom = mixRgb(accent, deepDark, 0.08);
    const plannerTop = mixRgb(accent, hexToRgb('#11161d'), 0.12);
    const plannerBottom = mixRgb(accent, deepDark, 0.06);
    const text = mixRgb(accent, safeDark, 0.92);
    const cardText = mixRgb(accent, safeDark, 0.95);
    const subtleText = mixRgb(accent, safeDarkSoft, 0.88);
    const border = mixRgb(accent, white, 0.28);

    return {
      accentHex: GM_SKIN_ACCENTS[skinId],
      buttonBackground: GM_SKIN_BUTTON_GRADIENTS[skinId],
      buttonText: skinId === 'VOID' || skinId === 'EMBER' ? '#F6EEE7' : '#1B1408',
      cardBackground: `linear-gradient(180deg, ${rgbToString(cardTop, 0.96)} 0%, ${rgbToString(cardBottom, 0.985)} 100%)`,
      plannerBackground: `linear-gradient(180deg, ${rgbToString(plannerTop, 0.95)} 0%, ${rgbToString(plannerBottom, 0.98)} 100%)`,
      textColor: rgbToString(text),
      cardTextColor: rgbToString(cardText),
      subtleTextColor: rgbToString(subtleText),
      borderColor: rgbToString(border),
      textHex: rgbToHex(text),
      borderHex: rgbToHex(border),
    };
  }

  const cardTop = mixRgb(accent, lightTop, 0.18);
  const cardBottom = mixRgb(accent, lightBottom, 0.26);
  const plannerTop = mixRgb(accent, white, 0.2);
  const plannerMidColor = mixRgb(accent, plannerMid, 0.26);
  const plannerBottom = mixRgb(accent, plannerBase, 0.18);
  const text = mixRgb(accent, safeDark, 0.92);
  const cardText = mixRgb(accent, safeDark, 0.96);
  const subtleText = mixRgb(accent, safeDarkSoft, 0.9);
  const border = mixRgb(accent, slateMid, 0.34);

  return {
    accentHex: GM_SKIN_ACCENTS[skinId],
    buttonBackground: GM_SKIN_BUTTON_GRADIENTS[skinId],
    buttonText: skinId === 'VOID' || skinId === 'EMBER' ? '#F6EEE7' : '#1B1408',
    cardBackground: `linear-gradient(180deg, ${rgbToString(cardTop, 0.96)} 0%, ${rgbToString(cardBottom, 0.94)} 100%)`,
    plannerBackground: `linear-gradient(180deg, ${rgbToString(plannerTop, 0.98)} 0%, ${rgbToString(plannerMidColor, 0.94)} 38%, ${rgbToString(plannerBottom, 0.96)} 100%)`,
    textColor: rgbToString(text),
    cardTextColor: rgbToString(cardText),
    subtleTextColor: rgbToString(subtleText),
    borderColor: rgbToString(border),
    textHex: rgbToHex(text),
    borderHex: rgbToHex(border),
  };
};

const SkinPaletteLine: React.FC<{
  label: string;
  background: string;
  borderColor: string;
  children?: React.ReactNode;
}> = ({ label, background, borderColor, children }) => (
  <div className="grid grid-cols-[88px_1fr] items-center gap-3">
    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</span>
    <div
      className="flex min-h-[38px] items-center justify-between rounded-[14px] border px-3 py-2"
      style={{ background: background, borderColor }}
    >
      {children}
    </div>
  </div>
);

const SkinPreviewMiniModal: React.FC<{
  title: string;
  preview: ReturnType<typeof buildSkinPreviewTokens>;
}> = ({ title, preview }) => (
  <div
    className="mt-3 overflow-hidden rounded-[20px] border p-3 shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
    style={{ background: preview.cardBackground, borderColor: preview.borderColor }}
  >
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: preview.subtleTextColor }}>
            Modal teste
          </p>
          <h3 className="text-sm font-black uppercase tracking-[0.12em]" style={{ color: preview.cardTextColor }}>
            {title}
          </h3>
        </div>
        <div
          className="h-8 w-8 rounded-full border"
          style={{ borderColor: preview.borderColor, background: 'rgba(255,255,255,0.08)' }}
        />
      </div>

      <div
        className="rounded-[14px] border px-3 py-2"
        style={{ background: preview.plannerBackground, borderColor: preview.borderColor }}
      >
        <p className="text-[10px] leading-relaxed" style={{ color: preview.cardTextColor }}>
          Fundo interno, bloco secundario e leitura segura sobre a superficie.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]"
          style={{
            background: preview.buttonBackground,
            color: preview.buttonText,
            border: `1px solid ${preview.borderColor}`,
          }}
        >
          Primario
        </button>
        <button
          type="button"
          className="rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: preview.cardTextColor,
            borderColor: preview.borderColor,
          }}
        >
          Secundario
        </button>
      </div>
    </div>
  </div>
);

const GmSkinPaletteSection: React.FC = () => {
  const [previewTheme, setPreviewTheme] = useState<SkinPreviewTheme>('dark');

  const skins = useMemo(() => {
    const byId = new Map(SKINS_DATA.map((skin) => [skin.id, skin]));
    return GM_SKIN_PREVIEW_ORDER.map((skinId) => ({
      id: skinId,
      name: byId.get(skinId)?.name || skinId,
      preview: buildSkinPreviewTokens(skinId, previewTheme),
    }));
  }, [previewTheme]);

  return (
    <section>
      <GlassCard variant="neutral" className="p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-400">Painel de Skins UI</p>
              <h2 className="text-lg font-black text-white">Mesa indicativa das 7 skins</h2>
              <p className="text-xs text-zinc-400">
                Leitura rápida de botão, fundo de cards, planner, texto e bordas para lapidar a linguagem visual sem abrir uma por uma.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-black/25 p-1">
              {([
                { id: 'dark', label: 'Escuro' },
                { id: 'light', label: 'Claro' },
              ] as const).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPreviewTheme(option.id)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                    previewTheme === option.id
                      ? 'bg-white/12 text-white shadow-[0_6px_18px_rgba(0,0,0,0.25)]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {skins.map((skin) => (
              <div key={skin.id} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase tracking-[0.16em] text-white">{skin.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      Accent {skin.preview.accentHex}
                    </p>
                  </div>
                  <div
                    className="h-8 w-8 shrink-0 rounded-full border"
                    style={{ background: skin.preview.buttonBackground, borderColor: skin.preview.borderColor }}
                  />
                </div>

                <div className="space-y-2.5">
                  <SkinPaletteLine label="Botao" background={skin.preview.buttonBackground} borderColor={skin.preview.borderColor}>
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.18em]"
                      style={{ color: skin.preview.buttonText }}
                    >
                      CTA / Gradiente
                    </span>
                  </SkinPaletteLine>

          <SkinPaletteLine label="Cards" background={skin.preview.cardBackground} borderColor={skin.preview.borderColor}>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: skin.preview.cardTextColor }}>
                      Fundo principal
                    </span>
                  </SkinPaletteLine>

                  <SkinPaletteLine label="Planner" background={skin.preview.plannerBackground} borderColor={skin.preview.borderColor}>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: skin.preview.cardTextColor }}>
                      Grade / superficie
                    </span>
                  </SkinPaletteLine>

                  <SkinPaletteLine label="Leitura" background={skin.preview.cardBackground} borderColor={skin.preview.borderColor}>
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: skin.preview.cardTextColor }}>
                        Titulo seguro
                      </span>
                      <span className="text-[10px] font-semibold tracking-[0.08em]" style={{ color: skin.preview.subtleTextColor }}>
                        subtom
                      </span>
                    </div>
                  </SkinPaletteLine>

                  <SkinPaletteLine label="Bordas" background="rgba(0,0,0,0.18)" borderColor={skin.preview.borderColor}>
                    <div className="flex w-full items-center gap-3">
                      <span
                        className="h-[3px] flex-1 rounded-full"
                        style={{ background: skin.preview.borderColor }}
                      />
                      <span className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: skin.preview.textColor }}>
                        {skin.preview.borderHex}
                      </span>
                    </div>
                  </SkinPaletteLine>

                  <SkinPreviewMiniModal title={skin.name} preview={skin.preview} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </section>
  );
};

const GM_SHOWCASE_REPORT = {
  title: 'Operacao Primeira Linhagem',
  subtitle: 'Snapshot editorial para vitrine do beta fechado',
  rangeLabel: '03 fev . 16 mar 2026',
  windowLabel: '42 dias de campo',
  commandLabel: 'ALPHA . T1 FUNDACAO',
  headline:
    'A cena ja sustenta narrativa publica: onboarding claro, motor de retorno acima da meta e primeiros ciclos fechando com consistencia suficiente para print de campanha.',
  metrics: {
    population: 34,
    populationGoal: 50,
    activationPct: 74,
    d2Pct: 39,
    cyclePct: 28,
  },
  radar: {
    labels: ['ATIVACAO', 'D2', 'CICLO', 'MOTOR', 'CONVITE', 'CLAREZA'],
    current: [74, 39, 28, 68, 83, 77],
    target: [60, 30, 20, 45, 70, 70],
  },
  signals: [
    { title: 'Tempo medio ate ativar', value: '17h', helper: 'do bilhete ao primeiro loop fechado' },
    { title: 'Dias ativos (14d)', value: '8.6', helper: 'media realista para base ainda enxuta' },
    { title: 'Aceite de convite', value: '83%', helper: 'bilhete ouro, prata e bronze' },
    { title: 'Sessao util media', value: '18 min', helper: 'janela boa para celular e D0' },
  ],
  tiers: [
    { tier: 'ouro' as const, count: 8, note: 'Alta resposta, mais clareza e feedback rico' },
    { tier: 'prata' as const, count: 11, note: 'Bom equilibrio entre volume e retencao' },
    { tier: 'bronze' as const, count: 15, note: 'Base de prova para onboarding e retorno' },
  ],
  standouts: [
    { id: 'showcase-1', name: 'Lyra Vale', tier: 'ouro' as const, stage: 'cycled', activeDays14d: 12, note: 'Fechou ciclo e abriu leitura premium de mentoria' },
    { id: 'showcase-2', name: 'Caio North', tier: 'prata' as const, stage: 'retained', activeDays14d: 9, note: 'Planner mobile forte e retorno D2 sem ruido' },
    { id: 'showcase-3', name: 'Mira Sol', tier: 'bronze' as const, stage: 'activated', activeDays14d: 7, note: 'Onboarding bom e boa leitura de valor do Ouro' },
  ],
};

const ShowcaseMetricCard: React.FC<{
  icon: LucideIcon;
  title: string;
  value: string;
  helper: string;
  progressPct: number;
  tone: string;
}> = ({ icon: Icon, title, value, helper, progressPct, tone }) => (
  <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(0,0,0,0.18))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1.5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">{title}</p>
        <p className="text-[1.9rem] font-black tracking-tight text-white sm:text-[2.2rem]">{value}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/72">
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="mt-1 text-[12px] leading-relaxed text-white/64">{helper}</p>
    <div className="mt-4">
      <MetricBar valuePct={progressPct} tone={tone} />
    </div>
  </div>
);

const ShowcaseStatPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/72">
    {label} . <span className="text-white">{value}</span>
  </div>
);

const GmShowcaseSection: React.FC = () => {
  const populationProgress = Math.min(100, (GM_SHOWCASE_REPORT.metrics.population / GM_SHOWCASE_REPORT.metrics.populationGoal) * 100);

  return (
    <section>
      <GlassCard
        variant="neutral"
        className="overflow-hidden border border-white/12 p-0 shadow-[0_30px_100px_rgba(0,0,0,0.42)]"
        style={{
          backgroundImage: [
            'radial-gradient(circle at top right, rgba(36,168,143,0.20), transparent 28%)',
            'radial-gradient(circle at 12% 12%, rgba(244,196,48,0.14), transparent 26%)',
            'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(16,16,16,0.24) 24%, rgba(7,7,9,0.94) 100%)',
          ].join(', '),
        }}
      >
        <div className="border-b border-white/8 px-5 py-5 md:px-6 md:py-6">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:items-start">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
                  Snapshot de vitrine
                </span>
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                  {GM_SHOWCASE_REPORT.commandLabel}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[rgba(240,200,67,0.82)]">
                    {GM_SHOWCASE_REPORT.rangeLabel}
                  </p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-white sm:text-[2.15rem]">
                    {GM_SHOWCASE_REPORT.title}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-white/62">{GM_SHOWCASE_REPORT.subtitle}</p>
                </div>

                <p className="max-w-2xl text-sm leading-relaxed text-zinc-300">{GM_SHOWCASE_REPORT.headline}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <ShowcaseStatPill label="Janela" value={GM_SHOWCASE_REPORT.windowLabel} />
                <ShowcaseStatPill label="Populacao" value={`${GM_SHOWCASE_REPORT.metrics.population}/${GM_SHOWCASE_REPORT.metrics.populationGoal}`} />
                <ShowcaseStatPill label="Meta dominante" value="60 / 30 / 20" />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/22 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Leitura composta</p>
                  <h3 className="mt-1 text-base font-black text-white">Radar do comando</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/52">
                  6 eixos
                </span>
              </div>
              <div className="mt-4 h-[18rem]">
                <SvgRadarChart
                  labels={GM_SHOWCASE_REPORT.radar.labels}
                  maxValue={100}
                  levels={5}
                  className="h-full"
                  showLegend
                  legendAccentColor="rgba(255,255,255,0.7)"
                  series={[
                    {
                      id: 'target',
                      label: 'Meta T1',
                      values: GM_SHOWCASE_REPORT.radar.target,
                      stroke: 'rgba(255,255,255,0.45)',
                      fill: 'rgba(255,255,255,0.12)',
                      fillOpacity: 0.08,
                      dashed: true,
                      strokeWidth: 1.1,
                    },
                    {
                      id: 'current',
                      label: 'Snapshot',
                      values: GM_SHOWCASE_REPORT.radar.current,
                      stroke: '#F0C843',
                      fill: 'rgba(240,200,67,0.4)',
                      fillOpacity: 0.22,
                      strokeWidth: 1.4,
                      showDots: true,
                      dotFill: '#0a0a0a',
                      dotStroke: '#F0C843',
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b border-white/8 px-5 py-5 md:grid-cols-2 xl:grid-cols-4 md:px-6">
          <ShowcaseMetricCard
            icon={Users}
            title="Base em campo"
            value={`${GM_SHOWCASE_REPORT.metrics.population}/${GM_SHOWCASE_REPORT.metrics.populationGoal}`}
            helper="janela mais longa para mostrar densidade e maturidade"
            progressPct={populationProgress}
            tone={getProgressTone(populationProgress, 100)}
          />
          <ShowcaseMetricCard
            icon={Zap}
            title="Ativacao"
            value={formatPercent(GM_SHOWCASE_REPORT.metrics.activationPct)}
            helper="entraram no app e montaram loop inicial"
            progressPct={GM_SHOWCASE_REPORT.metrics.activationPct}
            tone={getProgressTone(GM_SHOWCASE_REPORT.metrics.activationPct, KPI_GOALS.activationPct)}
          />
          <ShowcaseMetricCard
            icon={RotateCcw}
            title="Retorno D2"
            value={formatPercent(GM_SHOWCASE_REPORT.metrics.d2Pct)}
            helper="taxa forte o bastante para narrativa publica"
            progressPct={GM_SHOWCASE_REPORT.metrics.d2Pct}
            tone={getProgressTone(GM_SHOWCASE_REPORT.metrics.d2Pct, KPI_GOALS.d2Pct)}
          />
          <ShowcaseMetricCard
            icon={Flag}
            title="Ciclo 1"
            value={formatPercent(GM_SHOWCASE_REPORT.metrics.cyclePct)}
            helper="os primeiros fechamentos reais ja aparecem"
            progressPct={GM_SHOWCASE_REPORT.metrics.cyclePct}
            tone={getProgressTone(GM_SHOWCASE_REPORT.metrics.cyclePct, KPI_GOALS.cyclePct)}
          />
        </div>

        <div className="grid gap-4 px-5 py-5 lg:grid-cols-[0.95fr_0.9fr_1.05fr] md:px-6">
          <div className="rounded-[24px] border border-white/10 bg-black/22 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Sinais de campo</p>
            <div className="mt-4 space-y-3">
              {GM_SHOWCASE_REPORT.signals.map((signal) => (
                <div key={signal.title} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.14em] text-white/70">{signal.title}</span>
                    <span className="text-lg font-black text-white">{signal.value}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-zinc-400">{signal.helper}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/22 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Composicao de pelotao</p>
            <div className="mt-4 space-y-3">
              {GM_SHOWCASE_REPORT.tiers.map((entry) => (
                <div key={entry.tier} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getTierClassName(entry.tier)}`}>
                      {entry.tier}
                    </span>
                    <span className="text-lg font-black text-white">{entry.count}</span>
                  </div>
                  <p className="mt-2 text-[12px] text-zinc-400">{entry.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/22 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/42">Nomes quentes</p>
                <h3 className="mt-1 text-base font-black text-white">Leituras que rendem print</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgba(240,200,67,0.72)]">
                curadoria
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {GM_SHOWCASE_REPORT.standouts.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-white">{entry.name}</p>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${getTierClassName(entry.tier)}`}>
                          {entry.tier}
                        </span>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${getStageClassName(entry.stage)}`}>
                          {formatStageLabel(entry.stage)}
                        </span>
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-zinc-400">{entry.note}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white">{entry.activeDays14d}/14</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">motor</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <MetricBar valuePct={Math.min(100, (entry.activeDays14d / 14) * 100)} tone={getProgressTone((entry.activeDays14d / 14) * 100, 45)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
};

const TableSkeleton: React.FC = () => (
  <div className="animate-pulse divide-y divide-white/6">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="grid min-w-[900px] grid-cols-[2.5fr_1.1fr_1.3fr_0.9fr_0.9fr_0.9fr_1.2fr_0.5fr] items-center gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-white/8" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-28 rounded-full bg-white/10" />
            <div className="h-2.5 w-16 rounded-full bg-white/8" />
          </div>
        </div>
        <div className="h-8 w-16 rounded-full bg-white/8" />
        <div className="h-8 w-24 rounded-full bg-white/8" />
        <div className="h-7 w-7 rounded-full bg-white/8" />
        <div className="h-7 w-7 rounded-full bg-white/8" />
        <div className="h-7 w-7 rounded-full bg-white/8" />
        <div className="h-3 w-16 rounded-full bg-white/8" />
        <div className="h-4 w-4 rounded-full bg-white/8" />
      </div>
    ))}
  </div>
);

const DetailMetric: React.FC<{
  title: string;
  value: string;
  helper: string;
  progressPct: number;
  tone: string;
}> = ({ title, value, helper, progressPct, tone }) => (
  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{title}</p>
        <p className="mt-1 text-lg font-black text-white">{value}</p>
      </div>
      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300">
        {helper}
      </span>
    </div>
    <div className="mt-3">
      <MetricBar valuePct={progressPct} tone={tone} />
    </div>
  </div>
);

const PlayerInsightModal: React.FC<{
  row: Marco1BetaScoreboardRow;
  onClose: () => void;
}> = ({ row, onClose }) => {
  const displayName = getDisplayName(row);
  const tier = row.beta_tier || 'sem-tier';
  const stage = row.stage_suggested || row.manual_stage || 'candidate';
  const activeDays = row.active_days_14d ?? 0;
  const activeDaysPct = Math.min(100, (activeDays / 14) * 100);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/72 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6" onClick={onClose}>
      <GlassCard
        variant="neutral"
        className="relative max-h-[94vh] w-full max-w-2xl overflow-y-auto border border-white/12 bg-[#090909]/96 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-5 md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white sm:right-4 sm:top-4"
          aria-label="Fechar detalhes"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/12 bg-gradient-to-br from-white/10 via-white/5 to-transparent text-xs font-black uppercase tracking-[0.16em] text-white sm:h-14 sm:w-14 sm:text-sm">
            {getInitials(displayName)}
          </div>
          <div className="min-w-0 flex-1 space-y-2 pr-12 sm:pr-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Leitura individual</p>
              <h2 className="truncate text-xl font-black tracking-tight text-white sm:text-2xl">{displayName}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getTierClassName(row.beta_tier)}`}>
                {tier}
              </span>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStageClassName(stage)}`}>
                {formatStageLabel(stage)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-zinc-300">
              <Mail className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Email</p>
            </div>
            <p className="mt-2 break-all text-sm font-semibold text-white">{row.email || 'Nao informado'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-zinc-300">
              <CalendarDays className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Entrada</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{formatDateTime(row.created_at)}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <DetailMetric
            title="Ativacao"
            value={row.activation_passed ? 'Passou' : 'Nao passou'}
            helper={row.activation_passed ? 'loop criado' : 'pendente'}
            progressPct={row.activation_passed ? 100 : 18}
            tone={getProgressTone(row.activation_passed ? 100 : 18, KPI_GOALS.activationPct)}
          />
          <DetailMetric
            title="Retorno D2"
            value={row.d2_returned ? 'Voltou' : 'Nao voltou'}
            helper={row.d2_returned ? 'dia 2' : 'pendente'}
            progressPct={row.d2_returned ? 100 : 12}
            tone={getProgressTone(row.d2_returned ? 100 : 12, KPI_GOALS.d2Pct)}
          />
          <DetailMetric
            title="Ciclo"
            value={row.cycle_closed ? 'Fechado' : 'Aberto'}
            helper={row.cycle_closed ? 'concluiu 1' : 'pendente'}
            progressPct={row.cycle_closed ? 100 : 10}
            tone={getProgressTone(row.cycle_closed ? 100 : 10, KPI_GOALS.cyclePct)}
          />
          <DetailMetric
            title="Motor 14d"
            value={`${activeDays}/14 dias`}
            helper="tracao recente"
            progressPct={activeDaysPct}
            tone={getProgressTone(activeDaysPct, 45)}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Bilhete</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold text-zinc-200">
              Convite: {row.claimed_invite_code || row.invite_code || 'nao informado'}
            </span>
            {row.manual_stage && row.manual_stage !== stage && (
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-semibold text-zinc-200">
                Manual: {formatStageLabel(row.manual_stage)}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const addDaysIso = (isoDate: string, offset: number) => {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

const buildShowcaseIdentity = (
  nickname: string,
  title: string,
  level: number,
  clanName: string,
  clanRankName: string,
): ReportIdentitySnapshot => ({
  nickname,
  title,
  level,
  clanName,
  clanRankName,
  nobilityRankName: title,
  capturedAt: new Date('2026-03-16T19:30:00Z').toISOString(),
});

const GM_SHOWCASE_IDENTITY = buildShowcaseIdentity('Aurelia Vale', 'Arquimandrita', 18, 'Aurora', 'Pilar de Campo');
const GM_SHOWCASE_SOVEREIGN_NAME = GM_SHOWCASE_IDENTITY.nickname || 'Aurelia Vale';

const buildShowcaseWeek = ({
  cycleId,
  weekIndex,
  startDate,
  arenaId,
  arenaName,
  actionName,
  actionIcon,
  actionType = 'Ação Recorrente',
  plannedPattern,
  completedPattern,
}: {
  cycleId: string;
  weekIndex: number;
  startDate: string;
  arenaId: string;
  arenaName: string;
  actionName: string;
  actionIcon: string;
  actionType?: 'Ação Recorrente' | 'Compromisso' | 'Marco' | 'Livre';
  plannedPattern: number[];
  completedPattern: number[];
}): ReportAtlasWeek => {
  const startSlots = [330, 480, 630, 780];
  const days = plannedPattern.map((plannedCount, dayIndex) => {
    const completedCount = Math.min(plannedCount, completedPattern[dayIndex] ?? plannedCount);
    const date = addDaysIso(startDate, dayIndex);
    const scheduledItems = Array.from({ length: Math.min(completedCount, 4) }, (_, taskIndex) => ({
      taskId: `${cycleId}-w${weekIndex}-d${dayIndex}-s${taskIndex}`,
      actionId: `${cycleId}-action-${taskIndex}`,
      actionName,
      actionIcon,
      arenaId,
      arenaName,
      startTime: startSlots[taskIndex] ?? 840,
      duration: 45 + (taskIndex * 10),
      completed: true,
      actionType,
    }));
    const pendingCount = Math.max(plannedCount - completedCount, 0);
    const unscheduledItems = Array.from({ length: Math.min(pendingCount, 3) }, (_, taskIndex) => ({
      taskId: `${cycleId}-w${weekIndex}-d${dayIndex}-u${taskIndex}`,
      actionId: `${cycleId}-pending-${taskIndex}`,
      actionName,
      actionIcon,
      arenaId,
      arenaName,
      startTime: -1,
      duration: 30,
      completed: false,
      actionType,
    }));

    return {
      date,
      plannedCount,
      completedCount,
      plannedMinutes: plannedCount * 55,
      completedMinutes: completedCount * 50,
      arenaBuckets: [
        {
          arenaId,
          arenaName,
          total: plannedCount,
          completed: completedCount,
        },
      ],
      scheduledItems,
      unscheduledItems,
    };
  });

  return {
    weekIndex,
    startDate,
    endDate: addDaysIso(startDate, 6),
    plannedCount: days.reduce((sum, day) => sum + day.plannedCount, 0),
    completedCount: days.reduce((sum, day) => sum + day.completedCount, 0),
    plannedMinutes: days.reduce((sum, day) => sum + day.plannedMinutes, 0),
    completedMinutes: days.reduce((sum, day) => sum + day.completedMinutes, 0),
    dominantArenaId: arenaId,
    dominantArenaName: arenaName,
    days,
  };
};

const buildShowcaseCycle = ({
  id,
  name,
  startDate,
  score,
  focusArena,
  signatureAction,
  plannedMetas,
  sealedMetas,
  identitySnapshot,
  actionIcon,
  weeks,
}: {
  id: string;
  name: string;
  startDate: string;
  score: number;
  focusArena: string;
  signatureAction: string;
  plannedMetas: number;
  sealedMetas: number;
  identitySnapshot: ReportIdentitySnapshot;
  actionIcon: string;
  weeks: Array<{ plannedPattern: number[]; completedPattern: number[] }>;
}): LegacyRenderCycleDigest => ({
  id,
  name,
  startDate,
  endDate: addDaysIso(startDate, 13),
  score,
  grade: score >= 90 ? 'S' : score >= 82 ? 'A' : score >= 72 ? 'B' : 'C',
  focusArena,
  signatureAction,
  plannedMetas,
  sealedMetas,
  identitySnapshot,
  weeklyAtlas: weeks.map((week, index) =>
    buildShowcaseWeek({
      cycleId: id,
      weekIndex: index + 1,
      startDate: addDaysIso(startDate, index * 7),
      arenaId: `${focusArena.toLowerCase().replace(/\s+/g, '-')}-arena`,
      arenaName: focusArena,
      actionName: signatureAction,
      actionIcon,
      plannedPattern: week.plannedPattern,
      completedPattern: week.completedPattern,
    }),
  ),
});

const LEGACY_SHOWCASE_ERAS: LegacyRenderEraSummary[] = (() => {
  const identityA = GM_SHOWCASE_IDENTITY;
  const identityB = GM_SHOWCASE_IDENTITY;
  const identityC = GM_SHOWCASE_IDENTITY;

  const eraOneCycles = [
    buildShowcaseCycle({
      id: 'legacy-c1',
      name: 'Rito de Abertura',
      startDate: '2025-01-06',
      score: 58,
      focusArena: 'Saude',
      signatureAction: 'Treino de alvorada',
      plannedMetas: 5,
      sealedMetas: 4,
      identitySnapshot: identityA,
      actionIcon: '⚔️',
      weeks: [
        { plannedPattern: [3, 3, 2, 2, 3, 1, 0], completedPattern: [2, 3, 2, 1, 2, 1, 0] },
        { plannedPattern: [3, 2, 3, 2, 3, 1, 0], completedPattern: [3, 2, 2, 2, 3, 1, 0] },
      ],
    }),
    buildShowcaseCycle({
      id: 'legacy-c2',
      name: 'Cadencia de Ferro',
      startDate: '2025-01-20',
      score: 72,
      focusArena: 'Trabalho',
      signatureAction: 'Bloco de foco 90m',
      plannedMetas: 6,
      sealedMetas: 5,
      identitySnapshot: identityB,
      actionIcon: '🛡️',
      weeks: [
        { plannedPattern: [3, 3, 3, 2, 3, 1, 0], completedPattern: [3, 3, 2, 2, 3, 1, 0] },
        { plannedPattern: [4, 3, 3, 3, 3, 1, 0], completedPattern: [3, 3, 3, 2, 3, 1, 0] },
      ],
    }),
    buildShowcaseCycle({
      id: 'legacy-c3',
      name: 'Primeira Tracao',
      startDate: '2025-02-03',
      score: 86,
      focusArena: 'Estudos',
      signatureAction: 'Leitura tática',
      plannedMetas: 7,
      sealedMetas: 6,
      identitySnapshot: identityA,
      actionIcon: '📘',
      weeks: [
        { plannedPattern: [4, 3, 3, 3, 3, 1, 0], completedPattern: [3, 3, 3, 2, 3, 1, 0] },
        { plannedPattern: [4, 4, 3, 3, 3, 1, 0], completedPattern: [4, 3, 3, 3, 3, 1, 0] },
      ],
    }),
  ];

  const eraTwoCycles = [
    buildShowcaseCycle({
      id: 'legacy-c4',
      name: 'Cerco do Planner',
      startDate: '2025-03-03',
      score: 64,
      focusArena: 'Planejamento',
      signatureAction: 'Janela de comando',
      plannedMetas: 8,
      sealedMetas: 7,
      identitySnapshot: identityB,
      actionIcon: '🜂',
      weeks: [
        { plannedPattern: [4, 4, 3, 3, 4, 1, 0], completedPattern: [4, 3, 3, 3, 4, 1, 0] },
        { plannedPattern: [4, 4, 4, 3, 4, 2, 0], completedPattern: [4, 4, 4, 3, 3, 1, 0] },
      ],
    }),
    buildShowcaseCycle({
      id: 'legacy-c5',
      name: 'Forja da Mentoria',
      startDate: '2025-03-17',
      score: 83,
      focusArena: 'Mentoria',
      signatureAction: 'Sessao de pupilo',
      plannedMetas: 8,
      sealedMetas: 8,
      identitySnapshot: identityC,
      actionIcon: '✨',
      weeks: [
        { plannedPattern: [3, 4, 3, 3, 3, 2, 0], completedPattern: [3, 4, 3, 3, 3, 1, 0] },
        { plannedPattern: [4, 4, 3, 4, 3, 1, 0], completedPattern: [4, 4, 3, 3, 3, 1, 0] },
      ],
    }),
    buildShowcaseCycle({
      id: 'legacy-c6',
      name: 'Dominio do Mobile',
      startDate: '2025-03-31',
      score: 77,
      focusArena: 'Produto',
      signatureAction: 'Passada de interface',
      plannedMetas: 7,
      sealedMetas: 6,
      identitySnapshot: identityB,
      actionIcon: '📱',
      weeks: [
        { plannedPattern: [4, 3, 3, 3, 3, 1, 0], completedPattern: [4, 3, 3, 2, 3, 1, 0] },
        { plannedPattern: [4, 4, 3, 3, 4, 1, 0], completedPattern: [4, 4, 3, 3, 3, 1, 0] },
      ],
    }),
  ];

  const eraThreeCycles = [
    buildShowcaseCycle({
      id: 'legacy-c7',
      name: 'Expansao do Trono',
      startDate: '2025-05-05',
      score: 91,
      focusArena: 'Coroa',
      signatureAction: 'Leitura de comando',
      plannedMetas: 9,
      sealedMetas: 8,
      identitySnapshot: identityA,
      actionIcon: '👑',
      weeks: [
        { plannedPattern: [4, 4, 4, 3, 4, 2, 0], completedPattern: [4, 4, 4, 3, 4, 1, 0] },
        { plannedPattern: [4, 4, 4, 4, 4, 2, 0], completedPattern: [4, 4, 4, 4, 3, 1, 0] },
      ],
    }),
    buildShowcaseCycle({
      id: 'legacy-c8',
      name: 'Mar de Vidro',
      startDate: '2025-05-19',
      score: 95,
      focusArena: 'Soberania',
      signatureAction: 'Revisao de legado',
      plannedMetas: 10,
      sealedMetas: 9,
      identitySnapshot: identityC,
      actionIcon: '🌊',
      weeks: [
        { plannedPattern: [4, 4, 4, 4, 4, 1, 0], completedPattern: [4, 4, 4, 4, 3, 1, 0] },
        { plannedPattern: [4, 4, 4, 4, 4, 2, 0], completedPattern: [4, 4, 4, 4, 4, 1, 0] },
      ],
    }),
    buildShowcaseCycle({
      id: 'legacy-c9',
      name: 'Registro de Soberania',
      startDate: '2025-06-02',
      score: 99,
      focusArena: 'Legado',
      signatureAction: 'Selar a placa',
      plannedMetas: 10,
      sealedMetas: 10,
      identitySnapshot: identityA,
      actionIcon: '🏛️',
      weeks: [
        { plannedPattern: [4, 4, 4, 4, 4, 2, 0], completedPattern: [4, 4, 4, 4, 4, 2, 0] },
        { plannedPattern: [4, 4, 4, 4, 4, 2, 0], completedPattern: [4, 4, 4, 4, 4, 1, 0] },
      ],
    }),
  ];

  return [
    {
      key: 'era-aurora',
      label: 'Era da Aurora',
      defaultLabel: 'Era 1',
      skinId: '1',
      description: 'Fase de fundacao em que o ritmo aparece, a saude ancora a disciplina e o sistema deixa de ser promessa para virar pratica.',
      finalSummary: 'A Aurora provou tracao: o ritual matinal e os blocos de foco amarraram saude, trabalho e estudo numa mesma cadencia.',
      aiSummary: 'Primeiro bloco historico com sinais claros de consistencia e adesao ao loop.',
      cycles: eraOneCycles,
      startDate: '2025-01-06',
      endDate: '2025-02-16',
      avgScore: 72,
      totalExp: 1420,
      totalHours: 126,
      totalMetas: 15,
      cycleCount: eraOneCycles.length,
      dominantArena: 'Trabalho',
      topActions: [
        { name: 'Bloco de foco 90m', count: 19 },
        { name: 'Treino de alvorada', count: 17 },
        { name: 'Leitura tática', count: 15 },
      ],
      bestStreak: 12,
      grade: 'C',
      color: '#EAB308',
    },
    {
      key: 'era-cerco',
      label: 'Era do Cerco',
      defaultLabel: 'Era 2',
      skinId: '2',
      description: 'O sistema entra em guerra de verdade: planner, mentoria e produto comecam a andar juntos e o app vira campo de comando.',
      finalSummary: 'No Cerco, o Glyph ganha forma de operacao. O comando passa a sustentar mentorias, refinamento visual e leitura de valor.',
      aiSummary: 'Fase de consolidacao, com score alto e progresso mais denso em produto.',
      cycles: eraTwoCycles,
      startDate: '2025-03-03',
      endDate: '2025-04-13',
      avgScore: 75,
      totalExp: 1880,
      totalHours: 154,
      totalMetas: 23,
      cycleCount: eraTwoCycles.length,
      dominantArena: 'Produto',
      topActions: [
        { name: 'Janela de comando', count: 21 },
        { name: 'Sessao de pupilo', count: 18 },
        { name: 'Passada de interface', count: 16 },
      ],
      bestStreak: 16,
      grade: 'B',
      color: '#60A5FA',
    },
    {
      key: 'era-trono',
      label: 'Era do Trono',
      defaultLabel: 'Era 3',
      skinId: '3',
      description: 'A fase mais cinematografica: o legado deixa de ser apenas historico e vira objeto de exibicao, memoria e prova de sistema vivo.',
      finalSummary: 'O Trono fecha a narrativa: comando, legado e identidade se condensam em uma leitura premium pronta para vitrine.',
      aiSummary: 'Momento de maturidade alta, com leitura clara de valor e simbolo.',
      cycles: eraThreeCycles,
      startDate: '2025-05-05',
      endDate: '2025-06-15',
      avgScore: 95,
      totalExp: 2440,
      totalHours: 181,
      totalMetas: 29,
      cycleCount: eraThreeCycles.length,
      dominantArena: 'Legado',
      topActions: [
        { name: 'Leitura de comando', count: 22 },
        { name: 'Revisao de legado', count: 20 },
        { name: 'Selar a placa', count: 18 },
      ],
      bestStreak: 21,
      grade: 'S+',
      color: '#34D399',
    },
  ];
})();

const CYCLE_REPORT_SHOWCASE_CHEST: ChestType = 'Raro';

const CYCLE_REPORT_SHOWCASE: Report = (() => {
  const cycleId = 'gm-showcase-cycle-s';
  const startDate = '2026-02-03';
  const endDate = '2026-03-16';
  const plannedEndDate = '2026-03-23';
  const identitySnapshot = GM_SHOWCASE_IDENTITY;
  const weeklyAtlas = [
    buildShowcaseWeek({
      cycleId,
      weekIndex: 1,
      startDate,
      arenaId: 'produto-arena',
      arenaName: 'Produto',
      actionName: 'Janela de comando',
      actionIcon: 'FX',
      plannedPattern: [4, 4, 3, 3, 3, 2, 0],
      completedPattern: [4, 4, 3, 3, 2, 2, 0],
    }),
    buildShowcaseWeek({
      cycleId,
      weekIndex: 2,
      startDate: addDaysIso(startDate, 7),
      arenaId: 'produto-arena',
      arenaName: 'Produto',
      actionName: 'Passada de interface',
      actionIcon: 'UI',
      plannedPattern: [4, 4, 4, 3, 3, 2, 0],
      completedPattern: [4, 4, 4, 3, 3, 1, 0],
    }),
    buildShowcaseWeek({
      cycleId,
      weekIndex: 3,
      startDate: addDaysIso(startDate, 14),
      arenaId: 'mentoria-arena',
      arenaName: 'Mentoria',
      actionName: 'Rito de pupilo',
      actionIcon: 'MN',
      plannedPattern: [4, 3, 4, 3, 3, 2, 0],
      completedPattern: [4, 3, 4, 3, 2, 2, 0],
    }),
    buildShowcaseWeek({
      cycleId,
      weekIndex: 4,
      startDate: addDaysIso(startDate, 21),
      arenaId: 'saude-arena',
      arenaName: 'Saude',
      actionName: 'Treino de alvorada',
      actionIcon: 'HP',
      plannedPattern: [3, 4, 3, 3, 4, 2, 0],
      completedPattern: [3, 4, 3, 3, 3, 2, 0],
    }),
    buildShowcaseWeek({
      cycleId,
      weekIndex: 5,
      startDate: addDaysIso(startDate, 28),
      arenaId: 'legado-arena',
      arenaName: 'Legado',
      actionName: 'Revisao de legado',
      actionIcon: 'LG',
      plannedPattern: [4, 4, 4, 4, 3, 2, 0],
      completedPattern: [4, 4, 4, 3, 3, 2, 0],
    }),
    buildShowcaseWeek({
      cycleId,
      weekIndex: 6,
      startDate: addDaysIso(startDate, 35),
      arenaId: 'produto-arena',
      arenaName: 'Produto',
      actionName: 'Fecho de release',
      actionIcon: 'RL',
      plannedPattern: [4, 4, 4, 3, 4, 2, 0],
      completedPattern: [4, 4, 3, 3, 4, 1, 0],
    }),
  ];

  const allDays = weeklyAtlas.flatMap((week) => week.days);
  const plannedCount = weeklyAtlas.reduce((sum, week) => sum + week.plannedCount, 0);
  const completedCount = weeklyAtlas.reduce((sum, week) => sum + week.completedCount, 0);
  const completedMinutes = weeklyAtlas.reduce((sum, week) => sum + week.completedMinutes, 0);
  const consistencyDays = allDays.filter((day) => day.completedCount > 0).length;
  const bestDay = allDays.reduce(
    (best, day) => (day.completedCount > best.completedCount ? { date: day.date, completedCount: day.completedCount } : best),
    { date: startDate, completedCount: 0 },
  );

  const actionCounts = new Map<string, number>();
  const arenaCounts = new Map<string, { arenaId: string; total: number }>();

  allDays.forEach((day) => {
    day.arenaBuckets.forEach((bucket) => {
      const existing = arenaCounts.get(bucket.arenaName);
      arenaCounts.set(bucket.arenaName, {
        arenaId: bucket.arenaId,
        total: (existing?.total || 0) + bucket.total,
      });
    });

    [...day.scheduledItems, ...day.unscheduledItems].forEach((item) => {
      actionCounts.set(item.actionName, (actionCounts.get(item.actionName) || 0) + 1);
    });
  });

  const top3Actions = [...actionCounts.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  const topArenaEntry = [...arenaCounts.entries()]
    .sort((a, b) => (b[1].total - a[1].total) || a[0].localeCompare(b[0]))[0];

  const totalHours = Math.round((completedMinutes / 60) * 10) / 10;
  const avgHoursPerDay = Math.round(((completedMinutes / 60) / Math.max(allDays.length, 1)) * 10) / 10;
  const executionRatePct = Math.round((completedCount / Math.max(plannedCount, 1)) * 100);
  const timeElapsedPct = 85;
  const paceDeltaPct = executionRatePct - timeElapsedPct;

  return {
    id: 'report-showcase-note-s',
    cycleId,
    cycleName: 'Cerco de Jade',
    startDate,
    endDate,
    performanceScore: 93,
    metrics: {
      actionsCompleted: completedCount,
      totalPlannedActions: plannedCount,
      arenasInvolved: new Set(weeklyAtlas.map((week) => week.dominantArenaName)).size,
      goalsMet: 9,
      plannedMetas: 10,
      sealedMetas: 9,
      totalHours,
      questsCompleted: 5,
      consistencyDays,
      expGained: 2860,
      plannedEndDate,
      avgHoursPerDay,
      maxStreak: 18,
      bestDay: bestDay.date,
      bestDayCount: bestDay.completedCount,
      daysWithoutCompletion: Math.max(allDays.length - consistencyDays, 0),
      executionRatePct,
      timeElapsedPct,
      paceDeltaPct,
      top3Actions,
      weeklyAtlas,
      scoreModelVersion: 'fair_v2_1',
      fairness: {
        planLoadUnits: plannedCount,
        honoredLoadUnits: completedCount,
        planHonorRate: 0.94,
        plannedMetas: 10,
        sealedMetas: 9,
        metaSealRate: 0.9,
        baselineLoadUnits: 84,
        baselineActiveDays: 27,
        activeDays: consistencyDays,
        personalCadenceRate: 0.86,
        planLoadRatio: 0.88,
        planRealismPts: 10,
        selfGrowthRate: 0.27,
        ascensionPts: 5,
        frictionRate: 0.07,
        focusRatio: 0.79,
        measurementStatus: 'scored',
        historyConfidence: 'stable',
        scoreBreakdown: {
          honorPts: 39,
          metaPts: 24,
          cadencePts: 15,
          realismPts: 10,
          ascensionPts: 5,
        },
        legacyPerformanceScore: 91,
        grade: 'S',
      },
    },
    highlight: {
      mostFocusedArena: topArenaEntry?.[0] || 'Produto',
      mostFocusedArenaId: topArenaEntry?.[1].arenaId || 'produto-arena',
      mostRepeatedAction: top3Actions[0]?.name || 'Janela de comando',
      mostRepeatedActionCount: top3Actions[0]?.count || 0,
    },
    clanPoints: 540,
    expGained: 2860,
    identitySnapshot,
    assetProgress: [
      { asset: 'Produto', value: 94 },
      { asset: 'Mentoria', value: 88 },
      { asset: 'Saude', value: 82 },
      { asset: 'Planejamento', value: 90 },
      { asset: 'Legado', value: 91 },
    ],
  };
})();

const GM_PREMIUM_ACTIVE_BENEFITS = [
  'Até 15 arenas ativas',
  'Fundos premium de perfil',
  'Todos os tons de fala do Oráculo',
  'Cena do legado com 50% off',
  'Bônus de legado +5% XP',
];

const GM_PLATINUM_ACTIVE_BENEFITS = [
  'Todas as vantagens do Premium, com o dobro do bônus de XP (+10%)',
  'Até 30 arenas ativas',
  '1 cena de legado grátis por ativação',
  'Todos os planos de fundo',
  'Todas as aparências premium',
  '1 baú raro + 1 baú lendário por ativação',
];

const buildMembershipRewardMockPayload = (tier: 'premium' | 'platinum'): RewardModalPayload => {
  const isPlatinum = tier === 'platinum';

  return {
    eyebrow: isPlatinum ? 'Renovação platinum' : 'Renovação premium',
    title: isPlatinum ? 'Platinum ativo' : 'Premium ativo',
    summary: isPlatinum
      ? 'Preview do GM para validar a ativação do plano maior, com as entregas da rodada e as vantagens ativas do Platinum.'
      : 'Preview do GM para validar a ativação do Premium, com as entregas da rodada e as vantagens ativas do plano.',
    buttonLabel: 'Fechar preview',
    metricCards: [
      { label: 'Plano', value: isPlatinum ? 'Platinum' : 'Premium', detail: '30 dias ativos' },
      { label: 'Ativo até', value: isPlatinum ? '02 mai' : '02 mai', detail: 'validade atual' },
      {
        label: 'Entrega',
        value: isPlatinum ? 'Temporada + raro' : 'Baú raro',
        detail: isPlatinum ? 'rodada do Platinum' : 'rodada do Premium',
      },
    ],
    rewardHighlightsTitle: 'Entregue agora',
        rewardHighlights: isPlatinum
      ? [
          {
            label: 'Baús',
            value: 'Temporada + raro',
            detail: 'Os dois baús da ativação do Platinum.',
            tone: 'gold',
          },
          {
            label: 'Legado',
            value: '1 grátis',
            detail: 'Crédito aplicado para a próxima cena do legado.',
            tone: 'violet',
          },
          {
            label: 'Quiz',
            value: '1 ficha média',
            detail: 'Use no próximo quiz para liberar uma campanha média.',
            tone: 'cyan',
          },
        ]
      : [
          {
            label: 'Baú',
            value: 'Raro',
            detail: 'Entrega real da ativação do Premium.',
            tone: 'gold',
          },
          {
            label: 'Quiz',
            value: '1 ficha grátis',
            detail: 'Use no próximo quiz para liberar uma campanha grátis.',
            tone: 'cyan',
          },
          {
            label: 'Arsenal',
            value: '2 itens',
            detail: 'Genesis e cosméticos da Temporada quando faltarem.',
            tone: 'emerald',
          },
        ],
    itemSectionTitle: 'Cosméticos integrados',
    itemIds: isPlatinum ? [] : ['item_border_genesis_01', 'item_banner_origin_01'],
    emptyMessage: isPlatinum
      ? 'Nenhum cosmético novo precisava cair agora, mas os baús, o crédito de legado e a ficha da rodada já foram aplicados.'
      : 'Nenhum cosmético novo precisava cair agora, mas o baú raro e a ficha da rodada já foram aplicados.',
    activeBenefitsTitle: 'Vantagens ativas',
    activeBenefits: isPlatinum ? GM_PLATINUM_ACTIVE_BENEFITS : GM_PREMIUM_ACTIVE_BENEFITS,
    campaignQuizFreeCreditsGranted: isPlatinum ? 0 : 1,
    campaignQuizMediumCreditsGranted: isPlatinum ? 1 : 0,
  };
};

const MembershipRewardPreviewButton: React.FC<{ tier: 'premium' | 'platinum' }> = ({ tier }) => {
  const [open, setOpen] = useState(false);
  const payload = useMemo(() => buildMembershipRewardMockPayload(tier), [tier]);
  const accentClass = tier === 'platinum'
    ? 'border-violet-500/30 bg-violet-500/20 text-violet-200 hover:bg-violet-500/30'
    : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] ${accentClass}`}
      >
        <Gift className="h-4 w-4" />
        {tier === 'platinum' ? 'Preview Platinum' : 'Preview Premium'}
      </button>

      <RewardPackModal
        open={open}
        payload={payload}
        onClose={() => setOpen(false)}
        fallbackEyebrow="Renovação premium"
        fallbackTitle="Recompensas do plano"
        fallbackSummary="Preview do GM."
        fallbackButtonLabel="Fechar preview"
        fallbackItemSectionTitle="Cosméticos integrados"
        fallbackEmptyMessage="Nenhum cosmético novo precisava ser entregue agora."
      />
    </>
  );
};

const LegacyPreviewButton: React.FC = () => {
    const { showToast } = useGame();
    const [showPreview, setShowPreview] = useState(false);

    const mockEras: LegacyRenderEraSummary[] = LEGACY_SHOWCASE_ERAS; /*
        {
            key: 'era-1',
            label: 'Era da Descoberta',
            startDate: '2025-01-01',
            endDate: '2025-02-15',
            avgScore: 82,
            color: '#4ade80',
            skinId: '1',
            description: 'O início da jornada, focada em estabelecer bases sólidas.',
            cycles: [
                { id: 'c1', name: 'Alinhamento Inicial', score: 75, startDate: '2025-01-01', endDate: '2025-01-07', focusArena: 'Saúde', signatureAction: 'Treino matinal' },
                { id: 'c2', name: 'Exploração de Rotina', score: 88, startDate: '2025-01-08', endDate: '2025-01-14', focusArena: 'Trabalho', signatureAction: 'Deep work 4h' },
            ]
        },
        {
            key: 'era-2',
            label: 'Era da Expansão',
            startDate: '2025-02-16',
            endDate: '2025-04-01',
            avgScore: 91,
            color: '#60a5fa',
            skinId: '2',
            description: 'Crescimento acelerado e conquista de novos territórios de produtividade.',
            cycles: [
                { id: 'c3', name: 'Domínio Técnico', score: 94, startDate: '2025-02-16', endDate: '2025-02-22', focusArena: 'Estudos', signatureAction: 'Leitura técnica' },
                { id: 'c4', name: 'Escalada de Performance', score: 89, startDate: '2025-02-23', endDate: '2025-03-01', focusArena: 'Finanças', signatureAction: 'Aporte mensal' },
            ]
        }
    ]; */

    return (
        <>
            <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/20 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-300 transition-all hover:bg-cyan-500/30 hover:scale-[1.02]"
            >
                <Zap className="h-4 w-4" />
                Gerar Cena Teste GM
            </button>

            {showPreview && (
                <LegacyProjectionModal
                    eras={mockEras}
                    sovereignName={GM_SHOWCASE_SOVEREIGN_NAME}
                    isPremium={true}
                    showLayoutEditors
                    fallbackIdentity={GM_SHOWCASE_IDENTITY}
                    sceneGoldCost={null}
                    sceneButtonLabel="Abrir cena teste"
                    confirmKickerLabel="Laboratorio GM"
                    confirmTitle="Abrir cena teste do legado?"
                    confirmDescription="Isso abre a cena curada do GM com 3 eras e 9 ciclos de exemplo, sem cobrar ouro."
                    confirmButtonLabel="Abrir cena teste"
                    onClose={() => setShowPreview(false)}
                    onToast={(msg) => showToast(msg)}
                />
            )}
        </>
    );
};

const CycleReportPreviewButton: React.FC = () => {
    const { showToast } = useGame();
    const [showPreview, setShowPreview] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-300 transition-all hover:bg-emerald-500/30 hover:scale-[1.02]"
            >
                <CalendarDays className="h-4 w-4" />
                Visualizar Relatorio Nota S
            </button>

            {showPreview && (
                <ReportResultCarousel
                    report={CYCLE_REPORT_SHOWCASE}
                    chest={CYCLE_REPORT_SHOWCASE_CHEST}
                    expGained={CYCLE_REPORT_SHOWCASE.expGained}
                    autoPlay={false}
                    onOk={() => setShowPreview(false)}
                    onCompare={() => showToast('Preview de vitrine: comparacao desativada.', 'info')}
                    onShare={() => showToast('Navegue ate o resumo para exportar o card do mock.', 'info')}
                    onPostToFeed={() => showToast('Preview de vitrine: postagem desativada.', 'info')}
                />
            )}
        </>
    );
};

type NotificationLabType = 'system' | 'oracle_card';

const GM_NOTIFICATION_TEST_CONTENT: Record<NotificationLabType, string> = {
    system: 'TESTE GM: Aviso de sistema entregue em Avisos. Este item deve aparecer imediatamente na aba de notificacoes.',
    oracle_card: 'TESTE GM: Card do Oraculo entregue em Avisos. O icone do Oraculo deve destacar ate voce abrir a aba.',
};

const NOTIFICATION_LAB_DEBUG_PREFIX = '[GM Notification Lab]';

const pushNotificationLabDebug = (entry: Record<string, unknown>) => {
    try {
        const nextEntry = {
            at: new Date().toISOString(),
            ...entry,
        };
        const buffer = Array.isArray((window as any).__glyphNotificationLabLogs)
            ? (window as any).__glyphNotificationLabLogs
            : [];
        buffer.push(nextEntry);
        (window as any).__glyphNotificationLabLogs = buffer.slice(-80);
    } catch {}
};

const logNotificationLabStep = (scope: string, step: string, details?: Record<string, unknown>) => {
    const payload = {
        scope,
        step,
        ...(details || {}),
    };
    console.log(`${NOTIFICATION_LAB_DEBUG_PREFIX} ${scope} :: ${step}`, payload);
    pushNotificationLabDebug(payload);
};

const logNotificationLabError = (scope: string, step: string, error: unknown, details?: Record<string, unknown>) => {
    const payload = {
        scope,
        step,
        errorMessage: error instanceof Error ? error.message : String(error),
        error,
        ...(details || {}),
    };
    console.error(`${NOTIFICATION_LAB_DEBUG_PREFIX} ${scope} :: ${step}`, payload);
    pushNotificationLabDebug(payload);
};

const openOracleNotificationsLab = () => {
    logNotificationLabStep('openOracleNotificationsLab', 'schedule-dispatch');
    window.setTimeout(() => {
        logNotificationLabStep('openOracleNotificationsLab', 'dispatch');
        window.dispatchEvent(new CustomEvent('openOracleNotifications'));
    }, 80);
};

const insertNotificationLabRecord = async (
    userId: string,
    type: NotificationType,
    content: string,
    metadata: Record<string, unknown> = {},
) => {
    logNotificationLabStep('insertNotificationLabRecord', 'start', {
        userId,
        type,
        content,
        metadata,
    });

    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            type,
            content,
            read: false,
            metadata,
            created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

    if (error) {
        logNotificationLabError('insertNotificationLabRecord', 'supabase-error', error, {
            userId,
            type,
            content,
            metadata,
        });
        throw new Error(error.message || error.code || 'NOTIFICATION_INSERT_FAILED');
    }

    logNotificationLabStep('insertNotificationLabRecord', 'success', {
        userId,
        type,
        notificationId: data?.id || null,
    });
    return data;
};

const NotificationTypeButton: React.FC<{ type: NotificationLabType; label: string; color: string }> = ({ type, label, color }) => {
    const { session, fetchNotifications, showToast } = useGame();
    const [isPending, setIsPending] = useState(false);

    const colors: Record<string, string> = {
        blue: 'border-blue-500/30 bg-blue-500/20 text-blue-300 hover:bg-blue-500/40',
        purple: 'border-purple-500/30 bg-purple-500/20 text-purple-300 hover:bg-purple-400/30',
    };

    const handleTest = async () => {
        if (!session?.user.id) {
            logNotificationLabStep(label, 'blocked-no-session');
            return;
        }
        if (isPending) {
            logNotificationLabStep(label, 'blocked-pending');
            return;
        }

        logNotificationLabStep(label, 'click', {
            sessionUserId: session.user.id,
            requestedType: type,
        });
        setIsPending(true);

        try {
            const notificationType: NotificationType = type === 'oracle_card' ? 'oracle_prompt' : 'system';
            const metadata: Record<string, unknown> = {
                source: 'gm_panel',
                trigger: type,
                label,
                test: true,
            };

            if (type === 'oracle_card') {
                metadata.emphasis = 'oracle_card';
            }

            logNotificationLabStep(label, 'payload-ready', {
                sessionUserId: session.user.id,
                notificationType,
                metadata,
                content: GM_NOTIFICATION_TEST_CONTENT[type],
            });

            await insertNotificationLabRecord(
                session.user.id,
                notificationType,
                GM_NOTIFICATION_TEST_CONTENT[type],
                metadata,
            );

            logNotificationLabStep(label, 'insert-finished');
            await fetchNotifications();
            logNotificationLabStep(label, 'fetchNotifications-finished');
            openOracleNotificationsLab();
            logNotificationLabStep(label, 'oracle-open-requested');

            showToast(
                type === 'oracle_card'
                    ? 'Card do Oraculo criado em Avisos.'
                    : 'Notificacao de sistema criada em Avisos.',
                'success',
            );
            logNotificationLabStep(label, 'toast-success');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'PROCESSING_ERROR';
            logNotificationLabError(label, 'failed', err, {
                sessionUserId: session?.user.id || null,
            });
            showToast(`Erro no teste "${label}": ${message}`, 'error');
        } finally {
            logNotificationLabStep(label, 'finish');
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleTest}
            disabled={isPending}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-50 ${colors[color]}`}
        >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            {label}
        </button>
    );
};

const NotificationTestButton: React.FC = () => {
    const { session, fetchNotifications, showToast } = useGame();
    const [isPending, setIsPending] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [remoteReady, setRemoteReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const ready = await hasAppPushRemoteDeliveryReady();
            if (!cancelled) {
                setRemoteReady(ready);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleTest = async () => {
        if (!session?.user.id) {
            logNotificationLabStep('Sistema + Push (15s)', 'blocked-no-session');
            return;
        }
        if (isPending) {
            logNotificationLabStep('Sistema + Push (15s)', 'blocked-pending');
            return;
        }

        logNotificationLabStep('Sistema + Push (15s)', 'click', {
            sessionUserId: session.user.id,
        });
        setIsPending(true);
        setTimeLeft(15);

        const timer = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        let notificationPermission: Awaited<ReturnType<typeof requestLocalNotificationPermission>> = 'default';
        let nativePushScheduled = false;
        const remoteDeliveryReady = await hasAppPushRemoteDeliveryReady();
        setRemoteReady(remoteDeliveryReady);

        if (!remoteDeliveryReady) {
            notificationPermission = await requestLocalNotificationPermission();
            logNotificationLabStep('Sistema + Push (15s)', 'push-permission-result', {
                permission: notificationPermission,
                nativeRuntime: isCapacitorNativeRuntime(),
                remoteDeliveryReady,
            });

            if (notificationPermission === 'granted' && isCapacitorNativeRuntime()) {
                nativePushScheduled = await scheduleLocalNotification({
                    title: 'TESTE GM - Sistema',
                    body: 'O push local nativo respondeu ao disparo de 15 segundos.',
                    tag: 'gm-panel-push-test',
                    url: '/',
                    requireInteraction: true,
                }, 15000);
                logNotificationLabStep('Sistema + Push (15s)', 'native-push-scheduled', {
                    nativePushScheduled,
                });
            }
        } else {
            logNotificationLabStep('Sistema + Push (15s)', 'remote-ready-skip-local', {
                remoteDeliveryReady,
            });
        }

        logNotificationLabStep('Sistema + Push (15s)', 'timer-scheduled', {
            seconds: 15,
            nativePushScheduled,
            remoteDeliveryReady,
        });

        window.setTimeout(async () => {
            try {
                logNotificationLabStep('Sistema + Push (15s)', 'delayed-trigger-fired');
                await insertNotificationLabRecord(
                    session.user.id,
                    'system',
                    'TESTE GM: Notificacao de sistema agendada para 15 segundos. Ela deve aparecer em Avisos e disparar o push configurado neste aparelho.',
                    {
                        source: 'gm_panel',
                        trigger: 'system_push_15s',
                        test: true,
                        delayed: true,
                        remoteDeliveryReady,
                    }
                );
                logNotificationLabStep('Sistema + Push (15s)', 'insert-finished');
                await fetchNotifications();
                logNotificationLabStep('Sistema + Push (15s)', 'fetchNotifications-finished');
                openOracleNotificationsLab();
                logNotificationLabStep('Sistema + Push (15s)', 'oracle-open-requested');

                let pushDelivered = nativePushScheduled;
                if (!remoteDeliveryReady && !nativePushScheduled && notificationPermission === 'granted') {
                    pushDelivered = await showLocalNotification({
                        title: 'TESTE GM - Sistema',
                        body: 'O push local respondeu ao disparo de 15 segundos.',
                        tag: 'gm-panel-push-test',
                        url: '/',
                        requireInteraction: true,
                    });
                    logNotificationLabStep('Sistema + Push (15s)', 'push-delivery-result', {
                        pushDelivered,
                    });
                }

                if (pushDelivered) {
                    showToast('Notificacao interna e push local entregues.', 'success');
                    logNotificationLabStep('Sistema + Push (15s)', 'toast-success-push');
                } else if (remoteDeliveryReady) {
                    showToast('Notificacao interna criada. Agora o teste depende do push remoto do aparelho.', 'info');
                    logNotificationLabStep('Sistema + Push (15s)', 'toast-info-remote');
                } else if (notificationPermission === 'denied') {
                    showToast('Notificacao interna entregue, mas o aparelho bloqueou o push local.', 'warning');
                    logNotificationLabStep('Sistema + Push (15s)', 'toast-warning-denied');
                } else {
                    showToast('Notificacao interna entregue. O push local nao apareceu neste aparelho.', 'warning');
                    logNotificationLabStep('Sistema + Push (15s)', 'toast-warning-no-push');
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'PROCESSING_ERROR';
                logNotificationLabError('Sistema + Push (15s)', 'failed', err, {
                    sessionUserId: session?.user.id || null,
                });
                showToast(`Erro ao enviar notificacao de teste: ${message}`, 'error');
            } finally {
                window.clearInterval(timer);
                logNotificationLabStep('Sistema + Push (15s)', 'finish');
                setIsPending(false);
            }
        }, 15000);
    };

    return (
        <button
            onClick={handleTest}
            disabled={isPending}
            className={`flex items-center gap-2 rounded-xl border px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all ${
                isPending
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 cursor-wait'
                    : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:scale-[1.02]'
            }`}
        >
            {isPending ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Agendado ({timeLeft}s)
                </>
                ) : (
                    <>
                        <Bell className="h-4 w-4" />
                    {remoteReady ? 'Sistema Remoto (15s)' : 'Sistema + Push (15s)'}
                    </>
                )}
        </button>
    );
};

export const SovereignPanelView: React.FC = () => {
  const { userProfile, isProfileLoaded } = useGame();
  const isStaff = isProfileLoaded && (userProfile.role === 'admin' || userProfile.role === 'gm');
  const [rows, setRows] = useState<Marco1BetaScoreboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<Marco1BetaScoreboardRow | null>(null);

  if (!isStaff) {
    return null;
  }

  useEffect(() => {
    let isMounted = true;

    const fetchScoreboard = async () => {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from('marco1_beta_scoreboard')
        .select('id, email, nickname, beta_tier, manual_stage, stage_suggested, activation_passed, d2_returned, cycle_closed, active_days_14d, invite_code, claimed_invite_code, created_at')
        .in('beta_tier', [...TRACKED_TIERS])
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (error) {
        setRows([]);
        setErrorMessage(error.message || 'Nao foi possivel carregar o painel do GM.');
        setLoading(false);
        return;
      }

      setRows((data || []) as Marco1BetaScoreboardRow[]);
      setLoading(false);
    };

    void fetchScoreboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalPopulation = rows.length;
    const activatedCount = rows.filter((row) => row.activation_passed === true).length;
    const d2Count = rows.filter((row) => row.d2_returned === true).length;
    const cycleClosedCount = rows.filter((row) => row.cycle_closed === true).length;

    const activationPct = totalPopulation > 0 ? (activatedCount / totalPopulation) * 100 : 0;
    const d2Pct = totalPopulation > 0 ? (d2Count / totalPopulation) * 100 : 0;
    const cycleClosedPct = totalPopulation > 0 ? (cycleClosedCount / totalPopulation) * 100 : 0;

    const tierCounts = {
      ouro: rows.filter((row) => row.beta_tier === 'ouro').length,
      prata: rows.filter((row) => row.beta_tier === 'prata').length,
      bronze: rows.filter((row) => row.beta_tier === 'bronze').length,
    };

    return {
      totalPopulation,
      activatedCount,
      d2Count,
      cycleClosedCount,
      activationPct,
      d2Pct,
      cycleClosedPct,
      tierCounts,
    };
  }, [rows]);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-300">
          Beta Test . T1
        </div>
        <h1 className="text-2xl font-black uppercase tracking-[0.14em] text-white md:text-3xl">
          Dashboard de Metricas
        </h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Leitura objetiva dos jogadores reais do beta. Ouro, prata e bronze entram aqui; GM e admin continuam fora.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <KpiSkeletonCard />
            <KpiSkeletonCard />
            <KpiSkeletonCard />
            <KpiSkeletonCard />
          </>
        ) : (
          <>
            <KpiCard
              icon={Users}
              title="Populacao"
              value={`${stats.totalPopulation} / ${KPI_GOALS.population}`}
              helper="base acompanhada no trimestre"
              target={`${KPI_GOALS.population}`}
              progressPct={Math.min(100, (stats.totalPopulation / KPI_GOALS.population) * 100)}
              tone={getProgressTone(Math.min(100, (stats.totalPopulation / KPI_GOALS.population) * 100), 100)}
            />
            <KpiCard
              icon={Zap}
              title="Ativacao"
              value={formatPercent(stats.activationPct)}
              helper={`${stats.activatedCount} de ${stats.totalPopulation} ativaram o loop`}
              target={`${KPI_GOALS.activationPct}%`}
              progressPct={stats.activationPct}
              tone={getProgressTone(stats.activationPct, KPI_GOALS.activationPct)}
            />
            <KpiCard
              icon={RotateCcw}
              title="Retorno D2"
              value={formatPercent(stats.d2Pct)}
              helper={`${stats.d2Count} de ${stats.totalPopulation} voltaram no dia 2`}
              target={`${KPI_GOALS.d2Pct}%`}
              progressPct={stats.d2Pct}
              tone={getProgressTone(stats.d2Pct, KPI_GOALS.d2Pct)}
            />
            <KpiCard
              icon={Flag}
              title="Ciclo Fechado"
              value={formatPercent(stats.cycleClosedPct)}
              helper={`${stats.cycleClosedCount} de ${stats.totalPopulation} fecharam 1 ciclo`}
              target={`${KPI_GOALS.cyclePct}%`}
              progressPct={stats.cycleClosedPct}
              tone={getProgressTone(stats.cycleClosedPct, KPI_GOALS.cyclePct)}
            />
          </>
        )}
      </section>

      <section>
        <GlassCard variant="neutral" className="p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Composicao da base</p>
              <h2 className="text-lg font-black text-white">Quem esta dentro do radar</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRACKED_TIERS.map((tier) => (
                <span key={tier} className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getTierClassName(tier)}`}>
                  {tier} . {stats.tierCounts[tier]}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>
      </section>

      <section>
        <GlassCard variant="neutral" className="overflow-hidden p-0">
          <div className="flex flex-col gap-2 border-b border-white/6 px-4 py-4 md:flex-row md:items-end md:justify-between md:px-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Leitura individual</p>
              <h2 className="text-lg font-black text-white">Jogadores acompanhados</h2>
            </div>
            <p className="text-xs text-zinc-500">
              Toque numa linha para abrir o detalhe do jogador.
            </p>
          </div>

          {loading ? (
            <div className="overflow-x-auto">
              <TableSkeleton />
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/25 bg-rose-950/50 text-rose-300">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Falha ao carregar o dashboard</p>
                <p className="text-xs text-zinc-400">{errorMessage}</p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-semibold text-white">Nenhum jogador do beta apareceu ainda.</p>
              <p className="mt-1 text-xs text-zinc-400">Assim que os bilhetes comecarem a rodar, esta lista reflete o comportamento real.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full table-auto text-sm">
                <thead>
                  <tr className="border-b border-white/6 bg-white/[0.02] text-left text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    <th className="px-4 py-3 font-black md:px-6">Jogador</th>
                    <th className="px-4 py-3 font-black">Tier</th>
                    <th className="px-4 py-3 font-black">Etapa</th>
                    <th className="px-4 py-3 font-black text-center">Loop</th>
                    <th className="px-4 py-3 font-black text-center">D2</th>
                    <th className="px-4 py-3 font-black text-center">Ciclo</th>
                    <th className="px-4 py-3 font-black">Motor</th>
                    <th className="px-4 py-3 font-black text-right md:px-6">Abrir</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const displayName = getDisplayName(row);
                    const tier = row.beta_tier || 'sem-tier';
                    const stage = row.stage_suggested || row.manual_stage || 'candidate';
                    const activeDays = row.active_days_14d ?? 0;
                    const activeDaysPct = Math.min(100, (activeDays / 14) * 100);

                    return (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-b border-white/6 transition-colors hover:bg-white/[0.035] last:border-b-0"
                        onClick={() => setSelectedRow(row)}
                      >
                        <td className="px-4 py-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-transparent text-xs font-black uppercase tracking-[0.16em] text-zinc-200">
                              {getInitials(displayName)}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="truncate font-semibold text-white">{displayName}</p>
                              <p className="truncate text-xs text-zinc-500">{row.email || 'sem email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${getTierClassName(row.beta_tier)}`}>
                            {tier}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStageClassName(stage)}`}>
                            {formatStageLabel(stage)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <CheckCell value={row.activation_passed} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <CheckCell value={row.d2_returned} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <CheckCell value={row.cycle_closed} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-200">
                              <span>{activeDays}/14 dias</span>
                              <Activity className="h-3.5 w-3.5 text-zinc-500" />
                            </div>
                            <MetricBar valuePct={activeDaysPct} tone={getProgressTone(activeDaysPct, 45)} />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right md:px-6">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedRow(row);
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label={`Abrir detalhes de ${displayName}`}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </section>

      {false && (
        <>
          <section>
            <GlassCard variant="neutral" className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-500">Laborat??rio de Legado</p>
                  <h2 className="text-lg font-black text-white">Visualiza????o de Amostra</h2>
                  <p className="text-xs text-zinc-400">Abra uma proje????o premium de legado com 3 eras e 9 ciclos curados, ou um relat??rio de ciclo nota S pronto para print.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <LegacyPreviewButton />
                  <CycleReportPreviewButton />
                </div>
              </div>
            </GlassCard>
          </section>

          <section>
            <GlassCard variant="neutral" className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-yellow-400">Laborat??rio de Plano</p>
                  <h2 className="text-lg font-black text-white">Preview do modal de renova????o</h2>
                  <p className="text-xs text-zinc-400">Abra o mesmo modal usado no app para validar Premium e Platinum sem depender de compra real.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <MembershipRewardPreviewButton tier="premium" />
                  <MembershipRewardPreviewButton tier="platinum" />
                </div>
              </div>
            </GlassCard>
          </section>

          <section>
            <GlassCard variant="neutral" className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-500">Laboratorio de Notificacoes</p>
                  <h2 className="text-lg font-black text-white">Fabrica de Eventos</h2>
                  <p className="text-xs text-zinc-400">Tres testes objetivos: sistema, card do Oraculo e sistema com push local em 15 segundos.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <NotificationTypeButton type="system" label="Sistema Agora" color="blue" />
                  <NotificationTypeButton type="oracle_card" label="Card do Oraculo" color="purple" />
                  <NotificationTestButton />
                </div>
              </div>
            </GlassCard>
          </section>

        </>
      )}

      {selectedRow && <PlayerInsightModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
};

