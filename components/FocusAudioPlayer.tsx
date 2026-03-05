import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, LockIcon } from './Icons';
import { useGame } from '../contexts/GameContext';

const BASE_URL = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/audio/';

interface Track {
    id: string;
    emoji: string;
    url: string;
    isPremium: boolean;
    title: string;
}

const FOCUS_TRACKS: Track[] = [
    { id: 'brown', emoji: '🌫️', url: 'brown-noise.mp3', isPremium: false, title: 'O Vazio' }, // névoa
    { id: 'rain', emoji: '⛈️', url: 'rain.mp3', isPremium: false, title: 'Tempestade no Feudo' },
    { id: '528', emoji: '✨', url: '528-healing.mp3', isPremium: true, title: 'Frequência Divina 528Hz' },
    { id: '432', emoji: '🌀', url: '432-focus.mp3', isPremium: true, title: 'Ressonância 432Hz' },
    { id: 'temple', emoji: '🎐', url: 'tibetan.mp3', isPremium: true, title: 'Templo Etéreo' },
    { id: 'pub', emoji: '🕯️', url: 'pub.mp3', isPremium: true, title: 'Taverna do Clã' },
    { id: 'fireplace', emoji: '🪵', url: 'fireplace.mp3', isPremium: true, title: 'Lareira do Arquiteto' },
    { id: 'hacker', emoji: '⌨️', url: 'lo-fi.mp3', isPremium: true, title: 'Foco Hacker' },
    { id: 'city', emoji: '🌙', url: 'quiet-city.mp3', isPremium: true, title: 'Vigília Urbana' },
];

export const FocusAudioPlayer: React.FC = () => {
    const { userProfile, showToast } = useGame();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const isPremiumUser = userProfile?.isPremium || userProfile?.plan === 'Soberano' || userProfile?.plan === 'Premium';

    // Initialize audio element only once
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;

            audioRef.current.addEventListener('play', () => setIsPlaying(true));
            audioRef.current.addEventListener('pause', () => setIsPlaying(false));
            audioRef.current.addEventListener('ended', () => setIsPlaying(false)); // Should not happen with loop=true, but just in case
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, []);

    // Handle Media Session API for PWA background playback
    useEffect(() => {
        if ('mediaSession' in navigator && currentTrack) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.title,
                artist: 'Arsenal Sonoro',
                album: 'Deep Focus (GOL)'
            });

            navigator.mediaSession.setActionHandler('play', () => {
                audioRef.current?.play();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                audioRef.current?.pause();
            });

            // Adding a dummy stop handler can also help PWAs
            navigator.mediaSession.setActionHandler('stop', () => {
                audioRef.current?.pause();
                setIsPlaying(false);
            });
        }
    }, [currentTrack]);

    const playTrack = (track: Track) => {
        if (track.isPremium && !isPremiumUser) {
            showToast('Acesso negado. Recurso restrito a assinantes Premium.', 'error');
            return;
        }

        if (audioRef.current) {
            if (currentTrack?.id !== track.id) {
                audioRef.current.src = BASE_URL + track.url;
                setCurrentTrack(track);
            }
            audioRef.current.play().then(() => {
                showToast(`Fluxo de áudio [${track.title}] estabelecido.`, "success");
            }).catch((e) => {
                console.error("Audio playback failed:", e);
                showToast("Falha na conexão de áudio. Verifique sua rede ou interaja com a página.", "warning");
            });
        }

        setIsExpanded(false); // Collapse menu after selection
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            if (currentTrack) {
                audioRef.current?.play();
            } else {
                // If nothing playing and hasn't selected yet, expand menu
                setIsExpanded(true);
            }
        }
    };

    const handleMainFabClick = () => {
        if (isPlaying) {
            togglePlayPause();
            setIsExpanded(false);
        } else {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div className="absolute top-4 right-4 z-[30000] flex flex-col items-end gap-3 pointer-events-auto">
            {/* Bubble Menu: Expanded List */}
            <div
                className={`flex flex-col gap-2 transition-all duration-300 origin-bottom right-0 ${isExpanded ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-50 pointer-events-none'}`}
            >
                {FOCUS_TRACKS.map((track, i) => {
                    const isActive = currentTrack?.id === track.id && isPlaying;
                    return (
                        <button
                            key={track.id}
                            onClick={() => playTrack(track)}
                            className={`relative w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-lg border hover:border-cyan-400 group
                                ${isActive ? 'bg-cyan-900/40 border-cyan-400 ring-2 ring-cyan-400/30' : 'bg-black/60 border-white/10'}`}
                            style={{ transitionDelay: isExpanded ? `${(FOCUS_TRACKS.length - i - 1) * 30}ms` : '0ms' }}
                        >
                            <span className={`text-sm transition-all duration-300 ${!isActive ? 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100' : ''}`}>
                                {track.emoji}
                            </span>

                            {/* Premium Lock Overlay */}
                            {track.isPremium && (
                                <div className="absolute -bottom-1 -right-1 bg-black/80 rounded-full p-0.5 border border-yellow-500/50">
                                    <span className="text-[8px]">🔒</span>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Main FAB */}
            <button
                onClick={handleMainFabClick}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.5)] border group
                    ${isPlaying ? 'bg-cyan-900/50 border-cyan-400/50' : 'bg-black/80 border-white/20'}`}
            >
                {isPlaying ? (
                    // Wave Animation or Pause icon
                    <div className="flex items-center justify-center relative">
                        {/* Audio wave pulse rings */}
                        <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                        <PauseIcon className="w-6 h-6 text-cyan-400 relative z-10" />
                    </div>
                ) : (
                    // Play icon or Music note
                    <div className={`text-base relative text-gray-300 transition-all duration-300 ${!isPlaying ? 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100' : ''}`}>
                        {currentTrack ? currentTrack.emoji : '🎧'}
                    </div>
                )}
            </button>
        </div>
    );
};
