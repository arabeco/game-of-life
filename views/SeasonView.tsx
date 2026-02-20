import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { ChevronRightIcon, UsersIcon, CheckIcon, XIcon } from '../components/Icons';
import { ConfigSeasonQuest, ChestType } from '../types';
import { SEASONS, ACTIVE_SEASON_ID } from '../constants/GameContent';
import { ChestOpeningModal } from '../components/ChestOpeningModal';

const MissionCard: React.FC<{ title: string; progress: number; onClick?: () => void }> = ({ title, progress, onClick }) => (
    <GlassCard variant="neutral" className={`p-3 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}><div className="flex items-center justify-between"><span className="font-semibold text-sm">{title}</span><div className="flex items-center space-x-2"><span className="text-xs font-mono">{progress}%</span><div className="w-5 h-5 rounded-full border-2 border-[var(--skin-accent-color)] flex items-center justify-center">{progress === 100 && <CheckIcon className="w-3 h-3 accent-text" />}</div></div></div></GlassCard>
);

const MissionDetailModal: React.FC<{ mission: { title: string; progress: number }, onClose: () => void }> = ({ mission, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in" onClick={onClose}><GlassCard variant="neutral" className="w-full max-w-sm m-4 space-y-6 rounded-3xl" onClick={e => e.stopPropagation()}><h2 className="text-lg font-bold uppercase tracking-wider text-center">{mission.title}</h2><div className="space-y-2"><div className="w-full bg-black/30 rounded-full h-2.5"><div className="bg-[var(--skin-accent-color)] h-2.5 rounded-full" style={{ width: `${mission.progress}%` }}></div></div><p className="text-center text-sm font-bold">{mission.progress}%</p></div><div className="flex space-x-2"><button onClick={() => alert('Arquivado!')} className="w-full py-2 rounded-xl luxe-button-secondary">Arquivar Missão</button><button onClick={onClose} className="w-full py-2 rounded-xl luxe-skin-button">OK</button></div></GlassCard></div>
    );
};

export const ExpandableMissionCard: React.FC<{ quest: ConfigSeasonQuest; isAccepted: boolean; isClaimed: boolean; progress: number; participants?: number; onAccept: () => void; onClaim: () => void }> = ({ quest, isAccepted, isClaimed, progress, participants, onAccept, onClaim }) => {
    const [expanded, setExpanded] = useState(false);
    const isCompleted = progress >= 100;
    const isClan = quest.type === 'clan';

    return (
        <GlassCard variant={isClan ? 'accent' : 'neutral'} className="p-3 relative overflow-hidden group transition-all duration-300">
            <div onClick={() => setExpanded(!expanded)} className="cursor-pointer flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg accent-text">{quest.actionTemplate.icon}</span>
                        <h3 className="font-bold text-sm uppercase tracking-wide">{quest.title}</h3>
                    </div>
                    {isAccepted && (
                        <div className="mt-1 flex items-center space-x-2">
                            <div className="flex-grow bg-black/30 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all duration-500 ${isClan ? 'bg-[var(--skin-accent-color)]' : 'bg-white'}`} style={{ width: `${Math.min(100, progress)}%` }}></div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-gray-400">{progress}%</span>
                        </div>
                    )}
                    {isClan && (
                        <div className="mt-1 flex items-center space-x-1 text-[10px] text-gray-400">
                            <UsersIcon className="w-3 h-3" />
                            <span>{participants || 0} guerreiros ativos</span>
                        </div>
                    )}
                </div>
                <div className={`transform transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`}>
                    <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                </div>
            </div>

            {expanded && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-3 animate-fade-in">
                    <p className="text-xs text-gray-300 italic">"{quest.description}"</p>
                    
                    <div className="bg-black/20 rounded-lg p-2 space-y-1">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase">Requisitos</h4>
                        <div className="flex items-center space-x-2 text-xs">
                            <span>{quest.actionTemplate.icon}</span>
                            <span>{quest.actionTemplate.name} ({quest.actionTemplate.duration}min)</span>
                            <span className="text-gray-500">x{quest.requirements.clanGoal || quest.requirements.totalReps || 1}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-black/20 rounded-lg p-2">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">Recompensas</div>
                        <div className="flex space-x-3 text-xs font-bold accent-text">
                            <span>+{quest.rewards.xp} XP</span>
                            {quest.rewards.gold && <span>+{quest.rewards.gold} Gold</span>}
                        </div>
                    </div>

                    {!isAccepted ? (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAccept(); }} 
                            className={`w-full py-2 rounded-xl text-xs font-bold tracking-widest transition-colors ${isClan ? 'bg-[var(--skin-accent-color)] hover:brightness-110 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'}`}
                        >
                            {isClan ? 'JUNTAR-SE À FESTA' : 'ACEITAR MISSÃO'}
                        </button>
                    ) : (
                        <>
                            {isCompleted && !isClaimed ? (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onClaim(); }} 
                                    className="w-full py-2 rounded-xl text-xs font-bold tracking-widest bg-green-600 hover:bg-green-500 text-white transition-colors animate-pulse"
                                >
                                    RESGATAR RECOMPENSA
                                </button>
                            ) : (
                                <div className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest py-1">
                                    {isClaimed ? 'RECOMPENSA RESGATADA' : 'EM ANDAMENTO'}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </GlassCard>
    );
};

const MissionCreatorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [jsonOutput, setJsonOutput] = useState('');
    const [formData, setFormData] = useState({
        id: `quest-${Date.now()}`,
        title: '',
        description: '',
        type: 'individual',
        category: 'physical',
        xp: 1000,
        gold: 50,
        actionName: '',
        actionIcon: '⚔️',
        actionDuration: 15,
        reps: 1
    });

    const generateJSON = () => {
        const quest: ConfigSeasonQuest = {
            id: formData.id,
            title: formData.title,
            description: formData.description,
            type: formData.type as any,
            category: formData.category as any,
            actionTemplate: {
                name: formData.actionName,
                description: formData.description,
                duration: Number(formData.actionDuration),
                icon: formData.actionIcon,
                repetitions: Number(formData.reps)
            },
            requirements: {
                totalReps: Number(formData.reps)
            },
            rewards: {
                xp: Number(formData.xp),
                gold: Number(formData.gold)
            }
        };
        setJsonOutput(JSON.stringify(quest, null, 2));
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80] flex items-center justify-center animate-fade-in" onClick={onClose}>
            <GlassCard variant="neutral" className="w-full max-w-lg m-4 p-4 space-y-4 rounded-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold uppercase tracking-wider accent-text">Criador de Missões</h2>
                    <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1"><label>ID</label><input className="w-full bg-black/30 p-2 rounded" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} /></div>
                    <div className="space-y-1"><label>Tipo</label><select className="w-full bg-black/30 p-2 rounded" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="individual">Individual</option><option value="clan">Clã</option></select></div>
                    <div className="col-span-2 space-y-1"><label>Título</label><input className="w-full bg-black/30 p-2 rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                    <div className="col-span-2 space-y-1"><label>Descrição</label><textarea className="w-full bg-black/30 p-2 rounded" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                    
                    <div className="space-y-1"><label>XP Reward</label><input type="number" className="w-full bg-black/30 p-2 rounded" value={formData.xp} onChange={e => setFormData({...formData, xp: Number(e.target.value)})} /></div>
                    <div className="space-y-1"><label>Gold Reward</label><input type="number" className="w-full bg-black/30 p-2 rounded" value={formData.gold} onChange={e => setFormData({...formData, gold: Number(e.target.value)})} /></div>
                    
                    <div className="col-span-2 pt-2 font-bold accent-text">Ação Template</div>
                    <div className="space-y-1"><label>Nome da Ação</label><input className="w-full bg-black/30 p-2 rounded" value={formData.actionName} onChange={e => setFormData({...formData, actionName: e.target.value})} /></div>
                    <div className="space-y-1"><label>Ícone</label><input className="w-full bg-black/30 p-2 rounded" value={formData.actionIcon} onChange={e => setFormData({...formData, actionIcon: e.target.value})} /></div>
                    <div className="space-y-1"><label>Duração (min)</label><input type="number" className="w-full bg-black/30 p-2 rounded" value={formData.actionDuration} onChange={e => setFormData({...formData, actionDuration: Number(e.target.value)})} /></div>
                    <div className="space-y-1"><label>Repetições</label><input type="number" className="w-full bg-black/30 p-2 rounded" value={formData.reps} onChange={e => setFormData({...formData, reps: Number(e.target.value)})} /></div>
                </div>

                <button onClick={generateJSON} className="w-full py-2 rounded-xl luxe-skin-button">Gerar JSON</button>

                {jsonOutput && (
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400">JSON (Copie e adicione ao GameContent.ts ou DB)</label>
                        <textarea className="w-full bg-black/50 p-2 rounded text-[10px] font-mono h-32" value={jsonOutput} readOnly />
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export const SeasonView: React.FC = () => {
    const { userProfile, tasks, seasons, acceptSeasonQuest, claimSeasonQuestReward, getArenas, getActionsForArena, getClanQuestProgress, clanQuestParticipants, fetchClanQuestParticipants, userMissionParticipations } = useGame();
    const [selectedMission, setSelectedMission] = useState<{ id: number; title: string; progress: number } | null>(null);
    const [openingChest, setOpeningChest] = useState<ChestType | null>(null);
    const [isCreatorOpen, setCreatorOpen] = useState(false);

    const activeSeason = seasons.find(s => s.is_active) || (SEASONS[ACTIVE_SEASON_ID] as any);
    const seasonConfig = activeSeason ? SEASONS[activeSeason.id] : null;
    const quests = seasonConfig ? seasonConfig.quests : [];
    
    const seasonArenaName = activeSeason ? `Quests - ${activeSeason.name}` : '';
    const seasonArena = getArenas().find(a => a.name === seasonArenaName);
    const seasonActions = seasonArena ? getActionsForArena(seasonArena.id) : [];
    
    // Check for Clan Arena
    const clanArena = getArenas().find(a => a.name === 'Quests - Clã');
    const clanActions = clanArena ? getActionsForArena(clanArena.id) : [];

    const handleAcceptClanMission = (quest: any) => {
        acceptSeasonQuest(quest.id);
    };

    useEffect(() => {
        quests.forEach(q => {
            if (q.type === 'clan') {
                fetchClanQuestParticipants(q.id, q.actionTemplate.name);
            }
        });
    }, [quests, fetchClanQuestParticipants]);

    const calculateQuestProgress = (quest: ConfigSeasonQuest): number => {
        if (quest.type === 'clan') {
            const clanProgress = getClanQuestProgress(quest.id);
            return Math.min(100, Math.round((clanProgress / (quest.requirements?.clanGoal || 50)) * 100)); 
        }

        const targetActions = seasonActions;
        const action = targetActions.find(a => a.name === quest.actionTemplate.name);
        if (!action) return 0;

        const matchingTasks = tasks.filter(t => t.actionId === action.id && t.completed);
        const count = matchingTasks.length;
        
        const required = quest.requirements?.totalReps || quest.actionTemplate.repetitions || 1;
        return Math.min(100, Math.round((count / required) * 100));
    };

    // Logic for "Complete 3 Season Quests"
    const individualQuests = quests.filter(q => q.type === 'individual');
    const clanQuests = quests.filter(q => q.type === 'clan');
    const completedQuestsCount = individualQuests.filter(q => calculateQuestProgress(q) >= 100).length;
    const metaQuestProgress = Math.round((completedQuestsCount / 3) * 100);

    // Introductory Missions logic
    const introMissions = [ { id: 1, title: 'Criar seu primeiro Ciclo', progress: userProfile.level > 0 ? 100 : 0 }, { id: 2, title: 'Preencher Perfil de Ativos', progress: 80 }, { id: 3, title: 'Preencher Níveis de Soberano', progress: 50 }, { id: 4, title: 'Criar suas primeiras Arenas', progress: 20 }, { id: 5, title: 'Criar suas primeiras Ações', progress: 10 }, { id: 6, title: 'Completar uma Ação', progress: 0 }, { id: 10, title: 'Compartilhe seu Score', progress: 0 }, ];

    const isAdmin = userProfile.role === 'admin' || userProfile.role === 'gm';

    return (
        <div className="space-y-8 pb-20 animate-fade-in">
            {activeSeason && (
                <>
                    <GlassCard variant="accent" className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--skin-accent-color)]/40 to-black/60 pointer-events-none" />
                        <div className="relative z-10 flex justify-between items-center p-2">
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] accent-text mb-1">TEMPORADA ATUAL</div>
                                <h2 className="text-2xl font-black accent-text drop-shadow-lg uppercase">{activeSeason.name}</h2>
                                <p className="text-xs text-gray-400 italic mt-1">"{activeSeason.theme}"</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-white">Termina em</div>
                                <div className="text-lg font-mono accent-text">20/03/26</div>
                            </div>
                        </div>
                        {isAdmin && (
                            <button onClick={() => setCreatorOpen(true)} className="absolute top-2 right-2 p-1 bg-white/10 rounded hover:bg-white/20">
                                <span className="text-xs">⚙️</span>
                            </button>
                        )}
                    </GlassCard>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1 border-b border-white/10 pb-2">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Missões da Temporada</h3>
                        </div>
                        <div className="space-y-2">
                            {individualQuests.map(quest => {
                                const isAccepted = seasonActions.some(a => a.name === quest.actionTemplate.name);
                                const progress = isAccepted ? calculateQuestProgress(quest) : 0; 
                                const isClaimed = userProfile.completedSeasonMissions?.includes(quest.id) || false;
                                return (
                                    <ExpandableMissionCard 
                                        key={quest.id} 
                                        quest={quest} 
                                        isAccepted={isAccepted}
                                        isClaimed={isClaimed}
                                        progress={progress}
                                        onAccept={() => acceptSeasonQuest(quest.id)}
                                        onClaim={() => claimSeasonQuestReward(quest.id)}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {clanQuests.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold accent-text uppercase tracking-widest px-1 border-b border-[var(--skin-accent-color)]/20 pb-2">Missões do Clã</h3>
                            <div className="space-y-2">
                                {clanQuests.map(quest => {
                                    const isAcceptedLegacy = clanActions.some(a => a.name === quest.actionTemplate.name);
                                    const isParticipating = (userMissionParticipations?.[quest.id]) || isAcceptedLegacy;
                                    
                                    const progress = isParticipating ? calculateQuestProgress(quest) : 0; 
                                    const isClaimed = userProfile.completedSeasonMissions?.includes(quest.id) || false;
                                    const participantsCount = clanQuestParticipants[quest.id] || 0;

                                    return (
                                        <ExpandableMissionCard 
                                            key={quest.id} 
                                            quest={quest} 
                                            isAccepted={isParticipating}
                                            isClaimed={isClaimed}
                                            progress={progress}
                                            participants={participantsCount}
                                            onAccept={() => handleAcceptClanMission(quest)}
                                            onClaim={() => claimSeasonQuestReward(quest.id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1 border-b border-white/5 pb-2">Missões Principais</h3>
                <div className="space-y-2">
                     <MissionCard 
                        title="Completar as 3 Quests da Season" 
                        progress={metaQuestProgress} 
                        onClick={() => metaQuestProgress >= 100 && setOpeningChest('Épico')} 
                     />
                     {tasks.find(t => t.actionId === 'action_tutorial_01' && t.completed) && (
                        <MissionCard
                          key="tutorial-complete"
                          title="Concluir Tutorial de Iniciação"
                          progress={100}
                          onClick={() => setOpeningChest('Comum')}
                        />
                      )}
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1 border-b border-white/5 pb-2">Missões Introdutórias</h3>
                <div className="space-y-2">
                    {introMissions.map(mission => (
                        <MissionCard key={mission.id} title={mission.title} progress={mission.progress} onClick={() => setSelectedMission(mission)} />
                    ))}
                </div>
            </div>

            {selectedMission && <MissionDetailModal mission={selectedMission} onClose={() => setSelectedMission(null)} />}
            {openingChest && <ChestOpeningModal chestType={openingChest} onClose={() => setOpeningChest(null)} />}
            {isCreatorOpen && <MissionCreatorModal onClose={() => setCreatorOpen(false)} />}
        </div>
    );
};
