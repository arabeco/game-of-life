
import React, { useState } from 'react';
import { ArenaFolder } from '../types';
import { useGame } from '../contexts/GameContext';
import { ArenaCard } from './ArenaCard';
import { XIcon, Trash2Icon, EditIcon, CheckIcon } from './Icons';
import { IconPickerModal } from './IconPickerModal';
import { Portal } from './Portal';

interface FolderDetailModalProps {
    folder: ArenaFolder;
    onClose: () => void;
}

export const FolderDetailModal: React.FC<FolderDetailModalProps> = ({ folder, onClose }) => {
    const { getArenas, updateArenaFolder, deleteArenaFolder, moveArenaToFolder, getActionsForArena } = useGame();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(folder.name);
    const [icon, setIcon] = useState(folder.icon);
    const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

    const arenas = getArenas().filter(a => a.folderId === folder.id);

    const handleSave = async () => {
        await updateArenaFolder(folder.id, { name, icon });
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (confirm('Tem certeza que deseja excluir esta pasta? As arenas serão movidas para a raiz.')) {
            await deleteArenaFolder(folder.id);
            onClose();
        }
    };

    const handleRemoveArena = async (arenaId: string) => {
        await moveArenaToFolder(arenaId, null);
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-[#1a1a1a] border border-[var(--skin-accent-color)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-black to-[var(--skin-accent-color)]/20">
                     <div className="flex items-center gap-3">
                        <button 
                            onClick={() => isEditing && setIsIconPickerOpen(true)}
                            className={`w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-xl ${isEditing ? 'hover:bg-white/10 cursor-pointer' : ''}`}
                            disabled={!isEditing}
                        >
                            {icon}
                        </button>
                        {isEditing ? (
                            <input 
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                className="bg-black/40 border border-white/20 rounded px-2 py-1 text-lg font-bold text-white focus:outline-none focus:border-[var(--skin-accent-color)]"
                            />
                        ) : (
                            <h2 className="text-xl font-bold accent-text uppercase tracking-wider">{folder.name}</h2>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                         {isEditing ? (
                            <button onClick={handleSave} className="p-2 text-green-400 hover:bg-white/10 rounded-full">
                                <CheckIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
                                <EditIcon className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={handleDelete} className="p-2 text-red-400 hover:bg-white/10 rounded-full">
                            <Trash2Icon className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 bg-black/20">
                    {arenas.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">Esta pasta está vazia.</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {arenas.map(arena => (
                                <div key={arena.id} className="relative group">
                                     <ArenaCard
                                        arena={arena}
                                        actions={getActionsForArena(arena.id)}
                                        onClick={() => {}} // In a folder, clicking opens details? Or just viewing?
                                        variant="overview"
                                    />
                                    {isEditing && (
                                        <button 
                                            onClick={() => handleRemoveArena(arena.id)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            title="Remover da pasta"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isIconPickerOpen && (
                <IconPickerModal
                    onSelect={icon => {
                        setIcon(icon);
                        setIsIconPickerOpen(false);
                    }}
                    onClose={() => setIsIconPickerOpen(false)}
                />
            )}
</div>
        </Portal>
    );
};
