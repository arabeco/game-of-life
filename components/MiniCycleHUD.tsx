import React, { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { Cycle } from '../types';
import { buildCycleWidgetSnapshot } from '../utils/widgetSnapshots';

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
        <div className="px-4 py-2 bg-black/40 border-y border-white/5 backdrop-blur-md">
            <div className="max-w-[420px] mx-auto flex items-center justify-between gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Ciclo Ativo</span>
                    <span className="text-xs font-bold text-white truncate max-w-[120px]">{snapshot.name}</span>
                </div>
                
                <div className="flex-1 flex flex-col gap-1">
                    <div className="flex justify-between text-[9px] font-bold">
                        <span className="text-gray-400 uppercase">Progresso</span>
                        <span className="accent-text">{snapshot.taskProgressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden border border-white/5">
                        <div 
                            className="bg-[var(--skin-accent-color)] h-full transition-all duration-500" 
                            style={{ width: `${snapshot.taskProgressPercent}%` }}
                        />
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden border border-white/5 mt-0.5">
                        <div 
                            className="bg-blue-500 h-full transition-all duration-500 opacity-50" 
                            style={{ width: `${snapshot.timeProgressPercent}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Grau</span>
                        <span className={`text-xs font-black ${snapshot.gradeColorClass}`}>{snapshot.grade}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Score</span>
                        <span className="text-xs font-black accent-text">{snapshot.currentScore}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

