/** Rolagem proporcional só perto da borda visível; independente de 60/120 Hz. */
export const plannerEdgeScroll = (y: number, top: number, bottom: number, elapsedMs: number) => {
    const edge = Math.min(72, Math.max(0, (bottom - top) / 4));
    if (!edge) return 0;
    const above = Math.max(0, Math.min(1, (top + edge - y) / edge));
    const below = Math.max(0, Math.min(1, (y - (bottom - edge)) / edge));
    return (below * below - above * above) * 700 * Math.min(32, Math.max(0, elapsedMs)) / 1000;
};
