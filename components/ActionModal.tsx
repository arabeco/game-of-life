import React, { useState, useEffect, useRef } from 'react';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { Action, DayOfWeek, ActionType } from '../types';
import { GlassCard } from './GlassCard';
import { ChevronRightIcon, EditIcon, XIcon, CalendarIcon, Trash2Icon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
import { WheelPicker } from './inputs/WheelPicker';
import { ImageUploadSlot } from './inputs/ImageUploadSlot';
import { SelectionModal } from './SelectionModal';
import { ConfirmationModal } from './ConfirmationModal';
import { ArenaSelectionModal } from './ArenaSelectionModal';
import { DatePickerModal } from './DatePickerModal';

import { Portal } from './Portal';

interface ActionModalProps {
    arenaId: string;
    action: Action | null;
    taskId?: string; // NEW: support for specific task override
    initialMode: 'view' | 'edit';
    onClose: () => void;
    isPreview?: boolean;
    customThemeColor?: string;
}

const StyledRangeInput: React.FC<{ label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (val: number) => void, inputRef?: React.Ref<HTMLDivElement> }> =
    ({ label, value, min, max, step, unit, onChange, inputRef }) => (
        <div ref={inputRef} className="p-2 bg-black/20 rounded-xl space-y-1">
            <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-400 uppercase">{label}</label>
                <span className="text-sm font-bold">{value} {unit}</span>
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
    <button type="button" onClick={onClick} className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${selected ? 'bg-[var(--skin-accent-color)] text-white' : 'bg-black/20 hover:bg-black/40'}`}>
        {day.slice(0, 3)}
    </button>
);

export const ActionModal: React.FC<ActionModalProps> = ({ arenaId, action, taskId, initialMode, onClose, isPreview, customThemeColor }) => {
    const { addAction, updateAction, deleteAction, getArenas, scheduleMultipleTasks, scheduleTask, tasks, updateTask, clan, enrichedClanMembers } = useGame();

    const isNew = !action;

    const [mode, setMode] = useState(isNew && !isPreview ? 'edit' : initialMode);
    const [editableAction, setEditableAction] = useState<Partial<Action>>(
        action || { arenaId: arenaId, name: '', description: '', icon: '🏆', duration: 60, repetitions: 1, actionType: 'Ação Recorrente', difficulty: 3 }
    );

    // NEW: Task duration override state
    const currentTask = tasks.find(t => t.id === taskId);
    const [editableTaskDuration, setEditableTaskDuration] = useState<number>(currentTask?.duration || action?.duration || 60);

    // New View Mode State
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
    const [advancedSubTab, setAdvancedSubTab] = useState<'media' | 'note' | 'checklist' | 'context'>('media');

    const nameInputRef = useRef<HTMLInputElement>(null);
    const durationInputRef = useRef<HTMLDivElement>(null);
    const repsInputRef = useRef<HTMLDivElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);

    // State for checklist inputs in edit mode
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [newAssetUrl, setNewAssetUrl] = useState('');
    const [mediaSlot, setMediaSlot] = useState({ imageUrl: '', caption: '' });

    const handleTutorialNextFormStep = () => {
        // No-op
    }


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

    const arenas = getArenas();
    const currentArena = arenas.find(a => a.id === editableAction.arenaId);

    // Office Mode specific
    const isOfficeMode = clan?.clanType === 'Office';
    const enrichedMembers = enrichedClanMembers;

    const handleSave = () => {
        if (!editableAction.name?.trim()) return;

        let scheduledStartTime: number | undefined;
        if (startTime && startTime !== 'Sem Horário') {
            const [h, m] = startTime.split(':').map(Number);
            scheduledStartTime = h * 60 + m;
        }

        const nextRepetitions = editableAction.actionType === 'Ação Recorrente'
            ? Math.min(50, Math.max(1, Math.floor(editableAction.repetitions || 1)))
            : 1;

        // SAFEGUARD: Ensure duration is within bounds (5-240) and defaults to 60 if invalid
        const rawDuration = editableAction.duration;
        const validDuration = (rawDuration && rawDuration >= 5 && rawDuration <= 480) ? rawDuration : 60;

        const actionData: Omit<Action, 'id'> = {
            arenaId: editableAction.arenaId || '', // Será tratado no context
            name: editableAction.name,
            description: editableAction.description?.trim() || undefined,
            icon: editableAction.icon || '🏆',
            duration: validDuration,
            repetitions: nextRepetitions,
            actionType: editableAction.actionType || 'Ação Recorrente',
            difficulty: editableAction.difficulty || 3,
            scheduledDays: editableAction.actionType === 'Ação Recorrente' ? selectedDays : undefined,
            scheduledStartTime,
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
            if (taskId) {
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
            } else if (isNew) {
                // Let the context generate the ID to ensure consistency
                const newAction = await addAction(actionData);
                await scheduleTasks(newAction.id);
            } else if (action) {
                updateAction(action.id, actionData);
                await scheduleTasks(action.id);
            }
            onClose();
        };

        executeSave().catch(err => console.error("Error saving action:", err));
    };

    const handleStartMission = () => {
        if (!action) return;
        const today = getLocalDateString();
        // Schedule for "now" (0 minutes from start of day usually implies no specific time or "today")
        scheduleTask(action.id, today, 0);
        onClose();
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
    const handleDayToggle = (day: DayOfWeek) => setSelectedDays(p => p.includes(day) ? p.filter(d => d !== day) : [...p, day]);
    const handleActionTypeChange = (type: ActionType) => { setEditableAction(p => ({ ...p, actionType: type, repetitions: type === 'Ação Recorrente' ? (p.repetitions || 1) : 1 })); setIsActionTypePickerOpen(false); }
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
        const baseAction = nextAction || { arenaId: arenaId, name: '', description: '', icon: '🏆', duration: 60, repetitions: 1, actionType: 'Ação Recorrente', difficulty: 3 };
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
        setMode(isNew ? 'edit' : initialMode);
        resetFromAction(action);
    }, [action?.id, arenaId, initialMode]);

    const displayAction = mode === 'view' ? action : editableAction;

    // Merge task duration if editing a specific task
    const effectiveDuration = taskId && currentTask ? currentTask.duration : (displayAction?.duration || 60);

    const difficultyLabels = ['MUITO FÁCIL', 'FÁCIL', 'NORMAL', 'DIFÍCIL', 'EXTREMO'];
    const week: DayOfWeek[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
    const timeOptions = ['Sem Horário', ...Array.from({ length: 24 * 4 }, (_, i) => { const h = Math.floor(i / 4); const m = (i % 4) * 15; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; })];
    const actionTypeOptions: ActionType[] = ['Ação Recorrente', 'Compromisso', 'Marco'];

    if (!displayAction && mode === 'view') return null;

    const modalStyle = customThemeColor ? { '--skin-accent-color': customThemeColor, '--accent-bronze': customThemeColor } as React.CSSProperties : undefined;

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in" onClick={handleBackdropClick} style={modalStyle}>
                <GlassCard variant="bronze" className="w-full max-w-sm m-4 rounded-2xl flex flex-col max-h-[85vh] h-auto p-0 relative overflow-hidden border-[var(--skin-accent-color)]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)]">

                    {/* Header Fixed */}
                    <div className="flex-none p-4 bg-black/40 backdrop-blur-md flex justify-between items-center z-30 relative">
                        <div className="flex items-center gap-3">
                            {!isPreview && (
                                <button
                                    onClick={mode === 'view' ? () => setMode('edit') : handleCancel}
                                    className={`p-2 rounded-lg transition-all ${mode === 'edit' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'hover:bg-white/5 text-[var(--skin-accent-color)]/50 hover:text-[var(--skin-accent-color)]'}`}
                                >
                                    {mode === 'view' ? <EditIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
                                </button>
                            )}
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--skin-accent-color)]/80 truncate max-w-[200px]">
                                {mode === 'edit' ? (isNew ? 'Nova Quest' : 'Editando') : (displayAction?.name || (isPreview ? 'Preview • Codex' : 'Quests • Clã'))}
                            </span>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-all group">
                            <XIcon className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                        </button>
                    </div>

                    {/* Assignment field for Office Mode */}
                    {isOfficeMode && mode === 'edit' && (
                        <div className="px-4 py-2 bg-black/20 border-b border-white/5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Quem vai fazer? (Atribuição)</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                <button
                                    onClick={() => setEditableAction(prev => ({ ...prev, originCodexId: undefined }))}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${!editableAction.originCodexId?.startsWith('assign:') ? 'bg-[var(--skin-accent-color)] text-black border-[var(--skin-accent-color)]' : 'bg-black/20 text-gray-400 border-white/5'}`}
                                >
                                    MESA (QUALQUER UM)
                                </button>
                                {enrichedMembers.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => setEditableAction(prev => ({ ...prev, originCodexId: `assign:${member.id}` }))}
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${editableAction.originCodexId === `assign:${member.id}` ? 'bg-blue-500 text-white border-blue-500' : 'bg-black/20 text-gray-400 border-white/5'}`}
                                    >
                                        {member.nickname.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tabs Fixed */}
                    <div className="flex-none px-4 pb-4 bg-black/40 backdrop-blur-md border-b border-white/10 z-20 relative">
                        <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5">
                            <button
                                onClick={() => setActiveTab('basic')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${activeTab === 'basic'
                                    ? 'bg-white/10 text-white shadow-lg border border-white/5'
                                    : 'text-gray-600 hover:text-gray-400'
                                    }`}
                            >
                                [ Básico ]
                            </button>
                            <button
                                onClick={() => setActiveTab('advanced')}
                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg transition-all duration-300 ${activeTab === 'advanced'
                                    ? 'bg-white/10 text-white shadow-lg border border-white/5'
                                    : 'text-gray-600 hover:text-gray-400'
                                    }`}
                            >
                                [ Avançado ]
                            </button>
                        </div>
                    </div>

                    {/* Content Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-gradient-to-b from-black/40 to-transparent">

                        {/* BASIC TAB */}
                        {activeTab === 'basic' && (
                            <div className="p-6 space-y-4 flex flex-col items-center animate-fade-in pb-20">
                                {mode === 'view' && displayAction ? (
                                    // VIEW MODE CONTENT
                                    <>
                                        {/* Icon - Centralized */}
                                        <div className="relative group mt-0 mb-1 flex justify-center">
                                            <div className="absolute inset-0 bg-[var(--skin-accent-color)]/20 blur-xl rounded-full group-hover:bg-[var(--skin-accent-color)]/30 transition-all duration-500" />
                                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#2a211c] to-black border border-[var(--skin-accent-color)]/30 flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-all duration-500">
                                                <span className="text-4xl drop-shadow-[0_0_15px_var(--sephirot-glow-color)]">{displayAction.icon}</span>
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
                                                <div className={`text-xs font-bold text-center w-full ${(displayAction.difficulty || 3) >= 4 ? 'text-red-400' :
                                                    (displayAction.difficulty || 3) <= 2 ? 'text-green-400' : 'text-[var(--skin-accent-color)]'
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
                                                <span className="text-5xl">{editableAction.icon}</span>
                                                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <EditIcon className="w-6 h-6 text-white" />
                                                </div>
                                            </button>
                                        </div>

                                        {/* Name */}
                                        <input
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

                                        {/* Pickers */}
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
                                                <button onClick={() => setIsActionTypePickerOpen(true)} className="w-full p-3 mt-1 bg-black/20 rounded-xl flex justify-between items-center text-left hover:bg-black/30 transition-colors border border-white/5">
                                                    <span className="text-sm">{editableAction.actionType || 'Ação Recorrente'}</span>
                                                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </div>

                                            {/* Sliders */}
                                            {taskId ? (
                                                <StyledRangeInput
                                                    label="Duração desta Instância"
                                                    value={editableTaskDuration}
                                                    min={15} max={480} step={15} unit="min"
                                                    onChange={val => setEditableTaskDuration(val)}
                                                />
                                            ) : (
                                                <StyledRangeInput
                                                    inputRef={durationInputRef}
                                                    label="Duração (Base)"
                                                    value={editableAction.duration || 60}
                                                    min={15} max={240} step={15} unit="min"
                                                    onChange={val => { setEditableAction(p => ({ ...p, duration: val })); handleTutorialNextFormStep(); }}
                                                />
                                            )}

                                            {editableAction.actionType === 'Ação Recorrente' && (
                                                <StyledRangeInput inputRef={repsInputRef} label="Repetições" value={editableAction.repetitions || 1} min={1} max={50} step={1} unit="x" onChange={val => { setEditableAction(p => ({ ...p, repetitions: val })); handleTutorialNextFormStep(); }} />
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
                                                                <span className="text-sm">{selectedDate ? selectedDate.toLocaleDateString('pt-BR') : 'Selecionar Data'}</span>
                                                            </div>
                                                            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                                                        </button>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Horário</label>
                                                    <button onClick={() => setIsTimePickerOpen(!isTimePickerOpen)} className="w-full p-3 mt-1 bg-black/20 rounded-xl flex justify-between items-center text-left hover:bg-black/30 transition-colors border border-white/5">
                                                        <span className="text-sm">{startTime || 'Sem Horário'}</span>
                                                        <ChevronRightIcon className={`w-4 h-4 text-gray-500 transition-transform ${isTimePickerOpen ? 'rotate-90' : ''}`} />
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
                                        const tabKey = tab === 'MÍDIA' ? 'media' : tab === 'ANOTAÇÃO' ? 'note' : tab === 'CHECKLIST' ? 'checklist' : 'context';
                                        const isActive = advancedSubTab === tabKey;
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => setAdvancedSubTab(tabKey)}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 ${isActive
                                                    ? 'bg-white/10 text-white shadow-lg border border-white/5'
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
                                            {(displayAction?.assets?.find(a => a.type === 'image' || a.type === 'video') || (mode === 'edit' && (newAssetUrl || mediaSlot.imageUrl))) ? (
                                                <div className="w-full aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/10 relative group mb-4">
                                                    <img
                                                        src={mode === 'edit' && (newAssetUrl || mediaSlot.imageUrl) ? (newAssetUrl || mediaSlot.imageUrl) : displayAction?.assets?.find(a => a.type === 'image' || a.type === 'video')?.url}
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
                                                    <span className="text-4xl opacity-20">📷</span>
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
                                            {mode === 'edit' ? (
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
                                            {(displayAction?.preFlight || []).length > 0 ? (
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
                                                    <span className="text-4xl">📝</span>
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
                                                                    ? 'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] border-[var(--skin-accent-color)]/50 shadow-[0_0_15px_var(--sephirot-glow-color)]'
                                                                    : 'bg-black/20 text-gray-600 border-white/5 ' + (isEditable ? 'hover:bg-white/5 hover:text-gray-400' : 'opacity-50')
                                                                    }`}
                                                            >
                                                                {level === 'low' ? 'Baixo' : level === 'medium' ? 'Médio' : 'Alto'}
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
                                                                    ? 'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)] border-[var(--skin-accent-color)]/50 shadow-[0_0_15px_var(--sephirot-glow-color)]'
                                                                    : 'bg-black/20 text-gray-600 border-white/5 ' + (isEditable ? 'hover:bg-white/5 hover:text-gray-400' : 'opacity-50')
                                                                    }`}
                                                            >
                                                                {time === 'morning' ? 'Manhã' : time === 'afternoon' ? 'Tarde' : time === 'evening' ? 'Noite' : 'Madrugada'}
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
                    <div className="flex-none p-4 bg-[#120f0d]/90 backdrop-blur-xl border-t border-white/10 space-y-3 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        {/* Main Button */}
                        <div className="flex gap-2">
                            {mode === 'edit' && !isNew && (
                                <button
                                    onClick={() => setConfirmDeleteOpen(true)}
                                    className="p-3.5 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-all"
                                >
                                    <Trash2Icon className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                ref={saveButtonRef}
                                onClick={isPreview ? onClose : (mode === 'view' ? handleStartMission : handleSave)}
                                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_var(--sephirot-glow-color)] hover:shadow-[0_0_30px_var(--sephirot-glow-color)] transition-all transform active:scale-[0.98] border border-[var(--skin-accent-color)]/20 group relative overflow-hidden ${mode === 'view' ? 'luxe-skin-button' : 'bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30'}`}
                            >
                                <span className="relative z-10 group-hover:text-black transition-colors">
                                    {isPreview ? '[ FECHAR ]' : (mode === 'view' ? '[ INICIAR MISSÃO ]' : '[ SALVAR ALTERAÇÕES ]')}
                                </span>
                                <div className={`absolute inset-0 transition-colors ${mode === 'view' ? 'bg-[var(--skin-accent-color)]/0 group-hover:bg-[var(--skin-accent-color)]/10' : ''}`} />
                            </button>
                        </div>
                    </div>

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
            {isConfirmDeleteOpen && (<ConfirmationModal title="Confirmar Exclusão" message={`Tem certeza que deseja excluir a ação "${action?.name}"?`} onConfirm={confirmDelete} onCancel={() => setConfirmDeleteOpen(false)} />)}
        </Portal>
    );
};
