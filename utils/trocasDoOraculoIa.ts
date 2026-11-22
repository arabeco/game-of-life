/** A parte pura do historico do chat com IA, sem rede (testavel no node). Ver historicoDoOraculoIa.ts. */

export const TROCAS_NO_HISTORICO = 20;

export interface TrocaComOraculo {
    pergunta: string;
    resposta: string;
    tom: string | null;
    criadaEm: Date;
}

export interface LinhaDaConversa {
    pergunta?: unknown;
    resposta?: unknown;
    tom?: unknown;
    criada_em?: unknown;
}

/** Converte as linhas do banco (da mais nova para a mais velha) em trocas em ordem de leitura. */
export const trocasDaConversa = (linhas: LinhaDaConversa[] | null | undefined): TrocaComOraculo[] =>
    (linhas || [])
        .map((linha) => ({
            pergunta: typeof linha.pergunta === 'string' ? linha.pergunta : '',
            resposta: typeof linha.resposta === 'string' ? linha.resposta : '',
            tom: typeof linha.tom === 'string' && linha.tom ? linha.tom : null,
            criadaEm: new Date(typeof linha.criada_em === 'string' ? linha.criada_em : NaN),
        }))
        .filter((troca) => troca.pergunta && troca.resposta && !Number.isNaN(troca.criadaEm.getTime()))
        .sort((a, b) => a.criadaEm.getTime() - b.criadaEm.getTime());
