
import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from './GlassCard';
import { ChecklistItem } from '../types';
import { CheckIcon, EditIcon, PlusIcon, XIcon } from './Icons';
import { Portal } from './Portal';

interface ChecklistRowProps {
    item: ChecklistItem;
    onToggle: (id: string) => void;
    onUpdate: (id: string, text: string) => void;
    onDelete: (id: string) => void;
}

const ChecklistRow: React.FC<ChecklistRowProps> = ({ item, onToggle, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(item.text);

    const handleSave = () => {
        onUpdate(item.id, text);
        setIsEditing(false);
    }

    return (
        <div className="flex items-center space-x-2 bg-black/20 p-2 rounded-xl">
            <button onClick={() => onToggle(item.id)} className={`w-6 h-6 flex-shrink-0 rounded-lg border-2 ${item.completed ? 'bg-[var(--skin-accent-color)] border-[var(--skin-accent-color)]' : 'border-gray-500'}`}>
                {item.completed && <CheckIcon className="w-5 h-5 text-black" />}
            </button>
            {isEditing ? (
                <input type="text" value={text} onChange={e => setText(e.target.value)} onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus className="flex-grow bg-transparent focus:outline-none" />
            ) : (
                <span className={`flex-grow ${item.completed ? 'line-through text-gray-500' : ''}`}>{item.text}</span>
            )}
            <button onClick={() => setIsEditing(!isEditing)} className="p-1 text-gray-400 hover:text-white"><EditIcon className="w-4 h-4" /></button>
            <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
        </div>
    );
};

export const ChecklistModal: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const { checklistItems, toggleChecklistItem, addChecklistItem, updateChecklistItem, deleteChecklistItem } = useGame();
    const [newItemText, setNewItemText] = useState('');

    const handleAddItem = () => {
        addChecklistItem(newItemText);
        setNewItemText('');
    };

    return (
        <Portal>
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10020] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Checklist Diário</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {checklistItems.map(item => (
                        <ChecklistRow key={item.id} item={item} onToggle={toggleChecklistItem} onUpdate={updateChecklistItem} onDelete={deleteChecklistItem} />
                    ))}
                </div>
                 <div className="flex space-x-2">
                    <input type="text" placeholder="Nova tarefa... (ex: 2L de água)" value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddItem()} className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                    <button onClick={handleAddItem} className="p-3 rounded-xl bg-black/30 border border-white/20"><PlusIcon className="w-5 h-5" /></button>
                </div>
                <button onClick={onClose} className="w-full py-2 rounded-xl luxe-skin-button">
                    FECHAR
                </button>
            </GlassCard>
        </div>
        </Portal>
    );
};
