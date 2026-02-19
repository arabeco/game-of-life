import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { EditIcon, CheckIcon, PlusIcon, XIcon, ShareIcon } from '../components/Icons';
import { Slot, UserProfile, Clan, ClanRank, Asset } from '../types';
import { BorderSelectionModal } from '../components/BorderSelectionModal';
import { BackgroundImageSelectionModal } from '../components/BackgroundImageSelectionModal';
import { BannerSelectionModal } from '../components/BannerSelectionModal';
import { ClanDetailModal } from '../components/ClanDetailModal';
import { SKINS_DATA, BORDERS_DATA } from '../constants';
import { Sovereign } from '../components/Avatar';
import { AvatarUploadModal } from '../components/AvatarUploadModal';
import { handleShare } from '../components/Share';

const ProfileSlotWidget: React.FC<{ slot: Slot, isShareable?: boolean }> = ({ slot, isShareable = false }) => {
    const getGridClasses = (type: number) => {
        switch(type) {
            case 1: return 'col-span-6';
            case 2: return 'col-span-2 aspect-square';
            case 3: return 'col-span-3';
            default: return 'col-span-6';
        }
    }

    const rarity = slot.rarity || (typeof slot.value === 'object' && 'rarity' in slot.value ? slot.value.rarity : undefined);
    
    const getRarityColor = (r?: string) => {
        if (!r) return null;
        const lower = r.toLowerCase();
        if (lower === 'uncommon' || lower === 'incomum') return { bg: 'bg-white', color: '#FFFFFF' };
        if (lower === 'rare' || lower === 'raro') return { bg: 'bg-[#CD7F32]', color: '#CD7F32' };
        if (lower === 'epic' || lower === 'épico' || lower === 'epico') return { bg: 'bg-[#C0C0C0]', color: '#C0C0C0' };
        if (lower === 'legendary' || lower === 'lendário' || lower === 'lendario') return { bg: 'bg-[#F0C843]', color: '#F0C843' };
        return null;
    };
    
    const rarityStyle = getRarityColor(rarity);
    
    // Glow for Epic/Legendary
    const hasGlow = rarityStyle && (rarity?.toLowerCase().includes('epic') || rarity?.toLowerCase().includes('épico') || rarity?.toLowerCase().includes('legendary') || rarity?.toLowerCase().includes('lendário'));
    const glowStyle = hasGlow ? { boxShadow: `0 0 10px ${rarityStyle.color}40` } : {};

    const valueDisplay = typeof slot.value === 'object' && slot.value.imageUrl ? (
         <img src={slot.value.imageUrl} alt={slot.value.caption} className="w-full h-full object-cover rounded-xl" crossOrigin="anonymous" />
    ) : (
        <span className={`truncate font-bold ${isShareable ? 'text-black' : 'text-white'}`}>{String(slot.value)}</span>
    );

    if (isShareable) {
        // Gold style for sharing, as per the reference image.
        return (
            <div className={`text-center space-y-1 flex flex-col ${getGridClasses(slot.type)}`}>
                <h3 className="text-[10px] font-semibold text-yellow-400/70 uppercase tracking-wider">{slot.label}</h3>
                <div className="relative w-full flex-grow mx-auto px-4 py-3 rounded-2xl flex items-center justify-center bg-gradient-to-b from-yellow-500 to-amber-700 text-black shadow-inner shadow-white/20">
                    {valueDisplay}
                    {rarityStyle && (
                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${rarityStyle.bg} shadow-sm z-10`} />
                    )}
                </div>
            </div>
        );
    }
    
    // Original dark style for the live profile view.
    return (
        <div className={`text-center space-y-1 flex flex-col ${getGridClasses(slot.type)}`}>
            <h3 className="text-[10px] font-semibold accent-text uppercase tracking-wider">{slot.label}</h3>
            <div 
                className="relative w-full flex-grow mx-auto p-2 rounded-2xl flex items-center justify-center bg-black/50 gradient-border gradient-border-accent text-white"
                style={glowStyle}
            >
                {valueDisplay}
                {rarityStyle && (
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${rarityStyle.bg} shadow-sm z-10`} />
                )}
            </div>
        </div>
    );
}

const ShareableProfileCard: React.FC<{ 
    id: string; 
    userProfile: UserProfile;
    clanName: string;
    clanRank: ClanRank | undefined;
    getSlotById: (slotId: string) => Slot | undefined;
}> = ({ id, userProfile, clanName, clanRank, getSlotById }) => {
    const selectedBorder = [...SKINS_DATA, ...BORDERS_DATA].find(s => s.id === userProfile.border);
    const isGradientBackground = userProfile.backgroundUrl.startsWith('var(') || userProfile.backgroundUrl.startsWith('linear-gradient');

    return (
        <div id={id} className="w-[380px] h-auto bg-[#101010] font-sans text-white relative p-4 overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-80">
                {isGradientBackground ? (
                    <div className="w-full h-full" style={{ background: userProfile.backgroundUrl }} />
                ) : (
                    <img src={userProfile.backgroundUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous"/>
                )}
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

            <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="pt-8 flex flex-col items-center text-center">
                    <div className="relative w-32 h-32">
                        <div className="w-full h-full group flex items-center justify-center">
                            <div className="w-[75%] h-[75%] rounded-full overflow-hidden relative">
                                <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous"/>
                            </div>
                        </div>
                        <div 
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            style={ selectedBorder?.imageUrl ? { backgroundImage: `url(${selectedBorder.imageUrl})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } : { border: `4px solid ${selectedBorder?.color || 'var(--skin-accent-color)'}`, borderRadius: '50%' } }
                        />
                        <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center border-2 z-10" style={{ borderColor: selectedBorder?.color || 'var(--skin-accent-color)' }}>
                            <span className="text-lg font-black text-white">{userProfile.level}</span>
                        </div>
                    </div>
                    
                    <div className="relative mt-2 flex flex-col items-center">
                        <div className="bg-black/50 backdrop-blur-sm border rounded-xl py-1 px-4 inline-block" style={{ borderColor: 'var(--skin-accent-color)' }}>
                            <h2 className="text-3xl font-bold text-white luxe-title-shadow">{userProfile.nickname}</h2>
                        </div>
                        <div className="mt-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl py-2 px-4 inline-flex flex-col items-center">
                            <span className="text-sm font-bold text-white">{clanName}</span>
                            <span className="text-xs text-gray-400">{clanRank?.name || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {userProfile.bannerUrl && (
                    <div className="pt-4 pb-4 text-center flex items-center justify-center">
                        <img src={userProfile.bannerUrl} alt="Banner" className="mx-auto h-16 object-contain" crossOrigin="anonymous" />
                    </div>
                )}
                
                {userProfile.visibleWidgets.length > 0 && (
                     <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl w-full">
                        <div className="grid grid-cols-6 gap-2">
                        {userProfile.visibleWidgets.map(slotId => {
                            const slot = getSlotById(slotId);
                            if (!slot) return null;
                            return <ProfileSlotWidget key={slotId} slot={slot} isShareable={true} />
                        })}
                        </div>
                    </div>
                )}
            </div>

             {userProfile.sovereign && (
                <div className="absolute bottom-[-3.5rem] right-[-1.5rem] h-48 w-48 z-20 drop-shadow-lg pointer-events-none">
                    <Sovereign sovereignConfig={userProfile.sovereign} />
                </div>
            )}
             <div className="absolute bottom-2 right-3 text-xs accent-text opacity-80 font-semibold z-30">Life OS</div>
        </div>
    );
}

export const ProfileView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { userProfile, assets, updateUserProfile, clan, clanRanks } = useGame();
    const [isEditing, setIsEditing] = useState(false);
    const [editableProfile, setEditableProfile] = useState<UserProfile>(userProfile);
    const [isBorderModalOpen, setBorderModalOpen] = useState(false);
    const [isBackgroundModalOpen, setBackgroundModalOpen] = useState(false);
    const [isBannerModalOpen, setBannerModalOpen] = useState(false);
    const [isClanModalOpen, setClanModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    
    useEffect(() => {
        if (isEditing) {
            setEditableProfile(userProfile);
        }
    }, [isEditing, userProfile]);

    const getSlotById = (slotId: string) => {
        const assetId = slotId.split('.')[0];
        const asset = assets.find(a => a.id === assetId);
        return asset?.slots.find(s => s.id === slotId);
    };

    const handleSave = () => {
        const patch: Partial<UserProfile> = {};
        if (editableProfile.avatarUrl !== userProfile.avatarUrl) patch.avatarUrl = editableProfile.avatarUrl;
        if (editableProfile.border !== userProfile.border) patch.border = editableProfile.border;
        if (editableProfile.backgroundUrl !== userProfile.backgroundUrl) patch.backgroundUrl = editableProfile.backgroundUrl;
        if (editableProfile.bannerUrl !== userProfile.bannerUrl) patch.bannerUrl = editableProfile.bannerUrl;
        const nextWidgets = editableProfile.visibleWidgets || [];
        const currentWidgets = userProfile.visibleWidgets || [];
        if (JSON.stringify(nextWidgets) !== JSON.stringify(currentWidgets)) patch.visibleWidgets = nextWidgets;
        if (Object.keys(patch).length > 0) updateUserProfile(patch);
        setIsEditing(false);
    };
    
    const cancelEdit = () => {
        setEditableProfile(userProfile);
        setIsEditing(false);
    }
    
    const handleBorderSelect = (borderId: string) => {
        setEditableProfile(prev => ({...prev, border: borderId}));
        setBorderModalOpen(false);
    }
    
    const handleBackgroundSelect = (backgroundUrl: string) => {
        setEditableProfile(prev => ({...prev, backgroundUrl: backgroundUrl}));
        setBackgroundModalOpen(false);
    }

    const handleBannerSelect = (bannerUrl: string) => {
        setEditableProfile(prev => ({...prev, bannerUrl: bannerUrl}));
        setBannerModalOpen(false);
    }

    const handleAvatarSelect = (avatarUrl: string) => {
        setEditableProfile(prev => ({ ...prev, avatarUrl }));
        setIsAvatarModalOpen(false);
    };
    
    const handleWidgetToggle = (slotId: string) => {
        setEditableProfile(prev => {
            const currentWidgets = prev.visibleWidgets || [];
            const newWidgets = currentWidgets.includes(slotId)
                ? currentWidgets.filter(id => id !== slotId)
                : [...currentWidgets, slotId];
            return { ...prev, visibleWidgets: newWidgets };
        });
    };

    const displayProfile = isEditing ? editableProfile : userProfile;
    const selectedBorder = [...SKINS_DATA, ...BORDERS_DATA].find(s => s.id === displayProfile.border);
    const currentClanRank = clan ? clanRanks.find(r => r.id === clan.rankId) : undefined;
    const clanName = clan?.name || 'Sem Clã';

    const isGradientBackground = displayProfile.backgroundUrl.startsWith('var(') || displayProfile.backgroundUrl.startsWith('linear-gradient');

    const renderBackground = () => {
        if (isGradientBackground) {
            return <div className="w-full h-full" style={{ background: displayProfile.backgroundUrl }} />;
        }
        return <img src={displayProfile.backgroundUrl} className="w-full h-full object-cover" alt="Background" />;
    };

    return (
        <>
            <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
                <ShareableProfileCard 
                    id="shareable-profile" 
                    userProfile={userProfile}
                    clanName={clanName}
                    clanRank={currentClanRank} 
                    getSlotById={getSlotById}
                />
            </div>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center animate-fade-in" onClick={onClose}>
                <div className="w-full max-w-[420px] p-4 h-[90vh]" onClick={e => e.stopPropagation()}>
                    <GlassCard variant="neutral" className="p-0 overflow-hidden relative h-full">
                         {/* Layer 1: Background Image/Gradient */}
                        <div className="absolute inset-0 w-full h-full z-0">
                            {renderBackground()}
                             {isEditing && (
                                <button onClick={() => setBackgroundModalOpen(true)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity z-20">
                                    EDITAR PLANO DE FUNDO
                                </button>
                            )}
                        </div>

                        {/* Layer 2: Scrollable Content */}
                        <div className="absolute inset-0 overflow-y-auto z-10 p-4 space-y-4">
                            <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start">
                                <div className="flex flex-col space-y-2">
                                    <button onClick={isEditing ? cancelEdit : () => setIsEditing(true)} className={`p-2 rounded-full transition-colors border ${isEditing ? 'border-red-500/50 bg-red-500/50 backdrop-blur-sm' : 'border-white/20 bg-black/50 backdrop-blur-sm'}`}>
                                        {isEditing ? <XIcon className="w-5 h-5 text-red-300" /> : <EditIcon className="w-5 h-5 text-gray-300" />}
                                    </button>
                                     <button onClick={() => handleShare('shareable-profile', `Perfil de ${userProfile.nickname} - Life OS`)} className="p-2 rounded-full border border-white/20 bg-black/50 backdrop-blur-sm">
                                        <ShareIcon className="w-5 h-5 text-gray-300" />
                                    </button>
                                </div>
                                <button onClick={isEditing ? handleSave : onClose} className="px-5 py-2 text-sm font-bold rounded-xl luxe-skin-button">
                                {isEditing ? 'SALVAR' : 'OK'}
                            </button>
                            </div>

                            <div className="pt-8 flex flex-col items-center text-center">
                                <div className="relative w-32 h-32">
                                    <button
                                        onClick={() => isEditing && setBorderModalOpen(true)}
                                        disabled={!isEditing}
                                        className="absolute -inset-1 z-10"
                                    />
                                    
                                    {/* Avatar Button (Top Layer) */}
                                    <button onClick={() => isEditing && setIsAvatarModalOpen(true)} disabled={!isEditing} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] h-[75%] rounded-full group flex items-center justify-center z-30">
                                        <div className="w-full h-full rounded-full overflow-hidden relative">
                                            <img src={displayProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                            {isEditing && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-xs font-bold">EDITAR</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    <div
                                        className="absolute -inset-1 pointer-events-none z-40"
                                        style={
                                            selectedBorder?.imageUrl
                                            ? {
                                                backgroundImage: `url(${selectedBorder.imageUrl})`,
                                                backgroundSize: 'contain',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat',
                                            }
                                            : {
                                                border: `4px solid ${selectedBorder?.color || 'var(--skin-accent-color)'}`,
                                                borderRadius: '50%',
                                            }
                                        }
                                    />
                                    
                                    <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center border-2 z-10" style={{ borderColor: selectedBorder?.color || 'var(--skin-accent-color)' }}>
                                        <span className="text-lg font-black text-white">{displayProfile.level}</span>
                                    </div>
                                </div>
                                
                                <div className="relative mt-2 flex flex-col items-center">
                                    <div 
                                        className="bg-black/50 backdrop-blur-sm border rounded-xl py-1 px-4 inline-block" 
                                        style={{ borderColor: 'var(--skin-accent-color)' }}
                                    >
                                        <h2 className="text-3xl font-bold text-white luxe-title-shadow">{displayProfile.nickname}</h2>
                                    </div>
                                    <button onClick={() => clan && setClanModalOpen(true)} disabled={!clan} className="mt-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl py-2 px-4 inline-flex flex-col items-center hover:bg-black/70 transition-colors disabled:cursor-default">
                                        <span className="text-sm font-bold text-white">{clanName}</span>
                                        <span className="text-xs text-gray-400">{currentClanRank?.name || 'N/A'}</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="pt-4 pb-4 text-center flex items-center justify-center">
                                {displayProfile.bannerUrl ? (
                                    <div className="px-4 relative group">
                                        <img src={displayProfile.bannerUrl} alt="Banner" className="mx-auto h-16 object-contain" />
                                            {isEditing && (
                                            <button onClick={() => setBannerModalOpen(true)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                EDITAR BANNER
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    isEditing && (
                                        <button onClick={() => setBannerModalOpen(true)} className="border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center hover:border-gray-400 transition-colors text-gray-500 hover:text-gray-400 p-4">
                                            <PlusIcon className="w-8 h-8"/>
                                            <span className="text-xs font-bold mt-1">ADD BANNER</span>
                                        </button>
                                    )
                                )}
                            </div>

                            <div className="bg-black/30 backdrop-blur-sm p-4 rounded-2xl">
                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                        {assets.flatMap(a => a.slots).map(slot => {
                                            const isSelected = editableProfile.visibleWidgets.includes(slot.id);
                                            return (
                                                <button 
                                                    key={slot.id} 
                                                    onClick={() => handleWidgetToggle(slot.id)} 
                                                    className={`p-2 rounded-xl text-left text-sm transition-all ${isSelected ? 'bg-white/20 ring-2 ring-[var(--gold)]' : 'bg-black/20 hover:bg-white/10'}`}
                                                >
                                                    {slot.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                        <div className="grid grid-cols-6 gap-2">
                                        {userProfile.visibleWidgets.map(slotId => {
                                            const slot = getSlotById(slotId);
                                            if (!slot) return null;
                                            return <ProfileSlotWidget key={slotId} slot={slot} />
                                        })}
                                            {userProfile.visibleWidgets.length === 0 && <p className="col-span-6 text-center text-sm text-gray-500 py-4">Nenhum widget visível.</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {displayProfile.sovereign && (
                                <div className="absolute bottom-[-3.5rem] right-[-1.5rem] h-48 w-48 z-20 drop-shadow-lg pointer-events-none">
                                    <Sovereign sovereignConfig={displayProfile.sovereign} />
                                </div>
                            )}
                    </GlassCard>
                 </div>
            </div>
            {isAvatarModalOpen && <AvatarUploadModal currentAvatar={editableProfile.avatarUrl} onSave={handleAvatarSelect} onClose={() => setIsAvatarModalOpen(false)} />}
            {isBorderModalOpen && <BorderSelectionModal currentBorder={editableProfile.border} onSelect={handleBorderSelect} onClose={() => setBorderModalOpen(false)} />}
            {isBackgroundModalOpen && <BackgroundImageSelectionModal currentBackground={editableProfile.backgroundUrl} onSelect={handleBackgroundSelect} onClose={() => setBackgroundModalOpen(false)} />}
            {isBannerModalOpen && <BannerSelectionModal currentBanner={editableProfile.bannerUrl || ''} onSelect={handleBannerSelect} onClose={() => setBannerModalOpen(false)} />}
            {isClanModalOpen && clan && <ClanDetailModal clanName={clan.name} onClose={() => setClanModalOpen(false)} />}
        </>
    );
};
