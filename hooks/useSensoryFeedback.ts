import { useCallback, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';

type FeedbackType = 
    | 'click' 
    | 'success' 
    | 'error' 
    | 'warning' 
    | 'impact'
    | 'whoosh'      // Modais
    | 'fanfare'     // Level Up / Missão
    | 'notification' // Chat Mensagem
    | 'level_up';   // Vibração pulsante + Fanfare

export const useSensoryFeedback = () => {
    const { oraclePreferences } = useGame();
    const audioContextRef = useRef<AudioContext | null>(null);

    // Inicializa AudioContext (lazy)
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    }, []);

    const trigger = useCallback((type: FeedbackType) => {
        // Haptics (Vibração)
        if (oraclePreferences?.haptic_enabled && navigator.vibrate) {
            switch (type) {
                case 'click':
                    navigator.vibrate(5);
                    break;
                case 'success':
                    navigator.vibrate([10, 30, 10]);
                    break;
                case 'error':
                    navigator.vibrate([50, 50, 50]);
                    break;
                case 'warning':
                    navigator.vibrate([30, 50]);
                    break;
                case 'impact':
                    navigator.vibrate(15);
                    break;
                case 'whoosh':
                    navigator.vibrate(10); // Leve feedback tátil
                    break;
                case 'notification':
                    navigator.vibrate([50, 50, 50]); // Dupla rápida
                    break;
                case 'level_up':
                case 'fanfare':
                    navigator.vibrate([200, 100, 200]); // Longa-curta-longa (pulsante)
                    break;
            }
        }

        // Áudio Procedural
        if (oraclePreferences?.sound_enabled) {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            switch (type) {
                case 'click': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
                    
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                    
                    osc.start(now);
                    osc.stop(now + 0.1);
                    break;
                }
                case 'whoosh': {
                    // Ruído branco filtrado para efeito de "ar"
                    const bufferSize = ctx.sampleRate * 0.5; // 0.5 sec
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }

                    const noise = ctx.createBufferSource();
                    noise.buffer = buffer;
                    
                    const filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(400, now);
                    filter.frequency.linearRampToValueAtTime(100, now + 0.3);

                    const gain = ctx.createGain();
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);
                    
                    noise.start(now);
                    break;
                }
                case 'notification': {
                    // Bip suave duplo
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.setValueAtTime(800, now + 0.1); // Segundo tom

                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.2);

                    osc.start(now);
                    osc.stop(now + 0.2);
                    break;
                }
                case 'fanfare':
                case 'level_up': {
                    // Fanfarra procedural simples (arpeggio maior)
                    const notes = [440, 554.37, 659.25, 880]; // A Major
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);

                        const startTime = now + (i * 0.1);
                        osc.frequency.value = freq;
                        osc.type = 'triangle';

                        gain.gain.setValueAtTime(0, startTime);
                        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

                        osc.start(startTime);
                        osc.stop(startTime + 0.5);
                    });
                    break;
                }
            }
        }
    }, [getAudioContext, oraclePreferences]);

    return { trigger };
};
