/**
 * O QUAO CHIQUE O NUMERO DO MEIO FICA, POR FAIXA DE INDICE.
 *
 * O numero sozinho nao marcava passagem: 46 e 54 tinham exatamente a mesma cara,
 * entao subir de nivel acontecia sem nada acontecer na tela. O que muda nao e o
 * numero — e a MOLDURA dele. Em 25, 50, 75, 90 e 100 a bolinha de tras troca de
 * metal e ganha acabamento, e a passagem vira um evento visivel.
 *
 * O NUMERO NUNCA APAGA. Em todas as faixas ele usa o tom mais claro do metal,
 * que e o stop `pale` das paletas. Quem esta em 8 precisa ler o 8 tao bem quanto
 * quem esta em 96 le o 96 — escurecer o comeco da escada seria punir a chegada.
 *
 * Os metais sao os do app, vindos de PLATE_FINISHES em MetalReportCard. Nao ha
 * paleta nova aqui: a placa de ciclo e a peca que atravessou o app inteiro sendo
 * legivel, entao ela e a referencia. O que a faixa escolhe e QUAL metal, nunca
 * uma cor inventada.
 */

export type MasteryBadgeTier = {
    /** Letra do acabamento em PLATE_FINISHES. */
    readonly finish: string;
    /** Largura da borda da bolinha. */
    readonly borda: number;
    /** Existe um segundo anel por fora? A partir dos 50. */
    readonly anelDuplo: boolean;
    /** Forca do brilho em volta, 0 a 1. */
    readonly brilho: number;
    /** So os 100. Ganha tratamento proprio em masteryBadge.css. */
    readonly coroado: boolean;
};

/**
 * OS CORTES: 25, 50, 75, 90 — e o 100 a parte.
 *
 * Nao sao quartos exatos de proposito. O pulo de 90 existe porque a ultima
 * decima parte da escada e onde quase ninguem chega, e dar a ela a mesma cara
 * dos 75 desperdicaria o unico lugar onde a moldura pode dizer "isto e raro".
 *
 * As larguras sao INTEIRAS: 1, 2 e 3.
 *
 * A primeira versao usava 1 / 1.5 / 2 / 2.5, e no aparelho 1 e 1.5 caiam no
 * mesmo pixel — duas faixas com a mesma cara, que e justamente o que esta
 * escada existe pra evitar. Meio pixel de borda nao e meia borda; e um
 * arredondamento esperando acontecer.
 *
 * A separacao entre faixas vem de TRES mecanismos empilhados, nao de um so:
 * a cor do metal muda nas seis, o anel externo entra nos 50, e a largura sobe
 * em 50 e em 90. Nos 100 vem a coroa. Assim duas faixas vizinhas nunca
 * dependem de um unico detalhe para se distinguir.
 */
const FAIXAS: readonly { readonly minimo: number; readonly tier: MasteryBadgeTier }[] = [
    { minimo: 100, tier: { finish: 'SSS', borda: 3, anelDuplo: true, brilho: 1, coroado: true } },
    { minimo: 90, tier: { finish: 'S', borda: 3, anelDuplo: true, brilho: 0.8, coroado: false } },
    { minimo: 75, tier: { finish: 'A', borda: 2, anelDuplo: true, brilho: 0.55, coroado: false } },
    { minimo: 50, tier: { finish: 'B', borda: 2, anelDuplo: true, brilho: 0.34, coroado: false } },
    { minimo: 25, tier: { finish: 'C', borda: 1, anelDuplo: false, brilho: 0.2, coroado: false } },
    { minimo: 0, tier: { finish: 'E', borda: 1, anelDuplo: false, brilho: 0, coroado: false } },
];

export const getMasteryBadgeTier = (indice: number): MasteryBadgeTier => {
    const valor = Math.max(0, Math.min(100, Math.round(Number(indice) || 0)));
    // De cima para baixo: a primeira faixa cujo minimo o valor alcanca.
    return (FAIXAS.find((faixa) => valor >= faixa.minimo) || FAIXAS[FAIXAS.length - 1]).tier;
};

/**
 * Os cortes, para quem precisa explicar a escada sem reabrir este arquivo.
 *
 * Vale saber onde eles caem DE VERDADE: o nivel e sempre par, porque e o dobro
 * de um inteiro. Entao 25 e 75 nunca existem como valor, e a troca acontece no
 * primeiro par acima — 26 e 76. A comparacao e `>=`, entao nada e perdido; so
 * nao adianta procurar um 25 na tela.
 */
export const MASTERY_BADGE_CUTS = [25, 50, 75, 90, 100] as const;
