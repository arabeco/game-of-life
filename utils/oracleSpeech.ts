export const ORACLE_SPEECH_EVENT = 'glyph:oracle-speech';
export const ORACLE_GESTURE_START_EVENT = 'glyph:oracle-gesture-start';

export type OracleSpeechKind = 'abertura' | 'reacao';

export type OracleSpeechPayload = {
  title?: string;
  message: string;
  /**
   * O tom decide a COR do detalhe da marca: o circulo no centro e a luz ao redor.
   * A casca continua dourada em todos — a cor informa sem tirar a identidade.
   * 'guide' faltava aqui, entao o azul era inalcancavel a partir de uma fala.
   */
  tone?: 'success' | 'achievement' | 'info' | 'warning' | 'danger' | 'neutral' | 'guide';
  durationMs?: number;
  /** Classifica a fala momentânea; nenhuma abertura ou reação entra no chat. */
  kind?: OracleSpeechKind;
  /** Botoes de navegacao que acompanham a fala, quando ela sugere um caminho. */
  quickActions?: Array<Record<string, unknown>>;
  /** Count a discovery only after the existing gesture/presence gates actually display it. */
  discovery?: { userId: string; candidate: import('./oracleEngineV2').Candidate; day: string };
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
let ultimoGesto = -Infinity;

/**
 * A fala volta logo depois de o usuario soltar a tela. Se ele emendar outra
 * acao, a reacao pendente e descartada: comentario de uma tarefa anterior nao
 * merece atrasar nem reaparecer por cima da proxima.
 */
const RESPIRO_APOS_SOLTAR_MS = 650;

const respiroDa = (_payload: OracleSpeechPayload) => RESPIRO_APOS_SOLTAR_MS;

const despachar = (payload: OracleSpeechPayload) => {
  window.dispatchEvent(new CustomEvent<OracleSpeechPayload>(ORACLE_SPEECH_EVENT, { detail: payload }));
};

const cancelarSaida = () => {
  if (timerDeSaida === null) return;
  clearTimeout(timerDeSaida);
  timerDeSaida = null;
};

/** Agenda a ultima fala depois do intervalo apropriado desde o ultimo gesto. */
const agendarFalaGuardada = () => {
  cancelarSaida();
  const pendente = falaGuardada;
  if (!pendente || maosNaTela > 0) return;
  const espera = Math.max(0, respiroDa(pendente) - (Date.now() - ultimoGesto));
  timerDeSaida = setTimeout(() => {
    timerDeSaida = null;
    const proxima = falaGuardada;
    falaGuardada = null;
    if (proxima && maosNaTela === 0) despachar(proxima);
  }, espera);
};

/** Chamado quando um toque ou clique comeca. */
export const maoEntrouNaTela = () => {
  if (maosNaTela === 0) {
    // A proxima acao e mais importante que um comentario que ainda nem chegou.
    // O evento abaixo tambem fecha imediatamente uma fala ja visivel.
    if (falaGuardada?.kind === 'reacao') falaGuardada = null;
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(ORACLE_GESTURE_START_EVENT));
  }
  maosNaTela += 1;
  cancelarSaida();
};

/** Chamado quando o gesto termina, de qualquer jeito. */
export const maoSaiuDaTela = () => {
  maosNaTela = Math.max(0, maosNaTela - 1);
  ultimoGesto = Date.now();
  if (maosNaTela > 0 || !falaGuardada) return;

  agendarFalaGuardada();
};

/** Aberturas e reações pertencem ao momento, sem persistência ou rede. */
export const emitOracleSpeech = (payload: OracleSpeechPayload) => {
  if (typeof window === 'undefined' || !payload.message?.trim()) return;
  if (maosNaTela > 0 || Date.now() - ultimoGesto < respiroDa(payload)) {
    // Discovery never replaces a reaction already waiting for the hand to leave.
    if (payload.discovery && falaGuardada?.kind === 'reacao') return;
    falaGuardada = payload;
    if (maosNaTela === 0) agendarFalaGuardada();
    return;
  }
  cancelarSaida();
  falaGuardada = null;
  despachar(payload);
};
