

import React, { useState, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { XIcon, LightbulbIcon, EditIcon, CheckIcon, PlusIcon, ShareIcon } from './Icons';
import { ScheduledTask, Action, DailyCommitment } from '../types';
import { Portal } from './Portal';
import { handleShare } from './Share';

const parseDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

const buildCommitmentStats = (tasks: ScheduledTask[], dailyCommitment: DailyCommitment, isClanQuestActionId: (actionId: string) => boolean) => {
    const committedTasks = tasks.filter(t => dailyCommitment.taskIds.includes(t.id) && t.date === dailyCommitment.date && !isClanQuestActionId(t.actionId));
    const committedCounts = committedTasks.reduce((acc, task) => {
        acc[task.actionId] = (acc[task.actionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const completedCounts = tasks.reduce((acc, task) => {
        if (task.date !== dailyCommitment.date) return acc;
        if (!committedCounts[task.actionId]) return acc;
        if (isClanQuestActionId(task.actionId)) return acc;
        if (task.completed) acc[task.actionId] = (acc[task.actionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const remainingCompleted = { ...completedCounts };
    const tasksWithStatus = committedTasks.map(task => {
        const remaining = remainingCompleted[task.actionId] || 0;
        const isCompleted = remaining > 0;
        if (isCompleted) remainingCompleted[task.actionId] = remaining - 1;
        return { task, isCompleted };
    });
    const completedCount = tasksWithStatus.reduce((sum, item) => sum + (item.isCompleted ? 1 : 0), 0);
    return { committedTasks, tasksWithStatus, completedCount, totalCount: committedTasks.length };
};

// --- Sub Components ---

const CycleHeader: React.FC = () => {
    const { activeCycle, tasks, dailyCommitment } = useGame();
    if (!activeCycle) return null;

    const startDate = parseDate(activeCycle.startDate);
    const endDate = parseDate(activeCycle.endDate);
    const today = parseDate(dailyCommitment.date);
    const totalDays = Math.max(1, daysBetween(startDate, endDate) + 1);
    const daysElapsed = Math.max(0, daysBetween(startDate, today) + 1);

    return (
        <div className="text-center space-y-3 text-xs p-2 rounded-xl bg-black/20">
            <h3 className="font-bold">📅 {activeCycle.name} | Dia {daysElapsed}/{totalDays}</h3>
        </div>
    );
};

const BattleTaskItem: React.FC<{ task: ScheduledTask, action: Action | undefined, onUncommit: (taskId: string) => void, isAdjusting: boolean, isCompleted: boolean }> = ({ task, action, onUncommit, isAdjusting, isCompleted }) => {
    const { getActionBackgroundStyle } = useGame();
    if (!action) return null;

    const backgroundStyle = getActionBackgroundStyle(action.id);

    return (
        <div 
            className="relative p-2 flex items-center space-x-3 rounded-xl text-left overflow-hidden transition-all text-white"
            style={backgroundStyle}
        >
             <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isCompleted ? 'opacity-100' : 'opacity-0'}`}></div>
             <div className={`absolute inset-0 border-2 rounded-xl transition-all ${isCompleted ? 'border-[var(--skin-accent-color)]' : 'border-dashed border-gray-600/50'}`}></div>

             <div className="text-xl z-10">{action.icon}</div>
             <div className={`text-sm font-semibold truncate w-full z-10 ${isCompleted ? 'line-through text-gray-400' : ''}`}>{action.name}</div>
             
             {isAdjusting && !task.completed && (
                <button onClick={() => onUncommit(task.id)} className="z-10 p-1">
                    <XIcon className="w-4 h-4 text-red-400"/>
                </button>
            )}
            {isCompleted && (
                <div className="z-10 p-1">
                     <CheckIcon className="w-5 h-5 accent-text" />
                </div>
            )}
        </div>
    );
};

// --- Main Modal ---

export const SitrepModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { activeCycle, dailyCommitment, taskPool, actions, tasks, scheduleTask, setDailyCommitment, lockDailyCommitment, endDailyBattle, resetDailyCommitment, returnTaskToPool, getArenas, checklistItems, showToast } = useGame();

    const [isAdjusting, setIsAdjusting] = useState(false);

    const isClanQuestActionId = (actionId: string) => {
        const action = actions.find(a => a.id === actionId);
        if (!action) return false;
        const arena = getArenas().find(ar => ar.id === action.arenaId);
        if (!arena?.name) return false;
        const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return normalized.includes('quests - cla');
    };

    const handleCommitAction = async (actionId: string) => {
        const today = new Date().toISOString().split('T')[0];
        const newTask = await scheduleTask(actionId, today, 0); // Schedule for today with no specific time
        if (newTask) {
            if (!isClanQuestActionId(actionId)) {
                setDailyCommitment([...dailyCommitment.taskIds, newTask.id]);
            }
        }
    };

    const handleUncommitTask = (taskId: string) => {
        returnTaskToPool(taskId);
        setDailyCommitment(dailyCommitment.taskIds.filter(id => id !== taskId));
    };

    const groupedTaskPool = useMemo(() => taskPool.filter(item => !isClanQuestActionId(item.actionId)).reduce((acc, item) => {
        acc[item.actionId] = (acc[item.actionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>), [taskPool, actions, getArenas]);
    
    const commitmentStats = useMemo(() => buildCommitmentStats(tasks, dailyCommitment, isClanQuestActionId), [tasks, dailyCommitment, actions, getArenas]);
    
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
                    {commitmentStats.committedTasks.map(task => {
                        const action = getActionById(task.actionId);
                        return (
                            <div key={task.id} className="w-full flex items-center justify-between text-left p-1.5 bg-black/20 rounded-lg">
                                <span className="text-sm">{action?.icon} {action?.name}</span>
                                <button onClick={() => handleUncommitTask(task.id)}><XIcon className="w-4 h-4 text-red-400"/></button>
                            </div>
                        );
                    })}
                    {commitmentStats.committedTasks.length === 0 && <p className="text-xs text-center text-gray-500 py-2">Selecione ações do estoque.</p>}
                </div>
            </div>

            <button disabled={commitmentStats.committedTasks.length === 0} onClick={lockDailyCommitment} className="w-full py-2 rounded-xl luxe-skin-button disabled:opacity-50">🔒 TRAVAR METAS DE HOJE</button>
        </>
    );

    const renderBattle = () => {
        const progress = commitmentStats.totalCount > 0 ? (commitmentStats.completedCount / commitmentStats.totalCount) * 100 : 0;
        const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase().replace('.', '');

        return (
            <>
                <div className="flex items-center justify-center text-[12px] uppercase tracking-[0.28em] text-gray-300 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <span>Hoje {todayStr}</span>
                </div>
                <CycleHeader />
                <div className='text-center'>
                    <div className="w-full bg-black/30 rounded-full h-1.5 mt-1"><div className="bg-[var(--skin-accent-color)] h-full rounded-full" style={{ width: `${progress}%` }}></div></div>
                    <p className="text-xs text-gray-400 mt-1">Progresso: {progress.toFixed(0)}% • {commitmentStats.completedCount}/{commitmentStats.totalCount} ações</p>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                     <h3 className="text-xs font-bold uppercase tracking-wider text-center mb-1">🎯 ALVOS TRAVADOS:</h3>
                    {commitmentStats.tasksWithStatus.map(({ task, isCompleted }) => {
                        const action = getActionById(task.actionId);
                        return (
                             <BattleTaskItem 
                                key={task.id}
                                task={task}
                                action={action}
                                onUncommit={handleUncommitTask}
                                isAdjusting={isAdjusting}
                                isCompleted={isCompleted}
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

                <button onClick={endDailyBattle} className="w-full py-2 rounded-xl luxe-skin-button">⚡ GERAR SCORE FINAL</button>
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
                        <p className="text-8xl font-black accent-text">{score}</p>
                        <p className="text-sm text-gray-300">"{verdict}"</p>
                        <div className="pt-3">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400">Exp depositada no ciclo</p>
                            <p className="text-xl font-black accent-text">{expDeposited}</p>
                            {sitrepBonus > 0 && <p className="text-[10px] text-gray-500">Bônus SITREP: +{sitrepBonus}</p>}
                        </div>
                        
                        <div className="pt-4 flex items-center justify-center space-x-2 text-gray-400">
                            <CheckIcon className={`w-5 h-5 ${checklistItems.every(i => i.completed) && checklistItems.length > 0 ? 'accent-text' : ''}`} />
                            <span className="text-sm uppercase tracking-wider">Checklist: {checklistItems.filter(i => i.completed).length}/{checklistItems.length}</span>
                        </div>
                    </div>
                </div>
                 <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => {
                            if (expDeposited > 0) showToast(`✦ +${expDeposited} XP foram adicionados ao seu ciclo`);
                            onClose();
                        }} 
                        className="w-full py-2 rounded-xl luxe-button-secondary text-sm"
                    >
                        🛌 DESCANSAR
                    </button>
                    <button onClick={() => handleShare('sitrep-capture-area')} className="p-3 rounded-xl luxe-button-secondary">
                        <ShareIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => {
                            if (expDeposited > 0) showToast(`✦ +${expDeposited} XP foram adicionados ao seu ciclo`);
                            resetDailyCommitment();
                        }} 
                        className="w-full py-2 rounded-xl luxe-skin-button text-sm"
                    >
                        🌙 PLANEJAR
                    </button>
                </div>
            </>
        )
    }

    const renderNoCycle = () => {
        const today = new Date().toISOString().split('T')[0];
        const todaysTasks = tasks.filter(t => t.date === today && !isClanQuestActionId(t.actionId));
        const completedTasks = todaysTasks.filter(t => t.completed);
        
        const checklistCompleted = checklistItems.filter(i => i.completed).length;
        const checklistTotal = checklistItems.length;

        const expFromActions = completedTasks.reduce((sum, task) => {
            const action = getActionById(task.actionId);
            const duration = Number.isFinite(task.duration) ? task.duration : (action?.duration || 0);
            return sum + duration;
        }, 0);
        
        return (
            <div className="space-y-6 py-4">
                <div className="text-center space-y-2">
                    <p className="text-gray-400 uppercase tracking-widest text-xs">Status Atual</p>
                    <h3 className="text-xl font-bold text-white">Sem Ciclo Ativo</h3>
                    <p className="text-sm text-gray-500 px-4">
                        Você está operando em modo livre. Seu progresso não está sendo registrado para a história.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 px-2">
                    <div className="bg-black/20 p-3 rounded-xl text-center space-y-1">
                        <p className="text-xs text-gray-400 uppercase">Tarefas</p>
                        <p className="text-2xl font-black text-white">{completedTasks.length}/{todaysTasks.length}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl text-center space-y-1">
                        <p className="text-xs text-gray-400 uppercase">Checklist</p>
                        <p className="text-2xl font-black text-white">{checklistCompleted}/{checklistTotal}</p>
                    </div>
                </div>

                {expFromActions > 0 && (
                    <div className="bg-[var(--skin-accent-color)]/10 border border-[var(--skin-accent-color)]/20 p-4 rounded-xl mx-2 text-center">
                        <p className="text-[var(--skin-accent-color)] font-bold text-lg">+{expFromActions} XP Potencial</p>
                        <p className="text-xs text-[var(--skin-accent-color)]/70 mt-1">Inicie um ciclo para reivindicar sua evolução.</p>
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">Vá para a aba <span className="text-white font-bold">CICLOS</span> para iniciar sua jornada.</p>
                    </div>
                    <button onClick={onClose} className="w-full py-3 rounded-xl luxe-button-secondary text-sm font-bold">
                        CONTINUAR EM MODO ZEN
                    </button>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (!activeCycle) return renderNoCycle();
        switch (dailyCommitment.stage) {
            case 'planning': return renderPlanning();
            case 'battle': return renderBattle();
            case 'judgment': return renderJudgment();
            default: return null;
        }
    };
    
    const getLightbulbColor = () => {
        if (!dailyCommitment.isLocked) return 'accent-text';
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
                    <div className="relative flex items-center justify-center p-4 border-b border-white/10">
                        <div className="flex items-center space-x-2">
                            <LightbulbIcon className={`w-6 h-6 transition-colors duration-500 ${getLightbulbColor()}`} />
                            <h2 className="text-lg font-bold uppercase tracking-wider text-center">Plano Diário</h2>
                        </div>
                        <button onClick={onClose} className="absolute right-4 p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5"/></button>
                    </div>
                    {renderContent()}
                </GlassCard>
            </div>
        </Portal>
    );
};
