import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { Action, DayOfWeek, ActionType } from '../types';
import { GlassCard } from './GlassCard';
import { ChevronRightIcon, EditIcon, XIcon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
import { WheelPicker } from './inputs/WheelPicker';
import { SelectionModal } from './SelectionModal';
import { ConfirmationModal } from './ConfirmationModal';
import { ArenaSelectionModal } from './ArenaSelectionModal';
import { useTutorial } from '../contexts/TutorialContext';

interface ActionModalProps {
    arenaId: string;
    action: Action | null;
    initialMode: 'view' | 'edit';
    onClose: () => void;
}

const StyledRangeInput: React.FC<{label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (val: number) => void, inputRef?: React.Ref<HTMLDivElement>}> = 
({label, value, min, max, step, unit, onChange, inputRef}) => (
    <div ref={inputRef} className="p-3 bg-black/20 rounded-xl space-y-2">
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
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-[var(--bronze)]"
        />
    </div>
);

const DayToggle: React.FC<{ day: DayOfWeek, selected: boolean, onClick: () => void}> = ({ day, selected, onClick}) => (
    <button type="button" onClick={onClick} className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${selected ? 'bg-[var(--bronze)] text-white' : 'bg-black/20 hover:bg-black/40'}`}>
        {day.slice(0,3)}
    </button>
);

export const ActionModal: React.FC<ActionModalProps> = ({ arenaId, action, initialMode, onClose }) => {
    const { addAction, updateAction, deleteAction, getArenas, scheduleMultipleTasks } = useGame();
    const { isTutorialActive, currentStep, nextStep, setSpotlight } = useTutorial();
    
    const isNew = !action;
    
    const [mode, setMode] = useState(isNew ? 'edit' : initialMode);
    const [editableAction, setEditableAction] = useState<Partial<Action>>(
        action || { arenaId: arenaId, name: '', icon: '🏆', duration: 60, repetitions: 1, actionType: 'Ação Recorrente', difficulty: 3 }
    );
    // Tutorial state
    const [formStep, setFormStep] = useState(0);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const durationInputRef = useRef<HTMLDivElement>(null);
    const repsInputRef = useRef<HTMLDivElement>(null);
    const saveButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isTutorialActive && currentStep === 5) {
            const handleFormStep = (step: number) => {
                switch (step) {
                    case 0: // Title
                        if (nameInputRef.current) {
                            setSpotlight(nameInputRef.current.getBoundingClientRect(), { title: "Nome da Ação", text: "Dê um nome claro e objetivo para sua ação." });
                        }
                        break;
                    case 1: // Duration
                        if (durationInputRef.current) {
                             setSpotlight(durationInputRef.current.getBoundingClientRect(), { title: "Duração", text: "Estime quanto tempo esta ação levará." });
                        }
                        break;
                    case 2: // Repetitions
                         if (repsInputRef.current) {
                             setSpotlight(repsInputRef.current.getBoundingClientRect(), { title: "Repetições", text: "Quantas vezes você pretende fazer isso? Cada repetição pode ser agendada no Planner." });
                         }
                        break;
                    case 3: // Save
                        if (saveButtonRef.current) {
                             setSpotlight(saveButtonRef.current.getBoundingClientRect(), { title: "Salvar", text: "Ótimo! Agora salve para criar a ação." });
                        }
                        break;
                    default:
                        setSpotlight(null, null);
                }
            };
            handleFormStep(formStep);
        }
    }, [isTutorialActive, currentStep, formStep, setSpotlight]);

    const handleTutorialNextFormStep = () => {
        if (isTutorialActive && currentStep === 5) {
            setFormStep(prev => prev + 1);
        }
    }


    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
    const [isActionTypePickerOpen, setIsActionTypePickerOpen] = useState(false);
    const [isArenaPickerOpen, setIsArenaPickerOpen] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
    const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
    const [startTime, setStartTime] = useState<string | null>(null);
    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const arenas = getArenas();
    const currentArena = arenas.find(a => a.id === editableAction.arenaId);
    
    const handleSave = () => {
        if (!editableAction.name?.trim()) return;
        
        const actionData: Omit<Action, 'id'> = {
            arenaId: editableAction.arenaId || '', // Será tratado no context
            name: editableAction.name,
            icon: editableAction.icon || '🏆',
            duration: editableAction.duration || 60,
            repetitions: editableAction.actionType === 'Ação Recorrente' ? (editableAction.repetitions || 1) : 1,
            actionType: editableAction.actionType || 'Ação Recorrente',
            difficulty: editableAction.difficulty || 3
        };
        
        const scheduleTasks = (actionIdToSchedule: string) => {
            if (selectedDays.length > 0 && startTime !== null && actionData.actionType === 'Ação Recorrente') {
                const [hour, minute] = startTime.split(':').map(Number);
                const startTimeInMinutes = hour * 60 + minute;
                scheduleMultipleTasks(actionIdToSchedule, selectedDays, startTimeInMinutes);
            }
        }

        if (isNew) {
            const newActionId = `action_${Date.now()}`;
            const newActionWithId = { ...actionData, id: newActionId } as Action;
            addAction(newActionWithId);
            scheduleTasks(newActionId);
        } else if (action) {
            updateAction(action.id, actionData);
            scheduleTasks(action.id);
        }

        if (isTutorialActive && currentStep === 5) {
            nextStep();
        }
        onClose();
    };
    
    const handleDelete = () => { if (action) setConfirmDeleteOpen(true); };
    const confirmDelete = () => { if(action) { deleteAction(action.id); onClose(); } }

    const handleCancel = () => {
        if (isNew) onClose();
        else { setEditableAction(action || {}); setMode('view'); setSelectedDays([]); setStartTime(null); setIsTimePickerOpen(false); }
    };

    const handleIconSelect = (icon: string) => { setEditableAction(p => ({ ...p, icon })); setIsIconPickerOpen(false); };
    const handleDayToggle = (day: DayOfWeek) => setSelectedDays(p => p.includes(day) ? p.filter(d => d !== day) : [...p, day]);
    const handleActionTypeChange = (type: ActionType) => { setEditableAction(p => ({...p, actionType: type, repetitions: type === 'Ação Recorrente' ? (p.repetitions || 1) : 1 })); setIsActionTypePickerOpen(false); }
    const handleArenaSelect = (id: string) => { setEditableAction(p => ({ ...p, arenaId: id })); setIsArenaPickerOpen(false); };
    const handleTimeSelect = (time: string) => { setStartTime(time); setIsTimePickerOpen(false); };
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };

    const displayAction = mode === 'view' ? action : editableAction;
    const difficultyLabels = ['MUITO FÁCIL', 'FÁCIL', 'NORMAL', 'DIFÍCIL', 'EXTREMO'];
    const week: DayOfWeek[] = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
    const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => { const h = Math.floor(i / 4); const m = (i % 4) * 15; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; });
    const actionTypeOptions: ActionType[] = ['Ação Recorrente', 'Compromisso', 'Marco'];

    return (
        <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center animate-fade-in" onClick={handleBackdropClick}>
                <GlassCard variant="bronze" className="w-full max-w-sm m-4 rounded-3xl flex flex-col max-h-[90vh] p-0">
                    <div className="dossier-bg overflow-y-auto p-3 space-y-3 rounded-3xl">
                        <div className="flex justify-between items-center">
                            <button onClick={mode === 'view' ? () => setMode('edit') : handleCancel} className={`p-2 rounded-full transition-colors border ${mode === 'edit' ? 'border-red-500/50 bg-red-500/20' : 'border-white/20'}`}>
                                {mode === 'view' ? <EditIcon className="w-5 h-5 text-gray-300" /> : <XIcon className="w-5 h-5 text-red-300" />}
                            </button>
                            <p className="text-xs font-bold text-gray-400 uppercase">{currentArena?.name || 'Nova Ação'}</p>
                            <button ref={saveButtonRef} onClick={mode === 'view' ? onClose : handleSave} className="px-5 py-2 text-sm font-bold rounded-xl luxe-gold-button">
                                {mode === 'view' ? 'OK' : 'SALVAR'}
                            </button>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                             <button onClick={() => mode === 'edit' && setIsIconPickerOpen(true)} disabled={mode !== 'edit'} className="w-24 h-24 bg-[#2a211c]/50 border border-[var(--accent-bronze)] rounded-xl hover:bg-[#2a211c] transition-colors flex items-center justify-center">
                                <span className="text-5xl">{displayAction?.icon}</span>
                            </button>
                            {mode === 'edit' ? (
                                <input ref={nameInputRef} type="text" placeholder="Nome da Ação" value={editableAction.name || ''} onBlur={handleTutorialNextFormStep} onChange={e => setEditableAction(p => ({ ...p, name: e.target.value }))} className="w-full text-center bg-transparent text-xl font-bold text-white focus:outline-none border-b border-dashed border-white/20 py-1" />
                            ) : (
                                <h2 className="text-xl font-bold text-white text-center">{displayAction?.name}</h2>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            {mode === 'edit' ? (
                                <>
                                    <StyledRangeInput inputRef={durationInputRef} label="Duração" value={editableAction.duration || 60} min={15} max={240} step={15} unit="min" onChange={val => { setEditableAction(p => ({...p, duration: val})); handleTutorialNextFormStep(); }} />
                                    {editableAction.actionType === 'Ação Recorrente' && <StyledRangeInput inputRef={repsInputRef} label="Repetições" value={editableAction.repetitions || 1} min={1} max={50} step={1} unit="x" onChange={val => { setEditableAction(p => ({...p, repetitions: val})); handleTutorialNextFormStep(); }} />}
                                    <StyledRangeInput label="Dificuldade" value={editableAction.difficulty || 3} min={1} max={5} step={1} unit={difficultyLabels[(editableAction.difficulty || 3)-1]} onChange={val => setEditableAction(p => ({...p, difficulty: val}))} />
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between p-2 bg-black/20 rounded-lg text-sm"><span>Tipo:</span> <span className="font-bold">{displayAction?.actionType}</span></div>
                                    <div className="flex justify-between p-2 bg-black/20 rounded-lg text-sm"><span>Duração:</span> <span className="font-bold">{displayAction?.duration} min</span></div>
                                    {displayAction?.actionType === 'Ação Recorrente' && <div className="flex justify-between p-2 bg-black/20 rounded-lg text-sm"><span>Repetições no pool:</span> <span className="font-bold">{displayAction?.repetitions}</span></div>}
                                    <div className="flex justify-between p-2 bg-black/20 rounded-lg text-sm"><span>Dificuldade:</span> <span className="font-bold">{difficultyLabels[(displayAction?.difficulty || 3) - 1]}</span></div>
                                </>
                            )}
                        </div>
                        
                        {mode === 'edit' && !isNew && (
                            <div className="pt-2">
                                <button onClick={handleDelete} className="w-full py-2 rounded-xl bg-red-800/50 text-red-300 hover:bg-red-800/80"> EXCLUIR AÇÃO </button>
                            </div>
                        )}
                    </div>
                </GlassCard>
            </div>
            {isIconPickerOpen && <IconPickerModal onSelect={handleIconSelect} onClose={() => setIsIconPickerOpen(false)} />}
            {isConfirmDeleteOpen && (<ConfirmationModal title="Confirmar Exclusão" message={`Tem certeza que deseja excluir a ação "${action?.name}"?`} onConfirm={confirmDelete} onCancel={() => setConfirmDeleteOpen(false)}/>)}
        </>
    );
};
