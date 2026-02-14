
import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from './GlassCard';
import { XIcon, CheckIcon, UsersIcon, DoorIcon, ChevronDownIcon } from './Icons';
import { useGame } from '../contexts/GameContext';
import { UserProfile, EnrichedClanMember } from '../types';
import { Sovereign } from './Avatar';
import { ClanManagementModal } from './ClanManagementModal';
import { ConfirmationModal } from './ConfirmationModal';
import { TransferLeadershipModal } from './TransferLeadershipModal';
import { ClanMemberCard } from './ClanMemberCard';
import { AddClanMemberModal } from './AddClanMemberModal';
import { BackgroundImageSelectionModal } from './BackgroundImageSelectionModal';
import { DEFAULT_SANCTUARY_BACKGROUND, SANCTUARY_BACKGROUND_OPTIONS } from '../constants';

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

const ClanHeader: React.FC<{ userClanRole?: 'leader' | 'member' }> = ({ userClanRole }) => {
    const { clan, clanRanks, updateClan } = useGame();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editableDescription, setEditableDescription] = useState(clan?.description || '');
    
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
            <GlassCard variant="neutral" className="p-2 space-y-1 transition-all">
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
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                    <div className="text-xs text-gray-300 text-center animate-fade-in pt-1">
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

const getZoneAndState = (row: number, col: number): { zone: Zone, state: ActionState | null } => {
    if (row === 5) return { zone: 'Jardim', state: null };
    if (col <= 1) return { zone: 'Árvore', state: { name: 'Meditando', icon: '🧘', lore: 'O conhecimento flui através das raízes.' } };
    if (col <= 3) return { zone: 'Cristal', state: { name: 'Rezando', icon: '🙏', lore: 'A energia do universo se concentra aqui.' } };
    if (col <= 5) return { zone: 'Descanso', state: { name: 'Descansando', icon: '🍵', lore: 'A sabedoria requer pausa. Estou recuperando mana.' } };
    return { zone: 'Indefinida', state: { name: 'Ocioso', icon: '...', lore: 'Observando o santuário.' } };
};

export const ClanDetailModal: React.FC<{ clanName: string; onClose: () => void; }> = ({ clanName, onClose }) => {
    const { userProfile, enrichedClanMembers, leaveClan, kickClanMember, transferLeadershipAndLeave, deleteClan, clan, seasons, updateClan } = useGame();
    const [activeTab, setActiveTab] = useState<ClanDetailTab>('santuario');
    const [userPlacement, setUserPlacement] = useState<MemberPlacement>({ member: userProfile, gridPos: { row: 4, col: 3 }, state: getZoneAndState(4, 3).state! });
    const [otherPlacements, setOtherPlacements] = useState<MemberPlacement[]>([]);
    const [occupiedCells, setOccupiedCells] = useState<Set<string>>(new Set());
    const [showGardenModal, setShowGardenModal] = useState(false);
    const [targetGardenPos, setTargetGardenPos] = useState<{row: number, col: number} | null>(null);
    const [subModal, setSubModal] = useState<'manage' | 'leave' | 'transfer' | null>(null);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [memberToKick, setMemberToKick] = useState<EnrichedClanMember | null>(null);
    const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
    
    const userClanRole = useMemo(() => {
        return enrichedClanMembers.find(m => m.id === userProfile.id)?.role;
    }, [enrichedClanMembers, userProfile.id]);

    const activeSeason = seasons.find(s => s.is_active);
    const today = new Date().toISOString().split('T')[0];
    const canEditBackground = !!activeSeason && activeSeason.start_date === today;
    const sanctuaryBackground = clan?.backgroundUrl || DEFAULT_SANCTUARY_BACKGROUND;

    useEffect(() => {
        const allOccupied = new Set<string>([`${userPlacement.gridPos.row},${userPlacement.gridPos.col}`]);
        const otherMembers = enrichedClanMembers.filter(m => m.id !== userProfile.id);
        const newPlacements: MemberPlacement[] = [];

        otherMembers.forEach(member => {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 50) {
                const row = Math.floor(Math.random() * 6);
                const col = Math.floor(Math.random() * 6);
                const posKey = `${row},${col}`;
                if (!allOccupied.has(posKey)) {
                    const { state } = getZoneAndState(row, col);
                    const finalState = state || { name: "Trabalhando", icon: "🛠️", lore: "A terra fértil recompensa o esforço." };
                    newPlacements.push({ member, gridPos: { row, col }, state: finalState });
                    allOccupied.add(posKey);
                    placed = true;
                }
                attempts++;
            }
        });
        setOtherPlacements(newPlacements);
        setOccupiedCells(allOccupied);
    }, [enrichedClanMembers, userProfile]);

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
            newSet.delete(`${userPlacement.gridPos.row},${userPlacement.gridPos.col}`);
            newSet.add(`${gridPos.row},${gridPos.col}`);
            return newSet;
        });
        setUserPlacement(prev => ({ ...prev, gridPos, state }));
    }

    const allMembers = useMemo(() => [userPlacement, ...otherPlacements], [userPlacement, otherPlacements]);

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
    
    const [missions, setMissions] = useState([
        { id: 1, title: 'Raid Semanal: Acumular 50h de Foco', progress: 75, pledged: false, totalPledges: 4, requiredPledges: 5 },
        { id: 2, title: 'Desafio do Clã: Completar 100 Ações', progress: 42, pledged: false, totalPledges: 2, requiredPledges: 5 },
    ]);

    const handlePledge = (id: number) => {
        setMissions(prev => prev.map(m => {
            if (m.id === id) {
                return { ...m, pledged: true, totalPledges: m.totalPledges + 1 };
            }
            return m;
        }));
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
                <div className="relative w-full max-w-sm m-4 aspect-[9/16] rounded-3xl" onClick={e => e.stopPropagation()}>
                    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-cover bg-center border border-white/10" style={{ backgroundImage: `url('${sanctuaryBackground}')` }}>
                        <ClanHeader userClanRole={userClanRole} />
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
                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6">
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
                        )}
                        
                        {activeTab === 'membros' && (
                            <div className="absolute top-28 bottom-24 left-4 right-4 overflow-y-auto space-y-2 hide-scrollbar">
                                {userClanRole === 'leader' && (
                                    <div className="flex space-x-2 mb-4 p-2 bg-black/20 rounded-xl sticky top-0 z-10 backdrop-blur-sm">
                                        <button onClick={() => setSubModal('manage')} className="w-full py-2 text-sm rounded-lg luxe-button-secondary">Editar Clã</button>
                                        <button onClick={() => setIsAddMemberModalOpen(true)} className="w-full py-2 text-sm rounded-lg luxe-button-secondary">Convidar</button>
                                    </div>
                                )}
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
                            <div className="absolute top-28 bottom-24 left-4 right-4 overflow-y-auto space-y-3 hide-scrollbar">
                                {missions.map(mission => {
                                    const isFullyPledged = mission.totalPledges >= mission.requiredPledges;
                                    const isCompleted = mission.progress >= 100;

                                    return (
                                        <GlassCard key={mission.id} variant={isCompleted ? 'gold' : 'neutral'} className={`p-4 transition-all duration-300 ${isCompleted ? 'border-[var(--gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : ''}`}>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-sm w-2/3">{mission.title}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs font-mono">{mission.progress}%</span>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'border-[var(--gold)] bg-[var(--gold)] text-black' : 'border-gray-500'}`}>
                                                            {isCompleted && <CheckIcon className="w-4 h-4" />}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-[var(--gold)]' : 'bg-gray-500'}`} style={{width: `${mission.progress}%`}}></div>
                                                </div>

                                                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                                                        <span className={isFullyPledged ? 'text-[var(--gold)]' : ''}>{mission.totalPledges}/{mission.requiredPledges}</span>
                                                        <span>Pactos</span>
                                                    </div>
                                                    
                                                    {!mission.pledged ? (
                                                        <button 
                                                            onClick={() => handlePledge(mission.id)}
                                                            className="px-3 py-1 rounded-lg text-xs font-bold border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black transition-colors"
                                                        >
                                                            FIRMAR PACTO
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-1 bg-[var(--gold)]/10 px-2 py-1 rounded">
                                                            <div className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-pulse"></div>
                                                            Pacto Ativo
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {isCompleted && (
                                                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-12 h-12 flex items-center justify-center bg-[var(--gold)] text-black rounded-full shadow-lg font-black text-xs border-2 border-white transform rotate-12 animate-bounce-slow z-10">
                                                        SELO
                                                    </div>
                                                )}
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
                                    <button onClick={() => setActiveTab('missoes')} className={`w-full py-2 text-sm font-bold rounded-lg ${activeTab === 'missoes' ? 'bg-white/10' : 'text-gray-400'}`}>Missões</button>
                                </div>
                            </GlassCard>
                        </div>

                    </div>
                </div>
            </div>
            
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
