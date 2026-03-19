import React, { useState, useEffect, useRef } from 'react';
import { Portal } from './Portal';
import { useGame } from '../contexts/GameContext';
import { LockIcon, UnlockIcon, CalendarIcon, CheckCircleIcon, XCircleIcon, SparklesIcon, UsersIcon, ZapIcon, ClockIcon, ShareIcon, XIcon, ArrowRightIcon, EyeIcon } from './Icons';
import { handleShare } from './Share';
import { GlassCard } from './GlassCard';
import { SephirotFog } from './SephirotFog';
import { MoodModal } from './MoodModal';
import { SitrepContent } from './SitrepContent';
import { ClanDetailModal } from './ClanDetailModal';
import { OracleFeed } from './OracleFeed';
import { WheelPicker } from './inputs/WheelPicker';
import { Action, ActionType, Arena, ScheduledTask, DayOfWeek } from '../types';
import { FocusAudioPlayer } from './FocusAudioPlayer';
import { RestScreenActionSessionDetail } from '../utils/restScreenActionSession';
import { showLocalNotification } from '../utils/localNotification';
import { EmojiGlyph } from './EmojiGlyph';
import { SKINS_DATA, BORDERS_DATA } from '../constants';

interface RestScreenProps {
    onClose: () => void;
    onOpenMood?: () => void;
    onOpenOracle?: () => void;
    onOpenClan?: () => void;
    onOpenDeepWork?: () => void;
    actionSession?: RestScreenActionSessionDetail | null;
    onClearActionSession?: () => void;
}

// Helper functions for parsing (duplicated from PlannerView for now, could be moved to utils)
const normalizeText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
};

const parseDurationMinutes = (text: string): number | null => {
    const match = text.match(/\b(\d+)\s*(m|min|mins|minuto|minutos)\b/i);
    if (match) return parseInt(match[1]);
    const matchHours = text.match(/\b(\d+)\s*(h|hora|horas)\b/i);
    if (matchHours) return parseInt(matchHours[1]) * 60;
    const matchMixed = text.match(/\b(\d+)\s*(h|hora|horas)\s*(\d+)?\b/i);
    if (matchMixed) return parseInt(matchMixed[1]) * 60 + (matchMixed[3] ? parseInt(matchMixed[3]) : 0);
    return null;
};

const parseRepetitions = (text: string): number | null => {
    const match = text.match(/\b(\d+)\s*(x|vez|vezes)\b/i);
    if (match) return parseInt(match[1]);
    return null;
};

const parseTimeMinutes = (text: string): number | null => {
    const match = text.match(/\b(\d{1,2})[:h](\d{2})\b/i);
    if (match) {
        const h = parseInt(match[1]);
        const m = parseInt(match[2]);
        return h * 60 + m;
    }
    const matchH = text.match(/\b(\d{1,2})h\b/i);
    if (matchH) return parseInt(matchH[1]) * 60;
    const matchAt = text.match(/\bas\s*(\d{1,2})\b/i);
    if (matchAt) return parseInt(matchAt[1]) * 60;

    // Fuzzy time periods
    if (text.match(/\b(manha|manhã)\b/i)) return 9 * 60; // 09:00
    if (text.match(/\b(tarde)\b/i)) return 14 * 60; // 14:00
    if (text.match(/\b(noite)\b/i)) return 19 * 60; // 19:00

    return null;
};

const parseDaysOfWeek = (text: string): DayOfWeek[] => {
    const days: DayOfWeek[] = [];
    const normalized = normalizeText(text);
    if (normalized.match(/\b(seg|segunda)\b/)) days.push('SEG');
    if (normalized.match(/\b(ter|terca|terça)\b/)) days.push('TER');
    if (normalized.match(/\b(qua|quarta)\b/)) days.push('QUA');
    if (normalized.match(/\b(qui|quinta)\b/)) days.push('QUI');
    if (normalized.match(/\b(sex|sexta)\b/)) days.push('SEX');
    if (normalized.match(/\b(sab|sabado|sábado)\b/)) days.push('SAB');
    if (normalized.match(/\b(dom|domingo)\b/)) days.push('DOM');

    if (normalized.match(/\b(todos os dias|diariamente)\b/)) return ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
    if (normalized.match(/\b(fim de semana|fds)\b/)) return ['SAB', 'DOM'];
    if (normalized.match(/\b(semana|dias uteis)\b/)) return ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];

    return days;
};

export const RestScreen: React.FC<RestScreenProps> = ({ onClose, onOpenMood, onOpenOracle, onOpenClan, onOpenDeepWork, actionSession = null, onClearActionSession }) => {
    const {
        activeCycle,
        dailyCommitment,
        tasks,
        userProfile,
        currentMood,
        clan,
        assets,
        addArena,
        addAction,
        scheduleTask,
        scheduleMultipleTasks,
        scheduleAndCompleteNow,
        scheduleAndCompleteMilestoneNow,
        getLocalDateString,
        oraclePreferences,
        showToast
    } = useGame();
    const [isClosing, setIsClosing] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const holdAnimationFrameRef = useRef<number | null>(null);
    const holdStartTimeRef = useRef<number | null>(null);
    const unlockHintTimeoutRef = useRef<number | null>(null);
    const actionHoldInterval = useRef<number | null>(null);
    const [actionProgress, setActionProgress] = useState<{ id: string, progress: number } | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showUnlockHint, setShowUnlockHint] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isMoodOpen, setIsMoodOpen] = useState(false);
    const [isOracleOpen, setIsOracleOpen] = useState(false);
    const [isClanOpen, setIsClanOpen] = useState(false);
    const [isSitrepLocked, setIsSitrepLocked] = useState(true); // Default to locked (safe mode)
    const [isDeepWorkOpen, setIsDeepWorkOpen] = useState(false);
    const [selectedDeepWorkTime, setSelectedDeepWorkTime] = useState('25');
    const [deepWorkActive, setDeepWorkActive] = useState(false);
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

    // Quick Action Input State
    const [showQuickActionInput, setShowQuickActionInput] = useState(false);
    const [quickActionInput, setQuickActionInput] = useState('');
    const quickActionInputRef = useRef<HTMLInputElement>(null);

    const deepWorkOptions = ['15', '20', '25', '30', '40', '45', '50', '60', '90', '120'];
    const currentActionSessionTask = actionSession?.taskId ? tasks.find(task => task.id === actionSession.taskId) : null;
    const isActionSessionCompleted = Boolean(currentActionSessionTask?.completed);
    const sitrepStatusLabel = isSitrepLocked ? 'Travado' : 'Liberado';
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
        if (showQuickActionInput && quickActionInputRef.current) {
            quickActionInputRef.current.focus();
        }
    }, [showQuickActionInput]);

    useEffect(() => {
        return () => {
            if (holdAnimationFrameRef.current) {
                cancelAnimationFrame(holdAnimationFrameRef.current);
            }
            clearUnlockHintTimeout();
        };
    }, []);

    const handleQuickActionStart = (action: 'mood' | 'oracle' | 'clan' | 'deepwork' | 'real_oracle' | 'new_action') => {
        if (actionHoldInterval.current) return;

        const startTime = Date.now();
        const duration = 600; // 0.6 seconds to trigger action

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

    const handleQuickAction = (action: 'mood' | 'oracle' | 'clan' | 'deepwork' | 'real_oracle' | 'new_action') => {
        if (action === 'mood') {
            setIsMoodOpen(true);
        } else if (action === 'deepwork') {
            setIsDeepWorkOpen(true);
        } else if (action === 'new_action' || action === 'oracle') { // Handle both just in case
            // New behavior: Open text input overlay instead of OracleFeed
            setShowQuickActionInput(true);
        } else if (action === 'real_oracle') {
            // Open the actual Oracle Feed
            setIsClosing(true);
            setTimeout(() => {
                onClose();
                onOpenOracle?.();
            }, 700);
        } else {
            // For others, close RestScreen and then open the modal via callback
            setIsClosing(true);
            setTimeout(() => {
                onClose();
                if (action === 'clan') onOpenClan?.();
            }, 700);
        }
    };

    const handleQuickActionSubmit = async () => {
        if (!quickActionInput.trim()) return;

        try {
            const input = quickActionInput;

            // Parsing Logic (Copied from PlannerView)
            const splitOracleInput = (input: string) => {
                // Support for @Arena syntax
                const atMatch = input.match(/@(\w+)/);
                if (atMatch) {
                    const arenaName = atMatch[1];
                    const base = input.replace(atMatch[0], '').trim();
                    return { base, arenaName, description: '' };
                }

                const parts = input.split(/(?: em | no | na | para a | para o | > | -> )/i);
                if (parts.length > 1) {
                    const before = parts[0].trim();
                    const after = parts.slice(1).join(' ').trim();

                    // Try to extract description from after part (after parentheses or something?)
                    // For now simple: "Action > Arena"
                    return { base: before, arenaName: after, description: '' };
                }

                // Try to find arena by keyword if no explicit separator
                // (Simplified for now)
                return { base: input, arenaName: '', description: '' };
            };

            const { base, arenaName: explicitArenaName, description } = splitOracleInput(input);
            const duration = parseDurationMinutes(base) ?? 30;
            const repetitions = parseRepetitions(base) ?? 1;
            const startTimeInMinutes = parseTimeMinutes(base);
            const selectedDays = parseDaysOfWeek(base);

            // Clean up name
            const normalizedBase = base;
            const cutPoints = [
                normalizedBase.search(/\b\d+\s*(x|vez|vezes)\b/i),
                normalizedBase.search(/\b(\d{1,2}\s*h\s*\d{1,2}|\d{1,2}\s*(h|hora|horas)|\d+\s*(m|min|mins|minuto|minutos))\b/i),
                normalizedBase.search(/\b(?:as\s*\d{1,2}(?::\d{2})?|\d{1,2}[:h]\d{2}|\d{1,2}h)\b/i),
                normalizedBase.search(/\b(seg|segunda|ter|terca|terça|qua|quarta|qui|quinta|sex|sexta|sab|sabado|sábado|dom|domingo)\b/i),
            ].filter(i => i >= 0);
            const nameEnd = cutPoints.length > 0 ? Math.min(...cutPoints) : normalizedBase.length;
            const actionName = normalizedBase.slice(0, nameEnd).trim();
            const actionDescription = description;

            // Find Target Arena
            let targetArenaId = '';
            let arenaName = explicitArenaName;

            const allArenas = assets.flatMap(asset =>
                asset.arenas.map(arena => ({ arena, assetId: asset.id, normalizedName: normalizeText(arena.name) }))
            );

            const findArena = (name: string) => {
                const normalizedQuery = normalizeText(name);
                const exact = allArenas.find(a => a.normalizedName === normalizedQuery);
                if (exact) return { arena: exact.arena, assetId: exact.assetId };

                let best = null;
                for (const candidate of allArenas) {
                    const candName = candidate.normalizedName;
                    const dist = levenshteinDistance(normalizedQuery, candName);
                    const maxLen = Math.max(normalizedQuery.length, candName.length) || 1;
                    const score = 1 - dist / maxLen;
                    const prefixBonus = candName.startsWith(normalizedQuery) || normalizedQuery.startsWith(candName) ? 0.08 : 0;
                    const finalScore = Math.min(1, score + prefixBonus);
                    if (!best || finalScore > best.score) {
                        best = { arena: candidate.arena, assetId: candidate.assetId, score: finalScore, dist };
                    }
                }

                if (best && (best.dist <= 2 || best.score >= 0.82)) {
                    return { arena: best.arena, assetId: best.assetId };
                }
                return null;
            };

            const geralAsset = assets.find(a => a.id === 'geral') || assets[0];

            if (arenaName) {
                const found = findArena(arenaName);
                if (found) {
                    targetArenaId = found.arena.id;
                } else if (geralAsset) {
                    const newArena = await addArena(geralAsset.id, {
                        name: arenaName,
                        icon: '🏟️',
                        description: 'Arena criada via RestScreen'
                    });
                    targetArenaId = newArena.id;
                }
            }

            if (!targetArenaId) {
                // Try to infer arena from action name if not explicit
                // (Skip for now to keep simple, fallback to Outros)
                const outros = findArena('Outros');
                if (outros) {
                    targetArenaId = outros.arena.id;
                } else if (geralAsset) {
                    const newArena = await addArena(geralAsset.id, {
                        name: 'Outros',
                        icon: '📦',
                        description: 'Arena padrão'
                    });
                    targetArenaId = newArena.id;
                }
            }

            if (!targetArenaId || !actionName) return;

            const actionType: ActionType = startTimeInMinutes !== null && selectedDays.length === 0 ? 'Compromisso' : 'Ação Recorrente';

            const created = await addAction({
                name: actionName,
                description: actionDescription || undefined,
                arenaId: targetArenaId,
                icon: '📝',
                duration,
                difficulty: 'easy',
                actionType,
                repetitions: actionType === 'Ação Recorrente' ? Math.max(1, repetitions) : 1,
            });

            if (actionType === 'Compromisso' && startTimeInMinutes !== null) {
                const dateString = getLocalDateString(new Date());
                await scheduleTask(created, dateString, startTimeInMinutes);
            }

            if (actionType === 'Ação Recorrente' && selectedDays.length > 0 && startTimeInMinutes !== null) {
                await scheduleMultipleTasks(created, selectedDays, startTimeInMinutes);
            }

            setQuickActionInput('');
            setShowQuickActionInput(false);

        } catch (error) {
            console.error("Error creating action from RestScreen:", error);
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
            return;
        }

        actionSessionTimeoutPlayedRef.current = false;
        actionSessionNotificationSentRef.current = false;
        const startedAtMs = new Date(actionSession.startedAt).getTime();
        const totalSeconds = Math.max(1, Math.round(actionSession.durationMinutes * 60));

        const sync = () => {
            const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);
            setActionSessionTimeLeft(totalSeconds - elapsedSeconds);
        };

        sync();
        const interval = window.setInterval(sync, 1000);
        return () => window.clearInterval(interval);
    }, [actionSession]);

    useEffect(() => {
        if (!actionSession || actionSessionTimeLeft > 0 || actionSessionTimeoutPlayedRef.current) return;
        actionSessionTimeoutPlayedRef.current = true;
        playActionSessionTimeoutSound();
    }, [actionSession, actionSessionTimeLeft]);

    useEffect(() => {
        if (!actionSession || actionSessionTimeLeft > 0 || actionSessionNotificationSentRef.current) return;
        if (!oraclePreferences?.pushEnabled) return;

        actionSessionNotificationSentRef.current = true;
        void showLocalNotification({
            title: 'Tempo encerrado',
            body: `A acao "${actionSession.actionName}" passou do tempo.`,
            tag: `action-session-${actionSession.actionId}`,
            url: '/',
        });
    }, [actionSession, actionSessionTimeLeft, oraclePreferences?.pushEnabled]);

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

    const handleStartHold = (event?: React.MouseEvent | React.TouchEvent) => {
        if (event && 'touches' in event && event.cancelable) {
            event.preventDefault();
        }
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
        const start = new Date(activeCycle.startDate).getTime();
        const end = new Date(activeCycle.endDate).getTime();
        const now = new Date().getTime();
        const total = end - start;
        const current = now - start;
        return Math.min(Math.max((current / total) * 100, 0), 100);
    };

    const cycleProgress = getCycleProgress();
    const daysLeft = activeCycle ? Math.ceil((new Date(activeCycle.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // If Deep Work is Active, show immersive screen
    if (deepWorkActive) {
        return (
            <Portal>
                <div
                    className="fixed inset-0 z-[20000] bg-black flex flex-col items-center justify-start pt-32 cursor-pointer overflow-hidden"
                    onClick={toggleCancelVisibility}
                >
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
                className={`fixed inset-0 z-[150] flex flex-col items-center justify-start gap-2 bg-black transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] border-x border-y border-[var(--skin-accent-color)]/20 ${mounted && !isClosing ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ touchAction: 'none' }} // Prevent scrolling
            >
                {/* Sephirot Fog Background */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
                    <SephirotFog
                        points={[{ x: 50, y: 50, level: 10 }]}
                        color={currentMood?.color || 'var(--skin-accent-color)'}
                        mode="arena"
                    />
                </div>

                {/* Ambient Smoke Layer */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--skin-accent-color)]/5 to-transparent animate-smoke-slow" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--skin-accent-color)]/5 to-transparent animate-smoke-slow-reverse" />

                    {/* Floating Blur Layers */}
                    <div className="absolute top-1/4 -left-20 w-64 h-64 bg-[var(--skin-accent-color)]/10 rounded-full blur-[100px] animate-float" />
                    <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[var(--skin-accent-color)]/10 rounded-full blur-[120px] animate-float-delayed" />

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

                            {/* Level Badge - Bolinha Estilo Header */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-900/90 rounded-full w-5 h-5 flex items-center justify-center border shadow-lg z-50" style={{ borderColor: 'var(--skin-accent-color)' }}>
                                <span className="text-[10px] font-black text-white">{userProfile.level}</span>
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


                {/* Center Section: Painel Diário (Main Focus) */}
                <div className="flex-1 flex flex-col items-center justify-start w-full max-w-md px-4 z-10 animate-fade-in overflow-hidden h-full min-h-0 mb-2">
                    <div className="relative w-full h-full flex flex-col group">
                        {/* Decorative background glow */}
                        <div className="absolute inset-0 bg-[var(--skin-accent-color)]/5 blur-2xl rounded-3xl -z-10 transition-all duration-500" />

                        <GlassCard
                            id="sitrep-embedded-card"
                            variant="gold"
                            className="bg-black/60 backdrop-blur-md rounded-[2rem] p-4 flex flex-col gap-2 shadow-2xl relative overflow-hidden h-full border border-white/10"
                        >
                            {/* Header / Lock Control */}
                            <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-[var(--skin-accent-color)]/10 flex items-center justify-center border border-[var(--skin-accent-color)]/30">
                                        <CheckCircleIcon className="w-4 h-4 text-[var(--skin-accent-color)]" />
                                    </div>
                                    <div>
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">PAINEL DIÁRIO</h2>
                                        <div className="text-xs font-bold text-white uppercase tracking-wider">
                                            {dailyCommitment.stage === 'planning' ? 'Planejamento' : dailyCommitment.stage === 'battle' ? 'Combate' : 'Julgamento'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${isSitrepLocked ? 'border-amber-300/25 bg-amber-300/10 text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.10)]' : 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.10)]'}`}>
                                        {isSitrepLocked ? <EyeIcon className="w-3 h-3" /> : <CheckCircleIcon className="w-3 h-3" />}
                                        <span>{sitrepStatusLabel}</span>
                                    </div>
                                    <button
                                        onClick={() => setIsSitrepLocked(!isSitrepLocked)}
                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 transition-all ${isSitrepLocked
                                            ? 'border-amber-300/30 bg-amber-300/12 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.14)] hover:bg-amber-300/18'
                                            : 'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] border border-[var(--skin-accent-color)]/30 shadow-[0_0_20px_rgba(212,175,55,0.14)]'
                                            }`}
                                    >
                                        {isSitrepLocked ? <LockIcon className="w-4 h-4" /> : <UnlockIcon className="w-4 h-4" />}
                                        <span className="text-[9px] font-black uppercase tracking-[0.18em]">{sitrepStatusLabel}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-300 ${isSitrepLocked ? 'opacity-65 saturate-75 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}>
                                <SitrepContent />
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
                        {/* Mood Indicator */}
                        <button
                            onMouseDown={() => handleQuickActionStart('mood')}
                            onMouseUp={handleQuickActionEnd}
                            onMouseLeave={handleQuickActionEnd}
                            onTouchStart={() => handleQuickActionStart('mood')}
                            onTouchEnd={handleQuickActionEnd}
                            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform relative"
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

                        {/* Nova Ação (Input) */}
                        <button
                            onMouseDown={() => handleQuickActionStart('new_action')}
                            onMouseUp={handleQuickActionEnd}
                            onMouseLeave={handleQuickActionEnd}
                            onTouchStart={() => handleQuickActionStart('new_action')}
                            onTouchEnd={handleQuickActionEnd}
                            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform relative"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg group-hover:border-[var(--skin-accent-color)]/50 transition-colors relative overflow-hidden ${actionProgress?.id === 'new_action' ? 'scale-110 border-[var(--skin-accent-color)]' : ''}`}>
                                {actionProgress?.id === 'new_action' && (
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
                                <span className="text-xl">📝</span>
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Nova Ação</span>
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
                                <ZapIcon className={`w-5 h-5 ${deepWorkActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Foco</span>
                        </button>

                        {/* ORIGINAL ORACLE INDICATOR RESTORED */}
                        <button
                            onMouseDown={() => handleQuickActionStart('real_oracle')}
                            onMouseUp={handleQuickActionEnd}
                            onMouseLeave={handleQuickActionEnd}
                            onTouchStart={() => handleQuickActionStart('real_oracle')}
                            onTouchEnd={handleQuickActionEnd}
                            className="flex flex-col items-center gap-1.5 group active:scale-95 transition-transform relative"
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg group-hover:border-amber-400/50 transition-colors relative overflow-hidden ${actionProgress?.id === 'real_oracle' ? 'scale-110 border-amber-400' : ''}`}>
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
                                <SparklesIcon className="w-5 h-5 text-amber-400" />
                            </div>
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter group-hover:text-white transition-colors">Oráculo</span>
                        </button>
                    </div>

                        <div className="flex flex-col items-center gap-2 min-h-[4.5rem] justify-end">
                        <button
                            onMouseDown={handleStartHold}
                            onMouseUp={handleEndHold}
                            onMouseLeave={handleEndHold}
                            onTouchStart={handleStartHold}
                            onTouchEnd={handleEndHold}
                            onContextMenu={(e) => e.preventDefault()}
                            className="relative group active:scale-95 transition-transform duration-200"
                            style={{
                                WebkitTapHighlightColor: 'transparent',
                                touchAction: 'none',
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                WebkitTouchCallout: 'none',
                            } as React.CSSProperties}
                        >
                            <div className="absolute inset-[-14px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,rgba(212,175,55,0.18)_28%,transparent_72%)] opacity-90 blur-md" />

                            <div className="absolute inset-0 rounded-full border-2 border-white/10" />

                            {/* Button Content */}
                            <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),rgba(0,0,0,0.78))] backdrop-blur-md border border-[var(--skin-accent-color)]/35 flex items-center justify-center relative z-10 overflow-hidden shadow-[0_0_25px_rgba(212,175,55,0.20)]">
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
                            <div className="flex flex-col items-center gap-0.5 text-center animate-fade-in">
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
                    <div className="fixed inset-0 z-[10001]">
                        <MoodModal onClose={() => setIsMoodOpen(false)} />
                    </div>
                )}
                {isOracleOpen && (
                    <div className="fixed inset-0 z-[10001]">
                        <OracleFeed onClose={() => setIsOracleOpen(false)} />
                    </div>
                )}
                {isClanOpen && clan && (
                    <div className="fixed inset-0 z-[10001]">
                        <ClanDetailModal clanName={clan.name} onClose={() => setIsClanOpen(false)} />
                    </div>
                )}

                {/* Quick Action Input Overlay */}
                {showQuickActionInput && (
                    <div className="fixed inset-0 z-[10002] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
                        <div className="w-full max-w-md relative">
                            <button
                                onClick={() => setShowQuickActionInput(false)}
                                className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white"
                            >
                                <XIcon className="w-6 h-6" />
                            </button>

                            <div className="flex flex-col gap-4">
                                <h3 className="text-xl font-bold text-white text-center">Nova Ação Rápida</h3>
                                <p className="text-xs text-gray-400 text-center">
                                    Ex: "Ler 30min", "Treino 1h as 18h", "Estudar &gt; Faculdade"
                                </p>

                                <div className="relative">
                                    <input
                                        ref={quickActionInputRef}
                                        type="text"
                                        value={quickActionInput}
                                        onChange={(e) => setQuickActionInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleQuickActionSubmit()}
                                        placeholder="O que você vai fazer?"
                                        className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-[var(--skin-accent-color)] focus:ring-1 focus:ring-[var(--skin-accent-color)] transition-all"
                                    />
                                    <button
                                        onClick={handleQuickActionSubmit}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--skin-accent-color)] rounded-xl text-black font-bold hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Deep Work Selection Modal */}
                {isDeepWorkOpen && (
                    <Portal>
                        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
                            <GlassCard variant="gold" className="w-full max-w-xs p-6 flex flex-col items-center gap-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-cyan-400/10 flex items-center justify-center border border-cyan-400/30">
                                        <ClockIcon className="w-6 h-6 text-cyan-400" />
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











