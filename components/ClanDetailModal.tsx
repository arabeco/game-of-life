import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { GlassCard } from './GlassCard';
import { XIcon, CheckIcon, UsersIcon, DoorIcon, ChevronDownIcon, SendIcon } from './Icons';
import { supabase } from '../supabaseClient';
import { useGame, getLocalDateString } from '../contexts/GameContext';
import { Action, Arena, UserProfile, EnrichedClanMember, SeasonQuest, AldeiaSlot, AldeiaPresence, AldeiaSlotId, ClanCustomQuest, Notification } from '../types';
import { Sovereign } from './Avatar';
import { Portal } from './Portal';
import { ClanManagementModal } from './ClanManagementModal';
import { ConfirmationModal } from './ConfirmationModal';
import { TransferLeadershipModal } from './TransferLeadershipModal';
import { ClanMemberCard } from './ClanMemberCard';
import { ClanSlotModal } from './ClanSlotModal';
import { ArenaDetailModal } from './ArenaDetailModal';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';
import { normalizeDomainLabel } from '../utils/taskDomain.js';
import { ArenaCard } from './ArenaCard';
import { SupabaseService } from '../services/SupabaseService';
import { safeVibrate } from '../utils/safeVibrate';

const ALDEIA_SLOTS: { id: AldeiaSlotId; label: string; emoji: string; x: number; y: number; note?: string }[] = [
    { id: 'fogueira', label: 'Fogueira', emoji: '🔥', x: 42, y: 51 },
    { id: 'torre', label: 'Torre', emoji: '🏰', x: 23, y: 24 },
    { id: 'altar', label: 'Altar', emoji: '⛩️', x: 70, y: 40 },
    { id: 'forja', label: 'Forja', emoji: '⚒️', x: 75, y: 70 },
    { id: 'horta', label: 'Horta', emoji: '🌿', x: 25, y: 70 },
    { id: 'trono', label: 'Trono', emoji: '👑', x: 49, y: 32 },
];

const getTierInfo = (rankIndex: number) => {
    if (rankIndex >= 9) return { name: 'Cidadela', tier: 4, description: 'Uma fortaleza impenetravel onde o poder divino toca a terra.' };
    if (rankIndex >= 6) return { name: 'Fortaleza', tier: 3, description: 'Muralhas de pedra protegem o legado do grupo.' };
    if (rankIndex >= 3) return { name: 'Aldeia', tier: 2, description: 'Uma comunidade próspera com estruturas permanentes.' };
    return { name: 'Acampamento', tier: 1, description: 'Um refúgio temporário para guerreiros em jornada.' };
};

const getClanBackgroundUrl = (rankIndex: number, isOfficeClan: boolean = false, customBackground?: string) => {
    const baseUrl = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/user-images/';

    if (isOfficeClan) {
        // Se houver um fundo customizado (office1, office2, office3), use-o
        if (customBackground) {
            return customBackground.startsWith('http') ? customBackground : `${baseUrl}${customBackground}`;
        }
        // Default Office Background
        return `${baseUrl}office1.jpg`;
    }

    // Default / Casual behavior
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
    const { isBasicMode, clan } = useGame();
    const isOfficeClan = clan?.clanType?.toLowerCase() === 'office';
    if (!member.sovereign) return null;
    return (
        <Portal>
            <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
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
                                {member.role === 'leader' ? (isOfficeClan ? 'Diretor' : 'Lider') : 'Pessoa'}
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
        </Portal>
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
    const description = (clan.description || '').trim() || 'Sem recado do grupo registrado.';
    const hasExpandableDescription = description.length > 90 || description.includes('\n');

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
                <div className="w-full bg-black/30 rounded-full h-2 mt-1 relative group">
                    <div className="bg-[var(--skin-accent-color)] h-full rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <div className="text-[10px] text-center text-gray-400 font-mono mt-0.5">
                    {Math.floor(progressInRank)} / {expToNextRank} XP
                </div>
                <div className="border-t border-white/10 pt-2 mt-1">
                    {isEditingDescription ? (
                        <textarea
                            value={editableDescription}
                            onChange={(e) => setEditableDescription(e.target.value)}
                            className="w-full bg-black/30 p-2 rounded-lg text-xs text-white"
                            rows={3}
                        />
                    ) : (
                        <p className={`text-xs text-gray-300 text-center ${!isExpanded ? 'line-clamp-1' : ''}`}>
                            {description}
                        </p>
                    )}

                    <div className="mt-2 flex items-center justify-center gap-3">
                        {hasExpandableDescription && !isEditingDescription && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-[11px] text-gray-400 hover:text-white flex items-center space-x-1"
                            >
                                <span>{isExpanded ? 'Mostrar menos' : 'Mostrar mais'}</span>
                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                        {userClanRole === 'leader' && (
                            <>
                                {hasExpandableDescription && !isEditingDescription && <div className="w-px h-3 bg-white/20"></div>}
                                {isEditingDescription ? (
                                    <button onClick={handleSaveDescription} className="text-xs font-bold text-green-400">Salvar</button>
                                ) : (
                                    <button onClick={() => { setIsEditingDescription(true); setEditableDescription(clan.description); }} className="text-[11px] text-gray-400 hover:text-white">Editar</button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

const ClanMissionDetailModal: React.FC<{ quest: SeasonQuest; progress: number; isActivatedForClan: boolean; isJoinedByUser: boolean; onClose: () => void; onTake: () => void; onActivate?: () => void; onClaim?: () => void; canClaim?: boolean; currentValue: number }> = ({ quest, progress, isActivatedForClan, isJoinedByUser, onClose, onTake, onActivate, onClaim, canClaim, currentValue }) => {
    const { fetchClanQuestParticipants, clanQuestParticipants } = useGame();

    useEffect(() => {
        if (quest.id && quest.actionTemplate?.name) {
            fetchClanQuestParticipants(quest.id, quest.actionTemplate.name);
        }
    }, [quest.id, quest.actionTemplate?.name, fetchClanQuestParticipants]);

    const participants = clanQuestParticipants[quest.id] || 0;
    const targetValue = quest.requirements?.clanGoal || quest.goal_value || quest.actionTemplate?.repetitions || 1;
    const actionsRemaining = Math.max(0, targetValue - currentValue);
    const isActive = isJoinedByUser;

    return (
        <Portal>
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
                            <button id={`clan-quest-claim-${quest.id}`} onClick={onClaim} className="w-full py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse">
                                RESGATAR RECOMPENSA
                            </button>
                        ) : onActivate ? (
                            <button id={`clan-quest-activate-${quest.id}`} onClick={onActivate} className="w-full py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] animate-pulse">
                                ATIVAR MISSÃO PARA O CLÃ
                            </button>
                        ) : (
                            <button id={`clan-quest-join-${quest.id}`} onClick={onTake} disabled={isActive} className={`w-full py-2 rounded-xl text-xs font-bold ${isActive ? 'bg-white/10 text-gray-400' : 'luxe-skin-button'}`}>
                                {isActive ? 'JUNTAR-SE À MISSÃO' : 'PARTICIPAR'}
                            </button>
                        )}
                        <button onClick={onClose} className="w-full py-2 rounded-xl text-xs font-bold bg-black/30 text-gray-300 hover:bg-black/50">
                            FECHAR
                        </button>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};

const AldeiaStats: React.FC<{ slots: AldeiaSlot[], slotsConfig?: typeof ALDEIA_SLOTS }> = ({ slots, slotsConfig = ALDEIA_SLOTS }) => {
    const mainSlots = slots.filter(s => s.slotId !== 'trono');
    // const order = mainSlots.length > 0 ? Math.floor(mainSlots.reduce((acc, s) => acc + s.health, 0) / mainSlots.length) : 0;

    return (
        <GlassCard variant="neutral" className="p-3 space-y-2">
            {/* Order Bar moved to Sanctuary Tab */}
            <div className="text-center text-xs text-gray-400 mb-2">Saúde Individual dos Slots</div>
            <div className="grid grid-cols-5 gap-1 pt-1">
                {mainSlots.map(slot => {
                    const configSlot = slotsConfig.find(s => s.id === slot.slotId);
                    return (
                        <div key={slot.slotId} className="flex flex-col items-center space-y-1">
                            <div className="text-[10px] uppercase text-gray-500">{configSlot?.emoji || slot.slotId.substring(0, 3)}</div>
                            <div className="w-full bg-black/30 rounded-full h-1">
                                <div
                                    className={`h-full rounded-full bg-[var(--metal-gold)]`}
                                    style={{ width: `${slot.health}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </GlassCard>
    );
};

// --- Main Modal ---

export const ClanDetailModal: React.FC<{ clanName?: string; onClose: () => void; }> = ({ clanName, onClose }) => {
    const { userProfile, enrichedClanMembers, clanJoinRequestsIncoming, approveClanJoinRequest, rejectClanJoinRequest, leaveClan, kickClanMember, transferLeadershipAndLeave, deleteClan, clanRanks, seasons, seasonQuests, getClanQuestProgress, clanQuestParticipants, updateClan, tasks, assets, getArenas, getActionsForArena, addArena, updateArena, addAction, updateAction, deleteAction, deleteArena, scheduleTask, loadClanAndMembers, acceptSeasonQuest, claimSeasonQuest, showToast, activateClanQuest, clanQuestProgress, userMissionParticipations, isBasicMode, clan, getAldeiaSlots, getAldeiaPresence, updateAldeiaSlot, performAldeiaDailyUpdate, enterAldeiaSlot, appMode, friends, notifications, deleteNotification } = useGame();
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30000); // Update 'now' every 30 seconds
        return () => clearInterval(interval);
    }, []);
    const isOfficeClan = clan?.clanType?.toLowerCase() === 'office';
    const resolvedClanName = (clan?.name || clanName || 'seu grupo').trim();

    const { trigger } = useSensoryFeedback();
    const [activeTab, setActiveTab] = useState<ClanDetailTab>('santuario');
    const enrichedClanMembersRef = useRef(enrichedClanMembers);
    const groupBoardTabLabel = isOfficeClan ? 'Quadro' : 'Jornadas';
    const groupBoardTitle = isOfficeClan ? 'Quadro da equipe' : 'Jornadas do grupo';
    const getMissionTypeLabel = (missionType: ClanCustomQuest['mission_type']) => missionType === 'singular' ? 'Individual' : 'Coletiva';
    const getGroupActionLabel = (quest: ClanCustomQuest, isInstalled: boolean) => {
        if (isInstalled) return 'Abrir tarefa';
        return quest.mission_type === 'singular' ? 'Assumir tarefa' : 'Entrar na tarefa';
    };

    useEffect(() => {
        trigger('whoosh');
    }, [trigger]);

    // Aldeia State from Context
    const { aldeiaSlots, setAldeiaSlots, aldeiaPresence, setAldeiaPresence, loadAldeiaData } = useGame();
    const [selectedSlotForModal, setSelectedSlotForModal] = useState<AldeiaSlotId | null>(null);

    // --- Long Press Logic ---
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const isLongPressTriggered = useRef(false);
    const pressStartTime = useRef<number>(0);
    const startPos = useRef({ x: 0, y: 0 });
    const [pressingSlot, setPressingSlot] = useState<string | null>(null);
    const [showHoldVisual, setShowHoldVisual] = useState(false);
    const visualTimer = useRef<NodeJS.Timeout | null>(null);

    // 3 seconds for long press - Strictly followed per user request
    const LONG_PRESS_DURATION = 3000;

    const handlePointerDown = (e: React.PointerEvent, slotId: string, isThroneDisabled: boolean) => {
        if (isThroneDisabled) return;

        // Prevent default to avoid context menus or selection
        // e.preventDefault(); // Removed to allow click events to propagate properly

        // Capture pointer to prevent cancellation on small movements
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) {
            // Ignore capture errors
        }

        pressStartTime.current = Date.now();
        startPos.current = { x: e.clientX, y: e.clientY };
        isLongPressTriggered.current = false;

        // Start timers
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        if (visualTimer.current) clearTimeout(visualTimer.current);

        // Visual feedback starts quickly to indicate interaction
        visualTimer.current = setTimeout(() => {
            setPressingSlot(slotId);
            setShowHoldVisual(true);
        }, 200); // Increased slightly to avoid flicker on quick taps

        longPressTimer.current = setTimeout(() => {
            isLongPressTriggered.current = true;
            // Visual feedback of completion happens here (maybe vibrate if possible)
            safeVibrate(200);

            setPressingSlot(null);
            setShowHoldVisual(false);

            // Action: Occupy/Sit (Long Press)
            console.log('[LONG_PRESS] Triggered for slot:', slotId);
            handleSlotClick(slotId as AldeiaSlotId);
        }, LONG_PRESS_DURATION);
    };

    const handlePointerUp = (e: React.PointerEvent, slotId: AldeiaSlotId, isThroneDisabled: boolean) => {
        if (isThroneDisabled) return;

        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (err) {
            // Ignore release errors
        }

        const duration = Date.now() - pressStartTime.current;
        console.log(`[POINTER_UP] Duration: ${duration}ms, LongPressTriggered: ${isLongPressTriggered.current}`);

        // If it was a quick tap (less than 300ms) and long press hasn't triggered yet, open modal
        if (duration < 300 && !isLongPressTriggered.current) {
            console.log('[POINTER_UP] Quick tap detected, opening modal');
            handleSlotTap(e, slotId, isThroneDisabled);
        }

        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        if (visualTimer.current) clearTimeout(visualTimer.current);
        setPressingSlot(null);
        setShowHoldVisual(false);
    };

    const handlePointerLeave = (e: React.PointerEvent) => {
        // Cancel if leaving element
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        if (visualTimer.current) clearTimeout(visualTimer.current);
        setPressingSlot(null);
        setShowHoldVisual(false);
        isLongPressTriggered.current = false;
    };

    const handlePointerCancel = (e: React.PointerEvent) => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        if (visualTimer.current) clearTimeout(visualTimer.current);
        setPressingSlot(null);
        setShowHoldVisual(false);
        isLongPressTriggered.current = false;
    };

    // Click handler for Tap action (Open Modal)
    const handleSlotTap = (e: React.MouseEvent | React.PointerEvent, slotId: AldeiaSlotId, isThroneDisabled: boolean) => {
        // e.stopPropagation(); // Let's try removing stopPropagation for a moment to see if it helps, but usually it's better to have it
        console.log(`[HANDLE_SLOT_TAP] Interaction on: ${slotId}, isThroneDisabled: ${isThroneDisabled}, isLongPressTriggered: ${isLongPressTriggered.current}`);

        if (isThroneDisabled) {
            console.log('[HANDLE_SLOT_TAP] Throne is disabled, skipping modal');
            return;
        }

        // If Long Press was triggered, DO NOT open modal
        if (isLongPressTriggered.current) {
            console.log('[HANDLE_SLOT_TAP] Ignored because Long Press was triggered');
            isLongPressTriggered.current = false; // Reset for next interaction
            return;
        }

        // Open Modal
        console.log('[HANDLE_SLOT_TAP] Opening modal for:', slotId);
        setSelectedSlotForModal(slotId);
    };

    // Custom Quests State
    const [clanQuests, setClanQuests] = useState<ClanCustomQuest[]>([]);
    const [myParticipations, setMyParticipations] = useState<string[]>([]);
    const [myContributions, setMyContributions] = useState<Record<string, number>>({});
    const [isCreatingQuest, setIsCreatingQuest] = useState(false);

    const fetchQuests = useCallback(async () => {
        if (!clan?.id) return;
        const { data } = await supabase.from('clan_custom_quests').select('*').eq('clan_id', clan.id);
        if (data) setClanQuests(data as ClanCustomQuest[]);

        // Also fetch participations
        const { data: partData } = await supabase
            .from('clan_mission_participants')
            .select('mission_id, contribution_value')
            .eq('clan_id', clan.id)
            .eq('user_id', userProfile.id);

        if (partData) {
            setMyParticipations(partData.map(p => p.mission_id));
            const contribs: Record<string, number> = {};
            partData.forEach(p => contribs[p.mission_id] = p.contribution_value || 0);
            setMyContributions(contribs);
        }
    }, [clan?.id, userProfile.id]);

    useEffect(() => {
        if (!clan?.id) return;

        fetchQuests();

        // Subscribe to quest changes
        const channel = supabase.channel(`clan-quests-${clan.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clan_custom_quests', filter: `clan_id=eq.${clan.id}` },
                () => fetchQuests()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [clan?.id, fetchQuests]);

    const handleOptIn = async (quest: ClanCustomQuest) => {
        try {
            if (quest.mission_type === 'singular' && (quest.status === 'locked' || quest.assigned_user_id) && quest.assigned_user_id !== userProfile.id) {
                showToast("Esta tarefa ja esta com outra pessoa.", "error");
                return;
            }

            if (quest.mission_type === 'singular' && (quest.status === 'locked' || quest.assigned_user_id) && quest.assigned_user_id !== userProfile.id) {
                showToast("Esta tarefa ja esta com outra pessoa.", "error");
                return;
            }

            const alreadyParticipating = myParticipations.includes(quest.id);
            const existingPlannerAction = findCustomQuestPlannerAction(quest);
            const clanArena = await ensureClanAppArena();

            if (alreadyParticipating && existingPlannerAction) {
                if (existingPlannerAction.arenaId !== clanArena.id) {
                    updateAction(existingPlannerAction.id, { arenaId: clanArena.id });
                }
                showToast(`Essa acao ja esta na arena "${clanArena.name}".`, "info");
                return;
            }

            if (!alreadyParticipating) {
                const { error: participationError } = await supabase
                    .from('clan_mission_participants')
                    .insert({
                        clan_id: clan.id,
                        mission_id: quest.id,
                        user_id: userProfile.id
                    });

                if (participationError && participationError.code !== '23505') {
                    throw participationError;
                }
            }

            if (quest.mission_type === 'singular') {
                const { error: lockError } = await supabase
                    .from('clan_custom_quests')
                    .update({ status: 'locked', assigned_user_id: userProfile.id })
                    .eq('id', quest.id);
                if (lockError) throw lockError;
            }

            if (existingPlannerAction) {
                if (existingPlannerAction.arenaId !== clanArena.id) {
                    updateAction(existingPlannerAction.id, { arenaId: clanArena.id });
                }
                setMyParticipations(prev => Array.from(new Set([...prev, quest.id])));
                const { data } = await supabase.from('clan_custom_quests').select('*').eq('clan_id', clan.id);
                if (data) setClanQuests(data as ClanCustomQuest[]);
                showToast(quest.mission_type === 'singular' ? "Tarefa assumida no seu app." : "Acao instalada no seu app.");
                return;
            }

            const newAction = await addAction({
                arenaId: clanArena.id,
                name: quest.title,
                description: quest.description || 'Tarefa do grupo',
                icon: getGroupTaskIcon(quest.category),
                duration: 30,
                repetitions: Math.max(1, Number(quest.target_value) || 1),
                actionType: Number(quest.target_value) > 1 ? 'Ação Recorrente' : 'Compromisso',
                originCodexId: `clan_quest:${quest.id}`,
                context: {
                    clanTask: {
                        clanId: clan.id,
                        missionId: quest.id,
                        missionType: quest.mission_type,
                        clanType: isOfficeClan ? 'Office' : 'Casual',
                    },
                }
            });

            // Auto-schedule if due date exists
            let scheduledInPlanner = false;
            if (quest.due_date) {
                const date = new Date(quest.due_date);
                if (!Number.isNaN(date.getTime()) && date.getTime() >= Date.now()) {
                    const dateString = getLocalDateString(date);
                    const timeInMinutes = date.getHours() * 60 + date.getMinutes();
                    scheduleTask(newAction.id, dateString, timeInMinutes);
                    scheduledInPlanner = true;
                }
            }

            const activationText = quest.mission_type === 'singular' ? 'Tarefa assumida' : 'Acao instalada';
            showToast(
                scheduledInPlanner
                    ? `${activationText} e agendada no Planner!`
                    : `${activationText} na arena "${clanArena.name}".`,
            );

            setMyParticipations(prev => [...prev, quest.id]);

            // Refresh quests to show locked status immediately
            const { data } = await supabase.from('clan_custom_quests').select('*').eq('clan_id', clan.id);
            if (data) setClanQuests(data as ClanCustomQuest[]);

        } catch (error) {
            console.error("Error opting in:", error);
            showToast("Erro ao instalar acao.", "error");
        }
    };

    const handleAbortMission = async (quest: ClanCustomQuest) => {
        try {
            const runtimeAction = findCustomQuestPlannerAction(quest);
            const runtimeArenaId = runtimeAction?.arenaId;
            const runtimeArena = runtimeArenaId ? getArenas().find((arena) => arena.id === runtimeArenaId) : undefined;
            const shouldDeleteQuestArena = Boolean(
                runtimeAction &&
                runtimeArenaId &&
                runtimeArena &&
                normalizeDomainLabel(runtimeArena.name || '') !== normalizeDomainLabel(getClanAppArenaLabel()) &&
                getActionsForArena(runtimeArenaId).filter(action => action.id !== runtimeAction.id).length === 0
            );

            if (runtimeAction) {
                await deleteAction(runtimeAction.id);
                if (shouldDeleteQuestArena && runtimeArenaId) {
                    setTimeout(() => {
                        void deleteArena(runtimeArenaId);
                    }, 0);
                }
            }

            // Remove participation
            const { error: partError } = await supabase
                .from('clan_mission_participants')
                .delete()
                .eq('mission_id', quest.id)
                .eq('user_id', userProfile.id);

            if (partError) throw partError;

            // Unlock mission if singular
            if (quest.mission_type === 'singular') {
                const { error: unlockError } = await supabase
                    .from('clan_custom_quests')
                    .update({ status: 'active', assigned_user_id: null })
                    .eq('id', quest.id);
                if (unlockError) throw unlockError;
            }

            showToast("Acao removida do seu app.");
            setMyParticipations(prev => prev.filter(id => id !== quest.id));

            // Refresh quests
            const { data } = await supabase.from('clan_custom_quests').select('*').eq('clan_id', clan.id);
            if (data) setClanQuests(data as ClanCustomQuest[]);

        } catch (error) {
            console.error("Error aborting mission:", error);
            showToast("Erro ao remover acao.", "error");
        }
    };

    const handleCustomQuestEntry = async (quest: ClanCustomQuest) => {
        const isInstalled = myParticipations.includes(quest.id);
        if (isInstalled) {
            await openCustomQuestArena(quest);
            return;
        }

        await handleOptIn(quest);
        window.setTimeout(() => {
            void openCustomQuestArena(quest);
        }, 180);
    };

    useEffect(() => {
        if (!clan?.id) return;

        // Check for updates periodically
        performAldeiaDailyUpdate(clan.id);
        const dailyCheckInterval = setInterval(() => performAldeiaDailyUpdate(clan.id), 60000 * 60); // Check every hour

        // Periodically refresh via context
        loadAldeiaData(clan.id);
        const loadInterval = setInterval(() => loadAldeiaData(clan.id), 30000); // 30s
        const visualTimer = setInterval(() => setNow(new Date()), 30000); // Update visual bars every 30s
        return () => {
            clearInterval(loadInterval);
            clearInterval(visualTimer);
            clearInterval(dailyCheckInterval);
        };
    }, [clan?.id, getAldeiaSlots, getAldeiaPresence, performAldeiaDailyUpdate]);

    // Helper to calculate effective health (DB health + active minutes in current 6h window)
    const getEffectiveHealth = useCallback((slotId: string) => {
        const slotData = aldeiaSlots.find(s => s.slotId === slotId);
        if (!slotData) return 0;
        if (isOfficeClan) return slotData.health;

        const baseHealth = slotData.health;
        const currentPeriodStart = new Date(now);
        currentPeriodStart.setHours(Math.floor(currentPeriodStart.getHours() / 6) * 6, 0, 0, 0);
        const occupants = aldeiaPresence.filter(p => p.slotId === slotId && new Date(p.startedAt).getTime() >= currentPeriodStart.getTime());

        let extraPoints = 0;
        occupants.forEach(occ => {
            const startedAt = new Date(occ.startedAt).getTime();
            const elapsedMinutes = Math.floor((now.getTime() - startedAt) / 60000);
            if (elapsedMinutes >= 30) extraPoints += 5;
        });

        return Math.min(100, baseHealth + extraPoints);
    }, [aldeiaSlots, aldeiaPresence, isOfficeClan, now]);

    // Calculate Rank and Tier
    const currentRank = clanRanks.find(r => r.id === clan?.rankId);
    const rankIndex = clanRanks.findIndex(r => r.id === clan?.rankId);
    const tierInfo = getTierInfo(rankIndex !== -1 ? rankIndex : 0);

    // Calculate Aldeia Order (Average Health of 5 main slots)
    const aldeiaOrder = useMemo(() => {
        if (aldeiaSlots.length === 0) return 0;
        const mainSlots = aldeiaSlots.filter(s => s.slotId !== 'trono');
        if (mainSlots.length === 0) return 0;

        if (isOfficeClan) {
            return mainSlots.reduce((acc, s) => acc + s.health, 0);
        }

        const totalEffectiveHealth = mainSlots.reduce((acc, s) => acc + getEffectiveHealth(s.slotId), 0);
        return Math.floor(totalEffectiveHealth / mainSlots.length);
    }, [aldeiaSlots, isOfficeClan, getEffectiveHealth]);

    // Slots Configuration (Dynamic based on Type and Customization)
    const slotsConfig = useMemo(() => {
        const base = isOfficeClan ? [
            { id: 'fogueira', label: 'Mesa Central', emoji: '🏢', x: 42, y: 51 },
            { id: 'torre', label: 'Café', emoji: '☕', x: 70, y: 40 },
            { id: 'altar', label: 'Recepção', emoji: '🛎️', x: 23, y: 24 },
            { id: 'forja', label: 'Mesa 1', emoji: '💻', x: 75, y: 70 },
            { id: 'horta', label: 'Mesa 2', emoji: '💻', x: 25, y: 70 },
            { id: 'trono', label: 'Sala Diretor', emoji: '💼', x: 49, y: 32 },
        ] : ALDEIA_SLOTS;

        const customConfig = clan?.slotConfig || clan?.slot_config;
        if (!customConfig) return base;

        return base.map(s => {
            const custom = customConfig[s.id];
            if (!custom) return s;
            if (isOfficeClan) {
                return { ...s, note: custom.note };
            }
            return { ...s, label: custom.label, emoji: custom.emoji, note: custom.note };
        });
    }, [isOfficeClan, clan?.slotConfig, clan?.slot_config]);

    // Update clan exp/order if needed (Optional: sync with DB if this calculation is authoritative)
    // Note: Ideally the backend calculates this, but for visual feedback we do it here.

    // Handle Slot Click
    const lastUpdateRef = useRef<number>(0);

    const handleSlotClick = async (slotId: AldeiaSlotId) => {
        console.log(`[HANDLE_SLOT_CLICK] User clicked slot: ${slotId}`);
        if (!clan?.id) {
            console.error('[HANDLE_SLOT_CLICK] No clan ID found');
            return;
        }

        // If it's the Throne, check if user is leader
        if (slotId === 'trono') {
            // Se for clã office, apenas o líder pode entrar na Sala do Diretor
            if (isOfficeClan && userClanRole !== 'leader') {
                showToast(isOfficeClan ? "Apenas o diretor pode acessar a Sala do Diretor." : "Apenas o líder do grupo pode acessar a Sala do Diretor.");
                return;
            }

            // Clã Office não tem trava de produtividade para o líder sentar
            if (!isOfficeClan) {
                if (aldeiaOrder < 90) {
                    showToast("A ordem da aldeia deve ser de pelo menos 90% para acessar o trono.");
                    return;
                }
            }
        }

        console.log(`[HANDLE_SLOT_CLICK] Calling enterAldeiaSlot...`);

        // Optimistic Update to ensure immediate feedback
        lastUpdateRef.current = Date.now(); // Prevent interval overwrite
        setAldeiaPresence(prev => {
            const others = prev.filter(p => p.userId !== userProfile.id);
            return [...others, {
                id: 'temp-optimistic',
                clanId: clan.id,
                userId: userProfile.id,
                slotId: slotId,
                startedAt: new Date().toISOString(),
                hoursCounted: 0
            }];
        });

        try {
            await enterAldeiaSlot(clan.id, slotId);
            console.log(`[HANDLE_SLOT_CLICK] enterAldeiaSlot returned. Refreshing data...`);

            // Short delay to ensure DB propagation
            await new Promise(r => setTimeout(r, 500));

            // Refresh data immediately
            const presence = await getAldeiaPresence(clan.id);
            console.log('[HANDLE_SLOT_CLICK] New presence:', presence);
            setAldeiaPresence(presence);
            const slots = await getAldeiaSlots(clan.id);
            setAldeiaSlots(slots);

            const slotConfig = slotsConfig.find(s => s.id === slotId);
            showToast(`Você entrou em: ${slotConfig?.label || slotId}`);
        } catch (error) {
            console.error('[HANDLE_SLOT_CLICK] Error:', error);
            showToast("Erro ao entrar no slot.");
        }
    };

    const [subModal, setSubModal] = useState<'manage' | 'leave' | 'transfer' | null>(null);
    const [membersPanel, setMembersPanel] = useState<'people' | 'requests' | 'invite'>('people');
    const [inviteBusyId, setInviteBusyId] = useState<string | null>(null);
    const [memberToKick, setMemberToKick] = useState<EnrichedClanMember | null>(null);
    const [selectedMember, setSelectedMember] = useState<EnrichedClanMember | null>(null);
    const [selectedQuest, setSelectedQuest] = useState<SeasonQuest | null>(null);
    const [selectedGroupArenaDetail, setSelectedGroupArenaDetail] = useState<{
        arena: Arena;
        actions: Action[];
        tasks: typeof tasks;
        readOnly?: boolean;
    } | null>(null);
    const [expandDescription, setExpandDescription] = useState(false);

    const userClanRole = useMemo(() => {
        return enrichedClanMembers.find(m => m.id === userProfile.id)?.role;
    }, [enrichedClanMembers, userProfile.id]);
    const availableFriendsForInvite = useMemo(
        () => friends.filter(friend => !enrichedClanMembers.some(member => member.id === friend.id)),
        [friends, enrichedClanMembers]
    );
    const sentClanInvites = useMemo(
        () => notifications.filter((notification: Notification) =>
            notification.type === 'clan_invite' &&
            notification.metadata?.clanId === clan?.id &&
            notification.metadata?.inviteNotification === true &&
            notification.metadata?.inviterId === userProfile.id
        ),
        [clan?.id, notifications, userProfile.id]
    );

    const activeSeason = seasons.find(s => s.is_active);
    const todayString = getLocalDateString();
    const canEditBackground = !!activeSeason && activeSeason.start_date === todayString;

    // Background Image Handling
    const [bgError, setBgError] = useState(false);

    useEffect(() => {
        setBgError(false);
    }, [clan?.rankId, isBasicMode]);

    const backgroundUrl = useMemo(() => {
        const url = getClanBackgroundUrl(rankIndex !== -1 ? rankIndex : 0, isOfficeClan, clan?.backgroundUrl);
        if (isOfficeClan) {
            console.log('[ClanDetailModal] Office BG URL:', url);
        }
        return url;
    }, [isOfficeClan, rankIndex, clan?.backgroundUrl]);

    const handleBgError = () => {
        console.log(`[BG_ERROR] Failed to load background: ${backgroundUrl}`);
        setBgError(true);
    };

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

    const handleSendClanInvite = async (friendId: string, nickname: string) => {
        if (!clan || userClanRole !== 'leader' || inviteBusyId) return;

        const alreadySent = sentClanInvites.some(invite => invite.userId === friendId);
        if (alreadySent) {
            showToast('Esse convite já está pendente.', 'info');
            return;
        }

        setInviteBusyId(friendId);
        try {
            const content = `${userProfile.nickname || 'Um líder'} convidou você para entrar no grupo ${clan.name}. Abra o grupo e solicite entrada.`;
            await SupabaseService.createNotification(friendId, 'clan_invite', content, {
                clanId: clan.id,
                clanName: clan.name,
                joinRequest: false,
                inviteNotification: true,
                inviterId: userProfile.id,
                senderId: userProfile.id,
                senderNickname: userProfile.nickname || null,
                url: '/?oracle=clan',
            });
            showToast(`Convite enviado para ${nickname}.`, 'success');
        } finally {
            setInviteBusyId(null);
        }
    };

    const handleCancelClanInvite = async (notificationId: string) => {
        await deleteNotification(notificationId);
        showToast('Convite cancelado.', 'success');
    };

    const handleKickMember = async () => {
        if (memberToKick) {
            await kickClanMember(memberToKick.id);
            setMemberToKick(null);
        }
    };

    const activeSeasonClanQuests = activeSeason
        ? seasonQuests.filter(q => q.type === 'clan' && (!q.season_id || q.season_id === activeSeason.id))
        : [];

    // Determine active quests for the clan based on progress record
    const clanActiveQuestIds = (clan && clanQuestProgress[clan.id]) ? Object.keys(clanQuestProgress[clan.id]) : [];

    const activeClanQuests = activeSeasonClanQuests.filter(q => clanActiveQuestIds.includes(q.id));
    const allClanActions = getArenas().flatMap(arena => getActionsForArena(arena.id));
    const availableClanQuests = activeSeasonClanQuests.filter(q => !clanActiveQuestIds.includes(q.id));
    const groupBoardCount = activeClanQuests.length + clanQuests.length + (userClanRole === 'leader' ? availableClanQuests.length : 0);
    const getQuestGoal = (quest: SeasonQuest) => (
        quest.requirements?.clanGoal || quest.goal_value || quest.actionTemplate?.repetitions || 1
    );
    const getGroupTaskIcon = (category?: ClanCustomQuest['category']) => (
        category === 'work' ? '💼'
            : category === 'meeting' ? '📅'
                : category === 'report' ? '📊'
                    : category === 'development' ? '👨‍💻'
                        : '⚔️'
    );
    const getGroupTaskArenaPriority = (priority?: ClanCustomQuest['priority']): Arena['priority'] => (
        priority === 'low' ? 'baixa'
            : priority === 'medium' ? 'media'
                : 'alta'
    );
    const getClanTaskContext = (action?: Action) => {
        const context = action?.context as (Action['context'] & {
            clanTask?: {
                clanId?: string;
                missionId?: string;
                missionType?: 'singular' | 'shared';
                clanType?: 'Casual' | 'Office';
            };
        }) | undefined;
        return context?.clanTask;
    };
    const getClanAppArenaLabel = () => (
        isOfficeClan ? `Equipe: ${clan?.name || 'Grupo'}` : `Grupo: ${clan?.name || 'Grupo'}`
    );
    const getClanAppArenaDescription = () => (
        isOfficeClan
            ? 'Arena pessoal das tarefas da equipe.'
            : 'Arena pessoal das tarefas do grupo.'
    );
    const getClanAppArenaAssetId = () => (isOfficeClan ? 'trabalho' : 'conexoes');
    const getClanAppArenaIcon = () => (
        isOfficeClan
            ? '🏢'
            : (clan?.icon && clan.icon.trim()) ? clan.icon.trim()
                : '👥'
    );
    const findClanAppArena = () => {
        if (!clan) return undefined;

        const linkedAction = allClanActions.find((action) => getClanTaskContext(action)?.clanId === clan.id);
        if (linkedAction) {
            const runtimeArena = getArenas().find((arena) => arena.id === linkedAction.arenaId && !arena.isArchived);
            if (runtimeArena) return runtimeArena;
        }

        const normalizedArenaName = normalizeDomainLabel(getClanAppArenaLabel());
        return getArenas().find((arena) =>
            !arena.isArchived &&
            normalizeDomainLabel(arena.name || '') === normalizedArenaName
        );
    };
    const ensureClanAppArena = async () => {
        const desiredName = getClanAppArenaLabel();
        const desiredDescription = getClanAppArenaDescription();
        const desiredIcon = getClanAppArenaIcon();
        const desiredAssetId = getClanAppArenaAssetId();
        const existingArena = findClanAppArena();

        if (existingArena) {
            if (
                existingArena.name !== desiredName ||
                existingArena.description !== desiredDescription ||
                existingArena.icon !== desiredIcon ||
                existingArena.assetId !== desiredAssetId
            ) {
                updateArena(existingArena.id, {
                    name: desiredName,
                    description: desiredDescription,
                    icon: desiredIcon,
                    assetId: desiredAssetId,
                });
            }
            return existingArena;
        }

        return addArena(desiredAssetId, {
            name: desiredName,
            description: desiredDescription,
            icon: desiredIcon,
            priority: 'media',
        });
    };
    const buildSyntheticCompletedTasks = (actionId: string, completedCount: number, duration: number) => {
        const safeCompleted = Math.max(0, completedCount);
        const safeDuration = Math.max(1, duration || 30);
        const today = getLocalDateString();

        return Array.from({ length: safeCompleted }, (_, index) => ({
            id: `${actionId}:preview:${index}`,
            actionId,
            date: today,
            startTime: Math.max(0, index * safeDuration),
            duration: safeDuration,
            completed: true,
        }));
    };
    const findQuestArenaAndAction = (quest: SeasonQuest) => {
        const normalizedArenaName = normalizeDomainLabel(quest.title || '');
        const normalizedActionName = normalizeDomainLabel(quest.actionTemplate?.name || '');
        const arena = getArenas().find(candidate => normalizeDomainLabel(candidate.name || '') === normalizedArenaName);
        const action = arena
            ? allClanActions.find(candidate =>
                candidate.arenaId === arena.id &&
                normalizeDomainLabel(candidate.name || '') === normalizedActionName
            )
            : undefined;

        return { arena, action };
    };
    const findCustomQuestPlannerAction = (quest: ClanCustomQuest) => {
        const questMarker = `clan_quest:${quest.id}`;
        return allClanActions.find((action) => {
            const clanTask = getClanTaskContext(action);
            return action.originCodexId === questMarker || clanTask?.missionId === quest.id;
        });
    };
    const buildSeasonQuestArenaPreview = (quest: SeasonQuest): { arena: Arena; actions: Action[]; previewTasks?: typeof tasks } => {
        const { arena: runtimeArena, action: runtimeAction } = findQuestArenaAndAction(quest);

        if (runtimeArena && runtimeAction) {
            const runtimeActions = getActionsForArena(runtimeArena.id);
            return {
                arena: runtimeArena,
                actions: runtimeActions,
                previewTasks: tasks.filter(task => runtimeActions.some(action => action.id === task.actionId)),
            };
        }

        const syntheticArenaId = `group-season-preview:${quest.id}`;
        const syntheticActionId = `group-season-action:${quest.id}`;
        const repetitions = Math.max(1, getQuestGoal(quest));
        const syntheticAction: Action = {
            id: syntheticActionId,
            arenaId: syntheticArenaId,
            name: quest.actionTemplate?.name || quest.title,
            description: quest.actionTemplate?.description || quest.description || 'Tarefa do grupo',
            icon: quest.actionTemplate?.icon || '⚔️',
            duration: quest.actionTemplate?.duration || 30,
            repetitions,
            actionType: quest.actionTemplate?.isMilestone ? 'Marco' : 'Ação Recorrente',
            difficulty: 3,
        };

        return {
            arena: {
                id: syntheticArenaId,
                assetId: assets[0]?.id || 'geral',
                name: quest.title,
                description: quest.description || 'Tarefa do grupo',
                icon: quest.actionTemplate?.icon || '⚔️',
                actionIds: [syntheticActionId],
                priority: 'alta',
            },
            actions: [syntheticAction],
            previewTasks: [],
        };
    };
    const buildCustomQuestArenaPreview = (quest: ClanCustomQuest): { arena: Arena; actions: Action[]; previewTasks: typeof tasks } => {
        const syntheticArenaId = `group-custom-preview:${quest.id}`;
        const runtimeAction = findCustomQuestPlannerAction(quest);
        const runtimeArena = runtimeAction ? getArenas().find((arena) => arena.id === runtimeAction.arenaId) : undefined;
        if (runtimeAction && runtimeArena) {
            const runtimeActions = getActionsForArena(runtimeArena.id);
            return {
                arena: runtimeArena,
                actions: runtimeActions,
                previewTasks: tasks.filter((task) => runtimeActions.some((action) => action.id === task.actionId)),
            };
        }
        const repetitions = Math.max(1, Number(quest.target_value) || 1);
        const icon = getGroupTaskIcon(quest.category);
        const syntheticAction: Action = {
            id: `group-custom-action:${quest.id}`,
            arenaId: syntheticArenaId,
            name: quest.title,
            description: quest.description || 'Tarefa do grupo',
            icon,
            duration: runtimeAction?.duration || 30,
            repetitions,
            actionType: repetitions <= 1 ? 'Compromisso' : 'Ação Recorrente',
            difficulty: quest.priority === 'urgent' ? 5 : quest.priority === 'high' ? 4 : 3,
            originCodexId: `clan_quest:${quest.id}`,
        };

        return {
            arena: {
                id: syntheticArenaId,
                assetId: assets[0]?.id || 'geral',
                name: quest.title,
                description: quest.description || 'Tarefa do grupo',
                icon,
                actionIds: [syntheticAction.id],
                priority: getGroupTaskArenaPriority(quest.priority),
            },
            actions: [syntheticAction],
            previewTasks: buildSyntheticCompletedTasks(
                syntheticAction.id,
                Math.min(Math.max(quest.current_value || 0, 0), repetitions),
                syntheticAction.duration
            ) as typeof tasks,
        };
    };
    const openSeasonQuestArena = (quest: SeasonQuest) => {
        const { arena, action } = findQuestArenaAndAction(quest);
        if (!arena || !action) return false;

        const runtimeActions = getActionsForArena(arena.id);
        setSelectedGroupArenaDetail({
            arena,
            actions: runtimeActions,
            tasks: tasks.filter(task => runtimeActions.some(candidate => candidate.id === task.actionId)),
            readOnly: false,
        });
        return true;
    };
    const openCustomQuestArena = (quest: ClanCustomQuest) => {
        const runtimeAction = findCustomQuestPlannerAction(quest);
        if (!runtimeAction) return false;

        const runtimeArena = getArenas().find(arena => arena.id === runtimeAction.arenaId);
        if (!runtimeArena) return false;

        const runtimeActions = getActionsForArena(runtimeArena.id);
        setSelectedGroupArenaDetail({
            arena: runtimeArena,
            actions: runtimeActions,
            tasks: tasks.filter(task => runtimeActions.some(candidate => candidate.id === task.actionId)),
            readOnly: false,
        });
        return true;
    };

    const isQuestActivatedForClan = (quest: SeasonQuest) => {
        return clanActiveQuestIds.includes(quest.id) || getClanQuestProgress(quest.id) > 0;
    };

    const isQuestJoinedByUser = (quest: SeasonQuest) => {
        return myParticipations.includes(quest.id)
            || !!userMissionParticipations?.[quest.id]
            || !!findQuestArenaAndAction(quest).action;
    };

    const getQuestRawProgress = (quest: SeasonQuest) => {
        return getClanQuestProgress(quest.id);
    };

    const getQuestProgress = (quest: SeasonQuest) => {
        const completed = getClanQuestProgress(quest.id);
        const targetValue = getQuestGoal(quest);
        return Math.floor(Math.min(100, Math.max(0, (completed / Math.max(targetValue, 1)) * 100)));
    };

    const handleTakeQuest = async (quest: SeasonQuest) => {
        await acceptSeasonQuest(quest.id);
        setSelectedQuest(null);
    };

    const handleClaimQuest = (quest: SeasonQuest) => {
        if (userProfile.completedSeasonMissions?.includes(quest.id)) return;
        claimSeasonQuest(quest.id);

        const xp = quest.rewards.xp;
        const items = quest.rewards.items || [];
        let msg = `✦ +${xp} XP computados`;
        if (items.length > 0) {
            msg = `✦ ${items.join(', ')} adicionado ao inventário · +${xp} XP computados`;
        }
        showToast(msg);
        setSelectedQuest(null);
    };
    const renderGroupTaskArenaTile = ({
        tileKey,
        tileId,
        arena,
        actions,
        previewTasks = [],
        onCardClick,
        muted = false,
        badges = null,
        meta = null,
        controls = null,
    }: {
        tileKey: string;
        tileId?: string;
        arena: Arena;
        actions: Action[];
        previewTasks?: typeof tasks;
        onCardClick?: () => void;
        muted?: boolean;
        badges?: React.ReactNode;
        meta?: React.ReactNode;
        controls?: React.ReactNode;
    }) => (
        <div key={tileKey} id={tileId} className="space-y-2">
            <div className={muted ? 'opacity-70 saturate-75' : ''}>
                <ArenaCard
                    arena={arena}
                    actions={actions}
                    tasks={previewTasks}
                    variant="overview"
                    onClick={onCardClick}
                />
            </div>
            {(badges || meta || controls) && (
                <div className="space-y-1 px-1">
                    {badges}
                    {meta}
                    {controls}
                </div>
            )}
        </div>
    );

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <div className="relative w-full max-w-sm m-4 aspect-[9/16] rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 flex flex-col isolate bg-black">
                        {/* Background Image Layer */}
                        <div className="absolute inset-0 z-0 select-none pointer-events-none">
                            {isBasicMode && bgError ? (
                                <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center border-4 border-dashed border-white/10">
                                    <div className="text-white/20 text-4xl font-black uppercase tracking-widest rotate-[-15deg] select-none text-center">
                                        <div>Modo Básico</div>
                                        <div className="text-xs mt-2 tracking-normal opacity-50 font-mono">office{Math.ceil(Math.max(1, rankIndex + 1) / 2)}.jpg not found</div>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={backgroundUrl}
                                    alt="Clan Background"
                                    className="w-full h-full object-cover transition-opacity duration-500"
                                    onError={handleBgError}
                                />
                            )}
                            {/* Overlay only for Casual mode */}
                            {!isBasicMode && (
                                <div className={`absolute inset-0 mix-blend-overlay ${tierInfo.tier === 1 ? 'bg-amber-900/30' : tierInfo.tier === 2 ? 'bg-emerald-900/30' : 'bg-purple-900/30'}`} />
                            )}
                        </div>

                        {/* Header Section */}
                        <div className="flex-none relative z-10">
                            <ClanHeader userClanRole={userClanRole} expandDescription={expandDescription} />

                            {/* Header Actions */}
                            <button onClick={onClose} className="absolute top-4 right-4 z-50 p-1 rounded-full bg-black/50 hover:bg-black/80 text-white"><XIcon className="w-5 h-5" /></button>

                            {/* Leader Edit Button */}
                            {userClanRole === 'leader' && (
                                <button
                                    onClick={() => setSubModal('manage')}
                                    className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors border border-white/10 backdrop-blur-sm"
                                    title="Editar Grupo"
                                >
                                    <span className="sr-only">Editar</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 relative min-h-0 pointer-events-auto">
                            {activeTab === 'santuario' && (
                                <div className="absolute inset-0 overflow-hidden">
                                    <Sparkles />


                                    {/* Tier Label */}
                                    {/* <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-center z-10">
                                        <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Nível da Aldeia</div>
                                        <div className="text-sm font-black text-white luxe-title-shadow">{tierInfo.name}</div>
                                    </div> */}

                                    {/* Slots */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        {slotsConfig.map((slot, idx) => {
                                            // Hide Throne if Order < 90%
                                            // if (slot.id === 'trono' && aldeiaOrder < 90) return null;

                                            const occupants = aldeiaPresence.filter(p => p.slotId === slot.id);

                                            // Special Logic for Casual Clan Bonfire (Presence based health)
                                            let health = getEffectiveHealth(slot.id);

                                            // Keep legacy bonfire override if still needed, but prioritize effective health
                                            if (!isOfficeClan && slot.id === 'fogueira' && occupants.length > 0 && health < 33) {
                                                // Ensure at least some visual feedback if occupied
                                                health = Math.max(health, Math.min(100, occupants.length * 33.33));
                                            }

                                            // Visual health (brightness/opacity)
                                            // 80-100: 1, 50-79: 0.8, 20-49: 0.6, 0-19: 0.4, 0: 0.2
                                            let opacity = 0.2;
                                            if (health >= 80) opacity = 1;
                                            else if (health >= 50) opacity = 0.8;
                                            else if (health >= 20) opacity = 0.6;
                                            else if (health > 0) opacity = 0.4;

                                            // Restored strict check for Order < 90, and leader-only for Office
                                            // No clã Office, o trono nunca fica desabilitado para o líder (independente da produtividade)
                                            const isThroneDisabled = slot.id === 'trono' && (
                                                (isOfficeClan && userClanRole !== 'leader') ||
                                                (!isOfficeClan && aldeiaOrder < 90)
                                            );

                                            if (slot.id === 'trono') {
                                                console.log(`[RENDER_SLOT] Throne: Order=${aldeiaOrder}, Disabled=${isThroneDisabled}`);
                                            }

                                            return (
                                                <div
                                                    key={slot.id}
                                                    className={`absolute w-24 h-24 -ml-12 -mt-12 flex flex-col items-center justify-center cursor-pointer transition-transform pointer-events-auto ${pressingSlot === slot.id ? 'scale-95' : 'hover:scale-110'} ${slot.id === 'trono' ? 'z-40' : 'z-10'} ${isThroneDisabled ? 'cursor-not-allowed hover:scale-100' : ''}`}
                                                    style={{ left: `${slot.x}%`, top: `${slot.y}%`, touchAction: 'none' }}
                                                    onPointerDown={(e) => handlePointerDown(e, slot.id, isThroneDisabled)}
                                                    onPointerUp={(e) => handlePointerUp(e, slot.id as AldeiaSlotId, isThroneDisabled)}
                                                    onPointerLeave={handlePointerLeave}
                                                    onPointerCancel={handlePointerCancel}
                                                    onClick={(e) => handleSlotTap(e, slot.id as AldeiaSlotId, isThroneDisabled)}
                                                >
                                                    {/* Visual Feedback for Holding */}
                                                    {pressingSlot === slot.id && showHoldVisual && (
                                                        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none scale-125">
                                                            <div className="absolute inset-0 bg-white/10 rounded-full blur-md animate-pulse" />
                                                            <svg className="w-24 h-24 rotate-[-90deg] relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                                                <circle
                                                                    className="text-white/20"
                                                                    strokeWidth="6"
                                                                    stroke="currentColor"
                                                                    fill="transparent"
                                                                    r="40"
                                                                    cx="48"
                                                                    cy="48"
                                                                />
                                                                <circle
                                                                    className="text-[var(--skin-accent-color)]"
                                                                    strokeWidth="6"
                                                                    strokeDasharray={251.2}
                                                                    strokeDashoffset={251.2}
                                                                    strokeLinecap="round"
                                                                    stroke="currentColor"
                                                                    fill="transparent"
                                                                    r="40"
                                                                    cx="48"
                                                                    cy="48"
                                                                    style={{
                                                                        animation: 'dash 3s linear forwards',
                                                                        strokeDashoffset: 251.2
                                                                    }}
                                                                />
                                                            </svg>
                                                            <style>{`
                                                            @keyframes dash {
                                                                to { stroke-dashoffset: 0; }
                                                            }
                                                        `}</style>
                                                        </div>
                                                    )}
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

                                                            // Calculate Planner Progress based on active singular quests
                                                            let plannerProgress = 0;

                                                            const memberActiveQuests = clanQuests.filter(q => q.assigned_user_id === member.id && q.status === 'locked');
                                                            if (memberActiveQuests.length > 0) {
                                                                const totalProgress = memberActiveQuests.reduce((acc, q) => acc + (q.current_value / Math.max(1, q.target_value)), 0);
                                                                plannerProgress = Math.min(100, (totalProgress / memberActiveQuests.length) * 100);
                                                            }

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

                                                                    {/* Planner Progress Bar */}
                                                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/50 rounded-full overflow-hidden border border-white/10 z-40">
                                                                        <div className="h-full bg-[var(--skin-accent-color)] transition-all duration-500" style={{ width: `${plannerProgress}%` }}></div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {occupants.length > 0 && (
                                                            <div className="absolute right-2 top-1 z-50 flex h-5 min-w-5 items-center justify-center rounded-full border border-black/30 bg-[var(--skin-accent-color)] px-1.5 text-[9px] font-black text-black shadow-[0_0_10px_rgba(0,0,0,0.45)]">
                                                                {occupants.length}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Slot Label (Transparent) */}
                                                    <div className={`mb-0.5 z-10 flex flex-col items-center gap-[1px] ${slot.id === 'trono' ? '' : ''}`}>

                                                        {/* Emoji (Left) */}
                                                        <div className="w-[18px] h-[18px] min-w-[18px] min-h-[18px] rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex flex-none items-center justify-center shadow-lg overflow-hidden">
                                                            <span className="text-[9px] leading-none drop-shadow-md flex items-center justify-center w-full h-full">
                                                                {slot.emoji}
                                                            </span>
                                                        </div>

                                                        {/* Health Bar - Fixed below text, discrete */}
                                                        {slot.id !== 'trono' && (
                                                            <div className="w-[20px] h-[3px] min-h-[3px] bg-black/60 rounded-full overflow-hidden flex-shrink-0">
                                                                <div
                                                                    className="h-full transition-all duration-500"
                                                                    style={{
                                                                        width: `${health}%`,
                                                                        background: isBasicMode ? 'var(--skin-accent-color)' : 'var(--metal-gold)',
                                                                        opacity: 0.9
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Aldeia Order Bar - Moved to Bottom */}
                                    <div className="absolute bottom-4 left-4 right-4 z-20">
                                        <div className="p-1">
                                            <div className="flex items-center justify-between mb-1 px-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-white shadow-black drop-shadow-md">{isOfficeClan ? 'Produtividade Total' : 'Ordem da Aldeia'}</span>
                                                <span className="text-xs font-mono font-bold shadow-black drop-shadow-md text-[var(--metal-gold)]">
                                                    {isOfficeClan ? `${aldeiaOrder} pts` : `${aldeiaOrder}%`}
                                                </span>
                                            </div>
                                            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${isOfficeClan ? Math.min(100, (aldeiaOrder / 500) * 100) : aldeiaOrder}%`,
                                                        background: 'var(--metal-gold)'
                                                    }}
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
                                            <button onClick={() => setSubModal('manage')} className="w-full py-2 text-sm rounded-lg luxe-button-secondary">Editar Grupo</button>
                                            <button onClick={() => setMembersPanel('requests')} className="w-full py-2 text-sm rounded-lg luxe-button-secondary">Entradas</button>
                                        </div>
                                    )}
                                    {userClanRole === 'leader' && (
                                        <div className="mb-4 rounded-2xl border border-white/10 bg-black/20 p-2">
                                            <div className="grid grid-cols-3 gap-2">
                                                <button
                                                    onClick={() => setMembersPanel('people')}
                                                    className={`rounded-xl py-2 text-[11px] font-black uppercase tracking-[0.12em] ${membersPanel === 'people' ? 'luxe-skin-button' : 'bg-white/10 text-white/70'}`}
                                                >
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <UsersIcon className="h-3.5 w-3.5" />
                                                        Pessoas
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => setMembersPanel('requests')}
                                                    className={`rounded-xl py-2 text-[11px] font-black uppercase tracking-[0.12em] ${membersPanel === 'requests' ? 'luxe-skin-button' : 'bg-white/10 text-white/70'}`}
                                                >
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <CheckIcon className="h-3.5 w-3.5" />
                                                        Pedidos
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() => setMembersPanel('invite')}
                                                    className={`rounded-xl py-2 text-[11px] font-black uppercase tracking-[0.12em] ${membersPanel === 'invite' ? 'luxe-skin-button' : 'bg-white/10 text-white/70'}`}
                                                >
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <SendIcon className="h-3.5 w-3.5" />
                                                        Convidar
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {userClanRole === 'leader' && membersPanel === 'requests' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between px-2 text-xs text-gray-300">
                                                <span className="font-bold uppercase tracking-wider">{isOfficeClan ? 'Candidatos' : 'Pedidos de entrada'}</span>
                                                <span>{clanJoinRequestsIncoming.length} pendentes</span>
                                            </div>
                                            {clanJoinRequestsIncoming.length > 0 ? clanJoinRequestsIncoming.map(request => {
                                                const nickname = request.requesterProfile?.nickname || 'Usuário';
                                                const initial = nickname.charAt(0).toUpperCase();
                                                return (
                                                    <div key={request.id} className="bg-black/20 p-3 rounded-2xl flex items-center gap-3 border border-white/10">
                                                        <div className="w-11 h-11 rounded-full border border-white/20 bg-gray-800 flex items-center justify-center text-sm font-bold shrink-0">
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-bold text-white truncate">{nickname}</div>
                                                            <p className="text-[11px] text-gray-400 leading-snug">Quer entrar no grupo.</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button onClick={() => approveClanJoinRequest(request)} className="p-2 rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30" title="Aceitar">
                                                                <CheckIcon className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => rejectClanJoinRequest(request)} className="p-2 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30" title="Recusar">
                                                                <XIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }) : (
                                                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-5 text-center text-sm text-gray-400">
                                                    Nenhum pedido pendente agora.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {userClanRole === 'leader' && membersPanel === 'invite' && (
                                        <div className="space-y-3">
                                            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-gray-300 leading-relaxed">
                                                Convites avisam a pessoa e levam ela até o grupo. A entrada ainda passa por aprovação.
                                            </div>
                                            {sentClanInvites.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between px-2 text-xs text-gray-300">
                                                        <span className="font-bold uppercase tracking-wider">Convites enviados</span>
                                                        <span>{sentClanInvites.length}</span>
                                                    </div>
                                                    {sentClanInvites.map((invite) => (
                                                        <div key={invite.id} className="bg-black/20 p-3 rounded-2xl flex items-center gap-3 border border-white/10">
                                                            <div className="w-10 h-10 rounded-full border border-white/15 bg-white/5 flex items-center justify-center shrink-0">
                                                                <SendIcon className="w-4 h-4 text-[var(--skin-accent-color)]" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-bold text-white truncate">{invite.metadata?.recipientNickname || invite.metadata?.email || 'Convite enviado'}</div>
                                                                <p className="text-[11px] text-gray-400 leading-snug">Aguardando a pessoa abrir o grupo e pedir entrada.</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleCancelClanInvite(invite.id)}
                                                                className="px-3 py-2 rounded-xl bg-red-500/12 text-red-300 text-[11px] font-black uppercase tracking-[0.12em] hover:bg-red-500/20 shrink-0"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between px-2 text-xs text-gray-300">
                                                    <span className="font-bold uppercase tracking-wider">Amizades fora do grupo</span>
                                                    <span>{availableFriendsForInvite.length}</span>
                                                </div>
                                                {availableFriendsForInvite.length > 0 ? availableFriendsForInvite.map(friend => {
                                                    const alreadySent = sentClanInvites.some(invite => invite.userId === friend.id);
                                                    return (
                                                        <div key={friend.id} className="bg-black/20 p-3 rounded-2xl flex items-center gap-3 border border-white/10">
                                                            <img src={friend.avatarUrl} alt={friend.nickname} className="w-10 h-10 rounded-full shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-bold text-white truncate">{friend.nickname}</div>
                                                                <p className="text-[11px] text-gray-400">Nível {friend.level}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleSendClanInvite(friend.id, friend.nickname)}
                                                                disabled={inviteBusyId === friend.id || alreadySent}
                                                                className="px-3 py-2 rounded-xl bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.12em] hover:bg-white/20 disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5"
                                                            >
                                                                <SendIcon className="w-3.5 h-3.5" />
                                                                {alreadySent ? 'Enviado' : 'Convidar'}
                                                            </button>
                                                        </div>
                                                    );
                                                }) : (
                                                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-5 text-center text-sm text-gray-400">
                                                        Nenhuma amizade disponível fora do grupo.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between px-2 text-xs text-gray-300">
                                        <span className="font-bold uppercase tracking-wider">Pessoas</span>
                                        <span>{enrichedClanMembers.length} total</span>
                                    </div>
                                    {(userClanRole !== 'leader' || membersPanel === 'people') && enrichedClanMembers.map(member => (
                                        <ClanMemberCard
                                            key={member.id}
                                            member={member}
                                            isLeaderView={userClanRole === 'leader'}
                                            onKick={setMemberToKick}
                                        />
                                    ))}
                                    <div className="mt-6 flex flex-col items-center space-y-2 text-center">
                                        <button onClick={handleLeaveRequest} className="text-sm font-bold text-red-400 hover:text-red-300">Sair do Grupo</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'missoes' && (
                                <div className="absolute inset-0 px-4 overflow-y-auto hide-scrollbar pt-4 pb-20">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-300">
                                            <span>{groupBoardTitle}</span>
                                            <span>{groupBoardCount} itens</span>
                                        </div>

                                        {groupBoardCount === 0 && (
                                            <GlassCard variant="neutral" className="p-4 text-center text-sm text-gray-300">
                                                {isOfficeClan ? 'Nenhuma tarefa da equipe ativa agora.' : 'Nenhuma jornada ativa agora.'}
                                            </GlassCard>
                                        )}

                                        {activeClanQuests.length > 0 && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {activeClanQuests.map((quest) => {
                                                    const preview = buildSeasonQuestArenaPreview(quest);
                                                    const totalGoal = getQuestGoal(quest);
                                                    const progress = getQuestProgress(quest);
                                                    const participantCount = clanQuestParticipants[quest.id] || 0;
                                                    const isClaimed = userProfile.completedSeasonMissions?.includes(quest.id);
                                                    const canClaimQuest = !isClaimed && progress >= 100;

                                                    const hasRuntimeArena = Boolean(findQuestArenaAndAction(quest).action);

                                                        return renderGroupTaskArenaTile({
                                                            tileKey: quest.id,
                                                            tileId: `clan-season-quest-card-${quest.id}`,
                                                            arena: preview.arena,
                                                            actions: preview.actions,
                                                            previewTasks: preview.previewTasks,
                                                        onCardClick: () => {
                                                            if (!openSeasonQuestArena(quest)) {
                                                                setSelectedQuest(quest);
                                                            }
                                                        },
                                                        badges: (
                                                            <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.18em]">
                                                                <div className="flex items-center gap-1 text-yellow-500 font-mono tracking-normal">
                                                                    <span>+{quest.rewards?.xp || quest.reward_value || 0} XP</span>
                                                                    {isClaimed && (
                                                                        <span className="rounded border border-green-500/30 bg-green-500/10 px-1.5 py-0.5 text-[8px] text-green-400">Resgatado</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-gray-400 tracking-normal">
                                                                    <UsersIcon className="h-3 w-3" />
                                                                    <span>{participantCount}</span>
                                                                </div>
                                                            </div>
                                                        ),
                                                        meta: (
                                                            <div className="space-y-1 text-[10px] text-gray-400">
                                                                <div className="flex items-center justify-between font-mono">
                                                                    <span>Progresso do grupo</span>
                                                                    <span>{getQuestRawProgress(quest)}/{totalGoal}</span>
                                                                </div>
                                                                <div className="text-right font-mono text-white/80">{Math.floor(progress)}%</div>
                                                            </div>
                                                        ),
                                                        controls: (
                                                            canClaimQuest ? (
                                                                <button
                                                                    id={`clan-quest-claim-${quest.id}`}
                                                                    onClick={() => handleClaimQuest(quest)}
                                                                    className="w-full rounded-lg border border-green-500/30 bg-green-500/12 py-2 text-[10px] font-bold uppercase tracking-wider text-green-300 hover:bg-green-500/18"
                                                                >
                                                                    Resgatar recompensa
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    id={`clan-season-quest-open-${quest.id}`}
                                                                    onClick={() => {
                                                                        if (!openSeasonQuestArena(quest)) {
                                                                            setSelectedQuest(quest);
                                                                        }
                                                                    }}
                                                                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-200 hover:border-[var(--skin-accent-color)]/40 hover:bg-[var(--skin-accent-color)]/10"
                                                                >
                                                                    Ver
                                                                </button>
                                                            )
                                                        ),
                                                    });
                                                })}
                                            </div>
                                        )}

                                        {/* AVAILABLE QUESTS FOR LEADER */}
                                        {userClanRole === 'leader' && availableClanQuests.length > 0 && (
                                            <>
                                                <div className="pt-4 text-center text-xs font-bold uppercase tracking-wider text-[var(--skin-accent-color)] border-t border-white/5 mt-4">
                                                    Prontas para ativar
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {availableClanQuests.map((quest) => {
                                                        const preview = buildSeasonQuestArenaPreview(quest);
                                                        return renderGroupTaskArenaTile({
                                                            tileKey: `available-${quest.id}`,
                                                            tileId: `clan-season-quest-card-${quest.id}`,
                                                            arena: preview.arena,
                                                            actions: preview.actions,
                                                            previewTasks: preview.previewTasks,
                                                            onCardClick: () => setSelectedQuest(quest),
                                                            muted: true,
                                                            badges: (
                                                                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
                                                                    <span>+{quest.rewards?.xp || quest.reward_value || 0} XP</span>
                                                                    <span>Pronta</span>
                                                                </div>
                                                            ),
                                                            meta: (
                                                                <div className="text-[10px] text-gray-500 line-clamp-2">
                                                                    {quest.description || 'Pronta para entrar no board do grupo.'}
                                                                </div>
                                                            ),
                                                            controls: (
                                                                <button
                                                                    id={`clan-quest-activate-${quest.id}`}
                                                                    onClick={() => {
                                                                        activateClanQuest(quest.id);
                                                                    }}
                                                                    className="w-full rounded-lg border border-[var(--skin-accent-color)]/30 bg-[var(--skin-accent-color)]/12 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--skin-accent-color)] hover:bg-[var(--skin-accent-color)]/18"
                                                                >
                                                                    Ativar tarefa
                                                                </button>
                                                            ),
                                                        });
                                                    })}
                                                </div>
                                            </>
                                        )}

                                        <div className="pt-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 border-t border-white/5 mt-4">
                                            Acoes da lideranca
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {clanQuests.map((quest: ClanCustomQuest) => {
                                            const isParticipating = myParticipations.includes(quest.id);
                                            const isLocked = quest.status === 'locked';
                                            const isMyLockedQuest = isLocked && quest.assigned_user_id === userProfile.id;
                                            const preview = buildCustomQuestArenaPreview(quest);
                                            const progressPercent = Math.floor(Math.min(100, (quest.current_value / Math.max(1, quest.target_value)) * 100));
                                            const isReservedByOther = quest.mission_type === 'singular' && isLocked && !isMyLockedQuest;

                                            return renderGroupTaskArenaTile({
                                                tileKey: `custom-preview-${quest.id}`,
                                                arena: preview.arena,
                                                actions: preview.actions,
                                                previewTasks: preview.previewTasks,
                                                onCardClick: isReservedByOther ? undefined : () => {
                                                    void handleCustomQuestEntry(quest);
                                                },
                                                muted: isReservedByOther,
                                                badges: (
                                                    <div className="flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-[0.18em]">
                                                        <div className="flex items-center gap-1">
                                                            <span className={`rounded border px-1.5 py-0.5 tracking-normal ${quest.mission_type === 'singular' ? 'border-purple-500/30 bg-purple-500/10 text-purple-300' : 'border-blue-500/30 bg-blue-500/10 text-blue-300'}`}>
                                                                {getMissionTypeLabel(quest.mission_type)}
                                                            </span>
                                                            {quest.priority === 'urgent' && (
                                                                <span className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 tracking-normal text-red-400">Urgente</span>
                                                            )}
                                                        </div>
                                                        <span className="font-mono tracking-normal text-yellow-500">+{quest.reward_xp} XP</span>
                                                    </div>
                                                ),
                                                meta: (
                                                    <div className="space-y-1 text-[10px] text-gray-400">
                                                        <div className="flex items-center justify-between font-mono">
                                                            <span>Progresso {quest.mission_type === 'shared' ? '(coletivo)' : ''}</span>
                                                            <span>{quest.current_value}/{quest.target_value}</span>
                                                        </div>
                                                        {isParticipating && quest.mission_type === 'shared' && (
                                                            <div className="text-right font-mono text-[var(--skin-accent-color)]">
                                                                Sua contribuicao: {myContributions[quest.id] || 0}
                                                            </div>
                                                        )}
                                                        {quest.due_date && (
                                                            <div className={`truncate ${new Date(quest.due_date) < new Date() ? 'font-bold text-red-400' : 'text-gray-500'}`}>
                                                                Prazo: {new Date(quest.due_date).toLocaleString()}
                                                            </div>
                                                        )}
                                                        <div className="text-right font-mono text-white/80">{progressPercent}%</div>
                                                    </div>
                                                ),
                                                controls: isReservedByOther ? (
                                                    <div className="w-full rounded-lg border border-red-500/20 bg-red-900/20 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-red-300">
                                                        Reservada por outra pessoa
                                                    </div>
                                                ) : !isParticipating ? (
                                                    <button
                                                        onClick={() => {
                                                            void handleCustomQuestEntry(quest);
                                                        }}
                                                        className="w-full rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-700/80 to-amber-900/80 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-100 hover:from-amber-600 hover:to-amber-800"
                                                    >
                                                        {getGroupActionLabel(quest, false)}
                                                    </button>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <button
                                                            onClick={() => {
                                                                void handleCustomQuestEntry(quest);
                                                            }}
                                                            className="w-full rounded-lg border border-purple-500/30 bg-purple-900/40 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-purple-300 hover:bg-purple-900/60"
                                                        >
                                                            {getGroupActionLabel(quest, true)}
                                                        </button>
                                                        <button
                                                            onClick={() => handleAbortMission(quest)}
                                                            className="mx-auto block rounded-lg border border-red-500/20 bg-transparent px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-red-300/80 hover:bg-red-900/20"
                                                        >
                                                            Devolver tarefa
                                                        </button>
                                                    </div>
                                                ),
                                            });
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Navigation */}
                        <div className="flex-none p-4 z-30 bg-gradient-to-t from-black/80 to-transparent">
                            <GlassCard variant="neutral" className="p-1">
                                <div className="flex items-center justify-center space-x-1 bg-black/20 p-1 rounded-2xl">
                                    <button id="clan-tab-sanctuary" onClick={() => setActiveTab('santuario')} className={`w-full py-2 text-sm font-bold rounded-lg ${activeTab === 'santuario' ? 'bg-white/10' : 'text-gray-400'}`}>
                                        {isOfficeClan ? 'Espaço' : 'Espaço'}
                                    </button>
                                    <button id="clan-tab-members" onClick={() => setActiveTab('membros')} className={`w-full py-2 text-sm font-bold rounded-lg ${activeTab === 'membros' ? 'bg-white/10' : 'text-gray-400'}`}>Pessoas</button>
                                    <button id="clan-tab-quests" onClick={() => setActiveTab('missoes')} className={`w-full py-2 text-sm font-bold rounded-lg ${activeTab === 'missoes' ? 'bg-white/10' : 'text-gray-400'}`}>{groupBoardTabLabel}</button>
                                </div>
                            </GlassCard>
                        </div>

                    </div>
                </div>
            </div>

            {selectedGroupArenaDetail && (
                <ArenaDetailModal
                    arena={selectedGroupArenaDetail.arena}
                    actionsOverride={selectedGroupArenaDetail.actions}
                    tasksOverride={selectedGroupArenaDetail.tasks}
                    readOnly={selectedGroupArenaDetail.readOnly}
                    onClose={() => setSelectedGroupArenaDetail(null)}
                />
            )}
            {selectedQuest && (
                <ClanMissionDetailModal
                    quest={selectedQuest}
                    progress={getQuestProgress(selectedQuest)}
                    currentValue={getQuestRawProgress(selectedQuest)}
                    isActivatedForClan={isQuestActivatedForClan(selectedQuest)}
                    isJoinedByUser={isQuestJoinedByUser(selectedQuest)}
                    onClose={() => setSelectedQuest(null)}
                    onTake={() => { void handleTakeQuest(selectedQuest); }}
                    onActivate={
                        (userClanRole === 'leader' && !activeClanQuests.some(q => q.id === selectedQuest.id))
                            ? () => {
                                activateClanQuest(selectedQuest.id);
                                setSelectedQuest(null);
                            }
                            : undefined
                    }
                    onClaim={() => handleClaimQuest(selectedQuest)}
                    canClaim={!userProfile.completedSeasonMissions?.includes(selectedQuest.id) && getQuestProgress(selectedQuest) >= 100}
                />
            )}
            {subModal === 'manage' && <ClanManagementModal onClose={() => setSubModal(null)} />}
            {memberToKick && (
                <ConfirmationModal
                    title="Remover Pessoa"
                    message={isOfficeClan ? `Tem certeza que deseja remover ${memberToKick.nickname} do grupo?` : `Tem certeza que deseja remover ${memberToKick.nickname} do grupo?`}
                    onConfirm={handleKickMember}
                    onCancel={() => setMemberToKick(null)}
                />
            )}
            {subModal === 'leave' && (
                <ConfirmationModal
                    title="Sair do Grupo"
                    message={userClanRole === 'leader' ? `Você é a última pessoa. Sair vai dissolver o grupo "${resolvedClanName}". Tem certeza?` : `Tem certeza que deseja sair de ${resolvedClanName}?`}
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
            {selectedSlotForModal && clan && (
                <ClanSlotModal
                    clanId={clan.id}
                    slotId={selectedSlotForModal}
                    slotLabel={slotsConfig.find(s => s.id === selectedSlotForModal)?.label || 'Espaco'}
                    slotEmoji={slotsConfig.find(s => s.id === selectedSlotForModal)?.emoji}
                    slotNote={slotsConfig.find(s => s.id === selectedSlotForModal)?.note}
                    occupant={enrichedClanMembers.find(m => aldeiaPresence.some(p => p.slotId === selectedSlotForModal && p.userId === m.id))}
                    clanQuests={clanQuests}
                    onClose={() => setSelectedSlotForModal(null)}
                    onOccupy={() => {
                        handleSlotClick(selectedSlotForModal);
                    }}
                    userRole={userClanRole || 'member'}
                    onUpdate={() => {
                        loadClanAndMembers(clan.id);
                        fetchQuests();
                    }}
                    myParticipations={myParticipations}
                    onOptIn={handleOptIn}
                    allSlots={slotsConfig}
                />
            )}
            {selectedMember && (
                <SovereignDetailModal
                    member={selectedMember}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </Portal>
    );
}
