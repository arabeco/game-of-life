const LOCKED_STYLE_KEYS = [
    'user-select',
    '-webkit-user-select',
    '-webkit-touch-callout',
] as const;

type LockTarget = HTMLElement;

let lockDepth = 0;
let previousInlineStyles: Array<{ target: LockTarget; values: Record<string, string> }> | null = null;

const getLockTargets = (): LockTarget[] => {
    if (typeof document === 'undefined') return [];

    const targets = [document.documentElement, document.body].filter(Boolean) as LockTarget[];
    return Array.from(new Set(targets));
};

export const lockTouchHoldSelection = (): (() => void) => {
    if (typeof document === 'undefined') {
        return () => {};
    }

    lockDepth += 1;

    if (lockDepth === 1) {
        const targets = getLockTargets();
        previousInlineStyles = targets.map((target) => ({
            target,
            values: Object.fromEntries(
                LOCKED_STYLE_KEYS.map((key) => [key, target.style.getPropertyValue(key)])
            ),
        }));

        targets.forEach((target) => {
            target.style.setProperty('user-select', 'none');
            target.style.setProperty('-webkit-user-select', 'none');
            target.style.setProperty('-webkit-touch-callout', 'none');
        });

        window.getSelection?.()?.removeAllRanges();
    }

    let released = false;

    return () => {
        if (released) return;
        released = true;

        lockDepth = Math.max(0, lockDepth - 1);
        if (lockDepth !== 0 || !previousInlineStyles) return;

        previousInlineStyles.forEach(({ target, values }) => {
            LOCKED_STYLE_KEYS.forEach((key) => {
                const previousValue = values[key] || '';
                if (previousValue) {
                    target.style.setProperty(key, previousValue);
                } else {
                    target.style.removeProperty(key);
                }
            });
        });

        previousInlineStyles = null;
    };
};
