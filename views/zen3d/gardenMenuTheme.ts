import type { CSSProperties } from 'react';
import { buildUiSkinTokens, type UiSkinThemeMode } from '../../utils/uiSkinTokens';

/** Visual inputs only. Account, ownership and persistence stay outside the prototype. */
export interface GardenMenuProps {
  skinId?: string | null;
  theme?: UiSkinThemeMode;
}

export function gardenMenuStyle(skinId: GardenMenuProps['skinId'], theme: UiSkinThemeMode): CSSProperties {
  const skin = buildUiSkinTokens(skinId, theme);
  return {
    '--garden-panel': skin.cardBackground,
    '--garden-panel-strong': skin.cardStrongBackground,
    '--garden-line': skin.borderColor,
    '--garden-line-soft': skin.borderSoftColor,
    '--garden-text': skin.cardTextColor,
    '--garden-muted': skin.cardTextSoftColor,
    '--garden-accent': skin.accentTextColor,
    '--garden-active': skin.plannerPillActiveBackground,
    '--garden-control': skin.plannerPillBackground,
    '--garden-metal': skin.buttonBackground,
    '--garden-metal-text': skin.buttonText,
    '--garden-glow': skin.buttonGlow,
    colorScheme: theme,
  } as CSSProperties;
}
