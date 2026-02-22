import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { GlassCard } from '../components/GlassCard';
import { ChevronRightIcon, UsersIcon, CheckIcon, XIcon } from '../components/Icons';
import { ConfigSeasonQuest, ChestType, SeasonMission } from '../types';
import { SEASONS, ACTIVE_SEASON_ID } from '../constants/GameContent';
import { QuestDetailModal, SeasonDetailModal } from '../components/SeasonDetailModal';

const SeasonQuestCard: React.FC<{ quest: ConfigSeasonQuest; isAccepted: boolean; isClaimed: boolean; progress: number; participants?: number; onClick: () => void }> = ({ quest, isAccepted, isClaimed, progress, participants, onClick }) => {
    const isCompleted = progress >= 100;
    const isClan = quest.type === 'clan';

    return (
        <GlassCard variant={isClan ? 'accent' : 'neutral'} className="p-3 relative overflow-hidden group transition-all duration-300 cursor-pointer hover:bg-white/5" onClick={onClick}>
            <div className="flex items-center justify-between">
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
                <div className="pl-2">
                    {isClaimed ? (
                        <CheckIcon className="w-5 h-5 text-green-500" />
                    ) : isCompleted ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    ) : (
                        <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                    )}
                </div>
            </div>
        </GlassCard>
    );
};

export const SeasonView: React.FC = () => {
    const { userProfile, tasks, seasons, seasonQuests, acceptSeasonQuest, claimSeasonQuestReward, getArenas, getActionsForArena, getClanQuestProgress, clanQuestParticipants, fetchClanQuestParticipants, userMissionParticipations, addCompletedMission, addProfileFlag, showToast, addChest } = useGame();
    const [selectedQuest, setSelectedQuest] = useState<ConfigSeasonQuest | null>(null);
    const [isSeasonDetailOpen, setSeasonDetailOpen] = useState(false);

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
            id: 'intro-1', title: 'Criar seu primeiro Ciclo', description: 'Comece sua jornada definindo um ciclo de foco e evolução.', 
            type: 'individual', category: 'intellectual',
            actionTemplate: { name: 'Criar Ciclo', description: 'Criar um novo ciclo.', icon: '🔄', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 100 },
            // Calculated progress
            goal_value: 1
        },
        { 
            id: 'intro-2', title: 'Preencher Perfil de Ativos', description: 'Defina seus níveis atuais em cada área da vida.', 
            type: 'individual', category: 'intellectual',
            actionTemplate: { name: 'Perfil de Ativos', description: 'Preencher ativos.', icon: '📊', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 100 },
            goal_value: 1
        },
        { 
            id: 'intro-3', title: 'Preencher Níveis de Soberano', description: 'Configure sua aparência e identidade no mundo.', 
            type: 'individual', category: 'social',
            actionTemplate: { name: 'Soberano', description: 'Customizar soberano.', icon: '👑', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 100 },
            goal_value: 1
        },
        { 
            id: 'intro-4', title: 'Criar suas primeiras Arenas', description: 'Defina os palcos onde sua vida acontece.', 
            type: 'individual', category: 'intellectual',
            actionTemplate: { name: 'Arenas', description: 'Criar arenas.', icon: '🏟️', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 100 },
            goal_value: 1
        },
        { 
            id: 'intro-5', title: 'Criar suas primeiras Ações', description: 'Transforme intenção em movimento.', 
            type: 'individual', category: 'physical',
            actionTemplate: { name: 'Ações', description: 'Criar ações.', icon: '⚡', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 100 },
            goal_value: 1
        },
        { 
            id: 'intro-6', title: 'Completar uma Ação', description: 'Realize e registre sua primeira vitória.', 
            type: 'individual', category: 'physical',
            actionTemplate: { name: 'Completar Ação', description: 'Completar ação.', icon: '✅', duration: 0, repetitions: 1 },
            requirements: { totalReps: 1 }, rewards: { xp: 200 },
            goal_value: 1
        },
        { 
            id: 'intro-10', title: 'Compartilhe seu Score', description: 'Mostre seu progresso para o mundo.', 
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
            rewards: { xp: 5000, items: ['Baú Épico'] }
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
            addChest('Épico');
            showToast("✦ Baú Épico adicionado ao inventário · +5000 XP computados");
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
                showToast(`✦ +${quest.rewards.xp} XP computados`);
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
