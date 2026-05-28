export const ORACLE_SPEECH_EVENT = 'glyph:oracle-speech';

export type OracleSpeechPayload = {
  title?: string;
  message: string;
  tone?: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  durationMs?: number;
};

export const emitOracleSpeech = (payload: OracleSpeechPayload) => {
  if (typeof window === 'undefined' || !payload.message?.trim()) return;
  window.dispatchEvent(new CustomEvent<OracleSpeechPayload>(ORACLE_SPEECH_EVENT, { detail: payload }));
};
