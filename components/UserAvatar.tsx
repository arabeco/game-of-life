import React from 'react';

interface UserAvatarProps {
    avatarUrl?: string;
    nickname: string;
    className?: string;
    isOnline?: boolean;
    borderColor?: string;
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
    showBorder = true,
    level,
    imgProps
}) => {
    return (
        <div 
            className={`relative ${className} rounded-full flex-shrink-0 bg-gray-800 ${showBorder ? 'border-4' : ''}`} 
            style={{ borderColor: borderColor || 'var(--skin-accent-color)' }}
        >
            <div className="w-full h-full rounded-full overflow-hidden">
                {avatarUrl ? (
                    <img src={avatarUrl} alt={nickname} className="w-full h-full object-cover" {...imgProps} />
                ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center font-bold text-gray-400 select-none text-sm">
                        {nickname ? nickname.substring(0, 2).toUpperCase() : '??'}
                    </div>
                )}
            </div>
            {isOnline && (
                <div className="absolute bottom-0 right-0 w-[20%] h-[20%] bg-green-500 rounded-full border-2 border-gray-800" />
            )}
            {level !== undefined && (
                <div className="absolute -bottom-1 -right-1 bg-gray-900/90 rounded-full w-6 h-6 flex items-center justify-center border border-[var(--skin-accent-color)] z-10 shadow-lg group-hover:scale-110 transition-transform">
                    <span className="text-[11px] font-black text-white">{level}</span>
                </div>
            )}
        </div>
    );
};
