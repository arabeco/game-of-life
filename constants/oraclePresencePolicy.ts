/**
 * O que o Oraculo fala em cada nivel de presenca — e o que e push.
 *
 * Estas regras estavam espalhadas por tres lugares que nao se conheciam: o
 * cliente decidia a fala de abertura, o cron da edge function decidia o card, e
 * `shouldPushOracleMessage` decidia o push. Cada um com o proprio numero magico,
 * e por isso ninguem lembrava o que cada nivel fazia.
 *
 * DUAS COISAS SEPARADAS, que antes viviam misturadas:
 *
 *  - PRESENCA decide O QUE ele fala. So isso.
 *  - O interruptor de avisos decide ONDE aquilo chega: ligado, vira aviso no
 *    aparelho; desligado, a mesma fala continua existindo e espera no Oraculo.
 *    Desligar aviso nunca cala o Oraculo, so tira ele do celular.
 *
 * Os valores gravados sao 0, 2 e 3 — sem o 1. A lacuna e historica e nao vale
 * uma migracao para fechar: quem usa le o rotulo, nao o numero. Os nomes abaixo
 * existem para o codigo nao ter de repetir o numero solto.
 */

export const ORACLE_PRESENCE = {
    /** So o obrigatorio. Ele responde quando chamado e nada mais. */
    SILENCIOSO: 0,
    /** Um card por dia e uma fala por dia. Nao comenta o que voce faz. */
    EQUILIBRADO: 2,
    /** Fala a cada abertura e reage ao que voce conclui. */
    PRESENTE: 3,
} as const;

export type OraclePresenceValue = typeof ORACLE_PRESENCE[keyof typeof ORACLE_PRESENCE];

export interface OraclePresenceRules {
    value: OraclePresenceValue;
    label: string;
    caption: string;
    /** Card de conteudo do dia. Continua exigindo Premium por cima disto. */
    dailyCard: boolean;
    /** Fala de abertura do painel: nunca, uma por dia, ou toda vez que abrir. */
    openingLine: 'nunca' | 'diaria' | 'sempre';
    /**
     * Quanto ele comenta na hora:
     *  - 'nenhuma': nao comenta nada.
     *  - 'marcos':  so o que e raro e grande — fechar arena, campanha ou marco.
     *  - 'todas':   inclui o cotidiano, como volume de acoes e avanco de meta.
     *
     * A separacao existe porque as reacoes nao pesam igual. Fechar uma arena
     * acontece de vez em quando e merece uma palavra; "voce fez 5 acoes hoje"
     * dispara quase todo dia e, repetido, vira papel de parede.
     */
    reactions: 'nenhuma' | 'marcos' | 'todas';
}

export const ORACLE_PRESENCE_RULES: Record<OraclePresenceValue, OraclePresenceRules> = {
    [ORACLE_PRESENCE.SILENCIOSO]: {
        value: ORACLE_PRESENCE.SILENCIOSO,
        label: 'Silencioso',
        caption: 'Só o essencial. Ele fala quando você chama, e a missão que você pedir segue normal.',
        dailyCard: false,
        openingLine: 'nunca',
        reactions: 'nenhuma',
    },
    [ORACLE_PRESENCE.EQUILIBRADO]: {
        value: ORACLE_PRESENCE.EQUILIBRADO,
        label: 'Equilibrado',
        caption: 'Um card e uma fala por dia, e ele celebra quando você fecha algo grande.',
        dailyCard: true,
        openingLine: 'diaria',
        reactions: 'marcos',
    },
    [ORACLE_PRESENCE.PRESENTE]: {
        value: ORACLE_PRESENCE.PRESENTE,
        label: 'Presente',
        caption: 'Fala toda vez que você abre e acompanha o seu dia de perto.',
        dailyCard: true,
        openingLine: 'sempre',
        reactions: 'todas',
    },
};

/** Nivel gravado pode vir de versao antiga; aproxima para o mais perto. */
export const normalizeOraclePresence = (value: unknown): OraclePresenceValue => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return ORACLE_PRESENCE.SILENCIOSO;
    return numeric >= ORACLE_PRESENCE.PRESENTE ? ORACLE_PRESENCE.PRESENTE : ORACLE_PRESENCE.EQUILIBRADO;
};

export const getOraclePresenceRules = (value: unknown): OraclePresenceRules =>
    ORACLE_PRESENCE_RULES[normalizeOraclePresence(value)];

/**
 * Reacoes raras e grandes: fechar uma arena, uma campanha ou um marco. Passam a
 * partir do Equilibrado. O resto — volume do dia, avanco de meta — e cotidiano e
 * so o Presente recebe.
 */
export type OracleReactionWeight = 'marco' | 'rotina';

export const allowsOracleReaction = (
    rules: OraclePresenceRules,
    weight: OracleReactionWeight,
): boolean => {
    if (rules.reactions === 'nenhuma') return false;
    if (rules.reactions === 'todas') return true;
    return weight === 'marco';
};

/** Ordem de exibicao do seletor. */
export const ORACLE_PRESENCE_ORDER: OraclePresenceValue[] = [
    ORACLE_PRESENCE.SILENCIOSO,
    ORACLE_PRESENCE.EQUILIBRADO,
    ORACLE_PRESENCE.PRESENTE,
];
