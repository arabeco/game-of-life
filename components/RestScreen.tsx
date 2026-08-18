import React, { useState, useEffect, useRef } from 'react';
import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';
import { LockIcon, UnlockIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, UsersIcon, ShareIcon, XIcon, ArrowRightIcon, EyeIcon, FocusIcon } from './Icons';
import { handleShare } from './Share';
import { GlassCard } from './GlassCard';
import { SephirotFog } from './SephirotFog';
import { MoodModal } from './MoodModal';
import { ChecklistModal } from './ChecklistModal';
import { SitrepContent } from './SitrepContent';
import { ClanOverviewModal } from './ClanOverviewModal';
import { getMasteryIndexFromAssets } from '../constants/lifeAreas';
import { OracleFeed } from './OracleFeed';
import { WheelPicker } from './inputs/WheelPicker';
import { Action, ScheduledTask } from '../types';
import { FocusAudioPlayer } from './FocusAudioPlayer';
import { REST_SCREEN_ACTION_VIEW_REQUEST_EVENT, RestScreenActionSessionDetail } from '../utils/restScreenActionSession';
import { showLocalNotification } from '../utils/localNotification';
import { buildActionSessionWidgetSnapshot } from '../utils/widgetSnapshots';
import { buildActionPoolByDate, filterCycleTasksByScope } from '../utils/coreLoopUtils.js';
import { buildLocalDateFromString, getOperationalDateString, shiftLocalDateString, taskMatchesOperationalDate } from '../utils/operationalDay';
import { isTaskInPool } from '../utils/taskDomain.js';
import { EmojiGlyph } from './EmojiGlyph';
import { SKINS_DATA, BORDERS_DATA } from '../constants';
import { getNotificationPriority } from '../constants/oracleNotificationPolicy';
import { OracleSpeakerMark, type OracleSpeakerTone } from './OracleSpeakerMark';

interface RestScreenProps {
    onClose: () => void;
    onOpenMood?: () => void;
    onOpenOracle?: () => void;
    onOpenClan?: () => void;
    onOpenDeepWork?: () => void;
    actionSession?: RestScreenActionSessionDetail | null;
    onClearActionSession?: () => void;
}

export const RestScreen: React.FC<RestScreenProps> = ({ onClose, onOpenMood, onOpenOracle, onOpenClan, onOpenDeepWork, actionSession = null, onClearActionSession }) => {
    const {
        activeCycle,
        dailyCommitment,
        judgedOperationalDates,
        tasks,
        actions,
        taskPool,
        checklistItems,
        userProfile,
        currentMood,
        clan,
        assets,
        scheduleAndCompleteNow,
        scheduleAndCompleteMilestoneNow,
        getLocalDateString,
        oraclePreferences,
        oracleMessages,
        notifications,
        appMode,
        activeTheme,
        showToast
    } = useGame();
    const masteryIndex = getMasteryIndexFromAssets(assets);
    const [isClosing, setIsClosing] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const holdAnimationFrameRef = useRef<number | null>(null);
    const holdStartTimeRef = useRef<number | null>(null);
    const unlockHintTimeoutRef = useRef<number | null>(null);
    const actionHoldInterval = useRef<number | null>(null);
    const [actionProgress, setActionProgress] = useState<{ id: string, progress: number } | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showUnlockHint, setShowUnlockHint] = useState(false);
    const [isChecklistOpen, setIsChecklistOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMoodOpen, setIsMoodOpen] = useState(false);
    const [isOracleOpen, setIsOracleOpen] = useState(false);
    const [isClanOpen, setIsClanOpen] = useState(false);
    const [isSitrepLocked, setIsSitrepLocked] = useState(true); // Default to locked (safe mode)
    const [isDeepWorkOpen, setIsDeepWorkOpen] = useState(false);
    const [selectedDeepWorkTime, setSelectedDeepWorkTime] = useState('25');
    const [deepWorkActive, setDeepWorkActive] = useState(false);
    const [isDeepWorkImmersive, setIsDeepWorkImmersive] = useState(false);
    const [deepWorkTimeLeft, setDeepWorkTimeLeft] = useState(0);
    const [actionSessionTimeLeft, setActionSessionTimeLeft] = useState(0);
    const selectedBorder = [...SKINS_DATA, ...BORDERS_DATA].find(s => s.id === userProfile.border);
    const avatarInsetStyle = selectedBorder?.imageUrl
        ? { width: '75%', height: '75%' }
        : { width: 'calc(100% - 6px)', height: 'calc(100% - 6px)' };
    const [actionSessionCompleteProgress, setActionSessionCompleteProgress] = useState(0);
    const [isActionSessionCompleting, setIsActionSessionCompleting] = useState(false);
    const actionSessionCompleteIntervalRef = useRef<number | null>(null);
    const actionSessionTimeoutPlayedRef = useRef(false);
    const actionSessionNotificationSentRef = useRef(false);
    const actionSessionToastSentRef = useRef(false);
    const actionSessionReturnedRef = useRef(false);
    const unreadOracleMessages = oracleMessages.filter((message) => !message.read).length;
    const unreadNotifications = notifications.filter((notification) => !notification.read);
    const oracleUnreadCount = unreadOracleMessages + unreadNotifications.length;
    const hasCriticalOracleSignal = unreadNotifications.some((notification) => getNotificationPriority(notification.type) === 'critical');
    const hasActionableOracleSignal = unreadNotifications.some((notification) => {
        const priority = getNotificationPriority(notification.type);
        return priority === 'actionable' || priority === 'progress';
    });
    const oracleTone: OracleSpeakerTone = hasCriticalOracleSignal
        ? 'danger'
        : hasActionableOracleSignal
            ? 'warning'
            : oracleUnreadCount > 0
                ? 'info'
                : 'neutral';
    const oracleBadgeClass = 'border-red-100/80 bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.55)]';

    const deepWorkOptions = ['15', '20', '25', '30', '40', '45', '50', '60', '90', '120'];
    const currentActionSessionTask = actionSession?.taskId ? tasks.find(task => task.id === actionSession.taskId) : null;
    const isActionSessionCompleted = Boolean(currentActionSessionTask?.completed);
    const actionSessionSnapshot = React.useMemo(() => buildActionSessionWidgetSnapshot({
        actionSession,
        task: currentActionSessionTask,
        nowMs: Date.now(),
    }), [actionSession, currentActionSessionTask, actionSessionTimeLeft]);
    const sitrepStatusLabel = isSitrepLocked ? 'Resumo' : 'Aberto';
    // Fundo calmo era exclusivo do modo BASIC; agora e quem desliga animacoes.
    const softVisuals = oraclePreferences?.animationsEnabled === false;
    const isLightTheme = activeTheme === 'LIGHT';
    const unlockHint = isUnlocked ? 'Saindo...' : 'Segure 1s para desbloquear';
    const shouldShowUnlockHint = isUnlocked || showUnlockHint;

    const clearUnlockHintTimeout = () => {
        if (unlockHintTimeoutRef.current) {
            window.clearTimeout(unlockHintTimeoutRef.current);
            unlockHintTimeoutRef.current = null;
        }
    };

    const revealUnlockHint = () => {
        if (isUnlocked) return;
        clearUnlockHintTimeout();
        setShowUnlockHint(true);
        unlockHintTimeoutRef.current = window.setTimeout(() => {
            setShowUnlockHint(false);
            unlockHintTimeoutRef.current = null;
        }, 1800);
    };

    useEffect(() => {
        return () => {
            if (holdAnimationFrameRef.current) {
                cancelAnimationFrame(holdAnimationFrameRef.current);
            }
            clearUnlockHintTimeout();
        };
    }, []);

    const handleQuickActionStart = (action: 'mood' | 'clan' | 'deepwork' | 'real_oracle' | 'checklist') => {
        if (actionHoldInterval.current) return;

        const startTime = Date.now();
        const duration = action === 'real_oracle' ? 140 : 600; // Oraculo abre como toque; os outros continuam com segurada.

        actionHoldInterval.current = window.setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setActionProgress({ id: action, progress });

            if (progress >= 100) {
                if (actionHoldInterval.current) clearInterval(actionHoldInterval.current);
                actionHoldInterval.current = null;
                setActionProgress(null);
                handleQuickAction(action);
            }
        }, 16);
    };

    const handleQuickActionEnd = () => {
        if (actionHoldInterval.current) {
            clearInterval(actionHoldInterval.current);
            actionHoldInterval.current = null;
        }
        setActionProgress(null);
    };

    const handleQuickAction = (action: 'mood' | 'clan' | 'deepwork' | 'real_oracle' | 'checklist') => {
        if (action === 'mood') {
            setIsMoodOpen(true);
        } else if (action === 'checklist') {
            setIsChecklistOpen(true);
        } else if (action === 'deepwork') {
            setIsDeepWorkOpen(true);
        } else if (action === 'real_oracle') {
            onOpenOracle?.();
        } else {
            // For others, close RestScreen and then open the modal via callback
            setIsClosing(true);
            setTimeout(() => {
                onClose();
                if (action === 'clan') onOpenClan?.();
            }, 700);
        }
    };

    const checklistDoneCount = checklistItems.filter(item => item.completed).length;
    const checklistTotalCount = checklistItems.length;
    const restOperationalDate = React.useMemo(() => getOperationalDateString(currentTime), [currentTime]);
    const restScopedTasks = React.useMemo(() => (
        activeCycle
            ? filterCycleTasksByScope(tasks, actions, activeCycle, activeCycle.startDate, activeCycle.endDate)
            : tasks.filter(task => taskMatchesOperationalDate(task, restOperationalDate))
    ), [activeCycle, actions, restOperationalDate, tasks]);
    const restAvailableActionCount = React.useMemo(() => {
        const actionPool = buildActionPoolByDate(
            actions,
            taskPool,
            restScopedTasks,
            activeCycle ? null : restOperationalDate,
            [],
            Boolean(activeCycle)
        );
        const availableActionIds = new Set(
            Object.entries(actionPool)
                .filter(([, payload]: [string, any]) => Number(payload?.count || 0) > 0)
                .map(([actionId]) => actionId)
        );
        restScopedTasks
            .filter(isTaskInPool)
            .forEach(task => availableActionIds.add(task.actionId));
        return availableActionIds.size;
    }, [actions, activeCycle, restOperationalDate, restScopedTasks, taskPool]);
    const dailyDoneCount = React.useMemo(() => (
        restScopedTasks.filter(task => task.completed && taskMatchesOperationalDate(task, restOperationalDate)).length
    ), [restOperationalDate, restScopedTasks]);
    const dailyCommandLabel = currentTime
        .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
        .replace('.', '')
        .replace(/^\w/, (letter) => letter.toUpperCase());
    const dailyOpenLabel = `${restAvailableActionCount} ${restAvailableActionCount === 1 ? 'ação disponível' : 'ações disponíveis'}`;
    const dailyDoneLabel = `${dailyDoneCount} ${dailyDoneCount === 1 ? 'feita' : 'feitas'}`;
    const dailyPanelSummary = `HOJE · ${dailyCommandLabel} · ${dailyOpenLabel} · ${dailyDoneLabel}`;
    const handleDailyPanelOpen = () => {
        if (isSitrepLocked) {
            setIsSitrepLocked(false);
            const yesterday = shiftLocalDateString(getOperationalDateString(), -1);
            const summarySeenKey = `glyph:daily-summary-seen:${userProfile.id}:${yesterday}`;
            const hasYesterdaySummary = judgedOperationalDates.includes(yesterday);
            const hasSeenYesterdaySummary = window.localStorage.getItem(summarySeenKey) === '1';

            if (hasYesterdaySummary && !hasSeenYesterdaySummary) {
                window.localStorage.setItem(summarySeenKey, '1');
                window.dispatchEvent(new CustomEvent('glyph:daily-panel-opened', {
                    detail: { date: yesterday },
                }));
            }
        }
    };

    const [showCancelButton, setShowCancelButton] = useState(false);
    const cancelAnimationFrameRef = useRef<number | null>(null);
    const cancelStartTimeRef = useRef<number | null>(null);
    const [cancelProgress, setCancelProgress] = useState(0);

    const handleDeepWorkStart = () => {
        const minutes = parseInt(selectedDeepWorkTime);
        setDeepWorkTimeLeft(minutes * 60);
        setDeepWorkActive(true);
        setIsDeepWorkImmersive(true);
        setIsDeepWorkOpen(false);
    };

    const updateCancelProgress = (timestamp: number) => {
        if (!cancelStartTimeRef.current) cancelStartTimeRef.current = timestamp;
        const elapsed = timestamp - cancelStartTimeRef.current;
        const duration = 1500; // 1.5s to cancel
        const progress = Math.min((elapsed / duration) * 100, 100);

        setCancelProgress(progress);

        if (progress >= 100) {
            cancelStartTimeRef.current = null;
            cancelAnimationFrameRef.current = null;
            setCancelProgress(0);
            setDeepWorkActive(false);
            setIsDeepWorkImmersive(false);
            setShowCancelButton(false);
        } else {
            cancelAnimationFrameRef.current = requestAnimationFrame(updateCancelProgress);
        }
    };

    const handleCancelStart = (e?: React.MouseEvent | React.TouchEvent) => {
        e?.stopPropagation(); // Prevent toggling visibility
        if (cancelAnimationFrameRef.current) return;

        cancelStartTimeRef.current = null;
        cancelAnimationFrameRef.current = requestAnimationFrame(updateCancelProgress);
    };

    const handleCancelEnd = (e?: React.MouseEvent | React.TouchEvent) => {
        e?.stopPropagation();
        if (cancelAnimationFrameRef.current) {
            cancelAnimationFrame(cancelAnimationFrameRef.current);
            cancelAnimationFrameRef.current = null;
        }
        cancelStartTimeRef.current = null;
        setCancelProgress(0);
    };

    const toggleCancelVisibility = () => {
        if (deepWorkActive) {
            setShowCancelButton(prev => !prev);
            // Auto hide after 3 seconds if not interacting
            // setTimeout(() => setShowCancelButton(false), 3000); // Removed auto-hide to match request
        }
    };

    useEffect(() => {
        let interval: number;
        if (deepWorkActive && deepWorkTimeLeft > 0) {
            interval = window.setInterval(() => {
                setDeepWorkTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (deepWorkTimeLeft === 0) {
            setDeepWorkActive(false);
            setIsDeepWorkImmersive(false);
            // Optionally notify completion
        }
        return () => clearInterval(interval);
    }, [deepWorkActive, deepWorkTimeLeft]);

    useEffect(() => {
        if (!actionSession) {
            setActionSessionTimeLeft(0);
            setActionSessionCompleteProgress(0);
            setIsActionSessionCompleting(false);
            actionSessionTimeoutPlayedRef.current = false;
            actionSessionNotificationSentRef.current = false;
            actionSessionToastSentRef.current = false;
            actionSessionReturnedRef.current = false;
            return;
        }

        actionSessionTimeoutPlayedRef.current = false;
        actionSessionNotificationSentRef.current = false;
        actionSessionToastSentRef.current = false;
        actionSessionReturnedRef.current = false;

        const sync = () => {
            const snapshot = buildActionSessionWidgetSnapshot({
                actionSession,
                task: currentActionSessionTask,
                nowMs: Date.now(),
            });
            setActionSessionTimeLeft(snapshot?.remainingSeconds ?? 0);
        };

        sync();
        const interval = window.setInterval(sync, 1000);
        return () => window.clearInterval(interval);
    }, [actionSession, currentActionSessionTask]);

    useEffect(() => {
        if (!actionSession || actionSessionTimeLeft > 0 || actionSessionTimeoutPlayedRef.current) return;
        actionSessionTimeoutPlayedRef.current = true;
        playActionSessionTimeoutSound();
    }, [actionSession, actionSessionTimeLeft]);

    useEffect(() => {
        if (!actionSession || actionSessionTimeLeft > 0) return;

        const timeoutMessage = `O tempo da ação "${actionSession.actionName}" terminou.`;

        if (document.visibilityState === 'visible') {
            if (actionSessionToastSentRef.current) return;
            actionSessionToastSentRef.current = true;
            showToast(timeoutMessage, 'info');
            return;
        }

        if (actionSessionNotificationSentRef.current || !oraclePreferences?.pushEnabled) return;

        actionSessionNotificationSentRef.current = true;
        void showLocalNotification({
            title: 'Tempo encerrado',
            body: timeoutMessage,
            tag: `action-session-${actionSession.actionId}`,
            url: '/',
        });
    }, [actionSession, actionSessionTimeLeft, oraclePreferences?.pushEnabled, showToast]);

    useEffect(() => {
        if (!actionSession || actionSessionTimeLeft > 0 || isActionSessionCompleted || actionSessionReturnedRef.current) return;
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

        actionSessionReturnedRef.current = true;
        window.dispatchEvent(new CustomEvent(REST_SCREEN_ACTION_VIEW_REQUEST_EVENT, {
            detail: {
                actionId: actionSession.actionId,
                taskId: actionSession.taskId,
                source: 'session_timeout',
            },
        }));
        onClose();
    }, [actionSession, actionSessionTimeLeft, isActionSessionCompleted, onClose]);

    useEffect(() => {
        return () => {
            if (actionSessionCompleteIntervalRef.current) {
                window.clearInterval(actionSessionCompleteIntervalRef.current);
            }
        };
    }, []);

    const formatDeepWorkTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatActionSessionTime = (seconds: number) => {
        const absoluteSeconds = Math.abs(seconds);
        const minutes = Math.floor(absoluteSeconds / 60);
        const secs = absoluteSeconds % 60;
        const prefix = seconds < 0 ? '-' : '';
        return `${prefix}${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const playActionSessionTimeoutSound = () => {
        try {
            const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioContextCtor) return;
            const audioContext = new AudioContextCtor();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(660, audioContext.currentTime + 0.25);
            gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.16, audioContext.currentTime + 0.03);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.45);
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.45);
            window.setTimeout(() => { void audioContext.close(); }, 700);
        } catch (error) {
            console.error('Action session timeout sound failed:', error);
        }
    };

    const clearActionSessionCompleteHold = () => {
        if (actionSessionCompleteIntervalRef.current) {
            window.clearInterval(actionSessionCompleteIntervalRef.current);
            actionSessionCompleteIntervalRef.current = null;
        }

        if (!isActionSessionCompleting) {
            setActionSessionCompleteProgress(0);
        }
    };

    const handleActionSessionComplete = () => {
        if (!actionSession || actionSessionCompleteIntervalRef.current || isActionSessionCompleted) return;

        const startedAt = Date.now();
        const holdDuration = 1000;

        actionSessionCompleteIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const progress = Math.min((elapsed / holdDuration) * 100, 100);
            setActionSessionCompleteProgress(progress);

            if (progress < 100) return;

            clearActionSessionCompleteHold();
            setIsActionSessionCompleting(true);

            void (async () => {
                try {
                    if (actionSession.actionType === 'Marco') {
                        await scheduleAndCompleteMilestoneNow(actionSession.actionId);
                    } else {
                        if (!actionSession.taskId || !currentActionSessionTask) {
                            showToast('Essa acao nao esta mais no Planner de hoje.', 'error');
                            onClearActionSession?.();
                            return;
                        }
                        await scheduleAndCompleteNow(actionSession.actionId, actionSession.taskId);
                    }

                    showToast('Acao concluida.', 'success');
                    onClearActionSession?.();
                } catch (error) {
                    console.error('Action session completion failed:', error);
                    showToast('Nao foi possivel concluir a acao.', 'error');
                } finally {
                    setActionSessionCompleteProgress(0);
                    setIsActionSessionCompleting(false);
                }
            })();
        }, 16);
    };

    // Animation for mounting
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => {
            setMounted(false);
            clearInterval(timer);
        };
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const handleStartHold = (_event?: React.MouseEvent | React.TouchEvent) => {
        if (holdAnimationFrameRef.current) return;
        clearUnlockHintTimeout();
        setShowUnlockHint(false);
        holdStartTimeRef.current = null;
        const duration = 1000;

        const tick = (timestamp: number) => {
            if (!holdStartTimeRef.current) holdStartTimeRef.current = timestamp;
            const elapsed = timestamp - holdStartTimeRef.current;
            const progress = Math.min((elapsed / duration) * 100, 100);
            setHoldProgress(progress);

            if (progress >= 100) {
                if (holdAnimationFrameRef.current) {
                    cancelAnimationFrame(holdAnimationFrameRef.current);
                    holdAnimationFrameRef.current = null;
                }
                handleUnlock();
                return;
            }
            holdAnimationFrameRef.current = requestAnimationFrame(tick);
        };

        holdAnimationFrameRef.current = requestAnimationFrame(tick);
    };

    const handleEndHold = () => {
        const wasHolding = holdAnimationFrameRef.current !== null || holdStartTimeRef.current !== null;
        if (holdAnimationFrameRef.current) {
            cancelAnimationFrame(holdAnimationFrameRef.current);
            holdAnimationFrameRef.current = null;
        }
        holdStartTimeRef.current = null;
        if (!isUnlocked) {
            setHoldProgress(0);
            if (wasHolding) revealUnlockHint();
        }
    };

    const handleUnlock = () => {
        holdStartTimeRef.current = null;
        setShowUnlockHint(false);
        setIsUnlocked(true);
        setIsClosing(true);
        setTimeout(onClose, 700); // Wait for slide up animation
    };

    // Calculate Cycle Progress
    const getCycleProgress = () => {
        if (!activeCycle) return 0;
        const start = buildLocalDateFromString(activeCycle.startDate, 0).getTime();
        const end = buildLocalDateFromString(activeCycle.endDate, 23, 59).getTime();
        const now = new Date().getTime();
        const total = end - start;
        const current = now - start;
        return Math.min(Math.max((current / total) * 100, 0), 100);
    };

    const cycleProgress = getCycleProgress();
    const daysLeft = activeCycle ? Math.ceil((buildLocalDateFromString(activeCycle.endDate, 23, 59).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const actionSessionProgressPercent = actionSessionSnapshot?.progressPercent ?? 0;

    if (actionSession) {
        return (
            <Portal>
                <div className="fixed inset-0 z-[20000] bg-black flex flex-col items-center justify-start pt-20 overflow-hidden">
                    <div className="absolute inset-0 opacity-40 pointer-events-none">
                        <SephirotFog
                            mode="deepwork"
                            color={actionSessionTimeLeft < 0 ? '#fbbf24' : '#22d3ee'}
                            points={[{ x: 50, y: 50, level: 1 }]}
                        />
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%)] pointer-events-none" />
                    <div className="absolute top-5 left-5 right-5 z-20 flex items-center justify-between gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/78 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white"
                        >
                            Voltar ao app
                        </button>
                        <button
                            onClick={() => onClearActionSession?.()}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/45 text-gray-300 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white"
                            aria-label="Encerrar sessao de foco"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="relative z-10" onClick={e => e.stopPropagation()}>
                        <FocusAudioPlayer />
                    </div>

                    <div className="relative z-10 flex flex-1 w-full max-w-md flex-col items-center justify-between px-6 pb-14 pt-8">
                        <div className="flex flex-col items-center text-center">
                            <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full border backdrop-blur-md ${actionSessionTimeLeft < 0 ? 'border-amber-400/30 bg-amber-400/12 text-amber-200' : 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200'}`}>
                                <EmojiGlyph symbol={actionSession.actionIcon || '📝'} size="action" className="text-3xl" />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-[0.34em] text-white/45">
                                {actionSessionTimeLeft < 0 ? 'Tempo excedido' : 'Acao ativa'}
                            </div>
                            <h2 className="mt-3 max-w-[16rem] text-2xl font-black uppercase tracking-[0.08em] text-white">
                                {actionSession.actionName}
                            </h2>
                            <div className={`mt-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${actionSessionTimeLeft < 0 ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-cyan-400/18 bg-cyan-400/10 text-cyan-200'}`}>
                                {actionSession.durationMinutes} min de foco
                            </div>
                        </div>

                        <div className="relative flex flex-col items-center">
                            <div className={`absolute inset-[-28px] rounded-full blur-3xl ${actionSessionTimeLeft < 0 ? 'bg-amber-400/18' : 'bg-cyan-400/18'}`} />
                            <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-white/10 bg-black/30 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-md">
                                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
                                    <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                                    <circle
                                        cx="120"
                                        cy="120"
                                        r="108"
                                        fill="none"
                                        stroke={actionSessionTimeLeft < 0 ? '#fbbf24' : '#22d3ee'}
                                        strokeWidth="8"
                                        strokeDasharray="678.58"
                                        strokeDashoffset={678.58 - (678.58 * actionSessionProgressPercent) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-300 ease-out"
                                        style={{ filter: 'drop-shadow(0 0 14px rgba(34,211,238,0.26))' }}
                                    />
                                </svg>
                                <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                                    <div className={`text-4xl font-light tracking-widest tabular-nums font-mono ${actionSessionTimeLeft < 0 ? 'text-amber-200 drop-shadow-[0_0_14px_rgba(251,191,36,0.32)]' : 'text-cyan-200 drop-shadow-[0_0_14px_rgba(34,211,238,0.32)]'}`}>
                                        {formatActionSessionTime(actionSessionTimeLeft)}
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.34em] text-white/40">
                                        Deep Work
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex w-full flex-col items-center gap-4">
                            <button
                                onMouseDown={handleActionSessionComplete}
                                onMouseUp={clearActionSessionCompleteHold}
                                onMouseLeave={clearActionSessionCompleteHold}
                                onTouchStart={handleActionSessionComplete}
                                onTouchEnd={clearActionSessionCompleteHold}
                                onTouchCancel={clearActionSessionCompleteHold}
                                disabled={isActionSessionCompleted}
                                className={`relative w-full max-w-sm overflow-hidden rounded-[1.6rem] border px-5 py-4 text-left transition-all ${isActionSessionCompleted ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-black/42 text-white hover:border-[var(--skin-accent-color)]/35 hover:bg-black/50'}`}
                                style={{ touchAction: 'none' }}
                            >
                                <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/5">
                                    <div
                                        className="h-full bg-[var(--skin-accent-color)] transition-all duration-75"
                                        style={{ width: `${actionSessionCompleteProgress}%` }}
                                    />
                                </div>
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-full border ${isActionSessionCompleted ? 'border-emerald-400/30 bg-emerald-400/12' : 'border-[var(--skin-accent-color)]/28 bg-[var(--skin-accent-color)]/12'}`}>
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-semibold leading-none">
                                            {isActionSessionCompleted ? 'Acao concluida' : 'Completar agora'}
                                        </div>
                                        <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                                            {isActionSessionCompleting ? 'Concluindo' : 'Segure 1s para concluir'}
                                        </div>
                                    </div>
                                </div>
                            </button>

                            <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                                O cronometro continua se voce voltar ao app.
                            </div>
                        </div>
                    </div>
                </div>
            </Portal>
        );
    }

    // If Deep Work is Active, show immersive screen
    if (deepWorkActive && isDeepWorkImmersive) {
        return (
            <Portal>
                <div
                    className="fixed inset-0 z-[20000] bg-black flex flex-col items-center justify-start pt-32 cursor-pointer overflow-hidden"
                    onClick={toggleCancelVisibility}
                >
                    <div className="absolute top-5 left-5 right-5 z-20 flex items-center justify-between gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeepWorkImmersive(false);
                                setShowCancelButton(false);
                            }}
                            className="rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/78 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white"
                        >
                            Voltar ao descanso
                        </button>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                        <FocusAudioPlayer />
                    </div>
                    {/* Fog Background - Passando pontos dummy para garantir renderização */}
                    <div className="absolute inset-0 opacity-40 pointer-events-none">
                        <SephirotFog
                            mode="deepwork"
                            color="#22d3ee"
                            points={[{ x: 50, y: 50, level: 1 }]} // Pontos mínimos para o shader não reclamar
                        />
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-4 pointer-events-none opacity-80">
                        {/* Relógio menor e mais discreto */}
                        <div className="w-32 h-32 rounded-full border border-cyan-500/5 flex items-center justify-center relative">
                            {/* Anéis de rotação mais sutis */}
                            <div className="absolute inset-0 border border-cyan-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
                            <div className="absolute inset-2 border border-cyan-500/5 rounded-full animate-[spin_30s_linear_infinite_reverse]" />

                            <div className="text-2xl font-light text-cyan-400/80 tracking-widest tabular-nums font-mono drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                                {formatDeepWorkTime(deepWorkTimeLeft)}
                            </div>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-500/30">
                            Deep Work
                        </div>
                    </div>

                    {showCancelButton && (
                        <div
                            className="absolute bottom-20 z-20 animate-fade-in"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onMouseDown={(e) => handleCancelStart(e)}
                                onMouseUp={(e) => handleCancelEnd(e)}
                                onMouseLeave={(e) => handleCancelEnd(e)}
                                onTouchStart={(e) => handleCancelStart(e)}
                                onTouchEnd={(e) => handleCancelEnd(e)}
                                className="relative w-24 h-24 rounded-full bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-sm group hover:border-white/20 transition-all active:scale-95"
                                style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
                            >
                                {/* Progress Ring SVG */}
                                <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                    {/* Background Track */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="46"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="2"
                                    />
                                    {/* Progress Arc */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="46"
                                        fill="none"
                                        stroke="#ffffff"
                                        strokeWidth="3"
                                        strokeDasharray="289" // 2 * pi * 46
                                        strokeDashoffset={289 - (289 * cancelProgress) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-75 ease-linear"
                                        style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }}
                                    />
                                </svg>

                                <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-active:bg-white/20 transition-colors">
                                        <XCircleIcon className="w-4 h-4 text-gray-400 group-active:text-white" />
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 group-active:text-white transition-colors">
                                        Segure
                                    </span>
                                </div>
                            </button>
                            <div className="text-[8px] text-gray-600 text-center mt-3 uppercase tracking-widest opacity-0 animate-fade-in delay-75">
                                Para Cancelar
                            </div>
                        </div>
                    )}
                </div>
            </Portal>
        );
    }

    return (
        <Portal>
            <div
                className={`restscreen-root fixed inset-0 z-[150] flex flex-col items-center justify-start gap-2 transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] border-x border-y ${softVisuals ? 'border-[var(--ui-core-surface-border)]' : 'border-[var(--skin-accent-color)]/20'} ${mounted && !isClosing ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ touchAction: 'none', background: 'var(--app-background)' }} // Prevent scrolling
            >
                {/* Sephirot Fog Background */}
                <div className="absolute inset-0 z-0 pointer-events-none" style={{ opacity: softVisuals ? (isLightTheme ? 0.1 : 0.18) : 0.42 }}>
                    <SephirotFog
                        points={[{ x: 50, y: 52, level: 8 }]}
                        color={softVisuals ? (isLightTheme ? 'rgba(108, 125, 146, 0.55)' : 'rgba(176, 194, 214, 0.36)') : (currentMood?.color || 'var(--skin-accent-color)')}
                        mode="arena"
                        alphaMaxOverride={softVisuals ? 0.12 : 0.2}
                    />
                </div>

                {/* Ambient Smoke Layer */}
                <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${softVisuals ? 'opacity-45' : ''}`}>
                    <div
                        className="absolute inset-0 animate-smoke-slow"
                        style={{
                            background: softVisuals
                                ? (isLightTheme
                                    ? 'linear-gradient(180deg, transparent 0%, rgba(121, 139, 160, 0.08) 48%, transparent 100%)'
                                    : 'linear-gradient(180deg, transparent 0%, rgba(176, 192, 212, 0.07) 48%, transparent 100%)')
                                : 'linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--skin-accent-color) 5%, transparent) 50%, transparent 100%)',
                        }}
                    />
                    <div
                        className="absolute inset-0 animate-smoke-slow-reverse"
                        style={{
                            background: softVisuals
                                ? (isLightTheme
                                    ? 'linear-gradient(90deg, transparent 0%, rgba(103, 120, 141, 0.07) 48%, transparent 100%)'
                                    : 'linear-gradient(90deg, transparent 0%, rgba(166, 182, 203, 0.06) 48%, transparent 100%)')
                                : 'linear-gradient(to right, transparent 0%, color-mix(in srgb, var(--skin-accent-color) 5%, transparent) 50%, transparent 100%)',
                        }}
                    />

                    {/* Floating Blur Layers */}
                    <div className={`absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[96px] animate-float ${softVisuals ? 'w-56 h-56' : 'w-64 h-64 bg-[var(--skin-accent-color)]/8'}`} style={softVisuals ? { background: isLightTheme ? 'rgba(145, 161, 181, 0.10)' : 'rgba(173, 189, 208, 0.07)' } : undefined} />
                    <div className={`absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] animate-float-delayed ${softVisuals ? 'w-64 h-64' : 'w-72 h-72 bg-[var(--skin-accent-color)]/7'}`} style={softVisuals ? { background: isLightTheme ? 'rgba(130, 146, 166, 0.08)' : 'rgba(160, 177, 198, 0.06)' } : undefined} />

                    {/* Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
                </div>

                {actionSession && (
                    <button
                        onClick={() => onClearActionSession?.()}
                        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full border border-white/10 bg-black/45 backdrop-blur-md flex items-center justify-center text-gray-300 hover:text-white hover:border-white/20 transition-colors"
                        aria-label="Fechar cronometro da acao"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                )}

                {/* Top Section: Profile & Clock */}
                <div className="w-full max-w-md p-2 pt-8 flex flex-col items-center gap-1 z-10 shrink-0">
                    {/* Profile Section */}
                    <div className="flex flex-col items-center gap-1 animate-fade-in-down">
                        <div className="relative w-16 h-16 flex items-center justify-center">
                            {/* Avatar Container */}
                            <div className="w-full h-full flex items-center justify-center">
                                {userProfile.avatarUrl ? (
                                    <img src={userProfile.avatarUrl} alt="Avatar" className="rounded-full object-cover" style={avatarInsetStyle} />
                                ) : (
                                    <div
                                        className="rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-xl font-black text-gray-500"
                                        style={avatarInsetStyle}
                                    >
                                        {userProfile.nickname?.[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* Border Overlay */}
                            <div
                                className="absolute inset-0 w-full h-full pointer-events-none z-40"
                                style={
                                    selectedBorder?.imageUrl
                                        ? {
                                            backgroundImage: `url(${selectedBorder.imageUrl})`,
                                            backgroundSize: 'contain',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat',
                                        }
                                        : {
                                            border: '2px solid var(--skin-accent-color)',
                                            borderRadius: '50%',
                                        }
                                }
                            />

                            {/* Bolinha estilo header: mostra o mesmo Indice Glyph (0-100) que o header. */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-900/90 rounded-full w-5 h-5 flex items-center justify-center border shadow-lg z-50" style={{ borderColor: 'var(--skin-accent-color)' }}>
                                <span className="text-[10px] font-black text-white">{masteryIndex}</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-[9px] font-bold text-white/60 uppercase tracking-widest">{userProfile.nickname}</h3>
                        </div>
                    </div>

                    {/* Digital Clock & Status */}
                    <div className="flex flex-col items-center animate-fade-in delay-200">
                        {actionSession && (
                            <div className="mb-3 max-w-[18rem] rounded-full border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.28)]">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-[var(--skin-accent-color)]/12 border border-[var(--skin-accent-color)]/25 flex items-center justify-center text-sm shrink-0">
                                        <EmojiGlyph symbol={actionSession.actionIcon || '📝'} size="action" className="text-white" />
                                    </div>
                                    <div className="min-w-0 text-left">
                                        <div className="text-[9px] uppercase tracking-[0.18em] text-gray-500 font-black">Acao atual</div>
                                        <div className="text-xs font-semibold text-white truncate">{actionSession.actionName}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="text-4xl font-light text-[var(--skin-accent-color)] tracking-tighter tabular-nums drop-shadow-[0_0_20px_var(--skin-accent-color)]">
                            {actionSession ? formatActionSessionTime(actionSessionTimeLeft) : deepWorkActive ? formatDeepWorkTime(deepWorkTimeLeft) : formatTime(currentTime)}
                        </div>

                        {/* Date/Status */}
                        <div className="mt-1 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.28em] opacity-70">
                            <span className={`${actionSession && actionSessionTimeLeft < 0 ? 'text-amber-300' : 'text-[var(--skin-accent-color)]'}`}>
                                {actionSession ? (actionSessionTimeLeft < 0 ? 'TEMPO EXCEDIDO' : 'ACAO EM CURSO') : deepWorkActive ? 'DEEP WORK ATIVO' : formatDate(currentTime)}
                            </span>
                            {actionSession && (
                                <span className={`rounded-full border px-2 py-1 text-[7px] tracking-[0.18em] ${actionSessionTimeLeft < 0 ? 'border-amber-400/20 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-white/[0.04] text-gray-400'}`}>
                                    {actionSessionTimeLeft < 0 ? 'EXTRA' : 'RODANDO'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>


                {/* Center Section: Resumo Diario */}
                <div className="flex-1 flex min-h-0 w-full items-center justify-center px-4 pb-2 z-10 animate-fade-in overflow-hidden">
                    <div className={`relative flex w-full flex-col group transition-[max-width,transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSitrepLocked ? 'max-w-[21rem] translate-y-1' : 'max-w-md translate-y-0'}`}>
                        {/* Decorative background glow */}
                        <div className={`absolute rounded-3xl -z-10 bg-black/20 blur-2xl transition-all duration-500 ${isSitrepLocked ? 'inset-x-6 inset-y-0 opacity-60' : 'inset-0 opacity-90'}`} />

                        <GlassCard
                            id="sitrep-embedded-card"
                            variant="neutral"
                            className={`restscreen-neutral-shell rounded-[2rem] flex flex-col gap-2 shadow-2xl relative overflow-hidden transition-[max-height,padding,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSitrepLocked ? 'p-3 max-h-[5.2rem]' : 'p-4 max-h-[min(76vh,42rem)]'}`}
                        >
                            {/* Header / Lock Control */}
                            {isSitrepLocked ? (
                                <button
                                    type="button"
                                    onClick={handleDailyPanelOpen}
                                    className="group/daily relative w-full overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/28 px-3.5 py-3 text-left transition-all duration-300 ease-out hover:border-[var(--skin-accent-color)]/34 hover:bg-black/40 active:scale-[0.99]"
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.72),transparent)] opacity-70 transition-opacity group-hover/daily:opacity-100" />
                                    <div className="flex min-w-0 items-center gap-2">
                                        <LockIcon className="h-3.5 w-3.5 shrink-0 text-[var(--skin-accent-color)]/85" />
                                        <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-[0.12em] text-white/82">
                                            {dailyPanelSummary}
                                        </span>
                                        <ArrowRightIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-white/42 transition-transform group-hover/daily:translate-x-0.5" />
                                    </div>
                                </button>
                            ) : (
                                <div className="flex items-center justify-between border-b border-white/8 pb-2 shrink-0 transition-all duration-300 ease-out animate-fade-in">
                                    <div className="flex items-center gap-2">
                                        <div className="restscreen-neutral-pill w-8 h-8 rounded-xl flex items-center justify-center">
                                            <CheckCircleIcon className="w-4 h-4 text-[var(--skin-accent-color)]" />
                                        </div>
                                        <div>
                                            <h2 className="restscreen-neutral-label text-[10px] font-black uppercase tracking-[0.2em]">RESUMO DIARIO</h2>
                                            <div className="restscreen-neutral-title text-xs font-bold uppercase tracking-wider">
                                                Acoes e ciclo
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className={`restscreen-neutral-pill hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] sm:flex ${isSitrepLocked ? 'text-gray-300' : 'text-[var(--skin-accent-color)]'}`}>
                                            {isSitrepLocked ? <EyeIcon className="w-3 h-3" /> : <CheckCircleIcon className="w-3 h-3" />}
                                            <span>{sitrepStatusLabel}</span>
                                        </div>
                                        <button
                                            onClick={() => setIsSitrepLocked(!isSitrepLocked)}
                                            className={`restscreen-neutral-pill inline-flex items-center gap-2 rounded-full border px-3 py-2 transition-all hover:bg-black/70 ${isSitrepLocked ? 'text-white' : 'text-[var(--skin-accent-color)]'}`}
                                        >
                                            {isSitrepLocked ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}
                                            <span className="text-[9px] font-black uppercase tracking-[0.18em]">{sitrepStatusLabel}</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Content Area */}
                            <div className={`overflow-y-auto custom-scrollbar transition-[max-height,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isSitrepLocked ? 'max-h-0 scale-y-95 translate-y-[-8px] opacity-0 pointer-events-none' : 'flex-1 max-h-[calc(min(76vh,42rem)-5.5rem)] scale-y-100 translate-y-0 opacity-100 pointer-events-auto'}`}>
                                {!isSitrepLocked && <SitrepContent />}
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* Bottom Section: Indicators & Unlock */}
                <div className="flex-none mb-8 flex flex-col items-center gap-6 z-10 w-full px-6">
                    {actionSession && (
                        <div className="w-full max-w-sm mb-2 flex justify-center">
                            <button
                                onMouseDown={handleActionSessionComplete}
                                onMouseUp={clearActionSessionCompleteHold}
                                onMouseLeave={clearActionSessionCompleteHold}
                                onTouchStart={handleActionSessionComplete}
                                onTouchEnd={clearActionSessionCompleteHold}
                                disabled={isActionSessionCompleted}
                                className={`relative overflow-hidden rounded-full border px-4 py-3 text-left transition-all ${isActionSessionCompleted ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-black/38 text-white hover:border-[var(--skin-accent-color)]/35 hover:bg-black/48'}`}
                                style={{ touchAction: 'none' }}
                            >
                                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
                                    <div
                                        className="h-full bg-[var(--skin-accent-color)] transition-all duration-75"
                                        style={{ width: `${actionSessionCompleteProgress}%` }}
                                    />
                                </div>
                                <div className="relative z-10 flex items-center gap-3 pr-2">
                                    <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${isActionSessionCompleted ? 'border-emerald-400/25 bg-emerald-400/10' : 'border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/10'}`}>
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs font-semibold leading-none">{isActionSessionCompleted ? 'Acao concluida' : 'Concluir acao'}</div>
                                        <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-gray-500 font-black">
                                            {isActionSessionCompleting ? 'Concluindo' : 'Segure 1s para concluir'}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Quick Indicators Row */}
                    <div className="flex items-center justify-center gap-4 animate-fade-in delay-500">
                        <button
                            onMouseDown={() => handleQuickActionStart('checklist')}
                            onMouseUp={handleQuickActionEnd}
                            onMouseLeave={handleQuickActionEnd}
                            onTouchStart={() => handleQuickActionStart('checklist')}
                            onTouchEnd={handleQuickActionEnd}
                            className="flex min-h-[4rem] min-w-[3.75rem] touch-manipulation flex-col items-center justify-center gap-1.5 group active:scale-95 transition-transform relative"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg group-hover:border-[var(--skin-accent-color)]/50 transition-colors relative overflow-hidden ${actionProgress?.id === 'checklist' ? 'scale-110 border-[var(--skin-accent-color)]' : ''}`}>
                                {actionProgress?.id === 'checklist' && (
                                    <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="48"
                                            fill="none"
                                            stroke="var(--skin-accent-color)"
                                            strokeWidth="4"
                                            strokeDasharray="301.6"
                                            strokeDashoffset={301.6 - (301.6 * actionProgress.progress) / 100}
                                        />
                                    </svg>
                                )}
                                <CheckCircleIcon className="w-5 h-5 text-[var(--skin-accent-color)]" />
                                {checklistTotalCount > 0 && (
                                    <div className="absolute -right-0.5 -top-0.5 min-w-[1rem] rounded-full border border-black/40 bg-black/80 px-1 py-[1px] text-[8px] font-black leading-none text-white">
                                        {checklistDoneCount}/{checklistTotalCount}
                                    </div>
                                )}
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Checklist</span>
                        </button>

                        {/* Mood Indicator */}
                        <button
                            onMouseDown={() => handleQuickActionStart('mood')}
                            onMouseUp={handleQuickActionEnd}
                            onMouseLeave={handleQuickActionEnd}
                            onTouchStart={() => handleQuickActionStart('mood')}
                            onTouchEnd={handleQuickActionEnd}
                            className="flex min-h-[4rem] min-w-[3.75rem] touch-manipulation flex-col items-center justify-center gap-1.5 group active:scale-95 transition-transform relative"
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg group-hover:border-[var(--skin-accent-color)]/50 transition-colors relative overflow-hidden ${actionProgress?.id === 'mood' ? 'scale-110 border-[var(--skin-accent-color)]' : ''}`}
                                style={{ borderColor: `${currentMood?.color}40` }}
                            >
                                {/* Individual Progress Ring */}
                                {actionProgress?.id === 'mood' && (
                                    <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="48"
                                            fill="none"
                                            stroke="var(--skin-accent-color)"
                                            strokeWidth="4"
                                            strokeDasharray="301.6"
                                            strokeDashoffset={301.6 - (301.6 * actionProgress.progress) / 100}
                                        />
                                    </svg>
                                )}
                                <div
                                    className="w-5 h-5 rounded-full shadow-[0_0_10px_currentColor]"
                                    style={{ backgroundColor: currentMood?.color, color: currentMood?.color }}
                                />
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Humor</span>
                        </button>

                        {/* ORACLE INDICATOR */}
                        <button
                            type="button"
                            onClick={() => handleQuickAction('real_oracle')}
                            className="flex min-h-[4rem] min-w-[3.75rem] touch-manipulation flex-col items-center justify-center gap-1.5 group active:scale-95 transition-transform relative"
                            aria-label="Abrir Oraculo"
                        >
                            <div className="relative flex h-12 w-12 items-center justify-center overflow-visible">
                                {actionProgress?.id === 'real_oracle' && (
                                    <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="48"
                                            fill="none"
                                            stroke="#fbbf24"
                                            strokeWidth="4"
                                            strokeDasharray="301.6"
                                            strokeDashoffset={301.6 - (301.6 * actionProgress.progress) / 100}
                                        />
                                    </svg>
                                )}
                                <OracleSpeakerMark
                                    tone={oracleTone}
                                    size="sm"
                                    pulse={oracleUnreadCount > 0}
                                    className={`transition-transform group-hover:scale-105 ${actionProgress?.id === 'real_oracle' ? 'scale-110' : ''}`}
                                />
                                {oracleUnreadCount > 0 && (
                                    <span className={`absolute -right-1 -top-1 z-20 flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[9px] font-black leading-none ${oracleBadgeClass}`}>
                                        {oracleUnreadCount > 9 ? '9+' : oracleUnreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Oráculo</span>
                        </button>

                        {/* Deep Work Indicator */}
                        <button
                            id="deep-work-button"
                            onMouseDown={() => handleQuickActionStart('deepwork')}
                            onMouseUp={handleQuickActionEnd}
                            onMouseLeave={handleQuickActionEnd}
                            onTouchStart={() => handleQuickActionStart('deepwork')}
                            onTouchEnd={handleQuickActionEnd}
                            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform relative"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg group-hover:border-cyan-400/50 transition-colors relative overflow-hidden ${deepWorkActive ? 'border-cyan-400/50 ring-1 ring-cyan-400/20' : ''} ${actionProgress?.id === 'deepwork' ? 'scale-110 border-cyan-400' : ''}`}>
                                {actionProgress?.id === 'deepwork' && (
                                    <svg className="absolute inset-0 -rotate-90 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="48"
                                            fill="none"
                                            stroke="#22d3ee"
                                            strokeWidth="4"
                                            strokeDasharray="301.6"
                                            strokeDashoffset={301.6 - (301.6 * actionProgress.progress) / 100}
                                        />
                                    </svg>
                                )}
                                <FocusIcon className={`w-5 h-5 ${deepWorkActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Foco</span>
                        </button>

                    </div>

                    <div className="relative flex h-[7rem] flex-col items-center">
                        <button
                            onMouseDown={handleStartHold}
                            onMouseUp={handleEndHold}
                            onMouseLeave={handleEndHold}
                            onTouchStart={handleStartHold}
                            onTouchEnd={handleEndHold}
                            onContextMenu={(e) => e.preventDefault()}
                            style={{
                                WebkitTapHighlightColor: 'transparent',
                                touchAction: 'none',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                WebkitTouchCallout: 'none',
                            } as React.CSSProperties}
                            className="restscreen-unlock-trigger relative group active:scale-95 transition-transform duration-200"
                        >
                            <div className="absolute inset-[-14px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,rgba(212,175,55,0.18)_28%,transparent_72%)] opacity-90 blur-md" />

                            <div className="restscreen-unlock-ring absolute inset-0 rounded-full border-2 border-white/10" />

                            {/* Button Content */}
                            <div className="restscreen-unlock-core w-[4.5rem] h-[4.5rem] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),rgba(0,0,0,0.78))] backdrop-blur-md border border-[var(--skin-accent-color)]/35 flex items-center justify-center relative z-10 overflow-hidden shadow-[0_0_25px_rgba(212,175,55,0.20)]">
                                <div className="absolute inset-[4px] rounded-full overflow-hidden">
                                    <div
                                        className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(212,175,55,0.24)_40%,rgba(212,175,55,0.52)_100%)] transition-[height] duration-75 ease-linear"
                                        style={{ height: `${holdProgress}%` }}
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--skin-accent-color)]/20 via-white/5 to-transparent opacity-90" />
                                {isUnlocked ? (
                                    <UnlockIcon className="w-7 h-7 text-[var(--skin-accent-color)] animate-unlock drop-shadow-[0_0_10px_var(--skin-accent-color)]" />
                                ) : (
                                    <LockIcon className="w-7 h-7 text-[var(--skin-accent-color)] group-active:text-white transition-colors duration-300 drop-shadow-[0_0_10px_var(--skin-accent-color)]" />
                                )}
                            </div>
                        </button>
                        {shouldShowUnlockHint && (
                            <div className="absolute left-1/2 top-[4.95rem] flex w-[13rem] -translate-x-1/2 flex-col items-center gap-0.5 text-center animate-fade-in">
                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--skin-accent-color)]">
                                    {unlockHint}
                                </span>
                                {!isUnlocked && (
                                    <span className="text-[10px] text-white/55">
                                        Solte antes de completar para cancelar.
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals Overlay */}
                {isMoodOpen && (
                    <MoodModal onClose={() => setIsMoodOpen(false)} />
                )}
                {isChecklistOpen && (
                    <ChecklistModal onClose={() => setIsChecklistOpen(false)} />
                )}
                {isOracleOpen && (
                    <div className="fixed inset-0 z-[10001]">
                        <OracleFeed onClose={() => setIsOracleOpen(false)} />
                    </div>
                )}
                {isClanOpen && clan && (
                    <ClanOverviewModal onClose={() => setIsClanOpen(false)} />
                )}

                {/* Deep Work Selection Modal */}
                {isDeepWorkOpen && (
                    <Portal>
                        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
                            <GlassCard variant="gold" className="w-full max-w-xs p-6 flex flex-col items-center gap-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center border border-cyan-400/30">
                                        <FocusIcon className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Deep Work</h2>
                                    <p className="text-[10px] text-gray-400 text-center uppercase tracking-wider">Selecione o tempo de foco</p>
                                </div>

                                <div className="w-full">
                                    <WheelPicker
                                        options={deepWorkOptions}
                                        value={selectedDeepWorkTime}
                                        onSelect={setSelectedDeepWorkTime}
                                    />
                                    <div className="mt-2 text-center">
                                        <span className="text-[10px] font-black text-cyan-400/60 uppercase">Minutos</span>
                                    </div>
                                </div>

                                <div className="flex w-full gap-3">
                                    <button
                                        onClick={() => setIsDeepWorkOpen(false)}
                                        className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDeepWorkStart}
                                        className="flex-1 py-3 rounded-xl bg-cyan-500 text-[10px] font-black uppercase tracking-widest text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                                    >
                                        Iniciar
                                    </button>
                                </div>
                            </GlassCard>
                        </div>
                    </Portal>
                )}
            </div>
        </Portal>
    );
};











