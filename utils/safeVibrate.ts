export const safeVibrate = (pattern: VibratePattern) => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;

  const userActivation = (navigator as Navigator & { userActivation?: { hasBeenActive?: boolean; isActive?: boolean } }).userActivation;
  if (userActivation && !userActivation.hasBeenActive && !userActivation.isActive) return;

  try {
    navigator.vibrate(pattern);
  } catch {
    // Browsers can reject vibration outside direct user interaction.
  }
};
