import React from 'react';
import { UserProfile } from '../types';
import { useGame } from '../contexts/GameContext';

import { UserAvatar } from './UserAvatar';

export const SocialCard: React.FC<{ profile: UserProfile; subtitle?: string; actions?: React.ReactNode; onClick?: () => void }> = ({ profile, subtitle, actions, onClick }) => {
    return (
        <div 
            className={`h-24 rounded-3xl bg-cover bg-center relative p-3 flex items-center space-x-4 overflow-hidden border border-[var(--glass-border)] ${onClick ? 'cursor-pointer hover:border-white/30 transition-colors' : ''}`}
            style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%), url(${profile.backgroundUrl})` }}
            onClick={onClick}
        >
            <UserAvatar avatarUrl={profile.avatarUrl} nickname={profile.nickname} className="w-16 h-16" isOnline={profile.isOnline} />
            <div className="flex-1">
                <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg">{profile.nickname}</h3>
                    {profile.bannerUrl && <img src={profile.bannerUrl} alt="Banner" className="h-6 object-contain" />}
                </div>
                <p className="text-sm text-gray-300">{subtitle ?? `Level ${profile.level} - ${profile.clanIcon ? profile.clanIcon + ' ' : ''}${profile.clanName || 'Sem Clã'}`}</p>
            </div>
            {actions && <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>{actions}</div>}
        </div>
    );
};
