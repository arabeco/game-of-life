
import React, { useState, useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import { XIcon, EditIcon, CheckIcon, PlusIcon, ShareIcon, ZapIcon, SquareCheckIcon } from './Icons';
import { ScheduledTask, Action } from '../types';
import { shareElementWithFeedback } from './Share';
import { ShareChoiceSheet } from './ShareChoiceSheet';
import { getOperationalDateString, shiftLocalDateString, taskMatchesOperationalDate } from '../utils/operationalDay.js';
import { hasScheduledTime } from '../utils/taskDomain.js';
import { getExpBoostHoursRemaining, getExpBoostLabel, hasActiveExpBoost } from '../utils/expBoostAccess';
import { formatDate, getCycleTimingSummary } from '../utils/dateUtils';
import { buildCommitmentStatsSnapshot, buildDailyWidgetSnapshot } from '../utils/widgetSnapshots';
import { safeVibrate } from '../utils/safeVibrate';
import './core-ui.css';
import { EmojiGlyph } from './EmojiGlyph';

const getFreeActionColorStyle = (
    backgroundStyle: React.CSSProperties,
    extra: React.CSSProperties = {},
): React.CSSProperties => ({
    ...extra,
    ['--free-action-bg' as string]: String(backgroundStyle.background || 'var(--asset-grad-default)'),
});

const CycleHeader: React.FC = () => {
    const { activeCycle, dailyCommitment } = useGame();
    if (!activeCycle) return null;

    const cycleTiming = getCycleTimingSummary(activeCycle.startDate, activeCycle.endDate, dailyCommitment.date);
    const daysElapsed = cycleTiming.elapsedDays;
    const totalDays = cycleTiming.totalDays;

    return (
        <div className="text-center space-y-2 text-xs p-2 rounded-xl sitrep-neutral-panel">
            <h3 className="arena-title-text text-[11px] text-white leading-tight tracking-[0.08em]">{activeCycle.name} · Dia {daysElapsed}/{totalDays}</h3>
        </div>
    );
};

const SitrepBoostStatus: React.FC = () => {
    const { userProfile } = useGame();
    const hasExpBoost = hasActiveExpBoost(userProfile);
    const expBoostLabel = getExpBoostLabel(userProfile);
    const expBoostHoursRemaining = getExpBoostHoursRemaining(userProfile);

    if (!hasExpBoost) return null;

    return (
        <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ui-text-accent)] shadow-[0_0_18px_rgba(212,175,55,0.12)]">
                <ZapIcon className="h-3.5 w-3.5 shrink-0" />
                <span>{expBoostLabel || 'Boost XP'}</span>
                {expBoostHoursRemaining != null && (
                    <span className="rounded-full border border-white/10 bg-black/20 px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-white/70">
                        {expBoostHoursRemaining}h
                    </span>
                )}
            </div>
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
    const activeCycle = { startDate: task.date, endDate: task.date };
    const cycleTiming = { inclusiveLabel: '' };
    if (!action) return null;

    const handlePressStart = () => {
        if (isAdjusting) return;

        setIsHolding(true);
        pressTimer.current = setTimeout(() => {
            onQuickComplete(action.id);
            setIsHolding(false);
            safeVibrate(50);
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
    const isFreeAction = action.actionType === 'Livre';

    return (
        <div
            className={`relative p-2 flex items-center space-x-3 rounded-xl text-left overflow-hidden transition-all text-white select-none ${isMilestone ? 'border-2 border-[var(--accent-bronze)] shadow-[0_0_10px_var(--accent-bronze-soft)]' : isFreeAction ? 'free-action-shell free-action-outline' : ''} ${isHolding ? 'scale-95 brightness-125' : ''}`}
            style={isFreeAction ? getFreeActionColorStyle(backgroundStyle) : backgroundStyle}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
        >
            <div className={`absolute inset-0 transition-opacity duration-300 ${isFreeAction ? 'bg-black/45' : 'bg-black/60'} ${isCompleted ? 'opacity-80' : 'opacity-0'}`}></div>
            <div className={`absolute inset-0 rounded-xl transition-all ${isFreeAction ? `free-action-outline ${isCompleted ? 'opacity-95' : 'opacity-80'}` : isCompleted ? 'border-4 border-[var(--skin-accent-color)] shadow-[0_0_15px_var(--skin-accent-color)] opacity-80' : 'border-2 border-dashed border-gray-600/50'}`}></div>

            <div className="text-xl z-10"><EmojiGlyph symbol={action.icon || '📝'} size="action" className="text-white" /></div>
            <div className={`text-sm font-semibold truncate w-full z-10 ${isCompleted ? 'text-gray-300' : ''} ${isFreeAction && !isCompleted ? 'text-slate-100' : ''}`}>{action.name}</div>

            {isAdjusting && !isCompleted && (
                <button onClick={(e) => { e.stopPropagation(); onUncommit(task.id); }} className="z-10 p-1">
                    <XIcon className="w-4 h-4 text-red-400" />
                </button>
            )}
            {isCompleted && (
                <div className="z-10 p-1">
                    {isFreeAction ? <div className="free-action-complete-dot" /> : <CheckIcon className="w-5 h-5 accent-text drop-shadow-[0_0_5px_rgba(0,0,0,1)]" />}
                </div>
            )}
            <p className="hidden text-[9px] font-semibold text-gray-400">
                {formatDate(activeCycle.startDate)} → {formatDate(activeCycle.endDate)} · {cycleTiming.inclusiveLabel}
            </p>
        </div>
    );
};

const PlannerLikeSitrepTaskItem: React.FC<{
    task: ScheduledTask;
    action: Action | undefined;
    onQuickComplete: (actionId: string) => void;
    isCompleted: boolean;
}> = ({ task, action, onQuickComplete, isCompleted }) => {
    const { getActionBackgroundStyle } = useGame();
    const [isHolding, setIsHolding] = useState(false);
    const pressTimer = React.useRef<NodeJS.Timeout | null>(null);

    if (!action) return null;

    const backgroundStyle = getActionBackgroundStyle(action.id);
    const isFreeAction = action.actionType === 'Livre';

    const handlePressStart = () => {
        setIsHolding(true);
        pressTimer.current = setTimeout(() => {
            onQuickComplete(action.id);
            setIsHolding(false);
            safeVibrate(50);
        }, 800);
    };

    const handlePressEnd = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
        setIsHolding(false);
    };

    return (
        <div
            className={`relative overflow-hidden rounded-[22px] border px-3 py-2 text-left shadow-[0_14px_30px_rgba(0,0,0,0.22)] backdrop-blur-md transition-all text-white select-none active:scale-[0.99] ${isFreeAction ? 'free-action-shell free-action-outline' : 'border-white/15'} ${isHolding ? 'scale-95 brightness-125' : ''} ${isCompleted ? 'opacity-85' : ''}`}
            style={isFreeAction ? getFreeActionColorStyle(backgroundStyle) : backgroundStyle}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
        >
            {!isFreeAction && <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.10),rgba(2,6,23,0.30)_74%)]" />}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(255,255,255,0.13),transparent_34%)] opacity-70" />
            <div className={`absolute inset-0 rounded-[22px] border-2 transition-all ${isFreeAction ? `free-action-outline ${isCompleted ? 'opacity-95 border-white/25 shadow-[0_0_12px_rgba(255,255,255,0.08)]' : 'opacity-80'}` : isCompleted ? 'border-white/25 shadow-[0_0_14px_rgba(255,255,255,0.08)]' : 'border-dashed border-gray-600/70'}`} />
            {isCompleted && <div className="absolute inset-0 bg-emerald-300/[0.035]" />}

            <div className="relative z-10 flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/28">
                    <EmojiGlyph symbol={action.icon || '\u{1F4DD}'} size="action" className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className={`truncate text-[13px] font-black uppercase tracking-[0.08em] text-white [text-shadow:0_1px_6px_rgba(2,6,23,0.82)] ${isFreeAction && !isCompleted ? 'text-slate-100' : ''}`}>{action.name}</div>
                </div>
                {isCompleted ? (
                    <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/28 text-white shadow-[0_0_8px_rgba(255,255,255,0.12)]">
                        {isFreeAction ? <div className="free-action-complete-dot scale-[0.82]" /> : <SquareCheckIcon className="h-3.5 w-3.5 text-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.55)]" />}
                    </div>
                ) : isFreeAction ? (
                    <div className="shrink-0 opacity-45 saturate-50">
                        <div className="free-action-complete-dot scale-[0.82]" />
                    </div>
                ) : null}
            </div>
            {isHolding && (
                <div className={`absolute inset-0 animate-pulse ${isFreeAction ? 'bg-black/40 rounded-[22px]' : 'bg-black/50 rounded-[22px]'}`}>
                    <div className={`h-full w-full ${isCompleted ? 'bg-red-800/50 animate-[unfill_3s_linear_forwards]' : isFreeAction ? 'bg-white/25 animate-[fill_3s_linear_forwards]' : 'bg-gray-500/50 animate-[fill_3s_linear_forwards]'}`} />
                </div>
            )}
        </div>
    );
};

export const SitrepContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { activeCycle, dailyCommitment, taskPool, actions, tasks, scheduleTask, scheduleAndCompleteNow, toggleTaskCompletion, setDailyCommitment, lockDailyCommitment, unlockDailyCommitment, endDailyBattle, getArenas, checklistItems, showToast, addFeedEvent, appMode, getActionBackgroundStyle } = useGame();

    const [isAdjusting, setIsAdjusting] = useState(false);
    const [isShareChoiceOpen, setIsShareChoiceOpen] = useState(false);
    const isBasicMode = appMode === 'BASIC';
    const softPanelClass = 'sitrep-neutral-panel';
    const progressTrackClass = 'sitrep-neutral-track';

    const arenas = getArenas();

    const getActionById = (id: string) => actions.find(a => a.id === id);

    const dailySnapshot = useMemo(() => buildDailyWidgetSnapshot({
        activeCycle,
        dailyCommitment,
        tasks,
        actions,
        arenas,
        checklistItems,
        taskPool,
    }), [activeCycle, actions, arenas, checklistItems, dailyCommitment, taskPool, tasks]);

    const commitmentStats = useMemo(
        () => dailySnapshot.commitmentStats ?? buildCommitmentStatsSnapshot(tasks, dailyCommitment, actions),
        [actions, dailySnapshot.commitmentStats, dailyCommitment, tasks]
    );

    const dailyArenaFocus = dailySnapshot.focusArena;

    // --- Lógica de Opções do SITREP baseada no taskPool (Alinhada com Planner/Bay Area) ---
    const groupedAvailableOptions = dailySnapshot.availableGroups;

    const handleCommitAction = async (actionId: string) => {
        const today = dailyCommitment.date;

        // Prioridade 1: Tarefa planejada NÃO completada que ainda não está no compromisso
        const pendingTask = tasks.find(t =>
            t.actionId === actionId &&
            taskMatchesOperationalDate(t, today) &&
            !t.completed &&
            !dailyCommitment.taskIds.includes(t.id)
        );

        if (pendingTask) {
            setDailyCommitment([...dailyCommitment.taskIds, pendingTask.id]);
            return;
        }

        // Prioridade 2: Tarefa que JÁ FOI completada hoje (ex: via Planner ou Quick Complete anterior) mas não está no compromisso
        const completedTask = tasks.find(t =>
            t.actionId === actionId &&
            taskMatchesOperationalDate(t, today) &&
            t.completed &&
            !dailyCommitment.taskIds.includes(t.id)
        );
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
        // No Sitrep, the X should only remove the task from today's commitment.
        // It must not unschedule, uncomplete, or throw the task back into the pool.
        setDailyCommitment(dailyCommitment.taskIds.filter(id => id !== taskId));
    };

    const handleQuickComplete = async (actionId: string) => {
        const today = dailyCommitment.date;

        const existingTask = tasks.find(t =>
            t.actionId === actionId &&
            taskMatchesOperationalDate(t, today) &&
            !t.completed &&
            dailyCommitment.taskIds.includes(t.id)
        );
        const completedTask = tasks.find(t =>
            t.actionId === actionId &&
            taskMatchesOperationalDate(t, today) &&
            t.completed &&
            dailyCommitment.taskIds.includes(t.id)
        );

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
            <SitrepBoostStatus />

            <div className="sitrep-neutral-panel p-3 rounded-xl">
                <h3 className="core-label text-center mb-2">Ações disponíveis</h3>
                <div className="max-h-24 overflow-y-auto pr-1 space-y-1">
                    {groupedAvailableOptions.map((group) => {
                        const isStockOut = group.count <= 0;
                        const isFreeAction = group.action.actionType === 'Livre';
                        return (
                            <button
                                key={group.ids[0]}
                                onClick={() => handleGroupClick(group)}
                                disabled={isStockOut}
                                className={`group relative w-full overflow-hidden rounded-[18px] border px-3 py-2 text-left transition-all ${isFreeAction ? 'free-action-shell free-action-outline' : 'border-white/10 bg-black/18'} ${isStockOut ? 'opacity-30 cursor-not-allowed bg-black/10 border-white/5' : 'hover:border-white/20 active:scale-[0.99]'}`}
                                style={isFreeAction && !isStockOut ? getFreeActionColorStyle(getActionBackgroundStyle(group.action.id)) : !isStockOut ? getActionBackgroundStyle(group.action.id) : undefined}
                            >
                                {!isFreeAction && <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.12),rgba(2,6,23,0.34)_76%)]" />}
                                <div className="relative z-10 flex items-center gap-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/28">
                                        <EmojiGlyph symbol={group.action.icon || '\u{1F4DD}'} size="action" className="text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className={`truncate text-xs font-black uppercase tracking-[0.08em] text-white [text-shadow:0_1px_6px_rgba(2,6,23,0.82)] ${isStockOut ? 'text-gray-500' : isFreeAction ? 'text-slate-100' : ''}`}>{group.action.name}</div>
                                    </div>
                                    {!isFreeAction ? (
                                        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${isStockOut ? 'border-gray-700 bg-gray-800 text-gray-600' : 'border-white/10 bg-black/30 text-white'}`}>x{group.count}</span>
                                    ) : (
                                        <PlusIcon className="h-4 w-4 shrink-0 text-white/55" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                    {groupedAvailableOptions.length === 0 && <p className="text-xs text-center text-gray-500 py-2">Nenhuma ação disponível para hoje.</p>}
                </div>
            </div>

            <div className="sitrep-neutral-panel p-3 rounded-xl">
                <h3 className="core-label text-center mb-2">Metas de hoje</h3>
                <div className="max-h-24 overflow-y-auto pr-1 space-y-1">
                    {commitmentStats.committedTasks.map(task => {
                        const action = getActionById(task.actionId);
                        const isFreeAction = action?.actionType === 'Livre';
                        return (
                            <div
                                key={task.id}
                                className={`relative w-full overflow-hidden rounded-[18px] border px-3 py-2 text-left ${isFreeAction ? 'free-action-shell free-action-outline' : 'border-white/10 bg-black/18'}`}
                                style={action ? (isFreeAction ? getFreeActionColorStyle(getActionBackgroundStyle(action.id)) : getActionBackgroundStyle(action.id)) : undefined}
                            >
                                {action && !isFreeAction && <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.12),rgba(2,6,23,0.34)_76%)]" />}
                                <div className="relative z-10 flex items-center gap-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/28">
                                        <EmojiGlyph symbol={action?.icon || '\u{1F4DD}'} size="action" className="text-white" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className={`truncate text-xs font-black uppercase tracking-[0.08em] text-white [text-shadow:0_1px_6px_rgba(2,6,23,0.82)] ${isFreeAction ? 'text-slate-100' : ''}`}>{action?.name}</div>
                                    </div>
                                    <button onClick={() => handleUncommitTask(task.id)} className="shrink-0 rounded-full border border-red-400/20 bg-red-500/10 p-1.5"><XIcon className="w-3.5 h-3.5 text-red-300" /></button>
                                </div>
                            </div>
                        );
                    })}
                    {commitmentStats.committedTasks.length === 0 && <p className="text-xs text-center text-gray-500 py-2">Selecione ações do estoque.</p>}
                </div>
            </div>

            <button disabled={commitmentStats.committedTasks.length === 0} onClick={lockDailyCommitment} className="w-full py-2 rounded-xl luxe-skin-button disabled:opacity-50">Travar metas de hoje</button>
        </>
    );

    const renderBattle = () => {
        const progress = dailySnapshot.progressPercent;
        const isFutureBattle = dailyCommitment.date > getOperationalDateString();

        const [y, m, d] = dailyCommitment.date.split('-').map(Number);
        const monthNames = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
        const todayStr = `${d.toString().padStart(2, '0')} DE ${monthNames[m - 1]} DE ${y}`;

        const keyTasks = commitmentStats.tasksWithStatus.filter(({ task }) => {
            const action = getActionById(task.actionId);
            return action?.actionType === 'Compromisso' || action?.actionType === 'Marco';
        });
        const coreTasks = keyTasks.length > 0 ? keyTasks : commitmentStats.tasksWithStatus;
        const coreCompleted = coreTasks.filter(task => task.isCompleted).length;
        const coreTotal = coreTasks.length;
        const coreScore = coreTotal > 0 ? (coreCompleted / coreTotal) * 100 : 0;
        const coreLabel = keyTasks.length > 0 ? 'Compromissos-chave' : 'Ritmo do dia';

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
                        <div className="sitrep-neutral-pill inline-block text-[10px] uppercase tracking-[0.2em] rounded-lg px-2 py-1 text-gray-300">
                            Hoje {todayStr}
                        </div>
                    </div>
                    <div className="w-9"></div>
                </div>
                <CycleHeader />
                <SitrepBoostStatus />
                <div className='text-center'>
                    <div className={`w-full rounded-full h-1.5 mt-1 ${progressTrackClass}`}><div className="bg-[var(--skin-accent-color)] h-full rounded-full" style={{ width: `${progress}%` }}></div></div>
                    <p className="text-xs text-gray-400 mt-1">
                        Progresso: {progress.toFixed(0)}% | {commitmentStats.completedCount}/{commitmentStats.totalCount} acoes pontuaveis
                        {commitmentStats.totalAllCount !== commitmentStats.totalCount && (
                            <span className="text-gray-500"> | total travado {commitmentStats.completedAllCount}/{commitmentStats.totalAllCount}</span>
                        )}
                    </p>
                </div>

                {coreTotal > 0 && (
                    <div className="grid grid-cols-2 gap-2 my-2">
                        <div className="sitrep-neutral-panel p-2 rounded-lg text-center">
                            <p className="core-label">{coreLabel}</p>
                            <p className={`text-xl arena-title-text leading-tight ${coreScore >= 80 ? 'text-green-400' : 'text-white'}`}>{coreScore.toFixed(0)}%</p>
                        </div>
                        <div className="sitrep-neutral-panel p-2 rounded-lg text-center">
                            <p className="core-label">Feitas</p>
                            <p className="text-xl arena-title-text text-white leading-tight">{commitmentStats.completedCount}/{commitmentStats.totalCount}</p>
                        </div>
                    </div>
                )}

                {dailyArenaFocus && (
                    <div className="sitrep-neutral-panel p-2 rounded-lg text-center mb-2">
                        <p className="core-label">Arena foco do dia</p>
                        <p className="text-sm font-bold text-white truncate">{dailyArenaFocus.name}</p>
                        <p className="text-[10px] text-gray-500">{dailyArenaFocus.completed}/{dailyArenaFocus.total} ações concluídas</p>
                    </div>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <h3 className="core-label text-center mb-1">Alvos travados</h3>
                    {commitmentStats.tasksWithStatus.map(({ task, isCompleted }) => {
                        const action = getActionById(task.actionId);
                        return (
                            <PlannerLikeSitrepTaskItem
                                key={task.id}
                                task={task}
                                action={action}
                                onQuickComplete={handleQuickComplete}
                                isCompleted={isCompleted}
                            />
                        );
                    })}
                </div>

                <p className="text-center text-xs text-gray-500 mt-2">
                    Complete as ações no Planner para atualizar seu progresso aqui.
                </p>

                <div className="py-2"></div>

                {isFutureBattle && (
                    <p className="text-center text-[11px] text-amber-300/85 px-3">
                        Amanhã já pode ficar travado, mas o julgamento só abre quando o dia chegar.
                    </p>
                )}

                <button
                    onClick={() => {
                        if (isFutureBattle) {
                            showToast('Amanhã ainda não pode ser julgado. Hoje você só pode travar as metas.', 'error');
                            return;
                        }
                        endDailyBattle();
                    }}
                    className={`w-full py-2 rounded-xl ${isFutureBattle ? 'luxe-button-secondary text-amber-200 border border-amber-400/20' : 'luxe-skin-button'}`}
                >
                    {isFutureBattle ? 'Fechamento bloqueado até amanhã' : 'Gerar score final'}
                </button>
            </>
        );
    }

    const renderJudgment = () => {
        const score = dailyCommitment.score || 0;
        const expDeposited = dailyCommitment.expDeposited ?? 0;
        const sitrepBonus = dailyCommitment.sitrepBonus ?? 0;
        const relationshipBonusXp = dailyCommitment.relationshipBonusXp ?? 0;
        const performanceBonusXp = Math.max(0, sitrepBonus - relationshipBonusXp);
        const nextOperationalDate = shiftLocalDateString(dailyCommitment.date, 1);
        const sitrepLabel = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(
            new Date(`${dailyCommitment.date}T12:00:00`)
        );

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
        const checklistDone = dailySnapshot.checklistCompleted;
        const checklistTotal = dailySnapshot.checklistTotal;
        const handleShareImage = () => {
            void shareElementWithFeedback(showToast, 'sitrep-capture-area', {
                title: 'Meu Painel Diario - Life OS',
                preparingMessage: 'Preparando compartilhamento do painel...',
                sharedMessage: 'Painel diario compartilhado.',
                cancelledMessage: 'Compartilhamento cancelado.',
                errorMessage: 'Nao foi possivel preparar o painel para compartilhar.',
            });
        };
        const handlePostSitrepToFeed = () => {
            addFeedEvent({
                type: 'REPORT_COMPLETED',
                content: {
                    title: `Painel diario ${sitrepLabel}`,
                    icon: '📋',
                    score,
                },
            });
            showToast('Painel diario postado no feed.', 'success');
        };

        return (
            <>
                <div id="sitrep-capture-area" className="space-y-4">
                    <CycleHeader />
                    <SitrepBoostStatus />
                    <div className="text-center space-y-2 py-4">
                        <div className="relative inline-block mb-4">
                            <p className={`text-9xl font-black italic tracking-tighter ${rankColor} transition-all duration-1000 animate-in zoom-in-50 fade-in duration-700`}>
                                {rankLetter}
                            </p>
                            <div className="sitrep-neutral-pill absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full border">
                                <p className={`text-sm font-mono tracking-[0.3em] ${isBasicMode ? 'text-[color:var(--ui-card-text)]' : 'text-white/80'}`}>SCORE: {score}</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-300 italic mt-4">"{verdict}"</p>

                        <div className="pt-3">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400">Exp depositada no ciclo</p>
                            <p className="text-xl arena-title-text accent-text luxe-title-shadow leading-tight">{expDeposited}</p>
                            <p className="mt-2 text-[10px] text-gray-500">Se ontem ficou em aberto, voce ainda pode acertar esse dia hoje. Depois disso, ele trava.</p>
                            {performanceBonusXp > 0 && <p className="text-[10px] text-gray-500">Bonus de performance: +{performanceBonusXp}</p>}
                            {relationshipBonusXp > 0 && <p className="text-[10px] text-amber-300/80">Bonus de duelo: +{relationshipBonusXp}</p>}
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-4 text-center">
                            <div className="sitrep-neutral-panel p-2 rounded-xl">
                                <p className="core-label">Feitas</p>
                                <p className="text-lg arena-title-text text-white leading-tight">{commitmentStats.completedCount}/{commitmentStats.totalCount}</p>
                                <p className="text-[10px] text-gray-500">travadas</p>
                            </div>
                            <div className="sitrep-neutral-panel p-2 rounded-xl">
                                <p className="core-label">Arena foco</p>
                                <p className="text-xs font-bold text-white leading-tight line-clamp-2 min-h-[2rem] flex items-center justify-center">{dailyArenaFocus?.name || 'Nenhuma'}</p>
                                <p className="text-[10px] text-gray-500">{dailyArenaFocus ? `${dailyArenaFocus.completed}/${dailyArenaFocus.total}` : '0/0'}</p>
                            </div>
                            <div className="sitrep-neutral-panel p-2 rounded-xl">
                                <p className="core-label">Checklist</p>
                                <p className="text-lg arena-title-text text-white leading-tight">{checklistDone}/{checklistTotal}</p>
                                <p className="text-[10px] text-gray-500">itens</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {
                            if (expDeposited > 0) showToast(`+${expDeposited} XP foram adicionados ao seu ciclo`);
                            if (onClose) onClose();
                        }}
                        className="w-full py-2 rounded-xl luxe-button-secondary text-sm"
                    >
                        Descansar
                    </button>
                    <button
                        onClick={() => setIsShareChoiceOpen(true)}
                        className="p-3 rounded-xl luxe-button-secondary"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            if (expDeposited > 0) showToast(`+${expDeposited} XP foram adicionados ao seu ciclo`);
                            window.dispatchEvent(new CustomEvent('planner:focus-date', {
                                detail: {
                                    dateString: nextOperationalDate,
                                    viewMode: 'day',
                                }
                            }));
                            showToast(`Planner aberto em ${nextOperationalDate}.`);
                            if (onClose) onClose();
                        }}
                        className="w-full py-2 rounded-xl luxe-skin-button text-sm"
                    >
                        Planejar amanha
                    </button>
                </div>
                <ShareChoiceSheet
                    isOpen={isShareChoiceOpen}
                    title="Resultado do painel diario"
                    subtitle="Escolha se quer compartilhar a imagem ou publicar esse resultado no feed."
                    onShareImage={handleShareImage}
                    onPostToFeed={handlePostSitrepToFeed}
                    onClose={() => setIsShareChoiceOpen(false)}
                />
            </>
        )
    }

    const renderNoCycle = () => {
        const checklistCompleted = dailySnapshot.checklistCompleted;
        const checklistTotal = dailySnapshot.checklistTotal;
        const expFromActions = dailySnapshot.potentialExpFromActions;

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
                    <div className={`${softPanelClass} p-3 rounded-xl text-center space-y-1`}>
                        <p className="text-xs text-gray-400 uppercase">Tarefas</p>
                        <p className="text-2xl arena-title-text text-white luxe-title-shadow leading-tight">{dailySnapshot.freeModeCompletedCount}/{dailySnapshot.freeModeTotalCount}</p>
                    </div>
                    <div className={`${softPanelClass} p-3 rounded-xl text-center space-y-1`}>
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







