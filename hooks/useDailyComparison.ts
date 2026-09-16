import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { DailyComparison } from '../utils/dailyComparison';

const cache = new Map<string, {at: number; value: DailyComparison | null}>();
let unavailable = false;
export function useDailyComparison(userId: string, date: string, actions: number, xp: number) {
    const [result, setResult] = useState<DailyComparison | null>(null);
    useEffect(() => {
        let disposed = false;
        setResult(null);
        if (!userId || unavailable || actions === 0) return;
        const key = `${userId}:${date}:${actions}:${xp}`;
        const prior = cache.get(key);
        if (prior && Date.now() - prior.at < 600_000) { setResult(prior.value); return; }
        const timer = window.setTimeout(() => {
            void (async () => {
                try {
                    const {data, error} = await supabase.rpc('get_daily_comparison', {p_date: date});
                    if (error) {
                        if (error.code === 'PGRST202' || error.code === '42883') unavailable = true;
                        return;
                    }
                    const value = data?.date === date ? data as DailyComparison : null;
                    if (cache.size > 100) cache.clear();
                    cache.set(key, {at: Date.now(), value});
                    if (!disposed) setResult(value);
                } catch { /* No claim is better than a made-up percentile. */ }
            })();
        }, 1500);
        return () => {disposed = true; window.clearTimeout(timer);};
    }, [userId, date, actions, xp]);
    return result;
}
