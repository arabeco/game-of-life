import { Capacitor, registerPlugin } from '@capacitor/core';
import type { DailyWidgetSnapshot, OracleWidgetSnapshot } from './widgetSnapshots';

type GlyphWidgetPlugin = {
  update(options: { snapshot: string }): Promise<void>;
};

const GlyphWidget = registerPlugin<GlyphWidgetPlugin>('GlyphWidget');

export type GlyphAndroidWidgetSnapshot = {
  updatedAt: string;
  daily: DailyWidgetSnapshot;
  oracle: OracleWidgetSnapshot;
  // Sem login (13/10/2026): o widget so mostra o dia e abre o app. Quem conclui
  // e o app, entao o widget nao precisa mais guardar sessao no celular.
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
