export interface DailyComparison {
    date: string; cohortSize: number; actions: number; xp: number;
    actionsTopPercent: number; xpTopPercent: number | null;
    /** Quantas pessoas ficaram abaixo de voce. Ausente em bases sem a migracao de contagem. */
    actionsBelow?: number; xpBelow?: number | null;
    provisional: boolean; calculatedAt: string;
}

/**
 * PERCENTIL E FERRAMENTA DE COORTE GRANDE.
 *
 * A regra anterior dizia "Top N%" e so aparecia com N entre 1 e 10. Numa coorte
 * de 12, `ceil(n * 100 / 12)` so produz 9, 17, 25, 34... entao o segundo colocado
 * ja cai fora da faixa. Uma pessoa via a frase e as outras onze nao viam nada —
 * e o primeiro colocado de doze lia "Top 10%", que soa menor do que foi.
 *
 * A saida tentadora era encher a coorte com jogadores falsos ate os 100. Isso
 * nao adiciona gente, escolhe a REGUA: bot parado faz todo mundo real virar
 * "Top 1%" e o elogio perde valor; bot ativo faz ninguem alcancar o topo. E no
 * dia em que saem, o numero de todo mundo pula sem ninguem ter mudado nada.
 *
 * Contagem nao tem nenhum desses problemas. "Mais que 9 de 12" e exato, vale com
 * doze pessoas e com doze mil, aparece para quem de fato passou alguem, e nao
 * precisa de coorte inventada para significar algo.
 *
 * O percentil continua existindo para coorte grande, onde ele le melhor que um
 * numero de quatro digitos: "Top 4%" diz mais que "mais que 9.612 de 10.000".
 */
const COORTE_PARA_PERCENTIL = 100;

export function dailyComparisonLabel(value: DailyComparison | null, actions: number, xp: number): string | null {
    if (!value || !Number.isFinite(value.cohortSize) || value.cohortSize < 10) return null;
    // O comparativo e daquele dia exato: se a contagem local mudou desde a
    // resposta, o numero envelheceu e calar e melhor que afirmar errado.
    if (value.actions !== actions || value.xp !== xp) return null;

    const sufixo = value.provisional ? ' · parcial' : '';

    /**
     * Base grande: percentil, como antes, e so para quem chegou ao top 10%.
     * Aqui o arredondamento nao distorce — com 100 ou mais, 1% e uma pessoa.
     */
    if (value.cohortSize >= COORTE_PARA_PERCENTIL) {
        const porAcoes = value.actionsTopPercent <= 10;
        const pct = porAcoes ? value.actionsTopPercent : value.xpTopPercent;
        if (pct === null || !Number.isFinite(pct) || pct < 1 || pct > 10) return null;
        return `Top ${pct}% em ${porAcoes ? 'ações' : 'XP base'} entre jogadores ativos${sufixo}`;
    }

    /**
     * Base pequena: contagem. Mostra para quem passou ALGUEM — nao so para o
     * primeiro. Passar de tres pessoas num grupo de doze e um fato sobre o seu
     * dia, e esconder isso porque "nao deu top 10%" era a regra antiga.
     *
     * Sem `actionsBelow`, a base ainda nao tem a migracao de contagem: cala em
     * vez de tentar recuperar o numero de uma porcentagem arredondada.
     */
    const abaixoPorAcoes = value.actionsBelow;
    const abaixoPorXp = value.xpBelow;
    const usaAcoes = typeof abaixoPorAcoes === 'number' && abaixoPorAcoes > 0;
    const abaixo = usaAcoes ? abaixoPorAcoes : (typeof abaixoPorXp === 'number' ? abaixoPorXp : null);
    if (abaixo === null || abaixo <= 0) return null;

    const unidade = usaAcoes ? 'ações' : 'XP base';
    return `Mais ${unidade} que ${abaixo} de ${value.cohortSize} pessoas hoje${sufixo}`;
}
