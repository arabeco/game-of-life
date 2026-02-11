import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { XIcon } from './Icons';
import { ChestType } from '../types';

interface ChestOpeningModalProps {
    chestType: ChestType;
    onClose: () => void;
}

const getChestStyle = (type: ChestType) => {
    switch (type) {
        case 'Raro': return { color: '#3b82f6', shadow: 'shadow-blue-500/50' };
        case 'Épico': return { color: '#a855f7', shadow: 'shadow-purple-500/50' };
        case 'Lendário': return { color: '#f59e0b', shadow: 'shadow-yellow-500/50' };
        default: return { color: 'gray', shadow: 'shadow-gray-500/50' };
    }
}

type Reward = { type: string; value: string | number; rarity: 'Comum' | 'Raro' | 'Épico' | 'Lendário' };

const getRandomReward = (type: ChestType): Reward => {
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

export const ChestOpeningModal: React.FC<ChestOpeningModalProps> = ({ chestType, onClose }) => {
    const [stage, setStage] = useState<'opening' | 'revealing' | 'revealed'>('opening');
    const [reward, setReward] = useState<Reward | null>(null);

    const chestStyle = getChestStyle(chestType);

    useEffect(() => {
        if (stage === 'opening') {
            const timer = setTimeout(() => {
                setStage('revealing');
            }, 2000); // 2s shaking animation
            return () => clearTimeout(timer);
        }
        if (stage === 'revealing') {
            setReward(getRandomReward(chestType));
            const timer = setTimeout(() => {
                setStage('revealed');
            }, 1000); // 1s flash animation
            return () => clearTimeout(timer);
        }
    }, [stage, chestType]);

    const renderContent = () => {
        switch (stage) {
            case 'opening':
                return (
                    <div className="flex flex-col items-center justify-center h-48">
                         <div className={`w-32 h-32 bg-gray-800 rounded-lg flex items-center justify-center animate-shake border-4 ${chestStyle.shadow}`} style={{borderColor: chestStyle.color}}>
                            <span className="text-6xl">?</span>
                        </div>
                        <p className="mt-4 animate-pulse">Abrindo baú {chestType}...</p>
                        <style>{`
                            @keyframes shake {
                                0%, 100% { transform: translateX(0); }
                                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                                20%, 40%, 60%, 80% { transform: translateX(5px); }
                            }
                            .animate-shake { animation: shake 1s infinite; }
                        `}</style>
                    </div>
                );
            case 'revealing':
                return (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-48 h-48 bg-white rounded-full animate-ping" style={{ backgroundColor: chestStyle.color }} />
                    </div>
                );
            case 'revealed':
                if (!reward) return null;
                return (
                    <div className="flex flex-col items-center justify-center text-center h-48 space-y-2">
                        <p className="text-xs font-bold" style={{color: chestStyle.color}}>{reward.rarity.toUpperCase()}</p>
                        <h3 className="text-2xl font-bold">{reward.type}</h3>
                        <p className="text-gray-300">{reward.value}</p>
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
                    <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-primary">
                        COLETAR
                    </button>
                )}
            </GlassCard>
        </div>
    );
};