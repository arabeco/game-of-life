import { supabase } from '../supabaseClient';

export const ORACLE_SPEECH_EVENT = 'glyph:oracle-speech';

export type OracleSpeechKind = 'abertura' | 'reacao';

export type OracleSpeechPayload = {
  title?: string;
  message: string;
  tone?: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  durationMs?: number;
  /**
   * O que essa fala e. Decide se ela fica gravada e como aparece no historico.
   * Sem isto ela so pisca no topo e evapora, que era o problema.
   */
  kind?: OracleSpeechKind;
  /** Botoes de navegacao que acompanham a fala, quando ela sugere um caminho. */
  quickActions?: Array<Record<string, unknown>>;
  /**
   * Fala que nao deve ficar gravada. Usado pelas reacoes de rotina — "voce fez 5
   * acoes hoje" dispara quase todo dia e, empilhado no historico, vira papel de
   * parede. Marco fica; rotina passa.
   */
  ephemeral?: boolean;
};

/**
 * A fala aparece na hora E fica gravada.
 *
 * O balao no topo continua existindo porque e o que da o "ele falou agora". Mas
 * ele deixou de ser o unico lugar: a mesma fala vira linha em oracle_messages,
 * onde o chat a le com data e hora e o trigger de push a leva para o celular de
 * quem deixou o aviso ligado.
 *
 * A gravacao nao bloqueia o balao. Se a rede cair, a fala ainda aparece — perder
 * o historico e ruim, nao mostrar nada e pior.
 */
export const emitOracleSpeech = (payload: OracleSpeechPayload) => {
  if (typeof window === 'undefined' || !payload.message?.trim()) return;
  window.dispatchEvent(new CustomEvent<OracleSpeechPayload>(ORACLE_SPEECH_EVENT, { detail: payload }));

  if (payload.ephemeral) return;

  void supabase.rpc('record_oracle_speech', {
    p_message: payload.message.trim(),
    p_title: payload.title || null,
    p_kind: payload.kind || 'abertura',
    p_tone: payload.tone || 'info',
    p_quick_actions: payload.quickActions || [],
  }).then(({ error }) => {
    if (error) console.error('Failed to record oracle speech:', error.message);
  });
};
