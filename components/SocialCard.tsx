import React from 'react';
import { UserProfile } from '../types';

import { UserAvatar } from './UserAvatar';

export const SocialCard: React.FC<{ profile: UserProfile; subtitle?: string; actions?: React.ReactNode; onClick?: () => void }> = ({ profile, subtitle, actions, onClick }) => {
    return (
        <div 
            className={`h-16 rounded-3xl bg-cover bg-center relative px-3 py-0.5 flex items-center space-x-3 overflow-hidden border border-[var(--glass-border)] group ${onClick ? 'cursor-pointer hover:border-white/30 transition-colors' : ''}`}
            style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%), url(${profile.backgroundUrl})` }}
            onClick={onClick}
        >
            <UserAvatar avatarUrl={profile.avatarUrl} nickname={profile.nickname} className="w-12 h-12" isOnline={false} level={profile.level} />
            
            <div className="flex-1 min-w-0 flex flex-col justify-center -space-y-0.5">
                <h3 className="font-bold text-lg text-white leading-tight truncate">{profile.nickname}</h3>
                
                {profile.bannerUrl && (
                    <div className="mt-0.5 h-6 self-start">
                        <img 
                            src={profile.bannerUrl} 
                            alt="Banner" 
                            className="h-full object-contain drop-shadow-sm opacity-90 group-hover:opacity-100 transition-opacity" 
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-col items-end justify-center text-right pr-2 flex-shrink-0">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest opacity-60 mb-0.5">
                    {subtitle ? 'INFO' : (profile.clanName ? 'CLÃ' : '')}
                </span>
                <div className="text-[10px] text-gray-300 flex items-center gap-1 opacity-90 bg-black/20 px-1.5 py-0.5 rounded-md border border-white/5">
                    {subtitle ?? (
                        <>
                            {profile.clanIcon && <span className="text-xs">{profile.clanIcon}</span>}
                            <span className="max-w-[70px] truncate font-medium">{profile.clanName || 'Sem Clã'}</span>
                        </>
                    )}
                </div>
            </div>

            {actions && <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>{actions}</div>}
        </div>
    );
};
