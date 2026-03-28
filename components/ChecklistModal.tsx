import React, { useEffect, useRef, useState } from 'react';
import { useGame, getOperationalDateString } from '../contexts/GameContext';
import { ChecklistItem, SequenceItem } from '../types';
import { GlassCard } from './GlassCard';
import { CheckIcon, EditIcon, FlameIcon, LinkIcon, MinusIcon, PlusIcon, Trash2Icon, XIcon } from './Icons';
import { Portal } from './Portal';

type ChecklistTab = 'checklist' | 'sequence';

interface ChecklistRowProps {
    item: ChecklistItem;
    onToggle: (id: string) => void;
    onUpdate: (id: string, text: string) => void;
    onDelete: (id: string) => void;
}

interface SequenceRowProps {
    item: SequenceItem;
    onMarkToday: (id: string) => void;
    onUpdate: (id: string, title: string) => void;
    onAdjust: (id: string, delta: number) => void;
    onReset: (id: string) => void;
    onDelete: (id: string) => void;
}

const ChecklistRow: React.FC<ChecklistRowProps> = ({ item, onToggle, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(item.text);

    useEffect(() => {
        setText(item.text);
    }, [item.text]);

    const handleSave = () => {
        if (!text.trim()) {
            setText(item.text);
            setIsEditing(false);
            return;
        }
        onUpdate(item.id, text);
        setIsEditing(false);
    };

    return (
        <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-black/20 p-3">
            <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border-2 transition-colors ${
                    item.completed
                        ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)] text-black'
                        : 'border-white/25 text-white/50'
                }`}
            >
                {item.completed && <CheckIcon className="h-4 w-4" />}
            </button>
            {isEditing ? (
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') {
                            setText(item.text);
                            setIsEditing(false);
                        }
                    }}
                    autoFocus
                    className="min-w-0 flex-1 bg-transparent text-sm text-white focus:outline-none"
                />
            ) : (
                <span className={`min-w-0 flex-1 text-sm ${item.completed ? 'text-white/45 line-through' : 'text-white/88'}`}>
                    {item.text}
                </span>
            )}
            <button type="button" onClick={() => setIsEditing((prev) => !prev)} className="p-1 text-white/45 transition-colors hover:text-white">
                <EditIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onDelete(item.id)} className="p-1 text-white/35 transition-colors hover:text-rose-400">
                <Trash2Icon className="h-4 w-4" />
            </button>
        </div>
    );
};

const SequenceRow: React.FC<SequenceRowProps> = ({ item, onMarkToday, onUpdate, onAdjust, onReset, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [titleDraft, setTitleDraft] = useState(item.title);
    const [holdProgress, setHoldProgress] = useState(0);
    const [justReset, setJustReset] = useState(false);
    const holdIntervalRef = useRef<number | null>(null);
    const holdTriggeredRef = useRef(false);
    const holdStartRef = useRef<number | null>(null);
    const resetFlashTimeoutRef = useRef<number | null>(null);

    const today = getOperationalDateString();
    const markedToday = item.lastMarkedDate === today;

    useEffect(() => {
        setTitleDraft(item.title);
    }, [item.title]);

    useEffect(() => {
        return () => {
            if (holdIntervalRef.current) window.clearInterval(holdIntervalRef.current);
            if (resetFlashTimeoutRef.current) window.clearTimeout(resetFlashTimeoutRef.current);
        };
    }, []);

    const finishResetFlash = () => {
        if (resetFlashTimeoutRef.current) window.clearTimeout(resetFlashTimeoutRef.current);
        resetFlashTimeoutRef.current = window.setTimeout(() => setJustReset(false), 900);
    };

    const handleSave = () => {
        if (!titleDraft.trim()) {
            setTitleDraft(item.title);
            setIsEditing(false);
            return;
        }
        onUpdate(item.id, titleDraft);
        setIsEditing(false);
    };

    const clearHold = () => {
        if (holdIntervalRef.current) {
            window.clearInterval(holdIntervalRef.current);
            holdIntervalRef.current = null;
        }
        holdStartRef.current = null;
        if (!holdTriggeredRef.current) {
            setHoldProgress(0);
        }
    };

    const startHoldReset = () => {
        if (holdIntervalRef.current) return;
        holdTriggeredRef.current = false;
        holdStartRef.current = Date.now();
        holdIntervalRef.current = window.setInterval(() => {
            if (!holdStartRef.current) return;
            const progress = Math.min(1, (Date.now() - holdStartRef.current) / 5000);
            setHoldProgress(progress);
            if (progress >= 1) {
                holdTriggeredRef.current = true;
                clearHold();
                setHoldProgress(0);
                setJustReset(true);
                onReset(item.id);
                finishResetFlash();
            }
        }, 80);
    };

    return (
        <div className={`relative overflow-hidden rounded-[1.4rem] border p-3 transition-all ${
            justReset
                ? 'border-rose-400/50 bg-rose-500/10 shadow-[0_0_24px_rgba(244,63,94,0.18)]'
                : 'border-white/8 bg-black/20'
        }`}>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/6">
                <div
                    className={`h-full transition-[width,background] duration-75 ${justReset ? 'bg-rose-400' : 'bg-[var(--skin-accent-color)]'}`}
                    style={{ width: `${holdProgress * 100}%` }}
                />
            </div>

            <div className="flex items-start gap-3">
                <button
                    type="button"
                    onMouseDown={startHoldReset}
                    onMouseUp={clearHold}
                    onMouseLeave={clearHold}
                    onTouchStart={startHoldReset}
                    onTouchEnd={clearHold}
                    onTouchCancel={clearHold}
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border transition-all ${
                        markedToday
                            ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300'
                            : justReset
                                ? 'border-rose-400/50 bg-rose-400/12 text-rose-300'
                                : 'border-[var(--skin-accent-color)]/35 bg-[var(--skin-accent-color)]/10 text-[var(--skin-accent-color)]'
                    }`}>
                        {markedToday ? <CheckIcon className="h-5 w-5" /> : <LinkIcon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                        {isEditing ? (
                            <input
                                type="text"
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave();
                                    if (e.key === 'Escape') {
                                        setTitleDraft(item.title);
                                        setIsEditing(false);
                                    }
                                }}
                                autoFocus
                                className="w-full bg-transparent text-sm font-bold text-white focus:outline-none"
                            />
                        ) : (
                            <div className="truncate text-sm font-black uppercase tracking-[0.08em] text-white">{item.title}</div>
                        )}
                        <div className={`mt-1 text-[11px] leading-relaxed ${
                            justReset ? 'text-rose-300/80' : 'text-white/52'
                        }`}>
                            {justReset ? 'Sequência reiniciada.' : 'Segure o título para quebrar a sequência.'}
                        </div>
                    </div>
                </button>

                <button type="button" onClick={() => setIsEditing((prev) => !prev)} className="p-1 text-white/45 transition-colors hover:text-white">
                    <EditIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">Dias</div>
                    <div className="mt-1 text-3xl font-black text-white">{item.days}</div>
                </div>

                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onAdjust(item.id, -1)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-white/80 transition-colors hover:bg-black/35"
                        >
                            <MinusIcon className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onAdjust(item.id, 1)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-white/80 transition-colors hover:bg-black/35"
                        >
                            <PlusIcon className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(item.id)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/10 text-rose-300 transition-colors hover:bg-rose-500/18"
                        >
                            <Trash2Icon className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => onMarkToday(item.id)}
                        disabled={markedToday}
                        className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all ${
                            markedToday
                                ? 'border border-emerald-400/25 bg-emerald-400/10 text-emerald-300/80'
                                : 'luxe-skin-button'
                        }`}
                    >
                        {markedToday ? 'Hoje marcado' : 'Marcar hoje'}
                    </button>
                )}
            </div>
        </div>
    );
};

export const ChecklistModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const {
        checklistItems,
        sequenceItems,
        toggleChecklistItem,
        addChecklistItem,
        updateChecklistItem,
        deleteChecklistItem,
        addSequenceItem,
        updateSequenceItem,
        markSequenceItemToday,
        adjustSequenceItemDays,
        resetSequenceItem,
        deleteSequenceItem,
    } = useGame();

    const [activeTab, setActiveTab] = useState<ChecklistTab>('checklist');
    const [newItemText, setNewItemText] = useState('');
    const [newSequenceTitle, setNewSequenceTitle] = useState('');

    const handleAddChecklistItem = () => {
        addChecklistItem(newItemText);
        setNewItemText('');
    };

    const handleAddSequenceItem = () => {
        addSequenceItem(newSequenceTitle);
        setNewSequenceTitle('');
        setActiveTab('sequence');
    };

    return (
        <Portal>
            <div
                className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            >
                <GlassCard
                    variant="neutral"
                    className="w-full max-w-md space-y-4 rounded-[2rem] border border-white/10 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.42)]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-[0.16em] text-white">Checklist</h2>
                            <p className="mt-1 text-xs text-white/45">Checklist diário e sequências manuais.</p>
                        </div>
                        <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-black/20 p-2 text-white/65 transition-colors hover:bg-black/35 hover:text-white">
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/25 p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('checklist')}
                            className={`rounded-[1rem] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all ${
                                activeTab === 'checklist'
                                    ? 'bg-white/10 text-white shadow-[0_8px_18px_rgba(0,0,0,0.24)]'
                                    : 'text-white/45 hover:text-white/75'
                            }`}
                        >
                            Checklist
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('sequence')}
                            className={`rounded-[1rem] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all ${
                                activeTab === 'sequence'
                                    ? 'bg-white/10 text-white shadow-[0_8px_18px_rgba(0,0,0,0.24)]'
                                    : 'text-white/45 hover:text-white/75'
                            }`}
                        >
                            Sequência
                        </button>
                    </div>

                    {activeTab === 'checklist' ? (
                        <>
                            <div className="max-h-[20rem] space-y-2 overflow-y-auto pr-1">
                                {checklistItems.length > 0 ? (
                                    checklistItems.map((item) => (
                                        <ChecklistRow
                                            key={item.id}
                                            item={item}
                                            onToggle={toggleChecklistItem}
                                            onUpdate={updateChecklistItem}
                                            onDelete={deleteChecklistItem}
                                        />
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/18 px-4 py-6 text-center text-sm text-white/45">
                                        Nada no checklist por enquanto.
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nova tarefa... (ex: 2L de água)"
                                    value={newItemText}
                                    onChange={(e) => setNewItemText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                    className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/28 focus:border-[var(--skin-accent-color)]/45 focus:outline-none"
                                />
                                <button type="button" onClick={handleAddChecklistItem} className="flex h-[3rem] w-[3rem] items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-white transition-colors hover:bg-black/35">
                                    <PlusIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="max-h-[20rem] space-y-2 overflow-y-auto pr-1">
                                {sequenceItems.length > 0 ? (
                                    sequenceItems.map((item) => (
                                        <SequenceRow
                                            key={item.id}
                                            item={item}
                                            onMarkToday={markSequenceItemToday}
                                            onUpdate={updateSequenceItem}
                                            onAdjust={adjustSequenceItemDays}
                                            onReset={resetSequenceItem}
                                            onDelete={deleteSequenceItem}
                                        />
                                    ))
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/18 px-4 py-6 text-center text-sm text-white/45">
                                        Crie uma sequência como <span className="font-semibold text-white/75">Sem fumar</span> ou <span className="font-semibold text-white/75">Ler todo dia</span>.
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <FlameIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--skin-accent-color)]/75" />
                                    <input
                                        type="text"
                                        placeholder="Nova sequência... (ex: Sem fumar)"
                                        value={newSequenceTitle}
                                        onChange={(e) => setNewSequenceTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSequenceItem()}
                                        className="w-full rounded-2xl border border-white/10 bg-black/25 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/28 focus:border-[var(--skin-accent-color)]/45 focus:outline-none"
                                    />
                                </div>
                                <button type="button" onClick={handleAddSequenceItem} className="flex h-[3rem] w-[3rem] items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-white transition-colors hover:bg-black/35">
                                    <PlusIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </>
                    )}

                    <button type="button" onClick={onClose} className="w-full rounded-2xl py-3 luxe-skin-button">
                        Fechar
                    </button>
                </GlassCard>
            </div>
        </Portal>
    );
};
