import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Arena, Asset } from '../types';
import { CrownIcon, ChevronRightIcon } from './Icons';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { FIRST_USE_ONBOARDING_EVENTS } from '../utils/firstUseOnboarding';
import { suggestEmojiForLabel } from '../utils/suggestEmojiForLabel';
import { buildArenaLimitMessage, getArenaCapacitySummary } from '../utils/arenaCapacity';
import { SCREEN_INTRO_TIP_CONTEXT_EVENT } from '../utils/screenIntroTips';
import { isLifeAreaId, LIFE_AREAS, LIFE_AREA_IDS } from '../constants/lifeAreas';

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

const AssetSelectionModal: React.FC<{ onSelect: (assetId: string) => void; onClose: () => void }> = ({ onSelect, onClose }) => {
    const { assets } = useGame();
    const areaAssets = LIFE_AREAS
        .map(area => assets.find(asset => asset.id === area.id))
        .filter((asset): asset is Asset => Boolean(asset));

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[245] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-bold uppercase tracking-wider text-center">Selecionar área</h2>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {areaAssets.map(asset => (
                            <button key={asset.id} onClick={() => onSelect(asset.id)} className="w-full p-3 rounded-xl text-left bg-black/20 hover:bg-white/10">
                                {asset.name}
                            </button>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

export const NewArenaModal: React.FC<NewArenaModalProps> = ({ assetId: initialAssetId, isOpen, onClose, onArenaCreated, initialRelationship }) => {
    const { addArena, assets, showToast, userProfile } = useGame();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assetId, setAssetId] = useState(
        initialAssetId && isLifeAreaId(initialAssetId) ? initialAssetId : LIFE_AREA_IDS[0],
    );
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    const modalCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        window.dispatchEvent(new CustomEvent(FIRST_USE_ONBOARDING_EVENTS.arenaModalOpened));
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        setAssetId(currentAssetId => {
            const requestedAssetId = initialAssetId && isLifeAreaId(initialAssetId) ? initialAssetId : null;
            if (requestedAssetId && assets.some(asset => asset.id === requestedAssetId)) return requestedAssetId;
            if (isLifeAreaId(currentAssetId) && assets.some(asset => asset.id === currentAssetId)) return currentAssetId;
            return LIFE_AREA_IDS.find(areaId => assets.some(asset => asset.id === areaId)) || LIFE_AREA_IDS[0];
        });
    }, [assets, initialAssetId, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        window.dispatchEvent(
            new CustomEvent(SCREEN_INTRO_TIP_CONTEXT_EVENT, {
                detail: { tipId: 'arena_modal' },
            }),
        );

        return () => {
            window.dispatchEvent(
                new CustomEvent(SCREEN_INTRO_TIP_CONTEXT_EVENT, {
                    detail: { tipId: null },
                }),
            );
        };
    }, [isOpen]);

    if (!isOpen) return null;
    const arenaCapacity = getArenaCapacitySummary(assets, userProfile);
    const canCreateArena = !arenaCapacity.isAtLimit;

    const handleSave = async () => {
        if (!name.trim() || !assetId) {
            showToast('Escolha o ativo e dê um nome para a arena.', 'warning');
            return;
        }

        if (!canCreateArena) {
            showToast(buildArenaLimitMessage(arenaCapacity), 'warning');
            return;
        }

        const defaultIcon = suggestEmojiForLabel(name, 'arena', { assetId, fallback: '\u{1F3DB}\uFE0F' });
        const finalDescription = description;

        try {
            const newArena = await addArena(assetId, {
                name,
                description: finalDescription,
                icon: defaultIcon,
            });

            showToast('Arena criada.', 'success');

            window.dispatchEvent(new CustomEvent(FIRST_USE_ONBOARDING_EVENTS.arenaCreated, { detail: { arenaId: newArena.id } }));

            if (onArenaCreated) {
                onArenaCreated(newArena);
            } else {
                onClose();
            }
        } catch (error) {
            console.error('Error creating arena from modal:', error);
        }
    };

    const selectedAsset = assets.find(a => a.id === assetId);
    const selectedAssetLabel = selectedAsset?.name;

    return (
        <>
            <Portal>
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[240] flex items-center justify-center animate-fade-in" onClick={onClose}>
                    <GlassCard ref={modalCardRef} variant="silver" className="w-full max-w-sm m-4 space-y-4 rounded-3xl relative" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <CrownIcon className="w-8 h-8 mx-auto text-[var(--skin-accent-color)]" />
                            <h2 className="text-lg font-bold uppercase tracking-wider mt-2">Nova Arena</h2>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                                Arenas: {arenaCapacity.total}/{arenaCapacity.limit}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <button
                                id="new-arena-asset-button"
                                onClick={() => setIsAssetPickerOpen(true)}
                                className="w-full p-3 bg-black/30 border border-[var(--glass-border)] rounded-xl flex justify-between items-center text-left"
                            >
                                <span className={!selectedAsset ? 'text-gray-400' : ''}>{selectedAssetLabel || 'Selecione a área'}</span>
                                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                            </button>
                            <input
                                id="new-arena-name-input"
                                type="text"
                                placeholder="Nome da Arena"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onBlur={(event) => {
                                    if (!event.target.value.trim()) return;
                                    const relatedTarget = event.relatedTarget as HTMLElement | null;
                                    if (relatedTarget?.id === 'first-use-onboarding-next') return;
                                    window.dispatchEvent(new CustomEvent(FIRST_USE_ONBOARDING_EVENTS.arenaNameCompleted));
                                }}
                                className="w-full h-12 px-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]"
                            />
                            <textarea id="new-arena-description-input" placeholder="Descricao da Meta..." value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full p-4 bg-black/30 border border-[var(--glass-border)] rounded-xl focus:outline-none focus:border-[var(--skin-accent-color)]" />
                        </div>

                        <div className="flex space-x-2 pt-2">
                            <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary">
                                CANCELAR
                            </button>
                            <button id="new-arena-submit-button" onClick={handleSave} disabled={!canCreateArena} className="w-full py-2 rounded-xl luxe-skin-button disabled:cursor-not-allowed disabled:opacity-50">
                                CRIAR ARENA
                            </button>
                        </div>
                    </GlassCard>
                </div>
            </Portal>
            {isAssetPickerOpen && <AssetSelectionModal onSelect={(id) => {
                setAssetId(id);
                setIsAssetPickerOpen(false);
                window.dispatchEvent(new CustomEvent(FIRST_USE_ONBOARDING_EVENTS.arenaAssetSelected, { detail: { assetId: id } }));
            }} onClose={() => setIsAssetPickerOpen(false)} />}
        </>
    );
};



