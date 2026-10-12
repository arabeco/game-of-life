/**
 * OS CICLOS FECHADOS, GUARDADOS NO CELULAR (12/10/2026) — passo 1 do egress de abertura.
 *
 * Os relatorios dos ciclos fechados eram 40% do que o app baixava ao abrir (131
 * de 325 KB na conta do Afonso), quase tudo no atlas semanal, e cresciam a cada
 * ciclo fechado. Relatorio fechado quase nunca muda, entao o celular guarda uma
 * copia, e a abertura pede so a impressao digital de cada um (`report_hash`,
 * migracao 20261012170000). Baixa de novo apenas o que e novo ou mudou.
 *
 * O app recebe as MESMAS linhas, na mesma ordem, que a consulta antiga devolvia
 * — o atlas inteiro inclusive. Nao da para baixar o relatorio sem o atlas: ele
 * diz quais tarefas pertencem a ciclo fechado, e o recalculo da nota regrava o
 * relatorio inteiro, apagando o que nao tivesse vindo.
 *
 * Qualquer falha (migracao nao rodada, rede, copia ilegivel) cai na consulta
 * antiga, inteira. Pior caso: baixa o que baixava antes.
 */

type Resultado = { data: any[] | null; error: any };
type Guardados = Record<string, { hash: string; row: any }>;

export interface CopiaDosRelatorios {
    ler: (userId: string) => Promise<Guardados | null>;
    gravar: (userId: string, guardados: Guardados) => Promise<void>;
}

export interface FontesDosCiclosFechados {
    /** `id, report_hash`, com os mesmos filtros, ordem e limite da consulta antiga. */
    impressoes: () => PromiseLike<Resultado>;
    /** `select *` so destes ids. */
    linhas: (ids: string[]) => PromiseLike<Resultado>;
    /** A consulta antiga, inteira. */
    tudo: () => PromiseLike<Resultado>;
}

const linhaGuardadaServe = (id: string, hash: string, guardado: Guardados[string] | undefined) => (
    Boolean(guardado)
    && guardado!.hash === hash
    && guardado!.row !== null
    && typeof guardado!.row === 'object'
    && String(guardado!.row.id) === id
    && guardado!.row.report_data != null
);

export const carregarCiclosFechados = async (
    userId: string,
    fontes: FontesDosCiclosFechados,
    copia: CopiaDosRelatorios = copiaNoCelular,
): Promise<Resultado> => {
    const pelaCopia = await carregarPelaCopia(userId, fontes, copia).catch(() => null);
    return pelaCopia ?? await fontes.tudo();
};

/** null = nao deu para montar pela copia; quem responde e a consulta antiga. */
const carregarPelaCopia = async (
    userId: string,
    fontes: FontesDosCiclosFechados,
    copia: CopiaDosRelatorios,
): Promise<Resultado | null> => {
    const [impressoes, guardados] = await Promise.all([
        fontes.impressoes(),
        copia.ler(userId).catch(() => null),
    ]);
    if (impressoes.error || !Array.isArray(impressoes.data)) return null;

    const lista = impressoes.data.map((linha: any) => ({ id: String(linha?.id || ''), hash: linha?.report_hash }));
    if (lista.some((item) => !item.id || typeof item.hash !== 'string' || !item.hash)) return null;

    const copiaValida: Guardados = guardados && typeof guardados === 'object' ? guardados : {};
    const faltam = lista
        .filter((item) => !linhaGuardadaServe(item.id, item.hash, copiaValida[item.id]))
        .map((item) => item.id);

    const baixadas = new Map<string, any>();
    if (faltam.length > 0) {
        const resposta = await fontes.linhas(faltam);
        if (resposta.error || !Array.isArray(resposta.data)) return null;
        resposta.data.forEach((linha: any) => baixadas.set(String(linha?.id || ''), linha));
    }

    const linhas: any[] = [];
    for (const item of lista) {
        const linha = baixadas.get(item.id) ?? (linhaGuardadaServe(item.id, item.hash, copiaValida[item.id]) ? copiaValida[item.id].row : undefined);
        // Sumiu entre uma consulta e outra: a lista nao fecha.
        if (!linha) return null;
        linhas.push(linha);
    }

    const proxima: Guardados = {};
    lista.forEach((item, indice) => {
        if (linhas[indice]?.report_data != null) proxima[item.id] = { hash: item.hash, row: linhas[indice] };
    });
    // Gravar nao segura a abertura, e falhar so custa baixar de novo na proxima.
    void Promise.resolve().then(() => copia.gravar(userId, proxima)).catch(() => {});

    return { data: linhas, error: null };
};

// ---------------------------------------------------------------------------
// A copia no celular: IndexedDB, uma entrada por conta. O localStorage nao
// serve — sao ~30 KB por ciclo, e ele para em uns 5 MB divididos com o resto.
// ---------------------------------------------------------------------------

const BANCO = 'glyph-copia';
const LOJA = 'relatorios-fechados';
const chave = (userId: string) => `v1:${userId}`;

const comPrazo = <T,>(promessa: Promise<T>, ms: number) => new Promise<T>((resolver, rejeitar) => {
    const relogio = setTimeout(() => rejeitar(new Error('IndexedDB demorou')), ms);
    promessa.then(
        (valor) => { clearTimeout(relogio); resolver(valor); },
        (erro) => { clearTimeout(relogio); rejeitar(erro); },
    );
});

const abrir = () => new Promise<IDBDatabase>((resolver, rejeitar) => {
    if (typeof indexedDB === 'undefined') {
        rejeitar(new Error('sem IndexedDB'));
        return;
    }
    const pedido = indexedDB.open(BANCO, 1);
    pedido.onupgradeneeded = () => {
        if (!pedido.result.objectStoreNames.contains(LOJA)) pedido.result.createObjectStore(LOJA);
    };
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rejeitar(pedido.error);
    pedido.onblocked = () => rejeitar(new Error('IndexedDB bloqueado'));
});

export const copiaNoCelular: CopiaDosRelatorios = {
    ler: (userId) => comPrazo(abrir().then((banco) => new Promise<Guardados | null>((resolver, rejeitar) => {
        const pedido = banco.transaction(LOJA, 'readonly').objectStore(LOJA).get(chave(userId));
        pedido.onsuccess = () => { banco.close(); resolver((pedido.result as Guardados) ?? null); };
        pedido.onerror = () => { banco.close(); rejeitar(pedido.error); };
    })), 2000),
    gravar: (userId, guardados) => comPrazo(abrir().then((banco) => new Promise<void>((resolver, rejeitar) => {
        const transacao = banco.transaction(LOJA, 'readwrite');
        transacao.objectStore(LOJA).put(guardados, chave(userId));
        transacao.oncomplete = () => { banco.close(); resolver(); };
        transacao.onerror = () => { banco.close(); rejeitar(transacao.error); };
        transacao.onabort = () => { banco.close(); rejeitar(transacao.error); };
    })), 5000),
};
