/** Only public catalog rows are persisted; ownership and purchases remain live. */
export async function loadCatalogRows({storage, key, fetchRows, force = false, now = Date.now(), ttl = 24 * 60 * 60 * 1000}) {
    if (!force) {
        try {
            const saved = JSON.parse(storage?.getItem(key) || 'null');
            if (saved && Array.isArray(saved.rows) && saved.at <= now && now - saved.at < ttl) return saved.rows;
        } catch { /* Corrupt/disabled storage must not prevent a fresh read. */ }
    }
    const rows = await fetchRows();
    if (!Array.isArray(rows)) throw new Error('Invalid catalog response');
    try { storage?.setItem(key, JSON.stringify({at: now, rows})); } catch { /* Storage is optional. */ }
    return rows;
}

/** Share identical in-flight reads only. No stale cache for player state. */
export function createCoalescedFetch(fetcher, origin) {
    const pending = new Map();
    let generation = 0;
    return async (input, init) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        if (url.origin !== origin || !url.pathname.startsWith('/rest/v1/')) return fetcher(input, init);
        if (request.method !== 'GET') {
            generation++;
            try { return await fetcher(input, init); } finally { generation++; }
        }
        // An explicitly abortable caller must retain independent cancellation.
        if (init?.signal || input instanceof Request) return fetcher(input, init);
        const key = JSON.stringify([generation, request.url, [...request.headers.entries()]]);
        let promise = pending.get(key);
        if (!promise) {
            promise = fetcher(input, init);
            pending.set(key, promise);
            promise.finally(() => { if (pending.get(key) === promise) pending.delete(key); }).catch(() => {});
        }
        return (await promise).clone();
    };
}
