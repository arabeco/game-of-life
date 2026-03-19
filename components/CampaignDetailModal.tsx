import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Campaign, Arena } from '../types';
import { XIcon, TrashIcon, EditIcon } from './Icons';
import { ArenaCard } from './ArenaCard';
import { Portal } from './Portal';
import { ArenaDetailModal } from './ArenaDetailModal';

interface CampaignDetailModalProps {
    campaign: Campaign;
    onClose: () => void;
}

export const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({ campaign, onClose }) => {
    const { getArenas, updateCampaign, deleteCampaign } = useGame();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(campaign.title);
    const [description, setDescription] = useState(campaign.description || '');
    const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);

    const allArenas = getArenas();
    const campaignArenas = allArenas.filter(a => campaign.arenaIds.includes(a.id));
    const selectedArena = allArenas.find(a => a.id === selectedArenaId);

    const handleSave = async () => {
        const saved = await updateCampaign(campaign.id, {
            title,
            description
        });
        if (saved) {
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (confirm('Tem certeza que deseja excluir esta campanha? TODAS as arenas e ações dentro dela serão excluídas permanentemente.')) {
            deleteCampaign(campaign.id);
            onClose();
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
                <div className="w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🚩</span>
                        {isEditing ? (
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="bg-transparent border-b border-white/20 text-white font-bold text-lg focus:outline-none focus:border-[var(--skin-accent-color)]"
                                autoFocus
                            />
                        ) : (
                            <h3 className="text-lg font-bold text-white">{campaign.title}</h3>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                                <EditIcon className="w-4 h-4" />
                            </button>
                        )}
                        {isEditing && (
                            <button onClick={handleSave} className="px-3 py-1 bg-[var(--skin-accent-color)] text-black text-xs font-bold rounded-lg hover:opacity-90">
                                Salvar
                            </button>
                        )}
                        <button onClick={handleDelete} className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-400 hover:text-red-300">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <XIcon className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* Description */}
                    {isEditing ? (
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-gray-300 focus:outline-none focus:border-[var(--skin-accent-color)] resize-none"
                            rows={3}
                            placeholder="Descrição da campanha..."
                        />
                    ) : (
                        description && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
                            </div>
                        )
                    )}

                    {/* Progress / Stats could go here */}

                    {/* Arenas List */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Arenas da Campanha</h4>
                        {campaignArenas.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                Nenhuma arena nesta campanha.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {campaignArenas.map(arena => (
                                    <div key={arena.id} onClick={() => setSelectedArenaId(arena.id)} className="cursor-pointer hover:scale-[1.02] transition-transform">
                                        <ArenaCard arena={arena} actions={[]} variant="compact" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>

            {selectedArena && (
                <ArenaDetailModal
                    arena={selectedArena}
                    onClose={() => setSelectedArenaId(null)}
                />
            )}
        </Portal>
    );
};
