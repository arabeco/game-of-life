import React, { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { DEFAULT_SOVEREIGN_CONFIG } from '../constants/avatar';
import { SovereignConfig } from '../types';
import { GlassCard } from './GlassCard';
import { CanvasAvatar } from './CanvasAvatar';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { SOVEREIGN_ASSETS } from '../constants/avatar';
import { GM_CONFIG } from '../constants';

interface SovereignEditorModalProps {
    onClose: () => void;
    onSave: (newConfig: SovereignConfig) => void;
}

type Category = 'Corpo' | 'Cabelo' | 'Roupa' | 'Elmo' | 'Rosto' | 'Topo' | 'Artefato';

const OptionSelector: React.FC<{ label: string; value: string; onPrev: () => void; onNext: () => void; }> = ({ label, value, onPrev, onNext }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <div className="flex items-center space-x-2">
            <button onClick={onPrev} className="p-1 bg-black/20 rounded-full"><ChevronLeftIcon className="w-5 h-5" /></button>
            <span className="text-sm w-24 text-center truncate">{value}</span>
            <button onClick={onNext} className="p-1 bg-black/20 rounded-full"><ChevronRightIcon className="w-5 h-5" /></button>
        </div>
    </div>
);

const ColorPalette: React.FC<{ colors: readonly string[]; selectedColor: string; onSelect: (color: string) => void; }> = ({ colors, selectedColor, onSelect }) => (
    <div className="grid grid-cols-7 gap-2">
        {colors.map(color => (
            <button
                key={color}
                onClick={() => onSelect(color)}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
            />
        ))}
    </div>
);

export const SovereignEditorModal: React.FC<SovereignEditorModalProps> = ({ onClose, onSave }) => {
    const { userProfile, levelUnlocks, nobilityRanks } = useGame();
    const [tempSovereign, setTempSovereign] = useState<SovereignConfig>(() => {
        const baseConfig = userProfile.sovereign || DEFAULT_SOVEREIGN_CONFIG;
        const oldAccessory = (baseConfig as any).accessory;

        const newConfig: SovereignConfig = {
            ...DEFAULT_SOVEREIGN_CONFIG,
            ...baseConfig,
        };

        // Migrate old accessory if new fields are not set
        if (oldAccessory && oldAccessory !== 'none') {
            if (['glasses', 'eyepatch'].includes(oldAccessory) && newConfig.head_under === 'none') {
                 newConfig.head_under = oldAccessory;
            }
        }
        
        delete (newConfig as any).accessory;

        return newConfig;
    });
    const [activeCategory, setActiveCategory] = useState<Category>('Corpo');

    const itemUnlockBasis = ((GM_CONFIG as any)?.unlocks?.itemUnlockBasis === 'nobility' ? 'nobility' : 'level') as 'level' | 'nobility';
    const userUnlockValue = itemUnlockBasis === 'nobility'
        ? Math.max(1, nobilityRanks.findIndex(rank => rank.id === userProfile.nobility.rankId) + 1)
        : userProfile.level;

    const getAllowedItems = (category: 'bodyStyles' | 'hairStyles' | 'outfits' | 'head_under_items' | 'helmets' | 'head_over_items' | 'artifacts') => {
        const items = SOVEREIGN_ASSETS[category];
        const unlockMap = levelUnlocks[category] || {};
        const userUnlocks = userProfile.unlockedItems?.[category] || {};
        const allowed = items.filter(item => (unlockMap[item.id] ?? 1) <= userUnlockValue || userUnlocks[item.id]);
        return allowed;
    };

    const getFirstAllowedId = (category: 'bodyStyles' | 'hairStyles' | 'outfits' | 'head_under_items' | 'helmets' | 'head_over_items' | 'artifacts') => {
        const allowed = getAllowedItems(category);
        return allowed[0]?.id || 'none';
    };

    useEffect(() => {
        setTempSovereign(prev => ({
            ...prev,
            body: getAllowedItems('bodyStyles').some(i => i.id === prev.body) ? prev.body : getFirstAllowedId('bodyStyles'),
            hairStyle: getAllowedItems('hairStyles').some(i => i.id === prev.hairStyle) ? prev.hairStyle : getFirstAllowedId('hairStyles'),
            outfit: getAllowedItems('outfits').some(i => i.id === prev.outfit) ? prev.outfit : getFirstAllowedId('outfits'),
            head_under: getAllowedItems('head_under_items').some(i => i.id === prev.head_under) ? prev.head_under : getFirstAllowedId('head_under_items'),
            helmet: getAllowedItems('helmets').some(i => i.id === prev.helmet) ? prev.helmet : getFirstAllowedId('helmets'),
            head_over: getAllowedItems('head_over_items').some(i => i.id === prev.head_over) ? prev.head_over : getFirstAllowedId('head_over_items'),
            artifact: getAllowedItems('artifacts').some(i => i.id === prev.artifact) ? prev.artifact : getFirstAllowedId('artifacts'),
        }));
    }, [levelUnlocks, userProfile.level, userProfile.unlockedItems, userProfile.nobility.rankId, nobilityRanks.length, itemUnlockBasis, userUnlockValue]);

    const handleSave = () => {
        onSave(tempSovereign);
    };

    const createCycleHandler = (category: 'bodyStyles' | 'hairStyles' | 'outfits' | 'head_under_items' | 'helmets' | 'head_over_items' | 'artifacts', currentId: string, direction: 1 | -1) => {
        const items = getAllowedItems(category);
        const currentIndex = items.findIndex(item => item.id === currentId);
        const nextIndex = (currentIndex + direction + items.length) % items.length;
        const newItemId = items[nextIndex]?.id || currentId;
        
        let key: keyof SovereignConfig;
        switch (category) {
            case 'bodyStyles': key = 'body'; break;
            case 'hairStyles': key = 'hairStyle'; break;
            case 'outfits': key = 'outfit'; break;
            case 'artifacts': key = 'artifact'; break;
            case 'head_under_items': key = 'head_under'; break;
            case 'helmets': key = 'helmet'; break;
            case 'head_over_items': key = 'head_over'; break;
        }

        setTempSovereign(prev => ({ ...prev, [key]: newItemId }));
    };

    const renderOptions = () => {
        switch (activeCategory) {
            case 'Corpo':
                const currentBody = SOVEREIGN_ASSETS.bodyStyles.find(b => b.id === tempSovereign.body)?.name || 'N/A';
                return (
                    <div className="space-y-4">
                        <OptionSelector label="Modelo" value={currentBody} onPrev={() => createCycleHandler('bodyStyles', tempSovereign.body, -1)} onNext={() => createCycleHandler('bodyStyles', tempSovereign.body, 1)} />
                        <div>
                            <label className="text-xs font-semibold text-gray-400">Tom de Pele</label>
                            <ColorPalette colors={SOVEREIGN_ASSETS.skinTones} selectedColor={tempSovereign.skinTone} onSelect={color => setTempSovereign(p => ({ ...p, skinTone: color }))} />
                        </div>
                    </div>
                );
            case 'Cabelo':
                const currentHair = SOVEREIGN_ASSETS.hairStyles.find(h => h.id === tempSovereign.hairStyle)?.name || 'N/A';
                return (
                     <div className="space-y-4">
                        <OptionSelector label="Estilo" value={currentHair} onPrev={() => createCycleHandler('hairStyles', tempSovereign.hairStyle, -1)} onNext={() => createCycleHandler('hairStyles', tempSovereign.hairStyle, 1)} />
                         <div>
                            <label className="text-xs font-semibold text-gray-400">Cor</label>
                            <ColorPalette colors={SOVEREIGN_ASSETS.hairColors} selectedColor={tempSovereign.hairColor} onSelect={color => setTempSovereign(p => ({ ...p, hairColor: color }))} />
                         </div>
                    </div>
                );
            case 'Roupa':
                 const currentOutfit = SOVEREIGN_ASSETS.outfits.find(o => o.id === tempSovereign.outfit)?.name || 'N/A';
                 return <OptionSelector label="Traje" value={currentOutfit} onPrev={() => createCycleHandler('outfits', tempSovereign.outfit, -1)} onNext={() => createCycleHandler('outfits', tempSovereign.outfit, 1)} />
            case 'Elmo':
                const currentHelmet = SOVEREIGN_ASSETS.helmets.find(h => h.id === tempSovereign.helmet)?.name || 'Nenhum';
                return <OptionSelector label="Elmo" value={currentHelmet} onPrev={() => createCycleHandler('helmets', tempSovereign.helmet, -1)} onNext={() => createCycleHandler('helmets', tempSovereign.helmet, 1)} />;
            case 'Rosto':
                const currentHeadUnder = SOVEREIGN_ASSETS.head_under_items.find(h => h.id === tempSovereign.head_under)?.name || 'Nenhum';
                return <OptionSelector label="Acessório" value={currentHeadUnder} onPrev={() => createCycleHandler('head_under_items', tempSovereign.head_under, -1)} onNext={() => createCycleHandler('head_under_items', tempSovereign.head_under, 1)} />;
            case 'Topo':
                const currentHeadOver = SOVEREIGN_ASSETS.head_over_items.find(h => h.id === tempSovereign.head_over)?.name || 'Nenhum';
                return <OptionSelector label="Acessório" value={currentHeadOver} onPrev={() => createCycleHandler('head_over_items', tempSovereign.head_over, -1)} onNext={() => createCycleHandler('head_over_items', tempSovereign.head_over, 1)} />;
            case 'Artefato':
                 const currentArtifact = SOVEREIGN_ASSETS.artifacts.find(a => a.id === tempSovereign.artifact)?.name || 'Nenhum';
                 return <OptionSelector label="Artefato" value={currentArtifact} onPrev={() => createCycleHandler('artifacts', tempSovereign.artifact, -1)} onNext={() => createCycleHandler('artifacts', tempSovereign.artifact, 1)} />
            default:
                return null;
        }
    };
    
    const categories: Category[] = ['Corpo', 'Cabelo', 'Roupa', 'Elmo', 'Rosto', 'Topo', 'Artefato'];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Editor de Soberano</h2>
                
                <div className="w-48 h-64 mx-auto dossier-bg border border-[#4a3a11] rounded-2xl overflow-hidden flex items-center justify-center">
                    <CanvasAvatar 
                        sovereignConfig={tempSovereign} 
                        width={300} 
                        height={300} 
                        className="w-full h-full object-contain"
                    />
                </div>

                <div className="bg-black/20 p-1 rounded-2xl flex justify-around flex-wrap">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 text-xs rounded-xl ${activeCategory === cat ? 'bg-white/20' : ''}`}>
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="p-2 min-h-[80px]">
                    {renderOptions()}
                </div>

                <div className="flex space-x-2 pt-2">
                    <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-secondary">
                        CANCELAR
                    </button>
                    <button onClick={handleSave} className="w-full py-2 rounded-xl luxe-button-primary">
                        SALVAR
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};
