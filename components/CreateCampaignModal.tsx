import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { XIcon } from './Icons';
import { Portal } from './Portal';

interface CreateCampaignModalProps {
    selectedArenaIds: string[];
    onClose: () => void;
    onCreated: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ selectedArenaIds, onClose, onCreated }) => {
    const { getArenas, addCampaign } = useGame();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');

    const selectedArenas = getArenas().filter(arena => selectedArenaIds.includes(arena.id));

    const handleSave = async () => {
        if (!title.trim()) return;

        const arenaConfig = selectedArenaIds.reduce((acc, id) => ({
            ...acc,
            [id]: {
                isLocked: false,
                isHidden: false,
            },
        }), {});

        try {
            await addCampaign({
                title: title.trim(),
                description: description.trim(),
                deadline: deadline || undefined,
                arenaIds: selectedArenaIds,
                arenaConfig,
                type: 'parallel',
                status: 'active',
                order: 0,
                priority: 'media',
                priorityOrder: 0,
            });

            onCreated();
            onClose();
        } catch (error) {
            console.error('Failed to create campaign:', error);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
                <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                        <h3 className="text-lg font-bold text-white">Nova Campanha</h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <XIcon className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome da Campanha</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Dominacao Matinal"
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descricao</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Qual o objetivo desta campanha?"
                                rows={3}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors resize-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prazo (Opcional)</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--skin-accent-color)] transition-colors"
                            />
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] text-gray-400">
                            A campanha nasce sem arenas travadas. Se quiser dependencias entre arenas, configure depois em Vincular dentro da campanha.
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                                <span>Arenas Selecionadas</span>
                                <span className="text-[var(--skin-accent-color)]">{selectedArenas.length}</span>
                            </div>
                            <div className="space-y-2">
                                {selectedArenas.map(arena => (
                                    <div key={arena.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                                        <span className="text-xl">{arena.icon}</span>
                                        <span className="text-sm font-medium text-gray-300 truncate flex-1">{arena.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10 bg-black/40">
                        <button
                            onClick={handleSave}
                            disabled={!title.trim()}
                            className="w-full py-3 bg-[var(--skin-accent-color)] text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Criar Campanha
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};
