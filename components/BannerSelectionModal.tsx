import React from 'react';
import { GlassCard } from './GlassCard';
import { BANNERS_DATA, BANNER_UNLOCKS_BY_RANK } from '../constants';
import { useGame } from '../contexts/GameContext';

interface BannerSelectionModalProps {
    currentBanner: string;
    onClose: () => void;
    onSelect: (bannerUrl: string) => void;
}

export const BannerSelectionModal: React.FC<BannerSelectionModalProps> = ({ currentBanner, onClose, onSelect }) => {
    const { userProfile, nobilityRanks } = useGame();
    const unlockedSkins = userProfile.unlockedSkins || {};
    const unlockedItems = userProfile.unlockedItems || {};
    const isStaff = userProfile.role === 'admin' || userProfile.role === 'gm';
    
    const currentRankIndex = nobilityRanks.findIndex(rank => rank.id === userProfile.nobility.rankId);

    const isUnlockedByRank = (itemId: string, unlocksByRank: Record<string, string[]>) => {
        if (currentRankIndex === -1) return false;
        for (let i = 0; i <= currentRankIndex; i++) {
            const rankId = nobilityRanks[i].id;
            const items = unlocksByRank[rankId];
            if (items && items.includes(itemId)) return true;
        }
        return false;
    };

    const isBannerUnlocked = (banner: { id: string, url: string }) => {
        if (isStaff) return true;
        if (banner.url === currentBanner) return true;
        if (unlockedSkins[banner.id]) return true;
        if (unlockedItems.banners?.[banner.id]) return true;
        if (isUnlockedByRank(banner.id, BANNER_UNLOCKS_BY_RANK)) return true;
        return false;
    };

    const availableBanners = BANNERS_DATA.filter(isBannerUnlocked);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-center">Selecionar Banner</h2>
                <div className="grid grid-cols-1 gap-2 p-2 max-h-64 overflow-y-auto">
                    {availableBanners.map(banner => (
                        <button 
                            key={banner.id}
                            onClick={() => onSelect(banner.url)}
                            className={`p-2 rounded-lg overflow-hidden transition-all duration-200 ${currentBanner === banner.url ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : 'hover:bg-white/10'}`}
                        >
                            <img src={banner.url} alt={`Banner ${banner.name}`} className="w-full h-auto object-contain"/>
                        </button>
                    ))}
                </div>
                 <button onClick={onClose} className="w-full py-2 rounded-xl luxe-skin-button">
                    FECHAR
                </button>
            </GlassCard>
        </div>
    );
};
