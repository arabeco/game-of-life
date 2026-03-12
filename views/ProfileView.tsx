import React, { Suspense, useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { EditIcon, CheckIcon, PlusIcon, XIcon, ShareIcon, CrownIcon, ImageIcon } from '../components/Icons';
import { Slot, UserProfile, Clan, ClanRank, Asset } from '../types';
import { BorderSelectionModal } from '../components/BorderSelectionModal';
import { BackgroundImageSelectionModal } from '../components/BackgroundImageSelectionModal';
import { BannerSelectionModal } from '../components/BannerSelectionModal';
import { ClanDetailModal } from '../components/ClanDetailModal';
import { SKINS_DATA, BORDERS_DATA } from '../constants';
import { SOVEREIGN_ASSETS } from '../constants/avatar';
import { Sovereign } from '../components/Avatar';
import { SovereignCustomizer } from '../components/SovereignCustomizer';
import { AvatarUploadModal } from '../components/AvatarUploadModal';
import { handleShare } from '../components/Share';
import { Portal } from '../components/Portal';
import { ITEMS_DB, resolveItemDef } from '../constants/items';
const AssetDecagon = React.lazy(() => import('../components/AssetDecagon').then((m) => ({ default: m.AssetDecagon })));

const UnifiedSovereignDisplay: React.FC<{
    sovereignConfig: UserProfile['sovereign'];
    onClick?: () => void;
    className?: string;
}> = ({ sovereignConfig, onClick, className }) => {
    if (!sovereignConfig) return null;

    const { primaryDisplay = 'sovereign' } = sovereignConfig;
    const isInteractive = !!onClick;

    // Helper to get asset URL
    const getArtifactUrl = () => {
        try {
            return SOVEREIGN_ASSETS.artifacts?.find(a => a.id === sovereignConfig.artifact)?.url;
        } catch (e) { return undefined; }
    };
    const getGlyphUrl = () => {
        try {
            return SOVEREIGN_ASSETS.glyphs?.find(g => g.id === sovereignConfig.glyph)?.url;
        } catch (e) { return undefined; }
    };
    const getOrbUrl = () => {
        try {
            return SOVEREIGN_ASSETS.orbs?.find(o => o.id === sovereignConfig.orb)?.url;
        } catch (e) { return undefined; }
    };
    const getPlateUrl = () => {
        try {
            if (primaryDisplay === 'item') return SOVEREIGN_ASSETS.plates?.find(p => p.id === sovereignConfig.artifactPlate)?.url;
            if (primaryDisplay === 'glyph') return SOVEREIGN_ASSETS.plates?.find(p => p.id === sovereignConfig.glyphPlate)?.url;
            return SOVEREIGN_ASSETS.plates?.find(p => p.id === sovereignConfig.sovereignPlate)?.url;
        } catch (e) { return undefined; }
    };

    const positionClasses = className || "absolute bottom-4 right-4 w-24 h-32";
    const displayConfig = primaryDisplay === 'sovereign'
        ? {
            ...sovereignConfig,
            artifact: 'none',
            glyph: 'none',
            aura: 'none',
            orb: 'none',
            artifactPlate: 'none',
            glyphPlate: 'none'
        }
        : sovereignConfig;

    return (
        <div
            className={`${positionClasses} z-30 bg-[#1a1a1a] border-2 rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.8)] group ${isInteractive ? 'cursor-pointer transition-transform hover:scale-105 hover:shadow-[0_0_25px_var(--skin-accent-color)]' : ''}`}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick();
                }
            }}
            style={{ borderColor: 'var(--skin-accent-color)' }}
        >
            {/* Background Gradient/Texture */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black z-0 opacity-80" />


            {/* Content */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                {primaryDisplay === 'sovereign' && (
                    <div className="w-full h-full relative">
                        <Sovereign sovereignConfig={displayConfig} className="w-[180%] h-[180%] object-cover absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                )}
                {primaryDisplay === 'item' && (
                    getArtifactUrl() ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {getPlateUrl() && (
                                <img src={getPlateUrl()} alt="Placa" className="absolute inset-0 w-full h-full object-cover opacity-90" crossOrigin="anonymous" />
                            )}
                            <img
                                src={getArtifactUrl()}
                                alt="Item"
                                className="relative z-10 w-full h-full object-contain p-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                crossOrigin="anonymous"
                            />
                        </div>
                    ) : <span className="text-[10px] text-gray-500 font-bold uppercase">Vazio</span>
                )}
                {primaryDisplay === 'glyph' && (
                    getGlyphUrl() ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {getPlateUrl() && (
                                <img src={getPlateUrl()} alt="Placa" className="absolute inset-0 w-full h-full object-cover opacity-90" crossOrigin="anonymous" />
                            )}
                            <img
                                src={getGlyphUrl()}
                                alt="Glifo"
                                className="relative z-10 w-full h-full object-contain p-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                                crossOrigin="anonymous"
                            />
                            {getOrbUrl() && (
                                <img src={getOrbUrl()} alt="Orbe" className="absolute inset-0 w-full h-full object-contain z-20 scale-75 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" crossOrigin="anonymous" />
                            )}
                        </div>
                    ) : <span className="text-[10px] text-gray-500 font-bold uppercase">Vazio</span>
                )}
            </div>

            {/* Hover Overlay */}
            {isInteractive && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm">
                    <span className="text-[8px] font-bold uppercase text-center leading-tight tracking-widest border px-1 py-0.5 rounded" style={{ color: 'var(--skin-accent-color)', borderColor: 'var(--skin-accent-color)' }}>Ver<br />Soberano</span>
                </div>
            )}
        </div>
    );
};

const ProfileSlotWidget: React.FC<{ slot: Slot, isShareable?: boolean }> = ({ slot, isShareable = false }) => {
    const getGridClasses = (type: number) => {
        switch (type) {
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
        // Comum: Marrom
        if (lower === 'common' || lower === 'comum') return { bg: 'bg-[#A0522D]', color: '#A0522D' };
        // Incomum: Prata
        if (lower === 'uncommon' || lower === 'incomum') return { bg: 'bg-[#C0C0C0]', color: '#C0C0C0' };
        // Raro: Ouro
        if (lower === 'rare' || lower === 'raro') return { bg: 'bg-[#FFD700]', color: '#FFD700' };
        // Épico: Azul
        if (lower === 'epic' || lower === 'épico' || lower === 'epico') return { bg: 'bg-blue-500', color: '#3B82F6' };
        // Lendário: Roxo
        if (lower === 'legendary' || lower === 'lendário' || lower === 'lendario') return { bg: 'bg-purple-500', color: '#A855F7' };
        return null;
    };

    const rarityStyle = getRarityColor(rarity);

    // Glow for Epic/Legendary
    const hasGlow = rarityStyle && (rarity?.toLowerCase().includes('epic') || rarity?.toLowerCase().includes('épico') || rarity?.toLowerCase().includes('legendary') || rarity?.toLowerCase().includes('lendário'));
    const glowStyle = hasGlow ? { boxShadow: `0 0 10px ${rarityStyle.color}40` } : {};

    const valueDisplay = typeof slot.value === 'object' && slot.value.imageUrl ? (
        <img
            src={slot.value.imageUrl}
            alt={slot.value.caption}
            className="w-full h-full object-cover rounded-xl"
            crossOrigin="anonymous"
            onError={(e) => console.error(`Failed to load widget image: ${slot.value.imageUrl}`)}
        />
    ) : (
        <span className={`truncate font-bold ${isShareable ? 'text-black' : 'text-white'}`}>{String(slot.value)}</span>
    );

    // UNIFIED STYLE: Always use the dark/glass style regardless of isShareable
    return (
        <div className={`text-center space-y-0.5 flex flex-col ${getGridClasses(slot.type)}`}>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{slot.label}</h3>
            <div
                className="relative w-full flex-grow mx-auto p-1.5 rounded-2xl flex items-center justify-center bg-black/50 gradient-border gradient-border-accent text-white"
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

export const ShareableProfileCard: React.FC<{
    id: string;
    userProfile: UserProfile;
    clanName: string;
    clanRank: ClanRank | undefined;
    getSlotById: (slotId: string) => Slot | undefined;
    isBasicMode?: boolean;
}> = ({ id, userProfile, clanName, clanRank, getSlotById, isBasicMode = false }) => {
    const selectedBorder = [...SKINS_DATA, ...BORDERS_DATA].find(s => s.id === userProfile.border);
    const isGradientBackground = userProfile.backgroundUrl.includes('-gradient(') || userProfile.backgroundUrl.startsWith('var(');

    const renderBackground = () => {
        if (isGradientBackground) {
            return <div className="w-full h-full" style={{ background: userProfile.backgroundUrl }} />;
        }
        return (
            <img
                src={userProfile.backgroundUrl}
                className="w-full h-full object-cover"
                alt=""
                crossOrigin="anonymous"
                loading="eager"
                onError={(e) => console.error(`Failed to load background: ${userProfile.backgroundUrl}`)}
            />
        );
    };

    return (
        <GlassCard id={id} variant="neutral" className="w-[380px] min-h-[500px] h-auto p-0 overflow-hidden relative font-sans text-white">
            {/* Layer 1: Background Image/Gradient */}
            <div className="absolute inset-0 w-full h-full z-0">
                {renderBackground()}
            </div>

            {/* Layer 2: Content */}
            <div className="relative z-10 p-4 space-y-1">
                <div className="pt-4 flex flex-col items-center text-center">
                    <div className="relative w-32 h-32">
                        {/* Avatar */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] h-[75%] rounded-full flex items-center justify-center z-30">
                            <div className="w-full h-full rounded-full overflow-hidden relative">
                                <img
                                    src={userProfile.avatarUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    crossOrigin="anonymous"
                                    loading="eager"
                                    onError={(e) => console.error(`Failed to load avatar: ${userProfile.avatarUrl}`)}
                                />
                            </div>
                        </div>

                        {/* Border */}
                        <div className="absolute -inset-1 pointer-events-none z-40">
                            {selectedBorder?.imageUrl ? (
                                <img
                                    src={selectedBorder.imageUrl}
                                    alt="Border"
                                    className="w-full h-full object-contain"
                                    crossOrigin="anonymous"
                                    onError={(e) => console.error(`Failed to load border: ${selectedBorder.imageUrl}`)}
                                />
                            ) : (
                                <div
                                    className="w-full h-full rounded-full"
                                    style={{ border: `4px solid ${selectedBorder?.color || 'var(--skin-accent-color)'}` }}
                                />
                            )}
                        </div>

                        {/* Level Badge */}
                        <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center border-2 z-10" style={{ borderColor: selectedBorder?.color || 'var(--skin-accent-color)' }}>
                            <span className="text-lg font-black text-white">{userProfile.level}</span>
                        </div>
                    </div>

                    {/* Name & Clan */}
                    <div className="relative mt-1 flex flex-col items-center">
                        <div className="bg-black/50 backdrop-blur-sm border rounded-xl py-1 px-4 inline-block" style={{ borderColor: 'var(--skin-accent-color)' }}>
                            <h2 className="text-3xl font-bold text-white luxe-title-shadow inline-flex items-center gap-1.5">
                                {userProfile.nickname}
                                {(userProfile.isPremium || userProfile.role === 'admin' || userProfile.role === 'gm') && (
                                    <CrownIcon className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]" />
                                )}
                            </h2>
                        </div>
                        <div className="mt-0.5 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl py-1.5 px-4 inline-flex flex-col items-center">
                            <span className="text-sm font-bold text-white">{clanName}</span>
                            <span className="text-xs text-gray-400">{clanRank?.name || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Banner */}
                {userProfile.bannerUrl && (
                    <div className="pt-0 pb-0 text-center flex items-center justify-center -my-1 px-4">
                        <img
                            src={userProfile.bannerUrl}
                            alt="Banner"
                            className="mx-auto h-16 object-contain scale-115"
                            crossOrigin="anonymous"
                            onError={(e) => console.error(`Failed to load banner: ${userProfile.bannerUrl}`)}
                        />
                    </div>
                )}

                {/* Widgets */}
                <div className="bg-black/30 backdrop-blur-sm p-1.5 rounded-2xl">
                    {userProfile.visibleWidgets.length > 0 ? (
                        <div className="grid grid-cols-6 gap-0.5">
                            {userProfile.visibleWidgets.map(slotId => {
                                const slot = getSlotById(slotId);
                                if (!slot) return null;
                                return <ProfileSlotWidget key={slotId} slot={slot} isShareable={true} />
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-4">Nenhum widget visível.</p>
                    )}
                </div>
            </div>

            {/* UNIFIED POSITIONING: Match the Live Profile View */}
            {userProfile.sovereign && !isBasicMode && (
                <UnifiedSovereignDisplay
                    sovereignConfig={userProfile.sovereign}
                    className="absolute top-[60px] right-4 w-[70px] h-[95px]"
                />
            )}
            <div className="absolute bottom-2 right-3 text-xs accent-text opacity-80 font-semibold z-30">Life OS</div>
        </GlassCard>
    );
}

export const ProfileView: React.FC<{ onClose: () => void; profile?: UserProfile }> = ({ onClose, profile }) => {
    const { userProfile, assets, updateUserProfile, clan, clanRanks, getUserPublicData, appMode, cycleProgress } = useGame();

    const isOwnProfile = !profile || profile.id === userProfile.id;
    const baseProfile = profile || userProfile;
    const isBasicMode = appMode === 'BASIC';
    const isOfficeClan = clan?.clanType?.toLowerCase() === 'office';

    const [isEditing, setIsEditing] = useState(false);
    const [editableProfile, setEditableProfile] = useState<UserProfile>(baseProfile);
    const [isBorderModalOpen, setBorderModalOpen] = useState(false);
    const [isBackgroundModalOpen, setBackgroundModalOpen] = useState(false);
    const [isBannerModalOpen, setBannerModalOpen] = useState(false);
    const [isClanModalOpen, setClanModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isSovereignModalOpen, setIsSovereignModalOpen] = useState(false);
    const [activeWidgetTab, setActiveWidgetTab] = useState<'mural' | 'maestria'>('mural');

    const [viewedClan, setViewedClan] = useState<Clan | null>(null);
    const [viewedClanRank, setViewedClanRank] = useState<ClanRank | undefined>(undefined);
    const [viewedSlots, setViewedSlots] = useState<Slot[]>([]);
    const [viewedLevels, setViewedLevels] = useState<Record<string, number>>({});
    const [fetchedProfile, setFetchedProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (!isOwnProfile && profile?.id) {
            getUserPublicData(profile.id).then(data => {
                if (data.profile) setFetchedProfile(data.profile);
                setViewedClan(data.clan);
                setViewedClanRank(data.clanRank);
                setViewedSlots(data.slots);
                if (data.levels) setViewedLevels(data.levels);
            });
        }
    }, [isOwnProfile, profile?.id, getUserPublicData]);

    // Distinguish between Profile Photo (avatarUrl) and Sovereign Avatar (sovereign config)
    // The user explicitly requested to avoid confusion between the two.

    useEffect(() => {
        if (isEditing && isOwnProfile) {
            // We only sync from userProfile when STARTING to edit.
            // If we are already editing, we don't want external updates to overwrite work,
            // unless it's the result of our own save (which updates userProfile).
            // But since we are saving immediately now for widgets, we need to be careful.
            // Actually, if we save immediately, editableProfile should be kept in sync manually
            // or we rely on the fact that setEditableProfile was called before save.

            // For now, let's only reset if we weren't editing before. 
            // But this effect runs when isEditing changes.
            setEditableProfile(userProfile);
        }
    }, [isEditing, isOwnProfile, userProfile]);

    const getSlotById = (slotId: string) => {
        if (isOwnProfile) {
            const assetId = slotId.split('.')[0];
            const asset = assets.find(a => a.id === assetId);
            return asset?.slots.find(s => s.id === slotId);
        } else {
            return viewedSlots.find(s => s.id === slotId);
        }
    };

    const handleSave = () => {
        if (!isOwnProfile) return;
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
        if (!isOwnProfile) return;
        setEditableProfile(prev => ({ ...prev, border: borderId }));
        // Immediate persistence
        updateUserProfile({ border: borderId });
        setBorderModalOpen(false);
    }

    const handleBackgroundSelect = (backgroundUrl: string) => {
        if (!isOwnProfile) return;
        setEditableProfile(prev => ({ ...prev, backgroundUrl: backgroundUrl }));
        // Immediate persistence
        updateUserProfile({ backgroundUrl: backgroundUrl });
        setBackgroundModalOpen(false);
    }

    const handleBannerSelect = (bannerUrl: string) => {
        if (!isOwnProfile) return;
        setEditableProfile(prev => ({ ...prev, bannerUrl: bannerUrl }));
        // Immediate persistence
        updateUserProfile({ bannerUrl: bannerUrl });
        setBannerModalOpen(false);
    }

    const handleAvatarSelect = (avatarUrl: string) => {
        if (!isOwnProfile) return;
        // Immediate update for Avatar URL as per user request
        setEditableProfile(prev => ({
            ...prev,
            avatarUrl,
            sovereign: prev.sovereign ? { ...prev.sovereign, primaryDisplay: undefined } : prev.sovereign
        }));

        // Also trigger immediate persistence to Supabase
        updateUserProfile({ avatarUrl });

        setIsAvatarModalOpen(false);
    };

    const handleWidgetToggle = (slotId: string) => {
        if (!isOwnProfile) return;
        // Optimistic UI update
        const currentWidgets = editableProfile.visibleWidgets || [];
        const newWidgets = currentWidgets.includes(slotId)
            ? currentWidgets.filter(id => id !== slotId)
            : [...currentWidgets, slotId];

        // Update local state
        setEditableProfile(prev => ({ ...prev, visibleWidgets: newWidgets }));

        // Immediate persistence as per user request ("SALVANDO COMO ele deixa")
        updateUserProfile({ visibleWidgets: newWidgets });
    };

    const displayProfile = isOwnProfile
        ? (isEditing ? editableProfile : baseProfile)
        : (fetchedProfile || baseProfile);

    const selectedBorder = [...SKINS_DATA, ...BORDERS_DATA].find(s => s.id === displayProfile.border);

    // CRITICAL FIX: Use fetched clan data for other profiles
    const currentClanRank = isOwnProfile ? (clan ? clanRanks.find(r => r.id === clan.rankId) : undefined) : viewedClanRank;
    const clanName = isOwnProfile ? (clan ? clan.name : 'Sem Clã') : (viewedClan ? viewedClan.name : 'Sem Clã');

    const isGradientBackground = displayProfile.backgroundUrl.includes('-gradient(') || displayProfile.backgroundUrl.startsWith('var(');

    const renderBackground = () => {
        if (isGradientBackground) {
            return <div className="w-full h-full" style={{ background: displayProfile.backgroundUrl }} />;
        }
        return <img src={displayProfile.backgroundUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" />
    };

    // Layout Adjustment: Ensure the card container is centered and scrollable if needed, matching "comprido" (long) description.
    // Using h-[92vh] md:h-[95vh] ensures it takes up most of the screen vertically.
    // z-index increased to 9999 and using Portal to overlay everything
    return (
        <Portal>
            {/* Hidden container for capture - positioned off-screen but visible to capture tools */}
            <div style={{ position: 'absolute', top: '-10000px', left: '0', width: '380px', opacity: 1, pointerEvents: 'none', zIndex: -100 }}>
                <ShareableProfileCard
                    id="shareable-profile"
                    userProfile={displayProfile}
                    clanName={clanName}
                    clanRank={currentClanRank}
                    getSlotById={getSlotById}
                    isBasicMode={isBasicMode}
                />
            </div>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
                <div className="w-full max-w-[420px] h-[92vh] md:h-[95vh] relative" onClick={e => e.stopPropagation()}>
                    <GlassCard variant="neutral" className="w-full h-full p-0 overflow-hidden relative shadow-2xl border border-white/10">
                        {/* Layer 1: Background Image/Gradient */}
                        <div className="absolute inset-0 w-full h-full z-0">
                            {renderBackground()}
                            {isEditing && isOwnProfile && (
                                <button onClick={() => setBackgroundModalOpen(true)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity z-20">
                                    EDITAR PLANO DE FUNDO
                                </button>
                            )}
                        </div>

                        {/* Layer 2: Scrollable Content */}
                        <div className="absolute inset-0 overflow-y-auto z-10 p-4 space-y-2">
                            <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start">
                                <div className="flex flex-col space-y-2">
                                    {isOwnProfile && (
                                        <button onClick={isEditing ? cancelEdit : () => setIsEditing(true)} className={`p-2 rounded-full transition-colors border ${isEditing ? 'border-red-500/50 bg-red-500/50 backdrop-blur-sm' : 'border-white/20 bg-black/50 backdrop-blur-sm'}`}>
                                            {isEditing ? <XIcon className="w-5 h-5 text-red-300" /> : <EditIcon className="w-5 h-5 text-gray-300" />}
                                        </button>
                                    )}
                                    <button onClick={() => handleShare('shareable-profile', `Perfil de ${displayProfile.nickname} - Life OS`)} className="p-2 rounded-full border border-white/20 bg-black/50 backdrop-blur-sm">
                                        <ShareIcon className="w-5 h-5 text-gray-300" />
                                    </button>
                                    {isEditing && isOwnProfile && (
                                        <button
                                            onClick={() => setBackgroundModalOpen(true)}
                                            className="p-2 rounded-full border border-white/20 bg-black/50 backdrop-blur-sm animate-fade-in"
                                            title="Mudar Fundo"
                                        >
                                            <ImageIcon className="w-5 h-5 text-[var(--skin-accent-color)]" />
                                        </button>
                                    )}
                                </div>
                                <button onClick={isEditing ? handleSave : onClose} className="px-5 py-2 text-sm font-bold rounded-xl luxe-skin-button">
                                    {isEditing ? 'SALVAR' : 'OK'}
                                </button>
                            </div>

                            <div className="pt-4 flex flex-col items-center text-center">
                                <div className="relative w-32 h-32">
                                    <button
                                        onClick={() => isEditing && setBorderModalOpen(true)}
                                        disabled={!isEditing}
                                        className="absolute -inset-1 z-10"
                                        aria-label="Editar borda"
                                        title="Editar borda"
                                    />

                                    {/* Avatar Button (Top Layer) */}
                                    <button onClick={() => isEditing && setIsAvatarModalOpen(true)} disabled={!isEditing} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] h-[75%] rounded-full group flex items-center justify-center z-30">
                                        <div className="w-full h-full rounded-full overflow-hidden relative">
                                            <img src={displayProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                            {isEditing && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-xs font-bold">EDITAR</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>

                                    {!isBasicMode && (
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
                                    )}

                                    <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center border-2 z-10" style={{ borderColor: selectedBorder?.color || 'var(--skin-accent-color)' }}>
                                        <span className="text-lg font-black text-white">{displayProfile.level}</span>
                                    </div>
                                </div>

                                {isEditing && isOwnProfile && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <button
                                            onClick={() => setIsAvatarModalOpen(true)}
                                            className="px-3 py-1.5 rounded-xl border border-white/15 bg-black/45 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-white/85 hover:bg-white/10 transition-colors"
                                            title="Editar foto"
                                        >
                                            Foto
                                        </button>
                                        <button
                                            onClick={() => setBorderModalOpen(true)}
                                            className="px-3 py-1.5 rounded-xl border border-white/15 bg-black/45 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest text-white/85 hover:bg-white/10 transition-colors"
                                            title="Editar borda"
                                        >
                                            Borda
                                        </button>
                                    </div>
                                )}

                                <div className="relative mt-1 flex flex-col items-center">
                                    <div
                                        className="bg-black/50 backdrop-blur-sm border rounded-xl py-1 px-4 inline-block"
                                        style={{ borderColor: 'var(--skin-accent-color)' }}
                                    >
                                        <h2 className="text-3xl font-bold text-white luxe-title-shadow inline-flex items-center gap-1.5">
                                            {displayProfile.nickname}
                                            {(displayProfile.isPremium || displayProfile.role === 'admin' || displayProfile.role === 'gm') && (
                                                <CrownIcon className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_4px_rgba(234,179,8,0.6)]" />
                                            )}
                                        </h2>
                                    </div>
                                    <button onClick={() => isOwnProfile && clan && setClanModalOpen(true)} disabled={!isOwnProfile || !clan} className="mt-0.5 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl py-1.5 px-4 inline-flex flex-col items-center hover:bg-black/70 transition-colors disabled:cursor-default">
                                        <span className="text-sm font-bold text-white">{clanName}</span>
                                        <span className="text-xs text-gray-400">{currentClanRank?.name || 'N/A'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="px-4 pb-0 w-full">
                                {!isBasicMode && displayProfile.bannerUrl ? (
                                    <div className="relative group mb-0 -my-1 px-4 flex items-center justify-center">
                                        <img src={displayProfile.bannerUrl} alt="Banner" className="mx-auto h-16 object-contain scale-115" crossOrigin="anonymous" />
                                        {isEditing && isOwnProfile && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer z-10" onClick={() => setBannerModalOpen(true)}>
                                                <EditIcon className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ) : !isBasicMode && isEditing && isOwnProfile ? (
                                    <div className="mb-1 w-full cursor-pointer group" onClick={() => setBannerModalOpen(true)}>
                                        <div className="border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center p-4 group-hover:bg-white/5 group-hover:border-white/40 transition-all">
                                            <PlusIcon className="w-6 h-6 text-gray-400 mb-1 group-hover:text-white" />
                                            <span className="text-xs text-gray-400 font-bold uppercase group-hover:text-white">Adicionar Banner</span>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="space-y-1">
                                    <div className="flex bg-black/30 backdrop-blur-sm rounded-xl p-0.5 border border-white/5 mb-1 relative z-20">
                                        <button
                                            onClick={() => setActiveWidgetTab('mural')}
                                            className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${activeWidgetTab === 'mural' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            {isBasicMode ? 'Métricas' : 'Mural'}
                                        </button>
                                        {!isBasicMode && (
                                            <button
                                                onClick={() => setActiveWidgetTab('maestria')}
                                                className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ${activeWidgetTab === 'maestria' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                Maestria
                                            </button>
                                        )}
                                    </div>

                                    {/* Tab Content */}
                                    {activeWidgetTab === 'mural' || isBasicMode ? (
                                        isEditing && isOwnProfile ? (
                                            <div className="bg-black/30 backdrop-blur-sm p-1.5 rounded-2xl border border-white/5 w-full">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Widgets Visíveis ({editableProfile.visibleWidgets?.length || 0}/6)</span>
                                                </div>
                                                <div className="grid grid-cols-6 gap-1.5">
                                                    {assets.flatMap(a => a.slots).map(slot => {
                                                        const isSelected = editableProfile.visibleWidgets?.includes(slot.id);
                                                        return (
                                                            <button
                                                                key={slot.id}
                                                                onClick={() => handleWidgetToggle(slot.id)}
                                                                className={`col-span-2 aspect-square rounded-xl border flex flex-col items-center justify-center p-1.5 gap-1 transition-all ${isSelected
                                                                    ? 'bg-white/10 border-[var(--skin-accent-color)] text-white'
                                                                    : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                <span className="text-[8px] font-bold uppercase tracking-wider">{slot.label}</span>
                                                                {isSelected && <div className="w-2 h-2 rounded-full bg-[var(--skin-accent-color)] shadow-[0_0_5px_var(--skin-accent-color)]" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-black/30 backdrop-blur-sm p-1.5 rounded-2xl border border-white/5 w-full">
                                                {displayProfile.visibleWidgets.length > 0 && !isBasicMode ? (
                                                    <div className="grid grid-cols-6 gap-0.5">
                                                        {displayProfile.visibleWidgets.map(slotId => {
                                                            const slot = getSlotById(slotId);
                                                            if (!slot) return null;
                                                            return <ProfileSlotWidget key={slotId} slot={slot} />
                                                        })}
                                                    </div>
                                                ) : isBasicMode ? (
                                                    <div className="space-y-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-center">
                                                                <div className="text-[8px] uppercase tracking-wider text-gray-500">Nível Geral</div>
                                                                <div className="text-2xl font-bold text-[var(--skin-accent-color)]">{displayProfile.level}</div>
                                                            </div>
                                                            <div className="bg-black/20 p-2 rounded-xl border border-white/5 text-center">
                                                                <div className="text-[8px] uppercase tracking-wider text-gray-500">Progresso</div>
                                                                <div className="text-2xl font-bold text-white">{isOwnProfile ? `${cycleProgress.toFixed(0)}%` : '94%'}</div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-[10px] font-bold text-gray-400">Progresso do Ciclo</span>
                                                                <span className="text-[10px] font-bold text-white">12/30 dias</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                                <div className="h-full bg-[var(--skin-accent-color)] w-[40%]"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-center text-sm text-gray-500 py-4">Nenhum widget visível.</p>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <div className="bg-black/30 backdrop-blur-sm p-1 rounded-2xl border border-white/5 w-full flex items-center justify-center">
                                            <Suspense fallback={<div className="w-[220px] h-[220px]" />}>
                                                <AssetDecagon
                                                    assets={assets}
                                                    tempLevels={!isOwnProfile ? viewedLevels : undefined}
                                                    size={220}
                                                />
                                            </Suspense>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Unified Sovereign Display - Hidden in Basic Mode */}
                        {!isBasicMode && displayProfile.sovereign && (
                            <UnifiedSovereignDisplay
                                sovereignConfig={displayProfile.sovereign}
                                onClick={() => setIsSovereignModalOpen(true)}
                                className="absolute top-[60px] right-4 w-[70px] h-[95px]"
                            />
                        )}
                    </GlassCard>
                </div>
            </div>
            {isAvatarModalOpen && <AvatarUploadModal currentAvatar={editableProfile.avatarUrl} onSave={handleAvatarSelect} onClose={() => setIsAvatarModalOpen(false)} />}
            {isBorderModalOpen && (
                <Portal>
                    <BorderSelectionModal
                        currentBorder={editableProfile.border}
                        onSelect={handleBorderSelect}
                        onClose={() => setBorderModalOpen(false)}
                    />
                </Portal>
            )}
            {isBackgroundModalOpen && (
                <Portal>
                    <BackgroundImageSelectionModal
                        currentBackground={editableProfile.backgroundUrl}
                        onSelect={handleBackgroundSelect}
                        onClose={() => setBackgroundModalOpen(false)}
                    />
                </Portal>
            )}
            {isBannerModalOpen && (
                <Portal>
                    <BannerSelectionModal
                        currentBanner={editableProfile.bannerUrl || ''}
                        onSelect={handleBannerSelect}
                        onClose={() => setBannerModalOpen(false)}
                    />
                </Portal>
            )}
            {isClanModalOpen && clan && <ClanDetailModal clanName={clan.name} onClose={() => setClanModalOpen(false)} />}
            {isSovereignModalOpen && (
                <SovereignCustomizer
                    initialConfig={userProfile.sovereign}
                    onSave={(newConfig) => {
                        updateUserProfile({ sovereign: newConfig });
                        setIsSovereignModalOpen(false);
                    }}
                    onClose={() => setIsSovereignModalOpen(false)}
                />
            )}
        </Portal>
    );
};
