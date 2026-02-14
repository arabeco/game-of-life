

import React, { useState, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, LightbulbIcon, EditIcon, CheckIcon, PlusIcon, ShareIcon } from './Icons';
import { ScheduledTask, Action, DailyCommitment } from '../types';
import { handleShare } from './Share';

const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

// --- Sub Components ---

const CycleHeader: React.FC = () => {
    const { activeCycle, tasks } = useGame();
    if (!activeCycle) return null;

    const startDate = new Date(activeCycle.startDate);
    const endDate = new Date(activeCycle.endDate);
    const today = new Date();
    
    const totalDays = Math.max(1, daysBetween(startDate, endDate) + 1);
    const daysElapsed = Math.max(0, daysBetween(startDate, today) + 1);
    const timeProgress = Math.min(100, (daysElapsed / totalDays) * 100);

    const cycleTasks = tasks.filter(t => {
        const taskDate = new Date(t.date);
        return taskDate >= startDate && taskDate <= endDate;
    });
    const completedCycleTasks = cycleTasks.filter(t => t.completed).length;
    const conquestProgress = cycleTasks.length > 0 ? (completedCycleTasks / cycleTasks.length) * 100 : 0;
    
    const delta = conquestProgress - timeProgress;
    let rank: { label: string, color: string };
    if (delta > 5) rank = { label: 'A', color: 'text-green-400' };
    else if (delta > -5) rank = { label: 'B', color: 'text-yellow-400' };
    else if (delta > -15) rank = { label: 'C', color: 'text-orange-400' };
    else rank = { label: 'D', color: 'text-red-400' };

    return (
        <div className="text-center space-y-3 text-xs p-2 rounded-xl bg-black/20">
            <h3 className="font-bold">📅 {activeCycle.name} | Dia {daysElapsed}/{totalDays}</h3>
            <div className="space-y-2">
                <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400"><span>TEMPO</span><span>{timeProgress.toFixed(0)}%</span></div>
                    <div className="w-full bg-red-900/50 rounded-full h-2 border border-red-500/20 mt-1"><div className="bg-red-500 h-full rounded-full" style={{ width: `${timeProgress}%` }}></div></div>
                </div>
                <div>
                    <div className="flex justify-between text-xs font-bold text-gray-400"><span>AÇÃO</span><span>{conquestProgress.toFixed(0)}%</span></div>
                    <div className="w-full bg-green-900/50 rounded-full h-2 border border-green-500/20 mt-1"><div className="bg-green-500 h-full rounded-full" style={{ width: `${conquestProgress}%` }}></div></div>
                </div>
            </div>
             <div className='border-t border-white/10 pt-2'>
                 <p className={`text-2xl font-black ${rank.color}`}>{rank.label}</p>
                 <p className="text-[10px] font-bold text-gray-400 -mt-1">RANK ATUAL</p>
            </div>
        </div>
    );
};

const BattleTaskItem: React.FC<{ task: ScheduledTask, action: Action | undefined, onUncommit: (taskId: string) => void, isAdjusting: boolean }> = ({ task, action, onUncommit, isAdjusting }) => {
    const { getAssetForAction } = useGame();
    if (!action) return null;

    const asset = getAssetForAction(action.id);
    const backgroundStyle = { background: `var(--asset-grad-${asset?.id || 'default'})` };

    return (
        <div 
            className="relative p-2 flex items-center space-x-3 rounded-xl text-left overflow-hidden transition-all text-white"
            style={backgroundStyle}
        >
             <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${task.completed ? 'opacity-100' : 'opacity-0'}`}></div>
             <div className={`absolute inset-0 border-2 rounded-xl transition-all ${task.completed ? 'border-[var(--bronze)]' : 'border-dashed border-gray-600/50'}`}></div>

             <div className="text-xl z-10">{action.icon}</div>
             <div className={`text-sm font-semibold truncate w-full z-10 ${task.completed ? 'line-through text-gray-400' : ''}`}>{action.name}</div>
             
             {isAdjusting && !task.completed && (
                <button onClick={() => onUncommit(task.id)} className="z-10 p-1">
                    <XIcon className="w-4 h-4 text-red-400"/>
                </button>
            )}
            {task.completed && (
                <div className="z-10 p-1">
                     <CheckIcon className="w-5 h-5 text-[var(--gold)]" />
                </div>
            )}
        </div>
    );
};

// --- Main Modal ---

export const SitrepModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { activeCycle, dailyCommitment, taskPool, actions, tasks, scheduleTask, setDailyCommitment, lockDailyCommitment, endDailyBattle, resetDailyCommitment, returnTaskToPool } = useGame();

    const [isAdjusting, setIsAdjusting] = useState(false);

    const handleCommitAction = (actionId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const newTask = scheduleTask(actionId, today, 0); // Schedule for today with no specific time
        if (newTask) {
            setDailyCommitment([...dailyCommitment.taskIds, newTask.id]);
        }
    };

    const handleUncommitTask = (taskId: string) => {
        returnTaskToPool(taskId);
        setDailyCommitment(dailyCommitment.taskIds.filter(id => id !== taskId));
    };

    const groupedTaskPool = useMemo(() => taskPool.reduce((acc, item) => {
        acc[item.actionId] = (acc[item.actionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [taskPool]);
    
    const committedTasks = useMemo(() => dailyCommitment.taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as ScheduledTask[], [dailyCommitment.taskIds, tasks]);
    
    const getActionById = (id: string) => actions.find(a => a.id === id);

    const renderPlanning = () => (
         <>
            <CycleHeader />
            <p className="text-center text-sm text-gray-400">O que vamos fazer para virar esse jogo?</p>
            
            <div className="bg-black/20 p-2 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-center mb-2">🛒 ESTOQUE DO CICLO</h3>
                <div className="max-h-24 overflow-y-auto pr-1 space-y-1">
                    {Object.entries(groupedTaskPool).map(([actionId, count]) => {
                        const action = getActionById(actionId);
                        if (!action) return null;
                        return (
                             <button key={actionId} onClick={() => handleCommitAction(actionId)} className="w-full flex items-center justify-between text-left p-1.5 bg-black/20 rounded-lg hover:bg-black/40">
                                <span className="text-sm"><PlusIcon className="w-4 h-4 inline-block mr-2"/>{action.name}</span>
                                <span className="text-xs font-mono bg-gray-700 px-1.5 rounded">x{count}</span>
                            </button>
                        );
                    })}
                     {Object.keys(groupedTaskPool).length === 0 && <p className="text-xs text-center text-gray-500 py-2">Nenhuma ação recorrente no estoque.</p>}
                </div>
            </div>

            <div className="bg-black/20 p-2 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-center mb-2">Metas de Hoje</h3>
                <div className="max-h-24 overflow-y-auto pr-1 space-y-1">
                    {committedTasks.map(task => {
                        const action = getActionById(task.actionId);
                        return (
                            <div key={task.id} className="w-full flex items-center justify-between text-left p-1.5 bg-black/20 rounded-lg">
                                <span className="text-sm">{action?.icon} {action?.name}</span>
                                <button onClick={() => handleUncommitTask(task.id)}><XIcon className="w-4 h-4 text-red-400"/></button>
                            </div>
                        );
                    })}
                    {committedTasks.length === 0 && <p className="text-xs text-center text-gray-500 py-2">Selecione ações do estoque.</p>}
                </div>
            </div>

            <button disabled={committedTasks.length === 0} onClick={lockDailyCommitment} className="w-full py-2 rounded-xl luxe-gold-button disabled:opacity-50">🔒 TRAVAR METAS DE HOJE</button>
        </>
    );

    const renderBattle = () => {
        const completedCount = committedTasks.filter(t => t.completed).length;
        const totalCount = committedTasks.length;
        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '');

        return (
            <>
                <CycleHeader />
                <div className='text-center'>
                    <h3 className="font-bold text-lg">HOJE: {todayStr} - MODO BATALHA</h3>
                    <div className="w-full bg-black/30 rounded-full h-1.5 mt-1"><div className="bg-[var(--gold)] h-full rounded-full" style={{ width: `${progress}%` }}></div></div>
                    <p className="text-xs text-gray-400">Progresso: {progress.toFixed(0)}%</p>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                     <h3 className="text-xs font-bold uppercase tracking-wider text-center mb-1">🎯 ALVOS TRAVADOS:</h3>
                    {committedTasks.map(task => {
                        const action = getActionById(task.actionId);
                        return (
                             <BattleTaskItem 
                                key={task.id}
                                task={task}
                                action={action}
                                onUncommit={handleUncommitTask}
                                isAdjusting={isAdjusting}
                            />
                        );
                    })}
                </div>
                
                <p className="text-center text-xs text-gray-500 mt-2">
                    Complete as ações no Planner para atualizar seu progresso aqui.
                </p>

                <div className="text-center border-t border-white/10 pt-2">
                     <button onClick={() => setIsAdjusting(!isAdjusting)} className={`text-xs p-1 rounded-md ${isAdjusting ? 'text-white bg-red-800/50' : 'text-gray-400 hover:text-white'}`}>
                        <EditIcon className="w-3 h-3 inline-block mr-1"/> AJUSTE TÁTICO
                    </button>
                </div>

                <button onClick={endDailyBattle} className="w-full py-2 rounded-xl luxe-gold-button">⚡ GERAR SCORE FINAL</button>
            </>
        );
    }
    
    const renderJudgment = () => {
        const score = dailyCommitment.score || 0;
        const expDeposited = dailyCommitment.expDeposited ?? 0;
        const sitrepBonus = dailyCommitment.sitrepBonus ?? 0;
        let verdict = "Guerreiro. Mantenha a disciplina.";
        if (score === 100) verdict = "Soberano. A vitória foi absoluta.";
        else if (score < 50) verdict = "A Batalha foi dura. Recupere e avance.";

        return (
             <>
                <div id="sitrep-capture-area" className="space-y-4">
                    <CycleHeader />
                    <div className="text-center space-y-2 py-4">
                        <p className="text-sm uppercase text-gray-400">Score de Hoje</p>
                        <p className="text-8xl font-black text-[var(--gold)]">{score}</p>
                        <p className="text-sm text-gray-300">"{verdict}"</p>
                        <div className="pt-3">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400">Exp depositada no ciclo</p>
                            <p className="text-xl font-black text-[var(--gold)]">{expDeposited}</p>
                            {sitrepBonus > 0 && <p className="text-[10px] text-gray-500">Bônus SITREP: +{sitrepBonus}</p>}
                        </div>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary text-sm">🛌 DESCANSAR</button>
                    <button onClick={() => handleShare('sitrep-capture-area')} className="p-3 rounded-xl luxe-button-secondary">
                        <ShareIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={resetDailyCommitment} className="w-full py-2 rounded-xl luxe-button-primary text-sm">🌙 PLANEJAR</button>
                </div>
            </>
        )
    }

    const renderNoCycle = () => (
        <div className="text-center py-8">
            <p className="text-gray-400">Nenhum ciclo ativo.</p>
            <p className="text-sm text-gray-500 mt-2">Vá para a tela de Ciclos para iniciar uma nova campanha.</p>
        </div>
    );

    const renderContent = () => {
        if (!activeCycle) return renderNoCycle();
        switch (dailyCommitment.stage) {
            case 'planning': return renderPlanning();
            case 'battle': return renderBattle();
            case 'judgment': return renderJudgment();
            default: return null;
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <LightbulbIcon className="text-[var(--gold)]" />
                        <h2 className="text-lg font-bold uppercase tracking-wider">PAINEL DE COMBATE</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5"/></button>
                </div>
                {renderContent()}
            </GlassCard>
        </div>
    );
};
