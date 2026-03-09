import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon, CheckIcon } from './Icons';
import { ChestType, ChestOpenResult } from '../types';
import { useGame } from '../contexts/GameContext';
import { SKINS_DATA } from '../constants';
import { VideoPlayer } from './VideoPlayer';
import { ItemDef, resolveItemDef } from '../constants/items';
import { useVideoStageTransition } from '../hooks/useVideoStageTransition';
import { getChestVisual, withAlpha } from '../constants/rarityVisuals';

interface ChestOpeningModalProps {
    chestType: ChestType;
    onClose: () => void;
    predefinedReward?: Reward;
}

interface Reward {
    type: string;
    value: string;
    rarity: string;
    itemDef?: ItemDef;
    fragmentsGained: number;
    isDuplicate?: boolean;
    description: string;
}

const CHEST_VIDEOS: Record<string, string> = {
    commum: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_common.mp4`,
    incomum: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_uncommon.mp4`,
    raro: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_rare.mp4`,
    epico: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_epic.mp4`,
    lendario: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_legendary.mp4`,
    Comum: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_common.mp4`,
    Incomum: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_uncommon.mp4`,
    Raro: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_rare.mp4`,
    ['\u00c9pico']: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_epic.mp4`,
    ['Lend\u00e1rio']: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_legendary.mp4`,
};

const buildRewardFromResult = (result: ChestOpenResult | null, chestType: ChestType): Reward => {
    if (!result) {
        return {
            type: 'Nada',
            value: 'Falha na abertura',
            rarity: chestType,
            fragmentsGained: 0,
            description: 'Nao foi possivel abrir este bau agora. Tente novamente.',
        };
    }

    const itemDef = result.itemId ? resolveItemDef(result.itemId) : undefined;
    const rewardType = itemDef?.category === 'skin'
        ? 'Skin'
        : itemDef?.category === 'insignia'
            ? 'Insignia'
            : itemDef
                ? 'Item'
                : 'Nada';

    return {
        type: rewardType,
        value: result.itemName || itemDef?.name || 'Recompensa',
        rarity: chestType,
        itemDef,
        fragmentsGained: result.fragmentsGained,
        isDuplicate: result.isDuplicate,
        description: result.isDuplicate
            ? `Recompensa repetida. ${result.fragmentsGained} Fragmentos creditados.`
            : `Arsenal sincronizado com ${result.fragmentsGained} Fragmentos adicionais.`,
    };
};

export const ChestOpeningModal: React.FC<ChestOpeningModalProps> = ({ chestType, onClose, predefinedReward }) => {
    const { userProfile, appMode, oraclePreferences, openChest } = useGame();
    const [reward, setReward] = useState<Reward | null>(null);
    const [isResolvingReward, setIsResolvingReward] = useState(false);

    useEffect(() => {
        const isGM = userProfile.role === 'gm' || userProfile.role === 'admin';
        if (appMode !== 'GAME' && !isGM) {
            onClose();
        }
    }, [appMode, onClose, userProfile.role]);

    const isGM = userProfile.role === 'gm' || userProfile.role === 'admin';
    if (appMode !== 'GAME' && !isGM) return null;

    const chestVisual = getChestVisual(chestType);
    const rarityColor = chestVisual.hex;
    const userSkin = SKINS_DATA.find((skin) => skin.id === userProfile.skin);
    const skinBorderColor = userSkin?.color || '#ffffff';
    const animationsEnabled = oraclePreferences?.animationsEnabled ?? true;
    const { showVideoStage, showContentStage, isVideoFading, triggerReveal } = useVideoStageTransition({
        enabled: animationsEnabled,
        revealDelayMs: 4000,
        fadeDurationMs: 320,
    });

    useEffect(() => {
        let cancelled = false;

        const loadReward = async () => {
            if (predefinedReward) {
                setReward(predefinedReward);
                return;
            }

            setIsResolvingReward(true);
            const result = await openChest(chestType);
            if (cancelled) return;
            setReward(buildRewardFromResult(result, chestType));
            setIsResolvingReward(false);
        };

        loadReward();

        return () => {
            cancelled = true;
        };
    }, [chestType, predefinedReward, openChest]);

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
                                style={{ backgroundColor: withAlpha(chestVisual.rgb, 0.3), filter: 'blur(20px)' }}
                            />
                            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-black/40 shadow-lg">
                                {reward.itemDef?.imageUrl ? (
                                    <img src={reward.itemDef.imageUrl} alt={reward.value} className="h-20 w-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]" />
                                ) : (
                                    <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                        {reward.itemDef?.icon || (reward.type === 'Skin' ? 'ðŸ‘•' : reward.type === 'Insignia' ? 'ðŸŽ–ï¸' : reward.type === 'Item' ? 'âš”ï¸' : 'ðŸŽ')}
                                    </span>
                                )}
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
                                {reward.description}
                            </p>
                        </div>

                        <div className="z-10 mt-2 grid w-full grid-cols-1 gap-2">
                            <button
                                onClick={onClose}
                                className="luxe-skin-button flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-bold uppercase tracking-[0.1em] shadow-lg transition-all hover:scale-105 active:scale-95"
                            >
                                <CheckIcon className="h-4 w-4" />
                                <span>Fechar</span>
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
                    {showContentStage && isResolvingReward && (
                        <div className="px-6 pb-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                            Sincronizando resultado real...
                        </div>
                    )}
                </GlassCard>
            </div>
        </Portal>
    );
};

