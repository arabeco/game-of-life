import React, { useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Arena } from '../types';
import { CrownIcon, ChevronRightIcon } from './Icons';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { supabase } from '../supabaseClient';
import { FIRST_USE_ONBOARDING_EVENTS } from '../utils/firstUseOnboarding';
import { suggestEmojiForLabel } from '../utils/suggestEmojiForLabel';

interface NewArenaModalProps {
    assetId?: string;
    isOpen: boolean;
    onClose: () => void;
    onArenaCreated?: (newArena: Arena) => void;
    initialRelationship?: {
        type: 'competition' | 'mentorship' | 'partnership';
        friendId: string;
        friendName: string;
    };
}

const AssetSelectionModal: React.FC<{ currentAssetId: string; onSelect: (assetId: string) => void; onClose: () => void }> = ({ onSelect, onClose }) => {
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
    );
};

export const NewArenaModal: React.FC<NewArenaModalProps> = ({ assetId: initialAssetId, isOpen, onClose, onArenaCreated, initialRelationship }) => {
    const { addArena, assets, showToast } = useGame();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assetId, setAssetId] = useState(initialAssetId || 'geral');
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    const modalCardRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const mapRelationshipType = (type: NonNullable<NewArenaModalProps['initialRelationship']>['type']) => {
        switch (type) {
            case 'competition':
                return 'competicao';
            case 'partnership':
                return 'parceria';
            case 'mentorship':
            default:
                return 'mentoria';
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !assetId) {
            showToast('Escolha o ativo e dê um nome para a arena.', 'warning');
            return;
        }

        const defaultIcon = initialRelationship?.type === 'competition'
            ? '\u2694\uFE0F'
            : suggestEmojiForLabel(name, 'arena', { assetId, fallback: '\u{1F3DB}\uFE0F' });
        const finalDescription = initialRelationship
            ? `${description}\n\n[${initialRelationship.type === 'competition' ? 'DESAFIO' : 'VINCULO'}: ${initialRelationship.friendName}]`
            : description;

        const newArena = await addArena(assetId, {
            name,
            description: finalDescription,
            icon: defaultIcon,
        });

        if (initialRelationship) {
            const { data: sessionData } = await supabase.auth.getSession();
            const senderId = sessionData.session?.user.id;

            if (!senderId) {
                showToast('Faca login para enviar o convite do vinculo.', 'warning');
            } else {
                const { error } = await supabase.from('relationship_link_invites').insert({
                    sender_id: senderId,
                    recipient_id: initialRelationship.friendId,
                    link_type: mapRelationshipType(initialRelationship.type),
                    arena_id: newArena.id,
                    arena_snapshot: { name, icon: defaultIcon },
                    status: 'pending',
                });

                if (error) {
                    showToast(`Arena criada, mas o convite falhou: ${error.message}`, 'error');
                } else {
                    showToast(`Convite enviado para ${initialRelationship.friendName}.`, 'success');
                }
            }
        } else {
            showToast('Arena criada.', 'success');
        }

        window.dispatchEvent(new CustomEvent(FIRST_USE_ONBOARDING_EVENTS.arenaCreated, { detail: { arenaId: newArena.id } }));

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
                    <GlassCard ref={modalCardRef} variant="silver" className="w-full max-w-sm m-4 space-y-4 rounded-3xl relative" onClick={e => e.stopPropagation()}>
                        {initialRelationship && (
                            <div className="absolute top-0 left-0 right-0 -mt-8 text-center">
                                <span className="px-3 py-1 bg-[var(--skin-accent-color)] text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_10px_var(--sephirot-glow-color)]">
                                    {initialRelationship.type === 'competition' ? 'NOVO DESAFIO' : 'NOVO VINCULO'}
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
                                id="new-arena-asset-button"
                                onClick={() => setIsAssetPickerOpen(true)}
                                className="w-full p-3 bg-black/30 border border-[var(--glass-border)] rounded-xl flex justify-between items-center text-left"
                            >
                                <span className={!selectedAsset ? 'text-gray-400' : ''}>{selectedAssetLabel || 'Selecione o Ativo Pai'}</span>
                                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            </button>
                            <input id="new-arena-name-input" type="text" placeholder="Nome da Arena" value={name} onChange={e => setName(e.target.value)} className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                            <textarea id="new-arena-description-input" placeholder="Descricao da Meta..." value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        </div>

                        <div className="flex space-x-2 pt-2">
                            <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary">
                                CANCELAR
                            </button>
                            <button id="new-arena-submit-button" onClick={handleSave} className="w-full py-2 rounded-xl luxe-skin-button">
                                {initialRelationship ? 'CRIAR E CONVIDAR' : 'CRIAR ARENA'}
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </Portal>
            {isAssetPickerOpen && <AssetSelectionModal currentAssetId={assetId} onSelect={(id) => { setAssetId(id); setIsAssetPickerOpen(false); }} onClose={() => setIsAssetPickerOpen(false)} />}
        </>
    );
};



