import React, { useState, useEffect, useRef } from 'react';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { Action, DayOfWeek, ActionType } from '../types';
import { GlassCard } from './GlassCard';
import { ChevronRightIcon, EditIcon, XIcon, CalendarIcon, Trash2Icon, ClockIcon, PlayIcon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
import { WheelPicker } from './inputs/WheelPicker';
import { ImageUploadSlot } from './inputs/ImageUploadSlot';
import { SelectionModal } from './SelectionModal';
import { ConfirmationModal } from './ConfirmationModal';
import { ArenaSelectionModal } from './ArenaSelectionModal';
import { DatePickerModal } from './DatePickerModal';
import { ASSET_ACCENT_COLORS } from '../constants/assetVisuals';
import { FIRST_USE_ONBOARDING_EVENTS } from '../utils/firstUseOnboarding';
import { REST_SCREEN_ACTION_SESSION_EVENT, createRestScreenActionSession } from '../utils/restScreenActionSession';

import { Portal } from './Portal';
import { EmojiGlyph } from './EmojiGlyph';
import './core-ui.css';

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

interface ActionModalProps {
    arenaId: string;
    action: Action | null;
    taskId?: string; // NEW: support for specific task override
    initialMode: 'view' | 'edit';
    onClose: () => void;
    isPreview?: boolean;
    customThemeColor?: string;
}

const StyledRangeInput: React.FC<{ label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (val: number) => void, inputRef?: React.Ref<HTMLDivElement>, containerId?: string }> =
    ({ label, value, min, max, step, unit, onChange, inputRef, containerId }) => (
        <div id={containerId} ref={inputRef} className="p-2.5 core-surface rounded-xl space-y-1.5">
            <div className="flex justify-between items-center">
                <label className="core-label">{label}</label>
                <span className="text-sm font-semibold text-white">{value} {unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-[var(--skin-accent-color)]"
            />
        </div>
    );

const DayToggle: React.FC<{ day: DayOfWeek, selected: boolean, onClick: () => void }> = ({ day, selected, onClick }) => (
    <button type="button" onClick={onClick} className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors border ${selected ?'bg-[var(--skin-accent-color)] text-white border-[var(--skin-accent-color)]' : 'core-surface text-gray-300 hover:bg-white/[0.06]'}`}>
        {day.slice(0, 3)}
    </button>
);

export const ActionModal: React.FC<ActionModalProps> = ({ arenaId, action, taskId, initialMode, onClose, isPreview, customThemeColor }) => {
    const { addAction, updateAction, deleteAction, getArenas, scheduleMultipleTasks, scheduleTask, tasks, updateTask, clan, enrichedClanMembers, showToast } = useGame();

    const isNew = !action;
    const isInstalledCodexAction = Boolean(action?.originCodexId && !action.originCodexId.startsWith('assign:'));

    const [mode, setMode] = useState(isNew && !isPreview ?'edit' : initialMode);
    const [hasConfirmedInstalledCodexEdit, setHasConfirmedInstalledCodexEdit] = useState(false);
    const [showInstalledCodexEditConfirmation, setShowInstalledCodexEditConfirmation] = useState(false);
    const [editableAction, setEditableAction] = useState<Partial<Action>>(
        action || { arenaId: arenaId, name: '', description: '', icon: '📝', duration: 60, repetitions: 1, actionType: 'Ação Recorrente', difficulty: 3 }
    );

    // NEW: Task duration override state
    const currentTask = taskId ?tasks.find(t => t.id === taskId) : null;
    const startNowTask = React.useMemo(() => {
        if (!action) return null;

        const today = getLocalDateString(new Date());
        if (currentTask && currentTask.date === today && !currentTask.completed) {
            return currentTask;
        }

        return tasks.find(task => task.actionId === action.id && task.date === today && !task.completed) || null;
    }, [action, currentTask, tasks]);
    const canStartNow = mode === 'view' && !isPreview && Boolean(startNowTask);
    const [editableTaskDuration, setEditableTaskDuration] = useState<number>(currentTask?.duration || action?.duration || 60);

    // New View Mode State
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
    const [advancedSubTab, setAdvancedSubTab] = useState<'media' | 'note' | 'checklist' | 'context'>('media');

    const nameInputRef = useRef<HTMLInputElement>(null);
    const durationInputRef = useRef<HTMLDivElement>(null);
    const repsInputRef = useRef<HTMLDivElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);
    const startNowHoldIntervalRef = useRef<number | null>(null);
    const [startNowHoldProgress, setStartNowHoldProgress] = useState(0);
    const [startNowTriggered, setStartNowTriggered] = useState(false);

    // State for checklist inputs in edit mode
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [newAssetUrl, setNewAssetUrl] = useState('');
    const [mediaSlot, setMediaSlot] = useState({ imageUrl: '', caption: '' });

    const handleTutorialNextFormStep = () => {
        // No-op
    }

    useEffect(() => {
        return () => {
            if (startNowHoldIntervalRef.current) {
                window.clearInterval(startNowHoldIntervalRef.current);
            }
        };
    }, []);


    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [isActionTypePickerOpen, setIsActionTypePickerOpen] = useState(false);
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

    // Office Mode specific
    const isOfficeMode = clan?.clanType === 'Office';
    const enrichedMembers = enrichedClanMembers;

    const handleSave = () => {
        if (!editableAction.name?.trim()) {
            showToast('Dê um título para a ação antes de salvar.', 'warning');
            window.setTimeout(() => nameInputRef.current?.focus(), 40);
            return;
        }

        let scheduledStartTime: number | undefined;
        if (startTime && startTime !== 'Sem Horário') {
            const [h, m] = startTime.split(':').map(Number);
            scheduledStartTime = h * 60 + m;
        }

        const nextRepetitions = editableAction.actionType === 'Ação Recorrente'
            ?Math.min(50, Math.max(1, Math.floor(editableAction.repetitions || 1)))
            : 1;

        // SAFEGUARD: Ensure duration is within bounds (5-240) and defaults to 60 if invalid
        const rawDuration = editableAction.duration;
        const validDuration = (rawDuration && rawDuration >= 5 && rawDuration <= 480) ?rawDuration : 60;

        const actionData: Omit<Action, 'id'> = {
            arenaId: editableAction.arenaId || '', // Será tratado no context
            name: editableAction.name,
            description: editableAction.description?.trim() || undefined,
            icon: editableAction.icon || '📝',
            duration: validDuration,
            repetitions: nextRepetitions,
            actionType: editableAction.actionType || 'Ação Recorrente',
            difficulty: editableAction.difficulty || 3,
            scheduledDays: editableAction.actionType === 'Ação Recorrente' ?selectedDays : undefined,
            scheduledStartTime: editableAction.actionType === 'Livre' ?undefined : scheduledStartTime,
            briefing: editableAction.briefing?.trim() || undefined,
            assets: editableAction.assets || [],
            preFlight: editableAction.preFlight || [],
            context: editableAction.context || {}
        };

        const scheduleTasks = async (actionIdToSchedule: string) => {
            // Para Ação Recorrente: usa dias da semana
            if (editableAction.actionType === 'Ação Recorrente' && selectedDays.length > 0 && startTime !== null && startTime !== 'Sem Horário') {
                const [hour, minute] = startTime.split(':').map(Number);
                const startTimeInMinutes = hour * 60 + minute;
                await scheduleMultipleTasks(actionIdToSchedule, selectedDays, startTimeInMinutes);
            }

            // Para Compromisso: usa data específica
            if (editableAction.actionType === 'Compromisso' && selectedDate && startTime !== null && startTime !== 'Sem Horário') {
                const [hour, minute] = startTime.split(':').map(Number);
                const startTimeInMinutes = hour * 60 + minute;
                const dateString = getLocalDateString(selectedDate);
                await scheduleTask(actionIdToSchedule, dateString, startTimeInMinutes);
            }
        }

        const executeSave = async () => {
            try {
                if (taskId && typeof updateTask === 'function') {
                    // If we are editing a specific task from the planner
                    let scheduledStartTime: number | undefined;
                    if (startTime && startTime !== 'Sem Horário') {
                        const [h, m] = startTime.split(':').map(Number);
                        scheduledStartTime = h * 60 + m;
                    }

                    updateTask(taskId, {
                        duration: editableTaskDuration,
                        startTime: scheduledStartTime
                    });
                } else if (isNew && typeof addAction === 'function') {
                    // Let the context generate the ID to ensure consistency
                    const newAction = await addAction(actionData);
                    if (newAction?.id) {
                        await scheduleTasks(newAction.id);
                        window.dispatchEvent(new CustomEvent(FIRST_USE_ONBOARDING_EVENTS.actionCreated, { detail: { actionId: newAction.id } }));
                    }
                    showToast('Ação criada.', 'success');
                } else if (action?.id && typeof updateAction === 'function') {
                    updateAction(action.id, actionData);
                    await scheduleTasks(action.id);
                    showToast('Ação atualizada.', 'success');
                }
                onClose();
            } catch (err) {
                console.error("Error executing save:", err);
                showToast('Não foi possível salvar a ação.', 'error');
            }
        };

        executeSave().catch(err => console.error("Error saving action:", err));
    };

    const clearStartNowHold = () => {
        if (startNowHoldIntervalRef.current) {
            window.clearInterval(startNowHoldIntervalRef.current);
            startNowHoldIntervalRef.current = null;
        }

        if (!startNowTriggered) {
            setStartNowHoldProgress(0);
        }
    };

    const handleStartMission = () => {
        if (!action || !startNowTask || startNowHoldIntervalRef.current) return;

        setStartNowTriggered(false);
        const startedAt = Date.now();
        const holdDuration = 1000;

        startNowHoldIntervalRef.current = window.setInterval(() => {
            const elapsed = Date.now() - startedAt;
            const progress = Math.min((elapsed / holdDuration) * 100, 100);
            setStartNowHoldProgress(progress);

            if (progress < 100) return;

            clearStartNowHold();
            setStartNowTriggered(true);

            window.dispatchEvent(new CustomEvent(REST_SCREEN_ACTION_SESSION_EVENT, {
                detail: createRestScreenActionSession({
                    actionId: action.id,
                    taskId: startNowTask?.id,
                    actionName: action.name,
                    actionIcon: action.icon,
                    durationMinutes: startNowTask?.duration || currentTask?.duration || action.duration || 60,
                    actionType: action.actionType,
                }),
            }));

            onClose();
        }, 16);
    };

    const handleDelete = () => { if (action) setConfirmDeleteOpen(true); };
    const confirmDelete = () => { if (action) { deleteAction(action.id); onClose(); } }

    const handleCancel = () => {
        if (isNew) onClose();
        else {
            resetFromAction(action);
            setMode('view');
            setIsTimePickerOpen(false);
            setIsDatePickerOpen(false);
        }
    };

    const handleIconSelect = (icon: string) => { setEditableAction(p => ({ ...p, icon })); setIsIconPickerOpen(false); };
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
        setIsActionTypePickerOpen(false);
    }
    const handleArenaSelect = (id: string) => { setEditableAction(p => ({ ...p, arenaId: id })); setIsArenaPickerOpen(false); };
    const handleTimeSelect = (time: string) => { setStartTime(time); };
    const handleDateSelect = (date: Date) => { setSelectedDate(date); setIsDatePickerOpen(false); };
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };

    const getStartTimeLabel = (value?: number | null) => {
        if (value === undefined || value === null) return null;
        const h = Math.floor(value / 60);
        const m = value % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const resetFromAction = (nextAction: Action | null) => {
        const baseAction = nextAction || { arenaId: arenaId, name: '', description: '', icon: '📝', duration: 60, repetitions: 1, actionType: 'Ação Recorrente', difficulty: 3 };
        setEditableAction(baseAction);
        setSelectedDays(nextAction?.scheduledDays || []);
        setStartTime(getStartTimeLabel(nextAction?.scheduledStartTime) || null);
        setSelectedDate(null);
        const asset = nextAction?.assets?.find(a => a.type === 'image' || a.type === 'video');
        const imageUrl = asset?.url || '';
        const caption = asset?.title || '';
        setNewAssetUrl(imageUrl);
        setMediaSlot({ imageUrl, caption });
        setActiveTab('basic');
        setAdvancedSubTab('media');
    };

    useEffect(() => {
        const shouldBlockInitialEdit = !isNew && initialMode === 'edit' && isInstalledCodexAction;
        setMode(isNew ?'edit' : (shouldBlockInitialEdit ?'view' : initialMode));
        setHasConfirmedInstalledCodexEdit(false);
        setShowInstalledCodexEditConfirmation(shouldBlockInitialEdit);
        resetFromAction(action);
    }, [action?.id, arenaId, initialMode, isInstalledCodexAction]);

    const displayAction = mode === 'view' ?action : editableAction;

    // Merge task duration if editing a specific task
    const effectiveDuration = taskId && currentTask ?currentTask.duration : (displayAction?.duration || 60);

    const difficultyLabels = ['MUITO FÁCIL', 'FÁCIL', 'NORMAL', 'DIFÁCIL', 'EXTREMO'];
    const week: DayOfWeek[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
    const timeOptions = ['Sem Horário', ...Array.from({ length: 24 * 4 }, (_, i) => { const h = Math.floor(i / 4); const m = (i % 4) * 15; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; })];
    const actionTypeOptions: ActionType[] = ['Ação Recorrente', 'Compromisso', 'Marco', 'Livre'];

    if (!displayAction && mode === 'view') return null;

    const arenaAccentColor = currentArena?.assetId
        ?ASSET_ACCENT_COLORS[currentArena.assetId as keyof typeof ASSET_ACCENT_COLORS]
        : undefined;
    const accentColor = customThemeColor || arenaAccentColor || '#F0C843';
    const modalStyle = { '--skin-accent-color': customThemeColor || 'var(--skin-accent-color)', '--accent-bronze': accentColor } as React.CSSProperties;
    const headerTitle = mode === 'view'
        ?(displayAction?.name || (isPreview ?'Preview de Ação' : 'Detalhe da Ação'))
        : (editableAction.name?.trim() || (isNew ?'Nova Ação' : 'Editar Ação'));
    const headerEyebrow = mode === 'edit'
        ?(isNew ?'Criação' : 'Edição')
        : (isPreview ?'Preview' : 'Ação');
    const handleHeaderOk = () => {
        if (isPreview) {
            onClose();
            return;
        }
        if (mode === 'edit') {
            handleSave();
            return;
        }
        onClose();
    };

    const requestEditMode = () => {
        if (isInstalledCodexAction && !hasConfirmedInstalledCodexEdit) {
            setShowInstalledCodexEditConfirmation(true);
            return;
        }
        setMode('edit');
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center animate-fade-in" onClick={handleBackdropClick} style={modalStyle}>
                <GlassCard
                    variant="neutral"
                    className="w-full max-w-[20.5rem] m-3 rounded-[26px] flex flex-col max-h-[84vh] h-auto p-0 relative overflow-hidden border-white/12 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
                    style={{
                        backgroundImage: [
                            `radial-gradient(circle at 48% 0%, rgba(255,255,255,0.18), rgba(255,255,255,0.07) 16%, transparent 40%)`,
                            `radial-gradient(circle at 20% 12%, rgba(255,246,232,0.04), transparent 18%)`,
                            `radial-gradient(circle at 100% 100%, ${rgbaString(accentColor, 0.22)}, transparent 34%)`,
                            `linear-gradient(165deg, rgba(124,92,62,0.44) 0%, rgba(86,64,50,0.5) 18%, rgba(30,24,22,0.7) 42%, rgba(12,11,12,0.9) 74%, ${rgbaString(accentColor, 0.18)} 92%, rgba(6,6,8,0.99) 100%)`,
                        ].join(', '),
                    }}
                >
                    <div
                        className="modal-aura-overlay"
                        style={{ '--modal-aura-color': 'rgba(176, 113, 68, 0.16)' } as React.CSSProperties}
                    />
                    <div
                        className="modal-sheen-overlay"
                        style={{ '--modal-sheen-color': 'rgba(201, 139, 90, 0.50)' } as React.CSSProperties}
                    />

                    {/* Header Fixed */}
                    <div className="flex-none p-4 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.08))] backdrop-blur-md flex justify-between items-start z-30 relative border-b border-white/10">
                        <div className="flex items-center gap-3 pt-1">
                            {!isPreview && (
                                <button
                                    onClick={mode === 'view' ?requestEditMode : handleCancel}
                                    className={`p-2 rounded-full border transition-all ${mode === 'edit' ?'bg-red-500/18 text-red-300 border-red-500/30 hover:bg-red-500/26' : 'bg-black/16 border-white/14 text-white/65 hover:text-white hover:bg-white/12'}`}
                                >
                                    {mode === 'view' ?<EditIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 px-2 text-center">
                            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/46">{headerEyebrow}</div>
                            <h2 className="luxe-title-ornate mt-1 text-lg font-black uppercase tracking-[0.08em] text-[#fff5e8] drop-shadow-[0_1px_8px_rgba(255,240,220,0.16)]">
                                {headerTitle}
                            </h2>
                            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/58">
                                {currentArena?.name || 'Arena'}
                            </p>
                        </div>
                        <button id="onboarding-action-save-button" onClick={handleHeaderOk} className="px-4 py-2 text-sm font-bold rounded-xl luxe-skin-button shrink-0">
                            OK
                        </button>
                    </div>

                    {/* Assignment field for Office Mode */}
                    {isOfficeMode && mode === 'edit' && (
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

                    {/* Tabs Fixed */}
                    <div className="flex-none px-4 pb-4 bg-black/[0.26] backdrop-blur-md border-b border-white/[0.06] z-20 relative">
                        <div className="flex bg-black/[0.26] p-1 rounded-xl border border-white/[0.06]">
                            <button
                                onClick={() => setActiveTab('basic')}
                                className={`flex-1 py-2 text-[11px] font-semibold tracking-[0.08em] rounded-lg transition-all duration-300 ${activeTab === 'basic'
                                    ?'bg-white/[0.09] text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)] border border-white/[0.08]'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                Básico
                            </button>
                            <button
                                onClick={() => setActiveTab('advanced')}
                                className={`flex-1 py-2 text-[11px] font-semibold tracking-[0.08em] rounded-lg transition-all duration-300 ${activeTab === 'advanced'
                                    ?'bg-white/[0.09] text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)] border border-white/[0.08]'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                Avançado
                            </button>
                        </div>
                    </div>

                    {/* Content Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-gradient-to-b from-black/40 to-transparent">

                        {/* BASIC TAB */}
                        {activeTab === 'basic' && (
                            <div className="p-6 space-y-4 flex flex-col items-center animate-fade-in pb-20">
                                {mode === 'view' && displayAction ?(
                                    // VIEW MODE CONTENT
                                    <>
                                        {/* Icon - Centralized */}
                                        <div className="relative group mt-0 mb-1 flex justify-center">
                                            <div className="absolute inset-0 bg-[var(--skin-accent-color)]/20 blur-xl rounded-full group-hover:bg-[var(--skin-accent-color)]/30 transition-all duration-500" />
                                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#2a211c] to-black border border-[var(--skin-accent-color)]/30 flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-500">
                                                <EmojiGlyph symbol={displayAction.icon || '📝'} size="picker" className="scale-[1.55] text-white drop-shadow-[0_0_15px_var(--sephirot-glow-color)]" />
                                            </div>
                                        </div>

                                        {/* Desc Only (Title moved to Header) - Expandable */}
                                        <div className="space-y-2 w-full text-center mb-4 px-2">
                                            <div className="relative">
                                                <input type="checkbox" id="desc-expand" className="peer hidden" />
                                                <p className="text-[10px] text-gray-400 leading-snug font-medium max-w-[280px] mx-auto line-clamp-3 peer-checked:line-clamp-none transition-all">
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

                                        {/* Metadata Grid - Compact & Spaced */}
                                        <div className="grid grid-cols-2 gap-3 w-full">
                                            <div className="bg-white/5 rounded-lg p-3 border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center min-h-[60px]">
                                                <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider mb-1">Tipo</div>
                                                <div className="text-xs font-bold accent-text truncate text-center w-full">{displayAction.actionType}</div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center min-h-[60px]">
                                                <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider mb-1">Duração</div>
                                                <div className="text-xs font-bold text-white text-center w-full">{effectiveDuration} min</div>
                                            </div>
                                            {displayAction.actionType === 'Ação Recorrente' && (
                                                <div className="bg-white/5 rounded-lg p-3 border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center min-h-[60px]">
                                                    <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider mb-1">Repetições</div>
                                                    <div className="text-xs font-bold text-white text-center w-full">{displayAction.repetitions}x pool</div>
                                                </div>
                                            )}
                                            <div className="bg-white/5 rounded-lg p-3 border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center min-h-[60px]">
                                                <div className="text-[9px] text-gray-500 uppercase font-black tracking-wider mb-1">Dificuldade</div>
                                                <div className={`text-xs font-bold text-center w-full ${(displayAction.difficulty || 3) >= 4 ?'text-red-400' :
                                                    (displayAction.difficulty || 3) <= 2 ?'text-green-400' : 'text-[var(--skin-accent-color)]'
                                                    }`}>
                                                    {difficultyLabels[(displayAction.difficulty || 3) - 1]}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // EDIT MODE CONTENT (Form)
                                    <div className="w-full space-y-4">
                                        {/* Icon Picker */}
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => setIsIconPickerOpen(true)}
                                                className="w-24 h-24 bg-[#2a211c]/50 border border-[var(--skin-accent-color)] rounded-xl hover:bg-[#2a211c] transition-colors flex items-center justify-center relative group"
                                            >
                                                <EmojiGlyph symbol={editableAction.icon || '📝'} size="picker" className="scale-[1.65] text-white" />
                                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <EditIcon className="w-6 h-6 text-white" />
                                                </div>
                                            </button>
                                        </div>

                                        {/* Name */}
                                        <input
                                            id="onboarding-action-name-input"
                                            ref={nameInputRef}
                                            type="text"
                                            placeholder="Nome da Ação"
                                            value={editableAction.name || ''}
                                            onBlur={handleTutorialNextFormStep}
                                            onChange={e => setEditableAction(p => ({ ...p, name: e.target.value }))}
                                            className="w-full text-center bg-transparent text-xl font-bold text-white focus:outline-none border-b border-dashed border-white/20 py-2 placeholder:text-gray-600"
                                        />

                                        {/* Description */}
                                        <textarea
                                            placeholder="Descrição (opcional)"
                                            value={editableAction.description || ''}
                                            onChange={e => setEditableAction(p => ({ ...p, description: e.target.value }))}
                                            rows={3}
                                            className="w-full bg-black/20 rounded-xl px-3 py-2 text-sm text-white/90 focus:outline-none border border-white/10 focus:border-[var(--accent-bronze)]/50 placeholder:text-gray-600 resize-none"
                                        />

                                        <div className="space-y-3 pt-2">
                                            {/* Arena */}
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Arena</label>
                                                <button onClick={() => setIsArenaPickerOpen(true)} className="w-full p-3 mt-1 bg-black/20 rounded-xl flex justify-between items-center text-left hover:bg-black/30 transition-colors border border-white/5">
                                                    <span className="text-sm">{currentArena?.icon} {currentArena?.name || 'Selecionar Arena'}</span>
                                                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </div>

                                            {/* Type */}
                                            <div>
                                                <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Tipo de Ação</label>
                                                <button id="onboarding-action-type-button" onClick={() => setIsActionTypePickerOpen(true)} className="w-full p-3 mt-1 bg-black/20 rounded-xl flex justify-between items-center text-left hover:bg-black/30 transition-colors border border-white/5">
                                                    <span className="text-sm">{editableAction.actionType || 'Ação Recorrente'}</span>
                                                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </div>

                                            {/* Sliders */}
                                            {taskId ?(
                                                <StyledRangeInput
                                                    label="Duração desta Instância"
                                                    value={editableTaskDuration}
                                                    min={15} max={480} step={15} unit="min"
                                                    onChange={val => setEditableTaskDuration(val)}
                                                />
                                            ) : (
                                                <StyledRangeInput
                                                    containerId="onboarding-action-duration"
                                                    inputRef={durationInputRef}
                                                    label="Duração (Base)"
                                                    value={editableAction.duration || 60}
                                                    min={15} max={240} step={15} unit="min"
                                                    onChange={val => { setEditableAction(p => ({ ...p, duration: val })); handleTutorialNextFormStep(); }}
                                                />
                                            )}

                                            {editableAction.actionType === 'Ação Recorrente' && (
                                                <StyledRangeInput containerId="onboarding-action-repetitions" inputRef={repsInputRef} label="Repetições" value={editableAction.repetitions || 1} min={1} max={50} step={1} unit="x" onChange={val => { setEditableAction(p => ({ ...p, repetitions: val })); handleTutorialNextFormStep(); }} />
                                            )}

                                            <StyledRangeInput label="Dificuldade" value={editableAction.difficulty || 3} min={1} max={5} step={1} unit={difficultyLabels[(editableAction.difficulty || 3) - 1]} onChange={val => setEditableAction(p => ({ ...p, difficulty: val }))} />
                                        </div>

                                        {/* Scheduling */}
                                        {(editableAction.actionType === 'Ação Recorrente' || editableAction.actionType === 'Compromisso') && (
                                            <div className="p-3 bg-black/20 rounded-xl space-y-3 border border-white/5">
                                                {editableAction.actionType === 'Ação Recorrente' && (
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Dias da Semana</label>
                                                        <div className="grid grid-cols-7 gap-1 mt-1">
                                                            {week.map(day => <DayToggle key={day} day={day} selected={selectedDays.includes(day)} onClick={() => handleDayToggle(day)} />)}
                                                        </div>
                                                    </div>
                                                )}

                                                {editableAction.actionType === 'Compromisso' && (
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Data</label>
                                                        <button onClick={() => setIsDatePickerOpen(true)} className="w-full p-3 mt-1 bg-black/20 rounded-xl flex justify-between items-center text-left hover:bg-black/30 transition-colors border border-white/5">
                                                            <div className="flex items-center gap-2">
                                                                <CalendarIcon className="w-4 h-4 text-[var(--skin-accent-color)]" />
                                                                <span className="text-sm">{selectedDate ?selectedDate.toLocaleDateString('pt-BR') : 'Selecionar Data'}</span>
                                                            </div>
                                                            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Horário</label>
                                                    <button onClick={() => setIsTimePickerOpen(!isTimePickerOpen)} className="w-full p-3 mt-1 bg-black/20 rounded-xl flex justify-between items-center text-left hover:bg-black/30 transition-colors border border-white/5">
                                                        <span className="text-sm">{startTime || 'Sem Horário'}</span>
                                                        <ChevronRightIcon className={`w-4 h-4 text-gray-500 transition-transform ${isTimePickerOpen ?'rotate-90' : ''}`} />
                                                    </button>
                                                    {isTimePickerOpen && (
                                                        <div className="mt-2 h-32 relative">
                                                            <WheelPicker options={timeOptions} value={startTime || 'Sem Horário'} onSelect={handleTimeSelect} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Delete Button */}
                                        {!isNew && (
                                            <button onClick={handleDelete} className="w-full py-3 rounded-xl bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30 text-xs font-bold uppercase tracking-wider transition-all mt-4">
                                                Excluir Ação
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ADVANCED TAB */}
                        {activeTab === 'advanced' && (
                            <div className="flex flex-col h-full animate-fade-in pb-20">
                                {/* Sub-Tabs */}
                                <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 mx-4 mt-4 mb-2 shrink-0 z-20 backdrop-blur-sm sticky top-0">
                                    {(['MÍDIA', 'ANOTAÇÃO', 'CHECKLIST', 'CONTEXTO'] as const).map((tab) => {
                                        const tabKey = tab === 'MÍDIA' ?'media' : tab === 'ANOTAÇÃO' ?'note' : tab === 'CHECKLIST' ?'checklist' : 'context';
                                        const isActive = advancedSubTab === tabKey;
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setAdvancedSubTab(tabKey)}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 ${isActive
                                                    ?'bg-white/10 text-white shadow-lg border border-white/5'
                                                    : 'text-gray-600 hover:text-gray-400'
                                                    }`}
                                            >
                                                {tab}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-0">
                                    {advancedSubTab === 'media' && (
                                        <div className="h-full flex flex-col p-4">
                                            {(displayAction?.assets?.find(a => a.type === 'image' || a.type === 'video') || (mode === 'edit' && (newAssetUrl || mediaSlot.imageUrl))) ?(
                                                <div className="w-full aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/10 relative group mb-4">
                                                    <img
                                                        src={mode === 'edit' && (newAssetUrl || mediaSlot.imageUrl) ?(newAssetUrl || mediaSlot.imageUrl) : displayAction?.assets?.find(a => a.type === 'image' || a.type === 'video')?.url}
                                                        className="w-full h-full object-cover"
                                                        alt="Mídia"
                                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                                    />
                                                    {mode === 'edit' && (
                                                        <button
                                                            onClick={() => { setNewAssetUrl(''); setMediaSlot({ imageUrl: '', caption: '' }); setEditableAction(p => ({ ...p, assets: [] })); }}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full text-white hover:bg-red-500 transition-colors"
                                                        >
                                                            <XIcon className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-video bg-white/5 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 mb-4">
                                                    <span className="text-4xl opacity-20">📋</span>
                                                    <span className="text-xs text-gray-500 font-medium">Sem mídia vinculada</span>
                                                </div>
                                            )}

                                            {mode === 'edit' && (
                                                <div className="space-y-4">
                                                    <div className="text-xs font-bold text-gray-400 uppercase">Upload de Foto (Anexo)</div>
                                                    <ImageUploadSlot
                                                        value={mediaSlot}
                                                        onChange={(value) => {
                                                            setMediaSlot(value);
                                                            if (value.imageUrl) {
                                                                const title = value.caption?.trim() || 'Mídia Principal';
                                                                setNewAssetUrl(value.imageUrl);
                                                                setEditableAction(prev => ({ ...prev, assets: [{ type: 'image', url: value.imageUrl, title }] }));
                                                            } else {
                                                                setNewAssetUrl('');
                                                                setEditableAction(prev => ({ ...prev, assets: [] }));
                                                            }
                                                        }}
                                                    />
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase">URL da Imagem/Vídeo</label>
                                                        <input
                                                            type="text"
                                                            value={newAssetUrl || displayAction?.assets?.find(a => a.type === 'image' || a.type === 'video')?.url || ''}
                                                            onChange={(e) => {
                                                                const url = e.target.value;
                                                                setNewAssetUrl(url);
                                                                if (url) {
                                                                    setMediaSlot(prev => ({ ...prev, imageUrl: url }));
                                                                    const title = mediaSlot.caption?.trim() || 'Mídia Principal';
                                                                    setEditableAction(prev => ({ ...prev, assets: [{ type: 'image', url, title }] }));
                                                                } else {
                                                                    setEditableAction(prev => ({ ...prev, assets: [] }));
                                                                }
                                                            }}
                                                            placeholder="https://..."
                                                            className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-[var(--skin-accent-color)] text-gray-300 placeholder:text-gray-600"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {advancedSubTab === 'note' && (
                                        <div className="p-4 h-full flex flex-col">
                                            {mode === 'edit' ?(
                                                <textarea
                                                    value={editableAction.briefing || ''}
                                                    onChange={e => setEditableAction(prev => ({ ...prev, briefing: e.target.value }))}
                                                    className="w-full flex-1 p-4 bg-black/30 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[var(--skin-accent-color)] text-gray-200 resize-none min-h-[300px]"
                                                    placeholder="Digite suas anotações aqui..."
                                                />
                                            ) : (
                                                <div className="bg-[#1a1512] rounded-xl p-6 border border-white/5 shadow-inner min-h-[300px]">
                                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                                                        {displayAction?.briefing || "Nenhuma anotação disponível."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {advancedSubTab === 'checklist' && (
                                        <div className="p-4 space-y-3">
                                            <div className="text-xs font-bold text-gray-400 uppercase">Preparar Ações</div>
                                            {/* Checklist Items */}
                                            {(displayAction?.preFlight || []).length > 0 ?(
                                                displayAction?.preFlight?.map((item, i) => (
                                                    <div key={i} className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                                                        <div className="mt-1 w-2 h-2 rounded-full bg-[var(--skin-accent-color)]/50 group-hover:bg-[var(--skin-accent-color)] group-hover:shadow-[0_0_8px_var(--sephirot-glow-color)] transition-all" />
                                                        <span className="text-sm text-gray-300 font-medium leading-snug flex-1">{item}</span>
                                                        {mode === 'edit' && (
                                                            <button
                                                                onClick={() => setEditableAction(prev => ({ ...prev, preFlight: prev.preFlight?.filter((_, idx) => idx !== i) }))}
                                                                className="text-gray-500 hover:text-red-400 opacity-50 hover:opacity-100 transition-opacity"
                                                            >
                                                                <XIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 opacity-30 space-y-2 border border-dashed border-white/5 rounded-xl">
                                                    <span className="text-4xl">?</span>
                                                    <span className="text-[10px] uppercase font-black tracking-widest">Lista Vazia</span>
                                                </div>
                                            )}

                                            {/* Add Item Input (Edit Mode) */}
                                            {mode === 'edit' && (
                                                <div className="flex gap-2 mt-4">
                                                    <input
                                                        type="text"
                                                        value={newChecklistItem}
                                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && newChecklistItem.trim()) {
                                                                setEditableAction(prev => ({ ...prev, preFlight: [...(prev.preFlight || []), newChecklistItem.trim()] }));
                                                                setNewChecklistItem('');
                                                            }
                                                        }}
                                                        placeholder="Adicionar item..."
                                                        className="flex-1 p-3 bg-black/30 border border-white/10 rounded-xl text-xs focus:outline-none focus:border-[var(--skin-accent-color)]"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            if (newChecklistItem.trim()) {
                                                                setEditableAction(prev => ({ ...prev, preFlight: [...(prev.preFlight || []), newChecklistItem.trim()] }));
                                                                setNewChecklistItem('');
                                                            }
                                                        }}
                                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {advancedSubTab === 'context' && (
                                        <div className="p-4 space-y-6">
                                            {/* Energy Level */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Nível de Energia</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['low', 'medium', 'high'] as const).map(level => {
                                                        const isSelected = displayAction?.context?.energyLevel === level;
                                                        const isEditable = mode === 'edit';
                                                        return (
                                                            <button
                                                                key={level}
                                                                disabled={!isEditable}
                                                                onClick={() => isEditable && setEditableAction(prev => ({ ...prev, context: { ...prev.context, energyLevel: level } }))}
                                                                className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${isSelected
                                                                    ?'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] border-[var(--skin-accent-color)]/50 shadow-[0_0_15px_var(--sephirot-glow-color)]'
                                                                    : 'bg-black/20 text-gray-600 border-white/5 ' + (isEditable ?'hover:bg-white/5 hover:text-gray-400' : 'opacity-50')
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
                                                        const isEditable = mode === 'edit';
                                                        return (
                                                            <button
                                                                key={time}
                                                                disabled={!isEditable}
                                                                onClick={() => isEditable && setEditableAction(prev => ({ ...prev, context: { ...prev.context, timeOfDay: time } }))}
                                                                className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${isSelected
                                                                    ?'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] border-[var(--skin-accent-color)]/50 shadow-[0_0_15px_var(--sephirot-glow-color)]'
                                                                    : 'bg-black/20 text-gray-600 border-white/5 ' + (isEditable ?'hover:bg-white/5 hover:text-gray-400' : 'opacity-50')
                                                                    }`}
                                                            >
                                                                {time === 'morning' ?'Manhã' : time === 'afternoon' ?'Tarde' : time === 'evening' ?'Noite' : 'Madrugada'}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* 3. FOOTER (Fixed) */}
                    {mode !== 'edit' && (
                    <div className="flex-none p-4 bg-[#120f0d]/88 backdrop-blur-xl border-t border-white/8 space-y-3 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.35)]">
                        <div className="flex gap-2">
                            {isPreview ?(
                                <button
                                    ref={saveButtonRef}
                                    onClick={onClose}
                                    className="flex-1 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-[0.14em] shadow-[0_0_18px_var(--sephirot-glow-color)] hover:shadow-[0_0_24px_var(--sephirot-glow-color)] transition-all transform active:scale-[0.98] border border-[color:rgba(255,215,0,0.16)] group relative overflow-hidden luxe-skin-button"
                                >
                                    <span className="relative z-10 group-hover:text-black transition-colors">Fechar</span>
                                    <div className="absolute inset-0 transition-colors bg-[var(--skin-accent-color)]/0 group-hover:bg-[var(--skin-accent-color)]/10" />
                                </button>
                            ) : canStartNow ?(
                                <button
                                    ref={saveButtonRef}
                                    onMouseDown={handleStartMission}
                                    onMouseUp={clearStartNowHold}
                                    onMouseLeave={clearStartNowHold}
                                    onTouchStart={handleStartMission}
                                    onTouchEnd={clearStartNowHold}
                                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white transition-all hover:border-[var(--skin-accent-color)]/35 hover:bg-white/[0.06] active:scale-[0.99] relative overflow-hidden"
                                    style={{ touchAction: 'none' }}
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/5">
                                        <div
                                            className="h-full bg-[var(--skin-accent-color)] transition-all duration-75"
                                            style={{ width: `${startNowHoldProgress}%` }}
                                        />
                                    </div>
                                    <div className="relative z-10 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/10 shrink-0">
                                                <div className="inline-flex items-center gap-0.5 text-[var(--skin-accent-color)]">
                                                    <ClockIcon className="w-3.5 h-3.5" />
                                                    <PlayIcon className="w-3 h-3" />
                                                </div>
                                            </div>
                                            <div className="min-w-0 text-left">
                                                <div className="text-xs font-semibold leading-none">Começar agora</div>
                                                <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-gray-500 font-black">
                                                    {startNowTriggered ?'Abrindo descanso' : 'Segure 1s'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ) : mode === 'view' ?(
                                <button
                                    ref={saveButtonRef}
                                    onClick={onClose}
                                    className="flex-1 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-[0.14em] shadow-[0_0_18px_var(--sephirot-glow-color)] hover:shadow-[0_0_24px_var(--sephirot-glow-color)] transition-all transform active:scale-[0.98] border border-[color:rgba(255,215,0,0.16)] group relative overflow-hidden luxe-skin-button"
                                >
                                    <span className="relative z-10 group-hover:text-black transition-colors">Fechar</span>
                                    <div className="absolute inset-0 transition-colors bg-[var(--skin-accent-color)]/0 group-hover:bg-[var(--skin-accent-color)]/10" />
                                </button>
                            ) : (
                                <button
                                    ref={saveButtonRef}
                                    onClick={handleSave}
                                    className="flex-1 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-[0.14em] shadow-[0_0_18px_var(--sephirot-glow-color)] hover:shadow-[0_0_24px_var(--sephirot-glow-color)] transition-all transform active:scale-[0.98] border border-[color:rgba(255,215,0,0.16)] group relative overflow-hidden luxe-skin-button"
                                >
                                    <span className="relative z-10">Salvar alterações</span>
                                </button>
                            )}
                        </div>
                    </div>
                    )}

                </GlassCard>
            </div>

            {/* Pickers */}
            {isIconPickerOpen && <IconPickerModal onSelect={handleIconSelect} onClose={() => setIsIconPickerOpen(false)} />}
            {isActionTypePickerOpen && (
                <SelectionModal<ActionType>
                    title="Tipo de Ação"
                    options={actionTypeOptions}
                    currentValue={editableAction.actionType || 'Ação Recorrente'}
                    onSelect={handleActionTypeChange}
                    onClose={() => setIsActionTypePickerOpen(false)}
                />
            )}
            {isArenaPickerOpen && (
                <ArenaSelectionModal
                    arenas={arenas}
                    selectedArenaId={editableAction.arenaId || ''}
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
            {showInstalledCodexEditConfirmation && (
                <ConfirmationModal
                    title="Editar acao instalada"
                    message="Esse Codex instalado continua intacto. Voce quer mesmo editar esta acao na sua execucao?"
                    onConfirm={() => {
                        setHasConfirmedInstalledCodexEdit(true);
                        setShowInstalledCodexEditConfirmation(false);
                        setMode('edit');
                    }}
                    onCancel={() => setShowInstalledCodexEditConfirmation(false)}
                />
            )}
            {isConfirmDeleteOpen && (
                <ConfirmationModal
                    title="Confirmar exclusao"
                    message={`Tem certeza que deseja excluir a acao "${action?.name}"?`}
                    onConfirm={confirmDelete}
                    onCancel={() => setConfirmDeleteOpen(false)}
                />
            )}
        </Portal>
    );
};












