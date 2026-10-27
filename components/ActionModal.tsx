import { useLeitorEscuro } from '../utils/leitorEscuro';
import './leitor.css';
import { conteudoDaAcao } from '../utils/conteudoDaAcao';
import { getArenaTone, getArenaActionGradient } from '../utils/arenaTones.ts';
import { useScreenIntroTip } from '../hooks/useScreenIntroTip';
﻿import React, { useState, useEffect, useRef } from 'react';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { buildRecurringDates, countRecurringOccurrences, resolveScheduleHorizon } from '../utils/cycleScheduling';
import { Action, DayOfWeek, ActionType, PlannerMatrixQuadrant, ScheduledTask } from '../types';
import { ReferencePlate } from './ReferencePlate';
import { ChevronLeftIcon, ChevronRightIcon, EditIcon, XIcon, CalendarIcon, Trash2Icon, ClockIcon, PlayIcon, CheckCircleIcon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
import { WheelPicker } from './inputs/WheelPicker';
import { ConfirmationModal } from './ConfirmationModal';
import { ArenaSelectionModal } from './ArenaSelectionModal';
import { DatePickerModal } from './DatePickerModal';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { FIRST_USE_ONBOARDING_EVENTS } from '../utils/firstUseOnboarding';
import { getActionSurfaceBadgeClassName, resolveActionSurfaceBadge } from '../utils/actionSurfaceBadges';
import { REST_SCREEN_ACTION_SESSION_CLEAR_EVENT, REST_SCREEN_ACTION_SESSION_EVENT, createRestScreenActionSession } from '../utils/restScreenActionSession';
import { OPERATIONAL_DAY_START_MINUTE, getActualDateStringForOperationalMinutes, getActualStartTimeForOperationalMinutes } from '../utils/operationalDay.js';
import { getArenaDomainFlags } from '../utils/taskDomain';
import { supabase } from '../supabaseClient';
import { requestLocalNotificationPermission } from '../utils/localNotification';
import { hasPremiumAccess } from '../utils/premiumAccess';
import { PRODUCT_FEATURES } from '../constants/featureFlags';

import { Portal } from './Portal';
import { EmojiGlyph } from './EmojiGlyph';
import './core-ui.css';
import './action-layout.css';

const hexToRgb = (hex: string) => {
    const trimmed = hex.trim();
    if (trimmed.startsWith('rgb')) {
        const matches = trimmed.match(/\d+/g);
        if (matches && matches.length >= 3) {
            return { r: parseInt(matches[0]), g: parseInt(matches[1]), b: parseInt(matches[2]) };
        }
    }
    const normalized = trimmed.replace('#', '');
    if (normalized.length === 3 || normalized.length === 6) {
        const value = normalized.length === 3 ?normalized.split('').map(ch => ch + ch).join('') : normalized;
        const intValue = parseInt(value, 16);
        return { r: (intValue >> 16) & 255, g: (intValue >> 8) & 255, b: intValue & 255 };
    }
    return { r: 240, g: 200, b: 67 };
};

const rgbaString = (hex: string, alpha: number) => {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const splitBriefingParagraph = (paragraph: string, maxChars: number) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return [];
    if (trimmed.length <= maxChars) return [trimmed];

    const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(sentence => sentence.trim()).filter(Boolean) ?? [];
    if (sentences.length <= 1) {
        const chunks = trimmed.match(new RegExp(`.{1,${maxChars}}(?:\\s|$)`, 'g'));
        return chunks?.map(chunk => chunk.trim()).filter(Boolean) ?? [trimmed];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    sentences.forEach(sentence => {
        const nextChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
        if (currentChunk && nextChunk.length > maxChars) {
            chunks.push(currentChunk);
            currentChunk = sentence;
            return;
        }
        currentChunk = nextChunk;
    });

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
};

const paginateBriefing = (text?: string, maxChars = 860) => {
    const normalized = text?.replace(/\r\n/g, '\n').trim();
    if (!normalized) return [];

    const pages: string[] = [];
    const manualSections = normalized
        .split(/\n\s*\[\[page\]\]\s*\n/gi)
        .map(section => section.trim())
        .filter(Boolean);

    manualSections.forEach(section => {
        const segments = section
            .split(/\n\s*\n/)
            .map(paragraph => paragraph.trim())
            .filter(Boolean)
            .flatMap(paragraph => splitBriefingParagraph(paragraph, maxChars));

        if (segments.length === 0) return;

        let currentPage = '';

        segments.forEach(segment => {
            const nextPage = currentPage ? `${currentPage}\n\n${segment}` : segment;
            if (currentPage && nextPage.length > maxChars) {
                pages.push(currentPage);
                currentPage = segment;
                return;
            }
            currentPage = nextPage;
        });

        if (currentPage) pages.push(currentPage);
    });

    return pages;
};

interface ActionModalProps {
    arenaId: string;
    action: Action | null;
    taskId?: string; // NEW: support for specific task override
    initialMode: 'view' | 'edit';
    onClose: () => void;
    isPreview?: boolean;
    disableAuthoring?: boolean;
    customThemeColor?: string;
    lockArenaAssignment?: boolean;
    collaborativeLinkedArena?: boolean;
    collaborativeOwnerUserId?: string | null;
    collaborativeArenaTasks?: ScheduledTask[];
    onCollaborativeRefresh?: (() => Promise<void>) | (() => void);
}

type EditScope = 'action' | 'instance';

const ACTION_DURATION_OPTIONS = [
    15, 30, 45, 60, 75, 90, 105, 120,
    150, 180, 210, 240,
    300, 360, 420, 480,
];
const OCCURRENCE_REMINDER_OPTIONS = [5, 10, 15, 30, 60];

const formatDurationLabel = (value: number) => {
    const safeValue = Math.max(0, Math.round(value));
    const hours = Math.floor(safeValue / 60);
    const minutes = safeValue % 60;

    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
};

const normalizeActionDifficulty = (value?: number | null): 0 | 1 | 2 | 3 => {
    const numeric = Number.isFinite(value) ? Number(value) : 2;
    return Math.min(3, Math.max(0, Math.round(numeric))) as 0 | 1 | 2 | 3;
};

const getClosestSnapIndex = (value: number, snapValues: number[]) => {
    if (snapValues.length === 0) return 0;
    const exactIndex = snapValues.findIndex(option => option === value);
    if (exactIndex >= 0) return exactIndex;

    return snapValues.reduce((bestIndex, option, index) => (
        Math.abs(option - value) < Math.abs(snapValues[bestIndex] - value) ? index : bestIndex
    ), 0);
};

const ActionNumberInput: React.FC<{label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void}> = ({label, value, min, max, step, onChange}) => {
    const [draft, setDraft] = useState(String(value));
    useEffect(() => setDraft(String(value)), [value]);
    return <input aria-label={label} type="number" inputMode="numeric" min={min} max={max} step={step} value={draft}
        onChange={event => {
            const next = event.target.value;
            setDraft(next);
            const number = Number(next);
            if (next !== '' && Number.isInteger(number) && number >= min && number <= max) onChange(number);
        }}
        onBlur={() => {
            const number = draft.trim() === '' ? value : Number(draft);
            const next = Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : value;
            setDraft(String(next)); onChange(next);
        }} />;
};

const StyledRangeInput: React.FC<{ label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (val: number) => void, inputRef?: React.Ref<HTMLDivElement>, containerId?: string, snapValues?: number[], formatValue?: (val: number) => string, comBotoes?: boolean }> =
    ({ label, value, min, max, step, unit, onChange, inputRef, containerId, snapValues, formatValue, comBotoes }) => (
        <div id={containerId} ref={inputRef} className="action-range">
            <div className="flex justify-between items-center">
                <label className="core-label">{label}</label>
                {/* `comBotoes`: - e + de um em um (16/10, repeticoes). Ir de 5 para 6
                    pedia acertar o slider no ponto ou apagar e digitar. */}
                <div className="action-number">
                    {comBotoes && <button type="button" className="action-step" aria-label={`Menos ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>−</button>}
                    <label className="action-number"><ActionNumberInput label={`${label} em ${unit}`} value={value} min={min} max={max} step={step} onChange={onChange} /><span>{unit}</span></label>
                    {comBotoes && <button type="button" className="action-step" aria-label={`Mais ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>+</button>}
                </div>
            </div>
            <input
                type="range"
                aria-label={label}
                min={snapValues ? 0 : min}
                max={snapValues ? Math.max(0, snapValues.length - 1) : max}
                step={snapValues ? 1 : step}
                value={snapValues ? getClosestSnapIndex(value, snapValues) : value}
                onChange={e => {
                    const nextValue = Number(e.target.value);
                    onChange(snapValues ? snapValues[nextValue] ?? value : nextValue);
                }}
                aria-valuetext={formatValue ? formatValue(value) : `${value} ${unit}`}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-[var(--skin-accent-color)]"
            />
            {(formatValue || unit === 'x') && <div className="reference-range-scale"><span>{min} {unit}</span>{formatValue && <output className="action-duration-equivalent">{formatValue(value)}</output>}<span>{max === 480 ? '8h' : `${max} ${unit}`}</span></div>}
        </div>
    );

const DayToggle: React.FC<{ day: DayOfWeek, selected: boolean, onClick: () => void }> = ({ day, selected, onClick }) => (
    <button type="button" onClick={onClick} className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors border ${selected ?'bg-[var(--skin-accent-color)] text-white border-[var(--skin-accent-color)]' : 'core-surface text-gray-300 hover:bg-white/[0.06]'}`}>
        {day.slice(0, 3)}
    </button>
);

const PLANNER_MATRIX_OPTIONS: Array<{
    value: PlannerMatrixQuadrant;
    label: string;
    title: string;
}> = [
    { value: 'ui', label: 'UI', title: 'Urgente + Importante' },
    { value: 'nui', label: 'NUI', title: 'Não urgente + Importante' },
    { value: 'uni', label: 'UNI', title: 'Urgente + Não importante' },
    { value: 'nuni', label: 'NUNI', title: 'Não urgente + Não importante' },
];

const ACTION_TYPE_CHOICES: Array<{
    value: ActionType;
    title: string;
    subtitle: string;
    glyph: string;
}> = [
    {
        value: 'Ação Recorrente',
        title: 'Recorrente',
        subtitle: 'Com contador',
        glyph: '↻',
    },
    {
        value: 'Compromisso',
        title: 'Compromisso',
        subtitle: 'Data e hora',
        glyph: '⌚',
    },
    {
        value: 'Marco',
        title: 'Marco',
        subtitle: 'Objetivo único',
        glyph: '◆',
    },
    {
        value: 'Livre',
        title: 'Livre',
        subtitle: 'Sem contador',
        glyph: '+',
    },
];

const ActionSectionCard: React.FC<{ title?: string; subtitle?: string; children: React.ReactNode; className?: string }> = ({ title, subtitle, children, className = '' }) => (
    <div className={`rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(0,0,0,0.14))] px-3.5 py-3.5 ${className}`}>
        {(title || subtitle) && (
            <div className="mb-3">
                {title && <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]/90">{title}</div>}
                {subtitle && <p className="mt-1 text-[11px] leading-relaxed text-white/55">{subtitle}</p>}
            </div>
        )}
        <div className="space-y-3">{children}</div>
    </div>
);

export const ActionModal: React.FC<ActionModalProps> = ({
    arenaId,
    action,
    taskId,
    initialMode,
    onClose,
    isPreview,
    disableAuthoring = false,
    customThemeColor,
    lockArenaAssignment = false,
    collaborativeLinkedArena = false,
    collaborativeOwnerUserId = null,
    collaborativeArenaTasks = [],
    onCollaborativeRefresh,
}) => {
    const { addAction, updateAction, deleteAction, getArenas, scheduleMultipleTasks, scheduleTask, clearPendingTasksForAction, scheduleAndCompleteNow, tasks, updateTask, activeCycle, clan, enrichedClanMembers, showToast, userCodexes, oraclePreferences, updateOraclePreferences, userProfile } = useGame();

    const isNew = !action;
    const isInstalledCodexAction = Boolean(action?.originCodexId && !action.originCodexId.startsWith('assign:'));
    const installedCodex = React.useMemo(
        () => (action?.originCodexId ? userCodexes.find(codex => codex.id === action.originCodexId) ?? null : null),
        [action?.originCodexId, userCodexes]
    );

    const [mode, setMode] = useState(isNew && !isPreview ?'edit' : initialMode);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [editableAction, setEditableAction] = useState<Partial<Action>>(
        action
            ? { ...action, difficulty: normalizeActionDifficulty(action.difficulty) }
            : { arenaId: arenaId, name: '', description: '', icon: '📝', duration: 60, repetitions: 1, actionType: 'Ação Recorrente', difficulty: 2 }
    );

    // NEW: Task duration override state
    const currentTask = taskId ?tasks.find(t => t.id === taskId) : null;
    const hasTaskInstanceContext = Boolean(taskId && currentTask);
    const startNowTask = React.useMemo(() => {
        if (!action) return null;

        const today = getLocalDateString(new Date());
        if (currentTask && currentTask.date === today && !currentTask.completed) {
            return currentTask;
        }

        return tasks.find(task => task.actionId === action.id && task.date === today && !task.completed) || null;
    }, [action, currentTask, tasks]);
    const canStartNow = mode === 'view' && !isPreview && Boolean(startNowTask);
    // Concluir a leitura pelo leitor: a ocorrencia aberta (se ainda pendente), a de
    // hoje, ou uma nova na hora do toque (scheduleAndCompleteNow decide).
    const [concluindoLeitura, setConcluindoLeitura] = useState(false);
    const [leitorEscuro, alternarLeitorEscuro] = useLeitorEscuro();
    const tarefaDaLeitura = currentTask && !currentTask.completed ? currentTask : startNowTask;
    const podeConcluirLeitura = mode === 'view' && !isPreview && !disableAuthoring && Boolean(action) && !(currentTask?.completed);
    const concluirLeitura = async () => {
        if (!action || concluindoLeitura) return;
        setConcluindoLeitura(true);
        try {
            await scheduleAndCompleteNow(action.id, tarefaDaLeitura?.id);
            showToast('Leitura concluída.', 'success');
            setIsBriefingReaderOpen(false);
            onClose();
        } catch (error) {
            console.error('Error completing reading:', error);
            showToast('Não foi possível concluir a leitura.', 'error');
        } finally {
            setConcluindoLeitura(false);
        }
    };
    const [editableTaskDuration, setEditableTaskDuration] = useState<number>(currentTask?.duration || action?.duration || 60);
    const [instanceNote, setInstanceNote] = useState(currentTask?.instanceNote || '');
    const inheritedReminderMinutes = Number(action?.context?.schedule?.notifyBeforeMinutes) || null;
    const [instanceReminderEnabled, setInstanceReminderEnabled] = useState(Boolean(currentTask?.reminderEnabled ?? inheritedReminderMinutes));
    const [instanceReminderMinutes, setInstanceReminderMinutes] = useState<number>(currentTask?.reminderMinutes || inheritedReminderMinutes || 15);
    const [instanceReminderTouched, setInstanceReminderTouched] = useState(false);
    const [editScope, setEditScope] = useState<EditScope>(hasTaskInstanceContext ? 'instance' : 'action');
    const startNowDurationMinutes = startNowTask?.duration || currentTask?.duration || action?.duration || 60;

    // New View Mode State
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
    const [advancedSubTab, setAdvancedSubTab] = useState<'schedule' | 'media' | 'note' | 'checklist' | 'context'>('context');
    const [schedulePanelOpen, setSchedulePanelOpen] = useState(false);
    const [isBriefingReaderOpen, setIsBriefingReaderOpen] = useState(false);
    const [briefingPageIndex, setBriefingPageIndex] = useState(0);
    const [briefingPageStage, setBriefingPageStage] = useState<'idle' | 'out-next' | 'out-prev' | 'in-next' | 'in-prev'>('idle');

    const nameInputRef = useRef<HTMLInputElement>(null);
    const durationInputRef = useRef<HTMLDivElement>(null);
    const repsInputRef = useRef<HTMLDivElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    const briefingReaderPointerStartRef = useRef<number | null>(null);
    const briefingReaderPointerStartYRef = useRef<number | null>(null);
    const briefingReaderTouchStartRef = useRef<number | null>(null);
    const briefingReaderTouchStartYRef = useRef<number | null>(null);
    const briefingReaderTurnTimeoutRef = useRef<number | null>(null);
    const completeNowHoldIntervalRef = useRef<number | null>(null);
    const [completeNowHoldProgress, setCompleteNowHoldProgress] = useState(0);
    const [completeNowTriggered, setCompleteNowTriggered] = useState(false);
    const [isCompletingNowHold, setIsCompletingNowHold] = useState(false);
    const isEditingTaskInstance = mode === 'edit' && hasTaskInstanceContext && editScope === 'instance';
    const isEditingActionBase = mode === 'edit' && (!hasTaskInstanceContext || editScope === 'action');

    // State for checklist inputs in edit mode
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [newAssetUrl, setNewAssetUrl] = useState('');
    const [mediaSlot, setMediaSlot] = useState({ imageUrl: '', caption: '' });

    const dispatchFirstUseEvent = (eventName: string, detail?: Record<string, unknown>) => {
        if (!isNew || isPreview) return;
        window.dispatchEvent(new CustomEvent(eventName, detail ? { detail } : undefined));
    };

    const handleTutorialNextFormStep = (eventName?: string, detail?: Record<string, unknown>) => {
        if (!eventName) return;
        dispatchFirstUseEvent(eventName, detail);
    };

    useEffect(() => {
        return () => {
            if (completeNowHoldIntervalRef.current) {
                window.clearInterval(completeNowHoldIntervalRef.current);
            }
            if (briefingReaderTurnTimeoutRef.current) {
                window.clearTimeout(briefingReaderTurnTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isNew || isPreview || mode !== 'edit') return;
        dispatchFirstUseEvent(FIRST_USE_ONBOARDING_EVENTS.actionModalOpened);
    }, [isNew, isPreview, mode]);

    useScreenIntroTip(!isPreview && mode === 'edit' && isNew ? 'action_modal' : null, 30);


    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [isArenaPickerOpen, setIsArenaPickerOpen] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(action?.scheduledDays || []);
    const [startTime, setStartTime] = useState<string | null>(() => {
        const timeValue = taskId && currentTask ? currentTask.startTime : (action?.scheduledStartTime ?? null);
        if (timeValue !== null) {
            const h = Math.floor(timeValue / 60);
            const m = timeValue % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
        return null;
    });
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const arenas = typeof getArenas === 'function' ?getArenas() : [];
    const currentArena = arenas.find(a => a.id === editableAction.arenaId);
    const arenaFlags = React.useMemo(() => getArenaDomainFlags(currentArena), [currentArena]);
    const isMentorDeliveredAction = Boolean(installedCodex?.mentor_relationship_link_id);
    const isReceivedInstalledCodexAction = !isMentorDeliveredAction && (
        installedCodex?.source_type === 'gift_link' || installedCodex?.source_type === 'gift_in_app'
    );
    const isSeasonLockedAction = arenaFlags.isSeasonQuest;
    const isInstalledCampaignAction = !isMentorDeliveredAction && (isInstalledCodexAction || isReceivedInstalledCodexAction);
    const isLockedFromSource = isSeasonLockedAction;
    const canEditAuthorialContent = !disableAuthoring && !isInstalledCampaignAction && !isSeasonLockedAction;
    const canEditExecutionSettings = !isSeasonLockedAction;
    const canEditActionType = !disableAuthoring && canEditExecutionSettings;
    const canUsePlannerMatrix = hasPremiumAccess(userProfile);
    const isDetachedCollaborativeArena = collaborativeLinkedArena;
    const collaborativePersistUserId = collaborativeOwnerUserId || null;
    const effectiveTaskPool = isDetachedCollaborativeArena ? collaborativeArenaTasks : tasks;
    const basePendingTask = React.useMemo(() => {
        if (!action) return null;
        return effectiveTaskPool.find(task => task.actionId === action.id && !task.completed) || null;
    }, [action, effectiveTaskPool]);
    const lockedEditMessage = arenaFlags.isSeasonQuest
        ? 'Missões de temporada são fixas e não podem ser editadas.'
        : isInstalledCampaignAction
            ? 'Campanhas mantém o conteúdo protegido. Aqui você ajusta so a execução local.'
            : null;

    const isOfficeMode = PRODUCT_FEATURES.clanSharedActions && clan?.clanType === 'Office';
    const enrichedMembers = enrichedClanMembers;

    // A refused save only surfaced as a toast, which the onboarding overlay can cover.
    // The player then saw the modal accept the click and the action never appear, with
    // nothing on screen explaining why. Keep the reason inside the modal too.
    const refuseSave = (message: string) => {
        setSaveError(message);
        showToast(message, 'warning');
    };

    const handleSave = () => {
        setSaveError(null);
        if (!isEditingTaskInstance && !editableAction.name?.trim()) {
            refuseSave('Dê um título para a ação antes de salvar.');
            window.setTimeout(() => nameInputRef.current?.focus(), 40);
            return;
        }

        let scheduledStartTime: number | undefined;
        if (startTime && startTime !== 'Sem Horário') {
            const [h, m] = startTime.split(':').map(Number);
            scheduledStartTime = h * 60 + m;
        }

        if (
            !isEditingTaskInstance &&
            editableAction.actionType === 'Ação Recorrente' &&
            scheduledStartTime !== undefined &&
            selectedDays.length === 0
        ) {
            refuseSave('Escolha pelo menos um dia para programar essa ação recorrente.');
            return;
        }

        if (!isEditingTaskInstance && (selectedDays.length > 0 || editableAction.actionType === 'Compromisso') && scheduledStartTime === undefined) {
            refuseSave('Escolha o horário do agendamento.'); setActiveTab('advanced'); setAdvancedSubTab('context'); setSchedulePanelOpen(true); return;
        }
        if (!isEditingTaskInstance && editableAction.actionType === 'Compromisso' && !selectedDate) {
            refuseSave('Escolha a data do compromisso.'); setActiveTab('advanced'); setAdvancedSubTab('context'); setSchedulePanelOpen(true); return;
        }
        if (!isEditingTaskInstance && editableAction.actionType === 'Ação Recorrente' && selectedDays.length > 0) {
            const from = editableAction.context?.schedule?.startsOn || getLocalDateString();
            const parsed = getTaskDateValue(from);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !Number.isFinite(parsed.getTime()) || getLocalDateString(parsed) !== from || from > resolveScheduleHorizon(getLocalDateString(), activeCycle)) {
                refuseSave('Escolha uma data de início dentro da agenda atual.');
                setActiveTab('advanced'); setAdvancedSubTab('context'); setSchedulePanelOpen(true); return;
            }
        }
        const nextRepetitions = editableAction.actionType === 'Ação Recorrente'
            ?Math.min(50, Math.max(1, Math.floor(editableAction.repetitions || 1)))
            : 1;

        // SAFEGUARD: Ensure duration is within bounds (5-240) and defaults to 60 if invalid
        const rawDuration = editableAction.duration;
        const validDuration = (rawDuration && rawDuration >= 5 && rawDuration <= 480) ?rawDuration : 60;

        const resolvedArenaId = editableAction.arenaId || action?.arenaId || arenaId;

        if (!isEditingTaskInstance && !resolvedArenaId) {
            if (arenas.length === 0) {
                refuseSave('Crie uma arena antes de criar uma ação.');
                onClose();
                return;
            }
            refuseSave('Escolha uma arena para essa ação antes de salvar.');
            setIsArenaPickerOpen(true);
            return;
        }

        const normalizedDifficulty = normalizeActionDifficulty(editableAction.difficulty);
        const baseContext = { ...(editableAction.context || {}) };
        const nextSchedule = { ...(baseContext.schedule || {}) };
        const { schedule: _ignoredSchedule, ...restContext } = baseContext;
        if (editableAction.actionType === 'Ação Recorrente') {
            if (selectedDays.length > 0) {
                nextSchedule.days = selectedDays;
            } else {
                delete nextSchedule.days;
                delete nextSchedule.startTime;
                delete nextSchedule.notifyBeforeMinutes;
            }
        } else {
            delete nextSchedule.days;
        }
        if (editableAction.actionType === 'Livre') {
            delete nextSchedule.startTime;
            delete nextSchedule.notifyBeforeMinutes;
        } else if (scheduledStartTime !== undefined) {
            nextSchedule.startTime = scheduledStartTime;
        } else {
            delete nextSchedule.startTime;
            delete nextSchedule.notifyBeforeMinutes;
        }

        if (!canUsePlannerMatrix && restContext.plannerQuadrant) {
            delete restContext.plannerQuadrant;
        }
        if (!restContext.plannerQuadrant) {
            delete restContext.plannerQuadrant;
        }

        const hasSchedulePayload = Object.keys(nextSchedule).length > 0;
        const actionContext: Action['context'] | undefined = hasSchedulePayload
            ? { ...restContext, schedule: nextSchedule }
            : (Object.keys(restContext).length > 0 ? restContext : undefined);

        const actionData: Omit<Action, 'id'> = {
            arenaId: resolvedArenaId,
            name: editableAction.name,
            description: editableAction.description?.trim() || undefined,
            icon: editableAction.icon || '📝',
            duration: validDuration,
            repetitions: nextRepetitions,
            actionType: editableAction.actionType || 'Ação Recorrente',
            difficulty: normalizedDifficulty,
            scheduledDays: editableAction.actionType === 'Ação Recorrente' ?selectedDays : undefined,
            scheduledStartTime: editableAction.actionType === 'Livre' ?undefined : scheduledStartTime,
            briefing: editableAction.briefing?.trim() || undefined,
            assets: editableAction.assets || [],
            preFlight: editableAction.preFlight || [],
            context: actionContext
        };

        const resolveOperationalDateTime = (dateValue: Date, startTimeInMinutes: number) => {
            const operationalDateString = getLocalDateString(dateValue);
            const displayMinutes = startTimeInMinutes < OPERATIONAL_DAY_START_MINUTE
                ? startTimeInMinutes + (24 * 60)
                : startTimeInMinutes;
            return {
                date: getActualDateStringForOperationalMinutes(operationalDateString, displayMinutes),
                startTime: getActualStartTimeForOperationalMinutes(displayMinutes),
            };
        };

        const scheduleCollaborativeTasks = async (actionToSchedule: Action) => {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = collaborativePersistUserId || sessionData.session?.user.id;
            if (!userId) return;

            const existingKeys = new Set(
                collaborativeArenaTasks
                    .filter(task => task.actionId === actionToSchedule.id && String((task as any).userId || userId) === userId)
                    .map(task => `${task.actionId}_${task.date}_${task.startTime}`)
            );

            const pendingTasks: ScheduledTask[] = [];
            const today = getLocalDateString();
            const horizon = resolveScheduleHorizon(today, activeCycle);

            if (editableAction.actionType === 'Ação Recorrente' && selectedDays.length > 0 && startTime && startTime !== 'Sem Horário') {
                const [hour, minute] = startTime.split(':').map(Number);
                const startTimeInMinutes = hour * 60 + minute;

                const { data: stored, error } = await supabase.from('scheduled_tasks')
                    .select('action_id,date,start_time,completed').eq('user_id', userId).eq('action_id', actionToSchedule.id);
                if (error) throw new Error('Não foi possível conferir a agenda existente.');
                const scoped = (stored || []).filter(row => actionToSchedule.originCodexId ||
                    ((!activeCycle?.startDate || row.date >= activeCycle.startDate) && row.date <= horizon));
                for (const row of stored || []) existingKeys.add(`${row.action_id}_${row.date}_${row.start_time}`);
                const used = scoped.filter(row => row.completed || row.date >= today).length;
                const budget = actionToSchedule.context?.schedule?.limitToRepetitions || actionToSchedule.originCodexId
                    ? Math.max(0, (actionToSchedule.repetitions || 1) - used) : Infinity;
                const from = actionToSchedule.context?.schedule?.startsOn || today;
                for (const dateString of buildRecurringDates({from: from > today ? from : today, through: horizon, daysOfWeek: selectedDays})) {
                    if (pendingTasks.length >= budget) break;
                    const key = `${actionToSchedule.id}_${dateString}_${startTimeInMinutes}`;
                    if (existingKeys.has(key)) continue;

                    pendingTasks.push({
                        id: crypto.randomUUID(),
                        actionId: actionToSchedule.id,
                        date: dateString,
                        startTime: startTimeInMinutes,
                        duration: actionToSchedule.duration,
                        completed: false,
                    });
                    existingKeys.add(key);
                }
            }

            if (editableAction.actionType === 'Compromisso' && selectedDate && startTime && startTime !== 'Sem Horário') {
                const [hour, minute] = startTime.split(':').map(Number);
                const startTimeInMinutes = hour * 60 + minute;
                const resolvedOccurrence = resolveOperationalDateTime(selectedDate, startTimeInMinutes);
                const key = `${actionToSchedule.id}_${resolvedOccurrence.date}_${resolvedOccurrence.startTime}`;

                if (!existingKeys.has(key)) {
                    pendingTasks.push({
                        id: crypto.randomUUID(),
                        actionId: actionToSchedule.id,
                        date: resolvedOccurrence.date,
                        startTime: resolvedOccurrence.startTime,
                        duration: actionToSchedule.duration,
                        completed: false,
                    });
                }
            }

            if (pendingTasks.length === 0) return;

            const payload = pendingTasks.map(task => ({
                id: task.id,
                action_id: task.actionId,
                date: task.date,
                start_time: task.startTime,
                duration: task.duration,
                completed: false,
                user_id: userId,
            }));

            const { error } = await supabase.from('scheduled_tasks').insert(payload);
            if (error) throw error;
        };

        const clearDetachedCollaborativePendingTasks = async (actionId: string) => {
            if (!collaborativePersistUserId) {
                throw new Error('COLLABORATIVE_OWNER_REQUIRED');
            }

            const { error } = await supabase
                .from('scheduled_tasks')
                .delete()
                .eq('action_id', actionId)
                .eq('completed', false)
                .eq('user_id', collaborativePersistUserId);

            if (error) throw error;
        };

        const buildCollaborativeActionPayload = (actionToPersist: Action) => ({
            id: actionToPersist.id,
            user_id: collaborativePersistUserId,
            arena_id: actionToPersist.arenaId,
            name: actionToPersist.name,
            description: actionToPersist.description || null,
            icon: actionToPersist.icon,
            duration: actionToPersist.duration,
            repetitions: actionToPersist.repetitions,
            action_type: actionToPersist.actionType,
            difficulty: actionToPersist.difficulty ?? null,
            briefing: actionToPersist.briefing || null,
            assets: actionToPersist.assets || [],
            pre_flight: actionToPersist.preFlight || [],
            context: {
                ...(actionToPersist.context || {}),
                ...(
                    actionToPersist.scheduledDays !== undefined || actionToPersist.scheduledStartTime !== undefined
                        ? {
                            schedule: {
                                ...(actionToPersist.context?.schedule || {}),
                                ...(actionToPersist.scheduledDays !== undefined ? { days: actionToPersist.scheduledDays } : {}),
                                ...(actionToPersist.scheduledStartTime !== undefined ? { startTime: actionToPersist.scheduledStartTime } : {}),
                            },
                        }
                        : {}
                ),
            },
            origin_codex_id: actionToPersist.originCodexId || null,
        });

        const scheduleTasks = async (actionToSchedule: Action) => {
            // Para Ação Recorrente: usa dias da semana
            if (editableAction.actionType === 'Ação Recorrente' && selectedDays.length > 0 && startTime !== null && startTime !== 'Sem Horário') {
                const [hour, minute] = startTime.split(':').map(Number);
                const startTimeInMinutes = hour * 60 + minute;
                if (isDetachedCollaborativeArena) {
                    await scheduleCollaborativeTasks(actionToSchedule);
                } else {
                    await scheduleMultipleTasks(actionToSchedule, selectedDays, startTimeInMinutes);
                }
                return;
            }

            // Para Compromisso: usa data específica
            if (editableAction.actionType === 'Compromisso' && selectedDate && startTime !== null && startTime !== 'Sem Horário') {
                const [hour, minute] = startTime.split(':').map(Number);
                const startTimeInMinutes = hour * 60 + minute;
                const resolvedSchedule = resolveOperationalDateTime(selectedDate, startTimeInMinutes);
                if (isDetachedCollaborativeArena) {
                    await scheduleCollaborativeTasks({
                        ...(actionToSchedule as Action),
                        scheduledStartTime: resolvedSchedule.startTime,
                    });
                } else {
                    await scheduleTask(actionToSchedule, resolvedSchedule.date, resolvedSchedule.startTime);
                }
            }
        }

        const executeSave = async () => {
            try {
                if (isEditingTaskInstance) {
                    if (!taskId || !currentTask || typeof updateTask !== 'function') {
                        showToast('Esta ocorrência não está mais disponível. Reabra o Planner.', 'warning');
                        return;
                    }

                    let nextTaskStartTime = -1;
                    if (startTime && startTime !== 'Sem Horário') {
                        const [h, m] = startTime.split(':').map(Number);
                        nextTaskStartTime = h * 60 + m;
                    }

                    const resolvedOccurrence = selectedDate && nextTaskStartTime >= 0
                        ? resolveOperationalDateTime(selectedDate, nextTaskStartTime)
                        : null;

                    updateTask(taskId, {
                        date: resolvedOccurrence?.date || (selectedDate ? getLocalDateString(selectedDate) : currentTask.date),
                        duration: editableTaskDuration,
                        startTime: resolvedOccurrence?.startTime ?? nextTaskStartTime,
                        instanceNote: instanceNote.trim() || null,
                        ...(instanceReminderTouched ? {
                            reminderEnabled: instanceReminderEnabled,
                            reminderMinutes: instanceReminderEnabled ? instanceReminderMinutes : null,
                        } : {}),
                    });
                    showToast('Ocorrência atualizada.', 'success');
                } else if (isNew && typeof addAction === 'function') {
                    if (isDetachedCollaborativeArena) {
                        if (!collaborativePersistUserId) {
                            throw new Error('COLLABORATIVE_OWNER_REQUIRED');
                        }

                        const newAction: Action = { ...actionData, id: crypto.randomUUID() };
                        const { error } = await supabase
                            .from('actions')
                            .insert(buildCollaborativeActionPayload(newAction));

                        if (error) throw error;

                        await scheduleTasks(newAction);
                    } else {
                        // Let the context generate the ID to ensure consistency
                        const newAction = await addAction(actionData);
                        if (newAction?.id) {
                            await scheduleTasks(newAction);
                            window.dispatchEvent(new CustomEvent(FIRST_USE_ONBOARDING_EVENTS.actionCreated, { detail: { actionId: newAction.id } }));
                        }
                    }
                    showToast('Ação criada.', 'success');
                } else if (action?.id && typeof updateAction === 'function') {
                    const nextDaysKey = JSON.stringify([...selectedDays].sort());
                    const prevDaysKey = JSON.stringify([...(action.scheduledDays || [])].sort());
                    const nextCommitmentDate = editableAction.actionType === 'Compromisso'
                        ? (selectedDate ? getLocalDateString(selectedDate) : basePendingTask?.date || null)
                        : null;
                    const prevCommitmentDate = action.actionType === 'Compromisso'
                        ? (basePendingTask?.date || null)
                        : null;
                    const scheduleChanged = (
                        action.actionType !== actionData.actionType
                        || (action.scheduledStartTime ?? null) !== (scheduledStartTime ?? null)
                        || prevDaysKey !== nextDaysKey
                        || action.context?.schedule?.startsOn !== actionData.context?.schedule?.startsOn
                        || action.context?.schedule?.limitToRepetitions !== actionData.context?.schedule?.limitToRepetitions
                        || (actionData.context?.schedule?.limitToRepetitions && action.repetitions !== nextRepetitions)
                        || (action.duration || 60) !== validDuration
                        || prevCommitmentDate !== nextCommitmentDate
                    );

                    const nextAction = {
                        ...action,
                        ...actionData,
                        arenaId: actionData.arenaId || action.arenaId,
                    } as Action;

                    if (isDetachedCollaborativeArena) {
                        if (!collaborativePersistUserId) {
                            throw new Error('COLLABORATIVE_OWNER_REQUIRED');
                        }

                        const updatePayload = buildCollaborativeActionPayload(nextAction);
                        delete (updatePayload as { id?: string }).id;
                        delete (updatePayload as { user_id?: string | null }).user_id;

                        const { error } = await supabase
                            .from('actions')
                            .update(updatePayload)
                            .eq('id', action.id);

                        if (error) throw error;

                        if (scheduleChanged) {
                            await clearDetachedCollaborativePendingTasks(action.id);
                        }
                    } else {
                        updateAction(action.id, actionData);
                        if (scheduleChanged) {
                            await clearPendingTasksForAction(action.id);
                        }
                    }

                    await scheduleTasks(nextAction);
                    showToast(
                        scheduleChanged
                            ? 'Agenda atualizada. As conclusões anteriores foram preservadas.'
                            : 'Ação atualizada.',
                        'success'
                    );
                }
                if (isDetachedCollaborativeArena) {
                    await Promise.resolve(onCollaborativeRefresh?.());
                }
                onClose();
            } catch (err) {
                console.error("Error executing save:", err);
                const rawMessage = String((err as any)?.message || (err as any)?.details || '');
                const permissionLikeError = /COLLABORATIVE_OWNER_REQUIRED|row-level|rls|policy|permission|denied|not authorized|violates/i.test(rawMessage);
                showToast(
                    isDetachedCollaborativeArena && permissionLikeError
                        ? 'Mentoria sem permissão no banco para salvar essa ação. Rode as migrations de vínculo.'
                        : 'Não foi possível salvar a ação.',
                    'error'
                );
            }
        };

        executeSave().catch(err => console.error("Error saving action:", err));
    };

    const clearCompleteNowHold = () => {
        if (completeNowHoldIntervalRef.current) {
            window.clearInterval(completeNowHoldIntervalRef.current);
            completeNowHoldIntervalRef.current = null;
        }

        setIsCompletingNowHold(false);
        if (!completeNowTriggered) {
            setCompleteNowHoldProgress(0);
        }
    };

    const openBriefingReader = () => {
        if (briefingPages.length === 0) return;
        setBriefingPageIndex(0);
        setBriefingPageStage('idle');
        window.requestAnimationFrame(() => {
            setIsBriefingReaderOpen(true);
        });
    };

    const handleStartMission = () => {
        if (!action || !startNowTask) return;

        window.dispatchEvent(new CustomEvent(REST_SCREEN_ACTION_SESSION_EVENT, {
            detail: createRestScreenActionSession({
                actionId: action.id,
                taskId: startNowTask?.id,
                actionName: action.name,
                actionIcon: action.icon,
                durationMinutes: startNowDurationMinutes,
                actionType: action.actionType,
            }),
        }));

        onClose();
    };

    const handleCompleteNowStart = (event?: React.MouseEvent | React.TouchEvent) => {
        if (event && 'touches' in event && event.cancelable) {
            event.preventDefault();
        }
        if (!action || !startNowTask || completeNowHoldIntervalRef.current || completeNowTriggered) return;

        setCompleteNowTriggered(false);
        setIsCompletingNowHold(true);
        const startedAt = Date.now();
        const holdDuration = 1000;

        completeNowHoldIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const progress = Math.min((elapsed / holdDuration) * 100, 100);
            setCompleteNowHoldProgress(progress);

            if (progress < 100) return;

            clearCompleteNowHold();
            setCompleteNowTriggered(true);

            void (async () => {
                try {
                    await scheduleAndCompleteNow(action.id, startNowTask.id);
                    window.dispatchEvent(new CustomEvent(REST_SCREEN_ACTION_SESSION_CLEAR_EVENT));
                    showToast('Ação concluída.', 'success');
                    onClose();
                } catch (error) {
                    console.error('Error completing action from ActionModal:', error);
                    setCompleteNowTriggered(false);
                    setCompleteNowHoldProgress(0);
                    showToast('Não foi possível concluir a ação.', 'error');
                }
            })();
        }, 16);
    };

    const handleDelete = () => { if (action) setConfirmDeleteOpen(true); };
    const confirmDelete = async () => {
        if (!action) return;
        if (isDetachedCollaborativeArena) {
            try {
                if (!collaborativePersistUserId) {
                    throw new Error('COLLABORATIVE_OWNER_REQUIRED');
                }

                const { error: tasksDeleteError } = await supabase
                    .from('scheduled_tasks')
                    .delete()
                    .eq('action_id', action.id)
                    .eq('user_id', collaborativePersistUserId);

                if (tasksDeleteError) throw tasksDeleteError;

                const { error: actionDeleteError } = await supabase
                    .from('actions')
                    .delete()
                    .eq('id', action.id);

                if (actionDeleteError) throw actionDeleteError;

                await Promise.resolve(onCollaborativeRefresh?.());
                showToast('Ação removida.', 'success');
                onClose();
                return;
            } catch (error) {
                console.error('Error deleting collaborative linked action:', error);
                const rawMessage = String((error as any)?.message || (error as any)?.details || '');
                const permissionLikeError = /COLLABORATIVE_OWNER_REQUIRED|row-level|rls|policy|permission|denied|not authorized|violates/i.test(rawMessage);
                showToast(
                    permissionLikeError
                        ? 'Mentoria sem permissão no banco para excluir essa ação. Rode as migrations de vínculo.'
                        : 'Não foi possível excluir a ação.',
                    'error'
                );
                return;
            }
        }
        deleteAction(action.id);
        if (isDetachedCollaborativeArena) {
            void Promise.resolve(onCollaborativeRefresh?.());
        }
        onClose();
    }

    const handleCancel = () => {
        if (isNew) onClose();
        else {
            resetFromAction(action, hasTaskInstanceContext ? 'instance' : 'action');
            setMode('view');
            setIsTimePickerOpen(false);
            setIsDatePickerOpen(false);
        }
    };

    const handleIconSelect = (icon: string) => { setEditableAction(p => ({ ...p, icon })); setIsIconPickerOpen(false); };
    const handleArenaButtonClick = () => {
        if (mode === 'view' && currentArena) {
            window.dispatchEvent(new CustomEvent('tutorialNavigate', {
                detail: {
                    view: 'arenas',
                    showArenaId: currentArena.id,
                },
            }));
            onClose();
            return;
        }

        if (!canEditExecutionSettings || lockArenaAssignment) {
            return;
        }

        if (isEditingTaskInstance) {
            showToast('A arena fica travada nesta ocorrência. Para trocar, edite a ação base.', 'warning');
            return;
        }

        if (canEditExecutionSettings && !lockArenaAssignment) {
            setIsArenaPickerOpen(true);
        }
    };
    const handleDayToggle = (day: DayOfWeek) => setSelectedDays(p => p.includes(day) ?p.filter(d => d !== day) : [...p, day]);
    const handleActionTypeChange = (type: ActionType) => {
        setEditableAction(p => ({
            ...p,
            actionType: type,
            repetitions: type === 'Ação Recorrente' ?(p.repetitions || 1) : 1,
            scheduledDays: type === 'Ação Recorrente' ?p.scheduledDays : undefined,
            scheduledStartTime: type === 'Compromisso' || type === 'Ação Recorrente' ?p.scheduledStartTime : undefined,
        }));
        if (type !== 'Ação Recorrente') setSelectedDays([]);
        if (type === 'Livre' || type === 'Marco') {
            setStartTime(null);
            setSelectedDate(null);
        }
        if (type === 'Compromisso' && !selectedDate) {
            setSelectedDate(new Date());
        }
        handleTutorialNextFormStep(FIRST_USE_ONBOARDING_EVENTS.actionTypeSelected, { actionType: type });
    }
    const handleArenaSelect = (id: string) => {
        if (lockArenaAssignment) {
            setIsArenaPickerOpen(false);
            return;
        }
        setEditableAction(p => ({ ...p, arenaId: id }));
        setIsArenaPickerOpen(false);
    };
    const updateScheduleContext = (updater: (schedule: NonNullable<NonNullable<Action['context']>['schedule']>) => NonNullable<NonNullable<Action['context']>['schedule']>) => {
        setEditableAction(prev => {
            const nextSchedule = updater({ ...(prev.context?.schedule || {}) });
            return {
                ...prev,
                context: {
                    ...(prev.context || {}),
                    schedule: nextSchedule,
                },
            };
        });
    };

    const clearReminderPreference = () => {
        updateScheduleContext((schedule) => {
            const nextSchedule = { ...schedule };
            delete nextSchedule.notifyBeforeMinutes;
            return nextSchedule;
        });
    };

    const handleTimeSelect = (time: string) => {
        setStartTime(time);
        if (time === 'Sem Horário') {
            clearReminderPreference();
        }
    };
    const handleDateSelect = (date: Date) => { setSelectedDate(date); setIsDatePickerOpen(false); };
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };

    const handleReminderToggle = async () => {
        if (!startTime || startTime === 'Sem Horário') {
            showToast('Defina um horário antes de ligar o lembrete.', 'warning');
            return;
        }

        if (editableAction.actionType === 'Ação Recorrente' && selectedDays.length === 0) {
            showToast('Escolha pelo menos um dia para a ação recorrente antes de ligar o lembrete.', 'warning');
            return;
        }

        const currentlyEnabled = editableAction.context?.schedule?.notifyBeforeMinutes === 15;
        if (currentlyEnabled) {
            clearReminderPreference();
            return;
        }

        const permission = await requestLocalNotificationPermission();
        if (permission !== 'granted') {
            showToast('Permita notificações neste aparelho para receber esse aviso.', 'warning');
            return;
        }

        if (!oraclePreferences?.pushEnabled) {
            await updateOraclePreferences({ pushEnabled: true });
        }

        updateScheduleContext((schedule) => ({ ...schedule, notifyBeforeMinutes: 15 }));
        showToast('Lembrete de 15 min ativado.', 'success');
    };

    const handleInstanceReminderToggle = async () => {
        if (instanceReminderEnabled) {
            setInstanceReminderEnabled(false);
            setInstanceReminderTouched(true);
            return;
        }
        if (!startTime || startTime === 'Sem Horário') {
            showToast('Defina um horário antes de adicionar um lembrete.', 'warning');
            return;
        }
        const permission = await requestLocalNotificationPermission();
        if (permission !== 'granted') {
            showToast('Para lembrar esta ocorrência, permita notificações neste aparelho.', 'warning');
            return;
        }
        if (!oraclePreferences?.pushEnabled) {
            await updateOraclePreferences({ pushEnabled: true });
        }
        setInstanceReminderEnabled(true);
        setInstanceReminderTouched(true);
    };

    const canUseReminderToggle = !isEditingTaskInstance
        && !!startTime
        && startTime !== 'Sem Horário'
        && (editableAction.actionType !== 'Ação Recorrente' || selectedDays.length > 0);

    const getStartTimeLabel = (value?: number | null) => {
        if (value === undefined || value === null || value < 0) return null;
        const h = Math.floor(value / 60);
        const m = value % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const getTaskDateValue = (dateValue?: string | null) => {
        if (!dateValue) return null;
        const [year, month, day] = dateValue.split('-').map(Number);
        if (!year || !month || !day) return null;
        return new Date(year, month - 1, day);
    };

    const syncTemporalStateForScope = (nextScope: EditScope, nextAction: Action | null) => {
        if (nextScope === 'instance' && currentTask) {
            setStartTime(getStartTimeLabel(currentTask.startTime) || 'Sem Horário');
            setSelectedDate(getTaskDateValue(currentTask.date));
            setEditableTaskDuration(currentTask.duration || nextAction?.duration || 60);
            setInstanceNote(currentTask.instanceNote || '');
            setInstanceReminderEnabled(Boolean(currentTask.reminderEnabled ?? inheritedReminderMinutes));
            setInstanceReminderMinutes(currentTask.reminderMinutes || inheritedReminderMinutes || 15);
            setInstanceReminderTouched(false);
            setIsTimePickerOpen(false);
            setIsDatePickerOpen(false);
            return;
        }

        setStartTime(getStartTimeLabel(nextAction?.scheduledStartTime) || null);
        setSelectedDate(null);
        setIsTimePickerOpen(false);
        setIsDatePickerOpen(false);
    };

    const switchEditScope = (nextScope: EditScope) => {
        setEditScope(nextScope);
        syncTemporalStateForScope(nextScope, action);
        if (nextScope === 'instance') {
            setActiveTab('basic');
        }
    };

    const resetFromAction = (nextAction: Action | null, nextScope: EditScope = hasTaskInstanceContext ? 'instance' : 'action') => {
        const baseAction = nextAction
            ? { ...nextAction, difficulty: normalizeActionDifficulty(nextAction.difficulty) }
            : { arenaId: arenaId, name: '', description: '', icon: '📝', duration: 60, repetitions: 1, actionType: 'Ação Recorrente' as const, difficulty: 2 };
        setEditableAction(baseAction);
        setSchedulePanelOpen(false);
        setSelectedDays(nextAction?.scheduledDays || []);
        setEditScope(nextScope);
        syncTemporalStateForScope(nextScope, nextAction);
        if (nextScope === 'action' && nextAction?.actionType === 'Compromisso' && basePendingTask?.date) {
            setSelectedDate(getTaskDateValue(basePendingTask.date));
        }
        const asset = nextAction?.assets?.find(a => a.type === 'image' || a.type === 'video');
        const imageUrl = asset?.url || '';
        const caption = asset?.title || '';
        setNewAssetUrl(imageUrl);
        setMediaSlot({ imageUrl, caption });
        setActiveTab('basic');
        setAdvancedSubTab('media');
        setEditableTaskDuration(currentTask?.duration || nextAction?.duration || 60);
        setInstanceNote(currentTask?.instanceNote || '');
        const nextInheritedReminderMinutes = Number(nextAction?.context?.schedule?.notifyBeforeMinutes) || null;
        setInstanceReminderEnabled(Boolean(currentTask?.reminderEnabled ?? nextInheritedReminderMinutes));
        setInstanceReminderMinutes(currentTask?.reminderMinutes || nextInheritedReminderMinutes || 15);
        setInstanceReminderTouched(false);
    };

    useEffect(() => {
        const defaultScope: EditScope = hasTaskInstanceContext ? 'instance' : 'action';
        const shouldBlockInitialEdit = !isNew && initialMode === 'edit' && defaultScope === 'action' && isLockedFromSource;
        setMode(isNew ?'edit' : (shouldBlockInitialEdit ?'view' : initialMode));
        resetFromAction(action, defaultScope);
    }, [action?.id, arenaId, currentTask?.id, currentTask?.date, currentTask?.duration, currentTask?.startTime, currentTask?.instanceNote, currentTask?.reminderEnabled, currentTask?.reminderMinutes, hasTaskInstanceContext, initialMode, isLockedFromSource]);

    useEffect(() => {
        if (isEditingTaskInstance && activeTab === 'advanced') {
            setActiveTab('basic');
        }
    }, [activeTab, isEditingTaskInstance]);

    const displayAction = mode === 'view' ? action : editableAction;
    const displayDifficulty = normalizeActionDifficulty(displayAction?.difficulty);
    const displayActionTypeLabel = displayAction?.actionType === 'Livre'
        ? 'Livre (sem alvo)'
        : (displayAction?.actionType || 'Ação Recorrente');
    const displayDifficultyLabel = displayDifficulty === 0
        ? 'LAZER • sem EXP'
        : null;
    const displaySurfaceBadge = displayAction ? resolveActionSurfaceBadge(displayAction) : null;
    const briefingPages = React.useMemo(() => paginateBriefing(displayAction?.briefing), [displayAction?.briefing]);
    const briefingPreviewText = React.useMemo(() => {
        const previewPage = briefingPages[0] || displayAction?.briefing || '';
        return previewPage.replace(/\n\s*\[\[page\]\]\s*\n/gi, '\n\n').trim();
    }, [briefingPages, displayAction?.briefing]);
    const mediaPreviewUrl = React.useMemo(() => {
        const draftUrl = mode === 'edit' ? (newAssetUrl || mediaSlot.imageUrl || '') : '';
        const storedUrl = displayAction?.assets?.find(a => a.type === 'image' || a.type === 'video')?.url || '';
        return (draftUrl || storedUrl).trim() || null;
    }, [displayAction?.assets, mediaSlot.imageUrl, mode, newAssetUrl]);

    // Merge task duration if editing a specific task
    const effectiveDuration = hasTaskInstanceContext && (mode === 'view' || isEditingTaskInstance) ?currentTask.duration : (displayAction?.duration || 60);

    const difficultyLabels = ['LAZER', 'LEVE', 'MÉDIA', 'ALTA'];
    const week: DayOfWeek[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
    const temHorario = Boolean(startTime && startTime !== 'Sem Horário');

    // Preview follows the same horizon and repetition budget as persistence.
    const agendaPrevista = React.useMemo(() => {
        if (editableAction.actionType !== 'Ação Recorrente') return null;
        if (!temHorario || selectedDays.length === 0) return null;

        const hoje = editableAction.context?.schedule?.startsOn && editableAction.context.schedule.startsOn > getLocalDateString() ? editableAction.context.schedule.startsOn : getLocalDateString();
        const ate = resolveScheduleHorizon(getLocalDateString(), activeCycle);
        const available = countRecurringOccurrences({ from: hoje, through: ate, daysOfWeek: selectedDays });
        const completed = effectiveTaskPool.filter(task => task.actionId === action?.id && task.completed &&
            (action?.originCodexId || ((!activeCycle?.startDate || task.date >= activeCycle.startDate) && task.date <= ate))).length;
        const vezes = editableAction.context?.schedule?.limitToRepetitions || action?.originCodexId
            ? Math.min(available, Math.max(0, (editableAction.repetitions || 1) - completed)) : available;
        if (vezes === 0) return null;

        const [, mes, dia] = ate.split('-');
        return { vezes, ateLabel: `${dia}/${mes}` };
    }, [activeCycle, effectiveTaskPool, action, editableAction.actionType, editableAction.context?.schedule?.startsOn, editableAction.context?.schedule?.limitToRepetitions, editableAction.repetitions, selectedDays, temHorario]);
    const timeOptions = ['Sem Horário', ...Array.from({ length: 24 * 4 }, (_, i) => { const h = Math.floor(i / 4); const m = (i % 4) * 15; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; })];
    useEffect(() => {
        if (advancedSubTab !== 'note' || mode !== 'view') {
            setIsBriefingReaderOpen(false);
        }
    }, [advancedSubTab, mode]);

    useEffect(() => {
        setBriefingPageIndex(0);
    }, [displayAction?.briefing]);

    useEffect(() => {
        if (!isBriefingReaderOpen) {
            setBriefingPageStage('idle');
            briefingReaderPointerStartRef.current = null;
            briefingReaderPointerStartYRef.current = null;
            briefingReaderTouchStartRef.current = null;
            briefingReaderTouchStartYRef.current = null;
        }
    }, [isBriefingReaderOpen]);

    useEffect(() => {
        if (!isBriefingReaderOpen || briefingPages.length === 0) return;

        const handleReaderKeydown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight') {
                navigateBriefingPage(briefingPageIndex + 1);
            } else if (event.key === 'ArrowLeft') {
                navigateBriefingPage(briefingPageIndex - 1);
            } else if (event.key === 'Escape') {
                setIsBriefingReaderOpen(false);
            }
        };

        window.addEventListener('keydown', handleReaderKeydown);
        return () => window.removeEventListener('keydown', handleReaderKeydown);
    }, [isBriefingReaderOpen, briefingPages.length, briefingPageIndex, briefingPageStage]);

    const briefingPageTurnStyle: React.CSSProperties = (() => {
        switch (briefingPageStage) {
            case 'out-next':
                return {
                    opacity: 0,
                    filter: 'blur(1.5px)',
                    transformOrigin: 'left center',
                    transform: 'perspective(2200px) translateX(-4%) rotateY(-28deg) rotateZ(-1deg) scale(0.992)',
                    boxShadow: '18px 22px 44px rgba(54,33,11,0.18), inset 1px 0 0 rgba(255,255,255,0.25)',
                };
            case 'out-prev':
                return {
                    opacity: 0,
                    filter: 'blur(1.5px)',
                    transformOrigin: 'right center',
                    transform: 'perspective(2200px) translateX(4%) rotateY(28deg) rotateZ(1deg) scale(0.992)',
                    boxShadow: '-18px 22px 44px rgba(54,33,11,0.18), inset -1px 0 0 rgba(255,255,255,0.25)',
                };
            case 'in-next':
                return {
                    opacity: 0,
                    filter: 'blur(1.5px)',
                    transformOrigin: 'right center',
                    transform: 'perspective(2200px) translateX(7%) rotateY(24deg) rotateZ(0.8deg) scale(0.995)',
                    boxShadow: '-18px 22px 40px rgba(54,33,11,0.16), inset -1px 0 0 rgba(255,255,255,0.2)',
                };
            case 'in-prev':
                return {
                    opacity: 0,
                    filter: 'blur(1.5px)',
                    transformOrigin: 'left center',
                    transform: 'perspective(2200px) translateX(-7%) rotateY(-24deg) rotateZ(-0.8deg) scale(0.995)',
                    boxShadow: '18px 22px 40px rgba(54,33,11,0.16), inset 1px 0 0 rgba(255,255,255,0.2)',
                };
            default:
                return {
                    opacity: 1,
                    filter: 'blur(0px)',
                    transformOrigin: 'center center',
                    transform: 'perspective(2200px) translateX(0) rotateY(0deg) rotateZ(0deg) scale(1)',
                    boxShadow: '0 18px 40px rgba(84,58,21,0.12), inset 0 1px 0 rgba(255,255,255,0.5)',
                };
        }
    })();

    const briefingPageStackStyle: React.CSSProperties = (() => {
        const isAnimating = briefingPageStage !== 'idle';
        const movingToNext = briefingPageStage.includes('next');
        return {
            opacity: isAnimating ? 0.42 : 0.22,
            transform: movingToNext ? 'translateX(1.8%) scale(0.992)' : 'translateX(-1.8%) scale(0.992)',
        };
    })();

    const briefingPageFoldGlowStyle: React.CSSProperties = (() => {
        if (briefingPageStage === 'out-next' || briefingPageStage === 'in-prev') {
            return {
                left: 0,
                right: 'auto',
                opacity: 0.92,
                background: 'linear-gradient(90deg, rgba(93,63,22,0.34) 0%, rgba(164,123,59,0.2) 34%, rgba(255,246,214,0.18) 65%, rgba(255,246,214,0) 100%)',
            };
        }
        if (briefingPageStage === 'out-prev' || briefingPageStage === 'in-next') {
            return {
                left: 'auto',
                right: 0,
                opacity: 0.92,
                background: 'linear-gradient(270deg, rgba(93,63,22,0.34) 0%, rgba(164,123,59,0.2) 34%, rgba(255,246,214,0.18) 65%, rgba(255,246,214,0) 100%)',
            };
        }
        return {
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: 0.26,
            background: 'linear-gradient(90deg, rgba(93,63,22,0) 0%, rgba(93,63,22,0.18) 50%, rgba(93,63,22,0) 100%)',
        };
    })();

    const navigateBriefingPage = (targetIndex: number) => {
        if (briefingPages.length === 0) return;
        const boundedIndex = Math.max(0, Math.min(briefingPages.length - 1, targetIndex));
        if (boundedIndex === briefingPageIndex || briefingPageStage !== 'idle') return;

        const direction = boundedIndex > briefingPageIndex ? 'next' : 'prev';
        setBriefingPageStage(direction === 'next' ? 'out-next' : 'out-prev');

        if (briefingReaderTurnTimeoutRef.current) {
            window.clearTimeout(briefingReaderTurnTimeoutRef.current);
        }

        briefingReaderTurnTimeoutRef.current = window.setTimeout(() => {
            setBriefingPageIndex(boundedIndex);
            setBriefingPageStage(direction === 'next' ? 'in-next' : 'in-prev');
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                    setBriefingPageStage('idle');
                });
            });
        }, 170);
    };

    const insertBriefingPageBreak = () => {
        const currentBriefing = editableAction.briefing?.trim() || '';
        const separator = currentBriefing ? '\n\n[[page]]\n\n' : '';
        setEditableAction(prev => ({ ...prev, briefing: `${currentBriefing}${separator}` }));
    };

    if (!displayAction && mode === 'view') return null;

    const arenaAccentColor = currentArena ? getArenaTone(currentArena) : undefined;
    const accentColor = customThemeColor || arenaAccentColor || '#F0C843';
    // Omit the override to inherit the skin. A self-reference invalidates the token.
    const modalStyle = { ...(customThemeColor ? { '--skin-accent-color': customThemeColor } : {}), '--action-accent': accentColor, '--action-gradient': currentArena ? getArenaActionGradient(currentArena) : undefined, '--accent-bronze': accentColor } as React.CSSProperties;
    const headerTitle = mode === 'view'
        ?(displayAction?.name || (isPreview ?'Preview de Ação' : 'Detalhe da Ação'))
        : (isEditingTaskInstance
            ?(action?.name?.trim() || 'Editar Ocorrência')
            : (editableAction.name?.trim() || (isNew ?'Nova Ação' : hasTaskInstanceContext ?'Editar Ação Base' : 'Editar Ação')));
    const headerEyebrow = mode === 'edit'
        ?(isEditingTaskInstance
            ?'Ocorrência'
            : (isNew ?'Criação' : hasTaskInstanceContext ?'Ação Base' : 'Edição'))
        : (isPreview ?'Preview' : hasTaskInstanceContext ?'Ocorrência' : 'Ação');
    const requestActionBaseEdit = () => {
        if (isLockedFromSource) {
            showToast(lockedEditMessage || 'Essa ação não pode ser editada.', 'warning');
            return;
        }
        switchEditScope('action');
        setMode('edit');
    };

    const requestEditMode = () => {
        if (hasTaskInstanceContext) {
            switchEditScope('instance');
            setMode('edit');
            return;
        }
        requestActionBaseEdit();
    };

    const plannerOccurrenceLabel = currentTask?.date
        ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(getTaskDateValue(currentTask.date) || new Date())
        : null;
    const conteudoDaAba = conteudoDaAcao(displayAction);
    const saveOccurrenceNote = () => {
        if (!currentTask || typeof updateTask !== 'function') return;
        updateTask(currentTask.id, { instanceNote: instanceNote.trim() || null });
        showToast('Anotação salva nesta ocorrência.', 'success');
    };

    return (
        <>
        <Portal>
            <div className="ui-modal-backdrop z-[100]" onClick={handleBackdropClick} style={modalStyle}>
                <ReferencePlate role="dialog" aria-modal="true" aria-label={headerTitle} className="reference-action">
                    <header className="reference-header action-dialog-header">
                        {!isPreview && !disableAuthoring && !isNew && (hasTaskInstanceContext || !isLockedFromSource || mode === 'edit') && (
                            <button className="reference-corner reference-edit" onClick={mode === 'view' ? requestEditMode : handleCancel} aria-label={mode === 'view' ? 'Editar ação' : 'Cancelar edição'}>
                                {mode === 'view' ? <EditIcon className="w-4 h-4" /> : <span>←</span>}
                            </button>
                        )}
                        <button className="reference-corner reference-close" onClick={onClose} aria-label="Fechar ação"><XIcon className="w-4 h-4" /></button>
                        {mode === 'edit' && !isEditingTaskInstance ? <>
                            <div className="action-identity">
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        aria-label="Escolher emoji da ação"
                                                        onClick={() => canEditAuthorialContent && setIsIconPickerOpen(true)}
                                                        disabled={!canEditAuthorialContent}
                                                        className={`action-emoji-button reference-emoji relative group ${canEditAuthorialContent ? '' : 'opacity-60 cursor-not-allowed'}`}
                                                    >
                                                        <EmojiGlyph symbol={editableAction.icon || '📝'} size="picker" className="scale-[1.45] text-white" />
                                                        <div className={`absolute inset-0 bg-black/40 rounded-[18px] flex items-center justify-center transition-opacity ${canEditAuthorialContent ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                                                            <EditIcon className="w-6 h-6 text-white" />
                                                        </div>
                                                    </button>
                                                </div>

                                                <div className="reference-eyebrow">{isNew ? 'Nova ação' : 'Editar ação'}</div>
                                                <input
                                                    id="onboarding-action-name-input"
                                                    ref={nameInputRef}
                                                    type="text"
                                                    aria-label="Nome da ação"
                                                    maxLength={80}
                                                    placeholder="Nome da ação"
                                                    value={editableAction.name || ''}
                                                    onBlur={(event) => {
                                                        if (!event.target.value.trim()) return;
                                                        const relatedTarget = event.relatedTarget as HTMLElement | null;
                                                        if (relatedTarget?.id === 'first-use-onboarding-next') return;
                                                        handleTutorialNextFormStep(FIRST_USE_ONBOARDING_EVENTS.actionNameCompleted);
                                                    }}
                                                    onChange={e => setEditableAction(p => ({ ...p, name: e.target.value }))}
                                                    disabled={!canEditAuthorialContent}
                                                    className={`action-name-input reference-title-input ${canEditAuthorialContent ? '' : 'opacity-65 cursor-not-allowed'}`}
                                                />
                                                </div>
                        </> : <>
                            <div className="reference-emoji" style={{background: 'var(--action-gradient)'}}><EmojiGlyph symbol={displayAction?.icon || '📝'} size="picker" /></div>
                            <div className="reference-eyebrow">{headerEyebrow}</div>
                            <h2>{headerTitle}</h2>
                        </>}
                        {mode === 'edit' && !isEditingTaskInstance ? <button
                                                    onClick={handleArenaButtonClick}
                                                    disabled={!currentArena && (lockArenaAssignment || !canEditExecutionSettings)}
                                                    className="reference-context reference-arena-choice"
                                                >
                                                    <span className="truncate">{currentArena?.icon ? `${currentArena.icon} ` : ''}{currentArena?.name || 'Escolher arena'}</span>
                                                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                                </button> : <p className="reference-context">{hasTaskInstanceContext && plannerOccurrenceLabel ? `${plannerOccurrenceLabel} · ` : ''}{currentArena?.name || 'Escolha uma arena'}</p>}
                    </header>

                    {saveError && (
                        <div
                            id="action-save-error"
                            role="alert"
                            className="mx-4 mb-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] font-bold leading-snug text-amber-100"
                        >
                            {saveError}
                        </div>
                    )}

                    {/* Assignment field for Office Mode */}
                    {isOfficeMode && isEditingActionBase && (
                        <div className="px-4 py-2 bg-black/[0.18] border-b border-white/[0.06]">
                            <label className="core-label mb-1 block">Quem vai fazer?(Atribuição)</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                <button
                                    onClick={() => setEditableAction(prev => ({ ...prev, originCodexId: undefined }))}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${!editableAction.originCodexId?.startsWith('assign:') ?'bg-[var(--skin-accent-color)] text-black border-[var(--skin-accent-color)]' : 'core-surface text-gray-300 border-white/8'}`}
                                >
                                    MESA (QUALQUER UM)
                                </button>
                                {enrichedMembers.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => setEditableAction(prev => ({ ...prev, originCodexId: `assign:${member.id}` }))}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${editableAction.originCodexId === `assign:${member.id}` ?'bg-blue-500 text-white border-blue-500' : 'core-surface text-gray-300 border-white/8'}`}
                                    >
                                        {member.nickname.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <nav className="action-main-tabs" aria-label="Abas da ação">
                        {([
                            ['basic', 'Geral', true],
                            ['context', 'Contexto', mode === 'edit' || !!displayAction?.description || !!displayAction?.context || displayAction?.scheduledStartTime != null],
                            // A aula mora aqui: com texto, a aba se chama Anotacao (e o nome que as campanhas usam).
                            ['note', mode === 'edit' || displayAction?.briefing?.trim() ? 'Anotação' : 'Checklist', mode === 'edit' || !!displayAction?.briefing || !!displayAction?.preFlight?.length],
                            // Midia so vem pronta, de campanha (27/10/2026): a acao pessoal nao anexa nada.
                            ['media', 'Mídia', !!displayAction?.assets?.length],
                        ] as const).filter(([key, , visible]) => visible && (!isEditingTaskInstance || key === 'basic')).map(([key, title]) => (
                            <button key={key} aria-pressed={key === 'basic' ? activeTab === 'basic' : activeTab === 'advanced' && advancedSubTab === key}
                                onClick={() => { setActiveTab(key === 'basic' ? 'basic' : 'advanced'); if (key !== 'basic') setAdvancedSubTab(key); setSchedulePanelOpen(false); }}>
                                {title}
                                {/* Pontinho: esta aba tem conteudo para ver (27/10/2026). */}
                                {mode === 'view' && ((key === 'note' && (conteudoDaAba.texto || conteudoDaAba.checklist)) || (key === 'media' && conteudoDaAba.midia)) && <i className="action-tab-dot" aria-label="tem conteúdo" />}
                            </button>
                        ))}
                    </nav>

                    {/* Content Scrollable */}
                    <div className="action-tab-body">

                        {/* BASIC TAB */}
                        {activeTab === 'basic' && (
                            <div className="action-general p-4 space-y-3 flex flex-col items-center animate-fade-in">
                                {mode === 'view' && displayAction ?(
                                    // VIEW MODE CONTENT
                                    <>
                                        {/* A ocorrência ganha contexto aqui: é uma nota rápida, não edição da ação-base. */}
                                        {hasTaskInstanceContext ? (
                                            <div className="w-full px-2">
                                                <label htmlFor="occurrence-note-quick" className="ml-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/48">Anotação desta ocorrência</label>
                                                <textarea
                                                    id="occurrence-note-quick"
                                                    value={instanceNote}
                                                    onChange={(event) => setInstanceNote(event.target.value.slice(0, 140))}
                                                    maxLength={140}
                                                    rows={2}
                                                    placeholder="Escreva uma anotação"
                                                    className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs leading-relaxed text-white outline-none transition-colors placeholder:text-white/28 focus:border-[var(--skin-accent-color)]/50 focus:bg-black/28"
                                                />
                                            </div>
                                        ) : (
                                        <div className="space-y-2 w-full text-center mb-4 px-2">
                                            <div className="relative">
                                                <input type="checkbox" id="desc-expand" className="peer hidden" />
                                                <p className="text-[10px] text-gray-400 leading-snug font-medium max-w-[280px] mx-auto line-clamp-3 peer-checked:line-clamp-none peer-checked:max-h-[72px] peer-checked:overflow-y-auto transition-all">
                                                    {displayAction.description || "Sem descrição definida."}
                                                </p>
                                                {displayAction.description && displayAction.description.length > 80 && (
                                                    <label
                                                        htmlFor="desc-expand"
                                                        className="block text-[9px] text-[var(--skin-accent-color)]/70 hover:text-[var(--skin-accent-color)] cursor-pointer mt-1 select-none"
                                                    >
                                                        [ ver mais ]
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                        )}

                                        <div className="reference-action-summary">
                                            <div className="reference-stat"><strong>{formatDurationLabel(effectiveDuration)}</strong><small>por vez</small></div>
                                            {displayAction.actionType === 'Ação Recorrente' && <div className="reference-stat"><strong>{displayAction.repetitions}</strong><small>repetições</small></div>}
                                        </div>
                                        <p className="reference-action-kind">{displayActionTypeLabel} · {displayDifficultyLabel || difficultyLabels[displayDifficulty]}</p>
                                        {!isPreview && hasTaskInstanceContext && canStartNow && (
                                            <button type="button" onClick={handleStartMission} className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/42 transition-colors hover:text-[var(--skin-accent-color)]">
                                                ▷ Começar agora
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    // EDIT MODE CONTENT (Form)
                                    <div className={`action-edit-form w-full space-y-3 ${hasTaskInstanceContext ? "action-occurrence-form" : ""}`}>
                                        {hasTaskInstanceContext && !isEditingTaskInstance && (
                                            <div className="rounded-[22px] border border-[var(--skin-accent-color)]/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.18))] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => switchEditScope('instance')}
                                                        className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition-all ${isEditingTaskInstance
                                                            ?'bg-[var(--skin-accent-color)] text-black shadow-[0_8px_18px_rgba(0,0,0,0.28)]'
                                                            : 'bg-black/20 text-white/70 border border-white/8 hover:bg-white/8'
                                                            }`}
                                                    >
                                                        Esta ocorrência
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={requestActionBaseEdit}
                                                        disabled={isLockedFromSource}
                                                        className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition-all ${isEditingActionBase
                                                            ?'bg-[var(--skin-accent-color)] text-black shadow-[0_8px_18px_rgba(0,0,0,0.28)]'
                                                            : isLockedFromSource
                                                                ?'bg-black/10 text-white/35 border border-white/8 cursor-not-allowed'
                                                                : 'bg-black/20 text-white/70 border border-white/8 hover:bg-white/8'
                                                            }`}
                                                    >
                                                        Ação base
                                                    </button>
                                                </div>
                                                <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-3 text-left">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--skin-accent-color)]/90">
                                                        {isEditingTaskInstance ?'Escopo da edição' : 'Impacto da edição'}
                                                    </div>
                                                    <p className="mt-2 text-[12px] leading-relaxed text-white/75">
                                                        {isEditingTaskInstance
                                                            ?'Você está mexendo só nesta ocorrência do Planner. Nome, ícone, arena, tipo, repetições e conteúdo avançado continuam na ação base.'
                                                            : isLockedFromSource
                                                                ?(lockedEditMessage || 'A ação base está protegida.')
                                                                : isInstalledCampaignAction
                                                                    ?'Você está ajustando uma ação de campanha. Conteúdo, mídia e texto ficam protegidos; horário, ritmo e agenda continuam personalizáveis no seu app.'
                                                                :'Você está editando a ação base. Mudanças visuais, estruturais e de conteúdo valem para a ação e para as próximas ocorrências.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {isEditingTaskInstance ? (
                                            <>
                                                <ActionSectionCard title="Duração">
                                                    <StyledRangeInput
                                                        label="Duração desta ocorrência"
                                                        value={editableTaskDuration}
                                                        min={15}
                                                        max={480}
                                                        step={1}
                                                        unit="min"
                                                        snapValues={ACTION_DURATION_OPTIONS}
                                                        formatValue={formatDurationLabel}
                                                        onChange={val => setEditableTaskDuration(val)}
                                                    />
                                                </ActionSectionCard>

                                                <ActionSectionCard title="Agenda">
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Data desta ocorrência</label>
                                                        <button onClick={() => setIsDatePickerOpen(true)} className="w-full p-3 mt-1 bg-black/20 rounded-xl flex justify-between items-center text-left hover:bg-black/30 transition-colors border border-white/8">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarIcon className="w-4 h-4 text-[var(--skin-accent-color)]" />
                                                                <span className="text-sm">{selectedDate ?selectedDate.toLocaleDateString('pt-BR') : 'Selecionar data'}</span>
                                                            </div>
                                                            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Horário desta ocorrência</label>
                                                        <button onClick={() => setIsTimePickerOpen(!isTimePickerOpen)} className="w-full p-3 mt-1 bg-black/20 rounded-xl flex justify-between items-center text-left hover:bg-black/30 transition-colors border border-white/8">
                                                            <span className="text-sm">{startTime || 'Sem horário'}</span>
                                                            <ChevronRightIcon className={`w-4 h-4 text-gray-500 transition-transform ${isTimePickerOpen ?'rotate-90' : ''}`} />
                                                        </button>
                                                        {isTimePickerOpen && (
                                                            <div className="relative mt-2 h-48">
                                                                <WheelPicker options={timeOptions} value={startTime || 'Sem Horário'} onSelect={handleTimeSelect} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
                                                        <label className="flex cursor-pointer items-center justify-between gap-3">
                                                            <span className="text-xs font-semibold text-white/80">Lembrar esta ocorrência</span>
                                                            <input
                                                                type="checkbox"
                                                                checked={instanceReminderEnabled}
                                                                onChange={() => { void handleInstanceReminderToggle(); }}
                                                                className="h-4 w-4 accent-[var(--skin-accent-color)]"
                                                            />
                                                        </label>
                                                        {instanceReminderEnabled && (
                                                            <div className="mt-3 border-t border-white/8 pt-3">
                                                                <div className="text-[10px] font-black uppercase tracking-[0.14em] text-white/42">Quanto antes?</div>
                                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                                    {OCCURRENCE_REMINDER_OPTIONS.map((minutes) => (
                                                                        <button key={minutes} type="button" onClick={() => { setInstanceReminderMinutes(minutes); setInstanceReminderTouched(true); }} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black transition-colors ${instanceReminderMinutes === minutes ? 'border-[var(--skin-accent-color)]/55 bg-[var(--skin-accent-color)]/16 text-[var(--skin-accent-color)]' : 'border-white/10 bg-black/20 text-white/55 hover:text-white'}`}>
                                                                            {minutes} min
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </ActionSectionCard>
                                                {!isLockedFromSource && (
                                                    <button type="button" onClick={requestActionBaseEdit} className="flex w-full items-center justify-center gap-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-[var(--skin-accent-color)]">
                                                        Editar ação-base <ChevronRightIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {!canEditAuthorialContent && (
                                                    <p className="px-1 text-[11px] leading-relaxed text-white/52">
                                                        Nome e ícone ficam protegidos na campanha. Aqui você só ajusta a execução local.
                                                    </p>
                                                )}

                                                {lockArenaAssignment && (
                                                    <p className="mt-1 px-1 text-[10px] leading-relaxed text-white/46">
                                                        Esta ação segue presa a esta arena guiada da mentoria.
                                                    </p>
                                                )}

                                                <div id="onboarding-action-type-button" className="space-y-2">
                                                    <div className="flex items-center justify-between px-1">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">Tipo da ação</span>

                                                    </div>
                                                    <div className="action-type-options" role="group" aria-label="Tipo da ação">
                                                        {[...ACTION_TYPE_CHOICES].sort((a, b) => ['Ação Recorrente', 'Livre', 'Marco', 'Compromisso'].indexOf(a.value) - ['Ação Recorrente', 'Livre', 'Marco', 'Compromisso'].indexOf(b.value)).map(choice => {
                                                            const selected = (editableAction.actionType || 'Ação Recorrente') === choice.value;
                                                            return (
                                                                <button
                                                                    key={choice.value}
                                                                    type="button"
                                                                    aria-pressed={selected}
                                                                    onClick={() => canEditActionType && handleActionTypeChange(choice.value)}
                                                                    disabled={!canEditActionType}
                                                                    className="action-type-choice disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="action-type-mark flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm font-black" aria-hidden="true">
                                                                            {selected ? '✓' : choice.glyph}
                                                                        </span>
                                                                        <div className="min-w-0">
                                                                            <div className="action-type-title text-[12px] font-bold">{choice.title}</div>
                                                                            <div className="action-type-subtitle text-[10px] font-medium">{choice.subtitle}</div>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                {editableAction.actionType === 'Livre' && (
                                                    <p className="px-1 text-[11px] leading-relaxed text-white/60">
                                                        Ação livre não usa repetições. Ela fica pronta para registrar quando quiser, sem cair em horário fixo.
                                                    </p>
                                                )}


                                                <div className="action-measures grid grid-cols-1 gap-2">
                                                <StyledRangeInput
                                                    containerId="onboarding-action-duration"
                                                    inputRef={durationInputRef}
                                                    label="Duração"
                                                    comBotoes
                                                    value={editableAction.duration || 60}
                                                    min={5} max={480} step={1} unit="min"
                                                    snapValues={ACTION_DURATION_OPTIONS}
                                                    formatValue={formatDurationLabel}
                                                    onChange={val => {
                                                        setEditableAction(p => ({ ...p, duration: val }));
                                                        handleTutorialNextFormStep(FIRST_USE_ONBOARDING_EVENTS.actionDurationAdjusted, { duration: val });
                                                    }}
                                                />

                                                {editableAction.actionType === 'Ação Recorrente' && (
                                                    <StyledRangeInput
                                                        containerId="onboarding-action-repetitions"
                                                        inputRef={repsInputRef}
                                                        label="Repetições"
                                                        comBotoes
                                                        value={editableAction.repetitions || 1}
                                                        min={1}
                                                        max={50}
                                                        step={1}
                                                        unit="x"
                                                        onChange={val => {
                                                            setEditableAction(p => ({ ...p, repetitions: val }));
                                                            handleTutorialNextFormStep(FIRST_USE_ONBOARDING_EVENTS.actionRepetitionsAdjusted, { repetitions: val });
                                                        }}
                                                    />
                                                )}

                                                </div>

                                                {/* O "Excluir Ação" de largura inteira que ficava aqui
                                                    subiu para o cabecalho, ao lado do botao de editar.
                                                    Ver o comentario la em cima: apagar nao e a ultima
                                                    etapa de preencher um formulario. */}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'advanced' && <div className={`action-section action-section-${advancedSubTab}`}>
                            {advancedSubTab === 'context' && <>
                                {!schedulePanelOpen ? <>
                                    {mode === 'edit' && canEditExecutionSettings && <StyledRangeInput label="Dificuldade" value={normalizeActionDifficulty(editableAction.difficulty)} min={0} max={3} step={1} unit={difficultyLabels[normalizeActionDifficulty(editableAction.difficulty)]} onChange={value => setEditableAction(p => ({...p, difficulty: value}))} />}
                                    {(mode === 'edit' || displayAction?.description) && <label className="action-context-note"><span>Contexto</span>
                                        {mode === 'edit' ? <textarea aria-label="Contexto da ação" maxLength={1000} value={editableAction.description || ''} disabled={!canEditAuthorialContent} onChange={e => setEditableAction(p => ({...p, description:e.target.value}))} placeholder="Onde ou em que situação?" /> : <p>{displayAction?.description}</p>}
                                    </label>}
                                    {(displayAction?.actionType === 'Ação Recorrente' || displayAction?.actionType === 'Compromisso') && <button className="action-schedule-entry" onClick={() => setSchedulePanelOpen(true)}><span>Agendamento<small>{temHorario ? `${startTime}${selectedDays.length ? ' · '+selectedDays.map(d=>d.slice(0,3)).join(', ') : ''}` : 'Não definido'}</small></span><ChevronRightIcon className="w-4 h-4" /></button>}
                                    <details className="action-extra-context"><summary>Energia e prioridade</summary><div className="action-inner-scroll">                                    {(mode === 'edit' || displayAction?.context?.energyLevel || displayAction?.context?.plannerQuadrant) && (
                                        <div className="p-4 space-y-6">
                                            {/* Energy Level */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Nível de Energia</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['low', 'medium', 'high'] as const).map(level => {
                                                        const isSelected = displayAction?.context?.energyLevel === level;
                                                        const isEditable = mode === 'edit' && canEditAuthorialContent;
                                                        return (
                                                            <button
                                                                key={level}
                                                                disabled={!isEditable}
                                                                onClick={() => isEditable && setEditableAction(prev => ({ ...prev, context: { ...prev.context, energyLevel: level } }))}
                                                                className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${isSelected
                                                                    ?'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] border-[var(--skin-accent-color)]/50 shadow-[0_0_15px_var(--sephirot-glow-color)]'
                                                                    : 'bg-black/20 text-gray-600 border-white/8 ' + (isEditable ?'hover:bg-white/5 hover:text-gray-400' : 'opacity-50')
                                                                    }`}
                                                            >
                                                                {level === 'low' ?'Baixo' : level === 'medium' ?'Médio' : 'Alto'}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Time of Day */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Período Ideal</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {(['morning', 'afternoon', 'evening', 'night'] as const).map(time => {
                                                        const isSelected = displayAction?.context?.timeOfDay === time;
                                                        const isEditable = mode === 'edit' && canEditAuthorialContent;
                                                        return (
                                                            <button
                                                                key={time}
                                                                disabled={!isEditable}
                                                                onClick={() => isEditable && setEditableAction(prev => ({ ...prev, context: { ...prev.context, timeOfDay: time } }))}
                                                                className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${isSelected
                                                                    ?'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] border-[var(--skin-accent-color)]/50 shadow-[0_0_15px_var(--sephirot-glow-color)]'
                                                                    : 'bg-black/20 text-gray-600 border-white/8 ' + (isEditable ?'hover:bg-white/5 hover:text-gray-400' : 'opacity-50')
                                                                    }`}
                                                            >
                                                                {time === 'morning' ?'Manhã' : time === 'afternoon' ?'Tarde' : time === 'evening' ?'Noite' : 'Madrugada'}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {canUsePlannerMatrix && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Matriz do Planner</label>
                                                        <span className="text-[10px] uppercase tracking-[0.16em] text-white/35">Bay Area</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {PLANNER_MATRIX_OPTIONS.map((option) => {
                                                            const isSelected = displayAction?.context?.plannerQuadrant === option.value;
                                                            const isEditable = mode === 'edit' && canEditAuthorialContent;
                                                            return (
                                                                <button
                                                                    key={option.value}
                                                                    type="button"
                                                                    title={option.title}
                                                                    disabled={!isEditable}
                                                                    onClick={() => isEditable && setEditableAction((prev) => ({
                                                                        ...prev,
                                                                        context: {
                                                                            ...prev.context,
                                                                            plannerQuadrant: prev.context?.plannerQuadrant === option.value ? undefined : option.value,
                                                                        },
                                                                    }))}
                                                                    className={`rounded-2xl border px-3 py-3 text-left transition-all ${isSelected
                                                                        ? 'border-[var(--skin-accent-color)]/50 bg-[var(--skin-accent-color)]/16 text-[var(--skin-accent-color)] shadow-[0_0_16px_rgba(255,215,0,0.08)]'
                                                                        : 'border-white/8 bg-black/20 text-white/56 ' + (isEditable ? 'hover:bg-white/[0.05] hover:text-white/82' : 'opacity-50')
                                                                    }`}
                                                                >
                                                                    <div className="text-[11px] font-black uppercase tracking-[0.18em]">{option.label}</div>
                                                                    <div className="mt-1 text-[10px] leading-relaxed text-current/80">{option.title}</div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
</div></details>
                                </> : <div className="action-schedule-panel">
                                    <button className="action-back" onClick={() => setSchedulePanelOpen(false)}>← Contexto</button>
                                    <div className="action-schedule-fields">
                                        <label>{editableAction.actionType === 'Compromisso' ? 'Data' : 'A partir de'}<input aria-label="Data de início" type="date" disabled={mode !== 'edit' || !canEditExecutionSettings} value={editableAction.actionType === 'Compromisso' ? (selectedDate ? getLocalDateString(selectedDate) : '') : (editableAction.context?.schedule?.startsOn || getLocalDateString())} onChange={e => { if (editableAction.actionType === 'Compromisso') setSelectedDate(e.target.value ? getTaskDateValue(e.target.value) : null); else updateScheduleContext(schedule=>({...schedule, startsOn:e.target.value, limitToRepetitions:true})); }} /></label>
                                        <label>Horário<input aria-label="Horário obrigatório" type="time" required disabled={mode !== 'edit' || !canEditExecutionSettings} value={temHorario ? startTime! : ''} onChange={e => { setStartTime(e.target.value || null); if (editableAction.actionType === 'Ação Recorrente') updateScheduleContext(schedule=>({...schedule, startsOn:schedule.startsOn || getLocalDateString(), limitToRepetitions:true})); }} /></label>
                                    </div>
                                    {editableAction.actionType === 'Ação Recorrente' && <div className="action-weekdays">{week.map(day => <button key={day} aria-pressed={selectedDays.includes(day)} disabled={mode !== 'edit' || !canEditExecutionSettings} onClick={()=>{handleDayToggle(day);updateScheduleContext(schedule=>({...schedule, startsOn:schedule.startsOn || getLocalDateString(),limitToRepetitions:true}));}}>{day.slice(0,3)}</button>)}</div>}
                                    {agendaPrevista && <p className="action-schedule-summary">{agendaPrevista.vezes} de {editableAction.repetitions || 1} repetições neste ciclo · até {agendaPrevista.ateLabel}</p>}
                                    {canUseReminderToggle && <button className="action-schedule-entry" disabled={mode !== 'edit'} aria-pressed={editableAction.context?.schedule?.notifyBeforeMinutes === 15} onClick={()=>{void handleReminderToggle();}}><span>Lembrar 15 min antes</span><span>{editableAction.context?.schedule?.notifyBeforeMinutes === 15 ? 'Ligado' : 'Desligado'}</span></button>}
                                    {mode === 'edit' && canEditExecutionSettings && <button className="action-back" onClick={()=>{setStartTime(null);setSelectedDays([]);updateScheduleContext(()=>({}));setSchedulePanelOpen(false);}}>Remover agendamento</button>}
                                </div>}
                            </>}
                            {advancedSubTab === 'note' && <>
                                {(mode === 'edit' || displayAction?.briefing) && <label className="action-briefing"><span>Anotação</span>{mode === 'edit' && canEditAuthorialContent ? <textarea aria-label="Anotação" value={editableAction.briefing || ''} onChange={e=>setEditableAction(p=>({...p,briefing:e.target.value}))} placeholder="Escreva aqui…" /> : <p>{displayAction?.briefing || 'Sem anotação.'}</p>}</label>}
                                {briefingPages.length > 0 && <button className="action-read-link" onClick={openBriefingReader}>Abrir leitura</button>}
                                <div className="action-checklist-label">Checklist</div>
                                <div className="action-checklist-scroll" aria-label="Itens do checklist">{(displayAction?.preFlight || []).map((item,i)=><div className="action-checklist-row" key={i}><span title={item}>{item}</span>{mode === 'edit' && canEditAuthorialContent && <button aria-label="Remover item do checklist" onClick={()=>setEditableAction(p=>({...p,preFlight:p.preFlight?.filter((_,idx)=>idx!==i)}))}><XIcon className="w-4 h-4" /></button>}</div>)}</div>
                                {mode === 'edit' && canEditAuthorialContent && <form className="action-checklist-add" onSubmit={e=>{e.preventDefault();if(newChecklistItem.trim()){setEditableAction(p=>({...p,preFlight:[...(p.preFlight || []),newChecklistItem.trim()]}));setNewChecklistItem('');}}}><input aria-label="Novo item do checklist" maxLength={200} value={newChecklistItem} onChange={e=>setNewChecklistItem(e.target.value)} placeholder="Adicionar item…" /><button type="submit" aria-label="Adicionar item ao checklist">+</button></form>}
                            </>}
                                    {advancedSubTab === 'media' && (
                                        <div className="h-full flex flex-col p-4">
                                            {mediaPreviewUrl ?(
                                                <div className="w-full aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/8 relative group mb-4">
                                                    <img
                                                        src={mediaPreviewUrl}
                                                        className="w-full h-full object-cover"
                                                        alt="Mídia"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                    {mode === 'edit' && (
                                                        <button aria-label="Remover mídia"
                                                            onClick={() => { setNewAssetUrl(''); setMediaSlot({ imageUrl: '', caption: '' }); setEditableAction(p => ({ ...p, assets: [] })); }}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full text-white hover:bg-red-500 transition-colors"
                                                        >
                                                            <XIcon className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-video bg-white/5 rounded-xl border border-dashed border-white/8 flex flex-col items-center justify-center gap-2 mb-4">
                                                    <span className="text-4xl opacity-20">📋</span>
                                                    <span className="text-xs text-gray-500 font-medium">Sem mídia vinculada</span>
                                                </div>
                                            )}

                                        </div>
                                    )}


                        </div>}
                    </div>

                    {mode === 'view' && <footer className="reference-footer action-view-footer">
                        {hasTaskInstanceContext && !isPreview ? <div className="reference-execution-buttons">
                            <button ref={saveButtonRef} onClick={() => { saveOccurrenceNote(); onClose(); }} className="reference-primary">OK</button>
                            {canStartNow && <button onMouseDown={handleCompleteNowStart} onMouseUp={clearCompleteNowHold} onMouseLeave={clearCompleteNowHold} onTouchStart={handleCompleteNowStart} onTouchEnd={clearCompleteNowHold} onTouchCancel={clearCompleteNowHold} onContextMenu={e => e.preventDefault()} className="reference-complete" style={{touchAction:'none',userSelect:'none',WebkitTouchCallout:'none'} as React.CSSProperties}>
                                <span>{completeNowTriggered ? 'Concluindo' : isCompletingNowHold ? `Segurando… ${Math.round(completeNowHoldProgress)}%` : 'Segure 1s para concluir'}</span>
                                <i style={{width:`${completeNowHoldProgress}%`}} />
                            </button>}
                        </div> : !isPreview && canStartNow ? <div className="reference-execution-buttons">
                            <button ref={saveButtonRef} onClick={handleStartMission} className="reference-primary"><PlayIcon className="w-4 h-4" />Começar agora</button>
                            <button onMouseDown={handleCompleteNowStart} onMouseUp={clearCompleteNowHold} onMouseLeave={clearCompleteNowHold} onTouchStart={handleCompleteNowStart} onTouchEnd={clearCompleteNowHold} onTouchCancel={clearCompleteNowHold} onContextMenu={e => e.preventDefault()} className="reference-complete" style={{touchAction:'none',userSelect:'none',WebkitTouchCallout:'none'} as React.CSSProperties}>
                                <span>{completeNowTriggered ? 'Concluindo' : isCompletingNowHold ? `Segurando… ${Math.round(completeNowHoldProgress)}%` : 'Segure 1s para concluir'}</span>
                                <i style={{width:`${completeNowHoldProgress}%`}} />
                            </button>
                        </div> : <button ref={saveButtonRef} onClick={onClose} className="reference-primary">Fechar</button>}
                    </footer>}

                    {mode === 'edit' && <footer className="reference-footer">
                        {!isNew && !isPreview && !disableAuthoring && <button className="reference-delete" onClick={handleDelete}><Trash2Icon className="w-4 h-4" />Excluir ação</button>}
                        <button id="onboarding-action-save-button" ref={saveButtonRef} onClick={handleSave} className="reference-primary luxe-skin-button luxe-brilho">{isNew ? 'Criar ação' : 'Salvar alterações'}</button>
                    </footer>}
                </ReferencePlate>
            </div>

            {/* Pickers */}
            {isIconPickerOpen && <IconPickerModal onSelect={handleIconSelect} onClose={() => setIsIconPickerOpen(false)} />}
            {isArenaPickerOpen && (
                <ArenaSelectionModal
                    currentArenaId={editableAction.arenaId || ''}
                    onSelect={handleArenaSelect}
                    onClose={() => setIsArenaPickerOpen(false)}
                />
            )}
            {isDatePickerOpen && (
                <DatePickerModal
                    title="Data do Compromisso"
                    selectedDate={selectedDate}
                    onSelect={handleDateSelect}
                    onClose={() => setIsDatePickerOpen(false)}
                    minDate={new Date()}
                />
            )}
            {isConfirmDeleteOpen && (
                <ConfirmationModal
                    title="Confirmar exclusão"
                    message={`Tem certeza que deseja excluir a ação "${action?.name}"?`}
                    onConfirm={() => { void confirmDelete(); }}
                    onCancel={() => setConfirmDeleteOpen(false)}
                />
            )}
        </Portal>
        {isBriefingReaderOpen && briefingPages.length > 0 && (
            <Portal>
                <div
                    className={`fixed inset-0 z-[10050] bg-black/88 backdrop-blur-md ${leitorEscuro ? 'leitor-escuro' : ''}`}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsBriefingReaderOpen(false);
                        }
                    }}
                >
                    <div
                        className="leitor-papel flex h-full w-full flex-col overflow-hidden border-y border-[#6f5a31]/30 bg-[radial-gradient(circle_at_top,_rgba(255,245,214,0.94)_0%,_rgba(245,228,186,0.98)_38%,_rgba(230,206,156,0.98)_100%)] shadow-[0_40px_120px_rgba(0,0,0,0.55)] sm:border sm:border-[#6f5a31]/40 sm:rounded-[2rem]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="leitor-topo flex items-center justify-between border-b border-[#8a6b38]/25 bg-[linear-gradient(180deg,rgba(255,251,234,0.84),rgba(241,219,174,0.78))] px-4 py-4 sm:px-7">
                            <div className="min-w-0">
                                <div className="leitor-rotulo text-[11px] font-bold uppercase tracking-[0.36em] text-[#7e6234]">
                                    Leitura guiada
                                </div>
                                <div className="leitor-titulo truncate pt-1 text-base font-black uppercase tracking-[0.14em] text-[#3f2b13] sm:text-lg">
                                    {displayAction?.name || 'Anotação'}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={alternarLeitorEscuro} aria-label={leitorEscuro ? 'Modo claro' : 'Modo escuro'} title={leitorEscuro ? 'Modo claro' : 'Modo escuro'} className="leitor-botao flex h-11 w-11 items-center justify-center rounded-full border border-[#8a6b38]/35 bg-white/35 text-lg text-[#4b3318] transition-colors hover:bg-white/55">
                                    {leitorEscuro ? '☀️' : '🌙'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsBriefingReaderOpen(false)}
                                    className="leitor-botao flex h-11 w-11 items-center justify-center rounded-full border border-[#8a6b38]/35 bg-white/35 text-[#4b3318] transition-colors hover:bg-white/55"
                                    aria-label="Fechar leitura"
                                >
                                    <XIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div
                            className="leitor-area relative flex-1 overflow-hidden bg-[linear-gradient(180deg,rgba(255,250,235,0.86),rgba(243,224,184,0.92))]"
                            style={{ touchAction: 'pan-y' }}
                            onPointerDown={(event) => {
                                briefingReaderPointerStartRef.current = event.clientX;
                                briefingReaderPointerStartYRef.current = event.clientY;
                            }}
                            onPointerUp={(event) => {
                                if (briefingReaderPointerStartRef.current === null) return;
                                const deltaX = event.clientX - briefingReaderPointerStartRef.current;
                                const deltaY = event.clientY - (briefingReaderPointerStartYRef.current ?? event.clientY);
                                briefingReaderPointerStartRef.current = null;
                                briefingReaderPointerStartYRef.current = null;
                                if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;
                                if (deltaX < 0) {
                                    navigateBriefingPage(briefingPageIndex + 1);
                                } else {
                                    navigateBriefingPage(briefingPageIndex - 1);
                                }
                            }}
                            onPointerCancel={() => {
                                briefingReaderPointerStartRef.current = null;
                                briefingReaderPointerStartYRef.current = null;
                            }}
                            onTouchStart={(event) => {
                                briefingReaderTouchStartRef.current = event.touches[0]?.clientX ?? null;
                                briefingReaderTouchStartYRef.current = event.touches[0]?.clientY ?? null;
                            }}
                            onTouchEnd={(event) => {
                                if (briefingReaderTouchStartRef.current === null) return;
                                const endX = event.changedTouches[0]?.clientX ?? briefingReaderTouchStartRef.current;
                                const endY = event.changedTouches[0]?.clientY ?? briefingReaderTouchStartYRef.current ?? 0;
                                const deltaX = endX - briefingReaderTouchStartRef.current;
                                const deltaY = endY - (briefingReaderTouchStartYRef.current ?? endY);
                                briefingReaderTouchStartRef.current = null;
                                briefingReaderTouchStartYRef.current = null;
                                if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;
                                if (deltaX < 0) {
                                    navigateBriefingPage(briefingPageIndex + 1);
                                } else {
                                    navigateBriefingPage(briefingPageIndex - 1);
                                }
                            }}
                            onTouchCancel={() => {
                                briefingReaderTouchStartRef.current = null;
                                briefingReaderTouchStartYRef.current = null;
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => navigateBriefingPage(briefingPageIndex - 1)}
                                disabled={briefingPageIndex === 0}
                                className="leitor-seta absolute inset-y-0 left-0 z-[2] hidden w-[16%] min-w-[3.5rem] items-center justify-start pl-2 text-[#6b522b]/44 transition-opacity hover:text-[#6b522b]/78 disabled:pointer-events-none disabled:opacity-0 sm:flex"
                                aria-label="Voltar página"
                            >
                                <ChevronLeftIcon className="h-6 w-6" />
                            </button>
                            <button
                                type="button"
                                onClick={() => navigateBriefingPage(briefingPageIndex + 1)}
                                disabled={briefingPageIndex >= briefingPages.length - 1}
                                className="leitor-seta absolute inset-y-0 right-0 z-[2] hidden w-[16%] min-w-[3.5rem] items-center justify-end pr-2 text-[#6b522b]/44 transition-opacity hover:text-[#6b522b]/78 disabled:pointer-events-none disabled:opacity-0 sm:flex"
                                aria-label="Avançar página"
                            >
                                <ChevronRightIcon className="h-6 w-6" />
                            </button>
                            <div
                                className="leitor-enfeite pointer-events-none absolute inset-0 opacity-60"
                                style={{
                                    backgroundImage: 'linear-gradient(180deg, rgba(136,103,52,0.08) 0, rgba(136,103,52,0.08) 1px, transparent 1px, transparent 34px)',
                                    backgroundSize: '100% 34px',
                                }}
                            />
                            <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-5 sm:px-8 sm:py-8">
                                <div className="relative flex-1 overflow-y-auto pr-1">
                                    <div
                                        className="leitor-sombra pointer-events-none absolute inset-x-4 top-4 bottom-[6.2rem] rounded-[1.7rem] border border-[#6c5029]/12 bg-[linear-gradient(180deg,rgba(195,159,97,0.16),rgba(123,89,42,0.06))] shadow-[0_20px_40px_rgba(69,46,17,0.12)] sm:inset-x-10 sm:top-10 sm:bottom-[6.5rem]"
                                        style={briefingPageStackStyle}
                                    />
                                    <div
                                        className="leitor-folha relative overflow-hidden rounded-[1.6rem] border border-[#7a5e34]/18 bg-[linear-gradient(180deg,rgba(255,253,244,0.8),rgba(248,236,206,0.58))] px-6 py-7 transition-[transform,opacity,filter,box-shadow] duration-300 ease-out will-change-transform sm:px-10 sm:py-10"
                                        style={briefingPageTurnStyle}
                                    >
                                        <div
                                            className="pointer-events-none absolute inset-y-0 w-20"
                                            style={briefingPageFoldGlowStyle}
                                        />
                                        <div className="leitor-enfeite pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.32),rgba(255,255,255,0))]" />
                                        <div className="leitor-enfeite pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(0deg,rgba(104,75,33,0.08),rgba(104,75,33,0))]" />
                                        <div className="rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(255,253,244,0.04),rgba(248,236,206,0))]">
                                            {briefingPages[briefingPageIndex]
                                                .split(/\n\s*\n/)
                                                .filter(Boolean)
                                                .map((paragraph, index) => (
                                                    <p
                                                        key={`${briefingPageIndex}-${index}`}
                                                        className="leitor-texto relative mb-5 text-[15px] leading-8 text-[#3d2a14] last:mb-0 sm:text-[17px] sm:leading-9"
                                                    >
                                                        {paragraph}
                                                    </p>
                                                ))}
                                        </div>
                                        {/* Numero da pagina embaixo a direita, como em livro (27/10/2026). */}
                                        <div className="leitor-rotulo mt-4 text-right font-serif text-[13px] italic text-[#7d6237]" aria-label={`Página ${briefingPageIndex + 1} de ${briefingPages.length}`}>
                                            {briefingPageIndex + 1}
                                            <span className="opacity-60"> / {briefingPages.length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => navigateBriefingPage(briefingPageIndex - 1)}
                                        disabled={briefingPageIndex === 0}
                                        className="reader-nav-button inline-flex h-10 min-w-[3rem] items-center justify-center rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label="Página anterior"
                                    >
                                        <ChevronLeftIcon className="h-4 w-4" />
                                    </button>
                                    <div className="leitor-rotulo text-center text-[11px] font-bold uppercase tracking-[0.28em] text-[#7d6237]">
                                        Toque nas laterais, arraste ou use as setas
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigateBriefingPage(briefingPageIndex + 1)}
                                        disabled={briefingPageIndex >= briefingPages.length - 1}
                                        className="reader-nav-button inline-flex h-10 min-w-[3rem] items-center justify-center rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label="Próxima página"
                                    >
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                {/* CONCLUIR AO TERMINAR DE LER (27/10/2026): na ultima pagina. Se a
                                    acao esta marcada no planner, conclui naquele horario; se esta no
                                    estoque, entra no planner na hora do toque, ja concluida. */}
                                {podeConcluirLeitura && briefingPageIndex >= briefingPages.length - 1 && (
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            type="button"
                                            disabled={concluindoLeitura}
                                            onClick={() => void concluirLeitura()}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#6f5a31]/60 bg-[#3f2b13] px-6 text-xs font-black uppercase tracking-[0.18em] text-[#f5e6c4] shadow-[0_8px_20px_rgba(63,43,19,0.35)] transition-colors hover:bg-[#523a1b] disabled:opacity-60"
                                        >
                                            {concluindoLeitura ? 'Concluindo…' : 'Concluir leitura'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Portal>
        )}
        </>
    );
};












