import { useCallback, useRef } from 'react';
import { useGame } from '../contexts/GameContext';

type FeedbackType =
    | 'click'
    | 'click_soft'
    | 'click_crisp'
    | 'click_metal'
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
    const sampleBufferRef = useRef<AudioBuffer | null>(null);
    const sampleLoadPromiseRef = useRef<Promise<AudioBuffer | null> | null>(null);

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

    const createNoiseBuffer = (ctx: AudioContext, duration: number) => {
        const frameCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < frameCount; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
        }
        return buffer;
    };

    const loadMetalReference = useCallback(async () => {
        const ctx = getAudioContext();
        if (sampleBufferRef.current) return sampleBufferRef.current;
        if (sampleLoadPromiseRef.current) return sampleLoadPromiseRef.current;

        sampleLoadPromiseRef.current = fetch('/sfx/reference-metal-click.m4a')
            .then(async (response) => {
                if (!response.ok) return null;
                const arrayBuffer = await response.arrayBuffer();
                const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
                sampleBufferRef.current = decoded;
                return decoded;
            })
            .catch(() => null)
            .finally(() => {
                sampleLoadPromiseRef.current = null;
            });

        return sampleLoadPromiseRef.current;
    }, [getAudioContext]);

    const playMetalSlice = useCallback(async (
        start: number,
        duration: number,
        options?: { gain?: number; playbackRate?: number }
    ) => {
        const ctx = getAudioContext();
        const buffer = await loadMetalReference();
        if (!buffer) return false;

        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        source.buffer = buffer;
        source.playbackRate.value = options?.playbackRate ?? 1;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.setValueAtTime(options?.gain ?? 0.9, ctx.currentTime);
        source.start(ctx.currentTime, start, duration);
        return true;
    }, [getAudioContext, loadMetalReference]);

    const playMetalCombo = useCallback(async (
        steps: Array<{ start: number; duration: number; delayMs?: number; gain?: number; playbackRate?: number }>
    ) => {
        const buffer = await loadMetalReference();
        if (!buffer) return false;

        steps.forEach((step) => {
            window.setTimeout(() => {
                void playMetalSlice(step.start, step.duration, {
                    gain: step.gain,
                    playbackRate: step.playbackRate,
                });
            }, step.delayMs ?? 0);
        });

        return true;
    }, [loadMetalReference, playMetalSlice]);

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
                    case 'click_soft':
                    case 'click_crisp':
                    case 'click_metal':
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

            if (type === 'click_soft') {
                void playMetalSlice(0.00, 0.16, { gain: 0.95, playbackRate: 0.98 });
                return;
            }

            if (type === 'click') {
                void playMetalSlice(0.35, 0.16, { gain: 0.95, playbackRate: 1 });
                return;
            }

            if (type === 'click_crisp') {
                void playMetalSlice(0.74, 0.14, { gain: 0.95, playbackRate: 1.02 });
                return;
            }

            if (type === 'click_metal') {
                void playMetalCombo([
                    { start: 0.00, duration: 0.16, gain: 0.85, playbackRate: 0.98, delayMs: 0 },
                    { start: 0.35, duration: 0.16, gain: 0.82, playbackRate: 1, delayMs: 92 },
                ]);
                return;
            }

            if (type === 'success') {
                void playMetalCombo([
                    { start: 0.00, duration: 0.16, gain: 0.85, playbackRate: 0.98, delayMs: 0 },
                    { start: 0.35, duration: 0.16, gain: 0.82, playbackRate: 1, delayMs: 92 },
                ]);
                return;
            }

            if (type === 'warning') {
                void playMetalCombo([
                    { start: 0.74, duration: 0.14, gain: 0.85, playbackRate: 0.84, delayMs: 0 },
                    { start: 0.35, duration: 0.12, gain: 0.46, playbackRate: 0.8, delayMs: 120 },
                ]);
                return;
            }

            if (type === 'error') {
                void playMetalCombo([
                    { start: 0.74, duration: 0.14, gain: 0.88, playbackRate: 0.76, delayMs: 0 },
                    { start: 0.74, duration: 0.14, gain: 0.62, playbackRate: 0.68, delayMs: 136 },
                ]);
                return;
            }

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
                case 'warning': {
                    const knockA = ctx.createBufferSource();
                    const knockB = ctx.createBufferSource();
                    const filterA = ctx.createBiquadFilter();
                    const filterB = ctx.createBiquadFilter();
                    const gainA = ctx.createGain();
                    const gainB = ctx.createGain();

                    knockA.buffer = createNoiseBuffer(ctx, 0.04);
                    knockB.buffer = createNoiseBuffer(ctx, 0.04);
                    filterA.type = 'bandpass';
                    filterB.type = 'bandpass';
                    filterA.frequency.setValueAtTime(900, now);
                    filterB.frequency.setValueAtTime(760, now + 0.055);
                    filterA.Q.value = 0.8;
                    filterB.Q.value = 0.8;

                    knockA.connect(filterA);
                    filterA.connect(gainA);
                    gainA.connect(ctx.destination);
                    knockB.connect(filterB);
                    filterB.connect(gainB);
                    gainB.connect(ctx.destination);

                    gainA.gain.setValueAtTime(0.04, now);
                    gainA.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                    gainB.gain.setValueAtTime(0.03, now + 0.055);
                    gainB.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

                    knockA.start(now);
                    knockA.stop(now + 0.04);
                    knockB.start(now + 0.055);
                    knockB.stop(now + 0.095);
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
