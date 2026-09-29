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

/*
 * A MAO GANHA DO ORACULO. SEMPRE.
 *
 * Concluir uma tarefa arrastando dispara uma reacao, e a fala entrava no ar no
 * meio do gesto seguinte — disputando com quem ainda estava com o dedo na tela.
 * Quem esta arrastando esta fazendo; quem fala esta comentando. Comentario
 * espera.
 *
 * Enquanto a mao estiver na tela a fala fica guardada, e sai quando soltar. Se
 * outro gesto comecar antes de ela sair, ela volta para a espera: arrastar tres
 * tarefas seguidas nao deve ser interrompido duas vezes no caminho.
 *
 * GUARDA SO A ULTIMA. Tres conclusoes num mesmo arrasto rendem tres reacoes, e
 * solta-las em fila viraria fila de balao — pior que o problema. A ultima e a
 * que ainda tem a ver com o que acabou de acontecer.
 */
let maosNaTela = 0;
let falaGuardada: OracleSpeechPayload | null = null;
let timerDeSaida: ReturnType<typeof setTimeout> | null = null;

/** O tempo entre soltar e falar. Curto para nao parecer atraso, longo o
 *  bastante para o proximo gesto comecar antes e adiar de novo. */
const RESPIRO_APOS_SOLTAR_MS = 400;

const despachar = (payload: OracleSpeechPayload) => {
  window.dispatchEvent(new CustomEvent<OracleSpeechPayload>(ORACLE_SPEECH_EVENT, { detail: payload }));
};

const cancelarSaida = () => {
  if (timerDeSaida === null) return;
  clearTimeout(timerDeSaida);
  timerDeSaida = null;
};

/** Chamado quando um toque ou clique comeca. */
export const maoEntrouNaTela = () => {
  maosNaTela += 1;
  cancelarSaida();
};

/** Chamado quando o gesto termina, de qualquer jeito. */
export const maoSaiuDaTela = () => {
  maosNaTela = Math.max(0, maosNaTela - 1);
  if (maosNaTela > 0 || !falaGuardada) return;

  cancelarSaida();
  timerDeSaida = setTimeout(() => {
    timerDeSaida = null;
    const pendente = falaGuardada;
    falaGuardada = null;
    if (pendente && maosNaTela === 0) despachar(pendente);
  }, RESPIRO_APOS_SOLTAR_MS);
};

/** Aberturas e reações pertencem ao momento, sem persistência ou rede. */
export const emitOracleSpeech = (payload: OracleSpeechPayload) => {
  if (typeof window === 'undefined' || !payload.message?.trim()) return;
  if (maosNaTela > 0) {
    falaGuardada = payload;
    return;
  }
  despachar(payload);
};
