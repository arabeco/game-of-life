import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClockIcon, LightbulbIcon, MoonIcon, PlusIcon, SparklesIcon, TrophyIcon } from './Icons';
import { MOODS_DATA } from '../constants';
import { cabecalhoDeHoje, JOURNAL_MAX_CARACTERES, JOURNAL_MAX_PAGINAS, lerPaginaOuFalha, listarPaginas, salvarPagina, type ResumoDePagina } from '../services/JournalService';
import { TAGS_DO_DIARIO, lerEntradas, periodoDaPagina, type TagDoDiario } from '../utils/diario';
import { LeitorDoDiario } from './LeitorDoDiario';


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
 * em cartoes — a faixa na cor do humor, o simbolo da tag, a data e o texto —,
 * a mais nova em cima. "Editar" abre o texto cru, como era. O filtro de tag vale para a
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

// O simbolo de cada tag, na cor do humor da entrada.
const ICONE_DA_TAG: Record<TagDoDiario, React.FC<{ className?: string }>> = {
    Ideia: LightbulbIcon,
    'Reflexão': MoonIcon,
    'Gratidão': SparklesIcon,
    Conquista: TrophyIcon,
    Lembrete: ClockIcon,
};

const JournalTab: React.FC<{ userId: string }> = ({ userId }) => {
    const [paginas, setPaginas] = useState<ResumoDePagina[]>([]);
    const [carregandoIndice, setCarregandoIndice] = useState(true);
    const [aberta, setAberta] = useState<number | null>(null);
    const [editando, setEditando] = useState(false);
    const [lendo, setLendo] = useState(false);
    const [filtro, setFiltro] = useState<TagDoDiario | null>(null);
    const [texto, setTexto] = useState('');
    const [carregandoPagina, setCarregandoPagina] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [salvoEm, setSalvoEm] = useState<string | null>(null);
    // Sem rede (18/10, teste do Luigi): avisa em vez de abrir em branco ou perder o texto.
    const [semRede, setSemRede] = useState<string | null>(null);
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
        setSemRede(null);
        const conteudo = await lerPaginaOuFalha(userId, numero);
        if (conteudo === null) {
            // Abrir em branco e salvar depois apagaria o que nao foi lido.
            setAberta(null);
            setCarregandoPagina(false);
            setSemRede('Sem internet: não consegui abrir a página.');
            return;
        }
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

    /** true quando nao ha o que salvar ou salvou; false quando a rede falhou. */
    const salvar = async (): Promise<boolean> => {
        if (aberta === null || texto === textoOriginalRef.current) return true;
        setSalvando(true);
        const ok = await salvarPagina(userId, aberta, texto);
        setSalvando(false);
        if (!ok) {
            setSemRede('Sem internet: não salvei. O texto continua aqui.');
            return false;
        }
        setSemRede(null);
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
                periodo: periodoDaPagina(texto),
            };
            const existe = anteriores.some((p) => p.pageNumber === aberta);
            const proximas = existe
                ? anteriores.map((p) => (p.pageNumber === aberta ? resumo : p))
                : [...anteriores, resumo];
            return proximas.sort((a, b) => a.pageNumber - b.pageNumber);
        });
        return true;
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
        <div className="flex gap-1" role="group" aria-label="Filtrar por tag">
            {TAGS_DO_DIARIO.map((tag) => (
                <button
                    key={tag}
                    type="button"
                    aria-pressed={filtro === tag}
                    onClick={() => setFiltro((atual) => (atual === tag ? null : tag))}
                    className={`min-w-0 flex-auto truncate border px-1.5 py-1 text-center text-[11px] font-semibold transition-colors ${
                        filtro === tag
                            ? 'border-[#b89252]/70 bg-[#b89252]/15 text-[#f1d595]'
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
                {semRede && <p role="alert" className="text-[11px] text-red-300/90">{semRede}</p>}
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
                                className="group relative flex w-full items-stretch gap-3 overflow-hidden border border-[#b89252]/20 bg-[linear-gradient(155deg,rgba(184,146,82,0.07),#0d0e11_58%,#08090b)] p-3 text-left transition-colors hover:border-[#b89252]/50"
                            >
                                <span className="min-w-0 flex-1 space-y-1">
                                    <span className="block truncate font-serif text-[14px] italic text-white/85">{pagina.previa || 'Página em branco'}</span>
                                    <span className="flex items-center gap-2">
                                        <span className="flex-shrink-0 text-[10px] tabular-nums tracking-[0.08em] text-white/35">
                                            {pagina.periodo || (pagina.updatedAt ? new Date(pagina.updatedAt).toLocaleDateString('pt-BR') : '')}
                                        </span>
                                        {pagina.humores.length > 0 && (
                                            <span className="flex min-w-0 items-center gap-1 overflow-hidden" aria-label={`${pagina.humores.length} humores`}>
                                                {pagina.humores.slice(-12).map((humor, indice) => <Bolinha key={indice} humor={humor} tamanho={7} />)}
                                            </span>
                                        )}
                                    </span>
                                </span>
                                <span className="flex-shrink-0 self-center text-[10px] tabular-nums tracking-[0.12em] text-white/30" aria-label={`Página ${pagina.pageNumber}`}>
                                    pág. {pagina.pageNumber}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="border border-dashed border-white/10 px-4 py-8 text-center font-serif text-sm italic text-white/40">
                            {filtro ? `Nenhuma página com ${filtro}.` : 'Nenhuma página ainda. O diário é seu: escreva como quiser.'}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    disabled={proximoNumero === null}
                    onClick={() => proximoNumero !== null && void abrirPagina(proximoNumero)}
                    className="flex w-full items-center justify-center gap-2 border border-[#b89252]/40 bg-[#b89252]/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#f1d595] transition-colors hover:bg-[#b89252]/20 hover:text-white disabled:opacity-40"
                >
                    <PlusIcon className="h-4 w-4" />
                    {proximoNumero === null ? 'Limite de páginas atingido' : 'Nova página (' + proximoNumero + ')'}
                </button>
            </div>
        );
    }

    const mudou = texto !== textoOriginalRef.current;
    const botaoPequeno = 'border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition-colors hover:border-[#b89252]/50 hover:text-[#f1d595]';

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={async () => { const salvou = await salvar(); if (!salvou) return; setAberta(null); setEditando(false); }} className={botaoPequeno}>
                    Voltar
                </button>
                <span className="font-serif text-[12px] italic text-white/45">
                    Página {aberta}
                    {salvando ? ' · salvando' : semRede ? ' · sem internet, não salvo' : salvoEm ? ' · salvo ' + salvoEm : mudou ? ' · não salvo' : ''}
                </span>
                {editando ? (
                    <button type="button" onClick={async () => { const salvou = await salvar(); if (!salvou) return; setEditando(false); }} disabled={!texto.trim()} className={`${botaoPequeno} disabled:opacity-40`}>
                        Pronto
                    </button>
                ) : (
                    <span className="flex gap-1.5">
                        {/* Ler em tela cheia (27/10/2026): o papel do leitor de aula, entrada por entrada. */}
                        {entradasVisiveis.length > 0 && (
                            <button type="button" onClick={() => setLendo(true)} disabled={carregandoPagina} className={botaoPequeno}>
                                Ler
                            </button>
                        )}
                        <button type="button" onClick={() => setEditando(true)} disabled={carregandoPagina} className={botaoPequeno}>
                            Editar
                        </button>
                    </span>
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
                        className="w-full resize-none border border-white/10 bg-black/25 px-4 py-3 font-serif text-[15px] leading-relaxed text-white/90 focus:border-[#b89252]/50 focus:outline-none"
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
                                        className="relative overflow-hidden border border-white/8 bg-[linear-gradient(90deg,rgba(255,255,255,0.045),#0f1013e0_44%)] px-4 py-3"
                                        style={cor ? { boxShadow: `inset 3px 0 0 ${cor}` } : undefined}
                                    >
                                        {(entrada.data || entrada.tag) && (() => {
                                            const Icone = entrada.tag ? ICONE_DA_TAG[entrada.tag] : null;
                                            return (
                                                <header className="mb-1.5 flex items-center gap-2">
                                                    {Icone && (
                                                        <span role="img" aria-label={entrada.tag || ''} title={entrada.tag || ''} className="text-[#d4b062]">
                                                            <Icone className="h-3.5 w-3.5" />
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                                                        {[entrada.data, entrada.humor].filter(Boolean).join(' · ')}
                                                    </span>
                                                </header>
                                            );
                                        })()}
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
            {lendo && !editando && (
                <LeitorDoDiario entradas={[...entradasVisiveis].reverse()} pagina={aberta} onFechar={() => setLendo(false)} />
            )}
        </div>
    );
};


export default JournalTab;
