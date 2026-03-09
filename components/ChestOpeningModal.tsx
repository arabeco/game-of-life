import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon, Trash2Icon, ShareIcon, CheckIcon } from './Icons';
import { ChestType, UnlockCategory, ItemRarity } from '../types';
import { useGame } from '../contexts/GameContext';
import { SKINS_DATA } from '../constants';
import { VideoPlayer } from './VideoPlayer';
import { ITEMS_DB } from '../constants/items';
import { useVideoStageTransition } from '../hooks/useVideoStageTransition';

interface ChestOpeningModalProps {
    chestType: ChestType;
    onClose: () => void;
    predefinedReward?: any;
}

interface Reward {
    type: string;
    value: string;
    rarity: string;
    itemUnlock?: { category: UnlockCategory; itemId: string };
    skinUnlock?: string;
}

const getRandomReward = (chestType: ChestType): Reward => {
    const rarityMap: Record<string, ItemRarity> = {
        Comum: 'common',
        Incomum: 'uncommon',
        Raro: 'rare',
        Épico: 'epic',
        Lendário: 'legendary',
        Ciclo: 'rare',
        comum: 'common',
        incomum: 'uncommon',
        raro: 'rare',
        épico: 'epic',
        epico: 'epic',
        lendário: 'legendary',
        lendario: 'legendary',
        commum: 'common',
    };

    const targetRarity = rarityMap[chestType] || 'common';
    const pool = ITEMS_DB.filter((item) => item.rarity === targetRarity && !item.isRankExclusive && !item.isGoldExclusive && !item.isSeasonExclusive);

    if (pool.length === 0) {
        return {
            type: 'Nada',
            value: 'Vazio',
            rarity: chestType,
        };
    }

    const randomItem = pool[Math.floor(Math.random() * pool.length)];

    const getUnlockCategory = (category: string): UnlockCategory | null => {
        const map: Record<string, UnlockCategory> = {
            skin: 'skins',
            hair: 'hairStyles',
            border: 'borders',
            banner: 'banners',
            glyph: 'glyphs',
            aura: 'auras',
            ui_skin: 'skins',
            artifact: 'artifacts',
            orb: 'orbs',
            plate: 'plates',
        };
        return map[category] || null;
    };

    const unlockCategory = getUnlockCategory(randomItem.category);

    return {
        type: randomItem.category === 'skin' ? 'Skin' : 'Item',
        value: randomItem.name,
        rarity: chestType,
        itemUnlock: unlockCategory ? { category: unlockCategory, itemId: randomItem.id } : undefined,
        skinUnlock: randomItem.category === 'skin' || randomItem.category === 'ui_skin' ? randomItem.id : undefined,
    };
};

const CHEST_VIDEOS: Record<string, string> = {
    commum: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_common.mp4`,
    incomum: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_uncommon.mp4`,
    raro: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_rare.mp4`,
    epico: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_epic.mp4`,
    lendario: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_legendary.mp4`,
    Comum: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_common.mp4`,
    Incomum: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_uncommon.mp4`,
    Raro: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_rare.mp4`,
    Épico: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_epic.mp4`,
    Lendário: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_legendary.mp4`,
};

const RARITY_COLORS: Record<string, string> = {
    Comum: '#A0522D',
    Incomum: '#C0C0C0',
    Raro: '#FFD700',
    Épico: '#3B82F6',
    Lendário: '#A855F7',
    Ciclo: '#FFD700',
};

export const ChestOpeningModal: React.FC<ChestOpeningModalProps> = ({ chestType, onClose, predefinedReward }) => {
    const { userProfile, grantUserUnlock, showToast, appMode, oraclePreferences, updateUserProfile } = useGame();
    const [reward, setReward] = useState<Reward | null>(null);

    useEffect(() => {
        const isGM = userProfile.role === 'gm' || userProfile.role === 'admin';
        if (appMode !== 'GAME' && !isGM) {
            onClose();
        }
    }, [appMode, onClose, userProfile.role]);

    const isGM = userProfile.role === 'gm' || userProfile.role === 'admin';
    if (appMode !== 'GAME' && !isGM) return null;

    const rarityColor = RARITY_COLORS[chestType] || RARITY_COLORS.Comum;
    const userSkin = SKINS_DATA.find((skin) => skin.id === userProfile.skin);
    const skinBorderColor = userSkin?.color || '#ffffff';
    const animationsEnabled = oraclePreferences?.animationsEnabled ?? true;
    const { showVideoStage, showContentStage, isVideoFading, triggerReveal } = useVideoStageTransition({
        enabled: animationsEnabled,
        revealDelayMs: 4000,
        fadeDurationMs: 320,
    });

    useEffect(() => {
        setReward(predefinedReward || getRandomReward(chestType));
    }, [chestType, predefinedReward]);

    const handleCollect = () => {
        if (!predefinedReward) {
            if (reward?.itemUnlock) {
                grantUserUnlock(reward.itemUnlock.category, reward.itemUnlock.itemId);
            }
            if (reward?.skinUnlock) {
                const nextUnlockedSkins = { ...(userProfile.unlockedSkins || {}), [reward.skinUnlock]: true };
                updateUserProfile({ unlockedSkins: nextUnlockedSkins });
            }

            if (reward && reward.type !== 'Nada') {
                const typeLabel = reward.type === 'Item'
                    ? 'Item'
                    : reward.type === 'Skin'
                        ? 'Skin'
                        : reward.type === 'EXP'
                            ? 'XP'
                            : reward.type === 'Conselho'
                                ? 'Conselho'
                                : 'Recompensa';
                showToast(`✦ ${typeLabel} ${reward.value} adicionado ao inventario`);
            }
        }

        onClose();
    };

    const handleRecycle = () => {
        const confirmed = window.confirm(`Tem certeza que deseja reciclar ${reward?.value}? (Simulacao)`);
        if (confirmed) {
            alert(`Voce reciclou ${reward?.value}!`);
            onClose();
        }
    };

    const handleDonate = () => {
        alert(`Voce doou ${reward?.value}! (Simulacao)`);
    };

    const renderContent = () => {
        if (!reward && showContentStage) return null;

        return (
            <>
                {showVideoStage && (
                    <div className={`relative aspect-[9/16] w-full overflow-hidden rounded-t-3xl bg-black transition-all duration-300 ease-out ${isVideoFading ? 'scale-[0.985] opacity-0' : 'scale-100 opacity-100'}`}>
                        <VideoPlayer
                            src={CHEST_VIDEOS[chestType]}
                            onEnd={triggerReveal}
                            className="h-full w-full object-cover"
                            placeholderLabel={`Opening ${chestType} Chest...`}
                            duration={4000}
                            preload="auto"
                        />
                    </div>
                )}

                {showContentStage && reward && (
                    <div className="flex w-full animate-fade-in-up flex-col items-center gap-4 p-6">
                        <div className="group relative z-10 mt-2">
                            <div
                                className="absolute inset-0 rounded-full bg-gradient-to-tr blur-xl"
                                style={{ backgroundColor: rarityColor, opacity: 0.3, filter: 'blur(20px)' }}
                            />
                            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-black/40 shadow-lg">
                                <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                    {reward.type === 'Item' ? '⚔️' : reward.type === 'Skin' ? '👕' : reward.type === 'EXP' ? '✨' : '🎁'}
                                </span>
                            </div>
                        </div>

                        <div className="z-10 w-full space-y-1 text-center">
                            <h2 className="text-xl font-black uppercase tracking-widest text-white drop-shadow-lg" style={{ color: rarityColor }}>
                                {reward.value}
                            </h2>
                            <div className="flex justify-center">
                                <span
                                    className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg backdrop-blur-sm"
                                    style={{ color: rarityColor, borderColor: `${rarityColor}40` }}
                                >
                                    {reward.rarity}
                                </span>
                            </div>
                            <div className="mx-auto my-3 h-px w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            <p className="px-2 text-xs text-white/60">
                                {reward.type === 'Conselho'
                                    ? 'Um conselho para sua jornada.'
                                    : reward.type === 'Nada'
                                        ? 'Melhor sorte na proxima vez.'
                                        : `Uma recompensa ${reward.rarity} para sua colecao.`}
                            </p>
                        </div>

                        <div className="z-10 mt-2 grid w-full grid-cols-2 gap-2">
                            <button
                                onClick={handleCollect}
                                className="luxe-skin-button col-span-2 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-bold uppercase tracking-[0.1em] shadow-lg transition-all hover:scale-105 active:scale-95"
                            >
                                <CheckIcon className="h-4 w-4" />
                                <span>OK</span>
                            </button>

                            <button
                                onClick={handleRecycle}
                                className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2 font-bold uppercase tracking-wider text-red-400 transition-all hover:bg-red-500/20"
                            >
                                <Trash2Icon className="h-3 w-3" />
                                <span className="text-[10px]">Reciclar</span>
                            </button>

                            <button
                                onClick={handleDonate}
                                className="flex items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2 font-bold uppercase tracking-wider text-blue-400 transition-all hover:bg-blue-500/20"
                            >
                                <ShareIcon className="h-3 w-3" />
                                <span className="text-[10px]">Doar</span>
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in" onClick={onClose}>
                <GlassCard
                    variant="neutral"
                    className="relative w-full max-w-xs overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl transition-all"
                    onClick={(event) => event.stopPropagation()}
                    style={{ borderColor: `${skinBorderColor}40`, borderWidth: '1px' }}
                >
                    <div className="absolute right-3 top-3 z-50">
                        <button onClick={onClose} className="rounded-full border border-white/10 bg-black/40 p-2 text-white/80 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white">
                            <XIcon className="h-4 w-4" />
                        </button>
                    </div>
                    {renderContent()}
                </GlassCard>
            </div>
        </Portal>
    );
};
