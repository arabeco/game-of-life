import React, { useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { useGame } from '../contexts/GameContext';
import { Report } from '../types';
import { GlassCard } from './GlassCard';
import { formatDate, daysBetween } from '../views/ReportsView';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface CycleComparatorProps {
    currentCycleReport: Report;
    pastCycleReport: Report;
}

const calculateAnalysis = (report: Report, allTasks: any[], allActions: any[], allAssets: any[]) => {
    const startDate = new Date(report.startDate);
    const endDate = new Date(report.endDate);
    const durationDays = Math.max(1, daysBetween(startDate, endDate) + 1);

    const isClanQuestActionId = (actionId: string) => {
        const action = allActions.find(a => a.id === actionId);
        if (!action) return false;
        const arena = allAssets.flatMap(as => as.arenas).find(ar => ar.id === action.arenaId);
        if (!arena?.name) return false;
        const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return normalized.includes('quests - cla');
    };

    const xpGained = report.metrics.totalHours * 60;
    const xpPerDay = xpGained / durationDays;
    const actionsPerDay = report.metrics.actionsCompleted / durationDays;

    const totalActions = report.metrics.actionsCompleted;
    const assetDedication = allAssets.map(asset => {
        const progress = report.assetProgress.find(p => p.asset === asset.name);
        const value = totalActions > 0 && progress ? (progress.value / totalActions) * 100 : 0;
        return { asset: asset.name.toUpperCase().substring(0, 3), fullAsset: asset.name, value };
    });

    const tasksInCycle = allTasks.filter(t => {
        const taskDate = new Date(t.date);
        return taskDate >= startDate && taskDate <= endDate && !isClanQuestActionId(t.actionId);
    });

    const arenaMetrics = new Map<string, { planned: number; completed: number; completedMilestones: number; name: string; icon: string }>();

    tasksInCycle.forEach(task => {
        const action = allActions.find(a => a.id === task.actionId);
        if (!action) return;
        const arena = allAssets.flatMap(as => as.arenas).find(ar => ar.id === action.arenaId);
        if (!arena) return;

        if (!arenaMetrics.has(arena.id)) {
            arenaMetrics.set(arena.id, { planned: 0, completed: 0, completedMilestones: 0, name: arena.name, icon: arena.icon });
        }
        const metrics = arenaMetrics.get(arena.id)!;
        metrics.planned++;
        if (task.completed) {
            metrics.completed++;
            if (action.actionType === 'Marco') {
                metrics.completedMilestones++;
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

const ComparisonCard: React.FC<{ title: string; current: number; past: number; unit: string; format?: (n: number) => string; }> = ({ title, current, past, unit, format = n => n.toFixed(1) }) => {
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

const OverviewSlide: React.FC<{ analysis: any }> = ({ analysis }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs text-center">
            <div className="bg-blue-900/30 p-2 rounded-lg">
                <p className="font-bold">Ciclo Atual</p>
                <p>{formatDate(analysis.current.report.startDate)} - {formatDate(analysis.current.report.endDate)} ({analysis.current.durationDays} dias)</p>
            </div>
            <div className="bg-purple-900/30 p-2 rounded-lg">
                <p className="font-bold">Ciclo Anterior</p>
                <p>{formatDate(analysis.past.report.startDate)} - {formatDate(analysis.past.report.endDate)} ({analysis.past.durationDays} dias)</p>
            </div>
        </div>
        <div className="text-center text-xs text-yellow-400/80">Comparando períodos de durações diferentes. A eficiência é medida pela média diária.</div>
        <div className="space-y-3">
            <ComparisonCard title="XP Force (Produtividade)" current={analysis.current.xpPerDay} past={analysis.past.xpPerDay} unit="XP / DIA" format={n => n.toFixed(0)} />
            <ComparisonCard title="Volume de Ações" current={analysis.current.actionsPerDay} past={analysis.past.actionsPerDay} unit="AÇÕES / DIA" />
        </div>
    </div>
);

const AssetRadarSlide: React.FC<{ analysis: any }> = ({ analysis }) => {
    const radarData = analysis.current.assetDedication.map((d: any) => {
        const pastData = analysis.past.assetDedication.find((pd: any) => pd.fullAsset === d.fullAsset);
        return {
            asset: d.asset,
            current: d.value,
            past: pastData ? pastData.value : 0,
        };
    });
    return (
        <div className="h-full flex flex-col items-center">
            <h3 className="text-sm font-bold uppercase text-gray-400 text-center mb-2">Estabilidade da Forma (% Foco)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                    <PolarAngleAxis dataKey="asset" tick={{ fill: 'white', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 5']} tick={false} axisLine={false} />
                    <Radar name="Anterior" dataKey="past" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} strokeDasharray="3 3" />
                    <Radar name="Atual" dataKey="current" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.6} />
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                </RadarChart>
            </ResponsiveContainer>
            <p className="text-xs text-center text-gray-400 mt-2">Visualiza como a distribuição de seu foco entre os ativos mudou.</p>
        </div>
    );
};

const ArenaBattleSlide: React.FC<{ analysis: any }> = ({ analysis }) => {
    const allArenaIds = new Set([...analysis.current.arenaMetrics.keys(), ...analysis.past.arenaMetrics.keys()]);
    const arenas = Array.from(allArenaIds).map(id => {
        const current = analysis.current.arenaMetrics.get(id);
        const past = analysis.past.arenaMetrics.get(id);
        return { id, current, past, name: current?.name || past?.name, icon: current?.icon || past?.icon };
    });

    return (
        <div className="space-y-3">
             <h3 className="text-sm font-bold uppercase text-gray-400 text-center mb-2">Batalha das Arenas</h3>
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
                {arenas.map(arena => {
                    const currentActionsPerDay = arena.current ? arena.current.completed / analysis.current.durationDays : 0;
                    const pastActionsPerDay = arena.past ? arena.past.completed / analysis.past.durationDays : 0;
                    const change = pastActionsPerDay > 0 ? ((currentActionsPerDay - pastActionsPerDay) / pastActionsPerDay) * 100 : currentActionsPerDay > 0 ? 100 : 0;
                    
                    const currentCompletion = arena.current && arena.current.planned > 0 ? (arena.current.completed / arena.current.planned) * 100 : 0;
                    const pastCompletion = arena.past && arena.past.planned > 0 ? (arena.past.completed / arena.past.planned) * 100 : 0;

                    return (
                        <GlassCard key={arena.id} variant='neutral' className='p-2'>
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-sm">{arena.icon} {arena.name}</h4>
                                {!arena.past && <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 rounded">NOVA</span>}
                                {!arena.current && <span className="text-[10px] font-bold bg-gray-500/20 text-gray-400 px-1.5 rounded">INATIVA</span>}
                            </div>
                            <div className="text-xs mt-2 space-y-2">
                                <p><strong>Ações/dia:</strong> {currentActionsPerDay.toFixed(1)} vs {pastActionsPerDay.toFixed(1)} <span className={change > 0 ? 'text-green-400' : 'text-red-400'}>({change > 0 ? '+' : ''}{change.toFixed(0)}%)</span></p>
                                <p><strong>Taxa de Conclusão:</strong> {currentCompletion.toFixed(0)}% vs {pastCompletion.toFixed(0)}%</p>
                                { (arena.current?.completedMilestones || 0) > 0 && <p><strong>Marcos Concluídos:</strong> {arena.current?.completedMilestones}</p>}
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
    
    return (
        <div className="h-full overflow-y-auto p-2 space-y-4">
            {/* Header: Cycle Timeline Comparison */}
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

            {/* KPI Layer */}
            <div className="grid grid-cols-2 gap-2">
                <ComparisonCard title="XP Force / Dia" current={analysis.current.xpPerDay} past={analysis.past.xpPerDay} unit="XP" format={n => n.toFixed(0)} />
                <ComparisonCard title="Volume / Dia" current={analysis.current.actionsPerDay} past={analysis.past.actionsPerDay} unit="Ações" />
            </div>

            {/* Asset Radar Layer (The "Ghost" Comparison) */}
            <GlassCard variant="neutral" className="p-4">
                 <h3 className="text-xs font-bold uppercase text-center mb-4 text-gray-400 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--gold)]"></span> Estabilidade da Forma
                    <span className="w-2 h-2 rounded-full bg-[#8884d8] opacity-50 ml-2"></span>
                </h3>
                <div className="h-64 w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analysis.current.assetDedication.map((d: any) => {
                            const pastData = analysis.past.assetDedication.find((pd: any) => pd.fullAsset === d.fullAsset);
                            return {
                                asset: d.asset,
                                current: d.value,
                                past: pastData ? pastData.value : 0,
                            };
                        })}>
                            <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                            <PolarAngleAxis dataKey="asset" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 5']} tick={false} axisLine={false} />
                            <Radar name="Anterior" dataKey="past" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} strokeWidth={1} />
                            <Radar name="Atual" dataKey="current" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.4} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </GlassCard>

            {/* Arena Battle Layer */}
            <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-gray-500 ml-1">Batalha das Arenas</h3>
                <ArenaBattleSlide analysis={analysis} />
            </div>
        </div>
    );
};
