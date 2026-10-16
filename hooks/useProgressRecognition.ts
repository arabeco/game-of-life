import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { ProgressRecognition, RecognitionKind } from '../utils/progressRecognition';

/** Somente agregado da própria conta/clã. Sem lista de jogadores ou assinatura realtime. */
export function useProgressRecognition(userId: string, kind: RecognitionKind, subjectId: string, current: number) {
    const key = `${userId}:${kind}:${subjectId}:${current}`;
    const [state, setState] = useState<{ key: string; value: ProgressRecognition | null } | null>(null);
    useEffect(() => {
        let disposed = false;
        let generation = 0;
        let unavailable = false;
        const refresh = async () => {
            if (disposed || unavailable || !userId || !subjectId || document.visibilityState === 'hidden') return;
            const request = ++generation;
            try {
                const { data, error } = await supabase.rpc('get_progress_recognition', {
                    p_kind: kind,
                    p_date: kind === 'day' ? subjectId : null,
                    p_cycle_id: kind === 'cycle' ? subjectId : null,
                });
                if (disposed || request !== generation) return;
                if (error) {
                    unavailable = error.code === 'PGRST202' || error.code === '42883';
                    setState({ key, value: null });
                    return;
                }
                const valid = data?.kind === kind && data?.subjectId === subjectId
                    && Number.isFinite(data?.current) && Math.abs(data.current - current) < 0.001;
                setState({ key, value: valid ? data as ProgressRecognition : null });
            } catch { if (!disposed && request === generation) setState({ key, value: null }); }
        };
        // Espera a persistência e agrupa toques próximos. Reabre sem herdar dados da conta anterior.
        const timer = window.setTimeout(() => void refresh(), 900);
        const interval = window.setInterval(() => void refresh(), 300_000);
        const onVisible = () => { void refresh(); };
        window.addEventListener('focus', onVisible);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            disposed = true; ++generation;
            window.clearTimeout(timer); window.clearInterval(interval);
            window.removeEventListener('focus', onVisible);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [key, userId, kind, subjectId, current]);
    return state?.key === key ? state.value : null;
}
