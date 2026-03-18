import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  Flag,
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
import { supabase } from '../supabaseClient';
import { SupabaseService } from '../services/SupabaseService';
import { useGame } from '../contexts/GameContext';

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

const LegacyPreviewButton: React.FC = () => {
    const { session, showToast } = useGame();
    const [showPreview, setShowPreview] = useState(false);

    const mockEras: any[] = [
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
    ];

    return (
        <>
            <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/20 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-300 transition-all hover:bg-cyan-500/30 hover:scale-[1.02]"
            >
                <Zap className="h-4 w-4" />
                Visualizar Legado (Exemplo)
            </button>

            {showPreview && (
                <LegacyProjectionModal
                    eras={mockEras}
                    sovereignName={session?.user?.email?.split('@')[0] || 'Soberano'}
                    isPremium={true}
                    onClose={() => setShowPreview(false)}
                    onToast={(msg) => showToast(msg)}
                />
            )}
        </>
    );
};

const NotificationTypeButton: React.FC<{ type: string; label: string; color: string }> = ({ type, label, color }) => {
    const { session, fetchNotifications, showToast } = useGame();
    const [isPending, setIsPending] = useState(false);

    const colors: Record<string, string> = {
        blue: 'border-blue-500/30 bg-blue-500/20 text-blue-300 hover:bg-blue-500/40',
        amber: 'border-amber-500/30 bg-amber-500/20 text-amber-300 hover:bg-amber-500/40',
        purple: 'border-purple-500/30 bg-purple-500/20 text-purple-300 hover:bg-purple-400/30',
    };

    const handleTest = async () => {
        if (!session?.user.id || isPending) return;
        setIsPending(true);

        let content = '';
        let metadata: Record<string, unknown> = {};

        if (type === 'welcome') {
            content = 'Bem-vindo ao Oráculo! Seu Starter Pack foi entregue. Explore as Arenas e o Planner para começar sua jornada.';
            metadata = {
                welcome: true,
                sendEmail: true,
                email: session.user.email ?? null,
                emailSubject: 'Glyph - Bem-vindo ao Oraculo',
            };
        } else if (type === 'oracle') {
            content = 'Insight do Oráculo: Sua consistência na Arena de Saúde aumentou +15% esta semana. Mantenha o ritmo!';
        } else if (type === 'insight') {
            content = 'O Oráculo detectou um padrão: você performa melhor em blocos de 90 min de foco profundo pela manhã.';
        }

        try {
            await SupabaseService.createNotification(session.user.id, 'system', content, metadata);
            await fetchNotifications();
            showToast(`Notificação "${label}" enviada!`, "success");
        } catch (err) {
            console.error("Erro ao enviar notificação:", err);
            showToast("Erro ao processar teste.", "error");
        } finally {
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

    const handleTest = async () => {
        if (!session?.user.id || isPending) return;

        setIsPending(true);
        setTimeLeft(15);

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        setTimeout(async () => {
            try {
                await SupabaseService.createNotification(
                    session.user.id,
                    'system',
                    'Teste de Push (15s): O sinal do Oráculo está operante. Esta é uma notificação de teste agendada pelo Painel Soberano.'
                );
                await fetchNotifications();
                showToast("Notificação de teste enviada com sucesso!", "success");
            } catch (err) {
                console.error("Erro ao enviar notificação de teste:", err);
                showToast("Erro ao enviar notificação de teste.", "error");
            } finally {
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
                    Testar Push (15s)
                </>
            )}
        </button>
    );
};

export const SovereignPanelView: React.FC = () => {
  const [rows, setRows] = useState<Marco1BetaScoreboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<Marco1BetaScoreboardRow | null>(null);

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
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-950/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
          Trimestre 1 . Fundacao
        </div>
        <h1 className="luxe-title-shadow text-2xl font-black uppercase tracking-[0.18em] text-white md:text-3xl">
          Dashboard de Metricas
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-zinc-400">
          Leitura de campo dos jogadores reais do beta. Ouro, prata e bronze entram aqui; GM e admin continuam fora.
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

      <section>
        <GlassCard variant="neutral" className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-500">Laboratório de Legado</p>
              <h2 className="text-lg font-black text-white">Visualização de Amostra</h2>
              <p className="text-xs text-zinc-400">Teste o fluxo do legado com 3 eras e 12 ciclos de exemplo.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LegacyPreviewButton />
            </div>
          </div>
        </GlassCard>
      </section>

      <section>
        <GlassCard variant="neutral" className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-500">Laboratório de Notificações</p>
              <h2 className="text-lg font-black text-white">Fábrica de Eventos</h2>
              <p className="text-xs text-zinc-400">Gere diferentes tipos de notificações para validar o comportamento do sistema.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <NotificationTypeButton type="welcome" label="Welcome (Email+Oracle)" color="blue" />
              <NotificationTypeButton type="oracle" label="Oracle (Nativo)" color="amber" />
              <NotificationTypeButton type="insight" label="Card do Oráculo" color="purple" />
              <NotificationTestButton />
            </div>
          </div>
        </GlassCard>
      </section>

      {selectedRow && <PlayerInsightModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
};
