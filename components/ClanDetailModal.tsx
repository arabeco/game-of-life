
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GlassCard } from './GlassCard';
import { XIcon, CheckIcon, UsersIcon, DoorIcon, ChevronDownIcon } from './Icons';
import { useGame } from '../contexts/GameContext';
import { Arena, UserProfile, EnrichedClanMember, SeasonQuest, AldeiaSlot, AldeiaPresence, AldeiaSlotId } from '../types';
import { Sovereign } from './Avatar';
import { ClanManagementModal } from './ClanManagementModal';
import { ConfirmationModal } from './ConfirmationModal';
import { TransferLeadershipModal } from './TransferLeadershipModal';
import { ClanMemberCard } from './ClanMemberCard';
import { AddClanMemberModal } from './AddClanMemberModal';
import { BackgroundImageSelectionModal } from './BackgroundImageSelectionModal';
import { DEFAULT_SANCTUARY_BACKGROUND, SANCTUARY_BACKGROUND_OPTIONS } from '../constants';

const ALDEIA_SLOTS: { id: AldeiaSlotId; label: string; x: number; y: number }[] = [
  { id: 'fogueira', label: 'Fogueira', x: 50, y: 55 },
  { id: 'torre',    label: 'Torre',    x: 20, y: 40 },
  { id: 'altar',    label: 'Altar',    x: 80, y: 40 },
  { id: 'forja',    label: 'Forja',    x: 75, y: 70 },
  { id: 'horta',    label: 'Horta',    x: 25, y: 70 },
  { id: 'trono',    label: 'Trono',    x: 50, y: 28 },
];

const getTierInfo = (rankIndex: number) => {
    if (rankIndex >= 9) return { name: 'Cidadela', tier: 4, description: 'Uma fortaleza impenetrável onde o poder divino toca a terra.' };
    if (rankIndex >= 6) return { name: 'Fortaleza', tier: 3, description: 'Muralhas de pedra protegem o legado do clã.' };
    if (rankIndex >= 3) return { name: 'Aldeia', tier: 2, description: 'Uma comunidade próspera com estruturas permanentes.' };
    return { name: 'Acampamento', tier: 1, description: 'Um refúgio temporário para guerreiros em jornada.' };
};

const getClanBackgroundUrl = (rankIndex: number) => {
    const baseUrl = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/';
    // Map rank index (0-based) to background images
    // 0, 1 (Lvl 1-2) -> land01
    // 2, 3 (Lvl 3-4) -> land02
    // 4, 5 (Lvl 5-6) -> land03
    // 6, 7 (Lvl 7-8) -> land04
    // 8, 9 (Lvl 9-10) -> land05
    
    if (rankIndex >= 8) return `${baseUrl}land05.jpg`;
    if (rankIndex >= 6) return `${baseUrl}land04.jpg`;
    if (rankIndex >= 4) return `${baseUrl}land03.jpg`;
    if (rankIndex >= 2) return `${baseUrl}land02.jpg`;
    return `${baseUrl}land01.jpg`;
};


// --- Visual Effects ---
const Sparkles: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
            <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.5 + 0.2,
                    animationDuration: `${1 + Math.random() * 2}s`,
                    animationDelay: `${Math.random() * 2}s`,
                }}
            />
        ))}
        {[...Array(5)].map((_, i) => (
            <div
                key={`gold-${i}`}
                className="absolute w-1.5 h-1.5 bg-[var(--skin-accent-color)] rounded-full animate-ping"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.4,
                    animationDuration: `${2 + Math.random() * 3}s`,
                    animationDelay: `${Math.random() * 5}s`,
                }}
            />
        ))}
    </div>
);

const SovereignDetailModal: React.FC<{ member: EnrichedClanMember; onClose: () => void }> = ({ member, onClose }) => {
    if (!member.sovereign) return null;
    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <GlassCard variant="accent" className="w-full max-w-sm m-4 p-6 relative flex flex-col items-center space-y-4" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/20 text-gray-400 hover:text-white transition-colors">
                    <XIcon className="w-5 h-5" />
                </button>
                
                <div className="w-32 h-32 relative">
                     <div className="absolute inset-0 bg-[var(--skin-accent-color)]/20 blur-2xl rounded-full animate-pulse" />
                     <div className="relative w-full h-full filter drop-shadow-[0_0_15px_var(--sephirot-glow-color)]">
                        <Sovereign sovereignConfig={member.sovereign!} />
                     </div>
                </div>

                <div className="text-center space-y-1">
                    <h2 className="text-2xl font-black text-white luxe-title-shadow uppercase tracking-wider">{member.nickname}</h2>
                    <div className="flex items-center justify-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold uppercase tracking-wider accent-text border border-[var(--skin-accent-color)]/30">
                            {member.role === 'leader' ? 'Líder' : 'Membro'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold uppercase tracking-wider text-gray-300 border border-white/10">
                            Nível {member.level}
                        </span>
                    </div>
                </div>

                <div className="w-full bg-black/20 rounded-xl p-4 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase">Humor Atual</span>
                        <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: member.mood >= 80 ? '#4ade80' : member.mood >= 40 ? '#facc15' : '#f87171' }} />
                            <span className="font-mono text-white">{member.mood}%</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase">Contribuição</span>
                        <span className="font-mono accent-text">{member.contributionPoints} pts</span>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

// --- Types ---
type ClanDetailTab = 'santuario' | 'membros' | 'missoes';

// --- Sub-components ---

const ClanHeader: React.FC<{ userClanRole?: 'leader' | 'member'; expandDescription?: boolean }> = ({ userClanRole, expandDescription }) => {
    const { clan, clanRanks, updateClan } = useGame();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editableDescription, setEditableDescription] = useState(clan?.description || '');
    
    useEffect(() => {
        if (expandDescription) setIsExpanded(true);
    }, [expandDescription]);
    
    if (!clan) return null;
    const currentRank = clanRanks.find(r => r.id === clan.rankId);
    const nextRankIndex = clanRanks.findIndex(r => r.id === clan.rankId) + 1;
    const nextRank = clanRanks[nextRankIndex];
    const expForCurrentRank = currentRank?.expRequired || 0;
    const expForNextRank = nextRank?.expRequired || expForCurrentRank;
    const progressInRank = clan.exp - expForCurrentRank;
    const expToNextRank = expForNextRank - expForCurrentRank;
    const rawPercentage = expToNextRank > 0 ? (progressInRank / expToNextRank) * 100 : 100;
    const progressPercentage = Math.floor(Math.max(0, Math.min(100, rawPercentage)));

    const handleSaveDescription = async () => {
        if (!clan) return;
        await updateClan(clan.id, { description: editableDescription });
        setIsEditingDescription(false);
    };

    return (
        <div className="relative w-full px-4 pt-4 pb-0 z-30">
            <GlassCard variant="neutral" className="p-2 space-y-1">
                <div className="text-center">
                    <h2 className="text-lg font-black text-white luxe-title-shadow">{clan.name}</h2>
                    <p className="text-xs text-gray-300 font-bold">{currentRank?.name || 'N/A'}</p>
                </div>
                <div className="w-full bg-black/30 rounded-full h-1.5 mt-1">
                    <div className="bg-[var(--skin-accent-color)] h-full rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                 <div className="flex items-center justify-center space-x-4 border-t border-white/10 pt-1 mt-1">
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)} 
                        className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
                    >
                        <span>{isExpanded ? 'Ocultar' : 'Ver'} descrição</span>
                        <ChevronDownIcon className={`w-4 h-4 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && userClanRole === 'leader' && (
                        <>
                            <div className="w-px h-3 bg-white/20"></div>
                            {isEditingDescription ? (
                                <button onClick={handleSaveDescription} className="text-xs font-bold text-green-400">Salvar</button>
                            ) : (
                                <button onClick={() => { setIsEditingDescription(true); setEditableDescription(clan.description); }} className="text-xs text-gray-400 hover:text-white">Editar</button>
                            )}
                        </>
                    )}
                </div>
                {isExpanded && (
                    <div className="text-xs text-gray-300 text-center pt-1">
                        {isEditingDescription ? (
                             <textarea
                                value={editableDescription}
                                onChange={(e) => setEditableDescription(e.target.value)}
                                className="w-full bg-black/30 p-2 rounded-lg text-xs text-white"
                                rows={3}
                            />
                        ) : (
                            <p>{clan.description}</p>
                        )}
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

const ClanMissionDetailModal: React.FC<{ quest: SeasonQuest; progress: number; isActive: boolean; onClose: () => void; onTake: () => void; onClaim?: () => void; canClaim?: boolean; currentValue: number }> = ({ quest, progress, isActive, onClose, onTake, onClaim, canClaim, currentValue }) => {
    const { fetchClanQuestParticipants, clanQuestParticipants } = useGame();
    
    useEffect(() => {
        if (quest.id && quest.actionTemplate?.name) {
            fetchClanQuestParticipants(quest.id, quest.actionTemplate.name);
        }
    }, [quest.id, quest.actionTemplate?.name, fetchClanQuestParticipants]);

    const participants = clanQuestParticipants[quest.id] || 0;
    const actionsRemaining = Math.max(0, quest.goal_value - currentValue);
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[230] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl p-4" onClick={e => e.stopPropagation()}>
                <div className="text-center space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-widest">{quest.title}</h3>
                    <p className="text-xs text-gray-300">{quest.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-black/30 rounded-xl p-2">
                        <div className="text-[10px] uppercase text-gray-400 font-bold">Participantes</div>
                        <div className="text-lg font-mono accent-text flex items-center justify-center gap-1">
                            <UsersIcon className="w-4 h-4" />
                            {participants}
                        </div>
                    </div>
                     <div className="bg-black/30 rounded-xl p-2">
                        <div className="text-[10px] uppercase text-gray-400 font-bold">Ações Restantes</div>
                        <div className="text-lg font-mono text-white">
                            {actionsRemaining}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Progresso</span>
                        <span className="text-xs font-mono">{progress}%</span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-1.5">
                        <div className="bg-[var(--skin-accent-color)] h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <div className="space-y-2">
                    {canClaim ? (
                        <button onClick={onClaim} className="w-full py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse">
                            RESGATAR RECOMPENSA
                        </button>
                    ) : (
                        <button onClick={onTake} disabled={isActive} className={`w-full py-2 rounded-xl text-xs font-bold ${isActive ? 'bg-white/10 text-gray-400' : 'luxe-skin-button'}`}>
                            {isActive ? 'QUEST ATIVA' : 'PEGAR QUEST'}
                        </button>
                    )}
                    <button onClick={onClose} className="w-full py-2 rounded-xl text-xs font-bold bg-black/30 text-gray-300 hover:bg-black/50">
                        FECHAR
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

const AldeiaStats: React.FC<{ slots: AldeiaSlot[] }> = ({ slots }) => {
    const mainSlots = slots.filter(s => s.slotId !== 'trono');
    // const order = mainSlots.length > 0 ? Math.floor(mainSlots.reduce((acc, s) => acc + s.health, 0) / mainSlots.length) : 0;
    
    return (
        <GlassCard variant="neutral" className="p-3 space-y-2">
            {/* Order Bar moved to Sanctuary Tab */}
            <div className="text-center text-xs text-gray-400 mb-2">Saúde Individual dos Slots</div>
            <div className="grid grid-cols-5 gap-1 pt-1">
                {mainSlots.map(slot => (
                    <div key={slot.slotId} className="flex flex-col items-center space-y-1">
                        <div className="text-[8px] uppercase text-gray-500">{slot.slotId.substring(0, 3)}</div>
                        <div className="w-full bg-black/30 rounded-full h-1">
                            <div 
                                className={`h-full rounded-full ${slot.health >= 70 ? 'bg-green-500' : 'bg-red-500'}`} 
                                style={{ width: `${slot.health}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

// --- Main Modal ---

export const ClanDetailModal: React.FC<{ clanName: string; onClose: () => void; }> = ({ clanName, onClose }) => {
    const { userProfile, enrichedClanMembers, clanJoinRequestsIncoming, approveClanJoinRequest, rejectClanJoinRequest, leaveClan, kickClanMember, transferLeadershipAndLeave, deleteClan, clan, clanRanks, seasons, seasonQuests, getClanQuestProgress, updateClan, tasks, assets, getArenas, getActionsForArena, addArena, addAction, loadClanAndMembers, acceptSeasonQuest, claimSeasonQuestReward, showToast, getAldeiaSlots, getAldeiaPresence, enterAldeiaSlot, performAldeiaDailyUpdate } = useGame();
    const [activeTab, setActiveTab] = useState<ClanDetailTab>('santuario');
    const enrichedClanMembersRef = useRef(enrichedClanMembers);
    
    // Aldeia State
    const [aldeiaSlots, setAldeiaSlots] = useState<AldeiaSlot[]>([]);
    const [aldeiaPresence, setAldeiaPresence] = useState<AldeiaPresence[]>([]);

    useEffect(() => {
        if (!clan?.id) return;
        
        // Perform daily update logic on mount
        performAldeiaDailyUpdate(clan.id);

        const loadAldeiaData = async () => {
            const slots = await getAldeiaSlots(clan.id);
            setAldeiaSlots(slots);
            const presence = await getAldeiaPresence(clan.id);
            setAldeiaPresence(presence);
        };

        loadAldeiaData();
        const interval = setInterval(loadAldeiaData, 5000);
        return () => clearInterval(interval);
    }, [clan?.id, performAldeiaDailyUpdate, getAldeiaSlots, getAldeiaPresence]);

    // Calculate Rank and Tier
    const currentRank = clanRanks.find(r => r.id === clan?.rankId);
    const rankIndex = clanRanks.findIndex(r => r.id === clan?.rankId);
    const tierInfo = getTierInfo(rankIndex !== -1 ? rankIndex : 0);

    // Calculate Aldeia Order (Average Health of 5 main slots)
    const aldeiaOrder = useMemo(() => {
        if (aldeiaSlots.length === 0) return 0;
        const mainSlots = aldeiaSlots.filter(s => s.slotId !== 'trono');
        if (mainSlots.length === 0) return 0;
        const totalHealth = mainSlots.reduce((acc, s) => acc + s.health, 0);
        return Math.floor(totalHealth / mainSlots.length);
    }, [aldeiaSlots]);

    // Handle Slot Click
    const handleSlotClick = async (slotId: AldeiaSlotId) => {
        if (!clan?.id) return;
        
        // If it's the Throne, check if user is leader and Order is 100%
        if (slotId === 'trono') {
            const isLeader = enrichedClanMembers.find(m => m.id === userProfile.id)?.role === 'leader';
            
            if (!isLeader) {
                showToast("Apenas o líder pode sentar no trono.");
                return;
            }
            if (aldeiaOrder < 90) {
                showToast("O trono só está disponível quando a Ordem da Aldeia é maior que 90%.");
                return;
            }
        }

        await enterAldeiaSlot(clan.id, slotId);
        // Refresh data immediately
        const presence = await getAldeiaPresence(clan.id);
        setAldeiaPresence(presence);
        const slots = await getAldeiaSlots(clan.id);
        setAldeiaSlots(slots);
        showToast(`Você entrou em: ${ALDEIA_SLOTS.find(s => s.id === slotId)?.label}`);
    };

    const [subModal, setSubModal] = useState<'manage' | 'leave' | 'transfer' | null>(null);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [memberToKick, setMemberToKick] = useState<EnrichedClanMember | null>(null);
    const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<EnrichedClanMember | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<SeasonQuest | null>(null);
    const [expandDescription, setExpandDescription] = useState(false);
    
    const userClanRole = useMemo(() => {
        return enrichedClanMembers.find(m => m.id === userProfile.id)?.role;
    }, [enrichedClanMembers, userProfile.id]);

    const activeSeason = seasons.find(s => s.is_active);
    const todayString = new Date().toISOString().split('T')[0];
    // const canEditBackground = !!activeSeason && activeSeason.start_date === todayString;
    // const sanctuaryBackground = clan?.backgroundUrl || DEFAULT_SANCTUARY_BACKGROUND;
    const sanctuaryBackground = getClanBackgroundUrl(rankIndex !== -1 ? rankIndex : 0);

    const handleLeaveRequest = () => {
        if (userClanRole === 'leader' && enrichedClanMembers.length > 1) {
            setSubModal('transfer');
        } else {
            setSubModal('leave');
        }
    };
    
    const handleConfirmLeave = async () => {
        if (userClanRole === 'leader' && enrichedClanMembers.length === 1) {
            await deleteClan();
        } else {
            await leaveClan();
        }
        setSubModal(null);
        onClose();
    };

    const handleConfirmTransfer = async (newLeaderId: string) => {
        await transferLeadershipAndLeave(newLeaderId);
        setSubModal(null);
        onClose();
    };

    const handleKickMember = async () => {
        if(memberToKick) {
            await kickClanMember(memberToKick.id);
            setMemberToKick(null);
        }
    };

    const handleBackgroundSelect = async (value: string) => {
        if (!clan || !canEditBackground) return;
        await updateClan(clan.id, { backgroundUrl: value });
        setIsBackgroundModalOpen(false);
    };
    
    const clanQuests = activeSeason ? seasonQuests.filter(q => q.season_id === activeSeason.id && q.scope === 'clan') : [];
    const questArenaName = activeSeason ? `Quests - Clã ${activeSeason.id}` : 'Quests - Clã';

    const isQuestActive = (quest: SeasonQuest) => {
        const arena = getArenas().find(arena => arena.name === questArenaName);
        if (!arena) return false;
        return getActionsForArena(arena.id).some(action => action.name === quest.title || action.name === quest.actionTemplate?.name);
    };

    const getQuestRawProgress = (quest: SeasonQuest) => {
        return getClanQuestProgress(quest.id);
    };

    const getQuestProgress = (quest: SeasonQuest) => {
        const completed = getClanQuestProgress(quest.id);
        if (quest.goal_value > 0) return Math.floor(Math.min(100, Math.max(0, (completed / quest.goal_value) * 100)));
        return Math.min(100, completed);
    };

    const handleTakeQuest = (quest: SeasonQuest) => {
        acceptSeasonQuest(quest.id);
        setSelectedQuest(null);
    };

    const handleClaimQuest = (quest: SeasonQuest) => {
        if (userProfile.completedSeasonMissions?.includes(quest.id)) return;
        claimSeasonQuestReward(quest.id);

        const xp = quest.rewards.xp;
        const items = quest.rewards.items || [];
        let msg = `✦ +${xp} XP computados`;
        if (items.length > 0) {
            msg = `✦ ${items.join(', ')} adicionado ao inventário · +${xp} XP computados`;
        }
        showToast(msg);
        setSelectedQuest(null);
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <div className="relative w-full max-w-sm m-4 aspect-[9/16] rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-cover bg-center border border-white/10 flex flex-col" style={{ backgroundImage: `url('${sanctuaryBackground}')` }}>
                        
                        {/* Header Section */}
                        <div className="flex-none relative">
                            <ClanHeader userClanRole={userClanRole} expandDescription={expandDescription} />
                            
                            {/* Header Actions */}
                            <button onClick={onClose} className="absolute top-4 right-4 z-40 p-1 rounded-full bg-black/50 hover:bg-black/80"><XIcon className="w-5 h-5"/></button>
                            {/* {userClanRole === 'leader' && (
                                <button
                                    onClick={() => canEditBackground && setIsBackgroundModalOpen(true)}
                                    disabled={!canEditBackground}
                                    className={`absolute top-4 left-4 z-40 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${canEditBackground ? 'bg-black/50 text-white hover:bg-black/80' : 'bg-black/30 text-gray-400 cursor-not-allowed'}`}
                                >
                                    {canEditBackground ? 'Editar Fundo' : 'Fundo Bloqueado'}
                                </button>
                            )} */}
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 relative min-h-0">
                            {activeTab === 'santuario' && (
                                <div className="absolute inset-0 overflow-hidden">
                                    <Sparkles />
                                    {/* Background Placeholder - To be replaced by Tier Image */}
                                    {/* <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800" /> */}
                                    <div className={`absolute inset-0 transition-colors duration-1000 ${tierInfo.tier === 1 ? 'bg-amber-900/10' : tierInfo.tier === 2 ? 'bg-emerald-900/10' : tierInfo.tier === 3 ? 'bg-slate-900/20' : 'bg-purple-900/10'}`} />
                                    
                                    {/* Tier Label */}
                                    {/* <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-center z-10">
                                        <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Nível da Aldeia</div>
                                        <div className="text-sm font-black text-white luxe-title-shadow">{tierInfo.name}</div>
                                    </div> */}

                                    {/* Slots */}
                                    {ALDEIA_SLOTS.map(slot => {
                                        const slotData = aldeiaSlots.find(s => s.slotId === slot.id);
                                        const health = slotData?.health ?? 100;
                                        const occupants = aldeiaPresence.filter(p => p.slotId === slot.id);
                                        
                                        // Visual health (brightness/opacity)
                                        // 80-100: 1, 50-79: 0.8, 20-49: 0.6, 0-19: 0.4, 0: 0.2
                                        let opacity = 0.2;
                                        if (health >= 80) opacity = 1;
                                        else if (health >= 50) opacity = 0.8;
                                        else if (health >= 20) opacity = 0.6;
                                        else if (health > 0) opacity = 0.4;

                                        // Hide Throne if Order is not 100
                                        // if (slot.id === 'trono' && aldeiaOrder < 100) return null;
                                        const isThroneDisabled = slot.id === 'trono' && aldeiaOrder < 90;

                                        return (
                                            <div
                                                key={slot.id}
                                                className={`absolute w-24 h-24 -ml-12 -mt-12 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 z-10 ${isThroneDisabled ? 'opacity-50 grayscale cursor-not-allowed hover:scale-100' : ''}`}
                                                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                                                onClick={() => !isThroneDisabled && handleSlotClick(slot.id)}
                                            >
                                                {/* Occupants Avatars - MOVED TO TOP */}
                                                <div className="relative h-16 w-full flex justify-center items-end -mb-2 z-20">
                                                    {occupants.map((presence, idx) => {
                                                        const member = enrichedClanMembers.find(m => m.id === presence.userId);
                                                        if (!member) return null;
                                                        
                                                        // Force "Boneco" Config
                                                        const forceBodyConfig = member.sovereign ? {
                                                            ...member.sovereign,
                                                            glyph: 'none',
                                                            artifact: 'none',
                                                            glyphPlate: 'none',
                                                            artifactPlate: 'none',
                                                            aura: 'none',
                                                            sovereignPlate: 'none',
                                                            orb: 'none',
                                                            primaryDisplay: 'sovereign' as const
                                                        } : undefined;

                                                        // Stagger multiple occupants
                                                        const offset = (idx - (occupants.length - 1) / 2) * 20;
                                                        
                                                        return (
                                                            <div 
                                                                key={presence.userId}
                                                                className="absolute bottom-0 transition-all duration-500 hover:z-50 hover:scale-110 flex flex-col items-center"
                                                                style={{ transform: `translateX(${offset}px)` }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedMember(member);
                                                                }}
                                                            >
                                                                {/* Circular Base (Subtle) */}
                                                                <div className="absolute bottom-1 w-10 h-3 bg-white/10 rounded-[100%] blur-[2px] shadow-[0_0_10px_rgba(255,255,255,0.1)] pointer-events-none" />

                                                                <div className="w-12 h-16 filter drop-shadow-lg pointer-events-none relative z-10">
                                                                    {/* FORCE SOVEREIGN DISPLAY ALWAYS */}
                                                                    {forceBodyConfig ? (
                                                                        <Sovereign sovereignConfig={forceBodyConfig} />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gray-500 rounded-full flex items-center justify-center text-xs">
                                                                            {member.nickname.substring(0, 2)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Nametag */}
                                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/70 px-1.5 py-0.5 rounded text-[8px] whitespace-nowrap text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                                                                    {member.nickname}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Slot Label (Transparent) */}
                                                <div className="mb-0.5 z-10 flex flex-col items-center">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-white shadow-black drop-shadow-md">
                                                        {slot.label}
                                                    </span>
                                                    
                                                    {/* Health Bar - Fixed below text, discrete */}
                                                    {slot.id !== 'trono' && (
                                                        <div className="w-12 h-1 bg-black/50 rounded-full overflow-hidden mt-0.5 backdrop-blur-[1px]">
                                                            <div 
                                                                className={`h-full transition-all duration-500 ${health < 30 ? 'bg-red-500' : 'bg-[var(--metal-gold)]'}`}
                                                                style={{ width: `${health}%`, opacity: 0.8 }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Aldeia Order Bar - Moved to Bottom */}
                                    <div className="absolute bottom-4 left-4 right-4 z-20">
                                        <div className="p-1">
                                            <div className="flex items-center justify-between mb-1 px-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white shadow-black drop-shadow-md">Ordem da Aldeia</span>
                                                <span className={`text-xs font-mono font-bold shadow-black drop-shadow-md ${aldeiaOrder >= 70 ? 'text-[var(--metal-gold)]' : aldeiaOrder >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{aldeiaOrder}%</span>
                                            </div>
                                            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${aldeiaOrder >= 70 ? 'bg-[var(--metal-gold)]' : aldeiaOrder >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                    style={{ width: `${aldeiaOrder}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {activeTab === 'membros' && (
                                <div className="absolute inset-0 px-4 overflow-y-auto space-y-2 hide-scrollbar pt-4">
                                    {userClanRole === 'leader' && (
                                        <div className="flex space-x-2 mb-4 p-2 bg-black/20 rounded-xl sticky top-0 z-10 backdrop-blur-sm">
                                            <button onClick={() => setSubModal('manage')} className="w-full py-2 text-sm rounded-lg luxe-button-secondary">Editar Clã</button>
                                            <button onClick={() => setIsAddMemberModalOpen(true)} className="w-full py-2 text-sm rounded-lg luxe-button-secondary">Convidar</button>
                                        </div>
                                    )}
                                    {userClanRole === 'leader' && clanJoinRequestsIncoming.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-2 text-xs text-gray-300">
                                                <span className="font-bold uppercase tracking-wider">Pedidos</span>
                                                <span>{clanJoinRequestsIncoming.length} pendentes</span>
                                            </div>
                                            {clanJoinRequestsIncoming.map(request => {
                                                const nickname = request.requesterProfile?.nickname || 'Soberano';
                                                const initial = nickname.charAt(0).toUpperCase();
                                                return (
                                                    <div key={request.id} className="bg-black/20 p-3 rounded-2xl flex items-center space-x-3 border border-white/10">
                                                        <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-gray-800 flex items-center justify-center text-sm font-bold">
                                                            {initial}
                                                        </div>
                                                        <div className="flex-grow">
                                                            <div className="flex items-center space-x-2">
                                                                <h4 className="font-bold text-white">{nickname}</h4>
                                                            </div>
                                                            <p className="text-xs text-gray-400">Solicitou entrada no clã</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <button onClick={() => approveClanJoinRequest(request)} className="p-2 rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30">
                                                                <CheckIcon className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => rejectClanJoinRequest(request)} className="p-2 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30">
                                                                <XIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between px-2 text-xs text-gray-300">
                                        <span className="font-bold uppercase tracking-wider">Membros</span>
                                        <span>{enrichedClanMembers.length} total</span>
                                    </div>
                                    {enrichedClanMembers.map(member => (
                                        <ClanMemberCard 
                                            key={member.id}
                                            member={member}
                                            isLeaderView={userClanRole === 'leader'}
                                            onKick={setMemberToKick}
                                        />
                                    ))}
                                     <div className="mt-6 flex flex-col items-center space-y-2 text-center">
                                        <button onClick={handleLeaveRequest} className="text-sm font-bold text-red-400 hover:text-red-300">Sair do Clã</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'missoes' && (
                                <div className="absolute inset-0 px-4 overflow-y-auto hide-scrollbar pt-4">
                                    <div className="space-y-3">
                                        {/* <AldeiaStats slots={aldeiaSlots} /> */}
                                        <div className="text-center text-xs font-bold uppercase tracking-wider text-gray-300">
                                            Quests do Clã
                                        </div>
                                    </div>
                                    {clanQuests.length === 0 && (
                                        <GlassCard variant="neutral" className="p-4 text-center text-sm text-gray-300">
                                            Nenhuma quest de clã ativa nesta season.
                                        </GlassCard>
                                    )}
                                    {clanQuests.map(quest => {
                                        const progress = getQuestProgress(quest);
                                        const isCompleted = progress >= 100;

                                        return (
                                            <GlassCard key={quest.id} variant={isCompleted ? 'accent' : 'neutral'} className={`p-4 transition-all duration-300 cursor-pointer ${isCompleted ? 'border-[var(--skin-accent-color)] shadow-[0_0_15px_var(--sephirot-glow-color)]' : ''}`} onClick={() => setSelectedQuest(quest)}>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold text-sm w-2/3">{quest.title}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs font-mono">{progress}%</span>
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)] text-black' : 'border-gray-500'}`}>
                                                                {isCompleted && <CheckIcon className="w-4 h-4" />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-[var(--skin-accent-color)]' : 'bg-gray-500'}`} style={{width: `${progress}%`}}></div>
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        {/* Footer Navigation */}
                        <div className="flex-none p-4 z-30 bg-gradient-to-t from-black/80 to-transparent">
                            <GlassCard variant="neutral" className="p-1">
                                <div className="flex items-center justify-center space-x-1 bg-black/20 p-1 rounded-2xl">
                                    <button onClick={() => setActiveTab('santuario')} className={`w-full py-2 text-sm font-bold rounded-lg ${activeTab === 'santuario' ? 'bg-white/10' : 'text-gray-400'}`}>Santuário</button>
                                    <button onClick={() => setActiveTab('membros')} className={`w-full py-2 text-sm font-bold rounded-lg ${activeTab === 'membros' ? 'bg-white/10' : 'text-gray-400'}`}>Membros</button>
                                    <button onClick={() => setActiveTab('missoes')} className={`w-full py-2 text-sm font-bold rounded-lg ${activeTab === 'missoes' ? 'bg-white/10' : 'text-gray-400'}`}>Quests</button>
                                </div>
                            </GlassCard>
                        </div>

                    </div>
                </div>
            </div>
            
            {selectedQuest && (
                <ClanMissionDetailModal 
                    quest={selectedQuest} 
                    progress={getQuestProgress(selectedQuest)}
                    currentValue={getQuestRawProgress(selectedQuest)}
                    isActive={isQuestActive(selectedQuest)}
                    onClose={() => setSelectedQuest(null)}
                    onTake={() => handleTakeQuest(selectedQuest)}
                    onClaim={() => handleClaimQuest(selectedQuest)}
                    canClaim={!userProfile.completedSeasonMissions?.includes(selectedQuest.id) && getQuestProgress(selectedQuest) >= 100}
                />
            )}
            {isAddMemberModalOpen && <AddClanMemberModal onClose={() => setIsAddMemberModalOpen(false)} />}
            {subModal === 'manage' && <ClanManagementModal onClose={() => setSubModal(null)} />}
            {/* {isBackgroundModalOpen && (
                <BackgroundImageSelectionModal
                    currentBackground={sanctuaryBackground}
                    onSelect={handleBackgroundSelect}
                    onClose={() => setIsBackgroundModalOpen(false)}
                    options={SANCTUARY_BACKGROUND_OPTIONS}
                    title="Fundo do Santuário"
                    showUpload={false}
                />
            )} */}
            {memberToKick && <ConfirmationModal title="Expulsar Membro" message={`Tem certeza que deseja expulsar ${memberToKick.nickname} do clã?`} onConfirm={handleKickMember} onCancel={() => setMemberToKick(null)} />}
            {subModal === 'leave' && (
                <ConfirmationModal 
                    title="Sair do Clã" 
                    message={userClanRole === 'leader' ? `Você é o último membro. Sair irá dissolver o clã "${clanName}". Tem certeza?` : `Tem certeza que deseja sair de ${clanName}?`}
                    onConfirm={handleConfirmLeave} 
                    onCancel={() => setSubModal(null)}
                />
            )}
            {subModal === 'transfer' && (
                <TransferLeadershipModal
                    onConfirm={handleConfirmTransfer}
                    onClose={() => setSubModal(null)}
                />
            )}
            {selectedMember && (
                <SovereignDetailModal 
                    member={selectedMember} 
                    onClose={() => setSelectedMember(null)} 
                />
            )}
        </>,
        document.body
    );
}
