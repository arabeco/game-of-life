import React, { useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { SeasonMission } from '../types';
import { useGame } from '../contexts/GameContext';
import { SKINS_DATA } from '../constants/GMboard';
import { VideoPlayer } from './VideoPlayer';
import { ShareIcon } from './Icons';
import { Portal } from './Portal';
import { useSensoryFeedback } from '../hooks/useSensoryFeedback';

interface MissionCompletionModalProps {
    mission: SeasonMission;
    onOk: () => void; // Used as "OK" or "Confirm"
    onClose: () => void;
}

export const MissionCompletionModal: React.FC<MissionCompletionModalProps> = ({ mission, onOk, onClose }) => {
    const { userProfile, showToast } = useGame();
    const { trigger } = useSensoryFeedback();
    const userSkinId = userProfile.skin;
    const userSkin = SKINS_DATA.find(s => s.id === userSkinId);
    const skinColor = userSkin?.color || '#ffffff';

    useEffect(() => {
        trigger('fanfare');
    }, [trigger]);

    return (
        <Portal>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10001] flex items-center justify-center animate-fade-in" onClick={onClose}>
                <GlassCard 
                    variant="accent" 
                    className="w-full max-w-sm overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col border border-white/10 bg-gradient-to-b from-gray-900 via-[#0a0a0a] to-black"
                    style={{ borderColor: skinColor, boxShadow: `0 0 30px ${skinColor}20` }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header Title */}
                <div className="pt-6 pb-4 px-6 text-center z-20 relative">
                    <h2 
                        className="text-lg font-bold text-white uppercase tracking-[0.2em]"
                        style={{ textShadow: `0 0 15px ${skinColor}40` }}
                    >
                        Missão Completa
                    </h2>
                </div>

                {/* Video Section */}
                <div className="relative w-full aspect-video bg-black border-y border-white/5 group">
                    <VideoPlayer
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/videos/mission_complete.mp4`}
                        className="w-full h-full object-cover opacity-90"
                        placeholderLabel="Missão Cumprida"
                        duration={4000}
                        playbackRate={1.0}
                        onEnd={() => {}} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none" />
                </div>

                {/* Content Section */}
                <div className="p-6 text-center space-y-4 relative z-10">
                    <div className="flex flex-col items-center">
                         <div className="flex items-center gap-3 mb-4">
                            <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center border border-white/10 bg-white/5"
                                style={{ borderColor: `${skinColor}40` }}
                            >
                                <span className="text-xl filter drop-shadow-lg">{mission.icon || '⚔️'}</span>
                            </div>
                            <h3 className="text-sm font-bold text-gray-200 leading-tight text-left max-w-[180px]">{mission.title}</h3>
                        </div>
                        
                        {/* Reward Miniature */}
                        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 justify-center mb-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-lg border border-yellow-500/30 flex items-center justify-center">
                                {mission.reward_type === 'exp' ? '✨' : '📦'}
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Recompensa</p>
                                <p className="text-xs font-bold text-white">
                                    {mission.reward_type === 'exp' ? `+${mission.reward_value} XP` : 'Item Misterioso'}
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-500 text-[10px] italic max-w-[90%]">"Parabéns! Você superou este desafio."</p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button 
                            onClick={() => {
                                showToast("Compartilhado com sucesso!");
                            }} 
                            className="w-full py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all hover:brightness-110 flex items-center justify-center gap-2"
                            style={{ backgroundColor: `${skinColor}15`, border: `1px solid ${skinColor}40`, color: skinColor }}
                        >
                            <ShareIcon className="w-3 h-3" />
                            Compartilhar
                        </button>
                        
                        <button 
                            onClick={onOk} 
                            className="w-full py-3 rounded-lg font-bold uppercase tracking-wider text-xs transition-all hover:brightness-110 relative overflow-hidden group"
                            style={{ backgroundColor: skinColor, color: '#000' }}
                        >
                            <span className="relative z-10">Confirmar</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                    </div>
                </div>
            </GlassCard>
        </div>
    </Portal>
    );
};
