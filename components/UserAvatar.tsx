import React from 'react';
import { BORDERS_DATA, SKINS_DATA } from '../constants';

interface UserAvatarProps {
    avatarUrl?: string;
    nickname: string;
    className?: string;
    isOnline?: boolean;
    borderColor?: string;
    borderId?: string;
    showBorder?: boolean;
    level?: number;
    imgProps?: React.ImgHTMLAttributes<HTMLImageElement>;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
    avatarUrl, 
    nickname, 
    className = "w-16 h-16", 
    isOnline, 
    borderColor,
    borderId,
    showBorder = true,
    level,
    imgProps
}) => {
    const selectedBorder = borderId ? [...SKINS_DATA, ...BORDERS_DATA].find(s => s.id === borderId) : null;

    return (
        <div className={`relative ${className} flex-shrink-0 animate-fade-in`}>
            {/* Base Avatar Circle */}
            <div 
                className={`absolute inset-[10%] rounded-full bg-gray-800 overflow-hidden ${!selectedBorder && showBorder ? 'border-4' : ''}`}
                style={{ borderColor: borderColor || 'var(--skin-accent-color)' }}
            >
                {avatarUrl ? (
                    <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" {...imgProps} />
                ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center font-bold text-gray-400 select-none text-sm">
                        {nickname ? nickname.substring(0, 2).toUpperCase() : '??'}
                    </div>
                )}
            </div>

            {/* Custom Border Overlay */}
            {showBorder && selectedBorder && (
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                    {selectedBorder.imageUrl ? (
                        <img 
                            src={selectedBorder.imageUrl} 
                            alt="Border" 
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                        />
                    ) : (
                        <div 
                            className="w-[90%] h-[90%] rounded-full" 
                            style={{ border: `4px solid ${selectedBorder.color || 'var(--skin-accent-color)'}` }}
                        />
                    )}
                </div>
            )}

            {isOnline && (
                <div className="absolute bottom-[10%] right-[10%] w-[20%] h-[20%] bg-green-500 rounded-full border-2 border-gray-800 z-20" />
            )}
            
            {level !== undefined && (
                <div className="absolute -bottom-1 -right-1 bg-gray-900/90 rounded-full w-6 h-6 flex items-center justify-center border border-[var(--skin-accent-color)] z-20 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-[11px] font-black text-white">{level}</span>
                </div>
            )}
        </div>
    );
};
