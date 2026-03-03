import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { Arena } from '../types';
import { CrownIcon, ChevronRightIcon } from './Icons';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { ArenaSelectionModal } from './ArenaSelectionModal'; // Re-using for asset selection

interface NewArenaModalProps {
    assetId?: string; // Optional now
    isOpen: boolean;
    onClose: () => void;
    onArenaCreated?: (newArena: Arena) => void;
    initialRelationship?: {
        type: 'competition' | 'mentorship' | 'partnership';
        friendId: string;
        friendName: string;
    };
}

const AssetSelectionModal: React.FC<{currentAssetId: string, onSelect: (assetId: string) => void, onClose: () => void}> = ({ onSelect, onClose }) => {
    const { assets } = useGame();
    const geralAsset = assets.find(a => a.id === 'geral');
    const assetLabel = (assetId: string, assetName: string) => assetId === 'geral' ? 'OUTROS / SIDEQUEST' : assetName;
    return (
         <Portal>
             <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[220] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                 <h2 className="text-lg font-bold uppercase tracking-wider text-center">Selecionar Ativo</h2>
                 <div className="space-y-2 max-h-60 overflow-y-auto">
                    {geralAsset && (
                        <button onClick={() => onSelect(geralAsset.id)} className="w-full p-3 rounded-xl text-left bg-black/20 hover:bg-white/10">
                            {assetLabel(geralAsset.id, geralAsset.name)}
                        </button>
                    )}
                    {assets.filter(a => a.id !== 'geral').map(asset => (
                        <button key={asset.id} onClick={() => onSelect(asset.id)} className="w-full p-3 rounded-xl text-left bg-black/20 hover:bg-white/10">
                            {assetLabel(asset.id, asset.name)}
                        </button>
                    ))}
                 </div>
            </GlassCard>
        </div>
        </Portal>
    )
}


export const NewArenaModal: React.FC<NewArenaModalProps> = ({ assetId: initialAssetId, isOpen, onClose, onArenaCreated, initialRelationship }) => {
    const { addArena, assets, inviteLink, showToast } = useGame();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assetId, setAssetId] = useState(initialAssetId || 'geral');
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    
    if (!isOpen) return null;

    const modalCardRef = useRef<HTMLDivElement>(null);

    const handleSave = async () => {
        if (!name.trim() || !assetId) {
            alert("Por favor, selecione um Ativo e dê um nome à Arena.");
            return;
        };

        // Mapping asset IDs to specific emojis
        const assetEmojiMap: Record<string, string> = {
        'saude': '🧘',
        'financas': '💰',
        'trabalho': '💼',
        'hobbies': '🎨',
        'fisico': '💪',
        'geral': '🏆',
        'intelectual': '🧠',
        'social': '🤝',
        'emocional': '❤️',
        'espiritual': '🙏',
        'carreira': '🚀',
        'lazer': '🎮',
        'familia': '👨‍👩‍👧‍👦',
        'estudos': '📚',
        'relacionamento': '💑',
        'criatividade': '🎭',
        'aventura': '🧗',
        'natureza': '🌲',
        'tecnologia': '💻',
        'viagem': '✈️',
        'culinaria': '🍳',
        'musica': '🎵',
        'esportes': '⚽',
        'leitura': '📖',
        'autoconhecimento': '🪞'
    };

        const defaultIcon = initialRelationship?.type === 'competition' ? '⚔️' : (assetEmojiMap[assetId] || '🏆');
        
        // Se houver relacionamento, adicionar metadados na descrição ou tratar depois
        const finalDescription = initialRelationship 
            ? `${description}\n\n[${initialRelationship.type === 'competition' ? 'DESAFIO' : 'VÍNCULO'}: ${initialRelationship.friendName}]`
            : description;

        const newArena = await addArena(assetId, { 
            name, 
            description: finalDescription, 
            icon: defaultIcon 
        });

        // Se tiver initialRelationship, criar o convite automaticamente
        if (initialRelationship) {
            // Convite automático
            inviteLink(newArena.id, initialRelationship.friendId, initialRelationship.type as any);
            showToast(`Convite de ${initialRelationship.type === 'competition' ? 'Desafio' : 'Vínculo'} enviado para ${initialRelationship.friendName}!`);
        }

        if (onArenaCreated) {
            onArenaCreated(newArena);
        } else {
            onClose();
        }
    };

    const selectedAsset = assets.find(a => a.id === assetId);
    const selectedAssetLabel = selectedAsset?.id === 'geral' ? 'OUTROS / SIDEQUEST' : selectedAsset?.name;

    return (
        <>
            <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard ref={ modalCardRef } variant="silver" className="w-full max-w-sm m-4 space-y-4 rounded-3xl relative" onClick={e => e.stopPropagation()}>
                    {initialRelationship && (
                        <div className="absolute top-0 left-0 right-0 -mt-8 text-center">
                             <span className="px-3 py-1 bg-[var(--skin-accent-color)] text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_10px_var(--sephirot-glow-color)]">
                                {initialRelationship.type === 'competition' ? '⚔️ NOVO DESAFIO' : '🤝 NOVO VÍNCULO'}
                             </span>
                        </div>
                    )}
                    
                    <div className="text-center">
                        <CrownIcon className="w-8 h-8 mx-auto text-[var(--skin-accent-color)]" />
                        <h2 className="text-lg font-bold uppercase tracking-wider mt-2">Nova Arena</h2>
                        {initialRelationship && <p className="text-xs text-gray-400 mt-1">Com: {initialRelationship.friendName}</p>}
                    </div>
                    
                    <div className="space-y-2">
                        <button
                            onClick={() => setIsAssetPickerOpen(true)}
                            className="w-full p-3 bg-black/30 border border-[var(--glass-border)] rounded-xl flex justify-between items-center text-left"
                        >
                            <span className={!selectedAsset ? 'text-gray-400' : ''}>{selectedAssetLabel || 'Selecione o Ativo Pai'}</span>
                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </button>
                        <input type="text" placeholder="Nome da Arena" value={name} onChange={e => setName(e.target.value)} className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        <textarea placeholder="Descrição da Meta..." value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                        <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary">
                            CANCELAR
                        </button>
                        <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-skin-button">
                            {initialRelationship ? 'CRIAR E CONVIDAR' : 'CRIAR ARENA'}
                        </button>
                    </div>
                </GlassCard>
            </div>
            </Portal>
            {isAssetPickerOpen && <AssetSelectionModal currentAssetId={assetId} onSelect={(id) => {setAssetId(id); setIsAssetPickerOpen(false)}} onClose={() => setIsAssetPickerOpen(false)} />}
        </>
    );
};
