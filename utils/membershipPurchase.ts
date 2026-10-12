// Keep the same attempt after a lost response or reload. It is not a credential.
const pending = new Map<string, string>();
const keyFor = (userId: string, itemId: string) => `glyph:membership-purchase:${userId}:${itemId}`;

export const getPendingMembershipPurchase = (userId: string, itemId: string): string | null => {
    const key = keyFor(userId, itemId);
    try {
        const stored = localStorage.getItem(key);
        if (stored && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(stored)) return stored;
    } catch { /* In-memory retry still works if browser storage is unavailable. */ }
    return pending.get(key) || null;
};

export const beginMembershipPurchase = (userId: string, itemId: string): string => {
    const key = keyFor(userId, itemId);
    const id = getPendingMembershipPurchase(userId, itemId) || crypto.randomUUID();
    pending.set(key, id);
    try { localStorage.setItem(key, id); } catch { /* Keep the in-memory attempt. */ }
    return id;
};

export const finishMembershipPurchase = (userId: string, itemId: string): void => {
    const key = keyFor(userId, itemId);
    pending.delete(key);
    try { localStorage.removeItem(key); } catch { /* No account data is stored here. */ }
};
