import React from 'react';
import { UserProfile } from '../types';

import { UserAvatar } from './UserAvatar';

export const SocialCard: React.FC<{ profile: UserProfile; subtitle?: string; actions?: React.ReactNode; onClick?: () => void }> = ({ profile, subtitle, actions, onClick }) => {
    return (
        <div 
            className={`h-24 rounded-3xl bg-cover bg-center relative p-3 flex items-center space-x-4 overflow-hidden border border-[var(--glass-border)] group ${onClick ? 'cursor-pointer hover:border-white/30 transition-colors' : ''}`}
            style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%), url(${profile.backgroundUrl})` }}
            onClick={onClick}
        >
            <UserAvatar avatarUrl={profile.avatarUrl} nickname={profile.nickname} className="w-16 h-16" isOnline={false} level={profile.level} />
            
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-bold text-xl text-white leading-tight truncate">{profile.nickname}</h3>
                
                {profile.bannerUrl && (
                    <div className="mt-1 h-7 self-start">
                        <img 
                            src={profile.bannerUrl} 
                            alt="Banner" 
                            className="h-full object-contain drop-shadow-sm opacity-90 group-hover:opacity-100 transition-opacity" 
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-col items-end justify-center text-right pr-2 flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest opacity-60 mb-1">
                    {subtitle ? 'INFO' : (profile.clanName ? 'CLÃ' : '')}
                </span>
                <div className="text-xs text-gray-300 flex items-center gap-1.5 opacity-90 bg-black/20 px-2 py-1 rounded-lg border border-white/5">
                    {subtitle ?? (
                        <>
                            {profile.clanIcon && <span className="text-sm">{profile.clanIcon}</span>}
                            <span className="max-w-[80px] truncate font-medium">{profile.clanName || 'Sem Clã'}</span>
                        </>
                    )}
                </div>
            </div>

            {actions && <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>{actions}</div>}
        </div>
    );
};
