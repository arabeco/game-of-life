export const ORACLE_SPEECH_EVENT = 'glyph:oracle-speech';

export type OracleSpeechKind = 'abertura' | 'reacao';

export type OracleSpeechPayload = {
  title?: string;
  message: string;
  tone?: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  durationMs?: number;
  /** Classifica a fala momentânea; nenhuma abertura ou reação entra no chat. */
  kind?: OracleSpeechKind;
  /** Botoes de navegacao que acompanham a fala, quando ela sugere um caminho. */
  quickActions?: Array<Record<string, unknown>>;
  /** Compatibilidade com emissores antigos; todas as falas já são temporárias. */
  ephemeral?: boolean;
};

/** Aberturas e reações pertencem ao momento, sem persistência ou rede. */
export const emitOracleSpeech = (payload: OracleSpeechPayload) => {
  if (typeof window === 'undefined' || !payload.message?.trim()) return;
  window.dispatchEvent(new CustomEvent<OracleSpeechPayload>(ORACLE_SPEECH_EVENT, { detail: payload }));
};
