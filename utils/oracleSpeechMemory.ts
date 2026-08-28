/**
 * O que o Oraculo ja disse — e por isso o que ele nao vai repetir.
 *
 * Ate aqui cada fala nascia so do estado de AGORA. Ele nunca soube que tinha
 * dito a mesma coisa ontem, nem que era o terceiro dia seguido no mesmo estado.
 * Sem memoria nao existe amizade: um cartaz tambem sabe descrever o seu estado,
 * e o que separa os dois e reconhecer percurso.
 *
 * O efeito pratico e mais bobo e mais importante do que parece. Quem esta em
 * `prioridade` fica em `prioridade` por semanas — a cascata antiga escolhia o
 * mesmo estado todo dia, com duas variacoes, e em uma semana a pessoa via as
 * duas tres vezes cada. Nesse ponto ela para de ler.
 *
 * DUAS REGRAS, e elas sao diferentes:
 *
 *   COOLDOWN     por quantos dias aquele ASSUNTO fica de fora depois de dito.
 *                Mora na tabela de pesos, junto do resto, porque e uma
 *                propriedade do tipo — queixa cansa, risco nao.
 *
 *   NAO REPETIR  a mesma FRASE nunca sai duas vezes seguidas para o mesmo
 *                assunto, mesmo quando o assunto volta legitimamente.
 *
 * Tudo aqui e funcao pura sobre uma lista. O localStorage aparece so nas duas
 * pontas, e falha em silencio de proposito: sem memoria o Oraculo volta a ser o
 * que era, que e pior mas nao e quebrado.
 */

export const ORACLE_SPEECH_MEMORY_KEY = 'glyph:oracle-speech-memory';

/**
 * Oito entradas. O suficiente para "terceiro dia seguido" e para um cooldown de
 * tres dias caberem, e pouco o bastante para nao virar arquivo — isto e memoria
 * curta de proposito, nao historico. O historico e o chat.
 */
export const ORACLE_SPEECH_MEMORY_SIZE = 8;

export interface OracleSpeechMemoryEntry {
  /** O tipo de candidato que falou. */
  type: string;
  /** Presente quando a fala era sobre uma arena especifica. */
  arenaId?: string;
  /** Data operacional, nao do calendario. */
  date: string;
  /** A frase exata, para nao sair identica na proxima vez. */
  line: string;
}

export interface OracleSpeechRecall {
  /** Ja falou disto hoje. */
  spokenToday: boolean;
  /** Dias desde a ultima vez que este assunto apareceu. null = nunca. */
  daysSinceLastSaid: number | null;
  /** Dias seguidos, ate ontem, em que este assunto foi o escolhido. */
  consecutiveDays: number;
  /** A ultima frase dita sobre este assunto, para nao repetir. */
  lastLine: string | null;
}

const diffDays = (from: string, to: string): number | null => {
  const inicio = Date.parse(`${from}T00:00:00Z`);
  const fim = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(inicio) || !Number.isFinite(fim)) return null;
  return Math.round((fim - inicio) / 86400000);
};

const mesmoAssunto = (
  entry: OracleSpeechMemoryEntry,
  type: string,
  arenaId?: string,
): boolean => entry.type === type && (entry.arenaId || undefined) === (arenaId || undefined);

/**
 * O que a memoria sabe sobre um assunto.
 *
 * `consecutiveDays` conta para tras a partir de ONTEM, nao de hoje: hoje ainda
 * nao foi decidido, e e justamente a decisao que vai consultar este numero.
 */
export const recallOracleSpeech = (
  entries: OracleSpeechMemoryEntry[],
  type: string,
  arenaId: string | undefined,
  today: string,
): OracleSpeechRecall => {
  const doAssunto = entries
    .filter((entry) => mesmoAssunto(entry, type, arenaId))
    .sort((esquerda, direita) => (esquerda.date < direita.date ? 1 : -1));

  if (doAssunto.length === 0) {
    return { spokenToday: false, daysSinceLastSaid: null, consecutiveDays: 0, lastLine: null };
  }

  const maisRecente = doAssunto[0];
  const spokenToday = maisRecente.date === today;
  const daysSinceLastSaid = diffDays(maisRecente.date, today);

  const datas = Array.from(new Set(doAssunto.map((entry) => entry.date))).sort().reverse();
  let consecutiveDays = 0;
  for (let passo = 1; passo <= ORACLE_SPEECH_MEMORY_SIZE; passo += 1) {
    const esperada = datas.find((data) => diffDays(data, today) === passo);
    if (!esperada) break;
    consecutiveDays += 1;
  }

  return { spokenToday, daysSinceLastSaid, consecutiveDays, lastLine: maisRecente.line };
};

/**
 * O assunto esta de molho?
 *
 * Duas coisas separadas na mesma pergunta: falar duas vezes do mesmo no MESMO
 * dia nunca faz sentido, entao isso vale para todo tipo. Ja o intervalo entre
 * dias e propriedade do tipo, e vem de fora.
 */
export const isOracleSubjectOnCooldown = (
  entries: OracleSpeechMemoryEntry[],
  type: string,
  arenaId: string | undefined,
  today: string,
  cooldownDays: number,
): boolean => {
  const recall = recallOracleSpeech(entries, type, arenaId, today);
  if (recall.spokenToday) return true;
  if (cooldownDays <= 0) return false;
  if (recall.daysSinceLastSaid === null) return false;
  return recall.daysSinceLastSaid <= cooldownDays;
};

/** Adiciona ao topo e corta o excesso. Nao muda a lista original. */
export const rememberOracleSpeech = (
  entries: OracleSpeechMemoryEntry[],
  entry: OracleSpeechMemoryEntry,
): OracleSpeechMemoryEntry[] => [entry, ...entries].slice(0, ORACLE_SPEECH_MEMORY_SIZE);

// --- as duas pontas ---------------------------------------------------------
// Falham em silencio de proposito: navegador com storage bloqueado, aba
// anonima, cota estourada. Sem memoria o Oraculo volta a ser o que era — pior,
// mas nao quebrado, e nunca uma tela branca.

export const readOracleSpeechMemory = (): OracleSpeechMemoryEntry[] => {
  try {
    const bruto = localStorage.getItem(ORACLE_SPEECH_MEMORY_KEY);
    if (!bruto) return [];
    const analisado = JSON.parse(bruto);
    if (!Array.isArray(analisado)) return [];
    return analisado
      .filter((entry): entry is OracleSpeechMemoryEntry => (
        Boolean(entry)
        && typeof entry.type === 'string'
        && typeof entry.date === 'string'
        && typeof entry.line === 'string'
      ))
      .slice(0, ORACLE_SPEECH_MEMORY_SIZE);
  } catch {
    return [];
  }
};

export const writeOracleSpeechMemory = (entries: OracleSpeechMemoryEntry[]): void => {
  try {
    localStorage.setItem(ORACLE_SPEECH_MEMORY_KEY, JSON.stringify(entries.slice(0, ORACLE_SPEECH_MEMORY_SIZE)));
  } catch {
    /* sem memoria, o Oraculo apenas volta a repetir. Nao vale derrubar nada por isso. */
  }
};
