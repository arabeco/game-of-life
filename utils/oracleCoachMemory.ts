import { getOperationalDateString } from './operationalDay.js';
import { oracleCoachFamily, type OracleCoachMemory } from './oracleCoach';

/**
 * O QUE A LEITURA JA DISSE, e quando.
 *
 * "Ler meu dia" e local, gratuita e NAO fica gravada no banco — de proposito.
 * Entao a memoria do que ela ja disse mora no mesmo lugar que ela: no aparelho.
 * Guardar isso no servidor seria criar escrita e leitura de rede para uma tela
 * que existe justamente por nao ter nenhuma das duas.
 *
 * A consequencia — trocar de aparelho comeca a fila do zero — e aceitavel e ate
 * correta: o descanso existe para nao repetir o que VOCE acabou de ler, e num
 * aparelho novo voce nao leu nada.
 *
 * Guarda FAMILIA -> data operacional. A familia e o assunto (\`coach:behind\`), nao
 * o id completo, que carrega o dia do ciclo e mudaria sozinho todo dia.
 */
const PREFIXO = 'glyph_coach_memoria_';

/** Uma entrada por familia, e sao catorze no total. O teto e folga, nao aperto. */
const MAXIMO_DE_FAMILIAS = 40;

/** Depois disso a entrada nao segura mais nada: o maior descanso e de tres dias. */
const DIAS_ATE_ESQUECER = 30;

const chave = (userId: string) => `${PREFIXO}${userId || 'anonimo'}`;

const diasEntre = (de: string, ate: string): number => {
    const inicio = Date.parse(`${de}T12:00:00`);
    const fim = Date.parse(`${ate}T12:00:00`);
    if (!Number.isFinite(inicio) || !Number.isFinite(fim)) return Number.POSITIVE_INFINITY;
    return Math.round((fim - inicio) / 86400000);
};

/**
 * Toda leitura e escrita e envolvida em try/catch porque localStorage LANCA em
 * janela anonima e com dados de site bloqueados — e uma leitura do Oraculo nao
 * pode falhar por causa da memoria dela. Sem memoria, o comportamento volta a
 * ser o antigo: o de maior peso sempre vence.
 */
export const lerMemoriaDoCoach = (userId: string): { hoje: string; vistos: OracleCoachMemory } => {
    const hoje = getOperationalDateString();

    try {
        const bruto = localStorage.getItem(chave(userId));
        if (!bruto) return { hoje, vistos: {} };

        const salvo = JSON.parse(bruto);
        if (!salvo || typeof salvo !== 'object' || Array.isArray(salvo)) return { hoje, vistos: {} };

        const vistos: OracleCoachMemory = {};
        Object.entries(salvo).forEach(([familia, data]) => {
            if (typeof data !== 'string') return;
            if (diasEntre(data, hoje) > DIAS_ATE_ESQUECER) return;
            vistos[familia] = data;
        });

        return { hoje, vistos };
    } catch {
        return { hoje, vistos: {} };
    }
};

/** Registra que este assunto foi lido hoje. Recebe o id inteiro e guarda a familia. */
export const registrarLeituraDoCoach = (userId: string, briefId: string): void => {
    if (!briefId) return;

    try {
        const { hoje, vistos } = lerMemoriaDoCoach(userId);
        const proximo: OracleCoachMemory = { ...vistos, [oracleCoachFamily(briefId)]: hoje };

        // Poda pelo mais antigo. Sem isto, uma familia que sai do codigo ficaria
        // no armazenamento de todo mundo para sempre.
        const entradas = Object.entries(proximo).sort((a, b) => (a[1] < b[1] ? 1 : -1));
        const podado = Object.fromEntries(entradas.slice(0, MAXIMO_DE_FAMILIAS));

        localStorage.setItem(chave(userId), JSON.stringify(podado));
    } catch {
        // Sem memoria a leitura continua funcionando, so para de variar.
    }
};
