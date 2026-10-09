import type { OnboardingPurpose } from '../types';

export interface OnboardingProgress {
  stepId: string;
  arenaId: string | null;
  actionId: string | null;
  purpose: OnboardingPurpose | null;
  missionIds: string[];
}

const keyFor = (userId: string) => `glyph:onboarding-progress:v3:${userId}`;

export const loadOnboardingProgress = (userId: string): OnboardingProgress | null => {
  try {
    const value = JSON.parse(localStorage.getItem(keyFor(userId)) || 'null');
    if (!value || typeof value.stepId !== 'string') return null;
    return {
      stepId: value.stepId,
      arenaId: typeof value.arenaId === 'string' ? value.arenaId : null,
      actionId: typeof value.actionId === 'string' ? value.actionId : null,
      purpose: ['organizar', 'habitos', 'objetivo', 'retomar'].includes(value.purpose) ? value.purpose : null,
      missionIds: Array.isArray(value.missionIds) ? value.missionIds.filter((id: unknown) => typeof id === 'string') : [],
    };
  } catch { return null; }
};

export const saveOnboardingProgress = (userId: string, progress: OnboardingProgress) => {
  try { localStorage.setItem(keyFor(userId), JSON.stringify(progress)); } catch { /* Storage may be unavailable. */ }
};

export const clearOnboardingProgress = (userId: string) => {
  try { localStorage.removeItem(keyFor(userId)); } catch { /* Storage may be unavailable. */ }
};

// Reopen a form at its entry point; never ask for another saved arena/action.
export const resolveOnboardingResume = (
  progress: OnboardingProgress | null,
  arenas: { id: string; isArchived?: boolean }[],
  actions: { id: string; arenaId: string }[],
): OnboardingProgress => {
  const arena = arenas.find(a => a.id === progress?.arenaId && !a.isArchived)
    || arenas.find(a => !a.isArchived);
  const action = arena && (actions.find(a => a.id === progress?.actionId && a.arenaId === arena.id)
    || actions.find(a => a.arenaId === arena.id));
  let stepId = progress?.stepId || 'purpose';
  if (stepId !== 'purpose') {
    if (!arena) stepId = 'arena-entry';
    else if (!action) stepId = 'action-entry';
    else if (!['planner-hold', 'planner-schedule', 'planner-undo', 'cycle-later', 'missions', 'finish'].includes(stepId)) stepId = 'planner-hold';
  }
  return { stepId, arenaId: arena?.id || null, actionId: action?.id || null,
    purpose: progress?.purpose || null, missionIds: progress?.missionIds || [] };
};

export const shouldIgnoreGuideKeyboard = (event: KeyboardEvent) =>
  event.defaultPrevented || event.isComposing || event.repeat
  || (event.target instanceof Element && !!event.target.closest('input, textarea, select, button, [contenteditable="true"], [role="textbox"]'));
