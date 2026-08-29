import type { OracleDecision } from './oracleCoach.ts';

/**
 * O diario de decisoes do Oraculo. Ferramenta de teste, nao funcionalidade.
 *
 * O proximo ganho do Oraculo nao vem de criar o candidato numero quinze. Vem de
 * descobrir QUANDO ELE DEVERIA TER FICADO QUIETO — e isso so aparece observando
 * gente usando, nunca raciocinando aqui dentro.
 *
 * Sem este registro, quando uma fala parecer idiota o relato possivel e "ficou
 * estranho", e a resposta possivel e um chute. Com ele:
 *
 *     meta_inflada 18.3 · arena_retomada 14.6 · prioridade 11.7 → meta_inflada
 *
 * Ai da para discutir peso.
 *
 * Guarda tambem quem PERDEU e por que. Um candidato barrado pela presenca e um
 * barrado por cooldown produzem o mesmo silencio na tela e pedem consertos
 * opostos: um e limiar, o outro e frequencia.
 *
 * Nada disto aparece para quem usa o app, e nada sai do aparelho.
 */

export const ORACLE_DECISION_LOG_KEY = 'glyph:oracle-decision-log';

/** Vinte decisoes cobrem alguns dias de uso e cabem num texto colavel. */
export const ORACLE_DECISION_LOG_SIZE = 20;

export interface OracleDecisionLogEntry {
    at: string;
    presence: number;
    threshold: number;
    tone: string;
    /** Vazio quando ninguem mereceu falar — que e uma decisao, nao uma falha. */
    chosen: string | null;
    line: string | null;
    rows: Array<{ type: string; arenaId?: string; score: number; outcome: string }>;
}

export const readOracleDecisionLog = (): OracleDecisionLogEntry[] => {
    try {
        const bruto = localStorage.getItem(ORACLE_DECISION_LOG_KEY);
        if (!bruto) return [];
        const analisado = JSON.parse(bruto);
        return Array.isArray(analisado) ? analisado.slice(0, ORACLE_DECISION_LOG_SIZE) : [];
    } catch {
        return [];
    }
};

export const recordOracleDecision = (decision: OracleDecision): void => {
    try {
        const entrada: OracleDecisionLogEntry = {
            at: new Date().toISOString(),
            presence: decision.presenceValue,
            threshold: Number.isFinite(decision.threshold) ? decision.threshold : -1,
            tone: decision.tone,
            chosen: decision.chosen?.entry.type || null,
            line: decision.chosen?.line || null,
            rows: decision.rows,
        };
        const anterior = readOracleDecisionLog();
        localStorage.setItem(
            ORACLE_DECISION_LOG_KEY,
            JSON.stringify([entrada, ...anterior].slice(0, ORACLE_DECISION_LOG_SIZE)),
        );
    } catch {
        /* diagnostico nunca pode derrubar a fala que ele existe para explicar. */
    }
};

/**
 * O log em texto, para colar numa conversa.
 *
 * O teste acontece no celular, onde nao ha console. Um log que so existe em
 * DevTools nao seria lido por ninguem — e um diagnostico que ninguem le nao
 * diagnostica nada.
 */
export const formatOracleDecisionLog = (entries: OracleDecisionLogEntry[]): string => {
    if (entries.length === 0) return 'Sem decisoes registradas ainda.';

    return entries.map((entrada) => {
        const quando = entrada.at.slice(0, 16).replace('T', ' ');
        const cabecalho = `${quando} · presenca ${entrada.presence} · corte ${entrada.threshold} · tom ${entrada.tone}`;
        const linhas = entrada.rows
            .map((row) => `   ${row.score.toFixed(1).padStart(5)} ${row.type}${row.arenaId ? ` (${row.arenaId.slice(0, 6)})` : ''} — ${row.outcome}`)
            .join('\n');
        const fecho = entrada.chosen
            ? `   => ${entrada.chosen}: "${entrada.line}"`
            : '   => silencio';
        return [cabecalho, linhas, fecho].filter(Boolean).join('\n');
    }).join('\n\n');
};
