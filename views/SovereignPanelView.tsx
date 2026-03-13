import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Flag, RotateCcw, Users, Zap, Minus, type LucideIcon } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { supabase } from '../supabaseClient';

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
  stage_suggested: Marco1Stage | null;
  activation_passed: boolean | null;
  d2_returned: boolean | null;
  cycle_closed: boolean | null;
  active_days_14d: number | null;
  created_at: string;
}

const REAL_WORLD_TIERS = ['prata', 'bronze'] as const;
const KPI_GOALS = {
  population: 45,
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

const getDisplayName = (row: Marco1BetaScoreboardRow) => {
  const nickname = row.nickname?.trim();
  if (nickname) return nickname;

  const emailPrefix = row.email?.split('@')[0]?.trim();
  if (emailPrefix) return emailPrefix;

  return 'Soberano sem nome';
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

const KpiCard: React.FC<{
  icon: LucideIcon;
  title: string;
  value: string;
  helper: string;
  target: string;
}> = ({ icon: Icon, title, value, helper, target }) => (
  <GlassCard variant="neutral" className="p-3 md:p-3.5">
    <div className="flex items-start justify-between gap-2.5">
      <div className="space-y-1.5">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">{title}</p>
        <div className="space-y-1">
          <p className="text-2xl font-black tracking-tight text-white md:text-[1.75rem]">{value}</p>
          <p className="truncate text-[11px] text-zinc-400">{helper}</p>
        </div>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300">
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="mt-3 border-t border-white/6 pt-2 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
      Meta: <span className="text-zinc-300">{target}</span>
    </div>
  </GlassCard>
);

const KpiSkeletonCard: React.FC = () => (
  <GlassCard variant="neutral" className="p-3 md:p-3.5 animate-pulse">
    <div className="flex items-start justify-between gap-2.5">
      <div className="space-y-2.5">
        <div className="h-2.5 w-28 rounded-full bg-white/8" />
        <div className="h-7 w-20 rounded-full bg-white/10" />
        <div className="h-2.5 w-24 rounded-full bg-white/8" />
      </div>
      <div className="h-9 w-9 rounded-xl border border-white/6 bg-white/5" />
    </div>
    <div className="mt-4 h-2.5 w-16 rounded-full bg-white/8" />
  </GlassCard>
);

const TableSkeleton: React.FC = () => (
  <div className="divide-y divide-white/6 animate-pulse">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="grid min-w-[820px] grid-cols-[2.4fr_1.2fr_0.9fr_0.9fr_1.1fr_0.8fr] items-center gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-white/8" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-28 rounded-full bg-white/10" />
            <div className="h-2.5 w-16 rounded-full bg-white/8" />
          </div>
        </div>
        <div className="h-8 w-24 rounded-full bg-white/8" />
        <div className="h-7 w-7 rounded-full bg-white/8" />
        <div className="h-7 w-7 rounded-full bg-white/8" />
        <div className="h-7 w-7 rounded-full bg-white/8" />
        <div className="h-3 w-10 rounded-full bg-white/8" />
      </div>
    ))}
  </div>
);

export const SovereignPanelView: React.FC = () => {
  const [rows, setRows] = useState<Marco1BetaScoreboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchScoreboard = async () => {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from('marco1_beta_scoreboard')
        .select('id, email, nickname, beta_tier, stage_suggested, activation_passed, d2_returned, cycle_closed, active_days_14d, created_at')
        .in('beta_tier', [...REAL_WORLD_TIERS])
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

  const totalPopulation = rows.length;
  const activatedCount = rows.filter((row) => row.activation_passed === true).length;
  const d2Count = rows.filter((row) => row.d2_returned === true).length;
  const cycleClosedCount = rows.filter((row) => row.cycle_closed === true).length;

  const activationPct = totalPopulation > 0 ? (activatedCount / totalPopulation) * 100 : 0;
  const d2Pct = totalPopulation > 0 ? (d2Count / totalPopulation) * 100 : 0;
  const cycleClosedPct = totalPopulation > 0 ? (cycleClosedCount / totalPopulation) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-950/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
          Trimestre 1 · Fundacao
        </div>
        <h1 className="text-2xl font-black uppercase tracking-[0.18em] text-white luxe-title-shadow md:text-3xl">
          Painel do GM
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-zinc-400">
          Leitura do mundo real. Usuarios <span className="font-semibold text-zinc-200">ouro</span> ficam totalmente fora deste painel.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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
              title="Populacao Prata/Bronze"
              value={`${totalPopulation} / ${KPI_GOALS.population}`}
              helper="Base real acompanhada no trimestre"
              target={`${KPI_GOALS.population}`}
            />
            <KpiCard
              icon={Zap}
              title="Ativacao"
              value={formatPercent(activationPct)}
              helper={`${activatedCount} de ${totalPopulation} ativaram o loop`}
              target={`${KPI_GOALS.activationPct}%`}
            />
            <KpiCard
              icon={RotateCcw}
              title="Retorno D2"
              value={formatPercent(d2Pct)}
              helper={`${d2Count} de ${totalPopulation} voltaram no dia 2`}
              target={`${KPI_GOALS.d2Pct}%`}
            />
            <KpiCard
              icon={Flag}
              title="Ciclos Fechados"
              value={formatPercent(cycleClosedPct)}
              helper={`${cycleClosedCount} de ${totalPopulation} fecharam 1 ciclo`}
              target={`${KPI_GOALS.cyclePct}%`}
            />
          </>
        )}
      </section>

      <section>
        <GlassCard variant="neutral" className="overflow-hidden p-0">
          <div className="flex flex-col gap-2 border-b border-white/6 px-4 py-4 md:flex-row md:items-end md:justify-between md:px-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">A lista real</p>
              <h2 className="text-lg font-black text-white">Prata e Bronze somente</h2>
            </div>
            <p className="text-xs text-zinc-500">
              Read-only. Sem modais, sem edicao, sem vies do grupo ouro.
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
                <p className="text-sm font-semibold text-white">Falha ao carregar o painel</p>
                <p className="text-xs text-zinc-400">{errorMessage}</p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <p className="text-sm font-semibold text-white">Nenhum usuario prata ou bronze encontrado.</p>
              <p className="mt-1 text-xs text-zinc-400">Assim que eles entrarem no Marco 1, esta lista passa a refletir o comportamento real.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full table-auto text-sm">
                <thead>
                  <tr className="border-b border-white/6 bg-white/[0.02] text-left text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    <th className="px-4 py-3 font-black md:px-6">Soberano</th>
                    <th className="px-4 py-3 font-black">Status</th>
                    <th className="px-4 py-3 font-black text-center">Ativou?</th>
                    <th className="px-4 py-3 font-black text-center">Voltou D2?</th>
                    <th className="px-4 py-3 font-black text-center">Fechou Ciclo?</th>
                    <th className="px-4 py-3 font-black text-center md:px-6">Motor</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const displayName = getDisplayName(row);
                    const displayTier = row.beta_tier || 'sem-tier';

                    return (
                      <tr key={row.id} className="border-b border-white/6 last:border-b-0">
                        <td className="px-4 py-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-transparent text-xs font-black uppercase tracking-[0.16em] text-zinc-200">
                              {getInitials(displayName)}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="truncate font-semibold text-white">{displayName}</p>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] ${getTierClassName(row.beta_tier)}`}>
                                  {displayTier}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStageClassName(row.stage_suggested)}`}>
                            {row.stage_suggested || 'candidate'}
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
                        <td className="px-4 py-4 text-center font-semibold text-zinc-200 md:px-6">
                          {row.active_days_14d ?? 0}
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
    </div>
  );
};


