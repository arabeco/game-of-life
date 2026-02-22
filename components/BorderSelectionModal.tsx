import React from 'react';
import { GlassCard } from './GlassCard';
import { SKINS_DATA, BORDERS_DATA, SKIN_UNLOCKS_BY_RANK, SKIN_SEASON_UNLOCKS, BORDER_UNLOCKS_BY_RANK } from '../constants';
import { useGame } from '../contexts/GameContext';
import { Skin } from '../types';

interface BorderSelectionModalProps {
    currentBorder: string;
    onClose: () => void;
    onSelect: (borderId: string) => void;
}

export const BorderSelectionModal: React.FC<BorderSelectionModalProps> = ({ currentBorder, onClose, onSelect }) => {
    const { userProfile, nobilityRanks } = useGame();
    const unlockedSkins = userProfile.unlockedSkins || {};
    const unlockedItems = userProfile.unlockedItems || {};
    const completedSeasonMissions = userProfile.completedSeasonMissions || [];
    const currentRankIndex = nobilityRanks.findIndex(rank => rank.id === userProfile.nobility.rankId);
    const rankIndexFor = (rankId: string) => nobilityRanks.findIndex(rank => rank.id === rankId);
    const isRankAtLeast = (rankId: string) => currentRankIndex >= rankIndexFor(rankId);
    const isStaff = userProfile.role === 'admin' || userProfile.role === 'gm';

    const isUnlockedByRank = (itemId: string, unlocksByRank: Record<string, string[]>) => {
        if (currentRankIndex === -1) return false;
        for (let i = 0; i <= currentRankIndex; i++) {
            const rankId = nobilityRanks[i].id;
            const items = unlocksByRank[rankId];
            if (items && items.includes(itemId)) return true;
        }
        return false;
    };

    const isSkinUnlocked = (skinId: string) => {
        if (isStaff) return true;
        if (userProfile.skin === skinId) return true;
        if (unlockedSkins[skinId]) return true;
        if (unlockedItems.skins?.[skinId]) return true;
        if (isUnlockedByRank(skinId, SKIN_UNLOCKS_BY_RANK)) return true;
        const seasonMissionIds = SKIN_SEASON_UNLOCKS[skinId] || [];
        return seasonMissionIds.some(missionId => completedSeasonMissions.includes(missionId));
    };

    const isBorderUnlocked = (borderId: string) => {
        if (isStaff) return true;
        if (userProfile.border === borderId) return true;
        if (unlockedItems.borders?.[borderId]) return true;
        
        // Also check generalized unlock
        const isUnlockedAnywhere = Object.values(unlockedItems).some(categoryItems => categoryItems && categoryItems[borderId]);
        if (isUnlockedAnywhere) return true;

        // Check inventory (New Forge System)
        if (userProfile.inventory?.some(item => item.id === borderId)) return true;

        if (isUnlockedByRank(borderId, BORDER_UNLOCKS_BY_RANK)) return true;
        return false;
    };
    const availableSkins = SKINS_DATA.filter(skin => isSkinUnlocked(skin.id));
    const availableBorders = BORDERS_DATA.filter(border => isBorderUnlocked(border.id));
    const allBorders = [
        { id: 'default', name: 'Padrão', color: 'var(--skin-accent-color)' }, 
        ...availableSkins, 
        ...availableBorders
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Selecionar Borda</h2>
                <div className="grid grid-cols-3 gap-4 p-4">
                    {allBorders.map(border => (
                        <div key={border.id} className="text-center space-y-2">
                            <button 
                                onClick={() => onSelect(border.id)}
                                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${currentBorder === border.id ? 'ring-4 ring-offset-2 ring-offset-gray-800' : ''}`}
                                style={
                                    border.imageUrl
                                    ? {
                                        border: '4px solid transparent', // Fallback for image border
                                        backgroundImage: `url(${border.imageUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        '--tw-ring-color': border.color,
                                    } as React.CSSProperties
                                    : {
                                        borderColor: border.color,
                                        borderWidth: '8px',
                                        '--tw-ring-color': border.color,
                                    } as React.CSSProperties
                                }
                            >
                            </button>
                            <p className="text-xs font-semibold">{border.name}</p>
                        </div>
                    ))}
                </div>
                 <button onClick={onClose} className="w-full py-2 rounded-xl luxe-skin-button">
                    FECHAR
                </button>
            </GlassCard>
        </div>
    );
};
