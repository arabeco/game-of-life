import { useCallback, useRef } from 'react';
import { useGame } from '../contexts/GameContext';

type FeedbackType =
    | 'click'
    | 'success'
    | 'error'
    | 'warning'
    | 'impact'
    | 'whoosh'
    | 'fanfare'
    | 'notification'
    | 'level_up';

export const useSensoryFeedback = () => {
    const { oraclePreferences, appMode } = useGame();
    const audioContextRef = useRef<AudioContext | null>(null);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    }, []);

    const getHapticsEnabled = () => {
        const prefs = oraclePreferences as any;
        return Boolean(prefs?.hapticsEnabled ?? prefs?.haptic_enabled);
    };

    const getSoundsEnabled = () => {
        const prefs = oraclePreferences as any;
        return Boolean(prefs?.soundsEnabled ?? prefs?.sound_enabled);
    };

    const trigger = useCallback((type: FeedbackType) => {
        const sensoryProfile: 'sovereign' | 'basic' = appMode === 'BASIC' ? 'basic' : 'sovereign';

        if (getHapticsEnabled() && navigator.vibrate) {
            if (sensoryProfile === 'basic') {
                const basicPattern: number | number[] =
                    type === 'error' ? 16 :
                    type === 'warning' ? 10 :
                    type === 'level_up' || type === 'fanfare' ? [8, 24, 10] :
                    8;
                navigator.vibrate(basicPattern);
            } else {
                switch (type) {
                    case 'click':
                        navigator.vibrate(8);
                        break;
                    case 'success':
                        navigator.vibrate([12, 24, 12]);
                        break;
                    case 'error':
                        navigator.vibrate([50, 50, 50]);
                        break;
                    case 'warning':
                        navigator.vibrate([24, 40]);
                        break;
                    case 'impact':
                        navigator.vibrate(18);
                        break;
                    case 'whoosh':
                        navigator.vibrate(12);
                        break;
                    case 'notification':
                        navigator.vibrate([25, 25]);
                        break;
                    case 'fanfare':
                    case 'level_up':
                        // Soberano: pulso crescente para milestones.
                        navigator.vibrate([120, 40, 180, 40, 240]);
                        break;
                }
            }
        }

        if (getSoundsEnabled()) {
            const ctx = getAudioContext();
            const now = ctx.currentTime;

            switch (type) {
                case 'click': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.type = sensoryProfile === 'basic' ? 'sine' : 'triangle';
                    osc.frequency.setValueAtTime(sensoryProfile === 'basic' ? 700 : 800, now);
                    osc.frequency.exponentialRampToValueAtTime(sensoryProfile === 'basic' ? 450 : 300, now + 0.1);

                    gain.gain.setValueAtTime(sensoryProfile === 'basic' ? 0.06 : 0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

                    osc.start(now);
                    osc.stop(now + 0.1);
                    break;
                }
                case 'whoosh': {
                    const bufferSize = ctx.sampleRate * 0.5;
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
                    gain.gain.setValueAtTime(sensoryProfile === 'basic' ? 0.03 : 0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);

                    noise.start(now);
                    break;
                }
                case 'notification': {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.setValueAtTime(800, now + 0.1);

                    gain.gain.setValueAtTime(sensoryProfile === 'basic' ? 0.03 : 0.05, now);
                    gain.gain.linearRampToValueAtTime(0, now + 0.2);

                    osc.start(now);
                    osc.stop(now + 0.2);
                    break;
                }
                case 'fanfare':
                case 'level_up': {
                    const notes = [440, 554.37, 659.25, 880];
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);

                        const startTime = now + (i * 0.1);
                        osc.frequency.value = freq;
                        osc.type = 'triangle';

                        gain.gain.setValueAtTime(0, startTime);
                        gain.gain.linearRampToValueAtTime(sensoryProfile === 'basic' ? 0.06 : 0.1, startTime + 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

                        osc.start(startTime);
                        osc.stop(startTime + 0.5);
                    });
                    break;
                }
            }
        }
    }, [appMode, getAudioContext, oraclePreferences]);

    return { trigger };
};
