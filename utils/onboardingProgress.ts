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
  // Passos que viraram um so (04/11/2026): quem parou neles retoma no novo.
  if (stepId === 'planner-schedule' || stepId === 'planner-undo') stepId = 'planner-hold';
  if (stepId !== 'purpose') {
    if (!arena) stepId = 'arena-entry';
    else if (!action) stepId = 'action-entry';
    else if (!['planner-drag', 'planner-hold', 'cycle-later', 'missions', 'oracle-presence', 'finish'].includes(stepId)) stepId = 'planner-drag';
  }
  return { stepId, arenaId: arena?.id || null, actionId: action?.id || null,
    purpose: progress?.purpose || null, missionIds: progress?.missionIds || [] };
};

/**
 * A JANELA FECHOU NO MEIO DO GUIA (04/11/2026, com o Afonso). Tocar no X da janela
 * deixava o passo sem alvo: o Proximo apagava e a pessoa so saia reabrindo o app.
 * Devolve o passo que reabre a janela, ou null quando esta tudo certo.
 */
export const passoAoFecharFormulario = (stepId: string, aberto: { arena: boolean; acao: boolean }): string | null => {
  if (['arena-asset', 'arena-name', 'arena-save'].includes(stepId) && !aberto.arena) return 'arena-entry';
  if (['action-name', 'action-reps', 'action-save'].includes(stepId) && !aberto.acao) return 'action-entry';
  return null;
};

export const shouldIgnoreGuideKeyboard = (event: KeyboardEvent) =>
  event.defaultPrevented || event.isComposing || event.repeat
  || (event.target instanceof Element && !!event.target.closest('input, textarea, select, button, [contenteditable="true"], [role="textbox"]'));
