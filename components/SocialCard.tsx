import React from 'react';
import { UserProfile } from '../types';

import { ProfileBackgroundSurface } from './ProfileBackgroundSurface';
import { UserAvatar } from './UserAvatar';

export const SocialCard: React.FC<{
    profile: UserProfile;
    subtitle?: string;
    actions?: React.ReactNode;
    onClick?: () => void;
}> = ({ profile, subtitle, actions, onClick }) => {
    return (
        <div
            className={`h-16 rounded-3xl relative overflow-hidden border border-[var(--glass-border)] group ${onClick ? 'cursor-pointer hover:border-white/30 transition-colors' : ''}`}
            onClick={onClick}
        >
            <div className="absolute inset-0">
                <ProfileBackgroundSurface value={profile.backgroundUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.3)_100%)]" />
            </div>

            <div className="relative z-10 flex h-full items-center space-x-3 px-3 py-0.5">
                <UserAvatar avatarUrl={profile.avatarUrl} nickname={profile.nickname} className="w-12 h-12" isOnline={false} level={profile.level} borderId={profile.border} />

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
                        {subtitle ? 'INFO' : (profile.clanName ? 'CLA' : '')}
                    </span>
                    <div className="text-[10px] text-gray-300 flex items-center gap-1 opacity-90 bg-black/20 px-1.5 py-0.5 rounded-md border border-white/5">
                        {subtitle ?? (
                            <>
                                {profile.clanIcon && <span className="text-xs">{profile.clanIcon}</span>}
                                <span className="max-w-[70px] truncate font-medium">{profile.clanName || 'Sem Cla'}</span>
                            </>
                        )}
                    </div>
                </div>

                {actions && <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>{actions}</div>}
            </div>
        </div>
    );
};
