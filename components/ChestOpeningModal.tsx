import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { XIcon } from './Icons';
import { ChestType, UnlockCategory } from '../types';
import { useGame } from '../contexts/GameContext';
import { GM_CONFIG, SKINS_DATA, SKIN_CHEST_POOL } from '../constants';
import { SOVEREIGN_ASSETS } from '../constants/avatar';

interface ChestOpeningModalProps {
    chestType: ChestType;
    onClose: () => void;
}

const getChestStyle = (type: ChestType) => {
    switch (type) {
        case 'Raro': return { color: '#CD7F32', shadow: 'shadow-orange-700/50' }; // Bronze
        case 'Épico': return { color: '#C0C0C0', shadow: 'shadow-gray-400/50' };   // Silver
        case 'Lendário': return { color: '#F0C843', shadow: 'shadow-yellow-500/50' }; // Gold
        default: return { color: '#9ca3af', shadow: 'shadow-gray-600/50' }; // Gray
    }
}

type Reward = { type: string; value: string | number; rarity: 'Comum' | 'Raro' | 'Épico' | 'Lendário' };

const ASSET_POOL: Record<UnlockCategory, { id: string; name: string }[]> = {
    bodyStyles: SOVEREIGN_ASSETS.bodyStyles,
    hairStyles: SOVEREIGN_ASSETS.hairStyles,
    outfits: SOVEREIGN_ASSETS.outfits,
    head_under_items: SOVEREIGN_ASSETS.head_under_items,
    helmets: SOVEREIGN_ASSETS.helmets,
    head_over_items: SOVEREIGN_ASSETS.head_over_items,
    artifacts: SOVEREIGN_ASSETS.artifacts,
};

const getRandomReward = (type: ChestType): Reward & { itemUnlock?: { category: UnlockCategory; itemId: string }; skinUnlock?: string } => {
    const poolConfig = GM_CONFIG.chestDrops.itemPool;
    const pool = poolConfig.categories.flatMap(category =>
        ASSET_POOL[category].filter(item => !poolConfig.excludeIds?.includes(item.id))
            .map(item => ({ category, itemId: item.id, name: item.name }))
    );
    if (pool.length > 0 && Math.random() < GM_CONFIG.chestDrops.itemDropChanceByChest[type]) {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        return { type: 'Item', value: picked.name, rarity: type, itemUnlock: { category: picked.category, itemId: picked.itemId } };
    }
    const skinDropChance = GM_CONFIG.chestDrops.skinDropChanceByChest?.[type] ?? 0;
    const skinPool = SKINS_DATA.filter(skin => SKIN_CHEST_POOL.includes(skin.id));
    if (skinPool.length > 0 && Math.random() < skinDropChance) {
        const pickedSkin = skinPool[Math.floor(Math.random() * skinPool.length)];
        return { type: 'Skin', value: pickedSkin.name, rarity: type, skinUnlock: pickedSkin.id };
    }
    const rewards: Omit<Reward, 'rarity'>[] = [
        { type: 'EXP', value: 100 },
        { type: 'Conselho', value: 'A disciplina é a ponte entre metas e realizações.' },
        { type: 'Nada', value: 'O baú estava vazio.' },
    ];

    if (type === 'Raro' || type === 'Épico' || type === 'Lendário') {
        rewards.push({ type: 'EXP', value: 500 });
        rewards.push({ type: 'Artefato', value: 'Fragmento de Égide' });
    }
    if (type === 'Épico' || type === 'Lendário') {
        rewards.push({ type: 'EXP', value: 2000 });
        rewards.push({ type: 'Borda', value: 'Borda Estelar' });
    }
    if (type === 'Lendário') {
        rewards.push({ type: 'Banner', value: 'Estandarte do Soberano' });
        rewards.push({ type: 'Artefato', value: 'Lâmina do Infinito' });
    }
    
    const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
    const rarity = type; // For simplicity, reward rarity matches chest rarity

    return { ...randomReward, rarity };
};

const RARITY_COLORS: Record<string, string> = {
    'Comum': '#9ca3af',
    'Incomum': '#FFFFFF',
    'Raro': '#CD7F32',
    'Épico': '#C0C0C0',
    'Lendário': '#F0C843'
};

export const ChestOpeningModal: React.FC<ChestOpeningModalProps> = ({ chestType, onClose }) => {
    const [stage, setStage] = useState<'shaking' | 'exploding' | 'revealed'>('shaking');
    const [reward, setReward] = useState<Reward | null>(null);
    const { grantUserUnlock, updateUserProfile, userProfile } = useGame();

    const chestStyle = getChestStyle(chestType);
    const rarityColor = RARITY_COLORS[chestType] || RARITY_COLORS['Comum'];

    useEffect(() => {
        // Calculate reward immediately
        setReward(getRandomReward(chestType));

        // Sequence:
        // 0-800ms: Shaking (controlled by initial state)
        // 800ms: Explode
        // 1300ms: Reveal
        
        const timer1 = setTimeout(() => {
            setStage('exploding');
        }, 1500);

        const timer2 = setTimeout(() => {
            setStage('revealed');
        }, 2000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [chestType]);

    const handleCollect = () => {
        const rewardValue = reward as (Reward & { itemUnlock?: { category: UnlockCategory; itemId: string }; skinUnlock?: string }) | null;
        if (rewardValue?.itemUnlock) {
            grantUserUnlock(rewardValue.itemUnlock.category, rewardValue.itemUnlock.itemId);
        }
        if (rewardValue?.skinUnlock) {
            const nextUnlockedSkins = { ...(userProfile.unlockedSkins || {}), [rewardValue.skinUnlock]: true };
            updateUserProfile({ unlockedSkins: nextUnlockedSkins });
        }
        onClose();
    };

    const renderContent = () => {
        switch (stage) {
            case 'shaking':
                return (
                    <div className="flex flex-col items-center justify-center h-64 relative">
                         <div className={`w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center animate-shake border-4 ${chestStyle.shadow}`} style={{borderColor: chestStyle.color}}>
                            <span className="text-6xl">?</span>
                        </div>
                        <p className="mt-8 text-gray-400 font-medium">Abrindo...</p>
                    </div>
                );
            case 'exploding':
                return (
                    <div className="flex items-center justify-center h-64 relative overflow-hidden">
                        <div 
                            className="absolute inset-0 animate-pulse-fast" 
                            style={{ 
                                background: `radial-gradient(circle, ${rarityColor}40 0%, transparent 70%)` 
                            }} 
                        />
                        <div 
                            className="w-4 h-4 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-ping"
                            style={{ backgroundColor: rarityColor, boxShadow: `0 0 40px ${rarityColor}` }}
                        />
                        {/* Particles */}
                        {[...Array(8)].map((_, i) => (
                            <div 
                                key={i}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                    backgroundColor: rarityColor,
                                    top: '50%',
                                    left: '50%',
                                    '--rot': `${i * 45}deg`,
                                    animation: `particle-explode 0.5s ease-out forwards`
                                } as React.CSSProperties}
                            />
                        ))}
                    </div>
                );
            case 'revealed':
                if (!reward) return null;
                return (
                    <div className="flex flex-col items-center justify-center text-center h-64 space-y-4 animate-fade-in-up">
                        {/* Rarity Glow Behind */}
                        <div 
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 -z-10"
                            style={{ backgroundColor: rarityColor }}
                        />
                        
                        <div className="relative">
                            <h3 className="text-3xl font-bold tracking-wider" style={{ color: rarityColor }}>
                                {reward.value}
                            </h3>
                             {/* Rarity Dot with Pulse */}
                             <div 
                                className="absolute -top-3 -right-3 w-3 h-3 rounded-full animate-pulse"
                                style={{ 
                                    backgroundColor: rarityColor,
                                    boxShadow: `0 0 10px ${rarityColor}`
                                }} 
                            />
                        </div>
                        
                        <div className="flex flex-col items-center space-y-1">
                            <span 
                                className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded border border-white/10"
                                style={{ color: rarityColor, borderColor: `${rarityColor}40` }}
                            >
                                {reward.rarity}
                            </span>
                            <span className="text-sm text-gray-400">{reward.type}</span>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-end">
                     <button onClick={onClose} className="p-1 rounded-full bg-black/20 hover:bg-black/50"><XIcon className="w-5 h-5"/></button>
                </div>
                {renderContent()}
                {stage === 'revealed' && (
                    <button onClick={handleCollect} className="w-full py-2 rounded-xl luxe-skin-button">
                        COLETAR
                    </button>
                )}
            </GlassCard>
        </div>
    );
};
