import React, { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { Cycle } from '../types';
import { buildCycleWidgetSnapshot } from '../utils/widgetSnapshots';
import { formatDate } from '../utils/dateUtils';

interface MiniCycleHUDProps {
    cycle: Cycle;
}

export const MiniCycleHUD: React.FC<MiniCycleHUDProps> = ({ cycle }) => {
    const { tasks, assets, actions } = useGame();
    const arenas = useMemo(() => assets.flatMap(asset => asset.arenas), [assets]);
    const snapshot = useMemo(() => buildCycleWidgetSnapshot({
        cycle,
        tasks,
        actions,
        arenas,
    }), [actions, arenas, cycle, tasks]);

    if (!snapshot) return null;
    
    return (
        <div className="px-4 py-1 bg-black/35 border-y border-white/5 backdrop-blur-md">
            <div className="mx-auto max-w-[300px] rounded-[14px] border border-white/10 bg-black/35 px-3 py-1 shadow-[0_12px_22px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] font-black uppercase tracking-[0.09em] text-white">{snapshot.name}</span>
                    <span className="shrink-0 text-[8px] font-black tracking-[0.02em] text-white/62">
                        {`${formatDate(snapshot.startDate)}-${formatDate(snapshot.endDate)} (${snapshot.totalDays} dias)`}
                    </span>
                </div>
                <div className="mt-1 space-y-0.5">
                    <div>
                        <div className="flex items-center justify-between gap-2 text-[7px] font-black uppercase tracking-[0.08em]">
                            <span className="text-white/58">Progresso</span>
                            <span className="shrink-0 text-[var(--skin-accent-color)]">{`${snapshot.completedTaskCount}/${snapshot.totalTaskCount} (${snapshot.taskProgressPercent.toFixed(0)}%)`}</span>
                        </div>
                        <div className="mt-0.5 h-[2px] w-full overflow-hidden rounded-full bg-black/45">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${snapshot.taskProgressPercent}%`,
                                    background: 'linear-gradient(90deg, #7a5813 0%, #d4af37 46%, #f6e2a3 100%)',
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between gap-2 text-[7px] font-black uppercase tracking-[0.08em]">
                            <span className="text-white/58">Tempo</span>
                            <span className="shrink-0 text-white/72">{`${snapshot.elapsedDays}/${snapshot.totalDays} (${snapshot.timeProgressPercent.toFixed(0)}%)`}</span>
                        </div>
                        <div className="mt-0.5 h-[2px] w-full overflow-hidden rounded-full bg-black/45">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${snapshot.timeProgressPercent}%`,
                                    background: 'linear-gradient(90deg, rgba(118,128,145,0.7) 0%, rgba(209,216,226,0.92) 54%, rgba(255,255,255,0.98) 100%)',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

