import React from 'react';

const IconWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {children}
    </svg>
);

export const EditIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></IconWrapper>);
export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="20 6 9 17 4 12"></polyline></IconWrapper>);
export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></IconWrapper>);
export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="15 18 9 12 15 6"></polyline></IconWrapper>);
export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="9 18 15 12 9 6"></polyline></IconWrapper>);
export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="6 9 12 15 18 9"></polyline></IconWrapper>);
export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></IconWrapper>);
export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></IconWrapper>);
export const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></IconWrapper>);
export const CrownIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path></IconWrapper>);
export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17"></path><path d="M14 14.66V17"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></IconWrapper>);
export const ZapIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></IconWrapper>);
export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></IconWrapper>);
export const XIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></IconWrapper>);
export const CloseIcon = XIcon;
export const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><line x1="5" y1="12" x2="19" y2="12"></line></IconWrapper>);
export const LightbulbIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 5 12.25V17a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2.75A7 7 0 0 1 12 2z"/></IconWrapper>);
export const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></IconWrapper>);
export const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></IconWrapper>);
export const ArchiveBoxIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></IconWrapper>);
export const RefreshCwIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></IconWrapper>);
export const Trash2Icon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></IconWrapper>);
export const TrashIcon = Trash2Icon;
export const DoorIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M13 4h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><polyline points="10 17 15 12 10 7"/><path d="M15 12H3"/></IconWrapper>);
export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></IconWrapper>);

export const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M10 13a5 5 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07L12 3" />
        <path d="M14 11a5 5 0 0 0-7.07 0L3.39 14.54a5 5 0 0 0 7.07 7.07L12 21" />
    </IconWrapper>
);


export const FolderStarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconWrapper className={className}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        <path d="M12 10l-1.5 3-3 .5 2.25 2.25-.5 3.25 2.75-1.5 2.75 1.5-.5-3.25L16.5 13.5l-3-.5z" stroke='var(--skin-accent-color)' fill='var(--skin-accent-color)'></path>
    </IconWrapper>
);

export const GameLogoIcon: React.FC<{ className?: string }> = ({ className = "w-24 h-24" }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="logo-gold-main" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--logo-stop-1)" />
                <stop offset="40%" stopColor="var(--logo-stop-2)" />
                <stop offset="70%" stopColor="var(--logo-stop-3)" />
                <stop offset="100%" stopColor="var(--logo-stop-4)" />
            </linearGradient>
            <linearGradient id="logo-gold-edge" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--logo-edge-1)" />
                <stop offset="50%" stopColor="var(--logo-edge-2)" />
                <stop offset="100%" stopColor="var(--logo-edge-3)" />
            </linearGradient>
            <radialGradient id="logo-core" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#F9F0FF" />
                <stop offset="22%" stopColor="#B178FF" />
                <stop offset="46%" stopColor="#4C7DFF" />
                <stop offset="66%" stopColor="#2EF2C2" />
                <stop offset="82%" stopColor="#FFB347" />
                <stop offset="100%" stopColor="#FF4D6D" />
            </radialGradient>
            <radialGradient id="logo-core-glow" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="rgba(249,240,255,0.7)" />
                <stop offset="40%" stopColor="rgba(76,125,255,0.45)" />
                <stop offset="65%" stopColor="rgba(46,242,194,0.3)" />
                <stop offset="85%" stopColor="rgba(255,77,109,0.18)" />
                <stop offset="100%" stopColor="rgba(255,77,109,0)" />
            </radialGradient>
            <filter id="logo-depth" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="var(--logo-edge-3)" floodOpacity="0.6" />
            </filter>
            <filter id="logo-core-glow-filter" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="6" />
            </filter>
        </defs>
        <g filter="url(#logo-depth)">
            <path d="M50 6 L94 50 L50 94 L6 50 Z" fill="url(#logo-gold-main)" stroke="url(#logo-gold-edge)" strokeWidth="1.2" />
            <path d="M50 12 L88 50 L50 88 L12 50 Z" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
            <path d="M50 20 L80 50 L50 80 L20 50 Z" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
            <circle cx="50" cy="50" r="20" fill="url(#logo-core-glow)" filter="url(#logo-core-glow-filter)" />
            <circle cx="50" cy="50" r="16" fill="url(#logo-core)" />
            <circle cx="50" cy="50" r="11" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
        </g>
    </svg>
);


// Nav Icons
export const AssetIcon: React.FC<{ active?: boolean, className?: string }> = ({ className = "w-6 h-6" }) => (<IconWrapper className={className}><path d="M12 2l-5.5 9h11z"></path><path d="M12 22l5.5-9h-11z"></path></IconWrapper>);
export const ArenaIcon: React.FC<{ active?: boolean, className?: string }> = ({ className = "w-6 h-6" }) => (<IconWrapper className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></IconWrapper>);
export const PlannerIcon: React.FC<{ active?: boolean, className?: string }> = ({ className = "w-6 h-6" }) => (<IconWrapper className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></IconWrapper>);
export const SocialIcon: React.FC<{ active?: boolean, className?: string }> = ({ className = "w-6 h-6" }) => (<IconWrapper className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></IconWrapper>);
export const ConfigIcon: React.FC<{ active?: boolean, className?: string }> = ({ className = "w-6 h-6" }) => (<IconWrapper className={className}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></IconWrapper>);
export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></IconWrapper>);
export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></IconWrapper>);
export const FlameIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></IconWrapper>);
export const DollarSignIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></IconWrapper>);
export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></IconWrapper>);

// New Icons
export const ShoppingBagIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></IconWrapper>);
export const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></IconWrapper>);

// --- Added for Inventory ---
export const SovereignIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></IconWrapper>);
export const GlyphIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></IconWrapper>);
export const MessageIcon: React.FC<{ className?: string }> = ({ className }) => (<IconWrapper className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></IconWrapper>);
