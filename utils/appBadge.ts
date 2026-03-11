export const updateInstalledAppBadge = async (count: number) => {
    try {
        const navigatorWithBadge = navigator as Navigator & {
            setAppBadge?: (count?: number) => Promise<void>;
            clearAppBadge?: () => Promise<void>;
        };

        if (count > 0 && navigatorWithBadge.setAppBadge) {
            await navigatorWithBadge.setAppBadge(count);
            return;
        }

        if (count <= 0 && navigatorWithBadge.clearAppBadge) {
            await navigatorWithBadge.clearAppBadge();
        }
    } catch (error) {
        console.warn('App badge update skipped:', error);
    }
};
