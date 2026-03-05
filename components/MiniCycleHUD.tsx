import React from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { parseDate, daysBetween, formatDate, getScoreGrade } from '../utils/dateUtils';
import { Cycle } from '../types';

interface MiniCycleHUDProps {
    cycle: Cycle;
}

export const MiniCycleHUD: React.FC<MiniCycleHUDProps> = ({ cycle }) => {
    const { tasks, assets, actions } = useGame();
    const startDate = cycle.startDate;
    const endDate = cycle.endDate;
    const today = new Date().toISOString().split('T')[0];

    const isQuestActionId = (actionId: string) => {
        const action = actions.find(a => a.id === actionId);
        if (!action) return false;
        const arena = assets.flatMap(asset => asset.arenas).find(ar => ar.id === action.arenaId);
        if (!arena?.name) return false;
        const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return normalized.includes('quests');
    };

    const isClanQuestActionId = (actionId: string) => {
        const action = actions.find(a => a.id === actionId);
        if (!action) return false;
        const arena = assets.flatMap(asset => asset.arenas).find(ar => ar.id === action.arenaId);
        if (!arena?.name) return false;
        const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return normalized.includes('quests - cla');
    };
    
    const startD = parseDate(startDate);
    const endD = parseDate(endDate);
    const todayD = parseDate(today);
    
    const totalDays = Math.max(1, daysBetween(startD, endD) + 1);
    const daysElapsed = Math.max(0, daysBetween(startD, todayD) + 1);
    const timeProgress = Math.min(100, (daysElapsed / totalDays) * 100);

    const cycleTasks = tasks.filter(t => t.date >= startDate && t.date <= endDate);
    const completedTasks = cycleTasks.filter(t => t.completed);

    const questTasks = cycleTasks.filter(t => isQuestActionId(t.actionId) || isClanQuestActionId(t.actionId));
    const completedQuests = questTasks.filter(t => t.completed);

    const cycleProgress = cycleTasks.length > 0 ? (completedTasks.length / cycleTasks.length) * 100 : 100;

    const milestonesCompleted = completedTasks.filter(t => {
        const action = actions.find(a => a.id === t.actionId);
        return action?.actionType === 'Marco';
    }).length;
    const milestoneBonus = milestonesCompleted * 10;

    const questsCompletedCount = completedQuests.length;
    const questBonus = questsCompletedCount * 5;

    const uniqueDays = new Set([...completedTasks, ...completedQuests].map(t => t.date)).size;
    const consistencyBonus = uniqueDays >= 4 ? 5 : 0;

    const totalFidelityBonus = (cycleTasks.length > 0 && completedTasks.length === cycleTasks.length) ? 5 : 0;

    const currentScore = Math.round(cycleProgress + milestoneBonus + questBonus + consistencyBonus + totalFidelityBonus);
    const scoreInfo = getScoreGrade(currentScore);
    
    return (
        <div className="px-4 py-2 bg-black/40 border-y border-white/5 backdrop-blur-md">
            <div className="max-w-[420px] mx-auto flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Ciclo Ativo</span>
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">{cycle.name}</span>
                </div>
                
                <div className="flex-1 flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-bold">
                        <span className="text-gray-400 uppercase">Progresso</span>
                        <span className="accent-text">{cycleProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden border border-white/5">
                        <div 
                            className="bg-[var(--skin-accent-color)] h-full transition-all duration-500" 
                            style={{ width: `${cycleProgress}%` }}
                        />
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden border border-white/5 mt-0.5">
                        <div 
                            className="bg-blue-500 h-full transition-all duration-500 opacity-50" 
                            style={{ width: `${timeProgress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Grau</span>
                        <span className="text-xs font-black" style={{ color: scoreInfo.color }}>{scoreInfo.grade}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Score</span>
                        <span className="text-xs font-black accent-text">{currentScore}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
