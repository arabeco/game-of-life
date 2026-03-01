import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { ChevronRightIcon, UsersIcon, CheckIcon, XIcon } from '../components/Icons';
import { ConfigSeasonQuest, ChestType, SeasonMission } from '../types';
import { SEASONS, ACTIVE_SEASON_ID } from '../constants/GameContent';
import { QuestDetailModal, SeasonDetailModal } from '../components/SeasonDetailModal';

const SeasonQuestCard: React.FC<{ 
    quest: ConfigSeasonQuest; 
    isAccepted: boolean; 
    isClaimed: boolean; 
    progress: number; 
    participants?: number; 
    onClick: () => void;
    onAbort?: () => void;
}> = ({ quest, isAccepted, isClaimed, progress, participants, onClick, onAbort }) => {
    const isCompleted = progress >= 100;
    const isClan = quest.type === 'clan';

    return (
        <GlassCard 
            variant={isClan ? 'accent' : 'neutral'} 
            className={`p-4 relative overflow-hidden group transition-all duration-500 cursor-pointer border-2 ${
                isClan 
                    ? 'border-[var(--skin-accent-color)]/30 hover:border-[var(--skin-accent-color)] shadow-[0_0_20px_rgba(var(--skin-accent-color-rgb),0.1)]' 
                    : 'border-white/10 hover:border-white/30 shadow-xl'
            } hover:translate-y-[-2px] active:scale-[0.98] rounded-2xl`} 
            onClick={onClick}
        >
            {/* Background Decorative Element */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${isClan ? 'bg-[var(--skin-accent-color)]' : 'bg-white'}`} />
            
            <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner ${
                            isClan ? 'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)]' : 'bg-white/10 text-white'
                        }`}>
                            {quest.actionTemplate.icon}
                        </div>
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-wider luxe-title-shadow leading-tight">{quest.title}</h3>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter ${
                                    isClan ? 'bg-[var(--skin-accent-color)]/20 text-[var(--skin-accent-color)]' : 'bg-white/10 text-gray-400'
                                }`}>
                                    {isClan ? 'Missão de Clã' : 'Individual'}
                                </span>
                                {isClan && (
                                    <div className="flex items-center space-x-1 text-[9px] text-gray-400 font-bold">
                                        <UsersIcon className="w-3 h-3" />
                                        <span>{participants || 0} Ativos</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isAccepted && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className={isClan ? 'text-[var(--skin-accent-color)]' : 'text-gray-400'}>Progresso</span>
                                <span className="font-mono text-white">{progress}%</span>
                            </div>
                            <div className="relative w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5 p-[1px]">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.2)] ${
                                        isClan ? 'bg-gradient-to-r from-[var(--skin-accent-color)] to-white' : 'bg-gradient-to-r from-gray-400 to-white'
                                    }`} 
                                    style={{ width: `${Math.min(100, progress)}%` }}
                                />
                                {isCompleted && !isClaimed && (
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center h-full pt-1 space-y-2">
                    {isClaimed ? (
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                            <CheckIcon className="w-5 h-5 text-green-400" />
                        </div>
                    ) : isCompleted ? (
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500 blur-md animate-ping opacity-30 rounded-full" />
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.5)] relative z-10">
                                <CheckIcon className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            {isAccepted && onAbort && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAbort();
                                    }}
                                    className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 hover:bg-red-500/20 transition-colors group/abort"
                                    title="Abandonar Missão"
                                >
                                    <XIcon className="w-4 h-4 text-red-400/50 group-hover/abort:text-red-400" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Completion Sparkle */}
            {isCompleted && !isClaimed && (
                <div className="absolute -left-1 -top-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
            )}
        </GlassCard>
    );
};

export const SeasonView: React.FC = () => {
    const { 
        userProfile, tasks, seasons, seasonQuests, acceptSeasonQuest, abortSeasonQuest,
        claimSeasonQuestReward, getArenas, getActionsForArena, getClanQuestProgress, 
        clanQuestParticipants, fetchClanQuestParticipants, userMissionParticipations, 
        addCompletedMission, addProfileFlag, showToast, addChest 
    } = useGame();
    const [selectedQuest, setSelectedQuest] = useState<ConfigSeasonQuest | null>(null);
    const [isSeasonDetailOpen, setSeasonDetailOpen] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeSeason = seasons.find(s => s.is_active) || (SEASONS[ACTIVE_SEASON_ID] as any);
    const quests = seasonQuests;
    
    const seasonArenaName = activeSeason ? `Quests - ${activeSeason.name}` : '';
    const seasonArena = getArenas().find(a => a.name === seasonArenaName);
    const seasonActions = seasonArena ? getActionsForArena(seasonArena.id) : [];
    
    // Check for Clan Arena
    const clanArena = getArenas().find(a => a.name === 'Quests - Clã');
    const clanActions = clanArena ? getActionsForArena(clanArena.id) : [];

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

    // Introductory Missions logic - Enriched
    const introMissions: ConfigSeasonQuest[] = [
        { 
            id: 'intro-1', title: 'Criar seu primeiro Ciclo', description: 'Comece sua jornada definindo um ciclo de foco e evolução. (Recompensa: 1 Baú Comum)', 
            type: 'individual', category: 'intellectual',
            actionTemplate: { name: 'Criar Ciclo', description: 'Criar um novo ciclo.', icon: '🔄', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 100 },
            // Calculated progress
            goal_value: 1
        },
        { 
            id: 'intro-2', title: 'Preencher Perfil de Ativos', description: 'Defina seus níveis atuais em cada área da vida. (Recompensa: 1 Baú Comum)', 
            type: 'individual', category: 'intellectual',
            actionTemplate: { name: 'Perfil de Ativos', description: 'Preencher ativos.', icon: '📊', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 100 },
            goal_value: 1
        },
        { 
            id: 'intro-3', title: 'Preencher Níveis de Soberano', description: 'Configure sua aparência e identidade no mundo. (Recompensa: 1 Baú Comum)', 
            type: 'individual', category: 'social',
            actionTemplate: { name: 'Soberano', description: 'Customizar soberano.', icon: '👑', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 100 },
            goal_value: 1
        },
        { 
            id: 'intro-4', title: 'Criar suas primeiras Arenas', description: 'Defina os palcos onde sua vida acontece. (Recompensa: 1 Baú Comum)', 
            type: 'individual', category: 'intellectual',
            actionTemplate: { name: 'Arenas', description: 'Criar arenas.', icon: '🏟️', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 100 },
            goal_value: 1
        },
        { 
            id: 'intro-5', title: 'Criar suas primeiras Ações', description: 'Transforme intenção em movimento. (Recompensa: 1 Baú Comum)', 
            type: 'individual', category: 'physical',
            actionTemplate: { name: 'Ações', description: 'Criar ações.', icon: '⚡', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 100 },
            goal_value: 1
        },
        { 
            id: 'intro-6', title: 'Completar uma Ação', description: 'Realize e registre sua primeira vitória. (Recompensa: 1 Baú Comum)', 
            type: 'individual', category: 'physical',
            actionTemplate: { name: 'Completar Ação', description: 'Completar ação.', icon: '✅', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 200 },
            goal_value: 1
        },
        { 
            id: 'intro-10', title: 'Compartilhe seu Score', description: 'Mostre seu progresso para o mundo. (Recompensa: 1 Baú Comum)', 
            type: 'individual', category: 'social',
            actionTemplate: { name: 'Compartilhar', description: 'Compartilhar score.', icon: '📢', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 150 },
            goal_value: 1
        },
    ];

    // Calculate progress for intro missions dynamically
    const getIntroProgress = (id: string) => {
        switch(id) {
            case 'intro-1': return userProfile.level > 0 ? 100 : 0; // Aproximação baseada no nível/uso
            case 'intro-2': return 80; // Placeholder
            case 'intro-3': return 50; // Placeholder
            case 'intro-4': return 20; // Placeholder
            case 'intro-5': return 10; // Placeholder
            case 'intro-6': return 0; // Placeholder
            case 'intro-10': return 0; // Placeholder
            default: return 0;
        }
    };

    const mainMissions: ConfigSeasonQuest[] = [
        {
            id: 'meta-quest-3',
            title: 'Completar as 3 Quests da Season',
            description: 'Prove seu valor completando 3 missões desta temporada.',
            type: 'individual',
            category: 'spiritual',
            actionTemplate: { name: 'Meta Quest', description: 'Completar 3 quests.', icon: '🏆', duration: 0, repetitions: 3, isMilestone: true },
            requirements: { totalReps: 3, milestone: true },
            rewards: { xp: 5000, items: ['Baú Raro'] }
        },
        {
            id: 'tutorial-quest',
            title: 'Concluir Tutorial de Iniciação',
            description: 'Aprenda os fundamentos do sistema.',
            type: 'individual',
            category: 'intellectual',
            actionTemplate: { name: 'Tutorial', description: 'Tutorial completo.', icon: '🎓', duration: 0, repetitions: 1, isMilestone: true },
            requirements: { totalReps: 1, milestone: true },
            rewards: { xp: 1000, items: ['Baú Comum'] }
        }
    ];

    const isAdmin = userProfile.role === 'admin' || userProfile.role === 'gm';

    const isGenesis = activeSeason.name.toLowerCase().includes('genesis');

    const handleClaimSpecial = (questId: string) => {
        if (questId === 'meta-quest-3') {
            addProfileFlag(questId);
            addChest('Raro');
            showToast("✦ Baú Raro adicionado ao inventário · +5000 XP computados");
        } else if (questId === 'tutorial-quest') {
            addProfileFlag(questId);
            addChest('Comum');
            showToast("✦ Baú Comum adicionado ao inventário · +1000 XP computados");
        } else {
            const quest = introMissions.find(q => q.id === questId);
            if (quest) {
                const mission: SeasonMission = {
                    id: quest.id,
                    title: quest.title,
                    description: quest.description,
                    season_id: activeSeason.id,
                    type: quest.type,
                    goal_type: 'actions_completed',
                    goal_value: quest.requirements?.totalReps || 1,
                    reward_type: 'exp',
                    reward_value: quest.rewards.xp,
                    action_name: quest.actionTemplate.name,
                    icon: quest.actionTemplate.icon,
                    requirements: quest.requirements
                };
                addCompletedMission(mission);
                addChest('Comum');
                showToast(`✦ Baú Comum adicionado ao inventário · +${quest.rewards.xp} XP computados`);
            }
        }
        setSelectedQuest(null);
    };

    return (
        <div className="space-y-8 pb-20 animate-fade-in">
            {activeSeason && (
                <>
                    <GlassCard 
                        variant="accent" 
                        className="relative overflow-hidden cursor-pointer group hover:border-[var(--skin-accent-color)] transition-all"
                        onClick={() => setSeasonDetailOpen(true)}
                    >
                        {/* Background Image */}
                        {(activeSeason as any).background_png_url && (
                            <div 
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url('${(activeSeason as any).background_png_url}')` }}
                            />
                        )}

                        {/* Gradient Overlay */}
                        {isGenesis ? (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#2e003e] via-[#6a1b9a]/80 to-[#b0bec5]/80 opacity-90 group-hover:opacity-80 transition-opacity" />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--skin-accent-color)]/90 to-black/90 group-hover:opacity-90 transition-opacity" />
                        )}

                        <div className="relative z-10 flex justify-between items-center p-2">
                            <div>
                                <div className="text-[10px] uppercase tracking-[0.2em] accent-text mb-1 drop-shadow-md">TEMPORADA ATUAL</div>
                                <h2 className="text-2xl font-black accent-text drop-shadow-lg uppercase">{activeSeason.name}</h2>
                                <p className="text-xs text-gray-200 italic mt-1 group-hover:text-white transition-colors drop-shadow-md max-w-[80%]">
                                    "{(activeSeason as any).lore_text?.slice(0, 60) || (activeSeason as any).theme || 'Nova Era'}..."
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-white drop-shadow-md">Termina em</div>
                                <div className="text-lg font-mono accent-text drop-shadow-md">
                                    {new Date(activeSeason.end_date).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>
                        
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <span className="text-[10px] font-bold text-[var(--skin-accent-color)] uppercase tracking-wider bg-black/80 px-2 py-1 rounded-full border border-[var(--skin-accent-color)]/30 backdrop-blur-sm">Ver Detalhes</span>
                        </div>
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
                                    <SeasonQuestCard 
                                        key={quest.id} 
                                        quest={quest} 
                                        isAccepted={isAccepted}
                                        isClaimed={isClaimed}
                                        progress={progress}
                                        onClick={() => setSelectedQuest(quest)}
                                        onAbort={() => abortSeasonQuest(quest.id)}
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
                                        <SeasonQuestCard 
                                            key={quest.id} 
                                            quest={quest} 
                                            isAccepted={isParticipating}
                                            isClaimed={isClaimed}
                                            progress={progress}
                                            participants={participantsCount}
                                            onClick={() => setSelectedQuest(quest)}
                                            onAbort={() => abortSeasonQuest(quest.id)}
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
                    {mainMissions.map(quest => {
                        let progress = 0;
                        let isClaimed = false;
                        
                        if (quest.id === 'meta-quest-3') {
                            progress = metaQuestProgress;
                            // Check if chest claimed logic exists (using existing mission flags logic?)
                            // Currently meta quest claim is just opening chest, not persisted as mission flag in the same way?
                            // Assuming repetition allowed or handled by chest logic.
                        } else if (quest.id === 'tutorial-quest') {
                            progress = tasks.find(t => t.actionId === 'action_tutorial_01' && t.completed) ? 100 : 0;
                        }

                        if (progress === 0 && quest.id === 'tutorial-quest' && !tasks.find(t => t.actionId === 'action_tutorial_01' && t.completed)) return null;

                        return (
                            <SeasonQuestCard 
                                key={quest.id} 
                                quest={quest} 
                                isAccepted={true} // Always active/visible
                                isClaimed={isClaimed}
                                progress={progress}
                                onClick={() => setSelectedQuest(quest)}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1 border-b border-white/5 pb-2">Missões Introdutórias</h3>
                <div className="space-y-2">
                    {introMissions.map(quest => {
                        const progress = getIntroProgress(quest.id);
                        return (
                            <SeasonQuestCard 
                                key={quest.id} 
                                quest={quest} 
                                isAccepted={true}
                                isClaimed={progress >= 100} // Treat 100% as claimed/done visually for now
                                progress={progress}
                                onClick={() => setSelectedQuest(quest)}
                            />
                        );
                    })}
                </div>
            </div>

            {selectedQuest && (
                <QuestDetailModal 
                    quest={selectedQuest} 
                    progress={
                        selectedQuest.id.startsWith('intro-') ? getIntroProgress(selectedQuest.id) :
                        selectedQuest.id === 'meta-quest-3' ? metaQuestProgress :
                        selectedQuest.id === 'tutorial-quest' ? 100 :
                        calculateQuestProgress(selectedQuest)
                    }
                    isActive={
                        selectedQuest.id.startsWith('intro-') || selectedQuest.id === 'meta-quest-3' || selectedQuest.id === 'tutorial-quest' ? true :
                        selectedQuest.type === 'clan' 
                        ? ((userMissionParticipations?.[selectedQuest.id]) || clanActions.some(a => a.name === selectedQuest.actionTemplate.name))
                        : seasonActions.some(a => a.name === selectedQuest.actionTemplate.name)
                    }
                    participants={selectedQuest.type === 'clan' ? (clanQuestParticipants[selectedQuest.id] || 0) : undefined}
                    onClose={() => setSelectedQuest(null)}
                    onTake={() => acceptSeasonQuest(selectedQuest.id)}
                    canClaim={
                        (selectedQuest.id === 'meta-quest-3' && metaQuestProgress >= 100) ||
                        (selectedQuest.id === 'tutorial-quest' && tasks.find(t => t.actionId === 'action_tutorial_01' && t.completed)) ||
                        (selectedQuest.id.startsWith('intro-') && getIntroProgress(selectedQuest.id) >= 100 && !userProfile.completedSeasonMissions?.includes(selectedQuest.id)) ||
                        (!userProfile.completedSeasonMissions?.includes(selectedQuest.id) && calculateQuestProgress(selectedQuest) >= 100 && !selectedQuest.id.startsWith('intro-') && !['meta-quest-3', 'tutorial-quest'].includes(selectedQuest.id))
                    }
                    onClaim={() => {
                        if (['meta-quest-3', 'tutorial-quest'].includes(selectedQuest.id) || selectedQuest.id.startsWith('intro-')) {
                            handleClaimSpecial(selectedQuest.id);
                        } else {
                            claimSeasonQuestReward(selectedQuest.id);
                            
                            const xp = selectedQuest.rewards.xp;
                            const items = selectedQuest.rewards.items || [];
                            let msg = `✦ +${xp} XP computados`;
                            if (items.length > 0) {
                                msg = `✦ ${items.join(', ')} adicionado ao inventário · +${xp} XP computados`;
                            }
                            showToast(msg);
                            setSelectedQuest(null);
                        }
                    }}
                />
            )}
            {isSeasonDetailOpen && activeSeason && <SeasonDetailModal season={activeSeason} onClose={() => setSeasonDetailOpen(false)} />}
        </div>
    );
};
