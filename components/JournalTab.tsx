import React, { useEffect, useRef, useState } from 'react';
import { PlusIcon } from './Icons';
import { cabecalhoDeHoje, JOURNAL_MAX_CARACTERES, JOURNAL_MAX_PAGINAS, lerPagina, listarPaginas, salvarPagina, type ResumoDePagina } from '../services/JournalService';


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
 */
const JournalTab: React.FC<{ userId: string }> = ({ userId }) => {
    const [paginas, setPaginas] = useState<ResumoDePagina[]>([]);
    const [carregandoIndice, setCarregandoIndice] = useState(true);
    const [aberta, setAberta] = useState<number | null>(null);
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
            const previa = texto.slice(0, 60).replace(/\s+/g, ' ').trim();
            const agora = new Date().toISOString();
            const existe = anteriores.some((p) => p.pageNumber === aberta);
            const proximas = existe
                ? anteriores.map((p) => (p.pageNumber === aberta ? { ...p, previa, updatedAt: agora } : p))
                : [...anteriores, { pageNumber: aberta, previa, updatedAt: agora }];
            return proximas.sort((a, b) => a.pageNumber - b.pageNumber);
        });
    };

    const inserirDataDeHoje = () => {
        const cabecalho = cabecalhoDeHoje();
        if (texto.includes(cabecalho)) return;
        const separador = texto.trim() ? texto.replace(/\s+$/, '') + '\n\n--------------\n' : '';
        setTexto(separador + cabecalho + '\n');
    };

    if (aberta === null) {
        return (
            <div className="space-y-3">
                <div className="max-h-[20rem] space-y-2 overflow-y-auto pr-1">
                    {carregandoIndice ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/18 px-4 py-6 text-center text-xs text-white/35">
                            Abrindo o diário...
                        </div>
                    ) : paginas.length > 0 ? (
                        paginas.map((pagina) => (
                            <button
                                key={pagina.pageNumber}
                                type="button"
                                onClick={() => void abrirPagina(pagina.pageNumber)}
                                className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-3 text-left transition-colors hover:border-white/18 hover:bg-black/30"
                            >
                                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-white/12 text-[11px] font-black tabular-nums text-white/60">
                                    {pagina.pageNumber}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm text-white/85">{pagina.previa || 'Página em branco'}</span>
                                    <span className="block text-[10px] uppercase tracking-[0.14em] text-white/35">
                                        {pagina.updatedAt ? new Date(pagina.updatedAt).toLocaleDateString('pt-BR') : ''}
                                    </span>
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/18 px-4 py-6 text-center text-xs text-white/35">
                            Nenhuma página ainda. O diário é seu: escreva como quiser.
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    disabled={proximoNumero === null}
                    onClick={() => proximoNumero !== null && void abrirPagina(proximoNumero)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition-colors hover:bg-black/35 hover:text-white disabled:opacity-40"
                >
                    <PlusIcon className="h-4 w-4" />
                    {proximoNumero === null ? 'Limite de páginas atingido' : 'Nova página (' + proximoNumero + ')'}
                </button>
            </div>
        );
    }

    const mudou = texto !== textoOriginalRef.current;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => { void salvar(); setAberta(null); }}
                    className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition-colors hover:text-white"
                >
                    Voltar
                </button>
                <span className="text-[10px] uppercase tracking-[0.14em] text-white/35">
                    Página {aberta}
                    {salvando ? ' · salvando' : salvoEm ? ' · salvo ' + salvoEm : mudou ? ' · não salvo' : ''}
                </span>
            </div>

            <textarea
                value={texto}
                onChange={(event) => setTexto(event.target.value.slice(0, JOURNAL_MAX_CARACTERES))}
                onBlur={() => void salvar()}
                placeholder={carregandoPagina ? 'Abrindo...' : 'Escreva o que quiser.'}
                disabled={carregandoPagina}
                rows={12}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-relaxed text-white/90 focus:border-[var(--skin-accent-color)]/40 focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={inserirDataDeHoje}
                    className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition-colors hover:text-white"
                >
                    Data de hoje
                </button>
                <span className="text-[10px] tabular-nums text-white/28">
                    {texto.length}/{JOURNAL_MAX_CARACTERES}
                </span>
            </div>
        </div>
    );
};


export default JournalTab;
