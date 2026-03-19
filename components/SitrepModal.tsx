
import React, { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, LightbulbIcon } from './Icons';
import { ScheduledTask, DailyCommitment } from '../types';
import { Portal } from './Portal';
import { SitrepContent } from './SitrepContent';
import { taskMatchesOperationalDate } from '../utils/operationalDay.js';

const buildCommitmentStats = (tasks: ScheduledTask[], dailyCommitment: DailyCommitment, actions: { id: string; actionType?: string }[]) => {
    const actionTypeById = new Map(actions.map(action => [action.id, action.actionType]));
    const committedTasks = tasks.filter(t => dailyCommitment.taskIds.includes(t.id) && taskMatchesOperationalDate(t, dailyCommitment.date));

    const tasksWithStatus = committedTasks.map(task => {
        return {
            task,
            isCompleted: task.completed
        };
    });

    const scoredTasksWithStatus = tasksWithStatus.filter(({ task }) => actionTypeById.get(task.actionId) !== 'Livre');
    const completedCount = scoredTasksWithStatus.filter(t => t.isCompleted).length;

    return { committedTasks, tasksWithStatus, completedCount, totalCount: scoredTasksWithStatus.length };
};

export const SitrepModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { activeCycle, dailyCommitment, tasks, actions } = useGame();

    const commitmentStats = useMemo(() => buildCommitmentStats(tasks, dailyCommitment, actions), [tasks, dailyCommitment, actions]);

    const getLightbulbColor = () => {
        if (dailyCommitment.stage !== 'battle') return 'accent-text';
        if (commitmentStats.totalCount === 0) return 'accent-text';
        const ratio = commitmentStats.completedCount / commitmentStats.totalCount;
        if (ratio === 1) return 'text-green-400';
        if (ratio >= 0.5) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="dossier" className="w-full max-w-md m-4 rounded-3xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="relative flex items-center justify-center p-4 border-b border-white/10 shrink-0">
                        <div className="flex items-center space-x-2">
                            <LightbulbIcon className={`w-6 h-6 transition-colors duration-500 ${getLightbulbColor()}`} />
                            <h2 className="text-lg font-bold uppercase tracking-wider text-center">Painel Diário</h2>
                        </div>
                        <button onClick={onClose} className="absolute right-4 p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                        <SitrepContent onClose={onClose} />
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
