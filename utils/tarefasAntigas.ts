/**
 * AS TAREFAS ANTIGAS, GUARDADAS NO CELULAR (26/11/2026) — egress de abertura.
 *
 * O laudo de 26/11 mediu cada abertura em ~495 KB, crescendo toda semana. Na
 * conta do Afonso, 247 KB eram as tarefas dos ultimos 3 meses (709 linhas),
 * baixadas inteiras toda vez, embora o passado quase nunca mude.
 *
 * Os 3 meses continuam no app — campanhas "da vida toda", pactos, missoes da
 * temporada e o comparador de ciclos contam essas tarefas. O que muda e de onde
 * vem a parte antiga (mais de 14 dias atras): o celular guarda uma copia por
 * dia, e a abertura pede so a impressao digital de cada dia (migracao
 * 20261126120000). Baixa de novo apenas o dia novo, mudado ou que sumiu.
 * Os ultimos 14 dias e o futuro descem sempre, inteiros, como antes.
 *
 * O app recebe as MESMAS linhas que a consulta antiga devolvia. Qualquer falha
 * (migracao nao rodada, rede, copia ilegivel, dia que nao fecha) cai na consulta
 * antiga, inteira. Pior caso: baixa o que baixava antes.
 */
import { copiaGuardada } from './ciclosFechados.ts';

type Resultado = { data: any[] | null; error: any };
type Guardados = Record<string, { hash: string; rows: any[] }>;

export interface CopiaDasTarefas {
    ler: (userId: string) => Promise<Guardados | null>;
    gravar: (userId: string, guardados: Guardados) => Promise<void>;
}

export interface FontesDasTarefas {
    /** Do corte em diante, inteiro, como antes (ja com o user_id). */
    recentes: () => PromiseLike<Resultado>;
    /** `impressoes_das_tarefas(de, corte)`: `{ dia, impressao }` de cada dia antigo com tarefa. */
    impressoes: () => PromiseLike<Resultado>;
    /** As colunas enxutas so destes dias, do de ao corte. */
    dias: (dias: string[]) => PromiseLike<Resultado>;
    /** A consulta antiga, inteira. */
    tudo: () => PromiseLike<Resultado>;
}

/** Dias por pedido: a API corta em 1000 linhas, e um dia cortado viraria copia errada. */
export const DIAS_POR_PEDIDO = 15;
const TETO_DA_API = 1000;

/** Quantos dias para tras descem sempre; o que e mais velho vem da copia. */
export const DIAS_SEMPRE_FRESCOS = 14;

export const carregarTarefasDaAbertura = async (
    userId: string,
    fontes: FontesDasTarefas,
    copia: CopiaDasTarefas = copiaDasTarefas,
): Promise<Resultado> => {
    const pelaCopia = await carregarPelaCopia(userId, fontes, copia).catch(() => null);
    return pelaCopia ?? await fontes.tudo();
};

const dentroDoDia = (dia: string, linhas: unknown): linhas is any[] => (
    Array.isArray(linhas)
    && linhas.length > 0
    && linhas.every((linha) => linha && typeof linha === 'object' && linha.date === dia && linha.id != null)
);

/** null = nao deu para montar pela copia; quem responde e a consulta antiga. */
const carregarPelaCopia = async (
    userId: string,
    fontes: FontesDasTarefas,
    copia: CopiaDasTarefas,
): Promise<Resultado | null> => {
    const [recentes, impressoes, guardados] = await Promise.all([
        fontes.recentes(),
        fontes.impressoes(),
        copia.ler(userId).catch(() => null),
    ]);
    if (!recentes || recentes.error || !Array.isArray(recentes.data)) return null;
    if (!impressoes || impressoes.error || !Array.isArray(impressoes.data)) return null;

    const lista = impressoes.data.map((linha: any) => ({ dia: linha?.dia, hash: linha?.impressao }));
    if (lista.some((item) => typeof item.dia !== 'string' || !item.dia || typeof item.hash !== 'string' || !item.hash)) return null;

    const copiaValida: Guardados = guardados && typeof guardados === 'object' ? guardados : {};
    const serve = (dia: string, hash: string) => copiaValida[dia]?.hash === hash && dentroDoDia(dia, copiaValida[dia]?.rows);
    const faltam = lista.filter((item) => !serve(item.dia, item.hash)).map((item) => item.dia);

    const baixadas = new Map<string, any[]>();
    for (let i = 0; i < faltam.length; i += DIAS_POR_PEDIDO) {
        const resposta = await fontes.dias(faltam.slice(i, i + DIAS_POR_PEDIDO));
        if (!resposta || resposta.error || !Array.isArray(resposta.data)) return null;
        if (resposta.data.length >= TETO_DA_API) return null;
        for (const linha of resposta.data) {
            const dia = linha?.date;
            if (typeof dia !== 'string') return null;
            const doDia = baixadas.get(dia) ?? [];
            doDia.push({ ...linha, user_id: userId });
            baixadas.set(dia, doDia);
        }
    }

    const proxima: Guardados = {};
    const antigas: any[] = [];
    for (const item of lista) {
        const linhas = baixadas.get(item.dia) ?? (serve(item.dia, item.hash) ? copiaValida[item.dia].rows : undefined);
        // O dia tinha tarefa na impressao e nao veio nenhuma: a lista nao fecha.
        if (!dentroDoDia(item.dia, linhas)) return null;
        proxima[item.dia] = { hash: item.hash, rows: linhas };
        antigas.push(...linhas);
    }

    // Gravar nao segura a abertura, e falhar so custa baixar de novo na proxima.
    void Promise.resolve().then(() => copia.gravar(userId, proxima)).catch(() => {});

    return { data: [...antigas, ...recentes.data], error: null };
};

export const copiaDasTarefas: CopiaDasTarefas = copiaGuardada<Guardados>((userId) => `tarefas-v1:${userId}`);
