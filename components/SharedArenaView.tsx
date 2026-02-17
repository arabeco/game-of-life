import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useGame } from '../contexts/GameContext';
import { SeasonQuest, Arena, Action } from '../types';
import { UsersIcon, LightbulbIcon } from './Icons';

interface SharedArenaViewProps {
    arena: Arena;
    quest: SeasonQuest;
    action: Action; // The action template associated with this quest
}

export const SharedArenaView: React.FC<SharedArenaViewProps> = ({ arena, quest, action }) => {
    const { clan, userProfile, updateClanMissionProgress, getClanQuestProgress } = useGame();
    const [presenceCount, setPresenceCount] = useState(0);
    const [presenceAvatars, setPresenceAvatars] = useState<string[]>([]);
    const [localProgress, setLocalProgress] = useState(0);
    const [participantsCount, setParticipantsCount] = useState(0);
    const [isInteracting, setIsInteracting] = useState(false);

    // Initial progress and participants
    useEffect(() => {
        setLocalProgress(getClanQuestProgress(quest.id));
        
        const fetchParticipants = async () => {
            if (!clan) return;
            const { count, error } = await supabase
                .from('clan_mission_participants')
                .select('*', { count: 'exact', head: true })
                .eq('clan_id', clan.id)
                .eq('mission_id', quest.id);
            
            if (!error && count !== null) {
                setParticipantsCount(count);
            }
        };
        fetchParticipants();
    }, [quest.id, getClanQuestProgress, clan]);

    // Real-time Presence & Progress
    useEffect(() => {
        if (!clan) return;

        // Join a unique channel for this arena
        const channel = supabase.channel(`arena_presence:${arena.id}`)
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const users = Object.values(state).flat() as any[];
                setPresenceCount(users.length);
                setPresenceAvatars(users.map(u => u.avatar_url).filter(Boolean));
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clan_mission_progress',
                filter: `clan_id=eq.${clan.id}`
            }, (payload) => {
                 // Listen for updates from other users
                 if (payload.new && (payload.new as any).mission_id === quest.id && typeof (payload.new as any).current_value === 'number') {
                     setLocalProgress((payload.new as any).current_value);
                 }
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clan_mission_participants',
                filter: `clan_id=eq.${clan.id}`
            }, async () => {
                // Refresh participant count when changes occur
                const { count } = await supabase
                    .from('clan_mission_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('clan_id', clan.id)
                    .eq('mission_id', quest.id);
                if (count !== null) setParticipantsCount(count);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: userProfile.id,
                        avatar_url: userProfile.avatar_url,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [arena.id, clan, quest.id, userProfile]);

    const handleInteraction = async () => {
        setIsInteracting(true);
        try {
            // Optimistic local update for immediate feedback
            setLocalProgress(prev => prev + 1);
            await updateClanMissionProgress(quest.id, 1);
        } catch (error) {
            console.error("Interaction failed:", error);
            // Revert on error
            setLocalProgress(prev => prev - 1);
        } finally {
            setIsInteracting(false);
        }
    };

    const target = quest.requirements?.clanGoal || 50; 
    const remaining = Math.max(0, target - localProgress);
    
    // We display 50 blocks.
    // If we want to show progress, we show 'localProgress' active blocks.
    // E.g. Start: 0 active. User clicks -> 1 active.
    
    return (
        <div className="flex flex-col h-full text-white p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold font-display tracking-wider text-[var(--gold)]">{quest.title}</h2>
                    <p className="text-xs text-white/60 max-w-[80%]">{quest.description}</p>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                    <UsersIcon className="w-4 h-4 text-[var(--gold)]" />
                    <span className="text-sm font-mono font-bold">{participantsCount}</span>
                </div>
            </div>

            {/* Progress Visualization */}
            <div className="flex-grow flex flex-col justify-center space-y-4">
                <div className="grid grid-cols-10 gap-1.5 p-4 bg-black/20 rounded-xl border border-white/5">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div 
                            key={i}
                            className={`
                                aspect-square rounded-sm transition-all duration-500
                                ${i < localProgress 
                                    ? 'bg-[var(--gold)] shadow-[0_0_8px_rgba(212,175,55,0.6)] scale-100' 
                                    : 'bg-white/5 scale-90'
                                }
                            `}
                        />
                    ))}
                </div>
                
                <div className="text-center space-y-1">
                    <p className="text-2xl font-bold font-mono text-[var(--gold)]">
                        {localProgress} / {target}
                    </p>
                    <p className="text-xs text-white/40 uppercase tracking-widest">Progresso do Clã</p>
                </div>
            </div>

            {/* Interaction Area */}
            <div className="flex flex-col items-center space-y-3 pb-4">
                <button
                    onClick={handleInteraction}
                    disabled={isInteracting}
                    className={`
                        relative group
                        w-24 h-24 rounded-2xl 
                        flex items-center justify-center
                        transition-all duration-200
                        ${isInteracting ? 'scale-95 opacity-80' : 'hover:scale-105 active:scale-95'}
                    `}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)] to-[var(--bronze)] rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 border border-[var(--gold)]/30 rounded-2xl" />
                    
                    <span className="text-4xl filter drop-shadow-lg transform transition-transform group-hover:rotate-12">
                        {action.icon}
                    </span>
                    
                    {/* Ripple effect could go here */}
                </button>
                <p className="text-sm font-medium text-[var(--gold)]">
                    {action.name}
                </p>
                <p className="text-[10px] text-white/40 max-w-[200px] text-center">
                    Toque para contribuir. Cada ação conta para o objetivo do clã.
                </p>
            </div>
        </div>
    );
};
