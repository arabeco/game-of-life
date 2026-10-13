import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PlusIcon } from './Icons';
import { MOODS_DATA } from '../constants';
import { cabecalhoDeHoje, JOURNAL_MAX_CARACTERES, JOURNAL_MAX_PAGINAS, lerPagina, listarPaginas, salvarPagina, type ResumoDePagina } from '../services/JournalService';
import { TAGS_DO_DIARIO, lerEntradas, type TagDoDiario } from '../utils/diario';


/**
 * O DIARIO, E POR QUE ELE MORA AQUI DENTRO.
 *
 * Nada do journal passa pelo GameContext, e isso e a feature. Tudo o que o
 * contexto guarda, ele carrega na ABERTURA do app, para todo mundo — e um
 * diario e a unica coisa do app que so cresce. Quem nunca escreve pagaria
 * egress por texto que nunca leu.
 *
 * Aqui, nenhuma pagina existe em memoria antes de alguem pedir. Abrir a aba le
 * o INDICE (numero, data, 60 caracteres). Abrir uma pagina le UMA linha. Salvar
 * grava UMA linha. O teste `journal-egress` guarda essa separacao.
 *
 * A PAGINA SE LE, E SO DEPOIS SE EDITA (12/10/2026). Abrir mostra as entradas
 * em cartoes — a bolinha na cor do humor, a data, a tag e o texto —, a mais nova
 * em cima. "Editar" abre o texto cru, como era. O filtro de tag vale para a
 * lista de paginas e para as entradas da pagina aberta.
 */
const corDoHumor = (humor: string | null): string | null =>
    (humor && MOODS_DATA.find((mood) => mood.label === humor)?.trackEnd) || null;

const Bolinha: React.FC<{ humor: string | null; tamanho?: number }> = ({ humor, tamanho = 10 }) => {
    const cor = corDoHumor(humor);
    if (!cor) return null;
    return (
        <span
            role="img"
            aria-label={`Humor: ${humor}`}
            className="inline-block flex-shrink-0 rounded-full"
            style={{ width: tamanho, height: tamanho, background: cor, boxShadow: `0 0 8px ${cor}77` }}
        />
    );
};

const JournalTab: React.FC<{ userId: string }> = ({ userId }) => {
    const [paginas, setPaginas] = useState<ResumoDePagina[]>([]);
    const [carregandoIndice, setCarregandoIndice] = useState(true);
    const [aberta, setAberta] = useState<number | null>(null);
    const [editando, setEditando] = useState(false);
    const [filtro, setFiltro] = useState<TagDoDiario | null>(null);
    const [texto, setTexto] = useState('');
    const [carregandoPagina, setCarregandoPagina] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [salvoEm, setSalvoEm] = useState<string | null>(null);
    const textoOriginalRef = useRef('');

    useEffect(() => {
        if (!userId) { setCarregandoIndice(false); return; }
        let vivo = true;
        void (async () => {
            const lista = await listarPaginas(userId);
            if (vivo) { setPaginas(lista); setCarregandoIndice(false); }
        })();
        return () => { vivo = false; };
    }, [userId]);

    const abrirPagina = async (numero: number) => {
        setAberta(numero);
        setCarregandoPagina(true);
        setSalvoEm(null);
        const conteudo = await lerPagina(userId, numero);
        textoOriginalRef.current = conteudo;
        setTexto(conteudo);
        // Pagina em branco nao tem o que ler: ja abre escrevendo.
        setEditando(!conteudo.trim());
        setCarregandoPagina(false);
    };

    // O proximo numero livre. Nao reaproveita buraco: pagina apagada fica
    // apagada, e a numeracao continua sendo a ordem em que se escreveu.
    const proximoNumero = (() => {
        const usados = new Set(paginas.map((p) => p.pageNumber));
        for (let n = 1; n <= JOURNAL_MAX_PAGINAS; n += 1) if (!usados.has(n)) return n;
        return null;
    })();

    const salvar = async () => {
        if (aberta === null || texto === textoOriginalRef.current) return;
        setSalvando(true);
        const ok = await salvarPagina(userId, aberta, texto);
        setSalvando(false);
        if (!ok) return;
        textoOriginalRef.current = texto;
        setSalvoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        setPaginas((anteriores) => {
            const entradas = lerEntradas(texto);
            const ultima = entradas.length ? entradas[entradas.length - 1].texto : texto;
            const resumo = {
                pageNumber: aberta,
                previa: ultima.slice(0, 60).replace(/\s+/g, ' ').trim(),
                updatedAt: new Date().toISOString(),
                humores: entradas.map((e) => e.humor).filter((h): h is string => Boolean(h)),
                tags: Array.from(new Set(entradas.map((e) => e.tag).filter((t): t is TagDoDiario => Boolean(t)))),
            };
            const existe = anteriores.some((p) => p.pageNumber === aberta);
            const proximas = existe
                ? anteriores.map((p) => (p.pageNumber === aberta ? resumo : p))
                : [...anteriores, resumo];
            return proximas.sort((a, b) => a.pageNumber - b.pageNumber);
        });
    };

    const inserirDataDeHoje = () => {
        const cabecalho = cabecalhoDeHoje();
        if (texto.includes(cabecalho)) return;
        const separador = texto.trim() ? texto.replace(/\s+$/, '') + '\n\n--------------\n' : '';
        setTexto(separador + cabecalho + '\n');
    };

    const entradas = useMemo(() => lerEntradas(texto).reverse(), [texto]);
    const entradasVisiveis = filtro ? entradas.filter((e) => e.tag === filtro) : entradas;
    const paginasVisiveis = filtro ? paginas.filter((p) => p.tags.includes(filtro)) : paginas;

    const filtroDeTags = (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por tag">
            {TAGS_DO_DIARIO.map((tag) => (
                <button
                    key={tag}
                    type="button"
                    aria-pressed={filtro === tag}
                    onClick={() => setFiltro((atual) => (atual === tag ? null : tag))}
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                        filtro === tag
                            ? 'border-[var(--skin-accent-color)]/60 bg-[var(--skin-accent-color)]/15 text-white'
                            : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
                    }`}
                >
                    {tag}
                </button>
            ))}
        </div>
    );

    if (aberta === null) {
        return (
            <div className="space-y-3">
                {paginas.some((p) => p.tags.length > 0) && filtroDeTags}
                <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
                    {carregandoIndice ? (
                        <div className="px-4 py-8 text-center text-xs italic text-white/35">Abrindo o diário...</div>
                    ) : paginasVisiveis.length > 0 ? (
                        [...paginasVisiveis].reverse().map((pagina) => (
                            <button
                                key={pagina.pageNumber}
                                type="button"
                                onClick={() => void abrirPagina(pagina.pageNumber)}
                                className="group relative flex w-full items-stretch gap-3 overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] p-3 text-left transition-colors hover:border-[var(--skin-accent-color)]/35"
                            >
                                <span className="flex w-9 flex-shrink-0 flex-col items-center justify-center border-r border-white/8 pr-3">
                                    <span className="font-serif text-xl leading-none tabular-nums text-[var(--skin-accent-color)]">{pagina.pageNumber}</span>
                                    <span className="mt-1 text-[8px] uppercase tracking-[0.18em] text-white/30">pág</span>
                                </span>
                                <span className="min-w-0 flex-1 space-y-1">
                                    <span className="block truncate font-serif text-[14px] italic text-white/85">{pagina.previa || 'Página em branco'}</span>
                                    <span className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                                            {pagina.updatedAt ? new Date(pagina.updatedAt).toLocaleDateString('pt-BR') : ''}
                                        </span>
                                        {pagina.humores.length > 0 && (
                                            <span className="flex min-w-0 items-center gap-1 overflow-hidden" aria-label={`${pagina.humores.length} humores`}>
                                                {pagina.humores.slice(-12).map((humor, indice) => <Bolinha key={indice} humor={humor} tamanho={7} />)}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center font-serif text-sm italic text-white/40">
                            {filtro ? `Nenhuma página com ${filtro}.` : 'Nenhuma página ainda. O diário é seu: escreva como quiser.'}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    disabled={proximoNumero === null}
                    onClick={() => proximoNumero !== null && void abrirPagina(proximoNumero)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--skin-accent-color)]/25 bg-[var(--skin-accent-color)]/8 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/80 transition-colors hover:bg-[var(--skin-accent-color)]/15 hover:text-white disabled:opacity-40"
                >
                    <PlusIcon className="h-4 w-4" />
                    {proximoNumero === null ? 'Limite de páginas atingido' : 'Nova página (' + proximoNumero + ')'}
                </button>
            </div>
        );
    }

    const mudou = texto !== textoOriginalRef.current;
    const botaoPequeno = 'rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition-colors hover:text-white';

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => { void salvar(); setAberta(null); setEditando(false); }} className={botaoPequeno}>
                    Voltar
                </button>
                <span className="font-serif text-[12px] italic text-white/45">
                    Página {aberta}
                    {salvando ? ' · salvando' : salvoEm ? ' · salvo ' + salvoEm : mudou ? ' · não salvo' : ''}
                </span>
                {editando ? (
                    <button type="button" onClick={() => { void salvar(); setEditando(false); }} disabled={!texto.trim()} className={`${botaoPequeno} disabled:opacity-40`}>
                        Pronto
                    </button>
                ) : (
                    <button type="button" onClick={() => setEditando(true)} disabled={carregandoPagina} className={botaoPequeno}>
                        Editar
                    </button>
                )}
            </div>

            {editando ? (
                <>
                    <textarea
                        value={texto}
                        onChange={(event) => setTexto(event.target.value.slice(0, JOURNAL_MAX_CARACTERES))}
                        onBlur={() => void salvar()}
                        placeholder={carregandoPagina ? 'Abrindo...' : 'Escreva o que quiser.'}
                        disabled={carregandoPagina}
                        rows={12}
                        className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 font-serif text-[15px] leading-relaxed text-white/90 focus:border-[var(--skin-accent-color)]/40 focus:outline-none"
                    />
                    <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={inserirDataDeHoje} className={botaoPequeno}>
                            Data de hoje
                        </button>
                        <span className="text-[10px] tabular-nums text-white/28">
                            {texto.length}/{JOURNAL_MAX_CARACTERES}
                        </span>
                    </div>
                </>
            ) : (
                <>
                    {entradas.some((e) => e.tag) && filtroDeTags}
                    <div className="max-h-[24rem] space-y-2.5 overflow-y-auto pr-1">
                        {carregandoPagina ? (
                            <div className="px-4 py-8 text-center text-xs italic text-white/35">Abrindo...</div>
                        ) : entradasVisiveis.length > 0 ? (
                            entradasVisiveis.map((entrada, indice) => {
                                const cor = corDoHumor(entrada.humor);
                                return (
                                    <article
                                        key={indice}
                                        className="relative overflow-hidden rounded-2xl border border-white/8 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.012))] px-4 py-3"
                                        style={cor ? { boxShadow: `inset 3px 0 0 ${cor}` } : undefined}
                                    >
                                        {(entrada.data || entrada.tag) && (
                                            <header className="mb-1.5 flex items-center gap-2">
                                                <Bolinha humor={entrada.humor} />
                                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                                                    {[entrada.data, entrada.humor].filter(Boolean).join(' · ')}
                                                </span>
                                                {entrada.tag && (
                                                    <span className="ml-auto rounded-full border border-[var(--skin-accent-color)]/35 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--skin-accent-color)]">
                                                        {entrada.tag}
                                                    </span>
                                                )}
                                            </header>
                                        )}
                                        <p className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-white/88">{entrada.texto || '…'}</p>
                                    </article>
                                );
                            })
                        ) : (
                            <div className="px-4 py-8 text-center font-serif text-sm italic text-white/40">
                                {filtro ? `Nenhuma entrada com ${filtro} nesta página.` : 'Página em branco.'}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};


export default JournalTab;
