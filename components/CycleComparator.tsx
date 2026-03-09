import React, { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { Report } from '../types';
import { GlassCard } from './GlassCard';
import { formatDate, daysBetween, parseDate } from '../utils/dateUtils';
import { SvgRadarChart } from './SvgRadarChart';

interface CycleComparatorProps {
  currentCycleReport: Report;
  pastCycleReport: Report;
}

const calculateAnalysis = (report: Report, allTasks: any[], allActions: any[], allAssets: any[]) => {
  const startDate = parseDate(report.startDate);
  const endDate = parseDate(report.endDate);
  const durationDays = Math.max(1, daysBetween(startDate, endDate) + 1);

  const isClanQuestActionId = (actionId: string) => {
    const action = allActions.find((item) => item.id === actionId);
    if (!action) return false;
    const arena = allAssets.flatMap((asset: any) => asset.arenas).find((item: any) => item.id === action.arenaId);
    if (!arena?.name) return false;
    const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return normalized.includes('quests - cla');
  };

  const xpGained = report.metrics.totalHours * 60;
  const xpPerDay = xpGained / durationDays;
  const actionsPerDay = report.metrics.actionsCompleted / durationDays;

  const totalActions = report.metrics.actionsCompleted;
  const assetDedication = allAssets.map((asset: any) => {
    const progress = report.assetProgress.find((item) => item.asset === asset.name);
    const value = totalActions > 0 && progress ? (progress.value / totalActions) * 100 : 0;
    return { asset: asset.name.toUpperCase().substring(0, 3), fullAsset: asset.name, value };
  });

  const tasksInCycle = allTasks.filter((task: any) => {
    const taskDate = parseDate(task.date);
    return taskDate >= startDate && taskDate <= endDate && !isClanQuestActionId(task.actionId);
  });

  const arenaMetrics = new Map<string, { planned: number; completed: number; completedMilestones: number; name: string; icon: string }>();

  tasksInCycle.forEach((task: any) => {
    const action = allActions.find((item) => item.id === task.actionId);
    if (!action) return;
    const arena = allAssets.flatMap((asset: any) => asset.arenas).find((item: any) => item.id === action.arenaId);
    if (!arena) return;

    if (!arenaMetrics.has(arena.id)) {
      arenaMetrics.set(arena.id, { planned: 0, completed: 0, completedMilestones: 0, name: arena.name, icon: arena.icon });
    }
    const metrics = arenaMetrics.get(arena.id)!;
    metrics.planned += 1;
    if (task.completed) {
      metrics.completed += 1;
      if (action.actionType === 'Marco') {
        metrics.completedMilestones += 1;
      }
    }
  });

  return {
    report,
    durationDays,
    xpGained,
    xpPerDay,
    actionsPerDay,
    assetDedication,
    arenaMetrics,
  };
};

const ComparisonCard: React.FC<{ title: string; current: number; past: number; unit: string; format?: (n: number) => string }> = ({ title, current, past, unit, format = (n) => n.toFixed(1) }) => {
  const change = past > 0 ? ((current - past) / past) * 100 : current > 0 ? 100 : 0;
  const changeColor = change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400';
  const changeSign = change > 0 ? '▲' : change < 0 ? '▼' : '–';

  return (
    <GlassCard variant="neutral" className="p-3">
      <h3 className="text-xs font-bold uppercase text-gray-400">{title}</h3>
      <div className="grid grid-cols-2 gap-2 text-center mt-2">
        <div>
          <p className="text-2xl font-black text-[var(--gold)]">{format(current)}</p>
          <p className="text-[10px] text-gray-500">{unit}</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-500">{format(past)}</p>
          <p className="text-[10px] text-gray-500">Anterior</p>
        </div>
      </div>
      <p className={`text-center text-sm font-bold mt-2 ${changeColor}`}>{changeSign} {Math.abs(change).toFixed(0)}%</p>
    </GlassCard>
  );
};

const ArenaBattleSlide: React.FC<{ analysis: any }> = ({ analysis }) => {
  const allArenaIds = new Set([...analysis.current.arenaMetrics.keys(), ...analysis.past.arenaMetrics.keys()]);
  const arenas = Array.from(allArenaIds).map((id) => {
    const current = analysis.current.arenaMetrics.get(id);
    const past = analysis.past.arenaMetrics.get(id);
    return { id, current, past, name: current?.name || past?.name, icon: current?.icon || past?.icon };
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase text-gray-400 text-center mb-2">Batalha das Arenas</h3>
      <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
        {arenas.map((arena) => {
          const currentActionsPerDay = arena.current ? arena.current.completed / analysis.current.durationDays : 0;
          const pastActionsPerDay = arena.past ? arena.past.completed / analysis.past.durationDays : 0;
          const change = pastActionsPerDay > 0 ? ((currentActionsPerDay - pastActionsPerDay) / pastActionsPerDay) * 100 : currentActionsPerDay > 0 ? 100 : 0;

          const currentCompletion = arena.current && arena.current.planned > 0 ? (arena.current.completed / arena.current.planned) * 100 : 0;
          const pastCompletion = arena.past && arena.past.planned > 0 ? (arena.past.completed / arena.past.planned) * 100 : 0;

          return (
            <GlassCard key={arena.id} variant="neutral" className="p-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm">{arena.icon} {arena.name}</h4>
                {!arena.past && <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 rounded">NOVA</span>}
                {!arena.current && <span className="text-[10px] font-bold bg-gray-500/20 text-gray-400 px-1.5 rounded">INATIVA</span>}
              </div>
              <div className="text-xs mt-2 space-y-2">
                <p><strong>Acoes/dia:</strong> {currentActionsPerDay.toFixed(1)} vs {pastActionsPerDay.toFixed(1)} <span className={change > 0 ? 'text-green-400' : 'text-red-400'}>({change > 0 ? '+' : ''}{change.toFixed(0)}%)</span></p>
                <p><strong>Taxa de conclusao:</strong> {currentCompletion.toFixed(0)}% vs {pastCompletion.toFixed(0)}%</p>
                {(arena.current?.completedMilestones || 0) > 0 && <p><strong>Marcos concluidos:</strong> {arena.current?.completedMilestones}</p>}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

export const CycleComparator: React.FC<CycleComparatorProps> = ({ currentCycleReport, pastCycleReport }) => {
  const { tasks, actions, assets } = useGame();

  const analysis = useMemo(() => {
    const current = calculateAnalysis(currentCycleReport, tasks, actions, assets);
    const past = calculateAnalysis(pastCycleReport, tasks, actions, assets);
    return { current, past };
  }, [currentCycleReport, pastCycleReport, tasks, actions, assets]);

  const radarData = analysis.current.assetDedication.map((entry: any) => {
    const pastData = analysis.past.assetDedication.find((item: any) => item.fullAsset === entry.fullAsset);
    return {
      asset: entry.asset,
      current: entry.value,
      past: pastData ? pastData.value : 0,
    };
  });

  return (
    <div className="h-full overflow-y-auto p-2 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <GlassCard variant="gold" className="p-3 flex flex-col justify-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[var(--gold)] opacity-5 group-hover:opacity-10 transition-opacity"></div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] mb-1">Ciclo Atual</h3>
          <p className="text-sm font-bold">{formatDate(analysis.current.report.startDate)}</p>
          <p className="text-xs text-gray-400">a</p>
          <p className="text-sm font-bold">{formatDate(analysis.current.report.endDate)}</p>
          <div className="mt-2 text-xs bg-black/30 rounded-full py-1 px-2 mx-auto w-max border border-[var(--gold)]/30">
            {analysis.current.durationDays} dias
          </div>
        </GlassCard>
        <GlassCard variant="neutral" className="p-3 flex flex-col justify-center text-center relative overflow-hidden opacity-80">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Ciclo Anterior</h3>
          <p className="text-sm font-bold text-gray-300">{formatDate(analysis.past.report.startDate)}</p>
          <p className="text-xs text-gray-500">a</p>
          <p className="text-sm font-bold text-gray-300">{formatDate(analysis.past.report.endDate)}</p>
          <div className="mt-2 text-xs bg-black/30 rounded-full py-1 px-2 mx-auto w-max border border-white/10">
            {analysis.past.durationDays} dias
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ComparisonCard title="XP Force / Dia" current={analysis.current.xpPerDay} past={analysis.past.xpPerDay} unit="XP" format={(n) => n.toFixed(0)} />
        <ComparisonCard title="Volume / Dia" current={analysis.current.actionsPerDay} past={analysis.past.actionsPerDay} unit="Acoes" />
      </div>

      <GlassCard variant="neutral" className="p-4">
        <h3 className="text-xs font-bold uppercase text-center mb-4 text-gray-400 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--gold)]"></span> Estabilidade da Forma
          <span className="w-2 h-2 rounded-full bg-[#8884d8] opacity-50 ml-2"></span>
        </h3>
        <div className="h-64 w-full relative">
          <SvgRadarChart
            labels={radarData.map((item) => item.asset)}
            maxValue={100}
            levels={4}
            height="100%"
            labelColor="rgba(255,255,255,0.7)"
            labelSize={3.2}
            showLegend
            series={[
              {
                id: 'past-cycle',
                label: 'Anterior',
                values: radarData.map((item) => item.past),
                stroke: '#8884d8',
                fill: '#8884d8',
                fillOpacity: 0.1,
                strokeWidth: 0.9,
                dashed: true,
              },
              {
                id: 'current-cycle',
                label: 'Atual',
                values: radarData.map((item) => item.current),
                stroke: 'var(--gold)',
                fill: 'var(--gold)',
                fillOpacity: 0.4,
                strokeWidth: 1.4,
              },
            ]}
          />
        </div>
      </GlassCard>

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-gray-500 ml-1">Batalha das Arenas</h3>
        <ArenaBattleSlide analysis={analysis} />
      </div>
    </div>
  );
};
