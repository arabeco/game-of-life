import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon, Trash2Icon, ShareIcon, CheckIcon } from './Icons';
import { ChestType, UnlockCategory, ItemRarity } from '../types';
import { useGame } from '../contexts/GameContext';
import { GM_CONFIG, SKINS_DATA, SKIN_CHEST_POOL } from '../constants';
import { SOVEREIGN_ASSETS } from '../constants/avatar';
import { VideoPlayer } from './VideoPlayer';
import { ItemDef, ITEMS_DB } from '../constants/items';

interface ChestOpeningModalProps {
    chestType: ChestType;
    onClose: () => void;
    predefinedReward?: any; // For testing/forcing a specific reward
}

interface Reward {
    type: string;
    value: string;
    rarity: string;
    itemUnlock?: { category: UnlockCategory; itemId: string };
    skinUnlock?: string;
}

type Stage = 'video' | 'reward';

const getRandomReward = (chestType: ChestType): Reward => {
    const rarityMap: Record<string, ItemRarity> = {
        'Comum': 'common',
        'Incomum': 'uncommon',
        'Raro': 'rare',
        'Épico': 'epic',
        'Lendário': 'legendary',
        'Ciclo': 'rare', // Cycle chests give rare items for now
        // Fallbacks for lowercase or typos
        'comum': 'common',
        'incomum': 'uncommon',
        'raro': 'rare',
        'épico': 'epic',
        'epico': 'epic',
        'lendário': 'legendary',
        'lendario': 'legendary',
        'commum': 'common'
    };

    const targetRarity = rarityMap[chestType] || 'common';
    const pool = ITEMS_DB.filter(item => item.rarity === targetRarity);

    if (pool.length === 0) {
        return {
            type: 'Nada',
            value: 'Vazio',
            rarity: chestType
        };
    }

    const randomItem = pool[Math.floor(Math.random() * pool.length)];

    const getUnlockCategory = (category: string): UnlockCategory | null => {
        const map: Record<string, UnlockCategory> = {
            'skin': 'skins',
            'hair': 'hairStyles',
            'border': 'borders',
            'banner': 'banners',
            'glyph': 'glyphs',
            'aura': 'auras',
            'ui_skin': 'skins',
            'artifact': 'artifacts',
            'orb': 'orbs',
            'plate': 'plates'
        };
        return map[category] || null;
    };

    const unlockCategory = getUnlockCategory(randomItem.category);

    return {
        type: randomItem.category === 'skin' ? 'Skin' : 'Item',
        value: randomItem.name,
        rarity: chestType,
        itemUnlock: unlockCategory ? { category: unlockCategory, itemId: randomItem.id } : undefined,
        skinUnlock: (randomItem.category === 'skin' || randomItem.category === 'ui_skin') ? randomItem.id : undefined
    };
};

const CHEST_VIDEOS: Record<string, string> = {
    'commum': `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_common.mp4`,
    'incomum': `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_uncommon.mp4`,
    'raro': `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_rare.mp4`,
    'epico': `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_epic.mp4`,
    'lendario': `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_legendary.mp4`,
    // Map capitalized keys just in case
    'Comum': `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_common.mp4`,
    'Incomum': `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_uncommon.mp4`,
    'Raro': `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_rare.mp4`,
    'Épico': `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_epic.mp4`,
    'Lendário': `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/chest_legendary.mp4`,
};

const RARITY_COLORS: Record<string, string> = {
    'Comum': '#A0522D', // Marrom
    'Incomum': '#C0C0C0', // Prata
    'Raro': '#FFD700', // Ouro
    'Épico': '#3B82F6', // Azul
    'Lendário': '#A855F7', // Roxo
    'Ciclo': '#FFD700', // Ouro (same as Rare)
};

export const ChestOpeningModal: React.FC<ChestOpeningModalProps> = ({ chestType, onClose, predefinedReward }) => {
    const { userProfile, grantUserUnlock, updateUserProfile, oraclePreferences } = useGame();
    const [stage, setStage] = useState<Stage>('video');
    const [reward, setReward] = useState<any>(predefinedReward || null);

    const rarityColor = RARITY_COLORS[chestType] || RARITY_COLORS['Comum'];
    
    // Get user skin color for border
    const userSkinId = userProfile.skin;
    const userSkin = SKINS_DATA.find(s => s.id === userSkinId);
    const skinBorderColor = userSkin?.color || '#ffffff'; // Fallback to white

    useEffect(() => {
        // Use predefined reward or calculate random one
        setReward(predefinedReward || getRandomReward(chestType));

        const animationsEnabled = oraclePreferences?.animationsEnabled ?? true;

        if (animationsEnabled) {
            setStage('video');
            // Force end video after 4 seconds as requested
            const timer = setTimeout(() => {
                setStage('revealed');
            }, 4000);
            return () => clearTimeout(timer);
        } else {
            setStage('revealed');
        }
    }, [chestType, oraclePreferences?.animationsEnabled, predefinedReward]);

    // ... (keep sound effect)

    const handleCollect = () => {
        if (!predefinedReward) {
            const rewardValue = reward as (Reward & { itemUnlock?: { category: UnlockCategory; itemId: string }; skinUnlock?: string }) | null;
            if (rewardValue?.itemUnlock) {
                grantUserUnlock(rewardValue.itemUnlock.category, rewardValue.itemUnlock.itemId);
            }
            if (rewardValue?.skinUnlock) {
                const nextUnlockedSkins = { ...(userProfile.unlockedSkins || {}), [rewardValue.skinUnlock]: true };
                updateUserProfile({ unlockedSkins: nextUnlockedSkins });
            }
        }
        onClose();
    };

    const handleRecycle = () => {
        const confirm = window.confirm(`Tem certeza que deseja reciclar ${reward?.value}? (Simulação)`);
        if (confirm) {
            alert(`Você reciclou ${reward?.value}!`);
            onClose();
        }
    };

    const handleDonate = () => {
        alert(`Você doou ${reward?.value}! (Simulação)`);
        // Logic to donate would go here
    };

    const renderContent = () => {
        switch (stage) {
            case 'video':
                return (
                    <div className="relative aspect-[9/16] w-full bg-black rounded-t-3xl overflow-hidden">
                        <VideoPlayer 
                            src={CHEST_VIDEOS[chestType]}
                            onEnd={() => setStage('revealed')}
                            className="w-full h-full object-cover"
                            placeholderLabel={`Opening ${chestType} Chest...`}
                            duration={4000}
                        />
                    </div>
                );
            case 'shaking': // Fallback if needed
            case 'exploding':
                return null; 
            case 'revealed':
                if (!reward) return null;
                
                // Determine visuals based on reward type
                // If it's an item/skin, we might want an image. 
                // For now, using the text/icon representation similar to ItemDetailModal but simplified if no image available.
                
                return (
                    <div className={`flex flex-col items-center p-6 gap-4 animate-fade-in-up w-full`}>
                         {/* Item Image/Icon with Glow */}
                        <div className="relative z-10 group mt-2">
                            <div className={`absolute inset-0 bg-gradient-to-tr from-${rarityColor}/20 to-transparent rounded-full blur-xl opacity-50`} 
                                 style={{ backgroundColor: rarityColor, opacity: 0.3, filter: 'blur(20px)' }}
                            />
                            <div className="w-24 h-24 rounded-2xl flex items-center justify-center relative z-10 bg-black/40 border border-white/10 shadow-lg">
                                {/* If we had imageUrl, use it. Else use generic icon/text */}
                                <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                    {reward.type === 'Item' ? '⚔️' : 
                                     reward.type === 'Skin' ? '👕' : 
                                     reward.type === 'EXP' ? '✨' : '🎁'}
                                </span>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="text-center space-y-1 z-10 w-full">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest drop-shadow-lg" style={{ color: rarityColor }}>
                                {reward.value}
                            </h2>
                            <div className="flex justify-center">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-white/10 bg-black/40 backdrop-blur-sm shadow-lg"
                                      style={{ color: rarityColor, borderColor: `${rarityColor}40` }}>
                                    {reward.rarity}
                                </span>
                            </div>
                            <div className="h-px w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto my-3" />
                            <p className="text-xs text-white/60 px-2">
                                {reward.type === 'Conselho' ? 'Um conselho para sua jornada.' : 
                                 reward.type === 'Nada' ? 'Melhor sorte na próxima vez.' :
                                 `Uma recompensa ${reward.rarity} para sua coleção.`}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="w-full grid grid-cols-2 gap-2 z-10 mt-2">
                            <button 
                                onClick={handleCollect}
                                className="col-span-2 py-3 rounded-xl font-bold uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
                                style={{ backgroundColor: `${rarityColor}20`, border: `1px solid ${rarityColor}`, color: rarityColor }}
                            >
                                <CheckIcon className="w-4 h-4" />
                                <span>OK</span>
                            </button>
                            
                            <button 
                                onClick={handleRecycle}
                                className="py-2 rounded-xl bg-red-500/10 text-red-400 font-bold uppercase tracking-wider border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2Icon className="w-3 h-3" />
                                <span className="text-[10px]">Reciclar</span>
                            </button>
                            
                            <button 
                                onClick={handleDonate}
                                className="py-2 rounded-xl bg-blue-500/10 text-blue-400 font-bold uppercase tracking-wider border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <ShareIcon className="w-3 h-3" />
                                <span className="text-[10px]">Doar</span>
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
                {/* Reduced width to max-w-xs (approx 320px) as requested "30% menos" */}
                <GlassCard 
                    variant="neutral" 
                    className="w-full max-w-xs rounded-3xl overflow-hidden relative shadow-2xl transform transition-all bg-zinc-900" 
                    onClick={e => e.stopPropagation()}
                    style={{ borderColor: `${skinBorderColor}40`, borderWidth: '1px' }}
                >
                <div className="absolute top-3 right-3 z-50">
                     <button onClick={onClose} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-all backdrop-blur-md border border-white/10">
                        <XIcon className="w-4 h-4"/>
                    </button>
                </div>
                {renderContent()}
                </GlassCard>
            </div>
        </Portal>
    );
};
