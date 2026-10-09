import { useEffect, useId } from 'react';
import { SCREEN_INTRO_TIP_CONTEXT_EVENT, type ScreenIntroTipId } from '../utils/screenIntroTips';

// Each mounted surface owns its tip. Closing a modal restores the underlying tab.
export const useScreenIntroTip = (tipId: ScreenIntroTipId | null, priority = 10) => {
  const ownerId = useId();
  useEffect(() => {
    if (!tipId) return;
    const timer = window.setTimeout(() => window.dispatchEvent(new CustomEvent(SCREEN_INTRO_TIP_CONTEXT_EVENT, {
      detail: { ownerId, tipId, priority },
    })), 0);
    return () => {
      window.clearTimeout(timer);
      window.dispatchEvent(new CustomEvent(SCREEN_INTRO_TIP_CONTEXT_EVENT, { detail: { ownerId, tipId: null } }));
    };
  }, [ownerId, tipId, priority]);
};
