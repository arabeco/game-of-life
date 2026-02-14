import React from 'react';
import { UserProfile } from '../types';
import { useGame } from '../contexts/GameContext';

export const SocialCard: React.FC<{ profile: UserProfile; subtitle?: string; actions?: React.ReactNode }> = ({ profile, subtitle, actions }) => {
    const { clan } = useGame();
    
    return (
        <div 
            className="h-24 rounded-3xl bg-cover bg-center relative p-3 flex items-center space-x-4 overflow-hidden border border-[var(--glass-border)]" 
            style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%), url(${profile.backgroundUrl})` }}
        >
            <div className="relative w-16 h-16 rounded-full border-4 bg-gray-800 flex-shrink-0" style={{ borderColor: 'var(--skin-accent-color)'}}>
                <div className="w-full h-full object-cover rounded-full overflow-hidden">
                    <img src={profile.avatarUrl} alt={profile.nickname} className="w-full h-full object-cover" />
                </div>
                {profile.isOnline && <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>}
            </div>
            <div className="flex-1">
                <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg">{profile.nickname}</h3>
                    {profile.bannerUrl && <img src={profile.bannerUrl} alt="Banner" className="h-6 object-contain" />}
                </div>
                <p className="text-sm text-gray-300">{subtitle ?? `Level ${profile.level} - ${clan?.name || 'Sem Clã'}`}</p>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
};
