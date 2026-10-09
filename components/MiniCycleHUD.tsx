import React, { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { Cycle } from '../types';
import { buildCycleWidgetSnapshot } from '../utils/widgetSnapshots';
import { CycleSummaryCard } from './CycleSummaryCard';

interface MiniCycleHUDProps {
    cycle: Cycle;
}

export const MiniCycleHUD: React.FC<MiniCycleHUDProps> = ({ cycle }) => {
    const { tasks, assets, actions, dailyCommitment } = useGame();
    const arenas = useMemo(() => assets.flatMap(asset => asset.arenas), [assets]);
    const snapshot = useMemo(() => buildCycleWidgetSnapshot({
        cycle,
        tasks,
        actions,
        arenas,
        todayDate: dailyCommitment?.date,
    }), [actions, arenas, cycle, tasks, dailyCommitment?.date]);

    if (!snapshot) return null;
    
    return (
        <div className="flex justify-center">
            <CycleSummaryCard
                rank={snapshot.grade}
                cycleSummary={{
                    name: snapshot.name,
                    startDate: snapshot.startDate,
                    endDate: snapshot.endDate,
                    totalCompleted: snapshot.completedTaskCount,
                    totalPlanned: snapshot.totalTaskCount,
                    progress: Math.round(snapshot.taskProgressPercent),
                    elapsedDays: snapshot.elapsedDays,
                    timeProgress: Math.round(snapshot.timeProgressPercent),
                    statusLabel: snapshot.timingLabel,
                }}
                onOpenHistory={() => window.dispatchEvent(new CustomEvent('tutorialNavigate', {
                    detail: { view: 'arenas', showReports: true },
                }))}
            />
        </div>
    );
};
