import type { OracleSpeechEvent, OracleSpeechTone } from '../constants/oracleSpeechLibrary.ts';
import { pickOracleSpeech } from '../constants/oracleSpeechLibrary.ts';

/**
 * As reacoes tambem lembram, e tambem sabem o que a coisa significou.
 *
 * Toda a inteligencia construida — arbitro, trend, memoria, cooldown — vivia so
 * na fala de ABERTURA. A reacao, que dispara muito mais vezes por dia, continuou
 * sendo `variants[Math.floor(Math.random() * variants.length)]`: sorteio puro
 * sobre tres linhas por evento e por tom.
 *
 * Duas consequencias, e a segunda e a grave.
 *
 * A PRIMEIRA e repeticao: com tres linhas e sorteio sem memoria, fechar duas
 * arenas seguidas devolve a mesma frase uma vez em cada tres.
 *
 * A SEGUNDA e que a reacao nao sabia o que tinha acabado de acontecer de
 * verdade. Fechar uma acao e banal; fechar a PRIMEIRA depois de oito dias
 * parados e outra coisa completamente, e as duas recebiam a mesma frase. Estado
 * o app inteiro sabe descrever — o que ele nao sabia era notar quando o
 * significado do estado mudou.
 *
 * O arbitro NAO pertence aqui, e isso e de proposito. Na abertura ha uma escolha
 * a fazer: varios assuntos competem. Na reacao nao ha — voce fechou uma arena, o
 * assunto e essa arena. O que faltava nao era decisao, era contexto e memoria.
 */

const REACTION_MEMORY_KEY = 'glyph:oracle-reaction-memory';

/** Uma ultima frase por evento. Nao precisa de historico: so do que veio antes. */
export type OracleReactionMemory = Record<string, string>;

export const readOracleReactionMemory = (): OracleReactionMemory => {
    try {
        const bruto = localStorage.getItem(REACTION_MEMORY_KEY);
        if (!bruto) return {};
        const analisado = JSON.parse(bruto);
        return analisado && typeof analisado === 'object' && !Array.isArray(analisado) ? analisado : {};
    } catch {
        return {};
    }
};

export const writeOracleReactionMemory = (memory: OracleReactionMemory): void => {
    try {
        localStorage.setItem(REACTION_MEMORY_KEY, JSON.stringify(memory));
    } catch {
        /* sem memoria a reacao volta a poder repetir. Nao vale derrubar nada por isso. */
    }
};

/**
 * Sorteia evitando a ultima frase daquele evento, e grava a escolhida.
 *
 * Quando so ha uma variante valida, repetir e melhor que calar: reacao existe
 * para responder a uma acao que a pessoa acabou de fazer, e silencio ali seria
 * lido como bug, nao como discricao.
 */
export const pickOracleReaction = (
    event: OracleSpeechEvent,
    tone: OracleSpeechTone,
    vars: Record<string, string | number> = {},
    memory: OracleReactionMemory = {},
): { message: string; memory: OracleReactionMemory } => {
    const anterior = memory[event];

    let escolhida = pickOracleSpeech(event, tone, vars);
    // Tres tentativas bastam: com tres variantes a chance de cair na mesma tres
    // vezes seguidas e uma em vinte e sete, e o custo de tentar e um sorteio.
    for (let tentativa = 0; tentativa < 3 && escolhida && escolhida === anterior; tentativa += 1) {
        escolhida = pickOracleSpeech(event, tone, vars);
    }

    return {
        message: escolhida,
        memory: escolhida ? { ...memory, [event]: escolhida } : memory,
    };
};

const diffDias = (de: string, para: string): number | null => {
    const inicio = Date.parse(`${de}T00:00:00Z`);
    const fim = Date.parse(`${para}T00:00:00Z`);
    if (!Number.isFinite(inicio) || !Number.isFinite(fim)) return null;
    return Math.round((fim - inicio) / 86400000);
};

export interface OracleReactionSignificance {
    /** Data operacional da entrega anterior. null = primeira da vida. */
    previousProofDate: string | null;
    /** Data operacional desta entrega. */
    proofDate: string;
    /** Hora local no momento da entrega. */
    hourOfDay: number | null;
    /** Sequencia depois desta entrega. */
    streakAfter: number;
}

/**
 * O evento que a entrega de hoje realmente foi.
 *
 * Devolve null quando foi um dia comum — e a maioria e. Estes dois so existem
 * porque sao raros: se disparassem sempre, deixariam de significar coisa alguma
 * e roubariam a vez das reacoes de rotina, que continuam certas para o dia comum.
 *
 * A ordem importa. Quem volta depois de uma pausa longa E fecha tarde recebe a
 * frase da VOLTA: ter voltado e a noticia maior, e a hora e detalhe dela.
 */
export const PAUSA_MINIMA_PARA_VOLTA = 4;
export const HORA_DE_SALVAMENTO = 18;
export const STREAK_MINIMO_PARA_SALVAMENTO = 3;

export const resolveReactionSignificance = (
    contexto: OracleReactionSignificance,
): { event: OracleSpeechEvent; vars: Record<string, string | number> } | null => {
    const { previousProofDate, proofDate, hourOfDay, streakAfter } = contexto;

    const pausa = previousProofDate ? diffDias(previousProofDate, proofDate) : null;
    if (pausa !== null && pausa >= PAUSA_MINIMA_PARA_VOLTA) {
        return { event: 'first_after_pause', vars: { dias: pausa } };
    }

    if (
        hourOfDay !== null
        && streakAfter >= STREAK_MINIMO_PARA_SALVAMENTO
        && (hourOfDay >= HORA_DE_SALVAMENTO || hourOfDay < 4)
    ) {
        return { event: 'streak_saved', vars: { streak: streakAfter } };
    }

    return null;
};
