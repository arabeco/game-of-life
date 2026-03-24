type RGB = [number, number, number];

export type UiSkinThemeMode = 'light' | 'dark';

const UI_SKIN_ACCENTS: Record<string, string> = {
  BASIC: '#ffffff',
  DEFAULT: '#ffffff',
  GOLD: '#C5A059',
  FROST: '#92d4f3',
  EMBER: '#a61f1b',
  CYBER: '#7cd9ff',
  AURORA: '#a5f3fc',
  VOID: '#f1edff',
  GENESIS: '#7c43c2',
};

const UI_SKIN_BUTTON_GRADIENTS: Record<string, string> = {
  BASIC: 'linear-gradient(135deg, #333333 0%, #eeeeee 50%, #333333 100%)',
  DEFAULT: 'linear-gradient(135deg, #333333 0%, #eeeeee 50%, #333333 100%)',
  GOLD: 'linear-gradient(135deg, #5c4a1f 0%, #d4af37 50%, #5c4a1f 100%)',
  FROST: 'linear-gradient(135deg, #4a90e2 0%, #92d4f3 50%, #4a90e2 100%)',
  EMBER: 'linear-gradient(135deg, #2f080b 0%, #5d1013 34%, #96211e 72%, #4f0e18 100%)',
  CYBER: 'linear-gradient(135deg, #143345 0%, #7cd9ff 50%, #143345 100%)',
  AURORA: 'linear-gradient(135deg, #0ea5e9 0%, #a5f3fc 50%, #0ea5e9 100%)',
  VOID: 'linear-gradient(135deg, #120815 0%, #2a1336 50%, #120815 100%)',
  GENESIS: 'linear-gradient(135deg, #241033 0%, #5b2b84 50%, #241033 100%)',
};

const hexToRgb = (hex: string): RGB => {
  const value = hex.replace('#', '').trim();
  const normalized = value.length === 3 ? value.split('').map((part) => part + part).join('') : value;
  const parsed = Number.parseInt(normalized, 16);
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
};

const mixRgb = (a: RGB, b: RGB, amount: number): RGB => {
  const t = Math.max(0, Math.min(1, amount));
  return [
    Math.round(a[0] * (1 - t) + b[0] * t),
    Math.round(a[1] * (1 - t) + b[1] * t),
    Math.round(a[2] * (1 - t) + b[2] * t),
  ];
};

const rgbToString = (rgb: RGB, alpha = 1) =>
  alpha >= 1 ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;

const normalizeSkinId = (skinId?: string | null) => {
  const normalized = String(skinId || 'DEFAULT').trim().toUpperCase();
  return UI_SKIN_ACCENTS[normalized] ? normalized : 'DEFAULT';
};

export const buildUiSkinTokens = (skinId: string | null | undefined, theme: UiSkinThemeMode) => {
  const normalizedSkinId = normalizeSkinId(skinId);
  const accent = hexToRgb(UI_SKIN_ACCENTS[normalizedSkinId]);
  const buttonBackground = UI_SKIN_BUTTON_GRADIENTS[normalizedSkinId];
  const isEmber = normalizedSkinId === 'EMBER';
  const isBasic = normalizedSkinId === 'BASIC' || normalizedSkinId === 'DEFAULT';

  const white = hexToRgb('#ffffff');
  const safeDark = hexToRgb('#141b24');
  const safeDarkSoft = hexToRgb('#4f5f72');
  const deepDark = hexToRgb('#090d12');
  const darkShell = hexToRgb('#20242d');
  const darkShellSoft = hexToRgb('#12171f');
  const lightTop = hexToRgb('#f5f8fa');
  const lightBottom = hexToRgb('#d5dde5');
  const lightSilver = hexToRgb('#e6edf3');
  const plannerMid = hexToRgb('#afbed0');
  const plannerBase = hexToRgb('#6c7b8f');
  const plannerDark = hexToRgb('#405162');
  const emberWine = hexToRgb('#58111a');
  const emberDeepWine = hexToRgb('#430b14');
  const emberFire = hexToRgb('#7e1516');
  const emberCrimson = hexToRgb('#991d1a');
  const emberGlow = hexToRgb('#a61f1b');
  const plannerAccent = isEmber ? emberCrimson : accent;

  if (isBasic && theme === 'dark') {
    return {
      accentHex: UI_SKIN_ACCENTS[normalizedSkinId],
      buttonBackground,
      buttonText: '#111827',
      buttonGlow: 'rgba(156, 171, 191, 0.18)',
      accentGradientBorder: 'linear-gradient(135deg, #2c3642 0%, #b6c4d6 50%, #2c3642 100%)',
      cardBackground: 'linear-gradient(180deg, rgba(35, 43, 54, 0.96) 0%, rgba(14, 19, 26, 0.985) 100%)',
      cardStrongBackground: 'linear-gradient(180deg, rgba(44, 53, 65, 0.975) 0%, rgba(11, 15, 21, 0.992) 100%)',
      borderColor: 'rgba(168, 184, 205, 0.34)',
      borderSoftColor: 'rgba(120, 136, 156, 0.24)',
      accentTextColor: '#e6edf5',
      accentSoftTextColor: '#a3b0c0',
      cardTextColor: '#e6edf5',
      cardTextSoftColor: '#9aa8b8',
      plannerTopBackground: 'linear-gradient(180deg, rgba(47, 56, 68, 0.96) 0%, rgba(19, 25, 33, 0.985) 100%)',
      plannerDayHeaderBackground: 'linear-gradient(180deg, rgba(59, 70, 84, 0.95) 0%, rgba(27, 34, 44, 0.985) 100%)',
      plannerDayHeaderText: '#edf4fb',
      plannerScrollBackground: 'linear-gradient(180deg, rgba(34, 42, 52, 0.98) 0%, rgba(12, 17, 23, 0.992) 100%)',
      plannerSurfaceBackground: 'linear-gradient(180deg, rgba(69, 79, 95, 0.982) 0%, rgba(28, 35, 45, 0.992) 100%)',
      plannerWeekdayHeaderBackground: 'linear-gradient(180deg, rgba(59, 70, 84, 0.95) 0%, rgba(27, 34, 44, 0.985) 100%)',
      plannerFloatingBackground: 'linear-gradient(180deg, rgba(74, 85, 101, 0.95) 0%, rgba(33, 41, 52, 0.985) 100%)',
      plannerPillBackground: 'rgba(255, 255, 255, 0.08)',
      plannerPillActiveBackground: 'rgba(181, 195, 214, 0.24)',
      plannerSoftControlColor: '#d7e2ed',
      plannerHourLabelColor: 'rgba(233, 241, 250, 0.92)',
    };
  }

  if (isBasic && theme === 'light') {
    return {
      accentHex: UI_SKIN_ACCENTS[normalizedSkinId],
      buttonBackground,
      buttonText: '#111827',
      buttonGlow: 'rgba(102, 120, 144, 0.16)',
      accentGradientBorder: 'linear-gradient(135deg, #c2ccd8 0%, #f4f7fb 50%, #9aaabd 100%)',
      cardBackground: 'linear-gradient(180deg, rgba(243, 247, 251, 0.97) 0%, rgba(215, 223, 232, 0.95) 100%)',
      cardStrongBackground: 'linear-gradient(180deg, rgba(249, 251, 253, 0.985) 0%, rgba(228, 235, 242, 0.97) 100%)',
      borderColor: 'rgba(110, 127, 147, 0.34)',
      borderSoftColor: 'rgba(128, 145, 166, 0.22)',
      accentTextColor: '#1a2430',
      accentSoftTextColor: '#5b6c7f',
      cardTextColor: '#1a2430',
      cardTextSoftColor: '#607185',
      plannerTopBackground: 'linear-gradient(180deg, rgba(220, 227, 236, 0.97) 0%, rgba(188, 199, 212, 0.96) 100%)',
      plannerDayHeaderBackground: 'linear-gradient(180deg, rgba(200, 210, 222, 0.97) 0%, rgba(170, 182, 196, 0.96) 100%)',
      plannerDayHeaderText: '#253647',
      plannerScrollBackground: 'linear-gradient(180deg, rgba(201, 210, 220, 0.98) 0%, rgba(140, 153, 170, 0.99) 100%)',
      plannerSurfaceBackground: 'linear-gradient(180deg, rgba(186, 196, 209, 0.985) 0%, rgba(109, 123, 142, 0.992) 100%)',
      plannerWeekdayHeaderBackground: 'linear-gradient(180deg, rgba(200, 210, 222, 0.97) 0%, rgba(170, 182, 196, 0.96) 100%)',
      plannerFloatingBackground: 'linear-gradient(180deg, rgba(210, 219, 229, 0.96) 0%, rgba(161, 174, 189, 0.97) 100%)',
      plannerPillBackground: 'rgba(255, 255, 255, 0.52)',
      plannerPillActiveBackground: 'rgba(100, 116, 139, 0.18)',
      plannerSoftControlColor: '#415366',
      plannerHourLabelColor: '#eef4fb',
    };
  }

  if (theme === 'dark') {
    const cardTop = mixRgb(accent, darkShell, 0.24);
    const cardBottom = mixRgb(accent, deepDark, 0.1);
    const cardStrongTop = mixRgb(accent, darkShellSoft, 0.16);
    const cardStrongBottom = mixRgb(accent, deepDark, 0.06);
    const border = isEmber ? emberCrimson : mixRgb(accent, white, 0.28);
    const borderSoft = isEmber ? mixRgb(emberDeepWine, emberFire, 0.44)! : mixRgb(accent, white, 0.18);
    const accentText = mixRgb(accent, white, 0.74);
    const accentTextSoft = mixRgb(accent, hexToRgb('#bcc8d5'), 0.82);
    const plannerTop = mixRgb(plannerAccent, hexToRgb('#151b24'), 0.18);
    const plannerHeader = mixRgb(plannerAccent, hexToRgb('#0f141b'), 0.16);
    const plannerScroll = mixRgb(plannerAccent, hexToRgb('#10161d'), 0.12);
    const plannerSurface = mixRgb(plannerAccent, deepDark, 0.08);
    const plannerFloating = mixRgb(plannerAccent, darkShell, 0.22);
    const plannerPill = mixRgb(plannerAccent, darkShell, 0.1);
    const plannerPillActive = mixRgb(plannerAccent, darkShell, 0.34);

    return {
      accentHex: UI_SKIN_ACCENTS[normalizedSkinId],
      buttonBackground,
      buttonText: normalizedSkinId === 'VOID' || normalizedSkinId === 'EMBER' || normalizedSkinId === 'GENESIS' ? '#F6EEE7' : '#1B1408',
      buttonGlow: rgbToString(mixRgb(accent, deepDark, 0.44), 0.22),
      accentGradientBorder: isEmber
        ? 'linear-gradient(135deg, #270609 0%, #4f0e11 34%, #871f1c 72%, #420c15 100%)'
        : buttonBackground,
      cardBackground: `linear-gradient(180deg, ${rgbToString(cardTop, 0.96)} 0%, ${rgbToString(cardBottom, 0.985)} 100%)`,
      cardStrongBackground: `linear-gradient(180deg, ${rgbToString(cardStrongTop, 0.975)} 0%, ${rgbToString(cardStrongBottom, 0.99)} 100%)`,
      borderColor: rgbToString(border),
      borderSoftColor: rgbToString(borderSoft),
      accentTextColor: rgbToString(accentText),
      accentSoftTextColor: rgbToString(accentTextSoft),
      cardTextColor: rgbToString(accentText),
      cardTextSoftColor: rgbToString(accentTextSoft),
      plannerTopBackground: isEmber
        ? 'linear-gradient(180deg, rgba(57, 12, 16, 0.96) 0%, rgba(20, 8, 10, 0.985) 100%)'
        : `linear-gradient(180deg, ${rgbToString(plannerTop, 0.95)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.08), 0.98)} 100%)`,
      plannerDayHeaderBackground: isEmber
        ? 'linear-gradient(180deg, rgba(108, 26, 27, 0.95) 0%, rgba(61, 17, 21, 0.985) 100%)'
        : `linear-gradient(180deg, ${rgbToString(plannerHeader, 0.95)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.12), 0.98)} 100%)`,
      plannerDayHeaderText: isEmber ? '#f4dfd7' : rgbToString(accentText),
      plannerScrollBackground: isEmber
        ? 'linear-gradient(180deg, rgba(36, 12, 16, 0.975) 0%, rgba(10, 6, 8, 0.992) 100%)'
        : `linear-gradient(180deg, ${rgbToString(plannerScroll, 0.97)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.16), 0.99)} 100%)`,
      plannerSurfaceBackground: isEmber
        ? 'linear-gradient(180deg, rgba(64, 22, 27, 0.982) 0%, rgba(16, 9, 12, 0.992) 100%)'
        : `linear-gradient(180deg, ${rgbToString(mixRgb(plannerAccent, plannerDark, 0.16), 0.98)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.12), 0.99)} 100%)`,
      plannerWeekdayHeaderBackground: isEmber
        ? 'linear-gradient(180deg, rgba(108, 26, 27, 0.95) 0%, rgba(61, 17, 21, 0.985) 100%)'
        : `linear-gradient(180deg, ${rgbToString(plannerHeader, 0.95)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.12), 0.98)} 100%)`,
      plannerFloatingBackground: isEmber
        ? 'linear-gradient(180deg, rgba(90, 25, 28, 0.95) 0%, rgba(45, 14, 18, 0.985) 100%)'
        : `linear-gradient(180deg, ${rgbToString(plannerFloating, 0.95)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.08), 0.98)} 100%)`,
      plannerPillBackground: isEmber ? 'rgba(109, 28, 30, 0.42)' : rgbToString(plannerPill, 0.52),
      plannerPillActiveBackground: isEmber ? 'rgba(154, 33, 30, 0.74)' : rgbToString(plannerPillActive, 0.74),
      plannerSoftControlColor: isEmber ? '#f0d7cf' : rgbToString(accentTextSoft),
      plannerHourLabelColor: isEmber ? 'rgba(240, 214, 206, 0.92)' : rgbToString(mixRgb(accent, white, 0.82)),
    };
  }

  const cardTop = mixRgb(accent, lightTop, 0.18);
  const cardBottom = mixRgb(accent, lightBottom, 0.26);
  const cardStrongTop = mixRgb(accent, lightSilver, 0.16);
  const cardStrongBottom = mixRgb(accent, lightBottom, 0.32);
  const border = isEmber ? mixRgb(emberCrimson, emberFire, 0.28)! : mixRgb(accent, safeDarkSoft, 0.34);
  const borderSoft = isEmber ? mixRgb(emberDeepWine, emberFire, 0.52)! : mixRgb(accent, safeDarkSoft, 0.22);
  const accentText = mixRgb(accent, safeDark, 0.9);
  const accentTextSoft = mixRgb(accent, safeDarkSoft, 0.88);
  const plannerTop = mixRgb(plannerAccent, plannerMid, 0.2);
  const plannerHeader = mixRgb(plannerAccent, plannerMid, 0.26);
  const plannerScroll = mixRgb(plannerAccent, plannerBase, 0.18);
  const plannerSurface = mixRgb(plannerAccent, plannerDark, 0.1);
  const plannerFloating = mixRgb(plannerAccent, plannerMid, 0.28);
  const plannerPill = mixRgb(plannerAccent, lightBottom, 0.18);
  const plannerPillActive = mixRgb(plannerAccent, plannerBase, 0.22);

  return {
    accentHex: UI_SKIN_ACCENTS[normalizedSkinId],
    buttonBackground,
    buttonText: normalizedSkinId === 'VOID' || normalizedSkinId === 'EMBER' || normalizedSkinId === 'GENESIS' ? '#F6EEE7' : '#1B1408',
    buttonGlow: rgbToString(mixRgb(accent, plannerBase, 0.28), 0.16),
    accentGradientBorder: isEmber
      ? 'linear-gradient(135deg, #390c10 0%, #611416 36%, #97231e 72%, #4b0f1b 100%)'
      : buttonBackground,
    cardBackground: `linear-gradient(180deg, ${rgbToString(cardTop, 0.96)} 0%, ${rgbToString(cardBottom, 0.94)} 100%)`,
    cardStrongBackground: `linear-gradient(180deg, ${rgbToString(cardStrongTop, 0.98)} 0%, ${rgbToString(cardStrongBottom, 0.96)} 100%)`,
    borderColor: rgbToString(border),
    borderSoftColor: rgbToString(borderSoft),
    accentTextColor: rgbToString(accentText),
    accentSoftTextColor: rgbToString(accentTextSoft),
    cardTextColor: rgbToString(accentText),
    cardTextSoftColor: rgbToString(accentTextSoft),
    plannerTopBackground: isEmber
      ? 'linear-gradient(180deg, rgba(90, 35, 42, 0.95) 0%, rgba(58, 22, 31, 0.96) 100%)'
      : `linear-gradient(180deg, ${rgbToString(plannerTop, 0.97)} 0%, ${rgbToString(mixRgb(plannerAccent, plannerBase, 0.18), 0.96)} 100%)`,
    plannerDayHeaderBackground: isEmber
      ? 'linear-gradient(180deg, rgba(114, 40, 42, 0.95) 0%, rgba(70, 24, 31, 0.97) 100%)'
      : `linear-gradient(180deg, ${rgbToString(plannerHeader, 0.97)} 0%, ${rgbToString(mixRgb(plannerAccent, plannerBase, 0.22), 0.96)} 100%)`,
    plannerDayHeaderText: isEmber ? '#f6e5df' : rgbToString(mixRgb(accent, hexToRgb('#edf4fb'), 0.22)),
    plannerScrollBackground: isEmber
      ? 'linear-gradient(180deg, rgba(189, 183, 188, 0.985) 0%, rgba(82, 64, 74, 0.99) 100%)'
      : `linear-gradient(180deg, ${rgbToString(mixRgb(plannerAccent, plannerMid, 0.22), 0.98)} 0%, ${rgbToString(plannerScroll, 0.98)} 100%)`,
    plannerSurfaceBackground: isEmber
      ? 'linear-gradient(180deg, rgba(176, 169, 176, 0.985) 0%, rgba(58, 47, 58, 0.992) 100%)'
      : `linear-gradient(180deg, ${rgbToString(mixRgb(plannerAccent, plannerMid, 0.26), 0.98)} 0%, ${rgbToString(plannerSurface, 0.99)} 100%)`,
    plannerWeekdayHeaderBackground: isEmber
      ? 'linear-gradient(180deg, rgba(114, 40, 42, 0.95) 0%, rgba(70, 24, 31, 0.97) 100%)'
      : `linear-gradient(180deg, ${rgbToString(plannerHeader, 0.97)} 0%, ${rgbToString(mixRgb(plannerAccent, plannerBase, 0.22), 0.96)} 100%)`,
    plannerFloatingBackground: isEmber
      ? 'linear-gradient(180deg, rgba(108, 39, 43, 0.95) 0%, rgba(66, 24, 33, 0.96) 100%)'
      : `linear-gradient(180deg, ${rgbToString(plannerFloating, 0.96)} 0%, ${rgbToString(mixRgb(plannerAccent, plannerBase, 0.18), 0.95)} 100%)`,
    plannerPillBackground: isEmber ? 'rgba(81, 38, 44, 0.42)' : rgbToString(plannerPill, 0.56),
    plannerPillActiveBackground: isEmber ? 'rgba(128, 46, 45, 0.72)' : rgbToString(plannerPillActive, 0.72),
    plannerSoftControlColor: isEmber ? '#f4e0d9' : rgbToString(accentText),
    plannerHourLabelColor: isEmber ? 'rgba(242, 222, 214, 0.9)' : rgbToString(mixRgb(accent, hexToRgb('#edf4fb'), 0.18)),
  };
};
