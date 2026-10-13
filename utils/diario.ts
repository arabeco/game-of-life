/**
 * AS ENTRADAS DO DIARIO (12/10/2026).
 *
 * A pagina continua sendo um texto so, e a entrada se le pelo cabecalho:
 *     12/10/2026 · Coragem · Ideia
 * data, humor (o nome da regua) e tag, nessa ordem; humor e tag sao opcionais.
 * Sem coluna nova: o texto e a fonte, e a cor e a tag saem dele (a mesma regra
 * de `humorDaEntrada`, em services/JournalService.ts).
 *
 * Entre uma entrada e outra, a linha de tracinhos (SEPARADOR_DE_ENTRADA).
 */
// Uma tag por tipo de coisa que se escreve, sem duas dizendo o mesmo (12/10/2026:
// Insight e Ideia se confundiam, e Desabafo nao agradou).
export const TAGS_DO_DIARIO = ['Ideia', 'Reflexão', 'Gratidão', 'Conquista', 'Lembrete'] as const;
export type TagDoDiario = (typeof TAGS_DO_DIARIO)[number];

const SEPARADOR = '--------------';
const CABECALHO = /^\s*(\d{2}\/\d{2}\/\d{4})(?:\s+·\s+(.+?))?\s*$/;

export interface EntradaDoDiario {
    data: string | null;
    humor: string | null;
    tag: TagDoDiario | null;
    texto: string;
}

export const cabecalhoDaEntrada = (data: string, humor: string | null, tag: TagDoDiario | null): string =>
    [data, humor, tag].filter(Boolean).join(' · ');

const tagDe = (parte: string): TagDoDiario | null =>
    TAGS_DO_DIARIO.find((tag) => tag.toLowerCase() === parte.trim().toLowerCase()) || null;

export function lerEntradas(conteudo: string): EntradaDoDiario[] {
    const blocos = String(conteudo || '')
        .replace(/\r\n/g, '\n')
        .split(new RegExp(`^\\s*${SEPARADOR}\\s*$`, 'm'));
    const entradas: EntradaDoDiario[] = [];
    for (const bloco of blocos) {
        const linhas = bloco.replace(/^\n+|\s+$/g, '').split('\n');
        if (!linhas.join('').trim()) continue;
        const achado = linhas[0].match(CABECALHO);
        if (!achado) {
            entradas.push({ data: null, humor: null, tag: null, texto: linhas.join('\n').trim() });
            continue;
        }
        let humor: string | null = null;
        let tag: TagDoDiario | null = null;
        for (const parte of (achado[2] || '').split('·').map((p) => p.trim()).filter(Boolean)) {
            const comoTag = tagDe(parte);
            if (comoTag) tag = comoTag;
            else if (!humor) humor = parte;
        }
        entradas.push({ data: achado[1], humor, tag, texto: linhas.slice(1).join('\n').trim() });
    }
    return entradas;
}

/** Os humores da pagina, na ordem — as bolinhas da lista de paginas. */
export const humoresDaPagina = (conteudo: string): string[] =>
    lerEntradas(conteudo).map((entrada) => entrada.humor).filter((humor): humor is string => Boolean(humor));

/**
 * O periodo da pagina: da primeira a ultima data escrita nela. Uma pagina pode
 * guardar um dia ou um ano, entao a lista mostra o intervalo, nao uma data so.
 *   um dia: "12/10/2026"; mesmo ano: "05/10 – 12/10/2026"; anos diferentes: as duas inteiras.
 */
export function periodoDaPagina(conteudo: string): string | null {
    const datas = lerEntradas(conteudo).map((entrada) => entrada.data).filter((data): data is string => Boolean(data));
    if (!datas.length) return null;
    const chave = (data: string) => data.split('/').reverse().join('');
    const ordenadas = [...datas].sort((a, b) => chave(a).localeCompare(chave(b)));
    const inicio = ordenadas[0];
    const fim = ordenadas[ordenadas.length - 1];
    if (inicio === fim) return inicio;
    if (inicio.slice(6) === fim.slice(6)) return `${inicio.slice(0, 5)} – ${fim}`;
    return `${inicio} – ${fim}`;
}
