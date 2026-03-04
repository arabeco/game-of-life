
import React, { useState, useMemo } from 'react';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { XIcon, EditIcon, CheckIcon, PlusIcon, ShareIcon } from './Icons';
import { ScheduledTask, Action, DailyCommitment } from '../types';
import { handleShare } from './Share';
import { resolveItemDef } from '../constants/items';
import { PoolAction } from './PoolAction';

const parseDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

const daysBetween = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

const buildCommitmentStats = (tasks: ScheduledTask[], dailyCommitment: DailyCommitment, isClanQuestActionId: (actionId: string) => boolean) => {
    const committedTasks = tasks.filter(t => dailyCommitment.taskIds.includes(t.id));

    const tasksWithStatus = committedTasks.map(task => {
        return {
            task,
            isCompleted: task.completed
        };
    });

    const completedCount = tasksWithStatus.filter(t => t.isCompleted).length;

    return { committedTasks, tasksWithStatus, completedCount, totalCount: committedTasks.length };
};

const CycleHeader: React.FC = () => {
    const { activeCycle, dailyCommitment } = useGame();
    if (!activeCycle) return null;

    const startDate = parseDate(activeCycle.startDate);
    const endDate = parseDate(activeCycle.endDate);
    const today = parseDate(dailyCommitment.date);
    const totalDays = Math.max(1, daysBetween(startDate, endDate) + 1);
    const daysElapsed = Math.max(0, daysBetween(startDate, today) + 1);

    return (
        <div className="text-center space-y-3 text-xs p-2 rounded-xl bg-black/20">
            <h3 className="arena-title-text text-[11px] text-white luxe-title-shadow leading-tight">📅 {activeCycle.name} | Dia {daysElapsed}/{totalDays}</h3>
        </div>
    );
};

const BattleTaskItem: React.FC<{
    task: ScheduledTask,
    action: Action | undefined,
    onUncommit: (taskId: string) => void,
    onQuickComplete: (actionId: string) => void,
    isAdjusting: boolean,
    isCompleted: boolean
}> = ({ task, action, onUncommit, onQuickComplete, isAdjusting, isCompleted }) => {
    const { getActionBackgroundStyle } = useGame();
    const [isHolding, setIsHolding] = useState(false);
    const pressTimer = React.useRef<NodeJS.Timeout | null>(null);

    if (!action) return null;

    const handlePressStart = () => {
        if (isAdjusting) return;

        setIsHolding(true);
        pressTimer.current = setTimeout(() => {
            onQuickComplete(action.id);
            setIsHolding(false);
            if (navigator.vibrate) navigator.vibrate(50);
        }, 800);
    };

    const handlePressEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
        setIsHolding(false);
    };

    const backgroundStyle = getActionBackgroundStyle(action.id);
    const isMilestone = action.actionType === 'Marco';

    return (
        <div
            className={`relative p-2 flex items-center space-x-3 rounded-xl text-left overflow-hidden transition-all text-white select-none ${isMilestone ? 'border-2 border-[var(--accent-bronze)] shadow-[0_0_10px_var(--accent-bronze-soft)]' : ''} ${isHolding ? 'scale-95 brightness-125' : ''}`}
            style={backgroundStyle}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
        >
            <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isCompleted ? 'opacity-80' : 'opacity-0'}`}></div>
            <div className={`absolute inset-0 rounded-xl transition-all ${isCompleted ? 'border-4 border-[var(--skin-accent-color)] shadow-[0_0_15px_var(--skin-accent-color)] opacity-80' : 'border-2 border-dashed border-gray-600/50'}`}></div>

            <div className="text-xl z-10">{action.icon}</div>
            <div className={`text-sm font-semibold truncate w-full z-10 ${isCompleted ? 'text-gray-300' : ''}`}>{action.name}</div>

            {isAdjusting && !isCompleted && (
                <button onClick={(e) => { e.stopPropagation(); onUncommit(task.id); }} className="z-10 p-1">
                    <XIcon className="w-4 h-4 text-red-400" />
                </button>
            )}
            {isCompleted && (
                <div className="z-10 p-1">
                    <CheckIcon className="w-5 h-5 accent-text drop-shadow-[0_0_5px_rgba(0,0,0,1)]" />
                </div>
            )}
        </div>
    );
};

export const SitrepContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { activeCycle, dailyCommitment, taskPool, actions, tasks, scheduleTask, scheduleAndCompleteNow, updateTask, toggleTaskCompletion, setDailyCommitment, lockDailyCommitment, unlockDailyCommitment, endDailyBattle, resetDailyCommitment, returnTaskToPool, getArenas, checklistItems, showToast } = useGame();

    const [isAdjusting, setIsAdjusting] = useState(false);

    const isClanQuestActionId = (actionId: string) => {
        const action = actions.find(a => a.id === actionId);
        if (!action) return false;
        const arena = getArenas().find(ar => ar.id === action.arenaId);
        if (!arena?.name) return false;
        const normalized = arena.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return normalized.includes('quests - cla');
    };

    const getActionById = (id: string) => actions.find(a => a.id === id);

    const commitmentStats = useMemo(() => buildCommitmentStats(tasks, dailyCommitment, isClanQuestActionId), [tasks, dailyCommitment, actions, getArenas]);

    // --- Lógica de Opções do SITREP baseada no taskPool (Alinhada com Planner/Bay Area) ---
    const groupedAvailableOptions = useMemo(() => {
        const today = dailyCommitment.date;

        // 1. Calcular Estoque Baseado nas Ações ATIVAS (Arena -> Ação) - Igual ao PlannerView
        const activeArenas = getArenas().filter(a => !a.isArchived);
        const activeArenaIds = new Set(activeArenas.map(a => a.id));
        const validActions = actions.filter(a => activeArenaIds.has(a.arenaId));

        const optionsById: Record<string, { count: number, action: any }> = {};

        validActions.forEach(action => {
            const maxRepetitions = Number.isFinite(action.repetitions) ? Math.max(1, Math.floor(action.repetitions)) : 1;
            const isUnlimited = !!action.unlimited;
            
            // Conta quantas vezes essa ação já aparece nas tarefas do dia (planejadas ou completadas)
            // Isso garante que o estoque diminua conforme elas entram no dia.
            // Tasks in Bay Area (startTime < 0) are considered "scheduled" for Sitrep logic?
            // User says: "ao devolver um ele nao atualiza a lista de disponiveis".
            // When we return to pool (via Uncommit), we set startTime = -1 (Bay Area).
            // Should this count as "scheduledToday"?
            // If it counts as scheduled, stock decreases.
            // If I uncommit from SITREP, it means I want to return it to stock to be picked again?
            // "ao devolver um ele nao atualiza a lista de disponiveis" -> implies stock should INCREASE.
            
            // Wait. If I uncommit in Sitrep (click X), 'handleUncommitTask' calls 'returnTaskToPool'.
            // 'returnTaskToPool' now sets startTime = -1 (Bay Area).
            // So the task STILL EXISTS in 'tasks' list for today.
            // So 'scheduledToday' count remains the same.
            // So 'remaining' stock remains the same (low).
            
            // This is the conflict.
            // If I uncommit in SITREP, I want to see it back in the SITREP STOCK list.
            // But 'returnTaskToPool' puts it in Bay Area (which is technically "scheduled" just without time).
            
            // If I uncommit from SITREP, I am removing it from 'dailyCommitment.taskIds'.
            // Does Sitrep Stock show items that are NOT in dailyCommitment?
            
            // Let's change the logic:
            // Stock = Max - (Tasks that are IN dailyCommitment OR Completed OR Scheduled with Time >= 0)
            // If a task is startTime=-1 AND NOT in dailyCommitment, it should be considered "Available Stock" (just pre-instantiated).
            
            const tasksForAction = tasks.filter(t => t.actionId === action.id && t.date === today);
            
            // We consume stock if:
            // 1. Task is completed
            // 2. Task has a valid time (>= 0)
            // 3. Task is in the current Daily Commitment (even if startTime is -1)
            
            const consumedCount = tasksForAction.filter(t => 
                t.completed || 
                t.startTime >= 0 || 
                dailyCommitment.taskIds.includes(t.id)
            ).length;
            
            const remaining = isUnlimited ? 99 : Math.max(0, maxRepetitions - consumedCount);
            
            // Só mostra se tiver estoque
            if (remaining > 0) {
                optionsById[action.id] = { count: remaining, action };
            }
        });

        // 3. SEM INFERÊNCIA DE NOME/ICONE PRA EVITAR ARENAS CLONADAS
        // Agrupamento visual se necessário, mas mantendo IDs únicos
        const grouped = Object.entries(optionsById).map(([id, data]) => ({
            count: data.count,
            action: data.action,
            ids: [id]
        }));

        return grouped;
    }, [actions, tasks, dailyCommitment, getArenas]);

    const handleCommitAction = async (actionId: string) => {
        const today = dailyCommitment.date;

        // Prioridade 1: Tarefa planejada NÃO completada que ainda não está no compromisso
        const pendingTask = tasks.find(t => t.actionId === actionId && t.date === today && !t.completed && !dailyCommitment.taskIds.includes(t.id));

        if (pendingTask) {
            setDailyCommitment([...dailyCommitment.taskIds, pendingTask.id]);
            return;
        }

        // Prioridade 2: Tarefa que JÁ FOI completada hoje (ex: via Planner ou Quick Complete anterior) mas não está no compromisso
        const completedTask = tasks.find(t => t.actionId === actionId && t.date === today && t.completed && !dailyCommitment.taskIds.includes(t.id));
        if (completedTask) {
            setDailyCommitment([...dailyCommitment.taskIds, completedTask.id]);
            return;
        }

        // Prioridade 3: Criar uma nova tarefa (padrão) - AGORA COM HORÁRIO -1 (Sem horário/Bay Area)
        // Isso faz com que ela apareça na Bay Area do Planner e não ocupe espaço na agenda até ser completada
        const newTask = await scheduleTask(actionId, today, -1);
        if (newTask) {
            setDailyCommitment([...dailyCommitment.taskIds, newTask.id]);
        }
    };

    const handleUncommitTask = (taskId: string) => {
        returnTaskToPool(taskId);
        setDailyCommitment(dailyCommitment.taskIds.filter(id => id !== taskId));
    };

    const handleQuickComplete = async (actionId: string) => {
        const today = dailyCommitment.date;

        const existingTask = tasks.find(t => t.actionId === actionId && t.date === today && !t.completed && dailyCommitment.taskIds.includes(t.id));
        const completedTask = tasks.find(t => t.actionId === actionId && t.date === today && t.completed && dailyCommitment.taskIds.includes(t.id));

        if (existingTask) {
            // toggleTaskCompletion agora cuida de mover para o horário atual (ativação) e persistir
            await toggleTaskCompletion(existingTask.id);
            showToast("Ação realizada!");
        } else if (completedTask) {
            await toggleTaskCompletion(completedTask.id);
            showToast("Ação desmarcada.");
        } else {
            // Se não estava no planejamento, o scheduleAndCompleteNow já bota no horário de "agora" e completa
            await scheduleAndCompleteNow(actionId);
            showToast("Ação realizada!");
        }
    };

    const handleGroupClick = (group: { ids: string[] }) => {
        if (group.ids.length > 0) {
            handleCommitAction(group.ids[0]);
        }
    };

    const renderPlanning = () => (
        <>
            <CycleHeader />

            <div className="bg-black/20 p-2 rounded-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-center mb-2">🛒 ESTOQUE DO CICLO</h3>
                <div className="max-h-24 overflow-y-auto pr-1 space-y-1">
                    {groupedAvailableOptions.map((group) => {
                        const isStockOut = group.count <= 0;
                        return (
                            <button
                                key={group.ids[0]}
                                onClick={() => handleGroupClick(group)}
                                disabled={isStockOut}
                                className={`w-full flex items-center justify-between text-left p-1.5 rounded-lg transition-colors ${isStockOut ? 'opacity-30 cursor-not-allowed bg-black/10' : 'bg-black/20 hover:bg-black/40'}`}
                            >
                                <span className={`text-sm ${isStockOut ? 'text-gray-500' : ''}`}><PlusIcon className="w-4 h-4 inline-block mr-2" />{group.action.name}</span>
                                <span className={`text-xs font-mono px-1.5 rounded ${isStockOut ? 'bg-gray-800 text-gray-600' : 'bg-gray-700 text-white'}`}>x{group.count}</span>
                            </button>
                        );
                    })}
                    {groupedAvailableOptions.length === 0 && <p className="text-xs text-center text-gray-500 py-2">Nada disponível para hoje.</p>}
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
                                <button onClick={() => handleUncommitTask(task.id)}><XIcon className="w-4 h-4 text-red-400" /></button>
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

        const [y, m, d] = dailyCommitment.date.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const monthNames = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
        const todayStr = `${d.toString().padStart(2, '0')} DE ${monthNames[m - 1]} DE ${y}`;

        const workTasks = commitmentStats.tasksWithStatus.filter(({ task }) => {
            const action = getActionById(task.actionId);
            return action?.name?.includes('[CLÃ]') || action?.name?.includes('[URGENTE]');
        });

        const workCompleted = workTasks.filter(t => t.isCompleted).length;
        const workTotal = workTasks.length;
        const productivityScore = workTotal > 0 ? (workCompleted / workTotal) * 100 : 0;

        return (
            <>
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={unlockDailyCommitment}
                        className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                        title="Voltar para Planejamento"
                    >
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center">
                        <div className="inline-block text-[10px] uppercase tracking-[0.2em] text-gray-400 bg-white/5 border border-white/5 rounded-lg px-2 py-1">
                            Hoje {todayStr}
                        </div>
                    </div>
                    <div className="w-9"></div> {/* Balanço para centralização */}
                </div>
                <CycleHeader />
                <div className='text-center'>
                    <div className="w-full bg-black/30 rounded-full h-1.5 mt-1"><div className="bg-[var(--skin-accent-color)] h-full rounded-full" style={{ width: `${progress}%` }}></div></div>
                    <p className="text-xs text-gray-400 mt-1">Progresso: {progress.toFixed(0)}% • {commitmentStats.completedCount}/{commitmentStats.totalCount} ações</p>
                </div>

                {workTotal > 0 && (
                    <div className="grid grid-cols-2 gap-2 my-2">
                        <div className="bg-black/20 p-2 rounded-lg text-center border border-white/5">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Produtividade</p>
                            <p className={`text-xl arena-title-text luxe-title-shadow leading-tight ${productivityScore >= 80 ? 'text-green-400' : 'text-white'}`}>{productivityScore.toFixed(0)}%</p>
                        </div>
                        <div className="bg-black/20 p-2 rounded-lg text-center border border-white/5">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Entregas</p>
                            <p className="text-xl arena-title-text text-white luxe-title-shadow leading-tight">{workCompleted}/{workTotal}</p>
                        </div>
                    </div>
                )}

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
                                onQuickComplete={handleQuickComplete}
                                isAdjusting={isAdjusting}
                                isCompleted={isCompleted}
                            />
                        );
                    })}
                </div>

                <p className="text-center text-xs text-gray-500 mt-2">
                    Complete as ações no Planner para atualizar seu progresso aqui.
                </p>

                <div className="py-2"></div>

                <button onClick={endDailyBattle} className="w-full py-2 rounded-xl luxe-skin-button">⚡ GERAR SCORE FINAL</button>
            </>
        );
    }

    const renderJudgment = () => {
        const score = dailyCommitment.score || 0;
        const expDeposited = dailyCommitment.expDeposited ?? 0;
        const sitrepBonus = dailyCommitment.sitrepBonus ?? 0;

        const getRankLetter = (s: number) => {
            if (s === 100) return 'S';
            if (s >= 90) return 'A';
            if (s >= 80) return 'B';
            if (s >= 70) return 'C';
            return 'D';
        };

        const getRankColor = (rank: string) => {
            switch (rank) {
                case 'S': return 'text-[var(--skin-accent-color)] drop-shadow-[0_0_15px_var(--skin-accent-color-soft)]';
                case 'A': return 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.4)]';
                case 'B': return 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.4)]';
                case 'C': return 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]';
                default: return 'text-gray-400';
            }
        };

        const rankLetter = getRankLetter(score);
        const rankColor = getRankColor(rankLetter);

        let verdict = "Guerreiro. Mantenha a disciplina.";
        if (score === 100) verdict = "Soberano. A vitória foi absoluta.";
        else if (score < 50) verdict = "A Batalha foi dura. Recupere e avance.";

        const earnedInsignia = dailyCommitment.earnedInsigniaId ? resolveItemDef(dailyCommitment.earnedInsigniaId) : null;

        return (
            <>
                <div id="sitrep-capture-area" className="space-y-4">
                    <CycleHeader />
                    <div className="text-center space-y-2 py-4">
                        <div className="relative inline-block mb-4">
                            <p className={`text-9xl font-black italic tracking-tighter ${rankColor} transition-all duration-1000 animate-in zoom-in-50 fade-in duration-700`}>
                                {rankLetter}
                            </p>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-1 rounded-full border border-white/10">
                                <p className="text-sm font-mono tracking-[0.3em] text-white/80">SCORE: {score}</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-300 italic mt-4">"{verdict}"</p>

                        {earnedInsignia && (
                            <div className="mt-8 flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-1000 delay-500 fill-mode-both">
                                <div className="group relative">
                                    <div className="absolute inset-0 bg-[var(--skin-accent-color)]/20 blur-2xl rounded-full group-hover:bg-[var(--skin-accent-color)]/30 transition-all duration-700 animate-pulse"></div>
                                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[var(--skin-accent-color)]/30 to-black/60 border border-[var(--skin-accent-color)]/50 flex items-center justify-center text-4xl shadow-2xl transition-transform duration-500 hover:scale-110">
                                        {earnedInsignia.icon}
                                    </div>
                                </div>
                                <div className="mt-3 text-center">
                                    <p className="text-[10px] text-[var(--skin-accent-color)] uppercase font-black tracking-[0.25em] animate-pulse">Nova Insígnia Conquistada!</p>
                                    <p className="text-sm text-white font-bold tracking-tight">{earnedInsignia.name}</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-3">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400">Exp depositada no ciclo</p>
                            <p className="text-xl arena-title-text accent-text luxe-title-shadow leading-tight">{expDeposited}</p>
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
                            if (onClose) onClose();
                        }}
                        className="w-full py-2 rounded-xl luxe-button-secondary text-sm"
                    >
                        🛌 DESCANSAR
                    </button>
                    <button onClick={() => handleShare('sitrep-capture-area', 'Meu SITREP Diário - Life OS')} className="p-3 rounded-xl luxe-button-secondary">
                        <ShareIcon className="w-5 h-5" />
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
        const today = getLocalDateString();
        const todaysTasks = tasks.filter(t => t.date === today);
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
                        <p className="text-2xl arena-title-text text-white luxe-title-shadow leading-tight">{completedTasks.length}/{todaysTasks.length}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl text-center space-y-1">
                        <p className="text-xs text-gray-400 uppercase">Checklist</p>
                        <p className="text-2xl arena-title-text text-white luxe-title-shadow leading-tight">{checklistCompleted}/{checklistTotal}</p>
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
                    {onClose && (
                        <button onClick={onClose} className="w-full py-3 rounded-xl luxe-button-secondary text-sm font-bold">
                            CONTINUAR EM MODO ZEN
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (!activeCycle) return renderNoCycle();
    switch (dailyCommitment.stage) {
        case 'planning': return renderPlanning();
        case 'battle': return renderBattle();
        case 'judgment': return renderJudgment();
        default: return null;
    }
};
