import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Keep fixed controls outside the transformed tab, inside the active theme. */
export const FloatingActionDock: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [host, setHost] = useState<HTMLElement | null>(null);
    useEffect(() => {
        setHost(document.querySelector<HTMLElement>('.auth-footer')?.parentElement || null);
    }, []);
    if (!host) return null;
    return createPortal(
        <div className="fixed right-4 z-20 flex items-end gap-2" style={{ bottom: 'calc(4rem + var(--safe-area-bottom, 0px) + 8px)' }}>
            {children}
        </div>,
        host,
    );
};
