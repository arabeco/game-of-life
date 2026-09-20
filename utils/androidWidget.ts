import { Capacitor, registerPlugin } from '@capacitor/core';
import type { DailyWidgetSnapshot, OracleWidgetSnapshot } from './widgetSnapshots';

type GlyphWidgetPlugin = {
  update(options: { snapshot: string }): Promise<void>;
};

const GlyphWidget = registerPlugin<GlyphWidgetPlugin>('GlyphWidget');

export type GlyphAndroidWidgetSnapshot = {
  updatedAt: string;
  /**
   * A cor da Skin de UI equipada, em #rrggbb.
   *
   * O widget nao roda CSS e nao enxerga `--skin-accent-color`: ele so recebe
   * este JSON. Sem este campo o fundo dele ficava dourado para todo mundo,
   * inclusive para quem equipou Gelo ou Cyberpunk — o mesmo defeito que o bloco
   * de ciclo tinha dentro do app ate 3cc9dc4.
   */
  accentColor?: string;
  daily: DailyWidgetSnapshot;
  oracle: OracleWidgetSnapshot;
  auth?: {
    supabaseUrl: string;
    anonKey: string;
    accessToken: string;
    refreshToken: string;
  };
};

export const publishGlyphAndroidWidgetSnapshot = async (
  snapshot: GlyphAndroidWidgetSnapshot,
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await GlyphWidget.update({ snapshot: JSON.stringify(snapshot) });
  } catch (error) {
    console.warn('Glyph widget update failed:', error);
  }
};
