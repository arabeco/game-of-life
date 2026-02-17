
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { XIcon, CheckIcon, UsersIcon, DoorIcon, ChevronDownIcon } from './Icons';
import { useGame } from '../contexts/GameContext';
import { Arena, UserProfile, EnrichedClanMember, SeasonQuest } from '../types';
import { Sovereign } from './Avatar';
import { ClanManagementModal } from './ClanManagementModal';
import { ConfirmationModal } from './ConfirmationModal';
import { TransferLeadershipModal } from './TransferLeadershipModal';
import { ClanMemberCard } from './ClanMemberCard';
import { AddClanMemberModal } from './AddClanMemberModal';
import { BackgroundImageSelectionModal } from './BackgroundImageSelectionModal';
import { DEFAULT_SANCTUARY_BACKGROUND, SANCTUARY_BACKGROUND_OPTIONS } from '../constants';
import { ArenaDetailModal } from './ArenaDetailModal';
import { CompactSanctuaryStats } from './CompactSanctuaryStats';
import { getSanctuaryArea } from '../utils/sanctuaryUtils';

// --- Types ---
type Zone = 'Árvore' | 'Cristal' | 'Descanso' | 'Jardim' | 'Indefinida';
type ActionState = { name: string, icon: string, lore: string };
type MemberPlacement = {
    member: UserProfile | EnrichedClanMember;
    gridPos: { row: number, col: number };
    state: ActionState;
};
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
    const progressPercentage = expToNextRank > 0 ? (progressInRank / expToNextRank) * 100 : 100;

    const handleSaveDescription = async () => {
        if (!clan) return;
        await updateClan(clan.id, { description: editableDescription });
        setIsEditingDescription(false);
    };

    return (
        <div className="absolute top-0 left-0 right-0 p-4 z-30">
            <GlassCard variant="neutral" className="p-2 space-y-1">
                <div className="text-center">
                    <h2 className="text-lg font-black text-white luxe-title-shadow">{clan.name}</h2>
                    <p className="text-xs text-gray-300 font-bold">{currentRank?.name || 'N/A'}</p>
                </div>
                <div className="w-full bg-black/30 rounded-full h-1.5 mt-1">
                    <div className="bg-[var(--gold)] h-full rounded-full" style={{ width: `${progressPercentage}%` }}></div>
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

const ClanMissionDetailModal: React.FC<{ quest: SeasonQuest; progress: number; isActive: boolean; onClose: () => void; onTake: () => void; currentValue: number }> = ({ quest, progress, isActive, onClose, onTake, currentValue }) => {
    const { fetchClanQuestParticipants, clanQuestParticipants } = useGame();
    
    useEffect(() => {
        if (quest.id && quest.actionTemplate?.name) {
            fetchClanQuestParticipants(quest.id, quest.actionTemplate.name);
        }
    }, [quest.id, quest.actionTemplate?.name, fetchClanQuestParticipants]);

    const participants = clanQuestParticipants[quest.id] || 0;
    const actionsRemaining = Math.max(0, quest.goal_value - currentValue);
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-4 rounded-3xl p-4" onClick={e => e.stopPropagation()}>
                <div className="text-center space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-widest">{quest.title}</h3>
                    <p className="text-xs text-gray-300">{quest.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-black/30 rounded-xl p-2">
                        <div className="text-[10px] uppercase text-gray-400 font-bold">Participantes</div>
                        <div className="text-lg font-mono text-[var(--gold)] flex items-center justify-center gap-1">
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
                        <div className="bg-[var(--gold)] h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <div className="space-y-2">
                    <button onClick={onTake} disabled={isActive} className={`w-full py-2 rounded-xl text-xs font-bold ${isActive ? 'bg-white/10 text-gray-400' : 'luxe-button-primary'}`}>
                        {isActive ? 'QUEST ATIVA' : 'PEGAR QUEST'}
                    </button>
                    <button onClick={onClose} className="w-full py-2 rounded-xl text-xs font-bold bg-black/30 text-gray-300 hover:bg-black/50">
                        FECHAR
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

// Componente para barrinhas douradas de tempo
const GoldenTimeBar: React.FC<{ area: string; totalTime: number; maxTime: number }> = ({ area, totalTime, maxTime }) => {
    const percentage = Math.min(100, (totalTime / maxTime) * 100);
    const getAreaIcon = (area: string) => {
        switch (area) {
            case 'meditation': return '🧘';
            case 'devotion': return '🙏';
            case 'rest': return '🍵';
            case 'garden': return '🌱';
            default: return '⏱️';
        }
    };
    
    return (
        <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs">{getAreaIcon(area)}</span>
            <div className="flex-1 bg-black/30 rounded-full h-2">
                <div 
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-xs text-gray-300">{Math.floor(totalTime / 60)}m</span>
        </div>
    );
};

const ClanMember: React.FC<{ placement: MemberPlacement }> = ({ placement }) => {
    return (
        <div
            className="absolute transition-all duration-500"
            style={{
                gridRowStart: placement.gridPos.row + 1,
                gridColumnStart: placement.gridPos.col + 1,
            }}
        >
            <div className="relative group w-20 h-32 flex flex-col items-center justify-end">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 w-max max-w-xs bg-black/90 text-white text-xs rounded-lg py-1 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    "{placement.state.lore}"
                </div>
                
                {/* Avatar */}
                <div className="w-20 h-32 cursor-pointer filter hover:drop-shadow-lg">
                     <Sovereign sovereignConfig={placement.member.sovereign!} />
                </div>
                
                {/* Nametag Pill */}
                <div className="absolute bottom-0 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-xs flex items-center space-x-1.5 border border-white/10">
                    <span className="font-bold text-white truncate max-w-[50px]">{placement.member.nickname}</span>
                    <div className="w-px h-3 bg-white/20"></div>
                    <span className="text-gray-300 flex items-center space-x-1">
                        <span>{placement.state.icon}</span>
                        <span>{placement.state.name}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

const GardenActionModal: React.FC<{ onSelect: (state: ActionState) => void, onClose: () => void }> = ({ onSelect, onClose }) => {
    const gardenActions: ActionState[] = [
        { name: "Trabalhando", icon: "🛠️", lore: "A terra fértil recompensa o esforço." },
        { name: "Regando", icon: "💧", lore: "Cada gota de água é um ato de fé no futuro." },
        { name: "Passeando", icon: "🚶", lore: "Contemplando o crescimento, encontro minha paz." },
    ];
    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-xs m-4 space-y-2" onClick={e => e.stopPropagation()}>
                <h3 className="text-center font-bold">Ação no Jardim</h3>
                {gardenActions.map(action => (
                    <button key={action.name} onClick={() => onSelect(action)} className="w-full p-3 bg-black/20 rounded-xl hover:bg-white/10 text-left">
                        {action.icon} {action.name}
                    </button>
                ))}
            </GlassCard>
        </div>
    );
};

const MissionCard: React.FC<{ title: string; progress: number; }> = ({ title, progress }) => (
    <GlassCard variant="neutral" className="p-3 cursor-pointer">
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{title}</span>
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono">{progress}%</span>
                    <div className="w-5 h-5 rounded-full border-2 border-gray-500 flex items-center justify-center">
                        {progress === 100 && <CheckIcon className="w-3 h-3 text-green-400" />}
                    </div>
                </div>
            </div>
            <div className="w-full bg-black/30 rounded-full h-1"><div className="bg-[var(--gold)] h-1 rounded-full" style={{width: `${progress}%`}}></div></div>
        </div>
    </GlassCard>
);


// --- Main Modal ---

// Verificar se o usuário tem posição válida (não expirou há 6 horas)
const hasValidPosition = (userId: string): boolean => {
    const position = userPositions.get(userId);
    if (!position) return false;
    
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
    const lastUpdated = new Date(position.lastUpdated);
    
    return lastUpdated > sixHoursAgo;
};


const getZoneAndState = (row: number, col: number): { zone: Zone, state: ActionState | null } => {
    if (row === 5) return { zone: 'Jardim', state: null };
    if (col <= 1) return { zone: 'Árvore', state: { name: 'Meditando', icon: '🧘', lore: 'O conhecimento flui através das raízes.' } };
    if (col <= 3) return { zone: 'Cristal', state: { name: 'Rezando', icon: '🙏', lore: 'A energia do universo se concentra aqui.' } };
    if (col <= 5) return { zone: 'Descanso', state: { name: 'Descansando', icon: '🍵', lore: 'A sabedoria requer pausa. Estou recuperando mana.' } };
    return { zone: 'Indefinida', state: { name: 'Ocioso', icon: '...', lore: 'Observando o santuário.' } };
};

export const ClanDetailModal: React.FC<{ clanName: string; onClose: () => void; }> = ({ clanName, onClose }) => {
    const { userProfile, enrichedClanMembers, clanJoinRequestsIncoming, approveClanJoinRequest, rejectClanJoinRequest, leaveClan, kickClanMember, transferLeadershipAndLeave, deleteClan, clan, seasons, seasonQuests, getClanQuestProgress, updateClan, tasks, assets, getArenas, getActionsForArena, addArena, addAction, saveSanctuaryPosition, applySanctuaryAreaDecay, loadClanAndMembers, acceptSeasonQuest } = useGame();
    const [activeTab, setActiveTab] = useState<ClanDetailTab>('santuario');
    const [userPlacement, setUserPlacement] = useState<MemberPlacement | null>(null);
    const [otherPlacements, setOtherPlacements] = useState<MemberPlacement[]>([]);
    const [occupiedCells, setOccupiedCells] = useState<Set<string>>(new Set());
    const [userPositions, setUserPositions] = useState<Map<string, {row: number, col: number, lastUpdated: string}>>(new Map());
    const userPositionsRef = useRef(userPositions);
    const enrichedClanMembersRef = useRef(enrichedClanMembers);
    
    // Atualizar refs quando mudam
    useEffect(() => {
        userPositionsRef.current = userPositions;
    }, [userPositions]);
    
    useEffect(() => {
        enrichedClanMembersRef.current = enrichedClanMembers;
    }, [enrichedClanMembers]);

    // Force refresh members when opening modal
    useEffect(() => {
        if (clan?.id) {
            loadClanAndMembers(clan.id, true);
        }
    }, [clan?.id, loadClanAndMembers]);
    
    const [sanctuaryStats, setSanctuaryStats] = useState<{ meditation: number; devotion: number; rest: number; garden: number }>({ meditation: 14400, devotion: 14400, rest: 14400, garden: 14400 }); // Começar em 50% (4 horas = 14400 segundos)
    const [showGardenModal, setShowGardenModal] = useState(false);
    const [targetGardenPos, setTargetGardenPos] = useState<{row: number, col: number} | null>(null);
    const [subModal, setSubModal] = useState<'manage' | 'leave' | 'transfer' | null>(null);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [memberToKick, setMemberToKick] = useState<EnrichedClanMember | null>(null);
    const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState<SeasonQuest | null>(null);
    const [expandDescription, setExpandDescription] = useState(false);
    
    const userClanRole = useMemo(() => {
        return enrichedClanMembers.find(m => m.id === userProfile.id)?.role;
    }, [enrichedClanMembers, userProfile.id]);

    const activeSeason = seasons.find(s => s.is_active);
    const todayString = new Date().toISOString().split('T')[0];
    const canEditBackground = !!activeSeason && activeSeason.start_date === todayString;
    const sanctuaryBackground = clan?.backgroundUrl || DEFAULT_SANCTUARY_BACKGROUND;

    // Remover posições expiradas
    const removeExpiredPositions = () => {
        const sixHoursAgo = new Date();
        sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
        
        setUserPositions(prev => {
            const newPositions = new Map(prev);
            for (const [userId, position] of prev.entries()) {
                const lastUpdated = new Date(position.lastUpdated);
                if (lastUpdated <= sixHoursAgo) {
                    newPositions.delete(userId);
                }
            }
            return newPositions;
        });
    };

    // Carregar posições do localStorage ao montar o componente
    useEffect(() => {
        const loadPositions = () => {
            const positions = new Map<string, {row: number, col: number, lastUpdated: string}>();
            
            // Carregar posição do usuário atual
            const userPositionData = localStorage.getItem(`clanPosition_${userProfile.id}`);
            if (userPositionData) {
                try {
                    const position = JSON.parse(userPositionData);
                    positions.set(userProfile.id, position);
                } catch (e) {
                    console.error('Erro ao carregar posição do usuário:', e);
                }
            }
            
            // Carregar posições de outros membros
            enrichedClanMembers.forEach(member => {
                const memberPositionData = localStorage.getItem(`clanPosition_${member.id}`);
                if (memberPositionData) {
                    try {
                        const position = JSON.parse(memberPositionData);
                        positions.set(member.id, position);
                    } catch (e) {
                        console.error(`Erro ao carregar posição do membro ${member.id}:`, e);
                    }
                }
            });
            
            setUserPositions(positions);
        };
        
        loadPositions();
    }, [userProfile.id, enrichedClanMembers]);

    // Atualizar estatísticas diariamente (começando em 50%) - com debounce para evitar atualizações frequentes
    const sanctuaryUpdateTimeoutRef = useRef<number | null>(null);
    
    useEffect(() => {
        const checkDailyUpdate = () => {
            removeExpiredPositions();

            // Verificar se é um novo dia (comparando com meia-noite)
            const now = new Date();
            const lastUpdate = localStorage.getItem(`lastSanctuaryUpdate_${clan?.id}`);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            let shouldReset = false;
            if (lastUpdate) {
                const lastUpdateDate = new Date(lastUpdate);
                const lastUpdateDay = new Date(lastUpdateDate.getFullYear(), lastUpdateDate.getMonth(), lastUpdateDate.getDate());
                shouldReset = today.getTime() !== lastUpdateDay.getTime();
            } else {
                shouldReset = true; // Primeira vez
            }

            if (shouldReset) {
                // Resetar para 50% (4 horas = 14400 segundos)
                setSanctuaryStats({
                    meditation: 14400,
                    devotion: 14400,
                    rest: 14400,
                    garden: 14400
                });
                
                // Salvar data da última atualização
                localStorage.setItem(`lastSanctuaryUpdate_${clan?.id}`, now.toISOString());
                
                // Aplicar ocupação do dia atual
                const occupancy = { meditation: 0, devotion: 0, rest: 0, garden: 0 };
                const currentPositions = userPositionsRef.current;
                
                // Verificar posição do usuário atual
                const userPosition = currentPositions.get(userProfile.id);
                if (userPosition && hasValidPosition(userProfile.id)) {
                    const area = getSanctuaryArea(userPosition.row, userPosition.col);
                    occupancy[area] += 1;
                }
                
                // Verificar posições dos outros membros (usar cached members para evitar atualizações frequentes)
                const cachedMembers = enrichedClanMembers;
                cachedMembers.forEach(member => {
                    const memberPosition = currentPositions.get(member.id);
                    if (memberPosition && hasValidPosition(member.id)) {
                        const area = getSanctuaryArea(memberPosition.row, memberPosition.col);
                        occupancy[area] += 1;
                    }
                });

                // Aplicar ocupação do dia usando a função do GameContext
                if (clan?.id) {
                    applySanctuaryAreaDecay(clan.id, occupancy);
                }
            }
        };

        // Clear existing timeout to prevent multiple calls
        if (sanctuaryUpdateTimeoutRef.current !== null) {
            window.clearTimeout(sanctuaryUpdateTimeoutRef.current);
        }

        // Debounce the update to prevent frequent re-renders
        sanctuaryUpdateTimeoutRef.current = window.setTimeout(() => {
            checkDailyUpdate();
        }, 1000); // 1 segundo de debounce

        // Executar imediatamente e depois verificar a cada hora (para garantir que não perca o reset diário)
        const interval = setInterval(() => {
            if (sanctuaryUpdateTimeoutRef.current !== null) {
                window.clearTimeout(sanctuaryUpdateTimeoutRef.current);
            }
            sanctuaryUpdateTimeoutRef.current = window.setTimeout(checkDailyUpdate, 1000);
        }, 3600000); // Verificar a cada hora

        return () => {
            if (sanctuaryUpdateTimeoutRef.current !== null) {
                window.clearTimeout(sanctuaryUpdateTimeoutRef.current);
            }
            clearInterval(interval);
        };
    }, [userProfile.id, clan?.id, applySanctuaryAreaDecay]); // Remover enrichedClanMembers da dependência

    // Posicionar membros com debounce para evitar atualizações frequentes
    const positioningTimeoutRef = useRef<number | null>(null);
    
    useEffect(() => {
        const updatePositions = () => {
            const allOccupied = new Set<string>();
            const newPlacements: MemberPlacement[] = [];
            
            // Posicionar usuário atual apenas se tiver posição válida
            const userPosition = userPositions.get(userProfile.id);
            if (userPosition && hasValidPosition(userProfile.id)) {
                const { state } = getZoneAndState(userPosition.row, userPosition.col);
                const finalState = state || { name: "Trabalhando", icon: "🛠️", lore: "A terra fértil recompensa o esforço." };
                setUserPlacement({ member: userProfile, gridPos: userPosition, state: finalState });
                allOccupied.add(`${userPosition.row},${userPosition.col}`);
            } else {
                setUserPlacement(null);
            }
            
            // Posicionar outros membros apenas se tiverem posições válidas
            const otherMembers = enrichedClanMembersRef.current.filter(m => m.id !== userProfile.id);
            otherMembers.forEach(member => {
                const memberPosition = userPositions.get(member.id);
                if (memberPosition && hasValidPosition(member.id)) {
                    const posKey = `${memberPosition.row},${memberPosition.col}`;
                    if (!allOccupied.has(posKey)) {
                        const { state } = getZoneAndState(memberPosition.row, memberPosition.col);
                        const finalState = state || { name: "Trabalhando", icon: "🛠️", lore: "A terra fértil recompensa o esforço." };
                        newPlacements.push({ member, gridPos: memberPosition, state: finalState });
                        allOccupied.add(posKey);
                    }
                }
            });
            
            setOtherPlacements(newPlacements);
            setOccupiedCells(allOccupied);
        };

        // Clear existing timeout to prevent multiple calls
        if (positioningTimeoutRef.current !== null) {
            window.clearTimeout(positioningTimeoutRef.current);
        }

        // Debounce the positioning update
        positioningTimeoutRef.current = window.setTimeout(updatePositions, 500); // 0.5 segundo de debounce

        return () => {
            if (positioningTimeoutRef.current !== null) {
                window.clearTimeout(positioningTimeoutRef.current);
            }
        };
    }, [userProfile.id]); // Reduzir dependências para evitar atualizações frequentes

    const handleCellClick = (row: number, col: number) => {
        const posKey = `${row},${col}`;
        if (occupiedCells.has(posKey)) {
            const cell = document.getElementById(`cell-${row}-${col}`);
            if(cell) {
                cell.classList.add('animate-pulse', 'bg-red-500/50');
                setTimeout(() => cell.classList.remove('animate-pulse', 'bg-red-500/50'), 500);
            }
            return;
        }

        const { zone, state } = getZoneAndState(row, col);

        if (zone === 'Jardim') {
            setTargetGardenPos({row, col});
            setShowGardenModal(true);
        } else if (state) {
            updateUserPosition({row, col}, state);
            // Save position to localStorage with timestamp
            const newPosition = { row, col, lastUpdated: new Date().toISOString() };
            setUserPositions(prev => new Map(prev).set(userProfile.id, newPosition));
            localStorage.setItem(`clanPosition_${userProfile.id}`, JSON.stringify(newPosition));
        }
    };
    
    const handleGardenActionSelect = (state: ActionState) => {
        if(targetGardenPos) {
            updateUserPosition(targetGardenPos, state);
        }
        setShowGardenModal(false);
        setTargetGardenPos(null);
    }

    const updateUserPosition = (gridPos: {row: number, col: number}, state: ActionState) => {
        setOccupiedCells(prev => {
            const newSet = new Set(prev);
            if (userPlacement) {
                newSet.delete(`${userPlacement.gridPos.row},${userPlacement.gridPos.col}`);
            }
            newSet.add(`${gridPos.row},${gridPos.col}`);
            return newSet;
        });
        
        // Save position with timestamp
        const newPosition = { row: gridPos.row, col: gridPos.col, lastUpdated: new Date().toISOString() };
        setUserPositions(prev => new Map(prev).set(userProfile.id, newPosition));
        localStorage.setItem(`clanPosition_${userProfile.id}`, JSON.stringify(newPosition));
        if (clan) {
            const area = getSanctuaryArea(gridPos.row, gridPos.col);
            saveSanctuaryPosition({
                clanId: clan.id,
                userId: userProfile.id,
                row: gridPos.row,
                col: gridPos.col,
                area,
                action: state.name,
                timestamp: newPosition.lastUpdated
            });
        }
        
        setUserPlacement({ member: userProfile, gridPos, state });
    }

    const areaStats = sanctuaryStats;

    const allMembers = useMemo(() => {
        const members = [...otherPlacements];
        if (userPlacement) {
            members.unshift(userPlacement);
        }
        return members;
    }, [userPlacement, otherPlacements]);

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
    }

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
        return getActionsForArena(arena.id).some(action => action.name === quest.title || action.name === quest.action?.name);
    };

    const getQuestRawProgress = (quest: SeasonQuest) => {
        return getClanQuestProgress(quest.id);
    };

    const getQuestProgress = (quest: SeasonQuest) => {
        const completed = getClanQuestProgress(quest.id);
        if (quest.goal_value > 0) return Math.min(100, Math.round((completed / quest.goal_value) * 100));
        return Math.min(100, completed);
    };

    const handleTakeQuest = (quest: SeasonQuest) => {
        acceptSeasonQuest(quest.id);
        setSelectedQuest(null);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
                <div className="relative w-full max-w-sm m-4 aspect-[9/16] rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-cover bg-center border border-white/10" style={{ backgroundImage: `url('${sanctuaryBackground}')` }}>
                        <ClanHeader userClanRole={userClanRole} expandDescription={expandDescription} />
                        
                        {/* Removido overlay das barrinhas para evitar piscar */}
                        
                        <button onClick={onClose} className="absolute top-4 right-4 z-40 p-1 rounded-full bg-black/50 hover:bg-black/80"><XIcon className="w-5 h-5"/></button>
                        {userClanRole === 'leader' && (
                            <button
                                onClick={() => canEditBackground && setIsBackgroundModalOpen(true)}
                                disabled={!canEditBackground}
                                className={`absolute top-4 left-4 z-40 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${canEditBackground ? 'bg-black/50 text-white hover:bg-black/80' : 'bg-black/30 text-gray-400 cursor-not-allowed'}`}
                            >
                                {canEditBackground ? 'Editar Fundo' : 'Fundo Bloqueado'}
                            </button>
                        )}

                        {activeTab === 'santuario' && (
                            <>
                                <div className="absolute top-64 left-4 right-4 bottom-4">
                                    <div className="grid grid-cols-6 grid-rows-6 h-full">
                                        {[...Array(36)].map((_, i) => {
                                            const row = Math.floor(i / 6);
                                            const col = i % 6;
                                            return (
                                                <div
                                                    key={i}
                                                    id={`cell-${row}-${col}`}
                                                    className="border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                                                    onClick={() => handleCellClick(row, col)}
                                                />
                                            );
                                        })}
                                        {allMembers.map(placement => <ClanMember key={placement.member.id} placement={placement} />)}
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {activeTab === 'membros' && (
                            <div className="absolute top-28 bottom-24 left-4 right-4 overflow-y-auto space-y-2 hide-scrollbar">
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
                            <div className="absolute top-28 bottom-24 left-4 right-4 overflow-y-auto hide-scrollbar">
                                <div className="space-y-3">
                                    {clan && (
                <CompactSanctuaryStats clanId={clan.id} />
                                    )}
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
                                        <GlassCard key={quest.id} variant={isCompleted ? 'gold' : 'neutral'} className={`p-4 transition-all duration-300 cursor-pointer ${isCompleted ? 'border-[var(--gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : ''}`} onClick={() => setSelectedQuest(quest)}>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-sm w-2/3">{quest.title}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs font-mono">{progress}%</span>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'border-[var(--gold)] bg-[var(--gold)] text-black' : 'border-gray-500'}`}>
                                                            {isCompleted && <CheckIcon className="w-4 h-4" />}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-[var(--gold)]' : 'bg-gray-500'}`} style={{width: `${progress}%`}}></div>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    );
                                })}
                            </div>
                        )}
                        
                        <div className="absolute bottom-4 left-4 right-4 z-30">
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
                />
            )}
            {showGardenModal && <GardenActionModal onSelect={handleGardenActionSelect} onClose={() => setShowGardenModal(false)} />}
            {isAddMemberModalOpen && <AddClanMemberModal onClose={() => setIsAddMemberModalOpen(false)} />}
            {subModal === 'manage' && <ClanManagementModal onClose={() => setSubModal(null)} />}
            {isBackgroundModalOpen && (
                <BackgroundImageSelectionModal
                    currentBackground={sanctuaryBackground}
                    onSelect={handleBackgroundSelect}
                    onClose={() => setIsBackgroundModalOpen(false)}
                    options={SANCTUARY_BACKGROUND_OPTIONS}
                    title="Fundo do Santuário"
                    showUpload={false}
                />
            )}
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
        </>
    );
}
