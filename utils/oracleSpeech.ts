export const ORACLE_SPEECH_EVENT = 'glyph:oracle-speech';

export type OracleSpeechKind = 'abertura' | 'reacao';

export type OracleSpeechPayload = {
  title?: string;
  message: string;
  /**
   * O tom decide a COR do detalhe da marca: o circulo no centro e a luz ao redor.
   * A casca continua dourada em todos — a cor informa sem tirar a identidade.
   * 'guide' faltava aqui, entao o azul era inalcancavel a partir de uma fala.
   */
  tone?: 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'guide';
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
