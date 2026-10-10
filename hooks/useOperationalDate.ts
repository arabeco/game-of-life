import { useEffect, useState } from 'react';
import { getOperationalDateString, OPERATIONAL_DAY_CUTOFF_HOUR } from '../utils/operationalDay.js';

/** Refresh at the local 04:00 boundary, including after background suspension. */
export function useOperationalDate() {
    const [date, setDate] = useState(() => getOperationalDateString());
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        const refresh = () => {
            clearTimeout(timer);
            const now = new Date();
            setDate(getOperationalDateString(now));
            const next = new Date(now);
            next.setHours(OPERATIONAL_DAY_CUTOFF_HOUR, 0, 0, 0);
            if (next <= now) next.setDate(next.getDate() + 1);
            timer = setTimeout(refresh, next.getTime() - now.getTime() + 50);
        };
        refresh();
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, []);
    return date;
}
