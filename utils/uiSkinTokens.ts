type RGB = [number, number, number];

export type UiSkinThemeMode = 'light' | 'dark';

const UI_SKIN_ALIASES: Record<string, string> = {};

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
  ITEM_THEME_NEBULOSA: '#8db8ff',
};

const UI_SKIN_BUTTON_GRADIENTS: Record<string, string> = {
  BASIC: 'linear-gradient(135deg, #333333 0%, #eeeeee 50%, #333333 100%)',
  DEFAULT: 'linear-gradient(135deg, #333333 0%, #eeeeee 50%, #333333 100%)',
  GOLD: 'linear-gradient(135deg, #5c4a1f 0%, #d4af37 50%, #5c4a1f 100%)',
  FROST: 'linear-gradient(135deg, #6f9fd3 0%, #e1f4ff 48%, #8bc9f6 100%)',
  EMBER: 'linear-gradient(135deg, #2a0709 0%, #5d1013 28%, #a12a17 62%, #d26c1d 100%)',
  CYBER: 'linear-gradient(135deg, #06111d 0%, #15314d 28%, #35d8ff 62%, #ff56d8 100%)',
  AURORA: 'linear-gradient(135deg, #12375b 0%, #34d7ff 36%, #73f0cb 70%, #6b5cff 100%)',
  VOID: 'linear-gradient(135deg, #120815 0%, #2a1336 50%, #120815 100%)',
  GENESIS: 'linear-gradient(135deg, #241033 0%, #5b2b84 50%, #241033 100%)',
  ITEM_THEME_NEBULOSA: 'linear-gradient(135deg, #0c1026 0%, #253c7a 34%, #6f58ff 62%, #7ee7ff 100%)',
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
  const aliased = UI_SKIN_ALIASES[normalized] || normalized;
  return UI_SKIN_ACCENTS[aliased] ? aliased : 'DEFAULT';
};

export const resolveUiSkinId = (skinId?: string | null) => {
  const normalized = String(skinId || 'DEFAULT').trim().toUpperCase();
  const aliased = UI_SKIN_ALIASES[normalized] || normalized;
  return UI_SKIN_ACCENTS[aliased] ? aliased : 'DEFAULT';
};

export const buildUiSkinTokens = (skinId: string | null | undefined, theme: UiSkinThemeMode) => {
  const normalizedSkinId = normalizeSkinId(skinId);
  const accent = hexToRgb(UI_SKIN_ACCENTS[normalizedSkinId]);
  const buttonBackground = UI_SKIN_BUTTON_GRADIENTS[normalizedSkinId];
  const isEmber = normalizedSkinId === 'EMBER';
  const isCyber = normalizedSkinId === 'CYBER';
  const isNebulosa = normalizedSkinId === 'ITEM_THEME_NEBULOSA';
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
  const emberAmber = hexToRgb('#cf6519');
  const emberGlow = hexToRgb('#a61f1b');
  const cyberPink = hexToRgb('#ff56d8');
  const cyberBlue = hexToRgb('#35d8ff');
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
    const border = isEmber
      ? mixRgb(emberCrimson, emberAmber, 0.32)
      : isCyber
        ? mixRgb(cyberPink, cyberBlue, 0.48)
        : isNebulosa
          ? mixRgb(accent, white, 0.38)
          : mixRgb(accent, white, 0.28);
    const borderSoft = isEmber
      ? mixRgb(emberDeepWine, emberAmber, 0.38)!
      : isCyber
        ? mixRgb(cyberPink, deepDark, 0.28)!
        : isNebulosa
          ? mixRgb(accent, hexToRgb('#5f5bd8'), 0.34)!
          : mixRgb(accent, white, 0.18);
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
      buttonText: normalizedSkinId === 'VOID' || normalizedSkinId === 'EMBER' || normalizedSkinId === 'GENESIS' || normalizedSkinId === 'ITEM_THEME_NEBULOSA' || normalizedSkinId === 'CYBER' ? '#F6EEE7' : '#1B1408',
      buttonGlow: isNebulosa ? 'rgba(112, 102, 255, 0.26)' : isCyber ? 'rgba(255, 86, 216, 0.24)' : rgbToString(mixRgb(accent, deepDark, 0.44), 0.22),
      accentGradientBorder: isEmber
        ? 'linear-gradient(135deg, #230608 0%, #511116 28%, #9c2417 62%, #d16a1b 100%)'
        : isCyber
          ? 'linear-gradient(135deg, #07111c 0%, #17314d 28%, #35d8ff 60%, #ff56d8 100%)'
        : isNebulosa
          ? 'linear-gradient(135deg, #10142f 0%, #284590 30%, #6756ff 64%, #88ecff 100%)'
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
        : isCyber
          ? 'linear-gradient(180deg, rgba(10, 22, 37, 0.96) 0%, rgba(5, 10, 18, 0.985) 100%)'
        : isNebulosa
          ? 'linear-gradient(180deg, rgba(17, 23, 52, 0.96) 0%, rgba(8, 10, 23, 0.985) 100%)'
        : `linear-gradient(180deg, ${rgbToString(plannerTop, 0.95)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.08), 0.98)} 100%)`,
      plannerDayHeaderBackground: isEmber
        ? 'linear-gradient(180deg, rgba(108, 26, 27, 0.95) 0%, rgba(61, 17, 21, 0.985) 100%)'
        : isCyber
          ? 'linear-gradient(180deg, rgba(28, 55, 84, 0.95) 0%, rgba(16, 26, 45, 0.985) 65%, rgba(76, 26, 84, 0.985) 100%)'
        : isNebulosa
          ? 'linear-gradient(180deg, rgba(34, 53, 110, 0.95) 0%, rgba(19, 28, 62, 0.985) 100%)'
        : `linear-gradient(180deg, ${rgbToString(plannerHeader, 0.95)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.12), 0.98)} 100%)`,
      plannerDayHeaderText: isEmber ? '#f4dfd7' : isCyber ? '#f7f0ff' : isNebulosa ? '#ecf6ff' : rgbToString(accentText),
      plannerScrollBackground: isEmber
        ? 'linear-gradient(180deg, rgba(36, 12, 16, 0.975) 0%, rgba(10, 6, 8, 0.992) 100%)'
        : isNebulosa
          ? 'linear-gradient(180deg, rgba(15, 20, 43, 0.975) 0%, rgba(6, 8, 17, 0.992) 100%)'
        : `linear-gradient(180deg, ${rgbToString(plannerScroll, 0.97)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.16), 0.99)} 100%)`,
      plannerSurfaceBackground: isEmber
        ? 'linear-gradient(180deg, rgba(64, 22, 27, 0.982) 0%, rgba(16, 9, 12, 0.992) 100%)'
        : isNebulosa
          ? 'linear-gradient(180deg, rgba(27, 33, 69, 0.982) 0%, rgba(10, 12, 25, 0.992) 100%)'
        : `linear-gradient(180deg, ${rgbToString(mixRgb(plannerAccent, plannerDark, 0.16), 0.98)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.12), 0.99)} 100%)`,
      plannerWeekdayHeaderBackground: isEmber
        ? 'linear-gradient(180deg, rgba(108, 26, 27, 0.95) 0%, rgba(61, 17, 21, 0.985) 100%)'
        : isNebulosa
          ? 'linear-gradient(180deg, rgba(34, 53, 110, 0.95) 0%, rgba(19, 28, 62, 0.985) 100%)'
        : `linear-gradient(180deg, ${rgbToString(plannerHeader, 0.95)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.12), 0.98)} 100%)`,
      plannerFloatingBackground: isEmber
        ? 'linear-gradient(180deg, rgba(90, 25, 28, 0.95) 0%, rgba(45, 14, 18, 0.985) 100%)'
        : isNebulosa
          ? 'linear-gradient(180deg, rgba(43, 63, 124, 0.95) 0%, rgba(19, 30, 62, 0.985) 100%)'
        : `linear-gradient(180deg, ${rgbToString(plannerFloating, 0.95)} 0%, ${rgbToString(mixRgb(plannerAccent, deepDark, 0.08), 0.98)} 100%)`,
      plannerPillBackground: isEmber ? 'rgba(109, 28, 30, 0.42)' : isCyber ? 'rgba(34, 66, 101, 0.44)' : isNebulosa ? 'rgba(68, 88, 168, 0.42)' : rgbToString(plannerPill, 0.52),
      plannerPillActiveBackground: isEmber ? 'rgba(170, 72, 26, 0.76)' : isCyber ? 'rgba(198, 72, 165, 0.72)' : isNebulosa ? 'rgba(104, 88, 255, 0.76)' : rgbToString(plannerPillActive, 0.74),
      plannerSoftControlColor: isEmber ? '#f2ddcf' : isCyber ? '#f1eaff' : isNebulosa ? '#dcecff' : rgbToString(accentTextSoft),
      plannerHourLabelColor: isEmber ? 'rgba(244, 223, 210, 0.92)' : isCyber ? 'rgba(241, 234, 255, 0.92)' : isNebulosa ? 'rgba(223, 239, 255, 0.92)' : rgbToString(mixRgb(accent, white, 0.82)),
    };
  }

  const cardTop = mixRgb(accent, lightTop, 0.18);
  const cardBottom = mixRgb(accent, lightBottom, 0.26);
  const cardStrongTop = mixRgb(accent, lightSilver, 0.16);
  const cardStrongBottom = mixRgb(accent, lightBottom, 0.32);
  const border = isEmber
    ? mixRgb(emberCrimson, emberAmber, 0.34)!
    : isCyber
      ? mixRgb(cyberPink, cyberBlue, 0.44)!
      : isNebulosa
        ? mixRgb(accent, hexToRgb('#48537b'), 0.26)!
        : mixRgb(accent, safeDarkSoft, 0.34);
  const borderSoft = isEmber
    ? mixRgb(emberDeepWine, emberAmber, 0.4)!
    : isCyber
      ? mixRgb(cyberPink, hexToRgb('#5b7391'), 0.24)!
      : isNebulosa
        ? mixRgb(accent, hexToRgb('#6c78a4'), 0.22)!
        : mixRgb(accent, safeDarkSoft, 0.22);
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
    buttonText: normalizedSkinId === 'VOID' || normalizedSkinId === 'EMBER' || normalizedSkinId === 'GENESIS' || normalizedSkinId === 'ITEM_THEME_NEBULOSA' || normalizedSkinId === 'CYBER' ? '#F6EEE7' : '#1B1408',
    buttonGlow: isNebulosa ? 'rgba(120, 138, 255, 0.18)' : isCyber ? 'rgba(255, 86, 216, 0.16)' : rgbToString(mixRgb(accent, plannerBase, 0.28), 0.16),
    accentGradientBorder: isEmber
      ? 'linear-gradient(135deg, #31090c 0%, #641518 34%, #a82b17 68%, #d17421 100%)'
      : isCyber
        ? 'linear-gradient(135deg, #0b1830 0%, #23537d 28%, #39d7ff 58%, #ff62d9 100%)'
      : isNebulosa
        ? 'linear-gradient(135deg, #151a39 0%, #3352a2 34%, #6e61ff 68%, #7ee8ff 100%)'
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
      : isCyber
        ? 'linear-gradient(180deg, rgba(197, 215, 233, 0.97) 0%, rgba(133, 163, 198, 0.96) 72%, rgba(215, 177, 226, 0.96) 100%)'
      : isNebulosa
        ? 'linear-gradient(180deg, rgba(198, 210, 239, 0.97) 0%, rgba(133, 150, 214, 0.96) 100%)'
      : `linear-gradient(180deg, ${rgbToString(plannerTop, 0.97)} 0%, ${rgbToString(mixRgb(plannerAccent, plannerBase, 0.18), 0.96)} 100%)`,
    plannerDayHeaderBackground: isEmber
      ? 'linear-gradient(180deg, rgba(114, 40, 42, 0.95) 0%, rgba(70, 24, 31, 0.97) 100%)'
      : isCyber
        ? 'linear-gradient(180deg, rgba(163, 191, 220, 0.97) 0%, rgba(92, 124, 166, 0.96) 64%, rgba(206, 146, 214, 0.96) 100%)'
      : isNebulosa
        ? 'linear-gradient(180deg, rgba(154, 169, 226, 0.97) 0%, rgba(108, 126, 192, 0.96) 100%)'
      : `linear-gradient(180deg, ${rgbToString(plannerHeader, 0.97)} 0%, ${rgbToString(mixRgb(plannerAccent, plannerBase, 0.22), 0.96)} 100%)`,
    plannerDayHeaderText: isEmber ? '#f6e5df' : isCyber ? '#162235' : isNebulosa ? '#182742' : rgbToString(mixRgb(accent, safeDark, 0.62)),
    plannerScrollBackground: isEmber
      ? 'linear-gradient(180deg, rgba(189, 183, 188, 0.985) 0%, rgba(82, 64, 74, 0.99) 100%)'
      : isNebulosa
        ? 'linear-gradient(180deg, rgba(184, 193, 226, 0.985) 0%, rgba(78, 88, 138, 0.99) 100%)'
      : `linear-gradient(180deg, ${rgbToString(mixRgb(plannerAccent, plannerMid, 0.22), 0.98)} 0%, ${rgbToString(plannerScroll, 0.98)} 100%)`,
    plannerSurfaceBackground: isEmber
      ? 'linear-gradient(180deg, rgba(176, 169, 176, 0.985) 0%, rgba(58, 47, 58, 0.992) 100%)'
      : isNebulosa
        ? 'linear-gradient(180deg, rgba(170, 181, 222, 0.985) 0%, rgba(64, 74, 126, 0.992) 100%)'
      : `linear-gradient(180deg, ${rgbToString(mixRgb(plannerAccent, plannerMid, 0.26), 0.98)} 0%, ${rgbToString(plannerSurface, 0.99)} 100%)`,
    plannerWeekdayHeaderBackground: isEmber
      ? 'linear-gradient(180deg, rgba(114, 40, 42, 0.95) 0%, rgba(70, 24, 31, 0.97) 100%)'
      : isNebulosa
        ? 'linear-gradient(180deg, rgba(154, 169, 226, 0.97) 0%, rgba(108, 126, 192, 0.96) 100%)'
      : `linear-gradient(180deg, ${rgbToString(plannerHeader, 0.97)} 0%, ${rgbToString(mixRgb(plannerAccent, plannerBase, 0.22), 0.96)} 100%)`,
    plannerFloatingBackground: isEmber
      ? 'linear-gradient(180deg, rgba(108, 39, 43, 0.95) 0%, rgba(66, 24, 33, 0.96) 100%)'
      : isNebulosa
        ? 'linear-gradient(180deg, rgba(149, 164, 223, 0.96) 0%, rgba(95, 108, 176, 0.95) 100%)'
      : `linear-gradient(180deg, ${rgbToString(plannerFloating, 0.96)} 0%, ${rgbToString(mixRgb(plannerAccent, plannerBase, 0.18), 0.95)} 100%)`,
    plannerPillBackground: isEmber ? 'rgba(81, 38, 44, 0.42)' : isCyber ? 'rgba(255, 255, 255, 0.42)' : isNebulosa ? 'rgba(255, 255, 255, 0.46)' : rgbToString(plannerPill, 0.56),
    plannerPillActiveBackground: isEmber ? 'rgba(179, 98, 32, 0.74)' : isCyber ? 'rgba(103, 146, 214, 0.72)' : isNebulosa ? 'rgba(94, 106, 192, 0.72)' : rgbToString(plannerPillActive, 0.72),
    plannerSoftControlColor: isEmber ? '#f4e0d9' : isCyber ? '#162235' : isNebulosa ? '#1b2944' : rgbToString(mixRgb(accent, safeDark, 0.58)),
    plannerHourLabelColor: isEmber ? 'rgba(242, 222, 214, 0.9)' : isCyber ? '#162235' : isNebulosa ? '#1b2944' : rgbToString(mixRgb(accent, safeDark, 0.54)),
  };
};
