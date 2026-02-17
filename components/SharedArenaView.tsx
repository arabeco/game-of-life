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
    const [isInteracting, setIsInteracting] = useState(false);

    // Initial progress
    useEffect(() => {
        setLocalProgress(getClanQuestProgress(quest.id));
    }, [quest.id, getClanQuestProgress]);

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
                event: 'UPDATE',
                schema: 'public',
                table: 'clan_mission_progress',
                filter: `clan_id=eq.${clan.id}&mission_id=eq.${quest.id}`
            }, (payload) => {
                 // Listen for updates from other users
                 if (payload.new && typeof payload.new.current_value === 'number') {
                     setLocalProgress(payload.new.current_value);
                 }
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
    // If we want to show "diminuindo o numero total restante", we can show 'remaining' active blocks.
    // E.g. Start: 50 active. User clicks -> 49 active.
    
    return (
        <div className="flex flex-col items-center w-full h-full p-4 space-y-6 animate-fade-in">
            {/* Header / Presence */}
            <div className="flex items-center space-x-2 bg-black/40 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                <UsersIcon className="w-5 h-5 text-green-400" />
                <span className="text-sm font-bold text-white">{presenceCount} / 50 Presentes</span>
            </div>

            {/* Title & Instruction */}
            <div className="text-center space-y-2">
                 <h2 className="text-xl font-black text-[var(--gold)] uppercase tracking-widest drop-shadow-md">{quest.title}</h2>
                 <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                    Socialize com seu clã. Cada ação reduz a contagem para todos os membros na arena.
                 </p>
            </div>

            {/* The Grid of Blocks */}
            <div className="relative">
                <div className="grid grid-cols-10 gap-1.5 p-4 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                    {Array.from({ length: target }).map((_, index) => {
                        // Show 'remaining' blocks as active. 
                        // Index 0 to (remaining-1) are active.
                        const isActive = index < remaining;
                        
                        return (
                            <div 
                                key={index}
                                className={`w-5 h-5 rounded-[2px] transition-all duration-500 border border-black/20 ${
                                    isActive 
                                        ? 'bg-[var(--gold)] shadow-[0_0_8px_var(--gold)] scale-100 opacity-100' 
                                        : 'bg-gray-800/30 scale-90 opacity-20'
                                }`}
                            />
                        );
                    })}
                </div>
                {/* Overlay text if completed */}
                {remaining === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm animate-fade-in">
                        <span className="text-2xl font-black text-[var(--gold)] uppercase tracking-widest drop-shadow-[0_0_10px_black]">Concluído!</span>
                    </div>
                )}
            </div>

            {/* Status Text */}
            <div className="flex flex-col items-center">
                <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black text-white">{remaining}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest">Restantes</span>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleInteraction}
                disabled={isInteracting || remaining <= 0}
                className={`
                    w-full py-4 rounded-xl font-black text-lg tracking-wider uppercase transition-all relative overflow-hidden group
                    ${remaining <= 0 
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed border border-white/5'
                        : 'bg-[var(--gold)] text-black hover:bg-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--gold)]/20'
                    }
                `}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10 flex items-center justify-center space-x-2">
                    {isInteracting ? (
                        <><span>Processando...</span></>
                    ) : (
                        <>
                            <LightbulbIcon className="w-5 h-5" />
                            <span>{action.name}</span>
                        </>
                    )}
                </span>
            </button>
        </div>
    );
};
