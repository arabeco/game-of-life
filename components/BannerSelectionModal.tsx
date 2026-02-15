import React from 'react';
import { GlassCard } from './GlassCard';
import { BANNERS_DATA } from '../constants';
import { useGame } from '../contexts/GameContext';

interface BannerSelectionModalProps {
    currentBanner: string;
    onClose: () => void;
    onSelect: (bannerUrl: string) => void;
}

export const BannerSelectionModal: React.FC<BannerSelectionModalProps> = ({ currentBanner, onClose, onSelect }) => {
    const { userProfile } = useGame();
    const isStaff = userProfile.role === 'admin' || userProfile.role === 'gm';
    const availableBanners = isStaff
        ? BANNERS_DATA
        : BANNERS_DATA.filter(banner => banner.url === userProfile.bannerUrl);
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
                 <button onClick={onClose} className="w-full py-2 rounded-xl luxe-button-primary">
                    FECHAR
                </button>
            </GlassCard>
        </div>
    );
};
